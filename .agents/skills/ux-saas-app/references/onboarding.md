# Onboarding -- Complete Reference

> Comprehensive guide to SaaS onboarding: time-to-value optimization, checklists, personalization, walkthroughs, empty states, skeleton screens, sample data, recovery sequences, and measurement metrics. All patterns include specific measurements, real-world examples, and checkable audit items.

---

## 1. The Stakes

40-60% of users who sign up for a SaaS product never return after their first login. Strong onboarding reduces 30-day churn from 15-20% to 7-10%. Every 1% increase in activation rate drives roughly 2% lower churn. Well-structured onboarding boosts retention by up to 50%.

These numbers make onboarding the single highest-leverage UX investment for any SaaS product. The first session determines whether a user becomes active or disappears.

---

## 2. Time to Value (TTV)

### The 3-Minute / 3-Step Rule

Get users to their "aha moment" -- the first time they experience the product's core value -- as fast as possible. The best onboarding achieves this in under 3 minutes or 3 steps for the core activation event.

### Benchmarks

| TTV Range | Assessment | Retention Impact |
|-----------|-----------|-----------------|
| Under 15 minutes | Excellent | 4-5x improved Day 7 retention |
| 15-60 minutes | Good for most products | 2-3x improved Day 7 retention |
| 1-24 hours | Acceptable for complex products only | Baseline retention |
| Over 24 hours | High abandonment risk | Severe drop-off |

### How to Measure

Track the median time between account creation and the defined activation event. The activation event varies by product:
- CRM: "Added first contact"
- Analytics tool: "Created first dashboard"
- Project management: "Created first project and added a task"
- Communication tool: "Sent first message in a channel"

### How to Identify the Activation Event

Correlate early user behaviors with 30/60/90-day retention. The behavior most strongly correlated with long-term retention is the activation event. Run cohort analysis segmenting users who performed each candidate behavior versus those who did not.

### TTV Optimization Checklist

- [ ] Core activation event is defined and documented
- [ ] Median TTV is tracked and reported
- [ ] Users can reach the activation event within 3 steps or 3 minutes
- [ ] No mandatory steps exist between signup and the activation event that do not directly contribute to value delivery
- [ ] Time-to-value is segmented by user role, plan tier, and acquisition source
- [ ] Improvement targets are set and experiments are running

---

## 3. Onboarding Checklists

Checklists clarify "what should I do next?" and gamify progress. They work because the Zeigarnik effect compels people to finish incomplete tasks.

### Structure

- Include 5-7 items (fewer than 5 feels trivial; more than 7 feels overwhelming)
- Put a quick win first to build momentum
- Pre-complete the first task to create a sense of progress (endowed progress effect -- starting at 1/5 feels more motivating than starting at 0/4)
- Mix required and optional tasks
- Order remaining items by ascending difficulty
- End with a collaborative or sharing action (invite teammate, share result)

### Progress Bars

Show visible completion progress at all times. Progress indicators increase completion rates by 20-30%. Display as a percentage, fraction (3/5), or visual progress bar. Update immediately when a task is completed.

The progress bar must be visible without scrolling. Position it at the top of the checklist or in a persistent sidebar widget.

### Persistence

- Persist checklist state across sessions (do not reset on revisit)
- Mark completed items visually with checkmarks and strikethroughs
- Allow users to dismiss the checklist entirely when they are ready
- Re-surface the checklist if the user returns without completing it
- Store progress server-side so it syncs across devices

### Completion Celebration

Display a brief congratulatory message when the checklist is finished. Show a summary of what the user accomplished. Transition to a "next steps" suggestion or link to advanced features. Avoid excessive celebration that feels patronizing.

### Real-World Examples

- **Notion**: Setup checklist increases completion to 60% with a 40% retention bump at 30 days
- **Figma**: Interactive onboarding has users create actual files, draw shapes, and invite collaborators; achieves 65% activation rates

### Checklist Audit Checklist

- [ ] Checklist contains 5-7 items
- [ ] First item is a quick win that can be completed in under 30 seconds
- [ ] First task is pre-completed (endowed progress effect)
- [ ] Progress indicator (bar, fraction, or percentage) is always visible
- [ ] Completed items show a checkmark and strikethrough
- [ ] Checklist state persists across sessions and devices
- [ ] Checklist is dismissible by the user
- [ ] Checklist can be re-accessed from a help menu or settings page
- [ ] A completion celebration appears when all tasks are done
- [ ] Completion rate is tracked and reported as a metric

