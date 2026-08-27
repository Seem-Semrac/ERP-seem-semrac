# -*- coding: utf-8 -*-
"""Génère le SQL d'insertion (idempotent) depuis fournisseurs_classes.json.
Usage: python generate_sql.py [all|prod]
  all  -> inclut les fournisseurs frais généraux (overhead)   [défaut]
  prod -> seulement sous-traitants + fournisseurs achats/production
"""
import json, sys

JSON = r'E:\ERP derniere version\scripts_import\fournisseurs_classes.json'
OUT = r'E:\ERP derniere version\scripts_import\import_fournisseurs.sql'
scope = sys.argv[1] if len(sys.argv) > 1 else 'all'

def q(v):
    if v is None or v == '':
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"

def arr(lst):
    if not lst:
        return 'NULL'
    return 'ARRAY[' + ','.join(q(x) for x in lst) + ']::text[]'

rows = json.load(open(JSON, encoding='utf-8'))
st = [r for r in rows if r['table'] == 'sous_traitants']
fo = [r for r in rows if r['table'] == 'fournisseurs' and (scope == 'all' or r['bucket'] == 'fournisseur')]

lines = []
lines.append('-- Import référentiel fournisseurs / sous-traitants (source: Feuil1, scope=%s)' % scope)
lines.append('-- Idempotent : ON CONFLICT (code) DO NOTHING\n')

# Sous-traitants
lines.append('INSERT INTO sous_traitants (code, nom, adresse, siret, categorie, activite, prestations, catalogue, approved, actif, notes) VALUES')
vals = []
for r in st:
    vals.append('  (%s, %s, %s, %s, %s, %s, %s, %s, true, true, %s)' % (
        q(r['code']), q(r['nom']), q(r['adresse']), q(r['siret']),
        q(r['categorie']), q('both'), arr(r['prestations']), "'[]'::jsonb", q(r['notes'])))
lines.append(',\n'.join(vals))
lines.append('ON CONFLICT (code) DO NOTHING;\n')

# Fournisseurs
lines.append('INSERT INTO fournisseurs (code, nom, adresse, siret, categorie, activite, catalogue, actif, notes) VALUES')
vals = []
for r in fo:
    vals.append('  (%s, %s, %s, %s, %s, %s, %s, true, %s)' % (
        q(r['code']), q(r['nom']), q(r['adresse']), q(r['siret']),
        q(r['categorie']), q('both'), "'[]'::jsonb", q(r['notes'])))
lines.append(',\n'.join(vals))
lines.append('ON CONFLICT (code) DO NOTHING;')

sql = '\n'.join(lines)
open(OUT, 'w', encoding='utf-8').write(sql)
print('scope=%s -> %d sous-traitants + %d fournisseurs' % (scope, len(st), len(fo)))
print('SQL écrit:', OUT, '(%d lignes)' % len(sql.splitlines()))
