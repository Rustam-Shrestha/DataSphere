@echo off
title Compliance Manager Setup
cd /d %~dp0

echo ========================================
echo  Compliance Manager - Quick Setup
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node -v

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] npm not found.
    pause
    exit /b 1
)
echo [OK] npm found:
npm -v

:: Install Node dependencies
echo.
echo Installing Node dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] npm install failed
    pause
    exit /b 1
)
echo [OK] Node dependencies installed

:: Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [FAIL] Prisma generate failed
    pause
    exit /b 1
)
echo [OK] Prisma client generated

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Python not found. Install from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found:
python --version

:: Create Python venv
echo.
echo Setting up Python virtual environment...
if not exist "nlu-service\.venv" (
    python -m venv nlu-service\.venv
    if %errorlevel% neq 0 (
        echo [FAIL] Failed to create venv
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

:: Install Python dependencies
echo.
echo Installing Python dependencies...
call nlu-service\.venv\Scripts\pip install -r nlu-service\requirements.txt
if %errorlevel% neq 0 (
    echo [FAIL] pip install failed
    pause
    exit /b 1
)
echo [OK] Python dependencies installed

:: Download spaCy model
echo.
echo Downloading spaCy language model...
call nlu-service\.venv\Scripts\python -m spacy download en_core_web_sm
if %errorlevel% neq 0 (
    echo [WARN] spaCy model download failed (optional, some features may not work)
) else (
    echo [OK] spaCy model downloaded
)

:: Push database schema
echo.
echo Pushing database schema...
call npx prisma db push
if %errorlevel% neq 0 (
    echo [WARN] DB push failed — make sure PostgreSQL is running and .env is configured
)

:: Copy .env if missing
if not exist ".env" (
    copy .env.example .env
    echo [OK] Created .env from .env.example — edit it with your settings
)

:: Copy NLU .env if missing
if not exist "nlu-service\.env" (
    echo DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_db > nlu-service\.env
    echo PORT=8000 >> nlu-service\.env
    echo [OK] Created nlu-service\.env
)

echo.
echo ========================================
echo  Setup complete!
echo ========================================
echo.
echo To start the services, run:  start.bat
echo.
echo Then open:  http://localhost:4000
echo.
pause
