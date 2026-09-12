"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminSignIn } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminSignIn(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/pc/admin");
      router.refresh();
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
          Welcome Center
        </p>
        <h1 className="text-2xl font-serif mb-8">Admin sign in</h1>

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
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
              Password
            </label>
            <input
              type="password"
              required
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--rose-deep)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-primary mt-2">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs mt-8" style={{ color: "var(--ink-soft)" }}>
          Prayer Coach?{" "}
          <Link href="/pc/login" className="underline">
            Sign in here instead
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
