# GreenBin — Product Requirements Document (PRD)
## Qubators AI Foundry Lesson 6 Assessment — Local Prototype

**Project:** GreenBin — Community Waste-Management Platform
**Stage:** Local prototype / Assessment (Lesson 6)
**Author:** Prototype owner (local development)
**Date:** 2026-09-27
**Runtime target:** Local browser only, no build system, no external dependencies

---

## 1. Vision & Purpose

GreenBin is a community waste-management platform designed to help people report waste issues, identify waste categories, and support cleaner communities.

Core goals for the prototype:
- Let a community member submit a waste report (location, category, description).
- Help users identify waste categories (e.g., Plastic, Organic, E-waste, Hazardous, Paper, Glass, Metal, Mixed/General).
- Show community statistics using mock data (e.g., total reports, resolved reports, reports by category).
- Provide a responsive single-page interface that runs locally in a browser.
- Establish a clear path to production (PostgreSQL, Supabase Auth, Supabase Storage) without connecting those services now.

Non-goals for the current prototype:
- No real database connection.
- No authentication / user accounts.
- No real file uploads / cloud storage.
- No real user data — mock/test data only.
- No deployment — local browser testing only.

---

## 2. Users & User Stories

**Primary user:** Community resident

User stories (prototype scope):
1. As a resident, I can open a single local HTML page and see what GreenBin does.
2. As a resident, I can fill a waste reporting form (name/nickname optional, location, category, description, urgency).
3. As a resident, I can select a waste category from a predefined list.
4. As a resident, I can see my submitted report appear in a local list (in-memory / localStorage only).
5. As a resident, I can see community statistics computed from mock data + my local submissions.

Future users (out of scope now): collection crews, community admins, municipal partners.

---

## 3. Implementation Plan (Ordered Phases)

### Phase 1 — Product foundation and local prototype
**Objective:** A working single-page local prototype with no build step.

Concrete outputs:
- [ ] Project structure:
  - `PRD.md` (this file)
  - `index.html` (structure + content)
  - `styles.css` (layout, responsive design)
  - `app.js` (form handling, category logic, mock stats rendering)
  - Optional: `README.md` with “how to run locally” (e.g., `python3 -m http.server` or double-click `index.html`)
- [ ] Initial user interface:
  - Header / hero explaining GreenBin
  - “Report waste” section
  - “Categories” / guide section
  - “Community reports” list section
  - “Community statistics” dashboard section
  - Footer
- [ ] Waste reporting form with fields:
  - Reporter nickname (optional, mock only)
  - Location / landmark (text, required)
  - Waste category selection (dropdown and/or selectable cards, required)
  - Description (textarea, required)
  - Urgency level (Low / Medium / High)
  - Submit + validation + success confirmation
- [ ] Waste category selection:
  - Fixed taxonomy v1: Plastic, Organic, Paper, Glass, Metal, E-waste, Hazardous, Mixed/General
  - Each category has short disposal guidance text shown on selection
- [ ] Community statistics using mock data:
  - Seeded mock reports array in `app.js` (e.g., 8–12 sample reports)
  - Computed stats: total reports, resolved count, pending count, counts by category, counts by status
  - Rendered as stat cards + simple CSS bars (no chart library)
  - New local form submissions update stats in-session
- [ ] Responsive single-page interface:
  - Mobile-first CSS, single column on small screens, multi-column on desktop
  - No external CSS frameworks or JS libraries
- [ ] Local browser testing:
  - Verified by opening `index.html` directly and via a local HTTP server
  - Manual checklist: form validates, categories select correctly, stats update, layout works at 360px / 768px / 1280px widths, no console errors

Exit criteria: `index.html` opens locally, full flow works offline, no network calls required.

### Phase 2 — Data layer
**Objective:** Define the persistent data model for future implementation. NOT connected in the current prototype.

