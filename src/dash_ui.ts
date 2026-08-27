// ══════════════════════════════════════════════════════════════
// KIT VISUEL DASHBOARDS – ERP Seem Semrac v2.0
// Primitives HTML + jauges/sparklines SVG inline + blocs Chart.js.
// Chart.js : la config voyage dans le DOM (data-chart) → STATELESS,
// aucun registre module-level, aucun risque inter-requêtes.
// ══════════════════════════════════════════════════════════════
import type { Objectif } from './kpi'
import { statutObjectif } from './kpi'
import type { DashFilter } from './dash_filter'
import { filterQS } from './dash_filter'

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// ─── HEAD : charge Chart.js (à passer en extraHead de layout) ──
export const DASH_HEAD = `<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  .dash-canvas-wrap{position:relative;width:100%;}
  .kpi-pulse{animation:kpiPulse .5s ease;}
  @keyframes kpiPulse{from{transform:scale(.96);opacity:.4}to{transform:scale(1);opacity:1}}
</style>`

// Mode impression PDF (?print=1) : masque la sidebar + la barre de filtres, met en page A4 paysage,
// et déclenche l'impression une fois les graphes rendus.
export const PRINT_HEAD = `<style>
  @media print {
    aside { display:none !important; }
    .no-print { display:none !important; }
    body { background:#fff !important; }
    [style*="box-shadow"] { box-shadow:none !important; }
    @page { size: A4 landscape; margin: 9mm; }
  }
</style>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},900)});</script>`

// ─── Conteneurs ───────────────────────────────────────────────
export const card = (content: string, style = '') => `<div style="background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.04);border:1px solid #f1f5f9;${style}">${content}</div>`

export const cardTitle = (txt: string, icon: string, color = '#3b82f6') =>
  `<div style="font-weight:800;color:#111827;margin-bottom:14px;font-size:.9rem;display:flex;align-items:center;gap:8px;"><i class="fas ${icon}" style="color:${color};"></i>${txt}</div>`

export const sectionTitle = (t: string, icon: string) => `
<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin:24px 0 12px;display:flex;align-items:center;gap:8px;">
  <i class="fas ${icon}" style="color:#cbd5e1;"></i>${t}
  <span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span>
</div>`

export const emptyState = (msg: string) => `<div style="text-align:center;padding:26px 12px;color:#9ca3af;font-size:.78rem;"><i class="fas fa-inbox" style="font-size:1.4rem;display:block;margin-bottom:8px;opacity:.35;"></i>${esc(msg)}</div>`

// ─── KPI CARD v2 (tendance + objectif) ────────────────────────
export type KpiOpts = { trend?: string; obj?: { txt: string; color: string }; spark?: number[]; sparkColor?: string; href?: string }
export const kpiCard = (icon: string, val: string | number, label: string, sub: string, color: string, bg: string, opts: KpiOpts = {}) => {
  const { trend, obj, spark, sparkColor, href } = opts
  const wrap = (inner: string) => href ? `<a href="${escAttr(href)}" style="text-decoration:none;color:inherit;display:block;">${inner}</a>` : inner
  return wrap(_kpiCardInner(icon, val, label, sub, color, bg, trend, obj, spark, sparkColor))
}
const _kpiCardInner = (icon: string, val: string | number, label: string, sub: string, color: string, bg: string, trend?: string, obj?: { txt: string; color: string }, spark?: number[], sparkColor?: string) => {
  const trendBadge = trend
    ? `<span style="font-size:.68rem;font-weight:700;padding:3px 8px;border-radius:999px;background:${trend.startsWith('+') ? '#f0fdf4' : trend.startsWith('-') ? '#fef2f2' : '#f1f5f9'};color:${trend.startsWith('+') ? '#15803d' : trend.startsWith('-') ? '#b91c1c' : '#64748b'};"><i class="fas fa-arrow-${trend.startsWith('-') ? 'down' : 'up'}" style="font-size:.6rem;margin-right:3px;"></i>${esc(trend)}</span>`
    : ''
  return `
<div style="background:white;border-radius:14px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.04);border:1px solid #f1f5f9;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${color};"></div>
  <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
    <div style="width:42px;height:42px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;">
      <i class="fas ${icon}" style="color:${color};font-size:1rem;"></i>
    </div>
    ${trendBadge}
  </div>
  <div style="font-size:1.8rem;font-weight:900;color:#111827;line-height:1;">${val}</div>
  <div style="font-size:.78rem;font-weight:700;color:#374151;margin-top:4px;">${esc(label)}</div>
  <div style="font-size:.68rem;color:#9ca3af;margin-top:2px;">${esc(sub)}</div>
  ${spark && spark.length ? `<div style="margin-top:8px;">${sparkline(spark, sparkColor || color)}</div>` : ''}
  ${obj ? `<div style="margin-top:8px;display:flex;align-items:center;gap:6px;font-size:.64rem;font-weight:700;color:${obj.color};"><span style="width:7px;height:7px;border-radius:50%;background:${obj.color};display:inline-block;"></span>${esc(obj.txt)}</div>` : ''}
</div>`
}

