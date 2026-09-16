// ══════════════════════════════════════════════════════════════
// CADENCE USINE — règles PURES (ni base, ni DOM) — lot G · G1 (16/09/2026)
//
// Demande : « modèles d'horaires de l'usine par cadence (Bas / Moyen / Haut), à adapter selon la cadence choisie.
// Cadence par site (Seem, Semrac), modifiable à tout moment. Le dimanche est sauté, le samedi selon la cadence.
// Le planning s'adapte à la cadence. »
//
// Données (migration 014 / cloud-12) :
//   · horaires_modeles (niveau, jour_semaine 1=lundi…7=dimanche, creneau, partie 1|2, debut 'HH:MM', fin 'HH:MM', actif)
//     — un créneau FERMÉ un jour donné = aucune ligne active pour (niveau, jour, créneau) ;
//   · cadence_site (site, niveau, depuis, effet, par, motif) — historique en AJOUT SEUL. `depuis` = moment de la décision,
//     `effet` = jour (AAAA-MM-JJ) à partir duquel la cadence s'applique (revue du 16/09 : un changement a une DATE D'EFFET,
//     par défaut le lendemain ; sans `effet` — lignes d'amorce — le jour de `depuis` à Paris). La cadence d'un site À UNE
//     DATE est la ligne de plus grand (jour d'effet, depuis) dont le jour d'effet est ≤ cette date (avant la toute première
//     ligne : la première) ; la cadence COURANTE est celle d'aujourd'hui (Paris) — un changement PRÉVU (effet futur) n'est
//     pas encore courant. Site sans aucune ligne : NIVEAU_DEFAUT (Moyen, l'amorce).
//
// Conventions (contrat pour le planning, les présences, la RH) :
//   · date = 'AAAA-MM-JJ' (jour calendaire, calculs en UTC : aucun effet de fuseau ni d'heure d'été) ;
//   · heure = heures DÉCIMALES depuis 00:00 de cette date (5.5 = 05:30) ;
//   · un segment qui passe minuit a fin > 24 (Soirée 21:00-05:30 → debut 21, fin 29.5) et est RATTACHÉ AU JOUR OÙ IL
//     COMMENCE : le lundi 02:00 est ouvert grâce à la Soirée du DIMANCHE… qui n'existe pas (dimanche fermé), mais le
//     mardi 02:00 l'est grâce à la Soirée du lundi ;
//   · Instant = { date, heure } avec 0 ≤ heure < 24 (normalisé) ;
//   · le dimanche (jour 7) est TOUJOURS fermé, quels que soient les modèles ; le samedi suit la cadence. Un segment du
//     SAMEDI qui passerait minuit est coupé à 24:00 (il déborderait sur le dimanche) — la saisie le refuse d'ailleurs ;
//   · intervalles demi-ouverts [debut, fin) : à 13:15 pile, un Matin 05:30-13:15 est fermé (l'Après-midi prend le relais).
//
// Copie navigateur : CADENCE_CLIENT_JS (même logique en ES5, objet global `CAD`) — parité prouvée par le test
// scratchpad lotg/test_cadence.ts. Toute modification d'une fonction ci-dessous DOIT être reportée dans la copie.
// ══════════════════════════════════════════════════════════════

export const NIVEAUX_CADENCE = ['bas', 'moyen', 'haut'] as const
export type NiveauCadence = typeof NIVEAUX_CADENCE[number]
export const LIBELLES_NIVEAU: Record<NiveauCadence, string> = { bas: 'Bas', moyen: 'Moyen', haut: 'Haut' }
/** Cadence d'un site qui n'a encore aucune ligne dans cadence_site (valeur d'amorce de la migration 014). */
export const NIVEAU_DEFAUT: NiveauCadence = 'moyen'

export const SITES_CADENCE = ['Seem', 'Semrac'] as const
export type SiteCadence = typeof SITES_CADENCE[number]

/** Même ordre d'affichage que CRENEAUX (src/presences.ts) : Matin · Journée · Après-midi · Soirée. */
export const CRENEAUX_CADENCE = ['matin', 'journee', 'apmidi', 'soir'] as const
export type CreneauCadence = typeof CRENEAUX_CADENCE[number]

/** Index 1..7 → libellé (index 0 inutilisé). */
export const JOURS_SEMAINE = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export const DIMANCHE = 7

/** Durée maximale acceptée pour un segment (garde-fou de saisie : 21:00 → 20:00 = 23 h est une faute de frappe). */
export const DUREE_MAX_SEGMENT_H = 16
/** Horizon de recherche d'un instant ouvert (jours) : au-delà, le calendrier est jugé entièrement fermé (null). */
export const HORIZON_JOURS = 400

export const MSG_CLOUD12 =
  'Cadence usine indisponible : la base n’a pas les tables horaires_modeles / cadence_site. ' +
  'Docker/VM : erp-docker.sh maj (migration 014) ; cloud : jouez docker/db/cloud/cloud-12-cadence-usine.sql. ' +
  'En attendant, les horaires affichés sont les horaires par défaut des créneaux.'
export const MSG_CADENCE_RESERVE = 'Modifier la cadence usine ou ses modèles d’horaires est réservé à l’écriture Production.'

export interface ModeleHoraire {
  id?: string
  niveau: string
  jour_semaine: number
  creneau: string
  partie: number
  debut: string
  fin: string
  actif?: boolean | null
  maj_le?: string | null
  maj_par?: string | null
}
export interface LigneCadenceSite {
  id?: string
  site: string
  niveau: string
  /** moment de la décision (timestamptz) */
  depuis: string
  /** jour d'effet 'AAAA-MM-JJ' (migration 014 / cloud-12) ; absent ou vide = jour de `depuis` à Paris */
  effet?: string | null
  par?: string | null
  motif?: string | null
}
export interface DonneesCadence { modeles: ModeleHoraire[]; cadences: LigneCadenceSite[] }

/** Segment ouvert d'un jour, pour UN niveau (sans site). debut ∈ [0,24[, fin > debut, fin > 24 si passe minuit. */
export interface CreneauOuvert { creneau: CreneauCadence; partie: 1 | 2; debut: number; fin: number }
/** Segment ouvert d'un jour dans un calendrier (avec le site et le niveau qui l'ouvrent). */
export interface SegmentOuvert extends CreneauOuvert { site: SiteCadence; niveau: NiveauCadence }
export interface Instant { date: string; heure: number }
export interface Plage { debut: number; fin: number }

/** Calendrier d'un ou plusieurs sites (union : ouvert si au moins un site est ouvert). `cache` : mémo interne par date. */
export interface CalendrierCadence {
  sites: SiteCadence[]
  modeles: ModeleHoraire[]
  cadences: LigneCadenceSite[]
  cache: Record<string, SegmentOuvert[]>
}

export interface HorairesCreneau {
  creneau: CreneauCadence
  parties: { partie: 1 | 2; debut: string; fin: string }[]
  /** « 05:30-13:15 » ; « 07:30-12:00 / 12:45-16:00 » pour une Journée en deux parties. */
  texte: string
  debut: number
  fin: number
  /** Heures de présence (somme des parties, pauses exclues). */
  heures: number
  /** Pause entre les parties, en minutes (0 pour un créneau d'un seul tenant). */
  pauseMin: number
}

const EPS = 1e-9
const RE_HHMM = /^([01][0-9]|2[0-3]):([0-5][0-9])$/
const RE_ISO = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/

// ─── Utilitaires ──────────────────────────────────────────────
export function estNiveau(n: unknown): n is NiveauCadence { return typeof n === 'string' && (NIVEAUX_CADENCE as readonly string[]).includes(n) }
export function estCreneau(c: unknown): c is CreneauCadence { return typeof c === 'string' && (CRENEAUX_CADENCE as readonly string[]).includes(c) }
export function estHhmm(s: unknown): s is string { return typeof s === 'string' && RE_HHMM.test(s) }

/** 'HH:MM' → heures décimales ('05:30' → 5.5) ; null si le format est invalide. */
export function hhmmVersHeures(s: unknown): number | null {
  if (typeof s !== 'string') return null
  const m = RE_HHMM.exec(s.trim())
  if (!m) return null
  return Number(m[1]) + Number(m[2]) / 60
}

