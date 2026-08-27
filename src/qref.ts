// ══════════════════════════════════════════════════════════════
// RÉFÉRENTIELS QHSE — glossaire d'acronymes + vocabulaires contrôlés
// Source : feuilles « Data » du Tableau de bord Qualité (Seem/Semrac).
// Les significations marquées (?) sont déduites, à confirmer.
// ══════════════════════════════════════════════════════════════

// Glossaire d'acronymes [sigle, signification, confirmé?]
export const ACRONYMES: Array<[string, string, boolean]> = [
  ['NC', 'Non-Conformité', true],
  ['FNC', 'Fiche de Non-Conformité (interne)', true],
  ['FRC', 'Fiche de Réclamation Client', true],
  ['FA', "Fiche d'Anomalie (?)", false],
  ['DR', 'Demande de Retouche / Dérogation (?)', false],
  ['AR', 'Accusé de Réception de commande', true],
  ['PV', 'Procès-Verbal de contrôle', true],
  ['8D', 'Méthode de résolution en 8 Disciplines', true],
  ['AC', 'Action Corrective', true],
  ['PAC', "Plan d'Action Corrective", true],
  ['AE', 'Action / Accord Entreprise (?)', false],
  ['SD', 'Situation Dangereuse / Sécurité Défaut (?)', false],
  ['R', 'Refus (résultat de dérogation)', true],
  ['AT', 'Accord Total (dérogation)', true],
  ['AL', 'Accord Limité (dérogation)', true],
  ['EC', 'En Cours', true],
  ['S', 'Soldé', true],
  ['AN', 'Annulé', true],
  ['ECME', "Équipements de Contrôle, de Mesure et d'Essai", true],
  ['DUER', "Document Unique d'Évaluation des Risques", true],
  ['DUERP', "Document Unique d'Évaluation des Risques Professionnels", true],
  ['SST', 'Sauveteur Secouriste du Travail', true],
  ['EPI', 'Équipement de Protection Individuelle', true],
  ['VLEP', "Valeur Limite d'Exposition Professionnelle", true],
  ['CMR', 'Cancérogène, Mutagène, Reprotoxique', true],
  ['BE', 'Habilitation électrique « Basse tension Exécutant » (BE Manœuvre)', true],
  ['H0V', 'Habilitation électrique « non-électricien, voisinage »', true],
  ['CACES', 'Certificat d\'Aptitude à la Conduite En Sécurité', true],
  ['OTD', 'On-Time Delivery (taux de livraison à l\'heure)', true],
  ['S/T', 'Sous-Traitance', true],
]

// Imputation / secteur (code → libellé) — explicite dans le classeur
export const IMPUTATIONS: Array<[string, string]> = [
  ['ACH', 'Achat'], ['QUA', 'Qualité'], ['LOG', 'Logistique'], ['COM', 'Commercial'],
  ['DBEI', "Bureau d'étude Dissipateur"], ['TBEI', "Bureau d'étude Tôlerie"],
  ['OXY', 'Oxydation'], ['SER', 'Sérigraphie'], ['EXP', 'Expédition'],
  ['DTR', 'Dissipation Tronçonnage'], ['DUS', 'Dissipation Usinage'], ['DPS', 'Dissipation Petite série'],
  ['DMO', 'Dissipation Montage'], ['DMP', 'Dissipation Montage puis collage'], ['DCO', 'Dissipation Collage'],
  ['DEM', 'Dissipation Emballage'], ['D S/T', 'Dissipation Sous-Traitance'],
  ['MNE', 'Magasin Négoce'], ['MMP', 'Magasin Matière première'],
  ['TDE', 'Tôlerie Découpe'], ['TPL', 'Tôlerie Pliage'], ['TSO', 'Tôlerie Soudure'],
  ['TMO', 'Tôlerie Montage'], ['TSE', 'Tôlerie Sertissage'], ['TEM', 'Tôlerie Emballage'],
  ['TPO', 'Tôlerie Poinçonnage'], ['TTA', 'Tôlerie Taraudage'], ['T S/T', 'Tôlerie Sous-Traitance'],
  ['FOUR', 'Fournisseur'], ['CLI', 'Client'],
]

// Vocabulaires contrôlés (listes déroulantes NC / dérogation / sécurité)
export const NC_TYPES = ['FNC', 'FA', 'DR', 'FRC']
export const NC_DEFAUTS = ['Manque pièce', 'Erreur de référence', "Défaut d'aspect", 'Usinage', 'Taraudage défectueux ou manquant', 'Défaut de soudure', 'Traitement de surface interne', 'Traitement de surface externe', 'Pièce choquée', 'Pièce rayée', 'Défaut de plan', 'Côte hors tolérance', 'Opération mal/non réalisée', 'Erreur dans la gamme', 'Plan au mauvais indice', 'Accessoire défectueux', 'Ébavurage', 'Quantité', 'Délais', 'Manque Doc']
export const NC_CAUSES = ['Contrôle', 'Positionnement', 'Erreur matière première', 'Manipulation', 'Outillage', 'S/T', 'Gamme incorrecte', 'Erreur de saisie', 'Emballage', 'Transports', 'Programmation', 'Réglage', 'Matière', 'Collage', 'Opération mal/non réalisée', 'Conception']
export const DECISIONS_QUALITE = ['Avoir', 'Retour fournisseur', 'Retouché par nos soins', 'Sans facturation', 'Accepté en dérogation', 'Échange', 'Tri', 'Accepté sous réserve']
export const DEROG_TYPES_DEMANDE = ['AC', 'AE', 'AR']
export const DEROG_RESULTATS = ['R', 'AT', 'AL']
export const SECU_TYPES = ['AC', 'PAC', 'SD']
export const SECU_SECTEURS = ['Oxydation', 'Tôlerie', 'Usinage', 'Usine', 'Autre']

// ── Référentiels HSE partagés (source unique, réutilisés par Qualité ET Sécurité) ──
// Familles de risque du DUER — recalées sur la brochure INRS ED 840 (édition octobre 2023).
// Les 20 premières = les 20 fiches ED 840 dans l'ordre exact du sommaire (numéro = clé stable).
// 21-25 = « Autres risques » évalués en interne (issus de la fiche fourre-tout de l'ED 840 2004), hors 20 familles.
// Réf : INRS ED 840, oct. 2023 (canon — dupliqué dans securite.tsx + import_duerp.py).
export const DUER_FAMILLES = [
  '1. Chutes de plain-pied', '2. Chute de hauteur', '3. Circulation interne / engins', '4. Accidents routiers en mission',
  '5. Charge physique de travail', '6. Manutention mecanique', '7. Produits chimiques, emissions, dechets',
  '8. Agents biologiques', '9. Equipements de travail', "10. Chutes d'objet / effondrements", '11. Bruit',
  '12. Ambiances thermiques', '13. Incendie / explosion', '14. Electricite',
  '15. Ambiances lumineuses', '16. Rayonnements', '17. Risques psychosociaux', '18. Vibrations',
  '19. Heurt / cognement', '20. Pratiques addictives',
]
// Conformité STRICTE INRS ED 840 (2023) : seules ces 20 familles existent dans le DUER.
// Tout risque « hors ED 840 » est rattaché à sa famille de danger 1-20 selon sa cause
// (brûlure/coupure/projection → 7 Produits chimiques ou 9 Équipements ; écran → 5 ; travail isolé → 17 RPS).

// ─── Listes déroulantes EXHAUSTIVES des non-conformités (source user, écran « Liste déroulante ») ───
export const NC_TYPE_OPTS = ['Interne', 'Client', 'Fournisseur']
export const NC_IMPUTATIONS = ['Achat (ACH)', 'Qualité (QUAL)', 'Logistique (LOG)', "Bureau d'étude Dissipation (BEID)", "Bureau d'étude Tôlerie (BEIT)", 'Commercial (COM)', 'Oxydation (OXY)', 'Emballage (EMB)', 'Dissipation Tronçonnage (TRO)', 'Dissipation Usinage (USI)', 'Dissipation Petite série (PTS)', 'Dissipation Montage (MOND)', 'Dissipation Montage puissance (MOP)', 'Dissipation Collage (COLL)', 'Magasin Négoce (MAG)', 'Tôlerie Découpe (DEC)', 'Tôlerie Pliage (PLI)', 'Tôlerie Soudure (SOU)', 'Tôlerie Montage (MONT)', 'Tôlerie Sertissage (SERT)', 'Tôlerie Poinçonnage (POI)', 'Tôlerie Taraudage (TAR)', 'Sérigraphie (SER)', 'Dissipation Sous-Traitance (STD)', 'Tôlerie Sous-Traitance (STT)', 'Expédition (EXP)', 'Fournisseur (FOUR)', 'Client (CLI)']
export const NC_NATURES = ['Aspect - Rayures', 'Aspect - Chocs', 'Aspect - Ébavurage', 'Aspect - FOD', 'Traitement/finition - Oxydation', 'Traitement/finition - Surtec', 'Traitement/finition - Sérigraphie', 'Traitement/finition - Microbillage', 'Traitement/finition - Brossage', 'Géométrie - Côtes hors tolérances', 'Géométrie - Planéité', 'Logistique - Quantité', 'Logistique - Certificats', 'Logistique - Matière non conforme', "Gamme - Erreur d'indice", 'Gamme - Erreur de référence', 'Gamme - Erreur de saisie']
export const NC_ACTIONS_IMMEDIATES = ['Retouche interne', 'Rebut', 'Demande de dérogation', 'Retour fournisseur', "Livraison en l'état"]
export const NC_STATUTS_LISTE = ['Ouvert', 'Sécurisé (action immédiate faite)', 'Efficacité à valider', 'Soldé', 'Annulé']
export const NC_CAUSE_OPTS = ["Main d'œuvre / manipulation", 'Machine / réglage', 'Méthode / gamme', 'Matière', 'Milieu / FOD', 'Sous-traitance', 'Programmation']
export const NC_POSTES_LISTE = ['BEI', 'Brassage', 'Bureaux / adm', 'Cisaille', 'Collage', 'DMC', 'Emballage', 'Expédition', 'F600', 'Goupilleuse', 'KIA 1', 'KIA 2', 'KIA 3', 'KIA 4', 'Labo', 'LC 2012', 'Magasin Négoce', 'Magasin profil', 'MCV', 'Métrologie', 'Microbillage', 'Montage puissance', 'Montage Seem', 'Montage Semrac', 'Oxydation', 'Planeuse', 'Plieuse Amada', 'Plieuse Colly', 'PPS', 'Presse dissipation', 'Sertisseuse PEM', 'Soudure MIG', 'Soudure par point', 'Soudure TIG', 'Stama', 'Taraudage Semrac', 'Tronçonnage', 'Vipros']
export const NC_RESPONSABLES = ['Direction', 'Resp. production', 'Resp. QSE', 'Resp. BEI Seem', 'Resp. BEI Semrac', 'Resp. logistique', 'Resp. achats']
// 14 unités de travail canoniques du DUER (canon — était seulement dans import_duerp.py)
export const UT_CANONIQUES = [
  'Bureaux / Administratif', 'Usinage', 'Découpe et façonnage', 'Traitement / procédés spécifiques',
  'Montage', 'Montage puissance', 'Magasins', 'Maintenance', 'Emballage', 'Chaufferie / four',
  'Réfectoire / parties communes', 'Déplacements extérieurs', 'Parking', 'Tout le personnel / Global usine',
]
// Zones atelier physiques (doc « Obligations sécurité atelier ») [code, secteur]
export const ZONES_ATELIER: Array<[string, string]> = [
  ['Z1', 'Dissipation / Tronçonnage'], ['Z2', 'Oxydation'], ['Z3', 'Tôlerie'], ['Z4', 'Bureaux'],
  ['Z5', 'Magasin / Expédition'], ['Z6', 'Collage / Labo'], ['Z7', 'Montage Puissance'], ['A', 'Allée piétonne'],
]
// Secteurs / process de l'atelier (canon pour zone d'incident, secteur flash, origine AC, zone risque).
// Plus fin que SECU_SECTEURS (5) : aligné sur les valeurs réelles (incidents/risques) et les IMPUTATIONS.
export const SECTEURS_ATELIER = [
  'Oxydation', 'Sérigraphie', 'Tôlerie', 'Usinage', 'Dissipation', 'Tronçonnage', 'Découpe', 'Pliage',
  'Poinçonnage', 'Ébavurage', 'Ponçage', 'Soudure', 'Collage', 'Montage', 'Montage puissance', 'Magasin',
  'Expédition', 'Bureaux', 'Maintenance', 'Parties communes', 'Autre',
]
// EPI de l'atelier (doc « Obligations sécurité atelier ») — base de la matrice EPI × zone
export const EPI_ATELIER = ['Casque', 'Lunettes de sécurité', "Bouchons d'oreilles", 'Vêtements de travail', 'Gants anti-coupure', 'Chaussures de sécurité']
// 7 bonnes pratiques sécurité (doc « résumé bonne pratique sécurité »)
export const CONSIGNES_SECURITE = [
  'Tenue de travail adaptée (pantalon de travail / jeans et manches courtes).',
  'Chaussures de sécurité obligatoires en dehors des zones piéton.',
  "Protection auditive obligatoire dans l'atelier.",
  "Lunettes de sécurité obligatoires, comme les protections auditives — équipez-vous avant d'entrer dans l'atelier.",
  'Gants anti-coupure obligatoires (gants nitrile tolérés pour le travail de précision).',
  'Bonne posture : pliez les jambes quand vous manipulez des charges.',
  "Demandez conseil quand vous n'êtes pas certain de savoir utiliser un outil.",
]

