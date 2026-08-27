# -*- coding: utf-8 -*-
"""
RECONSTRUCTION PROPRE de hse_produits_chimiques à partir des 2 sources :
- Inventaire (.xls)  = données de RISQUE (H/P, pictos, CMR, quantité) — multi-lignes par produit.
- Registre FDS (.xlsx) = 1 ligne/produit nommé : FDS N° / FP N° / MARQUE / PRODUIT / GPAO / SECTEUR.
  ⚠ Les lignes du registre SANS nom de produit (N° FDS réservés vides) sont IGNORÉES.

Modèle : UN produit = UNE ligne. Master = registre FDS (nommés) ∪ inventaire, fusionnés par
code GPAO puis par nom (similarité). Remplace intégralement la table (idempotent : delete-all + insert).

Usage : python rebuild_chimiques.py            (dry-run)
        python rebuild_chimiques.py --apply
"""
import pandas as pd, sys, re, json, urllib.request
from difflib import SequenceMatcher
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass

INV = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Inventaire des produits chimiques.xls"
FDS = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Fichier suivi F.D.S et F.P.xlsx"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
TABLE = 'hse_produits_chimiques'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
CMR_RE = re.compile(r'H3(40|41|45|50|51|60|61|62)|R4[5-9]|R6[01]', re.I)


def cc(df, i, j):
    if j >= df.shape[1]:
        return ''
    v = df.iat[i, j]
    if pd.isna(v):
        return ''
    s = str(v).strip()
    return '' if s.lower() == 'nan' else s


def codes(s):
    return set(re.findall(r'\d{5,6}', str(s or '')))


def nkey(s):
    s = re.sub(r',.*$', '', str(s or ''))            # enlève la catégorie après virgule
    toks = re.findall(r'[a-z0-9]+', s.lower())        # tokens triés → insensible à l'ordre des mots
    return ''.join(sorted(toks))


def num(s):
    if not s:
        return None
    m = re.search(r'\d+(?:[.,]\d+)?', str(s).replace(' ', ''))
    return float(m.group(0).replace(',', '.')) if m else None


def parse_inventory():
    df = pd.read_excel(INV, header=None, engine='xlrd')
    prods, cur = [], None
    for i in range(1, df.shape[0]):
        code = cc(df, i, 0)
        if code:
            if cur and cur['nom']:
                prods.append(cur)
            cur = {'code': code, 'nom': cc(df, i, 2), 'H': [], 'P': [], 'picto': [], 'effets': [], 'expo': [],
                   'ut': cc(df, i, 8), 'forme': cc(df, i, 9), 'qutil': cc(df, i, 10), 'qmax': cc(df, i, 11), 'rub': cc(df, i, 12)}
        if not cur:
            continue
        for k, j in (('H', 3), ('P', 5), ('effets', 6), ('expo', 7)):
            v = cc(df, i, j)
            if v and v not in cur[k]:
                cur[k].append(v)
        pic = cc(df, i, 4)
        if pic and pic not in cur['picto']:
            cur['picto'].append(pic)
    if cur and cur['nom']:
        prods.append(cur)
    for p in prods:
        p['codes'] = codes(p['code']); p['nkey'] = nkey(p['nom'])
    return prods


def parse_fds_named():
    df = pd.read_excel(FDS, header=None, engine='openpyxl')
    out = []
    for i in range(4, df.shape[0]):
        prod = cc(df, i, 4)
        if not prod:                       # ligne sans produit = N° FDS réservé vide → ignorée
            continue
        out.append({'fds': cc(df, i, 0), 'fp': cc(df, i, 1), 'marque': cc(df, i, 3),
                    'nom': prod, 'gpao': cc(df, i, 5), 'secteur': cc(df, i, 6),
                    'codes': codes(cc(df, i, 5)), 'nkey': nkey(prod)})
    return out


def best_inv(fp, invs, used):
    cand = [iv for iv in invs if id(iv) not in used and fp['codes'] and (fp['codes'] & iv['codes'])]
    if not cand:
        cand = [iv for iv in invs if id(iv) not in used and fp['nkey'] and (fp['nkey'] == iv['nkey'] or fp['nkey'] in iv['nkey'] or iv['nkey'] in fp['nkey'])]
    if not cand:
        cand = [iv for iv in invs if id(iv) not in used and fp['nkey'] and iv['nkey'] and SequenceMatcher(None, fp['nkey'], iv['nkey']).ratio() >= 0.85]
    if not cand:
        return None
    cand.sort(key=lambda iv: SequenceMatcher(None, fp['nkey'], iv['nkey']).ratio(), reverse=True)
    return cand[0]


