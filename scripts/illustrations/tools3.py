"""Fundição de resina e alta tensão (parte 3)."""
import math
from lib import *

ARC = '#f2c94c'


def giessform():
    b = []
    for x0, flip in ((120, 1), (380, -1)):
        b.append(rect(x0, 90, 220, 210, STEEL2, 6))
    b.append(path('M260 120 H340 V270 H260 Q230 270 230 240 V150 Q230 120 260 120 Z', WHITE))       # cavidade esquerda
    b.append(path('M380 120 H460 Q490 120 490 150 V240 Q490 270 460 270 H380 Z', WHITE))           # cavidade direita
    b.append(path('M300 40 H420 L380 90 H340 Z', SHADE))                                            # einguss (funil)
    for y in (110, 280):
        b.append(circle(140, y, 8, SHADE))
        b.append(circle(580, y, 8, SHADE))
    b.append(label('Formhälfte', 140, 340, 160, 300))
    b.append(label('Formhohlraum', 600, 340, 470, 240))
    b.append(label('Einguss', 560, 50, 410, 60, 'start'))
    return wrap('Gießform (molde, aberto)', '\n'.join(b), 360)


def ofen():
    b = []
    b.append(rect(140, 40, 440, 290, STEEL2, 8))
    b.append(rect(160, 90, 190, 230, STEEL, 4))                       # tür links
    b.append(rect(350, 90, 190, 230, STEEL, 4))                       # tür rechts
    b.append(rect(330, 170, 10, 70, SHADE, 4))
    b.append(rect(360, 170, 10, 70, SHADE, 4))
    b.append(rect(400, 52, 120, 30, GRIP2, 4))                        # regler
    b.append(text(460, 73, '140 °C', 16, fill='#7fe08a'))
    b.append(rect(200, 56, 60, 20, SHADE, 3))
    b.append(rect(160, 330, 30, 14, SHADE))
    b.append(rect(530, 330, 30, 14, SHADE))
    b.append(label('Temperaturregler', 640, 30, 520, 66, 'end'))
    b.append(label('Ofentür', 100, 200, 160, 200, 'end'))
    return wrap('Wärmeschrank (estufa)', '\n'.join(b), 360)


def spule():
    b = []
    b.append(rect(170, 90, 30, 180, SHADE, 4))                        # flansch
    b.append(rect(500, 90, 30, 180, SHADE, 4))
    b.append(rect(200, 130, 300, 100, COPPER, 2))                     # wicklung
    for y in range(136, 228, 8):
        b.append(line(204, y, 496, y + 2, 1, '#8a4b2a'))
    b.append(rect(200, 170, 300, 20, 'none', 0, 0))
    b.append(rod([(500, 140), (600, 110), (660, 110)], 4, COPPER))
    b.append(rod([(500, 220), (600, 250), (660, 250)], 4, COPPER))
    b.append(label('Wicklung', 350, 320, 350, 230))
    b.append(label('Spulenkörper', 185, 50, 185, 90))
    b.append(label('Anschlussdraht', 620, 330, 640, 250))
    return wrap('Spule (bobina)', '\n'.join(b), 360)


def isolator():
    b = []
    cx = 300
    b.append(rect(cx - 70, 300, 140, 26, STEEL2, 4))                  # armatur unten
    b.append(rect(cx - 50, 30, 100, 24, STEEL2, 4))                   # armatur oben
    b.append(rect(cx - 30, 54, 60, 246, RESIN))
    for i, y in enumerate(range(70, 290, 34)):
        w = 92 if i % 2 == 0 else 70
        b.append(f'<ellipse cx="{cx}" cy="{y}" rx="{w}" ry="10" {st(RESIN)}/>')
    b.append(label('Schirm', 520, 120, cx + 90, 104, 'start'))
    b.append(label('Armatur', 520, 320, cx + 70, 312, 'start'))
    b.append(label('Armatur', 520, 40, cx + 50, 42, 'start'))
    return wrap('Stützisolator (isolador de apoio)', '\n'.join(b), 350)


def transformator():
    b = ['<g transform="translate(-60 0)">']
    b.append(rect(110, 300, 500, 20, STEEL2, 3))                      # fahrwerk
    for x in (150, 570):
        b.append(circle(x, 330, 12, SHADE))
    b.append(rect(130, 60, 460, 36, '#5f6b74', 4))                    # joch oben
    b.append(rect(130, 264, 460, 36, '#5f6b74', 4))                   # joch unten
    for x in (160, 300, 440):
        b.append(rect(x, 96, 120, 168, RESIN, 14))                    # wicklungen
        b.append(rect(x + 10, 106, 100, 148, '#c79a4f', 10, 1))
    for x in (200, 340, 480):
        b.append(rect(x, 40, 40, 22, COPPER, 2))                      # US-anschlüsse
    b.append('</g>')
    b.append(label('Kern', 40, 40, 80, 72, 'start'))
    b.append(label('Gießharzwicklung', 700, 200, 470, 200, 'end'))
    b.append(label('Anschlüsse', 660, 30, 460, 46, 'end'))
    return wrap('Gießharztransformator (transformador a resina)', '\n'.join(b), 350)


