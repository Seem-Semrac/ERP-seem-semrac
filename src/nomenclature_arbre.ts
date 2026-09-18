// ═══════════════════════════════════════════════════════════════════════════
// ARBRE DES NOMENCLATURES MÈRES ET DES SOUS-LOTS — module PUR (lot H2, 18/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
// « dans les nomenclatures mères, il faut pouvoir changer l'ordre des pièces et les ordonnancer dans
//   l'ordre qu'on veut, l'ordre de fabrication sera toujours considéré du haut vers le bas. lors de
//   fabrication de nomenclatures mères envoyées en prod le lot pièce mère contient des sous lots qui
//   sont les nomenclatures filles, si dans les nomenclatures filles il y a des nomenclatures mères elle
//   aura donc des sous sous lots. » (18/09/2026)
//
// Ce module dit CE QU'EST l'arbre ; index.tsx / queries.ts décident QUAND l'écrire ; be.tsx /
// prod.tsx l'affichent (au RENDU serveur uniquement : il n'est JAMAIS ré-émis au navigateur, à la
// différence de src/prix_moyen.ts — les deux miroirs client prévus par le contrat, tri des composants
// par rang et clé de tri de goulotte, font trois lignes chacun et sont commentés sur place).
// Aucune dépendance à Hono ni à Supabase ; seuls imports : composantsDe et estAnnule (shared.ts).
//
// Trois familles de fonctions :
//   1. COMPOSANTS d'une mère : lecture ordonnée (l'ordre du tableau = l'ordre de fabrication, du haut
//      vers le bas), normalisation avant écriture, déplacement ▲▼.
//   2. CONTRÔLES à l'enregistrement : cycle (A contient B qui contient A) et profondeur (5 niveaux au
//      plus, racine comprise), jugés sur l'IDENTITÉ d'une nomenclature (son code), pas sur une révision.
//   3. PRODUCTION : développement d'une mère en arbre de sous-lots (qté cumulée, rang = ordre de
//      fabrication), numérotation LOT-…-ZZ.RR.RR, idempotence, tri, avancement et vigilance.
//
// Numérotation (contrat H2 §4) : la racine reste LOT-YYYY-AFF-ZZ (fmtLotId, index.tsx) ; un sous-lot
// ajoute « .RR » (rang parmi ses frères, 2 chiffres) : LOT-2026-0001-01.02, puis LOT-2026-0001-01.02.01.
// Le POINT a été choisi parce qu'aucun analyseur existant ne le lit comme un n° de lot ou de morceau
// (/^LOT-(\d{4})-.+-(\d{2,})$/ ne reconnaît que les racines ; racineBdt ne retire que « -Mk »).

import { composantsDe, estAnnule } from './shared'

/** Niveaux au total, racine comprise : mère au niveau 0, feuilles au niveau 4 au plus. */
export const PROFONDEUR_MAX_NOMENCLATURE = 5

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ComposantMere {
  nom_id: string            // révision choisie au BE (traçabilité)
  code: string              // code_ref_produit de la fille (clé de résolution en production)
  num_nom: string
  qte: number               // > 0 ; invalide ou ≤ 0 ⇒ 1 (comportement actuel du client)
  rang: number              // 1..n, réécrit à chaque normalisation
  type_nom?: 'standard' | 'mere'
  indice?: string | null
  prix?: number             // copie INFORMATIVE (coût au moment du choix)
}

// 'revision_differente' : ajout du socle (précision §S3) — la production retient une autre révision
// que celle choisie au BE (A5 / risque 3). Simple information, jamais un refus.
export type CodeErreurArbre = 'cycle_composants' | 'profondeur_max' | 'composant_introuvable' | 'composant_non_valide' | 'revision_differente'
/** chemin = num_nom (à défaut code) lisibles, racine d'abord. `profondeur` / `max` : refus de profondeur seulement. */
export interface ErreurArbre { code: CodeErreurArbre; chemin: string[]; message: string; profondeur?: number; max?: number }
/** Résout un composant en nomenclature (ou null). `pourquoi` (facultatif) dit pourquoi il n'a rien trouvé. */
export type Resolveur = ((c: ComposantMere) => any | null) & { pourquoi?: (c: ComposantMere) => CodeErreurArbre }

export interface NoeudArbre {
  chemin: number[]          // rangs depuis la racine ([] = racine, [2,1] = 2e composant de la racine puis son 1er)
  niveau: number; rang: number; code: string
  nom: any | null           // nomenclature retenue (null = non résolue, le nœud et son sous-arbre ne sont pas lancés)
  qte_par_parent: number | null
  qte: number               // qte cumulée = qteSousLot(qte parent, qte_par_parent)
  enfants: NoeudArbre[]     // dans l'ordre des rangs
}
export interface ResultatArbre { racine: NoeudArbre; avertissements: ErreurArbre[] }

export interface LotPlan {
  id: string; lot_parent: string | null; rang: number; niveau: number
  piece: string             // racine : p.ref_interne || ref (comme aujourd'hui) ; sous-lot : nom.code_ref_produit || nom.num_nom
  qte: number; qte_par_parent: number | null
  nomenclature_id: string | null; nom: any
  existe?: boolean          // posé par attribuerIdsSousLots : l'id existe déjà en base (réutilisé)
  // posé par planCompletementLot : `nom` est bien la révision de CE lot (lots.nomenclature_id d'un sous-lot existant,
  // ou dernière révision validée d'un sous-lot nouveau). false = sous-lot existant sans révision connue : ne rien lui ajouter.
  nom_lance?: boolean
}

export interface OpLot { id: string; kind: 'BDT' | 'BDS'; statut: string; fini: boolean }

export interface ArbreLotVue {
  parent: { id: string; piece: string | null } | null
  racine: string; niveau: number; rang: number | null
  enfants: Array<{ id: string; piece: string | null; qte: number | null; statut: string | null; rang: number | null; niveau: number; fini: boolean; avancement: { total: number; soldes: number; pct: number } }>
  avancement_arbre: { total: number; soldes: number; pct: number }
  vigilance: string | null            // « sous-lots non terminés … »
  sous_lots_manquants: boolean        // nomenclature du lot = mère avec composants ET aucun enfant
  arbre_dispo: boolean                // colonnes cloud-14 présentes
  avertissement: string | null        // texte prêt à afficher (cloud-14 absent, composant non validé…)
  // Correctif H2 : le bouton « Créer les sous-lots » n'est proposé que s'il peut créer quelque chose.
  action_creer: boolean               // base à jour, lot ouvert, au moins un composant VALIDÉ sans sous-lot
  lot_clos: string | null             // « le lot racine … est libéré » … : production close, aucune création
  lot_termine: boolean                // le lot (ou sa racine) est « terminé » : création après confirmation explicite
  composants_bloques: Array<{ rang: number; libelle: string; raison: 'composant_non_valide' | 'composant_introuvable' }>
}

