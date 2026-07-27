@echo off
title DataSphere Compliance Manager — Full Setup
cd /d "%~dp0"
setlocal enabledelayedexpansion

:: ===================================================================
::  DataSphere Compliance Manager — One-Click Setup
::  Requirements: Node.js, npm, Python 3.11, PostgreSQL
:: ===================================================================

set "PASS=0"
set "FAIL=1"
set /a "SKIP_CLIENT_BUILD=0"
set /a "SKIP_SPACY=0"
set /a "SKIP_DB=0"

:: ---- Parse flags ---------------------------------------------------
:parse_flags
if "%~1"=="--skip-client-build" set /a "SKIP_CLIENT_BUILD=1" & shift & goto parse_flags
if "%~1"=="--skip-spacy"        set /a "SKIP_SPACY=1"        & shift & goto parse_flags
if "%~1"=="--skip-db"           set /a "SKIP_DB=1"           & shift & goto parse_flags
if "%~1"=="--help"              goto usage
if "%~1"==""                    goto begin
echo Unknown flag: %~1
goto usage

:usage
echo.
echo Usage: setup.bat [options]
echo.
echo Options:
echo   --skip-client-build   Skip building the React frontend (saves time)
echo   --skip-spacy          Skip downloading the spaCy language model
echo   --skip-db             Skip database schema push
echo   --help                Show this help
echo.
pause
exit /b 0

:begin
echo ===================================================================
echo   DataSphere Compliance Manager — Setup
echo ===================================================================
echo   %DATE%  %TIME%
echo.
echo Checking prerequisites...
echo.

:: ===================================================================
set "ALL_OK=1"

:: ---- 1. Check Node.js -----------------------------------------------
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo   [FAIL] Node.js is not installed or not in PATH.
    echo          Download from: https://nodejs.org/ (v18 or later)
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
    echo   [PASS] Node.js !NODE_VER!
)

:: ---- 2. Check npm ---------------------------------------------------
where npm >nul 2>&1
if !errorlevel! neq 0 (
    echo   [FAIL] npm is not installed or not in PATH.
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%v in ('npm -v') do set "NPM_VER=%%v"
    echo   [PASS] npm v!NPM_VER!
)

:: ---- 3. Check Python 3.11 -------------------------------------------
where python >nul 2>&1
if !errorlevel! neq 0 (
    echo   [FAIL] Python is not installed or not in PATH.
    echo          Download Python 3.11 from: https://www.python.org/downloads/
    echo          Make sure "Add Python to PATH" is checked during install.
    set "ALL_OK=0"
) else (
    python --version 2>&1 | find "3.11" >nul
    if !errorlevel! neq 0 (
        echo   [WARN] Python found, but might not be 3.11 (recommended).
        for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo         %%v
    ) else (
        for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
        echo   [PASS] !PY_VER!
    )
)

:: ---- 4. Check pip ---------------------------------------------------
python -m pip --version >nul 2>&1
if !errorlevel! neq 0 (
    echo   [WARN] pip not found. Attempting to install...
    python -m ensurepip --upgrade >nul 2>&1
    if !errorlevel! neq 0 (
        echo   [FAIL] pip installation failed.
        set "ALL_OK=0"
    )
) else (
    for /f "tokens=*" %%v in ('python -m pip --version') do set "PIP_INFO=%%v"
    echo   [PASS] pip ^(with Python^)
)

:: ---- 5. Check PostgreSQL --------------------------------------------
where psql >nul 2>&1
if !errorlevel! neq 0 (
    echo   [WARN] psql not found in PATH. Ensure PostgreSQL is running.
    echo          Download: https://www.postgresql.org/download/windows/
) else (
    for /f "tokens=*" %%v in ('psql --version 2^>^&1') do set "PG_VER=%%v"
    echo   [PASS] !PG_VER!
    :: Check if PostgreSQL is accepting connections
    pg_isready -q >nul 2>&1
    if !errorlevel! neq 0 (
        echo   [WARN] PostgreSQL server does not appear to be running.
        echo          Start the PostgreSQL service and re-run setup.
    ) else (
        echo   [PASS] PostgreSQL server is running
    )
)

:: ---- Check for git (optional) ---------------------------------------
where git >nul 2>&1
if !errorlevel! neq 0 (
    echo   [INFO] git not found (optional — only needed for version control)
) else (
    for /f "tokens=*" %%v in ('git --version') do echo   [PASS] %%v
)

echo.

