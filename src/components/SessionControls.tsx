"use client";

import { useTransition, useState } from "react";
import {
  pcSetActivityTier,
  pcConfirmAndLock,
  triggerMaterialsDelivery,
  markEmailBounced,
  correctGuestEmail,
  markKitDelivered,
  routeDgroupToPc,
  routeDgroupToLeader,
} from "@/app/actions";
import type { ActivityTier } from "@/lib/types";

const TIERS: ActivityTier[] = ["pray", "care", "share"];

export function TierPicker({ sessionId, current }: { sessionId: string; current: ActivityTier | null }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      {TIERS.map((tier) => (
        <button
          key={tier}
          disabled={pending}
          onClick={() => startTransition(() => pcSetActivityTier(sessionId, tier))}
          className="btn-secondary capitalize"
          style={
            current === tier
              ? { background: "var(--teal)", color: "var(--paper)", borderColor: "var(--teal)" }
              : undefined
          }
        >
          {tier}
        </button>
      ))}
    </div>
  );
}

export function ConfirmLockButton({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={disabled || pending}
      onClick={() => startTransition(() => pcConfirmAndLock(sessionId))}
      className="btn-primary"
    >
      {pending ? "Locking…" : "Confirm & Lock"}
    </button>
  );
}

export function MaterialsButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => triggerMaterialsDelivery(sessionId))}
      className="btn-primary"
    >
      {pending ? "Sending…" : "Print letter & send email"}
    </button>
  );
}

export function BounceControls({
  sessionId,
  guestId,
  bounced,
}: {
  sessionId: string;
  guestId: string;
  bounced: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  if (!bounced) {
    return (
      <button
        className="text-sm underline"
        style={{ color: "var(--rose-deep)" }}
        onClick={() => startTransition(() => markEmailBounced(sessionId))}
      >
        Mark email as bounced
      </button>
    );
  }

  return (
    <div className="flex items-end gap-2 mt-2">
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--rose-deep)" }}>
          Email bounced — correct it
        </label>
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="corrected@email.com" />
      </div>
      <button
        disabled={pending || !email}
        className="btn-secondary"
        onClick={() => startTransition(() => correctGuestEmail(sessionId, guestId, email))}
      >
        Resend
      </button>
    </div>
  );
}

export function KitDeliveredButton({
  sessionId,
  guestChoseJoinDgroup,
}: {
  sessionId: string;
  guestChoseJoinDgroup: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => markKitDelivered(sessionId, guestChoseJoinDgroup))}
      className="btn-primary"
    >
      {pending ? "Saving…" : "Kit delivered to guest"}
    </button>
  );
}

export function DgroupRouting({
  sessionId,
  leaders,
}: {
  sessionId: string;
  leaders: { id: string; group_name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [leaderId, setLeaderId] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <button
        disabled={pending}
        className="btn-primary self-start"
        onClick={() => startTransition(() => routeDgroupToPc(sessionId))}
      >
        Add to my own DGroup
      </button>
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
            Or route to another leader
          </label>
          <select className="field" value={leaderId} onChange={(e) => setLeaderId(e.target.value)}>
            <option value="">Select leader…</option>
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.group_name}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={pending || !leaderId}
          className="btn-secondary"
          onClick={() => startTransition(() => routeDgroupToLeader(sessionId, leaderId))}
        >
          Route
        </button>
      </div>
    </div>
  );
}
