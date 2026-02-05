# CSM Features Release Plan

This plan covers the Customer Success / CSM feature set. It is ordered by impact vs effort and by dependencies. **Existing foundation:** Account already has `health`, `riskScore`, `renewalDate`, `lastTouchpoint`, `nextScheduled`, `status`, `customerSuccessManager`; `HealthScore` (score + date) for history; `AccountActivity` (type, description, date); `BulkAccountOperations` (bulk edit tier, status, CSM, etc.); dashboard with at-risk and health.

**Legend:**  
- **E** = High impact, often easier  
- **H** = Higher impact, more data/work  

---

## Phase 0: Salesforce integration (before Phase 1)

**Goal:** You set up a Salesforce developer account and Connected App; then we integrate from the CRM side (OAuth, sync direction, objects).

| # | Task | Owner | Done |
|---|------|--------|------|
| 0.1 | Create Salesforce Developer account (developer.salesforce.com) | You | ☐ |
| 0.2 | Create a Connected App (OAuth 2.0, Client ID/Secret, callback URL) | You | ☐ |
| 0.3 | Decide initial use case: read-only sync (Accounts/Contacts), write-back, or both | You / Team | ☐ |
| 0.4 | CRM-side integration: OAuth flow, token storage, API client, and chosen objects | Dev (after 0.1–0.2) | ☐ |

See [SALESFORCE_INTEGRATION.md](./SALESFORCE_INTEGRATION.md) for what to configure in Salesforce and what we can build once the dev account is ready.

---

## Phase 1: Quick wins (E – high impact, easier)

**Goal:** Ship visible value with minimal new data model; lean on existing fields and APIs.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 1.1 | **Touchpoint cadence** | Per-account “next touch” (use `nextScheduled`) and reminders. UI: show “Next touch: &lt;date&gt;” on account card/detail; optional “Overdue touch” filter or badge. Backend: already have `nextScheduled`; add list/API for “accounts where nextScheduled in next 7 days” or “overdue” if needed. | Existing field; net-new UI + optional API | ☑ |
| 1.2 | **Renewal pipeline** | List/card view of renewals by month: contract value (arr/revenue), health, last contact. Filter by month or “next 90 days”. Use existing `renewalDate`, `arr`, `health`, `lastTouchpoint`. | Existing fields; net-new view + filters | ☑ |
| 1.3 | **CSM workload view** | By CSM (`customerSuccessManager`): # accounts, # at-risk, overdue tasks count, upcoming renewals (e.g. next 90 days). New dashboard section or page. | Existing fields; net-new aggregation + UI | ☑ |
| 1.4 | **Templates (email & note)** | Email and note templates (e.g. “QBR follow-up”, “Onboarding check-in”). Backend: Template entity (name, body, type: email | note). Frontend: template picker when composing email or adding note; insert template into body. | Net-new entity + CRUD + UI | ☑ |
| 1.5 | **Quick actions** | From account or contact: one-click “Log call”, “Send email”, “Create task”. Either open the right modal with context (account/contact pre-filled) or a small “Quick actions” menu. | Net-new UI; reuse existing create flows | ☑ |
| 1.6 | **Bulk actions expansion** | Extend `BulkAccountOperations`: “Reassign CSM” (set `customerSuccessManager`), “Set health” (set `health`), “Add tag” (if you add tags later). Ensure “Reassign CSM” is clear in UI. | Extend existing component + API | ☑ |

**Phase 1 acceptance:** Touchpoint and renewal views are usable; CSM workload is visible; templates can be created and used when sending email/adding note; quick actions open correct flow with context; bulk actions include reassign CSM and set health.

### Phase 1 readiness (without Salesforce)

Phase 1 does **not** depend on Salesforce. Here is how ready the codebase is if you ship Phase 1 before Phase 0 (Salesforce).

