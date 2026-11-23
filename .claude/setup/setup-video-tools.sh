#!/usr/bin/env bash
# Installs the tools used by the video skills in .claude/skills on a fresh Claude Code cloud session:
#   - yt-dlp, OpenAI Whisper (CPU-only PyTorch), OpenCV, google-genai, numpy, pillow (system python3)
#   - ghost-editor: linked to ~/.claude/skills/ghost-editor (the path its scripts use); its Mixkit SFX and
#     music library when mixkit.co and assets.mixkit.co are in the environment's allowed domains
#   - ffmpeg-skill: linked to ~/.claude/skills/ffmpeg-skill (stdlib only, nothing to install)
#   - explainroo (npx, pinned): voice runtime and models for English and Brazilian Portuguese
#   - lemo-opuscar: its style library in ~/lemo-opuscar, the core packages, and ffmpeg 9 in /opt/ffmpeg9/bin
#     (from the imageio-ffmpeg wheel on PyPI; only lemo-opuscar puts it on PATH, the system ffmpeg stays 6.1)
#   - openmontage: the OpenMontage project cloned to ~/OpenMontage (pinned) and its `make setup`
#   - claude-3d-animated-shorts: engine node_modules, three.js rigs and fonts (Poly Haven props when reachable)
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
EXPLAINROO_VER="0.6.2"
OPENMONTAGE_REPO="https://github.com/OpenMontageInc/OpenMontage.git"
OPENMONTAGE_REF="2e003e65fa99a0f329478a2c1cdcf26bc481933a"
OPENMONTAGE_DIR="$HOME/OpenMontage"
# ffmpeg 9 for lemo-opuscar (its mux.sh needs ffmpeg 7+; Ubuntu ships 6.1)
FFMPEG9_DIR="/opt/ffmpeg9/bin"
IIO_FFMPEG_VER="0.8.1"
IIO_FFMPEG_SHA256="050d6850601c3b3890bd2b28306f3b842b3daea390a561101174375a1c460bda"
# shorts venv: Python 3.12, because its scripts use mediapipe's legacy mp.solutions API (gone in
# mediapipe >= 0.10.30, and 0.10.21 has no Python 3.13 wheel), and PyAV < 17 (faster-whisper 1.2.1
# passes metadata_errors=, which PyAV 19 removed).
SHORTS_PY="${SHORTS_PY:-python3.12}"
FASTER_WHISPER_VER="1.2.1"
MEDIAPIPE_VER="0.10.21"
SHORTS_AV_VER="16.1.0"
SHORTS_OPENCV_VER="4.11.0.86"
SHORTS_NUMPY_VER="1.26.4"
# Remotion downloads its own Chrome from remotion.media (blocked here); use the preinstalled one.
HEADLESS_SHELL="$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)"

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
command -v "$SHORTS_PY" >/dev/null || { echo "$SHORTS_PY is required for the shorts venv"; exit 1; }
want_minor="$("$SHORTS_PY" -c 'import sys;print(sys.version_info[:2])')"
if [ -x "$SHORTS_VENV/bin/python3" ] && [ "$("$SHORTS_VENV/bin/python3" -c 'import sys;print(sys.version_info[:2])')" != "$want_minor" ]; then
  echo "existing venv uses another Python; moving it to $SHORTS_VENV.old"
  rm -rf "$SHORTS_VENV.old" && mv "$SHORTS_VENV" "$SHORTS_VENV.old"
