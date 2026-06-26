@echo off
chcp 65001 >nul
title DeepSeek Novel Game - Web Server

cd /d "%~dp0"

echo ========================================
echo   DEEPSEEK NOVEL GAME - WEB SERVER
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Khong tim thay Node.js!
    echo Hay tai Node.js tu: https://nodejs.org
    echo Phiên ban LTS 20.x hoac moi hon
    echo.
    pause
    exit /b 1
)

:: Check/install npm dependencies
if not exist "node_modules\" (
    echo [*] Dang cai dat thu vien...
    call npm install
    echo.
)

:: Find an available port starting from 3000
set PORT=3000

echo [*] Khoi dong server...
echo [*] Trinh duyet se tu mo: http://localhost:%PORT%
echo.
echo [*] Nhan Ctrl+C de dung server
echo ========================================
echo.

:: Open browser
start http://localhost:%PORT%

:: Start server
node server.js
pause
