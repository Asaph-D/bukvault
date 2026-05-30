# Charge les SQL générés dans PostgreSQL (même ordre que sql/seed/README.md)
param(
    [string]$Psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Password = "1234",
    [string]$SqlDir = "$PSScriptRoot\output\sql"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $SqlDir)) {
    throw "Dossier introuvable : $SqlDir — exécutez d'abord .\run_generate.ps1"
}

$env:PGPASSWORD = $Password
$env:PGCLIENTENCODING = "UTF8"
chcp 65001 | Out-Null
$dbUrl = "-h $Host -p $Port -U $User"

$scripts = @(
    "01_bookvault_auth.sql",
    "02_bookvault_users.sql",
    "03_bookvault_authors.sql",
    "04_bookvault_catalog.sql",
    "05_bookvault_reviews.sql",
    "06_bookvault_wishlist.sql",
    "07_bookvault_order.sql",
    "08_bookvault_notifications.sql",
    "09_bookvault_reading.sql",
    "10_bookvault_files.sql",
    "11_bookvault_community.sql",
    "12_bookvault_admin_dashboard.sql"
)

foreach ($s in $scripts) {
    $path = Join-Path $SqlDir $s
    if (-not (Test-Path $path)) { throw "Fichier manquant : $path" }
    Write-Host ">>> $s" -ForegroundColor Yellow
    if ($s -eq "12_bookvault_admin_dashboard.sql") {
        & $Psql $dbUrl -v ON_ERROR_STOP=1 -f $path
    } else {
        $db = switch -Regex ($s) {
            "^01" { "bookvault_auth" }
            "^02" { "bookvault_users" }
            "^03" { "bookvault_authors" }
            "^04" { "bookvault_catalog" }
            "^05" { "bookvault_reviews" }
            "^06" { "bookvault_wishlist" }
            "^07" { "bookvault_order" }
            "^08" { "bookvault_notifications" }
            "^09" { "bookvault_reading" }
            "^10" { "bookvault_files" }
            "^11" { "bookvault_community" }
            default { throw "Script inconnu" }
        }
        & $Psql $dbUrl -d $db -v ON_ERROR_STOP=1 -f $path
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`nChargement PostgreSQL terminé." -ForegroundColor Green
Write-Host "Couvertures : FILE_STORAGE_ROOT + python ..\scripts\generate_covers_from_books.py"
