"""Shrinks the question figures in data/img (same filenames, so nothing else changes).

PNG figures are mostly diagrams, tables and scanned text, which keep their look
with a 256-colour palette; each file is only replaced when the result is
clearly smaller. JPEGs are re-saved progressively when that saves space.

Run:  python tools/optimize_images.py      (needs: pip install pillow)
"""
from pathlib import Path
from io import BytesIO
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "data" / "img"


def shrink_png(p):
    im = Image.open(p)
    im.load()
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        q = im.convert("RGBA").quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    else:
        q = im.convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    buf = BytesIO(); q.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def shrink_jpg(p):
    im = Image.open(p).convert("RGB")
    buf = BytesIO(); im.save(buf, "JPEG", quality=82, optimize=True, progressive=True)
    return buf.getvalue()


def main():
    before = after = changed = 0
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file() or p.stat().st_size < 12_000:
            continue
        ext = p.suffix.lower()
        size = p.stat().st_size
        try:
            data = shrink_png(p) if ext == ".png" else shrink_jpg(p) if ext in (".jpg", ".jpeg") else None
        except Exception as e:
            print("skip", p.name, e); continue
        before += size
        if data and len(data) < size * 0.85:
            p.write_bytes(data); after += len(data); changed += 1
        else:
            after += size
    print(f"files changed: {changed}   {before / 1048576:.1f} MB -> {after / 1048576:.1f} MB")


if __name__ == "__main__":
    main()
