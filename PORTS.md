# Port assignments (non-standard defaults)

Port **3000** is not used by default so you can reserve it for another app. CRM uses these defaults:

| Service   | Default port | Env variable (backend / root .env) |
|-----------|--------------|------------------------------------|
| Backend API | **3002**   | `PORT` (backend) or `CRM2_BACKEND_PORT` (Docker) |
| Frontend  | **5173**     | `CRM2_FRONTEND_PORT` (Docker only)  |
| PostgreSQL| **5434**     | `CRM2_POSTGRES_PORT` (Docker)       |

**Segregation:** This CRM is a backend for its own database. If you run another project (different backend/DB) on the same host, use **different ports** (e.g. other backend 3003, other DB 5435) so databases and APIs stay separate. See **TAILSCALE.md** for one Tailscale install serving two frontends and two backends.

---

## Changing ports

### Local dev (npm run dev)

1. **Backend:** In `backend/.env` set:
   ```env
   PORT=3002
   ```
   (Use any free port, e.g. 3003, 4000.)

2. **Frontend:** In `frontend/.env` set the same port for the API:
   ```env
   VITE_API_URL=http://localhost:3002/api
   ```
   (Replace 3002 with the port you set for the backend.)

3. **CORS:** If you change the frontend port (e.g. in vite), add it in `backend/.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3002
   ```

### Docker (Launch-CRM.bat / launch.sh)

In the **project root** `.env` (or set before running):

```env
CRM2_BACKEND_PORT=3002
CRM2_FRONTEND_PORT=5173
CRM2_POSTGRES_PORT=5434
```

Use any free ports; keep backend and frontend in sync (frontend container uses `CRM2_BACKEND_PORT` for API calls).
