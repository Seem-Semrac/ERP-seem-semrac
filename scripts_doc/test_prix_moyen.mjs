// ══════════════════════════════════════════════════════════════════════════════
// TESTS UNITAIRES — prix moyen multi-fournisseurs (src/prix_moyen.ts) et journal
// EN 9100 des fournitures (src/nomenclature_journal.ts). Lot H1, 17/09/2026.
//
//   node scripts_doc/test_prix_moyen.mjs
//
// Aucune dépendance à installer, aucune base : le script transpile les modules avec
// esbuild (déjà utilisé par scripts_doc/harness_all_pages.mjs) et exécute des cas purs.
//
// Il vérifie TROIS choses :
//   1. le calcul (cas de la spec H1 §3 : 1 fournisseur, conditionnements 100 et 50,
//      fournisseur sans prix, sans conditionnement, prix périmé, casse / espaces /
//      accents, aucun prix, matière avec nb par tôle, doublons normalisés) ;
//   2. l'ÉGALITÉ serveur ↔ navigateur : le texte JS rendu par `prixMoyenClientJs()`
//      est évalué ici et doit donner EXACTEMENT les mêmes résultats — y compris
//      depuis un bundle MINIFIÉ, comme celui déployé sur Cloudflare (c'est le piège
//      de Function.prototype.toString : les noms internes y sont réécrits) ;
//   3. le journal EN 9100 : bascule ancien modèle → nouveau tracée en UNE entrée
//      « recalcul » (et pas « 100 → 0 »), réordonnancement muet, doublons appariés.
// Sortie : une ligne PASS/FAIL par cas, code retour ≠ 0 si au moins un FAIL.
// ══════════════════════════════════════════════════════════════════════════════
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src').replace(/\\/g, '/')

let pass = 0, fail = 0
const ok = (nom, cond, detail) => {
  if (cond) { pass++; console.log('PASS  ' + nom) }
  else { fail++; console.log('FAIL  ' + nom + (detail ? '\n        ' + detail : '')) }
}
const egal = (nom, obtenu, attendu) => {
  const a = JSON.stringify(obtenu), b = JSON.stringify(attendu)
  ok(nom, a === b, 'obtenu  : ' + a + '\n        attendu : ' + b)
}
const proche = (nom, obtenu, attendu, eps = 1e-9) =>
  ok(nom, Math.abs(Number(obtenu) - Number(attendu)) < eps, 'obtenu ' + obtenu + ' ≠ attendu ' + attendu)

// ── Bundles (normal + minifié) ────────────────────────────────────────────────
const workdir = join(tmpdir(), 'erp-test-prix-moyen')
mkdirSync(workdir, { recursive: true })
const entry = join(workdir, 'entry.mts')
writeFileSync(entry, [
  `export * from '${SRC}/prix_moyen'`,
  `export { diffFournitures } from '${SRC}/nomenclature_journal'`,
  `export { PRIX_VALIDITE_JOURS } from '${SRC}/shared'`,
].join('\n'))

const esbuild = await import('esbuild')
async function bundle(minify) {
  const out = join(workdir, minify ? 'bundle.min.mjs' : 'bundle.mjs')
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, minify, logLevel: 'error', absWorkingDir: ROOT })
  return import(pathToFileURL(out).href + '?t=' + Date.now())
}

// ── Jeux d'essai ──────────────────────────────────────────────────────────────
const MAINTENANT = Date.parse('2026-09-17T12:00:00Z')
const JOUR = 86400000
const iso = (j) => new Date(MAINTENANT - j * JOUR).toISOString().slice(0, 10)
const FRAIS = iso(10), PERIME = iso(400)