---

## 4. Personalization

### Why Personalize

Ask user role or intent upfront and customize the onboarding flow. Personalized onboarding lifts 7-day retention by approximately 35%. Users who receive a tailored experience activate faster because they see only what is relevant to their use case.

### Implementation

- Ask 2-3 questions maximum during the welcome screen
- Frame questions around the user's goal, not their demographics: "What will you use [Product] for?" not "What is your company size?"
- Offer 3-4 answer options per question (do not overwhelm with choices)
- Use answers to customize: default dashboard layout, onboarding checklist items, feature highlights, template suggestions, and sample data

### Example Personalization Questions

| Question | Example Options | Customization Impact |
|----------|----------------|---------------------|
| "What is your role?" | Designer, Developer, Manager, Executive | Default dashboard layout, feature emphasis |
| "What will you use [Product] for?" | Project management, Reporting, Collaboration, Automation | Checklist items, template suggestions |
| "How large is your team?" | Just me, 2-10, 11-50, 50+ | Collaboration features visibility, onboarding steps |

### Skip Option

Always allow users to skip personalization questions. Some users want to explore independently. Default to a general-purpose onboarding path when questions are skipped.

### Personalization Audit Checklist

- [ ] Personalization survey contains 2-3 questions maximum
- [ ] Questions focus on user goals, not demographics
- [ ] Each question offers 3-4 answer options
- [ ] Answers visibly change the onboarding experience (different checklists, templates, or dashboard defaults)
- [ ] Skip option is available on every personalization question
- [ ] A default onboarding path exists for users who skip personalization
- [ ] Personalization choices can be changed later in settings

---

## 5. Interactive Walkthroughs

### Why Interactive Beats Passive

Interactive walkthroughs where users perform real actions cut time-to-value by 40% compared to passive video tours. Users learn by doing, not by watching. Interactive onboarding also produces real output (a created project, a configured setting), so the user has immediate evidence of value.

### Implementation Rules

- Let users take real actions on actual UI elements (not simulated or grayed-out interfaces)
- Use tooltips that point directly to relevant UI elements
- Limit walkthroughs to 3-5 steps maximum; each tooltip must be one sentence
- Show one tooltip per screen to avoid overwhelming the user
- Trigger tooltips on behavior (user reaches a specific state) rather than on page load
- Dismiss tooltips permanently after use (do not re-show on subsequent visits)
- Contextual tooltips appearing at the right moment reduce per-step drop-off by 28%

### Setup Wizards / Multi-Step Flows

- Keep flows under 7 steps; longer ones become discouraging
- Show progress indicators ("Step 3 of 5") -- increases completion rates by 30-50% via the Zeigarnik effect
- Allow backward navigation to review or edit previous steps
- Save progress automatically so users can resume later if they leave
- Validate each step before allowing progression to the next
- Keep each step focused on a single topic or group of related inputs
- Show a summary or review step before final submission

### Walkthrough Audit Checklist

- [ ] Walkthrough uses interactive steps where users perform real actions
- [ ] Walkthrough is limited to 3-5 steps
- [ ] Each tooltip is a single sentence
- [ ] Only one tooltip appears per screen at a time
- [ ] Tooltips point directly to the relevant UI element
- [ ] Tooltips dismiss permanently after interaction
- [ ] Progress indicator ("Step X of Y") is visible during multi-step flows
- [ ] Backward navigation is supported to review previous steps
- [ ] Progress is saved automatically (user can resume later)
- [ ] Walkthrough is skippable at any step

---

## 6. Empty States

Empty states are critical onboarding moments. They occur before users have data and represent the first impression of each product area. Never show a blank screen.

### Three Types of Empty States

| Type | Trigger | Design Goal |
|------|---------|-------------|
| **First-use empty** | User has not created any data in this area | Explain value, show CTA to create first item, offer templates or sample data |
| **User-cleared empty** | User has completed or removed all items | Celebrate completion, suggest next actions, maintain positive tone |
| **Error empty** | Data failed to load or an error occurred | Explain what went wrong, provide retry action, offer support contact |

### Required Components

Every empty state must include:

1. **Explanation** (1-2 sentences): Describe what this area is and what value it provides. "This is where your team's projects live. Create a project to start tracking progress."
2. **Visual** (optional but recommended): An illustration, icon, or preview mockup showing what the area will look like when populated. Illustrations should feel welcoming, not broken.
3. **Primary CTA** (mandatory): One clear action button to help the user populate the area. "Create your first project", "Import data", "Connect an integration."
4. **Shortcuts** (optional): Offer templates, sample data, or quick-start options. "Start from a template" or "Try with sample data."

### Tone

Use encouraging, action-oriented language. Never blame the user or use clinical language.

| Instead of | Use |
|------------|-----|
| "No data found" | "No projects yet. Create your first project to get started." |
| "Error: empty result set" | "We couldn't load your data. Try refreshing the page." |
| "Nothing here" | "You're all caught up! We'll notify you when something needs attention." |

### Real-World Examples

- **Canva**: Displays templates instead of a blank canvas, converting 75% of first sessions vs. 40% without prompting
- **Notion**: Empty pages show suggestions for templates and content types
- **Slack**: Empty channels explain purpose and suggest posting the first message

### Empty State Audit Checklist

- [ ] Every list, table, and content view has a designed empty state (no blank screens)
- [ ] First-use empty states include descriptive text explaining the area's purpose
- [ ] Every empty state includes a primary CTA action button
- [ ] Empty states use an illustration or preview content to show what will appear
- [ ] Tone is positive and action-oriented (not "No data found")
- [ ] Error empty states include a retry action and support link
- [ ] User-cleared empty states celebrate completion and suggest next actions
- [ ] Templates or sample data shortcuts are offered where relevant
- [ ] Empty states are visually consistent across the entire product
- [ ] Empty state CTAs have been tested for click-through rates

---

## 7. Skeleton Screens

### When to Use

Display skeleton placeholders while content is loading. Skeleton screens reduce perceived loading time and cognitive load compared to spinners. Use them for content-heavy pages where loading takes 0.5-3 seconds.

### Implementation Rules

- Match the skeleton shape to the actual content that will load (text blocks, card shapes, avatar circles)
- Use left-to-right shimmer animation (research shows this direction performs better than alternatives for perceived speed)
- Show skeleton screens instead of spinners for page-level and section-level loads
- Transition smoothly from skeleton to real content (fade or replace, never flash)
- Use neutral gray tones (5-10% opacity) for skeleton elements
- Maintain the same layout structure in the skeleton as the loaded content to prevent cumulative layout shift (CLS < 0.1)

### Loading State Selection Framework

| Duration | Pattern | Implementation |
|----------|---------|---------------|
| Under 0.2 seconds | No indicator needed | Render content directly |
| 0.2-2 seconds | Spinner or subtle indicator | Button loading state, inline spinner |
| 2-10 seconds | Skeleton screen with shimmer animation | Page/section load, dashboard widgets |
| Over 10 seconds | Progress bar with estimated time | File upload, data export, bulk operations |

### Skeleton Screen Audit Checklist

- [ ] Skeleton screens are used for page and section loads exceeding 0.5 seconds
- [ ] Skeleton shapes match the layout of actual content
- [ ] Shimmer animation moves left to right
- [ ] Transition from skeleton to real content is smooth (no layout shift)
- [ ] CLS remains under 0.1 during skeleton-to-content transitions
- [ ] Spinners are reserved for short waits under 2-3 seconds
- [ ] Progress bars are used for operations exceeding 10 seconds
- [ ] Loading states respect `prefers-reduced-motion` by disabling shimmer animation
- [ ] `aria-busy="true"` is applied to loading containers for screen reader accessibility

---

## 8. Sample Data / Sandbox Mode

### Purpose

Pre-populate dashboards and features with realistic sample data so users can see what the product looks like in use before they invest time creating their own data. Sample data demonstrates the value proposition immediately and gives users a mental model of what they are building toward.

### Implementation Rules

- Label sample data clearly and visibly: "This is sample data -- replace with your own"
- Use realistic but obviously fictional data (avoid "John Doe" or "test@test.com"; use plausible names, companies, and metrics)
- Allow one-click clearing of all sample data when the user is ready
- Provide a "Start fresh" option alongside the sample data experience
- Sample data should populate dashboards, charts, tables, and reports so every area of the product feels alive
- Never mix sample data with real user data -- make the distinction unambiguous