/** Heures décimales → 'HH:MM' (modulo 24, arrondi à la minute : 29.5 → '05:30'). '' si non numérique. */
export function heuresVersHhmm(h: unknown): string {
  const n = Number(h)
  if (h === null || h === '' || !isFinite(n)) return ''
  let min = Math.round(n * 60)
  min = ((min % 1440) + 1440) % 1440
  const hh = Math.floor(min / 60), mm = min % 60
  return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm
}

export function estDateIso(s: unknown): s is string {
  if (typeof s !== 'string' || !RE_ISO.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** 1 = lundi … 7 = dimanche ; 0 si la date est invalide. */
export function jourSemaineIso(iso: string): number {
  if (!estDateIso(iso)) return 0
  const d = new Date(iso + 'T00:00:00Z').getUTCDay()
  return d === 0 ? 7 : d
}

export function isoPlusJours(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Nombre de jours de a à b (b − a), dates ISO. */
export function diffJours(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
}

// Performance (revue du 16/09/2026) : un Intl.DateTimeFormat coûte ~150 µs à construire. Il est créé UNE fois, et le jour
// de Paris de chaque horodatage est mémorisé (table vidée au-delà de 5 000 entrées).
let FORMATEUR_PARIS: Intl.DateTimeFormat | null | undefined
const MEMO_DATE_PARIS = new Map<string, string | null>()
function formateurParis(): Intl.DateTimeFormat | null {
  if (FORMATEUR_PARIS === undefined) {
    try { FORMATEUR_PARIS = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }) } catch { FORMATEUR_PARIS = null }
  }
  return FORMATEUR_PARIS
}

/** Jour calendaire À PARIS d'un horodatage ISO ('2026-09-15T22:30:00Z' → '2026-09-16'). null si illisible. */
export function dateParis(ts: unknown): string | null {
  if (!ts) return null
  const k = String(ts)
  const m = MEMO_DATE_PARIS.get(k)
  if (m !== undefined) return m
  let r: string | null = null
  const d = new Date(k)
  if (!isNaN(d.getTime())) {
    const f = formateurParis()
    try {
      if (f) {
        const p = f.formatToParts(d)
        const o: Record<string, string> = {}
        for (let i = 0; i < p.length; i++) o[p[i].type] = p[i].value
        if (o.year && o.month && o.day) r = o.year + '-' + o.month + '-' + o.day
      }
    } catch { /* Intl sans fuseau : repli UTC */ }
    if (!r) r = d.toISOString().slice(0, 10)
  }
  if (MEMO_DATE_PARIS.size >= 5000) MEMO_DATE_PARIS.clear()
  MEMO_DATE_PARIS.set(k, r)
  return r
}

let MEMO_AUJOURDHUI = { t: -Infinity, d: '' }
/** Jour calendaire d'aujourd'hui à Paris (recalculé au plus une fois par minute). */
export function aujourdhuiParis(): string {
  const t = Date.now()
  if (t - MEMO_AUJOURDHUI.t > 60000 || t < MEMO_AUJOURDHUI.t) MEMO_AUJOURDHUI = { t, d: dateParis(new Date(t).toISOString()) || new Date(t).toISOString().slice(0, 10) }
  return MEMO_AUJOURDHUI.d
}

/** Activité d'un opérateur / poste / BDT → site de cadence ('seem' → 'Seem') ; null pour 'both', 'OAS', vide… */
export function siteCadence(activite: unknown): SiteCadence | null {
  const a = String(activite == null ? '' : activite).trim().toLowerCase()
  if (a === 'seem') return 'Seem'
  if (a === 'semrac') return 'Semrac'
  return null
}

/** Sites dont la cadence s'applique à une activité : Seem → [Seem] ; Semrac → [Semrac] ; tout le reste (both, OAS,
 *  vide) → [Seem, Semrac] (union : ouvert si l'un des deux sites travaille). */
export function sitesCadence(activite: unknown): SiteCadence[] {
  const s = siteCadence(activite)
  return s ? [s] : ['Seem', 'Semrac']
}

// ─── Cadence d'un site ────────────────────────────────────────
/** Jour d'effet d'une ligne : `effet` (AAAA-MM-JJ valide) sinon le jour de `depuis` à Paris ; null si illisible. */
export function jourEffetCadence(l: LigneCadenceSite | null | undefined): string | null {
  if (!l) return null
  const e = l.effet == null ? '' : String(l.effet).slice(0, 10)
  return estDateIso(e) ? e : dateParis(l.depuis)
}

// Index par site, construit UNE fois par tableau de cadences (revue du 16/09/2026 : l'historique ne fait que grandir et
// chaque recherche refiltrait, retriait et reconvertissait toutes les lignes). Mémo invalidé si le tableau change de
// longueur ou d'extrémités (ajout d'une ligne dans le même tableau). Recherche d'une date : dichotomie, puis mémo.
interface IndexSiteCadence { lignes: LigneCadenceSite[]; jours: string[]; parDate: Record<string, LigneCadenceSite> }
interface IndexCadences { sig: string; sites: Record<string, IndexSiteCadence> }
const INDEX_CADENCES = new WeakMap<object, IndexCadences>()
function signatureCadences(c: LigneCadenceSite[]): string {
  const n = c.length, a: any = c[0], z: any = c[n - 1]
  return n ? n + '|' + (a && a.id) + '|' + (a && a.depuis) + '|' + (z && z.id) + '|' + (z && z.depuis) + '|' + (z && z.niveau) + '|' + (z && z.effet) : '0'
}
function indexSiteCadence(cadences: LigneCadenceSite[], site: string): IndexSiteCadence {
  const liste = Array.isArray(cadences) ? cadences : []
  const sig = signatureCadences(liste)
  let ix = Array.isArray(cadences) ? INDEX_CADENCES.get(cadences) : undefined
  if (!ix || ix.sig !== sig) { ix = { sig, sites: {} }; if (Array.isArray(cadences)) INDEX_CADENCES.set(cadences, ix) }
  if (!Object.prototype.hasOwnProperty.call(ix.sites, site)) {
    const avec: { l: LigneCadenceSite; j: string; t: number; i: number }[] = []
    liste.forEach((l, i) => {
      if (!l || siteCadence(l.site) !== site || !estNiveau(l.niveau)) return
      const t = Date.parse(String(l.depuis))
      if (isNaN(t)) return
      const j = jourEffetCadence(l)
      if (j) avec.push({ l, j, t, i })
    })
    avec.sort((a, b) => (a.j < b.j ? -1 : (a.j > b.j ? 1 : ((a.t - b.t) || (a.i - b.i)))))
    ix.sites[site] = { lignes: avec.map(x => x.l), jours: avec.map(x => x.j), parDate: {} }
  }
  return ix.sites[site]
}

/** Ligne de cadence en vigueur pour un site à une date (sans date : aujourd'hui à Paris) : celle de plus grand
 *  (jour d'effet, depuis) dont le jour d'effet est ≤ date, sinon la toute première. null si le site n'a aucune ligne. */
export function ligneCadenceDuSite(cadences: LigneCadenceSite[], site: string, dateIso?: string | null): LigneCadenceSite | null {
  const ix = indexSiteCadence(cadences, site)
  if (!ix.lignes.length) return null
  const d = dateIso ? String(dateIso) : aujourdhuiParis()
  if (Object.prototype.hasOwnProperty.call(ix.parDate, d)) return ix.parDate[d]
  let lo = 0, hi = ix.jours.length - 1, k = -1
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (ix.jours[mid] <= d) { k = mid; lo = mid + 1 } else hi = mid - 1 }
  const r = k >= 0 ? ix.lignes[k] : ix.lignes[0]
  ix.parDate[d] = r
  return r
}

/** Niveau de cadence d'un site (voir ligneCadenceDuSite) ; null si aucune ligne. */
export function niveauDuSite(cadences: LigneCadenceSite[], site: string, dateIso?: string | null): NiveauCadence | null {
  const l = ligneCadenceDuSite(cadences, site, dateIso)
  return l ? (l.niveau as NiveauCadence) : null
}

/** Changements PRÉVUS d'un site : lignes dont le jour d'effet est postérieur à `dateIso` (aujourd'hui par défaut), dans
 *  l'ordre où elles s'appliqueront, avec leur jour d'effet. */
