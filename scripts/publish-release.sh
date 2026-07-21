#!/usr/bin/env bash
# Publish build artifacts to GitHub Releases on Beingmani/Shifty.
# Usage: ./scripts/publish-release.sh [version]

set -euo pipefail

PUBLIC_REPO="Beingmani/Shifty"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

VERSION="${1:-$(node -p "require('$ROOT/package.json').version")}"
TAG="v${VERSION}"
NOTES_FILE="$ROOT/Docs/release/notes/v${VERSION}.md"

find_artifact() {
  local pattern="$1"
  find "$ROOT/out/make" -name "$pattern" -type f 2>/dev/null | head -1
}

DMG="$(find_artifact "Shifty*.dmg")"
ZIP="$(find_artifact "Shifty*.zip")"

if [[ ! -f "$NOTES_FILE" ]]; then
  echo "Missing release notes: $NOTES_FILE"
  exit 1
fi

if [[ -z "$DMG" || -z "$ZIP" ]]; then
  echo "Missing build artifacts. Run: npm run make"
  echo "  DMG: ${DMG:-not found}"
  echo "  ZIP: ${ZIP:-not found}"
  exit 1
fi

if gh release view "$TAG" --repo "$PUBLIC_REPO" &>/dev/null; then
  echo "Release $TAG already exists on $PUBLIC_REPO"
  exit 1
fi

PRERELEASE_FLAG=""
LATEST_FLAG="--latest"
[[ "$VERSION" == *beta* || "$VERSION" == *alpha* || "$VERSION" == *rc* ]] && {
  PRERELEASE_FLAG="--prerelease"
  LATEST_FLAG=""
}

gh release create "$TAG" \
  --repo "$PUBLIC_REPO" \
  --title "Shifty ${VERSION}" \
  --notes-file "$NOTES_FILE" \
  $LATEST_FLAG \
  $PRERELEASE_FLAG \
  "$DMG" \
  "$ZIP"

# gh release create rejects --latest with --prerelease; promote after upload when requested
if [[ "${RELEASE_AS_LATEST:-}" == "1" && -n "$PRERELEASE_FLAG" ]]; then
  gh release edit "$TAG" --repo "$PUBLIC_REPO" --latest
  echo "Marked $TAG as latest pre-release"
fi

echo ""
echo "Published: https://github.com/${PUBLIC_REPO}/releases/tag/${TAG}"
