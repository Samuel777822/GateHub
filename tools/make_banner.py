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


def cover_old_text(im, k=1.0):
    """Paint the old lettering out with wood from the same rows, to its left and right."""
    x0, y0, x1, y1 = (round(v * k) for v in TEXT_BOX)
    g = max(1, round(k))
    w = x1 - x0
    left = im.crop((x0 - w - 10 * g, y0, x0 - 10 * g, y1))
    # blend the two donor patches so no single repeat is obvious
    patch = left                       # the right side has the "Σ*" doodle in these rows, so use the clean left side
    # match brightness/colour to the wood just above and below the lettering (the centre is lit)
    ring = [im.crop((x0, y0 - 10 * g, x1, y0)), im.crop((x0, y1, x1, y1 + 10 * g))]
    def mean(img):
        px = list(img.get_flattened_data()) if hasattr(img, "get_flattened_data") else list(img.getdata()); return [sum(p[i] for p in px) / len(px) for i in range(3)]
    tgt = [sum(v) / 2 for v in zip(*[mean(r) for r in ring])]
    cur = mean(patch)
    patch = Image.merge("RGB", [ch.point(lambda v, k=tgt[i] / max(cur[i], 1): min(255, int(v * k))) for i, ch in enumerate(patch.split())])
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((4 * g, 2 * g, patch.width - 5 * g, patch.height - 3 * g), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2 * k))
    im.paste(patch, (x0, y0), mask)
    return im


def sample_copper(im):
    """Average colour of the brightest (copper) pixels in the old lettering."""
    region = im.crop(TEXT_BOX).convert("RGB")
    px = sorted(list(region.get_flattened_data() if hasattr(region, "get_flattened_data") else region.getdata()), key=lambda c: sum(c), reverse=True)[: 600]
    return tuple(sum(c[i] for c in px) // len(px) for i in range(3))


def carve(im, copper, k=1.0):
    S = 4                                                   # draw large, then downsample (smooth edges)
    cap = round((CAP_BOTTOM - CAP_TOP) * k) * S
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
    ox, oy = round(CENTER_X * k) - mw // 2, round(CAP_TOP * k) + (round((CAP_BOTTOM - CAP_TOP) * k) - mh) // 2

    hi = tuple(min(255, int(c * 1.16)) for c in copper)      # lit upper edge
    lo = tuple(int(c * 0.68) for c in copper)                # darker lower part
    grad = Image.new("RGB", (mw, mh))
    gd = ImageDraw.Draw(grad)
    for yy in range(mh):
        t = yy / max(1, mh - 1)
        gd.line([(0, yy), (mw, yy)], fill=tuple(int(hi[i] * (1 - t) + lo[i] * t) for i in range(3)))

    # carved look: dark shadow below-right, copper body, faint highlight on top edge
    shadow = Image.new("RGB", (mw, mh), (24, 8, 3))
    sh_mask = mask.filter(ImageFilter.GaussianBlur(1.6 * k)).point(lambda v: int(v * 0.85))
    im.paste(shadow, (ox + round(2 * k), oy + round(3 * k)), sh_mask)
    im.paste(grad, (ox, oy), mask)
    edge = ImageChops.subtract(mask, mask.transform(mask.size, Image.AFFINE, (1, 0, 0, 0, 1, max(1, round(k))))).point(lambda v: int(v * 0.7))
    im.paste(Image.new("RGB", (mw, mh), (255, 226, 180)), (ox, oy), edge)
    return im


def render(src, k):
    """The banner at k times the source size, lettering drawn natively at that size (always sharp)."""
    im = src if k == 1 else src.resize((round(src.width * k), round(src.height * k)), Image.LANCZOS)
    if k > 1:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2 * k, percent=60, threshold=2))
    return carve(cover_old_text(im, k), sample_copper(src), k)


def main():
    src = Image.open(SRC).convert("RGB")
    out = ROOT / "assets"
    # laptops: 1.25x, so the fine strokes of the lettering stay crisp on most screens
    big = render(src, 1.25)
    big.save(out / "wallpaper.webp", "WEBP", quality=74, method=6)
    big.save(out / "wallpaper.jpg", "JPEG", quality=78, optimize=True, progressive=True)
    # phones: the banner shows only the middle of the artwork, so crop to it and keep
    # 1.4x resolution there (about 2.8 device pixels per CSS pixel on a 470 px tall banner)
    ph = render(src, 1.4)
    cw = round(ph.width * 0.64)
    ph.crop(((ph.width - cw) // 2, 0, (ph.width + cw) // 2, ph.height)).save(out / "wallpaper-mobile.webp", "WEBP", quality=70, method=6)
    for f in ("wallpaper.webp", "wallpaper.jpg", "wallpaper-mobile.webp"):
        print(f, Image.open(out / f).size, (out / f).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
