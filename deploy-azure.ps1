<#
.SYNOPSIS
  Builds the React app, bundles it with the Django backend, and deploys both to an
  existing Azure App Service (see DEPLOY_AZURE.md for creating it).

.EXAMPLE
  .\deploy-azure.ps1 -ResourceGroup nestwell-rg -AppName nestwell-abc123

.EXAMPLE
  .\deploy-azure.ps1 -PackageOnly

.NOTES
  Works in Windows PowerShell 5.1 and PowerShell 7. Needs: Azure CLI (logged in), Node.js.
  The zip never contains .env, db.sqlite3, venv or __pycache__.
#>
param(
    [string] $ResourceGroup,
    [string] $AppName,
    # Build and zip only; print the zip path and skip every Azure call (useful to inspect the package).
    [switch] $PackageOnly
)

$ErrorActionPreference = 'Stop'

function Assert-Ok([string] $what) {
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)." }
}

$frontend = Join-Path $PSScriptRoot 'frontend'
$backend  = Join-Path $PSScriptRoot 'backend'
$stage    = Join-Path ([IO.Path]::GetTempPath()) ('nestwell-' + [guid]::NewGuid().ToString('N'))
$zip      = "$stage.zip"

# --- 1. Preflight: fail fast, before spending minutes on a build ---------------------
if (-not $PackageOnly) {
    if (-not $ResourceGroup -or -not $AppName) { throw 'Pass -ResourceGroup and -AppName (or -PackageOnly).' }
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        throw 'Azure CLI not found. Install it: winget install Microsoft.AzureCLI (then reopen the terminal).'
    }
    az account show --output none 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Not logged in to Azure. Run: az login' }

    $settingNames = az webapp config appsettings list -g $ResourceGroup -n $AppName --query '[].name' -o tsv
    Assert-Ok 'Reading app settings (check -ResourceGroup / -AppName)'
    foreach ($required in 'SCM_DO_BUILD_DURING_DEPLOYMENT', 'DJANGO_SECRET_KEY', 'DB_HOST') {
        if ($settingNames -notcontains $required) {
            throw "App setting '$required' is missing on $AppName. Complete step 6 of DEPLOY_AZURE.md first."
        }
    }
}

# --- 2. Build the React app -----------------------------------------------------------
Write-Host '==> Building frontend' -ForegroundColor Cyan
Push-Location $frontend
try {
    if (-not (Test-Path 'node_modules')) { npm ci; Assert-Ok 'npm ci' }
    npm run build
    Assert-Ok 'npm run build'
} finally { Pop-Location }

# --- 3. Stage: backend + built frontend, minus anything local-only --------------------
Write-Host '==> Staging files' -ForegroundColor Cyan
robocopy $backend $stage /E /XD venv __pycache__ staticfiles media frontend_dist .pytest_cache `
    /XF .env '.env.*' db.sqlite3 '*.pyc' /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit code $LASTEXITCODE)." }
Copy-Item (Join-Path $frontend 'dist') (Join-Path $stage 'frontend_dist') -Recurse

foreach ($must in 'manage.py', 'requirements.txt', 'startup.sh', 'frontend_dist\index.html') {
    if (-not (Test-Path (Join-Path $stage $must))) { throw "Staging is missing $must." }
}
if (Test-Path (Join-Path $stage '.env')) { throw 'Refusing to deploy: .env ended up in the package.' }

# --- 4. Zip (Windows tar makes a Linux-safe zip; PS 5.1 Compress-Archive uses backslashes)
Write-Host '==> Creating package' -ForegroundColor Cyan
$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
$items = @(Get-ChildItem $stage -Force | Select-Object -ExpandProperty Name)
& $tar -a -c -f $zip -C $stage @items
Assert-Ok 'tar'
'{0:N1} MB' -f ((Get-Item $zip).Length / 1MB) | ForEach-Object { Write-Host "    package size: $_" }

if ($PackageOnly) {
    Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Package written to $zip (nothing deployed)." -ForegroundColor Green
    return
}

# --- 5. Deploy (Azure runs `pip install` + startup.sh; the first deploy takes a few minutes)
Write-Host '==> Deploying to Azure (this can take 5-10 minutes the first time)' -ForegroundColor Cyan
try {
    az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $zip --type zip
    Assert-Ok 'az webapp deploy'
} finally {
    Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
}

$hostName = az webapp show -g $ResourceGroup -n $AppName --query defaultHostName -o tsv
Write-Host ''
Write-Host "Done. https://$hostName" -ForegroundColor Green
Write-Host "Watch startup:  az webapp log tail -g $ResourceGroup -n $AppName"
