// ══════════════════════════════════════════════════════════════
// GÉNÉRATEUR des fiches de poste → docs/fiches-poste/<role>.md
// Une fiche A4 imprimable par rôle RBAC : mission, accès (rw/r),
// tâches pas-à-pas avec captures. Duplicable pour un nouvel embauché.
// Usage : node scripts_doc/gen_fiches_poste.mjs
// ══════════════════════════════════════════════════════════════
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs', 'fiches-poste')
const img = (n) => existsSync(join(ROOT, 'docs', 'assets', n + '.png')) ? `![${n}](../assets/${n}.png)` : `> ⚠ capture \`${n}.png\` manquante`

// rw/r : services (cf. docs/technique/04-auth-rbac.md)
const R = [
  { role: 'commercial', label: 'Commercial / Chargé(e) d\'affaires', rw: ['commercial'], r: ['be', 'production', 'qualité', 'expéditions', 'stock'],
    mission: 'Gérer la relation client, de la demande à la commande, et les avoirs/relances.',
    taches: [
      ['Créer une demande de travaux (DT)', 'commercial-dt', ['Commercial › **DT**, « Nouvelle DT ».', 'Client + activité (Seem/Semrac) + produits (réf, plan, quantité).', 'Enregistrer → n° d\'affaire attribué.']],
      ['Établir une offre', 'commercial-offre', ['Onglet **Offre**, partir d\'une DT.', 'Vérifier prix de revient + marge, envoyer.']],
      ['Suivre avoirs & commandes prioritaires', 'commercial-avoirs', ['Onglet **Avoirs & Commandes P**.', 'Sous-onglet **Commandes P** → « Lancer la production » pour une relance.']],
    ] },
  { role: 'bei', label: 'Bureau d\'Études (BE)', rw: ['be', 'achats'], r: ['commercial', 'production', 'oas', 'qualité', 'sécurité', 'stock', 'maintenance'],
    mission: 'Définir techniquement les pièces (nomenclatures, gammes) et préparer la fabrication.',
    taches: [
      ['Créer une nomenclature', 'be-noms', ['BE › **Nomenclatures**, « Nouvelle ».', 'Matière (réf → prix auto <3 mois) + masse (g).', 'Étapes (glisser-déposer) : opération, machine, temps, réglage.', 'Prix de revient calculé → Enregistrer (indice A/B/C).']],
      ['Analyser une DT', 'be-analyse', ['Onglet **Analyse DT**, sélectionner la DT.', 'Générer le dossier technique → BDT.']],
    ] },
  { role: 'achats', label: 'Acheteur(se)', rw: ['achats', 'stock'], r: ['commercial', 'be', 'production', 'expéditions', 'maintenance'],
    mission: 'Consulter les fournisseurs, passer les commandes, tenir le référentiel fournisseurs.',
    taches: [
      ['Lancer une demande de prix (RFQ)', 'achats-rfq', ['Achats › **Demandes de prix**, « Nouvelle RFQ ».', 'Fournisseur(s) + articles.', 'Saisir les prix reçus → alimente le catalogue.']],
      ['Suivre les avoirs fournisseurs', 'achats-avoirs', ['Achats › **Avoirs fournisseurs** : ce que fournisseurs et sous-traitants nous doivent (à ne pas confondre avec les avoirs clients, service Commercial).', 'Un avoir arrive tout seul quand la Qualité renvoie un lot, le met au rebut ou obtient une réfaction ; « Nouvel avoir » pour en saisir un à la main.', 'Quand l\'avoir du fournisseur arrive : **Reçu** (son n°, sa date, le montant réellement accordé). Quand on s\'en sert : **Imputer** (montant + n° de facture).', 'Un avoir ne se supprime pas : il s\'annule, avec un motif, tant qu\'il n\'a pas servi.']],
      ['Transformer une DA en BC', 'achats-da', ['Onglet **Demandes d\'achat**, sélectionner la DA.', 'Générer le bon de commande fournisseur.']],
    ] },
  { role: 'production', label: 'Programmation production', rw: ['production'], r: ['be', 'achats', 'oas', 'qualité', 'sécurité', 'expéditions', 'stock', 'maintenance'],
    mission: 'Planifier la fabrication et suivre l\'avancement des BDT/BDS.',
    taches: [
      ['Affecter un BDT à un opérateur', 'production-service', ['**/production/service** → onglet **Planning Gantt BDT** (planning unique).', 'Glisser une carte de « **BDT à classer** » (au-dessus du planning) sur le poste, ou sur la sous-case **Matin / Ap-m / Soir** de l\'opérateur.', 'Un clic sur un BDT n\'affiche que **son poste + l\'étape d\'avant et d\'après** ; « Tout afficher » lève le focus.', 'Les BDT prioritaires (BDTP) sont encadrés en rouge.']],
      ['Suivre les commandes à faire', 'production-service', ['Onglet **Commandes & Lots** : commandes → lots → BDT.']],
    ] },
  { role: 'operateur', label: 'Opérateur atelier', rw: [], r: ['production', 'oas', 'qualité', 'expéditions'],
    mission: 'Réaliser les opérations de fabrication et tracer son travail (pointage + soldage BDT au PIN).',
    taches: [
      ['Pointer (borne atelier)', 'rh-pointage', ['Sur la **borne partagée** : saisir matricule + PIN.', 'Pointer l\'entrée / la sortie.']],
      ['Prendre et solder un BDT', 'production-service', ['Repérer son BDT sur le planning.', 'Au démarrage : passer le BDT en **Reçu**.', 'À la fin : **Solder** → temps réel + **son PIN** (signature). Un écart peut déclencher une NC.']],
      ['Signaler une non-conformité', 'qualite-nc', ['Prévenir la Qualité (ou depuis l\'écran production).', 'Décrire le défaut, la pièce, le lot.']],
    ] },
  { role: 'oas', label: 'Opérateur OAS (traitement de surface)', rw: ['oas'], r: ['be', 'production', 'qualité', 'sécurité', 'stock', 'maintenance'],
    mission: 'Conduire les traitements de surface et tracer les relevés.',
    taches: [
      ['Saisir un relevé de bain', 'oas', ['OAS › **Relevés périodiques bains**.', 'Sélectionner le bain, saisir les valeurs.', 'Hors tolérance → une NC est créée automatiquement.']],
      ['Suivre les lots en balancelle', 'oas', ['Onglet **Lots & Balancelles**.']],
    ] },
  { role: 'qualite', label: 'Qualiticien(ne)', rw: ['qualité', 'sécurité'], r: ['be', 'production', 'oas', 'expéditions', 'stock', 'maintenance'],
    mission: 'Assurer la conformité produit et la traçabilité (NC, 8D, libération, retours clients).',
    taches: [
      ['Déclarer une non-conformité', 'qualite-nc', ['Qualité › **Non-Conformités**, « Nouvelle NC ».', 'Type, détecteur, gravité, lot/réf, catégorie, entité.', 'Une NC bloquante bloque les BL du lot.']],
      ['Traiter un retour client', 'qualite-nc', ['Sur une NC **client**, cliquer **Retour**.', 'Facture/affaire, lot, nb pièces, prix de vente / coût de revient.', 'Choisir : Refuser · Avoir · Commande prioritaire.']],
      ['Décider d\'un lot reçu non conforme', 'qualite-quarantaine', ['Qualité › **Quarantaine** : un lot refusé au contrôle réception porte le bouton rouge **Décider** (les lots de production gardent « Statuer »).', 'Trois choix : **renvoyer** tout le lot au fournisseur · **dérogation** (il entre en stock en l\'état, réfaction possible) · **entrée partielle** (la part acceptée entre, le reste repart ou part au rebut).', 'Renvoi et entrée partielle : choisir **avoir** (il part aux Achats) ou **remplacement** (le fournisseur relivre).', 'Le **motif est obligatoire** et la décision ne se prend qu\'une fois. Matière renvoyée sans remplacement = il faut repasser commande.']],
      ['Ouvrir un 8D', 'qualite-8d', ['Onglet **Rapports 8D**, dérouler D1→D8.']],
    ] },
  { role: 'logistique', label: 'Logistique (expéditions & stock)', rw: ['expéditions', 'stock'], r: ['commercial', 'achats', 'production'],
    mission: 'Livrer les commandes et tenir les stocks.',
    taches: [
      ['Créer un bon de livraison', 'expeditions', ['Expéditions › **Bons de Livraison**, sélectionner la commande.', 'Quantités expédiées (BL partiel possible).', '⚠ Bloqué si quarantaine/NC : voir Qualité. Validation → facture.']],
      ['Expédier un retour fournisseur', 'expeditions-envois', ['Expéditions › **Envois**, carte **Retours fournisseurs** : les lots que la Qualité a décidé de renvoyer.', 'Préparer le colis, puis **Expédié** ; la référence du bon de retour ou le n° de suivi est facultative.', 'La ligne quitte alors la liste ; un second clic est refusé.']],
      ['Suivre les alertes de stock', 'stock-rt', ['Stock › **Alertes et Réappro.** : articles sous le seuil.']],
    ] },
  { role: 'maintenance', label: 'Technicien(ne) maintenance', rw: ['maintenance'], r: ['achats', 'production', 'oas', 'sécurité', 'stock'],
    mission: 'Maintenir les équipements (curatif + préventif) et suivre la fiabilité.',
    taches: [
      ['Déclarer / clôturer une panne', 'maintenance', ['Maintenance › **Interventions**, « Nouvel OM ».', 'La machine passe en arrêt (rouge au planning et sur le plan).', 'À la clôture : machine opérationnelle.']],
      ['Consulter la fiche machine 360', 'maintenance', ['Onglet **Fiche 360** : TCO, heures, disponibilité/TRS.']],
    ] },
  { role: 'comptable', label: 'Comptable', rw: ['compta'], r: ['commercial', 'achats', 'expéditions', 'stock', 'rh'],
    mission: 'Tenir la comptabilité (facturation, grand livre, TVA, trésorerie).',
    taches: [
      ['Vérifier la facturation', 'compta', ['Compta › **Facturation** : factures générées à l\'expédition.']],
      ['Exporter le FEC', 'compta', ['Onglet **Grand Livre** → export FEC (réservé compta/direction).']],
    ] },
  { role: 'rh', label: 'Ressources Humaines', rw: ['rh'], r: ['production', 'sécurité', 'compta'],
    mission: 'Gérer le personnel, les accès (matricule+PIN), les habilitations et les temps.',
    taches: [
      ['Provisionner un salarié', 'rh-employes', ['RH › **Employés**, « Nouveau salarié ».', 'Matricule + rôle(s) (définit les droits) + PIN.', 'Le salarié peut se connecter et pointer.']],
      ['Suivre les habilitations', 'rh-employes', ['Onglet **Habilitations & Certifications** (partagé avec la Qualité).']],
    ] },
  { role: 'direction', label: 'Direction', rw: ['TOUS'], r: ['TOUS'],
    mission: 'Piloter l\'entreprise : validations, jalons, KPIs, budget.',
    taches: [
      ['Valider les jalons', 'direction', ['Direction › **À valider**.', 'Valider / Refuser chaque élément (réservé Direction).']],
      ['Lancer le scan d\'alertes', 'direction', ['Bouton **Scanner les alertes** → retards/impayés/NC/ruptures en file de validation.']],
    ] },
]

