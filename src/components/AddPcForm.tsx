"use client";

import { useState, useTransition } from "react";
import { addPrayerCoach } from "@/app/actions";

export default function AddPcForm() {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  if (created) {
    return (
      <div
        className="p-4 rounded text-sm flex flex-col gap-2"
        style={{ background: "var(--paper-raised)", border: "1px solid var(--teal)" }}
      >
        <p style={{ color: "var(--teal-deep)" }}>
          Account created. Share these login details with them:
        </p>
        <p>
          Email: <span className="font-medium">{created.email}</span>
        </p>
        <p>
          Temporary password: <span className="font-medium">{created.tempPassword}</span>
        </p>
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          They can sign in at /pc/login with these — there&apos;s no forced password change yet,
          so let them know to treat it as a shared demo login for now.
        </p>
        <button
          className="btn-secondary self-start mt-2"
          onClick={() => {
            setCreated(null);
            setFullName("");
            setEmail("");
          }}
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            const result = await addPrayerCoach(fullName, email);
            setCreated(result);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Full name
        </label>
        <input
          required
          className="field"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
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
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--rose-deep)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Creating…" : "Add Prayer Coach"}
      </button>
    </form>
  );
}
