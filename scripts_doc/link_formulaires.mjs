// ══════════════════════════════════════════════════════════════
// Insère un renvoi vers les guides « formulaires champ par champ »
// dans chaque chapitre du manuel et chaque fiche de poste concernée.
// Idempotent (marqueur <!-- formulaires-link -->). Relançable sans risque.
// Usage : node scripts_doc/link_formulaires.mjs
// ══════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
const MARK = '<!-- formulaires-link -->'
const SERVICE_NOM = {
  commercial: 'Commercial', be: 'Bureau d\'Études', achats: 'Achats', production: 'Production',
  oas: 'OAS', qualite: 'Qualité', securite: 'Sécurité', expeditions: 'Expéditions',
  stock: 'Stock', maintenance: 'Maintenance', rh: 'RH', compta: 'Comptabilité',
  direction: 'Direction', plans: 'Plan / Bâtiment',
}

// Insère `block` juste après la 1re ligne de titre (# ...), si le marqueur est absent.
function inject(file, block) {
  if (!existsSync(file)) { console.log('absent : ' + file); return false }
  let txt = readFileSync(file, 'utf-8')
  if (txt.includes(MARK)) { txt = txt.replace(new RegExp(MARK + '[\\s\\S]*?' + MARK), MARK + '\n' + block + '\n' + MARK) }
  else {
    const lines = txt.split('\n')
    let i = lines.findIndex(l => /^#\s/.test(l))
    if (i < 0) i = 0
    lines.splice(i + 1, 0, '', MARK, block, MARK)
    txt = lines.join('\n')
  }
  writeFileSync(file, txt)
  return true
}

// 1) Chapitres du manuel : 1 renvoi vers formulaires/<slug>.md
let n = 0
for (const slug of Object.keys(SERVICE_NOM)) {
  const block = `> 📋 **Chaque case de chaque formulaire de ce service est expliquée ici :** [Guide des formulaires — ${SERVICE_NOM[slug]}](formulaires/${slug}.md).`
  if (inject(join(DOCS, 'manuel', slug + '.md'), block)) n++
}

// 2) Fiches de poste : renvoi vers le(s) guide(s) des formulaires du rôle
const FICHE_FORMS = {
  commercial: ['commercial'], bei: ['be'], achats: ['achats'], production: ['production'],
  operateur: ['production', 'qualite'], oas: ['oas'], qualite: ['qualite', 'securite'],
  logistique: ['expeditions', 'stock'], maintenance: ['maintenance'], comptable: ['compta'],
  rh: ['rh'], direction: ['direction'],
}
for (const [fiche, slugs] of Object.entries(FICHE_FORMS)) {
  const links = slugs.map(s => `[${SERVICE_NOM[s]}](../manuel/formulaires/${s}.md)`).join(' · ')
  const block = `> 📋 **Vos formulaires, expliqués case par case :** ${links}.`
  if (inject(join(DOCS, 'fiches-poste', fiche + '.md'), block)) n++
}

console.log('OK — ' + n + ' fichiers reliés aux guides de formulaires.')
