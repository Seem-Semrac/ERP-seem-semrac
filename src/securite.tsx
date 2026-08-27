// ══════════════════════════════════════════════════════════════
// SERVICE SÉCURITÉ (HSE) — ERP Seem Semrac
// Santé-Sécurité au Travail : DUER, accidents, EPI, chimie/FDS, VGP…
// L'ENVIRONNEMENT (déchets, rejets, ATEX, ISO 14001, RSE) a migré vers
// le service Environnement (src/environnement.tsx) — CRUD partagé /api/securite/*.
// Patron : serviceHeader + onglets + tables génériques + modale.
// ══════════════════════════════════════════════════════════════
import { layout, serviceHeader, demandeAchatModal, buildValDirMap, valDirBadge } from './shared'
import { clpRow, clpDefs, CLP_ORDER, CLP_LABEL, CLP_VB } from './clp'
import { brandBlockHTML, BRAND } from './brand'
import { panelAudit, auditProgDomaine } from './qualite'
import { referentielsPanel, DUER_FAMILLES, ZONES_ATELIER, UT_CANONIQUES, SECTEURS_ATELIER, EPI_ATELIER, CONSIGNES_SECURITE, computeRisqueChimique, SEIRICH_NIVEAUX, computeExpositionSante, computeExpositionIncendie, computeExpositionEnv, normQuantiteChimique, EXPO_PROCEDE_LBL, EXPO_FREQ_LBL, EXPO_PROT_LBL } from './qref'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const ORANGE = '#ea580c'
const DARK = '#431407'
const TH = 'padding:9px 12px;text-align:left;font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:800;'
const TD = 'padding:8px 12px;font-size:.78rem;color:#475569;'

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const d10 = (s: any) => (s ? String(s).slice(0, 10) : '—')
const TODAY = () => new Date().toISOString().slice(0, 10)

// ─── badges ───────────────────────────────────────────────────
const pill = (txt: string, bg: string, fg: string) => `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:.66rem;font-weight:700;background:${bg};color:${fg};white-space:nowrap;">${esc(txt)}</span>`
function critBadge(n: any) {
  const v = Number(n) || 0
  if (!v) return '—'
  if (v <= 4) return pill(String(v), '#dcfce7', '#15803d')
  if (v <= 8) return pill(String(v), '#fef9c3', '#a16207')
  if (v <= 11) return pill(String(v), '#ffedd5', '#c2410c')
  return pill(String(v), '#fee2e2', '#b91c1c')
}
function prioBadge(n: any) {
  const v = Number(n) || 0
  if (v === 1) return pill('P1', '#fee2e2', '#b91c1c')
  if (v === 2) return pill('P2', '#ffedd5', '#c2410c')
  if (v === 3) return pill('P3', '#dcfce7', '#15803d')
  return '—'
}
const STATUT_COL: Record<string, [string, string]> = {
  conforme: ['#dcfce7', '#15803d'], a_jour: ['#dcfce7', '#15803d'], maitrise: ['#dcfce7', '#15803d'], clos: ['#e2e8f0', '#475569'],
  partiel: ['#fef9c3', '#a16207'], en_cours: ['#fef9c3', '#a16207'], enquete: ['#fef9c3', '#a16207'], a_prevoir: ['#fef9c3', '#a16207'], a_renouveler: ['#fef9c3', '#a16207'], bientot: ['#fef9c3', '#a16207'],
  non_conforme: ['#fee2e2', '#b91c1c'], en_retard: ['#fee2e2', '#b91c1c'], a_traiter: ['#fee2e2', '#b91c1c'], nouveau: ['#dbeafe', '#1d4ed8'], a_verifier: ['#dbeafe', '#1d4ed8'], actions: ['#ffedd5', '#c2410c'],
}
function statutBadge(s: any) {
  if (s == null || s === '') return '—'
  const k = String(s)
  const c = STATUT_COL[k] || ['#f1f5f9', '#475569']
  return pill(k.replace(/_/g, ' '), c[0], c[1])
}
function dateEcheance(d: any) {
  if (!d) return '—'
  const day = String(d).slice(0, 10)
  const t = TODAY()
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  if (day < t) return pill(day, '#fee2e2', '#b91c1c')
  if (day <= soon) return pill(day, '#fef9c3', '#a16207')
  return day
}
const boolBadge = (b: any) => (b === true ? pill('oui', '#dcfce7', '#15803d') : b === false ? pill('non', '#f1f5f9', '#64748b') : '—')

type Col = { key: string; label: string; right?: boolean; fmt?: (v: any, r: any) => string }

// Décisions Direction indexées par (ref_table=entity, ref_id). Posé au tout début de
// pageServiceSecurite (rendu SYNCHRONE, sans await) → sûr le temps d'un rendu de page.
let SEC_VD_MAP: Record<string, any> = {}

function dataTable(entity: string, rows: any[], cols: Col[]): string {
  const head = cols.map(c => `<th style="${TH}${c.right ? 'text-align:right;' : ''}">${c.label}</th>`).join('') + `<th style="${TH}text-align:right;">Actions</th>`
  const body = rows.length
    ? rows.map((r, i) => {
        const tds = cols.map(c => {
          const v = c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key] ?? '—')
          return `<td style="${TD}${c.right ? 'text-align:right;' : ''}">${v}</td>`
        }).join('')
        const _vd = valDirBadge(SEC_VD_MAP, entity, r.id)
        return `<tr data-annee="${esc(r.annee ?? '')}" data-rowid="${esc(r.id ?? '')}" style="border-bottom:1px solid #f1f5f9;">${tds}<td style="${TD}text-align:right;white-space:nowrap;">
          ${_vd ? `<span style="margin-right:8px;vertical-align:middle;">${_vd}</span>` : ''}${entity === 'chimiques' ? `<a title="Ouvrir la fiche produit 360 (danger, SEIRICH, FDS, péremption, stock)" href="/securite/chimique/${encodeURIComponent(String(r.id ?? ''))}" style="color:#0e7490;font-size:.85rem;margin-right:8px;text-decoration:none;"><i class="fas fa-up-right-from-square"></i></a>` : ''}${entity === 'chimiques' ? `<button title="Ajouter une situation d'exposition SEIRICH pour ce produit" onclick="secExpoFromChimique(${i})" style="background:none;border:none;color:#ea580c;cursor:pointer;font-size:.85rem;margin-right:8px;"><i class="fas fa-radiation"></i><i class="fas fa-plus" style="font-size:.6rem;vertical-align:super;"></i></button>` : ''}${entity === 'chimiques' ? `<button title="Exporter la fiche FDS (PDF)" onclick="fdsPdf(${i})" style="background:none;border:none;color:#c2410c;cursor:pointer;font-size:.85rem;margin-right:6px;"><i class="fas fa-file-pdf"></i></button>` : ''}
          ${entity === 'incidents' ? `<button title="Créer une action corrective liée" onclick="secACFromIncident(${i})" style="background:none;border:none;color:#7c3aed;cursor:pointer;font-size:.85rem;margin-right:6px;"><i class="fas fa-screwdriver-wrench"></i></button>` : ''}
          ${entity === 'exposition-chimique' ? `<button title="Créer une action corrective (réduire l'exposition)" onclick="secACFromExpo(${i})" style="background:none;border:none;color:#7c3aed;cursor:pointer;font-size:.85rem;margin-right:6px;"><i class="fas fa-screwdriver-wrench"></i></button>` : ''}
          <button title="Modifier" onclick="secOpen('${entity}',${i})" style="background:none;border:none;color:#0ea5e9;cursor:pointer;font-size:.85rem;margin-right:6px;"><i class="fas fa-pen"></i></button>
          <button title="Supprimer" onclick="secDel('${entity}','${esc(r.id)}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;"><i class="fas fa-trash"></i></button>
        </td></tr>`
      }).join('')
    : `<tr><td colspan="${cols.length + 1}" style="text-align:center;padding:26px;color:#cbd5e1;font-size:.8rem;">Aucune donnée.</td></tr>`
  return `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;"><div style="overflow-x:auto;">
    <table id="sec-tbl-${entity}" style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${head}</tr></thead><tbody>${body}</tbody></table>
  </div></div>`
}

function panelHeader(icon: string, title: string, count: number, entity: string, newLabel: string, extraBtns = ''): string {
  return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
    <span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas ${icon}" style="color:${ORANGE};margin-right:7px;"></i>${title}</span>
    <span style="color:#94a3b8;font-size:.74rem;">${count} élément(s)</span>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
      <input type="text" placeholder="Rechercher…" oninput="secFilter('sec-tbl-${entity}',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:180px;"/>
      ${extraBtns}
      <button onclick="secOpen('${entity}')" style="background:linear-gradient(135deg,${ORANGE},#c2410c);color:white;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-plus" style="margin-right:5px;"></i>${newLabel}</button>
    </div>
  </div>`
}
function infoBox(txt: string): string {
  return `<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.74rem;color:#9a3412;line-height:1.5;">${txt}</div>`
}
function panelWrap(id: string, active: boolean, inner: string): string {
  return `<div id="sec-panel-${id}" style="display:${active ? 'block' : 'none'};">${inner}</div>`
}

