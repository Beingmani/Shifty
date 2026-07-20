# Releasing Shifty

This guide mirrors the release workflow used in [Stasho](https://github.com/Beingmani/Stasho). Shifty publishes to the same repo (`Beingmani/Shifty`) on GitHub Releases.

## Prerequisites

- macOS with Node.js 18+
- `gh` CLI authenticated (`gh auth login`)
- Optional: `GH_TOKEN` for pre-flight duplicate-release checks

## Day-to-day changelog

1. Add entries under `## [Unreleased]` in [CHANGELOG.md](../../CHANGELOG.md)
2. Use `### Added`, `### Changed`, or `### Fixed` subsections with bullet items

## Cut a release

```bash
./scripts/release.sh          # interactive version prompt
./scripts/release.sh 1.0.1    # explicit version
```

The script will:

1. Bump `package.json`
2. Move `[Unreleased]` notes into a versioned section in `CHANGELOG.md`
3. Write `Docs/release/notes/v{version}.md`
4. Run `npm run make` (DMG + ZIP)
5. Commit, tag `v{version}`, and push to `main`
6. Create a GitHub Release with artifacts via `scripts/publish-release.sh`

## Manual publish only

If you already built locally:

```bash
npm run make
./scripts/publish-release.sh 1.0.1
```

## In-app update checks

Packaged builds poll `https://api.github.com/repos/Beingmani/Shifty/releases` hourly. Users see:

- **Settings → About → Check for updates**
- An **Update to vX** pill when a newer release exists
- A **What's new** modal on first launch after updating

Dev mode (`npm start`) skips background update checks.

## Artifacts

After `npm run make`, expect:

- `out/make/*.dmg` — macOS disk image
- `out/make/zip/darwin/arm64/Shifty-darwin-arm64-{version}.zip` — zip archive

## Unsigned builds

Until the app is notarized, release notes include the `xattr -cr /Applications/Shifty.app` workaround for Gatekeeper.