// Distribution réelle des défauts (registre NC PMQ3-D2, 123 NC typées) — sert de
// fallback au Pareto tant que la colonne `type_defaut` n'existe pas en base.
export const NC_PARETO: Array<[string, number]> = [
  ['Usinage', 16],
  ['Opération mal/non réalisée', 16],
  ["Défaut d'aspect", 15],
  ['Côte hors tolérance', 13],
  ['Taraudage défectueux ou manquant', 11],
  ['Erreur de référence', 8],
  ['Ebavurage', 7],
  ['Traitement de surface externe', 7],
  ['Pièce choquée', 6],
  ['Manque Doc', 6],
  ['Manque pièce', 4],
  ['Traitement de surface interne', 3],
  ['Quantité', 3],
  ['Défaut de plan', 2],
  ['Pièce rayée', 2],
  ['Accessoire défectueux', 1],
  ['Plan au mauvais indice', 1],
  ['Délais', 1],
  ['Erreur dans la gamme', 1],
]

// Référentiel ISO 9001:2015 — 57 points de vérification (chap. 4 → 10).
// [num, libellé] ; chapitres déduits du préfixe avant le 1er point.
export const ISO9001: Array<[string, string]> = [
  ['4.1', "Compréhension de l'organisme et son contexte"],
  ['4.2', 'Compréhension des besoins et attentes des parties intéressées'],
  ['4.3', "Détermination du domaine d'application du SMQ"],
  ['4.4', 'Système de management de la qualité et ses processus'],
  ['5.1.1', 'Leadership et engagement (généralités)'],
  ['5.1.2', 'Orientation client'],
  ['5.2.1', 'Etablissement de la politique qualité'],
  ['5.2.2', 'Communication de la politique qualité'],
  ['5.3', "Rôles, responsabilités et autorités au sein de l'organisme"],
  ['6.1.1', 'Actions face aux risques et opportunités (généralités)'],
  ['6.1.2', 'Planification des actions'],
  ['6.2.1', 'Objectifs qualité et planification des actions pour les atteindre'],
  ['6.2.2', 'Planification des actions pour atteindre les objectifs qualité'],
  ['6.3', 'Planification des modifications'],
  ['7.1.1', 'Ressources (généralités)'],
  ['7.1.2', 'Personnel'],
  ['7.1.3', 'Infrastructures'],
  ['7.1.4', 'Environnement pour la mise en œuvre des processus'],
  ['7.1.5', 'Ressources pour la surveillance et la mesure'],
  ['7.1.6', 'Connaissances organisationnelles'],
  ['7.2', 'Compétences'],
  ['7.3', 'Sensibilisation'],
  ['7.4', 'Communication'],
  ['7.5.1', 'Informations documentées (généralités)'],
  ['7.5.2', 'Création et mise à jour des informations documentées'],
  ['7.5.3', 'Maîtrise des informations documentées'],
  ['8.1', 'Planification et maîtrise opérationnelle'],
  ['8.2.1', 'Communication avec les clients'],
  ['8.2.2', 'Détermination des exigences relatives aux produits et services'],
  ['8.2.3', 'Revue des exigences relatives aux produits et services'],
  ['8.2.4', 'Modification des exigences relatives aux produits et services'],
  ['8.3.1', 'Conception et développement de produits et services (généralités)'],
  ['8.3.2', 'Planification de la conception et du développement'],
  ['8.3.3', "Eléments d'entrée de la conception et du développement"],
  ['8.3.4', 'Maîtrise de la conception et du développement'],
  ['8.3.5', 'Eléments de sortie de la conception et du développement'],
  ['8.3.6', 'Modifications de la conception et du développement'],
  ['8.4.1', 'Maîtrise des processus, produits et services fournis par des prestataires externes'],
  ['8.4.2', 'Type et étendue de la maîtrise'],
  ['8.4.3', "Informations à l'intention des prestataires externes"],
  ['8.5.1', 'Maîtrise de la production et de la prestation de service'],
  ['8.5.2', 'Identification et traçabilité'],
  ['8.5.3', 'Propriété des clients ou des prestataires externes'],
  ['8.5.4', 'Préservation'],
  ['8.5.5', 'Activités après livraison'],
  ['8.5.6', 'Maîtrise des modifications'],
  ['8.6', 'Libération des produits et services'],
  ['8.7', 'Maîtrise des éléments de sortie non conformes'],
  ['9.1.1', 'Surveillance, mesure, analyse et évaluation'],
  ['9.1.2', 'Satisfaction du client'],
  ['9.1.3', 'Analyse et évaluation'],
  ['9.2.1', 'Audit interne'],
  ['9.2.2', "Programme d'audit interne"],
  ['9.3', 'Revue de direction'],
  ['10.1', 'Généralités'],
  ['10.2', 'Non-conformité et action corrective'],
  ['10.3', 'Amélioration continue'],
]
const ISO_CHAP: Record<string, string> = {
  '4': 'Contexte de l\'organisme', '5': 'Leadership', '6': 'Planification', '7': 'Support',
  '8': 'Réalisation des activités opérationnelles', '9': 'Évaluation des performances', '10': 'Amélioration',
}

// EN 9100:2018 = ISO 9001 + exigences spécifiques aéronautiques/défense
const EN9100_ADD: Array<[string, string]> = [
  ['8.1.1', 'Gestion de projet (Project Management) — aéro'],
  ['8.1.2', 'Gestion des risques opérationnels — aéro'],
  ['8.1.3', 'Gestion de la configuration — aéro'],
  ['8.1.4', 'Sûreté de fonctionnement / sécurité du produit (Product Safety) — aéro'],
  ['8.1.5', 'Prévention des pièces et matériaux contrefaits — aéro'],
  ['8.4.4', 'Surveillance des prestataires externes (approbation, OASIS) — aéro'],
  ['8.5.1.2', 'Validation et maîtrise des processus spéciaux — aéro'],
  ['8.5.1.3', 'Vérification du premier article (FAI / First Article Inspection) — aéro'],
  ['8.5.1.4', 'Maîtrise des équipements de production, outillages et programmes — aéro'],
  ['8.5.1.5', 'Maîtrise des travaux effectués hors des locaux — aéro'],
  ['8.7.2', 'Traitement des non-conformités : dérogation client, rebut contrôlé — aéro'],
]
export const EN9100: Array<[string, string]> = [...ISO9001, ...EN9100_ADD]

// ISO 14001:2015 — management environnemental
export const ISO14001: Array<[string, string]> = [
  ['4.1', "Compréhension de l'organisme et de son contexte"],
  ['4.2', 'Compréhension des besoins et attentes des parties intéressées'],
  ['4.3', "Détermination du domaine d'application du SME"],
  ['4.4', 'Système de management environnemental'],
  ['5.1', 'Leadership et engagement'],
  ['5.2', 'Politique environnementale'],
  ['5.3', 'Rôles, responsabilités et autorités'],
  ['6.1.1', 'Actions face aux risques et opportunités — généralités'],
  ['6.1.2', 'Aspects environnementaux'],
  ['6.1.3', 'Obligations de conformité'],
  ['6.1.4', "Planification d'actions"],
  ['6.2.1', 'Objectifs environnementaux'],
  ['6.2.2', 'Planification des actions pour atteindre les objectifs'],
  ['7.1', 'Ressources'],
  ['7.2', 'Compétences'],
  ['7.3', 'Sensibilisation'],
  ['7.4.1', 'Communication — généralités'],
  ['7.4.2', 'Communication interne'],
  ['7.4.3', 'Communication externe'],
  ['7.5.1', 'Informations documentées — généralités'],
  ['7.5.2', 'Création et mise à jour'],
  ['7.5.3', 'Maîtrise des informations documentées'],
  ['8.1', 'Planification et maîtrise opérationnelles'],
  ['8.2', "Préparation et réponse aux situations d'urgence"],
  ['9.1.1', 'Surveillance, mesure, analyse et évaluation — généralités'],
  ['9.1.2', 'Évaluation de la conformité (obligations légales)'],
  ['9.2.1', 'Audit interne — généralités'],
  ['9.2.2', "Programme d'audit interne"],
  ['9.3', 'Revue de direction'],
  ['10.1', 'Généralités'],
  ['10.2', 'Non-conformité et action corrective'],
  ['10.3', 'Amélioration continue'],
]
const ISO14001_CHAP: Record<string, string> = {
  '4': "Contexte de l'organisme", '5': 'Leadership', '6': 'Planification', '7': 'Support',
  '8': 'Réalisation des activités opérationnelles', '9': 'Évaluation des performances', '10': 'Amélioration',
}

// ISO 45001:2018 — management de la santé & sécurité au travail (SST / OH&S)
export const ISO45001: Array<[string, string]> = [
  ['4.1', "Compréhension de l'organisme et de son contexte"],
  ['4.2', 'Compréhension des besoins et attentes des travailleurs et autres parties intéressées'],
  ['4.3', "Détermination du domaine d'application du système de management de la S&ST"],
  ['4.4', 'Système de management de la S&ST'],
  ['5.1', 'Leadership et engagement'],
  ['5.2', 'Politique de S&ST'],
  ['5.3', 'Rôles, responsabilités et autorités'],
  ['5.4', 'Consultation et participation des travailleurs'],
  ['6.1.1', 'Actions face aux risques et opportunités — généralités'],
  ['6.1.2', 'Identification des dangers et évaluation des risques (pont DUER)'],
  ['6.1.3', 'Détermination des exigences légales et autres (Code du travail, ICPE, ATEX)'],
  ['6.1.4', "Planification d'actions"],
  ['6.2.1', 'Objectifs de S&ST'],
  ['6.2.2', 'Planification pour atteindre les objectifs de S&ST'],
  ['7.1', 'Ressources'],
  ['7.2', 'Compétences (habilitations : CACES, électrique, pontier, soudeur)'],
  ['7.3', 'Sensibilisation'],
  ['7.4', 'Communication'],
  ['7.5', 'Informations documentées'],
  ['8.1.1', 'Planification et maîtrise opérationnelles — généralités'],
  ['8.1.2', 'Élimination des dangers et réduction des risques (substitution CMR)'],
  ['8.1.3', 'Conduite du changement'],
  ['8.1.4', 'Acquisition de biens et services / sous-traitants sur site'],
  ['8.2', "Préparation et réponse aux situations d'urgence (POI, évacuation)"],
  ['9.1.1', 'Surveillance, mesure, analyse et évaluation — généralités'],
  ['9.1.2', 'Évaluation de la conformité (exigences légales SST)'],
  ['9.2', 'Audit interne'],
  ['9.3', 'Revue de direction'],
  ['10.1', 'Généralités'],
  ['10.2', 'Événement, non-conformité et action corrective (AT/MP, presqu\'accidents)'],
  ['10.3', 'Amélioration continue'],
]
const ISO45001_CHAP: Record<string, string> = {
  '4': "Contexte de l'organisme", '5': 'Leadership et participation des travailleurs', '6': 'Planification',
  '7': 'Support', '8': 'Réalisation des activités opérationnelles', '9': 'Évaluation des performances', '10': 'Amélioration',
}

