@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title BioTracker AI - Professional Launcher

echo ===========================================
echo   BioTracker AI - Professional Launcher
echo ===========================================
echo.
echo Folder: %CD%
echo.

set "PYTHON_CMD="

echo Checking Python from PATH...
where python >nul 2>nul
if %errorlevel%==0 (
    python --version >nul 2>nul
    if %errorlevel%==0 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo Checking python3 from PATH...
    where python3 >nul 2>nul
    if %errorlevel%==0 (
        python3 --version >nul 2>nul
        if %errorlevel%==0 set "PYTHON_CMD=python3"
    )
)

if not defined PYTHON_CMD (
    echo Checking Windows py launcher...
    where py >nul 2>nul
    if %errorlevel%==0 (
        py -3 --version >nul 2>nul
        if %errorlevel%==0 set "PYTHON_CMD=py -3"
    )
)

if not defined PYTHON_CMD (
    echo.
    echo [ERROR] Working Python was not found.
    echo Install Python 3.13/3.12 and tick: Add python.exe to PATH
    echo.
    pause
    exit /b 1
)

echo Using: %PYTHON_CMD%
%PYTHON_CMD% --version

echo.
echo Installing required packages...
%PYTHON_CMD% -m pip --version >nul 2>nul
if errorlevel 1 %PYTHON_CMD% -m ensurepip --upgrade
%PYTHON_CMD% -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Package install failed. Check internet connection.
    pause
    exit /b 1
)

echo.
echo Starting BioTracker backend + Share/QR system...
echo.
echo Laptop URL: http://127.0.0.1:5000
echo Admin URL:  http://127.0.0.1:5000/admin.html
echo.
echo Share system:
echo - Microsoft Store ngrok is OK. You do NOT need to find its folder.
echo - If command "ngrok" works in CMD, public link will be created automatically.
echo - Website navbar will show Share button with QR code and WhatsApp share option.
echo - First time only: run ngrok config add-authtoken YOUR_TOKEN if ngrok asks for login.
echo.
echo Keep this black window open while using the app.
echo.
start "BioTracker Share Tunnel" %PYTHON_CMD% start_share.py
start "" http://127.0.0.1:5000
%PYTHON_CMD% app.py

echo.
echo Backend stopped. If this happened immediately, copy the error above and send it.
pause
