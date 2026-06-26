@echo off
chcp 65001 >nul
title DeepSeek Novel Game - Cai Dat

echo.
echo ========================================
echo   DEEPSEEK NOVEL GAME - TRINH CAI DAT
echo ========================================
echo.
echo   [*] Dang cai dat cac thu vien can thiet...
echo   [*] Luu y: May tinh can co Node.js
echo       (Tai tu https://nodejs.org neu chua co)
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   [LOI] Khong tim thay Node.js tren may nay!
    echo   Vui long tai Node.js LTS tu https://nodejs.org
    echo   Cai dat xong, chay lai file .bat nay.
    echo.
    pause
    exit /b 1
)

echo   [OK] Da tim thay Node.js
echo   [*] Dang cai dat thu vien...

cd /d "%~dp0"
call npm install

echo.
echo   [OK] Cai dat hoan tat!
echo.
echo   Lan sau chi can chay file:
echo     "START - DeepSeek Novel Game.bat"
echo.
echo   Hoac mo PowerShell/CMD tai thu muc nay:
echo     node server.js
echo     => Mo trinh duyet http://localhost:3000
echo.
pause
