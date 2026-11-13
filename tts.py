"""
Cartesia TTS — raw HTTP POST, no SDK.
Usage:
    python tts.py "Teks narasi di sini" output.wav
    python tts.py  # uses default transcript, writes output.wav
"""
import json
import os
import sys
import urllib.request
from pathlib import Path


def load_env(path: str = ".env") -> None:
    env_file = Path(path)
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def tts(transcript: str, output_path: str = "output.wav") -> None:
    load_env()

    api_key = os.environ.get("CARTESIA_API_KEY", "")
    if not api_key:
        sys.exit("Error: CARTESIA_API_KEY not set in environment or .env")

    payload = json.dumps({
        "model_id": "sonic-3.6",
        "transcript": transcript,
        "voice": "9076f14a-5602-48a7-bfd1-67ef9b40dd6d",
        "output_format": {
            "container": "wav",
            "encoding": "pcm_s16le",
            "sample_rate": 44100,
        },
        "generation_config": {
            "speed": 1,
            "volume": 1,
        },
    }).encode()

    req = urllib.request.Request(
        "https://api.cartesia.ai/tts/bytes",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "Cartesia-Version": "2026-08-14",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        audio_bytes = resp.read()

    Path(output_path).write_bytes(audio_bytes)
    print(f"Saved {len(audio_bytes):,} bytes → {output_path}")


if __name__ == "__main__":
    _transcript = sys.argv[1] if len(sys.argv) > 1 else (
        "Hi, thanks for calling Cartesia. How can I help you today?"
    )
    _output = sys.argv[2] if len(sys.argv) > 2 else "output.wav"
    tts(_transcript, _output)
