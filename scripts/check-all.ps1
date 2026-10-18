# Run every check, in order, and print a PASS/FAIL summary (Prompt 15).
#   1. Python tests (pytest)     4. Validate data
#   2. Site unit tests (Vitest)  5. Site build
#   3. Lint                      6. Browser tests (Playwright)
# GitHub runs the same steps on every push (.github/workflows/ci.yml).
#
# Run it from anywhere:
#   powershell -ExecutionPolicy Bypass -File scripts\check-all.ps1
# Add -SkipE2E to leave out the browser tests (the slowest step).

param([switch]$SkipE2E)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$site = Join-Path $root "site"
$python = Join-Path $root ".venv\Scripts\python.exe"
$results = New-Object System.Collections.Generic.List[object]

function Run-Step {
    param([string]$Name, [string]$Dir, [scriptblock]$Command)
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location $Dir
    try {
        # Out-Host prints the output instead of returning it, so this function returns only $ok.
        & $Command | Out-Host
        $ok = ($LASTEXITCODE -eq 0)
    } catch {
        Write-Host $_ -ForegroundColor Red
        $ok = $false
    } finally {
        Pop-Location
    }
    $timer.Stop()
    $results.Add([pscustomobject]@{ Step = $Name; Result = $(if ($ok) { "PASS" } else { "FAIL" }); Seconds = [math]::Round($timer.Elapsed.TotalSeconds) })
    return $ok
}

function Add-Skipped {
    param([string]$Name, [string]$Why)
    $results.Add([pscustomobject]@{ Step = $Name; Result = "SKIP ($Why)"; Seconds = 0 })
}

# A test server left running on port 3100 would make Playwright test an old build.
function Stop-OldTestServer {
    $listeners = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue
    foreach ($l in $listeners) {
        $proc = Get-Process -Id $l.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") {
            Write-Host "Stopping an old test server on port 3100 (process $($proc.Id))."
            Stop-Process -Id $proc.Id -Force -Confirm:$false
        }
    }
}

if (-not (Test-Path $python)) {
    Write-Host "No .venv found. Make it first: py -3 -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

Run-Step "Python tests (pytest)" $root { & $python -m pytest pipeline/tests -q } | Out-Null
Run-Step "Site unit tests (Vitest)" $site { & npm.cmd test } | Out-Null
Run-Step "Lint (ESLint)" $site { & npm.cmd run lint } | Out-Null
$dataOk = Run-Step "Validate data" $site { & npm.cmd run validate-data }

$buildOk = $false
if ($dataOk) {
    # npm run build checks the data again, then builds.
    $buildOk = Run-Step "Site build" $site { & npm.cmd run build }
} else {
    Add-Skipped "Site build" "data check failed"
}

if ($SkipE2E) {
    Add-Skipped "Browser tests (Playwright)" "-SkipE2E"
} elseif ($buildOk) {
    Stop-OldTestServer
    Run-Step "Browser tests (Playwright)" $site { & npx.cmd playwright test } | Out-Null
    Stop-OldTestServer
} else {
    Add-Skipped "Browser tests (Playwright)" "no fresh build"
}

Write-Host ""
Write-Host "================ SUMMARY ================" -ForegroundColor Cyan
foreach ($r in $results) {
    $color = if ($r.Result -eq "PASS") { "Green" } elseif ($r.Result -eq "FAIL") { "Red" } else { "Yellow" }
    Write-Host ("{0,-30} {1,-26} {2,5}s" -f $r.Step, $r.Result, $r.Seconds) -ForegroundColor $color
}
$failed = @($results | Where-Object { $_.Result -ne "PASS" })
Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($failed.Count) CHECK(S) DID NOT PASS" -ForegroundColor Red
    exit 1
}
