// ══════════════════════════════════════════════════════════════
// AUDIT DES MANUELS — compare la RÉALITÉ de l'application aux manuels et au
// manifeste de captures. Détecte les dérives silencieuses :
//   · onglets décrits dans le manuel qui n'existent plus (ou manquants)
//   · entrées du manifeste visant un sélecteur disparu → captures périmées
//   · captures référencées mais absentes du dépôt
//   · captures plus anciennes que la dernière modification du code du service
//
// Usage : démarrer le serveur (npm run preview) puis
//   node scripts_doc/audit_manuels.mjs
// ══════════════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const BASE = process.env.ERP_URL || 'http://127.0.0.1:8788'
const LOGIN = { matricule: process.env.ERP_MAT || 'ADMIN', pin: process.env.ERP_PIN || '246810' }

// manuel HTML → route du service + préfixe des id d'onglet dans le DOM
const SERVICES = [
  { man: 'commercial',    route: '/commercial/service',    prefix: 'svc-tab' },
  { man: 'be',            route: '/be/service',            prefix: null },
  { man: 'achats',        route: '/achats/service',        prefix: null },
  { man: 'production',    route: '/production/service',    prefix: 'ptab' },
  { man: 'oas',           route: '/oas/service',           prefix: 'oastab' },
  { man: 'qualite',       route: '/qualite/service',       prefix: 'qual-tab' },
  { man: 'securite',      route: '/securite/service',      prefix: 'sec-tab' },
  { man: 'environnement', route: '/environnement/service', prefix: 'sec-tab' },
  { man: 'expeditions',   route: '/expeditions/service',   prefix: 'exp-tab' },
  { man: 'stock',         route: '/stock/service',         prefix: null },
  { man: 'maintenance',   route: '/maintenance/service',   prefix: 'mnt-tab' },
  { man: 'plans',         route: '/plans/service',         prefix: null },
  { man: 'rh',            route: '/rh/service',            prefix: null, mode: 'pages' },   // service MULTI-PAGES (barre de liens), pas d onglets
  { man: 'compta',        route: '/compta/service',        prefix: null },
  { man: 'direction',     route: '/direction/service',     prefix: 'dir-tab', mode: 'index' },   // ids indexes dir-tab-0..N : comparaison par NOMBRE
]

const ASSETS = 'docs/assets'
const MANDIR = 'docs/manuel/html'

// ── Onglets réels : tout bouton dont l'id ressemble à un onglet de service ──
function tabsFromHtml(html, prefix) {
  const ids = new Set()
  const re = prefix
    ? new RegExp('id="' + prefix + '-([a-z0-9-]+)"', 'g')
    : /id="(?:svc|sec|exp|qual|mnt|ptab|tab)-tab-([a-z0-9-]+)"/g
  let m
  while ((m = re.exec(html))) ids.add(m[1])
  if (!ids.size) {
    // repli : chercher un switchFn générique
    const re2 = /id="([a-z]+-tab|ptab)-([a-z0-9-]+)"/g
    while ((m = re2.exec(html))) ids.add(m[2])
  }
  return [...ids]
}