// Accessoire « VIS-M6 » : A = paquet de 100 à 12 € (0,12 €/pce), B = paquet de 50 à 8 € (0,16 €/pce)
const CATALOGUE = [
  { fournisseur_id: 'A', fournisseur_nom: 'FOURN A', reference: 'VIS-M6', designation: 'Vis M6 inox', prix: 12, qte_paquet: 100, date_prix: FRAIS, categorie: 'accessoire' },
  { fournisseur_id: 'B', fournisseur_nom: 'FOURN B', reference: ' vis-m6 ', designation: 'VIS M6 INOX', prix: 8, qte_paquet: 50, date_prix: FRAIS, categorie: 'accessoire' },
  { fournisseur_id: 'C', fournisseur_nom: 'FOURN C', reference: 'VIS-M6', designation: 'Vis M6', prix: null, qte_paquet: 25, date_prix: null, categorie: 'accessoire' },
  { fournisseur_id: 'D', fournisseur_nom: 'FOURN D', reference: 'TÔLE-2000', designation: 'Tôle acier 2000x1000', prix: 100, date_prix: FRAIS, categorie: 'matiere_premiere' },
  { fournisseur_id: 'E', fournisseur_nom: 'FOURN E', reference: 'tole-2000', designation: 'Tole acier 2000x1000', prix: 140, date_prix: PERIME, categorie: 'matiere_premiere' },
  { fournisseur_id: 'F', fournisseur_nom: 'FOURN F', reference: 'ECROU-M6', designation: 'Écrou M6', prix: 5, date_prix: FRAIS, categorie: 'accessoire' },
  { fournisseur_id: 'G', fournisseur_nom: 'FOURN G', reference: 'JOINT-9', designation: 'Joint 9 mm', prix: null, date_prix: null, categorie: 'accessoire' },
]
const OPTS = { validiteJours: 183, maintenant: MAINTENANT }

// Journal : la même fourniture, à l'ancien modèle puis au nouveau
const ANCIENNE = { id: '1', nomenclature_id: 'N', categorie: 'accessoire', type_fourniture: 'accessoire', ref_stock: '136290', designation: 'Vis', quantite_par_piece: 2, prix_unitaire: 10.4, prix_total_par_piece: 0.208, fournisseur: 'BOSSARD', qte_paquet: 100, nb_par_tole: null }
const NOUVELLE = { id: '2', nomenclature_id: 'N', categorie: 'accessoire', type_fourniture: 'accessoire', ref_stock: '136290', designation: 'Vis', quantite_par_piece: 2, prix_unitaire: 0.104, prix_total_par_piece: 0.208, fournisseur: null, qte_paquet: null, nb_par_tole: null }

// ── Suite de tests, jouée sur le module ET sur sa copie « navigateur » ─────────
function suitePrix(M, ctx) {
  const p = (ref, cat, opts) => M.prixMoyenReference(CATALOGUE, ref, cat, Object.assign({}, OPTS, opts || {}))

  // Normalisation
  egal(ctx + ' · normalisation (accents, casse, espaces multiples)',
    [M.normaliserReference('  TÔLE   2000 '), M.normaliserReference('tole 2000'), M.normaliserReference(null)],
    ['tole 2000', 'tole 2000', ''])
  ok(ctx + ' · normalisation : « 126 001 » ≠ « 126001 »', M.normaliserReference('126 001') !== M.normaliserReference('126001'))

  // Accessoire : 2 fournisseurs, conditionnements 100 et 50 → (0,12 + 0,16) / 2 = 0,14 €/pièce
  const vis = p('VIS-M6', 'accessoire')
  proche(ctx + ' · accessoire, 2 fournisseurs (paquets 100 et 50) → 0,14 €/pièce', vis.prix_unitaire, 0.14)
  egal(ctx + ' · accessoire : 2 fournisseurs comptés (celui sans prix est ignoré)', vis.nb_fournisseurs, 2)
  egal(ctx + ' · accessoire : fourchette min–max', [vis.min, vis.max], [0.12, 0.16])
  egal(ctx + ' · accessoire : ni périmé ni incomplet', [vis.perime, vis.incomplet, vis.sans_conditionnement], [false, false, []])
  egal(ctx + ' · accessoire : détail trié par prix croissant',
    vis.detail.map((d) => [d.fournisseur_id, d.prix_catalogue, d.qte_paquet, d.prix_converti]),
    [['A', 12, 100, 0.12], ['B', 8, 50, 0.16]])
  egal(ctx + ' · casse et espaces : « VIS-M6 » et « vis-m6 » = la même référence', vis.reference_normalisee, 'vis-m6')

  // Un seul fournisseur
  const un = p('ECROU-M6', 'accessoire')
  egal(ctx + ' · 1 seul fournisseur : moyenne = son prix, min = max', [un.nb_fournisseurs, un.prix_unitaire, un.min, un.max], [1, 5, 5, 5])
  egal(ctx + ' · sans conditionnement : compté 1 ET signalé', [un.sans_conditionnement, un.detail[0].sans_conditionnement], [['FOURN F'], true])

  // Aucun prix
  const rien = p('JOINT-9', 'accessoire')
  egal(ctx + ' · aucun prix → incomplet, prix 0, 0 fournisseur', [rien.incomplet, rien.prix_unitaire, rien.nb_fournisseurs, rien.perime], [true, 0, 0, false])
  const inconnue = p('REF-INCONNUE', 'accessoire')
  egal(ctx + ' · référence absente du catalogue → incomplet', [inconnue.incomplet, inconnue.nb_fournisseurs], [true, 0])

  // Matière : moyenne des prix de tôle, puis division par le nb de pièces par tôle
  const tole = p('  tôle-2000  ', 'matiere', { nbParTole: 4 })
  proche(ctx + ' · matière : prix tôle moyen (100 et 140) = 120 €', tole.prix_base, 120)
  proche(ctx + ' · matière : 4 pièces par tôle → 30 €/pièce', tole.prix_unitaire, 30)
  egal(ctx + ' · matière : prix de plus de 183 j dans la moyenne → périmé signalé', tole.perime, true)
  egal(ctx + ' · matière : accents ignorés (TÔLE-2000 = tole-2000), 2 fournisseurs', tole.nb_fournisseurs, 2)
  egal(ctx + ' · matière : pas de liste « sans conditionnement » (la qté/paquet ne concerne que les accessoires)', tole.sans_conditionnement, [])
  const toleSansPc = p('TÔLE-2000', 'matiere')
  egal(ctx + ' · matière sans nb par tôle : prix/pièce 0, prix tôle conservé', [toleSansPc.prix_unitaire, toleSansPc.prix_tole], [0, 120])
  // 4e argument positionnel = nb par tôle (signature de la spec)
  proche(ctx + ' · matière : 4e argument positionnel accepté', M.prixMoyenReference(CATALOGUE, 'TÔLE-2000', 'matiere', 4).prix_base, 120)

  // Catégorie : une référence d'accessoire n'est pas chiffrée comme matière
  egal(ctx + ' · catégorie respectée (VIS-M6 cherchée en matière → incomplet)', p('VIS-M6', 'matiere').incomplet, true)

  // Péremption au jour près
  const bord = [{ fournisseur_id: 'X', fournisseur_nom: 'X', reference: 'R', prix: 10, qte_paquet: 1, date_prix: iso(182), categorie: 'accessoire' }]
  const bord2 = [{ fournisseur_id: 'X', fournisseur_nom: 'X', reference: 'R', prix: 10, qte_paquet: 1, date_prix: iso(184), categorie: 'accessoire' }]
  egal(ctx + ' · seuil de 183 jours : 182 j frais, 184 j périmé',
    [M.prixMoyenReference(bord, 'R', 'accessoire', OPTS).perime, M.prixMoyenReference(bord2, 'R', 'accessoire', OPTS).perime], [false, true])
  egal(ctx + ' · prix sans date = périmé (jamais « frais » par défaut)',
    M.prixMoyenReference([{ fournisseur_id: 'X', reference: 'R', prix: 10, qte_paquet: 1, categorie: 'accessoire' }], 'R', 'accessoire', OPTS).perime, true)

  // Repli sur l'ancien libellé texte « conditionnement » (cloud sans cloud-13)
  const sansColonne = [{ fournisseur_id: 'A', fournisseur_nom: 'A', reference: 'R', prix: 20, conditionnement: '10', date_prix: FRAIS, categorie: 'accessoire' }]
  proche(ctx + ' · cloud sans cloud-13 : repli sur le libellé « conditionnement » numérique', M.prixMoyenReference(sansColonne, 'R', 'accessoire', OPTS).prix_unitaire, 2)
  const libelleTexte = [{ fournisseur_id: 'A', fournisseur_nom: 'A', reference: 'R', prix: 20, conditionnement: 'boîte', date_prix: FRAIS, categorie: 'accessoire' }]
  egal(ctx + ' · libellé non numérique → conditionnement non déclaré, compté 1',
    [M.prixMoyenReference(libelleTexte, 'R', 'accessoire', OPTS).prix_unitaire, M.prixMoyenReference(libelleTexte, 'R', 'accessoire', OPTS).sans_conditionnement], [20, ['A']])

  // ── Relecture 17/09/2026 : cas trouvés à la revue ────────────────────────────
  // (a) Deux lignes catalogue pour le MÊME fournisseur (l'index ux_produits_fournisseurs_ref_norm
  //     n'a pas pu être créé sur une base qui portait déjà des doublons) : c'est la plus RÉCEMMENT
  //     chiffrée qui compte, pas la première rencontrée (ordre des id, arbitraire).
  const memeF = [
    { fournisseur_id: 'F1', fournisseur_nom: 'F1', reference: 'R1', prix: 100, qte_paquet: 1, date_prix: iso(400), categorie: 'accessoire' },
    { fournisseur_id: 'F1', fournisseur_nom: 'F1', reference: 'r1', prix: 1, qte_paquet: 1, date_prix: iso(10), categorie: 'accessoire' },
  ]
  const dbl1 = M.prixMoyenReference(memeF, 'R1', 'accessoire', OPTS)
  egal(ctx + ' · doublon catalogue chez le même fournisseur : le prix le plus récent l\'emporte',
    [dbl1.prix_unitaire, dbl1.nb_fournisseurs, dbl1.perime], [1, 1, false])
  egal(ctx + ' · doublon catalogue : l\'ordre de lecture ne change pas le résultat',
    M.prixMoyenReference(memeF.slice().reverse(), 'R1', 'accessoire', OPTS).prix_unitaire, 1)

  // (b) Le repli sur l'ancien libellé texte « conditionnement » n'invente plus un nombre de pièces
  //     à partir d'une masse, d'une longueur ou d'un libellé quelconque commençant par un nombre.
  const libelles = ['25 pieces', '25 kg', '6 m', '500 g', '100 mm', '25', ' 25 ', '25,5', 'boîte', '25 pièces']
  egal(ctx + ' · conditionnement texte : seul un NOMBRE (de pièces) est accepté',
    libelles.map((c) => M.qtePaquetDe({ conditionnement: c })), [25, null, null, null, null, 25, 25, 25.5, null, 25])
  const kg = [{ fournisseur_id: 'A', fournisseur_nom: 'A', reference: 'R', prix: 10, conditionnement: '25 kg', date_prix: FRAIS, categorie: 'accessoire' }]
  egal(ctx + ' · « 25 kg » ne divise PLUS le prix : compté à la pièce ET signalé',
    [M.prixMoyenReference(kg, 'R', 'accessoire', OPTS).prix_unitaire, M.prixMoyenReference(kg, 'R', 'accessoire', OPTS).sans_conditionnement], [10, ['A']])

  // (c) Clés venues des données = noms de propriétés d'Object.prototype : ni exception, ni ligne perdue.
  const piegeux = [
    { fournisseur_id: 'constructor', fournisseur_nom: 'A', reference: 'constructor', prix: 10, qte_paquet: 1, date_prix: FRAIS, categorie: 'accessoire' },
    { fournisseur_id: '__proto__', fournisseur_nom: 'B', reference: 'constructor', prix: 20, qte_paquet: 1, date_prix: FRAIS, categorie: 'accessoire' },
  ]
  egal(ctx + ' · références/fournisseurs « constructor » et « __proto__ » : les 2 lignes comptent',
    [M.prixMoyenReference(piegeux, 'constructor', 'accessoire', OPTS).nb_fournisseurs, M.prixMoyenReference(piegeux, 'constructor', 'accessoire', OPTS).prix_unitaire], [2, 15])
  egal(ctx + ' · recherche sur une référence « constructor » : aucune exception',
    M.chercherReferences(piegeux, '', 'accessoire', 0).map((o) => [o.reference_normalisee, o.nb_fournisseurs]), [['constructor', 2]])
  egal(ctx + ' · doublons sur « __proto__ » / « constructor » : aucune exception',
    M.doublonsFournitures([{ ref_stock: '__proto__' }, { ref_stock: '__PROTO__' }, { ref_stock: 'constructor' }, { ref_stock: 'CONSTRUCTOR' }]).map((g) => [g.cle, g.indices]),
    [['__proto__', [0, 1]], ['constructor', [2, 3]]])

  // (d) Moyenne CONNUE mais NON convertible en prix par pièce (fiche importée, jamais rouverte au
  //     BE) : la copie enregistrée est conservée ENTIÈRE — sinon `prix_total_par_piece` tombait à 0
  //     et `computeNomCostForQty`, qui retombe précisément dessus, chiffrait la ligne à 0 €.
  const sansNpt = M.recalculerFournitures(
    [{ categorie: 'matiere', ref_stock: 'TÔLE-2000', nb_par_tole: null, prix_unitaire: 81, prix_total_par_piece: 8.1 }], CATALOGUE, OPTS)
  egal(ctx + ' · matière sans nb par tôle : copie enregistrée conservée (jamais 0)',
    [sansNpt.fournitures[0].prix_unitaire, sansNpt.fournitures[0].prix_total_par_piece, sansNpt.non_convertibles], [81, 8.1, ['TÔLE-2000']])
  const sansQpp = M.recalculerFournitures(
    [{ categorie: 'accessoire', ref_stock: 'VIS-M6', quantite_par_piece: null, qte_paquet: 100, prix_unitaire: 12, prix_total_par_piece: 0.24 }], CATALOGUE, OPTS)
  egal(ctx + ' · accessoire sans nb par pièce : copie et conditionnement conservés',
    [sansQpp.fournitures[0].prix_unitaire, sansQpp.fournitures[0].prix_total_par_piece, sansQpp.fournitures[0].qte_paquet], [12, 0.24, 100])

  // Recherche « réf — désignation », tous fournisseurs
  egal(ctx + ' · recherche par désignation (accents et casse ignorés)',
    M.chercherReferences(CATALOGUE, 'tole acier', 'matiere').map((o) => [o.reference_normalisee, o.nb_fournisseurs]),
    [['tole-2000', 2]])
  egal(ctx + ' · recherche par fragment de référence',
    M.chercherReferences(CATALOGUE, 'm6', 'accessoire').map((o) => o.reference_normalisee), ['ecrou-m6', 'vis-m6'])
  egal(ctx + ' · liste complète d\'un compartiment, dédoublonnée',
    M.optionsReferences(CATALOGUE, 'accessoire').map((o) => o.reference_normalisee), ['ecrou-m6', 'joint-9', 'vis-m6'])

  // Doublons de fournitures (tous compartiments confondus)
  const lignes = [
    { categorie: 'matiere', ref_stock: 'TÔLE-2000', designation: 'Tôle' },
    { categorie: 'accessoire', ref_stock: ' tole-2000 ', designation: 'Tole' },
    { categorie: 'accessoire', ref_stock: 'VIS-M6', designation: 'Vis' },
    { categorie: 'accessoire', ref_stock: '', designation: 'Colle spéciale' },
    { categorie: 'accessoire', ref_stock: '', designation: 'COLLE  SPECIALE' },
  ]
  const d = M.doublonsFournitures(lignes)
  egal(ctx + ' · doublons : réf normalisée identique dans deux compartiments + désignation répétée',
    d.map((g) => [g.cle, g.cle_sur, g.indices]),
    [['tole-2000', 'reference', [0, 1]], ['colle speciale', 'designation', [3, 4]]])
  egal(ctx + ' · aucun doublon sur une liste saine', M.doublonsFournitures([lignes[0], lignes[2]]), [])
  ok(ctx + ' · message de doublon lisible', /Doublon/.test(M.messageDoublonFourniture(M.premierDoublonFourniture(lignes))))

  // Recalcul en direct des fournitures enregistrées (analyse DT)
  const r = M.recalculerFournitures([
    { categorie: 'matiere', ref_stock: 'TÔLE-2000', nb_par_tole: 4, quantite_par_piece: 0.25, prix_unitaire: 1, prix_total_par_piece: 1 },
    Object.assign({}, ANCIENNE, { ref_stock: 'VIS-M6' }),
    { categorie: 'accessoire', ref_stock: 'JOINT-9', quantite_par_piece: 1, prix_unitaire: 7, prix_total_par_piece: 7 },
  ], CATALOGUE, OPTS)
  proche(ctx + ' · recalcul matière : prix_unitaire = prix tôle moyen', r.fournitures[0].prix_unitaire, 120)
  proche(ctx + ' · recalcul matière : prix par pièce = 120 / 4', r.fournitures[0].prix_total_par_piece, 30)
  proche(ctx + ' · recalcul accessoire : prix_unitaire = prix moyen à la pièce', r.fournitures[1].prix_unitaire, 0.14)
  proche(ctx + ' · recalcul accessoire : 2 par pièce → 0,28 €', r.fournitures[1].prix_total_par_piece, 0.28)
  egal(ctx + ' · recalcul : qte_paquet neutralisée (coût linéaire, pas d\'arrondi au paquet)', r.fournitures[1].qte_paquet, null)
  egal(ctx + ' · recalcul : référence sans prix → copie enregistrée conservée et signalée',
    [r.fournitures[2].prix_unitaire, r.incompletes], [7, ['JOINT-9']])
  egal(ctx + ' · recalcul : références à prix périmé signalées', r.perimees, ['TÔLE-2000'])
}