def stromwandler():
    b = []
    b.append(rect(160, 290, 380, 26, STEEL2, 3))                      # grundplatte
    b.append(path('M200 290 V140 Q200 90 250 90 H450 Q500 90 500 140 V290 Z', RESIN))
    b.append(rect(230, 60, 60, 30, COPPER, 3))                        # P1
    b.append(rect(410, 60, 60, 30, COPPER, 3))                        # P2
    b.append(text(260, 52, 'P1', 16))
    b.append(text(440, 52, 'P2', 16))
    b.append(rect(300, 200, 100, 60, GRIP2, 6))                       # sekundärklemmen
    b.append(text(330, 236, 'S1', 14, fill=WHITE))
    b.append(text(370, 236, 'S2', 14, fill=WHITE))
    b.append(label('Primäranschluss', 700, 40, 470, 70, 'end'))
    b.append(label('Sekundärklemmen', 700, 250, 400, 236, 'end'))
    b.append(label('Gießharzkörper', 190, 180, 220, 180, 'end'))
    return wrap('Stromwandler (transformador de corrente)', '\n'.join(b), 350)


def spannungswandler():
    b = []
    b.append(rect(170, 290, 360, 26, STEEL2, 3))
    b.append(path('M220 290 V170 Q220 120 270 120 H430 Q480 120 480 170 V290 Z', RESIN))
    b.append(rect(330, 60, 40, 60, RESIN, 4))
    for y in (74, 92):
        b.append(f'<ellipse cx="350" cy="{y}" rx="34" ry="7" {st(RESIN)}/>')
    b.append(rect(335, 36, 30, 24, COPPER, 3))
    b.append(rect(300, 210, 100, 50, GRIP2, 6))
    b.append(text(330, 241, 'a', 14, fill=WHITE))
    b.append(text(370, 241, 'n', 14, fill=WHITE))
    b.append(label('Oberspannungsanschluss', 700, 40, 366, 48, 'end'))
    b.append(label('Sekundärklemmen', 700, 250, 400, 236, 'end'))
    return wrap('Spannungswandler (transformador de potencial)', '\n'.join(b), 350)


def spannungspruefer():
    b = []
    b.append(path('M120 120 Q120 100 140 100 H240 Q260 100 260 120 V250 Q260 270 240 270 H140 Q120 270 120 250 Z', '#e2b33c'))
    b.append(rect(140, 120, 100, 90, GRIP2, 6))                       # anzeige
    for i, v in enumerate(['12', '50', '120', '230', '400']):
        y = 132 + i * 16
        b.append(circle(160, y, 5, '#7fe08a' if i < 4 else '#3b4a54', 1))
        b.append(text(200, y + 5, v + ' V', 11, fill=WHITE, weight='500'))
    b.append(rect(176, 270, 28, 50, '#e2b33c', 3))
    b.append(rect(186, 320, 8, 24, STEEL, 0, 1.5))                    # prüfspitze
    b.append(path('M520 120 Q520 100 540 100 H580 Q600 100 600 120 V270 H520 Z', '#e2b33c'))
    b.append(rect(552, 270, 16, 50, '#e2b33c', 3))
    b.append(rect(556, 320, 8, 24, STEEL, 0, 1.5))
    b.append(f'<path d="M190 100 C190 20 560 20 560 100" fill="none" stroke="{INK}" stroke-width="8"/>')
    b.append(f'<path d="M190 100 C190 20 560 20 560 100" fill="none" stroke="#e2b33c" stroke-width="4"/>')
    b.append(label('Anzeige', 400, 200, 240, 160, 'start'))
    b.append(label('Prüfspitzen', 400, 330, 194, 336, 'start'))
    return wrap('Zweipoliger Spannungsprüfer (detector de tensão)', '\n'.join(b), 360)


def leistungsschalter():
    b = []
    b.append(rect(130, 230, 460, 100, STEEL2, 6))                     # antrieb
    b.append(circle(250, 280, 22, '#3a9d5d'))
    b.append(text(250, 285, 'I', 16, fill=WHITE))
    b.append(circle(320, 280, 22, '#c0392b'))
    b.append(text(320, 285, 'O', 16, fill=WHITE))
    b.append(rect(400, 262, 120, 36, WHITE, 4))
    b.append(text(460, 286, 'AUS', 16))
    for x in (170, 330, 490):
        b.append(rect(x, 60, 60, 170, RESIN, 10))                     # pole
        b.append(rect(x + 10, 40, 40, 22, COPPER, 2))
        b.append(rect(x + 10, 130, 40, 18, COPPER, 2))
    b.append(label('Pol', 640, 110, 550, 110, 'start'))
    b.append(label('Antrieb', 600, 300, 590, 300, 'start'))
    return wrap('Vakuum-Leistungsschalter (disjuntor a vácuo)', '\n'.join(b), 350)


