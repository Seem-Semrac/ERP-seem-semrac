// ═══════════════════════════════════════════════════════════════════════════
// POSTE, GOULOTTE ET OAS — règles pures du lot G (16/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
//   G2 · « → OAS : <process> » : le process OAS qui suit un BDT `oas_apres` dans la gamme de sa nomenclature
//        (les étapes OAS ne créent pas de BDT) ; liste « Lots à venir » du service OAS.
//   G3 · Chevauchement sur un même poste : autorisé si les process diffèrent, REFUSÉ si c'est le même process.
//   G4 · Un déplacement qui rend incohérentes des étapes suivantes déjà posées les REMET EN GOULOTTE (après
//        confirmation), en tête de la goulotte.
//
// Aucune lecture de base ici : les routes lisent, ces fonctions décident (tests : scratchpad lotg/test_oas_poste.ts).
// ⚠ Les fonctions marquées « copie client » sont reprises dans le script de pageServiceProd (src/prod.tsx, bloc
//   ==POSTE-OAS-DEBUT== / ==POSTE-OAS-FIN==) : toute modification se reporte des deux côtés (test de parité).
//
// HEURES : par défaut (cadence illisible), le chevauchement se mesure en heures « brutes » (jour × 24 + heure, durée
// ajoutée telle quelle) et la fin prévue des « Lots à venir » sur la grille du planning (gamme.ts ajouterHeuresPlanning).
// Lot G · G5 (16/09/2026) : les routes branchent les heures OUVRÉES de la cadence usine sans toucher ces règles, par les
// paramètres injectables `intervalle` (G3 : planning_cadence.ts intervallePosteOuvre ; client ppIntervalle), `ajouter`
// (G2 : planning_cadence.ts ajouterPourOp) et `violations` (G4 : violationsEnchainement(…, cadence) ; client ccViolations).

import { cleLot, opSoldee, violationsEnchainement, auPlusTot, debutBdt, ajouterHeuresPlanning, PLAN_HEURE_DEFAUT, type AuPlusTot } from './gamme'

const nb = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
const txt = (v: any) => String(v ?? '').trim()
const numOuNull = (v: any): number | null => { if (v == null || v === '') return null; const n = Number(v); return isFinite(n) ? n : null }
const arr6 = (x: number) => Math.round(x * 1e6) / 1e6
const EPS_H = 1e-6
const estAnnulee = (op: any) => /^annul/i.test(txt(op?.statut))
const isoDuJour = (j: number) => new Date(j * 86400000).toISOString().slice(0, 10)
/** Numéro de jour (UTC) d'une date AAAA-MM-JJ ; null si la date n'existe pas. (Même règle que gamme.ts.) */
function jourIdx(iso: any): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(txt(iso))
  if (!m) return null
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (!isFinite(t)) return null
  const j = Math.round(t / 86400000)
  return isoDuJour(j) === m[0] ? j : null
}
/** Ligne de bons_sous_traitance ? (même repère que gamme.ts) */
function estBds(op: any): boolean {
  return !!op && (('sous_traitant_id' in op) || ('date_retour_prevue' in op) || ('date_envoi' in op) || ('duree_days' in op) || ('date_debut' in op) || ('date_retour_effective' in op))
}
const estRecu = (op: any) => { const s = txt(op?.statut).toLowerCase(); return s === 'recu' || s === 'reçu' }

// ─────────────────────────────────────────────────────────────────────────────
// G3 · CHEVAUCHEMENT DU MÊME PROCESS SUR UN POSTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le BDT occupe-t-il son poste sur le planning ? (copie client)
 *   · posé : négation exacte d'`enGoulotte` (prod.tsx) — statut renseigné autre que « a_programmer », un process et un jour ;
 *   · reçu : en cours à l'atelier, il occupe toujours le poste ;
 *   · jamais : soldé (le poste est libéré), annulé, sous-traité, ou ligne de BDS.
 */
export function bdtOccupePoste(op: any): boolean {
  if (!op || estBds(op)) return false
  const s = txt(op.statut).toLowerCase()
  if (!s || s === 'a_programmer' || s === 'st' || estAnnulee(op) || txt(op.operateur_id) === 'ST' || opSoldee(op)) return false
  return !!txt(op.process_id) && jourIdx(op.date_prevue) != null
}

/** Intervalle occupé, en heures absolues (jour × 24 + heure). */
export interface IntervallePoste { debut: number; fin: number }
export type IntervalleDe = (op: any) => IntervallePoste | null