export function changementsPrevusCadence(cadences: LigneCadenceSite[], site: string, dateIso?: string | null): { ligne: LigneCadenceSite; effet: string }[] {
  const ix = indexSiteCadence(cadences, site)
  const d = dateIso ? String(dateIso) : aujourdhuiParis()
  const out: { ligne: LigneCadenceSite; effet: string }[] = []
  for (let i = 0; i < ix.lignes.length; i++) if (ix.jours[i] > d) out.push({ ligne: ix.lignes[i], effet: ix.jours[i] })
  return out
}

// ─── Créneaux d'un jour ───────────────────────────────────────
/** Segments OUVERTS d'un jour pour un niveau : [{creneau, partie, debut, fin}] triés par début (puis ordre des créneaux,
 *  puis partie). Dimanche, niveau ou date invalides : []. Lignes inactives, heures illisibles ou début = fin : ignorées. */
export function creneauxDuJour(modeles: ModeleHoraire[], niveau: string, dateIso: string): CreneauOuvert[] {
  const j = jourSemaineIso(dateIso)
  if (!j || j === DIMANCHE || !estNiveau(niveau)) return []
  const out: CreneauOuvert[] = []
  for (const m of (Array.isArray(modeles) ? modeles : [])) {
    if (!m || m.actif === false || m.niveau !== niveau || Number(m.jour_semaine) !== j || !estCreneau(m.creneau)) continue
    const partie = Number(m.partie)
    if (partie !== 1 && partie !== 2) continue
    const d = hhmmVersHeures(m.debut)
    let f = hhmmVersHeures(m.fin)
    if (d == null || f == null || Math.abs(d - f) < EPS) continue
    if (f < d) f += 24
    // Samedi : le lendemain est un dimanche, toujours fermé → un segment qui passerait minuit s'arrête à 24:00.
    if (j === DIMANCHE - 1 && f > 24) f = 24
    out.push({ creneau: m.creneau, partie: partie as 1 | 2, debut: d, fin: f })
  }
  const ordre = (c: string) => (CRENEAUX_CADENCE as readonly string[]).indexOf(c)
  return out.sort((a, b) => (a.debut - b.debut) || (ordre(a.creneau) - ordre(b.creneau)) || (a.partie - b.partie))
}

/** Plage ouverte d'un jour pour un niveau : { debut: min des débuts, fin: max des fins } ; null si le jour est fermé. */
export function plageOuverteDuJour(modeles: ModeleHoraire[], niveau: string, dateIso: string): Plage | null {
  const segs = creneauxDuJour(modeles, niveau, dateIso)
  if (!segs.length) return null
  let debut = Infinity, fin = -Infinity
  for (const s of segs) { if (s.debut < debut) debut = s.debut; if (s.fin > fin) fin = s.fin }
  return { debut, fin }
}

/** Horaires d'UN créneau un jour donné pour un niveau (null = fermé ce jour-là). */
export function horairesCreneau(modeles: ModeleHoraire[], niveau: string, dateIso: string, creneau: string): HorairesCreneau | null {
  const segs = creneauxDuJour(modeles, niveau, dateIso).filter(s => s.creneau === creneau)
  if (!segs.length || !estCreneau(creneau)) return null
  let heures = 0, debut = Infinity, fin = -Infinity
  const parties = segs.map(s => {
    heures += s.fin - s.debut
    if (s.debut < debut) debut = s.debut
    if (s.fin > fin) fin = s.fin
    return { partie: s.partie, debut: heuresVersHhmm(s.debut), fin: heuresVersHhmm(s.fin) }
  })
  heures = Math.round(heures * 1e6) / 1e6
  return {
    creneau, parties,
    texte: parties.map(p => p.debut + '-' + p.fin).join(' / '),
    debut, fin, heures,
    pauseMin: Math.max(0, Math.round((fin - debut - heures) * 60)),
  }
}

/** Horaires d'un créneau pour un SITE à une date (niveau en vigueur ce jour-là, NIVEAU_DEFAUT si le site n'a aucune ligne).
 *  `niveau` rendu pour les messages (« fermé en cadence Bas ce jour »). */
export function horairesCreneauSite(donnees: DonneesCadence, site: string, dateIso: string, creneau: string): { niveau: NiveauCadence; horaires: HorairesCreneau | null } {
  const niveau = niveauDuSite(donnees.cadences, site, dateIso) || NIVEAU_DEFAUT
  return { niveau, horaires: horairesCreneau(donnees.modeles, niveau, dateIso, creneau) }
}

/** Pause forfaitaire d'une présence d'un seul tenant (RH › Temps), en minutes, au-delà de SEUIL_PAUSE_PRESENCE_H. */
export const PAUSE_PRESENCE_MIN = 30
export const SEUIL_PAUSE_PRESENCE_H = 6
/** Heures travaillées d'une présence sur un créneau (RH › Temps, faute de pointage) : amplitude du créneau moins la pause.
 *  Pause = celle du créneau (Journée : entre ses deux parties) et au moins PAUSE_PRESENCE_MIN pour une amplitude de plus de
 *  SEUIL_PAUSE_PRESENCE_H — règle appliquée avant le lot G (30 min déduites par équipe), gardée par défaut en attendant
 *  la décision RH (revue du 16/09/2026 : sans elle, Matin, Après-midi et Soirée passaient à l'amplitude complète). */
export function heuresPresence(h: HorairesCreneau): { pauseMin: number; heures: number } {
  const amplitude = Math.max(0, h.fin - h.debut)
  const pauseMin = Math.max(h.pauseMin || 0, amplitude > SEUIL_PAUSE_PRESENCE_H + EPS ? PAUSE_PRESENCE_MIN : 0)
  return { pauseMin, heures: Math.max(0, Math.round((amplitude - pauseMin / 60) * 100) / 100) }
}

/** « Matin 05:30-13:15 » ; « Matin (fermé) » si le créneau est fermé ce jour-là. */
export function libelleCreneauDuJour(libelle: string, horaires: HorairesCreneau | null): string {
  return horaires ? libelle + ' ' + horaires.texte : libelle + ' (fermé)'
}

// ─── Calendrier (un ou plusieurs sites) ───────────────────────
/** Calendrier pour une activité ('Seem', 'Semrac', 'both'…) ou une liste explicite de sites. */
export function calendrierCadence(donnees: DonneesCadence, activiteOuSites: unknown): CalendrierCadence {
  let sites: SiteCadence[]
  if (Array.isArray(activiteOuSites)) {
    sites = []
    for (const x of activiteOuSites) { const s = siteCadence(x); if (s && !sites.includes(s)) sites.push(s) }
  } else sites = sitesCadence(activiteOuSites)
  return {
    sites,
    modeles: donnees && Array.isArray(donnees.modeles) ? donnees.modeles : [],
    cadences: donnees && Array.isArray(donnees.cadences) ? donnees.cadences : [],
    cache: {},
  }
}

/** Segments ouverts d'un jour dans le calendrier (union des sites), triés par début. */
export function segmentsDuJour(cal: CalendrierCadence, dateIso: string): SegmentOuvert[] {
  if (cal.cache && cal.cache[dateIso]) return cal.cache[dateIso]
  const out: SegmentOuvert[] = []
  for (const site of cal.sites) {
    const niveau = niveauDuSite(cal.cadences, site, dateIso) || NIVEAU_DEFAUT
    for (const s of creneauxDuJour(cal.modeles, niveau, dateIso)) out.push({ site, niveau, creneau: s.creneau, partie: s.partie, debut: s.debut, fin: s.fin })
  }
  out.sort((a, b) => (a.debut - b.debut) || (a.fin - b.fin))
  if (cal.cache) cal.cache[dateIso] = out
  return out
}

/** Intervalles ouverts FUSIONNÉS des segments qui commencent ce jour-là : [[debut, fin], …] (fin > 24 possible). */
export function intervallesDuJour(cal: CalendrierCadence, dateIso: string): number[][] {
  const out: number[][] = []
  for (const s of segmentsDuJour(cal, dateIso)) {
    const der = out[out.length - 1]
    if (der && s.debut <= der[1] + EPS) { if (s.fin > der[1]) der[1] = s.fin }
    else out.push([s.debut, s.fin])
  }
  return out
}

/** Plage ouverte d'un jour du calendrier (union des sites) : null si fermé. */
export function plageOuverteCalendrier(cal: CalendrierCadence, dateIso: string): Plage | null {
  const iv = intervallesDuJour(cal, dateIso)
  if (!iv.length) return null
  let fin = -Infinity
  for (const x of iv) if (x[1] > fin) fin = x[1]
  return { debut: iv[0][0], fin }
}