def trennschalter():
    b = []
    b.append(rect(110, 290, 500, 24, STEEL2, 3))                      # rahmen
    for cx in (200, 520):
        b.append(rect(cx - 16, 140, 32, 150, RESIN))
        for y in range(152, 284, 26):
            b.append(f'<ellipse cx="{cx}" cy="{y}" rx="34" ry="8" {st(RESIN)}/>')
        b.append(rect(cx - 30, 120, 60, 22, STEEL2, 3))
    b.append(rod([(200, 128), (450, 30)], 12, COPPER))                # trennmesser (aberto)
    b.append(circle(200, 128, 10, SHADE))
    b.append(path('M500 104 H540 V120 H500 Z', COPPER))               # kontakt
    b.append(label('Trennmesser', 380, 160, 330, 78))
    b.append(label('Isolator', 580, 230, 554, 230, 'start'))
    b.append(label('Kontakt', 580, 70, 530, 104, 'start'))
    return wrap('Trennschalter (seccionador, aberto)', '\n'.join(b), 350)


def schaltanlage():
    b = []
    for i in range(4):
        x = 90 + i * 140
        b.append(rect(x, 50, 130, 280, STEEL2, 4))
        b.append(rect(x + 12, 64, 106, 70, STEEL, 3))                 # niederspannungsfach
        b.append(rect(x + 30, 80, 70, 26, GRIP2, 3))
        b.append(rect(x + 12, 146, 106, 170, STEEL, 3))               # tür
        b.append(line(x + 40, 180, x + 90, 180, 3))                   # mimik
        b.append(line(x + 65, 165, x + 65, 290, 3))
        b.append(circle(x + 65, 230, 10, WHITE, 2))
        b.append(rect(x + 100, 220, 8, 40, SHADE, 3))
    b.append(label('Schaltfeld', 360, 26, 300, 60))
    b.append(label('Steuerung', 600, 26, 560, 92))
    return wrap('Mittelspannungs-Schaltanlage (conjunto de manobra)', '\n'.join(b), 350)


def lichtbogen():
    b = []
    b.append(rect(80, 160, 210, 40, COPPER, 6))
    b.append(rect(430, 160, 210, 40, COPPER, 6))
    glow = '<defs><radialGradient id="g"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>'
    b.append(glow + '<ellipse cx="360" cy="180" rx="120" ry="70" fill="url(#g)"/>')
    pts = [(290, 180), (310, 160), (325, 196), (345, 150), (362, 204), (380, 158), (398, 198), (414, 166), (430, 180)]
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in pts)
    b.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>')
    b.append(f'<path d="{d}" fill="none" stroke="{ARC}" stroke-width="5" stroke-linejoin="round"/>')
    b.append(label('Elektrode', 140, 270, 160, 200))
    b.append(label('Elektrode', 580, 270, 560, 200))
    b.append(label('Lichtbogen', 360, 70, 352, 150))
    return wrap('Lichtbogen (arco elétrico)', '\n'.join(b))


def psa():
    b = []
    # helm
    b.append(path('M70 190 Q70 90 160 90 Q250 90 250 190 Z', '#e2b33c'))
    b.append(rect(50, 186, 220, 16, '#e2b33c', 8))
    b.append(line(160, 92, 160, 186, 2))
    # brille
    b.append(path('M300 150 Q300 128 330 128 H380 Q395 128 400 140 Q405 128 420 128 H470 Q500 128 500 150 Q500 186 466 186 H434 Q410 186 400 164 Q390 186 366 186 H334 Q300 186 300 150 Z', '#cfe3ec'))
    # handschuh
    b.append(path('M560 300 V190 Q560 176 572 176 Q584 176 584 190 V150 Q584 136 596 136 Q608 136 608 150 V144 Q608 130 620 130 Q632 130 632 144 V156 Q632 142 644 142 Q656 142 656 156 V250 Q656 300 620 300 Z', '#c0392b'))
    b.append(rect(556, 296, 104, 30, '#c0392b', 4))
    # schuh
    b.append(path('M300 300 V240 H350 V270 Q420 270 470 290 Q490 300 490 316 H300 Z', GRIP2))
    b.append(path('M440 280 Q480 290 486 312 H440 Z', '#e2b33c', 1.5))
    b.append(text(160, 240, 'Schutzhelm', 18))
    b.append(text(400, 220, 'Schutzbrille', 18))
    b.append(text(608, 112, 'Schutzhandschuhe', 18))
    b.append(text(395, 345, 'Sicherheitsschuhe', 18))
    return wrap('Persönliche Schutzausrüstung (EPI)', '\n'.join(b), 360)


DRAWINGS = {
    'im-giessform': giessform, 'im-ofen': ofen, 'im-spule': spule, 'im-isolator': isolator,
    'im-transformator': transformator, 'im-stromwandler': stromwandler,
    'im-spannungswandler': spannungswandler, 'im-spannungspruefer': spannungspruefer,
    'im-leistungsschalter': leistungsschalter, 'im-trennschalter': trennschalter,
    'im-schaltanlage': schaltanlage, 'im-lichtbogen': lichtbogen, 'im-psa': psa,
}
