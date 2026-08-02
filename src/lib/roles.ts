// The catalog of product roles a person can be matched to. Shared by the AI
// scorer (which rates transition fit per role) and the UI (which shows the
// avatar, description + score). Keep ids stable — they're stored in the database.

export type Role = {
  id: string;
  label: string;
  emoji: string;
  family: "PM ladder" | "Specialization" | "Adjacent role";
  description: string;
};

export const ROLE_CATALOG: Role[] = [
  // ---- PM ladder ----
  {
    id: "apm",
    label: "Associate Product Manager",
    emoji: "🌱",
    family: "PM ladder",
    description:
      "Entry-level PM role. You learn the craft supporting a senior PM — writing specs, talking to users, and shipping small features. A common first step into product.",
  },
  {
    id: "pm_generalist",
    label: "Product Manager (Generalist)",
    emoji: "🧭",
    family: "PM ladder",
    description:
      "Owns a product area end to end: discovery, prioritisation, and working with design and engineering to ship and measure outcomes.",
  },
  {
    id: "senior_pm",
    label: "Senior Product Manager",
    emoji: "🎯",
    family: "PM ladder",
    description:
      "An experienced PM owning a larger area and its strategy, mentoring juniors, and driving bigger, riskier bets.",
  },
  {
    id: "group_pm",
    label: "Group Product Manager",
    emoji: "👥",
    family: "PM ladder",
    description:
      "Leads several PMs and a whole product line, balancing people leadership with product strategy.",
  },
  // ---- Specializations ----
  {
    id: "ai_pm",
    label: "AI Product Manager",
    emoji: "🤖",
    family: "Specialization",
    description:
      "Builds products powered by AI/ML — defining use cases, data needs, model behaviour, evaluation, and guardrails.",
  },
  {
    id: "technical_pm",
    label: "Technical Product Manager",
    emoji: "🛠️",
    family: "Specialization",
    description:
      "PM for engineering-heavy products (APIs, infrastructure, developer tools). Works deeply with engineers on technical trade-offs.",
  },
  {
    id: "data_pm",
    label: "Data Product Manager",
    emoji: "📊",
    family: "Specialization",
    description:
      "Owns data products — pipelines, analytics, dashboards, and the data that powers other products and decisions.",
  },
  {
    id: "growth_pm",
    label: "Growth Product Manager",
    emoji: "📈",
    family: "Specialization",
    description:
      "Focuses on acquisition, activation, and retention. Runs experiments and optimises funnels and key metrics.",
  },
  {
    id: "platform_pm",
    label: "Platform Product Manager",
    emoji: "🧱",
    family: "Specialization",
    description:
      "Builds internal platforms and APIs that other teams build on. The customers are often other engineers and PMs.",
  },
  {
    id: "product_ops",
    label: "Product Operations Manager",
    emoji: "⚙️",
    family: "Specialization",
    description:
      "Streamlines the processes, tools, and data that product teams use, so they can build and ship faster.",
  },
  {
    id: "b2b_pm",
    label: "B2B Product Manager",
    emoji: "🏢",
    family: "Specialization",
    description:
      "Builds products for business/enterprise customers — complex requirements, integrations, and close work with sales.",
  },
  {
    id: "b2c_pm",
    label: "B2C Product Manager",
    emoji: "🛍️",
    family: "Specialization",
    description:
      "Builds products for everyday consumers. Obsesses over user experience, engagement, and scale.",
  },
  {
    id: "ecommerce_pm",
    label: "E-commerce Product Manager",
    emoji: "🛒",
    family: "Specialization",
    description:
      "Owns online shopping experiences — catalog, search, checkout, payments, and conversion.",
  },
  // ---- Adjacent roles ----
  {
    id: "product_owner",
    label: "Product Owner",
    emoji: "📋",
    family: "Adjacent role",
    description:
      "Owns and prioritises the backlog in Agile/Scrum teams — the bridge between stakeholders and engineering.",
  },
  {
    id: "product_analyst",
    label: "Product Analyst",
    emoji: "🔎",
    family: "Adjacent role",
    description:
      "Uses data to inform product decisions — metrics, dashboards, A/B tests, and insights. A strong on-ramp to PM.",
  },
  {
    id: "project_manager",
    label: "Project Manager",
    emoji: "🗓️",
    family: "Adjacent role",
    description:
      "Drives delivery: timelines, scope, risks, and coordination across teams to ship on schedule.",
  },
  {
    id: "tpm",
    label: "Technical Program Manager",
    emoji: "🔗",
    family: "Adjacent role",
    description:
      "Coordinates complex, cross-team technical programs end to end. Strong on dependencies and execution.",
  },
  {
    id: "business_analyst",
    label: "Business Analyst",
    emoji: "🌉",
    family: "Adjacent role",
    description:
      "Bridges business and tech: gathers requirements, maps processes, and translates needs into specifications.",
  },
  {
    id: "product_marketing",
    label: "Product Marketing Manager",
    emoji: "📣",
    family: "Adjacent role",
    description:
      "Owns positioning, messaging, and go-to-market. Launches products and drives adoption.",
  },
];

export function getRole(id: string): Role | undefined {
  return ROLE_CATALOG.find((r) => r.id === id);
}
