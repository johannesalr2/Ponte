"""
Liga cada ilustração em content/media/<profissão>/<id>.svg ao termo de mesmo id
(campo "image"). O texto alternativo lista as partes legendadas no desenho.
Termos que já têm "image" não são alterados.
Uso: python3 scripts/illustrations/apply.py && npx prettier --write content
"""
import glob, json, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'content')
AUTHOR = 'Ponte Técnica (ilustração própria)'
SOURCE = 'https://github.com/johannesalr2/Ponte'
LABEL = re.compile(r'font-size="(?:21|18)" font-weight="\d+"[^>]*>([^<]+)<')


def alt_text(term_pt, svg):
    parts = list(dict.fromkeys(LABEL.findall(svg)))
    base = f'Ilustração: {term_pt}'
    if not parts:
        return base + '.'
    listed = ', '.join(parts[:-1]) + ' e ' + parts[-1] if len(parts) > 1 else parts[0]
    return f'{base}, com as partes indicadas em alemão: {listed}.'


for path in sorted(glob.glob(os.path.join(ROOT, 'professions', '*', 'terms', '*.json'))):
    prof = path.split(os.sep)[-3]
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    changed = 0
    for t in data['terms']:
        rel = f'media/{prof}/{t["id"]}.svg'
        svg_path = os.path.join(ROOT, rel)
        if 'image' in t or not os.path.exists(svg_path):
            continue
        with open(svg_path, encoding='utf-8') as f:
            svg = f.read()
        t['image'] = {
            'file': rel,
            'alt': {'pt-BR': alt_text(t['tr']['pt-BR']['term'], svg)},
            'author': AUTHOR,
            'license': 'CC0',
            'source': SOURCE,
        }
        changed += 1
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'✓ {os.path.relpath(path, ROOT)}: {changed}')
