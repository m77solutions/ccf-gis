"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startCheckin } from "@/app/actions";

export default function NewCheckinButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        New check-in
      </button>
    );
  }

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const { session } = await startCheckin(table);
          router.push(`/pc/session/${session.id}`);
        });
      }}
    >
      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
          Table number
        </label>
        <input
          className="field w-32"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          placeholder="e.g. 12"
          autoFocus
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creating…" : "Start"}
      </button>
      <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}
