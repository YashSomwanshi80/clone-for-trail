# NeuraTransit — Start Python ANPR inference engine — Windows PowerShell

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "ERROR: .env not found."
    Write-Host "  Copy the example first: copy .env.example .env"
    Write-Host "  Then set SERVICE_API_KEY to match anpr.internal-api-key in backend\src\main\resources\application.yaml."
    Write-Host ""
    exit 1
}

if (-not (Test-Path "weights\plate_detector.pt")) {
    Write-Host ""
    Write-Host "WARNING: weights\plate_detector.pt not found."
    Write-Host "  Place your trained YOLOv8 weights at: anpr-engine\weights\plate_detector.pt"
    Write-Host ""
}

# Activate virtualenv if present
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "==> Activating virtual environment..."
    & "venv\Scripts\Activate.ps1"
} elseif (Test-Path ".venv\Scripts\Activate.ps1") {
    & ".venv\Scripts\Activate.ps1"
} else {
    Write-Host "WARNING: No venv found. Using system Python."
}

Write-Host "==> Starting ANPR engine on port 8000..."
Write-Host "    Press Ctrl+C to stop."
Write-Host ""

uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
