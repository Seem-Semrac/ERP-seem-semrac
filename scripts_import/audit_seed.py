# -*- coding: utf-8 -*-
"""
Génère scripts_import/audit_seed.sql — seed du module Audits de conformité à
partir du classeur « Planning daudits.xlsx » :
  • programme processus (9) + poste/flash (15) ;
  • 5 grilles ; questions VERBATIM des 4 grilles détaillées de l'Excel
    (Contrôle final, Soudure, Emballage, Informatique — 58 questions, source
    figée dans scripts_import/audit_questions.json) + grille flash générique T1-T9.

Les questions des grilles standard sont REMPLACÉES à chaque exécution (DELETE
puis INSERT) pour rester fidèles à l'Excel. Programme/grilles : ON CONFLICT DO NOTHING.

Usage : python scripts_import/audit_seed.py   (écrit le .sql)
Puis  : docker exec -i erp-db psql -U postgres -d postgres < scripts_import/audit_seed.sql
        (cloud : jouer via erp-db/PAT après audit_schema.sql)
"""
import os, json

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, 'audit_seed.sql')
EX = 2026


def dq(v):
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    return '$$' + str(v) + '$$'


GRILLES = [
    ('GRL-FLASH', 'Audit flash de poste (T1-T9)', 'poste',   'combine'),
    ('GRL-CF',    'Grille contrôle final & libération', 'poste', 'combine'),
    ('GRL-SOU',   'Grille soudure (procédé spécial)', 'procede', 'combine'),
    ('GRL-EMB',   'Grille emballage', 'poste', 'combine'),
    ('GRL-INFO',  'Grille informatique (27001/RGPD)', 'process', '27001'),
]
STD_GRILLES = [g[0] for g in GRILLES]

# Grille flash générique (dérivée de la légende thèmes terrain T1-T9 du classeur) — mode/sonde
FLASH_Q = [
    ('T1', 'EN 9100 §8.5.1.a', "Fiche d'instruction + fiche suiveuse présentes et au bon indice ?", 'manuel', ''),
    ('T2', 'EN 9100 §8.5.2/8.6', "Mesures d'autocontrôle enregistrées, traçabilité lot et matière, tampon/matricule GPAO ?", 'manuel', ''),
    ('T3', 'EN 9100 §7.1.5', "Les ECME utilisés au poste sont-ils dans leur validité d'étalonnage ?", 'auto', 'ecme'),
    ('T4', 'EN 9100 §7.1.4', "Poste propre, rangé, sans FOD ?", 'manuel', ''),
    ('T5', 'ISO 45001 §8', "Port des EPI obligatoires et respect des consignes ?", 'manuel', ''),
    ('T6', 'EN 9100 §7.1.3', "Maintenance 1er niveau réalisée ; VGP des équipements à jour ?", 'auto', 'vgp'),
    ('T7', 'ISO 45001 §6.1.2', "L'opérateur connaît-il les risques de son poste et le moyen de remonter une situation dangereuse ?", 'manuel', ''),
    ('T8', 'ISO 45001 §8.1.2', "Consignation LOTO / permis de travail respectés (permis feu, plan de prévention) ?", 'manuel', ''),
    ('T9', 'Code du travail R.4412', "Risques bruit/CMR maîtrisés ; FDS présentes, captage à la source en service ?", 'auto', 'fds'),
]

# Questions VERBATIM des 4 grilles de l'Excel (source figée)
XL = json.load(open(os.path.join(HERE, 'audit_questions.json'), encoding='utf-8'))

# Clause de référence par thème (pour l'affichage)
THEME_CLAUSE = {
    'T1': 'EN 9100 §8.5.1.1', 'T2': 'EN 9100 §8.5.2 / §8.6', 'T3': 'EN 9100 §7.1.5',
    'T4': 'EN 9100 §7.1.4', 'T5': 'ISO 45001 §8', 'T6': 'EN 9100 §7.1.3',
    'B': 'ISO/IEC 27001 §6.1', 'C': 'ISO/IEC 27001 §7 / Annexe A', 'H': 'EN 9100 §9 / §10',
}
# Rattachement ERP (auto-observation) là où une sonde existe ; sinon manuel
AUTO_MAP = {
    ('GRL-CF', '2.5'): ('auto', 'fai'),
    ('GRL-CF', '3.1'): ('auto', 'ecme'),
    ('GRL-SOU', '1.2'): ('auto', 'fds'),
    ('GRL-SOU', '2.1'): ('auto', 'certifications'),
}