// ISO/IEC 27001:2022 — sécurité de l'information (clauses 4-10 + Annexe A)
export const ISO27001: Array<[string, string]> = [
  ['4.1', "Compréhension de l'organisme et de son contexte"],
  ['4.2', 'Besoins et attentes des parties intéressées'],
  ['4.3', "Détermination du domaine d'application du SMSI"],
  ['4.4', "Système de management de la sécurité de l'information"],
  ['5.1', 'Leadership et engagement'],
  ['5.2', 'Politique de sécurité de l\'information'],
  ['5.3', 'Rôles, responsabilités et autorités'],
  ['6.1.1', 'Actions face aux risques et opportunités — généralités'],
  ['6.1.2', "Appréciation des risques de sécurité de l'information"],
  ['6.1.3', "Traitement des risques + Déclaration d'applicabilité (SoA)"],
  ['6.2', "Objectifs de sécurité de l'information"],
  ['6.3', 'Planification des modifications'],
  ['7.1', 'Ressources'],
  ['7.2', 'Compétences'],
  ['7.3', 'Sensibilisation'],
  ['7.4', 'Communication'],
  ['7.5.1', 'Informations documentées — généralités'],
  ['7.5.2', 'Création et mise à jour'],
  ['7.5.3', 'Maîtrise des informations documentées'],
  ['8.1', 'Planification et maîtrise opérationnelles'],
  ['8.2', "Appréciation des risques de sécurité de l'information"],
  ['8.3', "Traitement des risques de sécurité de l'information"],
  ['9.1', 'Surveillance, mesure, analyse et évaluation'],
  ['9.2.1', 'Audit interne — généralités'],
  ['9.2.2', "Programme d'audit interne"],
  ['9.3.1', 'Revue de direction — généralités'],
  ['9.3.2', 'Éléments d\'entrée de la revue'],
  ['9.3.3', 'Résultats de la revue'],
  ['10.1', 'Amélioration continue'],
  ['10.2', 'Non-conformité et action corrective'],
  ['A.5', 'Annexe A — Contrôles organisationnels (37) : politiques, rôles SSI, actifs, fournisseurs, incidents, continuité'],
  ['A.6', 'Annexe A — Contrôles liés aux personnes (8) : sélection, sensibilisation, télétravail, départ'],
  ['A.7', 'Annexe A — Contrôles physiques (14) : zones sécurisées, équipements, supports, mise au rebut'],
  ['A.8', 'Annexe A — Contrôles technologiques (34) : accès, cryptographie, journalisation, sauvegarde, dév. sécurisé'],
]
const ISO27001_CHAP: Record<string, string> = {
  '4': "Contexte de l'organisme", '5': 'Leadership', '6': 'Planification', '7': 'Support',
  '8': 'Fonctionnement', '9': 'Évaluation des performances', '10': 'Amélioration', 'A': 'Annexe A — Contrôles de sécurité',
}

// Registre des référentiels d'audit (nom de norme → grille de points de vérification)
const NORME_REF: Record<string, { key: string; clauses: Array<[string, string]>; chap: Record<string, string>; label: string }> = {
  'ISO 9001': { key: 'iso9001', clauses: ISO9001, chap: ISO_CHAP, label: 'ISO 9001:2015 — Management de la qualité' },
  'EN 9100': { key: 'en9100', clauses: EN9100, chap: ISO_CHAP, label: 'EN 9100:2018 — Qualité aéronautique (ISO 9001 + exigences aéro)' },
  'ISO 27001': { key: 'iso27001', clauses: ISO27001, chap: ISO27001_CHAP, label: "ISO/IEC 27001:2022 — Sécurité de l'information" },
  'ISO 14001': { key: 'iso14001', clauses: ISO14001, chap: ISO14001_CHAP, label: 'ISO 14001:2015 — Management environnemental' },
  'ISO 45001': { key: 'iso45001', clauses: ISO45001, chap: ISO45001_CHAP, label: 'ISO 45001:2018 — Santé & sécurité au travail' },
}
export function normeReferentiel(norme: string) { return NORME_REF[norme] || null }

// ECME : code de type → nom complet de l'équipement (déduit des désignations réelles)
export const ECME_TYPES: Record<string, string> = {
  TFD: 'Tampon fileté (métrique 6H)', TM: 'Tampon métrique / fileté double', TMF: 'Tampon métrique fin',
  TS5H: 'Tampon spécifique métrique 5H', TS: 'Tampon fileté double (pas spéciaux)', TLD: 'Tampon lisse double',
  PC: 'Pied à coulisse', JP: 'Jauge de profondeur',
  MI: 'Micromètre', CA: 'Cales étalons', PI: 'Piges étalons', PIT: 'Pige de travail', CO: 'Comparateur',
  BA: 'Balance', CD: 'Clé dynamométrique', EDY: 'Matériel électrique / dynamométrique', RU: 'Rugosimètre',
  TH: 'Thermomètre / sonde', ME: "Mesureur d'épaisseur", PH: 'pH-mètre', EQ: 'Équerre', RG: 'Règle',
  RA: "Rapporteur d'angle", GA: 'Gabarit', TRI: 'Tridimensionnelle / banc de préréglage', MA: 'Marbre',
  PS: 'Poste à souder', FO: 'Four / étuve', OXY: 'Contrôle oxydation',
  TSH: 'Tampon fileté pour hélicoils', TUNF: 'Tampon fileté UNF', TUNC: 'Tampon fileté UNC',
  TUNEF: 'Tampon fileté UNEF', TUNS: 'Tampon fileté UNS',
}
export function ecmeTypeLabel(code: any): string {
  const c = String(code ?? '').trim()
  return ECME_TYPES[c.toUpperCase()] || c || '—'
}

// ── ECME : moteur de vérification métrologique (PV de vérification) ──────────
// L'app calcule l'erreur de JUSTESSE (Ej) et de FIDÉLITÉ (Ef) à partir des mesures
// brutes. La CLASSE et la CONFORMITÉ restent SAISIES par l'opérateur (lues sur son
// tableau d'écarts) — aucun seuil de tolérance n'est inventé (règle projet).
export const ECME_FAMILLES_METRO = ['JP', 'MI', 'CO', 'FO'] // grille justesse/fidélité (mesure de justesse)
export function ecmeEstMetro(type: any): boolean { return ECME_FAMILLES_METRO.includes(String(type ?? '').trim().toUpperCase()) }
export function ecmeEstPC(type: any): boolean { return String(type ?? '').trim().toUpperCase() === 'PC' }
export function ecmeAvecGrille(type: any): boolean { return ecmeEstMetro(type) || ecmeEstPC(type) }

function _ecNum(v: any): number | null { const n = Number(v); return Number.isFinite(n) ? n : null }
function _ecMoy(a: number[]): number | null { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null }
function _ecEtendue(a: number[]): number | null { return a.length ? Math.max(...a) - Math.min(...a) : null }
function _ecR(n: number | null, d = 4): number | null { return n == null ? null : Math.round(n * 10 ** d) / 10 ** d }

// Justesse / fidélité pour JP, MI, CO, FO — mesures = { justesse:[{cn,releves[]}], fidelite:{releves[]} }
export function computeEcmeMetro(mesures: any): { justesse: any[]; ej: number | null; ef: number | null } {
  const pts = Array.isArray(mesures?.justesse) ? mesures.justesse : []
  const justesse = pts.map((p: any) => {
    const rel = (Array.isArray(p?.releves) ? p.releves : []).map(_ecNum).filter((x: any): x is number => x != null)
    const cn = _ecNum(p?.cn)
    const mj = _ecMoy(rel)
    const ej = (mj != null && cn != null) ? cn - mj : null // convention SEEM (PV justesse) : Ej = Cn - MJ
    return { cn, releves: rel, mj: _ecR(mj), ej: _ecR(ej), etendue: _ecR(_ecEtendue(rel)) }
  })
  let ej: number | null = null, worst: any = null
  for (const p of justesse) { if (p.ej != null && (ej == null || Math.abs(p.ej) > Math.abs(ej))) { ej = p.ej; worst = p } }
  let ef: number | null = null
  const fid = mesures?.fidelite
  const fidRel = Array.isArray(fid?.releves) ? fid.releves.map(_ecNum).filter((x: any): x is number => x != null) : []
  if (fidRel.length) ef = _ecR(_ecEtendue(fidRel))
  else if (worst) ef = worst.etendue
  return { justesse, ej, ef }
}

// Pied à coulisse — mesures = { becs:[{libelle,vc,releves[]}] }
export function computeEcmePC(mesures: any): { becs: any[]; ej: number | null; ef: number | null } {
  const secs = Array.isArray(mesures?.becs) ? mesures.becs : []
  const becs = secs.map((s: any) => {
    const rel = (Array.isArray(s?.releves) ? s.releves : []).map(_ecNum).filter((x: any): x is number => x != null)
    const vc = _ecNum(s?.vc)
    const vcr = _ecMoy(rel)
    const ej = (vcr != null && vc != null) ? vcr - vc : null
    return { libelle: String(s?.libelle ?? ''), vc, releves: rel, vcr: _ecR(vcr), ej: _ecR(ej), etendue: _ecR(_ecEtendue(rel)) }
  })
  let ej: number | null = null, ef: number | null = null
  for (const b of becs) {
    if (b.ej != null && (ej == null || Math.abs(b.ej) > Math.abs(ej))) ej = b.ej
    if (b.etendue != null && (ef == null || b.etendue > ef)) ef = b.etendue
  }
  return { becs, ej, ef }
}

export function computeEcmePV(mesures: any, famille: any): { ej: number | null; ef: number | null; detail: any } {
  if (ecmeEstPC(famille)) { const r = computeEcmePC(mesures); return { ej: r.ej, ef: r.ef, detail: { becs: r.becs } } }
  const r = computeEcmeMetro(mesures); return { ej: r.ej, ef: r.ef, detail: { justesse: r.justesse } }
}

// Statut périodique LIVE (recalculé sur date_prochain_etalonnage vs aujourd'hui)
export function ecmeStatutLive(e: any, todayISO?: string): { code: string; label: string; color: string; bg: string; jours: number | null } {
  const today = todayISO || new Date().toISOString().slice(0, 10)
  if (e?.reforme === true || e?.statut === 'reforme') return { code: 'reforme', label: 'Réformé', color: '#64748b', bg: '#f1f5f9', jours: null }
  const proch = String(e?.date_prochain_etalonnage || '').slice(0, 10)
  if (!proch) return { code: 'inconnu', label: 'À planifier', color: '#7c3aed', bg: '#f5f3ff', jours: null }
  const jours = Math.round((Date.parse(proch + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000)
  if (jours < 0) return { code: 'retard', label: 'En retard', color: '#b91c1c', bg: '#fef2f2', jours }
  if (jours <= 30) return { code: 'bientot', label: 'À vérifier bientôt', color: '#b45309', bg: '#fffbeb', jours }
  return { code: 'valide', label: 'Valide', color: '#15803d', bg: '#f0fdf4', jours }
}
export const ECME_RESULTATS: Array<[string, string]> = [['B', 'Bon'], ['M', 'Moyen'], ['HS', 'Hors service']]
export function ecmeResultatLabel(r: any): string { const m = ECME_RESULTATS.find((x) => x[0] === String(r ?? '')); return m ? m[1] : (r || '—') }
// Prochaine échéance = date de vérif + périodicité (mois)
export function ecmeAddMonths(iso: string, mois: number): string {
  const d = new Date((iso || '').slice(0, 10) + 'T00:00:00Z'); if (isNaN(d.getTime())) return ''
  const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + (Number(mois) || 12))
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10)
}

