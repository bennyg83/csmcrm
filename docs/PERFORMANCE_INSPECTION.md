# Performance Inspection Report — CSM CRM & Shared Host

**Scope:** This repo (crm-2 / CSM CRM), Docker setup, backend, frontend, database, and impact on the same machine (Pilzno CRM, Tailscale).  
**No changes were made;** this document only identifies where improvements could be made.

---

## 1. Docker & Host Resources

### 1.1 Resource limits

- **Finding:** `docker-compose.yml` does not set `deploy.resources.limits` (or `mem_limit` / `cpus`) for any service. Postgres, Ollama, backend, and frontend can use as much CPU and RAM as the host allows.
- **Impact:** When both CSM CRM and Pilzno run on the same machine, they compete for CPU and RAM. One stack can slow the other.
- **Improvement (later):** Add per-service limits, e.g.:
  - `backend-fb`: cap memory (e.g. 512Mi–1Gi) and CPU (e.g. 0.5–1).
  - `postgres-fb`: cap memory (e.g. 256Mi–512Mi).
  - `ollama-fb`: cap memory (e.g. 2Gi) and/or CPU; or don’t start it by default (see 1.2).
  - `frontend-fb`: small limits (e.g. 256Mi).

### 1.2 Ollama always running

- **Finding:** `ollama-fb` has `restart: unless-stopped` and no `profiles` or conditional start. The container runs whenever the stack is up.
- **Impact:** Ollama uses noticeable RAM and CPU even when no one is using document/LLM features. Document processing in this codebase uses rule-based extraction by default (LLM path is commented out); only `getLLMStatus` (and optional future use) hit Ollama.
- **Improvement (later):** Use a Compose profile (e.g. `ollama`) and start Ollama only when needed; or document “start Ollama only for LLM features” and leave it stopped by default.

### 1.3 Number of containers

- **Finding:** This stack runs 4 containers (postgres-fb, ollama-fb, backend-fb, frontend-fb). Pilzno runs 3 (db, backend, frontend). Total 7 on one host.
- **Impact:** More containers mean more processes, more memory overhead, and more context switching.
- **Improvement (later):** Reduce or cap total resources via limits (1.1) and/or run Ollama only when needed (1.2).

---

## 2. Backend (Node/Express / TypeORM)

### 2.1 Development mode in Docker

- **Finding:** Backend runs with `NODE_ENV=development` and `npm run dev` (ts-node-dev). No production build is used in Docker.
- **Impact:** ts-node-dev compiles on the fly and uses more CPU and memory than running compiled `node dist/index.js`. Development mode also enables TypeORM `logging` and `synchronize` (see 2.4, 2.5).
- **Improvement (later):** For a “production-like” Docker setup, build with `npm run build` and run `npm start` with `NODE_ENV=production` (and disable synchronize / reduce logging).

### 2.2 Request logging

- **Finding:** `morgan("combined")` logs every HTTP request (method, URL, status, response time, etc.) to stdout.
- **Impact:** High traffic increases I/O and log volume; can add minor CPU cost.
- **Improvement (later):** In production, use a lighter format (e.g. `"short"`) or disable morgan; or log only errors.

### 2.3 Double route mount

- **Finding:** API routes are mounted twice: once at `/api/*` and once at `/csmcrm/api/*` (`mountApiRoutes("")` and `mountApiRoutes("/csmcrm")`).
- **Impact:** Small: Express still matches each request to one route; no double execution, but a bit more routing table size and maintenance.
- **Improvement (later):** Only if you drop the path-based Funnel option; then remove the `/csmcrm` mount.

### 2.4 TypeORM: connection pool and logging

- **Finding:** `data-source.ts` does not set `extra` (e.g. `max`, `idleTimeoutMillis`). TypeORM default pool size is 10. `logging: process.env.NODE_ENV === "development"` so in dev every query is logged to the console.
- **Impact:** Default pool is usually fine for one backend; logging in dev adds I/O and can slow under load.
- **Improvement (later):** Add explicit `extra: { max: 10, idleTimeoutMillis: 30000 }` if you want to tune; set `logging: false` in production (or when not debugging).

### 2.5 TypeORM: synchronize in development

- **Finding:** `synchronize: isDev` — in development, TypeORM syncs schema to the database on startup.
- **Impact:** On every backend restart, TypeORM can run many DDL statements (21 entities). Adds startup time and brief DB load.
- **Improvement (later):** Use migrations only in production; in dev you can keep synchronize for convenience but be aware of the cost on restart.

### 2.6 Dashboard: frontend not using aggregated metrics

