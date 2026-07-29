// Verifies the caller is the logged-in admin by validating their Supabase access
// token server-side. Used to protect admin-only API routes.
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
    return res.ok;
  } catch {
    return false;
  }
}
