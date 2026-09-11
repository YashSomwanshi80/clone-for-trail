# NeuraTransit — Start the full stack (Windows PowerShell)
# Launches: Kafka → Java backend → ANPR engine → React client
# Each service opens in a new PowerShell window.
# Run from the project root: .\start-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗"
Write-Host "║        NeuraTransit — Starting Full Stack        ║"
Write-Host "╚══════════════════════════════════════════════════╝"
Write-Host ""

# ---- preflight checks -------------------------------------------------------
$missing = 0

function Check-Command($cmd, $hint) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "  ✗ $cmd not found — $hint"
        $script:missing++
    } else {
        Write-Host "  ✓ $cmd found"
    }
}

Write-Host "Checking prerequisites..."
Check-Command "java"    "install JDK 25+ from https://adoptium.net"
Check-Command "python"  "install Python 3.11+ from https://python.org"
Check-Command "node"    "install Node.js 22+ from https://nodejs.org"
Check-Command "npm"     "install npm 10+ (bundled with Node.js)"

if ($missing -gt 0) {
    Write-Host ""
    Write-Host "ERROR: $missing prerequisite(s) missing. Install them and try again."
    exit 1
}

$backendConfig = Join-Path $Root "backend\src\main\resources\application.yaml"
if (-not (Test-Path $backendConfig)) {
    Write-Host ""
    Write-Host "ERROR: backend\src\main\resources\application.yaml not found."
    Write-Host "  Run: copy backend\src\main\resources\application.yaml.example backend\src\main\resources\application.yaml"
    exit 1
}

$anprEnv = Join-Path $Root "anpr-engine\.env"
if (-not (Test-Path $anprEnv)) {
    Write-Host ""
    Write-Host "ERROR: anpr-engine\.env not found."
    Write-Host "  Run: copy anpr-engine\.env.example anpr-engine\.env"
    exit 1
}

Write-Host ""
Write-Host "All checks passed. Launching services..."
Write-Host ""

# ---- helper: open a new PowerShell window -----------------------------------
function Start-Service($title, $script) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $script `
        -WorkingDirectory $Root
}

# ---- 1. Kafka ---------------------------------------------------------------
Write-Host "[1/4] Starting Kafka..."
Start-Service "NT — Kafka" "Set-Location '$Root'; .\kafka\start.ps1"
Write-Host "      Waiting 8 seconds for Kafka to be ready..."
Start-Sleep 8

# ---- 2. Java backend --------------------------------------------------------
Write-Host "[2/4] Starting Java backend..."
Start-Service "NT — Backend" "Set-Location '$Root\backend'; .\start.ps1"
Write-Host "      Waiting 25 seconds for Spring Boot to start..."
Start-Sleep 25

# ---- 3. ANPR engine ---------------------------------------------------------
Write-Host "[3/4] Starting ANPR engine..."
Start-Service "NT — ANPR Engine" "Set-Location '$Root\anpr-engine'; .\start.ps1"
Write-Host "      Waiting 5 seconds for FastAPI to start..."
Start-Sleep 5

# ---- 4. React client --------------------------------------------------------
Write-Host "[4/4] Starting React client..."
Start-Service "NT — Client" "Set-Location '$Root\client'; .\start.ps1"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗"
Write-Host "║              All services launched               ║"
Write-Host "╠══════════════════════════════════════════════════╣"
Write-Host "║  Kafka broker   →  localhost:9092                ║"
Write-Host "║  Java backend   →  http://localhost:8080         ║"
Write-Host "║  ANPR engine    →  http://localhost:8000         ║"
Write-Host "║  React client   →  http://localhost:5173         ║"
Write-Host "╚══════════════════════════════════════════════════╝"
Write-Host ""
