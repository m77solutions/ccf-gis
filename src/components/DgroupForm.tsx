"use client";

import { useState, useTransition } from "react";
import { submitDgroupRegistration } from "@/app/actions";
import type { DgroupMode } from "@/lib/types";

const LIFE_STAGE_OPTIONS = ["Single", "Married", "Widow", "Separated"];

const SCHEDULE_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend afternoons",
];

const LANGUAGE_OPTIONS = ["English", "Tagalog", "Pinoy"];

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
        Thanks! Show your phone back to your PC.
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
        <select
          required
          className="field"
          value={form.life_stage}
          onChange={(e) => setForm({ ...form, life_stage: e.target.value })}
        >
          <option value="" disabled>
            Select…
          </option>
          {LIFE_STAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Preferred schedule
        </label>
        <select
          required
          className="field"
          value={form.schedule_pref}
          onChange={(e) => setForm({ ...form, schedule_pref: e.target.value })}
        >
          <option value="" disabled>
            Select…
          </option>
          {SCHEDULE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
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
          Language
        </label>
        <select
          required
          className="field"
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
        >
          <option value="" disabled>
            Select…
          </option>
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
