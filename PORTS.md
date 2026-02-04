# Port assignments (non-standard defaults)

**Same machine as Pilzno CRM:** Pilzno uses DB **5435** and Backend **3002**. This project (CSM CRM) uses **different** ports so they don’t conflict:

| Service     | This project (CSM CRM) | Env variable (Docker)     |
|-------------|------------------------|---------------------------|
| Backend API | **3004**               | `CRM2_BACKEND_PORT`       |
| PostgreSQL  | **5436**               | `CRM2_POSTGRES_PORT`     |
| Frontend    | **5173**               | `CRM2_FRONTEND_PORT`      |

**Segregation:** Do not use 3002 or 5435 for this project (those are Pilzno’s). See **DEPLOYMENT_GUIDE.md** for Tailscale and **BACKEND_API_URL**.

---

## Changing ports

### Local dev (npm run dev)

1. **Backend:** In `backend/.env` set:
   ```env
   PORT=3004
   ```
   (Use any free port, e.g. 3003, 4000.)

2. **Frontend:** In `frontend/.env` set the same port for the API:
   ```env
   VITE_API_URL=http://localhost:3004/api
   ```
   (Replace 3002 with the port you set for the backend.)

3. **CORS:** If you change the frontend port (e.g. in vite), add it in `backend/.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3004
   ```

### Docker (Launch-CRM.bat / launch.sh)

In the **project root** `.env` (or set before running):

```env
CRM2_BACKEND_PORT=3004
CRM2_FRONTEND_PORT=5173
CRM2_POSTGRES_PORT=5436
```

Use any free ports; keep backend and frontend in sync (frontend container uses `CRM2_BACKEND_PORT` for API calls).