// ─── Petits outils ───────────────────────────────────────────────────────────
const txt = (v: any): string => (v == null ? '' : String(v)).trim()
const bas = (v: any): string => txt(v).toLowerCase()
const pad2 = (n: number): string => String(n).padStart(2, '0')
const nombreFini = (v: any): number | null => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null }
/** Quantité d'un composant : nombre > 0, sinon 1 (« 0,5 » accepté). */
function qteValide(v: any): number {
  const n = Number(typeof v === 'string' ? v.replace(',', '.').trim() : v)
  return Number.isFinite(n) && n > 0 ? n : 1
}
const estMere = (n: any): boolean => !!n && txt(n.type_nom) === 'mere'
const estValidee = (n: any): boolean => !!n && txt(n.statut) === 'valide'
/** Libellé lisible d'une nomenclature : num_nom, à défaut code produit, à défaut id. */
const libNom = (n: any): string => txt(n?.num_nom) || txt(n?.code_ref_produit) || txt(n?.id) || '?'
/** Libellé lisible d'un composant non résolu. */
const libComposant = (c: any): string => txt(c?.num_nom) || txt(c?.code) || txt(c?.nom_id) || '?'
/** Pièce portée par un sous-lot : code produit de la fille, à défaut son n° de nomenclature. */
const pieceDuNom = (n: any): string => txt(n?.code_ref_produit) || txt(n?.num_nom)

// Comparaison d'indices de révision : A < B < … < Z < AA (longueur d'abord), vide = A.
// Sur des indices d'une lettre (tous ceux que crée « nouvel-indice »), identique au `>` de _nomByCode.
function compareIndice(a: any, b: any): number {
  const x = txt(a).toUpperCase() || 'A', y = txt(b).toUpperCase() || 'A'
  if (x.length !== y.length) return x.length - y.length
  return x < y ? -1 : x > y ? 1 : 0
}
/** La révision la plus haute d'une liste (indice max ; à égalité : validée, puis la plus récente, puis l'id). */
function plusHaute(liste: any[]): any | null {
  let best: any = null
  for (const n of liste || []) {
    if (!n) continue
    if (!best) { best = n; continue }
    const c = compareIndice(n.indice, best.indice)
    if (c > 0) { best = n; continue }
    if (c < 0) continue
    const v = (estValidee(n) ? 1 : 0) - (estValidee(best) ? 1 : 0)
    if (v > 0) { best = n; continue }
    if (v < 0) continue
    const d = txt(n.created_at).localeCompare(txt(best.created_at))
    if (d > 0 || (d === 0 && txt(n.id) > txt(best.id))) best = n
  }
  return best
}

// ═══ 1. COMPOSANTS D'UNE MÈRE ═══════════════════════════════════════════════

/** Clé d'identité d'une nomenclature : lower(trim(code_ref_produit || num_nom)) — même clé que _nomByCode (index.tsx). */
export function cleNomenclature(n: any): string {
  return (txt(n?.code_ref_produit) || txt(n?.num_nom)).toLowerCase()
}
/** Clé d'un composant : lower(trim(code || num_nom)). */
export function cleComposant(c: any): string {
  return (txt(c?.code) || txt(c?.num_nom)).toLowerCase()
}
// Identité d'un nœud pour les contrôles : sa clé, à défaut son id (fiche sans code ni n°).
const identite = (n: any): string => cleNomenclature(n) || ('#' + txt(n?.id))

function versComposant(c: any, rang: number): ComposantMere {
  return { ...c, nom_id: txt(c.nom_id), code: txt(c.code), num_nom: txt(c.num_nom), qte: qteValide(c.qte), rang }
}

/**
 * Lecture : tableau, chaîne JSON ou objet { composants } (via composantsDe). Ordre = `rang` si TOUS les
 * éléments ont un rang entier ≥ 1 distinct, sinon ordre du tableau (données d'avant H2 : pas de rang).
 * Écarte les éléments qui ne désignent rien (ni nom_id, ni code, ni num_nom — précision §S1). Réécrit
 * rang = 1..n. Rend des COPIES (l'entrée n'est jamais modifiée) ; les clés inconnues sont conservées.
 */
export function composantsOrdonnes(v: any): ComposantMere[] {
  const brut = composantsDe(v).filter((c: any) => c && typeof c === 'object' && !Array.isArray(c) && (txt(c.nom_id) || txt(c.code) || txt(c.num_nom)))
  const rangs = brut.map((c: any) => Number(c.rang))
  const parRang = brut.length > 0 && rangs.every((r) => Number.isInteger(r) && r >= 1) && new Set(rangs).size === rangs.length
  const ordre = brut.map((_c: any, i: number) => i)
  if (parRang) ordre.sort((i, j) => rangs[i] - rangs[j])
  return ordre.map((i, k) => versComposant(brut[i], k + 1))
}

/**
 * Écriture : ce que le serveur STOCKE (POST, PUT, nouvel-indice). composantsOrdonnes + champs nettoyés :
 * nom_id / code / num_nom en texte, qte > 0, rang 1..n, type_nom seulement 'standard' | 'mere',
 * indice texte (ou null), prix nombre fini (sinon retiré). Clés techniques « _… » retirées ; les autres
 * clés inconnues sont gardées (rien de ce qu'un client a écrit n'est perdu).
 */
export function normaliserComposants(v: any): ComposantMere[] {
  return composantsOrdonnes(v).map((c: any) => {
    const o: any = { nom_id: c.nom_id, code: c.code, num_nom: c.num_nom, qte: c.qte, rang: c.rang }
    const t = txt(c.type_nom)
    if (t === 'standard' || t === 'mere') o.type_nom = t
    if ('indice' in c) o.indice = txt(c.indice) || null
    const p = nombreFini(c.prix)
    if (p != null) o.prix = p
    for (const k of Object.keys(c)) {
      if (k in o || k.startsWith('_') || ['type_nom', 'indice', 'prix'].includes(k)) continue
      if (c[k] !== undefined) o[k] = c[k]
    }
    return o as ComposantMere
  })
}

/** Réordonnancement pur (copie), rangs réécrits 1..n. Indices hors bornes ⇒ copie inchangée. */
export function deplacerComposant(liste: ComposantMere[], de: number, vers: number): ComposantMere[] {
  const l = (Array.isArray(liste) ? liste : []).map((c) => ({ ...c }))
  const ok = (i: number) => Number.isInteger(i) && i >= 0 && i < l.length
  if (!ok(de) || !ok(vers)) return l
  const [x] = l.splice(de, 1)
  l.splice(vers, 0, x)
  return l.map((c, i) => ({ ...c, rang: i + 1 }))
}

// ═══ 2. RÉSOLUTION ET CONTRÔLES ═════════════════════════════════════════════

interface IndexNoms { parId: Map<string, any>; parCle: Map<string, any[]> }
function indexerNoms(toutes: any[]): IndexNoms {
  const parId = new Map<string, any>(), parCle = new Map<string, any[]>()
  for (const n of Array.isArray(toutes) ? toutes : []) {
    if (!n || typeof n !== 'object') continue
    const id = txt(n.id)
    if (id && !parId.has(id)) parId.set(id, n)
    const k = cleNomenclature(n)
    if (k) { const l = parCle.get(k); if (l) l.push(n); else parCle.set(k, [n]) }
  }
  return { parId, parCle }
}

/** Édition (contrôles BE) : révision nom_id si elle existe (tout statut), sinon dernière révision (indice max, tout statut) du même code. */
export function resolveurEdition(toutes: any[]): Resolveur {
  const ix = indexerNoms(toutes)
  const f: Resolveur = (c: ComposantMere) => {
    const id = txt(c?.nom_id)
    if (id && ix.parId.has(id)) return ix.parId.get(id)
    const k = cleComposant(c)
    const l = k ? ix.parCle.get(k) : undefined
    return l && l.length ? plusHaute(l) : null
  }
  f.pourquoi = () => 'composant_introuvable'
  return f
}

