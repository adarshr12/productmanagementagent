// SERVER ONLY. Fetches a roadmap + its steps by the public share token.
import { getSupabaseAdmin } from "./supabaseAdmin";

export type StepStatus = "todo" | "in_progress" | "done";

export type RoadmapStep = {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  estimated_time: string | null;
  resource_note: string | null;
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
  // Where they're starting from — powers the journey map's "you are here".
  startContext: {
    currentRole: string | null;
    currentDomain: string | null;
  };
};

export async function getRoadmapByToken(
  token: string
): Promise<RoadmapView | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: roadmap, error } = await supabaseAdmin
    .from("roadmaps")
    .select(
      "id, title, content, role, model, created_at, share_token, intake_response_id"
    )
    .eq("share_token", token)
    .single();
  if (error || !roadmap) return null;

  const [{ data: steps }, { data: intake }] = await Promise.all([
    supabaseAdmin
      .from("roadmap_steps")
      .select(
        "id, step_order, title, description, estimated_time, resource_note, status"
      )
      .eq("roadmap_id", roadmap.id)
      .order("step_order", { ascending: true }),
    supabaseAdmin
      .from("intake_responses")
      .select("current_role, current_domain")
      .eq("id", roadmap.intake_response_id)
      .single(),
  ]);

  return {
    roadmap,
    steps: (steps ?? []) as RoadmapStep[],
    startContext: {
      currentRole: intake?.current_role ?? null,
      currentDomain: intake?.current_domain ?? null,
    },
  };
}
