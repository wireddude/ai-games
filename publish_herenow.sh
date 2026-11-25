#!/usr/bin/env bash
#
# publish_herenow.sh — one-command publish of the game collection to here.now
#
# Usage:
#   ./publish_herenow.sh
#
# What it does (no AI needed):
#   1. Regenerates manifest.json from the root *.html games (via update_manifest.py)
#   2. Stages a clean copy of the web assets (root *.html + manifest.json)
#      — never uploads .git, .herenow, scripts, logs, or subdirectories
#   3. Publishes to the EXISTING here.now site (slug: wistful-truffle-vpr4)
#      — updates in place, only re-uploading changed files
#   4. Prints the live URL + entry count
#
# Requires:
#   - A here.now API key in ~/.herenow/credentials (or $HERENOW_API_KEY).
#     Without it, here.now would make a throwaway 24h site instead of updating
#     your permanent one, so this script refuses to run.
#   - The here-now skill's publish.sh (auto-located below).
#
set -euo pipefail

# ---------------------------------------------------------------- config ----
SLUG="wistful-truffle-vpr4"          # your shared site — do not change casually
CLIENT="pi"                          # attribution sent to here.now
SITE_URL="https://${SLUG}.here.now/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ------------------------------------------------------------- preflight ----
# 1) API key present? (publish.sh reads ~/.herenow/credentials automatically)
if [[ -z "${HERENOW_API_KEY:-}" && ! -f "$HOME/.herenow/credentials" ]]; then
  echo "ERROR: no here.now API key found." >&2
  echo "  Set \$HERENOW_API_KEY or save a key to ~/.herenow/credentials" >&2
  echo "  (see: https://here.now  ->  account  ->  API keys)." >&2
  exit 1
fi

# 2) Locate the here-now skill's publish.sh
PUBLISH_SH="/Users/dmkanter/.agents/skills/here-now/scripts/publish.sh"
if [[ ! -f "$PUBLISH_SH" ]]; then
  PUBLISH_SH="$(find "$HOME/.agents" "$HOME/.pi" -path '*here-now/scripts/publish.sh' 2>/dev/null | head -1 || true)"
fi
if [[ -z "${PUBLISH_SH:-}" || ! -f "$PUBLISH_SH" ]]; then
  echo "ERROR: could not find here-now publish.sh." >&2
  echo "  Install the skill:  npx skills add heredotnow/skill --skill here-now -g" >&2
  exit 1
fi

# 3) update_manifest.py present?
if [[ ! -f "$SCRIPT_DIR/update_manifest.py" ]]; then
  echo "ERROR: update_manifest.py not found next to this script." >&2
  exit 1
fi

# --------------------------------------------------- 1) refresh manifest ----
echo "==> [1/3] Regenerating manifest.json ..."
python3 "$SCRIPT_DIR/update_manifest.py" >/dev/null
MANIFEST_ENTRIES="$(python3 -c 'import json;print(len(json.load(open("manifest.json"))))')"
echo "    manifest now has ${MANIFEST_ENTRIES} games"

# ------------------------------------------------------- 2) stage assets ----
echo "==> [2/3] Staging clean web assets ..."
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/herenow-solarsystem.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT

# Only root single-file games + the manifest. Excludes .git, .herenow, scripts,
# logs, and all subdirectories (cow_abduction/, road-rage/, pac-man/, tests/).
shopt -s nullglob
root_html=( *.html )
shopt -u nullglob
if (( ${#root_html[@]} == 0 )); then
  echo "ERROR: no *.html files found in $SCRIPT_DIR — nothing to publish." >&2
  exit 1
fi
cp "${root_html[@]}" manifest.json "$STAGE/"

STAGED_COUNT="$(ls -1 "$STAGE" | wc -l | tr -d ' ')"
echo "    staged ${STAGED_COUNT} files (${#root_html[@]} games + manifest.json)"

# Safety: warn (don't fail) if there are root asset files we are NOT including,
# in case a future game stops being a self-contained single HTML file.
MISSED="$(ls -1A *.js *.css *.png *.jpg *.jpeg *.gif *.svg *.webp *.mp3 *.wav *.ogg *.json 2>/dev/null \
          | grep -vE '^manifest\.json$' || true)"
if [[ -n "$MISSED" ]]; then
  echo "    NOTE: these root asset files are NOT being staged (games should be" >&2
  echo "          self-contained single-file HTML). Add them to the cp line if a" >&2
  echo "          game actually needs them:" >&2
  printf '      %s\n' $MISSED >&2
fi

# -------------------------------------------------------- 3) publish --------
echo "==> [3/3] Publishing to ${SLUG} (in-place update) ..."
# publish.sh auto-loads the API key and prints publish_result.* lines on stderr.
# Capture both streams; the live URL is the single line on stdout.
PUBLISH_OUT="$(bash "$PUBLISH_SH" "$STAGE" --slug "$SLUG" --client "$CLIENT" 2>&1)"
LIVE_URL="$(printf '%s\n' "$PUBLISH_OUT" | grep -E '^https://[^ ]*here\.now/' | head -1 || true)"
ACTION="$(printf '%s\n' "$PUBLISH_OUT" | awk -F= '/^publish_result.action=/{print $2}')"

# ------------------------------------------------------------- summary ------
echo
echo "============================================================"
if [[ -n "$LIVE_URL" ]]; then
  echo "  Published (${ACTION:-update}):"
  echo
  echo "  ${LIVE_URL}"
  echo
  echo "  ${MANIFEST_ENTRIES} games live. Done."
else
  echo "  Publish finished but I could not detect the live URL."
  echo "  Raw output from publish.sh:"
  printf '%s\n' "$PUBLISH_OUT"
  exit 1
fi
echo "============================================================"
