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
      ['Créer une nomenclature', 'be-noms', ['BE › **Nomenclatures**, « Nouvelle ».', 'Matière (réf → prix auto <3 mois) + masse (g).', 'Étapes (glisser-déposer) : type, poste, process, puis les temps en ‰h — ROP (réglage homme), RGM (réglage machine : homme + machine), MO (homme / pièce), Mach (machine / pièce). Heure homme = coût chargé RH moyen du site ; heure machine = taux du process (saisi en Production).', 'Prix de revient calculé → Enregistrer (indice A/B/C).']],
      ['Analyser une DT', 'be-analyse', ['Onglet **Analyse DT**, sélectionner la DT.', 'Générer le dossier technique → BDT.']],
    ] },
  { role: 'achats', label: 'Acheteur(se)', rw: ['achats', 'stock'], r: ['commercial', 'be', 'production', 'expéditions', 'maintenance'],
    mission: 'Consulter les fournisseurs, passer les commandes, tenir le référentiel fournisseurs.',
    taches: [
      ['Lancer une demande de prix (RFQ)', 'achats-rfq', ['Achats › **Demandes de prix**, « Nouvelle RFQ ».', 'Fournisseur(s) + articles.', 'Saisir les prix reçus → alimente le catalogue.']],
      ['Suivre les avoirs fournisseurs', 'achats-avoirs', ['Achats › **Avoirs fournisseurs** : ce que fournisseurs et sous-traitants nous doivent (à ne pas confondre avec les avoirs clients, service Commercial).', 'Un avoir arrive tout seul quand la Qualité renvoie un lot, le met au rebut ou obtient une réfaction ; « Nouvel avoir » pour en saisir un à la main.', 'Quand l\'avoir du fournisseur arrive : **Reçu** (son n°, sa date, le montant réellement accordé). Quand on s\'en sert : **Imputer** (montant + n° de facture).', 'Un avoir ne se supprime pas : il s\'annule, avec un motif, tant qu\'il n\'a pas servi.']],
      ['Transformer une DA en BC', 'achats-da', ['Onglet **Demandes d\'achat**, sélectionner la DA.', 'Générer le bon de commande fournisseur.', 'Si le fournisseur doit joindre un certificat matière : cocher **Certificat matière requis** (jamais cochée d\'avance).']],
      ['Dater un bon de commande de reliquat', 'achats-bc', ['Achats › **Bons de commande** : un BC **`…-R1`** avec la pastille « Reliquat de BC-… · date à valider » est né d\'un PV de réception (le fournisseur a annoncé un reliquat) — montant 0 € (porté par le BC d\'origine), sans date d\'arrivée.', 'Demander la date au fournisseur, puis **Date d\'arrivée** : le reliquat est validé et rejoint le calendrier des Expéditions.', 'Tant qu\'il n\'est pas daté, personne ne l\'attend (absent du calendrier).']],
      ['Exiger un certificat matière sur un BC', 'achats-bc', ['Achats › **Bons de commande**, colonne **Certificat matière** : **Exiger** ou **Retirer**, puis confirmer.', 'BC déjà envoyé : rééditer son PDF (la mention y est imprimée) et le renvoyer au fournisseur.', 'À la réception, le contrôleur confirme le certificat : sans lui, pas de PV conforme. Verrouillé (cadenas « PV conforme ») dès qu\'un PV de réception conforme est signé.']],
    ] },
  { role: 'production', label: 'Programmation production', rw: ['production'], r: ['be', 'achats', 'oas', 'qualité', 'sécurité', 'expéditions', 'stock', 'maintenance'],
    mission: 'Planifier la fabrication et suivre l\'avancement des BDT/BDS.',
    taches: [
      ['Affecter un BDT à un opérateur', 'production-service', ['**/production/service** → onglet **Planning Gantt BDT** (planning unique).', 'Glisser une carte de « **BDT à classer** » (au-dessus du planning) sur le poste, ou sur la sous-case **Matin / Journée / Après-midi / Soirée** de l\'opérateur. Le chemin critique s\'applique à la pose : l\'étape suivante d\'un lot ne démarre qu\'après le réglage de la précédente (calée le même jour, refusée un jour avant).', 'Un clic sur un BDT n\'affiche que **son poste + l\'étape d\'avant et d\'après** ; « Tout afficher » lève le focus.', 'Les BDT prioritaires (BDTP) sont encadrés en rouge.']],
      ['Recevoir et solder un BDT', 'form-production-soldage', ['**Recevoir** (double-clic sur la barre, matricule + PIN) : un opérateur ou vous-même (écriture Production). Celui qui reçoit devient le réalisateur du bon (« Reçu par ») : c\'est son coût horaire qui compte.', '**Solder** (clic droit → « Solder le BDT ») : l\'opérateur qui a reçu le bon, ou vous — vous pouvez solder le bon reçu par un opérateur (le PV d\'autocontrôle note « reçu par X, soldé par Y »).', 'La matrice de compétences ne bloque plus : une notification orange invite seulement à la mettre à jour (RH › Compétences).']],
      ['Faire une demande d\'achat depuis l\'atelier', 'form-production-da', ['Bandeau du service → **Demande d\'achat** : le formulaire complet s\'ouvre tout de suite.', 'Matricule + PIN, nature (Matière / Accessoire / Machine (OPEX) avec la machine), article, quantité et unité, puis affaire, poste, priorité, livraison souhaitée, fournisseur suggéré.', '**Envoyer aux Achats** → la DA arrive à votre nom « (Production) ». Un opérateur sans écriture Production ne peut plus en faire : il vous la fait saisir.']],
      ['Émettre un PV de non-conformité', 'form-production-pvnc', ['Bandeau du service → bouton rouge **PV de non-conformité** (juste à côté de la demande d\'achat).', 'Matricule + PIN ; constat (date, type, **entité**, gravité) ; rattachement facultatif (affaire, puis lot et BDT de cette affaire) ; défaut (**description**, nature, cause, action immédiate, traitement) ; case quarantaine si besoin.', '**Émettre le PV** → la NC part dans Qualité › Non-Conformités (catégorie Production, à votre nom). Critique / Bloquante sur une affaire = expédition bloquée.']],
      ['Suivre les commandes à faire', 'production-service', ['Onglet **Commandes & Lots** : commandes → lots → BDT.']],
      ['Programmer la présence et traiter les congés des opérateurs', 'production-presence', ['Onglet **Présence opérateurs** : clic sur une case → menu **Matin / Journée / Après-midi / Soirée / Absent / Effacer** (un choix = un enregistrement ; en cas d’échec la case revient à sa valeur).', '« **Programmer la semaine** » pour appliquer un créneau à plusieurs opérateurs ; le message compte les échecs. Une semaine pas encore lue est verrouillée.', 'Vue « Demandes de congés à traiter » : **Approuver** ou refuser les congés des **opérateurs** (absences posées, BDT renvoyés au pool, solde décompté) — jamais votre propre congé.']],
      ['Découper un BDT ou annuler une découpe', 'form-production-separer', ['Goulotte « BDT à classer » → **ciseaux** : seule la **réalisation** se découpe, le réglage reste sur le morceau 1.', 'Sur la carte d’un morceau : **Annuler la découpe** (tant qu’aucun morceau n’est posé, reçu ou soldé) → le BDT d’origine retrouve sa durée.']],
      ['Saisir le taux horaire machine d\'un process', 'form-production-process-edit', ['Onglet **Process Ateliers** → volet **Postes & Process** → déplier le poste : chaque process affiche « X €/h », « taux à saisir » ou « coût RH ».', 'Crayon du process → **Type** (Machine / Manuel / OAS) → **Taux horaire machine (€/h HT)** → Enregistrer. Vide = « taux à saisir » (temps machine compté 0 €).', 'Seul le process machine porte un taux : ni la machine ni le poste. Le temps homme est valorisé au coût chargé RH (fiche salarié). Taux de départ = ancien coût de la machine, souvent 35 €/h : à vérifier.']],
    ] },
  { role: 'operateur', label: 'Opérateur atelier', rw: [], r: ['production', 'oas', 'qualité', 'expéditions'],
    mission: 'Réaliser les opérations de fabrication et tracer son travail (pointage + soldage BDT au PIN).',
    taches: [
      ['Pointer (borne atelier)', 'rh-pointage', ['Sur la **borne partagée** : saisir matricule + PIN.', 'Pointer l\'entrée / la sortie.']],
      ['Prendre et solder un BDT', 'form-production-soldage', ['Repérer son BDT sur le planning.', 'Au démarrage : double-clic sur la barre → **Reçu** avec **son** matricule + PIN (c\'est vous qui réalisez le bon).', 'À la fin : **Solder** → heure de fin + **son PIN** (signature). Vous ne pouvez solder que le BDT que **vous** avez reçu ; sinon un chef d\'atelier (écriture Production) le solde. Un résultat « Non-conformité » crée une NC.']],
      ['Signaler une non-conformité ou un besoin d\'achat', 'form-production-pvnc', ['En fin d\'opération : résultat **Non-conformité** au soldage (NC créée pour la Qualité).', 'En dehors d\'un soldage : prévenir le chef d\'atelier, qui émet un **PV de non-conformité** ou une **demande d\'achat** depuis le bandeau de la Production — ces deux boutons sont réservés à l\'écriture Production (le rôle opérateur n\'y a pas accès).', 'Décrire le défaut, la pièce, le lot.']],
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
      ['Déclarer une non-conformité', 'qualite-nc', ['Qualité › **Non-Conformités**, « Nouvelle NC » (réservée à l\'écriture Qualité depuis le 15/09/2026).', 'Type, détecteur, gravité, lot/réf, catégorie, entité.', 'Une NC bloquante bloque les BL du lot ; une NC « Soldé » est close.', 'Les PV de non-conformité de l\'atelier arrivent seuls dans la liste (catégorie Production, statut Ouvert, détecteur = émetteur). ⚠ Ré-enregistrer une telle NC remplace le détecteur et le statut « quarantaine » : le nom de l\'émetteur reste dans la description.']],
      ['Traiter un retour client', 'qualite-nc', ['Sur une NC **client**, cliquer **Retour**.', 'Facture/affaire, lot, nb pièces, prix de vente / coût de revient.', 'Choisir : Refuser · Avoir · Commande prioritaire.']],
      ['Décider d\'un lot reçu non conforme', 'qualite-quarantaine', ['Qualité › **Quarantaine** : une ligne de réception avec observation (ou toute la réception si le certificat matière manque) porte le bouton rouge **Décider** (les lots de production gardent « Statuer »). Le PV crée **une NC fournisseur par ligne à problème** (quantitative, qualitative ou les deux, détecteur « Réception ») ; un simple écart de quantité n\'a pas de quarantaine.', 'Trois choix : **renvoyer** tout le lot au fournisseur · **dérogation** (accepté en l\'état, réfaction possible) · **entrée partielle** (la part acceptée est gardée, le reste repart ou part au rebut). Ce qui est accepté part dans **Stock › Rangement / Mise en stock** : le stock est crédité au rangement.', 'Lot sur **plusieurs articles** : remplir « Part acceptée par ligne du bon de commande » (pré-rempli en dérogation, obligatoire en entrée partielle).', 'Renvoi et entrée partielle : choisir **avoir** (il part aux Achats) ou **remplacement** (le fournisseur relivre).', 'Le **motif est obligatoire** et la décision ne se prend qu\'une fois. Matière renvoyée sans remplacement = il faut repasser commande.']],
      ['Ouvrir un 8D', 'qualite-8d', ['Onglet **Rapports 8D**, dérouler D1→D8.']],
      ['PV de réception fournisseur : qui le signe', 'form-expeditions-pv-non-conforme', ['Le PV d\'une livraison fournisseur se fait aux **Expéditions** (Réceptions › « PV à faire »), par un contrôleur choisi dans la liste des salariés ayant l\'**écriture sur les Expéditions**.', '⚠ Depuis le 14/09/2026, le rôle Qualité (lecture seule sur Expéditions) ne le signe plus. Si c\'est votre travail : faire cocher « Écrire » sur les Expéditions dans votre fiche (RH › Employés) **en gardant cochés Qualité, Sécurité…**, sinon vous les perdez.']],
    ] },
  { role: 'logistique', label: 'Logistique (expéditions & stock)', rw: ['expéditions', 'stock'], r: ['commercial', 'achats', 'production'],
    mission: 'Livrer les commandes et tenir les stocks.',
    taches: [
      ['Créer un bon de livraison', 'expeditions', ['Expéditions › **Bons de Livraison**, sélectionner la commande.', 'Quantités expédiées (BL partiel possible).', '⚠ Bloqué si quarantaine/NC : voir Qualité. Validation → facture.']],
      ['Réceptionner une commande fournisseur', 'form-expeditions-reception', ['Expéditions › **Calendrier**, bloc « à réceptionner aujourd\'hui » : **Traiter** sur la ligne du bon de commande.', 'Saisir le **N° de commande fournisseur** et le **N° de BL fournisseur** (obligatoires). Pas de quantité : c\'est le reste à recevoir du BC (sauf BC sans quantité). Plus de « Livraison partielle » : le reliquat se déclare au PV.', '**Réception hors France ?** Oui / Non. Si Oui : poids matière (kg), N° de nomenclature (douane), code EWX (1 ou 2), mode d\'arrivée.', 'Valider : la réception passe dans l\'onglet **Réceptions** (« PV à faire »). Faute de frappe → lien **Corriger**.']],
      ['Faire le PV de contrôle à réception', 'form-expeditions-pv', ['Expéditions › **Réceptions**, bouton **PV à faire**.', 'Choisir **Conforme** ou **Non conforme** et le **contrôleur** (personnes ayant l\'écriture Expéditions). BC exigeant un certificat matière : cocher « Certificat matière reçu et conforme » — sans elle, pas de conforme.', 'Pour **chaque ligne** : **Qté reçue** (pré-remplie avec la prévue), case **Reliquat** si le fournisseur annonce le reste, **observation** si un défaut est constaté. « Conforme ? » se calcule (quantitatif / qualitatif).', 'Effets : quantités conformes → **Stock › Mise en stock** ; une **NC par ligne en écart** ; ligne avec observation → quarantaine ; **excédent** → Direction ; reliquat → **BC de reliquat** aux Achats.']],
      ['Ranger une entrée en stock', 'form-stock-rangement', ['Stock › **Rangement / Mise en stock**, liste **À ranger** : bouton **Accepter l\'entrée en stock**.', 'Confirmer le **type d\'objet** ; emplacement verrouillé si la référence en a un, sinon choisir la **zone** (elle devient l\'emplacement fixe) ou créer « Nouvelle zone pour ce type ».', '**Ranger en stock** : le stock est crédité ; la matière d\'une affaire est disponible pour les BDT quand tout est rangé.', 'Inventaire : sous-onglet **Ajustement de stock** (quantité constatée + motif). Zones : **Types & zones**. Emplacement fixe à changer : Gestion du stock › **Niveaux d\'approvisionnement** (historisé).']],
      ['Expédier un retour fournisseur', 'expeditions-envois', ['Expéditions › **Envois**, carte **Retours fournisseurs** : les lots que la Qualité a décidé de renvoyer.', 'Préparer le colis, puis **Expédié** ; la référence du bon de retour ou le n° de suivi est facultative.', 'La ligne quitte alors la liste ; un second clic est refusé.']],
      ['Suivre les alertes de stock', 'stock-rt', ['Stock › **Alertes et Réappro.** : articles sous le seuil.', 'Stock en temps réel : « Masquer les produits vides » est cochée par défaut (mémorisée sur le poste).']],
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
      ['Décider d\'un excédent de réception', 'form-direction-refus-excedent', ['Direction › **À valider**, ligne Expéditions « Excédent de réception » (+N reçu au-delà du prévu).', '**Accepter** : l\'excédent part dans Stock › Mise en stock. **Refuser** (motif obligatoire) : rien en stock, retour à expédier aux Expéditions.', 'Ligne aussi en quarantaine : accepter seulement après la décision de la Qualité.']],
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
