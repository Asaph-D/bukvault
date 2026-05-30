# Charge les variables KEY=VALUE depuis .env dans la session courante (ignore # et lignes vides).
param(
  [string]$EnvFile = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) ".env")
)

if (-not (Test-Path $EnvFile)) {
  Write-Warning ".env introuvable : $EnvFile"
  return
}

Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
  if ($key) {
    Set-Item -Path "env:$key" -Value $value
  }
}
