@echo off
setlocal ENABLEDELAYEDEXPANSION

echo Starting CRM-2 Development Environment...

rem Load .env if present
if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    set "%%a=%%b"
  )
)

rem Defaults when not set
if "%CRM2_BACKEND_PORT%"==""  set CRM2_BACKEND_PORT=3002
if "%CRM2_FRONTEND_PORT%"=="" set CRM2_FRONTEND_PORT=5173
if "%CRM2_POSTGRES_PORT%"=="" set CRM2_POSTGRES_PORT=5434
if "%CRM2_OLLAMA_PORT%"==""   set CRM2_OLLAMA_PORT=11435

echo Preflight port check...

powershell -NoProfile -Command "^
  $ports = @{ 'backend'=%CRM2_BACKEND_PORT%; 'frontend'=%CRM2_FRONTEND_PORT%; 'postgres'=%CRM2_POSTGRES_PORT%; 'ollama'=%CRM2_OLLAMA_PORT% };^
  $errors = @();^
  foreach ($k in $ports.Keys) {^
    $p = [int]$ports[$k];^
    try { $ok = (Test-NetConnection -ComputerName 'localhost' -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded } catch { $ok = $false }^
    if ($ok) { $errors += \"Port $p ($k) is already in use\" }^
  }^
  if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Host \" - $_\" -ForegroundColor Red }; exit 2 }"
if errorlevel 2 (
  echo Port preflight failed. Resolve conflicts or adjust ports in .env, then re-run.
  exit /b 2
)

echo Building and starting containers...
where docker >NUL 2>&1
if %ERRORLEVEL% EQU 0 (
  docker compose up -d --build || docker-compose up -d --build
) else (
  echo Docker not found. Please install/start Docker Desktop.
  exit /b 1
)

echo.
echo Development environment started!
echo Frontend: http://localhost:%CRM2_FRONTEND_PORT%
echo Backend:  http://localhost:%CRM2_BACKEND_PORT%
echo Database: localhost:%CRM2_POSTGRES_PORT%
echo.
echo Use "docker compose ps" to view status.
endlocal