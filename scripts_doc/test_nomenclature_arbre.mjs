// ══════════════════════════════════════════════════════════════════════════════
// TESTS UNITAIRES — arbre des nomenclatures mères et des sous-lots (src/nomenclature_arbre.ts)
// et journal EN 9100 des composants (diffComposants, src/nomenclature_journal.ts). Lot H2, 18/09/2026.
//
//   node scripts_doc/test_nomenclature_arbre.mjs
//
// Aucune dépendance à installer, aucune base : le script transpile les modules avec esbuild
// (déjà utilisé par scripts_doc/harness_all_pages.mjs et test_prix_moyen.mjs) et exécute des cas purs.
//
// Couvre (contrat H2 §7 et §13) :
//   1. lecture des composants : tableau / chaîne JSON / objet, ordre par rang complet ou partiel,
//      éléments vides écartés, qté normalisée, entrée jamais modifiée ; normalisation d'écriture ;
//      déplacement ▲▼ (bornes) ;
//   2. contrôles d'enregistrement : cycle direct (A ⊃ A), indirect (A ⊃ B ⊃ A), via une ancienne
//      révision, via la révision de PRODUCTION ; profondeur 5 acceptée / 6 refusée, y compris par les
//      ancêtres ; composant introuvable ignoré ; composants en chaîne JSON ;
//   3. production : arbre à 3 niveaux, quantités cumulées (3 × 0,5 → 2 ; 3 × 2 → 6 ; 10 × 0,3 → 3),
//      ordre conservé, composant non validé / introuvable, révision différente, cycle et profondeur
//      coupés ; plan de lots (ids, pré-ordre) ; idempotence des ids (réutilisation, collision après
//      réordonnancement, deux occurrences de la même fille, base sans colonnes) ;
//   4. ids : estSousLot / lotParentDeId / racineDuLot / niveauDuLot sur racines, sous-lots et ids
//      exotiques ; bonIdDuLot = fmtBonId pour une racine ; cleBon racine inchangée ; tris ;
//   5. avancement : lotFini / vigilanceSousLots avec BDS reçus, BDT « reçu » (commencé), ops annulées,
//      lot annulé, sous-lot connu seulement par ses bons ; vueArbreLot ;
//   6. journal : permutation seule = 1 entrée, ajout / retrait, quantité, doublons appariés, ancien
//      format sans rang (aucune entrée « fiche »), chaîne JSON, intégration dans diffNomenclature ;
//   7. correctifs de la relecture H2 : cycle via une révision EN COURS, revisionsRetenues, fiche lot
//      (composant non validé nommé, bouton seulement s'il crée, lot clos / terminé, cloud-14 absent),
//      planCompletementLot (un sous-lot existant garde la révision de son lancement), statuts clos.
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

// ── Bundle ────────────────────────────────────────────────────────────────────
const workdir = join(tmpdir(), 'erp-test-nomenclature-arbre')
mkdirSync(workdir, { recursive: true })
const entry = join(workdir, 'entry.mts')
writeFileSync(entry, [
  `export * from '${SRC}/nomenclature_arbre'`,
  `export { diffComposants, diffNomenclature } from '${SRC}/nomenclature_journal'`,
].join('\n'))
const esbuild = await import('esbuild')
const out = join(workdir, 'bundle.mjs')
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error', absWorkingDir: ROOT })
const M = await import(pathToFileURL(out).href + '?t=' + Date.now())

// ── Fabriques de jeux d'essai ─────────────────────────────────────────────────
// N(id, code, { indice, statut, groupe, composants, created_at }) : une nomenclature ; mère si composants.
const N = (id, code, o = {}) => ({
  id, num_nom: o.num_nom || code, code_ref_produit: code, indice: o.indice || 'A', statut: o.statut || 'valide',
  type_nom: o.composants ? 'mere' : (o.type_nom || 'standard'), version_groupe: o.groupe || id,
  composants: o.composants || [], created_at: o.created_at || '2026-09-01', etapes_production: [],
})
// C(nom, qte, extra) : un composant tel que l'enregistre le BE
const C = (n, qte = 1, extra = {}) => ({ nom_id: n.id, code: n.code_ref_produit, num_nom: n.num_nom, qte, ...extra })

// ══ 1. Composants : lecture, écriture, déplacement ═══════════════════════════
{
  const liste = [{ nom_id: '1', code: 'A', num_nom: 'A', qte: 2 }, { nom_id: '2', code: 'B', num_nom: 'B', qte: 1 }]
  const attendu = [['A', 1, 2], ['B', 2, 1]]
  const vue = (l) => l.map((c) => [c.code, c.rang, c.qte])
  egal('lecture : tableau (ordre du tableau, rangs 1..n)', vue(M.composantsOrdonnes(liste)), attendu)
  egal('lecture : chaîne JSON (colonne text Docker)', vue(M.composantsOrdonnes(JSON.stringify(liste))), attendu)
  egal('lecture : objet { composants } (une nomenclature)', vue(M.composantsOrdonnes({ composants: liste })), attendu)
  egal('lecture : objet sans clé composants → []', M.composantsOrdonnes({ id: 'x' }), [])
  egal('lecture : chaîne vide / JSON invalide / null → []', [M.composantsOrdonnes(''), M.composantsOrdonnes('{pas du json'), M.composantsOrdonnes(null)], [[], [], []])

  const parRang = [{ nom_id: '2', code: 'B', rang: 2 }, { nom_id: '3', code: 'C', rang: 3 }, { nom_id: '1', code: 'A', rang: 1 }]
  egal('ordre : rang COMPLET et distinct → tri par rang', M.composantsOrdonnes(parRang).map((c) => c.code), ['A', 'B', 'C'])
  const partiel = [{ nom_id: '2', code: 'B', rang: 2 }, { nom_id: '1', code: 'A' }]
  egal('ordre : rang PARTIEL → ordre du tableau, rangs réécrits', vue(M.composantsOrdonnes(partiel)).map((x) => [x[0], x[1]]), [['B', 1], ['A', 2]])
  const doublon = [{ nom_id: '2', code: 'B', rang: 1 }, { nom_id: '1', code: 'A', rang: 1 }]
  egal('ordre : rangs en double → ordre du tableau', M.composantsOrdonnes(doublon).map((c) => c.code), ['B', 'A'])
  const nonEntier = [{ nom_id: '2', code: 'B', rang: 1.5 }, { nom_id: '1', code: 'A', rang: 1 }]
  egal('ordre : rang non entier → ordre du tableau', M.composantsOrdonnes(nonEntier).map((c) => c.code), ['B', 'A'])
  egal('ordre : rangs en texte « 2 », « 1 » acceptés', M.composantsOrdonnes([{ code: 'B', rang: '2' }, { code: 'A', rang: '1' }]).map((c) => c.code), ['A', 'B'])

  const sales = [null, 'x', 3, [], {}, { qte: 2 }, { nom_id: '  ', code: '' }, { num_nom: 'SEUL-NUM' }, { code: 'OK', qte: 'abc' }, { nom_id: '9', qte: -2 }, { code: 'V', qte: '0,5' }, { code: 'Z', qte: 0 }]
  const lu = M.composantsOrdonnes(sales)
  egal('lecture : éléments qui ne désignent rien écartés (num_nom seul conservé)', lu.map((c) => c.code || c.num_nom || c.nom_id), ['SEUL-NUM', 'OK', '9', 'V', 'Z'])
  egal('lecture : qté invalide / négative / nulle → 1, « 0,5 » → 0,5', lu.map((c) => c.qte), [1, 1, 1, 0.5, 1])

  const origine = [{ nom_id: '1', code: ' A ', qte: '2', rang: 7, _tmp: 1 }]
  const copie = JSON.stringify(origine)
  const l1 = M.composantsOrdonnes(origine)
  ok('lecture : l\'entrée n\'est jamais modifiée', JSON.stringify(origine) === copie)
  egal('lecture : code nettoyé, qté numérique, rang réécrit, clés conservées', [l1[0].code, l1[0].qte, l1[0].rang, l1[0]._tmp], ['A', 2, 1, 1])

  const n = M.normaliserComposants([{ nom_id: 1, code: 'A', num_nom: 'A', qte: '3', type_nom: 'mère', indice: ' b ', prix: '12.5', _ui: true, note: 'x' }, { nom_id: '2', code: 'B', type_nom: 'mere', prix: 'n/a' }])
  egal('écriture : champs nettoyés, type invalide retiré, prix texte → nombre, « _… » retiré, clé inconnue gardée',
    n, [{ nom_id: '1', code: 'A', num_nom: 'A', qte: 3, rang: 1, indice: 'b', prix: 12.5, note: 'x' }, { nom_id: '2', code: 'B', num_nom: '', qte: 1, rang: 2, type_nom: 'mere' }])
  egal('écriture : chaîne JSON acceptée', M.normaliserComposants(JSON.stringify([{ nom_id: '1', code: 'A' }])).map((c) => [c.code, c.rang]), [['A', 1]])

  const trois = M.normaliserComposants([{ nom_id: '1', code: 'A' }, { nom_id: '2', code: 'B' }, { nom_id: '3', code: 'C' }])
  const d = (de, vers) => M.deplacerComposant(trois, de, vers).map((c) => c.code + c.rang).join(' ')
  egal('déplacer : 0 → 2', d(0, 2), 'B1 C2 A3')
  egal('déplacer : 2 → 0 (▲▲)', d(2, 0), 'C1 A2 B3')
  egal('déplacer : 1 → 0 (▲)', d(1, 0), 'B1 A2 C3')
  egal('déplacer : hors bornes (-1, 3, 1.5) → copie inchangée', [d(-1, 0), d(0, 3), d(1.5, 0)], ['A1 B2 C3', 'A1 B2 C3', 'A1 B2 C3'])
  ok('déplacer : la liste d\'origine n\'est pas modifiée', trois.map((c) => c.code).join('') === 'ABC' && M.deplacerComposant(trois, 0, 2) !== trois)
  egal('déplacer : liste vide / non tableau', [M.deplacerComposant([], 0, 0), M.deplacerComposant(null, 0, 1)], [[], []])
}

