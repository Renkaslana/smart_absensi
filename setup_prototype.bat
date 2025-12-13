@echo off
echo ========================================
echo   Smart Absensi - Setup Prototype
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
    echo Silakan install Anaconda atau Miniconda terlebih dahulu:
    echo   - Anaconda: https://www.anaconda.com/download
    echo   - Miniconda: https://docs.conda.io/en/latest/miniconda.html
    echo.
    pause
    exit /b 1
)

echo [1/5] Menginisialisasi conda...
call "%CONDA_ROOT%\Scripts\conda.exe" init cmd.exe >nul 2>&1
call "%CONDA_ROOT%\Scripts\activate.bat" "%CONDA_ROOT%"

echo [2/5] Cek apakah environment sudah ada...
call conda env list | findstr "smart-absensi" >nul
if errorlevel 1 (
    echo Environment 'smart-absensi' tidak ditemukan. Membuat environment baru...
    call conda create -n smart-absensi python=3.11 -y
    if errorlevel 1 (
        echo ERROR: Gagal membuat environment!
        pause
        exit /b 1
    )
    echo ✓ Environment berhasil dibuat!
) else (
    echo ✓ Environment 'smart-absensi' sudah ada
)

echo [3/5] Mengaktifkan environment: smart-absensi...
call conda activate smart-absensi
if errorlevel 1 (
    echo ERROR: Gagal mengaktifkan environment!
    pause
    exit /b 1
)

echo [4/5] Install dependencies via conda...
call conda install -c conda-forge opencv pandas jupyter pillow -y
if errorlevel 1 (
    echo WARNING: Beberapa package conda gagal diinstall, lanjut dengan pip...
)

echo [5/6] Install NumPy (versi spesifik)...
call pip install numpy==1.26.4
if errorlevel 1 (
    echo ERROR: Gagal install NumPy!
    pause
    exit /b 1
)

echo.
echo [6/6] Install dlib dan face-recognition...
echo Menggunakan conda-forge (PALING MUDAH - tidak perlu CMake atau Visual C++)...
echo.

REM Bersihkan dlib dan cmake lama jika ada (untuk menghindari konflik)
echo [6a/6] Bersihkan installasi lama...
call pip uninstall dlib cmake -y >nul 2>&1
call conda remove cmake -y >nul 2>&1

REM Install dlib via conda-forge (PALING RELIABLE!)
echo [6b/6] Install dlib via conda-forge...
call conda install -c conda-forge dlib -y
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERROR: Gagal install dlib via conda-forge!
    echo ========================================
    echo.
    echo Mencoba alternatif: prebuilt wheel...
    echo.
    call pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
    if errorlevel 1 (
        echo.
        echo ========================================
        echo   ERROR: Semua metode install dlib gagal!
        echo ========================================
        echo.
        echo Silakan install secara manual:
        echo   1. conda install -c conda-forge dlib -y
        echo   2. pip install face-recognition
        echo.
        echo Atau lihat panduan lengkap di INSTALLATION.md
        echo.
        pause
        exit /b 1
    )
)

REM Install face-recognition
echo.
echo [6c/6] Install face-recognition...
call pip install face-recognition
if errorlevel 1 (
    echo ERROR: Gagal install face-recognition!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Selesai!
echo ========================================
echo.
echo Verifikasi instalasi:
echo.
call python -c "import numpy; print(f'✓ NumPy: {numpy.__version__}')" 2>nul || echo ❌ NumPy: GAGAL
call python -c "import cv2; print(f'✓ OpenCV: {cv2.__version__}')" 2>nul || echo ❌ OpenCV: GAGAL
call python -c "import pandas; print(f'✓ Pandas: {pandas.__version__}')" 2>nul || echo ❌ Pandas: GAGAL
call python -c "import dlib; print(f'✓ dlib: {dlib.__version__}')" 2>nul || echo ❌ dlib: GAGAL
call python -c "import face_recognition; print(f'✓ Face Recognition: {face_recognition.__version__}')" 2>nul || echo ❌ Face Recognition: GAGAL
call python -c "import jupyter; print('✓ Jupyter: OK')" 2>nul || echo ❌ Jupyter: GAGAL

echo.
echo Cek final...
call python -c "import numpy, cv2, pandas, dlib, face_recognition, jupyter; print('✓ Semua library berhasil diimport!')" 2>nul
if errorlevel 1 (
    echo.
    echo ⚠ WARNING: Beberapa library gagal diimport!
    echo Silakan cek error di atas.
) else (
    echo.
    echo ========================================
    echo   ✓ SEMUA LIBRARY BERHASIL TERINSTALL!
    echo ========================================
)

echo.
echo ========================================
echo   ✓ SETUP SELESAI!
echo ========================================
echo.
echo Langkah selanjutnya:
echo   1. Jalankan: start_project.bat
echo   2. Buka file: preprocessing.ipynb di Jupyter Notebook
echo.
echo Atau jalankan manual:
echo   conda activate smart-absensi
echo   jupyter notebook
echo.
echo ========================================
echo   Semua library sudah terinstall!
echo   Tidak perlu install CMake atau Visual C++!
echo ========================================
echo.
pause

