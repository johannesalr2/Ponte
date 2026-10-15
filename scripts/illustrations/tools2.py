"""Manutenção, elementos de máquinas e máquinas (parte 2)."""
import math
from lib import *


def lager():
    cx, cy = 300, 180
    b = []
    b.append(f'<circle cx="{cx}" cy="{cy}" r="130" {st(STEEL2)}/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="100" {st(WHITE)}/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="86" fill="none" stroke="{BRASS}" stroke-width="10"/>')
    for i in range(9):
        a = 2 * math.pi * i / 9
        b.append(circle(cx + 86 * math.cos(a), cy + 86 * math.sin(a), 15, SHADE))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="70" {st(STEEL)}/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="45" {st(WHITE)}/>')
    b.append(label('Außenring', 560, 60, cx + 105, cy - 66, 'start'))
    b.append(label('Kugel', 560, 130, cx + 86, cy, 'start'))
    b.append(label('Käfig', 560, 260, 381, 209, 'start'))
    b.append(label('Innenring', 560, 330, 341, 221, 'start'))
    return wrap('Rillenkugellager (rolamento de esferas)', '\n'.join(b), 350)


def welle():
    b = []
    segs = [(80, 160, 36), (160, 260, 52), (260, 440, 70), (440, 540, 52), (540, 640, 36)]
    for x1, x2, d in segs:
        b.append(rect(x1, 180 - d / 2, x2 - x1, d, STEEL, 2))
    b.append(rect(300, 147, 100, 14, DARK, 7, 1.5))                  # passfedernut
    b.append(line(70, 180, 650, 180, 1))
    b.append(f'<line x1="70" y1="180" x2="650" y2="180" stroke="{INK}" stroke-width="1" stroke-dasharray="14 4 3 4"/>')
    b.append(label('Passfedernut', 350, 80, 350, 147))
    b.append(label('Lagersitz', 210, 290, 210, 206))
    b.append(label('Wellenabsatz', 560, 290, 440, 210))
    return wrap('Welle (eixo)', '\n'.join(b))


def dichtung():
    b = []
    b.append(f'<circle cx="190" cy="180" r="95" {st(GRIP2)}/>')
    b.append(f'<circle cx="190" cy="180" r="75" {st(WHITE)}/>')
    b.append(path('M380 90 H620 Q640 90 640 110 V250 Q640 270 620 270 H380 Q360 270 360 250 V110 Q360 90 380 90 Z', '#c9a96e'))
    b.append(rect(420, 130, 160, 100, WHITE, 30))
    for x, y in ((385, 115), (615, 115), (385, 245), (615, 245)):
        b.append(circle(x, y, 9, WHITE))
    b.append(label('O-Ring', 190, 330, 190, 265))
    b.append(label('Flachdichtung', 500, 330, 500, 270))
    return wrap('Dichtungen (vedações)', '\n'.join(b), 350)


def drehmaschine():
    b = []
    b.append(rect(80, 230, 560, 34, STEEL2, 3))                      # bett
    b.append(rect(100, 264, 60, 70, SHADE))                          # pés
    b.append(rect(560, 264, 60, 70, SHADE))
    b.append(rect(80, 110, 140, 120, STEEL, 4))                      # spindelstock
    b.append(circle(130, 150, 8, SHADE))
    b.append(circle(170, 150, 8, SHADE))
    b.append(rect(220, 130, 34, 80, SHADE, 4))                       # futter
    for y in (138, 160, 182):
        b.append(rect(254, y, 14, 14, STEEL2, 1, 1.5))
    b.append(rect(254, 162, 260, 16, STEEL))                         # werkstück
    b.append(rect(500, 140, 110, 90, STEEL, 4))                      # reitstock
    b.append(poly([(500, 162), (480, 170), (500, 178)], SHADE))
    b.append(rect(330, 196, 120, 34, STEEL2, 3))                     # support
    b.append(rect(370, 176, 40, 22, SHADE, 2))
    b.append(poly([(380, 178), (395, 170), (400, 178)], DARK, 1.5))
    b.append(line(80, 242, 640, 242, 1.5))                           # leitspindel
    b.append(label('Spindelstock', 150, 70, 150, 110))
    b.append(label('Futter', 260, 70, 240, 130))
    b.append(label('Support', 390, 330, 390, 230))
    b.append(label('Reitstock', 580, 90, 560, 140))
    b.append(label('Bett', 260, 330, 260, 264))
    return wrap('Drehmaschine (torno)', '\n'.join(b), 350)


