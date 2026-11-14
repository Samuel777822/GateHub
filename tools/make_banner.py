"""Re-letters the GateHub wallpaper banner in GateHub Display.

The source wallpaper has "GATE HUB" engraved in a generic serif. This script
covers that lettering with wood grain cloned from the same rows (the grain runs
horizontally), carves "GATE HUB" back in with our own typeface (copper fill,
inner shadow and highlight, like the original engraving), and writes small,
fast web versions.

Input : theme/wallpaper.png (the original artwork, not committed)
Output: assets/wallpaper.webp, assets/wallpaper.jpg, assets/wallpaper-mobile.webp
Run   : python tools/make_banner.py     (needs: pip install pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "theme" / "wallpaper.png"     # the original artwork (kept out of the repo)
FONT = ROOT / "assets" / "fonts" / "GateHubDisplay.ttf"

TEXT_BOX = (618, 405, 1052, 482)       # where the original lettering sits (1671×941 image)
CAP_TOP, CAP_BOTTOM = 415, 468          # original cap height ≈ 53 px
CENTER_X = 836                          # horizontal centre of the original lettering


def cover_old_text(im):
    """Paint the old lettering out with wood from the same rows, to its left and right."""
    x0, y0, x1, y1 = TEXT_BOX
    w = x1 - x0
    left = im.crop((x0 - w - 10, y0, x0 - 10, y1))
    right = im.crop((x1 + 10, y0, x1 + 10 + w, y1))
    # blend the two donor patches so no single repeat is obvious
    patch = left                       # the right side has the "Σ*" doodle in these rows, so use the clean left side
    # match brightness/colour to the wood just above and below the lettering (the centre is lit)
    ring = [im.crop((x0, y0 - 10, x1, y0)), im.crop((x0, y1, x1, y1 + 10))]
    def mean(img):
        px = list(img.getdata()); return [sum(p[i] for p in px) / len(px) for i in range(3)]
    tgt = [sum(v) / 2 for v in zip(*[mean(r) for r in ring])]
    cur = mean(patch)
    patch = Image.merge("RGB", [ch.point(lambda v, k=tgt[i] / max(cur[i], 1): min(255, int(v * k))) for i, ch in enumerate(patch.split())])
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((4, 2, patch.width - 5, patch.height - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    im.paste(patch, (x0, y0), mask)
    return im


def sample_copper(im):
    """Average colour of the brightest (copper) pixels in the old lettering."""
    region = im.crop(TEXT_BOX).convert("RGB")
    px = sorted(list(region.getdata()), key=lambda c: sum(c), reverse=True)[: 600]
    return tuple(sum(c[i] for c in px) // len(px) for i in range(3))


def carve(im, copper):
    S = 4                                                   # draw large, then downsample (smooth edges)
    cap = (CAP_BOTTOM - CAP_TOP) * S
    size = round(cap / 0.70)                                # cap height is 700/1000 em
    font = ImageFont.truetype(str(FONT), size)
    text, track = "GATE HUB", int(0.08 * size)
    widths = [font.getbbox(ch)[2] if ch != " " else int(0.30 * size) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    W, H = total + 40 * S, int(size * 1.4)
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    x, base_y = 20 * S, int(size * 0.18)
    for ch, cw in zip(text, widths):
        if ch != " ":
            d.text((x, base_y), ch, font=font, fill=255)
        x += cw + track
    bbox = mask.getbbox()
    mask = mask.crop(bbox).resize(((bbox[2] - bbox[0]) // S, (bbox[3] - bbox[1]) // S), Image.LANCZOS)
    mw, mh = mask.size
    ox, oy = CENTER_X - mw // 2, CAP_TOP + ((CAP_BOTTOM - CAP_TOP) - mh) // 2

    hi = tuple(min(255, int(c * 1.06)) for c in copper)      # lit upper edge
    lo = tuple(int(c * 0.58) for c in copper)                # darker lower part
    grad = Image.new("RGB", (mw, mh))
    gd = ImageDraw.Draw(grad)
    for yy in range(mh):
        t = yy / max(1, mh - 1)
        gd.line([(0, yy), (mw, yy)], fill=tuple(int(hi[i] * (1 - t) + lo[i] * t) for i in range(3)))

    # carved look: dark shadow below-right, copper body, faint highlight on top edge
    shadow = Image.new("RGB", (mw, mh), (24, 8, 3))
    sh_mask = mask.filter(ImageFilter.GaussianBlur(1.6)).point(lambda v: int(v * 0.85))
    im.paste(shadow, (ox + 2, oy + 3), sh_mask)
    im.paste(grad, (ox, oy), mask)
    edge = ImageChops.subtract(mask, mask.transform(mask.size, Image.AFFINE, (1, 0, 0, 0, 1, 1))).point(lambda v: int(v * 0.55))
    im.paste(Image.new("RGB", (mw, mh), (255, 226, 180)), (ox, oy), edge)
    return im


def main():
    im = Image.open(SRC).convert("RGB")
    copper = sample_copper(im)
    im = carve(cover_old_text(im), copper)
    out = ROOT / "assets"
    im.save(out / "wallpaper.webp", "WEBP", quality=82, method=6)
    im.save(out / "wallpaper.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    im.resize((1000, round(1000 * im.height / im.width)), Image.LANCZOS).save(out / "wallpaper-mobile.webp", "WEBP", quality=80, method=6)
    for f in ("wallpaper.webp", "wallpaper.jpg", "wallpaper-mobile.webp"):
        print(f, (out / f).stat().st_size // 1024, "KB")
    print("copper sampled:", copper)


if __name__ == "__main__":
    main()
