// ══════════════════════════════════════════════════════════════
// MOTEUR DE CALCUL KPI – ERP Seem Semrac v2.0
// Fonctions PURES sur DashboardData → nombres / séries structurés.
// Réutilise les formules métier existantes (shared.ts / queries.ts).
// 100% défensif : toute table vide / champ manquant → 0 / null / [].
// ══════════════════════════════════════════════════════════════
import type { DashboardData } from './queries'
import { computeNomCostForQty, coutEtapeST } from './shared'
import type { DashFilter } from './dash_filter'
import { period, filterRows } from './dash_filter'

// ─── GÉNÉRIQUES ───────────────────────────────────────────────
export const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
export const lc = (s: any) => String(s ?? '').toLowerCase()
export const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const round2 = (n: number) => Math.round(n * 100) / 100
export const round1 = (n: number) => Math.round(n * 10) / 10
export const pctOf = (a: number, b: number) => b > 0 ? Math.round(a / b * 100) : 0
export const curYM = () => new Date().toISOString().slice(0, 7)
export const curYear = () => new Date().toISOString().slice(0, 4)
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const MONTHS_FR = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export const fmtEur = (n: number) => { n = Math.round(num(n)); const a = Math.abs(n); return a >= 1000 ? +(n / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k€' : n + '€' }
export const fmtPct = (n: number) => (Math.round(num(n) * 10) / 10) + '%'

export const TERMINAL = ['termine', 'terminé', 'solde', 'soldé', 'cloture', 'cloturé', 'clôturé', 'annule', 'annulé', 'livre', 'livré', 'expedie', 'expédié', 'paye', 'payee', 'payée', 'rejete', 'rejeté', 'refuse', 'refusé', 'archive', 'archivé', 'perdu', 'fermee', 'fermé', 'fermée']
export const isOpen = (statut: any) => !TERMINAL.includes(lc(statut))
export const prioColor = (p: any) => lc(p) === 'critique' ? '#ef4444' : lc(p) === 'urgent' ? '#f59e0b' : '#22c55e'

// % de variation cur vs prev → flèche tendance (null si pas de base)
export const deltaPct = (cur: number, prev: number): number | null => {
  if (!isFinite(prev) || prev === 0) return null
  return Math.round((cur - prev) / Math.abs(prev) * 100)
}
// formate un delta en libellé signé pour kpiCard.trend (+12% / -8% / null)
export const trendLabel = (cur: number, prev: number): string | undefined => {
  const d = deltaPct(cur, prev)
  return d == null ? undefined : (d > 0 ? '+' : '') + d + '%'
}

export const daysBetween = (a?: any, b?: any): number | null => {
  if (!a || !b) return null
  const ta = Date.parse(String(a).slice(0, 10)), tb = Date.parse(String(b).slice(0, 10))
  if (!isFinite(ta) || !isFinite(tb)) return null
  return Math.round((tb - ta) / 86400000)
}
export const daysSince = (d?: any): number | null => d ? daysBetween(d, todayISO()) : null

export const sumBy = <T,>(rows: T[], f: (r: T) => number) => (rows || []).reduce((s, r) => s + num(f(r)), 0)
export const groupSum = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number): Record<string, number> => {
  const o: Record<string, number> = {}
  for (const r of rows || []) { const k = key(r) || '—'; o[k] = (o[k] || 0) + num(val(r)) }
  return o
}
export const topN = (o: Record<string, number>, n = 5) => Object.entries(o).filter(e => e[1] !== 0).sort((a, b) => b[1] - a[1]).slice(0, n)

// Série mensuelle. 4e arg = nombre de mois (année courante depuis janvier, défaut 12)
// OU une liste de clés 'YYYY-MM' (période arbitraire, pour les dashboards filtrables).
export const monthlySeries = (rows: any[], dateField: string, valField: string | null, monthsOrN: number | string[] = 12) => {
  if (Array.isArray(monthsOrN)) {
    const idx: Record<string, number> = {}; monthsOrN.forEach((k, i) => { idx[k] = i })
    const arr = Array(monthsOrN.length).fill(0)
    for (const r of rows || []) { const ym = String(r?.[dateField] ?? '').slice(0, 7); const i = idx[ym]; if (i != null) arr[i] += valField ? num(r[valField]) : 1 }
    return arr
  }
  const y = curYear(); const nMonths = monthsOrN; const arr = Array(nMonths).fill(0)
  for (const r of rows || []) {
    const dt = String(r?.[dateField] ?? ''); if (dt.slice(0, 4) !== y) continue
    const m = parseInt(dt.slice(5, 7), 10) - 1
    if (m >= 0 && m < nMonths) arr[m] += valField ? num(r[valField]) : 1
  }
  return arr
}

// Buckets MENSUELS FUTURS (mois courant + n-1) : labels 'MMM AA', somme de valField par mois du dateField.
// Lignes datées avant l'horizon (ou sans date) → `retard` ; au-delà → `auDela`.
export const forwardMonthly = (rows: any[], dateField: string, valField: string | null, nMonths = 6) => {
  const now = new Date(todayISO() + 'T00:00:00Z')
  const keys: string[] = [], labels: string[] = [], buckets: number[] = Array(nMonths).fill(0)
  for (let i = 0; i < nMonths; i++) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))
    keys.push(dt.toISOString().slice(0, 7))
    labels.push(MONTHS_FR[dt.getUTCMonth()] + ' ' + String(dt.getUTCFullYear()).slice(2))
  }
  let retard = 0, auDela = 0
  for (const r of rows || []) {
    const v = valField ? num(r?.[valField]) : 1
    const ym = String(r?.[dateField] || '').slice(0, 7)
    if (!ym) { retard += v; continue }
    const idx = keys.indexOf(ym)
    if (idx >= 0) buckets[idx] += v
    else if (ym < keys[0]) retard += v
    else auDela += v
  }
  return { labels, buckets, retard, auDela }
}

// Buckets HEBDO FUTURS (semaine courante + n-1), labellisés par le lundi (jj/mm).
// Essaie chaque champ de `dateFields` dans l'ordre pour dater la ligne.
export const forwardWeekly = (rows: any[], dateFields: string[], valField: string | null, nWeeks = 8) => {
  const now = new Date(todayISO() + 'T00:00:00Z')
  const dow = (now.getUTCDay() + 6) % 7 // 0 = lundi
  const monday0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow)
  const labels: string[] = [], buckets: number[] = Array(nWeeks).fill(0)
  for (let i = 0; i < nWeeks; i++) { const m = new Date(monday0 + i * 7 * 864e5); labels.push(('0' + m.getUTCDate()).slice(-2) + '/' + ('0' + (m.getUTCMonth() + 1)).slice(-2)) }
  let retard = 0, auDela = 0
  for (const r of rows || []) {
    const v = valField ? num(r?.[valField]) : 1
    let ds = ''
    for (const f of dateFields) { if (r?.[f]) { ds = String(r[f]).slice(0, 10); break } }
    if (!ds) { retard += v; continue }
    const t = Date.parse(ds); if (!isFinite(t)) { retard += v; continue }
    const idx = Math.floor((t - monday0) / (7 * 864e5))
    if (idx < 0) retard += v
    else if (idx < nWeeks) buckets[idx] += v
    else auDela += v
  }
  return { labels, buckets, retard, auDela }
}

// Tranches d'antériorité (aging) sur un champ date d'échéance, pondérées par montant.
export const agingBuckets = (rows: any[], dateField: string, montantField: string) => {
  const today = Date.parse(todayISO())
  const b = { b0_30: 0, b30_60: 0, b60_90: 0, b90: 0, total: 0 }
  for (const r of rows || []) {
    const ech = r?.[dateField]; if (!ech) continue
    const t = Date.parse(String(ech).slice(0, 10)); if (!isFinite(t)) continue
    const j = Math.round((today - t) / 86400000)  // positif = en retard
    const m = num(r[montantField]); if (m <= 0) continue
    b.total += m
    if (j <= 30) b.b0_30 += m; else if (j <= 60) b.b30_60 += m; else if (j <= 90) b.b60_90 += m; else b.b90 += m
  }
  return b
}

