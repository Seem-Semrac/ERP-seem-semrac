// ══════════════════════════════════════════════════════════════
// MANUELS UTILISATEUR — lecture dans l'ERP, filtrée par rôle.
//
// Le TEXTE des manuels est embarqué dans le worker (import `?raw`) : il passe donc
// par le middleware d'authentification et peut être filtré par rôle, contrairement à
// un fichier déposé dans /static (exclu du worker par dist/_routes.json).
// Les IMAGES, elles, sont servies en statique depuis /static/manuel/ (copiées au build
// par scripts_doc/sync_manuel_assets.mjs) — trop volumineuses pour le bundle (~35 Mo).
//
// Source de vérité du contenu : docs/manuel/html/*.html (mêmes fichiers imprimables).
// ══════════════════════════════════════════════════════════════
import { layout, escX } from './shared'
// Contenu des manuels : module GÉNÉRÉ (scripts_doc/gen_manuels_module.mjs).
// Les imports Vite `?raw` ne fonctionnaient pas sous Node/tsx (conteneur Docker) ni
// sous esbuild (harnais) : l'app refusait de démarrer. Un module TS marche partout.
import { MANUELS_HTML, MANUEL_CSS } from './manuels_contenu'


export type ManuelDef = {
  slug: string
  titre: string
  service: string | null      // service RBAC requis en LECTURE ; null = ouvert à tout compte connecté
  icone: string
  couleur: string
  resume: string
  html: string
}

// L'ordre suit le flux de l'entreprise (comme le sommaire des manuels).
export const MANUELS: ManuelDef[] = [
  { slug: 'commercial',    titre: 'Commercial',        service: 'commercial',    icone: 'fa-briefcase',        couleur: '#3b82f6', resume: "Demandes du site, DT, offres, avoirs, clients, commandes, affaires.", html: MANUELS_HTML['commercial'] || '' },
  { slug: 'be',            titre: "Bureau d'Études",   service: 'be',            icone: 'fa-drafting-compass', couleur: '#8b5cf6', resume: "Nomenclatures, analyse des DT, préparations techniques, références.", html: MANUELS_HTML['be'] || '' },
  { slug: 'achats',        titre: 'Achats',            service: 'achats',        icone: 'fa-cart-shopping',    couleur: '#0ea5e9', resume: "Demandes de prix, demandes d'achat, fournisseurs et sous-traitants.", html: MANUELS_HTML['achats'] || '' },
  { slug: 'production',    titre: 'Production',        service: 'production',    icone: 'fa-gears',            couleur: '#22c55e', resume: "Plannings BDT et sous-traitance, présence, lots, process ateliers.", html: MANUELS_HTML['production'] || '' },
  { slug: 'oas',           titre: 'OAS',               service: 'oas',           icone: 'fa-flask',            couleur: '#14b8a6', resume: "Lots et balancelles, relevés d'eau et de bains, traitement de surface.", html: MANUELS_HTML['oas'] || '' },
  { slug: 'qualite',       titre: 'Qualité',           service: 'qualite',       icone: 'fa-clipboard-check',  couleur: '#ef4444', resume: "PV, non-conformités, 8D, dérogations, libération, ECME, audits.", html: MANUELS_HTML['qualite'] || '' },
  { slug: 'expeditions',   titre: 'Expéditions',       service: 'expeditions',   icone: 'fa-truck-fast',       couleur: '#f59e0b', resume: "Bons de commande, planning des arrivées, bons de livraison, réceptions.", html: MANUELS_HTML['expeditions'] || '' },
  { slug: 'stock',         titre: 'Stocks',            service: 'stock',         icone: 'fa-boxes-stacked',    couleur: '#84cc16', resume: "Stock en temps réel, mouvements, alertes et réapprovisionnement.", html: MANUELS_HTML['stock'] || '' },
  { slug: 'compta',        titre: 'Comptabilité',      service: 'compta',        icone: 'fa-file-invoice',     couleur: '#6366f1', resume: "Facturation, règlements, grand livre, TVA, balance et trésorerie.", html: MANUELS_HTML['compta'] || '' },
  { slug: 'securite',      titre: 'Sécurité',          service: 'securite',      icone: 'fa-helmet-safety',    couleur: '#dc2626', resume: "DUER, événements, EPI, produits chimiques, contrôles, audit ISO 45001.", html: MANUELS_HTML['securite'] || '' },
  { slug: 'environnement', titre: 'Environnement',     service: 'environnement', icone: 'fa-leaf',             couleur: '#16a34a', resume: "Déchets, rejets, ATEX, aspects et impacts, ICPE, bilan GES.", html: MANUELS_HTML['environnement'] || '' },
  { slug: 'maintenance',   titre: 'Maintenance',       service: 'maintenance',   icone: 'fa-screwdriver-wrench', couleur: '#f97316', resume: "Interventions, plan préventif, MTBF, fiche 360, pièces de rechange.", html: MANUELS_HTML['maintenance'] || '' },
  { slug: 'rh',            titre: 'RH',                service: 'rh',            icone: 'fa-users',            couleur: '#ec4899', resume: "Employés, habilitations, compétences, temps de travail, pointage.", html: MANUELS_HTML['rh'] || '' },
  { slug: 'plans',         titre: 'Plan / Bâtiment',   service: 'plans',         icone: 'fa-map',              couleur: '#64748b', resume: "Maquette du bâtiment, repères et zones.", html: MANUELS_HTML['plans'] || '' },
  { slug: 'direction',     titre: 'Direction',         service: 'direction',     icone: 'fa-chess-king',       couleur: '#5C5391', resume: "Validations, jalons critiques, pilotage par affaire, budget.", html: MANUELS_HTML['direction'] || '' },
  { slug: 'dashboard',     titre: 'Tableaux de bord',  service: null,            icone: 'fa-gauge-high',       couleur: '#22409B', resume: "Filtres communs et les 15 tableaux de bord (chacun selon vos accès).", html: MANUELS_HTML['dashboard'] || '' },
]

