"""Generates the GateHub emblem + app icons.

Writes assets/emblem.svg (transparent), assets/icon.svg (mahogany tile),
renders PNGs with headless Chrome and packs assets/gatehub.ico.

Run:  py -I tools/make_icons.py
"""
import math, struct, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "assets"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

DEFS = """
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f8e3b4"/>
    <stop offset=".38" stop-color="#e2b26c"/>
    <stop offset=".7" stop-color="#b9773a"/>
    <stop offset="1" stop-color="#eac283"/>
  </linearGradient>
  <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#b9773a"/>
    <stop offset=".5" stop-color="#f3d39a"/>
    <stop offset="1" stop-color="#b9773a"/>
  </linearGradient>
  <radialGradient id="glow" cx=".5" cy=".75" r=".75">
    <stop offset="0" stop-color="#fff1c9"/>
    <stop offset=".45" stop-color="#f2b25c"/>
    <stop offset="1" stop-color="#9c4a1c"/>
  </radialGradient>
  <radialGradient id="wood" cx=".5" cy=".42" r=".75">
    <stop offset="0" stop-color="#6a2a16"/>
    <stop offset=".6" stop-color="#3f160c"/>
    <stop offset="1" stop-color="#220a05"/>
  </radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.005 0.16" numOctaves="3" seed="11"/>
    <feColorMatrix values="0 0 0 0 0.10  0 0 0 0 0.03  0 0 0 0 0.01  1.3 0 0 0 -0.56"/>
  </filter>
  <filter id="engrave" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/>
    <feOffset in="b" dx="0" dy="3" result="o"/>
    <feFlood flood-color="#120402" flood-opacity=".85"/>
    <feComposite in2="o" operator="in" result="s"/>
    <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>"""

LEAF = "M0 0 C7 -8 19 -9 28 0 C19 9 7 8 0 0 Z"

def laurel(side):
    """One laurel branch along a circular arc; side=-1 left, +1 right."""
    cx, cy, r = 256, 262, 196
    parts = []
    a0, a1 = 100, 222           # degrees, SVG coords (90 = straight down)
    steps = 11
    pts = []
    for i in range(steps + 1):
        a = math.radians(a0 + (a1 - a0) * i / steps)
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        if side > 0:
            x = 2 * cx - x
        pts.append((x, y))
    # stem
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    parts.append(f'<path d="{d}" fill="none" stroke="url(#gold)" stroke-width="5" stroke-linecap="round"/>')
    for i in range(1, steps + 1):
        x0, y0 = pts[i - 1]; x1, y1 = pts[i]
        tang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        scale = 1.15 - 0.45 * (i / steps)
        for off in (-38, 38):
            parts.append(f'<path d="{LEAF}" fill="url(#gold)" transform="translate({x1:.1f} {y1:.1f}) rotate({tang + off:.1f}) scale({scale:.2f})"/>')
    # berry tip
    xt, yt = pts[-1]
    parts.append(f'<circle cx="{xt:.1f}" cy="{yt:.1f}" r="6" fill="url(#gold)"/>')
    return "\n".join(parts)

