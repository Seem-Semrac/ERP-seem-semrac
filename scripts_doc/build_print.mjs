// ══════════════════════════════════════════════════════════════
// GÉNÉRATEUR des recueils imprimables → docs/print/*.html
// Concatène les Markdown d'une collection, convertit en HTML (marked),
// embarque les images en base64 (fichier autonome), applique un CSS A4.
// Ouvrir le .html puis Imprimer → PDF.
// Usage : node scripts_doc/build_print.mjs
// ══════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(ROOT, 'docs')
const ASSETS = join(DOCS, 'assets')
const OUT = join(DOCS, 'print')

// Ordonne les .md d'un dossier (index/prise-en-main d'abord, puis alpha, sous-dossiers ensuite)
function ordered(dir) {
  const files = []
  const walk = (d, depth) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.isDirectory()) walk(join(d, e.name), depth + 1)
      else if (e.name.endsWith('.md')) files.push({ path: join(d, e.name), depth, name: e.name })
    }
  }
  walk(dir, 0)
  const P = (s) => s.replace(/\\/g, '/')
  // ordre de lecture : README → prise en main → PARCOURS guidés → chapitres → guides FORMULAIRES (référence)
  const rank = (f) => {
    if (f.name.startsWith('00-README')) return 0
    if (f.name.startsWith('00-prise')) return 2
    if (P(f.path).includes('/parcours/')) return 3
    if (P(f.path).includes('/formulaires/')) return 6
    return 5
  }
  return files.sort((a, b) => (rank(a) - rank(b)) || a.path.localeCompare(b.path))
}

// Cache base64 des images
const b64 = {}
function dataUri(name) {
  const p = join(ASSETS, name + '.png')
  if (!existsSync(p)) return null
  if (!b64[name]) b64[name] = 'data:image/png;base64,' + readFileSync(p).toString('base64')
  return b64[name]
}

const CSS = `
@page { size: A4; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 11pt; line-height: 1.5; max-width: 900px; margin: 0 auto; padding: 20px; }
h1 { color: #0e6ba8; border-bottom: 3px solid #0e6ba8; padding-bottom: 6px; page-break-before: always; margin-top: 0; }
h1:first-of-type { page-break-before: avoid; }
h2 { color: #0a4e7a; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-top: 1.4em; }
h3 { color: #334155; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9.5pt; }
th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #f1f5f9; }
code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 9.5pt; }
pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 9pt; }
pre code { background: none; color: inherit; }
img { max-width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
blockquote { border-left: 4px solid #f59e0b; background: #fffbeb; margin: 8px 0; padding: 6px 14px; color: #92400e; }
a { color: #0e6ba8; }
.cover { text-align: center; padding: 60px 0; }
.cover h1 { border: none; page-break-before: avoid; font-size: 26pt; }
.cover p { color: #64748b; }
`

const COLLECTIONS = [
  { file: 'DocTechnique', titre: 'Documentation technique', sous: 'ERP Seem Semrac — pour le prestataire de maintenance', dir: join(DOCS, 'technique') },
  { file: 'ManuelUtilisateur', titre: 'Manuel utilisateur', sous: 'ERP Seem Semrac — guide pas-à-pas', dir: join(DOCS, 'manuel') },
  { file: 'FichesPoste', titre: 'Fiches de poste', sous: 'ERP Seem Semrac — une fiche par rôle', dir: join(DOCS, 'fiches-poste') },
]

mkdirSync(OUT, { recursive: true })
const today = new Date().toISOString().slice(0, 10)
for (const col of COLLECTIONS) {
  if (!existsSync(col.dir)) { console.log('SKIP ' + col.file + ' (dossier absent)'); continue }
  let md = ''
  for (const f of ordered(col.dir)) {
    if (f.name.startsWith('00-index')) continue // le sommaire md est redondant en imprimé
    md += '\n\n' + readFileSync(f.path, 'utf-8')
  }
  // liens internes .md → ancres neutralisées (document unique)
  md = md.replace(/\]\(([^)]+)\.md\)/g, '](#)')
  let html = marked.parse(md)
  // images assets/x.png précédées de N niveaux « ../ » (chapitres = ../assets, sous-dossiers parcours/formulaires = ../../assets) → data URI
  html = html.replace(/(?:\.{1,2}\/)*assets\/([A-Za-z0-9_-]+)\.png/g, (m, name) => dataUri(name) || m)
  const doc = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${col.titre} — ERP Seem Semrac</title><style>${CSS}</style></head><body>
<div class="cover"><h1>${col.titre}</h1><p>${col.sous}</p><p>Version du ${today}</p></div>
${html}
</body></html>`
  writeFileSync(join(OUT, col.file + '.html'), doc)
  console.log('OK → docs/print/' + col.file + '.html (' + Math.round(doc.length / 1024) + ' Ko)')
}
console.log('\nOuvrir chaque .html puis Imprimer (Ctrl+P) → Enregistrer au format PDF.')
