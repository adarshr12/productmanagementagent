// The fixed intake questionnaire (12 questions). Shared by the public form and
// the roadmap API so they never drift apart. Five questions map to dedicated
// database columns; the rest are stored in the flexible `answers` field.

export type Question = {
  id: string;
  label: string;
  type: "select" | "text" | "textarea";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  // If set, this answer is also saved to its own column on intake_responses.
  column?:
    | "experience_level"
    | "current_role"
    | "current_domain"
    | "target_role"
    | "biggest_skill_gap";
};

export const INTAKE_QUESTIONS: Question[] = [
  {
    id: "experience_level",
    column: "experience_level",
    label: "How much total work experience do you have?",
    type: "select",
    required: true,
    options: ["Student / Fresher", "0-2 years", "2-5 years", "5-10 years", "10+ years"],
  },
  {
    id: "current_role",
    column: "current_role",
    label: "What is your current (or most recent) job title?",
    type: "text",
    required: true,
    placeholder: "e.g. Customer Support Executive, QA Engineer, Sales Associate",
  },
  {
    id: "current_domain",
    column: "current_domain",
    label: "Which domain/industry do you currently work in?",
    type: "select",
    required: true,
    options: [
      "IT / Software",
      "Support / Operations",
      "Sales / Marketing",
      "Finance / Banking",
      "Consulting",
      "Manufacturing / Core",
      "Student / No industry yet",
      "Other",
    ],
  },
  {
    id: "strengths",
    label: "What are your strongest skills? (pick the closest)",
    type: "select",
    required: true,
    options: [
      "Analytical & data",
      "Communication & stakeholder management",
      "Technical / engineering",
      "Design & user experience",
      "Business & domain knowledge",
      "Execution & delivery",
    ],
  },
  {
    id: "biggest_skill_gap",
    column: "biggest_skill_gap",
    label: "What feels like your single biggest skill gap right now?",
    type: "select",
    required: true,
    options: [
      "Technical understanding",
      "Data & analytics (e.g. SQL, Excel)",
      "Product / business frameworks",
      "Stakeholder communication",
      "Building a portfolio of work",
      "Interview preparation",
      "Getting shortlisted / resume",
      "Domain knowledge",
    ],
  },
  {
    id: "education_background",
    label: "What's your highest education background?",
    type: "select",
    required: true,
    options: [
      "Diploma",
      "Bachelor's (Engineering/Tech)",
      "Bachelor's (Non-tech)",
      "MBA / PGDM",
      "Master's (Other)",
      "Other",
    ],
  },
  {
    id: "weekly_time_commitment",
    label: "How much time can you realistically invest each week?",
    type: "select",
    required: true,
    options: ["Under 3 hours", "3-6 hours", "6-10 hours", "10+ hours"],
  },
  {
    id: "target_timeline",
    label: "In what timeframe do you want to make this transition?",
    type: "select",
    required: true,
    options: ["Under 3 months", "3-6 months", "6-12 months", "12+ months"],
  },
  {
    id: "learning_budget",
    label: "What's your budget for courses/certifications?",
    type: "select",
    required: true,
    options: ["Free resources only", "Under ₹5,000", "₹5,000-₹25,000", "₹25,000+"],
  },
  {
    id: "existing_certifications",
    label: "Any relevant certifications already? (optional)",
    type: "text",
    required: false,
    placeholder: "e.g. CSPO, PMP, CBAP, Google PM (optional)",
  },
  {
    id: "location_preference",
    label: "Where do you want to work?",
    type: "select",
    required: true,
    options: [
      "Metro city (Bengaluru, Hyderabad, etc.)",
      "Tier-2 city",
      "Remote",
      "No preference",
    ],
  },
  {
    id: "motivation",
    label: "In a sentence or two, why do you want this change? (optional)",
    type: "textarea",
    required: false,
    placeholder: "This helps personalize your roadmap.",
  },
];