function intervallesAbs(cal: CalendrierCadence, d0: string, off: number): number[][] {
  return intervallesDuJour(cal, isoPlusJours(d0, off)).map(iv => [iv[0] + 24 * off, iv[1] + 24 * off])
}

/** Premier intervalle ouvert (fusionné, y compris d'un jour sur l'autre) qui finit après t (heures depuis 00:00 de d0).
 *  debut = max(début de l'intervalle, t). null si rien d'ouvert dans l'horizon. */
function intervalleOuvertApres(cal: CalendrierCadence, d0: string, t0: number, horizon: number): Plage | null {
  let jour = Math.floor(t0 / 24)
  const dernier = jour + horizon
  let t = t0
  while (jour <= dernier) {
    let best: number[] | null = null
    for (let o = jour - 1; o <= jour + 1; o++) {
      for (const iv of intervallesAbs(cal, d0, o)) if (iv[1] > t + EPS && (!best || iv[0] < best[0])) best = iv
    }
    if (best) {
      let fin = best[1], prolonge = true, garde = 0
      while (prolonge && garde++ < horizon * 4) {
        prolonge = false
        const j2 = Math.floor(fin / 24)
        for (let o = j2 - 1; o <= j2 + 1; o++) {
          for (const iv of intervallesAbs(cal, d0, o)) if (iv[0] <= fin + EPS && iv[1] > fin + EPS) { fin = iv[1]; prolonge = true }
        }
      }
      return { debut: Math.max(best[0], t), fin }
    }
    jour++
    t = Math.max(t, 24 * jour)
  }
  return null
}

/** (date de référence, heures depuis son 00:00, éventuellement ≥ 24 ou < 0) → Instant normalisé (0 ≤ heure < 24). */
export function versInstant(dateIso: string, heuresAbs: number): Instant {
  const abs = Math.round(heuresAbs * 1e6) / 1e6
  const k = Math.floor(abs / 24)
  const heure = Math.round((abs - 24 * k) * 1e6) / 1e6
  return { date: isoPlusJours(dateIso, k), heure }
}

/** Écart en heures CALENDAIRES de a à b (b − a). */
export function ecartHeures(a: Instant, b: Instant): number {
  return diffJours(a.date, b.date) * 24 + (Number(b.heure) - Number(a.heure))
}

/** Le calendrier est-il ouvert à cet instant ? (heure quelconque, normalisée ; intervalles [debut, fin)). */
export function estOuvert(dateIso: string, heure: number, cal: CalendrierCadence): boolean {
  if (!estDateIso(dateIso) || !isFinite(Number(heure))) return false
  const i = versInstant(dateIso, Number(heure))
  for (let o = -1; o <= 0; o++) {
    for (const iv of intervallesAbs(cal, i.date, o)) if (iv[0] <= i.heure + EPS && iv[1] > i.heure + EPS) return true
  }
  return false
}

/** Premier instant ouvert ≥ (date, heure) ; l'instant lui-même s'il est ouvert. null si tout est fermé sur l'horizon. */
export function prochainInstantOuvert(dateIso: string, heure: number, cal: CalendrierCadence, horizonJours = HORIZON_JOURS): Instant | null {
  if (!estDateIso(dateIso) || !isFinite(Number(heure))) return null
  const i = versInstant(dateIso, Number(heure))
  const iv = intervalleOuvertApres(cal, i.date, i.heure, horizonJours)
  return iv ? versInstant(i.date, iv.debut) : null
}

/** Ajoute h heures OUVRÉES à (date, heure) : seul le temps ouvert est consommé (pauses, heures et jours fermés sautés,
 *  dimanche toujours fermé). Départ sur du fermé : le décompte commence au prochain instant ouvert. h ≤ 0 : prochain
 *  instant ouvert. Une fin qui tombe pile en fin d'intervalle rend cette fin (ex. 21:00), pas le début du suivant.
 *  null si l'horizon ne suffit pas (calendrier entièrement fermé). */
export function ajouterHeuresOuvrees(dateIso: string, heure: number, h: number, cal: CalendrierCadence, horizonJours = HORIZON_JOURS): Instant | null {
  if (!estDateIso(dateIso) || !isFinite(Number(heure)) || !isFinite(Number(h))) return null
  const dep = versInstant(dateIso, Number(heure))
  if (!(Number(h) > EPS)) return prochainInstantOuvert(dep.date, dep.heure, cal, horizonJours)
  let reste = Number(h), t = dep.heure
  for (let garde = 0; garde < horizonJours * 8; garde++) {
    const iv = intervalleOuvertApres(cal, dep.date, t, horizonJours)
    if (!iv) return null
    const dispo = iv.fin - iv.debut
    if (reste <= dispo + EPS) return versInstant(dep.date, iv.debut + reste)
    reste -= dispo
    t = iv.fin
  }
  return null
}

/** Heures OUVRÉES entre deux instants (0 si b ≤ a). */
export function heuresOuvreesEntre(a: Instant, b: Instant, cal: CalendrierCadence, horizonJours = HORIZON_JOURS): number {
  if (!a || !b || !estDateIso(a.date) || !estDateIso(b.date)) return 0
  const fin = ecartHeures(a, b) + Number(a.heure)
  let t = Number(a.heure), total = 0
  for (let garde = 0; garde < horizonJours * 8 && t < fin - EPS; garde++) {
    const iv = intervalleOuvertApres(cal, a.date, t, horizonJours)
    if (!iv || iv.debut >= fin - EPS) break
    total += Math.min(iv.fin, fin) - iv.debut
    t = iv.fin
  }
  return Math.round(total * 1e6) / 1e6
}

// ─── Modèles d'amorce (spécification du 16/09/2026) ──────────
type DefJour = { matin?: [string, string]; apmidi?: [string, string]; soir?: [string, string]; journee?: [string, string][] }
const STD = (finJournee: string): DefJour => ({ matin: ['05:30', '13:15'], apmidi: ['13:15', '21:00'], soir: ['21:00', '05:30'], journee: [['07:30', '12:00'], ['12:45', finJournee]] })
const AMORCE: Record<NiveauCadence, Record<number, DefJour>> = {
  bas: { 1: STD('16:00'), 2: STD('16:00'), 3: STD('16:00'), 4: { matin: ['04:30', '13:15'], journee: [['07:30', '12:30']] } },
  moyen: { 1: STD('16:00'), 2: STD('16:00'), 3: STD('16:00'), 4: STD('16:00'), 5: { matin: ['04:50', '13:15'], journee: [['07:30', '12:00']] } },
  // Haut, jeudi et vendredi : l'Après-midi et la Soirée reprennent les horaires du lundi (le modèle fourni répétait 05:30-13:15,
  // l'utilisateur a confirmé que ces équipes travaillent) — signalé, modifiable à l'écran « Cadence usine ».
  haut: { 1: STD('16:45'), 2: STD('16:45'), 3: STD('16:45'), 4: STD('16:45'), 5: STD('16:45'), 6: { matin: ['05:30', '12:00'] } },
}
/** Les 65 lignes amorcées par la migration 014 / cloud-12 (id = niveau-jour-creneau-partie). */
export const MODELES_AMORCE: ModeleHoraire[] = (() => {
  const out: ModeleHoraire[] = []
  for (const niveau of NIVEAUX_CADENCE) {
    for (let j = 1; j <= 7; j++) {
      const def = AMORCE[niveau][j]
      if (!def) continue
      const push = (creneau: CreneauCadence, partie: 1 | 2, hh: [string, string]) =>
        out.push({ id: niveau + '-' + j + '-' + creneau + '-' + partie, niveau, jour_semaine: j, creneau, partie, debut: hh[0], fin: hh[1], actif: true })
      if (def.matin) push('matin', 1, def.matin)
      if (def.apmidi) push('apmidi', 1, def.apmidi)
      if (def.soir) push('soir', 1, def.soir)
      ;(def.journee || []).forEach((hh, i) => push('journee', (i + 1) as 1 | 2, hh))
    }
  }
  return out
})()

