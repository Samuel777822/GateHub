"""GateHub Display — the custom GateHub typeface (Roman inscription style).

Classical carved capitals in the spirit of Roman inscriptions and the GATE HUB
lettering on the GateHub wallpaper: thick stems with hairline cross-strokes,
stressed rounds (thick sides, thin top and bottom), bracketed wedge serifs on
every stem, beak serifs on arm ends, and diamond-shaped stops like Roman
interpuncts. Lowercase maps onto the capitals. Covers A–Z, 0–9, punctuation.

Writes assets/fonts/GateHubDisplay.{ttf,woff2}
Run:  python tools/make_font.py      (needs: pip install fonttools brotli)
"""
import math
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

OUT = Path(__file__).resolve().parent.parent / "assets" / "fonts"
UPM, CAP = 1000, 700
S, H = 96, 38            # thick stem, hairline
TX, TY = 102, 38         # stressed rounds: thick sides, thin top/bottom
OV = 12                  # overshoot of round letters


def area(pts):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1])) / 2


def qcurve(p0, c, p1, n=6):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]) for t in (i / n for i in range(1, n))]


class G:
    def __init__(self, w):
        self.w, self.contours = w, []

    def add(self, pts, hole=False):
        pts = [(round(x), round(y)) for x, y in pts]
        if (area(pts) > 0) != hole:          # filled contours clockwise, holes counter-clockwise
            pts.reverse()
        self.contours.append(pts)
        return self

    def poly(self, *pts):
        return self.add(list(pts))

    def rect(self, x0, y0, x1, y1):
        return self.add([(x0, y0), (x0, y1), (x1, y1), (x1, y0)])

    def _ell(self, cx, cy, rx, ry, a):
        return cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a))

    def arc(self, cx, cy, rx, ry, a0, a1, tx=TX, ty=TY):
        n = max(12, int(abs(a1 - a0) / 4))
        outer = [self._ell(cx, cy, rx, ry, a0 + (a1 - a0) * i / n) for i in range(n + 1)]
        inner = [self._ell(cx, cy, rx - tx, ry - ty, a0 + (a1 - a0) * i / n) for i in range(n + 1)]
        return self.add(outer + inner[::-1])

    def ring(self, cx, cy, rx, ry, tx=TX, ty=TY):
        n = 90
        self.add([self._ell(cx, cy, rx, ry, 360 * i / n) for i in range(n)])
        return self.add([self._ell(cx, cy, rx - tx, ry - ty, 360 * i / n) for i in range(n)], hole=True)

    def diag(self, x0, y0, x1, y1, t):
        """Diagonal stroke with horizontal (carved) ends; t = perpendicular thickness."""
        L = math.hypot(x1 - x0, y1 - y0)
        w = t * L / abs(y1 - y0)                       # horizontal width of the stroke
        self.add([(x0 - w / 2, y0), (x0 + w / 2, y0), (x1 + w / 2, y1), (x1 - w / 2, y1)])
        return w

    def line(self, x0, y0, x1, y1, t):
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy); nx, ny = -dy / L * t / 2, dx / L * t / 2
        return self.add([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny), (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)])

    def foot(self, xc, w, top=False, ext=46, h=62):
        """Bracketed wedge serif under (or over) a stroke of width w centred at xc."""
        L, R, hl, hr = xc - w / 2 - ext, xc + w / 2 + ext, xc - w / 2, xc + w / 2
        pts = [(L, 0), (R, 0), (R, 9)] + qcurve((R, 9), (hr, 9), (hr, h)) + [(hr, h), (hl, h)] + qcurve((hl, h), (hl, 9), (L, 9)) + [(L, 9)]
        if top:
            pts = [(x, CAP - y) for x, y in pts]
        return self.add(pts)

    def stem(self, x, w=S, y0=0, y1=CAP, top=True, bottom=True):
        self.rect(x, y0, x + w, y1)
        if bottom and y0 == 0: self.foot(x + w / 2, w)
        if top and y1 == CAP: self.foot(x + w / 2, w, top=True)
        return self

    def diamond(self, cx, cy, r=46):
        return self.poly((cx, cy + r), (cx + r * .82, cy), (cx, cy - r), (cx - r * .82, cy))

    def beak_down(self, x, y=CAP, depth=120):      # serif hanging from the end of a top arm
        return self.poly((x - 26, y), (x + 4, y), (x + 2, y - depth), (x - 8, y - depth - 10))

    def beak_up(self, x, y=0, depth=120):          # serif rising from the end of a bottom arm
        return self.poly((x - 26, y), (x + 6, y), (x + 4, y + depth), (x - 6, y + depth + 10))


