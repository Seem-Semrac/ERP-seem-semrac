// ══════════════════════════════════════════════════════════════
// CAPTURE DES FORMULAIRES OUVERTS (modales) pour le parcours guidé.
// Prérequis : `npm run build` puis serveur local :
//   npx wrangler pages dev dist --port 8788
// et Playwright : npx playwright install chromium (1re fois).
// Le script se connecte tout seul (ADMIN/PIN, comme capture_screens.mjs) ;
// il fonctionne donc AUSSI avec AUTH_ENFORCE=on.
// Usage :
//   node scripts_doc/capture_forms.mjs
//   node scripts_doc/capture_forms.mjs --only expeditions
//   node scripts_doc/capture_forms.mjs --list
// ⚠ Sous Git-Bash Windows, utiliser ERP_URL=http://127.0.0.1:8788 (pas « localhost »).
// Sortie : docs/assets/form-<service>-<nom>.png
// ══════════════════════════════════════════════════════════════
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.ERP_URL || 'http://localhost:8788'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets')
const VP = { width: 1500, height: 950 }
const LOGIN = { matricule: process.env.ERP_MAT || 'ADMIN', pin: process.env.ERP_PIN || '246810' }

// Entrée du manifeste :
//   file     = nom du PNG (sans extension)   · path = route de la page
//   fn       = expression JS qui ouvre la modale   OU   click = texte du bouton
//   tabClick = sélecteur d'onglet à cliquer AVANT d'ouvrir la modale (optionnel)
//   wait     = ms d'attente après ouverture (défaut 650)
const M = [
  // Commercial
  { file: 'form-commercial-dt',        path: '/commercial/service', tabClick: '#svc-tab-dt',     click: 'Créer la DT',    inline: true, wait: 900 },
  { file: 'form-commercial-avoir',     path: '/commercial/service', tabClick: '#svc-tab-avoirs', click: "Émettre l'avoir", inline: true, wait: 900 },
  // Bureau d'études
  { file: 'form-be-nomenclature',      path: '/be/service', fn: "nomNewStandard()", inline: true, wait: 900 },
  // Achats
  { file: 'form-achats-bc',            path: '/achats/service', fn: "achNewBC()" },
  // Fenetre « Traiter la DA -> BC » : celle qui porte la reference du materiel. Necessite une DA a traiter.
  { file: 'form-achats-da-bc',         path: '/achats/service', fn: "achOpenBC((ACH_DA[0]||{}).id)", wait: 900 },
  // Production
  { file: 'form-production-bdt',       path: '/production/planning', fn: "openBdtModal()", wait: 900 },
  { file: 'form-production-st',        path: '/production/service', fn: "openSTModal()" },
  // OAS
  { file: 'form-oas-eau',             path: '/oas/service', fn: "openNewEau()" },
  { file: 'form-oas-bain',            path: '/oas/service', fn: "openNewBain()" },
  { file: 'form-oas-balancelle',      path: '/oas/service', fn: "openNewBal()" },
  // Qualité — les modales vivent DANS le panneau de leur onglet : sans tabClick le panneau
  //   est en display:none et la modale n'est jamais visible (capture inutilisable).
  { file: 'form-qualite-nc',          path: '/qualite/service', tabClick: '#qual-tab-nc',            fn: "qualOpenModal('nc')" },
  { file: 'form-qualite-pv',          path: '/qualite/service', tabClick: '#qual-tab-pv',            fn: "qualOpenModal('pv')", wait: 900 },
  { file: 'form-qualite-derogation',  path: '/qualite/service', tabClick: '#qual-tab-derogations',   fn: "derogOpen('')" },
  { file: 'form-qualite-ecme',        path: '/qualite/service', tabClick: '#qual-tab-ecme',          fn: "ecmeOpen('')" },
  { file: 'form-qualite-perissable',  path: '/qualite/service', tabClick: '#qual-tab-perissables',   fn: "perOpen('')" },
  { file: 'form-qualite-capabilite',  path: '/qualite/service', tabClick: '#qual-tab-capabilite',    fn: "ccOpenModal()" },
  { file: 'form-qualite-plan-controle', path: '/qualite/service', tabClick: '#qual-tab-plan-controle', fn: "pcOpen('')" },
  // Sécurité (secOpen par entité)
  { file: 'form-securite-risque',     path: '/securite/service', tabClick: '#sec-tab-duer', fn: "secOpen('risques')", wait: 900 },
  { file: 'form-securite-incident',   path: '/securite/service', fn: "secOpen('incidents')" },
  { file: 'form-securite-chimie',     path: '/securite/service', fn: "secOpen('chimiques')" },
  // ⚠ PAS de capture ATEX depuis Sécurité : le panneau `pAtex` de src/securite.tsx n'est JAMAIS rendu
  //   (aucun onglet ne l'ouvre) — la modale existe encore mais est inaccessible aux utilisateurs.
  //   Les zones ATEX se déclarent dans le service ENVIRONNEMENT → voir `form-environnement-atex`.
  { file: 'form-securite-vgp',        path: '/securite/service', fn: "secOpen('verifications')" },
  { file: 'form-securite-epi',        path: '/securite/service', fn: "secOpen('epi-dotations')" },
  // Expéditions
  { file: 'form-expeditions-bl',      path: '/expeditions/service', fn: "expOpenModal('bl')" },
  { file: 'form-expeditions-bst',     path: '/expeditions/service', fn: "expOpenModal('bst')" },
  // Stock
  { file: 'form-stock-article',       path: '/stock/service', fn: "stkOpenModal('article')" },
  { file: 'form-stock-da',            path: '/stock/service', fn: "stkOpenModal('da')" },
  // Maintenance : voir plus bas (mntOpenOM) — il n'existe PAS de bouton « Nouvel OM ».
  // RH
  { file: 'form-rh-conge',            path: '/rh/pointage', fn: "cgOpenModal()" },   // la demande de congé se fait depuis la borne (pas /rh/temps)
  { file: 'form-rh-employe',          path: '/rh/employes', click: 'Nouvel employé' },
  // Compta
  { file: 'form-compta-fournisseur',  path: '/compta/service', tabClick: '#cpt-tab-0', fn: "cptFactSection(1); cptOpenFournModal()", wait: 900 },
  // Plan / Bâtiment
  { file: 'form-plans-editeur',       path: '/plans/service', fn: "planToggleEdit && planToggleEdit()", inline: true, wait: 1100 },

  // ══ Ajouts 2026-08-17 — modales manquantes repérées à la rédaction des manuels HTML ══
  // Rappel : si la modale vit DANS un panneau d'onglet (display:none), tabClick est OBLIGATOIRE.
  // Commercial
  { file: 'form-commercial-client',   path: '/commercial/service', tabClick: '#svc-tab-clients', fn: "openClientsModal()" },
  // Achats (overlays hors panneaux : tabClick seulement pour un arrière-plan cohérent)
  { file: 'form-achats-rfq',          path: '/achats/service', tabClick: '#ach-tab-rfq',   fn: "rfqNew('')" },
  { file: 'form-achats-rfq-reponses', path: '/achats/service', tabClick: '#ach-tab-rfq',   fn: "document.querySelector('#ach-panel-rfq button[onclick^=\"rfqOpen(\"]').click()", wait: 1400 },  // nécessite une RFQ en base
  { file: 'form-achats-fournisseur',  path: '/achats/service', tabClick: '#ach-tab-fourn', fn: "achRefSwitch('fournisseurs'); achRefAdd();" },
  { file: 'form-achats-st',           path: '/achats/service', tabClick: '#ach-tab-fourn', fn: "achRefSwitch('soustraitants'); achRefAdd();" },
  // Production — #splitModal est imbriquée dans le panneau Dashboard Production.
  //   Si aucun BDT planifié n'existe en base, on injecte un exemple DANS LE NAVIGATEUR (variable JS
  //   locale à la page) pour illustrer le formulaire : AUCUNE écriture en base de données.
  { file: 'form-production-separer',  path: '/production/service', tabClick: '#ptab-dash-prod', wait: 900,
    fn: "(function(){var b=(typeof BDTS!=='undefined'&&BDTS)?BDTS.filter(function(x){return Number(x.duree||x.tempsAlloue||0)>0;})[0]:null;"
      + "if(!b&&typeof BDTS!=='undefined'){b={id:'BDT-2026-0001-01-01',num_bdt:'BDT-2026-0001-01-01',piece:'Bride alu 7075',operation:'Usinage CN',duree:12,tempsAlloue:12,qte:40,statut:'programme',lot_ref:'LOT-2026-0001-01'};BDTS.push(b);}"
      + "if(b) splitBdt(b.id);})()" },
  // OAS — clôture avec autocontrôle (≠ création de balancelle)
  { file: 'form-oas-cloture-balancelle', path: '/oas/service', fn: "openCloreBalModal('BAL-DEMO','OAS-2026-1042','LOT-2026-014','Bride alu 7075')", wait: 800 },
  // Expéditions (dépendent des tableaux globaux EXP_PLAN / EXP_BC)
  { file: 'form-expeditions-arrivee', path: '/expeditions/service', tabClick: '#exp-tab-receptions', fn: "expOpenArrivee(EXP_PLAN[0].id)", wait: 800 },
  { file: 'form-expeditions-reception', path: '/expeditions/service', fn: "expOpenReception(EXP_BC[0].id)", wait: 800 },
  { file: 'form-expeditions-pv',      path: '/expeditions/service', fn: "expOpenPV(EXP_BC[0].id)", wait: 800 },
  // Environnement — ⚠ les noms d'ENTITÉ diffèrent des ids d'onglet
  { file: 'form-environnement-dechets', path: '/environnement/service', tabClick: '#sec-tab-dechets', fn: "secOpen('dechets')" },
  { file: 'form-environnement-mesures', path: '/environnement/service', tabClick: '#sec-tab-rejets',  fn: "secOpen('mesures-env')" },
  { file: 'form-environnement-atex',    path: '/environnement/service', tabClick: '#sec-tab-atex',    fn: "secOpen('atex')" },
  { file: 'form-environnement-aspects', path: '/environnement/service', tabClick: '#sec-tab-aspects', fn: "secOpen('aspects-impacts')" },
  // Maintenance — création (formulaire complet) puis édition d'un OM existant
  { file: 'form-maintenance-nouvel-om', path: '/maintenance/service', fn: "mntNewOM()", wait: 700 },
  { file: 'form-maintenance-om',      path: '/maintenance/service', fn: "mntOpenOM(MNT_OMS[0].id)", wait: 800 },
  // RH
  { file: 'form-rh-pointage',         path: '/rh/pointage', fn: "ptShowModal('arrivee','Arrivée')" },
  { file: 'form-rh-correction',       path: '/rh/temps',    fn: "rhOuvrirModif('P-DEMO','Dupont Jean','08:00','17:00')" },
  // Direction
  { file: 'form-direction-refus',     path: '/direction/service', fn: "decideValidation('demo','refuse')" },
  { file: 'form-direction-jalon-traite', path: '/direction/service', tabClick: '#dir-tab-2', fn: "document.querySelector('.jt-btn').click()", wait: 800 },
  { file: 'form-direction-source',    path: '/direction/service', fn: "document.querySelector('.src-eye').click()", wait: 1600, noFields: true },  // fenêtre de consultation : aucun champ de saisie
]

