#!/usr/bin/env python3
"""
Inject storyboard JSON into HTML template.
Replaces the INJECT_STORYBOARD_HERE marker with window.STORYBOARD = {...}

Usage:
  python inject_storyboard.py storyboards/xxx.json --output output/YYYYMMDD/animation.html
"""
import json, sys, shutil, argparse, re
from pathlib import Path

PIPELINE_DIR = Path(__file__).parent.parent
TEMPLATE_DEFAULT = PIPELINE_DIR / "templates" / "science_60s.html"
GSAP_SRC = Path(__file__).parent / "gsap.min.js"

def inject_storyboard(template_path: str, storyboard_path: str, output_path: str) -> None:
    template = Path(template_path).read_text(encoding="utf-8")
    sb       = json.loads(Path(storyboard_path).read_text(encoding="utf-8"))

    sb_json     = json.dumps(sb, ensure_ascii=False, indent=2)
    inject_code = f"window.STORYBOARD = {sb_json};"

    marker = "// INJECT_STORYBOARD_HERE"
    if marker in template:
        output_html = template.replace(marker, inject_code)
    else:
        # Fallback: insert as first content after first <script> (non-src)
        pattern = r'(<script>)'
        output_html = re.sub(pattern, r'\1\n' + inject_code + '\n', template, count=1)

    # Fix GSAP path: if template references CDN but local gsap exists, keep CDN.
    # If CDN is not reachable, the inject can be re-run with --local-gsap flag.

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(output_html, encoding="utf-8")

    # Copy local gsap.min.js next to output for offline fallback
    if GSAP_SRC.exists():
        dst = out.parent / "gsap.min.js"
        shutil.copy2(GSAP_SRC, dst)
        print(f"[inject] GSAP local copy → {dst}")

    print(f"[inject] ✅ Done: {output_path}")
    print(f"[inject]    Topic    : {sb.get('topic', 'unknown')}")
    print(f"[inject]    Duration : {sb.get('total_duration', 64)}s")
    print(f"[inject]    Visual   : {sb.get('visual_cue', 'neuron')}")

def main():
    parser = argparse.ArgumentParser(description="Inject storyboard into HTML template")
    parser.add_argument("storyboard", help="Path ke storyboard JSON")
    parser.add_argument("--template", default=str(TEMPLATE_DEFAULT),
                        help="HTML template path (default: templates/science_60s.html)")
    parser.add_argument("--output", required=True,
                        help="Output HTML path")
    args = parser.parse_args()

    if not Path(args.storyboard).exists():
        print(f"❌ Storyboard tidak ditemukan: {args.storyboard}")
        sys.exit(1)
    if not Path(args.template).exists():
        print(f"❌ Template tidak ditemukan: {args.template}")
        sys.exit(1)

    inject_storyboard(args.template, args.storyboard, args.output)

if __name__ == "__main__":
    main()
