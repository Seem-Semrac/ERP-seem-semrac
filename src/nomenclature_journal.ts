// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL EN 9100 DES NOMENCLATURES — le calcul des écarts, pur et testable
// ═══════════════════════════════════════════════════════════════════════════
// « Pour l'EN 9100, je veux pouvoir tracer dans les logs toutes les modifications effectuées sur
//   une nomenclature déjà validée. » (11/09/2026)
// Aucune dépendance à Hono ni à Supabase (même principe que src/gamme.ts) : ce module dit CE QUI
// a changé entre deux états d'une nomenclature ; index.tsx dit QUI et QUAND ; queries.ts l'écrit.
//
// Principe : on ne liste pas les champs à suivre, on compare TOUT, sauf une courte liste de clés
// techniques. Un champ ajouté plus tard au formulaire est ainsi suivi d'office. (Une première
// version listait les champs d'étape « à suivre » : le sous-traitant, son opération, son prix et le
// prix OAS lui échappaient — la revue adverse du 11/09/2026 l'a montré.)

import { categorieFourniture, normaliserReference } from './prix_moyen'
import { cleComposant, composantsOrdonnes } from './nomenclature_arbre'

export type Changement = { bloc: 'fiche' | 'gamme' | 'fourniture' | 'recalcul' | 'document' | 'reference_client'; champ: string; cle?: string; avant: unknown; apres: unknown; detail?: unknown }

// Champs de la fiche, dans l'ordre d'affichage. Toute AUTRE colonne est comparée aussi (colonne
// ajoutée plus tard, ou présente en cloud seulement) ; seules les colonnes techniques sont exclues.
export const CHAMPS_FICHE = ['num_nom', 'code_ref_produit', 'indice', 'version_groupe', 'entite', 'type_nom', 'description', 'num_plan', 'plan_fichier', 'masse_kg', 'dimensions', 'surface_totale_dm2', 'composants', 'parent_id', 'qte_par_mere', 'notes', 'num_affaire', 'lot_id', 'cree_par', 'statut', 'valide_par', 'date_validation']
// `composants` (mère) : suivi ligne par ligne par diffComposants (lot H2), pas en bloc JSON.
const HORS_FICHE = ['id', 'created_at', 'updated_at', 'etapes_production', 'composants']
// Valeurs DÉRIVÉES, recalculées à chaque enregistrement (taux atelier…) : tracées à part, pour
// qu'un simple ré-enregistrement après un changement de taux ne passe pas pour une saisie.
export const CHAMPS_RECALCUL = ['temps_matiere_h', 'temps_machine_h', 'taux_mo', 'cout_machine_h', 'prix_mo_unitaire', 'cout_machine_unitaire', 'prix_revient_unitaire']
const LIBELLES: Record<string, string> = {
  num_nom: 'N° de nomenclature', code_ref_produit: 'Code produit', indice: 'Indice', version_groupe: 'Groupe de révisions',
  entite: 'Site', type_nom: 'Type', description: 'Description', num_plan: 'N° de plan', plan_fichier: 'Fichier CAO',
  masse_kg: 'Masse (kg)', dimensions: 'Dimensions', surface_totale_dm2: 'Surface (dm²)', composants: 'Composants',
  parent_id: 'Nomenclature mère', qte_par_mere: 'Qté par mère', notes: 'Notes', num_affaire: 'N° d’affaire', lot_id: 'Lot',
  cree_par: 'Créé par', statut: 'Statut', valide_par: 'Validé par', date_validation: 'Date de validation', temps_matiere_h: 'Temps matière (h)', temps_machine_h: 'Temps machine (h)',
  taux_mo: 'Taux MO', cout_machine_h: 'Coût machine (h)', prix_mo_unitaire: 'Coût MO unitaire',
  cout_machine_unitaire: 'Coût machine unitaire', prix_revient_unitaire: 'Prix de revient unitaire',
}

const arrondi = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 1e6) / 1e6)

