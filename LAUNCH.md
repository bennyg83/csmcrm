# Self-launching, self-sustained CRM on this drive

**For portable use on Mac, Linux, or Windows with the least work → see [PORTABLE.md](PORTABLE.md).**

**Plug-and-play:** No `.env` required. Ports are aligned (backend **3002**, frontend **5173**). The app runs with one double-click (Windows) or one command (Mac/Linux). Data stays in Docker volumes on the same drive.

## Quick start (Windows)

1. **Install Docker Desktop** (once):  
   [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

2. **Start CRM from the project root** (the folder that contains `docker-compose.yml` and the `backend` folder).  
   Double-click **`Launch-CRM.bat`**  
   - Starts PostgreSQL, backend, and frontend in Docker  
   - Opens the app in your browser (first start may take 1–2 minutes)

3. **Stop CRM**  
   Double-click **`Stop-CRM.bat`** when you want to stop the services.  
   Your data is kept in Docker volumes on this drive.

**Mac / Linux:** Use **`./launch.sh`** and **`./stop.sh`** — see [PORTABLE.md](PORTABLE.md).

## Ports (defaults – non-standard to avoid 3000)

| Service   | URL / Host        | Default port |
|----------|-------------------|--------------|
| Frontend | http://localhost  | 5173         |
| Backend  | http://localhost  | **3002**     |
| Postgres | localhost         | 5434         |

Port **3000** is not used so you can reserve it for another app. To change ports, see **[PORTS.md](PORTS.md)**.

## Run at Windows login (optional)

To start CRM automatically when you log in:

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Create a shortcut that:
   - **Target:** `C:\Windows\System32\cmd.exe /c "D:\crm-2\Launch-CRM.bat"`
   - (Replace `D:\crm-2` with the actual path to this project.)
3. Optionally set “Run” to “Minimized” in the shortcut properties.

CRM will start in the background at login; open **http://localhost:5173** in your browser when you need it.

## Without Docker (manual)

If you prefer not to use Docker:

1. Install and run **PostgreSQL** and **Node.js** on this machine.
2. In **backend**, copy `env.example` to `.env` and set `DB_*` and `JWT_SECRET`.
3. From the project root run: `npm run dev` (starts backend + frontend).
4. Open http://localhost:5173.

Data is then in your local PostgreSQL instance; the app is still self-sustained on this drive.
