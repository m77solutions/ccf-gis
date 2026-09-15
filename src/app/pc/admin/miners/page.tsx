import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignMinerControl, PlacementStatusControl } from "@/components/MinerControls";
import { PLACEMENT_STATUSES, PLACED_STATUSES } from "@/lib/types";
import type { PlacementStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const RESOLVED_STATUSES: PlacementStatus[] = [...PLACED_STATUSES, "unsuccessful", "has_dgroup_not_via_wc"];

function statusLabel(status: PlacementStatus) {
  return PLACEMENT_STATUSES.find((s) => s.key === status)?.label ?? status;
}

function statusColor(status: PlacementStatus) {
  if (PLACED_STATUSES.includes(status)) return "var(--teal-deep)";
  if (status === "unsuccessful") return "var(--rose-deep)";
  if (status === "unassigned") return "var(--ink-soft)";
  return "var(--amber-deep)";
}

export default async function MinersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showAll = view === "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pc/login");

  const { data: requesterStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (requesterStaff?.role !== "admin") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p style={{ color: "var(--ink-soft)" }}>
          The Miner/placement workflow is only available to admin staff.
        </p>
      </main>
    );
  }

  const { data: activeStaff } = await supabase
    .from("staff")
    .select("id, full_name")
    .eq("active", true)
    .order("full_name", { ascending: true });

  const { data: registrations } = await supabase
    .from("dgroup_registrations")
    .select(
      "id, life_stage, occupation, invited_by_name, placement_status, placement_notes, miner_id, miner_assigned_at, created_at, staff!dgroup_registrations_miner_id_fkey(full_name), checkin_sessions(guests(full_name, unique_number, phone))"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v);

  const rows =
    registrations?.filter((r) => showAll || !RESOLVED_STATUSES.includes(r.placement_status as PlacementStatus)) ??
    [];

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
      <Link href="/pc/admin" className="text-sm underline" style={{ color: "var(--teal-deep)" }}>
        ← Admin overview
      </Link>
      <p className="text-sm mt-4 mb-1" style={{ color: "var(--amber-deep)" }}>
        Admin
      </p>
      <h1 className="text-2xl font-serif mb-2">Miner &amp; DGroup placement</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        Assign Registered Seekers to a Miner and track them through contact, confirmation, and placement.
      </p>

      <div className="flex gap-4 text-sm mb-6">
        <Link
          href="/pc/admin/miners"
          className="underline"
          style={{ color: !showAll ? "var(--teal-deep)" : "var(--ink-soft)" }}
        >
          Needs attention
        </Link>
        <Link
          href="/pc/admin/miners?view=all"
          className="underline"
          style={{ color: showAll ? "var(--teal-deep)" : "var(--ink-soft)" }}
        >
          All registrations
        </Link>
      </div>

      {rows.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {showAll ? "No DGroup registrations yet." : "Nothing needs attention right now 🎉"}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const session = single(r.checkin_sessions);
          const guest = session && single(session.guests);
          const miner = single(r.staff);
          const status = r.placement_status as PlacementStatus;
          return (
            <li
              key={r.id}
              className="p-4 rounded text-sm grid md:grid-cols-[1fr_auto] gap-4"
              style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)" }}
            >
              <div>
                <p className="font-medium">
                  {guest?.full_name || "Guest"}{" "}
                  <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    · {guest?.unique_number} · {guest?.phone}
                  </span>
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
                  {r.life_stage} · {r.occupation}
                  {r.invited_by_name ? ` · Invited by ${r.invited_by_name}` : ""}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
                  Registered {formatDateTime(r.created_at)}
                </p>
                <p className="text-xs mt-2 font-medium" style={{ color: statusColor(status) }}>
                  {statusLabel(status)}
                </p>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <AssignMinerControl
                  registrationId={r.id}
                  minerId={r.miner_id}
                  minerName={miner?.full_name ?? null}
                  miners={activeStaff ?? []}
                />
                {r.miner_id && (
                  <PlacementStatusControl
                    registrationId={r.id}
                    current={status}
                    notes={r.placement_notes}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
