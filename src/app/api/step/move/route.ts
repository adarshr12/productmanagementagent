import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Moves a roadmap step between Kanban columns (todo / in_progress / done).
// The share token identifies the roadmap and authorizes the change.
export const runtime = "nodejs";

const VALID = new Set(["todo", "in_progress", "done"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const shareToken = String(body?.shareToken || "");
  const stepId = String(body?.stepId || "");
  const status = String(body?.status || "");

  if (!shareToken || !stepId || !VALID.has(status)) {
    return NextResponse.json(
      { error: "Missing shareToken/stepId or invalid status." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

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

  const isDone = status === "done";
  const { error } = await supabaseAdmin
    .from("roadmap_steps")
    .update({
      status,
      is_completed: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", stepId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