// ── Journal EN 9100 ───────────────────────────────────────────────────────────
function suiteJournal(M, ctx) {
  const ch = M.diffFournitures([ANCIENNE], [NOUVELLE])
  const parasites = ch.filter((c) => /qte_paquet|fournisseur/.test(c.champ))
  egal(ctx + ' · bascule : aucun « qte_paquet 100 → 0 » ni « fournisseur → ∅ » parasite', parasites, [])
  const bascule = ch.filter((c) => /passage au prix moyen/.test(c.champ))
  egal(ctx + ' · bascule : UNE entrée « recalcul » lisible',
    bascule.map((c) => [c.bloc, c.avant, c.apres]),
    [['recalcul', { fournisseur: 'BOSSARD', 'qté par paquet': 100 }, null]])
  const prix = ch.filter((c) => /prix_unitaire/.test(c.champ))
  egal(ctx + ' · bascule : le prix unitaire reste tracé, en « recalcul »', prix.map((c) => [c.bloc, c.avant, c.apres]), [['recalcul', 10.4, 0.104]])
  ok(ctx + ' · bascule : aucun changement classé « fourniture » (ce n\'est pas une saisie)', ch.every((c) => c.bloc === 'recalcul'), JSON.stringify(ch))

  // Une qté/paquet réellement modifiée reste une saisie
  const modif = M.diffFournitures([ANCIENNE], [Object.assign({}, ANCIENNE, { id: '3', qte_paquet: 50 })])
  egal(ctx + ' · qté/paquet modifiée (fournisseur conservé) = saisie, bloc « fourniture »',
    modif.map((c) => [c.bloc, c.champ.replace(/^.* · /, ''), c.avant, c.apres]), [['fourniture', 'qte_paquet', 100, 50]])

  // Réordonnancement : aucun changement
  const a1 = { categorie: 'matiere', ref_stock: 'T1', designation: 'Tôle 1', prix_unitaire: 10 }
  const a2 = { categorie: 'accessoire', ref_stock: 'A1', designation: 'Vis', prix_unitaire: 1 }
  egal(ctx + ' · réordonnancement des fournitures : aucun changement', M.diffFournitures([a1, a2], [a2, a1]), [])
  egal(ctx + ' · référence ré-écrite avec une autre casse : aucun changement',
    M.diffFournitures([a1], [Object.assign({}, a1, { ref_stock: ' t1 ' })]), [])

  // Doublon : deux lignes de même clé appariées dans l'ordre
  const dbl = M.diffFournitures([a2, a2], [a2])
  egal(ctx + ' · doublon retiré : une seule fourniture « retirée »',
    dbl.map((c) => [c.bloc, c.champ]), [['fourniture', 'fourniture retirée']])
  const dbl2 = M.diffFournitures([a2], [a2, Object.assign({}, a2, { prix_unitaire: 2 })])
  egal(ctx + ' · doublon ajouté : une seule fourniture « ajoutée »',
    dbl2.map((c) => [c.bloc, c.champ]), [['fourniture', 'fourniture ajoutée']])

  // Ajout / retrait ordinaires
  egal(ctx + ' · fourniture ajoutée', M.diffFournitures([], [a1]).map((c) => [c.bloc, c.champ, c.apres]), [['fourniture', 'fourniture ajoutée', 'T1']])
}