PROCESS = [
    ('PRG-2026-P01', 'Direction',          'PILOTAGE',    'A,H',   'H,C',           '9001,9100,45001,14001',       '2026-12-01', 60),
    ('PRG-2026-P02', 'Management QSE',      'PILOTAGE',    'H,I,J,K', 'A,B,C,D,E,F,G,H', '9001,9100,45001,14001,27001', '2026-12-01', 90),
    ('PRG-2026-P03', 'Commerce',            'REALISATION', 'D',     'B,A',           '9001,9100',                   '2026-09-01', 60),
    ('PRG-2026-P04', 'B.E.I',               'REALISATION', 'E',     'A,B,C',         '9001,9100',                   '2026-11-01', 120),
    ('PRG-2026-P05', 'Production',          'REALISATION', 'G,I,J', 'A,B,C,H',       '9001,9100,45001,14001',       '2026-10-01', 180),
    ('PRG-2026-P06', 'Logistique',          'REALISATION', 'G,F',   'A,B,C',         '9001,9100',                   '2026-11-01', 90),
    ('PRG-2026-P07', 'Achats',              'SUPPORT',     'F',     'B,A',           '9001,9100',                   '2026-09-01', 90),
    ('PRG-2026-P08', 'Administratif/RH',    'SUPPORT',     'C,I',   'A',             '9001,9100,45001',             '2026-10-01', 90),
    ('PRG-2026-P09', 'Informatique',        'SUPPORT',     'C,K',   'B,H',           '9001,9100,27001',             '2026-07-01', 60),
]
POSTE = [
    ('PRG-2026-T01', 'Sertissage',            'T1,T2,T3,T4,T5,T6',    '2026-06-01', 'GRL-FLASH'),
    ('PRG-2026-T02', 'Poinconnage',           'T1,T2,T3,T4,T5,T6,T9', '2026-07-01', 'GRL-FLASH'),
    ('PRG-2026-T03', 'Controle final',        'T1,T2,T3,T4,T5',       '2026-07-01', 'GRL-CF'),
    ('PRG-2026-T04', 'Soudure',               'T1,T2,T3,T5,T6,T7,T8,T9', '2026-09-01', 'GRL-SOU'),
    ('PRG-2026-T05', 'Emballage',             'T1,T2,T4,T5',          '2026-09-01', 'GRL-EMB'),
    ('PRG-2026-T06', 'Usinage',               'T1,T2,T3,T4,T5,T6,T9', '2026-10-01', 'GRL-FLASH'),
    ('PRG-2026-T07', 'Pliage',                'T1,T2,T3,T4,T5,T6',    '2026-10-01', 'GRL-FLASH'),
    ('PRG-2026-T08', 'Reception magasin',     'T1,T2,T3,T4,T5',       '2026-11-01', 'GRL-FLASH'),
    ('PRG-2026-T09', 'Troneconnage',          'T1,T2,T3,T4,T5,T6,T9', '2026-11-01', 'GRL-FLASH'),
    ('PRG-2026-T10', 'Traitement de surface — OAS (anodisation)', 'T1,T2,T3,T4,T5,T6,T9', '2026-12-01', 'GRL-FLASH'),
    ('PRG-2026-T16', 'Traitement de surface — Surtec 650 (chromatation trivalente)', 'T1,T2,T3,T4,T5,T6,T9', '2026-12-01', 'GRL-FLASH'),
    ('PRG-2026-T11', 'Montage',               'T1,T2,T3,T4,T5',       '2026-12-01', 'GRL-FLASH'),
    ('PRG-2026-T12', 'Serigraphie',           'T1,T2,T3,T4,T5,T6',    '2027-01-01', 'GRL-FLASH'),
    ('PRG-2026-T13', 'Finitions',             'T1,T2,T3,T4,T5,T6',    '2027-01-01', 'GRL-FLASH'),
    ('PRG-2026-T14', 'Expedition',            'T1,T2,T4,T5',          '2027-02-01', 'GRL-FLASH'),
    ('PRG-2026-T15', 'Maintenance',           'T3,T4,T5,T6,T8',       '2027-03-01', 'GRL-FLASH'),
]

