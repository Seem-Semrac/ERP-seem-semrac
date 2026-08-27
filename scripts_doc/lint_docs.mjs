// ══════════════════════════════════════════════════════════════
// LINT DE LA DOCUMENTATION — vérifie que docs/ ne référence
// aucune image manquante ni lien Markdown interne cassé.
// Usage : node scripts_doc/lint_docs.mjs      (code retour ≠ 0 si erreur)
// ══════════════════════════════════════════════════════════════
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
if (!existsSync(DOCS)) { console.log('docs/ absent — rien à linter.'); process.exit(0) }

function* mdFiles(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* mdFiles(p)
    else if (e.name.endsWith('.md')) yield p
  }
}

let errors = 0, images = 0, links = 0
for (const f of mdFiles(DOCS)) {
  const src = readFileSync(f, 'utf-8')
  const rel = f.slice(DOCS.length + 1)
  // images ![alt](path) et liens [txt](path.md...) — ignore http(s) et ancres
  for (const m of src.matchAll(/!\[[^\]]*\]\(([^)#\s]+)[^)]*\)|(?<!!)\[[^\]]*\]\(([^)#\s]+\.md)[^)]*\)/g)) {
    const target = m[1] || m[2]
    if (!target || /^https?:/.test(target)) continue
    const abs = resolve(dirname(f), decodeURIComponent(target))
    if (m[1]) images++; else links++
    if (!existsSync(abs)) { console.log('CASSÉ  ' + rel + '  →  ' + target); errors++ }
    else if (m[1] && statSync(abs).size < 5000) { console.log('SUSPECT (image <5Ko)  ' + rel + '  →  ' + target) }
  }
}
console.log('== ' + images + ' images, ' + links + ' liens internes vérifiés · ' + errors + ' cassé(s) ==')
process.exit(errors ? 1 : 0)
