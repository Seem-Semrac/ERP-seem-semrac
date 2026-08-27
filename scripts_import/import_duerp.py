# -*- coding: utf-8 -*-
"""
Fusion des 2 DUERP (.xls) en UN seul DUERP 2026 normalise -> table hse_risques.
- F1 = ancien document unique (riche, 19 familles) ; F2 = DUERP 2026 INRS (20 familles + residuelles).
- Taxonomie canonique 25 familles ; UT canoniques ; cotation Kinney (P*F*G*coef) conservee (score_brut)
  + rescale modele ERP gravite(1-4) x frequence(1-4) = criticite, priorite unifiee 1/2/3.
- Dedup cle = entite|famille_code|ut_canon|danger|produit ; collision -> pire cas (max score_brut),
  precedence F2 sur le descriptif, enrichissement F1, postes fusionnes dans zone, collisions journalisees.
- Idempotent : upsert on_conflict=(annee,cle_naturelle). Necessite duerp_schema.sql applique.

Usage : python import_duerp.py            (dry-run)
        python import_duerp.py --apply
"""
import xlrd, xlrd.xldate, urllib.request, urllib.error, json, sys, datetime, unicodedata, hashlib, re
from collections import Counter, defaultdict
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass

F1 = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\PSE1-D1 D.U document unique seem semrac.xls"
F2 = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\PSE1-D1 D.U.E.R.P 2026.xls"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ 9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'.replace(' ', '')
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
ANNEE = 2026

# Libellés recalés sur la brochure INRS ED 840 (oct. 2023) — 1-20 = les 20 fiches ED 840 ; 21-25 = autres risques internes.
FAM_LABEL = {
    1: '1. Chutes de plain-pied', 2: '2. Chute de hauteur', 3: '3. Circulation interne / engins',
    4: '4. Accidents routiers en mission', 5: '5. Charge physique de travail', 6: '6. Manutention mecanique',
    7: '7. Produits chimiques, emissions, dechets', 8: '8. Agents biologiques', 9: '9. Equipements de travail',
    10: "10. Chutes d'objet / effondrements", 11: '11. Bruit', 12: '12. Ambiances thermiques',
    13: '13. Incendie / explosion', 14: '14. Electricite', 15: '15. Ambiances lumineuses',
    16: '16. Rayonnements', 17: '17. Risques psychosociaux', 18: '18. Vibrations', 19: '19. Heurt / cognement',
    20: '20. Pratiques addictives', 21: '21. Brulures', 22: '22. Coupures', 23: '23. Travail isole',
    24: '24. Travail sur ecran', 25: '25. Projections',
}
# Familles INRS sans donnee dans les 2 fichiers (conservees au referentiel, 0 ligne) :
FAM_VIDES = {4, 6, 12, 18, 19, 20}


def norm(s):
    if s is None:
        return ''
    t = unicodedata.normalize('NFKD', str(s))
    t = ''.join(c for c in t if not unicodedata.combining(c)).lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())


# Mapping feuille -> famille_code (par nom de feuille normalise), par fichier
FAM_F1 = {
    '1 toxicite': 7, '2 biologique': 22, '3 brulure': 21, '4 incendies explosions': 13,
    '5 equipements de travail': 9, '6 coupure': 22, '7 manutention manuelle tms': 5,
    '8 travail en hauteur': 2, '9 electricite': 14, '10 bruit': 11, '11 travail isole': 23,
    '12 eclairement': 15, '13 travail sur ecran': 24, '14 chutes de plain pied': 1,
    '15 chutes d objet effondrements': 10, '16 rayonnement': 16, '17 projections': 25,
    '18 circulation': 3, '19 psychosociaux': 17,
}
FAM_F2 = {
    '1 chutes de plain pied': 1, '2 chute de hauteur': 2, '3 circulation engins': 3,
    '4 accidents routiers': 4, '5 charge physique de travail': 5, '6 manutention mecanique': 6,
    '7 produits chimiques dechets': 7, '8 agents biologiques': 22, '9 equipements de travail': 9,
    '10 chutes d objet effondrements': 10, '11 bruit': 11, '12 ambiances thermiques': 12,
    '13 incendies explosions': 13, '14 electricite': 14, '15 ambiances lumineuses': 15,
    '16 rayonnement': 16, '17 psychosociaux': 17, '18 vibrations': 18, '19 heurt cognement': 19,
    '20 pratiques addictives': 20, '3 brulure': 21, '6 coupure': 22, '11 travail isole': 23,
    '13 travail sur ecran': 24, '17 projections': 25,
}


