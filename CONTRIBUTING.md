# Contributing to Shifty

Thanks for your interest in making Shifty better. This project is open source and community contributions are welcome.

## Getting started

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Install dependencies and run the app:

```bash
npm install
npm start
```

If Electron fails to launch during development (stale dev instance), use:

```bash
npm run start:clean
```

## Development notes

- **Stack:** Electron + React + Vite (Electron Forge).
- **macOS only** — Shifty uses AppleScript, `open -a`, and menu bar APIs that are specific to macOS.
- **Main process:** `src/main/`
- **Renderer UIs:** `src/renderer/settings/`, `src/renderer/switcher/`, `src/renderer/menubar/`, `src/renderer/toast/`
- **Restart main process** after main/preload changes: type `rs` in the terminal where `npm start` is running.

## Pull requests

1. Create a focused branch from `main`.
2. Keep changes scoped to one feature or fix.
3. Test on macOS before opening a PR.
4. Describe what changed and why in the PR body.

## Reporting bugs

Open an [issue](https://github.com/Beingmani/Shifty/issues) with:

- macOS version
- Shifty version (or commit hash)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or logs if helpful

## Feature requests

Use [GitHub Issues](https://github.com/Beingmani/Shifty/issues) with the **Feature request** label, or describe your idea in a new issue. Explain the problem you are trying to solve, not only the solution.

## Code style

- Match existing patterns in the file you edit.
- Prefer small, readable diffs over large refactors.
- Do not commit secrets, `.env` files, or local build artifacts.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
