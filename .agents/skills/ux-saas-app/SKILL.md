---
name: ux-saas-app
description: Use this skill whenever the user mentions SaaS, dashboard, web application, app interface, onboarding, notifications, settings page, empty states, sidebar navigation, command palette, user retention, feature adoption, or any application interface where users log in and perform tasks repeatedly. Also use when designing or reviewing any authenticated web app — even if the user doesn't say "SaaS". If it has a sidebar, a dashboard, or user settings, this skill applies.
metadata:
  mcpmarket-version: 1.0.0
---
# SaaS Application UX Design

This skill provides a complete framework for designing, evaluating, and optimizing SaaS application interfaces. It covers navigation architecture, onboarding flows, dashboard layouts, data display, notification systems, settings pages, and the UX metrics that drive SaaS retention and growth.

Apply these principles to any web application whose primary purpose is delivering ongoing software value to users -- including B2B tools, productivity apps, internal platforms, analytics products, and collaboration software.

---

## Navigation Decision Tree

Select the navigation pattern based on product complexity and usage context:

| Condition | Pattern | Rationale |
|-----------|---------|-----------|
| 5-15+ sections, deep hierarchy, frequent tab-switching | **Left sidebar** | Vertical scanning is faster; accommodates growth; remains visible during scroll |
| Fewer than 7 primary sections, content-focused product | **Top navigation** | Takes approximately 6% of screen real estate vs. 15-20% for sidebar; cleaner for simple structures |
| Enterprise platform with multiple modules, each with deep features | **Hybrid (top + side)** | Top bar for module switching, sidebar for feature-level navigation within active module |
| Power users performing repetitive actions across many pages | **Command palette (Cmd+K)** | 10x faster than menu navigation; improves power user retention by 40%+ |

### Sidebar Navigation (Primary SaaS Pattern)

The collapsible left sidebar is the dominant SaaS navigation pattern, used by Slack, Notion, Linear, and Asana.

- Use a 2-level structure: primary categories in the sidebar, sub-navigation contextually within the main content area
- Support collapsible icon-only mode for power users who want more screen real estate
- Persist sidebar state (open/collapsed) between sessions
- Place workspace or account switcher at the top, settings and profile at the bottom
- Group related items under collapsible sections with clear category labels
- Separate primary actions (Dashboard, Projects) from utility actions (Settings, Help)
- Show the current location with a visually distinct active indicator (color, weight, or border)

### Top Navigation

- Limit to 5-8 top-level items maximum
- Include a persistent global search in the top bar
- Place user profile/avatar, notifications bell, and help icon in the top-right corner
- Use dropdowns for sub-navigation when needed

### Command Palette (Cmd+K)

- Include both navigation AND actions (page links, "Create new project", "Export data")
- Show recent and frequent items at the top before the user types
- Implement fuzzy search for typo-tolerant matching
- Display keyboard shortcuts alongside actions for progressive learning
- Group results by category (Pages, Actions, Settings, Team Members)
- Make the Cmd+K shortcut visibly discoverable in the UI (show it in the search bar placeholder)

> Full navigation reference with breadcrumbs, tabs, mobile patterns, and audit checklists: see `references/navigation-patterns.md`

---

## SaaS UX Metrics

Track these five metrics to measure the health of a SaaS application's user experience:

### 1. Time to Value (TTV)

Measure the duration from signup to first meaningful outcome. Target under 3 minutes for the core activation event. Under 15 minutes yields 4-5x improved Day 7 retention compared to over 24 hours.

| TTV Range | Assessment |
|-----------|-----------|
| Under 15 minutes | Excellent |
| 15-60 minutes | Good for most products |
| 1-24 hours | Acceptable for complex products only |
| Over 24 hours | High abandonment risk |

### 2. Activation Rate

Track the percentage of signups who reach the "aha moment." Target 60%+ for excellent performance. Every 1% increase in activation correlates with roughly 2% lower churn. Non-activated users retain at only 10-20% by Day 30, while activated users retain at 60-80%.

### 3. Feature Adoption Rate

Measure unique users of a feature divided by total active users. Target 60%+ for core features and 20%+ for advanced features. Track breadth (how many use it), depth (how frequently), and time to adopt (how long after signup).

### 4. Task Completion Rate

Target 90%+ for core tasks. Below 80% indicates significant usability issues. Define critical user tasks, track completion, abandonment, and error rates, and use funnel analysis to identify drop-off points.

### 5. Error Rate

Track form validation errors per session, failed action attempts, rage clicks (multiple rapid clicks on the same element), and support tickets containing "how do I" questions. Every error is a design opportunity -- map errors to UI elements and prioritize redesign by frequency and severity.

