"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ActivityTier,
  BibleLanguage,
  DgroupMode,
  DgroupStatus,
  Gender,
  PlacementStatus,
  StaffRole,
} from "@/lib/types";

// ------------------------------------------------------------------
// PHASE 1 — PC starts a new guest check-in, gets a QR token back
// ------------------------------------------------------------------
export async function startCheckin(tableNumber: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  // Placeholder unique-number scheme — replace once the real badge/ID scheme is decided.
  const uniqueNumber = `G-${Date.now().toString().slice(-6)}`;

  const { data: guest, error: guestErr } = await supabase
    .from("guests")
    .insert({ unique_number: uniqueNumber, table_number: tableNumber })
    .select()
    .single();
  if (guestErr) throw guestErr;

  const { data: session, error: sessionErr } = await supabase
    .from("checkin_sessions")
    .insert({ guest_id: guest.id, pc_id: staffRow?.id ?? null, phase: "intake" })
    .select()
    .single();
  if (sessionErr) throw sessionErr;

  revalidatePath("/pc/dashboard");
  return { guest, session };
}

// ------------------------------------------------------------------
// Guest-facing helper — look up a session by its QR token.
// This is the ONLY way guest pages access data: no Supabase Auth session
// is ever issued to a guest device.
// ------------------------------------------------------------------
export async function getSessionByToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("checkin_sessions")
    .select("*, guests(*), discipleship_responses(*), dgroup_registrations(*)")
    .eq("qr_token", token)
    .single();
  if (error) return null;
  return data;
}

// ------------------------------------------------------------------
// PHASE 1 — Guest submits intake info on their own phone
// ------------------------------------------------------------------
export async function submitIntake(
  token: string,
  data: { full_name: string; phone: string; email: string; age: number | null; first_time: boolean }
) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id, guest_id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  await admin.from("guests").update(data).eq("id", session.guest_id);
  await admin
    .from("checkin_sessions")
    .update({ phase: "engagement", intake_submitted_at: new Date().toISOString() })
    .eq("id", session.id);

  revalidatePath(`/g/${token}`);
}

// ------------------------------------------------------------------
// PHASE 2 — Guest adds a prayer request (reopens session on their phone)
// ------------------------------------------------------------------
export async function submitPrayerRequest(token: string, requestText: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  await admin.from("prayer_requests").insert({
    session_id: session.id,
    request_text: requestText,
  });
  await admin.from("checkin_sessions").update({ phase: "selection" }).eq("id", session.id);

  revalidatePath(`/g/${token}/prayer`);
}

// Guest has nothing to share — move on to Phase 3 without logging a request.
export async function skipPrayerRequest(token: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  await admin.from("checkin_sessions").update({ phase: "selection" }).eq("id", session.id);

  revalidatePath(`/g/${token}/prayer`);
}

