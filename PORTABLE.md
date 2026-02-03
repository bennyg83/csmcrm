# Portable CRM – least work, any machine

Use this as **your own portable CRM** on a USB drive or any computer. Same steps on **Mac, Linux, or Windows**.

**Plug-and-play:** No `.env` files required. Ports are aligned by default (backend **3002**, frontend **5173**).

---

## One-time setup per machine

1. **Run from the project root**  
   Always start Docker from the folder that contains **docker-compose.yml** and the **backend** and **frontend** folders. If you run from inside `backend` or elsewhere, the app can’t find its files and you may see “Could not read package.json”.

2. **Install Docker** (only thing you need):
   - **Mac:** [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - **Linux:** [Docker Engine](https://docs.docker.com/engine/install/) or [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux-install/)
   - **Windows:** [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

2. **Copy this folder** (or clone the repo) onto the machine — or onto a USB drive and plug it in.

That’s it. No database or Node install; Docker runs everything.

---

## How to run (one action)

| OS        | What to do |
|----------|------------|
| **Windows** | Double-click **`Launch-CRM.bat`** |
| **Mac / Linux** | In a terminal: **`./launch.sh`** or **`sh launch.sh`** |

*(On Mac/Linux, first time: `chmod +x launch.sh stop.sh` if needed.)*

- Docker starts PostgreSQL + backend + frontend.
- Your browser opens to the app (first start may take 1–2 minutes).
- Data lives in Docker volumes **inside this folder** (or on the same drive), so it travels with the project.

---

## How to stop

| OS        | What to do |
|----------|------------|
| **Windows** | Double-click **`Stop-CRM.bat`** |
| **Mac / Linux** | In a terminal: **`./stop.sh`** or **`sh stop.sh`** |

Stopping does not delete your data; it stays in Docker volumes.

---

## Bringing it with you

- Copy the **whole project folder** (or the repo) to another Mac, Linux, or Windows PC.
- On that PC, install Docker once, then run **Launch-CRM.bat** (Windows) or **launch.sh** (Mac/Linux) as above.
- Your data is in Docker volumes. To move data to another machine, use Docker’s volume export/import, or rely on backups (e.g. `backend/` plus a DB dump if you add one).

---

## Summary

- **Least work:** Install Docker once, then one click (Windows) or one command (Mac/Linux).
- **Portable:** Copy the folder (and optionally the Docker data) to any machine or USB.
- **Mac, Linux, Windows:** Same flow; only the launcher name differs (`.bat` vs `launch.sh`).

### “Could not read package.json” or ENOENT /app/package.json

- Start Docker from the **project root** (the folder that has `docker-compose.yml`, `backend/`, and `frontend/`). Use **Launch-CRM.bat** or **launch.sh** from there, or run `docker compose up` from that folder.
- **Windows:** If the project is on another drive (e.g. D:), add that drive in **Docker Desktop → Settings → Resources → File sharing**, then restart Docker.