def ut_canon(src):
    """unite de travail granulaire -> UT canonique + zone eventuelle. Retourne (canon, zone_extra)."""
    n = norm(src)
    if not n:
        return None, None
    if 'parking' in n:
        return 'Parking', None
    if 'deplacement' in n:
        return 'Deplacements exterieurs', None
    if 'refectoire' in n or 'parties communes' in n:
        return 'Refectoire / parties communes', None
    if 'chaufferie' in n or n == 'four':
        return 'Chaufferie / four', None
    if 'emballage' in n:
        return 'Emballage', None
    if 'armoires electriques' in n:
        return 'Maintenance', 'Armoires electriques'
    if 'maintenance' in n:
        return 'Maintenance', None
    if 'magasin' in n:
        return 'Magasins', None
    if 'montage puissance' in n or 'montage de puissance' in n:
        return 'Montage puissance', None
    if 'montage' in n:
        return 'Montage', None
    if any(k in n for k in ('decoupe', 'tronconnage', 'pliage', 'poinconnage', 'ebavurage', 'poncage')):
        return 'Decoupe et faconnage', None
    if any(k in n for k in ('traitement', 'soudure', 'soudage', 'souder', 'collage', 'serigraphie', 'oxydation', 'dissipat', 'tolerie')):
        return 'Traitement / procedes specifiques', None
    if 'metrologie' in n or 'usinage' in n:
        return 'Usinage', None
    if 'bureau' in n or 'administratif' in n or 'commercial' in n:
        return 'Bureaux / Administratif', None
    if 'tout le personnel' in n or 'global' in n:
        return 'Tout le personnel / Global usine', None
    return str(src).strip(), None   # non mappe : conserver tel quel (a affiner manuellement)


def entite_of(src):
    return 'Semrac' if 'semrac' in norm(src) else 'Seem'


def grav_erp(g):
    if not g:
        return None
    if g <= 5:
        return 1
    if g <= 10:
        return 2
    if g <= 15:
        return 3
    return 4


def maitrise_of(coef):
    if coef and coef >= 64:
        return 1
    if coef == 8:
        return 2
    return 3


def priorite_of(score_brut, criticite):
    if score_brut:
        if score_brut >= 400:
            return 1
        if score_brut >= 90:
            return 2
        return 3
    if criticite:
        if criticite >= 9:
            return 1
        if criticite >= 4:
            return 2
    return 3


def num(v):
    try:
        f = float(v)
        return f if f == f else None  # NaN guard
    except Exception:
        return None


def serial_to_date(v, datemode):
    f = num(v)
    if f is None or f < 1000:   # 'S35', petits entiers -> pas une date Excel
        return None
    try:
        return xlrd.xldate.xldate_as_datetime(f, datemode).strftime('%Y-%m-%d')
    except Exception:
        return None


def cell_txt(v):
    if v is None:
        return ''
    if isinstance(v, float):
        return ('%g' % v)
    return str(v).strip()


