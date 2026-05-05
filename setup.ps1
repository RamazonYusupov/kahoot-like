# Kahoot Backend Setup Script for Windows

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Kahoot Clone - Backend Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "[1/4] Checking Python installation..." -ForegroundColor Yellow
python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found! Install from https://www.python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python is installed" -ForegroundColor Green
Write-Host ""

# Check if .env exists
Write-Host "[2/4] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from template..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠ IMPORTANT: Edit .env with your settings:" -ForegroundColor Magenta
        Write-Host "  - REDIS_HOST and REDIS_PORT" -ForegroundColor Gray
        Write-Host "  - AI_API_KEY (from OpenAI or Claude)" -ForegroundColor Gray
        Write-Host "  - AI_API_TYPE (openai or claude)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Press Enter to continue..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "ERROR: .env.example not found!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create virtual environment if it doesn't exist
Write-Host "[3/4] Setting up Python environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

# Activate and install dependencies
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure Redis is running:" -ForegroundColor White
Write-Host "   redis-server" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Edit .env with your API key:" -ForegroundColor White
Write-Host "   notepad .env" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the server:" -ForegroundColor White
Write-Host "   python -m uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Visit the API docs:" -ForegroundColor White
Write-Host "   http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Run tests:" -ForegroundColor White
Write-Host "   python test_api.py" -ForegroundColor Gray
Write-Host ""

Write-Host "Questions? See SETUP.md for detailed instructions." -ForegroundColor Yellow
