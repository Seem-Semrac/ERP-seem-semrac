# -*- coding: utf-8 -*-
"""
Pré-remplit pictogrammes (CLP/SGH) des produits chimiques à partir des mentions H
déjà en base. N'écrase QUE les pictogrammes vides (les choix manuels sont préservés).
Mêmes règles H→SGH que src/clp.ts.

Usage : python autofill_pictos.py            (dry-run)
        python autofill_pictos.py --apply
"""
import re, json, urllib.request, sys
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
TABLE = 'hse_produits_chimiques'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
RULES = [
    ('SGH01', r'H2(0[0-5]|40|41)|R\s?[23]\b'),
    ('SGH02', r'H2(2[0-8]|4[12]|5[012]|6[01])|R1[0125]\b|R17\b'),
    ('SGH03', r'H27[012]|R[789]\b'),
    ('SGH04', r'H28[01]'),
    ('SGH05', r'H(290|314|318)|R3[45]\b'),
    ('SGH06', r'H3(0[01]|1[01]|3[01])|R2[3-8]\b'),
    ('SGH07', r'H3(02|12|15|17|19|32|35|36)|R(2[012]|3[678]|6[567])\b'),
    ('SGH08', r'H3(34|4[01]|5[01]|6[012]|7[0-3])|R(39|4[0-9]|6[0-3]|68)\b'),
    ('SGH09', r'H4(00|1[0-3]|20)|R5[0-9]\b'),
]


def pictos(mentions):
    txt = ' '.join(str(x) for x in (mentions or []))
    return [c for c, rx in RULES if re.search(rx, txt, re.I)]


def http(method, path, body=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None:
        h['Content-Type'] = 'application/json'; h['Prefer'] = 'return=minimal'
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r) if method == 'GET' else r.status


def main():
    apply = '--apply' in sys.argv
    rows = http('GET', '/rest/v1/' + TABLE + '?select=id,nom,mentions_danger,pictogrammes')
    todo = []
    for r in rows:
        cur = r.get('pictogrammes') or []
        if cur:                                   # picto déjà renseigné → on respecte
            continue
        d = pictos(r.get('mentions_danger'))
        if d:
            todo.append((r, d))
    print('Produits:', len(rows), '| déjà avec picto:', sum(1 for r in rows if (r.get('pictogrammes') or [])),
          '| à pré-remplir depuis H:', len(todo))
    from collections import Counter
    cnt = Counter(c for _, d in todo for c in d)
    print('Répartition SGH dérivés:', dict(cnt))
    print('--- échantillon ---')
    for r, d in todo[:10]:
        print('  ', str(r['nom'])[:32], '→', d)
    if not apply:
        print('\nDRY-RUN — rien écrit. --apply pour pré-remplir.')
        return
    for r, d in todo:
        http('PATCH', '/rest/v1/' + TABLE + '?id=eq.' + str(r['id']), {'pictogrammes': d})
    print('\nPictogrammes pré-remplis sur', len(todo), 'produits.')


if __name__ == '__main__':
    main()
