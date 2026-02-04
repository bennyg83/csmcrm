Write-Host "Starting CRM-2 Development Environment..." -ForegroundColor Green
Write-Host ""

# Load .env if present for port values
$envPath = Join-Path -Path (Get-Location) -ChildPath ".env"
if (Test-Path $envPath) {
    Write-Host "Loading environment from .env" -ForegroundColor DarkCyan
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^[#\s]') { return }
        if ($_ -match '^(?<key>[^=]+)=(?<val>.*)$') {
            $key = $Matches['key'].Trim()
            $val = $Matches['val']
            [Environment]::SetEnvironmentVariable($key, $val)
        }
    }
}

# Default ports (no conflict with Pilzno: backend 3002, postgres 5435)
$backendPort  = $env:CRM2_BACKEND_PORT  ; if (-not $backendPort)  { $backendPort  = 3004 }
$frontendPort = $env:CRM2_FRONTEND_PORT ; if (-not $frontendPort) { $frontendPort = 5174 }
$pgPort       = $env:CRM2_POSTGRES_PORT ; if (-not $pgPort)       { $pgPort       = 5436 }
$ollamaPort   = $env:CRM2_OLLAMA_PORT   ; if (-not $ollamaPort)   { $ollamaPort   = 11436 }

# Simple port-in-use check
function Test-PortInUse([int] $port) {
    try {
        $result = Test-NetConnection -ComputerName 'localhost' -Port $port -WarningAction SilentlyContinue
        return $result.TcpTestSucceeded
    } catch { return $false }
}

$collisions = @()
if (Test-PortInUse $backendPort)  { $collisions += "Port $backendPort (backend) is already in use" }
if (Test-PortInUse $frontendPort) { $collisions += "Port $frontendPort (frontend) is already in use" }
if (Test-PortInUse $pgPort)       { $collisions += "Port $pgPort (postgres) is already in use" }
if (Test-PortInUse $ollamaPort)   { $collisions += "Port $ollamaPort (ollama) is already in use" }

if ($collisions.Count -gt 0) {
    Write-Host "Port preflight failed:" -ForegroundColor Red
    $collisions | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Write-Host "Resolve the conflicts or adjust ports in .env, then re-run this script." -ForegroundColor Yellow
    exit 2
}

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found in PATH. Please ensure Docker Desktop is running and restart your terminal." -ForegroundColor Red
    Write-Host "Alternatively, you can run: docker compose up --build manually" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Yellow

# Prefer `docker compose`; fall back to legacy `docker-compose`
try {
    docker compose up -d --build
} catch {
    docker-compose up -d --build
}

Write-Host ""
Write-Host "Development environment started!" -ForegroundColor Green
Write-Host ("Frontend: http://localhost:{0}" -f $frontendPort) -ForegroundColor Cyan
Write-Host ("Backend: http://localhost:{0}" -f $backendPort) -ForegroundColor Cyan
Write-Host ("Database: localhost:{0}" -f $pgPort) -ForegroundColor Cyan
Write-Host ""
Write-Host "Use 'docker compose ps' to view status. Press Ctrl+C to stop all services when attached logs are running." -ForegroundColor Yellow