| # | Feature | Backend | Frontend | Status |
|---|--------|---------|----------|--------|
| 1.1 | **Touchpoint cadence** | `Account.nextScheduled`, `lastTouchpoint` exist | **CSM page** (`/csm`): table with “Next touch” badges (Overdue / In X days), filter chips (All, Overdue, Next 7/30 days), Health, Last touch. Account detail: Next Scheduled in edit form. | ✅ Done |
| 1.2 | **Renewal pipeline** | `renewalDate`, `arr`, `health`, `lastTouchpoint` exist | **CSM page**: month selector (Next 90 days + by month), renewal cards (ARR, health, last contact, renewal date). | ✅ Done |
| 1.3 | **CSM workload view** | `GET /dashboard/csm-workload` returns per-CSM stats (accounts, atRisk, overdueTasks, renewals90d) | **CSM page**: cards per CSM; nav “CSM” at `/csm`. | ✅ Done |
| 1.4 | **Templates (note only)** | `Template` entity (name, body, type: email \| note), CRUD, seed | **Note**: template picker on Account detail when adding note; Settings → Note templates for CRUD. (Email template picker not in scope.) | ✅ Done |
| 1.5 | **Quick actions** | Reuses existing note/task/email flows | **Account detail**: “Log call” (note dialog), “Send email” (mailto), “Create task” (task dialog with context). | ✅ Done |
| 1.6 | **Bulk actions expansion** | `POST /accounts/bulk/update` supports `customerSuccessManager`, `health` | **BulkAccountOperations** (Accounts page): Bulk Edit has Reassign CSM, Set health (0–100), Tier, Status, AM, SE. | ✅ Done |

**Summary:** You can go **full Phase 1 without Salesforce**. The only gap is **email template picker** when composing email (e.g. on Email page or compose modal). Note templates are implemented. Add a template dropdown when composing email and insert selected template body to meet full Phase 1 acceptance.

---

## Phase 2: Health trend & activity (E + light H)

**Goal:** Health over time and one place to see “last 90 days” per account.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 2.1 | **Health trend over time** | Track account health week-over-week or month-over-month. Backend: `HealthScore` already has `score` + `date`; ensure there’s a way to record periodic health (manual or calculated). Frontend: per-account chart or list of health scores over time; optional “trend” indicator (improving/declining). | Existing HealthScore; net-new recording flow + trend UI | ☐ |
| 2.2 | **Activity timeline** | One chronological feed per account: emails, calls (activities), tasks, notes, support (if added later). Backend: single endpoint that returns merged, sorted events (from `AccountActivity`, tasks, notes, emails) for an account in last 90 days. Frontend: “Activity” or “Timeline” tab on account detail. | Existing entities; net-new aggregation API + UI | ☐ |

**Phase 2 acceptance:** Health history is visible per account with trend; account detail has a timeline of last 90 days (emails, activities, tasks, notes).

---

## Phase 3: Risk & playbooks (H – more logic/data)

**Goal:** Churn risk score and at-risk playbooks.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 3.1 | **Churn risk scoring** | Combine health, engagement (e.g. logins if you have them, support tickets, NPS), and contract/renewal date into a single “at risk” / “watch” / “healthy” or 1–5 score. Backend: either computed (rule-based) or stored field updated by job. Frontend: show on account card/detail and in filters. | Existing health/renewal; net-new rules + optional engagement inputs | ☐ |
| 3.2 | **“At risk” playbooks** | When account is at-risk, show an in-app checklist/playbook (e.g. “Schedule call → Send health review → Log outcome”). Backend: Playbook entity (name, steps order); optional “PlaybookRun” per account (which playbook, step index, completed steps). Frontend: if account is at-risk, show suggested playbook and let CSM tick steps. | Net-new entities + UI | ☐ |

**Phase 3 acceptance:** Risk score is visible and used in filters; at-risk accounts can be assigned a playbook and CSMs can track steps.

---

## Phase 4: NPS & reporting (H – more data/work)

