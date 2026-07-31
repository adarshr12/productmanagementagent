// Helpers for the role-match step and the (now role-specific) roadmap step.
import { INTAKE_QUESTIONS } from "./questions";
import { ROLE_CATALOG, type Role } from "./roles";

export type RoleMatch = {
  id: string;
  label: string;
  family: Role["family"];
  description: string;
  score: number;
  reason: string;
};

// A compact string of the person's background, used as the retrieval query.
export function backgroundQuery(answers: Record<string, string>): string {
  return [
    answers.current_role && `Current role: ${answers.current_role}`,
    answers.current_domain && `Domain: ${answers.current_domain}`,
    answers.experience_level && `Experience: ${answers.experience_level}`,
    answers.strengths && `Strengths: ${answers.strengths}`,
    answers.biggest_skill_gap && `Biggest skill gap: ${answers.biggest_skill_gap}`,
  ]
    .filter(Boolean)
    .join(". ");
}

function answersBlock(answers: Record<string, string>): string {
  return INTAKE_QUESTIONS.map(
    (q) => `- ${q.label} ${answers[q.id]?.toString().trim() || "(not answered)"}`
  ).join("\n");
}

// User message for the role-scoring call.
export function buildRoleMatchUserContent(
  answers: Record<string, string>,
  context: string
): string {
  const roleList = ROLE_CATALOG.map(
    (r) => `- ${r.id}: ${r.label} — ${r.description}`
  ).join("\n");
  return [
    "INTAKE ANSWERS:",
    answersBlock(answers),
    "",
    "CONTEXT (curated resources):",
    context || "(none — use mainstream career knowledge)",
    "",
    "ROLES TO SCORE (score every one of these ids):",
    roleList,
    "",
    "Score every role id above and return the JSON now.",
  ].join("\n");
}

// Merge the model's scores with the catalog, clamp, and sort best-first.
export function parseMatches(raw: string): RoleMatch[] {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  }
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("The AI did not return valid JSON for role matching.");
  }
  const arr: any[] = Array.isArray(obj?.matches) ? obj.matches : [];
  const byId = new Map(arr.map((m) => [String(m?.id), m]));

  const matches: RoleMatch[] = ROLE_CATALOG.map((r) => {
    const m = byId.get(r.id);
    const rawScore = Number(m?.score);
    const score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : 0;
    return {
      id: r.id,
      label: r.label,
      family: r.family,
      description: r.description,
      score,
      reason: String(m?.reason || "").trim(),
    };
  });

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

// User message for the role-specific roadmap call.
export function buildRoadmapUserContent(
  answers: Record<string, string>,
  role: Role,
  context: string
): string {
  return [
    "INTAKE ANSWERS:",
    answersBlock(answers),
    "",
    `TARGET ROLE: ${role.label} — ${role.description}`,
    "",
    "CONTEXT (excerpts from the curated resource library):",
    context || "(none — rely on mainstream guidance)",
    "",
    "Produce the JSON roadmap for this target role now.",
  ].join("\n");
}

export function roadmapQuery(
  answers: Record<string, string>,
  role: Role
): string {
  return [`Target role: ${role.label}`, backgroundQuery(answers)]
    .filter(Boolean)
    .join(". ");
}
