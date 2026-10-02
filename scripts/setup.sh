#!/usr/bin/env bash
# Installs everything the studio needs. Safe to run more than once.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund
fi

# Headless Chromium for Playwright (cloud sessions already have one in /opt/pw-browsers).
if [ ! -d /opt/pw-browsers ]; then
  npx playwright install chromium >/dev/null
fi

# Python: python3 on Mac/Linux; on Windows it may be "python" or "py" (python3 can be a Store stub).
PY=""
for c in python3 python py; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys; assert sys.version_info >= (3, 9)" 2>/dev/null; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "Python 3 not found: install it from https://www.python.org/downloads/ (tick 'Add to PATH')"
elif ! "$PY" -c "import librosa" 2>/dev/null; then
  "$PY" -m pip install --quiet -r requirements.txt
fi

if ! command -v ffmpeg >/dev/null 2>&1 && ! command -v apt-get >/dev/null 2>&1; then
  echo "ffmpeg not installed: Windows 'winget install Gyan.FFmpeg', Mac 'brew install ffmpeg'"
fi
if ! command -v ffmpeg >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
  (apt-get install -y -qq ffmpeg || (apt-get update -qq && apt-get install -y -qq ffmpeg)) >/dev/null 2>&1 \
    || echo "ffmpeg not installed: install it (brew install ffmpeg / apt install ffmpeg)"
fi

# rubberband: time-stretch used by tools/music-bars.py to lock a song onto the film's beat grid.
if ! command -v rubberband >/dev/null 2>&1 && ! command -v apt-get >/dev/null 2>&1; then
  echo "rubberband not installed (only needed to fit songs): https://breakfastquay.com/rubberband/ or 'brew install rubberband'"
fi
if ! command -v rubberband >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
  (apt-get install -y -qq rubberband-cli || (apt-get update -qq && apt-get install -y -qq rubberband-cli)) >/dev/null 2>&1 \
    || echo "rubberband not installed: install it (brew install rubberband / apt install rubberband-cli)"
fi

# Hand-drawn animation plugin (claude-animation): its one npm dependency.
for dir in "$HOME"/.claude/plugins/cache/claude-animation-skill/claude-animation/*/skills/claude-animation; do
  if [ -f "$dir/package.json" ] && [ ! -d "$dir/node_modules" ]; then
    (cd "$dir" && npm install --no-audit --no-fund >/dev/null 2>&1) || echo "claude-animation: npm install failed"
  fi
done

# Cloud sessions: headless Chromium reads its own trust store (NSS), not the system one, so
# add the session proxy's CA there. Without it the browser can't open any HTTPS site.
if [ -f /root/.ccr/agent-proxy-ca.crt ]; then
  command -v certutil >/dev/null 2>&1 || (apt-get install -y -qq libnss3-tools >/dev/null 2>&1 \
    || (apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq libnss3-tools >/dev/null 2>&1)) || true
  if command -v certutil >/dev/null 2>&1; then
    mkdir -p "$HOME/.pki/nssdb"
    [ -f "$HOME/.pki/nssdb/cert9.db" ] || certutil -d "sql:$HOME/.pki/nssdb" -N --empty-password
    certutil -d "sql:$HOME/.pki/nssdb" -L -n ccr-agent-proxy >/dev/null 2>&1 \
      || certutil -d "sql:$HOME/.pki/nssdb" -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt
  fi
fi
