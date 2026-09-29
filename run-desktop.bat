@echo off
title KCA-MMS Desktop Application
cls
echo ===================================================
echo     KAIRALI CULTURAL ASSOCIATION FUJAIRAH
echo               Launching Desktop App
echo ===================================================
echo.
cd /d "%~dp0"

node electron/prepareIcon.cjs

echo Launching KCA-MMS...
call npm run electron:start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo If application didn't start, please compile the app first with:
    echo call npm run build
    pause
)
