// ═══════════════════════════════════════════════════════════════════════════
// LA GAMME D'UN LOT — l'ordre des opérations, et ce qu'il autorise
// ═══════════════════════════════════════════════════════════════════════════
// Règle métier arrêtée le 10/09/2026 :
//
//   « Les BDT et BST (ou BDS) d'un lot doivent être tous disponibles à la
//     programmation à partir du moment où la commande est arrivée. Mais pour
//     envoyer le BST au sous-traitant, il faut que le BDT juste avant soit soldé. »
//
// Deux choses distinctes, qu'on confondait :
//   · PROGRAMMER, c'est poser du travail sur un calendrier. On le fait à l'avance,
//     et justement AVANT que la matière soit là — sinon on ne voit pas venir la
//     charge. Rien ne doit donc être caché du planning.
//   · ENVOYER chez le sous-traitant, c'est un mouvement physique. Là, l'ordre de
//     la gamme s'impose : on n'expédie pas une pièce dont l'opération précédente
//     n'est pas finie, il n'y aurait rien à mettre dans le carton.
//
// La gamme d'un lot est la FUSION des bons de travail et des bons de sous-traitance,
// triée par `seq` — la colonne existe sur les deux tables, écrite par la cascade.

import { calendrierCadence, ajouterHeuresOuvrees, prochainInstantOuvert, plageOuverteCalendrier, siteCadence, dateParis, type DonneesCadence, type CalendrierCadence } from './cadence'

const nb = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
const txt = (v: any) => String(v ?? '').trim()

/** Rattachement d'une ligne à son lot. Les deux colonnes coexistent selon l'origine
 *  (la cascade n'écrit que `lot_ref`, le planning écrit `lot_id`). */
export const cleLot = (op: any) => txt(op?.lot_id) || txt(op?.lot_ref)

/** Une opération annulée n'est plus dans la gamme : on l'enjambe. */
const estAnnulee = (op: any) => /^annul/i.test(txt(op?.statut))

/**
 * Cette opération est-elle SOLDÉE, au sens « il n'y a plus rien à y faire » ?
 *   · un BDT est soldé par l'atelier (`statut: 'solde'`, cf. /api/production/bdt/:id/solder) ;
 *   · un BDS est fini quand les pièces sont REVENUES du sous-traitant — la date de
 *     retour effective fait foi, le statut peut traîner.
 */
export function opSoldee(op: any): boolean {
  if (!op) return false
  if (txt(op.date_retour_effective)) return true
  const s = txt(op.statut).toLowerCase()
  // « reçu » n'a pas le même sens selon la table : un BDS « reçu » est REVENU du sous-traitant
  // (fini), un BDT « reçu » vient seulement d'être PRIS par l'opérateur (commencé). Le compter
  // comme soldé laissait partir un BST dès que le BDT précédent était démarré.
  const estBds = ('sous_traitant_id' in op) || ('date_retour_prevue' in op) || ('date_envoi' in op)
  if (estBds && (s === 'recu' || s === 'reçu')) return true
  return ['solde', 'soldé', 'termine', 'terminé', 'cloture', 'clôture', 'fini'].includes(s)
}

/** La gamme du lot, dans l'ordre : `seq` d'abord, puis l'identifiant pour départager. */
export function gammeDuLot(ops: any[]): any[] {
  return [...(ops || [])].sort((a, b) => {
    const sa = a?.seq == null ? 9999 : nb(a.seq), sb = b?.seq == null ? 9999 : nb(b.seq)
    return sa !== sb ? sa - sb : txt(a?.id).localeCompare(txt(b?.id))
  })
}

/**
 * L'ÉTAPE ENTIÈRE juste avant `cible` dans la gamme : tous les membres (morceaux « -Mk » d'un BDT
 * découpé, qui partagent le même `seq`) de la première étape de `seq` différent, annulées enjambées.
 * Tableau vide : tête de gamme (ou `cible` absente de la liste).
 */
export function groupeEtapePrecedente(cible: any, opsDuLot: any[]): any[] {
  const tri = gammeDuLot(opsDuLot)
  const i = tri.findIndex((o) => txt(o?.id) === txt(cible?.id))
  if (i < 0) return []
  const seqDe = (o: any) => (o?.seq == null ? null : nb(o.seq))
  const sc = seqDe(cible)
  // Les MORCEAUX d'un BDT séparé partagent le même seq : ce sont des frères, pas des étapes
  // précédentes. On remonte jusqu'à la première étape de seq différent…
  let j = i - 1
  while (j >= 0 && (estAnnulee(tri[j]) || (sc != null && seqDe(tri[j]) === sc))) j--
  if (j < 0) return []
  const sp = seqDe(tri[j])
  if (sp == null) return [tri[j]]
  // … et on rend l'étape avec TOUS ses morceaux.
  return tri.filter((o) => !estAnnulee(o) && seqDe(o) === sp)
}

/** L'opération JUSTE AVANT `cible` dans la gamme, les annulées enjambées. */
export function etapePrecedente(cible: any, opsDuLot: any[]): any | null {
  const groupe = groupeEtapePrecedente(cible, opsDuLot)
  if (!groupe.length) return null
  // Cette étape n'est soldée que si TOUS ses morceaux le sont : on rend le premier non soldé.
  return groupe.find((o) => !opSoldee(o)) || groupe[groupe.length - 1]
}

