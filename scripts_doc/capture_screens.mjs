// ══════════════════════════════════════════════════════════════
// CAPTURES D'ÉCRAN AUTOMATISÉES pour la documentation.
// Prérequis : `npm run build` puis serveur local :
//   npx wrangler pages dev dist --port 8788
// et Playwright : npx playwright install chromium (1re fois).
//
// Usage :
//   node scripts_doc/capture_screens.mjs             # tout le manifeste
//   node scripts_doc/capture_screens.mjs --only qualite
//   node scripts_doc/capture_screens.mjs --list
// Sortie : docs/assets/<nom>.png (noms STABLES, référencés par la doc)
// ══════════════════════════════════════════════════════════════
import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.ERP_URL || 'http://localhost:8788'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets')
const VIEWPORT = { width: 1600, height: 900 }
const LOGIN = { matricule: process.env.ERP_MAT || 'ADMIN', pin: process.env.ERP_PIN || '246810' }

// ── MANIFESTE : file = nom du PNG · path = route · clicks = sélecteurs cliqués en séquence · wait = ms après le dernier clic
// Ajouter/ajuster ici pour toute nouvelle capture (cf. skill erp-screenshots).
const MANIFEST = [
  { file: 'login',                 path: '/login', noauth: true },
  { file: 'accueil',               path: '/' },
  // Commercial (tabIdPrefix svc-tab)
  { file: 'commercial-dt',         path: '/commercial/service', clicks: ['#svc-tab-dt'] },
  { file: 'commercial-offre',      path: '/commercial/service', clicks: ['#svc-tab-offre'] },
  { file: 'commercial-avoirs',     path: '/commercial/service', clicks: ['#svc-tab-avoirs'] },
  { file: 'commercial-avoirs-cmdp',path: '/commercial/service', clicks: ['#svc-tab-avoirs', '#subtab-cmdp'] },
  { file: 'commercial-clients',    path: '/commercial/service', clicks: ['#svc-tab-clients'] },
  { file: 'commercial-cmd',        path: '/commercial/service', clicks: ['#svc-tab-cmd'] },
  // Bureau d'études
  { file: 'be-noms',               path: '/be/service' },
  { file: 'be-analyse',            path: '/be/service', clicks: ['#be-tab-analyse'] },
  { file: 'form-be-analyse',       path: '/be/analyse?dt=DT-2026-0001', wait: 3000, fullPage: true },   // formulaire d'analyse (tableau série ×q + paquets)
  { file: 'be-refs',               path: '/be/service', clicks: ['#be-tab-refs'] },
  // Achats
  { file: 'achats-rfq',            path: '/achats/service', clicks: ['#ach-tab-rfq'], wait: 500 },
  { file: 'achats-da',             path: '/achats/service', clicks: ['#ach-tab-da'] },
  { file: 'achats-fournisseurs',   path: '/achats/service', clicks: ['#ach-tab-fourn'] },
  // Production + planning
  { file: 'production-service',    path: '/production/service' },
  { file: 'production-postes',     path: '/production/service', eval: "var g=document.getElementById('ppanel-gantt-bdt'); if(g) g.style.display='none'; var mp=document.getElementById('ppanel-machines'); if(mp) mp.style.display=''; var vm=document.getElementById('vol-mach'); if(vm) vm.style.display='none'; var vp=document.getElementById('vol-pp'); if(vp) vp.style.display='';", wait: 700, fullPage: true },   // onglet Process Ateliers → volet Postes & Process (colonne Taux/h effectif)
  // OAS
  { file: 'oas',                   path: '/oas/service' },
  // Qualité
  { file: 'qualite-pv',            path: '/qualite/service' },
  { file: 'qualite-nc',            path: '/qualite/service', clicks: ['#qual-tab-nc'] },
  { file: 'qualite-8d',            path: '/qualite/service', clicks: ['#qual-tab-8d'] },
  { file: 'qualite-perissables',   path: '/qualite/service', clicks: ['#qual-tab-perissables'] },
  // Sécurité
  { file: 'securite-duer',         path: '/securite/service' },
  { file: 'securite-epi',          path: '/securite/service', clicks: ['#sec-tab-epi'] },
  { file: 'securite-chimie',       path: '/securite/service', clicks: ['#sec-tab-chimie'] },
  { file: 'securite-audit',        path: '/securite/service', clicks: ['#sec-tab-audit'], wait: 700 }, // Audit Conformite ISO 45001 - 4 sous-onglets standard (idem Qualite)
  // Environnement
  { file: 'environnement',         path: '/environnement/service' },
  { file: 'environnement-audit',   path: '/environnement/service', clicks: ['#sec-tab-audit'], wait: 700 }, // Audit Conformite ISO 14001 - 4 sous-onglets standard (idem Qualite)
  // Expéditions / Stock / Maintenance
  { file: 'qualite-plan-controle', path: '/qualite/service', clicks: ['#qual-tab-plan-controle'], wait: 700 },
  // Audits de conformité (SMI QSE + SI) — sous-onglets imbriqués dans l'onglet « Audit Conformité »
  { file: 'qualite-audit-programme', path: '/qualite/service', clicks: ['#qual-tab-audit'], wait: 700 },
  { file: 'qualite-audit-grilles',   path: '/qualite/service', clicks: ['#qual-tab-audit', '#audit-subbtn-grilles'], wait: 600 },
  { file: 'qualite-audit-ref',       path: '/qualite/service', clicks: ['#qual-tab-audit', '#audit-subbtn-ref'], wait: 600 },
  { file: 'qualite-dashboard',       path: '/qualite/service', clicks: ['#qual-tab-dashboard'], wait: 700, fullPage: true },
  { file: 'qualite-ecme',          path: '/qualite/service', clicks: ['#qual-tab-ecme'], wait: 700 }, // Contrôles périodiques + fiche de vie + PV
  { file: 'qualite-liberation',    path: '/qualite/service', clicks: ['#qual-tab-liberation'], wait: 600 },
  { file: 'qualite-quarantaine',   path: '/qualite/service', clicks: ['#qual-tab-quarantaine'], wait: 600 },
  { file: 'qualite-8d-d1',         path: '/qualite/8d', wait: 800 },
  { file: 'qualite-8d-d5',         path: '/qualite/8d', clicks: ['.d-step-circle[data-step="5"]'], wait: 600 },
  { file: 'expeditions',           path: '/expeditions/service' },
  { file: 'expeditions-envois',    path: '/expeditions/service', clicks: ['#exp-tab-envois'], wait: 700 },
  { file: 'expeditions-receptions', path: '/expeditions/service', clicks: ['#exp-tab-receptions'], wait: 700 },
  { file: 'expeditions-calendrier',path: '/expeditions/service', clicks: ['#exp-tab-calendrier'], wait: 900, fullPage: true },
  { file: 'expeditions-fournisseurs', path: '/expeditions/service', clicks: ['#exp-tab-fournisseurs'], eval: "var f=(window.EXPF||[])[0]; if(f) expFournSel(f.id);", wait: 900 },
  { file: 'stock-rt',              path: '/stock/service' },
  { file: 'maintenance',           path: '/maintenance/service' },
  // Plan / Bâtiment
  { file: 'plans-maquette',        path: '/plans/service', wait: 1200 },
  // RH / Compta / Direction
  { file: 'rh-employes',           path: '/rh/employes' },
  { file: 'rh-pointage',           path: '/rh/pointage', noauth: true },
  { file: 'compta',                path: '/compta/service' },
  { file: 'direction',             path: '/direction/service', wait: 1200 },
  { file: 'direction-traites',     path: '/direction/service', clicks: ['#dir-tab-1'], wait: 900 },
  // ── Couverture EXHAUSTIVE pour les manuels HTML (docs/manuel/html) — ajouts 2026-08-17 ──
  // Commercial (onglets manquants)
  { file: 'commercial-site',       path: '/commercial/service', clicks: ['#svc-tab-site'], wait: 600 },
  { file: 'commercial-affaires',   path: '/commercial/service', clicks: ['#svc-tab-affaires'], wait: 700 },
  { file: 'commercial-dashboard',  path: '/commercial/service', clicks: ['#svc-tab-dashboard'], wait: 1200, fullPage: true },
  // BE
  { file: 'be-prep',               path: '/be/service', clicks: ['#be-tab-prep'], wait: 600 },
  { file: 'be-dashboard',          path: '/be/service', clicks: ['#be-tab-dashboard'], wait: 1200, fullPage: true },
  // Achats
  { file: 'achats-scorecard',      path: '/achats/service', clicks: ['#ach-tab-scorecard'], wait: 800 },
  { file: 'achats-dashboard',      path: '/achats/service', clicks: ['#ach-tab-dashboard'], wait: 1200, fullPage: true },
  // Production (Programmation)
  { file: 'production-gantt-bst',  path: '/production/service', clicks: ['#ptab-gantt-bst'], wait: 1200 },
  { file: 'production-presence',   path: '/production/service', clicks: ['#ptab-presence'], wait: 700 },
  { file: 'production-commandes',  path: '/production/service', clicks: ['#ptab-commandes'], wait: 700 },
  { file: 'production-process',    path: '/production/service', clicks: ['#ptab-machines'], wait: 800 },
  { file: 'production-dash-prog',  path: '/production/service', clicks: ['#ptab-dash-prog'], wait: 1200, fullPage: true },
  { file: 'production-dash-prod',  path: '/production/service', clicks: ['#ptab-dash-prod'], wait: 1200, fullPage: true },
  // OAS (ids générés par tabId() — accents tronqués, ne pas « corriger »)
  { file: 'oas-eau',               path: '/oas/service', clicks: ['#oastab-relev-consommation-eau'], wait: 700 },
  { file: 'oas-bains',             path: '/oas/service', clicks: ['#oastab-relev-s-p-riodiques-bains'], wait: 700 },
  { file: 'oas-dashboard',         path: '/oas/service', clicks: ['#oastab-dashboard-oas'], wait: 1200, fullPage: true },
  // Qualité (compléments)
  { file: 'qualite-derogations',   path: '/qualite/service', clicks: ['#qual-tab-derogations'], wait: 600 },
  { file: 'qualite-capabilite',    path: '/qualite/service', clicks: ['#qual-tab-capabilite'], wait: 800 },
  { file: 'qualite-referentiels',  path: '/qualite/service', clicks: ['#qual-tab-referentiels'], wait: 600 },
  { file: 'qualite-audit-constats',path: '/qualite/service', clicks: ['#qual-tab-audit', '#audit-subbtn-constats'], wait: 600 },
  // Sécurité (compléments)
  { file: 'securite-evenements',   path: '/securite/service', clicks: ['#sec-tab-evenements'], wait: 700 },
  { file: 'securite-controles',    path: '/securite/service', clicks: ['#sec-tab-controles'], wait: 700 },
  { file: 'securite-veille',       path: '/securite/service', clicks: ['#sec-tab-veille'], wait: 700 },
  { file: 'securite-referentiels', path: '/securite/service', clicks: ['#sec-tab-referentiels'], wait: 600 },
  { file: 'securite-dashboard',    path: '/securite/service', clicks: ['#sec-tab-dashboard'], wait: 1200, fullPage: true },
  // Environnement (compléments — même préfixe sec-tab, page distincte)
  { file: 'environnement-rejets',  path: '/environnement/service', clicks: ['#sec-tab-rejets'], wait: 700 },
  { file: 'environnement-atex',    path: '/environnement/service', clicks: ['#sec-tab-atex'], wait: 700 },
  { file: 'environnement-aspects', path: '/environnement/service', clicks: ['#sec-tab-aspects'], wait: 700 },
  { file: 'environnement-icpe',    path: '/environnement/service', clicks: ['#sec-tab-icpe'], wait: 700 },
  { file: 'environnement-ges',     path: '/environnement/service', clicks: ['#sec-tab-ges'], wait: 700 },
  { file: 'environnement-veille',  path: '/environnement/service', clicks: ['#sec-tab-veille'], wait: 700 },
  { file: 'environnement-autodiag',path: '/environnement/service', clicks: ['#sec-tab-autodiag'], wait: 800, fullPage: true },
  { file: 'environnement-dashboard', path: '/environnement/service', clicks: ['#sec-tab-dashboard'], wait: 1200, fullPage: true },
  // Expéditions (dont le nouvel onglet Planning arrivées)
  { file: 'expeditions-dashboard', path: '/expeditions/service', clicks: ['#exp-tab-dashboard'], wait: 1200, fullPage: true },
  // Stock
  { file: 'stock-gestion',         path: '/stock/service', clicks: ['#stk-tab-gestion'], wait: 700 },
  { file: 'stock-mvts',            path: '/stock/service', clicks: ['#stk-tab-mvts'], wait: 700 },
  { file: 'stock-alertes',         path: '/stock/service', clicks: ['#stk-tab-alertes'], wait: 700 },
  { file: 'stock-dashboard',       path: '/stock/service', clicks: ['#stk-tab-dashboard'], wait: 1200, fullPage: true },
  // Maintenance
  { file: 'maintenance-preventif', path: '/maintenance/service', clicks: ['#mnt-tab-preventif'], wait: 700 },
  { file: 'maintenance-mtbf',      path: '/maintenance/service', clicks: ['#mnt-tab-mtbf'], wait: 800 },
  { file: 'maintenance-fiche',     path: '/maintenance/service', clicks: ['#mnt-tab-fiche'], wait: 800 },
  { file: 'maintenance-postes',    path: '/maintenance/service', clicks: ['#mnt-tab-postes'], wait: 700 },
  { file: 'maintenance-pieces',    path: '/maintenance/service', clicks: ['#mnt-tab-pieces'], wait: 700 },
  { file: 'maintenance-dashboard', path: '/maintenance/service', clicks: ['#mnt-tab-dashboard'], wait: 1200, fullPage: true },
  // RH (multi-pages)
  { file: 'rh-habilitations',      path: '/rh/habilitations', wait: 700 },
  { file: 'rh-competences',        path: '/rh/competences', wait: 800 },
  { file: 'rh-organigramme',       path: '/rh/organigramme', wait: 800 },
  { file: 'rh-temps',              path: '/rh/temps', wait: 800 },
  { file: 'rh-dashboard',          path: '/rh/service', wait: 1000 },
  // Compta (ids numériques)
  { file: 'compta-grand-livre',    path: '/compta/service', clicks: ['#cpt-tab-1'], wait: 700 },
  { file: 'compta-tva',            path: '/compta/service', clicks: ['#cpt-tab-2'], wait: 700 },
  { file: 'compta-balance',        path: '/compta/service', clicks: ['#cpt-tab-3'], wait: 800 },
  { file: 'compta-dashboard',      path: '/compta/service', clicks: ['#cpt-tab-4'], wait: 1200, fullPage: true },
  // Direction (compléments)
  { file: 'direction-jalons',      path: '/direction/service', clicks: ['#dir-tab-2'], wait: 900 },
  { file: 'direction-affaires',    path: '/direction/service', clicks: ['#dir-tab-3'], wait: 900 },
  { file: 'direction-pilotage',    path: '/direction/service', clicks: ['#dir-tab-4'], wait: 1000 },
  { file: 'direction-budget',      path: '/direction/service', clicks: ['#dir-tab-5'], wait: 900 },
  { file: 'direction-donnees',     path: '/direction/service', clicks: ['#dir-tab-6'], wait: 900 },
  // Manuels d'utilisation (accès depuis la sidebar, filtré par rôle)
  { file: 'manuels-hub',           path: '/manuels', wait: 700 },
  // Hub Tableaux de bord + les 15 dashboards filtrables
  { file: 'dash-hub',              path: '/dashboard', wait: 900 },
  { file: 'dash-direction',        path: '/dashboard/direction', wait: 1500, fullPage: true },
  { file: 'dash-commercial',       path: '/dashboard/commercial', wait: 1500, fullPage: true },
  { file: 'dash-finance',          path: '/dashboard/finance', wait: 1500, fullPage: true },
  { file: 'dash-be',               path: '/dashboard/be', wait: 1500, fullPage: true },
  { file: 'dash-achats',           path: '/dashboard/achats', wait: 1500, fullPage: true },
  { file: 'dash-fournisseurs',     path: '/dashboard/fournisseurs', wait: 1500, fullPage: true },
  { file: 'dash-production',       path: '/dashboard/production', wait: 1500, fullPage: true },
  { file: 'dash-programmation',    path: '/dashboard/programmation', wait: 1500, fullPage: true },
  { file: 'dash-qualite',          path: '/dashboard/qualite', wait: 1500, fullPage: true },
  { file: 'dash-oas',              path: '/dashboard/oas', wait: 1500, fullPage: true },
  { file: 'dash-maintenance',      path: '/dashboard/maintenance', wait: 1500, fullPage: true },
  { file: 'dash-stock',            path: '/dashboard/stock', wait: 1500, fullPage: true },
  { file: 'dash-expedition',       path: '/dashboard/expedition', wait: 1500, fullPage: true },
  { file: 'dash-rh',               path: '/dashboard/rh', wait: 1500, fullPage: true },
  { file: 'dash-environnement',    path: '/dashboard/environnement', wait: 1500, fullPage: true },
]

