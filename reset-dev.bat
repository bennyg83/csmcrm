@echo off
echo Resetting CRM Development Environment...
echo.

echo Stopping all containers...
docker-compose down

echo.
echo Removing all containers and volumes...
docker-compose down -v

echo.
echo Removing all images...
docker-compose down --rmi all

echo.
echo Environment reset complete!
echo Run start-dev.bat to start fresh
echo.
pause 