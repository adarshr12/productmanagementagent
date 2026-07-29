// Pure helpers for turning intake answers + retrieved context into the prompt,
// and for parsing the model's JSON back into a roadmap. Kept separate from the
// route so the logic can be reused (e.g. by a future mobile backend) and tested.
import { INTAKE_QUESTIONS } from "./questions";

export type ParsedRoadmap = {
  title: string;
  overview: string;
  steps: { title: string; description: string }[];
};

// A short search string used to pull the most relevant knowledge-base chunks.
export function buildQuery(answers: Record<string, string>): string {
  return [
    answers.target_role && `Target role: ${answers.target_role}`,
    answers.biggest_skill_gap && `Biggest skill gap: ${answers.biggest_skill_gap}`,
    answers.current_role && `Current role: ${answers.current_role}`,
    answers.current_domain && `Domain: ${answers.current_domain}`,
    answers.experience_level && `Experience: ${answers.experience_level}`,
  ]
    .filter(Boolean)
    .join(". ");
}

// The user message sent to Groq: all intake answers + the retrieved context.
export function buildUserContent(
  answers: Record<string, string>,
  context: string
): string {
  const lines = INTAKE_QUESTIONS.map(
    (q) => `- ${q.label} ${answers[q.id]?.toString().trim() || "(not answered)"}`
  ).join("\n");

  return [
    "INTAKE ANSWERS:",
    lines,
    "",
    "CONTEXT (excerpts from the curated resource library):",
    context || "(no context available — rely on mainstream guidance)",
    "",
    "Using the rules in your instructions, produce the JSON roadmap now.",
  ].join("\n");
}

// Parse and validate the model's JSON output into a clean roadmap.
export function parseRoadmap(raw: string): ParsedRoadmap {
  let text = (raw || "").trim();
  // Strip accidental markdown code fences if the model added them.
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  }

  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("The AI did not return valid JSON. Please try again.");
  }

  const rawSteps = Array.isArray(obj?.steps) ? obj.steps : [];
  const steps = rawSteps
    .map((s: any) => ({
      title: String(s?.title || "").trim(),
      description: String(s?.description || "").trim(),
    }))
    .filter((s: { title: string }) => s.title.length > 0);

  if (steps.length === 0) {
    throw new Error("The AI returned no steps. Please try again.");
  }

  return {
    title: String(obj?.title || "Your Career Roadmap").trim(),
    overview: String(obj?.overview || "").trim(),
    steps,
  };
}
