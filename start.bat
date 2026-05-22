@echo off
setlocal

:: Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ==========================================
echo  Max's Business Hub
echo ==========================================
echo.
echo Server: http://localhost:3001
echo App:    http://localhost:5173
echo.
echo Two windows will open. Close both to stop.
echo.

:: Start backend server
start "Business Hub - Server" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d %~dp0server && node index.js"

:: Give server a moment
timeout /t 2 /nobreak >nul

:: Start frontend
start "Business Hub - Client" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d %~dp0client && npm run dev"

:: Open browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo App is starting in your browser...
