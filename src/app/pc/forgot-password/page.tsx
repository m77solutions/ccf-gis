"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestPasswordReset(email);
      setSent(true);
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
          Welcome Center
        </p>
        <h1 className="text-2xl font-serif mb-8">Reset your password</h1>

        {sent ? (
          <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
            If an account exists for that email, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
                Email
              </label>
              <input
                type="email"
                required
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" disabled={pending} className="btn-primary mt-2">
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-xs mt-8" style={{ color: "var(--ink-soft)" }}>
          <Link href="/pc/login" className="underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
