Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Kahoot Clone - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
$pythonExists = python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found! Install from https://www.python.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Python found: $pythonExists" -ForegroundColor Green

# Check Node.js
Write-Host "[2/4] Checking Node.js..." -ForegroundColor Yellow
$nodeExists = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not found! Install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Node.js found: $nodeExists" -ForegroundColor Green

# Install backend dependencies
Write-Host "[3/4] Installing backend dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
npm install -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before starting, make sure:" -ForegroundColor White
Write-Host "  1. Redis is running (redis-server)" -ForegroundColor Gray
Write-Host "  2. .env file is configured with your API key" -ForegroundColor Gray
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host "  Terminal 1: redis-server" -ForegroundColor Gray
Write-Host "  Terminal 2: python -m uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "  Terminal 3: cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then visit: http://localhost:3000" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