Concrete outputs:
- [ ] Database schema design (documented in PRD appendix / future `schema.sql`):
  - `users (id, display_name, created_at)`
  - `waste_categories (id, name, description, disposal_guidance)`
  - `waste_reports (id, user_id NULLABLE, category_id FK, location_text, description, urgency, status, created_at, updated_at)`
  - `collection_status history: e.g., waste_reports.status ENUM ('reported','acknowledged','in_progress','collected','closed') + optional status_events table`
- [ ] Waste reports entity definition (fields, validation rules, status lifecycle).
- [ ] Users entity definition (minimal profile fields for future auth linkage).
- [ ] Waste categories seed data (the 8 categories from Phase 1 as canonical rows).
- [ ] Collection status workflow definition (reported → acknowledged → in_progress → collected → closed).
- [ ] PostgreSQL database choice documented as the planned production database.
- [ ] Explicit statement: **The PostgreSQL database is planned but is NOT connected in the current prototype. All data in Phase 1 is mock/in-memory only.**

Exit criteria: Schema reviewed on paper; no connection strings, no live DB, no credentials in repo.

### Phase 3 — Authentication and user accounts
**Objective:** Plan identity for a later phase. NOT implemented now.

Concrete outputs:
- [ ] User registration flow design (email + password / magic link options via Supabase Auth).
- [ ] Login / logout flow design.
- [ ] User profiles design (display name, my reports, preferences).
- [ ] Authorization sketch (anonymous can view + submit mock reports in prototype; authenticated users own their reports in future; admins manage status).
- [ ] Supabase Auth selected as planned auth provider.
- [ ] Explicit statement: **Authentication is planned for a later phase and is NOT implemented in the current prototype. No real user accounts, no sessions, no personal data.**

Exit criteria: Flows documented; zero auth code or keys in prototype.

### Phase 4 — File storage and reporting
**Objective:** Plan image evidence for reports. NOT implemented now.

Concrete outputs:
- [ ] Image uploads for waste reports (UX design: attach photo on report form, preview before submit).
- [ ] Supabase Storage selected as planned file storage (e.g., `report-photos/` bucket with per-user folders).
- [ ] Collection evidence/photos workflow (before/after photos by collectors, linked to `waste_reports.id`).
- [ ] Storage rules sketch (size limits, MIME allowlist, public vs. authenticated reads — design only).
- [ ] Explicit statement: **File storage is planned for a later phase and is NOT implemented in the current prototype. No uploads leave the browser.**

Exit criteria: Storage design documented; no buckets created, no keys, no upload code in prototype.

### Phase 5 — Production refinement
**Objective:** Harden the app for real users after Phases 2–4 are implemented.

Concrete outputs:
- [ ] Testing: unit tests for stats/category logic, form validation tests, manual cross-browser checklist, seeded staging data.
- [ ] Accessibility: semantic HTML, labels for all inputs, keyboard navigation, focus states, color-contrast check, alt text for images, ARIA where needed.
- [ ] Security: input sanitization, no secrets in client code, Supabase Row Level Security policies, rate-limiting/abuse plan for public reporting.
- [ ] Performance: minimal assets, no heavy dependencies, lazy-load images, targets (e.g., < 200 KB initial page, Lighthouse-friendly).
- [ ] Deployment: production hosting choice, environment configuration, backup plan for PostgreSQL, monitoring/logging basics.

Exit criteria: Deployed staging + production checklist signed off (future work, out of assessment scope).

---

## 4. Technology Decisions

### 4.1 Current assessment prototype (binding)
- Use **plain HTML, CSS and JavaScript**.
- The prototype must run **locally in a browser without a build system or external dependencies**.
- **Do not create a real database connection.**
- **Do not implement authentication.**
- **Do not use real user data.**
- Use **mock/test data only**.
- The application and database (when it exists in the future) are intended to run **locally during the prototype/development stage**.

File map (Phase 1 only):
- `index.html` — page structure
- `styles.css` — styling
- `app.js` — UI logic + mock data

Run locally:
- Option A: double-click `index.html`, or
- Option B: `python3 -m http.server 8000` in the project folder, then open `http://localhost:8000/`

