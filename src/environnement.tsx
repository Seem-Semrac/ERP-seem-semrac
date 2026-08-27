// ══════════════════════════════════════════════════════════════
// SERVICE ENVIRONNEMENT — ERP Seem Semrac
// Regroupe TOUT l'environnement (déplacé de Sécurité + Qualité) :
//   Déchets (BSDD/Trackdéchets) · Rejets & mesures (eau/air/bruit/énergie)
//   · ATEX · Aspects & impacts (ISO 14001 §6.1.2) · RSE · Conformité env.
// Autonome : helpers + script CRUD propres ; réutilise l'API /api/securite/*
// et les tables hse_* existantes (aucune migration pour l'existant).
// ══════════════════════════════════════════════════════════════
import { layout, serviceHeader, buildValDirMap, valDirBadge } from './shared'
import { computeRisqueChimique, SEIRICH_NIVEAUX, VLE_REFERENCE, conformiteVle, CODE_DECHETS_EU, FILIERES_RD, BSD_CYCLE, codeDechetDangereux, computeSeveso, RUBRIQUES_ICPE, FACTEURS_GES_MONETAIRE, ISO14001_DIAGNOSTIC, ISO14001_NIVEAUX, CYCLE_VIE_ETAPES, ISO26000_QUESTIONS } from './qref'
import { panelAudit, auditProgDomaine } from './qualite'   // système d'audit normatif commun (programme + planning), filtré ISO 14001

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const VERT = '#16a34a'
const DARKV = '#052e16'
const TH = 'padding:9px 12px;text-align:left;font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:800;'
const TD = 'padding:8px 12px;font-size:.78rem;color:#475569;'

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const d10 = (s: any) => (s ? String(s).slice(0, 10) : '—')
const TODAY = () => new Date().toISOString().slice(0, 10)
const fmtK = (n: any) => { const v = Math.round(Number(n) || 0); return Math.abs(v) >= 1000 ? (Math.round(v / 100) / 10) + 'k€' : v + '€' }

