"use client";

import { useState, useTransition } from "react";
import { updateStaffMember } from "@/app/actions";
import type { StaffRole } from "@/lib/types";

const ROLES: StaffRole[] = ["pc", "runner", "backroom", "dgroup_leader", "admin"];

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  role: StaffRole;
  active: boolean;
}

export default function StaffRow({ staff }: { staff: StaffMember }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(staff.full_name);
  const [email, setEmail] = useState(staff.email ?? "");
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [active, setActive] = useState(staff.active);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateStaffMember(staff.id, { full_name: fullName, email, role, active });
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  }

  if (!editing) {
    return (
      <li
        className="flex items-center justify-between p-3 rounded text-sm"
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--rule)",
          opacity: staff.active ? 1 : 0.55,
        }}
      >
        <div>
          <p className="font-medium">
            {staff.full_name}{" "}
            {!staff.active && (
              <span className="text-xs" style={{ color: "var(--rose-deep)" }}>
                (inactive)
              </span>
            )}
          </p>
          <p style={{ color: "var(--ink-soft)" }}>
            {staff.email} · {staff.role}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Edit
        </button>
      </li>
    );
  }

  return (
    <li
      className="flex flex-col gap-3 p-4 rounded text-sm"
      style={{ background: "var(--paper-raised)", border: "1px solid var(--teal)" }}
    >
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Full name
        </label>
        <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Contact email
        </label>
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
          Display/contact only — this does not change their login email.
        </p>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
          Role
        </label>
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      {error && (
        <p className="text-xs" style={{ color: "var(--rose-deep)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary" onClick={save}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          disabled={pending}
          className="btn-secondary"
          onClick={() => {
            setEditing(false);
            setFullName(staff.full_name);
            setEmail(staff.email ?? "");
            setRole(staff.role);
            setActive(staff.active);
            setError(null);
          }}
        >
          Cancel
        </button>
      </div>
    </li>
  );
}
