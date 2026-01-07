param(
  [Parameter(Mandatory=$true)]
  [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Ensure we're in a git repo
if (-not (Test-Path ".git")) {
  throw "Not a git repository. Run this script from the repo root."
}

# Show status
git status

# Stage all changes
git add .

# Check if anything is staged
$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "Nothing to commit. Exiting."
  exit 0
}

# Commit with message
git commit -m "$Message"

# Push to GitHub
git push

Write-Host "Done. GitHub Pages will update shortly."