// ── Exécution : module direct, module minifié, et copie « navigateur » des deux ─
for (const minify of [false, true]) {
  const M = await bundle(minify)
  const ctx = minify ? 'bundle minifié' : 'module'
  suitePrix(M, ctx + ' (serveur)')
  suiteJournal(M, ctx)

  // Seuil unique : sans option, le module doit se replier sur EXACTEMENT la constante de shared.ts
  // (le module est volontairement sans import — c'est ce test qui tient les deux valeurs ensemble).
  const V = M.PRIX_VALIDITE_JOURS
  egal(ctx + ' · seuil par défaut du module = PRIX_VALIDITE_JOURS de shared.ts (' + V + ' j)',
    [M.prixPerime(iso(V - 1), null, MAINTENANT), M.prixPerime(iso(V + 1), null, MAINTENANT)], [false, true])

  // Copie navigateur : évaluée telle qu'elle sera injectée dans la page
  const js = M.prixMoyenClientJs()
  ok(ctx + ' · client : le texte injecté ne referme jamais le <script>', js.indexOf('</') < 0)
  let CLIENT
  try {
    CLIENT = new Function(js + '\nreturn {' + M.PRIX_MOYEN_NOMS_CLIENT.join(', ') + '};')()
  } catch (e) {
    fail++
    console.log('FAIL  ' + ctx + ' · client : le texte injecté ne s\'évalue pas — ' + (e && e.message))
    continue
  }
  const manquants = M.PRIX_MOYEN_NOMS_CLIENT.filter((n) => typeof CLIENT[n] !== 'function')
  egal(ctx + ' · client : toutes les fonctions du contrat sont définies', manquants, [])
  suitePrix(CLIENT, ctx + ' (client)')

  // Égalité stricte serveur ↔ client sur les cas clés (JSON identique, pas seulement « proche »)
  const cas = [
    ['VIS-M6', 'accessoire', { nbParTole: null }],
    ['  tôle-2000 ', 'matiere', { nbParTole: 4 }],
    ['ECROU-M6', 'accessoire', {}],
    ['JOINT-9', 'accessoire', {}],
  ]
  for (const [ref, cat, o] of cas) {
    const opts = Object.assign({}, OPTS, o)
    egal(ctx + ' · serveur = client pour « ' + ref.trim() + ' » (' + cat + ')',
      CLIENT.prixMoyenReference(CATALOGUE, ref, cat, opts), M.prixMoyenReference(CATALOGUE, ref, cat, opts))
  }
  egal(ctx + ' · serveur = client sur la recherche', CLIENT.chercherReferences(CATALOGUE, 'm6', 'accessoire'), M.chercherReferences(CATALOGUE, 'm6', 'accessoire'))
}

rmSync(workdir, { recursive: true, force: true })
console.log('\n' + pass + ' PASS · ' + fail + ' FAIL')
process.exitCode = fail ? 1 : 0