def glyphs():
    g = {}
    def new(ch, w):
        g[ch] = G(w); return g[ch]

    a = new("A", 730)
    wl = a.diag(348, CAP, 82, 0, H); wr = a.diag(382, CAP, 646, 0, S)
    a.poly((326, CAP), (410, CAP), (368, CAP + 26))
    a.rect(166, 212, 556, 212 + H).foot(82, wl).foot(646, wr)

    b = new("B", 610)
    b.stem(60).rect(60, CAP - H, 300, CAP).arc(300, 525, 185, 175, -90, 90, tx=S - 6, ty=H)
    b.rect(60, 350, 322, 350 + H).arc(322, 183, 218, 183, -90, 90, tx=S, ty=H).rect(60, 0, 322, H)

    c = new("C", 710)
    c.arc(382, 350, 322, 350 + OV, 44, 316)
    c.poly((602, 610), (630, 600), (636, 480), (622, 470)).poly((602, 90), (630, 100), (636, 220), (622, 230))

    d = new("D", 750)
    d.stem(60).rect(60, CAP - H, 352, CAP).rect(60, 0, 352, H).arc(352, 350, 336, 350, -90, 90, tx=TX, ty=H)

    e = new("E", 570)
    e.stem(60).rect(60, CAP - H, 486, CAP).rect(60, 342, 436, 342 + H).rect(60, 0, 506, H)
    e.beak_down(486).rect(418, 310, 438, 404).beak_up(506)

    f = new("F", 540)
    f.stem(60).rect(60, CAP - H, 482, CAP).rect(60, 330, 430, 330 + H)
    f.beak_down(482).rect(412, 298, 432, 392)

    gg = new("G", 760)
    gg.arc(392, 350, 334, 350 + OV, 44, 336)
    gg.poly((616, 612), (644, 602), (650, 482), (636, 472))
    gg.rect(618, 38, 618 + S - 8, 318).rect(584, 304, 736, 326)

    new("H", 770).stem(60).stem(616).rect(60 + S, 346, 616, 346 + H)
    new("I", 310).stem(108)

    j = new("J", 440)
    j.stem(250, y0=140, bottom=False).arc(200, 150, 144, 240, 180, 360, tx=S, ty=H)

    k = new("K", 690)
    k.stem(60)
    wa = k.diag(170, 318, 604, CAP, H + 6); k.foot(604, wa, top=True)
    wl = k.diag(250, 420, 650, 0, S); k.foot(650, wl)

    l = new("L", 570)
    l.stem(60).rect(60, 0, 516, H).beak_up(516)

    m = new("M", 920)
    w1 = m.diag(112, 0, 146, CAP, H); m.foot(112, w1)
    m.diag(160, CAP, 460, 0, S); m.diag(460, 0, 760, CAP, H)
    w4 = m.diag(772, CAP, 806, 0, S); m.foot(806, w4)
    m.foot(146, w1 + 30, top=True).foot(772, w4, top=True)

    n = new("N", 780)
    n.rect(70, 0, 70 + H, CAP).foot(85, H + 12)
    n.rect(676, 0, 676 + H, CAP).foot(691, H + 12, top=True)
    wd = n.diag(110, CAP, 690, 0, S); n.foot(104, wd - 10, top=True)

    new("O", 810).ring(405, 350, 355, 350 + OV)

    p = new("P", 640)
    p.stem(60).rect(60, CAP - H, 302, CAP).arc(302, 488, 244, 212, -90, 90, tx=S, ty=H).rect(60, 276, 302, 276 + H)

    q = new("Q", 810)
    q.ring(405, 350, 355, 350 + OV).poly((380, 26), (480, 8), (800, -170), (772, -186))

    r = new("R", 700)
    r.stem(60).rect(60, CAP - H, 302, CAP).arc(302, 488, 244, 212, -90, 90, tx=S, ty=H).rect(60, 276, 302, 276 + H)
    wl = r.diag(300, 290, 640, 0, S); r.foot(640, wl)

    s = new("S", 580)
    s.arc(296, 528, 206, 172, 90, 270, tx=S - 10, ty=H).arc(296, 180, 228, 180, -90, 90, tx=S, ty=H)
    s.line(136, 474, 470, 232, S - 14)
    s.rect(296, CAP - H, 496, CAP).beak_down(496).rect(76, 0, 296, H).poly((62, 0), (96, 0), (98, 130), (88, 140))

    t = new("T", 690)
    t.rect(30, CAP - H, 660, CAP).poly((30, CAP), (58, CAP), (54, 580), (42, 570)).poly((632, CAP), (660, CAP), (648, 570), (636, 580))
    t.stem(298, top=False)

    u = new("U", 770)
    u.stem(60, y0=262, bottom=False)
    u.arc(358, 262, 298, 262, 180, 270, tx=S, ty=H).arc(358, 262, 298, 262, 270, 360, tx=H + 4, ty=H)
    u.rect(626, 0, 626 + H, CAP).foot(641, H + 14, top=True).foot(641, H + 14)

    v = new("V", 730)
    w1 = v.diag(86, CAP, 364, 0, S); w2 = v.diag(644, CAP, 364, 0, H)
    v.foot(86, w1, top=True).foot(644, w2, top=True)

    w = new("W", 1120)
    a1 = w.diag(76, CAP, 332, 0, S); a2 = w.diag(570, CAP, 332, 0, H)
    a3 = w.diag(552, CAP, 808, 0, S); a4 = w.diag(1046, CAP, 808, 0, H)
    w.foot(76, a1, top=True).foot(1046, a4, top=True)

    x = new("X", 720)
    w1 = x.diag(86, CAP, 634, 0, S); w2 = x.diag(634, CAP, 86, 0, H)
    x.foot(86, w1, top=True).foot(634, w1).foot(634, w2, top=True).foot(86, w2)

    y = new("Y", 720)
    w1 = y.diag(86, CAP, 360, 352, S); w2 = y.diag(634, CAP, 360, 352, H)
    y.foot(86, w1, top=True).foot(634, w2, top=True).stem(313, y0=0, y1=366, top=False)

    z = new("Z", 650)
    z.rect(84, CAP - H, 566, CAP).rect(70, 0, 586, H).diag(530, CAP - H, 112, H, S)
    z.poly((84, CAP), (112, CAP), (108, 586), (98, 576)).beak_up(586)

    # digits (lining)
    new("0", 650).ring(325, 350, 275, 350 + OV)
    one = new("1", 430); one.stem(168, top=False).line(172, 688, 70, 590, H + 10)
    two = new("2", 610); two.arc(300, 490, 232, 222, -28, 180, tx=S, ty=H).line(474, 392, 94, 34, S - 14).rect(70, 0, 548, H).beak_up(548)
    th = new("3", 610); th.arc(292, 525, 212, 175, -90, 152, tx=S - 6, ty=H).arc(292, 195, 244, 195, -152, 90, tx=S, ty=H)
    fo = new("4", 640); fo.line(446, 700, 68, 210, H + 8).stem(414, top=False).rect(58, 190, 600, 190 + H)
    fi = new("5", 610); fi.rect(116, CAP - H, 540, CAP).beak_down(540).rect(110, 400, 110 + H + 6, CAP).rect(110, 436, 302, 466).arc(302, 232, 248, 234, -150, 92, tx=S, ty=H)
    si = new("6", 640); si.ring(322, 242, 254, 242).arc(342, 360, 276, 350, 62, 186, tx=S, ty=H)
    sv = new("7", 600); sv.rect(60, CAP - H, 548, CAP).poly((60, CAP), (88, CAP), (84, 586), (74, 576)); wv = sv.diag(536, CAP - H, 232, 0, S); sv.foot(232, wv)
    ei = new("8", 620); ei.ring(310, 530, 198, 172, tx=S - 14, ty=H).ring(310, 196, 244, 196)
    ni = new("9", 640); ni.ring(318, 458, 254, 242).arc(298, 340, 276, 350, 242, 366, tx=S, ty=H)

    # punctuation — Roman diamond stops
    new(".", 220).diamond(110, 52)
    new(",", 220).diamond(110, 62).poly((114, 30), (138, 34), (90, -120), (80, -110))
    new(":", 220).diamond(110, 52).diamond(110, 420)
    new(";", 220).diamond(110, 420).diamond(110, 62).poly((114, 30), (138, 34), (90, -120), (80, -110))
    new("-", 380).rect(50, 300, 330, 346)
    new("–", 540).rect(40, 300, 500, 346)
    new("—", 860).rect(40, 300, 820, 346)
    new("·", 240).diamond(120, 360, 42)
    new("'", 200).poly((76, CAP), (128, CAP), (108, 500), (98, 500))
    new("’", 200).poly((76, CAP), (128, CAP), (108, 500), (98, 500))
    amp = new("&", 740); amp.ring(292, 548, 150, 150, tx=72, ty=H).ring(300, 215, 242, 215).line(346, 436, 700, 0, S - 18)
    new("/", 440).diag(402, 740, 40, -40, H + 10)
    new("(", 320).arc(318, 330, 230, 430, 116, 244, tx=60, ty=24)
    new(")", 320).arc(2, 330, 230, 430, -64, 64, tx=60, ty=24)
    new("!", 240).poly((74, CAP), (166, CAP), (130, 190), (110, 190)).diamond(120, 52)
    qu = new("?", 530); qu.arc(262, 520, 212, 180, -55, 180, tx=S, ty=H).line(384, 372, 266, 228, H + 6).rect(250, 170, 282, 240).diamond(266, 52)
    new("+", 560).rect(50, 330, 510, 370).rect(260, 120, 300, 580)
    return g


