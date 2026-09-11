import { redirect } from "next/navigation";
import { getSessionByToken } from "@/app/actions";

const phaseRoute: Record<string, string> = {
  intake: "intake",
  engagement: "prayer",
  selection: "selection",
  materials: "materials",
  dgroup: "dgroup",
  complete: "complete",
};

export default async function GuestEntry({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSessionByToken(token);

  if (!session) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <p style={{ color: "var(--ink-soft)" }}>
          This link isn&apos;t valid. Please ask your Welcome Center host for a new one.
        </p>
      </main>
    );
  }

  const next = phaseRoute[session.phase] ?? "intake";
  if (next === "complete") {
    redirect(`/g/${token}/complete`);
  }
  redirect(`/g/${token}/${next}`);
}
