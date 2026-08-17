import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyUser } from "@/lib/verifyUser";

// Lists the signed-in user's saved roadmaps with progress.
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("roadmaps")
    .select("share_token, title, role, created_at, roadmap_steps(status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roadmaps = (data ?? []).map((r: any) => {
    const steps = (r.roadmap_steps ?? []) as { status: string }[];
    const total = steps.length;
    const done = steps.filter((s) => s.status === "done").length;
    return {
      shareToken: r.share_token,
      title: r.title,
      role: r.role,
      created_at: r.created_at,
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  });

  return NextResponse.json({ roadmaps });
}