// Construit l'option objectif pour kpiCard à partir d'une valeur + cible.
export const kpiObj = (val: number, obj: Objectif): KpiOpts['obj'] => {
  const s = statutObjectif(val, obj)
  const u = obj.unite === 'ratio' ? '' : obj.unite
  return { txt: `Objectif ${obj.cible}${u} · ${s.etat === 'ok' ? 'atteint' : s.etat === 'warn' ? 'à surveiller' : 'sous l\'objectif'}`, color: s.color }
}

// ─── Barre horizontale simple (label / valeur / progression) ──
export const miniBar = (label: string, val: number, max: number, color: string, suffix = '') => `
<div style="margin-bottom:8px;">
  <div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:3px;">
    <span style="color:#374151;font-weight:600;">${esc(label)}</span>
    <span style="color:${color};font-weight:700;">${val}${suffix}</span>
  </div>
  <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;">
    <div style="width:${Math.max(0, Math.min(100, Math.round(val / (max || 1) * 100)))}%;height:100%;background:${color};border-radius:3px;"></div>
  </div>
</div>`

// ─── Bullet objectif : réel vs cible (KPIs non-%) ─────────────
export const bulletTarget = (label: string, val: number, obj: Objectif, fmt: (n: number) => string = (n) => String(n)) => {
  const s = statutObjectif(val, obj)
  const scale = Math.max(val, obj.cible, obj.seuil_alerte) * 1.25 || 1
  const pos = (n: number) => Math.max(0, Math.min(100, n / scale * 100))
  return `
<div style="margin-bottom:12px;">
  <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:4px;">
    <span style="color:#374151;font-weight:700;">${esc(label)}</span>
    <span style="color:${s.color};font-weight:800;">${fmt(val)} <span style="color:#9ca3af;font-weight:600;">/ ${fmt(obj.cible)}</span></span>
  </div>
  <div style="position:relative;height:9px;background:#f1f5f9;border-radius:5px;">
    <div style="position:absolute;left:0;top:0;height:100%;width:${pos(val)}%;background:${s.color};border-radius:5px;"></div>
    <div style="position:absolute;left:${pos(obj.cible)}%;top:-2px;height:13px;width:2px;background:#111827;"></div>
  </div>
</div>`
}

