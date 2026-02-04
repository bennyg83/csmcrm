# GitHub Pages + Backend + Tailscale — CSM CRM

This guide replicates the setup from the **Pilzno CRM** reference project for **this** project (CSM CRM).  
**Keep databases and GitHub targets segregated:** this repo, its frontend URL, backend port, and secret are **separate** from the other project.

**This project (CSM CRM) — “second” project on the same machine as Pilzno:**
- **Repo:** [bennyg83/csmcrm](https://github.com/bennyg83/csmcrm)
- **Frontend URL:** https://bennyg83.github.io/csmcrm/
- **Backend port (host):** **3004** (Pilzno uses 3002; see PORTS.md)
- **Database:** PostgreSQL on port **5436**, DB `crm_db_fb` (Docker). Pilzno uses 5435; do not share.

**Reference project (Pilzno CRM) — “first” project:**
- Frontend: https://bennyg83.github.io/pilzno_crm/
- Backend: host port **3002**, DB port **5435**
- Tailscale Funnel (example): https://crm-mini.tail34e202.ts.net

---

## What to set for `BACKEND_API_URL` in GitHub (this repo)

The frontend calls `BACKEND_API_URL` + `/api`. Set the **Actions secret** `BACKEND_API_URL` in **bennyg83/csmcrm** to one of the following (no trailing slash).

### Option A — Reverse proxy (same machine, one Funnel)

Run a reverse proxy (e.g. Caddy) on one port (e.g. 3010) that routes:
- `/pilzno` → localhost:3002 (Pilzno)
- `/csmcrm` (or `/other`) → localhost:3004 (this project)

Run one Funnel on that port: `tailscale funnel --bg 3010`. Then:

| Secret | Value (example) |
|--------|------------------|
| **BACKEND_API_URL** | `https://crm-mini.tail34e202.ts.net/csmcrm` |

Replace `crm-mini.tail34e202.ts.net` with your Funnel hostname from `tailscale funnel status`. Replace `csmcrm` with the path you use for this app in the proxy (e.g. `other` → `https://crm-mini.tail34e202.ts.net/other`).

The frontend will call `https://crm-mini.tail34e202.ts.net/csmcrm/api`.

### Option B — Separate Funnel URL (same host or different machine)

**Same host:** Expose CSM (port 3004) on a second Funnel port so it has its own base URL (no `/csmcrm` path). Funnel allows ports 443, 8443, and 10000. If Pilzno already uses 443, run:

```bash
tailscale funnel --https=8443 --bg 3004
```

Then run `tailscale funnel status` and use the HTTPS URL for port 8443 (e.g. `https://crm-mini.tail34e202.ts.net:8443`).

| Secret | Value (example) |
|--------|------------------|
| **BACKEND_API_URL** | `https://crm-mini.tail34e202.ts.net:8443` |

The frontend will call `https://crm-mini.tail34e202.ts.net:8443/api`. No path prefix; backend serves `/api/*` as usual.

**Different machine:** Run this project’s backend on another device that has Tailscale. On that node: `tailscale funnel --bg 3004`, then `tailscale funnel status` and copy the HTTPS URL (e.g. `https://other-device.tail34e202.ts.net`). Set **BACKEND_API_URL** to that URL (no trailing slash).

---

## 1. Architecture Overview

```
User's Browser
    │ HTTPS
    ▼
GitHub Pages (frontend)
    │ https://bennyg83.github.io/csmcrm/
    │
    │ API calls (HTTPS)
    ▼
Tailscale Funnel (public HTTPS URL for this backend only)
    │ e.g. https://YOUR_DEVICE.tailXXXXXX.ts.net (or a different Funnel for port 3002)
    │
    ▼
Your machine: Backend on port 3004 (or path /csmcrm via reverse proxy)
    │
    ▼
PostgreSQL (port 5436, crm_db_fb) — local only, segregated
```

- **Frontend:** Static site on GitHub Pages.
- **Backend:** Runs locally on port **3004**; exposed via **Tailscale** (Option A: path under one Funnel, or Option B: second node’s Funnel).
- **Database:** Local only; this CRM uses port **5436**. Pilzno uses 5435; do not share.

---

## 2. Prerequisites

- **GitHub:** Repo `bennyg83/csmcrm`; GitHub Actions and Pages enabled.
- **Tailscale:** Installed on the machine that runs this backend; Funnel available.
- **Local stack:** This CRM backend on port **3004**, Postgres on **5436** (see docker-compose and PORTS.md). Pilzno uses 3002 and 5435.

---

## 3. Steps Summary

| # | Step | Where / How |
|---|------|-------------|
| 1 | Enable GitHub Pages from **GitHub Actions** | Repo → Settings → Pages → Source: **GitHub Actions** |
| 2 | Add GitHub **secret** `BACKEND_API_URL` | Repo → Settings → Secrets and variables → Actions → Secret = Tailscale Funnel HTTPS URL (no trailing slash) |
| 3 | Workflow builds and deploys frontend | `.github/workflows/deploy-frontend-pages.yml` uses `secrets.BACKEND_API_URL` and `npm run build:pages` |
| 4 | Vite base path for repo subpath | `frontend/vite.config.ts` → base `/csmcrm/` when `mode === 'pages'` or `GITHUB_PAGES === 'true'` |
| 5 | Build script for Pages | `frontend/package.json` → `"build:pages": "tsc && vite build --mode pages"` |
| 6 | Backend URL at build time | Workflow passes `secrets.BACKEND_API_URL` as `VITE_API_BASE_URL`; frontend appends `/api` |
| 7 | `.nojekyll` in built output | In `frontend/public/.nojekyll` (copied to dist) |
| 8 | Backend CORS for GitHub Pages | Backend allows `https://bennyg83.github.io` and `https://bennyg83.github.io/csmcrm` |
| 9 | Expose this backend via Tailscale | Option A: reverse proxy or Serve path (e.g. `/csmcrm` → localhost:3004). Option B (same host): `tailscale funnel --https=8443 --bg 3004`; Option B (other machine): `tailscale funnel --bg 3004` on that node. |
| 10 | Set `BACKEND_API_URL` in this repo | Option A: `https://YOUR_FUNNEL_HOST/csmcrm`. Option B (same host): `https://YOUR_NODE.tailXXXX.ts.net:8443`. Option B (other machine): `https://OTHER_DEVICE.tailXXXX.ts.net`. No trailing slash. |

---

## 4. Backend Configuration

### 4.1 CORS (critical for GitHub Pages)

The backend must allow the **GitHub Pages origin** for this repo.

**File:** `backend/src/index.ts`

Allowed origins include:
- `https://bennyg83.github.io`
- `https://bennyg83.github.io/csmcrm`
- Plus any from `CORS_ORIGINS` env (comma-separated).

### 4.2 Backend port (this project)

- This CRM backend listens on port **3004** on the host (Docker: 3004:3000). Pilzno uses 3002; do not use 3002 for this project.
- **Tailscale:** One Funnel per machine. Use Option A (reverse proxy with path, e.g. `/csmcrm` → localhost:3004) or Option B (second node with `tailscale funnel --bg 3004`).
- **Database:** Postgres for this CRM only (port **5436**, `crm_db_fb`). Pilzno uses 5435.

---

## 5. Tailscale Setup and Usage

### 5.1 Segregation

- **Pilzno:** Backend 3002, DB 5435. Funnel is often on 3002 (one Funnel per machine).
- **This CRM (CSM):** Backend **3004**, DB **5436**. Do not run `tailscale funnel --bg 3004` on the same machine as Pilzno’s Funnel (3002)—it would replace Pilzno’s Funnel. Use **Option A** (reverse proxy with path) or **Option B** (second Tailscale node).
- **Databases:** This CRM uses 5436; Pilzno uses 5435. No shared DB.

### 5.2 Option A — Reverse proxy (same machine)

Run a reverse proxy (e.g. Caddy) that routes `/pilzno` → localhost:3002 and `/csmcrm` → localhost:3004. Expose the proxy (e.g. port 3010) with one Funnel: `tailscale funnel --bg 3010`. Then `BACKEND_API_URL` for this repo = `https://YOUR_FUNNEL_HOST/csmcrm` (no trailing slash).

### 5.3 Option B — Second node

On a different machine/container with Tailscale: run this project’s backend on 3004, then `tailscale funnel --bg 3004`. Use that node’s Funnel URL as `BACKEND_API_URL` (e.g. `https://other-device.tail34e202.ts.net`).

### 5.4 Stop / restart (Option B only)

```powershell
tailscale funnel reset
tailscale funnel --bg 3004
```

---

## 6. Frontend Configuration for GitHub Pages

### 6.1 Base path (Vite)

- Repo name: **csmcrm** → base path `/csmcrm/`.
- In `frontend/vite.config.ts`, when `mode === 'pages'` or `GITHUB_PAGES === 'true'`, `base: '/csmcrm/'`; otherwise `base: '/'` for local dev.

### 6.2 Backend URL at build time

- GitHub **secret** `BACKEND_API_URL` = Tailscale Funnel HTTPS URL (e.g. `https://crm-mini.tail34e202.ts.net`), **no trailing slash**.
- Workflow sets `VITE_API_BASE_URL: ${{ secrets.BACKEND_API_URL }}`.
- Frontend uses `VITE_API_BASE_URL` and appends `/api` for the API base (or uses `VITE_API_URL` if set).
- No hardcoded production backend URL in the repo.

### 6.3 Build script for GitHub Pages

- `frontend/package.json`: `"build:pages": "tsc && vite build --mode pages"`.
- CI runs `npm run build:pages` with `GITHUB_PAGES=true` and `VITE_API_BASE_URL` set.

### 6.4 `.nojekyll`

- Empty file `frontend/public/.nojekyll` is copied to `dist/` so GitHub Pages (Jekyll) does not ignore paths starting with `_`.

---

## 7. GitHub Actions Workflow

**File:** `.github/workflows/deploy-frontend-pages.yml`

- **Build job:** checkout → Node → `npm ci` in frontend → `npm run build:pages` with:
  - `NODE_ENV: production`
  - `GITHUB_PAGES: true`
  - `VITE_API_BASE_URL: ${{ secrets.BACKEND_API_URL }}`
- Then: SPA fallback (`cp dist/index.html dist/404.html`), ensure `.nojekyll` in `frontend/dist`, upload `frontend/dist` as artifact.
- **Deploy job:** deploy to GitHub Pages.

**Important:** Set the repo **secret** `BACKEND_API_URL` to the Tailscale Funnel HTTPS URL for **this** backend (port 3002). Do not reuse the other project’s URL.

---

## 8. GitHub Repository Settings (this repo: csmcrm)

### 8.1 GitHub Pages

- **Settings → Pages**
- **Source:** **GitHub Actions**.

### 8.2 Secret for backend URL

- **Settings → Secrets and variables → Actions**
- **New repository secret**
  - **Name:** `BACKEND_API_URL`
  - **Value:** Either **Option A** path-based URL (e.g. `https://crm-mini.tail34e202.ts.net/csmcrm`) or **Option B** second node’s Funnel URL (e.g. `https://other-device.tail34e202.ts.net`). **No trailing slash.** See “What to set for BACKEND_API_URL” above.

After changing the secret, trigger a new deploy (push to `main` or Run workflow).

---

## 9. Checklist for This Project (CSM CRM)

### Repo and GitHub

- [ ] Pages source set to **GitHub Actions**.
- [ ] Secret `BACKEND_API_URL` set to **this** backend’s Tailscale Funnel URL (port 3002).

### Backend (your machine)

- [ ] This CRM backend and DB run (e.g. Docker); backend on host port **3004**, Postgres on **5436** (Pilzno uses 3002 and 5435).
- [ ] CORS allows `https://bennyg83.github.io` and `https://bennyg83.github.io/csmcrm`.
- [ ] Tailscale: Option A (reverse proxy path for this app) or Option B (second node with Funnel on 3004).
- [ ] **Do not** use port 3002 or 5435 for this project (those are Pilzno’s).

### Frontend

- [ ] `vite.config.ts`: base `/csmcrm/` when `mode === 'pages'` or `GITHUB_PAGES === 'true'`.
- [ ] `package.json`: script `"build:pages": "tsc && vite build --mode pages"`.
- [ ] API base URL from `VITE_API_BASE_URL` (append `/api`); fallback `VITE_API_URL` or localhost for dev.
- [ ] `frontend/public/.nojekyll` present.

### Workflow

- [ ] Workflow uses `npm run build:pages` and sets `VITE_API_BASE_URL: ${{ secrets.BACKEND_API_URL }}`, `GITHUB_PAGES: true`.
- [ ] Artifact is `frontend/dist/`; deploy uses GitHub Pages deploy action.

### Verification

- [ ] Push to `main` (or Run workflow); workflow succeeds.
- [ ] https://bennyg83.github.io/csmcrm/ loads.
- [ ] Login/API from the site works (backend reached via Tailscale Funnel).
- [ ] No CORS errors; backend logs show requests from GitHub Pages origin.

---

## 10. Key Files in This Project

| Purpose | File(s) |
|--------|--------|
| Pages deploy workflow | `.github/workflows/deploy-frontend-pages.yml` |
| Vite base path & build | `frontend/vite.config.ts` |
| API base URL | `frontend/src/services/api.ts` |
| Pages build script | `frontend/package.json` → `build:pages` |
| CORS | `backend/src/index.ts` |
| Jekyll bypass | `frontend/public/.nojekyll` |
| Ports & segregation | `PORTS.md`, `TAILSCALE.md` |

---

**Document purpose:** Replicate GitHub Pages + Tailscale Funnel for **CSM CRM** while keeping databases and GitHub targets **segregated** from the other project (Pilzno CRM).  
**Last updated:** February 2025.
