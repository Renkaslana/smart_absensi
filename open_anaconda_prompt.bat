@echo off
REM File untuk membuka Anaconda Prompt dengan environment dan directory yang sudah diset

echo ========================================
echo   Smart Absensi - Anaconda Prompt
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
    echo Silakan buka Anaconda Prompt dari Start Menu secara manual.
    echo.
    pause
    exit /b 1
)

echo Menginisialisasi conda...
call "%CONDA_ROOT%\Scripts\conda.exe" init cmd.exe >nul 2>&1
call "%CONDA_ROOT%\Scripts\activate.bat" "%CONDA_ROOT%"

echo Mengaktifkan environment: smart-absensi...
call conda activate smart-absensi

echo Pindah ke direktori project...
cd /d "C:\my Project\Smart-Absensi"

echo.
echo ========================================
echo   Anaconda Prompt siap!
echo   Environment: smart-absensi
echo   Directory: %CD%
echo.
echo   Ketik 'jupyter notebook' untuk membuka Jupyter
echo ========================================
echo.

REM Buka Command Prompt baru dengan environment yang sudah aktif
cmd /k