mkdirSync(OUT, { recursive: true })
let toc = `# Fiches de poste

Une fiche par **rôle** de l'ERP (droits RBAC). Chaque fiche est **imprimable (A4)** et **duplicable** pour former un nouvel arrivant. Les droits détaillés sont dans \`docs/technique/04-auth-rbac.md\`.

| Rôle | Fiche |
|---|---|
`
for (const x of R) toc += `| ${x.label} | [${x.role}.md](${x.role}.md) |\n`
writeFileSync(join(OUT, '00-index.md'), toc)

for (const x of R) {
  const md = `# Fiche de poste — ${x.label}

> Rôle ERP : \`${x.role}\`. Voir aussi le manuel utilisateur (\`docs/manuel/\`).

## Mission
${x.mission}

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | ${x.rw.length ? x.rw.join(', ') : '_aucun_ (lecture seule)'} |
| **Lecture** | ${x.r.join(', ') || '—'} |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
${x.taches.map((t, i) => `### ${i + 1}. ${t[0]}\n${t[2].map((s, j) => `${j + 1}. ${s}`).join('\n')}\n\n${img(t[1])}`).join('\n\n')}

---
> Fiche générée (\`scripts_doc/gen_fiches_poste.mjs\`). Sécurité & traçabilité : \`docs/technique/04-auth-rbac.md\`.
`
  writeFileSync(join(OUT, x.role + '.md'), md)
}
console.log('OK → docs/fiches-poste/ (' + R.length + ' fiches + index)')
