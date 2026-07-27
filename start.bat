@echo off
title Compliance Manager

echo Starting Compliance Manager...
echo.

start "Node Backend" cmd /k "cd /d %~dp0 && npx tsx src/server.ts"
echo [OK] Node backend on port 4000

start "NLU Service" cmd /k "cd /d %~dp0nlu-service && .venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"
echo [OK] NLU service on port 8000

echo.
echo Open http://localhost:4000
echo Close the windows to stop.
echo.
