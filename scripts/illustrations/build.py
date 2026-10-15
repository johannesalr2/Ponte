"""
Gera as ilustrações SVG em content/media/<profissão>/<id>.svg.
Uso: python3 scripts/illustrations/build.py [ids...]
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import tools1, tools2, tools3

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'content', 'media')
ALL = {}
for mod in (tools1, tools2, tools3):
    ALL.update(mod.DRAWINGS)

if __name__ == '__main__':
    only = sys.argv[1:]
    for tid, fn in ALL.items():
        if only and tid not in only:
            continue
        prof = {'im': 'industriemechaniker'}[tid.split('-')[0]]
        out = os.path.join(ROOT, prof)
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, tid + '.svg'), 'w', encoding='utf-8') as f:
            f.write(fn())
        print('✓', tid)
