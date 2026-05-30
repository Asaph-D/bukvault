# Génère SQL + CSV entrepôt (Python 3.10+)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Console + Python en UTF-8 (accents français)
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)

Write-Host "BookVault Data-Generator — masse analytique ~5 ans (Cameroun)" -ForegroundColor Cyan
Write-Host "Sortie : output/warehouse/*.csv (pas le petit seed PostgreSQL)" -ForegroundColor DarkGray

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python introuvable dans le PATH."
}

python generate_all.py @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nTerminé. Fichiers dans .\output\" -ForegroundColor Green
