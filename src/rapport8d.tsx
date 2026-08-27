// ══════════════════════════════════════════════════════════════
// RAPPORT 8D — MODULE AUTONOME (extraction portable)
// Extrait de l'ERP Seem/Semrac · page /qualite/8d
// 8 Disciplines · QQOQCCP · Inhibition · Ishikawa 6M · 5 Pourquoi
//
// 100% autonome : aucun import, aucune dépendance backend, sans menu.
// Seules dépendances = CDN (Tailwind, FontAwesome, police Inter).
//
// Intégration dans un autre ERP Hono SSR :
//     import { pageRapport8D } from './rapport8d-standalone'
//     app.get('/qualite/8d', (c) => c.html(pageRapport8D()))
//
// Pour rebrancher la clôture sur une API, voir cloturerRapport8D()
// en bas de fichier (le code d'origine y est conservé en commentaire).
// ══════════════════════════════════════════════════════════════

import { SIDEBAR_V2 } from './shared'

// ─── HELPERS HTML (inlinés depuis erp_v3.tsx / shared.ts) ─────
const f = (label: string, type: string, placeholder: string, req = true, span2 = false, id = '', value = '') => {
  const idAttr = id ? ` id="${id}"` : ''
  const val = value ? value.replace(/"/g, '&quot;') : ''
  return `
<div${span2?' style="grid-column:span 2"':''}>
  <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">${label}${req?'<span style="color:#ef4444;margin-left:2px;">*</span>':''}</label>
  ${type==='textarea'
    ? `<textarea${idAttr} placeholder="${placeholder}" rows="3" class="form-input" style="resize:vertical;" ${req?'required':''}>${val}</textarea>`
    : type==='select'
    ? `<select${idAttr} class="form-input" ${req?'required':''}><option value="">${placeholder}</option></select>`
    : `<input${idAttr} type="${type}" placeholder="${placeholder}" value="${val}" class="form-input" ${req?'required':''}/>`
  }
</div>`
}
const row2 = (a: string, b: string) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">${a}${b}</div>`
const row3 = (a: string, b: string, c: string) => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">${a}${b}${c}</div>`
const card = (content: string) => `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:20px;">${content}</div>`
const sec = (label: string, icon = 'fa-circle') => `<div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;margin-top:4px;display:flex;align-items:center;gap:8px;"><i class="fas ${icon}" style="color:#94a3b8;font-size:.6rem;"></i>${label}<span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span></div>`
const badge = (s: string, bg: string, col: string) => `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${s}</span>`

const pageHeader = (icon: string, color: string, title: string, subtitle: string, badges: string[] = []) => `
<div style="padding:16px 24px;background:white;border-bottom:1px solid #f1f5f9;position:sticky;top:0;z-index:30;">
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,${color});display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;flex-shrink:0;">
      <i class="${icon}"></i>
    </div>
    <div style="min-width:0;">
      <h1 style="font-size:1.1rem;font-weight:800;color:#111827;margin:0;">${title}</h1>
      <p style="color:#9ca3af;font-size:.72rem;margin:3px 0 0;">${subtitle}</p>
    </div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0;">
      ${badges.map(b=>`<span class="chip-en9100">${b}</span>`).join('')}
    </div>
  </div>
</div>`

const afterBox = (mails: string[], docs: string[], actions: string[], dest = '') => `
<div class="after-box" style="margin-top:16px;">
  <div style="font-size:.72rem;font-weight:800;color:#1d4ed8;margin-bottom:8px;"><i class="fas fa-bolt mr-1" style="color:#3b82f6;"></i>Après validation – Flux automatique Power Automate</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;">
    ${mails.map(m=>`<span class="chip-mail"><i class="fas fa-envelope mr-1"></i>${m}</span>`).join('')}
    ${docs.map(d=>`<span class="chip-doc"><i class="fas fa-file mr-1"></i>${d}</span>`).join('')}
    ${actions.map(a=>`<span class="chip-action"><i class="fas fa-arrow-right mr-1"></i>${a}</span>`).join('')}
    ${dest?`<span style="margin-left:auto;font-size:.72rem;color:#1d4ed8;font-weight:600;"><i class="fas fa-user mr-1"></i>→ ${dest}</span>`:''}
  </div>
</div>`

// ─── COQUE AUTONOME (sans menu latéral, sans backend) ─────────
const layout8d = (title: string, content: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{font-family:'Inter',sans-serif;box-sizing:border-box;}
    body{background:#f1f5f9;margin:0;}
    .card{background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);}
    .form-label{display:block;font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;}
    .form-input{width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;color:#374151;background:#f8fafc;outline:none;transition:border-color .2s,box-shadow .2s;}
    .form-input:focus{border-color:#3b82f6;background:white;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
    .badge{display:inline-flex;align-items:center;gap:.3rem;padding:2px 10px;border-radius:999px;font-size:.7rem;font-weight:700;}
    .after-box{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:1rem;}
    .notif-banner{position:fixed;top:1rem;right:1rem;z-index:9000;max-width:380px;}
    .notif{background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.15);padding:.9rem 1.1rem;border-left:4px solid;margin-bottom:.5rem;font-size:.8rem;animation:slideIn .3s ease;}
    .notif-ok{border-color:#22c55e;} .notif-warn{border-color:#f59e0b;} .notif-err{border-color:#ef4444;} .notif-info{border-color:#3b82f6;}
    @keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
    .chip-mail{background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-doc{background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-action{background:#f3e8ff;border:1px solid #c4b5fd;color:#4c1d95;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-en9100{background:#1e3a5f;color:#93c5fd;border:1px solid #3b82f6;border-radius:6px;padding:2px 9px;font-size:.7rem;font-weight:700;}
    select.form-input option:disabled{color:#9ca3af;font-style:italic;}
  </style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_V2('service-qualite')}
<main class="flex-1 overflow-y-auto" style="min-width:0;">
  ${content}
</main>
<div class="notif-banner" id="notifBanner"></div>
<script>
function pushNotif(type,icon,msg,dur=5000){
  const b=document.getElementById('notifBanner');
  if(!b)return;
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML='<i class="fas '+icon+' mr-2"></i>'+msg+' <button onclick="document.getElementById(\\''+id+'\\').remove()" style="float:right;background:none;border:none;cursor:pointer;color:#9ca3af;margin-left:8px;"><i class="fas fa-times"></i></button>';
  b.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.transition='opacity .4s';e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},dur);
}
</script>
</body>
</html>`

export type Rapport8DData = {
  nc?: any              // NC à préremplir (depuis ?nc=)
  ncs?: any[]           // liste des NC ouvertes pour le datalist
  responsables?: any[]  // salariés actifs [{id, nom}] → menu Chef de projet (FK)
  numero?: string       // N° 8D auto (id rapports_8d)
  today?: string        // date du jour ISO
  rapport?: any         // rapport 8D existant à charger (depuis ?id=) → hydratation complète
}

const GRAV_8D_FROM_NC: Record<string, string> = {
  'Mineure': 'mineure', 'Majeure': 'majeure', 'Critique': 'critique', 'Bloquante': 'bloquante',
}

export const pageRapport8D = (data: Rapport8DData = {}) => {
  const NCS: any[] = data.ncs || []
  const NC = data.nc || null
  const RAP = data.rapport || null            // rapport 8D existant (mode consultation/édition)
  const TODAY = data.today || new Date().toISOString().slice(0, 10)
  const NC_REF = RAP ? (RAP.nc_id || '') : (NC ? (NC.id || '') : '')
  // N° 8D auto = dérivé du n° de NC (donc de l'affaire associée) : NC-AAAA-XXX → 8D-AAAA-XXX
  const NUMERO = RAP ? RAP.id : (NC_REF ? NC_REF.replace(/^NC-/i, '8D-') : (data.numero || ''))
  const GRAV = RAP && RAP.gravite
    ? RAP.gravite
    : (NC && NC.gravite ? (GRAV_8D_FROM_NC[NC.gravite] || 'majeure') : 'majeure')
  const PROB_PREFILL = RAP && RAP.d2_probleme
    ? String(RAP.d2_probleme)
    : (NC
      ? `NC ${NC.id || ''}${NC.lot_ref ? ' · Lot ' + NC.lot_ref : ''}${NC.operation ? ' · ' + NC.operation : ''}${NC.client_nom ? ' · Client ' + NC.client_nom : ''}`
      : '')
  const ncOptions = NCS.map((n: any) =>
    `<option value="${n.id}">${n.id}${n.client_nom ? ' — ' + String(n.client_nom).replace(/"/g, '&quot;') : ''}${n.gravite ? ' (' + n.gravite + ')' : ''}</option>`
  ).join('')
  const RESPS: any[] = data.responsables || []
  const respOptions = RESPS.map((r: any) =>
    `<option value="${r.id}">${String(r.nom || r.id).replace(/</g, '&lt;')}</option>`
  ).join('')
  const gravSelect = `<div>
    <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Gravité<span style="color:#ef4444;margin-left:2px;">*</span></label>
    <select id="8d_gravite" class="form-input" required>
      ${['mineure','majeure','critique','bloquante'].map(g => `<option value="${g}"${g===GRAV?' selected':''}>${g.charAt(0).toUpperCase()+g.slice(1)}</option>`).join('')}
    </select>
  </div>`
  const content = `
  ${pageHeader('fas fa-project-diagram','#dc2626,#b91c1c','Rapport 8D – Résolution de problème','Pierre-Yves / Agathe · 8 Disciplines · 5 Pourquoi · Table inhibition · EN9100 10.2',['8D','NC','EN9100 10.2'])}
  <div style="padding:22px 30px;">

    <!-- BARRE PROGRESSION 8D -->
    <div style="background:white;border-radius:14px;padding:16px 20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;flex-wrap:wrap;">
        <div style="font-size:.72rem;font-weight:700;color:#374151;">Progression 8D</div>
        <button onclick="sauvegarderEtQuitter8D()" title="Enregistre l'avancement (statut En cours) et revient à la liste" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:9px;font-size:.76rem;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i>Sauvegarder &amp; quitter</button>
      </div>
      <div style="display:flex;gap:4px;align-items:center;">
        ${['D1 Équipe','D2 Problème','D3 Inhibition','D4 Causes','D5 Actions','D6 Validation','D7 Préventif','D8 Clôture'].map((d,i)=>`
        <div style="flex:1;text-align:center;">
          <div onclick="showD(${i+1})" class="d-step-circle" data-step="${i+1}" style="width:32px;height:32px;border-radius:50%;background:${i<3?'#22c55e':i===3?'#3b82f6':'#e2e8f0'};color:${i<4?'white':'#9ca3af'};display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;margin:0 auto 4px;cursor:pointer;">D${i+1}</div>
          <div class="d-step-label" data-step="${i+1}" style="font-size:.58rem;color:${i<4?'#374151':'#9ca3af'};font-weight:600;line-height:1.2;">${d}</div>
        </div>
        ${i<7?'<div style="height:2px;background:'+(i<3?'#22c55e':i===3?'#3b82f6':'#e2e8f0')+';flex:0.5;margin-bottom:18px;"></div>':''}`).join('')}
      </div>
    </div>

    <!-- D1: ÉQUIPE -->
    <div id="d-panel-1">
      ${card(`
        ${sec('D1 – Constitution de l\'équipe','fa-users')}
        ${row2(
          f('N° 8D (auto)','text','8D-2026-XXX',false,false,'8d_numero',NUMERO),
          `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">NC associée<span style="color:#ef4444;margin-left:2px;">*</span></label><input id="8d_nc_ref" type="text" list="ncList" placeholder="NC-2026-XXX" value="${NC_REF}" class="form-input" oninput="d8SyncNum()" required/><datalist id="ncList">${ncOptions}</datalist></div>`
        )}
        ${row3(
          `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Chef de projet 8D<span style="color:#ef4444;margin-left:2px;">*</span></label><select id="8d_resp" class="form-input" required><option value="">Sélectionner…</option>${respOptions}</select></div>`,
          f('Date ouverture','date','',true,false,'8d_date_ouv',TODAY),
          gravSelect
        )}
        ${row2(
          `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Membres de l'équipe</label><div id="8d_team_chips" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;"></div><div style="display:flex;gap:6px;"><select id="8d_team_sel" class="form-input" style="flex:1;min-width:0;"><option value="">— Choisir un salarié —</option>${respOptions}</select><input id="8d_team_free" type="text" placeholder="ou saisir un nom" class="form-input" style="flex:1;min-width:0;"/><button type="button" onclick="d8TeamAdd()" title="Ajouter le membre" style="background:#dc2626;color:white;border:none;border-radius:8px;padding:0 15px;font-weight:800;font-size:1.05rem;cursor:pointer;">+</button></div><input type="hidden" id="8d_d1"/></div>`,
          f('Compétences requises','text','Ex: Soudure, Métrologie, Process CNC',false)
        )}
        ${f('Raison de la sélection de l\'équipe','textarea','Pourquoi ces personnes ont été choisies…',false,true)}
        <!-- CHAMP RAISON SÉLECTION -->
        ${sec('Raison du problème – Sélection','fa-exclamation-triangle')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
          ${['Réclamation client','Non-conformité interne','Audit qualité','Défaut en production','Retour terrain','Problème fournisseur','Facteur humain'].map(r=>`
          <label style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:.78rem;font-weight:600;color:#374151;">
            <input type="checkbox" style="accent-color:#dc2626;"/> ${r}
          </label>`).join('')}
        </div>
      `)}
    </div>

    <!-- D2: DESCRIPTION DU PROBLÈME – QQOQCCP -->
    <div id="d-panel-2" style="display:none;">
      ${card(`
        ${sec('D2 – Description du problème (QQOQCCP)','fa-search')}
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#92400e;">
          <i class="fas fa-info-circle mr-2"></i>Décrire le problème de façon précise et factuelle. Répondre à chaque question QQOQCCP pour délimiter le périmètre exact.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-question-circle mr-1"></i>QUOI ? (What)</label>
            <textarea id="8d_d2" rows="3" class="form-input" placeholder="Quel est le problème ? Quelle non-conformité ? Quel défaut observé ?&#10;Ex: Bavures excessives sur arête intérieure de la pièce DISSIP-A24, dépassant la tolérance Ra 1.6 μm…" style="resize:vertical;">${PROB_PREFILL}</textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Décrire le défaut observé précisément</div>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#2563eb;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-user mr-1"></i>QUI ? (Who)</label>
            <textarea rows="3" class="form-input" placeholder="Qui a détecté le problème ? Qui est concerné ?&#10;Ex: Détecté par Isabelle R. au contrôle final. Signalé par Legrand (client). Opérateur: Antoine D. tour CNC…" style="resize:vertical;"></textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Parties prenantes impliquées</div>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#d97706;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-calendar mr-1"></i>QUAND ? (When)</label>
            <textarea rows="3" class="form-input" placeholder="Depuis quand ? À quelle fréquence ? Premier constat ?&#10;Ex: Premier signalement client le 10/03/2026. Lot fabriqué du 05 au 07/03. Récurrence sur 3 commandes depuis janvier…" style="resize:vertical;"></textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Chronologie et fréquence d'apparition</div>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#16a34a;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-map-marker-alt mr-1"></i>OÙ ? (Where)</label>
            <textarea rows="3" class="form-input" placeholder="Sur quelle machine ? Quel poste ? Quelle étape du process ?&#10;Ex: Détecté sur Tour CNC Mazak (CNC-01), opération usinage. Visible sur face C usinée en passe de finition…" style="resize:vertical;"></textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Localisation dans le process et sur la pièce</div>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-cogs mr-1"></i>COMMENT ? (How)</label>
            <textarea rows="3" class="form-input" placeholder="Comment le problème se manifeste-t-il ? Comment a-t-il été détecté ?&#10;Ex: Rugosimètre Ra mesure 2.3 μm (tolérance 1.6 μm). Tactile au toucher. Détecté en autocontrôle final…" style="resize:vertical;"></textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Mode de manifestation et de détection</div>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:800;color:#be185d;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-hashtag mr-1"></i>COMBIEN ? (How many)</label>
            <textarea rows="3" class="form-input" placeholder="Quelle quantité affectée ? Quel pourcentage ? Quel coût estimé ?&#10;Ex: 47 pièces affectées sur lot de 200. 23.5% du lot. Retour client 2 colis = 94 pcs. Coût estimé : 1 400 €…" style="resize:vertical;"></textarea>
            <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Ampleur quantifiée du problème</div>
          </div>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;"><i class="fas fa-question mr-1"></i>POURQUOI traiter ? (Why important)</label>
          <textarea rows="2" class="form-input" placeholder="Pourquoi ce problème est-il critique ? Quel impact si non traité ?&#10;Ex: Risque réclamation en série. Pièces destinées aéronautique (EN9100). Pénalité contractuelle Legrand possible. Retour image negative…" style="resize:vertical;width:100%;"></textarea>
          <div style="font-size:.68rem;color:#9ca3af;margin-top:3px;">Impact business et justification de l'urgence</div>
        </div>
        <div style="margin-top:16px;">
          ${sec('Synthèse IS / IS NOT','fa-table')}
          <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
              <thead><tr style="background:#f1f5f9;">
                <th style="padding:8px 14px;text-align:left;color:#6b7280;font-weight:700;width:25%;"></th>
                <th style="padding:8px 14px;text-align:center;background:#dcfce7;color:#15803d;font-weight:800;">IS (ce que c'est)</th>
                <th style="padding:8px 14px;text-align:center;background:#fee2e2;color:#b91c1c;font-weight:800;">IS NOT (ce que ce n'est pas)</th>
              </tr></thead>
              <tbody>
                ${['Quoi','Où','Quand','Combien'].map(q=>`<tr style="border-top:1px solid #f1f5f9;">
                  <td style="padding:8px 14px;font-weight:700;color:#374151;background:#f8fafc;">${q}</td>
                  <td style="padding:6px 10px;"><input type="text" class="form-input" style="font-size:.75rem;" placeholder="Ce que c'est…"/></td>
                  <td style="padding:6px 10px;"><input type="text" class="form-input" style="font-size:.75rem;" placeholder="Ce que ce n'est pas…"/></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `)}
    </div>

    <!-- D3: TABLE INHIBITION -->
    <div id="d-panel-3" style="display:none;">
      ${card(`
        ${sec('D3 – Actions d\'inhibition (containment)','fa-shield-alt')}
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-bottom:14px;font-size:.8rem;color:#b91c1c;">
          <i class="fas fa-exclamation-triangle mr-2"></i>Actions immédiates pour contenir le problème et protéger le client.
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
            <thead><tr style="background:#fef2f2;border-bottom:2px solid #fecaca;">
              <th style="padding:8px 12px;text-align:left;color:#b91c1c;font-weight:700;">N°</th>
              <th style="padding:8px 12px;text-align:left;color:#b91c1c;font-weight:700;">Action d'inhibition</th>
              <th style="padding:8px 12px;text-align:left;color:#b91c1c;font-weight:700;">Responsable</th>
              <th style="padding:8px 12px;text-align:left;color:#b91c1c;font-weight:700;">Date</th>
              <th style="padding:8px 12px;text-align:center;color:#b91c1c;font-weight:700;">Efficacité</th>
              <th style="padding:8px 12px;text-align:center;color:#b91c1c;font-weight:700;">Statut</th>
            </tr></thead>
            <tbody id="inhibitionTable">
              ${([] as string[]).map((a,i)=>`
              <tr style="border-bottom:1px solid #fee2e2;">
                <td style="padding:8px 12px;font-weight:700;color:#374151;">${i+1}</td>
                <td style="padding:8px 12px;"><input type="text" value="${a}" class="form-input" style="font-size:.78rem;"/></td>
                <td style="padding:8px 12px;"><select class="form-input" style="font-size:.78rem;"><option>Pierre-Yves</option><option>Agathe</option><option>Lénaïck</option></select></td>
                <td style="padding:8px 12px;"><input type="date" class="form-input" style="font-size:.78rem;"/></td>
                <td style="padding:8px 12px;text-align:center;"><select class="form-input" style="font-size:.78rem;width:auto;"><option>Efficace</option><option>Partielle</option><option>Insuffisante</option></select></td>
                <td style="padding:8px 12px;text-align:center;">${badge('En cours','#fef9c3','#854d0e')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <button onclick="addInhibition()" style="background:#f1f5f9;border:1.5px dashed #e2e8f0;border-radius:10px;padding:8px;font-size:.78rem;font-weight:600;color:#64748b;cursor:pointer;width:100%;margin-top:10px;">
          <i class="fas fa-plus mr-2"></i>Ajouter une action inhibition
        </button>
      `)}
    </div>

    <!-- D4: ICHIKAWA 6M + 5 POURQUOI -->
    <div id="d-panel-4" style="display:none;">
      ${card(`
        ${sec('D4 – Diagramme d\'Ishikawa (6M) – Recherche des causes','fa-sitemap')}
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#9a3412;">
          <i class="fas fa-info-circle mr-2"></i>Identifiez les causes potentielles par famille 6M, puis utilisez les 5 Pourquoi pour remonter à la cause racine.
        </div>

        <!-- DIAGRAMME ISHIKAWA CSS -->
        <div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;overflow-x:auto;">
          <!-- BRANCHES SUPÉRIEURES (3 branches) -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px;">
            ${[['Méthode','#ef4444','fa-book'],['Matière','#f59e0b','fa-box'],['Machine','#3b82f6','fa-cog']].map(([m,c,ic])=>`
            <div style="background:${c}10;border:1.5px solid ${c}40;border-radius:10px;padding:10px;" id="branch-${m.toLowerCase().replace(' ','-')}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <i class="fas ${ic}" style="color:${c};font-size:.85rem;"></i>
                <span style="font-size:.8rem;font-weight:800;color:${c};">${m}</span>
                <span style="font-size:.6rem;color:#9ca3af;">↘ vers problème</span>
              </div>
              <div class="ishi-causes-${m.toLowerCase().replace(' ','-')}">
                <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
                  <span style="width:6px;height:6px;background:${c};border-radius:50%;flex-shrink:0;"></span>
                  <input type="text" placeholder="Cause possible…" style="flex:1;border:1px solid ${c}40;border-radius:6px;padding:4px 8px;font-size:.75rem;background:white;"/>
                </div>
              </div>
              <button onclick="ajouterCause('${m.toLowerCase().replace(' ','-')}','${c}')" style="width:100%;padding:4px;background:${c}15;border:1px dashed ${c}60;border-radius:6px;font-size:.72rem;color:${c};font-weight:600;cursor:pointer;margin-top:4px;"><i class="fas fa-plus mr-1"></i>Ajouter</button>
            </div>`).join('')}
          </div>

          <!-- ÉPINE DORSALE -->
          <div style="display:flex;align-items:center;gap:0;margin:4px 0;">
            <div style="flex:1;height:4px;background:linear-gradient(90deg,#6b7280,#374151);border-radius:2px;"></div>
            <div style="width:20px;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-left:14px solid #374151;"></div>
            <div style="background:#374151;color:white;padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:800;white-space:nowrap;"><i class="fas fa-exclamation-circle mr-2" style="color:#ef4444;"></i>PROBLÈME</div>
          </div>

          <!-- BRANCHES INFÉRIEURES (3 branches) -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:8px;">
            ${[['Milieu','#10b981','fa-building'],['Main-d\'oeuvre','#8b5cf6','fa-users'],['Management','#f43f5e','fa-chart-line']].map(([m,c,ic])=>`
            <div style="background:${c}10;border:1.5px solid ${c}40;border-radius:10px;padding:10px;" id="branch-${m.toLowerCase().replace(/[^a-z]/g,'-')}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span style="font-size:.6rem;color:#9ca3af;">↗ vers problème</span>
                <i class="fas ${ic}" style="color:${c};font-size:.85rem;"></i>
                <span style="font-size:.8rem;font-weight:800;color:${c};">${m}</span>
              </div>
              <div class="ishi-causes-${m.toLowerCase().replace(/[^a-z]/g,'-')}">
                <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
                  <span style="width:6px;height:6px;background:${c};border-radius:50%;flex-shrink:0;"></span>
                  <input type="text" placeholder="Cause possible…" style="flex:1;border:1px solid ${c}40;border-radius:6px;padding:4px 8px;font-size:.75rem;background:white;"/>
                </div>
              </div>
              <button onclick="ajouterCause('${m.toLowerCase().replace(/[^a-z]/g,'-')}','${c}')" style="width:100%;padding:4px;background:${c}15;border:1px dashed ${c}60;border-radius:6px;font-size:.72rem;color:${c};font-weight:600;cursor:pointer;margin-top:4px;"><i class="fas fa-plus mr-1"></i>Ajouter</button>
            </div>`).join('')}
          </div>
        </div>

        ${sec('D4 – 5 Pourquoi (cause racine)','fa-search')}
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:16px;font-size:.8rem;color:#1d4ed8;">
          <i class="fas fa-info-circle mr-2"></i>Partez de la cause principale identifiée dans l'Ishikawa et remontez en cascade jusqu'à la cause racine.
        </div>
        <div style="margin-bottom:16px;">
          ${[1,2,3,4,5].map(i=>`
          <div style="display:flex;gap:10px;align-items:start;margin-bottom:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:${i===1?'#ef4444':i===2?'#f97316':i===3?'#f59e0b':i===4?'#22c55e':'#3b82f6'};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.82rem;flex-shrink:0;">P${i}</div>
            <div style="flex:1;">
              <label style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px;">Pourquoi ${i}${i===1?' (symptôme observé)':i===5?' (cause racine finale)':''}</label>
              <textarea placeholder="${i===1?'Ex: Les pièces présentent des bavures en sortie d\'usinage…':i===2?'Parce que…':i===5?'Cause racine identifiée…':'Parce que…'}" rows="2" class="form-input" style="resize:none;"></textarea>
            </div>
          </div>`).join('')}
        </div>
        ${f('Cause racine validée (synthèse)','textarea','Résumé de la cause racine identifiée après analyse 5P…',true,true,'8d_d4')}
      `)}
    </div>

    <!-- D5: ACTIONS CORRECTIVES PERMANENTES -->
    <div id="d-panel-5" style="display:none;">
      ${card(`
        ${sec('D5 – Actions correctives permanentes','fa-tasks')}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#166534;">
          <i class="fas fa-info-circle mr-2"></i>Définissez les actions permanentes qui éliminent définitivement la cause racine identifiée en D4.
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
          <div style="font-size:.72rem;font-weight:800;color:#c2410c;text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-bolt" style="margin-right:6px;"></i>Action corrective immédiate (curative — appliquée AVANT les actions permanentes)</div>
          ${f('Action corrective immédiate','textarea','Mesure curative appliquée tout de suite pour contenir / corriger le problème…',false,true,'8d_d5_immediate')}
        </div>
        <div id="actions-correctives-list">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end;margin-bottom:8px;">
              ${f('Action corrective permanente #1','textarea','Description précise de l\'action à mettre en place…')}
              ${f('Responsable','select','Pierre-Yves / Agathe / Lénaïck / Joël')}
              ${f('Délai','date','')}
            </div>
            ${row2(f('Ressources nécessaires','text','Outillage, budget, personnel…'),f('Indicateur de suivi','text','KPI pour vérifier l\'avancement…'))}
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end;margin-bottom:8px;">
              ${f('Action corrective permanente #2','textarea','Description précise de l\'action à mettre en place…')}
              ${f('Responsable','select','Pierre-Yves / Agathe / Lénaïck / Joël')}
              ${f('Délai','date','')}
            </div>
            ${row2(f('Ressources nécessaires','text','Outillage, budget, personnel…'),f('Indicateur de suivi','text','KPI pour vérifier l\'avancement…'))}
          </div>
        </div>
        <button onclick="ajouterActionCorrective()" style="background:#f1f5f9;border:1.5px dashed #e2e8f0;border-radius:10px;padding:8px;font-size:.78rem;font-weight:600;color:#64748b;cursor:pointer;width:100%;margin-top:4px;margin-bottom:16px;">
          <i class="fas fa-plus mr-2"></i>Ajouter une action corrective
        </button>
        ${f('Plan d\'action global (synthèse D5)','textarea','Résumé du plan d\'action corrective global avec jalons clés…',false,true,'8d_d5')}
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button onclick="showD(4)" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-arrow-left mr-1"></i>D4 – Causes</button>
          <button onclick="showD(6)" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-arrow-right mr-2"></i>D6 – Validation</button>
        </div>
      `)}
    </div>

    <!-- D6: VALIDATION DE L'EFFICACITÉ -->
    <div id="d-panel-6" style="display:none;">
      ${card(`
        ${sec('D6 – Validation de l\'efficacité des actions','fa-check-double')}
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#1d4ed8;">
          <i class="fas fa-info-circle mr-2"></i>Vérifiez que les actions correctives ont bien éliminé la cause racine et que le problème ne s'est pas reproduit.
        </div>
        ${row3(
          f('Date de validation','date',''),
          f('Validé par','select','Responsable Qualité / Directeur Technique / Client'),
          f('Statut validation','select','En cours / Validé / Non validé')
        )}
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="font-size:.82rem;font-weight:800;color:#374151;margin-bottom:12px;"><i class="fas fa-microscope mr-2 text-blue-600"></i>Preuves d'efficacité</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:.72rem;font-weight:700;color:#16a34a;text-transform:uppercase;display:block;margin-bottom:6px;"><i class="fas fa-check-circle mr-1"></i>Preuves recueillies</label>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px;">
                ${['Mesures après correction','Audit de processus','Contrôle pièces','Tests fonctionnels'].map(p=>`
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                  <input type="checkbox" style="accent-color:#16a34a;cursor:pointer;"/>
                  <span style="font-size:.78rem;color:#374151;">${p}</span>
                  <input type="text" placeholder="Résultat…" style="flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:.72rem;"/>
                </div>`).join('')}
              </div>
            </div>
            <div>
              <label style="font-size:.72rem;font-weight:700;color:#ef4444;text-transform:uppercase;display:block;margin-bottom:6px;"><i class="fas fa-exclamation-triangle mr-1"></i>Points de vigilance</label>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px;">
                <textarea rows="5" placeholder="Risques résiduels, points à surveiller, conditions de récurrence éventuelles…" class="form-input" style="resize:none;font-size:.78rem;"></textarea>
              </div>
            </div>
          </div>
        </div>
        ${row2(
          f('Comparaison avant/après (indicateurs chiffrés)','textarea','Ex: Taux de rebut avant = 4.2% → après = 0.3%. Cpk avant = 0.8 → après = 1.4…',false,false,'8d_d6'),
          f('Commentaires du valideur','textarea','Observations, réserves éventuelles…',false)
        )}
        ${afterBox(
          ['Résultats de mesure enregistrés','Rapport de contrôle joint'],
          ['Validation client si requis','N/C formellement clôturée'],
          ['Efficacité confirmée','Surveillance maintenue 30j']
        )}
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button onclick="showD(5)" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-arrow-left mr-1"></i>D5 – Actions</button>
          <button onclick="showD(7)" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-arrow-right mr-2"></i>D7 – Préventif</button>
        </div>
      `)}
    </div>

    <!-- D7: ACTIONS PRÉVENTIVES -->
    <div id="d-panel-7" style="display:none;">
      ${card(`
        ${sec('D7 – Actions préventives (généralisation)','fa-shield-alt')}
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#7c3aed;">
          <i class="fas fa-info-circle mr-2"></i>Empêchez la réapparition du problème en étendant les actions correctives à d'autres produits, processus ou sites.
        </div>
        ${f('Processus / produits similaires concernés','textarea','Listez tous les autres processus, références, machines ou sites qui pourraient être impactés par la même cause…',false,true)}
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="font-size:.82rem;font-weight:800;color:#374151;margin-bottom:12px;"><i class="fas fa-expand-arrows-alt mr-2 text-purple-600"></i>Plan de généralisation</div>
          <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
            <thead><tr style="background:#f1f5f9;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;">Processus/Produit</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;">Action préventive à déployer</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;">Responsable</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;">Échéance</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;">Statut</th>
            </tr></thead>
            <tbody>
              ${([] as string[]).map((p,i)=>`
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 12px;"><input type="text" value="${p}" class="form-input" style="font-size:.75rem;"/></td>
                <td style="padding:8px 12px;"><input type="text" placeholder="Action…" class="form-input" style="font-size:.75rem;"/></td>
                <td style="padding:8px 12px;"><select class="form-input" style="font-size:.75rem;"><option>Pierre-Yves</option><option>Agathe</option><option>Lénaïck</option><option>Joël</option></select></td>
                <td style="padding:8px 12px;"><input type="date" class="form-input" style="font-size:.75rem;"/></td>
                <td style="padding:8px 12px;"><select class="form-input" style="font-size:.75rem;"><option>À faire</option><option>En cours</option><option>Fait</option><option>N/A</option></select></td>
              </tr>`).join('')}
            </tbody>
          </table>
          <button onclick="ajouterLignePreventif()" style="background:#f1f5f9;border:1.5px dashed #e2e8f0;border-radius:8px;padding:6px;font-size:.75rem;font-weight:600;color:#64748b;cursor:pointer;width:100%;margin-top:8px;"><i class="fas fa-plus mr-1"></i>Ajouter une ligne</button>
        </div>
        ${row2(
          f('Mise à jour documentation','textarea','Plans de contrôle, gammes, AMDEC, procédures à mettre à jour…',false),
          f('Formation / sensibilisation','textarea','Opérateurs à informer, formations à planifier…',false)
        )}
        ${f('Leçon apprise (retour d\'expérience)','textarea','Résumé de la leçon apprise, à partager avec toutes les équipes. À enregistrer dans la base REX.',false,true,'8d_d7')}
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button onclick="showD(6)" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-arrow-left mr-1"></i>D6 – Validation</button>
          <button onclick="showD(8)" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-arrow-right mr-2"></i>D8 – Clôture</button>
        </div>
      `)}
    </div>

    <!-- D8: CLÔTURE -->
    <div id="d-panel-8" style="display:none;">
      ${card(`
        ${sec('D8 – Clôture & félicitations','fa-check-circle')}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#166534;">
          <i class="fas fa-trophy mr-2"></i>Dernière étape : reconnaître le travail de l'équipe, archiver le rapport et clôturer officiellement la non-conformité.
        </div>
        <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b;border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="font-size:.9rem;font-weight:800;color:#92400e;margin-bottom:10px;"><i class="fas fa-users mr-2"></i>Reconnaissance de l'équipe 8D</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            ${['Chef de projet 8D','Membre équipe 1','Membre équipe 2','Membre équipe 3','Membre équipe 4','Support technique'].map(r=>`
            <div style="display:flex;gap:8px;align-items:center;">
              <i class="fas fa-user-circle" style="color:#b45309;font-size:1rem;"></i>
              <select class="form-input" style="font-size:.75rem;flex:1;">
                <option value="">${r}…</option>
                <option>Pierre-Yves</option><option>Agathe</option><option>Lénaïck</option><option>Joël</option><option>Mathieu</option>
              </select>
            </div>`).join('')}
          </div>
          ${f('Message de félicitations à l\'équipe','textarea','Merci à l\'ensemble de l\'équipe pour le travail accompli sur ce 8D…',false,true,'8d_d8')}
        </div>
        ${row3(
          f('Date de clôture officielle','date','',true,false,'8d_date_cloture',TODAY),
          f('Clôturé par','select','Responsable Qualité / Directeur / Client'),
          f('Statut final','select','Clôturé / Clôturé avec réserves')
        )}
        ${row2(
          f('N° NC clôturée','text','NC-2026-XXX',true,false,'8d_nc_cloture',NC_REF),
          f('Référence archivage GED','text','8D-2026-XXX / SharePoint / ...',false,false,'8d_ged',NUMERO)
        )}
        ${afterBox(
          ['Mail → Client (rapport 8D complet)','Mail → Direction (clôture NC)','Mail → Équipe (félicitations)'],
          ['8D archivé GED SharePoint','Leçon apprise enregistrée','REX planifié'],
          ['Système documentaire mis à jour','AMDEC mis à jour','Formation réalisée']
        )}
        <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:16px;">
          <div style="font-size:.82rem;font-weight:800;color:#dc2626;margin-bottom:8px;"><i class="fas fa-clipboard-check mr-2"></i>Checklist de clôture finale</div>
          ${['D1 – Groupe de travail constitué','D2 – Problème décrit (QQOQCCP)','D3 – Actions inhibition confirmées','D4 – Cause racine identifiée (Ishikawa + 5P)','D5 – Actions correctives définies','D6 – Efficacité validée','D7 – Actions préventives déployées'].map((d,i)=>`
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px;">
            <input type="checkbox" id="check-d${i+1}" style="accent-color:#dc2626;cursor:pointer;width:16px;height:16px;"/>
            <label for="check-d${i+1}" style="font-size:.8rem;color:#374151;cursor:pointer;">${d}</label>
          </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button onclick="showD(7)" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-arrow-left mr-1"></i>D7 – Préventif</button>
          <button onclick="sauvegarder8D()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-save mr-1"></i>Sauvegarder</button>
          <button onclick="cloturerRapport8D()" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-2"></i>Clôturer le 8D</button>
        </div>
      `)}
    </div>

  </div>
  <script>
  function showD(n){
    for(var i=1;i<=8;i++){var p=document.getElementById('d-panel-'+i);if(p)p.style.display=i===n?'block':'none';}
    pushNotif('info','fa-project-diagram','Section D'+n+' affichée.',2000);
  }
  function ajouterCause(branche,couleur){
    var container=document.querySelector('.ishi-causes-'+branche);
    if(!container) return;
    var div=document.createElement('div');
    div.style.cssText='display:flex;gap:6px;margin-bottom:6px;align-items:center;';
    div.innerHTML='<span style="width:6px;height:6px;background:'+couleur+';border-radius:50%;flex-shrink:0;"></span>'
      +'<input type="text" placeholder="Cause possible\u2026" style="flex:1;border:1px solid '+couleur+'40;border-radius:6px;padding:4px 8px;font-size:.75rem;background:white;"/>'
      +'<button type="button" onclick="this.parentNode.remove()" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:.7rem;">\u00d7</button>';
    container.appendChild(div);
    var newInput=div.querySelector('input');
    if(newInput) newInput.focus();
  }
  function addInhibition(){
    const tb=document.getElementById('inhibitionTable');
    if(!tb)return;
    const tr=document.createElement('tr');
    const n=tb.querySelectorAll('tr').length+1;
    tr.style.borderBottom='1px solid #fee2e2';
    tr.innerHTML='<td style="padding:8px 12px;font-weight:700;color:#374151;">'+n+'</td><td style="padding:8px 12px;"><input type="text" placeholder="Nouvelle action" class="form-input" style="font-size:.78rem;"/></td><td style="padding:8px 12px;"><select class="form-input" style="font-size:.78rem;"><option>Pierre-Yves</option><option>Agathe</option></select></td><td style="padding:8px 12px;"><input type="date" class="form-input" style="font-size:.78rem;"/></td><td style="padding:8px 12px;text-align:center;"><select class="form-input" style="font-size:.78rem;width:auto;"><option>Efficace</option><option>Partielle</option><option>Insuffisante</option></select></td><td style="padding:8px 12px;text-align:center;"><span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:#fef9c3;color:#854d0e;">En cours</span></td>';
    tb.appendChild(tr);
  }
  function ajouterActionCorrective(){
    var container=document.querySelector('[id^="d-panel-5"]');
    var tables=document.querySelectorAll('#d-panel-5 table tbody');
    if(!tables.length){ pushNotif('info','fa-plus','Action corrective ajout\u00e9e.',3000); return; }
    var tb=tables[0];
    var tr=document.createElement('tr');
    tr.style.cssText='border-bottom:1px solid #f9fafb;';
    tr.innerHTML='<td style="padding:8px 12px;"><input type="text" placeholder="Nouvelle action corrective" class="form-input" style="font-size:.78rem;"/></td>'
      +'<td style="padding:8px 12px;"><select class="form-input" style="font-size:.75rem;"><option>Pierre-Yves</option><option>Agathe</option><option>Lenaick</option><option>Joel</option></select></td>'
      +'<td style="padding:8px 12px;"><input type="date" class="form-input" style="font-size:.75rem;"/></td>'
      +'<td style="padding:8px 12px;text-align:center;"><select class="form-input" style="font-size:.75rem;width:auto;"><option>\u00c0 faire</option><option>En cours</option><option>Fait</option></select></td>';
    tb.appendChild(tr);
    pushNotif('ok','fa-plus-circle','Action corrective ajout\u00e9e.',3000);
  }
  function ajouterLignePreventif(){
    var tables=document.querySelectorAll('#d-panel-7 table tbody');
    if(!tables.length){ pushNotif('info','fa-plus','Ligne pr\u00e9ventif ajout\u00e9e.',3000); return; }
    var tb=tables[0];
    var tr=document.createElement('tr');
    tr.style.cssText='border-bottom:1px solid #f9fafb;';
    tr.innerHTML='<td style="padding:8px 12px;"><input type="text" placeholder="Nouvelle action pr\u00e9ventive" class="form-input" style="font-size:.75rem;"/></td>'
      +'<td style="padding:8px 12px;"><select class="form-input" style="font-size:.75rem;"><option>Pierre-Yves</option><option>Agathe</option><option>Lenaick</option><option>Joel</option></select></td>'
      +'<td style="padding:8px 12px;"><input type="date" class="form-input" style="font-size:.75rem;"/></td>'
      +'<td style="padding:8px 12px;text-align:center;"><select class="form-input" style="font-size:.75rem;width:auto;"><option>\u00c0 faire</option><option>En cours</option><option>Fait</option><option>N/A</option></select></td>';
    tb.appendChild(tr);
    pushNotif('ok','fa-plus-circle','Ligne pr\u00e9ventive ajout\u00e9e.',3000);
  }
  var _8dId = ${NUMERO ? JSON.stringify(NUMERO) : 'null'};
  // ── Verrou page 8D (autonome : ErpLock n'est pas chargé sur cette page) ──
  var _8dLocked=false;
  var _8dCid=(function(){ try{ var k=sessionStorage.getItem('erp_lock_cid'); if(!k){ k='c'+Math.random().toString(36).slice(2)+Date.now().toString(36); sessionStorage.setItem('erp_lock_cid',k); } return k; }catch(e){ return 'c'+Math.random().toString(36).slice(2); } })();
  if(_8dId){
    fetch('/api/locks/acquire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:'rapport8d:'+_8dId,holder_id:_8dCid})}).then(function(r){return r.json();}).then(function(j){
      if(j && j.acquired===false){ _8dLocked=true; if(window.pushNotif)pushNotif('err','fa-lock','Rapport 8D en cours d\\'édition par '+(j.holder_label||'un collègue')+' — vos modifications ne pourront pas être enregistrées.',9000); }
      else { setInterval(function(){ fetch('/api/locks/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:'rapport8d:'+_8dId,holder_id:_8dCid})}).catch(function(){}); }, 15000); }
    }).catch(function(){});
    window.addEventListener('beforeunload', function(){ try{ navigator.sendBeacon('/api/locks/release', new Blob([JSON.stringify({resource:'rapport8d:'+_8dId,holder_id:_8dCid})],{type:'application/json'})); }catch(e){} });
  }
  function _v(id){ var e=document.getElementById(id); return e ? (e.value||'').trim() : ''; }
  function _collectInhibitions(){
    var rows=document.querySelectorAll('#inhibitionTable tr');
    var out=[];
    rows.forEach(function(tr){
      var inp=tr.querySelector('input[type="text"]');
      if(inp&&inp.value.trim()) out.push('\\u2022 '+inp.value.trim());
    });
    return out.join('\\n');
  }
  function _collect8D(){
    return {
      nc_id: _v('8d_nc_ref') || null,
      responsable: _v('8d_resp') || null,
      gravite: _v('8d_gravite') || 'majeure',
      date_ouverture: _v('8d_date_ouv') || null,
      d1_equipe: (function(){ var a=[]; var r=_v('8d_resp'); if(r)a.push(r); _v('8d_d1').split(',').forEach(function(x){ x=x.trim(); if(x)a.push(x); }); return a.length?a:null; })(),
      d2_probleme: _v('8d_d2') || null,
      d3_actions_imm: _collectInhibitions() || null,
      d4_causes_racines: _v('8d_d4') || null,
      d5_actions_corr: (function(){ var im=_v('8d_d5_immediate').trim(); var a=_v('8d_d5').split(/\\r?\\n/).map(function(x){return x.trim();}).filter(Boolean); if(im) a.unshift('IMMEDIATE: '+im); return a.length?a:null; })(),
      d6_mise_en_oeuvre: _v('8d_d6') || null,
      d7_prevention: _v('8d_d7') || null,
      d8_conclusion: _v('8d_d8') || null
    };
  }
  // N° 8D auto = dérivé du n° de NC saisi
  function d8SyncNum(){ var nc=(_v('8d_nc_ref')||'').trim(); var nf=document.getElementById('8d_numero'); if(nf && nc) nf.value=nc.replace(/^NC-/i,'8D-'); }
  // Membres de l'équipe : liste déroulante + ajout libre (chips), stockés dans le hidden 8d_d1
  function d8TeamRender(){
    var h=document.getElementById('8d_d1'), box=document.getElementById('8d_team_chips'); if(!h||!box) return;
    var t=h.value.split(',').map(function(x){return x.trim();}).filter(Boolean); box.innerHTML='';
    t.forEach(function(nom,idx){
      var s=document.createElement('span'); s.style.cssText='display:inline-flex;align-items:center;gap:5px;background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 9px;font-size:.74rem;font-weight:700;';
      s.appendChild(document.createTextNode(nom));
      var x=document.createElement('button'); x.type='button'; x.textContent='\\u00d7'; x.style.cssText='border:none;background:none;color:#b91c1c;cursor:pointer;font-size:.95rem;line-height:1;padding:0;';
      x.addEventListener('click',function(){ var a=h.value.split(',').map(function(y){return y.trim();}).filter(Boolean); a.splice(idx,1); h.value=a.join(', '); d8TeamRender(); });
      s.appendChild(x); box.appendChild(s);
    });
  }
  function d8TeamAdd(){
    var sel=document.getElementById('8d_team_sel'), free=document.getElementById('8d_team_free'), h=document.getElementById('8d_d1'); if(!h) return;
    var nom=''; if(sel && sel.value){ nom=sel.options[sel.selectedIndex].text; sel.value=''; } else if(free && free.value.trim()){ nom=free.value.trim(); free.value=''; }
    if(!nom) return;
    var a=h.value.split(',').map(function(x){return x.trim();}).filter(Boolean);
    if(a.indexOf(nom)<0){ a.push(nom); h.value=a.join(', '); d8TeamRender(); }
  }
  async function _persist8D(statut){
    if(_8dLocked){ if(window.pushNotif)pushNotif('err','fa-lock','Enregistrement bloqué : ce rapport 8D est en cours d\\'édition par quelqu\\'un d\\'autre.',6000); return false; }
    var body=_collect8D();
    body.statut=statut;
    if(statut==='clos') body.date_cloture=_v('8d_date_cloture')||new Date().toISOString().slice(0,10);
    try{
      if(_8dId){
        var r=await fetch('/api/qualite/rapports-8d/'+encodeURIComponent(_8dId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!r.ok) throw new Error('patch');
        var d=await r.json(); return d.data||true;
      } else {
        var r2=await fetch('/api/qualite/rapports-8d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!r2.ok) throw new Error('post');
        var d2=await r2.json();
        if(d2.data&&d2.data.id){
          _8dId=d2.data.id;
          var nf=document.getElementById('8d_numero'); if(nf) nf.value=_8dId;
          var gf=document.getElementById('8d_ged'); if(gf&&!gf.value) gf.value=_8dId;
        }
        return d2.data||true;
      }
    }catch(e){ return false; }
  }
  async function sauvegarder8D(){
    pushNotif('info','fa-spinner','Enregistrement…',1500);
    var res=await _persist8D('en_cours');
    if(res===false){ pushNotif('err','fa-times','Échec de l\\'enregistrement du rapport 8D.',5000); return; }
    pushNotif('ok','fa-save','Rapport 8D '+(_8dId?('<strong>'+_8dId+'</strong> '):'')+'sauvegardé (En cours).',4000);
  }
  // Sauvegarde l'avancement (statut « En cours », jamais clôturé) puis quitte vers la Qualité.
  async function sauvegarderEtQuitter8D(){
    pushNotif('info','fa-spinner','Enregistrement…',1500);
    var res=await _persist8D('en_cours');
    if(res===false){ pushNotif('err','fa-times','Échec de l\\'enregistrement. Le rapport n\\'a pas été quitté.',5000); return; }
    pushNotif('ok','fa-save','Rapport 8D '+(_8dId?('<strong>'+_8dId+'</strong> '):'')+'sauvegardé (En cours). Retour à la Qualité…',2500);
    setTimeout(function(){ window.location.href='/qualite/service'; }, 900);
  }
  async function cloturerRapport8D(){
    var ncRef=_v('8d_nc_ref')||_v('8d_nc_cloture');
    if(!ncRef){ pushNotif('err','fa-exclamation-circle','Veuillez renseigner le N° NC associée.',4000); return; }
    pushNotif('info','fa-spinner','Clôture en cours…',2000);
    var res=await _persist8D('clos');
    if(res===false){ pushNotif('err','fa-times','Échec de la clôture du rapport 8D.',5000); return; }
    try{
      var rc=await fetch('/api/qualite/non-conformites/'+encodeURIComponent(ncRef),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'Clôturée'})});
      if(!rc.ok) throw new Error('nc');
      pushNotif('ok','fa-check','Rapport 8D '+(_8dId?('<strong>'+_8dId+'</strong> '):'')+'clôturé. NC <strong>'+ncRef+'</strong> marquée Clôturée.',6000);
    }catch(e){
      pushNotif('warn','fa-exclamation-triangle','8D clôturé, mais la NC '+ncRef+' n\\'a pas pu être mise à jour.',6000);
    }
  }
  // ─── Hydratation d'un rapport 8D existant (ouverture via ?id=) ───
  var _8dRAP = ${RAP ? JSON.stringify(RAP).replace(/</g, '\\u003c') : 'null'};
  function _setVal(id,v){ var e=document.getElementById(id); if(e!=null && v!=null && v!=='') e.value=v; }
  function _hydrate8D(){
    if(!_8dRAP) return;
    var r=_8dRAP;
    _setVal('8d_numero', r.id);
    _setVal('8d_nc_ref', r.nc_id);
    _setVal('8d_date_ouv', r.date_ouverture);
    if(r.responsable){ var rs=document.getElementById('8d_resp'); if(rs){ rs.value=r.responsable; if(rs.value!==r.responsable){ var o=document.createElement('option'); o.value=r.responsable; o.textContent=r.responsable; rs.appendChild(o); rs.value=r.responsable; } } }
    if(r.gravite){ var g=document.getElementById('8d_gravite'); if(g) g.value=r.gravite; }
    if(Array.isArray(r.d1_equipe)){ var membres=r.d1_equipe.filter(function(x){ return x && x!==r.responsable; }); _setVal('8d_d1', membres.join(', ')); if(typeof d8TeamRender==='function') d8TeamRender(); }
    if(r.d2_probleme){ var d2=document.getElementById('8d_d2'); if(d2) d2.value=r.d2_probleme; }
    if(r.d3_actions_imm){
      var acts=String(r.d3_actions_imm).split(/\\r?\\n/).map(function(s){ return s.replace(/^\\s*[\\u2022\\-]\\s*/,'').trim(); }).filter(Boolean);
      if(acts.length){
        var tb=document.getElementById('inhibitionTable');
        if(tb){
          var guard=0;
          while(tb.querySelectorAll('tr').length<acts.length && guard++<60){ addInhibition(); }
          var rows=tb.querySelectorAll('tr');
          for(var k=rows.length-1;k>=acts.length;k--){ rows[k].remove(); }
          rows=tb.querySelectorAll('tr');
          for(var j=0;j<acts.length;j++){ var inp=rows[j].querySelector('input[type="text"]'); if(inp) inp.value=acts[j]; }
        }
      }
    }
    _setVal('8d_d4', r.d4_causes_racines);
    if(Array.isArray(r.d5_actions_corr)){ var d5a=r.d5_actions_corr.slice(); var imL=null; for(var ii=0;ii<d5a.length;ii++){ if(String(d5a[ii]).indexOf('IMMEDIATE: ')===0){ imL=d5a[ii]; break; } } if(imL){ _setVal('8d_d5_immediate', String(imL).replace('IMMEDIATE: ','')); d5a=d5a.filter(function(x){return x!==imL;}); } _setVal('8d_d5', d5a.join('\\n')); }
    _setVal('8d_d6', r.d6_mise_en_oeuvre);
    _setVal('8d_d7', r.d7_prevention);
    _setVal('8d_d8', r.d8_conclusion);
    _setVal('8d_date_cloture', r.date_cloture);
    _setVal('8d_nc_cloture', r.nc_id);
    _setVal('8d_ged', r.id);
    var filled=[
      Array.isArray(r.d1_equipe)?r.d1_equipe.length>0:!!r.d1_equipe,
      !!r.d2_probleme, !!r.d3_actions_imm, !!r.d4_causes_racines,
      Array.isArray(r.d5_actions_corr)?r.d5_actions_corr.length>0:!!r.d5_actions_corr,
      !!r.d6_mise_en_oeuvre, !!r.d7_prevention, !!r.d8_conclusion
    ];
    for(var s=1;s<=8;s++){
      var circ=document.querySelector('.d-step-circle[data-step="'+s+'"]');
      var lbl=document.querySelector('.d-step-label[data-step="'+s+'"]');
      if(circ){
        if(filled[s-1]){ circ.style.background='#22c55e'; circ.style.color='white'; if(lbl) lbl.style.color='#374151'; }
        else { circ.style.background='#e2e8f0'; circ.style.color='#9ca3af'; if(lbl) lbl.style.color='#9ca3af'; }
      }
    }
    var hdr=document.querySelector('h1');
    if(hdr){
      var statutLbl={ouvert:'Ouvert',en_cours:'En cours',en_attente_validation:'À valider',clos:'Clôturé'}[r.statut]||r.statut||'';
      var b=document.createElement('span');
      b.style.cssText='margin-left:10px;padding:2px 10px;border-radius:999px;font-size:.62rem;font-weight:800;background:#dcfce7;color:#15803d;vertical-align:middle;';
      b.innerHTML='<i class="fas fa-folder-open" style="margin-right:4px;"></i>'+r.id+(statutLbl?(' · '+statutLbl):'');
      hdr.appendChild(b);
    }
    pushNotif('ok','fa-folder-open','Rapport 8D <strong>'+r.id+'</strong> chargé.',4000);
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',_hydrate8D); } else { _hydrate8D(); }
  </script>`
  return layout8d('Rapport 8D', content)
}
