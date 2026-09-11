# NeuraTransit — Start Java backend (Spring Boot) — Windows PowerShell

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$config = "src\main\resources\application.yaml"
if (-not (Test-Path $config)) {
    Write-Host ""
    Write-Host "ERROR: $config not found."
    Write-Host "  Copy the example first: copy src\main\resources\application.yaml.example src\main\resources\application.yaml"
    Write-Host "  Then edit it with your DB credentials and secrets."
    Write-Host ""
    exit 1
}

Write-Host "==> Starting Java backend on port 8080..."
Write-Host "    (Building first — this may take a minute on a cold cache)"
Write-Host ""

.\mvnw.cmd spring-boot:run
