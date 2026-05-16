# Usage : depuis la racine du repo bukvault :
#   $env:PGPASSWORD = "1234"
#   .\sql\seed\run_seed.ps1
param(
  [string]$PgHost = "localhost",
  [int]$Port = 5432,
  [string]$User = "postgres",
  [string]$Psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

$map = [ordered]@{
  "01_bookvault_auth.sql"           = "bookvault_auth"
  "02_bookvault_users.sql"          = "bookvault_users"
  "03_bookvault_authors.sql"        = "bookvault_authors"
  "04_bookvault_catalog.sql"        = "bookvault_catalog"
  "05_bookvault_reviews.sql"        = "bookvault_reviews"
  "06_bookvault_wishlist.sql"       = "bookvault_wishlist"
  "07_bookvault_order.sql"          = "bookvault_order"
  "08_bookvault_notifications.sql"  = "bookvault_notifications"
  "09_bookvault_reading.sql"        = "bookvault_reading"
  "10_bookvault_files.sql"          = "bookvault_files"
  "11_bookvault_community.sql"      = "bookvault_community"
}

foreach ($e in $map.GetEnumerator()) {
  $script = Join-Path $PSScriptRoot $e.Key
  Write-Host ">>> $($e.Value) <= $($e.Key)"
  & $Psql -h $PgHost -p $Port -U $User -d $e.Value -v ON_ERROR_STOP=1 -f $script
}

$adminSeed = Join-Path $PSScriptRoot "12_bookvault_admin_dashboard.sql"
if (Test-Path $adminSeed) {
  Write-Host ">>> multi-DB <= 12_bookvault_admin_dashboard.sql"
  & $Psql -h $PgHost -p $Port -U $User -v ON_ERROR_STOP=1 -f $adminSeed
}

Write-Host "Terminé."