def bohrmaschine():
    b = []
    b.append(rect(160, 312, 320, 30, STEEL2, 4))                    # fuß
    b.append(rect(220, 60, 30, 252, STEEL))                         # säule
    b.append(rect(270, 250, 210, 20, STEEL2, 3))                    # bohrtisch
    b.append(rect(236, 244, 40, 30, SHADE, 2))                      # suporte da mesa
    b.append(path('M200 50 H470 Q490 50 490 70 V122 Q490 142 470 142 H200 Z', STEEL2))   # kopf
    b.append(rect(410, 18, 80, 34, SHADE, 6))                       # motor
    b.append(rect(392, 142, 24, 36, STEEL))                         # pinole
    b.append(poly([(386, 178), (422, 178), (416, 196), (392, 196)], SHADE))   # bohrfutter
    b.append(rect(400, 196, 8, 40, STEEL, 0, 1.5))                  # bohrer
    b.append(rod([(490, 100), (540, 100), (580, 140)], 6, SHADE))   # vorschubhebel
    b.append(circle(580, 140, 8, GRIP2))
    b.append(label('Bohrfutter', 600, 220, 418, 188, 'start'))
    b.append(label('Bohrtisch', 600, 290, 480, 260, 'start'))
    b.append(label('Säule', 120, 200, 220, 200, 'end'))
    b.append(label('Vorschubhebel', 700, 170, 572, 132, 'end'))
    return wrap('Säulenbohrmaschine (furadeira de coluna)', '\n'.join(b), 350)


def getriebe():
    b = []
    b.append(rect(170, 80, 380, 210, STEEL2, 10))
    b.append(rect(190, 100, 340, 170, WHITE, 6))
    b.append(path(gear_path(300, 185, 12, 28, 38), STEEL))
    b.append(circle(300, 185, 9, SHADE))
    b.append(path(gear_path(398, 185, 24, 60, 70, math.pi / 24), STEEL))
    b.append(circle(398, 185, 14, SHADE))
    b.append(rect(60, 177, 240, 16, STEEL, 2))                      # antriebswelle
    b.append(rect(398, 175, 264, 20, STEEL, 2))                     # abtriebswelle
    b.append(label('Gehäuse', 360, 50, 360, 82))
    b.append(label('Antriebswelle', 20, 335, 70, 201, 'start'))
    b.append(label('Abtriebswelle', 700, 335, 650, 201, 'end'))
    b.append(label('Zahnrad', 330, 330, 330, 230))
    return wrap('Getriebe (redutor)', '\n'.join(b), 350)


def kupplung():
    b = []
    b.append(rect(60, 166, 150, 28, STEEL))                         # welle links
    b.append(rect(510, 166, 150, 28, STEEL))
    b.append(rect(200, 116, 100, 128, STEEL2, 6))                   # nabe links
    b.append(rect(420, 116, 100, 128, STEEL2, 6))                   # nabe rechts
    b.append(rect(300, 120, 72, 38, STEEL2, 3))                     # klauen links
    b.append(rect(300, 202, 72, 38, STEEL2, 3))
    b.append(rect(348, 162, 72, 36, STEEL, 3))                      # klaue rechts
    b.append(rect(374, 120, 44, 38, '#e2b33c', 3))                  # zahnkranz (elastomer)
    b.append(rect(374, 202, 44, 38, '#e2b33c', 3))
    b.append(rect(302, 162, 44, 36, '#e2b33c', 3))
    b.append(label('Kupplungsnabe', 150, 70, 240, 120))
    b.append(label('Zahnkranz', 520, 70, 396, 124))
    b.append(label('Welle', 110, 270, 110, 194))
    b.append(label('Klaue', 360, 320, 336, 236))
    return wrap('Klauenkupplung (acoplamento de garras)', '\n'.join(b), 350)


