// ══════════════════════════════════════════════════════════════
// GÉNÉRATEUR de la référence API — parse src/index.tsx et écrit
// docs/technique/07-api-reference.md (routes groupées par famille).
// À relancer après tout ajout/retrait de route (cf. skill erp-doc-sync).
// Usage : node scripts_doc/gen_api_ref.mjs
// ══════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(ROOT, 'src', 'index.tsx'), 'utf-8')
const lines = src.split('\n')

const routes = []
const rx = /app\.(get|post|patch|delete|put)\(\s*'([^']+)'/
lines.forEach((l, i) => {
  const m = rx.exec(l)
  if (m) routes.push({ method: m[1].toUpperCase(), path: m[2], line: i + 1 })
})

const famOf = (p) => {
  if (p.startsWith('/api/')) return 'api/' + (p.split('/')[2] || '?')
  return 'pages/' + (p.split('/')[1] || 'racine')
}
const groups = new Map()
for (const r of routes) {
  const f = famOf(r.path)
  if (!groups.has(f)) groups.set(f, [])
  groups.get(f).push(r)
}
const apiGroups = [...groups.entries()].filter(([k]) => k.startsWith('api/')).sort((a, b) => b[1].length - a[1].length)
const pageGroups = [...groups.entries()].filter(([k]) => k.startsWith('pages/')).sort((a, b) => b[1].length - a[1].length)

let md = `# Référence API & routes

> **Fichier généré** par \`node scripts_doc/gen_api_ref.mjs\` — ne pas éditer à la main.
> Source : \`src/index.tsx\` (${routes.length} routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (${apiGroups.reduce((n, [, v]) => n + v.length, 0)})

| Famille | Routes |
|---|---|
${apiGroups.map(([k, v]) => `| \`${k}\` | ${v.length} |`).join('\n')}

`
for (const [fam, list] of apiGroups) {
  md += `### ${fam}\n\n| Méthode | Chemin | index.tsx |\n|---|---|---|\n`
  for (const r of list.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)))
    md += `| ${r.method} | \`${r.path}\` | L${r.line} |\n`
  md += '\n'
}
md += `## Routes pages (${pageGroups.reduce((n, [, v]) => n + v.length, 0)})\n\n| Méthode | Chemin | index.tsx |\n|---|---|---|\n`
for (const [, list] of pageGroups)
  for (const r of list.sort((a, b) => a.path.localeCompare(b.path)))
    md += `| ${r.method} | \`${r.path}\` | L${r.line} |\n`

const dst = join(ROOT, 'docs', 'technique', '07-api-reference.md')
mkdirSync(dirname(dst), { recursive: true })
writeFileSync(dst, md)
console.log('OK → docs/technique/07-api-reference.md (' + routes.length + ' routes, ' + apiGroups.length + ' familles API)')