const args = process.argv.slice(2)
if (args.includes('--list')) { M.forEach(m => console.log(m.file.padEnd(32), m.path, m.fn || ('clic: ' + m.click))); process.exit(0) }
const FORCE = args.includes('--force')   // écrire le PNG même si aucune modale n'est détectée
const oi = args.indexOf('--only'); const only = oi >= 0 ? args[oi + 1] : null
const jobs = only ? M.filter(m => m.file.includes(only)) : M
if (!jobs.length) { console.error('Aucune entrée ne correspond à --only ' + only); process.exit(1) }

const { chromium } = await import('playwright')
mkdirSync(OUT, { recursive: true })

// Login → cookie de session (identique à capture_screens.mjs : marche avec AUTH_ENFORCE=on)
async function sessionCookie() {
  try {
    const r = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(LOGIN) })
    const sc = r.headers.get('set-cookie') || ''
    const mm = /([a-zA-Z_]+)=([^;]+)/.exec(sc)
    if (!r.ok || !mm) { console.warn('⚠ login KO (' + r.status + ') — on continue (utile si AUTH_ENFORCE=off)'); return null }
    return { name: mm[1], value: mm[2], url: BASE }
  } catch { console.warn('⚠ login injoignable — on continue'); return null }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1 })
const cookie = await sessionCookie()
if (cookie) await ctx.addCookies([cookie])