// Normalisation avant comparaison : '' et null se valent ; un JSON rangé en texte est parsé ; les
// clés d'objet sont triées. Une chaîne numérique ne devient un nombre QUE si elle est l'écriture
// canonique de ce nombre (« 1.5 ») : « 4.10 », « 2.0 », « 0001 », « 10,5 » ou un identifiant de
// 17 chiffres restent du texte — un programme CN « 4.10 » → « 4.1 » est un vrai changement.
// (En Docker, masse_kg est une colonne texte : le client envoie 1.5, la base rend « 1.5 ».)
export function normaliser(v: any): any {
  if (v === undefined || v === null) return null
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '') return null
    if (/^-?\d+(\.\d+)?$/.test(t) && String(Number(t)) === t) return arrondi(Number(t))
    if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) { try { return normaliser(JSON.parse(t)) } catch { return t } }
    return t
  }
  if (typeof v === 'number') return Number.isFinite(v) ? arrondi(v) : null
  if (Array.isArray(v)) return v.map(normaliser)
  if (typeof v === 'object') { const o: any = {}; for (const k of Object.keys(v).sort()) o[k] = normaliser(v[k]); return o }
  return v
}
// « Vide » : rien, 0, faux, liste ou objet vides. Deux vides se valent — l'appli lit partout
// Number(x) || 0 : un prix absent et un prix à 0, une case OAS absente et décochée, c'est pareil.
const vide = (v: any): boolean => {
  const n = normaliser(v)
  return n === null || n === 0 || n === false || (Array.isArray(n) && n.length === 0) || (typeof n === 'object' && n !== null && !Array.isArray(n) && Object.keys(n).length === 0)
}
const pareil = (a: any, b: any) => (vide(a) && vide(b)) || JSON.stringify(normaliser(a)) === JSON.stringify(normaliser(b))
const lib = (k: string) => LIBELLES[k] || k
// Valeur EFFECTIVE d'un champ de fiche : l'appli traite partout « groupe vide » comme la fiche
// elle-même et « indice vide » comme A (sinon le 1er enregistrement après validation inventait
// « Groupe de révisions : ∅ → <id> »). Seulement pour une vraie ligne, qui a un id.
const effectif = (x: any, k: string) => {
  if (x && x.id != null && k === 'version_groupe') return x.version_groupe || x.id
  if (x && x.id != null && k === 'indice') return x.indice || 'A'
  return x ? x[k] : undefined
}

// Écart sur la fiche. `cles` restreint la comparaison aux champs réellement ENVOYÉS (mise à jour
// partielle : la préparation technique n'envoie que plan et programmes) ; sans `cles`, tout.
export function diffNomenclature(avant: any, apres: any, cles?: string[]): Changement[] {
  const a = avant || {}, b = apres || {}
  const dans = (k: string) => !cles || cles.includes(k)
  const out: Changement[] = []
  const fiche = Array.from(new Set(CHAMPS_FICHE.concat(Object.keys(a), Object.keys(b)))).filter((k) => !HORS_FICHE.includes(k) && !CHAMPS_RECALCUL.includes(k))
  for (const k of fiche) {
    if (!dans(k)) continue
    const va = effectif(a, k), vb = effectif(b, k)
    if (!pareil(va, vb)) out.push({ bloc: 'fiche', champ: lib(k), avant: normaliser(va), apres: normaliser(vb) })
  }
  if (dans('composants')) out.push(...diffComposants(a.composants, b.composants))
  if (dans('etapes_production')) out.push(...diffEtapes(a.etapes_production, b.etapes_production))
  for (const k of CHAMPS_RECALCUL) if (dans(k) && !pareil(a[k], b[k])) out.push({ bloc: 'recalcul', champ: lib(k), avant: normaliser(a[k]), apres: normaliser(b[k]) })
  return out
}

