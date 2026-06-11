#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION=""
SKIP_CHECKS=false
ASSUME_YES=false

usage() {
  cat <<'EOF'
Usage: scripts/release.sh [options]

Interactive release helper for Tofu POS. Bumps package.json, pushes main,
and pushes a version tag to trigger the GitHub Release workflow.

Options:
  --version <x.y.z>   Use this version (skip prompt)
  --skip-checks       Skip lint and production build
  --yes               Skip final confirmation prompt
  -h, --help          Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --skip-checks)
      SKIP_CHECKS=true
      shift
      ;;
    --yes)
      ASSUME_YES=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

get_version() {
  node -p "require('./package.json').version"
}

suggest_patch_version() {
  node -e "
    const current = require('./package.json').version;
    const parts = current.split('.').map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      process.exit(1);
    }
    parts[2] += 1;
    console.log(parts.join('.'));
  "
}

update_version() {
  local next_version="$1"
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = process.argv[1];
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  " "$next_version"
}

validate_version() {
  local candidate="$1"
  if [[ ! "$candidate" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must look like x.y.z (example: 1.0.4)." >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

confirm() {
  local prompt="$1"
  if $ASSUME_YES; then
    return 0
  fi

  read -r -p "$prompt [y/N]: " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

require_command git
require_command node
require_command npm

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run inside the git repository." >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Switch to the main branch before releasing (current: ${BRANCH:-detached})." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has uncommitted changes:" >&2
  git status --short >&2
  if ! confirm "Continue anyway?"; then
    exit 1
  fi
fi

echo "Fetching origin..."
git fetch origin

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse origin/main)"
if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  echo "Local main and origin/main differ." >&2
  echo "  local:  $LOCAL_SHA" >&2
  echo "  remote: $REMOTE_SHA" >&2
  if ! confirm "Continue anyway?"; then
    exit 1
  fi
fi

CURRENT_VERSION="$(get_version)"
SUGGESTED_VERSION="$(suggest_patch_version)"

if [[ -z "$VERSION" ]]; then
  echo
  echo "Tofu POS release helper"
  echo "Current version: ${CURRENT_VERSION}"
  echo "Suggested next patch version: ${SUGGESTED_VERSION}"
  read -r -p "New version [${SUGGESTED_VERSION}]: " VERSION
  VERSION="${VERSION:-$SUGGESTED_VERSION}"
fi

validate_version "$VERSION"

if [[ "$VERSION" == "$CURRENT_VERSION" ]]; then
  echo "Version is unchanged (${VERSION})." >&2
  exit 1
fi

TAG="v${VERSION}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists locally." >&2
  exit 1
fi

if git ls-remote --exit-code --tags origin "$TAG" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists on origin." >&2
  exit 1
fi

echo
echo "Planned release:"
echo "  package.json: ${CURRENT_VERSION} -> ${VERSION}"
echo "  git tag:      ${TAG}"
echo "  remote:       origin/main"
echo

if ! $SKIP_CHECKS; then
  if confirm "Run lint and production build checks now?"; then
    echo
    echo "Running npm run lint..."
    npm run lint
    echo
    echo "Running npm run build..."
    npm run build
  else
    echo "Skipping local checks."
  fi
fi

if ! confirm "Commit, push main, and push tag ${TAG}?"; then
  echo "Cancelled."
  exit 0
fi

update_version "$VERSION"
git add package.json
git commit -m "Bump version to ${VERSION}."

echo
echo "Pushing main..."
git push origin main

echo "Creating tag ${TAG}..."
git tag -a "$TAG" -m "Tofu POS ${VERSION}"

echo "Pushing tag..."
git push origin "$TAG"

REPO_URL="$(git remote get-url origin | sed -E 's#git@github.com:#https://github.com/#; s#\.git$##')"
echo
echo "Release triggered."
echo "  Actions:  ${REPO_URL}/actions/workflows/release.yml"
echo "  Releases: ${REPO_URL}/releases"
echo
echo "Wait for the Release workflow to finish, then verify the .dmg and .exe assets."
