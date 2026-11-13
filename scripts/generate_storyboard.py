#!/usr/bin/env python3
"""
Generate storyboard JSON using Claude API.
Reads CLAUDE.md context + analytics + selected topic → storyboard.json

Usage:
  python generate_storyboard.py "topik science" [--output path/to/output.json]
  python generate_storyboard.py --ideas-only  # just show 3 topic ideas
"""
import json, sys, os, argparse
from pathlib import Path
from datetime import datetime

PIPELINE_DIR = Path(__file__).parent.parent

SYSTEM_PROMPT = """Kamu adalah Content Strategist berpengalaman untuk konten TikTok Islam-sains viral.
Kamu memahami formula konten yang menggabungkan fakta ilmiah dengan perspektif islami.
Balas HANYA dengan JSON valid, tanpa penjelasan atau markdown."""

def read_analytics():
    analytics_dir = PIPELINE_DIR / "analytics"
    if not analytics_dir.exists():
        return {}
    files = sorted(analytics_dir.glob("*.json"), reverse=True)
    if files:
        try:
            return json.loads(files[0].read_text())
        except Exception:
            return {}
    return {}

def read_claude_md():
    p = PIPELINE_DIR / "CLAUDE.md"
    return p.read_text() if p.exists() else ""

def generate_ideas(analytics: dict) -> list:
    """Generate 3 science topic ideas based on analytics."""
    try:
        import anthropic
    except ImportError:
        print("❌ Install anthropic: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic()
    prompt = f"""Konteks akun TikTok:
{read_claude_md()[:2000]}

Pola konten viral akun ini:
- Renungan syukur + ayat Quran = 32K views (TERBAIK)
- Konten rezeki + hikmah islami = 6.7K views
- Filosofi mindset = 3.8K views

Data analytics terbaru: {json.dumps(analytics, ensure_ascii=False)[:1000]}

Tugas: Berikan TEPAT 3 ide topik science yang bisa dikaitkan dengan motivasi islami.

Pilih topik yang:
1. Relevan dengan kehidupan sehari-hari Muslim Indonesia usia 18-35
2. Ada ayat Quran atau hadis yang sangat relevan
3. Fakta science-nya mengejutkan dan mudah dipahami
4. Bisa dikaitkan dengan syukur, rezeki, atau muhasabah diri

Format JSON:
[
  {{
    "topik": "...",
    "hook_preview": "...(1 kalimat hook mengejutkan)",
    "ayat_terkait": "...(nama surah + ayat)",
    "alasan_viral": "...(mengapa ini bisa viral)",
    "estimasi_views": "low|medium|high"
  }},
  ...
]"""

    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    text = _clean_json(response.content[0].text)
    return json.loads(text)

def generate_storyboard(topic: str, analytics: dict) -> dict:
    """Generate full storyboard JSON for a given topic."""
    try:
        import anthropic
    except ImportError:
        print("❌ Install anthropic: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    prompt = f"""Konteks akun TikTok @valsyz7:
{read_claude_md()[:2000]}

Topik yang dipilih: {topic}

Buat storyboard JSON lengkap untuk video TikTok science×Islam, durasi 62-65 detik.
Video ini akan dirender sebagai motion graphic dengan voice over Bahasa Indonesia (pria, dalam, tenang).

Struktur video:
- Scene 1 (0-6s): HOOK — pertanyaan/statement mengejutkan tentang fakta science
- Scene 2 (6-24s): SCIENCE FACTS — 3 fakta singkat yang impressive
- Scene 3 (24-40s): ISLAMIC — ayat Quran/hadis yang relevan + terjemahan
- Scene 4 (40-54s): REFLEKSI — renungan personal 2-3 kalimat
- Scene 5 (54-64s): CTA — pertanyaan reflektif

Format JSON yang HARUS kamu hasilkan (isi semua field):
{{
  "id": "science_{ts}",
  "topic": "...",
  "hook": "...(kalimat hook, boleh pakai <em>kata</em> untuk highlight, max 15 kata)",
  "hook_label": "FAKTA ILMIAH",
  "science_title": "...(judul singkat, max 3 kata)",
  "science_facts": [
    "...(fakta 1 — boleh pakai <strong>angka</strong>, max 8 kata)",
    "...(fakta 2)",
    "...(fakta 3)"
  ],
  "islamic": {{
    "arabic": "...(ayat Arab asli yang relevan, dalam huruf Arab)",
    "translation": "...(terjemahan BI yang puitis, bisa 2 baris dengan \\n)",
    "source": "...(QS. nama surah: nomor ayat)"
  }},
  "reflection": "...(renungan 2-3 kalimat, boleh pakai <strong>kata kunci</strong>)",
  "cta": "...(pertanyaan reflektif 1 kalimat, mendorong komentar)",
  "hashtags": "#MotivasiIslam #SainsDanIslam #FaktaIlmiah #BersyukurSelalu #FYP",
  "narration_full": "...(narasi voiceover lengkap 150-200 kata, natural, nada bijak & dalam, Bahasa Indonesia, TANPA tanda bintang atau format khusus)",
  "visual_cue": "neuron",
  "backsound_type": "ambient_inspirational",
  "total_duration": 64
}}

WAJIB:
- Ayat Quran HARUS relevan langsung dengan topik science
- Narasi voiceover harus mengalir alami untuk TTS
- Hook harus bisa buat orang berhenti scroll dalam 3 detik
- visual_cue pilih dari: neuron|atom|space|dna|water (sesuai topik)"""

    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    text = _clean_json(response.content[0].text)
    return json.loads(text)

def _clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()

def main():
    parser = argparse.ArgumentParser(description="Generate TikTok Science×Islam storyboard")
    parser.add_argument("topic", nargs="?", default=None, help="Topik science yang dibahas")
    parser.add_argument("--ideas-only", action="store_true", help="Tampilkan 3 ide topik saja")
    parser.add_argument("--output", default=None, help="Output JSON path")
    args = parser.parse_args()

    analytics = read_analytics()

    if args.ideas_only:
        print("\n🔍 Generating 3 topic ideas...\n")
        ideas = generate_ideas(analytics)
        print(json.dumps(ideas, ensure_ascii=False, indent=2))
        ideas_path = PIPELINE_DIR / "storyboards" / f"ideas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        ideas_path.parent.mkdir(parents=True, exist_ok=True)
        ideas_path.write_text(json.dumps(ideas, ensure_ascii=False, indent=2))
        print(f"\n✅ Ideas saved: {ideas_path}")
        return str(ideas_path)

    if not args.topic:
        print("❌ Berikan topik atau gunakan --ideas-only")
        print("   Contoh: python generate_storyboard.py 'Otak Manusia'")
        sys.exit(1)

    print(f"\n🎬 Generating storyboard for: {args.topic}\n")
    sb = generate_storyboard(args.topic, analytics)

    out_name = sb.get("id", f"science_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    output_path = args.output or str(PIPELINE_DIR / "storyboards" / f"{out_name}.json")
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_path).write_text(json.dumps(sb, ensure_ascii=False, indent=2))

    print("✅ Storyboard generated!")
    print(f"   Topic    : {sb.get('topic')}")
    print(f"   Hook     : {sb.get('hook', '')[:80]}...")
    print(f"   Duration : {sb.get('total_duration')}s")
    print(f"   Saved    : {output_path}")
    print()
    print("── PREVIEW ─────────────────────────────")
    print(f"🔵 Hook     : {sb.get('hook', '')[:100]}")
    print(f"🔵 Facts    : {sb.get('science_facts', [])}")
    print(f"🟡 Arabic   : {sb.get('islamic', {}).get('arabic', '')[:50]}")
    print(f"🟡 Source   : {sb.get('islamic', {}).get('source')}")
    print(f"💬 CTA      : {sb.get('cta')}")
    print(f"🎙  Narration: {sb.get('narration_full', '')[:120]}...")
    print("─────────────────────────────────────────")
    return output_path

if __name__ == "__main__":
    main()
