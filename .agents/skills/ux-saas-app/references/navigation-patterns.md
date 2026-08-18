# Navigation Patterns -- Complete Reference

> Comprehensive guide to SaaS application navigation: sidebar patterns, top navigation, command palettes, breadcrumbs, tabs, mobile navigation, and navigation hierarchy. All patterns include specific measurements, real-world examples, and checkable audit items.

---

## 1. Sidebar Navigation (Vertical)

The collapsible left sidebar is the dominant navigation pattern in modern SaaS applications. It is used by Slack, Notion, Linear, Asana, and the majority of B2B tools shipping today.

### When to Use

- Complex products with 5-15+ sections
- Deep hierarchies requiring nested navigation
- Frequent tab-switching between many areas
- Applications where navigation must remain visible during content scrolling

### Why It Works

Sidebars remain visible while the user scrolls content. Vertical scanning is faster than horizontal scanning -- users can perceive more items in a single visual fixation when items are stacked vertically. Sidebars accommodate nested menus and lengthy labels, and they scale vertically as features grow without hitting horizontal space constraints.

There is a significant industry shift back toward collapsible left sidebars from horizontal top navigation because they support vertical scalability. A sidebar takes approximately 15-20% of screen real estate in expanded mode, but collapses to 3-5% in icon-only mode.

### Structure

#### Two-Level Architecture

Use a 2-level structure:
1. **Primary categories** in the sidebar (Dashboard, Projects, Messages, Reports)
2. **Sub-navigation** rendered contextually within the main content area (tabs, secondary sidebars, or section headers)

Never nest beyond 3 levels in the sidebar itself. If deeper hierarchy is required, render sub-levels in the content area or use breadcrumbs.

#### Icon + Label Pairs

Every sidebar item must display both an icon and a text label in expanded mode. Icon-only navigation (without labels) has measurably lower discoverability -- users cannot reliably identify meaning from icons alone. When collapsed to icon-only mode, provide tooltips on hover showing the full label.

- Use consistent icon sizing (20-24px)
- Maintain 8-12px spacing between icon and label
- Use a single icon style throughout (outline or filled, not mixed)

#### Grouping and Sections

Cluster related items under clear category labels. Separate primary actions from utility actions:

| Group | Example Items | Position |
|-------|--------------|----------|
| **Workspace** | Workspace switcher, search | Top of sidebar |
| **Primary navigation** | Dashboard, Projects, Messages, Reports | Upper section |
| **Secondary navigation** | Templates, Integrations, Analytics | Middle section |
| **Utility** | Settings, Help, Profile | Bottom of sidebar |

Use collapsible section headers with expand/collapse toggles. Persist the expand/collapse state between sessions so users do not lose their customization.

#### Collapsible Mode

- Support toggling between expanded (icon + label) and collapsed (icon-only) modes
- Collapse automatically on viewports below 1024px
- Persist the user's collapse preference in local storage or account settings
- Provide a visible toggle button (chevron or hamburger icon) at the top or bottom of the sidebar
- In collapsed mode, show tooltips on hover for every item
- In collapsed mode, expand nested sections into a flyout panel on hover or click

#### Visual Indicators

- Highlight the current/active page with a distinct visual treatment: background color fill, left border indicator (3-4px), bolder text weight, or a combination
- Use a different color or opacity for hover state
- Show unread counts or badges on items with pending activity (e.g., Messages: 3)
- Dim or hide items the user's role does not have permission to access

### Real-World Examples

- **Notion**: Collapsible sidebar with workspace switcher at top, nested page tree below, favorites and recent sections. Pages can be infinitely nested. Sidebar width is user-resizable.
- **Linear**: Minimal sidebar with workspace, teams, and views. Uses icons + labels; collapses to icon-only on narrow screens. Favorites section at top.
- **Slack**: Left sidebar organizes channels, DMs, and apps. Sections are collapsible. Custom sections allow user organization. Unread badges on channels.
- **Asana**: Sidebar for Home, My Tasks, Inbox, Projects with expandable project sections and favoriting.

### Sidebar Navigation Audit Checklist

- [ ] Sidebar uses icon + label pairs for all items in expanded mode
- [ ] Collapsed (icon-only) mode is supported with tooltips on hover
- [ ] Current/active page has a visually distinct indicator (background, border, or weight)
- [ ] Sidebar collapse state persists between sessions
- [ ] Related items are grouped under clear section headers
- [ ] Workspace/account switcher is positioned at the top
- [ ] Settings and profile are positioned at the bottom
- [ ] Navigation items do not exceed 3 levels of nesting within the sidebar
- [ ] Sidebar is keyboard-navigable (Tab, Arrow keys, Enter)
- [ ] Items hidden by role-based access do not appear as disabled (they are removed entirely)
- [ ] Unread counts or activity badges are visible on relevant items
- [ ] Sidebar width is reasonable (200-280px expanded, 48-64px collapsed)

---

## 2. Top Navigation (Horizontal)

### When to Use

