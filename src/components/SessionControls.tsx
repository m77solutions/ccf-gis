"use client";

import { useTransition, useState } from "react";
import {
  pcSetActivityTier,
  pcConfirmAndLock,
  triggerMaterialsDelivery,
  markEmailBounced,
  correctGuestEmail,
  verifyGuestEmail,
  markKitDelivered,
  routeDgroupToPc,
  releaseDgroupToPool,
  claimDgroupRegistration,
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

export function EmailVerification({
  sessionId,
  guestId,
  currentEmail,
  verifiedAt,
}: {
  sessionId: string;
  guestId: string;
  currentEmail: string | null;
  verifiedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(currentEmail ?? "");
  const [error, setError] = useState<string | null>(null);

  if (verifiedAt) {
    return (
      <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
        ✓ Email verified — {currentEmail}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm" style={{ color: "var(--ink-soft)" }}>
        Confirm the guest&apos;s email before sending
      </label>
      <div className="flex items-end gap-2">
        <input
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="guest@email.com"
        />
        <button
          disabled={pending || !email.trim()}
          className="btn-secondary"
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await verifyGuestEmail(sessionId, guestId, email);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong.");
              }
            })
          }
        >
          {pending ? "Verifying…" : "Verify email"}
        </button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--rose-deep)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function MaterialsButton({ sessionId, disabled }: { sessionId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={pending || disabled}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await triggerMaterialsDelivery(sessionId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Something went wrong.");
            }
          })
        }
        className="btn-primary self-start"
      >
        {pending ? "Sending…" : "Print letter & send email"}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "var(--rose-deep)" }}>
          {error}
        </p>
      )}
    </div>
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

export function DgroupRouting({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <button
        disabled={pending}
        className="btn-primary self-start"
        onClick={() => startTransition(() => routeDgroupToPc(sessionId))}
      >
        Add to my own DGroup
      </button>
      <div>
        <button
          disabled={pending}
          className="btn-secondary self-start"
          onClick={() => startTransition(() => releaseDgroupToPool(sessionId))}
        >
          No room in my group — release to other PCs
        </button>
        <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
          This guest&apos;s details will show up on every PC&apos;s dashboard until someone claims them.
        </p>
      </div>
    </div>
  );
}
export function ClaimButton({ registrationId }: { registrationId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      className="btn-secondary"
      onClick={() => startTransition(() => claimDgroupRegistration(registrationId))}
    >
      {pending ? "Adding…" : "Add to my DGroup"}
    </button>
  );
}