function esc(s: any): string { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

// Grille de conformité par NORME (points de vérification d'audit), interactive :
// clic = cycle À auditer → Abordé et audité → Non applicable, mémorisé localStorage (namespacé par norme).
const _clauseSort = (a: [string, string], b: [string, string]) => {
  const pa = a[0].split('.'), pb = b[0].split('.')
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = Number(pa[i] ?? 0), y = Number(pb[i] ?? 0)
    const xx = isNaN(x) ? 999 : x, yy = isNaN(y) ? 999 : y
    if (xx !== yy) return xx - yy
  }
  return 0
}
export function normeGrid(norme: string): string {
  const ref = NORME_REF[norme]
  if (!ref) return ''
  const { key, clauses, chap, label } = ref
  const byChap: Record<string, Array<[string, string]>> = {}
  for (const [num, lib] of clauses) { const ch = num.split('.')[0]; (byChap[ch] = byChap[ch] || []).push([num, lib]) }
  const chapKeys = Object.keys(byChap).sort((a, b) => { const na = Number(a), nb = Number(b); if (isNaN(na)) return 1; if (isNaN(nb)) return -1; return na - nb })
  const sections = chapKeys.map((ch) => {
    const rows = byChap[ch].slice().sort(_clauseSort).map(([num, lib]) => {
      const dk = key + '|' + num
      return `
      <div style="display:grid;grid-template-columns:62px 1fr 150px;align-items:center;gap:10px;padding:6px 12px;border-bottom:1px solid #f4f4f5;">
        <span style="font-family:monospace;font-weight:800;color:#0e7490;font-size:.74rem;">${esc(num)}</span>
        <span style="font-size:.78rem;color:#374151;">${esc(lib)}</span>
        <span data-isoclause="${esc(dk)}" onclick="isoCycle('${esc(dk)}')" style="cursor:pointer;text-align:center;border-radius:999px;padding:3px 8px;font-size:.68rem;font-weight:700;background:#fef3c7;color:#92400e;user-select:none;" title="Cliquer pour changer le statut">À auditer</span>
      </div>`
    }).join('')
    return `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:12px;">
      <div style="background:#ecfeff;border-bottom:1px solid #cffafe;padding:9px 14px;font-weight:800;color:#0e7490;font-size:.82rem;"><span style="font-family:monospace;">${esc(ch)}.</span> ${esc(chap[ch] || '')}</div>
      ${rows}
    </div>`
  }).join('')
  return `<div style="margin-top:24px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
      <div style="font-weight:800;color:#111827;font-size:.9rem;"><i class="fas fa-list-check" style="color:#0891b2;margin-right:7px;"></i>Grille de conformité ${esc(label)} — points de vérification</div>
      <div id="iso-progress-${esc(key)}" style="font-size:.72rem;color:#6b7280;">${clauses.length} points à auditer</div>
    </div>
    <div style="background:#ecfeff;border:1px solid #cffafe;border-radius:10px;padding:8px 14px;margin-bottom:14px;font-size:.74rem;color:#155e75;display:flex;gap:18px;flex-wrap:wrap;align-items:center;">
      <span><span style="display:inline-block;width:10px;height:10px;background:#fde68a;border-radius:999px;margin-right:5px;"></span>À auditer</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#86efac;border-radius:999px;margin-right:5px;"></span>Abordé et audité</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#cbd5e1;border-radius:999px;margin-right:5px;"></span>Non applicable</span>
      <span style="margin-left:auto;color:#64748b;">Cliquez sur un statut pour le faire évoluer (mémorisé sur ce poste).</span>
    </div>
    ${sections}
  </div>`
}

// Script partagé pour TOUTES les grilles de norme (clé localStorage namespacée par norme). À inclure une seule fois.
export function isoGridScript(): string {
  return `<script>
    (function(){
      var KEY='iso_conf_v2';
      var ST=['a_auditer','aborde','na'];
      var LBL={a_auditer:'À auditer',aborde:'Abordé et audité',na:'Non applicable'};
      var CLR={a_auditer:['#fef3c7','#92400e'],aborde:['#dcfce7','#15803d'],na:['#f1f5f9','#64748b']};
      function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
      function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
      window.isoCycle=function(k){var s=load();var cur=s[k]||'a_auditer';s[k]=ST[(ST.indexOf(cur)+1)%ST.length];save(s);isoApply();};
      window.isoApply=function(){var s=load();var per={};
        document.querySelectorAll('[data-isoclause]').forEach(function(el){var k=el.getAttribute('data-isoclause');var pfx=String(k).split('|')[0];var st=s[k]||'a_auditer';var c=CLR[st];el.style.background=c[0];el.style.color=c[1];el.textContent=LBL[st];if(!per[pfx])per[pfx]={ab:0,na:0,tot:0};per[pfx].tot++;if(st==='aborde')per[pfx].ab++;if(st==='na')per[pfx].na++;});
        Object.keys(per).forEach(function(pfx){var p=document.getElementById('iso-progress-'+pfx);if(p){var o=per[pfx];var cov=o.tot?Math.round((o.ab+o.na)/o.tot*100):0;p.textContent=o.ab+' audités · '+o.na+' N/A · '+(o.tot-o.ab-o.na)+' à auditer ('+cov+'%)';}});};
      if(document.readyState!=='loading')isoApply();else document.addEventListener('DOMContentLoaded',isoApply);
    })();
  </script>`
}

// Compat : grille ISO 9001 autonome (grille + script).
export function iso9001Grid(): string { return normeGrid('ISO 9001') + isoGridScript() }
// Grille ISO 45001 autonome (SST) — même moteur tri-état.
export function iso45001Grid(): string { return normeGrid('ISO 45001') + isoGridScript() }

// ══════════════════════════════════════════════════════════════
// RÉFÉRENTIEL DES THÈMES D'AUDIT (module Audits de conformité)
// Conserve la légende A–H du classeur Excel (combiné ISO 9001 / EN 9100) et
// l'ÉTEND en additif : I (SST/45001), J (Environnement/14001), K (SI/27001).
// [code, thème, chapitres/clauses couverts, périmètre & exigences clés]
// ══════════════════════════════════════════════════════════════
export const AUDIT_THEMES_PROCESS: Array<[string, string, string, string]> = [
  ['A', 'Contexte et orientation', 'ISO 9001/EN 9100 §4, §6.3', 'Enjeux internes/externes, parties intéressées, cartographie des processus, planification des modifications'],
  ['B', 'Leadership et stratégie', '§5, §6.1/6.2', 'Engagement Direction, politique qualité, rôles/responsabilités, risques & opportunités, objectifs'],
  ['C', 'Support et ressources', '§7', 'Compétences, habilitations, sensibilisation, métrologie/ECME, infrastructures, informatique'],
  ['D', 'Exigences et commerce', '§8.2', 'Écoute client, revues de contrat, traitement des commandes et exigences spécifiques aéro'],
  ['E', 'Conception et BEI', '§8.3', "Industrialisation, développement, validation des dossiers de fabrication, maîtrise des modifications techniques"],
  ['F', 'Achats', '§8.4', 'Évaluation/sélection/surveillance des fournisseurs & sous-traitants, conformité des pièces reçues, OTD/OQD'],
  ['G', 'Production et logistique', '§8.1, §8.5, §8.6, §8.7', 'Maîtrise des opérations, autocontrôle, traçabilité, préservation, libération, non-conformités'],
  ['H', 'Mesure et amélioration', '§9, §10', 'Indicateurs, revue de direction, traitement des NC, réclamations clients, actions correctives'],
  ['I', 'Santé-Sécurité au travail', 'ISO 45001 §5.4, §6.1, §7.2, §8', 'Dangers/risques au poste, participation des travailleurs, habilitations SST, situations d\'urgence, AT/MP'],
  ['J', 'Environnement', 'ISO 14001 §6.1.2, §8.2, §9.1.2', 'Aspects/impacts, déchets dangereux, ICPE, rejets, conformité réglementaire environnementale'],
  ['K', 'Sécurité de l\'information', 'ISO/IEC 27001:2022 + RGPD', 'Cyber, PCA/PSI, sauvegardes testées, gestion des accès (RBAC), RGPD, protection des plans/données clients'],
]
// Thèmes TERRAIN d'audit de poste (flash). T1–T6 = classeur Excel ; T7–T9 = additif SST.
export const AUDIT_THEMES_TERRAIN: Array<[string, string, string, string]> = [
  ['T1', 'Documentation au poste', '§8.5.1.a', "Présence et respect de la fiche d'instruction + fiche suiveuse, au bon indice"],
  ['T2', 'Autocontrôle et traçabilité', '§8.5.2, §8.6', "Mesures enregistrées, traçabilité lots/matières, tampons/matricule GPAO, libération"],
  ['T3', 'Moyens de mesure', '§7.1.5', "Validité du certificat d'étalonnage des ECME utilisés au poste"],
  ['T4', 'Environnement et 5S', '§7.1.4', 'Propreté du poste, rangement des outils, FOD'],
  ['T5', 'Sécurité et EPI', 'ISO 45001 §8', 'Port des EPI obligatoires, signalisation, respect des consignes'],
  ['T6', 'Maintenance 1er niveau', '§7.1.3', 'Vérifications quotidiennes/hebdo par l\'opérateur (nettoyage machine, niveaux), VGP'],
  ['T7', 'Analyse des risques au poste', 'ISO 45001 §6.1.2', "L'opérateur connaît-il les risques de son poste ? Remontée des situations dangereuses, droit d'alerte/retrait"],
  ['T8', 'Consignation LOTO & permis de travail', 'ISO 45001 §8.1.2', 'Consignation élec/méca/fluides, permis de feu (soudure), plan de prévention entreprises extérieures'],
  ['T9', 'Risques physiques & CMR', 'ISO 45001 §6.1.2 ; Code du travail', 'Bruit (tronçonnage/poinçonnage/soudure), CMR (bains), TMS/port de charges, captage à la source/VLEP'],
]
// Référentiels couverts par une ligne d'audit (tag « audit combiné »).
export const AUDIT_REFERENTIELS: Array<[string, string]> = [
  ['9001', 'ISO 9001:2015'], ['9100', 'EN 9100:2018'], ['45001', 'ISO 45001:2018'],
  ['14001', 'ISO 14001:2015'], ['27001', 'ISO/IEC 27001:2022'],
]

