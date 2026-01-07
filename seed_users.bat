@echo off
REM Seed Admin & Demo Users Script
REM FahrenCenter Smart Attendance System

echo ============================================
echo   FahrenCenter - Seed Users
echo ============================================
echo.

cd backend
python tools/seed_admin.py

echo.
echo ============================================
echo Press any key to exit...
pause > nul
