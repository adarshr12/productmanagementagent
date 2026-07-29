import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Marks a roadmap step complete/incomplete. The share token both identifies the
// roadmap and authorizes the change (v0: one shared link can view + tick).
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const shareToken = String(body?.shareToken || "");
  const stepId = String(body?.stepId || "");
  const isCompleted = Boolean(body?.isCompleted);

  if (!shareToken || !stepId) {
    return NextResponse.json(
      { error: "Missing shareToken or stepId." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // The step must belong to the roadmap named by this share token.
  const { data: roadmap } = await supabaseAdmin
    .from("roadmaps")
    .select("id")
    .eq("share_token", shareToken)
    .single();
  if (!roadmap) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  const { data: step } = await supabaseAdmin
    .from("roadmap_steps")
    .select("id, roadmap_id")
    .eq("id", stepId)
    .single();
  if (!step || step.roadmap_id !== roadmap.id) {
    return NextResponse.json(
      { error: "That step does not belong to this roadmap." },
      { status: 403 }
    );
  }

  const { error } = await supabaseAdmin
    .from("roadmap_steps")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", stepId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