/**
 * Production (A5) : dernière révision VALIDÉE (indice max) du code du composant ; sinon celle du code
 * de la révision nom_id (fille renommée depuis le choix — précision §S2) ; sinon la révision nom_id si
 * elle est validée ; sinon null (`pourquoi` : introuvable si rien ne porte ce code ni cet id, sinon non validée).
 */
export function resolveurProduction(toutes: any[]): Resolveur {
  const ix = indexerNoms(toutes)
  const valideeDuCode = (k: string) => (k ? plusHaute((ix.parCle.get(k) || []).filter(estValidee)) : null)
  const f: Resolveur = (c: ComposantMere) => {
    const k1 = cleComposant(c)
    const r1 = valideeDuCode(k1)
    if (r1) return r1
    const id = txt(c?.nom_id)
    const parId = id ? ix.parId.get(id) : undefined
    if (parId) {
      const k2 = cleNomenclature(parId)
      if (k2 && k2 !== k1) { const r2 = valideeDuCode(k2); if (r2) return r2 }
      if (estValidee(parId)) return parId
    }
    return null
  }
  f.pourquoi = (c: ComposantMere) => {
    const id = txt(c?.nom_id), k = cleComposant(c)
    return (id && ix.parId.has(id)) || (k && ix.parCle.has(k)) ? 'composant_non_valide' : 'composant_introuvable'
  }
  return f
}

/** Dernière révision de chaque version_groupe (|| id), tout statut. */
export function dernieresRevisions(toutes: any[]): any[] {
  const groupes = new Map<string, any[]>()
  for (const n of Array.isArray(toutes) ? toutes : []) {
    if (!n || typeof n !== 'object') continue
    const g = txt(n.version_groupe) || txt(n.id)
    const l = groupes.get(g)
    if (l) l.push(n); else groupes.set(g, [n])
  }
  const out: any[] = []
  groupes.forEach((l) => { const b = plusHaute(l); if (b) out.push(b) })
  return out
}

// Graphe « contenu dans » : pour chaque identité, les identités des mères qui la contiennent.
// Mères prises en compte (précision §S2) : la dernière révision de chaque groupe (contrat) ET la
// dernière révision VALIDÉE de chaque code (celle que la production lancera) ; l'arête d'un composant va
// vers la révision résolue à l'édition ET vers celle de la production. Ensemble plus large que le seul
// « dernières révisions » : un ancêtre n'est jamais oublié, au prix d'un refus plus prudent.
interface Graphe { parents: Map<string, Set<string>>; libelles: Map<string, string> }
/**
 * Révisions « vivantes » (tout type) : la dernière de chaque version_groupe ET la dernière VALIDÉE de chaque code
 * (celle que la production lance). C'est l'ensemble des mères dont on protège les composants (graphe des
 * ancêtres, refus de suppression d'une fiche encore composant — correctif H2 : la production n'utilise pas
 * forcément la dernière révision d'un groupe).
 */
export function revisionsRetenues(toutes: any[]): any[] {
  const liste = Array.isArray(toutes) ? toutes.filter((n) => n && typeof n === 'object') : []
  const retenues = new Set<any>(dernieresRevisions(liste))
  indexerNoms(liste).parCle.forEach((l) => { const v = plusHaute(l.filter(estValidee)); if (v) retenues.add(v) })
  return Array.from(retenues)
}
function grapheParents(toutes: any[]): Graphe {
  const parents = new Map<string, Set<string>>(), libelles = new Map<string, string>()
  const liste = Array.isArray(toutes) ? toutes.filter((n) => n && typeof n === 'object') : []
  const retenues = new Set<any>(revisionsRetenues(liste))
  // Libellés : ceux de la révision la plus haute de chaque identité
  const parIdent = new Map<string, any[]>()
  for (const n of liste) { const k = identite(n); const l = parIdent.get(k); if (l) l.push(n); else parIdent.set(k, [n]) }
  parIdent.forEach((l, k) => libelles.set(k, libNom(plusHaute(l))))
  const resE = resolveurEdition(liste), resP = resolveurProduction(liste)
  retenues.forEach((m) => {
    if (!estMere(m)) return
    const km = identite(m)
    for (const c of composantsOrdonnes(m)) {
      const cibles = new Set<string>()
      const re = resE(c), rp = resP(c)
      if (re) cibles.add(identite(re))
      if (rp) cibles.add(identite(rp))
      if (!re && !rp) { const kc = cleComposant(c); if (kc) cibles.add(kc) }
      cibles.forEach((kc) => { if (kc === km) return; const s = parents.get(kc); if (s) s.add(km); else parents.set(kc, new Set([km])) })
    }
  })
  return { parents, libelles }
}
const identiteDeCode = (code: string): string => bas(code)

function ancetresDansGraphe(k: string, g: Graphe): string[] {
  const vus = new Set<string>([k]), out: string[] = []
  const file = [k]
  while (file.length) {
    const x = file.shift() as string
    g.parents.get(x)?.forEach((p) => { if (!vus.has(p)) { vus.add(p); out.push(p); file.push(p) } })
  }
  return out
}
// Plus longue chaîne d'ancêtres AU-DESSUS de k, le plus haut d'abord (k exclu). Mémo + garde de pile :
// un cycle déjà en base (données d'avant H2) ne fait pas boucler.
function chaineAncetres(k: string, g: Graphe, memo = new Map<string, string[]>(), pile = new Set<string>()): string[] {
  const m = memo.get(k)
  if (m) return m
  pile.add(k)
  let best: string[] = []
  g.parents.get(k)?.forEach((p) => {
    if (pile.has(p)) return
    const ch = chaineAncetres(p, g, memo, pile)
    if (ch.length + 1 > best.length) best = ch.concat([p])
  })
  pile.delete(k)
  memo.set(k, best)
  return best
}

/** Identités (cleNomenclature) de toutes les mères qui contiennent `code`, transitivement (précision §S2). */
export function ancetresDe(code: string, toutes: any[]): string[] {
  return ancetresDansGraphe(identiteDeCode(code), grapheParents(toutes))
}
/** Nombre de niveaux AU-DESSUS de `code` (0 si aucune mère ne le contient) : plus longue chaîne d'ancêtres. */
export function hauteurAncetres(code: string, toutes: any[]): number {
  return chaineAncetres(identiteDeCode(code), grapheParents(toutes)).length
}
/** { identité → ancêtres } pour toutes les nomenclatures (injecté par be.tsx pour exclure les choix cycliques). */
export function carteAncetres(toutes: any[]): Record<string, string[]> {
  const g = grapheParents(toutes)
  const out: Record<string, string[]> = {}
  g.libelles.forEach((_l, k) => { out[k] = ancetresDansGraphe(k, g) })
  return out
}

/**
 * Contrôle d'une fiche à enregistrer ({...avant, ...payload} pour un PUT). null si OK. Règles §9.1 :
 *   · seule une MÈRE est contrôlée (un standard n'a pas de composants) ;
 *   · la fiche REMPLACE sa version en base dans `toutes` (même id), ou s'y ajoute (POST) ;
 *   · cycle : un nœud dont l'identité figure déjà sur le chemin (racine comprise) ⇒ 'cycle_composants'.
 *     Chaque composant est suivi vers sa révision d'ÉDITION et vers sa révision de PRODUCTION si elle
 *     diffère (précision §S2) : un cycle que la production rencontrerait est refusé dès le BE ;
 *   · profondeur : hauteurAncetres + hauteur du sous-arbre (racine = 1) > max ⇒ 'profondeur_max' ;
 *   · composant introuvable : ignoré (pas de refus).
 */
