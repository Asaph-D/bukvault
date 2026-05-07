# Demarre order-service (port 8084) — requis pour /api/v1/cart via la gateway
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dir = Join-Path $root "order-service"
if (-not (Test-Path (Join-Path $dir "pom.xml"))) { throw "order-service introuvable: $dir" }
Start-Process powershell.exe -WorkingDirectory $dir -ArgumentList @(
  "-NoExit",
  "-NoLogo",
  "-Command",
  "Write-Host '=== order-service (http://127.0.0.1:8084) — panier / commandes ===' -ForegroundColor Cyan; mvn spring-boot:run"
)
Write-Host "Fenetre order-service ouverte. Verifiez PostgreSQL (base bookvault_order) avant utilisation."