/**
 * Peut-on envoyer ce BDS chez le sous-traitant ? Rend `null` si oui, sinon la raison,
 * rédigée pour être affichée telle quelle à l'expéditionnaire.
 *
 * `opsDuLot` = TOUTES les opérations du lot, BDT et BDS confondus.
 * Un BDS en tête de gamme (rien avant lui) part librement : c'est le cas d'un
 * traitement de surface sur matière brute.
 */
export function bdsEnvoiBlocage(bds: any, opsDuLot: any[]): string | null {
  if (!bds) return null
  const prec = etapePrecedente(bds, opsDuLot)
  if (!prec) return null
  if (opSoldee(prec)) return null
  const quoi = txt(prec.id) || 'l\u2019op\u00e9ration pr\u00e9c\u00e9dente'
  const lib = txt(prec.operation)
  return `${quoi}${lib ? ' (' + lib + ')' : ''} n\u2019est pas sold\u00e9`
}

/**
 * Le blocage d'envoi de CHAQUE BDS, indexé par son id.
 * Regroupe d'abord par lot : deux lots différents n'ont rien à s'imposer.
 */
export function blocagesEnvoiBds(bdsRows: any[], bdtRows: any[]): Record<string, string> {
  const parLot = new Map<string, any[]>()
  const ranger = (op: any) => {
    const k = cleLot(op); if (!k) return
    if (!parLot.has(k)) parLot.set(k, [])
    parLot.get(k)!.push(op)
  }
  for (const b of (bdtRows || [])) ranger(b)
  for (const s of (bdsRows || [])) ranger(s)

  const out: Record<string, string> = {}
  for (const s of (bdsRows || [])) {
    if (estAnnulee(s)) continue
    if (opSoldee(s)) continue                       // déjà revenu : plus rien à envoyer
    const k = cleLot(s)
    // Un BDS sans lot n'a pas de gamme à respecter : on ne l'invente pas.
    const raison = k ? bdsEnvoiBlocage(s, parLot.get(k) || []) : null
    if (raison) out[txt(s.id)] = raison
  }
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
// CHEMIN CRITIQUE — à partir de quand l'étape suivante peut-elle commencer ? (lot C, 14/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
// « Deux process qui se suivent peuvent s'imbriquer, mais le process d'après ne peut se mettre
//   qu'après le temps de réglage du process précédent. »
//
// Règle, pour deux étapes consécutives E(n) → E(n+1) d'un même lot (groupes de `seq`, annulées
// enjambées, exactement comme la porte d'envoi ci-dessus) :
//     début(E(n+1)) ≥ début(porteur du réglage de E(n)) + réglage(E(n))
// Au-delà du réglage, le chevauchement est permis. Les morceaux M2…Mk d'une même étape démarrent
// eux aussi après le réglage de leur morceau porteur : le réglage se fait une fois, avant la réalisation.
//
// Cas particuliers (tranchés dans la spécification du lot C) :
//   · prédécesseur dans la goulotte                     → pas de contrainte (information seulement) ;
//   · prédécesseur posé SANS heure (pose au clic)       → compté à PLAN_HEURE_DEFAUT, l'heure où le planning l'affiche ;
//   · porteur du réglage en goulotte, morceaux posés    → pas avant le début du plus tôt des morceaux posés ;
//   · prédécesseur BDT reçu                             → son début réel (`debut_reel` ; jour : `recu_le`, voir debutBdt) ;
//   · prédécesseur entièrement soldé                    → aucune contrainte ;
//   · réglage non renseigné (null)                      → compté 0, et dit ;
//   · BDT `oas_avant` (une étape OAS entre les deux)    → fin COMPLÈTE prévue du prédécesseur ;
//   · successeur BDS (un carton, pas de chevauchement)  → fin complète, contrôlée au JOUR ;
//   · prédécesseur BDS                                  → retour effectif, sinon début + durée (jours) à 5 h.
//
// TEMPS (lot G · G5, 16/09/2026) — deux régimes, choisis par le dernier argument `cadence` des fonctions ci-dessous :
//   · cadence usine LISIBLE (DonneesCadence, src/cadence.ts) → HEURES OUVRÉES du site de l'opération (activité du BDT :
//     Seem, Semrac ; toute autre valeur = union des deux sites). Le réglage / la durée ne consomment que du temps ouvert
//     (pauses, nuits et jours fermés sautés, dimanche toujours fermé, samedi selon la cadence) ; un au plus tôt qui tombe sur
//     du fermé est reporté au PROCHAIN INSTANT OUVERT du site de l'étape suivante ; le retour de sous-traitance compte à la
//     première ouverture du jour de retour. Positions comparées en heures calendaires (jour × 24 + heure).
//   · cadence ILLISIBLE (absente : cloud sans cloud-12, ou non fournie) → grille historique du planning, de PLAN_DEBUT_JOUR
//     à PLAN_FIN_JOUR : ce qui dépasse la fin de journée reprend le lendemain au début de journée (ajouterHeuresPlanning).
//     Les constantes PLAN_DEBUT_JOUR / PLAN_FIN_JOUR ne sont plus que ces valeurs par défaut.
//
// JOUR DE PLANNING (calage / refus) : la vue d'un jour D du planning couvre [D + début de sa fenêtre, D+1 + début de la
// sienne[ — début de fenêtre = heure pleine de la première ouverture du jour (union des deux sites), PLAN_DEBUT_JOUR si le
// jour est fermé. La nuit de D (Soirée 21:00 → 05:30) appartient donc au jour D. Le serveur CALE une pose sur le même jour
// de planning (éventuellement au-delà de minuit : `cale_date`) et refuse (409) un jour de planning antérieur. Grille : jour
// de planning = jour calendaire (comportement du lot C).
//
// PROGRAMMER N'EST PAS PRODUIRE : rien n'est retiré du planning par le chemin critique. Il ne décale jamais les étapes
// suivantes (la remise en goulotte des successeurs devenus incohérents est une décision explicite : poste_oas.ts, G4).
//
// ⚠ Ce moteur est REPRIS ligne à ligne dans le script client de pageServiceProd (src/prod.tsx, fonctions
//   « cc… », horloge `ccHorloge`) pour le calage au glisser-déposer : toute modification se reporte des deux côtés
//   (tests de parité : scratchpad lotc/test_chemin.ts, lotg/test_planning_cadence.ts).

export const PLAN_DEBUT_JOUR = 5
export const PLAN_FIN_JOUR = 23
/** Heure à laquelle le planning AFFICHE un BDT posé sans heure (projection bdtsForGantt). Le chemin critique le compte
 *  à cette heure-là : avant le 14/09/2026 (revue du lot C), un BDT posé au clic (debut vide) passait pour « non
 *  programmé » et n'imposait rien à l'étape suivante, alors que sa barre était bien visible à 6 h. */
export const PLAN_HEURE_DEFAUT = 6
const H_JOUR = PLAN_FIN_JOUR - PLAN_DEBUT_JOUR
const EPS_H = 1e-6

export type RegleAuPlusTot = 'reglage' | 'fin_complete' | 'retour_st' | 'inconnu' | 'aucune'
export interface AuPlusTot {
  /** jour au plus tôt (AAAA-MM-JJ), null si aucune contrainte connue */
  date: string | null
  /** heure décimale de grille ; pour un BDS cible (contrôle au jour), heure de fin du prédécesseur */
  heure: number | null
  regle: RegleAuPlusTot
  /** opération d'où vient la contrainte retenue (porteur du réglage, prédécesseur…) */
  depuis: string | null
  /** phrase affichable telle quelle (« après le réglage de BDT-… (0,5 h) · … ») */
  raison: string
}

const arr6 = (x: number) => Math.round(x * 1e6) / 1e6
const numOuNull = (v: any): number | null => { if (v == null || v === '') return null; const n = Number(v); return isFinite(n) ? n : null }
const isoDuJour = (j: number) => new Date(j * 86400000).toISOString().slice(0, 10)
/** Numéro de jour (UTC) d'une date AAAA-MM-JJ ; null si la date n'existe pas (2026-02-30). */
function jourIdx(iso: any): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(txt(iso))
  if (!m) return null
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (!isFinite(t)) return null
  const j = Math.round(t / 86400000)
  return isoDuJour(j) === m[0] ? j : null
}
const bornerHeure = (h: number) => Math.min(PLAN_FIN_JOUR, Math.max(PLAN_DEBUT_JOUR, h))
/** Position absolue en heures de grille (comparable d'un jour à l'autre). */
function grille(date: any, heure: any): number | null {
  const j = jourIdx(date), h = numOuNull(heure)
  if (j == null || h == null) return null
  return arr6(j * H_JOUR + bornerHeure(h) - PLAN_DEBUT_JOUR)
}
const parId = (a: any, b: any) => { const x = txt(a?.id), y = txt(b?.id); return x < y ? -1 : (x > y ? 1 : 0) }
const trierTextes = (l: string[]) => l.slice().sort((a, b) => (a < b ? -1 : (a > b ? 1 : 0)))

