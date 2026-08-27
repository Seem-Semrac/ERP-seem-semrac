// ══════════════════════════════════════════════════════════════
// REFRESH DOC — régénère toute la documentation dérivée et vérifie.
// C'est le cœur exécutable du skill erp-doc-sync.
//   node scripts_doc/refresh.mjs            (régénère + lint + harnais)
//   node scripts_doc/refresh.mjs --print    (+ recueils imprimables)
//   node scripts_doc/refresh.mjs --shots    (+ captures d'écran, serveur requis)
// Code retour ≠ 0 si une étape échoue.
// ══════════════════════════════════════════════════════════════
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const run = (cmd, label) => {
  process.stdout.write('▸ ' + label + ' … ')
  try { execSync(cmd, { cwd: ROOT, stdio: 'pipe' }); console.log('OK') }
  catch (e) { console.log('ÉCHEC'); console.error((e.stdout || e.message || '').toString().slice(-400)); process.exitCode = 1 }
}

console.log('== Rafraîchissement de la documentation ==')
run('node scripts_doc/gen_api_ref.mjs', 'Référence API (07)')
run('python scripts_doc/gen_db_ref.py', 'Référence tables (03b)')
run('node scripts_doc/gen_module_fiches.mjs', 'Fiches modules (06)')
run('node scripts_doc/gen_manuel.mjs', 'Manuel utilisateur')
run('node scripts_doc/gen_fiches_poste.mjs', 'Fiches de poste')
if (args.includes('--shots')) run('node scripts_doc/capture_screens.mjs', 'Captures d\'écran')
if (args.includes('--print')) run('node scripts_doc/build_print.mjs', 'Recueils imprimables')
console.log('== Vérifications ==')
run('node scripts_doc/lint_docs.mjs', 'Lint doc (liens/images)')
run('node scripts_doc/harness_all_pages.mjs', 'Harnais pages exportées')
run('node scripts_doc/harness_routes.mjs', 'Harnais pages inline (routes)')
console.log(process.exitCode ? '\n⚠ Au moins une étape a échoué.' : '\n✅ Documentation à jour et vérifiée.')