### 4.2 Planned future architecture (not connected now)
- **Frontend:** HTML/CSS/JavaScript initially, with the possibility of moving to a modern frontend framework later.
- **Database:** PostgreSQL (planned; NOT connected in the current prototype).
- **Authentication:** Supabase Auth (planned; NOT implemented now).
- **File storage:** Supabase Storage (planned; NOT implemented now).

### 4.3 Framework trade-off: Plain HTML/CSS/JavaScript vs. React (or similar framework)

| Dimension | Plain HTML/CSS/JS | React / modern framework |
|---|---|---|
| Setup & run locally | Zero setup; open file or one-line HTTP server; easy for assessors to inspect | Requires Node.js, npm install, build/dev server; heavier for a single-page assessment |
| Learning / review surface | Small, transparent files; logic visible in one `app.js` | Component model, JSX, hooks, bundler config — more to review for same output |
| Interactivity needs | Sufficient for form + list + computed stats | Justified when state, routing, and reusable components grow (multi-page, teams, design system) |
| Performance (this scope) | Minimal payload, no dependencies | Bundler + runtime overhead disproportionate for one page |
| Maintainability at scale | Becomes harder past multi-page / shared-state complexity | Better at scale: components, typed props/state, ecosystem testing tools |
| Hiring / ecosystem | Universal, no toolchain lock-in | Rich ecosystem, but adds versioning and build maintenance |

**Decision for this assessment:** Use **plain HTML/CSS/JavaScript** because the assessment requires only a single local working page. The lightweight approach makes the prototype easier to run, inspect and test locally, with no build system or external dependencies to install, and keeps all logic auditable in a few files.

**Future revisit trigger:** Move to a framework only if/when the app grows beyond a single page (e.g., auth-gated dashboards, collector/admin roles, image uploads, real-time status) and team velocity benefits outweigh toolchain cost.

---

## 5. Agent Steering Notes

> Explicit steering record for AI agents working on this repo. Follow it unless the user explicitly overrides it.

### 5.1 Framework / tool choice discussion
- Considered: (a) plain HTML/CSS/JavaScript with zero dependencies vs. (b) a framework such as React (with Node.js + bundler).
- Assessment constraint: single local working page, runnable in a browser with no build system or external dependencies.
- Scale consideration: framework benefits (components, routing, state management) do not pay off at this scope but may later.

### 5.2 Decision: use HTML/CSS/JavaScript for the current prototype
- The current prototype SHALL be plain `index.html` + `styles.css` + `app.js` only.
- No npm, no bundlers, no CDN libraries/frameworks, no backend code for the assessment deliverable.

### 5.3 Why this choice is appropriate for the assessment
- Single-page scope: form, category selector, report list, and mock-data stats fit comfortably in vanilla JS.
- Easier to run: double-click or `python3 -m http.server`; no installs.
- Easier to inspect and test locally: assessor can read all source in minutes and verify offline.
- Fewer failure modes: no dependency drift, no build errors, no network-required assets.
- Aligns with the assessment rubric: local prototype, mock data, responsive single page.

### 5.4 Planned PostgreSQL, Supabase Auth and Supabase Storage choices
- Planned database: **PostgreSQL** — schema for `waste_reports`, `users`, `waste_categories`, `collection status` (see Phase 2).
- Planned authentication: **Supabase Auth** — registration, login, user profiles (see Phase 3).
- Planned file storage: **Supabase Storage** — image uploads for waste reports and collection evidence/photos (see Phase 4).

### 5.5 These future services are not connected in the current prototype
- **Database NOT connected:** no PostgreSQL instance, no connection strings, no live queries. Mock data only.
- **Authentication NOT implemented:** no sign-up/login, no sessions, no user tracking. Optional nickname field is mock-only.
- **File storage NOT implemented:** no uploads, no buckets, no image hosting. No files leave the browser.
- **No secrets in repo:** do not add passwords, API keys, access tokens, private credentials, or real personal data at any phase documented here.
- **Local-only:** the application and (future) database are intended to run locally during the prototype/development stage.

