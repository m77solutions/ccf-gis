"use client";

import { useState, useTransition } from "react";
import { assignMiner, unassignMiner, updatePlacementStatus } from "@/app/actions";
import { PLACEMENT_STATUSES } from "@/lib/types";
import type { PlacementStatus } from "@/lib/types";

interface MinerOption {
  id: string;
  full_name: string;
}

export function AssignMinerControl({
  registrationId,
  minerId,
  minerName,
  miners,
}: {
  registrationId: string;
  minerId: string | null;
  minerName: string | null;
  miners: MinerOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(minerId ?? "");

  if (minerId) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{minerName || "Miner"}</span>
        <button
          disabled={pending}
          className="text-xs underline"
          style={{ color: "var(--rose-deep)" }}
          onClick={() => startTransition(() => unassignMiner(registrationId))}
        >
          Unassign
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="field text-sm"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="" disabled>
          Assign a Miner…
        </option>
        {miners.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </select>
      <button
        disabled={pending || !selected}
        className="btn-secondary text-sm"
        onClick={() => startTransition(() => assignMiner(registrationId, selected))}
      >
        {pending ? "Assigning…" : "Assign"}
      </button>
    </div>
  );
}

export function PlacementStatusControl({
  registrationId,
  current,
  notes,
}: {
  registrationId: string;
  current: PlacementStatus;
  notes: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<PlacementStatus>(current);
  const [noteText, setNoteText] = useState(notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);

  function save(nextStatus: PlacementStatus, nextNotes?: string) {
    startTransition(() => updatePlacementStatus(registrationId, nextStatus, nextNotes));
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        className="field text-sm"
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as PlacementStatus;
          setStatus(next);
          save(next);
        }}
      >
        {PLACEMENT_STATUSES.filter((s) => s.key !== "unassigned").map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      {editingNotes ? (
        <div className="flex flex-col gap-1">
          <textarea
            className="field text-sm"
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              disabled={pending}
              className="btn-secondary text-xs"
              onClick={() => {
                save(status, noteText);
                setEditingNotes(false);
              }}
            >
              Save note
            </button>
            <button
              className="text-xs underline"
              style={{ color: "var(--ink-soft)" }}
              onClick={() => {
                setNoteText(notes ?? "");
                setEditingNotes(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="text-xs underline self-start"
          style={{ color: "var(--teal-deep)" }}
          onClick={() => setEditingNotes(true)}
        >
          {notes ? "Edit note" : "Add note"}
        </button>
      )}
      {!editingNotes && notes && (
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          {notes}
        </p>
      )}
    </div>
  );
}
