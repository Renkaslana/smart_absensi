@echo off
REM Create/activate .venv and install requirements (Windows cmd)
IF NOT EXIST "%~dp0.venv" (
    echo Creating virtual environment at %~dp0.venv
    python -m venv "%~dp0.venv"
) ELSE (
    echo Using existing virtual environment at %~dp0.venv
)

call "%~dp0.venv\Scripts\activate.bat"
echo Upgrading pip, setuptools, wheel...
python -m pip install --upgrade pip setuptools wheel

echo Installing Python requirements from requirements.txt...
python -m pip install -r "%~dp0requirements.txt"
IF ERRORLEVEL 1 (
    echo One or more packages failed to install. Try running the PowerShell script or follow README_SETUP.md for dlib instructions.
    exit /b 1
) ELSE (
    echo Installation complete.
)
