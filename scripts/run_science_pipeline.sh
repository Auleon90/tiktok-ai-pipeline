#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# run_science_pipeline.sh
# AI Team Agency — Science × Islam TikTok Content Pipeline
#
# Flow:
#  1. [AI] Generate 3 topik ideas (atau terima topik dari argumen)
#  2. [PAUSE] User pilih/konfirmasi topik
#  3. [AI] Generate storyboard JSON
#  4. [PAUSE] User review & approve storyboard  ← wajib
#  5. [AI] Generate voiceover via Cartesia
#  6. [AI] Inject storyboard → HTML animation
#  7. [AI] Record HTML → silent MP4 (60s+)
#  8. [AI] Mix VO + backsound → final.mp4
#  9. [PAUSE] User review final video
# 10. [OUTPUT] final.mp4 siap publish
#
# Usage:
#   ./run_science_pipeline.sh                        # interaktif, generate ideas dulu
#   ./run_science_pipeline.sh "Otak Manusia"         # topik langsung, tapi masih minta approval storyboard
#   ./run_science_pipeline.sh "Otak Manusia" --skip-ideas  # skip ideas step
#
# Flags:
#   --skip-ideas         Skip idea generation, langsung ke storyboard
#   --storyboard PATH    Gunakan storyboard yang sudah ada (skip generate)
#   --vo PATH            Gunakan VO yang sudah ada (skip generate)
#   --no-review          Skip review step (langsung output final)
#   --dry-run            Hanya sampai storyboard, jangan render video
#
# Env vars diperlukan:
#   CARTESIA_API_KEY     — untuk voiceover
#   ANTHROPIC_API_KEY    — untuk generate storyboard
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$PIPELINE_DIR/templates"
STORYBOARDS_DIR="$PIPELINE_DIR/storyboards"
ASSETS_DIR="$PIPELINE_DIR/assets"

# ── Parse arguments ──────────────────────────────────────────────────
TOPIC="${1:-}"
SKIP_IDEAS=false
STORYBOARD_PATH=""
VO_PATH=""
NO_REVIEW=false
DRY_RUN=false

shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-ideas)   SKIP_IDEAS=true ;;
    --storyboard)   STORYBOARD_PATH="$2"; shift ;;
    --vo)           VO_PATH="$2"; shift ;;
    --no-review)    NO_REVIEW=true ;;
    --dry-run)      DRY_RUN=true ;;
    *) echo "⚠ Unknown flag: $1" ;;
  esac
  shift
done

# ── Helpers ──────────────────────────────────────────────────────────
DATE_TAG=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="$PIPELINE_DIR/output/$DATE_TAG"
mkdir -p "$OUTPUT_DIR"

LOG_FILE="$OUTPUT_DIR/pipeline.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   AI Team Agency — Science × Islam Pipeline          ║"
echo "║   $(date +"%Y-%m-%d %H:%M:%S")                             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

check_env() {
  local missing=0
  if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -z "$STORYBOARD_PATH" ]; then
    echo "❌ ANTHROPIC_API_KEY tidak diset (diperlukan untuk generate storyboard)"
    missing=1
  fi
  if [ -z "${CARTESIA_API_KEY:-}" ] && [ -z "$VO_PATH" ]; then
    echo "⚠  CARTESIA_API_KEY tidak diset — VO generation akan dilewati"
    echo "   Set dengan: export CARTESIA_API_KEY=your_key"
  fi
  if [ $missing -eq 1 ]; then exit 1; fi
}

pause_for_approval() {
  local msg="$1"
  echo ""
  echo "──────────────────────────────────────────────────────"
  echo "  ⏸  APPROVAL REQUIRED"
  echo "  $msg"
  echo "──────────────────────────────────────────────────────"
  read -p "  Lanjutkan? [y/N/skip]: " choice
  case "$choice" in
    y|Y) echo "  ✅ Approved. Melanjutkan..." ;;
    s|S|skip) echo "  ⏭ Skipped."; return 1 ;;
    *) echo "  ❌ Dibatalkan."; exit 1 ;;
  esac
  echo ""
}

