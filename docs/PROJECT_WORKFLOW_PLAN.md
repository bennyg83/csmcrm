# Project & Workflow Enhancement Plan

## 1. Top-down use cases

### Primary actors
- **Internal:** CSM, AM, SE, PM, leadership  
- **External:** Client contacts (sponsors, technical, business)

### Use cases (summary)

| Use case | Actor | Goal | Notes |
|----------|--------|------|--------|
| Run a structured onboarding | CSM/PM | Track one account through a defined onboarding flow | Onboarding project + tasks + milestones |
| Run an expansion | AM/CSM | Track upsell/expansion as a project with phases | Expansion project, revenue linkage |
| Run a POV/POC | SE/CSM | Track evaluation, success criteria, go/no-go | POV project, dates, contacts, outcome |
| Run risk management | CSM/AM | Track at-risk accounts with actions and milestones | Risk project, health/revenue linkage |
| Drive adoption | CSM | Track usage, training, QBRs as a project | Adoption project, health linkage |
| See all work for an account | Any | One place for projects + tasks + who’s involved | Account-centric project list |
| Tag tasks for workflows | Any | Mark tasks as part of a “flow” (e.g. onboarding, risk) | Tags + optional project/milestone |
| Plan risk and revenue | Leadership | Use project/account data for risk and monetary forecasting | Read from Projects + Accounts (later) |

### Flows you’re describing (simplified)

- **Account** ↔ many **Projects** (each has a type: Onboarding, Expansion, POV/POC, Risk, Adoption).  
- **Project** ↔ many **Tasks**, many **Milestones**, many **Contacts** (internal + external).  
- **Tasks** can be simple to-dos or steps in a larger flow; **tags** indicate which flow/type they belong to.

---

## 2. Conceptual model (target)

### New / changed concepts

```
Account (existing)
  └── 1:N  Project
            ├── type: enum [Onboarding, Expansion, POV/POC, Risk, Adoption]
            ├── name, description, status, targetDate, …
            ├── 1:N  Milestone (name, dueDate, status, optional deliverable)
            ├── 1:N  ProjectTask (or link existing Task via projectId)
            └── N:M  ProjectContact (role: sponsor | technical | business | internal_csm | …)

Task (existing, extended)
  ├── optional projectId → Project
  ├── optional milestoneId → Milestone
  └── tags: keep freeform and/or add “workflow tags” (e.g. onboarding, risk, expansion)
```

So:

- **Project** = one “ initiative” per account (one onboarding, one expansion, one POV, etc.). An account can have several projects of different (or same) types.
- **Milestone** = phase/gate inside a project (e.g. “Kickoff done”, “Go-live”).
- **Task** = can still be a loose to-do (no project) or part of a project/milestone; tags support both.
- **ProjectContact** = which people (from your Contacts + internal users) are involved in that project, and in what role.

### Relationship to existing entities

- **Workflow** (current): automation (when X do Y). Keep as-is; it can later create tasks/projects or tag tasks.
- **Lead**: stays opportunity/sales; an Expansion *project* can be created when a lead converts, but Lead ≠ Project.
- **Category** (task categories): keep for “kind of work” (e.g. Support, Implementation). Project **type** is the “client initiative” (Onboarding, Risk, etc.).
- **Tags** on tasks: extend usage to “workflow” and “project type” (e.g. `#onboarding`, `#risk`, `#expansion`) so filtering and reporting stay simple.

---

## 3. Build in-app vs separate then merge

### Option A: Build directly in the CRM app

**Idea:** Add Projects, Milestones, ProjectContact (and extend Task) inside this repo and UI.

| Pros | Cons |
|------|------|
| Single DB, single auth, single Account/Contact model | Touches existing Task/Account UI and APIs |
| No merge later: one source of truth for accounts, contacts, projects, tasks | Requires disciplined scoping so “Projects” stays a clear module |
| Risk/forecasting can read from same DB (projects, health, revenue) from day one | Schema migrations and careful rollout |

### Option B: Build a separate “Project/PM” app, merge later

**Idea:** New app/repo with its own DB; later merge schemas and UIs.

| Pros | Cons |
|------|------|
| Fast iteration without affecting live CRM | Two sources of truth for “account” and “contacts” until merge |
| Clear boundary of “project module” | Merge is costly: schema, APIs, permissions, deduplication, UX |
| Can experiment with different stack if desired | Forecasting has to integrate with two systems now, one later |

### Recommendation: **Build in-app, as a bounded “Projects” module**

Reasons:

1. **Accounts and contacts are the core.** Projects are always “for an account” with “these contacts”. Keeping them in one app avoids sync and merge problems.
2. **Risk and monetary forecasting** need account + project + task + health + revenue in one place. Doing that in one DB and one API surface is simpler than integrating a second app and then merging.
3. **You already have Tasks and Categories.** Extending Task with `projectId` / `milestoneId` and using tags is a small, backward‑compatible change. A separate app would duplicate “tasks” or force awkward sync.
4. **“Merge later” is high risk.** Merging two apps (auth, roles, accounts, contacts, tasks, projects) is a multi-week project. Designing the schema and APIs in-app from the start avoids that.
5. **You can still keep a clear boundary:**  
   - New entities: `Project`, `Milestone`, `ProjectContact` (and optional `ProjectType` if you want it in DB).  
   - New backend routes: `/api/projects`, `/api/milestones`, etc.  
   - New UI sections: “Projects” per account, “Project detail,” “Project tasks/milestones.”  
   - Existing task list/board can stay; add “Project” and “Tags” as filters and columns.