export function controlerComposants(fiche: any, toutes: any[], opts?: { profondeurMax?: number }): ErreurArbre | null {
  if (!fiche || typeof fiche !== 'object' || !estMere(fiche)) return null
  const max = Number(opts?.profondeurMax) > 0 ? Math.floor(Number(opts?.profondeurMax)) : PROFONDEUR_MAX_NOMENCLATURE
  const idF = txt(fiche.id)
  const ensemble = (Array.isArray(toutes) ? toutes : []).filter((n) => n && typeof n === 'object' && !(idF && txt(n.id) === idF)).concat([fiche])
  const resE = resolveurEdition(ensemble), resP = resolveurProduction(ensemble)
  // Correctif H2 : + la DERNIÈRE révision (tout statut) du code du composant — celle qu'un collègue est en train de
  // modifier et que carteAncetres / grapheParents (exclusion côté client) voient déjà. Sans elle, le serveur était plus
  // faible que l'écran : un appel direct (ou un formulaire périmé) enregistrait un cycle entre révisions en cours.
  const ixE = indexerNoms(ensemble)
  const derniereDuCode = (c: ComposantMere): any | null => { const k = cleComposant(c); const l = k ? ixE.parCle.get(k) : undefined; return l && l.length ? plusHaute(l) : null }
  const candidats = (c: ComposantMere): any[] => {
    const out: any[] = []
    for (const r of [resE(c), resP(c), derniereDuCode(c)]) if (r && !out.includes(r)) out.push(r)
    return out
  }
  let cycle: ErreurArbre | null = null
  let plusLong: string[] = [libNom(fiche)]
  let budget = 50000                                   // garde-fou : arbre anormalement large
  const explorer = (n: any, cles: string[], libs: string[]) => {
    if (cycle || budget-- <= 0) return
    if (libs.length > plusLong.length) plusLong = libs.slice()
    if (!estMere(n)) return
    for (const c of composantsOrdonnes(n)) {
      for (const r of candidats(c)) {
        const k = identite(r), l = libNom(r), chemin = libs.concat([l])
        if (cles.includes(k)) {
          const retirer = chemin[1] || l
          cycle = { code: 'cycle_composants', chemin, message: 'Enregistrement refusé : une nomenclature mère ne peut pas se contenir elle-même. Chemin : ' + chemin.join(' › ') + '. Retirez « ' + retirer + ' » des composants.' }
          return
        }
        explorer(r, cles.concat([k]), chemin)
        if (cycle) return
      }
    }
  }
  explorer(fiche, [identite(fiche)], [libNom(fiche)])
  const refus = cycle as ErreurArbre | null          // (affecté dans la fermeture : TS ne le suit pas)
  if (refus) return refus
  const g = grapheParents(ensemble)
  const anc = chaineAncetres(identite(fiche), g).map((k) => g.libelles.get(k) || k)
  const profondeur = anc.length + plusLong.length
  if (profondeur > max) {
    const chemin = anc.concat(plusLong)
    return { code: 'profondeur_max', chemin, profondeur, max, message: 'Enregistrement refusé : imbrication trop profonde (' + profondeur + ' niveaux, ' + max + ' au plus). Chemin le plus long : ' + chemin.join(' › ') + '.' }
  }
  return null
}

// ═══ 3. PRODUCTION ═══════════════════════════════════════════════════════════

/** Qté d'un sous-lot : qté du parent × qté du composant, arrondie à l'entier supérieur, 1 au moins. */
export function qteSousLot(qteParent: number, qteComposant: number): number {
  return Math.max(1, Math.ceil(qteValide(qteParent) * qteValide(qteComposant) - 1e-9))
}

const LIMITE_NOEUDS = 2000

/**
 * Développe une mère en arbre (standard ⇒ racine seule). Enfants dans l'ordre des rangs. Un composant
 * non résolu reste dans l'arbre avec nom = null (non lancé, avertissement) ; un composant qui referme un
 * cycle ou qui dépasse la profondeur max est COUPÉ (absent de l'arbre, avertissement).
 * Options (précision §S4) : `niveauRacine` (développement depuis un sous-lot existant : la limite de
 * profondeur reste absolue) et `ancetres` (identités des nomenclatures au-dessus de la racine, pour
 * couper un cycle qui passerait par elles).
 */
export function developperArbre(mere: any, qteRacine: number, resoudre: Resolveur, opts?: { profondeurMax?: number; niveauRacine?: number; ancetres?: string[] }): ResultatArbre {
  const max = Number(opts?.profondeurMax) > 0 ? Math.floor(Number(opts?.profondeurMax)) : PROFONDEUR_MAX_NOMENCLATURE
  const niv0 = Math.max(0, Math.floor(Number(opts?.niveauRacine) || 0))
  const avertissements: ErreurArbre[] = []
  const racine: NoeudArbre = { chemin: [], niveau: niv0, rang: 0, code: pieceDuNom(mere), nom: mere ?? null, qte_par_parent: null, qte: qteValide(qteRacine), enfants: [] }
  let noeuds = 0, tropGrand = false
  const developper = (noeud: NoeudArbre, cles: string[], libs: string[]) => {
    if (!noeud.nom || !estMere(noeud.nom)) return
    const parentLib = libs[libs.length - 1]
    for (const c of composantsOrdonnes(noeud.nom)) {
      if (++noeuds > LIMITE_NOEUDS) {
        if (!tropGrand) avertissements.push({ code: 'profondeur_max', chemin: libs.slice(), message: 'Arbre de fabrication anormalement grand (plus de ' + LIMITE_NOEUDS + ' sous-lots) : développement arrêté sous « ' + parentLib + ' ».' })
        tropGrand = true
        return
      }
      const niveau = noeud.niveau + 1
      const r = resoudre(c) || null
      const lib = r ? libNom(r) : libComposant(c)
      const chemin = libs.concat([lib])
      if (niveau > max - 1) {
        avertissements.push({ code: 'profondeur_max', chemin, profondeur: niveau + 1, max, message: 'Imbrication trop profonde : « ' + lib + ' » serait au niveau ' + (niveau + 1) + ' (' + max + ' au plus) — il n’est pas lancé. Chemin : ' + chemin.join(' › ') + '.' })
        continue
      }
      const base: NoeudArbre = { chemin: noeud.chemin.concat([c.rang]), niveau, rang: c.rang, code: r ? pieceDuNom(r) : (txt(c.code) || txt(c.num_nom)), nom: null, qte_par_parent: c.qte, qte: qteSousLot(noeud.qte, c.qte), enfants: [] }
      if (!r) {
        const code: CodeErreurArbre = (resoudre.pourquoi && resoudre.pourquoi(c)) || 'composant_non_valide'
        avertissements.push({ code, chemin, message: code === 'composant_introuvable'
          ? 'Composant « ' + lib + ' » de « ' + parentLib + ' » introuvable : sous-lot non lancé.'
          : 'Composant « ' + lib + ' » de « ' + parentLib + ' » : aucune révision validée — sous-lot non lancé.' })
        noeud.enfants.push(base)
        continue
      }
      const k = identite(r)
      if (cles.includes(k)) {
        avertissements.push({ code: 'cycle_composants', chemin, message: 'Cycle dans les composants : ' + chemin.join(' › ') + ' — branche coupée, « ' + lib + ' » n’est pas relancé.' })
        continue
      }
      const choisi = txt(c.nom_id)
      if (choisi && txt(r.id) && choisi !== txt(r.id)) {
        avertissements.push({ code: 'revision_differente', chemin, message: 'Composant « ' + lib + ' » de « ' + parentLib + ' » : la production retient l’indice ' + (txt(r.indice) || 'A') + ' (dernière révision validée)' + (txt(c.indice) ? ', le BE avait choisi l’indice ' + txt(c.indice) : ', pas la révision choisie au BE') + '.' })
      }
      base.nom = r
      noeud.enfants.push(base)
      developper(base, cles.concat([k]), chemin)
    }
  }
  const cles0 = (Array.isArray(opts?.ancetres) ? (opts?.ancetres as string[]).map(bas).filter(Boolean) : []).concat([identite(mere)])
  developper(racine, cles0, [libNom(mere)])
  return { racine, avertissements }
}

