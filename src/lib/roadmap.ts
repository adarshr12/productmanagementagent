// Parses and validates the model's JSON roadmap output.
export type ParsedRoadmap = {
  title: string;
  overview: string;
  steps: {
    title: string;
    description: string;
    estimated_time: string;
    resource_note: string;
  }[];
};

export function parseRoadmap(raw: string): ParsedRoadmap {
  let text = (raw || "").trim();
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
      estimated_time: String(s?.estimated_time || "").trim(),
      resource_note: String(s?.resource_note || "").trim(),
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