// ─── Validations serveur ──────────────────────────────────────
export interface CelluleModele {
  jour_semaine: number
  creneau: CreneauCadence
  partie: 1 | 2
  ferme: boolean
  debut: string | null
  fin: string | null
  /** maj_le de la ligne telle que l'écran l'a lue ; null = l'écran n'avait aucune ligne (créneau fermé). */
  maj_le_lu: string | null
}
const cleCellule = (j: number, c: string, p: number) => j + '|' + c + '|' + p
const nomCellule = (j: number, c: string, p: number) =>
  (JOURS_SEMAINE[j] || ('jour ' + j)) + ' · ' + ({ matin: 'Matin', journee: 'Journée', apmidi: 'Après-midi', soir: 'Soirée' } as Record<string, string>)[c] + (c === 'journee' ? ' (partie ' + p + ')' : '')

function dureeSegment(debut: string, fin: string): number {
  const d = hhmmVersHeures(debut) as number
  let f = hhmmVersHeures(fin) as number
  if (f < d) f += 24
  return f - d
}

/** Corps de POST /api/production/cadence/modeles : { niveau, cellules: [{jour_semaine, creneau, partie, ferme, debut, fin, maj_le_lu}] }. */
export function validerModelesNiveau(b: any): { ok: true; niveau: NiveauCadence; cellules: CelluleModele[] } | { ok: false; error: string } {
  const niveau = b ? b.niveau : undefined
  if (!estNiveau(niveau)) return { ok: false, error: 'Niveau de cadence attendu : bas, moyen ou haut.' }
  const brutes = b.cellules
  if (!Array.isArray(brutes) || brutes.length === 0) return { ok: false, error: 'Aucune cellule à enregistrer.' }
  if (brutes.length > 7 * 5) return { ok: false, error: 'Trop de cellules (35 au plus : 7 jours × 5 colonnes).' }
  const vues = new Set<string>()
  const cellules: CelluleModele[] = []
  for (const x of brutes) {
    const j = Number(x && x.jour_semaine)
    if (!Number.isInteger(j) || j < 1 || j > 7) return { ok: false, error: 'Jour de semaine invalide (1 = lundi … 7 = dimanche).' }
    const c = x.creneau
    if (!estCreneau(c)) return { ok: false, error: 'Créneau inconnu « ' + String(c).slice(0, 30) + ' » : attendu matin, journee, apmidi ou soir.' }
    const p = Number(x.partie == null ? 1 : x.partie)
    if (p !== 1 && p !== 2) return { ok: false, error: nomCellule(j, c, 1) + ' : partie 1 ou 2 attendue.' }
    if (p === 2 && c !== 'journee') return { ok: false, error: nomCellule(j, c, p) + ' : seule la Journée a une 2e partie.' }
    const k = cleCellule(j, c, p)
    if (vues.has(k)) return { ok: false, error: nomCellule(j, c, p) + ' : cellule envoyée deux fois.' }
    vues.add(k)
    const ferme = x.ferme === true
    const lu = x.maj_le_lu == null || x.maj_le_lu === '' ? null : String(x.maj_le_lu)
    if (ferme) { cellules.push({ jour_semaine: j, creneau: c, partie: p as 1 | 2, ferme: true, debut: null, fin: null, maj_le_lu: lu }); continue }
    if (j === DIMANCHE) return { ok: false, error: 'Le dimanche est toujours fermé : ' + nomCellule(j, c, p) + ' ne peut pas être ouvert.' }
    const debut = typeof x.debut === 'string' ? x.debut.trim() : ''
    const fin = typeof x.fin === 'string' ? x.fin.trim() : ''
    if (!estHhmm(debut) || !estHhmm(fin)) return { ok: false, error: nomCellule(j, c, p) + ' : heures au format HH:MM attendues (ou « — » pour fermé).' }
    if (debut === fin) return { ok: false, error: nomCellule(j, c, p) + ' : le début et la fin sont identiques (' + debut + ').' }
    const duree = dureeSegment(debut, fin)
    if (c === 'journee' && (hhmmVersHeures(fin) as number) < (hhmmVersHeures(debut) as number)) {
      return { ok: false, error: nomCellule(j, c, p) + ' : une partie de Journée ne peut pas passer minuit (' + debut + ' → ' + fin + ').' }
    }
    // Samedi : finir le lendemain, ce serait travailler le dimanche, toujours fermé (le moteur couperait à 24:00).
    if (j === DIMANCHE - 1 && (hhmmVersHeures(fin) as number) < (hhmmVersHeures(debut) as number)) {
      return { ok: false, error: nomCellule(j, c, p) + ' : un créneau du samedi ne peut pas finir le lendemain (' + debut + ' → ' + fin + ') : le dimanche est toujours fermé. Terminez-le au plus tard à 23:55.' }
    }
    if (duree > DUREE_MAX_SEGMENT_H + EPS) return { ok: false, error: nomCellule(j, c, p) + ' : ' + debut + ' → ' + fin + ' dure plus de ' + DUREE_MAX_SEGMENT_H + ' h (faute de frappe ?).' }
    cellules.push({ jour_semaine: j, creneau: c, partie: p as 1 | 2, ferme: false, debut, fin, maj_le_lu: lu })
  }
  return { ok: true, niveau, cellules }
}

export type ActionModele =
  | { type: 'insert'; cle: string; nom: string; payload: { niveau: NiveauCadence; jour_semaine: number; creneau: CreneauCadence; partie: 1 | 2; debut: string; fin: string; actif: true } }
  | { type: 'update'; cle: string; nom: string; id: string; maj_le: string | null; patch: { debut?: string; fin?: string; actif: boolean } }

/** Plan d'écriture des modèles d'un niveau à partir des lignes ACTUELLES (lues en base, tous niveaux acceptés) et des
 *  cellules validées. Conflit (409) si une ligne a changé depuis la lecture de l'écran ; incohérence (400) si l'état final
 *  d'un jour ne tient pas (Journée partie 2 sans partie 1, parties qui se chevauchent). */
export function planModeles(courants: ModeleHoraire[], niveau: NiveauCadence, cellules: CelluleModele[]):
  { ok: true; actions: ActionModele[]; inchangees: number } | { ok: false; http: 400 | 409; error: string } {
  const parCle: Record<string, ModeleHoraire> = {}
  for (const m of (Array.isArray(courants) ? courants : [])) {
    if (m && m.niveau === niveau) parCle[cleCellule(Number(m.jour_semaine), m.creneau, Number(m.partie))] = m
  }
  const actions: ActionModele[] = []
  let inchangees = 0
  // État final (ouvert ? heures) de chaque cellule, pour la cohérence des jours touchés.
  const final: Record<string, { debut: string; fin: string } | null> = {}
  for (const k of Object.keys(parCle)) { const m = parCle[k]; final[k] = m.actif === false ? null : { debut: m.debut, fin: m.fin } }
  const joursTouches = new Set<number>()
  for (const c of cellules) {
    const k = cleCellule(c.jour_semaine, c.creneau, c.partie)
    const nom = nomCellule(c.jour_semaine, c.creneau, c.partie)
    const row = parCle[k]
    const ouverte = !!row && row.actif !== false
    const identique = c.ferme ? !ouverte : (ouverte && row.debut === c.debut && row.fin === c.fin)
    // L'écran a-t-il vu l'état actuel ? (ligne absente ⇔ maj_le_lu null)
    const vuActuel = row ? (c.maj_le_lu != null && String(row.maj_le ?? '') === c.maj_le_lu) : c.maj_le_lu == null
    if (identique) { inchangees++; continue }
    if (!vuActuel) {
      const etat = ouverte ? (row.debut + '-' + row.fin) : 'fermé'
      return { ok: false, http: 409, error: nomCellule(c.jour_semaine, c.creneau, c.partie) + ' a été modifié entre-temps (maintenant : ' + etat + ') : rechargez la page avant d’enregistrer.' }
    }
    joursTouches.add(c.jour_semaine)
    if (c.ferme) {
      actions.push({ type: 'update', cle: k, nom, id: String(row.id), maj_le: row.maj_le ?? null, patch: { actif: false } })
      final[k] = null
    } else if (row) {
      actions.push({ type: 'update', cle: k, nom, id: String(row.id), maj_le: row.maj_le ?? null, patch: { debut: c.debut as string, fin: c.fin as string, actif: true } })
      final[k] = { debut: c.debut as string, fin: c.fin as string }
    } else {
      actions.push({ type: 'insert', cle: k, nom, payload: { niveau, jour_semaine: c.jour_semaine, creneau: c.creneau, partie: c.partie, debut: c.debut as string, fin: c.fin as string, actif: true } })
      final[k] = { debut: c.debut as string, fin: c.fin as string }
    }
  }
  for (const j of joursTouches) {
    const p1 = final[cleCellule(j, 'journee', 1)] || null, p2 = final[cleCellule(j, 'journee', 2)] || null
    if (p2 && !p1) return { ok: false, http: 400, error: (JOURS_SEMAINE[j] || j) + ' · Journée : la partie 2 est ouverte mais pas la partie 1 (fermez la partie 2 ou ouvrez la partie 1).' }
    if (p1 && p2 && (hhmmVersHeures(p2.debut) as number) < (hhmmVersHeures(p1.fin) as number) - EPS) {
      return { ok: false, http: 400, error: (JOURS_SEMAINE[j] || j) + ' · Journée : la partie 2 (' + p2.debut + ') commence avant la fin de la partie 1 (' + p1.fin + ').' }
    }
  }
  return { ok: true, actions, inchangees }
}