// ── Gamme ─────────────────────────────────────────────────────────
// Clés jamais comparées : l'ordre (renuméroté à chaque glisser-déposer ; une permutation est
// tracée à part) et les clés techniques préfixées « _ ».
const horsEtape = (k: string) => k === 'ordre' || k.startsWith('_')
// Valeurs DÉRIVÉES d'une étape (taux repris du poste ou de la machine, coût ST recopié du prix) :
// tracées, dans le bloc « recalcul ».
const DERIVES_ETAPE = ['taux_mo_h', 'machine_taux_h', 'cout_st_unitaire', 'temps_unitaire_min']
const MINUTES = ['temps_reglage_min', 'temps_reglage_machine_min', 'temps_mo_min', 'temps_machine_min']
const MILLIEMES = ['temps_reglage_mille', 'temps_reglage_op_mille', 'temps_reglage_machine_mille', 'temps_variable_mille']
const rempli = (e: any, ks: string[]) => !!e && ks.some((k) => e[k] != null && e[k] !== '')
// Étape importée jamais ouverte : des millièmes, aucune minute. À sa 1ʳᵉ ouverture le formulaire
// la COMPLÈTE (minutes, type « interne », nom de machine, taux) : ce n'est pas une saisie, c'est
// classé « recalcul » — tracé quand même, rien n'est perdu. Une fois les minutes enregistrées, elles
// sont comparées comme toute saisie (c'est elles que l'OF imprime).
const brute = (e: any) => (rempli(e, MILLIEMES) || rempli(e, ['temps_unitaire_min'])) && !rempli(e, MINUTES)   // + ancien format (temps_unitaire_min)
const clesDe = (a: any, b: any, hors: (k: string) => boolean) => Array.from(new Set(Object.keys(a || {}).concat(Object.keys(b || {})))).filter((k) => !hors(k)).sort()
// Résumé d'un élément (étape, fourniture) : ses valeurs non vides. Gardé dans l'entrée d'un élément
// ajouté ou retiré — son nom seul ne permettrait pas de reconstituer la définition validée.
const resume = (e: any, hors: (k: string) => boolean) => { const o: any = {}; for (const k of Object.keys(e || {}).sort()) if (!hors(k) && !vide(e[k])) o[k] = normaliser(e[k]); return o }
const signature = (e: any) => JSON.stringify(resume(e, horsEtape))
const nomEtape = (e: any) => (e && (e.nom || e.process_nom)) ? String(e.nom || e.process_nom) : '?'
const titreEtape = (e: any, n: string) => 'étape ' + n + (e && (e.nom || e.process_nom) ? ' « ' + nomEtape(e) + ' »' : '')

export function diffEtapes(avant: any, apres: any): Changement[] {
  const liste = (x: any) => { const v = normaliser(x); return Array.isArray(v) ? v : [] }
  const A = liste(avant), B = liste(apres)
  const sa = A.map(signature), sb = B.map(signature)
  const pris = A.map(() => false)
  const paire: number[] = B.map(() => -1)            // index dans A de l'étape appariée
  // 1. Alignement qui RESPECTE L'ORDRE : plus longue sous-suite commune, pondérée (même contenu 3,
  //    même nom 2). Deux étapes identiques ne s'échangent pas ; une étape insérée ou retirée ne
  //    décale pas les suivantes ; un changement reste sur l'étape qui l'a subi.
  const poids = (i: number, j: number) => (sa[i] === sb[j] ? 3 : (nomEtape(A[i]) !== '?' && nomEtape(A[i]) === nomEtape(B[j]) ? 2 : 0))
  const D: number[][] = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0))
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) {
    const w = poids(i, j)
    D[i][j] = Math.max(D[i + 1][j], D[i][j + 1], w ? w + D[i + 1][j + 1] : 0)
  }
  for (let i = 0, j = 0; i < A.length && j < B.length;) {
    const w = poids(i, j)
    if (w && D[i][j] === w + D[i + 1][j + 1]) { pris[i] = true; paire[j] = i; i++; j++ }
    else if (D[i + 1][j] >= D[i][j + 1]) i++
    else j++
  }
  const ancre = paire.slice()                        // appariements de l'alignement
  // 2. Vrais déplacements, n'importe où : même contenu, puis même nom.
  const apparier = (test: (i: number, j: number) => boolean) => B.forEach((_eb: any, j: number) => {
    if (paire[j] >= 0) return
    const i = A.findIndex((_ea: any, k: number) => !pris[k] && test(k, j))
    if (i >= 0) { pris[i] = true; paire[j] = i }
  })
  apparier((i, j) => sa[i] === sb[j])
  apparier((i, j) => nomEtape(A[i]) !== '?' && nomEtape(A[i]) === nomEtape(B[j]))
  // 3. Remplacement SUR PLACE : même rang dans le même intervalle entre deux étapes alignées —
  //    jamais par-dessus une étape alignée (sinon une suppression suivie d'un ajout en fin de
  //    gamme passait pour un « renommage » et un réordonnancement).
  const surPlace = new Set<number>()
  B.forEach((_eb: any, j: number) => {
    if (paire[j] >= 0) return
    let j0 = j - 1; while (j0 >= 0 && ancre[j0] < 0) j0--
    let j1 = j + 1; while (j1 < B.length && ancre[j1] < 0) j1++
    const iBas = j0 >= 0 ? ancre[j0] : -1, iHaut = j1 < B.length ? ancre[j1] : A.length
    const i = iBas + (j - j0)
    if (i > iBas && i < iHaut && !pris[i]) { pris[i] = true; paire[j] = i; surPlace.add(j) }
  })
  const out: Changement[] = []
  // Réordonnancement : jugé sur les étapes alignées et les vrais déplacements, jamais sur un
  // remplacement sur place.
  const suite = paire.filter((i, j) => i >= 0 && !surPlace.has(j))
  if (suite.some((v, k) => k > 0 && v < suite[k - 1])) out.push({ bloc: 'gamme', champ: 'gamme réordonnée', avant: A.map(nomEtape), apres: B.map(nomEtape) })
  B.forEach((eb: any, j: number) => {
    const n = String(eb?.ordre ?? j + 1), i = paire[j]
    if (i < 0) { out.push({ bloc: 'gamme', champ: titreEtape(eb, n) + ' ajoutée', cle: n, avant: null, apres: nomEtape(eb), detail: resume(eb, horsEtape) }); return }
    const ea = A[i], completion = brute(ea)
    for (const k of clesDe(ea, eb, horsEtape)) {
      if (pareil(ea?.[k], eb?.[k])) continue
      const derive = DERIVES_ETAPE.includes(k) || (completion && vide(ea?.[k]))
      out.push({ bloc: derive ? 'recalcul' : 'gamme', champ: titreEtape(eb, n) + ' · ' + k, cle: n, avant: normaliser(ea?.[k]), apres: normaliser(eb?.[k]) })
    }
  })
  A.forEach((ea: any, i: number) => { if (!pris[i]) { const n = String(ea?.ordre ?? i + 1); out.push({ bloc: 'gamme', champ: titreEtape(ea, n) + ' retirée', cle: n, avant: nomEtape(ea), apres: null, detail: resume(ea, horsEtape) }) } })
  return out
}