let ok = 0, noModal = 0, ko = 0
const echecs = []
for (const m of jobs) {
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + m.path, { waitUntil: 'networkidle', timeout: 30000 })
    // Les pages lourdes portent plusieurs blocs <script> : declencher `fn` avant qu'ils
    // soient tous parses donnait des KO « fn/click sans effet » purement aleatoires.
    // On attend donc que le DOM soit complet ET, si `fn` appelle une fonction nommee,
    // que cette fonction existe reellement.
    await page.waitForLoadState('load').catch(() => {})
    const nomFn = m.fn && /^\s*([A-Za-z_$][\w$]*)\s*\(/.exec(m.fn)
    if (nomFn) {
      await page.waitForFunction((n) => typeof window[n] === 'function', nomFn[1], { timeout: 8000 })
        .catch(() => console.warn('  ⚠ ' + nomFn[1] + ' toujours absente apres 8 s (' + m.file + ')'))
    }
    await page.waitForTimeout(700)
    // Onglet à ouvrir avant de déclencher la modale (certaines modales vivent dans un panneau masqué)
    if (m.tabClick) {
      const t = await page.$(m.tabClick)
      if (t) { await t.click().catch(() => {}); await page.waitForTimeout(500) }
      else console.warn('  ⚠ onglet absent ' + m.tabClick + ' (' + m.file + ')')
    }
    let acted = false
    if (m.fn) acted = await page.evaluate((e) => { try { /* eslint-disable no-eval */ eval(e); return true } catch (_) { return false } }, m.fn)
    else if (m.click) {
      const el = page.getByText(m.click, { exact: false }).first()
      if (await el.count()) { await el.click().catch(() => {}); acted = true }
    }
    await page.waitForTimeout(m.wait || 650)
    // Détecte une modale fixe visible. Par défaut elle doit contenir un champ de saisie ;
    //   `noFields:true` pour les fenêtres de CONSULTATION (ex. « voir la pièce source ») qui n'en ont pas.
    const modalVisible = await page.evaluate((o) => {
      const ds = [...document.querySelectorAll('div,form,section')]
      // `inline:true` → le formulaire n'est PAS une modale flottante mais un bloc de la page
      // (ex. « Créer la DT », « Émettre l'avoir », nouvelle nomenclature) : on exige alors
      // simplement un conteneur VISIBLE portant plusieurs champs de saisie.
      if (o.inline) {
        return ds.some(d => {
          const s = getComputedStyle(d)
          if (s.display === 'none' || s.visibility === 'hidden') return false
          const r = d.getBoundingClientRect()
          if (r.width < 300 || r.height < 150) return false
          return d.querySelectorAll('input,select,textarea').length >= 3
        })
      }
      return ds.some(d => {
        const s = getComputedStyle(d)
        if (s.position !== 'fixed' || s.display === 'none' || s.visibility === 'hidden') return false
        const r = d.getBoundingClientRect()
        if (r.width < 300 || r.height < 120) return false
        return o.noFields ? (d.innerText || '').trim().length > 30 : !!d.querySelector('input,select,textarea')
      })
    }, { noFields: !!m.noFields, inline: !!m.inline })
    // ⚠ On n'ÉCRIT le PNG que si la modale est réellement ouverte : sinon on écraserait
    //   une bonne capture existante par un écran sans formulaire (--force pour passer outre).
    if (acted && (modalVisible || FORCE)) {
      await page.screenshot({ path: join(OUT, m.file + '.png'), fullPage: false })
      if (modalVisible) { console.log('OK   ' + m.file + '.png'); ok++ }
      else { console.log('~!   ' + m.file + '.png  (écrit via --force, SANS modale détectée)'); noModal++; echecs.push(m.file + ' (forcé sans modale)') }
    } else if (!acted) { console.log('KO   ' + m.file + '  (ouverture non déclenchée — PNG conservé)'); ko++; echecs.push(m.file + ' (fn/click sans effet)') }
    else { console.log('~?   ' + m.file + '  (aucune modale visible — PNG conservé)'); noModal++; echecs.push(m.file + ' (aucune modale visible)') }
  } catch (e) { console.log('KO   ' + m.file + ' : ' + e.message.split('\n')[0]); ko++; echecs.push(m.file + ' (erreur)') }
  finally { await page.close() }
}
await browser.close()
console.log('\n== ' + ok + ' OK · ' + noModal + ' sans modale · ' + ko + ' KO → ' + OUT + ' ==')
if (echecs.length) console.log('À revoir : ' + echecs.join(' · '))
