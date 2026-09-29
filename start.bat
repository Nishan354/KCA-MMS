@echo off
title KCA-MMS Application Runner
setlocal enabledelayedexpansion
cls

echo ==========================================================
echo        KAIRALI CULTURAL ASSOCIATION FUJAIRAH
echo          KCA-MMS Desktop Application Runner
echo ==========================================================
echo.

cd /d "%~dp0"

:: 1. Verify Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [1/4] First-time setup: Installing required packages...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install npm packages.
        pause
        exit /b 1
    )
)

:: 3. Prepare application icon from build/ folder
echo [2/4] Linking application icon from build folder...
if exist "electron\prepareIcon.cjs" (
    node electron\prepareIcon.cjs
)

:: 4. Verify dist folder exists, build if missing
if not exist "dist\index.html" (
    echo [3/4] Building production UI assets...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
) else (
    echo [3/4] UI assets verified.
)

:: 5. Launch KCA-MMS Desktop
echo [4/4] Starting KCA-MMS Desktop Application...
echo.
call npx electron electron/main.cjs

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] Rebuilding assets and retrying launch...
    call npm run build
    call npx electron electron/main.cjs
)

echo.
echo Application closed.
