# PowerShell script to start the backend server
# Run this from the project root: .\start-backend.ps1

Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "server"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starting backend server on port 5000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start

