@echo off
echo ==========================================
echo  Max's Business Hub - Setup
echo ==========================================
echo.

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version, run the installer, then run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

:: Install server deps
echo [1/4] Installing server dependencies...
cd server
npm install
if %errorlevel% neq 0 ( echo [ERROR] Server install failed & pause & exit /b 1 )
cd ..

:: Install client deps
echo [2/4] Installing client dependencies...
cd client
npm install
if %errorlevel% neq 0 ( echo [ERROR] Client install failed & pause & exit /b 1 )
cd ..

:: Generate Prisma client and migrate
echo [3/4] Setting up database...
cd server
npx prisma generate
npx prisma migrate dev --name init
if %errorlevel% neq 0 ( echo [ERROR] Database setup failed & pause & exit /b 1 )

:: Seed database
echo [4/4] Seeding database with sample data...
node prisma/seed.js
if %errorlevel% neq 0 ( echo [ERROR] Seed failed & pause & exit /b 1 )
cd ..

echo.
echo ==========================================
echo  Setup complete!
echo ==========================================
echo.
echo To start the app, run: start.bat
echo.
pause