- **Finding:** Backend exposes `GET /api/dashboard/metrics` (dashboardController) which returns aggregated metrics (counts, revenue, health, recent activities) in one call. The frontend `DashboardPage` does **not** call `getDashboardMetrics()`; it calls `getAccounts()`, `getTasks()`, `getRecentActivities()`, and `getAllUsers()` and then computes metrics client-side.
- **Impact:** Four round-trips and full datasets (all accounts with relations, all tasks, etc.) instead of one small payload. This is likely a major contributor to “a bit slow” on dashboard load and to backend/DB load.
- **Improvement (later):** Change `DashboardPage` to fetch `getDashboardMetrics()` once and (if needed) fetch full lists only for tabs/lists that need them (e.g. with pagination).

### 2.7 List endpoints: no pagination

- **Finding:** `getAllAccounts` and `getAllTasks` return full lists with relations; there are no `skip`/`take` or `page`/`limit` query parameters.
- **Impact:** As data grows, these endpoints return more and more data per request (accounts with tier + contacts; tasks with account, project, milestone). Slower response times and higher memory on backend and frontend.
- **Improvement (later):** Add pagination (e.g. `?page=1&limit=20`) and optionally lighter “list” DTOs (e.g. id, name, status) for list views.

### 2.8 Heavy single-entity loads

- **Finding:** `getAccountById` loads many relations: `tier`, `contacts`, `tasks`, `notes`, `notes.contacts`, `healthScores`, `activities`. One query can pull a lot of rows.
- **Impact:** Account detail page can be slow for accounts with many tasks/notes/activities.
- **Improvement (later):** Load only the relations needed for the current view; or paginate nested lists (e.g. activities).

### 2.9 Database indexes

- **Finding:** No `@Index()` (or equivalent) found on entities. TypeORM/Postgres will use primary keys and unique constraints only.
- **Impact:** Queries filtered or ordered by non-PK columns (e.g. `status`, `createdAt`, `accountId`, `date`) can do full table or index scans as data grows.
- **Improvement (later):** Add indexes on frequently filtered/sorted columns (e.g. Account.status, Task.status, Task.accountId, AccountActivity.date, Note.accountId).

### 2.10 Rate limiting

- **Finding:** Rate limiters are applied only on login and portal routes (e.g. 50 requests per 15 minutes for login). There is no global API rate limiter.
- **Impact:** A busy or misbehaving client can send many requests and stress the backend and DB; can also affect other CRM on the same host indirectly via CPU/RAM.
- **Improvement (later):** Optional global rate limit (e.g. per IP or per user) for `/api` to smooth load.

---

## 3. Database (PostgreSQL)

### 3.1 No custom Postgres config

- **Finding:** `postgres-fb` uses the default Postgres 15 image with no `command` or custom config (e.g. `shared_buffers`, `work_mem`).
- **Impact:** Defaults are conservative. For a single small DB this is often fine; under heavier load, tuning can help.
- **Improvement (later):** Only if you measure: add a small custom config (e.g. `shared_buffers`, `work_mem`) via env or a mounted config file.

### 3.2 Two separate Postgres instances

- **Finding:** Pilzno uses one Postgres (e.g. port 5435); this project uses another (port 5436). Both run on the same host.
- **Impact:** Good for isolation; both still share host RAM and disk I/O. If both are busy, they compete.
- **Improvement (later):** Same as 1.1: consider memory limits per container so one DB cannot starve the other.

---

## 4. Frontend

### 4.1 Dashboard: four API calls instead of one

- **Finding:** See 2.6. Dashboard loads by calling `getAccounts()`, `getTasks()`, `getRecentActivities()`, and `getAllUsers()`.
- **Impact:** More latency (sequential or parallel round-trips), more backend and DB work, more data over the network.
- **Improvement (later):** Use `getDashboardMetrics()` for the initial dashboard view; load full lists only where needed and preferably with pagination.

### 4.2 No pagination in list views

- **Finding:** Accounts and tasks lists appear to load full datasets (no `page`/`limit` in API calls from the inspected pages).
- **Impact:** Slower first load and more memory as data grows.
- **Improvement (later):** Add pagination (or infinite scroll) and use paginated API once available (2.7).

### 4.3 Bundle size

- **Finding:** Vite build warned about chunks larger than 500 kB. Manual chunking is only for `react-vendor`; MUI, Chart.js, etc. are in the main bundle.
- **Impact:** Larger initial download and parse; slower first load on slow networks.
- **Improvement (later):** Split more vendors (e.g. MUI, chart, tiptap) and/or lazy-load heavy routes (e.g. Calendar, Email).

### 4.4 optimizeDeps.force

- **Finding:** `vite.config.ts` has `optimizeDeps: { force: true }`.
- **Impact:** Dev server pre-bundles dependencies on every start; can slow dev startup.
- **Improvement (later):** Remove `force: true` unless you’re debugging dependency issues.

