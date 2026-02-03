# Tailscale connectivity (one install, two projects)

**This CRM repo:** [https://github.com/bennyg83/csmcrm](https://github.com/bennyg83/csmcrm)

This CRM acts as a **backend for its own database**. You also have **another project** with its own frontend and backend/DB. Both frontends are hosted on **GitHub Pages**; routing to backends is via **Tailscale**.

## Can one Tailscale install manage both?

**Yes.** One Tailscale installation (one tailnet, one machine or one Docker host) can serve:

- **Two databases** — segregated by port and Docker service (this CRM Postgres on one port, the other project’s DB on another).
- **Two backends** — this CRM API on one port (e.g. 3002), the other project’s API on another (e.g. 3003).
- **Two frontends** — two separate GitHub repos; each frontend calls its own backend using the **same Tailscale host** but **different ports**.

No need for a second Tailscale install. Port and database segregation is done by **port** and **Docker/service** layout.

---

## Recommended layout (Docker Desktop + one Tailscale)

- **One machine** (e.g. your Windows PC or a server) runs:
  - **Docker Desktop** — this CRM stack + (if on the same host) the other project’s stack.
  - **Tailscale** — installed on the **host** (not necessarily inside containers).

- **Same Tailscale install** = same Tailscale IP/hostname for that machine. You expose **multiple ports** on that single Tailscale node:

| Service            | This CRM (crm-2)     | Other project (example) |
|--------------------|----------------------|--------------------------|
| Backend API        | `3002`               | e.g. `3003`              |
| PostgreSQL         | `5434` (host)       | e.g. `5435` (host)       |
| Frontend (dev)     | `5173` (optional)   | e.g. `5174` (optional)  |

- **Database segregation:**
  - This CRM: its own Postgres container (`postgres-fb`), port `CRM2_POSTGRES_PORT` (default 5434) on host, DB name `crm_db_fb`, user `crm_user_fb`.
  - Other project: its own Postgres (or other DB) on a **different port** and **different Docker service/network** so the two DBs never share a container or port.

- **Backend segregation:**
  - This CRM: backend listens on one port (e.g. 3002) and talks only to this CRM’s Postgres.
  - Other project: backend on another port (e.g. 3003) and its own DB.

---

## GitHub Pages + Tailscale (how it works)

1. **Frontends** (static sites) live in two separate GitHub repos and are served by GitHub Pages (e.g. `https://user.github.io/crm` and `https://user.github.io/other-app`).
2. **At runtime**, the browser loads the app from GitHub Pages, then the app calls the API using `VITE_API_URL` (or equivalent). That URL must point to your backend.
3. **Tailscale** makes your machine reachable at a Tailscale IP (e.g. `100.x.x.x`) or MagicDNS name (e.g. `mymachine.your-tailnet.ts.net`). Anyone with Tailscale joined to your tailnet can reach that host.
4. **Same Tailscale install** = one host, one Tailscale IP/hostname, **different ports** for each backend:
   - CRM frontend (repo 1): `VITE_API_URL=https://mymachine.your-tailnet.ts.net:3002/api` (or `http://100.x.x.x:3002/api`).
   - Other frontend (repo 2): `VITE_API_URL=https://mymachine.your-tailnet.ts.net:3003/api` (or whatever port the other backend uses).

So: **one Tailscale install on the host is enough**; you manage two frontends and two backends by **port segregation** and **build-time env** in each repo.

---

## Steps (high level)

### 1. Docker Desktop + port segregation

- Run this CRM stack with **fixed, dedicated ports** (see `PORTS.md` and `.env`):
  - Backend: `CRM2_BACKEND_PORT=3002`
  - Postgres: `CRM2_POSTGRES_PORT=5434`
- Run the **other project** on **different ports** (e.g. backend 3003, DB 5435) and, if on the same host, different Docker Compose project name or separate compose file so networks/containers are separate.

### 2. Tailscale on the host

- Install Tailscale on the **same machine** that runs Docker Desktop (e.g. Windows).
- Do **not** need Tailscale inside each container for basic use: bind backend and DB ports to the host; Tailscale on the host exposes those ports to the tailnet.
- Optional: use **Tailscale Serve** to map paths or ports on the Tailscale node (see [Tailscale Serve](https://tailscale.com/kb/1312/serve)).

### 3. Build-time API URL for each frontend (GitHub Pages)

- **This CRM (repo [bennyg83/csmcrm](https://github.com/bennyg83/csmcrm)):** In the repo that builds the CRM frontend, set the API base URL to the Tailscale host + CRM backend port, e.g.  
  `VITE_API_URL=https://YOUR_TAILSCALE_HOST:3002/api`  
  (Replace `YOUR_TAILSCALE_HOST` with your machine’s MagicDNS name or Tailscale IP.)
- **Other project (repo 2):** In the other repo, set its API URL to the **same** Tailscale host but the **other** backend port, e.g.  
  `VITE_API_URL=https://YOUR_TAILSCALE_HOST:3003/api`  
  (Use the port where the other backend listens.)

Build and deploy each frontend (e.g. GitHub Actions) with the correct `VITE_API_URL` for that repo.

### 4. CORS (backend allows GitHub Pages origins)

- Backend must allow the **origin** of the frontend that calls it (GitHub Pages or custom domain).
- This CRM: in `backend/.env` (or Docker env), set for example:
  ```env
  CORS_ORIGINS=https://youruser.github.io,https://your-custom-domain.com,http://localhost:5173
  ```
- Add the exact origin(s) of the CRM GitHub Pages site (and the other project’s origin for the other backend).

### 5. HTTPS (recommended)

- GitHub Pages is HTTPS; browsers may block mixed content (HTTPS page → HTTP API). Prefer HTTPS for the backends when possible.
- Options: reverse proxy (e.g. Caddy, nginx) on the host with a cert, or Tailscale’s HTTPS features (e.g. Funnel or Serve with TLS). If you use HTTP for now, test in a browser; some setups allow it on Tailscale IPs.

---

## Summary

| Question | Answer |
|----------|--------|
| Same Tailscale install for two frontends and two backends? | **Yes.** One Tailscale node (one install on the host), multiple ports. |
| Two databases? | **Yes.** Segregate by different Docker services and host ports (e.g. CRM 5434, other 5435). |
| Two GitHub repos (two frontends)? | **Yes.** Each repo builds with its own `VITE_API_URL` → same Tailscale host, different backend port. |
| Containers run via Docker Desktop? | **Yes.** Run Tailscale on the **host**; expose host ports for CRM (3002, 5434) and other project (e.g. 3003, 5435). |

Keeping **databases and ports strictly separate** (different ports, different Compose services/networks) ensures this CRM and the other project stay isolated while sharing one Tailscale install.
