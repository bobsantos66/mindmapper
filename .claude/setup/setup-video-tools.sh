#!/usr/bin/env bash
# Installs the video tools used by the skills in .claude/skills on a fresh Claude Code cloud session:
#   - yt-dlp           (download video/audio from YouTube and other sites)
#   - openai-whisper   (speech-to-text; `whisper` CLI) with CPU-only PyTorch
#   - faster-whisper, mediapipe, opencv-python, numpy (used by the `shorts` skill; also an ASR engine
#     for `ffmpeg-skill`)
#   - the Remotion project's npm dependencies for the `shorts` skill
# FFmpeg itself is already in the image (6.1+, which ffmpeg-skill requires).
# Packages go into the system Python, so every skill sees them; ~/.video-skill is a venv that reuses
# them, because the `shorts` skill activates that venv before running its scripts.
# Safe to run more than once. Usage: bash .claude/setup/setup-video-tools.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SHORTS_DIR="$REPO_DIR/.claude/skills/shorts"
PY="${PYTHON:-python3}"

log() { printf '\n==> %s\n' "$*"; }

log "PyTorch (CPU-only)"
"$PY" -c "import torch" 2>/dev/null \
  || "$PY" -m pip install --quiet torch torchaudio --index-url https://download.pytorch.org/whl/cpu

log "yt-dlp, openai-whisper, faster-whisper, numpy, opencv-python"
"$PY" -m pip install --quiet --upgrade yt-dlp
# av<16: PyAV 16+ dropped open(metadata_errors=...), which faster-whisper 1.2.x still passes.
"$PY" -m pip install --quiet openai-whisper faster-whisper "av<16" numpy opencv-python

log "mediapipe (face tracking for shorts; optional)"
"$PY" -m pip install --quiet mediapipe \
  || echo "warning: mediapipe did not install for this Python; shorts falls back to a centre crop"

log "venv ~/.video-skill for the shorts skill"
[ -x "$HOME/.video-skill/bin/python3" ] || "$PY" -m venv --system-site-packages "$HOME/.video-skill"

log "Remotion dependencies for shorts"
if [ -f "$SHORTS_DIR/remotion/package.json" ]; then
  (cd "$SHORTS_DIR/remotion" && npm install --no-audit --no-fund --loglevel=error)
fi

log "Check"
ffmpeg -version | head -1
yt-dlp --version
command -v whisper
"$PY" -c "import faster_whisper; print('faster-whisper', faster_whisper.__version__)"
echo "Done."