**Goal:** NPS/survey tracking and executive summary.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 4.1 | **NPS / survey tracking** | Store NPS (or survey) score and date per account. Backend: either new `AccountNPS` (accountId, score, date, optional surveyId) or add `npsScore` + `npsDate` on Account. Frontend: capture on account detail; show on account card/detail; list/filter e.g. “NPS &lt; 7”. | Net-new storage + UI + filters | ☐ |
| 4.2 | **Executive summary** | One screen: total ARR, at-risk ARR, key health/renewal/NPS metrics; optional simple trend (e.g. vs last quarter). Backend: dashboard-style endpoint (aggregates from accounts + NPS if present). Frontend: “Executive” or “Summary” dashboard. | New endpoint + UI; reuses account/health/renewal/NPS | ☐ |

**Phase 4 acceptance:** NPS (or survey) score and date stored and visible; filters by NPS; executive summary screen shows ARR, at-risk ARR, and main metrics.

---

## Phase 5: Product & integration (H – depends on data/systems)

**Goal:** Usage and support context when data is available.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 5.1 | **Usage / adoption metrics** | If you can pull usage (logins, feature adoption, API calls): show per account and flag “low usage” or “usage down”. Backend: store per-account usage snapshot or link to external source; optional “usageDown” or “lowUsage” on account or computed. Frontend: show on account; filter/list. | Net-new data source + storage + UI | ☐ |
| 5.2 | **Support ticket link** | Link or count of open support tickets per account. Backend: either external API to support system or manual “open ticket count” field; surface in account and in health/risk logic if desired. Frontend: account detail + optional in risk/health view. | Net-new integration or field + UI | ☐ |

**Phase 5 acceptance:** When data exists, usage (and “low usage” / “usage down”) is visible per account; support ticket link or count is visible and optionally used in risk.

---

## Phase 6: Prioritization & alerts (E + H)

**Goal:** “My focus” and alerts so nothing falls through the cracks.

| # | Feature | What to build | Existing / net-new | Done |
|---|--------|----------------|--------------------|------|
| 6.1 | **“My focus” / priority list** | Let CSMs pin or star accounts (at-risk, renewals, key accounts). Backend: e.g. `UserPinnedAccount` (userId, accountId) or `isPinned` on a join table. Frontend: “Pin” on account card/detail; “My focus” on dashboard or dedicated view (filter to pinned). | Net-new entity + UI | ☐ |
| 6.2 | **Alerts / notifications** | In-app or email when account becomes at-risk, key task overdue, or renewal within X days. Backend: rules engine or scheduled job that creates in-app notifications (and optionally sends email). Frontend: notification bell/list; optional email. | Net-new rules + notification storage + UI | ☐ |

**Phase 6 acceptance:** CSMs can pin accounts and see “My focus”; alerts fire for at-risk, overdue task, and renewal window and are visible (and optionally emailed).

---

## Summary

| Phase | Focus | Effort |
|-------|--------|--------|
| 1 | Touchpoint cadence, renewal pipeline, CSM workload, templates, quick actions, bulk expansion | E |
| 2 | Health trend, activity timeline | E + light H |
| 3 | Churn risk score, at-risk playbooks | H |
| 4 | NPS/survey, executive summary | H |
| 5 | Usage/adoption, support ticket link | H (data-dependent) |
| 6 | My focus, alerts/notifications | E + H |

**Suggested order:** 1 → 2 → 3 → 4. Phase 5 when usage/support data is available; Phase 6 can start after Phase 1 (e.g. “My focus” early, alerts after risk/playbooks).

---

## Dependency / reuse notes

- **Health trend (2.1)** uses existing `HealthScore`; ensure there’s a flow to record scores over time (manual or job).
- **Activity timeline (2.2)** needs one API that joins `AccountActivity`, tasks, notes, emails for an account.
- **Churn risk (3.1)** can start rule-based (health + renewal + optional NPS); add engagement (logins, tickets) when you have that data.
- **Executive summary (4.2)** and **CSM workload (1.3)** share the same account/health/renewal/ARR data; consider a shared dashboard API or reuse.
