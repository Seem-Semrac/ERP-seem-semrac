// ══════════════════════════════════════════════════════════════
// CADENCE USINE — écran « Cadence usine » (Production › Process Ateliers) + moteur navigateur de la page
// Production — lot G · G1 (16/09/2026). Règles : ./cadence.ts ; base : ./cadence_db.ts ; routes /api/production/cadence…
//
// Injection dans /production/service (src/prod.tsx) :
//   · scriptCadencePage(lecture) — UNE balise <script> placée avant les panneaux : données (CADENCE_PAGE), moteur `CAD`
//     (copie ES5 de cadence.ts) et aides d'affichage partagées par la présence, le planning d'affectation et le Gantt :
//       cadCalendrier(activite)                     → calendrier CAD (null si la cadence est illisible)
//       cadHorairesCreneau(activite, date, creneau) → { ouvert, texte, niveau, secours, parSite }
//       cadNotifierChangement()                     → redessine présence / affectation / Gantt après un changement
//   · voletCadenceBouton() / voletCadenceHTML() / scriptVoletCadence() — le volet d'édition.
// Cadence illisible (cloud sans cloud-12, panne) : horaires par défaut des créneaux (SHIFTS), aucun créneau refusé,
// bandeau d'avertissement dans le volet ; jamais d'erreur bloquante.
// JS client : ES5, aucun backtick ni interpolation involontaire, délégation d'événements (data-*), textes échappés.
// ══════════════════════════════════════════════════════════════
import { CADENCE_CLIENT_JS, MSG_CLOUD12 } from './cadence'
import type { LectureCadence } from './cadence_db'
import { SHIFTS } from './shared'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

/** État sérialisé pour la page (aucun secret : modèles d'horaires et historique des cadences). */
export function etatCadencePage(lecture: LectureCadence | null | undefined): { disponible: boolean; absente: boolean; erreur: string | null; avertissement: string | null; donnees: any } {
  if (!lecture) return { disponible: false, absente: false, erreur: 'cadence non lue', avertissement: 'Cadence usine non lue : horaires par défaut des créneaux.', donnees: null }
  if (lecture.absente) return { disponible: false, absente: true, erreur: null, avertissement: MSG_CLOUD12, donnees: null }
  if (lecture.error || !lecture.data) return { disponible: false, absente: false, erreur: lecture.error || 'réponse vide', avertissement: 'Lecture de la cadence usine impossible (' + (lecture.error || 'réponse vide') + ') : horaires par défaut des créneaux.', donnees: null }
  return { disponible: true, absente: false, erreur: null, avertissement: null, donnees: lecture.data }
}

/** <script> commun de la page Production : données + moteur CAD + aides d'affichage. */
export function scriptCadencePage(lecture: LectureCadence | null | undefined): string {
  const secours: Record<string, { label: string; start: number; end: number }> = {}
  for (const k of Object.keys(SHIFTS)) secours[k] = { label: SHIFTS[k].label, start: SHIFTS[k].start, end: SHIFTS[k].end }
  return `<script>
// ─── Cadence usine (lot G) : données, moteur CAD (copie de src/cadence.ts), aides d'affichage ───
var CADENCE_PAGE=${sjX(etatCadencePage(lecture))};
var CAD_SECOURS=${sjX(secours)};
${CADENCE_CLIENT_JS}
var CAD_MEMO={};
function cadDonnees(){ return (CADENCE_PAGE&&CADENCE_PAGE.disponible&&CADENCE_PAGE.donnees)?CADENCE_PAGE.donnees:null; }
// Calendrier d'une activité (Seem, Semrac ; toute autre valeur = union des deux sites). null si la cadence est illisible.
function cadCalendrier(activite){ var d=cadDonnees(); if(!d) return null; var k='a:'+String(activite==null?'':activite); if(!CAD_MEMO[k]) CAD_MEMO[k]=CAD.calendrierCadence(d,activite); return CAD_MEMO[k]; }
function cadLibNiveau(n){ return (CAD.LIBELLES_NIVEAU&&CAD.LIBELLES_NIVEAU[n])||(n?String(n):''); }
function cadAujourdhui(){ return CAD.dateParis(new Date().toISOString())||new Date().toISOString().slice(0,10); }
// Horaires affichés d'un créneau pour une activité à une date :
// { ouvert, texte ('05:30-13:15', 'fermé', 'Seem 05:30-13:15 · Semrac fermé'), niveau (un seul site), secours (cadence illisible), parSite }
function cadHorairesCreneau(activite,dateIso,creneau){
  var d=cadDonnees();
  if(!d){ var s=CAD_SECOURS[creneau]; return {ouvert:true,texte:s?(CAD.heuresVersHhmm(s.start)+'-'+CAD.heuresVersHhmm(s.end)):'',niveau:null,secours:true,parSite:[]}; }
  var sites=CAD.sitesCadence(activite), par=[], ouvert=false;
  for(var i=0;i<sites.length;i++){ var r=CAD.horairesCreneauSite(d,sites[i],dateIso,creneau); par.push({site:sites[i],niveau:r.niveau,texte:r.horaires?r.horaires.texte:null}); if(r.horaires) ouvert=true; }
  var texte;
  if(par.length===1||par[0].texte===par[1].texte) texte=par[0].texte||'fermé';
  else texte=par.map(function(p){ return p.site+' '+(p.texte||'fermé'); }).join(' · ');
  return {ouvert:ouvert,texte:texte,niveau:par.length===1?par[0].niveau:null,secours:false,parSite:par};
}
// Après un changement de cadence ou de modèles : chaque vue qui dépend des horaires se redessine.
function cadNotifierChangement(){
  CAD_MEMO={};
  try{ if(typeof presBuild==='function') presBuild(); }catch(e){}
  // Lot G · G5 : le planning BDT suit la cadence (axe du jour, heures grisées, chemin critique en heures ouvrées) → tout redessiner.
  try{ if(typeof buildAll==='function') buildAll(); else { if(typeof buildOperatorsByShift==='function') buildOperatorsByShift(); if(typeof buildGantt==='function') buildGantt(); } }catch(e){}
  try{ if(typeof cadRenderVolet==='function') cadRenderVolet(); }catch(e){}
}
</script>`
}

