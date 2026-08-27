# -*- coding: utf-8 -*-
"""
Import des ECME (Tableau de bord ECME, ~266 lignes) → table `ecme` de l'ERP.
Mapping : Identification→code, Désignation→designation, Type→type, Affectation→localisation,
Validité(mois)→periodicite_mois, Dernière vérif→date_dernier_etalonnage, Prochaine vérif→date_prochain_etalonnage.
statut calculé (reforme si présent=0, sinon conforme/bientot/a_etalonner). Idempotent par code.

Usage : python import_ecme.py            (dry-run)
        python import_ecme.py --apply
"""
import openpyxl, urllib.request, json, sys, datetime
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass
SRC = r"C:\Users\eddys\OneDrive\Bureau\Seem semrac\dONN2ES\Copie de Tableau de bord QUALITE V2 07 05 2026 AGATHE.xlsm"
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
TODAY = datetime.date.today()


def d10(v):
    if v is None:
        return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    return s[:10] if len(s) >= 8 else None


def addmonths(iso, m):
    if not iso:
        return None
    try:
        y, mo, d = map(int, iso[:10].split('-'))
        mo2 = mo - 1 + int(m or 12)
        y += mo2 // 12
        mo = mo2 % 12 + 1
        import calendar
        d = min(d, calendar.monthrange(y, mo)[1])
        return '%04d-%02d-%02d' % (y, mo, d)
    except Exception:
        return None


def statut(present, prochain):
    if present == 0:
        return 'reforme'
    if not prochain:
        return 'conforme'
    pd = datetime.date.fromisoformat(prochain)
    if pd < TODAY:
        return 'a_etalonner'
    if (pd - TODAY).days <= 30:
        return 'bientot'
    return 'conforme'


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
    ws = wb['Tableau de bord ECME']
    recs = []
    for row in ws.iter_rows(min_row=7, max_col=11, values_only=True):
        present, typ, desig, affect, ident = row[0], row[1], row[2], row[3], row[4]
        if not (typ and str(typ).strip()) and not (ident and str(ident).strip()):
            continue
        dern = d10(row[5])
        period = None
        try:
            period = int(float(row[6])) if row[6] not in (None, '') else 12
        except Exception:
            period = 12
        proch = d10(row[7]) or addmonths(dern, period)
        notes = row[10] if len(row) > 10 else None
        pres = 1
        try:
            pres = int(float(present)) if present not in (None, '') else 1
        except Exception:
            pres = 1
        recs.append({
            'code': (str(ident).strip() if ident else None),
            'designation': (str(desig).strip() if desig else (str(typ).strip() if typ else '(ECME)')),
            'type': (str(typ).strip() if typ else None),
            'localisation': (str(affect).strip() if affect else None),
            'periodicite_mois': period,
            'date_dernier_etalonnage': dern,
            'date_prochain_etalonnage': proch,
            'statut': statut(pres, proch),
            'notes': (str(notes).strip() if notes else None),
        })
    return recs


def main():
    apply = '--apply' in sys.argv
    recs = parse()
    from collections import Counter
    print('ECME parsés :', len(recs))
    print('  par statut :', dict(Counter(r['statut'] for r in recs)))
    print('  avec code  :', sum(1 for r in recs if r['code']), '| avec date prochaine :', sum(1 for r in recs if r['date_prochain_etalonnage']))
    print('--- échantillon ---')
    for r in recs[:6]:
        print('  ', r['code'], '|', r['type'], '|', str(r['designation'])[:24], '|', r['localisation'], '| proch', r['date_prochain_etalonnage'], '|', r['statut'])
    if not apply:
        print('\nDRY-RUN — rien écrit. --apply pour insérer.')
        return
    existing = http('GET', '/rest/v1/ecme?select=code')
    ex = set(x.get('code') for x in existing)
    todo = [r for r in recs if r['code'] and r['code'] not in ex] + [r for r in recs if not r['code']]
    print('déjà en base :', len(ex), '| à insérer :', len(todo))
    for k in range(0, len(todo), 50):
        http('POST', '/rest/v1/ecme', todo[k:k + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