QINS = "insert into public.audit_question (id,grille_id,ordre,section,theme_code,clause_ref,libelle,preuve_attendue,mode,sonde) values (%s,%s,%d,%s,%s,%s,%s,NULL,%s,%s) on conflict (id) do nothing;"


def main():
    L = ["-- SEED module Audits de conformité (généré par audit_seed.py) — questions VERBATIM de l'Excel.", ""]
    for gid, titre, cible, ref in GRILLES:
        L.append("insert into public.audit_grille (id,titre,cible,referentiel,version,active) values (%s,%s,%s,%s,1,true) on conflict (id) do nothing;" % (dq(gid), dq(titre), dq(cible), dq(ref)))
    L.append("")
    # Remplacement propre des questions des grilles standard (fidélité à l'Excel)
    L.append("delete from public.audit_question where grille_id in (%s);" % ",".join(dq(g) for g in STD_GRILLES))
    L.append("")
    # Flash générique
    for i, (theme, clause, lib, mode, sonde) in enumerate(FLASH_Q, 1):
        L.append(QINS % (dq('AQ-FLASH-%02d' % i), dq('GRL-FLASH'), i, dq(theme), dq(theme), dq(clause), dq(lib), dq(mode), dq(sonde or None)))
    L.append("")
    # 4 grilles verbatim
    for gid in ['GRL-CF', 'GRL-SOU', 'GRL-EMB', 'GRL-INFO']:
        short = gid.replace('GRL-', '')
        for i, q in enumerate(XL[gid], 1):
            theme = q['theme']; num = q['num']
            mode, sonde = AUTO_MAP.get((gid, num), ('manuel', ''))
            section = 'Q ' + num
            clause = THEME_CLAUSE.get(theme, '')
            L.append(QINS % (dq('AQ-%s-%02d' % (short, i)), dq(gid), i, dq(section), dq(theme), dq(clause), dq(q['q']), dq(mode), dq(sonde or None)))
        L.append("")
    for pid, ent, fam, themes, transv, ref, dc, tm in PROCESS:
        L.append("insert into public.audit_programme (id,exercice,type,entite_auditee,famille,perimetre,themes,themes_transverses,referentiels,date_cible,temps_estime_min,statut) values (%s,%d,'process',%s,%s,$$Usine$$,%s,%s,%s,%s,%d,'planifie') on conflict (id) do nothing;" % (
            dq(pid), EX, dq(ent), dq(fam), dq(themes), dq(transv), dq(ref), dq(dc), tm))
    L.append("")
    for pid, poste, themes, dc, gid in POSTE:
        L.append("insert into public.audit_programme (id,exercice,type,entite_auditee,perimetre,themes,referentiels,date_cible,temps_estime_min,grille_id,statut) values (%s,%d,'poste',%s,$$Usine$$,%s,$$9001,9100,45001$$,%s,30,%s,'planifie') on conflict (id) do nothing;" % (
            dq(pid), EX, dq(poste), dq(themes), dq(dc), dq(gid)))
    L.append("")
    L.append("notify pgrst, 'reload schema';")
    open(OUT, 'w', encoding='utf-8').write("\n".join(L) + "\n")
    total = 9 + sum(len(XL[g]) for g in ['GRL-CF', 'GRL-SOU', 'GRL-EMB', 'GRL-INFO'])
    print('écrit', OUT, '—', len(GRILLES), 'grilles,', total, 'questions,', len(PROCESS), 'process,', len(POSTE), 'postes')


if __name__ == '__main__':
    main()
