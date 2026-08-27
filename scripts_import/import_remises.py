# -*- coding: utf-8 -*-
"""Import « achat & remise de matériel » (dotation EPI/fournitures) -> hse_epi_dotations.
Match nom+prénom -> salarie_id. Idempotent par (date_remise, salarie_nom, epi_nom).

Usage : python import_remises.py            (dry-run)
        python import_remises.py --apply
"""
import openpyxl, urllib.request, urllib.error, json, sys, datetime, unicodedata, difflib, re
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\achat & remise de materiel.xlsx"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
EPI_KW = re.compile(r'(chaussure|lunette|gant|casque|bouchon|auditi|protection|masque|visiere|tablier|genouill|harnais|combinaison)', re.I)


def norm(s):
    t = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())


def s(v):
    return (str(v).strip() or None) if v is not None and str(v).strip() else None


def d10(v):
    return v.strftime('%Y-%m-%d') if isinstance(v, (datetime.datetime, datetime.date)) else None


def numof(v):
    try: return float(v)
    except Exception: return None


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None: h['Content-Type'] = 'application/json'
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8'); return json.loads(t) if t else None


def build_matcher(salaries):
    vmap = {}
    info = {}
    for x in salaries:
        sid = x.get('id'); nom = (x.get('nom') or '').strip(); pre = (x.get('prenom') or '').strip()
        info[sid] = (pre, nom)
        n, p = norm(nom), norm(pre)
        for v in {('%s %s' % (n, p)).strip(), ('%s %s' % (p, n)).strip()}:
            if v: vmap.setdefault(v, set()).add(sid)
    return vmap, info


def match(nom, prenom, vmap):
    key = norm((nom or '') + ' ' + (prenom or ''))
    if not key: return None, 'none'
    ids = vmap.get(key)
    if ids and len(ids) == 1: return next(iter(ids)), 'high'
    if ids and len(ids) > 1: return None, 'ambigu'
    close = difflib.get_close_matches(key, list(vmap.keys()), n=1, cutoff=0.84)
    if close and len(vmap[close[0]]) == 1: return next(iter(vmap[close[0]])), 'medium'
    return None, 'none'


def parse(vmap, info):
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb['Feuil1']
    recs = []
    unmatched = {}
    for row in ws.iter_rows(min_row=5, max_col=8, values_only=True):
        nom, prenom, typ = s(row[1]), s(row[2]), s(row[3])
        if not typ or (not nom and not prenom):
            continue
        sid, conf = match(nom, prenom, vmap)
        nom_aff = ('%s %s' % info[sid]).strip() if sid else (' '.join([x for x in (prenom, nom) if x]))
        cat = 'epi' if EPI_KW.search(typ) else 'materiel'
        recs.append({
            'salarie_id': sid, 'salarie_nom': nom_aff, 'epi_nom': typ, 'categorie': cat,
            'fournisseur': s(row[4]), 'marque': s(row[5]), 'reference': s(row[6]),
            'prix': numof(row[7]), 'date_remise': d10(row[0]), 'quantite': 1, 'statut': 'en_service',
            '_conf': conf, '_raw': ('%s %s' % (nom or '', prenom or '')).strip(),
        })
        if not sid:
            unmatched.setdefault(('%s %s' % (nom or '', prenom or '')).strip(), 0)
            unmatched[('%s %s' % (nom or '', prenom or '')).strip()] += 1
    return recs, unmatched


def main():
    apply = '--apply' in sys.argv
    salaries = http('GET', '/rest/v1/salaries?select=id,nom,prenom')
    vmap, info = build_matcher(salaries)
    recs, unmatched = parse(vmap, info)
    from collections import Counter
    print('Remises parsées :', len(recs), '| par catégorie :', dict(Counter(r['categorie'] for r in recs)), '| match :', dict(Counter(r['_conf'] for r in recs)))
    for r in recs[:8]:
        print('  ', r['date_remise'], '|', (r['salarie_id'] or '—'), '|', str(r['salarie_nom'])[:18].ljust(18), '|', str(r['epi_nom'])[:24], '|', r['categorie'])
    if unmatched:
        print('--- non rattachés (gardés sans salarie_id) :', dict(unmatched))
    if not apply:
        print('\nDRY-RUN. --apply pour insérer.'); return
    existing = http('GET', '/rest/v1/hse_epi_dotations?select=date_remise,salarie_nom,epi_nom')
    seen = set((e.get('date_remise'), norm(e.get('salarie_nom')), norm(e.get('epi_nom'))) for e in existing)
    todo = []
    for r in recs:
        k = (r['date_remise'], norm(r['salarie_nom']), norm(r['epi_nom']))
        if k in seen: continue
        seen.add(k); todo.append({x: r[x] for x in r if not x.startswith('_')})
    print('déjà en base :', len(existing), '| à insérer :', len(todo))
    for i in range(0, len(todo), 50):
        http('POST', '/rest/v1/hse_epi_dotations', todo[i:i + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