export async function advanceToSelection(sessionId: string) {
  const supabase = await createServerSupabase();
  await supabase.from("checkin_sessions").update({ phase: "selection" }).eq("id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}

// ------------------------------------------------------------------
// PHASE 3 — Guest self-selection + PC tier selection + confirm & lock
// ------------------------------------------------------------------
export async function submitGuestSelection(
  token: string,
  data: { dgroup_status: DgroupStatus; bible_language: BibleLanguage }
) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  await admin.from("discipleship_responses").upsert(
    { session_id: session.id, ...data },
    { onConflict: "session_id" }
  );

  revalidatePath(`/g/${token}/selection`);
}

export async function pcSetActivityTier(sessionId: string, tier: ActivityTier) {
  const supabase = await createServerSupabase();
  await supabase
    .from("discipleship_responses")
    .upsert({ session_id: sessionId, activity_tier: tier }, { onConflict: "session_id" });
  revalidatePath(`/pc/session/${sessionId}`);
}

export async function pcConfirmAndLock(sessionId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("discipleship_responses")
    .update({ verified_by_pc: true, locked_at: new Date().toISOString() })
    .eq("session_id", sessionId);
  await supabase.from("checkin_sessions").update({ phase: "materials" }).eq("id", sessionId);

  // Auto-create the letters_log row that Phase 4 tracks.
  await supabase.from("letters_log").upsert(
    { session_id: sessionId, print_status: "pending", email_status: "pending" },
    { onConflict: "session_id" }
  );

  revalidatePath(`/pc/session/${sessionId}`);
}

// ------------------------------------------------------------------
// PHASE 4 — Materials Delivery
// Print + email are external integrations (see README "Integrations to wire up").
// These actions record status transitions; wire the TODOs to your real
// print queue and email provider (e.g. Resend) when ready.
// ------------------------------------------------------------------
export async function verifyGuestEmail(sessionId: string, guestId: string, email: string) {
  const supabase = await createServerSupabase();

  const trimmed = email.trim();
  const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (!looksValid) throw new Error("That doesn't look like a valid email address.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: staffRow } = user
    ? await supabase.from("staff").select("id").eq("auth_user_id", user.id).single()
    : { data: null };

  await supabase.from("guests").update({ email: trimmed }).eq("id", guestId);
  await supabase.from("letters_log").upsert(
    {
      session_id: sessionId,
      email_verified_at: new Date().toISOString(),
      email_verified_by_staff_id: staffRow?.id ?? null,
      // Re-verifying (e.g. after a correction) should clear any prior bounce.
      bounced: false,
    },
    { onConflict: "session_id" }
  );

  revalidatePath(`/pc/session/${sessionId}`);
}

export async function triggerMaterialsDelivery(sessionId: string) {
  const supabase = await createServerSupabase();

  const { data: letters } = await supabase
    .from("letters_log")
    .select("email_verified_at")
    .eq("session_id", sessionId)
    .single();
  if (!letters?.email_verified_at) {
    throw new Error("Verify the guest's email address before printing/sending the kit.");
  }

  // TODO: call print queue API here.
  await supabase
    .from("letters_log")
    .update({ print_status: "printed", print_requested_at: new Date().toISOString(), printed_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  // TODO: call email provider here (e.g. Resend). Simulate success for now.
  await supabase
    .from("letters_log")
    .update({ email_status: "sent", email_sent_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  revalidatePath(`/pc/session/${sessionId}`);
}

export async function markEmailBounced(sessionId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("letters_log")
    .update({ email_status: "bounced", bounced: true })
    .eq("session_id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}

export async function correctGuestEmail(sessionId: string, guestId: string, email: string) {
  const supabase = await createServerSupabase();
  await supabase.from("guests").update({ email }).eq("id", guestId);
  await supabase
    .from("letters_log")
    .update({
      email_status: "pending",
      bounced: false,
      pc_notified_of_bounce: true,
      // Corrected address needs to go through verification again before resending.
      email_verified_at: null,
      email_verified_by_staff_id: null,
    })
    .eq("session_id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}

export async function markKitDelivered(sessionId: string, guestChoseJoinDgroup: boolean) {
  const supabase = await createServerSupabase();
  await supabase
    .from("letters_log")
    .update({ kit_assembled_at: new Date().toISOString(), kit_delivered_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  const nextPhase = guestChoseJoinDgroup ? "dgroup" : "complete";
  await supabase.from("checkin_sessions").update({ phase: nextPhase }).eq("id", sessionId);

  revalidatePath(`/pc/session/${sessionId}`);
}

// ------------------------------------------------------------------
// PHASE 5 — DGroup Registration
// ------------------------------------------------------------------
export async function submitDgroupRegistration(
  token: string,
  data: {
    facebook: string;
    gender: Gender;
    occupation: string;
    invited_by_name: string;
    life_stage: string;
    life_stage_other: string;
    schedule_pref: string;
    mode: DgroupMode;
    language: string;
  }
) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id, guest_id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  const { facebook, gender, ...regFields } = data;

  // Gender/Facebook belong to the guest record (not per-registration), matching
  // the intake table where the rest of the guest's identity already lives.
  await admin.from("guests").update({ gender, facebook }).eq("id", session.guest_id);

  await admin.from("dgroup_registrations").upsert(
    { session_id: session.id, ...regFields },
    { onConflict: "session_id" }
  );

  revalidatePath(`/g/${token}/dgroup`);
}

export async function routeDgroupToPc(sessionId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  await supabase
    .from("dgroup_registrations")
    .update({
      joining_pc_group: true,
      claimed_by_staff_id: staffRow?.id ?? null,
      routed_at: new Date().toISOString(),
      summary_printed_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);
  await supabase.from("checkin_sessions").update({ phase: "complete" }).eq("id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}

// PC doesn't have room in their own DGroup — release it so any other PC can claim it.
export async function releaseDgroupToPool(sessionId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("dgroup_registrations")
    .update({ joining_pc_group: false, claimed_by_staff_id: null, routed_at: null })
    .eq("session_id", sessionId);
  await supabase.from("checkin_sessions").update({ phase: "complete" }).eq("id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
  revalidatePath("/pc/dashboard");
}

// Any PC browsing the dashboard's unclaimed pool can pick this guest up for their own DGroup.
export async function claimDgroupRegistration(registrationId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  await supabase
    .from("dgroup_registrations")
    .update({
      joining_pc_group: true,
      claimed_by_staff_id: staffRow?.id ?? null,
      routed_at: new Date().toISOString(),
    })
    .eq("id", registrationId);
  revalidatePath("/pc/dashboard");
}

// ------------------------------------------------------------------
// ADMIN-ONLY — Miner assignment & placement pipeline
// Mirrors the "Harvests (Mined)" tracking sheet: a Registered Seeker gets
// assigned to a Miner, who works them through contact -> confirmation ->
// placement (or an unsuccessful outcome).
// ------------------------------------------------------------------
async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: requesterStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if (requesterStaff?.role !== "admin") {
    throw new Error("Only admins can manage the Miner/placement workflow.");
  }
  return supabase;
}

export async function assignMiner(registrationId: string, minerId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("dgroup_registrations")
    .update({
      miner_id: minerId,
      miner_assigned_at: new Date().toISOString(),
      placement_status: "awaiting_contact_confirmation" as PlacementStatus,
    })
    .eq("id", registrationId);
  if (error) throw error;

  revalidatePath("/pc/admin/miners");
  revalidatePath("/pc/admin/stats");
}

export async function unassignMiner(registrationId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("dgroup_registrations")
    .update({
      miner_id: null,
      miner_assigned_at: null,
      placement_status: "unassigned" as PlacementStatus,
    })
    .eq("id", registrationId);
  if (error) throw error;

  revalidatePath("/pc/admin/miners");
  revalidatePath("/pc/admin/stats");
}

export async function updatePlacementStatus(
  registrationId: string,
  status: PlacementStatus,
  notes?: string
) {
  const supabase = await requireAdmin();

  const now = new Date().toISOString();
  const timestampPatch: Record<string, string> = {};
  if (status === "contacted_awaiting_response") timestampPatch.miner_contacted_at = now;
  if (status === "awaiting_attendance_confirmation") timestampPatch.attendance_confirmed_at = now;
  if (["placed_miner", "placed_miner_dl", "placed_other_dl"].includes(status)) {
    timestampPatch.placed_at = now;
  }
  if (status === "unsuccessful") timestampPatch.unsuccessful_at = now;

  const { error } = await supabase
    .from("dgroup_registrations")
    .update({
      placement_status: status,
      ...timestampPatch,
      ...(notes !== undefined ? { placement_notes: notes } : {}),
    })
    .eq("id", registrationId);
  if (error) throw error;

  revalidatePath("/pc/admin/miners");
  revalidatePath("/pc/admin/stats");
}

// ------------------------------------------------------------------
// ADMIN — add a new Prayer Coach account (demo/onboarding helper).
// Creates both the Supabase Auth login and the linked staff row,
// and returns a one-time temporary password for the admin to share.
// ------------------------------------------------------------------
function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export async function addPrayerCoach(fullName: string, email: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: requesterStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if (requesterStaff?.role !== "admin") {
    throw new Error("Only admins can add Prayer Coach accounts.");
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createErr) throw createErr;

  const { error: staffErr } = await admin.from("staff").insert({
    auth_user_id: created.user.id,
    full_name: fullName,
    email,
    role: "pc",
  });
  if (staffErr) throw staffErr;

  revalidatePath("/pc/admin");
  return { email, tempPassword };
}

// Edit an existing staff member's details, role, or active status.
export async function updateStaffMember(
  staffId: string,
  data: { full_name: string; email: string; role: StaffRole; active: boolean }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: requesterStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if (requesterStaff?.role !== "admin") {
    throw new Error("Only admins can manage Prayer Coach accounts.");
  }

  const { error } = await supabase.from("staff").update(data).eq("id", staffId);
  if (error) throw error;

  revalidatePath("/pc/admin/coaches");
}

// ------------------------------------------------------------------
// AUTH — change password (logged in) & forgot-password reset request.
// Available to both PCs and admins — Supabase Auth doesn't distinguish;
// role only determines which app screens the account can reach.
// ------------------------------------------------------------------
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not signed in.");

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  // Re-verify the current password before allowing a change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error("Current password is incorrect.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;

  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const supabase = await createServerSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Always return success regardless of whether the email exists, so this
  // can't be used to enumerate staff accounts.
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${appUrl}/pc/reset-password`,
  });

  return { success: true };
}