ROLE_RULES = [
    ('unite_travail', lambda n: n == 'unite de travail'),
    ('produits', lambda n: n == 'produits'),
    ('clp', lambda n: n.startswith('classe danger')),
    ('mesures', lambda n: 'mesures de prevention existantes' in n or n == 'manipulations' or 'mesures existantes' in n),
    ('proba', lambda n: n == 'probabilite'),
    ('freq', lambda n: 'frequence d exposition' in n or n == 'frequence'),
    ('grav', lambda n: n == 'gravite'),
    ('coef', lambda n: 'coef' in n),
    ('dba', lambda n: 'dba' in n or 'resultats dba' in n),
    ('score', lambda n: 'score du risque' in n or n == 'risque brut' or 'niveau de risque' in n),
    ('pilote', lambda n: n == 'pilote' or 'pilote' in n),
    ('delais', lambda n: n == 'delais' or n == 'delai'),
    ('residuel', lambda n: 'risque residuel' in n),
    ('poste', lambda n: 'identification activite' in n or n == 'poste' or n == 'taches' or n == 'tache'),
    ('danger', lambda n: 'phenomene dangereux' in n or n == 'danger' or 'source du bruit' in n or 'type de bruit' in n or 'phenomene' in n),
]


def build_colmap(headers):
    cm = {}
    for idx, h in enumerate(headers):
        n = norm(h)
        if not n:
            continue
        for role, test in ROLE_RULES:
            if role in cm:
                continue
            if test(n):
                cm[role] = idx
                break
    return cm


def find_header(sheet):
    for r in range(min(16, sheet.nrows)):
        for c in range(min(sheet.ncols, 6)):
            if norm(sheet.cell_value(r, c)) == 'unite de travail':
                return r
    return None


def parse_file(path, fam_map, fichier):
    wb = xlrd.open_workbook(path)
    dm = wb.datemode
    recs = []
    for sn in wb.sheet_names():
        code = fam_map.get(norm(sn))
        if not code:
            continue
        sh = wb.sheet_by_name(sn)
        hr = find_header(sh)
        if hr is None:
            continue
        cm = build_colmap([sh.cell_value(hr, c) for c in range(sh.ncols)])
        if 'unite_travail' not in cm:
            continue
        special = code in (11, 15)   # bruit / eclairement : pas de P/F/G classique
        last_ut = None
        for r in range(hr + 1, sh.nrows):
            row = [sh.cell_value(r, c) for c in range(sh.ncols)]
            ut_raw = cell_txt(row[cm['unite_travail']]) if cm.get('unite_travail') is not None else ''
            if ut_raw:
                last_ut = ut_raw
            danger = cell_txt(row[cm['danger']]) if cm.get('danger') is not None else ''
            produit = cell_txt(row[cm['produits']]) if cm.get('produits') is not None else ''
            P = num(row[cm['proba']]) if cm.get('proba') is not None else None
            F = num(row[cm['freq']]) if cm.get('freq') is not None else None
            G = num(row[cm['grav']]) if cm.get('grav') is not None else None
            coef = num(row[cm['coef']]) if cm.get('coef') is not None else None
            score = num(row[cm['score']]) if cm.get('score') is not None else None
            clp = cell_txt(row[cm['clp']]) if cm.get('clp') is not None else ''
            # ligne reelle ?
            if not danger and not produit and not P and not (score and not special):
                continue
            if norm(danger) in ('pilote', 'delais', 'fait') or norm(ut_raw) == 'unite de travail':
                continue
            utc, zone_extra = ut_canon(last_ut)
            if not utc:
                continue
            ent = entite_of(last_ut)
            mesures = cell_txt(row[cm['mesures']]) if cm.get('mesures') is not None else ''
            pilote = cell_txt(row[cm['pilote']]) if cm.get('pilote') is not None else ''
            delais = row[cm['delais']] if cm.get('delais') is not None else None
            residuel = cell_txt(row[cm['residuel']]) if cm.get('residuel') is not None else ''
            ech = serial_to_date(delais, dm)
            delais_txt = cell_txt(delais)
            if special:
                # bruit : gravite depuis dBa si dispo ; eclairement : defauts
                gerp = None
                if code == 11 and cm.get('dba') is not None:
                    dba = num(row[cm['dba']])
                    if dba:
                        gerp = 4 if dba > 87 else 3 if dba >= 85 else 2 if dba >= 80 else 1
                gerp = gerp or (2 if code == 15 else 2)
                ferp = int(F) if F and 1 <= F <= 4 else 3
                sb = None
                gb = pb = cf = None
            else:
                if not (P and F and G):
                    # ligne de cotation incomplete : on garde si danger, cotation par defaut basse
                    pass
                gb = int(G) if G else None
                pb = int(P) if P else None
                cf = int(coef) if coef else 1
                gerp = grav_erp(G) or 2
                ferp = int(F) if F and 1 <= F <= 4 else 2
                sb = int(P * F * G * cf) if (P and F and G) else (int(score) if score else None)
            crit = gerp * ferp
            prio = priorite_of(sb, crit)
            statut = 'en_cours' if (pilote or (delais_txt and not ech is None) or delais_txt) else ('maitrise' if residuel else 'a_traiter')
            if not danger and produit:
                danger = produit
            dgr = danger + ((' [' + clp + ']') if clp else '')
            plan_bits = []
            if pilote:
                plan_bits.append('Pilote: ' + pilote)
            if delais_txt and ech is None:
                plan_bits.append('Delai: ' + delais_txt)
            recs.append({
                'fichier': fichier, 'entite': ent, 'famille_code': code, 'famille': FAM_LABEL[code],
                'ut_canon': utc, 'ut_source': last_ut, 'zone': zone_extra or '',
                'danger': dgr, 'produit': produit,
                'mesures_existantes': mesures or None, 'mesures_prevues': '; '.join(plan_bits) or None,
                'plan_action': '; '.join(plan_bits) or None, 'responsable': pilote or None, 'echeance': ech,
                'probabilite': pb, 'freq_expo': (int(F) if F else None), 'gravite_brute': gb, 'coef': (int(coef) if coef else 1),
                'score_brut': sb, 'gravite': gerp, 'frequence': ferp, 'maitrise': maitrise_of(coef), 'criticite': crit,
                'priorite': prio, 'statut': statut, 'residuel': residuel,
            })
    return recs