// ─── OBJECTIFS / CIBLES (table kpi_objectifs + défauts codés) ──
export type Objectif = { code: string; libelle: string; cible: number; unite: string; sens: 'haut' | 'bas'; seuil_alerte: number }
const DEFAULT_OBJECTIFS: Record<string, Objectif> = {
  otd: { code: 'otd', libelle: 'OTD', cible: 95, unite: '%', sens: 'haut', seuil_alerte: 90 },
  otk: { code: 'otk', libelle: 'OTK', cible: 92, unite: '%', sens: 'haut', seuil_alerte: 85 },
  conversion: { code: 'conversion', libelle: 'Conversion', cible: 30, unite: '%', sens: 'haut', seuil_alerte: 20 },
  marge_pct: { code: 'marge_pct', libelle: 'Marge', cible: 25, unite: '%', sens: 'haut', seuil_alerte: 15 },
  dso: { code: 'dso', libelle: 'DSO', cible: 45, unite: 'j', sens: 'bas', seuil_alerte: 60 },
  dpo: { code: 'dpo', libelle: 'DPO', cible: 45, unite: 'j', sens: 'haut', seuil_alerte: 30 },
  dispo_machine: { code: 'dispo_machine', libelle: 'Disponibilité', cible: 90, unite: '%', sens: 'haut', seuil_alerte: 80 },
  oee: { code: 'oee', libelle: 'OEE', cible: 75, unite: '%', sens: 'haut', seuil_alerte: 60 },
  taux_nc: { code: 'taux_nc', libelle: 'Taux NC', cible: 2, unite: '%', sens: 'bas', seuil_alerte: 5 },
  cpk: { code: 'cpk', libelle: 'Cpk', cible: 1.33, unite: 'ratio', sens: 'haut', seuil_alerte: 1 },
  liberation_pv: { code: 'liberation_pv', libelle: 'Libération PV', cible: 95, unite: '%', sens: 'haut', seuil_alerte: 90 },
  absenteisme: { code: 'absenteisme', libelle: 'Absentéisme', cible: 4, unite: '%', sens: 'bas', seuil_alerte: 8 },
  rotation_stock: { code: 'rotation_stock', libelle: 'Rotation stock', cible: 6, unite: 'ratio', sens: 'haut', seuil_alerte: 3 },
  couverture_stock: { code: 'couverture_stock', libelle: 'Couverture', cible: 2, unite: 'mois', sens: 'bas', seuil_alerte: 4 },
  fill_rate: { code: 'fill_rate', libelle: 'Fill rate', cible: 95, unite: '%', sens: 'haut', seuil_alerte: 85 },
  reprise: { code: 'reprise', libelle: 'Reprise', cible: 3, unite: '%', sens: 'bas', seuil_alerte: 8 },
  // ── Environnement (ISO 14001) ──
  conformite_env: { code: 'conformite_env', libelle: 'Conformité réglementaire', cible: 98, unite: '%', sens: 'haut', seuil_alerte: 90 },
  dechets_dd: { code: 'dechets_dd', libelle: 'Déchets dangereux', cible: 1, unite: 't', sens: 'bas', seuil_alerte: 1.5 },
  dechets_dnd: { code: 'dechets_dnd', libelle: 'Déchets non dangereux', cible: 1, unite: 't', sens: 'bas', seuil_alerte: 1.5 },
  conso_eau: { code: 'conso_eau', libelle: 'Consommation eau', cible: 2500, unite: 'm³', sens: 'bas', seuil_alerte: 3000 },
  taux_valo: { code: 'taux_valo', libelle: 'Déchets valorisés', cible: 70, unite: '%', sens: 'haut', seuil_alerte: 50 },
  bsd_conforme: { code: 'bsd_conforme', libelle: 'BSD conformes', cible: 100, unite: '%', sens: 'haut', seuil_alerte: 95 },
  incidents_env: { code: 'incidents_env', libelle: 'Incidents environnementaux', cible: 3, unite: 'nb', sens: 'bas', seuil_alerte: 6 },
}
// Résout une cible : ligne kpi_objectifs (entite spécifique > global) sinon défaut codé.
export const objectif = (d: DashboardData, code: string, entite = 'global'): Objectif => {
  const rows = (d.objectifs || []).filter((o: any) => o.code === code)
  const hit = rows.find((o: any) => lc(o.entite) === lc(entite)) || rows.find((o: any) => lc(o.entite) === 'global') || rows[0]
  if (hit) return { code, libelle: hit.libelle || code, cible: num(hit.cible), unite: hit.unite || '%', sens: (hit.sens === 'bas' ? 'bas' : 'haut'), seuil_alerte: num(hit.seuil_alerte) }
  return DEFAULT_OBJECTIFS[code] || { code, libelle: code, cible: 0, unite: '%', sens: 'haut', seuil_alerte: 0 }
}
// Statut d'atteinte d'une valeur vs son objectif → couleur.
export const statutObjectif = (val: number, obj: Objectif): { etat: 'ok' | 'warn' | 'bad'; color: string } => {
  const v = num(val)
  if (obj.sens === 'haut') {
    if (v >= obj.cible) return { etat: 'ok', color: '#22c55e' }
    if (v >= obj.seuil_alerte) return { etat: 'warn', color: '#f59e0b' }
    return { etat: 'bad', color: '#ef4444' }
  } else {
    if (v <= obj.cible) return { etat: 'ok', color: '#22c55e' }
    if (v <= obj.seuil_alerte) return { etat: 'warn', color: '#f59e0b' }
    return { etat: 'bad', color: '#ef4444' }
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS MÉTIER PARTAGÉS
// ══════════════════════════════════════════════════════════════
// Map cmd_id → date de livraison réelle (dernier BL client de la commande)
const realShipDate = (d: DashboardData): Map<string, string> => {
  const m = new Map<string, string>()
  for (const bl of (d.bls || [])) {
    if (lc((bl as any).type_bl) === 'bst') continue
    const cid = String((bl as any).cmd_id || ''); const dt = String((bl as any).date_bl || '').slice(0, 10)
    if (!cid || !dt) continue
    if (!m.has(cid) || dt > (m.get(cid) as string)) m.set(cid, dt)
  }
  return m
}
const lots = (d: DashboardData) => d.lots || []
const cmdSiteMap = (d: DashboardData): Map<string, string> => {
  const m = new Map<string, string>()
  for (const c of (d.commandes || [])) if ((c as any).id) m.set(String((c as any).id), lc((c as any).activite))
  return m
}
// Jours ouvrés écoulés dans le mois courant (1 équipe ~7h/j) — pour takt.
const heuresDispoMois = (): number => {
  const now = new Date(todayISO() + 'T00:00:00Z'); let j = 0
  for (let day = 1; day <= now.getUTCDate(); day++) { const wd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day)).getUTCDay(); if (wd >= 1 && wd <= 5) j++ }
  return j * 7
}

// ══════════════════════════════════════════════════════════════
// COMMERCIAL
// ══════════════════════════════════════════════════════════════
// Décale une liste de clés 'YYYY-MM' d'une année en arrière (pour N vs N-1).
const prevYearKeys = (keys: string[]) => keys.map(k => (Number(k.slice(0, 4)) - 1) + k.slice(4))
// Mois précédant 'YYYY-MM'.
const prevYmOf = (ym: string) => { const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)); return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7) }