export function voletCadenceBouton(): string {
  return `<button id="volbtn-cad" onclick="volShow('cad')" style="padding:8px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-business-time" style="margin-right:6px;color:#0d9488;"></i>Cadence usine</button>`
}

export function voletCadenceHTML(): string {
  return `
    <!-- VOLET « Cadence usine » (lot G, 16/09/2026) : cadence par site + modèles d'horaires Bas / Moyen / Haut -->
    <div id="vol-cad" style="display:none;">
      <style>
        .cad-card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;}
        .cad-pill{padding:6px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:700;}
        .cad-pill.active{background:#0d9488;border-color:#0d9488;color:white;}
        .cad-tab th{font-size:.64rem;font-weight:800;text-transform:uppercase;color:#6b7280;padding:8px 6px;text-align:center;background:#f8fafc;border-bottom:2px solid #f1f5f9;}
        .cad-tab td{padding:5px 6px;border-bottom:1px solid #f1f5f9;text-align:center;vertical-align:middle;}
        .cad-cell{display:inline-flex;align-items:center;gap:3px;padding:3px 4px;border-radius:7px;border:1px solid transparent;}
        .cad-cell.mod{background:#fef3c7;border-color:#f59e0b;}
        .cad-cell.ferme input{background:#f1f5f9;color:#94a3b8;}
        .cad-cell input[type=time]{width:74px;border:1px solid #e2e8f0;border-radius:6px;padding:3px 2px;font-size:.72rem;}
        .cad-x{border:none;background:none;color:#94a3b8;cursor:pointer;font-size:.72rem;padding:2px 3px;}
        .cad-x:hover{color:#dc2626;}
      </style>
      <div id="cadBandeau"></div>
      <div id="cadSites" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;margin-bottom:18px;"></div>
      <div class="cad-card" style="margin-bottom:18px;overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-weight:700;color:#1e293b;font-size:.88rem;"><i class="fas fa-table-cells" style="color:#0d9488;margin-right:7px;"></i>Modèles d'horaires</span>
          <span id="cadNiveauxPills" style="display:inline-flex;gap:6px;"></span>
          <span id="cadNiveauSites" style="font-size:.72rem;color:#64748b;"></span>
          <span style="flex:1;"></span>
          <button type="button" id="cadAnnuler" class="cad-pill" style="display:none;"><i class="fas fa-rotate-left" style="margin-right:5px;"></i>Annuler les modifications</button>
          <button type="button" id="cadEnregistrer" style="display:none;padding:7px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-save" style="margin-right:6px;"></i><span id="cadEnregistrerTxt">Enregistrer</span></button>
        </div>
        <div style="overflow-x:auto;"><div id="cadModeles"></div></div>
        <div style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:.7rem;color:#64748b;line-height:1.6;">
          <i class="fas fa-info-circle" style="color:#0d9488;margin-right:5px;"></i>Heures au format HH:MM ; une case vide (croix) = créneau <strong>fermé</strong> ce jour-là. Une fin plus tôt que le début = créneau qui finit le <strong>lendemain</strong> (Soirée 21:00 → 05:30), rattaché au jour où il commence. La Journée a deux parties (avant / après la pause). Le <strong>dimanche</strong> est toujours fermé. Les modèles s'appliquent à tous les sites qui sont dans cette cadence ; présence, planning d'affectation et RH lisent les horaires du site et du jour.
        </div>
      </div>
      <div class="cad-card" style="overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;"><i class="fas fa-clock-rotate-left" style="color:#0d9488;margin-right:7px;"></i>Historique des changements de cadence</div>
        <div style="overflow-x:auto;"><div id="cadHist"></div></div>
      </div>
    </div><!-- /vol-cad -->`
}

