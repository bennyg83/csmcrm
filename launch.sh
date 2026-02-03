#!/usr/bin/env sh
# Portable CRM launcher – Mac, Linux, or Windows (Git Bash)
# Usage: ./launch.sh   or   sh launch.sh
# Requires: Docker installed and running

cd "$(dirname "$0")"

# Defaults (no .env required)
export CRM2_BACKEND_PORT="${CRM2_BACKEND_PORT:-3002}"
export CRM2_FRONTEND_PORT="${CRM2_FRONTEND_PORT:-5173}"
export CRM2_POSTGRES_PORT="${CRM2_POSTGRES_PORT:-5434}"
export CRM2_OLLAMA_PORT="${CRM2_OLLAMA_PORT:-11435}"

echo ""
echo "  ========================================"
echo "   CRM – Portable (Mac / Linux / Windows)"
echo "  ========================================"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker, then run this again."
  echo "  Mac:   https://docs.docker.com/desktop/install/mac-install/"
  echo "  Linux: https://docs.docker.com/desktop/install/linux-install/"
  echo "  Windows: use Launch-CRM.bat or install Docker Desktop"
  exit 1
fi

echo "Starting PostgreSQL, Backend, and Frontend..."
echo ""
if docker compose up -d --build 2>/dev/null; then
  :
elif docker-compose up -d --build 2>/dev/null; then
  :
else
  echo "Failed to start. Is Docker running?"
  exit 1
fi

echo ""
echo "Giving services time to start (first run can take 1–2 min)..."
sleep 15
echo ""
echo "  ----------------------------------------"
echo "   App:      http://localhost:$CRM2_FRONTEND_PORT"
echo "   Backend:  http://localhost:$CRM2_BACKEND_PORT"
echo "  ----------------------------------------"
echo ""

# Open browser
if command -v open >/dev/null 2>&1; then
  open "http://localhost:$CRM2_FRONTEND_PORT"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:$CRM2_FRONTEND_PORT"
elif command -v start >/dev/null 2>&1; then
  start "http://localhost:$CRM2_FRONTEND_PORT"
else
  echo "Open in browser: http://localhost:$CRM2_FRONTEND_PORT"
fi

echo "CRM is running. To stop: ./stop.sh  or  docker compose down"
echo ""
