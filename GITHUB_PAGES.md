# Hosting the frontend on GitHub Pages

The frontend is built and deployed to **GitHub Pages** by the workflow [`.github/workflows/deploy-frontend-pages.yml`](.github/workflows/deploy-frontend-pages.yml). The app will be available at:

**https://bennyg83.github.io/csmcrm/**

For the full setup (Tailscale Funnel, CORS, segregation from other projects), see **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.

## One-time setup

### 1. Use GitHub Actions as the Pages source (required)

**Important:** Do **not** set Source to **“Deploy from a branch”**. That would serve the raw repo (folder list, README) instead of the login app.

1. In the repo go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save. The site will update after the next workflow run.

### 2. Set the backend URL (required for production)

The workflow uses the **secret** `BACKEND_API_URL`. The built frontend calls that URL + `/api`. Set it to one of:

- **Option A (path-based, one Funnel):**  
  `https://YOUR_FUNNEL_HOST/csmcrm`  
  Example: `https://crm-mini.tail34e202.ts.net/csmcrm` (no trailing slash). Use a reverse proxy or Tailscale Serve so `/csmcrm` routes to localhost:3004.

- **Option B (separate Funnel URL, same host):**  
  Expose CSM backend (port 3004) on a **second Funnel port** (443 is often Pilzno; use 8443 or 10000 for CSM):
  ```bash
  tailscale funnel --https=8443 --bg 3004
  ```
  Then set `BACKEND_API_URL` to the URL for that port, e.g.  
  `https://crm-mini.tail34e202.ts.net:8443` (no trailing slash).  
  Check `tailscale funnel status` for the exact URL.

- **Option B (different machine):**  
  `https://OTHER_DEVICE.tail34e202.ts.net`  
  (Funnel URL of the node where this backend runs on port 3004; no trailing slash.)

1. In the repo: **Settings → Secrets and variables → Actions** → **Secrets**.
2. **New repository secret**: **Name** `BACKEND_API_URL`, **Value** one of the URLs above.

After changing the secret, trigger a new deploy (push to `main` or Run workflow). See **DEPLOYMENT_GUIDE.md** for details.

### 3. CORS on the backend

The backend already allows `https://bennyg83.github.io` and `https://bennyg83.github.io/csmcrm` by default. You can add more origins via `CORS_ORIGINS` in `backend/.env` if needed.

## Deployments

- **Automatic:** Every push to `main` runs the workflow: build frontend (`npm run build:pages`) → deploy to GitHub Pages.
- **Manual:** **Actions** tab → **Deploy frontend to GitHub Pages** → **Run workflow**.

## Local development

Local dev is unchanged. Use `npm run dev`; the API base URL falls back to `http://localhost:3002/api`. The base path is `/` for local runs; `/csmcrm/` is used only when building for Pages (`npm run build:pages`).