// ══════════════════════════════════════════════════════════════
// SEIRICH — évaluation du risque chimique (méthode INRS ND 2233 / ED 6485)
// Cotation INDICATIVE (défaut à VALIDER par le référent QHSE et à recouper avec
// le logiciel SEIRICH de l'INRS). 3 axes : Santé · Incendie-Explosion · Environnement.
// Le danger vient de l'étiquetage CLP (codes H) + pictogrammes SGH ; l'exposition
// (Phase 1) de la quantité présente. Le pire élément fixe la classe.
// ══════════════════════════════════════════════════════════════
function _hNum(code: any): number { const m = String(code || '').toUpperCase().match(/H\s?(\d{3})/); return m ? Number(m[1]) : 0 }
const _H_SANTE_5 = [340, 350, 360, 300, 310, 330]                                   // CMR 1A/1B ; toxicité aiguë mortelle cat.1/2
const _H_SANTE_4 = [301, 311, 331, 314, 318, 334, 370, 372, 341, 351, 361, 304]     // tox. aiguë 3 ; corrosif ; lésions oculaires graves ; sensib. respiratoire ; STOT1 ; CMR cat.2 ; aspiration
const _H_SANTE_3 = [302, 312, 332, 315, 319, 317, 335, 336, 371, 373]               // nocif ; irritant ; sensib. cutané ; narcotique ; STOT 2/3
const _H_SANTE_2 = [303, 313, 333, 320]
const _H_INC_5 = [200, 201, 202, 203, 204, 205, 220, 224, 240, 241, 250, 260, 261, 270]
const _H_INC_4 = [221, 225, 228, 242, 271, 251, 252]
const _H_INC_3 = [226, 227, 272, 229]
const _H_ENV = { 5: [400, 410], 4: [411], 3: [412], 2: [413, 420] } as Record<number, number[]>
const _SGH: Record<string, { sante?: number; incendie?: number; env?: number }> = {
  SGH01: { incendie: 5 }, SGH02: { incendie: 4 }, SGH03: { incendie: 4 }, SGH04: { incendie: 2 },
  SGH05: { sante: 4 }, SGH06: { sante: 5 }, SGH07: { sante: 3 }, SGH08: { sante: 4 }, SGH09: { env: 4 },
}
function _classeH(n: number, axe: 'sante' | 'incendie' | 'env'): number {
  if (!n) return 0
  if (axe === 'sante') return _H_SANTE_5.includes(n) ? 5 : _H_SANTE_4.includes(n) ? 4 : _H_SANTE_3.includes(n) ? 3 : _H_SANTE_2.includes(n) ? 2 : 0
  if (axe === 'incendie') return _H_INC_5.includes(n) ? 5 : _H_INC_4.includes(n) ? 4 : _H_INC_3.includes(n) ? 3 : 0
  for (const c of [5, 4, 3, 2]) if (_H_ENV[c].includes(n)) return c
  return 0
}
export function classeQuantiteChimique(qte: any): number {
  const q = Number(qte) || 0
  return q <= 0 ? 0 : q < 1 ? 1 : q < 10 ? 2 : q < 100 ? 3 : q < 1000 ? 4 : 5
}
// Niveau de risque (0 sans danger sur l'axe · 1 faible · 2 moyen · 3 élevé/prioritaire)
function _niveau(danger: number, expo: number): number {
  if (danger <= 0) return 0
  const score = danger * (expo || 1)
  let n = score >= 12 ? 3 : score >= 5 ? 2 : 1
  if (danger >= 5) n = 3           // un CMR / très toxique reste prioritaire même en faible quantité
  else if (danger === 4 && n < 2) n = 2
  return n
}
export const SEIRICH_NIVEAUX: Record<number, [string, string, string]> = {
  0: ['#f1f5f9', '#94a3b8', '—'], 1: ['#dcfce7', '#15803d', 'Faible'], 2: ['#fef3c7', '#92400e', 'Moyen'], 3: ['#fee2e2', '#b91c1c', 'Élevé'],
}
export type RisqueChimique = {
  hCodes: string[]; classeSante: number; classeIncendie: number; classeEnv: number; classeQte: number
  niveauSante: number; niveauIncendie: number; niveauEnv: number; niveauMax: number; dataQuality: 'ok' | 'incomplet' | 'aucun'
}
export function computeRisqueChimique(p: any): RisqueChimique {
  const mentions: string[] = Array.isArray(p?.mentions_danger) ? p.mentions_danger.map((x: any) => String(x)) : []
  const pictos: string[] = Array.isArray(p?.pictogrammes) ? p.pictogrammes.map((x: any) => String(x).toUpperCase().trim()) : []
  const hCodes = Array.from(new Set(mentions.map(_hNum).filter(Boolean).map((n) => 'H' + n)))
  const nums = hCodes.map(_hNum)
  const isCMR = !!(p?.cmr && String(p.cmr).trim() && !/non|aucun|^0$/i.test(String(p.cmr)))
  let cS = Math.max(0, ...nums.map((n) => _classeH(n, 'sante')))
  let cI = Math.max(0, ...nums.map((n) => _classeH(n, 'incendie')))
  let cE = Math.max(0, ...nums.map((n) => _classeH(n, 'env')))
  for (const sg of pictos) { const s = _SGH[sg]; if (s) { if (s.sante) cS = Math.max(cS, s.sante); if (s.incendie) cI = Math.max(cI, s.incendie); if (s.env) cE = Math.max(cE, s.env) } }
  if (isCMR) cS = Math.max(cS, 5)
  const cQ = classeQuantiteChimique(p?.quantite)
  const hasHazardData = hCodes.length > 0 || pictos.length > 0 || isCMR
  const saysNone = mentions.some((m) => /aucun|non class|sans danger/i.test(m)) || (mentions.length === 0 && pictos.length === 0)
  const dataQuality: 'ok' | 'incomplet' | 'aucun' = hasHazardData ? 'ok' : (saysNone ? 'aucun' : 'incomplet')
  return {
    hCodes, classeSante: cS, classeIncendie: cI, classeEnv: cE, classeQte: cQ,
    niveauSante: _niveau(cS, cQ), niveauIncendie: _niveau(cI, cQ), niveauEnv: _niveau(cE, cQ),
    niveauMax: Math.max(_niveau(cS, cQ), _niveau(cI, cQ), _niveau(cE, cQ)), dataQuality,
  }
}

// ══════════════════════════════════════════════════════════════
// SEIRICH — Phase 2 : cotation SANTÉ par SITUATION DE TRAVAIL (niveau intermédiaire)
// Méthode INRS ND 2233 / R 409 (tables CANONIQUES, vérifiées sur le PDF INRS).
// Deux scores DISTINCTS, jamais fusionnés :
//   • Risque POTENTIEL  = danger × exposition(quantité, fréquence)   seuils <100 / <10000
//   • Risque RÉSIDUEL   = danger × volatilité × procédé × protection  seuils <100 / <1000  (Sinh — la quantité est EXCLUE)
// Le niveau « retenu » (le plus défavorable des deux) + plancher CMR pilote l'affichage.
// Entrées par des ÉNUMÉRÉS conviviaux (pas de mesurage) ; défauts conservateurs.
// Reste INDICATIF (à valider par un mesurage / une expertise).
// ══════════════════════════════════════════════════════════════
const _SCORE_DANGER: Record<number, number> = { 0: 0, 1: 1, 2: 10, 3: 100, 4: 1000, 5: 10000 } // R409 Tab.7
// Fréquence + durée d'exposition → classe 1..4 (R409 Tab.4, condensée en un choix intuitif)
const _EXPO_FREQ: Record<string, number> = { occasionnelle: 1, reguliere: 2, quotidienne: 3, permanente: 4 }
// Matrice exposition R409 Tab.5 : ligne = classe quantité (1..5), colonne = classe fréquence (0..4)
const _EXPO_MATRIX: number[][] = [
  [0, 1, 1, 1, 1],
  [0, 2, 2, 2, 2],
  [0, 3, 3, 3, 4],
  [0, 3, 4, 4, 5],
  [0, 4, 5, 5, 5],
]
const _FACTEUR_EXPO: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 10, 4: 30, 5: 100 } // R409 Tab.6
const _SCORE_VOLAT: Record<number, number> = { 1: 1, 2: 10, 3: 100 }                     // R409 Tab.8
// Procédé / mise en œuvre (R409 Tab.9, 4 classes) — value stockée → coefficient d'émission
const _SCORE_PROCEDE: Record<string, number> = { dispersif: 1, ouvert: 0.5, clos_ouvert: 0.05, clos_permanent: 0.001 }
// Protection collective (R409 Tab.10) — coefficient réducteur
const _SCORE_PROTECTION: Record<string, number> = { aucune: 1, ventilation: 0.7, captage: 0.1, vase_clos: 0.001 }
const _ORDRE_PROTECTION = ['aucune', 'ventilation', 'captage', 'vase_clos']
// État physique / volatilité → classe 1..3 (R409 Tab.8/Fig.1, énuméré convivial)
const _CLASSE_VOLAT: Record<string, number> = {
  gaz: 3, liquide_volatil: 3, liquide_moyen: 2, liquide_peu: 1,
  solide_poudre: 3, solide_grains: 2, solide_massif: 1,
}
// Libellés (UI + affichage)
export const EXPO_FREQ_LBL: Record<string, string> = { occasionnelle: 'Occasionnelle (< mensuel)', reguliere: 'Régulière courte (hebdo. / < 30 min par jour)', quotidienne: 'Quotidienne (30 min – 2 h par jour)', permanente: 'Permanente (> 2 h par jour)' }
export const EXPO_PROCEDE_LBL: Record<string, string> = { dispersif: 'Dispersif (pulvérisation, aérosol, poudre)', ouvert: 'À l\'air libre (pinceau, trempage ouvert)', clos_ouvert: 'Clos ouvert régulièrement (bain, réacteur)', clos_permanent: 'Clos en permanence (vase clos)' }
export const EXPO_PROT_LBL: Record<string, string> = { aucune: 'Aucune', ventilation: 'Ventilation générale', captage: 'Captage à la source', vase_clos: 'Vase clos / confinement' }
export const EXPO_VOLAT_LBL: Record<string, string> = { gaz: 'Gaz / aérosol', liquide_volatil: 'Liquide très volatil (solvant)', liquide_moyen: 'Liquide moyennement volatil', liquide_peu: 'Liquide peu volatil / pâteux', solide_poudre: 'Solide pulvérulent (poudre fine)', solide_grains: 'Solide granulé', solide_massif: 'Solide massif / en pièce' }

// Normalise une quantité en « grammes-équivalents » (densité ≈ 1 : masse et volume sur la même échelle — approximation assumée, indicatif).
export function normQuantiteChimique(q: any, u: any): number {
  const n = Number(q) || 0
  const f: Record<string, number> = { g: 1, kg: 1000, t: 1_000_000, ml: 1, mL: 1, l: 1000, L: 1000 }
  const k = String(u ?? '').trim()
  return n * (f[k] ?? f[k.toLowerCase()] ?? 1)
}
// Classe quantité R409 Tab.3 depuis le ratio Qi/Qmax (part de la situation dans la zone).
function _classeRatio(ratio: number): number {
  if (ratio < 0.01) return 1
  if (ratio < 0.05) return 2
  if (ratio < 0.12) return 3
  if (ratio < 0.33) return 4
  return 5
}
const _nivPotentiel = (x: number): number => (x < 100 ? 1 : x < 10000 ? 2 : 3)
const _nivResiduel = (x: number): number => (x < 100 ? 1 : x < 1000 ? 2 : 3)

export type ExpoSante = {
  classeSante: number; cmr: boolean
  classeQ: number; classeF: number; classeExpo: number
  scorePotentiel: number; niveauPotentiel: number
  classeVolat: number; volatEstimee: boolean
  scoreResiduel: number; niveauResiduel: number
  niveauSante: number; significatif: boolean
  dataQuality: 'ok' | 'estime' | 'aucun_danger'; flags: string[]
}

