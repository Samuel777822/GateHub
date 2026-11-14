"""Tech Gates identity: logo mark + custom lettering ("TECH GATES").

The lettering is a bespoke set of geometric capitals drawn on a 100-unit cap
height: H is a pair of columns with capitals and bases, A is an arched gateway
with a keystone, T is a lintel, and the terminals of C, G and S end in circuit
nodes. The mark is a gateway with a circuit trace running through the doorway.

Writes assets/techgates-{mark,word,lockup}-{gold,ink}.svg
Run:  py -I tools/make_techgates.py
"""
from pathlib import Path

A = Path(__file__).resolve().parent.parent / "assets"
SW = 11          # stroke width of curved strokes
GAP = 15         # letter spacing
SPACE = 34       # word space

def r(x, y, w, h):
    return f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}"/>'

def node(x, y, rad=7.5):
    return f'<circle cx="{x:g}" cy="{y:g}" r="{rad:g}"/>'

def stroke(d):
    return f'<path d="{d}" fill="none" stroke-width="{SW}" stroke-linecap="butt"/>'

# Each glyph: (width, [svg elements]) in a 0..100 cap-height box.
GLYPHS = {
    "T": (66, [r(0, 0, 66, 12), r(0, 12, 7, 7), r(59, 12, 7, 7), r(27, 12, 12, 88)]),
    "E": (54, [r(0, 0, 12, 100), r(0, 0, 54, 11), r(0, 44.5, 42, 11), r(0, 89, 54, 11)]),
    "C": (80, [stroke("M68.4 15.9 A38 44.5 0 1 0 68.4 84.1"), node(70, 14.5), node(70, 85.5)]),
    "H": (74, [r(3, 0, 12, 100), r(59, 0, 12, 100), r(0, 0, 18, 6), r(56, 0, 18, 6), r(0, 94, 18, 6), r(56, 94, 18, 6), r(15, 44.5, 44, 11)]),
    "G": (86, [stroke("M68.4 15.9 A38 44.5 0 1 0 82 50"), r(50, 44.5, 37.5, 11), node(70, 14.5), node(50, 50)]),
    "A": (74, [stroke("M5.5 100 V46 A31.5 34 0 0 1 68.5 46 V100"), r(11, 61, 52, 10), r(31, 2, 12, 15)]),
    "S": (68, [stroke("M61 18 C55 10 46 5.5 34 5.5 C18 5.5 7 14 7 27.5 C7 41.5 19 46 33.5 50 C48.5 54 61 59 61 73 C61 87 50 94.5 34 94.5 C22 94.5 12 90 6 81.5"), node(62.5, 16.5), node(5, 83)]),
}

GOLD = """<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f4dba6"/><stop offset=".55" stop-color="#d7a35e"/><stop offset="1" stop-color="#b47a3c"/></linearGradient></defs>"""

def paint(color):
    if color == "gold":
        return GOLD, 'fill="url(#g)" stroke="url(#g)"'
    return "", f'fill="{color}" stroke="{color}"'

def word(text="TECH GATES"):
    x, parts = 0, []
    for ch in text:
        if ch == " ":
            x += SPACE; continue
        w, els = GLYPHS[ch]
        parts.append(f'<g transform="translate({x:g} 0)">{"".join(els)}</g>')
        x += w + GAP
    return x - GAP, "".join(parts)

def mark_elems():
    return "".join([
        r(4, 6, 112, 6), r(9, 12, 102, 13),                  # cornice + lintel
        r(13, 25, 22, 5), r(85, 25, 22, 5),                  # column capitals
        r(17, 30, 14, 68), r(89, 30, 14, 68),                # columns
        r(11, 98, 26, 7), r(83, 98, 26, 7),                  # bases
        r(4, 106, 112, 5),                                   # threshold
        # circuit trace through the doorway: the "T" of Tech
        '<path d="M60 25 V77" fill="none" stroke-width="7"/>',
        '<path d="M60 47 L48 59 V70 M60 47 L72 59 V70" fill="none" stroke-width="5" stroke-linejoin="round"/>',
        node(48, 73, 4), node(72, 73, 4),
        '<circle cx="60" cy="85" r="7.5" fill="none" stroke-width="4.5"/>', node(60, 85, 2.6),
    ])

def svg(view_w, view_h, body, color, pad=0):
    defs, attrs = paint(color)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {view_w + 2 * pad:g} {view_h + 2 * pad:g}">'
            f'{defs}<g {attrs}>{body}</g></svg>')

def main():
    ww, wbody = word()
    for color, tag in (("gold", "gold"), ("#7a2414", "ink"), ("#d79a6b", "copper")):
        (A / f"techgates-word-{tag}.svg").write_text(svg(ww, 100, wbody, color, pad=2), encoding="utf-8")
        (A / f"techgates-mark-{tag}.svg").write_text(svg(120, 112, mark_elems(), color, pad=2), encoding="utf-8")
        # lockup: mark above the lettering, centred
        scale = 1.35
        mw = 120 * scale
        lock = (f'<g transform="translate({(ww - mw) / 2:g} 0) scale({scale})">{mark_elems()}</g>'
                f'<g transform="translate(0 {112 * scale + 22:g})">{wbody}</g>')
        (A / f"techgates-lockup-{tag}.svg").write_text(svg(ww, 112 * scale + 22 + 100, lock, color, pad=2), encoding="utf-8")
    print("word width", ww)

if __name__ == "__main__":
    main()
