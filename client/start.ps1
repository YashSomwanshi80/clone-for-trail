# NeuraTransit — Start React client (Vite dev server) — Windows PowerShell

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "WARNING: .env not found — using defaults from .env.example."
    Write-Host "  Copy it first: copy .env.example .env"
    Write-Host "  To connect to real backends set VITE_USE_MOCKS=false."
    Write-Host ""
}

if (-not (Test-Path "node_modules")) {
    Write-Host "==> node_modules not found — running npm install..."
    npm install
}

Write-Host "==> Starting React dev server on http://localhost:5173"
Write-Host "    Press Ctrl+C to stop."
Write-Host ""

npm run dev
