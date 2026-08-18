# Data Display -- Complete Reference

> Comprehensive guide to SaaS data display: dashboard layouts, KPI cards, data visualization, settings pages, notification systems, loading states, and error/success feedback. All patterns include specific measurements, real-world examples, and checkable audit items.

---

## 1. Dashboard Layouts

### Core Principles

1. **Clarity over complexity**: Every element must have a clear purpose. Apply the 5-Second Test -- users must grasp key insights within 5 seconds of viewing the dashboard.
2. **Action over information**: Dashboards must drive decisions, not just display data. Every metric should imply a next step.
3. **Speed over completeness**: Show the most important things first; let users drill down for details via progressive disclosure.

### F-Pattern Layout

Users naturally scan dashboards top-to-bottom and left-to-right in an F-pattern. Place the most critical KPI (the "North Star Metric") in the top-left position. This is premium real estate -- the element placed here receives the most visual attention.

### Grid Systems

Use a consistent 12-column or 16-column grid for visual rhythm and responsive adaptation. Ensure consistent spacing and alignment across all widgets. Use the 8pt spacing system for all padding and margins between dashboard elements.

| Spacing Context | Value |
|----------------|-------|
| Within a card (padding) | 16-24px |
| Between cards | 16-24px |
| Between sections | 32-48px |
| Page margins | 24-32px (desktop), 16px (mobile) |

### Dashboard Types

| Dashboard Type | Layout Pattern | Primary Elements |
|---------------|---------------|-----------------|
| **Executive** | 4-5 primary metric cards at top, 2-3 trend charts below, comparison visualizations, detail tables at bottom | KPI cards, line charts, summary tables |
| **Operational** | Real-time alerts banner at top, status metrics, time-series charts, event/activity logs | Status indicators, live feeds, alert banners |
| **Analytical** | Filter controls at top or side, summary metrics, multiple detailed charts, exportable data tables | Filters, scatter plots, heatmaps, pivot tables |

### Personalization and Customization

Modern dashboards must support:
- **Drag-and-drop widget rearrangement** for custom layouts
- **Global filtering** across all widgets simultaneously (e.g., date range selector affects everything)
- **Saved views/configurations** for different roles and tasks
- **Column/widget show-hide** to reduce noise
- **Role-based defaults**: Show different default layouts to admins vs. regular users vs. executives

### Responsive Dashboard Design

| Device | Approach |
|--------|----------|
| **Mobile (< 768px)** | Stack vertically, show only 3-4 critical metrics, collapse charts to summary numbers |
| **Tablet (768-1024px)** | 2-column grid with priority-based ordering |
| **Desktop (> 1024px)** | Full grid layout with complete data, side panels, and drill-down capability |

### Dashboard Layout Audit Checklist

- [ ] North Star Metric is positioned in the top-left area
- [ ] Primary dashboard shows 5-7 core metrics (not 20+)
- [ ] Every metric card includes comparison context (trend, percentage change, or vs. target)
- [ ] Dashboard passes the 5-Second Test (key insights graspable in 5 seconds)
- [ ] Layout uses a consistent grid system (12 or 16 columns)
- [ ] Spacing between elements follows the 8pt system
- [ ] Global date or filter controls are present and affect all widgets
- [ ] Drag-and-drop widget rearrangement is supported
- [ ] Saved views/configurations are available
- [ ] Dashboard adapts responsively across mobile, tablet, and desktop
- [ ] No chart or widget auto-refreshes without a visible timestamp or indicator
- [ ] Drill-down capability exists for every summary metric

---

## 2. KPI Cards / Metric Cards

### Required Components

Each KPI card must include:

| Element | Requirement | Specification |
|---------|-------------|---------------|
| **Primary number** | Large, readable, dominant visual element | Font size 24-36px, bold or semibold weight |
| **Label** | Clear descriptor of what the metric represents | Font size 12-14px, secondary text color |
| **Comparison context** | Change vs. previous period or target | Percentage change with directional arrow |
| **Trend indicator** | Color-coded directional signal | Green for positive, red for negative (with icon, not color alone) |
| **Sparkline** (optional) | Mini trend chart for at-a-glance direction | 50-80px wide, last 7-30 data points |
| **Time period** | When the data was collected | "Last 7 days", "This month", or a specific date range |

