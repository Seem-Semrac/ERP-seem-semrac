// ══════════════════════════════════════════════════════════════
// GÉNÉRATEUR des fiches modules → docs/technique/06-modules/<service>.md
// Source : inventaire ci-dessous (sidebar, onglets, RBAC, tables, fichiers).
// À mettre à jour quand un service gagne/perd un onglet (cf. erp-doc-sync).
// NON DESTRUCTIF (2026-08-18) : seuls les blocs <!-- auto:<cle> --> ... <!-- /auto -->
//   sont regeneres ; tout ce qui est ecrit autour est PRESERVE. Auparavant le script
//   reecrivait la fiche entiere et a efface des enrichissements (Expeditions, Securite).
// Usage : node scripts_doc/gen_module_fiches.mjs [--verifier] [--adopter]
//   --verifier : n'ecrit rien, signale ce qui changerait (utile en pre-commit)
//   --adopter  : migration, pose les balises sur les sections encore identiques au manifeste
// ══════════════════════════════════════════════════════════════
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'technique', '06-modules')

const M = [
  { svc:'commercial', label:'Commercial', route:'/commercial/service', file:'src/commercial.tsx', rw:'commercial', r:'be, production, qualité, expéditions, stock',
    mission:'Relation client, demandes de travaux, offres, commandes, avoirs & commandes prioritaires.',
    tabs:[['site','Demandes site internet'],['dt','DT / Demande travaux'],['offre','Offre (PRC1-D5)'],['avoirs','Avoirs & Commandes P'],['clients','Liste clients'],['cmd','Commandes validées'],['dashboard','Dashboard']],
    api:['clients','dt','offre','commandes','commande','commandes-p','interlocuteurs','credit(s)'], tables:['clients','demandes_travaux','offres','commandes','commandes_prioritaires','credits','interlocuteurs','demandes_site'],
    notes:'Avoir = prix de vente × pièces (AV-AAAA-XX) ; Commande P = coût de revient (CMDP-AAAA-XX) → « Lancer la production ». DT sans NADCAP/AS9100 ; datalists réf/plan/client.' },
  { svc:'be', label:'Bureau d\'Études', route:'/be/service', file:'src/be.tsx', rw:'be, achats', r:'commercial, production, oas, qualité, sécurité, stock, maintenance',
    mission:'Nomenclatures (BOM), analyse des DT, préparation technique, références.',
    tabs:[['noms','Nomenclatures'],['analyse','Analyse DT'],['prep','Préparations tech.'],['refs','Références'],['dashboard','Dashboard BE']],
    api:['be','nomenclature','produits-fournisseurs','ref-prix','produit-prix'], tables:['nomenclatures','fournitures_nomenclature','etapes_production','be_refs','ref_prix_historique','produits_fournisseurs'],
    notes:'Masse en g ; temps en millièmes d\'heure ; réglage = coût FIXE/lot ; prix matière auto <3 mois sinon RFQ ; indices A/B/C ; drag-drop des process.' },
  { svc:'achats', label:'Achats', route:'/achats/service', file:'src/achats.tsx', rw:'achats, stock', r:'commercial, be, production, expéditions, maintenance',
    mission:'Demandes de prix (RFQ), demandes d\'achat, bons de commande, fournisseurs & sous-traitants.',
    tabs:[['rfq','Demandes de prix'],['da','Demandes d\'achat'],['fourn','Fournisseurs / ST'],['scorecard','Scorecard'],['dashboard','Dashboard achats']],
    api:['achats','da','bc','fournisseur(s)','sous-traitant(s)','demandes-prix','catalogue-fournisseurs'], tables:['fournisseurs','sous_traitants','demandes_prix','demandes_achat','bons_commande','factures_fournisseur'],
    notes:'RFQ = source de vérité des prix → catalogue. BC n\'écrit jamais le prix. Scorecard fournisseur/ST.' },
  { svc:'production', label:'Production', route:'/production/service', file:'src/prod.tsx', rw:'production', r:'be, achats, oas, qualité, sécurité, expéditions, stock, maintenance',
    mission:'Planning Gantt BDT/BST, présence opérateurs, commandes & lots, process ateliers.',
    tabs:[['gantt-bdt','Planning Gantt BDT'],['gantt-bst','Planning Gantt BST'],['presence','Présence opérateurs'],['commandes','Commandes & Lots'],['machines','Process Ateliers'],['dash-prog','Dashboard Programmation'],['dash-prod','Dashboard Production']],
    api:['production','bdt','bds','planning','process','machine(s)','presence','sortie-matiere'], tables:['commandes','lots','bons_de_travail','bons_sous_traitance','machines','shifts','absences','presences','affectations_poste','process_atelier'],
    notes:'Planning unique dans /production/service : file « BDT à classer » et « BDS à planifier » AU-DESSUS de chaque Gantt ; clic sur un BDT/BDS = focus étape (son poste/sous-traitant + étape précédente et suivante). BDT/BDS prioritaires (id BDTP/BDSP) encadrés rouge.' },
  { svc:'oas', label:'OAS', route:'/oas/service', file:'src/oas.tsx', rw:'oas', r:'be, production, qualité, sécurité, stock, maintenance',
    mission:'Traitement de surface : lots & balancelles, relevés eau, relevés périodiques des bains.',
    tabs:[['0','Lots & Balancelles'],['1','Relevé consommation eau'],['2','Relevés périodiques bains'],['3','Dashboard OAS']],
    api:['oas','balancelle(s)','releve(s)'], tables:['(relevés eau/bains, balancelles)'],
    notes:'Process « OAS » = porte de lot (soldage BDT précédent → OAS → BDT suivant). Un bain non conforme génère une NC.' },
  { svc:'qualite', label:'Qualité', route:'/qualite/service', file:'src/qualite.tsx', rw:'qualité, sécurité', r:'be, production, oas, expéditions, stock, maintenance',
    mission:'Contrôle, non-conformités, 8D, libération de lots, capabilité, dérogations, périssables.',
    tabs:[['pv','PV de Contrôle'],['nc','Non-Conformités'],['8d','Rapports 8D'],['liberation','Libération Lots'],['plan-controle','Plan de contrôle'],['audit','Audit Conformité'],['capabilite','Étude de capabilité'],['ecme','Contrôle des ECME'],['perissables','Produits Périssables'],['derogations','Dérogations'],['referentiels','Référentiels'],['dashboard','Dashboard Qualité']],
    api:['qualite','controles','non-conformites','rapports-8d','quarantaine'], tables:['non_conformites','pv_controles','quarantaines','rapports_8d','derogations','plans_controle','controles_cotes','ecme','produits_perissables'],
    notes:'NC « client » → bouton « Retour » → avoir / commande P. Porte qualité : BL bloqués (409) si quarantaine/NC bloquante. Capabilité via écart réduit → Cp/Cpk.' },
  { svc:'securite', label:'Sécurité (HSE/RSE)', route:'/securite/service', file:'src/securite.tsx', rw:'qualité (+ sécurité via qualité)', r:'be, production, oas, maintenance, RH',
    mission:'DUER, accidents, EPI, risque chimique (FDS), environnement, ATEX, VGP, formations, RSE, conformité.',
    tabs:[['duer','DUER / Risques'],['evenements','Événements'],['epi','EPI'],['chimie','Chimie / FDS'],['environnement','Environnement'],['controles','Contrôles & prévention'],['conformite','Conformité'],['referentiels','Référentiels'],['dashboard','Tableau de bord']],
    api:['securite'], tables:['hse_risques','hse_incidents','hse_epi*','hse_produits_chimiques','hse_atex_zones','hse_verifications','hse_formations','hse_conformite','hse_mesures_env','hse_dechets','hse_rse'],
    notes:'Onglet Conformité & Audit : MÊME organisation que la Qualité — une seule barre (Programme · Constats · Grilles · Référentiels · Veille), rendue par panelAudit({domaine: securite, nu:true, extras:[veille]}) ; planning annuel COMMUN avec la Qualité, filtré ISO 45001. 14 tables hse_*. Matrice EPI × zone éditable. Export FDS PDF par produit. CRUD générique hseCrud. Interop ATEX/VGP avec le plan bâtiment.' },
  { svc:'expeditions', label:'Expéditions', route:'/expeditions/service', file:'src/expeditions.tsx', rw:'expéditions, stock (logistique)', r:'commercial, achats, production',
    mission:'Bons de commande, bons de livraison, commandes en cours, OTD.',
    tabs:[['bc','Bons de Commande'],['bl','Bons de Livraison'],['commandes','Commandes en cours'],['dashboard','Dashboard']],
    api:['bl','bst','expeditions'], tables:['bons_de_livraison','factures_client'],
    notes:'BL partiels → factures_client + écriture VTE. BL bloqué si porte qualité active.' },
  { svc:'stock', label:'Stocks', route:'/stock/service', file:'src/stock_service.tsx', rw:'stock (achats, logistique)', r:'—',
    mission:'Stock temps réel, gestion, mouvements, alertes & réapprovisionnement.',
    tabs:[['rt','Stock en temps réel'],['gestion','Gestion du stock'],['mvts','Mouvements'],['alertes','Alertes et Réappro.'],['dashboard','Dashboard']],
    api:['stock(s)','mouvement(s)','article(s)'], tables:['stock','mouvements_stock'],
    notes:'⚠ table `stock` (singulier). Sortie matière consomme le stock et alimente l\'OPEX machine.' },
  { svc:'maintenance', label:'Maintenance', route:'/maintenance/service', file:'src/maintenance_service.tsx', rw:'maintenance', r:'achats, production, oas, sécurité, stock',
    mission:'GMAO : interventions/OM, plan préventif, MTBF, fiche machine 360, pièces détachées.',
    tabs:[['interventions','Interventions / OM'],['preventif','Plan Préventif'],['mtbf','MTBF & Historique'],['fiche','Fiche 360'],['pieces','Pièces & PDR'],['dashboard','Dashboard']],
    api:['om','maintenance','piece(s)'], tables:['ordres_maintenance','plans_preventif','pieces_detachees','machines'],
    notes:'Fiche Machine 360 (TCO + heures via gamme + Disponibilité/TRS). Préventif → OM. Deep-link depuis le plan bâtiment (#machine=<id>).' },
  { svc:'plans', label:'Plan / Bâtiment', route:'/plans/service', file:'src/plans.tsx', rw:'BE, production, maintenance, qualité, direction', r:'tout connecté',
    mission:'Maquette « BIM » : zones (rectangles) + objets (machines, périssables, chimie, ATEX, extincteurs) reliés à la base, états live.',
    tabs:[['plan','Maquette']],
    api:['plans','marqueurs'], tables:['plans_batiment','plan_marqueurs','documents (GED)'],
    notes:'Zones = rectangles dessinables, objets = pins rangés dedans (classement par zone). Couleurs d\'état live. Deep-links vers fiches. Auto-placement.' },
  { svc:'rh', label:'RH', route:'/rh/service', file:'src/rh_service.tsx', rw:'rh', r:'production, sécurité, compta',
    mission:'Employés, habilitations & certifications, matrice compétences, organigramme, temps, pointage.',
    tabs:[['/rh/employes','Employés'],['/rh/habilitations','Habilitations & Certifications'],['/rh/competences','Matrice Compétences'],['/rh/organigramme','Organigramme'],['/rh/temps','Gestion des Temps'],['/rh/service','Dashboard']],
    api:['rh','salarie(s)','competence(s)','certification(s)','conge(s)','pointage'], tables:['salaries','habilitations','certifications','conges','pointages','formations'],
    notes:'Navigation par pages (pas de serviceHeader). Habilitations partagées RH+Qualité. Pointage = borne self-service (matricule+PIN). Congés → absences planning.' },
  { svc:'compta', label:'Comptabilité', route:'/compta/service', file:'src/compta_service.tsx + src/finances.tsx', rw:'compta (comptable)', r:'—',
    mission:'Facturation, grand livre, TVA & déclarations, balance & trésorerie, coûts & marges.',
    tabs:[['0','Facturation'],['1','Grand Livre'],['2','TVA & Déclarations'],['3','Balance & Trésorerie'],['4','Dashboard']],
    api:['factures','factures-fournisseur','ecritures','compta'], tables:['factures_client','factures_fournisseur','ecritures'],
    notes:'Écritures format FEC (export /api/compta/export-fec, réservé compta/direction). Marge brute + base 100. Pages /finances/* (taux, coûts) réservées compta.' },
  { svc:'direction', label:'Direction', route:'/direction/service', file:'src/direction_service.tsx', rw:'ALL (perm all)', r:'ALL',
    mission:'Cockpit : à valider, jalons critiques, par affaire, pilotage KPIs, budget, santé des données.',
    tabs:[['avalider','À valider'],['jalons','Jalons critiques'],['affaire','Par affaire'],['pilotage','Pilotage'],['budget','Budget'],['sante','Santé des données']],
    api:['direction','validations','kpi-objectifs'], tables:['validations','kpi_objectifs','affaires'],
    notes:'File de validation générique (décision réservée Direction). Moteur d\'alertes → validations (scan-alertes). Santé des données (DICT). Fiches 360.' },
]

mkdirSync(OUT, { recursive: true })

const VERIF = process.argv.includes('--verifier')     // n'écrit rien : signale ce qui changerait
const ADOPTER = process.argv.includes('--adopter')    // migration : pose les balises sur les sections intactes

// ─── Fusion NON DESTRUCTIVE ───────────────────────────────────
// Chaque bloc issu du manifeste est encadré par <!-- auto:<clé> --> … <!-- /auto -->.
// Seul l'intérieur de ces balises est régénéré : tout ce qui est écrit autour
// (sous-sections, gotchas, migrations) survit à toutes les régénérations.
const OUVRE = (cle) => '<!-- auto:' + cle + ' -->'
const FERME = '<!-- /auto -->'
const bloc = (cle, contenu) => OUVRE(cle) + '\n' + contenu + '\n' + FERME
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const reBloc = (cle) => new RegExp(escRe(OUVRE(cle)) + '[\\s\\S]*?' + escRe(FERME))

// Remplace l'intérieur de la balise si elle existe ; sinon laisse le texte intact.
function fusionner(texte, cle, contenu) {
  const re = reBloc(cle)
  if (!re.test(texte)) return { texte, baliseTrouvee: false }
  return { texte: texte.replace(re, bloc(cle, contenu)), baliseTrouvee: true }
}

// ─── Migration (--adopter) ────────────────────────────────────
// Une section dont le contenu est EXACTEMENT celui du manifeste n'a pas été retouchée :
// on peut l'encadrer sans rien perdre. Une section enrichie est laissée telle quelle
// (elle sort alors du périmètre du générateur, et c'est signalé à chaque exécution).
const SECTIONS = {
  mission: '## Mission',
  onglets: '## Onglets',
  api: '## API (familles de routes)',
  tables: '## Tables principales',
  notes: "## Points d'attention",
}
function adopter(texte, blocs) {
  let out = texte
  const poses = [], gardees = []
  // En-tête : les deux puces Route / Accès qui suivent le titre du fichier.
  if (!reBloc('entete').test(out)) {
    const lignes = out.split('\n')
    const iR = lignes.findIndex(l => l.startsWith('- **Route** :'))
    if (iR >= 0 && (lignes[iR + 1] || '').startsWith('- **Accès (RBAC)** :')) {
      const actuel = lignes.slice(iR, iR + 2).join('\n').trim()
      if (actuel === blocs.entete.trim()) {
        lignes.splice(iR, 2, bloc('entete', blocs.entete))
        out = lignes.join('\n')
        poses.push('entete')
      } else gardees.push('entete')
    }
  }
  // Sections « ## » : contenu entre le titre et la section (ou le séparateur) suivant.
  for (const [cle, titre] of Object.entries(SECTIONS)) {
    if (reBloc(cle).test(out)) continue
    const mt = out.match(new RegExp('^' + escRe(titre) + '[ \\t]*$', 'm'))
    if (!mt) continue
    const debut = mt.index + mt[0].length + 1
    const reste = out.slice(debut)
    const fin = reste.search(/^(##\s|---\s*$|> )/m)
    const corps = fin < 0 ? reste : reste.slice(0, fin)
    if (corps.trim() === String(blocs[cle]).trim()) {
      out = out.slice(0, debut) + bloc(cle, blocs[cle]) + '\n' + (fin < 0 ? '' : reste.slice(fin))
      poses.push(cle)
    } else gardees.push(cle)
  }
  return { out, poses, gardees }
}

let index = '# Fiches modules\n\nUne fiche par service. Régénérées par `node scripts_doc/gen_module_fiches.mjs`.\n\n'
  + '> Les fiches sont **fusionnées, pas écrasées** : seuls les blocs `<!-- auto:… -->` sont régénérés.\n'
  + "> Tout ce qui est écrit en dehors de ces blocs (sous-sections, gotchas, migrations) est conservé.\n\n"
  + '| Service | Fiche |\n|---|---|\n'

let creees = 0, majs = 0, inchangees = 0
const horsPerimetre = []

for (const m of M) {
  const dest = join(OUT, m.svc + '.md')
  const blocs = {
    entete: '- **Route** : `' + m.route + '` · **Fichier source** : `' + m.file + '`\n'
          + '- **Accès (RBAC)** : écriture — ' + m.rw + ' · lecture — ' + m.r,
    mission: m.mission,
    onglets: m.tabs.map(t => '- `' + t[0] + '` — ' + t[1]).join('\n'),
    api: m.api.map(a => '`' + a + '`').join(' · '),
    tables: m.tables.map(t => '`' + t + '`').join(' · '),
    notes: m.notes,
  }

  if (!existsSync(dest)) {
    const md = '# Module ' + m.label + '\n\n'
      + bloc('entete', blocs.entete) + '\n\n'
      + '## Mission\n' + bloc('mission', blocs.mission) + '\n\n'
      + '## Onglets\n' + bloc('onglets', blocs.onglets) + '\n\n'
      + '## API (familles de routes)\n' + bloc('api', blocs.api) + '\n\n'
      + '## Tables principales\n' + bloc('tables', blocs.tables) + '\n\n'
      + "## Points d'attention\n" + bloc('notes', blocs.notes) + '\n\n'
      + '---\n> Fiche générée (blocs `auto:` seulement — le reste est écrit à la main et conservé). '
      + 'Manuel utilisateur : `docs/manuel/' + m.svc + '.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.\n'
    if (!VERIF) writeFileSync(dest, md)
    console.log('  CREEE    ' + m.svc + '.md')
    creees++
    index += '| ' + m.label + ' | [' + m.svc + '.md](' + m.svc + '.md) |\n'
    continue
  }

  // CRLF -> LF : les fiches éditées sous Windows sont en CRLF ; sans normalisation
  // les titres de section ne seraient pas reconnus par la migration.
  const avant = readFileSync(dest, 'utf8').replace(/\r\n/g, '\n')
  let texte = avant

  if (ADOPTER) {
    const a = adopter(texte, blocs)
    texte = a.out
    if (a.poses.length) console.log('  ADOPTEE  ' + m.svc + '.md → balises posées : ' + a.poses.join(', '))
    if (a.gardees.length) console.log('  GARDEE   ' + m.svc + '.md → enrichie, laissée telle quelle : ' + a.gardees.join(', '))
  }

  const sansBalise = []
  for (const [cle, contenu] of Object.entries(blocs)) {
    const r = fusionner(texte, cle, contenu)
    texte = r.texte
    if (!r.baliseTrouvee) sansBalise.push(cle)
  }
  if (sansBalise.length) horsPerimetre.push({ svc: m.svc, cles: sansBalise })

  if (texte !== avant) {
    if (!VERIF) writeFileSync(dest, texte)
    const regeneres = Object.keys(blocs).filter(k => !sansBalise.includes(k))
    console.log('  MAJ      ' + m.svc + '.md' + (regeneres.length ? ' (blocs régénérés : ' + regeneres.join(', ') + ')' : ''))
    majs++
  } else inchangees++

  index += '| ' + m.label + ' | [' + m.svc + '.md](' + m.svc + '.md) |\n'
}

if (!VERIF) writeFileSync(join(OUT, '00-index.md'), index)

console.log((VERIF ? '[VERIFICATION] ' : '') + 'Fiches : ' + creees + ' créée(s) · ' + majs + ' mise(s) à jour · ' + inchangees + ' inchangée(s) → docs/technique/06-modules/')
if (horsPerimetre.length) {
  console.log('\nSections SANS balise auto (écrites à la main → PRÉSERVÉES, jamais régénérées) :')
  for (const d of horsPerimetre) console.log('   · ' + d.svc + '.md → ' + d.cles.join(', '))
  console.log("   Si le manifeste change pour ces sections, reportez-le à la main —")
  console.log('   ou encadrez la section par <!-- auto:<clé> --> … <!-- /auto --> pour la rendre régénérable.')
}
if (VERIF && (creees || majs)) process.exitCode = 1
