@echo off
title CRM - Stop
cd /d "%~dp0"

echo Stopping CRM services...
docker compose down 2>nul || docker-compose down 2>nul
echo Done. Containers stopped. Data is kept in Docker volumes on this drive.
pause
