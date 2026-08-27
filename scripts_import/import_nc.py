# -*- coding: utf-8 -*-
"""
Import du registre NC (Tableau de bord NC PMQ3-D2, 171 lignes) -> table `non_conformites`.
Forward-compatible : sonde les colonnes existantes et n'envoie que celles-ci. Si les colonnes
riches (type_defaut, type_cause, description, ...) sont ajoutees (qhse_schema.sql), un nouveau
run les backfille et le Pareto Qualite devient LIVE. Idempotent par id (NC-<FicheN>).

Usage : python import_nc.py            (dry-run)
        python import_nc.py --apply
"""
import openpyxl, urllib.request, urllib.error, json, sys, datetime
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Copie de Tableau de bord QUALITE V2 07 05 2026 AGATHE.xlsm"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}

BASE_COLS = ['id', 'date_nc', 'type_nc', 'client_nom', 'lot_ref', 'operation', 'gravite', 'statut', 'detecteur', 'categorie', 'entite']
RICH_COLS = ['type_defaut', 'type_cause', 'description', 'ref_article', 'n_commande', 'designation', 'action_corrective', 'nb_pieces', 'nb_litige', 'frc']
TYPE_MAP = {'CLIENT': 'client', 'INTERNE': 'interne', 'FOUR': 'fournisseur', 'FOURNISSEUR': 'fournisseur'}


def s(v):
    if v is None:
        return None
    t = str(v).strip()
    return t or None


def d10(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return None


def num(v):
    try:
        return int(float(v))
    except Exception:
        return None


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


def col_exists(col):
    try:
        http('GET', '/rest/v1/non_conformites?select=%s&limit=1' % col)
        return True
    except urllib.error.HTTPError:
        return False


def parse():
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb['Tableau de bord NC PMQ3-D2']
    recs = []
    for row in ws.iter_rows(min_row=9, max_col=34, values_only=True):
        date = row[1]
        if not isinstance(date, (datetime.datetime, datetime.date)):
            continue
        fiche = row[0]
        if fiche in (None, ''):
            continue
        typ = (str(row[2]).strip().upper() if row[2] else '')
        statut = 'cloture' if d10(row[33]) else 'ouverte'
        recs.append({
            'id': 'NC-%s' % str(fiche).strip().replace(' ', ''),
            'date_nc': d10(date),
            'type_nc': TYPE_MAP.get(typ, 'production'),
            'client_nom': s(row[3]),
            'lot_ref': s(row[9]),
            'operation': s(row[5]),
            'gravite': 'Majeure',
            'statut': statut,
            'detecteur': None,
            'categorie': None,
            'entite': None,
            # riches (envoyees seulement si la colonne existe)
            'type_defaut': s(row[18]),
            'type_cause': s(row[20]),
            'description': s(row[15]),
            'ref_article': s(row[9]),
            'n_commande': s(row[6]),
            'designation': s(row[10]),
            'action_corrective': s(row[30]),
            'nb_pieces': num(row[11]),
            'nb_litige': num(row[12]),
            'frc': s(row[7]),
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    recs = parse()
    from collections import Counter
    print('NC parsees :', len(recs))
    print('  par type  :', dict(Counter(r['type_nc'] for r in recs)))
    print('  par statut :', dict(Counter(r['statut'] for r in recs)))
    print('  avec type_defaut :', sum(1 for r in recs if r['type_defaut']))
    print('--- echantillon ---')
    for r in recs[:5]:
        print('  ', r['id'], '|', r['date_nc'], '|', r['type_nc'], '|', r['client_nom'], '|', r['type_defaut'], '|', r['statut'])
    if not apply:
        print('\nDRY-RUN. --apply pour inserer.')
        return
    cols = list(BASE_COLS)
    for c in RICH_COLS:
        if col_exists(c):
            cols.append(c)
    print('colonnes presentes en base :', cols)
    rich_missing = [c for c in RICH_COLS if c not in cols]
    if rich_missing:
        print('colonnes riches ABSENTES (lance qhse_schema.sql puis relance pour les backfiller) :', rich_missing)
    existing = http('GET', '/rest/v1/non_conformites?select=id')
    ex = set(x.get('id') for x in existing)
    nb_new = sum(1 for r in recs if r['id'] not in ex)
    print('deja en base :', len(ex), '| nouveaux :', nb_new, '| upsert (insert + backfill colonnes riches) :', len(recs))
    # upsert : insère les nouveaux ET backfille/merge les colonnes (dont les riches) sur l'existant
    payloads = [{k: r.get(k) for k in cols} for r in recs]
    for k in range(0, len(payloads), 50):
        http('POST', '/rest/v1/non_conformites?on_conflict=id', payloads[k:k + 50],
             prefer='resolution=merge-duplicates,return=minimal')
    print('Upsert OK :', len(payloads), '| nouveaux insérés :', nb_new, '| backfillés :', len(recs) - nb_new)


if __name__ == '__main__':
    main()