### Formatting Rules

- Use consistent number formatting across all cards: currency symbols, decimal places, abbreviations (1.2K, 3.4M)
- Right-align numbers within cards for easy comparison across adjacent cards
- Never show a raw number without comparison context -- a number alone is meaningless without knowing whether it is good or bad
- Use consistent card sizing: all KPI cards in a row should be the same height
- Limit primary dashboards to 4-6 KPI cards in the top row

### KPI Card Audit Checklist

- [ ] Every KPI card displays a large, readable primary number (24-36px)
- [ ] Every KPI card has a clear text label describing the metric
- [ ] Every KPI card includes comparison context (vs. previous period, vs. target)
- [ ] Trend indicators use both color and icon (not color alone)
- [ ] Number formatting is consistent across all cards (currency, decimals, abbreviations)
- [ ] Time period is displayed on every card
- [ ] Primary dashboard row contains 4-6 KPI cards maximum
- [ ] All KPI cards in a row are the same height
- [ ] KPI cards are clickable, linking to detailed drill-down views

---

## 3. Data Visualization

### Chart Selection Rules

Select the chart type based on the data relationship being communicated. Never select a chart type for aesthetic reasons.

| Data Relationship | Best Chart Type | Constraints and Rules |
|-------------------|----------------|----------------------|
| **Trends over time** | Line chart | Limit to 2-3 lines maximum; more lines become unreadable. Use clear color differentiation. |
| **Category comparison** | Vertical bar chart | Sort bars by value (not alphabetically). Use data labels on bars for exact values. Y-axis must start at zero. |
| **Parts of a whole** | Donut chart | Maximum 5 slices. Group small segments into "Other." Avoid pie charts with 6+ categories entirely. |
| **Distribution** | Histogram or box plot | Show median, quartiles, and outliers. Label axis ranges clearly. |
| **Correlation** | Scatter plot | Include trend line when correlation is meaningful. Label axes with units. |
| **Precise values** | Data table | Include sorting, filtering, and pagination. Right-align numbers, left-align text. |
| **Single metrics** | Large number card | Always include comparison context and trend direction. |
| **Progress/goals** | Progress bar or gauge | Show current value, target, and percentage complete. |

### Data-Ink Ratio

Maximize the proportion of ink (pixels) used to display actual data versus decoration. Remove chart junk:

- Remove unnecessary gridlines (keep only major gridlines if needed, at low opacity)
- Never use 3D chart effects (they distort perception and reduce accuracy)
- Remove decorative borders, shadows, and background fills that do not convey data
- Prefer direct labeling on data points over separate legends
- Every chart must have a descriptive title explaining what it shows

### Color in Visualizations

Use a three-tier color system:

1. **Semantic colors**: Green for positive/success, Red for negative/error, Yellow/Amber for warning. Reserve these for status indicators only.
2. **Data visualization colors**: 4-6 distinct, colorblind-safe hues for categorical data. Use a sequential palette (light to dark) for magnitude. Use a diverging palette (two hues) for positive/negative values.
3. **Neutral UI colors**: Grays for gridlines, axes, borders, and secondary text.

Never use color as the sole means of conveying information. Always pair color with patterns, labels, or icons. Test charts with colorblind simulation tools -- approximately 8% of men have color vision deficiency.

### Interactive Features

- **Hover tooltips**: Show exact values, labels, and context on hover. Tooltip must appear within 100ms.
- **Click-to-filter**: Allow clicking a chart segment to filter other dashboard elements.
- **Zoom**: Support zoom on dense time-series charts (date range selection or scroll zoom).
- **Export**: Provide CSV and PNG export for every chart.
- **Real-time indicator**: If data updates in real time, show a "Last updated" timestamp or a live pulse indicator.

### Data Visualization Audit Checklist

