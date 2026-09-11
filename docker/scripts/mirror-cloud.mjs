// ══════════════════════════════════════════════════════════════
// MIROIR CLOUD → LOCAL (sans mot de passe DB du cloud)
// ──────────────────────────────────────────────────────────────
// Recopie le SCHÉMA + les DONNÉES des tables publiques de la base Supabase
// CLOUD vers la base Docker LOCALE, en n'utilisant que la clé anon (lecture
// REST) — le mot de passe Postgres du cloud n'est jamais nécessaire.
//
// Principe :
//   1. `GET /rest/v1/`  → spec OpenAPI de PostgREST = liste des tables/vues publiques.
//   2. pour chaque table : `GET /rest/v1/<t>?select=*&limit=N` → lignes réelles.
//   3. on DÉDUIT le schéma (colonnes + types permissifs) depuis les lignes.
//   4. on émet un fichier .sql : DROP+CREATE (schéma déduit) + GRANT + INSERT + NOTIFY.
//
// Le .sql est ensuite rejoué dans la base locale via `docker compose exec -T db psql`.
// Types volontairement permissifs (text / numeric / boolean / jsonb) : suffisant pour
// un ENVIRONNEMENT DE DEV (l'app lit en souplesse : Number(x)||0, String(x), .slice…).
//
// Usage :
//   node docker/scripts/mirror-cloud.mjs <CLOUD_URL> <ANON_KEY> <out.sql> [limit] [table1,table2,...]
// ══════════════════════════════════════════════════════════════

const [, , URL, KEY, OUT, LIMIT_ARG, ONLY_ARG] = process.argv
if (!URL || !KEY || !OUT) {
  console.error('Usage: node mirror-cloud.mjs <CLOUD_URL> <ANON_KEY> <out.sql> [limit] [only,tables]')
  process.exit(1)
}
const LIMIT = Math.max(1, parseInt(LIMIT_ARG || '5000', 10) || 5000)
const ONLY = (ONLY_ARG || '').split(',').map(s => s.trim()).filter(Boolean)
const fs = await import('node:fs')

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY }
// Tables internes / trop volumineuses / non pertinentes en dev.
// nomenclature_journal : journal EN 9100 en ajout seul, PROPRE à chaque base — jamais recopié
// (le DELETE du miroir y serait refusé, et les entrées d'une autre base s'y mêleraient à jamais).
const SKIP = new Set(['schema_migrations', 'spatial_ref_sys', 'nomenclature_journal'])

