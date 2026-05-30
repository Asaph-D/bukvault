# Demarre order-service (port 8084) avec variables G2TPay depuis .env
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dir = Join-Path $root "order-service"
if (-not (Test-Path (Join-Path $dir "pom.xml"))) { throw "order-service introuvable: $dir" }

$loadEnv = Join-Path $PSScriptRoot "load-dotenv.ps1"
$envCmd = if (Test-Path $loadEnv) { ". '$loadEnv'" } else { "" }

Start-Process powershell.exe -WorkingDirectory $dir -ArgumentList @(
  "-NoExit",
  "-NoLogo",
  "-Command",
  @"
$envCmd
Write-Host '=== order-service (http://127.0.0.1:8084) — G2TPAY_ENABLED=' env:G2TPAY_ENABLED ' GATEWAY=' env:GATEWAY_PUBLIC_URL -ForegroundColor Cyan
mvn spring-boot:run
"@
)
Write-Host "Fenetre order-service ouverte (.env charge pour G2TPay / ngrok)."
