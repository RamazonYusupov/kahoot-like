@echo off
REM Kahoot Complete Setup Script for Windows
REM This script sets up both backend and frontend

echo.
echo ========================================
echo  Kahoot Clone - Complete Setup
echo ========================================
echo.

REM Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Install from https://www.python.org/
    pause
    exit /b 1
)
echo OK: Python found

REM Check Node.js
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Install from https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js found

REM Install backend dependencies
echo [3/4] Installing backend dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo OK: Backend dependencies installed

REM Install frontend dependencies
echo [4/4] Installing frontend dependencies...
cd frontend
call npm install -q
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo OK: Frontend dependencies installed

cd ..

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Before starting, make sure:
echo   1. Redis is running (redis-server)
echo   2. .env file is configured with your API key
echo.
echo To start the application:
echo   1. Terminal 1: redis-server
echo   2. Terminal 2: python -m uvicorn app.main:app --reload
echo   3. Terminal 3: cd frontend ^& npm run dev
echo.
echo Then visit: http://localhost:3000
echo.
pause