fi
[ -x "$SHORTS_VENV/bin/python3" ] || "$SHORTS_PY" -m venv "$SHORTS_VENV"
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
has_ver "$SPY" av "$SHORTS_AV_VER" || NEED+=("av==$SHORTS_AV_VER")
has_ver "$SPY" opencv-python "$SHORTS_OPENCV_VER" || NEED+=("opencv-python==$SHORTS_OPENCV_VER")
has_ver "$SPY" numpy "$SHORTS_NUMPY_VER" || NEED+=("numpy==$SHORTS_NUMPY_VER")
if [ ${#NEED[@]} -gt 0 ]; then
  pip_q "$SPY" -m pip install --extra-index-url "$TORCH_INDEX" "${NEED[@]}"
else
  echo "faster-whisper, mediapipe, av, opencv, numpy: already installed"
fi

log "shorts: Remotion node_modules"
if [ -d "$SKILLS/shorts/remotion/node_modules/remotion" ]; then
  echo "already installed"
else
  (cd "$SKILLS/shorts/remotion" && npm ci --silent --no-audit --no-fund)
fi

# --- lemo-opuscar: style library + core packages --------------------------------------------------
log "lemo-opuscar: library in ~/lemo-opuscar"
if [ -x "$FFMPEG9_DIR/ffmpeg" ]; then
  echo "ffmpeg 9: already installed ($("$FFMPEG9_DIR/ffmpeg" -version | head -1 | cut -d' ' -f3))"
else
  W="$(mktemp -d)"
  python3 -m pip download --quiet --no-deps --disable-pip-version-check -d "$W" "imageio-ffmpeg==$IIO_FFMPEG_VER"
  WHL="$(ls "$W"/imageio_ffmpeg-*manylinux*x86_64.whl)"
  echo "$IIO_FFMPEG_SHA256  $WHL" | sha256sum -c --quiet
  python3 -m zipfile -e "$WHL" "$W/x"
  mkdir -p "$FFMPEG9_DIR"
  cp "$W"/x/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v* "$FFMPEG9_DIR/ffmpeg"
  chmod +x "$FFMPEG9_DIR/ffmpeg"
  rm -rf "$W"
  echo "ffmpeg 9: $("$FFMPEG9_DIR/ffmpeg" -version | head -1 | cut -d' ' -f3)"
fi
PATH="$FFMPEG9_DIR:$PATH" sh "$SKILLS/lemo-opuscar/scripts/setup.sh" | tail -2
PATH="$FFMPEG9_DIR:$PATH" sh "$SKILLS/lemo-opuscar/scripts/setup.sh" deps | tail -3

# --- claude-3d-animated-shorts: engine packages + third-party assets ------------------------------
log "claude-3d-animated-shorts: engine"
E3D="$SKILLS/claude-3d-animated-shorts/engine"
[ -d "$E3D/node_modules/three" ] && echo "node_modules: already installed" \
  || (cd "$E3D" && npm ci --silent --no-audit --no-fund)
if [ -s "$E3D/assets/rigs/Xbot.glb" ] && [ -s "$E3D/film/Anton.ttf" ] && [ -d "$E3D/assets/props/polyhaven" ]; then
  echo "assets: already downloaded"
else
  # The Poly Haven office props need api.polyhaven.com and dl.polyhaven.org in the allowed domains;
  # without them the rigs and fonts still download and the office set has no props.
  bash "$SKILLS/claude-3d-animated-shorts/scripts/fetch-assets.sh" \
    || echo "SKIPPED: Poly Haven office props (allow api.polyhaven.com and dl.polyhaven.org, then rerun)"
fi

# --- openmontage: project in ~/OpenMontage -------------------------------------------------------
log "openmontage: $OPENMONTAGE_DIR"
[ -d "$OPENMONTAGE_DIR/.git" ] || git clone -q "$OPENMONTAGE_REPO" "$OPENMONTAGE_DIR"
if [ "$(git -C "$OPENMONTAGE_DIR" rev-parse HEAD)" != "$OPENMONTAGE_REF" ]; then
  git -C "$OPENMONTAGE_DIR" fetch -q origin "$OPENMONTAGE_REF" 2>/dev/null || git -C "$OPENMONTAGE_DIR" fetch -q origin
  git -C "$OPENMONTAGE_DIR" checkout -q "$OPENMONTAGE_REF"
fi
if [ -x "$OPENMONTAGE_DIR/.venv/bin/python" ] && [ -d "$OPENMONTAGE_DIR/remotion-composer/node_modules" ]; then
  echo "already set up"
else
  make -C "$OPENMONTAGE_DIR" setup | tail -4
fi
# Remotion would download its own Chrome from remotion.media (blocked here): a local, untracked
# remotion.config.ts points its CLI at the preinstalled Chrome Headless Shell.
if [ -n "$HEADLESS_SHELL" ] && ! git -C "$OPENMONTAGE_DIR" ls-files --error-unmatch remotion-composer/remotion.config.ts >/dev/null 2>&1; then
  printf '%s\n' \
    '// Local, untracked: use the preinstalled Chrome Headless Shell (remotion.media is not reachable here).' \
    '// Written by setup-video-tools.sh.' \
    'import { Config } from "@remotion/cli/config";' \
    '' \
    "Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE || \"$HEADLESS_SHELL\");" \
    > "$OPENMONTAGE_DIR/remotion-composer/remotion.config.ts"
  echo "remotion.config.ts -> $HEADLESS_SHELL"
fi

# --- explainroo: npm package + voice runtime and models (English + Brazilian Portuguese) ----------
log "explainroo $EXPLAINROO_VER"
# espeak-ng: the Kokoro voice needs it for Brazilian Portuguese (and es, fr, it, hi)
command -v espeak-ng >/dev/null || { apt-get install -y -q espeak-ng >/dev/null 2>&1 \
  || { apt-get update -q >/dev/null && apt-get install -y -q espeak-ng >/dev/null; }; }
npx --yes "explainroo@$EXPLAINROO_VER" doctor --fetch >/dev/null
npx --yes "explainroo@$EXPLAINROO_VER" doctor --fetch --language pt-br | grep -E '^(ready|missing)' || true

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
"$SPY" -c "import faster_whisper, mediapipe as mp; mp.solutions.face_detection; print('shorts venv: faster-whisper', faster_whisper.__version__, '+ mediapipe', mp.__version__)"
if [ -n "$HEADLESS_SHELL" ]; then
  echo "shorts render: export REMOTION_BROWSER_EXECUTABLE=$HEADLESS_SHELL"
else
  echo "shorts render: no preinstalled Chrome Headless Shell found; Remotion will try to download one"
fi
python3 "$SKILLS/ffmpeg-skill/scripts/check.py" --help >/dev/null && echo "ffmpeg-skill: scripts run"
bash "$SKILLS/ghost-editor/scripts/doctor.sh" 2>&1 | grep -E '^\s*MISS|ok, ' || true

log "Done. ghost-editor's MISS lines for GEMINI_API_KEY and the Mixkit library are expected until you add them."
