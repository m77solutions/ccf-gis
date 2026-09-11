import { PHASES, type Phase } from "@/lib/types";

const accentVar: Record<string, string> = {
  amber: "var(--amber)",
  rose: "var(--rose)",
  teal: "var(--teal)",
  ink: "var(--ink)",
};

export default function PhaseRail({ current }: { current: Phase }) {
  const currentIdx = PHASES.findIndex((p) => p.key === current);

  return (
    <ol className="flex flex-col gap-0">
      {PHASES.map((phase, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <li key={phase.key} className="flex items-start gap-3 pb-6 relative">
            {idx < PHASES.length - 1 && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-px"
                style={{ background: "var(--rule)" }}
              />
            )}
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 z-10"
              style={{
                background: isDone || isCurrent ? accentVar[phase.accent] : "var(--paper-raised)",
                color: isDone || isCurrent ? "var(--paper)" : "var(--ink-soft)",
                border: `1px solid ${isDone || isCurrent ? accentVar[phase.accent] : "var(--rule)"}`,
              }}
            >
              {idx + 1}
            </span>
            <span
              className={isCurrent ? "font-semibold" : ""}
              style={{ color: isCurrent ? "var(--ink)" : "var(--ink-soft)" }}
            >
              {phase.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
