@echo off
echo Stopping CRM Development Environment...
echo.

echo Stopping all containers...
docker-compose down

echo.
echo All services stopped!
echo.
pause 