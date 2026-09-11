import { getSessionByToken } from "@/app/actions";
import DgroupForm from "@/components/DgroupForm";

export default async function DgroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSessionByToken(token);

  const alreadySubmitted =
    session &&
    (Array.isArray(session.dgroup_registrations)
      ? session.dgroup_registrations.length > 0
      : !!session.dgroup_registrations);

  return (
    <main className="flex-1 px-6 py-14 max-w-md mx-auto w-full">
      <p className="text-sm mb-1" style={{ color: "var(--teal-deep)" }}>
        DGroup
      </p>
      <h1 className="text-2xl font-serif mb-2">Let&apos;s find your group</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>
        A few details so we can match you with the right Discipleship Group.
      </p>

      {alreadySubmitted ? (
        <p className="text-sm" style={{ color: "var(--teal-deep)" }}>
          Thanks — we already have your details. Hand your phone back to your host.
        </p>
      ) : (
        <DgroupForm token={token} />
      )}
    </main>
  );
}