// Schéma corporel : localisation des accidents/soins par partie du corps (heatmap couleur).
function _bodyZone(s: any): string {
  const n = String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe')
  if (/(doigt|pouce|paume|phalange|index|majeur|annulaire|auriculaire|\bmain\b)/.test(n)) return 'main'
  if (/(oeil|yeux|oculaire|orbit)/.test(n)) return 'yeux'
  if (/(oreille|auditi|tympan)/.test(n)) return 'oreille'
  if (/(dos|colonne|vertebr|lombaire|rachis|\brein)/.test(n)) return 'dos'
  if (/(tete|crane|joue|visage|nez|dent|machoire|levre|front|face|menton|tempe)/.test(n)) return 'tete'
  if (/(epaule|bras|coude|poignet)/.test(n)) return 'bras'
  if (/(genou|jambe|tibia|cuisse|mollet)/.test(n)) return 'jambe'
  if (/(pied|cheville|orteil|talon)/.test(n)) return 'pied'
  if (/(cou|nuque|cervic|gorge)/.test(n)) return 'cou'
  if (/(thorax|poitrine|cote|torse|abdomen|ventre|sternum|hanche|bassin|flanc)/.test(n)) return 'tronc'
  return 'autre'
}
const _ZONE_LBL: Record<string, string> = { main: 'Main / doigts', yeux: 'Yeux', oreille: 'Oreille', dos: 'Dos / colonne', tete: 'Tête', bras: 'Bras / épaule / coude', jambe: 'Jambe / genou', pied: 'Pied / cheville', cou: 'Cou / nuque', tronc: 'Tronc (thorax/abdomen)', autre: 'Autre / non précisé' }
export function bodyAccidentMap(incidents: any[]): string {
  const c: Record<string, number> = { main: 0, yeux: 0, oreille: 0, dos: 0, tete: 0, bras: 0, jambe: 0, pied: 0, cou: 0, tronc: 0, autre: 0 }
  let total = 0
  for (const i of incidents) { if (!i || i.partie_corps == null || String(i.partie_corps).trim() === '') continue; c[_bodyZone(i.partie_corps)]++; total++ }
  const drawn = ['main', 'yeux', 'oreille', 'dos', 'tete', 'bras', 'jambe', 'pied', 'cou', 'tronc']
  const max = Math.max(1, ...drawn.map((z) => c[z]))
  const col = (v: number) => { if (!v) return '#eef2f7'; const r = v / max; return r <= 0.15 ? '#fde68a' : r <= 0.35 ? '#fbbf24' : r <= 0.6 ? '#fb923c' : r <= 0.8 ? '#f87171' : '#dc2626' }
  const cnt = (z: string) => `<title>${_ZONE_LBL[z]} : ${c[z]} cas</title>`
  const front = `
    <rect x="74" y="196" width="14" height="96" rx="7" fill="${col(c.jambe)}">${cnt('jambe')}</rect>
    <rect x="92" y="196" width="14" height="96" rx="7" fill="${col(c.jambe)}">${cnt('jambe')}</rect>
    <ellipse cx="81" cy="299" rx="11" ry="6" fill="${col(c.pied)}">${cnt('pied')}</ellipse>
    <ellipse cx="99" cy="299" rx="11" ry="6" fill="${col(c.pied)}">${cnt('pied')}</ellipse>
    <rect x="72" y="150" width="36" height="50" rx="10" fill="${col(c.tronc)}">${cnt('tronc')}</rect>
    <rect x="68" y="86" width="44" height="72" rx="14" fill="${col(c.tronc)}">${cnt('tronc')}</rect>
    <rect x="48" y="88" width="13" height="74" rx="6.5" fill="${col(c.bras)}">${cnt('bras')}</rect>
    <rect x="119" y="88" width="13" height="74" rx="6.5" fill="${col(c.bras)}">${cnt('bras')}</rect>
    <circle cx="54" cy="168" r="9" fill="${col(c.main)}">${cnt('main')}</circle>
    <circle cx="126" cy="168" r="9" fill="${col(c.main)}">${cnt('main')}</circle>
    <rect x="84" y="62" width="12" height="12" fill="${col(c.cou)}">${cnt('cou')}</rect>
    <circle cx="90" cy="44" r="22" fill="${col(c.tete)}">${cnt('tete')}</circle>
    <circle cx="68" cy="46" r="5" fill="${col(c.oreille)}">${cnt('oreille')}</circle>
    <circle cx="112" cy="46" r="5" fill="${col(c.oreille)}">${cnt('oreille')}</circle>
    <ellipse cx="82" cy="40" rx="4" ry="3" fill="${col(c.yeux)}" stroke="#fff" stroke-width="0.7">${cnt('yeux')}</ellipse>
    <ellipse cx="98" cy="40" rx="4" ry="3" fill="${col(c.yeux)}" stroke="#fff" stroke-width="0.7">${cnt('yeux')}</ellipse>
    <text x="90" y="316" text-anchor="middle" font-size="9.5" fill="#64748b" font-weight="700">Face</text>`
  const back = `<g transform="translate(178,0)">
    <rect x="74" y="196" width="14" height="96" rx="7" fill="#eef2f7"/>
    <rect x="92" y="196" width="14" height="96" rx="7" fill="#eef2f7"/>
    <ellipse cx="81" cy="299" rx="11" ry="6" fill="#eef2f7"/>
    <ellipse cx="99" cy="299" rx="11" ry="6" fill="#eef2f7"/>
    <rect x="72" y="150" width="36" height="50" rx="10" fill="${col(c.dos)}">${cnt('dos')}</rect>
    <rect x="68" y="86" width="44" height="72" rx="14" fill="${col(c.dos)}">${cnt('dos')}</rect>
    <rect x="48" y="88" width="13" height="74" rx="6.5" fill="#eef2f7"/>
    <rect x="119" y="88" width="13" height="74" rx="6.5" fill="#eef2f7"/>
    <circle cx="54" cy="168" r="9" fill="#eef2f7"/>
    <circle cx="126" cy="168" r="9" fill="#eef2f7"/>
    <rect x="84" y="62" width="12" height="12" fill="${col(c.cou)}">${cnt('cou')}</rect>
    <circle cx="90" cy="44" r="22" fill="#eef2f7"/>
    <text x="90" y="316" text-anchor="middle" font-size="9.5" fill="#64748b" font-weight="700">Dos</text>
  </g>`
  return _bodyMapRender(c, total, drawn, max, col, front, back)
}
function _bodyMapRender(c: Record<string, number>, total: number, drawn: string[], max: number, col: (v: number) => string, front: string, back: string): string {
  const top = drawn.map((z) => ({ z, n: c[z] })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 6)
  const topList = top.length ? top.map((x) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
      <span style="width:12px;height:12px;border-radius:3px;background:${col(x.n)};flex-shrink:0;"></span>
      <span style="font-size:.76rem;color:#374151;flex:1;">${_ZONE_LBL[x.z]}</span>
      <span style="font-size:.78rem;font-weight:800;color:#1e293b;">${x.n}</span>
    </div>`).join('') : '<div style="font-size:.76rem;color:#94a3b8;">Aucune localisation enregistrée.</div>'
  return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
      <div style="font-weight:800;color:#1e293b;font-size:.9rem;"><i class="fas fa-person" style="color:${ORANGE};margin-right:7px;"></i>Localisation des accidents &amp; soins sur le corps</div>
      <div style="font-size:.72rem;color:#94a3b8;">${total} cas localisés</div>
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
      <svg viewBox="38 14 320 312" style="width:320px;max-width:100%;height:auto;" role="img" aria-label="Schéma corporel des accidents par partie du corps">
        ${front}${back}
      </svg>
      <div style="flex:1;min-width:200px;">
        <div style="font-size:.7rem;text-transform:uppercase;font-weight:800;color:#94a3b8;margin-bottom:8px;">Top localisations</div>
        ${topList}
        <div style="margin-top:12px;display:flex;align-items:center;gap:5px;font-size:.66rem;color:#94a3b8;">
          <span>Moins</span>
          <span style="width:16px;height:9px;background:#fde68a;"></span><span style="width:16px;height:9px;background:#fbbf24;"></span><span style="width:16px;height:9px;background:#fb923c;"></span><span style="width:16px;height:9px;background:#f87171;"></span><span style="width:16px;height:9px;background:#dc2626;"></span>
          <span>Plus</span>
        </div>
      </div>
    </div>
  </div>`
}

// Matrice de suivi : formations requises (par poste) × certifications/habilitations détenues × salariés.
function _fnorm(s: any): string { return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe') }
function _formStatus(formation: any, certs: any[]): string {
  const f = _fnorm(formation); let kw: string[] = []
  if (/sst/.test(f)) kw = ['sst']
  else if (/caces/.test(f)) kw = ['caces']
  else if (/electriqu/.test(f) || /habilitation electr/.test(f)) kw = ['electriqu']
  else if (/atex/.test(f)) kw = ['atex']
  else if (/hauteur/.test(f)) kw = ['hauteur']
  else if (/geste|posture|prap/.test(f)) kw = ['geste', 'posture']
  else if (/chimiqu|acd|acide/.test(f)) kw = ['chimiqu', 'acide']
  else if (/extincteur|incendie|evacuation/.test(f)) kw = ['extincteur', 'incendie']
  else if (/pontier|elingu/.test(f)) kw = ['pontier', 'elingu']
  else if (/accueil/.test(f)) kw = ['accueil']
  else kw = [f.split(' ')[0]]
  const rank: Record<string, number> = { valide: 3, a_renouveler: 2, expire: 1 }; let best: any = null
  for (const c of certs) { const ci = _fnorm(c.intitule) + ' ' + _fnorm(c.type); if (kw.some((k) => k && ci.includes(k))) { if (!best || (rank[c.statut] || 0) > (rank[best.statut] || 0)) best = c } }
  if (!best) return 'manquant'
  return best.statut === 'valide' ? 'valide' : best.statut === 'a_renouveler' ? 'a_renouveler' : 'expire'
}
function _posteCats(s: any): Set<string> {
  const set = new Set(['Tous']); const p = _fnorm(s.poste), m = _fnorm(s.metier), au = _fnorm(JSON.stringify(s.autorisations || ''))
  const op = s.est_operateur === true || String(s.est_operateur) === 'True' || m === 'operateur'
  if (op) { set.add('Production'); set.add('Atelier') }
  if (/oxydation|traitement|oas|bain|anodi/.test(p) || /oas/.test(au)) set.add('OAS')
  if (/magasin|logisti|expedition|cariste|approvision/.test(p) || /logisti/.test(m) || /magasin|expedition|stock/.test(au)) set.add('Magasin')
  if (/maintenance/.test(p) || /maintenance/.test(m)) set.add('Maintenance')
  return set
}
export function formationMatrix(salaries: any[], formReq: any[], certifications: any[]): string {
  if (!formReq.length || !salaries.length) return ''
  const active = salaries.filter((s) => s && s.actif !== false && _fnorm(s.actif) !== 'false').sort((a, b) => _fnorm(a.nom).localeCompare(_fnorm(b.nom)))
  const forms = formReq.slice().sort((a, b) => String(a.poste).localeCompare(String(b.poste)))
  const certBy: Record<string, any[]> = {}; for (const c of certifications) { (certBy[String(c.salarie_id)] = certBy[String(c.salarie_id)] || []).push(c) }
  const shortLbl = (f: string) => { const n = _fnorm(f); if (/sst/.test(n)) return 'SST'; if (/caces/.test(n)) return 'CACES'; if (/electriqu/.test(n)) return 'Habil. élec.'; if (/atex/.test(n)) return 'ATEX'; if (/hauteur/.test(n)) return 'Hauteur'; if (/geste|posture/.test(n)) return 'Gestes/post.'; if (/chimiqu|acide/.test(n)) return 'Chimique'; if (/extincteur|incendie|evacuation/.test(n)) return 'Évac/feu'; if (/accueil/.test(n)) return 'Accueil'; return String(f).slice(0, 12) }
  const STC: Record<string, [string, string, string]> = { valide: ['#dcfce7', '#15803d', '✓'], a_renouveler: ['#fef9c3', '#a16207', '⚠'], expire: ['#ffedd5', '#c2410c', '⏱'], manquant: ['#fee2e2', '#b91c1c', '✗'], na: ['#f8fafc', '#cbd5e1', '—'] }
  let req = 0, ok = 0, exp = 0, manq = 0
  const rows = active.map((s) => {
    const cats = _posteCats(s); const certs = certBy[String(s.id)] || []
    let rReq = 0, rOk = 0
    const cells = forms.map((f) => {
      if (!cats.has(String(f.poste))) return { st: 'na' }
      const st = _formStatus(f.formation, certs); rReq++; req++
      if (st === 'valide') { rOk++; ok++ } else if (st === 'expire') { exp++ } else if (st === 'manquant') { manq++ }
      return { st }
    })
    return { s, cells, cov: rReq ? Math.round(rOk / rReq * 100) : null }
  })
  const head = `<th style="${TH}text-align:left;position:sticky;left:0;background:#f8fafc;z-index:1;">Salarié</th>` + forms.map((f) => `<th style="${TH}text-align:center;" title="${esc(f.formation)} (poste ${esc(f.poste)}${f.periodicite_mois ? ', recyclage ' + f.periodicite_mois + ' mois' : ''})"><div style="font-size:.62rem;line-height:1.15;">${esc(shortLbl(f.formation))}</div><div style="font-size:.55rem;color:#cbd5e1;font-weight:400;">${esc(f.poste)}</div></th>`).join('') + `<th style="${TH}text-align:center;">Couv.</th>`
  const body = rows.map((r) => `<tr style="border-bottom:1px solid #f1f5f9;">
    <td style="${TD}font-weight:700;color:#374151;white-space:nowrap;position:sticky;left:0;background:#fff;">${esc((r.s.prenom || '') + ' ' + (r.s.nom || ''))}<div style="font-size:.6rem;color:#94a3b8;font-weight:400;">${esc(r.s.poste || r.s.metier || '')}</div></td>` +
    r.cells.map((c) => { const x = STC[c.st]; return `<td style="${TD}text-align:center;"><span style="display:inline-block;min-width:22px;border-radius:5px;background:${x[0]};color:${x[1]};font-weight:800;font-size:.74rem;padding:1px 4px;">${x[2]}</span></td>` }).join('') +
    `<td style="${TD}text-align:center;font-weight:800;color:${r.cov == null ? '#cbd5e1' : r.cov >= 80 ? '#15803d' : r.cov >= 50 ? '#a16207' : '#b91c1c'};">${r.cov == null ? '—' : r.cov + '%'}</td>` +
  `</tr>`).join('')
  const covGlobal = req ? Math.round(ok / req * 100) : 0
  return `<div style="margin-top:22px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-weight:800;font-size:.95rem;color:#1e293b;"><i class="fas fa-table-cells-large" style="color:${ORANGE};margin-right:7px;"></i>Matrice de suivi des formations &amp; habilitations</span>
      <span style="color:#94a3b8;font-size:.74rem;">${active.length} salariés · couverture ${covGlobal}% · ${manq} manquantes · ${exp} expirées</span>
    </div>
    ${infoBox('Croise les <strong>formations requises</strong> (par poste) avec les <strong>certifications / habilitations</strong> réellement détenues par chaque salarié (module RH). ✓ valide · ⚠ à renouveler · ⏱ expirée · ✗ manquante · — non requise pour le poste. Survolez l\'en-tête d\'une colonne pour le détail.')}
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${head}</tr></thead><tbody>${body}</tbody></table></div></div>
  </div>`
}

export const pageServiceSecurite = (data: any) => {
  const D = data || {}
  const arr = (k: string) => (Array.isArray(D[k]) ? D[k] : [])
  SEC_VD_MAP = buildValDirMap(arr('validations'))   // décisions Direction (rebouclage badge par entité HSE)
  const risques = arr('risques'), incidents = arr('incidents'), epiCat = arr('epiCat'), epiDot = arr('epiDot'),
    chimiques = arr('chimiques'), expositions = arr('expositions'), dechets = arr('dechets'), mesuresEnv = arr('mesuresEnv'), atex = arr('atex'),
    verifs = arr('verifs'), formReq = arr('formReq'), exercices = arr('exercices'), plans = arr('plans'),
    rse = arr('rse'), conformite = arr('conformite'), actionsCorr = arr('actionsCorr'), flash = arr('flash'), epiZone = arr('epiZone')
  const auditProg = arr('auditProg'), auditAuto = (D.auditAuto && typeof D.auditAuto === 'object') ? D.auditAuto : {}
  const auditGrilles = arr('auditGrilles'), auditQuestions = arr('auditQuestions')
  const salaries = arr('salaries'), machines = arr('machines'), fournisseurs = arr('fournisseurs'),
    certifications = arr('certifications'), habilitations = arr('habilitations'), pointages = arr('pointages')

  // ─── KPIs dashboard ───
  const today = TODAY(), year = today.slice(0, 4), month = today.slice(0, 7)
  const inYear = (d: any) => String(d || '').slice(0, 4) === year
  const incY = incidents.filter((i: any) => inYear(i.date_incident))
  const accidents = incidents.filter((i: any) => i.type === 'accident_travail')
  const accY = incY.filter((i: any) => i.type === 'accident_travail')
  const accArret = accY.filter((i: any) => i.avec_arret)
  const joursArret = accArret.reduce((s: number, i: any) => s + (Number(i.jours_arret) || 0), 0)
  const heures = pointages.filter((p: any) => inYear(p.date_pointage)).reduce((s: number, p: any) => s + (Number(p.heures_travaillees) || 0), 0)
  const tf = heures > 0 ? (accArret.length * 1e6 / heures) : null
  const tg = heures > 0 ? (joursArret * 1e3 / heures) : null
  const lastAcc = accidents.map((i: any) => i.date_incident).filter(Boolean).sort().slice(-1)[0]
  const joursSans = lastAcc ? Math.max(0, Math.floor((Date.parse(today) - Date.parse(String(lastAcc).slice(0, 10))) / 86400000)) : null
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const epiExp = epiDot.filter((e: any) => e.date_peremption && String(e.date_peremption).slice(0, 10) <= soon).length
  const vgpRetard = verifs.filter((v: any) => v.date_prochaine && String(v.date_prochaine).slice(0, 10) < today).length
  const confAlerte = conformite.filter((x: any) => x.statut === 'non_conforme' || (x.date_echeance && String(x.date_echeance).slice(0, 10) < today)).length
  const fdsManq = chimiques.filter((x: any) => !x.fds_ref && !x.fds_url).length
  const eauMois = mesuresEnv.filter((m: any) => m.type === 'conso_eau' && String(m.date_mesure || '').slice(0, 7) === month).reduce((s: number, m: any) => s + (Number(m.valeur) || 0), 0)
  const dechetMois = dechets.filter((d: any) => String(d.date_dechet || '').slice(0, 7) === month).reduce((s: number, d: any) => s + (Number(d.quantite) || 0), 0)
  const presq = incY.filter((i: any) => i.type === 'presque_accident' || i.type === 'situation_dangereuse').length
  const depYTD = epiDot.filter((e: any) => inYear(e.date_remise)).reduce((s: number, e: any) => s + (Number(e.prix) || 0), 0)
  const depSansPrix = epiDot.filter((e: any) => e.prix == null || e.prix === '').length
  const hseSansFour = epiCat.filter((e: any) => !e.fournisseur_id).length + epiDot.filter((e: any) => !e.fournisseur_id).length + chimiques.filter((c: any) => !c.fournisseur_id).length

  const kpi = (val: string, label: string, color: string, icon: string, sub = '') => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px 18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><i class="fas ${icon}" style="color:${color};"></i><span style="font-size:.66rem;text-transform:uppercase;font-weight:800;color:#94a3b8;letter-spacing:.04em;">${label}</span></div>
      <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1;">${val}</div>
      ${sub ? `<div style="font-size:.66rem;color:#94a3b8;margin-top:5px;">${sub}</div>` : ''}
    </div>`
  const dashboard = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px;">
      ${kpi(joursSans != null ? String(joursSans) : '—', 'Jours sans accident', '#16a34a', 'fa-calendar-check', lastAcc ? 'dernier AT : ' + d10(lastAcc) : 'aucun AT enregistré')}
      ${kpi(tf != null ? tf.toFixed(1) : '—', 'Taux de fréquence (TF)', '#ea580c', 'fa-gauge-high', heures > 0 ? Math.round(heures).toLocaleString('fr-FR') + ' h travaillées' : 'heures non saisies')}
      ${kpi(tg != null ? tg.toFixed(2) : '—', 'Taux de gravité (TG)', '#dc2626', 'fa-heart-pulse', joursArret + ' j d\'arrêt cumulés')}
      ${kpi(String(accY.length), 'Accidents ' + year, '#b91c1c', 'fa-user-injured', accArret.length + ' avec arrêt')}
      ${kpi(String(presq), 'Presqu\'accidents ' + year, '#0891b2', 'fa-triangle-exclamation', 'remontées terrain')}
      ${kpi(String(epiExp), 'EPI à renouveler', '#a16207', 'fa-helmet-safety', '≤ 30 j ou périmés')}
      ${kpi(String(vgpRetard), 'VGP en retard', '#dc2626', 'fa-clipboard-check', 'vérifications dépassées')}
      ${kpi(String(confAlerte), 'Alertes conformité', '#b91c1c', 'fa-scale-balanced', 'non conforme / échu')}
      ${kpi(eauMois ? eauMois.toLocaleString('fr-FR') + ' m³' : '—', 'Eau (mois)', '#0ea5e9', 'fa-droplet', 'consommation réseau')}
      ${kpi(dechetMois ? dechetMois.toLocaleString('fr-FR') : '—', 'Déchets (mois)', '#65a30d', 'fa-recycle', 'quantité enlevée')}
      ${kpi(String(fdsManq), 'FDS manquantes', '#c2410c', 'fa-flask-vial', 'produits chimiques sans FDS')}
      ${kpi(String(conformite.filter((x:any)=>x.statut==='conforme').length) + '/' + conformite.length, 'Conformité', '#16a34a', 'fa-list-check', 'obligations conformes')}
      ${kpi(depYTD ? Math.round(depYTD).toLocaleString('fr-FR') + ' €' : '—', 'Dépenses EPI/matériel ' + year, '#7c3aed', 'fa-euro-sign', depSansPrix ? depSansPrix + ' dotation(s) sans prix' : 'dotations valorisées')}
      ${kpi(String(hseSansFour), 'Items sans fournisseur', hseSansFour ? '#dc2626' : '#16a34a', 'fa-link-slash', 'EPI / chimie à relier')}
    </div>
    ${bodyAccidentMap(incidents)}
    <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:14px 18px;font-size:.76rem;color:#9a3412;line-height:1.6;">
      <strong><i class="fas fa-circle-info" style="margin-right:6px;"></i>Module Sécurité (HSE / RSE)</strong> — couvre DUER, accidents, EPI, risque chimique (FDS), environnement (ICPE/DREAL, eau, déchets/Trackdéchets), ATEX, vérifications réglementaires (VGP), formations sécurité, plans de prévention, indicateurs RSE et matrice de conformité. Données par site Seem/Semrac.
    </div>`

  // ─── colonnes par entité ───
  const colRisques: Col[] = [
    { key: 'priorite', label: 'Prio', right: true, fmt: (v) => prioBadge(v) },
    { key: 'famille', label: 'Famille' },
    { key: 'unite_travail', label: 'Unité de travail' },
    { key: 'danger', label: 'Danger' },
    { key: 'gravite', label: 'G', right: true }, { key: 'frequence', label: 'F', right: true },
    { key: 'criticite', label: 'Criticité', right: true, fmt: (v) => critBadge(v) },
    { key: 'score_brut', label: 'Score', right: true, fmt: (v) => (v != null ? esc(v) : '—') },
    { key: 'responsable', label: 'Responsable' },
    { key: 'echeance', label: 'Échéance', fmt: (v) => dateEcheance(v) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
    { key: 'entite', label: 'Site' },
  ]
  const colIncidents: Col[] = [
    { key: 'date_incident', label: 'Date', fmt: (v) => d10(v) },
    { key: 'type', label: 'Type', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'salarie_nom', label: 'Salarié' },
    { key: 'partie_corps', label: 'Partie du corps' },
    { key: 'gravite', label: 'Gravité' },
    { key: 'avec_arret', label: 'Arrêt', fmt: (v, r) => (v ? pill((r.jours_arret || 0) + ' j', '#fee2e2', '#b91c1c') : boolBadge(false)) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
    { key: 'entite', label: 'Site' },
  ]
  const colEpiCat: Col[] = [
    { key: 'nom', label: 'EPI' }, { key: 'categorie', label: 'Catégorie' }, { key: 'norme_en', label: 'Norme EN' },
    { key: 'duree_vie_mois', label: 'Durée vie', right: true, fmt: (v) => (v ? v + ' mois' : '—') },
    { key: 'ref_stock', label: 'Réf. stock' }, { key: 'fournisseur', label: 'Fournisseur' },
  ]
  const colEpiDot: Col[] = [
    { key: 'salarie_nom', label: 'Salarié' }, { key: 'epi_nom', label: 'Fourniture / EPI' },
    { key: 'taille', label: 'Taille' }, { key: 'quantite', label: 'Qté', right: true },
    { key: 'fournisseur', label: 'Fournisseur' }, { key: 'marque', label: 'Marque' },
    { key: 'date_remise', label: 'Remis le', fmt: (v) => d10(v) },
    { key: 'date_peremption', label: 'Péremption', fmt: (v) => dateEcheance(v) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]
  const colChimiques: Col[] = [
    { key: 'nom', label: 'Produit' }, { key: 'num_identification', label: 'N° identif.' }, { key: 'ref_stock', label: 'Réf. produit' },
    { key: 'pictogrammes', label: 'Pictos CLP', fmt: (v) => clpRow(v, 28) },
    { key: 'cmr', label: 'CMR', fmt: (v) => (v ? pill(String(v), '#fee2e2', '#b91c1c') : '—') },
    { key: 'quantite', label: 'Quantité', right: true, fmt: (v, r) => (v != null && v !== '' ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'zone_stockage', label: 'Stockage' },
    { key: 'fds_ref', label: 'FDS', fmt: (v, r) => (v || r.fds_url ? pill('FDS', '#dcfce7', '#15803d') : pill('manquante', '#fee2e2', '#b91c1c')) },
    { key: 'fds_date', label: 'Date FDS', fmt: (v) => d10(v) },
    { key: 'entite', label: 'Site' },
  ]
  const colExpo: Col[] = [
    { key: 'produit_nom', label: 'Produit', fmt: (v, r) => esc(v || '—') + (r.cmr ? ' ' + pill('CMR', '#fee2e2', '#7f1d1d') : '') },
    { key: 'unite_travail', label: 'Unité de travail', fmt: (v, r) => esc(v || '—') + (r.tache ? ` <span style="color:#94a3b8;font-size:.68rem;">${esc(r.tache)}</span>` : '') },
    { key: 'procede', label: 'Procédé', fmt: (v) => esc(EXPO_PROCEDE_LBL[v] || v || '—') },
    { key: 'protection_collective', label: 'Protection', fmt: (v, r) => esc(EXPO_PROT_LBL[v] || v || '—') + (r.epi ? ' +EPI' : '') },
    { key: 'niv_sante', label: 'Santé', fmt: (v) => nivChip(Number(v) || 0) },
    { key: 'niv_inc', label: 'Incendie', fmt: (v, r) => nivChip(Number(v) || 0) + (r.atex ? ` <span title="${esc(r.zone_atex || 'ATEX probable')}" style="color:#c2410c;font-weight:800;font-size:.6rem;">⚡ATEX</span>` : '') },
    { key: 'niv_env', label: 'Environ.', fmt: (v) => nivChip(Number(v) || 0) },
    { key: 'niveau_max', label: 'Retenu', fmt: (v, r) => (r.significatif ? '<strong>' + nivChip(Number(v) || 0) + '</strong>' : nivChip(Number(v) || 0)) },
  ]
  const colDechets: Col[] = [
    { key: 'date_dechet', label: 'Date', fmt: (v) => d10(v) },
    { key: 'code_dechet', label: 'Code déchet' }, { key: 'designation', label: 'Désignation' },
    { key: 'dangereux', label: 'Dangereux', fmt: (v) => boolBadge(v) },
    { key: 'quantite', label: 'Qté', right: true, fmt: (v, r) => (v != null ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'filiere', label: 'Filière' }, { key: 'bsdd_num', label: 'BSDD' },
  ]
  const colMesures: Col[] = [
    { key: 'date_mesure', label: 'Date', fmt: (v) => d10(v) },
    { key: 'type', label: 'Type', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'point_mesure', label: 'Point' }, { key: 'parametre', label: 'Paramètre' },
    { key: 'valeur', label: 'Valeur', right: true, fmt: (v, r) => (v != null ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'vle', label: 'VLE', right: true },
    { key: 'conforme', label: 'Conforme', fmt: (v) => boolBadge(v) },
  ]
  const colAtex: Col[] = [
    { key: 'nom', label: 'Zone' },
    { key: 'type_zone', label: 'Type', fmt: (v) => (v != null && v !== '' ? pill('Zone ' + v, '#fef9c3', '#a16207') : '—') },
    { key: 'localisation', label: 'Localisation' }, { key: 'origine_risque', label: 'Origine' },
    { key: 'materiel_requis', label: 'Matériel requis' },
    { key: 'date_revue', label: 'Revue', fmt: (v) => dateEcheance(v) }, { key: 'entite', label: 'Site' },
  ]
  const colVerifs: Col[] = [
    { key: 'type', label: 'Type', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'equipement', label: 'Équipement' }, { key: 'organisme', label: 'Organisme' },
    { key: 'date_controle', label: 'Contrôle', fmt: (v) => d10(v) },
    { key: 'date_prochaine', label: 'Prochaine', fmt: (v) => dateEcheance(v) },
    { key: 'resultat', label: 'Résultat', fmt: (v) => statutBadge(v) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) }, { key: 'entite', label: 'Site' },
  ]
  const colFormReq: Col[] = [
    { key: 'poste', label: 'Poste / famille' }, { key: 'formation', label: 'Formation' },
    { key: 'obligatoire', label: 'Obligatoire', fmt: (v) => boolBadge(v) },
    { key: 'periodicite_mois', label: 'Périodicité', right: true, fmt: (v) => (v ? v + ' mois' : 'unique') },
    { key: 'entite', label: 'Site' },
  ]
  const colExercices: Col[] = [
    { key: 'date_exercice', label: 'Date', fmt: (v) => d10(v) },
    { key: 'type', label: 'Type' }, { key: 'site', label: 'Site' },
    { key: 'nb_participants', label: 'Participants', right: true },
    { key: 'duree_min', label: 'Durée', right: true, fmt: (v) => (v ? v + ' min' : '—') },
    { key: 'conforme', label: 'Conforme', fmt: (v) => boolBadge(v) },
  ]
  const colPlans: Col[] = [
    { key: 'type', label: 'Type', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'entreprise_exterieure', label: 'Entreprise ext.' }, { key: 'operation', label: 'Opération' },
    { key: 'date_debut', label: 'Début', fmt: (v) => d10(v) }, { key: 'date_fin', label: 'Fin', fmt: (v) => d10(v) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) }, { key: 'entite', label: 'Site' },
  ]
  const colRse: Col[] = [
    { key: 'periode', label: 'Période' }, { key: 'categorie', label: 'Catégorie' },
    { key: 'libelle', label: 'Indicateur' },
    { key: 'valeur', label: 'Valeur', right: true, fmt: (v, r) => (v != null ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'cible', label: 'Cible', right: true }, { key: 'entite', label: 'Site' },
  ]
  const colConf: Col[] = [
    { key: 'domaine', label: 'Domaine' }, { key: 'obligation', label: 'Obligation' },
    { key: 'reference_reglementaire', label: 'Référence' },
    { key: 'date_echeance', label: 'Échéance', fmt: (v) => dateEcheance(v) },
    { key: 'responsable', label: 'Responsable' },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]
  const acTypeBadge = (v: any) => {
    const t = String(v || '')
    if (t === 'AC') return pill('AC', '#dbeafe', '#1d4ed8')
    if (t === 'PAC') return pill('PAC', '#fef9c3', '#a16207')
    if (t === 'SD') return pill('SD', '#fee2e2', '#b91c1c')
    return esc(t || '—')
  }
  const fivwhy = (v: any) => {
    let a = v
    if (typeof v === 'string') { try { a = JSON.parse(v) } catch { a = [v] } }
    if (!Array.isArray(a) || !a.length) return '—'
    return `<span style="font-size:.72rem;color:#475569;" title="${esc(a.join(' → '))}">${esc(a.filter(Boolean).slice(0, 3).join(' → '))}${a.length > 3 ? ' …' : ''}</span>`
  }
  const colAC: Col[] = [
    { key: 'numero', label: 'N°', right: true },
    { key: 'type', label: 'Type', fmt: (v) => acTypeBadge(v) },
    { key: 'date_ouverture', label: 'Date', fmt: (v) => d10(v) },
    { key: 'origine', label: 'Secteur' },
    { key: 'description', label: 'Constat' },
    { key: 'analyse_5p', label: '5 Pourquoi', fmt: (v) => fivwhy(v) },
    { key: 'action', label: 'Action(s) d\'éradication' },
    { key: 'responsable', label: 'Pilote / délai' },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]
  const colFlash: Col[] = [
    { key: 'numero', label: 'N°' },
    { key: 'date', label: 'Date', fmt: (v) => d10(v) },
    { key: 'secteur', label: 'Secteur' },
    { key: 'evenement', label: 'Description du flash' },
    { key: 'mesures', label: 'Mesures' },
    { key: 'pilote', label: 'Rédacteur' },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]

  // ─── panneaux ───
  const pDash = panelWrap('dashboard', false, dashboard)
  const duerAnnees = Array.from(new Set(risques.map((r: any) => r.annee).filter((x: any) => x != null))).sort((a: any, b: any) => b - a)
  const duerSel = duerAnnees.length ? duerAnnees[0] : new Date().getFullYear()
  const duerOpts = (duerAnnees.length ? duerAnnees : [duerSel]).map((y: any) => `<option value="${y}">DUERP ${y}</option>`).join('')
  const duerExtra =
    `<select id="duer-annee" onchange="duerYear(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.8rem;background:#f8fafc;font-weight:700;color:#1e293b;cursor:pointer;">${duerOpts}</select>` +
    `<button onclick="duerPdf()" title="Imprimer / exporter la DUERP en PDF" style="background:#fff;border:1.5px solid #c7d2fe;color:#4338ca;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-file-pdf" style="margin-right:5px;"></i>Imprimer / PDF</button>` +
    `<button onclick="duerCloner()" title="Reconduire les dangers vers l'exercice suivant (PAPRIPACT vierge)" style="background:#fff;border:1.5px solid #fed7aa;color:#c2410c;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-copy" style="margin-right:5px;"></i>Générer DUERP <span id="duer-next">${duerSel + 1}</span></button>`
  const pDuer = panelWrap('duer', true,
    panelHeader('fa-clipboard-list', 'DUER — Évaluation des risques', risques.length, 'risques', 'Nouveau risque', duerExtra) +
    infoBox('<strong>Document Unique (DUERP)</strong> — recensement des dangers <strong>par unité de travail</strong> (Code du travail R.4121-1), classé par exercice annuel (R.4121-2, mise à jour ≥ 1×/an). Cotation ERP = gravité × fréquence ; le <strong>score brut</strong> (méthode Kinney P×F×G×coef) et la <strong>priorité P1/P2/P3</strong> donnent l\'ordre de traitement. Le plan d\'action constitue le <strong>PAPRIPACT</strong>. « Générer DUERP N+1 » reconduit les dangers et remet le plan d\'action à zéro.') +
    dataTable('risques', risques, colRisques))
  const pInc = panelWrap('incidents', false,
    panelHeader('fa-user-injured', 'Accidents & presqu\'accidents', incidents.length, 'incidents', 'Déclarer') +
    infoBox('Accidents du travail / de trajet, maladies professionnelles, <strong>presqu\'accidents</strong> et situations dangereuses. Déclaration CPAM &lt; 48 h. Les indicateurs <strong>TF/TG</strong> sont calculés sur le tableau de bord.') +
    dataTable('incidents', incidents, colIncidents))
  const pEpi = panelWrap('epi', false,
    panelHeader('fa-helmet-safety', 'Dotations EPI', epiDot.length, 'epi-dotations', 'Nouvelle dotation', `<button onclick="ouvrirDemandeAchat()" style="background:#fff;border:1.5px solid #fed7aa;color:#c2410c;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-cart-plus" style="margin-right:5px;"></i>Réappro</button>`) +
    infoBox('Dotation <strong>nominative</strong> des EPI (taille, dates, péremption) — preuve de remise. Le catalogue ci-dessous définit les EPI et leur durée de vie.') +
    dataTable('epi-dotations', epiDot, colEpiDot) +
    `<div style="margin-top:18px;"></div>` +
    panelHeader('fa-list', 'Catalogue EPI', epiCat.length, 'epi-catalogue', 'Nouvel EPI') +
    dataTable('epi-catalogue', epiCat, colEpiCat))
  const pChim = panelWrap('chimie', false,
    clpDefs() +
    panelHeader('fa-flask-vial', 'Produits chimiques & FDS', chimiques.length, 'chimiques', 'Nouveau produit', `<button onclick="pictoCompatModal()" title="Rappel des pictogrammes CLP et matrice de compatibilité de stockage" style="background:#fff;border:1.5px solid #fde68a;color:#92400e;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-table-cells-large" style="margin-right:5px;"></i>Pictogrammes</button><button onclick="ouvrirDemandeAchat()" style="background:#fff;border:1.5px solid #fed7aa;color:#c2410c;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-cart-plus" style="margin-right:5px;"></i>Réappro</button>`) +
    infoBox('Inventaire des produits dangereux + <strong>FDS</strong> (REACH/CLP), pictogrammes, agents <strong>CMR</strong>, VLEP et conditions de stockage (rétention/compatibilité). Pictogrammes CLP/SGH visuels : cliquer pour sélectionner, ils apparaissent dans la liste et sur la fiche PDF.') +
    dataTable('chimiques', chimiques, colChimiques))
  // ── Risque chimique — cotation SEIRICH (méthode INRS ND 2233), indicative ──
  const chimR = chimiques.map((c: any) => ({ c, r: computeRisqueChimique(c) }))
    .sort((a: any, b: any) => (b.r.niveauMax - a.r.niveauMax) || (b.r.classeSante - a.r.classeSante))
  const nElv = chimR.filter((x: any) => x.r.niveauMax === 3).length
  const nMoy = chimR.filter((x: any) => x.r.niveauMax === 2).length
  const nCmr = chimR.filter((x: any) => x.r.classeSante >= 5).length
  const nInc = chimR.filter((x: any) => x.r.dataQuality === 'incomplet').length
  const nivChip = (n: number) => { const m = SEIRICH_NIVEAUX[n] || SEIRICH_NIVEAUX[0]; return `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:.65rem;font-weight:800;background:${m[0]};color:${m[1]};">${m[2]}</span>` }
  const sTH = (t: string, c = 'left') => `<th style="text-align:${c};padding:8px 10px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #f1f5f9;white-space:nowrap;">${t}</th>`
  const sTD = (v: string, c = 'left') => `<td style="padding:7px 10px;font-size:.76rem;color:#374151;border-bottom:1px solid #f8fafc;text-align:${c};vertical-align:middle;">${v}</td>`
  const pRisqueChim = panelWrap('risque-chimique', false,
    `<div style="font-weight:800;font-size:1rem;color:#1e293b;margin-bottom:10px;"><i class="fas fa-radiation" style="color:${ORANGE};margin-right:7px;"></i>Risque chimique — cotation SEIRICH <span style="font-size:.64rem;font-weight:800;background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 8px;vertical-align:middle;">INDICATIVE — À VALIDER</span></div>` +
    infoBox('<strong>Méthode INRS (SEIRICH / ND 2233)</strong> — chaque produit est coté sur 3 axes : <strong>Santé</strong>, <strong>Incendie-Explosion</strong>, <strong>Environnement</strong> = <em>Danger</em> (codes H + pictogrammes CLP) × <em>Exposition</em> (quantité — <em>Phase 1</em>). Niveau : <span style="color:#15803d;font-weight:800;">Faible</span> · <span style="color:#92400e;font-weight:800;">Moyen</span> · <span style="color:#b91c1c;font-weight:800;">Élevé (prioritaire)</span>. <strong>Cotation par défaut, à valider par le référent QHSE et à recouper avec le logiciel SEIRICH de l\'INRS.</strong> Les lignes « ⚠ données incomplètes » ont des codes H manquants à compléter dans l\'onglet Chimie ci-dessus.') +
    `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${kpi(String(nElv), 'Niveau élevé', nElv ? '#dc2626' : '#16a34a', 'fa-triangle-exclamation', 'produits prioritaires')}
      ${kpi(String(nMoy), 'Niveau moyen', '#d97706', 'fa-circle-half-stroke', 'à surveiller')}
      ${kpi(String(nCmr), 'CMR / très toxique', nCmr ? '#b91c1c' : '#16a34a', 'fa-skull-crossbones', 'priorité substitution')}
      ${kpi(String(nInc), 'Données incomplètes', nInc ? '#c2410c' : '#16a34a', 'fa-circle-question', 'codes H à compléter')}
    </div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;"><div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;">${sTH('Produit')}${sTH('Dangers (H / picto / CMR)')}${sTH('Quantité', 'right')}${sTH('Santé', 'center')}${sTH('Incendie', 'center')}${sTH('Environ.', 'center')}${sTH('Priorité', 'center')}</tr></thead>
        <tbody>${chimR.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:26px;color:#9ca3af;font-size:.82rem;">Aucun produit chimique — saisissez l'inventaire dans l'onglet Chimie.</td></tr>` : chimR.map(({ c, r }: any) => `<tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
          ${sTD(`<span style="font-weight:600;">${esc(c.nom || '—')}</span>${r.dataQuality === 'incomplet' ? ' <span title="Données de danger incomplètes (aucun code H ni pictogramme)" style="color:#c2410c;">⚠</span>' : ''}`)}
          ${sTD(`${r.hCodes.slice(0, 5).map((h: string) => `<span style="display:inline-block;background:#eef2ff;color:#4338ca;border-radius:5px;padding:0 5px;font-size:.62rem;font-weight:700;margin:1px;">${esc(h)}</span>`).join('')}${(Array.isArray(c.pictogrammes) ? c.pictogrammes : []).map((sg: any) => `<span style="display:inline-block;background:#fef2f2;color:#b91c1c;border-radius:5px;padding:0 5px;font-size:.6rem;font-weight:700;margin:1px;">${esc(sg)}</span>`).join('')}${r.classeSante >= 5 ? '<span style="display:inline-block;background:#fee2e2;color:#7f1d1d;border-radius:5px;padding:0 5px;font-size:.6rem;font-weight:800;margin:1px;">CMR</span>' : ''}${r.hCodes.length === 0 && (!Array.isArray(c.pictogrammes) || !c.pictogrammes.length) ? '<span style="color:#cbd5e1;font-size:.7rem;">—</span>' : ''}`)}
          ${sTD(`${c.quantite != null && c.quantite !== '' ? esc(c.quantite) + ' ' + esc(c.unite || '') : '—'}`, 'right')}
          ${sTD(nivChip(r.niveauSante), 'center')}
          ${sTD(nivChip(r.niveauIncendie), 'center')}
          ${sTD(nivChip(r.niveauEnv), 'center')}
          ${sTD(`<strong>${nivChip(r.niveauMax)}</strong>`, 'center')}
        </tr>`).join('')}</tbody>
      </table>
    </div></div>`)
  // ── SEIRICH intermédiaire (Phase 2) : DANGER produit × EXPOSITION situation de travail ──
  const chimById: Record<string, any> = {}
  chimiques.forEach((c: any) => { chimById[c.id] = c })
  // Qmax par unité de travail (plus grande quantité normalisée de la zone) → ratio Qi/Qmax du potentiel
  const qmaxByUT: Record<string, number> = {}
  expositions.forEach((e: any) => { const ut = String(e.unite_travail || '—'); const q = normQuantiteChimique(e.quantite_utilisee, e.unite); if (q > (qmaxByUT[ut] || 0)) qmaxByUT[ut] = q })
  const expoRows = expositions.map((e: any) => {
    const q = qmaxByUT[String(e.unite_travail || '—')]
    const c = chimById[e.produit_id]
    const r = computeExpositionSante(c, e, q), ri = computeExpositionIncendie(c, e, q), re = computeExpositionEnv(c, e, q)
    const nmax = Math.max(r.niveauSante, ri.niveauIncendie, re.niveauEnv)
    return { e, r, ri, re, nmax }
  }).sort((a: any, b: any) => (b.nmax - a.nmax) || (b.r.scoreResiduel - a.r.scoreResiduel))
  const nExpoElv = expoRows.filter((x: any) => x.nmax === 3).length
  const nExpoMoy = expoRows.filter((x: any) => x.nmax === 2).length
  const nExpoSig = expoRows.filter((x: any) => x.r.significatif).length // AES/CMR = notion SANTÉ (la gravité incendie/env est portée par le niveau élevé + la colonne Retenu)
  const nExpoAtex = expoRows.filter((x: any) => x.ri.atexProbable).length
  // Lignes de la liste éditable : cotation LIVE des 3 axes (Qmax de la zone). Retenu = le plus défavorable.
  const expoListRows = expoRows.map((x: any) => ({
    ...x.e, cmr: x.r.cmr, niv_sante: x.r.niveauSante, niv_inc: x.ri.niveauIncendie, niv_env: x.re.niveauEnv,
    niveau_max: x.nmax, atex: x.ri.atexProbable, zone_atex: x.ri.zoneAtex, significatif: x.r.significatif,
  }))
  // Matrice pivot produits × unités de travail (niveau retenu le plus élevé — 3 axes — par croisement)
  const utCols = Array.from(new Set(expositions.map((e: any) => e.unite_travail).filter(Boolean)))
  const prodIds = Array.from(new Set(expoRows.map((x: any) => x.e.produit_id)))
  const pivot = prodIds.map((pid: any) => {
    const hit0 = expoRows.find((x: any) => x.e.produit_id === pid)
    const nom = (chimById[pid] && chimById[pid].nom) || (hit0 && hit0.e.produit_nom) || '—'
    const cells = utCols.map((ut) => {
      const hits = expoRows.filter((x: any) => x.e.produit_id === pid && x.e.unite_travail === ut)
      if (!hits.length) return { n: -1, t: '' }
      const top = hits.reduce((m: any, x: any) => (x.nmax > m.nmax ? x : m))
      return { n: top.nmax, t: hits.length + ' situation(s) — ' + (top.e.tache || String(ut)) }
    })
    const nmax = Math.max(0, ...cells.map((c) => c.n))
    return { nom, cells, nmax }
  }).sort((a: any, b: any) => b.nmax - a.nmax)
  const expoBtns = `<a href="/api/export/seirich.xlsx" title="Exporter l'inventaire coté (produits + situations + 3 axes) au format tableur — à recopier dans le modèle SEIRICH de l'INRS" style="background:#ecfdf5;color:#047857;border:1.5px solid #a7f3d0;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;text-decoration:none;white-space:nowrap;"><i class="fas fa-file-excel" style="margin-right:5px;"></i>Export SEIRICH</a>` +
    `<button onclick="risqueChimiquePdf()" title="Rapport d'évaluation du risque chimique (PDF de marque)" style="background:#faf5ff;color:${BRAND.violet};border:1.5px solid #e9d5ff;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-file-pdf" style="margin-right:5px;"></i>Rapport SEIRICH</button>`
  const pExpo = panelWrap('exposition-chimique', false,
    `<div style="font-weight:800;font-size:1rem;color:#1e293b;margin-bottom:10px;"><i class="fas fa-person-rays" style="color:${ORANGE};margin-right:7px;"></i>Exposition par situation de travail — SEIRICH intermédiaire <span style="font-size:.64rem;font-weight:800;background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 8px;vertical-align:middle;">INDICATIVE — À VALIDER</span></div>` +
    infoBox('<strong>SEIRICH niveau intermédiaire (INRS ND 2233 / R 409)</strong> — pour chaque situation de travail, on croise le <strong>danger du produit</strong> (codes H / pictos / CMR, onglet Chimie) avec l\'<strong>exposition réelle</strong>, sur <strong>3 axes</strong> : <strong>Santé</strong> (Potentiel <em>danger×quantité×fréquence</em> + Résiduel <em>danger×volatilité×procédé×protection</em>, plancher CMR), <strong>Incendie-Explosion</strong> (+ overlay <strong>ATEX</strong> si volatil/pulvérisé), <strong>Environnement</strong> (modulé par le rejet au milieu). Le niveau <strong>Retenu</strong> = le plus défavorable des 3 axes. Niveau : <span style="color:#15803d;font-weight:800;">Faible</span> · <span style="color:#92400e;font-weight:800;">Moyen</span> · <span style="color:#b91c1c;font-weight:800;">Élevé</span>. Axes incendie/environnement volontairement simplifiés (danger × quantité). <strong>À valider par un mesurage / le référent QHSE et à recouper avec le logiciel SEIRICH.</strong>') +
    `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${kpi(String(nExpoElv), 'Situations niveau élevé', nExpoElv ? '#dc2626' : '#16a34a', 'fa-triangle-exclamation', 'priorité de traitement (3 axes)')}
      ${kpi(String(nExpoMoy), 'Niveau moyen', '#d97706', 'fa-circle-half-stroke', 'à surveiller')}
      ${kpi(String(nExpoSig), 'Expositions significatives', nExpoSig ? '#b91c1c' : '#16a34a', 'fa-radiation', 'AES chimique / CMR')}
      ${kpi(String(nExpoAtex), 'Situations ATEX', nExpoAtex ? '#c2410c' : '#16a34a', 'fa-burst', 'atmosphère explosive probable')}
    </div>` +
    panelHeader('fa-person-rays', 'Situations d\'exposition', expositions.length, 'exposition-chimique', 'Nouvelle exposition', expoBtns) +
    dataTable('exposition-chimique', expoListRows, colExpo) +
    (utCols.length && pivot.length ? `<div style="font-weight:800;font-size:.9rem;color:#1e293b;margin:20px 0 10px;"><i class="fas fa-table-cells" style="color:${ORANGE};margin-right:7px;"></i>Matrice produits × unités de travail <span style="color:#94a3b8;font-weight:600;font-size:.72rem;">(niveau retenu le plus élevé — 3 axes — par croisement)</span></div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;"><div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;">${sTH('Produit')}${utCols.map((u) => sTH(String(u), 'center')).join('')}</tr></thead>
        <tbody>${pivot.map((p: any) => `<tr>
          ${sTD(`<span style="font-weight:600;">${esc(p.nom)}</span>`)}
          ${p.cells.map((c: any) => sTD(c.n < 0 ? '<span style="color:#e2e8f0;">·</span>' : `<span title="${esc(c.t)}">${nivChip(c.n)}</span>`, 'center')).join('')}
        </tr>`).join('')}</tbody>
      </table>
    </div></div>` : ''))
  const eauReleves = (D.relevesEau || []).slice(0, 8)
  const pEnv = panelWrap('environnement', false,
    infoBox('<strong>Environnement / ICPE-DREAL</strong> — traitement de surface = rubrique <strong>2565</strong>. Registre des déchets (5 ans) + <strong>BSDD/Trackdéchets</strong>, autosurveillance de l\'eau, émissions air/bruit/énergie. Déclaration annuelle <strong>GEREP</strong>.') +
    panelHeader('fa-recycle', 'Registre des déchets', dechets.length, 'dechets', 'Nouveau déchet') +
    dataTable('dechets', dechets, colDechets) +
    `<div style="margin-top:18px;"></div>` +
    panelHeader('fa-droplet', 'Mesures environnementales (eau / air / bruit / énergie)', mesuresEnv.length, 'mesures-env', 'Nouvelle mesure') +
    dataTable('mesures-env', mesuresEnv, colMesures) +
    (eauReleves.length ? `<div style="margin-top:14px;font-size:.72rem;color:#64748b;"><i class="fas fa-link" style="margin-right:5px;"></i>Relevés d'eau OAS récents (source : module OAS) : ${eauReleves.map((r: any) => `${d10(r.date_releve)}${r.volume_m3 != null ? ' · ' + r.volume_m3 + ' m³' : ''}`).join(' · ')}</div>` : ''))
  const pAtex = panelWrap('atex', false,
    panelHeader('fa-burst', 'Zones ATEX', atex.length, 'atex', 'Nouvelle zone') +
    infoBox('<strong>ATEX</strong> (atmosphères explosives) — zonage (0/1/2 gaz, 20/21/22 poussières), matériel conforme par zone. Le <strong>DRPCE</strong> (document relatif à la protection contre les explosions) est obligatoire.') +
    dataTable('atex', atex, colAtex))
  const pVer = panelWrap('verifications', false,
    panelHeader('fa-clipboard-check', 'Vérifications périodiques (VGP)', verifs.length, 'verifications', 'Nouvelle vérification') +
    infoBox('Échéancier des <strong>vérifications générales périodiques</strong> obligatoires : levage, électrique, incendie, ESP, portes/portails, racks, ventilation. Échéances dépassées surlignées en rouge.') +
    dataTable('verifications', verifs, colVerifs))
  const certHabSummary = (() => {
    const aRenouv = certifications.filter((c: any) => c.statut === 'a_renouveler' || c.statut === 'expire').length + habilitations.filter((h: any) => h.statut === 'a_renouveler' || h.statut === 'expire').length
    return `<div style="margin-top:14px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:10px 14px;font-size:.74rem;color:#1e40af;"><i class="fas fa-graduation-cap" style="margin-right:6px;"></i>${certifications.length} certifications + ${habilitations.length} habilitations (module RH) · <strong>${aRenouv}</strong> à renouveler / expirées.</div>`
  })()
  const pForm = panelWrap('formations', false,
    panelHeader('fa-graduation-cap', 'Formations sécurité requises', formReq.length, 'formations-requises', 'Nouveau besoin') +
    infoBox('Matrice des <strong>formations obligatoires</strong> par poste (accueil, SST, habilitation électrique, CACES, ATEX, gestes & postures…). Les enregistrements réels sont gérés dans <strong>RH › Habilitations/Certifications</strong>.') +
    dataTable('formations-requises', formReq, colFormReq) +
    certHabSummary +
    formationMatrix(salaries, formReq, certifications) +
    `<div style="margin-top:18px;"></div>` +
    panelHeader('fa-person-running', 'Exercices d\'évacuation / incendie', exercices.length, 'exercices', 'Nouvel exercice') +
    dataTable('exercices', exercices, colExercices))
  const pPrev = panelWrap('prevention', false,
    panelHeader('fa-people-arrows', 'Plans de prévention & permis', plans.length, 'plans-prevention', 'Nouveau document') +
    infoBox('<strong>Plans de prévention</strong> (entreprises extérieures, décret 92-158), <strong>protocoles de sécurité</strong> chargement/déchargement et <strong>permis de feu</strong> (travaux par point chaud).') +
    dataTable('plans-prevention', plans, colPlans))
  const pRse = panelWrap('rse', false,
    panelHeader('fa-leaf', 'Indicateurs RSE', rse.length, 'rse', 'Nouvel indicateur') +
    infoBox('Indicateurs <strong>sociaux</strong> (accidentologie, absentéisme, index égalité F/H, OETH), <strong>environnementaux</strong> (eau, énergie, déchets valorisés, GES) et <strong>gouvernance</strong> (achats responsables). Base ISO 26000.') +
    dataTable('rse', rse, colRse))
  // Les obligations « environnement » (ICPE/14001/RSE/26000/ATEX) vivent désormais dans le service Environnement.
  const ENV_CONF_DOMAINES = ['icpe', 'iso14001', 'rse', 'iso26000', 'atex']
  const confSec = conformite.filter((x: any) => !ENV_CONF_DOMAINES.includes(String(x.domaine)))
  // Onglet « Conformité & Audit ISO 45001 » — sous-navigation dédiée (façon Qualité/Environnement)
  const bodyVeilleSec = panelHeader('fa-scale-balanced', 'Conformité réglementaire (veille SST)', confSec.length, 'conformite', 'Nouvelle obligation')
    + infoBox('<strong>Matrice de conformité Sécurité / SST</strong> (Code du travail, REACH-CLP, risque chimique, ISO 45001, ISO 9001, EN 9100). Sert de checklist d\'audit inspection du travail / CARSAT. <em>La conformité environnementale (ICPE, ISO 14001, ATEX, RSE) est dans le service Environnement.</em>')
    + dataTable('conformite', confSec, colConf)
  // Veille réglementaire = onglet de PREMIER NIVEAU (registre d'obligations), séparé de l'audit.
  const pVeille = panelWrap('veille', false, bodyVeilleSec)

  // Audit = EXACTEMENT les 4 sous-onglets standard de la Qualité (Programme, Constats & plans
  // d'action, Grilles, Référentiels). Aucun extra : tout ce qui n'est pas le cycle d'audit vit
  // en onglet de premier niveau. Même structure dans Qualité, Sécurité et Environnement.
  const pAudit = panelWrap('audit', false,
    panelAudit([], auditProg, auditGrilles, auditQuestions, auditAuto, [], {
      domaine: 'securite',
      titre: 'Audit Conformité — ISO 45001 (programme commun Qualité)',
      nu: true,
    }))
  const pAC = panelWrap('actions', false,
    panelHeader('fa-screwdriver-wrench', 'Actions correctives & 5 Pourquoi', actionsCorr.length, 'actions-correctives', 'Nouvelle action') +
    infoBox('<strong>Actions correctives (AC)</strong>, <strong>plans d\'action correctives (PAC)</strong> et <strong>situations dangereuses (SD)</strong> issues du terrain. Analyse de cause par la méthode des <strong>5 Pourquoi</strong> jusqu\'à la cause racine, puis action d\'éradication avec pilote et délai.') +
    dataTable('actions-correctives', actionsCorr, colAC))
  const pFlash = panelWrap('flash', false,
    panelHeader('fa-bolt', 'Flash Sécurité', flash.length, 'flash', 'Nouveau flash') +
    infoBox('<strong>Flash Sécurité</strong> — alertes terrain diffusées à l\'ensemble du personnel (consigne, situation à risque, retour d\'expérience). Court, visuel, daté et tracé jusqu\'à clôture.') +
    dataTable('flash', flash, colFlash))
  // Matrice EPI × zone (Lot 4) + bonnes pratiques (Lot 5)
  const ezKey: Record<string, any> = {}
  for (const r of epiZone) ezKey[String(r.zone) + '|' + String(r.epi)] = r
  const ezHead = `<th style="${TH}text-align:left;">EPI \\ Zone</th>` + ZONES_ATELIER.map((z) => `<th style="${TH}text-align:center;" title="${esc(z[1])}"><div style="font-weight:800;">${esc(z[0])}</div><div style="font-size:.6rem;color:#94a3b8;font-weight:400;max-width:78px;margin:0 auto;line-height:1.1;">${esc(z[1])}</div></th>`).join('')
  const ezBody = EPI_ATELIER.map((epi, ei) => `<tr style="border-bottom:1px solid #f1f5f9;">
      <td style="${TD}font-weight:700;color:#374151;white-space:nowrap;">${esc(epi)}</td>` +
    ZONES_ATELIER.map((z) => {
      const r = ezKey[String(z[0]) + '|' + epi]
      const ob = r ? r.obligatoire !== false : false
      return `<td onclick="ezToggle(this,'${esc(z[0])}',${ei})" data-ez="1" data-zone="${esc(z[0])}" data-ei="${ei}" style="${TD}text-align:center;" title="${esc(epi)} — zone ${esc(z[0])}">${ob ? '<span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;background:#fee2e2;color:#b91c1c;font-weight:800;">✓</span>' : '<span style="color:#e2e8f0;font-size:1rem;">—</span>'}</td>`
    }).join('') + `</tr>`).join('')
  const consignesHtml = '<ol style="margin:0;padding-left:20px;font-size:.82rem;color:#374151;line-height:1.7;">' + CONSIGNES_SECURITE.map((c) => `<li>${esc(c)}</li>`).join('') + '</ol>'
  const pEpiZone = panelWrap('epi-zone', false,
    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;"><span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas fa-helmet-safety" style="color:${ORANGE};margin-right:7px;"></i>EPI obligatoires par zone</span><span id="ez-hint" style="color:#94a3b8;font-size:.74rem;">Cliquez « Modifier la matrice » pour éditer.</span><span style="margin-left:auto;display:flex;gap:8px;"><button id="ez-btn-edit" onclick="ezEdit()" style="background:${ORANGE};color:white;border:none;border-radius:8px;padding:7px 13px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-pen" style="margin-right:5px;"></i>Modifier la matrice</button><button id="ez-btn-cancel" onclick="ezCancel()" style="display:none;background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:7px 13px;font-weight:700;cursor:pointer;font-size:.78rem;">Annuler</button><button id="ez-btn-save" onclick="ezSave()" style="display:none;background:#16a34a;color:white;border:none;border-radius:8px;padding:7px 13px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-save" style="margin-right:5px;"></i>Sauvegarder</button></span></div>` +
    infoBox('<strong>Matrice EPI × zone</strong> (doc « Obligations sécurité atelier ») — équipements de protection obligatoires par zone de travail (Z1→Z7, A). Cliquez <strong>« Modifier la matrice »</strong>, éditez les cases, puis <strong>« Sauvegarder »</strong> — rien n\'est enregistré tant que vous n\'avez pas sauvegardé.') +
    `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${ezHead}</tr></thead><tbody>${ezBody}</tbody></table></div></div>` +
    `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px 20px;"><div style="font-weight:800;color:#1e293b;font-size:.9rem;margin-bottom:10px;"><i class="fas fa-shield-halved" style="color:${ORANGE};margin-right:7px;"></i>Bonnes pratiques sécurité</div>${consignesHtml}</div>` +
    `<script>window.EZ_DATA=${sjX(epiZone.map((r: any) => ({ id: r.id, zone: r.zone, epi: r.epi, obligatoire: r.obligatoire })))};window.EZ_EPI=${sjX(EPI_ATELIER)};window.EZ_EDIT=false;window.EZ_DIRTY={};
      function ezMark(ob){ return ob?'<span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;background:#fee2e2;color:#b91c1c;font-weight:800;">\\u2713</span>':'<span style="color:#e2e8f0;font-size:1rem;">\\u2014</span>'; }
      function ezState(zone,epi){ var k=zone+'|'+epi; if(k in window.EZ_DIRTY) return window.EZ_DIRTY[k]; var row=window.EZ_DATA.find(function(x){return String(x.zone)===String(zone)&&String(x.epi)===String(epi);}); return row?(row.obligatoire!==false):false; }
      function ezToggle(td,zone,ei){ if(!window.EZ_EDIT) return; var epi=window.EZ_EPI[ei]; var k=zone+'|'+epi; window.EZ_DIRTY[k]=!ezState(zone,epi); td.innerHTML=ezMark(window.EZ_DIRTY[k]); }
      function ezRenderAll(){ document.querySelectorAll('td[data-ez]').forEach(function(td){ var z=td.getAttribute('data-zone'); var ei=parseInt(td.getAttribute('data-ei'),10); td.innerHTML=ezMark(ezState(z,window.EZ_EPI[ei])); }); }
      function ezButtons(){ var e=window.EZ_EDIT; var be=document.getElementById('ez-btn-edit'),bs=document.getElementById('ez-btn-save'),bc=document.getElementById('ez-btn-cancel'),h=document.getElementById('ez-hint'); if(be)be.style.display=e?'none':''; if(bs)bs.style.display=e?'':'none'; if(bc)bc.style.display=e?'':'none'; document.querySelectorAll('td[data-ez]').forEach(function(td){td.style.cursor=e?'pointer':'default';}); if(h)h.textContent=e?'Mode édition : cliquez les cases, puis Sauvegarder.':'Cliquez « Modifier la matrice » pour éditer.'; }
      function ezEdit(){ window.EZ_EDIT=true; ezButtons(); }
      function ezCancel(){ window.EZ_DIRTY={}; window.EZ_EDIT=false; ezRenderAll(); ezButtons(); }
      function ezSave(){ var keys=Object.keys(window.EZ_DIRTY); if(!keys.length){ window.EZ_EDIT=false; ezButtons(); return; }
        var ops=keys.map(function(k){ var i=k.indexOf('|'); var zone=k.slice(0,i), epi=k.slice(i+1); var val=window.EZ_DIRTY[k];
          var row=window.EZ_DATA.find(function(x){return String(x.zone)===String(zone)&&String(x.epi)===String(epi);});
          if(row){ return fetch('/api/securite/epi-zone/'+encodeURIComponent(row.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({obligatoire:val})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok) row.obligatoire=val; return j; }); }
          return fetch('/api/securite/epi-zone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entite:'Seem',zone:zone,epi:epi,obligatoire:val})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok&&j.data) window.EZ_DATA.push({id:j.data.id,zone:zone,epi:epi,obligatoire:val}); return j; });
        });
        Promise.all(ops).then(function(res){ var ko=res.filter(function(j){return !(j&&j.ok);}).length; window.EZ_DIRTY={}; window.EZ_EDIT=false; ezButtons(); if(ko) pushNotif('err','fa-exclamation-triangle',ko+' modification(s) en échec.',5000); else pushNotif('ok','fa-save','Matrice EPI enregistrée.',3000); }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); });
      }<\/script>`)

  // 9 onglets — certains regroupent plusieurs panneaux empilés (cf. SEC_GROUPS côté client).
  // « Veille réglementaire » est un onglet À PART de « Audit Conformité » : la veille est un
  // registre d'obligations, l'audit est un cycle programme→constat→plan d'action. Les mélanger
  // (ancienne organisation) obligeait à deviner que la veille vivait sous l'onglet Audit.
  const TABS = [
    ['duer', 'DUER / Risques', 'fa-clipboard-list'],
    ['evenements', 'Événements', 'fa-user-injured'],
    ['epi', 'EPI', 'fa-helmet-safety'],
    ['chimie', 'Chimie / FDS', 'fa-flask-vial'],
    ['controles', 'Contrôles & prévention', 'fa-clipboard-check'],
    ['veille', 'Veille réglementaire', 'fa-scale-balanced'],
    ['audit', 'Audit Conformité', 'fa-shield-alt'],
    ['referentiels', 'Référentiels', 'fa-book'],
    ['dashboard', 'Tableau de bord', 'fa-gauge-high'],
  ]

  // Petits compteurs affichés sur les onglets-listes (nb d'éléments accessibles dans l'onglet ;
  // les onglets Référentiels et Tableau de bord n'ont pas de badge car ce ne sont pas des listes).
  const TAB_BADGE: Record<string, number> = {
    duer: risques.length,
    evenements: incidents.length + actionsCorr.length + flash.length,
    epi: epiCat.length + epiDot.length,
    chimie: chimiques.length,
    controles: verifs.length + formReq.length + exercices.length + plans.length,
    veille: confSec.length,
    audit: auditProgDomaine(auditProg, 'securite').length,   // MÊME périmètre que le panneau (filtré ISO 45001)
  }

  // données de référence injectées dans le client
  const chimOpts = chimiques.map((c: any) => ({ id: c.id, nom: c.nom || c.id }))
  const salOpts = salaries.map((s: any) => ({ id: s.id, nom: `${s.prenom || ''} ${s.nom || ''}`.trim() || s.id, entite: s.entite || '' }))
  const machOpts = machines.map((m: any) => ({ id: m.id, nom: m.nom || m.code || m.id }))
  const fournOpts = fournisseurs.map((f: any) => ({ id: f.id, nom: f.nom || f.id }))
  const epiOpts = epiCat.map((e: any) => ({ id: e.id, nom: e.nom || e.id }))
  // ⚠ SEC_ROWS DOIT refléter l'ORDRE RENDU (secOpen indexe par position) : on passe les mêmes
  // tableaux que ceux donnés à dataTable — expoListRows (re-trié LIVE) et confSec (filtré non-env).
  const allRows = {
    risques, incidents, 'epi-catalogue': epiCat, 'epi-dotations': epiDot, chimiques, 'exposition-chimique': expoListRows, dechets,
    'mesures-env': mesuresEnv, atex, verifications: verifs, 'formations-requises': formReq,
    exercices, 'plans-prevention': plans, rse, conformite: confSec, 'actions-correctives': actionsCorr, flash,
  }

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">
    ${serviceHeader({
      icon: 'fa-helmet-safety', color: ORANGE, darkBg: DARK,
      title: 'Service Sécurité', subtitle: 'HSE · Santé-Sécurité au travail · DUER · EPI · Risque chimique · ISO 45001',
      tabs: TABS.map(([id, lbl, ic]) => ({ id, label: lbl, icon: ic, badge: (TAB_BADGE as any)[id] || undefined })),
      switchFn: 'secShowTab', tabIdPrefix: 'sec-tab', activeId: 'duer',
    })}
    <div style="padding:22px 30px;">
      ${pDuer}${pInc}${pAC}${pFlash}${pEpi}${pEpiZone}${pChim}${pRisqueChim}${pExpo}${pVer}${pForm}${pPrev}${pVeille}${pAudit}${referentielsPanel('sec-panel-referentiels', true)}${pDash}
    </div>
  </div>

  <div id="sec-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:26px;max-width:640px;width:92%;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="sec-modal-content"></div>
    </div>
  </div>

  ${demandeAchatModal('Sécurité', ORANGE, fournisseurs.map((f: any) => ({ id: f.id, nom: f.nom })))}

  <script>
  var SEC_TABS=${sjX(TABS.map(t => t[0]))};
  var SEC_GROUPS={duer:['duer'],evenements:['incidents','actions','flash'],epi:['epi','epi-zone'],chimie:['chimie','risque-chimique','exposition-chimique'],controles:['verifications','formations','prevention'],veille:['veille'],audit:['audit'],referentiels:['referentiels'],dashboard:['dashboard']};
  function secShowTab(id){
    Object.keys(SEC_GROUPS).forEach(function(g){ SEC_GROUPS[g].forEach(function(pid){ var p=document.getElementById('sec-panel-'+pid); if(p) p.style.display='none'; }); });
    (SEC_GROUPS[id]||[id]).forEach(function(pid){ var p=document.getElementById('sec-panel-'+pid); if(p) p.style.display='block'; });
    SEC_TABS.forEach(function(t){ var b=document.getElementById('sec-tab-'+t); if(b) b.classList.toggle('active',t===id); });
  }
  function secFilter(tableId,q){ var tbl=document.getElementById(tableId); if(!tbl)return; var lq=(q||'').toLowerCase().trim(); tbl.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=(!lq||tr.textContent.toLowerCase().indexOf(lq)>=0)?'':'none'; }); }
  function duerYear(y){ y=String(y); var t=document.getElementById('sec-tbl-risques'); if(!t)return; t.querySelectorAll('tbody tr').forEach(function(tr){ var a=tr.getAttribute('data-annee'); tr.style.display=(!a||a===y)?'':'none'; }); var nx=document.getElementById('duer-next'); if(nx)nx.textContent=(parseInt(y,10)+1); }
  async function duerCloner(){ var sel=document.getElementById('duer-annee'); var y=sel?parseInt(sel.value,10):(new Date().getFullYear()); if(!y){alert('Sélectionnez une année.');return;} if(!await appConfirm('Générer le DUERP '+(y+1)+' à partir de '+y+' ?\\n\\nLes dangers et la cotation sont reconduits ; le plan d\\'action (PAPRIPACT), le statut et les échéances repartent à zéro pour le nouvel exercice.')) return; fetch('/api/securite/duer/cloner-annee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:y,cible:y+1})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ alert((j&&j.error)||'Échec du clone.'); return; } alert('DUERP '+(y+1)+' créé : '+(j.count||0)+' risques reconduits.'); softReload(); }).catch(function(){ alert('Erreur réseau.'); }); }
  window.addEventListener('DOMContentLoaded',function(){ var s=document.getElementById('duer-annee'); if(s) duerYear(s.value); });
  // Deep-link depuis la maquette bâtiment : #sectab=<groupe>&hi=<id> (ligne) ou &hiz=<zone> (colonne matrice EPI).
  function _secFlash(el){ if(!el) return; var o=el.style.background; el.style.transition='background .4s'; el.style.background='#fef9c3'; setTimeout(function(){ el.style.background=o||''; },2800); }
  window.addEventListener('DOMContentLoaded',function(){ try{
    var h=location.hash||''; var mt=/sectab=([a-z-]+)/.exec(h); if(mt&&SEC_GROUPS[mt[1]]) secShowTab(mt[1]);
    var mi=/[?&#]hi=([^&]+)/.exec(h), mz=/[?&#]hiz=([^&]+)/.exec(h);
    setTimeout(function(){ try{
      if(mi){ var id=decodeURIComponent(mi[1]).replace(/["'<>\\\\]/g,''); var row=document.querySelector('[data-rowid="'+id+'"]'); if(row){ row.scrollIntoView({behavior:'smooth',block:'center'}); _secFlash(row); } }
      if(mz){ var zc=decodeURIComponent(mz[1]).replace(/["'<>\\\\]/g,''); var cells=document.querySelectorAll('td[data-zone="'+zc+'"]'); if(cells.length){ cells[0].scrollIntoView({behavior:'smooth',block:'center'}); cells.forEach(_secFlash); } }
    }catch(e){} },350);
  }catch(e){} });

  // Export PDF d'une fiche FDS (résumé interne) par produit chimique — via fenêtre d'impression.
  function fdsPdf(i){
    var p=(SEC_ROWS['chimiques']||[])[i]; if(!p){ pushNotif('err','fa-ban','Produit introuvable.'); return; }
    function e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function arr(a){ return Array.isArray(a)?a:(a?[a]:[]); }
    var H=arr(p.mentions_danger), PIC=arr(p.pictogrammes);
    var today=new Date().toLocaleDateString('fr-FR');
    var dangers=H.length?'<ul style="margin:6px 0;padding-left:18px;">'+H.map(function(x){return '<li>'+e(x)+'</li>';}).join('')+'</ul>':'<span style="color:#94a3b8;">Non renseignées</span>';
    var pic=PIC.length?PIC.map(function(x){var c=String(x).toUpperCase();return CLP_VB[c]?('<span title="'+c+'" style="display:inline-block;width:48px;height:48px;vertical-align:middle;margin:2px;">'+clpSvg(c)+'</span>'):('<span class="pic">'+e(x)+'</span>');}).join(' '):'<span style="color:#94a3b8;">—</span>';
    function row(l,v){ return '<tr><td class="l">'+l+'</td><td>'+(v?e(v):'<span style="color:#94a3b8;">—</span>')+'</td></tr>'; }
    var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>FDS '+e(p.nom||'')+'</title>'+
      '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:36px;color:#1e293b;font-size:13px;}'+
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c2410c;padding-bottom:14px;margin-bottom:14px;}'+
      '.hd h1{margin:0;font-size:20px;color:#c2410c;letter-spacing:.5px;}.soc{text-align:right;font-size:12px;color:#475569;}'+
      'h2{font-size:13px;color:#c2410c;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #fed7aa;padding-bottom:4px;margin:16px 0 8px;}'+
      'table.kv{width:100%;border-collapse:collapse;}table.kv td{padding:5px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top;}td.l{width:190px;color:#64748b;font-weight:bold;font-size:11px;text-transform:uppercase;}'+
      '.pic{display:inline-block;border:1.5px solid #c2410c;color:#c2410c;border-radius:6px;padding:2px 8px;font-weight:bold;font-size:12px;margin:2px;}'+
      '.cmr{display:inline-block;background:#fee2e2;color:#b91c1c;border-radius:6px;padding:3px 10px;font-weight:bold;}'+
      '.ft{margin-top:28px;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px;}'+
      '@page{size:A4 portrait;margin:12mm;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}}</style></head><body>'+CLP_DEFS+
      '<div class="hd">'+BRAND_BLOCK+
      '<div class="soc"><div style="font-size:15px;font-weight:bold;color:'+BRAND_BLEU+';">FICHE PRODUIT CHIMIQUE</div><div style="font-size:12px;color:#64748b;">Résumé FDS — usage interne</div><div style="font-size:11px;color:#94a3b8;margin-top:3px;">Site '+e(p.entite||'Seem')+' · Édité le '+today+'</div></div></div>'+
      '<div style="font-size:22px;font-weight:bold;margin-bottom:4px;">'+e(p.nom||'—')+'</div>'+
      '<h2>Identification</h2><table class="kv">'+
      row('Réf. FDS', p.fds_ref)+row('N° identification', p.num_identification)+row('Réf. produit', p.ref_stock)+row('N° CAS', p.cas)+row('Fabricant / marque', p.fournisseur_nom)+row('État physique', p.etat)+row('Secteur / zone', p.zone_stockage)+
      '</table>'+
      '<h2>Dangers (CLP / SGH)</h2><table class="kv">'+
      '<tr><td class="l">Pictogrammes</td><td>'+pic+'</td></tr>'+
      '<tr><td class="l">Mentions H / P</td><td>'+dangers+'</td></tr>'+
      '<tr><td class="l">CMR</td><td>'+(p.cmr?'<span class="cmr">'+e(p.cmr)+'</span>':'<span style="color:#16a34a;">Non classé CMR</span>')+'</td></tr>'+
      '<tr><td class="l">VLEP</td><td>'+(p.vlep?e(p.vlep):'<span style="color:#94a3b8;">—</span>')+'</td></tr>'+
      '</table>'+
      '<h2>Stockage &amp; utilisation</h2><table class="kv">'+
      row('Quantité', (p.quantite!=null&&p.quantite!==''?String(p.quantite)+' '+(p.unite||''):''))+row('Statut', p.statut)+row('Compatibilités / usage', p.compatibilites)+row('Rétention', p.retention?'Oui':'Non')+
      '</table>'+
      '<div class="ft">Document interne généré par l\\'ERP Seem Semrac le '+today+'. Ce résumé ne remplace pas la Fiche de Données de Sécurité officielle du fournisseur'+(p.fds_ref?(' (réf. '+e(p.fds_ref)+')'):'')+', qui fait foi pour toutes les mesures de prévention et d\\'urgence.</div>'+
      '<script>window.onload=function(){window.print();}<\\/script></body></html>';
    var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour l\\'export PDF.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    pushNotif('ok','fa-file-pdf','Fiche FDS '+e(p.nom||'')+' — fenêtre d\\'impression ouverte (Enregistrer en PDF).',4500);
  }

  // Export PDF de la DUERP (exercice sélectionné) — via fenêtre d'impression.
  function duerPdf(){
    var rows=(SEC_ROWS['risques']||[]);
    var yEl=document.getElementById('duer-annee'); var y=yEl?String(yEl.value):'';
    var list=y?rows.filter(function(r){return String(r.annee)===y;}):rows;
    function e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    var today=new Date().toLocaleDateString('fr-FR');
    var body=list.map(function(r,i){
      var g=Number(r.gravite)||0, f=Number(r.frequence)||0, crit=(Number(r.criticite)||(g*f));
      var prio=r.priorite||(crit>=9?1:crit>=4?2:3);
      return '<tr>'+
        '<td class="c">'+(i+1)+'</td>'+
        '<td>'+e(r.unite_travail)+'</td>'+
        '<td>'+e(r.famille)+'</td>'+
        '<td>'+e(r.danger)+'</td>'+
        '<td class="c">'+(r.gravite!=null?e(r.gravite):'')+'</td>'+
        '<td class="c">'+(r.frequence!=null?e(r.frequence):'')+'</td>'+
        '<td class="c"><b>'+crit+'</b></td>'+
        '<td class="c">P'+prio+'</td>'+
        '<td>'+e(r.mesures_existantes)+'</td>'+
        '<td>'+e(r.mesures_prevues)+'</td>'+
        '<td>'+e(r.responsable)+'</td>'+
        '<td class="c">'+e(r.echeance)+'</td>'+
        '</tr>';
    }).join('');
    if(!body) body='<tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:14px;">Aucun risque pour cet exercice.</td></tr>';
    var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>DUERP '+e(y)+'</title>'+
      '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:22px;color:#1e293b;font-size:10.5px;}'+
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c2410c;padding-bottom:12px;margin-bottom:12px;}'+
      '.hd h1{margin:0;font-size:19px;color:#c2410c;letter-spacing:.5px;}.soc{text-align:right;font-size:11px;color:#475569;}'+
      'table{width:100%;border-collapse:collapse;}th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:top;}'+
      'th{background:#fff7ed;color:#9a3412;font-size:8.5px;text-transform:uppercase;letter-spacing:.3px;}td.c{text-align:center;}'+
      '.ft{margin-top:16px;font-size:9px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;}'+
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}@page{size:A4 landscape;margin:8mm;}}</style></head><body>'+
      '<div class="hd">'+BRAND_BLOCK+
      '<div class="soc"><div style="font-size:15px;font-weight:bold;color:'+BRAND_BLEU+';">DUERP '+e(y)+'</div><div style="font-size:12px;color:#64748b;">Document Unique d\\'Évaluation des Risques Professionnels</div><div style="font-size:11px;color:#94a3b8;margin-top:3px;">Édité le '+today+' · '+list.length+' risque(s)</div></div></div>'+
      '<table><thead><tr><th>#</th><th>Unité de travail</th><th>Famille</th><th>Danger</th><th>G</th><th>F</th><th>Crit.</th><th>Prio</th><th>Mesures existantes</th><th>Mesures prévues (PAPRIPACT)</th><th>Responsable</th><th>Échéance</th></tr></thead><tbody>'+body+'</tbody></table>'+
      '<div class="ft">Document interne généré par l\\'ERP Seem Semrac le '+today+'. DUERP — Code du travail R.4121-1. Cotation gravité × fréquence.</div>'+
      '<script>window.onload=function(){window.print();}<\\/script></body></html>';
    var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour l\\'export PDF.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    pushNotif('ok','fa-file-pdf','DUERP '+e(y)+' — fenêtre d\\'impression ouverte (Enregistrer en PDF).',4500);
  }
  // Rapport d'évaluation du risque chimique (SEIRICH) — PDF de marque via fenêtre d'impression.
  function risqueChimiquePdf(){
    function e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    var today=new Date().toLocaleDateString('fr-FR');
    function nivCell(n){ var m=SEIR_NIV[n]||SEIR_NIV[0]; return '<td class="c" style="background:'+m[0]+';color:'+m[1]+';font-weight:bold;">'+e(m[2])+'<\\/td>'; }
    var inv=SEIRICH_INV||[], expo=(SEC_ROWS['exposition-chimique']||[]), acts=(SEC_ROWS['actions-correctives']||[]).filter(function(a){return a.source_type==='exposition';});
    // Tri par gravité
    var invS=inv.slice().sort(function(a,b){return (b.nMax-a.nMax)||(b.nS-a.nS);});
    var nElv=expo.filter(function(x){return x.niveau_max===3;}).length, nSig=expo.filter(function(x){return x.significatif;}).length;
    var invBody=invS.map(function(p){ return '<tr><td>'+e(p.nom)+(p.cmr?' <span class="cmr">CMR<\\/span>':'')+'<\\/td><td>'+(p.h&&p.h.length?e(p.h.join(' ')):'—')+'<\\/td><td>'+(p.pic&&p.pic.length?e(p.pic.join(' ')):'—')+'<\\/td>'+nivCell(p.nS)+nivCell(p.nI)+nivCell(p.nE)+nivCell(p.nMax)+'<\\/tr>'; }).join('');
    if(!invBody) invBody='<tr><td colspan="7" style="text-align:center;color:#94a3b8;">Aucun produit chimique inventorié.<\\/td><\\/tr>';
    var expoBody=expo.map(function(x){ return '<tr><td>'+e(x.produit_nom||'')+'<\\/td><td>'+e(x.unite_travail||'')+(x.tache?(' / '+e(x.tache)):'')+'<\\/td><td>'+e(x.procede||'')+'<\\/td><td>'+e(x.protection_collective||'')+(x.epi?' +EPI':'')+'<\\/td>'+nivCell(x.niv_sante||0)+nivCell(x.niv_inc||0)+nivCell(x.niv_env||0)+nivCell(x.niveau_max||0)+'<td>'+(x.atex?e(x.zone_atex||'ATEX'):'')+'<\\/td><\\/tr>'; }).join('');
    if(!expoBody) expoBody='<tr><td colspan="9" style="text-align:center;color:#94a3b8;">Aucune situation d\\'exposition saisie.<\\/td><\\/tr>';
    var actBody=acts.map(function(a){ return '<tr><td>'+e(a.type||'')+'<\\/td><td>'+e(a.origine||'')+'<\\/td><td>'+e(a.description||'')+'<\\/td><td>'+e(a.responsable||'')+'<\\/td><td>'+e(a.date_echeance||'')+'<\\/td><td>'+e(a.statut||'')+'<\\/td><\\/tr>'; }).join('');
    if(!actBody) actBody='<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Aucune action corrective liée à une exposition.<\\/td><\\/tr>';
    var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Évaluation du risque chimique SEIRICH<\\/title>'+
      '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:22px;color:#1e293b;font-size:10.5px;}'+
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:12px;margin-bottom:12px;}'+
      '.soc{text-align:right;font-size:11px;color:#475569;}h2{font-size:12px;color:'+BRAND_VIOLET+';text-transform:uppercase;letter-spacing:.5px;margin:16px 0 6px;border-bottom:1px solid #e9d5ff;padding-bottom:3px;}'+
      'table{width:100%;border-collapse:collapse;margin-bottom:6px;}th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:top;}'+
      'th{background:#faf5ff;color:'+BRAND_VIOLET+';font-size:8.5px;text-transform:uppercase;letter-spacing:.3px;}td.c{text-align:center;}'+
      '.cmr{background:#fee2e2;color:#b91c1c;border-radius:4px;padding:0 5px;font-weight:bold;font-size:8px;}'+
      '.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:6px 10px;border-radius:6px;font-size:9.5px;margin:8px 0;}'+
      '.ft{margin-top:16px;font-size:9px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;}'+
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}@page{size:A4 landscape;margin:8mm;}}<\\/style><\\/head><body>'+
      '<div class="hd">'+BRAND_BLOCK+'<div class="soc"><div style="font-size:15px;font-weight:bold;color:'+BRAND_VIOLET+';">ÉVALUATION DU RISQUE CHIMIQUE<\\/div><div>Méthode SEIRICH — INRS ND 2233 / R 409<\\/div><div>'+today+' · '+inv.length+' produit(s) · '+expo.length+' situation(s)<\\/div><\\/div><\\/div>'+
      '<div class="warn"><b>Cotation INDICATIVE — à valider.<\\/b> Cote par défaut (méthode simplifiée INRS) à faire valider par le référent QHSE et à recouper avec le logiciel SEIRICH. Situations niveau élevé : '+nElv+' · expositions significatives (AES/CMR) : '+nSig+'.<\\/div>'+
      '<h2>1 · Inventaire coté (danger des produits)<\\/h2><table><thead><tr><th>Produit<\\/th><th>Codes H<\\/th><th>Pictogrammes<\\/th><th>Santé<\\/th><th>Incendie<\\/th><th>Environ.<\\/th><th>Niveau max<\\/th><\\/tr><\\/thead><tbody>'+invBody+'<\\/tbody><\\/table>'+
      '<h2>2 · Expositions par situation de travail (3 axes)<\\/h2><table><thead><tr><th>Produit<\\/th><th>Unité de travail / tâche<\\/th><th>Procédé<\\/th><th>Protection<\\/th><th>Santé<\\/th><th>Incendie<\\/th><th>Environ.<\\/th><th>Retenu<\\/th><th>ATEX<\\/th><\\/tr><\\/thead><tbody>'+expoBody+'<\\/tbody><\\/table>'+
      '<h2>3 · Plan d\\'actions (réduction des expositions)<\\/h2><table><thead><tr><th>Type<\\/th><th>Origine<\\/th><th>Action / constat<\\/th><th>Pilote<\\/th><th>Échéance<\\/th><th>Statut<\\/th><\\/tr><\\/thead><tbody>'+actBody+'<\\/tbody><\\/table>'+
      '<div class="ft">Document interne généré par l\\'ERP Seem Semrac le '+today+'. Évaluation du risque chimique — méthode simplifiée INRS ND 2233 / R 409 (SEIRICH). Alimente le volet chimique du DUER (Code du travail R.4412-1 sqq.). Cotation indicative à valider.<\\/div>'+
      '<script>window.onload=function(){window.print();}<\\/script><\\/body><\\/html>';
    var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour l\\'export PDF.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    pushNotif('ok','fa-file-pdf','Rapport risque chimique — fenêtre d\\'impression ouverte (Enregistrer en PDF).',4500);
  }

  var SEC_ROWS=${sjX(allRows)};
  var SEC_SAL=${sjX(salOpts)};
  var SEC_CHIM=${sjX(chimOpts)};
  var SEC_MACH=${sjX(machOpts)};
  var SEC_FOURN=${sjX(fournOpts)};
  var SEC_EPICAT=${sjX(epiOpts)};
  var SEC_ENT=[['Seem','Seem'],['Semrac','Semrac']];
  var CLP_ORDER=${sjX(CLP_ORDER)};
  var CLP_LABEL=${sjX(CLP_LABEL)};
  var CLP_VB=${sjX(CLP_VB)};
  var CLP_DEFS=${sjX(clpDefs())};
  var BRAND_BLOCK=${sjX(brandBlockHTML())}; var BRAND_BLEU=${sjX(BRAND.bleu)}; var BRAND_VIOLET=${sjX(BRAND.violet)};
  var SEIR_NIV=${sjX(SEIRICH_NIVEAUX)};
  var SEIRICH_INV=${sjX(chimiques.map((c: any) => { const r = computeRisqueChimique(c); return { nom: c.nom || '', ref: c.ref_stock || '', h: r.hCodes, pic: Array.isArray(c.pictogrammes) ? c.pictogrammes : [], cmr: c.cmr || '', nS: r.niveauSante, nI: r.niveauIncendie, nE: r.niveauEnv, nMax: r.niveauMax, dq: r.dataQuality } }))};
  function clpSvg(c){ c=String(c).toUpperCase(); return CLP_VB[c]?('<svg viewBox="'+CLP_VB[c]+'" width="100%" height="100%"><use href="#ghs-'+c+'" xlink:href="#ghs-'+c+'"/></svg>'):''; }
  function togglePicto(t){ var on=t.classList.toggle('on'); t.style.borderColor=on?'#ea580c':'#e2e8f0'; t.style.background=on?'#fff7ed':'#fff'; t.style.opacity=on?'1':'.5'; }

  var DUER_FAMILLES=${sjX(DUER_FAMILLES)};
  var UT_CANONIQUES=${sjX(UT_CANONIQUES)};
  var SECTEURS_ATELIER=${sjX(SECTEURS_ATELIER)};
  var SEC_FORMS={
    'risques':{title:'Risque (DUER)',fields:[
      {k:'annee',label:'Année (exercice)',type:'number'},
      {k:'famille',label:'Famille de risque',type:'select',options:DUER_FAMILLES.map(function(x){return [x,x];})},
      {k:'unite_travail',label:'Unité de travail',req:true,type:'datalist',options:UT_CANONIQUES},{k:'zone',label:'Zone / secteur',type:'datalist',options:SECTEURS_ATELIER},
      {k:'danger',label:'Danger',req:true},{k:'risque',label:'Risque résiduel'},
      {k:'situation',label:'Situation dangereuse',type:'textarea',full:true},
      {k:'gravite',label:'Gravité (1-4)',type:'number'},{k:'frequence',label:'Fréquence (1-4)',type:'number'},{k:'maitrise',label:'Maîtrise (1-4)',type:'number'},
      {k:'mesures_existantes',label:'Mesures existantes',type:'textarea',full:true},
      {k:'mesures_prevues',label:'Mesures prévues (plan d\\'action)',type:'textarea',full:true},
      {k:'responsable',label:'Responsable'},{k:'echeance',label:'Échéance',type:'date'},
      {k:'statut',label:'Statut',type:'select',options:[['a_traiter','À traiter'],['en_cours','En cours'],['maitrise','Maîtrisé']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'actions-correctives':{title:'Action corrective (AC / PAC / SD)',fields:[
      {k:'numero',label:'N°',type:'number'},
      {k:'type',label:'Type',type:'select',options:[['AC','AC — Action corrective'],['PAC','PAC — Presque accident'],['SD','SD — Situation dangereuse']]},
      {k:'date_ouverture',label:'Date',type:'date'},{k:'origine',label:'Secteur',type:'datalist',options:SECTEURS_ATELIER},
      {k:'diffusion',label:'Diffusion'},
      {k:'description',label:'Constat / faits',type:'textarea',full:true},
      {k:'cause_racine',label:'Cause racine (5 Pourquoi)',type:'textarea',full:true},
      {k:'action',label:"Action(s) d'éradication",type:'textarea',full:true},
      {k:'responsable',label:'Pilote / délai'},{k:'date_echeance',label:'Échéance',type:'date'},
      {k:'efficacite',label:'Efficacité vérifiée'},
      {k:'statut',label:'Statut',type:'select',options:[['en_cours','En cours'],['solde','Soldé'],['annule','Annulé']]}]},
    'flash':{title:'Flash Sécurité',fields:[
      {k:'numero',label:'N°'},{k:'date',label:'Date',type:'date'},
      {k:'secteur',label:'Secteur',type:'datalist',options:SECTEURS_ATELIER},{k:'pilote',label:'Rédacteur'},
      {k:'evenement',label:'Description du flash',type:'textarea',full:true},
      {k:'mesures',label:'Mesures / consignes',type:'textarea',full:true},
      {k:'diffusion',label:'Diffusion'},
      {k:'statut',label:'Statut',type:'select',options:[['diffuse','Diffusé'],['en_cours','En cours'],['solde','Soldé'],['archive','À supprimer']]}]},
    'incidents':{title:'Accident / presqu\\'accident',fields:[
      {k:'type',label:'Type',type:'select',options:[['accident_travail','Accident du travail'],['accident_trajet','Accident de trajet'],['maladie_pro','Maladie professionnelle'],['presque_accident','Presqu\\'accident'],['situation_dangereuse','Situation dangereuse'],['soin','Soin / premiers secours']]},
      {k:'date_incident',label:'Date',type:'date'},{k:'heure',label:'Heure',type:'text'},
      {k:'salarie_id',label:'Salarié',type:'salarie',full:true},
      {k:'zone',label:'Zone / secteur',type:'datalist',options:SECTEURS_ATELIER},{k:'poste',label:'Poste'},
      {k:'partie_corps',label:'Partie du corps'},{k:'nature_lesion',label:'Nature de la lésion'},
      {k:'gravite',label:'Gravité',type:'select',options:[['Bénin','Bénin'],['Léger','Léger'],['Grave','Grave'],['Mortel','Mortel']]},
      {k:'avec_arret',label:'Avec arrêt',type:'checkbox'},{k:'jours_arret',label:'Jours d\\'arrêt',type:'number'},
      {k:'temoins',label:'Témoins'},{k:'declaration_cpam_date',label:'Décl. CPAM le',type:'date'},
      {k:'description',label:'Description',type:'textarea',full:true},
      {k:'premiers_secours',label:'Premiers secours',type:'textarea',full:true},
      {k:'analyse_causes',label:'Analyse des causes',type:'textarea',full:true},
      {k:'actions_correctives',label:'Actions correctives',type:'textarea',full:true},
      {k:'responsable',label:'Responsable'},
      {k:'statut',label:'Statut',type:'select',options:[['nouveau','Nouveau'],['enquete','Enquête'],['actions','Actions'],['clos','Clos']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'epi-catalogue':{title:'EPI (catalogue)',fields:[
      {k:'nom',label:'Désignation',req:true},
      {k:'categorie',label:'Catégorie',type:'select',options:[['tete','Tête'],['yeux','Yeux'],['audition','Audition'],['respiratoire','Voies respiratoires'],['mains','Mains'],['pieds','Pieds'],['corps','Corps'],['antichute','Antichute']]},
      {k:'norme_en',label:'Norme EN'},{k:'duree_vie_mois',label:'Durée de vie (mois)',type:'number'},
      {k:'ref_stock',label:'Réf. stock'},{k:'fournisseur_id',label:'Fournisseur',type:'fourn'},
      {k:'notes',label:'Notes',type:'textarea',full:true}]},
    'epi-dotations':{title:'Remise EPI / matériel',fields:[
      {k:'salarie_id',label:'Salarié',type:'salarie',full:true},
      {k:'epi_id',label:'EPI du catalogue (optionnel)',type:'epicat',full:true},
      {k:'epi_nom',label:'Fourniture / EPI (libre)',full:true},
      {k:'categorie',label:'Type',type:'select',options:[['epi','EPI'],['materiel','Matériel']]},
      {k:'taille',label:'Taille'},{k:'quantite',label:'Quantité',type:'number'},
      {k:'fournisseur_id',label:'Fournisseur',type:'fourn'},{k:'marque',label:'Marque'},
      {k:'reference',label:'Référence'},{k:'prix',label:'Prix (€)',type:'number'},
      {k:'date_remise',label:'Remis le',type:'date'},{k:'date_peremption',label:'Péremption',type:'date'},
      {k:'signature',label:'Signature obtenue',type:'checkbox'},
      {k:'statut',label:'Statut',type:'select',options:[['en_service','En service'],['a_renouveler','À renouveler'],['restitue','Restitué']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'chimiques':{title:'Produit chimique / FDS',fields:[
      {k:'nom',label:'Produit',req:true},
      {k:'fournisseur_id',label:'Fournisseur',type:'fourn',full:true},
      {k:'num_identification',label:'N° d\\'identification'},{k:'ref_stock',label:'Réf. produit (codes)'},{k:'etat',label:'État',type:'select',options:[['liquide','Liquide'],['solide','Solide'],['gaz','Gaz / aérosol']]},
      {k:'pictogrammes',label:'Pictogrammes CLP (cliquer pour sélectionner)',type:'pictos',full:true},
      {k:'mentions_danger',label:'Mentions de danger (H/P)',type:'list',full:true},
      {k:'cmr',label:'CMR (cat.)'},{k:'vlep',label:'VLEP'},
      {k:'fds_ref',label:'Réf. FDS'},{k:'fds_date',label:'Date FDS',type:'date'},
      {k:'fds_url',label:'Lien FDS (URL)',full:true},
      {k:'zone_stockage',label:'Zone de stockage'},{k:'retention',label:'Rétention',type:'checkbox'},
      {k:'compatibilites',label:'Compatibilités',type:'textarea',full:true},
      {k:'quantite',label:'Quantité',type:'number'},{k:'unite',label:'Unité'},
      {k:'statut',label:'Statut',type:'select',options:[['en_stock','En stock'],['en_commande','En commande'],['perime','Périmé']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'exposition-chimique':{title:'Exposition chimique (situation de travail)',fields:[
      {k:'produit_id',label:'Produit chimique',req:true,type:'chimique',full:true},
      {k:'unite_travail',label:'Unité de travail',req:true,type:'datalist',options:UT_CANONIQUES},
      {k:'zone',label:'Zone / secteur',type:'datalist',options:SECTEURS_ATELIER},
      {k:'tache',label:'Tâche exposante',full:true},
      {k:'procede',label:'Procédé / mise en œuvre',type:'select',options:[['clos_permanent','Clos en permanence (vase clos)'],['clos_ouvert','Clos ouvert régulièrement (bain, réacteur)'],['ouvert','À l\\'air libre (pinceau, trempage ouvert)'],['dispersif','Dispersif (pulvérisation, aérosol, poudre)']]},
      {k:'quantite_utilisee',label:'Quantité mise en œuvre',type:'number'},{k:'unite',label:'Unité',type:'select',options:[['g','g'],['kg','kg'],['t','t'],['mL','mL'],['L','L']]},
      {k:'frequence',label:'Fréquence / durée',type:'select',options:[['occasionnelle','Occasionnelle (< mensuel)'],['reguliere','Régulière courte (hebdo / < 30 min par jour)'],['quotidienne','Quotidienne (30 min – 2 h par jour)'],['permanente','Permanente (> 2 h par jour)']]},
      {k:'volatilite',label:'État physique / volatilité',type:'select',options:[['gaz','Gaz / aérosol'],['liquide_volatil','Liquide très volatil (solvant)'],['liquide_moyen','Liquide moyennement volatil'],['liquide_peu','Liquide peu volatil / pâteux'],['solide_poudre','Solide pulvérulent (poudre fine)'],['solide_grains','Solide granulé'],['solide_massif','Solide massif / en pièce']]},
      {k:'protection_collective',label:'Protection collective',type:'select',options:[['vase_clos','Vase clos / confinement'],['captage','Captage à la source'],['ventilation','Ventilation générale'],['aucune','Aucune']]},
      {k:'epi',label:'EPI adapté porté',type:'checkbox'},{k:'maintenance_ko',label:'Protection non entretenue',type:'checkbox'},
      {k:'issu_transformation',label:'Fumée / poussière (transformation matière)',type:'checkbox'},{k:'non_utilise_1an',label:'Non utilisé depuis ≥ 1 an',type:'checkbox'},
      {k:'rejet_milieu',label:'Rejet possible vers l\\'environnement',type:'checkbox'},
      {k:'observations',label:'Observations',type:'textarea',full:true}]},
    'dechets':{title:'Déchet (registre)',fields:[
      {k:'date_dechet',label:'Date',type:'date'},{k:'code_dechet',label:'Code déchet (nomenclature)'},
      {k:'designation',label:'Désignation',req:true,full:true},
      {k:'dangereux',label:'Dangereux',type:'checkbox'},
      {k:'quantite',label:'Quantité',type:'number'},{k:'unite',label:'Unité'},
      {k:'zone_producteur',label:'Zone productrice'},{k:'filiere',label:'Filière'},
      {k:'transporteur',label:'Transporteur'},{k:'exutoire',label:'Exutoire'},
      {k:'bsdd_num',label:'N° BSDD'},{k:'trackdechets_id',label:'ID Trackdéchets'},
      {k:'statut',label:'Statut',type:'select',options:[['enleve','Enlevé'],['en_attente','En attente']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'mesures-env':{title:'Mesure environnementale',fields:[
      {k:'type',label:'Type',type:'select',options:[['conso_eau','Consommation eau'],['rejet_eau','Rejet eau'],['emission_air','Émission air'],['bruit','Bruit'],['energie','Énergie']]},
      {k:'date_mesure',label:'Date',type:'date'},{k:'point_mesure',label:'Point de mesure'},
      {k:'parametre',label:'Paramètre'},{k:'valeur',label:'Valeur',type:'number'},{k:'unite',label:'Unité'},
      {k:'vle',label:'Valeur limite (VLE)',type:'number'},{k:'conforme',label:'Conforme',type:'checkbox'},
      {k:'organisme',label:'Organisme'},{k:'observations',label:'Observations',type:'textarea',full:true},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'atex':{title:'Zone ATEX',fields:[
      {k:'nom',label:'Nom de la zone',req:true},
      {k:'type_zone',label:'Type de zone',type:'select',options:[['0','0'],['1','1'],['2','2'],['20','20'],['21','21'],['22','22']]},
      {k:'localisation',label:'Localisation'},
      {k:'origine_risque',label:'Origine du risque',type:'select',options:[['gaz','Gaz / vapeur'],['poussiere','Poussière']]},
      {k:'substances',label:'Substances'},{k:'materiel_requis',label:'Matériel requis'},
      {k:'mesures',label:'Mesures de prévention',type:'textarea',full:true},
      {k:'date_revue',label:'Date de revue',type:'date'},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'verifications':{title:'Vérification périodique (VGP)',fields:[
      {k:'type',label:'Type',type:'select',options:[['levage','Levage'],['electrique','Électrique'],['incendie','Incendie'],['esp','ESP (sous pression)'],['portes','Portes/portails'],['racks','Racks'],['ventilation','Ventilation'],['atex','ATEX']]},
      {k:'equipement',label:'Équipement',req:true},{k:'machine_id',label:'Machine liée',type:'machine',full:true},
      {k:'organisme',label:'Organisme'},
      {k:'date_controle',label:'Date contrôle',type:'date'},{k:'date_prochaine',label:'Prochaine échéance',type:'date'},
      {k:'periodicite_mois',label:'Périodicité (mois)',type:'number'},
      {k:'resultat',label:'Résultat',type:'select',options:[['conforme','Conforme'],['observations','Avec observations'],['non_conforme','Non conforme']]},
      {k:'levee_reserves',label:'Levée des réserves',type:'textarea',full:true},
      {k:'rapport_url',label:'Lien rapport (URL)',full:true},
      {k:'statut',label:'Statut',type:'select',options:[['a_jour','À jour'],['a_prevoir','À prévoir'],['en_retard','En retard']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'formations-requises':{title:'Formation requise',fields:[
      {k:'poste',label:'Poste / famille',req:true},{k:'formation',label:'Formation',req:true},
      {k:'obligatoire',label:'Obligatoire',type:'checkbox'},{k:'periodicite_mois',label:'Périodicité (mois)',type:'number'},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'exercices':{title:'Exercice d\\'évacuation',fields:[
      {k:'type',label:'Type',type:'select',options:[['evacuation','Évacuation'],['incendie','Incendie'],['poi','POI']]},
      {k:'date_exercice',label:'Date',type:'date'},{k:'site',label:'Site'},
      {k:'nb_participants',label:'Participants',type:'number'},{k:'duree_min',label:'Durée (min)',type:'number'},
      {k:'scenario',label:'Scénario',type:'textarea',full:true},
      {k:'observations',label:'Observations',type:'textarea',full:true},
      {k:'conforme',label:'Conforme',type:'checkbox'},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'plans-prevention':{title:'Plan de prévention / permis',fields:[
      {k:'type',label:'Type',type:'select',options:[['plan_prevention','Plan de prévention'],['protocole_chargement','Protocole chargement'],['permis_feu','Permis de feu']]},
      {k:'entreprise_exterieure',label:'Entreprise extérieure'},{k:'operation',label:'Opération'},
      {k:'date_debut',label:'Début',type:'date'},{k:'date_fin',label:'Fin',type:'date'},
      {k:'risques',label:'Risques',type:'textarea',full:true},{k:'mesures',label:'Mesures',type:'textarea',full:true},
      {k:'signataires',label:'Signataires'},{k:'valide_par',label:'Validé par'},
      {k:'statut',label:'Statut',type:'select',options:[['en_cours','En cours'],['clos','Clos']]},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'rse':{title:'Indicateur RSE',fields:[
      {k:'periode',label:'Période (ex: 2026)'},
      {k:'categorie',label:'Catégorie',type:'select',options:[['social','Social'],['environnement','Environnement'],['gouvernance','Gouvernance']]},
      {k:'code',label:'Code'},{k:'libelle',label:'Libellé',req:true,full:true},
      {k:'valeur',label:'Valeur',type:'number'},{k:'unite',label:'Unité'},{k:'cible',label:'Cible',type:'number'},
      {k:'entite',label:'Site',type:'select',options:'ent'}]},
    'conformite':{title:'Obligation réglementaire',fields:[
      {k:'domaine',label:'Domaine',type:'select',options:[['travail','Code du travail'],['chimique','Risque chimique'],['iso45001','ISO 45001'],['iso9001','ISO 9001'],['en9100','EN 9100']]},
      {k:'obligation',label:'Obligation',req:true,full:true},
      {k:'reference_reglementaire',label:'Référence réglementaire',full:true},
      {k:'applicable',label:'Applicable',type:'checkbox'},
      {k:'statut',label:'Statut',type:'select',options:[['a_verifier','À vérifier'],['conforme','Conforme'],['partiel','Partiel'],['non_conforme','Non conforme'],['na','Non applicable']]},
      {k:'date_dernier_controle',label:'Dernier contrôle',type:'date'},{k:'date_echeance',label:'Échéance',type:'date'},
      {k:'responsable',label:'Responsable'},{k:'preuve_url',label:'Preuve (URL)',full:true},
      {k:'observations',label:'Observations',type:'textarea',full:true}]}
  };

  function escA(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function optsHtml(opts,val){
    var list=opts; if(opts==='ent')list=SEC_ENT;
    var out='<option value="">—</option>';
    list.forEach(function(o){ var v=Array.isArray(o)?o[0]:o; var l=Array.isArray(o)?o[1]:o; out+='<option value="'+escA(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+escA(l)+'</option>'; });
    return out;
  }
  function refSelect(items,val){ var out='<option value="">—</option>'; items.forEach(function(o){ out+='<option value="'+escA(o.id)+'"'+(String(val)===String(o.id)?' selected':'')+'>'+escA(o.nom)+'</option>'; }); return out; }
  var INP='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .65rem;font-size:.82rem;color:#374151;background:#f8fafc;outline:none;';
  var LAB='display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:.25rem;';
  function fldHtml(f,val){
    var id='secf-'+f.k, inp;
    if(f.type==='textarea') inp='<textarea id="'+id+'" rows="2" style="'+INP+'">'+escA(val)+'</textarea>';
    else if(f.type==='select') inp='<select id="'+id+'" style="'+INP+'">'+optsHtml(f.options,val)+'</select>';
    else if(f.type==='datalist'){ var lid=id+'-dl'; var dl='<datalist id="'+lid+'">'; (f.options||[]).forEach(function(o){ var v=Array.isArray(o)?o[1]:o; dl+='<option value="'+escA(v)+'"></option>'; }); dl+='</datalist>'; inp='<input id="'+id+'" list="'+lid+'" type="text" value="'+escA(val)+'" style="'+INP+'"/>'+dl; }
    else if(f.type==='salarie') inp='<select id="'+id+'" style="'+INP+'">'+refSelect(SEC_SAL,val)+'</select>';
    else if(f.type==='machine') inp='<select id="'+id+'" style="'+INP+'">'+refSelect(SEC_MACH,val)+'</select>';
    else if(f.type==='fourn') inp='<select id="'+id+'" style="'+INP+'">'+refSelect(SEC_FOURN,val)+'</select>';
    else if(f.type==='chimique') inp='<select id="'+id+'" style="'+INP+'">'+refSelect(SEC_CHIM,val)+'</select>';
    else if(f.type==='epicat') inp='<select id="'+id+'" style="'+INP+'">'+refSelect(SEC_EPICAT,val)+'</select>';
    else if(f.type==='checkbox') inp='<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:#374151;padding-top:4px;"><input id="'+id+'" type="checkbox" '+(val===true||val==='true'?'checked':'')+' style="width:16px;height:16px;"/> Oui</label>';
    else if(f.type==='list'){ var s=Array.isArray(val)?val.join(', '):(val||''); inp='<input id="'+id+'" type="text" value="'+escA(s)+'" style="'+INP+'"/>'; }
    else if(f.type==='pictos'){
      var sel=Array.isArray(val)?val.map(function(x){return String(x).toUpperCase();}):[];
      var tiles=CLP_ORDER.map(function(c){ var on=sel.indexOf(c)>=0;
        return '<div class="picto-tile'+(on?' on':'')+'" data-code="'+c+'" onclick="togglePicto(this)" title="'+c+' — '+(CLP_LABEL[c]||'')+'" style="width:66px;cursor:pointer;text-align:center;border:2px solid '+(on?'#ea580c':'#e2e8f0')+';border-radius:10px;padding:6px 4px;background:'+(on?'#fff7ed':'#fff')+';opacity:'+(on?'1':'.5')+';">'
          +'<div style="width:42px;height:42px;margin:0 auto;">'+clpSvg(c)+'</div>'
          +'<div style="font-size:.54rem;font-weight:700;color:#64748b;margin-top:3px;line-height:1.15;">'+c+'<br/>'+(CLP_LABEL[c]||'')+'</div></div>';
      }).join('');
      inp='<div id="'+id+'" class="picto-pick" style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;">'+tiles+'</div>';
    }
    else inp='<input id="'+id+'" type="'+(f.type||'text')+'" value="'+escA(val)+'" style="'+INP+'"/>';
    return '<div style="'+(f.full?'grid-column:1/-1;':'')+'"><label style="'+LAB+'">'+f.label+(f.req?' *':'')+'</label>'+inp+'</div>';
  }
  var SEC_EDIT=null, SEC_ENTITY=null, SEC_PREFILL=null;
  function secOpen(entity, idx){
    var form=SEC_FORMS[entity]; if(!form) return;
    var row=(idx!=null && SEC_ROWS[entity]) ? SEC_ROWS[entity][idx] : null;
    var pre=(row==null && SEC_PREFILL && SEC_PREFILL.entity===entity) ? SEC_PREFILL.values : null;
    SEC_EDIT=row? row.id : null; SEC_ENTITY=entity;
    var body='<div style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:16px;"><i class="fas fa-helmet-safety" style="color:${ORANGE};margin-right:8px;"></i>'+(row?'Modifier — ':'Nouveau — ')+form.title+(pre&&SEC_PREFILL.note?' <span style="font-size:.72rem;font-weight:600;color:#7c3aed;">('+SEC_PREFILL.note+')</span>':'')+'</div>';
    body+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    form.fields.forEach(function(f){ var dv = row? row[f.k] : (pre && (f.k in pre)? pre[f.k] : (f.k==='date_incident'||f.k==='date_controle'||f.k==='date_mesure'||f.k==='date_dechet'||f.k==='date_remise'||f.k==='date_exercice'||f.k==='date_ouverture'? new Date().toISOString().slice(0,10):'')); body+=fldHtml(f, dv); });
    body+='</div>';
    body+='<label style="display:flex;align-items:center;gap:9px;padding:9px 12px;margin-top:14px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;font-size:.76rem;color:#92400e;font-weight:600;cursor:pointer;"><input type="checkbox" id="sec_vd" style="width:16px;height:16px;accent-color:#f59e0b;"/><i class="fas fa-crown" style="color:#f59e0b;"></i>Soumettre à la validation de la Direction</label>';
    body+='<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">'
      +'<button onclick="secClose()" style="padding:9px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:.82rem;font-weight:700;color:#6b7280;">Annuler</button>'
      +'<button onclick="secSave(\\''+entity+'\\')" style="padding:9px 18px;border:none;border-radius:8px;background:linear-gradient(135deg,${ORANGE},#c2410c);color:white;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer</button></div>';
    document.getElementById('sec-modal-content').innerHTML=body;
    document.getElementById('sec-modal-overlay').style.display='flex';
  }
  function secClose(){ var o=document.getElementById('sec-modal-overlay'); if(o)o.style.display='none'; SEC_PREFILL=null; }
  // Ajoute une situation d'exposition SEIRICH pré-remplie depuis un produit chimique (liste Chimie).
  function secExpoFromChimique(idx){
    var p=(SEC_ROWS['chimiques']||[])[idx]; if(!p) return;
    SEC_PREFILL={ entity:'exposition-chimique', note:'produit '+(p.nom||''), values:{ produit_id:p.id, produit_nom:p.nom } };
    secOpen('exposition-chimique');
  }
  // Rappel : matrice indicative de compatibilité de stockage des produits chimiques (pictogrammes CLP/SGH).
  function pictoCompatModal(){
    var P=['SGH01','SGH02','SGH03','SGH04','SGH05','SGH06','SGH07','SGH08','SGH09'];
    var L={SGH01:'Explosif',SGH02:'Inflammable',SGH03:'Comburant',SGH04:'Gaz sous pression',SGH05:'Corrosif',SGH06:'Toxique',SGH07:'Nocif / irritant',SGH08:'Danger santé (CMR)',SGH09:'Environnement'};
    var M=[['o','x','x','x','x','x','x','x','x'],['x','+','x','o','o','o','+','+','o'],['x','x','+','o','o','o','+','+','o'],['x','o','o','+','o','o','+','+','+'],['x','o','o','o','+','o','+','+','o'],['x','o','o','o','o','+','+','+','o'],['x','+','+','+','+','+','+','+','+'],['x','+','+','+','+','+','+','+','+'],['x','o','o','+','o','o','+','+','+']];
    function cell(v){ if(v==='x')return '<span style="color:#dc2626;font-weight:900;font-size:1rem;">\\u2717</span>'; if(v==='o')return '<span style="color:#f59e0b;font-weight:900;font-size:1rem;">\\u25cf</span>'; return '<span style="color:#16a34a;font-weight:900;font-size:1rem;">\\u2795</span>'; }
    function ico(c){ return '<span style="display:inline-block;width:28px;height:28px;vertical-align:middle;">'+clpSvg(c)+'</span>'; }
    var head='<th style="padding:4px;background:#fafafa;"></th>'+P.map(function(c){return '<th title="'+L[c]+'" style="padding:4px;text-align:center;background:#fafafa;">'+ico(c)+'</th>';}).join('');
    var body=P.map(function(c,i){ return '<tr><td style="padding:4px 8px;white-space:nowrap;font-size:.72rem;color:#334155;font-weight:600;border-bottom:1px solid #f1f5f9;">'+ico(c)+' '+L[c]+'</td>'+M[i].map(function(v){return '<td style="padding:4px;text-align:center;border:1px solid #f1f5f9;">'+cell(v)+'</td>';}).join('')+'</tr>'; }).join('');
    var legend='<div style="display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:.78rem;color:#334155;"><span><span style="color:#dc2626;font-weight:900;">\\u2717</span> Ne peuvent pas être stockés ensemble</span><span><span style="color:#f59e0b;font-weight:900;">\\u25cf</span> Sous certaines conditions</span><span><span style="color:#16a34a;font-weight:900;">\\u2795</span> Peuvent être stockés ensemble</span></div>';
    var html='<div style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:6px;"><i class="fas fa-triangle-exclamation" style="color:#ea580c;margin-right:8px;"></i>Compatibilité de stockage des produits chimiques</div><div style="font-size:.74rem;color:#64748b;margin-bottom:4px;">Rappel <strong>indicatif</strong> par pictogrammes CLP/SGH — se référer aux FDS et aux consignes INRS pour les cas particuliers.</div>'+legend+CLP_DEFS+'<div style="overflow:auto;"><table style="border-collapse:collapse;">\\u003cthead>\\u003ctr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div><div style="display:flex;justify-content:flex-end;margin-top:14px;"><button onclick="secClose()" style="padding:9px 18px;border:none;border-radius:8px;background:#ea580c;color:white;font-weight:700;cursor:pointer;">Fermer</button></div>';
    document.getElementById('sec-modal-content').innerHTML=html;
    document.getElementById('sec-modal-overlay').style.display='flex';
  }
  // Ouvre le formulaire « Action corrective » pré-rempli depuis un incident (lien source).
  function secACFromIncident(idx){
    var inc=(SEC_ROWS['incidents']||[])[idx]; if(!inc) return;
    var desc=(inc.description||inc.nature_lesion||'')+(inc.salarie_nom?(' — '+inc.salarie_nom):'')+(inc.date_incident?(' ('+inc.date_incident+')'):'');
    SEC_PREFILL={ entity:'actions-correctives', note:'depuis accident '+(inc.id||''), source_type:'incident', source_ref:inc.id,
      values:{ type:'AC', origine:inc.zone||'', description:desc, responsable:inc.responsable||'' } };
    secOpen('actions-correctives');
  }
  // Ouvre le formulaire « Action corrective » pré-rempli depuis une situation d'exposition chimique (SEIRICH).
  function secACFromExpo(idx){
    var x=(SEC_ROWS['exposition-chimique']||[])[idx]; if(!x) return;
    var NIV={1:'Faible',2:'Moyen',3:'Élevé'};
    var desc='Exposition chimique : '+(x.produit_nom||'?')+(x.unite_travail?(' — '+x.unite_travail):'')+(x.tache?(' / '+x.tache):'')
      +' — niveau retenu '+(NIV[x.niveau_max]||x.niveau_max||'?')+(x.cmr?' (CMR)':'')+(x.atex?' (ATEX)':'')
      +'. Priorité STOP : Substituer / Techniquement capter à la source / Organiser / Protéger (EPI).';
    SEC_PREFILL={ entity:'actions-correctives', note:'depuis exposition '+(x.produit_nom||''), source_type:'exposition', source_ref:x.id,
      values:{ type:(x.cmr?'SD':'AC'), origine:(x.zone||x.unite_travail||''), description:desc, responsable:'' } };
    secOpen('actions-correctives');
  }
  function secSave(entity){
    var form=SEC_FORMS[entity]; if(!form) return;
    var p={};
    form.fields.forEach(function(f){
      var el=document.getElementById('secf-'+f.k); if(!el) return;
      var v;
      if(f.type==='checkbox') v=el.checked;
      else if(f.type==='number'){ v=el.value===''?null:Number(el.value); }
      else if(f.type==='pictos'){ v=[].slice.call(el.querySelectorAll('.picto-tile.on')).map(function(t){return t.getAttribute('data-code');}); }
      else if(f.type==='list'){ v=el.value.split(',').map(function(x){return x.trim();}).filter(Boolean); }
      else v=el.value===''?null:el.value;
      p[f.k]=v;
    });
    if(p.salarie_id){ var s=SEC_SAL.find(function(x){return String(x.id)===String(p.salarie_id);}); if(s)p.salarie_nom=s.nom; }
    if(p.epi_id){ var e=SEC_EPICAT.find(function(x){return String(x.id)===String(p.epi_id);}); if(e)p.epi_nom=e.nom; }
    if(p.fournisseur_id){ var fo=SEC_FOURN.find(function(x){return String(x.id)===String(p.fournisseur_id);}); if(fo){ p.fournisseur_nom=fo.nom; p.fournisseur=fo.nom; } }
    if(p.produit_id){ var pc=SEC_CHIM.find(function(x){return String(x.id)===String(p.produit_id);}); if(pc)p.produit_nom=pc.nom; }
    if(!SEC_EDIT && SEC_PREFILL && SEC_PREFILL.entity===entity && SEC_PREFILL.source_ref){ p.source_type=SEC_PREFILL.source_type; p.source_ref=SEC_PREFILL.source_ref; }
    var url='/api/securite/'+entity+(SEC_EDIT?('/'+encodeURIComponent(SEC_EDIT)):'');
    fetch(url,{method:SEC_EDIT?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
      .then(function(r){return r.json();})
      .then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
        var _obj=form.title+(p.objet?' — '+p.objet:(p.nom?' — '+p.nom:(p.danger?' — '+p.danger:(p.designation?' — '+p.designation:''))));
        submitValidation('securite','sec_vd',{type:form.title,objet:_obj,priorite:'normal',ref_table:entity,ref_id:(j.data&&j.data.id)||null});
        pushNotif('ok','fa-save','Enregistré.',2500); setTimeout(function(){softReload();},650); })
      .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  async function secDel(entity,id){
    if(!id||!await appConfirm('Supprimer cet élément ?')) return;
    fetch('/api/securite/'+entity+'/'+encodeURIComponent(id),{method:'DELETE'})
      .then(function(r){return r.json();})
      .then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-trash','Supprimé.',2200); setTimeout(function(){softReload();},600); })
      .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  </script>`

  return layout('Sécurité', content, 'service-securite')
}
