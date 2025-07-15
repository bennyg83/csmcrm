Write-Host "Stopping CRM Development Environment..." -ForegroundColor Yellow
Write-Host ""

try {
    docker-compose down
    Write-Host "All services stopped!" -ForegroundColor Green
} catch {
    Write-Host "Error stopping services. You may need to run: docker-compose down manually" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue" 