def risk_fields(iv):
    if not iv:
        return {}
    H, P = iv['H'], iv['P']
    cmr = CMR_RE.search(' '.join(H))
    qmax = num(iv['qmax'])
    unite = 'kg' if ('kg' in (iv['qutil'] + iv['qmax']).lower()) else None
    forme_l = iv['forme'].lower()
    statut = 'retire' if ('plus utilis' in forme_l or 'remplac' in forme_l) else 'en_stock'
    compat = ' · '.join([x for x in [
        ('Usage : ' + iv['forme']) if iv['forme'] else '',
        ('Rubrique ICPE 4000 : ' + iv['rub']) if iv['rub'] else '',
        ('Effets : ' + ' '.join(iv['effets'])) if iv['effets'] else '',
        ('Exposition : ' + ' '.join(iv['expo'])) if iv['expo'] else '',
    ] if x])
    return {'mentions_danger': H + P, 'pictogrammes': [], 'cmr': ('Oui (' + ', '.join(sorted(set(re.findall(r'H3\d\d|R\d\d', ' '.join(H), re.I)))) + ')') if cmr else '',
            'quantite': qmax, 'unite': unite, 'statut': statut, 'compatibilites': (compat[:1000] or None), 'zone_inv': iv['ut']}


def build():
    invs = parse_inventory()
    fdss = parse_fds_named()
    used = set()
    recs = []

    def rec(nom, ref_codes, fds=None, iv=None):
        r = {'entite': 'Seem', 'nom': nom.strip(), 'ref_stock': ('/'.join(sorted(ref_codes)) or None),
             'fds_ref': None, 'fournisseur_nom': None, 'zone_stockage': None, 'cas': None, 'vlep': None,
             'etat': None, 'pictogrammes': [], 'mentions_danger': [], 'cmr': '', 'quantite': None, 'unite': None,
             'statut': 'en_stock', 'compatibilites': None, 'retention': False}
        if fds:
            r['fds_ref'] = fds['fds'] + (' (' + fds['fp'] + ')' if fds['fp'] else '') if fds['fds'] else None
            r['fournisseur_nom'] = fds['marque'] or None
            r['zone_stockage'] = fds['secteur'] or None
        rf = risk_fields(iv)
        for k in ('mentions_danger', 'pictogrammes', 'cmr', 'quantite', 'unite', 'statut', 'compatibilites'):
            if k in rf:
                r[k] = rf[k]
        if not r['zone_stockage'] and rf.get('zone_inv'):
            r['zone_stockage'] = rf['zone_inv']
        return r

    # 1) master = produits nommés du registre FDS, enrichis du risque (inventaire)
    for fp in fdss:
        iv = best_inv(fp, invs, used)
        if iv:
            used.add(id(iv))
        rcodes = fp['codes'] | (iv['codes'] if iv else set())
        recs.append(rec(fp['nom'], rcodes, fds=fp, iv=iv))
    # 2) + produits d'inventaire non rattachés à une FDS (risque sans FDS), sans recréer un quasi-doublon
    seen_nk = set(nkey(r['nom']) for r in recs)
    by_nk = {nkey(r['nom']): r for r in recs}
    for iv in invs:
        if id(iv) in used:
            continue
        k = nkey(iv['nom'])
        if k in seen_nk:                              # quasi-doublon : on fusionne le risque dans l'existant
            r = by_nk[k]; rf = risk_fields(iv)
            if not r['mentions_danger'] and rf.get('mentions_danger'):
                for f in ('mentions_danger', 'cmr', 'quantite', 'unite', 'statut', 'compatibilites'):
                    if rf.get(f):
                        r[f] = rf[f]
            continue
        nr = rec(iv['nom'], iv['codes'], fds=None, iv=iv)
        recs.append(nr); seen_nk.add(k); by_nk[k] = nr
    return recs, len(invs), len(fdss)


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
    recs, ninv, nfds = build()
    sansnom = [r for r in recs if not r['nom']]
    print('Inventaire:', ninv, '| Registre FDS (nommés):', nfds, '| → produits propres:', len(recs))
    print('  sans nom        :', len(sansnom), '(doit être 0)')
    print('  avec FDS réelle :', sum(1 for r in recs if r['fds_ref']))
    print('  avec risque (H/P):', sum(1 for r in recs if r['mentions_danger']))
    print('  avec marque     :', sum(1 for r in recs if r['fournisseur_nom']))
    print('  avec quantité   :', sum(1 for r in recs if r['quantite'] is not None))
    # doublons de nom ?
    from collections import Counter
    dup = [n for n, k in Counter(nkey(r['nom']) for r in recs).items() if k > 1 and n]
    print('  noms dupliqués  :', len(dup))
    print('\n--- échantillon (10) ---')
    for r in recs[:10]:
        print('  ', (r['ref_stock'] or '—'), '|', str(r['fds_ref'] or '—'), '|', str(r['fournisseur_nom'] or '—'), '|', r['nom'][:34], '| H/P', len(r['mentions_danger']), '| cmr', r['cmr'] or '-')
    if not apply:
        print('\nDRY-RUN — rien écrit. --apply pour REMPLACER toute la table.')
        return
    cur = http('GET', '/rest/v1/' + TABLE + '?select=id')
    print('\nLignes actuelles à supprimer:', len(cur))
    ids = [x['id'] for x in cur]
    for k in range(0, len(ids), 80):
        chunk = ids[k:k + 80]
        http('DELETE', '/rest/v1/' + TABLE + '?id=in.(' + ','.join(chunk) + ')')
    for k in range(0, len(recs), 50):
        http('POST', '/rest/v1/' + TABLE, recs[k:k + 50])
    print('Supprimé', len(ids), '· inséré', len(recs))


if __name__ == '__main__':
    main()