// Manuels lisibles par l'utilisateur : ceux des services qu'il peut consulter.
//   `services` = navServices(user) (la Direction, perm 'all', les a tous).
export function manuelsFor(services: string[]): ManuelDef[] {
  const set = new Set(services)
  return MANUELS.filter(m => m.service === null || set.has(m.service))
}
export function manuelBySlug(slug: string): ManuelDef | undefined {
  return MANUELS.find(m => m.slug === slug)
}

// Réécrit les liens du fichier d'origine (pensé pour une lecture hors ligne) vers les
// routes de l'ERP : images → /static/manuel/, liens entre manuels → /manuels/<slug>.
function adapterLiens(html: string): string {
  return html
    .replace(/\.\.\/\.\.\/assets\//g, '/static/manuel/')
    .replace(/href="index\.html"/g, 'href="/manuels"')
    .replace(/href="([a-z0-9_-]+)\.html"/g, 'href="/manuels/$1"')
}

// Page d'un manuel : le contenu d'origine, servi dans la coque de l'ERP (sidebar + barre de retour).
export function pageManuel(m: ManuelDef, autorises: ManuelDef[]): string {
  const inner = adapterLiens(m.html)
  const body = inner.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '')
  const autres = autorises.filter(x => x.slug !== m.slug)
  const contenu = `
  <div style="font-family:Inter,system-ui,sans-serif;">
    <div style="position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid #e2e8f0;padding:11px 22px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:0 1px 3px rgba(0,0,0,.05);">
      <a href="/manuels" style="display:inline-flex;align-items:center;gap:7px;background:#f1f5f9;color:#334155;border-radius:9px;padding:7px 14px;font-size:.8rem;font-weight:700;text-decoration:none;"><i class="fas fa-arrow-left"></i>Tous les manuels</a>
      <span style="font-weight:800;color:#111827;font-size:.92rem;display:inline-flex;align-items:center;gap:8px;"><i class="fas ${m.icone}" style="color:${m.couleur};"></i>${escX(m.titre)}</span>
      ${autres.length ? `<select onchange="if(this.value)location.href=this.value;" style="margin-left:auto;border:1.5px solid #e2e8f0;border-radius:9px;padding:7px 11px;font-size:.79rem;color:#334155;background:#f8fafc;max-width:230px;">
        <option value="">Aller à un autre manuel…</option>
        ${autres.map(x => `<option value="/manuels/${x.slug}">${escX(x.titre)}</option>`).join('')}
      </select>` : ''}
      <button onclick="window.print()" style="border:none;background:linear-gradient(135deg,#22409B,#5C5391);color:#fff;border-radius:9px;padding:8px 15px;font-size:.79rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-print"></i>Imprimer</button>
    </div>
    <div class="manuel-embed">${body}</div>
  </div>
  <style>
  ${MANUEL_CSS.replace(/^[\s\S]*?\*\//, '')}
  /* Intégration dans la coque de l'ERP : le manuel ne pilote ni le fond ni la largeur de page. */
  .manuel-embed{background:var(--bg);}
  .manuel-embed .wrap{max-width:1020px;margin:0 auto;}
  @media print{
    aside, .manuel-embed ~ *, div[style*="position:sticky"]{display:none!important;}
    .manuel-embed{background:#fff;}
  }
  </style>`
  return layout('Manuel — ' + m.titre, contenu, 'manuels')
}