/** « 9h30 » / « 14h » — même rendu que fmtHour du planning. */
export function fmtHeurePlanning(h: number): string {
  let H = Math.floor(h); let m = Math.round((h - H) * 60)
  if (m === 60) { H++; m = 0 }
  return H + 'h' + (m > 0 ? (m < 10 ? '0' + m : String(m)) : '')
}
const jjmm = (iso: any) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(txt(iso)); return m ? m[3] + '/' + m[2] : txt(iso) }
const fmtNb = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')

/**
 * Ajoute `h` heures de travail à (jour, heure) sur la grille du planning. Au-delà de PLAN_FIN_JOUR, la suite
 * reprend le lendemain à PLAN_DEBUT_JOUR (22 h + 2 h → lendemain 6 h). Une fin pile à 23 h reste sur la journée.
 * Heure hors grille ramenée dans [5 h, 23 h]. null si la date est invalide.
 */
export function ajouterHeuresPlanning(dateIso: string, heure: number, h: number): { date: string; heure: number } | null {
  const j = jourIdx(dateIso), hh = numOuNull(heure)
  if (j == null || hh == null) return null
  const d = Math.max(0, numOuNull(h) ?? 0)
  const depart = bornerHeure(hh)
  if (d <= 0) return { date: isoDuJour(j), heure: arr6(depart) }
  const g = arr6(j * H_JOUR + (depart - PLAN_DEBUT_JOUR) + d)
  let jour = Math.floor(g / H_JOUR)
  let reste = arr6(g - jour * H_JOUR)
  if (reste <= 0) { jour -= 1; reste = H_JOUR }
  return { date: isoDuJour(jour), heure: arr6(PLAN_DEBUT_JOUR + reste) }
}

