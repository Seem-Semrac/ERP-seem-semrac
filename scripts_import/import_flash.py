# -*- coding: utf-8 -*-
"""Import Flash Sécurité (Tableau de bord Flash Sécurité) -> hse_flash. Idempotent par id (FLASH-NNN)."""
import openpyxl, urllib.request, urllib.error, json, sys, datetime
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Copie de Tableau de bord QUALITE V2 07 05 2026 AGATHE.xlsm"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
STAT = {'EC': 'en_cours', 'S': 'solde', 'EN COURS': 'en_cours', 'A SUPPRIMER': 'archive', 'SOLDE': 'solde'}


def s(v):
    return (str(v).strip() or None) if v is not None and str(v).strip() else None


def d10(v):
    return v.strftime('%Y-%m-%d') if isinstance(v, (datetime.datetime, datetime.date)) else None


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
    ws = wb['Tableau de bord Flash Sécurité']
    recs = []
    for row in ws.iter_rows(min_row=9, max_col=10, values_only=True):
        num = s(row[0])
        if not num or not isinstance(row[1], (datetime.datetime, datetime.date)):
            continue
        st = (s(row[7]) or '').upper() if len(row) > 7 else ''
        try: n = int(float(num)); idn = '%03d' % n; numero = n
        except Exception: idn = str(num); numero = None
        recs.append({
            'id': 'FLASH-%s' % idn, 'numero': numero, 'date': d10(row[1]), 'pilote': s(row[2]),
            'secteur': s(row[3]), 'evenement': s(row[4]), 'statut': STAT.get(st, 'diffuse'),
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    recs = parse()
    from collections import Counter
    print('Flash parsés :', len(recs), '| par statut :', dict(Counter(r['statut'] for r in recs)))
    for r in recs[:6]:
        print('  ', r['id'], '|', r['date'], '|', r['secteur'], '|', str(r['evenement'])[:34], '|', r['statut'])
    if not apply:
        print('\nDRY-RUN. --apply pour insérer.'); return
    existing = http('GET', '/rest/v1/hse_flash?select=id')
    ex = set(x.get('id') for x in existing)
    todo = [r for r in recs if r['id'] not in ex]
    print('déjà en base :', len(ex), '| à insérer :', len(todo))
    for i in range(0, len(todo), 50):
        http('POST', '/rest/v1/hse_flash', todo[i:i + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