// ─── Jauge semi-circulaire (KPIs en %) ────────────────────────
export const gauge = (pct: number, obj: Objectif | null, label: string) => {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  const color = obj ? statutObjectif(pct, obj).color : (p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444')
  const r = 52, cx = 60, cy = 60, len = Math.PI * r
  const dash = len * p / 100
  // marqueur cible
  let tick = ''
  if (obj) {
    const f = Math.max(0, Math.min(1, obj.cible / 100)); const th = Math.PI * (1 - f)
    const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th)
    tick = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#111827"/>`
  }
  return `
<div style="text-align:center;">
  <svg viewBox="0 0 120 70" style="width:100%;max-width:160px;">
    <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#f1f5f9" stroke-width="11" stroke-linecap="round"/>
    <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${len.toFixed(1)}"/>
    ${tick}
    <text x="60" y="52" text-anchor="middle" font-size="20" font-weight="900" fill="#111827">${p}%</text>
  </svg>
  <div style="font-size:.72rem;font-weight:700;color:#374151;margin-top:-4px;">${esc(label)}</div>
  ${obj ? `<div style="font-size:.62rem;color:#9ca3af;">Objectif ${obj.cible}%</div>` : ''}
</div>`
}

// ─── Sparkline (mini-courbe SVG) ──────────────────────────────
export const sparkline = (series: number[], color = '#3b82f6', h = 28) => {
  const s = (series || []).map(Number).filter(n => isFinite(n))
  if (s.length < 2) return `<div style="height:${h}px;"></div>`
  const max = Math.max(...s), min = Math.min(...s), span = (max - min) || 1, w = 100
  const pts = s.map((v, i) => `${(i / (s.length - 1) * w).toFixed(1)},${(h - 3 - (v - min) / span * (h - 6)).toFixed(1)}`).join(' ')
  const last = s[s.length - 1], lx = w, ly = h - 3 - (last - min) / span * (h - 6)
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px;">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${lx}" cy="${ly.toFixed(1)}" r="2.5" fill="${color}"/>
  </svg>`
}

// ─── CHART.JS : bloc canvas + script d'init (stateless) ───────
const attrJSON = (o: any) => JSON.stringify(o).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '\\u003c')

// Émet un <canvas> portant sa propre config Chart.js dans data-chart.
export const chartBlock = (id: string, type: string, data: any, options: any = {}, height = 240) => {
  const cfg = {
    type,
    data,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Inter', size: 11 } } } },
      ...options,
    },
  }
  return `<div class="dash-canvas-wrap" style="height:${height}px;"><canvas id="${esc(id)}" data-chart="${attrJSON(cfg)}"></canvas></div>`
}

// Script unique : instancie tous les canvases porteurs de data-chart.
// À placer une seule fois en fin de content (idempotent, ignore les déjà initialisés).
export const chartScript = () => `
<script>
(function(){
  function build(){
    if (typeof Chart === 'undefined') { return setTimeout(build, 60); }
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#64748b';
    document.querySelectorAll('canvas[data-chart]').forEach(function(cv){
      if (cv.dataset.init) return; cv.dataset.init = '1';
      try { new Chart(cv, JSON.parse(cv.dataset.chart)); }
      catch(e){ console.error('chart init failed for', cv.id, e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
</script>`

// ─── Palettes ─────────────────────────────────────────────────
export const PALETTE = ['#3b82f6', '#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ef4444']
export const PAL_SEEM = '#3b82f6'
export const PAL_SEMRAC = '#ec4899'

// ─── Barre de filtres des dashboards (sticky) ─────────────────
const FB_PRESETS: [string, string][] = [['mois', 'Ce mois'], ['mois-1', 'Mois -1'], ['ytd', 'YTD'], ['12m', '12 mois'], ['annee', 'Année'], ['perso', 'Perso']]
export const filterBar = (f: DashFilter, basePath: string, opts: { clients?: string[]; machines?: string[]; fournisseurs?: string[]; exportable?: boolean } = {}) => {
  const A = (qs: string, lbl: string, on: boolean, accent = '#3b82f6') => `<a href="${escAttr(basePath + qs)}" style="font-size:.7rem;font-weight:700;padding:5px 11px;border-radius:8px;text-decoration:none;${on ? 'background:' + accent + ';color:#fff;' : 'background:#f1f5f9;color:#475569;'}">${lbl}</a>`
  const presetBtn = (p: string, lbl: string) => A(p === 'perso' ? filterQS(f, { preset: 'perso' }) : filterQS(f, { preset: p, from: '', to: '' }), lbl, f.preset === p)
  const dl = (id: string, items?: string[]) => (items && items.length) ? `<datalist id="${id}">${items.slice(0, 300).map(x => `<option value="${escAttr(x)}"></option>`).join('')}</datalist>` : ''
  const ctx = (name: 'client' | 'machine' | 'fournisseur', id: string, ph: string, items?: string[]) => (items && items.length) ? `<input list="${id}" placeholder="${ph}" value="${escAttr((f as any)[name] || '')}" onchange="dashSetFilter('${name}',this.value)" style="font-size:.72rem;padding:5px 9px;border:1px solid #e2e8f0;border-radius:8px;min-width:150px;"/>${dl(id, items)}` : ''
  return `<div class="no-print" style="position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #eef2f7;padding:10px 30px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;">
  <span style="font-size:.66rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-right:2px;"><i class="fas fa-filter"></i></span>
  ${FB_PRESETS.map(p => presetBtn(p[0], p[1])).join('')}
  ${f.preset === 'perso' ? `<input type="date" value="${escAttr(f.from)}" onchange="dashSetFilter('from',this.value)" style="font-size:.72rem;padding:4px 7px;border:1px solid #e2e8f0;border-radius:8px;"/><span style="color:#94a3b8;">→</span><input type="date" value="${escAttr(f.to)}" onchange="dashSetFilter('to',this.value)" style="font-size:.72rem;padding:4px 7px;border:1px solid #e2e8f0;border-radius:8px;"/>` : ''}
  <span style="width:1px;height:20px;background:#e2e8f0;"></span>
  <select onchange="dashSetFilter('site',this.value)" style="font-size:.72rem;padding:5px 9px;border:1px solid #e2e8f0;border-radius:8px;">
    <option value=""${f.site === '' ? ' selected' : ''}>Tous sites</option>
    <option value="Seem"${f.site === 'Seem' ? ' selected' : ''}>Seem</option>
    <option value="Semrac"${f.site === 'Semrac' ? ' selected' : ''}>Semrac</option>
  </select>
  ${ctx('client', 'dl_client', 'Client…', opts.clients)}
  ${ctx('machine', 'dl_machine', 'Machine…', opts.machines)}
  ${ctx('fournisseur', 'dl_fourn', 'Fournisseur…', opts.fournisseurs)}
  ${A(filterQS(f, { compare: (f.compare ? '' : '1') as any }), '<i class="fas fa-code-compare" style="margin-right:4px;"></i>vs N-1', f.compare, '#6366f1')}
  <span style="margin-left:auto;display:flex;gap:8px;align-items:center;">
    ${f.active ? `<a href="${escAttr(basePath)}" style="font-size:.68rem;color:#ef4444;text-decoration:none;font-weight:700;"><i class="fas fa-xmark"></i> Réinit.</a>` : ''}
    ${opts.exportable ? `<a href="${escAttr(basePath + filterQS(f, { print: '1' as any }))}" target="_blank" style="font-size:.7rem;font-weight:700;padding:5px 11px;border-radius:8px;text-decoration:none;background:#0f172a;color:#fff;"><i class="fas fa-file-pdf" style="margin-right:4px;"></i>Exporter</a>` : ''}
  </span>
  <script>if(!window.dashSetFilter){window.dashSetFilter=function(k,v){try{sessionStorage.setItem('__erpScroll',JSON.stringify({p:location.pathname,y:window.scrollY,t:Date.now()}))}catch(e){} var u=new URL(location.href); if(v)u.searchParams.set(k,v); else u.searchParams.delete(k); location.assign(u.pathname+u.search);};}</script>
</div>`
}
