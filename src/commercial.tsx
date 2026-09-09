// ══════════════════════════════════════════════════════════════
// COMMERCIAL – ERP Seem Semrac v2.0
// Rentrée commerciale, DT statuts, fiches client, offre, avoirs, crédits
// SPEC-ERP-GPAO-V1.8 / EN9100:2018
// ══════════════════════════════════════════════════════════════
import { escX, layout, pageHeader, afterBox, serviceHeader, SIDEBAR_V2, APP_VERSION, interlocuteursPanel, validationCheckbox, bulkToolbar, bulkSelectAssets, buildValDirMap, valDirBadge } from './shared'
import { normeReferentiel } from './qref'
import { SOCIETE, LOGO_SVG, societeLignes, BRAND } from './brand'
import type { Client, DemandeTravaux, Offre, Commande, Credit, BonDeTravail, DemandeSite } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── MAPPERS DB → FORMAT INTERNE ──────────────────────────────
function mapClient(c: Client) {
  return { id:c.id, nom:c.nom, contact:c.contact??'', poste:c.poste??'', email:c.email??'', tel:c.tel??'', adresse:c.adresse??'',
    adresseRue:c.adresse_rue??'', adresseCp:c.adresse_cp??'', adresseVille:c.adresse_ville??'',
    facturationDifferente:!!c.facturation_differente, factRue:c.fact_rue??'', factCp:c.fact_cp??'', factVille:c.fact_ville??'',
    credits:c.credits, creditMontant:c.credit_montant, modeFacturation:c.mode_facturation??'', siret:c.siret??'',
    tvaIntra:(c as any).tva_intra??'', contacts:Array.isArray((c as any).contacts)?(c as any).contacts:[], contactPrincipal:(c as any).contact_principal??'',
    activite:(c as any).activite??'' }
}
function mapCredit(c: Credit) {
  return { id:c.id, client:c.client_nom??'', clientId:c.client_id??'', motif:c.motif, montant:c.montant, solde:c.solde, date:c.date_credit, statut:c.statut, vendeur:c.vendeur??'', saisiPar:c.saisi_par??'' }
}
// `pieces` est rendu via .join() à 4 endroits (DT / commandes / offres) : une valeur NULL
// ou scalaire y faisait planter (500) TOUTE la page du service Commercial. On normalise ici.
const asPieces = (v: any): any[] => Array.isArray(v) ? v : (v == null || v === '' ? [] : [String(v)])
function mapDT(d: DemandeTravaux) {
  return { id:d.id, numAffaire:d.num_affaire, clientId:d.client_id??'', client:d.client_nom??'', pieces:asPieces(d.pieces), piecesDetail:d.pieces_detail??[], type:d.type_dt??'', statut:d.statut, date:d.date_dt, priorite:d.priorite, analyste:d.analyste??'', budget:d.budget??0, activite:d.activite??'' }
}
function mapCommande(c: Commande) {
  return { id:c.id, numAffaire:c.num_affaire, client:c.client_nom??'', pieces:asPieces(c.pieces), montant:c.montant, dateCmd:c.date_cmd, dateLiv:c.date_liv??'', statut:c.statut, offre:c.offre_id??'', hasST:c.has_st, bdtTotal:c.bdt_total, bdtSoldes:c.bdt_soldes }
}
function mapOffre(o: Offre) {
  return { id:o.id, numAffaire:o.num_affaire, dtRef:o.dt_ref??'', client:o.client_nom??'', pieces:asPieces(o.pieces), montant:o.montant, montantRevient:(o as any).montant_revient??null, marge:o.marge??null, dateOff:o.date_offre, validite:o.validite??'', statut:o.statut, vendeur:o.vendeur??'', hasST:o.has_st, version:Number((o as any).version)||1, dateEnvoi:(o as any).date_envoi??null, modeLivraison:(o as any).mode_livraison??'', fraisTransport:Number((o as any).frais_transport)||0, modeReglement:(o as any).mode_reglement??'' }
}

// ─── DONNÉES DE FALLBACK (maquette) ────────────────────────────
const CLIENTS_DATA_DEFAULT: any[] = []

// LISTE UNIQUE des modes de règlement client (champ `clients.mode_facturation`).
// Elle alimente les 4 sélecteurs qui écrivent ce même champ : les 2 formulaires « nouveau
// client » (liste clients + DT), la modale d'édition client, et l'offre de prix (qui
// synchronise sa valeur vers la fiche client) — avant, 2 vocabulaires divergents cohabitaient.
export const MODES_FACTURATION = [
  'Proforma',
  'Virement 30j', 'Virement 45j', 'Virement 60j',
  '30j net', '30j fin de mois', '45j net', '45j fin de mois', '60j net', '60j fin de mois',
  'Traite 30j',
]

const CREDITS_DATA_DEFAULT: any[] = []

const DT_DATA_DEFAULT: any[] = []

const BDTS_CMD_DATA = [
  { id:'BDT-1277-01', cmdRef:'CMD-2026-1277', numAffaire:'1277', lotRef:'LOT-1277-A', piece:'DISSIP-A24 v3', operation:'Tron\u00e7onnage', machine:'Scie Kaltenbach', operateur:'Antoine D.', dureeBDT:1.5, statut:'a_programmer' },
  { id:'BDT-1277-02', cmdRef:'CMD-2026-1277', numAffaire:'1277', lotRef:'LOT-1277-A', piece:'DISSIP-A24 v3', operation:'Usinage CN', machine:'Tour CNC Mazak', operateur:'Antoine D.', dureeBDT:2.5, statut:'a_programmer' },
  { id:'BDT-1277-03', cmdRef:'CMD-2026-1277', numAffaire:'1277', lotRef:'LOT-1277-B', piece:'DISSIP-A24 v4', operation:'\u00c9bavurage', machine:'Poste \u00e9bavurage', operateur:'Karim B.', dureeBDT:1.0, statut:'a_programmer' },
  { id:'BDT-1277-04', cmdRef:'CMD-2026-1277', numAffaire:'1277', lotRef:'LOT-1277-B', piece:'DISSIP-A24 v4', operation:'Contr\u00f4le', machine:'Poste contr\u00f4le', operateur:'Isabelle R.', dureeBDT:0.5, statut:'a_programmer' },
  { id:'BDT-1278-01', cmdRef:'CMD-2026-1278', numAffaire:'1278', lotRef:'LOT-1278-A', piece:'TOLE-C07', operation:'D\u00e9coupe t\u00f4le', machine:'Presse d\u00e9coupe', operateur:'Antoine D.', dureeBDT:1.0, statut:'affecte' },
  { id:'BDT-1278-02', cmdRef:'CMD-2026-1278', numAffaire:'1278', lotRef:'LOT-1278-A', piece:'TOLE-C07', operation:'Fraisage CN', machine:'Centre usinage DMG', operateur:'Karim B.', dureeBDT:2.0, statut:'affecte' },
  { id:'BDT-1278-03', cmdRef:'CMD-2026-1278', numAffaire:'1278', lotRef:'LOT-1278-A', piece:'TOLE-C07', operation:'Contr\u00f4le', machine:'Poste contr\u00f4le', operateur:'Isabelle R.', dureeBDT:0.5, statut:'a_programmer' },
  { id:'BDT-1279-01', cmdRef:'CMD-2026-1279', numAffaire:'1279', lotRef:'LOT-1279-A', piece:'DISSIP-B11', operation:'Usinage CN', machine:'Tour CNC Mazak', operateur:'Antoine D.', dureeBDT:2.0, statut:'affecte' },
  { id:'BDT-1279-02', cmdRef:'CMD-2026-1279', numAffaire:'1279', lotRef:'LOT-1279-A', piece:'DISSIP-B11', operation:'\u00c9bavurage', machine:'Poste \u00e9bavurage', operateur:'Karim B.', dureeBDT:1.5, statut:'a_programmer' },
  { id:'BDT-1279-03', cmdRef:'CMD-2026-1279', numAffaire:'1279', lotRef:'LOT-1279-A', piece:'DISSIP-B11', operation:'Contr\u00f4le', machine:'Poste contr\u00f4le', operateur:'Isabelle R.', dureeBDT:0.5, statut:'a_programmer' },
  { id:'BDT-1280-01', cmdRef:'CMD-2026-1280', numAffaire:'1280', lotRef:'LOT-1280-A', piece:'SUPPORT-D4', operation:'Fraisage CN', machine:'Centre usinage DMG', operateur:'L\u00e9na\u00efck M.', dureeBDT:2.0, statut:'a_programmer' },
  { id:'BDT-1280-02', cmdRef:'CMD-2026-1280', numAffaire:'1280', lotRef:'LOT-1280-A', piece:'SUPPORT-D4', operation:'\u00c9bavurage', machine:'Poste \u00e9bavurage', operateur:'Karim B.', dureeBDT:1.0, statut:'a_programmer' },
  { id:'BDT-1281-01', cmdRef:'CMD-2026-1281', numAffaire:'1281', lotRef:'LOT-1281-A', piece:'DISSIP-E11', operation:'Tron\u00e7onnage', machine:'Scie Kaltenbach', operateur:'Antoine D.', dureeBDT:1.5, statut:'affecte' },
  { id:'BDT-1281-02', cmdRef:'CMD-2026-1281', numAffaire:'1281', lotRef:'LOT-1281-A', piece:'DISSIP-E11', operation:'Usinage CN', machine:'Tour CNC Mazak', operateur:'Antoine D.', dureeBDT:1.0, statut:'affecte' },
  { id:'BDT-1281-03', cmdRef:'CMD-2026-1281', numAffaire:'1281', lotRef:'LOT-1281-A', piece:'DISSIP-E11', operation:'Contr\u00f4le', machine:'Poste contr\u00f4le', operateur:'Isabelle R.', dureeBDT:0.5, statut:'affecte' },
]

const COMMANDES_VALIDEES_DEFAULT: any[] = []

const OFFRES_DATA_DEFAULT: any[] = []

// ─── HELPERS LOCAUX ───────────────────────────────────────────
const f = (label: string, type: string, placeholder: string, req = true, span2 = false) => `
<div${span2?' style="grid-column:span 2"':''}>
  <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">${label}${req?'<span style="color:#ef4444;margin-left:2px;">*</span>':''}</label>
  ${type==='textarea'
    ? `<textarea placeholder="${placeholder}" rows="3" class="form-input" style="resize:vertical;" ${req?'required':''}></textarea>`
    : type==='select'
    ? `<select class="form-input" ${req?'required':''}><option value="">${placeholder}</option></select>`
    : `<input type="${type}" placeholder="${placeholder}" class="form-input" ${req?'required':''}/>`
  }
</div>`

const row2 = (a: string, b: string) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">${a}${b}</div>`
const row3 = (a: string, b: string, c: string) => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">${a}${b}${c}</div>`
const row4 = (a: string, b: string, c: string, d: string) => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;">${a}${b}${c}${d}</div>`

const card = (content: string) => `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:20px;">${content}</div>`

const sec = (label: string, icon = 'fa-circle') => `<div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;margin-top:4px;display:flex;align-items:center;gap:8px;"><i class="fas ${icon}" style="color:#94a3b8;font-size:.6rem;"></i>${label}<span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span></div>`

const statusBadge = (s: string) => {
  const m: Record<string,{bg:string,col:string,lbl:string}> = {
    en_cours:     { bg:'#dbeafe', col:'#1d4ed8', lbl:'En cours' },
    en_attente:   { bg:'#fef9c3', col:'#854d0e', lbl:'En attente' },
    negociation:  { bg:'#f3e8ff', col:'#5b21b6', lbl:'Négociation' },
    acceptee:     { bg:'#dcfce7', col:'#15803d', lbl:'Acceptée ✓' },
    validee:      { bg:'#dcfce7', col:'#15803d', lbl:'Validée ✓' },
    refus:        { bg:'#fee2e2', col:'#b91c1c', lbl:'Refus' },
    a_programmer: { bg:'#fef9c3', col:'#854d0e', lbl:'À programmer' },
    attente_prep: { bg:'#dbeafe', col:'#1d4ed8', lbl:'Attente prépa' },
    attente_num:  { bg:'#f3e8ff', col:'#5b21b6', lbl:'Attente N° produit' },
    programmee:   { bg:'#dcfce7', col:'#15803d', lbl:'Programmée' },
    en_production:{ bg:'#d1fae5', col:'#065f46', lbl:'En production' },
    actif:  { bg:'#dcfce7', col:'#15803d', lbl:'Actif' },
    partiel:{ bg:'#fef9c3', col:'#854d0e', lbl:'Partiel' },
    cloture:{ bg:'#f1f5f9', col:'#6b7280', lbl:'Clôturé' },
    commande_creee:           { bg:'#d1fae5', col:'#065f46', lbl:'Commande créée ✓' },
    en_attente_nomenclature:  { bg:'#ede9fe', col:'#5b21b6', lbl:'Nomenclature à faire' },
    en_attente_be:            { bg:'#fef3c7', col:'#92400e', lbl:'En attente analyse BE' },
    dans_offres:        { bg:'#e0e7ff', col:'#3730a3', lbl:'Dans la liste des offres' },
    offre_en_attente:   { bg:'#fce7f3', col:'#9d174d', lbl:'Offre en attente' },
    en_attente_reponse: { bg:'#fff7ed', col:'#9a3412', lbl:'En attente réponse client' },
    annulee:            { bg:'#fee2e2', col:'#7f1d1d', lbl:'Annulée' },
    attente_reception:  { bg:'#ffedd5', col:'#9a3412', lbl:'Attente réception matière' },
    a_expedier:         { bg:'#e0f2fe', col:'#0369a1', lbl:'À expédier' },
    expedie:            { bg:'#dcfce7', col:'#166534', lbl:'Expédié ✓' },
    attente_prep_num:   { bg:'#fce7f3', col:'#9d174d', lbl:'Attente prépa + N° produit' },
  }
  const x = m[s] || { bg:'#f1f5f9', col:'#6b7280', lbl:s }
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${x.bg};color:${x.col};">${x.lbl}</span>`
}

const cmdStatutOptions = `
  <option value="a_programmer">À programmer</option>
  <option value="attente_prep">En attente de retour préparation technique</option>
  <option value="attente_num">En attente de création nouveau numéro produit</option>
  <option value="attente_prep_num">En attente préparation et numéro</option>
  <option value="programmee">Programmée</option>
`


// ══════════════════════════════════════════════════════════════
// PAGE LISTE DT AVEC STATUTS
// ══════════════════════════════════════════════════════════════
export const pageDTStatuts = (dbDts?: DemandeTravaux[], dbClients?: Client[]) => {
  const DT_DATA = dbDts ? dbDts.map(mapDT) : DT_DATA_DEFAULT
  const CLIENTS_DATA = dbClients ? dbClients.map(mapClient) : CLIENTS_DATA_DEFAULT
  const content = `
  ${pageHeader('fas fa-tasks','#3b82f6,#1d4ed8','Liste DT – Workflow Commercial','Corinne · DTs actives · Analyse BE · Liste des offres · EN9100',['DT','PRC1'])}
  <div style="padding:22px 30px;">

    <!-- BANDEAU INFO WORKFLOW -->
    <div style="background:linear-gradient(135deg,#eff6ff,#e0e7ff);border:1px solid #bfdbfe;border-radius:12px;padding:12px 18px;margin-bottom:16px;font-size:.8rem;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
      <span style="color:#1e3a8a;font-weight:700;"><i class="fas fa-info-circle mr-2"></i>Workflow DT :</span>
      <span style="color:#374151;">📋 <strong>DT créée</strong> → N° unique affaire</span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">🔬 <strong>Analyse BE</strong> (statut: En attente BE)</span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">💰 <strong>Offre créée</strong> (statut: Dans offres)</span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">✅ <strong>Commande créée</strong> (N° CMD = N° DT = N° OFF)</span>
    </div>

    <!-- FILTRES -->
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-size:.78rem;font-weight:600;color:#374151;">Filtrer :</span>
      ${[['actives','DT actives','#3b82f6'],['en_attente_be','En attente BE','#92400e'],['dans_offres','Dans offres','#3730a3'],['commande_creee','CMD créée','#065f46'],['refus','Refusées','#b91c1c'],['tous','Toutes','#6b7280']].map(([s,l,c])=>`
      <button onclick="filtrerDT('${s}')" class="dt-filter-btn" data-filter="${s}" style="padding:5px 14px;border-radius:999px;background:${s==='actives'?c+'20':'#f1f5f9'};color:${s==='actives'?c:'#6b7280'};border:1.5px solid ${s==='actives'?c+'40':'#e2e8f0'};font-size:.72rem;font-weight:700;cursor:pointer;">${l}</button>`).join('')}
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 12px;font-size:.75rem;color:#1d4ed8;display:flex;align-items:center;gap:6px;margin-bottom:16px;">
      <i class="fas fa-eye"></i> <strong>DT actives uniquement</strong> — les DT avec commande créée ou refusées sont masquées par défaut.
      <button id="btnToggleDT" onclick="toggleDTEncours()" style="margin-left:8px;padding:3px 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;border:none;font-size:.7rem;font-weight:700;cursor:pointer;">Voir toutes</button>
    </div>

    <!-- STATISTIQUES RAPIDES -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      ${[
        ['En attente BE', String((DT_DATA as any[]).filter((d:any)=>d.statut==='en_attente_be').length),'#f59e0b'],['Dans offres', String((DT_DATA as any[]).filter((d:any)=>d.statut==='dans_offres').length),'#6366f1'],['CMD créées', String((DT_DATA as any[]).filter((d:any)=>d.statut==='commande_creee').length),'#22c55e'],['Refusées', String((DT_DATA as any[]).filter((d:any)=>d.statut==='refus').length),'#ef4444'],
      ].map(([l,v,c])=>`<div style="background:white;border-radius:10px;padding:10px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:3px solid ${c};min-width:120px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:.68rem;color:#6b7280;font-weight:600;">${l}</div></div>`).join('')}
    </div>

    <!-- TABLE DT -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="dtTable">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Affaire / DT</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièce(s)</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Type</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Analyste</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Priorité</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${DT_DATA.map(dt => {
            const prioBg = dt.priorite==='critique'?'#fee2e2':dt.priorite==='urgent'?'#fef9c3':'#f0fdf4'
            const prioCol = dt.priorite==='critique'?'#b91c1c':dt.priorite==='urgent'?'#854d0e':'#15803d'
            const isFinished = ['commande_creee','refus'].includes(dt.statut)
            const voirHref = dt.statut==='en_attente_be' ? '/be/analyse' : dt.statut==='dans_offres' ? '/commercial/offres-liste' : '#'
            const voirLabel = dt.statut==='en_attente_be' ? 'Analyser BE' : dt.statut==='dans_offres' ? 'Voir offres' : 'Voir'
            const voirColor = dt.statut==='en_attente_be' ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : dt.statut==='dans_offres' ? 'linear-gradient(135deg,#6366f1,#4338ca)' : '#f1f5f9'
            return `
          <tr data-statut="${dt.statut}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
            <td style="padding:10px 14px;">
              <div style="font-weight:700;color:#374151;">${dt.id}</div>
              <div style="font-size:.68rem;color:#6366f1;margin-top:2px;"><i class="fas fa-hashtag" style="font-size:.6rem;"></i> Affaire N° ${escX(dt.numAffaire)}</div>
            </td>
            <td style="padding:10px 14px;color:#374151;font-weight:600;">${escX(dt.client)}</td>
            <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${escX(dt.pieces.join(', '))}</td>
            <td style="padding:10px 14px;font-size:.72rem;color:#374151;">${escX(dt.type)}</td>
            <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${escX(dt.analyste)}</td>
            <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;background:${prioBg};color:${prioCol};">${dt.priorite}</span></td>
            <td style="padding:10px 14px;text-align:center;">${statusBadge(dt.statut)}</td>
            <td style="padding:10px 14px;text-align:center;">
              <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                <a href="${voirHref}" style="padding:4px 10px;background:${voirColor};color:white;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-eye"></i>${voirLabel}</a>
                ${!isFinished ? `<button onclick="refusDT('${dt.id}')" style="padding:4px 8px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;" title="Refuser"><i class="fas fa-ban"></i></button>` : ''}
              </div>
            </td>
          </tr>`}).join('')}
        </tbody>
      </table>
    </div>

    <!-- FORMULAIRE NOUVELLE DT -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:20px;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-plus-circle" style="color:#3b82f6;"></i>Créer une nouvelle DT<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#1d4ed8;margin-bottom:14px;">
        <i class="fas fa-info-circle mr-2"></i>Le N° de DT sera automatiquement le N° d'affaire unique. Ce même numéro sera utilisé pour l'offre et la commande : <strong>DT-2026-XXXX = OFF-2026-XXXX = CMD-2026-XXXX</strong>
      </div>
      <!-- SÉLECTION CLIENT OU CRÉATION -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.8rem;color:#1d4ed8;">
        <i class="fas fa-user-check mr-2"></i>Sélectionnez un client existant ou <strong>créez-en un nouveau</strong> – les informations seront automatiquement propagées dans l'offre et la commande.
      </div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-bottom:14px;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client <span style="color:#ef4444;">*</span></label>
          <div style="position:relative;" id="dtClientAC">
            <input type="text" id="dtClientSearch" class="form-input" placeholder="Rechercher un client…" oninput="filterDTClients(this.value)" onfocus="showDTDropdown()" autocomplete="off" style="padding-right:32px;"/>
            <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.8rem;pointer-events:none;"><i class="fas fa-search"></i></span>
            <input type="hidden" id="dtClientId"/>
            <div id="dtClientDrop" style="display:none;position:absolute;top:100%;left:0;right:0;background:white;border:1.5px solid #bfdbfe;border-radius:0 0 8px 8px;max-height:220px;overflow-y:auto;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.1);margin-top:1px;"></div>
          </div>
        </div>
        <button type="button" onclick="toggleNouveauClient()" style="padding:10px 16px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-plus mr-1"></i>Nouveau client</button>
      </div>

      <!-- FICHE CLIENT AUTO-REMPLIE -->
      <div id="dtFicheClientInfo" style="display:none;background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid #e2e8f0;">
        <div style="font-size:.65rem;font-weight:800;color:#6366f1;text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-address-card mr-2"></i>Fiche client sélectionné</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:.8rem;" id="dtClientInfoGrid"></div>
      </div>

      <!-- FORMULAIRE NOUVEAU CLIENT (collapse) -->
      <div id="nouveauClientForm" style="display:none;background:white;border:2px solid #6366f1;border-radius:12px;padding:16px;margin-bottom:14px;">
        <div style="font-size:.78rem;font-weight:800;color:#4338ca;margin-bottom:14px;"><i class="fas fa-building mr-2"></i>Créer un nouveau client</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Raison sociale <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="Nom de l'entreprise" id="ncRaison"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">SIRET</label><input type="text" class="form-input" placeholder="XXX XXX XXX XXXXX" id="ncSiret"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Contact principal <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="Prénom Nom" id="ncContact"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Poste / Fonction</label><input type="text" class="form-input" placeholder="Responsable Achats…" id="ncPoste"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Email <span style="color:#ef4444;">*</span></label><input type="email" class="form-input" placeholder="contact@entreprise.fr" id="ncEmail"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Téléphone</label><input type="tel" class="form-input" placeholder="0X.XX.XX.XX.XX" id="ncTel"/></div>
        </div>
        <div style="margin-bottom:12px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Adresse complète</label><input type="text" class="form-input" placeholder="Numéro, rue, code postal, ville" id="ncAdresse"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Mode de facturation <span style="color:#ef4444;">*</span></label>
          <select class="form-input" id="ncModeFacturation">
            ${MODES_FACTURATION.map(m=>`<option value="${m}">${m}</option>`).join('')}
          </select>
          <div style="font-size:.68rem;color:#6b7280;margin-top:4px;"><i class="fas fa-info-circle mr-1"></i>Ce mode sera appliqué par défaut à toutes les factures de ce client. Il peut être modifié ultérieurement dans la fiche client.</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button type="button" onclick="toggleNouveauClient()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 16px;font-size:.8rem;cursor:pointer;">Annuler</button>
          <button type="button" onclick="validerNouveauClientDT()" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:8px;padding:7px 18px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-1"></i>Créer le client</button>
        </div>
      </div>

      <!-- LIGNE : N° DT auto + Activité + Type DT + Priorité + Date -->
      <div style="display:grid;grid-template-columns:180px 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px;align-items:end;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° DT <span style="color:#94a3b8;font-weight:500;">(auto)</span></label>
          <input type="text" class="form-input" id="dtNumAuto" readonly style="background:#f0f4ff;font-family:monospace;font-weight:700;color:#1d4ed8;cursor:default;" placeholder="DT-2026-…"/>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Activité <span style="color:#ef4444;">*</span></label>
          <select class="form-input" id="dtActivite" required>
            <option value="">— Activité —</option>
            <option value="Seem">SEEM</option>
            <option value="Semrac">SEMRAC</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Type de DT <span style="color:#ef4444;">*</span></label>
          <select class="form-input" id="dtType" required>
            <option value="">— Type —</option>
            <option value="Maj prix">Maj prix</option>
            <option value="Maj produit">Maj produit</option>
            <option value="Nouveau produit">Nouveau produit</option>
            <option value="Produit à jour">Produit à jour</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Priorité</label>
          <select class="form-input" id="dtPriorite">
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critique">Critique</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date besoin client</label>
          <input type="date" class="form-input" id="dtDateBesoin"/>
        </div>
      </div>

      <!-- SECTION PRODUITS -->
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#3b82f6;margin:16px 0 10px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-boxes" style="font-size:.65rem;"></i>Produit(s) concerné(s)
        <span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span>
      </div>
      <div id="dt-produits-container">
        <!-- Premier produit (généré par JS au chargement) -->
      </div>
      <button type="button" onclick="dtAjouterProduit()" style="width:100%;background:#eff6ff;border:2px dashed #bfdbfe;border-radius:10px;padding:10px;font-size:.8rem;font-weight:700;color:#1d4ed8;cursor:pointer;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px;">
        <i class="fas fa-plus-circle"></i>Produit supplémentaire
      </button>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Annuler</button>
        <button type="button" onclick="creerDT()" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(59,130,246,.3);"><i class="fas fa-paper-plane mr-2"></i>Créer la DT</button>
      </div>
    </div>

    <!-- MODAL REFUS DT -->
    <div id="refusModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:5000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;padding:28px;max-width:480px;width:90%;">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:4px;color:#b91c1c;"><i class="fas fa-ban mr-2"></i>Motif de refus</h3>
        <p style="font-size:.8rem;color:#6b7280;margin-bottom:14px;">DT : <strong id="refusDtId"></strong></p>
        <div style="margin-bottom:14px;">
          <select class="form-input" style="margin-bottom:10px;" id="refusMotif"><option>Prix non compétitif</option><option>Capacité technique insuffisante</option><option>Délai incompatible</option><option>Pièce hors périmètre</option><option>Matière non disponible</option><option>Autre</option></select>
          <textarea id="refusDetail" rows="3" class="form-input" placeholder="Préciser le motif de refus…"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button onclick="closeModal('refusModal')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
          <button onclick="confirmerRefus()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;padding:8px 20px;font-size:.83rem;font-weight:700;cursor:pointer;">Confirmer le refus</button>
        </div>
      </div>
    </div>
  </div>

  <script>
  var currentRefusDT='';
  var DT_FINALISEES=['commande_creee','refus'];
  var dtShowAll=false;
  function filtrerDT(statut){
    document.querySelectorAll('.dt-filter-btn').forEach(function(b){ b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.border='1.5px solid #e2e8f0'; });
    var btn=document.querySelector('[data-filter="'+statut+'"]');
    if(btn){ btn.style.background='#eff6ff'; btn.style.color='#1d4ed8'; btn.style.border='1.5px solid #bfdbfe'; }
    document.querySelectorAll('#dtTable tbody tr').forEach(function(tr){
      var s=tr.dataset.statut;
      if(statut==='tous'){ tr.style.display=''; }
      else if(statut==='actives'){ tr.style.display=DT_FINALISEES.indexOf(s)>=0?'none':''; }
      else { tr.style.display=(s===statut)?'':'none'; }
    });
  }
  function toggleDTEncours(){
    dtShowAll=!dtShowAll;
    document.querySelectorAll('#dtTable tbody tr').forEach(function(tr){
      var s=tr.dataset.statut;
      tr.style.display=(dtShowAll||DT_FINALISEES.indexOf(s)<0)?'':'none';
    });
    var btn=document.getElementById('btnToggleDT');
    if(btn){ btn.textContent=dtShowAll?'Masquer finalisées':'Voir toutes'; }
  }
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('#dtTable tbody tr').forEach(function(tr){
      if(DT_FINALISEES.indexOf(tr.dataset.statut)>=0) tr.style.display='none';
    });
  });
  function refusDT(id){ currentRefusDT=id; document.getElementById('refusDtId').textContent=id; const m=document.getElementById('refusModal'); if(m){m.style.display='flex';} }
  function confirmerRefus(){ pushNotif('warn','fa-ban','DT '+currentRefusDT+' refusée. Motif enregistré.',5000); closeModal('refusModal'); }
  function closeModal(id){ const m=document.getElementById(id); if(m) m.style.display='none'; }
  // ── DT : numérotation auto (garde-fou : jamais -Infinity/NaN sur liste vide) ──
  var DT_LAST_NUM = ${(() => { const ns = (DT_DATA as any[]).map((d: any) => parseInt(String(d.numAffaire ?? '').replace(/\D/g, ''), 10)).filter((n: number) => Number.isFinite(n)); return ns.length ? Math.max(...ns) : 0; })()};
  function dtInitNum(){
    var next = DT_LAST_NUM + 1;
    var el = document.getElementById('dtNumAuto');
    if(el) el.value = 'DT-' + new Date().getFullYear() + '-' + String(next).padStart(4,'0');
  }
  // ── DT : bloc produit ────────────────────────────────────────
  var dtProduitCount = 0;
  function dtBlocProduit(num){
    var n = num;
    var titre = n === 1 ? 'Produit 1' : 'Produit ' + n;
    return '<div class="dt-produit-bloc" id="dt-prod-'+n+'" style="background:#f8fafc;border-radius:12px;border:1.5px solid #e2e8f0;padding:16px;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      +   '<span style="font-size:.78rem;font-weight:800;color:#1d4ed8;"><i class="fas fa-cube" style="margin-right:6px;"></i>'+titre+'</span>'
      +   (n > 1 ? '<button type="button" onclick="document.getElementById(\\'dt-prod-'+n+'\\').remove()" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.75rem;"><i class="fas fa-times"></i> Retirer</button>' : '')
      + '</div>'
      // Ref pièce + nom plan + ref client
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;">'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Réf. interne pièce *</label><input type="text" class="form-input" placeholder="Ex: SEEM-DISSIP-A24"/></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Nom du plan</label><input type="text" class="form-input" placeholder="Ex: PLAN-DISSIP-A24-v3"/></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Réf. pièce client</label><input type="text" class="form-input" placeholder="Ex: LGR-A-20485"/></div>'
      + '</div>'
      // Upload plan PDF / STEP
      + '<div style="margin-bottom:10px;">'
      +   '<label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;"><i class="fas fa-paperclip" style="margin-right:4px;color:#3b82f6;"></i>Plan — PDF ou STEP</label>'
      +   '<input type="file" accept=".pdf,.step,.stp,.PDF,.STEP,.STP" class="form-input" style="padding:6px;cursor:pointer;" onchange="dtFileChosen(this,'+n+')"/>'
      +   '<div id="dt-file-info-'+n+'" style="font-size:.68rem;color:#16a34a;margin-top:3px;display:none;"><i class="fas fa-check-circle" style="margin-right:4px;"></i><span></span></div>'
      + '</div>'
      // Exigences normatives
      + '<div style="margin-bottom:10px;">'
      +   '<div style="font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.4rem;"><i class="fas fa-shield-alt" style="margin-right:4px;color:#f59e0b;"></i>Exigences normatives applicables</div>'
      +   '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      +     ['ISO 9001','EN 9100','REACH','RoHS','EN 13485'].map(function(norm){
              return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;color:#374151;background:white;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px 10px;cursor:pointer;">'
                + '<input type="checkbox" style="accent-color:#3b82f6;width:13px;height:13px;"/>'+norm+'</label>';
            }).join('')
      +   '</div>'
      + '</div>'
      // Oxydation anodique
      + '<div style="background:#fefce8;border:1.5px solid #fde68a;border-radius:8px;padding:10px 14px;">'
      +   '<div style="font-size:.68rem;font-weight:700;color:#92400e;margin-bottom:6px;"><i class="fas fa-flask" style="margin-right:5px;"></i>Traitement de surface</div>'
      +   '<label style="display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:600;color:#374151;cursor:pointer;margin-bottom:8px;">'
      +     '<input type="checkbox" id="dt-oxy-'+n+'" onchange="dtToggleOxy(this,'+n+')" style="accent-color:#f59e0b;width:15px;height:15px;"/>Oxydation anodique sulfurique'
      +   '</label>'
      +   '<div id="dt-oxy-detail-'+n+'" style="display:none;padding-left:22px;">'
      +     '<label style="display:inline-flex;align-items:center;gap:7px;font-size:.77rem;font-weight:600;color:#374151;cursor:pointer;">'
      +       '<input type="checkbox" style="accent-color:#374151;width:14px;height:14px;"/>Oxydation noire (en plus de l\\'anodisation)'
      +     '</label>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }
  function dtAjouterProduit(){
    dtProduitCount++;
    var container = document.getElementById('dt-produits-container');
    if(!container) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = dtBlocProduit(dtProduitCount);
    container.appendChild(tmp.firstElementChild);
  }
  function dtToggleOxy(cb, n){
    var detail = document.getElementById('dt-oxy-detail-'+n);
    if(detail) detail.style.display = cb.checked ? 'block' : 'none';
  }
  function dtFileChosen(input, n){
    var info = document.getElementById('dt-file-info-'+n);
    if(info && input.files.length > 0){
      info.style.display = 'block';
      info.querySelector('span').textContent = input.files[0].name + ' (' + Math.round(input.files[0].size/1024) + ' Ko)';
    }
  }
  // Init au chargement
  (function(){ dtInitNum(); dtAjouterProduit(); })();
  function creerDT(){
    var num = document.getElementById('dtNumAuto')?.value;
    var act = document.getElementById('dtActivite')?.value;
    var type = document.getElementById('dtType')?.value;
    if(!act){ pushNotif('err','fa-exclamation','L\\'activité (SEEM/SEMRAC) est obligatoire.'); return; }
    if(!type){ pushNotif('err','fa-exclamation','Le type de DT est obligatoire.'); return; }
    DT_LAST_NUM++;
    pushNotif('ok','fa-check-circle','DT '+num+' créée — Activité: '+act+' · Type: '+type+'. Analyste BE notifié.',6000);
  }
  var CLIENTS_JS=${sjX(CLIENTS_DATA)};
  var dtFilteredClients=CLIENTS_JS.slice();
  function filterDTClients(q){
    var lq=q.toLowerCase().trim();
    dtFilteredClients=lq?CLIENTS_JS.filter(function(c){return c.nom.toLowerCase().indexOf(lq)>=0;}):CLIENTS_JS.slice();
    renderDTDrop();
    var dd=document.getElementById('dtClientDrop');
    if(dd) dd.style.display='block';
  }
  function renderDTDrop(){
    var dd=document.getElementById('dtClientDrop');
    if(!dd) return;
    if(!dtFilteredClients.length){
      dd.innerHTML='<div style="padding:10px 14px;color:#9ca3af;font-size:.8rem;"><i class="fas fa-search mr-2"></i>Aucun client trouvé</div>';
      return;
    }
    dd.innerHTML=dtFilteredClients.slice(0,30).map(function(c){
      return '<div onclick="selectDTClient(\\''+c.id+'\\',\\''+c.nom+'\\')" style="padding:8px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;" onmouseenter="this.style.background=\\'#eff6ff\\'" onmouseleave="this.style.background=\\'\\'" ><div style="font-weight:600;color:#374151;font-size:.83rem;">'+c.nom+'</div><div style="font-size:.68rem;color:#6b7280;">'+c.modeFacturation+'</div></div>';
    }).join('');
  }
  function showDTDropdown(){
    filterDTClients(document.getElementById('dtClientSearch').value||'');
  }
  function selectDTClient(id,nom){
    var inp=document.getElementById('dtClientSearch');
    var hid=document.getElementById('dtClientId');
    if(inp) inp.value=nom;
    if(hid) hid.value=id;
    var dd=document.getElementById('dtClientDrop');
    if(dd) dd.style.display='none';
    onDTClientChange(id);
  }
  document.addEventListener('click',function(e){
    var ac=document.getElementById('dtClientAC');
    if(ac&&!ac.contains(e.target)){var dd=document.getElementById('dtClientDrop');if(dd)dd.style.display='none';}
  });
  function onDTClientChange(val){
    var info=document.getElementById('dtFicheClientInfo');
    var grid=document.getElementById('dtClientInfoGrid');
    var cl=CLIENTS_JS.find(function(c){ return c.id===val; });
    if(!cl){ if(info) info.style.display='none'; return; }
    if(grid) grid.innerHTML=[
      ['Raison sociale',cl.nom],['Contact',cl.contact],['Poste',cl.poste],
      ['Email',cl.email],['Téléphone',cl.tel],['Mode facturation','<span style="font-weight:800;color:#2563eb;">'+cl.modeFacturation+'</span>'],
      ['Adresse',cl.adresse],['SIRET',cl.siret||'—'],['Crédits actifs',cl.creditMontant>0?cl.creditMontant.toLocaleString('fr-FR')+' €':'Aucun'],
    ].map(function(r){ return '<div style="background:white;border-radius:7px;padding:8px 10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">'+r[0]+'</div><div style="font-weight:600;color:#374151;font-size:.78rem;margin-top:2px;">'+r[1]+'</div></div>'; }).join('');
    if(info) info.style.display='block';
  }
  function toggleNouveauClient(){
    var f=document.getElementById('nouveauClientForm');
    if(f) f.style.display=f.style.display==='none'||f.style.display===''?'block':'none';
  }
  function validerNouveauClientDT(){
    var raison=document.getElementById('ncRaison');
    if(!raison||!raison.value.trim()){ pushNotif('err','fa-times','Raison sociale obligatoire.',4000); return; }
    var payload={
      nom:raison.value.trim(),
      siret:(document.getElementById('ncSiret')||{value:''}).value||null,
      contact:(document.getElementById('ncContact')||{value:''}).value||'',
      poste:(document.getElementById('ncPoste')||{value:''}).value||'',
      email:(document.getElementById('ncEmail')||{value:''}).value||'',
      tel:(document.getElementById('ncTel')||{value:''}).value||'',
      adresse:(document.getElementById('ncAdresse')||{value:''}).value||'',
      mode_facturation:(document.getElementById('ncModeFacturation')||{value:''}).value||''
    };
    fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.error){ pushNotif('err','fa-times','Erreur: '+data.error,5000); return; }
        var newCl={id:data.id,nom:data.nom,contact:data.contact||'',poste:data.poste||'',email:data.email||'',tel:data.tel||'',adresse:data.adresse||'',credits:0,creditMontant:data.credit_montant||0,modeFacturation:data.mode_facturation||'',siret:data.siret||''};
        CLIENTS_JS.push(newCl);
        dtFilteredClients=CLIENTS_JS.slice();
        selectDTClient(data.id,data.nom);
        pushNotif('ok','fa-building','Nouveau client "'+data.nom+'" créé et sélectionné.',5000);
        toggleNouveauClient();
      })
      .catch(function(){ pushNotif('err','fa-times','Erreur réseau. Client non créé.',4000); });
  }
  function addDTRef(){
    const c=document.getElementById('dt-refs-container');
    if(!c) return;
    const d=document.createElement('div');
    d.className='dt-ref-row';
    d.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end;margin-bottom:10px;background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;';
    d.innerHTML='<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Désignation interne</label><input type="text" class="form-input" placeholder="Ex: DISSIP-A24 v3"/></div>'
      +'<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° pièce client</label><input type="text" class="form-input" placeholder="Ex: LGR-A-20485"/></div>'
      +'<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° plan</label><input type="text" class="form-input" placeholder="Ex: PLAN-A24-v3"/></div>'
      +'<button type="button" onclick="this.parentNode.remove()" style="padding:8px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;" title="Supprimer"><i class="fas fa-trash"></i></button>';
    c.appendChild(d);
  }
  </script>`
  return layout('Liste DT & Statuts', content, 'dt-liste')
}

// ══════════════════════════════════════════════════════════════
// PAGE COMMANDES VALIDÉES
// ══════════════════════════════════════════════════════════════
export const pageCommandesValidees = (dbCmds?: Commande[], dbOffres?: Offre[], dbDts?: DemandeTravaux[]) => {
  const COMMANDES_VALIDEES = dbCmds ? dbCmds.map(mapCommande) : COMMANDES_VALIDEES_DEFAULT
  const OFFRES_DATA = dbOffres ? dbOffres.map(mapOffre) : OFFRES_DATA_DEFAULT
  const DT_DATA = dbDts ? dbDts.map(mapDT) : DT_DATA_DEFAULT
  const content = `
  ${pageHeader('fas fa-clipboard-list','#0ea5e9,#0284c7','Commandes Validées – Suivi Production','Sylvie · Corinne · Statuts planification · BDTs · EN9100',['CMD','BDT','Planning'])}
  <div style="padding:22px 30px;">

    <!-- LÉGENDE STATUTS -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
      <span style="font-size:.72rem;font-weight:700;color:#374151;">Statuts :</span>
      ${[
        ['a_programmer','À programmer','#fef9c3','#854d0e'],
        ['attente_reception','Attente réception matière','#ffedd5','#9a3412'],
        ['attente_prep','Attente retour prépa tech.','#dbeafe','#1d4ed8'],
        ['attente_num','Attente N° produit','#f3e8ff','#5b21b6'],
        ['attente_prep_num','Attente prépa + N° produit','#fce7f3','#9d174d'],
        ['programmee','Programmée','#dcfce7','#15803d'],
        ['en_production','En production','#d1fae5','#065f46'],
        ['a_expedier','À expédier','#e0f2fe','#0369a1'],
        ['expedie','Expédié ✓','#dcfce7','#166534'],
      ].map(([,l,bg,col])=>`<span style="padding:3px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${l}</span>`).join('')}
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;color:#374151;font-size:.88rem;"><i class="fas fa-list-check mr-2" style="color:#0ea5e9;"></i>Liste des commandes validées</span>
        <span style="font-size:.72rem;color:#6b7280;">Modifiable par Sylvie et Corinne · Seule Sylvie peut passer en "Programmée"</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° CMD / Affaire</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièce(s)</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Livraison</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Avancement BDT</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">ST</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${COMMANDES_VALIDEES.map(cmd => {
              const pct = cmd.bdtTotal>0 ? Math.round(cmd.bdtSoldes/cmd.bdtTotal*100) : 0
              const barCol = pct===100?'#22c55e':pct>0?'#f59e0b':'#e2e8f0'
              return `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="padding:10px 14px;">
                <div style="font-weight:700;color:#374151;">${cmd.id}</div>
                <div style="font-size:.68rem;color:#6366f1;"><i class="fas fa-link" style="font-size:.6rem;"></i> Affaire ${escX(cmd.numAffaire)} · ${cmd.offre}</div>
              </td>
              <td style="padding:10px 14px;color:#374151;font-weight:600;">${escX(cmd.client)}</td>
              <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${escX(cmd.pieces.join(', '))}</td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${cmd.montant.toLocaleString('fr-FR')} €</td>
              <td style="padding:10px 14px;text-align:center;font-weight:600;color:${new Date(cmd.dateLiv)<new Date('2026-04-01')?'#ea580c':'#374151'};font-size:.78rem;">${cmd.dateLiv}</td>
              <td style="padding:10px 14px;text-align:center;">
                <div style="font-size:.72rem;color:#374151;margin-bottom:4px;font-weight:600;">${cmd.bdtSoldes}/${cmd.bdtTotal} BDT soldés</div>
                <div style="background:#f1f5f9;border-radius:999px;height:6px;overflow:hidden;min-width:80px;">
                  <div style="background:${barCol};height:100%;width:${pct}%;border-radius:999px;transition:width .5s;"></div>
                </div>
                <div style="font-size:.66rem;color:${barCol};font-weight:700;margin-top:2px;">${pct}%</div>
              </td>
              <td style="padding:10px 14px;text-align:center;">
                ${cmd.hasST ? '<span style="padding:2px 8px;border-radius:999px;font-size:.66rem;font-weight:700;background:#fce7f3;color:#9d174d;cursor:pointer;" onclick="envoyerEnST(\''+cmd.id+'\')" title="Cliquer pour envoyer en liste ST"><i class="fas fa-truck mr-1"></i>ST</span>' : '<span style="color:#9ca3af;font-size:.72rem;">—</span>'}
              </td>
              <td style="padding:10px 14px;text-align:center;">${statusBadge(cmd.statut)}</td>
              <td style="padding:10px 14px;text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                  <button onclick="voirCmd('${cmd.id}')" style="padding:4px 10px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px;"><i class="fas fa-eye"></i>Voir</button>
                  <button onclick="genererDA('${cmd.id}','${cmd.numAffaire}')" title="Générer les demandes d'achat (stock insuffisant)" style="padding:4px 10px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px;"><i class="fas fa-cart-plus"></i>DA</button>
                  <a href="/production/affectation" style="padding:4px 10px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;"><i class="fas fa-project-diagram"></i>BDTs</a>
                  ${cmd.statut==='a_expedier'?'<a href="/expedition/envoi-client" style="padding:4px 10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;"><i class="fas fa-truck mr-1"></i>Exp\u00e9dier</a>':''}
                  <button onclick="devaliderCmd('${cmd.id}')" style="padding:4px 10px;background:#f1f5f9;color:#6b7280;border:1px solid #e2e8f0;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;" title="D\u00e9valider"><i class="fas fa-undo"></i></button>
                </div>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- CRÉATION BDT AUTO DEPUIS CMD -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-magic" style="color:#f97316;"></i>Création automatique des BDTs<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span></div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;margin-bottom:16px;font-size:.82rem;">
        <i class="fas fa-info-circle mr-2" style="color:#f97316;"></i>
        Sélectionner une commande "À programmer" pour générer automatiquement les BDTs par opération. Les opérations ST seront automatiquement téléversées dans la liste sous-traitance.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° Commande "À programmer" <span style="color:#ef4444;">*</span></label><select class="form-input"><option value="">CMD-2026-XXXX</option><option value="CMD-2026-1277">CMD-2026-1277 – Legrand – DISSIP-A24</option><option value="CMD-2026-1280">CMD-2026-1280 – Faurecia – SUPPORT-D4</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date souhaitée de démarrage</label><input type="date" class="form-input"/></div>
      </div>
      <div id="opsContainer" style="margin:14px 0;background:#f8fafc;border-radius:10px;padding:14px;border:1px dashed #e2e8f0;min-height:60px;">
        <div style="color:#9ca3af;font-size:.82rem;text-align:center;"><i class="fas fa-magic mr-2"></i>Sélectionner une commande pour voir les BDTs à créer</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="simulerBDTs()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 18px;font-size:.82rem;font-weight:600;cursor:pointer;"><i class="fas fa-eye mr-2"></i>Prévisualiser BDTs</button>
        <button onclick="confirmerCreationBDTs()" style="background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(249,115,22,.3);"><i class="fas fa-bolt mr-2"></i>Créer les BDTs &amp; Ouvrir Gantt</button>
      </div>
    </div>
  </div>
  <!-- MODAL VOIR CMD -->
  <div id="modalVoirCmd" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:760px;width:95%;max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:1rem;font-weight:800;color:#0284c7;margin:0;"><i class="fas fa-clipboard-list mr-2"></i>Détail complet de la commande</h3>
        <button onclick="fermerModalCmd()" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;color:#6b7280;font-size:.9rem;"><i class="fas fa-times"></i></button>
      </div>
      <div id="modalCmdContent" style="font-size:.82rem;"></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button onclick="fermerModalCmd()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Fermer</button>
      </div>
    </div>
  </div>

  <!-- MODAL : Générer les Demandes d'Achat (besoins / stock insuffisant) -->
  <div id="genda-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5200;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:760px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#10b981,#059669);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-cart-plus" style="margin-right:8px;"></i>Générer les demandes d'achat — Affaire <span id="genda_aff"></span></div>
        <button onclick="gendaClose()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:20px 22px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#065f46;">
          <i class="fas fa-info-circle" style="margin-right:6px;"></i>Renseignez ce qu'il faut acheter pour réaliser la commande. Pour chaque besoin, le <strong>stock est vérifié</strong> : une DA n'est créée que si le stock est insuffisant. Les DA arrivent dans <strong>Service Achats → à traiter</strong>.
        </div>
        <div style="display:grid;grid-template-columns:2fr .8fr .7fr 1.4fr 1fr 28px;gap:6px;margin-bottom:6px;font-size:.62rem;font-weight:800;text-transform:uppercase;color:#94a3b8;">
          <div>Article / matière</div><div>Qté</div><div>Unité</div><div>Fournisseur</div><div>Type</div><div></div>
        </div>
        <div id="genda_rows"></div>
        <button onclick="gendaAddRow()" style="margin-top:6px;padding:6px 12px;background:white;color:#059669;border:1.5px dashed #6ee7b7;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter un besoin</button>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="gendaClose()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="gendaSubmit()" style="padding:9px 18px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-cart-plus" style="margin-right:5px;"></i>Vérifier le stock & générer</button>
      </div>
    </div>
  </div>

  <script>
  var CMDS_JS=${sjX(COMMANDES_VALIDEES)};
  var OFFRES_JS_CMD=${sjX(OFFRES_DATA)};
  var DT_JS_CMD=${sjX(DT_DATA)};
  var BDTS_JS_CMD=${sjX(BDTS_CMD_DATA)};

  function voirCmd(id){
    var cmd=null, offre=null, dt=null;
    for(var i=0;i<CMDS_JS.length;i++){ if(CMDS_JS[i].id===id){ cmd=CMDS_JS[i]; break; } }
    if(!cmd){ pushNotif('err','fa-times','Commande introuvable.',3000); return; }
    for(var j=0;j<OFFRES_JS_CMD.length;j++){ if(OFFRES_JS_CMD[j].numAffaire===cmd.numAffaire){ offre=OFFRES_JS_CMD[j]; break; } }
    for(var k=0;k<DT_JS_CMD.length;k++){ if(DT_JS_CMD[k].numAffaire===cmd.numAffaire){ dt=DT_JS_CMD[k]; break; } }
    var pct=cmd.bdtTotal>0?Math.round(cmd.bdtSoldes/cmd.bdtTotal*100):0;
    var barCol=pct===100?'#22c55e':pct>0?'#f59e0b':'#e2e8f0';
    var html='';
    // Header affaire
    html+='<div style="background:linear-gradient(135deg,#eff6ff,#e0e7ff);border:1px solid #bfdbfe;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">'
      +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">N° Affaire unique</div><div style="font-weight:900;color:#1d4ed8;font-size:1.1rem;">'+cmd.numAffaire+'</div></div>'
      +'<div style="font-size:.8rem;color:#374151;"><i class="fas fa-link mr-1" style="color:#6366f1;"></i><strong>DT-2026-'+cmd.numAffaire+'</strong> = <strong>'+cmd.offre+'</strong> = <strong>'+cmd.id+'</strong></div></div>';
    // CMD
    html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;letter-spacing:.06em;"><i class="fas fa-clipboard-check" style="color:#0284c7;margin-right:6px;"></i>Commande – '+cmd.id+'</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">'
      +'<div style="background:#e0f2fe;border-radius:9px;padding:10px;border:1px solid #bae6fd;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Client</div><div style="font-weight:700;color:#374151;margin-top:2px;">'+cmd.client+'</div></div>'
      +'<div style="background:#f0fdf4;border-radius:9px;padding:10px;border:1px solid #bbf7d0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Montant HT</div><div style="font-weight:800;color:#15803d;margin-top:2px;">'+Number(cmd.montant).toLocaleString('fr-FR')+' \u20ac</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Date livraison</div><div style="font-weight:700;color:#374151;margin-top:2px;">'+cmd.dateLiv+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Pièce(s)</div><div style="font-weight:600;color:#374151;font-size:.76rem;margin-top:2px;">'+cmd.pieces.join(', ')+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">BDTs soldés</div>'
        +'<div style="font-weight:700;margin-top:2px;">'+cmd.bdtSoldes+'/'+cmd.bdtTotal+'<div style="background:#f1f5f9;border-radius:999px;height:5px;overflow:hidden;margin-top:4px;"><div style="background:'+barCol+';height:100%;width:'+pct+'%;"></div></div></div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">ST</div><div style="font-weight:700;color:'+(cmd.hasST?'#9d174d':'#6b7280')+';margin-top:2px;">'+(cmd.hasST?'\u2713 Oui':'Non')+'</div></div>'
      +'</div>';
    // Offre
    if(offre){
      html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;letter-spacing:.06em;"><i class="fas fa-file-invoice-dollar" style="color:#6366f1;margin-right:6px;"></i>Offre accept\u00e9e – '+offre.id+'</div>';
      html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;background:#f5f3ff;border-radius:10px;padding:12px;border:1px solid #ddd6fe;">'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Montant offre</div><div style="font-weight:800;color:#5b21b6;margin-top:2px;">'+Number(offre.montant).toLocaleString('fr-FR')+' \u20ac</div></div>'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Date offre</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+offre.dateOff+'</div></div>'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Validit\u00e9</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+offre.validite+'</div></div>'
        +'</div>';
    }
    // DT
    if(dt){
      html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;letter-spacing:.06em;"><i class="fas fa-tasks" style="color:#3b82f6;margin-right:6px;"></i>DT d\\'origine \u2013 '+dt.id+'</div>';
      html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#eff6ff;border-radius:10px;padding:12px;border:1px solid #bfdbfe;">'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Type</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+dt.type+'</div></div>'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Analyste BE</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+dt.analyste+'</div></div>'
        +'<div><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Budget estimé</div><div style="font-weight:700;color:#1d4ed8;margin-top:2px;">'+Number(dt.budget).toLocaleString('fr-FR')+' \u20ac</div></div>'
        +'<div style="grid-column:span 3"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Pi\u00e8ce(s) analys\u00e9es</div><div style="font-weight:600;color:#374151;">'+dt.pieces.join(', ')+'</div></div>'
        +'</div>';
    }
    // BDTs de la commande
    var bdts=[];
    for(var b=0;b<BDTS_JS_CMD.length;b++){if(BDTS_JS_CMD[b].numAffaire===cmd.numAffaire)bdts.push(BDTS_JS_CMD[b]);}
    if(bdts.length>0){
      html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin:14px 0 10px;letter-spacing:.06em;"><i class="fas fa-hard-hat" style="color:#ea580c;margin-right:6px;"></i>BDTs de la commande ('+bdts.length+' BDT'+(bdts.length>1?'s':'')+' \u2013 '+bdts.filter(function(x){return x.statut==='affecte';}).length+' affect\u00e9s)</div>';
      // Group by lot
      var lots={};
      for(var l=0;l<bdts.length;l++){var lk=bdts[l].lotRef;if(!lots[lk])lots[lk]=[];lots[lk].push(bdts[l]);}
      var lotKeys=Object.keys(lots);
      for(var li=0;li<lotKeys.length;li++){
        var lKey=lotKeys[li];
        var lBdts=lots[lKey];
        html+='<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;">';
        html+='<div style="font-size:.72rem;font-weight:800;color:#ea580c;margin-bottom:8px;"><i class="fas fa-box mr-2"></i>LOT : '+lKey+'</div>';
        html+='<table style="width:100%;border-collapse:collapse;font-size:.74rem;">';
        html+='<thead><tr style="background:#f1f5f9;"><th style="padding:5px 8px;text-align:left;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">BDT</th><th style="padding:5px 8px;text-align:left;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">Op\u00e9ration</th><th style="padding:5px 8px;text-align:left;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">Machine</th><th style="padding:5px 8px;text-align:left;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">Op\u00e9rateur</th><th style="padding:5px 8px;text-align:center;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">Dur\u00e9e</th><th style="padding:5px 8px;text-align:center;color:#64748b;font-size:.65rem;text-transform:uppercase;font-weight:700;">Statut</th></tr></thead><tbody>';
        for(var bi=0;bi<lBdts.length;bi++){
          var bdt=lBdts[bi];
          var isAff=bdt.statut==='affecte';
          html+='<tr style="border-bottom:1px solid #f1f5f9;">'
            +'<td style="padding:5px 8px;font-weight:700;color:#ea580c;">'+bdt.id+'</td>'
            +'<td style="padding:5px 8px;color:#374151;">'+bdt.operation+'</td>'
            +'<td style="padding:5px 8px;color:#374151;">'+bdt.machine+'</td>'
            +'<td style="padding:5px 8px;color:#374151;">'+bdt.operateur+'</td>'
            +'<td style="padding:5px 8px;text-align:center;font-weight:700;color:#ea580c;">'+bdt.dureeBDT+'h</td>'
            +'<td style="padding:5px 8px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.62rem;font-weight:700;background:'+(isAff?'#dcfce7':'#fff7ed')+';color:'+(isAff?'#166534':'#9a3412')+'">'+(isAff?'Affect\u00e9 \u2713':'\u00c0 programmer')+'</span></td>'
            +'</tr>';
        }
        html+='</tbody></table></div>';
      }
    }
    var content=document.getElementById('modalCmdContent');
    if(content) content.innerHTML=html;
    var m=document.getElementById('modalVoirCmd');
    if(m) m.style.display='flex';
  }
  function fermerModalCmd(){ var m=document.getElementById('modalVoirCmd'); if(m) m.style.display='none'; }
  async function devaliderCmd(id){ if(await appConfirm('D\u00e9valider la commande '+id+' ?')) pushNotif('info','fa-undo','CMD '+id+' d\u00e9valid\u00e9e.',5000); }
  async function envoyerEnST(id){ if(await appConfirm('T\u00e9l\u00e9verser les op\u00e9rations ST de '+id+' dans la liste sous-traitance ?')){ pushNotif('ok','fa-truck','Op\u00e9rations ST de '+id+' envoy\u00e9es dans la liste ST.',5000); } }

  // \u2500\u2500\u2500 G\u00e9n\u00e9ration des Demandes d'Achat (besoins mati\u00e8re/ST si stock insuffisant) \u2500\u2500\u2500
  var _genDaCmdId=null;
  function genererDA(id, numAffaire){
    _genDaCmdId=id;
    document.getElementById('genda_aff').textContent=numAffaire||id;
    document.getElementById('genda_rows').innerHTML='';
    gendaAddRow();
    document.getElementById('genda-overlay').style.display='flex';
  }
  function gendaAddRow(){
    var i='border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 8px;font-size:.78rem;background:#f8fafc;outline:none;box-sizing:border-box;width:100%;';
    var div=document.createElement('div');
    div.className='genda-row';
    div.style.cssText='display:grid;grid-template-columns:2fr .8fr .7fr 1.4fr 1fr 28px;gap:6px;margin-bottom:6px;align-items:center;';
    div.innerHTML='<input class="g-art" placeholder="Article / mati\u00e8re" style="'+i+'"/>'+
      '<input class="g-qte" type="number" placeholder="Qt\u00e9" style="'+i+'"/>'+
      '<input class="g-unite" placeholder="u" style="'+i+'"/>'+
      '<input class="g-four" placeholder="Fournisseur" style="'+i+'"/>'+
      '<select class="g-type" style="'+i+'"><option value="fournisseur">Fournisseur</option><option value="st">Sous-traitant</option></select>'+
      '<button onclick="this.parentElement.remove()" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;height:30px;cursor:pointer;"><i class="fas fa-times"></i></button>';
    document.getElementById('genda_rows').appendChild(div);
  }
  function gendaClose(){ document.getElementById('genda-overlay').style.display='none'; }
  function gendaSubmit(){
    var besoins=[];
    document.querySelectorAll('#genda_rows .genda-row').forEach(function(r){
      var art=r.querySelector('.g-art').value.trim(); if(!art) return;
      besoins.push({ article:art, qte:parseFloat(r.querySelector('.g-qte').value)||0, unite:r.querySelector('.g-unite').value.trim(), fournisseur:r.querySelector('.g-four').value.trim(), type_bc:r.querySelector('.g-type').value });
    });
    if(besoins.length===0){ pushNotif('err','fa-exclamation-circle','Ajoutez au moins un besoin d\\'achat.'); return; }
    fetch('/api/commandes/'+encodeURIComponent(_genDaCmdId)+'/generer-da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({besoins:besoins})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'G\u00e9n\u00e9ration \u00e9chou\u00e9e.'); return; }
        gendaClose();
        var g=(j.generated||[]).length, s=(j.skipped||[]).length;
        if(g>0) pushNotif('ok','fa-cart-plus',g+' demande(s) d\\'achat cr\u00e9\u00e9e(s) (stock insuffisant)'+(s>0?' \u00b7 '+s+' ignor\u00e9e(s) (stock OK)':'')+'. \u2192 Service Achats.',7000);
        else pushNotif('info','fa-check-circle','Aucune DA n\u00e9cessaire : stock suffisant pour tous les besoins.',6000);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur r\u00e9seau.'); });
  }
  function simulerBDTs(){
    var c=document.getElementById('opsContainer');
    if(c) c.innerHTML='<div style="font-size:.82rem;"><div style="font-weight:700;color:#374151;margin-bottom:8px;"><i class="fas fa-list mr-2" style="color:#f97316;"></i>BDTs \u00e0 cr\u00e9er pour CMD-2026-1277 \u2013 Legrand \u2013 DISSIP-A24 (x500)</div><div style="display:flex;flex-direction:column;gap:6px;">'
    +['BDT-1277-01 : Tron\u00e7onnage \u2013 Antoine D. \u2013 1.5h \u2013 Scie Kaltenbach \u2013 Matin','BDT-1277-02 : Usinage CN \u2013 Antoine D. \u2013 2.5h \u2013 Tour CNC Mazak \u2013 Matin','BDT-1277-03 : OAS (ST Anodex) \u2013 SOUS-TRAITANCE \u2013 2j d\u00e9lai','BDT-1277-04 : Contr\u00f4le / Emballage \u2013 Isabelle R. \u2013 0.5h \u2013 Poste contr\u00f4le'].map(function(b){ return '<div style="background:white;border:1px solid #fed7aa;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#374151;"><i class="fas fa-hard-hat mr-2" style="color:#f97316;"></i>'+b+'</div>'; }).join('')+'</div></div>';
  }
  function confirmerCreationBDTs(){ pushNotif('ok','fa-bolt','4 BDTs cr\u00e9\u00e9s \u2013 1 ST t\u00e9l\u00e9vers\u00e9 en liste sous-traitance. Ouverture Gantt...',5000); setTimeout(function(){ window.location.href='/production/affectation'; },2000); }
  </script>`

  return layout('Commandes Validées', content, 'cmd-validees')
}

// ══════════════════════════════════════════════════════════════
// PAGE OFFRE COMMERCIALE AMÉLIORÉE
// ══════════════════════════════════════════════════════════════
export const pageOffreCommerciale = (dbOffres?: Offre[], dbClients?: Client[], dbDts?: DemandeTravaux[], dbCredits?: any[]) => {
  const OFFRES_DATA = dbOffres ? dbOffres.map(mapOffre) : OFFRES_DATA_DEFAULT
  const CLIENTS_DATA = dbClients ? dbClients.map(mapClient) : CLIENTS_DATA_DEFAULT
  const DT_DATA = dbDts ? dbDts.map(mapDT) : DT_DATA_DEFAULT
  // Avoirs « en cours » par client (nom) → déduction indicative affichée sur l'offre. Décompte réel à l'acceptation.
  const _avoirByNom: Record<string, number> = {}
  ;(dbCredits || []).forEach((c: any) => {
    if (c && c.statut !== 'cloture' && (Number(c.solde) || 0) > 0) {
      const nk = String(c.client_nom || '').trim().toLowerCase()
      if (nk) _avoirByNom[nk] = (_avoirByNom[nk] || 0) + (Number(c.solde) || 0)
    }
  })
  const avoirDispo = (nom: string) => _avoirByNom[String(nom || '').trim().toLowerCase()] || 0
  const content = `
  ${pageHeader('fas fa-file-invoice-dollar','#6366f1,#4338ca','Offres Commerciales – Workflow Client','Corinne · Tarification · Statuts · Validé · Négociation · Annulé',['PRC1-D5','OFF'])}
  <div style="padding:22px 30px;">

    <!-- ONGLETS + NOUVELLE OFFRE -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;gap:0;background:#f1f5f9;border-radius:12px;padding:4px;width:fit-content;">
        <button onclick="switchTabOffre('liste')" id="tabOff-liste" style="padding:8px 18px;border-radius:8px;background:white;color:#6366f1;border:none;font-weight:700;font-size:.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <i class="fas fa-list" style="color:#6366f1;"></i>Liste des offres
        </button>
        <button onclick="switchTabOffre('form')" id="tabOff-form" style="padding:8px 18px;border-radius:8px;background:transparent;color:#64748b;border:none;font-weight:600;font-size:.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;">
          <i class="fas fa-plus" style="color:#3b82f6;"></i>Nouvelle offre
        </button>
      </div>
      <button onclick="switchTabOffre('form')" style="padding:8px 18px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(99,102,241,.3);"><i class="fas fa-plus mr-2"></i>Nouvelle offre</button>
    </div>

    <!-- LISTE DES OFFRES -->
    <div id="panelOff-liste">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:700;color:#374151;font-size:.88rem;"><i class="fas fa-list mr-2" style="color:#6366f1;"></i>Liste des offres commerciales</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${[['tous','Toutes'],['offre_en_attente','En attente'],['en_attente_reponse','Attente réponse client'],['annulee','Annulées']].map(([s,l])=>`<button onclick="filtrerOffre('${s}')" data-of="${s}" style="padding:4px 12px;border-radius:999px;font-size:.7rem;font-weight:600;background:${s==='tous'?'#e0e7ff':'#f1f5f9'};color:${s==='tous'?'#3730a3':'#6b7280'};border:1.5px solid ${s==='tous'?'#c7d2fe':'#e2e8f0'};cursor:pointer;">${l}</button>`).join('')}
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="offresTable">
            <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
              <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° OFF / Affaire</th>
              <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">DT liée</th>
              <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
              <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièce(s)</th>
              <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant HT</th>
              <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Validité</th>
              <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
              <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
            </tr></thead>
            <tbody>
              ${OFFRES_DATA.map(o=>{
                const isAttente = o.statut==='en_attente_reponse'
                return `
              <tr data-offre-statut="${o.statut}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                <td style="padding:10px 14px;">
                  <div style="font-weight:700;color:#6366f1;">${o.id}</div>
                  <div style="font-size:.68rem;color:#9ca3af;">Affaire N° ${escX(o.numAffaire)}</div>
                </td>
                <td style="padding:10px 14px;"><a href="/commercial/dt-liste" style="color:#3b82f6;font-size:.78rem;font-weight:600;text-decoration:none;">${escX(o.dtRef)}</a></td>
                <td style="padding:10px 14px;color:#374151;font-weight:600;">${escX(o.client)}</td>
                <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${escX(o.pieces.join(', '))}</td>
                <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${o.montant.toLocaleString('fr-FR')} €${(()=>{ const a=avoirDispo(o.client); if(a>0){ const dev=Math.min(a,o.montant); const net=Math.max(0,o.montant-dev); return `<div style="font-size:.64rem;color:#16a34a;font-weight:700;margin-top:2px;" title="Avoir(s) en cours du client — décompté à l'acceptation">− avoir ${dev.toLocaleString('fr-FR')} €</div><div style="font-size:.72rem;color:#4338ca;font-weight:800;">net ${net.toLocaleString('fr-FR')} €</div>`; } return ''; })()}</td>
                <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${escX(o.validite)}</td>
                <td style="padding:10px 14px;text-align:center;">${statusBadge(o.statut)}</td>
                <td style="padding:10px 14px;text-align:center;">
                  <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                    <button onclick="voirOffre('${o.id}')" style="padding:4px 10px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-eye mr-1"></i>Voir</button>
                    ${isAttente ? `
                    <button onclick="validerOffre('${o.id}','${o.numAffaire}','${o.client}',${o.montant})" style="padding:4px 10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-1"></i>Validé</button>
                    <button onclick="negocierOffre('${o.id}')" style="padding:4px 10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-sync mr-1"></i>Négocier</button>
                    <button onclick="refuserOffre('${o.id}')" style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-times mr-1"></i>Refusé</button>
                    ` : ''}
                  </div>
                </td>
              </tr>`}).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- STATS PIPELINE -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        ${[['Offres en attente', String((OFFRES_DATA as any[]).filter((o:any)=>o.statut==='offre_en_attente').length),'#f59e0b'],['En attente réponse client', String((OFFRES_DATA as any[]).filter((o:any)=>o.statut==='en_attente_reponse').length),'#6366f1'],['Annulées', String((OFFRES_DATA as any[]).filter((o:any)=>o.statut==='annulee').length),'#ef4444'],['Converties CMD', String((OFFRES_DATA as any[]).filter((o:any)=>/command|convert|gagn/.test(String(o.statut||'').toLowerCase())).length),'#22c55e']].map(([l,v,c])=>`
        <div style="background:white;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div>
          <div style="font-size:.7rem;color:#6b7280;font-weight:600;margin-top:2px;">${l}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- FORMULAIRE NOUVELLE OFFRE -->
    <div id="panelOff-form" style="display:none;">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:20px;">
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-hashtag" style="color:#6366f1;"></i>Référence offre<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span></div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#1d4ed8;margin-bottom:14px;">
          <i class="fas fa-link mr-2"></i>Le N° d'offre = N° DT = N° CMD : <strong>OFF-2026-XXXX</strong> (même N° affaire unique)
        </div>
        <!-- MODE : DT ou standalone -->
        <div style="display:flex;gap:10px;margin-bottom:14px;">
          <label style="display:flex;align-items:center;gap:8px;background:#eff6ff;border:2px solid #3b82f6;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:.8rem;font-weight:700;color:#1d4ed8;flex:1;">
            <input type="radio" name="offre-origine" value="dt" checked onchange="setOffreOrigine('dt')" style="accent-color:#3b82f6;"/>
            <i class="fas fa-file-alt mr-1" style="color:#3b82f6;"></i>Depuis une DT (même N° affaire)
          </label>
          <label style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:.8rem;font-weight:600;color:#374151;flex:1;" id="offreStandaloneLabel">
            <input type="radio" name="offre-origine" value="standalone" onchange="setOffreOrigine('standalone')" style="accent-color:#6366f1;"/>
            <i class="fas fa-plus mr-1" style="color:#6366f1;"></i>Offre directe (nouveau N° incrémental)
          </label>
        </div>
        <!-- DT selector (visible if dt mode) -->
        <div id="offreDTBlock">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
            <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° DT associé <span style="color:#ef4444;">*</span></label>
              <select class="form-input" onchange="onOffreDTChange(this.value)">
                <option value="">— Sélectionner une DT (statut: dans offres) —</option>
              </select>
            </div>
            <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date validité offre</label><input type="date" class="form-input"/></div>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid #e2e8f0;" id="offreFicheClient">
            <div style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Fiche client (auto-remplie depuis DT)</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:.8rem;" id="offreFicheClientGrid">
              <div style="color:#9ca3af;font-style:italic;">Sélectionner une DT pour auto-remplir</div>
            </div>
          </div>
        </div>
        <!-- Standalone block (visible if standalone mode) -->
        <div id="offreStandaloneBlock" style="display:none;">
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.8rem;color:#5b21b6;">
            <i class="fas fa-hashtag mr-2"></i>Un nouveau N° d'affaire sera créé automatiquement : <strong>OFF-2026-XXXX</strong> (ce numéro ne sera jamais attribué à une DT)
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
            <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client <span style="color:#ef4444;">*</span></label>
              <select class="form-input">
                <option value="">— Sélectionner un client —</option>
                ${CLIENTS_DATA.map(c=>`<option value="${escX(c.id)}">${escX(c.nom)}</option>`).join('')}
              </select>
            </div>
            <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date validité offre</label><input type="date" class="form-input"/></div>
          </div>
        </div>
        <div id="offreProduits">
          <div class="offre-produit-row" style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid #e2e8f0;">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:8px;">
              <div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Pièce / Réf</label><input type="text" class="form-input" placeholder="CARTER-B07"/></div>
              <div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Qté <span style="color:#ef4444;">*</span></label><input type="number" class="form-input" value="1"/></div>
              <div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">PRU HT (€)</label><input type="number" class="form-input" value="0.00"/></div>
              <div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Coeff.</label><input type="number" class="form-input" value="1.00"/></div>
              <div><label style="display:block;font-size:.65rem;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:.3rem;">Marge %</label><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:.45rem;font-size:.85rem;font-weight:800;color:#15803d;text-align:right;">—</div></div>
            </div>
          </div>
        </div>
        <button onclick="addOffreProduit()" style="background:#f1f5f9;border:1.5px dashed #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.78rem;font-weight:600;color:#64748b;cursor:pointer;width:100%;margin-bottom:14px;"><i class="fas fa-plus mr-2"></i>Ajouter un produit</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Frais transport (€)</label><input type="number" class="form-input" value="0"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Délai de livraison estimé</label><input type="text" class="form-input" placeholder="Ex: 4 semaines"/></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;"><i class="fas fa-save mr-1"></i>Enregistrer brouillon</button>
          <button onclick="envoyerOffre()" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;padding:10px 24px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane mr-2"></i>Envoyer l'offre</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL RENTRÉE DE COMMANDE (après acceptation offre) -->
  <div id="modalRentreeCmd" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:700px;width:95%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:1rem;font-weight:800;color:#15803d;margin:0;"><i class="fas fa-check-circle mr-2" style="color:#22c55e;"></i>Rentrée de Commande – Validation offre acceptée</h3>
        <button onclick="closeModal('modalRentreeCmd')" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;color:#6b7280;font-size:.9rem;"><i class="fas fa-times"></i></button>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;margin-bottom:16px;font-size:.82rem;color:#15803d;">
        <i class="fas fa-info-circle mr-2"></i>Les informations ci-dessous sont <strong>pré-remplies automatiquement</strong> depuis la DT et l'offre commerciale. Vérifier et valider pour créer la commande.
      </div>
      <div id="rentreeInfos" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;"></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;">
        <span style="font-weight:700;color:#1d4ed8;"><i class="fas fa-hashtag mr-1"></i>N° de commande qui sera créé :</span> <span id="newCmdId" style="font-size:1rem;font-weight:800;color:#1d4ed8;"></span>
        <div style="font-size:.72rem;color:#64748b;margin-top:4px;">Ce numéro est identique au N° d'affaire (DT = OFF = CMD)</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date de livraison confirmée</label><input type="date" class="form-input" id="rentreeDateLiv"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° BC Client</label><input type="text" class="form-input" id="rentreeBCClient" placeholder="N° bon de commande client"/></div>
      </div>
      <div style="margin-bottom:16px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Commentaires / Conditions particulières</label><textarea rows="2" class="form-input" placeholder="Conditions spéciales…"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button onclick="closeModal('modalRentreeCmd')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="validerRentreeCmd()" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:10px;padding:10px 28px;font-size:.83rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(34,197,94,.3);"><i class="fas fa-check mr-2"></i>Valider &amp; Créer la CMD</button>
      </div>
    </div>
  </div>

  <!-- MODAL VOIR OFFRE -->
  <div id="modalVoirOffre" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:720px;width:95%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:1rem;font-weight:800;color:#6366f1;margin:0;"><i class="fas fa-file-invoice-dollar mr-2"></i>Détail de l'offre commerciale</h3>
        <button onclick="closeModal('modalVoirOffre')" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;color:#6b7280;font-size:.9rem;"><i class="fas fa-times"></i></button>
      </div>
      <div id="modalVoirOffreContent" style="font-size:.82rem;"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px;">
        <button onclick="closeModal('modalVoirOffre')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Fermer</button>
      </div>
    </div>
  </div>

  <!-- MODAL NEGOCIATION -->
  <div id="modalNegociation" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:500px;width:90%;">
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;color:#d97706;"><i class="fas fa-sync mr-2"></i>Offre à négocier</h3>
      <p style="font-size:.82rem;color:#6b7280;margin-bottom:14px;">L'offre <strong id="negocOffId"></strong> va être rouverte pour modification. Renseigner le point à négocier :</p>
      <textarea rows="3" class="form-input" placeholder="Ex: Réduire délai de 4 à 3 semaines. Réviser prix unitaire sur lot > 500 pcs…" style="margin-bottom:14px;"></textarea>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button onclick="closeModal('modalNegociation')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="confirmerNegociation()" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:10px;padding:8px 20px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-edit mr-1"></i>Rouvrir l'offre</button>
      </div>
    </div>
  </div>

  <script>
  var currentOffreId='', currentOffreAffaire='';
  var OFFRES_JS=${sjX(OFFRES_DATA)};
  var DT_JS_OFF=${sjX(DT_DATA)};

  function switchTabOffre(tab){
    var panels=['liste','form'];
    panels.forEach(function(t){
      var p=document.getElementById('panelOff-'+t);
      var b=document.getElementById('tabOff-'+t);
      if(p) p.style.display=(t===tab)?'block':'none';
      if(b){ b.style.background=(t===tab)?'white':'transparent'; b.style.fontWeight=(t===tab)?'700':'600'; b.style.boxShadow=(t===tab)?'0 1px 3px rgba(0,0,0,.1)':'none'; }
    });
  }

  function setOffreOrigine(mode){
    var dtBlock=document.getElementById('offreDTBlock');
    var saBlock=document.getElementById('offreStandaloneBlock');
    var saLabel=document.getElementById('offreStandaloneLabel');
    if(dtBlock) dtBlock.style.display=(mode==='dt')?'block':'none';
    if(saBlock) saBlock.style.display=(mode==='standalone')?'block':'none';
    if(saLabel){ saLabel.style.border=(mode==='standalone')?'2px solid #6366f1':'2px solid #e2e8f0'; saLabel.style.background=(mode==='standalone')?'#eff6ff':'#f8fafc'; }
  }

  function onOffreDTChange(dtId){
    var grid=document.getElementById('offreFicheClientGrid');
    if(!dtId||!grid) return;
    var dt=null;
    for(var i=0;i<DT_JS_OFF.length;i++){ if(DT_JS_OFF[i].id===dtId){ dt=DT_JS_OFF[i]; break; } }
    if(!dt){ grid.innerHTML='<div style="color:#9ca3af;font-style:italic;">DT introuvable</div>'; return; }
    grid.innerHTML='<div style="background:white;border-radius:7px;padding:8px 10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">Client</div><div style="font-weight:700;color:#374151;font-size:.78rem;margin-top:2px;">'+dt.client+'</div></div>'
      +'<div style="background:white;border-radius:7px;padding:8px 10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">N° Affaire</div><div style="font-weight:800;color:#6366f1;font-size:.78rem;margin-top:2px;">'+dt.numAffaire+'</div></div>'
      +'<div style="background:white;border-radius:7px;padding:8px 10px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">Pièce(s)</div><div style="font-weight:600;color:#374151;font-size:.78rem;margin-top:2px;">'+dt.pieces.join(', ')+'</div></div>';
  }

  function filtrerOffre(s){
    document.querySelectorAll('[data-of]').forEach(function(b){ b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.border='1.5px solid #e2e8f0'; });
    var btn=document.querySelector('[data-of="'+s+'"]');
    if(btn){ btn.style.background='#e0e7ff'; btn.style.color='#3730a3'; btn.style.border='1.5px solid #c7d2fe'; }
    document.querySelectorAll('#offresTable tbody tr').forEach(function(tr){
      tr.style.display=(s==='tous'||(tr.dataset.offreStatut===s))?'':'none';
    });
  }

  function voirOffre(id){
    var o=null;
    for(var i=0;i<OFFRES_JS.length;i++){ if(OFFRES_JS[i].id===id){ o=OFFRES_JS[i]; break; } }
    if(!o){ pushNotif('err','fa-times','Offre introuvable.',3000); return; }
    var dt=null;
    for(var j=0;j<DT_JS_OFF.length;j++){ if(DT_JS_OFF[j].numAffaire===o.numAffaire){ dt=DT_JS_OFF[j]; break; } }
    var content=document.getElementById('modalVoirOffreContent');
    if(!content) return;
    var dtBlock=dt?'<div style="background:#f8fafc;border-radius:9px;padding:14px;border:1px solid #e2e8f0;margin-top:14px;"><div style="font-size:.7rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:10px;"><i class="fas fa-tasks" style="color:#3b82f6;margin-right:6px;"></i>DT Liée – '+dt.id+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:.8rem;">'
      +'<div style="background:white;border-radius:7px;padding:8px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">Type</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+dt.type+'</div></div>'
      +'<div style="background:white;border-radius:7px;padding:8px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">Analyste BE</div><div style="font-weight:600;color:#374151;margin-top:2px;">'+dt.analyste+'</div></div>'
      +'<div style="background:white;border-radius:7px;padding:8px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#9ca3af;font-weight:700;text-transform:uppercase;">Budget estimé</div><div style="font-weight:700;color:#1d4ed8;margin-top:2px;">'+Number(dt.budget).toLocaleString('fr-FR')+' \u20ac</div></div>'
      +'</div></div>' : '';
    content.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;">'
      +'<div style="background:#eff6ff;border-radius:9px;padding:12px;border:1px solid #c7d2fe;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">N° Offre</div><div style="font-weight:800;color:#6366f1;font-size:.9rem;margin-top:3px;">'+o.id+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:12px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">N° Affaire</div><div style="font-weight:800;color:#1d4ed8;font-size:.9rem;margin-top:3px;">'+o.numAffaire+'</div></div>'
      +'<div style="background:#f0fdf4;border-radius:9px;padding:12px;border:1px solid #bbf7d0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Montant HT</div><div style="font-weight:800;color:#15803d;font-size:.9rem;margin-top:3px;">'+Number(o.montant).toLocaleString('fr-FR')+' \u20ac</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:12px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Client</div><div style="font-weight:700;color:#374151;margin-top:3px;">'+o.client+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:12px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Validité</div><div style="font-weight:700;color:#374151;margin-top:3px;">'+o.validite+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:12px;border:1px solid #e2e8f0;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;">Vendeur</div><div style="font-weight:700;color:#374151;margin-top:3px;">'+o.vendeur+'</div></div>'
      +'</div>'
      +'<div style="background:#f8fafc;border-radius:9px;padding:12px;border:1px solid #e2e8f0;margin-bottom:8px;"><div style="font-size:.62rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Pièce(s)</div><div style="font-weight:600;color:#374151;">'+o.pieces.join(', ')+'</div></div>'
      +dtBlock;
    var m=document.getElementById('modalVoirOffre');
    if(m) m.style.display='flex';
  }

  function validerOffre(id,affaire,client,montant){
    currentOffreId=id; currentOffreAffaire=affaire;
    var inf=document.getElementById('rentreeInfos');
    var newId=document.getElementById('newCmdId');
    if(inf) inf.innerHTML='<div style="background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Client</div><div style="font-weight:700;color:#374151;">'+client+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Montant HT</div><div style="font-weight:800;color:#15803d;">'+Number(montant).toLocaleString('fr-FR')+' \u20ac</div></div>'
      +'<div style="background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:4px;">N\u00b0 Offre</div><div style="font-weight:700;color:#6366f1;">'+id+'</div></div>'
      +'<div style="background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;"><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:4px;">N\u00b0 Affaire</div><div style="font-weight:700;color:#374151;">'+affaire+'</div></div>';
    if(newId) newId.textContent='CMD-2026-'+affaire;
    var m=document.getElementById('modalRentreeCmd');
    if(m) m.style.display='flex';
  }

  async function validerRentreeCmd(){
    var dl=(document.getElementById('rentreeDateLiv')||{}).value||null;
    var bc=(document.getElementById('rentreeBCClient')||{}).value||null;
    try{
      var r=await fetch('/api/offre/'+encodeURIComponent(currentOffreId)+'/accepter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_liv:dl,bc_client:bc})});
      var j=await r.json();
      if(!j.ok){ pushNotif('err','fa-ban',j.error||'Cr\u00e9ation commande impossible'); return; }
      var cid=(j.commande&&j.commande.id)||('CMD-2026-'+currentOffreAffaire);
      pushNotif('ok','fa-check-circle','Commande '+cid+(j.already?' (d\u00e9j\u00e0 cr\u00e9\u00e9e)':' cr\u00e9\u00e9e')+' ! Disponible pour la production.',6000);
      closeModal('modalRentreeCmd');
      setTimeout(function(){ softReload(); },900);
    }catch(e){ pushNotif('err','fa-ban','Erreur r\u00e9seau lors de la cr\u00e9ation de la commande'); }
  }

  function negocierOffre(id){
    currentOffreId=id;
    var el=document.getElementById('negocOffId');
    if(el) el.textContent=id;
    var m=document.getElementById('modalNegociation');
    if(m) m.style.display='flex';
  }

  function confirmerNegociation(){
    pushNotif('info','fa-sync','Offre '+currentOffreId+' rouverte pour modification.',4000);
    closeModal('modalNegociation');
    switchTabOffre('form');
  }

  async function refuserOffre(id){
    if(await appConfirm("Confirmer le refus de l'offre "+id+" ? Cette action est d\u00e9finitive et l'offre passera en statut Annul\u00e9e."))
      pushNotif('warn','fa-times-circle','Offre '+id+' annul\u00e9e. DT associ\u00e9e archiv\u00e9e.',5000);
  }

  function addOffreProduit(){ pushNotif('info','fa-plus','Produit ajout\u00e9.',3000); }
  function envoyerOffre(){ pushNotif('ok','fa-paper-plane','Offre envoy\u00e9e au client. Statut pass\u00e9 en : En attente r\u00e9ponse client.',5000); switchTabOffre('liste'); }
  function closeModal(id){ var m=document.getElementById(id); if(m) m.style.display='none'; }
  </script>`
  return layout('Offres Commerciales', content, 'offre')
}

// ══════════════════════════════════════════════════════════════
// PAGE ÉDITION D'OFFRE — au design de « l'analyse DT ».
// Résumé des coûts par produit (depuis dt.pieces_detail), coefficient de
// marge PAR produit (× → PV en direct), certifications/traçabilité selon
// la norme exigée par le client, et avoirs applicables du client.
// La marge par produit est persistée dans pieces_detail[].marge_pct de la
// DT liée (1:1 avec l'offre) ; l'offre garde ses totaux dérivés.
// ══════════════════════════════════════════════════════════════
export const pageOffreEdit = (offreRaw: any, dt: any, avoirs: any[], client?: any) => {
  const o = mapOffre((offreRaw || {}) as any)
  const clModeReglement = (client && (client.mode_facturation || '')) || o.modeReglement || ''
  // Mode de règlement ÉDITABLE dans l'offre (options = celles de la fiche client) ; synchronisé vers le client à l'enregistrement.
  const REGL_OPTS = MODES_FACTURATION
  const _curRegl = String(clModeReglement || '')
  const oeReglementOptions = ['<option value="">— Choisir —</option>']
    .concat((_curRegl && REGL_OPTS.indexOf(_curRegl) < 0 ? [_curRegl].concat(REGL_OPTS) : REGL_OPTS).map((oo: string) => `<option${oo === _curRegl ? ' selected' : ''}>${escX(oo)}</option>`))
    .join('')
  const pieces: any[] = (dt && Array.isArray(dt.pieces_detail)) ? dt.pieces_detail : []
  const avAll: any[] = Array.isArray(avoirs) ? avoirs : []
  // Seuls les avoirs « à déduire de la commande suivante » (restés en mémoire) — ou legacy sans mode — sont proposés à l'offre.
  const av: any[] = avAll.filter(a => { const m = String((a && a.mode_restitution) || ''); return m === 'deduire_suivante' || m === '' })
  const eur = (v: number) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const avTotal = av.reduce((s, a) => s + (Number(a && a.solde) || 0), 0)

  // Exigences normatives agrégées (dé-dupliquées) + traitements de surface = traçabilité produit
  const exigsAll: string[] = []
  pieces.forEach(p => (Array.isArray(p.exigences) ? p.exigences : []).forEach((e: string) => { if (e && exigsAll.indexOf(e) < 0) exigsAll.push(e) }))
  const traits: string[] = []
  pieces.forEach(p => {
    if (p.oxydation_anodique) traits.push('Oxydation anodique')
    if (p.oxydation_noire) traits.push('Oxydation noire')
    if (p.traitement) traits.push(String(p.traitement))
  })
  const traitsU = Array.from(new Set(traits))

  // Exigences de traçabilité PROPRES à chaque norme (pas une déclaration de certification de notre part)
  const NORME_TRACA: Record<string, string> = {
    'ISO 9001': 'Maîtrise des enregistrements, identification et traçabilité du produit (§8.5.2).',
    'EN 9100': 'Aéronautique : traçabilité matière, rapport de premier article (FAI §8.5.1.3), identification & traçabilité renforcées (§8.5.2).',
    'EN 13485': 'Dispositifs médicaux : traçabilité par lot, dossier de lot conservé.',
    'REACH': 'Traçabilité des substances chimiques (déclaration SVHC).',
    'RoHS': 'Documentation matière / revêtement (substances dangereuses).',
  }

  // ─── COEFFICIENT MULTIPLICATEUR ↔ TAUX DE MARQUE ───────────────────────────
  // Référentiel Seem Semrac (tableau « Coefficient de marges ») :
  //   PV = CRU × k   et   taux de marque = (PV − PR) / PV = (k − 1) / k
  //   ⇒ k = 1 / (1 − taux).   Ex. k=2 → 50 % ; k=2,5 → 60 % ; k=3,05 → 67,21 %.
  // `coeff` est la SOURCE DE VÉRITÉ (stockée dans pieces_detail, jsonb → sans migration) ;
  // `marge_pct` en est dérivé et vaut le TAUX DE MARQUE (et non plus une marge sur coût).
  const coeffDe = (p: any) => {
    const k = Number(p?.coeff)
    if (isFinite(k) && k > 0) return k
    const m = Math.min(99.9, Number(p?.marge_pct) || 0)
    return m > 0 ? 1 / (1 - m / 100) : 1
  }

  // Tableau de référence « COEFFICIENT DE MARGES » (document interne Seem Semrac), consultable
  // depuis l'offre. Les taux affichés sont TRONQUÉS à 2 décimales, comme sur le document papier.
  const COEF_TABLE: Array<[number, number]> = [
    [10, 1.12], [20, 1.26], [25, 1.34], [30, 1.43], [35, 1.54], [40, 1.67], [45, 1.82], [50, 2],
    [55, 2.23], [60, 2.5], [62, 2.63], [63, 2.7], [64, 2.8], [65, 2.88], [66, 2.95], [67, 3.05],
  ]
  const trunc2 = (v: number) => (Math.floor(v * 100) / 100).toFixed(2).replace('.', ',')
  const coefTableHtml = `
    <div id="coefTableModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9500;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)coefTableToggle(false)">
      <div style="background:white;border-radius:16px;max-width:620px;width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);">
        <div style="padding:14px 20px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="font-weight:800;font-size:.95rem;letter-spacing:.02em;"><i class="fas fa-table" style="margin-right:8px;"></i>COEFFICIENT DE MARGES</div>
          <button type="button" onclick="coefTableToggle(false)" title="Fermer (Échap)" style="background:rgba(255,255,255,.15);border:none;color:white;font-size:1rem;cursor:pointer;border-radius:8px;width:30px;height:30px;"><i class="fas fa-times"></i></button>
        </div>
        <div style="padding:16px 20px;overflow:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
            <thead><tr style="background:#f1f5f9;">
              <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:.66rem;text-transform:uppercase;color:#475569;">PRI coefficienté des FG</th>
              <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:.66rem;text-transform:uppercase;color:#475569;">Marge</th>
              <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:.66rem;text-transform:uppercase;color:#475569;">Coefficient multiplicateur</th>
              <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:.66rem;text-transform:uppercase;color:#475569;">Taux de Marque</th>
            </tr></thead>
            <tbody>
              ${COEF_TABLE.map(([m, k]) => `<tr>
                <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#64748b;">100</td>
                <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-weight:700;">${m}%</td>
                <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-weight:800;color:#4338ca;">${String(k).replace('.', ',')}</td>
                <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-weight:700;color:#15803d;">${trunc2((k - 1) / k * 100)}%</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div style="margin-top:12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:10px 12px;font-size:.74rem;color:#3730a3;line-height:1.5;">
            <strong>PV = PRI × coefficient</strong> · <strong>Taux de marque = (PV − PRI) / PV</strong><br/>
            Le coefficient qui atteint un taux visé vaut <strong>1 / (1 − taux)</strong> — ex. 50 % → ×2 ; 60 % → ×2,5 ; 67 % → ×3,05.
            <div style="margin-top:6px;color:#4f46e5;font-size:.7rem;">Les taux ci-dessus sont <em>tronqués</em> à 2 décimales comme sur le document papier ; l'offre, elle, <em>arrondit</em> (écart possible de 0,01 — ex. ×1,43 = 30,06 % ici, 30,07 % dans l'offre).</div>
          </div>
        </div>
      </div>
    </div>`

  // Données pour le JS client (recalcul PV / marge / net en direct)
  const lignesData = pieces.map((p, i) => ({
    ref: p.ref_interne || ('P' + (i + 1)),
    qte: Math.max(1, Number(p.quantite) || 1),
    cru: Number(p.cru) || 0,
    coeff: +coeffDe(p).toFixed(4),
  }))

  const costTile = (label: string, v: number, col: string, strong = false) =>
    `<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:8px 10px;text-align:center;">
      <div style="font-size:.58rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-bottom:2px;">${label}</div>
      <div style="font-size:${strong ? '.92rem' : '.82rem'};font-weight:${strong ? 900 : 700};color:${col};">${eur(v)}</div>
    </div>`
  const lab = (t: string) => `<div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-bottom:3px;">${t}</div>`
  const inpStyle = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.9rem;font-weight:700;box-sizing:border-box;'

  const produitsHtml = pieces.length ? pieces.map((p, i) => {
    const cru = Number(p.cru) || 0, qte = Math.max(1, Number(p.quantite) || 1)
    const mat = Number(p.cout_matiere) || 0, acc = Number(p.cout_accessoire) || 0, mo = Number(p.cout_mo) || 0, st = Number(p.cout_st) || 0, fg = Number(p.cout_fg) || 0
    const coeff0 = coeffDe(p)
    const tiers = Array.isArray(p.quantites_chiffrage) ? p.quantites_chiffrage : []
    const tiersHtml = tiers.length > 1
      ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">${tiers.map((t: any) => `<span style="font-size:.66rem;background:#f5f3ff;border:1px solid #e9d5ff;border-radius:10px;padding:2px 8px;color:#5b21b6;">×${Math.max(1, Number(t.quantite) || 1)} → CRU ${eur(Number(t.cru) || 0)}/pc</span>`).join('')}</div>`
      : ''
    const exigChips = (Array.isArray(p.exigences) ? p.exigences : []).map((e: string) => `<span style="font-size:.62rem;background:#ecfeff;border:1px solid #cffafe;border-radius:10px;padding:1px 8px;color:#0e7490;font-weight:700;">${escX(e)}</span>`).join(' ')
    return card(`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;font-weight:900;display:flex;align-items:center;justify-content:center;">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-weight:800;color:#111827;font-family:monospace;">${escX(p.ref_interne || '?')}</div>
          <div style="font-size:.72rem;color:#6b7280;">${escX(p.nom_plan || p.ref_client || '')} · quantité ${qte}${exigChips ? ' · ' + exigChips : ''}</div>
        </div>
      </div>
      ${sec('Résumé des coûts (issu de l\'analyse DT)', 'fa-calculator')}
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px;">
        ${costTile('Matière', mat, '#d97706')}
        ${costTile('Accessoires', acc, '#8b5cf6')}
        ${costTile('MO + machine', mo, '#6366f1')}
        ${costTile('Sous-traitance', st, '#0d9488')}
        ${costTile('Frais gén. /lot', fg, '#b45309')}
        ${costTile('CRU /pièce', cru, '#15803d', true)}
      </div>
      ${tiersHtml}
      ${sec('Coefficient de marge', 'fa-percent')}
      <div style="display:grid;grid-template-columns:150px repeat(5,1fr);gap:10px;align-items:end;">
        <div>${lab('Coefficient (×)')}<input id="coef-${i}" type="number" step="0.01" min="0" value="${coeff0.toFixed(2)}" oninput="_oeRecompute()" style="${inpStyle}color:#4338ca;"/></div>
        <div>${lab('Taux de marque %')}<div id="pct-${i}" title="(PV − PR) / PV" style="font-size:.9rem;font-weight:800;color:#15803d;padding:8px 0;">— %</div></div>
        <div>${lab('Marge €/pièce')}<div id="mgu-${i}" style="font-size:.9rem;font-weight:800;color:#15803d;padding:8px 0;">—</div></div>
        <div>${lab('PV /pièce')}<div id="pv-${i}" style="font-size:.9rem;font-weight:800;color:#1d4ed8;padding:8px 0;">—</div></div>
        <div>${lab('Marge € série')}<div id="mgs-${i}" style="font-size:.9rem;font-weight:900;color:#15803d;padding:8px 0;">—</div></div>
        <div>${lab('PV série (× ' + qte + ')')}<div id="pvs-${i}" style="font-size:.9rem;font-weight:900;color:#111827;padding:8px 0;">—</div></div>
      </div>
    `)
  }).join('') : card(`<div style="text-align:center;color:#9ca3af;padding:20px;"><i class="fas fa-inbox" style="font-size:1.4rem;display:block;margin-bottom:8px;"></i>Aucun détail de coût rattaché à cette offre (DT liée introuvable ou non analysée).</div>`)

  const certifHtml = card(`
    ${sec('Certifications & traçabilité — norme(s) exigée(s) par le client', 'fa-certificate')}
    ${exigsAll.length ? `<div style="display:flex;flex-direction:column;gap:8px;">${exigsAll.map(e => {
      const ref = normeReferentiel(e)
      const traca = NORME_TRACA[e] || (ref ? 'Exigences documentaires du référentiel applicables.' : 'Exigence client (hors référentiel documenté).')
      return `<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 14px;">
        <div style="font-weight:800;color:#0e7490;font-size:.82rem;"><i class="fas fa-shield-halved" style="margin-right:6px;"></i>${escX(ref ? ref.label : e)}</div>
        <div style="font-size:.74rem;color:#475569;margin-top:3px;">${escX(traca)}</div>
      </div>`
    }).join('')}</div>` : `<div style="color:#9ca3af;font-size:.8rem;font-style:italic;">Aucune exigence normative renseignée sur la DT d'origine.</div>`}
    ${traitsU.length ? `<div style="margin-top:12px;"><span style="font-size:.7rem;font-weight:700;color:#6b7280;">Traçabilité traitement de surface : </span>${traitsU.map(t => `<span style="font-size:.66rem;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:1px 8px;color:#92400e;font-weight:700;">${escX(t)}</span>`).join(' ')}</div>` : ''}
  `)

  const avoirsHtml = card(`
    ${sec('Avoirs applicables — ' + escX(o.client || 'client de l\'offre'), 'fa-hand-holding-dollar')}
    ${av.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.78rem;">
      <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
        <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:.66rem;text-transform:uppercase;">Avoir</th>
        <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:.66rem;text-transform:uppercase;">Date</th>
        <th style="text-align:left;padding:8px 12px;color:#64748b;font-size:.66rem;text-transform:uppercase;">Motif</th>
        <th style="text-align:right;padding:8px 12px;color:#64748b;font-size:.66rem;text-transform:uppercase;">Solde applicable</th>
      </tr></thead><tbody>
      ${av.map(a => `<tr style="border-bottom:1px solid #f9fafb;">
        <td style="padding:8px 12px;font-family:monospace;font-weight:700;color:#6366f1;">${escX(a.id || a.num_avoir || '?')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${escX(a.date_credit || '—')}</td>
        <td style="padding:8px 12px;color:#374151;">${escX(a.motif || '—')}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:800;color:#15803d;">${eur(Number(a.solde) || 0)}</td>
      </tr>`).join('')}
      </tbody><tfoot><tr style="border-top:2px solid #f1f5f9;">
        <td colspan="3" style="padding:8px 12px;text-align:right;font-weight:700;color:#374151;">Total avoirs applicables</td>
        <td style="padding:8px 12px;text-align:right;font-weight:900;color:#15803d;">${eur(avTotal)}</td>
      </tr></tfoot></table></div>` : `<div style="color:#9ca3af;font-size:.8rem;font-style:italic;">Aucun avoir « à déduire de la commande suivante » pour ce client. Les avoirs à déduire d'une facture en cours sont traités à la facturation.</div>`}
    <div style="margin-top:8px;font-size:.7rem;color:#94a3b8;">Seuls les avoirs <strong>« à déduire de la commande suivante »</strong> sont proposés ici ; ils seront déduits <strong>à l'acceptation</strong> de l'offre (du plus ancien au plus récent). Les avoirs <strong>« à déduire d'une facture en cours »</strong> sont gérés côté facturation.</div>
  `)

  const content = `
    ${pageHeader('fas fa-file-invoice-dollar', '#6366f1,#4338ca', 'Édition de l\'offre ' + escX(o.id || ''), 'Résumé des coûts · marge par produit · certifications · avoirs client', ['OFF', 'Marge', 'Avoirs'])}
    <div style="max-width:1100px;margin:0 auto;padding:0 4px;">
      ${card(`
        <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;">
          <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Client</div><div style="font-weight:800;color:#111827;">${escX(o.client || '—')}</div></div>
          <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">DT liée</div><div style="font-weight:700;color:#3b82f6;">${escX(o.dtRef || '—')}</div></div>
          <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Statut</div>${statusBadge(o.statut || '')}</div>
          <div style="margin-left:auto;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
            <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Mode de règlement</div><select id="oe-reglement" title="Modifiable ici — synchronisé avec la fiche client" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.82rem;min-width:150px;">${oeReglementOptions}</select></div>
            <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Livraison</div><select id="oe-livraison" onchange="oeLivrChange()" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.82rem;"><option value="">— Choisir —</option><option value="franco"${o.modeLivraison==='franco'?' selected':''}>Franco (port inclus)</option><option value="depart_usine"${o.modeLivraison==='depart_usine'?' selected':''}>Départ usine</option></select></div>
            <div id="oe-transport-wrap" style="${o.modeLivraison==='franco'?'':'display:none;'}"><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Frais transport €</div><input id="oe-transport" type="number" min="0" step="0.01" value="${o.fraisTransport||''}" placeholder="0.00" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.82rem;width:110px;"/></div>
            <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Validité de l'offre</div><input id="oe-validite" type="date" value="${escX(o.validite || '')}" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.82rem;"/></div>
            <div><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Référence</div><button type="button" onclick="coefTableToggle(true)" title="Afficher le tableau des coefficients de marges" style="border:1.5px solid #c7d2fe;background:#eef2ff;color:#4338ca;border-radius:8px;padding:7px 12px;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-table" style="margin-right:6px;"></i>Table des coefficients</button></div>
          </div>
        </div>
      `)}
      ${produitsHtml}
      ${certifHtml}
      ${avoirsHtml}
      <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:14px;padding:22px;color:white;margin-bottom:20px;position:sticky;bottom:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:12px;text-align:center;"><div style="font-size:.62rem;opacity:.7;">Montant HT total</div><div id="synth-ht" style="font-size:1.25rem;font-weight:900;">—</div></div>
          <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:12px;text-align:center;"><div style="font-size:.62rem;opacity:.7;">Coût de revient</div><div id="synth-rev" style="font-size:1.25rem;font-weight:900;">—</div></div>
          <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:12px;text-align:center;"><div style="font-size:.62rem;opacity:.7;" title="(PV − PR) / PV">Taux de marque</div><div id="synth-marge" style="font-size:1.25rem;font-weight:900;">—</div></div>
          <div style="background:rgba(255,255,255,.16);border-radius:10px;padding:12px;text-align:center;"><div style="font-size:.62rem;opacity:.85;">Marge totale (€)</div><div id="synth-margeur" style="font-size:1.25rem;font-weight:900;color:#fde68a;">—</div></div>
          <div style="background:rgba(255,255,255,.18);border-radius:10px;padding:12px;text-align:center;"><div style="font-size:.62rem;opacity:.85;">Net après avoirs</div><div id="synth-net" style="font-size:1.02rem;font-weight:900;color:#86efac;">—</div></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button onclick="window.location.href='/commercial/service?'+Date.now()+'#offre'" style="padding:10px 20px;background:rgba(255,255,255,.15);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;">Annuler</button>
          <button onclick="saveOffre()" style="padding:10px 22px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer l'offre</button>
        </div>
      </div>
    </div>
    ${coefTableHtml}
    <script>
    (function(){
      var OFF_ID = ${sjX(o.id || '')};
      var AVOIRS_TOTAL = ${Number(avTotal) || 0};
      var lignes = ${sjX(lignesData)};
      var byId = function(x){ return document.getElementById(x); };
      var eur = function(v){ return (Math.round((Number(v)||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; };
      var setTxt = function(id,t){ var e=byId(id); if(e) e.textContent=t; };
      function recompute(){
        var mHT=0, mRev=0, sumM=0, n=0;
        for(var i=0;i<lignes.length;i++){
          var l=lignes[i]; var el=byId('coef-'+i); var coeff=el?parseFloat(el.value):l.coeff;
          if(!isFinite(coeff)||coeff<0) coeff=0;
          // TAUX DE MARQUE = (PV − PR) / PV = (k − 1) / k  (et non plus (k−1) : marge sur coût)
          var pv=l.cru*coeff, pvS=pv*l.qte, revS=l.cru*l.qte, pct=(coeff>0?((coeff-1)/coeff*100):0);
          var mgU=pv-l.cru, mgS=mgU*l.qte;
          mHT+=pvS; mRev+=revS; sumM+=pct; n++;
          setTxt('pct-'+i, (Math.round(pct*10)/10).toFixed(1)+' %');
          setTxt('mgu-'+i, eur(mgU));
          setTxt('pv-'+i, eur(pv));
          setTxt('mgs-'+i, eur(mgS));
          setTxt('pvs-'+i, eur(pvS));
        }
        // Taux de marque GLOBAL de l'offre = (PV total − PR total) / PV total
        //   (et non la moyenne des pourcentages ligne à ligne, qui ignore les quantités).
        var marge = mHT>0 ? (mHT-mRev)/mHT*100 : 0;
        var margeEur = mHT - mRev;
        var net = Math.max(0, mHT - Math.min(AVOIRS_TOTAL, mHT));
        setTxt('synth-ht', eur(mHT));
        setTxt('synth-rev', eur(mRev));
        setTxt('synth-marge', (Math.round(marge*10)/10).toFixed(1)+' %');
        setTxt('synth-margeur', eur(margeEur));
        setTxt('synth-net', eur(net) + (AVOIRS_TOTAL>0 ? ' (− '+eur(Math.min(AVOIRS_TOTAL,mHT))+' avoir)' : ''));
      }
      window._oeRecompute = recompute;
      function oeLivrChange(){ var s=(byId('oe-livraison')||{}).value; var w=byId('oe-transport-wrap'); if(w) w.style.display=(s==='franco')?'':'none'; }
      window.oeLivrChange=oeLivrChange;
      // Tableau de référence des coefficients : simple consultation (ouvrir / fermer).
      function coefTableToggle(open){ var m=byId('coefTableModal'); if(m) m.style.display=open?'flex':'none'; }
      window.coefTableToggle=coefTableToggle;
      document.addEventListener('keydown',function(e){ if(e.key==='Escape') coefTableToggle(false); });
      function saveOffre(){
        var out=[];
        for(var i=0;i<lignes.length;i++){ var el=byId('coef-'+i); var coeff=el?parseFloat(el.value):lignes[i].coeff; if(!isFinite(coeff)||coeff<0) coeff=0;
          // On envoie le COEFFICIENT (source de vérité) ; marge_pct = taux de marque dérivé.
          out.push({ ref_interne:lignes[i].ref, coeff:Math.round(coeff*10000)/10000, marge_pct:Math.round((coeff>0?((coeff-1)/coeff*100):0)*100)/100 }); }
        var val=(byId('oe-validite')||{}).value||null;
        var liv=(byId('oe-livraison')||{}).value||null;
        var trans=liv==='franco'?(parseFloat((byId('oe-transport')||{}).value)||0):0;
        var regl=(byId('oe-reglement')||{}).value||null;
        // Conditions commerciales (règlement synchro client + livraison/transport) d'abord, puis tarification (qui redirige).
        fetch('/api/offre/'+encodeURIComponent(OFF_ID),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode_livraison:liv, frais_transport:trans, mode_reglement:regl})}).catch(function(){}).then(function(){
        return fetch('/api/offre/'+encodeURIComponent(OFF_ID)+'/pricing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lignes:out, validite:val})}); })
          .then(function(r){ return r.json(); }).then(function(j){
            if(!j||!j.ok){ if(window.pushNotif) pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
            if(window.pushNotif) pushNotif('ok','fa-save','Offre '+OFF_ID+' mise à jour.',4000);
            if(window.ErpLock && OFF_ID) ErpLock.release('offre:'+OFF_ID);
            setTimeout(function(){ window.location.href='/commercial/service?'+Date.now()+'#offre'; }, 800);
          }).catch(function(){ if(window.pushNotif) pushNotif('err','fa-times','Erreur réseau.',5000); });
      }
      window.saveOffre = saveOffre;
      function boot(){ recompute(); if(window.ErpLock && OFF_ID){ ErpLock.acquire('offre:'+OFF_ID, { label:"Édition offre", onBlocked:function(by){ if(window.pushNotif) pushNotif('warn','fa-lock',"Offre en cours d'édition par "+by+".",6000); } }); } }
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
    })();
    </script>`
  return layout('Édition offre ' + (o.id || ''), content, 'offre')
}

// ══════════════════════════════════════════════════════════════
// PAGE DEMANDES SITE WEB → CRÉATION DT
// ══════════════════════════════════════════════════════════════
export const pageDemandesWeb = () => {

  const DEM = [
    { id:'DEM-2026-001', date:'12/03/2026', heure:'08:34', prenom:'Alexandre',     nom:'Rousseau', societe:'Plastinov Industries',         email:'a.rousseau@plastinov.fr',    tel:'05.53.44.XX.XX', designation:'DISSIP-PLAST-001',  activite:'Seem',   typeDemande:'Nouveau produit', priorite:'normal',   statut:'nouveau',       dtCree:'' },
    { id:'DEM-2026-002', date:'13/03/2026', heure:'14:17', prenom:'Marie-Claire',  nom:'Dubois',   societe:'Electronique Pro SAS',          email:'mc.dubois@elecpro.fr',        tel:'04.91.32.XX.XX', designation:'CARTER-EP-07',      activite:'Semrac', typeDemande:'Prototype',       priorite:'urgent',   statut:'nouveau',       dtCree:'' },
    { id:'DEM-2026-003', date:'10/03/2026', heure:'10:55', prenom:'Jean-Francois', nom:'Petit',    societe:'Aerotec Composants',            email:'jf.petit@aerotec.com',        tel:'05.61.87.XX.XX', designation:'SUPPORT-AERO-12',   activite:'Seem',   typeDemande:'MAS',             priorite:'critique', statut:'en_traitement', dtCree:'' },
    { id:'DEM-2026-004', date:'08/03/2026', heure:'16:03', prenom:'Sophie',        nom:'Renard',   societe:'Industrie Renard et Fils',      email:'s.renard@renard-ind.fr',      tel:'03.88.45.XX.XX', designation:'TOLE-F09-MAS',      activite:'Semrac', typeDemande:'MAS',             priorite:'normal',   statut:'converti',      dtCree:'DT-2026-1282' },
    { id:'DEM-2026-005', date:'05/03/2026', heure:'11:28', prenom:'Thomas',        nom:'Bernard',  societe:'Mecanique Haute Precision SARL',email:'t.bernard@mhp-sarl.com',      tel:'02.47.51.XX.XX', designation:'DISSIP-MHP-003',    activite:'Seem',   typeDemande:'Nouveau produit', priorite:'normal',   statut:'archive',       dtCree:'' },
  ]

  const badgeWeb = (s: string) => ({
    'nouveau':       '<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#b45309;border:1px solid #fde68a;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;"><i class="fas fa-exclamation-circle" style="font-size:.6rem;"></i>\u00a0Nouveau</span>',
    'en_traitement': '<span style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;"><i class="fas fa-clock" style="font-size:.6rem;"></i>\u00a0En traitement</span>',
    'converti':      '<span style="display:inline-flex;align-items:center;gap:4px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;"><i class="fas fa-check-circle" style="font-size:.6rem;"></i>\u00a0Converti en DT</span>',
    'archive':       '<span style="display:inline-flex;align-items:center;gap:4px;background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;"><i class="fas fa-archive" style="font-size:.6rem;"></i>\u00a0Archiv\u00e9</span>',
  }[s] || '<span>\u2014</span>')

  const badgePrio = (p: string) => ({
    'normal':   '<span style="background:#f1f5f9;color:#64748b;padding:1px 7px;border-radius:4px;font-size:.65rem;font-weight:700;">Standard</span>',
    'urgent':   '<span style="background:#fff7ed;color:#c2410c;padding:1px 7px;border-radius:4px;font-size:.65rem;font-weight:700;">Urgent</span>',
    'critique': '<span style="background:#fef2f2;color:#b91c1c;padding:1px 7px;border-radius:4px;font-size:.65rem;font-weight:700;">Critique</span>',
  }[p] || '')

  const nouveaux     = DEM.filter(d => d.statut === 'nouveau').length
  const enTraitement = DEM.filter(d => d.statut === 'en_traitement').length
  const convertis    = DEM.filter(d => d.statut === 'converti').length

  const content = `
  ${pageHeader('fas fa-globe','#3b82f6,#6366f1','Demandes Site Internet \u2013 Cr\u00e9ation DT','Corinne \u00b7 Formulaires web \u00b7 Conversion DT automatique \u00b7 Workflow',['DT','Web','CRM'])}
  <div style="padding:22px 30px;">

    <!-- BANDEAU WORKFLOW -->
    <div style="background:linear-gradient(135deg,#eff6ff,#e0e7ff);border:1px solid #bfdbfe;border-radius:12px;padding:12px 18px;margin-bottom:16px;font-size:.8rem;display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
      <span style="color:#1e3a8a;font-weight:700;white-space:nowrap;"><i class="fas fa-globe mr-2"></i>Workflow :</span>
      <span style="color:#374151;">🌐 <strong>Formulaire site web</strong></span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">📋 <strong>Re\u00e7ue ici</strong></span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">📝 <strong>DT cr\u00e9\u00e9e</strong> (champs pr\u00e9-remplis automatiquement)</span>
      <span style="color:#6b7280;">→</span>
      <span style="color:#374151;">🔬 <strong>Analyse BE → Offre → Commande</strong></span>
    </div>

    <!-- STATS -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${[
        ['Nouvelles demandes', nouveaux,     '#f59e0b', 'fa-exclamation-circle'],
        ['En traitement',      enTraitement, '#3b82f6', 'fa-clock'],
        ['Converties en DT',   convertis,    '#22c55e', 'fa-check-circle'],
        ['Total re\u00e7ues',  DEM.length,   '#6366f1', 'fa-globe'],
      ].map(([l,v,c,ic]) => `
      <div style="background:white;border-radius:12px;padding:14px 18px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:${c}20;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas ${ic}" style="color:${c};font-size:.9rem;"></i>
        </div>
        <div>
          <div style="font-size:1.4rem;font-weight:800;color:${c};line-height:1;">${v}</div>
          <div style="font-size:.68rem;color:#6b7280;font-weight:600;margin-top:2px;">${l}</div>
        </div>
      </div>`).join('')}
    </div>

    <!-- FILTRES -->
    <div style="background:white;border-radius:12px;padding:12px 18px;box-shadow:0 1px 3px rgba(0,0,0,.07);margin-bottom:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-right:4px;white-space:nowrap;"><i class="fas fa-filter mr-1"></i>Filtre :</span>
      ${[
        ['tous',          'Toutes',          '#6366f1'],
        ['nouveau',       'Nouvelles',        '#f59e0b'],
        ['en_traitement', 'En traitement',    '#3b82f6'],
        ['converti',      'Converties en DT', '#22c55e'],
        ['archive',       'Archiv\u00e9es',   '#6b7280'],
      ].map(([v,l,c],i) => `
      <button onclick="filtrerDemandes('${v}')" data-df="${v}" class="dem-filter-btn" style="padding:5px 14px;background:${i===0?c+'15':'#f1f5f9'};color:${i===0?c:'#6b7280'};border:1.5px solid ${i===0?c+'50':'#e2e8f0'};border-radius:20px;font-size:.73rem;font-weight:600;cursor:pointer;transition:all .15s;">${l}</button>`).join('')}
    </div>

    <!-- TABLE -->
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="demandesWebTable">
          <thead>
            <tr style="background:linear-gradient(135deg,#1e3a5f,#1e293b);">
              <th style="text-align:left;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">N\u00b0 Demande</th>
              <th style="text-align:left;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Re\u00e7ue le</th>
              <th style="text-align:left;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Contact / Soci\u00e9t\u00e9</th>
              <th style="text-align:left;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">D\u00e9signation pi\u00e8ce</th>
              <th style="text-align:center;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Activit\u00e9</th>
              <th style="text-align:center;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Priorit\u00e9</th>
              <th style="text-align:center;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Statut</th>
              <th style="text-align:center;padding:12px 14px;color:#94a3b8;font-size:.65rem;text-transform:uppercase;font-weight:700;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${DEM.map(d => `
            <tr data-dem-statut="${d.statut}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="padding:11px 14px;">
                <div style="font-weight:700;color:#3b82f6;font-size:.82rem;">${d.id}</div>
                ${d.dtCree ? `<div style="font-size:.66rem;color:#22c55e;font-weight:600;margin-top:2px;"><i class="fas fa-link" style="margin-right:3px;"></i>${d.dtCree}</div>` : ''}
              </td>
              <td style="padding:11px 14px;">
                <div style="font-weight:600;color:#374151;">${d.date}</div>
                <div style="font-size:.68rem;color:#9ca3af;">${d.heure}</div>
              </td>
              <td style="padding:11px 14px;">
                <div style="font-weight:600;color:#374151;">${escX(d.prenom)} ${escX(d.nom)}</div>
                <div style="font-size:.72rem;color:#6b7280;margin-top:1px;"><i class="fas fa-building" style="color:#94a3b8;margin-right:3px;font-size:.6rem;"></i>${escX(d.societe)}</div>
                <div style="font-size:.68rem;color:#9ca3af;margin-top:1px;">${escX(d.email)}</div>
              </td>
              <td style="padding:11px 14px;">
                <div style="font-weight:600;color:#374151;">${escX(d.designation)}</div>
                <div style="font-size:.7rem;color:#6b7280;">${escX(d.typeDemande)}</div>
              </td>
              <td style="padding:11px 14px;text-align:center;">
                <span style="background:${d.activite==='Seem'?'#eff6ff':'#fdf4ff'};color:${d.activite==='Seem'?'#1d4ed8':'#7e22ce'};border:1px solid ${d.activite==='Seem'?'#bfdbfe':'#e9d5ff'};padding:2px 9px;border-radius:6px;font-size:.68rem;font-weight:700;">${d.activite}</span>
              </td>
              <td style="padding:11px 14px;text-align:center;">${badgePrio(d.priorite)}</td>
              <td style="padding:11px 14px;text-align:center;">${badgeWeb(d.statut)}</td>
              <td style="padding:11px 14px;text-align:center;">
                <div style="display:flex;gap:5px;justify-content:center;">
                  <button onclick="ouvrirDemandeWeb('${d.id}')" style="padding:5px 12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-file-import mr-1"></i>Voir &amp; Cr\u00e9er DT</button>
                  ${d.statut === 'nouveau' ? `<button onclick="mettreEnTraitement('${d.id}',this)" style="padding:5px 9px;background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:7px;font-size:.7rem;font-weight:600;cursor:pointer;" title="Marquer en traitement"><i class="fas fa-clock"></i></button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- ═══ MODAL DEMANDE WEB + FORMULAIRE DT PRÉ-REMPLI ═══ -->
  <div id="modalDemandeWeb" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;">
    <div style="background:white;border-radius:16px;width:100%;max-width:860px;box-shadow:0 25px 80px rgba(0,0,0,.35);margin:auto;">

      <!-- En-tête modal -->
      <div style="background:linear-gradient(135deg,#1e3a5f,#3b82f6,#6366f1);border-radius:16px 16px 0 0;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:38px;height:38px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fas fa-globe" style="color:white;font-size:1rem;"></i>
          </div>
          <div>
            <div id="demWebModalTitle" style="color:white;font-weight:800;font-size:1rem;"></div>
            <div id="demWebModalSub" style="color:#bfdbfe;font-size:.72rem;margin-top:2px;"></div>
          </div>
        </div>
        <button onclick="fermerDemandeWeb()" style="background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);color:white;border-radius:8px;padding:7px 16px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-times mr-2"></i>Fermer</button>
      </div>

      <div style="padding:24px;">

        <!-- Bannière info web -->
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:11px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px;">
          <i class="fas fa-info-circle" style="color:#3b82f6;font-size:1.1rem;flex-shrink:0;margin-top:1px;"></i>
          <div style="font-size:.78rem;color:#1e3a8a;line-height:1.5;">
            <strong>Demande re\u00e7ue depuis le formulaire de contact du site internet.</strong><br>
            Les champs du formulaire DT ci-dessous sont <strong>pr\u00e9-remplis automatiquement</strong> avec les donn\u00e9es saisies par le demandeur.
            V\u00e9rifiez, compl\u00e9tez les champs manquants si n\u00e9cessaire, puis cliquez sur <strong>\u00ab\u00a0Cr\u00e9er la DT\u00a0\u00bb</strong>.
          </div>
        </div>

        <!-- Fichiers joints -->
        <div id="demWebFichiers" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:none;">
          <div style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:7px;"><i class="fas fa-paperclip" style="color:#6366f1;margin-right:5px;"></i>Fichiers joints par le demandeur</div>
          <div id="demWebFichiersListe" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
        </div>

        <!-- Message du demandeur -->
        <div id="demWebCommentaireBloc" style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:10px 14px;margin-bottom:18px;display:none;">
          <div style="font-size:.68rem;font-weight:700;color:#9a3412;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-comment-dots" style="margin-right:5px;"></i>Message du demandeur</div>
          <div id="demWebCommentaireTexte" style="font-size:.8rem;color:#374151;font-style:italic;line-height:1.5;"></div>
        </div>

        <!-- ══ FORMULAIRE DT PRÉ-REMPLI ══ -->
        <div style="border-top:2px solid #f1f5f9;padding-top:18px;">
          <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-file-alt" style="color:#3b82f6;"></i>Formulaire DT \u2014 \u00e0 valider &amp; soumettre
            <span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;display:block;"></span>
          </div>

          <!-- Identification -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
            <div>
              <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N\u00b0 DT <span style="color:#94a3b8;">(auto)</span></label>
              <input type="text" id="dtw_num" value="DT-2026-XXXX (auto)" disabled style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.78rem;background:#f9fafb;color:#9ca3af;box-sizing:border-box;"/>
            </div>
            <div>
              <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date r\u00e9ception <span style="color:#ef4444;">*</span></label>
              <input type="date" id="dtw_date" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
            </div>
            <div>
              <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Activit\u00e9 <span style="color:#ef4444;">*</span></label>
              <select id="dtw_activite" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.78rem;background:white;box-sizing:border-box;">
                <option value="Seem">Seem (aluminium)</option>
                <option value="Semrac">Semrac (t\u00f4lerie)</option>
              </select>
            </div>
          </div>

          <!-- Contact -->
          <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid #e2e8f0;">
            <div style="font-size:.65rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;"><i class="fas fa-user" style="color:#3b82f6;margin-right:5px;"></i>Contact demandeur</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Nom Pr\u00e9nom <span style="color:#ef4444;">*</span></label>
                <input type="text" id="dtw_contact" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Poste</label>
                <input type="text" id="dtw_poste" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Email <span style="color:#ef4444;">*</span></label>
                <input type="email" id="dtw_email" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">T\u00e9l\u00e9phone</label>
                <input type="tel" id="dtw_tel" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Soci\u00e9t\u00e9 / Raison sociale <span style="color:#ef4444;">*</span></label>
                <input type="text" id="dtw_societe" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Adresse</label>
                <input type="text" id="dtw_adresse" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
            </div>
          </div>

          <!-- Pièce -->
          <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid #e2e8f0;">
            <div style="font-size:.65rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;"><i class="fas fa-cube" style="color:#6366f1;margin-right:5px;"></i>Identification pi\u00e8ce</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;">
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">D\u00e9signation interne <span style="color:#ef4444;">*</span></label>
                <input type="text" id="dtw_designation" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">N\u00b0 pi\u00e8ce client</label>
                <input type="text" id="dtw_numpiece" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">N\u00b0 plan</label>
                <input type="text" id="dtw_numplan" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Quantit\u00e9 demand\u00e9e</label>
                <input type="number" id="dtw_quantite" min="1" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
              <div>
                <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">D\u00e9lai souhait\u00e9</label>
                <input type="date" id="dtw_delai" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:.38rem .65rem;font-size:.78rem;background:white;box-sizing:border-box;"/>
              </div>
            </div>
          </div>

          <!-- Type DT + Priorité -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
            <div>
              <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Type de DT / Raison <span style="color:#ef4444;">*</span></label>
              <select id="dtw_type" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.78rem;background:white;box-sizing:border-box;">
                <option value="">— S\u00e9lectionner —</option>
                <option value="MAS">MAS \u2014 Produit existant nouveau prix</option>
                <option value="Necessite">N\u00e9cessit\u00e9</option>
                <option value="Nouveau produit">Nouveau Produit</option>
                <option value="Modification code">Modification de code</option>
                <option value="Prototype">Prototype</option>
                <option value="Urgence">Urgence / D\u00e9lai sp\u00e9cifique</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Priorit\u00e9</label>
              <select id="dtw_priorite" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.78rem;background:white;box-sizing:border-box;">
                <option value="normal">Standard</option>
                <option value="urgent">Urgent</option>
                <option value="critique">Critique \u2013 livraison imp\u00e9rative</option>
              </select>
            </div>
          </div>

          <!-- Notes internes -->
          <div style="margin-bottom:18px;">
            <label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Notes internes / Commentaire BE</label>
            <textarea id="dtw_notes" rows="2" placeholder="Notes internes pour le BE (non visibles par le client)\u2026" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.78rem;background:white;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
          </div>
        </div>

        <!-- ACTIONS -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #f1f5f9;padding-top:16px;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="archiverDemande()" style="padding:8px 16px;background:#f9fafb;color:#6b7280;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-archive mr-2"></i>Archiver</button>
            <button id="btnMettreEnTraitement" onclick="mettreEnTraitementModal()" style="padding:8px 16px;background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;display:none;"><i class="fas fa-clock mr-2"></i>Mettre en traitement</button>
          </div>
          <button onclick="creerDTdepuisWeb()" style="padding:10px 24px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:800;cursor:pointer;box-shadow:0 2px 10px rgba(59,130,246,.4);display:flex;align-items:center;gap:8px;">
            <i class="fas fa-file-alt"></i>Cr\u00e9er la DT &amp; Archiver la demande
          </button>
        </div>

      </div>
    </div>
  </div>

  <script>
  // ── DONNÉES DEMANDES WEB ──────────────────────────────────────
  var WD = {
    "DEM-2026-001":{ prenom:"Alexandre", nom:"Rousseau", poste:"Responsable Achats",
      email:"a.rousseau@plastinov.fr", tel:"05.53.44.XX.XX",
      societe:"Plastinov Industries", adresse:"12 ZI de la Palue, 24000 Perigueux",
      activite:"Seem", typeDemande:"Nouveau produit", priorite:"normal",
      designation:"DISSIP-PLAST-001", numPiece:"PLT-4521-A", numPlan:"PLN-2026-PLT001",
      quantite:"200", delai:"2026-06-30",
      commentaire:"Dissipateur thermique pour boitier electronique. Alliage 6060. Anodisation doree requise. Voir plan joint.",
      fichiers:["Plan_DISSIP-PLAST-001.pdf","CAO_SolidWorks.step"], date:"12/03/2026", heure:"08:34", statut:"nouveau" },
    "DEM-2026-002":{ prenom:"Marie-Claire", nom:"Dubois", poste:"Directrice Technique",
      email:"mc.dubois@elecpro.fr", tel:"04.91.32.XX.XX",
      societe:"Electronique Pro SAS", adresse:"45 rue des Entrepreneurs, 13010 Marseille",
      activite:"Semrac", typeDemande:"Prototype", priorite:"urgent",
      designation:"CARTER-EP-07", numPiece:"EP-C07-V2", numPlan:"PLN-EP-C07",
      quantite:"5", delai:"2026-04-15",
      commentaire:"Prototype urgent pour salon industriel. Finition chrome mat obligatoire. 2 modeles de reference fournis.",
      fichiers:["CARTER-EP-07_v2.pdf"], date:"13/03/2026", heure:"14:17", statut:"nouveau" },
    "DEM-2026-003":{ prenom:"Jean-Francois", nom:"Petit", poste:"Chef Projet Approvisionnement",
      email:"jf.petit@aerotec.com", tel:"05.61.87.XX.XX",
      societe:"Aerotec Composants", adresse:"Zone Aero, 31700 Blagnac",
      activite:"Seem", typeDemande:"MAS", priorite:"critique",
      designation:"SUPPORT-AERO-12", numPiece:"ATC-S12-B", numPlan:"PLN-AERO-12",
      quantite:"1500", delai:"2026-05-01",
      commentaire:"Renouvellement contrat annuel. Quantites en hausse de 20% vs 2025. Norme EN9100 requise. Certification sous-traitant a jour.",
      fichiers:["Cahier_charges_AERO-12.pdf","Plan_SUPPORT-AERO-12_RevB.pdf"], date:"10/03/2026", heure:"10:55", statut:"en_traitement" },
    "DEM-2026-004":{ prenom:"Sophie", nom:"Renard", poste:"Responsable Achats",
      email:"s.renard@renard-ind.fr", tel:"03.88.45.XX.XX",
      societe:"Industrie Renard et Fils", adresse:"8 rue de la Metallurgie, 67100 Strasbourg",
      activite:"Semrac", typeDemande:"MAS", priorite:"normal",
      designation:"TOLE-F09-MAS", numPiece:"IRF-T09", numPlan:"PLN-T09-2025",
      quantite:"300", delai:"2026-05-30",
      commentaire:"Commande MAS habituelle, meme specification que 2025. Livraison en 2 fois si possible.",
      fichiers:[], date:"08/03/2026", heure:"16:03", statut:"converti" },
    "DEM-2026-005":{ prenom:"Thomas", nom:"Bernard", poste:"Ingenieur Conception",
      email:"t.bernard@mhp-sarl.com", tel:"02.47.51.XX.XX",
      societe:"Mecanique Haute Precision SARL", adresse:"21 av. des Ateliers, 37000 Tours",
      activite:"Seem", typeDemande:"Nouveau produit", priorite:"normal",
      designation:"DISSIP-MHP-003", numPiece:"MHP-D03", numPlan:"",
      quantite:"50", delai:"2026-07-31",
      commentaire:"Premier contact. Etude faisabilite avant engagement. Pas de plan disponible pour le moment.",
      fichiers:["Croquis_DISSIP-MHP-003.jpg"], date:"05/03/2026", heure:"11:28", statut:"archive" }
  };

  var currentDemId = "";

  // ── FILTRE ────────────────────────────────────────────────────
  function filtrerDemandes(s){
    document.querySelectorAll('.dem-filter-btn').forEach(function(b){
      b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0';
    });
    var btn=document.querySelector('[data-df="'+s+'"]');
    if(btn){ btn.style.background='#eff6ff'; btn.style.color='#1d4ed8'; btn.style.borderColor='#bfdbfe'; }
    document.querySelectorAll('#demandesWebTable tbody tr').forEach(function(tr){
      tr.style.display=(s==='tous'||tr.dataset.demStatut===s)?'':'none';
    });
  }

  // ── OUVRIR DEMANDE ────────────────────────────────────────────
  function ouvrirDemandeWeb(id){
    currentDemId=id;
    var d=WD[id];
    if(!d){ pushNotif('warn','fa-exclamation','Demande introuvable.',3000); return; }

    document.getElementById('demWebModalTitle').textContent='Demande '+id+' \u2013 '+d.date+' \u00e0 '+d.heure;
    document.getElementById('demWebModalSub').textContent=d.prenom+' '+d.nom+' \u00b7 '+d.societe;

    // Fichiers joints
    var fb=document.getElementById('demWebFichiers');
    var fl=document.getElementById('demWebFichiersListe');
    if(d.fichiers && d.fichiers.length>0){
      fb.style.display='block';
      fl.innerHTML='';
      d.fichiers.forEach(function(f){
        var s=document.createElement('span');
        s.style.cssText='background:white;border:1px solid #e2e8f0;border-radius:6px;padding:3px 10px;font-size:.72rem;color:#374151;display:inline-flex;align-items:center;gap:5px;';
        s.innerHTML='<i class="fas fa-paperclip" style="color:#6366f1;font-size:.65rem;"></i>';
        s.appendChild(document.createTextNode(f));
        fl.appendChild(s);
      });
    } else { fb.style.display='none'; }

    // Commentaire
    var cb=document.getElementById('demWebCommentaireBloc');
    var ct=document.getElementById('demWebCommentaireTexte');
    if(d.commentaire && d.commentaire.length>0){ cb.style.display='block'; ct.textContent=d.commentaire; }
    else { cb.style.display='none'; }

    // Pré-remplir DT
    document.getElementById('dtw_date').value=new Date().toISOString().split('T')[0];
    var act=document.getElementById('dtw_activite');
    for(var i=0;i<act.options.length;i++){ if(act.options[i].value===d.activite){ act.selectedIndex=i; break; } }
    document.getElementById('dtw_contact').value=d.prenom+' '+d.nom;
    document.getElementById('dtw_poste').value=d.poste||'';
    document.getElementById('dtw_email').value=d.email||'';
    document.getElementById('dtw_tel').value=d.tel||'';
    document.getElementById('dtw_societe').value=d.societe||'';
    document.getElementById('dtw_adresse').value=d.adresse||'';
    document.getElementById('dtw_designation').value=d.designation||'';
    document.getElementById('dtw_numpiece').value=d.numPiece||'';
    document.getElementById('dtw_numplan').value=d.numPlan||'';
    document.getElementById('dtw_quantite').value=d.quantite||'';
    document.getElementById('dtw_delai').value=d.delai||'';
    document.getElementById('dtw_notes').value='';
    var tp=document.getElementById('dtw_type');
    for(var j=0;j<tp.options.length;j++){ if(tp.options[j].value===d.typeDemande){ tp.selectedIndex=j; break; } }
    var pr=document.getElementById('dtw_priorite');
    for(var k=0;k<pr.options.length;k++){ if(pr.options[k].value===d.priorite){ pr.selectedIndex=k; break; } }

    // Bouton "Mettre en traitement" visible seulement si statut=nouveau
    var btnT=document.getElementById('btnMettreEnTraitement');
    if(btnT) btnT.style.display=d.statut==='nouveau'?'inline-flex':'none';

    document.getElementById('modalDemandeWeb').style.display='flex';
  }

  function fermerDemandeWeb(){
    document.getElementById('modalDemandeWeb').style.display='none';
    currentDemId='';
  }

  // ── CRÉER DT ──────────────────────────────────────────────────
  function creerDTdepuisWeb(){
    var contact=document.getElementById('dtw_contact').value.trim();
    var societe=document.getElementById('dtw_societe').value.trim();
    var designation=document.getElementById('dtw_designation').value.trim();
    if(!contact||!societe||!designation){
      pushNotif('warn','fa-exclamation-triangle','Champs obligatoires manquants : Contact, Soci\u00e9t\u00e9 et D\u00e9signation.',4000);
      return;
    }
    var newNum='DT-2026-'+(1282+Math.floor(Math.random()*50));
    pushNotif('ok','fa-file-alt','DT '+newNum+' cr\u00e9\u00e9e pour '+societe+' ('+designation+'). En attente analyse BE.',7000);
    // Mettre à jour la ligne dans le tableau
    if(currentDemId && WD[currentDemId]){
      WD[currentDemId].statut='converti';
      document.querySelectorAll('#demandesWebTable tbody tr').forEach(function(tr){
        var firstDiv=tr.querySelector('td:first-child div');
        if(firstDiv && firstDiv.textContent===currentDemId){
          tr.dataset.demStatut='converti';
          var sc=tr.querySelector('td:nth-child(7)');
          if(sc){
            var sp=document.createElement('span');
            sp.style.cssText='display:inline-flex;align-items:center;gap:4px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;';
            sp.innerHTML='<i class="fas fa-check-circle" style="font-size:.6rem;"></i>\u00a0Converti en DT';
            sc.innerHTML=''; sc.appendChild(sp);
          }
          var dtLink=document.createElement('div');
          dtLink.style.cssText='font-size:.66rem;color:#22c55e;font-weight:600;margin-top:2px;';
          dtLink.innerHTML='<i class="fas fa-link" style="margin-right:3px;"></i>'+newNum;
          tr.querySelector('td:first-child').appendChild(dtLink);
        }
      });
    }
    fermerDemandeWeb();
  }

  // ── METTRE EN TRAITEMENT ──────────────────────────────────────
  function mettreEnTraitement(id, btn){
    if(WD[id]) WD[id].statut='en_traitement';
    pushNotif('info','fa-clock','Demande '+id+' marqu\u00e9e en traitement.',3000);
    document.querySelectorAll('#demandesWebTable tbody tr').forEach(function(tr){
      var firstDiv=tr.querySelector('td:first-child div');
      if(firstDiv && firstDiv.textContent===id){
        tr.dataset.demStatut='en_traitement';
        var sc=tr.querySelector('td:nth-child(7)');
        if(sc){
          var sp=document.createElement('span');
          sp.style.cssText='display:inline-flex;align-items:center;gap:4px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;';
          sp.innerHTML='<i class="fas fa-clock" style="font-size:.6rem;"></i>\u00a0En traitement';
          sc.innerHTML=''; sc.appendChild(sp);
        }
        if(btn) btn.parentNode.removeChild(btn);
      }
    });
  }

  function mettreEnTraitementModal(){
    if(!currentDemId) return;
    if(WD[currentDemId]) WD[currentDemId].statut='en_traitement';
    mettreEnTraitement(currentDemId, null);
    var btnT=document.getElementById('btnMettreEnTraitement');
    if(btnT) btnT.style.display='none';
  }

  // ── ARCHIVER ─────────────────────────────────────────────────
  async function archiverDemande(){
    if(!currentDemId) return;
    if(!await appConfirm('Archiver la demande '+currentDemId+' ?')) return;
    if(WD[currentDemId]) WD[currentDemId].statut='archive';
    document.querySelectorAll('#demandesWebTable tbody tr').forEach(function(tr){
      var firstDiv=tr.querySelector('td:first-child div');
      if(firstDiv && firstDiv.textContent===currentDemId){
        tr.dataset.demStatut='archive';
        var sc=tr.querySelector('td:nth-child(7)');
        if(sc){
          var sp=document.createElement('span');
          sp.style.cssText='display:inline-flex;align-items:center;gap:4px;background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;padding:2px 9px;border-radius:20px;font-size:.68rem;font-weight:700;';
          sp.innerHTML='<i class="fas fa-archive" style="font-size:.6rem;"></i>\u00a0Archiv\u00e9';
          sc.innerHTML=''; sc.appendChild(sp);
        }
      }
    });
    pushNotif('info','fa-archive','Demande '+currentDemId+' archiv\u00e9e.',4000);
    fermerDemandeWeb();
  }
  </script>`
  return layout('Demandes Site Web', content, 'demandes-web')
}

// ══════════════════════════════════════════════════════════════
// PAGE SERVICE COMMERCIAL — 4 onglets unifiés
// ST/DT · Offre PRC1-D5 · Commandes validées · Avoirs et CA
// ══════════════════════════════════════════════════════════════
export const pageServiceCommercial = (
  dbDts?: DemandeTravaux[],
  dbClients?: Client[],
  dbOffres?: Offre[],
  dbCmds?: Commande[],
  dbCredits?: Credit[],
  dbSite?: DemandeSite[],
  dbCommandesP?: any[],
  dbFactures?: any[],
  dbValidations?: any[],
) => {
  const FAC_DATA  = Array.isArray(dbFactures) ? dbFactures : []
  const VD_MAP    = buildValDirMap(dbValidations || [])   // décisions Direction indexées par (ref_table, ref_id)
  const DT_DATA   = dbDts     ? dbDts.map(mapDT)           : DT_DATA_DEFAULT
  const CLI_DATA  = dbClients ? dbClients.map(mapClient)   : CLIENTS_DATA_DEFAULT
  // ─── CA PAR CLIENT (pour le tri de la liste) ────────────────────────────────
  // CA = chiffre d'affaires FACTURÉ HT. Chaque facture est rattachée UNE seule fois
  // à son client (par client_id, sinon par nom) → pas de double comptage.
  const _caYear = new Date().getFullYear()
  const _lcC = (s: any) => String(s ?? '').toLowerCase().trim()
  const _cliById = new Map(CLI_DATA.map((c: any) => [String(c.id), c]))
  const _cliByNom = new Map(CLI_DATA.map((c: any) => [_lcC(c.nom), c]))
  const CA_CLIENT = new Map<string, { annee: number; total: number }>()
  for (const f of (FAC_DATA as any[])) {
    const ht = Number(f?.montant_ht) || 0
    if (!ht) continue
    const c: any = _cliById.get(String(f?.client_id || '')) || _cliByNom.get(_lcC(f?.client_nom))
    if (!c) continue
    const k = String(c.id)
    const e = CA_CLIENT.get(k) || { annee: 0, total: 0 }
    e.total += ht
    if (String(f?.date_facture || '').slice(0, 4) === String(_caYear)) e.annee += ht
    CA_CLIENT.set(k, e)
  }
  const caDe = (id: any) => CA_CLIENT.get(String(id)) || { annee: 0, total: 0 }
  const eurC = (v: number) => v > 0 ? Math.round(v).toLocaleString('fr-FR') + ' €' : '—'
  // Rendu initial = ordre ALPHABÉTIQUE (les boutons de tri rebasculent côté client).
  const CLI_SORTED = [...CLI_DATA].sort((a: any, b: any) => String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base' }))
  const OFF_DATA  = dbOffres  ? dbOffres.map(mapOffre)     : OFFRES_DATA_DEFAULT
  const CMD_DATA  = dbCmds    ? dbCmds.map(mapCommande)    : COMMANDES_VALIDEES_DEFAULT
  const AV_DATA   = dbCredits ? dbCredits.map(mapCredit)   : CREDITS_DATA_DEFAULT
  // Projection brute des avoirs (pour pré-remplir le formulaire d'édition côté client).
  const AV_RAW_DATA = (dbCredits || []).map((cr: any) => ({ id: cr.id, client_id: cr.client_id || '', client_nom: cr.client_nom || '', montant: Number(cr.montant) || 0, motif: cr.motif || '', type: cr.type || '', date_credit: String(cr.date_credit || '').slice(0, 10), num_affaire: cr.num_affaire || '', mode_restitution: cr.mode_restitution || '', origine: cr.origine || '', facture_cible_id: cr.facture_cible_id || '' }))
  const CP_DATA   = Array.isArray(dbCommandesP) ? dbCommandesP : []
  // Rattachement d'avoir : numéros d'affaire connus (DT/offres/commandes/factures) + factures chargeables
  const _affNumSet = new Set<string>()
  ;(DT_DATA as any[]).forEach((d: any) => { if (d.numAffaire) _affNumSet.add(String(d.numAffaire)) })
  ;(OFF_DATA as any[]).forEach((o: any) => { if (o.numAffaire) _affNumSet.add(String(o.numAffaire)) })
  ;(CMD_DATA as any[]).forEach((c: any) => { if (c.numAffaire) _affNumSet.add(String(c.numAffaire)) })
  ;(FAC_DATA as any[]).forEach((f: any) => { if (f.num_affaire) _affNumSet.add(String(f.num_affaire)) })
  const AFF_NUMS = Array.from(_affNumSet).sort((a, b) => String(b).localeCompare(String(a), 'fr', { numeric: true }))
  const FAC_JS = (FAC_DATA as any[]).map((f: any) => ({ id: f.id, num: f.num_facture || f.id, affaire: f.num_affaire || '', client: f.client_nom || '', montant: Number(f.montant_ttc || f.montant_ht) || 0 }))

  // N7 : datalists éditables (réf. interne / nom plan / réf. client) depuis les valeurs déjà saisies
  const _refSet = new Set<string>(), _planSet = new Set<string>(), _cliSet = new Set<string>()
  ;(DT_DATA as any[]).forEach((d: any) => (d.piecesDetail || []).forEach((p: any) => { if (p.ref_interne) _refSet.add(p.ref_interne); if (p.nom_plan) _planSet.add(p.nom_plan); if (p.ref_client) _cliSet.add(p.ref_client) }))
  const _dlOpts = (s: Set<string>) => Array.from(s).slice(0, 500).map(v => `<option value="${String(v).replace(/"/g, '&quot;')}"></option>`).join('')
  const dtDatalists = `<datalist id="dt-refint-dl">${_dlOpts(_refSet)}</datalist><datalist id="dt-plan-dl">${_dlOpts(_planSet)}</datalist><datalist id="dt-client-dl">${_dlOpts(_cliSet)}</datalist>`

  const TABS = [
    ['site',      'Demandes site internet', 'fa-globe',               '#0d9488'],
    ['dt',        'DT / Demande travaux',   'fa-file-alt',            '#3b82f6'],
    ['offre',     'Offre (PRC1-D5)',        'fa-file-invoice-dollar', '#6366f1'],
    ['avoirs',    'Avoirs & Commandes P',   'fa-undo-alt',            '#8b5cf6'],
    ['clients',   'Liste clients',          'fa-users',               '#059669'],
    ['cmd',       'Commandes validées',     'fa-check-double',        '#0ea5e9'],
    ['affaires',  'Affaires (circuit)',     'fa-folder-tree',         '#0891b2'],
    ['dashboard', 'Dashboard Commercial',  'fa-chart-bar',           '#f59e0b'],
  ] as const

  const tabBtn = (id: string, lbl: string, ic: string, _col: string, first: boolean) =>
    `<button onclick="switchSvcTab('${id}')" id="svc-tab-${id}" class="com-svc-tab${first?' active':''}">
      <i class="fas ${ic}"></i>${lbl}
    </button>`

  const panelHeader = (title: string, ic: string, col: string, tabId: string, noCreate = false) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
          <i class="fas ${ic}" style="color:${col};"></i>${title}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${noCreate ? '' : `<input type="text" placeholder="Rechercher…" oninput="filterSvcList('${tabId}',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
        <button onclick="toggleSvcForm('${tabId}')" style="padding:8px 18px;background:linear-gradient(135deg,${col},${col}cc);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px ${col}44;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Créer</button>`}
      </div>
    </div>`

  // ── TAB SITE INTERNET ─────────────────────────────────────────
  const SITE_DATA = dbSite ?? []
  const siteStatutColors: Record<string,{bg:string,col:string,lbl:string}> = {
    nouveau:  { bg:'#dbeafe', col:'#1d4ed8', lbl:'Nouveau' },
    en_cours: { bg:'#fef9c3', col:'#854d0e', lbl:'En cours' },
    traite:   { bg:'#dcfce7', col:'#15803d', lbl:'Traité ✓' },
    archive:  { bg:'#f1f5f9', col:'#6b7280', lbl:'Archivé' },
  }
  const tabSite = `
  <div id="svc-panel-site">
    ${panelHeader('Demandes clients – site internet','fa-globe','#0d9488','site',true)}
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#0f766e;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-globe" style="font-size:1rem;"></i>
      <span>Ces demandes proviennent directement du formulaire <strong>"Contactez-nous"</strong> du site internet via <code style="background:#ccfbf1;padding:1px 6px;border-radius:4px;font-size:.75rem;">POST /api/contact</code>. Elles s'affichent ici en temps réel.</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${[['Nouvelles','#ef4444', SITE_DATA.filter(s=>s.statut==='nouveau').length],
         ['En cours', '#f59e0b', SITE_DATA.filter(s=>s.statut==='en_cours').length],
         ['Traitées', '#22c55e', SITE_DATA.filter(s=>s.statut==='traite').length],
         ['Total',    '#0d9488', SITE_DATA.length],
      ].map(([l,c,v])=>`<div style="background:white;border-radius:10px;padding:12px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:.68rem;color:#6b7280;font-weight:600;margin-top:2px;">${l}</div></div>`).join('')}
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      ${SITE_DATA.length === 0 ? `
      <div style="padding:40px;text-align:center;color:#9ca3af;">
        <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
        <div style="font-weight:600;margin-bottom:4px;">Aucune demande reçue pour le moment</div>
        <div style="font-size:.78rem;">Les demandes du site internet apparaîtront ici automatiquement</div>
      </div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-list-site">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Contact</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Société</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Type de demande</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Message</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Priorité</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Reçu le</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${SITE_DATA.map(s => {
              const st = siteStatutColors[s.statut] || { bg:'#f1f5f9', col:'#6b7280', lbl:s.statut }
              const prioBg = s.priorite==='critique'?'#fee2e2':s.priorite==='urgent'?'#fef9c3':'#f0fdf4'
              const prioCol = s.priorite==='critique'?'#b91c1c':s.priorite==='urgent'?'#854d0e':'#15803d'
              const dateStr = new Date(s.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
              const contactNom = [s.prenom, s.nom].filter(Boolean).join(' ')
              const msgCourt = s.message.length > 80 ? s.message.substring(0,80)+'…' : s.message
              return `<tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                <td style="padding:10px 14px;">
                  <div style="font-weight:600;color:#374151;">${escX(contactNom)}</div>
                  <div style="font-size:.7rem;color:#6366f1;">${escX(s.email)}</div>
                  ${s.telephone ? `<div style="font-size:.7rem;color:#9ca3af;">${escX(s.telephone)}</div>` : ''}
                </td>
                <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(s.societe || '—')}</td>
                <td style="padding:10px 14px;color:#6b7280;">${escX(s.type_demande)}</td>
                <td style="padding:10px 14px;color:#6b7280;font-size:.75rem;max-width:200px;">${escX(msgCourt)}</td>
                <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;background:${prioBg};color:${prioCol};">${s.priorite}</span></td>
                <td style="padding:10px 14px;text-align:center;font-size:.72rem;color:#6b7280;">${dateStr}</td>
                <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${st.bg};color:${st.col};">${st.lbl}</span></td>
                <td style="padding:10px 14px;text-align:center;">
                  <div style="display:flex;gap:4px;justify-content:center;">
                    <button onclick="editSvcItem('site','${s.id}')" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;" title="Modifier le statut"><i class="fas fa-edit"></i> Traiter</button>
                  </div>
                </td>
              </tr>`}).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  </div>`

  // ── TAB DT ────────────────────────────────────────────────────
  // Sépare les DT en deux listes : enregistrées non finies (à valider) / validées (envoyées au BE)
  const DT_VALIDATED_STATUTS = ['en_attente_be','en_attente_nomenclature','dans_offres','commande_creee','refus','BE en cours','Offre envoyée','Commande validée','Validation Direction','NC en cours']
  const DT_PENDING  = DT_DATA.filter(d => !DT_VALIDATED_STATUTS.includes(d.statut))
  const DT_VALID    = DT_DATA.filter(d =>  DT_VALIDATED_STATUTS.includes(d.statut))

  const renderDtRow = (dt: any, isValidated: boolean) => {
    const prioBg = dt.priorite==='critique'?'#fee2e2':dt.priorite==='urgent'?'#fef9c3':'#f0fdf4'
    const prioCol = dt.priorite==='critique'?'#b91c1c':dt.priorite==='urgent'?'#854d0e':'#15803d'
    const piecesDisplay = (dt.piecesDetail && dt.piecesDetail.length)
      ? dt.piecesDetail.map((p:any)=>`${escX(p.ref_interne||p.ref_client||'?')}${p.quantite?` ×${p.quantite}`:''}`).join(', ')
      : escX((dt.pieces||[]).join(', '))
    return `<tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      <td style="padding:10px 14px;"><div style="font-weight:700;color:#374151;">${dt.id}</div><div style="font-size:.68rem;color:#6366f1;">Affaire N° ${escX(dt.numAffaire)}</div></td>
      <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(dt.client)}</td>
      <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;max-width:220px;">${piecesDisplay||'<span style="color:#cbd5e1;font-style:italic;">aucune pièce</span>'}</td>
      <td style="padding:10px 14px;font-size:.72rem;color:#374151;">${escX(dt.type)}</td>
      <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${escX(dt.analyste)}</td>
      <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;background:${prioBg};color:${prioCol};">${dt.priorite}</span></td>
      <td style="padding:10px 14px;text-align:center;">${statusBadge(dt.statut)}</td>
      <td style="padding:10px 14px;text-align:center;">
        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
          ${isValidated
            ? '<span style="padding:4px 10px;background:#dcfce7;color:#15803d;border-radius:6px;font-size:.7rem;font-weight:700;" title="Déjà envoyée au BE"><i class=\"fas fa-check\"></i> Validée</span>'
            : `<button onclick="svcDtValider('${dt.id}')" style="padding:4px 10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;" title="Valider et envoyer au BE"><i class="fas fa-check"></i> Valider</button>`}
          <button onclick="svcDtOpenEdit('${dt.id}')" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;" title="Modifier"><i class="fas fa-edit"></i></button>
          <button onclick="deleteSvcItem('dt','${dt.id}')" style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`
  }

  const dtTable = (tableId: string, rows: any[], emptyMsg: string, isValidated: boolean) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      ${rows.length === 0 ? `<div style="padding:36px;text-align:center;color:#9ca3af;font-size:.82rem;"><i class="fas fa-inbox" style="font-size:1.6rem;display:block;margin-bottom:8px;"></i>${emptyMsg}</div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="${tableId}">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Affaire / DT</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièce(s)</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Type</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Analyste</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Priorité</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${rows.map(dt => renderDtRow(dt, isValidated)).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`

  const defaultDtSubtab = DT_PENDING.length > 0 ? 'pending' : 'valid'

  const tabDT = `
  <div id="svc-panel-dt">
    ${panelHeader('DT / Demandes de travaux','fa-file-alt','#3b82f6','dt')}

    <!-- SOUS-ONGLETS À TRAITER / VALIDÉES -->
    <div style="display:flex;gap:8px;margin-bottom:16px;background:#f1f5f9;border-radius:12px;padding:4px;width:fit-content;">
      <button id="dt-subtab-btn-pending" onclick="switchDtSubtab('pending')"
        style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultDtSubtab==='pending'?'#3b82f6':'transparent'};color:${defaultDtSubtab==='pending'?'white':'#64748b'};box-shadow:${defaultDtSubtab==='pending'?'0 2px 8px rgba(59,130,246,.3)':'none'};">
        <i class="fas fa-clipboard-list"></i>DT enregistrées non finies
        <span style="background:${defaultDtSubtab==='pending'?'rgba(255,255,255,.25)':'#fef3c7'};color:${defaultDtSubtab==='pending'?'white':'#92400e'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${DT_PENDING.length}</span>
      </button>
      <button id="dt-subtab-btn-valid" onclick="switchDtSubtab('valid')"
        style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultDtSubtab==='valid'?'#3b82f6':'transparent'};color:${defaultDtSubtab==='valid'?'white':'#64748b'};box-shadow:${defaultDtSubtab==='valid'?'0 2px 8px rgba(59,130,246,.3)':'none'};">
        <i class="fas fa-check-circle"></i>DT validées
        <span style="background:${defaultDtSubtab==='valid'?'rgba(255,255,255,.25)':'#dcfce7'};color:${defaultDtSubtab==='valid'?'white':'#15803d'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${DT_VALID.length}</span>
      </button>
    </div>

    <!-- PANNEAU : ENREGISTRÉES NON FINIES -->
    <div id="dt-subtab-pending" style="display:${defaultDtSubtab==='pending'?'block':'none'};">
      <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.78rem;color:#92400e;">
        <i class="fas fa-info-circle" style="margin-right:6px;"></i>
        DT en cours de saisie ou en attente de validation. Cliquez sur « Valider » pour les envoyer au BE.
      </div>
      ${dtTable('svc-list-dt-pending', DT_PENDING, 'Aucune DT en attente — toutes les DT sont validées ou aucune n\'a été créée', false)}
    </div>

    <!-- PANNEAU : VALIDÉES -->
    <div id="dt-subtab-valid" style="display:${defaultDtSubtab==='valid'?'block':'none'};">
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.78rem;color:#166534;">
        <i class="fas fa-check-circle" style="margin-right:6px;"></i>
        DT envoyées au BE (nomenclature, analyse) ou plus avant dans le workflow (offre, commande, refus).
      </div>
      ${dtTable('svc-list-dt-valid', DT_VALID, 'Aucune DT validée actuellement', true)}
    </div>
    <!-- FORMULAIRE CRÉATION DT -->
    <div id="svc-form-dt" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:16px;border-top:3px solid #3b82f6;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-plus-circle" style="color:#3b82f6;"></i>Nouvelle DT<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span><button onclick="toggleSvcForm('dt')" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:.9rem;"><i class="fas fa-times"></i></button></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#1d4ed8;margin-bottom:14px;"><i class="fas fa-info-circle mr-2"></i>Le N° DT = N° d'affaire unique. Même numéro pour offre et commande.</div>
      <!-- Client + bouton Nouveau client -->
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-bottom:10px;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client <span style="color:#ef4444;">*</span></label>
          <div style="position:relative;" id="svcDtClientAC">
            <input type="text" id="svc_dt_client_search" class="form-input" placeholder="Rechercher un client…" oninput="filterSvcDTClients(this.value)" onfocus="showSvcDTDropdown()" autocomplete="off" style="padding-right:32px;"/>
            <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.8rem;pointer-events:none;"><i class="fas fa-search"></i></span>
            <input type="hidden" id="svc_dt_client_id"/>
            <div id="svcDtClientDrop" style="display:none;position:absolute;top:100%;left:0;right:0;background:white;border:1.5px solid #bfdbfe;border-radius:0 0 8px 8px;max-height:220px;overflow-y:auto;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.1);margin-top:1px;"></div>
          </div>
        </div>
        <button type="button" onclick="toggleSvcNouveauClient()" style="padding:10px 16px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-plus mr-1"></i>Nouveau client</button>
      </div>
      <!-- Formulaire création nouveau client (collapse) -->
      <div id="svcNouveauClientForm" style="display:none;background:white;border:2px solid #6366f1;border-radius:12px;padding:16px;margin-bottom:14px;">
        <div style="font-size:.78rem;font-weight:800;color:#4338ca;margin-bottom:14px;"><i class="fas fa-building mr-2"></i>Créer un nouveau client</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Raison sociale <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="Nom de l'entreprise" id="svcNcRaison"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">SIRET</label><input type="text" class="form-input" placeholder="XXX XXX XXX XXXXX" id="svcNcSiret"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Contact principal</label><input type="text" class="form-input" placeholder="Prénom Nom" id="svcNcContact"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Poste / Fonction</label><input type="text" class="form-input" placeholder="Responsable Achats…" id="svcNcPoste"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Email</label><input type="email" class="form-input" placeholder="contact@entreprise.fr" id="svcNcEmail"/></div>
          <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Téléphone</label><input type="tel" class="form-input" placeholder="0X.XX.XX.XX.XX" id="svcNcTel"/></div>
        </div>
        <div style="margin-bottom:12px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Adresse complète</label><input type="text" class="form-input" placeholder="Numéro, rue, code postal, ville" id="svcNcAdresse"/></div>
        <div style="margin-bottom:12px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Mode de facturation <span style="color:#ef4444;">*</span></label>
          <select class="form-input" id="svcNcModeFacturation">${MODES_FACTURATION.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" onclick="toggleSvcNouveauClient()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 16px;font-size:.8rem;cursor:pointer;">Annuler</button>
          <button type="button" onclick="validerSvcNouveauClient()" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:8px;padding:7px 18px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-1"></i>Créer le client</button>
        </div>
      </div>
      <!-- N° DT auto + Activité + Type + Priorité + Date -->
      <div style="display:grid;grid-template-columns:160px 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px;align-items:end;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° DT <span style="color:#94a3b8;font-size:.65rem;">(auto)</span></label>
          <input type="text" id="svc_dt_num" readonly class="form-input" style="background:#eff6ff;font-family:monospace;font-weight:800;color:#1d4ed8;cursor:default;"/>
        </div>
        <div style="grid-column:1/-1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:7px 12px;font-size:.72rem;color:#1e40af;align-self:center;">
          <i class="fas fa-info-circle" style="margin-right:5px;"></i><strong>Activité</strong> et <strong>Type de DT</strong> se choisissent <strong>par produit</strong> ci-dessous (un produit peut être « Nouveau produit », un autre « Produit à jour »).
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Priorité</label>
          <select id="svc_dt_prio" class="form-input">
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critique">Critique</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date besoin</label>
          <input type="date" id="svc_dt_date" class="form-input"/>
        </div>
      </div>

      <!-- PRODUITS -->
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:#3b82f6;margin:14px 0 10px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-cube" style="font-size:.65rem;"></i>Produit(s)
        <span style="flex:1;height:1px;background:#e2e8f0;margin-left:6px;"></span>
      </div>
      <div id="svc-dt-produits"></div>
      <button type="button" onclick="svcDtAjouterProduit()" style="width:100%;background:#eff6ff;border:2px dashed #bfdbfe;border-radius:10px;padding:9px;font-size:.78rem;font-weight:700;color:#1d4ed8;cursor:pointer;margin-bottom:14px;"><i class="fas fa-plus-circle" style="margin-right:6px;"></i>Produit supplémentaire</button>
      ${dtDatalists}

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" onclick="toggleSvcForm('dt')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Annuler</button>
        <button type="button" onclick="svcDtCreer()" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(59,130,246,.3);"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Créer la DT</button>
      </div>
    </div>

    <!-- MODAL ÉDITION DT (modif des pièces / réfs / quantités → propagé à l'analyse BE) -->
    <div id="svcDtEditModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9000;align-items:center;justify-content:center;padding:24px;">
      <div style="background:white;border-radius:16px;width:100%;max-width:1100px;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.25);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div>
            <h3 style="font-size:1.05rem;font-weight:800;color:#1d4ed8;margin:0;display:flex;align-items:center;gap:8px;"><i class="fas fa-edit"></i>Modifier la DT <span id="svcDtEditNum" style="font-family:monospace;color:#0f172a;"></span></h3>
            <div style="font-size:.72rem;color:#6b7280;margin-top:4px;">Les modifications sont automatiquement répercutées dans l'analyse DT du Bureau d'Études · Statut actuel : <strong id="svcDtEditStatut" style="color:#374151;">—</strong></div>
          </div>
          <button onclick="svcDtCloseEdit()" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;color:#6b7280;font-size:.9rem;"><i class="fas fa-times"></i></button>
        </div>
        <input type="hidden" id="svcDtEditId"/>
        <input type="hidden" id="svcDtEditClientId"/>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px;align-items:end;">
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client</label>
            <input type="text" id="svcDtEditClient" class="form-input" placeholder="Raison sociale"/>
          </div>
          <div style="grid-column:1/-1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:7px 12px;font-size:.72rem;color:#1e40af;align-self:center;">
            <i class="fas fa-info-circle" style="margin-right:5px;"></i><strong>Activité</strong> et <strong>Type de DT</strong> se modifient <strong>par produit</strong> ci-dessous.
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Priorité</label>
            <select id="svcDtEditPrio" class="form-input">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Délai client</label>
            <input type="date" id="svcDtEditDelai" class="form-input"/>
          </div>
        </div>
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:#3b82f6;margin:6px 0 10px;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-cube" style="font-size:.65rem;"></i>Pièces — réf, plan, quantité (téléversement direct dans l'analyse BE)
          <span style="flex:1;height:1px;background:#e2e8f0;margin-left:6px;"></span>
        </div>
        <div id="svc-dt-edit-produits"></div>
        <button type="button" onclick="svcDtEditAjouterProduit()" style="width:100%;background:#eff6ff;border:2px dashed #bfdbfe;border-radius:10px;padding:9px;font-size:.78rem;font-weight:700;color:#1d4ed8;cursor:pointer;margin-bottom:14px;"><i class="fas fa-plus-circle" style="margin-right:6px;"></i>Ajouter une pièce</button>
        <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #f1f5f9;padding-top:14px;">
          <button onclick="svcDtCloseEdit()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Fermer</button>
          <button onclick="svcDtSaveEdit()" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer les modifications</button>
        </div>
      </div>
    </div>
  </div>`

  // ── TAB OFFRE ─────────────────────────────────────────────────
  // Sépare les offres en 2 listes : à traiter (brouillons + en attente réponse client) / validées (acceptées par le client)
  const OFF_A_TRAITER = OFF_DATA.filter(o => ['offre_en_attente','en_attente_reponse','negociation'].includes(o.statut))
  const OFF_VALIDEES  = OFF_DATA.filter(o => ['acceptee','validee','signed','signee'].includes(o.statut))
  // Map DT.id → pieces_detail (avec CRU/PV) pour afficher le détail dans les offres
  const DT_BY_ID: Record<string, any> = {}
  ;(dbDts ?? []).forEach(d => { DT_BY_ID[d.id] = d })

  const renderPiecesCru = (o: any) => {
    const dt = o.dtRef ? DT_BY_ID[o.dtRef] : null
    const pieces = (dt?.pieces_detail as any[]) || []
    if (!pieces.length) return `<span style="color:#94a3b8;font-style:italic;font-size:.74rem;">aucun détail CRU</span>`
    return `<div style="display:flex;flex-direction:column;gap:3px;font-size:.72rem;">${pieces.map((p:any)=>{
      // Le PV se calcule avec la MARGE DE L'OFFRE (o.marge, fixée par le commercial), pas avec une marge d'analyse.
      const marge = Number(o.marge) || 0
      const cru = p.cru != null ? p.cru.toFixed(2)+' €' : '—'
      const pv  = p.cru != null ? (Number(p.cru)*(1+marge/100)).toFixed(2)+' €' : '—'
      // Chiffrage multi-quantités : puces « ×qté → PV/pc » (CRU de la quantité × marge de l'offre)
      const tiers = Array.isArray(p.quantites_chiffrage) ? p.quantites_chiffrage : []
      const tiersHtml = tiers.length > 1
        ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:1px 0 4px 2px;">${tiers.map((t:any)=>`<span style="font-size:.64rem;background:#f5f3ff;border:1px solid #e9d5ff;border-radius:10px;padding:1px 7px;color:#5b21b6;white-space:nowrap;">×${t.quantite} → <strong>${((Number(t.cru)||0)*(1+marge/100)).toFixed(2)} €</strong>/pc</span>`).join('')}</div>`
        : ''
      return `<div style="display:flex;align-items:center;gap:6px;">
        <span style="font-family:monospace;color:#374151;font-weight:700;">${escX(p.ref_interne || '?')}</span>
        <span style="color:#9ca3af;">×${p.quantite || 1}</span>
        <span style="margin-left:auto;color:#92400e;">CRU <strong>${cru}</strong></span>
        <span style="color:#15803d;">PV <strong>${pv}</strong></span>
      </div>${tiersHtml}`
    }).join('')}</div>`
  }

  const tableOffre = (tableId: string, rows: any[], emptyMsg: string) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      ${rows.length === 0 ? `<div style="padding:36px;text-align:center;color:#9ca3af;font-size:.82rem;"><i class="fas fa-inbox" style="font-size:1.6rem;display:block;margin-bottom:8px;"></i>${emptyMsg}</div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="${tableId}">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° OFF / Affaire</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">DT liée</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièces · CRU · PV</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant HT</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Coût revient</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Marge</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Validité</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${rows.map(o => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="padding:10px 14px;"><div style="font-weight:700;color:#6366f1;">${o.id}${(o.version||1)>1?`<span title="Révisée ${o.version} fois (négociation)" style="margin-left:6px;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:800;">v${o.version}</span>`:''}</div><div style="font-size:.68rem;color:#9ca3af;">Affaire N° ${escX(o.numAffaire)}</div></td>
              <td style="padding:10px 14px;font-size:.78rem;color:#3b82f6;font-weight:600;">${escX(o.dtRef || '—')}</td>
              <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(o.client)}</td>
              <td style="padding:10px 14px;color:#374151;max-width:340px;">${renderPiecesCru(o)}</td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${(o.montant||0).toLocaleString('fr-FR')} €</td>
              <td style="padding:10px 14px;text-align:right;color:#92400e;font-weight:700;">${o.montantRevient!=null?o.montantRevient.toLocaleString('fr-FR')+' €':'—'}</td>
              <td style="padding:10px 14px;text-align:center;color:#15803d;font-weight:700;">${o.marge!=null?o.marge.toFixed(1)+'%':'—'}</td>
              <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${escX(o.validite || '—')}</td>
              <td style="padding:10px 14px;text-align:center;">${statusBadge(o.statut)}${(o.statut==='en_attente_reponse' && o.dateEnvoi && (Date.now()-Date.parse(o.dateEnvoi))/86400000 > 7) ? `<div style="margin-top:4px;"><span title="En attente de réponse depuis plus de 7 jours" style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 8px;font-size:.62rem;font-weight:800;white-space:nowrap;"><i class="fas fa-bell" style="margin-right:3px;"></i>À relancer</span></div>` : ''}</td>
              <td style="padding:10px 14px;text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
                  ${/* 'en_attente_reponse' EXCLU : l'offre est deja envoyee (statut pose par /api/offre/:id/envoyer) → plus de bouton Envoyer. */''}
                  ${['offre_en_attente','negociation'].includes(o.statut)?`<button onclick="svcEnvoyerOffre('${o.id}')" title="${o.statut==='negociation'?'Renvoyer l’offre révisée au client':'Envoyer l’offre au client'}" style="padding:4px 10px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> ${o.statut==='negociation'?'Renvoyer':'Envoyer'}</button>`:''}
                  ${o.statut==='en_attente_reponse'?`<button onclick="svcOuvrirValidationOffre('${o.id}','${(o.client||'').replace(/'/g,"\\'").replace(/"/g,'&quot;')}',${o.montant||0},${o.marge!=null?o.marge:0})" style="padding:4px 10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-check"></i> Valider</button>`:''}
                  ${o.statut==='en_attente_reponse'?`<button onclick="svcNegocierOffre('${o.id}')" title="Le client négocie : rouvre l'offre en révision (nouvelle version)" style="padding:4px 10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-comments-dollar"></i> Négocier</button>`:''}
                  ${['en_attente_reponse','negociation','acceptee'].includes(o.statut)?`<button onclick="telechargerDevis('${o.id}')" title="Télécharger le devis (PDF)" style="padding:4px 10px;background:#fef3c7;color:#92400e;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-file-pdf"></i></button>`:''}
                  <button onclick="editOffre('${o.id}')" title="Éditer l'offre (coûts, marge par produit, avoirs)" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-edit"></i></button>
                  <button onclick="deleteSvcItem('offre','${o.id}')" title="Supprimer l'offre" style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`

  const defaultOffSubtab = OFF_A_TRAITER.length > 0 ? 'totreat' : 'validated'

  const tabOffre = `
  <div id="svc-panel-offre" style="display:none;">
    ${panelHeader('Offres commerciales – PRC1-D5','fa-file-invoice-dollar','#6366f1','offre')}

    <!-- SOUS-ONGLETS À TRAITER / VALIDÉES -->
    <div style="display:flex;gap:8px;margin-bottom:16px;background:#f1f5f9;border-radius:12px;padding:4px;width:fit-content;">
      <button id="off-subtab-btn-totreat" onclick="switchOffSubtab('totreat')"
        style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultOffSubtab==='totreat'?'#6366f1':'transparent'};color:${defaultOffSubtab==='totreat'?'white':'#64748b'};box-shadow:${defaultOffSubtab==='totreat'?'0 2px 8px rgba(99,102,241,.3)':'none'};">
        <i class="fas fa-clipboard-list"></i>Offres à traiter
        <span style="background:${defaultOffSubtab==='totreat'?'rgba(255,255,255,.25)':'#fef3c7'};color:${defaultOffSubtab==='totreat'?'white':'#92400e'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${OFF_A_TRAITER.length}</span>
      </button>
      <button id="off-subtab-btn-validated" onclick="switchOffSubtab('validated')"
        style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultOffSubtab==='validated'?'#6366f1':'transparent'};color:${defaultOffSubtab==='validated'?'white':'#64748b'};box-shadow:${defaultOffSubtab==='validated'?'0 2px 8px rgba(99,102,241,.3)':'none'};">
        <i class="fas fa-check-circle"></i>Offres validées
        <span style="background:${defaultOffSubtab==='validated'?'rgba(255,255,255,.25)':'#dcfce7'};color:${defaultOffSubtab==='validated'?'white':'#15803d'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${OFF_VALIDEES.length}</span>
      </button>
    </div>

    <!-- STATS PIPELINE -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${[
        ['Offre en attente','#f59e0b', OFF_DATA.filter(o=>o.statut==='offre_en_attente').length],
        ['Attente réponse client','#6366f1', OFF_DATA.filter(o=>o.statut==='en_attente_reponse').length],
        ['Acceptées','#22c55e', OFF_VALIDEES.length],
        ['Annulées','#ef4444', OFF_DATA.filter(o=>o.statut==='annulee').length],
      ].map(([l,c,v])=>`<div style="background:white;border-radius:10px;padding:12px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:.68rem;color:#6b7280;font-weight:600;margin-top:2px;">${l}</div></div>`).join('')}
    </div>

    <!-- PANNEAUX -->
    <div id="off-subtab-totreat" style="display:${defaultOffSubtab==='totreat'?'block':'none'};">
      <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.78rem;color:#92400e;">
        <i class="fas fa-info-circle" style="margin-right:6px;"></i>
        Liste des offres générées par le BE (après analyse) et à traiter par le commercial : renseigner la marge, envoyer au client, etc.
      </div>
      ${tableOffre('svc-list-offre-totreat', OFF_A_TRAITER, 'Aucune offre à traiter actuellement')}
    </div>

    <div id="off-subtab-validated" style="display:${defaultOffSubtab==='validated'?'block':'none'};">
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.78rem;color:#166534;">
        <i class="fas fa-check-circle" style="margin-right:6px;"></i>
        Offres acceptées par le client — prêtes à devenir des commandes.
      </div>
      ${tableOffre('svc-list-offre-validated', OFF_VALIDEES, 'Aucune offre validée par le client pour le moment')}
    </div>
    <!-- FORMULAIRE CRÉATION OFFRE -->
    <div id="svc-form-offre" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:16px;border-top:3px solid #6366f1;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-plus-circle" style="color:#6366f1;"></i>Nouvelle offre<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span><button onclick="toggleSvcForm('offre')" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:.9rem;"><i class="fas fa-times"></i></button></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#1d4ed8;margin-bottom:14px;"><i class="fas fa-link mr-2"></i>N° offre = N° DT = N° CMD (même numéro d'affaire unique)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">DT associée <span style="color:#ef4444;">*</span></label>
          <select id="off_dt" class="form-input"><option value="">— Sélectionner une DT (dans offres) —</option>${DT_DATA.filter(d=>d.statut==='dans_offres').map(d=>`<option value="${escX(d.id)}">${escX(d.id)} – ${escX(d.client)} – ${escX(d.pieces.join(', '))}</option>`).join('')}</select>
        </div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date validité <span style="color:#ef4444;">*</span></label><input type="date" id="off_validite" class="form-input"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Montant HT (€) <span style="color:#ef4444;">*</span></label><input type="number" id="off_montant" class="form-input" placeholder="0.00" step="0.01"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Vendeur</label><input type="text" id="off_vendeur" class="form-input" placeholder="Corinne" value="Corinne"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Délai livraison estimé</label><input type="text" id="off_delai" class="form-input" placeholder="Ex: 4 semaines"/></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button onclick="toggleSvcForm('offre')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Annuler</button>
        <button onclick="submitSvcForm('offre')" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(99,102,241,.3);"><i class="fas fa-paper-plane mr-2"></i>Envoyer l'offre</button>
      </div>
    </div>
  </div>`

  // ── TAB COMMANDES ─────────────────────────────────────────────
  const tabCmd = `
  <div id="svc-panel-cmd" style="display:none;">
    ${panelHeader('Commandes validées – Suivi production','fa-check-circle','#0ea5e9','cmd')}
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-list-cmd">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° CMD / Affaire</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Pièce(s)</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Livraison</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">BDTs</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${CMD_DATA.map(cmd => {
              const pct = cmd.bdtTotal>0 ? Math.round(cmd.bdtSoldes/cmd.bdtTotal*100) : 0
              const barCol = pct===100?'#22c55e':pct>0?'#f59e0b':'#e2e8f0'
              return `<tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                <td style="padding:10px 14px;"><div style="font-weight:700;color:#374151;">${cmd.id}</div><div style="font-size:.68rem;color:#6366f1;">${cmd.offre}</div></td>
                <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(cmd.client)}</td>
                <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${escX(cmd.pieces.join(', '))}</td>
                <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${cmd.montant.toLocaleString('fr-FR')} €</td>
                <td style="padding:10px 14px;text-align:center;font-weight:600;font-size:.78rem;color:#374151;">${cmd.dateLiv}</td>
                <td style="padding:10px 14px;text-align:center;">
                  <div style="font-size:.72rem;font-weight:700;color:#374151;">${cmd.bdtSoldes}/${cmd.bdtTotal}</div>
                  <div style="background:#f1f5f9;border-radius:999px;height:5px;overflow:hidden;min-width:60px;margin-top:3px;"><div style="background:${barCol};height:100%;width:${pct}%;"></div></div>
                </td>
                <td style="padding:10px 14px;text-align:center;">${statusBadge(cmd.statut)}</td>
                <td style="padding:10px 14px;text-align:center;">
                  <div style="display:flex;gap:4px;justify-content:center;">
                    <a href="/production/affectation" style="padding:4px 10px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;"><i class="fas fa-project-diagram mr-1"></i>BDTs</a>
                    <button onclick="openFicheCommande('${cmd.id}')" title="Fiche 360 - couts, marge, tracabilite" style="padding:4px 10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-chart-pie"></i></button>
                    <button onclick="editSvcItem('cmd','${cmd.id}')" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-edit"></i></button>
                  </div>
                </td>
              </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <!-- FORMULAIRE CRÉATION COMMANDE -->
    <div id="svc-form-cmd" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:16px;border-top:3px solid #0ea5e9;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-plus-circle" style="color:#0ea5e9;"></i>Nouvelle commande<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span><button onclick="toggleSvcForm('cmd')" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:.9rem;"><i class="fas fa-times"></i></button></div>
      <div style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#0369a1;margin-bottom:14px;"><i class="fas fa-info-circle mr-2"></i>La commande est créée depuis une offre acceptée. Le N° CMD = N° DT = N° OFF.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Offre acceptée <span style="color:#ef4444;">*</span></label>
          <select id="cmd_offre" class="form-input"><option value="">— Sélectionner une offre —</option>${OFF_DATA.map(o=>`<option value="${escX(o.id)}">${escX(o.id)} – ${escX(o.client)} – ${o.montant.toLocaleString('fr-FR')} €</option>`).join('')}</select>
        </div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date livraison confirmée <span style="color:#ef4444;">*</span></label><input type="date" id="cmd_dateliv" class="form-input"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° BC client</label><input type="text" id="cmd_bc" class="form-input" placeholder="N° bon de commande client"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Statut initial</label>
          <select id="cmd_statut" class="form-input"><option value="a_programmer">À programmer</option><option value="attente_reception">Attente réception matière</option><option value="attente_prep">Attente retour prépa tech.</option></select>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button onclick="toggleSvcForm('cmd')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Annuler</button>
        <button onclick="submitSvcForm('cmd')" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(14,165,233,.3);"><i class="fas fa-check mr-2"></i>Valider la commande</button>
      </div>
    </div>
  </div>`

  // ── TAB AVOIRS ────────────────────────────────────────────────
  const tabAvoirs = `
  <div id="svc-panel-avoirs" style="display:none;">
    ${panelHeader('Avoirs & Commandes P','fa-undo-alt','#8b5cf6','avoirs')}
    <!-- SOUS-ONGLETS Avoirs / Commandes P -->
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <button id="subtab-avoirs" onclick="svcAvoirsSub('avoirs')" style="padding:7px 16px;border-radius:9px;border:1.5px solid #8b5cf6;background:#8b5cf6;color:white;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-receipt" style="margin-right:5px;"></i>Avoirs <span style="opacity:.8;">(${AV_DATA.length})</span></button>
      <button id="subtab-cmdp" onclick="svcAvoirsSub('cmdp')" style="padding:7px 16px;border-radius:9px;border:1.5px solid #fed7aa;background:white;color:#c2410c;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-bolt" style="margin-right:5px;"></i>Commandes P <span style="opacity:.8;">(${CP_DATA.filter((x:any)=>x.statut!=='traitee').length})</span></button>
    </div>
    <div id="sub-avoirs">
    <!-- CA RÉSUMÉ -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
      ${[['Avoirs actifs','#f59e0b', AV_DATA.filter(a=>a.statut==='actif').length],
         ['Partiels','#f97316', AV_DATA.filter(a=>a.statut==='partiel').length],
         ['Clôturés','#6b7280', AV_DATA.filter(a=>a.statut==='cloture').length],
         ['Total','#8b5cf6', AV_DATA.length],
      ].map(([l,c,v])=>`<div style="background:white;border-radius:10px;padding:12px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:${c};">${v}</div><div style="font-size:.68rem;color:#6b7280;font-weight:600;margin-top:2px;">${l}</div></div>`).join('')}
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-list-avoirs">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Avoir</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Motif</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Solde</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Date</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Saisi par</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${AV_DATA.map(av => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="padding:10px 14px;font-weight:700;color:#374151;">${av.id}</td>
              <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(av.client)}</td>
              <td style="padding:10px 14px;color:#6b7280;">${escX(av.motif)}</td>
              <td style="padding:10px 14px;text-align:right;font-weight:600;color:#374151;">${av.montant.toLocaleString('fr-FR')} €</td>
              <td style="padding:10px 14px;text-align:right;font-weight:800;color:${av.solde>0?'#16a34a':'#6b7280'};">${av.solde.toLocaleString('fr-FR')} €</td>
              <td style="padding:10px 14px;text-align:center;font-size:.78rem;color:#6b7280;">${av.date}</td>
              <td style="padding:10px 14px;text-align:center;font-size:.72rem;color:#6b7280;">${escX(av.saisiPar)}</td>
              <td style="padding:10px 14px;text-align:center;"><div style="display:flex;flex-direction:column;align-items:center;gap:3px;">${statusBadge(av.statut)}${valDirBadge(VD_MAP,'credits',av.id)}</div></td>
              <td style="padding:10px 14px;text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;">
                  <button onclick="editSvcItem('avoirs','${av.id}')" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-edit"></i></button>
                  <button onclick="deleteSvcItem('avoirs','${av.id}')" style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:600;cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <!-- FORMULAIRE CRÉATION AVOIR -->
    <div id="svc-form-avoirs" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:16px;border-top:3px solid #8b5cf6;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-plus-circle" style="color:#8b5cf6;"></i><span id="av-form-title">Nouvel avoir</span><span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span><button onclick="toggleSvcForm('avoirs')" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:.9rem;"><i class="fas fa-times"></i></button></div>
      <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#854d0e;margin-bottom:14px;"><i class="fas fa-exclamation-triangle mr-2"></i>Les <strong>Réclamations</strong> sont réservées au service Qualité. Les <strong>Avances</strong> sont saisies par le Commercial.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client <span style="color:#ef4444;">*</span></label><select id="av_client" class="form-input"><option value="">— Sélectionner —</option>${CLI_DATA.map(c=>`<option value="${escX(c.id)}">${escX(c.nom)}</option>`).join('')}</select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Type d'avoir <span style="color:#ef4444;">*</span></label><select id="av_type" class="form-input"><option value="avance">Avance (Matière / Outil / Consignation)</option><option value="reclamation">Réclamation (→ Service Qualité)</option></select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Restitution de l'avoir <span style="color:#ef4444;">*</span></label><select id="av_mode" class="form-input"><option value="deduire_facture">Déduire d'une facture en cours</option><option value="deduire_suivante">Déduire de la commande suivante (proposé à la prochaine offre)</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Origine</label><select id="av_origine" onchange="avOrigineChange()" class="form-input"><option value="commercial">Commercial / avance</option><option value="matiere">Achat de matière</option><option value="nc">Non-conformité</option></select></div>
      </div>
      <div id="av-matiere-block" style="display:none;background:#f5f3ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-size:.66rem;font-weight:800;color:#6d28d9;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;"><i class="fas fa-link" style="margin-right:5px;"></i>Avoir matière — liaison des factures</div>
        <div style="font-size:.68rem;color:#7c3aed;margin-bottom:8px;">La <strong>facture matière (source)</strong> = « Charger une facture client » ci-dessus. La <strong>facture d'affaire interne (cible)</strong> est celle sur laquelle on déduira l'avoir :</div>
        <label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Facture d'affaire interne (cible)</label>
        <select id="av_facture_cible" class="form-input"><option value="">— Aucune —</option>${FAC_DATA.map((f:any)=>`<option value="${escX(f.id)}">${escX(f.num_facture||f.id)} · Aff. ${escX(f.num_affaire||'—')} · ${escX(f.client_nom||'')} · ${(Number(f.montant_ttc||f.montant_ht)||0).toLocaleString('fr-FR')} €</option>`).join('')}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Charger une facture client <span style="font-weight:600;text-transform:none;color:#9ca3af;">(optionnel — renseigne l'affaire)</span></label><select id="av_facture" onchange="avFactureChange()" class="form-input"><option value="">— Aucune —</option>${FAC_DATA.map((f:any)=>`<option value="${escX(f.id)}">${escX(f.num_facture||f.id)} · Aff. ${escX(f.num_affaire||'—')} · ${escX(f.client_nom||'')} · ${(Number(f.montant_ttc||f.montant_ht)||0).toLocaleString('fr-FR')} €</option>`).join('')}</select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Rattacher à une affaire <span style="font-weight:600;text-transform:none;color:#9ca3af;">(vide = avoir libre)</span></label><input id="av_affaire" list="av-affaire-dl" class="form-input" placeholder="N° affaire" oninput="avAffairePreview()"/><datalist id="av-affaire-dl">${AFF_NUMS.map((n:string)=>`<option value="${escX(n)}"></option>`).join('')}</datalist><div id="av-num-preview" style="font-size:.66rem;color:#8b5cf6;margin-top:4px;font-weight:700;"></div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Montant (€) <span style="color:#ef4444;">*</span></label><input type="number" id="av_montant" class="form-input" placeholder="0.00" step="0.01"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date de l'avoir <span style="color:#ef4444;">*</span></label><input type="date" id="av_date" class="form-input"/></div>
      </div>
      <div style="margin-bottom:14px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Motif / Description <span style="color:#ef4444;">*</span></label><textarea id="av_motif" rows="3" class="form-input" placeholder="Décrire le motif de l'avoir…" style="resize:vertical;"></textarea></div>
      ${validationCheckbox('av_vd', 'Soumettre cet avoir à la validation de la Direction')}
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button onclick="toggleSvcForm('avoirs')" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 20px;font-size:.82rem;cursor:pointer;">Annuler</button>
        <button onclick="submitSvcForm('avoirs')" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:10px;padding:9px 24px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(139,92,246,.3);"><i class="fas fa-file-invoice mr-2"></i><span id="av-submit-lbl">Émettre l'avoir</span></button>
      </div>
    </div>
    </div><!-- end #sub-avoirs -->

    <!-- SOUS-ONGLET COMMANDES PRIORITAIRES -->
    <div id="sub-cmdp" style="display:none;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 14px;font-size:.78rem;color:#9a3412;margin-bottom:14px;"><i class="fas fa-bolt mr-2"></i>Les <strong>commandes prioritaires</strong> proviennent d'un retour client accepté en relance (Qualité → NC client → « Retour » → Commande prioritaire). Numérotées <strong>CMDP-AAAA-XX</strong> sur l'affaire d'origine. Une fois lancées, elles se décomposent en lots <strong>LOTP</strong> → <strong>BDTP/BDSP</strong> encadrés en rouge dans le planning.</div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
            <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
              ${['N° Commande P','Client','Réf. / Désignation','Qté','Coût revient unit.','Montant estimé','NC origine','Statut','Date','Action'].map(h=>`<th style="text-align:${['Qté','Coût revient unit.','Montant estimé'].includes(h)?'right':h==='Action'?'center':'left'};padding:10px 14px;color:#64748b;font-size:.66rem;text-transform:uppercase;font-weight:700;white-space:nowrap;">${h}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${CP_DATA.length === 0 ? `<tr><td colspan="10" style="text-align:center;padding:30px;color:#9ca3af;font-size:.82rem;">Aucune commande prioritaire.</td></tr>` :
              CP_DATA.map((cp:any) => `
              <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fff7ed'" onmouseleave="this.style.background=''">
                <td style="padding:10px 14px;font-weight:800;color:#c2410c;white-space:nowrap;">${escX(cp.id)}</td>
                <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(cp.client_nom || '—')}</td>
                <td style="padding:10px 14px;color:#6b7280;">${escX(cp.ref_article || cp.designation || '—')}</td>
                <td style="padding:10px 14px;text-align:right;font-weight:700;">${cp.qte ?? '—'}</td>
                <td style="padding:10px 14px;text-align:right;color:#6b7280;">${cp.cout_revient_unitaire != null ? Number(cp.cout_revient_unitaire).toLocaleString('fr-FR') + ' €' : '<span style="color:#f59e0b;">à chiffrer</span>'}</td>
                <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${cp.montant_estime != null ? Number(cp.montant_estime).toLocaleString('fr-FR') + ' €' : '—'}</td>
                <td style="padding:10px 14px;font-size:.72rem;color:#94a3b8;">${escX(cp.nc_id || '—')}</td>
                <td style="padding:10px 14px;text-align:center;">${cp.statut === 'traitee' ? '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#dcfce7;color:#16a34a;font-size:.66rem;font-weight:800;">Lancée</span>' : '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#ffedd5;color:#c2410c;font-size:.66rem;font-weight:800;">À faire</span>'}</td>
                <td style="padding:10px 14px;text-align:center;font-size:.74rem;color:#6b7280;white-space:nowrap;">${(cp.created_at || '').slice(0,10)}</td>
                <td style="padding:10px 14px;text-align:center;white-space:nowrap;">${cp.statut === 'traitee' ? `<span style="font-size:.7rem;color:#16a34a;font-weight:700;"><i class="fas fa-check" style="margin-right:4px;"></i>${escX(cp.cmd_id || 'lancée')}</span>` : `<button onclick="cmdpLancer('${escX(cp.id)}')" style="padding:6px 12px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:8px;font-size:.72rem;font-weight:800;cursor:pointer;"><i class="fas fa-bolt" style="margin-right:4px;"></i>Lancer la production</button>`}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <script>
      function svcAvoirsSub(w){
        var a=document.getElementById("sub-avoirs"), c=document.getElementById("sub-cmdp");
        var ba=document.getElementById("subtab-avoirs"), bc=document.getElementById("subtab-cmdp");
        var on=(w==="cmdp");
        if(a) a.style.display=on?"none":"block";
        if(c) c.style.display=on?"block":"none";
        if(ba){ ba.style.background=on?"white":"#8b5cf6"; ba.style.color=on?"#6d28d9":"white"; ba.style.borderColor=on?"#ddd6fe":"#8b5cf6"; }
        if(bc){ bc.style.background=on?"#f97316":"white"; bc.style.color=on?"white":"#c2410c"; bc.style.borderColor=on?"#f97316":"#fed7aa"; }
      }
      async function cmdpLancer(id){
        if(!await appConfirm("Lancer « "+id+" » en production ?\\nUne commande prioritaire + un lot LOTP + des BDT/BDS prioritaires (encadrés rouge dans le planning) seront créés.")) return;
        fetch("/api/commandes-p/"+encodeURIComponent(id)+"/lancer",{method:"POST"}).then(function(r){return r.json();}).then(function(j){
          if(!j||!j.ok){ if(typeof pushNotif==="function") pushNotif("err","fa-times",(j&&j.error)||"Échec du lancement.",5000); return; }
          if(typeof pushNotif==="function") pushNotif("ok","fa-bolt","Lancée : "+((j.bdt||[]).length)+" BDTP + "+((j.bds||[]).length)+" BDSP créés · lot "+j.lot+" (voir Planning production)",7000);
          setTimeout(function(){ softReload(); },1400);
        }).catch(function(){ if(typeof pushNotif==="function") pushNotif("err","fa-times","Erreur réseau.",5000); });
      }
    </script>
  </div>`

  // ── TAB CLIENTS ───────────────────────────────────────────────
  const SEL_STYLE = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.78rem;background:#f8fafc;outline:none;color:#374151;'
  const Q_STYLE   = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;'
  const TH_S = 'text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;'
  const TD_S = 'padding:10px 14px;'
  const LBL_C = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;'
  const INP_C = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'

  const searchBar = (tableId: string, cols: [string,string][]) =>
    `<div style="display:flex;gap:8px;align-items:center;">
      <select id="sel-${tableId}" onchange="svcSearch('${tableId}')" style="${SEL_STYLE}">
        <option value="all">Tous les champs</option>
        ${cols.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <input type="text" id="q-${tableId}" placeholder="Rechercher…" oninput="svcSearch('${tableId}')" style="${Q_STYLE}"/>
    </div>`

  const tabClients = `
  <div id="svc-panel-clients" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-users" style="color:#059669;"></i>Liste des clients
        <span style="background:#d1fae5;color:#065f46;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${CLI_DATA.length}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${bulkToolbar('cli', '#059669')}
        ${searchBar('svc-clients',[['nom','Raison sociale'],['contact','Contact'],['email','Email'],['tel','Téléphone'],['mode','Mode facturation'],['siret','SIRET']])}
        <a href="/api/export/clients.xlsx" title="Exporter tous les clients + les produits qu'ils ont commandés (Excel : feuille Données + feuille TCD)" style="padding:8px 16px;background:#ecfdf5;color:#047857;border:1.5px solid #a7f3d0;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-file-excel"></i>Exporter (Excel)</a>
        <button onclick="openClientsModal()" style="padding:8px 16px;background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouveau client</button>
      </div>
    </div>
    <style>.cliact-pill{padding:6px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.78rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}.cliact-pill.active{background:linear-gradient(135deg,#047857,#059669);color:white;border-color:transparent;}.cliact-pill .cnt{background:rgba(0,0,0,.08);border-radius:999px;padding:0 7px;font-size:.62rem;}.cliact-pill.active .cnt{background:rgba(255,255,255,.25);}</style>
    <div style="display:flex;gap:6px;margin-bottom:14px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-right:2px;"><i class="fas fa-filter" style="margin-right:4px;"></i>Activité :</span>
      <button id="cliact-all" onclick="setCliAct('all',this)" class="cliact-pill active">Tous <span class="cnt">${CLI_DATA.length}</span></button>
      <button id="cliact-Seem" onclick="setCliAct('Seem',this)" class="cliact-pill">SEEM <span class="cnt">${CLI_DATA.filter((c:any)=>c.activite==='Seem').length}</span></button>
      <button id="cliact-Semrac" onclick="setCliAct('Semrac',this)" class="cliact-pill">SEMRAC <span class="cnt">${CLI_DATA.filter((c:any)=>c.activite==='Semrac').length}</span></button>
      <button id="cliact-both" onclick="setCliAct('both',this)" class="cliact-pill">SEEM &amp; SEMRAC <span class="cnt">${CLI_DATA.filter((c:any)=>c.activite==='both').length}</span></button>
      <span style="width:1px;height:22px;background:#e2e8f0;margin:0 4px;"></span>
      <span style="font-size:.66rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-right:2px;">Trier</span>
      <button id="clisort-nom" onclick="sortClients('nom',this)" class="cliact-pill active" title="Ordre alphabétique (A → Z)"><i class="fas fa-arrow-down-a-z"></i> A → Z</button>
      <button id="clisort-ca_annee" onclick="sortClients('ca_annee',this)" class="cliact-pill" title="Chiffre d'affaires facturé ${_caYear}, du plus élevé au plus faible"><i class="fas fa-chart-line"></i> CA ${_caYear}</button>
      <button id="clisort-ca_total" onclick="sortClients('ca_total',this)" class="cliact-pill" title="Chiffre d'affaires facturé cumulé, du plus élevé au plus faible"><i class="fas fa-sack-dollar"></i> CA total</button>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-clients">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th class="bcell bcell-cli" style="display:none;text-align:center;padding:10px 8px;"><input type="checkbox" onclick="bulkAll('cli',this.checked)" title="Tout sélectionner"/></th>
            <th style="${TH_S}">Raison sociale</th>
            <th style="${TH_S}">Contact</th>
            <th style="${TH_S}">Email</th>
            <th style="${TH_S}">Téléphone</th>
            <th style="${TH_S}">Mode facturation</th>
            <th style="${TH_S}">SIRET</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;white-space:nowrap;">CA ${_caYear}</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;white-space:nowrap;">CA total</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Crédits</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${CLI_SORTED.length === 0 ? `<tr><td colspan="10" style="padding:48px;text-align:center;color:#9ca3af;"><i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:8px;"></i>Aucun client en base</td></tr>` :
            CLI_SORTED.map((c: any) => `
            <tr style="border-bottom:1px solid #f9fafb;cursor:pointer;" onclick="location.href='/commercial/client/'+encodeURIComponent('${c.id}')" title="Ouvrir la fiche client (interlocuteurs)" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
              data-nom="${(c.nom||'').replace(/"/g,'&quot;')}"
              data-contact="${(c.contact||'').replace(/"/g,'&quot;')}"
              data-email="${(c.email||'').replace(/"/g,'&quot;')}"
              data-tel="${(c.tel||'').replace(/"/g,'&quot;')}"
              data-mode="${(c.modeFacturation||'').replace(/"/g,'&quot;')}"
              data-siret="${(c.siret||'').replace(/"/g,'&quot;')}"
              data-activite="${c.activite||''}"
              data-ca-annee="${caDe(c.id).annee}"
              data-ca-total="${caDe(c.id).total}">
              <td class="bcell bcell-cli" style="display:none;text-align:center;" onclick="event.stopPropagation()"><input type="checkbox" class="bsel" data-bulk="cli" data-id="${escX(c.id)}" onclick="event.stopPropagation();bulkCount('cli')"/></td>
              <td style="${TD_S}"><div style="font-weight:700;color:#374151;">${escX(c.nom)}</div><div style="font-size:.65rem;color:#9ca3af;">${escX(c.id)}</div></td>
              <td style="${TD_S}font-weight:600;color:#374151;">${escX(c.contact||'—')}<div style="font-size:.7rem;color:#9ca3af;font-weight:400;">${escX(c.poste||'')}</div></td>
              <td style="${TD_S}color:#2563eb;font-size:.78rem;">${escX(c.email||'—')}</td>
              <td style="${TD_S}color:#6b7280;font-size:.78rem;">${escX(c.tel||'—')}</td>
              <td style="${TD_S}font-size:.78rem;color:#374151;">${escX(c.modeFacturation||'—')}</td>
              <td style="${TD_S}font-size:.72rem;color:#6b7280;">${escX(c.siret||'—')}</td>
              <td style="${TD_S}text-align:right;white-space:nowrap;font-weight:700;color:${caDe(c.id).annee>0?'#047857':'#9ca3af'};">${eurC(caDe(c.id).annee)}</td>
              <td style="${TD_S}text-align:right;white-space:nowrap;font-weight:700;color:${caDe(c.id).total>0?'#374151':'#9ca3af'};">${eurC(caDe(c.id).total)}</td>
              <td style="${TD_S}text-align:center;">${c.creditMontant>0?`<span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${c.creditMontant.toLocaleString('fr-FR')} €</span>`:'<span style="color:#9ca3af;font-size:.75rem;">—</span>'}</td>
              <td style="${TD_S}text-align:center;white-space:nowrap;">
                <button onclick="event.stopPropagation();editClient('${c.id}')" title="Modifier" style="width:28px;height:28px;border-radius:7px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;cursor:pointer;margin-right:4px;"><i class="fas fa-pen"></i></button>
                <button onclick="event.stopPropagation();deleteClientRow('${c.id}',this)" title="Supprimer" data-nom="${(c.nom||'').replace(/"/g,'&quot;')}" style="width:28px;height:28px;border-radius:7px;border:1px solid #fca5a5;background:#fef2f2;color:#b91c1c;cursor:pointer;"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${bulkSelectAssets([{ key: 'cli', base: '/api/clients/', label: 'client(s)' }])}

    <!-- MODAL Nouveau / Édition client -->
    <div id="clientsModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:6000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;max-width:600px;width:94%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#059669,#047857);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-building" style="margin-right:8px;"></i><span id="clModalTitle">Créer un nouveau client</span></div>
          <button onclick="closeClientsModal()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;overflow-y:auto;">
          <input type="hidden" id="clEditId" value=""/>
          <div style="grid-column:1/-1;"><label style="${LBL_C}">Raison sociale *</label><input id="clNom" type="text" placeholder="Raison sociale (texte libre)" style="${INP_C}"/></div>
          <div><label style="${LBL_C}">N° TVA intracommunautaire</label><input id="clTva" type="text" oninput="clTvaToSiret()" placeholder="FR + SIRET (ex : FR12 123456789…)" style="${INP_C}"/></div>
          <div><label style="${LBL_C}">SIRET <span style="font-weight:400;color:#94a3b8;font-size:.6rem;text-transform:none;">(rempli depuis la TVA)</span></label><input id="clSiret" type="text" placeholder="auto depuis la TVA" style="${INP_C}"/></div>
          <div style="grid-column:1/-1;"><label style="${LBL_C}">Mode de règlement</label><select id="clMode" style="${INP_C}"><option value="">— Choisir —</option>${MODES_FACTURATION.map(m=>`<option>${m}</option>`).join('')}</select></div>
          <div style="grid-column:1/-1;border-top:1px solid #f1f5f9;margin-top:2px;padding-top:10px;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:.66rem;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-address-book" style="margin-right:5px;"></i>Contacts <span style="font-weight:600;color:#94a3b8;text-transform:none;">(◉ = principal)</span></div>
            <button type="button" onclick="clAddContact()" style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:7px;padding:5px 10px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter un contact</button>
          </div>
          <div id="clContacts" style="grid-column:1/-1;"></div>

          <div style="grid-column:1/-1;border-top:1px solid #f1f5f9;margin-top:4px;padding-top:10px;font-size:.66rem;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-map-marker-alt" style="margin-right:5px;"></i>Adresse postale</div>
          <div style="grid-column:1/-1;"><label style="${LBL_C}">Rue</label><input id="clRue" type="text" placeholder="N° et rue" style="${INP_C}"/></div>
          <div><label style="${LBL_C}">Code postal</label><input id="clCp" type="text" placeholder="Code postal" style="${INP_C}"/></div>
          <div><label style="${LBL_C}">Ville</label><input id="clVille" type="text" placeholder="Ville" style="${INP_C}"/></div>

          <div style="grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-top:4px;">
            <input id="clFactDiff" type="checkbox" onchange="toggleFactBlock()" style="width:16px;height:16px;cursor:pointer;"/>
            <label for="clFactDiff" style="font-size:.78rem;font-weight:700;color:#374151;cursor:pointer;">Adresse de facturation différente</label>
          </div>
          <div id="clFactBlock" style="grid-column:1/-1;display:none;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="grid-column:1/-1;font-size:.66rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-file-invoice-dollar" style="margin-right:5px;"></i>Adresse de facturation</div>
            <div style="grid-column:1/-1;"><label style="${LBL_C}">Rue</label><input id="clFactRue" type="text" placeholder="N° et rue" style="${INP_C}"/></div>
            <div><label style="${LBL_C}">Code postal</label><input id="clFactCp" type="text" placeholder="Code postal" style="${INP_C}"/></div>
            <div><label style="${LBL_C}">Ville</label><input id="clFactVille" type="text" placeholder="Ville" style="${INP_C}"/></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="closeClientsModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="submitNewClient()" style="padding:9px 18px;background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i><span id="clSubmitLbl">Créer le client</span></button>
        </div>
      </div>
    </div>
  </div>`

  // ── TAB COMMANDES VALIDÉES ────────────────────────────────────
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear()-1)
  const cutoffStr = cutoff.toISOString().slice(0,10)
  const CMD_365 = CMD_DATA.filter(c => (c.dateCmd||'') >= cutoffStr)

  const cmdStatutBadge = (s: string) => {
    const m: Record<string,[string,string,string]> = {
      a_programmer:      ['#fef9c3','#854d0e','À programmer'],
      attente_prep:      ['#dbeafe','#1d4ed8','Attente prépa'],
      attente_reception: ['#e0f2fe','#0369a1','Attente matière'],
      en_production:     ['#d1fae5','#065f46','En production'],
      a_expedier:        ['#f3e8ff','#5b21b6','À expédier'],
      expedie:           ['#dcfce7','#15803d','Expédié ✓'],
      annule:            ['#fee2e2','#b91c1c','Annulé'],
    }
    const [bg,col,lbl] = m[s] ?? ['#f1f5f9','#6b7280',s]
    return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${lbl}</span>`
  }

  const tabCmdValidees = `
  <div id="svc-panel-cmd" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-check-double" style="color:#0ea5e9;"></i>Commandes validées
        <span style="background:#e0f2fe;color:#0369a1;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${CMD_365.length}</span>
        <span style="font-size:.7rem;color:#9ca3af;font-weight:400;">– 365 derniers jours</span>
      </div>
      ${searchBar('svc-cmd',[['client','Client'],['pieces','Pièce(s)'],['statut','Statut'],['affaire','N° affaire']])}
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-cmd">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="${TH_S}">N° CMD / Affaire</th>
            <th style="${TH_S}">Client</th>
            <th style="${TH_S}">Pièce(s)</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Date CMD</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Livraison</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
          </tr></thead>
          <tbody>
            ${CMD_365.length === 0 ? `<tr><td colspan="7" style="padding:48px;text-align:center;color:#9ca3af;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;"></i>Aucune commande sur les 365 derniers jours</td></tr>` :
            CMD_365.map(c => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
              data-client="${(c.client||'').replace(/"/g,'&quot;')}"
              data-pieces="${(c.pieces||[]).join(', ').replace(/"/g,'&quot;')}"
              data-statut="${(c.statut||'').replace(/"/g,'&quot;')}"
              data-affaire="${(c.numAffaire||'').replace(/"/g,'&quot;')}">
              <td style="${TD_S}"><div style="font-weight:700;color:#374151;">${escX(c.id)}</div><div style="font-size:.65rem;color:#9ca3af;">Aff. N°${escX(c.numAffaire)}</div></td>
              <td style="${TD_S}font-weight:600;color:#374151;">${escX(c.client)}</td>
              <td style="${TD_S}color:#6b7280;font-size:.78rem;max-width:180px;">${escX((c.pieces||[]).join(', '))}</td>
              <td style="${TD_S}text-align:right;font-weight:700;color:#374151;">${(c.montant||0).toLocaleString('fr-FR')} €</td>
              <td style="${TD_S}text-align:center;font-size:.75rem;color:#6b7280;">${c.dateCmd||'—'}</td>
              <td style="${TD_S}text-align:center;font-size:.75rem;color:${c.dateLiv?'#374151':'#9ca3af'};">${c.dateLiv||'—'}</td>
              <td style="${TD_S}text-align:center;">${cmdStatutBadge(c.statut)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`

  // ── TAB DASHBOARD (KPIs calculés depuis les vraies données reçues) ──
  const _numC = (v:any)=>{ const n=Number(v); return isFinite(n)?n:0 }
  const _curYC = new Date().getFullYear().toString()
  const _moisIdxC = new Date().getMonth()
  const MOIS3C = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
  const _caSerieC = Array(12).fill(0)
  ;(dbCmds || []).forEach((c:any)=>{ const dd=String(c.date_cmd||''); if(dd.slice(0,4)===_curYC){ const m=parseInt(dd.slice(5,7),10)-1; if(m>=0&&m<12) _caSerieC[m]+=_numC(c.montant) } })
  const _caYTDC = _caSerieC.reduce((s,v)=>s+v,0)
  const _caMoisC = _caSerieC[_moisIdxC] || 0
  const _avoirsActifsC = (AV_DATA as any[]).filter(a=>a.statut==='actif'||a.statut==='partiel')
  const _avoirsMontantC = _avoirsActifsC.reduce((s,a)=>s+_numC(a.montant),0)
  const _dtAttenteC = (DT_DATA as any[]).filter(d=>d.statut==='en_attente_be').length
  const _offEnCoursC = (OFF_DATA as any[]).filter(o=>o.statut==='en_attente_reponse'||o.statut==='offre_en_attente').length
  const _fmtEC = (n:number)=> Math.round(_numC(n)).toLocaleString('fr-FR')+' €'
  const tabDashboard = `
  <div id="svc-panel-dashboard" style="display:none;">
    ${panelHeader('Dashboard Commercial','fa-chart-bar','#f59e0b','dashboard',true)}
    <!-- KPI CARDS -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
      ${[
        {lbl:'CA commandé ('+MOIS3C[_moisIdxC]+')', val:_fmtEC(_caMoisC), sub:'YTD '+_fmtEC(_caYTDC), col:'#22c55e', ic:'fa-chart-line'},
        {lbl:'DT en attente BE',   val:String(_dtAttenteC), sub:'à analyser', col:'#f59e0b', ic:'fa-file-alt'},
        {lbl:'Offres en cours',    val:String(_offEnCoursC), sub:'sans réponse', col:'#6366f1', ic:'fa-file-invoice-dollar'},
        {lbl:'Avoirs actifs',      val:_fmtEC(_avoirsMontantC), sub:_avoirsActifsC.length+' avoir(s)', col:'#ef4444', ic:'fa-undo-alt'},
      ].map(k=>`<div style="background:white;border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:4px solid ${k.col};">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:36px;height:36px;border-radius:10px;background:${k.col}18;display:flex;align-items:center;justify-content:center;"><i class="fas ${k.ic}" style="color:${k.col};font-size:.85rem;"></i></div>
          <div style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;">${k.lbl}</div>
        </div>
        <div style="font-size:1.5rem;font-weight:900;color:#111827;">${k.val}</div>
        <div style="font-size:.7rem;color:#9ca3af;margin-top:4px;">${k.sub}</div>
      </div>`).join('')}
    </div>
    <!-- CA MENSUEL -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:20px;">
      <div style="background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px;"><i class="fas fa-chart-bar" style="color:#3b82f6;margin-right:6px;"></i>CA commandé mensuel ${_curYC}</div>
        ${(()=>{ const _maxC=Math.max(1,..._caSerieC); const _rowsC=_caSerieC.slice(0,_moisIdxC+1); return (_caYTDC>0) ? _rowsC.map((v,i)=>{ const pct=Math.round(v/_maxC*100); return `<div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px;"><span style="font-weight:600;color:#374151;">${MOIS3C[i]}</span><span style="font-weight:700;color:#374151;">${_fmtEC(v)}</span></div>
            <div style="background:#f1f5f9;border-radius:999px;height:10px;overflow:hidden;"><div style="background:linear-gradient(90deg,#3b82f6,#6366f1);height:100%;width:${pct}%;border-radius:999px;transition:width .5s;"></div></div>
          </div>`}).join('') : `<div style="text-align:center;padding:20px;color:#9ca3af;font-size:.78rem;">Aucune commande enregistrée cette année</div>` })()}
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;">
          <span style="font-size:.75rem;font-weight:700;color:#374151;">Total cumulé ${_curYC}</span>
          <span style="font-size:.88rem;font-weight:900;color:#1d4ed8;">${_fmtEC(_caYTDC)}</span>
        </div>
      </div>
      <div style="background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px;"><i class="fas fa-users" style="color:#10b981;margin-right:6px;"></i>Top Clients</div>
        ${([] as [string,string,string][]).map(([nom,ca,col])=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f8fafc;">
          <span style="font-size:.78rem;font-weight:600;color:#374151;">${nom}</span>
          <span style="font-size:.78rem;font-weight:800;color:${col};">${ca}</span>
        </div>`).join('')}
      </div>
    </div>
    <!-- PIPELINE DT → OFFRE → CMD -->
    <div style="background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.07);margin-bottom:16px;">
      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px;"><i class="fas fa-project-diagram" style="color:#6366f1;margin-right:6px;"></i>Pipeline Commercial – Affaires en cours</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${[
          {lbl:'DT en attente BE', items: DT_DATA.filter(d=>d.statut==='en_attente_be'), col:'#f59e0b', ic:'fa-file-alt'},
          {lbl:'Offres en attente réponse', items: OFF_DATA.filter(o=>o.statut==='en_attente_reponse'||o.statut==='offre_en_attente'), col:'#6366f1', ic:'fa-file-invoice-dollar'},
          {lbl:'Commandes à programmer', items: CMD_DATA.filter(c=>c.statut==='a_programmer'), col:'#3b82f6', ic:'fa-check-circle'},
        ].map(col=>`<div style="background:#f8fafc;border-radius:10px;padding:14px;">
          <div style="font-size:.68rem;font-weight:800;color:${col.col};text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i class="fas ${col.ic}"></i>${col.lbl} <span style="background:${col.col};color:white;border-radius:999px;padding:0 7px;font-size:.65rem;">${col.items.length}</span></div>
          ${col.items.map(it=>`<div style="background:white;border-radius:8px;padding:8px 10px;margin-bottom:6px;box-shadow:0 1px 2px rgba(0,0,0,.05);font-size:.75rem;">
            <div style="font-weight:700;color:#374151;">${(it as any).id}</div>
            <div style="color:#6b7280;">${escX((it as any).client)}</div>
          </div>`).join('')}
        </div>`).join('')}
      </div>
    </div>
  </div>`

  // ── TAB AFFAIRES (vue circuit complet, groupée par num_affaire) ──
  // Regroupe DT / offres / commandes par numéro d'affaire (le fil conducteur). Chaque ligne ouvre la fiche affaire 360.
  const AFF_MAP = new Map<string, any>()
  const affAdd = (num: any, kind: string, item: any) => {
    const k = String(num ?? '').trim(); if (!k) return
    if (!AFF_MAP.has(k)) AFF_MAP.set(k, { num: k, client: '', dts: [], offres: [], cmds: [] })
    const a = AFF_MAP.get(k); a[kind].push(item); if (!a.client && item.client) a.client = item.client
  }
  ;(DT_DATA as any[]).forEach((d: any) => affAdd(d.numAffaire, 'dts', d))
  ;(OFF_DATA as any[]).forEach((o: any) => affAdd(o.numAffaire, 'offres', o))
  ;(CMD_DATA as any[]).forEach((c: any) => affAdd(c.numAffaire, 'cmds', c))
  const AFFAIRES = Array.from(AFF_MAP.values()).sort((a: any, b: any) => String(b.num).localeCompare(String(a.num), 'fr', { numeric: true }))
  // Petits compteurs affichés sur les onglets (nb d'éléments dans chaque liste)
  const TAB_BADGE: Record<string, number> = {
    site: (SITE_DATA as any[]).length,
    dt: (DT_DATA as any[]).length,
    offre: OFF_A_TRAITER.length,
    avoirs: (AV_DATA as any[]).length,
    clients: (CLI_DATA as any[]).length,
    cmd: (CMD_DATA as any[]).length,
    affaires: AFFAIRES.length,
  }
  const affStep = (label: string, on: boolean, col: string) => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.64rem;font-weight:700;padding:2px 8px;border-radius:999px;${on ? `background:${col}22;color:${col};` : 'background:#f1f5f9;color:#cbd5e1;'}"><i class="fas ${on ? 'fa-check-circle' : 'fa-circle'}" style="font-size:.55rem;"></i>${label}</span>`
  const tabAffaires = `
  <div id="svc-panel-affaires" style="display:none;">
    ${panelHeader('Affaires — vue circuit complet', 'fa-folder-tree', '#0891b2', 'affaires', true)}
    <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.78rem;color:#0e7490;">
      <i class="fas fa-circle-info" style="margin-right:6px;"></i>Chaque affaire regroupe <strong>tout son circuit</strong> : DT → offre → commande → production → livraison → facturation. Cliquez sur une affaire pour ouvrir sa <strong>fiche complète</strong>.
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      ${AFFAIRES.length === 0 ? `<div style="padding:36px;text-align:center;color:#9ca3af;font-size:.85rem;"><i class="fas fa-folder-open" style="font-size:1.6rem;display:block;margin-bottom:8px;"></i>Aucune affaire pour le moment.</div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="svc-list-affaires">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Affaire</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Circuit</th>
            <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Montant</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Action</th>
          </tr></thead>
          <tbody>
            ${AFFAIRES.map((a: any) => {
              const off = a.offres[0], cmd = a.cmds[0]
              const montant = cmd ? (Number(cmd.montant) || 0) : (off ? (Number(off.montant) || 0) : 0)
              const statut = cmd ? cmd.statut : (off ? off.statut : (a.dts[0] ? a.dts[0].statut : ''))
              return `
            <tr style="border-bottom:1px solid #f9fafb;cursor:pointer;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''" onclick="location.href='/commercial/affaire/'+encodeURIComponent('${escX(a.num)}')">
              <td style="padding:10px 14px;font-weight:800;color:#0891b2;">N° ${escX(a.num)}</td>
              <td style="padding:10px 14px;font-weight:600;color:#374151;">${escX(a.client || '—')}</td>
              <td style="padding:10px 14px;"><div style="display:flex;gap:5px;flex-wrap:wrap;">${affStep('DT', a.dts.length > 0, '#3b82f6')}${affStep('Offre', a.offres.length > 0, '#6366f1')}${affStep('Commande', a.cmds.length > 0, '#0ea5e9')}</div></td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${montant ? montant.toLocaleString('fr-FR') + ' €' : '—'}</td>
              <td style="padding:10px 14px;text-align:center;">${statut ? statusBadge(statut) : '—'}</td>
              <td style="padding:10px 14px;text-align:center;"><span style="padding:4px 12px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;border-radius:7px;font-size:.72rem;font-weight:700;"><i class="fas fa-folder-open" style="margin-right:4px;"></i>Ouvrir</span></td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  </div>`

  const content = `
  ${serviceHeader({
    icon: 'fa-briefcase',
    color: '#3b82f6',
    darkBg: '#1e3a5f',
    title: 'Service Commercial',
    subtitle: 'Corinne · DT · Offres · Affaires · Avoirs · CA · Demandes site · EN 9100:2018',
    tabs: TABS.map(([id,lbl,ic]) => ({ id, label: lbl, icon: ic, badge: (TAB_BADGE as any)[id] })),
    switchFn: 'switchSvcTab',
    tabIdPrefix: 'svc-tab',
    activeId: 'site'
  })}
  <div style="padding:22px 30px;">

    ${tabSite}
    ${tabDT}
    ${tabOffre}
    ${tabAvoirs}
    ${tabClients}
    ${tabCmdValidees}
    ${tabAffaires}
    ${tabDashboard}

  </div>
  <script>
  var SVC_TABS=['site','dt','offre','avoirs','clients','cmd','affaires','dashboard'];
  var SVC_COLS={site:'#0d9488',dt:'#3b82f6',offre:'#6366f1',avoirs:'#8b5cf6',clients:'#059669',cmd:'#0ea5e9',affaires:'#0891b2',dashboard:'#f59e0b'};
  var AV_RAW=${sjX(AV_RAW_DATA)};
  // Logo + identité société pour le devis imprimable. Injectés via sjX() (JSON.stringify) :
  // seul moyen sûr de faire passer un SVG multi-lignes dans ce bloc <script>.
  var DEVIS_LOGO=${sjX(LOGO_SVG)};
  var DEVIS_SOC=${sjX({ nom: SOCIETE.nom, activite: SOCIETE.activite, lignes: societeLignes() })};
  var BRAND_VIOLET=${sjX(BRAND.violet)}; var BRAND_BLEU=${sjX(BRAND.bleu)};

  function switchSvcTab(id){
    SVC_TABS.forEach(function(t){
      var p=document.getElementById('svc-panel-'+t);
      var b=document.getElementById('svc-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b){ b.classList.toggle('active',t===id); }
    });
  }

  function toggleSvcForm(tab){
    var f=document.getElementById('svc-form-'+tab);
    if(!f) return;
    var isHidden=f.style.display==='none'||f.style.display==='';
    f.style.display=isHidden?'block':'none';
    if(isHidden){ if(tab==='avoirs' && window._avResetForm) window._avResetForm(); f.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }

  function filterSvcList(tab,q){
    var tbl=document.getElementById('svc-list-'+tab);
    if(!tbl) return;
    var lq=q.toLowerCase();
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      tr.style.display=tr.textContent.toLowerCase().indexOf(lq)>=0?'':'none';
    });
  }
  var _cliAct='all';
  // Tri de la liste clients : alphabétique, CA de l'année, CA total (décroissant pour les CA).
  // Purement visuel : on réordonne les lignes du tbody, la recherche et le filtre activité
  // (qui masquent des lignes) continuent de fonctionner indépendamment.
  function sortClients(mode,btn){
    ['nom','ca_annee','ca_total'].forEach(function(x){ var b=document.getElementById('clisort-'+x); if(b) b.classList.toggle('active',x===mode); });
    var tb=document.querySelector('#svc-clients tbody'); if(!tb) return;
    var rows=Array.prototype.slice.call(tb.querySelectorAll('tr')).filter(function(r){ return r.hasAttribute('data-nom'); });
    rows.sort(function(a,b){
      if(mode==='nom') return (a.getAttribute('data-nom')||'').localeCompare(b.getAttribute('data-nom')||'','fr',{sensitivity:'base'});
      var k=(mode==='ca_annee')?'data-ca-annee':'data-ca-total';
      var d=(parseFloat(b.getAttribute(k))||0)-(parseFloat(a.getAttribute(k))||0);
      return d!==0?d:(a.getAttribute('data-nom')||'').localeCompare(b.getAttribute('data-nom')||'','fr',{sensitivity:'base'});
    });
    rows.forEach(function(r){ tb.appendChild(r); });
  }
  window.sortClients=sortClients;
  function setCliAct(a,btn){
    _cliAct=a;
    ['all','Seem','Semrac','both'].forEach(function(x){ var b=document.getElementById('cliact-'+x); if(b) b.classList.toggle('active',x===a); });
    svcSearch('svc-clients');
  }
  function svcSearch(tableId){
    var sel=document.getElementById('sel-'+tableId);
    var inp=document.getElementById('q-'+tableId);
    var col=sel?sel.value:'all';
    var lq=inp?inp.value.toLowerCase().trim():'';
    var tbl=document.getElementById(tableId);
    if(!tbl) return;
    var actF=(tableId==='svc-clients')?_cliAct:'all';
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      var text=col==='all'?tr.textContent:(tr.dataset[col]||'');
      var okSearch=(!lq||text.toLowerCase().indexOf(lq)>=0);
      var okAct=(actF==='all')||((tr.dataset.activite||'')===actF);
      tr.style.display=(okSearch&&okAct)?'':'none';
    });
  }

  var FAC_JS = ${sjX(FAC_JS)};
  window._avFacClient=""; window._avFacNum="";
  // Aperçu du n° d'avoir : AV-<affaire> si rattaché, sinon AVL-… (libre)
  function avAffairePreview(){
    var aff=((document.getElementById("av_affaire")||{}).value||"").trim();
    var y=new Date().getFullYear();
    var el=document.getElementById("av-num-preview"); if(!el) return;
    el.textContent = aff ? ("N° avoir : AV-"+y+"-"+aff+" (rattaché à l'affaire)") : ("N° avoir : AVL-"+y+"-… (libre, incrémental)");
  }
  // « Charger une facture client » → renseigne l'affaire + sélectionne le client de la facture
  function avOrigineChange(){ var o=(document.getElementById("av_origine")||{}).value; var b=document.getElementById("av-matiere-block"); if(b) b.style.display=(o==="matiere")?"block":"none"; }
  window.avOrigineChange=avOrigineChange;
  function avFactureChange(){
    var sel=document.getElementById("av_facture"); if(!sel) return;
    var f=null; for(var i=0;i<FAC_JS.length;i++){ if(String(FAC_JS[i].id)===String(sel.value)){ f=FAC_JS[i]; break; } }
    if(!f){ window._avFacClient=""; window._avFacNum=""; avAffairePreview(); return; }
    var aff=document.getElementById("av_affaire"); if(aff) aff.value=f.affaire||"";
    var csel=document.getElementById("av_client");
    if(csel){ var found=false; for(var k=0;k<csel.options.length;k++){ if((csel.options[k].text||"")===f.client){ csel.selectedIndex=k; found=true; break; } } if(!found) csel.selectedIndex=0; }
    window._avFacClient=f.client||""; window._avFacNum=f.num||"";
    avAffairePreview();
  }
  function submitSvcForm(tab){
    var msgs={
      site:  "Demande site enregistrée. Corinne notifiée pour traitement.",
      dt:    "DT créée. N° d'affaire attribué automatiquement. Analyste BE notifié.",
      offre: "Offre créée et envoyée au client. En attente de réponse."
    };
    // AVOIR : crée l'avoir en base (credits) — n° = AV-<affaire> si rattaché, sinon AVL-… (libre) —
    // puis, si la case est cochée, le soumet à la validation Direction avec son VRAI id.
    if(tab==="avoirs"){
      var csel=document.getElementById("av_client");
      var cid=csel?csel.value:"";
      var cnom=(csel&&csel.value)?((csel.options[csel.selectedIndex]||{}).text||""):(window._avFacClient||"");
      var montant=parseFloat((document.getElementById("av_montant")||{}).value)||0;
      var motif=(document.getElementById("av_motif")||{}).value||"";
      var typ=(document.getElementById("av_type")||{}).value||"";
      var dat=(document.getElementById("av_date")||{}).value||"";
      var affaire=((document.getElementById("av_affaire")||{}).value||"").trim();
      var facNum=window._avFacNum||"";
      var facId=(document.getElementById("av_facture")||{}).value||"";
      var mode=(document.getElementById("av_mode")||{}).value||"deduire_facture";
      var origine=(document.getElementById("av_origine")||{}).value||"commercial";
      var facCible=(document.getElementById("av_facture_cible")||{}).value||"";
      if(!cid&&!cnom){ pushNotif("err","fa-ban","Sélectionnez un client (ou chargez une facture).",4000); return; }
      if(!(montant>0)){ pushNotif("err","fa-ban","Montant de l'avoir requis.",4000); return; }
      var editId=window._avEditId||"";
      var url=editId?("/api/credits/"+encodeURIComponent(editId)):"/api/credits";
      var method=editId?"PATCH":"POST";
      fetch(url,{method:method,headers:{"Content-Type":"application/json"},body:JSON.stringify({client_id:cid,client_nom:cnom,montant:montant,motif:motif,type:typ,date_credit:dat,num_affaire:affaire,num_facture:facNum,mode_restitution:mode,origine:origine,facture_source_id:(origine==="matiere"?facId:null),facture_cible_id:(origine==="matiere"?facCible:null)})})
        .then(function(r){return r.json();}).then(function(j){
          if(!j||!j.ok){ pushNotif("err","fa-times","Erreur: "+((j&&j.error)||"inconnu"),5000); return; }
          if(!editId && window.submitValidation){ submitValidation("commercial","av_vd",{type:"Avoir "+typ,objet:(cnom||"Client")+" — "+motif,montant:montant,priorite:"normal",ref_table:"credits",ref_id:j.id}); }
          pushNotif("ok","fa-check-circle","Avoir "+(j.id||editId)+" "+(editId?"modifié":"émis")+" ("+montant.toFixed(2)+" €)"+(cnom?(" — "+cnom):"")+".",6000);
          _avResetForm();
          toggleSvcForm("avoirs");
          if(window.softReload) setTimeout(function(){ softReload(); }, 700);
        }).catch(function(){ pushNotif("err","fa-times","Erreur réseau.",5000); });
      return;
    }
    pushNotif('ok','fa-check-circle', msgs[tab]||'Enregistré.', 6000);
    toggleSvcForm(tab);
  }

  function _avResetForm(){
    window._avEditId='';
    var t=document.getElementById('av-form-title'); if(t) t.textContent='Nouvel avoir';
    var b=document.getElementById('av-submit-lbl'); if(b) b.textContent="Émettre l'avoir";
  }
  window._avResetForm=_avResetForm;
  function editSvcItem(tab,id){
    if(tab==='avoirs'){
      var a=null; for(var i=0;i<AV_RAW.length;i++){ if(String(AV_RAW[i].id)===String(id)){ a=AV_RAW[i]; break; } }
      if(!a){ pushNotif('err','fa-times','Avoir '+id+' introuvable.',4000); return; }
      var f=document.getElementById('svc-form-avoirs'); if(f) f.style.display='block';
      window._avEditId=id;
      var set=function(fid,v){ var e=document.getElementById(fid); if(e) e.value=(v==null?'':v); };
      set('av_client',a.client_id); set('av_montant',a.montant); set('av_motif',a.motif);
      set('av_type',a.type||'avance'); set('av_date',a.date_credit); set('av_affaire',a.num_affaire);
      // Deux modes seulement : facture en cours OU commande suivante. Tout héritage
      // (ancien « rembourser », valeur vide) retombe explicitement sur « facture en cours ».
      set('av_mode',(a.mode_restitution==='deduire_suivante')?'deduire_suivante':'deduire_facture'); set('av_origine',a.origine||'commercial');
      set('av_facture_cible',a.facture_cible_id);
      if(window.avOrigineChange) avOrigineChange();
      var t=document.getElementById('av-form-title'); if(t) t.textContent='Modifier l\\'avoir '+id;
      var b=document.getElementById('av-submit-lbl'); if(b) b.textContent='Enregistrer les modifications';
      if(f) f.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;
    }
    pushNotif('info','fa-edit','Édition de '+id+' – formulaire complet en cours de déploiement.',4000);
  }

  async function deleteSvcItem(tab,id){
    if(!await appConfirm('Supprimer définitivement '+id+' ?')) return;
    if(tab==='offre'){
      fetch('/api/offre/'+encodeURIComponent(id),{method:'DELETE'})
        .then(function(r){return r.json();}).then(function(j){
          if(!j||!j.ok){ pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
          pushNotif('ok','fa-trash','Offre '+id+' supprimée.',3500);
          setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#offre'); },700);
        }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.',4000); });
      return;
    }
    if(tab==='avoirs'){
      fetch('/api/credits/'+encodeURIComponent(id),{method:'DELETE'})
        .then(function(r){return r.json();}).then(function(j){
          if(!j||!j.ok){ pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
          pushNotif('ok','fa-trash','Avoir '+id+' supprimé.',3500);
          if(window.softReload) setTimeout(function(){ softReload(); },700);
        }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.',4000); });
      return;
    }
    pushNotif('warn','fa-trash','Suppression de '+id+' enregistrée.',4000);
  }

  // ── Offres : modale de validation + édition + suppression (reliées à la DB) ──
  function _svcModal(html){
    var ov=document.getElementById('svc-offre-modal');
    if(!ov){ ov=document.createElement('div'); ov.id='svc-offre-modal'; ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;display:flex;align-items:center;justify-content:center;'; document.body.appendChild(ov); }
    ov.innerHTML=html; ov.style.display='flex';
  }
  var _svcLockRes=null;
  function _svcModalClose(){ if(_svcLockRes){ ErpLock.release(_svcLockRes); _svcLockRes=null; } var ov=document.getElementById('svc-offre-modal'); if(ov) ov.style.display='none'; }
  function svcOuvrirValidationOffre(id, client, montant, marge){
    var euro=function(v){ return (Number(v)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; };
    _svcModal('<div style="background:white;border-radius:16px;max-width:440px;width:92%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);">'
      +'<div style="padding:16px 22px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-weight:800;font-size:1rem;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Valider l\\'offre '+id+'</div>'
      +'<div style="padding:22px;font-size:.85rem;color:#374151;">'
      +'<div style="margin-bottom:12px;">Client : <strong>'+(client||'—')+'</strong></div>'
      +'<div style="display:flex;gap:10px;margin-bottom:14px;">'
      +'<div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;text-align:center;"><div style="font-size:.62rem;color:#166534;text-transform:uppercase;font-weight:700;">Montant</div><div style="font-size:1.05rem;font-weight:800;color:#15803d;">'+euro(montant)+'</div></div>'
      +'<div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px;text-align:center;"><div style="font-size:.62rem;color:#1e40af;text-transform:uppercase;font-weight:700;">Marge</div><div style="font-size:1.05rem;font-weight:800;color:#1d4ed8;">'+(Number(marge)||0).toFixed(1)+' %</div></div>'
      +'</div>'
      +'<div style="font-size:.74rem;color:#6b7280;background:#f8fafc;border-radius:8px;padding:10px;"><i class="fas fa-info-circle" style="margin-right:5px;color:#22c55e;"></i>La validation marque l\\'offre comme <strong>acceptée par le client</strong> et <strong>crée la commande</strong> (visible en Production &laquo; à programmer &raquo;). Les avoirs client en cours sont automatiquement déduits.</div>'
      +'<div style="margin-top:12px;"><label style="display:block;font-size:.62rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Date de livraison confirmée <span style="text-transform:none;color:#9ca3af;font-weight:500;">(optionnel — la Production peut la fixer ensuite)</span></label><input type="date" id="svc-val-dateliv" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.83rem;box-sizing:border-box;"/></div>'
      +'</div>'
      +'<div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">'
      +'<button onclick="_svcModalClose()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'
      +'<button onclick="svcConfirmerValidationOffre(\\''+id+'\\')" style="padding:9px 18px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Valider l\\'offre</button>'
      +'</div></div>');
  }
  // ─── Fiche Commande 360 (coûts/marge réels + traçabilité production) ───
  function openFicheCommande(id){
    _svcModal('<div style="background:white;border-radius:16px;max-width:520px;width:92%;padding:42px;text-align:center;color:#64748b;"><i class="fas fa-spinner fa-spin" style="font-size:1.4rem;color:#8b5cf6;"></i><div style="margin-top:10px;font-size:.85rem;">Chargement de la fiche commande...</div></div>');
    fetch('/api/commande/'+encodeURIComponent(id)+'/detail').then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ _svcModalClose(); pushNotif('err','fa-times',(j&&j.error)||'Commande introuvable.',5000); return; }
      _svcModal(renderFicheCommande(j));
    }).catch(function(){ _svcModalClose(); pushNotif('err','fa-times','Erreur réseau.',5000); });
  }
  function renderFicheCommande(j){
    var euro=function(v){ return (Number(v)||0).toLocaleString('fr-FR',{maximumFractionDigits:0})+' €'; };
    var c=j.cmd||{}, k=j.kpi||{};
    var margeCol=(k.marge==null)?'#64748b':(k.marge>=0?'#16a34a':'#dc2626');
    var pct=k.avancement||0;
    function kp(lbl,val,col,sub){ return '<div style="background:#f8fafc;border-radius:10px;padding:11px 13px;border-top:3px solid '+col+';"><div style="font-size:1.1rem;font-weight:800;color:'+col+';line-height:1.15;">'+val+'</div><div style="font-size:.63rem;color:#6b7280;font-weight:700;margin-top:2px;">'+lbl+'</div>'+(sub?'<div style="font-size:.59rem;color:#9ca3af;">'+sub+'</div>':'')+'</div>'; }
    function tbl(title,icon,headers,rows){ var th=headers.map(function(h){return '<th style="text-align:'+(h.a||'left')+';padding:6px 9px;font-size:.59rem;text-transform:uppercase;color:#6b7280;">'+h.t+'</th>';}).join(''); return '<div style="margin-top:14px;"><div style="font-weight:800;color:#111827;font-size:.8rem;margin-bottom:6px;"><i class="fas '+icon+'" style="margin-right:6px;color:#8b5cf6;"></i>'+title+'</div><div style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden;max-height:200px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:.73rem;"><thead><tr style="background:#faf5ff;position:sticky;top:0;">'+th+'</tr></thead><tbody>'+(rows||'<tr><td colspan="'+headers.length+'" style="text-align:center;padding:14px;color:#cbd5e1;">Aucun</td></tr>')+'</tbody></table></div></div>'; }
    var bdtRows=(j.bdts||[]).map(function(b){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-weight:600;">'+(b.piece||'—')+'</td><td style="padding:6px 9px;">'+(b.operation||'—')+'</td><td style="padding:6px 9px;text-align:center;">'+(b.machine==='machine'?'<i class="fas fa-cog" style="color:#6366f1;" title="machine"></i>':'<i class="fas fa-user" style="color:#94a3b8;" title="main d oeuvre"></i>')+'</td><td style="padding:6px 9px;text-align:right;">'+(b.temps_reel!=null?b.temps_reel:b.duree)+' h</td><td style="padding:6px 9px;text-align:center;font-size:.65rem;">'+(b.statut||'')+'</td></tr>'; }).join('');
    var lotRows=(j.lots||[]).map(function(l){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.69rem;">'+(l.id||'')+'</td><td style="padding:6px 9px;">'+(l.piece||'—')+'</td><td style="padding:6px 9px;text-align:center;">'+(l.qte||0)+'</td><td style="padding:6px 9px;text-align:center;font-size:.65rem;">'+(l.statut||'')+'</td><td style="padding:6px 9px;text-align:center;">'+(l.nc>0?'<span style="color:#dc2626;font-weight:700;">'+l.nc+'</span>':'0')+'</td></tr>'; }).join('');
    var matRows=(j.matieres||[]).map(function(m){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;">'+(m.article||'—')+'</td><td style="padding:6px 9px;text-align:center;">'+(m.quantite||0)+'</td><td style="padding:6px 9px;text-align:right;">'+euro(m.total)+'</td><td style="padding:6px 9px;text-align:center;font-size:.65rem;">'+(m.date||'')+'</td></tr>'; }).join('');
    var facRows=(j.factures||[]).map(function(f){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.69rem;">'+(f.num||'')+'</td><td style="padding:6px 9px;text-align:right;">'+euro(f.montant_ht)+'</td><td style="padding:6px 9px;text-align:center;font-size:.65rem;">'+(f.statut||'')+'</td><td style="padding:6px 9px;text-align:center;font-size:.65rem;">'+(f.date||'')+'</td></tr>'; }).join('');
    var ncRows=(j.ncs||[]).map(function(n){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.69rem;">'+(n.id||'')+'</td><td style="padding:6px 9px;">'+(n.gravite||'')+'</td><td style="padding:6px 9px;font-size:.65rem;">'+(n.statut||'')+'</td><td style="padding:6px 9px;font-size:.65rem;">'+(n.lot||'')+'</td></tr>'; }).join('');
    return '<div style="background:white;border-radius:16px;max-width:780px;width:94%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);">'
      +'<div style="padding:16px 22px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">'
      +'<div><div style="font-weight:800;font-size:1.05rem;"><i class="fas fa-chart-pie" style="margin-right:8px;"></i>Commande '+(c.num_affaire||c.id||'')+'</div><div style="font-size:.74rem;opacity:.85;margin-top:2px;">'+(c.client_nom||'—')+' · '+(c.statut||'')+(c.date_liv?(' · Livraison '+c.date_liv):'')+'</div></div>'
      +'<button onclick="_svcModalClose()" style="background:rgba(255,255,255,.2);border:none;color:white;width:30px;height:30px;border-radius:8px;cursor:pointer;"><i class="fas fa-times"></i></button></div>'
      +'<div style="padding:18px 22px;overflow-y:auto;">'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:10px;">'
      +kp('Budget (devis)', euro(k.budget), '#0ea5e9', '')
      +kp('CA facturé', euro(k.caFacture), '#22c55e', (j.factures||[]).length+' facture(s)')
      +kp('Coût réel', euro(k.coutReel), '#f59e0b', 'MO+machine+matière')
      +kp('Marge', (k.marge!=null?euro(k.marge):'—')+(k.margePct!=null?' ('+k.margePct+'%)':''), margeCol, k.caFacture>0?'sur CA facturé':'sur budget')
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px;">'
      +kp('Main d\\'oeuvre', euro(k.coutMo), '#6366f1', (k.moH||0)+' h')
      +kp('Machine', euro(k.coutMach), '#0d9488', (k.machH||0)+' h')
      +kp('Matière', euro(k.coutMat), '#d97706', (j.matieres||[]).length+' sortie(s)')
      +'</div>'
      +'<div style="margin-top:14px;background:#f8fafc;border-radius:10px;padding:12px;"><div style="display:flex;justify-content:space-between;font-size:.74rem;font-weight:700;color:#374151;margin-bottom:5px;"><span>Avancement production</span><span>'+(k.bdtSoldes||0)+'/'+(k.bdtTotal||0)+' BDT · '+pct+'%</span></div><div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden;"><div style="height:100%;background:'+(pct===100?'#22c55e':(pct>0?'#f59e0b':'#cbd5e1'))+';width:'+pct+'%;"></div></div></div>'
      +tbl('Bons de travail','fa-list-check',[{t:'Pièce'},{t:'Opération'},{t:'Type',a:'center'},{t:'Temps',a:'right'},{t:'Statut',a:'center'}],bdtRows)
      +tbl('Lots','fa-layer-group',[{t:'Lot'},{t:'Pièce'},{t:'Qté',a:'center'},{t:'Statut',a:'center'},{t:'NC',a:'center'}],lotRows)
      +tbl('Matière consommée','fa-boxes-stacked',[{t:'Article'},{t:'Qté',a:'center'},{t:'Coût',a:'right'},{t:'Date',a:'center'}],matRows)
      +tbl('Factures client','fa-file-invoice',[{t:'N°'},{t:'Montant HT',a:'right'},{t:'Statut',a:'center'},{t:'Date',a:'center'}],facRows)
      +((j.ncs||[]).length?tbl('Non-conformités','fa-triangle-exclamation',[{t:'NC'},{t:'Gravité'},{t:'Statut'},{t:'Lot'}],ncRows):'')
      +'</div></div>';
  }
  function svcConfirmerValidationOffre(id){
    var dl=(document.getElementById('svc-val-dateliv')||{}).value||null;
    // /accepter (et non /valider) : crée REELLEMENT la commande, applique les avoirs, passe l'offre en 'acceptee'. Idempotent.
    fetch('/api/offre/'+encodeURIComponent(id)+'/accepter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_liv:dl})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
        _svcModalClose();
        var cid=(j.commande&&j.commande.id)||'';
        var av=(Number(j.avoir_applique)>0)?(' Avoir déduit : '+Number(j.avoir_applique).toLocaleString('fr-FR')+' €.'):'';
        pushNotif('ok','fa-check-circle','Offre '+id+' validée. Commande '+cid+(j.already?' (déjà créée)':' créée')+' — disponible en Production.'+av,7000);
        setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#offre'); },1100);
      }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.',5000); });
  }
  // Négociation = révision sur place (compteur de version). Rouvre l'offre en édition.
  function svcNegocierOffre(id){
    _svcModal('<div style="background:white;border-radius:16px;max-width:440px;width:92%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);">'
      +'<div style="padding:16px 22px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;font-weight:800;font-size:1rem;"><i class="fas fa-comments-dollar" style="margin-right:8px;"></i>Négocier l\\'offre '+id+'</div>'
      +'<div style="padding:22px;font-size:.85rem;color:#374151;">'
      +'<div style="font-size:.78rem;color:#6b7280;margin-bottom:12px;">Le client négocie : on rouvre l\\'offre en <strong>révision</strong> (nouvelle version), puis tu ajustes prix/marge et tu la renvoies.</div>'
      +'<label style="display:block;font-size:.65rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:5px;">Point à négocier (optionnel)</label>'
      +'<textarea id="svc-negoc-motif" rows="3" placeholder="ex : remise 5%, délai, quantité…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;outline:none;resize:vertical;box-sizing:border-box;"></textarea>'
      +'</div>'
      +'<div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">'
      +'<button onclick="_svcModalClose()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'
      +'<button onclick="svcConfirmerNegociation(\\''+id+'\\')" style="padding:9px 18px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-comments-dollar" style="margin-right:5px;"></i>Rouvrir en négociation</button>'
      +'</div></div>');
  }
  function svcConfirmerNegociation(id){
    var motif=((document.getElementById('svc-negoc-motif')||{}).value||'').trim();
    fetch('/api/offre/'+encodeURIComponent(id)+'/negocier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({motif:motif})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
        _svcModalClose();
        pushNotif('ok','fa-comments-dollar','Offre '+id+' rouverte en négociation (v'+(j.version||2)+'). Ajuste puis renvoie.',5000);
        setTimeout(function(){ window.location.href='/commercial/offre/edit?id='+encodeURIComponent(id); },900);
      }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.',5000); });
  }
  // Édition d'une offre = page dédiée « à l'image de l'analyse DT »
  // (résumé des coûts par produit, coefficient de marge par produit,
  // certifications/traçabilité, avoirs applicables). Le verrou d'édition
  // est pris sur la page cible (ErpLock au chargement).
  function editOffre(id){
    window.location.href='/commercial/offre/edit?id='+encodeURIComponent(id);
  }

  async function svcValiderOffre(id){
    if(!await appConfirm('Confirmer l\\'acceptation de l\\'offre '+id+' par le client ?')) return;
    try {
      var res = await fetch('/api/offre/'+encodeURIComponent(id)+'/valider',{method:'POST'});
      var data = await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      pushNotif('ok','fa-check-circle','Offre '+id+' validée. Commande créée automatiquement. Production notifiée.',7000);
      setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#offre'); }, 1000);
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  // Passe l'offre de "offre_en_attente" à "en_attente_reponse" (envoyée au client)
  async function svcEnvoyerOffre(id){
    if(!await appConfirm('Envoyer l\\'offre '+id+' au client ?\\nElle passera en « En attente de réponse client ».')) return;
    try {
      var res = await fetch('/api/offre/'+encodeURIComponent(id)+'/envoyer',{method:'POST'});
      var data = await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      pushNotif('ok','fa-paper-plane','Offre '+id+' envoyée au client.',5000);
      setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#offre'); }, 1000);
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  // ── DEVIS PDF (fenêtre d'impression → Enregistrer en PDF, pattern fdsPdf) ──
  function telechargerDevis(id){
    fetch('/api/offre/'+encodeURIComponent(id)+'/devis').then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Devis indisponible.'); return; }
      var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour le PDF.'); return; }
      w.document.open(); w.document.write(devisHTML(j)); w.document.close();
      pushNotif('ok','fa-file-pdf','Devis '+id+' — fenetre d\\'impression ouverte (Enregistrer en PDF).',4500);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }
  window.telechargerDevis=telechargerDevis;
  function devisHTML(j){
    function e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function eur(n){ return (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }
    var o=j.offre||{}, c=j.client||{};
    var rows=(j.lignes||[]).map(function(l){ return '<tr><td>'+e(l.ref)+'</td><td>'+e(l.designation)+'</td><td class="r">'+e(l.quantite)+'</td><td class="r">'+eur(l.pu)+'</td><td class="r">'+eur(l.total)+'</td></tr>'; }).join('');
    if(!rows) rows='<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:18px;">Aucune ligne chiffree.</td></tr>';
    var transportRow = (Number(o.frais_transport)||0)>0 ? '<tr><td>Frais de transport (Franco)</td><td class="r">'+eur(o.frais_transport)+'</td></tr>' : '';
    var livr = o.mode_livraison==='franco' ? 'Franco de port (transport inclus)' : o.mode_livraison==='depart_usine' ? 'Depart usine (transport a la charge du client)' : '';
    var siret = c.siret ? ('<div>SIRET : '+e(c.siret)+'</div>') : '';
    var tva = c.tva_intra ? ('<div>TVA intra : <b>'+e(c.tva_intra)+'</b></div>') : '';
    var contact = c.contact_principal ? ('<div>Contact : '+e(c.contact_principal)+'</div>') : '';
    var reglement = o.mode_reglement ? e(o.mode_reglement) : 'Selon conditions client';
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Devis '+e(o.num_affaire||o.id||'')+'</title>'+
      '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:36px;color:#1e293b;font-size:13px;}'+
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:14px;margin-bottom:18px;}'+
      '.brand{display:flex;align-items:center;gap:14px;}'+
      '.brand svg{width:112px;height:auto;display:block;flex-shrink:0;}'+
      '.rs{font-size:22px;font-weight:800;color:#000;letter-spacing:.5px;}'+
      '.soc{text-align:right;font-size:11px;color:#475569;line-height:1.5;}'+
      '.title{font-size:20px;font-weight:800;color:#111827;margin:4px 0 16px;}'+
      '.meta{display:flex;justify-content:space-between;gap:16px;margin-bottom:18px;}'+
      '.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:12px;line-height:1.6;flex:1;}'+
      '.box h3{margin:0 0 6px;font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:.5px;}'+
      'table.it{width:100%;border-collapse:collapse;margin-bottom:16px;}table.it th{background:#eef1f8;color:'+BRAND_BLEU+';font-size:10px;text-transform:uppercase;padding:8px 10px;text-align:left;}'+
      'table.it td{padding:8px 10px;border-bottom:1px solid #f1f5f9;}td.r,th.r{text-align:right;}'+
      'table.tot{margin-left:auto;border-collapse:collapse;min-width:290px;}table.tot td{padding:5px 12px;}table.tot td.r{text-align:right;font-weight:700;}'+
      'tr.ttc td{font-size:15px;color:'+BRAND_VIOLET+';border-top:2px solid '+BRAND_VIOLET+';}'+
      '.ft{margin-top:26px;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px;line-height:1.5;}'+
      '@page{size:A4 portrait;margin:12mm;}'+
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}'+
      '@media print{body{padding:0;}.hd{break-inside:avoid;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}</style></head><body>'+
      '<div class="hd"><div class="brand">'+DEVIS_LOGO+'<div class="rs">'+e(DEVIS_SOC.nom)+'</div></div>'+
      '<div class="soc"><b>'+e(DEVIS_SOC.nom)+'</b>'+(DEVIS_SOC.activite?('<br/>'+e(DEVIS_SOC.activite)):'')+(DEVIS_SOC.lignes.length?('<br/>'+DEVIS_SOC.lignes.map(e).join('<br/>')):'')+'<br/>Edite le '+new Date().toLocaleDateString('fr-FR')+'</div></div>'+
      '<div class="title">DEVIS N&deg; '+e(o.num_affaire||o.id||'')+'</div>'+
      '<div class="meta"><div class="box"><h3>Client</h3><div><b>'+e(c.nom||'')+'</b></div>'+(c.adresse?('<div>'+e(c.adresse)+'</div>'):'')+siret+tva+contact+'</div>'+
      '<div class="box"><h3>Devis</h3><div>Date : '+e(String(o.date_offre||'').slice(0,10))+'</div><div>Validite : '+(e(String(o.validite||'').slice(0,10))||'30 jours')+'</div>'+(o.vendeur?('<div>Emis par : '+e(o.vendeur)+'</div>'):'')+'</div></div>'+
      '<table class="it"><thead><tr><th>Ref.</th><th>Designation</th><th class="r">Qte</th><th class="r">PU HT</th><th class="r">Total HT</th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '<table class="tot"><tr><td>Sous-total HT</td><td class="r">'+eur(j.sousTotal)+'</td></tr>'+transportRow+
      '<tr><td>Total HT</td><td class="r">'+eur(j.totalHT)+'</td></tr><tr><td>TVA 20%</td><td class="r">'+eur(j.tva)+'</td></tr>'+
      '<tr class="ttc"><td>TOTAL TTC</td><td class="r">'+eur(j.ttc)+'</td></tr></table>'+
      '<div style="clear:both;margin-top:18px;font-size:12px;line-height:1.8;"><div><b>Mode de reglement :</b> '+reglement+'</div>'+(livr?('<div><b>Livraison :</b> '+livr+'</div>'):'')+'</div>'+
      '<div class="ft">Devis etabli sous reserve de nos conditions generales de vente. Prix en euros hors taxes. Validite 30 jours sauf indication ci-dessus. Toute commande implique acceptation de nos CGV.</div>'+
      '<script>window.onload=function(){window.print();}<\\/script></body></html>';
  }

  // Bascule entre les deux sous-onglets DT "Enregistrées non finies" / "Validées"
  function switchDtSubtab(which){
    ['pending','valid'].forEach(function(s){
      var panel = document.getElementById('dt-subtab-'+s);
      var btn   = document.getElementById('dt-subtab-btn-'+s);
      var on = (s === which);
      if (panel) panel.style.display = on ? 'block' : 'none';
      if (btn) {
        btn.style.background = on ? '#3b82f6' : 'transparent';
        btn.style.color      = on ? 'white' : '#64748b';
        btn.style.boxShadow  = on ? '0 2px 8px rgba(59,130,246,.3)' : 'none';
        var pill = btn.querySelector('span');
        if (pill) {
          pill.style.background = on ? 'rgba(255,255,255,.25)' : (s === 'pending' ? '#fef3c7' : '#dcfce7');
          pill.style.color      = on ? 'white' : (s === 'pending' ? '#92400e' : '#15803d');
        }
      }
    });
  }

  // Bascule entre les deux sous-onglets "À traiter" / "Validées"
  function switchOffSubtab(which){
    ['totreat','validated'].forEach(function(s){
      var panel = document.getElementById('off-subtab-'+s);
      var btn   = document.getElementById('off-subtab-btn-'+s);
      var on = (s === which);
      if (panel) panel.style.display = on ? 'block' : 'none';
      if (btn) {
        btn.style.background = on ? '#6366f1' : 'transparent';
        btn.style.color      = on ? 'white' : '#64748b';
        btn.style.boxShadow  = on ? '0 2px 8px rgba(99,102,241,.3)' : 'none';
        var pill = btn.querySelector('span');
        if (pill) {
          pill.style.background = on ? 'rgba(255,255,255,.25)' : (s === 'totreat' ? '#fef3c7' : '#dcfce7');
          pill.style.color      = on ? 'white' : (s === 'totreat' ? '#92400e' : '#15803d');
        }
      }
    });
  }

  // ─── AUTOCOMPLETE CLIENT (svc DT) ────────────────────────────
  var SVC_CLIENTS_JS=${sjX(CLI_DATA)};
  var svcDtFilteredClients=SVC_CLIENTS_JS.slice();
  function filterSvcDTClients(q){
    var lq=q.toLowerCase().trim();
    svcDtFilteredClients=lq?SVC_CLIENTS_JS.filter(function(c){return c.nom.toLowerCase().indexOf(lq)>=0;}):SVC_CLIENTS_JS.slice();
    renderSvcDTDrop();
    var dd=document.getElementById('svcDtClientDrop');
    if(dd) dd.style.display='block';
  }
  function renderSvcDTDrop(){
    var dd=document.getElementById('svcDtClientDrop');
    if(!dd) return;
    if(!svcDtFilteredClients.length){
      dd.innerHTML='<div style="padding:10px 14px;color:#9ca3af;font-size:.8rem;"><i class="fas fa-search mr-2"></i>Aucun client trouvé</div>';
      return;
    }
    dd.innerHTML=svcDtFilteredClients.slice(0,30).map(function(c){
      return '<div onclick="selectSvcDTClient(\\''+c.id+'\\',\\''+c.nom+'\\')" style="padding:8px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;" onmouseenter="this.style.background=\\'#eff6ff\\'" onmouseleave="this.style.background=\\'\\'" ><div style="font-weight:600;color:#374151;font-size:.83rem;">'+c.nom+'</div><div style="font-size:.68rem;color:#6b7280;">'+(c.modeFacturation||'')+'</div></div>';
    }).join('');
  }
  function showSvcDTDropdown(){
    filterSvcDTClients(document.getElementById('svc_dt_client_search').value||'');
  }
  function selectSvcDTClient(id,nom){
    var inp=document.getElementById('svc_dt_client_search');
    var hid=document.getElementById('svc_dt_client_id');
    if(inp) inp.value=nom;
    if(hid) hid.value=id;
    var dd=document.getElementById('svcDtClientDrop');
    if(dd) dd.style.display='none';
  }
  document.addEventListener('click',function(e){
    var ac=document.getElementById('svcDtClientAC');
    if(ac&&!ac.contains(e.target)){var dd=document.getElementById('svcDtClientDrop');if(dd)dd.style.display='none';}
  });
  function toggleSvcNouveauClient(){
    var f=document.getElementById('svcNouveauClientForm');
    if(f) f.style.display=f.style.display==='none'||f.style.display===''?'block':'none';
  }
  function validerSvcNouveauClient(){
    var raison=document.getElementById('svcNcRaison');
    if(!raison||!raison.value.trim()){ pushNotif('err','fa-times','Raison sociale obligatoire.',4000); return; }
    var payload={
      nom:raison.value.trim(),
      siret:(document.getElementById('svcNcSiret')||{value:''}).value||null,
      contact:(document.getElementById('svcNcContact')||{value:''}).value||'',
      poste:(document.getElementById('svcNcPoste')||{value:''}).value||'',
      email:(document.getElementById('svcNcEmail')||{value:''}).value||'',
      tel:(document.getElementById('svcNcTel')||{value:''}).value||'',
      adresse:(document.getElementById('svcNcAdresse')||{value:''}).value||'',
      mode_facturation:(document.getElementById('svcNcModeFacturation')||{value:''}).value||''
    };
    fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.error){ pushNotif('err','fa-times','Erreur: '+data.error,5000); return; }
        var newCl={id:data.id,nom:data.nom,modeFacturation:data.mode_facturation||''};
        SVC_CLIENTS_JS.push(newCl);
        svcDtFilteredClients=SVC_CLIENTS_JS.slice();
        selectSvcDTClient(data.id,data.nom);
        pushNotif('ok','fa-building','Nouveau client "'+data.nom+'" créé et sélectionné.',5000);
        toggleSvcNouveauClient();
      })
      .catch(function(){ pushNotif('err','fa-times','Erreur réseau. Client non créé.',4000); });
  }

  // ── Modale « Nouveau / Édition client » depuis la liste des clients ──
  function _clSet(id,v){ var e=document.getElementById(id); if(e) e.value=(v==null?'':v); }
  function toggleFactBlock(){
    var cb=document.getElementById('clFactDiff'); var bl=document.getElementById('clFactBlock');
    if(bl) bl.style.display=(cb&&cb.checked)?'grid':'none';
  }
  // TVA intra saisie d'abord → SIRET rempli tout seul (retrait du préfixe pays + espaces).
  function clTvaToSiret(){ var tva=((document.getElementById('clTva')||{}).value||''); var digits=tva.replace(/^[^0-9]+/,'').replace(/\\s+/g,''); var s=document.getElementById('clSiret'); if(s) s.value=digits; }
  window.clTvaToSiret=clTvaToSiret;
  function clContactRow(pref){
    pref=pref||{};
    var row=document.createElement('div'); row.className='cl-contact-row'; row.style.cssText='display:grid;grid-template-columns:auto 1.1fr 1fr 1.4fr .9fr auto;gap:6px;align-items:center;margin-bottom:6px;';
    var rd=document.createElement('input'); rd.type='radio'; rd.name='clPrincipal'; rd.title='Contact principal'; rd.style.cssText='width:15px;height:15px;cursor:pointer;accent-color:#059669;'; if(pref.principal) rd.checked=true; row.appendChild(rd);
    var PH={nom:'Nom',poste:'Fonction',email:'Email',tel:'Téléphone'};
    ['nom','poste','email','tel'].forEach(function(f){ var inp=document.createElement('input'); inp.type='text'; inp.className='clc-'+f; inp.placeholder=PH[f]; inp.value=pref[f]||''; inp.style.cssText='min-width:0;width:100%;box-sizing:border-box;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 8px;font-size:.8rem;'; row.appendChild(inp); });
    var rm=document.createElement('button'); rm.type='button'; rm.innerHTML='<i class="fas fa-times"></i>'; rm.title='Retirer ce contact'; rm.style.cssText='background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;padding:6px 9px;cursor:pointer;';
    rm.onclick=function(){ var c=document.getElementById('clContacts'); if(c && c.querySelectorAll('.cl-contact-row').length>1){ var wasP=rd.checked; row.remove(); if(wasP){ var first=c.querySelector('.cl-contact-row input[type=radio]'); if(first) first.checked=true; } } };
    row.appendChild(rm); return row;
  }
  function clAddContact(pref){ var c=document.getElementById('clContacts'); if(!c) return; var row=clContactRow(pref); c.appendChild(row); if(!c.querySelector('input[name=clPrincipal]:checked')){ var r=row.querySelector('input[type=radio]'); if(r) r.checked=true; } }
  window.clAddContact=clAddContact;
  function clResetContacts(list){ var c=document.getElementById('clContacts'); if(!c) return; c.innerHTML=''; var arr=(Array.isArray(list)&&list.length)?list:[{}]; arr.forEach(function(ct,i){ clAddContact({nom:ct.nom||'',poste:ct.poste||'',email:ct.email||'',tel:ct.tel||'',principal:(ct.principal!=null?ct.principal:(i===0))}); }); }
  function clCollectContacts(){ var c=document.getElementById('clContacts'); var out=[]; var principal=''; if(c){ c.querySelectorAll('.cl-contact-row').forEach(function(row){ var g=function(cl){ var e=row.querySelector('.clc-'+cl); return e?e.value.trim():''; }; var nom=g('nom'); var ct={nom:nom,poste:g('poste'),email:g('email'),tel:g('tel')}; if(nom||ct.email||ct.tel){ out.push(ct); var rd=row.querySelector('input[type=radio]'); if(rd&&rd.checked) principal=nom; } }); } if(!principal&&out.length) principal=out[0].nom; return {contacts:out, principal:principal}; }
  function openClientsModal(){
    // Mode création : réinitialise le formulaire
    _clSet('clEditId','');
    ['clNom','clTva','clSiret','clRue','clCp','clVille','clFactRue','clFactCp','clFactVille'].forEach(function(id){ _clSet(id,''); });
    _clSet('clMode','');
    clResetContacts([]);
    var cb=document.getElementById('clFactDiff'); if(cb) cb.checked=false; toggleFactBlock();
    var t=document.getElementById('clModalTitle'); if(t) t.textContent='Créer un nouveau client';
    var l=document.getElementById('clSubmitLbl'); if(l) l.textContent='Créer le client';
    var m=document.getElementById('clientsModal'); if(m) m.style.display='flex';
  }
  var _clLockRes=null;
  function closeClientsModal(){ if(_clLockRes){ ErpLock.release(_clLockRes); _clLockRes=null; } var m=document.getElementById('clientsModal'); if(m) m.style.display='none'; }
  function editClient(id){
    var c=SVC_CLIENTS_JS.find(function(x){return String(x.id)===String(id);});
    if(!c){ pushNotif('err','fa-times','Client introuvable.',4000); return; }
    ErpLock.acquire('client:'+id, { onBlocked:function(by){ pushNotif('err','fa-lock','Client en cours d\\'édition par '+by+'.',6000); }, onOk:function(){ _clLockRes='client:'+id; editClientReal(c); } });
  }
  function editClientReal(c){
    _clSet('clEditId',c.id);
    _clSet('clNom',c.nom); _clSet('clTva',c.tvaIntra||''); _clSet('clSiret',c.siret); _clSet('clMode',c.modeFacturation);
    // Contacts : liste enregistrée, sinon repli sur le contact unique historique. Principal = contactPrincipal.
    var cts=(Array.isArray(c.contacts)&&c.contacts.length)?c.contacts.map(function(x){ return {nom:x.nom||'',poste:x.poste||'',email:x.email||'',tel:x.tel||'',principal:(c.contactPrincipal? (x.nom===c.contactPrincipal): false)}; }):[{nom:c.contact||'',poste:c.poste||'',email:c.email||'',tel:c.tel||'',principal:true}];
    if(!cts.some(function(x){return x.principal;})&&cts[0]) cts[0].principal=true;
    clResetContacts(cts);
    _clSet('clRue',c.adresseRue); _clSet('clCp',c.adresseCp); _clSet('clVille',c.adresseVille);
    _clSet('clFactRue',c.factRue); _clSet('clFactCp',c.factCp); _clSet('clFactVille',c.factVille);
    var cb=document.getElementById('clFactDiff'); if(cb) cb.checked=!!c.facturationDifferente; toggleFactBlock();
    var t=document.getElementById('clModalTitle'); if(t) t.textContent='Modifier le client';
    var l=document.getElementById('clSubmitLbl'); if(l) l.textContent='Enregistrer';
    var m=document.getElementById('clientsModal'); if(m) m.style.display='flex';
  }
  async function deleteClientRow(id,btn){
    var nom=(btn&&btn.getAttribute('data-nom'))||id;
    if(!await appConfirm('Supprimer définitivement le client « '+nom+' » ?')) return;
    fetch('/api/clients/'+encodeURIComponent(id),{method:'DELETE'})
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.error){ pushNotif('err','fa-times','Erreur: '+data.error,5000); return; }
        pushNotif('ok','fa-trash','Client « '+nom+' » supprimé.',3500);
        setTimeout(function(){ location.href='/commercial/service#clients'; softReload(); },700);
      })
      .catch(function(){ pushNotif('err','fa-times','Erreur réseau. Suppression annulée.',4000); });
  }
  function submitNewClient(){
    var nom=(document.getElementById('clNom')||{value:''}).value.trim();
    if(!nom){ pushNotif('err','fa-exclamation-circle','Raison sociale obligatoire.',4000); return; }
    var editId=(document.getElementById('clEditId')||{value:''}).value;
    var factDiff=!!(document.getElementById('clFactDiff')||{checked:false}).checked;
    var v=function(id){ return (document.getElementById(id)||{value:''}).value||''; };
    var cc=clCollectContacts();
    var princ=cc.contacts.filter(function(x){return x.nom===cc.principal;})[0]||cc.contacts[0]||{};
    var payload={
      nom:nom,
      tva_intra:v('clTva')||null,
      siret:v('clSiret')||null,
      mode_facturation:v('clMode'),
      contacts:cc.contacts, contact_principal:cc.principal,
      contact:princ.nom||'', poste:princ.poste||'', email:princ.email||'', tel:princ.tel||'',
      adresse_rue:v('clRue'), adresse_cp:v('clCp'), adresse_ville:v('clVille'),
      facturation_differente:factDiff,
      fact_rue:factDiff?v('clFactRue'):'', fact_cp:factDiff?v('clFactCp'):'', fact_ville:factDiff?v('clFactVille'):''
    };
    var url=editId?('/api/clients/'+encodeURIComponent(editId)):'/api/clients';
    var method=editId?'PATCH':'POST';
    fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.error){ pushNotif('err','fa-times','Erreur: '+data.error,5000); return; }
        closeClientsModal();
        pushNotif('ok','fa-building','Client "'+(data.nom||nom)+'" '+(editId?'modifié':'créé')+'.',4000);
        setTimeout(function(){ location.href='/commercial/service#clients'; softReload(); },800);
      })
      .catch(function(){ pushNotif('err','fa-times','Erreur réseau. Opération annulée.',4000); });
  }

  // ── FORMULAIRE DT : numérotation auto ─────────────────────────
  var SVC_DT_LAST = ${Math.max(...DT_DATA.map(d => parseInt(d.numAffaire || '1281')))};
  var svcDtProdCount = 0;

  function svcDtInitForm(){
    var next = SVC_DT_LAST + 1;
    var el = document.getElementById('svc_dt_num');
    if(el) el.value = 'DT-' + new Date().getFullYear() + '-' + String(next).padStart(4,'0');
    svcDtProdCount = 0;
    var c = document.getElementById('svc-dt-produits');
    if(c) c.innerHTML = '';
    svcDtAjouterProduit();
  }

  function svcDtBlocProduit(n, prefill){
    prefill = prefill || {};
    // Quantités SUPPLÉMENTAIRES à chiffrer = les quantités enregistrées, moins la quantité principale (qui a sa propre case).
    // Une case = une quantité (entier). L'analyse DT donnera exactement autant de lignes de prix que de cases.
    var qPrimary = parseInt(prefill.quantite,10)||0;
    var extras = (Array.isArray(prefill.quantites) ? prefill.quantites : []).map(function(x){ return parseInt(x,10)||0; }).filter(function(v){ return v>0 && v!==qPrimary; });
    var extrasHtml = extras.map(function(v){ return svcDtQtyCase(v); }).join('');
    var normatives = ['ISO 9001','EN 9100','REACH','RoHS','EN 13485'];
    var prefExigences = Array.isArray(prefill.exigences) ? prefill.exigences : [];
    var cases = normatives.map(function(nm){
      var checked = prefExigences.indexOf(nm) >= 0 ? ' checked' : '';
      return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;color:#374151;background:white;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px 10px;cursor:pointer;">'
        + '<input type="checkbox" data-exig="'+nm+'"'+checked+' style="accent-color:#3b82f6;width:13px;height:13px;"/>' + nm + '</label>';
    }).join('');
    var oxyAnodChecked = prefill.oxydation_anodique ? ' checked' : '';
    var oxyNoirChecked = prefill.oxydation_noire ? ' checked' : '';
    var oxyDetailDisplay = prefill.oxydation_anodique ? 'block' : 'none';
    return '<div class="svc-dt-bloc" id="svc-dt-prod-'+n+'" style="background:#f8fafc;border-radius:12px;border:1.5px solid #dbeafe;padding:16px;margin-bottom:12px;">'
      + '<div class="svc-dt-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      +   '<span style="font-size:.78rem;font-weight:800;color:#1d4ed8;"><i class="fas fa-cube" style="margin-right:6px;"></i>Produit ' + n + '</span>'
      +   (n > 1 ? '<button type="button" data-remove-bloc style="background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;padding:3px 10px;font-size:.72rem;cursor:pointer;"><i class="fas fa-times"></i> Retirer</button>' : '')
      + '</div>'
      // Réf pièce + nom plan + réf client + quantité
      + '<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr .6fr;gap:10px;margin-bottom:10px;">'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Réf. interne pièce <span style="color:#ef4444;">*</span></label>'
      +     '<input type="text" class="form-input" list="dt-refint-dl" data-field="ref_interne" placeholder="N° nomenclature / réf. pièce" value="'+(prefill.ref_interne||'')+'"/></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Nom du plan</label>'
      +     '<input type="text" class="form-input" list="dt-plan-dl" data-field="nom_plan" placeholder="Ex: PLAN-DISSIP-A24-v3" value="'+(prefill.nom_plan||'')+'"/></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Réf. pièce client</label>'
      +     '<input type="text" class="form-input" list="dt-client-dl" data-field="ref_client" placeholder="Ex: LGR-A-20485" value="'+(prefill.ref_client||'')+'"/></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:.25rem;">Quantité <span style="color:#ef4444;">*</span></label>'
      +     '<input type="number" min="1" step="1" class="form-input" data-field="quantite" placeholder="1" value="'+(prefill.quantite||'')+'" style="background:#f0fdf4;border-color:#bbf7d0;font-weight:700;color:#15803d;"/></div>'
      + '</div>'
      // Quantités SUPPLÉMENTAIRES à chiffrer — UNE CASE par quantité, ajoutée manuellement (bouton « + Ajouter une quantité »).
      // L'analyse DT produira exactement autant de lignes de prix que de cases quantité (principale + supplémentaires).
      + '<div style="margin-bottom:10px;">'
      +   '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap;">'
      +     '<label style="font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;">'
      +       '<i class="fas fa-layer-group" style="color:#8b5cf6;margin-right:4px;"></i>Quantités supplémentaires à chiffrer '
      +       '<span style="font-weight:600;text-transform:none;color:#9ca3af;">(une case par quantité — chaque quantité aura son prix)</span>'
      +     '</label>'
      +     '<button type="button" onclick="svcDtAddQty(this)" style="background:#f5f3ff;color:#6d28d9;border:1px dashed #c4b5fd;border-radius:7px;padding:4px 12px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter une quantité</button>'
      +   '</div>'
      +   '<div data-qtes-extra style="display:flex;flex-wrap:wrap;gap:8px;">' + extrasHtml + '</div>'
      + '</div>'
      // Activité + Type de DT — PAR PRODUIT (chaque produit porte son activité et son type)
      + '<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-bottom:10px;">'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Activité <span style="color:#ef4444;">*</span></label>'
      +     '<select class="form-input" data-field="activite"><option value="">— Activité —</option>'
      +       '<option value="Seem"'+(prefill.activite==='Seem'?' selected':'')+'>SEEM</option>'
      +       '<option value="Semrac"'+(prefill.activite==='Semrac'?' selected':'')+'>SEMRAC</option>'
      +     '</select></div>'
      +   '<div><label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">Type de DT <span style="color:#ef4444;">*</span></label>'
      +     '<select class="form-input" data-field="type_dt"><option value="">— Type —</option>'
      +       '<option value="Maj prix"'+(prefill.type_dt==='Maj prix'?' selected':'')+'>Maj prix</option>'
      +       '<option value="Maj produit"'+(prefill.type_dt==='Maj produit'?' selected':'')+'>Maj produit</option>'
      +       '<option value="Nouveau produit"'+(prefill.type_dt==='Nouveau produit'?' selected':'')+'>Nouveau produit</option>'
      +       '<option value="Produit à jour"'+(prefill.type_dt==='Produit à jour'?' selected':'')+'>Produit à jour</option>'
      +     '</select></div>'
      + '</div>'
      // Upload PDF / STEP
      + '<div style="margin-bottom:10px;">'
      +   '<label style="display:block;font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.25rem;">'
      +     '<i class="fas fa-paperclip" style="color:#3b82f6;margin-right:4px;"></i>Plan — PDF ou STEP'
      +   '</label>'
      +   '<input type="file" accept=".pdf,.PDF,.step,.STEP,.stp,.STP" class="form-input" style="padding:5px;cursor:pointer;" '
      +     'onchange="svcDtFileChosen(this,'+n+')"/>'
      +   '<div id="svc-dt-file-'+n+'" style="font-size:.68rem;color:#16a34a;margin-top:3px;display:none;">'
      +     '<i class="fas fa-check-circle" style="margin-right:4px;"></i><span></span>'
      +   '</div>'
      + '</div>'
      // Exigences normatives
      + '<div style="margin-bottom:10px;">'
      +   '<div style="font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px;">'
      +     '<i class="fas fa-shield-alt" style="color:#f59e0b;margin-right:4px;"></i>Exigences normatives applicables'
      +   '</div>'
      +   '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + cases + '</div>'
      + '</div>'
      // Oxydation anodique
      + '<div style="background:#fefce8;border:1.5px solid #fde68a;border-radius:8px;padding:10px 14px;">'
      +   '<div style="font-size:.68rem;font-weight:700;color:#92400e;margin-bottom:6px;">'
      +     '<i class="fas fa-flask" style="margin-right:5px;"></i>Traitement de surface'
      +   '</div>'
      +   '<label style="display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:600;color:#374151;cursor:pointer;margin-bottom:6px;">'
      +     '<input type="checkbox" data-field="oxydation_anodique" id="svc-oxy-'+n+'" onchange="svcDtToggleOxy(this,'+n+')"'+oxyAnodChecked+' style="accent-color:#f59e0b;width:15px;height:15px;"/>'
      +     'Oxydation anodique sulfurique'
      +   '</label>'
      +   '<div id="svc-oxy-det-'+n+'" style="display:'+oxyDetailDisplay+';padding-left:24px;">'
      +     '<label style="display:inline-flex;align-items:center;gap:7px;font-size:.77rem;font-weight:600;color:#374151;cursor:pointer;">'
      +       '<input type="checkbox" data-field="oxydation_noire"'+oxyNoirChecked+' style="accent-color:#374151;width:14px;height:14px;"/>'
      +       'Oxydation noire (en complément)'
      +     '</label>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  function svcDtAjouterProduit(prefill){
    svcDtProdCount++;
    var c = document.getElementById('svc-dt-produits');
    if(!c) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = svcDtBlocProduit(svcDtProdCount, prefill);
    var bloc = tmp.querySelector('.svc-dt-bloc') || tmp.firstElementChild || tmp;
    // Retirer button — event delegation via data attribute
    var removeBtn = bloc.querySelector('[data-remove-bloc]');
    if(removeBtn) removeBtn.addEventListener('click', function(){ bloc.remove(); });
    c.appendChild(bloc);
  }

  // Une case « quantité supplémentaire » (entier + bouton retirer). v = valeur pré-remplie (nombre) ou ''.
  function svcDtQtyCase(v){
    return '<div data-qte-case style="display:inline-flex;align-items:center;gap:4px;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:8px;padding:3px 6px;">'
      + '<input type="number" min="1" step="1" data-field="qte-extra" placeholder="Qté" value="'+((v!=null&&v!=='')?v:'')+'" style="width:78px;border:1px solid #e9d5ff;border-radius:5px;padding:3px 6px;font-size:.78rem;font-weight:700;color:#6d28d9;background:white;box-sizing:border-box;"/>'
      + '<button type="button" onclick="svcDtRemoveQty(this)" title="Retirer cette quantité" style="border:none;background:#fee2e2;color:#dc2626;border-radius:5px;width:20px;height:20px;cursor:pointer;font-weight:700;line-height:1;">&times;</button>'
      + '</div>';
  }
  // Ajoute une case quantité au produit du bouton cliqué (this)
  function svcDtAddQty(btn){
    var bloc = btn.closest('.svc-dt-bloc'); if(!bloc) return;
    var cont = bloc.querySelector('[data-qtes-extra]'); if(!cont) return;
    var tmp = document.createElement('div'); tmp.innerHTML = svcDtQtyCase('');
    var node = tmp.firstElementChild; if(!node) return;
    cont.appendChild(node);
    var inp = node.querySelector('input'); if(inp) inp.focus();
  }
  // Retire la case quantité du bouton cliqué
  function svcDtRemoveQty(btn){ var c = btn.closest('[data-qte-case]'); if(c) c.remove(); }

  // Oxy toggle — called from inline onchange (pas de quotes problématiques car arg numérique)
  function svcDtToggleOxy(cb, n){
    var d = document.getElementById('svc-oxy-det-'+n);
    if(d) d.style.display = cb.checked ? 'block' : 'none';
  }
  // File chosen — idem
  function svcDtFileChosen(input, n){
    var info = document.getElementById('svc-dt-file-'+n);
    if(info && input.files.length > 0){
      info.style.display = 'block';
      info.querySelector('span').textContent = input.files[0].name + ' (' + Math.round(input.files[0].size/1024) + ' Ko)';
    }
  }

  // Récupère les pièces saisies depuis le DOM du formulaire DT (id du conteneur)
  function svcDtCollectPieces(containerId){
    var c = document.getElementById(containerId);
    if(!c) return [];
    var blocs = c.querySelectorAll('.svc-dt-bloc');
    var out = [];
    blocs.forEach(function(bl){
      var get = function(name){
        var el = bl.querySelector('[data-field="'+name+'"]');
        if(!el) return '';
        if(el.type === 'checkbox') return el.checked;
        return el.value;
      };
      var ref = (get('ref_interne')||'').trim();
      var qte = parseInt(get('quantite'))||0;
      // On ignore les blocs entièrement vides (pas de réf ET pas de quantité)
      if(!ref && !qte && !get('ref_client') && !get('nom_plan')) return;
      var exig = [];
      bl.querySelectorAll('[data-exig]').forEach(function(cb){ if(cb.checked) exig.push(cb.getAttribute('data-exig')); });
      // Quantités à chiffrer : la quantité principale (≥1) + UNE valeur par case « quantité supplémentaire » (data-field="qte-extra").
      // Entiers positifs ; dédoublonnage (Set) + tri croissant. Le nombre de cases pilote le nombre de lignes de prix de l'analyse DT.
      var qBase = Math.max(1, qte || 1);
      var qSet = new Set(); qSet.add(qBase);
      bl.querySelectorAll("[data-field='qte-extra']").forEach(function(e){ var v = Math.max(0, Math.floor(parseInt(e.value,10))||0); if(v>0) qSet.add(v); });
      var quantites = Array.from(qSet).sort(function(a,b){ return a-b; });
      out.push({
        ref_interne: ref,
        nom_plan:    (get('nom_plan')||'').trim(),
        ref_client:  (get('ref_client')||'').trim(),
        quantite:    qBase,
        quantites:   quantites,
        activite:    (get('activite')||'').trim(),
        type_dt:     (get('type_dt')||'').trim(),
        oxydation_anodique: !!get('oxydation_anodique'),
        oxydation_noire:    !!get('oxydation_noire'),
        exigences:   exig
      });
    });
    return out;
  }

  // Auto-recherche RÉPERTOIRE : réf client ↔ réf interne ↔ plan (bidirectionnel). Ne remplit que les cases VIDES.
  function dtRefLookup(el){
    if(!el || !el.dataset) return;
    var field = el.dataset.field;
    if(field!=='ref_client' && field!=='ref_interne') return;
    var val = (el.value||'').trim(); if(!val) return;
    var bloc = el.closest('.svc-dt-bloc') || el.closest('[data-dt-bloc]'); if(!bloc) return;
    var clientId = (document.getElementById('svc_dt_client_id')||{}).value || '';
    var qs = (field==='ref_client') ? ('ref_client='+encodeURIComponent(val)) : ('code_ref_interne='+encodeURIComponent(val));
    if(clientId) qs += '&client_id='+encodeURIComponent(clientId);
    fetch('/api/references-clients?'+qs).then(function(r){return r.json();}).then(function(j){
      if(!j || !j.ok || !j.refs || !j.refs.length) return;
      var m = j.refs[0];
      var setF = function(name,v){ if(v==null||v==='') return; var t=bloc.querySelector('[data-field="'+name+'"]'); if(t && !((''+t.value).trim())){ t.value=v; } };
      if(field==='ref_client'){ setF('ref_interne', m.code_ref_interne); setF('nom_plan', m.num_plan); }
      else { setF('ref_client', m.ref_client); setF('nom_plan', m.num_plan); }
      if(typeof pushNotif==='function') pushNotif('info','fa-link','Réf. reliée automatiquement depuis le répertoire client.',3000);
    }).catch(function(){});
  }
  document.addEventListener('change', function(e){ var el=e.target; if(el && el.dataset && (el.dataset.field==='ref_client' || el.dataset.field==='ref_interne')) dtRefLookup(el); });

  function svcDtCollectPayload(forValidation){
    var num     = (document.getElementById('svc_dt_num')||{}).value || '';
    var prio    = (document.getElementById('svc_dt_prio')||{}).value || 'normal';
    var dateNeed= (document.getElementById('svc_dt_date')||{}).value || null;
    var clientId= (document.getElementById('svc_dt_client_id')||{}).value || null;
    var clientNom = (document.getElementById('svc_dt_client_search')||{}).value || '';
    var pieces  = svcDtCollectPieces('svc-dt-produits');
    // Activité + Type de DT de la DT = dérivés des produits (chaque produit porte les siens)
    var _acts = Array.from(new Set(pieces.map(function(p){return p.activite;}).filter(Boolean)));
    var act = _acts.length===1 ? _acts[0] : (_acts.length>1 ? 'both' : '');
    var _rank = {'Nouveau produit':4,'Maj produit':3,'Maj prix':2,'Produit à jour':1};
    var type = pieces.map(function(p){return p.type_dt;}).filter(Boolean).sort(function(a,b){return (_rank[b]||0)-(_rank[a]||0);})[0] || '';
    return {
      id:             num || undefined,
      num_affaire:    num.replace(/^DT-\\d{4}-/,'') || undefined,
      client_id:      clientId,
      client_nom:     clientNom,
      activite:       act,
      type_dt:        type,
      priorite:       prio,
      delai:          dateNeed,
      statut:         forValidation ? 'en_attente_be' : 'Nouveau',
      pieces:         pieces.map(function(p){ return p.ref_interne || p.ref_client || ''; }).filter(Boolean),
      pieces_detail:  pieces
    };
  }

  // Création DT (brouillon — reste dans la liste DT rentrées)
  async function svcDtCreer(){
    var payload = svcDtCollectPayload(false);
    if(!payload.client_nom){ pushNotif('err','fa-exclamation-triangle','Client obligatoire.',4000); return; }
    if(!payload.pieces_detail.length){ pushNotif('err','fa-exclamation-triangle','Au moins une pièce avec quantité est requise.',4500); return; }
    var _miss = payload.pieces_detail.filter(function(p){ return !p.activite || !p.type_dt; });
    if(_miss.length){ pushNotif('err','fa-exclamation-triangle','Chaque produit doit avoir une Activité (SEEM/SEMRAC) et un Type de DT.',4500); return; }
    try {
      var res = await fetch('/api/dt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      var data = await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      pushNotif('ok','fa-check-circle','DT '+data.id+' créée — '+payload.activite+' / '+payload.type_dt+'.',6000);
      setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#dt'); }, 800);
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  // Valide la DT depuis la liste — l'API route ensuite selon le type :
  //   Nouveau/Maj produit avec au moins une pièce non "existante à jour" → file Nomenclatures BE
  //   Maj prix ou toutes pièces existantes à jour                        → file Analyse DT BE
  async function svcDtValider(id){
    if(!await appConfirm('Valider la DT '+id+' ?\\nElle restera dans la liste des DT rentrées et sera envoyée au BE\\n(Nomenclatures à faire OU Analyse DT à faire selon le type).')) return;
    try {
      var res = await fetch('/api/dt/'+encodeURIComponent(id)+'/valider',{method:'POST'});
      var data = await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      var msg = data.requires_nomenclature
        ? 'DT '+id+' validée → '+(data.pieces_to_nomenclature||[]).length+' nomenclature(s) à créer côté BE avant analyse.'
        : 'DT '+id+' validée → directement envoyée à l\\'analyse DT du BE.';
      pushNotif('ok','fa-check-circle', msg, 6000);
      setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#dt'); }, 1000);
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  // Ouvre la fiche d'édition (modal) d'une DT existante
  async function svcDtOpenEdit(id){
    try {
      var res = await fetch('/api/dt/'+encodeURIComponent(id));
      var data = await res.json();
      if(!data.ok || !data.dt){ pushNotif('err','fa-times','DT introuvable.',4000); return; }
      var lockOk = await ErpLock.acquire('dt:'+id, { onBlocked:function(by){ pushNotif('err','fa-lock','DT en cours d\\'édition par '+by+' — réessayez quand il aura terminé.',6000); } });
      if(lockOk===false) return;
      svcDtFillEditModal(data.dt);
      var m = document.getElementById('svcDtEditModal');
      if(m){ m.style.display='flex'; }
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  function svcDtFillEditModal(dt){
    document.getElementById('svcDtEditId').value         = dt.id;
    document.getElementById('svcDtEditNum').value        = dt.id;
    document.getElementById('svcDtEditClient').value     = dt.client_nom || '';
    document.getElementById('svcDtEditClientId').value   = dt.client_id || '';
    // Activité + Type de DT sont désormais par produit (pré-remplis dans chaque bloc via pieces_detail)
    document.getElementById('svcDtEditPrio').value       = dt.priorite || 'normal';
    document.getElementById('svcDtEditDelai').value      = (dt.delai || '').slice(0,10);
    document.getElementById('svcDtEditStatut').textContent = dt.statut || '—';
    // Reset le compteur pièces & re-render
    svcDtEditProdCount = 0;
    var c = document.getElementById('svc-dt-edit-produits');
    if(c) c.innerHTML = '';
    var pieces = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : [];
    if(pieces.length === 0) svcDtEditAjouterProduit();
    else pieces.forEach(function(p){ svcDtEditAjouterProduit(p); });
  }

  function svcDtEditAjouterProduit(prefill){
    svcDtEditProdCount++;
    var c = document.getElementById('svc-dt-edit-produits');
    if(!c) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = svcDtBlocProduit('edit-'+svcDtEditProdCount, prefill);
    var bloc = tmp.querySelector('.svc-dt-bloc') || tmp.firstElementChild || tmp;
    var removeBtn = bloc.querySelector('[data-remove-bloc]');
    if(removeBtn) removeBtn.addEventListener('click', function(){ bloc.remove(); });
    // Replace ids: oxy-edit-N etc. — déjà gérés via le numéro composite
    c.appendChild(bloc);
  }

  async function svcDtSaveEdit(){
    var id = document.getElementById('svcDtEditId').value;
    if(!id){ pushNotif('err','fa-times','DT inconnue.',4000); return; }
    var pieces = svcDtCollectPieces('svc-dt-edit-produits');
    if(!pieces.length){ pushNotif('err','fa-exclamation-triangle','Au moins une pièce avec quantité est requise.',4500); return; }
    var _miss = pieces.filter(function(p){ return !p.activite || !p.type_dt; });
    if(_miss.length){ pushNotif('err','fa-exclamation-triangle','Chaque produit doit avoir une Activité et un Type de DT.',4500); return; }
    var _eacts = Array.from(new Set(pieces.map(function(p){return p.activite;}).filter(Boolean)));
    var _erank = {'Nouveau produit':4,'Maj produit':3,'Maj prix':2,'Produit à jour':1};
    var payload = {
      client_id:   document.getElementById('svcDtEditClientId').value || null,
      client_nom:  document.getElementById('svcDtEditClient').value || null,
      activite:    (_eacts.length===1 ? _eacts[0] : (_eacts.length>1 ? 'both' : null)),
      type_dt:     (pieces.map(function(p){return p.type_dt;}).filter(Boolean).sort(function(a,b){return (_erank[b]||0)-(_erank[a]||0);})[0] || null),
      priorite:    document.getElementById('svcDtEditPrio').value || 'normal',
      delai:       document.getElementById('svcDtEditDelai').value || null,
      pieces:      pieces.map(function(p){ return p.ref_interne || p.ref_client || ''; }).filter(Boolean),
      pieces_detail: pieces
    };
    try {
      var res = await fetch('/api/dt/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      var data = await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      pushNotif('ok','fa-check-circle','DT '+id+' modifiée. Les modifications sont propagées à l\\'analyse BE.',6000);
      ErpLock.release('dt:'+id);
      var m = document.getElementById('svcDtEditModal');
      if(m) m.style.display='none';
      setTimeout(function(){ window.location.replace('/commercial/service?'+Date.now()+'#dt'); }, 800);
    } catch(e){
      pushNotif('err','fa-times','Erreur réseau: '+e.message,5000);
    }
  }

  function svcDtCloseEdit(){
    var idv=(document.getElementById('svcDtEditId')||{}).value; if(idv) ErpLock.release('dt:'+idv);   // relâche le verrou
    var m = document.getElementById('svcDtEditModal');
    if(m) m.style.display='none';
  }

  var svcDtEditProdCount = 0;

  // Activation de l'onglet via le hash URL ou par défaut premier onglet
  (function(){
    var hash=(window.location.hash||'').replace('#','');
    if(SVC_TABS.indexOf(hash)>=0) switchSvcTab(hash);
    else switchSvcTab('site');
    // Init formulaire DT (le div est dans le DOM même caché)
    svcDtInitForm();
  })();
  </script>`

  return layout('Service Commercial', content, 'service-commercial')
}

// ─── FICHE CLIENT (identité + interlocuteurs multiples) ───────────
export function pageClientFiche(client: any, detail?: any): string {
  const c = client || {}
  const esc = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const ACC = '#059669'
  const info = (label: string, val: any, link = '') => `<div style="padding:10px 0;border-bottom:1px solid #f4f4f5;display:flex;justify-content:space-between;gap:12px;">
    <span style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">${label}</span>
    <span style="font-size:.84rem;font-weight:600;color:#1e293b;text-align:right;">${val ? (link ? `<a href="${link}" style="color:${ACC};text-decoration:none;">${esc(val)}</a>` : esc(val)) : '—'}</span></div>`
  const eur0 = (v: any) => (Number(v) || 0).toLocaleString('fr-FR') + ' €'
  const D = detail && detail.kpi ? detail : null
  const kpiCard = (lbl: string, val: string, col: string, sub = '') => `<div style="background:#f8fafc;border-radius:10px;padding:12px 14px;border-top:3px solid ${col};"><div style="font-size:1.05rem;font-weight:800;color:${col};line-height:1.15;">${val}</div><div style="font-size:.63rem;color:#6b7280;font-weight:700;margin-top:2px;">${lbl}</div>${sub ? `<div style="font-size:.59rem;color:#9ca3af;">${sub}</div>` : ''}</div>`
  const cmdTable = D && D.commandes.length ? `<div style="margin-top:14px;"><div style="font-weight:700;font-size:.8rem;color:#374151;margin-bottom:6px;">Commandes</div><div style="overflow-x:auto;max-height:240px;overflow-y:auto;border:1px solid #f1f5f9;border-radius:10px;"><table style="width:100%;border-collapse:collapse;font-size:.75rem;"><thead><tr style="background:#f8fafc;position:sticky;top:0;"><th style="text-align:left;padding:6px 9px;color:#6b7280;">Affaire</th><th style="text-align:right;padding:6px 9px;color:#6b7280;">Montant</th><th style="text-align:right;padding:6px 9px;color:#6b7280;">Marge</th><th style="text-align:center;padding:6px 9px;color:#6b7280;">Statut</th><th style="text-align:center;padding:6px 9px;color:#6b7280;">Livraison</th></tr></thead><tbody>${D.commandes.map((o: any) => `<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-weight:600;">${esc(o.num)}</td><td style="padding:6px 9px;text-align:right;">${eur0(o.montant)}</td><td style="padding:6px 9px;text-align:right;color:${o.marge == null ? '#9ca3af' : (o.marge >= 0 ? '#16a34a' : '#dc2626')};">${o.marge != null ? eur0(o.marge) : '—'}</td><td style="padding:6px 9px;text-align:center;font-size:.66rem;">${esc(o.statut || '')}</td><td style="padding:6px 9px;text-align:center;font-size:.66rem;">${esc(o.dateLiv || '—')}</td></tr>`).join('')}</tbody></table></div></div>` : ''
  const facTable = D && D.factures.length ? `<div style="margin-top:12px;"><div style="font-weight:700;font-size:.8rem;color:#374151;margin-bottom:6px;">Factures</div><div style="overflow-x:auto;max-height:220px;overflow-y:auto;border:1px solid #f1f5f9;border-radius:10px;"><table style="width:100%;border-collapse:collapse;font-size:.75rem;"><thead><tr style="background:#f8fafc;position:sticky;top:0;"><th style="text-align:left;padding:6px 9px;color:#6b7280;">N°</th><th style="text-align:right;padding:6px 9px;color:#6b7280;">HT</th><th style="text-align:right;padding:6px 9px;color:#6b7280;">TTC</th><th style="text-align:center;padding:6px 9px;color:#6b7280;">Échéance</th><th style="text-align:center;padding:6px 9px;color:#6b7280;">Statut</th></tr></thead><tbody>${D.factures.map((f: any) => `<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.7rem;">${esc(f.num)}</td><td style="padding:6px 9px;text-align:right;">${eur0(f.ht)}</td><td style="padding:6px 9px;text-align:right;">${eur0(f.ttc)}</td><td style="padding:6px 9px;text-align:center;font-size:.66rem;${f.retard ? 'color:#dc2626;font-weight:700;' : ''}">${esc(f.ech || '—')}${f.retard ? ' ⚠' : ''}</td><td style="padding:6px 9px;text-align:center;font-size:.66rem;">${esc(f.statut || '')}</td></tr>`).join('')}</tbody></table></div></div>` : ''
  const f360 = D ? `<div class="card" style="padding:20px;margin-top:16px;">
    <div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:${ACC};margin-right:6px;"></i>Pilotage 360</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
      ${kpiCard('CA facturé', eur0(D.kpi.caFacture), '#22c55e', D.kpi.nbFac + ' facture(s)')}
      ${kpiCard('Encours impayé', eur0(D.kpi.impaye), D.kpi.impaye > 0 ? '#dc2626' : '#94a3b8')}
      ${kpiCard('Marge cumulée', eur0(D.kpi.marge), D.kpi.marge >= 0 ? '#16a34a' : '#dc2626', D.kpi.nbCmd + ' commande(s)')}
      ${kpiCard('Offres', D.kpi.offresGagnees + ' / ' + D.kpi.offresPerdues, '#6366f1', 'gagnées / perdues')}
      ${kpiCard('Crédit', eur0(D.kpi.soldeCredit), '#d97706', 'limite ' + eur0(D.kpi.creditMontant))}
    </div>
    ${cmdTable}${facTable}
    ${(!D.commandes.length && !D.factures.length) ? `<div style="font-size:.72rem;color:#94a3b8;margin-top:12px;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Aucune commande ni facture pour ce client à ce jour.</div>` : ''}
  </div>` : ''
  // Produits achetés par le client : réf interne ↔ réf client ↔ désignation ↔ plan ouvrable ↔ affaires.
  // Repli sur l'ancien répertoire (refsClients) si l'agrégateur n'a rien renvoyé.
  const prods: any[] = (detail && Array.isArray((detail as any).produits) && (detail as any).produits.length)
    ? (detail as any).produits
    : ((detail && Array.isArray((detail as any).refsClients)) ? (detail as any).refsClients : []).map((r: any) => ({ ...r, designation: '', affaires: [] }))
  const affLinks = (affs: any) => (Array.isArray(affs) && affs.length)
    ? affs.map((a: string) => `<a href="/commercial/affaire/${encodeURIComponent(a)}" title="Ouvrir l'affaire ${esc(a)}" style="display:inline-block;font-family:monospace;font-weight:700;font-size:.72rem;background:#ecfeff;border:1px solid #a5f3fc;color:#0e7490;border-radius:8px;padding:2px 8px;margin:1px 3px 1px 0;text-decoration:none;">${esc(a)}</a>`).join('')
    : '<span style="color:#94a3b8;font-style:italic;font-size:.72rem;">aucune</span>'
  const nbMulti = prods.filter((p: any) => Array.isArray(p.affaires) && p.affaires.length > 1).length
  const prodTable = prods.length ? `<div class="card" style="padding:20px;margin-top:16px;">
    <div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:4px;"><i class="fas fa-cubes" style="color:${ACC};margin-right:6px;"></i>Produits achetés par ce client (${prods.length})</div>
    <div style="font-size:.7rem;color:#94a3b8;margin-bottom:12px;">Réf. interne ↔ réf. client ↔ plan (cliquable) et affaires rattachées${nbMulti ? ` · <strong style="color:#0e7490;">${nbMulti} produit(s) commandé(s) sur plusieurs affaires</strong>` : ''}</div>
    <div style="overflow-x:auto;border:1px solid #f1f5f9;border-radius:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
        <thead><tr style="background:#f8fafc;">
          <th style="text-align:left;padding:7px 10px;color:#6b7280;white-space:nowrap;">Réf. interne (nous)</th>
          <th style="text-align:left;padding:7px 10px;color:#6b7280;white-space:nowrap;">Réf. client</th>
          <th style="text-align:left;padding:7px 10px;color:#6b7280;">Désignation</th>
          <th style="text-align:left;padding:7px 10px;color:#6b7280;white-space:nowrap;">Plan client</th>
          <th style="text-align:left;padding:7px 10px;color:#6b7280;">Affaires</th>
        </tr></thead>
        <tbody>${prods.map((r: any) => `<tr style="border-bottom:1px solid #f9fafb;">
          <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#1e293b;white-space:nowrap;">${esc(r.code_ref_interne || '—')}</td>
          <td style="padding:7px 10px;font-family:monospace;color:#374151;white-space:nowrap;">${esc(r.ref_client || '—')}</td>
          <td style="padding:7px 10px;color:#374151;">${r.designation ? esc(r.designation) : '<span style="color:#94a3b8;font-style:italic;">—</span>'}</td>
          <td style="padding:7px 10px;white-space:nowrap;">${r.plan_doc_id ? `<a href="/api/ged/file/${esc(r.plan_doc_id)}" target="_blank" title="Ouvrir le plan client" style="color:${ACC};text-decoration:none;font-weight:700;"><i class="fas fa-file-arrow-down" style="margin-right:4px;"></i>${esc(r.num_plan || 'Ouvrir')}</a>` : (r.num_plan ? esc(r.num_plan) : '<span style="color:#94a3b8;font-style:italic;">—</span>')}</td>
          <td style="padding:7px 10px;">${affLinks(r.affaires)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>` : ''
  const content = `
  <div style="background:#f8fafc;min-height:100vh;font-family:Inter,system-ui,sans-serif;">
    <div style="background:linear-gradient(135deg,${ACC},#047857);padding:18px 24px;color:white;display:flex;align-items:center;gap:14px;">
      <a href="/commercial/service" style="color:white;background:rgba(255,255,255,.18);width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="fas fa-arrow-left"></i></a>
      <div style="width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;">${esc((c.nom || 'C').charAt(0).toUpperCase())}</div>
      <div><div style="font-size:1.25rem;font-weight:900;">${esc(c.nom || 'Client')}</div><div style="opacity:.85;font-size:.78rem;margin-top:2px;">Fiche client · ${esc(c.id || '')}</div></div>
    </div>
    <div style="padding:24px;max-width:1000px;margin:0 auto;">
      <div class="card" style="padding:20px;">
        <div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:8px;"><i class="fas fa-id-card" style="color:${ACC};margin-right:6px;"></i>Identité &amp; facturation</div>
        ${info('Contact principal', [(c.contact_principal || c.contact), c.poste].filter(Boolean).join(' · '))}
        ${info('Email', c.email, c.email ? 'mailto:' + esc(c.email) : '')}
        ${info('Téléphone', c.tel || c.telephone)}
        ${info('Adresse', c.adresse)}
        ${info('SIRET', c.siret)}
        ${info('N° TVA intra', c.tva_intra)}
        ${info('Mode de règlement', c.mode_facturation)}
        ${info('Mode de livraison', (detail && (detail as any).modeLivraison) === 'franco' ? 'Franco de port (transport inclus)' : (detail && (detail as any).modeLivraison) === 'depart_usine' ? 'Départ usine (transport à la charge du client)' : '')}
        ${(Array.isArray(c.contacts) && c.contacts.length) ? `<div style="margin-top:12px;border-top:1px solid #f1f5f9;padding-top:10px;"><div style="font-size:.62rem;font-weight:800;color:#6b7280;text-transform:uppercase;margin-bottom:6px;">Contacts enregistrés</div>${c.contacts.map((ct:any)=>`<div style="font-size:.78rem;color:#374151;padding:3px 0;">${(String(c.contact_principal||'')===String(ct.nom||'')&&ct.nom)?'<i class="fas fa-star" title="Principal" style="color:#f59e0b;margin-right:6px;"></i>':'<span style="display:inline-block;width:18px;"></span>'}<b>${esc(ct.nom||'—')}</b>${ct.poste?' · '+esc(ct.poste):''}${ct.email?' · '+esc(ct.email):''}${ct.tel?' · '+esc(ct.tel):''}</div>`).join('')}</div>` : ''}
        <div style="font-size:.7rem;color:#94a3b8;margin-top:10px;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Identité, TVA, contacts et contact principal se modifient depuis la liste clients (bouton Modifier).</div>
      </div>
      ${f360}
      ${prodTable}
      ${interlocuteursPanel('client', c.id || '', ACC)}
    </div>
  </div>`
  return layout('Fiche client', content, 'service-commercial')
}

// ─── FICHE AFFAIRE 360 : tout le circuit d'un num_affaire ─────────
// (DT → offre → commande → production/lots/BDT → livraison → facture → NC → matières → avoirs)
export function pageAffaireFiche(num: string, detail?: any): string {
  const ACC = '#0891b2'
  const esc = escX
  const D: any = detail || {}
  const kpi: any = D.kpi || {}
  const dts: any[] = D.dts || [], offres: any[] = D.offres || [], cmds: any[] = D.cmds || []
  const cmdDetails: any[] = D.cmdDetails || [], credits: any[] = D.credits || [], bls: any[] = D.bls || []
  const client = String(D.client || '')
  const flat = (k: string) => cmdDetails.reduce((acc: any[], d: any) => acc.concat(d[k] || []), [] as any[])
  const allLots = flat('lots'), allBdts = flat('bdts'), allFactures = flat('factures'), allNcs = flat('ncs'), allMatieres = flat('matieres'), allPvs = flat('pvs')
  const eur0 = (v: any) => (Number(v) || 0).toLocaleString('fr-FR') + ' €'
  const eur2 = (v: any) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  const kpiCard = (lbl: string, val: string, col: string, sub = '') => `<div style="background:#f8fafc;border-radius:10px;padding:12px 14px;border-top:3px solid ${col};"><div style="font-size:1.05rem;font-weight:800;color:${col};line-height:1.15;">${val}</div><div style="font-size:.63rem;color:#6b7280;font-weight:700;margin-top:2px;">${lbl}</div>${sub ? `<div style="font-size:.59rem;color:#9ca3af;">${sub}</div>` : ''}</div>`
  const miniTable = (title: string, icon: string, col: string, heads: Array<{ t: string, a?: string }>, rows: string[], emptyMsg: string, extra = '') => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-bottom:14px;">
      <div style="font-weight:800;color:#1e293b;font-size:.9rem;margin-bottom:10px;display:flex;align-items:center;gap:7px;"><i class="fas ${icon}" style="color:${col};"></i>${title}${extra ? `<span style="margin-left:auto;font-size:.7rem;font-weight:700;color:#94a3b8;">${extra}</span>` : ''}</div>
      ${rows.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.76rem;"><thead><tr style="background:#f8fafc;">${heads.map(h => `<th style="text-align:${h.a || 'left'};padding:6px 10px;color:#6b7280;font-size:.65rem;text-transform:uppercase;font-weight:700;">${h.t}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<div style="font-size:.74rem;color:#94a3b8;font-style:italic;"><i class="fas fa-minus-circle" style="margin-right:4px;"></i>${emptyMsg}</div>`}
    </div>`
  const td = (v: any, a = 'left', extra = '') => `<td style="padding:6px 10px;text-align:${a};${extra}">${v}</td>`
  const link = (href: string, label: string) => `<a href="${href}" style="color:${ACC};text-decoration:none;font-weight:700;">${label} <i class="fas fa-arrow-right" style="font-size:.6rem;"></i></a>`

  // Étapes du circuit (stepper)
  const bdtSoldes = Number(kpi.bdtSoldes) || 0, bdtTotal = Number(kpi.bdtTotal) || 0
  const steps = [
    { label: 'DT', icon: 'fa-file-alt', on: dts.length > 0, sub: dts.length ? dts.length + ' DT' : '—' },
    { label: 'Offre', icon: 'fa-file-invoice-dollar', on: offres.length > 0, sub: offres.length ? eur0(kpi.montantOffre) : '—' },
    { label: 'Commande', icon: 'fa-check-double', on: cmds.length > 0, sub: cmds.length ? eur0(kpi.montantCmd) : '—' },
    { label: 'Production', icon: 'fa-industry', on: allBdts.length > 0 || allLots.length > 0, sub: bdtTotal ? bdtSoldes + '/' + bdtTotal + ' BDT' : '—' },
    { label: 'Livraison', icon: 'fa-truck', on: bls.length > 0, sub: bls.length ? bls.length + ' BL' : '—' },
    { label: 'Facturation', icon: 'fa-file-invoice', on: allFactures.length > 0, sub: allFactures.length ? eur0(kpi.caFacture) : '—' },
  ]
  const stepper = `<div style="display:flex;gap:6px;align-items:stretch;overflow-x:auto;padding:4px 0;">${steps.map((s, i) => `
    <div style="flex:1;min-width:120px;background:${s.on ? '#ecfeff' : '#f8fafc'};border:1.5px solid ${s.on ? '#a5f3fc' : '#f1f5f9'};border-radius:12px;padding:12px;text-align:center;position:relative;">
      <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;background:${s.on ? `linear-gradient(135deg,#06b6d4,#0891b2)` : '#e2e8f0'};color:${s.on ? 'white' : '#94a3b8'};"><i class="fas ${s.icon}"></i></div>
      <div style="font-size:.72rem;font-weight:800;color:${s.on ? '#0e7490' : '#94a3b8'};">${s.label}</div>
      <div style="font-size:.62rem;color:#94a3b8;margin-top:2px;">${s.sub}</div>
      ${i < steps.length - 1 ? `<div style="position:absolute;right:-4px;top:50%;transform:translateY(-50%);color:${steps[i + 1].on ? '#06b6d4' : '#e2e8f0'};font-size:.7rem;z-index:1;"><i class="fas fa-chevron-right"></i></div>` : ''}
    </div>`).join('')}</div>`

  // Lignes
  const dtRows = dts.map((d: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-weight:700;color:#3b82f6;">${esc(d.id)}</span>`)}${td((Array.isArray(d.pieces_detail) ? d.pieces_detail.length : (Array.isArray(d.pieces) ? d.pieces.length : 0)) + ' pièce(s)')}${td(esc(String(d.date_dt || '').slice(0, 10)), 'center')}${td(statusBadge(d.statut || ''), 'center')}${td(link('/be/analyse?dt=' + encodeURIComponent(d.id), 'Analyse'), 'center')}</tr>`)
  const offRows = offres.map((o: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-weight:700;color:#6366f1;">${esc(o.id)}</span>`)}${td(eur2(o.montant), 'right')}${td(o.marge != null ? (Number(o.marge).toFixed(1) + ' %') : '—', 'right')}${td(statusBadge(o.statut || ''), 'center')}${td(link('/commercial/offre/edit?id=' + encodeURIComponent(o.id), 'Éditer'), 'center')}</tr>`)
  const cmdRows = cmds.map((c: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-weight:700;color:#0ea5e9;">${esc(c.id)}</span>`)}${td(eur2(c.montant), 'right')}${td(esc(String(c.date_liv || '').slice(0, 10)), 'center')}${td(statusBadge(c.statut || ''), 'center')}${td(link('/production/commande/' + encodeURIComponent(c.id), 'Suivi'), 'center')}</tr>`)
  // Fabricabilité : depuis le 09/09/2026 la porte de production se joue AU LOT.
  // `pret` / `blocages` sont posés par getAffaireDetail ; absents = indicateur non calculé.
  const lotPret = (l: any) => {
    if (l.pret === undefined) return '<span style="color:#cbd5e1;font-size:.72rem;">—</span>'
    if (l.pret) return '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;"><i class="fas fa-check" style="margin-right:4px;"></i>Prêt à fabriquer</span>'
    const quoi = Array.isArray(l.blocages) && l.blocages.length ? l.blocages.join(' + ') : 'en attente'
    return '<span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;" title="' + esc(quoi) + '"><i class="fas fa-hourglass-half" style="margin-right:4px;"></i>' + esc(quoi) + '</span>'
  }
  const nbLotsPrets = allLots.filter((l: any) => l.pret === true).length
  const nbLotsBloques = allLots.filter((l: any) => l.pret === false).length
  const lotRows = allLots.map((l: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;font-weight:700;">${esc(l.id)}</span>`)}${td(esc(l.piece || '—'))}${td(l.qte || 0, 'center')}${td(lotPret(l), 'center')}${td(statusBadge(l.statut || ''), 'center')}${td(l.nc ? `<span style="color:#dc2626;font-weight:700;">${l.nc} NC</span>` : '—', 'center')}</tr>`)
  const bdtRows = allBdts.map((b: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;font-weight:700;color:#0d9488;">${esc(b.id)}</span>`)}${td(esc(b.piece || '—'))}${td(esc(b.operation || '—'))}${td(b.operateur ? esc(b.operateur) : '<span style="color:#cbd5e1;font-style:italic;">non pointé</span>')}${td(b.machine === 'machine' ? '<i class="fas fa-gear" title="Machine"></i> Machine' : '<i class="fas fa-user" title="Main d oeuvre"></i> MO', 'center')}${td((b.temps_reel != null ? b.temps_reel : (b.duree || 0)) + ' h', 'right')}${td(statusBadge(b.statut || ''), 'center')}</tr>`)
  const pvRows = allPvs.map((p: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;font-weight:700;color:#0891b2;">${esc(p.num)}</span>`)}${td(esc(p.type || '—'))}${td(esc(p.decision || '—'), 'center')}${td(p.cpk != null ? esc(String(p.cpk)) : '—', 'center')}${td(statusBadge(p.statut || ''), 'center')}${td(esc(String(p.date || '').slice(0, 10)), 'center')}</tr>`)
  const facRows = allFactures.map((f: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;">${esc(f.num)}</span>`)}${td(eur2(f.montant_ht), 'right')}${td(esc(String(f.date || '').slice(0, 10)), 'center')}${td(statusBadge(f.statut || ''), 'center')}</tr>`)
  const blRows = bls.map((b: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;font-weight:700;">${esc(b.id)}</span>`)}${td(esc(String(b.date_bl || b.date || b.created_at || '').slice(0, 10)), 'center')}${td(statusBadge(b.statut || ''), 'center')}</tr>`)
  const ncRows = allNcs.map((n: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-weight:700;color:#dc2626;">${esc(n.id)}</span>`)}${td(esc(n.type || '—'))}${td(esc(n.gravite || '—'), 'center')}${td(statusBadge(n.statut || ''), 'center')}${td(esc(n.lot || '—'), 'center')}</tr>`)
  const matRows = allMatieres.map((m: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(esc(m.article || '—'))}${td(m.quantite || 0, 'center')}${td(eur2(m.total), 'right')}${td(m.bdt_id ? `<span style="font-family:monospace;font-size:.7rem;color:#0d9488;">${esc(m.bdt_id)}</span>` : '<span style="color:#cbd5e1;">—</span>', 'center')}${td(esc(String(m.date || '').slice(0, 10)), 'center')}</tr>`)
  const avRows = credits.map((a: any) => `<tr style="border-bottom:1px solid #f9fafb;">${td(`<span style="font-family:monospace;font-weight:700;color:#8b5cf6;">${esc(a.id)}</span>`)}${td(esc(a.motif || '—'))}${td(eur2(a.montant), 'right')}${td(eur2(a.solde), 'right')}${td(statusBadge(a.statut || ''), 'center')}</tr>`)

  const content = `
  ${pageHeader('fas fa-folder-tree', ACC + ',#155e75', 'Affaire N° ' + esc(num), (client ? esc(client) + ' · ' : '') + 'Circuit complet de l\'affaire', [])}
  <div style="padding:20px 24px;max-width:1100px;margin:0 auto;">
    <a href="/commercial/service#affaires" style="display:inline-flex;align-items:center;gap:6px;color:${ACC};text-decoration:none;font-weight:700;font-size:.8rem;margin-bottom:14px;"><i class="fas fa-arrow-left"></i> Retour aux affaires</a>
      ${!D.found ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;color:#9a3412;font-size:.85rem;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i>Aucune donnée trouvée pour l'affaire N° ${esc(num)} (ni DT, ni offre, ni commande).</div>` : ''}

      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-bottom:14px;">
        <div style="font-weight:800;color:#1e293b;font-size:.9rem;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:${ACC};margin-right:7px;"></i>Pilotage 360</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
          ${kpiCard('Montant offre', eur0(kpi.montantOffre), '#6366f1', offres.length + ' offre(s)')}
          ${kpiCard('Montant commande', eur0(kpi.montantCmd), '#0ea5e9', cmds.length + ' commande(s)')}
          ${kpiCard('CA facturé', eur0(kpi.caFacture), '#22c55e', (kpi.nbFactures || 0) + ' facture(s)')}
          ${kpiCard('Coût de revient', eur0(kpi.coutReel), '#d97706')}
          ${kpiCard('Marge', kpi.marge != null ? eur0(kpi.marge) : '—', (kpi.marge != null && kpi.marge >= 0) ? '#16a34a' : '#dc2626', kpi.margePct != null ? kpi.margePct + ' %' : 'à facturer')}
          ${kpiCard('Avancement', (kpi.avancement || 0) + ' %', '#0891b2', (kpi.bdtSoldes || 0) + '/' + (kpi.bdtTotal || 0) + ' BDT')}
        </div>
        ${stepper}
      </div>

      ${miniTable('Demandes de travaux', 'fa-file-alt', '#3b82f6', [{ t: 'N° DT' }, { t: 'Pièces' }, { t: 'Date', a: 'center' }, { t: 'Statut', a: 'center' }, { t: '', a: 'center' }], dtRows, 'Aucune DT sur cette affaire.')}
      ${miniTable('Offres', 'fa-file-invoice-dollar', '#6366f1', [{ t: 'N° Offre' }, { t: 'Montant HT', a: 'right' }, { t: 'Marge', a: 'right' }, { t: 'Statut', a: 'center' }, { t: '', a: 'center' }], offRows, 'Aucune offre sur cette affaire.')}
      ${miniTable('Commandes', 'fa-check-double', '#0ea5e9', [{ t: 'N° Commande' }, { t: 'Montant HT', a: 'right' }, { t: 'Livraison', a: 'center' }, { t: 'Statut', a: 'center' }, { t: '', a: 'center' }], cmdRows, 'Aucune commande sur cette affaire.')}
      ${miniTable('Production — lots', 'fa-layer-group', '#14b8a6', [{ t: 'Lot' }, { t: 'Pièce' }, { t: 'Qté', a: 'center' }, { t: 'Fabricable', a: 'center' }, { t: 'Statut', a: 'center' }, { t: 'NC', a: 'center' }], lotRows, 'Aucun lot en production.',
        (nbLotsPrets + nbLotsBloques) ? (nbLotsPrets + ' lot(s) prêt(s) · ' + nbLotsBloques + ' en attente') : (bdtTotal ? (bdtSoldes + '/' + bdtTotal + ' BDT soldés') : ''))}
      ${miniTable('Bons de travail (BDT) et opérateurs', 'fa-list-check', '#0d9488', [{ t: 'N° BDT' }, { t: 'Pièce' }, { t: 'Opération' }, { t: 'Opérateur' }, { t: 'Type', a: 'center' }, { t: 'Temps', a: 'right' }, { t: 'Statut', a: 'center' }], bdtRows, 'Aucun bon de travail.')}
      ${miniTable('Matières consommées (par BDT)', 'fa-boxes-stacked', '#b45309', [{ t: 'Article' }, { t: 'Qté', a: 'center' }, { t: 'Coût', a: 'right' }, { t: 'BDT consommateur', a: 'center' }, { t: 'Date', a: 'center' }], matRows, 'Aucune sortie matière.')}
      ${miniTable('Livraisons (BL)', 'fa-truck', '#0284c7', [{ t: 'N° BL' }, { t: 'Date', a: 'center' }, { t: 'Statut', a: 'center' }], blRows, 'Aucune livraison.')}
      ${miniTable('Factures', 'fa-file-invoice', '#22c55e', [{ t: 'N°' }, { t: 'Montant HT', a: 'right' }, { t: 'Date', a: 'center' }, { t: 'Statut', a: 'center' }], facRows, 'Aucune facture.')}
      ${miniTable('PV de contrôle', 'fa-clipboard-check', '#0891b2', [{ t: 'N° PV' }, { t: 'Type' }, { t: 'Décision', a: 'center' }, { t: 'Cpk', a: 'center' }, { t: 'Statut', a: 'center' }, { t: 'Date', a: 'center' }], pvRows, 'Aucun PV de contrôle.')}
      ${miniTable('Non-conformités', 'fa-triangle-exclamation', '#dc2626', [{ t: 'N° NC' }, { t: 'Type' }, { t: 'Gravité', a: 'center' }, { t: 'Statut', a: 'center' }, { t: 'Lot', a: 'center' }], ncRows, 'Aucune non-conformité.')}
      ${miniTable('Avoirs liés', 'fa-hand-holding-dollar', '#8b5cf6', [{ t: 'N° Avoir' }, { t: 'Motif' }, { t: 'Montant', a: 'right' }, { t: 'Solde', a: 'right' }, { t: 'Statut', a: 'center' }], avRows, 'Aucun avoir lié à cette affaire.')}
    </div>`
  return layout('Affaire ' + num, content, 'service-commercial')
}