// Cotation SANTÉ d'une situation d'exposition (R409).
//   chim     = produit chimique lié (hse_produits_chimiques) — fournit le DANGER (Phase 1)
//   expo     = ligne hse_exposition_chimique (procédé, fréquence, quantité, protections, volatilité…)
//   qmaxNorm = plus grande quantité normalisée utilisée dans la MÊME zone (auto, pour le ratio Qi/Qmax) ; défaut = quantité de la situation (produit seul → 100 %)
export function computeExpositionSante(chim: any, expo: any, qmaxNorm?: number): ExpoSante {
  const d = computeRisqueChimique(chim || {})
  const classeSante = d.classeSante
  const cmr = classeSante >= 5 || !!(chim?.cmr && String(chim.cmr).trim() && !/non|aucun|^0$/i.test(String(chim.cmr)))
  const flags: string[] = []
  const nonUtil = !!expo?.non_utilise_1an
  const transfo = !!expo?.issu_transformation
  const classeF = nonUtil ? 0 : (_EXPO_FREQ[String(expo?.frequence || '')] ?? 2)

  // ── Risque POTENTIEL (quantité + fréquence) ──
  let scorePotentiel = 0, niveauPotentiel = 0, classeQ = 0, classeExpo = 0
  if (classeSante > 0 && !nonUtil) {
    if (transfo) {
      classeExpo = _EXPO_MATRIX[4][classeF] // fumée/poussière issue de transformation → fréquence seule (R409)
      flags.push('Agent issu de la transformation de matière (fumée / poussière) : cotation sur la fréquence seule.')
    } else {
      const qi = normQuantiteChimique(expo?.quantite_utilisee, expo?.unite)
      const qmax = (qmaxNorm && qmaxNorm > 0) ? qmaxNorm : qi
      const ratio = qmax > 0 ? qi / qmax : 1
      classeQ = _classeRatio(ratio)
      classeExpo = _EXPO_MATRIX[Math.max(0, classeQ - 1)][classeF]
    }
    scorePotentiel = _SCORE_DANGER[classeSante] * _FACTEUR_EXPO[classeExpo]
    niveauPotentiel = _nivPotentiel(scorePotentiel)
  } else if (nonUtil && classeSante > 0) {
    flags.push('Non utilisé depuis ≥ 1 an : hors hiérarchisation (à éliminer des stocks).')
  }

  // ── Risque RÉSIDUEL par inhalation (Sinh = danger × volatilité × procédé × protection ; quantité EXCLUE) ──
  let classeVolat = _CLASSE_VOLAT[String(expo?.volatilite || '')]
  let volatEstimee = false
  if (!classeVolat) { classeVolat = 3; volatEstimee = true } // inconnu → conservateur (classe 3)
  let scoreResiduel = 0, niveauResiduel = 0
  if (classeSante > 0 && !nonUtil) {
    let protKey = String(expo?.protection_collective || 'aucune')
    if (expo?.maintenance_ko) { const i = _ORDRE_PROTECTION.indexOf(protKey); protKey = _ORDRE_PROTECTION[Math.max(0, i - 1)] }
    const sProc = _SCORE_PROCEDE[String(expo?.procede || '')] ?? 0.5
    const sProt = _SCORE_PROTECTION[protKey] ?? 1
    scoreResiduel = _SCORE_DANGER[classeSante] * _SCORE_VOLAT[classeVolat] * sProc * sProt
    niveauResiduel = _nivResiduel(scoreResiduel)
    if (volatEstimee) flags.push('Volatilité estimée (préciser l\'état physique pour fiabiliser le résiduel).')
  }

  // ── Niveau retenu = le plus défavorable des deux, + plancher CMR ──
  let niveauSante = classeSante <= 0 ? 0 : Math.max(niveauPotentiel, niveauResiduel)
  if (cmr && niveauSante > 0) {
    niveauSante = Math.max(niveauSante, 2) // un CMR ne descend jamais sous « Moyen »
    flags.push('CMR : substitution obligatoire à rechercher (R.4412-66) ; ni protection collective ni EPI n\'abaissent la conclusion.')
  }
  const significatif = !nonUtil && (niveauSante >= 3 || cmr) // un produit hors hiérarchisation (≥1 an) n'est pas « significatif »
  const dataQuality: 'ok' | 'estime' | 'aucun_danger' = classeSante <= 0 ? 'aucun_danger' : (volatEstimee ? 'estime' : 'ok')
  return {
    classeSante, cmr, classeQ, classeF, classeExpo,
    scorePotentiel, niveauPotentiel, classeVolat, volatEstimee,
    scoreResiduel, niveauResiduel, niveauSante, significatif, dataQuality, flags,
  }
}

// ══════════════════════════════════════════════════════════════
// SEIRICH — Phase 3 : cotation INCENDIE-EXPLOSION & ENVIRONNEMENT par SITUATION
// Axes physico-chimique et environnemental de ND 2233 / R 409.
// Ces axes sont volontairement plus GROSSIERS que la Santé : ND 2233 ne modélise
// pas l'exposition par voie ici — danger(classe CLP) × quantité présente suffit,
// puis un overlay propre à l'axe (ATEX/comburant pour l'incendie, rejet pour l'env).
// CANONIQUE : classes de danger CLP, classe de quantité, cote danger×quantité.
// PRAGMATIQUE (assumé, INDICATIF) : overlay ATEX (+1), plancher comburant,
//   modulation « −1 niveau si aucun rejet », mapping sur SEIRICH_NIVEAUX 0..3.
// ══════════════════════════════════════════════════════════════
// Classe de quantité de la ZONE (unité de travail) : Qmax normalisé (g-équiv) → kg → 1..5.
function _classeQuantiteZone(qNormG: number): number { return classeQuantiteChimique((Number(qNormG) || 0) / 1000) }
// Coercition robuste d'un booléen stocké en base (true / 'oui' / 1 / 'non' / '' …).
function _truthy(v: any): boolean {
  if (v === true || v === 1) return true
  const s = String(v ?? '').trim().toLowerCase()
  return s !== '' && !/^(non|aucun|0|false|no|n)$/.test(s)
}

// Zone ATEX indicative (annotation, non intégrée au niveau) d'après procédé × volatilité.
export function zoneAtexIndicative(procede: string, volatilite: string): string {
  const v = String(volatilite || '')
  const cv = _CLASSE_VOLAT[v] || 0
  const poudre = /poudre|grains/.test(v)
  // Dispersif (pulvérisation) forme un aérosol explosif même à volatilité modérée → toujours une zone.
  if (cv < 3 && !poudre) return procede === 'dispersif' ? 'Zone 1/2 (aérosol / brouillard)' : ''
  if (poudre) return procede === 'dispersif' ? 'Zone 20/21 (poussières)' : 'Zone 22 (poussières)'
  if (procede === 'dispersif' || procede === 'ouvert') return 'Zone 0/1 (gaz-vapeurs)'
  if (procede === 'clos_ouvert') return 'Zone 1/2 (gaz-vapeurs)'
  return 'Zone 2 (gaz-vapeurs)'
}

export type ExpoIncendie = {
  classeIncendie: number; classeQuantiteZone: number; score: number
  niveauIncendie: number; atexProbable: boolean; comburant: boolean; zoneAtex: string
  dataQuality: 'ok' | 'incomplet' | 'aucun'; flags: string[]
}
// Cotation INCENDIE-EXPLOSION d'une situation (ND 2233 / R 409, INDICATIF).
export function computeExpositionIncendie(chim: any, expo: any, qmaxNormZone?: number): ExpoIncendie {
  const d = computeRisqueChimique(chim || {})
  const cI = d.classeIncendie
  const flags: string[] = []
  const pictos: string[] = Array.isArray(chim?.pictogrammes) ? chim.pictogrammes.map((x: any) => String(x).toUpperCase().trim()) : []
  const comburant = d.hCodes.some((h) => ['H270', 'H271', 'H272'].includes(h)) || pictos.includes('SGH03')
  const qi = normQuantiteChimique(expo?.quantite_utilisee, expo?.unite)
  const qzone = (qmaxNormZone && qmaxNormZone > 0) ? qmaxNormZone : qi
  const cQZ = _classeQuantiteZone(qzone)
  let niveau = _niveau(cI, cQZ)
  const procede = String(expo?.procede || '')
  const classeVolat = _CLASSE_VOLAT[String(expo?.volatilite || '')] || 0
  const atexProbable = cI >= 3 && procede !== 'clos_permanent' && (procede === 'dispersif' || classeVolat === 3)
  if (atexProbable && niveau > 0) {
    niveau = Math.min(3, niveau + 1)
    flags.push('Atmosphère explosive probable (ATEX) : zonage, matériel ADF, mise à la terre, permis de feu.')
  }
  if (comburant) {
    flags.push('Comburant (H270/271/272 · SGH03) : stockage séparé des matières combustibles/inflammables.')
    if (cQZ >= 2) niveau = Math.max(niveau, 2)
    if (cQZ >= 3) niveau = Math.max(niveau, 3)
  }
  if (_truthy(expo?.non_utilise_1an) && niveau > 0) flags.push('Produit non utilisé depuis ≥ 1 an : le niveau reflète le risque de STOCKAGE (incendie) — évacuer / éliminer des stocks.')
  return {
    classeIncendie: cI, classeQuantiteZone: cQZ, score: cI * cQZ, niveauIncendie: niveau,
    atexProbable, comburant, zoneAtex: atexProbable ? zoneAtexIndicative(procede, String(expo?.volatilite || '')) : '',
    dataQuality: d.dataQuality, flags,
  }
}

export type ExpoEnv = {
  classeEnv: number; classeQuantiteZone: number; score: number
  rejetMilieu: boolean; niveauEnv: number
  dataQuality: 'ok' | 'incomplet' | 'aucun'; flags: string[]
}
// Cotation ENVIRONNEMENT d'une situation (ND 2233 / R 409, INDICATIF).
export function computeExpositionEnv(chim: any, expo: any, qmaxNormZone?: number): ExpoEnv {
  const d = computeRisqueChimique(chim || {})
  const cE = d.classeEnv
  const flags: string[] = []
  const rejet = _truthy(expo?.rejet_milieu)
  const qi = normQuantiteChimique(expo?.quantite_utilisee, expo?.unite)
  const qzone = (qmaxNormZone && qmaxNormZone > 0) ? qmaxNormZone : qi
  const cQZ = _classeQuantiteZone(qzone)
  let niveau = _niveau(cE, cQZ)
  if (cE > 0) {
    if (rejet) {
      flags.push('Rejet vers le milieu déclaré : risque environnemental PLEIN. Vérifier autorisation de rejet / ICPE / convention de raccordement.')
      if (cE >= 5) niveau = Math.max(niveau, 2)
    } else {
      niveau = Math.max(cE >= 4 ? 1 : 0, niveau - 1)
      flags.push('Aucun rejet vers le milieu (confinement / rétention / filière déchets) : risque réduit d\'un niveau ; vigilance déversement accidentel.')
    }
  }
  if (_truthy(expo?.non_utilise_1an) && niveau > 0) flags.push('Produit non utilisé depuis ≥ 1 an : le niveau reflète le risque de STOCKAGE (déversement / écotoxicité) — éliminer des stocks.')
  return { classeEnv: cE, classeQuantiteZone: cQZ, score: cE * cQZ, rejetMilieu: rejet, niveauEnv: niveau, dataQuality: d.dataQuality, flags }
}

// Distribution des défauts : calcul LIVE si les NC portent `type_defaut`,
// sinon repli sur l'instantané réel NC_PARETO. Toujours trié décroissant.
export function ncDefautDistribution(ncs: any[]): Array<[string, number]> {
  const live: Record<string, number> = {}
  let liveTotal = 0
  for (const n of ncs || []) {
    const d = n && (n.type_defaut || n.defaut) ? String(n.type_defaut || n.defaut).trim() : ''
    if (d) { live[d] = (live[d] || 0) + 1; liveTotal++ }
  }
  const src: Array<[string, number]> = liveTotal >= 5
    ? (Object.entries(live) as Array<[string, number]>)
    : NC_PARETO.map((x) => [x[0], x[1]] as [string, number])
  return src.slice().sort((a, b) => b[1] - a[1])
}