Agents: do NOT build the complete application, add frameworks, connect a database, wire Supabase, or add credentials while executing Task 1. Task 1 is plan documentation only.

---

## 6. Functional Requirements (Phase 1 scope)

1. FR-1: Single page loads offline with header, report form, categories guide, reports list, stats, footer.
2. FR-2: Report form validates required fields (location, category, description) and shows inline errors.
3. FR-3: Category selection drives contextual disposal guidance text.
4. FR-4: On submit, the report is added to the visible list and community stats update without reload.
5. FR-5: Mock dataset ships in `app.js` and is clearly labeled as sample data.
6. FR-6: Layout is responsive (360px / 768px / 1280px) with readable touch targets.
7. FR-7: No external network requests; no console errors in modern browsers.

## 7. Non-Functional Requirements
- NFR-1: Zero dependencies, zero build step.
- NFR-2: Accessible baseline: labeled inputs, semantic landmarks, keyboard-operable, visible focus, sufficient contrast.
- NFR-3: No real/personal data; no secrets in repo.
- NFR-4: Code is small and readable for assessment review.

## 8. Mock Data Plan (no real user data)
- `MOCK_REPORTS` in `app.js`: ~8–12 entries across categories and statuses with fictional locations/nicknames.
- `CATEGORIES` constant: 8 categories with `name` + `guidance` strings.
- Stats derived client-side: totals, by-category, by-status. No persistence beyond in-memory (localStorage optional enhancement, still local-only).

## 9. Out of Scope (explicit)
- Real PostgreSQL connection, migrations, or hosted DB.
- Supabase Auth or any login/session logic.
- Supabase Storage or any upload logic.
- Real personal data, analytics, or deployment pipelines.

## 10. Acceptance Criteria (Task 1)
- [x] `PRD.md` exists and contains ordered Phases 1–5 with concrete outputs.
- [x] Technology decisions state plain HTML/CSS/JS, local-only, mock data, no DB/auth/storage connections.
- [x] Framework trade-off (vanilla vs. React) is explained and the vanilla decision justified.
- [x] “Agent Steering Notes” section documents the 5 required points.
- [x] No passwords, API keys, tokens, credentials, or real personal data included.
- [ ] Full application build is intentionally deferred (Task 1 = plan only).

---

*End of PRD — Task 1 deliverable. Implementation (Phase 1 files) begins in the next task, not here.*

---

## Task 2 — Design Refinement Notes

**Scope:** Visual design preview only (`design.html`). No authentication, database connections, APIs, file uploads, real user data, passwords, API keys, or deployment logic. Mock/test data only.

The user specifically instructed the AI agent to refine the initial design for readability and accessibility. The `design.html` preview visibly reflects each of the following requested changes:

