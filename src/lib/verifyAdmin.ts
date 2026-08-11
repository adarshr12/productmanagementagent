import { getSupabaseAdmin } from "./supabaseAdmin";

// Verifies the caller is an allowlisted admin: a valid Supabase session AND
// a matching row in admin_users. The session check alone isn't enough once
// public sign-up exists — any signed-up visitor would otherwise pass. Used
// to protect admin-only API routes.
export async function verifyAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        },
      }
    );
    if (!res.ok) return false;
    const user = await res.json();
    if (!user?.id) return false;

    const { data } = await getSupabaseAdmin()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}
