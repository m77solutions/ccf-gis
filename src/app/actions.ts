"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityTier, BibleLanguage, DgroupMode, DgroupStatus } from "@/lib/types";

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
    .select("*, guests(*), discipleship_responses(*)")
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
  data: { full_name: string; phone: string; email: string; first_time: boolean }
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
export async function triggerMaterialsDelivery(sessionId: string) {
  const supabase = await createServerSupabase();

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
    .update({ email_status: "pending", bounced: false, pc_notified_of_bounce: true })
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
    life_stage: string;
    schedule_pref: string;
    mode: DgroupMode;
    occupation: string;
    language: string;
  }
) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("checkin_sessions")
    .select("id")
    .eq("qr_token", token)
    .single();
  if (!session) throw new Error("Session not found.");

  await admin.from("dgroup_registrations").upsert(
    { session_id: session.id, ...data },
    { onConflict: "session_id" }
  );

  revalidatePath(`/g/${token}/dgroup`);
}

export async function routeDgroupToPc(sessionId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("dgroup_registrations")
    .update({ joining_pc_group: true, summary_printed_at: new Date().toISOString() })
    .eq("session_id", sessionId);
  await supabase.from("checkin_sessions").update({ phase: "complete" }).eq("id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}

export async function routeDgroupToLeader(sessionId: string, leaderId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("dgroup_registrations")
    .update({
      joining_pc_group: false,
      routed_leader_id: leaderId,
      routed_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);
  await supabase.from("checkin_sessions").update({ phase: "complete" }).eq("id", sessionId);
  revalidatePath(`/pc/session/${sessionId}`);
}