/** Grille : un DÉBUT ne se pose pas à 23 h (rien ne tient après) : lendemain à l'ouverture. */
function versDebutGrille(p: { date: string; heure: number }): { date: string; heure: number } {
  if (p.heure >= PLAN_FIN_JOUR - EPS_H) return { date: isoDuJour((jourIdx(p.date) as number) + 1), heure: PLAN_DEBUT_JOUR }
  return p
}

// ─── Horloge du planning : grille 5 h-23 h ou heures ouvrées de la cadence usine (lot G · G5) ───
export interface PosPlanning { date: string; heure: number }
export interface TempsPlanning {
  /** true : heures ouvrées de la cadence usine ; false : grille PLAN_DEBUT_JOUR → PLAN_FIN_JOUR (cadence illisible) */
  cadence: boolean
  /** `h` heures de travail de `op` à partir de (date, heure) ; null si impossible (date invalide, calendrier fermé) */
  ajouter(op: any, dateIso: string, heure: number, h: number): PosPlanning | null
  /** position de DÉBUT possible pour `cible` au plus tôt à `p` (grille : pas à 23 h ; cadence : prochain instant ouvert) */
  versDebut(cible: any, p: PosPlanning): PosPlanning
  /** position absolue comparable d'un jour à l'autre (grille : heures de grille bornées ; cadence : jour × 24 + heure) */
  position(date: any, heure: any): number | null
  /** position de reprise après le retour d'une sous-traitance le jour `dateIso`, pour la cible */
  retourSt(cible: any, dateIso: string): PosPlanning
  /** jour de PLANNING (numéro de jour) d'une position : grille = jour calendaire ; cadence = jour dont la vue la contient */
  jourPlanning(date: any, heure: any): number | null
  /** heure (pleine) où commence la vue du jour : première ouverture du jour, union des deux sites ; PLAN_DEBUT_JOUR si fermé */
  debutFenetre(dateIso: string): number
  /** calendrier de cadence de l'opération (site = activité), null en grille */
  calendrier(op: any): CalendrierCadence | null
}
/** Cadence lue (heures ouvrées), horloge déjà construite (réutilisée), ou rien (grille). */
export type SourceTemps = DonneesCadence | TempsPlanning | null | undefined

/** Clé de site de cadence d'une opération : 'Seem', 'Semrac', sinon 'both' (union des deux sites : ouvert si l'un travaille). */
export const cleSiteCadence = (op: any): string => siteCadence(op?.activite) || 'both'

const HORLOGE_GRILLE: TempsPlanning = {
  cadence: false,
  ajouter: (_op, d, h, x) => ajouterHeuresPlanning(d, h, x),
  versDebut: (_c, p) => versDebutGrille(p),
  position: (d, h) => grille(d, h),
  retourSt: (_c, d) => ({ date: d, heure: PLAN_DEBUT_JOUR }),
  jourPlanning: (d) => jourIdx(d),
  debutFenetre: () => PLAN_DEBUT_JOUR,
  calendrier: () => null,
}