1. Improved text contrast.
   - Headings use near-black ink (#101C14) and body text uses dark green-gray (#1A2B1F) on light neutral backgrounds (#F8FAF7 / #FFFFFF).
   - Secondary/helper text darkened to #33463A (instead of light gray) so it remains readable.
   - White text on dark Forest green (#14532D / #166534) header and buttons for a high-contrast pairing.
2. More readable typography.
   - Highly readable system sans-serif stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
   - Strong visual hierarchy demonstrated (H1 2.6rem → H2 1.8rem → H3 1.2rem → 17px body), generous 1.65 line height, and a dedicated "Typography & hierarchy" section in the preview.
3. Stronger primary button contrast/styling.
   - Primary button uses solid Leaf green (#166534) with white text plus a 3px dark border (#0B2E18), large padding and bold type, making the main action ("Report waste now" / "Submit report") visually prominent and distinct from the secondary outline button.
4. Clearer input borders and focus states.
   - Form inputs (text input, select, textarea) use clear 2.5px solid borders (#2F4536) on white backgrounds with dark placeholder text.
   - Visible focus state on all interactive elements: 3–4px solid blue outline (#0A58CA) plus border-color change and soft focus glow, keyboard-navigation friendly.
5. Improved spacing.
   - Generous section rhythm (`3rem` vertical padding, dividers between sections), enlarged card padding (1.75rem), 2–2.5rem grid gaps, and spaced label/input/button groups so the page does not feel crowded.
6. Mobile readability.
   - Responsive layout: single-column stacking below 860px, full-width buttons on mobile, fluid `auto-fit` grids for palette/stats, viewport meta tag, 16px+ base font on small screens, and wrapping header/nav — verified target widths 360px / 768px / 1280px.

---

## Task 3 — Implementation Progress Notes

**Scope:** Working local application prototype (`index.html`). Vanilla HTML/CSS/JavaScript only, no build system, no external dependencies. Mock/test data only. `design.html` (Task 2 visual preview) was left unchanged.

1. **Phase 1 has been reached.** The Phase 1 exit criteria are met: `index.html` opens directly in a browser locally (double-click or `python3 -m http.server`), the full report → list → stats flow works offline, and no network calls are required.

2. **What was implemented in `index.html` (single local page):**
   - GreenBin branding (header logo mark, name, footer) and tagline "Smarter waste management for cleaner communities."
   - Navigation/header area (Dashboard, Report Waste, Recent Reports, Sorting Tips) plus skip-to-content link and hero/welcome section ("Welcome to GreenBin" + "How it works").
   - Community waste statistics computed client-side from mock data: total reports, resolved (collected), pending/in-progress, top category, plus per-category CSS bars; stats re-render on every submission.
   - Waste reporting form with nickname (optional), location input (required), waste category selection (required dropdown, 8 categories per PRD taxonomy v1), description textarea (required), urgency radios (Low/Medium/High), and a "Report Waste" primary button.
   - Category-driven disposal guidance box that updates on selection.
   - Recent reports section seeded with 10 fictional mock reports (nickname, location, category, description, urgency, status, date badges) rendered by vanilla JS.
   - Waste-sorting tips section (6 cards: Plastic, Organic, Paper, Glass, Metal, E-waste & Hazardous).
   - Form interaction in vanilla JS only: inline validation (location ≥ 3 chars, category required, description ≥ 10 chars), summary error with focus, success confirmation message (`role="status"`, focus), new report prepended to the top of recent reports with highlight, stats updated, form reset, smooth scroll to reports.
   - Design refinements carried over from Task 2: system sans-serif stack with H1 2.6rem → H2 1.8rem → H3 1.2rem → 17px/1.65 body hierarchy; near-black ink (#101C14) / body (#1A2B1F) / muted (#33463A) on light backgrounds; solid Leaf-green (#166534) primary button with dark border; 2.5px input borders with blue (#0A58CA) focus ring + glow; 3rem section rhythm, 1.75rem card padding, 2–2.5rem grid gaps; responsive single-column layout below 860px with full-width buttons (verified targets 360px / 768px / 1280px).

3. **The prototype currently uses mock/test data.** All reports, names, locations, and statistics are fictional samples held in an in-memory `reports` array (plus `CATEGORIES` guidance map). New submissions persist for the browser session only (in-memory; cleared on reload). No real user data is collected or stored.

4. **Not yet implemented:** authentication/user accounts (no sign-up, login, sessions), database connectivity (no PostgreSQL connection, no connection strings or queries), and file/image storage (no uploads, no buckets, uploads never leave the browser). No API keys, passwords, tokens, or private credentials are used anywhere.

5. **Next phase of the implementation roadmap:** Phase 2 — Data layer (per Section 3 above): document the persistent model (`users`, `waste_categories`, `waste_reports`, collection-status lifecycle reported → acknowledged → in_progress → collected → closed) and PostgreSQL choice on paper, with no live connection yet.

6. **What would be added in Phase 2:** database schema design (tables, fields, validation rules, status workflow), waste-reports and users entity definitions, the 8 Phase-1 categories as canonical seed rows, and an explicit statement that PostgreSQL is planned but still NOT connected (mock/in-memory data continues until later phases).
