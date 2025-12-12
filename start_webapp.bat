@echo off
chcp 65001 >nul
echo ================================================
echo   Smart Absensi - Web Application Startup
echo ================================================
echo.

:: Set working directory to script location
cd /d "%~dp0"

:: Cari dan inisialisasi Conda
set "CONDA_PATH="
set "CONDA_ENV=smart-absensi"

echo [INFO] Mencari instalasi Conda...

:: Cek lokasi umum Anaconda/Miniconda
if exist "%USERPROFILE%\anaconda3\Scripts\conda.exe" (
    set "CONDA_PATH=%USERPROFILE%\anaconda3"
    echo [FOUND] Anaconda di %CONDA_PATH%
) else if exist "%USERPROFILE%\miniconda3\Scripts\conda.exe" (
    set "CONDA_PATH=%USERPROFILE%\miniconda3"
    echo [FOUND] Miniconda di %CONDA_PATH%
) else if exist "C:\ProgramData\anaconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\ProgramData\anaconda3"
    echo [FOUND] Anaconda di %CONDA_PATH%
) else if exist "C:\ProgramData\miniconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\ProgramData\miniconda3"
    echo [FOUND] Miniconda di %CONDA_PATH%
) else if exist "C:\tools\anaconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\tools\anaconda3"
    echo [FOUND] Anaconda di %CONDA_PATH%
) else if exist "C:\tools\miniconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\tools\miniconda3"
    echo [FOUND] Miniconda di %CONDA_PATH%
) else (
    echo [WARNING] Conda tidak ditemukan! Menggunakan Python system...
    echo [WARNING] Untuk hasil terbaik, gunakan conda environment 'smart-absensi'
    echo.
)

:: Check if Node.js is installed
echo [INFO] Memeriksa Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan! Install Node.js 18+ terlebih dahulu.
    echo         Download: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [FOUND] Node.js %%i
)

:: Check if npm dependencies are installed
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed
)

echo.
echo [INFO] Memulai Smart Absensi...
echo.

:: Start Backend
echo [1/2] Starting Backend Server...

if defined CONDA_PATH (
    echo [INFO] Menggunakan Conda environment: %CONDA_ENV%
    start "Smart Absensi - Backend" cmd /k "call "%CONDA_PATH%\Scripts\activate.bat" %CONDA_ENV% && cd /d "%~dp0" && python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001"
) else (
    echo [INFO] Menggunakan Python system
    start "Smart Absensi - Backend" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001"
)

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"
start "Smart Absensi - Frontend" cmd /k "npm run dev"
cd /d "%~dp0"

echo.
echo ================================================
echo   Smart Absensi berhasil dijalankan!
echo ================================================
echo.
echo   Backend API:    http://localhost:8001
echo   API Docs:       http://localhost:8001/docs
echo   Frontend Web:   http://localhost:3000
echo.
echo   Halaman Utama:
echo   - Absensi Mahasiswa: http://localhost:3000/absen
echo   - Cek Riwayat:       http://localhost:3000/riwayat
echo   - Admin Dashboard:   http://localhost:3000/admin
echo   - Login:             http://localhost:3000/login
echo.
echo   Catatan:
echo   - Tutup window CMD untuk menghentikan server
echo   - Backend dan Frontend berjalan di window terpisah
echo ================================================
echo.
echo Tekan tombol apapun untuk menutup window ini...
pause >nul
