# -*- coding: utf-8 -*-
"""Seed défauts de la matrice EPI x zone -> hse_epi_zone (éditable ensuite dans l'ERP). Idempotent par id."""
import urllib.request, urllib.error, json, sys, unicodedata, re
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
CH, LU, BO, VE, GA, CA = 'Chaussures de sécurité', 'Lunettes de sécurité', "Bouchons d'oreilles", 'Vêtements de travail', 'Gants anti-coupure', 'Casque'
# Obligations par défaut par zone (éditables en 2 clics dans l'ERP)
DEFAULTS = {
    'Z1': [CH, LU, BO, VE, GA, CA],  # Dissipation / Tronçonnage
    'Z2': [CH, LU, BO, VE, GA],      # Oxydation
    'Z3': [CH, LU, BO, VE, GA],      # Tôlerie
    'Z4': [],                        # Bureaux
    'Z5': [CH, VE, CA],              # Magasin / Expédition (manutention)
    'Z6': [CH, LU, BO, VE, GA],      # Collage / Labo
    'Z7': [CH, LU, BO, VE],          # Montage Puissance
    'A':  [CH],                      # Allée piétonne
}


def slug(x):
    t = unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None: h['Content-Type'] = 'application/json'
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8'); return json.loads(t) if t else None


def main():
    apply = '--apply' in sys.argv
    rows = []
    for zone, epis in DEFAULTS.items():
        for epi in epis:
            rows.append({'id': 'EZ-%s-%s' % (zone, slug(epi)), 'entite': 'Seem', 'zone': zone, 'epi': epi, 'obligatoire': True})
    print('Obligations EPI×zone à créer :', len(rows))
    for r in rows[:6]:
        print('  ', r['zone'], '→', r['epi'])
    if not apply:
        print('\nDRY-RUN. --apply pour insérer.'); return
    existing = http('GET', '/rest/v1/hse_epi_zone?select=id')
    ex = set(x.get('id') for x in existing)
    todo = [r for r in rows if r['id'] not in ex]
    print('déjà en base :', len(ex), '| à insérer :', len(todo))
    for i in range(0, len(todo), 50):
        http('POST', '/rest/v1/hse_epi_zone', todo[i:i + 50], prefer='return=minimal')
    print('Inséré :', len(todo))


if __name__ == '__main__':
    main()
