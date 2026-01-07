@echo off
REM start_project.bat
REM Launcher untuk Smart Absensi - Inisialisasi Conda, Backend, Frontend
REM Double-click dari Explorer untuk menjalankan

setlocal enabledelayedexpansion

echo ========================================
echo Smart Absensi Launcher
echo ========================================
echo.

REM Deteksi path conda
set "CONDA_BASE="
if exist "%USERPROFILE%\miniconda3" set "CONDA_BASE=%USERPROFILE%\miniconda3"
if exist "%USERPROFILE%\Anaconda3" set "CONDA_BASE=%USERPROFILE%\Anaconda3"
if exist "C:\ProgramData\Miniconda3" set "CONDA_BASE=C:\ProgramData\Miniconda3"
if exist "C:\ProgramData\Anaconda3" set "CONDA_BASE=C:\ProgramData\Anaconda3"

if "%CONDA_BASE%"=="" (
    echo [ERROR] Conda tidak ditemukan!
    echo Pastikan Miniconda atau Anaconda terinstal.
    echo.
    pause
    exit /b 1
)

echo [OK] Conda ditemukan: %CONDA_BASE%

REM Initialize conda untuk script ini
call "%CONDA_BASE%\Scripts\activate.bat" "%CONDA_BASE%" >nul 2>&1

REM Cek apakah env smart-absensi ada
echo [CHECK] Memeriksa environment 'smart-absensi'...
call conda info --envs | findstr /C:"smart-absensi" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Environment tidak ditemukan, membuat...
    call conda create -n smart-absensi python=3.11 -y
    if errorlevel 1 (
        echo [ERROR] Gagal membuat environment
        pause
        exit /b 1
    )
    
    echo [INFO] Menginstall dlib dan cmake...
    call conda activate smart-absensi
    call conda install -c conda-forge dlib cmake -y
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall dlib
        pause
        exit /b 1
    )
    
    echo [INFO] Menginstall dependencies Python...
    cd /d "%~dp0backend"
    python -m pip install email-validator
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall requirements.txt
        pause
        exit /b 1
    )
    cd /d "%~dp0"
) else (
    echo [OK] Environment 'smart-absensi' sudah ada
)

REM Buat folder yang diperlukan
echo [CHECK] Membuat folder backend...
if not exist "%~dp0backend\database" mkdir "%~dp0backend\database"
if not exist "%~dp0backend\uploads" mkdir "%~dp0backend\uploads"
echo [OK] Folder backend siap

REM Cek dan buat .env file jika belum ada
echo [CHECK] Memeriksa file .env backend...
if not exist "%~dp0backend\.env" (
    echo [INFO] Membuat file .env dengan konfigurasi default...
    (
        echo # Smart Absensi Backend Configuration
        echo SECRET_KEY=smart-absensi-secret-key-change-in-production-min32chars
        echo JWT_SECRET_KEY=jwt-secret-key-for-smart-absensi-change-in-production-min32
        echo DATABASE_URL=sqlite:///./database/absensi.db
        echo DEBUG=True
        echo FACE_DETECTION_MODEL=hog
        echo FACE_RECOGNITION_TOLERANCE=0.55
    ) > "%~dp0backend\.env"
    echo [OK] File .env berhasil dibuat
) else (
    echo [OK] File .env sudah ada
)

REM Cek apakah frontend sudah npm install
echo [CHECK] Memeriksa node_modules frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Menginstall dependencies frontend...
    cd /d "%~dp0frontend"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Gagal npm install
        pause
        exit /b 1
    )
    cd /d "%~dp0"
) else (
    echo [OK] Frontend dependencies sudah terinstall
)

echo.
echo ========================================
echo Meluncurkan Backend dan Frontend...
echo ========================================
echo.

REM Launch Backend di jendela baru
echo [LAUNCH] Backend di http://127.0.0.1:8001
start "Smart Absensi - Backend" cmd /k "call "%CONDA_BASE%\Scripts\activate.bat" "%CONDA_BASE%" && conda activate smart-absensi && cd /d "%~dp0backend" && echo Backend starting... && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"

REM Tunggu sebentar agar backend sempat start
timeout /t 3 /nobreak >nul

REM Launch Frontend di jendela baru
echo [LAUNCH] Frontend di http://localhost:3001
start "Smart Absensi - Frontend" cmd /k "cd /d "%~dp0frontend" && echo Frontend starting... && npm run dev"

echo.
echo ========================================
echo SELESAI!
echo ========================================
echo Backend: http://127.0.0.1:8001/docs
echo Frontend: http://localhost:3001
echo.
echo Jendela ini bisa ditutup.
echo Backend dan Frontend berjalan di jendela terpisah.
echo.
pause
