"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "./actions";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(params.get("next") || "/pc/dashboard");
      router.refresh();
    });
  }

  return (
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
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
          Welcome Center
        </p>
        <h1 className="text-2xl font-serif mb-8">PC sign in</h1>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-xs mt-8" style={{ color: "var(--ink-soft)" }}>
          Accounts are created by an admin in Supabase Auth, then linked to a{" "}
          <code>staff</code> row. See README.
        </p>
      </div>
    </main>
  );
}
