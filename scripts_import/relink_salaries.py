# -*- coding: utf-8 -*-
"""Backfill salarie_id sur les enregistrements HSE orphelins quand le nom correspond
à un salarié existant. Match EXACT par défaut (sûr pour les accidents) ; --fuzzy ajoute
les correspondances approchées (difflib >= 0.88) à valider.

Tables traitées : hse_incidents (salarie_nom), hse_epi_dotations (salarie_nom),
certifications (employe_nom).

Usage : python relink_salaries.py           (dry-run)
        python relink_salaries.py --apply
        python relink_salaries.py --apply --fuzzy
"""
import urllib.request, urllib.error, json, sys, unicodedata, re, difflib
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
# (table, colonne nom, colonne id source primaire)
TABLES = [
    ('hse_incidents', 'salarie_nom'),
    ('hse_epi_dotations', 'salarie_nom'),
    ('certifications', 'employe_nom'),
]


def norm(s):
    t = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None: h['Content-Type'] = 'application/json'
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8'); return json.loads(t) if t else None


def build_matcher(salaries):
    vmap, info = {}, {}
    for x in salaries:
        sid = x.get('id'); nom = (x.get('nom') or '').strip(); pre = (x.get('prenom') or '').strip()
        info[sid] = (pre + ' ' + nom).strip()
        n, p = norm(nom), norm(pre)
        for v in {(n + ' ' + p).strip(), (p + ' ' + n).strip()}:
            if v: vmap.setdefault(v, set()).add(sid)
    return vmap, info


def main():
    apply = '--apply' in sys.argv
    fuzzy = '--fuzzy' in sys.argv
    salaries = http('GET', '/rest/v1/salaries?select=id,nom,prenom')
    vmap, info = build_matcher(salaries)
    keys = list(vmap.keys())
    grand = {'exact': 0, 'fuzzy': 0, 'empty': 0, 'nomatch': 0, 'ambigu': 0, 'patched': 0}
    for table, col in TABLES:
        rows = http('GET', '/rest/v1/%s?select=id,salarie_id,%s' % (table, col))
        orph = [r for r in rows if not r.get('salarie_id')]
        todo = []  # (id, sid, name, kind)
        local = {'exact': 0, 'fuzzy': 0, 'empty': 0, 'nomatch': 0, 'ambigu': 0}
        for r in orph:
            key = norm(r.get(col))
            if not key:
                local['empty'] += 1; continue
            ids = vmap.get(key)
            if ids and len(ids) == 1:
                local['exact'] += 1; todo.append((r['id'], next(iter(ids)), info[next(iter(ids))], 'exact')); continue
            if ids and len(ids) > 1:
                local['ambigu'] += 1; continue
            close = difflib.get_close_matches(key, keys, n=1, cutoff=0.88)
            if close and len(vmap[close[0]]) == 1:
                local['fuzzy'] += 1
                if fuzzy: todo.append((r['id'], next(iter(vmap[close[0]])), info[next(iter(vmap[close[0]]))], 'fuzzy'))
                continue
            local['nomatch'] += 1
        print('%-20s %d lignes, %d orphelins -> %s' % (table, len(rows), len(orph), {k: v for k, v in local.items() if v}))
        for _id, sid, name, kind in todo[:6]:
            print('   [%s] %s -> %s (%s)' % (kind, _id, name, sid))
        for k in local: grand[k] = grand.get(k, 0) + local[k]
        if apply:
            for _id, sid, name, kind in todo:
                http('PATCH', '/rest/v1/%s?id=eq.%s' % (table, urllib.request.quote(str(_id))),
                     {'salarie_id': sid}, prefer='return=minimal')
                grand['patched'] += 1
    print('\nTOTAL :', {k: v for k, v in grand.items() if v})
    if not apply:
        print('DRY-RUN. --apply pour rattacher (exact). Ajoute --fuzzy pour inclure les approchés.')


if __name__ == '__main__':
    main()