/** Jours de recul / d'avance acceptés pour la date d'effet d'un changement de cadence. */
export const EFFET_RECUL_MAX_JOURS = 62
export const EFFET_AVANCE_MAX_JOURS = 400

/** Corps de POST /api/production/cadence/site : { site, niveau, niveau_lu, effet?, confirme_retroactif?, motif? }.
 *  niveau_lu = niveau que l'écran affichait POUR LA DATE D'EFFET (null si le site n'avait aucune ligne) ; effet = jour
 *  'AAAA-MM-JJ' à partir duquel la cadence s'applique (absent : le lendemain) ; confirme_retroactif = accord explicite pour
 *  un effet aujourd'hui ou avant (les heures déjà travaillées sont recalculées). */
export function validerChangementCadence(b: any): { ok: true; site: SiteCadence; niveau: NiveauCadence; motif: string | null; niveau_lu: NiveauCadence | null; effet: string | null; confirme_retroactif: boolean } | { ok: false; error: string } {
  const site = siteCadence(b && b.site)
  if (!site) return { ok: false, error: 'Site attendu : Seem ou Semrac.' }
  if (!estNiveau(b.niveau)) return { ok: false, error: 'Niveau de cadence attendu : bas, moyen ou haut.' }
  if (!('niveau_lu' in b)) return { ok: false, error: 'niveau_lu requis (cadence affichée à l’écran) : rechargez la page.' }
  const lu = b.niveau_lu == null || b.niveau_lu === '' ? null : b.niveau_lu
  if (lu !== null && !estNiveau(lu)) return { ok: false, error: 'niveau_lu invalide.' }
  const effet = b.effet == null || b.effet === '' ? null : String(b.effet).trim()
  if (effet !== null && !estDateIso(effet)) return { ok: false, error: 'Date d’effet invalide (AAAA-MM-JJ attendu).' }
  const motif = b.motif == null ? '' : String(b.motif).trim()
  if (motif.length > 500) return { ok: false, error: 'Motif trop long (500 caractères au plus).' }
  return { ok: true, site, niveau: b.niveau, motif: motif || null, niveau_lu: lu, effet, confirme_retroactif: b.confirme_retroactif === true }
}

/** Transition conditionnelle d'un changement de cadence (aujourdhui = jour de Paris, injectable pour les tests) :
 *  · effet absent → le LENDEMAIN (jamais toute la journée en cours par défaut) ;
 *  · effet aujourd'hui ou passé → 409 `confirmation_requise` sans `confirme_retroactif` (la journée entière, heures déjà
 *    travaillées comprises, change de cadence) ; au-delà de 62 jours de recul ou 400 jours d'avance → 400 ;
 *  · le niveau en vigueur À LA DATE D'EFFET (relu) doit être celui que l'écran affichait, et différent de la cible. */
export function decisionChangementCadence(
  cadences: LigneCadenceSite[],
  v: { site: SiteCadence; niveau: NiveauCadence; niveau_lu: NiveauCadence | null; effet?: string | null; confirme_retroactif?: boolean },
  aujourdhui?: string,
): { ok: true; avant: NiveauCadence | null; effet: string } | { ok: false; http: 400 | 409; error: string; confirmation_requise?: boolean } {
  const auj = aujourdhui && estDateIso(aujourdhui) ? aujourdhui : aujourdhuiParis()
  const effet = v.effet && estDateIso(v.effet) ? v.effet : isoPlusJours(auj, 1)
  const recul = diffJours(effet, auj)
  if (recul > EFFET_RECUL_MAX_JOURS) return { ok: false, http: 400, error: 'Date d’effet trop ancienne (' + dateLongue(effet) + ') : ' + EFFET_RECUL_MAX_JOURS + ' jours de recul au plus.' }
  if (-recul > EFFET_AVANCE_MAX_JOURS) return { ok: false, http: 400, error: 'Date d’effet trop lointaine (' + dateLongue(effet) + ') : ' + EFFET_AVANCE_MAX_JOURS + ' jours d’avance au plus.' }
  const lu = niveauDuSite(cadences, v.site, effet)
  if (lu !== v.niveau_lu) {
    return { ok: false, http: 409, error: 'La cadence de ' + v.site + ' au ' + dateLongue(effet) + ' a été modifiée entre-temps (maintenant : ' + (lu ? LIBELLES_NIVEAU[lu] : 'aucune') + ') : rechargez la page.' }
  }
  if (lu === v.niveau) return { ok: false, http: 409, error: v.site + ' est déjà en cadence ' + LIBELLES_NIVEAU[v.niveau] + ' le ' + dateLongue(effet) + '.' }
  if (recul >= 0 && v.confirme_retroactif !== true) {
    return {
      ok: false, http: 409, confirmation_requise: true,
      error: 'Une cadence qui prend effet ' + (recul === 0 ? 'aujourd’hui' : 'le ' + dateLongue(effet)) + ' s’applique à toute la journée' + (recul > 0 ? ' et aux jours suivants' : '') + ', heures déjà travaillées comprises (présences, RH › Temps, planning) : confirmez, ou choisissez une date d’effet future.',
    }
  }
  return { ok: true, avant: lu, effet }
}

/** Date lisible pour les messages : « samedi 19/09/2026 ». */
export function dateLongue(dateIso: string): string {
  const j = jourSemaineIso(dateIso)
  if (!j) return dateIso
  return JOURS_SEMAINE[j].toLowerCase() + ' ' + dateIso.slice(8, 10) + '/' + dateIso.slice(5, 7) + '/' + dateIso.slice(0, 4)
}

/** Présence d'un opérateur d'un site sur un créneau un jour donné : refusée si le créneau est fermé en cadence ce jour-là.
 *  « absent » et un site hors cadence (Support…) ne sont jamais refusés. */
export function controlePresenceCadence(donnees: DonneesCadence, activite: unknown, dateIso: string, shift: string, libelle: string):
  { ok: true; horaires: HorairesCreneau | null; niveau: NiveauCadence | null } | { ok: false; error: string; niveau: NiveauCadence } {
  const site = siteCadence(activite)
  if (!site || !estCreneau(shift)) return { ok: true, horaires: null, niveau: null }
  const r = horairesCreneauSite(donnees, site, dateIso, shift)
  if (r.horaires) return { ok: true, horaires: r.horaires, niveau: r.niveau }
  return {
    ok: false, niveau: r.niveau,
    error: 'Créneau « ' + (libelle || shift) + ' » fermé en cadence ' + LIBELLES_NIVEAU[r.niveau] + ' ce jour (' + dateLongue(dateIso) + ', site ' + site + ') : choisissez un créneau ouvert ou changez la cadence (Production › Process Ateliers › Cadence usine).',
  }
}

