# Starts all Spring Boot microservices (one console window per service).
# Usage: .\scripts\start-all-microservices.ps1 [-IncludeFrontend]
# Requires: Maven on PATH, Java 17+, PostgreSQL reachable.
# Alternative (containers): from repo root run `docker compose build` then `docker compose up -d`

param(
  [switch]$IncludeFrontend
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$SERVICES = @(
  "auth-service",
  "user-service",
  "catalog-service",
  "order-service",
  "file-service",
  "review-service",
  "wishlist-service",
  "notification-service",
  "author-service",
  "reading-service",
  "admin-service",
  "api-gateway"
)

Write-Host "Project root: $repoRoot"
Write-Host "Starting $($SERVICES.Count) microservices (separate windows)..."

foreach ($name in $SERVICES) {
  $dir = Join-Path $repoRoot $name
  if (-not (Test-Path $dir)) {
    Write-Warning "Missing folder: $dir"
    continue
  }
  $pom = Join-Path $dir "pom.xml"
  if (-not (Test-Path $pom)) {
    Write-Warning "No pom.xml in $name - skipped."
    continue
  }
  Start-Process powershell.exe -WorkingDirectory $dir -ArgumentList @(
    "-NoExit",
    "-NoLogo",
    "-Command",
    "Write-Host '=== $name ===' -ForegroundColor Cyan; mvn spring-boot:run"
  )
  Start-Sleep -Milliseconds 400
}

if ($IncludeFrontend) {
  $fe = Join-Path $repoRoot "BookVault"
  if (Test-Path (Join-Path $fe "package.json")) {
    Start-Process powershell.exe -WorkingDirectory $fe -ArgumentList @(
      "-NoExit",
      "-NoLogo",
      "-Command",
      "Write-Host '=== BookVault (Angular) ===' -ForegroundColor Green; npm run start"
    )
    Write-Host "BookVault frontend started in a separate window."
  }
  else {
    Write-Warning "BookVault/package.json not found."
  }
}

Write-Host ""
Write-Host "Done. Each service runs in its own window." -ForegroundColor Green
Write-Host "Close a window to stop that service."