export function commercial(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  const prevYm = prevYmOf(P.ym)

  const fc = filterRows(d.facturesClient || [], f, { clientField: 'client_nom' }) as any[]
  const caMois = sumBy(fc.filter(x => String(x.date_facture || '').slice(0, 7) === P.ym), x => x.montant_ht)
  const caYTD = sumBy(fc.filter(x => inP(x, 'date_facture')), x => x.montant_ht)
  const serieCA = monthlySeries(fc, 'date_facture', 'montant_ht', mk)
  const serieCAprev = monthlySeries(fc, 'date_facture', 'montant_ht', prevYearKeys(mk))
  const caPrevMois = sumBy(fc.filter(x => String(x.date_facture || '').slice(0, 7) === prevYm), x => x.montant_ht)

  const offres = filterRows(d.offres || [], f, { clientField: 'client_nom' }) as any[]
  const offSent = offres.filter(o => lc(o.statut) !== 'brouillon')
  const offWon = offres.filter(o => /accept|gagn|command|valid/.test(lc(o.statut)))
  const offWait = offres.filter(o => /envoy|attente|cours/.test(lc(o.statut)))
  const conversion = pctOf(offWon.length, offSent.length)
  const valeurPipeline = sumBy(offWait, o => o.montant)

  const cmds = filterRows(d.commandes || [], f, { clientField: 'client_nom' }) as any[]
  const cmdOpen = cmds.filter(c => isOpen(c.statut))
  const carnet = sumBy(cmdOpen, c => c.montant)
  const cmdPer = cmds.filter(c => inP(c, 'date_cmd'))
  const panierMoyen = cmdPer.length ? Math.round(sumBy(cmdPer, c => c.montant) / cmdPer.length) : 0

  const byClient = groupSum(cmds, c => c.client_nom, c => c.montant)
  const top = topN(byClient, 6)
  const totalClients = Object.values(byClient).reduce((s, v) => s + v, 0)
  const concentration = totalClients > 0 && top.length ? Math.round(top[0][1] / totalClients * 100) : 0
  let cum = 0; const paretoClients = top.map(e => { cum += e[1]; return { nom: e[0], montant: e[1], cumPct: totalClients > 0 ? Math.round(cum / totalClients * 100) : 0 } })

  const seemS = monthlySeries(cmds.filter(c => lc(c.activite) === 'seem'), 'date_cmd', 'montant', mk).map(v => Math.round(v / 1000))
  const semracS = monthlySeries(cmds.filter(c => lc(c.activite) === 'semrac'), 'date_cmd', 'montant', mk).map(v => Math.round(v / 1000))
  const cmdSeriePrev = monthlySeries(cmds, 'date_cmd', 'montant', prevYearKeys(mk)).map(v => Math.round(v / 1000))

  const dts = filterRows(d.dts || [], f, { clientField: 'client_nom' }) as any[]
  const dtOpen = dts.filter(x => isOpen(x.statut))
  const dtCrit = dtOpen.filter(x => lc(x.priorite) === 'critique').length

  return {
    caMois, caYTD, caPrevMois, serieCA, serieCAprev, trendCA: trendLabel(caMois, caPrevMois),
    conversion, offSent: offSent.length, offWon: offWon.length, offWait,
    valeurPipeline, carnet, panierMoyen,
    topClients: top, concentration, paretoClients, seemS, semracS, cmdSeriePrev,
    dtOpen, dtCrit,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// FINANCE / TRÉSORERIE  (centralise compta_service.tsx)
// ══════════════════════════════════════════════════════════════
const ttc = (f: any) => num(f.montant_ttc) || num(f.montant_ht) * (1 + (num(f.tva_pct) || 20) / 100)
export function finance(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key); const pk = prevYearKeys(mk)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  const fc = filterRows(d.facturesClient || [], f, { clientField: 'client_nom' }) as any[]
  const ff = filterRows(d.facturesFournisseur || [], f, { clientField: 'fournisseur_nom' }) as any[]
  const fcY = fc.filter(x => inP(x, 'date_facture'))
  const ffY = ff.filter(x => inP(x, 'date_facture'))

  const caHT = sumBy(fcY, f2 => f2.montant_ht)
  const chargesHT = sumBy(ffY, f2 => f2.montant_ht)
  const margeHT = caHT - chargesHT
  const tauxMarge = caHT > 0 ? Math.round(margeHT / caHT * 100) : 0

  const isPaid = (f2: any) => lc(f2.statut) === 'payee' || lc(f2.statut) === 'payée' || lc(f2.statut) === 'paye'
  const encaisse = sumBy(fcY.filter(isPaid), f2 => ttc(f2))
  const decaisse = sumBy(ffY.filter(isPaid), f2 => ttc(f2))
  const tresorerie = encaisse - decaisse

  const encoursClients = sumBy(fc.filter(f2 => !isPaid(f2) && lc(f2.statut) !== 'brouillon' && lc(f2.statut) !== 'annulee'), f2 => ttc(f2))
  const encoursFourn = sumBy(ff.filter(f2 => !isPaid(f2) && lc(f2.statut) !== 'brouillon'), f2 => ttc(f2))
  const dso = caHT > 0 ? Math.round(encoursClients / caHT * 365) : 0
  const dpo = chargesHT > 0 ? Math.round(encoursFourn / chargesHT * 365) : 0

  // Aging créances clients + dettes fournisseurs (symétrique)
  const aging = agingBuckets(fc.filter(f2 => !isPaid(f2) && lc(f2.statut) !== 'brouillon'), 'date_echeance', 'montant_ttc')
  const agingFourn = agingBuckets(ff.filter(f2 => !isPaid(f2) && lc(f2.statut) !== 'brouillon'), 'date_echeance', 'montant_ttc')
  const impayes = sumBy(fc.filter(f2 => /retard/.test(lc(f2.statut)) || (f2.date_echeance && String(f2.date_echeance).slice(0, 10) < todayISO() && !isPaid(f2))), f2 => ttc(f2))

  // Séries mensuelles bornées à la période (+ N-1) : CA HT, charges HT, encaissements, décaissements + base 100
  const caSerie = monthlySeries(fc, 'date_facture', 'montant_ht', mk)
  const caSeriePrev = monthlySeries(fc, 'date_facture', 'montant_ht', pk)
  const chSerie = monthlySeries(ff, 'date_facture', 'montant_ht', mk)
  const encSerie = monthlySeries(fc.filter(isPaid), 'date_paiement', 'montant_ttc', mk)
  const decSerie = monthlySeries(ff.filter(isPaid), 'date_paiement', 'montant_ttc', mk)
  const baseRef = caSerie.find(v => v > 0) || 0
  const base100 = caSerie.map(v => baseRef > 0 ? Math.round(v / baseRef * 100) : 0)
  const recouvrement = caSerie.map((v, i) => v > 0 ? Math.round((encSerie[i] || 0) / v * 100) : 0)

  const topClients = topN(groupSum(fcY, f2 => f2.client_nom, f2 => f2.montant_ht), 6)
  const chargesParCat = topN(groupSum(ffY, f2 => f2.compte_charge || f2.type || 'Autres', f2 => f2.montant_ht), 6)

  return {
    caHT, chargesHT, margeHT, tauxMarge,
    encaisse, decaisse, tresorerie, encoursClients, encoursFourn, dso, dpo,
    aging, agingFourn, impayes, caSerie, caSeriePrev, chSerie, encSerie, decSerie, base100, recouvrement, topClients, chargesParCat,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'YTD',
  }
}

// ══════════════════════════════════════════════════════════════
// PRODUCTION  (OTD/OTK réels, takt, lead time, charge)
// ══════════════════════════════════════════════════════════════
export function production(d: DashboardData, f?: DashFilter) {
  const P = period(f)
  const cmds = filterRows(d.commandes || [], f, { clientField: 'client_nom' }) as any[]
  const ship = realShipDate(d)
  const closed = cmds.filter(c => !isOpen(c.statut))
  // OTD réel : commande livrée à l'heure (BL réel ≤ date_liv promise) ; fallback flag retard.
  const otdEval = (list: any[]) => {
    let tot = 0, ot = 0
    for (const c of list) {
      const promise = c.date_liv ? String(c.date_liv).slice(0, 10) : null
      const actual = ship.get(String(c.id)) || null
      if (promise && actual) { tot++; if (actual <= promise) ot++ }
      else if (!isOpen(c.statut)) { tot++; if (!c.retard) ot++ }
    }
    return { pct: tot ? Math.round(ot / tot * 100) : 0, tot, ot }
  }
  const otd = otdEval(closed.length ? closed : cmds)

  const ncs = (d.ncs || []) as any[]
  const ncBloq = ncs.filter(n => isOpen(n.statut) && /critique|bloquante/.test(lc(n.gravite))).length
  const baseN = Math.max(1, (closed.length || cmds.length))
  const otk = Math.max(0, Math.round(otd.pct * Math.max(0, 1 - ncBloq / baseN)))

  // Lead time moyen (date_cmd → date_liv)
  const leads = cmds.map(c => daysBetween(c.date_cmd, c.date_liv)).filter((x): x is number => x != null && x >= 0)
  const leadMoyen = leads.length ? Math.round(leads.reduce((s, v) => s + v, 0) / leads.length) : null

  // Avancement BDT
  const bdts = filterRows(d.bdts || [], f, { clientField: 'client_nom' }) as any[]
  const bdtSoldes = bdts.filter(b => /sold/.test(lc(b.statut))).length
  const avancement = pctOf(bdtSoldes, bdts.length)
  const bdtOpen = bdts.filter(b => isOpen(b.statut))

  // Charge atelier vs capacité
  const ops = (d.salaries || []).filter((s: any) => s.est_operateur === true && s.actif !== false)
  const absToday = new Set((d.absences || []).filter((a: any) => String(a.date_absence || '').slice(0, 10) === todayISO()).map((a: any) => a.operateur_id))
  const chargeH = sumBy(bdtOpen, b => b.duree)
  const capaH = Math.max(1, (ops.length - absToday.size) * 7)
  const chargePct = pctOf(chargeH, capaH)

  // WIP : lots en cours
  const wip = (d.lots || []).filter((l: any) => isOpen(l.statut)).length

  // Taux de reprise
  const reprises = bdts.filter(b => /reprise|retouche/.test(lc(b.statut))).length
  const tauxReprise = pctOf(reprises, bdts.length || 1)

  // Charge par opération
  const chargeByOp = groupSum(bdtOpen, b => b.operation, b => b.duree)

  // Écart temps alloué vs réel (productivité) sur les BDT soldés
  const bdtDone = bdts.filter(b => /sold/.test(lc(b.statut)))
  const tempsAlloue = sumBy(bdtDone, b => num(b.temps_alloue) || num(b.duree))
  const tempsReel = sumBy(bdtDone, b => num(b.temps_reel))
  const ecartTempsPct = tempsAlloue > 0 && tempsReel > 0 ? Math.round((tempsReel - tempsAlloue) / tempsAlloue * 100) : null
  // Distribution du lead time (jours)
  const leadDist = [0, 0, 0, 0] // <7 / 7-14 / 14-30 / 30+
  for (const l of leads) { if (l < 7) leadDist[0]++; else if (l < 14) leadDist[1]++; else if (l < 30) leadDist[2]++; else leadDist[3]++ }

  // Takt time par site
  const moisCur = P.ym; const heuresDispo = heuresDispoMois(); const siteOf = cmdSiteMap(d)
  const takt = (site: string) => {
    const ls = (d.lots || []).filter((l: any) => siteOf.get(String(l.cmd_id)) === site && String(l.date_fin || l.date_debut || '').slice(0, 7) === moisCur)
    const demande = sumBy(ls, l => (l as any).qte)
    return demande > 0 ? Math.round(heuresDispo * 60 / demande * 10) / 10 : null
  }

  return {
    otd: otd.pct, otdTot: otd.tot, otk, leadMoyen, avancement, bdtSoldes, bdtTotal: bdts.length,
    chargePct, chargeH: Math.round(chargeH), capaH, opsDispo: ops.length - absToday.size, opsTotal: ops.length,
    wip, reprises, tauxReprise, chargeByOp, taktSeem: takt('seem'), taktSemrac: takt('semrac'),
    tempsAlloue: Math.round(tempsAlloue), tempsReel: Math.round(tempsReel), ecartTempsPct, leadDist,
    monthLabels: P.months.map(m => m.label),
  }
}

// ══════════════════════════════════════════════════════════════
// QUALITÉ  (NC, PPM, Cp/Cpk agrégés, CONQ)
// ══════════════════════════════════════════════════════════════
export function qualite(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const ncs = filterRows(d.ncs || [], f, { siteField: 'entite', clientField: 'client_nom' }) as any[]
  const ncOpen = ncs.filter(n => isOpen(n.statut))
  const ncCrit = ncOpen.filter(n => /critique|bloquante/.test(lc(n.gravite))).length
  const lotsTot = (d.lots || []).length
  const tauxNC = lotsTot > 0 ? round1(ncs.length / lotsTot * 100) : 0
  const serieNC = monthlySeries(ncs, 'date_nc', null, mk)
  const serieNCprev = monthlySeries(ncs, 'date_nc', null, prevYearKeys(mk))
  const ncByType = topN(groupSum(ncs, n => n.type_nc || '—', () => 1), 6)
  const ncByGravite = topN(groupSum(ncs, n => n.gravite || '—', () => 1), 5)
  const ncByEntite = topN(groupSum(ncs, n => n.entite || '—', () => 1), 3)
  const ncAging = { b0_30: 0, b30_60: 0, b60_90: 0, b90: 0 }
  for (const n of ncOpen) { const j = daysSince(n.date_nc); if (j == null) continue; if (j <= 30) ncAging.b0_30++; else if (j <= 60) ncAging.b30_60++; else if (j <= 90) ncAging.b60_90++; else ncAging.b90++ }

  const pvs = (d.pvs || []) as any[]
  const liberationPV = pctOf(pvs.filter(p => lc(p.decision) !== 'bloque' && lc(p.statut) !== 'refuse').length, pvs.length)

  // SPC agrégé depuis controles_cotes : écart réduit, σ, Cp, Cpk, PPM (centralise qualite.tsx)
  const cc = (d.controlesCotes || []) as any[]
  const ecarts: number[] = []
  for (const r of cc) {
    const mesure = r.valeur_mesuree ?? r.mesure ?? r.valeur
    const nominale = r.nominale ?? r.cote_nominale ?? r.valeur_nominale
    const tmin = r.tolerance_inf ?? r.tol_min ?? r.tolerance_min
    const tmax = r.tolerance_sup ?? r.tol_max ?? r.tolerance_max
    let er = r.ecart_reduit
    if (er == null && mesure != null && nominale != null && tmin != null && tmax != null) {
      const demiTol = (num(tmax) - num(tmin)) / 2
      if (demiTol > 0) er = (num(mesure) - num(nominale)) / demiTol  // ±1 = limite de tolérance
    }
    if (er != null && isFinite(num(er))) ecarts.push(num(er))
  }
  let cpMoyen: number | null = null, cpkMoyen: number | null = null, ppm: number | null = null, conformePct: number | null = null
  if (ecarts.length >= 2) {
    const mean = ecarts.reduce((s, v) => s + v, 0) / ecarts.length
    const sigma = Math.sqrt(ecarts.reduce((s, v) => s + (v - mean) ** 2, 0) / (ecarts.length - 1)) || 1e-9
    // En unités d'écart réduit : limites = ±1 (tolérance), donc Cp = 1/(3σ), Cpk = (1-|mean|)/(3σ)
    cpMoyen = round2(1 / (3 * sigma))
    cpkMoyen = round2((1 - Math.abs(mean)) / (3 * sigma))
    const conf = ecarts.filter(v => Math.abs(v) <= 1).length
    conformePct = Math.round(conf / ecarts.length * 100)
    ppm = Math.round((1 - conf / ecarts.length) * 1_000_000)
  }

  // Coût de non-qualité (approx) : quarantaines en cours × durée + NC ouvertes
  const quar = (d.quarantaines || []) as any[]
  const quarOpen = quar.filter(q => isOpen(q.statut))
  const dureesQuar = quar.map(q => num(q.duree_jours) || daysBetween(q.date_mise_quarantaine, q.libere_le || todayISO())).filter((x): x is number => x != null && x > 0)
  const dureeMoyQuar = dureesQuar.length ? Math.round(dureesQuar.reduce((s, v) => s + v, 0) / dureesQuar.length) : null

  const r8d = (d.rapports8d || []) as any[]
  const r8dOpen = r8d.filter(r => isOpen(r.statut)).length

  return {
    ncOpen, ncCrit, ncTotal: ncs.length, tauxNC, serieNC, serieNCprev,
    ncByType, ncByGravite, ncByEntite, ncAging,
    liberationPV, pvTotal: pvs.length,
    cpMoyen, cpkMoyen, ppm, conformePct, nControles: cc.length,
    quarOpen: quarOpen.length, dureeMoyQuar, r8dOpen,
    monthLabels: P.months.map(m => m.label),
  }
}

// ══════════════════════════════════════════════════════════════
// STOCK / INVENTAIRE  (valorisation CMUP, rotation, couverture)
// ══════════════════════════════════════════════════════════════
export function stock(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  // Le stock est un niveau instantané → filtré par SITE (activite) mais pas par période.
  const st = filterRows((d.stock || []) as any[], f, { siteField: 'activite' }) as any[]
  const actifs = st.filter(a => a.actif !== false)
  const valorisation = sumBy(actifs, a => num(a.stock_actuel) * num(a.prix_achat_ht))
  const ruptures = actifs.filter(a => num(a.stock_actuel) <= 0)
  const sousMini = actifs.filter(a => num(a.stock_actuel) > 0 && num(a.stock_actuel) < (num(a.point_commande) || num(a.stock_mini)))

  // Couverture moyenne (mois) = stock / conso mensuelle
  const couvertures = actifs.map(a => num(a.consommation_mensuelle) > 0 ? num(a.stock_actuel) / num(a.consommation_mensuelle) : null).filter((x): x is number => x != null)
  const couvertureMoy = couvertures.length ? round1(couvertures.reduce((s, v) => s + v, 0) / couvertures.length) : null

  // Mouvements : flux entrées/sorties. PAS de dateField (sinon l'overlay N-1 perd ses lignes) —
  // chaque série est bornée par monthlySeries (mk pour l'année en cours, prevYearKeys pour N-1).
  const mvts = filterRows((d.mouvementsStock || []) as any[], f, { siteField: 'activite' }) as any[]
  const entrees = mvts.filter(m => lc(m.type) === 'entree' || lc(m.type) === 'entrée')
  const sorties = mvts.filter(m => lc(m.type) === 'sortie')
  const sortieSerie = monthlySeries(sorties, 'date_mvt', 'quantite', mk)
  const entreeSerie = monthlySeries(entrees, 'date_mvt', 'quantite', mk)
  const sortieSeriePrev = monthlySeries(sorties, 'date_mvt', 'quantite', prevYearKeys(mk))
  const entreeSeriePrev = monthlySeries(entrees, 'date_mvt', 'quantite', prevYearKeys(mk))
  // Rotation ≈ conso annuelle (estimée 12× conso mensuelle) / stock moyen, valorisée.
  const consoAnnuelle = sumBy(actifs, a => num(a.consommation_mensuelle) * 12 * num(a.prix_achat_ht))
  const rotation = valorisation > 0 ? round1(consoAnnuelle / valorisation) : null

  // Dead stock : aucun mouvement (derniere_entree) depuis 6 mois
  const seuilDead = new Date(Date.now() - 182 * 864e5).toISOString().slice(0, 10)
  const deadStock = actifs.filter(a => a.derniere_entree && String(a.derniere_entree).slice(0, 10) < seuilDead && num(a.stock_actuel) > 0)
  const valeurDead = sumBy(deadStock, a => num(a.stock_actuel) * num(a.prix_achat_ht))

  // Pareto / top valeur
  const parVal = actifs.map(a => ({ ref: a.designation || a.reference || '—', valeur: num(a.stock_actuel) * num(a.prix_achat_ht), cat: a.categorie }))
    .filter(x => x.valeur > 0).sort((a, b) => b.valeur - a.valeur)
  const topVal = parVal.slice(0, 8)
  const parCategorie = topN(groupSum(actifs, a => a.categorie || 'Autres', a => num(a.stock_actuel) * num(a.prix_achat_ht)), 6)
  const parActivite = topN(groupSum(actifs, a => a.activite || 'Commun', a => num(a.stock_actuel) * num(a.prix_achat_ht)), 6)

  // Classement ABC (80/95/100) : cumul décroissant de valeur.
  const totVal = parVal.reduce((s, x) => s + x.valeur, 0)
  let cumV = 0; const paretoAbc = parVal.map(x => { cumV += x.valeur; return { ref: x.ref, valeur: x.valeur, cumPct: totVal > 0 ? Math.round(cumV / totVal * 100) : 0 } })
  const classA = paretoAbc.filter(x => x.cumPct <= 80); const classB = paretoAbc.filter(x => x.cumPct > 80 && x.cumPct <= 95); const classC = paretoAbc.filter(x => x.cumPct > 95)
  const abc = { A: classA.length, B: classB.length, C: classC.length, valA: sumBy(classA, x => x.valeur), valB: sumBy(classB, x => x.valeur), valC: sumBy(classC, x => x.valeur) }

  // Suggestions de réappro : stock ≤ point de commande (ou auto_reappro) → qté = qte_commande sinon (stock_maxi − stock_actuel).
  const reappro = actifs
    .filter(a => num(a.stock_actuel) <= (num(a.point_commande) || num(a.stock_mini)) || a.auto_reappro === true)
    .map(a => ({ ref: a.designation || a.reference || '—', stock: num(a.stock_actuel), point: num(a.point_commande) || num(a.stock_mini), qte: num(a.qte_commande) || Math.max(0, num(a.stock_maxi) - num(a.stock_actuel)), auto: a.auto_reappro === true, unite: a.unite || '' }))
    .filter(x => x.qte > 0).sort((a, b) => (a.stock - a.point) - (b.stock - b.point)).slice(0, 10)

  return {
    valorisation, nbArticles: actifs.length, ruptures, sousMini, couvertureMoy,
    rotation, sortieSerie, entreeSerie, sortieSeriePrev, entreeSeriePrev, deadStock, valeurDead, topVal, parCategorie, parActivite,
    paretoAbc: paretoAbc.slice(0, 15), abc, reappro,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : String(curYear()),
  }
}

// ══════════════════════════════════════════════════════════════
// MAINTENANCE  (dispo, MTBF, MTTR, préventif, OEE)
// ══════════════════════════════════════════════════════════════
export function maintenance(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  const nameById = new Map<string, string>(((d.machines || []) as any[]).map((m: any) => [String(m.id), m.nom]))
  const passeMachine = (nom: any) => !f || !f.machine || lc(nom) === lc(f.machine)

  // Seul le parc `machines` porte un vrai champ site (activite) ; oms/mtbf/opex n'en ont pas (no-op tolérant).
  const machines = (filterRows(d.machines || [], f, { siteField: 'activite' }) as any[]).filter(m => passeMachine(m.nom))
  const dispoParc = pctOf(machines.filter(m => lc(m.statut) === 'operationnel').length, machines.length)
  const pannes = machines.filter(m => lc(m.statut) !== 'operationnel' && lc(m.statut) !== '')

  const mtbf = ((d.mtbf || []) as any[]).filter(m => passeMachine(m.machine_nom))
  const dispoVals = mtbf.map(m => num(m.disponibilite_pct)).filter(v => v > 0)
  const disponibilite = dispoVals.length ? Math.round(dispoVals.reduce((s, v) => s + v, 0) / dispoVals.length) : dispoParc
  const mtbfVals = mtbf.map(m => num(m.mtbf_h)).filter(v => v > 0)
  const mtbfMoyen = mtbfVals.length ? Math.round(mtbfVals.reduce((s, v) => s + v, 0) / mtbfVals.length) : null
  const mttrVals = mtbf.map(m => num(m.mttr_h)).filter(v => v > 0)
  const mttrMoyen = mttrVals.length ? round1(mttrVals.reduce((s, v) => s + v, 0) / mttrVals.length) : null

  const oms = ((d.oms || []) as any[]).filter(o => passeMachine(o.machine_nom))
  const omOpen = oms.filter(o => isOpen(o.statut))
  const prev = oms.filter(o => /prevent/.test(lc(o.type))).length
  const corr = oms.filter(o => /correct/.test(lc(o.type))).length
  const ratioPreventif = (prev + corr) > 0 ? Math.round(prev / (prev + corr) * 100) : 0
  const coutMaint = sumBy(oms.filter(o => inP(o, 'date_fin')), o => o.cout_reel)
  const serieCoutMaint = monthlySeries(oms, 'date_fin', 'cout_reel', mk)
  const serieCoutMaintPrev = monthlySeries(oms, 'date_fin', 'cout_reel', prevYearKeys(mk))
  // Backlog des OM ouverts par âge (date_signalement → aujourd'hui) : consomme date_signalement (jusqu'ici jeté).
  const backlogItems = omOpen.map((o: any) => ({ id: o.num_om || o.id, titre: o.titre || o.machine_nom || 'OM', machine: o.machine_nom || '', priorite: o.priorite || 'normal', age: daysSince(o.date_signalement) })).filter((x: any) => x.age != null) as any[]
  const backlog = { b0_7: 0, b8_30: 0, b31_90: 0, b90: 0 }
  for (const o of backlogItems) { const a = o.age as number; if (a <= 7) backlog.b0_7++; else if (a <= 30) backlog.b8_30++; else if (a <= 90) backlog.b31_90++; else backlog.b90++ }
  const backlogTop = backlogItems.sort((a, b) => (b.age as number) - (a.age as number)).slice(0, 8)
  // MTTR depuis OM clôturés (fallback si pas de table mtbf)
  const omDone = oms.filter(o => o.date_debut && o.date_fin)
  const mttrCalc = omDone.length ? Math.round(omDone.reduce((s, o) => { const dd = daysBetween(o.date_debut, o.date_fin); return s + (dd != null && dd >= 0 ? dd * 24 : 0) }, 0) / omDone.length) : null

  const prevPlan = (d.preventifs || []).filter((p: any) => p.actif)
  // OPEX machine (machines_opex) : machine_nom absent du select → jointure par machine_id sur le parc.
  const mopex = ((d.machinesOpex || []) as any[]).filter(m => passeMachine(nameById.get(String(m.machine_id)) || m.machine_nom))
  const heuresProd = sumBy(mopex, m => num(m.heures_productives))
  const coutOpexTotal = sumBy(mopex, m => num(m.cout_total_ht) || num(m.achats_ht))
  const coutHoraireReel = heuresProd > 0 ? Math.round(coutOpexTotal / heuresProd) : null
  const opexParMachine = topN(groupSum(mopex, m => nameById.get(String(m.machine_id)) || m.machine_nom || m.machine_id || '—', m => num(m.cout_total_ht) || num(m.achats_ht)), 6)
  // MTBF/MTTR par machine (classement, le plus critique en tête)
  const mtbfParMachine = (mtbf as any[]).map(m => ({ nom: m.machine_nom || nameById.get(String(m.machine_id)) || m.machine_id || '—', mtbf: num(m.mtbf_h), mttr: num(m.mttr_h), dispo: num(m.disponibilite_pct), pannes: num(m.nb_pannes) })).sort((a, b) => b.mttr - a.mttr).slice(0, 6)
  // OEE : disponibilité × performance (heures prod / capacité estimée) × qualité (défaut 0.98)
  const oee = disponibilite ? Math.round(disponibilite * 0.92 * 0.98) : null
  return {
    dispoParc, disponibilite, oee, pannes: pannes.length, mtbfMoyen, mttrMoyen: mttrMoyen ?? mttrCalc,
    omOpen: omOpen.length, omTotal: oms.length, ratioPreventif, prev, corr, coutMaint,
    prevPlan: prevPlan.length, machinesTotal: machines.length,
    heuresProd: Math.round(heuresProd), coutOpexTotal: Math.round(coutOpexTotal), coutHoraireReel, opexParMachine, mtbfParMachine,
    backlog, backlogTop, serieCoutMaint, serieCoutMaintPrev,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : String(curYear()),
  }
}

// ══════════════════════════════════════════════════════════════
// RH  (effectif, absentéisme, heures, habilitations)
// ══════════════════════════════════════════════════════════════
export function rh(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  // Seul `salaries` porte le site (entite) ; absences/pointages/certifs n'ont pas d'entite (filtre tolérant).
  const sal = filterRows(d.salaries || [], f, { siteField: 'entite' }) as any[]
  const actifs = sal.filter(s => s.actif !== false)
  const ops = actifs.filter(s => s.est_operateur === true)
  const parEntite = groupSum(actifs, s => s.entite || '—', () => 1)
  // Vraie colonne = `contrat` (type_contrat n'existe pas → parContrat regroupait tout sous '—').
  const parContrat = groupSum(actifs, s => s.contrat || '—', () => 1)

  const abs = filterRows(d.absences || [], f, { siteField: 'entite' }) as any[]
  const absToday = abs.filter(a => String(a.date_absence || '').slice(0, 10) === todayISO())
  // Absentéisme sur la période : jours d'absence / (effectif × jours ouvrés)
  const moisAbs = abs.filter(a => inP(a, 'date_absence')).length
  const joursOuvres = heuresDispoMois() / 7
  const absenteisme = (actifs.length > 0 && joursOuvres > 0) ? round1(moisAbs / (actifs.length * joursOuvres) * 100) : 0
  const serieAbs = monthlySeries(abs, 'date_absence', null, mk)
  const serieAbsPrev = monthlySeries(abs, 'date_absence', null, prevYearKeys(mk))
  const absParMotif = topN(groupSum(abs, a => a.type || 'Autre', () => 1), 6)

  // Heures depuis pointages (période) — heures sup réelles = heures_supp_s / 3600 (le type='presence', pas 'sup').
  const pts = filterRows(d.pointages || [], f, { siteField: 'entite' }) as any[]
  const ptsP = pts.filter(p => inP(p, 'date_pointage'))
  const heuresMois = sumBy(ptsP, p => p.heures_travaillees)
  const heuresSup = sumBy(ptsP, p => num(p.heures_supp_s) / 3600)

  const certs = filterRows(d.certifications || [], f, { siteField: 'entite' }) as any[]
  const certExp = certs.filter(c => /expire|renouveler/.test(lc(c.statut)))
  const certBientot = certs.filter(c => c.date_expiration && (daysSince(c.date_expiration) ?? -999) > -30 && (daysSince(c.date_expiration) ?? -999) <= 0)
  // Ancienneté des habilitations : jours restants avant expiration (négatif = déjà expiré).
  const habilAging = { expire: 0, j30: 0, j60: 0, j90: 0 }
  for (const c of certs) {
    if (!c.date_expiration) continue
    const rem = -(daysSince(c.date_expiration) ?? 0)
    if (rem < 0) habilAging.expire++
    else if (rem <= 30) habilAging.j30++
    else if (rem <= 60) habilAging.j60++
    else if (rem <= 90) habilAging.j90++
  }
  const conges = (d.conges || []) as any[]
  const congesPending = conges.filter(c => /demande|attente/.test(lc(c.statut)))

  return {
    effectif: actifs.length, ops: ops.length, parEntite, parContrat,
    absToday: absToday.length, absenteisme, heuresMois: Math.round(heuresMois), heuresSup: Math.round(heuresSup),
    certExp: certExp.length, certBientot: certBientot.length, certs, congesPending: congesPending.length,
    serieAbs, serieAbsPrev, absParMotif, habilAging,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// ACHATS / FOURNISSEURS
// ══════════════════════════════════════════════════════════════
export function achats(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  const passeFourn = (v: any) => !f || !f.fournisseur || lc(v) === lc(f.fournisseur)

  // Instantanés (backlog/retards) : PAS de dateField (sinon un simple filtre Site/N-1 les écrase au mois courant).
  // Le bornage période se fait sur les flux via inP()/mk, à l'image de commercial()/finance().
  const das = (filterRows(d.das || [], f, { clientField: 'fournisseur' }) as any[]).filter(x => passeFourn(x.fournisseur))
  const daOpen = das.filter(x => isOpen(x.statut))
  const daCrit = daOpen.filter(x => lc(x.priorite) === 'critique').length
  const daParCat = topN(groupSum(das, x => x.categorie || x.type_da || 'Autres', () => 1), 6)

  const bcs = (filterRows(d.bcs || [], f, { clientField: 'fournisseur_nom' }) as any[]).filter(x => passeFourn(x.fournisseur_nom))
  const bcOpen = bcs.filter(b => isOpen(b.statut))
  // Vraie colonne = date_livraison (date_livraison_prevue n'existe pas → KPI Retards était toujours 0).
  const bcRetard = bcs.filter(b => b.date_livraison && String(b.date_livraison).slice(0, 10) < todayISO() && !['recu', 'cloture'].includes(lc(b.statut)))
  const agingBC = agingBuckets(bcRetard, 'date_livraison', 'montant_ht')

  // Flux : ff garde toutes les années (pour l'overlay N-1) ; ffP = sous-ensemble période pour les agrégats.
  const ff = (filterRows(d.facturesFournisseur || [], f, { clientField: 'fournisseur_nom' }) as any[]).filter(x => passeFourn(x.fournisseur_nom))
  const ffP = ff.filter(x => inP(x, 'date_facture'))
  const achatsMois = sumBy(ff.filter(x => String(x.date_facture || '').slice(0, 7) === P.ym), x => x.montant_ht)
  const achatsYTD = sumBy(ffP, x => x.montant_ht)
  const serieAchats = monthlySeries(ff, 'date_facture', 'montant_ht', mk)
  const serieAchatsPrev = monthlySeries(ff, 'date_facture', 'montant_ht', prevYearKeys(mk))

  // Pareto dépense (sur la période) : factures fournisseur si alimentées, sinon repli sur les BC engagés (montant_ht).
  const baseDep = ffP.length ? ffP : bcs
  const depByFourn = groupSum(baseDep, x => x.fournisseur_nom || '—', x => x.montant_ht)
  const topFourn = topN(depByFourn, 8)
  const totalDep = Object.values(depByFourn).reduce((s, v) => s + v, 0)
  let cum = 0; const paretoFourn = topFourn.map(([nom, v]) => { cum += v; return { nom, montant: v, cumPct: totalDep > 0 ? Math.round(cum / totalDep * 100) : 0 } })
  const depOnBc = !ffP.length && bcs.length > 0
  const chargesParCat = topN(groupSum(ffP, x => x.compte_charge || x.type || 'Autres', x => x.montant_ht), 6)

  return {
    daOpen, daCrit, daParCat, bcOpen: bcOpen.length, bcTotal: bcs.length, bcRetard, agingBC,
    achatsMois, achatsYTD, serieAchats, serieAchatsPrev, topFourn, paretoFourn, depOnBc, chargesParCat,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// Scorecard fournisseurs/ST : OTD (BL≤date_livraison), fill rate, dépense, NC liées.
export function fournisseurs(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  // OTD/fill rate = scorecard (instantané, tous BC/BL, pas de fenêtre de date) ; dépense = flux (ffP période).
  const bcs = filterRows(d.bcs || [], f, {}) as any[]
  const bls = filterRows(d.bls || [], f, {}) as any[]
  const ff = filterRows(d.facturesFournisseur || [], f, { clientField: 'fournisseur_nom' }) as any[]
  const ffP = ff.filter(x => inP(x, 'date_facture'))
  // map bc_id → date BL réelle (réception) la plus tardive
  const recByBc = new Map<string, string>()
  for (const l of bls) { const cid = String((l as any).bc_id || ''); const dt = String((l as any).date_bl || '').slice(0, 10); if (cid && dt && (!recByBc.has(cid) || dt > (recByBc.get(cid) as string))) recByBc.set(cid, dt) }

  const fournRows = [...((d.fournisseurs || []) as any[]).map(x => ({ ...x, _type: 'fournisseur' })), ...((d.fournisseursSt || []) as any[]).map(x => ({ ...x, _type: 'st' }))]
  const depByName = groupSum(ffP, x => x.fournisseur_nom || '—', x => x.montant_ht)
  // NC par fournisseur (non_conformites.fournisseur_nom)
  const ncByFourn = groupSum(((d.ncs || []) as any[]).filter(n => n.fournisseur_nom), n => n.fournisseur_nom, () => 1)

  const scores = fournRows.map((x: any) => {
    const bcF = bcs.filter(b => String(b.fournisseur_id) === String(x.id) || String(b.sous_traitant_id) === String(x.id) || String(b.fournisseur_st_id) === String(x.id) || lc(b.fournisseur_nom) === lc(x.nom))
    let tot = 0, ot = 0
    for (const b of bcF) {
      const promesse = String(b.date_livraison_initiale || b.date_livraison || '').slice(0, 10)   // OTD figé sur la 1ʳᵉ date prévue
      if (!promesse) continue
      const rec = (b as any).date_reception_reelle ? String((b as any).date_reception_reelle).slice(0, 10) : recByBc.get(String(b.id))
      if (!rec) continue
      tot++; if (rec <= promesse) ot++
    }
    const otd = tot ? Math.round(ot / tot * 100) : (x.otd != null ? num(x.otd) : null)
    // Table fournisseurs : colonne `actif` (bool) ; fournisseurs_st : colonne `statut`.
    const actif = x._type === 'st' ? lc(x.statut) === 'actif' : (x.actif !== false)
    return { nom: x.nom, type: x._type, statut: x.statut || (actif ? 'actif' : 'inactif'), actif, otd, nbBC: bcF.length, depense: depByName[x.nom] || 0, otdN: tot, nc: ncByFourn[x.nom] || 0 }
  }).sort((a, b) => b.depense - a.depense)

  const depenseTotale = Object.values(depByName).reduce((s, v) => s + v, 0)
  const concentration = depenseTotale > 0 && scores.length ? Math.round((scores[0]?.depense || 0) / depenseTotale * 100) : 0
  const otdGlobalVals = scores.map(s => s.otd).filter((x): x is number => x != null)
  const otdGlobal = otdGlobalVals.length ? Math.round(otdGlobalVals.reduce((s, v) => s + v, 0) / otdGlobalVals.length) : 0
  // Fill rate : qté reçue / qté commandée — vraies colonnes des BC (qte_recue/qte_commandee ; `quantite` n'existe pas).
  const qteCmd = sumBy(bcs, b => num(b.qte_commandee))
  const qteRecue = sumBy(bcs, b => num(b.qte_recue))
  const fillRate = qteCmd > 0 ? Math.min(100, Math.round(qteRecue / qteCmd * 100)) : 0
  // Série mensuelle de dépense (support de l'overlay N-1)
  const serieDep = monthlySeries(ff, 'date_facture', 'montant_ht', mk)
  const serieDepPrev = monthlySeries(ff, 'date_facture', 'montant_ht', prevYearKeys(mk))
  const ncTotal = scores.reduce((s, x) => s + x.nc, 0)
  return {
    scores, depenseTotale, concentration, otdGlobal, fillRate, nbFournisseurs: fournRows.length,
    nbActifs: scores.filter(s => s.actif).length, ncTotal, serieDep, serieDepPrev,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// OAS  (oxydation anodique : sessions, bains, conformité)
// ══════════════════════════════════════════════════════════════
export function oas(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  // Process mono-site : pas de champ site/client → filterRows no-op tolérant ; jamais de dateField (garde N-1 + instantané bains).
  const balancelles = filterRows(d.balancelles || [], f, {}) as any[]
  const relevesBains = filterRows(d.relevesBains || [], f, {}) as any[]
  const relevesEau = filterRows(d.relevesEau || [], f, {}) as any[]
  const sessP = balancelles.filter(b => inP(b, 'date_entree'))
  const balSeries = monthlySeries(balancelles, 'date_entree', null, mk)
  const balSeriesPrev = monthlySeries(balancelles, 'date_entree', null, prevYearKeys(mk))
  // Conformité des sessions (balancelles.resultat / statut) — la conformité BAIN est portée par relevesBains.conforme.
  const sessTermine = sessP.filter(b => /termin/.test(lc(b.statut)))
  const sessNC = sessTermine.filter(b => /non.?conforme|^nc$/.test(lc(b.resultat)))
  const tauxSession = sessTermine.length ? Math.round((sessTermine.length - sessNC.length) / sessTermine.length * 100) : null
  const durees = sessP.map(b => num(b.duree_min)).filter(v => v > 0)
  const dureeMoy = durees.length ? Math.round(durees.reduce((s, v) => s + v, 0) / durees.length) : null
  // Bains : instantané (dernier relevé par bain, non borné par période)
  const bainsConf = pctOf(relevesBains.filter(r => r.conforme === true).length, relevesBains.length)
  const bainsAlerte = relevesBains.filter(r => r.conforme === false).length
  const latestByBain: Record<string, any> = {}
  for (const r of relevesBains) { const k = r.bain_nom || '—'; if (!latestByBain[k] || String(r.date_releve) > String(latestByBain[k].date_releve)) latestByBain[k] = r }
  const bains = Object.values(latestByBain)
  const phSerie = relevesBains.filter(r => /principal/i.test(String(r.bain_nom || ''))).sort((a, b) => String(a.date_releve).localeCompare(String(b.date_releve))).slice(-12).map(r => num(r.ph))
  return {
    balancelles, relevesBains, relevesEau, bains, sessionsPeriode: sessP.length, sessionsTotal: balancelles.length,
    balSeries, balSeriesPrev, bainsConf, bainsAlerte, tauxSession, sessTermine: sessTermine.length, dureeMoy, phSerie,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// EXPÉDITION  (BL clients, OTD réconcilié, transporteur, volume)
// ══════════════════════════════════════════════════════════════
export function expedition(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  const prod = production(d, f) // OTD réconcilié (BL réel ≤ date_liv promise) — remplace bls.otd (toujours null)
  const cmds = filterRows(d.commandes || [], f, { siteField: 'activite', clientField: 'client_nom' }) as any[]
  const blAll = filterRows(d.bls || [], f, { clientField: 'client_nom' }) as any[] // bls sans champ site → filtre Site inerte (toléré)
  const blClients = blAll.filter(b => !b.type_bl || lc(b.type_bl) === 'client') // client OU NULL (legacy), exclut 'bst'/'reception' — cf getBLClients/expeditions.tsx
  const ncs = (d.ncs || []) as any[]
  const qBloque = (c: any) => ncs.some(n => isOpen(n.statut) && /critique|bloquante/.test(lc(n.gravite)) && String(n.lot_ref || '').indexOf(String(c.num_affaire || c.id)) !== -1)
  const cmdProdOk = cmds.filter(c => isOpen(c.statut) && num(c.bdt_total) > 0 && num(c.bdt_soldes) >= num(c.bdt_total))
  const cmdAExp = cmdProdOk.filter(c => !qBloque(c))
  const cmdBloqueeQ = cmdProdOk.filter(c => qBloque(c))
  const cmdRetard = cmds.filter(c => c.retard === true && isOpen(c.statut))
  const blPeriode = blClients.filter(b => inP(b, 'date_bl'))
  const blSeries = monthlySeries(blClients, 'date_bl', null, mk)
  const blSeriesPrev = monthlySeries(blClients, 'date_bl', null, prevYearKeys(mk))
  const volSeries = monthlySeries(blClients, 'date_bl', 'qte', mk)
  const parTransporteur = topN(groupSum(blClients.filter(b => b.transport), b => b.transport || 'Non précisé', () => 1), 6)
  return {
    otd: prod.otd, otdTot: prod.otdTot,
    cmdAExp, cmdBloqueeQ, cmdRetard, blClients, blPeriode: blPeriode.length,
    blSeries, blSeriesPrev, volSeries, parTransporteur,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// BE  (coûts de revient à partir des nomenclatures réelles)
// ══════════════════════════════════════════════════════════════
export function be(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key)
  // Catalogue/backlog : filtre site seul (nomenclatures.entite ; PAS `activite` qui n'existe pas) — jamais de dateField.
  const noms = filterRows(d.nomenclatures || [], f, { siteField: 'entite' }) as any[]
  const fournitures = (d.fournitures || []) as any[]
  const byNom = new Map<string, any[]>()
  for (const fo of fournitures) { const k = String(fo.nomenclature_id || ''); if (!byNom.has(k)) byNom.set(k, []); byNom.get(k)!.push(fo) }
  const lignes = noms.map((n: any) => {
    const c = computeNomCostForQty(n, byNom.get(String(n.id)) || [], 1)
    return { ref: n.code_ref_produit || n.num_nom || n.id, desc: n.description || '', perPiece: c.perPiece, matiere: c.matierePiece, mo: c.moPiece, machine: c.machinePiece, st: c.stOrder, activite: lc(n.entite || '') }
  }).filter(l => l.perPiece > 0)
  const crus = lignes.map(l => l.perPiece)
  const cruMoyen = crus.length ? round2(crus.reduce((s, v) => s + v, 0) / crus.length) : 0
  const topCher = [...lignes].sort((a, b) => b.perPiece - a.perPiece).slice(0, 6)
  // Structure de coût moyenne du CRU (matière/MO/machine/ST) — déjà calculée par pièce, jusqu'ici jetée.
  const sumL = (sel: (l: any) => number) => lignes.reduce((s, l) => s + sel(l), 0)
  const structureCout = lignes.length
    ? { matiere: round2(sumL(l => l.matiere) / lignes.length), mo: round2(sumL(l => l.mo) / lignes.length), machine: round2(sumL(l => l.machine) / lignes.length), st: round2(sumL(l => l.st) / lignes.length) }
    : { matiere: 0, mo: 0, machine: 0, st: 0 }
  // Complétude : gamme (etapes_production) + matière (fourniture) + statut validé.
  const complet = noms.filter((n: any) => Array.isArray(n.etapes_production) && n.etapes_production.length > 0 && byNom.has(String(n.id)) && lc(n.statut) === 'valide').length
  const tauxCompletude = pctOf(complet, noms.length)

  // marge par activité + corrélation CRU↔marge (depuis pieces_detail des DT filtrées)
  const dts = filterRows(d.dts || [], f, {}) as any[]
  const allPieces = dts.flatMap((x: any) => x.pieces_detail || [])
  const margesSeem = allPieces.filter((p: any) => lc(p.activite) === 'seem').map((p: any) => num(p.marge_pct)).filter((v: number) => v > 0)
  const margesSemrac = allPieces.filter((p: any) => lc(p.activite) === 'semrac').map((p: any) => num(p.marge_pct)).filter((v: number) => v > 0)
  const avg = (a: number[]) => a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : 0
  const margeMoy = avg(allPieces.map((p: any) => num(p.marge_pct)).filter((v: number) => v > 0))
  const cruMarge = allPieces.filter((p: any) => num(p.cru) > 0 && num(p.marge_pct) > 0).map((p: any) => ({ x: round2(num(p.cru)), y: Math.round(num(p.marge_pct)) }))

  const dtOpen = dts.filter(x => isOpen(x.statut))
  const dtAAnalyser = dtOpen.filter(x => /nouveau|analyse|attente|recu|reçu/.test(lc(x.statut)) || !x.analyste)
  const dtAnalysees = dts.filter(x => x.analyste).length
  const serieDt = monthlySeries(dts, 'date_dt', null, mk)
  const serieDtPrev = monthlySeries(dts, 'date_dt', null, prevYearKeys(mk))

  return {
    cruMoyen, topCher, nbChiffrees: crus.length, lignes, structureCout, tauxCompletude, complet, nbNoms: noms.length,
    margeMoy, margeSeem: avg(margesSeem), margeSemrac: avg(margesSemrac), cruMarge,
    dtAAnalyser, dtAnalysees, dtTotal: dts.length, tauxAnalyse: pctOf(dtAnalysees, dts.length), dtOpen,
    serieDt, serieDtPrev, monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : 'mois',
  }
}

// ══════════════════════════════════════════════════════════════
// ENVIRONNEMENT (ISO 14001 — déchets, rejets, conformité, AES, GES)
// Slices étendus : dechetsEnv, mesuresEnv, aspectsEnv, conformiteEnv, atexEnv.
// ══════════════════════════════════════════════════════════════
export function environnement(d: DashboardData, f?: DashFilter) {
  const P = period(f); const mk = P.months.map(m => m.key); const pk = prevYearKeys(mk)
  const inP = (r: any, df: string) => { const x = String(r?.[df] || '').slice(0, 10); return (!P.from || x >= P.from) && (!P.to || x <= P.to) }
  // Toutes les tables hse_* portent le site en `entite` (PAS `activite`). Jamais de dateField (leçon Vague 2).
  const dech = filterRows(d.dechetsEnv || [], f, { siteField: 'entite' }) as any[]
  const mes = filterRows(d.mesuresEnv || [], f, { siteField: 'entite' }) as any[]
  const asp = filterRows(d.aspectsEnv || [], f, { siteField: 'entite' }) as any[]
  const conf = filterRows(d.conformiteEnv || [], f, { siteField: 'entite' }) as any[]
  const atex = filterRows(d.atexEnv || [], f, { siteField: 'entite' }) as any[]
  const rse = filterRows(d.rseEnv || [], f, { siteField: 'entite' }) as any[]
  const T = todayISO()

  // ── Déchets : DD / DND (période via inP), séries mensuelles (+ N-1), filière ──
  const isDD = (x: any) => x.dangereux === true
  const dechP = dech.filter(x => inP(x, 'date_dechet'))
  const kgDD = sumBy(dechP.filter(isDD), x => x.quantite)
  const kgDND = sumBy(dechP.filter(x => !isDD(x)), x => x.quantite)
  const tDD = round2(kgDD / 1000), tDND = round2(kgDND / 1000)
  const nbDD = dechP.filter(isDD).length, nbDND = dechP.length - nbDD
  const serieDD = monthlySeries(dech.filter(isDD), 'date_dechet', 'quantite', mk)
  const serieDND = monthlySeries(dech.filter(x => !isDD(x)), 'date_dechet', 'quantite', mk)
  const serieDDprev = monthlySeries(dech.filter(isDD), 'date_dechet', 'quantite', pk)
  const serieDNDprev = monthlySeries(dech.filter(x => !isDD(x)), 'date_dechet', 'quantite', pk)
  const parFiliere = topN(groupSum(dechP, x => x.filiere || 'Non précisée', x => num(x.quantite)), 6)
  const ddRows = dechP.filter(isDD)
  const bsdOk = ddRows.filter(x => x.bsdd_num || x.trackdechets_id).length
  const bsdConforme = pctOf(bsdOk, ddRows.length)
  const kgTot = sumBy(dechP, x => x.quantite)
  const kgValo = sumBy(dechP.filter(x => /valoris|recycl|régén|regen|r\d|réempl|reempl/i.test(String(x.filiere || ''))), x => x.quantite)
  const tauxValo = pctOf(kgValo, kgTot)

  // ── Conformité réglementaire (instantané, site seul) ──
  const confApp = conf.filter(x => lc(x.statut) !== 'na')
  const confConforme = confApp.filter(x => lc(x.statut) === 'conforme').length
  const tauxConf = pctOf(confConforme, confApp.length)
  const confAlerteRows = conf.filter(x => lc(x.statut) === 'non_conforme' || lc(x.statut) === 'a_verifier' || (x.date_echeance && String(x.date_echeance).slice(0, 10) < T && lc(x.statut) !== 'conforme'))
  const confAlerte = confAlerteRows.length
  const CONF_STATUTS = ['conforme', 'non_conforme', 'partiel', 'a_verifier']
  const domaines = Array.from(new Set(conf.map(x => lc(x.domaine) || 'autre')))
  const confParDomaine = domaines.map(dom => ({
    domaine: dom,
    counts: CONF_STATUTS.map(st => conf.filter(x => (lc(x.domaine) || 'autre') === dom && lc(x.statut) === st).length),
  }))

  // ── Rejets / mesures / incidents (période via inP ; séries + N-1) ──
  const rejetsNCall = mes.filter(x => x.conforme === false)
  const incidentsSerie = monthlySeries(rejetsNCall, 'date_mesure', null, mk)
  const incidentsSeriePrev = monthlySeries(rejetsNCall, 'date_mesure', null, pk)
  const incidentsAn = rejetsNCall.filter(x => inP(x, 'date_mesure')).length
  const rejetsNC = incidentsAn
  const eau = mes.filter(x => lc(x.type) === 'conso_eau')
  const consoEauAn = round1(sumBy(eau.filter(x => inP(x, 'date_mesure')), x => x.valeur))
  const consoEauSerie = monthlySeries(eau, 'date_mesure', 'valeur', mk)
  const consoEauSeriePrev = monthlySeries(eau, 'date_mesure', 'valeur', pk)
  const energie = mes.filter(x => lc(x.type) === 'energie')
  const consoEnergieAn = round1(sumBy(energie.filter(x => inP(x, 'date_mesure')), x => x.valeur))
  const consoEnergieSerie = monthlySeries(energie, 'date_mesure', 'valeur', mk)
  const consoEnergieSeriePrev = monthlySeries(energie, 'date_mesure', 'valeur', pk)

  // ── Aspects & impacts (AES, instantané) ──
  const aesSignif = asp.filter(x => x.significatif === true).length
  const aspTotal = asp.length
  const aspParMilieu = topN(groupSum(asp, x => x.milieu || '—', () => 1), 8)
  const atexRevue = atex.filter(x => x.date_revue && String(x.date_revue).slice(0, 10) < T).length

  // ── Indicateurs RSE (slice chargé mais jamais rendu jusqu'ici) ──
  const RSE_CATS = ['social', 'environnement', 'gouvernance']
  const rseGroups = RSE_CATS.map(cat => ({ cat, items: rse.filter(x => lc(x.categorie) === cat).map(x => ({ libelle: x.libelle || x.code || '—', valeur: x.valeur, cible: x.cible, unite: x.unite || '' })) })).filter(g => g.items.length)

  return {
    nbDechets: dechP.length, nbDD, nbDND, tDD, tDND, kgDD, kgDND, serieDD, serieDND, serieDDprev, serieDNDprev, parFiliere,
    bsdConforme, bsdOk, ddTotal: ddRows.length, tauxValo,
    tauxConf, confConforme, confApp: confApp.length, confAlerte, confAlerteRows, confParDomaine, confStatuts: CONF_STATUTS,
    rejetsNC, incidentsSerie, incidentsSeriePrev, incidentsAn,
    consoEauAn, consoEauSerie, consoEauSeriePrev, consoEnergieAn, consoEnergieSerie, consoEnergieSeriePrev,
    aesSignif, aspTotal, aspParMilieu, atexRevue, rseGroups,
    monthLabels: P.months.map(m => m.label), periodLabel: (f && f.active) ? 'période' : String(curYear()),
  }
}

// ══════════════════════════════════════════════════════════════
// PRÉVISIONNEL — carnet de commandes projeté dans le temps
// ══════════════════════════════════════════════════════════════
// CA programmé à venir : commandes ouvertes projetées par date de livraison (mois à venir).
export function caPrevisionnel(d: DashboardData, nMonths = 6) {
  const cmds = ((d.commandes || []) as any[]).filter((c) => isOpen(c.statut))
  const f = forwardMonthly(cmds, 'date_liv', 'montant', nMonths)
  const seem = forwardMonthly(cmds.filter((c) => lc(c.activite) === 'seem'), 'date_liv', 'montant', nMonths).buckets
  const semrac = forwardMonthly(cmds.filter((c) => lc(c.activite) === 'semrac'), 'date_liv', 'montant', nMonths).buckets
  const totalHorizon = f.buckets.reduce((s, v) => s + v, 0)
  return { labels: f.labels, montant: f.buckets, seem, semrac, retard: f.retard, auDela: f.auDela, totalHorizon, totalCarnet: totalHorizon + f.retard + f.auDela, nbCmd: cmds.length }
}

// Charge atelier prévisionnelle : heures des BDT ouverts par semaine à venir vs capacité opérateurs.
export function chargePrevisionnelle(d: DashboardData, nWeeks = 8, f?: DashFilter) {
  const site = f && f.active && f.site ? lc(f.site) : ''
  const bdtOpen = (filterRows(d.bdts || [], f, { clientField: 'client_nom' }) as any[]).filter((b) => isOpen(b.statut)) // siteField défaut 'activite'
  const fw = forwardWeekly(bdtOpen, ['date_prevue', 'debut'], 'duree', nWeeks) // vraie colonne = 'debut' (date_debut n'existe pas)
  const ops = (d.salaries || []).filter((s: any) => s.est_operateur === true && s.actif !== false && (!site || lc(s.entite) === site)).length
  const capaSemaine = Math.max(0, ops * 35) // 5 j × 7 h par opérateur
  const capacite = Array(nWeeks).fill(capaSemaine)
  const charge = fw.buckets.map((v) => Math.round(v * 10) / 10)
  const tauxOccup = charge.map((v) => capaSemaine > 0 ? Math.round(v / capaSemaine * 100) : 0)
  const surchargeWeeks = charge.filter((v) => capaSemaine > 0 && v > capaSemaine).length
  return { labels: fw.labels, charge, capacite, tauxOccup, retard: Math.round(fw.retard * 10) / 10, auDela: Math.round(fw.auDela * 10) / 10, capaSemaine, ops, surchargeWeeks }
}
