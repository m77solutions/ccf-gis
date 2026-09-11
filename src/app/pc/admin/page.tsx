import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PHASES } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="p-4 rounded"
      style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)" }}
    >
      <p className="text-2xl font-serif">{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
        {label}
      </p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pc/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (staffRow?.role !== "admin") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p style={{ color: "var(--ink-soft)" }}>
          This overview is only available to admin staff.
        </p>
      </main>
    );
  }

  const { data: sessions } = await supabase
    .from("checkin_sessions")
    .select(
      "id, phase, created_at, guests(full_name, unique_number, table_number), staff(full_name), discipleship_responses(dgroup_status, activity_tier, bible_language), letters_log(print_status, email_status, bounced), dgroup_registrations(joining_pc_group), prayer_requests(id)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const total = sessions?.length ?? 0;
  const phaseCounts = PHASES.map((p) => ({
    ...p,
    count: sessions?.filter((s) => s.phase === p.key).length ?? 0,
  }));

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v);

  const joinCount =
    sessions?.filter((s) => single(s.discipleship_responses)?.dgroup_status === "join").length ?? 0;
  const bouncedCount = sessions?.filter((s) => single(s.letters_log)?.bounced).length ?? 0;
  const unclaimedCount =
    sessions?.filter((s) => single(s.dgroup_registrations)?.joining_pc_group === false).length ?? 0;

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
        Admin
      </p>
      <h1 className="text-2xl font-serif mb-8">Welcome Center overview</h1>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total guests" value={total} />
        {phaseCounts.map((p) => (
          <StatCard key={p.key} label={p.label} value={p.count} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl">
        <StatCard label="Chose to join DGroup" value={joinCount} />
        <StatCard label="Bounced emails" value={bouncedCount} />
        <StatCard label="Unclaimed DGroup sign-ups" value={unclaimedCount} />
      </div>

      <h2 className="font-serif text-lg mb-3">All guests</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--rule)" }}>
              <th className="py-2 pr-4">Guest</th>
              <th className="py-2 pr-4">PC</th>
              <th className="py-2 pr-4">Phase</th>
              <th className="py-2 pr-4">DGroup</th>
              <th className="py-2 pr-4">Materials</th>
              <th className="py-2 pr-4">Prayer</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s) => {
              const guest = single(s.guests);
              const pc = single(s.staff);
              const discipleship = single(s.discipleship_responses);
              const letters = single(s.letters_log);
              const phaseInfo = PHASES.find((p) => p.key === s.phase);
              return (
                <tr key={s.id} className="border-b" style={{ borderColor: "var(--rule)" }}>
                  <td className="py-2 pr-4">
                    <Link href={`/pc/session/${s.id}`} className="underline">
                      {guest?.full_name || guest?.unique_number || "Guest"}
                    </Link>
                    <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                      {guest?.unique_number} · Table {guest?.table_number || "—"}
                    </div>
                  </td>
                  <td className="py-2 pr-4">{pc?.full_name || "—"}</td>
                  <td className="py-2 pr-4">{phaseInfo?.label}</td>
                  <td className="py-2 pr-4">{discipleship?.dgroup_status || "—"}</td>
                  <td className="py-2 pr-4">
                    {letters
                      ? `${letters.print_status} / ${letters.email_status}${letters.bounced ? " (bounced)" : ""}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {Array.isArray(s.prayer_requests) ? s.prayer_requests.length : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
