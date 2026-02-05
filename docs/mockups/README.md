# Phase 1 CSM Mockups

Static HTML/CSS/JS mockups for reviewing Phase 1 CSM features before implementation.

**In the app:** The content of this mockup will live on a **new CSM page** at route `/csm`, with a **left-ribbon nav item “CSM”** (GroupWork icon). The existing “Dashboard” (`/`) stays the general overview; the CSM page is the Customer Success–focused landing (workload, touchpoint cadence, renewal pipeline). Quick actions and templates appear on Account/Contact detail; bulk actions extend the existing Accounts list.

## How to view

**Option A – Open file directly**

- Open `phase1-csm-mockup.html` in your browser (double-click or File → Open).
- Path: `docs/mockups/phase1-csm-mockup.html`

**Option B – From repo root (if you have a simple HTTP server)**

```bash
# Example with Python
python -m http.server 8080 --directory docs/mockups
# Then open http://localhost:8080/phase1-csm-mockup.html
```

## What’s in the mockup

1. **CSM Workload View** – Cards per CSM: # accounts, # at-risk, overdue tasks, renewals (90d).
2. **Touchpoint Cadence** – Accounts table with “Next touch” column and badges (Overdue / In 5 days / In 2 weeks); filter chips for Overdue, Next 7 days, Next 30 days.
3. **Renewal Pipeline** – Month selector (Next 90 days, Feb/Mar/Apr 2026) and renewal cards (ARR, health, last contact, renewal date).
4. **Quick Actions & Templates** – Account detail mock with “Log call”, “Send email”, “Create task” buttons; compose area with template dropdown (QBR follow-up, Onboarding check-in, Renewal reminder).
5. **Bulk Actions** – Table with checkboxes; when rows are selected, a bottom bar appears with “Reassign CSM” (dropdown) and “Set health” (number), plus Apply/Clear.

Links in the header jump to each section. Bulk bar and template dropdown are interactive (mock only).
