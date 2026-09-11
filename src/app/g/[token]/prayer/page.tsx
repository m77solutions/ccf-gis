"use client";

import { useState, useTransition, use } from "react";
import { submitPrayerRequest } from "@/app/actions";

export default function PrayerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex-1 px-6 py-14 max-w-md mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--rose-deep)" }}>
        Prayer
      </p>
      <h1 className="text-2xl font-serif mb-2">Anything on your heart?</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        Your host would love to pray with you. This is optional — feel free to skip it.
      </p>

      {submitted ? (
        <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
          Thank you — your host can see this now.
        </p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await submitPrayerRequest(token, text);
              setSubmitted(true);
            });
          }}
        >
          <textarea
            className="field min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share what's on your heart…"
          />
          <button type="submit" disabled={pending || !text.trim()} className="btn-primary">
            {pending ? "Sending…" : "Share with my host"}
          </button>
        </form>
      )}
    </main>
  );
}
