# NeuraTransit — Kafka topic listener (Windows PowerShell)
#
# Usage:
#   .\kafka\listen.ps1                  → tail all three topics (colour-labelled, separate windows)
#   .\kafka\listen.ps1 detections       → anpr.detection.events only
#   .\kafka\listen.ps1 alerts           → anpr.alerts only
#   .\kafka\listen.ps1 analytics        → anpr.analytics.aggregates only
#   .\kafka\listen.ps1 <full-topic>     → any explicit topic name

param(
    [string]$Topic = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$Broker            = "localhost:9092"
$TopicDetections   = "anpr.detection.events"
$TopicAlerts       = "anpr.alerts"
$TopicAnalytics    = "anpr.analytics.aggregates"

function Resolve-Topic($alias) {
    switch ($alias.ToLower()) {
        { $_ -in "detections","detection","detect" } { return $TopicDetections }
        { $_ -in "alerts","alert" }                  { return $TopicAlerts }
        { $_ -in "analytics","analytic" }            { return $TopicAnalytics }
        default                                       { return $alias }
    }
}

function Start-TopicWindow($topicName, $windowTitle) {
    $cmd = "Set-Location '$ScriptDir'; " +
           "Write-Host 'Listening: $topicName' -ForegroundColor Cyan; " +
           "Write-Host 'Press Ctrl+C to stop.'; " +
           "Write-Host ''; " +
           ".\bin\windows\kafka-console-consumer.bat " +
               "--bootstrap-server $Broker " +
               "--topic $topicName " +
               "--from-beginning " +
               "--property print.timestamp=true"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
}

if ($Topic -eq "") {
    # No argument — open a separate window for each topic
    Write-Host "Opening listeners for all three NeuraTransit Kafka topics..." -ForegroundColor Cyan
    Write-Host "  anpr.detection.events"
    Write-Host "  anpr.alerts"
    Write-Host "  anpr.analytics.aggregates"
    Write-Host ""

    Start-TopicWindow $TopicDetections  "NT — Kafka: detection.events"
    Start-TopicWindow $TopicAlerts      "NT — Kafka: alerts"
    Start-TopicWindow $TopicAnalytics   "NT — Kafka: analytics.aggregates"

    Write-Host "Three listener windows opened." -ForegroundColor Green
} else {
    # Single topic
    $resolved = Resolve-Topic $Topic
    Write-Host "Listening to topic: $resolved" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop."
    Write-Host ""

    & ".\bin\windows\kafka-console-consumer.bat" `
        --bootstrap-server $Broker `
        --topic $resolved `
        --from-beginning `
        --property print.timestamp=true
}