/** Id d'un sous-lot : parentId + '.' + pad2(rang). */
export function idSousLot(parentId: string, rang: number): string {
  const r = Math.max(1, Math.floor(Number(rang) || 1))
  return txt(parentId) + '.' + pad2(r)
}
/** Un id de SOUS-lot : LOT-…-ZZ suivi d'au moins un « .RR ». */
export function estSousLot(lotId: any): boolean {
  return /^LOT-.+-\d{2,}(\.\d{2,})+$/.test(txt(lotId))
}
/** Parent déduit de l'id (retire le dernier « .RR ») ; null pour une racine ou un id non reconnu. */
export function lotParentDeId(lotId: any): string | null {
  const id = txt(lotId)
  return estSousLot(id) ? id.replace(/\.\d{2,}$/, '') : null
}
/** Parent d'une ligne lots : lot_parent, à défaut déduit de l'id (base sans cloud-14). Accepte aussi un id. */
export function parentDuLot(lot: any): string | null {
  if (lot == null) return null
  if (typeof lot !== 'object') return lotParentDeId(lot)
  return txt(lot.lot_parent) || lotParentDeId(lot.id)
}
/** Racine d'un id de lot : retire TOUS les « .RR » finaux (précision §S5 : un « . » dans le n° d'affaire est respecté). */
export function racineDuLot(lotId: any): string {
  const id = txt(lotId)
  return estSousLot(id) ? id.replace(/(\.\d{2,})+$/, '') : id
}
/** Niveau d'un lot : colonne niveau, à défaut nombre de « .RR » de l'id. Accepte aussi un id. */
export function niveauDuLot(lot: any): number {
  if (lot != null && typeof lot === 'object') {
    const n = nombreFini(lot.niveau)
    if (n != null && n >= 0) return Math.floor(n)
    return niveauDuLot(lot.id)
  }
  const id = txt(lot)
  if (!estSousLot(id)) return 0
  const m = /(\.\d{2,})+$/.exec(id)
  return m ? m[0].split('.').length - 1 : 0
}
/** Clé de tri de goulotte : « . » (0x2E) < « ~ » (0x7E) ⇒ un sous-lot passe AVANT son parent. */
export function cleTriFabrication(lotId: any): string {
  return String(lotId ?? '') + '~'
}
// Rang d'une ligne (ou d'un id) : colonne rang, à défaut suffixe de l'id (« .RR » d'un sous-lot, « -ZZ » d'une racine).
function rangDe(l: any): number | null {
  if (l != null && typeof l === 'object') { const r = nombreFini(l.rang); if (r != null) return r }
  const id = txt(l != null && typeof l === 'object' ? l.id : l)
  const m = estSousLot(id) ? /\.(\d{2,})$/.exec(id) : /-(\d{2,})$/.exec(id)
  return m ? Number(m[1]) : null
}
const cmpFreres = (a: any, b: any): number => {
  const ra = rangDe(a), rb = rangDe(b)
  const x = ra == null ? Infinity : ra, y = rb == null ? Infinity : rb
  if (x !== y) return x < y ? -1 : 1
  const ia = txt(a?.id), ib = txt(b?.id)
  return ia < ib ? -1 : ia > ib ? 1 : 0
}

function foret<T extends { id: string; rang?: number | null; lot_parent?: string | null }>(lots: T[]): { racines: T[]; enfants: Map<string, T[]> } {
  const liste = (Array.isArray(lots) ? lots : []).filter((l) => l && typeof l === 'object')
  const ids = new Set(liste.map((l) => txt(l.id)))
  const enfants = new Map<string, T[]>(), racines: T[] = []
  for (const l of liste) {
    const p = parentDuLot(l)
    if (p && p !== txt(l.id) && ids.has(p)) { const e = enfants.get(p); if (e) e.push(l); else enfants.set(p, [l]) }
    else racines.push(l)
  }
  enfants.forEach((e) => e.sort(cmpFreres))
  return { racines, enfants }
}

/** Post-ordre (ordre de FABRICATION) : frères par (rang ?? suffixe, id), chaque enfant avant son parent. */
export function trierOrdreFabrication<T extends { id: string; rang?: number | null; lot_parent?: string | null }>(lots: T[]): T[] {
  const { racines, enfants } = foret(lots)
  racines.sort((a, b) => { const x = cleTriFabrication(txt(a.id)), y = cleTriFabrication(txt(b.id)); return x < y ? -1 : x > y ? 1 : 0 })
  const out: T[] = [], vus = new Set<T>()
  const visiter = (l: T) => {
    if (vus.has(l)) return
    vus.add(l)
    for (const e of enfants.get(txt(l.id)) || []) visiter(e)
    out.push(l)
  }
  racines.forEach(visiter)
  for (const l of Array.isArray(lots) ? lots : []) if (l && typeof l === 'object' && !vus.has(l)) visiter(l)   // parenté circulaire (données corrompues)
  return out
}
/** Pré-ordre (AFFICHAGE en arbre) : parent puis enfants par rang. */
export function trierArborescence<T extends { id: string; rang?: number | null; lot_parent?: string | null }>(lots: T[]): T[] {
  const { racines, enfants } = foret(lots)
  racines.sort((a, b) => { const x = txt(a.id), y = txt(b.id); return x < y ? -1 : x > y ? 1 : 0 })
  const out: T[] = [], vus = new Set<T>()
  const visiter = (l: T) => {
    if (vus.has(l)) return
    vus.add(l)
    out.push(l)
    for (const e of enfants.get(txt(l.id)) || []) visiter(e)
  }
  racines.forEach(visiter)
  for (const l of Array.isArray(lots) ? lots : []) if (l && typeof l === 'object' && !vus.has(l)) visiter(l)
  return out
}

/**
 * Pré-ordre : racine, puis chaque enfant suivi de son sous-arbre, rangs croissants. Nœuds non résolus
 * (nom = null) exclus, avec leur sous-arbre. Ids = idSousLot(parent, rang) — à passer ENSUITE par
 * attribuerIdsSousLots (réutilisation de l'existant, collisions).
 */
export function planLotsArbre(lotRacineId: string, rangRacine: number, pieceRacine: string, arbre: ResultatArbre): LotPlan[] {
  const r = arbre.racine
  const idNom = (n: any) => (n && n.id != null && txt(n.id) ? txt(n.id) : null)
  const out: LotPlan[] = [{ id: txt(lotRacineId), lot_parent: null, rang: rangRacine, niveau: r.niveau, piece: String(pieceRacine ?? ''), qte: r.qte, qte_par_parent: null, nomenclature_id: idNom(r.nom), nom: r.nom }]
  const ajouter = (n: NoeudArbre, parentId: string) => {
    for (const e of n.enfants) {
      if (!e.nom) continue
      const id = idSousLot(parentId, e.rang)
      out.push({ id, lot_parent: parentId, rang: e.rang, niveau: e.niveau, piece: pieceDuNom(e.nom), qte: e.qte, qte_par_parent: e.qte_par_parent, nomenclature_id: idNom(e.nom), nom: e.nom })
      ajouter(e, id)
    }
  }
  ajouter(r, txt(lotRacineId))
  return out
}