---

## 5. Ollama & document processing

### 5.1 Ollama container always on

- **Finding:** See 1.2. Ollama runs whenever the stack is up. Document processor uses rule-based extraction by default; LLM path is commented out.
- **Impact:** Ollama still consumes RAM and CPU (and a bit of disk) even when no document/LLM feature is used. On a shared host this adds load that can slow both CRMs.
- **Improvement (later):** Start Ollama only when needed (profile or manual start), or accept the cost and add resource limits (1.1).

### 5.2 getLLMStatus

- **Finding:** Integrations/LLM status can call `GET ${OLLAMA_ENDPOINT}/api/tags`. That hits the Ollama container.
- **Impact:** Small per request; main cost is Ollama being running at all (5.1).

---

## 6. Cross-stack and host

### 6.1 Shared host with Pilzno

- **Finding:** CSM CRM (crm-2) and Pilzno CRM run on the same machine. No Docker resource limits; Tailscale (and possibly Funnel) run on the host.
- **Impact:** CPU, RAM, and disk I/O are shared. Heavy load on one stack (e.g. many dashboard loads, or Ollama) can slow the other.
- **Improvement (later):** Set Docker resource limits (1.1), use dashboard metrics endpoint (2.6, 4.1), and optionally reduce or limit Ollama (1.2, 5.1).

### 6.2 Tailscale Funnel

- **Finding:** Two Funnel targets: 443 (Pilzno) and 8443 (CSM). Both proxy to localhost.
- **Impact:** Funnel adds a small amount of CPU and network handling; unlikely to be the main cause of slowness compared to backend/DB and lack of limits.
- **Improvement (later):** None required unless you observe Funnel-specific bottlenecks.

---

## 7. Summary: highest-impact improvements (for later)

| Priority | Area | Change |
|----------|------|--------|
| High | Frontend + Backend | Use `getDashboardMetrics()` on dashboard load instead of getAccounts + getTasks + getRecentActivities + getAllUsers (2.6, 4.1). |
| High | Docker | Add memory (and optionally CPU) limits for backend-fb, postgres-fb, ollama-fb, frontend-fb so neither CRM can starve the other (1.1). |
| Medium | Ollama | Run Ollama only when needed (profile or manual start), or add a memory limit (1.2, 5.1). |
| Medium | Backend | Add pagination to getAllAccounts and getAllTasks; use in list views (2.7, 4.2). |
| Medium | Backend | In production Docker, use `NODE_ENV=production` and compiled `node dist/index.js` (2.1). |
| Low | TypeORM | Set `logging: false` in production; optional pool tuning (2.4). |
| Low | Database | Add indexes on frequently queried columns (2.9). |
| Low | Frontend | Lazy-load heavy routes; split more vendor chunks (4.3). |

---

**End of report.** No changes were applied; use this list to plan and implement improvements when you’re ready.

---

## 8. User-impact of adding pagination (accounts/tasks lists)

**Apart from a faster experience**, adding pagination to accounts and tasks lists would have these user-facing effects:

| Impact | Description |
|--------|-------------|
| **“Page” vs “all”** | Users see a fixed number of items per page (e.g. 20) with Previous/Next or page numbers instead of one long list. They must change page or use search/filters to see more. |
| **Search/filter scope** | Today filters apply to the full in-memory list. With server-side pagination, filters typically apply to the **current page** unless the API supports filtered pagination (e.g. `?status=active&page=1&limit=20`). So you’d add API support for filter + pagination so “filter by status” still works across all data. |
| **Sorting** | Sorting is usually server-side (e.g. `?sort=name&order=asc&page=1`). Changing sort would reset or refetch the list; users get consistent ordering across pages. |
| **Deep links / sharing** | You can support URLs like `/accounts?page=3` so a specific page can be bookmarked or shared. |
| **Perceived completeness** | Users may expect “all my accounts” on one screen; with pagination they see “page 1 of N”. Clear labels (e.g. “Showing 1–20 of 142”) and optional “Show all” (if you keep it) set expectations. |
| **Mobile / small screens** | Fewer items per page often improve usability on small screens; you might use a smaller default page size on mobile. |
| **Export / “all” actions** | Bulk actions today may assume “all visible” or “all selected”. With pagination you need a clear rule: “Selected on this page” vs “All matching (server-side)”. An “Export all” or “Select all matching” would call a separate API. |

**Summary:** Pagination mainly improves speed and scalability; the main UX change is moving from “one long list” to “paged list” and aligning filters, sort, and bulk actions with the API (e.g. filter + sort + page parameters and clear selection/export behavior).
