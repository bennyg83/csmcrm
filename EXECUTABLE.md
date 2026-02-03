# Running CRM as an Executable

You can run the CRM as a single executable or a single-process server in several ways.

---

## Option 1: Launcher executable (Docker)

A small **launcher .exe** starts Docker (Postgres + backend + frontend) and opens the app in your browser.

### Build the launcher .exe (requires Go)

1. Install [Go](https://go.dev/dl/) (one-time).
2. From the project root:
   ```bash
   cd launcher
   go build -o CRM-Launcher.exe
   ```
3. Copy `CRM-Launcher.exe` to the **project root** (next to `docker-compose.yml`), or run it from there.
4. Double-click **CRM-Launcher.exe**. It will:
   - Start Docker containers (Postgres, backend, frontend)
   - Wait ~15 seconds
   - Open http://localhost:5173 in your browser

**Requirement:** Docker Desktop must be installed and running.

### Without Go: turn the batch file into an .exe

Use a “Bat to Exe” tool to convert **Launch-CRM.bat** into **CRM-Launcher.exe**:

- [Bat To Exe Converter](https://bat-to-exe-converter-x64.en.softonic.com/) (or similar)
- Open `Launch-CRM.bat`, set output to `CRM-Launcher.exe`, build.
- Place the .exe in the project root (same folder as `docker-compose.yml`).

Double-click the .exe; behavior is the same as the batch file (Docker must be installed).

---

## Option 2: Standalone server (one Node process)

One **Node process** serves both the API and the built frontend. No Docker required for the app; you still need **PostgreSQL** running (local or Docker).

### Build

From the project root:

```bash
npm run build:standalone
```

This builds the frontend (with API base URL `/api`), builds the backend, and copies the frontend into `backend/dist/public/`.

### Run

1. Start **PostgreSQL** (e.g. local install or a Postgres container).
2. In **backend**, copy `env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.
3. From the project root:
   ```bash
   npm run start:standalone
   ```
   Or:
   ```bash
   cd backend
   set NODE_ENV=production
   node dist/index.js
   ```
4. Open **http://localhost:3002** (or whatever `PORT` is in backend `.env`) in your browser.

The app and API are served from the same process on that port.

---

## Option 3: Package the server as CRM-Server.exe (advanced)

You can package the **Node backend** (which serves the built frontend) into a single **CRM-Server.exe** using [pkg](https://github.com/vercel/pkg):

1. Run `npm run build:standalone` so `backend/dist/` includes the `public/` frontend.
2. In **backend**, install pkg and configure it to bundle `dist/index.js` and `dist/public/**`.
3. Build the exe; run it with the same `.env` (or config) so it can connect to PostgreSQL.

**Note:** PostgreSQL is still required (separate install or Docker). A true single .exe with no external database would require switching to an embedded DB (e.g. SQLite), which is a larger change.

---

## Summary

| Option              | Result              | Requires                    |
|---------------------|---------------------|-----------------------------|
| Launcher .exe (Go)  | CRM-Launcher.exe    | Go to build; Docker to run  |
| Bat to Exe          | CRM-Launcher.exe    | Bat-to-Exe tool; Docker     |
| Standalone server   | One Node process    | Node + PostgreSQL           |
| pkg (CRM-Server.exe)| CRM-Server.exe      | pkg + PostgreSQL            |

For a **single double-click executable** with no extra install step for users, use **Option 1** (Launcher .exe) and ship Docker Desktop as a prerequisite, or use **Option 2** and provide a shortcut/script that runs `npm run start:standalone` after Postgres is running.