// Normalisation pour comparer un libellé d'onglet à un titre de section : les ancres
// HTML du manuel n'ont AUCUNE raison de coller aux id du DOM (slugs accentués côté app),
// alors que les libellés, eux, doivent correspondre — c'est ce que lit l'utilisateur.
function norm(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function manualSections(file) {
  if (!fs.existsSync(file)) return null
  const h = fs.readFileSync(file, 'utf8')
  const secs = [...h.matchAll(/<section class="tab" id="tab-([a-z0-9-]+)"/g)].map(m => m[1])
  // titre de chaque section (h2), dans l'ordre du document
  const titres = [...h.matchAll(/<span class="tab-num">\d+<\/span><h2>([^<]+)<\/h2>/g)]
    .map(m => norm(m[1].split('—')[0]))
  const imgs = [...h.matchAll(/src="\.\.\/\.\.\/assets\/([^"]+)"/g)].map(m => m[1])
  return { secs, titres, imgs }
}

// Libellés RÉELS des onglets, dans l'ordre du DOM (texte du bouton, icône retirée).
// ⚠ On retire d'abord les pastilles de comptage (<span>12</span>) SANS supprimer les
// chiffres du libellé lui-même : « Rapports 8D » doit rester « rapports 8d ».
function tabLabels(html, prefix) {
  if (!prefix) return []
  const re = new RegExp('id="' + prefix + '-[a-z0-9-]+"[^>]*>([\\s\\S]{0,220}?)</button>', 'g')
  const out = []
  let m
  while ((m = re.exec(html))) {
    const txt = m[1]
      .replace(/<span[^>]*>\s*\d+\s*<\/span>/g, ' ')   // pastille de comptage
      .replace(/<[^>]+>/g, ' ')
    const n = norm(txt)
    if (n) out.push(n)
  }
  return out
}

// Le manuel a le droit d'ENRICHIR le libellé (« Calendrier » → « Calendrier & journée ») ;
// il n'a pas le droit de décrire un onglet qui n'existe pas, ni d'en oublier un.
function correspond(labApp, titreMan) {
  return titreMan === labApp || titreMan.startsWith(labApp) || labApp.startsWith(titreMan) || titreMan.includes(labApp)
}

function gitLastChange(file) {
  try {
    return execSync('git log -1 --format=%cs -- "' + file + '"', { encoding: 'utf8' }).trim()
  } catch { return '' }
}

function mtime(file) {
  try { return fs.statSync(file).mtime.toISOString().slice(0, 10) } catch { return '' }
}

const rapport = []
function ligne(svc, gravite, quoi, detail) { rapport.push({ svc, gravite, quoi, detail }) }

const main = async () => {
  // login
  const r = await fetch(BASE + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(LOGIN),
  })
  const sc = r.headers.get('set-cookie') || ''
  const m = /([^=]+)=([^;]+)/.exec(sc)
  if (!m) { console.error('Login impossible — le serveur tourne-t-il sur ' + BASE + ' ?'); process.exit(1) }
  const cookie = m[1].trim() + '=' + m[2]

  // manifeste de captures
  const manifSrc = fs.readFileSync('scripts_doc/capture_screens.mjs', 'utf8')
  const entrees = [...manifSrc.matchAll(/\{\s*file:\s*'([^']+)'[^\n]*?path:\s*'([^']+)'([^\n]*)\}/g)]
    .map(x => ({ file: x[1], path: x[2], reste: x[3] }))

  for (const s of SERVICES) {
    const html = await (await fetch(BASE + s.route, { headers: { cookie } })).text()
    const reels = tabsFromHtml(html, s.prefix)
    const man = manualSections(path.join(MANDIR, s.man + '.html'))

    if (!man) { ligne(s.man, 'GRAVE', 'manuel absent', MANDIR + '/' + s.man + '.html'); continue }

    // 1) manuel vs réalité — trois architectures de navigation coexistent dans l'ERP
    if (s.mode === 'pages') {
      // service MULTI-PAGES : la nav est une barre de liens, pas des onglets
      const liens = [...new Set([...html.matchAll(new RegExp('href="(' + s.route.split('/')[1].replace(/[^a-z]/g, '') + '|/' + s.man + ')/([a-z-]+)"', 'g'))].map(x => x[2]))]
      const pages = [...new Set([...html.matchAll(/href="\/[a-z]+\/([a-z-]+)"/g)].map(x => x[1]))].filter(x => x !== 'service')
      pages.push('dashboard')   // /rh/service EST la page Dashboard du service, pas une section orpheline
      const enTrop = man.secs.filter(x => !pages.includes(x))
      const manquants = pages.filter(x => !man.secs.includes(x))
      if (enTrop.length) ligne(s.man, 'ATTENTION', 'sections du manuel sans page correspondante', enTrop.join(', ') + '  (service multi-pages)')
      if (manquants.length) ligne(s.man, 'ATTENTION', 'pages du service non documentées', manquants.join(', '))
    } else if (s.mode === 'index') {
      // ids indexés (dir-tab-0..N) : on ne peut comparer que le NOMBRE
      if (reels.length !== man.secs.length) {
        ligne(s.man, 'GRAVE', 'nombre d onglets différent du manuel',
          'application : ' + reels.length + ' · manuel : ' + man.secs.length + ' (' + man.secs.join(', ') + ')')
      }
    } else {
      if (!reels.length) { ligne(s.man, 'INFO', 'onglets non détectés', 'préfixe d id inconnu — vérifier à la main'); continue }
      // Comparaison par LIBELLÉ (ce que voit l'utilisateur), pas par id de section :
      // les ancres du manuel sont internes au document et n'ont pas à coller aux id du DOM.
      const labApp = tabLabels(html, s.prefix)
      const labMan = man.titres
      if (labApp.length && labMan.length) {
        const enTrop = labMan.filter(t => !labApp.some(a => correspond(a, t)))
        const manquants = labApp.filter(a => !labMan.some(t => correspond(a, t)))
        if (enTrop.length) ligne(s.man, 'GRAVE', 'onglets DÉCRITS mais inexistants', enTrop.join(' · '))
        if (manquants.length) ligne(s.man, 'GRAVE', 'onglets RÉELS non documentés', manquants.join(' · '))
        // ORDRE : position de chaque onglet réel dans le manuel
        if (!enTrop.length && !manquants.length) {
          const posMan = labApp.map(a => labMan.findIndex(t => correspond(a, t)))
          const trie = posMan.every((v, i) => i === 0 || posMan[i - 1] < v)
          if (!trie) {
            ligne(s.man, 'GRAVE', 'ORDRE des onglets différent du manuel',
              'application : ' + labApp.join(' > ') + '\n      → manuel      : ' + labMan.join(' > '))
          }
        }
      } else {
        const enTrop = man.secs.filter(x => !reels.includes(x))
        const manquants = reels.filter(x => !man.secs.includes(x))
        if (enTrop.length || manquants.length) {
          ligne(s.man, 'INFO', 'comparaison par id seulement (libellés non extraits)',
            'décrits en trop : ' + (enTrop.join(', ') || '—') + ' · réels non documentés : ' + (manquants.join(', ') || '—'))
        }
      }
    }

    // 2) captures référencées mais absentes
    for (const img of man.imgs) {
      if (!fs.existsSync(path.join(ASSETS, img))) ligne(s.man, 'GRAVE', 'capture référencée ABSENTE', img)
    }

    // 3) manifeste : sélecteurs disparus
    const mine = entrees.filter(e => e.path === s.route)
    for (const e of mine) {
      const sels = [...e.reste.matchAll(/#([a-z0-9-]+)/g)].map(x => x[1])
      const morts = sels.filter(sel => !html.includes('id="' + sel + '"'))
      if (morts.length) ligne(s.man, 'GRAVE', 'manifeste vise un sélecteur DISPARU', e.file + ' → #' + morts.join(', #'))
    }

    // 4) fraîcheur des captures vs dernier changement du code du service
    const srcCandidats = ['src/' + s.man + '.tsx', 'src/' + s.man + '_service.tsx', 'src/prod.tsx']
    const src = srcCandidats.find(f => fs.existsSync(f))
    const dCode = src ? gitLastChange(src) : ''
    const vieilles = man.imgs
      .filter(i => fs.existsSync(path.join(ASSETS, i)))
      .map(i => ({ i, d: mtime(path.join(ASSETS, i)) }))
      .filter(x => dCode && x.d && x.d < dCode)
    if (vieilles.length) {
      ligne(s.man, 'ATTENTION', 'captures ANTÉRIEURES au dernier code (' + dCode + ')',
        vieilles.map(x => x.i + ' [' + x.d + ']').join(', '))
    }
  }

  // ── rendu ──
  const par = { GRAVE: [], ATTENTION: [], INFO: [] }
  rapport.forEach(x => par[x.gravite].push(x))
  for (const g of ['GRAVE', 'ATTENTION', 'INFO']) {
    if (!par[g].length) continue
    console.log('\n══ ' + g + ' (' + par[g].length + ') ══')
    for (const x of par[g]) console.log('  [' + x.svc.padEnd(14) + '] ' + x.quoi + '\n      → ' + x.detail)
  }
  console.log('\n== ' + par.GRAVE.length + ' grave(s) · ' + par.ATTENTION.length + ' attention · ' + par.INFO.length + ' info ==')
}

main()