show_storyboard_preview() {
  local sb_path="$1"
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│  STORYBOARD PREVIEW                                  │"
  echo "├─────────────────────────────────────────────────────┤"
  python3 -c "
import json, sys
sb = json.load(open('$sb_path'))
print(f'│  Topic    : {sb.get(\"topic\", \"\")}')
print(f'│  Duration : {sb.get(\"total_duration\", 64)}s')
print('│')
print(f'│  HOOK     : {str(sb.get(\"hook\",\"\"))[:65]}')
print(f'│  Fact 1   : {sb.get(\"science_facts\",[\"?\"])[0][:60]}')
print(f'│  Fact 2   : {(sb.get(\"science_facts\",[]) + [\"?\"])[1][:60]}')
print(f'│  Fact 3   : {(sb.get(\"science_facts\",[]) + [\"?\",\"?\"])[2][:60]}')
print('│')
print(f'│  Arabic   : {str(sb.get(\"islamic\",{}).get(\"arabic\",\"\"))[:60]}')
print(f'│  Source   : {sb.get(\"islamic\",{}).get(\"source\",\"\")}')
print('│')
print(f'│  Reflect  : {str(sb.get(\"reflection\",\"\"))[:65]}')
print(f'│  CTA      : {str(sb.get(\"cta\",\"\"))[:65]}')
print('│')
print(f'│  Narration: {str(sb.get(\"narration_full\",\"\"))[:80]}...')
print('└─────────────────────────────────────────────────────┘')
" 2>/dev/null || cat "$sb_path" | head -50
  echo ""
}

# ── STEP 1: Check environment ─────────────────────────────────────────
echo "[STEP 1/8] Checking environment..."
check_env

# ── STEP 2: Ideas generation ──────────────────────────────────────────
if [ -z "$STORYBOARD_PATH" ]; then
  if [ -z "$TOPIC" ] && [ "$SKIP_IDEAS" = false ]; then
    echo ""
    echo "[STEP 2/8] Generating 3 topic ideas..."
    IDEAS_PATH="$STORYBOARDS_DIR/ideas_$DATE_TAG.json"
    python3 "$SCRIPT_DIR/generate_storyboard.py" --ideas-only --output "$IDEAS_PATH" 2>&1
    echo ""
    echo "── Top 3 Ideas ──────────────────────────────────────"
    python3 -c "
import json
ideas = json.load(open('$IDEAS_PATH'))
for i, idea in enumerate(ideas, 1):
    print(f'  [{i}] {idea.get(\"topik\",\"?\")}')
    print(f'      Hook: {idea.get(\"hook_preview\",\"\")[:70]}')
    print(f'      Ayat: {idea.get(\"ayat_terkait\",\"\")}')
    print(f'      Potensi: {idea.get(\"estimasi_views\",\"?\")}')
    print()
" 2>/dev/null
    echo "──────────────────────────────────────────────────────"
    read -p "Pilih topik (1/2/3) atau ketik topik sendiri: " topic_choice
    case "$topic_choice" in
      1|2|3)
        TOPIC=$(python3 -c "
import json
ideas = json.load(open('$IDEAS_PATH'))
print(ideas[int('$topic_choice')-1].get('topik',''))
" 2>/dev/null)
        ;;
      *) TOPIC="$topic_choice" ;;
    esac
    echo "✅ Topik dipilih: $TOPIC"
  fi

# ── STEP 3: Generate storyboard ──────────────────────────────────────
  echo ""
  echo "[STEP 3/8] Generating storyboard for: '$TOPIC'..."
  STORYBOARD_PATH="$STORYBOARDS_DIR/science_${DATE_TAG}.json"
  python3 "$SCRIPT_DIR/generate_storyboard.py" "$TOPIC" --output "$STORYBOARD_PATH"
fi

# ── STEP 4: Storyboard approval ───────────────────────────────────────
echo ""
echo "[STEP 4/8] Storyboard approval..."
show_storyboard_preview "$STORYBOARD_PATH"

if [ "$DRY_RUN" = true ]; then
  echo "🧪 DRY RUN — stopping here. Storyboard saved: $STORYBOARD_PATH"
  exit 0
fi

pause_for_approval "Review storyboard di atas. Lanjut generate VO + render?"

# ── STEP 5: Generate voiceover ────────────────────────────────────────
echo "[STEP 5/8] Generating voiceover..."
VO_OUTPUT="$OUTPUT_DIR/vo.mp3"

if [ -n "$VO_PATH" ] && [ -f "$VO_PATH" ]; then
  echo "   Using existing VO: $VO_PATH"
  cp "$VO_PATH" "$VO_OUTPUT"
elif [ -n "${CARTESIA_API_KEY:-}" ]; then
  python3 "$SCRIPT_DIR/generate_vo.py" "$STORYBOARD_PATH" --output "$VO_OUTPUT" --speed 0.9
else
  echo "   ⚠ CARTESIA_API_KEY tidak diset — menggunakan silence placeholder"
  VO_DURATION=$(python3 -c "import json; print(json.load(open('$STORYBOARD_PATH')).get('total_duration',64))")
  ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t "$VO_DURATION" \
    -c:a aac -b:a 128k "$VO_OUTPUT" -loglevel quiet