// Hub : la liste des manuels que l'utilisateur a le droit de lire.
export function pageManuelsHub(autorises: ManuelDef[], tousLesManuels: boolean, nomUtilisateur: string): string {
  const cartes = autorises.map(m => `
    <a href="/manuels/${m.slug}" style="display:block;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:17px 19px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(0,0,0,.06);border-top:3px solid ${m.couleur};transition:transform .12s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
      <div style="display:flex;align-items:center;gap:9px;font-weight:800;color:#111827;font-size:.95rem;"><i class="fas ${m.icone}" style="color:${m.couleur};"></i>${escX(m.titre)}</div>
      <div style="font-size:.79rem;color:#64748b;margin-top:6px;line-height:1.45;">${escX(m.resume)}</div>
      <div style="font-size:.71rem;color:${m.couleur};font-weight:700;margin-top:9px;">Ouvrir le manuel <i class="fas fa-arrow-right" style="font-size:.65rem;"></i></div>
    </a>`).join('')

  const contenu = `
  <div style="font-family:Inter,system-ui,sans-serif;">
    <div style="background:linear-gradient(135deg,#22409B,#5C5391);padding:26px 30px;color:#fff;">
      <div style="font-size:1.5rem;font-weight:900;display:flex;align-items:center;gap:11px;"><i class="fas fa-book-open"></i>Manuels d'utilisation</div>
      <div style="opacity:.9;font-size:.87rem;margin-top:7px;max-width:70ch;">Le mode d'emploi de l'ERP, service par service : chaque onglet expliqué pas à pas, avec des captures d'écran de l'application.</div>
    </div>
    <div style="padding:22px 30px;">
      <div style="background:${tousLesManuels ? '#eef2fb' : '#f8fafc'};border:1px solid ${tousLesManuels ? '#c7d2fe' : '#e2e8f0'};border-radius:11px;padding:11px 16px;margin-bottom:20px;font-size:.81rem;color:#334155;display:flex;align-items:center;gap:9px;flex-wrap:wrap;">
        <i class="fas ${tousLesManuels ? 'fa-key' : 'fa-user-shield'}" style="color:#22409B;"></i>
        ${tousLesManuels
          ? `<span><strong>Accès complet</strong> — vous consultez les <strong>${autorises.length} manuels</strong> de l'ERP.</span>`
          : `<span>Vous voyez ici les <strong>${autorises.length} manuel(s)</strong> correspondant à vos accès${nomUtilisateur ? ' (' + escX(nomUtilisateur) + ')' : ''}. Les autres services sont masqués : demandez à la Direction si vous avez besoin d'un accès supplémentaire.</span>`}
      </div>
      ${autorises.length
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:15px;">${cartes}</div>`
        : `<div style="text-align:center;padding:44px;color:#94a3b8;font-size:.86rem;background:#f8fafc;border-radius:12px;">Aucun manuel n'est accessible avec vos droits actuels. Contactez la Direction.</div>`}
      <div style="margin-top:22px;font-size:.74rem;color:#94a3b8;line-height:1.6;">
        Chaque manuel s'imprime tel quel (bouton <strong>Imprimer</strong> en haut de page). En cas d'écart entre le manuel et l'application, c'est l'application qui fait foi — signalez l'écart pour mise à jour.
      </div>
    </div>
  </div>`
  return layout("Manuels d'utilisation", contenu, 'manuels')
}
