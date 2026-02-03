# Hosting the frontend on GitHub Pages

The frontend is built and deployed to **GitHub Pages** by the workflow [`.github/workflows/deploy-frontend-pages.yml`](.github/workflows/deploy-frontend-pages.yml). The app will be available at:

**https://bennyg83.github.io/csmcrm/**

## One-time setup

### 1. Enable GitHub Pages (Actions)

1. In the repo: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### 2. Set the API URL (required for production)

The built frontend calls your backend using `VITE_API_URL`. Set it so the deployed app talks to your backend (e.g. Tailscale URL).

1. In the repo: **Settings → Secrets and variables → Actions**.
2. Open the **Variables** tab.
3. Click **New repository variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend base URL, e.g.  
     - Tailscale: `https://yourmachine.your-tailnet.ts.net:3002/api` or `http://100.x.x.x:3002/api`  
     - Or your production API URL.

Save. The next workflow run will use this value when building the frontend.

### 3. CORS on the backend

Your backend must allow requests from the GitHub Pages origin:

- `https://bennyg83.github.io`

In `backend/.env` (or your deployment config), set for example:

```env
CORS_ORIGINS=https://bennyg83.github.io,http://localhost:5173
```

## Deployments

- **Automatic:** Every push to `main` runs the workflow: build frontend → deploy to GitHub Pages.
- **Manual:** **Actions** tab → **Deploy frontend to GitHub Pages** → **Run workflow**.

## Local development

Local dev is unchanged. The Vite base path is only set in CI (`VITE_BASE_PATH=/csmcrm/`). For local runs, `base` stays `/`.
