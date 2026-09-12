"use server";

import { createClient } from "@/lib/supabase/server";

export async function adminSignIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: staffRow } = await supabase
    .from("staff")
    .select("role")
    .eq("auth_user_id", user!.id)
    .single();

  if (staffRow?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "This account is not an admin. Use the Prayer Coach login instead." };
  }

  return { error: null };
}
