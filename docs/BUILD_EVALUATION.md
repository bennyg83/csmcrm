# Full Build Evaluation — CSM CRM

**Date:** February 2026  
**Scope:** Backend, frontend, Docker, docs, and cross-cutting concerns.

---

# Part 1: Still Needs to Be Implemented

## 1.1 Backend / API — Incomplete or Stubbed

| Item | Location | Description |
|------|----------|-------------|
| **SMTP / fallback email** | `backend/src/services/fallbackEmailService.ts` | Nodemailer is commented out; `sendEmail()` and `testConnection()` only log and return mock values. Real SMTP sending is not implemented. |
| **External user welcome email** | `backend/src/controllers/externalAuthController.ts` (≈236) | TODO: "Re-enable email sending once SMTP is properly configured." Welcome email for new external users is disabled; user creation succeeds but no email is sent. |
| **Contacts route auth** | `backend/src/routes/contacts.ts` | `router.use(auth)` is commented out. Contact CRUD and portal-invite endpoints are **unauthenticated**. |
| **Tasks route auth** | `backend/src/routes/tasks.ts` | `router.use(auth)` is commented out. Task CRUD is **unauthenticated**. |
| **Document processing LLM path** | `backend/src/services/documentProcessor.ts` | `processWithLLM()` always uses rule-based extraction. Ollama/LLM path is commented out; LLM-based document parsing is not used. |

## 1.2 Frontend — Missing Pages / Flows

| Item | Description |
|------|-------------|
| **Leads UI** | Backend has full Leads API (list, create, update, delete, stats, notes, activities) with auth. No `/leads` route in `App.tsx` and no Leads page or nav item. |
| **Reports UI** | Backend has full Reports API (CRUD, execute, templates) with auth. No `/reports` route and no Reports page or nav item. |
| **Workflows UI** | Backend has full Workflows API (CRUD, toggle, stats, test) with auth. No `/workflows` route and no Workflows page or nav item. |

## 1.3 Features Claimed but Not Present

| Item | Source | Description |
|------|--------|-------------|
| **WebSocket / real-time updates** | README | README states "WebSocket support for live data updates." No WebSocket or socket.io usage found in backend or frontend. |
| **Integrations SSO config** | `frontend/src/pages/IntegrationsPage.tsx` | SSO card shows status `error` and static settings; no real SSO configuration UI or OAuth flow from this page. |
| **Gmail status on Integrations** | `IntegrationsPage.tsx` | Gmail is hardcoded as `connected`; no actual Gmail OAuth or connection check from this page. |

## 1.4 Known Issues (from CHANGELOG / code)

| Item | Description |
|------|-------------|
| **Client Portal dashboard** | CHANGELOG 2.4.1-buggy: Client portal dashboard can show internal server error (e.g. `EntityPropertyNotFoundError: Property "notes" was not found in "Task"`). |
| **External task controller** | CHANGELOG: External task endpoints can fail due to entity relation issues (e.g. `getTaskDetails`). |

---

# Part 2: Improvements to the Current Build

## 2.1 Security

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **Remove JWT fallback secret** | High | `auth.ts` and `externalAuthController.ts` use `process.env.JWT_SECRET \|\| 'your-secret-key'`. In production, require `JWT_SECRET` and fail startup if unset; remove fallback. |
| **Re-enable auth on contacts and tasks** | High | Uncomment `router.use(auth)` in `contacts.ts` and `tasks.ts` so contact and task APIs require a valid JWT. |
| **Hide Debug Auth State in production** | Low | Login page "Debug Auth State" button: show only when `import.meta.env.DEV` (or similar) so it does not appear on GitHub Pages / production. |
| **Harden CORS** | Low | In production, avoid reflecting arbitrary origin; use an explicit allowlist (already partially in place). |

