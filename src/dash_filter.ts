// ══════════════════════════════════════════════════════════════
// MOTEUR DE FILTRES DES DASHBOARDS — ERP Seem Semrac
// Lecture de query params (SSR) → DashFilter → passé aux fonctions kpi.ts.
// 100% rétro-compatible : sans filtre (undefined), le comportement est identique
// à l'existant (mois courant + année courante Jan-Déc).
// ══════════════════════════════════════════════════════════════
export type DashFilter = {
  preset: string          // 'mois' | 'mois-1' | 'ytd' | '12m' | 'annee' | 'perso'
  from: string            // 'YYYY-MM-DD'
  to: string              // 'YYYY-MM-DD'
  ref: string             // 'YYYY-MM' — mois de référence des KPI instantanés
  year: number
  site: '' | 'Seem' | 'Semrac'
  client: string
  machine: string
  fournisseur: string
  compare: boolean        // N vs N-1
  active: boolean         // true si un filtre non-défaut est appliqué
  print: boolean          // mode impression PDF
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const firstOfMonth = (y: number, m: number) => iso(new Date(Date.UTC(y, m, 1)))
const lastOfMonth = (y: number, m: number) => iso(new Date(Date.UTC(y, m + 1, 0)))

// Résout un preset en plage [from, to].
export function resolvePreset(preset: string, from?: string, to?: string): { from: string; to: string; preset: string } {
  const now = new Date(), y = now.getUTCFullYear(), m = now.getUTCMonth(), today = iso(now)
  switch (preset) {
    case 'mois-1': return { from: firstOfMonth(y, m - 1), to: lastOfMonth(y, m - 1), preset }
    case 'ytd': return { from: firstOfMonth(y, 0), to: today, preset }
    case '12m': return { from: firstOfMonth(y, m - 11), to: today, preset }
    case 'annee': return { from: firstOfMonth(y, 0), to: lastOfMonth(y, 11), preset }
    case 'perso': return { from: (from || firstOfMonth(y, m)).slice(0, 10), to: (to || today).slice(0, 10), preset }
    default: return { from: firstOfMonth(y, m), to: today, preset: 'mois' }
  }
}

export function parseFilter(c: any): DashFilter {
  const q = (k: string) => { try { return String(c.req.query(k) || '') } catch { return '' } }
  const presetIn = q('preset')
  const { from, to, preset } = resolvePreset(presetIn || 'mois', q('from'), q('to'))
  const site = (q('site') === 'Seem' || q('site') === 'Semrac') ? (q('site') as 'Seem' | 'Semrac') : ''
  const client = q('client'), machine = q('machine'), fournisseur = q('fournisseur')
  const compare = q('compare') === '1' || q('compare') === 'true'
  const active = !!(presetIn && presetIn !== 'mois') || !!site || !!client || !!machine || !!fournisseur || compare
  return {
    preset, from, to, ref: to.slice(0, 7), year: Number(to.slice(0, 4)) || new Date().getUTCFullYear(),
    site, client, machine, fournisseur, compare, active,
    print: q('print') === '1' || q('print') === 'true',
  }
}

// Sérialise le filtre en querystring (pour drill-down + boutons preset + export).
export function filterQS(f: DashFilter | undefined, over: Partial<DashFilter> = {}): string {
  if (!f) { const p = new URLSearchParams(); Object.entries(over).forEach(([k, v]) => v && p.set(k, String(v))); const s = p.toString(); return s ? '?' + s : '' }
  const m = { preset: f.preset, from: f.from, to: f.to, site: f.site, client: f.client, machine: f.machine, fournisseur: f.fournisseur, compare: f.compare ? '1' : '', ...over } as Record<string, any>
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(m)) if (v) p.set(k, String(v))
  const s = p.toString(); return s ? '?' + s : ''
}

// Liste des mois 'YYYY-MM' entre from et to (bornes incluses, max 120).
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  let y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7)) - 1
  const yTo = Number(to.slice(0, 4)), mTo = Number(to.slice(5, 7)) - 1
  let g = 0
  while ((y < yTo || (y === yTo && m <= mTo)) && g++ < 120) { out.push(y + '-' + ('0' + (m + 1)).slice(-2)); m++; if (m > 11) { m = 0; y++ } }
  return out
}

const MFR = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
export type Period = { from: string; to: string; ym: string; year: number; prevYear: number; months: { key: string; label: string }[] }

// Résout la période effective. Sans filtre → 12 mois de l'année courante (rétro-compat).
export function period(f?: DashFilter): Period {
  if (!f) {
    const y = new Date().getUTCFullYear()
    return { from: y + '-01-01', to: new Date().toISOString().slice(0, 10), ym: new Date().toISOString().slice(0, 7), year: y, prevYear: y - 1, months: MFR.map((lbl, i) => ({ key: y + '-' + ('0' + (i + 1)).slice(-2), label: lbl })) }
  }
  const keys = monthsBetween(f.from, f.to)
  const multi = new Set(keys.map(k => k.slice(0, 4))).size > 1 || keys.length > 12
  const months = keys.map(k => ({ key: k, label: MFR[Number(k.slice(5, 7)) - 1] + (multi ? " '" + k.slice(2, 4) : '') }))
  return { from: f.from, to: f.to, ym: f.ref, year: f.year, prevYear: f.year - 1, months }
}

// Filtre un tableau de lignes selon plage de dates + site + client actifs.
export function filterRows<T extends Record<string, any>>(rows: T[], f: DashFilter | undefined, map: { dateField?: string; siteField?: string; clientField?: string }): T[] {
  if (!f || !f.active) return rows || []
  const { dateField, siteField = 'activite', clientField = 'client_nom' } = map
  return (rows || []).filter((r) => {
    // Site/client : n'écarte QUE si la ligne porte le champ (sinon la table n'est pas dimensionnée ainsi).
    if (f.site && r[siteField] != null && String(r[siteField]).toLowerCase() !== f.site.toLowerCase()) return false
    if (f.client && r[clientField] != null && String(r[clientField]) !== f.client) return false
    if (dateField && (f.from || f.to)) {
      const d = String(r[dateField] || '').slice(0, 10)
      if (d) { if (f.from && d < f.from) return false; if (f.to && d > f.to) return false }
    }
    return true
  })
}

// Libellé court de la période active (pour les sous-titres de KPI).
export function periodLabel(f?: DashFilter): string {
  if (!f || !f.active) return 'mois'
  switch (f.preset) {
    case 'mois': return 'mois'
    case 'mois-1': return 'mois -1'
    case 'ytd': return 'YTD'
    case '12m': return '12 mois'
    case 'annee': return String(f.year)
    default: return f.from.slice(0, 10) + ' → ' + f.to.slice(0, 10)
  }
}