/** Horloge du planning : `tempsPlanning(cadence)` une fois par requête, puis passée aux fonctions (calendriers mémorisés). */
export function tempsPlanning(source?: SourceTemps): TempsPlanning {
  if (source && typeof (source as TempsPlanning).ajouter === 'function') return source as TempsPlanning
  const cadence = source as DonneesCadence | null | undefined
  if (!cadence || !Array.isArray(cadence.modeles) || !Array.isArray(cadence.cadences)) return HORLOGE_GRILLE
  const cals: Record<string, CalendrierCadence> = {}
  const cal = (op: any): CalendrierCadence => { const k = cleSiteCadence(op); return cals[k] || (cals[k] = calendrierCadence(cadence, k)) }
  const pos = (i: { date: string; heure: number } | null): PosPlanning | null => (i ? { date: i.date, heure: arr6(i.heure) } : null)
  const debutFenetre = (iso: string): number => { const p = plageOuverteCalendrier(cal(null), iso); return p ? Math.floor(p.debut + 1e-9) : PLAN_DEBUT_JOUR }
  return {
    cadence: true,
    ajouter: (op, d, h, x) => pos(ajouterHeuresOuvrees(d, h, Math.max(0, numOuNull(x) ?? 0), cal(op))),
    versDebut: (c, p) => pos(prochainInstantOuvert(p.date, p.heure, cal(c))) || p,
    position: (d, h) => { const j = jourIdx(d), hh = numOuNull(h); return (j == null || hh == null) ? null : arr6(j * 24 + hh) },
    // Un BDS repart au JOUR (calendrier du sous-traitant) ; un BDT reprend à la première ouverture du jour de retour.
    retourSt: (c, d) => {
      if (estBds(c)) return { date: d, heure: 0 }
      const k = cal(c), p = plageOuverteCalendrier(k, d)
      return pos(prochainInstantOuvert(d, p ? p.debut : 24, k)) || { date: d, heure: 0 }
    },
    jourPlanning: (d, h) => {
      const j = jourIdx(d), hh = numOuNull(h)
      if (j == null) return null
      if (hh == null) return j
      const abs = arr6(j * 24 + hh), jd = Math.floor(abs / 24)
      return (abs - jd * 24) + EPS_H < debutFenetre(isoDuJour(jd)) ? jd - 1 : jd
    },
    debutFenetre,
    calendrier: cal,
  }
}
function heureReelle(v: any): number | null {
  const m = /^\s*(\d{1,2})[:h](\d{2})/.exec(txt(v))
  if (!m) return null
  const H = Number(m[1]), M = Number(m[2])
  return (H > 23 || M > 59) ? null : arr6(H + M / 60)
}
/** Ligne de bons_sous_traitance (et non de bons_de_travail) ? Même repère que opSoldee, élargi aux dates. */
function estBds(op: any): boolean {
  return !!op && (('sous_traitant_id' in op) || ('date_retour_prevue' in op) || ('date_envoi' in op) || ('duree_days' in op) || ('date_debut' in op) || ('date_retour_effective' in op))
}
/**
 * Début d'un BDT : reçu/soldé → début RÉEL ; posé (négation de enGoulotte) → jour + heure prévus. Sans heure en base, le BDT
 * posé est compté à PLAN_HEURE_DEFAUT, l'heure où le planning l'affiche.
 * Jour du début réel (revue du 16/09/2026 — `debut_reel` n'est qu'une heure « HH:MM », et les équipes de nuit la font passer
 * minuit) : `recu_le` (instant de la réception, jour de Paris) quand la base le porte (migration 014 / cloud-12) ; sinon le
 * jour prévu, et en heures ouvrées (`nuits`) le jour VOISIN quand l'heure réelle est à plus de 12 h de l'heure prévue
 * (posé à 22 h, reçu à 00:30 → le lendemain ; posé à 1 h, reçu à 23:30 → la veille). Grille 5 h-23 h : jour prévu.
 * Exporté : liste « Lots à venir » (poste_oas.ts). ⚠ Copie client : ccDebutBdt (src/prod.tsx).
 */
export function debutBdt(op: any, nuits = false): { date: string; heure: number } | null {
  const s = txt(op?.statut).toLowerCase()
  const d = txt(op?.date_prevue)
  if (opSoldee(op) || s === 'recu' || s === 'reçu') {
    const hr = heureReelle(op.debut_reel)
    const jr = op?.recu_le ? dateParis(op.recu_le) : null
    if (jr && jourIdx(jr) != null) return { date: jr, heure: hr ?? numOuNull(op.debut) ?? PLAN_HEURE_DEFAUT }
    const j = jourIdx(d)
    if (j == null) return null
    if (hr == null) return { date: d.slice(0, 10), heure: numOuNull(op.debut) ?? PLAN_HEURE_DEFAUT }
    let jour = j
    if (nuits) {
      const ecart = hr - (numOuNull(op.debut) ?? PLAN_HEURE_DEFAUT)
      if (ecart > 12 + EPS_H) jour = j - 1
      else if (ecart < -12 - EPS_H) jour = j + 1
    }
    return { date: isoDuJour(jour), heure: hr }
  }
  if (!s || s === 'a_programmer' || s === 'st' || estAnnulee(op) || txt(op?.operateur_id) === 'ST') return null
  if (!txt(op?.process_id) || jourIdx(d) == null) return null
  const h = numOuNull(op.debut)
  return { date: d.slice(0, 10), heure: h ?? PLAN_HEURE_DEFAUT }
}
const dureeBdt = (op: any) => Math.max(0, numOuNull(op?.duree) ?? numOuNull(op?.temps_alloue) ?? 0)
const reglageDe = (op: any) => numOuNull(op?.temps_reglage)
function debutBds(op: any): string | null {
  const d = txt(op?.date_debut) || txt(op?.date_envoi)
  return jourIdx(d) == null ? null : d.slice(0, 10)
}
/** Durée d'un BDS en jours, comme la barre du planning BST (bstDuration), arrondie au jour supérieur. */
function dureeJoursBds(op: any): number {
  const n = Number(op?.duree_days)
  if (op?.duree_days && isFinite(n)) return Math.ceil(Math.max(1, n))
  const a = jourIdx(op?.date_envoi), b = jourIdx(op?.date_retour_prevue)
  if (a != null && b != null) return Math.max(1, b - a)
  return 5
}
/** Jour de retour d'un BDS : retour effectif, sinon début + durée. null si non planifié. */
function retourBds(op: any): string | null {
  const eff = txt(op?.date_retour_effective)
  if (jourIdx(eff) != null) return eff.slice(0, 10)
  const d = debutBds(op)
  return d == null ? null : isoDuJour((jourIdx(d) as number) + dureeJoursBds(op))
}

/**
 * Au plus tôt de `cible` (BDT ou BDS) dans son lot. `opsDuLot` = BDT et BDS du lot (la cible peut y figurer :
 * c'est la version passée en argument qui compte). Ne dépend ni du jour ni de l'heure de la cible elle-même.
 */
