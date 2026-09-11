import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddPcForm from "@/components/AddPcForm";
import StaffRow from "@/components/StaffRow";

export default async function ManageCoachesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pc/login");

  const { data: requesterStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (requesterStaff?.role !== "admin") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p style={{ color: "var(--ink-soft)" }}>
          This page is only available to admin staff.
        </p>
      </main>
    );
  }

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, full_name, email, role, active")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <Link href="/pc/admin" className="text-sm underline" style={{ color: "var(--teal-deep)" }}>
        ← Admin overview
      </Link>
      <p className="text-sm mt-4 mb-1" style={{ color: "var(--amber-deep)" }}>
        Admin
      </p>
      <h1 className="text-2xl font-serif mb-8">Manage Prayer Coaches</h1>

      <div className="mb-10">
        <h2 className="font-serif text-lg mb-3">Add a Prayer Coach</h2>
        <AddPcForm />
      </div>

      <h2 className="font-serif text-lg mb-3">All staff</h2>
      <ul className="flex flex-col gap-3">
        {staffList?.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No staff accounts yet.
          </p>
        )}
        {staffList?.map((s) => (
          <StaffRow key={s.id} staff={s} />
        ))}
      </ul>
    </main>
  );
}
