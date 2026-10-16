@echo off
setlocal
title DataSphere Compliance Manager
cd /d "%~dp0"

echo.
echo ==========================================
echo   DataSphere Compliance Manager
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js is not installed or not in PATH.
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [FAIL] npm is not installed or not in PATH.
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python is not installed or not in PATH.
    exit /b 1
)

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 goto :failed
)

if not exist "node_modules\@prisma\client" (
    echo [FAIL] Prisma Client is missing after npm install.
    echo        Run setup.bat and review the installation errors.
    exit /b 1
)

echo Generating Prisma Client...
call npx prisma generate
if errorlevel 1 goto :failed

echo Synchronizing the database schema...
call npx prisma db push
if errorlevel 1 (
    echo [FAIL] Could not connect to PostgreSQL or synchronize the schema.
    echo        Check DATABASE_URL in .env and ensure PostgreSQL is running.
    exit /b 1
)

if not exist "uploads" mkdir "uploads"
if not exist "uploads\.gitkeep" type nul > "uploads\.gitkeep"

if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    pushd client
    call npm install
    if errorlevel 1 (
        popd
        goto :failed
    )
    popd
)

if not exist "client\dist\index.html" (
    echo Building the frontend...
    pushd client
    call npm run build
    if errorlevel 1 (
        popd
        goto :failed
    )
    popd
)

if not exist "nlu-service\.venv\Scripts\python.exe" (
    echo Creating the Python virtual environment...
    python -m venv "nlu-service\.venv"
    if errorlevel 1 goto :failed
)

"nlu-service\.venv\Scripts\python.exe" -c "import fastapi, uvicorn, psycopg2, spacy, dateparser, rapidfuzz"
if errorlevel 1 (
    echo Installing Python dependencies...
    call "nlu-service\.venv\Scripts\python.exe" -m pip install -r "nlu-service\requirements.txt"
    if errorlevel 1 goto :failed
)

echo.
echo [OK] Database is ready
echo [OK] Backend dependencies are ready
echo [OK] Frontend build is ready
echo [OK] Python NLU dependencies are ready
echo.
echo Starting services...

start "DataSphere Node Backend" /D "%~dp0" cmd /k ""%~dp0node_modules\.bin\tsx.cmd" src\server.ts"
start "DataSphere NLU Service" /D "%~dp0nlu-service" cmd /k ""%~dp0nlu-service\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo.
echo Backend: http://localhost:4000
echo NLU:     http://localhost:8000/health
echo Close the two service windows to stop the application.
echo.
exit /b 0

:failed
echo.
echo [FAIL] Setup did not complete. Fix the error above and run start.bat again.
exit /b 1