export function auPlusTot(cible: any, opsDuLot: any[], cadence?: SourceTemps): AuPlusTot {
  const T = tempsPlanning(cadence)
  const aucune = (raison: string): AuPlusTot => ({ date: null, heure: null, regle: 'aucune', depuis: null, raison })
  if (!cible) return aucune('opération inconnue')
  const k = cleLot(cible)
  if (!k) return aucune('sans lot : pas de gamme à respecter')
  if (cible.seq == null) return aucune('sans rang dans la gamme')
  const idC = txt(cible.id)
  const ops = (opsDuLot || []).filter((o) => !!o && cleLot(o) === k && txt(o.id) !== idC)
  ops.push(cible)
  const bdsCible = estBds(cible)
  const cands: Array<{ date: string; heure: number; g: number; regle: RegleAuPlusTot; depuis: string; raison: string }> = []
  const infos: string[] = []
  const libres: string[] = []
  const pousser = (p: { date: string; heure: number } | null, regle: RegleAuPlusTot, depuis: string, raison: string) => {
    // Cadence : aucun créneau ouvert sur l'horizon (modèles tous fermés) → dit, jamais une contrainte oubliée en silence.
    if (!p) { if (T.cadence) infos.push('aucun créneau ouvert après ' + depuis + ' (cadence usine)'); return }
    const g = T.position(p.date, p.heure)
    if (g == null) return
    cands.push({ date: p.date, heure: p.heure, g, regle, depuis, raison })
  }

  // 1) L'étape précédente, entière.
  const G = groupeEtapePrecedente(cible, ops).slice().sort(parId)
  const bdsG = G.filter((o) => estBds(o)), bdtG = G.filter((o) => !estBds(o))
  for (const s of bdsG) {
    const r = retourBds(s)
    if (r) pousser(T.retourSt(cible, r), 'retour_st', txt(s.id), 'après le retour de sous-traitance de ' + txt(s.id))
    else infos.push('sous-traitance ' + txt(s.id) + ' non planifiée')
  }
  if (bdtG.length) {
    const nonSoldes = bdtG.filter((o) => !opSoldee(o))
    if (!nonSoldes.length) libres.push('étape précédente soldée')
    else if (bdsCible || !!cible.oas_avant) {
      // Fin COMPLÈTE : un carton ne part pas à moitié, et un lot passe entier à l'OAS.
      const manquants: string[] = []
      for (const m of nonSoldes) {
        const d = debutBdt(m, T.cadence)
        if (!d) { manquants.push(txt(m.id)); continue }
        pousser(T.ajouter(m, d.date, d.heure, dureeBdt(m)), 'fin_complete', txt(m.id), 'après la fin de ' + txt(m.id) + (bdsCible ? '' : ' (passage OAS entre les deux)'))
      }
      if (manquants.length) infos.push('étape précédente non programmée (' + trierTextes(manquants).join(', ') + ')')
    } else {
      const porteurs = bdtG.filter((o) => (reglageDe(o) ?? 0) > 0)
      if (porteurs.length) {
        const nonProgrammes: string[] = []
        for (const p of porteurs) {
          const R = reglageDe(p) as number
          if (opSoldee(p)) { libres.push('réglage de ' + txt(p.id) + ' déjà fait'); continue }
          const d = debutBdt(p, T.cadence)
          if (!d) { nonProgrammes.push(txt(p.id)); continue }
          pousser(T.ajouter(p, d.date, d.heure, R), 'reglage', txt(p.id), 'après le réglage de ' + txt(p.id) + ' (' + fmtNb(R) + ' h)')
        }
        if (nonProgrammes.length) {
          // Porteur du réglage encore dans la goulotte, mais d'autres morceaux de l'étape sont posés : le réglage se
          // fait avant toute réalisation, donc l'étape suivante ne démarre pas avant le plus tôt d'entre eux.
          let tot: { d: { date: string; heure: number }; g: number; id: string; op: any } | null = null
          for (const m of bdtG) {
            if (opSoldee(m)) continue
            const d = debutBdt(m, T.cadence); if (!d) continue
            const g = T.position(d.date, d.heure); if (g == null) continue
            if (!tot || g < tot.g || (g === tot.g && txt(m.id) < tot.id)) tot = { d, g, id: txt(m.id), op: m }
          }
          const lesP = trierTextes(nonProgrammes).join(', ')
          if (tot) pousser(T.ajouter(tot.op, tot.d.date, tot.d.heure, 0), 'reglage', tot.id, 'après le début de ' + tot.id + ' (réglage de ' + lesP + ' non programmé)')
          else infos.push('étape précédente non programmée (' + lesP + ', porteur du réglage)')
        }
      } else {
        // Aucun réglage positif : l'étape suivante peut démarrer dès que celle-ci démarre.
        const inconnu = bdtG.some((o) => reglageDe(o) == null)
        let best: { d: { date: string; heure: number }; g: number; id: string; op: any } | null = null
        for (const m of bdtG) {
          const d = debutBdt(m, T.cadence); if (!d) continue
          const g = T.position(d.date, d.heure); if (g == null) continue
          if (!best || g < best.g || (g === best.g && txt(m.id) < best.id)) best = { d, g, id: txt(m.id), op: m }
        }
        if (best) pousser(T.ajouter(best.op, best.d.date, best.d.heure, 0), 'reglage', best.id, 'après le début de ' + best.id + (inconnu ? ' (réglage non renseigné, compté 0)' : ' (sans réglage)'))
        else infos.push('étape précédente non programmée (' + trierTextes(nonSoldes.map((o) => txt(o.id))).join(', ') + ')')
      }
    }
  }

  // 2) Morceaux d'une même étape : après le réglage du morceau qui le porte.
  if (!bdsCible && !((reglageDe(cible) ?? 0) > 0)) {
    const sc = nb(cible.seq)
    const freres = ops.filter((o) => o !== cible && !estAnnulee(o) && !estBds(o) && o.seq != null && nb(o.seq) === sc && (reglageDe(o) ?? 0) > 0).sort(parId)
    for (const f of freres) {
      if (opSoldee(f)) continue
      const R = reglageDe(f) as number
      const d = debutBdt(f, T.cadence)
      if (!d) { infos.push('réglage de ' + txt(f.id) + ' non programmé (même étape)'); continue }
      pousser(T.ajouter(f, d.date, d.heure, R), 'reglage', txt(f.id), 'après le réglage de ' + txt(f.id) + ' (' + fmtNb(R) + ' h, même étape)')
    }
  }

  if (!cands.length) {
    if (infos.length) return { date: null, heure: null, regle: 'inconnu', depuis: null, raison: infos.join(' · ') }
    return aucune(libres.length ? libres[0] : (G.length ? 'étape précédente soldée' : 'tête de gamme'))
  }
  let best = cands[0]
  for (const x of cands) if (x.g > best.g || (x.g === best.g && x.depuis < best.depuis)) best = x
  const pos = bdsCible ? { date: best.date, heure: best.heure } : T.versDebut(cible, { date: best.date, heure: best.heure })
  return { date: pos.date, heure: pos.heure, regle: best.regle, depuis: best.depuis, raison: best.raison + (infos.length ? ' · ' + infos.join(' · ') : '') }
}