const args = process.argv.slice(2)
if (args.includes('--list')) { MANIFEST.forEach(m => console.log(m.file.padEnd(28), m.path, (m.clicks || []).join(' '))); process.exit(0) }
const onlyIx = args.indexOf('--only')
const only = onlyIx >= 0 ? args[onlyIx + 1] : null
const jobs = only ? MANIFEST.filter(m => m.file.startsWith(only)) : MANIFEST
if (!jobs.length) { console.error('Aucune entrée du manifeste ne correspond à --only ' + only); process.exit(1) }

const { chromium } = await import('playwright').catch(() => { console.error('Playwright manquant : npx playwright install chromium'); process.exit(1) })
mkdirSync(OUT, { recursive: true })

// Login → cookie de session
async function sessionCookie() {
  const r = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(LOGIN) })
  const sc = r.headers.get('set-cookie') || ''
  const m = /([a-zA-Z_]+)=([^;]+)/.exec(sc)
  if (!r.ok || !m) { console.error('Login KO (' + r.status + ') — Supabase en pause ? identifiants ? [' + sc.slice(0, 60) + ']'); return null }
  return { name: m[1], value: m[2], url: BASE }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
const cookie = await sessionCookie()
if (cookie) await ctx.addCookies([cookie])
else console.warn('⚠ pas de session — seules les pages noauth seront valides')

