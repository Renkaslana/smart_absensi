#!/usr/bin/env pwsh
# Create and activate a .venv, upgrade pip, and install requirements.
$ErrorActionPreference = 'Stop'

$venvPath = "$PSScriptRoot\\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment at $venvPath"
    python -m venv $venvPath
} else {
    Write-Host "Using existing virtual environment at $venvPath"
}

Write-Host "Activating virtual environment..."
& "$venvPath\Scripts\Activate.ps1"

Write-Host "Upgrading pip, setuptools, wheel..."
python -m pip install --upgrade pip setuptools wheel

Write-Host "Installing Python requirements from requirements.txt..."
try {
    python -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
    Write-Host "All packages installed (or attempted)."
} catch {
    Write-Host "One or more packages failed to install. Attempting dlib repair path..."
    # Try to install CMake first then dlib separately to give a better chance on Windows
    try {
        python -m pip install --upgrade cmake
        python -m pip install dlib
    } catch {
        Write-Host "Automatic build/install of dlib failed. See README_SETUP.md in backend for manual steps and alternatives (conda, prebuilt wheels)."
        exit 1
    }
}

Write-Host "Setup complete. Remember to activate the venv in new terminals with:` .\.venv\Scripts\Activate.ps1`"