// Vrai diagramme de Pareto en SVG : barres verticales décroissantes (axe gauche = nb de NC)
// + courbe cumulée montant jusqu'à 100 % (axe droit) + ligne des 80 %. 100 % SSR, sans dépendance.
export function paretoCard(ncs: any[]): string {
  const dist = ncDefautDistribution(ncs)
  const total = dist.reduce((s, d) => s + d[1], 0) || 1
  const n = dist.length || 1
  const maxCount = dist.length ? dist[0][1] : 1
  const W = 860, H = 376, mL = 46, mR = 50, mT = 20, mB = 134
  const plotW = W - mL - mR, plotH = H - mT - mB, bottomY = mT + plotH
  const band = plotW / n, barW = Math.min(band * 0.64, 46)
  const yPct = (p: number) => mT + plotH * (1 - p / 100)            // y d'un % cumulé (0 en bas, 100 en haut)
  const yCount = (v: number) => bottomY - (v / (maxCount || 1)) * plotH

  let grid = '', rightAxis = '', leftAxis = ''
  for (const p of [0, 20, 40, 60, 80, 100]) {
    const y = yPct(p)
    grid += `<line x1="${mL}" y1="${y.toFixed(1)}" x2="${mL + plotW}" y2="${y.toFixed(1)}" stroke="${p === 80 ? '#fca5a5' : '#f1f5f9'}" stroke-width="1"${p === 80 ? ' stroke-dasharray="4 3"' : ''}/>`
    rightAxis += `<text x="${mL + plotW + 6}" y="${(y + 3).toFixed(1)}" font-size="9" fill="#9ca3af">${p}%</text>`
  }
  for (let k = 0; k <= 4; k++) {
    const v = Math.round(maxCount * k / 4), y = yCount(v)
    leftAxis += `<text x="${mL - 6}" y="${(y + 3).toFixed(1)}" font-size="9" fill="#9ca3af" text-anchor="end">${v}</text>`
  }

  let bars = '', labels = '', dots = '', cum = 0
  const pts: string[] = []
  dist.forEach(([label, c], i) => {
    const cumBefore = cum; cum += c
    const cumPct = cum / total * 100
    const vital = (cumBefore / total * 100) < 80   // « vital few » = barres sous 80 % de cumul
    const x = mL + i * band + (band - barW) / 2
    const y = yCount(c)
    const cx = mL + i * band + band / 2
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${(bottomY - y).toFixed(1)}" rx="2" fill="${vital ? '#dc2626' : '#cbd5e1'}"><title>${esc(label)} : ${c} NC (${cumPct.toFixed(0)} % cumulé)</title></rect>`
    bars += `<text x="${cx.toFixed(1)}" y="${(y - 3).toFixed(1)}" font-size="8.5" fill="#6b7280" text-anchor="middle">${c}</text>`
    const cy = yPct(cumPct)
    pts.push(`${cx.toFixed(1)},${cy.toFixed(1)}`)
    dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6" fill="#b91c1c"/>`
    const short = label.length > 17 ? label.slice(0, 16) + '…' : label
    const ly = bottomY + 12
    labels += `<text x="${cx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="8.5" fill="#374151" text-anchor="end" transform="rotate(-45 ${cx.toFixed(1)} ${ly.toFixed(1)})">${esc(short)}<title>${esc(label)}</title></text>`
  })
  const line = `<polyline points="${pts.join(' ')}" fill="none" stroke="#b91c1c" stroke-width="2"/>`
  const axes = `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${bottomY}" stroke="#cbd5e1"/><line x1="${mL}" y1="${bottomY}" x2="${mL + plotW}" y2="${bottomY}" stroke="#cbd5e1"/><line x1="${mL + plotW}" y1="${mT}" x2="${mL + plotW}" y2="${bottomY}" stroke="#cbd5e1"/>`
  const caps = `<text x="13" y="${(mT + plotH / 2).toFixed(1)}" font-size="9" fill="#94a3b8" text-anchor="middle" transform="rotate(-90 13 ${(mT + plotH / 2).toFixed(1)})">Nombre de NC</text><text x="${W - 11}" y="${(mT + plotH / 2).toFixed(1)}" font-size="9" fill="#94a3b8" text-anchor="middle" transform="rotate(-90 ${W - 11} ${(mT + plotH / 2).toFixed(1)})">% cumulé</text>`

  return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
      <div style="font-weight:800;color:#111827;font-size:.88rem;"><i class="fas fa-chart-column" style="color:#dc2626;margin-right:7px;"></i>Pareto des non-conformités par type de défaut</div>
      <div style="font-size:.72rem;color:#6b7280;">n = ${total} défauts typés</div>
    </div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;font-family:Inter,system-ui,sans-serif;">
      ${grid}${axes}${bars}${line}${dots}${labels}${leftAxis}${rightAxis}${caps}
    </svg>
    <div style="margin-top:6px;font-size:.7rem;color:#9ca3af;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <span><span style="display:inline-block;width:10px;height:10px;background:#dc2626;border-radius:2px;margin-right:5px;"></span>Vital few (≈ 80 % des NC)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#cbd5e1;border-radius:2px;margin-right:5px;"></span>Trivial many</span>
      <span><span style="display:inline-block;width:14px;height:2px;background:#b91c1c;margin-right:5px;vertical-align:middle;"></span>Courbe cumulée (→ 100 %)</span>
      <span style="margin-left:auto;">Ligne pointillée = seuil 80 %</span>
    </div>
  </div>`
}

function card(title: string, icon: string, inner: string): string {
  return `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px 18px;margin-bottom:14px;">
    <div style="font-weight:800;color:#111827;font-size:.9rem;margin-bottom:10px;"><i class="fas ${icon}" style="color:#ef4444;margin-right:7px;"></i>${title}</div>${inner}</div>`
}
function defTable(rows: Array<[string, string, boolean?]>): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:.8rem;"><tbody>${rows.map((r) => `<tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:5px 10px;font-weight:800;color:#b91c1c;white-space:nowrap;width:90px;font-family:monospace;">${esc(r[0])}</td><td style="padding:5px 10px;color:#374151;">${esc(r[1])}${r[2] === false ? ' <span style="color:#d97706;font-size:.7rem;">(à confirmer)</span>' : ''}</td></tr>`).join('')}</tbody></table>`
}
function chips(items: string[]): string {
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;">${items.map((x) => `<span style="background:#f1f5f9;color:#334155;border-radius:6px;padding:3px 9px;font-size:.74rem;">${esc(x)}</span>`).join('')}</div>`
}

// Cartes HSE additionnelles (familles DUER, unités de travail, zones, EPI, consignes)
function referentielsHseCards(): string {
  const zoneRows = ZONES_ATELIER.map((z) => [z[0], z[1]] as [string, string])
  const consignes = '<ol style="margin:0;padding-left:20px;font-size:.8rem;color:#374151;line-height:1.6;">' + CONSIGNES_SECURITE.map((c) => `<li>${esc(c)}</li>`).join('') + '</ol>'
  return `${card('Familles de risque DUER — INRS ED 840 (2023)', 'fa-triangle-exclamation', chips(DUER_FAMILLES) + '<div style="height:8px;"></div><div style="font-size:.64rem;color:#94a3b8;font-weight:700;">20 familles ED 840 (2023) — conformité stricte, aucune famille hors nomenclature.</div>')}
    ${card('Unités de travail (DUER)', 'fa-people-group', chips(UT_CANONIQUES))}
    ${card('Zones atelier (code → secteur)', 'fa-location-dot', defTable(zoneRows as any))}
    ${card('EPI de l\'atelier', 'fa-helmet-safety', chips(EPI_ATELIER))}
    ${card('Bonnes pratiques sécurité', 'fa-shield-halved', consignes)}`
}

