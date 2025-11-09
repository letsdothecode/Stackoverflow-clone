# PowerShell script to start both frontend and backend servers
# Run this from the project root: .\start-servers.ps1

Write-Host "Starting StackOverflow Clone Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if backend server is already running
$backendPort = 5000
$frontendPort = 3000

$backendCheck = Test-NetConnection -ComputerName localhost -Port $backendPort -InformationLevel Quiet -WarningAction SilentlyContinue
$frontendCheck = Test-NetConnection -ComputerName localhost -Port $frontendPort -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendCheck) {
    Write-Host "⚠ Backend server is already running on port $backendPort" -ForegroundColor Yellow
} else {
    Write-Host "Starting backend server on port $backendPort..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

if ($frontendCheck) {
    Write-Host "⚠ Frontend server is already running on port $frontendPort" -ForegroundColor Yellow
} else {
    Write-Host "Starting frontend server on port $frontendPort..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd stack; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Servers should be starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:$backendPort" -ForegroundColor White
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to check server status..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Sleep -Seconds 3

$backendRunning = Test-NetConnection -ComputerName localhost -Port $backendPort -InformationLevel Quiet -WarningAction SilentlyContinue
$frontendRunning = Test-NetConnection -ComputerName localhost -Port $frontendPort -InformationLevel Quiet -WarningAction SilentlyContinue

Write-Host ""
if ($backendRunning) {
    Write-Host "✓ Backend server is running on port $backendPort" -ForegroundColor Green
} else {
    Write-Host "✗ Backend server failed to start on port $backendPort" -ForegroundColor Red
    Write-Host "  Check the backend terminal window for errors" -ForegroundColor Yellow
}

if ($frontendRunning) {
    Write-Host "✓ Frontend server is running on port $frontendPort" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend server failed to start on port $frontendPort" -ForegroundColor Red
    Write-Host "  Check the frontend terminal window for errors" -ForegroundColor Yellow
}

