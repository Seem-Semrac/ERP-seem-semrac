// ══════════════════════════════════════════════════════════════
// PICTOGRAMMES CLP / SGH (SGH01…SGH09) — pictogrammes OFFICIELS
// SVG domaine public (UN / Wikimedia), stockés dans clp_svgs.ts.
// Pour éviter le poids (la liste répète les pictos), on les définit
// UNE fois en <symbol> (clpDefs) et on les réutilise via <use>.
// ══════════════════════════════════════════════════════════════
import { GHS_SVG } from './clp_svgs'

export const CLP_ORDER = ['SGH01', 'SGH02', 'SGH03', 'SGH04', 'SGH05', 'SGH06', 'SGH07', 'SGH08', 'SGH09']

export const CLP_LABEL: Record<string, string> = {
  SGH01: 'Explosif', SGH02: 'Inflammable', SGH03: 'Comburant', SGH04: 'Gaz sous pression',
  SGH05: 'Corrosif', SGH06: 'Toxique', SGH07: 'Nocif / irritant', SGH08: 'Danger santé (CMR)',
  SGH09: 'Danger pour le milieu aquatique',
}

function parse(svg: string): { vb: string; inner: string } {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 100 100'])[1] as string
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return { vb, inner }
}
const PARSED: Record<string, { vb: string; inner: string }> = {}
for (const c of CLP_ORDER) if (GHS_SVG[c]) PARSED[c] = parse(GHS_SVG[c])

export const CLP_VB: Record<string, string> = Object.fromEntries(CLP_ORDER.map((c) => [c, PARSED[c] ? PARSED[c].vb : '0 0 100 100']))

// Bloc <defs> à inclure UNE fois par document (page + fenêtre PDF).
export function clpDefs(): string {
  const syms = CLP_ORDER.filter((c) => PARSED[c]).map((c) => `<symbol id="ghs-${c}" viewBox="${PARSED[c].vb}">${PARSED[c].inner}</symbol>`).join('')
  return `<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${syms}</defs></svg>`
}

// Un pictogramme à une taille donnée (référence le <symbol> via <use>).
export function clpUse(code: string, size = 26): string {
  const c = String(code || '').toUpperCase()
  if (!PARSED[c]) return ''
  return `<span title="${c} — ${CLP_LABEL[c] || ''}" style="display:inline-block;width:${size}px;height:${size}px;vertical-align:middle;margin:0 1px;"><svg viewBox="${PARSED[c].vb}" width="100%" height="100%"><use href="#ghs-${c}" xlink:href="#ghs-${c}"/></svg></span>`
}

// Rendu d'une liste de codes (valeur du champ pictogrammes).
export function clpRow(codes: any, size = 24): string {
  const arr = Array.isArray(codes) ? codes : (codes ? [codes] : [])
  const out = arr.map((c: any) => clpUse(String(c), size)).filter(Boolean).join('')
  return out || '<span style="color:#cbd5e1;">—</span>'
}

// ─── Dérivation des pictogrammes depuis les mentions H (et phrases R) ───
const RULES: Array<[string, RegExp]> = [
  ['SGH01', /H2(0[0-5]|40|41)|R\s?[23]\b/i],
  ['SGH02', /H2(2[0-8]|4[12]|5[012]|6[01])|R1[0125]\b|R17\b/i],
  ['SGH03', /H27[012]|R[789]\b/i],
  ['SGH04', /H28[01]/i],
  ['SGH05', /H(290|314|318)|R3[45]\b/i],
  ['SGH06', /H3(0[01]|1[01]|3[01])|R2[3-8]\b/i],
  ['SGH07', /H3(02|12|15|17|19|32|35|36)|R(2[012]|3[678]|6[567])\b/i],
  ['SGH08', /H3(34|4[01]|5[01]|6[012]|7[0-3])|R(39|4[0-9]|6[0-3]|68)\b/i],
  ['SGH09', /H4(00|1[0-3]|20)|R5[0-9]\b/i],
]
export function pictosFromH(mentions: any[]): string[] {
  const txt = (Array.isArray(mentions) ? mentions : [mentions]).map((x) => String(x || '')).join(' ')
  return CLP_ORDER.filter((code) => { const r = RULES.find((x) => x[0] === code); return r ? r[1].test(txt) : false })
}