So: **build it inside this app, but treat “Projects” as a first-class module** (distinct routes, entities, and UI sections) so that later you can plug in risk and monetary forecasting against a clear project/account model.

---

## 4. Phased implementation plan

### Phase 1 – Foundation (in-app)

- **Schema**
  - Add `Project` (accountId, type, name, description, status, start/target dates, etc.).
  - Add `Milestone` (projectId, name, dueDate, status, sortOrder).
  - Add `ProjectContact` (projectId, contactId or userId, role).
  - Extend `Task`: optional `projectId`, optional `milestoneId`; keep `tags` and add guidance for workflow tags (e.g. `onboarding`, `risk`, `expansion`).
- **APIs**
  - CRUD for Projects (scoped by account).
  - CRUD for Milestones (scoped by project).
  - Assign/remove ProjectContacts.
  - Task API: filter and update by `projectId` / `milestoneId` / tags.
- **UI**
  - “Projects” section (e.g. under Accounts or as a top-level “Projects” that’s account-scoped).
  - Project list/detail, milestones, “Project tasks” and “Project contacts.”
  - When creating/editing a task, optional project/milestone and tags.

Outcome: every project type (Onboarding, Expansion, POV, Risk, Adoption) is represented as a Project; tasks can be grouped under projects and milestones; contacts and users are linked via ProjectContact.

### Phase 2 – Tagging and workflow UX

- Define a **small set of workflow tags** (or “project-type” tags) aligned to project types (e.g. `onboarding`, `expansion`, `pov`, `risk`, `adoption`).
- In task UI: easy choice of these tags plus freeform tags; filters in task list/board by tag and by project.
- Optional: when creating a project, auto-create a small default set of tasks/milestones from a template (e.g. “Onboarding” template).

Outcome: tasks are clearly part of “larger project flows” both by project/milestone and by tags.

### Phase 3 – Risk and monetary integration points

- **Read-only “views” for forecasting:**  
  - By account: projects (by type), milestones, health, revenue, renewal.  
  - By project type: counts, timelines, revenue linked to expansions, risk projects, etc.
- **APIs** used by internal tools or a future “Risk & forecasting” UI:
  - e.g. `GET /api/accounts/:id/summary` (health, revenue, project counts by type, overdue milestones).
  - e.g. `GET /api/projects?type=Risk|Expansion&status=active` for portfolio views.
- Keep logic in the CRM app; forecasting can be a separate front-end or tab that only consumes these APIs.

Outcome: risk and monetary forecasting can be built (or extended) on top of a single project/account model without merging another app.

### Phase 4 – Optional “project templates” and automation

- Project templates (e.g. “Standard onboarding”, “POV”, “Risk review”) with default milestones and suggested tasks.
- Optional **Workflow** triggers: e.g. “When account health &lt; X, create or update a Risk project” or “When lead closes, create Expansion project.”
- Dashboards: “Projects by type,” “Overdue milestones,” “Accounts with active Risk projects.”

---

## 5. Minimal schema sketch (for implementation)

```text
Project
  id, accountId, type (enum), name, description, status, startDate, targetDate,
  createdBy, createdAt, updatedAt

Milestone
  id, projectId, name, dueDate, status, sortOrder, createdAt, updatedAt

ProjectContact
  id, projectId, contactId (nullable), userId (nullable), role, createdAt, updatedAt

Task (add)
  projectId (nullable), milestoneId (nullable)
  tags (existing json); recommend convention for workflow tags
```

Enums for `Project.type`: `Onboarding | Expansion | POV_POC | Risk | Adoption`.  
Enums for `Project.status`: e.g. `Planning | Active | On Hold | Completed | Cancelled`.  
`Milestone.status`: e.g. `Pending | In Progress | Done | Skipped`.

---

## 6. Summary

- **Use cases:** onboarding, expansion, POV/POC, risk, adoption as **projects** per account, with tasks, milestones, and internal/external contacts.
- **Model:** Project (per account, with type) → Milestones, ProjectContacts; Task extended with optional project/milestone and tags.
- **Recommendation:** Build this **inside the current app** as a “Projects” module; avoid a separate app and a later merge.
- **Next step:** Implement Phase 1 (schema + core APIs + basic Projects UI), then add tagging and filters (Phase 2), then add APIs and concepts for risk/monetary forecasting (Phase 3).

If you want to move ahead, the next concrete step is Phase 1: add `Project`, `Milestone`, and `ProjectContact` plus Task changes, then add the REST routes and a minimal “Projects” UI under an account (or under a global “Projects” view filtered by account).
