// ══════════════════════════════════════════════════════════════
// COMPARAISON RIGOUREUSE cloud ⟷ Docker
//
// Le spec OpenAPI de PostgREST est fermé côté cloud (401 avec la clé anon), et la
// clé anon ne donne pas accès au catalogue (pg_class, pg_policies). On compare donc
// ce qui est OBSERVABLE et ce qui compte pour l'application :
//   1. présence des tables         → requête count sur chaque table
//   2. colonnes locales manquantes → ?select=<toutes les colonnes> : PostgREST
//      répond 400 en nommant la première colonne inconnue ; on la retire et on
//      recommence jusqu'à convergence (peu de requêtes, résultat exact)
//   3. colonnes cloud en trop      → select=* sur une ligne des tables non vides
//   4. volumes                     → count exact des deux côtés
//
// Usage : node scripts_doc/compare_bases.mjs
// ══════════════════════════════════════════════════════════════
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const db = fs.readFileSync('src/db.ts', 'utf8')
const CU = (db.match(/https:\/\/[a-z0-9]+\.supabase\.co/) || [])[0]
const CK = (db.match(/eyJ[A-Za-z0-9_.\-]{40,}/) || [])[0]
const env = fs.readFileSync('docker/.env', 'utf8')
const g = k => ((env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1] || '').trim()
const LU = 'http://127.0.0.1:' + (g('KONG_HTTP_PORT') || '8000')
const LK = g('ANON_KEY')

const hC = { apikey: CK, Authorization: 'Bearer ' + CK }
const hL = { apikey: LK, Authorization: 'Bearer ' + LK }

// ── Colonnes locales, depuis le catalogue Postgres (source de vérité locale) ──
const psql = q => execSync('docker exec erp-db psql -U postgres -d postgres -t -A -F"|" -c "' + q.replace(/"/g, '\\"') + '"', { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
// ⚠ requête sur UNE ligne : passée à psql via le shell, un saut de ligne la tronque.
const REQ = "select c.table_name, string_agg(c.column_name, ',' order by c.ordinal_position) from information_schema.columns c join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name where c.table_schema = 'public' and t.table_type = 'BASE TABLE' group by c.table_name order by c.table_name;"
const brut = psql(REQ)
const LOCAL = {}
brut.split(/\r?\n/).filter(Boolean).forEach(l => { const [t, c] = l.split('|'); if (t) LOCAL[t] = c.split(',') })

const compte = async (u, h, t) => {
  const r = await fetch(u + '/rest/v1/' + t + '?select=*&limit=0', { headers: { ...h, Prefer: 'count=exact' } })
  if (!r.ok) return { ok: false, status: r.status }
  const cr = r.headers.get('content-range') || ''
  return { ok: true, n: Number((cr.split('/')[1] || '0')) || 0 }
}

// Colonnes locales absentes du cloud : on retire celles que PostgREST refuse, une à une.
const colonnesManquantes = async (t, cols) => {
  let reste = cols.slice(); const absentes = []
  for (let i = 0; i < cols.length + 2; i++) {
    if (!reste.length) break
    const r = await fetch(CU + '/rest/v1/' + t + '?select=' + reste.join(',') + '&limit=0', { headers: hC })
    if (r.ok) break
    const txt = await r.text()
    const m = /column\s+"?([a-z0-9_]+)"?\s+.*does not exist|'([a-z0-9_]+)' column/i.exec(txt) || /column ([a-z0-9_.]+) does not exist/i.exec(txt)
    const nom = m ? (m[1] || m[2] || '').replace(/^.*\./, '') : null
    if (!nom || !reste.includes(nom)) { absentes.push('(non résolu : ' + txt.slice(0, 90) + ')'); break }
    absentes.push(nom); reste = reste.filter(x => x !== nom)
  }
  return absentes
}

const tables = Object.keys(LOCAL)
console.log('Tables locales (BASE TABLE) : ' + tables.length + '\n')

const absentesCloud = [], ecarts = [], volumes = []
for (const t of tables) {
  const [c, l] = await Promise.all([compte(CU, hC, t), compte(LU, hL, t)])
  if (!c.ok) { absentesCloud.push(t + ' (HTTP ' + c.status + ')'); continue }
  if (!l.ok) { ecarts.push({ t, quoi: 'table illisible en local (HTTP ' + l.status + ')' }); continue }

  const manq = await colonnesManquantes(t, LOCAL[t])
  let enTrop = []
  if (c.n > 0) {
    const r = await fetch(CU + '/rest/v1/' + t + '?select=*&limit=1', { headers: hC })
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[0]) enTrop = Object.keys(j[0]).filter(x => !LOCAL[t].includes(x)) }
  }
  if (manq.length || enTrop.length) ecarts.push({ t, manq, enTrop })
  if (c.n !== l.n) volumes.push({ t, cloud: c.n, docker: l.n })
}

console.log('══ 1. TABLES ══')
console.log('  absentes du cloud (' + absentesCloud.length + ') : ' + (absentesCloud.join(', ') || 'aucune'))
console.log('')
console.log('══ 2. COLONNES ══')
if (!ecarts.length) console.log('  aucun écart de colonnes')
ecarts.forEach(e => console.log('  ' + e.t
  + (e.manq && e.manq.length ? '  → absentes du CLOUD : ' + e.manq.join(', ') : '')
  + (e.enTrop && e.enTrop.length ? '  → en trop au CLOUD : ' + e.enTrop.join(', ') : '')
  + (e.quoi ? '  → ' + e.quoi : '')))
console.log('')
console.log('══ 3. VOLUMES (lignes visibles par la clé anon) ══')
if (!volumes.length) console.log('  identiques partout')
volumes.forEach(v => console.log('  ' + v.t.padEnd(28) + ' cloud ' + String(v.cloud).padStart(5) + '   docker ' + String(v.docker).padStart(5)))
console.log('')
console.log('== ' + absentesCloud.length + ' table(s) absente(s) · ' + ecarts.length + ' écart(s) de colonnes · ' + volumes.length + ' écart(s) de volume ==')