/**
 * Intervalle en heures BRUTES (copie client) : du début prévu (`debut`, sinon PLAN_HEURE_DEFAUT comme le planning) à
 * début + durée (`duree`, sinon `temps_alloue`). Un BDT reçu garde son intervalle PRÉVU : c'est la barre que l'on voit.
 */
export function intervalleBrut(op: any): IntervallePoste | null {
  const j = jourIdx(op?.date_prevue)
  if (j == null) return null
  const h = numOuNull(op?.debut) ?? PLAN_HEURE_DEFAUT
  const d = Math.max(0, numOuNull(op?.duree) ?? numOuNull(op?.temps_alloue) ?? 0)
  return { debut: arr6(j * 24 + h), fin: arr6(j * 24 + h + d) }
}

export interface Chevauchement {
  id: string
  debut: number
  fin: number
  /** jour (AAAA-MM-JJ) où démarre le BDT en conflit */
  date: string
  message: string
}

/** « 09:30 », suivi de « le 17/09 » si l'instant n'est pas sur le jour de référence. (copie client) */
export function fmtInstantPoste(abs: number, jourRef: number | null): string {
  const tm = Math.round(abs * 60)
  const j = Math.floor(tm / 1440), m = tm - j * 1440
  const HH = Math.floor(m / 60), MM = m % 60
  const hhmm = (HH < 10 ? '0' : '') + HH + ':' + (MM < 10 ? '0' : '') + MM
  if (jourRef != null && j === jourRef) return hhmm
  const iso = isoDuJour(j)
  return hhmm + ' le ' + iso.slice(8, 10) + '/' + iso.slice(5, 7)
}

/** Message de refus, affiché tel quel (409). (copie client) */
export function messageChevauchement(c: { id: string; debut: number; fin: number }, nomPoste: string, jourRef: number | null): string {
  return 'Le poste ' + (txt(nomPoste) || '(sans nom)') + ' porte déjà un BDT du même process (' + c.id + ') de '
    + fmtInstantPoste(c.debut, jourRef) + ' à ' + fmtInstantPoste(c.fin, jourRef)
    + ' : décalez la pose ou choisissez un autre process du poste.'
}

/**
 * BDT du MÊME process, occupant le poste, dont l'intervalle chevauche celui de `cible` (cible déjà à sa position
 * demandée). Process différents : jamais de conflit (autorisé). Se toucher (fin de l'un = début de l'autre) n'est pas
 * chevaucher. Triés par début puis identifiant. `cible` qui n'occupe pas le poste (goulotte, soldé…) : aucun conflit.
 * (copie client)
 */
export function chevauchementsMemeProcess(cible: any, autres: any[], opts: { intervalle?: IntervalleDe; nomPoste?: string } = {}): Chevauchement[] {
  if (!bdtOccupePoste(cible)) return []
  const iv = opts.intervalle || intervalleBrut
  const ic = iv(cible)
  if (!ic) return []
  const pid = txt(cible.process_id), idC = txt(cible.id)
  const jourRef = Math.floor(Math.round(ic.debut * 60) / 1440)
  const vus = new Set<string>()
  const out: Chevauchement[] = []
  for (const o of (autres || [])) {
    const id = txt(o?.id)
    if (!o || id === idC || vus.has(id) || txt(o.process_id) !== pid || !bdtOccupePoste(o)) continue
    const io = iv(o)
    if (!io) continue
    if (io.debut < ic.fin - EPS_H && ic.debut < io.fin - EPS_H) {
      vus.add(id)
      out.push({ id, debut: io.debut, fin: io.fin, date: isoDuJour(Math.floor(Math.round(io.debut * 60) / 1440)), message: messageChevauchement({ id, debut: io.debut, fin: io.fin }, opts.nomPoste || '', jourRef) })
    }
  }
  return out.sort((a, b) => (a.debut !== b.debut ? a.debut - b.debut : (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0))))
}

// ─────────────────────────────────────────────────────────────────────────────
// G4 · SUCCESSEURS REMIS EN GOULOTTE
// ─────────────────────────────────────────────────────────────────────────────

/** Ordre de gamme d'une liste de successeurs : rang puis identifiant (comparaison de chaînes, identique côté client). */
const ordreGamme = (a: any, b: any) => { const sa = nb(a?.seq), sb = nb(b?.seq); if (sa !== sb) return sa - sb; const x = txt(a?.id), y = txt(b?.id); return x < y ? -1 : (x > y ? 1 : 0) }