def keilriemen():
    b = []
    b.append(circle(160, 180, 70, STEEL2))
    b.append(circle(160, 180, 18, SHADE))
    b.append(circle(470, 180, 110, STEEL2))
    b.append(circle(470, 180, 24, SHADE))
    # riemen (tangentes externas aproximadas)
    b.append(f'<path d="M160 104 L470 64" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<path d="M160 256 L470 296" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<circle cx="160" cy="180" r="76" fill="none" stroke="{INK}" stroke-width="12" stroke-dasharray="0 0"/>'.replace('stroke-dasharray="0 0"', 'clip-path="url(#lc)"'))
    b.append('<clipPath id="lc"><rect x="70" y="90" width="90" height="180"/></clipPath>')
    b.append('<clipPath id="rc"><rect x="470" y="50" width="130" height="260"/></clipPath>')
    b.append(f'<circle cx="470" cy="180" r="116" fill="none" stroke="{INK}" stroke-width="12" clip-path="url(#rc)"/>')
    # corte do riemen na canaleta
    b.append(poly([(630, 60), (700, 60), (690, 90), (640, 90)], GRIP2))
    b.append(text(665, 115, 'Querschnitt', 13, weight='500'))
    b.append(label('Riemenscheibe', 160, 330, 160, 250))
    b.append(label('Keilriemen', 330, 40, 320, 84))
    return wrap('Keilriemen (correia em V)', '\n'.join(b), 350)


def zahnrad():
    b = []
    b.append(path(gear_path(300, 180, 24, 120, 140), STEEL2))
    b.append(circle(300, 180, 60, STEEL))
    b.append(circle(300, 180, 30, WHITE))
    b.append(rect(292, 140, 16, 14, WHITE, 0, 1.5))
    b.append(label('Passfedernut', 560, 70, 306, 146, 'start'))
    b.append(label('Nabe', 560, 200, 356, 196, 'start'))
    b.append(label('Zahn', 560, 320, 400, 280, 'start'))
    return wrap('Stirnrad (engrenagem)', '\n'.join(b))


def zylinder():
    b = []
    b.append(rect(120, 140, 300, 80, STEEL, 6))                      # rohr
    b.append(rect(100, 130, 34, 100, STEEL2, 4))                     # deckel
    b.append(rect(406, 130, 34, 100, STEEL2, 4))
    for x, y in ((104, 132), (104, 216), (420, 132), (420, 216)):
        b.append(circle(x + 13, y + 6, 4, SHADE, 1))
    b.append(rect(440, 168, 180, 24, STEEL2, 3))                     # kolbenstange
    b.append(hexagon(630, 180, 16, 0, SHADE))
    b.append(rect(140, 112, 24, 18, BRASS, 2))                       # anschlüsse
    b.append(rect(380, 112, 24, 18, BRASS, 2))
    b.append(label('Zylinderrohr', 270, 300, 270, 220))
    b.append(label('Kolbenstange', 530, 300, 530, 192))
    b.append(label('Anschluss', 270, 60, 152, 112))
    return wrap('Pneumatikzylinder (cilindro pneumático)', '\n'.join(b))


def ventil():
    b = []
    b.append(rect(200, 210, 260, 80, BRASS, 6))                      # ventilkörper
    b.append(rect(140, 230, 60, 40, BRASS, 4))
    b.append(rect(460, 230, 60, 40, BRASS, 4))
    b.append(rect(270, 190, 120, 20, STEEL2, 2))
    b.append(rect(260, 80, 140, 110, GRIP2, 8))                      # magnetspule
    b.append(rect(400, 110, 50, 50, '#55656f', 4))                   # stecker
    b.append(text(330, 140, '24 V DC', 14, fill=WHITE))
    b.append(label('Magnetspule', 140, 70, 262, 120, 'end'))
    b.append(label('Ventilkörper', 330, 340, 330, 290))
    b.append(label('Anschluss', 590, 320, 500, 270))
    return wrap('Magnetventil (válvula solenoide)', '\n'.join(b), 350)