// ── Fournitures ───────────────────────────────────────────────────
// Remplacées EN BLOC à chaque enregistrement, avec un nouvel id : l'id ne vaut rien comme clé.
// Clé = catégorie + référence NORMALISÉE (ou désignation), doublons appariés dans l'ordre. Toutes
// les autres colonnes sont comparées ; les valeurs CALCULÉES partent en « recalcul ».
//
// Lot H1 (17/09/2026) — nouveau modèle de ligne : référence + désignation, SANS fournisseur ni
// qté/paquet, avec un prix unitaire ESTIMÉ (moyenne des prix catalogue de tous les fournisseurs
// portant la référence, cf. src/prix_moyen.ts). Deux conséquences ici :
//   1. `prix_unitaire` rejoint les DÉRIVÉES : ce n'est plus une saisie mais une copie datée d'un
//      calcul. Il reste tracé, dans le bloc « recalcul » — comme les taux d'atelier.
//   2. La BASCULE de l'ancien modèle vers le nouveau (le même article perd son fournisseur et sa
//      qté/paquet) est tracée par UNE entrée lisible, au lieu de « fournisseur BOSSARD → ∅ » +
//      « qte_paquet 100 → 0 » qui laisseraient croire à une saisie effacée. Le journal étant en
//      AJOUT SEUL, ces lignes parasites ne s'effaceraient jamais.
// Une qté/paquet RÉELLEMENT modifiée (100 → 50, fournisseur conservé) reste une saisie : bloc
// « fourniture », comme avant.
const horsFourn = (k: string) => k === 'id' || k === 'created_at' || k === 'nomenclature_id'
const DERIVES_FOURN = ['prix_total_par_piece', 'prix_unitaire']
// Champs de l'ANCIEN modèle de ligne (avant le lot H1) : le fournisseur choisi sur la ligne et le
// conditionnement recopié dans la nomenclature. Ils vivent désormais au catalogue fournisseur.
const CHAMPS_ANCIEN_MODELE = ['fournisseur', 'qte_paquet']
const LIB_ANCIEN_MODELE: Record<string, string> = { fournisseur: 'fournisseur', qte_paquet: 'qté par paquet' }
export function diffFournitures(avant: any[] | null, apres: any[] | null): Changement[] {
  const catF = (f: any) => {
    const brut = (f && f.categorie != null && f.categorie !== '') ? f.categorie : (f ? f.type_fourniture : '')
    return categorieFourniture(brut) || normaliserReference(brut)
  }
  const cleF = (f: any) => catF(f) + ' | ' + normaliserReference((f && f.ref_stock != null && String(f.ref_stock) !== '') ? f.ref_stock : (f ? f.designation : ''))
  const grouper = (l: any[]) => { const m = new Map<string, any[]>(); for (const f of (l || [])) { const k = cleF(f); if (!m.has(k)) m.set(k, []); m.get(k)!.push(f) } return m }
  const mA = grouper(avant || []), mB = grouper(apres || [])
  const cles: string[] = []
  mA.forEach((_v, k) => cles.push(k))
  mB.forEach((_v, k) => { if (!mA.has(k)) cles.push(k) })
  const out: Changement[] = []
  for (const k of cles) {
    const la = mA.get(k) || [], lb = mB.get(k) || []
    for (let i = 0; i < Math.max(la.length, lb.length); i++) {
      const fa = la[i], fb = lb[i]
      const nomF = String((fb || fa)?.ref_stock || (fb || fa)?.designation || '?')
      if (!fa) { out.push({ bloc: 'fourniture', champ: 'fourniture ajoutée', cle: k, avant: null, apres: nomF, detail: resume(fb, horsFourn) }); continue }
      if (!fb) { out.push({ bloc: 'fourniture', champ: 'fourniture retirée', cle: k, avant: nomF, apres: null, detail: resume(fa, horsFourn) }); continue }
      // Bascule vers le modèle « prix moyen » (lot H1) : l'ancienne ligne portait un fournisseur
      // et/ou une qté par paquet, la nouvelle n'en porte plus aucun → UNE entrée « recalcul ».
      const bascule = CHAMPS_ANCIEN_MODELE.some((c) => !vide(fa?.[c])) && CHAMPS_ANCIEN_MODELE.every((c) => vide(fb?.[c]))
      if (bascule) {
        const perdus: any = {}
        for (const c of CHAMPS_ANCIEN_MODELE) if (!vide(fa?.[c])) perdus[LIB_ANCIEN_MODELE[c] || c] = normaliser(fa[c])
        out.push({ bloc: 'recalcul', champ: nomF + ' · passage au prix moyen du catalogue (ancien modèle retiré)', cle: k, avant: perdus, apres: null })
      }
      for (const f of clesDe(fa, fb, horsFourn)) {
        if (bascule && CHAMPS_ANCIEN_MODELE.includes(f)) continue   // déjà résumé par l'entrée de bascule
        // La RÉFÉRENCE est l'identité de la ligne, et cette identité est normalisée (c'est la clé
        // d'appariement, et l'unicité imposée à l'écran comme au catalogue) : « T1 » re-choisie dans
        // la liste sous la forme « t1 » n'est pas une modification de la définition, juste une
        // écriture. Un vrai changement de référence donne une ligne retirée + une ligne ajoutée.
        if (f === 'ref_stock' && normaliserReference(fa[f]) === normaliserReference(fb[f])) continue
        if (pareil(fa[f], fb[f])) continue
        out.push({ bloc: DERIVES_FOURN.includes(f) ? 'recalcul' : 'fourniture', champ: nomF + ' · ' + f, cle: k, avant: normaliser(fa[f]), apres: normaliser(fb[f]) })
      }
    }
  }
  return out
}

