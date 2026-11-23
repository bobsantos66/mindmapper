#!/usr/bin/env bash
# Installs the tools used by the video skills in .claude/skills on a fresh Claude Code cloud session:
#   - yt-dlp, OpenAI Whisper (CPU-only PyTorch), OpenCV, google-genai, numpy, pillow (system python3)
#   - ghost-editor: linked to ~/.claude/skills/ghost-editor (the path its scripts use); its Mixkit SFX and
#     music library when mixkit.co and assets.mixkit.co are in the environment's allowed domains
#   - ffmpeg-skill: linked to ~/.claude/skills/ffmpeg-skill (stdlib only, nothing to install)
#   - shorts (claude-shorts): Python venv at ~/.shorts-skill (faster-whisper, mediapipe) and the Remotion
#     project's node_modules (npm ci from its package-lock.json)
# Safe to run more than once: finished steps are skipped. Takes about 5 minutes the first time.
#
# Usage: bash .claude/setup/setup-video-tools.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILLS="$REPO_DIR/.claude/skills"
SHORTS_VENV="${SHORTS_VENV:-$HOME/.shorts-skill}"
TORCH_INDEX="https://download.pytorch.org/whl/cpu"

# Pinned versions (the ones installed and tested on 2026-11-23)
YTDLP_VER="2026.10.26"
TORCH_VER="2.15.0+cpu"
TORCHVISION_VER="0.29.2+cpu"
TORCHAUDIO_VER="2.11.1+cpu"
WHISPER_VER="20250625"
OPENCV_VER="5.1.0.95"
GENAI_VER="3.6.1"
NUMPY_VER="2.5.3"
PILLOW_VER="12.3.0"
FASTER_WHISPER_VER="1.2.1"
MEDIAPIPE_VER="1.2.3"

log() { printf '\n==> %s\n' "$*"; }
pip_q() { "$@" --quiet --disable-pip-version-check --root-user-action=ignore; }

# True when python ($1) has package ($2) at exactly version ($3).
has_ver() {
  [ "$("$1" -m pip show "$2" 2>/dev/null | awk '/^Version:/{print $2}')" = "$3" ]
}

command -v ffmpeg >/dev/null || { echo "ffmpeg is required (apt-get install -y ffmpeg)"; exit 1; }
command -v node >/dev/null || { echo "node >= 18 is required"; exit 1; }

# --- System python: yt-dlp, Whisper, ghost-editor packages ---------------------------------------
log "Python packages (yt-dlp, Whisper, OpenCV, google-genai)"
if has_ver python3 torch "$TORCH_VER"; then
  echo "torch $TORCH_VER: already installed"
else
  pip_q python3 -m pip install --index-url "$TORCH_INDEX" "torch==$TORCH_VER"
fi
NEED=()
has_ver python3 yt-dlp "$YTDLP_VER" || NEED+=("yt-dlp==$YTDLP_VER")
has_ver python3 openai-whisper "$WHISPER_VER" || NEED+=("openai-whisper==$WHISPER_VER")
has_ver python3 opencv-python-headless "$OPENCV_VER" || NEED+=("opencv-python-headless==$OPENCV_VER")
has_ver python3 google-genai "$GENAI_VER" || NEED+=("google-genai==$GENAI_VER")
has_ver python3 numpy "$NUMPY_VER" || NEED+=("numpy==$NUMPY_VER")
has_ver python3 pillow "$PILLOW_VER" || NEED+=("pillow==$PILLOW_VER")
if [ ${#NEED[@]} -gt 0 ]; then
  # --extra-index-url keeps pip on the CPU torch wheel already installed above.
  pip_q python3 -m pip install --extra-index-url "$TORCH_INDEX" "${NEED[@]}"
else
  echo "all pinned: already installed"
fi

# --- Skill links -----------------------------------------------------------------------------------
log "Linking skills into ~/.claude/skills"
mkdir -p "$HOME/.claude/skills"
for s in ghost-editor ffmpeg-skill shorts; do
  [ -d "$SKILLS/$s" ] || { echo "missing $SKILLS/$s"; exit 1; }
  ln -sfn "$SKILLS/$s" "$HOME/.claude/skills/$s"
  echo "$s -> $SKILLS/$s"
done

# --- shorts: venv + Remotion ----------------------------------------------------------------------
log "shorts: Python venv at $SHORTS_VENV"
[ -x "$SHORTS_VENV/bin/python3" ] || python3 -m venv "$SHORTS_VENV"
SPY="$SHORTS_VENV/bin/python3"
if has_ver "$SPY" torch "$TORCH_VER" && has_ver "$SPY" torchvision "$TORCHVISION_VER" \
   && has_ver "$SPY" torchaudio "$TORCHAUDIO_VER"; then
  echo "torch/torchvision/torchaudio: already installed"
else
  pip_q "$SPY" -m pip install --index-url "$TORCH_INDEX" \
    "torch==$TORCH_VER" "torchvision==$TORCHVISION_VER" "torchaudio==$TORCHAUDIO_VER"
fi
NEED=()
has_ver "$SPY" faster-whisper "$FASTER_WHISPER_VER" || NEED+=("faster-whisper==$FASTER_WHISPER_VER")
has_ver "$SPY" mediapipe "$MEDIAPIPE_VER" || NEED+=("mediapipe==$MEDIAPIPE_VER")
has_ver "$SPY" opencv-python "$OPENCV_VER" || NEED+=("opencv-python==$OPENCV_VER")
if [ ${#NEED[@]} -gt 0 ]; then
  pip_q "$SPY" -m pip install --extra-index-url "$TORCH_INDEX" "${NEED[@]}"
else
  echo "faster-whisper, mediapipe, opencv: already installed"
fi

log "shorts: Remotion node_modules"
if [ -d "$SKILLS/shorts/remotion/node_modules/remotion" ]; then
  echo "already installed"
else
  (cd "$SKILLS/shorts/remotion" && npm ci --silent --no-audit --no-fund)
fi

# --- ghost-editor: SFX and music library (Mixkit) -------------------------------------------------
log "ghost-editor: SFX and music library"
# Only music and SFX: the animated emoji (optional) list files through api.github.com, which this
# environment refuses (403), and emoji_fetch.py then retries for a long time. Emoji beats fall back to
# the font glyph without them.
if curl -sS -o /dev/null --max-time 15 https://assets.mixkit.co/ 2>/dev/null; then
  python3 "$SKILLS/ghost-editor/scripts/library_restore.py" --music-only
  python3 "$SKILLS/ghost-editor/scripts/library_restore.py" --sfx-only
else
  echo "SKIPPED: assets.mixkit.co is not reachable (the environment's network policy blocks it)."
  echo "Add mixkit.co and assets.mixkit.co to the environment's allowed domains, then run:"
  echo "  python3 $SKILLS/ghost-editor/scripts/library_restore.py"
fi

# --- Self-check ------------------------------------------------------------------------------------
log "Self-check"
yt-dlp --version | sed 's/^/yt-dlp /'
command -v whisper >/dev/null && echo "whisper: $(command -v whisper)"
"$SPY" -c "import faster_whisper, mediapipe; print('shorts venv: faster-whisper', faster_whisper.__version__)"
python3 "$SKILLS/ffmpeg-skill/scripts/check.py" --help >/dev/null && echo "ffmpeg-skill: scripts run"
bash "$SKILLS/ghost-editor/scripts/doctor.sh" 2>&1 | grep -E '^\s*MISS|ok, ' || true

log "Done. ghost-editor's MISS lines for GEMINI_API_KEY and the Mixkit library are expected until you add them."
