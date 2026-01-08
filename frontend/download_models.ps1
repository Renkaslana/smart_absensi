# Download face-api.js models untuk liveness detection

Write-Host "🌙 Downloading face-api.js models..." -ForegroundColor Cyan

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$outputDir = "public/models"

# Create models directory
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Models to download
$models = @(
    "tiny_face_detector_model-shard1",
    "tiny_face_detector_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_landmark_68_model-weights_manifest.json"
)

foreach ($model in $models) {
    $url = "$baseUrl/$model"
    $output = Join-Path $outputDir $model
    
    Write-Host "Downloading $model..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "✓ $model downloaded" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download $model" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "`n✅ Models download complete!" -ForegroundColor Green
Write-Host "Models saved to: $outputDir" -ForegroundColor Cyan
