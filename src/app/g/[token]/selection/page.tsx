import { getSessionByToken } from "@/app/actions";
import SelectionForm from "@/components/SelectionForm";

export default async function SelectionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSessionByToken(token);

  const single = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v);
  const discipleship = session ? single(session.discipleship_responses) : null;

  // Guest already answered — don't re-show a blank form if they re-scan the
  // link (e.g. while waiting for their PC to pick an activity tier & lock).
  const alreadySubmitted = !!discipleship?.dgroup_status && !!discipleship?.bible_language;

  return (
    <main className="flex-1 px-6 py-14 max-w-md mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--teal-deep)" }}>
        Next steps
      </p>
      <h1 className="text-2xl font-serif mb-8">A couple of quick questions</h1>

      {alreadySubmitted ? (
        <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
          Thanks — we already have your answers. Show your phone back to your PC to confirm.
        </p>
      ) : (
        <SelectionForm token={token} />
      )}
    </main>
  );
}