export interface ControleEnchainement {
  /** libre : pose acceptée telle quelle · cale : même jour de planning, posée à `cale_date` `cale_a` · refus : jour antérieur (409) */
  etat: 'libre' | 'cale' | 'refus'
  au_plus_tot: AuPlusTot
  cale_a: number | null
  /** jour où la pose est calée (heures ouvrées : peut être le lendemain calendaire, dans la nuit du même jour de planning) */
  cale_date: string | null
  message: string | null
}

export function messageCalage(h: number, apt: AuPlusTot): string {
  return 'Calé à ' + fmtHeurePlanning(h) + ' (chemin critique) : ' + apt.raison
}

/**
 * Contrôle d'une pose demandée : `cible` porte déjà le jour (`date_prevue` / `date_debut`) et l'heure (`debut`)
 * demandés. BDT : jour antérieur à l'au plus tôt → refus ; même jour avant l'heure (ou sans heure) → calé à
 * l'au plus tôt (arrondi au centième supérieur). BDS : contrôle au jour seulement.
 */
export function controleEnchainement(cible: any, opsDuLot: any[], cadence?: SourceTemps): ControleEnchainement {
  const T = tempsPlanning(cadence)
  const apt = auPlusTot(cible, opsDuLot, T)
  const libre = (): ControleEnchainement => ({ etat: 'libre', au_plus_tot: apt, cale_a: null, cale_date: null, message: null })
  if (apt.regle === 'aucune' || apt.regle === 'inconnu' || apt.date == null || apt.heure == null) return libre()
  if (estBds(cible)) {
    // Sous-traitance : contrôle au JOUR calendaire (un carton part un jour donné).
    const d = debutBds(cible)
    if (d == null) return libre()
    if ((jourIdx(d) as number) < (jourIdx(apt.date) as number)) return { etat: 'refus', au_plus_tot: apt, cale_a: null, cale_date: null, message: txt(cible.id) + ' : dispo au plus tôt le ' + jjmm(apt.date) + ' (' + apt.raison + '). Planifiez-le ce jour-là ou après.' }
    return libre()
  }
  const jA = T.jourPlanning(apt.date, apt.heure) as number
  const h = numOuNull(cible.debut)
  const j = T.jourPlanning(cible.date_prevue, h)
  if (j == null || j > jA) return libre()
  if (j < jA) return { etat: 'refus', au_plus_tot: apt, cale_a: null, cale_date: null, message: 'Au plus tôt le ' + jjmm(apt.date) + ' à ' + fmtHeurePlanning(apt.heure) + ' (' + apt.raison + ') : posez ' + txt(cible.id) + ' ce jour-là ou après.' }
  if (h != null && (T.position(cible.date_prevue, h) as number) >= (T.position(apt.date, apt.heure) as number) - EPS_H) return libre()
  let cale = Math.ceil(arr6(apt.heure * 100)) / 100
  let caleDate = apt.date
  // Arrondi au centième qui passe minuit (23,995 → 24) : le lendemain à 0 h (heures ouvrées seulement : la grille s'arrête à 23 h).
  if (T.cadence && cale >= 24) { cale = arr6(cale - 24); caleDate = isoDuJour((jourIdx(apt.date) as number) + 1) }
  return { etat: 'cale', au_plus_tot: apt, cale_a: cale, cale_date: caleDate, message: messageCalage(cale, apt) }
}

