// ══════════════════════════════════════════════════════════════
// Copie les captures utilisées par les manuels HTML vers public/static/manuel/,
// d'où elles seront servies par Cloudflare Pages (dist/static/manuel/…).
//
// Lancé AUTOMATIQUEMENT avant chaque build (script `prebuild` de package.json) :
// les images ne sont donc PAS dupliquées dans le dépôt (public/static/manuel/ est
// gitignoré) — elles restent versionnées une seule fois dans docs/assets/.
//
// ⚠ Le TEXTE des manuels, lui, est embarqué dans le worker (src/manuels.tsx) pour
//   pouvoir être filtré par rôle ; seules les IMAGES sont servies en statique.
// ══════════════════════════════════════════════════════════════
import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'docs', 'assets')
const HTML = join(ROOT, 'docs', 'manuel', 'html')
const OUT = join(ROOT, 'public', 'static', 'manuel')

if (!existsSync(HTML)) { console.log('sync_manuel_assets : aucun manuel HTML — rien à faire'); process.exit(0) }

// 1) Recenser les images réellement référencées par les manuels
const used = new Set()
for (const f of readdirSync(HTML).filter(x => x.endsWith('.html') && !x.startsWith('_'))) {   // _TEMPLATE.html = gabarit (images fictives)
  const html = readFileSync(join(HTML, f), 'utf8')
  for (const m of html.matchAll(/assets\/([a-z0-9_-]+\.png)/gi)) used.add(m[1])
}

// 2) Copier (seulement si absente ou plus ancienne que la source)
mkdirSync(OUT, { recursive: true })
let copiees = 0, ajour = 0, absentes = []
for (const name of used) {
  const src = join(SRC, name), dst = join(OUT, name)
  if (!existsSync(src)) { absentes.push(name); continue }
  if (existsSync(dst) && statSync(dst).mtimeMs >= statSync(src).mtimeMs) { ajour++; continue }
  copyFileSync(src, dst); copiees++
}

console.log(`sync_manuel_assets : ${used.size} images référencées · ${copiees} copiée(s) · ${ajour} déjà à jour${absentes.length ? ' · ⚠ ' + absentes.length + ' MANQUANTE(S) : ' + absentes.join(', ') : ''}`)
if (absentes.length) process.exitCode = 0   // non bloquant : le manuel s'affiche, l'image sera cassée
