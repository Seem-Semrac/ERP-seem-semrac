// ══════════════════════════════════════════════════════════════
// MIROIR DU BUCKET « ged » : cloud → stack Docker locale
//
// POURQUOI
// La copie de la base (docker/db/seed/_mirror.sql) recopie les LIGNES mais pas les
// FICHIERS du stockage. Résultat : la table `documents` référence des plans, des
// fichiers CAO et le fond de la maquette bâtiment… qui n'existent pas en local.
// /api/ged/file/:id répond alors en erreur et les écrans concernés paraissent cassés
// (c'est ce qui faisait croire à un service Plan / Bâtiment « full buggé »).
//
// USAGE (depuis la racine du dépôt, stack Docker démarrée) :
//   node docker/scripts/mirror_ged.mjs
//   node docker/scripts/mirror_ged.mjs --dry     (liste sans rien écrire)
//
// Lit l'URL + la clé anon du CLOUD dans src/db.ts, et les paramètres LOCAUX dans
// docker/.env. N'écrit jamais aucune clé sur disque ni dans les journaux.
// ══════════════════════════════════════════════════════════════
import fs from 'node:fs'

const DRY = process.argv.includes('--dry')

const db = fs.readFileSync('src/db.ts', 'utf8')
const CLOUD = (db.match(/https:\/\/[a-z0-9]+\.supabase\.co/) || [])[0]
const CLOUD_KEY = (db.match(/eyJ[A-Za-z0-9_.\-]{40,}/) || [])[0]

const env = fs.readFileSync('docker/.env', 'utf8')
const g = k => ((env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1] || '').trim()
const LOCAL = 'http://127.0.0.1:' + (g('KONG_HTTP_PORT') || '8000')
const LOCAL_ANON = g('ANON_KEY')
const LOCAL_SVC = g('SERVICE_ROLE_KEY') || LOCAL_ANON

if (!CLOUD || !CLOUD_KEY) { console.error('URL/clé cloud introuvables dans src/db.ts'); process.exit(1) }
if (!LOCAL_ANON) { console.error('ANON_KEY absente de docker/.env'); process.exit(1) }

const hCloud = { apikey: CLOUD_KEY, Authorization: 'Bearer ' + CLOUD_KEY }
const hLocal = { apikey: LOCAL_SVC, Authorization: 'Bearer ' + LOCAL_SVC }

// Documents à mirroir : ceux référencés par la base LOCALE (inutile de rapatrier plus).
const docs = await (await fetch(LOCAL + '/rest/v1/documents?select=id,fichier_nom,storage_path,mime,taille,actif', { headers: hLocal })).json()
const utiles = (Array.isArray(docs) ? docs : []).filter(d => d.storage_path && d.actif !== false)

console.log('Documents référencés en local : ' + utiles.length)
let copies = 0, dejaLa = 0, echecs = 0

for (const d of utiles) {
  const p = d.storage_path
  // déjà présent en local ?
  const tete = await fetch(LOCAL + '/storage/v1/object/sign/ged/' + p, {
    method: 'POST', headers: { ...hLocal, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }),
  })
  if (tete.ok) { dejaLa++; console.log('  = déjà là   ' + (d.fichier_nom || p)); continue }

  if (DRY) { console.log('  + à copier  ' + (d.fichier_nom || p)); copies++; continue }

  // signature côté cloud puis téléchargement
  const sig = await fetch(CLOUD + '/storage/v1/object/sign/ged/' + p, {
    method: 'POST', headers: { ...hCloud, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 600 }),
  })
  if (!sig.ok) { echecs++; console.log('  ! absent du cloud aussi : ' + (d.fichier_nom || p) + ' (HTTP ' + sig.status + ')'); continue }
  const j = await sig.json()
  const dl = await fetch(CLOUD + '/storage/v1' + j.signedURL)
  if (!dl.ok) { echecs++; console.log('  ! téléchargement KO : ' + (d.fichier_nom || p)); continue }
  const buf = Buffer.from(await dl.arrayBuffer())

  const up = await fetch(LOCAL + '/storage/v1/object/ged/' + p, {
    method: 'POST',
    headers: { ...hLocal, 'Content-Type': d.mime || 'application/octet-stream', 'x-upsert': 'true' },
    body: buf,
  })
  if (up.ok) { copies++; console.log('  + copié     ' + (d.fichier_nom || p) + '  (' + buf.length + ' o)') }
  else { echecs++; console.log('  ! dépôt local KO : ' + (d.fichier_nom || p) + ' (HTTP ' + up.status + ')') }
}

console.log('')
console.log('== ' + copies + (DRY ? ' à copier' : ' copié(s)') + ' · ' + dejaLa + ' déjà présent(s) · ' + echecs + ' échec(s) ==')
if (echecs) console.log('Un échec « absent du cloud aussi » signale une ligne `documents` orpheline : le fichier n\'existe nulle part.')
