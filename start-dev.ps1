Write-Host "Starting CRM Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found in PATH. Please ensure Docker Desktop is running and restart your terminal." -ForegroundColor Red
    Write-Host "Alternatively, you can run: docker-compose up --build manually" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build

Write-Host ""
Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Database: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow 