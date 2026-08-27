// ══════════════════════════════════════════════════════════════
// GÉNÉRATEUR du manuel utilisateur → docs/manuel/*.md
// Un chapitre par service : intro, capture réelle, rôle de chaque
// onglet, procédures pas-à-pas des actions principales.
// Les captures viennent de scripts_doc/capture_screens.mjs (docs/assets/).
// Usage : node scripts_doc/gen_manuel.mjs
// ══════════════════════════════════════════════════════════════
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs', 'manuel')
const img = (name) => existsSync(join(ROOT, 'docs', 'assets', name + '.png')) ? `![${name}](../assets/${name}.png)` : `> ⚠ capture \`${name}.png\` à générer (\`node scripts_doc/capture_screens.mjs\`)`

const CH = [
  { svc: 'commercial', titre: 'Commercial', cap: 'commercial-dt', qui: 'Chargé(e) d\'affaires / commercial',
    intro: 'Point d\'entrée des affaires : réception des demandes, chiffrage, transformation en commande, gestion des avoirs et des relances.',
    onglets: [
      ['Demandes site internet', 'Réceptionne les demandes envoyées depuis le site web (formulaire de contact).'],
      ['DT / Demande travaux', 'Crée une Demande de Travaux : client, pièces, plans, activité (Seem/Semrac). Génère le n° d\'affaire.'],
      ['Offre (PRC1-D5)', 'Établit le devis à partir d\'une DT (prix de revient + marge).'],
      ['Avoirs & Commandes P', 'Liste des avoirs (AV-AAAA-XX) et des commandes prioritaires (CMDP-AAAA-XX) issues des retours clients.'],
      ['Liste clients', 'Fiche client, interlocuteurs, adresses de facturation.'],
      ['Commandes validées', 'Commandes acceptées, suivi.'],
      ['Dashboard', 'Indicateurs commerciaux (CA, taux de transformation…).'],
    ],
    procedures: [
      ['Créer une demande de travaux', ['Onglet **DT**, bouton « Nouvelle DT ».', 'Sélectionner le **client** (ou le créer) et l\'**activité** (Seem/Semrac).', 'Ajouter un ou plusieurs **produits** (référence, plan, quantité).', 'Enregistrer → un **numéro d\'affaire** est attribué.']],
      ['Traiter un retour client (avoir ou relance)', ['Le retour arrive depuis **Qualité › Non-Conformités** (bouton « Retour »). Voir le chapitre Qualité.', 'L\'**avoir** créé apparaît dans **Avoirs & Commandes P › Avoirs**.', 'La **commande prioritaire** apparaît dans **Commandes P** ; bouton **« Lancer la production »** → crée la commande, le lot LOTP et les BDT prioritaires (encadrés rouge dans le planning).']],
    ] },
  { svc: 'be', titre: 'Bureau d\'Études', cap: 'be-noms', qui: 'Technicien(ne) BE',
    intro: 'Définition technique des pièces : nomenclatures (matières + gamme d\'opérations), analyse des DT, références.',
    onglets: [['Nomenclatures', 'BOM : composants matière (masse en g), gamme d\'opérations (temps en millièmes d\'heure), prix de revient calculé.'], ['Analyse DT', 'Transforme une DT en dossier technique.'], ['Préparations tech.', 'Fichiers plan / programme CN par étape.'], ['Références', 'Catalogue des références et prix.'], ['Dashboard BE', 'Indicateurs BE.']],
    procedures: [['Créer une nomenclature', ['Onglet **Nomenclatures**, « Nouvelle nomenclature ».', 'Renseigner la **matière** (référence → prix auto si < 3 mois, sinon RFQ) et la **masse** (g).', 'Ajouter les **étapes** (glisser-déposer) : opération, machine, temps MO/machine, réglage (coût fixe/lot).', 'Le **prix de revient unitaire** se calcule automatiquement. Enregistrer (indice A/B/C).']]] },
  { svc: 'achats', titre: 'Achats', cap: 'achats-rfq', qui: 'Acheteur(se)',
    intro: 'Consultations fournisseurs (RFQ), demandes d\'achat, bons de commande, évaluation fournisseurs.',
    onglets: [['Demandes de prix', 'RFQ : source de vérité des prix → alimente le catalogue.'], ['Demandes d\'achat', 'DA à transformer en BC.'], ['Fournisseurs / ST', 'Référentiel fournisseurs et sous-traitants.'], ['Scorecard', 'Évaluation (qualité, délai) fournisseur/ST.'], ['Dashboard achats', 'Indicateurs achats.']],
    procedures: [['Émettre une demande de prix', ['Onglet **Demandes de prix**, « Nouvelle RFQ ».', 'Choisir le(s) **fournisseur(s)** et les **articles**.', 'À réception, saisir les prix → ils alimentent le **catalogue** (le BC n\'écrit jamais le prix).']]] },
  { svc: 'production', titre: 'Production', cap: 'production-planning', qui: 'Programmation / opérateurs',
    intro: 'Planification et suivi de la fabrication : planning Gantt des BDT (bons de travail) et BDS (sous-traitance), présence des opérateurs, lots.',
    onglets: [['Planning Gantt BDT', 'Affecte les BDT aux opérateurs par shift. BDT/BDS prioritaires encadrés rouge. Bouton « Agrandir le planning ».'], ['Planning Gantt BST', 'Planning de la sous-traitance (14 jours).'], ['Présence opérateurs', 'Pointage / disponibilité.'], ['Commandes & Lots', 'Vue des commandes à faire, découpées en lots et BDT.'], ['Process Ateliers', 'Affectation des ressources aux postes.'], ['Dashboards', 'Programmation et production.']],
    procedures: [['Affecter et solder un BDT', ['Ouvrir **/production/planning**.', 'Dans « **BDT à affecter** », **glisser** une carte sur la ligne d\'un opérateur au bon créneau.', 'Quand l\'opération démarre : clic droit sur la barre → **Reçu**.', 'À la fin : clic droit → **Solder** → saisir le temps réel + **PIN** de l\'opérateur (traçabilité). Un écart déclenche éventuellement une NC.']]] },
  { svc: 'oas', titre: 'OAS (traitement de surface)', cap: 'oas', qui: 'Opérateur OAS',
    intro: 'Oxydation Anodique Sulfurique : suivi des lots/balancelles, relevés eau et bains.',
    onglets: [['Lots & Balancelles', 'Suivi des pièces en traitement.'], ['Relevé consommation eau', 'Saisie des relevés d\'eau.'], ['Relevés périodiques bains', 'Contrôle des bains (un bain non conforme génère une NC).'], ['Dashboard OAS', 'Indicateurs OAS.']],
    procedures: [['Saisir un relevé de bain', ['Onglet **Relevés périodiques bains**.', 'Sélectionner le **bain**, saisir les valeurs mesurées.', 'Si hors tolérance → le système crée automatiquement une **non-conformité**.']]] },
  { svc: 'qualite', titre: 'Qualité', cap: 'qualite-nc', qui: 'Qualiticien(ne)',
    intro: 'Maîtrise de la conformité : PV de contrôle, non-conformités, 8D, libération de lots, capabilité, dérogations, périssables.',
    onglets: [['PV de Contrôle', 'Procès-verbaux de contrôle.'], ['Non-Conformités', 'Déclaration et suivi des NC (interne, fournisseur, client, procédé).'], ['Rapports 8D', 'Résolution structurée (D1→D8).'], ['Libération Lots', 'Décision de libération / quarantaine.'], ['Plan de contrôle', 'Plans EN9100.'], ['Audit Conformité', 'Checklist d\'audit.'], ['Capabilité', 'Cp/Cpk via écart réduit.'], ['ECME', 'Équipements de contrôle.'], ['Produits Périssables', 'Suivi des dates de péremption.'], ['Dérogations', 'Dérogations liées aux NC.'], ['Référentiels', 'Vocabulaire QHSE.'], ['Dashboard Qualité', 'Indicateurs qualité.']],
    procedures: [
      ['Déclarer une non-conformité', ['Onglet **Non-Conformités**, « Nouvelle NC ».', 'Renseigner **type** (interne/fournisseur/client/procédé), **détecteur**, **gravité**, **lot/référence**, **catégorie**, **entité**.', 'Enregistrer. Une NC critique/bloquante **bloque les BL** du lot (porte qualité) et peut remonter en validation Direction.']],
      ['Traiter un retour client', ['Sur une NC de **type client**, cliquer **« Retour »**.', 'Renseigner **n° facture/affaire**, **lot**, **nb de pièces NC**.', 'Saisir le **prix de vente unitaire** (→ montant de l\'avoir) et/ou le **coût de revient** (→ commande prioritaire).', 'Choisir : **Refuser** · **Faire un avoir** (part dans Commercial › Avoirs) · **Commande prioritaire** (part dans Commercial › Commandes P).']],
    ] },
  { svc: 'securite', titre: 'Sécurité (HSE / RSE)', cap: 'securite-duer', qui: 'Responsable HSE / QSE',
    intro: 'Hygiène-Sécurité-Environnement : DUER, accidents, EPI, risque chimique (FDS), environnement, ATEX, vérifications réglementaires, formations, RSE.',
    onglets: [['DUER / Risques', 'Document unique d\'évaluation des risques (cotation gravité×fréquence).'], ['Événements', 'Accidents, presqu\'accidents, soins.'], ['EPI', 'Dotations et matrice EPI × zone.'], ['Chimie / FDS', 'Inventaire chimique + fiches de données de sécurité (export PDF).'], ['Environnement', 'ICPE, eau, déchets.'], ['Contrôles & prévention', 'ATEX, VGP, formations.'], ['Conformité', 'Matrice de conformité réglementaire.'], ['Référentiels', 'Zones, secteurs.'], ['Tableau de bord', 'Indicateurs HSE/RSE.']],
    procedures: [['Mettre à jour la matrice EPI par zone', ['Onglet **EPI**, bloc « EPI obligatoires par zone ».', 'Cliquer **« Modifier la matrice »**, cocher/décocher les cases (EPI × zone Z1–Z7).', 'Cliquer **« Sauvegarder »** (rien n\'est enregistré avant).']]] },
  { svc: 'expeditions', titre: 'Expéditions', cap: 'expeditions', qui: 'Agent d\'expédition',
    intro: 'Livraison des commandes : bons de livraison (BL), facturation partielle, suivi OTD.',
    onglets: [['Bons de Commande', 'BC clients.'], ['Bons de Livraison', 'Création des BL (partiels possibles).'], ['Commandes en cours', 'Reste à livrer.'], ['Dashboard', 'OTD.']],
    procedures: [['Créer un bon de livraison', ['Onglet **Bons de Livraison**, sélectionner la commande.', 'Saisir les **quantités expédiées** (BL partiel possible).', '⚠ Si le lot est en **quarantaine** ou a une NC bloquante, le BL est **refusé** (porte qualité) : traiter d\'abord la NC côté Qualité.', 'Validation → génère la **facture** et l\'écriture de vente.']]] },
  { svc: 'stock', titre: 'Stocks', cap: 'stock-rt', qui: 'Magasinier(ère)',
    intro: 'Gestion des stocks matière et consommables : temps réel, mouvements, alertes de réapprovisionnement.',
    onglets: [['Stock en temps réel', 'Niveaux actuels.'], ['Gestion du stock', 'Ajustements.'], ['Mouvements', 'Historique entrées/sorties.'], ['Alertes et Réappro.', 'Articles sous le seuil.'], ['Dashboard', 'Indicateurs stock.']],
    procedures: [['Consulter les alertes de réappro', ['Onglet **Alertes et Réappro.** : la liste des articles sous le point de commande.', 'Depuis là, déclencher une **demande d\'achat** (côté Achats).']]] },
  { svc: 'maintenance', titre: 'Maintenance', cap: 'maintenance', qui: 'Technicien(ne) maintenance',
    intro: 'GMAO : ordres de maintenance, préventif, MTBF, fiche machine 360, pièces détachées.',
    onglets: [['Interventions / OM', 'Ordres de maintenance curatifs.'], ['Plan Préventif', 'Gammes préventives → génèrent des OM.'], ['MTBF & Historique', 'Fiabilité.'], ['Fiche 360', 'TCO, heures, disponibilité/TRS d\'une machine.'], ['Pièces & PDR', 'Stock de pièces détachées.'], ['Dashboard', 'Indicateurs maintenance.']],
    procedures: [['Déclarer une panne machine', ['Onglet **Interventions**, « Nouvel OM » (ou depuis la fiche machine).', 'La machine passe en **arrêt** (visible en rouge au planning et sur le plan bâtiment).', 'À la clôture de l\'OM, la machine repasse **opérationnelle**.']]] },
  { svc: 'plans', titre: 'Plan / Bâtiment', cap: 'plans-maquette', qui: 'BE / Production / Maintenance / Qualité',
    intro: 'Maquette « BIM » de l\'usine : zones (rectangles) et objets (machines, périssables, chimie, ATEX, extincteurs) reliés à la base, avec états live et deep-links.',
    onglets: [['Maquette', 'Vue interactive du plan.']],
    procedures: [['Placer une machine dans une zone', ['Bouton **Modifier**.', 'Dans **Catégories**, cliquer **+** sur « Machine », puis **cliquer** l\'emplacement **dans le rectangle** de la zone.', 'Dans l\'éditeur, champ **« Élément lié »**, choisir la machine dans la liste.', '**Appliquer** puis **Enregistrer**. La machine est rattachée à la zone automatiquement et se colore selon son état (panne = rouge).']]] },
  { svc: 'rh', titre: 'Ressources Humaines', cap: 'rh-employes', qui: 'RH',
    intro: 'Gestion du personnel : employés, habilitations & certifications, compétences, organigramme, temps, pointage.',
    onglets: [['Employés', 'Fiches salariés (matricule, rôles, PIN).'], ['Habilitations & Certifications', 'Suivi (partagé avec la Qualité).'], ['Matrice Compétences', 'Compétences × salariés.'], ['Organigramme', 'Structure.'], ['Gestion des Temps', 'Congés, absences → planning.'], ['Dashboard', 'Indicateurs RH.']],
    procedures: [['Provisionner un salarié (accès ERP)', ['Onglet **Employés**, « Nouveau salarié ».', 'Renseigner **matricule**, **rôle(s)** (définit les droits — voir fiches de poste) et **PIN** (4 chiffres).', 'Le salarié peut se connecter (matricule + PIN) et pointer.']]] },
  { svc: 'compta', titre: 'Comptabilité', cap: 'compta', qui: 'Comptable',
    intro: 'Facturation, grand livre, TVA, trésorerie, coûts et marges.',
    onglets: [['Facturation', 'Factures clients/fournisseurs.'], ['Grand Livre', 'Écritures (format FEC).'], ['TVA & Déclarations', 'TVA.'], ['Balance & Trésorerie', 'Situation.'], ['Dashboard', 'Indicateurs compta.']],
    procedures: [['Exporter le FEC', ['La comptabilité s\'alimente automatiquement (chaque BL/facture génère une écriture de vente).', 'L\'export **FEC** est réservé aux rôles comptable/direction.']]] },
  { svc: 'direction', titre: 'Direction', cap: 'direction', qui: 'Direction',
    intro: 'Cockpit de pilotage : validations en attente, jalons critiques, vue par affaire, KPIs, budget, santé des données.',
    onglets: [['À valider', 'File des jalons soumis à la Direction.'], ['Jalons critiques', 'Retards, impayés, NC bloquantes, ruptures.'], ['Par affaire', 'Vue 360 d\'une affaire.'], ['Pilotage', 'KPIs (cibles kpi_objectifs).'], ['Budget', 'Suivi budgétaire.'], ['Santé des données', 'Score DICT de complétude.']],
    procedures: [['Valider un jalon', ['Onglet **À valider**.', 'Pour chaque élément : consulter, puis **Valider** ou **Refuser** (avec commentaire). Réservé à la Direction.']], ['Lancer le scan d\'alertes', ['Bouton **« Scanner les alertes »** : détecte retards/impayés/NC/ruptures et les matérialise dans la file de validation.']]] },
]

mkdirSync(OUT, { recursive: true })
let toc = `# Manuel utilisateur — ERP Seem Semrac

Ce manuel décrit l'utilisation de l'ERP, service par service, avec des **captures d'écran réelles**. Commencez par la **prise en main**.

| # | Chapitre | Pour qui |
|---|---|---|
| 0 | [Prise en main](00-prise-en-main.md) | Tous |
`
CH.forEach((c, i) => { toc += `| ${i + 1} | [${c.titre}](${c.svc}.md) | ${c.qui} |\n` })
writeFileSync(join(OUT, '00-index.md'), toc)

// Prise en main
writeFileSync(join(OUT, '00-prise-en-main.md'), `# Prise en main

## Se connecter
${img('login')}

1. Ouvrir l'adresse de l'ERP → la page de connexion s'affiche.
2. Saisir votre **matricule** (fourni par les RH) puis votre **code PIN** (4 chiffres).
3. Cliquer **Se connecter**. Vous arrivez sur l'accueil.

> En cas de verrouillage, un **compte de secours** existe (voir le responsable). Le pointage atelier se fait sur une **borne partagée** (matricule + PIN), sans se connecter au reste de l'ERP.

## L'accueil
${img('accueil')}

L'accueil présente une **tuile par service**. La **barre latérale** (à gauche) permet de naviguer à tout moment ; elle n'affiche que les services auxquels votre rôle donne accès.

## Repères communs
- **Onglets** : chaque service est découpé en onglets (en haut de la page).
- **Notifications** : les actions confirment par un bandeau en haut à droite.
- **Droits** : selon votre rôle, certaines actions sont en lecture seule. Voir votre **fiche de poste** (\`docs/fiches-poste/\`).
- **Enregistrer** : sauf mention « auto », une modification n'est prise en compte qu'après avoir cliqué **Enregistrer** / **Valider**.
`)

for (const c of CH) {
  let md = `# ${c.titre}

**Pour qui :** ${c.qui}

${c.intro}

${img(c.cap)}

## Les onglets
${c.onglets.map(o => `- **${o[0]}** — ${o[1]}`).join('\n')}

## Procédures
${c.procedures.map(p => `### ${p[0]}\n${p[1].map((s, i) => `${i + 1}. ${s}`).join('\n')}`).join('\n\n')}

---
> Détails techniques : \`docs/technique/06-modules/${c.svc}.md\`. Droits d'accès : \`docs/fiches-poste/\`.
`
  writeFileSync(join(OUT, c.svc + '.md'), md)
}
console.log('OK → docs/manuel/ (' + (CH.length + 2) + ' fichiers, captures depuis docs/assets/)')
