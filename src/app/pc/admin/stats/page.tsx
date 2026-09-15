import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLACED_STATUSES } from "@/lib/types";
import type { PlacementStatus } from "@/lib/types";

function monthKey(iso: string) {
  // Bucket by calendar month in Asia/Manila, e.g. "2026-01"
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

interface MonthBucket {
  key: string;
  welcomed: number;
  withoutDgrp: number;
  indicated: number;
  registered: number;
  mined: number;
  placed: number;
  unsuccessful: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded" style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)" }}>
      <p className="text-2xl font-serif">{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
        {label}
      </p>
    </div>
  );
}

export default async function StatsPage() {
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
        <p style={{ color: "var(--ink-soft)" }}>This report is only available to admin staff.</p>
      </main>
    );
  }

  const { data: sessions } = await supabase
    .from("checkin_sessions")
    .select("id, created_at, discipleship_responses(dgroup_status)")
    .limit(10000);

  const { data: registrations } = await supabase
    .from("dgroup_registrations")
    .select("id, created_at, miner_id, placement_status")
    .limit(10000);

  const single = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v);

  const buckets = new Map<string, MonthBucket>();
  function getBucket(key: string) {
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        welcomed: 0,
        withoutDgrp: 0,
        indicated: 0,
        registered: 0,
        mined: 0,
        placed: 0,
        unsuccessful: 0,
      });
    }
    return buckets.get(key)!;
  }

  for (const s of sessions ?? []) {
    const key = monthKey(s.created_at);
    const b = getBucket(key);
    b.welcomed += 1;
    const status = single(s.discipleship_responses)?.dgroup_status;
    if (status !== "has_dgroup") b.withoutDgrp += 1;
    if (status === "join") b.indicated += 1;
  }

  for (const r of registrations ?? []) {
    const key = monthKey(r.created_at);
    const b = getBucket(key);
    b.registered += 1;
    if (r.miner_id) b.mined += 1;
    if (PLACED_STATUSES.includes(r.placement_status as PlacementStatus)) b.placed += 1;
    if (r.placement_status === "unsuccessful") b.unsuccessful += 1;
  }

  const months = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));

  const totals = months.reduce(
    (acc, m) => ({
      welcomed: acc.welcomed + m.welcomed,
      withoutDgrp: acc.withoutDgrp + m.withoutDgrp,
      indicated: acc.indicated + m.indicated,
      registered: acc.registered + m.registered,
      mined: acc.mined + m.mined,
      placed: acc.placed + m.placed,
      unsuccessful: acc.unsuccessful + m.unsuccessful,
    }),
    { welcomed: 0, withoutDgrp: 0, indicated: 0, registered: 0, mined: 0, placed: 0, unsuccessful: 0 }
  );

  const metricRows: { label: string; get: (m: MonthBucket) => number; isPct?: boolean; pctOf?: (m: MonthBucket) => number }[] = [
    { label: "Guests Welcomed", get: (m) => m.welcomed },
    { label: "Guests w/o dgrp", get: (m) => m.withoutDgrp },
    { label: "Indicated to join Dgrp", get: (m) => m.indicated },
    { label: "Registered Seekers", get: (m) => m.registered },
    { label: "Seekers Mined", get: (m) => m.mined },
    { label: "Seekers Placed", get: (m) => m.placed },
    { label: "Unsuccessful Placement", get: (m) => m.unsuccessful },
  ];

  return (
    <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
      <Link href="/pc/admin" className="text-sm underline" style={{ color: "var(--teal-deep)" }}>
        ← Admin overview
      </Link>
      <p className="text-sm mt-4 mb-1" style={{ color: "var(--amber-deep)" }}>
        Admin
      </p>
      <h1 className="text-2xl font-serif mb-2">DGroup placement funnel</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        Welcomed → Indicated → Registered → Mined → Placed, all-time and by month.
      </p>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Guests Welcomed" value={totals.welcomed} />
        <StatCard label="Guests w/o dgrp" value={totals.withoutDgrp} />
        <StatCard label="Indicated to join" value={totals.indicated} />
        <StatCard label="Registered Seekers" value={totals.registered} />
        <StatCard label="Seekers Mined" value={totals.mined} />
        <StatCard label="Seekers Placed" value={totals.placed} />
        <StatCard label="Unsuccessful" value={totals.unsuccessful} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl">
        <StatCard label="% Registered vs Welcomed w/o dgrp" value={pct(totals.registered, totals.withoutDgrp)} />
        <StatCard label="% Mined vs Registered" value={pct(totals.mined, totals.registered)} />
        <StatCard label="% Placed vs Mined" value={pct(totals.placed, totals.mined)} />
        <StatCard label="% Placed vs Registered" value={pct(totals.placed, totals.registered)} />
      </div>

      <div className="mb-4">
        <Link href="/pc/admin/miners" className="text-sm underline" style={{ color: "var(--teal-deep)" }}>
          Go to Miner &amp; placement workflow →
        </Link>
      </div>

      <h2 className="font-serif text-lg mb-3">By month</h2>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--rule)" }}>
              <th className="py-2 pr-6 sticky left-0" style={{ background: "var(--paper)" }}>
                Metric
              </th>
              {months.map((m) => (
                <th key={m.key} className="py-2 px-3 text-right whitespace-nowrap">
                  {monthLabel(m.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricRows.map((row) => (
              <tr key={row.label} className="border-b" style={{ borderColor: "var(--rule)" }}>
                <td className="py-2 pr-6 sticky left-0" style={{ background: "var(--paper)" }}>
                  {row.label}
                </td>
                {months.map((m) => (
                  <td key={m.key} className="py-2 px-3 text-right">
                    {row.get(m)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
              <td className="py-2 pr-6 sticky left-0 font-medium" style={{ background: "var(--paper)" }}>
                % Registered vs Welcomed w/o dgrp
              </td>
              {months.map((m) => (
                <td key={m.key} className="py-2 px-3 text-right">
                  {pct(m.registered, m.withoutDgrp)}
                </td>
              ))}
            </tr>
            <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
              <td className="py-2 pr-6 sticky left-0 font-medium" style={{ background: "var(--paper)" }}>
                % Mined vs Registered
              </td>
              {months.map((m) => (
                <td key={m.key} className="py-2 px-3 text-right">
                  {pct(m.mined, m.registered)}
                </td>
              ))}
            </tr>
            <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
              <td className="py-2 pr-6 sticky left-0 font-medium" style={{ background: "var(--paper)" }}>
                % Placed vs Mined
              </td>
              {months.map((m) => (
                <td key={m.key} className="py-2 px-3 text-right">
                  {pct(m.placed, m.mined)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-6 sticky left-0 font-medium" style={{ background: "var(--paper)" }}>
                % Placed vs Registered
              </td>
              {months.map((m) => (
                <td key={m.key} className="py-2 px-3 text-right">
                  {pct(m.placed, m.registered)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