// Panneau « Référentiels » réutilisable. id = conteneur (qual-panel-referentiels / sec-panel-referentiels),
// hse = ajoute les cartes HSE (familles DUER, UT, zones, EPI, consignes).
export function referentielsPanel(id = 'qual-panel-referentiels', hse = false): string {
  return `<div id="${id}" style="display:none;">
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#9a3412;">
      <i class="fas fa-book" style="margin-right:6px;"></i>Référentiels & acronymes QHSE — vocabulaires contrôlés, source unique partagée Qualité / Sécurité. Les acronymes notés « à confirmer » sont déduits.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;">
      <div>
        ${card('Acronymes', 'fa-spell-check', defTable(ACRONYMES as any))}
      </div>
      <div>
        ${card('Imputation / secteurs (code → service)', 'fa-sitemap', defTable(IMPUTATIONS as any))}
      </div>
    </div>
    ${card('Types de NC', 'fa-tag', chips(NC_TYPES))}
    ${card('Types de défaut', 'fa-bug', chips(NC_DEFAUTS))}
    ${card('Types de cause', 'fa-diagram-project', chips(NC_CAUSES))}
    ${card('Décisions qualité', 'fa-gavel', chips(DECISIONS_QUALITE))}
    ${card('Dérogations', 'fa-file-signature', '<div style="font-size:.8rem;color:#374151;">Type de demande : ' + chips(DEROG_TYPES_DEMANDE) + '<div style="height:8px;"></div>Résultat : ' + chips(DEROG_RESULTATS.map((r) => r + ' = ' + (r === 'R' ? 'Refus' : r === 'AT' ? 'Accord Total' : 'Accord Limité'))) + '</div>')}
    ${card('Sécurité', 'fa-helmet-safety', 'Types : ' + chips(SECU_TYPES) + '<div style="height:8px;"></div>Secteurs : ' + chips(SECU_SECTEURS))}
    ${hse ? referentielsHseCards() : ''}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// VLE de rejet — valeurs limites INDICATIVES (arrêté type du 02/02/1998,
// effluents industriels). La VLE réelle est fixée par l'arrêté préfectoral
// du site ; ce référentiel sert de repère de saisie et de contrôle auto.
// ══════════════════════════════════════════════════════════════
export const VLE_REFERENCE: { parametre: string; max: number; min?: number; unite: string; note?: string }[] = [
  { parametre: 'pH', max: 8.5, min: 5.5, unite: '', note: 'plage 5,5 - 8,5' },
  { parametre: 'Temperature', max: 30, unite: 'degC' },
  { parametre: 'MES (matieres en suspension)', max: 35, unite: 'mg/L' },
  { parametre: 'DCO', max: 125, unite: 'mg/L' },
  { parametre: 'DBO5', max: 30, unite: 'mg/L' },
  { parametre: 'Hydrocarbures totaux', max: 10, unite: 'mg/L' },
  { parametre: 'Aluminium', max: 5, unite: 'mg/L' },
  { parametre: 'Chrome total', max: 0.5, unite: 'mg/L' },
  { parametre: 'Chrome VI', max: 0.1, unite: 'mg/L' },
  { parametre: 'Nickel', max: 0.5, unite: 'mg/L' },
  { parametre: 'Fluorures', max: 15, unite: 'mg/L' },
  { parametre: 'Zinc', max: 2, unite: 'mg/L' },
]

// Conformité auto d'une mesure à sa VLE : valeur <= vle (max) et, si defini, valeur >= min.
// Renvoie null si la comparaison n'est pas possible (valeur ou VLE manquante).
export function conformiteVle(valeur: any, vle: any, min?: any): boolean | null {
  const v = Number(valeur), s = Number(vle)
  if (!isFinite(v) || !isFinite(s)) return null
  if (min != null && isFinite(Number(min)) && v < Number(min)) return false
  return v <= s
}

// ══════════════════════════════════════════════════════════════
// CLASSIFICATION RÉGLEMENTAIRE DES DÉCHETS (décision 2014/955/UE)
// L'astérisque (*) = déchet dangereux. Sous-ensemble usinage + traitement surface.
// ══════════════════════════════════════════════════════════════
export const CODE_DECHETS_EU: { code: string; libelle: string }[] = [
  { code: "11 01 05*", libelle: "Acides de décapage" },
  { code: "11 01 09*", libelle: "Boues et gateaux de filtration (substances dangereuses)" },
  { code: "11 01 11*", libelle: "Liquides aqueux de rincage (substances dangereuses)" },
  { code: "11 01 13*", libelle: "Dechets de degraissage (substances dangereuses)" },
  { code: "12 01 01", libelle: "Limaille et chutes de metaux ferreux" },
  { code: "12 01 03", libelle: "Limaille et chutes de metaux non ferreux" },
  { code: "12 01 07*", libelle: "Huiles d'usinage minerales sans halogenes" },
  { code: "12 01 09*", libelle: "Emulsions et solutions d'usinage sans halogenes" },
  { code: "12 01 13", libelle: "Dechets de soudure" },
  { code: "12 01 21*", libelle: "Dechets de meulage (substances dangereuses)" },
  { code: "13 02 05*", libelle: "Huiles moteur/boite/lubrification non chlorees" },
  { code: "14 06 03*", libelle: "Autres solvants et melanges de solvants" },
  { code: "08 01 11*", libelle: "Dechets de peintures et vernis a solvants" },
  { code: "16 05 06*", libelle: "Produits chimiques de laboratoire" },
  { code: "15 01 01", libelle: "Emballages papier/carton" },
  { code: "15 01 02", libelle: "Emballages plastiques" },
  { code: "15 01 04", libelle: "Emballages metalliques" },
  { code: "15 01 10*", libelle: "Emballages souilles (residus dangereux)" },
  { code: "15 02 02*", libelle: "Absorbants, chiffons, EPI souilles" },
  { code: "20 01 01", libelle: "Papier et carton (non dangereux)" },
  { code: "20 03 01", libelle: "Dechets en melange (DIB)" },
]
export const codeDechetDangereux = (code: any) => /\*/.test(String(code || ''))

// Codes d'operation de traitement (annexes I/II directive 2008/98/CE) : R = valorisation, D = elimination.
export const FILIERES_RD: { code: string; libelle: string; type: "R" | "D" }[] = [
  { code: "R1", libelle: "Valorisation energetique (combustible)", type: "R" },
  { code: "R3", libelle: "Recyclage matieres organiques / solvants", type: "R" },
  { code: "R4", libelle: "Recyclage des metaux", type: "R" },
  { code: "R5", libelle: "Recyclage autres matieres inorganiques", type: "R" },
  { code: "R9", libelle: "Regeneration des huiles", type: "R" },
  { code: "R13", libelle: "Stockage avant valorisation", type: "R" },
  { code: "D5", libelle: "Mise en decharge (ISDD/ISDND)", type: "D" },
  { code: "D9", libelle: "Traitement physico-chimique", type: "D" },
  { code: "D10", libelle: "Incineration a terre", type: "D" },
  { code: "D13", libelle: "Regroupement avant elimination", type: "D" },
  { code: "D15", libelle: "Stockage avant elimination", type: "D" },
]

// Cycle de vie du bordereau (BSDD / Trackdechets).
export const BSD_CYCLE: [string, string][] = [
  ["brouillon", "Brouillon"], ["emis", "Emis"], ["pris_en_charge", "Pris en charge (transporteur)"],
  ["recu", "Recu (exutoire)"], ["traite", "Traite"], ["refuse", "Refuse"],
]

// ══════════════════════════════════════════════════════════════
// CLASSEMENT ICPE / SEVESO
// ══════════════════════════════════════════════════════════════
export const RUBRIQUES_ICPE: { rubrique: string; libelle: string }[] = [
  { rubrique: "2560", libelle: "Travail mecanique des metaux et alliages" },
  { rubrique: "2564", libelle: "Nettoyage-degraissage par solvants" },
  { rubrique: "2565", libelle: "Revetement / traitement de surface des metaux" },
  { rubrique: "2661", libelle: "Transformation de polymeres (plastiques)" },
  { rubrique: "1185", libelle: "Fluides frigorigenes / gaz fluores" },
  { rubrique: "4734", libelle: "Produits petroliers (fioul, gazole)" },
]

// Rubriques Seveso (4xxx) de repere + seuils bas (SB) / haut (SH) en tonnes + regle H->rubrique.
export const SEVESO_RUBRIQUES: { code: string; libelle: string; classe: "sante" | "physique" | "env"; sb: number; sh: number; match: RegExp }[] = [
  { code: "4130", libelle: "Toxiques aigus (cat. 1-2)", classe: "sante", sb: 5, sh: 20, match: /H3(00|10|30)/ },
  { code: "4140", libelle: "Toxiques (cat. 3) / acides toxiques", classe: "sante", sb: 50, sh: 200, match: /H3(01|11|31)/ },
  { code: "4441", libelle: "Solides/liquides comburants", classe: "physique", sb: 50, sh: 200, match: /H27[12]/ },
  { code: "4320", libelle: "Aerosols inflammables", classe: "physique", sb: 150, sh: 500, match: /H22[23]/ },
  { code: "4331", libelle: "Liquides inflammables (cat. 2-3)", classe: "physique", sb: 5000, sh: 50000, match: /H22[45]/ },
  { code: "4718", libelle: "Gaz inflammables", classe: "physique", sb: 10, sh: 50, match: /H22[01]/ },
  { code: "4510", libelle: "Tres toxiques milieu aquatique (aigu/chronique 1)", classe: "env", sb: 100, sh: 200, match: /H4(00|10)/ },
  { code: "4511", libelle: "Toxiques milieu aquatique (chronique 2)", classe: "env", sb: 200, sh: 500, match: /H411/ },
]

// Convertit une quantite en TONNES (kg/L -> /1000, densite approx 1 ; t inchange).
function qtTonnes(q: any, unite: any): number {
  const v = Number(q); if (!isFinite(v) || v <= 0) return 0
  const u = String(unite || "").toLowerCase()
  if (/tonne|^t$|\bt\b/.test(u)) return v
  return v / 1000 // kg / L / defaut
}

// Classement Seveso INDICATIF depuis l'inventaire chimique (mentions H -> rubrique 4xxx -> q/seuil).
// Regle : somme(q/Q) par classe (sante/physique/env) ; >=1 en seuil bas -> SB, >=1 en seuil haut -> SH.
export function computeSeveso(chimiques: any[]) {
  const classes: Record<string, { sb: number; sh: number }> = { sante: { sb: 0, sh: 0 }, physique: { sb: 0, sh: 0 }, env: { sb: 0, sh: 0 } }
  const details: any[] = []
  for (const c of (chimiques || [])) {
    const codes = Array.isArray(c.mentions_danger) ? c.mentions_danger.map((x: any) => String(x)) : (String(c.mentions_danger || "").match(/H\d{3}/g) || [])
    const hstr = codes.join(" ")
    const q = qtTonnes(c.quantite, c.unite)
    if (q <= 0) continue
    for (const r of SEVESO_RUBRIQUES) {
      if (r.match.test(hstr)) {
        classes[r.classe].sb += q / r.sb
        classes[r.classe].sh += q / r.sh
        details.push({ nom: c.nom, rubrique: r.code, libelle: r.libelle, classe: r.classe, q, ratioSb: q / r.sb, ratioSh: q / r.sh })
        break
      }
    }
  }
  const maxSb = Math.max(classes.sante.sb, classes.physique.sb, classes.env.sb)
  const maxSh = Math.max(classes.sante.sh, classes.physique.sh, classes.env.sh)
  const statut = maxSh >= 1 ? "seuil_haut" : maxSb >= 1 ? "seuil_bas" : "non_seveso"
  details.sort((a, b) => b.ratioSb - a.ratioSb)
  return { classes, statut, maxSb: Math.round(maxSb * 1000) / 1000, maxSh: Math.round(maxSh * 1000) / 1000, details }
}

// ══════════════════════════════════════════════════════════════
// BILAN GES / CARBONE (BEGES scopes 1-2-3) — approche MONETAIRE
// Facteurs d'emission indicatifs (Base Carbone ADEME). Scope 3 estime depuis
// les montants d'achats ventiles par compte PCG (facteur monetaire kgCO2e / EUR HT).
// ══════════════════════════════════════════════════════════════
export const FACTEURS_GES = {
  elec_kwh: 0.052, gaz_kwh: 0.205, gazole_l: 2.51, gpl_l: 1.66, eau_m3: 0.13,
  dechet_dd_kg: 1.2, dechet_dnd_kg: 0.4,
}
// Facteurs monetaires par famille de compte PCG (kgCO2e / EUR HT) + scope (1 direct / 2 elec / 3 amont-aval).
export const FACTEURS_GES_MONETAIRE: { prefix: string; libelle: string; scope: 1 | 2 | 3; facteur: number }[] = [
  { prefix: "606300", libelle: "Electricite", scope: 2, facteur: 0.15 },
  { prefix: "6061", libelle: "Combustibles (fioul, gaz)", scope: 1, facteur: 0.45 },
  { prefix: "606", libelle: "Energie (autre)", scope: 2, facteur: 0.25 },
  { prefix: "6022", libelle: "Carburants", scope: 1, facteur: 0.55 },
  { prefix: "601", libelle: "Achats matieres premieres", scope: 3, facteur: 0.45 },
  { prefix: "602", libelle: "Fournitures / consommables", scope: 3, facteur: 0.35 },
  { prefix: "604", libelle: "Sous-traitance (etudes/prestations)", scope: 3, facteur: 0.30 },
  { prefix: "611", libelle: "Sous-traitance generale", scope: 3, facteur: 0.30 },
  { prefix: "624", libelle: "Transports sur achats/ventes", scope: 3, facteur: 0.50 },
  { prefix: "625", libelle: "Deplacements, missions", scope: 3, facteur: 0.40 },
]
const FACTEUR_GES_DEFAUT = 0.25 // achats non classes -> scope 3

// Bilan GES monetaire : ventile les factures fournisseur par compte PCG -> kgCO2e -> scopes 1/2/3.
export function computeBilanGES(factures: any[], annee?: string) {
  const Y = annee || new Date().toISOString().slice(0, 4)
  const scopes = { s1: 0, s2: 0, s3: 0 }
  const parPoste: Record<string, { kg: number; scope: number }> = {}
  for (const f of (factures || [])) {
    if (String(f.date_facture || "").slice(0, 4) !== Y) continue
    const ht = Number(f.montant_ht) || 0; if (ht <= 0) continue
    const cc = String(f.compte_charge || "").replace(/\s/g, "")
    const rule = FACTEURS_GES_MONETAIRE.find((r) => cc.startsWith(r.prefix))
    const facteur = rule ? rule.facteur : FACTEUR_GES_DEFAUT
    const scope = rule ? rule.scope : 3
    const poste = rule ? rule.libelle : "Autres achats"
    const kg = ht * facteur
    parPoste[poste] = parPoste[poste] || { kg: 0, scope }
    parPoste[poste].kg += kg
    if (scope === 1) scopes.s1 += kg; else if (scope === 2) scopes.s2 += kg; else scopes.s3 += kg
  }
  const t = (kg: number) => Math.round(kg / 1000 * 100) / 100
  const postes = Object.entries(parPoste).map(([poste, v]) => ({ poste, tco2: t(v.kg), scope: v.scope })).sort((a, b) => b.tco2 - a.tco2)
  return { scope1: t(scopes.s1), scope2: t(scopes.s2), scope3: t(scopes.s3), total: t(scopes.s1 + scopes.s2 + scopes.s3), postes, annee: Y }
}

// ══════════════════════════════════════════════════════════════
// DIAGNOSTIC ISO 14001:2015 — grille par chapitre (4 -> 10), maturité 1-4
// ══════════════════════════════════════════════════════════════
export const ISO14001_DIAGNOSTIC: { chapitre: string; titre: string; exigences: string }[] = [
  { chapitre: "4", titre: "Contexte de l'organisme", exigences: "Enjeux internes/externes, parties intéressées, périmètre du SME" },
  { chapitre: "5", titre: "Leadership", exigences: "Engagement de la direction, politique environnementale, rôles et responsabilités" },
  { chapitre: "6", titre: "Planification", exigences: "Aspects/impacts, obligations de conformité, risques & opportunités, objectifs" },
  { chapitre: "7", titre: "Support", exigences: "Ressources, compétences, sensibilisation, communication, informations documentées" },
  { chapitre: "8", titre: "Réalisation des activités", exigences: "Maîtrise opérationnelle, préparation et réponse aux situations d'urgence" },
  { chapitre: "9", titre: "Évaluation des performances", exigences: "Surveillance, évaluation de conformité, audit interne, revue de direction" },
  { chapitre: "10", titre: "Amélioration", exigences: "Non-conformités, actions correctives, amélioration continue" },
]
export const ISO14001_NIVEAUX: [string, string, string][] = [
  ["1", "Non conforme / inexistant", "#dc2626"],
  ["2", "Partiellement maîtrisé", "#f59e0b"],
  ["3", "Conforme mais améliorable", "#eab308"],
  ["4", "Conforme aux exigences", "#16a34a"],
]

// Perspective cycle de vie (ISO 14001 §6.1.2) — étapes amont → aval + maîtrise/influence indicatives.
export const CYCLE_VIE_ETAPES: { etape: string; maitrise: boolean; influence: boolean }[] = [
  { etape: "Acquisition des matières premières", maitrise: false, influence: true },
  { etape: "Conception / industrialisation", maitrise: true, influence: false },
  { etape: "Transport amont", maitrise: false, influence: true },
  { etape: "Réalisation / stockage (usinage, traitement)", maitrise: true, influence: true },
  { etape: "Transport aval / expédition", maitrise: true, influence: true },
  { etape: "Utilisation par le client", maitrise: false, influence: true },
  { etape: "Fin de vie du produit", maitrise: false, influence: true },
  { etape: "Élimination finale (déchets)", maitrise: true, influence: true },
]

// ISO 26000 (RSE) — 7 questions centrales pour l'autodiagnostic.
export const ISO26000_QUESTIONS: { code: string; titre: string }[] = [
  { code: "QC1", titre: "Gouvernance de l'organisation" },
  { code: "QC2", titre: "Droits de l'Homme" },
  { code: "QC3", titre: "Relations et conditions de travail" },
  { code: "QC4", titre: "L'environnement" },
  { code: "QC5", titre: "Loyauté des pratiques" },
  { code: "QC6", titre: "Questions relatives aux consommateurs" },
  { code: "QC7", titre: "Communautés et développement local" },
]
