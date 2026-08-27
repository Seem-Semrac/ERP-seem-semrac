# -*- coding: utf-8 -*-
"""Lit Feuil1 du fichier 'Liste créanciers fournisseurs', nettoie/fusionne les
corrections d'adresse, classe chaque ligne en Fournisseur ou Sous-traitant avec
une catégorie normalisée, et écrit le résultat en JSON pour génération SQL."""
import openpyxl, json, re, collections, unicodedata

SRC = r'C:\Users\eddys\Desktop\DCP Seem Semrac Liste créanciers fournisseurs.xlsx'
OUT = r'E:\ERP derniere version\scripts_import\fournisseurs_classes.json'

def g(v):
    return '' if v is None else str(v).strip()

def clean_siret(s):
    s = re.sub(r'\D', '', g(s))          # garder les chiffres
    if s in ('', '0', '1'):
        return None
    return s

def norm_type(t):
    """Normalise le libellé type de prestation (accents, typos)."""
    t = g(t).upper()
    # supprime tous les accents (y compris diacritiques composés)
    t = ''.join(c for c in unicodedata.normalize('NFKD', t) if not unicodedata.combining(c))
    t = re.sub(r'\s+', ' ', t).strip()
    repl = {
        'NEFOCE': 'NEGOCE',
        'ENTERIEN': 'ENTRETIEN', 'ENTRTIEN': 'ENTRETIEN',
        'VORAGES': 'VOYAGES',
    }
    for a, b in repl.items():
        t = t.replace(a, b)
    t = re.sub(r'\bCONTROL\b', 'CONTROLE', t)  # "control" typo -> CONTROLE (sans toucher CONTROLE)
    return t

# type normalisé -> catégorie fournisseur (liste CATEGORIES_FOURNISSEURS de l'appli)
FOURN_CAT = {
    'MATIERE PREMIERE': 'Matière première',
    'MATIERE PREMIERE IMPORT': 'Matière première',
    'MATIERE CONSOMMABLE': 'Consommables',
    'FOURNITURES ENTRETIEN': 'Consommables',
    'PETIT OUTILLAGE': 'Outillage',
    'PETIT-OUTILLAGE /EPI': 'EPI / Sécurité',
    'PETIT-OUTILLAGE/EPI': 'EPI / Sécurité',
    'EPI': 'EPI / Sécurité',
    'PHARMACIE': 'EPI / Sécurité',
    'EMBALLAGE': 'Emballage',
    'TRANSPORT': 'Transport',
    'LOCATION VEHICULE': 'Transport',
    'NEGOCE': 'Autres',
}
# tout le reste -> 'Autres'

# Catégories considérées "frais généraux / hors achats production" (option de tri)
OVERHEAD_TYPES = {
    'CONSEIL - RECRUTEMENT', 'INTERIM', 'HONORAIRES', 'FRAIS DE TELECOM',
    'MEDECINE DU TRAVAIL', 'FORMATION', 'FRAIS VOYAGES ET DEPLACEMENT',
    'ENERGIE', 'EAU', 'DOCUMENTATION', 'LOGICIEL', 'MAINTENANCE INFORMATIQUE',
    'INFORMATIQUE', 'LOCATION', 'LOCATION VEHICULE', 'ENTRETIEN', 'ENTRETIEN REPARATION',
    'ENTRETIEN IMMOBILIER', 'ENTRETIEN ESPACE VERT', 'MAINTENANCE GENERALE',
    'CONTROLE', 'ENTRETIEN DES LOCAUX', 'MATERIEL INDUSTRIEL',
    'ENTRETIEN/MAINTENANCE MACHINE', 'DECHET TRAITEMENT DE SURFACE',
    'FOURNITURES ADMINISTRATIVES',
}

def st_categorie(typ_norm, nom):
    nomu = nom.upper()
    if 'TRAITEMENT DE SURFACE' in typ_norm:
        return 'Finition / Traitement surface', ['Traitement de surface']
    # SOUS-TRAITANCE
    if 'LASER' in nomu:
        return 'Découpe laser / eau', ['Découpe laser']
    if 'MECANIQUE' in nomu or nomu.startswith('SIMA'):
        return 'Mécanique générale', ['Mécanique générale']
    return 'Autres', ['Sous-traitance']

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb['Feuil1']
rows_out = []
for i, r in enumerate(ws.iter_rows(min_row=4, values_only=True), start=4):
    nom = g(r[1])
    if not nom:
        continue
    code = g(r[0])
    compte = g(r[2])
    typ_raw = g(r[3])
    typ_norm = norm_type(typ_raw)
    # fusion adresse : corrections J/K/L prioritaires sur E/F/G
    rue = g(r[9]) or g(r[4])
    cp = g(r[10]) or g(r[5])
    ville = g(r[11]) or g(r[6])
    siret = clean_siret(r[12]) or clean_siret(r[7])
    adresse = ', '.join(p for p in [rue, ' '.join(x for x in [cp, ville] if x)] if p).strip(', ').strip()

    is_st = (compte == '604000')
    if is_st:
        cat, prest = st_categorie(typ_norm, nom)
        bucket = 'sous_traitant'
    else:
        cat = FOURN_CAT.get(typ_norm, 'Autres')
        prest = None
        bucket = 'overhead' if typ_norm in OVERHEAD_TYPES else 'fournisseur'

    rows_out.append({
        'row': i, 'code': code, 'nom': nom, 'compte': compte,
        'type_raw': typ_raw, 'type_norm': typ_norm,
        'adresse': adresse or None, 'siret': siret,
        'table': 'sous_traitants' if is_st else 'fournisseurs',
        'categorie': cat, 'prestations': prest,
        'bucket': bucket,
        'notes': f'Compte comptable {compte} · SAGE: {typ_raw}'.strip(' ·'),
    })

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(rows_out, f, ensure_ascii=False, indent=1)

# ---- APERÇU ----
st = [x for x in rows_out if x['table'] == 'sous_traitants']
fo = [x for x in rows_out if x['table'] == 'fournisseurs' and x['bucket'] == 'fournisseur']
ov = [x for x in rows_out if x['bucket'] == 'overhead']
print(f'TOTAL lignes valides : {len(rows_out)}')
print(f'  -> SOUS-TRAITANTS   : {len(st)}')
print(f'  -> FOURNISSEURS achats/prod : {len(fo)}')
print(f'  -> FOURNISSEURS frais généraux (overhead) : {len(ov)}')

print('\n===== SOUS-TRAITANTS (12) =====')
for x in st:
    print(f"  [{x['code']}] {x['nom'][:38]:38s} | {x['categorie']:30s} | {x['type_raw']}")

print('\n===== FOURNISSEURS achats/prod par catégorie =====')
by = collections.defaultdict(list)
for x in fo:
    by[x['categorie']].append(x)
for cat in sorted(by):
    print(f"\n-- {cat} ({len(by[cat])}) --")
    for x in by[cat]:
        print(f"    [{x['code']}] {x['nom'][:40]:40s} | {x['type_raw']}")

print('\n===== FOURNISSEURS frais généraux (overhead) =====')
byo = collections.defaultdict(list)
for x in ov:
    byo[x['type_norm']].append(x)
for cat in sorted(byo):
    names = ', '.join(f"{y['nom']}" for y in byo[cat])
    print(f"  {cat} ({len(byo[cat])}): {names}")
