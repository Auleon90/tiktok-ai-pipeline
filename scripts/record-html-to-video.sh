#!/bin/bash
# ═══════════════════════════════════════════════════════════
# record-html-to-video.sh
# Render HTML+GSAP animation ke silent MP4 via Xvfb + Chrome
#
# Usage:
#   ./record-html-to-video.sh <html_file> <duration_seconds> <output.mp4>
#
# Requires: Xvfb, google-chrome, ffmpeg
# Output: silent MP4, 1080x1920, 30fps, H.264
# ═══════════════════════════════════════════════════════════

set -euo pipefail

HTML_FILE="${1:-}"
DURATION="${2:-15}"
OUTPUT="${3:-output.mp4}"

if [ -z "$HTML_FILE" ]; then
  echo "Usage: $0 <html_file> <duration_seconds> <output.mp4>"
  exit 1
fi

# Konversi ke absolute path
HTML_FILE=$(realpath "$HTML_FILE")
OUTPUT=$(realpath "$OUTPUT")

DISPLAY_NUM=:$(( RANDOM % 500 + 100 ))
LOG_DIR="/tmp/bang-motion-$$"
CHROME_PROFILE="/tmp/chrome-notranslate-$$"
mkdir -p "$LOG_DIR"

# Pre-configure Chrome profile: matikan translate & notifikasi
mkdir -p "$CHROME_PROFILE/Default"
cat > "$CHROME_PROFILE/Default/Preferences" << 'PREFS'
{
  "translate": {"enabled": false},
  "translate_site_blacklist": [],
  "profile": {"default_content_setting_values": {"notifications": 2}},
  "browser": {"show_home_button": false},
  "translate_blocked_languages": ["id"],
  "translate_whitelists": {}
}
PREFS

echo "[record] HTML      : $HTML_FILE"
echo "[record] Duration  : ${DURATION}s"
echo "[record] Output    : $OUTPUT"
echo "[record] Display   : $DISPLAY_NUM"

# ── 1. Start virtual display ──────────────────────────────
Xvfb "$DISPLAY_NUM" \
  -screen 0 1080x1920x24 \
  -ac \
  -nolisten tcp \
  > "$LOG_DIR/xvfb.log" 2>&1 &
XVFB_PID=$!
echo "[record] Xvfb PID  : $XVFB_PID"
sleep 0.8  # tunggu Xvfb ready

# ── 2. Launch Chrome di display virtual ───────────────────
DISPLAY="$DISPLAY_NUM" google-chrome \
  --no-sandbox \
  --no-first-run \
  --disable-gpu \
  --disable-infobars \
  --disable-extensions \
  --disable-background-networking \
  --disable-background-timer-throttling \
  --disable-sync \
  --disable-translate \
  --disable-features=TranslateUI,Translate \
  --lang=id \
  --accept-lang=id \
  --window-size=1080,1920 \
  --window-position=0,0 \
  --user-data-dir=/tmp/chrome-notranslate-$$ \
  --app="file://${HTML_FILE}" \
  > "$LOG_DIR/chrome.log" 2>&1 &
CHROME_PID=$!
echo "[record] Chrome PID: $CHROME_PID"
sleep 1.5  # tunggu Chrome load + animasi mulai

# ── 2b. Sembunyikan kursor mouse (pindahkan ke luar layar) ─
# Gunakan xdotool jika tersedia, fallback ke xwarppointer
if command -v xdotool &>/dev/null; then
  DISPLAY="$DISPLAY_NUM" xdotool mousemove 1200 2200 2>/dev/null || true
elif command -v xwarppointer &>/dev/null; then
  DISPLAY="$DISPLAY_NUM" xwarppointer None root 0 0 0 0 1200 2200 2>/dev/null || true
fi
# Tambahan: unclutter untuk hide cursor saat idle (jika tersedia)
if command -v unclutter &>/dev/null; then
  DISPLAY="$DISPLAY_NUM" unclutter -idle 0 -root &
  UNCLUTTER_PID=$!
else
  UNCLUTTER_PID=""
fi

# ── 3. Record dengan ffmpeg x11grab ───────────────────────
# +1 detik buffer setelah durasi
RECORD_DURATION=$(echo "$DURATION + 0.5" | bc)

echo "[record] Recording ${RECORD_DURATION}s..."
DISPLAY="$DISPLAY_NUM" ffmpeg -y \
  -f x11grab \
  -video_size 1080x1920 \
  -framerate 30 \
  -i "$DISPLAY_NUM".0+0,0 \
  -t "$RECORD_DURATION" \
  -c:v libx264 \
  -preset ultrafast \
  -pix_fmt yuv420p \
  -crf 20 \
  "$OUTPUT" \
  > "$LOG_DIR/ffmpeg.log" 2>&1

EXIT_CODE=$?

# ── 4. Cleanup ────────────────────────────────────────────
echo "[record] Cleaning up..."
[ -n "${UNCLUTTER_PID:-}" ] && kill "$UNCLUTTER_PID" 2>/dev/null || true
kill "$CHROME_PID" 2>/dev/null || true
kill "$XVFB_PID" 2>/dev/null || true
sleep 0.3
kill -9 "$CHROME_PID" 2>/dev/null || true
kill -9 "$XVFB_PID" 2>/dev/null || true

if [ "$EXIT_CODE" -eq 0 ] && [ -f "$OUTPUT" ]; then
  FILESIZE=$(stat -c%s "$OUTPUT")
  DURATION_OUT=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null || echo "unknown")
  echo "[record] ✅ Done!"
  echo "[record] Output    : $OUTPUT"
  echo "[record] Size      : $(( FILESIZE / 1024 ))KB"
  echo "[record] Duration  : ${DURATION_OUT}s"
else
  echo "[record] ❌ FAILED (exit $EXIT_CODE)"
  echo "[record] Chrome log:"
  cat "$LOG_DIR/chrome.log" | tail -20
  echo "[record] FFmpeg log:"
  cat "$LOG_DIR/ffmpeg.log" | tail -20
  rm -rf "$LOG_DIR" "$CHROME_PROFILE"
  exit 1
fi

rm -rf "$LOG_DIR" "$CHROME_PROFILE"
