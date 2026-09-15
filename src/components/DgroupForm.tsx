"use client";

import { useState, useTransition } from "react";
import { submitDgroupRegistration } from "@/app/actions";
import { MARITAL_STATUS_OPTIONS } from "@/lib/types";
import type { DgroupMode, Gender, MaritalStatus } from "@/lib/types";

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
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    facebook: "",
    gender: "" as Gender | "",
    occupation: "",
    invited_by_name: "",
    life_stage: "" as MaritalStatus | "",
    life_stage_other: "",
    schedule_pref: "",
    mode: "in_person" as DgroupMode,
    language: "",
  });

  if (submitted) {
    return (
      <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
        Thanks! Show your phone back to your PC.
      </p>
    );
  }

  const canSubmit =
    form.gender &&
    form.facebook.trim() &&
    form.occupation.trim() &&
    form.life_stage &&
    (form.life_stage !== "Other" || form.life_stage_other.trim()) &&
    form.schedule_pref &&
    form.language;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await submitDgroupRegistration(token, {
              facebook: form.facebook.trim(),
              gender: form.gender as Gender,
              occupation: form.occupation.trim(),
              invited_by_name: form.invited_by_name.trim(),
              life_stage: form.life_stage as MaritalStatus,
              life_stage_other: form.life_stage === "Other" ? form.life_stage_other.trim() : "",
              schedule_pref: form.schedule_pref,
              mode: form.mode,
              language: form.language,
            });
            setSubmitted(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Facebook name or profile link
        </label>
        <p className="text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Enter &quot;NA&quot; if not applicable
        </p>
        <input
          required
          className="field"
          value={form.facebook}
          onChange={(e) => setForm({ ...form, facebook: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Gender
        </label>
        <div className="flex gap-4 text-sm">
          {(["male", "female"] as Gender[]).map((g) => (
            <label key={g} className="flex items-center gap-2 capitalize">
              <input
                type="radio"
                name="gender"
                required
                checked={form.gender === g}
                onChange={() => setForm({ ...form, gender: g })}
              />
              {g}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Occupation
        </label>
        <input
          required
          className="field"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Will you join the dgrp (small group) of the Prayer Coach who welcomed you?
        </label>
        <p className="text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          If the person who welcomed you invited you to join his/her dgroup, please enter his/her name.
          Leave blank if not applicable.
        </p>
        <input
          className="field"
          value={form.invited_by_name}
          onChange={(e) => setForm({ ...form, invited_by_name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Marital status
        </label>
        <select
          required
          className="field"
          value={form.life_stage}
          onChange={(e) => setForm({ ...form, life_stage: e.target.value as MaritalStatus })}
        >
          <option value="" disabled>
            Select…
          </option>
          {MARITAL_STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {form.life_stage === "Other" && (
          <input
            required
            className="field mt-2"
            placeholder="Please specify"
            value={form.life_stage_other}
            onChange={(e) => setForm({ ...form, life_stage_other: e.target.value })}
          />
        )}
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
      {error && (
        <p className="text-xs" style={{ color: "var(--rose-deep)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={pending || !canSubmit} className="btn-primary mt-2">
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
