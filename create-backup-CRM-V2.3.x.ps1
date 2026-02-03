# Creates a full backup of the current project as CRM-V2.3.x
# Run from repo root: .\create-backup-CRM-V2.3.x.ps1

$ErrorActionPreference = "Stop"
$source = $PSScriptRoot
$backup = Join-Path (Split-Path $source -Parent) "CRM-V2.3.x"

if (Test-Path $backup) {
    Write-Host "Removing existing $backup ..."
    Remove-Item -Recurse -Force $backup
}

Write-Host "Creating backup at $backup (excluding node_modules) ..."
New-Item -ItemType Directory -Path $backup -Force | Out-Null

# Copy everything except node_modules
Get-ChildItem -Path $source -Force | Where-Object { $_.Name -ne "node_modules" } | ForEach-Object {
    $dest = Join-Path $backup $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force -Exclude "node_modules"
        # Remove any node_modules that were copied as subdirs
        Get-ChildItem -Path $dest -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

# Double-check no node_modules in backup
$nm = Join-Path $backup "backend\node_modules"
if (Test-Path $nm) { Remove-Item -Recurse -Force $nm }
$nm = Join-Path $backup "frontend\node_modules"
if (Test-Path $nm) { Remove-Item -Recurse -Force $nm }

Write-Host "Backup created at: $backup"
Write-Host "To use it: cd into backend and frontend and run 'npm install'."