// Domaines de conformité considérés « environnement » (le reste = Sécurité).
export const ENV_CONF_DOMAINES = ['icpe', 'iso14001', 'rse', 'iso26000', 'atex']

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
const STATUT_COL: Record<string, [string, string]> = {
  conforme: ['#dcfce7', '#15803d'], a_jour: ['#dcfce7', '#15803d'], maitrise: ['#dcfce7', '#15803d'], clos: ['#e2e8f0', '#475569'], enleve: ['#dcfce7', '#15803d'], significatif: ['#ffedd5', '#c2410c'],
  partiel: ['#fef9c3', '#a16207'], en_cours: ['#fef9c3', '#a16207'], a_prevoir: ['#fef9c3', '#a16207'], en_attente: ['#fef9c3', '#a16207'], a_renouveler: ['#fef9c3', '#a16207'],
  non_conforme: ['#fee2e2', '#b91c1c'], en_retard: ['#fee2e2', '#b91c1c'], a_traiter: ['#fee2e2', '#b91c1c'], a_verifier: ['#dbeafe', '#1d4ed8'], na: ['#f1f5f9', '#64748b'],
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

// Décisions Direction indexées par (ref_table=entity, ref_id) — posé au début du rendu (synchrone).
let ENV_VD_MAP: Record<string, any> = {}

function dataTable(entity: string, rows: any[], cols: Col[]): string {
  const head = cols.map(c => `<th style="${TH}${c.right ? 'text-align:right;' : ''}">${c.label}</th>`).join('') + `<th style="${TH}text-align:right;">Actions</th>`
  const body = rows.length
    ? rows.map((r, i) => {
        const tds = cols.map(c => {
          const v = c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key] ?? '—')
          return `<td style="${TD}${c.right ? 'text-align:right;' : ''}">${v}</td>`
        }).join('')
        const _vd = valDirBadge(ENV_VD_MAP, entity, r.id)
        return `<tr data-rowid="${esc(r.id ?? '')}" style="border-bottom:1px solid #f1f5f9;">${tds}<td style="${TD}text-align:right;white-space:nowrap;">
          ${_vd ? `<span style="margin-right:8px;vertical-align:middle;">${_vd}</span>` : ''}
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
    <span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas ${icon}" style="color:${VERT};margin-right:7px;"></i>${title}</span>
    <span style="color:#94a3b8;font-size:.74rem;">${count} élément(s)</span>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
      <input type="text" placeholder="Rechercher…" oninput="secFilter('sec-tbl-${entity}',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:180px;"/>
      ${extraBtns}
      <button onclick="secOpen('${entity}')" style="background:linear-gradient(135deg,${VERT},#15803d);color:white;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-plus" style="margin-right:5px;"></i>${newLabel}</button>
    </div>
  </div>`
}
function infoBox(txt: string): string {
  return `<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.74rem;color:#166534;line-height:1.5;">${txt}</div>`
}
function panelWrap(id: string, active: boolean, inner: string): string {
  return `<div id="sec-panel-${id}" style="display:${active ? 'block' : 'none'};">${inner}</div>`
}
const kpi = (val: string, label: string, color: string, icon: string, sub = '') => `
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px 18px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><i class="fas ${icon}" style="color:${color};"></i><span style="font-size:.66rem;text-transform:uppercase;font-weight:800;color:#94a3b8;letter-spacing:.04em;">${label}</span></div>
    <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1;">${val}</div>
    ${sub ? `<div style="font-size:.66rem;color:#94a3b8;margin-top:5px;">${sub}</div>` : ''}
  </div>`

// ══════════════════════════════════════════════════════════════
export function pageServiceEnvironnement(D: any): string {
  const dechets = D.dechets || []
  const mesuresEnv = D.mesuresEnv || []
  const atex = D.atex || []
  const rse = D.rse || []
  const conformiteAll = D.conformite || []
  const aspects = D.aspects || []
  const chimiques = D.chimiques || []
  const relevesEau = D.relevesEau || []
  const validations = D.validations || []
  const rseAuto = D.rseAuto || null
  const parties = D.parties || []
  const diagnostic = D.diagnostic || []
  const iso26000 = D.iso26000 || []
  const auditProg = D.auditProg || []
  const auditGrilles = D.auditGrilles || []
  const auditQuestions = D.auditQuestions || []
  const auditAuto = D.auditAuto || {}

  // conformité : on ne garde QUE les domaines environnement (le reste vit dans Sécurité).
  const conformite = conformiteAll.filter((x: any) => ENV_CONF_DOMAINES.includes(String(x.domaine)))

  // Décisions Direction (badges de validation) — synchrone.
  ENV_VD_MAP = buildValDirMap(validations)

  const today = TODAY(), year = today.slice(0, 4), month = today.slice(0, 7)

  // ─── colonnes ───
  const colDechets: Col[] = [
    { key: 'date_dechet', label: 'Date', fmt: (v) => d10(v) },
    { key: 'code_dechet', label: 'Code déchet', fmt: (v) => (v ? esc(v) + (codeDechetDangereux(v) ? ' <span style="color:#dc2626;font-weight:800;">*</span>' : '') : '—') },
    { key: 'designation', label: 'Désignation' },
    { key: 'dangereux', label: 'DD', fmt: (v, r) => boolBadge(v === true || codeDechetDangereux(r.code_dechet)) },
    { key: 'quantite', label: 'Qté', right: true, fmt: (v, r) => (v != null ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'filiere', label: 'Filière' },
    { key: 'statut', label: 'BSD', fmt: (v) => { const m = (BSD_CYCLE.find((x) => x[0] === v) || [null, v])[1]; return v ? pill(String(m), '#eff6ff', '#1d4ed8') : '—' } },
  ]
  const colMesures: Col[] = [
    { key: 'date_mesure', label: 'Date', fmt: (v) => d10(v) },
    { key: 'type', label: 'Type', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'point_mesure', label: 'Point' }, { key: 'parametre', label: 'Paramètre' },
    { key: 'valeur', label: 'Valeur', right: true, fmt: (v, r) => (v != null ? esc(v) + ' ' + esc(r.unite || '') : '—') },
    { key: 'vle', label: 'VLE', right: true },
    {
      key: 'conforme', label: 'Conforme', fmt: (v, r) => {
        const auto = conformiteVle(r.valeur, r.vle)
        if (auto !== null) return boolBadge(auto) + `<span style="font-size:.55rem;color:#94a3b8;margin-left:4px;" title="Calculé : valeur vs VLE">auto</span>`
        return boolBadge(v)
      },
    },
  ]
  const colAtex: Col[] = [
    { key: 'nom', label: 'Zone' },
    { key: 'type_zone', label: 'Type', fmt: (v) => (v != null && v !== '' ? pill('Zone ' + v, '#fef9c3', '#a16207') : '—') },
    { key: 'localisation', label: 'Localisation' }, { key: 'origine_risque', label: 'Origine' },
    { key: 'materiel_requis', label: 'Matériel requis' },
    { key: 'date_revue', label: 'Revue', fmt: (v) => dateEcheance(v) }, { key: 'entite', label: 'Site' },
    { key: 'id', label: 'DRPCE', fmt: (_v, r) => `<a href="/api/atex/${encodeURIComponent(String(r.id))}/drpce.pdf" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#ede9fe;color:#6d28d9;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;"><i class="fas fa-file-pdf"></i> PDF</a>` },
  ]
  const colAspects: Col[] = [
    { key: 'activite', label: 'Activité / processus' }, { key: 'aspect', label: 'Aspect environnemental' },
    { key: 'milieu', label: 'Milieu', fmt: (v) => (v ? pill(String(v), '#e0f2fe', '#0369a1') : '—') },
    { key: 'condition', label: 'Condition', fmt: (v) => esc(String(v || '').replace(/_/g, ' ')) },
    { key: 'criticite', label: 'Criticité', right: true, fmt: (_v, r) => critBadge((Number(r.gravite) || 0) * (Number(r.frequence) || 0)) },
    { key: 'significatif', label: 'Significatif', fmt: (v) => (v === true ? pill('AES', '#ffedd5', '#c2410c') : boolBadge(v)) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
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
    { key: 'date_parution', label: 'Parution', fmt: (v, r) => (r.type_texte || v ? `<span style="font-size:.68rem;">${r.type_texte ? esc(String(r.type_texte).replace(/_/g, ' ')) : ''}${v ? ' · ' + d10(v) : ''}</span>` : '—') },
    { key: 'date_echeance', label: 'Échéance', fmt: (v) => dateEcheance(v) },
    { key: 'responsable', label: 'Responsable' },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]
  const isoNiv = (n: any) => { const m = ISO14001_NIVEAUX.find((x) => x[0] === String(n)); return m ? `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:.65rem;font-weight:800;background:${m[2]}22;color:${m[2]};">${esc(m[0])} · ${esc(m[1])}</span>` : '—' }
  const colPI: Col[] = [
    { key: 'partie', label: 'Partie intéressée' },
    { key: 'type', label: 'Type' },
    { key: 'attentes', label: 'Attentes / exigences' },
    { key: 'influence', label: 'Influence', right: true, fmt: (v) => critBadge(v) },
    { key: 'maitrise', label: 'Maîtrise', right: true, fmt: (v) => critBadge(v) },
    { key: 'score', label: 'I×M', right: true, fmt: (v) => critBadge(v) },
    { key: 'statut', label: 'Statut', fmt: (v) => statutBadge(v) },
  ]
  const colDiag: Col[] = [
    { key: 'chapitre', label: 'Chap.' },
    { key: 'titre', label: 'Exigence' },
    { key: 'niveau_actuel', label: 'Niveau actuel', fmt: (v) => isoNiv(v) },
    { key: 'niveau_cible', label: 'Cible', fmt: (v) => isoNiv(v) },
    { key: 'action', label: 'Action' },
    { key: 'echeance', label: 'Échéance', fmt: (v) => dateEcheance(v) },
  ]
  const colIso26 : Col[] = [
    { key: 'code', label: 'QC' },
    { key: 'titre', label: 'Question centrale' },
    { key: 'niveau_actuel', label: 'Niveau actuel', fmt: (v) => isoNiv(v) },
    { key: 'niveau_cible', label: 'Cible', fmt: (v) => isoNiv(v) },
    { key: 'action', label: 'Action' },
    { key: 'echeance', label: 'Échéance', fmt: (v) => dateEcheance(v) },
  ]

  // ─── panneaux ───
  const eauReleves = relevesEau.slice(0, 8)
  const vleRef = `<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:.72rem;color:#0ea5e9;font-weight:700;"><i class="fas fa-ruler" style="margin-right:5px;"></i>VLE de référence (arrêté type 02/02/1998 — indicatif)</summary><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${VLE_REFERENCE.map((r) => `<span style="font-size:.66rem;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:2px 8px;color:#0369a1;">${esc(r.parametre)} ≤ ${esc(r.max)}${r.unite ? ' ' + esc(r.unite) : ''}${r.note ? ' (' + esc(r.note) + ')' : ''}</span>`).join('')}</div><div style="font-size:.62rem;color:#94a3b8;margin-top:6px;">La VLE réglementaire réelle est fixée par l'arrêté préfectoral du site ; ci-dessus = repères de saisie. La colonne « Conforme » se calcule automatiquement (valeur ≤ VLE) dès qu'une VLE est renseignée.</div></details>`
  const dechetsRef = `<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:.72rem;color:#16a34a;font-weight:700;"><i class="fas fa-book" style="margin-right:5px;"></i>Nomenclature déchets EU (2014/955/UE) &amp; codes de filière R/D</summary>
    <div style="margin-top:8px;font-size:.68rem;color:#475569;"><strong>Codes déchets</strong> (* = dangereux) :</div>
    <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:5px;">${CODE_DECHETS_EU.map((d) => `<span style="font-size:.63rem;background:${codeDechetDangereux(d.code) ? '#fef2f2' : '#f0fdf4'};border:1px solid ${codeDechetDangereux(d.code) ? '#fecaca' : '#bbf7d0'};border-radius:6px;padding:2px 7px;color:${codeDechetDangereux(d.code) ? '#b91c1c' : '#166534'};" title="${esc(d.libelle)}">${esc(d.code)}</span>`).join('')}</div>
    <div style="margin-top:8px;font-size:.68rem;color:#475569;"><strong>Filières</strong> — R (valorisation) / D (élimination) :</div>
    <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:5px;">${FILIERES_RD.map((f) => `<span style="font-size:.63rem;background:${f.type === 'R' ? '#f0fdf4' : '#f8fafc'};border:1px solid ${f.type === 'R' ? '#bbf7d0' : '#e2e8f0'};border-radius:6px;padding:2px 7px;color:#334155;">${esc(f.code)} · ${esc(f.libelle)}</span>`).join('')}</div></details>`
  const pDechets = panelWrap('dechets', true,
    infoBox('<strong>Registre des déchets (5 ans)</strong> — traçabilité entrée/sortie, tri par filière, <strong>BSDD / Trackdéchets</strong> pour les déchets dangereux (DD). Code déchet <strong>européen</strong> (l\'astérisque = dangereux, coché automatiquement) ; filière <strong>R/D</strong> ; cycle du <strong>bordereau</strong> (émis → pris en charge → reçu → traité). ICPE traitement de surface = rubrique <strong>2565</strong> ; déclaration annuelle <strong>GEREP</strong>.') +
    panelHeader('fa-recycle', 'Registre des déchets', dechets.length, 'dechets', 'Nouveau déchet',
      `<button onclick="envDeclarerPerissables()" style="border:1.5px solid #16a34a;background:#f0fdf4;color:#166534;font-weight:700;font-size:.72rem;border-radius:8px;padding:6px 12px;cursor:pointer;"><i class="fas fa-clock-rotate-left" style="margin-right:5px;"></i>Déchets des produits périmés</button>`) +
    dataTable('dechets', dechets, colDechets) +
    dechetsRef)
  const pRejets = panelWrap('rejets', false,
    infoBox('<strong>Rejets & mesures</strong> — autosurveillance des <strong>rejets aqueux</strong> (bain de rinçage, DCO, métaux), <strong>émissions air</strong>, <strong>bruit</strong> en limite de propriété et <strong>consommations</strong> (eau / énergie). Valeurs comparées aux <strong>VLE</strong> de l\'arrêté préfectoral.') +
    panelHeader('fa-droplet', 'Mesures (eau / air / bruit / énergie)', mesuresEnv.length, 'mesures-env', 'Nouvelle mesure') +
    dataTable('mesures-env', mesuresEnv, colMesures) +
    (eauReleves.length ? `<div style="margin-top:14px;font-size:.72rem;color:#64748b;"><i class="fas fa-link" style="margin-right:5px;"></i>Relevés d'eau OAS récents (source : module OAS) : ${eauReleves.map((r: any) => `${d10(r.date_releve)}${r.volume_m3 != null ? ' · ' + r.volume_m3 + ' m³' : ''}`).join(' · ')}</div>` : '') +
    vleRef)
  const pAtex = panelWrap('atex', false,
    panelHeader('fa-burst', 'Zones ATEX', atex.length, 'atex', 'Nouvelle zone') +
    infoBox('<strong>ATEX</strong> (atmosphères explosives) — zonage (0/1/2 gaz-vapeurs, 20/21/22 poussières), matériel conforme par zone. Le <strong>DRPCE</strong> (document relatif à la protection contre les explosions) est obligatoire. Rattaché à l\'environnement (solvants, poussières, stockage).') +
    dataTable('atex', atex, colAtex))
  const aesSignif = aspects.filter((a: any) => a.significatif === true).length
  const pAspects = panelWrap('aspects', false,
    infoBox('<strong>Analyse environnementale (ISO 14001 §6.1.2)</strong> — pour chaque <em>activité</em>, on identifie l\'<em>aspect</em> (rejet, déchet, consommation, bruit…), son <em>impact</em>, en conditions <strong>normales / anormales / d\'urgence</strong>. <strong>Cotation multi-axes</strong> (grille INRS) : note de criticité = <strong>P × F × G × S × (maîtrise / 5)</strong> — Probabilité (mode dégradé), Fréquence, Gravité, Sensibilité du milieu, et niveau de Maîtrise moyen (technique / humaine / organisationnelle). Un aspect est <strong>significatif (AES)</strong> si la note ≥ 1000 ; les AES alimentent le programme environnemental et le plan d\'audit (thème J). <em>Repli gravité × fréquence si les nouveaux axes ne sont pas saisis.</em>') +
    panelHeader('fa-seedling', 'Aspects & impacts environnementaux', aspects.length, 'aspects-impacts', 'Nouvel aspect',
      `<span style="font-size:.72rem;color:#c2410c;font-weight:700;">${aesSignif} AES significatif(s)</span>`) +
    dataTable('aspects-impacts', aspects, colAspects) +
    `<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:.72rem;color:#16a34a;font-weight:700;"><i class="fas fa-recycle" style="margin-right:5px;"></i>Perspective cycle de vie (ISO 14001 §6.1.2)</summary>
      <div style="margin-top:8px;font-size:.68rem;color:#64748b;">Chaque aspect peut être rattaché à une <strong>étape du cycle de vie</strong> (amont → aval). Maîtrise/Influence indicatives :</div>
      <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;">${CYCLE_VIE_ETAPES.map((e) => `<span style="font-size:.63rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:2px 8px;color:#166534;">${esc(e.etape)} <span style="color:#94a3b8;">· ${e.maitrise ? 'maîtrise' : 'sans maîtrise'} / ${e.influence ? 'influence' : 'sans influence'}</span></span>`).join('')}</div></details>`)

  // ─── ICPE / Seveso (classement indicatif depuis l'inventaire chimique) ───
  const sev = computeSeveso(chimiques)
  const sevMeta = sev.statut === 'seuil_haut' ? ['Seveso — SEUIL HAUT', '#dc2626', '#fef2f2', '#fecaca']
    : sev.statut === 'seuil_bas' ? ['Seveso — SEUIL BAS', '#c2410c', '#fff7ed', '#fed7aa']
      : ['Non Seveso', '#16a34a', '#f0fdf4', '#bbf7d0']
  const sevBar = (label: string, sb: number, sh: number) => {
    const col = sb >= 1 ? '#dc2626' : sb >= 0.5 ? '#f59e0b' : '#16a34a'
    const pct = Math.max(2, Math.min(100, Math.round(sb * 100)))
    return `<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:3px;"><span style="font-weight:700;color:#374151;">${label}</span><span style="font-weight:800;color:${col};">Σ q/SB = ${sb.toFixed(3)}</span></div><div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${col};"></div><div style="position:relative;"></div></div><div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">seuil haut : Σ q/SH = ${sh.toFixed(3)} · Seveso si Σ ≥ 1</div></div>`
  }
  const pIcpe = panelWrap('icpe', false,
    `<div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:6px;"><i class="fas fa-industry" style="color:${VERT};margin-right:7px;"></i>Classement ICPE / Seveso <span style="font-size:.6rem;font-weight:800;background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 7px;vertical-align:middle;">INDICATIF</span></div>` +
    infoBox('<strong>Classement Seveso</strong> (directive 2012/18/UE) calculé automatiquement depuis l\'inventaire chimique : chaque produit est rattaché à une rubrique <strong>4xxx</strong> via ses mentions de danger (H), et la <strong>somme des rapports quantité / seuil</strong> est faite par classe (santé / physique / environnement). Une classe ≥ 1 au seuil bas → <strong>Seveso seuil bas</strong> ; ≥ 1 au seuil haut → <strong>seuil haut</strong>. Repère : la VLE et le régime réels dépendent de l\'arrêté préfectoral du site. Saisie des produits : <strong>Sécurité › Chimie</strong>.') +
    `<div style="background:${sevMeta[2]};border:1.5px solid ${sevMeta[3]};border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
      <div style="font-size:1.6rem;color:${sevMeta[1]};"><i class="fas fa-scale-unbalanced"></i></div>
      <div style="flex:1;"><div style="font-weight:800;font-size:1.05rem;color:${sevMeta[1]};">${sevMeta[0]}</div>
        <div style="font-size:.72rem;color:#64748b;">Ratio max seuil bas : <strong>${sev.maxSb}</strong> · seuil haut : <strong>${sev.maxSh}</strong> — sur ${chimiques.length} produit(s) chimique(s).</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:16px;align-items:start;">
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
        <div style="font-weight:800;color:#374151;font-size:.82rem;margin-bottom:12px;">Cumul par classe de danger</div>
        ${sevBar('Santé (41xx)', sev.classes.sante.sb, sev.classes.sante.sh)}
        ${sevBar('Physique — incendie/explosion (43-47xx)', sev.classes.physique.sb, sev.classes.physique.sh)}
        ${sevBar('Environnement — milieu aquatique (45xx)', sev.classes.env.sb, sev.classes.env.sh)}
      </div>
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
        <div style="font-weight:800;color:#374151;font-size:.82rem;margin-bottom:10px;">Produits rattachés à une rubrique Seveso</div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;"><th style="${TH}">Produit</th><th style="${TH}">Rubrique</th><th style="${TH}text-align:right;">Quantité</th><th style="${TH}text-align:right;">q/SB</th></tr></thead>
        <tbody>${sev.details.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:18px;color:#9ca3af;font-size:.8rem;">Aucun produit ne relève d'une rubrique Seveso (site non Seveso).</td></tr>` : sev.details.slice(0, 12).map((x: any) => `<tr style="border-bottom:1px solid #f8fafc;"><td style="${TD}">${esc(x.nom || '—')}</td><td style="${TD}"><span style="font-weight:700;color:#334155;">${esc(x.rubrique)}</span> <span style="font-size:.62rem;color:#94a3b8;">${esc(x.classe)}</span></td><td style="${TD}text-align:right;">${(x.q).toFixed(3)} t</td><td style="${TD}text-align:right;font-weight:700;color:${x.ratioSb >= 1 ? '#dc2626' : '#334155'};">${x.ratioSb.toFixed(3)}</td></tr>`).join('')}</tbody></table></div>
      </div>
    </div>
    <div style="margin-top:16px;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
      <div style="font-weight:800;color:#374151;font-size:.82rem;margin-bottom:10px;">Rubriques ICPE de repère (atelier usinage / traitement de surface)</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${RUBRIQUES_ICPE.map((r) => `<span style="font-size:.66rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:3px 9px;color:#166534;"><strong>${esc(r.rubrique)}</strong> — ${esc(r.libelle)}</span>`).join('')}</div>
      <div style="font-size:.62rem;color:#94a3b8;margin-top:8px;">Le régime réel (déclaration / enregistrement / autorisation) et les rubriques applicables sont fixés par l'arrêté préfectoral du site.</div>
    </div>`)

  // ─── Bilan GES / Carbone (monétaire, calculé dans la route) ───
  const bilanGes = D.bilanGes || null
  const scopeCol: Record<string, string> = { '1': '#dc2626', '2': '#f59e0b', '3': '#6366f1' }
  const gbar = (label: string, val: number, max: number, color: string) => `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:3px;"><span style="color:#374151;font-weight:600;">${esc(label)}</span><span style="color:${color};font-weight:800;">${val} t</span></div><div style="height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:${Math.max(2, Math.min(100, Math.round(val / (max || 1) * 100)))}%;height:100%;background:${color};"></div></div></div>`
  const pGes = panelWrap('ges', false,
    `<div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:6px;"><i class="fas fa-earth-europe" style="color:${VERT};margin-right:7px;"></i>Bilan GES / Carbone (BEGES) <span style="font-size:.6rem;font-weight:800;background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 7px;vertical-align:middle;">INDICATIF — MONÉTAIRE</span></div>` +
    infoBox('<strong>Bilan des émissions de gaz à effet de serre</strong> (méthode <strong>monétaire</strong>) : les <strong>achats fournisseurs</strong> sont ventilés par <strong>compte comptable (PCG)</strong> et convertis en CO₂e via des <strong>facteurs d\'émission monétaires</strong> (Base Carbone ADEME, indicatifs). <strong>Scope 1</strong> = combustion directe (carburants, fioul/gaz) ; <strong>Scope 2</strong> = électricité achetée ; <strong>Scope 3</strong> = achats amont, transport, sous-traitance. Affine avec des données physiques (kWh, litres, t.km) pour un bilan réglementaire.') +
    (bilanGes ? `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px;">
      ${kpi(bilanGes.total + ' t', 'Total CO₂e (exercice ' + esc(bilanGes.annee) + ')', '#16a34a', 'fa-earth-europe', 'tonnes équivalent CO₂')}
      ${kpi(bilanGes.scope1 + ' t', 'Scope 1 — direct', '#dc2626', 'fa-fire', 'combustion, carburants')}
      ${kpi(bilanGes.scope2 + ' t', 'Scope 2 — électricité', '#f59e0b', 'fa-bolt', 'énergie achetée')}
      ${kpi(bilanGes.scope3 + ' t', 'Scope 3 — indirect', '#6366f1', 'fa-truck-fast', 'achats, transport, déchets')}
    </div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px;align-items:start;">
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
        <div style="font-weight:800;color:#374151;font-size:.82rem;margin-bottom:12px;">Répartition par poste (tCO₂e)</div>
        ${bilanGes.postes.length ? bilanGes.postes.map((p: any) => gbar(p.poste + ' · scope ' + p.scope, p.tco2, bilanGes.postes[0].tco2, scopeCol[String(p.scope)] || '#6366f1')).join('') : `<div style="font-size:.8rem;color:#9ca3af;padding:14px 0;">Aucune facture fournisseur sur l'exercice — le bilan se remplit à mesure de la saisie des achats (Comptabilité).</div>`}
      </div>
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
        <div style="font-weight:800;color:#374151;font-size:.82rem;margin-bottom:10px;">Facteurs d'émission monétaires</div>
        <div style="font-size:.66rem;color:#64748b;margin-bottom:8px;">kg CO₂e par € HT, par famille de compte PCG :</div>
        ${FACTEURS_GES_MONETAIRE.map((r) => `<div style="display:flex;justify-content:space-between;font-size:.68rem;padding:3px 0;border-bottom:1px solid #f8fafc;"><span style="color:#475569;">${esc(r.libelle)} <span style="color:#94a3b8;">(${esc(r.prefix)})</span></span><span style="font-weight:700;color:${scopeCol[String(r.scope)]};">${r.facteur} · S${r.scope}</span></div>`).join('')}
      </div>
    </div>` : `<div style="font-size:.85rem;color:#9ca3af;padding:20px;">Bilan GES indisponible.</div>`))

  const rseAutoBlock = rseAuto ? `
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:16px;">
      <div style="font-weight:800;color:#166534;font-size:.85rem;margin-bottom:3px;"><i class="fas fa-bolt" style="margin-right:6px;"></i>Indicateurs RSE consolidés <span style="font-size:.6rem;font-weight:800;background:#dcfce7;color:#166534;border-radius:6px;padding:2px 7px;vertical-align:middle;">AUTO</span></div>
      <div style="font-size:.68rem;color:#64748b;margin-bottom:12px;">Calculés en direct depuis <strong>RH</strong> (effectif, absentéisme, habilitations), <strong>Sécurité</strong> (accidentologie TF/TG) et <strong>Comptabilité</strong> (CA, achats) — exercice ${esc(rseAuto.year)}. Aucune ressaisie.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
        ${kpi(String(rseAuto.effectif), 'Effectif actif', '#16a34a', 'fa-users', 'social')}
        ${kpi(rseAuto.tf != null ? String(rseAuto.tf) : '—', 'Taux de fréquence (TF)', '#0ea5e9', 'fa-heart-pulse', 'AT avec arrêt ×10⁶/h')}
        ${kpi(rseAuto.tg != null ? String(rseAuto.tg) : '—', 'Taux de gravité (TG)', '#0ea5e9', 'fa-user-injured', 'jours arrêt ×10³/h')}
        ${kpi(rseAuto.joursSans != null ? String(rseAuto.joursSans) : '—', 'Jours sans accident', '#16a34a', 'fa-shield-heart', 'depuis dernier AT')}
        ${kpi(rseAuto.absenteisme + ' %', 'Absentéisme (mois)', rseAuto.absenteisme > 8 ? '#dc2626' : '#16a34a', 'fa-user-clock', 'jours abs / jours ouvrés')}
        ${kpi(rseAuto.habilOK + '/' + rseAuto.habilTotal, 'Habilitations valides', '#6366f1', 'fa-certificate', 'compétences à jour')}
        ${kpi(fmtK(rseAuto.caHT), 'CA HT (an)', '#16a34a', 'fa-euro-sign', 'valeur créée')}
        ${kpi(fmtK(rseAuto.achatsHT), 'Achats HT (an)', '#f59e0b', 'fa-cart-shopping', 'assiette achats responsables')}
        ${kpi(rseAuto.egaliteFH != null ? rseAuto.egaliteFH + ' %' : '—', 'Femmes (égalité F/H)', '#ec4899', 'fa-venus', '% effectif renseigné')}
        ${kpi((rseAuto.oethPct != null ? rseAuto.oethPct : 0) + ' %', 'OETH (handicap)', (rseAuto.oethPct || 0) >= 6 ? '#16a34a' : '#f59e0b', 'fa-wheelchair', 'obligation légale 6 %')}
        ${kpi((rseAuto.turnover != null ? rseAuto.turnover : 0) + ' %', 'Turnover (12 mois)', '#6366f1', 'fa-arrows-rotate', 'départs / effectif')}
        ${kpi(rseAuto.eauAn ? rseAuto.eauAn.toLocaleString('fr-FR') : '0', 'Conso. eau (an)', '#0ea5e9', 'fa-faucet-drip', 'm³ — environnement')}
        ${kpi(rseAuto.tauxValo + ' %', 'Déchets valorisés', '#0d9488', 'fa-recycle', 'filière R')}
      </div>
    </div>` : ''
  // ══════════════════════════════════════════════════════════════════════
  // ONGLET UNIQUE « Conformité & Audit » — sous-navigation dédiée (façon Qualité)
  // Regroupe : Programme d'audit (planning commun) · Veille & conformité ·
  // Parties intéressées · Autodiagnostic ISO 14001 · ISO 26000 & RSE.
  // (Fusionne les ex-onglets rse/parties/audit/iso26000 — plus de doublon RSE.)
  // ══════════════════════════════════════════════════════════════════════
  const diagAvg = diagnostic.length ? Math.round(diagnostic.reduce((s: number, d: any) => s + (Number(d.niveau_actuel) || 0), 0) / diagnostic.length * 10) / 10 : 0
  const diagCible = diagnostic.length ? Math.round(diagnostic.reduce((s: number, d: any) => s + (Number(d.niveau_cible) || 0), 0) / diagnostic.length * 10) / 10 : 0
  const diagPct = Math.round(diagAvg / 4 * 100)
  const iso26Avg = iso26000.length ? Math.round(iso26000.reduce((s: number, d: any) => s + (Number(d.niveau_actuel) || 0), 0) / iso26000.length * 10) / 10 : 0
  const iso26Pct = Math.round(iso26Avg / 4 * 100)
  const niveauxLegend = `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${ISO14001_NIVEAUX.map((n) => `<span style="font-size:.63rem;background:${n[2]}22;color:${n[2]};border-radius:6px;padding:2px 8px;font-weight:700;">${esc(n[0])} — ${esc(n[1])}</span>`).join('')}</div>`

  // Sous-onglet 1 — Programme d'audit (planning commun Qualité, filtré ISO 14001)
  // (le panneau d'audit est assemblé plus bas, avec les onglets propres à l'Environnement)

  // Sous-onglet 2 — Veille & conformité réglementaire
  const bodyVeille = panelHeader('fa-scale-balanced', 'Conformité environnementale (veille réglementaire)', conformite.length, 'conformite', 'Nouvelle obligation')
    + infoBox('<strong>Veille & conformité réglementaire environnementale</strong> — <strong>ICPE / DREAL</strong> (arrêté préfectoral 2565), <strong>Code de l\'environnement</strong>, <strong>REACH</strong>, <strong>ISO 14001</strong>, <strong>ISO 26000</strong>. Source de veille, type de texte et date de parution suivis. (Les obligations Sécurité — travail, chimique, ISO 45001 — restent dans le service Sécurité.)')
    + dataTable('conformite', conformite, colConf)

  // Sous-onglet 3 — Parties intéressées (ISO 14001 §4.2)
  const bodyParties = panelHeader('fa-users-viewfinder', 'Parties intéressées', parties.length, 'parties-interessees', 'Nouvelle partie')
    + infoBox('<strong>Contexte de l\'organisme (ISO 14001 §4.2)</strong> — identification des parties intéressées (DREAL, riverains, clients, personnel, assureurs, collectivités…), de leurs <strong>attentes/exigences</strong> et cotation <strong>Influence × Maîtrise</strong> (1 à 4). Score élevé = partie à surveiller en priorité. L\'<strong>exigence retenue</strong> alimente les obligations de conformité.')
    + dataTable('parties-interessees', parties, colPI)
    + `<div style="margin-top:10px;font-size:.66rem;color:#94a3b8;">Cotation 1-4 · <strong>Influence</strong> : 1 = pas influente → 4 = très influente · <strong>Maîtrise</strong> : 1 = très forte → 4 = pas maîtrisée. Score = I × M.</div>`

  // Sous-onglet 4 — Autodiagnostic de maturité ISO 14001
  const bodyIso14001 = panelHeader('fa-clipboard-check', 'Autodiagnostic de maturité ISO 14001', diagnostic.length, 'diagnostic-iso', 'Nouvelle ligne',
      diagnostic.length ? `<span style="font-size:.72rem;color:${diagPct >= 75 ? '#16a34a' : diagPct >= 50 ? '#f59e0b' : '#dc2626'};font-weight:800;">Maturité ${diagAvg}/4 (${diagPct}%)</span>` : `<button onclick="envInitDiagIso()" style="border:1.5px solid #16a34a;background:#f0fdf4;color:#166534;font-weight:700;font-size:.72rem;border-radius:8px;padding:6px 12px;cursor:pointer;"><i class="fas fa-wand-magic-sparkles" style="margin-right:5px;"></i>Initialiser la grille (7 chapitres)</button>`)
    + infoBox('<strong>Autodiagnostic ISO 14001:2015</strong> — évaluation clause par clause (chapitres 4 à 10) du système de management environnemental : <strong>niveau actuel</strong> et <strong>cible</strong> de 1 (inexistant) à 4 (conforme), constat et action de mise à niveau. Le <strong>taux de maturité</strong> pilote le plan de mise en place du SME.')
    + (diagnostic.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px;">
      ${kpi(diagAvg + ' / 4', 'Maturité moyenne', diagPct >= 75 ? '#16a34a' : diagPct >= 50 ? '#f59e0b' : '#dc2626', 'fa-gauge', diagPct + ' % de conformité')}
      ${kpi(diagCible + ' / 4', 'Cible moyenne', '#6366f1', 'fa-bullseye', 'objectif SME')}
      ${kpi(String(diagnostic.filter((d: any) => (Number(d.niveau_actuel) || 0) <= 2).length), 'Chapitres à traiter', '#dc2626', 'fa-triangle-exclamation', 'niveau ≤ 2')}
    </div>` : '')
    + dataTable('diagnostic-iso', diagnostic, colDiag)
    + niveauxLegend

  // Sous-onglet 5 — ISO 26000 & RSE (autodiagnostic ISO 26000 + indicateurs RSE fusionnés)
  const bodyIso26RSE = panelHeader('fa-handshake-angle', 'Autodiagnostic ISO 26000 (RSE)', iso26000.length, 'diagnostic-iso26000', 'Nouvelle question',
      iso26000.length ? `<span style="font-size:.72rem;color:${iso26Pct >= 75 ? '#16a34a' : iso26Pct >= 50 ? '#f59e0b' : '#dc2626'};font-weight:800;">Maturité ${iso26Avg}/4 (${iso26Pct}%)</span>` : `<button onclick="envInitIso26000()" style="border:1.5px solid #16a34a;background:#f0fdf4;color:#166534;font-weight:700;font-size:.72rem;border-radius:8px;padding:6px 12px;cursor:pointer;"><i class="fas fa-wand-magic-sparkles" style="margin-right:5px;"></i>Initialiser (7 questions centrales)</button>`)
    + infoBox('<strong>Responsabilité sociétale — ISO 26000</strong> : autodiagnostic sur les <strong>7 questions centrales</strong> (gouvernance, droits de l\'Homme, relations et conditions de travail, environnement, loyauté des pratiques, consommateurs, communautés & développement local). Niveau de maturité 1 à 4 par question, avec plan de progrès.')
    + dataTable('diagnostic-iso26000', iso26000, colIso26)
    + niveauxLegend
    + `<div style="height:1px;background:#e2e8f0;margin:26px 0;"></div>`
    + panelHeader('fa-leaf', 'Indicateurs RSE', rse.length, 'rse', 'Nouvel indicateur')
    + infoBox('Indicateurs <strong>environnementaux</strong> (eau, énergie, déchets valorisés, GES/bilan carbone), <strong>sociaux</strong> (accidentologie, égalité F/H, OETH) et de <strong>gouvernance</strong> (achats responsables). Base <strong>ISO 26000</strong>.')
    + rseAutoBlock
    + dataTable('rse', rse, colRse)

  // Panneaux de PREMIER NIVEAU sortis de l'onglet Audit (ils n'étaient pas des audits) :
  //  · Parties intéressées → rejoint « Aspects & parties » (contexte ISO 14001 §4.2 / §6.1.2)
  //  · Veille réglementaire → registre d'obligations, onglet à part
  //  · Autodiagnostics ISO 14001 + ISO 26000/RSE → onglet « Autodiagnostics »
  const pParties = panelWrap('parties', false, bodyParties)
  const pVeille = panelWrap('veille', false, bodyVeille)
  const pIso14001 = panelWrap('autodiag-iso', false, bodyIso14001)
  const pIso26RSE = panelWrap('autodiag-rse', false, bodyIso26RSE)

  // Audit = EXACTEMENT les 4 sous-onglets standard de la Qualité (Programme, Constats & plans
  // d'action, Grilles, Référentiels). Aucun extra : même structure dans les 3 services.
  const pConfAudit = panelWrap('audit', false,
    panelAudit([], auditProg, auditGrilles, auditQuestions, auditAuto, [], {
      domaine: 'environnement',
      titre: 'Audit Conformité — ISO 14001 (programme commun Qualité)',
      nu: true,
    }))

  // ─── SEIRICH — axe Environnement (lecture, source : Sécurité › Chimie) ───
  const chimEnv = chimiques.map((c: any) => ({ c, r: computeRisqueChimique(c) }))
    .sort((a: any, b: any) => (b.r.niveauEnv - a.r.niveauEnv) || (b.r.niveauMax - a.r.niveauMax))
  const nEnvElv = chimEnv.filter((x: any) => x.r.niveauEnv === 3).length
  const nEnvMoy = chimEnv.filter((x: any) => x.r.niveauEnv === 2).length
  const nivChip = (n: number) => { const m = SEIRICH_NIVEAUX[n] || SEIRICH_NIVEAUX[0]; return `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:.65rem;font-weight:800;background:${m[0]};color:${m[1]};">${m[2]}</span>` }
  const chimEnvTop = chimEnv.filter((x: any) => x.r.niveauEnv >= 2).slice(0, 10)

  // ─── Tableau de bord environnement ───
  const dechetsDanger = dechets.filter((d: any) => d.dangereux === true)
  const dechetMoisQte = dechets.filter((d: any) => String(d.date_dechet || '').slice(0, 7) === month).reduce((s: number, d: any) => s + (Number(d.quantite) || 0), 0)
  const eauMois = mesuresEnv.filter((m: any) => m.type === 'conso_eau' && String(m.date_mesure || '').slice(0, 7) === month).reduce((s: number, m: any) => s + (Number(m.valeur) || 0), 0)
  const rejetsNC = mesuresEnv.filter((m: any) => m.conforme === false).length
  const confAlerte = conformite.filter((x: any) => x.statut === 'non_conforme' || (x.date_echeance && String(x.date_echeance).slice(0, 10) < today)).length
  const atexRevue = atex.filter((a: any) => a.date_revue && String(a.date_revue).slice(0, 10) < today).length

  const pDash = panelWrap('dashboard', false,
    `<a href="/dashboard/environnement" style="text-decoration:none;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#16a34a,#047857);border-radius:12px;padding:15px 20px;color:white;margin-bottom:18px;box-shadow:0 4px 16px rgba(22,163,74,.22);">
      <i class="fas fa-chart-line" style="font-size:1.6rem;"></i>
      <div style="flex:1;"><div style="font-weight:800;font-size:.95rem;">Tableau de bord environnemental complet</div><div style="font-size:.72rem;opacity:.92;">Jauges, tendances déchets / eau / énergie, indicateur de veille réglementaire, objectifs — vue graphique ISO 14001.</div></div>
      <span style="font-weight:800;white-space:nowrap;">Ouvrir →</span>
    </a>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px;">
      ${kpi(String(dechets.length), 'Déchets tracés', '#16a34a', 'fa-recycle', dechetsDanger.length + ' dangereux (DD)')}
      ${kpi(dechetMoisQte ? dechetMoisQte.toLocaleString('fr-FR') : '0', 'Déchets du mois', '#0d9488', 'fa-weight-scale', 'quantité cumulée')}
      ${kpi(eauMois ? eauMois.toLocaleString('fr-FR') : '0', 'Conso. eau (mois)', '#0ea5e9', 'fa-faucet-drip', 'm³ — source relevés')}
      ${kpi(String(rejetsNC), 'Rejets hors VLE', rejetsNC ? '#dc2626' : '#16a34a', 'fa-triangle-exclamation', 'mesures non conformes')}
      ${kpi(String(nEnvElv), 'Chimie — risque env. élevé', nEnvElv ? '#dc2626' : '#16a34a', 'fa-radiation', nEnvMoy + ' moyen (SEIRICH)')}
      ${kpi(String(aesSignif), 'Aspects significatifs (AES)', aesSignif ? '#c2410c' : '#16a34a', 'fa-seedling', 'ISO 14001')}
      ${kpi(String(confAlerte), 'Conformité — alertes', confAlerte ? '#dc2626' : '#16a34a', 'fa-scale-balanced', 'NC / échéances dépassées')}
      ${kpi(String(atexRevue), 'ATEX — revues dues', atexRevue ? '#c2410c' : '#16a34a', 'fa-burst', 'zones à réviser')}
    </div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start;">
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px 18px;">
        <div style="font-weight:800;color:#1e293b;font-size:.92rem;margin-bottom:4px;"><i class="fas fa-radiation" style="color:${VERT};margin-right:7px;"></i>Risque chimique pour l'environnement <span style="font-size:.6rem;font-weight:800;background:#fef3c7;color:#92400e;border-radius:6px;padding:2px 7px;vertical-align:middle;">SEIRICH — INDICATIF</span></div>
        <div style="font-size:.7rem;color:#94a3b8;margin-bottom:10px;">Axe <strong>Environnement</strong> de la cotation SEIRICH (danger milieu aquatique H400/H410/H411 × quantité). Saisie des produits : <strong>Sécurité › Chimie</strong>.</div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fafafa;"><th style="text-align:left;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Produit</th><th style="text-align:right;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Quantité</th><th style="text-align:center;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Niveau env.</th></tr></thead>
          <tbody>${chimEnvTop.length === 0 ? `<tr><td colspan="3" style="text-align:center;padding:20px;color:#9ca3af;font-size:.8rem;">Aucun produit à risque environnemental notable.</td></tr>` : chimEnvTop.map(({ c, r }: any) => `<tr style="border-bottom:1px solid #f8fafc;">
            <td style="padding:6px 9px;font-size:.76rem;color:#374151;">${esc(c.nom || '—')}</td>
            <td style="padding:6px 9px;font-size:.76rem;color:#374151;text-align:right;">${c.quantite != null && c.quantite !== '' ? esc(c.quantite) + ' ' + esc(c.unite || '') : '—'}</td>
            <td style="padding:6px 9px;text-align:center;">${nivChip(r.niveauEnv)}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <a href="/qualite/service" style="text-decoration:none;background:linear-gradient(135deg,#065f46,#047857);border-radius:12px;padding:16px 18px;color:white;display:block;">
          <div style="font-weight:800;font-size:.9rem;margin-bottom:5px;"><i class="fas fa-clipboard-check" style="margin-right:7px;"></i>Audit environnemental (thème J)</div>
          <div style="font-size:.72rem;opacity:.9;line-height:1.45;">Le programme d'audit interne <strong>ISO 14001</strong> (thème J : maîtrise environnementale, déchets, rejets, ATEX) est piloté dans <strong>Qualité › Audit Conformité</strong>. Les aspects significatifs ci-contre en sont l'entrée.</div>
        </a>
        <a href="/plans/service" style="text-decoration:none;background:white;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 18px;color:#166534;display:block;box-shadow:0 1px 3px rgba(0,0,0,.05);">
          <div style="font-weight:800;font-size:.9rem;margin-bottom:5px;"><i class="fas fa-map-location-dot" style="margin-right:7px;color:${VERT};"></i>Cartographie (Plan / Bâtiment)</div>
          <div style="font-size:.72rem;color:#64748b;line-height:1.45;">Localiser les zones ATEX, stockages de déchets dangereux et points de rejet sur le plan de l'usine (repères <em>chimie / atex / zone</em>).</div>
        </a>
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px 16px;font-size:.72rem;color:#166534;line-height:1.5;">
          <strong><i class="fas fa-circle-info" style="margin-right:5px;"></i>Traitement de surface</strong> — l'oxydation chromique (Cr VI) est <strong>sous-traitée</strong> ; en interne, chromatation trivalente <strong>Surtec 650</strong>. Déchets de bains, boues d'hydroxydes et rinçages = <strong>déchets dangereux</strong> à tracer (BSDD).
        </div>
      </div>
    </div>`)

  // ─── onglets ───
  // Onglets de premier niveau. « Veille réglementaire », « Autodiagnostics » et les parties
  // intéressées vivaient auparavant en sous-onglets de l'onglet Audit : il fallait deviner
  // qu'ils étaient là. Ils sont désormais au même niveau que le reste (organisation Qualité).
  const TABS = [
    ['dechets', 'Déchets', 'fa-recycle'],
    ['rejets', 'Rejets & mesures', 'fa-droplet'],
    ['atex', 'ATEX', 'fa-burst'],
    ['aspects', 'Aspects & parties', 'fa-seedling'],
    ['icpe', 'ICPE / Seveso', 'fa-industry'],
    ['ges', 'Bilan GES', 'fa-earth-europe'],
    ['veille', 'Veille réglementaire', 'fa-scale-balanced'],
    ['autodiag', 'Autodiagnostics', 'fa-clipboard-check'],
    ['audit', 'Audit Conformité', 'fa-shield-alt'],
    ['dashboard', 'Tableau de bord', 'fa-gauge-high'],
  ]
  const TAB_BADGE: Record<string, number> = {
    dechets: dechets.length, rejets: mesuresEnv.length, atex: atex.length,
    aspects: aspects.length + parties.length,
    veille: conformite.length,
    autodiag: diagnostic.length + iso26000.length + rse.length,
    audit: auditProgDomaine(auditProg, 'environnement').length,   // MÊME périmètre que le panneau (filtré ISO 14001)
  }
  const ENV_GROUPS: Record<string, string[]> = {
    dechets: ['dechets'], rejets: ['rejets'], atex: ['atex'],
    aspects: ['aspects', 'parties'],
    icpe: ['icpe'], ges: ['ges'],
    veille: ['veille'],
    autodiag: ['autodiag-iso', 'autodiag-rse'],
    audit: ['audit'], dashboard: ['dashboard'],
  }

  const allRows = { dechets, 'mesures-env': mesuresEnv, atex, 'aspects-impacts': aspects, rse, conformite, 'parties-interessees': parties, 'diagnostic-iso': diagnostic, 'diagnostic-iso26000': iso26000 }

  // ─── formulaires (data-driven) ───
  const FORMS = {
    'dechets': { title: 'Déchet (registre)', fields: [
      { k: 'date_dechet', label: 'Date', type: 'date' },
      { k: 'code_dechet', label: 'Code déchet EU (2014/955/UE — * = dangereux)', type: 'datalist', options: CODE_DECHETS_EU.map((d) => d.code) },
      { k: 'designation', label: 'Désignation', req: true, full: true },
      { k: 'dangereux', label: 'Dangereux (auto si code *)', type: 'checkbox' },
      { k: 'quantite', label: 'Quantité', type: 'number' }, { k: 'unite', label: 'Unité' },
      { k: 'zone_producteur', label: 'Zone productrice' },
      { k: 'filiere', label: 'Filière (code R/D)', type: 'datalist', options: FILIERES_RD.map((f) => f.code + ' — ' + f.libelle) },
      { k: 'transporteur', label: 'Transporteur' }, { k: 'exutoire', label: 'Exutoire' },
      { k: 'bsdd_num', label: 'N° BSDD' }, { k: 'trackdechets_id', label: 'ID Trackdéchets' },
      { k: 'statut', label: 'Cycle du bordereau (BSD)', type: 'select', options: [...BSD_CYCLE, ['enleve', 'Enlevé (ancien)'], ['en_attente', 'En attente (ancien)']] },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'mesures-env': { title: 'Mesure environnementale', fields: [
      { k: 'type', label: 'Type', type: 'select', options: [['conso_eau', 'Consommation eau'], ['rejet_eau', 'Rejet eau'], ['emission_air', 'Émission air'], ['bruit', 'Bruit'], ['energie', 'Énergie']] },
      { k: 'date_mesure', label: 'Date', type: 'date' }, { k: 'point_mesure', label: 'Point de mesure' },
      { k: 'parametre', label: 'Paramètre', type: 'datalist', options: VLE_REFERENCE.map((r) => r.parametre) }, { k: 'valeur', label: 'Valeur', type: 'number' }, { k: 'unite', label: 'Unité' },
      { k: 'vle', label: 'Valeur limite (VLE)', type: 'number' }, { k: 'conforme', label: 'Conforme (si pas de VLE)', type: 'checkbox' },
      { k: 'organisme', label: 'Organisme' }, { k: 'observations', label: 'Observations', type: 'textarea', full: true },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'atex': { title: 'Zone ATEX — critères DRPCE', fields: [
      { k: 'nom', label: 'Nom de la zone', req: true },
      { k: 'type_zone', label: 'Classement (zone ATEX)', type: 'select', options: [['0', '0 — gaz permanent'], ['1', '1 — gaz occasionnel'], ['2', '2 — gaz rare/bref'], ['20', '20 — poussière permanent'], ['21', '21 — poussière occasionnel'], ['22', '22 — poussière rare/bref']] },
      { k: 'localisation', label: 'Localisation / étendue de la zone' },
      { k: 'origine_risque', label: 'Origine du risque', type: 'select', options: [['gaz', 'Gaz / vapeur'], ['poussiere', 'Poussière']] },
      { k: 'substances', label: 'Substances inflammables (nom, LIE/LSE)' },
      { k: 'sources_inflammation', label: 'Sources d\'inflammation identifiées', full: true },
      { k: 'materiel_requis', label: 'Matériel conforme requis (catégorie/marquage)' },
      { k: 'mesures', label: 'Mesures techniques de PRÉVENTION (éviter la formation d\'ATEX)', type: 'textarea', full: true },
      { k: 'mesures_protection', label: 'Mesures de PROTECTION + ORGANISATIONNELLES (limiter les effets, formation, permis feu, consignes, coordination)', type: 'textarea', full: true },
      { k: 'evaluateur', label: 'Évaluateur (DRPCE)' },
      { k: 'date_revue', label: 'Date d\'évaluation / revue', type: 'date' },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'aspects-impacts': { title: 'Aspect / impact environnemental', fields: [
      { k: 'activite', label: 'Activité / processus', req: true, type: 'datalist', options: ['Traitement de surface', 'Usinage', 'Tôlerie / chaudronnerie', 'Dégraissage', 'Peinture / vernis', 'Stockage produits chimiques', 'Maintenance', 'Logistique / transport', 'Bâtiment / utilités'] },
      { k: 'aspect', label: 'Aspect environnemental', req: true, full: true, type: 'datalist', options: ['Rejet aqueux', 'Émission atmosphérique', 'Déchet dangereux', 'Déchet non dangereux', 'Consommation d\'eau', 'Consommation d\'énergie', 'Bruit', 'Odeur', 'Consommation de matières', 'Risque de déversement / pollution du sol'] },
      { k: 'impact', label: 'Impact sur l\'environnement', full: true },
      { k: 'milieu', label: 'Milieu', type: 'select', options: [['eau', 'Eau'], ['air', 'Air'], ['sol', 'Sol'], ['dechet', 'Déchet'], ['energie', 'Énergie'], ['bruit', 'Bruit'], ['ressource', 'Ressource']] },
      { k: 'etape_cycle_vie', label: 'Étape du cycle de vie (§6.1.2)', type: 'select', options: [['', '—'], ...CYCLE_VIE_ETAPES.map((e) => [e.etape, e.etape])] },
      { k: 'condition', label: 'Condition', type: 'select', options: [['normal', 'Normale'], ['anormal', 'Anormale (démarrage/arrêt)'], ['urgence', 'Urgence (accident)']] },
      { k: 'gravite', label: 'Gravité G (1/3/5/7)', type: 'number' }, { k: 'frequence', label: 'Fréquence F (1/3/5/7)', type: 'number' },
      { k: 'probabilite', label: 'Probabilité P — mode dégradé (1/3/5/7)', type: 'number' }, { k: 'sensibilite', label: 'Sensibilité du milieu S (1/3/5/7)', type: 'number' },
      { k: 'maitrise_technique', label: 'Maîtrise technique (1/3/5/7)', type: 'number' }, { k: 'maitrise_humaine', label: 'Maîtrise humaine (1/3/5/7)', type: 'number' }, { k: 'maitrise_organisationnelle', label: 'Maîtrise organisationnelle (1/3/5/7)', type: 'number' },
      { k: 'significatif', label: 'AES significatif (auto si note ≥ 1000)', type: 'checkbox' },
      { k: 'exigence', label: 'Exigence légale associée', full: true },
      { k: 'maitrise_moyens', label: 'Moyens de maîtrise existants', type: 'textarea', full: true },
      { k: 'action', label: 'Action / objectif (programme env.)', type: 'textarea', full: true },
      { k: 'responsable', label: 'Responsable' }, { k: 'echeance', label: 'Échéance', type: 'date' },
      { k: 'statut', label: 'Statut', type: 'select', options: [['a_traiter', 'À traiter'], ['en_cours', 'En cours'], ['maitrise', 'Maîtrisé']] },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'rse': { title: 'Indicateur RSE', fields: [
      { k: 'periode', label: 'Période (ex: 2026)' },
      { k: 'categorie', label: 'Catégorie', type: 'select', options: [['social', 'Social'], ['environnement', 'Environnement'], ['gouvernance', 'Gouvernance']] },
      { k: 'code', label: 'Code' }, { k: 'libelle', label: 'Libellé', req: true, full: true },
      { k: 'valeur', label: 'Valeur', type: 'number' }, { k: 'unite', label: 'Unité' }, { k: 'cible', label: 'Cible', type: 'number' },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'conformite': { title: 'Obligation / veille réglementaire', fields: [
      { k: 'domaine', label: 'Domaine', type: 'select', options: [['icpe', 'ICPE / Environnement'], ['iso14001', 'ISO 14001'], ['rse', 'RSE'], ['iso26000', 'ISO 26000'], ['atex', 'ATEX']] },
      { k: 'obligation', label: 'Obligation', req: true, full: true },
      { k: 'reference_reglementaire', label: 'Référence réglementaire (article)', full: true },
      { k: 'type_texte', label: 'Type de texte', type: 'select', options: [['loi', 'Loi'], ['decret', 'Décret'], ['arrete', 'Arrêté'], ['directive', 'Directive UE'], ['reglement', 'Règlement UE'], ['norme', 'Norme (ISO…)'], ['arrete_prefectoral', 'Arrêté préfectoral'], ['autre', 'Autre']] },
      { k: 'source', label: 'Source de veille (organisme / URL)' },
      { k: 'date_parution', label: 'Date de parution / MàJ du texte', type: 'date' },
      { k: 'applicable', label: 'Applicable', type: 'checkbox' },
      { k: 'statut', label: 'Statut', type: 'select', options: [['a_verifier', 'À vérifier'], ['conforme', 'Conforme'], ['partiel', 'Partiel'], ['non_conforme', 'Non conforme'], ['na', 'Non applicable']] },
      { k: 'date_dernier_controle', label: 'Dernier contrôle', type: 'date' }, { k: 'date_echeance', label: 'Échéance', type: 'date' },
      { k: 'responsable', label: 'Responsable' }, { k: 'preuve_url', label: 'Preuve (URL)', full: true },
      { k: 'observations', label: 'Observations', type: 'textarea', full: true }] },
    'parties-interessees': { title: 'Partie intéressée (ISO 14001 §4.2)', fields: [
      { k: 'partie', label: 'Partie intéressée', req: true, type: 'datalist', options: ['DREAL', 'Riverains', 'Clients', 'Personnel', 'Direction', 'Assureur', 'Banque', 'Mairie / collectivité', 'Fournisseurs', 'Sous-traitants', 'Syndicats', 'Inspection du travail'] },
      { k: 'type', label: 'Type', type: 'select', options: [['externe', 'Externe'], ['interne', 'Interne']] },
      { k: 'attentes', label: 'Attentes / exigences', full: true, type: 'textarea' },
      { k: 'influence', label: 'Influence (1 = faible → 4 = très influente)', type: 'number' },
      { k: 'maitrise', label: 'Maîtrise (1 = très forte → 4 = pas maîtrisée)', type: 'number' },
      { k: 'exigence_retenue', label: 'Exigence retenue', full: true },
      { k: 'mode_reponse', label: 'Mode de réponse', full: true },
      { k: 'statut', label: 'Statut', type: 'select', options: [['a_suivre', 'À suivre'], ['maitrise', 'Maîtrisé'], ['critique', 'Critique']] },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'diagnostic-iso': { title: 'Diagnostic ISO 14001', fields: [
      { k: 'chapitre', label: 'Chapitre (4 à 10)', type: 'select', options: ISO14001_DIAGNOSTIC.map((d) => [d.chapitre, d.chapitre + ' — ' + d.titre]) },
      { k: 'titre', label: 'Exigence clé', full: true },
      { k: 'niveau_actuel', label: 'Niveau actuel', type: 'select', options: ISO14001_NIVEAUX.map((n) => [n[0], n[0] + ' — ' + n[1]]) },
      { k: 'niveau_cible', label: 'Niveau cible', type: 'select', options: ISO14001_NIVEAUX.map((n) => [n[0], n[0] + ' — ' + n[1]]) },
      { k: 'constat', label: 'Constat', full: true, type: 'textarea' },
      { k: 'action', label: 'Action de mise à niveau', full: true, type: 'textarea' },
      { k: 'responsable', label: 'Responsable' }, { k: 'echeance', label: 'Échéance', type: 'date' },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
    'diagnostic-iso26000': { title: 'Question centrale ISO 26000', fields: [
      { k: 'code', label: 'Question centrale', type: 'select', options: ISO26000_QUESTIONS.map((q) => [q.code, q.code + ' — ' + q.titre]) },
      { k: 'titre', label: 'Intitulé', full: true },
      { k: 'niveau_actuel', label: 'Niveau actuel', type: 'select', options: ISO14001_NIVEAUX.map((n) => [n[0], n[0] + ' — ' + n[1]]) },
      { k: 'niveau_cible', label: 'Niveau cible', type: 'select', options: ISO14001_NIVEAUX.map((n) => [n[0], n[0] + ' — ' + n[1]]) },
      { k: 'constat', label: 'Constat', full: true, type: 'textarea' },
      { k: 'action', label: 'Action de progrès', full: true, type: 'textarea' },
      { k: 'responsable', label: 'Responsable' }, { k: 'echeance', label: 'Échéance', type: 'date' },
      { k: 'entite', label: 'Site', type: 'select', options: 'ent' }] },
  }

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">
    ${serviceHeader({
      icon: 'fa-leaf', color: VERT, darkBg: DARKV,
      title: 'Service Environnement', subtitle: 'ICPE / DREAL · Déchets & Trackdéchets · Rejets · ATEX · ISO 14001 / 26000 · RSE',
      tabs: TABS.map(([id, lbl, ic]) => ({ id, label: lbl, icon: ic, badge: (TAB_BADGE as any)[id] || undefined })),
      switchFn: 'secShowTab', tabIdPrefix: 'sec-tab', activeId: 'dechets',
    })}
    <div style="padding:22px 30px;">
      ${pDechets}${pRejets}${pAtex}${pAspects}${pParties}${pIcpe}${pGes}${pVeille}${pIso14001}${pIso26RSE}${pConfAudit}${pDash}
    </div>
  </div>

  <div id="sec-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:26px;max-width:660px;width:92%;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="sec-modal-content"></div>
    </div>
  </div>

  <script>
  var SEC_TABS=${sjX(TABS.map(t => t[0]))};
  var SEC_GROUPS=${sjX(ENV_GROUPS)};
  function secShowTab(id){
    Object.keys(SEC_GROUPS).forEach(function(g){ SEC_GROUPS[g].forEach(function(pid){ var p=document.getElementById('sec-panel-'+pid); if(p) p.style.display='none'; }); });
    (SEC_GROUPS[id]||[id]).forEach(function(pid){ var p=document.getElementById('sec-panel-'+pid); if(p) p.style.display='block'; });
    SEC_TABS.forEach(function(t){ var b=document.getElementById('sec-tab-'+t); if(b) b.classList.toggle('active',t===id); });
  }
  function secFilter(tableId,q){ var tbl=document.getElementById(tableId); if(!tbl)return; var lq=(q||'').toLowerCase().trim(); tbl.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=(!lq||tr.textContent.toLowerCase().indexOf(lq)>=0)?'':'none'; }); }

  async function envDeclarerPerissables(){
    if(!confirm('Déclarer en déchets tous les produits périssables périmés ?')) return;
    try{
      var r = await fetch('/api/environnement/perissables-expires/declarer',{method:'POST'});
      var j = await r.json();
      if(j && j.ok){ alert(j.created+' déchet(s) créé(s) sur '+j.expires+' produit(s) périmé(s).'); if(j.created>0) location.reload(); }
      else { alert('Erreur lors de la déclaration.'); }
    }catch(e){ alert('Erreur réseau.'); }
  }
  async function envInitDiagIso(){
    if(!confirm('Initialiser la grille de diagnostic ISO 14001 (7 chapitres) ?')) return;
    try{
      var r = await fetch('/api/environnement/diagnostic-iso/init',{method:'POST'});
      var j = await r.json();
      if(j && j.ok){ if(j.created>0) location.reload(); else alert('Grille déjà initialisée.'); }
      else { alert('Erreur.'); }
    }catch(e){ alert('Erreur réseau.'); }
  }
  async function envInitIso26000(){
    if(!confirm('Initialiser l\\'autodiagnostic ISO 26000 (7 questions centrales) ?')) return;
    try{
      var r = await fetch('/api/environnement/diagnostic-iso26000/init',{method:'POST'});
      var j = await r.json();
      if(j && j.ok){ if(j.created>0) location.reload(); else alert('Autodiagnostic déjà initialisé.'); }
      else { alert('Erreur.'); }
    }catch(e){ alert('Erreur réseau.'); }
  }
  var SEC_ROWS=${sjX(allRows)};
  var SEC_ENT=[['Seem','Seem'],['Semrac','Semrac']];
  var SEC_FORMS=${sjX(FORMS)};

  function escA(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function optsHtml(opts,val){
    var list=opts; if(opts==='ent')list=SEC_ENT;
    var out='<option value="">—</option>';
    list.forEach(function(o){ var v=Array.isArray(o)?o[0]:o; var l=Array.isArray(o)?o[1]:o; out+='<option value="'+escA(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+escA(l)+'</option>'; });
    return out;
  }
  var INP='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .65rem;font-size:.82rem;color:#374151;background:#f8fafc;outline:none;';
  var LAB='display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:.25rem;';
  function fldHtml(f,val){
    var id='secf-'+f.k, inp;
    if(f.type==='textarea') inp='<textarea id="'+id+'" rows="2" style="'+INP+'">'+escA(val)+'</textarea>';
    else if(f.type==='select') inp='<select id="'+id+'" style="'+INP+'">'+optsHtml(f.options,val)+'</select>';
    else if(f.type==='datalist'){ var lid=id+'-dl'; var dl='<datalist id="'+lid+'">'; (f.options||[]).forEach(function(o){ var v=Array.isArray(o)?o[1]:o; dl+='<option value="'+escA(v)+'"></option>'; }); dl+='</datalist>'; inp='<input id="'+id+'" list="'+lid+'" type="text" value="'+escA(val)+'" style="'+INP+'"/>'+dl; }
    else if(f.type==='checkbox') inp='<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:#374151;padding-top:4px;"><input id="'+id+'" type="checkbox" '+(val===true||val==='true'?'checked':'')+' style="width:16px;height:16px;"/> Oui</label>';
    else inp='<input id="'+id+'" type="'+(f.type||'text')+'" value="'+escA(val)+'" style="'+INP+'"/>';
    return '<div style="'+(f.full?'grid-column:1/-1;':'')+'"><label style="'+LAB+'">'+f.label+(f.req?' *':'')+'</label>'+inp+'</div>';
  }
  var SEC_EDIT=null, SEC_ENTITY=null;
  function secOpen(entity, idx){
    var form=SEC_FORMS[entity]; if(!form) return;
    var row=(idx!=null && SEC_ROWS[entity]) ? SEC_ROWS[entity][idx] : null;
    var _today=new Date().toISOString().slice(0,10);
    SEC_EDIT=row? row.id : null; SEC_ENTITY=entity;
    var body='<div style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:16px;"><i class="fas fa-leaf" style="color:${VERT};margin-right:8px;"></i>'+(row?'Modifier — ':'Nouveau — ')+form.title+'</div>';
    body+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    form.fields.forEach(function(f){ var dv = row? row[f.k] : (f.type==='date'?_today:''); body+=fldHtml(f, dv); });
    body+='</div>';
    body+='<label style="display:flex;align-items:center;gap:9px;padding:9px 12px;margin-top:14px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;font-size:.76rem;color:#92400e;font-weight:600;cursor:pointer;"><input type="checkbox" id="sec_vd" style="width:16px;height:16px;accent-color:#f59e0b;"/><i class="fas fa-crown" style="color:#f59e0b;"></i>Soumettre à la validation de la Direction</label>';
    body+='<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">'
      +'<button onclick="secClose()" style="padding:9px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:.82rem;font-weight:700;color:#6b7280;">Annuler</button>'
      +'<button onclick="secSave(\\''+entity+'\\')" style="padding:9px 18px;border:none;border-radius:8px;background:linear-gradient(135deg,${VERT},#15803d);color:white;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer</button></div>';
    document.getElementById('sec-modal-content').innerHTML=body;
    document.getElementById('sec-modal-overlay').style.display='flex';
  }
  function secClose(){ var o=document.getElementById('sec-modal-overlay'); if(o)o.style.display='none'; }
  function secSave(entity){
    var form=SEC_FORMS[entity]; if(!form) return;
    var p={};
    form.fields.forEach(function(f){
      var el=document.getElementById('secf-'+f.k); if(!el) return;
      var v;
      if(f.type==='checkbox') v=el.checked;
      else if(f.type==='number'){ v=el.value===''?null:Number(el.value); }
      else v=el.value===''?null:el.value;
      p[f.k]=v;
    });
    var url='/api/securite/'+entity+(SEC_EDIT?('/'+encodeURIComponent(SEC_EDIT)):'');
    fetch(url,{method:SEC_EDIT?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
      .then(function(r){return r.json();})
      .then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
        var _obj=form.title+(p.designation?' — '+p.designation:(p.obligation?' — '+p.obligation:(p.aspect?' — '+p.aspect:(p.libelle?' — '+p.libelle:(p.nom?' — '+p.nom:'')))));
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

  return layout('Environnement', content, 'service-environnement')
}
