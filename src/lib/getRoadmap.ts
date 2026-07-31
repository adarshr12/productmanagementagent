// SERVER ONLY. Fetches a roadmap + its steps by the public share token.
import { getSupabaseAdmin } from "./supabaseAdmin";

export type StepStatus = "todo" | "in_progress" | "done";

export type RoadmapStep = {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  status: StepStatus;
};

export type RoadmapView = {
  roadmap: {
    id: string;
    title: string | null;
    content: string | null;
    role: string | null;
    model: string | null;
    created_at: string;
    share_token: string;
  };
  steps: RoadmapStep[];
};

export async function getRoadmapByToken(
  token: string
): Promise<RoadmapView | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: roadmap, error } = await supabaseAdmin
    .from("roadmaps")
    .select("id, title, content, role, model, created_at, share_token")
    .eq("share_token", token)
    .single();
  if (error || !roadmap) return null;

  const { data: steps } = await supabaseAdmin
    .from("roadmap_steps")
    .select("id, step_order, title, description, status")
    .eq("roadmap_id", roadmap.id)
    .order("step_order", { ascending: true });

  return { roadmap, steps: (steps ?? []) as RoadmapStep[] };
}