/** Le même BDT, retourné dans la goulotte (ce qu'écrit /deprogrammer). (copie client) */
export function versGoulotte(op: any): any {
  return { ...op, statut: 'a_programmer', process_id: null, machine_id: null, date_prevue: null, debut: null, operateur_id: null }
}

export interface SuccesseurADeprogrammer { id: string; message: string }

export interface OptionsRemiseGoulotte {
  /** violations du chemin critique des BDT posés (défaut : violationsEnchainement, grille) */
  violations?: (bdts: any[], bds: any[]) => Record<string, string>
  /** mêmes violations en comptant les BDT REÇUS à leur début réel (défaut : violationsEnchainement(…, { recus: true })) */
  violationsRecus?: (bdts: any[], bds: any[]) => Record<string, string>
  /** au plus tôt d'une opération dans son lot (défaut : auPlusTot, grille) */
  auPlusTot?: (cible: any, ops: any[]) => AuPlusTot
}

/**
 * Plan G4 d'un déplacement `avant` → `apres` : étapes suivantes à REMETTRE EN GOULOTTE (`retirer`) et étapes REÇUES qu'il
 * rend incohérentes, signalées sans jamais être retirées (`signaler`).
 *   · `avant` : la ligne telle qu'en base avant le déplacement (null si inconnue) ; `apres` : sa nouvelle position ;
 *   · « rendues incohérentes » = en violation du chemin critique APRÈS et PAS AVANT : une violation qui existait déjà
 *     reste simplement signalée (le déplacement n'en est pas la cause) ;
 *   · seuls les BDT posés (ni goulotte, ni reçus, ni soldés) se déprogramment ; un BDS (sous-traitance, lié à un BC)
 *     n'est jamais retiré ; un BDT reçu non plus, mais il est listé dans `signaler` (revue du 16/09/2026 : il était tu) ;
 *   · en CASCADE jusqu'à stabilité (ordre de gamme, étape par étape). Revue du 16/09/2026 : une étape remise en goulotte
 *     n'impose plus rien au chemin critique, si bien que l'étape d'après, posée AVANT l'étape déplacée, n'était plus vue.
 *     Pour juger la suite, chaque étape retirée est donc placée VIRTUELLEMENT à son au plus tôt (le plus tôt où elle pourra
 *     être reposée) : E(n+2) posée avant la fin du réglage de cette position est retirée à son tour. Sans au plus tôt
 *     connu, l'étape retirée reste en goulotte pour le calcul (aucune contrainte, comme le chemin critique).
 * (copie client : ppPlanRemiseGoulotte)
 */
export function planRemiseGoulotte(avant: any | null, apres: any, opsDuLot: any[], opts: OptionsRemiseGoulotte = {}):
  { retirer: SuccesseurADeprogrammer[]; signaler: SuccesseurADeprogrammer[] } {
  const viol = opts.violations || ((b: any[], s: any[]) => violationsEnchainement(b, s))
  const violR = opts.violationsRecus || ((b: any[], s: any[]) => violationsEnchainement(b, s, undefined, { recus: true }))
  const apt = opts.auPlusTot || ((c: any, ops: any[]) => auPlusTot(c, ops))
  const k = cleLot(apres)
  if (!k || apres?.seq == null) return { retirer: [], signaler: [] }
  const idC = txt(apres.id)
  const base = (opsDuLot || []).filter((o) => !!o && cleLot(o) === k && txt(o.id) !== idC)
  const calc = (f: (b: any[], s: any[]) => Record<string, string>, ops: any[]) => f(ops.filter((o) => !estBds(o)), ops.filter((o) => estBds(o)))
  const etatAvant = avant && cleLot(avant) === k ? [...base, avant] : base
  const vAvant = calc(viol, etatAvant)
  const sc = nb(apres.seq)
  let etat = [...base, apres]
  const vus = new Set<string>()
  const retirer: SuccesseurADeprogrammer[] = []
  for (let tour = 0; tour <= base.length; tour++) {
    const v = calc(viol, etat)
    const nouveaux = etat.filter((o) => {
      const id = txt(o.id)
      return id !== idC && !vus.has(id) && !estBds(o) && o.seq != null && nb(o.seq) >= sc
        && !!v[id] && !vAvant[id] && bdtOccupePoste(o) && !estRecu(o)
    }).sort(ordreGamme)
    if (!nouveaux.length) break
    for (const o of nouveaux) { const id = txt(o.id); vus.add(id); retirer.push({ id, message: v[id] }) }
    for (const o of nouveaux) {
      const id = txt(o.id)
      const a = apt(o, etat)
      const virtuel = (a && a.regle !== 'aucune' && a.regle !== 'inconnu' && a.date != null && a.heure != null)
        ? { ...o, date_prevue: a.date, debut: a.heure }
        : versGoulotte(o)
      etat = etat.map((x) => (txt(x.id) === id ? virtuel : x))
    }
  }
  const vRAvant = calc(violR, etatAvant), vR = calc(violR, etat)
  const signaler = etat.filter((o) => {
    const id = txt(o.id)
    return id !== idC && !vus.has(id) && !estBds(o) && estRecu(o) && o.seq != null && nb(o.seq) >= sc && !!vR[id] && !vRAvant[id]
  }).sort(ordreGamme).map((o) => ({ id: txt(o.id), message: vR[txt(o.id)] }))
  return { retirer, signaler }
}

