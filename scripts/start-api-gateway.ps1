# Demarre uniquement l'api-gateway (port 8080) — necessaire pour ng serve + proxy /api
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dir = Join-Path $root "api-gateway"
if (-not (Test-Path (Join-Path $dir "pom.xml"))) { throw "api-gateway introuvable: $dir" }
Start-Process powershell.exe -WorkingDirectory $dir -ArgumentList @(
  "-NoExit",
  "-NoLogo",
  "-Command",
  "Write-Host '=== api-gateway (http://127.0.0.1:8080) ===' -ForegroundColor Cyan; mvn spring-boot:run"
)
Write-Host "Fenetre api-gateway ouverte. Lance ng serve dans BookVault une fois Tomcat demarre."
Write-Host "Astuce: le panier (/api/v1/cart) exige order-service sur 8084 — Start-Order-Service.bat ou Start-BookVault-Backend.bat." -ForegroundColor Yellow
