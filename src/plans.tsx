// ══════════════════════════════════════════════════════════════
// SERVICE « PLAN / BÂTIMENT » — Maquette « BIM » interactive
// Zones = RECTANGLES (locaux) · Objets = points (icônes) rangés dedans.
// Fond image via GED · liaison BDD (machine/zone/chimie/périssable/ATEX/VGP)
// · classement des objets PAR ZONE · drag/resize · zoom/pan. Écriture BE/Prod/Maint/Qualité.
// ══════════════════════════════════════════════════════════════
import { layout, serviceHeader } from './shared'
import { ZONES_ATELIER, computeRisqueChimique, SEIRICH_NIVEAUX } from './qref'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')
const BLUE = '#3b82f6'

export const pageServicePlans = (data: any) => {
  const D = data || {}
  const arr = (k: string) => (Array.isArray(D[k]) ? D[k] : [])
  const PLANS = arr('plans').map((p: any) => ({ id: p.id, nom: p.nom, entite: p.entite, image_doc_id: p.image_doc_id }))
  const POSTES = arr('postes').map((p: any) => ({ id: p.id, nom: p.nom, couleur: p.couleur || '', act: p.activite || '', nbMachines: p.nbMachines || 0, machines: Array.isArray(p.machines) ? p.machines : [], nbProcess: p.nbProcess || 0, process: Array.isArray(p.process) ? p.process : [], taux: p.taux || 0, opexTheo: p.opexTheo || 0 }))
  // SEIRICH : niveau de risque précalculé serveur (le pire des 3 axes du produit, rehaussé par ses situations d'exposition Santé).
  const _expoMaxSante: Record<string, number> = {}
  arr('expositions').forEach((e: any) => { const k = String(e.produit_id || ''); const n = Number(e.niveau_sante) || 0; if (n > (_expoMaxSante[k] || 0)) _expoMaxSante[k] = n })
  // Niveau ATEX dérivé du zonage (présence d'atmosphère explosive) : 0/20 permanent→3, 1/21 occasionnel→2, 2/22 rare→1.
  // Défaut Moyen (2) même sans type_zone : une zone ATEX a par définition une atmosphère explosible (jamais « sans risque »).
  const _atexNiveau = (tz: any) => { const t = String(tz ?? '').trim(); if (t === '0' || t === '20') return 3; if (t === '1' || t === '21') return 2; if (t === '2' || t === '22') return 1; return 2 }
  const ATEX = arr('atex').map((a: any) => ({ id: a.id, nom: a.nom || a.localisation || 'Zone ATEX', loc: a.localisation || '', rev: a.date_revue || '', niveau: _atexNiveau(a.type_zone), tz: a.type_zone || '' }))
  const CHIMIE = arr('chimie').map((x: any) => { const d = computeRisqueChimique(x); return { id: x.id, nom: x.nom, zone: x.zone_stockage || '', statut: x.statut || '', niveau: Math.max(d.niveauMax, _expoMaxSante[String(x.id)] || 0), dq: d.dataQuality } })
  const VGP = arr('vgp').map((v: any) => ({ id: v.id, nom: v.equipement || v.type || 'Vérification', statut: v.statut || '', ech: v.date_prochaine || '' }))
  const PERISSABLES = arr('perissables').map((p: any) => ({ id: p.id, nom: p.nom || p.reference || 'Produit', ref: p.reference || p.code_produit || '', empl: p.emplacement || p.lieu_utilisation || '', exp: p.date_expiration || '', statut: p.statut || '' }))
  const ZONES = ZONES_ATELIER
  // Machines : catalogue à part entière (une machine se pose individuellement, en plus de la
  // zone de son poste). 8 repères `machine` existaient déjà en base alors que la catégorie
  // avait disparu de CATS — ils s'affichaient donc en « Autre / Point ».
  const MACHINES = arr('machines').map((m: any) => ({
    id: m.id, nom: m.nom || m.designation || m.code || String(m.id),
    ref: m.code || m.reference || '', poste: m.poste_id || '', act: m.activite || '', statut: m.statut || '',
  }))
  // ECME : équipements de contrôle, mesure et essai — 265 en base, avec leur localisation.
  const ECME = arr('ecme').map((e: any) => ({
    id: e.id, nom: e.designation || e.code || String(e.id), ref: e.code || '',
    type: e.type || '', loc: e.localisation || '', statut: e.statut || '',
  }))
  // Déchets : points de collecte réglementaires (bennes, bacs DD).
  const DECHETS = arr('dechets').map((d: any) => ({
    id: d.id, nom: d.designation || d.code_dechet || String(d.id), ref: d.code_dechet || '',
    dangereux: d.dangereux === true, filiere: d.filiere || '',
  }))

  const content = `
    ${serviceHeader({
      icon: 'fa-building', color: BLUE, darkBg: '#1e3a5f',
      title: 'Plan / Bâtiment',
      subtitle: 'Maquette interactive — zones (rectangles) + objets rangés par zone',
      tabs: [{ id: 'plan', label: 'Maquette', icon: 'fa-map-location-dot' }],
      switchFn: 'planSwitchTab', tabIdPrefix: 'plan-tab', activeId: 'plan',
    })}
    <div id="plan-tab-plan" style="padding:16px 22px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="plan-sel" onchange="planSelect(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:.82rem;font-weight:700;color:#1e293b;background:#f8fafc;cursor:pointer;min-width:230px;"><option value="">— Choisir un plan —</option></select>
        <button onclick="planCreate()" style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:8px;padding:8px 12px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouveau plan</button>
        <span style="flex:1;"></span>
        <button id="plan-btn-edit" onclick="planToggleEdit()" style="display:none;background:${BLUE};color:white;border:none;border-radius:8px;padding:8px 14px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-pen" style="margin-right:5px;"></i>Modifier</button>
        <button id="plan-btn-cancel" onclick="planCancel()" style="display:none;background:#f1f5f9;color:#475569;border:none;border-radius:8px;padding:8px 12px;font-size:.78rem;font-weight:700;cursor:pointer;">Annuler</button>
        <button id="plan-btn-save" onclick="planSave()" style="display:none;background:#16a34a;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
      </div>

      <div id="plan-editbar" style="display:none;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:12px;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:.72rem;font-weight:800;color:#475569;text-transform:uppercase;">Fond</span>
        <input type="file" id="plan-img-input" accept=".png,.jpg,.jpeg,.webp,.gif,.svg" style="font-size:.72rem;"/>
        <button onclick="planUploadImage()" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:6px 11px;font-size:.72rem;font-weight:700;cursor:pointer;">Remplacer l'image</button>
        <span style="width:1px;height:20px;background:#e2e8f0;"></span>
        <button onclick="planAutoPlace()" title="Pré-placer postes / périssables / chimie dans la zone dont le nom correspond à leur localisation en base" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:6px;padding:6px 11px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-wand-magic-sparkles" style="margin-right:5px;"></i>Auto-placer</button>
        <span id="plan-add-hint" style="font-size:.7rem;color:#2563eb;font-weight:700;margin-left:8px;"></span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;">
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <button onclick="planZoom(-0.25)" style="width:30px;height:30px;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-weight:800;">−</button>
            <button onclick="planZoom(0.25)" style="width:30px;height:30px;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-weight:800;">+</button>
            <button onclick="planZoomReset()" style="height:30px;padding:0 10px;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;font-size:.72rem;font-weight:700;">Ajuster</button>
            <span id="plan-zoom-lbl" style="font-size:.72rem;color:#94a3b8;">100%</span>
            <button id="plan-risk-btn" onclick="planToggleRisk()" title="Colorer les produits chimiques et zones ATEX par niveau de risque SEIRICH" style="height:30px;padding:0 12px;border:1px solid #e2e8f0;border-radius:6px;background:white;color:#475569;cursor:pointer;font-size:.72rem;font-weight:700;"><i class="fas fa-radiation" style="margin-right:5px;color:#dc2626;"></i>Vue risque chimique</button>
            <span style="flex:1;"></span>
            <span style="font-size:.66rem;color:#94a3b8;">Zone = glisser pour dessiner · Objet = cliquer · fond = glisser pour déplacer</span>
          </div>
          <div id="plan-viewport" style="position:relative;width:100%;height:660px;overflow:auto;background:#eef2f7;border:1.5px solid #e2e8f0;border-radius:12px;">
            <div id="plan-stage" style="position:relative;width:100%;">
              <img id="plan-img" src="" alt="Plan" style="display:none;width:100%;height:auto;user-select:none;-webkit-user-drag:none;"/>
              <div id="plan-empty" style="padding:70px 20px;text-align:center;color:#94a3b8;font-size:.85rem;"><i class="fas fa-map-location-dot" style="font-size:2rem;display:block;margin-bottom:10px;color:#cbd5e1;"></i>Choisissez un plan pour l'afficher.</div>
              <div id="plan-markers" style="position:absolute;inset:0;pointer-events:none;"></div>
              <div id="plan-preview" style="position:absolute;display:none;border:2px dashed ${BLUE};background:rgba(59,130,246,.12);z-index:6;pointer-events:none;border-radius:6px;box-sizing:border-box;"></div>
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="background:white;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <div style="font-size:.72rem;font-weight:800;color:#475569;text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-layer-group" style="margin-right:5px;color:${BLUE};"></i>Catégories</div>
            <div id="plan-cats"></div>
          </div>
          <div id="plan-editor" style="display:none;background:white;border:1.5px solid #c7d2fe;border-radius:12px;padding:12px 14px;">
            <div style="font-size:.72rem;font-weight:800;color:#4338ca;text-transform:uppercase;margin-bottom:8px;">Élément</div>
            <div id="plan-editor-body"></div>
          </div>
          <div style="background:white;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <div style="font-size:.72rem;font-weight:800;color:#475569;text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-sitemap" style="margin-right:5px;color:${BLUE};"></i>Par zone <span id="plan-count" style="color:#94a3b8;font-weight:600;"></span></div>
            <div id="plan-list" style="max-height:320px;overflow:auto;"></div>
          </div>
        </div>
      </div>
    </div>

    <div id="plan-tip" style="position:fixed;display:none;z-index:9999;max-width:290px;background:#0f172a;color:#e2e8f0;border-radius:9px;padding:9px 12px;font-size:.72rem;line-height:1.5;box-shadow:0 10px 28px rgba(0,0,0,.4);pointer-events:none;"></div>
    <script>
    var PLANS=${sjX(PLANS)}, POSTES=${sjX(POSTES)}, ATEX=${sjX(ATEX)}, CHIMIE=${sjX(CHIMIE)}, VGP=${sjX(VGP)}, PERISSABLES=${sjX(PERISSABLES)}, ZONES=${sjX(ZONES)}, SEIRICH=${sjX(SEIRICH_NIVEAUX)};
    var MACHINES=${sjX(MACHINES)}, ECME=${sjX(ECME)}, DECHETS=${sjX(DECHETS)};
    // shape 'rect' = zone (local) · 'point' = objet posé dans une zone
    // ══════════════════════════════════════════════════════════════
    // CATALOGUES PLAÇABLES — le plan ne CRÉE rien : il POSE ce qui existe déjà en base.
    // Chaque catégorie porte donc obligatoirement un « link » vers un référentiel de l'ERP.
    // Un repère sans « ref_id » ne peut plus être produit (voir placeFromCatalogue).
    // « shape » : rect = zone (on la dessine) · point = objet (on le pose d'un clic).
    // ══════════════════════════════════════════════════════════════
    var CATS={
      poste:{label:"Poste de travail",icon:"fa-diagram-project",col:"#4338ca",shape:"rect",link:"poste",aide:"Zone du poste : elle contient ses process et ses machines."},
      atelier:{label:"Zone atelier (EPI)",icon:"fa-industry",col:"#0ea5e9",shape:"rect",link:"zone",aide:"Zonage Z1–Z7 / A qui porte la matrice des EPI obligatoires."},
      atex:{label:"Zone ATEX",icon:"fa-explosion",col:"#f59e0b",shape:"rect",link:"atex",aide:"Zonage atmosphères explosives (obligation réglementaire)."},
      machine:{label:"Machine",icon:"fa-gears",col:"#0891b2",shape:"point",link:"machine",aide:"Machine du parc, posée individuellement."},
      chimie:{label:"Produit chimique / FDS",icon:"fa-flask-vial",col:"#c026d3",shape:"point",link:"chimie",aide:"Inventaire chimique — colorable par risque SEIRICH."},
      perissable:{label:"Produit périssable",icon:"fa-hourglass-half",col:"#e11d48",shape:"point",link:"perissable",aide:"Produits à péremption — alerte à l'approche de la date."},
      ecme:{label:"Équipement de mesure (ECME)",icon:"fa-ruler-combined",col:"#7c3aed",shape:"point",link:"ecme",aide:"Instruments de contrôle et leur vérification périodique."},
      securite:{label:"Équipement de sécurité (VGP)",icon:"fa-fire-extinguisher",col:"#dc2626",shape:"point",link:"vgp",aide:"Extincteurs, ponts, harnais… suivis en vérification périodique."},
      dechet:{label:"Point de collecte déchets",icon:"fa-recycle",col:"#16a34a",shape:"point",link:"dechet",aide:"Bennes et bacs de tri, dont déchets dangereux."}
    };
    var CATKEYS=Object.keys(CATS);
    // Anciennes catégories LIBRES (salles dessinées à la main, sans fiche en base). On ne
    // peut plus en créer, mais on continue de les AFFICHER : elles représentent du travail
    // déjà fait. Elles sont regroupées à part, avec la seule action « supprimer ».
    var LEGACY={
      bureau:{label:"Bureau / Local",icon:"fa-briefcase",col:"#8b5cf6",shape:"rect"},
      logistique:{label:"Logistique / Stock",icon:"fa-warehouse",col:"#f59e0b",shape:"rect"},
      utilite:{label:"Utilité / Technique",icon:"fa-plug-circle-bolt",col:"#0d9488",shape:"rect"},
      social:{label:"Social / Sanitaire",icon:"fa-mug-hot",col:"#16a34a",shape:"rect"},
      point:{label:"Autre / Point",icon:"fa-location-dot",col:"#64748b",shape:"point"}
    };
    // Un repère est « hors catalogue » s'il n'est rattaché à aucune fiche de l'ERP.
    function isLegacy(m){ return !m || !m.ref_id; }
    var CURRENT=null, MARQUEURS=[], SUPPRIMES=[], EDIT=false, ADDCAT=null, ZOOM=1, SEL=null, TMPN=0, HIDDEN={}, RISKVIEW=false;
    var dragId=null, dragKind=null, dOffX=0, dOffY=0, drawing=false, drawSX=0, drawSY=0, panning=false, panL=0, panT=0, panSX=0, panSY=0, clickPend=false, downCX=0, downCY=0;
    function noti(t,i,m){ if(typeof pushNotif==="function") pushNotif(t,i,m,3500); else alert(String(m)); }
    function planSwitchTab(){ var p=document.getElementById("plan-tab-plan"); if(p) p.style.display="block"; }
    function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
    function CAT(k){ return CATS[k]||LEGACY[k]||LEGACY.point; }
    function shapeOf(m){ return CAT(m.type).shape||"point"; }
    function rw(m){ return (m.w>0?m.w:14); }
    function rh(m){ return (m.h>0?m.h:10); }
    // ── État « live » d'un repère selon la fiche liée (dates/statuts en base) ──
    function _days(d){ if(!d) return null; var s=String(d), md=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(s); var x=md?new Date(+md[1],+md[2]-1,+md[3]):new Date(s); if(isNaN(x.getTime())) return null; var t=new Date(); t.setHours(0,0,0,0); x.setHours(0,0,0,0); return Math.round((x.getTime()-t.getTime())/86400000); }
    function statusOf(m){ var t=m.type, id=m.ref_id; if(!id) return {lvl:"none",reason:""};
      if(t==="securite"){ var vv=VGP.find(function(x){return String(x.id)===String(id);}); if(vv){ var de=_days(vv.ech); if(vv.statut==="en_retard"||(de!=null&&de<0)) return {lvl:"alert",reason:"VGP en retard"+(de!=null?(" ("+(-de)+"j)"):"")}; if(vv.statut==="a_prevoir"||(de!=null&&de<=30)) return {lvl:"warn",reason:"VGP à prévoir"+(de!=null?(" ("+de+"j)"):"")}; return {lvl:"ok",reason:"VGP à jour"}; } }
      if(t==="perissable"){ var pp=PERISSABLES.find(function(x){return String(x.id)===String(id);}); if(pp){ var dp=_days(pp.exp); if(dp!=null&&dp<0) return {lvl:"alert",reason:"Périmé"+(pp.exp?(" depuis le "+pp.exp):"")}; if(dp!=null&&dp<=30) return {lvl:"warn",reason:"Périme dans "+dp+"j"}; return {lvl:"ok",reason:"Valide"}; } }
      if(t==="atex"){ var aa=ATEX.find(function(x){return String(x.id)===String(id);}); if(aa){ var dr=_days(aa.rev); if(dr!=null&&dr<0) return {lvl:"alert",reason:"Revue ATEX en retard"}; if(dr!=null&&dr<=60) return {lvl:"warn",reason:"Revue ATEX proche ("+dr+"j)"}; return {lvl:"ok",reason:"À jour"}; } }
      return {lvl:"none",reason:""};
    }
    function stCol(l){ return l==="alert"?"#dc2626":l==="warn"?"#f59e0b":l==="ok"?"#16a34a":null; }
    // ── SEIRICH : niveau/couleur de risque d'un repère (chimie/atex, précalculé serveur) ──
    function niveauOf(m){ if(!m||!m.ref_id) return null; if(m.type==="chimie"){ var c=CHIMIE.find(function(x){return String(x.id)===String(m.ref_id);}); return c&&c.niveau!=null?c.niveau:null; } if(m.type==="atex"){ var a=ATEX.find(function(x){return String(x.id)===String(m.ref_id);}); return a&&a.niveau!=null?a.niveau:null; } return null; }
    function riskColor(m){ var n=niveauOf(m); return n==null?null:(SEIRICH[n]||SEIRICH[0]); }
    function chimDq(m){ if(m.type!=="chimie"||!m.ref_id) return "ok"; var c=CHIMIE.find(function(x){return String(x.id)===String(m.ref_id);}); return c?(c.dq||"ok"):"ok"; }
    function planToggleRisk(){ RISKVIEW=!RISKVIEW; var b=document.getElementById("plan-risk-btn"); if(b){ b.style.background=RISKVIEW?"#fee2e2":"white"; b.style.color=RISKVIEW?"#b91c1c":"#475569"; b.style.borderColor=RISKVIEW?"#fca5a5":"#e2e8f0"; } renderAll(); }
    function renderRiskLegend(){ var cnt=[0,0,0,0]; MARQUEURS.forEach(function(m){ if(m.type==="chimie"||m.type==="atex"){ var n=niveauOf(m); cnt[n==null?0:n]++; } });
      var rows=[3,2,1,0].map(function(n){ var s=SEIRICH[n]||SEIRICH[0]; return "<div style='display:flex;align-items:center;gap:8px;padding:3px 2px;font-size:.74rem;'><span style='width:14px;height:14px;border-radius:4px;background:"+s[0]+";border:1.5px solid "+s[1]+";display:inline-block;'></span><span style='flex:1;color:#334155;font-weight:600;'>"+s[2]+"</span><span style='font-weight:700;color:#94a3b8;'>"+cnt[n]+"</span></div>"; }).join("");
      return "<div style='font-size:.72rem;color:#b91c1c;font-weight:800;margin-bottom:6px;'><i class='fas fa-radiation' style='margin-right:5px;'></i>Vue risque chimique (SEIRICH)</div>"+rows+"<div style='margin-top:8px;font-size:.64rem;color:#94a3b8;line-height:1.45;'>Produits chimiques &amp; zones ATEX colorés par niveau de risque. Cliquez un repère pour ouvrir sa fiche. Cotation INDICATIVE — à valider par mesurage / expertise.</div>";
    }

    function fillPlanSel(){ var s=document.getElementById("plan-sel"); if(!s) return; s.innerHTML="<option value=\\"\\">— Choisir un plan —</option>"+PLANS.map(function(p){return "<option value=\\""+esc(p.id)+"\\">"+esc(p.nom)+"</option>";}).join(""); }
    function planCreate(){ var nom=prompt("Nom du plan :"); if(!nom) return;
      fetch("/api/plans",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom:nom})}).then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok){ PLANS.push({id:j.plan.id,nom:j.plan.nom,image_doc_id:null}); fillPlanSel(); document.getElementById("plan-sel").value=j.plan.id; planSelect(j.plan.id); noti("ok","fa-check","Plan créé."); } else noti("err","fa-times",(j&&j.error)||"Échec.");
      }).catch(function(){ noti("err","fa-times","Erreur réseau."); }); }
    function currentPlan(){ return PLANS.find(function(p){return String(p.id)===String(CURRENT);}); }
    function planSelect(id){
      CURRENT=id||null; SEL=null; ADDCAT=null; EDIT=false; HIDDEN={};
      document.getElementById("plan-editor").style.display="none";
      document.getElementById("plan-btn-edit").style.display=CURRENT?"":"none"; syncEditUI();
      var img=document.getElementById("plan-img"), empty=document.getElementById("plan-empty"); var p=currentPlan();
      if(p&&p.image_doc_id){ img.src="/api/ged/file/"+p.image_doc_id; img.style.display="block"; empty.style.display="none"; }
      else { img.style.display="none"; img.src=""; empty.style.display="block"; empty.textContent=CURRENT?"Aucune image. « Modifier » puis chargez le plan.":"Choisissez un plan."; }
      MARQUEURS=[]; SUPPRIMES=[]; renderAll();
      if(CURRENT) fetch("/api/plans/"+encodeURIComponent(CURRENT)+"/marqueurs").then(function(r){return r.json();}).then(function(j){ MARQUEURS=(j&&j.marqueurs)||[]; renderAll(); }).catch(function(){});
    }
    function planUploadImage(){
      if(!CURRENT){ noti("err","fa-exclamation-triangle","Choisissez un plan."); return; }
      var inp=document.getElementById("plan-img-input"); if(!inp||!inp.files||!inp.files.length){ noti("info","fa-info-circle","Choisissez une image."); return; }
      var fd=new FormData(); fd.append("file",inp.files[0]); fd.append("nomenclature_id",CURRENT); fd.append("categorie","plan_batiment"); noti("info","fa-upload","Envoi…");
      fetch("/api/ged/upload",{method:"POST",body:fd}).then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ noti("err","fa-times",(j&&j.error)||"Échec."); return; } var docId=j.document.id;
        return fetch("/api/plans/"+encodeURIComponent(CURRENT),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_doc_id:docId})}).then(function(){
          var p=currentPlan(); if(p) p.image_doc_id=docId; var img=document.getElementById("plan-img"); img.src="/api/ged/file/"+docId; img.style.display="block"; document.getElementById("plan-empty").style.display="none"; inp.value=""; noti("ok","fa-check","Image mise à jour.");
        });
      }).catch(function(){ noti("err","fa-times","Erreur réseau."); });
    }

    function syncEditUI(){
      document.getElementById("plan-btn-save").style.display=EDIT?"":"none";
      document.getElementById("plan-btn-cancel").style.display=EDIT?"":"none";
      document.getElementById("plan-editbar").style.display=EDIT?"flex":"none";
      var be=document.getElementById("plan-btn-edit"); be.innerHTML=EDIT?"<i class=\\"fas fa-eye\\" style=\\"margin-right:5px;\\"></i>Aperçu":"<i class=\\"fas fa-pen\\" style=\\"margin-right:5px;\\"></i>Modifier";
      document.getElementById("plan-img").style.cursor=EDIT?"grab":"default";
      var rb=document.getElementById("plan-risk-btn"); if(rb) rb.style.display=EDIT?"none":""; // vue risque = consultation (indisponible en édition)
    }
    function planToggleEdit(){ EDIT=!EDIT; ADDCAT=null; if(EDIT&&RISKVIEW){ RISKVIEW=false; var rb=document.getElementById("plan-risk-btn"); if(rb){ rb.style.background="white"; rb.style.color="#475569"; rb.style.borderColor="#e2e8f0"; } } document.getElementById("plan-add-hint").textContent=""; syncEditUI(); renderAll(); }
    function planCancel(){ EDIT=false; ADDCAT=null; document.getElementById("plan-editor").style.display="none"; syncEditUI(); planSelect(CURRENT); }

    // ── Catalogues liés ──
    function entitiesFor(k){ var link=(CATS[k]||{}).link;
      if(link==="poste") return POSTES.map(function(p){return {id:p.id,raw:p.nom,nom:p.nom,sub:p.nbProcess+" process · "+p.nbMachines+" machine(s)"+(p.taux?(" · "+p.taux+" €/h"):""),table:"postes"};});
      if(link==="zone") return ZONES.map(function(z){return {id:z[0],raw:z[1]||z[0],nom:z[0]+" — "+z[1],sub:"matrice EPI de la zone",table:"zone_atelier"};});
      if(link==="chimie") return CHIMIE.map(function(x){return {id:x.id,raw:x.nom,nom:x.nom,sub:(x.zone?("stock : "+x.zone):"sans zone de stockage"),table:"hse_produits_chimiques"};});
      if(link==="perissable") return PERISSABLES.map(function(p){return {id:p.id,raw:p.nom,nom:p.nom+(p.ref?(" ["+p.ref+"]"):""),sub:(p.empl?p.empl+" · ":"")+(p.exp?("exp. "+p.exp):"sans date"),table:"produits_perissables"};});
      if(link==="atex") return ATEX.map(function(a){return {id:a.id,raw:a.nom,nom:a.nom,sub:(a.tz?("zone "+a.tz):"")+(a.rev?(" · revue "+a.rev):""),table:"hse_atex_zones"};});
      if(link==="vgp") return VGP.map(function(v){return {id:v.id,raw:v.nom,nom:v.nom,sub:(v.ech?("échéance "+v.ech):"sans échéance"),table:"hse_verifications"};});
      if(link==="machine") return MACHINES.map(function(m){return {id:m.id,raw:m.nom,nom:m.nom,sub:(m.ref?m.ref+" · ":"")+(m.act||"—"),table:"machines"};});
      if(link==="ecme") return ECME.map(function(e){return {id:e.id,raw:e.nom,nom:e.nom+(e.ref?(" ["+e.ref+"]"):""),sub:(e.type?e.type+" · ":"")+(e.loc||"sans localisation"),table:"ecme"};});
      if(link==="dechet") return DECHETS.map(function(d){return {id:d.id,raw:d.nom,nom:d.nom,sub:(d.dangereux?"DANGEREUX · ":"")+(d.filiere||d.ref||""),table:"hse_dechets"};});
      return [];
    }
    function catTotal(k){ return CATS[k] ? entitiesFor(k).length : null; }
    function entName(m){ var e=entitiesFor(m.type).find(function(x){return String(x.id)===String(m.ref_id);}); return e?e.nom:(m.ref_id||""); }
    // Deep-link ciblé : ouvre la fiche/onglet exact (le module lit le hash au chargement)
    function deepLink(m){ var l=(CATS[m.type]||{}).link; var id=m.ref_id?encodeURIComponent(m.ref_id):"";
      if(l==="poste") return {url:"/production/service#machines",lbl:"Ouvrir « Postes & Process »"};
      if(l==="vgp") return {url:"/securite/service#sectab=controles"+(id?("&hi="+id):""),lbl:"Ouvrir la vérification (VGP)"};
      if(l==="atex") return {url:"/securite/service#sectab=environnement"+(id?("&hi="+id):""),lbl:"Ouvrir la zone ATEX"};
      if(l==="chimie") return (m.ref_table==="hse_produits_chimiques"&&m.ref_id) ? {url:"/securite/chimique/"+encodeURIComponent(m.ref_id),lbl:"Ouvrir la fiche produit chimique 360"} : {url:"/securite/service#sectab=chimie"+(id?("&hi="+id):""),lbl:"Ouvrir la FDS / fiche chimique"};
      if(l==="zone") return {url:"/securite/service#sectab=epi"+(id?("&hiz="+id):""),lbl:"Ouvrir la matrice EPI de la zone"};
      if(l==="perissable") return {url:"/qualite/service#qualtab=perissables",lbl:"Ouvrir les produits périssables"};
      if(l==="machine") return {url:"/production/service#machines",lbl:"Ouvrir « Postes & Process »"};
      if(l==="ecme") return {url:"/qualite/service#qualtab=ecme"+(id?("&hi="+id):""),lbl:"Ouvrir la fiche ECME"};
      if(l==="dechet") return {url:"/environnement/service#sectab=dechets",lbl:"Ouvrir le registre des déchets"};
      return null;
    }

    // ══════════════════════════════════════════════════════════════
    // CATALOGUE — la légende devient la LISTE de ce qui existe en base. Chaque ligne dit
    // si l'élément est déjà posé sur le plan ; cliquer une ligne non posée arme le
    // placement. On ne saisit jamais de libellé : il vient de la fiche.
    // ══════════════════════════════════════════════════════════════
    var OPEN={}, FILTRE="";
    function placedIds(k){ var s={}; MARQUEURS.forEach(function(m){ if(m.type===k&&m.ref_id) s[String(m.ref_id)]=m.id; }); return s; }
    function catToggleOpen(k){ OPEN[k]=!OPEN[k]; renderCats(); }
    function catFiltre(v){ FILTRE=String(v||"").toLowerCase().trim(); renderCats(); }

    function renderCats(){
      var el=document.getElementById("plan-cats"); if(!el) return;
      if(RISKVIEW){ el.innerHTML=renderRiskLegend(); return; }
      // ⚠ On ne compte comme POSÉ que ce qui est réellement lié à une fiche : sinon les
      // repères hors catalogue gonflent le compteur et l'on affiche « 15 / 8 ».
      var cnt={}; MARQUEURS.forEach(function(m){ if(m.ref_id) cnt[m.type]=(cnt[m.type]||0)+1; });

      var html="<input id='plan-cat-search' oninput='catFiltre(this.value)' value='"+esc(FILTRE)+"' placeholder='Rechercher dans les catalogues…' style='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.74rem;background:#f8fafc;outline:none;box-sizing:border-box;margin-bottom:8px;'/>";

      html+=CATKEYS.map(function(k){
        var d=CATS[k], n=cnt[k]||0, ents=entitiesFor(k), tot=ents.length, hid=!!HIDDEN[k], isRect=d.shape==="rect";
        var pl=placedIds(k);
        var vis=FILTRE?ents.filter(function(e){return (e.nom+" "+(e.sub||"")).toLowerCase().indexOf(FILTRE)>=0;}):ents;
        var ouvert=!!OPEN[k]||(!!FILTRE&&vis.length>0);
        var s="<div style='border-bottom:1px solid #f1f5f9;padding:4px 0;"+(hid?"opacity:.45;":"")+"'>"
          +"<div style='display:flex;align-items:center;gap:7px;font-size:.74rem;'>"
          +"<button data-flt='"+k+"' title='Afficher / masquer sur le plan' style='border:none;background:transparent;cursor:pointer;color:#94a3b8;width:15px;'><i class='fas "+(hid?"fa-eye-slash":"fa-eye")+"'></i></button>"
          +"<span style='width:12px;height:12px;border-radius:"+(isRect?"3px":"50%")+";background:"+d.col+(isRect?"55":"")+";border:1.5px solid "+d.col+";display:inline-block;flex:none;'></span>"
          +"<button data-open='"+k+"' title='"+esc(d.aide||"")+"' style='flex:1;text-align:left;border:none;background:transparent;cursor:pointer;padding:0;color:#334155;font-size:.74rem;font-weight:600;'>"
          +"<i class='fas "+(ouvert?"fa-caret-down":"fa-caret-right")+"' style='color:#cbd5e1;width:9px;margin-right:4px;'></i>"+d.label
          +(isRect?" <span style=\\"color:#cbd5e1;font-size:.62rem;\\">(zone)</span>":"")+"</button>"
          +"<span style='font-weight:800;color:"+(n>=tot&&tot>0?"#16a34a":"#94a3b8")+";' title='posés sur le plan / total au catalogue'>"+n+" / "+tot+"</span>"
          +"</div>";
        if(ouvert){
          s+="<div style='margin:5px 0 3px 22px;max-height:190px;overflow:auto;'>";
          if(!vis.length) s+="<div style='color:#cbd5e1;font-size:.68rem;padding:4px 0;'>"+(tot?"Aucun résultat.":"Catalogue vide — les fiches se créent dans leur service.")+"</div>";
          vis.forEach(function(e){
            var mid=pl[String(e.id)], pose=!!mid;
            s+="<div data-goto='"+(pose?esc(mid):"")+"' data-pick='"+(pose?"":k+"|"+esc(e.id))+"' style='display:flex;align-items:flex-start;gap:6px;padding:3px 4px;border-radius:6px;cursor:pointer;"+(pose?"background:#f0fdf4;":"")+"' title='"+(pose?"Déjà posé — cliquez pour le localiser":(EDIT?"Cliquez pour poser sur le plan":"Passez en mode Modifier pour poser"))+"'>"
              +"<i class='fas "+(pose?"fa-circle-check":"fa-circle-plus")+"' style='color:"+(pose?"#16a34a":d.col)+";font-size:.7rem;margin-top:2px;flex:none;'></i>"
              +"<span style='flex:1;min-width:0;'><span style='display:block;font-size:.7rem;color:#334155;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(e.nom)+"</span>"
              +(e.sub?"<span style='display:block;font-size:.62rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(e.sub)+"</span>":"")+"</span></div>";
          });
          s+="</div>";
        }
        return s+"</div>";
      }).join("");

      // ── Repères hors catalogue (anciennes salles dessinées à la main) ──
      var orph=MARQUEURS.filter(isLegacy);
      if(orph.length){
        html+="<div style='margin-top:10px;padding-top:8px;border-top:2px solid #fde68a;'>"
          +"<div style='font-size:.68rem;font-weight:800;color:#92400e;margin-bottom:4px;'><i class='fas fa-triangle-exclamation' style='margin-right:5px;'></i>Hors catalogue ("+orph.length+")</div>"
          +"<div style='font-size:.63rem;color:#a16207;line-height:1.45;margin-bottom:5px;'>Tracés à la main avant que le plan ne devienne un simple outil de placement. Ils ne correspondent à aucune fiche de l'ERP et ne sont plus créables. Le fond de plan porte déjà les noms de salles.</div>"
          +"<div style='max-height:150px;overflow:auto;'>"
          +orph.map(function(m){ return "<div data-goto='"+esc(m.id)+"' style='display:flex;align-items:center;gap:6px;padding:2px 4px;border-radius:6px;cursor:pointer;font-size:.68rem;color:#78716c;'>"
              +"<i class='fas "+CAT(m.type).icon+"' style='color:#a8a29e;width:12px;font-size:.65rem;'></i><span style='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(m.label||CAT(m.type).label)+"</span></div>"; }).join("")
          +"</div></div>";
      }
      el.innerHTML=html;
    }
    function toggleFilter(k){ HIDDEN[k]=!HIDDEN[k]; renderCats(); renderMarkers(); }
    // Arme le placement d'UNE fiche précise : le repère naîtra avec son ref_id et son libellé.
    function pickEntity(k,id){
      if(!EDIT){ noti("info","fa-circle-info","Cliquez « Modifier » pour poser des éléments."); return; }
      var e=entitiesFor(k).find(function(x){return String(x.id)===String(id);}); if(!e) return;
      ADDCAT={type:k,id:e.id,table:e.table,label:e.raw||e.nom};
      var d=CATS[k];
      document.getElementById("plan-add-hint").textContent=(d.shape==="rect"?"→ glissez sur le plan pour dessiner la zone : ":"→ cliquez le plan pour poser : ")+(e.raw||e.nom);
    }

    // ── Rendu marqueurs (zones + points) ──
    function zoneHtml(m){ var d=CAT(m.type); var col=m.couleur||d.col; var selb=SEL===m.id; var st=statusOf(m); var sc=stCol(st.lvl);
      var rk=(RISKVIEW&&(m.type==="chimie"||m.type==="atex"))?(riskColor(m)||SEIRICH[0]):null;
      var bg=rk?rk[0]:(col+"1f"); var bc=rk?rk[1]:((sc&&st.lvl!=="ok")?sc:col); var bstyle=(!rk&&sc&&st.lvl==="alert")?"dashed":"solid"; var lblbg=rk?rk[1]:col;
      var ttl=(m.label||d.label)+(rk?(" — risque "+rk[2]):(st.reason?(" — "+st.reason):""));
      return "<div class='pzone' data-mid='"+esc(m.id)+"' title='"+esc(ttl)+"' style='position:absolute;left:"+m.x+"%;top:"+m.y+"%;width:"+rw(m)+"%;height:"+rh(m)+"%;background:"+bg+";border:2px "+bstyle+" "+bc+";border-radius:6px;z-index:"+(selb?2:1)+";pointer-events:auto;cursor:"+(EDIT?"move":"pointer")+";box-sizing:border-box;'>"
        +"<span style='position:absolute;left:3px;top:2px;background:"+lblbg+";color:white;font-size:.58rem;font-weight:700;padding:1px 6px;border-radius:4px;white-space:nowrap;max-width:96%;overflow:hidden;text-overflow:ellipsis;'><i class='fas "+d.icon+"' style='margin-right:3px;'></i>"+esc(m.label||d.label)+"</span>"
        +(EDIT?"<div class='pzone-h' data-mid='"+esc(m.id)+"' style='position:absolute;right:-5px;bottom:-5px;width:12px;height:12px;background:white;border:2px solid "+col+";border-radius:3px;cursor:nwse-resize;'></div>":"")
        +"</div>";
    }
    function pointHtml(m){ var d=CAT(m.type); var col=m.couleur||d.col; var selb=SEL===m.id; var st=statusOf(m); var sc=stCol(st.lvl);
      var rk=(RISKVIEW&&(m.type==="chimie"||m.type==="atex"))?(riskColor(m)||SEIRICH[0]):null; var dqi=(rk&&chimDq(m)==="incomplet"); if(rk){ col=rk[1]; }
      var bord=selb?"#111827":(rk?"white":(sc&&st.lvl!=="ok"?sc:"white")); var glow=(!rk&&st.lvl==="alert")?"0 0 0 3px "+sc+"66,":"";
      var ttl=(m.label||d.label)+(rk?(" — risque "+rk[2]+(dqi?" (données incomplètes)":"")):(st.reason?(" — "+st.reason):""));
      return "<div class='pmark' data-mid='"+esc(m.id)+"' title='"+esc(ttl)+"' style='position:absolute;left:"+m.x+"%;top:"+m.y+"%;transform:translate(-50%,-100%);pointer-events:auto;cursor:"+(EDIT?"grab":"pointer")+";z-index:"+(selb?5:((rk?rk[2]==="Élevé":st.lvl==="alert")?4:3))+";'>"
        +"<div style='position:relative;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:"+col+";border:2px solid "+bord+";box-shadow:"+glow+"0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;'>"
        +"<i class='fas "+(dqi?"fa-question":d.icon)+"' style='transform:rotate(45deg);color:white;font-size:.58rem;'></i>"
        +((!rk&&sc&&st.lvl!=="ok"&&st.lvl!=="none")?"<span style='position:absolute;top:-5px;right:-5px;transform:rotate(45deg);width:9px;height:9px;border-radius:50%;background:"+sc+";border:1.5px solid white;'></span>":"")
        +"</div></div>";
    }
    function renderMarkers(){
      var layer=document.getElementById("plan-markers"); if(!layer) return;
      var vis=MARQUEURS.filter(function(m){ if(RISKVIEW) return m.type==="chimie"||m.type==="atex"||shapeOf(m)==="rect"; return !HIDDEN[m.type]; });
      layer.innerHTML=vis.filter(function(m){return shapeOf(m)==="rect";}).map(zoneHtml).join("")+vis.filter(function(m){return shapeOf(m)==="point";}).map(pointHtml).join("");
    }
    // objet (point) dans quelle zone (rectangle) ? la plus petite qui le contient
    function zoneOf(m){ var best=null,ba=1e9; MARQUEURS.forEach(function(z){ if(shapeOf(z)!=="rect") return; if(m.x>=z.x&&m.x<=z.x+rw(z)&&m.y>=z.y&&m.y<=z.y+rh(z)){ var a=rw(z)*rh(z); if(a<ba){ba=a;best=z;} } }); return best; }
    function rowHtml(m,indent){ var d=CAT(m.type); var st=statusOf(m); var sc=stCol(st.lvl);
      return "<div data-mid='"+esc(m.id)+"' data-act='sel' title='"+esc(st.reason||"")+"' style='display:flex;align-items:center;gap:6px;padding:4px "+(indent?"4px 4px 16px":"4px")+";border-bottom:1px solid #f7f8fa;cursor:pointer;font-size:.74rem;"+(SEL===m.id?"background:#eef2ff;":"")+"'>"
        +"<i class='fas "+d.icon+"' style='color:"+(m.couleur||d.col)+";width:14px;text-align:center;font-size:.68rem;'></i>"
        +"<span style='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(m.label||d.label)+"</span>"
        +((sc&&st.lvl!=="none")?"<span title='"+esc(st.reason)+"' style='width:9px;height:9px;border-radius:50%;background:"+sc+";flex:none;'></span>":"")
        +(EDIT?"<button data-mid='"+esc(m.id)+"' data-act='del' title='Supprimer' style='border:none;background:#fee2e2;color:#dc2626;border-radius:5px;width:19px;height:19px;cursor:pointer;'>×</button>":"")
        +"</div>";
    }
    function renderList(){
      var list=document.getElementById("plan-list"); if(!list) return;
      document.getElementById("plan-count").textContent="("+MARQUEURS.length+")";
      var zones=MARQUEURS.filter(function(m){return shapeOf(m)==="rect";}), points=MARQUEURS.filter(function(m){return shapeOf(m)==="point";});
      if(!MARQUEURS.length){ list.innerHTML="<div style='font-size:.7rem;color:#cbd5e1;padding:8px 0;'>Aucun élément. Passez en Modifier pour dessiner des zones et poser des objets.</div>"; return; }
      var nAl=0,nWa=0; MARQUEURS.forEach(function(m){ var l=statusOf(m).lvl; if(l==="alert")nAl++; else if(l==="warn")nWa++; });
      var html=(nAl||nWa)?("<div style='display:flex;gap:6px;margin-bottom:6px;'>"+(nAl?"<span style='flex:1;text-align:center;background:#fee2e2;color:#b91c1c;border-radius:6px;padding:3px 6px;font-size:.68rem;font-weight:800;'>● "+nAl+" alerte"+(nAl>1?"s":"")+"</span>":"")+(nWa?"<span style='flex:1;text-align:center;background:#fef3c7;color:#92400e;border-radius:6px;padding:3px 6px;font-size:.68rem;font-weight:800;'>● "+nWa+" à surveiller</span>":"")+"</div>"):"";
      zones.forEach(function(z){ var d=CAT(z.type); var inside=points.filter(function(p){return zoneOf(p)===z;});
        html+="<div data-mid='"+esc(z.id)+"' data-act='sel' style='display:flex;align-items:center;gap:6px;margin-top:6px;padding:3px 2px;cursor:pointer;"+(SEL===z.id?"background:#eef2ff;":"")+"'><span style='width:10px;height:10px;border-radius:2px;background:"+(z.couleur||d.col)+";'></span><b style='flex:1;font-size:.72rem;color:#334155;'>"+esc(z.label||d.label)+"</b><span style='font-size:.64rem;color:#94a3b8;'>"+inside.length+" obj.</span></div>";
        html+=inside.map(function(p){return rowHtml(p,true);}).join("");
      });
      var hors=points.filter(function(p){return !zoneOf(p);});
      if(hors.length){ html+="<div style='margin-top:8px;font-size:.62rem;font-weight:800;text-transform:uppercase;color:#94a3b8;'>Hors zone</div>"+hors.map(function(p){return rowHtml(p,false);}).join(""); }
      list.innerHTML=html;
    }
    function renderAll(){ renderCats(); renderMarkers(); renderList(); }

    // ── Éditeur ──
    function selectMarker(id){
      SEL=id; renderMarkers(); renderList();
      var m=MARQUEURS.find(function(x){return String(x.id)===String(id);}); if(!m) return;
      var d=CAT(m.type); var ed=document.getElementById("plan-editor"), body=document.getElementById("plan-editor-body");
      if(!EDIT){ var dl=deepLink(m); var z=zoneOf(m); var st=statusOf(m); var sc=stCol(st.lvl); var ent=m.ref_id?("<div style='font-size:.72rem;color:#475569;margin-top:4px;'>Lié : <b>"+esc(entName(m))+"</b></div>"):"";
        var stChip=(sc&&st.lvl!=="none")?("<div style='display:inline-flex;align-items:center;gap:5px;margin-top:6px;background:"+sc+"1a;color:"+sc+";border:1px solid "+sc+"66;border-radius:6px;padding:3px 8px;font-size:.7rem;font-weight:700;'><span style='width:8px;height:8px;border-radius:50%;background:"+sc+";'></span>"+esc(st.reason||(st.lvl==="ok"?"À jour":""))+"</div>"):"";
        body.innerHTML="<div style='display:flex;align-items:center;gap:7px;'><span style='width:22px;height:22px;border-radius:50%;background:"+(m.couleur||d.col)+";display:flex;align-items:center;justify-content:center;'><i class='fas "+d.icon+"' style='color:white;font-size:.62rem;'></i></span><b style='font-size:.85rem;'>"+esc(m.label||d.label)+"</b></div>"
          +"<div style='font-size:.68rem;color:#94a3b8;margin-top:3px;'>"+d.label+(shapeOf(m)==="point"&&z?(" · dans "+esc(z.label||"")):"")+"</div>"+ent+(stChip?("<div>"+stChip+"</div>"):"")
          +(m.notes?("<div style='font-size:.72rem;color:#475569;margin-top:4px;'>"+esc(m.notes)+"</div>"):"")
          +(dl?("<a href='"+dl.url+"' style='display:inline-block;margin-top:8px;background:#eef2ff;color:#4338ca;text-decoration:none;border-radius:6px;padding:5px 10px;font-size:.72rem;font-weight:700;'>"+esc(dl.lbl)+" <i class='fas fa-arrow-right' style='margin-left:4px;'></i></a>"):"");
        ed.style.display="block"; return; }
      // ── ÉDITEUR : plus de libellé libre, plus de changement de catégorie, plus de
      //    création d'entité. Le repère EST une fiche de l'ERP posée sur le plan ; on ne
      //    règle donc que ce qui appartient au plan : la note de placement. Le reste se
      //    modifie dans le service d'origine (lien direct fourni).
      var lb="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin:7px 0 3px;"; var ip="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 8px;font-size:.78rem;box-sizing:border-box;";
      var zpt=(shapeOf(m)==="point")?zoneOf(m):null;
      var zline=(shapeOf(m)==="point")?("<div style='font-size:.68rem;margin-bottom:7px;padding:5px 8px;border-radius:6px;"+(zpt?"background:#ecfdf5;color:#047857;":"background:#fff7ed;color:#c2410c;")+"'><i class='fas fa-sitemap' style='margin-right:5px;'></i>Zone : <b>"+(zpt?esc(zpt.label||CAT(zpt.type).label):"hors zone — déplacez le repère dans une zone")+"</b> <span style='opacity:.7;'>(auto)</span></div>"):"";
      var dlE=deepLink(m);
      var horsCat=isLegacy(m);
      body.innerHTML=zline
        +"<div style='display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:8px;background:"+(horsCat?"#fffbeb":"#f8fafc")+";border:1px solid "+(horsCat?"#fde68a":"#e2e8f0")+";'>"
          +"<span style='width:22px;height:22px;border-radius:50%;background:"+(m.couleur||d.col)+";display:flex;align-items:center;justify-content:center;flex:none;'><i class='fas "+d.icon+"' style='color:white;font-size:.62rem;'></i></span>"
          +"<span style='min-width:0;'><b style='font-size:.8rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(m.label||d.label)+"</b>"
          +"<span style='font-size:.65rem;color:#94a3b8;'>"+d.label+"</span></span></div>"
        +(horsCat
          ? "<div style='margin-top:8px;font-size:.7rem;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;line-height:1.5;'><i class='fas fa-triangle-exclamation' style='margin-right:5px;'></i><b>Hors catalogue.</b> Ce tracé ne correspond à aucune fiche de l'ERP. Il n'est plus créable : le plan ne fait que <b>poser</b> ce qui existe en base. Vous pouvez le supprimer — le fond de plan porte déjà les noms de salles.</div>"
          : "<div style='margin-top:8px;font-size:.68rem;color:#64748b;line-height:1.5;'>Fiche de l'ERP posée sur le plan. Pour changer son nom ou ses données, ouvrez-la dans son service.</div>")
        +(dlE&&!horsCat?("<a href='"+dlE.url+"' style='display:inline-block;margin-top:6px;background:#eef2ff;color:#4338ca;text-decoration:none;border-radius:6px;padding:5px 10px;font-size:.72rem;font-weight:700;'>"+esc(dlE.lbl)+" <i class='fas fa-arrow-right' style='margin-left:4px;'></i></a>"):"")
        +"<label style='"+lb+"'>Note de placement</label><input id='pe-notes' value='"+esc(m.notes||"")+"' placeholder='ex. contre le mur nord' style='"+ip+"'/>"
        +"<div style='display:flex;gap:6px;margin-top:12px;'><button data-act='apply' style='flex:1;background:#16a34a;color:white;border:none;border-radius:7px;padding:7px;font-weight:700;cursor:pointer;font-size:.76rem;'>Appliquer</button><button data-act='del2' style='background:#fee2e2;color:#dc2626;border:none;border-radius:7px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.76rem;'>Retirer du plan</button></div>";
      ed.style.display="block";
    }
    // Seule la NOTE DE PLACEMENT est modifiable ici : le libellé, la catégorie et les
    // données viennent de la fiche liée. On ne peut donc plus délier ni renommer un repère.
    function applyEditor(){ var m=MARQUEURS.find(function(x){return String(x.id)===String(SEL);}); if(!m) return;
      var n=document.getElementById("pe-notes"); m.notes=(n&&n.value)?n.value:null;
      renderAll(); if(SEL) selectMarker(SEL);
      if(val&&!em) noti("info","fa-info-circle","Réf. non reconnue — sélectionnez-la dans la liste déroulante. (repère conservé)"); else noti("ok","fa-check","Appliqué — pensez à Enregistrer."); }
    function delMarker(id){ var i=MARQUEURS.findIndex(function(x){return String(x.id)===String(id);}); if(i<0) return; var m=MARQUEURS[i]; if(m.id&&String(m.id).indexOf("tmp-")!==0) SUPPRIMES.push(m.id); MARQUEURS.splice(i,1); if(SEL===id){ SEL=null; document.getElementById("plan-editor").style.display="none"; } renderAll(); }
    // ── Auto-placement : pré-poser les objets déjà localisés en base dans la zone dont le nom correspond ──
    function _norm(s){ try{ return String(s||"").toUpperCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^A-Z0-9]+/g," ").trim(); }catch(e){ return String(s||"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim(); } }
    function zoneForText(txt){ var n=_norm(txt); if(n.length<3) return null; var best=null; MARQUEURS.forEach(function(z){ if(shapeOf(z)!=="rect") return; var zn=_norm(z.label||CAT(z.type).label); if(zn.length<3) return; if(n.indexOf(zn)>=0||zn.indexOf(n)>=0){ if(!best||rw(z)*rh(z)<rw(best)*rh(best)) best=z; } }); return best; }
    async function planAutoPlace(){ if(!EDIT){ noti("info","fa-info-circle","Passez d'abord en Modifier."); return; }
      var zs=MARQUEURS.filter(function(m){return shapeOf(m)==="rect";}); if(!zs.length){ noti("err","fa-exclamation-triangle","Dessinez d'abord des zones (rectangles)."); return; }
      var placed={}; MARQUEURS.forEach(function(m){ if(m.ref_id) placed[m.ref_table+":"+m.ref_id]=true; });
      var props=[], un=0;
      POSTES.forEach(function(pp){ if(placed["postes:"+pp.id]) return; var z=zoneForText(pp.nom); if(z) props.push({type:"poste",z:z,id:pp.id,table:"postes",label:pp.nom}); else un++; });
      var seen={}; PERISSABLES.forEach(function(pp){ if((pp.statut||"").toLowerCase()==="archive") return; var key=pp.ref||pp.nom; if(seen["p"+key]) return; seen["p"+key]=1; if(placed["produits_perissables:"+pp.id]) return; var z=zoneForText(pp.empl); if(z) props.push({type:"perissable",z:z,id:pp.id,table:"produits_perissables",label:pp.nom}); else un++; });
      CHIMIE.forEach(function(cc){ if((cc.statut||"").toLowerCase()==="retire") return; if(placed["hse_produits_chimiques:"+cc.id]) return; var z=zoneForText(cc.zone); if(z) props.push({type:"chimie",z:z,id:cc.id,table:"hse_produits_chimiques",label:cc.nom}); else un++; });
      if(!props.length){ noti("info","fa-info-circle","Rien à placer ("+un+" éléments sans zone correspondante)."); return; }
      var by={}; props.forEach(function(p){ by[p.type]=(by[p.type]||0)+1; });
      var msg="Placer automatiquement dans les zones correspondantes :\\n"+Object.keys(by).map(function(k){return "  \\u2022 "+by[k]+" "+k;}).join("\\n")+"\\n\\n"+un+" élément(s) sans zone correspondante seront ignorés.\\n\\nLes repères seront ajoutés — pensez à Enregistrer.";
      if(!await appConfirm(msg)) return;
      var pz={}; props.forEach(function(p){ (pz[p.z.id]=pz[p.z.id]||[]).push(p); });
      Object.keys(pz).forEach(function(zid){ var lst=pz[zid], z=lst[0].z, n=lst.length, cols=Math.ceil(Math.sqrt(n)), rows=Math.ceil(n/cols);
        lst.forEach(function(p,k){ var c=k%cols, r=Math.floor(k/cols); var px=z.x+rw(z)*((c+0.5)/cols), py=z.y+rh(z)*((r+0.5)/rows); var id="tmp-"+(++TMPN);
          MARQUEURS.push({id:id,plan_id:CURRENT,type:p.type,x:+px.toFixed(2),y:+py.toFixed(2),label:p.label,couleur:CAT(p.type).col,ref_table:p.table,ref_id:p.id,notes:null}); }); });
      renderAll(); noti("ok","fa-wand-magic-sparkles","Placés : "+props.length+" · ignorés : "+un+". Vérifiez puis Enregistrez.");
    }
    // ── Interop : créer une entité HSE (ATEX / VGP-extincteur) directement depuis le plan ──
    function gv(id){ var el=document.getElementById(id); return el?(el.value||"").trim():""; }
    // ── Interaction plan : dessin zone / pose objet / pan ──
    function pct(e){ var r=document.getElementById("plan-img").getBoundingClientRect(); return {x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)), y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}; }
    function onStageDown(e){
      if(!CURRENT) return;
      if(e.target.closest(".pmark")||e.target.closest(".pzone")||e.target.closest(".pzone-h")) return;
      downCX=e.clientX; downCY=e.clientY;
      if(EDIT&&ADDCAT){
        if(CATS[ADDCAT.type].shape==="rect"){ drawing=true; var p=pct(e); drawSX=p.x; drawSY=p.y; e.preventDefault(); document.addEventListener("mousemove",onDraw); document.addEventListener("mouseup",onDrawUp); return; }
        clickPend=true; document.addEventListener("mouseup",onPointUp); return;
      }
      var vp=document.getElementById("plan-viewport"); panning=true; panSX=e.clientX; panSY=e.clientY; panL=vp.scrollLeft; panT=vp.scrollTop; document.addEventListener("mousemove",onPan); document.addEventListener("mouseup",onPanUp); e.preventDefault();
    }
    function onDraw(e){ if(!drawing) return; var p=pct(e); var x=Math.min(drawSX,p.x),y=Math.min(drawSY,p.y),w=Math.abs(p.x-drawSX),h=Math.abs(p.y-drawSY); var pv=document.getElementById("plan-preview"); pv.style.display="block"; pv.style.left=x+"%"; pv.style.top=y+"%"; pv.style.width=w+"%"; pv.style.height=h+"%"; pv.style.borderColor=CATS[ADDCAT.type].col; }
    function onDrawUp(e){ document.removeEventListener("mousemove",onDraw); document.removeEventListener("mouseup",onDrawUp); document.getElementById("plan-preview").style.display="none"; if(!drawing) return; drawing=false; var p=pct(e); var x=Math.min(drawSX,p.x),y=Math.min(drawSY,p.y),w=Math.abs(p.x-drawSX),h=Math.abs(p.y-drawSY); if(w<2||h<2) return; var P=ADDCAT; var d=CATS[P.type]; var id="tmp-"+(++TMPN); MARQUEURS.push({id:id,plan_id:CURRENT,type:P.type,x:+x.toFixed(2),y:+y.toFixed(2),w:+w.toFixed(2),h:+h.toFixed(2),label:P.label,couleur:d.col,ref_table:P.table,ref_id:P.id,notes:null}); ADDCAT=null; document.getElementById("plan-add-hint").textContent=""; renderAll(); selectMarker(id); }
    function onPointUp(e){ document.removeEventListener("mouseup",onPointUp); if(!clickPend) return; clickPend=false; if(Math.abs(e.clientX-downCX)>4||Math.abs(e.clientY-downCY)>4) return; var p=pct(e); var P=ADDCAT; var d=CATS[P.type]; var id="tmp-"+(++TMPN); MARQUEURS.push({id:id,plan_id:CURRENT,type:P.type,x:+p.x.toFixed(2),y:+p.y.toFixed(2),label:P.label,couleur:d.col,ref_table:P.table,ref_id:P.id,notes:null}); ADDCAT=null; document.getElementById("plan-add-hint").textContent=""; renderAll(); selectMarker(id); }
    function onPan(e){ if(!panning) return; var vp=document.getElementById("plan-viewport"); vp.scrollLeft=panL-(e.clientX-panSX); vp.scrollTop=panT-(e.clientY-panSY); }
    function onPanUp(){ panning=false; document.removeEventListener("mousemove",onPan); document.removeEventListener("mouseup",onPanUp); }

    // ── Drag/resize d'un élément existant ──
    function onLayerDown(e){ if(!EDIT) return; var h=e.target.closest(".pzone-h"), z=e.target.closest(".pzone"), pt=e.target.closest(".pmark"); var el=pt||z; if(!el) return;
      dragId=el.getAttribute("data-mid"); selectMarker(dragId); e.preventDefault(); e.stopPropagation();
      var m=MARQUEURS.find(function(x){return String(x.id)===String(dragId);}); var p=pct(e);
      if(pt){ dragKind="point"; } else if(h){ dragKind="resize"; } else { dragKind="move"; dOffX=p.x-m.x; dOffY=p.y-m.y; }
      document.addEventListener("mousemove",onObjMove); document.addEventListener("mouseup",onObjUp);
    }
    function onObjMove(e){ if(!dragId) return; var p=pct(e); var m=MARQUEURS.find(function(z){return String(z.id)===String(dragId);}); if(!m) return;
      if(dragKind==="point"){ m.x=+p.x.toFixed(2); m.y=+p.y.toFixed(2); }
      else if(dragKind==="move"){ m.x=+Math.max(0,p.x-dOffX).toFixed(2); m.y=+Math.max(0,p.y-dOffY).toFixed(2); }
      else if(dragKind==="resize"){ m.w=+Math.max(2,p.x-m.x).toFixed(2); m.h=+Math.max(2,p.y-m.y).toFixed(2); }
      renderMarkers();
    }
    function onObjUp(){ if(dragId){ renderList(); } dragId=null; dragKind=null; document.removeEventListener("mousemove",onObjMove); document.removeEventListener("mouseup",onObjUp); }

    // ── Zoom ──
    function planZoom(dz){ ZOOM=Math.max(1,Math.min(4,+(ZOOM+dz).toFixed(2))); applyZoom(); }
    function planZoomReset(){ ZOOM=1; applyZoom(); }
    function applyZoom(){ var st=document.getElementById("plan-stage"); if(st) st.style.width=(ZOOM*100)+"%"; var l=document.getElementById("plan-zoom-lbl"); if(l) l.textContent=Math.round(ZOOM*100)+"%"; }

    // ── Sauvegarde ──
    function planSave(){ if(!CURRENT){ noti("err","fa-exclamation-triangle","Aucun plan."); return; }
      var payload={marqueurs:MARQUEURS.map(function(m){return {id:m.id,type:m.type,x:m.x,y:m.y,w:(m.w||null),h:(m.h||null),label:m.label,couleur:m.couleur,ref_table:m.ref_table,ref_id:m.ref_id,notes:m.notes};}),supprimes:SUPPRIMES};
      fetch("/api/plans/"+encodeURIComponent(CURRENT)+"/marqueurs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok){ SUPPRIMES=[]; EDIT=false; syncEditUI(); noti("ok","fa-save","Maquette enregistrée ("+j.saved+" éléments)."); planSelect(CURRENT); } else noti("err","fa-times",(j&&j.error)||"Échec.");
      }).catch(function(){ noti("err","fa-times","Erreur réseau."); }); }

    // ── Survol d'un repère POSTE : bulle avec process contenus, coûts (taux €/h, OPEX) et stats ──
    function posteTipHtml(po){
      var procTxt=(po.process&&po.process.length)?po.process.map(esc).join(", "):"aucun";
      var machTxt=(po.machines&&po.machines.length)?po.machines.map(esc).join(", "):"aucune";
      return "<div style='font-weight:800;font-size:.8rem;margin-bottom:5px;color:white;'>"+esc(po.nom)+(po.act?(" <span style='font-weight:600;color:#94a3b8;'>\\u00b7 "+esc(po.act)+"</span>"):"")+"</div>"
        +"<div style='margin-bottom:2px;'><span style='color:#94a3b8;'>Process ("+po.nbProcess+")</span> : "+procTxt+"</div>"
        +"<div style='margin-bottom:2px;'><span style='color:#94a3b8;'>Machines ("+po.nbMachines+")</span> : "+machTxt+"</div>"
        +"<div style='margin-top:5px;padding-top:5px;border-top:1px solid #334155;'><span style='color:#94a3b8;'>Taux effectif</span> : <b style='color:#5eead4;'>"+po.taux+" \\u20ac/h</b></div>"
        +"<div><span style='color:#94a3b8;'>OPEX th\\u00e9orique</span> : <b style='color:#fcd34d;'>"+(po.opexTheo||0).toLocaleString('fr-FR')+" \\u20ac/an</b></div>";
    }
    function posTip(e){ var t=document.getElementById("plan-tip"); if(!t||t.style.display==="none") return; var x=e.clientX+14,y=e.clientY+16,w=t.offsetWidth||260,h=t.offsetHeight||110; if(x+w>window.innerWidth-8) x=e.clientX-w-14; if(y+h>window.innerHeight-8) y=e.clientY-h-16; if(x<4)x=4; if(y<4)y=4; t.style.left=x+"px"; t.style.top=y+"px"; }
    function showPosteTip(po,e){ var t=document.getElementById("plan-tip"); if(!t) return; t.innerHTML=posteTipHtml(po); t.style.display="block"; posTip(e); }
    function hidePosteTip(){ var t=document.getElementById("plan-tip"); if(t) t.style.display="none"; }
    function _posteOfMark(mid){ var m=MARQUEURS.find(function(x){return String(x.id)===String(mid);}); if(!m||CAT(m.type).link!=="poste"||!m.ref_id) return null; return POSTES.find(function(x){return String(x.id)===String(m.ref_id);})||null; }
    document.addEventListener("mouseover",function(e){ var mk=e.target.closest(".pmark"); if(!mk) return; var po=_posteOfMark(mk.getAttribute("data-mid")); if(po) showPosteTip(po,e); });
    document.addEventListener("mouseout",function(e){ if(e.target.closest(".pmark")) hidePosteTip(); });
    document.addEventListener("mousemove",function(e){ posTip(e); });
    document.addEventListener("click",function(e){
      var flt=e.target.closest("[data-flt]"); if(flt){ toggleFilter(flt.getAttribute("data-flt")); return; }
      var opn=e.target.closest("[data-open]"); if(opn){ catToggleOpen(opn.getAttribute("data-open")); return; }
      var got=e.target.closest("[data-goto]"); if(got&&got.getAttribute("data-goto")){ selectMarker(got.getAttribute("data-goto")); return; }
      var pk=e.target.closest("[data-pick]"); if(pk&&pk.getAttribute("data-pick")){ var pp=pk.getAttribute("data-pick").split("|"); pickEntity(pp[0],pp.slice(1).join("|")); return; }
      var act=e.target.closest("[data-act]"); if(act){ var a=act.getAttribute("data-act"), mid=act.getAttribute("data-mid"); if(a==="sel") selectMarker(mid); else if(a==="del") delMarker(mid); else if(a==="del2") delMarker(SEL); else if(a==="apply") applyEditor(); return; }
      if(!EDIT){ var mk=e.target.closest(".pmark")||e.target.closest(".pzone"); if(mk) selectMarker(mk.getAttribute("data-mid")); }
    });
    window.addEventListener("DOMContentLoaded",function(){
      fillPlanSel();
      document.getElementById("plan-markers").addEventListener("mousedown",onLayerDown);
      document.getElementById("plan-stage").addEventListener("mousedown",onStageDown);
      renderCats();
    });
    </script>`

  return layout('Plan / Bâtiment', content, 'service-plans')
}
