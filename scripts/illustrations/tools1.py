"""Ferramentas manuais e instrumentos de medição (parte 1)."""
import math
from lib import *


def messschieber():
    PX = 4.0; X0 = 110; OPEN = 17.5 * PX; XS = X0 + OPEN; D = 16
    STEP = 39 / 20 * PX
    SR = XS + D + 20 * STEP + 12
    b = []
    b.append(rect(590, 175, 12 + OPEN, 5, SHADE))
    b.append(rect(60, 148, 540, 44, STEEL, 3))
    b.append(path('M60 192 L60 296 Q60 304 70 304 L92 304 Q104 304 110 290 L110 192 Z'))
    b.append(path('M86 148 L100 98 Q104 92 110 98 L110 148 Z'))
    t = []
    for i in range(116):
        x = X0 + D + i * PX
        hgt = 14 if i % 10 == 0 else (10 if i % 5 == 0 else 6)
        t.append(line(x, 152, x, 152 + hgt, 1.2))
        if i % 10 == 0:
            t.append(text(x, 176, str(i // 10), 10, weight='400'))
    b.append(''.join(t))
    b.append(line(64, 189, XS - 6, 189, 2, WHITE))
    outer = f'M{XS:.1f} 140 H{SR:.1f} Q{SR+8:.1f} 140 {SR+8:.1f} 148 V204 Q{SR+8:.1f} 212 {SR:.1f} 212 H{XS:.1f} Z'
    hole = f'M{XS+6:.1f} 150 H{SR+2:.1f} V178 H{XS+6:.1f} Z'
    b.append(f'<path d="{outer} {hole}" {st(STEEL2)} fill-rule="evenodd"/>')
    b.append(rect(XS + 4, 179, SR - XS - 2, 29, GLASS, 2))
    b.append(path(f'M{XS:.1f} 212 L{XS:.1f} 290 Q{XS+6:.1f} 304 {XS+18:.1f} 304 L{XS+30:.1f} 304 Q{XS+40:.1f} 304 {XS+40:.1f} 294 L{XS+46:.1f} 212 Z', STEEL2))
    b.append(path(f'M{XS:.1f} 140 L{XS:.1f} 98 Q{XS+6:.1f} 92 {XS+10:.1f} 98 L{XS+24:.1f} 140 Z', STEEL2))
    b.append(rect(XS + 104, 122, 22, 18, SHADE, 3))
    b.append(rect(XS + 98, 114, 34, 10, SHADE, 4))
    b.append(circle(SR - 18, 224, 11, SHADE))
    b.append(''.join(line(SR - 18 + 7 * math.cos(a * math.pi / 6), 224 + 7 * math.sin(a * math.pi / 6),
                          SR - 18 + 11 * math.cos(a * math.pi / 6), 224 + 11 * math.sin(a * math.pi / 6), 1) for a in range(12)))
    v = []
    for k in range(21):
        x = XS + D + k * STEP
        hgt = 12 if k % 10 == 0 else (9 if k % 2 == 0 else 6)
        v.append(line(x, 182, x, 182 + hgt, 1.2))
    for k, l in ((0, '0'), (10, '5'), (20, '10')):
        v.append(text(XS + D + k * STEP, 204, l, 9, weight='400'))
    b.append(''.join(v))
    b.append(label('Hauptskala', 500, 112, 500, 158))
    b.append(label('Nonius', 300, 262, 288, 190))
    b.append(label('Feststellschraube', 340, 82, XS + 115, 124, 'start'))
    b.append(label('Innenmessschnäbel', 20, 58, 104, 104, 'start'))
    b.append(label('Außenmessschnäbel', 220, 330, 96, 262, 'start'))
    b.append(label('Tiefenmessstange', 600, 262, 640, 178))
    return wrap('Messschieber (paquímetro)', '\n'.join(b), 350)


def buegelmessschraube():
    b = []
    # bügel (arco em C) com placa isolante
    b.append(path('M80 120 H140 V176 H128 V232 Q128 262 168 262 H262 Q302 262 302 232 V176 H290 V120 H350 V240 Q350 316 270 316 H160 Q80 316 80 240 Z', STEEL2))
    b.append(path('M104 196 Q104 290 168 290 H262 Q326 290 326 210', 'none', 0))
    b.append(f'<path d="M150 272 H280 Q308 272 312 244" fill="none" stroke="{DARK}" stroke-width="10" stroke-linecap="round"/>')
    b.append(rect(140, 140, 30, 22, SHADE))                 # amboss
    b.append(rect(208, 141, 82, 20, STEEL))                 # messspindel
    b.append(rect(350, 128, 132, 46, STEEL, 2))            # skalenhülse
    b.append(line(356, 151, 476, 151, 1.5))
    for i in range(0, 24):
        x = 360 + i * 5
        b.append(line(x, 151, x, 143 if i % 2 == 0 else 159, 1.2) if True else '')
    for i, x in enumerate(range(360, 480, 20)):
        b.append(text(x, 140, str(i * 2), 9, weight='400'))
    b.append(path('M482 112 H560 Q568 112 568 120 V182 Q568 190 560 190 H482 L472 172 V130 Z', STEEL2))   # trommel
    for k in range(9):
        y = 132 + k * 5
        b.append(line(472, y, 482 + (8 if k % 5 == 0 else 4), y, 1.2))
    for x in range(514, 564, 5):
        b.append(line(x, 116, x, 186, 1))
    b.append(rect(568, 130, 52, 42, SHADE, 4))              # ratsche
    for x in range(576, 616, 5):
        b.append(line(x, 134, x, 168, 1))
    b.append(rect(296, 92, 14, 30, SHADE, 3))              # klemmhebel
    b.append(label('Bügel', 210, 345, 210, 314))
    b.append(label('Amboss', 120, 82, 152, 140, 'end'))
    b.append(label('Messspindel', 232, 82, 250, 141))
    b.append(label('Skalenhülse', 420, 82, 420, 128))
    b.append(label('Skalentrommel', 520, 240, 520, 190))
    b.append(label('Ratsche', 660, 110, 600, 131))
    return wrap('Bügelmessschraube (micrômetro)', '\n'.join(b), 360)


def messuhr():
    cx, cy, R = 300, 150, 108
    b = []
    b.append(rect(cx - 14, cy - R - 26, 28, 30, SHADE, 4))         # lasche
    b.append(circle(cx, cy, R + 8, STEEL2))
    b.append(circle(cx, cy, R, WHITE))
    for i in range(100):
        a = -math.pi / 2 + 2 * math.pi * i / 100
        r2 = R - (14 if i % 10 == 0 else 9 if i % 5 == 0 else 6)
        b.append(line(cx + (R - 3) * math.cos(a), cy + (R - 3) * math.sin(a), cx + r2 * math.cos(a), cy + r2 * math.sin(a), 1.2))
    for k in range(10):
        a = -math.pi / 2 + 2 * math.pi * k / 10
        b.append(text(cx + (R - 28) * math.cos(a), cy + (R - 28) * math.sin(a) + 5, str(k * 10), 13, weight='500'))
    b.append(circle(cx, cy + 40, 20, GLASS, 1.5))                   # umdrehungszähler
    for k in range(10):
        a = -math.pi / 2 + 2 * math.pi * k / 10
        b.append(line(cx + 18 * math.cos(a), cy + 40 + 18 * math.sin(a), cx + 14 * math.cos(a), cy + 40 + 14 * math.sin(a), 1))
    b.append(line(cx, cy + 40, cx + 9, cy + 32, 2))
    a = -math.pi / 2 + 2 * math.pi * 0.27
    b.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + (R - 12) * math.cos(a):.1f}" y2="{cy + (R - 12) * math.sin(a):.1f}" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    b.append(circle(cx, cy, 7, INK, 1))
    b.append(rect(cx - 13, cy + R + 8, 26, 50, STEEL))              # einspannschaft
    b.append(rect(cx - 5, cy + R + 58, 10, 30, STEEL2))             # messbolzen
    b.append(circle(cx, cy + R + 94, 8, SHADE))                     # messeinsatz
    b.append(label('Zifferblatt', 520, 70, cx + 70, cy - 60, 'start'))
    b.append(label('Zeiger', 520, 130, cx + 55, cy + 12, 'start'))
    b.append(label('Einspannschaft', 520, 280, cx + 13, cy + R + 30, 'start'))
    b.append(label('Messbolzen', 90, 330, cx - 5, cy + R + 72, 'start'))
    b.append(label('Messeinsatz', 520, 352, cx + 8, cy + R + 94, 'start'))
    return wrap('Messuhr (relógio comparador)', '\n'.join(b), 370)


def drehmomentschluessel():
    b = []
    b.append(rect(120, 150, 470, 40, STEEL, 20))                    # rohr
    b.append(circle(110, 170, 40, STEEL2))                          # ratschenkopf
    b.append(rect(100, 160, 20, 20, SHADE, 2))                      # vierkant (frontal)
    b.append(rect(330, 154, 120, 32, WHITE, 4))                     # skalenfenster
    for i in range(13):
        x = 336 + i * 9
        b.append(line(x, 160, x, 170 if i % 2 == 0 else 166, 1.2))
    for i, v in enumerate(['20', '40', '60', '80']):
        b.append(text(336 + i * 36, 182, v, 10, weight='400'))
    b.append(rect(470, 146, 160, 48, GRIP2, 22))                    # handgriff
    for i in range(8):
        b.append(line(490 + i * 16, 152, 490 + i * 16, 188, 1.5, '#55656f'))
    b.append(rect(628, 154, 30, 32, STEEL2, 6))                     # einstellknopf
    b.append(label('Vierkantantrieb', 110, 80, 109, 147))
    b.append(label('Skala', 390, 90, 390, 154))
    b.append(label('Handgriff', 550, 270, 550, 194))
    return wrap('Drehmomentschlüssel (torquímetro)', '\n'.join(b))


def _open_head(cx, cy, R, w, depth, rot_deg):
    """Cabeça de chave de boca: círculo com abertura de largura w ao longo do eixo local +x."""
    hw = w / 2
    x0 = math.sqrt(R * R - hw * hw)
    d = (f'M{x0:.1f} {hw:.1f} A{R} {R} 0 1 1 {x0:.1f} {-hw:.1f} L{-depth + hw:.1f} {-hw:.1f} '
         f'A{hw} {hw} 0 0 0 {-depth + hw:.1f} {hw:.1f} Z')
    return f'<g transform="translate({cx} {cy}) rotate({rot_deg})">{path(d, STEEL2)}</g>'


def gabelschluessel():
    b = []
    b.append(poly([(150, 158), (560, 162), (560, 196), (150, 200)], STEEL2))
    b.append(_open_head(120, 180, 52, 44, 12, 195))
    b.append(_open_head(600, 180, 46, 36, 10, -15))
    b.append(text(355, 185, '13 × 17', 16))
    b.append(rect(250, 168, 70, 24, 'none', 6, 1.2))
    return wrap('Gabelschlüssel (chave de boca)', '\n'.join(b))


def innensechskantschluessel():
    b = []
    b.append(rod([(160, 230), (520, 230), (556, 194), (556, 110)], 24, STEEL2))
    b.append(hexagon(150, 230, 13, math.pi / 6, SHADE))
    b.append(hexagon(556, 104, 13, 0, SHADE))
    b.append(text(340, 280, 'SW 6', 18))
    return wrap('Innensechskantschlüssel (chave Allen)', '\n'.join(b))


def feile():
    b = []
    b.append(path('M90 150 Q90 132 120 132 H250 Q262 132 262 146 V194 Q262 208 250 208 H120 Q90 208 90 190 Z', WOOD))
    b.append(rect(262, 156, 22, 28, SHADE))                         # zwinge
    b.append(poly([(284, 148), (600, 156), (640, 166), (640, 174), (600, 184), (284, 192)], STEEL2))
    b.append(hatch_poly([(290, 150), (600, 157), (636, 166), (636, 174), (600, 183), (290, 190)], 8))
    b.append(poly([(284, 148), (600, 156), (640, 166), (640, 174), (600, 184), (284, 192)], 'none'))
    b.append(label('Heft', 170, 100, 170, 132))
    b.append(label('Hieb', 470, 260, 470, 186))
    b.append(label('Spitze', 660, 110, 636, 166))
    return wrap('Feile (lima)', '\n'.join(b))


def gewindebohrer():
    b = []
    b.append(rect(90, 156, 40, 28, SHADE))                          # vierkant
    b.append(rect(130, 158, 210, 24, STEEL))                        # schaft
    # gewindeteil com dentes
    top = [(340, 150)]
    bot = [(340, 190)]
    x = 340
    while x < 560:
        top += [(x + 4, 146), (x + 8, 150)]
        bot += [(x + 4, 194), (x + 8, 190)]
        x += 8
    pts = top + [(600, 160), (600, 180)] + list(reversed(bot))
    b.append(poly(pts, STEEL2))
    b.append(rect(350, 163, 230, 14, DARK, 6, 1))                   # spannut
    b.append(label('Vierkant', 110, 100, 110, 156))
    b.append(label('Schaft', 230, 250, 230, 182))
    b.append(label('Spannut', 450, 100, 450, 166))
    b.append(label('Anschnitt', 610, 250, 592, 176))
    b.append(text(470, 230, 'M8', 18))
    return wrap('Gewindebohrer (macho de roscar)', '\n'.join(b))


def wasserwaage():
    b = []
    b.append(rect(60, 140, 600, 64, '#d9534f' if False else STEEL2, 6))
    b.append(rect(70, 150, 580, 44, STEEL, 4))
    b.append(rect(300, 158, 120, 28, GLASS, 14))                    # libelle horizontal
    b.append(rect(304, 162, 112, 20, '#cfe39a', 10, 1))
    b.append(f'<ellipse cx="368" cy="172" rx="15" ry="7" fill="{WHITE}" stroke="{INK}" stroke-width="1"/>')
    b.append(line(344, 160, 344, 184, 1.5))
    b.append(line(392, 160, 392, 184, 1.5))
    b.append(circle(110, 172, 20, GLASS))                           # libelle vertical
    b.append(rect(103, 156, 14, 32, '#cfe39a', 7, 1))
    b.append(f'<ellipse cx="110" cy="170" rx="5" ry="8" fill="{WHITE}" stroke="{INK}" stroke-width="1"/>')
    b.append(label('Libelle', 360, 90, 360, 160))
    return wrap('Wasserwaage (nível de bolha)', '\n'.join(b))


def schraubendreher():
    b = []
    b.append(path('M80 150 Q80 140 92 140 H250 Q268 140 276 156 V184 Q268 200 250 200 H92 Q80 200 80 190 Z', GRIP))
    b.append(path('M150 140 H250 Q268 140 276 156 V184 Q268 200 250 200 H150 Z', GRIP2))
    b.append(rect(276, 162, 330, 16, STEEL))                        # klinge
    b.append(poly([(606, 162), (650, 166), (650, 174), (606, 178)], STEEL2))
    b.append(label('Griff', 170, 100, 170, 140))
    b.append(label('Klinge', 440, 250, 440, 178))
    b.append(label('Spitze', 640, 110, 645, 166))
    return wrap('Schraubendreher (chave de fenda)', '\n'.join(b))


def zange():
    b = []
    b.append(path('M330 170 Q430 150 640 110 L648 132 Q440 178 340 190 Z', GRIP))
    b.append(path('M330 190 Q430 210 640 250 L648 228 Q440 182 340 170 Z', GRIP))
    b.append(path('M100 180 Q130 156 220 152 Q300 148 336 168 L336 192 Q300 212 220 208 Q130 204 100 180 Z', STEEL2))
    zig = 'M112 180 ' + ' '.join(f'L{x + 4} {176 if (x // 8) % 2 else 184}' for x in range(112, 200, 8))
    b.append(f'<path d="{zig}" fill="none" stroke="{INK}" stroke-width="1.5"/>')
    b.append(line(200, 180, 236, 180, 2))
    b.append(path('M236 180 Q262 166 292 172 Q300 180 292 188 Q262 194 236 180 Z', WHITE, 1.5))
    b.append(circle(318, 180, 14, SHADE))
    b.append(circle(318, 180, 4, INK, 1))
    b.append(label('Greifbacken', 150, 110, 160, 172))
    b.append(label('Schneide', 260, 270, 266, 186))
    b.append(label('Gelenk', 340, 110, 318, 166))
    b.append(label('Griffe', 560, 320, 560, 236))
    return wrap('Kombizange (alicate universal)', '\n'.join(b))


def hammer():
    b = []
    b.append(path('M335 150 H380 V330 Q380 340 370 340 H345 Q335 340 335 330 Z', WOOD))     # stiel
    b.append(path('M180 90 H470 L560 112 V138 L470 150 H180 Q170 150 170 140 V100 Q170 90 180 90 Z', STEEL2))
    b.append(rect(160, 92, 16, 56, SHADE, 2))                        # bahn
    b.append(line(470, 90, 470, 150, 1.2))
    b.append(rect(350, 90, 16, 60, WOOD, 1, 1.2))                    # keil
    b.append(label('Bahn', 110, 60, 166, 104, 'end'))
    b.append(label('Finne', 610, 70, 552, 122))
    b.append(label('Kopf', 280, 210, 280, 148))
    b.append(label('Stiel', 470, 280, 380, 280, 'start'))
    return wrap('Schlosserhammer (martelo)', '\n'.join(b), 360)


def schraubstock():
    b = []
    b.append(rect(120, 270, 430, 30, STEEL2, 4))                     # grundplatte
    b.append(path('M150 270 V170 H250 V120 H300 V270 Z', STEEL2))    # fester backen
    b.append(path('M360 270 V160 H400 V120 H450 V205 H540 V270 Z', STEEL))   # beweglicher backen
    b.append(rect(286, 112, 14, 64, SHADE, 1))                       # spannbacken (pastilhas)
    b.append(rect(400, 112, 14, 64, SHADE, 1))
    b.append(rect(300, 225, 330, 16, STEEL2, 3))                     # spindel
    for x in range(312, 360, 6):
        b.append(line(x, 225, x + 3, 241, 1))
    b.append(rect(630, 160, 14, 140, SHADE, 7))                      # handhebel
    b.append(circle(637, 160, 10, SHADE))
    b.append(circle(637, 300, 10, SHADE))
    b.append(label('Spannbacken', 350, 70, 293, 130))
    b.append(label('Spindel', 590, 340, 520, 241))
    b.append(label('Grundplatte', 190, 340, 190, 300))
    b.append(label('Handhebel', 670, 110, 640, 170, 'end'))
    return wrap('Schraubstock (morsa)', '\n'.join(b), 360)


def buegelsaege():
    b = []
    b.append(rod([(150, 200), (150, 110), (560, 110), (560, 200)], 14, STEEL2))     # bügel
    b.append(rect(140, 196, 430, 16, STEEL))                        # sägeblatt
    teeth = 'M140 212 ' + ' '.join(f'L{x + 4} 218 L{x + 8} 212' for x in range(140, 570, 8))
    b.append(path(teeth + ' Z', STEEL, 1.2))
    b.append(path('M556 192 H600 Q614 192 616 206 L630 286 Q632 300 618 300 H596 Q584 300 582 288 L572 226 Q568 212 556 212 Z', GRIP))   # griff
    b.append(rect(126, 192, 18, 22, SHADE, 3))                      # spannmutter
    b.append(label('Bügel', 360, 70, 360, 110))
    b.append(label('Sägeblatt', 330, 280, 330, 214))
    b.append(label('Griff', 690, 330, 606, 270, 'end'))
    return wrap('Bügelsäge (arco de serra)', '\n'.join(b))


def koerner():
    b = []
    b.append(rect(170, 156, 330, 28, STEEL2, 4))
    b.append(knurl(240, 158, 200, 24, 6))
    b.append(poly([(500, 158), (580, 166), (610, 170), (580, 174), (500, 182)], STEEL))
    return wrap('Körner (punção de centro)', '\n'.join(b))


def reissnadel():
    b = []
    b.append(rect(160, 162, 300, 16, STEEL2, 6))
    b.append(knurl(240, 163, 140, 14, 5))
    b.append(poly([(460, 163), (620, 169), (630, 170), (620, 171), (460, 177)], STEEL))
    b.append(poly([(160, 163), (110, 169), (100, 170), (110, 171), (160, 177)], STEEL))
    return wrap('Reißnadel (riscador)', '\n'.join(b))


def meissel():
    b = []
    b.append(path('M160 154 Q140 150 140 170 Q140 190 160 186 Z', SHADE))        # kopf
    b.append(rect(160, 154, 340, 32, STEEL2, 3))
    b.append(poly([(500, 154), (610, 166), (612, 174), (500, 186)], STEEL))
    b.append(label('Kopf', 140, 110, 148, 162))
    b.append(label('Schneide', 610, 240, 610, 172))
    return wrap('Flachmeißel (talhadeira)', '\n'.join(b))


def reibahle():
    b = []
    b.append(rect(90, 157, 40, 26, SHADE))
    b.append(rect(130, 159, 230, 22, STEEL))
    b.append(poly([(360, 152), (580, 152), (600, 162), (600, 178), (580, 188), (360, 188)], STEEL2))
    for y in (158, 166, 174, 182):
        b.append(line(368, y, 582, y, 1.2))
    b.append(label('Vierkant', 110, 100, 110, 157))
    b.append(label('Schaft', 245, 250, 245, 181))
    b.append(label('Schneidteil', 470, 100, 470, 152))
    return wrap('Reibahle (alargador)', '\n'.join(b))


def senker():
    b = []
    b.append(rect(130, 158, 260, 24, STEEL))
    b.append(poly([(390, 120), (450, 120), (520, 170), (450, 220), (390, 220)], STEEL2))
    b.append(line(420, 124, 488, 170, 1.5))
    b.append(line(420, 216, 488, 170, 1.5))
    b.append(line(405, 170, 515, 170, 1.2))
    b.append(f'<path d="M560 130 A70 70 0 0 1 560 210" fill="none" stroke="{ACC}" stroke-width="1.5"/>')
    b.append(text(600, 176, '90°', 18))
    return wrap('Kegelsenker (escareador)', '\n'.join(b))


def spiralbohrer():
    b = []
    b.append(rect(90, 158, 210, 24, STEEL))
    b.append(poly([(300, 156), (560, 156), (600, 170), (560, 184), (300, 184)], STEEL2))
    for k in range(9):
        x = 310 + k * 28
        b.append(path(f'M{x} 184 Q{x + 16} 170 {x + 22} 156 L{x + 32} 156 Q{x + 26} 170 {x + 10} 184 Z', DARK, 1))
    b.append(label('Schaft', 195, 250, 195, 182))
    b.append(label('Spannut', 430, 100, 430, 160))
    b.append(label('Spitze 118°', 600, 260, 594, 170))
    return wrap('Spiralbohrer (broca helicoidal)', '\n'.join(b))


def _star12(cx, cy, r1, r2, fill=WHITE):
    pts = []
    for i in range(24):
        r = r1 if i % 2 == 0 else r2
        a = math.pi * i / 12
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly(pts, fill, 1.5)


def ringschluessel():
    b = []
    b.append(path('M150 160 Q240 140 360 150 Q480 140 570 160 L570 196 Q480 220 360 210 Q240 220 150 196 Z', STEEL2))
    b.append(circle(130, 178, 46, STEEL2))
    b.append(_star12(130, 178, 26, 22))
    b.append(circle(590, 178, 42, STEEL2))
    b.append(_star12(590, 178, 22, 19))
    b.append(text(360, 186, '17 × 13', 16))
    return wrap('Ringschlüssel (chave estrela)', '\n'.join(b))


def ratsche():
    b = []
    b.append(rect(200, 158, 400, 34, GRIP2, 17))
    b.append(rect(170, 162, 80, 26, STEEL2, 6))
    b.append(circle(150, 175, 48, STEEL2))
    b.append(rect(136, 161, 28, 28, SHADE, 2))
    b.append(path('M180 132 Q196 118 212 130 L200 146 Z', SHADE))
    b.append(label('Vierkant', 110, 300, 146, 182))
    b.append(label('Umschalthebel', 260, 90, 200, 132))
    b.append(label('Griff', 470, 260, 470, 192))
    return wrap('Ratsche (catraca)', '\n'.join(b))


def abzieher():
    b = []
    b.append(rect(346, 286, 28, 54, STEEL2))                        # eixo
    b.append(rect(250, 246, 220, 40, SHADE, 6))                     # polia (peça)
    b.append(rect(240, 90, 240, 32, STEEL2, 6))                     # traverse
    b.append(rect(352, 40, 16, 206, STEEL))                         # spindel
    for y in range(130, 240, 8):
        b.append(line(352, y, 368, y + 4, 1))
    b.append(hexagon(360, 34, 18, 0, SHADE))
    b.append(path('M250 106 Q220 110 220 140 V300 L262 300 L262 288 L238 288 V140 Q238 122 254 122 Z', STEEL))
    b.append(path('M470 106 Q500 110 500 140 V300 L458 300 L458 288 L482 288 V140 Q482 122 466 122 Z', STEEL))
    b.append(label('Spindel', 150, 60, 352, 170, 'start'))
    b.append(label('Traverse', 600, 60, 470, 100))
    b.append(label('Haken', 130, 220, 220, 220, 'end'))
    b.append(label('Werkstück', 600, 230, 470, 266))
    return wrap('Abzieher (sacador)', '\n'.join(b), 350)


def grenzlehrdorn():
    b = []
    b.append(rect(270, 150, 180, 44, GRIP2, 8))
    b.append(text(360, 178, '20 H7', 16, fill=WHITE))
    b.append(rect(140, 156, 130, 32, STEEL))                         # gutseite
    b.append(rect(450, 156, 70, 32, STEEL))                          # ausschussseite
    b.append(rect(456, 150, 14, 44, '#c0392b', 2))
    b.append(label('Gutseite', 200, 110, 200, 156))
    b.append(label('Ausschussseite', 520, 250, 500, 188))
    return wrap('Grenzlehrdorn (calibrador tampão)', '\n'.join(b))


def grenzrachenlehre():
    b = []
    b.append(path('M180 70 H540 Q600 70 600 130 V290 H500 V170 H220 V290 H120 V130 Q120 70 180 70 Z', STEEL2))
    b.append(rect(482, 172, 18, 116, SHADE))                        # encosto fixo
    b.append(rect(220, 236, 18, 52, SHADE))                         # gut (na entrada)
    b.append(rect(220, 172, 30, 52, '#c0392b'))                     # ausschuss (mais estreito, por dentro)
    b.append(text(420, 128, '25 g6', 22))
    b.append(label('Gutseite', 360, 338, 232, 270))
    b.append(label('Ausschussseite', 365, 250, 240, 200))
    return wrap('Grenzrachenlehre (calibrador de boca)', '\n'.join(b), 350)


def parallelendmass():
    b = []
    sizes = [(80, 60, '1,005'), (180, 90, '10'), (300, 130, '25'), (460, 170, '50')]
    for x, h, s in sizes:
        b.append(rect(x, 260 - h, 100, h, STEEL, 2))
        b.append(rect(x + 100, 260 - h - 10, 14, h, SHADE, 1))
        b.append(text(x + 50, 260 - h / 2 + 6, s, 16))
    b.append(line(60, 262, 660, 262, 2))
    return wrap('Parallelendmaße (blocos-padrão)', '\n'.join(b))


def fuehlerlehre():
    b = []
    vals = ['0,05', '0,10', '0,15', '0,20', '0,30', '0,40', '0,50']
    for i, v in enumerate(vals):
        ang = -24 + i * 8
        b.append(f'<g transform="rotate({ang} 160 180)">{rect(160, 170, 400, 20, STEEL if i % 2 else STEEL2, 10, 1.5)}{text(500, 185, v, 12)}</g>')
    b.append(circle(170, 180, 22, SHADE))
    b.append(circle(170, 180, 6, INK, 1))
    return wrap('Fühlerlehre (calibrador de lâminas)', '\n'.join(b))


def universalwinkelmesser():
    b = []
    b.append(rect(70, 250, 580, 28, STEEL2, 3))                      # lineal
    b.append(circle(360, 190, 96, STEEL))
    b.append(circle(360, 190, 70, GLASS))
    for i in range(0, 91, 5):
        a = math.radians(180 + i * 2)
        b.append(line(360 + 92 * math.cos(a), 190 + 92 * math.sin(a), 360 + (84 if i % 10 else 78) * math.cos(a), 190 + (84 if i % 10 else 78) * math.sin(a), 1.2))
    b.append(rect(270, 90, 180, 24, STEEL2, 3))                      # anschlag
    b.append(circle(360, 190, 14, SHADE))
    b.append(label('Gradskala', 600, 120, 446, 170, 'start'))
    b.append(label('Lineal', 590, 330, 590, 278))
    b.append(label('Anschlag', 160, 60, 280, 100, 'end'))
    return wrap('Universalwinkelmesser (goniômetro)', '\n'.join(b), 350)


def hoehenreisser():
    b = []
    b.append(rect(200, 300, 220, 34, STEEL2, 6))                     # fuß
    b.append(rect(280, 50, 30, 250, STEEL))                          # säule
    for y in range(60, 296, 8):
        b.append(line(310, y, 302 if (y - 60) % 40 else 296, y, 1))
    b.append(rect(262, 160, 66, 46, STEEL2, 4))                      # schieber
    b.append(rect(328, 174, 200, 12, STEEL))                         # reißnadel
    b.append(poly([(528, 174), (560, 180), (528, 186)], SHADE))
    b.append(label('Säule', 180, 90, 280, 100, 'end'))
    b.append(label('Reißnadel', 600, 130, 540, 180))
    b.append(label('Fuß', 540, 330, 420, 318, 'start'))
    return wrap('Höhenreißer (traçador de altura)', '\n'.join(b), 360)


def gewindelehre():
    b = []
    vals = ['0,5', '0,7', '1,0', '1,25', '1,5', '1,75', '2,0']
    for i, v in enumerate(vals):
        ang = -24 + i * 8
        tooth = ' '.join(f'L{x} 166 L{x + 4} 170' for x in range(420, 560, 8))
        blade = f'M160 170 L420 170 {tooth} L560 190 L160 190 Z'
        b.append(f'<g transform="rotate({ang} 160 180)">{path(blade, STEEL if i % 2 else STEEL2, 1.2)}{text(370, 185, v, 12)}</g>')
    b.append(rect(130, 156, 70, 48, SHADE, 8))
    return wrap('Gewindelehre (pente de rosca)', '\n'.join(b))


DRAWINGS = {
    'im-messschieber': messschieber,
    'im-buegelmessschraube': buegelmessschraube,
    'im-messuhr': messuhr,
    'im-drehmomentschluessel': drehmomentschluessel,
    'im-gabelschluessel': gabelschluessel,
    'im-innensechskantschluessel': innensechskantschluessel,
    'im-feile': feile,
    'im-gewindebohrer': gewindebohrer,
    'im-wasserwaage': wasserwaage,
    'im-schraubendreher': schraubendreher,
    'im-zange': zange,
    'im-hammer': hammer,
    'im-schraubstock': schraubstock,
    'im-buegelsaege': buegelsaege,
    'im-koerner': koerner,
    'im-reissnadel': reissnadel,
    'im-meissel': meissel,
    'im-reibahle': reibahle,
    'im-senker': senker,
    'im-spiralbohrer': spiralbohrer,
    'im-ringschluessel': ringschluessel,
    'im-ratsche': ratsche,
    'im-abzieher': abzieher,
    'im-grenzlehrdorn': grenzlehrdorn,
    'im-grenzrachenlehre': grenzrachenlehre,
    'im-parallelendmass': parallelendmass,
    'im-fuehlerlehre': fuehlerlehre,
    'im-universalwinkelmesser': universalwinkelmesser,
    'im-hoehenreisser': hoehenreisser,
    'im-gewindelehre': gewindelehre,
}
