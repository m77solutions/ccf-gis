import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewCheckinButton from "@/components/NewCheckinButton";
import { ClaimButton } from "@/components/SessionControls";
import { PHASES } from "@/lib/types";
import { signOut } from "@/app/pc/login/actions";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("checkin_sessions")
    .select("id, phase, created_at, guests(unique_number, full_name, table_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Guests whose PC didn't have room in their own DGroup — open to any PC to claim.
  const { data: unclaimed } = await supabase
    .from("dgroup_registrations")
    .select(
      "id, life_stage, schedule_pref, mode, checkin_sessions(guests(full_name, unique_number, table_number))"
    )
    .eq("joining_pc_group", false)
    .is("claimed_by_staff_id", null)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: staffRow } = user
    ? await supabase.from("staff").select("role").eq("auth_user_id", user.id).single()
    : { data: null };
  const isAdmin = staffRow?.role === "admin";

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
            Welcome Center
          </p>
          <h1 className="text-2xl font-serif">Today&apos;s guests</h1>
        </div>
        <form action={signOut}>
          <button className="btn-secondary text-sm">Sign out</button>
        </form>
      </div>

      {isAdmin && (
        <div className="mb-8">
          <Link href="/pc/admin" className="text-sm underline" style={{ color: "var(--teal-deep)" }}>
            View admin overview →
          </Link>
        </div>
      )}

      <div className="mb-10">
        <NewCheckinButton />
      </div>

      {unclaimed && unclaimed.length > 0 && (
        <div className="mb-10">
          <h2 className="font-serif text-lg mb-3">Unclaimed DGroup sign-ups</h2>
          <ul className="flex flex-col gap-3">
            {unclaimed.map((reg) => {
              const session = Array.isArray(reg.checkin_sessions)
                ? reg.checkin_sessions[0]
                : reg.checkin_sessions;
              const guest = session && (Array.isArray(session.guests) ? session.guests[0] : session.guests);
              return (
                <li
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded text-sm"
                  style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)" }}
                >
                  <div>
                    <p className="font-medium">{guest?.full_name || "Guest"}</p>
                    <p style={{ color: "var(--ink-soft)" }}>
                      {reg.life_stage} · {reg.schedule_pref} · {reg.mode}
                    </p>
                  </div>
                  <ClaimButton registrationId={reg.id} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className="flex flex-col">
        {sessions?.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No guests checked in yet today.
          </p>
        )}
        {sessions?.map((s) => {
          const guest = Array.isArray(s.guests) ? s.guests[0] : s.guests;
          const phaseInfo = PHASES.find((p) => p.key === s.phase);
          return (
            <li key={s.id} className="border-b py-4" style={{ borderColor: "var(--rule)" }}>
              <Link
                href={`/pc/session/${s.id}`}
                className="flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium">
                    {guest?.full_name || "Guest not yet named"}{" "}
                    <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                      · {guest?.unique_number} · Table {guest?.table_number || "—"}
                    </span>
                  </p>
                </div>
                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  {phaseInfo?.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
