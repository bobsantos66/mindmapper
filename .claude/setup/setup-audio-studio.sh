#!/usr/bin/env bash
# Installs the audio tools used by the skills in .claude/skills on a fresh Claude Code cloud session:
#   - earshot (Python package used by the earshot skill)
#   - music-studio: Python deps, sfizz_render and Dragonfly Hall Reverb (built from source, since GitHub
#     release downloads are blocked in this environment), Sonatina Symphonic Orchestra and the VSCO 2
#     percussion it plays (fetched with git)
# Safe to run more than once: finished steps are skipped. Takes about 10-15 minutes the first time.
#
# Usage: bash .claude/setup/setup-audio-studio.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL_DIR="$REPO_DIR/.claude/skills/music-studio"
STUDIO_HOME="${STUDIO_HOME:-$HOME/.music-studio}"
TOOLS="$STUDIO_HOME/tools"
BUILD="${AUDIO_STUDIO_BUILD:-/tmp/audio-studio-build}"
JOBS="$(nproc 2>/dev/null || echo 4)"

# Pinned versions (the ones reviewed and tested)
EARSHOT_REF="7a7f7c5c70d4a763a1eca4b3666af7c77e313f97"
SFIZZ_REF="f5c6e29f23b8057867c08e88f5f6ac6738baa30b"
DRAGONFLY_REF="faf0322e8d3d44cdf998e19a037aacba25231dcc"
SSO_REF="32bbdb169aef636b8216029a2e056424ba7c2abb"
VSCO_REF="440300901dfe9275fd84e0b7763af1f8443ae62e"

log() { printf '\n==> %s\n' "$*"; }

# Clone a repo at a pinned commit (shallow), with submodules.
fetch_at() {  # url dir ref
  local url="$1" dir="$2" ref="$3"
  rm -rf "$dir"
  git init -q "$dir"
  git -C "$dir" remote add origin "$url"
  git -C "$dir" fetch -q --depth 1 origin "$ref"
  git -C "$dir" checkout -q FETCH_HEAD
  git -C "$dir" submodule update -q --init --recursive --depth 1
}

mkdir -p "$TOOLS" "$BUILD"

log "Python packages (earshot, music-studio requirements)"
pip install -q "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot@${EARSHOT_REF}"
pip install -q -r "$SKILL_DIR/requirements.txt"

if ! find "$TOOLS" -name sfizz_render -type f 2>/dev/null | grep -q .; then
  log "Building sfizz_render (sfizz ${SFIZZ_REF:0:7})"
  fetch_at https://github.com/sfztools/sfizz.git "$BUILD/sfizz" "$SFIZZ_REF"
  cmake -S "$BUILD/sfizz" -B "$BUILD/sfizz/build" -DCMAKE_BUILD_TYPE=Release \
    -DSFIZZ_JACK=OFF -DSFIZZ_RENDER=ON -DSFIZZ_SHARED=OFF -DSFIZZ_TESTS=OFF -DSFIZZ_DEMOS=OFF \
    -DSFIZZ_DEVTOOLS=OFF -DSFIZZ_BENCHMARKS=OFF -DSFIZZ_LV2=OFF -DSFIZZ_VST=OFF -DSFIZZ_AU=OFF \
    -DSFIZZ_PUREDATA=OFF -DSFIZZ_USE_SNDFILE=OFF >/dev/null
  cmake --build "$BUILD/sfizz/build" -j"$JOBS" --target sfizz_render >/dev/null
  cp "$(find "$BUILD/sfizz/build" -name sfizz_render -type f | head -1)" "$TOOLS/"
else
  log "sfizz_render: already installed"
fi

if [ ! -d "$TOOLS/DragonflyHallReverb.vst3" ]; then
  log "Building Dragonfly Hall Reverb (${DRAGONFLY_REF:0:7})"
  if command -v apt-get >/dev/null; then
    apt-get install -y -q libgl1-mesa-dev libx11-dev libxext-dev libxrandr-dev libxcursor-dev pkg-config >/dev/null
  fi
  fetch_at https://github.com/michaelwillis/dragonfly-reverb.git "$BUILD/dragonfly-reverb" "$DRAGONFLY_REF"
  make -C "$BUILD/dragonfly-reverb" -j"$JOBS" >/dev/null
  cp -r "$BUILD/dragonfly-reverb/bin/DragonflyHallReverb.vst3" "$TOOLS/"
else
  log "Dragonfly Hall Reverb: already installed"
fi

if [ ! -d "$STUDIO_HOME/sso/Sonatina Symphonic Orchestra" ]; then
  log "Downloading Sonatina Symphonic Orchestra (~2.6 GB)"
  fetch_at https://github.com/peastman/sso.git "$STUDIO_HOME/sso" "$SSO_REF"
else
  log "Sonatina Symphonic Orchestra: already installed"
fi

if [ ! -d "$STUDIO_HOME/vsco/Percussion/Timpani/Rolls" ]; then
  log "Downloading VSCO 2 percussion (only the folders the orchestra plays)"
  rm -rf "$STUDIO_HOME/vsco"
  git init -q "$STUDIO_HOME/vsco"
  git -C "$STUDIO_HOME/vsco" remote add origin https://github.com/sgossner/VSCO-2-CE.git
  git -C "$STUDIO_HOME/vsco" sparse-checkout set \
    "Percussion/Timpani/Rolls" \
    "VSCO 1 Percussion/drums/other/ethnic/giant/sticks" \
    "VSCO 1 Percussion/drums/tenor/tenor_higher" \
    "VSCO 1 Percussion/varMetal/Cymbals/susp" \
    "VSCO 1 Percussion/varMetal/various"
  git -C "$STUDIO_HOME/vsco" fetch -q --depth 1 --filter=blob:none origin "$VSCO_REF"
  git -C "$STUDIO_HOME/vsco" checkout -q FETCH_HEAD
else
  log "VSCO 2 percussion: already installed"
fi

log "Self-check"
earshot doctor | head -1
(cd "$SKILL_DIR" && STUDIO_HOME="$STUDIO_HOME" python3 setup.py --check 2>&1 | grep -v "DPF warning")
log "Done. The choir is not installed (its sources are blocked here); the orchestra works without it."
