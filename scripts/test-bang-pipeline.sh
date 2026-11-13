#!/bin/bash
# ═══════════════════════════════════════════════════════════
# test-bang-pipeline.sh
# Test end-to-end: HTML+GSAP → silent mp4 → gabung VO → final.mp4
#
# Usage:
#   ./test-bang-pipeline.sh [vo_file.wav] [music_file.mp3]
#
# Jika tidak ada VO, generate silent audio sebagai placeholder.
# ═══════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$(dirname "$SCRIPT_DIR")"

VO_FILE="${1:-}"
MUSIC_FILE="${2:-}"

OUT_DIR="$SCRIPT_DIR/test-output"
mkdir -p "$OUT_DIR"

HTML_FILE="$SCRIPT_DIR/demo-bang-motion.html"
SILENT_MP4="$OUT_DIR/visual-silent.mp4"
FINAL_MP4="$OUT_DIR/final-bang-motion.mp4"

DURATION=19.52  # detik — harus sama dengan TIMING.totalDuration di HTML

echo "════════════════════════════════════════"
echo " Bang Motion Pipeline Test"
echo "════════════════════════════════════════"
echo " HTML      : $HTML_FILE"
echo " Duration  : ${DURATION}s"
echo " VO        : ${VO_FILE:-[TIDAK ADA — gunakan silent]}"
echo " Music     : ${MUSIC_FILE:-[TIDAK ADA — tanpa musik]}"
echo "════════════════════════════════════════"

# ── STEP 1: Render HTML → silent MP4 ─────────────────────
echo ""
echo "[STEP 1] Render HTML → silent MP4..."
bash "$SCRIPT_DIR/record-html-to-video.sh" \
  "$HTML_FILE" \
  "$DURATION" \
  "$SILENT_MP4"

# Verifikasi
if [ ! -f "$SILENT_MP4" ]; then
  echo "❌ Gagal: silent MP4 tidak dihasilkan"
  exit 1
fi
VISUAL_DURATION=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$SILENT_MP4")
echo "[STEP 1] ✅ Visual: ${VISUAL_DURATION}s"

# ── STEP 2: Siapkan audio ─────────────────────────────────
echo ""
echo "[STEP 2] Siapkan audio..."

AUDIO_FILTER=""

if [ -n "$VO_FILE" ] && [ -f "$VO_FILE" ]; then
  VO_DURATION=$(ffprobe -v quiet -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$VO_FILE")
  echo "[STEP 2] VO duration : ${VO_DURATION}s"

  if [ -n "$MUSIC_FILE" ] && [ -f "$MUSIC_FILE" ]; then
    echo "[STEP 2] Mix VO + musik..."
    # VO masuk setelah 0.5 detik delay, musik di volume 0.2
    AUDIO_INPUT_ARGS="-i \"$VO_FILE\" -i \"$MUSIC_FILE\""
    AUDIO_FILTER="-filter_complex \"[1:a]adelay=500|500,volume=1.0[vo]; [2:a]volume=0.2,aloop=loop=-1:size=2e+09[bg]; [vo][bg]amix=inputs=2:duration=first[a]\" -map 0:v -map \"[a]\""
  else
    echo "[STEP 2] Hanya VO (tanpa musik)..."
    AUDIO_INPUT_ARGS="-i \"$VO_FILE\""
    AUDIO_FILTER="-filter_complex \"[1:a]adelay=500|500[a]\" -map 0:v -map \"[a]\""
  fi
else
  echo "[STEP 2] Tidak ada VO — generate silence..."
  # Buat 1 detik silence sebagai placeholder
  SILENT_AUDIO="$OUT_DIR/silence.aac"
  ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t "$DURATION" \
    -c:a aac -b:a 128k "$SILENT_AUDIO" -loglevel quiet
  AUDIO_INPUT_ARGS="-i \"$SILENT_AUDIO\""
  AUDIO_FILTER="-map 0:v -map 1:a"
fi

# ── STEP 3: Gabungkan visual + audio ─────────────────────
echo ""
echo "[STEP 3] Gabungkan visual + audio → final.mp4..."

if [ -n "$VO_FILE" ] && [ -f "$VO_FILE" ]; then
  if [ -n "$MUSIC_FILE" ] && [ -f "$MUSIC_FILE" ]; then
    ffmpeg -y \
      -i "$SILENT_MP4" \
      -i "$VO_FILE" \
      -i "$MUSIC_FILE" \
      -filter_complex \
        "[1:a]adelay=500|500,volume=1.0[vo]; \
         [2:a]volume=0.2,aloop=loop=-1:size=2e+09[bg]; \
         [vo][bg]amix=inputs=2:duration=first[a]" \
      -map 0:v \
      -map "[a]" \
      -c:v libx264 -crf 18 -preset slow \
      -pix_fmt yuv420p \
      -c:a aac -b:a 192k \
      -movflags +faststart \
      -t "$DURATION" \
      "$FINAL_MP4" \
      -loglevel warning 2>&1 | grep -v "^$"
  else
    ffmpeg -y \
      -i "$SILENT_MP4" \
      -i "$VO_FILE" \
      -filter_complex "[1:a]adelay=500|500[a]" \
      -map 0:v -map "[a]" \
      -c:v libx264 -crf 18 -preset slow \
      -pix_fmt yuv420p \
      -c:a aac -b:a 192k \
      -movflags +faststart \
      -t "$DURATION" \
      "$FINAL_MP4" \
      -loglevel warning 2>&1 | grep -v "^$"
  fi
else
  SILENT_AUDIO="$OUT_DIR/silence.aac"
  ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t "$DURATION" \
    -c:a aac -b:a 128k "$SILENT_AUDIO" -loglevel quiet
  ffmpeg -y \
    -i "$SILENT_MP4" \
    -i "$SILENT_AUDIO" \
    -map 0:v -map 1:a \
    -c:v libx264 -crf 18 -preset slow \
    -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -t "$DURATION" \
    "$FINAL_MP4" \
    -loglevel warning 2>&1 | grep -v "^$"
fi

# ── STEP 4: Verifikasi output ────────────────────────────
echo ""
echo "[STEP 4] Verifikasi output..."

if [ ! -f "$FINAL_MP4" ]; then
  echo "❌ GAGAL: final.mp4 tidak dihasilkan"
  exit 1
fi

FINAL_DURATION=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$FINAL_MP4")
FINAL_SIZE=$(stat -c%s "$FINAL_MP4")
VIDEO_INFO=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -of default=noprint_wrappers=1 "$FINAL_MP4" 2>/dev/null)
AUDIO_INFO=$(ffprobe -v quiet -select_streams a:0 \
  -show_entries stream=codec_name,bit_rate \
  -of default=noprint_wrappers=1 "$FINAL_MP4" 2>/dev/null)

echo ""
echo "════════════════════════════════════════"
echo " ✅ BERHASIL!"
echo "════════════════════════════════════════"
echo " Output    : $FINAL_MP4"
echo " Duration  : ${FINAL_DURATION}s (target: ${DURATION}s)"
echo " Size      : $(( FINAL_SIZE / 1024 ))KB"
echo " Video     : $VIDEO_INFO"
echo " Audio     : $AUDIO_INFO"
echo ""

# Check sync accuracy (visual duration vs expected)
DIFF=$(echo "scale=3; $FINAL_DURATION - $DURATION" | bc 2>/dev/null || echo "N/A")
echo " Sync diff : ${DIFF}s dari target"
echo "════════════════════════════════════════"
echo ""
echo "File siap di: $FINAL_MP4"