- [ ] Every chart has a descriptive title explaining what it shows
- [ ] Chart type matches the data relationship (line for trends, bar for comparison, etc.)
- [ ] Color is not the sole means of conveying information (icons or patterns supplement color)
- [ ] Y-axis starts at zero for bar charts
- [ ] Line charts use no more than 2-3 lines
- [ ] Donut/pie charts use no more than 5 slices
- [ ] Charts include hover tooltips showing exact values
- [ ] No 3D chart effects are used anywhere
- [ ] Loading skeleton is shown while chart data fetches
- [ ] Empty state provides guidance when no data exists for a chart
- [ ] Export option (CSV, PNG) is available for every chart
- [ ] Data visualization colors are colorblind-safe
- [ ] Direct labeling is used on charts where possible (over separate legends)
- [ ] Gridlines are minimal and low-opacity

---

## 4. Settings Pages

### Why Settings UX Matters

Settings pages are often the "junk drawer" of SaaS products. Bad settings UX destroys trust, especially in B2B SaaS where billing, permissions, and security configurations are high-stakes. Organize settings intentionally.

### Information Architecture

Organize settings into clear, logical categories:

| Category | Contains | Position |
|----------|----------|----------|
| **Profile / Account** | Name, email, avatar, password, 2FA | Top (most accessed) |
| **Billing & Plans** | Current plan, payment methods, invoices, upgrade/downgrade | Near top (high-stakes) |
| **Team & Permissions** | Members list, roles, invitations, role management | Upper section |
| **Notifications** | Email, push, in-app notification preferences | Middle section |
| **Integrations** | Connected apps, OAuth connections, webhooks | Middle section |
| **API & Developer** | API keys, tokens, usage, documentation links | Lower section |
| **Security** | SSO, session management, audit logs, login history | Lower section |
| **Preferences** | Theme, language, timezone, defaults | Lower section |
| **Danger Zone** | Account deletion, data export, workspace destruction | Bottom (visually separated) |

### Navigation Within Settings

- Use a left sidebar or vertical tab navigation within the settings area
- Group related items visually
- Place high-stakes items (Profile, Billing, Security) at the top where users scan first
- Show the current section with a clear active indicator
- Include a search bar for enterprise settings pages with more than 10 options
- Separate personal settings from organization/workspace settings

### Save Behavior

Choose one save pattern and apply it consistently throughout the entire product:

| Pattern | When to Use | Requirements |
|---------|-------------|-------------|
| **Auto-save** | Toggles, simple switches, preferences | Show "Saving..." / "Saved" indicator (like Google Docs). Include undo option. |
| **Explicit save** | Complex forms, billing info, security settings | Show a Save button. Warn on unsaved changes when navigating away. Disable Save until changes are made. |

Never mix auto-save and explicit save within the same settings area. Inconsistent patterns confuse users about whether their changes have been applied.

### The Danger Zone

For irreversible, destructive actions (account deletion, data purging, workspace destruction):

- Visually separate the danger zone from normal settings: red border or background tint, positioned at the very bottom of the page
- Use clear, specific labels: "Delete this organization and all its data" not just "Delete"
- Require friction proportional to severity:
  - Low risk: Simple confirmation dialog ("Are you sure?")
  - Medium risk: Type-to-confirm (type the project name to proceed)
  - High risk: Type-to-confirm + password re-entry + waiting period
- Explain consequences clearly before the action
- Offer data export before deletion
- Implement soft delete with a 30-day recovery window when possible
- Send email confirmation of destructive actions

### Real-World Examples

- **GitHub**: Settings with left sidebar, type-to-confirm for repository and organization deletion
- **Vercel**: Settings organized by Project, Team, and Account levels; type-to-confirm deletion
- **Stripe**: Dashboard settings with sidebar navigation, clear groupings, and breadcrumbs
- **Notion**: Workspace deletion moves to trash first with 30-day recovery

### Settings Page Audit Checklist

