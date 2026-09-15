"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    // The recovery link's #access_token=...&type=recovery fragment is parsed
    // by the browser client automatically; this just confirms it landed us
    // in a valid (recovery) session before showing the form.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError(error.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/pc/login"), 2000);
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
          Welcome Center
        </p>
        <h1 className="text-2xl font-serif mb-8">Set a new password</h1>

        {!ready && (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Verifying your reset link…
          </p>
        )}

        {ready && success && (
          <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
            Password updated. Redirecting to sign in…
          </p>
        )}

        {ready && !success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                autoFocus
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
      </div>
    </main>
  );
}
