# -*- coding: utf-8 -*-
"""
Import du registre des derogations (Tableau de bord Derog PMQ3-D4) -> table `derogations`.
Necessite que la table existe (lancer qhse_schema.sql). Idempotent par id (DER-<numero>).

Usage : python import_derogations.py            (dry-run)
        python import_derogations.py --apply
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
DEC = {'AT': 'AT', 'AL': 'AL', 'R': 'R'}
STA = {'EC': 'en_cours', 'S': 'solde', 'AN': 'annule'}


def s(v):
    if v is None:
        return None
    t = str(v).strip()
    return t or None


def d10(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
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


def parse():
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    ws = wb['Tableau de bord Dérog PMQ3-D4']
    recs = []
    for row in ws.iter_rows(min_row=8, max_col=16, values_only=True):
        date = row[1]
        if not isinstance(date, (datetime.datetime, datetime.date)):
            continue
        numero = row[0]
        try:
            numero = int(float(numero))
        except Exception:
            continue
        dec = (str(row[12]).strip().upper() if row[12] else '')
        st = (str(row[14]).strip().upper() if row[14] else '')
        recs.append({
            'id': 'DER-%d' % numero,
            'numero': numero,
            'date_demande': d10(date),
            'client': s(row[2]),
            'contact': s(row[3]),
            'tel': s(row[4]),
            'email': s(row[5]),
            'designation': s(row[6]),
            'cmd_client': s(row[7]),
            'ref_client': s(row[8]),
            'ar': s(row[9]),
            'notre_ref': s(row[10]),
            'descriptif': s(row[11]),
            'decision': DEC.get(dec),
            'date_cloture': d10(row[13]),
            'statut': STA.get(st, 'en_cours'),
            'commentaire': s(row[15]),
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    recs = parse()
    from collections import Counter
    print('Derogations parsees :', len(recs))
    print('  par decision :', dict(Counter(r['decision'] or '(vide)' for r in recs)))
    print('  par statut   :', dict(Counter(r['statut'] for r in recs)))
    for r in recs[:5]:
        print('  ', r['id'], '|', r['date_demande'], '|', r['client'], '|', r['decision'], '|', r['statut'])
    if not apply:
        print('\nDRY-RUN. --apply pour inserer.')
        return
    try:
        existing = http('GET', '/rest/v1/derogations?select=id')
    except urllib.error.HTTPError as e:
        print('ERREUR : la table `derogations` est introuvable (HTTP %s). Lancez qhse_schema.sql puis relancez.' % e.code)
        return
    ex = set(x.get('id') for x in existing)
    todo = [r for r in recs if r['id'] not in ex]
    print('deja en base :', len(ex), '| a inserer :', len(todo))
    for k in range(0, len(todo), 50):
        http('POST', '/rest/v1/derogations', todo[k:k + 50], prefer='return=minimal')
    print('Insere :', len(todo))


if __name__ == '__main__':
    main()
