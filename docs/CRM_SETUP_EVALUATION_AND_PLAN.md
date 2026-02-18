# CRM Full Setup Evaluation and Plan

This document evaluates the current CRM setup and provides a structured plan covering **fixes**, **efficiency actions**, and **recommended features** for a fully functional CRM.

---

## 1) Fixes

Issues that are bugs, gaps, or risks that should be addressed.

| # | Area | Issue | Recommendation |
|---|------|--------|----------------|
| 1.1 | **Auth / session** | When the JWT expires mid-session, API calls return 401 but the app does not redirect to login or clear the token globally. The user can see failed requests and stale UI. | Add a response interceptor in `api.ts`: on 401, clear `localStorage` token/userType, then redirect to `/login` (or call a shared “force logout” that does the same). Optionally show a short “Session expired” message. |
| 1.2 | **Phase 1 gap** | Phase 1 CSM is done except **email template picker** when composing email (e.g. on Email page or compose modal). Note templates exist; email template insertion is missing. | Add a template dropdown when composing email (Settings → Templates type: email) and insert the selected template body into the compose field. |
| 1.3 | **Next touchpoint** | Next touchpoint is only manual (`nextScheduled` on account). Doc says it should also come from calendar (when remapped) and from tasks (e.g. earliest due date among tasks with `taskType` call/meeting). | Implement “next touch from tasks”: backend or frontend logic to compute earliest due date among non-completed tasks with `taskType` in `['call','meeting']` per account; optionally surface in CSM view and account detail. Defer calendar-driven next touch until calendar integration is remapped. |
| 1.4 | **Email / SMTP** | `fallbackEmailService.ts` and `externalAuthController.ts` contain TODOs to enable nodemailer/SMTP for welcome and password-reset emails. | When SMTP is configured, uncomment or enable the nodemailer paths and remove or complete the TODOs so welcome and password-reset emails are sent. |
| 1.5 | **Production data source** | `data-source.ts` uses `synchronize: isDev` and `dropSchema` only in dev. Risk if `NODE_ENV` is not set correctly in production. | Ensure production deployments set `NODE_ENV=production`. Add a startup check that refuses to run with `synchronize: true` when `NODE_ENV === 'production'` (or when a production env var is set). |
| 1.6 | **Export report** | Management Dashboard “Export Report” button is a stub (console.log only). | Implement CSV (and optionally PDF) export for the current dashboard data (e.g. filtered accounts, key metrics, top performers). |
| 1.7 | **React error boundary** | No React Error Boundary; an uncaught error in any component can white-screen the app. | Add an Error Boundary at app or layout level that catches errors, shows a friendly message and a “Reload” action, and optionally logs to a service. |

---

## 2) Efficiency Actions

Improvements that reduce cost, improve performance, or simplify maintenance (without changing product behaviour).

| # | Area | Current state | Action |
|---|------|----------------|--------|
| 2.1 | **List APIs** | `getAllAccounts` and task list APIs load all records with no pagination. With hundreds of accounts or tasks, responses and UI can be slow. | Add optional `limit`/`offset` (or `page`/`pageSize`) to accounts and tasks list endpoints; default to a safe limit (e.g. 100). Frontend: add pagination or “Load more” on Accounts and Tasks pages (and any list that uses these APIs). |
| 2.2 | **Dashboard data** | Management and CSM dashboards fetch all accounts (and tasks/users) and filter in the frontend. | Prefer server-side filtering where possible (e.g. dashboard endpoints that accept filters and return aggregated metrics). For very large datasets, add dashboard-specific endpoints that return only aggregates instead of full lists. |
| 2.3 | **API timeout** | Frontend API timeout is 60s. Long timeouts can leave users waiting without feedback. | Reduce global timeout to something reasonable (e.g. 30s); add retry or longer timeout only for specific heavy operations (e.g. export, document processing) if needed. |
| 2.4 | **AuthContext logging** | `AuthContext` uses multiple `console.log` calls in initAuth. | Remove or wrap in `if (import.meta.env.DEV)` so production builds do not log auth flow to the console. |
| 2.5 | **API service size** | `frontend/src/services/api.ts` is large (800+ lines) with many methods. | Split by domain (e.g. `api/auth`, `api/accounts`, `api/tasks`, `api/notes`, etc.) and re-export a single `apiService` or keep one file but group methods with comments; consider code-splitting if bundles are large. |
| 2.6 | **Docker env** | `JWT_SECRET` and DB credentials in docker-compose are example values. | Document that production must override these via env files or secrets; avoid committing real secrets. |
| 2.7 | **Types** | Some backend responses or frontend props use `any`. | Gradually replace `any` with proper types (e.g. DTOs or shared types) to catch bugs and improve refactoring safety. |

---

## 3) Recommended Features for a Fully Functional CRM

Features that would bring the CRM to a more complete, production-ready state (in rough priority order).

### 3.1 High priority (core experience)

