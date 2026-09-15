"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword } from "@/app/actions";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword(currentPassword, newPassword);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
          Account
        </p>
        <h1 className="text-2xl font-serif mb-8">Change password</h1>

        {success ? (
          <>
            <p className="text-sm mb-6" style={{ color: "var(--teal-deep)" }}>
              Your password has been updated.
            </p>
            <button className="btn-secondary text-sm" onClick={() => router.back()}>
              ← Back
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
                Current password
              </label>
              <input
                type="password"
                required
                className="field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: "var(--rose-deep)" }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className="btn-primary mt-2">
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-xs mt-8" style={{ color: "var(--ink-soft)" }}>
          <Link href="/pc/dashboard" className="underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
