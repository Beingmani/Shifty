# Changelog

All notable changes to Shifty are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **In-app updates** — Check for updates from Settings → About; download from GitHub Releases
- **What's new** — Release notes in Settings and a first-run modal after updating
- **Release tooling** — `scripts/release.sh`, DMG + ZIP builds, and GitHub Release publishing

---

## [1.0.0] — 2026-07-20

Initial public release of Shifty — profile-based app switcher for macOS.

### Added
- **Profiles** — Save named app sets with emoji, schedules, and quit policies
- **Quick switcher** — Global shortcut with Spotlight-style filtering
- **Menu bar panel** — Switch profiles, open settings, or quit from the tray
- **Profile templates** — Work, Personal, and Focus presets
- **Light & dark themes** — System-aware appearance with manual override
- **Real app icons** — Extracted from `.app` bundles and cached locally

[1.0.0]: https://github.com/Beingmani/Shifty/releases/tag/v1.0.0
