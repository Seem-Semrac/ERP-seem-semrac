# -*- coding: utf-8 -*-
"""
Import du suivi de Formation (feuille "Tableau de bord Formation") -> table `certifications`.
Cible UNIQUE : certifications (la table habilitations est vide/non câblée ; le panel RH
"Habilitations" rend en réalité des certifications filtrées par `type`).

Matching salarié robuste (chaîne complète AVANT split, gère noms/prénoms composés + homonymes
+ typos via difflib). Idempotent : GET-avant-insert en mémoire sur (salarie_id, intitule, date_obtention).
Les lignes sans salarié apparié ne sont PAS importées (FK) et sont listées pour traitement manuel.

Usage : python import_formation.py            (dry-run)
        python import_formation.py --apply
        python import_formation.py --src "<chemin .xlsm>"
"""
import openpyxl, urllib.request, urllib.error, urllib.parse, json, sys, datetime, unicodedata, difflib
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Copie de Tableau de bord QUALITE V2 07 05 2026 AGATHE.xlsm"
if '--src' in sys.argv:
    SRC = sys.argv[sys.argv.index('--src') + 1]
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
TODAY = datetime.date.today()

# (nom_groupe, label_col, obt_col, recy_col, duree_ans, type, critique)  -- index 0-based
GROUPES = [
    ('Habilitation electrique', 3, 4, 5, 3, 'habilitation', True),
    ('SST', None, 7, 8, 2, 'formation', True),
    ('CACES', 12, 13, 14, 5, 'certification', True),
    ('Pontier elingueur', 16, 17, 18, 5, 'certification', True),
    ('Formation extincteur', None, 20, 21, 1, 'formation', False),
]


def norm(s):
    if s is None:
        return ''
    t = unicodedata.normalize('NFKD', str(s))
    t = ''.join(c for c in t if not unicodedata.combining(c)).lower()
    out = []
    for ch in t:
        out.append(ch if (ch.isalnum()) else ' ')
    return ' '.join(''.join(out).split())


