@echo off
echo ========================================
echo   Smart Absensi - Starting Project
echo ========================================
echo.

REM Cari Anaconda/Miniconda installation
set "CONDA_ROOT="
if exist "%USERPROFILE%\anaconda3\Scripts\conda.exe" (
    set "CONDA_ROOT=%USERPROFILE%\anaconda3"
) else if exist "%USERPROFILE%\miniconda3\Scripts\conda.exe" (
    set "CONDA_ROOT=%USERPROFILE%\miniconda3"
) else if exist "C:\ProgramData\anaconda3\Scripts\conda.exe" (
    set "CONDA_ROOT=C:\ProgramData\anaconda3"
) else if exist "C:\ProgramData\miniconda3\Scripts\conda.exe" (
    set "CONDA_ROOT=C:\ProgramData\miniconda3"
)

if "%CONDA_ROOT%"=="" (
    echo ERROR: Anaconda/Miniconda tidak ditemukan!
    echo.
    echo Silakan buka Anaconda Prompt secara manual, lalu:
    echo   1. conda activate smart-absensi
    echo   2. cd "C:\my Project\Smart-Absensi"
    echo   3. jupyter notebook
    echo.
    pause
    exit /b 1
)

echo [1/3] Menginisialisasi conda...
call "%CONDA_ROOT%\Scripts\conda.exe" init cmd.exe >nul 2>&1
call "%CONDA_ROOT%\Scripts\activate.bat" "%CONDA_ROOT%"

echo [2/3] Mengaktifkan environment: smart-absensi...
call conda activate smart-absensi
if errorlevel 1 (
    echo ERROR: Gagal mengaktifkan environment 'smart-absensi'!
    echo Pastikan environment sudah dibuat.
    pause
    exit /b 1
)

echo [3/3] Pindah ke direktori project...
cd /d "C:\my Project\Smart-Absensi"
if errorlevel 1 (
    echo ERROR: Direktori tidak ditemukan!
    pause
    exit /b 1
)

REM Tampilkan informasi
echo.
echo ========================================
echo   Environment siap!
echo   - Environment: smart-absensi
echo   - Directory: %CD%
echo ========================================
echo.

REM Tanyakan apakah ingin membuka Jupyter
echo Pilih opsi:
echo   1. Buka Jupyter Notebook
echo   2. Buka Anaconda Prompt (untuk perintah manual)
echo   3. Keluar
echo.
set /p choice="Pilihan (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo Membuka Jupyter Notebook...
    echo (Tutup jendela ini setelah Jupyter terbuka)
    start jupyter notebook
    timeout /t 3 >nul
    exit
) else if "%choice%"=="2" (
    echo.
    echo Membuka Anaconda Prompt...
    echo (Environment sudah aktif, ketik 'jupyter notebook' untuk membuka Jupyter)
    cmd /k
) else (
    echo.
    echo Keluar...
    timeout /t 2 >nul
    exit
)
