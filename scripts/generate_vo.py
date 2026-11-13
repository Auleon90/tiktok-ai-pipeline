#!/usr/bin/env python3
"""
Generate Voiceover (VO) using Cartesia API.
Reads narration_full from storyboard JSON → outputs .mp3

Usage:
  python generate_vo.py storyboards/science_xxx.json --output output/vo.mp3
  python generate_vo.py --text "teks narasi langsung" --output output/vo.mp3

Env vars:
  CARTESIA_API_KEY    — required
  CARTESIA_VOICE_ID   — optional (default: Bahasa Indonesia male voice)
"""
import json, sys, os, argparse
from pathlib import Path

# Cartesia sonic-2 Indonesian male voices (from their voice library)
# Deep, calm, authoritative — cocok untuk konten renungan islami
DEFAULT_VOICE_ID = "b7d50908-b17c-442d-ad8d-810c63997ed9"  # Indonesian Male Deep

def generate_voiceover(text: str, output_path: str,
                       voice_id: str = None,
                       speed: float = 0.9) -> None:
    try:
        import httpx
    except ImportError:
        print("❌ Install httpx: pip install httpx")
        sys.exit(1)

    api_key = os.environ.get("CARTESIA_API_KEY", "")
    if not api_key:
        print("❌ CARTESIA_API_KEY tidak ditemukan")
        print("   Set dengan: export CARTESIA_API_KEY=your_key")
        sys.exit(1)

    voice_id = voice_id or os.environ.get("CARTESIA_VOICE_ID", DEFAULT_VOICE_ID)

    payload = {
        "model_id": "sonic-2",
        "transcript": text,
        "voice": {
            "mode": "id",
            "id": voice_id,
        },
        "output_format": {
            "container": "mp3",
            "encoding": "mp3",
            "sample_rate": 44100,
        },
        "language": "id",
    }

    # speed via voice_experimental if supported
    if speed != 1.0:
        payload["_experimental"] = {"speed": speed}

    headers = {
        "X-API-Key": api_key,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json",
    }

    print(f"[VO] Voice ID  : {voice_id}")
    print(f"[VO] Text len  : {len(text)} chars")
    print(f"[VO] Speed     : {speed}x")
    print(f"[VO] Calling Cartesia API...")

    with httpx.Client(timeout=180) as client:
        response = client.post(
            "https://api.cartesia.ai/tts/bytes",
            json=payload,
            headers=headers
        )
        if response.status_code != 200:
            print(f"❌ Cartesia API error {response.status_code}: {response.text[:300]}")
            sys.exit(1)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_path).write_bytes(response.content)

    size_kb = len(response.content) // 1024
    print(f"[VO] ✅ Saved: {output_path} ({size_kb}KB)")

    # Get duration via ffprobe if available
    import subprocess
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", output_path],
            capture_output=True, text=True
        )
        dur = float(result.stdout.strip())
        print(f"[VO] Duration  : {dur:.1f}s")
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="Generate Cartesia voiceover")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("storyboard", nargs="?", default=None,
                       help="Path ke storyboard JSON")
    group.add_argument("--text", default=None,
                       help="Teks narasi langsung (alternatif storyboard)")
    parser.add_argument("--output", required=True,
                        help="Output .mp3 path")
    parser.add_argument("--voice-id", default=None,
                        help="Cartesia voice ID (override default)")
    parser.add_argument("--speed", type=float, default=0.9,
                        help="Kecepatan bicara 0.7-1.3 (default 0.9 = sedikit lebih lambat)")
    args = parser.parse_args()

    if args.text:
        narration = args.text
    else:
        sb_path = args.storyboard
        if not sb_path or not Path(sb_path).exists():
            print(f"❌ File tidak ditemukan: {sb_path}")
            sys.exit(1)
        sb = json.loads(Path(sb_path).read_text())
        narration = sb.get("narration_full", "").strip()
        if not narration:
            print("❌ narration_full tidak ditemukan atau kosong di storyboard")
            sys.exit(1)
        print(f"[VO] Storyboard : {sb.get('id', 'unknown')}")
        print(f"[VO] Topic      : {sb.get('topic', 'unknown')}")

    print(f"\n[VO] Narration preview:")
    print(f"     {narration[:200]}...")
    print()

    generate_voiceover(narration, args.output, args.voice_id, args.speed)

if __name__ == "__main__":
    main()