def d10(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return None


def addyears(d, n):
    try:
        return d.replace(year=d.year + n)
    except ValueError:
        return d.replace(year=d.year + n, day=28)  # 29/02 -> 28/02


def statut_for(exp_iso):
    if not exp_iso:
        return 'valide'
    exp = datetime.date.fromisoformat(exp_iso)
    if exp < TODAY:
        return 'expire'
    if (exp - TODAY).days <= 182:   # < 6 mois -> à renouveler
        return 'a_renouveler'
    return 'valide'


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None:
        h['Content-Type'] = 'application/json'
    if prefer:
        h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8')
        return json.loads(t) if t else None


def fetch_all(path):
    out = []
    step = 1000
    off = 0
    while True:
        h = dict(HDRS)
        h['Range-Unit'] = 'items'
        h['Range'] = '%d-%d' % (off, off + step - 1)
        req = urllib.request.Request(URL + path, headers=h)
        with urllib.request.urlopen(req, timeout=60) as r:
            chunk = json.loads(r.read().decode('utf-8'))
        out.extend(chunk)
        if len(chunk) < step:
            break
        off += step
    return out


def build_matcher(salaries):
    vmap = {}  # variante normalisee -> set(ids)
    info = {}  # id -> (prenom, nom)
    for s in salaries:
        sid = s.get('id')
        nom = (s.get('nom') or '').strip()
        pre = (s.get('prenom') or '').strip()
        info[sid] = (pre, nom)
        n, p = norm(nom), norm(pre)
        for variant in {('%s %s' % (n, p)).strip(), ('%s %s' % (p, n)).strip()}:
            if variant:
                vmap.setdefault(variant, set()).add(sid)
    return vmap, info


def match(sheet_name, vmap):
    ns = norm(sheet_name)
    if not ns:
        return None, 'none'
    ids = vmap.get(ns)
    if ids and len(ids) == 1:
        return next(iter(ids)), 'high'
    if ids and len(ids) > 1:
        return None, 'ambigu'   # vrai homonyme nom+prenom -> ne pas importer
    close = difflib.get_close_matches(ns, list(vmap.keys()), n=1, cutoff=0.86)
    if close:
        cand = vmap[close[0]]
        if len(cand) == 1:
            return next(iter(cand)), 'medium'
    return None, 'none'


def parse_records(vmap, info):
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb['Tableau de bord Formation']
    rows = list(ws.iter_rows(min_row=8, values_only=True))
    recs = []
    unmatched = {}  # nom_feuille -> liste de (intitule, obt)
    for r in rows:
        if not r or len(r) < 22:
            continue
        nom_feuille = r[0]
        if nom_feuille in (None, '') or not str(nom_feuille).strip():
            continue
        sid, conf = match(nom_feuille, vmap)
        for (gname, lcol, ocol, rcol, duree, ctype, crit) in GROUPES:
            obt = r[ocol] if ocol is not None and ocol < len(r) else None
            if not isinstance(obt, (datetime.datetime, datetime.date)):
                continue  # pas de date d'obtention -> on n'emet rien
            label = r[lcol] if (lcol is not None and lcol < len(r) and r[lcol]) else None
            detail = str(label).strip() if label else ''
            if gname == 'SST':
                intitule = 'SST (Sauveteur Secouriste du Travail)'
            elif gname == 'Formation extincteur':
                intitule = 'Formation extincteur'
            elif gname == 'Habilitation electrique':
                intitule = 'Habilitation electrique' + (' - ' + detail if detail else '')
            elif gname == 'CACES':
                intitule = 'CACES' + (' - ' + detail if detail else '')
            elif gname == 'Pontier elingueur':
                intitule = 'Pontier elingueur' + (' - ' + detail if detail else '')
            else:
                intitule = gname
            obt_iso = d10(obt)
            recy = r[rcol] if (rcol is not None and rcol < len(r)) else None
            exp_iso = d10(recy) or d10(addyears(obt.date() if isinstance(obt, datetime.datetime) else obt, duree))
            statut = statut_for(exp_iso)
            if not sid:
                unmatched.setdefault(str(nom_feuille).strip(), []).append('%s (%s)' % (intitule, obt_iso))
                continue
            pre, nom = info.get(sid, ('', ''))
            recs.append({
                'salarie_id': sid,
                'employe_nom': ('%s %s' % (pre, nom)).strip(),
                'type': ctype,
                'intitule': intitule,
                'organisme': None,
                'date_obtention': obt_iso,
                'date_expiration': exp_iso,
                'statut': statut,
                'critique': crit,
                'notes': 'Import suivi formation',
                '_conf': conf,
            })
    return recs, unmatched


def main():
    apply = '--apply' in sys.argv
    salaries = fetch_all('/rest/v1/salaries?select=id,nom,prenom&order=id')
    vmap, info = build_matcher(salaries)
    recs, unmatched = parse_records(vmap, info)

    existing = fetch_all('/rest/v1/certifications?select=salarie_id,intitule,date_obtention')
    seen = set((e.get('salarie_id'), e.get('intitule'), e.get('date_obtention')) for e in existing)

    to_insert = []
    skipped = 0
    for r in recs:
        key = (r['salarie_id'], r['intitule'], r['date_obtention'])
        if key in seen:
            skipped += 1
            continue
        seen.add(key)
        to_insert.append(r)

    from collections import Counter
    print('Salaries en base :', len(salaries), '| certifications existantes :', len(existing))
    print('Enregistrements formation appariés :', len(recs), '| par confiance :', dict(Counter(r['_conf'] for r in recs)))
    print('  par type :', dict(Counter(r['type'] for r in recs)), '| par statut :', dict(Counter(r['statut'] for r in recs)))
    print('  à insérer :', len(to_insert), '| déjà en base (skip) :', skipped)
    print('\n--- échantillon (à insérer) ---')
    for r in to_insert[:12]:
        print('  ', r['salarie_id'], '|', r['employe_nom'][:22].ljust(22), '|', r['intitule'][:34].ljust(34), '|', r['date_obtention'], '->', r['date_expiration'], '|', r['statut'], '|', r['_conf'])
    if unmatched:
        print('\n--- LIGNES SANS SALARIÉ APPARIÉ (non importées — créer le salarié puis relancer) ---')
        for nom, items in unmatched.items():
            print('  ', nom, ':', ' ; '.join(items))
    if not apply:
        print('\nDRY-RUN — rien écrit. --apply pour insérer.')
        return
    payloads = [{k: v for k, v in r.items() if not k.startswith('_')} for r in to_insert]
    ok = 0
    for k in range(0, len(payloads), 50):
        try:
            http('POST', '/rest/v1/certifications', payloads[k:k + 50], prefer='return=minimal')
            ok += len(payloads[k:k + 50])
        except urllib.error.HTTPError as e:
            print('ERREUR batch', k, ':', e.code, e.read().decode()[:300])
    print('Inséré :', ok)


if __name__ == '__main__':
    main()
