@echo off
REM ============================================
REM Start Preprocessing Notebook
REM ============================================
echo.
echo ========================================
echo Starting Preprocessing Notebook
echo ========================================
echo.

REM Navigasi ke folder project
cd /d "%~dp0"

REM Aktifkan conda environment
REM Ganti 'vis-env' dengan 'smart-absensi' jika belum buat env baru
echo Activating conda environment...
call conda activate vis-env

REM Cek apakah environment berhasil diaktifkan
if errorlevel 1 (
    echo.
    echo [ERROR] Environment 'vis-env' tidak ditemukan!
    echo.
    echo Pilihan:
    echo 1. Buat environment baru dengan: conda create -n vis-env python=3.11 -y
    echo 2. Atau ganti 'vis-env' dengan 'smart-absensi' di file ini
    echo.
    pause
    exit /b 1
)

echo Environment activated successfully!
echo.

REM Install jupyter notebook jika belum ada
echo Checking Jupyter Notebook...
python -c "import notebook" 2>nul
if errorlevel 1 (
    echo Jupyter Notebook not found. Installing...
    pip install notebook
)

echo.
echo ========================================
echo Opening preprocessing.ipynb...
echo ========================================
echo.
echo Jupyter Notebook akan terbuka di browser
echo Tekan Ctrl+C di terminal ini untuk stop server
echo.

REM Jalankan jupyter notebook dengan file preprocessing.ipynb
jupyter notebook preprocessing.ipynb

REM Jika jupyter notebook ditutup
echo.
echo Jupyter Notebook stopped.
pause
