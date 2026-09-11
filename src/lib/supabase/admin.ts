import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this into a Client Component or expose the key to the browser.
// Guests interact with their session via an unguessable qr_token embedded in the URL,
// not via a Supabase Auth session — every server action using this client must first
// look up the session by qr_token and treat "not found" as unauthorized.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
