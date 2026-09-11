import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import PhaseRail from "@/components/PhaseRail";
import {
  TierPicker,
  ConfirmLockButton,
  MaterialsButton,
  BounceControls,
  KitDeliveredButton,
  DgroupRouting,
} from "@/components/SessionControls";
import type { Phase } from "@/lib/types";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("checkin_sessions")
    .select(
      "*, guests(*), discipleship_responses(*), letters_log(*), prayer_requests(*), dgroup_registrations(*)"
    )
    .eq("id", sessionId)
    .single();

  if (!session) {
    return <main className="p-10">Session not found.</main>;
  }

  const guest = session.guests;
  const discipleship = session.discipleship_responses;
  const letters = session.letters_log;
  const dgroupReg = session.dgroup_registrations;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const guestUrl = `${appUrl}/g/${session.qr_token}`;
  const qrDataUrl = await QRCode.toDataURL(guestUrl, { margin: 1, width: 240 });

  return (
    <main className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
        {guest?.unique_number} · Table {guest?.table_number || "—"}
      </p>
      <h1 className="text-2xl font-serif mb-10">
        {guest?.full_name || "Guest not yet named"}
      </h1>

      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        <aside>
          <PhaseRail current={session.phase as Phase} />
        </aside>

        <div className="flex flex-col gap-10 max-w-xl">
          {/* QR always visible — guest re-scans same link for every remaining phase */}
          <section>
            <h2 className="font-serif text-lg mb-3">Guest link</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code for guest session" width={160} height={160} />
            <a
              href={guestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-2 break-all underline block"
              style={{ color: "var(--teal-deep)" }}
            >
              {guestUrl}
            </a>
          </section>

          {/* Phase 2 — prayer summary, read-only */}
          {session.prayer_requests?.length > 0 && (
            <section>
              <h2 className="font-serif text-lg mb-3">Prayer requests</h2>
              <ul className="flex flex-col gap-2">
                {session.prayer_requests.map((p: { id: string; request_text: string }) => (
                  <li
                    key={p.id}
                    className="text-sm p-3 rounded"
                    style={{ background: "var(--paper-raised)", border: "1px solid var(--rule)" }}
                  >
                    {p.request_text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Phase 3 — self-selection */}
          {session.phase === "selection" && (
            <section>
              <h2 className="font-serif text-lg mb-3">Guest self-selection</h2>
              <div className="text-sm mb-4 flex flex-col gap-1" style={{ color: "var(--ink-soft)" }}>
                <p>
                  DGroup response:{" "}
                  <span style={{ color: "var(--ink)" }}>
                    {discipleship?.dgroup_status ?? "Waiting for guest…"}
                  </span>
                </p>
                <p>
                  Bible language:{" "}
                  <span style={{ color: "var(--ink)" }}>
                    {discipleship?.bible_language ?? "Waiting for guest…"}
                  </span>
                </p>
              </div>

              <p className="text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
                Activity tier (PC selects)
              </p>
              <TierPicker sessionId={session.id} current={discipleship?.activity_tier ?? null} />

              <div className="mt-6">
                <ConfirmLockButton
                  sessionId={session.id}
                  disabled={!discipleship?.dgroup_status || !discipleship?.activity_tier}
                />
              </div>
            </section>
          )}

          {/* Phase 4 — materials */}
          {session.phase === "materials" && (
            <section>
              <h2 className="font-serif text-lg mb-3">Materials delivery</h2>
              <div className="text-sm mb-4 flex flex-col gap-1" style={{ color: "var(--ink-soft)" }}>
                <p>Print: <span style={{ color: "var(--ink)" }}>{letters?.print_status ?? "pending"}</span></p>
                <p>Email: <span style={{ color: "var(--ink)" }}>{letters?.email_status ?? "pending"}</span></p>
              </div>

              {letters?.email_status === "pending" && letters?.print_status === "pending" && (
                <MaterialsButton sessionId={session.id} />
              )}

              {letters?.email_status === "sent" && !letters?.bounced && (
                <BounceControls sessionId={session.id} guestId={guest.id} bounced={false} />
              )}
              {letters?.bounced && (
                <BounceControls sessionId={session.id} guestId={guest.id} bounced={true} />
              )}

              <div className="mt-6">
                <KitDeliveredButton
                  sessionId={session.id}
                  guestChoseJoinDgroup={discipleship?.dgroup_status === "join"}
                />
              </div>
            </section>
          )}

          {/* Phase 5 — dgroup routing */}
          {session.phase === "dgroup" && (
            <section>
              <h2 className="font-serif text-lg mb-3">DGroup registration</h2>
              {dgroupReg ? (
                <>
                  <div className="text-sm mb-4 grid grid-cols-2 gap-y-1" style={{ color: "var(--ink-soft)" }}>
                    <span>Life stage</span><span style={{ color: "var(--ink)" }}>{dgroupReg.life_stage}</span>
                    <span>Schedule</span><span style={{ color: "var(--ink)" }}>{dgroupReg.schedule_pref}</span>
                    <span>Mode</span><span style={{ color: "var(--ink)" }}>{dgroupReg.mode}</span>
                    <span>Occupation</span><span style={{ color: "var(--ink)" }}>{dgroupReg.occupation}</span>
                    <span>Language</span><span style={{ color: "var(--ink)" }}>{dgroupReg.language}</span>
                  </div>
                  <DgroupRouting sessionId={session.id} />
                </>
              ) : (
                <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  Waiting for guest to fill out DGroup registration…
                </p>
              )}
            </section>
          )}

          {session.phase === "complete" && (
            <section>
              <h2 className="font-serif text-lg mb-3">Guest journey complete 🎉</h2>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
