# -*- coding: utf-8 -*-
"""Import SOINS (Tableau de bord SOINS) -> hse_incidents (type='soin'). Idempotent par (date, lesion, desc).
Rattache salarie_id par correspondance de nom (exact, puis approché difflib) — voir aussi relink_salaries.py."""
import openpyxl, urllib.request, urllib.error, json, sys, datetime, unicodedata, re, difflib
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Copie de Tableau de bord QUALITE V2 07 05 2026 AGATHE.xlsm"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def s(v):
    return (str(v).strip() or None) if v is not None and str(v).strip() else None


def d10(v):
    return v.strftime('%Y-%m-%d') if isinstance(v, (datetime.datetime, datetime.date)) else None


def norm(x):
    t = unicodedata.normalize('NFKD', str(x or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(t.split())


def normname(x):
    t = unicodedata.normalize('NFKD', str(x or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())


def build_matcher(salaries):
    vmap = {}
    for s2 in salaries:
        sid = s2.get('id'); n, p = normname(s2.get('nom')), normname(s2.get('prenom'))
        for v in {(n + ' ' + p).strip(), (p + ' ' + n).strip()}:
            if v: vmap.setdefault(v, set()).add(sid)
    return vmap


def match_id(nom, vmap, keys, fuzzy=False):
    # Exact uniquement par défaut (sûr pour les accidents). --fuzzy active l'approché 0.88,
    # et seulement si pas de quasi-ex aequo (sinon ambigu -> non rattaché, à revoir).
    k = normname(nom)
    if not k: return None
    ids = vmap.get(k)
    if ids and len(ids) == 1: return next(iter(ids))
    if ids and len(ids) > 1: return None  # homonymes -> ambigu
    if not fuzzy: return None
    close = difflib.get_close_matches(k, keys, n=2, cutoff=0.88)
    if not close: return None
    if len(close) > 1 and difflib.SequenceMatcher(None, k, close[1]).ratio() > 0.85:
        return None  # 2 candidats trop proches -> ambigu
    if len(vmap[close[0]]) == 1: return next(iter(vmap[close[0]]))
    return None


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None: h['Content-Type'] = 'application/json'
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8'); return json.loads(t) if t else None


def parse():
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb['Tableau de bord SOINS']
    recs = []
    for row in ws.iter_rows(min_row=9, max_col=12, values_only=True):
        date = row[1] if len(row) > 1 else None
        if not isinstance(date, (datetime.datetime, datetime.date)):
            continue
        secteur = s(row[3])
        recs.append({
            'type': 'soin', 'date_incident': d10(date), 'salarie_nom': s(row[2]),
            'zone': secteur, 'poste': s(row[4]), 'nature_lesion': s(row[5]),
            'partie_corps': s(row[6]), 'description': s(row[7]),
            'temoins': s(row[8]) if len(row) > 8 else None,
            'premiers_secours': s(row[10]) if len(row) > 10 else None,
            'avec_arret': False, 'jours_arret': 0, 'statut': 'clos',
            'entite': 'Semrac' if (secteur and 'semrac' in norm(secteur)) else 'Seem',
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    fuzzy = '--fuzzy' in sys.argv
    recs = parse()
    # Rattachement salarié par nom (exact par défaut ; --fuzzy pour l'approché à valider)
    salaries = http('GET', '/rest/v1/salaries?select=id,nom,prenom')
    vmap = build_matcher(salaries); keys = list(vmap.keys())
    linked = 0
    for r in recs:
        sid = match_id(r.get('salarie_nom'), vmap, keys, fuzzy=fuzzy)
        if sid: r['salarie_id'] = sid; linked += 1
    print('SOINS parsés :', len(recs), '| rattachés à un salarié :', linked, '/', len(recs), '(fuzzy)' if fuzzy else '(exact)')
    existing = http('GET', '/rest/v1/hse_incidents?select=date_incident,partie_corps,description&type=eq.soin')
    seen = set((e.get('date_incident'), norm(e.get('partie_corps')), norm(e.get('description'))) for e in existing)
    todo = []
    for r in recs:
        k = (r['date_incident'], norm(r['partie_corps']), norm(r['description']))
        if k in seen: continue
        seen.add(k); todo.append(r)
    print('déjà en base (soins) :', len(existing), '| à insérer :', len(todo))
    for r in todo[:5]:
        print('  ', r['date_incident'], '|', r['nature_lesion'], '|', r['partie_corps'], '|', str(r['description'])[:30])
    if not apply:
        print('\nDRY-RUN. --apply pour insérer.'); return
    for i in range(0, len(todo), 50):
        http('POST', '/rest/v1/hse_incidents', todo[i:i + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