/**
 * Idempotence. Pour chaque sous-lot du plan (pré-ordre) : réutilise l'id d'un sous-lot EXISTANT de même
 * (lot_parent, pièce normalisée, n-ième occurrence parmi ses frères — l'existant compté par rang puis id) ;
 * sinon idSousLot(parent, rang) s'il est libre, sinon le premier suffixe libre suivant. Réécrit lot_parent
 * des descendants quand un parent change d'id. Pose `existe` (true = id déjà en base). Un sous-lot
 * existant ANNULÉ est réutilisé comme les autres (rejouer ne recrée rien — précision §S6).
 */
export function attribuerIdsSousLots(plan: LotPlan[], existants: Array<{ id: string; lot_parent?: string | null; piece?: string | null }>): LotPlan[] {
  const ex = (Array.isArray(existants) ? existants : []).filter((e) => e && txt(e.id))
  const pris = new Set<string>(ex.map((e) => txt(e.id)))
  const enfantsEx = new Map<string, any[]>()
  for (const e of ex) {
    const p = parentDuLot(e)
    if (!p) continue
    const l = enfantsEx.get(p); if (l) l.push(e); else enfantsEx.set(p, [e])
  }
  enfantsEx.forEach((l) => l.sort(cmpFreres))
  const final = new Map<string, string>(), occ = new Map<string, number>(), utilises = new Set<string>()
  const out: LotPlan[] = []
  for (const l of Array.isArray(plan) ? plan : []) {
    if (!l.lot_parent) {
      final.set(l.id, l.id)
      out.push({ ...l, existe: pris.has(txt(l.id)) })
      continue
    }
    const parent = final.get(l.lot_parent) ?? l.lot_parent
    const pc = bas(l.piece)
    const cleOcc = parent + '|' + pc
    const n = occ.get(cleOcc) || 0
    occ.set(cleOcc, n + 1)
    const memes = (enfantsEx.get(parent) || []).filter((e) => bas(e.piece) === pc)
    let id: string | null = null, existe = false
    if (n < memes.length && !utilises.has(txt(memes[n].id))) { id = txt(memes[n].id); existe = true }
    if (!id) {
      let r = Math.max(1, Math.floor(Number(l.rang) || 1))
      id = idSousLot(parent, r)
      while (pris.has(id) || utilises.has(id)) { r++; id = idSousLot(parent, r) }
    }
    utilises.add(id); pris.add(id)
    final.set(l.id, id)
    out.push({ ...l, id, lot_parent: parent, existe })
  }
  return out
}

/**
 * Plan de « Créer les sous-lots » depuis un lot EXISTANT (correctif H2, traçabilité EN 9100). Un sous-lot DÉJÀ en
 * base garde la révision retenue à SON lancement (`lots.nomenclature_id`) : ses bons manquants et son sous-arbre en
 * découlent — jamais d'une révision validée depuis (une étape renumérotée aurait été recréée en double au planning,
 * et le lot ne dirait plus d'où viennent ses bons). Seuls les sous-lots NOUVEAUX prennent la dernière révision
 * validée (resolveurProduction). Ids et idempotence : attribuerIdsSousLots, appliqué à chaque sous-arbre.
 * `existants` : lignes `lots` (au moins celles de l'affaire). Pré-ordre, la racine (le lot lui-même) en tête.
 */
export function planCompletementLot(
  racine: { id: string; rang: number; piece: string; qte: number; niveau: number; nom: any },
  toutes: any[], existants: any[], opts?: { ancetres?: string[]; profondeurMax?: number },
): { plan: LotPlan[]; avertissements: ErreurArbre[] } {
  const resP = resolveurProduction(toutes)
  const parIdNom = indexerNoms(toutes).parId
  const parIdLot = new Map<string, any>()
  for (const l of Array.isArray(existants) ? existants : []) if (l && txt(l.id) && !parIdLot.has(txt(l.id))) parIdLot.set(txt(l.id), l)
  const avertissements: ErreurArbre[] = []
  const vus = new Set<string>()
  const noter = (e: ErreurArbre) => { const k = e.code + '|' + e.message; if (!vus.has(k)) { vus.add(k); avertissements.push(e) } }
  const developper = (r: { id: string; rang: number; piece: string; qte: number; niveau: number; nom: any }, ancetres: string[], garde: number): LotPlan[] => {
    const arbre = developperArbre(r.nom, r.qte, resP, { niveauRacine: r.niveau, ancetres, profondeurMax: opts?.profondeurMax })
    arbre.avertissements.forEach(noter)
    const plan = attribuerIdsSousLots(planLotsArbre(r.id, r.rang, r.piece, arbre), existants)
    const out: LotPlan[] = [{ ...plan[0], nom_lance: true }]
    const chaine = new Map<string, string[]>([[plan[0].id, ancetres.concat([identite(r.nom)])]])
    const remplaces = new Set<string>()
    for (const e of plan.slice(1)) {
      if (e.lot_parent && remplaces.has(e.lot_parent)) { remplaces.add(e.id); continue }   // sous-arbre redéveloppé plus haut
      const chaineParent = chaine.get(String(e.lot_parent)) || ancetres
      const ligne = e.existe ? parIdLot.get(txt(e.id)) : null
      if (ligne) {
        const idLance = txt(ligne.nomenclature_id)
        const lance = idLance ? parIdNom.get(idLance) : null
        if (!lance) {
          // Sous-lot existant dont la révision de lancement est inconnue : on ne lui ajoute rien (ni bon ni sous-lot).
          out.push({ ...e, nom_lance: false })
          remplaces.add(e.id)
          continue
        }
        if (txt(lance.id) !== txt(e.nom?.id) && garde < 12) {
          const qte = Number(ligne.qte_initiale) > 0 ? Number(ligne.qte_initiale) : e.qte
          const sous = developper({ id: e.id, rang: e.rang, piece: txt(ligne.piece) || e.piece, qte, niveau: e.niveau, nom: lance }, chaineParent, garde + 1)
          out.push({ ...sous[0], lot_parent: e.lot_parent, qte_par_parent: e.qte_par_parent, existe: true, nomenclature_id: idLance, nom_lance: true })
          out.push(...sous.slice(1))
          remplaces.add(e.id)
          continue
        }
      }
      chaine.set(e.id, chaineParent.concat([identite(e.nom)]))
      out.push({ ...e, nom_lance: true })
    }
    return out
  }
  const anc = (Array.isArray(opts?.ancetres) ? (opts?.ancetres as string[]) : []).map(bas).filter(Boolean)
  return { plan: developper({ ...racine, piece: String(racine.piece ?? '') }, anc, 0), avertissements }
}

/** Id de bon d'un lot : kind + lotId sans « LOT » + '-' + pad2(aa). Pour une racine = fmtBonId (index.tsx). */
export function bonIdDuLot(kind: 'BDT' | 'BDS', lotId: string, aa: number): string {
  return kind + String(lotId).slice(3) + '-' + pad2(aa)
}
/** Clé d'idempotence d'un bon : racine INCHANGÉE (aff|pièce|seq) ; sous-lot : + |lotRef. */
export function cleBon(aff: any, piece: any, seq: any, lotRef: any): string {
  return estSousLot(lotRef) ? `${aff}|${piece}|${seq}|${txt(lotRef)}` : `${aff}|${piece}|${seq}`
}

