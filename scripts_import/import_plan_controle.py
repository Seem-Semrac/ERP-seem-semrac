# -*- coding: utf-8 -*-
"""Import du Plan de Contrôle EN9100 (PRP1-D9_..._brouillon.xlsx) -> table plans_controle. Idempotent par id PC-<n>."""
import openpyxl, urllib.request, urllib.error, json, sys
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\PRP1-D9_Plan_de_Controle_EN9100_brouillon.xlsx"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def s(v):
    return (str(v).strip() or None) if v is not None and str(v).strip() else None


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
    ws = wb['Plan de Contrôle EN 9100']
    recs = []
    for row in ws.iter_rows(min_row=5, max_col=10, values_only=True):
        num = row[0]
        operation = s(row[1])
        try:
            num = int(float(num))
        except Exception:
            num = None
        if num is None and not operation:
            continue
        recs.append({
            'id': 'PC-%d' % num if num is not None else ('PC-' + (operation or 'x')[:8]),
            'num_ligne': num,
            'operation': operation,
            'classification_client': s(row[2]),
            'parametres': s(row[3]),
            'ecme_outils': s(row[4]),
            'frequence_echantillonnage': s(row[5]),
            'critere_acceptation': s(row[6]),
            'responsable': s(row[7]),
            'type_controle': s(row[8]),
            'plan_reaction': s(row[9]),
            'ordre': num,
            'statut': 'actif',
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    recs = parse()
    print('Lignes plan de contrôle parsées :', len(recs))
    for r in recs[:6]:
        print('  ', r['num_ligne'], '|', str(r['operation'])[:26], '|', str(r['parametres'] or '')[:24], '|', r['type_controle'])
    if not apply:
        print('\nDRY-RUN. --apply pour insérer.'); return
    existing = http('GET', '/rest/v1/plans_controle?select=id')
    ex = set(x.get('id') for x in existing)
    todo = [r for r in recs if r['id'] not in ex]
    print('déjà en base :', len(ex), '| à insérer :', len(todo))
    for i in range(0, len(todo), 50):
        http('POST', '/rest/v1/plans_controle', todo[i:i + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
