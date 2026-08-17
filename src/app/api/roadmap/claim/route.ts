import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyUser } from "@/lib/verifyUser";

// Attaches an (anonymous) roadmap to the logged-in user's account, so it shows
// up in their "My Roadmaps". Idempotent: re-claiming your own roadmap is a no-op.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const shareToken = String(body?.shareToken || "");
  if (!shareToken) {
    return NextResponse.json({ error: "Missing shareToken." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: roadmap } = await supabaseAdmin
    .from("roadmaps")
    .select("id, user_id, intake_response_id")
    .eq("share_token", shareToken)
    .single();
  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
  }

  // Already owned by someone else — don't steal it.
  if (roadmap.user_id && roadmap.user_id !== user.id) {
    return NextResponse.json(
      { error: "This roadmap is already saved to another account." },
      { status: 403 }
    );
  }

  if (roadmap.user_id !== user.id) {
    await supabaseAdmin
      .from("roadmaps")
      .update({ user_id: user.id })
      .eq("id", roadmap.id);
    if (roadmap.intake_response_id) {
      await supabaseAdmin
        .from("intake_responses")
        .update({ user_id: user.id })
        .eq("id", roadmap.intake_response_id);
    }
  }

  return NextResponse.json({ ok: true });
}