def pumpe():
    b = []
    b.append(rect(70, 290, 580, 22, STEEL2, 3))                      # grundplatte
    b.append(path('M120 260 Q90 180 150 120 Q210 70 280 100 L300 108 V280 H140 Z', '#5b8db0'))   # spiralgehäuse
    b.append(rect(240, 40, 50, 70, '#5b8db0', 3))                    # druckstutzen
    b.append(rect(230, 34, 70, 14, '#5b8db0', 2))
    b.append(circle(195, 190, 38, '#4a7a9c'))                        # saugstutzen (frontal)
    b.append(circle(195, 190, 24, WHITE))
    b.append(rect(300, 170, 70, 30, STEEL))                          # lagerträger / welle
    b.append(rect(370, 150, 30, 70, '#e2b33c', 3))                   # kupplung
    b.append(rect(400, 120, 220, 130, '#5b8db0', 10))                # motor
    for y in range(132, 244, 12):
        b.append(line(410, y, 610, y, 1.2, '#2f5470'))
    b.append(rect(470, 98, 70, 24, '#4a7a9c', 3))
    b.append(label('Druckstutzen', 340, 40, 290, 60, 'start'))
    b.append(label('Saugstutzen', 70, 330, 180, 220, 'start'))
    b.append(label('Spiralgehäuse', 330, 340, 260, 250))
    b.append(label('Motor', 660, 60, 580, 124))
    return wrap('Kreiselpumpe (bomba centrífuga)', '\n'.join(b), 350)


def motor():
    b = []
    b.append(rect(170, 110, 330, 150, '#5b8db0', 12))
    for y in range(122, 252, 12):
        b.append(line(180, y, 490, y, 1.2, '#2f5470'))
    b.append(rect(270, 72, 110, 40, '#4a7a9c', 4))                   # klemmenkasten
    b.append(path('M500 120 H580 Q610 120 610 150 V220 Q610 250 580 250 H500 Z', '#4a7a9c'))   # lüfterhaube
    for x in range(520, 600, 10):
        b.append(line(x, 136, x, 234, 1, '#2f5470'))
    b.append(rect(90, 170, 80, 30, STEEL))                           # welle
    b.append(rect(130, 146, 40, 78, '#4a7a9c', 4))                   # lagerschild
    b.append(rect(200, 260, 60, 24, '#4a7a9c', 2))
    b.append(rect(410, 260, 60, 24, '#4a7a9c', 2))
    b.append(label('Klemmenkasten', 330, 40, 330, 72))
    b.append(label('Kühlrippen', 340, 330, 340, 250))
    b.append(label('Welle', 110, 260, 110, 200))
    b.append(label('Lüfterhaube', 640, 330, 590, 240, 'end'))
    return wrap('Drehstrommotor (motor trifásico)', '\n'.join(b), 350)


def span():
    """Cavacos: um em hélice (Wendelspan) e alguns curtos curvados."""
    b = []
    def coil(x0, y0, turns, pitch, ry, rx):
        back, front = [], []
        for i in range(turns):
            x = x0 + i * pitch
            back.append(f'M{x:.1f} {y0 - ry} A{rx} {ry} 0 0 1 {x:.1f} {y0 + ry}')
            front.append(f'M{x:.1f} {y0 + ry} A{rx} {ry} 0 0 1 {x + pitch:.1f} {y0 - ry}')
        out = []
        for d, col in ((' '.join(back), '#9aa6af'), (' '.join(front), '#c9d2d8')):
            out.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>')
            out.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="7" stroke-linecap="round"/>')
        return ''.join(out)
    b.append(coil(110, 150, 9, 30, 46, 14))
    def comma(cx, cy, r, rot):
        d = (f'M{cx + r * math.cos(rot):.1f} {cy + r * math.sin(rot):.1f} '
             f'A{r} {r} 0 1 1 {cx + r * math.cos(rot + 4.4):.1f} {cy + r * math.sin(rot + 4.4):.1f}')
        return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
                f'<path d="{d}" fill="none" stroke="#c9d2d8" stroke-width="7" stroke-linecap="round"/>')
    for cx, cy, r, rot in ((170, 290, 26, 0.3), (300, 300, 20, 2.0), (420, 285, 30, 4.0), (560, 300, 22, 1.2)):
        b.append(comma(cx, cy, r, rot))
    b.append(text(260, 60, 'Wendelspan', 16, weight='500'))
    b.append(text(560, 250, 'Bröckelspäne', 16, weight='500'))
    return wrap('Späne (cavacos)', '\n'.join(b), 350)