/**
 * Repli « colonne `debut` entière » (base sans la migration 005 / cloud-4) : l'heure pleine la plus proche de celle
 * demandée, SAUF si elle tombe avant l'au plus tôt du même jour — alors l'heure pleine au-dessus, pour que l'arrondi ne
 * crée pas lui-même une violation (9h15 demandé, au plus tôt 9h06 : 9h serait trop tôt → 10h).
 * `cible` porte déjà le jour et l'heure demandés ; `opsDuLot` null = pas de gamme à respecter (arrondi simple).
 */
export function heureEntiereChemin(cible: any, opsDuLot: any[] | null, cadence?: SourceTemps): { heure: number; controle: ControleEnchainement | null } {
  const entier = Math.round(Number(cible?.debut))
  if (!opsDuLot) return { heure: entier, controle: null }
  const ctl = controleEnchainement({ ...cible, debut: entier }, opsDuLot, cadence)
  if (ctl.etat === 'cale' && ctl.cale_a != null) return { heure: Math.ceil(ctl.cale_a - 1e-9), controle: ctl }
  return { heure: entier, controle: null }
}

/**
 * Opérations DÉJÀ POSÉES qui démarrent avant leur au plus tôt, indexées par id (message affichable).
 * BDT : posés (ni goulotte, ni reçus, ni soldés) avec une heure ; BDS : planifiés, pas encore partis.
 * `opts.recus` (lot G, revue du 16/09/2026) : compte AUSSI les BDT reçus, à leur début réel — ils ne se déprogramment
 * jamais, mais un déplacement qui les rend incohérents doit le dire (successeursEnViolation, G4). La carte « Enchaînements
 * à revoir » garde la règle du lot C (reçus ignorés).
 */
export function violationsEnchainement(bdtRows: any[], bdsRows: any[], cadence?: SourceTemps, opts: { recus?: boolean } = {}): Record<string, string> {
  const T = tempsPlanning(cadence)
  const parLot = new Map<string, any[]>()
  const ranger = (op: any) => {
    const k = cleLot(op); if (!k) return
    if (!parLot.has(k)) parLot.set(k, [])
    parLot.get(k)!.push(op)
  }
  for (const b of (bdtRows || [])) if (b) ranger(b)
  for (const s of (bdsRows || [])) if (s) ranger(s)
  const out: Record<string, string> = {}
  for (const b of (bdtRows || [])) {
    if (!b || estAnnulee(b)) continue
    const k = cleLot(b); if (!k) continue
    const s = txt(b.statut).toLowerCase()
    const recu = s === 'recu' || s === 'reçu'
    if (opSoldee(b) || (recu && !opts.recus)) continue
    const d = debutBdt(b, T.cadence); if (!d) continue
    const apt = auPlusTot(b, parLot.get(k) || [], T)
    if (apt.regle === 'aucune' || apt.regle === 'inconnu' || apt.date == null || apt.heure == null) continue
    if ((T.position(d.date, d.heure) as number) < (T.position(apt.date, apt.heure) as number) - EPS_H) {
      out[txt(b.id)] = txt(b.id) + (recu ? ' reçu (commencé) le ' : ' posé le ') + jjmm(d.date) + ' à ' + fmtHeurePlanning(d.heure) + ' : au plus tôt le ' + jjmm(apt.date) + ' à ' + fmtHeurePlanning(apt.heure) + ' (' + apt.raison + ')'
    }
  }
  for (const s of (bdsRows || [])) {
    if (!s || estAnnulee(s)) continue
    const k = cleLot(s); if (!k) continue
    const st = txt(s.statut).toLowerCase()
    if (txt(s.date_retour_effective) || ['envoye', 'envoyé', 'recu', 'reçu', 'solde', 'soldé'].includes(st)) continue
    const d = debutBds(s); if (d == null) continue
    const apt = auPlusTot(s, parLot.get(k) || [], T)
    if (apt.regle === 'aucune' || apt.regle === 'inconnu' || apt.date == null) continue
    if ((jourIdx(d) as number) < (jourIdx(apt.date) as number)) {
      out[txt(s.id)] = txt(s.id) + ' planifié le ' + jjmm(d) + ' : dispo au plus tôt le ' + jjmm(apt.date) + ' (' + apt.raison + ')'
    }
  }
  return out
}

/**
 * Après une pose : les opérations SUIVANTES du lot (même étape ou étapes d'après), déjà posées OU REÇUES (début réel), qui
 * sont désormais en violation. Jamais de décalage automatique : on les signale.
 */
export function successeursEnViolation(cible: any, opsDuLot: any[], cadence?: SourceTemps): Array<{ id: string; message: string }> {
  const k = cleLot(cible)
  if (!k || cible?.seq == null) return []
  const idC = txt(cible.id)
  const ops = (opsDuLot || []).filter((o) => !!o && cleLot(o) === k && txt(o.id) !== idC)
  ops.push(cible)
  const v = violationsEnchainement(ops.filter((o) => !estBds(o)), ops.filter((o) => estBds(o)), cadence, { recus: true })
  const sc = nb(cible.seq)
  return gammeDuLot(ops)
    .filter((o) => txt(o.id) !== idC && o.seq != null && nb(o.seq) >= sc && !!v[txt(o.id)])
    .map((o) => ({ id: txt(o.id), message: v[txt(o.id)] }))
}
