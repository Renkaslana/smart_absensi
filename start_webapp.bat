@echo off
chcp 65001 >nul 2>&1
echo ================================================
echo   Smart Absensi - Web Application Startup
echo ================================================
echo.

:: Set working directory to script location
cd /d "%~dp0"

:: Cari dan inisialisasi Conda
set "CONDA_PATH="
set "CONDA_ENV=smart-absensi"

echo [STEP 1/6] Mencari instalasi Conda...

:: Cek lokasi umum Anaconda/Miniconda
if exist "%USERPROFILE%\miniconda3\Scripts\conda.exe" (
    set "CONDA_PATH=%USERPROFILE%\miniconda3"
    echo [FOUND] Miniconda di %CONDA_PATH%
    goto conda_found
)

if exist "%USERPROFILE%\anaconda3\Scripts\conda.exe" (
    set "CONDA_PATH=%USERPROFILE%\anaconda3"
    echo [FOUND] Anaconda di %CONDA_PATH%
    goto conda_found
)

if exist "C:\ProgramData\anaconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\ProgramData\anaconda3"
    echo [FOUND] Anaconda di %CONDA_PATH%
    goto conda_found
)

if exist "C:\ProgramData\miniconda3\Scripts\conda.exe" (
    set "CONDA_PATH=C:\ProgramData\miniconda3"
    echo [FOUND] Miniconda di %CONDA_PATH%
    goto conda_found
)

:: Conda not found
echo.
echo [ERROR] Conda tidak ditemukan!
echo.
echo Silakan install Anaconda/Miniconda terlebih dahulu.
echo Download: https://www.anaconda.com/download
echo.
echo Tekan tombol apapun untuk keluar...
pause >nul
exit /b 1

:conda_found

:conda_found

:: Check dan setup conda environment
echo.
echo [STEP 2/6] Setup Conda Environment '%CONDA_ENV%'...

call "%CONDA_PATH%\Scripts\activate.bat" %CONDA_ENV% >nul 2>&1
if errorlevel 1 (
    echo [INFO] Environment '%CONDA_ENV%' belum ada, membuat baru...
    echo [INFO] Ini akan memakan waktu beberapa menit, mohon tunggu...
    call "%CONDA_PATH%\Scripts\conda.exe" create -n %CONDA_ENV% python=3.11 -y
    if errorlevel 1 (
        echo [ERROR] Gagal membuat environment!
        echo Tekan tombol apapun untuk keluar...
        pause >nul
        exit /b 1
    )
    echo [OK] Environment berhasil dibuat
)

echo [OK] Activating environment '%CONDA_ENV%'...
call "%CONDA_PATH%\Scripts\activate.bat" %CONDA_ENV%

:: Check dan install dlib/face_recognition
echo.
echo [STEP 3/6] Setup Face Recognition Libraries...

python -c "import dlib" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing dlib via conda-forge...
    call "%CONDA_PATH%\Scripts\conda.exe" install -c conda-forge dlib -y
) else (
    echo [OK] dlib already installed
)

python -c "import face_recognition" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing face_recognition...
    pip install face-recognition
) else (
    echo [OK] face_recognition already installed
)

:: Check Node.js
echo.
echo [STEP 4/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Download: https://nodejs.org/
    echo Tekan tombol apapun untuk keluar...
    pause >nul
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js %%i

:: Setup Frontend Dependencies
echo.
echo [STEP 5/6] Setup Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

:: Setup Backend Dependencies  
echo.
echo [STEP 6/6] Setup Backend Dependencies...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing backend dependencies...
    pip install -r requirements.txt
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

:: Create admin user
echo.
echo [INFO] Checking admin user...
python create_admin.py >nul 2>&1
echo [OK] Admin user ready (NIM: admin, Password: admin123)

echo.
echo ================================================
echo   Setup Complete! Starting Services...
echo ================================================
echo.
echo [INFO] Memulai Smart Absensi...
echo.

:: Kill any process using port 8001
echo [INFO] Checking port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8001" ^| find "LISTENING"') do (
    echo [INFO] Stopping process on port 8001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

:: Start Backend
echo [1/2] Starting Backend Server...
set "PYTHON_EXE=%CONDA_PATH%\envs\%CONDA_ENV%\python.exe"
start "Smart Absensi - Backend" cmd /k "cd /d "%~dp0" && "%PYTHON_EXE%" -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Kill any process using port 3001
echo [INFO] Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo [INFO] Stopping process on port 3001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

:: Clear Next.js cache
if exist "%~dp0frontend\.next" (
    rmdir /s /q "%~dp0frontend\.next" >nul 2>&1
)

:: Start Frontend
echo [2/2] Starting Frontend Server...
start "Smart Absensi - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================================
echo   Smart Absensi berhasil dijalankan!
echo ================================================
echo.
echo   Backend API:    http://localhost:8001
echo   API Docs:       http://localhost:8001/docs
echo   Frontend Web:   http://localhost:3001
echo.
echo   Halaman Utama:
echo   - Absensi Mahasiswa: http://localhost:3001/absen
echo   - Cek Riwayat:       http://localhost:3001/riwayat
echo   - Admin Dashboard:   http://localhost:3001/admin
echo   - Login:             http://localhost:3001/login
echo.
echo   Admin Credentials:
echo   - NIM:      admin
echo   - Password: admin123
echo.
echo   Catatan:
echo   - Tunggu beberapa detik untuk backend start
echo   - Backend dan Frontend berjalan di window terpisah
echo   - Tutup window CMD untuk menghentikan server
echo   - Script ini sudah melakukan SEMUA setup otomatis!
echo.
if "!FRESH_INSTALL!"=="1" (
    echo ================================================
    echo   First-time setup complete! Next time lebih cepat.
    echo ================================================
)
echo.
echo Window ini akan tetap terbuka. Jangan ditutup!
echo Untuk menghentikan aplikasi, tutup window "Smart Absensi - Backend" dan "Frontend"
echo.
echo Tekan tombol apapun untuk menutup window ini saja (server tetap berjalan)...
pause >nul
