param(
    [switch]$SkipBuild,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$frontendDirectory = Join-Path $PSScriptRoot 'frontend'
$pythonExecutable = Join-Path $backendDirectory '.venv\Scripts\python.exe'
$appUrl = 'http://localhost:8000'

if (-not (Test-Path -LiteralPath $pythonExecutable)) {
    throw 'Backend dependencies are missing. Run: cd backend; uv sync --extra dev'
}

# Reuse a running instance instead of starting a second server on the same port.
try {
    $response = Invoke-WebRequest "$appUrl/api/v1/babies/" -UseBasicParsing -TimeoutSec 5
    $appRunning = $response.StatusCode -eq 200 -and $response.Headers['Content-Type'] -like 'application/json*'
} catch {
    $appRunning = $false
}
if ($appRunning) {
    Write-Host "BabyTracker is already running at $appUrl"
    if (-not $NoBrowser) { Start-Process $appUrl }
    return
}

Push-Location $backendDirectory
try {
    # Fail before opening the app if PostgreSQL or the schema is unavailable.
    & $pythonExecutable -c "from app.core.database import SessionLocal; from app.models.baby import BabyProfile; db = SessionLocal(); db.query(BabyProfile).limit(1).all(); db.close(); print('Database check passed.')"
    if ($LASTEXITCODE -ne 0) {
        throw 'Cannot read baby profiles. Check PostgreSQL, backend/.env, and the database migrations.'
    }
} finally {
    Pop-Location
}

if (-not $SkipBuild) {
    Push-Location $frontendDirectory
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed. See the error above.' }
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendDirectory 'build\index.html'))) {
    throw 'Frontend build is missing. Run Start-App.ps1 without -SkipBuild.'
}

Write-Host "Starting BabyTracker at $appUrl"
Write-Host 'Keep this terminal open while using the app. Press Ctrl+C to stop.'
Write-Host "Once 'Application startup complete' appears, open $appUrl in your browser."
Push-Location $backendDirectory
try {
    & $pythonExecutable -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    if ($LASTEXITCODE -ne 0) { throw 'The app server stopped with an error. See the error above.' }
} finally {
    Pop-Location
}