def cle(rec):
    base = '|'.join([rec['entite'], str(rec['famille_code']), norm(rec['ut_canon']), norm(rec['danger'])[:80], norm(rec['produit'])[:40]])
    return hashlib.sha1(base.encode('utf-8')).hexdigest()[:24]


def merge(a, b, collisions):
    """fusionne 2 lignes de meme cle : pire cas cotation, precedence F2 descriptif, enrichissement, zone."""
    collisions.append((a['famille_code'], a['ut_canon'], a['danger'][:40]))
    worst = a if (a['score_brut'] or 0) >= (b['score_brut'] or 0) else b
    f2 = a if a['fichier'] == 'F2' else (b if b['fichier'] == 'F2' else worst)
    other = b if f2 is a else a
    zones = set(z for z in [a.get('zone'), b.get('zone'), a['ut_source'], b['ut_source']] if z)
    m = dict(f2)
    for k in ('probabilite', 'freq_expo', 'gravite_brute', 'coef', 'score_brut', 'gravite', 'frequence', 'maitrise', 'criticite', 'priorite'):
        m[k] = worst[k]
    for k in ('mesures_existantes', 'mesures_prevues', 'plan_action', 'responsable', 'echeance'):
        if not m.get(k) and other.get(k):
            m[k] = other[k]
    m['zone'] = ' / '.join(sorted(z for z in zones if norm(z) != norm(m['ut_canon'])))[:200]
    m['source'] = 'F1+F2' if {a['fichier'], b['fichier']} == {'F1', 'F2'} else f2['fichier']
    return m


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None:
        h['Content-Type'] = 'application/json'
    if prefer:
        h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=90) as r:
        t = r.read().decode('utf-8')
        return json.loads(t) if t else None


COLS = ['entite', 'unite_travail', 'zone', 'danger', 'risque', 'gravite', 'frequence', 'maitrise', 'criticite',
        'mesures_existantes', 'mesures_prevues', 'responsable', 'echeance', 'statut', 'annee', 'famille', 'famille_code',
        'ut_source', 'probabilite', 'freq_expo', 'gravite_brute', 'coef', 'score_brut', 'produits', 'plan_action',
        'priorite', 'source', 'cle_naturelle']


