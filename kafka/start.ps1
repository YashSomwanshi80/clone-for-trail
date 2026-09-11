# NeuraTransit — Start Kafka broker (KRaft mode) — Windows PowerShell
# Run from project root:  .\kafka\start.ps1
# Or from inside kafka\:  .\start.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$config = "config\kraft\server.properties"
if (-not (Test-Path $config)) {
    $config = "config\server.properties"
}

Write-Host "==> Starting Kafka broker (KRaft) — config: $config"
Write-Host "    Press Ctrl+C to stop."
Write-Host ""

& ".\bin\windows\kafka-server-start.bat" $config
