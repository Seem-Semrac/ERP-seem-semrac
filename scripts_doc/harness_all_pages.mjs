// ══════════════════════════════════════════════════════════════
// HARNAIS « TOUTES PAGES » — vérification systématique de la
// syntaxe des <script> clients générés par CHAQUE page de l'ERP.
// Attrape la classe de bug récurrente : échappements cassés dans
// les templates TSX (apostrophes, \n non doublés, ${} involontaires).
//
// Usage :
//   node scripts_doc/harness_all_pages.mjs           (suppose le bundle déjà construit)
//   → construit un bundle esbuild temporaire qui importe tous les
//     modules src/, appelle chaque export commençant par « page »
//     avec des données factices permissives, extrait les <script>
//     et fait new Function() dessus.
// Sortie : tableau PASS/FAIL + code retour ≠ 0 si au moins 1 FAIL.
// ══════════════════════════════════════════════════════════════
import { execSync } from 'node:child_process'
import { readdirSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

// Modules page candidats (exclut les couches non-UI)
// server.node.ts = point d'entrée Node (Docker) : appelle serve() au chargement → binderait le port 3000
// et bloquerait le harnais. Il n'expose aucune page → exclu (comme index.tsx et les couches non-UI).
const EXCLUDE = new Set(['index.tsx', 'server.node.ts', 'db.ts', 'queries.ts', 'types.ts', 'auth.ts', 'renderer.tsx', 'kpi.ts', 'qref.ts'])
const modules = readdirSync(SRC).filter(f => /\.(tsx|ts)$/.test(f) && !EXCLUDE.has(f))

// Entrée générée : importe tout (chemins ABSOLUS : le fichier d'entrée vit dans le dossier temp), teste tout
const SRCU = SRC.replace(/\\/g, '/')
const entry = `
${modules.map((m, i) => `import * as M${i} from '${SRCU}/${m.replace(/\.(tsx|ts)$/, '')}'`).join('\n')}
const MODS = [${modules.map((m, i) => `["${m}", M${i}]`).join(', ')}]

// Données factices : proxys permissifs + variantes positionnelles
const P = () => new Proxy({}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : []) })
// Proxy PROFOND : toute propriété → autre proxy profond ; méthodes de tableau → [] ; sérialisable JSON
function DP() {
  return new Proxy({}, { get: (_t, k) => {
    if (k === Symbol.toPrimitive || k === 'toString') return () => ''
    if (k === Symbol.iterator) return [][Symbol.iterator].bind([])
    if (k === 'toJSON') return () => ({})
    if (['map','filter','forEach','find','some','every','slice','sort','flatMap','reduce','includes','indexOf','join','concat'].includes(k)) return () => (k === 'join' ? '' : (k === 'includes' ? false : []))
    if (k === 'length') return 0
    return DP()
  } })
}
const A16 = () => Array.from({ length: 16 }, () => [])
const STRATEGIES = [
  ['data-objet', (fn) => fn(P())],
  ['data-objet profond', (fn) => fn(DP())],
  ['sans-args', (fn) => fn()],
  ['16 tableaux', (fn) => fn(...A16())],
  ['16 proxies', (fn) => fn(...Array.from({ length: 16 }, () => P()))],
  ['tab+data', (fn) => fn('bdt', P())],
]

let fail = 0, pass = 0, skipped = 0
for (const [file, mod] of MODS) {
  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn !== 'function' || !/^page/i.test(name)) continue
    let html = null, how = null, lastErr = null
    for (const [label, call] of STRATEGIES) {
      try { const r = call(fn); if (typeof r === 'string' && r.length > 100) { html = r; how = label; break } }
      catch (e) { lastErr = e }
    }
    if (html == null) { console.log('SKIP  ' + file + ' :: ' + name + '  (rendu impossible : ' + String(lastErr && lastErr.message).slice(0, 80) + ')'); skipped++; continue }
    const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(m => m[1])
    let bad = 0
    scripts.forEach((s, i) => {
      try { new Function(s) } catch (e) { bad++; console.log('FAIL  ' + file + ' :: ' + name + '  script#' + i + ' : ' + e.message) }
    })
    if (bad) fail++
    else { pass++; console.log('PASS  ' + file + ' :: ' + name + '  (' + scripts.length + ' scripts, ' + how + ')') }
  }
}
console.log('\\n== ' + pass + ' PASS · ' + fail + ' FAIL · ' + skipped + ' SKIP ==')
if (fail > 0) process.exit(1)
`

const workdir = join(tmpdir(), 'erp-harness')
mkdirSync(workdir, { recursive: true })
const entryPath = join(workdir, 'entry.mts')
writeFileSync(entryPath, entry)
const outPath = join(workdir, 'harness.mjs')
// Bundle via l'API JS d'esbuild (et non la CLI) : il faut un PLUGIN pour résoudre la
// syntaxe Vite `?raw` (src/manuels.tsx importe les manuels HTML en texte) — les plugins
// ne sont pas disponibles en ligne de commande.
const rawPlugin = {
  name: 'vite-raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, args => ({
      path: resolve(args.resolveDir || dirname(args.importer), args.path.replace(/\?raw$/, '')),
      namespace: 'vite-raw',
    }))
    build.onLoad({ filter: /.*/, namespace: 'vite-raw' }, args => ({
      contents: 'export default ' + JSON.stringify(readFileSync(args.path, 'utf8')),
      loader: 'js',
    }))
  },
}
try {
  const esbuild = await import('esbuild')
  await esbuild.build({
    entryPoints: [entryPath], bundle: true, platform: 'node', format: 'esm',
    outfile: outPath, logLevel: 'error', plugins: [rawPlugin], absWorkingDir: ROOT,
  })
  execSync(`node "${outPath}"`, { cwd: ROOT, stdio: 'inherit' })
} catch (e) {
  process.exitCode = 1
} finally {
  rmSync(workdir, { recursive: true, force: true })
}