def main():
    apply = '--apply' in sys.argv
    r1 = parse_file(F1, FAM_F1, 'F1')
    r2 = parse_file(F2, FAM_F2, 'F2')
    print('Lignes parsees : F1 =', len(r1), '| F2 =', len(r2))
    # fusion : F1 d'abord, puis F2 (merge gere la precedence)
    acc = {}
    collisions = []
    for rec in r1 + r2:
        rec['source'] = rec['fichier']
        k = cle(rec)
        if k in acc:
            acc[k] = merge(acc[k], rec, collisions)
        else:
            acc[k] = rec
        acc[k]['cle_naturelle'] = k
    merged = list(acc.values())
    byfam = Counter(FAM_LABEL[m['famille_code']] for m in merged)
    byent = Counter(m['entite'] for m in merged)
    bysrc = Counter(m.get('source', m['fichier']) for m in merged)
    byprio = Counter(m['priorite'] for m in merged)
    print('Apres fusion/dedup :', len(merged), 'risques uniques (', len(r1) + len(r2) - len(merged), 'doublons fusionnes )')
    print('  par entite :', dict(byent), '| par source :', dict(bysrc), '| par priorite :', dict(byprio))
    print('  collisions journalisees :', len(collisions))
    print('--- par famille ---')
    for code in sorted(FAM_LABEL):
        lab = FAM_LABEL[code]
        n = byfam.get(lab, 0)
        flag = '  (VIDE - referentiel INRS conserve)' if (n == 0 and code in FAM_VIDES) else ('  !! 0 ligne' if n == 0 else '')
        if n or code in FAM_VIDES:
            print('  %2d %-40s %3d%s' % (code, lab[:40], n, flag))
    print('--- TOP 8 criticite (score Kinney) ---')
    for m in sorted(merged, key=lambda x: -(x['score_brut'] or 0))[:8]:
        print('  P%d' % (m['priorite']), '| brut', m['score_brut'], '|', m['entite'], '|', m['ut_canon'][:22].ljust(22), '|', str(m['danger'])[:42])
    if not apply:
        print('\nDRY-RUN. --apply pour upsert (idempotent on_conflict annee,cle_naturelle).')
        return
    payloads = []
    for m in merged:
        p = {
            'entite': m['entite'], 'unite_travail': m['ut_canon'], 'zone': m['zone'] or None, 'danger': m['danger'],
            'risque': m.get('residuel') or None, 'gravite': m['gravite'], 'frequence': m['frequence'], 'maitrise': m['maitrise'],
            'criticite': m['criticite'], 'mesures_existantes': m['mesures_existantes'], 'mesures_prevues': m['mesures_prevues'],
            'responsable': m['responsable'], 'echeance': m['echeance'], 'statut': m['statut'], 'annee': ANNEE,
            'famille': m['famille'], 'famille_code': m['famille_code'], 'ut_source': m['ut_source'],
            'probabilite': m['probabilite'], 'freq_expo': m['freq_expo'], 'gravite_brute': m['gravite_brute'],
            'coef': m['coef'], 'score_brut': m['score_brut'], 'produits': m['produit'] or None, 'plan_action': m['plan_action'],
            'priorite': m['priorite'], 'source': m.get('source', m['fichier']), 'cle_naturelle': m['cle_naturelle'],
        }
        payloads.append({k: p.get(k) for k in COLS})
    ok = 0
    for i in range(0, len(payloads), 50):
        try:
            http('POST', '/rest/v1/hse_risques?on_conflict=annee,cle_naturelle', payloads[i:i + 50],
                 prefer='resolution=merge-duplicates,return=minimal')
            ok += len(payloads[i:i + 50])
        except urllib.error.HTTPError as e:
            print('ERREUR batch', i, ':', e.code, e.read().decode()[:300]); break
    print('Upsert OK :', ok)


if __name__ == '__main__':
    main()
