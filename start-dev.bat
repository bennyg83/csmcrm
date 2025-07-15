@echo off
echo Starting CRM Development Environment...
echo.

echo Building and starting containers...
docker-compose up --build

echo.
echo Development environment started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
echo Database: localhost:5432
echo.
echo Press Ctrl+C to stop all services 