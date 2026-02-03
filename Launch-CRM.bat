@echo off
title CRM - Launcher
cd /d "%~dp0"

rem Defaults so the app is self-sustained on this drive (no external .env required)
if "%CRM2_BACKEND_PORT%"==""  set CRM2_BACKEND_PORT=3002
if "%CRM2_FRONTEND_PORT%"=="" set CRM2_FRONTEND_PORT=5173
if "%CRM2_POSTGRES_PORT%"=="" set CRM2_POSTGRES_PORT=5434
if "%CRM2_OLLAMA_PORT%"==""   set CRM2_OLLAMA_PORT=11435

echo.
echo  ========================================
echo   CRM - Self-launching on this drive
echo  ========================================
echo.

where docker >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Docker not found. Please install and start Docker Desktop, then run this again.
  echo https://docs.docker.com/desktop/install/windows-install/
  pause
  exit /b 1
)

echo Starting PostgreSQL, Backend, and Frontend...
echo.
docker compose up -d --build 2>nul || docker-compose up -d --build 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Failed to start containers. Check Docker is running and try again.
  pause
  exit /b 1
)

echo.
echo Giving services time to start (first run can take 1-2 min)...
timeout /t 15 /nobreak > NUL 2>&1
:open_browser
echo.
echo  ----------------------------------------
echo   App URL:  http://localhost:%CRM2_FRONTEND_PORT%
echo   Backend:  http://localhost:%CRM2_BACKEND_PORT%
echo   Database: localhost:%CRM2_POSTGRES_PORT%
echo  ----------------------------------------
echo.
start "" "http://localhost:%CRM2_FRONTEND_PORT%"

echo CRM is running. Close this window to leave it running in the background.
echo To stop CRM, run Stop-CRM.bat or: docker compose down
echo.
pause