:: ---- Early exit if critical prereqs missing --------------------------
if !ALL_OK! equ 0 (
    echo.
    echo ===================================================================
    echo   One or more critical prerequisites are missing. Please install
    echo   them and re-run this script.
    echo ===================================================================
    echo   Required: Node.js, npm, Python 3.11
    echo   Required: PostgreSQL (for database)
    echo.
    pause
    exit /b 1
)

:: ===================================================================
::  PHASE 1 — Backend (Node/Express)
:: ===================================================================
echo ===================================================================
echo  Phase 1/5: Backend dependencies ^(Node.js^)
echo ===================================================================
echo.

:: ---- Set up .env ----------------------------------------------------
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo   [INFO] Created .env from .env.example
        echo   [WARN] *** Edit .env and set: ***
        echo         - JWT_SECRET=^^<choose-a-random-string^^>
        echo         - GEMINI_API_KEY=^^<your-gemini-api-key^^>
        echo         - DATABASE_URL for your PostgreSQL
        echo.
    ) else (
        echo   [WARN] No .env.example found. Creating minimal .env...
        (
            echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_db?schema=public
            echo JWT_SECRET=change-me-to-a-random-string
            echo PORT=4000
            echo UPLOAD_DIR=./uploads
            echo NLU_SERVICE_URL=http://localhost:8000
            echo GEMINI_API_KEY=your_gemini_api_key_here
            echo NODE_ENV=development
        ) > .env
        echo   [INFO] Created minimal .env — edit it before running.
    )
) else (
    echo   [PASS] .env file already exists
)

:: ---- Create uploads directory ---------------------------------------
if not exist "uploads" (
    mkdir uploads >nul 2>&1
    echo   [INFO] Created uploads/ directory
)
if not exist "uploads\.gitkeep" (
    break > uploads\.gitkeep
)

:: ---- npm install (root) ---------------------------------------------
echo.
echo Installing backend Node packages...
call npm install
if !errorlevel! neq 0 (
    echo   [FAIL] npm install failed for backend.
    echo          Check your network connection and try again.
    pause
    exit /b 1
)
echo   [PASS] Backend dependencies installed
echo.

:: ---- Prisma generate ------------------------------------------------
echo Generating Prisma client...
call npx prisma generate
if !errorlevel! neq 0 (
    echo   [FAIL] prisma generate failed.
    pause
    exit /b 1
)
echo   [PASS] Prisma client generated
echo.

:: ---- Prisma db push (skip if --skip-db) -----------------------------
if "!SKIP_DB!" equ "0" (
    echo Pushing database schema to PostgreSQL...
    call npx prisma db push
    if !errorlevel! neq 0 (
        echo   [WARN] Database push failed.
        echo          Ensure PostgreSQL is running and the DATABASE_URL in .env is correct.
        echo          Fix .env, then run: npx prisma db push
        echo.
    ) else (
        echo   [PASS] Database schema synced
    )
) else (
    echo   [SKIP] Database push skipped ^(--skip-db^)
)

echo.

:: ===================================================================
::  PHASE 2 — Frontend (React/Vite)
:: ===================================================================
echo ===================================================================
echo  Phase 2/5: Frontend dependencies ^(React^)
echo ===================================================================
echo.

cd client

:: ---- npm install (client) --------------------------------------------
echo Installing frontend Node packages...
call npm install
if !errorlevel! neq 0 (
    echo   [FAIL] npm install failed for frontend.
    cd ..
    pause
    exit /b 1
)
echo   [PASS] Frontend dependencies installed

:: ---- Build client (skip if --skip-client-build) -----------------------
if "!SKIP_CLIENT_BUILD!" equ "0" (
    echo.
    echo Building React frontend for production...
    call npm run build
    if !errorlevel! neq 0 (
        echo   [WARN] Frontend build failed. Check for TypeScript errors.
        echo          You can still run the dev server: cd client ^&^& npm run dev
        echo          To skip build on re-run: setup.bat --skip-client-build
    ) else (
        echo   [PASS] React frontend built ^(client/dist/^)
    )
) else (
    echo.
    echo   [SKIP] Frontend build skipped ^(--skip-client-build^)
    echo          Run manually: cd client ^&^& npm run build
)

cd ..

echo.

:: ===================================================================
::  PHASE 3 — Python virtual environment
:: ===================================================================
echo ===================================================================
echo  Phase 3/5: Python virtual environment
echo ===================================================================
echo.

