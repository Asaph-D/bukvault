# Demarre order-service (port 8084) — sync G2TPay depuis .env puis mvn spring-boot:run
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dir = Join-Path $root "order-service"
if (-not (Test-Path (Join-Path $dir "pom.xml"))) { throw "order-service introuvable: $dir" }

$sync = Join-Path $PSScriptRoot "sync-g2tpay-local-props.ps1"
if (Test-Path $sync) {
  & $sync
}

Start-Process powershell.exe -WorkingDirectory $dir -ArgumentList @(
  "-NoExit",
  "-NoLogo",
  "-Command",
  "Write-Host '=== order-service http://127.0.0.1:8084 ===' -ForegroundColor Cyan; mvn spring-boot:run"
)
Write-Host "Fenetre order-service ouverte (application-local.properties genere depuis .env)."
