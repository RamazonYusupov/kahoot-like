@echo off
REM Start the Kahoot backend server

echo.
echo ========================================
echo  Kahoot Clone - Backend Server
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file from .env.example:
    echo   1. Copy .env.example to .env
    echo   2. Update it with your API credentials
    echo.
    echo Example commands:
    echo   copy .env.example .env
    echo.
    pause
    exit /b 1
)

echo Starting server...
echo API will be available at: http://localhost:8000
echo Documentation at: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