---

## Onboarding Essentials

40-60% of SaaS users who sign up never return after their first login. Strong onboarding reduces 30-day churn from 15-20% to 7-10%.

### The 3-Minute / 3-Step Rule

Get users to the core value ("aha moment") within 3 minutes or 3 steps. Interactive walkthroughs where users perform real actions cut time-to-value by 40% compared to passive tours.

### Personalization

Ask 1-2 questions about role or intent upfront to customize the onboarding path. Personalized onboarding lifts 7-day retention by approximately 35%. Never exceed 3 personalization questions.

### Checklists

Display a visible onboarding checklist with 5-7 items. Show progress (3/5 completed). Pre-complete the first task to create momentum (endowed progress effect). Persist the checklist across sessions. Mix required and optional tasks. Checklists with visible progress bars increase completion rates by 20-30%.

### Empty States

Design every empty state as an onboarding opportunity. Include an explanation of what appears in the area, a clear CTA button, and an optional illustration or sample data. Handle three types: first-use empty (no data yet), user-cleared empty (all tasks done), and error empty (something failed).

### Skip Options

Always allow users to skip or dismiss onboarding. Power users want to explore independently. Provide "Skip for now" or "I'll do this later" on every step. Make onboarding re-accessible from help menus.

> Full onboarding reference with setup wizards, skeleton screens, recovery sequences, and measurement frameworks: see `references/onboarding.md`

---

## Dashboard and Data Display

### KPI Layout

Place the North Star Metric in the top-left position (highest attention zone in F-pattern scanning). Limit primary dashboards to 5-7 core metrics. Apply the 5-Second Test: users must grasp key insights within 5 seconds.

Each KPI card must include:
- A large, readable number as the primary element
- A clear label describing the metric
- Comparison context (vs. last period, vs. target)
- A trend indicator (percentage change with directional arrow)

### Chart Selection

| Data Type | Best Chart | Constraint |
|-----------|-----------|------------|
| Trends over time | Line chart | Limit to 2-3 lines maximum |
| Category comparison | Bar chart | Sort by value; Y-axis starts at zero |
| Parts of a whole | Donut chart | Maximum 5 slices; avoid pie charts with 6+ categories |
| Precise values | Data table | Include sorting, filtering, pagination |
| Single metrics | Large number card | Always include comparison context |

### Notification Systems

Make every notification specific and actionable. "Sarah approved your design" outperforms "Update: status changed." Batch related notifications into summaries. Provide per-category notification preferences with channel controls (in-app, email, push). Place the notification bell icon in the top-right with an unread count badge.

### Settings Pages

Organize settings into clear categories: Profile/Account, Billing, Team/Permissions, Notifications, Integrations, Security, and a visually separated Danger Zone at the bottom. Use a left sidebar or vertical tab navigation within settings. Apply consistent save behavior throughout -- either auto-save with visual confirmation or explicit Save button, never both in the same product.

> Full data display reference with dashboard layouts, visualization rules, settings patterns, notification design, and loading states: see `references/data-display.md`

---

## SaaS Anti-Patterns

Flag these issues as high-severity problems in any SaaS application audit:

- **Mandatory multi-step tutorials** before any product access -- users must reach value fast, not complete a course
- **Hamburger menus on desktop** -- hides navigation discoverability; acceptable only on mobile
- **More than 7-9 top-level navigation items** -- violates Miller's Law and creates decision paralysis
- **Numbers without context** -- raw metrics displayed without comparison, trend, or time period
- **Blank empty states** -- showing "No data" instead of designed guidance with a CTA
- **Vague notifications** -- "Something changed" instead of specific actor-action-object messages
- **Settings as junk drawer** -- one flat list of all settings without categories, search, or grouping
- **Destructive actions without confirmation** -- delete, remove, or cancel without stating consequences
- **Inconsistent save patterns** -- auto-save on some pages and explicit save on others within the same product
- **No onboarding re-entry** -- onboarding that runs once with no way to replay or access help later

---

## Reference Files

For detailed, audit-ready content on each topic, consult:

| File | Contents |
|------|----------|
| `references/navigation-patterns.md` | Sidebar navigation, top navigation, command palettes, breadcrumbs, tabs, mobile navigation, grouping and hierarchy with checkable audit items |
| `references/onboarding.md` | Time-to-value optimization, checklists, personalization, walkthroughs, empty states, skeleton screens, and measurement metrics with checkable audit items |
| `references/data-display.md` | Dashboard layouts, KPI cards, chart selection, settings pages, notification systems, loading states, and error/success feedback with checkable audit items |