// ── Composants d'une mère (lot H2, 18/09/2026) ────────────────────
// « l'ordre de fabrication sera toujours considéré du haut vers le bas » : l'ORDRE des composants
// est désormais une donnée de la définition. Avant H2, `composants` était comparé en bloc : une
// simple permutation donnait « Composants : [JSON] → [JSON] » (uuid compris), illisible.
// Identité d'une ligne : cleComposant (code, à défaut n° de nomenclature) + n° d'occurrence — deux
// fois la même fille s'apparient dans l'ordre, elles ne « s'échangent » jamais.
// Entrées : ajout, retrait, quantité, révision choisie (nom_id), et UNE SEULE entrée « Ordre de
// fabrication des composants » quand l'ordre relatif des lignes conservées change (« A, B, C » →
// « B, A, C »). `rang` n'est jamais comparé ligne à ligne (il découle de l'ordre). Les COPIES tirées
// de la fille (prix, indice et type à nom_id inchangé, code / n° hors identité) partent en « recalcul ».
// Complément H2 : une ligne d'avant H2 n'a ni `indice` ni `type_nom` ; le 1er enregistrement les
// recopie de la fille. Ce n'est pas une saisie : UNE seule entrée « recalcul » pour toute la liste
// (le journal est en ajout seul, deux lignes par composant ne s'effaceraient jamais).
const DERIVES_COMPOSANT = ['prix', 'indice', 'type_nom', 'code', 'num_nom']
const COMPLETES_H2 = ['indice', 'type_nom']
const horsComposant = (k: string) => k === 'rang' || k === 'qte' || k === 'nom_id' || k.startsWith('_')
const libComposant = (c: any) => String((c && (c.num_nom || c.code || c.nom_id)) || '?')
const resumeComposant = (c: any) => resume(c, (k: string) => k === 'rang' || k.startsWith('_'))
const lisibleComposant = (c: any) => libComposant(c) + ' × ' + String(normaliser(c?.qte) ?? 1) + (c?.indice ? ' (ind. ' + String(c.indice) + ')' : '') + (c?.type_nom === 'mere' ? ' [mère]' : '')
// Libellés DÉFINITIFS (journal en ajout seul) : lisibles par un auditeur — n° de nomenclature et indice, jamais
// l'id interne (un uuid en production, gardé dans `detail`), jamais un « ? » pour un indice absent.
const revisionComposant = (c: any) => libComposant(c) + ' — ' + (String(c?.indice ?? '').trim() ? 'ind. ' + String(c.indice).trim() : 'indice non renseigné')
const typeLisible = (t: any) => (String(t) === 'mere' ? 'mère' : String(t))