- Simpler products with 3-7 primary categories
- Marketing sites or content-focused products where the sidebar would be excessive
- As a complement to a sidebar in hybrid navigation architectures

### Specifications

- Limit to 5-8 top-level items maximum (Miller's Law: 7 plus or minus 2)
- Top navigation takes approximately 6% of screen real estate vs. 15-20% for a sidebar
- Place the primary logo/brand mark on the far left
- Include a persistent global search input in the top bar (minimum 200px wide)
- Place user profile/avatar, notifications bell, and help icon in the top-right corner
- Use dropdowns or mega menus for sub-navigation, but avoid mega menus with more than 2 columns
- Maintain a minimum nav bar height of 48-64px
- Ensure horizontal space constrains are respected -- items must not wrap or overflow on 1024px viewports

### Real-World Examples

- **HubSpot**: Horizontal nav organizes modules (Contacts, Marketing, Sales) with dropdown sub-features
- **Mailchimp**: Top nav for primary sections, keeping the interface clean for content-focused workflows

### Top Navigation Audit Checklist

- [ ] Top-level navigation items number 7 or fewer
- [ ] Active/current section has a visual indicator (underline, highlight, or bold)
- [ ] Global search is present and always visible on desktop
- [ ] User profile, notifications, and help icons are in the top-right area
- [ ] Navigation does not wrap or overflow on 1024px viewport
- [ ] Dropdown menus appear on hover or click with a maximum depth of 2 levels
- [ ] Navigation bar height is between 48-64px
- [ ] All navigation items are accessible via keyboard

---

## 3. Command Palette (Cmd+K / Ctrl+K)

### When to Use

Command palettes serve complex applications where power users want to move fast. They are especially valuable when users perform repetitive actions or navigate between many pages. Command palettes improve power user retention by 40%+ and are 10x faster than navigating menus.

### Implementation Requirements

#### Content to Index

Index these item types and display them in grouped results:

| Category | Examples |
|----------|---------|
| **Pages** | Dashboard, Settings, Team Members, Billing |
| **Actions** | Create new project, Export data, Invite teammate |
| **Settings** | Change theme, Update notifications, Manage API keys |
| **Recent items** | Last 5-10 visited pages or modified objects |
| **Team members** | Search people by name for quick assignment or messaging |
| **Contextual commands** | Status changes, label application, assignee updates |

#### Search Behavior

- Show recent and frequent items before the user types anything
- Implement fuzzy search to match items even with typos or partial matches
- Begin showing results after the first character
- Debounce input at 100-150ms for responsive feel
- Support nested commands (e.g., type "status" to see all status-change actions)
- Display keyboard shortcuts alongside actions for progressive learning

#### UI Specifications

- Open with Cmd+K (macOS) / Ctrl+K (Windows/Linux)
- Center the palette vertically in the upper third of the viewport
- Use a modal overlay with backdrop dimming
- Input field at the top with placeholder text: "Type a command or search... (Cmd+K)"
- Results list below with category headers and keyboard navigation (Arrow keys + Enter)
- Close on Escape, backdrop click, or action selection
- Maximum 8-10 visible results before scrolling

#### Discoverability

- Show the Cmd+K hint in the search bar placeholder text
- Display a keyboard shortcut reference in the help menu
- Mention the command palette during onboarding for new users

### Real-World Examples

- **Linear**: Cmd+K opens a comprehensive palette for navigation, issue creation, status changes, and assignment
- **Notion**: Cmd+K for page search, quick actions, and recently visited pages
- **GitHub**: Cmd+K for repo search, navigation, file finding, and actions
- **Vercel**: Cmd+K for project navigation, deployment management, and settings access
- **Stripe Dashboard**: Cmd+K for searching transactions, customers, and navigating settings

### Command Palette Audit Checklist

- [ ] Cmd+K / Ctrl+K keyboard shortcut opens the palette
- [ ] Palette indexes pages, actions, and recent items at minimum
- [ ] Fuzzy search returns relevant results for partial or misspelled queries
- [ ] Results are grouped by category with visible headers
- [ ] Keyboard navigation works (Arrow keys to move, Enter to select, Escape to close)
- [ ] Recent/frequent items appear before the user types
- [ ] Keyboard shortcuts are displayed alongside actions
- [ ] The Cmd+K shortcut is visibly discoverable in the UI
- [ ] A fallback UI exists for mobile/touch devices
- [ ] The palette uses `role="combobox"` with `role="listbox"` and `aria-activedescendant` for accessibility

---

## 4. Breadcrumbs

### When to Use

Breadcrumbs are essential for any page depth exceeding 2 levels. They show the user's current location within the information architecture hierarchy and allow quick backtracking without repeated clicking.

### Implementation Rules

- Reflect the IA hierarchy, not the user's browsing history
- Format: Home > Category > Subcategory > Current Page (use ">" or "/" as separators)
- Make all levels clickable except the current page (displayed as plain text)
- Use breadcrumbs as a secondary navigation aid, never as the primary navigation
- Truncate long breadcrumb trails with an ellipsis for middle levels on narrow viewports
- Place breadcrumbs above the page title, below the top navigation bar

### Breadcrumb Audit Checklist

- [ ] Breadcrumbs are present on every page with depth greater than 2 levels
- [ ] All breadcrumb segments except the current page are clickable links
- [ ] Breadcrumb hierarchy matches the information architecture (not browser history)
- [ ] Current page is displayed as plain text (not a link)
- [ ] Breadcrumbs use semantic HTML (`<nav aria-label="Breadcrumb">` with `<ol>`)
- [ ] Long trails truncate gracefully on narrow viewports

---

## 5. Tabs

### When to Use

Tabs switch between related views of the same data or closely related content areas within a section. Use for 2-7 parallel views.

### Implementation Rules

- Never use tabs for sequential or wizard flows (use steppers instead)
- Highlight the active tab with a clear visual indicator (underline, background fill, or bold text)
- Consider whether tab content should be lazy-loaded or pre-loaded based on data size
- Preserve tab state when navigating away and returning
- Use horizontal tabs for 2-5 items; consider vertical tabs or a dropdown for 6-7 items
- Implement Arrow key navigation between tabs per WAI-ARIA Tabs Pattern

### Real-World Examples

- **Stripe Dashboard**: Tabs for Payments, Payouts, Disputes within the Payments section
- **Vercel**: Tabs for Deployments, Analytics, Settings within a project
- **GitHub**: Tabs for Code, Issues, Pull Requests, Actions within a repository

### Tab Audit Checklist

- [ ] Active tab has a clear visual indicator
- [ ] Tab count is between 2 and 7
- [ ] Tab state persists when navigating away and returning
- [ ] Tabs use ARIA roles: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- [ ] Arrow key navigation moves between tabs
- [ ] `aria-selected="true"` marks the active tab
- [ ] Tab content loads without full page reload

---

## 6. Mobile Navigation

### Patterns

| Pattern | When to Use | Examples |
|---------|-------------|---------|
| **Bottom navigation bar** | 3-5 primary destinations; most accessible to thumb reach | Instagram, Spotify, Twitter/X |
| **Hamburger menu** | Secondary navigation items; saves space but reduces discoverability by 21% | Most responsive web apps |
| **Tab bar + More** | 4 primary items in bottom bar, "More" tab for additional items | YouTube, Facebook |
| **Swipe navigation** | Related views within a section (tabs, cards) | Instagram Stories, dating apps |

### Mobile Navigation Requirements

- Touch targets must be at least 44x44px (Apple HIG) or 48x48px (Google Material)
- Maintain at least 8px spacing between adjacent touch targets
- Place primary actions in the lower third of the screen (natural thumb reach zone)
- Provide a "pull to refresh" pattern for content feeds and lists
- Keep sticky headers minimal to preserve content area (never exceed 15% of screen height)
- Convert sidebar navigation to a hamburger or bottom nav on viewports below 768px

### Mobile Navigation Audit Checklist

- [ ] Mobile navigation is reachable within 1 tap from any screen
- [ ] Touch targets are at least 44x44px with 8px minimum spacing
- [ ] Primary actions are positioned in the thumb-friendly zone (lower third of screen)
- [ ] Sticky headers consume no more than 15% of mobile screen height
- [ ] Navigation adapts appropriately at the 768px breakpoint
- [ ] No hover-dependent interactions exist without a tap-accessible equivalent

---

## 7. Navigation Design Principles

Apply these universal principles across all navigation patterns:

### Organization

- Organize by user task, not product feature -- label sections as "Reports" rather than "Module 3.2"
- Keep the top 3 features always within one click
- Adapt navigation to user roles and permissions (hide unauthorized items entirely)
- Plan for scalability as features expand

### Accessibility

- All navigation must be fully operable via keyboard (Tab, Enter, Arrow keys, Escape)
- Provide a skip navigation link at the top of every page
- Use semantic HTML: `<nav>` with descriptive `aria-label` attributes
- Mark the current page with `aria-current="page"`
- Never rely solely on color to indicate the active state

### Consistency

- Navigation placement must be identical on every page of the application
- Active/current indicators must use the same visual pattern throughout
- Preserve user location state between sessions
- Keep global actions accessible everywhere: search, settings, profile

### Navigation Hierarchy Audit Checklist

- [ ] Active nav item is visually distinct (color, weight, or indicator)
- [ ] Top-level navigation items number 7 or fewer
- [ ] Breadcrumbs are present for any page depth greater than 2
- [ ] Navigation is accessible via keyboard (Tab, Enter, Arrow keys)
- [ ] Mobile navigation is reachable within 1 tap
- [ ] Skip navigation link is present and functions correctly
- [ ] Semantic `<nav>` elements are used with `aria-label` attributes
- [ ] `aria-current="page"` marks the active navigation item
- [ ] Navigation placement is consistent across all pages
- [ ] Users can reach any primary section within 2 clicks from any page
- [ ] Navigation adapts to user roles (unauthorized items are hidden, not disabled)
- [ ] Navigation state persists between sessions
