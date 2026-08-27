# -*- coding: utf-8 -*-
"""Normalise le vocabulaire libre (zone / secteur / unité de travail) vers le canon qref.
Conservateur : ne remappe QUE si la valeur, une fois normalisée (minuscule, sans accent),
correspond à une entrée du canon OU à un synonyme explicite. Sinon la valeur est laissée
telle quelle et listée comme « non mappée » pour revue. Idempotent.

Canons miroir de src/qref.ts : UT_CANONIQUES (unité de travail) et SECTEURS_ATELIER (zone/secteur).

Usage : python canon_vocab.py            (dry-run)
        python canon_vocab.py --apply
"""
import urllib.request, urllib.error, json, sys, unicodedata, re
from collections import Counter
try: sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception: pass
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}

UT_CANONIQUES = [
    'Bureaux / Administratif', 'Usinage', 'Découpe et façonnage', 'Traitement / procédés spécifiques',
    'Montage', 'Montage puissance', 'Magasins', 'Maintenance', 'Emballage', 'Chaufferie / four',
    'Réfectoire / parties communes', 'Déplacements extérieurs', 'Parking', 'Tout le personnel / Global usine',
]
SECTEURS_ATELIER = [
    'Oxydation', 'Sérigraphie', 'Tôlerie', 'Usinage', 'Dissipation', 'Tronçonnage', 'Découpe', 'Pliage',
    'Poinçonnage', 'Ébavurage', 'Ponçage', 'Soudure', 'Collage', 'Montage', 'Montage puissance', 'Magasin',
    'Expédition', 'Bureaux', 'Maintenance', 'Parties communes', 'Autre',
]
SYN_UT = {
    'maintenace': 'Maintenance', 'maitenance': 'Maintenance', 'usinage cn': 'Usinage',
    'magasin': 'Magasins', 'administratif': 'Bureaux / Administratif',
    'parties communes': 'Réfectoire / parties communes',
    'oas bains': 'Traitement / procédés spécifiques', 'pliage poinconnage': 'Découpe et façonnage',
}
SYN_SECT = {
    'montage de puissance': 'Montage puissance', 'montage semrac': 'Montage',
    'administratif': 'Bureaux', 'postes a souder': 'Soudure',
    'pliage poinconnage': 'Pliage', 'dissipateur': 'Dissipation', 'atelier dissipation': 'Dissipation',
    'poncage': 'Ponçage', 'ebavurage': 'Ébavurage', 'zone stockage': 'Magasin', 'ligne oas': 'Oxydation',
}


def norm(x):
    t = unicodedata.normalize('NFKD', str(x or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None: h['Content-Type'] = 'application/json'
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8'); return json.loads(t) if t else None


def make_canon(canon_list, syn):
    cmap = {norm(c): c for c in canon_list}
    smap = {norm(k): v for k, v in syn.items()}
    def canon(v):
        n = norm(v)
        if not n: return None
        if n in cmap: return cmap[n]
        if n in smap: return smap[n]
        return None
    return canon


TARGETS = [
    ('hse_incidents', 'zone', make_canon(SECTEURS_ATELIER, SYN_SECT)),
    ('hse_risques', 'unite_travail', make_canon(UT_CANONIQUES, SYN_UT)),
    ('hse_risques', 'zone', make_canon(SECTEURS_ATELIER, SYN_SECT)),
    ('actions_correctives', 'origine', make_canon(SECTEURS_ATELIER, SYN_SECT)),
    ('hse_flash', 'secteur', make_canon(SECTEURS_ATELIER, SYN_SECT)),
]


def main():
    apply = '--apply' in sys.argv
    tot_patch = 0
    for table, col, canon in TARGETS:
        try:
            rows = http('GET', '/rest/v1/%s?select=id,%s' % (table, col))
        except urllib.error.HTTPError as e:
            print('%-22s %s : table absente/inaccessible (%s)' % (table, col, e.code)); continue
        changes, unmapped = [], Counter()
        for r in rows:
            v = r.get(col)
            if v is None or str(v).strip() == '': continue
            tgt = canon(v)
            if tgt is None:
                unmapped[str(v)] += 1
            elif str(tgt) != str(v):
                changes.append((r['id'], v, tgt))
        print('%-22s %-14s : %d à normaliser, %d valeurs non mappées' % (table, col, len(changes), len(unmapped)))
        for _id, old, new in changes[:6]:
            print('    "%s" -> "%s"' % (old, new))
        if unmapped:
            print('    non mappées :', dict(unmapped.most_common(12)))
        if apply:
            for _id, old, new in changes:
                http('PATCH', '/rest/v1/%s?id=eq.%s' % (table, urllib.request.quote(str(_id))), {col: new}, prefer='return=minimal')
            tot_patch += len(changes)
    print('\nTOTAL patché :', tot_patch if apply else '(dry-run)')
    if not apply:
        print('DRY-RUN. --apply pour normaliser. Les valeurs « non mappées » restent inchangées (à revoir/compléter SYN_*).')


if __name__ == '__main__':
    main()
