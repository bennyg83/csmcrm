Write-Host "Running Database Migration..." -ForegroundColor Yellow
Write-Host ""

# Get the PostgreSQL container name
$containerName = "crm-2-postgres-1"

# Check if container is running
$containerStatus = docker ps --filter "name=$containerName" --format "table {{.Names}}\t{{.Status}}"
if ($containerStatus -notlike "*$containerName*") {
    Write-Host "PostgreSQL container is not running. Please start the development environment first." -ForegroundColor Red
    exit 1
}

# Run the migration
Write-Host "Executing migration script..." -ForegroundColor Green
Get-Content src/scripts/add-new-fields-migration.sql | docker exec -i $containerName psql -U postgres -d crm_db

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed. Please check the error messages above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue" 