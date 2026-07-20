<p align="center">
  <img src="assets/app-icon.png" alt="Shifty app icon" width="128" height="128" />
</p>

# Shifty

**Profile-based app switcher for macOS.** Group the apps you use together — Work, Personal, Deep Focus — and launch them in one shot. Switch profiles from the menu bar, a Spotlight-style picker, or on a schedule.

[![macOS](https://img.shields.io/badge/platform-macOS-000000?style=flat-square&logo=apple&logoColor=white)](https://www.apple.com/macos/)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal?style=flat-square)](./LICENSE)
[![Electron](https://img.shields.io/badge/Electron-43-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)

---

## Why Shifty?

If you split your day between contexts — client work, side projects, gaming, admin — you probably reopen the same set of apps every morning. Shifty lets you save those sets as **profiles** and activate them instantly, with optional cleanup of the previous profile’s apps.

- **One action** opens every app in a profile (browser, editor, chat, etc.).
- **Menu bar + quick switcher** for fast profile changes from anywhere.
- **Schedules** can prompt or auto-activate profiles on recurring windows.
- **Quit policies** per profile: ask, always quit previous apps, or leave them running.

Built for macOS. Local-first — your profiles and settings stay on your Mac.

---

## Features

| Feature | Description |
|--------|-------------|
| **Profiles** | Name, emoji, and a curated app list per context |
| **macOS-style app dock** | Magnifying dock UI when editing profile apps |
| **Quick switcher** | Global shortcut → filter profiles → Enter to switch |
| **Menu bar panel** | Tray icon with profile list, switcher, settings, quit |
| **Profile templates** | Start from Work / Personal / Focus presets |
| **Schedules** | Weekday/weekend windows with optional auto-activate |
| **Quit previous apps** | Per-profile: ask, always, or never |
| **Real app icons** | Extracted from `.app` bundles (cached locally) |
| **Light & dark theme** | System-aware UI with manual override |
| **Toasts** | In-app notifications for schedule prompts and quit offers |

---

## Requirements

- **macOS** (Apple Silicon or Intel)
- **Node.js** 18+ and npm (for development / building from source)

---

## Install (from source)

```bash
git clone https://github.com/Beingmani/Shifty.git
cd Shifty
npm install
npm start
```

**Clean dev start** (kills stale Electron dev processes):

```bash
npm run start:clean
```

### Build a distributable app

```bash
npm run make
```

Output appears under `out/make/` (macOS `.zip` via Electron Forge).

> Pre-built releases will be published on [GitHub Releases](https://github.com/Beingmani/Shifty/releases) when available.

---

## Usage

### 1. Create a profile

Open **Settings** (from the Dock icon or menu bar panel). Add a profile, pick apps with **Add apps** (`⌘⇧A`), and optionally set a schedule or quit policy.

### 2. Switch profiles

- **Menu bar** — click the Shifty tray icon → choose a profile  
- **Quick switcher** — default **`Option+Space`** (`Alt+Space`) → type to filter → `↑`/`↓` → `Enter`  
- **Schedule** — notification when a profile’s window starts (if enabled)

### 3. Keyboard shortcuts (switcher)

| Key | Action |
|-----|--------|
| `↑` / `↓` or `Tab` | Move selection |
| `Enter` | Activate profile |
| `Esc` | Close switcher |

The global switcher shortcut is configurable in Settings.

---

## Project structure

```
Shifty/
├── src/
│   ├── main/           # Electron main process (launcher, tray, store, IPC)
│   ├── preload/        # Secure bridge to renderer
│   └── renderer/
│       ├── settings/   # Profile editor & preferences
│       ├── switcher/   # Quick switcher overlay
│       ├── menubar/    # Menu bar popover
│       └── toast/      # Notification toasts
├── assets/             # App icons (Shifty.png source, app-icon.* for runtime/build)
├── forge.config.js     # Electron Forge packaging
└── scripts/            # Dev helpers
```

---

## Tech stack

- [Electron](https://www.electronjs.org/) 43
- [React](https://react.dev/) 19
- [Vite](https://vitejs.dev/) + [Electron Forge](https://www.electronforge.io/)
- [Framer Motion](https://www.framer.com/motion/) (profile app dock)
- [electron-store](https://github.com/sindresorhus/electron-store) (local persistence)
- [Lucide](https://lucide.dev/) icons

---

## Permissions (macOS)

Shifty may request **Automation** access to quit apps when switching profiles (AppleScript). Launching apps uses the standard `open -a` command. No data is sent to external servers.

---

## Contributing

Contributions are welcome — bug fixes, docs, and features. See [CONTRIBUTING.md](./CONTRIBUTING.md) (includes **Conventional Commits** for commit messages).

1. Fork the repo  
2. Create a branch  
3. Make your changes  
4. Open a pull request  

---

## Roadmap ideas

- Signed/notarized `.dmg` releases  
- Import/export profiles  
- iCloud or file sync for profiles  
- Windows/Linux are out of scope for now (macOS-specific APIs)

Have an idea? [Open an issue](https://github.com/Beingmani/Shifty/issues).

---

## Author

**BeingMani** — [GitHub](https://github.com/Beingmani)

---

## License

[MIT](./LICENSE) © 2026 BeingMani