| # | Feature | Description | Reference |
|---|--------|-------------|-----------|
| 3.1.1 | **401 handling and session expiry** | Global handling of 401: clear token, redirect to login, optional “Session expired” message. | See Fix 1.1. |
| 3.1.2 | **Email template picker** | When composing email, allow selecting an email template and inserting its body. | See Fix 1.2; Phase 1 CSM. |
| 3.1.3 | **Activity timeline (per account)** | Single chronological feed per account: notes (calls/emails), tasks, activities, optionally emails. Backend: one endpoint returning merged, sorted events (e.g. last 90 days). Frontend: “Activity” or “Timeline” tab on account detail. | CSM Phase 2.2. |
| 3.1.4 | **Health trend over time** | Per-account health history (using existing `HealthScore`) and a simple trend (e.g. improving/declining). Frontend: chart or list on account detail. | CSM Phase 2.1. |
| 3.1.5 | **Pagination or virtualized lists** | Paginate (or virtualize) Accounts and Tasks lists so the app remains responsive with large datasets. | Efficiency 2.1. |
| 3.1.6 | **Export report (Management)** | Implement CSV/PDF export for Management Dashboard (filtered data, metrics, top performers). | Fix 1.6. |
| 3.1.7 | **Next touch from tasks** | Use tasks with `taskType` call/meeting to derive “next touch” (e.g. earliest due date) per account; show in CSM view and account detail. | Fix 1.3; TOUCHPOINT_AND_TASK_TYPE.md. |

### 3.2 Medium priority (visibility and control)

| # | Feature | Description | Reference |
|---|--------|-------------|-----------|
| 3.2.1 | **Churn risk scoring** | Single “at risk” / “watch” / “healthy” or 1–5 score combining health, renewal, optional NPS. Show on account card/detail and in filters. | CSM Phase 3.1. |
| 3.2.2 | **At-risk playbooks** | Checklist/playbook for at-risk accounts (e.g. “Schedule call → Send health review → Log outcome”). Backend: Playbook + optional PlaybookRun. Frontend: show and tick steps. | CSM Phase 3.2. |
| 3.2.3 | **NPS / survey tracking** | Store NPS (or survey) score and date per account; show and filter (e.g. NPS &lt; 7). | CSM Phase 4.1. |
| 3.2.4 | **Executive summary dashboard** | One screen: total ARR, at-risk ARR, key health/renewal/NPS metrics; optional simple trend. | CSM Phase 4.2. |
| 3.2.5 | **“My focus” / pinned accounts** | Let users pin or star accounts; “My focus” view or filter. Backend: e.g. UserPinnedAccount or isPinned. | CSM Phase 6.1. |
| 3.2.6 | **Global search** | Search across accounts, contacts, and tasks from the header; navigate to the matched entity. | Common CRM expectation. |

### 3.3 Lower priority (integrations and polish)

| # | Feature | Description | Reference |
|---|--------|-------------|-----------|
| 3.3.1 | **Alerts / notifications** | In-app (and optional email) when account becomes at-risk, key task overdue, or renewal within X days. Backend: rules + notification storage; frontend: bell/list. | CSM Phase 6.2. |
| 3.3.2 | **Usage / adoption metrics** | If usage data exists: show per account and flag “low usage” or “usage down”. | CSM Phase 5.1. |
| 3.3.3 | **Support ticket link** | Link or count of open support tickets per account (manual field or external API). | CSM Phase 5.2. |
| 3.3.4 | **Calendar-driven next touch** | When calendar integration is remapped, derive next touch from next scheduled calendar event per account. | TOUCHPOINT_AND_TASK_TYPE.md. |
| 3.3.5 | **Salesforce integration** | OAuth, sync direction, and objects (Accounts/Contacts) as per Phase 0 and SALESFORCE_INTEGRATION.md. | CSM Phase 0. |
| 3.3.6 | **Automated tests** | Unit tests for critical backend logic (auth, RBAC, key controllers); frontend unit or integration tests for auth and main flows; optional E2E for login and one main path. | Quality / efficiency. |
| 3.3.7 | **Audit log** | Optional audit log for sensitive actions (user create/update, account status change, bulk operations) for compliance and debugging. | Enterprise CRM. |
| 3.3.8 | **Mobile responsiveness** | Audit and polish key pages (login, dashboard, account/contact detail, lists) for small screens and touch. | UX. |

---

## Summary

- **Fixes (7):** Session/401 handling, email template picker, next touch from tasks, email/SMTP TODOs, production data-source safety, export report implementation, React Error Boundary.
- **Efficiency (7):** List pagination, dashboard data strategy, API timeout, AuthContext logging, API file structure, Docker env documentation, type safety.
- **Recommended features:** Grouped into high (7), medium (6), and lower (8) priority; aligned with CSM phases and TOUCHPOINT_AND_TASK_TYPE.md where applicable.

Implementing the **fixes** and **high-priority** items first will give the largest gain toward a fully functional, reliable CRM; then add **efficiency** and **medium/lower** features as capacity allows.