### Sample Data Audit Checklist

- [ ] Sample data is available for new users who have not yet created their own content
- [ ] Sample data is clearly labeled as sample or demo content
- [ ] Sample data populates all major features (dashboards, tables, charts)
- [ ] One-click clearing of sample data is available
- [ ] A "Start fresh" option exists alongside sample data
- [ ] Sample data uses realistic but clearly fictional content
- [ ] Sample data is never mixed with real user data

---

## 9. Multi-Channel Recovery Sequences

Email sequences recover 22% of drop-offs from onboarding. Connect emails to in-app behavior so each message references the user's actual next step, not a generic message.

### Recommended Cadence

| Day | Subject | Content |
|-----|---------|---------|
| Day 0 | Welcome + quick win | Welcome the user, highlight one quick action they can take right now |
| Day 1 | Finish setup reminder | Reference the specific onboarding step they stopped at |
| Day 3 | Feature highlight | Showcase a key feature relevant to their stated role or goal |
| Day 5 | Social proof / success story | Share a customer success story or metric from a similar user |
| Day 7 | Help check-in | Offer direct support, ask if they need help, provide a calendar link |

### Recovery Sequence Requirements

- Reference the user's specific onboarding progress in every email
- Include a single, clear CTA per email (not multiple competing links)
- Stop the sequence once the user completes activation
- Segment recovery messages by persona or stated goal
- Track email open rates, click-through rates, and recovery-to-activation conversion

### Recovery Sequence Audit Checklist

- [ ] Recovery email sequence is configured for users who drop off during onboarding
- [ ] Emails reference the user's specific onboarding progress
- [ ] Each email contains a single clear CTA
- [ ] Sequence stops automatically upon activation
- [ ] At least 5 emails are configured over the first 7 days
- [ ] Recovery-to-activation conversion rate is tracked

---

## 10. Skip Options

### Principle

Always allow users to skip or dismiss onboarding. Power users want to explore independently. Forcing onboarding creates friction and frustration for experienced users who already understand the product category.

### Implementation Rules

- Provide "Skip for now" or "I'll do this later" on every onboarding step
- Use dismissible UI (X button on checklists, "Skip tour" on walkthroughs)
- Never block product access behind mandatory onboarding completion
- Store skip state so the same step is not re-prompted on next visit
- Provide a way to re-access onboarding content later (help menu, settings, or a "Getting Started" page)
- Let users skip individual steps without abandoning the entire flow

### Skip Option Audit Checklist

- [ ] Every onboarding step has a visible skip or dismiss option
- [ ] Skipping a step does not block access to the product
- [ ] Skip state is persisted (skipped steps do not re-appear on next session)
- [ ] Onboarding content is re-accessible from a help menu or settings page
- [ ] Individual steps can be skipped without abandoning the entire onboarding flow
- [ ] Skipping does not prevent the user from completing other onboarding steps later

---

## 11. Measurement Framework

### Primary Onboarding Metrics

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| **Onboarding completion rate** | Percentage of users who finish the checklist or walkthrough | 60%+ |
| **Time to value (TTV)** | Median time from signup to activation event | Under 15 minutes (excellent) |
| **Activation rate** | Percentage of signups who reach the "aha moment" | 60%+ (excellent), 40-60% (good) |
| **7-day retention** | Percentage of signups active 7 days later | 40%+ (good) |
| **30-day retention** | Percentage of signups active 30 days later | 25%+ (good) |
| **Step-level drop-off** | Where users abandon the onboarding flow | Identify and fix steps with >20% drop-off |

### Segmentation Requirements

Analyze all onboarding metrics by:
- User role or persona (from personalization questions)
- Plan tier (free, paid, enterprise)
- Acquisition source (organic, paid, referral)
- Company size
- Geography and timezone

### Measurement Audit Checklist

- [ ] Onboarding completion rate is tracked and reported
- [ ] Time to value is measured from signup to activation event
- [ ] Activation rate is defined, tracked, and reviewed regularly
- [ ] 7-day and 30-day retention are tracked with onboarding as a variable
- [ ] Step-level drop-off is analyzed to identify friction points
- [ ] All metrics are segmented by role, plan tier, and acquisition source
- [ ] Improvement targets are documented and experiments are running
- [ ] Onboarding metrics are reviewed at least monthly
