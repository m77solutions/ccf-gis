"use client";

import { useState, useTransition } from "react";
import { submitGuestSelection } from "@/app/actions";
import type { BibleLanguage, DgroupStatus } from "@/lib/types";

const DGROUP_OPTIONS: { value: DgroupStatus; label: string }[] = [
  { value: "join", label: "I'd like to join a DGroup" },
  { value: "undecided", label: "I'm still deciding" },
  { value: "has_dgroup", label: "I'm already in a DGroup" },
];

const BIBLE_OPTIONS: { value: BibleLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "pinoy", label: "Pinoy" },
  { value: "tagalog", label: "Tagalog" },
];

export default function SelectionForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [dgroupStatus, setDgroupStatus] = useState<DgroupStatus | null>(null);
  const [bibleLanguage, setBibleLanguage] = useState<BibleLanguage | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = dgroupStatus && bibleLanguage;

  if (submitted) {
    return (
      <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
        Thanks! Show your phone back to your PC to confirm.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-sm mb-3" style={{ color: "var(--ink-soft)" }}>
          Would you like to join a Discipleship Group (DGroup)?
        </legend>
        <div className="flex flex-col gap-2">
          {DGROUP_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dgroup"
                checked={dgroupStatus === opt.value}
                onChange={() => setDgroupStatus(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm mb-3" style={{ color: "var(--ink-soft)" }}>
          Which Bible would you like?
        </legend>
        <div className="flex flex-col gap-2">
          {BIBLE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="bible"
                checked={bibleLanguage === opt.value}
                onChange={() => setBibleLanguage(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        disabled={!canSubmit || pending}
        className="btn-primary"
        onClick={() =>
          startTransition(async () => {
            await submitGuestSelection(token, {
              dgroup_status: dgroupStatus!,
              bible_language: bibleLanguage!,
            });
            setSubmitted(true);
          })
        }
      >
        {pending ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}
