/**
 * Content for the steps section — a two-column "sticky visual, scrolling
 * text" pattern (see casual.pm/how-to/become-project-manager for the
 * reference this was modeled on): an isometric staircase stays pinned on
 * the right and climbs up and to the right, one step falling into place
 * as its matching section on the left scrolls into view.
 *
 * Order (bottom to top):
 *   ProductPath                (amber — root)
 *   ├── Every role scored      (blue — "what you get", 4 steps)
 *   ├── The reasons why
 *   ├── A guided roadmap
 *   ├── Tracked progress
 *   ├── Talk to your mentor    (teal — "what you do", 4 steps, in order)
 *   ├── See your matches
 *   ├── Choose a role
 *   └── Follow your roadmap
 *
 * Every leaf's copy is a real fact from this product (the intake flow,
 * role catalog, and roadmap already in this app), not placeholder text.
 */

export type FlowSection = {
  nodeId: string;
  eyebrow: string;
  heading: string;
  body: string[];
  cta?: { label: string };
};

export const FLOW_SECTIONS: FlowSection[] = [
  {
    nodeId: "root",
    eyebrow: "start here",
    heading: "What ProductPath actually gives you, and what it asks of you.",
    body: [
      "“Growth PM” or “BA”? Job titles like these all sound the same from outside. This page maps out both halves of the deal: what you get from the app on the right, and what it actually takes from you to get there.",
      "For people moving into product manager, business analyst, and related roles — not for PMs already 5+ years in.",
    ],
    cta: { label: "Talk to my mentor →" },
  },
  {
    nodeId: "get-1",
    eyebrow: "what you get",
    heading: "Every role scored.",
    body: [
      "All 19 product, program, and business-analyst roles — from associate PM to platform PM to business analyst — scored against your own background in one pass, not one quiz result for one title.",
    ],
  },
  {
    nodeId: "get-2",
    eyebrow: "what you get",
    heading: "The reasons why.",
    body: [
      "Every score comes with the matched strengths that pushed it up and the growth areas that would need work — not just a number with no explanation attached to it.",
    ],
  },
  {
    nodeId: "get-3",
    eyebrow: "what you get",
    heading: "A guided roadmap.",
    body: [
      "Pick a role and get a sequenced path from where you are to where you're going. Each step comes with an estimated time and a resource, so nothing on it is a mystery task.",
    ],
  },
  {
    nodeId: "get-4",
    eyebrow: "what you get",
    heading: "Tracked progress.",
    body: [
      "Move steps from to-do to in-progress to done on a board, the same way real work gets tracked — and the road behind you fills in as you go.",
    ],
  },
  {
    nodeId: "do-1",
    eyebrow: "what you do — step 1",
    heading: "Talk to your mentor.",
    body: [
      "A real conversation, not a form. Your mentor asks, you answer in your own words, and every past answer stays visible as you go — about two minutes, no login required to start.",
    ],
  },
  {
    nodeId: "do-2",
    eyebrow: "what you do — step 2",
    heading: "See your matches.",
    body: [
      "Right after the conversation, all 19 roles come back ranked by fit — best match first, with the specific reasons why each one does or doesn't fit your background.",
    ],
  },
  {
    nodeId: "do-3",
    eyebrow: "what you do — step 3",
    heading: "Choose a role.",
    body: [
      "Pick the match that fits where you actually want to go — not necessarily the highest score, just the one worth building a roadmap around.",
    ],
  },
  {
    nodeId: "do-4",
    eyebrow: "what you do — step 4",
    heading: "Follow your roadmap.",
    body: [
      "Work through your sized, sequenced steps and track them as you go. That's the whole loop — no résumé required to start it.",
    ],
    cta: { label: "Talk to my mentor →" },
  },
];

export type BrickGroup = "root" | "get" | "do";

function groupOf(nodeId: string): BrickGroup {
  if (nodeId === "root") return "root";
  return nodeId.startsWith("get") ? "get" : "do";
}

/** The staircase, bottom to top — same order as FLOW_SECTIONS (each
 * section drops exactly one step). Root's real heading is a full
 * sentence — too long for a step tag, so it gets a short label instead. */
export const BRICK_STACK: { id: string; group: BrickGroup; label: string }[] = FLOW_SECTIONS.map((s) => ({
  id: s.nodeId,
  group: groupOf(s.nodeId),
  label: s.nodeId === "root" ? "ProductPath" : s.heading.replace(/\.$/, ""),
}));

/** Dark theme tokens — same dark/glow language already used elsewhere in
 * this app's scroll sections. */
export const DARK = {
  bg: "#0d1527",
  line: "#1e293b",
  textOnDark: "#f4f8fd",
  textOnDarkMuted: "#94a3b8",
  textOnDarkFaint: "#64748b",
} as const;
