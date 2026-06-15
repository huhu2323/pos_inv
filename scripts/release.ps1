#Requires -Version 5.1

param(
    [string]$Version,
    [switch]$SkipChecks,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root

function Get-PackageVersion {
    node -p "require('./package.json').version"
}

function Get-SuggestedPatchVersion {
    node -e @"
const current = require('./package.json').version;
const parts = current.split('.').map((part) => Number(part));
if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
  process.exit(1);
}
parts[2] += 1;
console.log(parts.join('.'));
"@
}

function Set-PackageVersion {
    param([string]$NextVersion)

    node -e @"
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = process.argv[1];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"@ $NextVersion
}

function Test-VersionFormat {
    param([string]$Candidate)

    if ($Candidate -notmatch '^\d+\.\d+\.\d+$') {
        throw "Version must look like x.y.z (example: 1.0.4)."
    }
}

function Test-Changelog {
    param([string]$ReleaseVersion)

    if (-not (Test-Path 'CHANGELOG.md')) {
        throw 'CHANGELOG.md is required before releasing.'
    }

    node scripts/extract-changelog-notes.mjs $ReleaseVersion | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Update CHANGELOG.md with a non-empty ## [$ReleaseVersion] section before releasing."
    }
}

function Confirm {
    param([string]$Prompt)

    if ($Yes) {
        return $true
    }

    $reply = Read-Host "$Prompt [y/N]"
    return $reply -match '^[Yy]$'
}

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

Require-Command git
Require-Command node
Require-Command npm

if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    throw 'This script must be run inside the git repository.'
}

$branch = git branch --show-current
if ($branch -ne 'main') {
    throw "Switch to the main branch before releasing (current: $branch)."
}

$status = git status --porcelain
if ($status) {
    Write-Host 'Working tree has uncommitted changes:' -ForegroundColor Yellow
    git status --short
    if (-not (Confirm 'Continue anyway?')) {
        exit 1
    }
}

Write-Host 'Fetching origin...'
git fetch origin

$localSha = git rev-parse HEAD
$remoteSha = git rev-parse origin/main
if ($localSha -ne $remoteSha) {
    Write-Host 'Local main and origin/main differ.' -ForegroundColor Yellow
    Write-Host "  local:  $localSha"
    Write-Host "  remote: $remoteSha"
    if (-not (Confirm 'Continue anyway?')) {
        exit 1
    }
}

$currentVersion = Get-PackageVersion
$suggestedVersion = Get-SuggestedPatchVersion

if (-not $Version) {
    Write-Host ''
    Write-Host 'Tofu POS release helper'
    Write-Host "Current version: $currentVersion"
    Write-Host "Suggested next patch version: $suggestedVersion"
    $inputVersion = Read-Host "New version [$suggestedVersion]"
    if ([string]::IsNullOrWhiteSpace($inputVersion)) {
        $Version = $suggestedVersion
    } else {
        $Version = $inputVersion.Trim()
    }
}

Test-VersionFormat $Version
Test-Changelog $Version

if ($Version -eq $currentVersion) {
    throw "Version is unchanged ($Version)."
}

$tag = "v$Version"

if (git tag --list $tag) {
    throw "Tag $tag already exists locally."
}

$remoteTag = git ls-remote --tags origin ("refs/tags/{0}" -f $tag)
if ($remoteTag) {
    throw "Tag $tag already exists on origin."
}

Write-Host ''
Write-Host 'Planned release:'
Write-Host "  package.json: $currentVersion -> $Version"
Write-Host "  git tag:      $tag"
Write-Host '  remote:       origin/main'
Write-Host ''

if (-not $SkipChecks) {
    if (Confirm 'Run lint and production build checks now?') {
        Write-Host ''
        Write-Host 'Running npm run lint...'
        npm run lint
        Write-Host ''
        Write-Host 'Running npm run build...'
        npm run build
    } else {
        Write-Host 'Skipping local checks.'
    }
}

if (-not (Confirm "Commit, push main, and push tag $tag?")) {
    Write-Host 'Cancelled.'
    exit 0
}

Set-PackageVersion $Version
git add package.json CHANGELOG.md
git commit -m "Bump version to $Version."

Write-Host ''
Write-Host 'Pushing main...'
git push origin main

Write-Host "Creating tag $tag..."
git tag -a $tag -m "Tofu POS $Version"

Write-Host 'Pushing tag...'
git push origin $tag

$remoteUrl = git remote get-url origin
$repoUrl = $remoteUrl -replace '^git@github.com:', 'https://github.com/' -replace '\.git$', ''

Write-Host ''
Write-Host 'Release triggered.'
Write-Host "  Actions:  $repoUrl/actions/workflows/release.yml"
Write-Host "  Releases: $repoUrl/releases"
Write-Host ''
Write-Host 'Wait for the Release workflow to finish, then verify the .dmg and .exe assets.'
