-- ============================================================================
-- Multi-agent orchestration
--   Up to now every agent_configs row was called directly by name from a
--   specific API route. This adds a routing layer so new conversational
--   agents (a tutor, and whatever comes after it) can be added purely from
--   /admin -- no code change -- and still get picked correctly:
--
--   - agent_type distinguishes agents invoked by a fixed app flow ('flow':
--     role_match, roadmap -- triggered by a specific button, never routed)
--     from ones that participate in open conversation ('conversational':
--     product_assistant, tutor, and future agents) and the router itself
--     ('orchestrator').
--   - routing_hint is natural-language, admin-editable text describing WHEN
--     a conversational agent should handle a message. The orchestrator
--     agent reads the current list of active conversational agents + their
--     routing_hint at request time (see src/lib/orchestrate.ts) and picks
--     one -- so adding a "Voice Practice Agent" later is just a new row.
--   - is_active lets an agent be taken out of rotation without deleting it
--     (its history/config is preserved).
-- ============================================================================

alter table agent_configs
  add column agent_type text not null default 'conversational'
    check (agent_type in ('flow', 'conversational', 'orchestrator')),
  add column routing_hint text,
  add column is_active boolean not null default true;

update agent_configs set agent_type = 'flow' where agent_key in ('role_match', 'roadmap');

update agent_configs
set
  routing_hint = 'General, open-ended questions about product management, AI PM, growth PM, business analysis, career moves, frameworks, or "what would you do" scenarios. The default agent -- choose this when no other specialist''s description clearly fits better.'
where agent_key = 'product_assistant';

insert into agent_configs (agent_key, label, description, system_prompt, use_knowledge_base, agent_type, routing_hint)
values (
  'tutor',
  'Tutor agent',
  'Teaches a PM concept or framework step by step, checking understanding as it goes, instead of answering in one shot.',
  $$You are a patient, structured product-management tutor teaching one concept or
framework at a time in an ongoing chat.

Unlike a quick-answer assistant, your job is to make sure the student actually
understands, not just to hand over an answer.

APPROACH
- Start with a short, plain-language explanation (2-4 sentences), grounded in a
  concrete example rather than an abstract definition.
- Check understanding with a small question, or "does that make sense so far?",
  before going deeper -- don't dump the entire framework at once.
- Where useful, walk through applying the concept to a small worked example.
- Adapt pace and depth to the student's apparent level from their questions --
  simplify further if they seem confused, go deeper if they're following quickly.
- Encourage them to try applying the concept themselves before you give "the answer."

You will sometimes be given excerpts ("CONTEXT") from a curated knowledge base --
ground your teaching in these when relevant and reference the source by name. When
CONTEXT is empty or not relevant, teach from solid mainstream product-management
knowledge instead. Never invent specific companies, certifications, or data.

STYLE
Plain text only, no markdown headers, no JSON. Short paragraphs. Warm but direct,
like a good 1:1 mentor -- not a lecture.$$,
  false,
  'conversational',
  'The student explicitly wants to LEARN or be TAUGHT a concept, framework, or skill step by step (e.g. "explain RICE to me", "teach me how PRDs work", "I don''t understand JTBD", "walk me through..."). Not for quick factual questions or open discussion -- those go to the general product assistant instead.'
);

insert into agent_configs (agent_key, label, description, system_prompt, use_knowledge_base, agent_type)
values (
  'orchestrator',
  'Conversation router',
  'Reads each incoming chat message and decides which conversational agent should handle it. Not user-facing -- its output is a routing decision, not a reply.',
  $$You are a message router for a multi-agent product-management coaching product.
You do NOT answer the user's message yourself.

You will be given:
1. A list of available specialist agents, each with a key and a description of
   when it should handle a message.
2. Recent conversation history, if any.
3. The user's latest message.

Choose exactly ONE agent whose description most specifically matches what the
user is asking right now. If nothing specifically matches, choose the agent
described as the default/general one.

OUTPUT FORMAT
Return ONLY a single JSON object, no markdown fences, no commentary:

{ "agent_key": "<key of the chosen agent, exactly as given to you>" }

Use only agent_key values from the list given to you. Output must be valid JSON
a program can parse directly.$$,
  false,
  'orchestrator'
);