def schraube():
    b = []
    b.append(rect(118, 130, 64, 100, STEEL2, 2))                     # cabeça vista de lado
    b.append(rect(182, 156, 140, 48, STEEL))                         # schaft
    top = [(322, 152)]; bot = [(322, 208)]
    x = 322
    while x < 600:
        top += [(x + 5, 148), (x + 10, 152)]
        bot += [(x + 5, 212), (x + 10, 208)]
        x += 10
    b.append(poly(top + [(610, 160), (610, 200)] + list(reversed(bot)), STEEL))
    b.append(text(460, 250, 'M10 × 40', 18))
    b.append(label('Kopf', 150, 70, 150, 130))
    b.append(label('Schaft', 252, 300, 252, 204))
    b.append(label('Gewinde', 470, 90, 470, 148))
    return wrap('Sechskantschraube (parafuso sextavado)', '\n'.join(b))


def mutter():
    b = []
    b.append(hexagon(230, 180, 100, 0, STEEL2))
    b.append(circle(230, 180, 56, STEEL))
    b.append(f'<circle cx="230" cy="180" r="48" fill="{WHITE}" stroke="{INK}" stroke-width="1.5" stroke-dasharray="6 4"/>')
    b.append(circle(230, 180, 44, WHITE, 1.5))
    b.append(rect(440, 94, 80, 172, STEEL2, 2))                      # vista lateral
    b.append(line(440, 137, 520, 137, 1.2))
    b.append(line(440, 223, 520, 223, 1.2))
    b.append(text(480, 300, 'M10', 18))
    return wrap('Sechskantmutter (porca sextavada)', '\n'.join(b))


def unterlegscheibe():
    b = []
    b.append(circle(240, 180, 100, STEEL2))
    b.append(circle(240, 180, 44, WHITE))
    b.append(rect(450, 80, 18, 200, STEEL2, 2))
    b.append(text(240, 320, 'ISO 7089 – 10', 16))
    return wrap('Unterlegscheibe (arruela)', '\n'.join(b), 350)


def passfeder():
    b = []
    b.append(rect(120, 150, 480, 80, STEEL, 2))                      # welle
    b.append(rect(260, 150, 200, 22, WHITE, 10, 2))                  # nut
    b.append(rect(260, 70, 200, 30, '#e2b33c', 14))                  # passfeder fora
    b.append(rect(300, 150, 0.01, 0.01, 'none', 0, 0))
    b.append(f'<path d="M360 104 V140" stroke="{ACC}" stroke-width="2" marker-end="url(#ar)"/>')
    b.append(f'<defs><marker id="ar" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="{ACC}"/></marker></defs>')
    b.append(label('Passfeder', 600, 60, 460, 82, 'start'))
    b.append(label('Passfedernut', 620, 300, 440, 162))
    b.append(label('Welle', 160, 300, 180, 230))
    return wrap('Passfeder (chaveta)', '\n'.join(b))


def sicherungsring():
    b = []
    cx, cy = 300, 180
    a0, a1 = math.radians(-70), math.radians(250)
    R1, R2 = 110, 86
    p = (f'M{cx + R1 * math.cos(a0):.1f} {cy + R1 * math.sin(a0):.1f} A{R1} {R1} 0 1 1 {cx + R1 * math.cos(a1):.1f} {cy + R1 * math.sin(a1):.1f} '
         f'L{cx + R2 * math.cos(a1):.1f} {cy + R2 * math.sin(a1):.1f} A{R2} {R2} 0 1 0 {cx + R2 * math.cos(a0):.1f} {cy + R2 * math.sin(a0):.1f} Z')
    b.append(path(p, GRIP2))
    for a in (a0, a1):
        ex, ey = cx + 110 * math.cos(a), cy + 110 * math.sin(a) - 8
        b.append(circle(ex, ey, 20, GRIP2))
        b.append(circle(ex, ey, 7, WHITE))
    b.append(text(cx, 340, 'DIN 471 (Welle)', 16))
    return wrap('Sicherungsring (anel elástico)', '\n'.join(b), 360)


DRAWINGS = {
    'im-lager': lager, 'im-welle': welle, 'im-dichtung': dichtung, 'im-drehmaschine': drehmaschine,
    'im-bohrmaschine': bohrmaschine, 'im-getriebe': getriebe, 'im-kupplung': kupplung,
    'im-keilriemen': keilriemen, 'im-zahnrad': zahnrad, 'im-zylinder': zylinder, 'im-ventil': ventil,
    'im-pumpe': pumpe, 'im-motor': motor, 'im-span': span, 'im-schraube': schraube, 'im-mutter': mutter,
    'im-unterlegscheibe': unterlegscheibe, 'im-passfeder': passfeder, 'im-sicherungsring': sicherungsring,
}
