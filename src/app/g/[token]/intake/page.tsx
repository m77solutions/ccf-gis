"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { submitIntake } from "@/app/actions";

export default function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    age: "",
    first_time: true,
  });

  return (
    <main className="flex-1 px-6 py-14 max-w-md mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--amber-deep)" }}>
        Welcome!
      </p>
      <h1 className="text-2xl font-serif mb-2">We&apos;re glad you&apos;re here</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        Tell us a bit about yourself so your host can get to know you.
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await submitIntake(token, {
              full_name: form.full_name,
              phone: form.phone,
              email: form.email,
              age: form.age ? parseInt(form.age, 10) : null,
              first_time: form.first_time,
            });
            router.push(`/g/${token}/prayer`);
          });
        }}
      >
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
            Name
          </label>
          <input
            required
            className="field"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
            Contact
          </label>
          <input
            required
            className="field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
            E-mail
          </label>
          <input
            type="email"
            required
            className="field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
            Age
          </label>
          <input
            type="number"
            min={0}
            max={120}
            className="field"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
          <input
            type="checkbox"
            checked={form.first_time}
            onChange={(e) => setForm({ ...form, first_time: e.target.checked })}
          />
          This is my first time visiting
        </label>

        <button type="submit" disabled={pending} className="btn-primary mt-4">
          {pending ? "Submitting…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