if not exist "nlu-service\.venv" (
    echo Creating Python virtual environment at nlu-service\.venv...
    python -m venv nlu-service\.venv
    if !errorlevel! neq 0 (
        echo   [FAIL] Failed to create virtual environment.
        echo          Try: python -m venv nlu-service\.venv
        pause
        exit /b 1
    )
    echo   [PASS] Virtual environment created
) else (
    echo   [PASS] Virtual environment already exists at nlu-service\.venv
)

echo.

:: ===================================================================
::  PHASE 4 — Python dependencies (requirements.txt)
:: ===================================================================
echo ===================================================================
echo  Phase 4/5: Python packages ^(requirements.txt^)
echo ===================================================================
echo.

echo Installing Python packages...
call nlu-service\.venv\Scripts\python -m pip install --upgrade pip
if !errorlevel! neq 0 (
    echo   [WARN] pip upgrade failed, continuing...
)

call nlu-service\.venv\Scripts\pip install -r nlu-service\requirements.txt
if !errorlevel! neq 0 (
    echo   [FAIL] pip install failed.
    echo          Try: nlu-service\.venv\Scripts\pip install -r nlu-service\requirements.txt
    pause
    exit /b 1
)
echo   [PASS] Python packages installed

:: ---- spaCy model ----------------------------------------------------
if "!SKIP_SPACY!" equ "0" (
    echo.
    echo Downloading spaCy language model ^(en_core_web_sm^)...
    call nlu-service\.venv\Scripts\python -m spacy download en_core_web_sm
    if !errorlevel! neq 0 (
        echo   [WARN] spaCy model download failed.
        echo          You can re-run: nlu-service\.venv\Scripts\python -m spacy download en_core_web_sm
        echo          Or skip with: setup.bat --skip-spacy
    ) else (
        echo   [PASS] spaCy model downloaded
    )
) else (
    echo.
    echo   [SKIP] spaCy model download skipped ^(--skip-spacy^)
    echo          Run later: nlu-service\.venv\Scripts\python -m spacy download en_core_web_sm
)

:: ---- Verify spaCy model (even if skipped, check if already present) --
call nlu-service\.venv\Scripts\python -c "import spacy; spacy.load('en_core_web_sm'); print('OK')" >nul 2>&1
if !errorlevel! equ 0 (
    echo   [PASS] spaCy model verified ^(en_core_web_sm^)
)

echo.

:: ===================================================================
::  PHASE 5 — NLU service config
:: ===================================================================
echo ===================================================================
echo  Phase 5/5: NLU service configuration
echo ===================================================================
echo.

:: ---- Create nlu-service/.env if missing -----------------------------
if not exist "nlu-service\.env" (
    echo Creating nlu-service\.env from .env values...
    :: Read DATABASE_URL from root .env
    set "NLU_DB_URL="
    if exist ".env" (
        for /f "tokens=1,* delims==" %%a in (.env) do (
            if /i "%%a"=="DATABASE_URL" set "NLU_DB_URL=%%b"
        )
    )
    if "!NLU_DB_URL!"=="" set "NLU_DB_URL=postgresql://postgres:postgres@localhost:5432/compliance_db?schema=public"

    (
        echo DATABASE_URL=!NLU_DB_URL!
        echo PORT=8000
    ) > nlu-service\.env
    echo   [INFO] Created nlu-service\.env
) else (
    echo   [PASS] nlu-service\.env already exists
)

echo.

:: ===================================================================
::  Final summary
:: ===================================================================
echo ===================================================================
echo  Setup complete!
echo ===================================================================
echo.
echo  Summary:
echo    Backend   : node_modules installed, Prisma ready
echo    Frontend  : node_modules installed
if "!SKIP_CLIENT_BUILD!"=="0" (
    echo               Build: client/dist/ created
) else (
    echo               Build: skipped
)
if exist "nlu-service\.venv" (
    echo    NLU       : .venv created
    echo               Python packages: installed
)
if "!SKIP_SPACY!"=="0" (
    echo               spaCy model: downloaded
) else (
    echo               spaCy model: skipped
)
if "!SKIP_DB!"=="0" (
    echo    Database  : schema pushed to PostgreSQL
) else (
    echo    Database  : skipped ^(run: npx prisma db push^)
)
echo.
echo  Next steps:
echo    1. Edit .env  — set your JWT_SECRET and GEMINI_API_KEY
echo    2. Run: start.bat
echo    3. Open: http://localhost:4000
echo.
echo  Quick commands:
echo    setup.bat --skip-client-build   (skip React build next time)
echo    setup.bat --skip-spacy          (skip spaCy model download)
echo    setup.bat --skip-db             (skip DB schema push)
echo.
pause
endlocal
