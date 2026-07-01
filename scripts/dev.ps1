# Start both apps in separate terminal windows (Windows PowerShell)
$root = Split-Path -Parent $PSScriptRoot

# Check for .env
if (-not (Test-Path "$root\.env")) {
  Write-Host "No .env file found. Copying .env.example to .env..."
  Copy-Item "$root\.env.example" "$root\.env"
  Write-Host "Please fill in your credentials in $root\.env"
}

# Start storefront
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\apps\storefront'; npm run dev"

# Start admin
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\apps\admin'; npm run dev"

Write-Host ""
Write-Host "Starting development servers..."
Write-Host "  Storefront: http://localhost:3000"
Write-Host "  Admin CRM:  http://localhost:3001"
