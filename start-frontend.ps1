# PowerShell script to start the frontend server
# Run this from the project root: .\start-frontend.ps1

Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "stack"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starting frontend server on port 3000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev

