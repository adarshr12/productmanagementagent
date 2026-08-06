// Verifies an end-user's Supabase access token server-side and returns their id.
// Used to protect the "my roadmaps" and "claim roadmap" endpoints.
export async function verifyUser(
  req: Request
): Promise<{ id: string; email: string | null } | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
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
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}