NAMES = {".": "period", ",": "comma", ":": "colon", ";": "semicolon", "-": "hyphen", "–": "endash", "—": "emdash",
         "·": "periodcentered", "'": "quotesingle", "’": "quoteright", "&": "ampersand", "/": "slash",
         "(": "parenleft", ")": "parenright", "!": "exclam", "?": "question", "+": "plus",
         **{str(i): n for i, n in enumerate(["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"])}}


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    gl = glyphs()
    order, glyf, metrics, cmap = [".notdef", "space"], {}, {}, {32: "space", 0xA0: "space"}

    nd = TTGlyphPen(None)
    for c in ([(50, 0), (50, 700), (450, 700), (450, 0)], [(110, 60), (390, 60), (390, 640), (110, 640)]):
        nd.moveTo(c[0]); [nd.lineTo(p) for p in c[1:]]; nd.closePath()
    glyf[".notdef"] = nd.glyph(); metrics[".notdef"] = (500, 50)
    glyf["space"] = TTGlyphPen(None).glyph(); metrics["space"] = (260, 0)

    for ch, g in gl.items():
        name = NAMES.get(ch, ch)
        pen = TTGlyphPen(None)
        for c in g.contours:
            pen.moveTo(c[0]); [pen.lineTo(p) for p in c[1:]]; pen.closePath()
        glyf[name] = pen.glyph()
        xs = [x for c in g.contours for x, _ in c]
        metrics[name] = (g.w, min(xs) if xs else 0)
        order.append(name)
        cmap[ord(ch)] = name
        if ch.isalpha():
            cmap[ord(ch.lower())] = name          # lowercase -> capitals, like an inscription

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyf)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=880, descent=-220)
    fb.setupNameTable({"familyName": "GateHub Display", "styleName": "Regular", "uniqueFontIdentifier": "TechGates:GateHubDisplay:2.0",
                       "fullName": "GateHub Display Regular", "psName": "GateHubDisplay-Regular", "version": "Version 2.000",
                       "copyright": "GateHub Display (c) 2026 Tech Gates", "manufacturer": "Tech Gates", "designer": "Tech Gates"})
    fb.setupOS2(sTypoAscender=880, sTypoDescender=-220, sTypoLineGap=0, usWinAscent=920, usWinDescent=280,
                sCapHeight=700, sxHeight=700, achVendID="TGTS", usWeightClass=500)
    fb.setupPost()
    ttf = OUT / "GateHubDisplay.ttf"
    fb.save(str(ttf))
    f = TTFont(str(ttf)); f.flavor = "woff2"; f.save(str(OUT / "GateHubDisplay.woff2"))
    print("glyphs:", len(order), "->", ttf.name, (OUT / "GateHubDisplay.woff2").stat().st_size, "bytes woff2")


if __name__ == "__main__":
    build()
