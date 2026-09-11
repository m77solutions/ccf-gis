import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewCheckinButton from "@/components/NewCheckinButton";
import { PHASES } from "@/lib/types";
import { signOut } from "@/app/pc/login/actions";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("checkin_sessions")
    .select("id, phase, created_at, guests(unique_number, full_name, table_number)")
    .order("created_at", { ascending: false })
    .limit(50);

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

      <div className="mb-10">
        <NewCheckinButton />
      </div>

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
