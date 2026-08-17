// Browser-safe Supabase client. Uses ONLY the public anon key and is used just
// for admin email/password login. It can never read the locked-down tables.
import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