/** Étapes suivantes DÉJÀ POSÉES à remettre en goulotte (voir planRemiseGoulotte). (copie client) */
export function successeursADeprogrammer(avant: any | null, apres: any, opsDuLot: any[], opts: OptionsRemiseGoulotte = {}): SuccesseurADeprogrammer[] {
  return planRemiseGoulotte(avant, apres, opsDuLot, opts).retirer
}

/** Message préventif (appConfirm) avant un déplacement qui remet des étapes en goulotte et/ou rend incohérentes des étapes
 *  déjà REÇUES (signalées, jamais retirées). (copie client) */
export function messageRemiseGoulotte(idDeplace: string, successeurs: SuccesseurADeprogrammer[], signales: SuccesseurADeprogrammer[] = []): string {
  const n = successeurs.length, r = (signales || []).length
  const morceaux: string[] = []
  if (n) {
    morceaux.push('Déplacer ' + idDeplace + ' remettra dans la goulotte ' + (n > 1 ? 'les étapes suivantes' : 'l’étape suivante') + ' :\n'
      + successeurs.map((s) => '· ' + s.id + ' — ' + s.message).join('\n')
      + '\n\n' + (n > 1 ? 'Elles seront déprogrammées' : 'Elle sera déprogrammée') + ' et placée' + (n > 1 ? 's' : '') + ' en tête de la goulotte, à reprogrammer.')
  }
  if (r) {
    morceaux.push((n ? 'Déjà reçue' + (r > 1 ? 's' : '') : 'Déplacer ' + idDeplace + ' rendra incohérente' + (r > 1 ? 's' : '') + ' ' + (r > 1 ? 'des étapes déjà reçues' : 'une étape déjà reçue'))
      + ' (commencée' + (r > 1 ? 's' : '') + ' à l’atelier : jamais déprogrammée' + (r > 1 ? 's' : '') + ', seulement signalée' + (r > 1 ? 's' : '') + ') :\n'
      + signales.map((s) => '· ' + s.id + ' — ' + s.message).join('\n'))
  }
  return morceaux.join('\n\n') + '\n\nAnnuler : rien ne bouge.'
}

/**
 * Tri de la goulotte (copie client, pendSort) : les BDT REMIS en goulotte par un déplacement d'abord (le plus récent en
 * tête), puis l'échéance, le lot, le rang de gamme et l'identifiant (ordre naturel des numéros).
 * Champs lus : remis_goulotte_le, date_echeance, lot (clé de lot affichée), seq, id.
 */
