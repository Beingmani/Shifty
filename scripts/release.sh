#!/usr/bin/env bash
# scripts/release.sh — Full release automation for Shifty.
#
# Usage:
#   ./scripts/release.sh              # interactive — prompts for version
#   ./scripts/release.sh 1.0.1        # non-interactive

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BOLD='\033[1m'; BLUE='\033[0;34m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; DIM='\033[2m'; NC='\033[0m'

step()    { echo -e "\n${BOLD}${BLUE}▸${NC}${BOLD} $1${NC}"; }
ok()      { echo -e "  ${GREEN}✓${NC} $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC}  $1"; }
fail()    { echo -e "\n  ${RED}✖  $1${NC}\n"; exit 1; }
dim()     { echo -e "  ${DIM}$1${NC}"; }

VERSION="${1:-}"
TAG="v${VERSION}"
TODAY="$(date +%Y-%m-%d)"
REPO="Beingmani/Shifty"

step "Version"
CURRENT="$(node -p "require('./package.json').version")"
dim "Current: v${CURRENT}"

if [[ -z "$VERSION" ]]; then
  echo ""
  read -rp "  New version (e.g. 1.0.1 or 1.0.1-beta.1): " VERSION
fi
[[ -z "$VERSION" ]] && fail "Version cannot be empty."
TAG="v${VERSION}"

ok "Releasing $TAG on $TODAY"

step "Pre-flight checks"

if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Uncommitted changes detected — they will be included in the release commit."
  read -rp "  Continue? (y/N): " ANS
  [[ "$ANS" =~ ^[Yy]$ ]] || exit 1
fi

if git tag | grep -q "^${TAG}$"; then
  fail "Tag $TAG already exists. Delete it first: git tag -d $TAG"
fi

UNRELEASED_CONTENT="$(python3 - "$ROOT/CHANGELOG.md" <<'PY'
import sys, re
with open(sys.argv[1]) as f: c = f.read()
m = re.search(r'## \[Unreleased\]\n\n(.*?)(?=\n---|\n## \[)', c, re.DOTALL)
body = (m.group(1).strip() if m else '').strip()
print(body)
PY
)"

if [[ -z "$UNRELEASED_CONTENT" ]]; then
  warn "The [Unreleased] section in CHANGELOG.md is empty."
  read -rp "  Continue anyway? (y/N): " ANS
  [[ "$ANS" =~ ^[Yy]$ ]] || exit 1
fi

ok "Pre-flight passed"

step "Bumping version"
npm version "$VERSION" --no-git-tag-version
ok "package.json → $VERSION"

step "Updating CHANGELOG.md"
python3 - "$ROOT/CHANGELOG.md" "$VERSION" "$TODAY" <<'PY'
import sys, re

path, version, today = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    c = f.read()

m = re.search(r'## \[Unreleased\]\n\n(.*?)\n\n---', c, re.DOTALL)
body = m.group(1).strip() if m and m.group(1).strip() else ''

new_section = f'## [{version}] — {today}'
if body:
    new_section += f'\n\n{body}'

updated = re.sub(
    r'## \[Unreleased\]\n\n.*?\n\n---',
    f'## [Unreleased]\n\n---\n\n{new_section}\n\n---',
    c,
    count=1,
    flags=re.DOTALL,
)

link = f'[{version}]: https://github.com/Beingmani/Shifty/releases/tag/v{version}'
if link not in updated:
    updated = updated.rstrip() + f'\n{link}\n'

with open(path, 'w') as f:
    f.write(updated)
PY
ok "CHANGELOG.md updated"

step "Generating release notes"
NOTES_DIR="$ROOT/Docs/release/notes"
mkdir -p "$NOTES_DIR"
NOTES_FILE="$NOTES_DIR/v${VERSION}.md"

BODY="$(python3 - "$ROOT/CHANGELOG.md" "$VERSION" <<'PY'
import sys, re
path, version = sys.argv[1], sys.argv[2]
with open(path) as f:
    c = f.read()
m = re.search(rf'## \[{re.escape(version)}\][^\n]*\n\n(.*?)(?=\n---|\n## \[|\Z)', c, re.DOTALL)
print((m.group(1).strip() if m else '').strip())
PY
)"

IS_BETA=false
[[ "$VERSION" == *beta* || "$VERSION" == *alpha* || "$VERSION" == *rc* ]] && IS_BETA=true

if $IS_BETA; then
INSTALL="### Install (unsigned beta)

This build may not be notarized. macOS may block unsigned downloads.

1. Download **Shifty-${VERSION}-arm64.dmg** below
2. Open the DMG and drag **Shifty** to **Applications**
3. If macOS blocks the app, run in Terminal:
   \`\`\`bash
   xattr -cr /Applications/Shifty.app
   \`\`\`
4. Open Shifty normally

**Requires:** macOS on Apple Silicon (arm64)"
else
INSTALL="### Install

1. Download **Shifty-${VERSION}-arm64.dmg** below
2. Open the DMG and drag **Shifty** to **Applications**
3. Open Shifty normally

> **If macOS blocks the app:** Run \`xattr -cr /Applications/Shifty.app\` once in Terminal.

**Requires:** macOS on Apple Silicon (arm64)"
fi

NOTES_CONTENT="## Shifty ${VERSION}

${BODY}

---

${INSTALL}

---

**Full changelog:** [CHANGELOG.md](https://github.com/Beingmani/Shifty/blob/main/CHANGELOG.md)

**Report a bug:** [Open an issue](https://github.com/Beingmani/Shifty/issues/new/choose)"

echo "$NOTES_CONTENT" > "$NOTES_FILE"
ok "Docs/release/notes/v${VERSION}.md"

step "Building app"
node scripts/check-release-version.js
npm run make
ok "Build complete → out/make/"

step "Git commit + tag + push"
git add package.json package-lock.json CHANGELOG.md "$NOTES_FILE"
git commit -m "chore: release v${VERSION}"
git tag "$TAG"
git push origin main
git push origin "$TAG"
ok "Committed and pushed $TAG"

step "Publishing GitHub Release"
bash "$ROOT/scripts/publish-release.sh" "$VERSION"

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  ✓  Shifty v${VERSION} released!${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${DIM}https://github.com/${REPO}/releases/tag/${TAG}${NC}"
echo ""