## 2.2 Performance & Scalability

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **Pagination for accounts/tasks lists** | High | Add server-side pagination (e.g. `?page=1&limit=20`) to `getAllAccounts` and `getAllTasks`; add pagination UI on Accounts and Tasks pages. See `docs/PERFORMANCE_INSPECTION.md` §8 for user-impact. |
| **Lighter project list API** | Medium | `getProjects` loads `relations: ["account", "milestones"]` for every project. Consider a "list" mode with minimal fields (id, name, type, status, accountId, account.name) for the Projects list page. |
| **Lighter account list for dropdowns** | Medium | Many pages need only id/name for account dropdowns. Add an endpoint (e.g. `GET /api/accounts?fields=id,name`) or a dedicated `GET /api/accounts/minimal` to reduce payload and DB work. |
| **Database indexes** | Medium | Add indexes on frequently filtered/sorted columns (e.g. Account.status, Task.status, Task.accountId, AccountActivity.date). See performance doc. |
| **TypeORM logging in production** | Low | Set `logging: false` in production in `data-source.ts` to reduce I/O and log volume. |

## 2.3 Reliability & Operations

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **Error boundaries (frontend)** | Medium | No React Error Boundary found. Add an error boundary (e.g. at app or layout level) to catch render errors and show a fallback UI instead of a blank screen. |
| **Health check for Funnel/load balancer** | Low | Backend has `GET /health`. Ensure it is used by Tailscale Funnel or any reverse proxy for liveness; add readiness (e.g. DB check) if needed. |
| **Docker resource limits** | Medium | Add memory/CPU limits to backend-fb, postgres-fb, frontend-fb (and ollama when used) so one service cannot starve others on a shared host. See performance doc. |

## 2.4 UX & Product

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **Integrations: real Gmail/Calendar status** | Medium | Integrations page should call backend (e.g. Gmail/Calendar status endpoints) and show actual connection status instead of hardcoded "connected" or "error." |
| **Leads / Reports / Workflows UIs** | Medium | Add nav items and pages for Leads, Reports, and Workflows (APIs exist) so users can manage them in the app. |
| **Client portal dashboard fix** | High | Resolve entity/relation errors (e.g. Task "notes") and external task controller so client portal dashboard loads without internal server error. |
| **Loading and empty states** | Low | Standardize loading spinners and empty-state copy across list and detail pages. |
| **Demo credentials hint** | Low | Login page shows "admin@crm.com / admin123"; consider moving to a collapsible "Demo access" section or hiding in production. |

## 2.5 Code Quality & Consistency

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **RBAC on more routes** | Medium | Accounts use `requirePermission("accounts.read")` etc.; contacts, tasks, projects, and others use only `auth`. Align with RBAC where roles/permissions are defined. |
| **Backend TypeScript strictness** | Low | Backend has existing TS errors (e.g. controllers, run-migration, seed). Fix or narrow types so `npm run build` passes and improves maintainability. |
| **API response shape** | Low | Standardize success/error response format (e.g. `{ data }` vs raw array, `{ error, message }` for errors) across controllers. |
| **Environment validation** | Low | Validate required env vars (e.g. `JWT_SECRET`, `DB_*`) at startup and fail fast with a clear message instead of falling back to defaults. |

## 2.6 Documentation & DevEx

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **README accuracy** | Low | Update README: remove or qualify "WebSocket support"; fix port references (e.g. 3002 vs 3004) to match PORTS.md and docker-compose. |
| **API overview** | Low | Add a short API overview (list of route groups and auth requirements) for frontend and integration work. |
| **Env example completeness** | Low | Ensure `backend/env.example` and `frontend/.env.example` list all used variables (e.g. CORS_ORIGINS, OLLAMA_ENDPOINT) with brief comments. |

---

# Summary

- **Part 1 (still to implement):** SMTP/fallback email, external user welcome email, auth on contacts/tasks routes, optional LLM document path, Leads/Reports/Workflows UIs, WebSocket (or remove from README), Integrations SSO/Gmail reality check, and known client portal / external task issues.
- **Part 2 (improvements):** Security (JWT fallback, contacts/tasks auth, hide debug button), performance (pagination, lighter APIs, indexes), reliability (error boundaries, health/readiness, Docker limits), UX (Integrations status, Leads/Reports/Workflows UIs, client portal fix), code quality (RBAC consistency, TS, env validation), and docs (README, API overview, env examples).

Use this list to prioritize backlog and next sprints.