// ═══ 4. AVANCEMENT ET VIGILANCE ══════════════════════════════════════════════

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
// Mêmes sens que opSoldee (gamme.ts), recopiés ici (import interdit par le contrat) : un BDT « reçu »
// est COMMENCÉ, pas fini ; un BDS « reçu » est REVENU du sous-traitant (fini), la date de retour effective fait foi.
function bdtFini(b: any): boolean {
  const s = sansAccent(bas(b?.statut))
  return /^sold/.test(s) || ['termine', 'cloture', 'fini'].includes(s)
}
function bdsFini(b: any): boolean {
  if (txt(b?.date_retour_effective)) return true
  const s = sansAccent(bas(b?.statut))
  return s === 'recu' || /^sold/.test(s) || ['termine', 'cloture', 'fini'].includes(s)
}

/** Ops par lot. Clé = lot_id || lot_ref. BDT fini : soldé / terminé. BDS fini : reçu / soldé (ou retour effectif). Annulées exclues. */
export function opsParLot(bdts: any[], bdss: any[]): Record<string, OpLot[]> {
  const out: Record<string, OpLot[]> = {}
  const ajouter = (o: any, kind: 'BDT' | 'BDS') => {
    if (!o || estAnnule(o.statut)) return
    const k = txt(o.lot_id) || txt(o.lot_ref)
    if (!k) return
    ;(out[k] = out[k] || []).push({ id: txt(o.id), kind, statut: txt(o.statut), fini: kind === 'BDT' ? bdtFini(o) : bdsFini(o) })
  }
  for (const b of Array.isArray(bdts) ? bdts : []) ajouter(b, 'BDT')
  for (const b of Array.isArray(bdss) ? bdss : []) ajouter(b, 'BDS')
  return out
}

// Index (enfants directs, parents, « fini » mémorisé), mis en cache par identité du tableau `lots` :
// la vigilance est demandée BDT par BDT sur tout le planning. Reconstruit si `ops` change ou si la
// longueur de `lots` change. ⚠ Un tableau modifié EN PLACE (statut d'un lot…) entre deux appels doit
// être recopié ([...lots]) pour invalider le cache.
interface IndexLots { ops: Record<string, OpLot[]>; n: number; nOps: number; parId: Map<string, any>; enfants: Map<string, string[]>; parent: Map<string, string>; finis: Map<string, boolean> }
const CACHE_INDEX = new WeakMap<object, IndexLots>()
function indexLots(lots: any[], ops?: Record<string, OpLot[]> | null): IndexLots {
  const L = Array.isArray(lots) ? lots : []
  const O = ops && typeof ops === 'object' ? ops : {}
  const nOps = Object.keys(O).length
  const c = CACHE_INDEX.get(L)
  if (c && c.ops === O && c.n === L.length && c.nOps === nOps) return c
  const parId = new Map<string, any>(), enfants = new Map<string, string[]>(), parent = new Map<string, string>()
  for (const l of L) { if (l && typeof l === 'object') { const id = txt(l.id); if (id && !parId.has(id)) parId.set(id, l) } }
  const lier = (id: string, p: string | null) => {
    if (!p || p === id) return
    parent.set(id, p)
    const e = enfants.get(p)
    if (!e) enfants.set(p, [id]); else if (!e.includes(id)) e.push(id)
  }
  parId.forEach((l, id) => { if (estAnnule(l.statut)) { const p = parentDuLot(l); if (p) parent.set(id, p); return } lier(id, parentDuLot(l)) })
  for (const k of Object.keys(O)) if (!parId.has(k)) lier(k, lotParentDeId(k))   // sous-lot connu seulement par ses bons
  enfants.forEach((e) => e.sort((a, b) => cmpFreres(parId.get(a) || { id: a }, parId.get(b) || { id: b })))
  const ix: IndexLots = { ops: O, n: L.length, nOps, parId, enfants, parent, finis: new Map() }
  CACHE_INDEX.set(L, ix)
  return ix
}
const opsDe = (ix: IndexLots, id: string): OpLot[] => (ix.ops[id] || []).filter((o) => o && !estAnnule(o.statut))
function finiIx(ix: IndexLots, id: string, pile = new Set<string>()): boolean {
  const m = ix.finis.get(id)
  if (m !== undefined) return m
  if (pile.has(id)) return true                       // parenté circulaire : on ne boucle pas
  pile.add(id)
  const r = opsDe(ix, id).every((o) => o.fini) && (ix.enfants.get(id) || []).every((e) => finiIx(ix, e, pile))
  pile.delete(id)
  ix.finis.set(id, r)
  return r
}
function descendantsIx(ix: IndexLots, id: string): string[] {
  const out: string[] = [], vus = new Set<string>([id])
  const visiter = (x: string) => { for (const e of ix.enfants.get(x) || []) { if (vus.has(e)) continue; vus.add(e); out.push(e); visiter(e) } }
  visiter(id)
  return out
}
const pct = (s: number, t: number) => (t > 0 ? Math.round((s * 100) / t) : 0)
function avancementIx(ix: IndexLots, id: string) {
  const propres = opsDe(ix, id)
  let total = propres.length, soldes = propres.filter((o) => o.fini).length
  for (const d of descendantsIx(ix, id)) { const o = opsDe(ix, d); total += o.length; soldes += o.filter((x) => x.fini).length }
  const ps = propres.filter((o) => o.fini).length
  return { total, soldes, pct: pct(soldes, total), propre: { total: propres.length, soldes: ps, pct: pct(ps, propres.length) } }
}

/** Descendants connus (pré-ordre, rangs croissants) : lots dont parentDuLot remonte à lotId, et ids vus seulement dans les ops. Lots annulés exclus. */
export function descendantsDe(lotId: string, lots: any[], ops?: Record<string, OpLot[]>): string[] {
  return descendantsIx(indexLots(lots, ops), txt(lotId))
}
/** Fini : toutes SES ops finies ET tous ses enfants directs finis (récursivement). Sans op ni enfant : true. */
export function lotFini(lotId: string, lots: any[], ops: Record<string, OpLot[]>): boolean {
  return finiIx(indexLots(lots, ops), txt(lotId))
}
/** Enfants DIRECTS non finis, dans l'ordre de fabrication. */
export function sousLotsNonTermines(lotId: string, lots: any[], ops: Record<string, OpLot[]>): string[] {
  const ix = indexLots(lots, ops)
  return (ix.enfants.get(txt(lotId)) || []).filter((e) => !finiIx(ix, e))
}
/** Avancement de l'arbre (le lot + tous ses descendants) et du lot seul (`propre`). pct = 0 sans op. */
export function avancementArbre(lotId: string, lots: any[], ops: Record<string, OpLot[]>): { total: number; soldes: number; pct: number; propre: { total: number; soldes: number; pct: number } } {
  return avancementIx(indexLots(lots, ops), txt(lotId))
}
function texteVigilance(ix: IndexLots, id: string): string | null {
  const enf = ix.enfants.get(id) || []
  if (!enf.length) return null
  const nf = enf.filter((e) => !finiIx(ix, e))
  if (!nf.length) return null
  return 'sous-lots non terminés (' + nf.length + '/' + enf.length + ') : ' + nf.slice(0, 3).join(', ') + (nf.length > 3 ? ' +' + (nf.length - 3) : '')
}
/**
 * Vigilance d'un BDT (ou BDS) : null si son lot (lot_id || lot_ref) n'a pas d'enfant non fini, sinon
 * « sous-lots non terminés (2/3) : LOT-…-01.01, LOT-…-01.03 » — 2 non terminés sur 3 sous-lots directs,
 * 3 ids au plus puis « +n ». Une information : rien n'est retiré du planning (règle du 10/09).
 */