export function diffComposants(avant: any, apres: any): Changement[] {
  const A = composantsOrdonnes(avant), B = composantsOrdonnes(apres)
  const numeroter = (l: any[]) => { const n = new Map<string, number>(); return l.map((c) => { const k = cleComposant(c) || ('#' + String(c.nom_id || '')); const i = (n.get(k) || 0) + 1; n.set(k, i); return k + '#' + i }) }
  const cA = numeroter(A), cB = numeroter(B)
  const indexA = new Map<string, number>(cA.map((k, i) => [k, i]))
  const paire = cB.map((k) => (indexA.has(k) ? (indexA.get(k) as number) : -1))
  const pris = new Set<number>(paire.filter((i) => i >= 0))
  const out: Changement[] = []
  const completes: string[] = []
  const suite = paire.filter((i) => i >= 0)
  if (suite.some((v, k) => k > 0 && v < suite[k - 1])) out.push({ bloc: 'fiche', champ: 'Ordre de fabrication des composants', avant: A.map(libComposant).join(', '), apres: B.map(libComposant).join(', ') })
  B.forEach((cb: any, j: number) => {
    const i = paire[j], X = libComposant(cb)
    if (i < 0) { out.push({ bloc: 'fiche', champ: 'Composant ajouté « ' + X + ' »', cle: cB[j], avant: null, apres: lisibleComposant(cb), detail: resumeComposant(cb) }); return }
    const ca: any = A[i]
    if (!pareil(ca.qte, cb.qte)) out.push({ bloc: 'fiche', champ: 'Composant « ' + X + ' » — quantité', cle: cB[j], avant: normaliser(ca.qte), apres: normaliser(cb.qte) })
    const autreRevision = !pareil(ca.nom_id, cb.nom_id)
    if (autreRevision) out.push({ bloc: 'fiche', champ: 'Composant « ' + X + ' » — révision', cle: cB[j], avant: revisionComposant(ca), apres: revisionComposant(cb), detail: { nom_id_avant: ca.nom_id ?? null, nom_id_apres: cb.nom_id ?? null } })
    const complete = COMPLETES_H2.filter((k) => vide(ca[k]) && !vide(cb[k]))
    if (complete.length) completes.push(X + ' : ' + complete.map((k) => (k === 'indice' ? 'ind. ' + String(cb[k]) : typeLisible(cb[k]))).join(', '))
    for (const k of clesDe(ca, cb, horsComposant)) {
      if (autreRevision && k === 'indice') continue                     // déjà dans l'entrée « révision »
      if (complete.includes(k)) continue                                // complément H2, résumé plus bas
      if ((k === 'code' || k === 'num_nom') && String(ca[k] ?? '').trim().toLowerCase() === String(cb[k] ?? '').trim().toLowerCase()) continue
      if (pareil(ca[k], cb[k])) continue
      out.push({ bloc: DERIVES_COMPOSANT.includes(k) ? 'recalcul' : 'fiche', champ: 'Composant « ' + X + ' » · ' + k, cle: cB[j], avant: normaliser(ca[k]), apres: normaliser(cb[k]) })
    }
  })
  A.forEach((ca: any, i: number) => { if (!pris.has(i)) out.push({ bloc: 'fiche', champ: 'Composant retiré « ' + libComposant(ca) + ' »', cle: cA[i], avant: lisibleComposant(ca), apres: null, detail: resumeComposant(ca) }) })
  if (completes.length) out.push({ bloc: 'recalcul', champ: 'Composants · indice et type complétés automatiquement (pas une saisie)', avant: null, apres: completes.join(' ; ') })
  return out
}