export function scriptVoletCadence(): string {
  return `<script>
// ─── Volet « Cadence usine » (lot G) ───
var CAD_CRENEAUX_COLS=[['matin',1,'Matin'],['apmidi',1,'Après-midi'],['soir',1,'Soirée'],['journee',1,'Journée (1)'],['journee',2,'Journée (2, après pause)']];
var CAD_NIV_COUL={bas:['#e0f2fe','#0369a1'],moyen:['#fef3c7','#b45309'],haut:['#dcfce7','#15803d']};
var cadNiveauEdite=null, cadEnvoiEnCours=false;
function cadEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function cadNiveauCourant(site){ var d=cadDonnees(); return d?CAD.niveauDuSite(d.cadences,site):null; }
function cadLigneCourante(site){ var d=cadDonnees(); return d?CAD.ligneCadenceDuSite(d.cadences,site):null; }
// Niveau d un site à une date (date d effet d un changement) et changements prévus (date d effet future).
function cadNiveauA(site,dateIso){ var d=cadDonnees(); return d?CAD.niveauDuSite(d.cadences,site,dateIso):null; }
function cadPrevus(site){ var d=cadDonnees(); return d?CAD.changementsPrevusCadence(d.cadences,site):[]; }
function cadFmtJour(iso){ return iso?String(iso).slice(8,10)+'/'+String(iso).slice(5,7)+'/'+String(iso).slice(0,4):''; }
function cadFmtDateHeure(ts){ try{ return new Date(ts).toLocaleString('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return String(ts||''); } }
function cadBadgeNiveau(n,grand){ var c=CAD_NIV_COUL[n]||['#f1f5f9','#475569']; return '<span style="display:inline-block;background:'+c[0]+';color:'+c[1]+';border-radius:8px;padding:'+(grand?'4px 14px':'1px 8px')+';font-size:'+(grand?'1rem':'.7rem')+';font-weight:800;">'+cadEsc(cadLibNiveau(n)||'—')+'</span>'; }
// Semaine en cours : plage ouverte de chaque jour pour un niveau.
function cadSemaineType(niveau){
  var d=cadDonnees(); if(!d) return '';
  var auj=cadAujourdhui(), js=CAD.jourSemaineIso(auj), lundi=CAD.isoPlusJours(auj,1-js), h='';
  for(var i=0;i<7;i++){ var dt=CAD.isoPlusJours(lundi,i), p=CAD.plageOuverteDuJour(d.modeles,niveau,dt);
    h+='<div style="flex:1;min-width:44px;text-align:center;padding:4px 2px;border-radius:6px;background:'+(p?'#f0fdfa':'#f8fafc')+';border:1px solid '+(p?'#99f6e4':'#e2e8f0')+';"><div style="font-size:.58rem;font-weight:800;color:#64748b;text-transform:uppercase;">'+CAD.JOURS[i+1].slice(0,3)+'</div><div style="font-size:.6rem;font-weight:700;color:'+(p?'#0f766e':'#94a3b8')+';line-height:1.25;">'+(p?(CAD.heuresVersHhmm(p.debut)+'<br>'+CAD.heuresVersHhmm(p.fin)+(p.fin>24?' +1j':'')):'fermé')+'</div></div>'; }
  return '<div style="display:flex;gap:4px;margin-top:10px;">'+h+'</div>';
}
function cadRenderBandeau(){
  var el=document.getElementById('cadBandeau'); if(!el) return;
  if(CADENCE_PAGE&&CADENCE_PAGE.disponible){ el.innerHTML=''; return; }
  var abs=CADENCE_PAGE&&CADENCE_PAGE.absente;
  el.innerHTML='<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:.8rem;color:#92400e;display:flex;gap:10px;align-items:flex-start;"><i class="fas fa-triangle-exclamation" style="margin-top:2px;"></i><div style="flex:1;">'+cadEsc((CADENCE_PAGE&&CADENCE_PAGE.avertissement)||'Cadence usine indisponible.')+'</div>'+(abs?'':'<button type="button" data-cad-action="relire" class="cad-pill"><i class="fas fa-rotate-right" style="margin-right:5px;"></i>Relire</button>')+'</div>';
}
function cadRenderSites(){
  var el=document.getElementById('cadSites'); if(!el) return;
  if(!cadDonnees()){ el.innerHTML=''; return; }
  el.innerHTML=['Seem','Semrac'].map(function(site){
    var l=cadLigneCourante(site), n=l?l.niveau:null, col=site==='Seem'?'#3b82f6':'#ec4899';
    return '<div class="cad-card" style="padding:16px 18px;border-top:3px solid '+col+';">'
      +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-weight:900;color:#1e293b;font-size:1rem;">'+site+'</span>'+cadBadgeNiveau(n||CAD.NIVEAU_DEFAUT,true)
      +'<span style="flex:1;"></span><button type="button" data-cad-action="changer" data-cad-site="'+site+'" style="padding:7px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;cursor:pointer;font-size:.76rem;font-weight:700;"><i class="fas fa-sliders" style="margin-right:6px;"></i>Changer la cadence</button></div>'
      +'<div style="font-size:.7rem;color:#64748b;margin-top:6px;">'+(l?('En vigueur depuis le '+cadEsc(cadFmtJour(CAD.jourEffetCadence(l)))+' (décidé le '+cadEsc(cadFmtDateHeure(l.depuis))+(l.par?' par '+cadEsc(l.par):'')+')'+(l.motif?' · '+cadEsc(l.motif):'')):'Aucune cadence enregistrée : Moyen par défaut.')+'</div>'
      +cadPrevus(site).map(function(p){ return '<div data-cad-prevu="'+site+'" style="margin-top:6px;font-size:.72rem;color:#0f766e;background:#f0fdfa;border:1px dashed #5eead4;border-radius:8px;padding:4px 8px;"><i class="fas fa-calendar-day" style="margin-right:5px;"></i>Changement prévu : '+cadBadgeNiveau(p.ligne.niveau,false)+' à partir du '+cadEsc(CAD.dateLongue(p.effet))+(p.ligne.par?' · par '+cadEsc(p.ligne.par):'')+(p.ligne.motif?' · '+cadEsc(p.ligne.motif):'')+'</div>'; }).join('')
      +cadSemaineType(n||CAD.NIVEAU_DEFAUT)+'</div>';
  }).join('');
}
function cadRenderHist(){
  var el=document.getElementById('cadHist'); if(!el) return;
  var d=cadDonnees(); if(!d){ el.innerHTML=''; return; }
  var auj=cadAujourdhui();
  var lignes=(d.cadences||[]).slice().sort(function(a,b){ return Date.parse(b.depuis)-Date.parse(a.depuis); }).slice(0,40);
  if(!lignes.length){ el.innerHTML='<div style="padding:18px;text-align:center;color:#94a3b8;font-size:.78rem;">Aucun changement enregistré.</div>'; return; }
  el.innerHTML='<table class="cad-tab" style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr><th style="text-align:left;">À partir du</th><th style="text-align:left;">Décidé le</th><th>Site</th><th>Cadence</th><th style="text-align:left;">Par</th><th style="text-align:left;">Motif</th></tr></thead><tbody>'
    +lignes.map(function(l){ var je=CAD.jourEffetCadence(l); return '<tr><td style="text-align:left;white-space:nowrap;font-weight:700;">'+cadEsc(cadFmtJour(je))+(je&&je>auj?' <span style="font-size:.62rem;color:#0f766e;font-weight:800;">prévu</span>':'')+'</td><td style="text-align:left;white-space:nowrap;color:#64748b;">'+cadEsc(cadFmtDateHeure(l.depuis))+'</td><td>'+cadEsc(l.site)+'</td><td>'+cadBadgeNiveau(l.niveau,false)+'</td><td style="text-align:left;">'+cadEsc(l.par||'—')+'</td><td style="text-align:left;color:#64748b;">'+cadEsc(l.motif||'')+'</td></tr>'; }).join('')+'</tbody></table>';
}
function cadLigneModele(niveau,j,c,p){ var d=cadDonnees(); if(!d) return null; var ms=d.modeles||[]; for(var i=0;i<ms.length;i++){ var m=ms[i]; if(m.niveau===niveau&&Number(m.jour_semaine)===j&&m.creneau===c&&Number(m.partie)===p) return m; } return null; }
// opts.reinitialiser : abandonner les cases modifiées (bouton « Annuler les modifications », changement de niveau confirmé).
// Sinon (revue du 16/09/2026) les saisies NON enregistrées du niveau affiché survivent au redessin — retour sur le volet,
// relecture après un changement de cadence ou un enregistrement : une case est réappliquée si la base n a pas bougé, ignorée
// si la base porte déjà la valeur saisie, et signalée si quelqu un d autre l a modifiée entre-temps.
function cadRenderModeles(opts){
  opts=opts||{};
  var el=document.getElementById('cadModeles'), pills=document.getElementById('cadNiveauxPills'), sitesEl=document.getElementById('cadNiveauSites');
  if(!el) return;
  var saisies=[];
  if(!opts.reinitialiser&&el.getAttribute('data-cad-niveau')&&el.getAttribute('data-cad-niveau')===cadNiveauEdite){
    cadCellules().forEach(function(cell){ if(!cadCelluleModifiee(cell)) return; var v=cadValeurs(cell); saisies.push({j:cell.getAttribute('data-cad-j'),c:cell.getAttribute('data-cad-c'),p:cell.getAttribute('data-cad-p'),d:v.d,f:v.f,od:cell.getAttribute('data-cad-orig-d')||'',of:cell.getAttribute('data-cad-orig-f')||''}); });
  }
  if(!cadDonnees()){ el.innerHTML=''; el.removeAttribute('data-cad-niveau'); if(pills) pills.innerHTML=''; if(sitesEl) sitesEl.textContent=''; cadMajBoutons(); return; }
  if(!cadNiveauEdite) cadNiveauEdite=cadNiveauCourant('Seem')||CAD.NIVEAU_DEFAUT;
  if(pills) pills.innerHTML=CAD.NIVEAUX.map(function(n){ return '<button type="button" class="cad-pill'+(n===cadNiveauEdite?' active':'')+'" data-cad-action="niveau" data-cad-niveau="'+n+'">'+cadLibNiveau(n)+'</button>'; }).join('');
  if(sitesEl){ var ss=['Seem','Semrac'].filter(function(s){ return (cadNiveauCourant(s)||CAD.NIVEAU_DEFAUT)===cadNiveauEdite; }); sitesEl.textContent=ss.length?('Cadence actuelle de : '+ss.join(', ')):'Aucun site dans cette cadence actuellement'; }
  var h='<table class="cad-tab" style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:left;padding-left:14px;">Jour</th>';
  CAD_CRENEAUX_COLS.forEach(function(col){ h+='<th>'+col[2]+'</th>'; });
  h+='</tr></thead><tbody>';
  for(var j=1;j<=7;j++){
    h+='<tr><td style="text-align:left;padding-left:14px;font-weight:700;color:#1e293b;font-size:.78rem;white-space:nowrap;">'+CAD.JOURS[j]+'</td>';
    if(j===7){ h+='<td colspan="5" style="color:#94a3b8;font-size:.74rem;font-style:italic;">Fermé (toujours)</td></tr>'; continue; }
    CAD_CRENEAUX_COLS.forEach(function(col){
      var m=cadLigneModele(cadNiveauEdite,j,col[0],col[1]), ouvert=!!m&&m.actif!==false;
      var d0=ouvert?cadEsc(m.debut):'', f0=ouvert?cadEsc(m.fin):'';
      var at=' data-cad-j="'+j+'" data-cad-c="'+col[0]+'" data-cad-p="'+col[1]+'"';
      h+='<td><span class="cad-cell'+(ouvert?'':' ferme')+'"'+at+' data-cad-orig-d="'+d0+'" data-cad-orig-f="'+f0+'">'
        +'<input type="time" step="300" data-cad-b="d" value="'+d0+'" aria-label="'+CAD.JOURS[j]+' '+col[2]+' début"/>'
        +'<span style="color:#cbd5e1;">→</span>'
        +'<input type="time" step="300" data-cad-b="f" value="'+f0+'" aria-label="'+CAD.JOURS[j]+' '+col[2]+' fin"/>'
        +'<button type="button" class="cad-x" data-cad-action="vider" title="Fermer ce créneau ce jour-là">×</button>'
        +'<span data-cad-lendemain style="font-size:.58rem;color:#7c3aed;font-weight:700;min-width:18px;">'+(ouvert&&m.fin<m.debut?'+1j':'')+'</span>'
        +'</span></td>';
    });
    h+='</tr>';
  }
  h+='</tbody></table>';
  el.innerHTML=h;
  el.setAttribute('data-cad-niveau',cadNiveauEdite);
  var ecrasees=[];
  saisies.forEach(function(x){
    var cell=el.querySelector('.cad-cell[data-cad-j="'+x.j+'"][data-cad-c="'+x.c+'"][data-cad-p="'+x.p+'"]'); if(!cell) return;
    var nd=cell.getAttribute('data-cad-orig-d')||'', nf=cell.getAttribute('data-cad-orig-f')||'';
    if(nd===x.d&&nf===x.f) return;
    if(nd!==x.od||nf!==x.of){ ecrasees.push(CAD.JOURS[Number(x.j)]+' · '+((CAD_CRENEAUX_COLS.filter(function(k){ return k[0]===x.c&&String(k[1])===String(x.p); })[0]||['','',x.c])[2])); return; }
    var ins=cell.querySelectorAll('input'); ins[0].value=x.d; ins[1].value=x.f; cadMajCellule(cell);
  });
  if(ecrasees.length&&typeof pushNotif==='function') pushNotif('warn','fa-triangle-exclamation','Modifiées entre-temps par quelqu’un d’autre, vos saisies non enregistrées sont abandonnées : '+cadEsc(ecrasees.join(', '))+'.',9000);
  cadMajBoutons();
}
function cadCellules(){ return Array.prototype.slice.call(document.querySelectorAll('#cadModeles .cad-cell')); }
function cadValeurs(cell){ var i=cell.querySelectorAll('input'); return {d:String(i[0].value||''),f:String(i[1].value||'')}; }
function cadCelluleModifiee(cell){ var v=cadValeurs(cell); return v.d!==(cell.getAttribute('data-cad-orig-d')||'')||v.f!==(cell.getAttribute('data-cad-orig-f')||''); }
function cadMajCellule(cell){
  var v=cadValeurs(cell);
  cell.classList.toggle('mod',cadCelluleModifiee(cell));
  cell.classList.toggle('ferme',!v.d&&!v.f);
  var lend=cell.querySelector('[data-cad-lendemain]'); if(lend) lend.textContent=(v.d&&v.f&&v.f<v.d)?'+1j':'';
}
function cadMajBoutons(){
  var n=cadCellules().filter(cadCelluleModifiee).length;
  var b=document.getElementById('cadEnregistrer'), a=document.getElementById('cadAnnuler'), t=document.getElementById('cadEnregistrerTxt');
  if(b) b.style.display=n?'':'none'; if(a) a.style.display=n?'':'none';
  if(t) t.textContent='Enregistrer les modèles '+cadLibNiveau(cadNiveauEdite)+' ('+n+' case'+(n>1?'s':'')+')';
}
function cadRenderVolet(){ cadRenderBandeau(); cadRenderSites(); cadRenderModeles(); cadRenderHist(); }
function cadRecharger(){
  return fetch('/api/production/cadence',{headers:{'Accept':'application/json'}})
    .then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; },function(){ return {r:r,j:null}; }); })
    .then(function(x){
      if(x.j&&x.j.ok&&x.j.disponible&&x.j.donnees){ CADENCE_PAGE={disponible:true,absente:false,erreur:null,avertissement:null,donnees:x.j.donnees}; }
      else if(x.j&&x.j.ok&&!x.j.disponible){ CADENCE_PAGE={disponible:false,absente:!!x.j.table_absente,erreur:null,avertissement:x.j.avertissement||'Cadence usine indisponible.',donnees:null}; }
      else { pushNotif('err','fa-exclamation-circle','Relecture de la cadence impossible : '+cadEsc((x.j&&x.j.error)||('HTTP '+x.r.status))+'.',8000); return false; }
      cadNotifierChangement(); return true;
    },function(){ pushNotif('err','fa-exclamation-circle','Relecture de la cadence impossible : erreur réseau.',8000); return false; });
}
function cadFermerModal(){ var m=document.getElementById('cadModal'); if(m&&m.parentNode) m.parentNode.removeChild(m); }
// Date d effet (revue du 16/09/2026) : par défaut le LENDEMAIN ; aujourd hui ou avant = toute la journée recalculée (heures déjà
// travaillées comprises) → confirmation. Le niveau désactivé et niveau_lu sont ceux EN VIGUEUR à la date d effet choisie.
function cadEffetChoisi(){ var i=document.getElementById('cadEffet'); var v=i?String(i.value||''):''; return CAD.estDateIso(v)?v:CAD.isoPlusJours(cadAujourdhui(),1); }
function cadMajModalEffet(site){
  var eff=cadEffetChoisi(), auj=cadAujourdhui(), n=cadNiveauA(site,eff);
  var lu=document.getElementById('cadNivLu'); if(lu) lu.innerHTML='Cadence de '+site+' le '+cadEsc(CAD.dateLongue(eff))+' : '+cadBadgeNiveau(n||CAD.NIVEAU_DEFAUT,false);
  var av=document.getElementById('cadEffetAvert'); if(av){ av.style.display=eff<=auj?'':'none'; av.textContent=eff<=auj?('Effet '+(eff===auj?'aujourd’hui':'rétroactif (le '+CAD.dateLongue(eff)+')')+' : toute la journée'+(eff<auj?' et les jours suivants':'')+' passe dans la nouvelle cadence, heures déjà travaillées comprises (présences, RH › Temps, planning). Une confirmation sera demandée.'):''; }
  document.querySelectorAll('#cadModal input[name=cadNiv]').forEach(function(r){ var dis=(r.value===n); r.disabled=dis; if(dis) r.checked=false; var lab=r.closest('label'); if(lab){ lab.style.opacity=dis?'.5':'1'; lab.style.cursor=dis?'not-allowed':'pointer'; } });
  var b=document.getElementById('cadConfirmer'), sel=document.querySelector('#cadModal input[name=cadNiv]:checked');
  if(b){ b.setAttribute('data-cad-lu',n||''); b.disabled=!sel; b.style.opacity=sel?'1':'.5'; b.textContent=sel?('Passer '+site+' en cadence '+cadLibNiveau(sel.value)+' à partir du '+cadFmtJour(eff)):'Confirmer'; }
}
function cadOuvrirChangement(site){
  if(!cadDonnees()) return;
  cadFermerModal();
  var courant=cadNiveauCourant(site), auj=cadAujourdhui(), demain=CAD.isoPlusJours(auj,1);
  var ov=document.createElement('div'); ov.id='cadModal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';
  var h='<div role="dialog" aria-modal="true" style="background:white;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);width:100%;max-width:560px;overflow:hidden;">'
    +'<div style="padding:14px 20px;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;font-weight:800;font-size:.95rem;"><i class="fas fa-sliders" style="margin-right:8px;"></i>Cadence de '+site+'</div>'
    +'<div style="padding:18px 20px;">'
    +'<div style="font-size:.8rem;color:#374151;margin-bottom:10px;">Cadence actuelle : '+cadBadgeNiveau(courant||CAD.NIVEAU_DEFAUT,false)+'. Choisissez la nouvelle cadence et le jour à partir duquel elle s\\'applique (présence, planning, RH).</div>'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;"><label for="cadEffet" style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;">À partir du</label><input type="date" id="cadEffet" value="'+demain+'" min="'+CAD.isoPlusJours(auj,-62)+'" max="'+CAD.isoPlusJours(auj,400)+'" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.35rem .6rem;font-size:.82rem;"/><span id="cadNivLu" style="font-size:.74rem;color:#475569;"></span></div>'
    +'<div id="cadEffetAvert" style="display:none;margin-bottom:10px;font-size:.72rem;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:6px 10px;"></div>'
    +'<div style="display:flex;gap:8px;margin-bottom:12px;">'+CAD.NIVEAUX.map(function(n){ return '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;font-size:.82rem;font-weight:700;"><input type="radio" name="cadNiv" value="'+n+'"/>'+cadLibNiveau(n)+'</label>'; }).join('')+'</div>'
    +'<div id="cadApercu" style="min-height:60px;margin-bottom:12px;font-size:.72rem;color:#94a3b8;">Choisissez un niveau pour voir la semaine type.</div>'
    +'<label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Motif (facultatif)</label>'
    +'<textarea id="cadMotif" rows="2" maxlength="500" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .7rem;font-size:.82rem;" placeholder="Ex. : pic de charge, baisse d\\'activité…"></textarea>'
    +'</div>'
    +'<div style="padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">'
    +'<button type="button" data-cad-action="modal-annuler" style="padding:9px 16px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:.82rem;">Annuler</button>'
    +'<button type="button" id="cadConfirmer" data-cad-action="modal-confirmer" data-cad-site="'+site+'" data-cad-lu="" disabled style="padding:9px 18px;background:#0d9488;color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:.82rem;opacity:.5;">Confirmer</button>'
    +'</div></div>';
  ov.innerHTML=h;
  document.body.appendChild(ov);
  ov.addEventListener('mousedown',function(e){ if(e.target===ov) cadFermerModal(); });
  ov.addEventListener('change',function(e){
    var t=e.target; if(!t) return;
    if(t.id==='cadEffet'){ cadMajModalEffet(site); return; }
    if(t.name!=='cadNiv') return;
    var ap=document.getElementById('cadApercu'); if(ap) ap.innerHTML='<div style="font-weight:700;color:#0f766e;">Semaine type en cadence '+cadLibNiveau(t.value)+' :</div>'+cadSemaineType(t.value);
    cadMajModalEffet(site);
  });
  cadMajModalEffet(site);
  ov.addEventListener('click',function(e){
    var b=(e.target&&e.target.closest)?e.target.closest('[data-cad-action]'):null; if(!b) return;
    var act=b.getAttribute('data-cad-action');
    if(act==='modal-annuler') cadFermerModal();
    else if(act==='modal-confirmer') cadConfirmerChangement(b.getAttribute('data-cad-site'),b.getAttribute('data-cad-lu')||null);
  });
}
function cadConfirmerChangement(site,niveauLu,confirme){
  if(cadEnvoiEnCours) return;
  var sel=document.querySelector('#cadModal input[name=cadNiv]:checked'); if(!sel) return;
  var motif=(document.getElementById('cadMotif')||{}).value||'';
  var eff=cadEffetChoisi(), auj=cadAujourdhui();
  if(eff<=auj&&!confirme){
    appConfirm('Passer '+site+' en cadence '+cadLibNiveau(sel.value)+' à partir du '+CAD.dateLongue(eff)+' ?\\n\\nLa journée '+(eff===auj?'d’aujourd’hui':'du '+CAD.dateLongue(eff)+' et les suivantes')+' passe entièrement dans la nouvelle cadence, heures déjà travaillées comprises : présences (créneaux fermés), RH › Temps et planning sont recalculés.',{title:'Cadence avec effet '+(eff===auj?'immédiat':'rétroactif'),okLabel:'Appliquer quand même',icon:'fa-triangle-exclamation',danger:true})
      .then(function(oui){ if(oui) cadConfirmerChangement(site,niveauLu,true); });
    return;
  }
  cadEnvoiEnCours=true;
  var b=document.getElementById('cadConfirmer'); if(b){ b.disabled=true; b.style.opacity='.6'; }
  fetch('/api/production/cadence/site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site:site,niveau:sel.value,niveau_lu:niveauLu,effet:eff,confirme_retroactif:!!confirme,motif:motif})})
    .then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; },function(){ return {r:r,j:null}; }); })
    .then(function(x){
      cadEnvoiEnCours=false;
      if(x.r.ok&&x.j&&x.j.ok){ cadFermerModal(); pushNotif('ok','fa-business-time',cadEsc(site)+' passe en cadence <strong>'+cadEsc(cadLibNiveau(sel.value))+'</strong> à partir du '+cadEsc(CAD.dateLongue((x.j&&x.j.effet)||eff))+'.',6000); cadRecharger(); return; }
      if(b){ b.disabled=false; b.style.opacity='1'; }
      if(x.r.status===409&&x.j&&x.j.confirmation_requise&&!confirme){ appConfirm(String(x.j.error||'Effet immédiat ou rétroactif : confirmer ?'),{title:'Cadence avec effet immédiat',okLabel:'Appliquer quand même',icon:'fa-triangle-exclamation',danger:true}).then(function(oui){ if(oui) cadConfirmerChangement(site,niveauLu,true); }); return; }
      pushNotif('err','fa-ban',cadEsc((x.j&&x.j.error)||('HTTP '+x.r.status))+(x.r.status===403?' (écriture Production requise)':''),9000);
      if(x.r.status===409) cadRecharger();
    },function(){ cadEnvoiEnCours=false; if(b){ b.disabled=false; b.style.opacity='1'; } pushNotif('err','fa-exclamation-circle','Erreur réseau : cadence non modifiée.',8000); });
}
function cadEnregistrerModeles(){
  if(cadEnvoiEnCours) return;
  var cellules=[], err=null;
  cadCellules().filter(cadCelluleModifiee).forEach(function(cell){
    if(err) return;
    var j=Number(cell.getAttribute('data-cad-j')), c=cell.getAttribute('data-cad-c'), p=Number(cell.getAttribute('data-cad-p')), v=cadValeurs(cell);
    var nom=CAD.JOURS[j]+' · '+(CAD_CRENEAUX_COLS.filter(function(x){ return x[0]===c&&x[1]===p; })[0]||['','',''])[2];
    if((v.d&&!v.f)||(!v.d&&v.f)){ err=nom+' : saisissez le début ET la fin, ou videz la case (fermé).'; return; }
    if(v.d&&v.d===v.f){ err=nom+' : le début et la fin sont identiques.'; return; }
    if(j===6&&v.d&&v.f&&v.f<v.d){ err=nom+' : un créneau du samedi ne peut pas finir le lendemain (le dimanche est toujours fermé).'; return; }
    var m=cadLigneModele(cadNiveauEdite,j,c,p);
    cellules.push({jour_semaine:j,creneau:c,partie:p,ferme:!v.d,debut:v.d||null,fin:v.f||null,maj_le_lu:m?(m.maj_le||null):null});
  });
  if(err){ pushNotif('err','fa-ban',cadEsc(err),7000); return; }
  if(!cellules.length) return;
  cadEnvoiEnCours=true;
  var b=document.getElementById('cadEnregistrer'); if(b){ b.disabled=true; b.style.opacity='.6'; }
  fetch('/api/production/cadence/modeles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({niveau:cadNiveauEdite,cellules:cellules})})
    .then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; },function(){ return {r:r,j:null}; }); })
    .then(function(x){
      cadEnvoiEnCours=false; if(b){ b.disabled=false; b.style.opacity='1'; }
      if(x.r.ok&&x.j&&x.j.ok){ pushNotif('ok','fa-save','Modèles '+cadEsc(cadLibNiveau(cadNiveauEdite))+' enregistrés ('+(x.j.modifiees||0)+' case'+((x.j.modifiees||0)>1?'s':'')+').',5000); cadRecharger(); return; }
      pushNotif('err','fa-ban',cadEsc((x.j&&x.j.error)||('HTTP '+x.r.status))+(x.r.status===403?' (écriture Production requise)':''),10000);
      if(x.j&&x.j.partiel) cadRecharger();
    },function(){ cadEnvoiEnCours=false; if(b){ b.disabled=false; b.style.opacity='1'; } pushNotif('err','fa-exclamation-circle','Erreur réseau : modèles non enregistrés.',8000); });
}
(function(){
  function brancher(){
    var v=document.getElementById('vol-cad'); if(!v||v.getAttribute('data-cad-deleg')) return;
    v.setAttribute('data-cad-deleg','1');
    v.addEventListener('click',function(e){
      var b=(e.target&&e.target.closest)?e.target.closest('[data-cad-action]'):null;
      if(b){
        var act=b.getAttribute('data-cad-action');
        if(act==='changer') cadOuvrirChangement(b.getAttribute('data-cad-site'));
        else if(act==='relire') cadRecharger();
        else if(act==='niveau'){
          var n=b.getAttribute('data-cad-niveau'); if(n===cadNiveauEdite) return;
          if(cadCellules().some(cadCelluleModifiee)){ appConfirm('Des cases modifiées ne sont pas enregistrées : les abandonner ?').then(function(okA){ if(okA){ cadNiveauEdite=n; cadRenderModeles({reinitialiser:true}); } }); return; }
          cadNiveauEdite=n; cadRenderModeles({reinitialiser:true});
        }
        else if(act==='vider'){ var cell=b.closest('.cad-cell'); if(cell){ cell.querySelectorAll('input').forEach(function(i){ i.value=''; }); cadMajCellule(cell); cadMajBoutons(); } }
        return;
      }
      if(e.target&&e.target.id==='cadEnregistrer'||(e.target&&e.target.closest&&e.target.closest('#cadEnregistrer'))) cadEnregistrerModeles();
      else if(e.target&&e.target.closest&&e.target.closest('#cadAnnuler')) cadRenderModeles({reinitialiser:true});
    });
    v.addEventListener('input',function(e){ var cell=(e.target&&e.target.closest)?e.target.closest('.cad-cell'):null; if(cell){ cadMajCellule(cell); cadMajBoutons(); } });
    cadRenderVolet();
    try{ if(new URLSearchParams(location.search).get('vol')==='cad'&&typeof volShow==='function') volShow('cad'); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',brancher); else brancher();
})();
</script>`
}
