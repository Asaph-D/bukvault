# Génère order-service/.../application-local.properties depuis .env (fiable avec mvn spring-boot:run)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $root ".env"
$outFile = Join-Path $root "order-service\src\main\resources\application-local.properties"

if (-not (Test-Path $envFile)) {
  Write-Warning ".env introuvable : $envFile"
  exit 1
}

$keys = @{
  G2TPAY_ENABLED           = 'order.g2tpay.enabled'
  G2TPAY_API_KEY           = 'order.g2tpay.api-key'
  G2TPAY_BASE_URL          = 'order.g2tpay.base-url'
  G2TPAY_WEBHOOK_URL       = 'order.g2tpay.webhook-url'
  GATEWAY_PUBLIC_URL       = 'order.g2tpay.gateway-public-url'
  G2TPAY_EUR_TO_XAF_RATE   = 'order.g2tpay.eur-to-xaf-rate'
  G2TPAY_OPERATOR_MTN      = 'order.g2tpay.operator-mtn'
  G2TPAY_OPERATOR_ORANGE   = 'order.g2tpay.operator-orange'
  FRONTEND_URL             = 'order.frontend.base-url'
}

$lines = @(
  '# Généré par scripts/sync-g2tpay-local-props.ps1 — ne pas committer',
  '# Relancez ce script après changement de .env ou de tunnel ngrok',
  ''
)

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
  if ($keys.ContainsKey($key) -and $value) {
    $prop = $keys[$key]
    $lines += "$prop=$value"
  }
}

if ($lines.Count -le 3) {
  Write-Warning "Aucune clé G2TPay trouvée dans .env"
  exit 1
}

[System.IO.File]::WriteAllLines($outFile, $lines)
Write-Host "OK → $outFile"
Write-Host "Redémarrez order-service (mvn spring-boot:run)."
