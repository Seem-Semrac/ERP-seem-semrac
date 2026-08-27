// ══════════════════════════════════════════════════════════════
// HARNAIS DE ROUTES — complète harness_all_pages.mjs en couvrant les
// pages construites EN INLINE dans src/index.tsx (non exportées comme
// fonctions pageX). On rend chaque route via app.request (template
// literal ÉVALUÉ → attrape les bugs d'échappement post-évaluation,
// ex. /production/habilitations) puis new Function sur chaque <script>.
// Nécessite Supabase joignable (données réelles). AUTH_ENFORCE=off.
// Usage : node scripts_doc/harness_routes.mjs
// ══════════════════════════════════════════════════════════════
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Routes GET à rendre (surtout les pages inline d'index.tsx). Étendre au besoin.
const ROUTES = [
  '/', '/login',
  '/production/habilitations', '/direction/validation',
  '/finances/taux', '/finances/couts', '/finances/imputations', '/finances/machines',
  '/dashboard/rh', '/dashboard/finance', '/dashboard/direction', '/dashboard/production',
  '/dashboard/commercial', '/dashboard/qualite', '/dashboard/maintenance', '/dashboard/stock',
  '/expedition/bl', '/expedition/bl-liste', '/expedition/envoi-client',
  '/commercial/avoirs-liste',
]

const entry = `
import app from '${join(ROOT, 'src', 'index').replace(/\\/g, '/')}'
const ROUTES = ${JSON.stringify(ROUTES)}
let fail = 0, pass = 0
for (const r of ROUTES) {
  let html = ''
  try {
    const res = await app.request(r, {}, { AUTH_ENFORCE: 'off' })
    html = await res.text()
    if (res.status >= 500) { console.log('WARN  ' + r + '  (HTTP ' + res.status + ')'); }
  } catch (e) { console.log('WARN  ' + r + '  (exception : ' + (e.message||'').slice(0,80) + ')'); continue }
  const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(m => m[1])
  let bad = 0
  scripts.forEach((s, i) => { try { new Function(s) } catch (e) { bad++; console.log('FAIL  ' + r + '  script#' + i + ' : ' + e.message) } })
  if (bad) fail++; else { pass++; console.log('PASS  ' + r + '  (' + scripts.length + ' scripts)') }
}
console.log('\\n== ' + pass + ' PASS · ' + fail + ' FAIL ==')
if (fail > 0) process.exit(1)
`

const workdir = join(tmpdir(), 'erp-harness-routes')
mkdirSync(workdir, { recursive: true })
const entryPath = join(workdir, 'entry.mts')
writeFileSync(entryPath, entry)
const outPath = join(workdir, 'routes.mjs')
try {
  execSync(`npx esbuild "${entryPath}" --bundle --platform=node --format=esm --outfile="${outPath}" --log-level=error`, { cwd: ROOT, stdio: 'inherit' })
  execSync(`node "${outPath}"`, { cwd: ROOT, stdio: 'inherit' })
} catch { process.exitCode = 1 }
finally { rmSync(workdir, { recursive: true, force: true }) }