- [ ] Settings are organized into logical categories (not one flat list)
- [ ] Left sidebar or tab navigation is used within settings
- [ ] Search or filter is available for settings pages with more than 10 options
- [ ] Save confirmation is visible after every change (toast, inline message, or checkmark)
- [ ] Save behavior (auto-save or explicit save) is consistent throughout the product
- [ ] Unsaved changes trigger a warning when navigating away (for explicit save pages)
- [ ] Destructive actions are visually separated in a danger zone
- [ ] Destructive actions require confirmation proportional to severity
- [ ] High-stakes deletions require type-to-confirm
- [ ] Data export is offered before account or workspace deletion
- [ ] Personal settings are separated from organization settings
- [ ] Settings page is accessible without admin privileges (for user's own settings)
- [ ] Contextual help text or documentation links accompany complex settings

---

## 5. Notification Systems

### Notification Types

| Type | Use Case | Urgency | Persistence | Duration |
|------|----------|---------|-------------|----------|
| **Toast / Snackbar** | Feedback on user action (saved, copied, sent) | Low | Auto-dismiss | 3-5 seconds |
| **Banner** | System-wide announcements, maintenance, subscription alerts | Medium-High | Persistent | Until dismissed |
| **In-app notification center** | Activity feed, mentions, assignments, updates | Medium | Persistent in inbox | Until read |
| **Badge counts** | Unread counts on nav items (bell, inbox) | Low | Persistent | Until read |
| **Push / Browser** | Time-sensitive updates when user is away | High | OS-level | Until interacted with |
| **Email digest** | Summary for less-active users | Low | Delivered on schedule | N/A |

### Notification Specificity

Every notification must follow the actor-action-object pattern. Specific notifications are read and acted on; vague notifications are ignored.

| Instead of | Use |
|------------|-----|
| "Something changed" | "Sarah approved your design file" |
| "Update: status changed" | "Task 'Homepage redesign' moved to In Review by Alex" |
| "New comment" | "Maria commented on your pull request #142: 'Looks good, one suggestion...'" |
| "You have updates" | "3 new comments on 'Q1 Budget Proposal'" |

### Toast Messages

- Keep text under 30 characters or one line when possible
- Show at a consistent position (bottom-center or top-right)
- Auto-dismiss after 3-5 seconds
- Include an optional action link ("Undo", "View")
- Never stack more than 2-3 toasts simultaneously
- Never use toasts for errors that require user action (use inline errors or banners instead)
- Use `role="status"` and `aria-live="polite"` for accessibility

### Notification Center / Inbox

- Place the notification bell icon in the top-right navigation area
- Show unread count as a badge on the bell icon (use a number for counts under 100, "99+" for larger)
- Group notifications by time (Today, This Week, Earlier) or by type
- Support mark-as-read (individual and bulk) and "Mark all as read"
- Link each notification to its source context (clicking opens the relevant page)
- Show a preview of notification content without requiring a click
- Maintain read/unread visual distinction (bold text, dot indicator, or background shade)

### Notification Batching

Group related notifications into summaries instead of sending individually:
- "3 new comments on your document" instead of 3 separate notifications
- "5 team members joined your workspace" instead of 5 individual notifications
- Set batching windows of 5-15 minutes for non-urgent notifications

### Notification Preferences

Provide granular control over notification frequency and channels:

- Offer per-category controls (mentions, assignments, status changes, system alerts)
- Support per-channel toggles (in-app, email, push) for each category
- Provide preset modes for quick configuration:
  - **Calm mode**: Only critical notifications
  - **Regular mode**: Standard frequency
  - **Power-user mode**: Everything in real time
- Enable snoozing/pausing notifications for 1-24 hours
- Support muting specific sources (projects, channels, people)
- Offer daily/weekly digest as an alternative to real-time
- Default to conservative settings (users who want more can opt in)
- Present notification preferences during onboarding setup

### Notification System Audit Checklist

- [ ] Notification center (bell/inbox icon) is accessible from every screen
- [ ] Unread count badge is visible on the notification icon
- [ ] Each notification links to relevant source content
- [ ] Notification preferences page exists with per-category controls
- [ ] Per-channel controls (in-app, email, push) are available
- [ ] Read/unread states are visually distinct
- [ ] Bulk actions (mark all read) are available
- [ ] Notification text is specific (includes actor, action, and object)
- [ ] Related notifications are batched into summaries
- [ ] Toast messages auto-dismiss after 3-5 seconds
- [ ] Toasts include an undo action for reversible operations
- [ ] Toasts use `role="status"` or `role="alert"` for screen reader accessibility
- [ ] No notifications are sent for the user's own actions
- [ ] Notification preferences are surfaced during onboarding

---

## 6. Loading States

### Selection Framework

| Duration | Pattern | Implementation Details |
|----------|---------|----------------------|
| **Under 0.2 seconds** | No indicator needed | Render content directly; no flicker |
| **0.2-2 seconds** | Spinner or button loading state | Inline spinner, button text changes to "Saving...", disabled state |
| **2-10 seconds** | Skeleton screen | Match content layout shapes; left-to-right shimmer animation |
| **Over 10 seconds** | Progress bar | Show estimated time remaining; use slow-to-fast animation |

### Skeleton Screens

- Match the skeleton shape to actual content that will load (text blocks, image rectangles, avatar circles)
- Use left-to-right shimmer animation (research shows best perceived performance)
- Maintain the same layout dimensions as loaded content to prevent cumulative layout shift (CLS < 0.1)
- Show progressively: skeleton first, then partial data, then full content
- Use neutral gray tones (5-10% opacity fill) for skeleton elements

### Progress Bars

- Use slow-to-fast animation pattern (perceived as 11% faster than constant speed)
- Never let the progress bar freeze or jump backward
- Show estimated time remaining for operations over 30 seconds
- Allow cancellation for operations that support it
- Show item count for batch operations: "Processing 47 of 231 items"

### Accessibility Requirements for Loading States

- Use `aria-busy="true"` on loading containers to inform screen readers
- Apply `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` for progress bars
- Use `aria-live="polite"` regions to announce loading completion
- Respect `prefers-reduced-motion` by disabling shimmer animations
- Maintain keyboard navigation and focus management during loading transitions

### Loading State Audit Checklist

- [ ] No loading indicator appears for operations under 0.2 seconds
- [ ] Spinners are used for 0.2-2 second waits
- [ ] Skeleton screens are used for 2-10 second content loads
- [ ] Progress bars are used for operations exceeding 10 seconds
- [ ] Skeleton shapes match the layout of actual loaded content
- [ ] Shimmer animation moves left to right
- [ ] CLS remains under 0.1 during loading transitions
- [ ] Progress bars never freeze or move backward
- [ ] Long operations show estimated time remaining
- [ ] `aria-busy="true"` is applied to loading containers
- [ ] `prefers-reduced-motion` is respected

---

## 7. Error and Success Feedback

### Success States

- Confirm completed actions immediately and clearly
- Use green color + checkmark icon + descriptive text (never rely on a single signal)
- Show what was accomplished: "Invoice #1234 sent to client@example.com" not just "Success!"
- For important actions, show both a toast notification and update the UI state in place
- Include a relevant next action: "Invoice sent. [View invoice] [Send another]"

### Error States

- Show errors inline near the cause, not in a generic top-of-page alert
- Use the structure: What happened + Why it happened + What to do next
- Use plain language: "We couldn't save your changes. Check your internet connection and try again."
- Distinguish between:
  - **User errors** (validation): Show inline below the field with specific correction guidance
  - **System errors** (server failure): Show a banner or modal with retry option and support contact
- Never lose user input on error (preserve form state and field values)
- Use `role="alert"` and `aria-live="assertive"` for critical errors to announce them to screen readers

### Optimistic UI

Update the UI immediately as if the action succeeded, then reconcile with the server response in the background.

**When to use:**
- Actions with high success rates (over 99%): likes, toggles, status changes, message sends
- Actions where latency is noticeable but failure is rare

**When NOT to use:**
- Payment processing or financial transactions
- Actions requiring server-side validation (uniqueness checks, permission checks)
- Irreversible destructive actions

If the server rejects the action, roll back the UI and show a clear, specific error message explaining what happened.

### Confirmation Dialogs

Use confirmation dialogs for irreversible destructive actions and actions with significant side effects. Never use generic "Yes/No" button labels.

**Effective confirmation dialog anatomy:**
1. **Title**: Clear statement of the action -- "Delete project?"
2. **Description**: Consequences stated explicitly -- "This will permanently delete 'My Project' and all 47 associated tasks. This cannot be undone."
3. **Primary action button**: Labeled with the specific action ("Delete project"), styled as destructive (red background)
4. **Cancel button**: Always present, styled as secondary, labeled specifically ("Keep project")

For low-stakes reversible actions (archive, move, label), use an undo toast instead of a confirmation dialog. Show the undo option for 5-10 seconds before the action becomes permanent.

### Feedback Audit Checklist

- [ ] Every user action receives visible feedback (success confirmation or error message)
- [ ] Success messages describe what was accomplished (not just "Success!")
- [ ] Success messages include a relevant next action link
- [ ] Error messages use plain language and suggest a fix
- [ ] Error messages appear inline near the cause (not in a generic alert)
- [ ] Form errors preserve all user input (no data loss on error)
- [ ] System errors include a retry option and support contact
- [ ] Confirmation dialogs use specific button labels (not "Yes/No" or "OK/Cancel")
- [ ] Destructive action buttons are styled as destructive (red)
- [ ] Undo is available via toast for reversible actions (5-10 second window)
- [ ] Toasts do not stack more than 2-3 simultaneously
- [ ] Critical errors use `role="alert"` and `aria-live="assertive"`
- [ ] Success notifications use `role="status"` and `aria-live="polite"`

---

## 8. Data Tables in Dashboards

### Foundational Design

- **Text**: Left-aligned
- **Numbers**: Right-aligned
- **Headers**: Match their column's data alignment
- **Row clarity**: Use subtle zebra striping (5-10% gray alternating rows) or row dividers
- **Cell padding**: Minimum 8-12px horizontal, 8-16px vertical depending on density setting
- **Monospaced fonts**: Use for numeric and code columns

### Essential Features

| Feature | Requirement |
|---------|-------------|
| **Sorting** | Clickable column headers with ascending/descending indicators; persist sort state |
| **Filtering** | Quick-filter search above table + advanced multi-criteria filter panel |
| **Pagination** | Show items-per-page control (10, 25, 50, 100); display total count; show "Showing 1-25 of 1,204" |
| **Column customization** | Show/hide columns, column reordering, column pinning (freeze first column on scroll) |
| **Bulk actions** | Checkbox per row, select-all, contextual action bar with count ("3 items selected") |
| **Inline editing** | Direct cell modification with visual cues on hover (pencil icon); Tab key navigation between cells |
| **Export** | CSV and Excel export respecting current filters and sort order |
| **Search** | Search field above table, searching across all columns, with highlighted matching text |

### Responsive Table Design

- Display only essential columns by default on mobile
- Use card/stack layout on narrow screens (each row becomes a vertical card)
- Implement horizontal scrolling with sticky first column for medium screens
- Show a column count indicator: "Scroll to see 4 more columns"

### Performance for Large Datasets

- Use virtualization (render only visible rows) for tables with 1,000+ rows
- Implement server-side sorting, filtering, and pagination for 10,000+ rows
- Show loading indicators during data fetches
- Display data volume: "Showing 1-100 of 8,231"
- Use summary rows or subtotals for quick insights before raw data

### Data Table Audit Checklist

- [ ] Column headers are sortable with direction indicators (arrows/chevrons)
- [ ] Pagination is present with items-per-page control
- [ ] Total record count is displayed
- [ ] Table has a loading/skeleton state during data fetch
- [ ] Row actions are accessible via keyboard
- [ ] Text is left-aligned, numbers are right-aligned
- [ ] Table is responsive (horizontal scroll with sticky column, or card view on mobile)
- [ ] Column widths accommodate content without truncating critical fields
- [ ] Active filters are shown as removable chips with a "Clear all" option
- [ ] Result count updates to reflect active filters
- [ ] Export option is available (CSV, Excel)
- [ ] Bulk selection shows a count and contextual action bar
- [ ] Search field is prominently placed above the table
- [ ] Zero-result states include suggestions to broaden the search
