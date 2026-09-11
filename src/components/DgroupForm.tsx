"use client";

import { useState, useTransition } from "react";
import { submitDgroupRegistration } from "@/app/actions";
import type { DgroupMode } from "@/lib/types";

export default function DgroupForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    life_stage: "",
    schedule_pref: "",
    mode: "in_person" as DgroupMode,
    occupation: "",
    language: "",
  });

  if (submitted) {
    return (
      <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
        Thanks! Hand your phone back to your host.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await submitDgroupRegistration(token, form);
          setSubmitted(true);
        });
      }}
    >
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Life stage
        </label>
        <input
          required
          className="field"
          placeholder="e.g. Young Professional, Parent, Retiree"
          value={form.life_stage}
          onChange={(e) => setForm({ ...form, life_stage: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Preferred schedule
        </label>
        <input
          required
          className="field"
          placeholder="e.g. Weekday evenings"
          value={form.schedule_pref}
          onChange={(e) => setForm({ ...form, schedule_pref: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Mode
        </label>
        <select
          className="field"
          value={form.mode}
          onChange={(e) => setForm({ ...form, mode: e.target.value as DgroupMode })}
        >
          <option value="in_person">In-person</option>
          <option value="online">Online</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Occupation
        </label>
        <input
          className="field"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Preferred language
        </label>
        <input
          className="field"
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