export function vigilanceSousLots(bdt: any, lots: any[], ops: Record<string, OpLot[]>): string | null {
  const k = txt(bdt?.lot_id) || txt(bdt?.lot_ref)
  if (!k) return null
  return texteVigilance(indexLots(lots, ops), k)
}

// Statut d'un lot qui ferme toute (re)création de sous-lots : la production est close (libéré, expédié, livré) ou abandonnée.
const STATUTS_LOT_CLOS: Record<string, string> = { libere: 'libéré', expedie: 'expédié', livre: 'livré' }
/** null si le lot (et sa racine) accepte encore des sous-lots, sinon « le lot racine LOT-… est libéré ». */
export function motifLotClos(lot: any, racine?: any | null): string | null {
  const cibles: Array<[string, any]> = [['ce lot', lot]]
  if (racine && racine !== lot && txt(racine.id) !== txt(lot?.id)) cibles.push(['son lot racine ' + txt(racine.id), racine])
  for (const [qui, l] of cibles) {
    if (!l) continue
    if (estAnnule(l.statut)) return qui + ' est annulé'
    const s = sansAccent(bas(l.statut))
    if (STATUTS_LOT_CLOS[s]) return qui + ' est ' + STATUTS_LOT_CLOS[s]
  }
  return null
}
/** Le lot ou sa racine est « terminé » (création possible, mais sur confirmation explicite : elle relance production et achats). */
export function lotOuRacineTermine(lot: any, racine?: any | null): boolean {
  return [lot, racine].some((l) => !!l && ['termine', 'fini'].includes(sansAccent(bas(l.statut))))
}

/**
 * Tout ce qu'une fiche lot / un OF affiche de l'arbre d'un lot.
 * `noms` (toutes les nomenclatures, facultatif) : les composants sont résolus comme en production
 * (resolveurProduction) pour NOMMER ceux qui ne peuvent pas avoir de sous-lot (aucune révision validée,
 * introuvable) et ne proposer « Créer les sous-lots » que s'il reste un composant validé sans sous-lot.
 */
export function vueArbreLot(lotId: string, lots: any[], ops: Record<string, OpLot[]>, opts: { nomLot?: any; arbreDispo: boolean; noms?: any[] }): ArbreLotVue {
  const id = txt(lotId)
  const ix = indexLots(lots, ops)
  const lot = ix.parId.get(id) || null
  const parentDe = (x: string): string | null => ix.parent.get(x) ?? parentDuLot(ix.parId.get(x) || x)
  const pId = parentDe(id)
  let racine = id
  for (let x = pId, garde = 0; x && garde < 20; x = parentDe(x), garde++) racine = x
  const enfants = (ix.enfants.get(id) || []).map((eid) => {
    const l = ix.parId.get(eid) || null
    const a = avancementIx(ix, eid)
    return { id: eid, piece: l && l.piece != null ? String(l.piece) : null, qte: l ? nombreFini(l.qte) : null, statut: l && l.statut != null ? String(l.statut) : null, rang: rangDe(l || eid), niveau: niveauDuLot(l || eid), fini: finiIx(ix, eid), avancement: { total: a.total, soldes: a.soldes, pct: a.pct } }
  })
  const av = avancementIx(ix, id)
  const nom = opts?.nomLot || null
  const comps = nom && estMere(nom) ? composantsOrdonnes(nom) : []
  const nbComp = comps.length
  const manquants = nbComp > 0 && enfants.length === 0
  const arbreDispo = !!opts?.arbreDispo
  const racineLot = ix.parId.get(racine) || null
  const clos = motifLotClos(lot, racineLot)
  const termine = !clos && lotOuRacineTermine(lot, racineLot)
  // Composants sans sous-lot : appariés aux enfants EXISTANTS (annulés compris, comme attribuerIdsSousLots) par pièce.
  const bloques: ArbreLotVue['composants_bloques'] = []
  let creables = 0
  if (nbComp > 0 && Array.isArray(opts?.noms)) {
    const res = resolveurProduction(opts.noms as any[])
    const reste = new Map<string, number>()
    for (const l of Array.isArray(lots) ? lots : []) if (l && typeof l === 'object' && parentDuLot(l) === id) reste.set(bas(l.piece), (reste.get(bas(l.piece)) || 0) + 1)
    for (const c of comps) {
      const r = res(c)
      if (!r) { bloques.push({ rang: c.rang, libelle: libComposant(c), raison: (res.pourquoi && res.pourquoi(c)) === 'composant_introuvable' ? 'composant_introuvable' : 'composant_non_valide' }); continue }
      const k = bas(pieceDuNom(r)), n = reste.get(k) || 0
      if (n > 0) reste.set(k, n - 1); else creables++
    }
  } else creables = Math.max(0, nbComp - enfants.length)
  const parties: string[] = []
  if (nbComp > 0 && (creables > 0 || bloques.length)) {
    if (!arbreDispo) parties.push('Pièce mère : sous-lots non créés — la base doit être mise à jour (script cloud-14, à faire par l’administrateur). La mère est lancée seule, comme avant.')
    else if (clos) parties.push('Pièce mère sans ' + (manquants ? 'ses' : 'tous ses') + ' sous-lots (affaire lancée avant leur gestion) — ' + clos + ' : aucun sous-lot ne sera créé.')
    else {
      if (creables > 0) parties.push('Pièce mère : ' + creables + ' composant' + (creables > 1 ? 's' : '') + ' sur ' + nbComp + ' sans sous-lot (affaire lancée avant la gestion des sous-lots, ou composant validé depuis) — « Créer les sous-lots » ' + (creables > 1 ? 'les crée' : 'le crée') + '.' + (termine ? ' Ce lot est déjà terminé : la création demandera une confirmation.' : ''))
      for (const b of bloques) parties.push(b.raison === 'composant_introuvable'
        ? 'Composant « ' + b.libelle + ' » (rang ' + b.rang + ') introuvable au BE : corrigez la nomenclature mère — pas de sous-lot possible.'
        : 'Composant « ' + b.libelle + ' » (rang ' + b.rang + ') : aucune révision validée — faites-la valider au BE, puis « Créer les sous-lots ».')
    }
  }
  const avertissement: string | null = parties.length ? parties.join(' ') : null
  return {
    parent: pId ? { id: pId, piece: ix.parId.get(pId)?.piece != null ? String(ix.parId.get(pId).piece) : null } : null,
    racine, niveau: niveauDuLot(lot || id), rang: rangDe(lot || id),
    enfants,
    avancement_arbre: { total: av.total, soldes: av.soldes, pct: av.pct },
    vigilance: texteVigilance(ix, id),
    sous_lots_manquants: manquants,
    arbre_dispo: arbreDispo,
    avertissement,
    action_creer: arbreDispo && !clos && creables > 0,
    lot_clos: clos,
    lot_termine: termine,
    composants_bloques: bloques,
  }
}
