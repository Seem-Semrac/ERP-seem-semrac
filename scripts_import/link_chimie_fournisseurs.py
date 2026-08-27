# -*- coding: utf-8 -*-
"""
Rattache les produits chimiques (hse_produits_chimiques) à leur fournisseur via la MARQUE :
- marque -> fournisseur existant (match par nom normalisé) ou CRÉÉ dans `fournisseurs` ;
- pose hse_produits_chimiques.fournisseur_id ;
- ajoute chaque référence produit (codes de ref_stock) au catalogue `produits_fournisseurs`
  (upsert sur fournisseur_id,reference).

Usage : python link_chimie_fournisseurs.py            (dry-run)
        python link_chimie_fournisseurs.py --apply
"""
import re, json, urllib.request, sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
except Exception:
    pass
URL = 'https://vyqgrasezpyqjwvijwvv.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def http(method, path, body=None, prefer=None):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = dict(HDRS)
    if body is not None:
        h['Content-Type'] = 'application/json'
    if prefer:
        h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        txt = r.read().decode('utf-8')
        return json.loads(txt) if txt else None


def norm(s):
    return re.sub(r'[^a-z0-9]', '', str(s or '').lower())


def codes(s):
    return re.findall(r'\d{4,6}', str(s or ''))


def main():
    apply = '--apply' in sys.argv
    chem = http('GET', '/rest/v1/hse_produits_chimiques?select=id,nom,ref_stock,fournisseur_nom,fournisseur_id')
    fourn = http('GET', '/rest/v1/fournisseurs?select=id,nom')
    fbyn = {norm(f['nom']): f for f in fourn}

    def find(marque):
        nm = norm(marque)
        if not nm:
            return None
        if nm in fbyn:
            return fbyn[nm]
        if len(nm) >= 4:
            for f in fourn:
                nf = norm(f['nom'])
                if nf and (nf == nm or nf.startswith(nm) or nm.startswith(nf) or (len(nm) >= 5 and nm in nf) or (len(nf) >= 5 and nf in nm)):
                    return f
        return None

    marques = sorted(set((c['fournisseur_nom'] or '').strip() for c in chem if (c.get('fournisseur_nom') or '').strip()))
    marque_id = {}
    to_create = []
    for m in marques:
        f = find(m)
        if f:
            marque_id[m] = f['id']
        else:
            to_create.append(m)

    chem_with_marque = [c for c in chem if (c.get('fournisseur_nom') or '').strip()]
    cat_refs = sum(len(codes(c.get('ref_stock'))) for c in chem_with_marque)
    print('Produits avec marque :', len(chem_with_marque), '| marques uniques :', len(marques))
    print('  marques = fournisseur existant :', len(marque_id))
    print('  fournisseurs À CRÉER           :', len(to_create))
    print('  ->', to_create)
    print('  références catalogue à ajouter :', cat_refs)
    print('  fournisseur_id à poser sur produits :', sum(1 for c in chem_with_marque if not c.get('fournisseur_id')))

    if not apply:
        print('\nDRY-RUN — rien écrit. --apply pour appliquer.')
        return

    # 1) créer les fournisseurs manquants
    for m in to_create:
        row = http('POST', '/rest/v1/fournisseurs', {'nom': m, 'categorie': 'Produits chimiques', 'actif': True}, prefer='return=representation')
        fid = (row[0]['id'] if isinstance(row, list) else row['id'])
        marque_id[m] = fid
    print('Fournisseurs créés :', len(to_create))

    # 2) poser fournisseur_id sur les produits + 3) catalogue
    nchem, ncat = 0, 0
    for c in chem_with_marque:
        m = c['fournisseur_nom'].strip()
        fid = marque_id.get(m)
        if not fid:
            continue
        if c.get('fournisseur_id') != fid:
            http('PATCH', '/rest/v1/hse_produits_chimiques?id=eq.' + str(c['id']), {'fournisseur_id': fid}); nchem += 1
        for ref in codes(c.get('ref_stock')):
            http('POST', '/rest/v1/produits_fournisseurs?on_conflict=fournisseur_id,reference',
                 {'fournisseur_id': fid, 'fournisseur_nom': m, 'reference': ref, 'designation': c['nom'],
                  'categorie': 'chimique', 'source_prix': 'import', 'statut': 'actif'},
                 prefer='resolution=merge-duplicates,return=minimal')
            ncat += 1
    print('Produits liés (fournisseur_id) :', nchem, '| lignes catalogue upsert :', ncat)


if __name__ == '__main__':
    main()
