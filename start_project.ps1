# start_project.ps1
# FahrenCenter Smart Attendance System - PowerShell Launcher
# Modern launcher with better error handling and colored output

param(
    [switch]$SkipChecks = $false,
    [switch]$DevMode = $false
)

# Colors
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Header {
    param([string]$Text)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $Text -ForegroundColor White
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] " -NoNewline -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor White
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARN] " -NoNewline -ForegroundColor Yellow
    Write-Host $Text -ForegroundColor White
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "[ERROR] " -NoNewline -ForegroundColor Red
    Write-Host $Text -ForegroundColor White
}

function Write-Launch {
    param([string]$Text)
    Write-Host "[LAUNCH] " -NoNewline -ForegroundColor Magenta
    Write-Host $Text -ForegroundColor White
}

# Main script
Clear-Host
Write-Header "FahrenCenter Smart Attendance System"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Info "Working directory: $ScriptDir"
Set-Location $ScriptDir

# Step 1: Find Conda
Write-Info "Mencari instalasi Conda..."
$CondaBase = $null
$PossiblePaths = @(
    "$env:USERPROFILE\miniconda3",
    "$env:USERPROFILE\Anaconda3",
    "C:\ProgramData\Miniconda3",
    "C:\ProgramData\Anaconda3"
)

foreach ($Path in $PossiblePaths) {
    if (Test-Path $Path) {
        $CondaBase = $Path
        break
    }
}

if (-not $CondaBase) {
    Write-Error-Custom "Conda tidak ditemukan!"
    Write-Host "Pastikan Miniconda atau Anaconda terinstal." -ForegroundColor Red
    Write-Host "Download: https://docs.conda.io/en/latest/miniconda.html" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Success "Conda ditemukan: $CondaBase"

# Step 2: Check environment
if (-not $SkipChecks) {
    Write-Info "Memeriksa environment 'smart-absensi'..."
    
    $CondaInit = "$CondaBase\Scripts\conda.exe"
    $EnvExists = & $CondaInit env list | Select-String "smart-absensi"
    
    if (-not $EnvExists) {
        Write-Warning "Environment tidak ditemukan, membuat..."
        
        & $CondaInit create -n smart-absensi python=3.11 -y
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Gagal membuat environment"
            Read-Host "Press Enter to exit"
            exit 1
        }
        
        Write-Info "Mengaktifkan environment..."
        & $CondaInit activate smart-absensi
        
        Write-Info "Menginstall dlib dan cmake..."
        & $CondaInit install -c conda-forge dlib cmake -y
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Gagal menginstall dlib"
            Read-Host "Press Enter to exit"
            exit 1
        }
        
        Write-Info "Menginstall dependencies Python..."
        Set-Location "$ScriptDir\backend"
        python -m pip install email-validator
        python -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Gagal menginstall requirements.txt"
            Set-Location $ScriptDir
            Read-Host "Press Enter to exit"
            exit 1
        }
        Set-Location $ScriptDir
    } else {
        Write-Success "Environment 'smart-absensi' sudah ada"
    }
}

# Step 3: Create backend folders
Write-Info "Memeriksa folder backend..."
$BackendFolders = @(
    "$ScriptDir\backend\database",
    "$ScriptDir\backend\uploads",
    "$ScriptDir\backend\logs"
)

foreach ($Folder in $BackendFolders) {
    if (-not (Test-Path $Folder)) {
        New-Item -Path $Folder -ItemType Directory -Force | Out-Null
        Write-Success "Folder dibuat: $Folder"
    }
}
Write-Success "Folder backend siap"

# Step 4: Check .env file
Write-Info "Memeriksa file .env backend..."
$EnvFile = "$ScriptDir\backend\.env"

if (-not (Test-Path $EnvFile)) {
    Write-Warning "File .env tidak ditemukan, membuat..."
    
    $EnvContent = @"
# FahrenCenter Backend Configuration
SECRET_KEY=fahrencenter-secret-key-change-in-production-min32chars
JWT_SECRET_KEY=jwt-secret-key-for-fahrencenter-change-in-production-min32
DATABASE_URL=sqlite:///./database/absensi.db
DEBUG=True
FACE_DETECTION_MODEL=hog
FACE_RECOGNITION_TOLERANCE=0.55
FACE_MIN_CONFIDENCE=0.80
CORS_ORIGINS=["http://localhost:3001","http://127.0.0.1:3001"]
"@
    
    $EnvContent | Out-File -FilePath $EnvFile -Encoding utf8
    Write-Success "File .env berhasil dibuat"
} else {
    Write-Success "File .env sudah ada"
}

# Step 5: Check frontend dependencies
Write-Info "Memeriksa node_modules frontend..."
$NodeModules = "$ScriptDir\frontend\node_modules"

if (-not (Test-Path $NodeModules)) {
    Write-Warning "Menginstall dependencies frontend..."
    Set-Location "$ScriptDir\frontend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Gagal npm install"
        Set-Location $ScriptDir
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location $ScriptDir
} else {
    Write-Success "Frontend dependencies sudah terinstall"
}

# Step 6: Launch applications
Write-Host ""
Write-Header "Meluncurkan Backend dan Frontend..."

# Launch Backend
Write-Launch "Backend API di http://127.0.0.1:8001"
$BackendScript = @"
& "$CondaBase\Scripts\conda.exe" activate smart-absensi
Set-Location "$ScriptDir\backend"
Write-Host "Backend starting..." -ForegroundColor Green
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $BackendScript -WindowStyle Normal

# Wait for backend to start
Write-Info "Menunggu backend start (3 detik)..."
Start-Sleep -Seconds 3

# Launch Frontend
Write-Launch "Frontend Web di http://localhost:3001"
$FrontendScript = @"
Set-Location "$ScriptDir\frontend"
Write-Host "Frontend starting..." -ForegroundColor Cyan
npm run dev
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $FrontendScript -WindowStyle Normal

# Success message
Write-Host ""
Write-Header "SELESAI!"

Write-Host "Backend API:  " -NoNewline -ForegroundColor Yellow
Write-Host "http://127.0.0.1:8001/docs" -ForegroundColor Green

Write-Host "Frontend Web: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:3001" -ForegroundColor Cyan

Write-Host ""
Write-Info "Backend dan Frontend berjalan di jendela terpisah"
Write-Info "Jendela ini bisa ditutup"
Write-Host ""

if ($DevMode) {
    Write-Warning "Dev Mode: Script tidak otomatis close"
    Read-Host "Press Enter to exit"
} else {
    Write-Info "Auto-closing in 5 seconds..."
    Start-Sleep -Seconds 5
}
