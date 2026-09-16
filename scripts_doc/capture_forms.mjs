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
  //   Nouvelle nomenclature + 2 étapes D'EXEMPLE posées dans le navigateur seulement (rien n'est enregistré) :
  //   un process MACHINE avec taux (0,5 h ROP · 1 h RGM · 0,1 h MO/pc · 0,2 h machine/pc — l'exemple du manuel)
  //   et un process MANUEL, pour montrer les indications « Machine · X €/h » / « Manuel · coût chargé RH » (14/09/2026).
  { file: 'form-be-nomenclature',      path: '/be/service', inline: true, wait: 1100,
    fn: "(function(){nomNewStandard();var L=(BE_REFS_JS.process_atelier||[]).filter(function(p){return p.activite==='Seem'||p.activite==='both';});"
      + "var pm=L.filter(function(p){return p.type==='machine'&&p.taux_source==='process'&&!/oxyd|surtec|sox|lavage|anodis/i.test(String(p.nom||''));})[0];var ph=L.filter(function(p){return p.type==='manuel';})[0];"
      + "if(pm){nomAddEtape();var i=nomEtapes.length-1;nomOnEtapeProcessChange(i,pm.id);var e=nomEtapes[i];e.temps_reglage_min=30;e.temps_reglage_machine_min=60;e.temps_mo_min=6;e.temps_machine_min=12;}"
      + "if(ph){nomAddEtape();var j=nomEtapes.length-1;nomOnEtapeProcessChange(j,ph.id);nomEtapes[j].temps_mo_min=3;}"
      + "nomRenderEtapes();if(typeof nomCalcTotaux==='function') nomCalcTotaux();})()" },
  // Achats
  //   BC direct : case « Certificat matière requis » cochée DANS LE NAVIGATEUR (lot D, 14/09/2026) — rien n'est envoyé.
  { file: 'form-achats-bc',            path: '/achats/service', fn: "(function(){achNewBC();var c=document.getElementById('bcw_certificat');if(c) c.checked=true;})()" },
  // Fenetre « Traiter la DA -> BC » : celle qui porte la reference du materiel. Necessite une DA a traiter.
  //   Case « Certificat matière requis » cochée dans le navigateur seulement (lot D).
  { file: 'form-achats-da-bc',         path: '/achats/service', wait: 900, fn: "(function(){achOpenBC((ACH_DA[0]||{}).id);var c=document.getElementById('bc_certificat');if(c) c.checked=true;})()" },
  // Fenetre « Date d'arrivee » d'un bon de commande (onglet Bons de commande). Necessite un BC en base.
  { file: 'form-achats-bc-date',       path: '/achats/service', tabClick: '#ach-tab-bc', fn: "achOpenBcDate((ACH_BCS[0]||{}).id)", wait: 700 },
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
  //   Lot F : décision sur un lot reçu qui couvre PLUSIEURS lignes du BC (certificat matière absent) — « Dérogation » cochée
  //   dans le navigateur pour montrer le bloc « Part acceptée par ligne ». Nécessite une telle quarantaine en cours. Rien n'est envoyé.
  { file: 'form-qualite-decision-fournisseur', path: '/qualite/service', tabClick: '#qual-tab-quarantaine', wait: 900,
    fn: "(function(){var q=(window.QUAR_DATA||[]).filter(function(x){return x.statut==='en_cours'&&x.reception&&(x.reception.lignes||[]).length>1;})[0];if(!q) throw new Error('aucune quarantaine de réception sur plusieurs lignes');"
      + "qfOpen(q.id);var r=document.querySelector('input[name=qf_dec][value=derogation]');if(r){r.checked=true;qfMaj();}})()" },
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
  // Lot F : la fenêtre « Ajouter article » n'existe plus — une référence naît au rangement (Rangement / Mise en stock).
  { file: 'form-stock-rangement',     path: '/stock/service', fn: "(function(){ if(!STK_FILE.length) throw new Error('aucune ligne à ranger'); stkOuvrirRangement(STK_FILE[0].id); })()", wait: 700 },
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
  // Production — #splitModal vit dans le panneau PLANNING (#ptab-gantt-bdt) et ne s'ouvre QUE par
  //   les ciseaux d'une carte de la goulotte (plus de clic droit sur le planning). On clique les
  //   ciseaux d'une carte (de préférence un BDT qui a une durée). Goulotte vide : on injecte une
  //   carte d'exemple DANS LE NAVIGATEUR (variable JS locale à la page) — AUCUNE écriture en base.
  //   Un 3e morceau de 1,5 h est ajouté à l'écran pour illustrer le temps libre (rien n'est envoyé).
  { file: 'form-production-separer',  path: '/production/service', tabClick: '#ptab-gantt-bdt', wait: 2200,
    fn: "(function(){if(typeof BDTS==='undefined') throw new Error('BDTS absent');"
      + "function carte(){var cs=[].slice.call(document.querySelectorAll('#pendingList .pending-card'));"
      + "return cs.filter(function(c){var b=BDTS.find(function(x){return String(x.id)===c.getAttribute('data-bdtid');});return b&&Number(b.duree||0)>0;})[0]||cs[0]||null;}"
      + "var c=carte();"
      + "if(!c){BDTS.push({id:'BDT-2026-0001-01-01',client:'Client exemple',piece:'Bride alu 7075',operation:'Usinage CN',duree:12,tempsAlloue:12,statut:'a_programmer',process:'pending',datePrevue:null,activite:'Seem',lotId:'LOT-2026-0001-01',numAffaire:'2026-0001',seq:1});buildPending();c=carte();}"
      + "var btn=c&&c.querySelector('button[onclick*=\"splitBdt(\"]');if(!btn) throw new Error('ciseaux introuvables');"
      + "btn.click();setTimeout(function(){if(_splitBdt&&!_splitBdt.loading){splitAdd();_splitBdt.vals[_splitBdt.vals.length-1]='1.5';splitRender();}},1200);})()" },   // lot C : on attend la lecture du réglage (GET /temps) avant d'ajouter le 3e morceau
  // Production — coût horaire porté par le PROCESS (14/09/2026). Les trois modales vivent dans le panneau
  //   « Process Ateliers » (#ppanel-machines) : tabClick OBLIGATOIRE. Aucune écriture : on ouvre, on capture.
  { file: 'form-production-process',  path: '/production/service', tabClick: '#ptab-machines', fn: "openProcModal()", wait: 700 },
  //   Modifier le process : de préférence un process MACHINE qui porte un taux et n'est pas un traitement de surface (5 process
  //   OAS de la base ont est_oas=false : on les écarte par leur nom), sinon le premier process machine, sinon le premier.
  { file: 'form-production-process-edit', path: '/production/service', tabClick: '#ptab-machines', wait: 800,
    fn: "(function(){var L=(typeof PROCESS!=='undefined'?PROCESS:[]);var nonOas=function(x){return !/oxyd|surtec|sox|lavage|anodis/i.test(String(x.nom||''));};var p=L.filter(function(x){return x.type==='machine'&&x.taux_source==='process'&&nonOas(x);})[0]||L.filter(function(x){return x.type==='machine';})[0]||L[0];if(!p) throw new Error('aucun process');openProcEdit(p.id);})()" },
  //   Nouvelle machine, case « Créer aussi un nouveau process » cochée : champ « Taux horaire machine du nouveau process ».
  { file: 'form-production-machine',  path: '/production/service', tabClick: '#ptab-machines', wait: 700,
    fn: "(function(){openMachineModal();var c=document.getElementById('mc_proc_new');if(c&&!c.checked){c.checked=true;}if(typeof mcProcNewChange==='function') mcProcNewChange();})()" },
  // Production — boutons « Demande d'achat » et « PV de non-conformité » du bandeau (15/09/2026, src/prod_da_nc.ts).
  //   Fenêtres rangées HORS des panneaux (ouvrables depuis tout onglet), formulaire complet dès le clic.
  //   Remplissage d'illustration DANS LE NAVIGATEUR seulement : ni matricule ni PIN, rien n'est envoyé.
  //   DA : nature « Machine (OPEX) » pour montrer la liste des machines (le poste suit la machine).
  { file: 'form-production-da',       path: '/production/service', wait: 700,
    fn: "(function(){odaOpen();var r=document.querySelector('input[name=oda_categorie][value=machine]');if(r){r.checked=true;odaCategorie();}"
      + "var s=document.getElementById('oda_machine_id');if(s&&s.options.length>1){s.selectedIndex=1;odaMachine();}"
      + "var a=document.getElementById('oda_article');if(a) a.value='Plaquettes carbure';var q=document.getElementById('oda_qte');if(q) q.value='10';})()" },
  //   PV de NC : entité, première affaire de la liste puis premier BDT (le lot et le code pièce se complètent seuls).
  { file: 'form-production-pvnc',     path: '/production/service', wait: 700,
    fn: "(function(){pvncOpen();var e=document.getElementById('pvnc_entite');if(e) e.value='Seem';"
      + "var a=document.getElementById('pvnc_num_affaire');if(a&&a.options.length>1){a.selectedIndex=1;pvncAffaire();}"
      + "var b=document.getElementById('pvnc_bdt_id');if(b&&b.options.length>1){b.selectedIndex=1;pvncBdt();}})()" },
  //   Soldage : la fenêtre n'accepte qu'un BDT « Reçu ». Un BDT est passé « reçu » DANS LE NAVIGATEUR seulement (aucune
  //   écriture), avec le 1er opérateur comme « Reçu par », pour montrer la ligne « Reçu par » et l'aide « qui peut solder ».
  { file: 'form-production-soldage',  path: '/production/service', tabClick: '#ptab-gantt-bdt', wait: 700,
    fn: "(function(){var b=BDTS.filter(function(x){return Number(x.duree||0)>0;})[0]||BDTS[0];if(!b) throw new Error('aucun BDT');"
      + "b.statut='recu';if(!b.operateurId&&OPERATEURS[0]) b.operateurId=OPERATEURS[0].id;openSoldageModal(b.id);})()" },
  // OAS — clôture avec autocontrôle (≠ création de balancelle)
  { file: 'form-oas-cloture-balancelle', path: '/oas/service', fn: "openCloreBalModal('BAL-DEMO','OAS-2026-1042','LOT-2026-014','Bride alu 7075')", wait: 800 },
  // Expéditions (lot D, 14/09/2026 — tableaux globaux EXP_BC / EXP_PV / EXP_BLREC). Aucune écriture : on ouvre, on remplit
  //   dans le navigateur seulement, on capture. ⚠ form-expeditions-arrivee retirée : sa fenêtre (expOpenArrivee / EXP_PLAN)
  //   n'existe plus depuis le passage de la date d'arrivée aux Achats (form-achats-bc-date).
  //   Réception : BC qui attend encore un reste, « Hors France ? » = Oui pour montrer le bloc douane.
  { file: 'form-expeditions-reception', path: '/expeditions/service', wait: 800,
    fn: "(function(){var b=EXP_BC.filter(function(x){return x.reste>0&&!x.multi_articles;})[0]||EXP_BC[0];if(!b) throw new Error('aucun BC');expOpenReception(b.id);"
      + "document.getElementById('rec_hf_oui').checked=true;expRecHF();})()" },
  //   Correction des informations de réception d'un BL déjà enregistré (bouton « Corriger » de l'onglet Réceptions) :
  //   de préférence une réception hors France (bloc douane rempli). Aucune écriture : on ouvre, on capture.
  { file: 'form-expeditions-reception-correction', path: '/expeditions/service', tabClick: '#exp-tab-receptions', wait: 800,
    fn: "(function(){var bs=Array.prototype.slice.call(document.querySelectorAll('.exp-rec-edit'));var hf=function(el){var r=(typeof EXP_BLREC!=='undefined'&&EXP_BLREC)?EXP_BLREC[el.getAttribute('data-bl')]:null;return r&&r.hors_france===true;};"
      + "var btn=bs.filter(hf)[0]||bs[0];if(!btn) throw new Error('aucun bouton « Corriger »');expOpenCorrectionReception(btn.getAttribute('data-bl'));})()" },
  //   PV conforme (lot F, 15/09/2026) : réception du BC qui a le PLUS de lignes ; tableau des quantités (prévue / reçue) visible
  //   en Conforme ; « Tout reçu comme prévu », puis la DERNIÈRE ligne reçue à moitié avec « Reliquat » coché (un reliquat
  //   annoncé n'est pas un écart). La case certificat n'est cochée que si le BC l'exige vraiment. Rien n'est envoyé.
  { file: 'form-expeditions-pv', path: '/expeditions/service', tabClick: '#exp-tab-receptions', wait: 900,
    fn: "(function(){var bs=Array.prototype.slice.call(document.querySelectorAll('.exp-pv-open'));var bcDe=function(el){return EXP_BC.find(function(x){return x.id===el.getAttribute('data-bc');});};var nb=function(el){var b=bcDe(el);return b&&Array.isArray(b.lignes)?b.lignes.length:0;};"
      + "bs.sort(function(a,b){return nb(b)-nb(a);});var btn=bs[0];if(!btn) throw new Error('aucune réception « PV à faire »');var bc=bcDe(btn);expOpenPV(btn.getAttribute('data-bc'),btn.getAttribute('data-bl'));"
      + "document.getElementById('pv_res_ok').checked=true;expPVToggle();if(bc&&bc.certificat_matiere_requis) document.getElementById('pv_cert').checked=true;expPvToutRecu();"
      + "var lg=(bc&&bc.lignes)||[];if(lg.length>1){var k=Number(lg[lg.length-1].idx);var p=_pvPrevues[k];var i=document.getElementById('pv_lqte_'+k);if(i&&p!=null&&p>1){i.value=String(Math.floor(p/2));expPvLigneMaj(k);var c=document.getElementById('pv_lrel_'+k);if(c){c.checked=true;expPvLigneMaj(k);}}}"
      + "var t=document.getElementById('pv_lignes');if(t&&t.scrollIntoView) t.scrollIntoView({block:'center'});})()" },
  //   PV non conforme : réception du BC qui a le PLUS de lignes (tableau parlant) : 1re ligne avec une observation (qualitatif),
  //   2e ligne reçue avec 2 pièces de plus que prévu (excédent, quantitatif), observation générale ; la fenêtre défile jusqu'au tableau des lignes.
  { file: 'form-expeditions-pv-non-conforme', path: '/expeditions/service', tabClick: '#exp-tab-receptions', wait: 900,
    fn: "(function(){var bs=Array.prototype.slice.call(document.querySelectorAll('.exp-pv-open'));var nb=function(el){var b=EXP_BC.find(function(x){return x.id===el.getAttribute('data-bc');});return b&&Array.isArray(b.lignes)?b.lignes.length:0;};"
      + "bs.sort(function(a,b){return nb(b)-nb(a);});var btn=bs[0];if(!btn) throw new Error('aucune réception « PV à faire »');expOpenPV(btn.getAttribute('data-bc'),btn.getAttribute('data-bl'));"
      + "document.getElementById('pv_res_nc').checked=true;expPVToggle();expPvToutRecu();var o0=document.getElementById('pv_lobs_0');if(o0){o0.value='Rayures sur 2 pièces';expPvLigneMaj(0);}"
      + "var q1=document.getElementById('pv_lqte_1');if(q1&&_pvPrevues[1]!=null){q1.value=String(Number(_pvPrevues[1])+2);expPvLigneMaj(1);}"
      + "document.getElementById('pv_obs_gen').value='Emballage abîmé à l’arrivée';"
      + "var t=document.getElementById('pv_lignes');if(t&&t.scrollIntoView) t.scrollIntoView({block:'start'});})()" },
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
  //   Lot F : refus d'un EXCÉDENT de réception — fenêtre sans « annulation / révision », note « retour au fournisseur ». Rien n'est envoyé.
  { file: 'form-direction-refus-excedent', path: '/direction/service', fn: "decideValidation('demo','refuse',1)" },
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
