# Releasing Tofu POS

This guide covers desktop releases (automated via GitHub Actions) and manual mobile builds.

## Quick start (desktop)

### macOS / Linux / Git Bash on Windows

```bash
chmod +x scripts/release.sh   # first time only
./scripts/release.sh
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release.ps1
```

Both scripts are interactive. They will:

1. Show the current version and suggest the next patch version
2. Optionally run `npm run lint` and `npm run build`
3. Bump `package.json`
4. Commit and push `main`
5. Create and push a `vX.Y.Z` tag

Pushing the tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml), which builds:

- macOS `.dmg`
- Windows `.exe`

and publishes them to [GitHub Releases](https://github.com/huhu2323/pos_inv/releases).

### Non-interactive flags

```bash
./scripts/release.sh --version 1.0.4 --yes
./scripts/release.sh --version 1.0.4 --skip-checks --yes
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release.ps1 -Version 1.0.4 -Yes
powershell -ExecutionPolicy Bypass -File scripts/release.ps1 -Version 1.0.4 -SkipChecks -Yes
```

| Flag | Bash | PowerShell | Description |
|------|------|------------|-------------|
| Version | `--version 1.0.4` | `-Version 1.0.4` | Skip version prompt |
| Skip checks | `--skip-checks` | `-SkipChecks` | Skip lint/build |
| Auto-confirm | `--yes` | `-Yes` | Skip confirmation prompts |

---

## Before you release

- [ ] Changes are merged on `main`
- [ ] You are on the `main` branch
- [ ] Working tree is clean (or you understand extra local changes)
- [ ] `origin/main` is up to date (`git pull`)
- [ ] Version format is `x.y.z` (example: `1.0.4`)
- [ ] `CHANGELOG.md` has a finalized `## [x.y.z] - YYYY-MM-DD` section for the release version (move items out of `[Unreleased]` first)

### Changelog workflow

1. While building features, add bullets under `## [Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md).
2. Before releasing, rename that content into a new version section, for example `## [1.0.6] - 2026-06-11`.
3. Leave an empty `## [Unreleased]` section at the top for the next cycle.
4. Commit `CHANGELOG.md` with the version bump. The release scripts refuse to run if the target version section is missing or empty.
5. After CI finishes, confirm the [GitHub Release](https://github.com/huhu2323/pos_inv/releases) notes match `CHANGELOG.md` (CI reads the version section automatically).

Recommended local check (the script can run this for you):

```bash
nvm use 24
npm ci
npm run lint
npm run build
```

Smoke-test if needed:

```bash
npm run electron:dev      # desktop
npm run cap:android       # Android
npm run cap:ios           # iOS
```

---

## Desktop release flow

```text
bump package.json
      ↓
commit + push main
      ↓
tag vX.Y.Z + push tag
      ↓
GitHub Actions: Release workflow
      ↓
.dmg + .exe on GitHub Releases
```

### What the CI workflow does

1. Lint
2. Build macOS and Windows installers
3. Upload only `.dmg` and `.exe` files to the release

### After the workflow finishes

1. Open **Actions** and confirm the Release workflow is green
2. Open **Releases** and verify assets:
   - `Tofu POS-X.Y.Z-arm64.dmg` (or similar)
   - `Tofu POS Setup X.Y.Z.exe` (or similar)
3. Download and test installers on real machines

Installers are **unsigned**, so macOS and Windows may show security warnings on first install.

---

## Version numbering

Use [semantic versioning](https://semver.org/) style `x.y.z`:

| Bump | When | Example |
|------|------|---------|
| Patch `z` | Bug fixes, small tweaks | `1.0.3` → `1.0.4` |
| Minor `y` | New features, backward compatible | `1.0.4` → `1.1.0` |
| Major `x` | Breaking changes | `1.1.0` → `2.0.0` |

The tag must match the version with a `v` prefix:

- `package.json` version: `1.0.4`
- Git tag: `v1.0.4`

---

## Rules that prevent release pain

| Do | Don't |
|----|--------|
| Use a **new tag** for each release | Force-push the same tag to retry |
| Wait 15+ minutes after rate-limit errors | Spam tags or re-runs in a few minutes |
| Delete a broken release before retrying the same version | Re-upload over a half-broken release |
| Push the tag **once** per version | Re-tag repeatedly to "fix" CI |

---

## Android (manual)

CI does not build Android yet.

```bash
npm run cap:sync
npm run cap:android
```

In Android Studio: **Build → Build Bundle(s) / APK(s)**

Upload the APK/AAB yourself (GitHub Release, Play Store, or sideload).

---

## iOS (manual)

```bash
npm run cap:sync
npm run cap:ios
```

Build and archive from Xcode (device, TestFlight, or App Store).

Requires macOS, Xcode, and CocoaPods.

---

## GitHub settings (one-time)

**Settings → Actions → General → Workflow permissions**

Set to **Read and write permissions** so the release job can publish assets.

---

## Troubleshooting

### `GH_TOKEN` / publish errors during build

Desktop CI uses `electron-builder --publish never`. The separate release job uploads assets. Do not re-enable auto-publish in electron-builder.

### `not a git repository` in release job

The publish job checks out the repo for `gh release create --generate-notes`. This is already configured in the workflow.

### `ReleaseAsset.name already exists`

Usually caused by uploading non-installer files (for example `index.js` from unpacked Windows build output). The workflow now uploads only `.dmg` and `.exe` files.

### Secondary rate limit

Too many release API calls in a short time. Wait 15–30 minutes, delete any broken release, then push a **new** tag.

---

## Manual release (without scripts)

```bash
# 1. Bump version in package.json
# 2. Commit and push
git add package.json
git commit -m "Bump version to 1.0.4."
git push origin main

# 3. Tag once
git tag v1.0.4
git push origin v1.0.4
```

---

## Useful links

- [Actions](https://github.com/huhu2323/pos_inv/actions)
- [Releases](https://github.com/huhu2323/pos_inv/releases)
- [Release workflow](../.github/workflows/release.yml)