def temple():
    cols = []
    for x in (170, 218, 294, 342):
        cols.append(f'<rect x="{x-11}" y="226" width="22" height="92" fill="url(#gold)"/>'
                    f'<rect x="{x-16}" y="218" width="32" height="9" rx="2" fill="url(#gold)"/>'
                    f'<rect x="{x-15}" y="316" width="30" height="7" rx="2" fill="url(#gold)"/>'
                    f'<rect x="{x-5}" y="232" width="3" height="80" fill="#7a3d18" opacity=".55"/>'
                    f'<rect x="{x+3}" y="232" width="3" height="80" fill="#7a3d18" opacity=".55"/>')
    return f"""
  <g filter="url(#engrave)">
    <path d="M256 124 L388 194 L124 194 Z" fill="url(#gold)"/>
    <path d="M256 142 L350 186 L162 186 Z" fill="#3a140b"/>
    <circle cx="256" cy="170" r="9" fill="url(#gold)"/>
    <path d="M226 176 h20 M266 176 h20" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>
    <rect x="132" y="196" width="248" height="17" rx="2" fill="url(#gold)"/>
    <rect x="140" y="204" width="232" height="3" fill="#7a3d18" opacity=".6"/>
    {''.join(cols)}
    <path d="M234 318 V258 a22 22 0 0 1 44 0 V318 Z" fill="url(#glow)"/>
    <path d="M256 236 V318" stroke="#7a3d18" stroke-width="2.5" opacity=".7"/>
    <rect x="128" y="324" width="256" height="13" rx="2" fill="url(#gold)"/>
    <rect x="114" y="339" width="284" height="14" rx="2" fill="url(#goldH)"/>
  </g>"""

def emblem_body():
    return f'<g filter="url(#engrave)">{laurel(-1)}{laurel(1)}</g>{temple()}'

def icon_svg(size, maskable=False):
    bg_rx = 0 if maskable else 112
    inner = 'transform="translate(51.2 51.2) scale(.8)"' if maskable else ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 512 512">{DEFS}
  <clipPath id="tile"><rect width="512" height="512" rx="{bg_rx}"/></clipPath>
  <g clip-path="url(#tile)"><rect width="512" height="512" fill="url(#wood)"/><rect width="512" height="512" filter="url(#grain)"/></g>
  {'' if maskable else '<rect x="20" y="20" width="472" height="472" rx="94" fill="none" stroke="url(#gold)" stroke-width="3" opacity=".75"/><rect x="30" y="30" width="452" height="452" rx="86" fill="none" stroke="url(#gold)" stroke-width="1.2" opacity=".45"/>'}
  <g {inner}><g transform="translate(256 262) scale(.86) translate(-256 -250)">{emblem_body()}</g></g>
</svg>"""

def emblem_svg():
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 40 432 400">{DEFS}{emblem_body()}</svg>"""

def render(svg_text, size, out_png, profile):
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as f:
        f.write(svg_text); tmp = f.name
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    f"--user-data-dir={profile}", "--default-background-color=00000000",
                    f"--window-size={size},{size}", f"--screenshot={out_png}",
                    Path(tmp).as_uri()], check=True, capture_output=True, timeout=60)
    Path(tmp).unlink()

def write_ico(pngs, out):
    data = [p.read_bytes() for _, p in pngs]
    header = struct.pack("<HHH", 0, 1, len(data))
    offset = 6 + 16 * len(data)
    entries = b""
    for (size, _), blob in zip(pngs, data):
        s = 0 if size >= 256 else size
        entries += struct.pack("<BBBBHHII", s, s, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
    out.write_bytes(header + entries + b"".join(data))

def main():
    A.mkdir(exist_ok=True)
    (A / "emblem.svg").write_text(emblem_svg(), encoding="utf-8")
    (A / "icon.svg").write_text(icon_svg(512), encoding="utf-8")
    profile = Path(tempfile.gettempdir()) / "gatehub-icon-render"
    icons = A / "icons"; icons.mkdir(exist_ok=True)
    for s in (512, 192, 180, 64, 48, 32):
        render(icon_svg(s), s, icons / f"icon-{s}.png", profile)
    render(icon_svg(512, maskable=True), 512, icons / "maskable-512.png", profile)
    ico_set = []
    for s in (16, 24, 32, 48, 64, 128, 256):
        p = icons / f"ico-{s}.png"; render(icon_svg(s), s, p, profile); ico_set.append((s, p))
    write_ico(ico_set, A / "gatehub.ico")
    for _, p in ico_set: p.unlink()
    print("ok", sorted(x.name for x in icons.iterdir()), (A / "gatehub.ico").stat().st_size)

if __name__ == "__main__":
    main()
