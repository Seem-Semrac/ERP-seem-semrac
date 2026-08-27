// ══════════════════════════════════════════════════════════════
// Génère src/manuels_contenu.ts à partir de docs/manuel/html/*.html.
//
// POURQUOI un module généré plutôt que des imports Vite `?raw` :
//   `import x from '../docs/manuel/html/x.html?raw'` ne fonctionne QUE sous Vite.
//   L'app tourne aussi sous Node pur (conteneur Docker, `tsx`) et est bundlée par
//   esbuild dans le harnais : dans ces deux cas `?raw` n'est pas résolu et l'app
//   refuse de démarrer (ERR_MODULE_NOT_FOUND). Un simple module TS marche partout.
//
// Lancé automatiquement par le `prebuild` de package.json.
// Régénérer à la main après avoir modifié un manuel :
//   node scripts_doc/gen_manuels_module.mjs
// ══════════════════════════════════════════════════════════════
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'docs', 'manuel', 'html')
const OUT = join(ROOT, 'src', 'manuels_contenu.ts')

if (!existsSync(SRC)) { console.log('gen_manuels_module : docs/manuel/html absent — rien à faire'); process.exit(0) }

const fichiers = readdirSync(SRC).filter(f => f.endsWith('.html') && !f.startsWith('_')).sort()
const css = existsSync(join(SRC, 'manuel.css')) ? readFileSync(join(SRC, 'manuel.css'), 'utf8') : ''

const entrees = fichiers.map(f => {
  const slug = f.replace(/\.html$/, '')
  return '  ' + JSON.stringify(slug) + ': ' + JSON.stringify(readFileSync(join(SRC, f), 'utf8')) + ','
}).join('\n')

const contenu = `// ⚠ FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
// Source : docs/manuel/html/*.html · Générateur : scripts_doc/gen_manuels_module.mjs
// (regénéré automatiquement par le \`prebuild\` de package.json)
// Le contenu des manuels est embarqué ici pour passer par le contrôle d'accès du worker
// (cf. src/manuels.tsx) et pour rester lisible par Node/tsx comme par Vite.

export const MANUELS_HTML: Record<string, string> = {
${entrees}
}

export const MANUEL_CSS: string = ${JSON.stringify(css)}
`
writeFileSync(OUT, contenu)
console.log('gen_manuels_module : ' + fichiers.length + ' manuels + css → src/manuels_contenu.ts (' + Math.round(contenu.length / 1024) + ' Ko)')