fi
echo "   ✅ VO: $VO_OUTPUT"

# ── STEP 6: Inject storyboard → HTML ──────────────────────────────────
echo ""
echo "[STEP 6/8] Injecting storyboard into HTML template..."
HTML_OUTPUT="$OUTPUT_DIR/animation.html"
python3 "$SCRIPT_DIR/inject_storyboard.py" \
  "$STORYBOARD_PATH" \
  --template "$TEMPLATES_DIR/science_60s.html" \
  --output "$HTML_OUTPUT"
echo "   ✅ HTML: $HTML_OUTPUT"

# ── STEP 7: Record HTML → silent MP4 ─────────────────────────────────
echo ""
echo "[STEP 7/8] Recording HTML animation (60s+)..."
SILENT_MP4="$OUTPUT_DIR/visual_silent.mp4"
DURATION=$(python3 -c "import json; print(json.load(open('$STORYBOARD_PATH')).get('total_duration',64))")

bash "$SCRIPT_DIR/record-html-to-video.sh" "$HTML_OUTPUT" "$DURATION" "$SILENT_MP4"
echo "   ✅ Silent MP4: $SILENT_MP4"

# ── STEP 8: Mix VO + backsound → final.mp4 ───────────────────────────
echo ""
echo "[STEP 8/8] Mixing VO + backsound → final MP4..."
FINAL_MP4="$OUTPUT_DIR/final_$(python3 -c "import json,re; t=json.load(open('$STORYBOARD_PATH')).get('topic','video'); print(re.sub(r'[^a-zA-Z0-9]','_',t)[:30])").mp4"

BACKSOUND="$PIPELINE_DIR/assets/backsound.mp3"
if [ ! -f "$BACKSOUND" ]; then
  BACKSOUND="$PIPELINE_DIR/remotion/public/backsound.mp3"
fi

if [ -f "$BACKSOUND" ]; then
  echo "   Backsound: $BACKSOUND"
  ffmpeg -y \
    -i "$SILENT_MP4" \
    -i "$VO_OUTPUT" \
    -i "$BACKSOUND" \
    -filter_complex \
      "[1:a]adelay=500|500,volume=1.0[vo]; \
       [2:a]volume=0.18,aloop=loop=-1:size=2e+09[bg]; \
       [vo][bg]amix=inputs=2:duration=first[a]" \
    -map 0:v \
    -map "[a]" \
    -c:v libx264 -crf 18 -preset slow \
    -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    -t "$DURATION" \
    "$FINAL_MP4" \
    -loglevel warning
else
  echo "   ⚠ Backsound tidak ditemukan — VO saja"
  ffmpeg -y \
    -i "$SILENT_MP4" \
    -i "$VO_OUTPUT" \
    -filter_complex "[1:a]adelay=500|500[a]" \
    -map 0:v -map "[a]" \
    -c:v libx264 -crf 18 -preset slow \
    -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    -t "$DURATION" \
    "$FINAL_MP4" \
    -loglevel warning
fi

# ── Review & Summary ──────────────────────────────────────────────────
echo ""
FILESIZE=$(stat -c%s "$FINAL_MP4" 2>/dev/null || echo 0)
FINAL_DUR=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$FINAL_MP4" 2>/dev/null || echo "?")
VID_INFO=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -of default=noprint_wrappers=1 "$FINAL_MP4" 2>/dev/null || echo "?")

echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ PIPELINE SELESAI                                 ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Final MP4   : $FINAL_MP4"
echo "║  Duration    : ${FINAL_DUR}s (target: ${DURATION}s)"
echo "║  Size        : $(( ${FILESIZE:-0} / 1024 ))KB"
echo "║  Video       : $VID_INFO"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📁 Output dir  : $OUTPUT_DIR"
echo "📄 Storyboard  : $STORYBOARD_PATH"
echo "🎙  Voiceover   : $VO_OUTPUT"
echo "🎬 Final video : $FINAL_MP4"
echo ""

if [ "$NO_REVIEW" = false ]; then
  echo "──────────────────────────────────────────────────────"
  echo "  ⏸  FINAL REVIEW"
  echo "  Cek video: $FINAL_MP4"
  echo "  (copy path di atas untuk buka di video player)"
  echo "──────────────────────────────────────────────────────"
  read -p "  Video sudah bagus? Ready to post? [y/N]: " final_choice
  case "$final_choice" in
    y|Y) echo "  ✅ APPROVED — video siap publish!" ;;
    *) echo "  📝 Noted — tandai untuk revisi." ;;
  esac
fi

echo ""
echo "Pipeline log: $LOG_FILE"
