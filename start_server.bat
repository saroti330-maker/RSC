@echo off
title School Wise Student Database - Local Server
cd /d "%~dp0"

echo ==========================================================
echo    School Wise Student Database (SCSP Nilphamari)
echo                   Local Web Server
echo ==========================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js পাওয়া গেছে!
    echo [INFO] সার্ভার পোর্ট: 3000
    echo [INFO] ব্রাউজারে চালু হচ্ছে: http://localhost:3000
    echo.
    echo সার্ভার বন্ধ করতে এই উইন্ডোটি বন্ধ করুন অথবা Ctrl + C চাপুন।
    echo ----------------------------------------------------------
    start "" "http://localhost:3000"
    node server.js
    goto :end
)

:: Check Python fallback
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Python পাওয়া গেছে!
    echo [INFO] সার্ভার পোর্ট: 8080
    echo [INFO] ব্রাউজারে চালু হচ্ছে: http://localhost:8080
    echo.
    echo সার্ভার বন্ধ করতে এই উইন্ডোটি বন্ধ করুন অথবা Ctrl + C চাপুন।
    echo ----------------------------------------------------------
    start "" "http://localhost:8080"
    python server.py
    goto :end
)

:: If neither is found, open directly
echo [WARNING] Node.js বা Python কোনটিই পাওয়া যায়নি!
echo সরাসরি ব্রাউজারে index.html ওপেন করা হচ্ছে...
echo.
start "" "index.html"

:end
pause