export function comparerRemisGoulotte(a: any, b: any): number {
  const ra = txt(a), rb = txt(b)
  if (ra === rb) return 0
  if (!ra) return 1
  if (!rb) return -1
  return ra < rb ? 1 : -1
}
export function comparerGoulotte(a: any, b: any): number {
  const r = comparerRemisGoulotte(a?.remis_goulotte_le, b?.remis_goulotte_le)
  if (r) return r
  const da = txt(a?.date_echeance) || '9999-12-31', db = txt(b?.date_echeance) || '9999-12-31'
  if (da !== db) return da < db ? -1 : 1
  const ka = txt(a?.lot), kb = txt(b?.lot)
  if (ka !== kb) return ka < kb ? -1 : 1
  const sa = a?.seq == null ? 9999 : nb(a.seq), sb = b?.seq == null ? 9999 : nb(b.seq)
  if (sa !== sb) return sa - sb
  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''), undefined, { numeric: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// G2 · PROCESS OAS SUIVANT ET LOTS À VENIR
// ─────────────────────────────────────────────────────────────────────────────

/** Nomenclature de production d'une pièce : validée, `code_ref_produit` = pièce (casse ignorée), indice le plus haut —
 *  la même que retient la génération des BDT (/api/be/analyse-dt/:id/generer-bdt). */
export function nomenclatureDeLaPiece(piece: any, nomenclatures: any[]): any | null {
  const p = txt(piece).toLowerCase()
  if (!p) return null
  let best: any = null
  for (const n of (nomenclatures || [])) {
    if (!n || n.statut !== 'valide' || txt(n.code_ref_produit).toLowerCase() !== p) continue
    if (!best || String(n.indice || 'A') > String(best.indice || 'A')) best = n
  }
  return best
}

/**
 * Noms des process OAS qui suivent `bdt` dans la gamme `etapes` (etapes_production de la nomenclature) : la ou les
 * étapes OAS CONSÉCUTIVES juste après l'étape du BDT (rang = `ordre`, sinon position, comme la génération). Étape OAS =
 * `est_oas` sur l'étape ou process `est_oas` (critère de la génération). Tableau vide : rien trouvé (repli « → OAS »).
 */
export function processOasSuivant(bdt: any, etapes: any[], procsParId: Record<string, any>): string[] {
  const seq = numOuNull(bdt?.seq)
  if (seq == null || !Array.isArray(etapes) || !etapes.length) return []
  const tri = etapes.slice().sort((a: any, b: any) => (Number(a?.ordre) || 0) - (Number(b?.ordre) || 0))
  const rangs = tri.map((e: any, i: number) => Number(e?.ordre) || (i + 1))
  const estOas = (e: any) => !!e && (!!e.est_oas || (!!txt(e.process_id) && !!procsParId[txt(e.process_id)]?.est_oas))
  let i = rangs.findIndex((r) => r === seq)
  // Étape du BDT absente (gamme modifiée depuis) : on repart de la première étape de rang supérieur.
  let depart = i >= 0 ? i + 1 : rangs.findIndex((r) => r > seq)
  if (depart < 0) return []
  const noms: string[] = []
  for (let j = depart; j < tri.length && estOas(tri[j]); j++) {
    const e = tri[j]
    const nom = txt(procsParId[txt(e.process_id)]?.nom) || txt(e.process_nom) || txt(e.nom)
    noms.push(nom || 'OAS')
  }
  return noms
}

/** Process OAS suivant de chaque BDT `oas_apres`, indexé par id (tableau vide = introuvable). Les BDT sans oas_apres
 *  sont absents de l'index. */
export function oasSuivantParBdt(bdts: any[], nomenclatures: any[], procs: any[]): Record<string, string[]> {
  const procsParId: Record<string, any> = {}
  for (const p of (procs || [])) if (p && p.id != null) procsParId[String(p.id)] = p
  const cache = new Map<string, any>()
  const out: Record<string, string[]> = {}
  for (const b of (bdts || [])) {
    if (!b || b.oas_apres !== true) continue
    const k = txt(b.piece).toLowerCase()
    if (!cache.has(k)) cache.set(k, nomenclatureDeLaPiece(b.piece, nomenclatures))
    const nom = cache.get(k)
    out[txt(b.id)] = nom ? processOasSuivant(b, Array.isArray(nom.etapes_production) ? nom.etapes_production : [], procsParId) : []
  }
  return out
}

/** Libellé du badge : « → OAS : Désoxydation › Oxydation noire », repli « → OAS ». (copie client) */
export function libelleOasSuivant(noms: string[] | null | undefined): string {
  const l = (noms || []).map(txt).filter(Boolean)
  return l.length ? '→ OAS : ' + l.join(' › ') : '→ OAS'
}

export interface LotAVenirOas {
  lot: string
  affaire: string
  client: string
  piece: string
  qte: number | null
  /** BDT de l'étape qui précède l'OAS (morceaux compris), non soldés */
  bdts: string[]
  operation: string
  process_oas: string[]
  /** fin prévue de l'étape précédente (dernier morceau posé) ; null si aucune fin calculable */
  fin_date: string | null
  fin_heure: number | null
  statut: 'recu' | 'programme'
  /** morceaux de l'étape encore dans la goulotte : la fin prévue ne les compte pas */
  en_goulotte: number
}

/**
 * Lots dont l'étape qui précède l'OAS (BDT `oas_apres`) est POSÉE ou EN COURS, triés par fin prévue.
 *   · une étape entièrement soldée n'y est plus (le lot est alors « arrivé à l'OAS ») ; entièrement en goulotte non plus ;
 *   · fin prévue = début (reçu : début réel s'il est lisible, à sa date réelle — `nuits` = heures ouvrées, voir gamme.ts
 *     debutBdt) + durée, par `ajouter` (grille du planning par défaut,
 *     heures ouvrées de la cadence dès qu'elles sont branchées) ; la plus tardive des morceaux posés ;
 *   · statut « reçu » dès qu'un morceau est reçu.
 */
export function lotsAVenirOas(
  bdts: any[], lots: any[], oasSuivant: Record<string, string[]>,
  opts: { ajouter?: (dateIso: string, heure: number, h: number, op?: any) => { date: string; heure: number } | null; nuits?: boolean } = {},
): LotAVenirOas[] {
  const ajouter = opts.ajouter || ((d: string, h: number, x: number) => ajouterHeuresPlanning(d, h, x))
  const lotsParId: Record<string, any> = {}
  for (const l of (lots || [])) if (l && l.id != null) lotsParId[String(l.id)] = l
  const groupes = new Map<string, any[]>()
  for (const b of (bdts || [])) {
    if (!b || b.oas_apres !== true || estAnnulee(b)) continue
    const g = (cleLot(b) || ('id:' + txt(b.id))) + '|' + (b.seq == null ? '' : nb(b.seq))
    if (!groupes.has(g)) groupes.set(g, [])
    groupes.get(g)!.push(b)
  }
  const out: LotAVenirOas[] = []
  for (const membres of groupes.values()) {
    const nonSoldes = membres.filter((b) => !opSoldee(b))
    const poses = nonSoldes.filter((b) => bdtOccupePoste(b))
    if (!poses.length) continue
    let fin: { date: string; heure: number; abs: number } | null = null
    for (const b of poses) {
      // Début réel d'un reçu (jour : recu_le, ou jour voisin la nuit — gamme.ts debutBdt), sinon jour + heure prévus.
      const dep = debutBdt(b, !!opts.nuits)
      if (!dep) continue
      const d = Math.max(0, numOuNull(b.duree) ?? numOuNull(b.temps_alloue) ?? 0)
      const f = ajouter(dep.date, dep.heure, d, b)
      const j = f ? jourIdx(f.date) : null
      if (!f || j == null) continue
      const abs = j * 24 + f.heure
      if (!fin || abs > fin.abs) fin = { date: f.date, heure: f.heure, abs }
    }
    const tri = membres.slice().sort((a, b) => txt(a.id).localeCompare(txt(b.id), undefined, { numeric: true }))
    const ref = tri[0]
    const cle = cleLot(ref)
    const lot = cle ? lotsParId[cle] : null
    const noms = tri.map((b) => oasSuivant[txt(b.id)]).find((x) => Array.isArray(x) && x.length) || []
    const q = numOuNull(lot?.qte)
    out.push({
      lot: cle || '—',
      affaire: txt(ref.num_affaire) || txt(lot?.cmd_id) || txt(ref.cmd_ref),
      client: txt(ref.client_nom) || txt(lot?.client_nom),
      piece: txt(ref.piece) || txt(lot?.piece),
      qte: q,
      bdts: nonSoldes.map((b) => txt(b.id)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      operation: txt(ref.operation),
      process_oas: noms,
      fin_date: fin ? fin.date : null,
      fin_heure: fin ? fin.heure : null,
      statut: poses.some(estRecu) ? 'recu' : 'programme',
      en_goulotte: nonSoldes.length - poses.length,
    })
  }
  return out.sort((a, b) => {
    const fa = a.fin_date == null ? Infinity : (jourIdx(a.fin_date) as number) * 24 + (a.fin_heure as number)
    const fb = b.fin_date == null ? Infinity : (jourIdx(b.fin_date) as number) * 24 + (b.fin_heure as number)
    if (fa !== fb) return fa < fb ? -1 : 1
    return a.lot < b.lot ? -1 : (a.lot > b.lot ? 1 : 0)
  })
}