// ══ 2. Contrôles à l'enregistrement ═════════════════════════════════════════
{
  egal('clé nomenclature : code produit, à défaut n°, minuscules', [M.cleNomenclature({ code_ref_produit: ' PF-1 ', num_nom: 'X' }), M.cleNomenclature({ code_ref_produit: '  ', num_nom: 'Num-2' }), M.cleNomenclature(null)], ['pf-1', 'num-2', ''])
  egal('clé composant : code, à défaut n°', [M.cleComposant({ code: 'PF-1', num_nom: 'X' }), M.cleComposant({ num_nom: 'N' }), M.cleComposant({})], ['pf-1', 'n', ''])

  // Cycle direct : A se contient lui-même
  const A = N('a1', 'A', { composants: [] })
  const ficheA = { ...A, composants: [C(A)] }
  const e1 = M.controlerComposants(ficheA, [A])
  egal('cycle direct A ⊃ A → cycle_composants, chemin A › A', [e1 && e1.code, e1 && e1.chemin], ['cycle_composants', ['A', 'A']])
  ok('cycle direct : message du contrat (« ne peut pas se contenir elle-même », « Retirez « A » »)', !!e1 && /ne peut pas se contenir elle-même\. Chemin : A › A\. Retirez « A » des composants\./.test(e1.message), e1 && e1.message)

  // Cycle indirect : B ⊃ A en base ; on enregistre A ⊃ B
  const S = N('s1', 'S')
  const B = N('b1', 'B', { composants: [C(A), C(S)] })
  const e2 = M.controlerComposants({ ...A, composants: [C(B)] }, [A, B, S])
  egal('cycle indirect A ⊃ B ⊃ A → chemin A › B › A', [e2 && e2.code, e2 && e2.chemin], ['cycle_composants', ['A', 'B', 'A']])
  ok('cycle indirect : on demande de retirer « B »', !!e2 && e2.message.includes('Retirez « B » des composants'))
  egal('composants en chaîne JSON : même refus', M.controlerComposants({ ...A, composants: JSON.stringify([C(B)]) }, [A, B, S])?.chemin, ['A', 'B', 'A'])

  // Cycle via une ANCIENNE révision : B ⊃ A (révision a1, ind. A) ; on enregistre la révision a2 (ind. B) avec B.
  const A2 = N('a2', 'A', { indice: 'B', statut: 'en_cours', groupe: 'a1', composants: [] })
  const e3 = M.controlerComposants({ ...A2, composants: [C(B)] }, [A, A2, B, S])
  egal('cycle via une ancienne révision (identité = code, pas id)', [e3 && e3.code, e3 && e3.chemin], ['cycle_composants', ['A', 'B', 'A']])

  // Cycle que seule la PRODUCTION verrait : M ind. A (validée, vide) ; M ind. B (validée) ⊃ F.
  // F choisit M par la révision ind. A → pas de cycle à l'édition, mais la production prend ind. B.
  const F = N('f1', 'F')
  const Ma = N('ma', 'M', { indice: 'A', groupe: 'ma', type_nom: 'mere', composants: [] })
  const Mb = N('mb', 'M', { indice: 'B', groupe: 'ma', composants: [C(F)] })
  Ma.type_nom = 'mere'
  const e4 = M.controlerComposants({ ...F, type_nom: 'mere', composants: [C(Ma)] }, [F, Ma, Mb])
  egal('cycle vu par la révision de PRODUCTION (précision §S2) → refusé', [e4 && e4.code, e4 && e4.chemin], ['cycle_composants', ['F', 'M', 'F']])

  // Profondeur : P1 ⊃ P2 ⊃ P3 ⊃ P4 ⊃ P5 (5 niveaux) → accepté ; P0 ⊃ P1 → 6 niveaux → refusé.
  const P5 = N('p5', 'P5')
  const P4 = N('p4', 'P4', { composants: [C(P5)] })
  const P3 = N('p3', 'P3', { composants: [C(P4)] })
  const P2 = N('p2', 'P2', { composants: [C(P3)] })
  const P1 = N('p1', 'P1', { composants: [] })
  const base = [P1, P2, P3, P4, P5]
  egal('profondeur : 5 niveaux (P1 › P2 › P3 › P4 › P5) → accepté', M.controlerComposants({ ...P1, composants: [C(P2)] }, base), null)
  const P1plein = { ...P1, composants: [C(P2)] }
  const P0 = N('p0', 'P0', { composants: [] })
  const e5 = M.controlerComposants({ ...P0, composants: [C(P1plein)] }, [P0, P1plein, P2, P3, P4, P5])
  egal('profondeur : 6 niveaux → profondeur_max, profondeur 6, max 5', [e5 && e5.code, e5 && e5.profondeur, e5 && e5.max], ['profondeur_max', 6, 5])
  egal('profondeur : chemin le plus long, racine d\'abord', e5 && e5.chemin, ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'])
  ok('profondeur : message du contrat', !!e5 && e5.message === 'Enregistrement refusé : imbrication trop profonde (6 niveaux, 5 au plus). Chemin le plus long : P0 › P1 › P2 › P3 › P4 › P5.', e5 && e5.message)
  // … refusé aussi PAR LES ANCÊTRES : P5 devient une mère qui contient X (P1 › … › P5 › X = 6)
  const X = N('x1', 'X')
  const tous = [P1plein, P2, P3, P4, P5, X]
  const e6 = M.controlerComposants({ ...P5, type_nom: 'mere', composants: [C(X)] }, tous)
  egal('profondeur par les ancêtres : P5 ⊃ X sous 4 niveaux → refusé, chemin P1…P5 › X', [e6 && e6.code, e6 && e6.chemin], ['profondeur_max', ['P1', 'P2', 'P3', 'P4', 'P5', 'X']])
  egal('hauteurAncetres(P5) = 4 ; (P1) = 0 ; (inconnu) = 0', [M.hauteurAncetres('P5', tous), M.hauteurAncetres('p1', tous), M.hauteurAncetres('ZZZ', tous)], [4, 0, 0])
  egal('ancetresDe(P4) = P3, P2, P1', M.ancetresDe('P4', tous).sort(), ['p1', 'p2', 'p3'])
  const carte = M.carteAncetres(tous)
  egal('carteAncetres : P3 → [p2, p1] ; X → [] ; toutes les nomenclatures présentes', [carte.p3.slice().sort(), carte.x, Object.keys(carte).sort()], [['p1', 'p2'], [], ['p1', 'p2', 'p3', 'p4', 'p5', 'x']])
  egal('profondeurMax en option (3) : P2 › P3 › P4 › P5 refusé', M.controlerComposants({ ...P2 }, tous, { profondeurMax: 3 })?.code, 'profondeur_max')

  // Composant introuvable : ignoré (le BE ne propose que des fiches existantes)
  egal('composant introuvable : pas de refus', M.controlerComposants({ ...A, composants: [{ nom_id: 'zzz', code: 'NOPE', qte: 1 }] }, [A]), null)
  egal('standard : jamais contrôlé', M.controlerComposants({ ...A, type_nom: 'standard', composants: [C(A)] }, [A]), null)
  egal('fiche absente → null', M.controlerComposants(null, [A]), null)
  // POST (fiche sans id) qui se contient par son code
  egal('POST sans id qui se contient par son code → cycle', M.controlerComposants({ num_nom: 'Q', code_ref_produit: 'Q', type_nom: 'mere', composants: [{ code: 'Q', num_nom: 'Q', qte: 1 }] }, [])?.code, 'cycle_composants')

  // Résolveurs
  const rE = M.resolveurEdition([A, A2, B])
  egal('résolveur édition : révision nom_id (tout statut)', rE({ nom_id: 'a2', code: 'A' })?.id, 'a2')
  egal('résolveur édition : sinon dernière révision du code (tout statut)', rE({ nom_id: 'effacee', code: 'a' })?.id, 'a2')
  const rP = M.resolveurProduction([A, A2, B])
  egal('résolveur production : dernière révision VALIDÉE du code (pas l\'en-cours)', rP({ nom_id: 'a2', code: 'A' })?.id, 'a1')
  const brouillon = N('d1', 'D', { statut: 'en_cours' })
  const rP2 = M.resolveurProduction([brouillon])
  egal('résolveur production : aucune révision validée → null, pourquoi = composant_non_valide', [rP2(C(brouillon)), rP2.pourquoi(C(brouillon))], [null, 'composant_non_valide'])
  egal('résolveur production : rien → composant_introuvable', rP2.pourquoi({ nom_id: 'nope', code: 'NOPE' }), 'composant_introuvable')
  // Fille renommée : le composant garde l'ancien code, la révision nom_id porte le nouveau
  const R1 = N('r1', 'OLD', { statut: 'valide' })
  const R2 = N('r2', 'NEW', { indice: 'B', groupe: 'r1' })
  R1.code_ref_produit = 'NEW'
  egal('résolveur production : code de la révision nom_id (fille renommée)', M.resolveurProduction([R1, R2])({ nom_id: 'r1', code: 'OLD' })?.id, 'r2')
  egal('dernieresRevisions : une par groupe, indice le plus haut', M.dernieresRevisions([A, A2, B, Ma, Mb]).map((n) => n.id).sort(), ['a2', 'b1', 'mb'])
  egal('indices : Z < AA', M.dernieresRevisions([N('z1', 'Z', { indice: 'Z', groupe: 'g' }), N('z2', 'Z', { indice: 'AA', groupe: 'g' })]).map((n) => n.id), ['z2'])
}

// ══ 3. Production : arbre, plan, ids ═══════════════════════════════════════
const F1 = N('nf1', '-TEST-H2-F1')
const F2 = N('nf2', '-TEST-H2-F2')
const SM = N('nsm', '-TEST-H2-SM', { composants: [C(F2, 2)] })
const MM = N('nm', '-TEST-H2-M', { composants: [C(F1, 1, { rang: 1 }), C(SM, 1, { rang: 2 })] })
const NOMS = [F1, F2, SM, MM]
{
  egal('qteSousLot : 3 × 0,5 → 2 ; 3 × 2 → 6 ; 1 × 0,1 → 1 ; 10 × 0,3 → 3 (pas 4) ; invalide → 1',
    [M.qteSousLot(3, 0.5), M.qteSousLot(3, 2), M.qteSousLot(1, 0.1), M.qteSousLot(10, 0.3), M.qteSousLot(0, -1)], [2, 6, 1, 3, 1])

  const res = M.developperArbre(MM, 3, M.resolveurProduction(NOMS))
  const r = res.racine
  egal('arbre 3 niveaux : racine qté 3, niveau 0, 2 enfants', [r.qte, r.niveau, r.enfants.length, r.qte_par_parent], [3, 0, 2, null])
  egal('arbre : enfants dans l\'ordre des rangs (F1 puis SM)', r.enfants.map((e) => [e.rang, e.code, e.qte, e.niveau, e.chemin]), [[1, '-TEST-H2-F1', 3, 1, [1]], [2, '-TEST-H2-SM', 3, 1, [2]]])
  egal('arbre : sous-sous-lot F2 = 3 × 2 = 6, niveau 2, chemin [2,1]', r.enfants[1].enfants.map((e) => [e.code, e.qte, e.qte_par_parent, e.niveau, e.chemin]), [['-TEST-H2-F2', 6, 2, 2, [2, 1]]])
  egal('arbre : aucun avertissement', res.avertissements, [])

  // Ordre inversé au BE (SM en 1er) → rangs inversés
  const MMinv = { ...MM, composants: [C(SM, 1, { rang: 1 }), C(F1, 1, { rang: 2 })] }
  egal('ordre conservé : SM en haut → SM rang 1', M.developperArbre(MMinv, 1, M.resolveurProduction(NOMS)).racine.enfants.map((e) => e.code), ['-TEST-H2-SM', '-TEST-H2-F1'])
  egal('standard → racine seule', M.developperArbre(F1, 4, M.resolveurProduction(NOMS)).racine.enfants, [])

  // Plan de lots
  const plan = M.planLotsArbre('LOT-2026-0001-01', 1, '-TEST-H2-M', res)
  egal('plan : ids en pré-ordre (racine, 01.01, 01.02, 01.02.01)', plan.map((l) => l.id), ['LOT-2026-0001-01', 'LOT-2026-0001-01.01', 'LOT-2026-0001-01.02', 'LOT-2026-0001-01.02.01'])
  egal('plan : lot_parent, rang, niveau', plan.map((l) => [l.lot_parent, l.rang, l.niveau]), [[null, 1, 0], ['LOT-2026-0001-01', 1, 1], ['LOT-2026-0001-01', 2, 1], ['LOT-2026-0001-01.02', 1, 2]])
  egal('plan : pièces, qtés cumulées, qte_par_parent, nomenclature retenue', plan.map((l) => [l.piece, l.qte, l.qte_par_parent, l.nomenclature_id]),
    [['-TEST-H2-M', 3, null, 'nm'], ['-TEST-H2-F1', 3, 1, 'nf1'], ['-TEST-H2-SM', 3, 1, 'nsm'], ['-TEST-H2-F2', 6, 2, 'nf2']])

  // Composant non validé / introuvable : gardé dans l'arbre (nom null), exclu du plan
  const brouillon = N('nb', '-TEST-H2-BR', { statut: 'en_cours' })
  const MMb = { ...MM, composants: [C(F1), C(brouillon), { nom_id: 'effacee', code: 'DISPARU', num_nom: 'DISPARU', qte: 1 }, C(F2)] }
  const rb = M.developperArbre(MMb, 2, M.resolveurProduction(NOMS.concat([brouillon])))
  egal('non validé / introuvable : nœuds gardés sans nom', rb.racine.enfants.map((e) => [e.rang, e.nom ? 'ok' : 'null']), [[1, 'ok'], [2, 'null'], [3, 'null'], [4, 'ok']])
  egal('non validé / introuvable : avertissements typés', rb.avertissements.map((a) => a.code), ['composant_non_valide', 'composant_introuvable'])
  const pb = M.planLotsArbre('LOT-2026-0001-02', 2, '-TEST-H2-M', rb)
  egal('non validé : exclu du plan, le rang des suivants est CONSERVÉ (.01, .04)', pb.map((l) => l.id), ['LOT-2026-0001-02', 'LOT-2026-0001-02.01', 'LOT-2026-0001-02.04'])

  // Révision différente : le BE a choisi ind. A, la production prend ind. B validée
  const F1b = N('nf1b', '-TEST-H2-F1', { indice: 'B', groupe: 'nf1' })
  const rr = M.developperArbre(MM, 1, M.resolveurProduction(NOMS.concat([F1b])))
  egal('révision différente : production = ind. B, avertissement revision_differente', [rr.racine.enfants[0].nom.id, rr.avertissements.map((a) => a.code)], ['nf1b', ['revision_differente']])

  // Cycle en base : X ⊃ Y ⊃ X (données d'avant H2) → branche coupée, pas de boucle
  const Xn = N('nx', 'CX', { composants: [] }), Yn = N('ny', 'CY', { composants: [] })
  Xn.composants = [C(Yn)]; Yn.composants = [C(Xn)]
  const rc = M.developperArbre(Xn, 1, M.resolveurProduction([Xn, Yn]))
  egal('cycle en base : X › Y › X coupé (Y gardé, X non relancé)', [rc.racine.enfants.map((e) => e.code), rc.racine.enfants[0].enfants.length, rc.avertissements.map((a) => [a.code, a.chemin])], [['CY'], 0, [['cycle_composants', ['CX', 'CY', 'CX']]]])
  egal('ancêtres fournis (développement depuis un sous-lot) : Y seul, X au-dessus → X coupé', M.developperArbre(Yn, 1, M.resolveurProduction([Xn, Yn]), { ancetres: ['cx'] }).avertissements.map((a) => a.code), ['cycle_composants'])

  // Profondeur en production : chaîne de 7 → niveaux 5 et 6 coupés
  const chaine = []
  for (let i = 7; i >= 1; i--) chaine.unshift(N('q' + i, 'Q' + i, i === 7 ? {} : { composants: [C(chaine[0])] }))
  const rq = M.developperArbre(chaine[0], 1, M.resolveurProduction(chaine))
  let prof = 0; for (let n = rq.racine; n.enfants.length; n = n.enfants[0]) prof = n.enfants[0].niveau
  egal('profondeur en production : niveau max 4, 1 avertissement profondeur_max (Q6 coupé)', [prof, rq.avertissements.map((a) => a.code), rq.avertissements[0]?.chemin?.slice(-1)], [4, ['profondeur_max'], ['Q6']])
  const rq3 = M.developperArbre(chaine[3], 1, M.resolveurProduction(chaine), { niveauRacine: 3 })
  egal('niveauRacine 3 : enfant niveau 4 gardé, petit-enfant coupé', [rq3.racine.niveau, rq3.racine.enfants[0]?.niveau, rq3.racine.enfants[0]?.enfants.length, rq3.avertissements.length], [3, 4, 0, 1])
}

// ══ 3 bis. Idempotence des ids de sous-lots ═════════════════════════════════
{
  const res = M.developperArbre(MM, 3, M.resolveurProduction(NOMS))
  const plan = M.planLotsArbre('LOT-2026-0001-01', 1, '-TEST-H2-M', res)
  const neuf = M.attribuerIdsSousLots(plan, [])
  egal('base vide : ids du plan, existe = false partout', neuf.map((l) => [l.id, l.existe]), plan.map((l) => [l.id, false]))
  const existants = plan.map((l) => ({ id: l.id, lot_parent: l.lot_parent, piece: l.piece }))
  egal('rejoué : mêmes ids, existe = true partout', M.attribuerIdsSousLots(plan, existants).map((l) => [l.id, l.existe]), plan.map((l) => [l.id, true]))
  const sansColonnes = plan.map((l) => ({ id: l.id, piece: l.piece }))
  egal('rejoué sur une base SANS lot_parent (cloud) : parent déduit de l\'id', M.attribuerIdsSousLots(plan, sansColonnes).map((l) => l.existe), [true, true, true, true])

  // Réordonnancement APRÈS lancement : SM passe en 1er → réutilise ses ids (pas de doublon, pas de création)
  const MMinv = { ...MM, composants: [C(SM, 1, { rang: 1 }), C(F1, 1, { rang: 2 })] }
  const planInv = M.planLotsArbre('LOT-2026-0001-01', 1, '-TEST-H2-M', M.developperArbre(MMinv, 3, M.resolveurProduction(NOMS)))
  egal('plan brut après réordonnancement : SM = .01, F1 = .02, F2 = .01.01', planInv.map((l) => l.id).slice(1), ['LOT-2026-0001-01.01', 'LOT-2026-0001-01.01.01', 'LOT-2026-0001-01.02'])
  const att = M.attribuerIdsSousLots(planInv, existants)
  egal('collision après réordonnancement : chacun retrouve SON lot (SM .02, F2 .02.01, F1 .01), rien de neuf',
    att.map((l) => [l.piece, l.id, l.lot_parent, l.existe]).slice(1),
    [['-TEST-H2-SM', 'LOT-2026-0001-01.02', 'LOT-2026-0001-01', true], ['-TEST-H2-F2', 'LOT-2026-0001-01.02.01', 'LOT-2026-0001-01.02', true], ['-TEST-H2-F1', 'LOT-2026-0001-01.01', 'LOT-2026-0001-01', true]])

  // Nouveau composant inséré en tête : son id naturel (.01) est pris → premier suffixe libre (.03)
  const F3 = N('nf3', '-TEST-H2-F3')
  const MMnew = { ...MM, composants: [C(F3), C(F1), C(SM)] }
  const planNew = M.planLotsArbre('LOT-2026-0001-01', 1, '-TEST-H2-M', M.developperArbre(MMnew, 3, M.resolveurProduction(NOMS.concat([F3]))))
  const attNew = M.attribuerIdsSousLots(planNew, existants)
  egal('insertion en tête : F3 → .03 (neuf), F1 et SM réutilisés', attNew.slice(1).map((l) => [l.piece, l.id, l.existe]),
    [['-TEST-H2-F3', 'LOT-2026-0001-01.03', false], ['-TEST-H2-F1', 'LOT-2026-0001-01.01', true], ['-TEST-H2-SM', 'LOT-2026-0001-01.02', true], ['-TEST-H2-F2', 'LOT-2026-0001-01.02.01', true]])

  // Deux occurrences de la même fille (rangs 1 et 3), seule la 1re existe
  const MM2 = { ...MM, composants: [C(F1), C(F2), C(F1, 4)] }
  const plan2 = M.planLotsArbre('LOT-2026-0002-01', 1, 'M2', M.developperArbre(MM2, 1, M.resolveurProduction(NOMS)))
  const ex2 = [{ id: 'LOT-2026-0002-01', piece: 'M2' }, { id: 'LOT-2026-0002-01.01', lot_parent: 'LOT-2026-0002-01', piece: '-test-h2-f1 ' }]
  const att2 = M.attribuerIdsSousLots(plan2, ex2)
  egal('2 occurrences de la même fille : 1re réutilisée (pièce normalisée), 2e créée à son rang', att2.slice(1).map((l) => [l.id, l.qte, l.existe]),
    [['LOT-2026-0002-01.01', 1, true], ['LOT-2026-0002-01.02', 1, false], ['LOT-2026-0002-01.03', 4, false]])
  const ex2b = ex2.concat([{ id: 'LOT-2026-0002-01.03', lot_parent: 'LOT-2026-0002-01', piece: '-TEST-H2-F1' }, { id: 'LOT-2026-0002-01.02', lot_parent: 'LOT-2026-0002-01', piece: '-TEST-H2-F2' }])
  egal('2 occurrences, rejoué : tout réutilisé', M.attribuerIdsSousLots(plan2, ex2b).map((l) => l.existe), [true, true, true, true])
}

// ══ 4. Ids, clés et tris ════════════════════════════════════════════════════
{
  const ids = ['LOT-2026-0001-01', 'LOT-2026-0001-01.02', 'LOT-2026-0001-01.02.01', 'LOT-TEST-1', 'LOT-2026--TEST-H2-A-01.02', 'LOT-2026-0001-01.2', 'BDT-2026-0001-01.02-03', 'LOT-2026-A.12-01', 'LOT-2026-A.12-01.03', '', null]
  egal('estSousLot', ids.map((i) => M.estSousLot(i)), [false, true, true, false, true, false, false, false, true, false, false])
  egal('lotParentDeId', ids.map((i) => M.lotParentDeId(i)), [null, 'LOT-2026-0001-01', 'LOT-2026-0001-01.02', null, 'LOT-2026--TEST-H2-A-01', null, null, null, 'LOT-2026-A.12-01', null, null])
  egal('racineDuLot (un « . » dans le n° d\'affaire est respecté)', ids.map((i) => M.racineDuLot(i)), ['LOT-2026-0001-01', 'LOT-2026-0001-01', 'LOT-2026-0001-01', 'LOT-TEST-1', 'LOT-2026--TEST-H2-A-01', 'LOT-2026-0001-01.2', 'BDT-2026-0001-01.02-03', 'LOT-2026-A.12-01', 'LOT-2026-A.12-01', '', ''])
  egal('niveauDuLot : colonne, sinon id ; accepte un id', [M.niveauDuLot({ id: 'LOT-2026-0001-01', niveau: 2 }), M.niveauDuLot({ id: 'LOT-2026-0001-01.02.01' }), M.niveauDuLot({ id: 'LOT-2026-0001-01.02', niveau: null }), M.niveauDuLot('LOT-2026-0001-01'), M.niveauDuLot('LOT-2026-0001-01.02.01.01')], [2, 2, 1, 0, 3])
  egal('parentDuLot : lot_parent, sinon id ; accepte un id', [M.parentDuLot({ id: 'LOT-2026-0001-01.02', lot_parent: 'LOT-X-01' }), M.parentDuLot({ id: 'LOT-2026-0001-01.02', lot_parent: '' }), M.parentDuLot('LOT-2026-0001-01.02'), M.parentDuLot({ id: 'LOT-2026-0001-01' }), M.parentDuLot(null)], ['LOT-X-01', 'LOT-2026-0001-01', 'LOT-2026-0001-01', null, null])
  egal('idSousLot', [M.idSousLot('LOT-2026-0001-01', 2), M.idSousLot('LOT-2026-0001-01.02', 1), M.idSousLot('LOT-2026-0001-01', 100)], ['LOT-2026-0001-01.02', 'LOT-2026-0001-01.02.01', 'LOT-2026-0001-01.100'])
  ok('estSousLot(idSousLot(racine, 100))', M.estSousLot('LOT-2026-0001-01.100'))

  // fmtBonId recopié de index.tsx (non exporté)
  const pad2 = (n) => String(n).padStart(2, '0')
  const fmtBonId = (kind, year, aff, zz, aa) => `${kind}-${year}-${aff}-${pad2(zz)}-${pad2(aa)}`
  const fmtLotId = (year, aff, zz) => `LOT-${year}-${aff}-${pad2(zz)}`
  const cas = [['BDT', '2026', '0001', 1, 3], ['BDS', '2026', '0042', 12, 1], ['BDT', '2026', '-TEST-H2-A', 1, 2]]
  egal('bonIdDuLot(racine) = fmtBonId', cas.map(([k, y, a, z, aa]) => M.bonIdDuLot(k, fmtLotId(y, a, z), aa)), cas.map((c) => fmtBonId(...c)))
  egal('bonIdDuLot(sous-lot)', [M.bonIdDuLot('BDT', 'LOT-2026-0001-01.02', 3), M.bonIdDuLot('BDS', 'LOT-2026-0001-01.02.01', 1)], ['BDT-2026-0001-01.02-03', 'BDS-2026-0001-01.02.01-01'])
  ok('bonIdDuLot(sous-lot) : racineBdt (« -Mk ») et le morceau restent justes', 'BDT-2026-0001-01.02-03-M2'.replace(/-M\d+$/, '') === M.bonIdDuLot('BDT', 'LOT-2026-0001-01.02', 3))
  egal('cleBon : racine INCHANGÉE (aff|pièce|seq), même avec son lot', [M.cleBon('0001', 'P', 3, 'LOT-2026-0001-01'), M.cleBon('0001', 'P', 3, null), M.cleBon(undefined, null, 2, undefined)], ['0001|P|3', '0001|P|3', 'undefined|null|2'])
  egal('cleBon : sous-lot → + |lot', M.cleBon('0001', 'F1', 1, ' LOT-2026-0001-01.02 '), '0001|F1|1|LOT-2026-0001-01.02')

  const L = (id, extra = {}) => ({ id, ...extra })
  const melange = [L('LOT-2026-0001-01'), L('LOT-2026-0001-01.02'), L('LOT-2026-0001-02'), L('LOT-2026-0001-01.01'), L('LOT-2026-0001-01.02.01')]
  egal('trierOrdreFabrication : 01.01, 01.02.01, 01.02, 01, puis 02', M.trierOrdreFabrication(melange).map((l) => l.id.slice(14)), ['01.01', '01.02.01', '01.02', '01', '02'])
  egal('trierArborescence : 01, 01.01, 01.02, 01.02.01, 02', M.trierArborescence(melange).map((l) => l.id.slice(14)), ['01', '01.01', '01.02', '01.02.01', '02'])
  const tri = melange.map((l) => l.id).sort((a, b) => (M.cleTriFabrication(a) < M.cleTriFabrication(b) ? -1 : 1))
  egal('cleTriFabrication : un tri en chaîne donne le même ordre (miroir goulotte)', tri.map((i) => i.slice(14)), ['01.01', '01.02.01', '01.02', '01', '02'])
  // Le rang prime sur le suffixe (id attribué après une collision)
  const collision = [L('R-01', {}), L('LOT-2026-0009-01'), L('LOT-2026-0009-01.03', { rang: 1, lot_parent: 'LOT-2026-0009-01' }), L('LOT-2026-0009-01.01', { rang: 2, lot_parent: 'LOT-2026-0009-01' })]
  egal('tri : rang prioritaire sur le suffixe de l\'id', M.trierOrdreFabrication(collision).filter((l) => l.id.startsWith('LOT')).map((l) => l.id.slice(14)), ['01.03', '01.01', '01'])
  const orphelins = [L('LOT-2026-0001-01.02.01'), L('LOT-2026-0001-01')]
  egal('tri : sous-lot dont le parent est absent de la liste → gardé, avant la racine', M.trierOrdreFabrication(orphelins).map((l) => l.id.slice(14)), ['01.02.01', '01'])
  const boucle = [L('LOT-X-01.01', { lot_parent: 'LOT-X-01.02' }), L('LOT-X-01.02', { lot_parent: 'LOT-X-01.01' })]
  egal('tri : parenté circulaire → pas de boucle, tout est rendu', M.trierOrdreFabrication(boucle).length, 2)
}

// ══ 5. Avancement, vigilance, fiche lot ═════════════════════════════════════
{
  const R = 'LOT-2026-0001-01'
  const lots = [
    { id: R, piece: 'M', qte: 3, statut: 'a_faire', rang: 1, niveau: 0 },
    { id: R + '.01', lot_parent: R, piece: 'F1', qte: 3, statut: 'a_faire', rang: 1, niveau: 1 },
    { id: R + '.02', lot_parent: R, piece: 'SM', qte: 3, statut: 'a_faire', rang: 2, niveau: 1 },
    { id: R + '.02.01', lot_parent: R + '.02', piece: 'F2', qte: 6, statut: 'a_faire', rang: 1, niveau: 2 },
    { id: R + '.04', lot_parent: R, piece: 'ANN', qte: 1, statut: 'annule', rang: 4, niveau: 1 },
  ]
  const bdts = [
    { id: 'BDT-R-01', lot_ref: R, statut: 'a_programmer' },
    { id: 'BDT-R01-01', lot_ref: R + '.01', statut: 'solde' },
    { id: 'BDT-R01-02', lot_ref: R + '.01', statut: 'annule' },
    { id: 'BDT-R02-01', lot_ref: R + '.02', statut: 'recu' },            // reçu = COMMENCÉ, pas fini
    { id: 'BDT-R0201-01', lot_id: R + '.02.01', lot_ref: 'autre', statut: 'Soldé' },
    { id: 'BDT-R04-01', lot_ref: R + '.04', statut: 'a_programmer' },    // lot annulé : ne bloque rien
  ]
  const bdss = [
    { id: 'BDS-R0201-01', lot_ref: R + '.02.01', statut: 'recu', sous_traitant_id: 's' },
    { id: 'BDS-R01-01', lot_ref: R + '.01', statut: 'envoye', date_retour_effective: '2026-09-10', sous_traitant_id: 's' },
  ]
  const ops = M.opsParLot(bdts, bdss)
  egal('opsParLot : clé lot_id || lot_ref, annulées exclues', Object.keys(ops).sort(), [R, R + '.01', R + '.02', R + '.02.01', R + '.04'].sort())
  egal('opsParLot : BDT « Soldé » fini, BDT « recu » non fini, BDS « recu » fini, BDS avec retour effectif fini',
    [ops[R + '.02.01'].map((o) => [o.kind, o.fini]), ops[R + '.02'][0].fini, ops[R + '.01'].map((o) => [o.kind, o.fini])],
    [[['BDT', true], ['BDS', true]], false, [['BDT', true], ['BDS', true]]])
  egal('lotFini : 01.02.01 oui, 01.01 oui, 01.02 non (BDT reçu), racine non', [M.lotFini(R + '.02.01', lots, ops), M.lotFini(R + '.01', lots, ops), M.lotFini(R + '.02', lots, ops), M.lotFini(R, lots, ops)], [true, true, false, false])
  egal('lotFini : sans op ni enfant → true', M.lotFini('LOT-2026-0099-01', lots, ops), true)
  egal('sousLotsNonTermines(racine) = [01.02] (01.04 annulé ignoré)', M.sousLotsNonTermines(R, lots, ops), [R + '.02'])
  egal('vigilance BDT de la racine', M.vigilanceSousLots(bdts[0], lots, ops), 'sous-lots non terminés (1/2) : ' + R + '.02')
  egal('vigilance BDT de 01.02 (son sous-lot est fini) et de 01.01 (feuille) → null', [M.vigilanceSousLots(bdts[3], lots, ops), M.vigilanceSousLots(bdts[1], lots, ops), M.vigilanceSousLots({ id: 'x' }, lots, ops)], [null, null, null])
  egal('descendantsDe(racine) : pré-ordre, annulé exclu', M.descendantsDe(R, lots, ops), [R + '.01', R + '.02', R + '.02.01'])
  const av = M.avancementArbre(R, lots, ops)
  egal('avancementArbre(racine) : 6 ops (annulée et lot annulé exclus) dont 4 finies (67 %), propre 0/1', [av.total, av.soldes, av.pct, av.propre], [6, 4, 67, { total: 1, soldes: 0, pct: 0 }])

  // On solde le BDT de 01.02 (NOUVEAUX tableaux, comme une nouvelle requête)
  const bdts2 = bdts.map((b) => (b.id === 'BDT-R02-01' ? { ...b, statut: 'solde' } : b))
  const ops2 = M.opsParLot(bdts2, bdss)
  const lots2 = [...lots]
  egal('après soldage de 01.02 : vigilance de la racine levée, racine pas finie (son assemblage)', [M.vigilanceSousLots(bdts2[0], lots2, ops2), M.lotFini(R, lots2, ops2)], [null, false])
  const ops3 = M.opsParLot(bdts2.map((b) => (b.id === 'BDT-R-01' ? { ...b, statut: 'solde' } : b)), bdss)
  egal('tout soldé : racine finie', M.lotFini(R, [...lots], ops3), true)

  // Sous-lot connu SEULEMENT par ses bons (lot_ref sans ligne lots) + plus de 3 non finis
  const lotsSeuls = [{ id: R, piece: 'M' }]
  const opsSeuls = M.opsParLot(['.01', '.02', '.03', '.04', '.05'].map((s, i) => ({ id: 'B' + i, lot_ref: R + s, statut: 'a_programmer' })), [])
  egal('sous-lots vus dans les bons seulement : comptés, 3 ids puis « +n »', M.vigilanceSousLots({ lot_ref: R }, lotsSeuls, opsSeuls), 'sous-lots non terminés (5/5) : ' + R + '.01, ' + R + '.02, ' + R + '.03 +2')

  // Vue de la fiche lot
  const vue = M.vueArbreLot(R + '.02', lots, ops, { nomLot: SM, arbreDispo: true })
  egal('vueArbreLot(01.02) : parent, racine, niveau, rang', [vue.parent, vue.racine, vue.niveau, vue.rang], [{ id: R, piece: 'M' }, R, 1, 2])
  egal('vueArbreLot(01.02) : enfant 01.02.01 fini, qté 6', vue.enfants.map((e) => [e.id, e.piece, e.qte, e.fini, e.rang, e.niveau, e.avancement.pct]), [[R + '.02.01', 'F2', 6, true, 1, 2, 100]])
  egal('vueArbreLot(01.02) : pas de vigilance, pas de manque, pas d\'avertissement', [vue.vigilance, vue.sous_lots_manquants, vue.avertissement], [null, false, null])
  const vr = M.vueArbreLot(R, lots, ops, { nomLot: MM, arbreDispo: true })
  egal('vueArbreLot(racine) : enfants dans l\'ordre, vigilance, avancement de l\'arbre', [vr.parent, vr.enfants.map((e) => e.id), vr.vigilance, vr.avancement_arbre], [null, [R + '.01', R + '.02'], 'sous-lots non terminés (1/2) : ' + R + '.02', { total: 6, soldes: 4, pct: 67 }])
  const vm = M.vueArbreLot('LOT-2026-0007-01', [{ id: 'LOT-2026-0007-01', piece: 'M' }], {}, { nomLot: MM, arbreDispo: false })
  ok('vueArbreLot : mère sans sous-lots, base sans cloud-14 → manque + avertissement « cloud-14 »', vm.sous_lots_manquants && !vm.arbre_dispo && /cloud-14/.test(vm.avertissement || ''), JSON.stringify(vm))
  const vm2 = M.vueArbreLot('LOT-2026-0007-01', [{ id: 'LOT-2026-0007-01', piece: 'M' }], {}, { nomLot: MM, arbreDispo: true })
  ok('vueArbreLot : mère sans sous-lots, base à jour → « Créer les sous-lots »', vm2.sous_lots_manquants && /Créer les sous-lots/.test(vm2.avertissement || ''))
  const vs = M.vueArbreLot(R + '.01', lots, ops, { nomLot: F1, arbreDispo: true })
  egal('vueArbreLot : standard → ni manque ni avertissement', [vs.sous_lots_manquants, vs.avertissement, vs.enfants], [false, null, []])
}

// ══ 6. Journal EN 9100 des composants ═══════════════════════════════════════
{
  const a = { nom_id: '1', code: 'A', num_nom: 'A', qte: 1 }
  const b = { nom_id: '2', code: 'B', num_nom: 'B', qte: 1 }
  const c = { nom_id: '3', code: 'C', num_nom: 'C', qte: 1 }
  const norm = (l) => M.normaliserComposants(l)
  const perm = M.diffComposants(norm([a, b, c]), norm([b, a, c]))
  egal('permutation seule → UNE entrée « Ordre de fabrication des composants »', perm.map((e) => [e.bloc, e.champ, e.avant, e.apres]), [['fiche', 'Ordre de fabrication des composants', 'A, B, C', 'B, A, C']])
  egal('ajout en fin → 1 entrée « ajouté », pas de réordonnancement', M.diffComposants(norm([a, b]), norm([a, b, c])).map((e) => [e.champ, e.avant, e.apres]), [['Composant ajouté « C »', null, 'C × 1']])
  egal('ajout en TÊTE → 1 entrée « ajouté » (l\'ordre relatif des autres ne change pas)', M.diffComposants(norm([a, b]), norm([c, a, b])).map((e) => e.champ), ['Composant ajouté « C »'])
  egal('retrait → 1 entrée « retiré »', M.diffComposants(norm([a, b, c]), norm([a, c])).map((e) => [e.champ, e.avant, e.apres]), [['Composant retiré « B »', 'B × 1', null]])
  egal('quantité → 1 entrée', M.diffComposants(norm([a, b]), norm([{ ...a, qte: 2 }, b])).map((e) => [e.bloc, e.champ, e.avant, e.apres]), [['fiche', 'Composant « A » — quantité', 1, 2]])
  egal('doublons identiques permutés → aucune entrée', M.diffComposants(norm([a, a]), norm([a, a])), [])
  const aq2 = { ...a, qte: 2 }
  egal('doublons appariés dans l\'ordre : [A×1, B, A×2] → [A×1, A×2, B] = 1 réordonnancement, aucune quantité', M.diffComposants(norm([a, b, aq2]), norm([a, aq2, b])).map((e) => e.champ), ['Ordre de fabrication des composants'])
  const ancien = [{ nom_id: '1', num_nom: 'A', code: 'A', prix: 10, qte: 1 }, { nom_id: '2', num_nom: 'B', code: 'B', prix: 5, qte: 2 }]
  const nouveau = [{ nom_id: '1', num_nom: 'A', code: 'A', prix: 10, qte: 1, rang: 1, type_nom: 'standard', indice: 'A' }, { nom_id: '2', num_nom: 'B', code: 'B', prix: 5, qte: 2, rang: 2, type_nom: 'mere', indice: 'B' }]
  const bascule = M.diffComposants(ancien, nouveau)
  egal('ancien format sans rang → nouveau : UNE entrée « recalcul » (indice et type complétés), aucune « fiche », rang jamais comparé',
    bascule.map((e) => [e.bloc, e.champ, e.apres]), [['recalcul', 'Composants · indice et type complétés automatiquement (pas une saisie)', 'A : ind. A, standard ; B : ind. B, mère']])
  egal('chaîne JSON = tableau', M.diffComposants(JSON.stringify(norm([a, b, c])), JSON.stringify(norm([b, a, c]))).length, 1)
  egal('rangs anciens incohérents mais même ordre → aucune entrée', M.diffComposants([{ ...a, rang: 5 }, { ...b, rang: 9 }], norm([a, b])), [])
  egal('changement de révision (nom_id) → 1 entrée « révision » (fiche)', M.diffComposants(norm([{ ...a, indice: 'A' }]), norm([{ ...a, nom_id: '1b', indice: 'B' }])).map((e) => [e.bloc, e.champ, e.avant, e.apres, e.detail]), [['fiche', 'Composant « A » — révision', 'A — ind. A', 'A — ind. B', { nom_id_avant: '1', nom_id_apres: '1b' }]])
  egal('révision sans indice → « indice non renseigné » (jamais « ? » ni l\'id interne)', M.diffComposants([{ nom_id: 'uuid-1', code: 'A', num_nom: 'A', qte: 1 }], norm([{ ...a, nom_id: 'uuid-2', indice: 'B' }])).filter((e) => /révision/.test(e.champ)).map((e) => [e.avant, e.apres]), [['A — indice non renseigné', 'A — ind. B']])
  egal('prix recopié → « recalcul »', M.diffComposants(norm([{ ...a, prix: 10 }]), norm([{ ...a, prix: 12 }])).map((e) => [e.bloc, e.champ]), [['recalcul', 'Composant « A » · prix']])
  const dn = M.diffNomenclature({ id: 'n', type_nom: 'mere', composants: norm([a, b]) }, { id: 'n', type_nom: 'mere', composants: norm([b, a]) })
  egal('diffNomenclature : plus de bloc « Composants » en JSON, l\'entrée d\'ordre à la place', dn.map((e) => e.champ), ['Ordre de fabrication des composants'])
  egal('diffNomenclature restreint (cles sans composants) → rien', M.diffNomenclature({ composants: norm([a, b]) }, { composants: norm([b, a]) }, ['notes']), [])
  egal('diffNomenclature création d\'une mère → une entrée « ajouté » par composant', M.diffNomenclature(null, { id: 'n', type_nom: 'mere', composants: norm([a, b]) }).filter((e) => /Composant/.test(e.champ)).map((e) => e.champ), ['Composant ajouté « A »', 'Composant ajouté « B »'])
}

// ══ 7. Correctifs de la relecture H2 ════════════════════════════════════════
{
  // (a) controlerComposants voit la DERNIÈRE révision en cours d'un composant (comme carteAncetres) :
  //     M.A validée ⊃ F ; M.B en cours ⊃ X ; on enregistre X.B ⊃ M (nom_id = M.A) → cycle X › M › X.
  const F = N('f', 'F')
  const MA = N('m-a', 'M', { indice: 'A', groupe: 'm', composants: [C(F)] })
  const XA = N('x-a', 'X', { indice: 'A', groupe: 'x' })
  const MB = N('m-b', 'M', { indice: 'B', groupe: 'm', statut: 'brouillon', composants: [C(XA)] })
  const XB = { ...N('x-b', 'X', { indice: 'B', groupe: 'x', statut: 'brouillon' }), type_nom: 'mere', composants: [C(MA)] }
  const toutes = [F, MA, XA, MB]
  ok('carteAncetres(x) contient m (révision en cours M.B)', (M.carteAncetres([...toutes, XB])['x'] || []).includes('m'))
  const e = M.controlerComposants(XB, toutes)
  egal('controlerComposants(X.B ⊃ M) : cycle via la révision EN COURS M.B → refusé', [e && e.code, e && e.chemin], ['cycle_composants', ['X', 'M', 'X']])

  // (b) revisionsRetenues : dernière du groupe + dernière VALIDÉE du code
  const ids = M.revisionsRetenues(toutes).map((n) => n.id).sort()
  egal('revisionsRetenues : m-b (dernière du groupe) ET m-a (dernière validée), f, x-a', ids, ['f', 'm-a', 'm-b', 'x-a'])

  // (c) vueArbreLot avec les nomenclatures : composant sans révision validée NOMMÉ, bouton seulement s'il crée
  const R = 'LOT-2026-0042-01'
  const F1 = N('f1', 'F1'), F3 = N('f3', 'F3', { statut: 'brouillon' })
  const M4 = N('m4', 'M4', { composants: [C(F1), C(F3)] })
  const nomsV = [F1, F3, M4]
  const lotsV = [{ id: R, piece: 'M4', statut: 'a_faire' }, { id: R + '.01', lot_parent: R, piece: 'F1', rang: 1, statut: 'a_faire' }]
  const v1 = M.vueArbreLot(R, lotsV, {}, { nomLot: M4, arbreDispo: true, noms: nomsV })
  egal('vue : F1 a son sous-lot, F3 (brouillon) nommé, AUCUN bouton', [v1.action_creer, v1.composants_bloques], [false, [{ rang: 2, libelle: 'F3', raison: 'composant_non_valide' }]])
  ok('vue : message nomme F3, son rang et l\'action (valider au BE), sans « ? »', /Composant « F3 » \(rang 2\) : aucune révision validée — faites-la valider au BE/.test(v1.avertissement || '') && !/\?/.test(v1.avertissement || ''), v1.avertissement)
  const v2 = M.vueArbreLot(R, [{ id: R, piece: 'M4', statut: 'a_faire' }], {}, { nomLot: M4, arbreDispo: true, noms: [F1, { ...F3, statut: 'valide' }, M4] })
  egal('vue : mère sans sous-lot, composants validés → 2 créables, bouton proposé', [v2.action_creer, v2.composants_bloques.length, /2 composants sur 2/.test(v2.avertissement || '')], [true, 0, true])
  for (const [st, attendu] of [['libere', 'libéré'], ['expedie', 'expédié'], ['annule', 'annulé']]) {
    const v = M.vueArbreLot(R, [{ id: R, piece: 'M4', statut: st }], {}, { nomLot: M4, arbreDispo: true, noms: [F1, { ...F3, statut: 'valide' }, M4] })
    ok('vue : lot ' + st + ' → aucun bouton, message « ' + attendu + ' »', !v.action_creer && v.lot_clos === 'ce lot est ' + attendu && new RegExp(attendu).test(v.avertissement || ''), JSON.stringify([v.action_creer, v.lot_clos, v.avertissement]))
  }
  const vRac = M.vueArbreLot(R + '.02', [{ id: R, piece: 'X', statut: 'expedie' }, { id: R + '.02', lot_parent: R, piece: 'M4', statut: 'a_faire' }], {}, { nomLot: M4, arbreDispo: true, noms: [F1, { ...F3, statut: 'valide' }, M4] })
  egal('vue : sous-lot mère dont la RACINE est expédiée → clos, pas de bouton', [vRac.action_creer, vRac.lot_clos], [false, 'son lot racine ' + R + ' est expédié'])
  const vT = M.vueArbreLot(R, [{ id: R, piece: 'M4', statut: 'termine' }], {}, { nomLot: M4, arbreDispo: true, noms: [F1, { ...F3, statut: 'valide' }, M4] })
  egal('vue : lot terminé → bouton proposé, confirmation annoncée', [vT.action_creer, vT.lot_termine, /confirmation/.test(vT.avertissement || '')], [true, true, true])
  const vC = M.vueArbreLot(R, [{ id: R, piece: 'M4', statut: 'a_faire' }], {}, { nomLot: M4, arbreDispo: false, noms: nomsV })
  ok('vue : base sans cloud-14 → pas de bouton, message pour l\'administrateur sans chemin de script', !vC.action_creer && /administrateur/.test(vC.avertissement || '') && !/docker\//.test(vC.avertissement || ''), vC.avertissement)

  // (d) planCompletementLot : un sous-lot EXISTANT garde la révision de son lancement
  const FA = N('fa', 'FX', { indice: 'A', groupe: 'fx', statut: 'valide' })
  const FB = N('fb', 'FX', { indice: 'B', groupe: 'fx', statut: 'valide' })
  const SA = N('sa', 'SUB', { indice: 'A', groupe: 'sub', composants: [C(FA)] })
  const SB = N('sb', 'SUB', { indice: 'B', groupe: 'sub', composants: [C(FB), C(F1)] })
  const MERE = N('me', 'ME', { composants: [C(SA)] })
  const nomsP = [FA, FB, SA, SB, MERE, F1]
  const RR = 'LOT-2026-0043-01'
  const exist = [
    { id: RR, piece: 'ME', statut: 'a_faire', nomenclature_id: 'me' },
    { id: RR + '.01', lot_parent: RR, piece: 'SUB', rang: 1, statut: 'a_faire', nomenclature_id: 'sa', qte_initiale: 2 },
  ]
  const pc = M.planCompletementLot({ id: RR, rang: 1, piece: 'ME', qte: 2, niveau: 0, nom: MERE }, nomsP, exist)
  egal('complétion : SUB existant garde ind. A (sa) : son sous-arbre vient de SA (un seul composant FX, pas le F1 de SB) ; le sous-lot FX NOUVEAU prend la dernière validée (fb)',
    pc.plan.map((l) => [l.id, l.nomenclature_id, !!l.existe, l.nom_lance]),
    [[RR, 'me', true, true], [RR + '.01', 'sa', true, true], [RR + '.01.01', 'fb', false, true]])
  const exist2 = [...exist.slice(0, 1), { ...exist[1], nomenclature_id: null }]
  const pc2 = M.planCompletementLot({ id: RR, rang: 1, piece: 'ME', qte: 2, niveau: 0, nom: MERE }, nomsP, exist2)
  egal('complétion : sous-lot existant sans révision connue → nom_lance false, sous-arbre non développé', pc2.plan.map((l) => [l.id, l.nom_lance]), [[RR, true], [RR + '.01', false]])
  const pc3 = M.planCompletementLot({ id: RR, rang: 1, piece: 'ME', qte: 2, niveau: 0, nom: MERE }, nomsP, [exist[0]])
  egal('complétion : rien d\'existant → dernière révision validée partout (comme developperArbre)', pc3.plan.map((l) => [l.id, l.nomenclature_id, !!l.existe]), [[RR, 'me', true], [RR + '.01', 'sb', false], [RR + '.01.01', 'fb', false], [RR + '.01.02', 'f1', false]])

  // (e) statuts
  egal('motifLotClos / lotOuRacineTermine', [M.motifLotClos({ statut: 'a_faire' }, null), M.motifLotClos({ statut: 'Libéré' }), M.lotOuRacineTermine({ statut: 'a_faire' }, { statut: 'terminé' })], [null, 'ce lot est libéré', true])
}

rmSync(workdir, { recursive: true, force: true })
console.log('\n' + pass + ' PASS · ' + fail + ' FAIL')
process.exitCode = fail ? 1 : 0