let ok = 0, ko = 0
for (const m of jobs) {
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + m.path, { waitUntil: 'networkidle', timeout: 30000 })
    for (const sel of (m.clicks || [])) {
      const el = await page.$(sel)
      if (el) { await el.click(); await page.waitForTimeout(350) }
      else console.warn('  ⚠ sélecteur absent ' + sel + ' (' + m.file + ')')
    }
    if (m.eval) { try { await page.evaluate(m.eval) } catch (e) { console.warn('  ⚠ eval KO (' + m.file + ') : ' + e.message.split('\n')[0]) } }
    await page.waitForTimeout(m.wait || 500)
    if (m.scrollTo) { const t = await page.$(m.scrollTo); if (t) { await t.scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(300) } else console.warn('  ⚠ scrollTo absent ' + m.scrollTo + ' (' + m.file + ')') }
    const dst = join(OUT, m.file + '.png')
    await page.screenshot({ path: dst, fullPage: !!m.fullPage })
    console.log('OK  ' + m.file + '.png')
    ok++
  } catch (e) {
    console.error('KO  ' + m.file + ' : ' + e.message.split('\n')[0])
    ko++
  } finally { await page.close() }
}
await browser.close()
console.log('\n== ' + ok + ' OK · ' + ko + ' KO → ' + OUT + ' ==')
process.exit(ko ? 1 : 0)
