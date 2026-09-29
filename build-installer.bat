@echo off
title KCA-MMS Desktop Installer Builder
cls
echo ===================================================
echo     KAIRALI CULTURAL ASSOCIATION FUJAIRAH
echo          Desktop App & Installer Builder
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/3] Setting high-speed download mirrors...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [2/3] Preparing application icon from build folder...
node electron/prepareIcon.cjs

echo [3/3] Compiling and packaging Windows Setup Installer...
call npm run dist

echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Windows Installer created successfully!
    echo.
    echo Your ready-to-use desktop files are in:
    echo   release\KCA-MMS Setup 1.0.0.exe  (Installer with Desktop Shortcut)
    echo   release\KCA-MMS 1.0.0.exe        (Portable Standalone App)
) else (
    echo [ERROR] Build encountered an error. Please inspect the log above.
)
echo ===================================================
echo.
pause