const qid = (s) => '"' + String(s).replace(/"/g, '""') + '"'
const lit = (v, type) => {
  if (v === null || v === undefined) return 'NULL'
  if (type === 'numeric') return (typeof v === 'number' && isFinite(v)) ? String(v) : 'NULL'
  if (type === 'boolean') return v ? 'true' : 'false'
  if (type === 'jsonb') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb"
  const s = (typeof v === 'object') ? JSON.stringify(v) : String(v)
  return "'" + s.replace(/'/g, "''") + "'"
}
const inferType = (vals) => {
  const nn = vals.filter(v => v !== null && v !== undefined)
  if (!nn.length) return 'text'
  if (nn.some(v => typeof v === 'object')) return 'jsonb'
  if (nn.every(v => typeof v === 'boolean')) return 'boolean'
  if (nn.every(v => typeof v === 'number')) return 'numeric'
  return 'text'
}

// Liste de candidats : Supabase réserve la spec OpenAPI (`GET /rest/v1/`) au service_role,
// or on n'a que la clé anon → on ne peut pas énumérer. On PROBE donc cette liste connue
// (fetchRows renvoie le statut ; les tables absentes/vides sont ignorées proprement).
// Liste des tables — GÉNÉRÉE depuis le schéma local (les 101 tables de public).
// ⚠ L ancienne liste était écrite à la main et avait dérivé : elle citait des tables
// inexistantes (hse_chimie, hse_vgp, perissables) et en OUBLIAIT de bien réelles
// (interlocuteurs 484 lignes, produits_perissables 236, operateur_presence 235,
// competences_operateur 92, hse_dechets 24…), qui restaient donc VIDES en local.
// À régénérer si le schéma évolue :
//   docker exec erp-db psql -U postgres -d postgres -t -A -c "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1;"
const CANDIDATES = [
  'absences', 'actions_correctives', 'affaires', 'affectation_poste', 'audit_grille', 'audit_programme',
  'audit_question', 'audits', 'balancelles', 'bons_de_commande', 'bons_de_livraison', 'bons_de_travail',
  'bons_sous_traitance', 'certifications', 'clients', 'commandes', 'commandes_prioritaires', 'competences_operateur',
  'conges', 'controles_cotes', 'credits', 'demandes_achat', 'demandes_prix', 'demandes_prix_lignes',
  'demandes_prix_reponses', 'demandes_site', 'demandes_travaux', 'derogations', 'documents', 'ecme',
  'ecme_verifications', 'ecritures_comptables', 'edit_locks', 'etudes_capabilite', 'factures_client', 'factures_fournisseur',
  'fai', 'fournisseurs', 'fournisseurs_st', 'fournitures_nomenclature', 'habilitations', 'hse_aspects_impacts',
  'hse_atex_zones', 'hse_conformite', 'hse_dechets', 'hse_diagnostic_iso', 'hse_diagnostic_iso26000', 'hse_epi_catalogue',
  'hse_epi_dotations', 'hse_epi_zone', 'hse_exercices', 'hse_exposition_chimique', 'hse_flash', 'hse_formations_requises',
  'hse_incidents', 'hse_mesures_env', 'hse_parties_interessees', 'hse_plans_prevention', 'hse_produits_chimiques', 'hse_risques',
  'hse_rse_indicateurs', 'hse_verifications', 'import_staging', 'interlocuteurs', 'kpi_objectifs', 'lots',
  'machine_bdt_historique', 'machines', 'machines_opex', 'mouvements_perissables', 'mouvements_stock', 'mtbf_machines',
  'nomenclatures', 'non_conformites', 'offres', 'operateur_bdt_historique', 'operateur_presence', 'ordres_maintenance',
  'pieces_rechange', 'plan_marqueurs', 'plans_batiment', 'plans_controle', 'plans_preventif', 'pointages',
  'postes', 'preparations_techniques', 'process_atelier', 'produits_fournisseurs', 'produits_perissables', 'pv_controle',
  'quarantaines', 'rapports_8d', 'ref_prix_historique', 'references_clients', 'releves_bains', 'releves_eau',
  'salaries', 'shifts', 'sous_traitants', 'stock', 'validations',
]

async function listTables() {
  try {
    const r = await fetch(URL.replace(/\/$/, '') + '/rest/v1/', { headers: H })
    if (r.ok) {
      const spec = await r.json()
      const paths = Object.keys(spec.paths || {})
      const t = paths.filter(p => /^\/[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)).map(p => p.slice(1)).filter(x => !SKIP.has(x))
      if (t.length) return t
    }
  } catch { /* pas de spec (clé anon) → repli sur les candidats */ }
  console.error('(spec OpenAPI indisponible avec la clé anon → probe de la liste de candidats)')
  return CANDIDATES.filter(t => !SKIP.has(t))
}

async function fetchRows(t) {
  const r = await fetch(URL.replace(/\/$/, '') + '/rest/v1/' + t + '?select=*&limit=' + LIMIT, { headers: H })
  if (!r.ok) return { rows: null, status: r.status }
  return { rows: await r.json(), status: 200 }
}

let tables = await listTables()
if (ONLY.length) tables = tables.filter(t => ONLY.includes(t))
tables.sort()

const out = []
out.push('-- Miroir CLOUD → LOCAL — DONNÉES UNIQUEMENT (le schéma vient de schema.sql + scripts_import/).')
out.push('SET client_min_messages TO WARNING;')
// Pas de transaction globale : avec ON_ERROR_STOP=0, une table en erreur ne doit PAS
// faire échouer les autres. Chaque instruction s'auto-committe donc indépendamment.

const report = []
for (const t of tables) {
  const { rows, status } = await fetchRows(t)
  if (rows === null) { report.push([t, 'skip(' + status + ')', 0]); continue }
  if (!Array.isArray(rows) || rows.length === 0) { report.push([t, 'vide', 0]); continue }
  // Union des colonnes (PostgREST renvoie toutes les colonnes, même NULL, mais on sécurise).
  const cols = []
  const seen = new Set()
  for (const row of rows) for (const k of Object.keys(row)) if (!seen.has(k)) { seen.add(k); cols.push(k) }
  const types = {}
  for (const c of cols) types[c] = inferType(rows.map(r => r[c]))
  // ⚠ LE MIROIR NE TOUCHE PLUS AU SCHÉMA — il ne recopie que les DONNÉES.
  //
  // L'ancienne version faisait `DROP TABLE … CASCADE` puis recréait la table à partir
  // d'un schéma DÉDUIT des lignes rapatriées, et terminait par `DISABLE ROW LEVEL
  // SECURITY`. Trois dégâts, constatés le 25/08/2026 :
  //   · 45 colonnes perdues (celles absentes de l'échantillon ou toujours nulles) —
  //     dont bons_de_travail.temps_alloue, poste_id, oas_avant/apres, lots.avancement ;
  //   · RLS désactivée sur 51 tables → 51 ERREURS dans les Advisors de Supabase ;
  //   · contraintes, index et policies de schema.sql effacés au passage.
  // Le schéma est la responsabilité de `schema.sql` + des migrations `scripts_import/`.
  // Ici on vide et on réinsère : si une table ou une colonne manque en local, l'INSERT
  // échoue et le rapport le signale — c'est le signal que le schéma local est en retard.
  out.push('')
  out.push('-- ' + t + ' (' + rows.length + ' lignes)')
  out.push('DELETE FROM public.' + qid(t) + ';')
  const colList = cols.map(qid).join(', ')
  for (const row of rows) {
    const vals = cols.map(c => lit(row[c], types[c])).join(', ')
    out.push('INSERT INTO public.' + qid(t) + ' (' + colList + ') VALUES (' + vals + ');')
  }
  report.push([t, 'ok', rows.length])
}

out.push('')
out.push("NOTIFY pgrst, 'reload schema';")
fs.writeFileSync(OUT, out.join('\n'))

const okd = report.filter(r => r[1] === 'ok')
console.error('Tables miroir : ' + okd.length + ' peuplées / ' + tables.length + ' vues')
for (const [t, st, n] of report) console.error('  ' + t.padEnd(28) + ' ' + st + (n ? ' · ' + n + ' lignes' : ''))
console.error('→ SQL écrit dans ' + OUT)
