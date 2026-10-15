"""
Biblioteca de desenho das ilustrações do Ponte Técnica (SVG, CC0).
Estilo: contorno escuro, aço em cinzas, setas de legenda em laranja.
Todas as figuras usam viewBox 720 x 360 (ou a altura indicada).
"""
import math

INK = '#22303a'
STEEL = '#e3e7eb'
STEEL2 = '#cfd6dc'
SHADE = '#b9c2ca'
DARK = '#8a96a0'
ACC = '#b4440e'
GRIP = '#d4673f'      # cabo/empunhadura (vermelho)
GRIP2 = '#3a4a56'     # borracha escura
WOOD = '#d6a868'
BRASS = '#d8b45a'
COPPER = '#c97b4a'
RESIN = '#d9b26a'     # resina epóxi (âmbar)
GLASS = '#f4f6f8'
WHITE = '#ffffff'
FONT = "'IBM Plex Sans','Helvetica Neue',Arial,sans-serif"


def st(fill, sw=2):
    return f'fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"'


def rect(x, y, w, h, fill=STEEL, rx=0, sw=2):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" {st(fill, sw)}/>'


def circle(cx, cy, r, fill=STEEL, sw=2):
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" {st(fill, sw)}/>'


def path(d, fill=STEEL, sw=2):
    return f'<path d="{d}" {st(fill, sw)}/>'


def poly(pts, fill=STEEL, sw=2):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" {st(fill, sw)}/>'


def line(x1, y1, x2, y2, sw=1.5, color=INK):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'


def text(x, y, s, size=14, anchor='middle', weight='600', fill=INK, rotate=None):
    tr = f' transform="rotate({rotate} {x} {y})"' if rotate is not None else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill}"{tr}>{s}</text>'


def rod(points, width, fill=STEEL):
    """Barra com contorno, seguindo uma polilinha (cantos arredondados)."""
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in points)
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{width + 4}" stroke-linejoin="round" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>')


def knurl(x, y, w, h, step=6):
    """Serrilhado em área retangular."""
    out = []
    for i in range(int(w // step) + 1):
        xx = x + i * step
        out.append(line(xx, y, min(xx + h * 0.5, x + w), y + h, 1))
    return ''.join(out)


def hatch(x, y, w, h, step=7, sw=1):
    """Hachura cruzada (ex.: dentes de lima)."""
    out = [f'<clipPath id="h{int(x)}{int(y)}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#h{int(x)}{int(y)})">']
    for i in range(-int(h // step) - 2, int(w // step) + 2):
        xx = x + i * step
        out.append(line(xx, y, xx + h * 0.6, y + h, sw))
        out.append(line(xx + h * 0.6, y, xx, y + h, sw * 0.7))
    out.append('</g>')
    return ''.join(out)


def hatch_poly(pts, step=7, sw=1):
    """Hachura cruzada recortada por um polígono."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x, y, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    cid = f'hp{int(x)}{int(y)}'
    shape = ' '.join(f'{px:.1f},{py:.1f}' for px, py in pts)
    out = [f'<clipPath id="{cid}"><polygon points="{shape}"/></clipPath><g clip-path="url(#{cid})">']
    for i in range(-int(h // step) - 2, int(w // step) + 2):
        xx = x + i * step
        out.append(line(xx, y, xx + h * 0.6, y + h, sw))
        out.append(line(xx + h * 0.6, y, xx, y + h, sw * 0.7))
    out.append('</g>')
    return ''.join(out)


def label(t, tx, ty, ax, ay, anchor='middle'):
    """Legenda com linha guia até o ponto (ax, ay), saindo da borda do texto mais próxima."""
    w = 12.2 * len(t)  # largura aproximada (21px, negrito)
    x0 = tx if anchor == 'start' else tx - w if anchor == 'end' else tx - w / 2
    x1 = x0 + w
    if ax < x0 - 4:
        lx, ly = x0 - 6, ty - 7
    elif ax > x1 + 4:
        lx, ly = x1 + 6, ty - 7
    else:
        lx, ly = min(max(ax, x0 + 6), x1 - 6), (ty + 6 if ty < ay else ty - 20)
    return (f'<line x1="{lx:.0f}" y1="{ly}" x2="{ax}" y2="{ay}" stroke="{ACC}" stroke-width="1.5"/>'
            f'<circle cx="{ax}" cy="{ay}" r="3.5" fill="{ACC}"/>'
            f'<text x="{tx}" y="{ty}" text-anchor="{anchor}" font-size="21" font-weight="600" fill="{INK}">{t}</text>')


def gear_path(cx, cy, teeth, r_root, r_tip, rot=0.0):
    pts = []
    for i in range(teeth):
        a0 = rot + 2 * math.pi * i / teeth
        da = 2 * math.pi / teeth
        for frac, r in ((0.0, r_root), (0.15, r_root), (0.3, r_tip), (0.55, r_tip), (0.7, r_root), (1.0, r_root)):
            a = a0 + frac * da
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'


def hexagon(cx, cy, r, rot=0.0, fill=STEEL2, sw=2):
    pts = [(cx + r * math.cos(rot + math.pi / 3 * i), cy + r * math.sin(rot + math.pi / 3 * i)) for i in range(6)]
    return poly(pts, fill, sw)


def wrap(title, body, h=360, w=720):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="{FONT}">\n'
            f'<title>{title}</title>\n<desc>Ilustração própria do Ponte Técnica (CC0).</desc>\n{body}\n</svg>\n')
