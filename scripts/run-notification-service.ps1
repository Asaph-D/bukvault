# Démarre notification-service en local avec les variables du fichier .env (SMTP, clé interne).
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
    }
  }
}
Set-Location (Join-Path $root "notification-service")
mvn spring-boot:run