// ══════════════════════════════════════════════════════════════
// COPIE NAVIGATEUR (ES5) — objet global CAD, mêmes noms et mêmes résultats que ci-dessus.
// Injectée telle quelle dans une balise <script> (String.raw : aucune séquence d'échappement ; jamais de backtick ni
// d'interpolation dans ce texte). Parité vérifiée par scratchpad lotg/test_cadence.ts.
// ==CAD-MOTEUR-DEBUT==
export const CADENCE_CLIENT_JS = String.raw`
var CAD=(function(){
  var NIVEAUX=['bas','moyen','haut'], CRENEAUX=['matin','journee','apmidi','soir'], NIVEAU_DEFAUT='moyen', DIMANCHE=7, HORIZON=400, EPS=1e-9;
  var LIBELLES_NIVEAU={bas:'Bas',moyen:'Moyen',haut:'Haut'};
  var JOURS=['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  function estNiveau(n){ return typeof n==='string'&&NIVEAUX.indexOf(n)>=0; }
  function estCreneau(c){ return typeof c==='string'&&CRENEAUX.indexOf(c)>=0; }
  function estHhmm(s){ return typeof s==='string'&&/^([01][0-9]|2[0-3]):([0-5][0-9])$/.test(s); }
  function hhmmVersHeures(s){ if(typeof s!=='string') return null; var m=/^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(s.trim()); if(!m) return null; return Number(m[1])+Number(m[2])/60; }
  function heuresVersHhmm(h){ var n=Number(h); if(h===null||h===''||!isFinite(n)) return ''; var min=Math.round(n*60); min=((min%1440)+1440)%1440; var hh=Math.floor(min/60), mm=min%60; return (hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm; }
  function estDateIso(s){ if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)) return false; var d=new Date(s+'T00:00:00Z'); return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s; }
  function jourSemaineIso(iso){ if(!estDateIso(iso)) return 0; var d=new Date(iso+'T00:00:00Z').getUTCDay(); return d===0?7:d; }
  function isoPlusJours(iso,n){ var d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
  function diffJours(a,b){ return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000); }
  var FMT_PARIS, MEMO_PARIS={}, MEMO_PARIS_N=0, MEMO_AUJ={t:-Infinity,d:''};
  function formateurParis(){ if(FMT_PARIS===undefined){ try{ FMT_PARIS=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}); }catch(e){ FMT_PARIS=null; } } return FMT_PARIS; }
  function dateParis(ts){ if(!ts) return null; var k=String(ts); if(Object.prototype.hasOwnProperty.call(MEMO_PARIS,k)) return MEMO_PARIS[k];
    var r=null, d=new Date(k);
    if(!isNaN(d.getTime())){ var f=formateurParis(); try{ if(f){ var p=f.formatToParts(d); var o={}; for(var i=0;i<p.length;i++) o[p[i].type]=p[i].value; if(o.year&&o.month&&o.day) r=o.year+'-'+o.month+'-'+o.day; } }catch(e){} if(!r) r=d.toISOString().slice(0,10); }
    if(MEMO_PARIS_N>=5000){ MEMO_PARIS={}; MEMO_PARIS_N=0; } MEMO_PARIS[k]=r; MEMO_PARIS_N++; return r; }
  function aujourdhuiParis(){ var t=Date.now(); if(t-MEMO_AUJ.t>60000||t<MEMO_AUJ.t) MEMO_AUJ={t:t,d:dateParis(new Date(t).toISOString())||new Date(t).toISOString().slice(0,10)}; return MEMO_AUJ.d; }
  function siteCadence(a){ var s=String(a==null?'':a).trim().toLowerCase(); if(s==='seem') return 'Seem'; if(s==='semrac') return 'Semrac'; return null; }
  function sitesCadence(a){ var s=siteCadence(a); return s?[s]:['Seem','Semrac']; }
  function jourEffetCadence(l){ if(!l) return null; var e=l.effet==null?'':String(l.effet).slice(0,10); return estDateIso(e)?e:dateParis(l.depuis); }
  function signatureCadences(c){ var n=c.length, a=c[0], z=c[n-1]; return n?n+'|'+(a&&a.id)+'|'+(a&&a.depuis)+'|'+(z&&z.id)+'|'+(z&&z.depuis)+'|'+(z&&z.niveau)+'|'+(z&&z.effet):'0'; }
  function indexSiteCadence(cadences,site){
    var liste=Array.isArray(cadences)?cadences:[], sig=signatureCadences(liste), ix=Array.isArray(cadences)?cadences.__cadIndex:undefined;
    if(!ix||ix.sig!==sig){ ix={sig:sig,sites:{}}; if(Array.isArray(cadences)){ try{ Object.defineProperty(cadences,'__cadIndex',{value:ix,writable:true,configurable:true,enumerable:false}); }catch(e){} } }
    if(!Object.prototype.hasOwnProperty.call(ix.sites,site)){
      var avec=[];
      for(var i=0;i<liste.length;i++){ var l=liste[i]; if(!l||siteCadence(l.site)!==site||!estNiveau(l.niveau)) continue; var t=Date.parse(String(l.depuis)); if(isNaN(t)) continue; var j=jourEffetCadence(l); if(j) avec.push({l:l,j:j,t:t,i:i}); }
      avec.sort(function(a,b){ return a.j<b.j?-1:(a.j>b.j?1:((a.t-b.t)||(a.i-b.i))); });
      ix.sites[site]={lignes:avec.map(function(x){ return x.l; }),jours:avec.map(function(x){ return x.j; }),parDate:{}};
    }
    return ix.sites[site];
  }
  function ligneCadenceDuSite(cadences,site,dateIso){ var ix=indexSiteCadence(cadences,site); if(!ix.lignes.length) return null; var d=dateIso?String(dateIso):aujourdhuiParis();
    if(Object.prototype.hasOwnProperty.call(ix.parDate,d)) return ix.parDate[d];
    var lo=0, hi=ix.jours.length-1, k=-1; while(lo<=hi){ var mid=(lo+hi)>>1; if(ix.jours[mid]<=d){ k=mid; lo=mid+1; } else hi=mid-1; }
    var r=k>=0?ix.lignes[k]:ix.lignes[0]; ix.parDate[d]=r; return r; }
  function niveauDuSite(cadences,site,dateIso){ var l=ligneCadenceDuSite(cadences,site,dateIso); return l?l.niveau:null; }
  function changementsPrevusCadence(cadences,site,dateIso){ var ix=indexSiteCadence(cadences,site), d=dateIso?String(dateIso):aujourdhuiParis(), out=[]; for(var i=0;i<ix.lignes.length;i++) if(ix.jours[i]>d) out.push({ligne:ix.lignes[i],effet:ix.jours[i]}); return out; }
  function creneauxDuJour(modeles,niveau,dateIso){
    var j=jourSemaineIso(dateIso); if(!j||j===DIMANCHE||!estNiveau(niveau)) return [];
    var out=[], ms=Array.isArray(modeles)?modeles:[];
    for(var i=0;i<ms.length;i++){ var m=ms[i];
      if(!m||m.actif===false||m.niveau!==niveau||Number(m.jour_semaine)!==j||!estCreneau(m.creneau)) continue;
      var p=Number(m.partie); if(p!==1&&p!==2) continue;
      var d=hhmmVersHeures(m.debut), f=hhmmVersHeures(m.fin); if(d==null||f==null||Math.abs(d-f)<EPS) continue; if(f<d) f+=24;
      if(j===DIMANCHE-1&&f>24) f=24;
      out.push({creneau:m.creneau,partie:p,debut:d,fin:f}); }
    return out.sort(function(a,b){ return (a.debut-b.debut)||(CRENEAUX.indexOf(a.creneau)-CRENEAUX.indexOf(b.creneau))||(a.partie-b.partie); });
  }
  function plageOuverteDuJour(modeles,niveau,dateIso){ var s=creneauxDuJour(modeles,niveau,dateIso); if(!s.length) return null; var d=Infinity,f=-Infinity;
    for(var i=0;i<s.length;i++){ if(s[i].debut<d) d=s[i].debut; if(s[i].fin>f) f=s[i].fin; } return {debut:d,fin:f}; }
  function horairesCreneau(modeles,niveau,dateIso,creneau){
    var segs=creneauxDuJour(modeles,niveau,dateIso).filter(function(s){ return s.creneau===creneau; }); if(!segs.length||!estCreneau(creneau)) return null;
    var heures=0,d=Infinity,f=-Infinity;
    var parties=segs.map(function(s){ heures+=s.fin-s.debut; if(s.debut<d) d=s.debut; if(s.fin>f) f=s.fin; return {partie:s.partie,debut:heuresVersHhmm(s.debut),fin:heuresVersHhmm(s.fin)}; });
    heures=Math.round(heures*1e6)/1e6;
    return {creneau:creneau,parties:parties,texte:parties.map(function(p){ return p.debut+'-'+p.fin; }).join(' / '),debut:d,fin:f,heures:heures,pauseMin:Math.max(0,Math.round((f-d-heures)*60))};
  }
  function horairesCreneauSite(donnees,site,dateIso,creneau){ var n=niveauDuSite(donnees.cadences,site,dateIso)||NIVEAU_DEFAUT; return {niveau:n,horaires:horairesCreneau(donnees.modeles,n,dateIso,creneau)}; }
  function libelleCreneauDuJour(libelle,h){ return h?libelle+' '+h.texte:libelle+' (fermé)'; }
  function calendrierCadence(donnees,act){ var sites=[];
    if(Array.isArray(act)){ for(var i=0;i<act.length;i++){ var s=siteCadence(act[i]); if(s&&sites.indexOf(s)<0) sites.push(s); } } else sites=sitesCadence(act);
    return {sites:sites,modeles:(donnees&&Array.isArray(donnees.modeles))?donnees.modeles:[],cadences:(donnees&&Array.isArray(donnees.cadences))?donnees.cadences:[],cache:{}}; }
  function segmentsDuJour(cal,dateIso){
    if(cal.cache&&cal.cache[dateIso]) return cal.cache[dateIso];
    var out=[];
    for(var i=0;i<cal.sites.length;i++){ var site=cal.sites[i]; var n=niveauDuSite(cal.cadences,site,dateIso)||NIVEAU_DEFAUT; var cs=creneauxDuJour(cal.modeles,n,dateIso);
      for(var k=0;k<cs.length;k++) out.push({site:site,niveau:n,creneau:cs[k].creneau,partie:cs[k].partie,debut:cs[k].debut,fin:cs[k].fin}); }
    out.sort(function(a,b){ return (a.debut-b.debut)||(a.fin-b.fin); });
    if(cal.cache) cal.cache[dateIso]=out; return out;
  }
  function intervallesDuJour(cal,dateIso){ var out=[], s=segmentsDuJour(cal,dateIso);
    for(var i=0;i<s.length;i++){ var der=out[out.length-1]; if(der&&s[i].debut<=der[1]+EPS){ if(s[i].fin>der[1]) der[1]=s[i].fin; } else out.push([s[i].debut,s[i].fin]); } return out; }
  function plageOuverteCalendrier(cal,dateIso){ var iv=intervallesDuJour(cal,dateIso); if(!iv.length) return null; var f=-Infinity; for(var i=0;i<iv.length;i++) if(iv[i][1]>f) f=iv[i][1]; return {debut:iv[0][0],fin:f}; }
  function intervallesAbs(cal,d0,off){ return intervallesDuJour(cal,isoPlusJours(d0,off)).map(function(iv){ return [iv[0]+24*off,iv[1]+24*off]; }); }
  function intervalleOuvertApres(cal,d0,t0,horizon){
    var jour=Math.floor(t0/24), dernier=jour+horizon, t=t0;
    while(jour<=dernier){
      var best=null;
      for(var o=jour-1;o<=jour+1;o++){ var ivs=intervallesAbs(cal,d0,o); for(var i=0;i<ivs.length;i++) if(ivs[i][1]>t+EPS&&(!best||ivs[i][0]<best[0])) best=ivs[i]; }
      if(best){ var fin=best[1], prolonge=true, garde=0;
        while(prolonge&&garde++<horizon*4){ prolonge=false; var j2=Math.floor(fin/24);
          for(var o2=j2-1;o2<=j2+1;o2++){ var iv2=intervallesAbs(cal,d0,o2); for(var k=0;k<iv2.length;k++) if(iv2[k][0]<=fin+EPS&&iv2[k][1]>fin+EPS){ fin=iv2[k][1]; prolonge=true; } } }
        return {debut:Math.max(best[0],t),fin:fin}; }
      jour++; t=Math.max(t,24*jour);
    }
    return null;
  }
  function versInstant(dateIso,abs0){ var abs=Math.round(abs0*1e6)/1e6; var k=Math.floor(abs/24); return {date:isoPlusJours(dateIso,k),heure:Math.round((abs-24*k)*1e6)/1e6}; }
  function ecartHeures(a,b){ return diffJours(a.date,b.date)*24+(Number(b.heure)-Number(a.heure)); }
  function estOuvert(dateIso,heure,cal){ if(!estDateIso(dateIso)||!isFinite(Number(heure))) return false; var i=versInstant(dateIso,Number(heure));
    for(var o=-1;o<=0;o++){ var ivs=intervallesAbs(cal,i.date,o); for(var k=0;k<ivs.length;k++) if(ivs[k][0]<=i.heure+EPS&&ivs[k][1]>i.heure+EPS) return true; } return false; }
  function prochainInstantOuvert(dateIso,heure,cal,horizon){ if(!estDateIso(dateIso)||!isFinite(Number(heure))) return null; var hz=horizon==null?HORIZON:horizon; var i=versInstant(dateIso,Number(heure));
    var iv=intervalleOuvertApres(cal,i.date,i.heure,hz); return iv?versInstant(i.date,iv.debut):null; }
  function ajouterHeuresOuvrees(dateIso,heure,h,cal,horizon){
    if(!estDateIso(dateIso)||!isFinite(Number(heure))||!isFinite(Number(h))) return null; var hz=horizon==null?HORIZON:horizon;
    var dep=versInstant(dateIso,Number(heure)); if(!(Number(h)>EPS)) return prochainInstantOuvert(dep.date,dep.heure,cal,hz);
    var reste=Number(h), t=dep.heure;
    for(var g=0;g<hz*8;g++){ var iv=intervalleOuvertApres(cal,dep.date,t,hz); if(!iv) return null; var dispo=iv.fin-iv.debut;
      if(reste<=dispo+EPS) return versInstant(dep.date,iv.debut+reste); reste-=dispo; t=iv.fin; }
    return null;
  }
  function heuresOuvreesEntre(a,b,cal,horizon){
    if(!a||!b||!estDateIso(a.date)||!estDateIso(b.date)) return 0; var hz=horizon==null?HORIZON:horizon;
    var fin=ecartHeures(a,b)+Number(a.heure), t=Number(a.heure), total=0;
    for(var g=0;g<hz*8&&t<fin-EPS;g++){ var iv=intervalleOuvertApres(cal,a.date,t,hz); if(!iv||iv.debut>=fin-EPS) break; total+=Math.min(iv.fin,fin)-iv.debut; t=iv.fin; }
    return Math.round(total*1e6)/1e6;
  }
  function dateLongue(dateIso){ var j=jourSemaineIso(dateIso); if(!j) return dateIso; return JOURS[j].toLowerCase()+' '+dateIso.slice(8,10)+'/'+dateIso.slice(5,7)+'/'+dateIso.slice(0,4); }
  return {NIVEAUX:NIVEAUX,CRENEAUX:CRENEAUX,NIVEAU_DEFAUT:NIVEAU_DEFAUT,LIBELLES_NIVEAU:LIBELLES_NIVEAU,JOURS:JOURS,
    estNiveau:estNiveau,estCreneau:estCreneau,estHhmm:estHhmm,hhmmVersHeures:hhmmVersHeures,heuresVersHhmm:heuresVersHhmm,estDateIso:estDateIso,
    jourSemaineIso:jourSemaineIso,isoPlusJours:isoPlusJours,diffJours:diffJours,dateParis:dateParis,aujourdhuiParis:aujourdhuiParis,siteCadence:siteCadence,sitesCadence:sitesCadence,
    jourEffetCadence:jourEffetCadence,changementsPrevusCadence:changementsPrevusCadence,
    ligneCadenceDuSite:ligneCadenceDuSite,niveauDuSite:niveauDuSite,creneauxDuJour:creneauxDuJour,plageOuverteDuJour:plageOuverteDuJour,
    horairesCreneau:horairesCreneau,horairesCreneauSite:horairesCreneauSite,libelleCreneauDuJour:libelleCreneauDuJour,calendrierCadence:calendrierCadence,
    segmentsDuJour:segmentsDuJour,intervallesDuJour:intervallesDuJour,plageOuverteCalendrier:plageOuverteCalendrier,versInstant:versInstant,ecartHeures:ecartHeures,
    estOuvert:estOuvert,prochainInstantOuvert:prochainInstantOuvert,ajouterHeuresOuvrees:ajouterHeuresOuvrees,heuresOuvreesEntre:heuresOuvreesEntre,dateLongue:dateLongue};
})();
`
// ==CAD-MOTEUR-FIN==
