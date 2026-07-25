@echo off
title Compliance Manager

echo Starting Compliance Manager...
echo.

start "Node Backend" cmd /k "cd /d %~dp0 && npx tsx src/server.ts"
echo [OK] Node backend starting on port 4000

start "NLU Service" cmd /k "cd /d %~dp0nlu-service && .venv\Scripts\activate && .venv\Scripts\uvicorn app.main:app --reload --port 8000"
echo [OK] NLU Python service starting on port 8000

echo.
echo Both services are running in separate windows.
echo Node backend: http://localhost:4000
echo NLU service:  http://localhost:8000
echo Close the windows to stop the services.
echo.
