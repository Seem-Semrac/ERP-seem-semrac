// ══════════════════════════════════════════════════════════════
// ERP SEEM SEMRAC – index.tsx v2.0
// SPEC-ERP-GPAO-V1.8 / EN9100:2018 / ISO 9001:2015
// ══════════════════════════════════════════════════════════════
import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import {
  dashCommercial, dashBE, dashAchats, dashProgrammation,
  dashProduction, dashQualite, dashExpedition, dashMaintenance,
  dashRH, dashDirection, dashOAS,
  dashFinance, dashStock, dashFournisseurs, dashEnvironnement, dashHub
} from './dashboards'
import { parseFilter } from './dash_filter'
import { pageAffectation, pageCompetences, pageHoraires } from './affectation'
import { pageStock, pageStockAlertes } from './stock'
import { pageFinancesCouts, pageFinancesTaux, pageFinancesMachines, pageFinancesImputations } from './finances'
import {
  pageDTListe, pageOffresListe, pageCmdListe, pageDAListe,
  pageNCListe, pageBLListe, pageBDTListe, pageLOTListe,
  pageFournisseursST,
  pageReferencesPiecesACreer
} from './listes'
import { layout, pageHeader, afterBox, SIDEBAR_V2, APP_VERSION, computeNomCostForQty, computePosteRates, etapeDecomp, seemMark, STATUT_ANNULE, estAnnule } from './shared'
import { brandBlockHTML, BRAND, BRAND_PRINT_CSS, SOCIETE } from './brand'
import { buildXlsx } from './xlsx'
import { computeRisqueChimique, computeExpositionSante, computeExpositionIncendie, computeExpositionEnv, normQuantiteChimique, SEIRICH_NIVEAUX, EXPO_PROCEDE_LBL, EXPO_FREQ_LBL, EXPO_PROT_LBL, EXPO_VOLAT_LBL, codeDechetDangereux, computeBilanGES, ISO14001_DIAGNOSTIC, ISO26000_QUESTIONS, computeEcmePV, ecmeTypeLabel as _ecmeTypeLabel, ecmeStatutLive as _ecmeStatutLive } from './qref'
import {
  getClients, getClient, getDemandesTravaux, getDemandeTravaux, getOffres, getCommandes, getCredits,
  getBonsDeTravail, getLots, getDemandesAchat, getNonConformites,
  getBonsDeLivraison, getFournisseursSt, getMachines, getOperateurs,
  getDemandesSite, createDemandeSite, createClient, updateClient, deleteClient, searchClients, getClientDetail,
  getBalancelles, getRelevesEau, getRelevesBains, getBonsDeTravailOAS, createBalancelle, updateBalancelle,
  createReleveEau, createReleveBain,
  getPVControles, getQuarantaines, getAudits, getProduitsPerissables,
  getAuditProgramme, createAuditProgramme, updateAuditProgramme, deleteAuditProgramme,
  getAuditGrilles, createAuditGrille, updateAuditGrille, deleteAuditGrille,
  getAuditQuestions, createAuditQuestion, updateAuditQuestion, deleteAuditQuestion,
  getAuditAutoStatus, getFai, createFai, updateFai, deleteFai, cloneAuditProgrammeAnnee,
  createProduitPerissable, updateProduitPerissable, deleteProduitPerissable, getMouvementsPerissables, createMouvementPerissable,
  getEtudesCapabilite, createEtudeCapabilite, deleteEtudeCapabilite,
  getEcme, createEcme, updateEcme, deleteEcme,
  getEcmeVerifications, createEcmeVerification, updateEcmeVerification, deleteEcmeVerification,
  getNonConformites as getNCs,
  getBLClients, getBSTs, getBonsDeCommande,
  getArticlesStock, getMouvementsStock,
  getOrdresMaintenance, createOrdreMaintenance, updateOrdreMaintenance, getPlansPreventif, updatePlanPreventif, getMtbfMachines,
  getPiecesRechange, createPieceRechange, updatePieceRechange, deletePieceRechange,
  getEmployes, getCertifications, getCompetences, upsertCompetence, getPointages, createPointage, updatePointage,
  getFacturesClient, getFacturesFournisseur, getEcrituresComptables,
  createFactureFournisseur, updateFactureFournisseur, getFactureFournisseur,
  getNomenclatures, createNomenclature, updateNomenclature, deleteNomenclature, upsertFournitures, getFournitures,
  getReferencesClients, upsertReferenceClient, deleteReferenceClient, getClientProduits, getClientsProduitsAll,
  getEditLock, upsertEditLock, deleteEditLock, getActiveEditLocks,
  createDemandeTravaux, updateDemandeTravaux,
  createOffre, updateOffre, deleteOffre, createCommande, updateCommande, recomputeCmdAvancement, recomputeCmdCout, getCommandeDetail, getLotDetail, getAffaireDetail,
  getBeRefs, getDashboardData,
  getPlanningOperateurs, getPlanningBDTs, getPlanningBDS, getSousTraitants, getShifts, getAbsences, getSalariesActifs,
  updateBDT, createBDTRow, updateBDS, createBDSRow,
  createNonConformiteRow, updateNonConformite, ncHasRetourCols, ncEstClose, ncEstBloquante, ncRattacheeAffaire, ncHasExtCols, ncHasResponsable,
  createCredit, updateCredit, deleteCredit, getCreditsEnCoursForClient, getCommandesPrioritaires, createCommandePrioritaire, updateCommandePrioritaire, createLot,
  getDerogations, createDerogation, updateDerogation,
  getPlansControle, createPlanControle, updatePlanControle, deletePlanControle,
  getRapports8D, getRapport8DById, createRapport8D, updateRapport8D,
  getProcessAtelier, createProcessAtelier, updateProcessAtelier, deleteProcessAtelier,
  getPostes, createPoste, updatePoste, deletePoste,
  getAffectationsPoste, upsertAffectationPoste, deleteAffectationPoste,
  getInterlocuteurs, createInterlocuteur, updateInterlocuteur, deleteInterlocuteur, clearInterlocuteurPrincipal,
  verifyOperateurPin, logMachineHistorique, logOperateurHistorique,
  getMachineHistorique, getOperateurHistorique,
  createDemandeAchat, updateDemandeAchat, getDemandeAchat,
  createBonDeCommande, updateBonDeCommande, getBonDeCommande, bcHasAckColumn,
  createBonDeLivraison, updateBonDeLivraison,
  createPVControle, createQuarantaine, updateQuarantaine, getStockReel,
  resolveAffaireId,
  getFournisseurs, getSousTraitantsAll, createFournisseur, createSousTraitant, updateFournisseur, updateSousTraitant, deleteFournisseur, deleteSousTraitant, computeOtd, getFournisseurScorecard,
  createMachine, updateMachine, deleteMachine, getPresences, upsertPresence, getLot, updateLot, lotHasLibCols, updateStockArticle, createArticleStock,
  createMouvementStock, createFactureClient, updateFactureClient, genEcritureVente, genEcritureAchat, genEcritureReglement,
  getOperateursSalaries,
  getSalaries, getSalarie, getDroitsSalaries, createSalarie, updateSalarie, deleteSalarie, getMachinesOpex, upsertMachineOpexAchat, claimBcOpexGreffe,
  getControlesCotes, createControleCote, deleteControleCote,
  getRefPrixHistorique, getRefPrixHistoriqueAll, createRefPrixHistorique,
  getProduitsFournisseursAll, getProduitsFournisseur, upsertProduitFournisseur, updateProduitFournisseur, deleteProduitFournisseur, getProduitsSansPrix,
  uploadGedFile, signedGedUrl, removeGedFile, createDocument, getDocument, getDocumentsForNom, softDeleteDocument,
  getPlansBatiment, createPlanBatiment, updatePlanBatiment, getMarqueurs, createMarqueur, updateMarqueur, deleteMarqueur,
  getDemandesPrix, getDemandePrix, getDemandePrixLignes, getDemandePrixReponses, getDemandesPrixReponsesAll, createDemandePrix, createDemandePrixLigne, createDemandePrixReponse, updateDemandePrix, updateDemandePrixReponse, deleteDemandePrix,
  getConges, createConge, updateConge, createAbsence,
  createCertification, updateCertification, deleteCertification, verifySalariePin,
  getHabilitations,
  getHseRisques, createHseRisque, updateHseRisque, deleteHseRisque, cloneDuerAnnee,
  getActionsCorrectives, createActionCorrective, updateActionCorrective, deleteActionCorrective,
  getHseFlash, createHseFlash, updateHseFlash, deleteHseFlash,
  getHseEpiZone, createHseEpiZone, updateHseEpiZone, deleteHseEpiZone,
  getHseIncidents, createHseIncident, updateHseIncident, deleteHseIncident,
  getHseEpiCatalogue, createHseEpiCat, updateHseEpiCat, deleteHseEpiCat,
  getHseEpiDotations, createHseEpiDotation, updateHseEpiDotation, deleteHseEpiDotation,
  relinkSalarieOrphans, computeOrphanNames,
  getHseChimiques, createHseChimique, updateHseChimique, deleteHseChimique,
  getHseExpositions, createHseExposition, updateHseExposition, deleteHseExposition, getHseChimiqueDetail,
  getHseDechets, createHseDechet, updateHseDechet, deleteHseDechet, ensureHseDechet,
  getHseMesuresEnv, createHseMesureEnv, updateHseMesureEnv, deleteHseMesureEnv,
  getHseAtexZones, createHseAtexZone, updateHseAtexZone, deleteHseAtexZone,
  getHseVerifications, createHseVerification, updateHseVerification, deleteHseVerification,
  getHseFormationsRequises, createHseFormationRequise, updateHseFormationRequise, deleteHseFormationRequise,
  getHseExercices, createHseExercice, updateHseExercice, deleteHseExercice,
  getHsePlansPrevention, createHsePlanPrevention, updateHsePlanPrevention, deleteHsePlanPrevention,
  getHseRseIndicateurs, createHseRseIndicateur, updateHseRseIndicateur, deleteHseRseIndicateur,
  getHseConformite, createHseConformite, updateHseConformite, deleteHseConformite,
  getHseAspectsImpacts, createHseAspectImpact, updateHseAspectImpact, deleteHseAspectImpact,
  getHsePartiesInteressees, createHsePartieInteressee, updateHsePartieInteressee, deleteHsePartieInteressee,
  getHseDiagnosticIso, createHseDiagnosticIso, updateHseDiagnosticIso, deleteHseDiagnosticIso,
  getHseDiagnosticIso26000, createHseDiagnosticIso26000, updateHseDiagnosticIso26000, deleteHseDiagnosticIso26000,
  getValidations, createValidation, decideValidation, getSourceRow,
  getKpiObjectifs, upsertKpiObjectif, deleteKpiObjectif,
  getPreparationsTechniques, createPreparationTechnique, updatePreparationTechnique
} from './queries'
import type { Credit } from './types'
import { pageDTStatuts, pageCommandesValidees as pageCommandesValideesCom, pageOffreCommerciale as pageOffreCom, pageOffreEdit, pageAffaireFiche, pageServiceCommercial, pageClientFiche } from './commercial'
import { pageServiceBE } from './be'
import { pageServiceAchats } from './achats'
import { pageFournisseurFiche } from './fournisseur_fiche'
import { pageGanttBDT, pageGanttBST, pageCommandesProd, pageLotsProd, pageServiceProd, pageCommandeDetail, pageLotDetail } from './prod'
import { pageServiceOAS } from './oas'
import { pageServiceQualite } from './qualite'
import { pageServiceSecurite } from './securite'
import { pageServiceEnvironnement } from './environnement'
import { pageChimiqueFiche } from './chimique_fiche'
import { pageServiceExpeditions } from './expeditions'
import { pageServiceStock } from './stock_service'
import { pageServiceMaintenance } from './maintenance_service'
import { pageServicePlans } from './plans'
import { pageServiceRH, pagePointage, pageRHEmployes, pageRHHabilitations, pageRHCompetences, pageRHTemps, pageRHOrganigramme } from './rh_service'
import { pageServiceCompta } from './compta_service'
import { pageServiceDirection, computeDataHealth } from './direction_service'
import { pageRapport8D } from './rapport8d'
import { pageLogin, pageAccesRefuse } from './login'
import { signSession, verifySession, canAccess, isPublicPath, hashPin, navServices, MENU_SERVICES_PUBLIC } from './auth'
import { MANUELS, manuelsFor, manuelBySlug, pageManuelsHub, pageManuel } from './manuels'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const app = new Hono()
app.use('/static/*', serveStatic({ root: './' } as any))

// ─── DROITS VIVANTS ────────────────────────────────────────────
// Avant le 09/09/2026, `perms` était figé dans le cookie AU MOMENT DU LOGIN : un changement
// de droits fait en RH n'avait d'effet qu'à la prochaine connexion de la personne — jusqu'à
// 12 h plus tard, dans les deux sens (un accès retiré restait utilisable).
//
// Désormais le jeton ne prouve plus que l'IDENTITÉ ; les DROITS sont relus dans `salaries`.
// Pour que ce ne soit pas une requête par requête, le résultat est mémorisé très brièvement
// dans l'isolate. Conséquence : un changement s'applique en quelques secondes, partout.
//
// ⚠ Le cache est OPPORTUNISTE : les isolates Cloudflare sont éphémères et multiples, il peut
// être vide à tout instant — le code doit donc rester correct sans lui, et c'est le cas.
const PERMS_TTL_MS = 8000
// Une SEULE entrée : la table des droits entière. Lire 36 lignes en projection légère coûte
// exactement le même aller-retour qu'une seule ligne — la latence domine. Le coût est donc
// d'une requête par isolate et par TTL, quel que soit le nombre de personnes connectées.
let _droitsCache: { t: number; table: Record<string, { roles: string[]; perms: string[]; actif: boolean }> } | null = null
/** À appeler dès qu'on modifie les droits d'une personne : l'effet est alors immédiat sur cet isolate. */
export function invaliderDroits(_salarieId?: string) { _droitsCache = null }
async function droitsAJour(user: any): Promise<any> {
  const sub = String(user?.sub || '')
  if (!sub || sub === 'BOOTSTRAP') return user            // compte de secours : aucune ligne salariés
  const now = Date.now()
  let table = (_droitsCache && (now - _droitsCache.t) < PERMS_TTL_MS) ? _droitsCache.table : null
  if (!table) {
    const frais = await getDroitsSalaries().catch(() => null)
    // ⚠ RÈGLE DE SÛRETÉ : `null` = la REQUÊTE a échoué (réseau, 5xx, projet Supabase en pause).
    //   Dans ce cas on garde les droits du jeton et on ne conclut RIEN. Confondre cet échec
    //   avec « salarié supprimé » déconnecterait TOUT L'ATELIER sur un simple hoquet réseau.
    if (!frais) return user
    _droitsCache = { t: now, table: frais }
    table = frais
  }
  const d = table[sub]
  // La requête a réussi et la personne n'y figure plus : le salarié a réellement été supprimé.
  if (!d) return { ...user, perms: [], roles: [], _compteFerme: true }
  if (!d.actif) return { ...user, perms: [], roles: [], _compteFerme: true }
  const perms = d.perms.length ? d.perms : autorisationsUnion(d.roles)
  return { ...user, roles: d.roles, perms }
}

// ─── AUTH : middleware de session + contrôle d'accès (RBAC) ────
// Drapeau AUTH_ENFORCE (env) : 'on' = mur actif ; sinon identifie sans bloquer
// (déploiement progressif sans verrouiller personne dehors).
app.use('*', async (c, next) => {
  const path = c.req.path
  if (isPublicPath(path)) return next()
  const env = c.env as any
  const token = getCookie(c, 'erp_session')
  const brut = token ? await verifySession(token, env) : null
  // Le jeton prouve QUI est la personne ; ses DROITS sont relus en base (voir droitsAJour).
  const user = brut ? await droitsAJour(brut) : null
  if (user) (c as any).set('user', user)
  // Sécurité par défaut : authentification ACTIVE sauf opt-out explicite (AUTH_ENFORCE=off).
  const enforce = String(env?.AUTH_ENFORCE ?? 'on').toLowerCase() !== 'off'
  if (!enforce) return next()
  if (!user) {
    if (path.startsWith('/api/')) return c.json({ ok: false, error: 'Non authentifié' }, 401)
    return c.redirect('/login?next=' + encodeURIComponent(path))
  }
  // Compte désactivé ou salarié supprimé depuis la connexion : la session ne vaut plus rien,
  // sans attendre l'expiration du cookie (12 h).
  if ((user as any)._compteFerme) {
    deleteCookie(c, 'erp_session', { path: '/' })
    if (path.startsWith('/api/')) return c.json({ ok: false, error: 'Compte désactivé' }, 401)
    return c.redirect('/login?next=' + encodeURIComponent(path))
  }
  if (!canAccess(user, path, c.req.method)) {
    if (path.startsWith('/api/')) return c.json({ ok: false, error: 'Accès refusé' }, 403)
    return c.html(pageAccesRefuse({ nom: user.nom, role: user.role }), 403)
  }
  return next()
})

// ─── AUTH : login / logout / profil courant ───────────────────
app.get('/login', (c) => {
  // `next` = chemin de retour après login. On n'accepte QU'UN chemin local même-origine (commence par un seul '/',
  // charset sûr sans < > ") → bloque l'XSS réfléchi (breakout </script>) ET l'open-redirect (//evil.com, javascript:).
  const raw = c.req.query('next') || '/'
  const next = (/^\/[A-Za-z0-9_\-./?=&%#]*$/.test(raw) && !raw.startsWith('//')) ? raw : '/'
  return c.html(pageLogin(next))
})
// Anti-bruteforce login (throttle mémoire par IP, échecs seulement, remis à zéro au succès). Défense de fond = Cloudflare WAF.
const _loginFails = new Map<string, number[]>()
const _loginBlocked = (ip: string): boolean => ((_loginFails.get(ip) || []).filter(t => Date.now() - t < 60_000).length >= 8)
const _loginNoteFail = (ip: string) => { const arr = (_loginFails.get(ip) || []).filter(t => Date.now() - t < 60_000); arr.push(Date.now()); _loginFails.set(ip, arr); if (_loginFails.size > 5000) _loginFails.clear() }
app.post('/api/login', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const env = c.env as any
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'local'
  if (_loginBlocked(ip)) return c.json({ ok: false, error: 'Trop de tentatives. Réessayez dans une minute.' }, 429)
  const mat = String(b.matricule || '').trim()
  const pin = String(b.pin || '').trim()
  const isHttps = (() => { try { return new URL(c.req.url).protocol === 'https:' } catch { return false } })()
  const setSession = async (user: any) => {
    const tok = await signSession(user, env)
    setCookie(c, 'erp_session', tok, { httpOnly: true, secure: isHttps, sameSite: 'Lax', path: '/', maxAge: 12 * 3600 })
  }
  // Compte de secours (anti-verrouillage). Valeurs par défaut EMBARQUÉES (ADMIN / 246810) pour
  // un déploiement « glisser-déposer » sans configurer de variables d'env ; les variables
  // BOOTSTRAP_MATRICULE / BOOTSTRAP_PIN, si posées, les remplacent (recommandé en prod).
  const bootMat = String(env?.BOOTSTRAP_MATRICULE || 'ADMIN').trim()
  const bootPin = String(env?.BOOTSTRAP_PIN || '246810').trim()
  if (mat === bootMat && pin === bootPin) {
    const user = { sub: 'BOOTSTRAP', mat, nom: 'Admin (secours)', role: 'direction', perms: ['all'], ent: 'Support' }
    await setSession(user)
    _loginFails.delete(ip)
    return c.json({ ok: true, user: { nom: user.nom, role: user.role } })
  }
  const sal = await verifySalariePin(mat, pin)
  if (!sal) { _loginNoteFail(ip); return c.json({ ok: false, error: 'Matricule ou code PIN incorrect.' }, 401) }
  _loginFails.delete(ip)
  const roles = Array.isArray(sal.roles) && sal.roles.length ? sal.roles : [sal.role || 'operateur']
  const perms = (Array.isArray(sal.autorisations) && sal.autorisations.length) ? sal.autorisations : autorisationsUnion(roles)
  const user = { sub: String(sal.id), mat: String(sal.matricule || sal.id), nom: `${sal.prenom || ''} ${sal.nom || ''}`.trim() || String(sal.matricule || sal.id), role: sal.role || roles[0], roles, perms, ent: sal.entite || '' }
  await setSession(user)
  return c.json({ ok: true, user: { nom: user.nom, role: user.role } })
})
app.get('/logout', (c) => { deleteCookie(c, 'erp_session', { path: '/' }); return c.redirect('/login') })
// ─── Quelle version est REELLEMENT servie ? ───────────────────────────────────
// Repond a une question qu'on ne devrait jamais avoir a deviner : « ma VM tourne-t-elle
// le dernier code ? ». Le commit est injecte dans l'image au build (docker/app.Dockerfile,
// argument GIT_COMMIT pose par erp-docker.sh) ; sur Cloudflare, CF_PAGES_COMMIT_SHA.
// Route NEUTRE : accessible sans authentification, elle ne divulgue rien de sensible.
app.get('/api/version', (c) => {
  const env = c.env as any
  const commit = String(env?.GIT_COMMIT || env?.CF_PAGES_COMMIT_SHA || '').trim()
  return c.json({
    ok: true,
    version: APP_VERSION,
    commit: commit || 'inconnu',
    commit_court: commit ? commit.slice(0, 10) : 'inconnu',
    construit_le: String(env?.BUILD_DATE || '').trim() || null,
  })
})

app.get('/api/me', (c) => {
  const u = (c as any).get('user')
  // Jamais de cache : c'est cette réponse qui pilote l'affichage du menu, elle doit refléter
  // les droits du moment (ils changent désormais sans reconnexion).
  c.header('Cache-Control', 'no-store')
  return c.json({ ok: !!u, user: u || null, nav: navServices(u || null) })
})

// ─── MANUELS D'UTILISATION (lecture filtrée par rôle) ─────────
// Le contenu est embarqué dans le worker (src/manuels.tsx) : il passe donc par le
// middleware d'authentification, contrairement à /static/* (exclu par _routes.json).
// Chaque manuel exige la LECTURE du service correspondant ; la Direction (perm 'all')
// les voit tous. AUTH_ENFORCE=off (dev/captures) ⇒ pas d'utilisateur ⇒ accès complet.
function manuelsAutorises(c: any) {
  const u = (c as any).get('user') || null
  const enforce = String((c.env as any)?.AUTH_ENFORCE ?? 'on').toLowerCase() !== 'off'
  const tout = !enforce || !u || (Array.isArray(u?.perms) && u.perms.includes('all'))
  const services = tout ? MANUELS.map(m => m.service).filter(Boolean) as string[] : navServices(u)
  return { liste: manuelsFor(services), tout, nom: u ? String(u.nom || u.matricule || '') : '' }
}
app.get('/manuels', (c) => {
  const { liste, tout, nom } = manuelsAutorises(c)
  return c.html(pageManuelsHub(liste, tout, nom))
})
app.get('/manuels/:slug', (c) => {
  const m = manuelBySlug(c.req.param('slug'))
  if (!m) return c.redirect('/manuels')
  const { liste } = manuelsAutorises(c)
  // Pas d'accès au service ⇒ on renvoie au sommaire (le manuel n'y figure pas non plus).
  if (!liste.some(x => x.slug === m.slug)) return c.redirect('/manuels')
  return c.html(pageManuel(m, liste))
})

// ─── HELPERS FORMULAIRES ──────────────────────────────────────
const field = (label: string, type: string, placeholder: string, required = true, cols = 1) => `
<div class="${cols===2?'col-span-2':''}">
  <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">${label}${required?'<span style="color:#ef4444;margin-left:2px;">*</span>':''}</label>
  ${type==='textarea'
    ? `<textarea placeholder="${placeholder}" rows="3" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;resize:vertical;" ${required?'required':''}></textarea>`
    : type==='select'
    ? `<select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;" ${required?'required':''}><option value="">${placeholder}</option></select>`
    : `<input type="${type}" placeholder="${placeholder}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;" ${required?'required':''}/>`
  }
</div>`

const fieldRow = (fields: string) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">${fields}</div>`

const submitBtn = (label: string, color = '#3b82f6') => `
<div style="display:flex;justify-content:flex-end;margin-top:20px;">
  <button type="button" onclick="confirmSend('${label} – Workflow Power Automate déclenché. Notifications envoyées automatiquement.')"
    style="background:linear-gradient(135deg,${color},${color}cc);color:white;padding:10px 28px;border-radius:12px;font-weight:700;font-size:.88rem;border:none;cursor:pointer;box-shadow:0 2px 12px ${color}44;display:flex;align-items:center;gap:8px;">
    <i class="fas fa-paper-plane"></i> ${label}
  </button>
</div>`

const formCard = (content: string) => `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);padding:24px;margin-bottom:20px;">${content}</div>`

const sectionTitle = (label: string) => `<div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:8px;">${label}<span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span></div>`

// ══════════════════════════════════════════════════════════════
// PAGE D'ACCUEIL — fullscreen, gros boutons par service
// ══════════════════════════════════════════════════════════════
app.get('/', (c) => {
  // 14 services principaux, grille responsive auto-fill — chacun = grosse card cliquable
  const services = [
    { url:'/commercial/service',   icon:'fa-briefcase',         title:'Commercial',     subtitle:'DT · Offres · Affaires · Avoirs · Clients', owner:'Corinne',          color:'#3b82f6', darkBg:'#1e3a5f' },
    { url:'/be/service',           icon:'fa-drafting-compass',  title:'Bureau d\'Études',subtitle:'Nomenclatures · Analyse DT · Prépa tech', owner:'Joël · David',    color:'#6366f1', darkBg:'#1e1b4b' },
    { url:'/achats/service',       icon:'fa-shopping-cart',     title:'Achats',         subtitle:'DAs · BC fournisseurs · Réception',       owner:'Morgane',         color:'#10b981', darkBg:'#052e16' },
    { url:'/production/service',   icon:'fa-cogs',              title:'Production',     subtitle:'Planning Gantt · BDT/BST · Machines',     owner:'Sylvie',          color:'#f97316', darkBg:'#451a03' },
    { url:'/oas/service',          icon:'fa-flask',             title:'OAS',            subtitle:'Balancelles · Bains · Relevés eau',       owner:'Mickaël',         color:'#06b6d4', darkBg:'#164e63' },
    { url:'/qualite/service',      icon:'fa-shield-alt',        title:'Qualité',        subtitle:'PV · NC · 8D · Libération · Audits',      owner:'Pierre-Yves',     color:'#ef4444', darkBg:'#450a0a' },
    { url:'/securite/service',     icon:'fa-helmet-safety',     title:'Sécurité',       subtitle:'HSE · DUER · Accidents · EPI · Chimie · Risque chimique', owner:'HSE / QSE', color:'#ea580c', darkBg:'#431407' },
    { url:'/environnement/service', icon:'fa-leaf',              title:'Environnement',  subtitle:'ICPE · Déchets · Rejets · ATEX · ISO 14001 · RSE', owner:'QSE', color:'#16a34a', darkBg:'#052e16' },
    { url:'/expeditions/service',  icon:'fa-truck',             title:'Expéditions',    subtitle:'BL · BST · BC · Commandes · OTD',         owner:'Sabine',          color:'#f59e0b', darkBg:'#451a03' },
    { url:'/stock/service',        icon:'fa-warehouse',         title:'Stocks',         subtitle:'Temps réel · Gestion · Alertes réappro',  owner:'Magasin',         color:'#22c55e', darkBg:'#052e16' },
    { url:'/maintenance/service',  icon:'fa-wrench',            title:'Maintenance',    subtitle:'GMAO · OM · Préventif · MTBF',            owner:'GMAO',            color:'#eab308', darkBg:'#422006' },
    { url:'/plans/service',        icon:'fa-building',          title:'Plan / Bâtiment',subtitle:'Maquette BIM · Zones · Postes · Sécurité', owner:'BE / Maintenance', color:'#14b8a6', darkBg:'#134e4a' },
    { url:'/rh/service',           icon:'fa-users',             title:'RH',             subtitle:'Employés · Habilitations · Compétences',  owner:'RH',              color:'#6366f1', darkBg:'#1e1b4b' },
    { url:'/compta/service',       icon:'fa-calculator',        title:'Comptabilité',   subtitle:'Factures · Grand Livre · TVA · Trésor.',  owner:'Compta',          color:'#10b981', darkBg:'#064e3b' },
    { url:'/direction/service',    icon:'fa-chart-line',        title:'Direction',      subtitle:'Jalons · Budget · Validation · KPI',      owner:'Direction',       color:'#f59e0b', darkBg:'#451a03' },
  ]

  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Accueil – ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *{font-family:'Inter',sans-serif;box-sizing:border-box;}
    html, body{margin:0;padding:0;}
    body{
      min-height:100vh;display:flex;
      background:
        radial-gradient(at 12% 8%, rgba(143,208,238,.28) 0px, transparent 50%),
        radial-gradient(at 88% 92%, rgba(41,171,226,.32) 0px, transparent 55%),
        linear-gradient(160deg,#0e6ba8 0%,#0a4e7a 100%);
      color:white;
    }
    .svc-card{
      position:relative;overflow:hidden;
      background:rgba(30,41,59,.55);backdrop-filter:blur(10px);
      border:1px solid rgba(255,255,255,.07);
      border-radius:20px;padding:24px;
      text-decoration:none;color:white;
      display:flex;flex-direction:column;justify-content:space-between;
      min-height:180px;cursor:pointer;
      transition:transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s, background .25s;
    }
    .svc-card::before{
      content:'';position:absolute;inset:0;border-radius:20px;
      background:linear-gradient(135deg, var(--accent) 0%, transparent 60%);
      opacity:.10;transition:opacity .25s;
      pointer-events:none;
    }
    .svc-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 24px 48px rgba(0,0,0,.45), 0 0 0 1px var(--accent);border-color:transparent;background:rgba(30,41,59,.75);}
    .svc-card:hover::before{opacity:.22;}
    .svc-card .svc-icon{
      width:56px;height:56px;border-radius:16px;
      background:linear-gradient(135deg,var(--accent) 0%,var(--accent-d) 100%);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:1.4rem;flex-shrink:0;
      box-shadow:0 8px 20px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.2);
    }
    .svc-arrow{
      position:absolute;top:24px;right:24px;
      color:rgba(255,255,255,.3);font-size:.95rem;transition:transform .25s,color .25s;
    }
    .svc-card:hover .svc-arrow{color:var(--accent);transform:translateX(4px);}
    .svc-meta{display:flex;align-items:center;gap:8px;margin-top:14px;color:rgba(255,255,255,.5);font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}
    .svc-meta-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);}
  </style>
</head>
<body>
${SIDEBAR_V2('home')}
<main style="flex:1;overflow-y:auto;min-width:0;display:flex;flex-direction:column;">

  <!-- En-tête hero -->
  <div style="padding:36px 48px 24px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:24px;">
    <div style="display:flex;align-items:center;gap:18px;">
      <div style="width:64px;height:64px;border-radius:18px;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.28);">${seemMark(44)}</div>
      <div>
        <h1 style="font-size:1.9rem;font-weight:900;color:white;margin:0;letter-spacing:-.02em;">ERP Seem Semrac</h1>
        <p style="color:#cdeaf8;font-size:.92rem;margin:4px 0 0;">SPEC-ERP-GPAO-V1.8 · EN 9100:2018 · ISO 9001:2015 · v2.0</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <span style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7;border-radius:999px;padding:6px 14px;font-size:.74rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span>Production en ligne
      </span>
      <a href="/rh/pointage" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;padding:10px 22px;border-radius:12px;font-weight:700;font-size:.84rem;text-decoration:none;box-shadow:0 8px 20px rgba(14,165,233,.3);display:inline-flex;align-items:center;gap:8px;">
        <i class="fas fa-fingerprint"></i>Système de pointage
      </a>
    </div>
  </div>

  <!-- Sous-titre / consignes -->
  <div style="padding:0 48px 24px;">
    <div style="background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:14px;padding:14px 20px;font-size:.85rem;color:#c7d2fe;display:flex;align-items:center;gap:12px;">
      <i class="fas fa-info-circle" style="color:#a5b4fc;font-size:1rem;"></i>
      <span><strong style="color:white;">Sélectionnez un service ci-dessous</strong> pour accéder à ses fonctionnalités. La navigation latérale reste disponible à tout moment.</span>
    </div>
  </div>

  <!-- Grille services -->
  <div style="flex:1;padding:0 48px 48px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;">
      ${services.map(s => {
        const darkAccent = s.darkBg
        return `
        <a href="${s.url}" data-svc="${s.url.split('/')[1]}" class="svc-card" style="--accent:${s.color};--accent-d:${darkAccent};">
          <i class="fas fa-arrow-right svc-arrow"></i>
          <div>
            <div class="svc-icon"><i class="fas ${s.icon}"></i></div>
            <div style="font-size:1.15rem;font-weight:800;color:white;margin-top:18px;letter-spacing:-.01em;">${s.title}</div>
            <div style="font-size:.78rem;color:#94a3b8;margin-top:5px;line-height:1.5;">${s.subtitle}</div>
          </div>
          <div class="svc-meta">
            <span class="svc-meta-dot"></span>
            <span>${s.owner}</span>
          </div>
        </a>`
      }).join('')}
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:18px 48px;border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;color:#64748b;font-size:.72rem;">
    <span>© ${new Date().getFullYear()} Seem Semrac · ERP v2.0 · SPEC-ERP-GPAO-V1.8</span>
    <span>EN 9100:2018 · ISO 9001:2015</span>
  </div>
</main>
<div style="position:fixed;top:1rem;right:1rem;z-index:9000;max-width:380px;" id="notifBanner"></div>
<script>
function pushNotif(type,icon,msg,dur=5000){
  const b=document.getElementById('notifBanner');if(!b)return;
  const id='n'+Date.now();const d=document.createElement('div');
  d.id=id;d.style.cssText='background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.15);padding:.9rem 1.1rem;border-left:4px solid '+(type==='ok'?'#22c55e':type==='warn'?'#f59e0b':type==='err'?'#ef4444':'#3b82f6')+';margin-bottom:.5rem;font-size:.8rem;animation:slideIn .3s ease;';
  d.innerHTML='<i class="fas '+icon+' mr-2"></i>'+msg+' <button onclick="this.parentElement.remove()" style="float:right;background:none;border:none;cursor:pointer;color:#9ca3af;margin-left:8px;"><i class="fas fa-times"></i></button>';
  b.appendChild(d);
  setTimeout(()=>{if(d&&d.parentElement){d.style.transition='opacity .4s';d.style.opacity='0';setTimeout(()=>d.parentElement&&d.remove(),400);}},dur);
}
function confirmSend(msg){pushNotif('ok','fa-check-circle',msg,6000);}
</script>
<style>@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}</style>
</body>
</html>`)
})

// ══════════════════════════════════════════════════════════════
// COMMERCIAL
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// NOUVELLES ROUTES COMMERCIAL
// ══════════════════════════════════════════════════════════════
app.get('/commercial/service', async (c) => {
  const [dts, clients, offres, cmds, credits, site, commandesP, factures, validations] = await Promise.all([
    getDemandesTravaux(), getClients(), getOffres(), getCommandes(), getCredits(), getDemandesSite(),
    getCommandesPrioritaires().catch(() => [] as any[]),
    getFacturesClient().catch(() => [] as any[]),
    getValidations().catch(() => [] as any[]),
  ])
  return c.html(pageServiceCommercial(dts, clients, offres, cmds, credits, site, commandesP, factures, validations))
})

// ─── Fiche client (identité + interlocuteurs multiples) ───
app.get('/commercial/client/:id', async (c) => {
  const id = c.req.param('id')
  const detail = await getClientDetail(id).catch(() => null as any) || {}
  const cl = detail.client || await getClient(id).catch(() => null)
  // Produits commandés par ce client (réf interne ↔ réf client ↔ plan)
  detail.refsClients = await getReferencesClients({ client_id: id }).catch(() => [] as any[])
  // Produits achetés : réf interne + réf client + désignation + plan ouvrable + affaires rattachées
  detail.produits = await getClientProduits(id).catch(() => [] as any[])
  return c.html(pageClientFiche(cl || { id, nom: 'Client introuvable' }, detail))
})

// Fiche AFFAIRE 360 : tout le circuit d'un num_affaire (DT → offre → commande → prod → BL → facture → NC → avoirs)
app.get('/commercial/affaire/:num', async (c) => {
  const num = decodeURIComponent(c.req.param('num') || '')
  const detail = await getAffaireDetail(num).catch(() => null)
  return c.html(pageAffaireFiche(num, detail))
})

// ── API publique – formulaire "Contactez-nous" du site internet ──
// Anti-abus DOUX du formulaire public (throttle mémoire par instance + honeypot + plafonds).
// La vraie protection anti-flood se fait au niveau Cloudflare (WAF Rate Limiting / Turnstile) — cf. docs/technique/08-securite.md.
const _contactHits = new Map<string, number[]>()
function _contactThrottled(ip: string): boolean {
  const now = Date.now(), win = 60_000, max = 5
  const arr = (_contactHits.get(ip) || []).filter(t => now - t < win)
  arr.push(now); _contactHits.set(ip, arr)
  if (_contactHits.size > 5000) _contactHits.clear()   // borne mémoire (worker éphémère)
  return arr.length > max
}
app.post('/api/contact', async (c) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  try {
    const ip = c.req.header('cf-connecting-ip') || (c.req.header('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    if (_contactThrottled(ip)) return c.json({ error: 'Trop de requêtes — réessayez dans une minute.' }, 429, corsHeaders)
    const body = await c.req.json<any>()
    if (body && (body.website || body._hp)) return c.json({ success: true }, 201, corsHeaders)   // honeypot : bot → faux OK, pas d'insertion
    if (!body.nom || !body.email || !body.message || !body.type_demande) {
      return c.json({ error: 'Champs requis manquants : nom, email, type_demande, message' }, 400, corsHeaders)
    }
    if (String(body.message).length > 8000 || String(body.email).length > 320) {
      return c.json({ error: 'Champ trop long.' }, 400, corsHeaders)
    }
    const cap = (s: any, n: number) => (s == null ? s : String(s).slice(0, n))
    const clean = {
      nom: cap(body.nom, 120), prenom: cap(body.prenom, 120), email: cap(body.email, 160),
      telephone: cap(body.telephone, 40), societe: cap(body.societe, 160),
      type_demande: cap(body.type_demande, 80), message: cap(body.message, 4000), priorite: cap(body.priorite, 40),
    }
    const { data, error } = await createDemandeSite(clean as any)
    if (error) return c.json({ error: error.message }, 500, corsHeaders)
    return c.json({ success: true, id: data?.id }, 201, corsHeaders)
  } catch {
    return c.json({ error: 'Requête invalide' }, 400, corsHeaders)
  }
})

// Preflight CORS pour /api/contact
app.options('/api/contact', (c) => c.text('', 204 as any, {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}))
app.get('/commercial/rentree', (c) => c.redirect('/commercial/service'))
app.get('/commercial/offre', async (c) => {
  const [offres, clients, dts, credits] = await Promise.all([getOffres(), getClients(), getDemandesTravaux(), getCredits().catch(() => [] as any[])])
  return c.html(pageOffreCom(offres, clients, dts, credits))
})
app.get('/commercial/offres-liste', async (c) => {
  const [offres, clients, dts, credits] = await Promise.all([getOffres(), getClients(), getDemandesTravaux(), getCredits().catch(() => [] as any[])])
  return c.html(pageOffreCom(offres, clients, dts, credits))
})
// Édition d'une offre : page dédiée « à l'image de l'analyse DT » (coûts par produit,
// coefficient de marge par produit, certifications/traçabilité, avoirs applicables du client).
app.get('/commercial/offre/edit', async (c) => {
  const id = c.req.query('id') || ''
  const offres = await getOffres()
  const off = (offres as any[]).find(o => String(o.id) === String(id))
  if (!off) return c.redirect('/commercial/service#offre')
  const dt = off.dt_ref ? await getDemandeTravaux(off.dt_ref) : null
  const avoirs = await getCreditsEnCoursForClient(off.client_id, off.client_nom).catch(() => [] as any[])
  const clients = await getClients().catch(() => [] as any[])
  const cli = (clients as any[]).find(x => String(x.id) === String(off.client_id)) || (clients as any[]).find(x => String(x.nom) === String(off.client_nom)) || null
  return c.html(pageOffreEdit(off, dt, avoirs, cli))
})
app.get('/commercial/commandes-validees', async (c) => {
  const [cmds, offres, dts] = await Promise.all([getCommandes(), getOffres(), getDemandesTravaux()])
  return c.html(pageCommandesValideesCom(cmds, offres, dts))
})
app.get('/commercial/dt-liste', async (c) => {
  const [dts, clients] = await Promise.all([getDemandesTravaux(), getClients()])
  return c.html(pageDTStatuts(dts, clients))
})
app.get('/commercial/avoirs', (c) => c.redirect('/commercial/service#avoirs'))

// ─── API CLIENTS ──────────────────────────────────────────────
app.get('/api/clients/search', async (c) => {
  const q = c.req.query('q') ?? ''
  const clients = await searchClients(q)
  return c.json(clients)
})

// Construit le payload client (adresse structurée + champ `adresse` composé pour compat affichage)
function buildClientPayload(b: any): Record<string, any> {
  const p: Record<string, any> = {}
  for (const k of ['nom', 'contact', 'poste', 'email', 'tel', 'mode_facturation', 'siret', 'tva_intra', 'contact_principal',
                    'adresse_rue', 'adresse_cp', 'adresse_ville', 'fact_rue', 'fact_cp', 'fact_ville']) {
    if (k in b) p[k] = b[k] === '' ? null : b[k]
  }
  if ('facturation_differente' in b) p.facturation_differente = !!b.facturation_differente
  if ('contacts' in b) p.contacts = Array.isArray(b.contacts) ? b.contacts : []
  // Compose `adresse` (compat) depuis rue/cp/ville si fournis, sinon garde `adresse` brut éventuel
  const rue = b.adresse_rue ?? '', cp = b.adresse_cp ?? '', ville = b.adresse_ville ?? ''
  if (rue || cp || ville) p.adresse = [rue, [cp, ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  else if ('adresse' in b) p.adresse = b.adresse || null
  return p
}

app.post('/api/clients', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  if (!body.nom || !String(body.nom).trim()) return c.json({ error: 'Raison sociale obligatoire' }, 400)
  const { data, error } = await createClient(buildClientPayload(body))
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

app.patch('/api/clients/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const patch = buildClientPayload(body)
  if (!Object.keys(patch).length) return c.json({ error: 'Aucun champ' }, 400)
  const { data, error } = await updateClient(id, patch)
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

app.delete('/api/clients/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await deleteClient(id)
  if (error) {
    // Violation de clé étrangère : client référencé ailleurs (commandes, offres, affaires, factures…)
    if ((error as any).code === '23503' || /foreign key|violates/i.test(error.message)) {
      return c.json({ error: 'Ce client est référencé par des commandes, offres, affaires ou factures : il ne peut pas être supprimé. Supprimez d\'abord les éléments liés.' }, 409)
    }
    return c.json({ error: error.message }, 400)
  }
  return c.json({ ok: true })
})

// ─── API DT (Demande Travaux) ─────────────────────────────────
// Lecture d'une DT (pour ouvrir le formulaire d'édition)
app.get('/api/dt/:id', async (c) => {
  const id = c.req.param('id')
  const dt = await getDemandeTravaux(id)
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  return c.json({ ok: true, dt })
})

// Synchronise le répertoire references_clients depuis les pièces d'une DT (réf interne + client/réf client).
// Appelé à la création, à l'édition ET à la validation d'une DT → le répertoire est toujours à jour.
async function syncDtReferences(dt: any) {
  const pieces = Array.isArray(dt?.pieces_detail) ? dt.pieces_detail : []
  for (const p of pieces) {
    const codeInt = String(p?.ref_interne || '').trim()
    if (!codeInt || (!p.ref_client && !dt.client_id)) continue
    await upsertReferenceClient({
      code_ref_interne: codeInt, client_id: dt.client_id || null, client_nom: dt.client_nom || null,
      ref_client: p.ref_client || null, num_plan: p.nom_plan || null,
      entite: p.activite || dt.activite || null,
    }).catch(() => {})
  }
}

// Création d'une DT — numérotation auto basée sur l'année
app.post('/api/dt', async (c) => {
  const body = await c.req.json()
  const year = new Date().getFullYear()
  // Génère le N° d'affaire à 4 chiffres et l'ID DT-YYYY-NNNN
  const existing = await getDemandesTravaux()
  const thisYear = existing.filter((d) => (d.id ?? '').startsWith(`DT-${year}-`))
  const nums = thisYear
    .map((d) => parseInt((d.num_affaire ?? '0').replace(/\D/g, '')))
    .filter((n) => !isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  const numAffaire = String(next).padStart(4, '0')
  // Le serveur est AUTORITAIRE sur le numéro : on n'accepte le num/id du client que s'ils sont VALIDES
  // (évite le « DT-2026--Infinity » quand le calcul côté client échoue sur une liste vide).
  const clientNum = parseInt(String(body.num_affaire ?? '').replace(/\D/g, ''), 10)
  const affaire = (Number.isFinite(clientNum) && clientNum > 0) ? String(clientNum).padStart(4, '0') : numAffaire
  const dtId = (typeof body.id === 'string' && /^DT-\d{4}-\d+$/.test(body.id)) ? body.id : `DT-${year}-${affaire}`
  const payload: any = {
    id: dtId,
    num_affaire: affaire,
    client_id: body.client_id ?? null,
    client_nom: body.client_nom ?? null,
    type_dt: body.type_dt ?? null,
    activite: body.activite ?? null,
    priorite: body.priorite ?? 'normal',
    statut: body.statut ?? 'Nouveau',
    date_dt: body.date_dt ?? new Date().toISOString().slice(0, 10),
    delai: body.delai ?? null,
    analyste: body.analyste ?? null,
    pieces: Array.isArray(body.pieces) ? body.pieces : [],
    pieces_detail: Array.isArray(body.pieces_detail) ? body.pieces_detail : [],
    cahier_charges: Array.isArray(body.cahier_charges) ? body.cahier_charges : null,
    budget: body.budget ?? null,
    montant: body.montant ?? 0,
    contact: body.contact ?? null,
  }
  const { data, error } = await createDemandeTravaux(payload)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Création DT impossible' }, 400)
  await syncDtReferences(data).catch(() => {})
  return c.json({ ok: true, id: data.id, num_affaire: data.num_affaire, dt: data })
})

// Mise à jour d'une DT (pièces, infos, statut)
app.put('/api/dt/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  // On extrait uniquement les champs autorisés à la mise à jour
  const allowed: (keyof typeof body)[] = [
    'client_id', 'client_nom', 'type_dt', 'activite', 'priorite', 'statut',
    'date_dt', 'delai', 'analyste', 'pieces', 'pieces_detail',
    'cahier_charges', 'budget', 'montant', 'contact'
  ]
  const payload: any = {}
  for (const k of allowed) if (k in body) payload[k] = body[k]
  // Si on envoie pieces_detail, on synchronise aussi le tableau pieces (refs courtes)
  if (Array.isArray(payload.pieces_detail) && !payload.pieces) {
    payload.pieces = payload.pieces_detail
      .map((p: any) => p.ref_interne || p.ref_client || '')
      .filter((s: string) => s)
  }
  // Re-routage BE : modifier le TYPE ou les PIÈCES d'une DT déjà en file BE recalcule sa liste
  // (Nomenclatures à faire ↔ Analyse BE), même règle que /valider. Corrige « Maj produit → Nouveau produit »
  // qui restait à tort dans Analyse. On force le statut (écrase un statut périmé renvoyé par le formulaire).
  if ('type_dt' in payload || 'pieces_detail' in payload) {
    const cur = await getDemandeTravaux(id)
    if (cur && (cur.statut === 'en_attente_be' || cur.statut === 'en_attente_nomenclature')) {
      const type = ('type_dt' in payload ? payload.type_dt : cur.type_dt) ?? ''
      const pieces = Array.isArray(payload.pieces_detail) ? payload.pieces_detail
        : (Array.isArray(cur.pieces_detail) ? cur.pieces_detail : [])
      const _needNom = (pt: string) => ['Nouveau produit', 'Maj produit'].includes(pt)
      const piecesNeedingNom = (pieces as any[]).filter((p: any) => _needNom(p.type_dt || type) && !p.piece_existante_a_jour)
      payload.statut = piecesNeedingNom.length > 0 ? 'en_attente_nomenclature' : 'en_attente_be'
    }
  }
  const { data, error } = await updateDemandeTravaux(id, payload)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Mise à jour DT impossible' }, 400)
  await syncDtReferences(data).catch(() => {})
  return c.json({ ok: true, id: data.id, dt: data })
})

// ─── RÉPERTOIRE RÉFÉRENCES CLIENTS (réf interne ↔ client ↔ réf client ↔ plan) ───
// GET : recherche (auto-lookup DT, liste nomenclature, produits d'une fiche client)
app.get('/api/references-clients', async (c) => {
  const q = c.req.query()
  const rows = await getReferencesClients({
    code_ref_interne: q.code_ref_interne || undefined,
    client_id: q.client_id || undefined,
    ref_client: q.ref_client || undefined,
  }).catch(() => [] as any[])
  return c.json({ ok: true, refs: rows })
})
app.post('/api/references-clients', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const payload: any = {
    code_ref_interne: String(b.code_ref_interne || '').trim(),
    client_id: b.client_id || null, client_nom: b.client_nom || null,
    ref_client: b.ref_client || null, num_plan: b.num_plan || null,
    plan_doc_id: b.plan_doc_id || null, nomenclature_id: b.nomenclature_id || null,
    entite: b.entite || null,
  }
  if (!payload.code_ref_interne) return c.json({ ok: false, error: 'Réf interne requise.' }, 400)
  const { data, error } = await upsertReferenceClient(payload)
  if (error || !data) return c.json({ ok: false, error: (error && error.message) || 'Échec.' }, 400)
  return c.json({ ok: true, ref: data })
})
app.delete('/api/references-clients/:id', async (c) => {
  const { error } = await deleteReferenceClient(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── API OFFRE — workflow simple "envoyer/valider" ──────────────
app.post('/api/offre/:id/envoyer', async (c) => {
  const id = c.req.param('id')
  // date_envoi = base du statut calculé « à relancer » (>7j) ; mode_reglement = snapshot du mode de facturation client.
  const upd: any = { statut: 'en_attente_reponse', date_envoi: new Date().toISOString() }
  try {
    const offres = await getOffres()
    const off = (offres as any[]).find(o => String(o.id) === String(id))
    if (off) {
      const clients = await getClients()
      const cli = (clients as any[]).find(x => String(x.id) === String(off.client_id)) || (clients as any[]).find(x => String(x.nom) === String(off.client_nom))
      if (cli && (cli as any).mode_facturation) upd.mode_reglement = (cli as any).mode_facturation
    }
  } catch {}
  const { data, error } = await updateOffre(id, upd)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Envoi impossible' }, 400)
  return c.json({ ok: true, id: data.id, statut: data.statut })
})

app.post('/api/offre/:id/valider', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await updateOffre(id, { statut: 'acceptee' })
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Validation impossible' }, 400)
  return c.json({ ok: true, id: data.id, statut: data.statut })
})

// Données assemblées pour le DEVIS PDF (offre + client + lignes pièces avec PU/PT + totaux).
// Lecture seule ; les champs récents (tva_intra, mode_livraison, frais_transport, mode_reglement)
// sont tolérés absents tant que la migration commercial_offres_schema.sql n'est pas appliquée.
app.get('/api/offre/:id/devis', async (c) => {
  const id = c.req.param('id')
  const offres = await getOffres().catch(() => [] as any[])
  const off = (offres as any[]).find(o => String(o.id) === String(id))
  if (!off) return c.json({ ok: false, error: 'Offre introuvable' }, 404)
  const [clients, dt] = await Promise.all([
    getClients().catch(() => [] as any[]),
    off.dt_ref ? getDemandeTravaux(off.dt_ref).catch(() => null) : Promise.resolve(null),
  ])
  const cli = (clients as any[]).find(x => String(x.id) === String(off.client_id))
    || (clients as any[]).find(x => String(x.nom) === String(off.client_nom)) || null
  const pd = (dt && Array.isArray((dt as any).pieces_detail)) ? (dt as any).pieces_detail : []
  const lignes = pd.map((p: any) => {
    const qte = Math.max(1, Number(p.quantite) || 1)
    const pu = Number(p.prix_vente) || 0
    return { ref: p.ref_interne || '', designation: p.nom_plan || p.designation || p.ref_client || p.ref_interne || '', quantite: qte, pu: +pu.toFixed(2), total: +(pu * qte).toFixed(2) }
  }).filter((l: any) => l.ref || l.total > 0)
  const sousTotal = lignes.reduce((s: number, l: any) => s + l.total, 0)
  const transport = Number((off as any).frais_transport) || 0
  const totalHT = +(sousTotal + transport).toFixed(2)
  const tva = +(totalHT * 0.20).toFixed(2)
  const ttc = +(totalHT + tva).toFixed(2)
  return c.json({
    ok: true,
    offre: {
      id: off.id, num_affaire: off.num_affaire, date_offre: off.date_offre, validite: off.validite, statut: off.statut,
      mode_livraison: (off as any).mode_livraison || null, frais_transport: transport,
      mode_reglement: (off as any).mode_reglement || (cli && (cli as any).mode_facturation) || null, vendeur: off.vendeur || null,
    },
    client: cli ? {
      nom: (cli as any).nom, adresse: [(cli as any).adresse_rue || (cli as any).adresse, (cli as any).adresse_cp, (cli as any).adresse_ville].filter(Boolean).join(' '),
      siret: (cli as any).siret || null, tva_intra: (cli as any).tva_intra || null,
      contact_principal: (cli as any).contact_principal || (cli as any).contact || null, mode_facturation: (cli as any).mode_facturation || null,
    } : { nom: off.client_nom || '' },
    lignes, sousTotal: +sousTotal.toFixed(2), transport, totalHT, tva, ttc,
  })
})

app.post('/api/offre/:id/refuser', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await updateOffre(id, { statut: 'annulee' })
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Refus impossible' }, 400)
  return c.json({ ok: true, id: data.id, statut: data.statut })
})

// Négociation = révision SUR PLACE : incrémente le compteur de version, repasse l'offre en
// 'negociation' (rouverte pour édition prix/marge), conserve le motif. Pas de copie/-2.
app.post('/api/offre/:id/negocier', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const offres = await getOffres().catch(() => [] as any[])
  const off = (offres as any[]).find(o => String(o.id) === String(id))
  if (!off) return c.json({ ok: false, error: 'Offre introuvable' }, 404)
  const nextVer = (Number(off.version) || 1) + 1
  const { data, error } = await updateOffre(id, { version: nextVer, statut: 'negociation', motif_negociation: b.motif || null })
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Négociation impossible' }, 400)
  return c.json({ ok: true, id: data.id, version: nextVer, statut: data.statut })
})

// ══ CASCADE À L'ACCEPTATION D'OFFRE ═══════════════════════════════════════════
// Déclenchée par /accepter APRÈS création de la commande. Best-effort : chaque
// étape est isolée (n'empêche jamais la commande d'exister). Idempotent (ids
// déterministes → une ré-acceptation ne duplique pas).
function _nomByCode(noms: any[]): Record<string, any> {
  const m: Record<string, any> = {}
  for (const n of (noms || [])) { if (n.statut !== 'valide') continue; const k = String(n.code_ref_produit || '').toLowerCase().trim(); if (!k) continue; if (!m[k] || String(n.indice || 'A') > String(m[k].indice || 'A')) m[k] = n }
  return m
}
const _sanId = (s: any) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 14)
// ── Numérotation métier LOT / BDT / BDS (déterministe) ──
//   LOT-YYYY-XXXX-ZZ      (XXXX = n° affaire, ZZ = n° du lot dans l'affaire)
//   BDT/BDS-YYYY-XXXX-ZZ-AA  (AA = n° du bon dans le lot ; rang stable = idempotent)
const _pad2 = (n: number) => String(n).padStart(2, '0')
const _yrOf = (s: any) => { const m = String(s || '').match(/-(\d{4})-/); return (m && m[1]) || String(new Date().getFullYear()) }
const fmtLotId = (year: string, aff: string, zz: number) => `LOT-${year}-${aff}-${_pad2(zz)}`
const fmtBonId = (kind: 'BDT' | 'BDS', year: string, aff: string, zz: number, aa: number) => `${kind}-${year}-${aff}-${_pad2(zz)}-${_pad2(aa)}`

// (c) commande → lots → BDT (interne) + BDS (sous-traité), calqué sur generer-bdt.
async function cascadeLotsBdtBst(dt: any, cmdId: string, byCode: Record<string, any>) {
  const [existingBdt, existingBds, procs] = await Promise.all([
    getBonsDeTravail().catch(() => [] as any[]), getPlanningBDS().catch(() => [] as any[]), getProcessAtelier().catch(() => [] as any[]),
  ])
  const oasProcIds = new Set((procs as any[]).filter((p: any) => p.est_oas).map((p: any) => String(p.id)))
  const aff = String(dt.num_affaire || dt.id), client = dt.client_nom || '', prio = dt.priorite || 'normal'
  const bdtKey = new Set((existingBdt as any[]).map((b: any) => `${b.num_affaire}|${b.piece}|${b.seq}`))
  const bdsKey = new Set((existingBds as any[]).map((b: any) => `${b.cmd_ref}|${b.piece}|${b.seq}`))
  const pieces = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
  let lots = 0, nb = 0, ns = 0
  const year = _yrOf(cmdId)
  let pieceNum = 0
  for (const p of pieces) {
    const ref = String(p.ref_interne || '').toLowerCase().trim(), qte = Number(p.quantite) || 1
    const nom = ref ? byCode[ref] : null
    if (!nom) continue
    pieceNum++
    const act = nom.entite || dt.activite || 'Seem'
    const lotRef = fmtLotId(year, aff, pieceNum)
    await createLot({ id: lotRef, cmd_id: cmdId, client_nom: client, piece: p.ref_interne || ref, qte, qte_initiale: qte, statut: 'a_faire' } as any).then((r: any) => { if (r && !r.error) lots++ }).catch(() => {})
    let bdtNum = 0, bdsNum = 0
    const etapes = (Array.isArray(nom.etapes_production) ? nom.etapes_production : []).slice().sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
    const oasFlags = etapes.map((e: any) => !!e.est_oas || (e.process_id && oasProcIds.has(String(e.process_id))))
    for (let i = 0; i < etapes.length; i++) {
      const e = etapes[i], seq = Number(e.ordre) || (i + 1)
      if (oasFlags[i]) continue
      const { reglageMin: reglage, varMin } = etapeTempsMin(e)
      const dureeH = +(((reglage + varMin * qte)) / 60).toFixed(3)
      const op = e.nom || e.process_nom || e.operation_st || 'Process'
      const k = `${aff}|${p.ref_interne || ref}|${seq}`
      const oasAvant = i > 0 && oasFlags[i - 1], oasApres = i < etapes.length - 1 && oasFlags[i + 1]
      if (e.type === 'sous_traite') {
        bdsNum++
        if (bdsKey.has(k)) continue
        await createBDSRow({ id: fmtBonId('BDS', year, aff, pieceNum, bdsNum), cmd_ref: cmdId, lot_ref: lotRef, client_nom: client, piece: p.ref_interne || ref, qte, operation: op, sous_traitant_id: e.fournisseur_st_id || null, duree_days: Math.max(1, Math.ceil(dureeH / 7)), statut: 'a_planifier', seq }).then((r: any) => { if (r && !r.error) ns++ }).catch(() => {})
      } else {
        bdtNum++
        if (bdtKey.has(k)) continue
        await createBDTRow({ id: fmtBonId('BDT', year, aff, pieceNum, bdtNum), num_affaire: aff, cmd_ref: cmdId, lot_ref: lotRef, client_nom: client, piece: p.ref_interne || ref, operation: op, machine_id: e.machine_id || null, process_id: e.process_id || null, seq, duree: dureeH, temps_alloue: dureeH, statut: 'programme', priorite: prio, activite: act, oas_avant: oasAvant, oas_apres: oasApres, matiere_ok: false }).then((r: any) => { if (r && !r.error) nb++ }).catch(() => {})
      }
    }
  }
  return { lots, bdt: nb, bds: ns }
}

// ── GOULOTTE matière + préparation technique ────────────────────────────────
// Un BDT n'apparaît au planning que si la MATIÈRE est réceptionnée (matiere_ok) ET que la
// préparation technique de SON LOT est terminée.
//
// ⚠ Changement du 09/09/2026 (demandé) : le blocage portait sur l'AFFAIRE ENTIÈRE — une seule
// préparation en attente gelait TOUS les lots de l'affaire, y compris ceux dont le plan et le
// programme CN étaient prêts. Il porte désormais sur le LOT, identifié par le couple
// (commande, pièce) : `lots.piece`, `preparations_techniques.piece` et `bons_de_travail.piece`
// sont écrits depuis la MÊME expression source dans la cascade, la correspondance est exacte.
// Repli conservateur : une préparation sans commande ni pièce bloque encore toute son affaire.
export function bdtBlocage(bdt: any, prepRows: any[]): string | null {
  if (bdt && bdt.matiere_ok === false) return 'matière non réceptionnée'
  const parLot = new Set<string>(), parAffaire = new Set<string>()
  for (const p of (prepRows || [])) {
    if (String((p as any).statut) === 'faite') continue
    const cmd = String((p as any).cmd_ref || '').trim(), pc = String((p as any).piece || '').toLowerCase().trim()
    if (cmd && pc) parLot.add(cmd + '|' + pc)
    else parAffaire.add(String((p as any).num_affaire || ''))
  }
  const k = String(bdt?.cmd_ref || '').trim() + '|' + String(bdt?.piece || '').toLowerCase().trim()
  if (parLot.has(k)) return 'préparation technique en attente'
  if (parAffaire.has(String(bdt?.num_affaire || ''))) return 'préparation technique en attente (affaire)'
  return null
}
function filtrerBdtsPrets(bdts: any[], prepRows: any[]): any[] {
  return (bdts || []).filter((b: any) => !bdtBlocage(b, prepRows))
}

// (a) prépa technique : nomenclature sans programme CN (étape machine) OU sans plan.
async function cascadePrepaTechnique(dt: any, cmdId: string, byCode: Record<string, any>) {
  const aff = String(dt.num_affaire || dt.id)
  const pieces = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
  let created = 0
  for (const p of pieces) {
    const ref = String(p.ref_interne || '').toLowerCase().trim()
    const nom = ref ? byCode[ref] : null
    if (!nom) continue
    const etapes = Array.isArray(nom.etapes_production) ? nom.etapes_production : []
    const cncEtapes = etapes.filter((e: any) => e.type !== 'sous_traite' && (e.machine_id || /cnc|tour|frais|usin/i.test(String(e.nom || e.process_nom || ''))))
    const manqueCnc = cncEtapes.length > 0 && cncEtapes.some((e: any) => !String(e.programme || e.programme_fichier || '').trim())
    const hasPlanField = !!String(nom.num_plan || nom.plan_fichier || nom.plan_num || '').trim()
    let hasPlanGed = false
    try { const docs = await getDocumentsForNom(String(nom.id)); hasPlanGed = (docs as any[]).some((d: any) => ['plan_client', 'plan_cao'].includes(String(d.categorie))) } catch {}
    const manquePlan = !hasPlanField && !hasPlanGed
    if (!manqueCnc && !manquePlan) continue
    // Site figé à la création, avec la MÊME formule que les BDT nés de la même cascade
    // (src/index.tsx, cascadeLotsBdtBst) : la prépa et ses BDT affichent donc toujours le même site.
    const actPrep = p.activite || nom.entite || dt.activite || 'Seem'
    const basePrep: any = {
      id: 'PREP-' + _sanId(aff) + '-' + _sanId(p.ref_interne || ref), num_affaire: aff, dt_ref: dt.id, cmd_ref: cmdId,
      code_ref_produit: nom.code_ref_produit || p.ref_interne, piece: p.ref_interne || ref,
      type: p.piece_existante_a_jour ? 'maj' : 'nouvelle', manque_code_cnc: manqueCnc, manque_plan: manquePlan, statut: 'a_faire',
    }
    // La colonne `activite` peut ne pas exister encore (migration non appliquée) : on tente
    // AVEC, et on retombe SANS en cas de rejet. L'affichage sait de toute façon déduire le site.
    let r: any = await createPreparationTechnique({ ...basePrep, activite: actPrep }).catch(() => ({ error: true }))
    if (!r || r.error) r = await createPreparationTechnique(basePrep).catch(() => ({ error: true }))
    if (r && !r.error) created++
  }
  return created
}

// (b) DA du manque matière + accessoires (besoin en unités d'achat × qté vs stock).
async function cascadeDAManques(dt: any, cmdId: string, byCode: Record<string, any>) {
  const stock = await getStockReel().catch(() => [] as any[])
  const stockByRef: Record<string, any> = {}
  for (const s of (stock as any[])) { const k = String(s.reference || s.id || '').toLowerCase().trim(); if (k) stockByRef[k] = s }
  const aff = String(dt.num_affaire || dt.id)
  const pieces = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
  let created = 0
  for (const p of pieces) {
    const ref = String(p.ref_interne || '').toLowerCase().trim()
    const nom = ref ? byCode[ref] : null
    if (!nom) continue
    const qte = Number(p.quantite) || 1
    let fournitures: any[] = []
    try { fournitures = (await getFournitures(String(nom.id))) as any[] } catch {}
    for (const f of fournitures) {
      const cat = String(f.categorie || '')
      if (cat !== 'matiere' && cat !== 'accessoire') continue
      const isMat = cat === 'matiere'
      const qpp = Number(f.quantite_par_piece) || 0, npt = Number(f.nb_par_tole) || 0, qtePaq = Number(f.qte_paquet) || 0
      const besoin = isMat ? (npt > 0 ? Math.ceil(qte / npt) : Math.ceil(qpp * qte)) : (qtePaq > 0 ? Math.ceil((qpp * qte) / qtePaq) : Math.ceil(qpp * qte))
      if (besoin <= 0) continue
      const refStock = String(f.ref_stock || '').toLowerCase().trim()
      const st = refStock ? stockByRef[refStock] : null
      const reste = st ? Number(st.stock_actuel) || 0 : 0
      const manque = Math.max(0, besoin - reste)
      if (manque <= 0) continue   // le stock couvre → pas de DA
      await createDemandeAchat({
        id: 'DA-' + _sanId(aff) + '-' + _sanId(f.ref_stock || f.designation || 'X') + '-' + (isMat ? 'M' : 'A'),
        demandeur: 'Acceptation offre', type_da: isMat ? 'Matière' : 'Accessoire', article: f.designation || f.ref_stock || 'Fourniture',
        qte: String(manque), priorite: 'normal', statut: 'a_traiter', date_da: TODAY_ISO(), type_bc: 'fournisseur',
        visible: true, genere_par_adt: true, num_affaire: aff, cmd_ref: cmdId,
      } as any).then((r: any) => { if (r && !r.error) created++ }).catch(() => {})
    }
  }
  return created
}

// Orchestrateur — ne jette jamais (la commande existe déjà).
// Mode de règlement « Proforma » : le client paie AVANT qu'on engage la moindre dépense.
// On facture donc à l'acceptation, et on diffère prépa technique + demandes d'achat
// jusqu'à l'encaissement (PATCH /api/factures/:id avec statut 'payee').
export const estProforma = (v: any) => String(v || '').trim().toLowerCase() === 'proforma'

// Garde d'idempotence : la cascade différée ne doit pas rejouer si elle a déjà tourné
// (facture repassée « payée » après un aller-retour de statut, par exemple).
async function _cascadeDejaFaite(aff: string): Promise<boolean> {
  const a = String(aff || '')
  if (!a) return true
  const [preps, das] = await Promise.all([
    getPreparationsTechniques().catch(() => [] as any[]),
    getDemandesAchat().catch(() => [] as any[]),
  ])
  return (preps as any[]).some((p: any) => String(p.num_affaire || '') === a)
      || (das as any[]).some((d: any) => String(d.num_affaire || '') === a && d.genere_par_adt === true)
}

// Prépa technique + demandes d'achat. Extrait pour pouvoir être rejoué à l'encaissement.
async function cascadeEngagementDepense(dt: any, cmdId: string, byCode: Record<string, any>) {
  const prepa = await cascadePrepaTechnique(dt, cmdId, byCode).catch(() => 0)
  const da = await cascadeDAManques(dt, cmdId, byCode).catch(() => 0)
  return { prepa, da }
}

async function cascadeAcceptationOffre(off: any, cmdId: string) {
  const out = { dt: null as any, prepa: 0, da: 0, lots: 0, bdt: 0, bds: 0, proforma: false, facture: null as any }
  try {
    const dt = off.dt_ref ? await getDemandeTravaux(String(off.dt_ref)).catch(() => null) : null
    if (!dt) return out
    out.dt = dt.id
    const byCode = _nomByCode(await getNomenclatures().catch(() => [] as any[]))
    const proforma = estProforma(off.mode_reglement)
    out.proforma = proforma

    if (proforma) {
      // On facture tout de suite, et on N'ENGAGE RIEN : ni prépa technique, ni demande d'achat.
      out.facture = await creerFactureProforma(off, cmdId).catch(() => null)
    } else {
      const eng = await cascadeEngagementDepense(dt, cmdId, byCode)
      out.prepa = eng.prepa; out.da = eng.da
    }

    // Les lots et bons sont créés dans les deux cas : ils naissent avec matiere_ok = false,
    // donc ils restent hors du planning tant que la matière n'est pas réceptionnée — ce qui,
    // en proforma, suppose que les demandes d'achat aient été débloquées par le paiement.
    const cc = await cascadeLotsBdtBst(dt, cmdId, byCode).catch(() => ({ lots: 0, bdt: 0, bds: 0 }))
    out.lots = cc.lots; out.bdt = cc.bdt; out.bds = cc.bds
  } catch {}
  return out
}

// Facture proforma émise à l'acceptation, rattachée à la commande et non à un BL
// (il n'y a encore aucune livraison). Elle apparaît dans Comptabilité › Facturation.
async function creerFactureProforma(off: any, cmdId: string) {
  const factures = await getFacturesClient().catch(() => [] as any[])
  const deja = (factures as any[]).find((f: any) => String(f.cmd_id || '') === String(cmdId) && String(f.statut || '') !== 'annulee')
  if (deja) return deja                                   // idempotent : une seule proforma par commande
  const id = nextSeqId('FAC', (factures as any[]).map((x: any) => x.id))
  const ht = +(Number(off.montant) || 0).toFixed(2)
  const tvaPct = 20
  const tva = +(ht * tvaPct / 100).toFixed(2)
  const { data, error } = await createFactureClient({
    id, num_facture: id,
    client_nom: off.client_nom || null, num_affaire: off.num_affaire || null,
    cmd_id: cmdId as any, bl_id: null as any,
    date_facture: new Date().toISOString().slice(0, 10),
    montant_ht: ht, tva_pct: tvaPct, montant_tva: tva, montant_ttc: +(ht + tva).toFixed(2),
    partielle: false, statut: 'envoyee', mode_paiement: 'Proforma',
    notes: 'Facture proforma — production engagée à l’encaissement (offre ' + String(off.id || '') + ').',
  } as any)
  if (error) return null
  return data
}

// Acceptation d'offre → CRÉE la commande en base (rentrée de commande) + passe l'offre en 'acceptee'.
// Réutilise createCommande (queries.ts). Idempotent : ne recrée pas si la commande existe déjà.
app.post('/api/offre/:id/accepter', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const [offres, cmds] = await Promise.all([getOffres().catch(() => [] as any[]), getCommandes().catch(() => [] as any[])])
  const off = (offres as any[]).find(o => String(o.id) === String(id))
  if (!off) return c.json({ ok: false, error: 'Offre introuvable' }, 404)
  const aff = String(off.num_affaire || off.id)
  const cmdId = 'CMD-' + new Date().getFullYear() + '-' + aff
  const dup = (cmds as any[]).find(x => String(x.id) === cmdId || String(x.offre_id) === String(off.id))
  if (dup) { await updateOffre(id, { statut: 'acceptee' }).catch(() => {}); return c.json({ ok: true, commande: dup, already: true }) }
  const payload: any = {
    id: cmdId, num_affaire: aff, offre_id: off.id, client_id: off.client_id ?? null, client_nom: off.client_nom ?? null,
    pieces: Array.isArray(off.pieces) ? off.pieces : [], montant: Number(off.montant) || 0,
    date_cmd: new Date().toISOString().slice(0, 10), date_liv: b.date_liv || null,
    activite: off.activite ?? null, statut: 'a_programmer', has_st: !!off.has_st, bdt_total: 0, bdt_soldes: 0, retard: false,
  }
  const { data, error } = await createCommande(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  await updateOffre(id, { statut: 'acceptee' }).catch(() => {})
  // Avoirs client : décompte À L'ACCEPTATION — on consomme les avoirs en cours (plus ancien d'abord) jusqu'au montant.
  let avoirApplique = 0
  try {
    const creditsAll = await getCreditsEnCoursForClient(off.client_id, off.client_nom)
    // On ne consomme À L'ACCEPTATION que les avoirs « à déduire de la commande suivante »
    // (ceux restés en mémoire pour la prochaine offre). Les modes « déduire d'une facture » et
    // « remboursement » sont traités ailleurs (facturation / trésorerie). Legacy (null) = compat.
    const credits = (creditsAll as any[]).filter((cr) => { const m = String((cr as any).mode_restitution || ''); return m === 'deduire_suivante' || m === '' })
    let reste = Number(off.montant) || 0
    for (const cr of credits) {
      if (reste <= 0) break
      const dispo = Number((cr as any).solde) || 0
      const applique = Math.min(dispo, reste)
      if (applique <= 0) continue
      const newSolde = +(dispo - applique).toFixed(2)
      reste = +(reste - applique).toFixed(2)
      avoirApplique = +(avoirApplique + applique).toFixed(2)
      await updateCredit(String((cr as any).id), { solde: newSolde, statut: newSolde <= 0 ? 'cloture' : 'partiel' }).catch(() => {})
    }
  } catch {}
  // Persiste l'avoir consommé sur la commande → la facturation le déduit du plafond (Σ factures ≤ montant − avoir).
  if (avoirApplique > 0) await updateCommande(cmdId, { avoir_applique: avoirApplique } as any).catch(() => {})
  // ── CASCADE : prépa technique + DA (matière/accessoires manquants) + lots → BDT/BST ──
  const cascade = await cascadeAcceptationOffre(off, cmdId)
  return c.json({ ok: true, commande: data, avoir_applique: avoirApplique, net: +(((Number(off.montant) || 0) - avoirApplique)).toFixed(2), cascade })
})

// Libération / rejet d'un lot en quarantaine (débloque ou rejette l'affaire pour l'expédition).
app.post('/api/quarantaine/:id/liberer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const u = (c as any).get('user')
  const { data, error } = await updateQuarantaine(id, { statut: 'libere', libere_par: (u && u.nom) || b.par || 'Qualité', libere_le: new Date().toISOString().slice(0, 10) })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, quarantaine: data })
})
app.post('/api/quarantaine/:id/rejeter', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const u = (c as any).get('user')
  const { data, error } = await updateQuarantaine(id, { statut: 'rejete', libere_par: (u && u.nom) || b.par || 'Qualité', libere_le: new Date().toISOString().slice(0, 10) })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, quarantaine: data })
})

// Édition d'une offre (montant / marge / validité / pièces)
app.patch('/api/offre/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['montant', 'montant_revient', 'marge', 'validite', 'vendeur', 'statut', 'mode_livraison', 'frais_transport', 'mode_reglement']) {
    if (k in b) patch[k] = b[k] === '' ? null : b[k]
  }
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateOffre(id, patch)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Mise à jour impossible' }, 400)
  // SYNCHRO mode de règlement → fiche client (le règlement est une condition CLIENT : on l'aligne sur clients.mode_facturation).
  if ('mode_reglement' in patch && patch.mode_reglement) {
    try {
      const cls = await getClients().catch(() => [] as any[])
      const nom = String((data as any).client_nom || '').trim().toLowerCase()
      const cl = (cls as any[]).find((x: any) => String(x.id) === String((data as any).client_id) || (nom && String(x.nom || '').trim().toLowerCase() === nom))
      if (cl && String(cl.mode_facturation || '') !== String(patch.mode_reglement)) await updateClient(cl.id, { mode_facturation: patch.mode_reglement } as any).catch(() => {})
    } catch {}
  }
  return c.json({ ok: true, offre: data })
})

// Tarification d'une offre : coefficient de marge PAR produit. La marge par produit
// est persistée sur pieces_detail[].marge_pct de la DT liée (1:1 avec l'offre), puis
// l'offre voit ses totaux (montant / montant_revient / marge moyenne) RECALCULÉS côté
// serveur — on ne fait pas confiance aux totaux du client. Idempotent.
app.post('/api/offre/:id/pricing', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ lignes?: Array<{ ref_interne: string; marge_pct: number; coeff?: number }>; validite?: string | null }>().catch(() => ({} as any))
  const offres = await getOffres()
  const off = (offres as any[]).find(o => String(o.id) === String(id))
  if (!off) return c.json({ ok: false, error: 'Offre introuvable' }, 404)
  if (!off.dt_ref) return c.json({ ok: false, error: 'Offre sans DT liée : marges non modifiables ici.' }, 400)
  const dt = await getDemandeTravaux(off.dt_ref)
  if (!dt || !Array.isArray((dt as any).pieces_detail)) return c.json({ ok: false, error: 'DT liée introuvable ou sans pièces.' }, 404)
  // COEFFICIENT multiplicateur par référence = source de vérité (PV = CRU × k).
  //   Taux de marque = (PV − PR)/PV = (k − 1)/k  ⇒  k = 1/(1 − taux).
  //   Repli si un ancien client n'envoie que marge_pct : il est lu comme TAUX DE MARQUE.
  const coeffByRef = new Map<string, number>()
  ;(body.lignes || []).forEach((l: any) => {
    if (!l || l.ref_interne == null) return
    const kk = Number(l.coeff)
    const coeff = (isFinite(kk) && kk > 0)
      ? kk
      : (() => { const m = Math.min(99.9, Math.max(-1e6, Number(l.marge_pct) || 0)); return m > 0 ? 1 / (1 - m / 100) : 1 })()
    coeffByRef.set(String(l.ref_interne).toLowerCase(), Math.max(0, coeff))
  })
  const tauxMarque = (k: number) => (k > 0 ? (k - 1) / k * 100 : 0)
  let montantTotal = 0, coutRevientTotal = 0
  const pieces_detail = ((dt as any).pieces_detail as any[]).map(p => {
    const q: any = { ...p }
    const k = String(q.ref_interne || '').toLowerCase()
    const cru = Number(q.cru) || 0
    const qte = Math.max(1, Math.floor(Number(q.quantite)) || 1)
    if (coeffByRef.has(k)) {
      const coeff = coeffByRef.get(k) as number
      q.coeff = +coeff.toFixed(4)
      q.marge_pct = +tauxMarque(coeff).toFixed(2)   // = taux de marque
      q.prix_vente = +(cru * coeff).toFixed(2)
    }
    const coeffQ = Number(q.coeff) > 0 ? Number(q.coeff) : (() => { const m = Math.min(99.9, Number(q.marge_pct) || 0); return m > 0 ? 1 / (1 - m / 100) : 1 })()
    const pv = (q.prix_vente != null) ? Number(q.prix_vente) : cru * coeffQ
    montantTotal += pv * qte
    coutRevientTotal += cru * qte
    return q
  })
  // Taux de marque GLOBAL de l'offre (pondéré par les quantités), pas une moyenne de pourcentages.
  const margeMoyenne = montantTotal > 0 ? +(((montantTotal - coutRevientTotal) / montantTotal) * 100).toFixed(2) : 0
  const upd = await updateDemandeTravaux(off.dt_ref, { pieces_detail })
  if (upd.error) return c.json({ ok: false, error: upd.error.message ?? 'Écriture DT impossible' }, 400)
  const offrePatch: any = { montant: +montantTotal.toFixed(2), montant_revient: +coutRevientTotal.toFixed(2), marge: margeMoyenne }
  if (typeof body.validite === 'string' && body.validite) offrePatch.validite = body.validite
  const { error } = await updateOffre(id, offrePatch)
  if (error) return c.json({ ok: false, error: error.message ?? 'Écriture offre impossible' }, 400)
  return c.json({ ok: true, montant: offrePatch.montant, montant_revient: offrePatch.montant_revient, marge: margeMoyenne })
})

app.delete('/api/offre/:id', async (c) => {
  const { error } = await deleteOffre(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// Émettre un avoir MANUEL (commercial) — CRÉE réellement la ligne `credits`.
// (Avant, le bouton « Émettre l'avoir » ne faisait qu'une demande de validation Direction SANS créer l'avoir
//  → l'avoir n'apparaissait jamais dans la liste, même après validation. C'était le bug.)
app.post('/api/credits', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const montant = Math.max(0, Number(b.montant) || 0)
  const clientNom = String(b.client_nom || '').trim()
  const motif = String(b.motif || '').trim()
  if (!(montant > 0)) return c.json({ ok: false, error: 'Montant de l\'avoir requis (> 0).' }, 400)
  if (!b.client_id && !clientNom) return c.json({ ok: false, error: 'Client requis.' }, 400)
  const numAffaire = String(b.num_affaire || '').trim()
  const numFacture = String(b.num_facture || '').trim()
  const existing = await getCredits().catch(() => [] as any[])
  const takenIds = new Set((existing as any[]).flatMap((x: any) => [String(x.id), String(x.num_avoir)]))
  const year = new Date().getFullYear()
  let num: string
  if (numAffaire) {
    // Rattaché à une affaire → MÊME numéro que l'affaire : AV-AAAA-<num_affaire> (suffixé -2, -3… si plusieurs avoirs sur la même affaire)
    const base = `AV-${year}-${numAffaire}`
    if (!takenIds.has(base)) num = base
    else { let k = 2; while (takenIds.has(base + '-' + k)) k++; num = base + '-' + k }
  } else {
    // Avoir LIBRE → numéro incrémental AVL-AAAA-NNN
    num = nextSeqId('AVL', Array.from(takenIds))
  }
  const motifFull = (motif || 'Avoir manuel') + (numFacture ? ` · facture ${numFacture}` : '')
  const u = (c as any).get('user')
  const { data, error } = await createCredit({
    id: num, num_avoir: num, num_affaire: numAffaire || null,
    client_id: b.client_id || null, client_nom: clientNom || null,
    motif: motifFull, type: b.type ? String(b.type) : 'manuel',
    montant, solde: montant,
    date_credit: (b.date_credit && String(b.date_credit)) || new Date().toISOString().slice(0, 10),
    statut: 'actif',
    // Mode de restitution (choix) + origine + liaisons factures (avoir matière : source achat ↔ cible affaire interne).
    mode_restitution: b.mode_restitution ? String(b.mode_restitution) : 'deduire_facture',
    origine: b.origine ? String(b.origine) : (String(b.type) === 'reclamation' ? 'nc' : 'commercial'),
    facture_source_id: b.facture_source_id || null,
    facture_cible_id: b.facture_cible_id || null,
    vendeur: (u && u.nom) || b.vendeur || 'Corinne', saisi_par: (u && u.nom) || null,
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, avoir: data, id: num })
})

// Édition d'un avoir existant (les champs modifiables ; le solde suit le montant tant que l'avoir n'a pas été consommé).
app.patch('/api/credits/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['motif', 'type', 'date_credit', 'num_affaire', 'mode_restitution', 'origine', 'facture_source_id', 'facture_cible_id', 'client_id', 'client_nom', 'statut']) {
    if (k in b) patch[k] = b[k] === '' ? null : b[k]
  }
  if ('montant' in b) {
    const m = Math.max(0, Number(b.montant) || 0)
    if (!(m > 0)) return c.json({ ok: false, error: 'Montant de l\'avoir requis (> 0).' }, 400)
    patch.montant = m
    // Avoir non encore consommé (solde == montant d'origine) → le solde s'aligne sur le nouveau montant.
    const existing = (await getCredits().catch(() => [] as any[])).find((x: any) => String(x.id) === String(id))
    if (existing && Number(existing.solde) === Number(existing.montant)) patch.solde = m
  }
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ à modifier.' }, 400)
  const { data, error } = await updateCredit(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, avoir: data, id })
})

app.delete('/api/credits/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await deleteCredit(id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, id })
})

// Validation d'une DT — route selon le type de DT et le flag "pièce existante à jour"
//   - Nouveau produit / Maj produit + au moins une pièce à créer  → en_attente_nomenclature (file Nomenclatures BE)
//   - Maj prix, ou toutes les pièces marquées "existante à jour"   → en_attente_be (file Analyse DT BE)
app.post('/api/dt/:id/valider', async (c) => {
  const id = c.req.param('id')
  const dt = await getDemandeTravaux(id)
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  const type = dt.type_dt ?? ''
  const pieces = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
  // Besoin nomenclature évalué PAR PIÈCE selon son type_dt (fallback type DT), hors « Produit à jour »
  const _needNom = (pt: string) => ['Nouveau produit', 'Maj produit'].includes(pt)
  const piecesNeedingNom = (pieces as any[]).filter((p: any) => _needNom(p.type_dt || type) && !p.piece_existante_a_jour)
  const nextStatut = piecesNeedingNom.length > 0 ? 'en_attente_nomenclature' : 'en_attente_be'
  const { data, error } = await updateDemandeTravaux(id, { statut: nextStatut })
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Validation impossible' }, 400)
  await syncDtReferences(dt).catch(() => {})   // alimente le répertoire réf interne ↔ client ↔ réf client ↔ plan
  return c.json({
    ok: true,
    id: data.id,
    statut: data.statut,
    requires_nomenclature: piecesNeedingNom.length > 0,
    pieces_to_nomenclature: piecesNeedingNom.map((p: any) => ({ ref_interne: p.ref_interne, ref_client: p.ref_client, nom_plan: p.nom_plan }))
  })
})

// Sauvegarde de l'analyse DT — met à jour pieces_detail avec coûts/temps puis bascule la DT en dans_offres
// et crée automatiquement un draft d'offre commerciale (statut "offre_en_attente") avec les CRU et PV par pièce.
app.post('/api/dt/:id/analyse', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ pieces_analyse: any[]; gamme_globale?: string; commentaire_be?: string; analyste?: string; decision?: string; meta?: any; site?: string }>()
  const dt = await getDemandeTravaux(id)
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  // Analyse FIGÉE si l'offre liée est déjà acceptée par le client ; sinon la ré-édition reste ouverte.
  const offresAll = await getOffres().catch(() => [] as any[])
  const OFFRE_ACCEPTEE = ['acceptee', 'validee', 'signed', 'signee']
  const offreFrozen = (offresAll as any[]).some(o => String(o.dt_ref) === String(id) && OFFRE_ACCEPTEE.includes(String(o.statut)))
  if (offreFrozen) {
    return c.json({ ok: false, error: 'Offre déjà acceptée par le client : l\'analyse DT est figée et ne peut plus être modifiée.' }, 409)
  }
  // Fusionne l'analyse dans pieces_detail (on garde l'identité de chaque pièce via ref_interne)
  const existing = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
  const byRef = new Map<string, any>()
  existing.forEach((p: any) => { byRef.set((p.ref_interne || '').toLowerCase(), { ...p }) })
  const MARGE_OFFRE_DEFAUT = 20   // marge par défaut du DRAFT d'offre — la marge réelle se fixe côté commercial dans l'offre
  ;(body.pieces_analyse || []).forEach((a: any) => {
    const k = (a.ref_interne || '').toLowerCase()
    const qteA = Math.max(1, Math.floor(Number(a.quantite)) || 1)
    const base = byRef.get(k) || { ref_interne: a.ref_interne, quantite: a.quantite || 1 }
    // CRU (coût de revient PAR PIÈCE) : envoyé par le BE (frais généraux déjà amortis /lot). Repli : recompose (fg /lot ÷ qté).
    const cru = (a.cru != null && a.cru !== '')
      ? (Number(a.cru) || 0)
      : (a.cout_matiere || 0) + (a.cout_accessoire || 0) + (a.cout_mo || 0) + (a.cout_st || 0) + (Number(a.cout_fg || 0) / qteA)
    // Marge par pièce : PRÉSERVER celle déjà fixée dans l'offre (via /api/offre/:id/pricing) — une ré-analyse
    // ne doit PAS écraser le coefficient commercial. Défaut 20% uniquement à la 1re analyse (pièce sans marge).
    const margePct = (base.marge_pct != null && base.marge_pct !== '') ? (Number(base.marge_pct) || 0) : MARGE_OFFRE_DEFAUT
    const pv  = cru * (1 + margePct / 100)
    base.cout_matiere = a.cout_matiere || 0
    base.cout_accessoire = a.cout_accessoire || 0
    base.cout_mo      = a.cout_mo || 0
    base.cout_st      = a.cout_st || 0
    base.cout_fg      = a.cout_fg || 0            // frais généraux PAR LOT
    base.marge_pct    = margePct                  // marge conservée (ou 20% par défaut à la 1re analyse)
    base.cru          = +cru.toFixed(2)
    base.prix_vente   = +pv.toFixed(2)            // PV = CRU × (1 + marge/100) avec la marge conservée
    base.temps_unitaire_min = a.temps_unitaire_min || 0
    base.gamme_operatoire   = a.gamme_operatoire || base.gamme_operatoire || ''
    // Multi-quantités : liste des quantités demandées + chiffrage (CRU) par quantité. Coercition en entiers ≥ 1.
    if (Array.isArray(a.quantites) && a.quantites.length) base.quantites = a.quantites.map((x: any) => Math.max(1, Math.floor(Number(x)) || 0)).filter((v: number) => v > 0)
    if (Array.isArray(a.quantites_chiffrage)) base.quantites_chiffrage = a.quantites_chiffrage.map((t: any) => ({ quantite: Math.max(1, Math.floor(Number(t && t.quantite)) || 1), cru: Number(t && t.cru) || 0, cru_serie: Number(t && t.cru_serie) || 0 }))
    byRef.set(k, base)
  })
  const pieces_detail = Array.from(byRef.values())
  // Métadonnées d'analyse (listes reliées à la base) — décision « Non faisable » ⇒ refus
  const meta = (body.meta && typeof body.meta === 'object') ? body.meta : {}
  const decisionLabel = String(meta.decision ?? body.decision ?? '')
  const refus = /non\s*faisable/i.test(decisionLabel) || body.decision === 'refus'
  // cahier_charges est un text[] (lignes de specs) : on y stocke les champs libres de l'analyse dans UN élément tagué,
  // en préservant les lignes existantes (faute de colonne dédiée — DDL nécessiterait le PAT).
  const CC_TAG = '__analyse_be__:'
  let ccArr: string[] = Array.isArray((dt as any).cahier_charges) ? ((dt as any).cahier_charges as any[]).map((x: any) => String(x)) : []
  ccArr = ccArr.filter((el) => !el.startsWith(CC_TAG))
  // ── Split par site : une DT mixte (Seem + Semrac) s'analyse en DEUX volets ; l'offre fusionnée n'est créée
  //    que lorsque TOUS les volets sont terminés. Sans migration : l'avancement par volet vit dans la méta d'analyse.
  const siteOf = (p: any): string => { const a = String((p && p.activite) || (dt as any).activite || '').toLowerCase(); return a.includes('semrac') ? 'Semrac' : a.includes('seem') ? 'Seem' : 'Autre' }
  const sitesPresents = Array.from(new Set((pieces_detail as any[]).map(siteOf)))
  const isMultiSite = sitesPresents.length >= 2
  const rawSite = (typeof body.site === 'string' && body.site) ? String(body.site) : ''
  const submittedSite = rawSite ? (rawSite.toLowerCase().includes('semrac') ? 'Semrac' : rawSite.toLowerCase().includes('seem') ? 'Seem' : rawSite) : null
  // On repart de l'avancement déjà enregistré pour ne pas écraser le volet terminé lors de la soumission de l'autre.
  let sitesMeta: Record<string, any> = {}
  try { const arr0 = Array.isArray((dt as any).cahier_charges) ? (dt as any).cahier_charges : []; for (const el of arr0) { const s = String(el || ''); if (s.startsWith(CC_TAG)) { const prev = JSON.parse(s.slice(CC_TAG.length)) || {}; if (prev && prev.sites && typeof prev.sites === 'object') sitesMeta = { ...prev.sites }; break } } } catch {}
  if (submittedSite && isMultiSite && !refus) { sitesMeta[submittedSite] = { done: true, analyste: body.analyste ?? (dt as any).analyste ?? null, date: new Date().toISOString().slice(0, 10) } }
  const allSitesDone = !isMultiSite || sitesPresents.every((s) => sitesMeta[s] && sitesMeta[s].done)
  ccArr.push(CC_TAG + JSON.stringify({
    faisabilite: meta.faisabilite ?? null,
    type_demande: meta.type_demande ?? null,
    decision: meta.decision ?? null,
    commentaire: meta.commentaire ?? body.commentaire_be ?? null,
    documents_ged: meta.documents_ged ?? null,
    date_analyse: meta.date_analyse ?? null,
    sites: sitesMeta,
    updated_at: new Date().toISOString(),
  }))
  // Montant / coût de l'affaire = somme SUR TOUTES les pièces (pas seulement le volet soumis) — indispensable
  // pour l'offre fusionnée : chaque volet ne renvoie que ses propres pièces, mais l'offre doit totaliser les deux.
  const montantFull = (pieces_detail as any[]).reduce((s, p) => s + (Number(p.prix_vente) || 0) * (Number(p.quantite) || 1), 0)
  const coutFull = (pieces_detail as any[]).reduce((s, p) => s + (Number(p.cru) || 0) * (Number(p.quantite) || 1), 0)
  const payload: any = {
    pieces_detail,
    // Volet unique OU tous les volets terminés → bascule dans les offres. Sinon, la DT reste analysable (statut inchangé).
    statut: refus ? 'refus' : (allSitesDone ? 'dans_offres' : ((dt as any).statut ?? 'en_analyse')),
    montant: +montantFull.toFixed(2),
    analyste: body.analyste ?? dt.analyste ?? null,
    priorite: (meta.priorite ?? (dt as any).priorite) || null,
    cahier_charges: ccArr,
  }
  const { data, error } = await updateDemandeTravaux(id, payload)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Sauvegarde analyse impossible' }, 400)

  // Si l'analyse n'est pas un refus ET que tous les volets (Seem/Semrac) sont terminés, on crée (ou met à jour)
  // le draft d'offre commerciale FUSIONNÉE. Un volet encore en cours ⇒ pas d'offre (la DT reste analysable).
  let offreId: string | null = null
  if (!refus && allSitesDone) {
    const year = new Date().getFullYear()
    offreId = `OFF-${year}-${dt.num_affaire}`
    // Validité par défaut : 30 jours
    const validite = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)
    const margeMoyenne = pieces_detail.length
      ? +(pieces_detail.reduce((s: number, p: any) => s + (p.marge_pct || 0), 0) / pieces_detail.length).toFixed(2)
      : 20
    const existingOffre = (offresAll as any[]).find(o => o.id === offreId)
    const offrePayload: any = {
      id: offreId,
      num_affaire: dt.num_affaire,
      dt_ref: dt.id,
      client_id: dt.client_id ?? null,
      client_nom: dt.client_nom ?? null,
      pieces: pieces_detail.map((p: any) => p.ref_interne).filter(Boolean),
      montant: +montantFull.toFixed(2),
      montant_revient: +coutFull.toFixed(2),
      marge: margeMoyenne,
      date_offre: new Date().toISOString().slice(0,10),
      validite,
      statut: 'offre_en_attente',
      vendeur: 'Corinne',
      has_st: pieces_detail.some((p: any) => (p.cout_st || 0) > 0)
    }
    if (existingOffre) {
      await updateOffre(offreId, offrePayload)
    } else {
      await createOffre(offrePayload)
    }
  }
  return c.json({ ok: true, id: data.id, statut: data.statut, montant: data.montant, offre_id: offreId,
    multi_site: isMultiSite,
    partial: isMultiSite && !allSitesDone && !refus,
    site: submittedSite,
    sites_done: Object.keys(sitesMeta).filter((s) => sitesMeta[s] && sitesMeta[s].done),
    sites_pending: sitesPresents.filter((s) => !(sitesMeta[s] && sitesMeta[s].done)),
  })
})

app.get('/commercial/dt', (c) => {
  const content = `
  ${pageHeader('fas fa-file-alt','#3b82f6,#1d4ed8','Demande de Travaux (DT)','Corinne · Auto: DT-YYYY-NNN · SharePoint · Notification BE + Production',['DT','PRC1'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Identification')}
      ${fieldRow(`${field('N° DT (auto)','text','DT-2026-XXX (généré auto)',false)} ${field('Date réception','date','',true)}`)}
      ${fieldRow(`${field('Client','select','Legrand / Valeo / Bosch / Faurecia / Schneider / Autre')} ${field('Activité','select','Seem (aluminium) / Semrac (tôlerie)')}`)}
      <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid #e2e8f0;">
        <div style="font-size:.65rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;"><i class="fas fa-address-card" style="color:#3b82f6;margin-right:5px;"></i>Fiche Contact & Client</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:10px;">
          <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e2e8f0;">
            <div style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Contact</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.8rem;">
              ${field('Nom Prénom','text','Prénom NOM')}
              ${field('Poste','text','Responsable Achats / Ingénieur',false)}
              ${field('Email','email','contact@entreprise.fr')}
              ${field('Téléphone','tel','0X.XX.XX.XX.XX',false)}
            </div>
          </div>
          <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e2e8f0;">
            <div style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Entreprise</div>
            ${field('Raison sociale','text','Entreprise SAS')}
            ${field('Adresse','textarea','Numéro, rue, code postal, ville',false,2)}
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button style="background:#3b82f6;color:white;border:none;border-radius:8px;padding:6px 14px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouveau client</button>
          <button style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 14px;font-size:.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-user-plus" style="margin-right:5px;"></i>+ Nouveau contact lié</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Raison de la DT / Type de commande <span style="color:#ef4444;">*</span></label>
          <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.82rem;background:white;outline:none;">
            <option value="">— Sélectionner le type —</option>
            <option value="MAS">MAS — Produit existant avec nouveau prix</option>
            <option value="Necessité">Nécessité</option>
            <option value="Nouveau produit">Nouveau Produit (avec modification)</option>
            <option value="Modification code">Modification de code</option>
            <option value="Urgence">Urgence / Délai spécifique</option>
          </select>
        </div>
        ${field('Priorité','select','Standard / Urgent / Critique – livraison impérative')}
      </div>
      <hr style="border:none;border-top:1.5px dashed #e2e8f0;margin:16px 0;"/>
      ${sectionTitle('Identification de la pièce')}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
        ${field('Désignation interne','text','REF-XXXX ou description interne')}
        ${field('N° pièce client','text','N° pièce selon plan client',false)}
        ${field('Désignation client','text','Désignation selon client',false)}
      </div>
      ${fieldRow(`${field('Quantité','number','Ex: 500')} ${field('Matière / alliage','select','AU4G / AU4GCu / 6060 / 6082 / 1050A / Acier DC01 / Inox 304 / Autre')}`)}
      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;">Standards applicables</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${['RPP','céfi','céfi Placement','céfi ENSAC63.2073','EN9100','NF EN ISO 9001','IATF 16949','Autre'].map(s=>`
          <label style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.78rem;font-weight:600;">
            <input type="checkbox" style="accent-color:#6366f1;"/> ${s}
          </label>`).join('')}
        </div>
      </div>
      ${fieldRow(`${field('Tolérance générale (Seem)','select','ISO 2768-m / ISO 2768-f / Sur plan',false)} ${field('Traitements requis','select','Aucun / Oxydation sulfurique / Anodisation teintée / Peinture poudre / Autre',false)}`)}
      ${field('Modalités de traitement (mesures exigées, certifications…)','textarea','Ex : mesures 3D exigées, certificat de conformité matière, fiche FAI…',false,2)}
      ${field('Description de la demande / attentes spécifiques','textarea','Détailler les exigences : fonctions, tolérances critiques, certification matière, anti-contrefaçon…',true,2)}
      <hr style="border:none;border-top:1.5px dashed #e2e8f0;margin:16px 0;"/>
      ${sectionTitle('Planning & Priorité')}
      ${fieldRow(`${field('Délai souhaité client','date','')} ${field('Priorité','select','Standard / Urgent / Critique – livraison impérative')}`)}
      ${fieldRow(`${field('N° Commande client (si connu)','text','BC-XXXX',false)} ${field('Budget indicatif (€)','number','0',false)}`)}
      ${field('Documents joints (plan, CAO, specs…)','text','Lien SharePoint ou référence GED',false,2)}
      ${afterBox(
        ['Mail auto → BE (analyse technique requise)','Mail auto → Production (info DT entrante)','Mail auto → Corinne (accusé de réception)'],
        ['DT créée en GED SharePoint','Numéro DT auto-incrémenté','Fiche DT archivée'],
        ['BE notifié pour analyse','Planning pré-alerté','KPI DT mis à jour'],
        'Bureau d\'Études'
      )}
      ${submitBtn('Soumettre la DT','#3b82f6')}
    `)}
  </div>`
  return c.html(layout('DT – Demande Travaux', content, 'dt'))
})

app.get('/commercial/offre-old', (c) => {
  const content = `
  ${pageHeader('fas fa-file-invoice-dollar','#6366f1,#4338ca','Offre Commerciale – PRC1-D5','Corinne · Validation BE + Direction · Génération OFF-YYYY-NNN',['PRC1-D5','OFF'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Référence')}
      ${fieldRow(`${field('N° Offre (auto)','text','OFF-2026-XXX',false)} ${field('N° DT associé','text','DT-2026-XXX')}`)}
      ${fieldRow(`${field('Client','text','Raison sociale')} ${field('Date validité offre','date','')}`)}
      <hr style="border:none;border-top:1.5px dashed #e2e8f0;margin:16px 0;"/>
      ${sectionTitle('Tarification')}
      ${fieldRow(`${field('Prix unitaire HT (€)','number','0.00')} ${field('Quantité','number','1')}`)}
      ${fieldRow(`${field('Coût matière (€)','number','0',false)} ${field('Coût main d\'œuvre (€)','number','0',false)}`)}
      ${fieldRow(`${field('Marge cible (%)','number','20',false)} ${field('Délai de livraison','text','Ex: 4 semaines')}`)}
      ${field('Conditions particulières / notes','textarea','Remarques, conditions de paiement, clauses spéciales…',false,2)}
      ${afterBox(
        ['Mail auto → Client (offre PDF)','Mail auto → Direction (si > seuil validation)'],
        ['Offre archivée GED','Numéro OFF auto-généré'],
        ['Relance automatique J+7','CRM mis à jour']
      )}
      ${submitBtn('Envoyer l\'offre','#6366f1')}
    `)}
  </div>`
  return c.html(layout('Offre Commerciale', content, 'offre'))
})

app.get('/commercial/commande-old', (c) => {
  return c.redirect('/commercial/commandes-validees')
})
app.get('/commercial/commande', (c) => {
  const content = `
  ${pageHeader('fas fa-check-circle','#0ea5e9,#0284c7','Validation Commande Client','Corinne · Acceptation formelle · Déclenchement Production · CMD-YYYY-NNN',['CMD','PRC2'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Commande')}
      ${fieldRow(`${field('N° Commande (auto)','text','CMD-2026-XXX',false)} ${field('N° Offre acceptée','text','OFF-2026-XXX')}`)}
      ${fieldRow(`${field('Client','text','Raison sociale')} ${field('Date réception BC client','date','')}`)}
      ${fieldRow(`${field('Montant commande HT (€)','number','0')} ${field('Date livraison confirmée','date','')}`)}
      <hr style="border:none;border-top:1.5px dashed #e2e8f0;margin:16px 0;"/>
      ${sectionTitle('Revue de contrat')}
      ${fieldRow(`${field('Exigences clients vérifiées','select','Oui – conforme / Oui – avec réserves / Non – à clarifier')} ${field('Capacité production confirmée','select','Oui / Non – délai à renégocier')}`)}
      ${field('Commentaires revue de contrat','textarea','Conditions, réserves, points d\'attention…',false,2)}
      ${afterBox(
        ['Mail auto → Production (CMD acceptée)','Mail auto → BE (si besoin prépa)','Mail auto → Direction (si > seuil)'],
        ['CMD créée en GED','LOT planification généré','Fiche commande archivée'],
        ['Production notifiée','Planning mis à jour','OTD départ déclenché']
      )}
      ${submitBtn('Valider la commande','#0ea5e9')}
    `)}
  </div>`
  return c.html(layout('Validation Commande', content, 'cmd'))
})

// ══════════════════════════════════════════════════════════════
// ACHATS
// ══════════════════════════════════════════════════════════════
// Reference d'affaire attribuee a un achat qui ne provient d'aucune affaire : LIBRE-001, -002...
// Facture fournisseur emise a la creation d'un BC proforma : elle arrive dans
// Comptabilite > Factures fournisseurs, a regler. Le rattachement au BC passe par les
// notes (la table n'a pas de colonne bc_id).
async function creerFactureFournisseurProforma(bcId: string, fournisseurNom: any, montantHt: number, isST: boolean, numBc?: string) {
  const ht = +(Number(montantHt) || 0).toFixed(2)
  const tvaPct = 20
  const tvaM = +(ht * tvaPct / 100).toFixed(2)
  const type = isST ? 'sous_traitant' : 'fournisseur'
  // Le numero de la proforma SUIT CELUI DU BON DE COMMANDE, qui porte lui-meme l'affaire :
  //   affaire 0001 -> BC-2026-0001-01 -> proforma PRO-2026-0001-01.
  // Tout le flux d'une affaire se lit donc avec le meme numero, du BC au reglement.
  // Ce numero est un PLACEHOLDER : a la reception, le comptable saisit le vrai numero
  // de facture du fournisseur (c'est lui qui l'emet), ce qui l'ecrase sans rien casser
  // — le rattachement passe par l'identifiant technique `id`, jamais par ce libelle.
  const numProforma = 'PRO-' + String(numBc || bcId).replace(/^BC-/, '')
  const { data, error } = await createFactureFournisseur({
    id: 'FF-' + bcId,                                   // deterministe : une seule proforma par BC
    num_facture: numProforma,
    type,
    fournisseur_nom: String(fournisseurNom || '').trim() || '—',
    date_facture: TODAY_ISO(),
    montant_ht: ht, tva_pct: tvaPct, montant_tva: tvaM, montant_ttc: +(ht + tvaM).toFixed(2),
    statut: 'a_valider',
    compte_charge: isST ? '604100 – Sous-traitance' : null,
    notes: 'BC ' + bcId + ' — proforma : le bon de commande reste en attente de paiement jusqu au reglement de cette facture.',
  } as any)
  if (error) return null
  await genEcritureAchat(data).catch(() => {})
  return data
}

export function prochaineRefLibre(bcs: any[]): string {
  let max = 0
  for (const b of (bcs || [])) {
    const m = String((b as any).num_affaire || '').match(/^LIBRE-(\d+)$/i)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  return 'LIBRE-' + String(max + 1).padStart(3, '0')
}

app.get('/achats/service', async (c) => {
  const [das, fournisseurs, sousTraitants, produits, demandesPrix, rfqReponses, scorecard] = await Promise.all([
    getDemandesAchat(), getFournisseurs(), getSousTraitantsAll(),
    getProduitsFournisseursAll().catch(() => [] as any[]), getDemandesPrix().catch(() => [] as any[]),
    getDemandesPrixReponsesAll().catch(() => [] as any[]),
    getFournisseurScorecard().catch(() => [] as any[]),
  ])
  // Nb de références liées à chaque fournisseur = produits_fournisseurs (catalogue commercial)
  const refCount: Record<string, number> = {}
  ;(produits as any[]).forEach((p: any) => { const k = String(p.fournisseur_id || ''); if (k) refCount[k] = (refCount[k] || 0) + 1 })
  const sansPrix = (produits as any[]).filter((p: any) => p.prix == null).length
  // Enrichir chaque RFQ : fournisseur (via ses réponses, l'en-tête n'a pas de colonne) + a-t-elle des prix.
  const repByDp: Record<string, any[]> = {}
  ;(rfqReponses as any[]).forEach((r: any) => { const k = String(r.demande_prix_id); (repByDp[k] = repByDp[k] || []).push(r) })
  const nowMs = Date.now()
  const dpEnrichies = (demandesPrix as any[]).map((d: any) => {
    const reps = repByDp[String(d.id)] || []
    const fnoms = Array.from(new Set(reps.map((r: any) => r.fournisseur_nom).filter(Boolean)))
    const aDesPrix = reps.some((r: any) => r.prix_unitaire != null)
    // Relance suggérée : envoyée depuis > 7 jours calendaires, sans prix saisi, non clôturée.
    const envMs = d.date_envoi ? new Date(d.date_envoi).getTime() : 0
    const relance = d.statut === 'envoyee' && envMs > 0 && !aDesPrix && (nowMs - envMs) >= 7 * 86400000
    return { ...d, fournisseur_nom: fnoms[0] || null, nb_fournisseurs: fnoms.length, a_des_prix: aDesPrix, a_relancer: relance }
  })
  const _bcsPourLibre = await getBonsDeCommande().catch(() => [] as any[])
  // Affaires proposées pour rattacher une demande libre : celles des commandes et des BC.
  const _cmdsAff = await getCommandes().catch(() => [] as any[])
  const _affaires = [...new Set([
    ...(_cmdsAff as any[]).map((x: any) => String(x.num_affaire || '').trim()),
    ...(_bcsPourLibre as any[]).map((x: any) => String(x.num_affaire || '').trim()),
  ].filter(Boolean).filter((x) => !/^LIBRE-/i.test(x)))].sort()
  // Onglet « Bons de commande » : les BC etaient deja charges ci-dessus (ils servaient a
  // calculer la prochaine reference LIBRE), ils n'etaient simplement pas donnes a la page.
  // Cette vue ne sert qu'a AFFICHER et a changer la date : le formulaire ne renvoie que la
  // date, aucun champ absent d'ici ne peut donc etre reecrit vide.
  const _bcsAchats = (_bcsPourLibre as any[]).map((b: any) => ({
    id: b.id,
    num_bc: b.num_bc || b.id,
    type: (b.type_bc === 'st' || b.type_bc === 'sous_traitant') ? 'st' : 'fournisseur',
    fournisseur: b.fournisseur_nom || '—',
    articles: b.articles || (Array.isArray(b.lignes) ? b.lignes.map((l: any) => l.article).filter(Boolean).join(', ') : '') || '—',
    num_affaire: b.num_affaire || b.affaire_id || '',
    montant: Number(b.montant_ht ?? 0) || 0,
    statut: b.statut || 'en_attente',
    da_id: b.demande_achat_id || '',
    date_bc: b.date_bc ? String(b.date_bc).slice(0, 10) : '',
    // `date_livraison` est la VRAIE colonne ; `date_livraison_prevue` n'existe pas en base.
    prevue: b.date_livraison ? String(b.date_livraison).slice(0, 10) : '',
    initiale: b.date_livraison_initiale ? String(b.date_livraison_initiale).slice(0, 10) : '',
    reception: b.date_reception_reelle ? String(b.date_reception_reelle).slice(0, 10) : '',
    accuse: b.accuse_fournisseur_le ? String(b.accuse_fournisseur_le).slice(0, 10) : '',
  }))
  return c.html(pageServiceAchats(das, fournisseurs, sousTraitants, refCount, dpEnrichies as any[], sansPrix, scorecard as any[], produits as any[], prochaineRefLibre(_bcsPourLibre as any[]), _affaires, _bcsAchats))
})

// ─── Fiches détaillées Fournisseur / Sous-traitant ───────────
app.get('/achats/fournisseur/:id', async (c) => {
  const id = c.req.param('id')
  const [fournisseurs, stock, produits] = await Promise.all([getFournisseurs(), getStockReel().catch(() => [] as any[]), getProduitsFournisseur(id).catch(() => [] as any[])])
  const entity = (fournisseurs as any[]).find(f => String(f.id) === String(id))
  if (!entity) return c.html(pageFournisseurFiche({ id, nom: 'Fournisseur introuvable' }, false, []))
  const categoriesExistantes = Array.from(new Set((fournisseurs as any[]).map(f => f.categorie).filter(Boolean)))
  const otd = await computeOtd('fournisseur', id, entity.otd_methode || 'bc_bl').catch(() => null)
  return c.html(pageFournisseurFiche(entity, false, stock as any[], { otd, categoriesExistantes, produits: produits as any[] }))
})

app.get('/achats/sous-traitant/:id', async (c) => {
  const id = c.req.param('id')
  const [sts, stock] = await Promise.all([getSousTraitantsAll(), getStockReel().catch(() => [] as any[])])
  const entity = (sts as any[]).find(s => String(s.id) === String(id))
  if (!entity) return c.html(pageFournisseurFiche({ id, nom: 'Sous-traitant introuvable' }, true, []))
  const categoriesExistantes = Array.from(new Set((sts as any[]).map(s => s.categorie).filter(Boolean)))
  const operationsExistantes = Array.from(new Set((sts as any[]).flatMap(s => (Array.isArray(s.tarifs) ? s.tarifs : []).map((t: any) => t && t.operation).filter(Boolean))))
  const otd = await computeOtd('sous_traitant', id, entity.otd_methode || 'bc_bl').catch(() => null)
  return c.html(pageFournisseurFiche(entity, true, stock as any[], { otd, categoriesExistantes, operationsExistantes }))
})

// PATCH fournisseur / sous-traitant : maj fiche + catalogue
app.patch('/api/fournisseurs/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['nom', 'categorie', 'activite', 'contact', 'email', 'tel', 'delai_moyen_j', 'conditions_paiement', 'conditions_standards', 'qualification', 'scoring', 'mode_reglement', 'otd_methode']) {
    if (k in b) patch[k] = b[k]
  }
  if ('localisation' in b) patch.adresse = b.localisation   // la fiche envoie 'localisation' → colonne 'adresse'
  if (Array.isArray(b.catalogue)) patch.catalogue = b.catalogue   // jsonb natif (plus de double encodage)
  if (Array.isArray(b.familles_fourniture)) patch.familles_fourniture = b.familles_fourniture
  if (Array.isArray(b.famille_produits)) patch.famille_produits = b.famille_produits
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateFournisseur(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, fournisseur: data })
})

app.patch('/api/sous-traitants/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['nom', 'categorie', 'activite', 'contact', 'email', 'tel', 'delai_moyen_j', 'conditions_paiement', 'conditions_standards', 'qualification', 'scoring', 'mode_reglement', 'otd_methode']) {
    if (k in b) patch[k] = b[k]
  }
  if ('localisation' in b) patch.adresse = b.localisation   // la fiche envoie 'localisation' → colonne 'adresse'
  if (Array.isArray(b.catalogue)) patch.catalogue = b.catalogue   // jsonb natif (plus de double encodage)
  // Tarifs sous-traitance par opération [{operation, forfait_ht, prix_unitaire_piece_ht}] (jsonb natif, pas stringifié)
  if (Array.isArray(b.tarifs)) patch.tarifs = b.tarifs
  if (Array.isArray(b.prestations)) patch.prestations = b.prestations
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateSousTraitant(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, sous_traitant: data })
})

// Suppression fournisseur / sous-traitant
app.delete('/api/fournisseurs/:id', async (c) => {
  const { error } = await deleteFournisseur(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})
app.delete('/api/sous-traitants/:id', async (c) => {
  const { error } = await deleteSousTraitant(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// API : catalogue agrégé pour la liste déroulante des nomenclatures
//  Filtre par activité (Seem / Semrac / both). Retourne aussi le type (F/ST).
app.get('/api/catalogue-fournisseurs', async (c) => {
  const activite = c.req.query('activite') || ''
  const [fournisseurs, sts] = await Promise.all([getFournisseurs(), getSousTraitantsAll()])
  const out: any[] = []
  const visible = (a: any) => !activite || activite === 'both' || !a || a === 'both' || a === activite
  ;(fournisseurs as any[]).forEach(f => {
    if (!visible(f.activite)) return
    let items: any[] = []
    if (Array.isArray(f.catalogue)) items = f.catalogue
    else if (typeof f.catalogue === 'string') { try { const o = JSON.parse(f.catalogue); items = Array.isArray(o) ? o : (o?.items || []) } catch (_e) {} }
    items.forEach(it => {
      out.push({
        type: 'fournisseur', source_id: f.id, source_nom: f.nom, source_activite: f.activite || 'both', source_categorie: f.categorie || null,
        ref: it.ref, designation: it.designation, categorie: it.categorie || null, unite: it.unite || null,
        prix_moyen_ht: it.prix_moyen_ht ?? null, qte_paquet: it.qte_paquet ?? null, prix_mini_cde_ht: it.prix_mini_cde_ht ?? null, delai_j: it.delai_j ?? null,
        notes: it.notes || null,
      })
    })
  })
  ;(sts as any[]).forEach(s => {
    if (!visible(s.activite)) return
    let items: any[] = []
    if (Array.isArray(s.catalogue)) items = s.catalogue
    else if (typeof s.catalogue === 'string') { try { const o = JSON.parse(s.catalogue); items = Array.isArray(o) ? o : (o?.items || []) } catch (_e) {} }
    items.forEach(it => {
      out.push({
        type: 'sous_traitant', source_id: s.id, source_nom: s.nom, source_activite: s.activite || 'both', source_categorie: s.categorie || null,
        ref: it.ref, designation: it.designation, categorie: it.categorie || null, unite: it.unite || null,
        prix_moyen_ht: it.prix_moyen_ht ?? null, qte_paquet: it.qte_paquet ?? null, prix_mini_cde_ht: it.prix_mini_cde_ht ?? null, delai_j: it.delai_j ?? null,
        notes: it.notes || null,
      })
    })
  })
  return c.json({ ok: true, items: out, count: out.length })
})

// ─── API référentiel fournisseurs / sous-traitants (Achats) ───
app.post('/api/achats/fournisseur', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.nom || !String(b.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  const payload: any = {
    nom: String(b.nom).trim(),
    code: b.code || null,
    contact: b.contact || null,
    email: b.email || null,
    tel: b.tel || null,
    adresse: b.adresse || null,
    siret: b.siret || null,
    delai_moyen_j: b.delai_moyen_j != null ? Number(b.delai_moyen_j) : null,
    conditions_paiement: b.conditions_paiement || null,
    famille_produits: Array.isArray(b.famille_produits) ? b.famille_produits : (b.famille_produits ? [b.famille_produits] : null),
    actif: true,
    notes: b.notes || null,
  }
  const { data, error } = await createFournisseur(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, fournisseur: data })
})

app.post('/api/achats/sous-traitant', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.nom || !String(b.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  const payload: any = {
    nom: String(b.nom).trim(),
    code: b.code || null,
    contact: b.contact || null,
    email: b.email || null,
    tel: b.tel || null,
    adresse: b.adresse || null,
    siret: b.siret || null,
    prestations: Array.isArray(b.prestations) ? b.prestations : (b.prestations ? String(b.prestations).split(',').map((s: string) => s.trim()).filter(Boolean) : null),
    certifications: Array.isArray(b.certifications) ? b.certifications : (b.certifications ? String(b.certifications).split(',').map((s: string) => s.trim()).filter(Boolean) : null),
    delai_moyen_j: b.delai_moyen_j != null ? Number(b.delai_moyen_j) : null,
    actif: true,
    approved: b.approved !== false,
    notes: b.notes || null,
  }
  const { data, error } = await createSousTraitant(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, sous_traitant: data })
})

// ══════════════════════════════════════════════════════════════
// API WORKFLOW ACHATS → EXPÉDITIONS → QUALITÉ
//  DA (à traiter / brouillon / traitée) → BC (en attente) → réception (BL)
//  → PV de contrôle réception → Qualité (OK ou NC + quarantaine)
// ══════════════════════════════════════════════════════════════

// Génère le prochain identifiant séquentiel PREFIX-ANNÉE-NNN
// Numérotation ALIGNÉE SUR L'AFFAIRE, comme les lots et les bons de travail :
//   BC-YYYY-<affaire>-NN   ·   BL-YYYY-<affaire>-NN
// (cf. fmtLotId / fmtBonId : LOT-YYYY-<affaire>-ZZ, BDT-YYYY-<affaire>-ZZ-AA)
// Le compteur repart à 01 PAR AFFAIRE et par année : deux affaires ne se marchent
// plus dessus, et l'affaire se lit directement dans le numéro.
// Sans affaire, on utilise la référence LIBRE-XXX déjà attribuée par prochaineRefLibre().
// ⚠ Les numéros DÉJÀ attribués (ancien format BC-YYYY-NNN) sont laissés intacts :
//   seul le prochain numéro change de forme.
const _sanAff = (a: any) => String(a ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16)
// Un BL de RÉCEPTION est adossé à SON bon de commande : le numéro du BC se lit
// dans celui du BL. Une affaire peut porter plusieurs commandes, et chaque commande
// plusieurs livraisons (réceptions partielles) — les deux se lisent d'un coup d'œil :
//
//     BC-2026-0001-03   la 3ᵉ commande de l'affaire 0001
//       └─ BL-2026-0001-03-01   sa 1ʳᵉ réception
//       └─ BL-2026-0001-03-02   sa 2ᵉ réception (partielle)
//
// Repli : sans bon de commande identifiable (BL client, retour), on retombe sur la
// numérotation par affaire — un BL client répond à une commande CLIENT, pas à un BC.
// Numero d'un document ADOSSE a un bon de commande (BST du planning aujourd'hui) :
// il reprend le numero du BC et lui ajoute son propre rang.
//   BC-2026-0001-03  ->  BST-2026-0001-03-01
// En lisant le document on remonte a son BC, et de la a l'affaire.
// ⚠ On lui passe le NUMERO du BC (`num_bc`), pas son identifiant technique : sur un BC
//   anterieur a la renumerotation les deux different (id BC-2026-003, numero
//   BC-2026-0001-01) et c'est le numero, celui que l'atelier lit, qui doit se propager.
export function nextBstPourBc(bcNum: any, ids: (string | undefined | null)[]): string {
  // Le suffixe ne contient que chiffres, lettres et tirets : rien a echapper ensuite.
  const base = String(bcNum ?? '').trim().replace(/^BC-/, '').replace(/[^A-Za-z0-9-]/g, '')
  if (!base) return 'BST-' + new Date().getFullYear() + '-LIBRE-' + Date.now().toString(36)
  const motif = new RegExp('^BST-' + base + '-(\d+)$')
  let max = 0
  for (const id of ids) {
    const m = String(id ?? '').match(motif)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  return 'BST-' + base + '-' + String(max + 1).padStart(2, '0')
}

export function nextBlPourBc(bcId: any, affaire: any, ids: (string | undefined | null)[]): string {
  // Le suffixe ne contient que chiffres, lettres et tirets : rien a echapper ensuite.
  const base = String(bcId ?? '').trim().replace(/^BC-/, '').replace(/[^A-Za-z0-9-]/g, '')
  if (!base) return nextAffaireId('BL', affaire, ids)
  const motif = new RegExp('^BL-' + base + '-(\\d+)$')
  let max = 0
  for (const id of ids) {
    const m = String(id ?? '').match(motif)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  return 'BL-' + base + '-' + String(max + 1).padStart(2, '0')
}

export function nextAffaireId(prefix: 'BC' | 'BL', affaire: any, ids: (string | undefined | null)[]): string {
  const year = new Date().getFullYear()
  const aff = _sanAff(affaire) || 'LIBRE'
  const motif = new RegExp('^' + prefix + '-' + year + '-' + aff.replace(/[-]/g, '\\-') + '-(\\d+)$')
  let max = 0
  for (const id of ids) {
    const m = String(id ?? '').match(motif)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  return prefix + '-' + year + '-' + aff + '-' + String(max + 1).padStart(2, '0')
}

function nextSeqId(prefix: string, ids: (string | undefined | null)[]): string {
  const year = new Date().getFullYear()
  const re = new RegExp('^' + prefix + '-' + year + '-(\\d+)$')
  let max = 0
  for (const id of ids) {
    const m = String(id ?? '').match(re)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`
}
const TODAY_ISO = () => new Date().toISOString().slice(0, 10)

// ─── Création d'une DA (manuelle depuis le Stock, ou via les Achats) ───
app.post('/api/achats/da', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const das = await getDemandesAchat().catch(() => [] as any[])
  const id = nextSeqId('DA', (das as any[]).map(d => d.id))
  const payload: any = {
    id,
    demandeur: body.demandeur || 'Stock',
    type_da: body.type_da || 'Matière',
    article: body.article || '—',
    fournisseur: body.fournisseur || null,
    fournisseur_id: body.fournisseur_id || null,
    qte: body.qte != null ? String(body.qte) : null,
    priorite: body.priorite || 'normal',
    statut: 'a_traiter',
    date_da: TODAY_ISO(),
    livraison: body.livraison || null,
    affaire_id: await resolveAffaireId(body.affaire_id),
    type_bc: body.type_bc === 'st' ? 'st' : 'fournisseur',
    visible: true,
    genere_par_adt: false,
  }
  const { data, error } = await createDemandeAchat(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, da: data })
})

// ─── DA opérateur (borne PIN) : demande d'achat libre, RESTREINTE au poste de l'affectation du jour ───
// L'opérateur s'identifie (matricule + PIN) → contexte : ses postes du jour + les machines de ces postes.
app.post('/api/production/operateur-contexte', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.matricule || !b.pin) return c.json({ ok: false, error: 'Matricule + PIN requis' }, 400)
  const op = await verifyOperateurPin(String(b.matricule), String(b.pin))
  if (!op) return c.json({ ok: false, error: 'Matricule ou PIN incorrect' }, 401)
  const today = new Date().toISOString().slice(0, 10)
  const [affs, procs, machs, postes] = await Promise.all([
    getAffectationsPoste(today, today).catch(() => [] as any[]), getProcessAtelier().catch(() => [] as any[]),
    getMachines().catch(() => [] as any[]), getPostes().catch(() => [] as any[]),
  ])
  const procById: Record<string, any> = {}; (procs as any[]).forEach((p: any) => { procById[String(p.id)] = p })
  const posteIds = new Set<string>()
  ;(affs as any[]).filter((a: any) => String(a.operateur_id) === String(op.id)).forEach((a: any) => { const pr = procById[String(a.process_id)]; if (pr && pr.poste_id) posteIds.add(String(pr.poste_id)) })
  if (!posteIds.size) return c.json({ ok: false, error: "Vous n'êtes affecté à aucun poste aujourd'hui — voir le planning." }, 403)
  const myPostes = (postes as any[]).filter((p: any) => posteIds.has(String(p.id))).map((p: any) => ({ id: p.id, nom: p.nom }))
  const myMachines = (machs as any[]).filter((m: any) => m.poste_id && posteIds.has(String(m.poste_id))).map((m: any) => ({ id: m.id, nom: m.nom, poste_id: m.poste_id, cnc: !!m.cnc }))
  return c.json({ ok: true, operateur: { id: op.id, nom: (`${op.prenom || ''} ${op.nom || ''}`).trim() || String(op.matricule) }, postes: myPostes, machines: myMachines })
})

app.post('/api/production/demande-achat-operateur', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.matricule || !b.pin) return c.json({ ok: false, error: 'Matricule + PIN requis' }, 400)
  const op = await verifyOperateurPin(String(b.matricule), String(b.pin))
  if (!op) return c.json({ ok: false, error: 'Matricule ou PIN incorrect' }, 401)
  const categorie = ['machine', 'matiere', 'accessoire'].includes(String(b.categorie)) ? String(b.categorie) : ''
  if (!categorie) return c.json({ ok: false, error: 'Choisissez : machine, matière ou accessoire.' }, 400)
  const article = String(b.article || '').trim()
  if (!article) return c.json({ ok: false, error: "Désignation de l'article requise." }, 400)
  const qte = Math.max(1, Math.floor(Number(b.qte)) || 1)
  const posteId = String(b.poste_id || '')
  const today = new Date().toISOString().slice(0, 10)
  const [affs, procs, machs] = await Promise.all([getAffectationsPoste(today, today).catch(() => [] as any[]), getProcessAtelier().catch(() => [] as any[]), getMachines().catch(() => [] as any[])])
  const procById: Record<string, any> = {}; (procs as any[]).forEach((p: any) => { procById[String(p.id)] = p })
  const myPosteIds = new Set<string>()
  ;(affs as any[]).filter((a: any) => String(a.operateur_id) === String(op.id)).forEach((a: any) => { const pr = procById[String(a.process_id)]; if (pr && pr.poste_id) myPosteIds.add(String(pr.poste_id)) })
  if (!posteId || !myPosteIds.has(posteId)) return c.json({ ok: false, error: "Poste non autorisé (vous n'y êtes pas affecté aujourd'hui)." }, 403)
  let machineId: string | null = null
  if (categorie === 'machine') {
    machineId = String(b.machine_id || '')
    const m = (machs as any[]).find((x: any) => String(x.id) === machineId)
    if (!m || String(m.poste_id) !== posteId) return c.json({ ok: false, error: 'Machine invalide ou hors de votre poste.' }, 403)
  }
  const das = await getDemandesAchat().catch(() => [] as any[])
  const id = nextSeqId('DA', (das as any[]).map((d: any) => d.id))
  const nomOp = (`${op.prenom || ''} ${op.nom || ''}`).trim() || String(op.matricule)
  const typeLabel = categorie === 'machine' ? 'Machine' : (categorie === 'matiere' ? 'Matière' : 'Accessoire')
  const { data, error } = await createDemandeAchat({
    id, demandeur: nomOp, type_da: typeLabel, article, qte: String(qte),
    priorite: ['normal', 'urgent', 'critique'].includes(String(b.priorite)) ? String(b.priorite) : 'normal',
    statut: 'a_traiter', date_da: TODAY_ISO(), visible: true, genere_par_adt: false,
    categorie, machine_id: machineId, poste_id: posteId, operateur_id: String(op.id),
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, da: data, id })
})

// ─── Sauvegarde brouillon d'une DA en cours de traitement (sans soumettre) ───
// ── FUSION DE DEMANDES D'ACHAT ──────────────────────────────────────────────
// La composition d'une fusion est rangée dans `demandes_achat.bc_draft` (colonne jsonb —
// vérifié par sonde), sous les clés réservées `_fusion` et `_regroupee_dans`. Aucune colonne
// nouvelle : le brouillon de BC est précisément l'endroit où décrire ce que la demande va
// devenir une fois commandée.
// Écrit une demande d'achat dont le patch contient un `bc_draft` OBJET.
// ⚠ La colonne est `jsonb` en cloud mais `text` dans le schéma Docker : sur une stack Docker,
// écrire un objet échoue. On réessaie donc une fois en sérialisant — la lecture, elle, encaisse
// déjà les deux formes (fusionDe et achOpenBC parsent la chaîne le cas échéant).
async function majDaDraft(id: string, patch: any) {
  const r = await updateDemandeAchat(id, patch)
  if (!r?.error || patch?.bc_draft == null || typeof patch.bc_draft !== 'object') return r
  return await updateDemandeAchat(id, { ...patch, bc_draft: JSON.stringify(patch.bc_draft) })
}

export function fusionDe(da: any): any[] {
  let d = da?.bc_draft
  if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = null } }
  return Array.isArray(d?._fusion) ? d._fusion : []
}
// Affaires servies par un bon de commande : la sienne, plus celles de ses lignes.
// ⚠ `num_affaire` reste TOUJOURS scalaire : c'est la clé d'égalité stricte de la porte
// matière et du calcul de coût. Une valeur composite (« AFF-1 · AFF-2 ») gèlerait
// matiere_ok à false et ferait disparaître les BDT des DEUX affaires du planning.
export function bcAffaires(bc: any): string[] {
  const out = new Set<string>()
  const a = String(bc?.num_affaire || '').trim(); if (a) out.add(a)
  const lg = Array.isArray(bc?.lignes) ? bc.lignes : []
  for (const l of lg) { const x = String((l as any)?.num_affaire || '').trim(); if (x) out.add(x) }
  return [...out]
}

// Une DA est « traitée » dès qu'elle a donné lieu à un bon de commande : elle n'est alors
// plus ni modifiable ni retirable. Même prédicat que la liste côté client (achats.tsx).
function daEstTraitee(statut: any): boolean {
  const v = String(statut || '').toLowerCase().trim()
  if (v === '' || v.startsWith('a_traiter') || v === 'nouveau' || v === 'en_attente' || v === 'brouillon') return false
  return /(command|envoy|re[çc]u|recu|clotur|cl[oô]tur|trait[eé]|solde|bc)/i.test(v)
}
// DA retirée de l'affichage : la ligne reste en base (« du front, pas de la DB »).
// ⚠ Tout lecteur de demandes_achat doit l'appliquer, sinon une demande retirée continue
// d'être comptée dans les tableaux de bord ou de bloquer le réappro automatique.
export function daMasquee(d: any): boolean {
  return d?.visible === false || d?.statut === 'regroupee' || d?.statut === 'supprimee'
}

app.patch('/api/achats/da/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['demandeur', 'type_da', 'article', 'fournisseur', 'qte', 'priorite', 'livraison', 'affaire_id', 'type_bc']) {
    if (k in body && body[k] != null) patch[k] = k === 'qte' ? String(body[k]) : body[k]
  }
  patch.bc_draft = body.bc_draft ?? null
  patch.statut = 'brouillon'
  const { data, error } = await majDaDraft(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, da: data })
})

// ─── DA : MODIFIER une demande d'achat (libre OU automatique rattachée à une commande) ───
// Route distincte du PATCH ci-dessus, qui sert au brouillon de BC et force statut='brouillon'.
// Ici on ne touche NI au statut, NI à genere_par_adt, NI au bc_draft, NI au rattachement d'une
// DA automatique : num_affaire et cmd_ref portent la porte « matière reçue » et le coût de
// l'affaire — les déplacer changerait silencieusement l'imputation de la dépense.
app.post('/api/achats/da/:id/editer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const das = await getDemandesAchat().catch(() => [] as any[])
  const da = (das as any[]).find((d: any) => String(d.id) === String(id))
  if (!da) return c.json({ ok: false, error: 'Demande introuvable.' }, 404)
  if (daMasquee(da)) return c.json({ ok: false, error: 'Cette demande a été retirée de la liste.' }, 409)
  if (daEstTraitee(da.statut)) return c.json({ ok: false, error: 'Demande déjà traitée : un bon de commande en découle, elle n\'est plus modifiable.' }, 409)
  const patch: any = {}
  for (const k of ['article', 'fournisseur', 'fournisseur_id', 'qte', 'priorite', 'livraison', 'type_da', 'type_bc', 'demandeur']) {
    if (k in b) patch[k] = (b[k] === '' || b[k] == null) ? null : (k === 'qte' ? String(b[k]) : b[k])
  }
  if (!String(patch.article ?? da.article ?? '').trim()) return c.json({ ok: false, error: 'La désignation de l\'article est obligatoire.' }, 400)
  // Rattachement : modifiable UNIQUEMENT sur une demande libre.
  if (da.genere_par_adt !== true && 'num_affaire' in b) {
    const aff = String(b.num_affaire || '').trim()
    patch.num_affaire = aff || null
    patch.affaire_id = aff ? await resolveAffaireId(aff) : null
  }
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ à modifier.' }, 400)
  patch.updated_at = new Date().toISOString()
  const { data, error } = await updateDemandeAchat(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, da: data })
})

// ─── DA : RETIRER une demande d'achat de la liste ───
// La ligne n'est PAS supprimée en base (et ne peut pas l'être : la clé anon n'a pas le droit
// de DELETE ici). Elle est masquée, donc réversible côté base si besoin.
// Refusé sur une demande AUTOMATIQUE : elle traduit un besoin matière réel issu d'une commande,
// la retirer ferait disparaître l'engagement de dépense sans que personne ne le voie.
app.post('/api/achats/da/:id/masquer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const das = await getDemandesAchat().catch(() => [] as any[])
  const da = (das as any[]).find((d: any) => String(d.id) === String(id))
  if (!da) return c.json({ ok: false, error: 'Demande introuvable.' }, 404)
  if (daMasquee(da)) return c.json({ ok: true, deja: true })
  if (da.genere_par_adt === true) {
    return c.json({ ok: false, error: 'Demande automatique issue d\'une commande : elle ne peut pas être retirée, seulement modifiée.' }, 409)
  }
  if (daEstTraitee(da.statut)) return c.json({ ok: false, error: 'Demande déjà traitée : un bon de commande en découle.' }, 409)
  const motif = String(b.motif || '').trim()
  const { error } = await updateDemandeAchat(id, {
    visible: false, statut: 'supprimee',
    demandeur: motif ? String(da.demandeur || '') + ' · retirée : ' + motif.slice(0, 80) : da.demandeur,
    updated_at: new Date().toISOString(),
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── DA : FUSIONNER des demandes d'achat CHOISIES À LA MAIN ───
// Règle métier posée par l'utilisateur : on ne fusionne que si la commande part chez UN SEUL
// fournisseur. Les demandes sans fournisseur héritent de l'unique fournisseur du lot.
// La demande fusionnée sert les DEUX affaires quand elles diffèrent : l'affaire porteuse reste
// dans num_affaire (scalaire, indispensable aux portes de production), les autres voyagent
// dans les LIGNES du bon de commande.
app.post('/api/achats/da/fusionner', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const ids = [...new Set((Array.isArray(b.da_ids) ? b.da_ids : []).map((x: any) => String(x || '').trim()).filter(Boolean))]
  if (ids.length < 2) return c.json({ ok: false, error: 'Sélectionnez au moins deux demandes à fusionner.' }, 400)
  const das = await getDemandesAchat().catch(() => [] as any[])
  const sel: any[] = []
  for (const id of ids) {
    const d = (das as any[]).find((x: any) => String(x.id) === id)
    if (!d) return c.json({ ok: false, error: 'Demande introuvable : ' + id }, 404)
    if (daMasquee(d)) return c.json({ ok: false, error: 'La demande ' + id + ' a été retirée de la liste.' }, 409)
    if (daEstTraitee(d.statut)) return c.json({ ok: false, error: 'La demande ' + id + ' est déjà traitée : un bon de commande en découle.' }, 409)
    if (fusionDe(d).length) return c.json({ ok: false, error: 'La demande ' + id + ' est déjà une fusion. Défusionnez-la d\'abord.' }, 409)
    sel.push(d)
  }
  // ── Contrainte : un seul fournisseur ──
  const fourns = [...new Set(sel.map((d: any) => String(d.fournisseur || '').trim()).filter(Boolean))]
  const impose = String(b.fournisseur || '').trim()
  if (fourns.length > 1) {
    return c.json({ ok: false, error: 'Fusion impossible : ces demandes concernent ' + fourns.length + ' fournisseurs différents (' + fourns.join(', ') + '). Une fusion ne peut donner qu\'une seule commande, chez un seul fournisseur.' }, 409)
  }
  const fournisseur = fourns[0] || impose
  if (!fournisseur) return c.json({ ok: false, error: 'Aucune des demandes ne porte de fournisseur : choisissez celui chez qui la commande sera passée.' }, 400)
  const fournId = sel.map((d: any) => d.fournisseur_id).find(Boolean) || (b.fournisseur_id || null)
  // ── Porteuse : celle demandée, sinon la plus ancienne ──
  sel.sort((x: any, y: any) => String(x.date_da || x.created_at || '').localeCompare(String(y.date_da || y.created_at || '')))
  const primaire = sel.find((d: any) => String(d.id) === String(b.primary_id || '')) || sel[0]
  const autres = sel.filter((d: any) => String(d.id) !== String(primaire.id))
  const prioRank: Record<string, number> = { critique: 3, urgent: 2, normal: 1 }
  const snap = (d: any) => ({ id: d.id, article: d.article || '', qte: d.qte || '', type_da: d.type_da || '',
    num_affaire: String(d.num_affaire || d.affaire_id || '').trim() || null, cmd_ref: d.cmd_ref || null,
    categorie: d.categorie || null, machine_id: d.machine_id || null, livraison: d.livraison || null })
  const sources = sel.map(snap)
  const affaires = [...new Set(sources.map((s: any) => s.num_affaire).filter(Boolean))]
  const draftPrim: any = (typeof primaire.bc_draft === 'string' ? (() => { try { return JSON.parse(primaire.bc_draft) } catch { return {} } })() : primaire.bc_draft) || {}
  const patchPrim: any = {
    article: sources.map((s: any) => (s.article || '—') + (s.qte ? ' (' + s.qte + ')' : '')).join(' · '),
    fournisseur, fournisseur_id: fournId,
    priorite: sel.map((d: any) => d.priorite || 'normal').sort((x: string, y: string) => (prioRank[y] || 0) - (prioRank[x] || 0))[0],
    statut: 'a_traiter', visible: true,
    livraison: sources.map((s: any) => s.livraison).filter(Boolean).sort()[0] || primaire.livraison || null,
    bc_draft: { ...draftPrim, _fusion: sources },
    updated_at: new Date().toISOString(),
  }
  const { error: e1 } = await majDaDraft(String(primaire.id), patchPrim)
  if (e1) return c.json({ ok: false, error: e1.message }, 400)
  let absorbees = 0
  for (const d of autres) {
    const dr: any = (typeof d.bc_draft === 'string' ? (() => { try { return JSON.parse(d.bc_draft) } catch { return {} } })() : d.bc_draft) || {}
    const { error } = await majDaDraft(String(d.id), {
      statut: 'regroupee', visible: false,
      bc_draft: { ...dr, _regroupee_dans: String(primaire.id) },
      updated_at: new Date().toISOString(),
    })
    if (!error) absorbees++
  }
  return c.json({ ok: true, primaire: primaire.id, absorbees, fournisseur, affaires })
})

// ─── DA : DÉFUSIONNER (rendre leur autonomie aux demandes absorbées) ───
app.post('/api/achats/da/:id/defusionner', async (c) => {
  const id = c.req.param('id')
  const das = await getDemandesAchat().catch(() => [] as any[])
  const prim = (das as any[]).find((d: any) => String(d.id) === String(id))
  if (!prim) return c.json({ ok: false, error: 'Demande introuvable.' }, 404)
  if (daEstTraitee(prim.statut)) return c.json({ ok: false, error: 'Fusion déjà commandée : elle ne peut plus être défaite.' }, 409)
  const sources = fusionDe(prim)
  if (!sources.length) return c.json({ ok: false, error: 'Cette demande n\'est pas une fusion.' }, 400)
  let restaurees = 0
  for (const s of sources) {
    if (String(s.id) === String(id)) continue
    const d = (das as any[]).find((x: any) => String(x.id) === String(s.id))
    if (!d) continue
    const dr: any = (typeof d.bc_draft === 'string' ? (() => { try { return JSON.parse(d.bc_draft) } catch { return {} } })() : d.bc_draft) || {}
    delete dr._regroupee_dans
    const { error } = await majDaDraft(String(s.id), { statut: 'a_traiter', visible: true, bc_draft: Object.keys(dr).length ? dr : null, updated_at: new Date().toISOString() })
    if (!error) restaurees++
  }
  const mien = sources.find((s: any) => String(s.id) === String(id))
  const drP: any = (typeof prim.bc_draft === 'string' ? (() => { try { return JSON.parse(prim.bc_draft) } catch { return {} } })() : prim.bc_draft) || {}
  delete drP._fusion
  await majDaDraft(String(id), {
    article: mien?.article || prim.article, qte: mien?.qte ?? prim.qte,
    bc_draft: Object.keys(drP).length ? drP : null, updated_at: new Date().toISOString(),
  }).catch(() => {})
  return c.json({ ok: true, restaurees })
})

// ─── DA : regrouper les demandes d'achat À TRAITER d'un même fournisseur en une seule ───
// Une DA « unique par fournisseur » : on fusionne les articles dans la plus ancienne, on
// masque les autres (statut 'regroupee' + visible=false). Sans migration (pas de CHECK sur le statut).
app.post('/api/achats/da/regrouper', async (c) => {
  const das = await getDemandesAchat().catch(() => [] as any[])
  const isTrait = (s: string) => {
    const v = (s || '').toLowerCase().trim()
    if (v === '' || v.startsWith('a_traiter') || v === 'nouveau' || v === 'en_attente' || v === 'brouillon') return false
    return /(command|envoy|re[çc]u|recu|clotur|cl[oô]tur|trait[eé]|solde|bc)/i.test(v)
  }
  const aTraiter = (das as any[]).filter((d: any) => !isTrait(d.statut) && d.statut !== 'regroupee' && (d.fournisseur_id || (d.fournisseur || '').trim()))
  const groups = new Map<string, any[]>()
  for (const d of aTraiter) {
    const key = String(d.fournisseur_id || (d.fournisseur || '').trim().toLowerCase())
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  }
  const prioRank: Record<string, number> = { critique: 3, urgent: 2, normal: 1 }
  let fusions = 0, absorbees = 0
  for (const arr of groups.values()) {
    if (arr.length < 2) continue
    arr.sort((a, b) => String(a.date_da || a.created_at || '').localeCompare(String(b.date_da || b.created_at || '')))
    const primary = arr[0], others = arr.slice(1)
    const mergedArticle = arr.map((d: any) => (d.article || '—') + (d.qte ? ' (' + d.qte + ')' : '')).join(' · ')
    const bestPrio = arr.map((d: any) => d.priorite || 'normal').sort((a, b) => (prioRank[b] || 0) - (prioRank[a] || 0))[0]
    await updateDemandeAchat(primary.id, { article: mergedArticle, priorite: bestPrio, statut: 'a_traiter' }).catch(() => {})
    for (const o of others) { await updateDemandeAchat(o.id, { statut: 'regroupee', visible: false }).catch(() => {}); absorbees++ }
    fusions++
  }
  return c.json({ ok: true, fusions, absorbees })
})

// ─── Création directe d'un Bon de Commande par les Achats (sans DA préalable) ───
// Les achats créent des BC directement ; ils apparaissent dans la liste BC des Expéditions (statut 'envoye').
app.post('/api/achats/bc', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const fournisseurNom = (body.fournisseur || '').trim()
  if (!fournisseurNom) return c.json({ ok: false, error: 'Fournisseur / sous-traitant requis' }, 400)
  const bcs = await getBonsDeCommande().catch(() => [] as any[])
  const bcId = nextAffaireId('BC', body.affaire_id || prochaineRefLibre(bcs as any[]), (bcs as any[]).map(b => b.id))
  const isST = (body.type_bc || 'fournisseur') === 'st'
  const articles = (body.articles || '—')
  const montant = Number(body.montant_ht ?? body.montant ?? 0) || 0
  const bcPayload: any = {
    id: bcId, num_bc: bcId,
    type_bc: isST ? 'sous_traitant' : 'fournisseur',
    fournisseur_nom: fournisseurNom,
    articles,
    demande_achat_id: null,
    affaire_id: await resolveAffaireId(body.affaire_id),
    montant_ht: montant, devise: 'EUR',
    qte_commandee: Number(body.qte) || null,   // base de la réception TOTALE (recu_total)
    date_bc: TODAY_ISO(),
    date_livraison: body.date_livraison || null,
    statut: 'envoye',
    notes: body.notes || null,
    lignes: (Array.isArray(body.lignes_detail) && body.lignes_detail.length) ? body.lignes_detail : [{ article: articles, qte: body.qte || null, fournisseur: fournisseurNom }],
    // Routage OPEX (Phase E) : si un achat machine est saisi directement (catégorie 'machine' + machine_id), on route
    //   comme via la DA opérateur → la réception greffera le prix sur l'OPEX de la machine. Écrit seulement si fourni.
    ...(['machine', 'matiere', 'accessoire'].includes(String(body.categorie)) ? { categorie: String(body.categorie) } : {}),
    ...(body.machine_id ? { machine_id: String(body.machine_id) } : {}),
    ...(body.poste_id ? { poste_id: String(body.poste_id) } : {}),
  }
  const { data: bc, error } = await createBonDeCommande(bcPayload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // ⚠️ Un BC est une EXÉCUTION : il enregistre ce qui a été commandé (lignes ci-dessus) mais
  // n'écrit JAMAIS le prix officiel fournisseur. Source de vérité des prix = réponses RFQ (demandes_prix).
  return c.json({ ok: true, bc, bc_id: bcId, type_bc: isST ? 'st' : 'fournisseur' })
})

// ─── Soumission d'une DA → création du Bon de Commande (fournisseur ou ST) ───
app.post('/api/achats/da/:id/soumettre', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const da = await getDemandeAchat(id)
  if (!da) return c.json({ ok: false, error: 'DA introuvable' }, 404)
  const bcs = await getBonsDeCommande().catch(() => [] as any[])
  const _affBc = String(body.affaire_id || '').trim() || (da as any).num_affaire || (da as any).affaire_id || prochaineRefLibre(bcs as any[])
  const bcId = nextAffaireId('BC', _affBc, (bcs as any[]).map(b => b.id))
  const isST = (body.type_bc || da.type_bc || 'fournisseur') === 'st'
  const typeBc = isST ? 'sous_traitant' : 'fournisseur'  // valeurs contraintes en DB
  const articles = body.articles || da.article || '—'
  // Référence catalogue choisie par l'acheteur dans le formulaire. La DA n'en porte pas :
  // c'est au moment de commander qu'elle est arrêtée.
  const refArticle = String(body.reference || '').trim() || null
  // Demandes absorbées par une fusion : chacune devient une ligne du bon de commande.
  const _srcFusion = fusionDe(da)
  const montant = Number(body.montant_ht ?? body.montant ?? 0) || 0
  const fournisseurNom = body.fournisseur || da.fournisseur || null
  const bcPayload: any = {
    id: bcId,
    num_bc: bcId,
    type_bc: typeBc,
    fournisseur_nom: fournisseurNom,
    articles,
    demande_achat_id: id,
    affaire_id: await resolveAffaireId(da.affaire_id || body.affaire_id),
    // Le formulaire peut rattacher une demande LIBRE à une vraie affaire : la valeur saisie
    // prime sur celle héritée de la DA. Porte de « matière reçue » côté production.
    num_affaire: String(body.affaire_id || '').trim() || (da as any).num_affaire || null,
    cmd_ref: (da as any).cmd_ref || null,
    montant_ht: montant,
    devise: 'EUR',
    // La quantité SAISIE dans le formulaire fait foi : l'acheteur peut commander plus que le
    // besoin exprimé (lot minimum, conditionnement, réappro). À défaut, on retombe sur la
    // demande — ou sur la somme des demandes réunies par une fusion.
    qte_commandee: (Number(body.qte) || (_srcFusion.length
      ? _srcFusion.reduce((s: number, x: any) => s + (Number(x.qte) || 0), 0) || null
      : Number((da as any).qte) || null)),   // base de la réception TOTALE (recu_total)
    date_bc: TODAY_ISO(),
    date_livraison: body.date_livraison || da.livraison || null,
    conditions_paiement: body.conditions_paiement || null,
    // Proforma : on paie AVANT que le fournisseur expedie. Le BC reste donc hors de la
    // liste « receptions a venir » (statut absent de _bcEmise) jusqu'a l'encaissement.
    statut: estProforma(body.conditions_paiement) ? 'attente_paiement' : 'envoye',
    notes: body.notes || null,
    // `article` est CONSERVÉ : d'autres lecteurs de `lignes` (bcsView, BC de sous-traitance)
    // ne connaissent que cette clé. La référence s'ajoute, elle ne remplace rien — et c'est elle
    // qui part sur le PDF du fournisseur et sert de clé d'entrée en stock à la réception.
    // Une ligne par demande fusionnée, chacune portant SON affaire : c'est ainsi que le bon
    // de commande sert plusieurs affaires sans jamais rendre `num_affaire` composite.
    lignes: _srcFusion.length
      ? _srcFusion.map((s: any) => ({ article: s.article || articles, reference: s.id === da.id ? refArticle : null,
          designation: s.article || articles, qte: s.qte || null, fournisseur: fournisseurNom,
          num_affaire: s.num_affaire || null, da_id: s.id }))
      : [{ article: articles, reference: refArticle, designation: articles, qte: da.qte || body.qte || null, fournisseur: fournisseurNom, num_affaire: String((da as any).num_affaire || '').trim() || null }],
    // Hérité de la DA → route le prix à la réception (BC 'machine' → OPEX de la machine)
    categorie: (da as any).categorie || null,
    machine_id: (da as any).machine_id || null,
    poste_id: (da as any).poste_id || null,
  }
  const { data: bc, error } = await createBonDeCommande(bcPayload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Proforma : la facture a regler part immediatement en Comptabilite.
  let factureProforma: any = null
  if (estProforma(body.conditions_paiement)) {
    factureProforma = await creerFactureFournisseurProforma(bcId, fournisseurNom, montant, isST, String((bc as any)?.num_bc || bcId)).catch(() => null)
  }
  await updateDemandeAchat(id, { statut: 'traitee', type_bc: isST ? 'st' : 'fournisseur', bc_draft: null }).catch(() => {})
  return c.json({ ok: true, facture_proforma: factureProforma ? factureProforma.num_facture : null, bc, bc_id: bcId, type_bc: isST ? 'st' : 'fournisseur' })
})

// ─── Réception d'un BC : crée le BL interne (num d'affaire, transporteur, réf) ───
// Signataire FIABLE d'une action self-service : PIN opérateur si fourni (borne partagée),
// sinon l'utilisateur de session. On n'utilise JAMAIS un nom en texte libre du corps (anti-usurpation, EN9100).
async function resolveSigner(c: any, body: any, fallback: string): Promise<string> {
  if (body && body.matricule && body.pin) {
    const op = await verifyOperateurPin(String(body.matricule), String(body.pin))
    if (op) return (`${op.prenom || ''} ${op.nom || ''}`).trim() || String(op.matricule)
  }
  const u = (c as any).get('user')
  return (u && u.nom) ? String(u.nom) : fallback
}

// ══════════════════════════════════════════════════════════════
// VERROUS D'ÉDITION (verrouillage pessimiste générique + réutilisable)
//   resource = clé de la chose éditée (ex. "nomenclature:CODE:INDICE").
//   holder_id = id stable du poste (sessionStorage côté client).
//   Un verrou périmé (>60 s sans battement) peut être repris.
// ══════════════════════════════════════════════════════════════
const LOCK_STALE_MS = 60000
app.post('/api/locks/acquire', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const resource = String(b.resource || '').trim()
  const holderId = String(b.holder_id || '').trim()
  if (!resource || !holderId) return c.json({ ok: false, error: 'resource + holder_id requis' }, 400)
  const label = await resolveSigner(c, b, String(b.holder_label || 'un autre poste'))
  const existing = await getEditLock(resource).catch(() => null)
  const now = Date.now()
  if (existing && String(existing.holder_id) !== holderId) {
    const hb = existing.heartbeat_at ? Date.parse(existing.heartbeat_at) : 0
    if (isFinite(hb) && (now - hb) < LOCK_STALE_MS) {
      return c.json({ ok: true, acquired: false, holder_label: existing.holder_label || 'un autre utilisateur', since: existing.acquired_at })
    }
  }
  const nowIso = new Date().toISOString()
  const payload: Record<string, any> = { resource, holder_id: holderId, holder_label: label, heartbeat_at: nowIso }
  if (!existing || String(existing.holder_id) !== holderId) payload.acquired_at = nowIso
  await upsertEditLock(payload).catch(() => {})
  return c.json({ ok: true, acquired: true })
})
app.post('/api/locks/heartbeat', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const resource = String(b.resource || '').trim()
  const holderId = String(b.holder_id || '').trim()
  if (!resource || !holderId) return c.json({ ok: false }, 400)
  const existing = await getEditLock(resource).catch(() => null)
  if (existing && String(existing.holder_id) === holderId) {
    await upsertEditLock({ resource, holder_id: holderId, holder_label: existing.holder_label, heartbeat_at: new Date().toISOString() }).catch(() => {})
    return c.json({ ok: true, held: true })
  }
  return c.json({ ok: true, held: false, holder_label: existing ? existing.holder_label : null })
})
app.post('/api/locks/release', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const resource = String(b.resource || '').trim()
  const holderId = String(b.holder_id || '').trim()
  if (!resource) return c.json({ ok: false }, 400)
  const existing = await getEditLock(resource).catch(() => null)
  if (existing && (!holderId || String(existing.holder_id) === holderId)) await deleteEditLock(resource).catch(() => {})
  return c.json({ ok: true })
})
app.get('/api/locks/status', async (c) => {
  const locks = await getActiveEditLocks().catch(() => [] as any[])
  const now = Date.now()
  const active = (locks as any[])
    .filter((l) => { const hb = l.heartbeat_at ? Date.parse(l.heartbeat_at) : 0; return isFinite(hb) && (now - hb) < LOCK_STALE_MS })
    .map((l) => ({ resource: l.resource, holder_label: l.holder_label }))
  return c.json({ ok: true, locks: active })
})

// Signature des nomenclatures (temps réel par polling : la liste BE se rafraîchit quand ça change)
app.get('/api/be/noms-signature', async (c) => {
  const noms = await getNomenclatures().catch(() => [] as any[])
  let maxU = ''; let valide = 0
  for (const n of noms as any[]) { const u = String(n.updated_at || n.created_at || ''); if (u > maxU) maxU = u; if (n.statut === 'valide') valide++ }
  return c.json({ ok: true, sig: (noms as any[]).length + ':' + valide + ':' + maxU })
})

app.post('/api/expeditions/bc/:id/receptionner', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const bc = await getBonDeCommande(id)
  if (!bc) return c.json({ ok: false, error: 'BC introuvable' }, 404)
  const bls = await getBonsDeLivraison().catch(() => [] as any[])
  const blId = (body.num_bl && String(body.num_bl).trim())
    ? String(body.num_bl).trim()
    : nextBlPourBc((bc as any).num_bc || (bc as any).id, body.affaire_id || (bc as any).num_affaire || (bc as any).affaire_id, (bls as any[]).map(b => b.id))
  const affaireRaw = body.affaire_id || bc.affaire_id || null
  const affaireId = await resolveAffaireId(affaireRaw)
  const blPayload: any = {
    id: blId,
    type_bl: 'reception',
    bc_id: id,
    affaire_id: affaireId,
    cmd_id: null,  // BL de réception fournisseur : pas de FK commande client
    client_nom: bc.fournisseur_nom || null,
    date_bl: TODAY_ISO(),
    qte: Number(body.qte ?? 0) || 0,
    statut: 'recu',
    transport: body.transporteur || null,
    transporteur_ref: body.transporteur_ref || null,
    piece: bc.articles || null,
    operation: affaireRaw && !affaireId ? ('Réf. affaire ' + affaireRaw) : null,
  }
  const { error: blErr } = await createBonDeLivraison(blPayload)
  if (blErr) return c.json({ ok: false, error: blErr.message }, 400)
  // Phase E — greffe achat machine : un BC 'machine' reçu incrémente l'OPEX annuel de la machine (année civile)
  //   → remonte au taux du POSTE de la machine → CRU des pièces usinées dessus. IDEMPOTENT via un marqueur ATOMIQUE
  //   (claimBcOpexGreffe : UPDATE ... WHERE opex_greffe is not true) qui empêche le double-comptage sur double-clic
  //   ou ré-réception. Repli pré-migration (colonne absente) : garde bl_id (première réception).
  let opexGreffe: { machine_id: string; montant: number; annee: number } | null = null
  if (String((bc as any).categorie || '') === 'machine' && (bc as any).machine_id) {
    const montantAchat = Number((bc as any).montant_ht) || 0
    if (montantAchat > 0) {
      const claim = await claimBcOpexGreffe(id).catch(() => null)   // true=réclamé · false=déjà fait · null=pré-migration
      const doGreffe = claim === true || (claim === null && !bc.bl_id)
      if (doGreffe) {
        const annee = Number(TODAY_ISO().slice(0, 4))
        const { error: opxErr } = await upsertMachineOpexAchat(String((bc as any).machine_id), annee, montantAchat).catch(() => ({ error: true } as any))
        if (!opxErr) opexGreffe = { machine_id: String((bc as any).machine_id), montant: montantAchat, annee }
      }
    }
  }
  // ── RÉCEPTION MATIÈRE → STOCK (entrée) : sans ça prix_achat/quantité restent à 0 → coût matière faux.
  //   BC 'machine' exclu (va à l'OPEX). Idempotent par bc_id (pas de double crédit sur double-clic/ré-réception).
  if (String((bc as any).categorie || '') !== 'machine') {
    try {
      const qteBl = Number(body.qte ?? (bc as any).qte_commandee ?? 0) || 0
      if (qteBl > 0) {
        const [stockRows, mvtsRows] = await Promise.all([getStockReel().catch(() => [] as any[]), getMouvementsStock().catch(() => [] as any[])])
        // La référence portée par la ligne du BC prime sur le libellé libre : sans elle,
        // l'appariement au stock retombait sur `articles` et ratait dès que le libellé différait.
        // (`ref_stock` n'existe pas en base — lecture conservée par prudence, elle vaut undefined.)
        const _lgBc = Array.isArray((bc as any).lignes) ? (bc as any).lignes : []
        const _refLigne = _lgBc.length ? String((_lgBc[0] as any).reference || '').trim() : ''
        const refBc = String((bc as any).ref_stock || _refLigne || (bc as any).articles || '').toLowerCase().trim()
        const art = (stockRows as any[]).find(s => refBc && String((s as any).reference || '').toLowerCase().trim() === refBc)
          || (stockRows as any[]).find(s => refBc && String((s as any).designation || '').toLowerCase().trim() === refBc)
          || (stockRows as any[]).find(s => refBc && String((s as any).designation || '').toLowerCase().includes(refBc))
        // Idempotence par BL (chaque réception = un BL) : les réceptions partielles successives créditent chacune leur qté ;
        //   seul un REJEU du même BL (même num_bl) est neutralisé (anti double-clic).
        const motifEntree = 'Réception BC ' + id + ' · BL ' + blId
        const dejaEntree = (mvtsRows as any[]).some(m => String((m as any).motif || '') === motifEntree && String((m as any).type || '') === 'entree')
        if (art && !dejaEntree) {
          const avant = Number((art as any).stock_actuel) || 0
          await createMouvementStock({ type: 'entree', article_id: (art as any).id, article_nom: (art as any).designation || (art as any).reference, quantite: qteBl, quantite_avant: avant, quantite_apres: avant + qteBl, date_mvt: TODAY_ISO(), motif: motifEntree, categorie: (bc as any).categorie || 'matiere', bc_id: id } as any).catch(() => {})
          await updateStockArticle(String((art as any).id), { stock_actuel: avant + qteBl }).catch(() => {})
        }
      }
    } catch {}
  }
  // Réception TOTALE requise : cumul reçu vs commandé → recu_total (sinon recu_partiel). Qté commandée inconnue ⇒ recu_total (compat).
  const qteCmd = Number((bc as any).qte_commandee ?? (bc as any).qte ?? 0) || 0
  const qteRecueCumul = (Number((bc as any).qte_recue) || 0) + (Number(body.qte) || 0)
  const statutBc = (qteCmd > 0) ? (qteRecueCumul >= qteCmd ? 'recu_total' : 'recu_partiel') : 'recu_total'
  await updateBonDeCommande(id, {
    statut: statutBc, qte_recue: qteRecueCumul, bl_id: blId,
    transporteur: body.transporteur || null, transporteur_ref: body.transporteur_ref || null,
  }).catch(() => {})
  // Date d'arrivée RÉELLE (1ʳᵉ réception) → planning + OTD. Update SÉPARÉ & fail-soft :
  //   si la colonne n'existe pas encore (pré-migration cloud), l'échec est ignoré sans casser la réception.
  if (!(bc as any).date_reception_reelle) await updateBonDeCommande(id, { date_reception_reelle: TODAY_ISO() } as any).catch(() => {})
  // PORTE MATIÈRE : matiere_ok des BDT de l'affaire cochée SEULEMENT quand TOUS les BC matière/accessoire
  //   de l'affaire sont reçus en TOTALITÉ (recu_total) — plus au premier partiel.
  let bdtDebloques = 0
  // Un BC issu d'une FUSION sert plusieurs affaires : on ouvre la porte matière de chacune.
  const affairesBc = bcAffaires(bc)
  if (affairesBc.length) {
    try {
      const estMatBc = (b: any) => String((b as any).type_bc || '') !== 'sous_traitant' && !/machine/i.test(String((b as any).categorie || ''))
      const estTotal = (b: any) => ['recu_total', 'controle', 'cloture'].includes(String((b as any).statut || ''))
      const [allBcs, bdts] = await Promise.all([getBonsDeCommande().catch(() => [] as any[]), getBonsDeTravail().catch(() => [] as any[])])
      for (const aff of affairesBc) {
        const affMatBcs = (allBcs as any[]).filter(b => bcAffaires(b).includes(aff) && estMatBc(b))
        const allTotal = affMatBcs.length > 0 && affMatBcs.every(b => String(b.id) === id ? statutBc === 'recu_total' : estTotal(b))
        if (!allTotal) continue
        for (const b of (bdts as any[])) {
          if (String(b.num_affaire) === aff && b.matiere_ok !== true) { await updateBDT(String(b.id), { matiere_ok: true }).catch(() => {}); bdtDebloques++ }
        }
      }
    } catch {}
  }
  return c.json({ ok: true, bl_id: blId, opex_greffe: opexGreffe, bdt_debloques: bdtDebloques })
})

// ─── RÉCEPTION D'UN RETOUR CLIENT (annoncé par la Qualité sur une non-conformité) ───
// Flux métier : la Qualité déclare la NC client en cochant « retour de marchandise prévu »
// et en indiquant la commande client. Les Expéditions enregistrent ensuite l'ARRIVÉE
// physique : on crée un BL de type 'retour_client' rattaché à cette commande, et on marque
// le retour comme reçu sur la NC (traçabilité dans les deux sens via bl_retour_id / nc_id).
app.post('/api/expeditions/retour-client/:ncId/receptionner', async (c) => {
  const ncId = c.req.param('ncId')
  const body = await c.req.json().catch(() => ({} as any))
  const ncs = await getNonConformites().catch(() => [] as any[])
  const nc = (ncs as any[]).find((n: any) => String(n.id) === String(ncId))
  if (!nc) return c.json({ ok: false, error: 'Non-conformité introuvable' }, 404)
  if ((nc as any).retour_statut === 'recu') return c.json({ ok: false, error: 'Retour déjà réceptionné' }, 409)

  const bls = await getBonsDeLivraison().catch(() => [] as any[])
  const blId = (body.num_bl && String(body.num_bl).trim()) ? String(body.num_bl).trim()
    : nextAffaireId('BL', (nc as any).num_affaire || (nc as any).n_commande || body.cmd_id, (bls as any[]).map(b => b.id))
  // Rattachement à la commande client : n° saisi, sinon celui porté par la NC.
  const cmdRef = String(body.cmd_id || (nc as any).n_commande || '').trim() || null
  const cmds = await getCommandes().catch(() => [] as any[])
  const cmd = cmdRef ? (cmds as any[]).find((x: any) => String(x.id) === cmdRef || String(x.num_affaire) === cmdRef) : null

  const { error: blErr } = await createBonDeLivraison({
    // ⚠ La base de production contraint type_bl à ('client','reception','bst') : un retour
    //   client est enregistré comme une RÉCEPTION (c'en est une), et distingué par `nc_id`
    //   — évite une migration DDL supplémentaire sur la contrainte.
    id: blId, type_bl: 'reception', nc_id: ncId,
    cmd_id: cmd ? cmd.id : null,
    client_nom: (nc as any).client_nom || null,
    date_bl: TODAY_ISO(),
    qte: Number(body.qte ?? (nc as any).qte_retour_attendue ?? (nc as any).nb_pieces ?? 0) || 0,
    statut: 'recu',
    transport: body.transporteur || null,
    transporteur_ref: body.transporteur_ref || null,
    piece: [(nc as any).ref_article, (nc as any).designation].filter(Boolean).join(' · ') || (nc as any).lot_ref || null,
    lot_id: (nc as any).lot_ref || null,
    operation: 'Retour client — NC ' + ncId,
  } as any)
  if (blErr) return c.json({ ok: false, error: blErr.message }, 400)
  // Lien NC → BL (fail-soft : sans la migration nc_retour_client_attendu.sql, le BL est
  // quand même créé et visible ; seul le marquage « reçu » côté NC est perdu).
  await updateNonConformite(ncId, {
    retour_statut: 'recu', bl_retour_id: blId, date_retour_reelle: TODAY_ISO(),
  } as any).catch(() => {})
  return c.json({ ok: true, bl_id: blId, cmd_id: cmd ? cmd.id : null })
})

// ─── Changer la date d'arrivée PRÉVUE d'un BC (planning) en GARDANT la 1ʳᵉ date pour l'OTD ───
// DEUX portes d'entree, volontairement, parce que ce sont DEUX METIERS :
//   · /api/expeditions/... : la reception corrige la date quand le colis glisse ;
//   · /api/bc/...          : l'ACHETEUR la corrige depuis sa liste de bons de commande.
// Ce n'est pas cosmetique : `serviceFor()` deduit le service du 1er segment apres /api/.
// Le role « achats » n'a que la LECTURE sur `expeditions` (ROLE_MATRIX, src/auth.ts) — il
// aurait pris un 403 sec sur la premiere route. La famille `bc` est deja mappee sur `achats`.
// La marchandise est-elle arrivee ? Trois signaux, dont un seul suffit : la date de
// reception reelle, un bon de livraison rattache, ou un statut de la famille « recu ».
// On est volontairement LARGE : rater un signal rouvrirait le verrou ci-dessous.
export const bcDejaRecu = (bc: any): boolean =>
  !!bc?.date_reception_reelle ||
  !!bc?.bl_id ||
  ['recu', 'recu_total', 'recu_partiel', 'receptionne', 'controle', 'cloture'].includes(String(bc?.statut || ''))

const majDateArriveeBc = async (c: any) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const nouvelle = body.date ? String(body.date).slice(0, 10) : null
  if (!nouvelle) return c.json({ ok: false, error: 'Date manquante' }, 400)
  const bc = await getBonDeCommande(id)
  if (!bc) return c.json({ ok: false, error: 'BC introuvable' }, 404)
  // ⚠ VERROU APRES RECEPTION. Une fois la marchandise arrivee, la date PREVUE n'est plus
  //   une prevision : c'est une promesse dont on connait deja le resultat. La reecrire
  //   permettrait de rattraper apres coup un retard fournisseur — precisement ce que l'OTD
  //   mesure. Le verrou vit ICI, pas seulement dans l'ecran : les boutons se contournent.
  // ⚠ DEUX MOTIFS DE GEL, dans cet ordre de survenue :
  //   1. le fournisseur a VALIDE la commande : la date est son engagement, la rouvrir
  //      effacerait ce sur quoi il s'est engage ;
  //   2. la marchandise est ARRIVEE : le resultat est connu, la reecrire maquillerait
  //      un retard — c'est precisement ce que l'OTD mesure.
  if ((bc as any).accuse_fournisseur_le) {
    return c.json({
      ok: false,
      error: 'La commande ' + ((bc as any).num_bc || id) + ' a ete validee par le fournisseur le '
        + String((bc as any).accuse_fournisseur_le).slice(0, 10)
        + ' : la date d\'arrivee prevue est figee. C\'est l\'engagement du fournisseur — elle ne se corrige plus.',
    }, 409)
  }
  if (bcDejaRecu(bc)) {
    return c.json({
      ok: false,
      error: 'La commande ' + ((bc as any).num_bc || id) + ' est deja receptionnee'
        + ((bc as any).date_reception_reelle ? ' (arrivee le ' + String((bc as any).date_reception_reelle).slice(0, 10) + ')' : '')
        + ' : la date d\'arrivee prevue est figee. Elle sert a mesurer la ponctualite du fournisseur et ne se corrige plus une fois la marchandise arrivee.',
    }, 409)
  }
  const ancienne = (bc as any).date_livraison ? String((bc as any).date_livraison).slice(0, 10) : null
  // GEL de la 1ʳᵉ date prévue : si date_livraison_initiale est vide, on y fige l'ANCIENNE date
  //   (celle d'avant ce changement) → l'OTD reste calculé sur la promesse d'origine, jamais repoussée.
  const patch: any = { date_livraison: nouvelle }
  if (!(bc as any).date_livraison_initiale && ancienne) patch.date_livraison_initiale = ancienne
  // Fail-soft : colonne date_livraison_initiale absente (pré-migration) → repli sur la seule date affichée.
  let { error } = await updateBonDeCommande(id, patch)
  if (error && patch.date_livraison_initiale) { ({ error } = await updateBonDeCommande(id, { date_livraison: nouvelle })) }
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, date_livraison: nouvelle, date_livraison_initiale: patch.date_livraison_initiale || (bc as any).date_livraison_initiale || null })
}
app.post('/api/expeditions/bc/:id/date-arrivee', majDateArriveeBc)   // reception
app.post('/api/bc/:id/date-arrivee', majDateArriveeBc)               // achats

// ─── PV de contrôle réception : OK → Qualité (libéré) ; anomalie → NC (+ quarantaine) ───
app.post('/api/expeditions/bc/:id/pv', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const bc = await getBonDeCommande(id)
  if (!bc) return c.json({ ok: false, error: 'BC introuvable' }, 404)
  const anomalie = !!body.anomalie
  const pvs = await getPVControles().catch(() => [] as any[])
  const numPv = nextSeqId('PV', (pvs as any[]).map(p => p.num_pv))
  const controleur = await resolveSigner(c, body, 'Expéditions')
  const obs = [controleur ? `Contrôleur : ${controleur}` : '', body.observations || ''].filter(Boolean).join(' — ') || null
  const pvPayload: any = {
    num_pv: numPv,
    date_pv: TODAY_ISO(),
    operateur_id: null,  // FK salaries : on garde le nom du contrôleur dans les observations
    type_controle: 'reception',
    type_lien: 'livraison',
    bl_id: bc.bl_id || null,
    bc_id: id,
    piece: bc.articles || null,
    client_nom: bc.fournisseur_nom || null,
    fournisseur: bc.fournisseur_nom || null,
    statut: anomalie ? 'nc_ouverte' : 'valide',
    decision: anomalie ? 'bloque' : 'libere',
    observations: obs,
    anomalie,
    nc_ouverte: anomalie,
  }
  const { data: pv, error } = await createPVControle(pvPayload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  let ncId: string | null = null
  let quarantaineId: string | null = null
  if (anomalie) {
    const ncs = await getNCs().catch(() => [] as any[])
    ncId = nextSeqId('NC', (ncs as any[]).map(n => n.id))
    await createNonConformiteRow({
      id: ncId,
      date_nc: TODAY_ISO(),
      type_nc: 'reception fournisseur',
      gravite: body.gravite || 'Majeure',
      statut: 'ouverte',
      lot_ref: bc.bl_id || bc.articles || null,
      client_nom: bc.fournisseur_nom || null,
      operation: 'Contrôle réception',
      detecteur: controleur,
      affaire_id: bc.affaire_id || null,
    }).catch(() => {})
    if (body.quarantaine) {
      const { data: q } = await createQuarantaine({
        lot_id: bc.bl_id || null,
        piece: bc.articles || null,
        client_nom: bc.fournisseur_nom || null,
        date_mise_quarantaine: TODAY_ISO(),
        motif: body.observations || 'Anomalie au contrôle réception',
        pv_id: numPv,
        nc_id: ncId,
        statut: 'en_cours',
      } as any).catch(() => ({ data: null } as any))
      quarantaineId = (q as any)?.id || null
    }
  }
  await updateBonDeCommande(id, { statut: 'recu', pv_id: numPv }).catch(() => {})  // contrôlé, PV parti en Qualité
  return c.json({ ok: true, pv_id: numPv, nc_id: ncId, quarantaine_id: quarantaineId, anomalie })
})

// ─── API : BL client partiel (lots cochés + qté) → décrément lots + facture partielle ───
app.post('/api/expeditions/bl-partiel', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const cmdId = b.cmd_id || b.num_affaire
  const lignes: any[] = Array.isArray(b.lignes) ? b.lignes.filter((l: any) => l && l.lot_id && Number(l.qte) > 0) : []
  if (!cmdId) return c.json({ ok: false, error: 'Commande requise' }, 400)
  if (lignes.length === 0) return c.json({ ok: false, error: 'Sélectionnez au moins un lot avec une quantité' }, 400)
  const [cmds, lots, bls, ncs, quar] = await Promise.all([
    getCommandes().catch(() => []), getLots().catch(() => []), getBonsDeLivraison().catch(() => []),
    getNonConformites().catch(() => [] as any[]), getQuarantaines().catch(() => [] as any[]),
  ])
  const cmd = (cmds as any[]).find(x => String(x.id) === String(cmdId) || String(x.num_affaire) === String(cmdId))
  // ── Porte qualité : refus d'expédier tant qu'une NC bloquante ou une quarantaine est active sur l'affaire (dérogation via b.force=true). ──
  if (cmd && b.force !== true) {
    const aff = String(cmd.num_affaire || cmd.id)
    // NC bloque ssi gravité bloquante (Critique/Bloquante) ET rattachée à l'affaire (affaire_id→num_affaire→lot_ref) ET non close.
    const ncB = (ncs as any[]).find(n => !ncEstClose(n.statut) && ncEstBloquante(n.gravite) && ncRattacheeAffaire(n, cmd))
    if (ncB) return c.json({ ok: false, bloque: 'nc', error: 'Expédition bloquée : NC ' + (ncB.id || '') + ' (' + (ncB.gravite || '') + ') ouverte sur cette affaire. Libérez la qualité ou expédiez sous dérogation.' }, 409)
    const lotIdsCmd = new Set((lots as any[]).filter(l => String(l.cmd_id) === String(cmd.id) || String(l.id || '').indexOf(aff) !== -1).map(l => String(l.id)))
    const qB = (quar as any[]).find(q => !ncEstClose(q.statut) && (lotIdsCmd.has(String(q.lot_id)) || String(q.lot_id || '').indexOf(aff) !== -1))
    if (qB) return c.json({ ok: false, bloque: 'quarantaine', error: 'Expédition bloquée : quarantaine ' + (qB.id || '') + ' active sur cette affaire. Libérez ou expédiez sous dérogation.' }, 409)
  }
  const clientNom = b.client_nom || cmd?.client_nom || null
  const numAffaire = cmd?.num_affaire || b.num_affaire || null
  const today = new Date().toISOString().slice(0, 10)

  // Calcule les quantités (SANS écrire) — le décrément stock se fait APRÈS création du BL (cohérence).
  const detail: any[] = []
  let qteTotale = 0
  for (const l of lignes) {
    const lot = (lots as any[]).find((x: any) => String(x.id) === String(l.lot_id))
    const qte = Number(l.qte) || 0
    qteTotale += qte
    detail.push(lot
      ? { lot_id: lot.id, piece: lot.piece, qte, reste: Math.max(0, Number(lot.qte ?? 0) - qte) }
      : { lot_id: l.lot_id, qte, reste: null })
  }
  const warnings: string[] = []

  // 1) Crée le BL client (partiel) EN PREMIER : si échec, on abandonne AVANT de toucher au stock.
  const blId = nextAffaireId('BL', numAffaire, (bls as any[]).map((x: any) => x.id))
  const prixTransport = Number(b.prix_transport ?? 0) || 0
  const { error: blErr } = await createBonDeLivraison({
    id: blId, type_bl: 'client', cmd_id: (cmd ? cmd.id : null),
    affaire_id: await resolveAffaireId(numAffaire),
    client_nom: clientNom, date_bl: today, qte: qteTotale, statut: 'a_envoyer',
    transport: b.transporteur || null, prix_transport: prixTransport,
    lignes: detail, partiel: true, piece: detail.map(d => d.piece).filter(Boolean).join(', ') || null,
  } as any)
  if (blErr) return c.json({ ok: false, error: 'Échec de création du bon de livraison : ' + blErr.message }, 400)

  // 2) Décrémente chaque lot expédié (le BL existe : un échec devient un AVERTISSEMENT, pas un blocage).
  for (const d of detail) {
    if (d.reste == null) continue
    const { error } = await updateLot(d.lot_id, { qte: d.reste })
    if (error) warnings.push('Stock du lot ' + d.lot_id + ' non décrémenté (' + error.message + ')')
  }

  // Facture partielle automatique
  let factureId: string | null = null
  if (b.generer_facture !== false) {
    const factures = await getFacturesClient().catch(() => [])
    factureId = nextSeqId('FAC', (factures as any[]).map((x: any) => x.id))
    // Montant : fourni, sinon prorata du montant commande selon la quantité expédiée.
    // Bornes >= 0 : une facture/écriture de vente négative fausserait le CA et le grand livre.
    let montantHt = Math.max(0, Number(b.montant_ht ?? 0) || 0)
    if (!montantHt && cmd) {
      const cmdMontant = Number(cmd.montant ?? 0) || 0
      // ⚠ Dénominateur STABLE = qté commandée d'origine (Σ qte_initiale), JAMAIS le reste décrémenté à chaque BL
      //   (sinon sur-facturation cumulative : 2 BL de 50 sur un lot de 100 facturaient 1500 au lieu de 1000).
      const cmdQte = (lots as any[]).filter((x: any) => String(x.cmd_id) === String(cmd.id)).reduce((s: number, x: any) => s + (Number(x.qte_initiale ?? x.qte) || 0), 0)
      montantHt = (cmdMontant > 0 && cmdQte > 0) ? +(cmdMontant * (qteTotale / cmdQte)).toFixed(2) : 0
      // Plafond MONÉTAIRE (garde-fou) : Σ factures + celle-ci ≤ montant commande − avoir déjà consommé à l'acceptation.
      const avoir = Number((cmd as any).avoir_applique) || 0
      const facsCmd = await getFacturesClient().catch(() => [] as any[])
      const dejaFacture = (facsCmd as any[]).filter(f => String(f.cmd_id ?? '') === String(cmd.id) && String(f.statut ?? '') !== 'annulee').reduce((s: number, f: any) => s + Math.max(0, (Number(f.montant_ht) || 0) - (Number(f.prix_transport) || 0)), 0)
      const plafond = Math.max(0, cmdMontant - avoir - dejaFacture)
      if (montantHt > plafond) montantHt = +plafond.toFixed(2)
    }
    montantHt = +(montantHt + Math.max(0, prixTransport)).toFixed(2)
    const tvaPct = Math.min(100, Math.max(0, Number(b.tva_pct ?? 20) || 20))
    const tva = +(montantHt * tvaPct / 100).toFixed(2)
    const ttc = +(montantHt + tva).toFixed(2)
    const echeance = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    const { data: fac, error: facErr } = await createFactureClient({
      id: factureId, num_facture: factureId, client_nom: clientNom, num_affaire: numAffaire,
      cmd_id: (cmd ? cmd.id : null) as any, bl_id: blId as any,
      date_facture: today, date_echeance: echeance,
      montant_ht: montantHt, tva_pct: tvaPct, montant_tva: tva, montant_ttc: ttc,
      prix_transport: prixTransport, partielle: true, statut: 'envoyee',
      validation_hierarchique: !!b.validation_hierarchique,
      validation_statut: b.validation_hierarchique ? 'en_attente' : null,
      lignes: detail as any, notes: 'Livraison partielle ' + blId + (b.force === true ? ' · DÉROGATION qualité : ' + (b.derogation_motif || 'motif non précisé') : ''),
    } as any)
    if (facErr) { factureId = null; warnings.push('Facture non créée (' + facErr.message + ')') }
    else if (fac) {
      const { error: majErr } = await updateBonDeLivraison(blId, { facture_id: factureId } as any)
      if (majErr) warnings.push('Lien BL↔facture non enregistré (' + majErr.message + ')')
      try { await genEcritureVente(fac) } catch (e: any) { warnings.push('Écriture de vente non générée (' + (e?.message || e) + ')') }
    }
  }
  return c.json({ ok: true, bl_id: blId, facture_id: factureId, lignes: detail, qte_totale: qteTotale, ...(warnings.length ? { warnings } : {}) })
})

// ─── API : facture client (marquer payée / mettre à jour) ───
app.patch('/api/factures/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['statut', 'date_paiement', 'mode_paiement', 'notes', 'montant_ht', 'montant_ttc']) {
    if (k in b) patch[k] = b[k]
  }
  // Garde paiement : une facture soumise à validation hiérarchique ne peut passer « payée » sans décision Direction.
  const versPaye = ['payee', 'partiellement_payee'].includes(String(patch.statut || ''))
  const facCur = versPaye ? (await getFacturesClient().catch(() => [] as any[])).find((f: any) => String(f.id) === String(id)) : null
  if (versPaye && facCur && (facCur as any).validation_hierarchique === true && String((facCur as any).validation_statut || '') !== 'validee') {
    return c.json({ ok: false, error: 'Paiement en attente de validation Direction — impossible de marquer payée.' }, 409)
  }
  if (b.statut === 'payee' && !patch.date_paiement) patch.date_paiement = new Date().toISOString().slice(0, 10)
  patch.updated_at = new Date().toISOString()
  const { data, error } = await updateFactureClient(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Écriture de RÈGLEMENT (BQ) à l'encaissement → solde le 411 client au FEC. Idempotent (_ecrituresPour par pièce/journal).
  if (String(patch.statut || '') === 'payee' && data) { try { await genEcritureReglement(data) } catch {} }
  // PROFORMA : l'encaissement débloque ce qu'on avait volontairement retenu à l'acceptation
  // de l'offre — préparation technique et demandes d'achat. Tant que la facture n'est pas
  // réglée, aucune dépense n'est engagée sur l'affaire.
  let debloque: any = null
  if (String(patch.statut || '') === 'payee' && data) {
    try { debloque = await debloquerProforma(data) } catch {}
  }
  return c.json({ ok: true, facture: data, ...(debloque ? { proforma_debloque: debloque } : {}) })
})

// Rejoue la cascade d'engagement de dépense pour une facture proforma qui vient d'être réglée.
// Sans effet sur une facture ordinaire, ou si la cascade a déjà tourné pour cette affaire.
async function debloquerProforma(facture: any) {
  const cmdId = String(facture?.cmd_id || '')
  if (!cmdId) return null
  const cmds = await getCommandes().catch(() => [] as any[])
  const cmd = (cmds as any[]).find((x: any) => String(x.id) === cmdId)
  if (!cmd) return null
  const offres = await getOffres().catch(() => [] as any[])
  const off = (offres as any[]).find((o: any) => String(o.num_affaire || '') === String(cmd.num_affaire || '') && String(o.statut || '') === 'acceptee')
  if (!off || !estProforma(off.mode_reglement)) return null          // pas une affaire proforma
  if (await _cascadeDejaFaite(String(cmd.num_affaire || ''))) return null
  const dt = off.dt_ref ? await getDemandeTravaux(String(off.dt_ref)).catch(() => null) : null
  if (!dt) return null
  const byCode = _nomByCode(await getNomenclatures().catch(() => [] as any[]))
  const eng = await cascadeEngagementDepense(dt, cmdId, byCode)
  return { num_affaire: cmd.num_affaire || null, prepa: eng.prepa, da: eng.da }
}

// ─── API : validation hiérarchique du paiement d'une facture (Direction) ───
app.post('/api/factures/:id/valider-paiement', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const decision = b.decision === 'refuse' ? 'refusee' : 'validee'
  const { data, error } = await updateFactureClient(id, {
    validation_statut: decision,
    validation_par: b.valide_par || 'Direction',
    validation_le: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, facture: data })
})

// ─── API : factures fournisseurs / sous-traitants (alimentent la marge brute) ───
app.post('/api/factures-fournisseur', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.fournisseur_nom) return c.json({ ok: false, error: 'Nom fournisseur/ST requis' }, 400)
  const type = b.type === 'sous_traitant' ? 'sous_traitant' : 'fournisseur'
  const ht = Number(b.montant_ht) || 0
  const tva = b.tva_pct != null ? Number(b.tva_pct) : 20
  const tvaM = Math.round(ht * (tva / 100) * 100) / 100
  const ttc = Math.round((ht + tvaM) * 100) / 100
  const year = new Date().getFullYear()
  const existing = await getFacturesFournisseur().catch(() => []) as any[]
  let max = 0
  for (const r of existing) {
    const m = String(r.num_facture || '').match(/-(\d+)\s*$/)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  const seq = String(max + 1).padStart(4, '0')
  const payload: Record<string, any> = {
    id: `FF-${Date.now().toString(36).toUpperCase()}`,
    num_facture: b.num_facture || `${type === 'sous_traitant' ? 'ST' : 'FOURN'}-${year}-${seq}`,
    type,
    fournisseur_nom: String(b.fournisseur_nom).trim(),
    date_facture: b.date_facture || new Date().toISOString().slice(0, 10),
    date_echeance: b.date_echeance || null,
    montant_ht: ht,
    tva_pct: tva,
    montant_tva: tvaM,
    montant_ttc: ttc,
    statut: b.statut || 'a_valider',
    compte_charge: b.compte_charge || (type === 'sous_traitant' ? '604100 – Sous-traitance' : null),
    // La table n'a PAS de colonne bc_id : l'envoyer faisait echouer TOUTE creation de facture
    // fournisseur (PGRST204). Le rattachement au bon de commande passe donc par les notes,
    // ce qui fonctionne aussi bien sur la base cloud que sur la stack Docker, sans migration.
    notes: [b.bc_id ? 'BC ' + String(b.bc_id) : '', b.notes || ''].filter(Boolean).join(' — ') || null,
  }
  const { data, error } = await createFactureFournisseur(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  await genEcritureAchat(data).catch(() => {})   // écriture d'achat (ACH) auto-générée
  return c.json({ ok: true, data })
})

app.patch('/api/factures-fournisseur/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['statut', 'date_paiement', 'mode_paiement', 'notes', 'compte_charge', 'date_echeance']) {
    if (k in b) patch[k] = b[k]
  }
  if (b.statut === 'payee' && !patch.date_paiement) patch.date_paiement = new Date().toISOString().slice(0, 10)
  patch.updated_at = new Date().toISOString()
  // Garde d'état : le client peut annoncer le statut qu'il croyait voir. S'il ne
  // correspond plus, on refuse — la page était périmée (double-clic, deux onglets,
  // ou action déjà faite par quelqu'un d'autre). Évite une validation en double.
  if (b.attendu) {
    const avant = await getFactureFournisseur(id).catch(() => null)
    if (!avant) return c.json({ ok: false, error: 'Facture introuvable : ' + id }, 404)
    if (String((avant as any).statut || '') !== String(b.attendu)) {
      return c.json({ ok: false, error: 'La facture ' + ((avant as any).num_facture || id) + ' est deja « ' + String((avant as any).statut) + ' » : la page affichait un etat perime. Rechargez avant de recommencer.' }, 409)
    }
  }
  const { data, error } = await updateFactureFournisseur(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // PROFORMA : le règlement libère le bon de commande, qui rejoint alors les réceptions à venir.
  let bcLibere: string | null = null
  if (String(patch.statut || '') === 'payee' && data) {
    try { bcLibere = await libererBcProforma(data) } catch {}
  }
  return c.json({ ok: true, facture: data, ...(bcLibere ? { bc_libere: bcLibere } : {}) })
})

// Passe un BC « attente_paiement » en « envoye » quand sa facture proforma est réglée.
// Le rattachement se lit dans les notes (« BC <id> … ») ou dans l'identifiant FF-<id>.
async function libererBcProforma(facture: any): Promise<string | null> {
  const parId = String(facture?.id || '').startsWith('FF-') ? String(facture.id).slice(3) : ''
  const m = String(facture?.notes || '').match(/\bBC[ -]([A-Z0-9-]+)/i)
  const bcId = parId || (m ? m[1] : '')
  if (!bcId) return null
  const bcs = await getBonsDeCommande().catch(() => [] as any[])
  const bc = (bcs as any[]).find((x: any) => String(x.id) === bcId)
  if (!bc || String(bc.statut || '') !== 'attente_paiement') return null   // rien à libérer
  await updateBonDeCommande(bcId, { statut: 'envoye', updated_at: new Date().toISOString() } as any).catch(() => {})
  return bcId
}

// ─── Génération des DA depuis une commande validée (stock insuffisant) ───
//  besoins : [{ article, qte, unite?, fournisseur?, type_bc?, reference? }]
//  Si non fournis dans le body, on lit les besoins_achat de la DT liée (num_affaire).
app.post('/api/commandes/:id/generer-da', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const [cmds, dts, stock, das] = await Promise.all([
    getCommandes().catch(() => [] as any[]),
    getDemandesTravaux().catch(() => [] as any[]),
    getStockReel().catch(() => [] as any[]),
    getDemandesAchat().catch(() => [] as any[]),
  ])
  const cmd = (cmds as any[]).find(x => String(x.id) === id || String(x.num_affaire) === id || String(x.affaire_id) === id)
  const numAffaire = cmd?.num_affaire || cmd?.affaire_id || id
  // Besoins : body prioritaire, sinon besoins_achat de la DT de cette affaire
  let besoins: any[] = Array.isArray(body.besoins) ? body.besoins : []
  if (besoins.length === 0) {
    const dt = (dts as any[]).find(d => String(d.num_affaire) === String(numAffaire) || String(d.affaire_id) === String(numAffaire))
    if (dt && Array.isArray(dt.besoins_achat)) besoins = dt.besoins_achat
  }
  if (besoins.length === 0) return c.json({ ok: true, generated: [], skipped: [], message: 'Aucun besoin d\'achat renseigné pour cette affaire.' })

  // Index stock par référence + désignation (minuscule)
  const stockArr = stock as any[]
  const findStock = (b: any) => {
    const key = String(b.reference || b.article || '').toLowerCase().trim()
    if (!key) return null
    return stockArr.find(s =>
      String(s.reference || '').toLowerCase().trim() === key ||
      String(s.designation || '').toLowerCase().trim() === key ||
      String(s.designation || '').toLowerCase().includes(key)
    ) || null
  }

  const affaireFk = await resolveAffaireId(cmd?.affaire_id || numAffaire)
  const existingIds = (das as any[]).map(d => d.id)
  const generated: any[] = []
  const skipped: any[] = []
  let seq = 0
  for (const b of besoins) {
    const need = Number(b.qte ?? 0) || 0
    const st = findStock(b)
    const dispo = st ? Number(st.stock_actuel ?? 0) : 0
    if (st && dispo >= need && need > 0) {
      skipped.push({ article: b.article, raison: `stock suffisant (${dispo} dispo ≥ ${need})` })
      continue
    }
    const newId = nextSeqId('DA', [...existingIds, ...generated.map(g => g.id), `DA-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`])
    seq++
    const manque = need > 0 ? Math.max(need - dispo, need) : need
    const payload: any = {
      id: newId,
      demandeur: 'Auto (commande ' + numAffaire + ')',
      type_da: b.type_da || b.type_bc === 'st' ? 'Sous-traitance' : (b.type_da || 'Matière'),
      article: b.article || '—',
      fournisseur: b.fournisseur || null,
      qte: String((manque || need || '') + (b.unite ? ' ' + b.unite : '')).trim() || null,
      priorite: b.priorite || 'urgent',
      statut: 'a_traiter',
      date_da: TODAY_ISO(),
      livraison: b.livraison || cmd?.date_liv || null,
      affaire_id: affaireFk,
      type_bc: b.type_bc === 'st' ? 'st' : 'fournisseur',
      visible: true,
      genere_par_adt: true,
    }
    const { data, error } = await createDemandeAchat(payload)
    if (!error && data) { generated.push(data); existingIds.push(newId) }
  }
  return c.json({ ok: true, generated, skipped, num_affaire: numAffaire })
})

// ══════════════════════════════════════════════════════════════
// BUREAU D'ÉTUDES
// ══════════════════════════════════════════════════════════════
app.get('/be/service', async (c) => {
  const [dts, cmds, noms, refs, produits, prixHist, salaries, offres] = await Promise.all([
    getDemandesTravaux(), getCommandes(), getNomenclatures(), getBeRefs(),
    getProduitsFournisseursAll().catch(() => [] as any[]), getRefPrixHistoriqueAll().catch(() => [] as any[]),
    getSalariesActifs().catch(() => [] as any[]),
    getOffres().catch(() => [] as any[]),
  ])
  // Analystes BE = salariés dont le rôle donne l'accès BE en écriture (bei, direction)
  const BE_ROLES = new Set(['bei', 'direction'])
  const beUsers = (salaries as any[])
    .filter((s: any) => [s.role, ...(Array.isArray(s.roles) ? s.roles : [])].some((r: any) => BE_ROLES.has(String(r))))
    .map((s: any) => ({ id: s.id, prenom: s.prenom, nom: s.nom }))
  const lastDate: Record<string, string> = {}
  ;(prixHist as any[]).forEach((h: any) => { const k = h.reference; if (k && (!lastDate[k] || String(h.date_prix) > lastDate[k])) lastDate[k] = h.date_prix })
  // Catalogue commercial (produits_fournisseurs) — JAMAIS de quantité de stock ici (§5)
  const refsStock = (produits as any[]).map((p: any) => ({
    id: p.id, fournisseur_id: p.fournisseur_id,
    reference: p.reference, designation: p.designation, famille: p.categorie, categorie: '',
    activite: p.activite, fournisseur_nom: p.fournisseur_nom || '', prix: p.prix,
    derniere_date: lastDate[p.reference] || p.date_prix || null,
  }))
  const _preps = await getPreparationsTechniques().catch(() => [] as any[])
  return c.html(pageServiceBE(dts, cmds, noms, refs, refsStock, produits as any[], beUsers, offres as any[], _preps))
})

// — Prix courant d'une référence chez un fournisseur (rafraîchissement live nomenclature) —
app.get('/api/produit-prix', async (c) => {
  const fid = c.req.query('fournisseur') || ''
  const ref = c.req.query('reference') || ''
  if (!ref) return c.json({ ok: false, error: 'reference requise' }, 400)
  const list = fid ? await getProduitsFournisseur(fid).catch(() => [] as any[]) : await getProduitsFournisseursAll().catch(() => [] as any[])
  const p = (list as any[]).find((x: any) => String(x.reference) === String(ref) && (!fid || String(x.fournisseur_id) === String(fid)))
  return c.json({ ok: true, prix: p ? p.prix : null, date_prix: p ? p.date_prix : null, designation: p ? p.designation : null })
})

// ─── Historique du prix unitaire d'une référence (pour la courbe d'évolution) ──
app.get('/api/ref-prix/:reference', async (c) => {
  const ref = decodeURIComponent(c.req.param('reference'))
  const hist = await getRefPrixHistorique(ref).catch(() => [])
  return c.json({ ok: true, historique: hist })
})

// ══════════════════════════════════════════════════════════════
// PRODUITS FOURNISSEURS (catalogue commercial) + DEMANDES DE PRIX (RFQ)
//   Règle : le prix officiel n'est écrit QUE par la validation d'une RFQ (ou manuellement).
// ══════════════════════════════════════════════════════════════

// — Déclarer une référence chez un fournisseur (réf+désignation requis, prix OPTIONNEL §4.1) —
app.post('/api/produits-fournisseurs', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const reference = String(b.reference || '').trim()
  const designation = String(b.designation || '').trim()
  if (!reference || !designation) return c.json({ ok: false, error: 'Référence et désignation obligatoires' }, 400)
  let fournisseurNom = b.fournisseur_nom || null
  if (!fournisseurNom && b.fournisseur_id) {
    const fs = await getFournisseurs().catch(() => [] as any[])
    const f = (fs as any[]).find((x: any) => String(x.id) === String(b.fournisseur_id))
    fournisseurNom = f ? f.nom : null
  }
  const prix = (b.prix != null && b.prix !== '') ? Number(b.prix) : null
  const { data, error } = await upsertProduitFournisseur({
    fournisseur_id: b.fournisseur_id || null, fournisseur_nom: fournisseurNom,
    reference, designation, categorie: b.categorie || 'matiere_premiere',
    prix, devise: 'EUR', unite: b.unite || 'pce',
    date_prix: prix != null ? TODAY_ISO() : null, source_prix: b.source_prix || 'manuel',
    delai_jours: (b.delai_jours != null && b.delai_jours !== '') ? Number(b.delai_jours) : null,
    statut: prix != null ? 'actif' : 'en_attente_prix', activite: b.activite || 'both',
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, produit: data })
})

// — Modifier une référence catalogue par id (édition en place depuis BE › Références) —
app.put('/api/produits-fournisseurs/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const reference = String(b.reference || '').trim()
  const designation = String(b.designation || '').trim()
  if (!reference || !designation) return c.json({ ok: false, error: 'Référence et désignation obligatoires' }, 400)
  let fournisseurNom = b.fournisseur_nom || null
  if (b.fournisseur_id) {
    const fs = await getFournisseurs().catch(() => [] as any[])
    const f = (fs as any[]).find((x: any) => String(x.id) === String(b.fournisseur_id))
    if (f) fournisseurNom = f.nom
  }
  // Patch PARTIEL : on ne met à jour que les champs réellement fournis (sinon on écraserait l'existant —
  // ex. la fiche fournisseur n'envoie pas l'activité et ne doit pas la remettre à 'both').
  const patch: Record<string, any> = { reference, designation, updated_at: new Date().toISOString() }
  if (b.categorie != null && b.categorie !== '') patch.categorie = b.categorie
  if (b.activite != null && b.activite !== '') patch.activite = b.activite
  if (b.fournisseur_id !== undefined) { patch.fournisseur_id = b.fournisseur_id || null; patch.fournisseur_nom = fournisseurNom }
  if (b.delai_jours !== undefined) patch.delai_jours = (b.delai_jours != null && b.delai_jours !== '') ? Number(b.delai_jours) : null
  // Prix optionnel : touché UNIQUEMENT si un prix positif est fourni (sinon inchangé — le prix est piloté par les RFQ).
  const prix = (b.prix != null && b.prix !== '') ? Number(b.prix) : null
  if (prix != null && isFinite(prix) && prix > 0) {
    patch.prix = prix; patch.date_prix = TODAY_ISO(); patch.source_prix = 'manuel'; patch.statut = 'actif'
  }
  const { data, error } = await updateProduitFournisseur(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, produit: data })
})

app.delete('/api/produits-fournisseurs/:id', async (c) => {
  const { error } = await deleteProduitFournisseur(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// — RFQ : créer (déclenchée depuis le BE) —
app.post('/api/demandes-prix', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const lignes = Array.isArray(b.lignes) ? b.lignes.filter((l: any) => String(l.designation || l.reference || '').trim()) : []
  if (!lignes.length) return c.json({ ok: false, error: 'Aucun article à chiffrer' }, 400)
  const existing = await getDemandesPrix().catch(() => [] as any[])
  const numero = nextSeqId('RFQ', (existing as any[]).map((d: any) => d.numero).filter(Boolean))
  // Demandeur = utilisateur de session (anti-usurpation EN9100) ; jamais un nom en texte libre du corps.
  const demandeur = await resolveSigner(c, b, b.demandeur || 'BE')
  const { data: dp, error } = await createDemandePrix({
    numero, statut: 'a_traiter', origine: b.origine || (b.dt_ref ? 'affaire' : 'libre'),
    dt_id: b.dt_id || null, dt_ref: b.dt_ref || null, nomenclature_id: b.nomenclature_id || null,
    demandeur, activite: b.activite || 'both', notes: b.notes || null,
  })
  if (error || !dp) return c.json({ ok: false, error: error?.message || 'Création impossible' }, 400)
  const cibles = Array.isArray(b.fournisseurs_cibles) ? b.fournisseurs_cibles : []
  for (const l of lignes) {
    const { data: ligne } = await createDemandePrixLigne({
      demande_prix_id: dp.id, reference: l.reference || null, designation: l.designation || l.reference || '—',
      quantite_estimee: (l.quantite_estimee != null && l.quantite_estimee !== '') ? Number(l.quantite_estimee) : null,
      unite: l.unite || 'pce', categorie: l.categorie || 'matiere_premiere', commentaire: l.commentaire || null,
    })
    if (ligne) for (const fc of cibles) {
      await createDemandePrixReponse({ demande_prix_id: dp.id, ligne_id: ligne.id, fournisseur_id: fc.id || fc || null, fournisseur_nom: fc.nom || null }).catch(() => {})
    }
  }
  return c.json({ ok: true, id: dp.id, numero })
})

// — RFQ v2 : créer une demande GROUPÉE (multi-réfs, fournisseurs PAR référence) →
//   scindée en 1 RFQ par fournisseur (chacune = les réfs qui le concernent). —
app.post('/api/demandes-prix/grouped', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const lignesIn = Array.isArray(b.lignes)
    ? b.lignes.filter((l: any) => String(l.designation || l.reference || '').trim() && Array.isArray(l.fournisseurs) && l.fournisseurs.length)
    : []
  if (!lignesIn.length) return c.json({ ok: false, error: 'Ajoutez au moins une référence avec un fournisseur.' }, 400)
  // Regrouper les références par fournisseur (clé = id sinon nom).
  const bySup = new Map<string, { id: any; nom: any; lignes: any[] }>()
  for (const l of lignesIn) {
    for (const f of l.fournisseurs) {
      const key = String((f && (f.id || f.nom)) || '').trim()
      if (!key) continue
      if (!bySup.has(key)) bySup.set(key, { id: f.id || null, nom: f.nom || null, lignes: [] })
      bySup.get(key)!.lignes.push(l)
    }
  }
  if (!bySup.size) return c.json({ ok: false, error: 'Aucun fournisseur valide.' }, 400)
  const demandeur = await resolveSigner(c, b, b.demandeur || 'Achats')
  const existing = await getDemandesPrix().catch(() => [] as any[])
  let numeros = (existing as any[]).map((d: any) => d.numero).filter(Boolean)
  const created: any[] = []
  for (const sup of bySup.values()) {
    const numero = nextSeqId('RFQ', numeros)
    numeros = numeros.concat(numero) // pour que la RFQ suivante incrémente
    const { data: dp } = await createDemandePrix({
      numero, statut: 'a_traiter', origine: b.origine || 'libre',
      demandeur, activite: b.activite || 'both', notes: b.notes || null,
    })
    if (!dp) continue
    for (const l of sup.lignes) {
      const { data: ligne } = await createDemandePrixLigne({
        demande_prix_id: dp.id, reference: l.reference || null, designation: l.designation || l.reference || '—',
        quantite_estimee: (l.quantite_estimee != null && l.quantite_estimee !== '') ? Number(l.quantite_estimee) : null,
        unite: l.unite || 'pce', categorie: l.categorie || 'matiere_premiere', commentaire: l.commentaire || null,
      })
      if (ligne) await createDemandePrixReponse({ demande_prix_id: dp.id, ligne_id: ligne.id, fournisseur_id: sup.id, fournisseur_nom: sup.nom }).catch(() => {})
    }
    created.push({ id: dp.id, numero, fournisseur: sup.nom })
  }
  if (!created.length) return c.json({ ok: false, error: 'Création impossible.' }, 400)
  return c.json({ ok: true, count: created.length, created })
})

// ── PDF imprimables (RFQ + BC), rendus SERVEUR, brandés Seem Semrac ──────────
// Ouverts via window.open(...) côté client → impression / « Enregistrer en PDF ».
const _pdfEsc = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const renderPrintableDoc = (docTitle: string, accent: string, rightHTML: string, bodyHTML: string) =>
  '<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>' + _pdfEsc(docTitle) + '</title>'
  + '<style>' + BRAND_PRINT_CSS + 'body{font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;font-size:12px;padding:24px;margin:0;}'
  + 'table{border-collapse:collapse;width:100%;}'
  + '.doc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid ' + accent + ';padding-bottom:14px;margin-bottom:16px;}'
  + '.doc-right{text-align:right;font-size:11px;color:#475569;line-height:1.6;}'
  + 'th{background:' + accent + ';color:#fff;font-size:10px;text-transform:uppercase;padding:7px 9px;text-align:left;}'
  + 'td{padding:7px 9px;border-bottom:1px solid #e2e8f0;font-size:11px;}'
  + '.muted{color:#64748b;}.tot{font-weight:800;color:' + accent + ';}'
  + '</style></head><body onload="try{window.print()}catch(e){}">'
  + '<div class="doc-head">' + brandBlockHTML() + '<div class="doc-right">' + rightHTML + '</div></div>'
  + bodyHTML
  + '<div style="margin-top:26px;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;">Document genere par l\'ERP ' + _pdfEsc(SOCIETE.nom) + '.</div>'
  + '</body></html>'

// — PDF d'une demande de prix (à envoyer au fournisseur) —
app.get('/api/demandes-prix/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const [dp, lignes, reponses] = await Promise.all([getDemandePrix(id), getDemandePrixLignes(id), getDemandePrixReponses(id)])
  if (!dp) return c.text('Demande de prix introuvable', 404)
  const fnoms = Array.from(new Set((reponses as any[]).map((r: any) => r.fournisseur_nom).filter(Boolean)))
  const dateStr = String(dp.date_creation || '').slice(0, 10)
  const right = '<div style="font-size:15px;font-weight:800;color:' + BRAND.bleu + ';">Demande de prix</div>'
    + '<div style="font-family:monospace;font-weight:700;">' + _pdfEsc(dp.numero || dp.id) + '</div>'
    + (dateStr ? '<div>Date : ' + _pdfEsc(dateStr) + '</div>' : '')
  const dest = fnoms.length ? '<div style="margin-bottom:14px;"><span class="muted">Fournisseur consulte :</span> <strong>' + _pdfEsc(fnoms.join(', ')) + '</strong></div>' : ''
  const rows = (lignes as any[]).map((l: any, i: number) =>
    '<tr><td>' + (i + 1) + '</td><td style="font-family:monospace;">' + _pdfEsc(l.reference || '—') + '</td><td>' + _pdfEsc(l.designation || '') + '</td>'
    + '<td style="text-align:right;">' + (l.quantite_estimee != null ? _pdfEsc(l.quantite_estimee) : '') + ' ' + _pdfEsc(l.unite || '') + '</td>'
    + '<td style="width:130px;"></td></tr>').join('')
  const body = dest
    + '<p class="muted" style="margin:0 0 12px;">Merci de nous communiquer votre meilleur prix et delai pour les references ci-dessous.</p>'
    + '<table><thead><tr><th>#</th><th>Reference</th><th>Designation</th><th style="text-align:right;">Quantite</th><th>Prix unit. HT</th></tr></thead><tbody>'
    + (rows || '<tr><td colspan="5" class="muted">Aucune ligne.</td></tr>') + '</tbody></table>'
    + '<div style="margin-top:20px;font-size:11px;" class="muted">Merci d\'indiquer vos conditions : delai de livraison, minimum de commande, validite de l\'offre.</div>'
  return c.html(renderPrintableDoc('Demande de prix ' + (dp.numero || dp.id), BRAND.bleu, right, body))
})

// — PDF d'un bon de commande (à envoyer au fournisseur) —
app.get('/api/bc/:id/pdf', async (c) => {
  const id = c.req.param('id')
  const bc = await getBonDeCommande(id)
  if (!bc) return c.text('Bon de commande introuvable', 404)
  const right = '<div style="font-size:15px;font-weight:800;color:' + BRAND.violet + ';">Bon de commande</div>'
    + '<div style="font-family:monospace;font-weight:700;">' + _pdfEsc(bc.num_bc || bc.id) + '</div>'
    + (bc.date_bc ? '<div>Date : ' + _pdfEsc(String(bc.date_bc).slice(0, 10)) + '</div>' : '')
    + (bc.date_livraison ? '<div>Livraison : ' + _pdfEsc(String(bc.date_livraison).slice(0, 10)) + '</div>' : '')
  const bcLignes = Array.isArray(bc.lignes) ? bc.lignes : []
  const rows = bcLignes.length
    ? bcLignes.map((l: any, i: number) => '<tr><td>' + (i + 1) + '</td><td style="font-family:monospace;font-weight:700;">' + _pdfEsc(l.reference || '—') + '</td><td>' + _pdfEsc(l.article || l.designation || '') + '</td><td style="text-align:right;">' + _pdfEsc(l.qte != null ? l.qte : '') + '</td><td style="text-align:right;">' + (l.prix_unitaire != null ? _pdfEsc(l.prix_unitaire) + ' €' : '') + '</td></tr>').join('')
    : '<tr><td>1</td><td style="font-family:monospace;font-weight:700;">—</td><td>' + _pdfEsc(bc.articles || '—') + '</td><td style="text-align:right;"></td><td style="text-align:right;"></td></tr>'
  const dest = '<div style="margin-bottom:14px;"><span class="muted">' + (bc.type_bc === 'sous_traitant' ? 'Sous-traitant' : 'Fournisseur') + ' :</span> <strong>' + _pdfEsc(bc.fournisseur_nom || '—') + '</strong></div>'
  const body = dest
    + '<table><thead><tr><th>#</th><th>Référence</th><th>Article / prestation</th><th style="text-align:right;">Qte</th><th style="text-align:right;">Prix unit. HT</th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<div style="display:flex;justify-content:flex-end;margin-top:14px;"><table style="width:auto;"><tr><td class="muted" style="text-align:right;padding-right:16px;border:none;">Total HT</td><td class="tot" style="text-align:right;border:none;">' + _pdfEsc((Number(bc.montant_ht) || 0).toFixed(2)) + ' ' + _pdfEsc(bc.devise || 'EUR') + '</td></tr></table></div>'
    + (bc.conditions_paiement ? '<div class="muted" style="margin-top:14px;">Conditions de paiement : ' + _pdfEsc(bc.conditions_paiement) + '</div>' : '')
    + (bc.notes ? '<div class="muted" style="margin-top:6px;">' + _pdfEsc(bc.notes) + '</div>' : '')
  return c.html(renderPrintableDoc('Bon de commande ' + (bc.num_bc || bc.id), BRAND.violet, right, body))
})

// — PDF Rapport d'audit interne (de marque) —
app.get('/api/audit/programme/:id/rapport.pdf', async (c) => {
  const prog = (await getAuditProgramme().catch(() => [])) as any[]
  const a = prog.find((p) => String(p.id) === String(c.req.param('id')))
  if (!a) return c.text('Audit introuvable', 404)
  // Rapport téléchargeable uniquement une fois l'audit soldé/clôturé
  if (a.statut !== 'cloture' && !a.plan_action_solde) return c.text('Le rapport d\'audit n\'est disponible qu\'une fois l\'audit soldé (clôturé).', 403)
  const reps = Array.isArray(a.reponses) ? a.reponses : []
  const etatLbl = (e: string) => e === 'C' ? 'Conforme' : e === 'NC' ? 'Non conforme' : e === 'AXE' ? 'Axe d\'amélioration' : '—'
  const etatCol = (e: string) => e === 'C' ? '#15803d' : e === 'NC' ? '#b91c1c' : e === 'AXE' ? '#92400e' : '#64748b'
  const right = '<div style="font-size:15px;font-weight:800;color:' + BRAND.bleu + ';">Rapport d\'audit interne</div>'
    + '<div style="font-family:monospace;font-weight:700;">' + _pdfEsc(a.id) + '</div>'
    + (a.date_realisation ? '<div>Réalisé : ' + _pdfEsc(String(a.date_realisation).slice(0, 10)) + '</div>' : '')
  const meta = '<table style="width:auto;margin-bottom:14px;">'
    + '<tr><td class="muted">Entité auditée</td><td><strong>' + _pdfEsc(a.entite_auditee || '—') + '</strong></td></tr>'
    + '<tr><td class="muted">Type / famille</td><td>' + _pdfEsc(a.type || '—') + (a.famille ? ' · ' + _pdfEsc(a.famille) : '') + '</td></tr>'
    + '<tr><td class="muted">Référentiels</td><td>' + _pdfEsc(a.referentiels || '—') + '</td></tr>'
    + '<tr><td class="muted">Thèmes</td><td>' + _pdfEsc(a.themes || '—') + '</td></tr>'
    + '<tr><td class="muted">Auditeur</td><td>' + _pdfEsc(a.auditeur || '—') + '</td></tr>'
    + '<tr><td class="muted">Audité</td><td>' + _pdfEsc(a.audite_principal || '—') + '</td></tr></table>'
  const rows = reps.length ? reps.map((r: any, i: number) => '<tr><td>' + (i + 1) + '</td><td>' + _pdfEsc(r.libelle || '—') + '</td><td style="color:' + etatCol(r.etat) + ';font-weight:700;">' + etatLbl(r.etat) + '</td><td>' + _pdfEsc(r.preuve || '') + '</td></tr>').join('') : '<tr><td colspan="4" class="muted">Aucune réponse enregistrée.</td></tr>'
  const nNC = reps.filter((r: any) => r.etat === 'NC').length, nAxe = reps.filter((r: any) => r.etat === 'AXE').length
  const body = meta
    + '<table><thead><tr><th>#</th><th>Question</th><th>Résultat</th><th>Preuve / constat</th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<div style="margin-top:14px;"><strong>Synthèse :</strong> ' + nNC + ' non-conformité(s), ' + nAxe + ' axe(s) d\'amélioration.</div>'
    + (a.observations ? '<div class="muted" style="margin-top:8px;">Observations : ' + _pdfEsc(a.observations) + '</div>' : '')
    + '<div style="display:flex;justify-content:space-between;margin-top:34px;"><div>Auditeur : ___________________</div><div>Audité : ___________________</div></div>'
  return c.html(renderPrintableDoc('Rapport audit ' + a.id, BRAND.bleu, right, body))
})

// — PDF Grille d'audit VIERGE (audit terrain papier) —
app.get('/api/audit/grille/:id/vierge.pdf', async (c) => {
  const id = c.req.param('id')
  const [grilles, questions] = await Promise.all([getAuditGrilles().catch(() => []), getAuditQuestions().catch(() => [])])
  const g = (grilles as any[]).find((x) => String(x.id) === String(id))
  if (!g) return c.text('Grille introuvable', 404)
  const qs = (questions as any[]).filter((q) => String(q.grille_id) === String(id)).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
  const right = '<div style="font-size:15px;font-weight:800;color:' + BRAND.bleu + ';">Grille d\'audit</div><div style="font-weight:700;">' + _pdfEsc(g.titre) + '</div>'
  const rows = qs.length ? qs.map((q: any, i: number) => '<tr><td>' + (q.ordre || i + 1) + '</td><td>' + _pdfEsc(q.libelle) + (q.clause_ref ? '<div class="muted" style="font-size:9px;">' + _pdfEsc(q.clause_ref) + '</div>' : '') + '</td><td style="text-align:center;white-space:nowrap;">&#9744; C&nbsp;&nbsp;&#9744; NC&nbsp;&nbsp;&#9744; Axe</td><td style="width:150px;">&nbsp;</td></tr>').join('') : '<tr><td colspan="4" class="muted">Grille vide.</td></tr>'
  const head = '<div style="margin-bottom:12px;display:flex;gap:24px;flex-wrap:wrap;"><div>Auditeur : ______________</div><div>Date : ____________</div><div>Opérateur audité : ______________</div></div>'
  const body = head + '<table><thead><tr><th>#</th><th>Question</th><th style="text-align:center;">Résultat</th><th>Preuve / constat</th></tr></thead><tbody>' + rows + '</tbody></table>'
  return c.html(renderPrintableDoc('Grille ' + g.titre, BRAND.bleu, right, body))
})

// — BC : marquer « validée par le fournisseur » (accusé de commande) —
// Stocké dans une colonne dédiée (le statut BC est verrouillé par un CHECK). Dégrade
// proprement si la migration bc_accuse_fournisseur.sql n'a pas encore été jouée.
app.post('/api/bc/:id/accuse', async (c) => {
  const id = c.req.param('id')
  const { error } = await updateBonDeCommande(id, { accuse_fournisseur_le: new Date().toISOString() })
  if (error) return c.json({ ok: false, needsMigration: true, error: 'Colonne accuse_fournisseur_le absente — exécutez scripts_import/bc_accuse_fournisseur.sql.' }, 400)
  return c.json({ ok: true })
})

// — BC : noter une relance fournisseur (le badge « à relancer » repart pour 7 jours) —
app.post('/api/bc/:id/relance', async (c) => {
  const id = c.req.param('id')
  const { error } = await updateBonDeCommande(id, { date_relance: new Date().toISOString() })
  if (error) return c.json({ ok: false, needsMigration: true, error: 'Colonne date_relance absente — exécutez scripts_import/bc_accuse_fournisseur.sql.' }, 400)
  return c.json({ ok: true })
})

// — RFQ : détail (entête + lignes + réponses) —
app.get('/api/demandes-prix/:id', async (c) => {
  const id = c.req.param('id')
  const [dp, lignes, reponses] = await Promise.all([getDemandePrix(id), getDemandePrixLignes(id), getDemandePrixReponses(id)])
  if (!dp) return c.json({ ok: false, error: 'Introuvable' }, 404)
  return c.json({ ok: true, demande: dp, lignes, reponses })
})

// — RFQ : marquer envoyée aux fournisseurs —
app.post('/api/demandes-prix/:id/envoyer', async (c) => {
  const { error } = await updateDemandePrix(c.req.param('id'), { statut: 'envoyee', date_envoi: new Date().toISOString() })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// — RFQ : enregistrer les réponses (update si id connu, sinon création) —
app.post('/api/demandes-prix/:id/reponses', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const reponses = Array.isArray(b.reponses) ? b.reponses : []
  for (const r of reponses) {
    const patch: any = {
      ligne_id: r.ligne_id || null, fournisseur_id: r.fournisseur_id || null, fournisseur_nom: r.fournisseur_nom || null,
      prix_unitaire: (r.prix_unitaire != null && r.prix_unitaire !== '') ? Number(r.prix_unitaire) : null,
      delai_jours: (r.delai_jours != null && r.delai_jours !== '') ? Number(r.delai_jours) : null,
      validite_date: r.validite_date || null, commentaire: r.commentaire || null,
      date_reponse: new Date().toISOString(), retenu: !!r.retenu,
    }
    if (r.id) await updateDemandePrixReponse(r.id, patch).catch(() => {})
    else await createDemandePrixReponse({ demande_prix_id: id, ...patch }).catch(() => {})
  }
  await updateDemandePrix(id, { statut: 'reponse_recue' }).catch(() => {})
  return c.json({ ok: true })
})

// — RFQ : VALIDER → écrit le prix officiel (produits_fournisseurs + ref_prix_historique source=rfq) puis clôture —
app.post('/api/demandes-prix/:id/valider', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const retenus = Array.isArray(b.retenus) ? b.retenus : []
  const dp = await getDemandePrix(id).catch(() => null)
  const numero = dp?.numero || null
  let n = 0
  for (const r of retenus) {
    const reference = String(r.reference || '').trim()
    const pu = Number(r.prix_unitaire)
    if (!reference || !isFinite(pu)) continue
    await upsertProduitFournisseur({
      fournisseur_id: r.fournisseur_id || null, fournisseur_nom: r.fournisseur_nom || null,
      reference, designation: r.designation || reference, categorie: r.categorie || 'matiere_premiere',
      prix: pu, devise: 'EUR', date_prix: TODAY_ISO(), source_prix: 'rfq', statut: 'actif', activite: r.activite || 'both',
    }).catch(() => {})
    await createRefPrixHistorique({
      reference, designation: r.designation || reference, categorie_ref: r.categorie || 'matiere_premiere',
      fournisseur_id: r.fournisseur_id || null, fournisseur_nom: r.fournisseur_nom || null,
      prix_unitaire: pu, quantite: null, date_prix: TODAY_ISO(), bc_num: numero, source: 'rfq', activite: r.activite || 'both',
    }).catch(() => {})
    if (r.reponse_id) await updateDemandePrixReponse(r.reponse_id, { retenu: true }).catch(() => {})
    n++
  }
  await updateDemandePrix(id, { statut: 'cloturee', date_cloture: new Date().toISOString() }).catch(() => {})
  return c.json({ ok: true, prix_maj: n })
})

// — RFQ : supprimer —
app.delete('/api/demandes-prix/:id', async (c) => {
  const { error } = await deleteDemandePrix(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// — Nettoyage : références sans prix (purge soft §4.2 — éligibles = prix NULL depuis > 90 j) —
app.get('/api/produits-fournisseurs/sans-prix', async (c) => {
  const list = await getProduitsSansPrix().catch(() => [] as any[])
  const cutoff = Date.now() - 90 * 86400000
  const withFlag = (list as any[]).map((p: any) => ({ ...p, eligible: p.created_at ? Date.parse(p.created_at) < cutoff : false }))
  return c.json({ ok: true, produits: withFlag })
})
app.post('/api/produits-fournisseurs/purge', async (c) => {
  const list = await getProduitsSansPrix().catch(() => [] as any[])
  const cutoff = Date.now() - 90 * 86400000
  let n = 0
  for (const p of list as any[]) {
    const created = p.created_at ? Date.parse(p.created_at) : 0
    if (created && created < cutoff) { await deleteProduitFournisseur(p.id).catch(() => {}); n++ }
  }
  return c.json({ ok: true, supprimes: n })
})

// API référentiels BE — machines + taux opérateur + ST (alimente le formulaire nomenclature)
app.get('/api/be/refs', async (c) => {
  const refs = await getBeRefs()
  return c.json(refs)
})

// Lecture des fournitures (matière + accessoires) d'une nomenclature pour le rechargement du formulaire BE
app.get('/api/nomenclature/:id/fournitures', async (c) => {
  const id = c.req.param('id')
  const rows = await getFournitures(id).catch(() => [])
  return c.json({ ok: true, fournitures: rows })
})

// ─── Analyse DT auto-calculée depuis les nomenclatures validées des pièces ───
// Pour chaque pièce de la DT, retrouve sa nomenclature validée (par code_ref_produit ↔ ref_interne)
// et calcule tout pour la quantité voulue : matière, MO, machine, réglage, sous-traitance (forfait inclus).
// Temps d'une étape en minutes — gère le modèle importé (millièmes d'heure, /1000) ET le manuel (minutes).
// Réglage total d'une étape, en millièmes d'heure : ROP (opérateur) + RGM (machine)
// quand ils sont renseignés, sinon le champ historique unique.
function reglageMilleTotal(e: any): number {
  if (!e) return 0
  if (e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null) {
    return (Number(e.temps_reglage_op_mille) || 0) + (Number(e.temps_reglage_machine_mille) || 0)
  }
  return Number(e.temps_reglage_mille) || 0
}

// Réglage = part fixe (par lot) ; varMin = part variable (par pièce). Une op importée 'est_fixe' bascule en réglage.
function etapeTempsMin(e: any): { reglageMin: number; varMin: number } {
  if (e && (e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null)) {
    const vmin = (Number(e.temps_variable_mille) || 0) * 0.06   // millième d'h → minutes (×60/1000)
    const rmin = reglageMilleTotal(e) * 0.06
    return e.est_fixe ? { reglageMin: rmin + vmin, varMin: 0 } : { reglageMin: rmin, varMin: vmin }
  }
  return { reglageMin: Number(e.temps_reglage_min) || 0, varMin: (Number(e.temps_mo_min) || 0) + (Number(e.temps_machine_min) || 0) }
}
app.get('/api/be/analyse-dt/:id', async (c) => {
  const id = c.req.param('id')
  const [dt, noms, produitsAll, stockAll, machinesAll, machinesOpexAll, postesAll, processAll] = await Promise.all([getDemandeTravaux(id).catch(() => null), getNomenclatures().catch(() => [] as any[]), getProduitsFournisseursAll().catch(() => [] as any[]), getStockReel().catch(() => [] as any[]), getMachines().catch(() => [] as any[]), getMachinesOpex().catch(() => [] as any[]), getPostes().catch(() => [] as any[]), getProcessAtelier().catch(() => [] as any[])])
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  // Phase E : taux effectif du POSTE de chaque machine (base + incrément OPEX achats reçus / heures budgétées, ou override).
  //   Passé à computeNomCostForQty → l'achat machine reçu remonte au CRU. Incrément 0 tant qu'aucun achat → CRU inchangé.
  const posteRates = computePosteRates(machinesAll as any[], machinesOpexAll as any[], postesAll as any[], Number(TODAY_ISO().slice(0, 4)))
  const costOpts = { machineRate: posteRates.machineRate }
  // Résolution du POSTE d'une étape : via sa machine (machine_id → machine.poste_id) ou son process (process_id → process.poste_id).
  const _machById: Record<string, any> = {}; (machinesAll as any[]).forEach((m: any) => { _machById[String(m.id)] = m })
  const _procById: Record<string, any> = {}; (processAll as any[]).forEach((p: any) => { _procById[String(p.id)] = p })
  const _posteNom: Record<string, string> = {}; (postesAll as any[]).forEach((p: any) => { _posteNom[String(p.id)] = p.nom || p.id })
  const _posteOfEtape = (e: any): { id: string | null; nom: string } => {
    const mid = e && e.machine_id ? String(e.machine_id) : ''
    const pid0 = mid && _machById[mid] && _machById[mid].poste_id ? String(_machById[mid].poste_id) : ''
    const procId = e && e.process_id ? String(e.process_id) : ''
    const pid = pid0 || (procId && _procById[procId] && _procById[procId].poste_id ? String(_procById[procId].poste_id) : '')
    return pid ? { id: pid, nom: _posteNom[pid] || pid } : { id: null, nom: e && (e.machine_nom || e.fournisseur_st_nom) ? String(e.machine_nom || e.fournisseur_st_nom) : 'Sans poste' }
  }
  // Carte prix par référence (pour repérer matière/accessoires à chiffrer)
  const _prixMap: Record<string, { prix: any; date: any }> = {}
  ;(produitsAll as any[]).forEach((p: any) => { const k = String(p.reference || ''); if (k && (!_prixMap[k] || String(p.date_prix || '') > String(_prixMap[k].date || ''))) _prixMap[k] = { prix: p.prix, date: p.date_prix } })
  const _fresh = (ref: string) => { const e = _prixMap[String(ref || '')]; if (!e || e.prix == null || !e.date) return false; return (Date.now() - Date.parse(e.date)) < 92 * 86400000 }
  // Index stock par référence (insensible casse/espaces) → besoin vs restant vs seuil
  const _stockByRef: Record<string, any> = {}
  ;(stockAll as any[]).forEach((s: any) => { const k = String(s.reference || '').toLowerCase().trim(); if (k && !_stockByRef[k]) _stockByRef[k] = s })
  // Nomenclatures par code_ref_produit : dernière VALIDÉE et dernier BROUILLON (indice le plus élevé).
  // L'analyse déverse le brouillon (visible) mais reste NON validable tant que tout n'est pas validé.
  const validByCode: Record<string, any> = {}
  const draftByCode: Record<string, any> = {}
  for (const n of (noms as any[])) {
    const k = String(n.code_ref_produit || '').toLowerCase().trim()
    if (!k) continue
    const map = n.statut === 'valide' ? validByCode : draftByCode
    const cur = map[k]
    if (!cur || String(n.indice || 'A') > String(cur.indice || 'A')) map[k] = n
  }
  const pieces = Array.isArray((dt as any).pieces_detail) ? (dt as any).pieces_detail : []
  const out: any[] = []
  for (const p of pieces) {
    const ref = String(p.ref_interne || '').toLowerCase().trim()
    const qte = Math.max(1, Math.floor(Number(p.quantite)) || 1)   // quantité principale toujours un entier ≥ 1
    // Quantités à chiffrer : plusieurs estimatifs par pièce (la principale est toujours incluse), dédoublonnées + triées.
    const _qSet = new Set<number>()
    ;((Array.isArray(p.quantites) && p.quantites.length ? p.quantites : [qte]) as any[]).forEach((x) => { const v = Math.max(0, Math.floor(Number(x)) || 0); if (v > 0) _qSet.add(v) })
    _qSet.add(qte)
    const qtes = Array.from(_qSet).sort((a, b) => a - b)
    const exigences = Array.isArray(p.exigences) ? p.exigences : []
    const nom = ref ? (validByCode[ref] || draftByCode[ref] || null) : null
    const nomStatut = nom ? (validByCode[ref] ? 'valide' : 'brouillon') : null
    if (!nom) { out.push({ ref_interne: p.ref_interne || null, ref_client: p.ref_client || null, nom_plan: p.nom_plan || null, quantite: qte, quantites: qtes, results: [], exigences, piece_existante_a_jour: !!p.piece_existante_a_jour, nom_statut: null, nomenclature: null, cost: null, etapes: [], fournitures_stock: [], plan_doc_id: null, etapes_libres: Array.isArray(p.etapes_libres) ? p.etapes_libres : [], taux_mo: 45, taux_machine: 50 }); continue }
    const fournitures = await getFournitures(nom.id).catch(() => [] as any[])
    const cost = computeNomCostForQty(nom, fournitures, qte, costOpts)
    // Process ordonnés → durée = temps fixe (réglage) + temps variable (MO+machine) × quantité client.
    // On sépare réglage / MO / machine (comme la nomenclature) pour un affichage identique dans l'analyse.
    const tauxMoDef = Number(nom.taux_mo) || 45
    const tauxMachDef = Number(nom.cout_machine_h) || 50
    const etapes = (Array.isArray(nom.etapes_production) ? nom.etapes_production : []).slice()
      .sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
      .map((e: any, idx: number) => {
        // TEMPS (min) — pour l'affichage : réglage/lot + variable/pièce (op. fixe importée → part réglage).
        let reglage = 0, mo = 0, mach = 0
        if (e && (e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null)) {
          const varMin = (Number(e.temps_variable_mille) || 0) * 0.06   // millième d'heure → minutes
          const regMin = reglageMilleTotal(e) * 0.06                    // ROP + RGM
          reglage = regMin
          if (e.est_fixe) reglage += varMin                               // opération fixe → part réglage/lot
          else if (e.ressource === 'machine') mach = varMin
          else mo = varMin
        } else if (e) {
          reglage = Number(e.temps_reglage_min) || 0
          mo = Number(e.temps_mo_min ?? e.temps_unitaire_min ?? 0) || 0   // format legacy : temps_unitaire_min → MO (cohérent avec computeNomCostForQty)
          mach = Number(e.temps_machine_min) || 0
        }
        const varMinPiece = mo + mach
        const st = e && e.type === 'sous_traite'
        // COÛT — source UNIQUE (etapeDecomp) : STRICTEMENT le même calcul que le CRU (computeNomCostForQty),
        //   machine_taux_h=0 → coût machine 0 (+ incrément OPEX poste), pas de repli défaut. ⇒ le total « par
        //   poste » réconcilie exactement moSerie+machineSerie+stOrder. On garde la précision (formatage au rendu).
        const d = etapeDecomp(e, tauxMoDef, tauxMachDef, posteRates.machineRate)
        const cout_pc = st ? d.unit : (d.moPc + d.machPc)      // € variable / pièce (× q côté client)
        const cout_reglage = st ? 0 : (d.moFixe + d.machFixe)  // € fixe / lot (réglage + op. fixe)
        const _po = _posteOfEtape(e)
        return { ordre: Number(e.ordre) || (idx + 1), nom: e.nom || e.process_nom || e.operation_st || 'Process', type: e.type || 'interne',
          machine_nom: e.machine_nom || e.fournisseur_st_nom || null, poste_id: _po.id, poste_nom: _po.nom,
          reglage_min: +reglage.toFixed(3), mo_min: +mo.toFixed(3), machine_min: +mach.toFixed(3),
          var_min_piece: +varMinPiece.toFixed(3), var_min_total: +(varMinPiece * qte).toFixed(1), duree_h: +(((reglage + varMinPiece * qte)) / 60).toFixed(3),
          cout_pc, cout_reglage,   // précision PLEINE (formatage au rendu) → le total « par poste » = CRU au centime près
          st_forfait: st ? d.forfait : 0, st_unit: st ? d.unit : 0,   // ST : coût = max(forfait ; q×unit)
          source: 'nomenclature', locked: true }
      })
    // Matière + accessoires → besoin (× quantité client) confronté au stock restant et aux seuils
    const fournitures_stock = (fournitures as any[])
      .filter((f: any) => (f.categorie === 'matiere' || f.categorie === 'accessoire'))
      .map((f: any) => {
        const refKey = String(f.ref_stock || '').toLowerCase().trim()
        const st = refKey ? _stockByRef[refKey] : null
        const qpp = Number(f.quantite_par_piece) || 0
        const isMat = f.categorie === 'matiere'
        const npt = Number(f.nb_par_tole) || 0       // matière : pièces par tôle
        const qtePaq = Number(f.qte_paquet) || 0     // accessoire : accessoires par paquet
        // Besoin en UNITÉS D'ACHAT ENTIÈRES (arrondi SUPÉRIEUR) : tôles (matière) ou paquets (accessoire).
        const besoin = isMat
          ? (npt > 0 ? Math.ceil(qte / npt) : Math.ceil(qpp * qte))
          : (qtePaq > 0 ? Math.ceil((qpp * qte) / qtePaq) : Math.ceil(qpp * qte))
        const besoin_unite = isMat ? 'tôle' : 'paquet'
        // Coût série de cette réf (MÊME logique que computeNomCostForQty) : unités d'achat entières × prix, sinon repli linéaire.
        const prixUnite = Number(f.prix_unitaire) || 0             // prix d'une tôle (matière) / d'un paquet (accessoire)
        const prixLin = Number(f.prix_total_par_piece) || 0        // repli : prix / pièce
        const cout_serie = isMat
          ? ((npt > 0 && prixUnite > 0) ? Math.ceil(qte / npt) * prixUnite : prixLin * qte)
          : ((qpp > 0 && qtePaq > 0 && prixUnite > 0) ? Math.ceil((qpp * qte) / qtePaq) * prixUnite : prixLin * qte)
        const cout_unite = (prixUnite > 0) ? prixUnite : (prixLin > 0 ? +(prixLin * (isMat ? (npt > 0 ? npt : 1) : (qtePaq > 0 ? qtePaq : 1))).toFixed(4) : 0)
        const reste = st ? (Number(st.stock_actuel) || 0) : null
        const seuil = st ? (Number(st.point_commande) || Number(st.stock_mini) || 0) : null
        const unite = st ? (st.unite || null) : null
        const prix_frais = f.ref_stock ? _fresh(f.ref_stock) : false
        let statut: string
        if (!st) statut = 'hors_stock'                                              // référence absente de la table stock
        else if ((reste as number) <= 0) statut = 'rupture'
        else if ((reste as number) < besoin) statut = 'insuffisant'                 // ne couvre pas le besoin
        else if ((seuil as number) > 0 && ((reste as number) - besoin) < (seuil as number)) statut = 'sous_seuil' // couvre mais repasse sous le seuil
        else statut = 'ok'
        return { reference: f.ref_stock || '', designation: f.designation || '', categorie: f.categorie,
          quantite_par_piece: qpp, besoin, besoin_unite, reste, seuil, unite, fournisseur: f.fournisseur || '', prix_frais, statut,
          cout_unite: +cout_unite.toFixed(4), cout_serie: +cout_serie.toFixed(2) }
      })
    const prix_a_chiffrer = fournitures_stock.filter((f: any) => f.reference && !f.prix_frais)
      .map((f: any) => ({ reference: f.reference, designation: f.designation, categorie: f.categorie === 'matiere' ? 'matiere_premiere' : 'accessoire', fournisseur: f.fournisseur, quantite: qte }))
    // Plan client ouvrable : dernier document GED « plan_client » rattaché à la nomenclature (si déjà chargé)
    const planDocs = await getDocumentsForNom(nom.id).catch(() => [] as any[])
    const planDoc = (planDocs as any[]).filter((d: any) => d.categorie === 'plan_client' && d.actif !== false).slice(-1)[0] || null
    // Étapes LIBRES (contrôle dim./qualité ajoutés à l'analyse). MÊME formule que le client (beAddedPerPiece + addedCostPc)
    //   pour que le total série serveur réconcilie avec le CRU affiché : forfait + MO variable ×qté (tauxMo)
    //   + machine variable ×qté (tauxMach) + réglage FIXE/lot (tauxMo, jamais ×qté). Repli mo_min/machine_min → temps_min.
    const tauxMo = tauxMoDef   // même défaut (45) que les étapes verrouillées et computeNomCostForQty
    const etapesLibres = Array.isArray(p.etapes_libres) ? p.etapes_libres : []
    const libresCost = etapesLibres.reduce((s: number, e: any) => {
      const moM = (e.mo_min != null) ? (Number(e.mo_min) || 0) : (Number(e.temps_min) || 0)   // repli ancien format : temps_min → MO
      const macM = Number(e.machine_min) || 0
      const regM = Number(e.reglage_min) || 0
      return s + (Number(e.prix_forfait) || 0)
        + (moM / 60) * qte * tauxMo          // MO variable / pièce × qté
        + (macM / 60) * qte * tauxMachDef     // machine variable / pièce × qté (au taux MACHINE)
        + (regM / 60) * tauxMo                // réglage = coût FIXE / lot (jamais × qté)
    }, 0)
    if (cost && libresCost) cost.totalSerie = Math.round((cost.totalSerie + libresCost) * 100) / 100
    // Chiffrage par quantité : décomposition NOMENCLATURE par pièce. Les étapes AJOUTÉES (libres) sont ajoutées
    // CÔTÉ CLIENT via beAddedPerPiece (source unique) — sinon elles seraient comptées deux fois à la réouverture
    // (une fois ici, une fois par le client qui reconstruit g.added depuis etapes_libres). Matière/accessoire = constants ;
    // MO+machine et sous-traitance par pièce baissent quand la quantité monte (réglage amorti sur le lot).
    const results = qtes.map((q: number) => {
      const cq = computeNomCostForQty(nom, fournitures, q, costOpts)
      const moPc = (cq.moSerie + cq.machineSerie) / q
      const stPc = cq.stOrder / q
      const cruBasePc = cq.matiere + cq.accessoire + moPc + stPc
      return { quantite: q, matiere_pc: cq.matiere, accessoire_pc: cq.accessoire, mo_pc: +moPc.toFixed(4), st_pc: +stPc.toFixed(4),
        // Séries EXACTES (pas par-pièce arrondi × q) : matière linéaire, accessoires en paquets, MO+machine avec réglage fixe
        matiere_serie: cq.matiereLineaireSerie, accessoire_serie: cq.accessoireSerie, mo_serie: +(cq.moSerie + cq.machineSerie).toFixed(2), st_serie: cq.stOrder,
        cru_base_pc: +cruBasePc.toFixed(4), total_serie: +cq.totalSerie.toFixed(2) }
    })
    out.push({ ref_interne: p.ref_interne || null, ref_client: p.ref_client || null, nom_plan: p.nom_plan || null, quantite: qte, quantites: qtes, results,
      exigences, piece_existante_a_jour: !!p.piece_existante_a_jour, nom_statut: nomStatut, etapes_libres: etapesLibres, taux_mo: tauxMo, taux_machine: tauxMachDef, libres_cost: Math.round(libresCost * 100) / 100,
      plan_doc_id: planDoc ? planDoc.id : null, plan_fichier: planDoc ? (planDoc.fichier_nom || null) : null,
      nomenclature: { id: nom.id, num_nom: nom.num_nom, code: nom.code_ref_produit, indice: nom.indice || 'A', statut: nomStatut }, cost, etapes, fournitures_stock, prix_a_chiffrer })
  }
  const totalSerie = out.reduce((s, x) => s + (x.cost ? x.cost.totalSerie : 0), 0)
  const missing = out.filter((x: any) => !x.nomenclature && !x.piece_existante_a_jour).length
  const drafts = out.filter((x: any) => x.nom_statut === 'brouillon').length
  const allValidated = missing === 0 && drafts === 0        // analyse validable seulement si tout est validé
  return c.json({ ok: true, dt: { id: (dt as any).id, num_affaire: (dt as any).num_affaire, client: (dt as any).client_nom }, pieces: out, totalSerie: Math.round(totalSerie * 100) / 100, missing, drafts, allValidated, count: out.length })
})

// ─── Étapes LIBRES de l'analyse (contrôle dim./qualité) : persistées sur la pièce de la DT ───
app.post('/api/be/analyse-dt/:id/etapes-libres', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const ref = String(b.ref_interne || '').trim()
  if (!ref) return c.json({ ok: false, error: 'ref_interne requis' }, 400)
  const dt = await getDemandeTravaux(id).catch(() => null)
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  const steps = Array.isArray(b.etapes_libres) ? b.etapes_libres : []
  const numOrNull = (v: any) => (v != null && v !== '') ? Number(v) : null
  const clean = steps.map((e: any) => ({
    nom: String(e.nom || '').slice(0, 120), type: String(e.type || 'libre'),
    temps_min: numOrNull(e.temps_min),
    prix_forfait: numOrNull(e.prix_forfait),
    apres: Number(e.apres) || 0,
    // Détail conservé pour un aller-retour sans perte (poste/process + ventilation réglage/MO/machine)
    machine_nom: e.machine_nom ? String(e.machine_nom).slice(0, 120) : null,
    poste_id: e.poste_id ? String(e.poste_id).slice(0, 60) : null,
    poste_nom: e.poste_nom ? String(e.poste_nom).slice(0, 120) : null,
    process_id: e.process_id ? String(e.process_id).slice(0, 60) : null,
    process_nom: e.process_nom ? String(e.process_nom).slice(0, 120) : null,
    reglage_min: numOrNull(e.reglage_min),
    mo_min: numOrNull(e.mo_min),
    machine_min: numOrNull(e.machine_min),
  }))
  const pieces = Array.isArray((dt as any).pieces_detail) ? (dt as any).pieces_detail : []
  let found = false
  const updated = pieces.map((p: any) => (String(p.ref_interne || '').toLowerCase().trim() === ref.toLowerCase() ? (found = true, { ...p, etapes_libres: clean }) : p))
  if (!found) return c.json({ ok: false, error: 'Pièce introuvable dans la DT' }, 404)
  const { error } = await updateDemandeTravaux(id, { pieces_detail: updated } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, count: clean.length })
})

// ─── Génération des BDT/BDS depuis l'Analyse DT ───
//   1 BDT (interne) ou BDS (sous-traité) par process de la gamme, dans l'ordre (seq).
//   Durée = temps fixe (réglage, inchangé) + temps variable (MO+machine) × quantité client. Idempotent.
app.post('/api/be/analyse-dt/:id/generer-bdt', async (c) => {
  const id = c.req.param('id')
  const [dt, noms, existingBdt, existingBds, procs, existingLots] = await Promise.all([
    getDemandeTravaux(id).catch(() => null), getNomenclatures().catch(() => [] as any[]),
    getBonsDeTravail().catch(() => [] as any[]), getPlanningBDS().catch(() => [] as any[]),
    getProcessAtelier().catch(() => [] as any[]), getLots().catch(() => [] as any[])
  ])
  if (!dt) return c.json({ ok: false, error: 'DT introuvable' }, 404)
  // Process OAS = pas de BDT ; c'est un passage de lot (le BDT précédent soldé → lot à l'OAS).
  const oasProcIds = new Set((procs as any[]).filter((p: any) => p.est_oas).map((p: any) => String(p.id)))
  const byCode: Record<string, any> = {}
  for (const n of (noms as any[])) { if (n.statut !== 'valide') continue; const k = String(n.code_ref_produit || '').toLowerCase().trim(); if (!k) continue; const cur = byCode[k]; if (!cur || String(n.indice || 'A') > String(cur.indice || 'A')) byCode[k] = n }
  const aff = String((dt as any).num_affaire || (dt as any).id)
  const client = (dt as any).client_nom || ''
  const prio = (dt as any).priorite || 'normal'
  const san = (s: any) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 14)
  const bdtKey = new Set((existingBdt as any[]).map((b: any) => `${b.num_affaire}|${b.piece}|${b.seq}`))
  const bdsKey = new Set((existingBds as any[]).map((b: any) => `${b.cmd_ref}|${b.piece}|${b.seq}`))
  const pieces = Array.isArray((dt as any).pieces_detail) ? (dt as any).pieces_detail : []
  // Garde-fou : l'analyse n'est validable (génération BDT) que si TOUTES les pièces ont une nomenclature VALIDÉE
  // (un brouillon est visible dans l'analyse mais ne lance pas la production).
  const notReady = (pieces as any[]).filter((p: any) => !p.piece_existante_a_jour && !byCode[String(p.ref_interne || '').toLowerCase().trim()])
  if (notReady.length) return c.json({ ok: false, error: `Validez toutes les nomenclatures d'abord : ${notReady.length} pièce(s) sans nomenclature validée.` }, 409)
  let nb = 0, ns = 0, skipped = 0, sansNom = 0, oasGates = 0
  let pieceNum = 0
  for (const p of pieces) {
    const ref = String(p.ref_interne || '').toLowerCase().trim()
    const qte = Number(p.quantite) || 1
    const nom = ref ? byCode[ref] : null
    if (!nom) { sansNom++; continue }
    pieceNum++
    const act = nom.entite || (dt as any).activite || 'Seem'
    const pieceLbl = p.ref_interne || ref
    // lie le BDT au lot RÉEL s'il existe déjà (id exact) ; sinon calcule le format cible
    const exLot = (existingLots as any[]).find((l: any) => String(l.cmd_id || '').endsWith('-' + aff) && String(l.piece || '') === String(pieceLbl))
    const lotRef = exLot ? String(exLot.id) : fmtLotId(String(new Date().getFullYear()), aff, pieceNum)
    const _lm = String(lotRef).match(/^LOT-(\d{4})-.+-(\d{2,})$/)
    const yr = _lm ? _lm[1] : String(new Date().getFullYear())
    const zz = _lm ? Number(_lm[2]) : pieceNum
    let bdtNum = 0, bdsNum = 0
    const etapes = (Array.isArray(nom.etapes_production) ? nom.etapes_production : []).slice().sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
    // Repère les étapes OAS (est_oas sur l'étape OU process OAS) — elles NE créent PAS de BDT ;
    // elles agissent comme une porte de lot : le BDT juste avant est marqué oas_apres, celui juste après oas_avant.
    const oasFlags = etapes.map((e: any) => !!e.est_oas || (e.process_id && oasProcIds.has(String(e.process_id))))
    let idx = 0
    for (let i = 0; i < etapes.length; i++) {
      const e = etapes[i]
      idx++
      const seq = Number(e.ordre) || idx
      if (oasFlags[i]) { oasGates++; continue }
      const { reglageMin: reglage, varMin } = etapeTempsMin(e)
      const dureeH = +(((reglage + varMin * qte)) / 60).toFixed(3)
      const op = e.nom || e.process_nom || e.operation_st || 'Process'
      const k = `${aff}|${p.ref_interne || ref}|${seq}`
      const oasAvant = i > 0 && oasFlags[i - 1]   // ce BDT ne peut être reçu qu'une fois le lot passé à l'OAS
      const oasApres = i < etapes.length - 1 && oasFlags[i + 1]   // son soldage envoie le lot à l'OAS
      if (e.type === 'sous_traite') {
        bdsNum++
        if (bdsKey.has(k)) { skipped++; continue }
        await createBDSRow({ id: fmtBonId('BDS', yr, aff, zz, bdsNum), cmd_ref: aff, lot_ref: lotRef, client_nom: client, piece: p.ref_interne || ref, qte, operation: op, sous_traitant_id: e.fournisseur_st_id || null, duree_days: Math.max(1, Math.ceil(dureeH / 7)), statut: 'a_planifier', seq }).catch(() => {})
        ns++
      } else {
        bdtNum++
        if (bdtKey.has(k)) { skipped++; continue }
        await createBDTRow({ id: fmtBonId('BDT', yr, aff, zz, bdtNum), num_affaire: aff, cmd_ref: aff, lot_ref: lotRef, client_nom: client, piece: p.ref_interne || ref, operation: op, machine_id: e.machine_id || null, process_id: e.process_id || null, seq, duree: dureeH, temps_alloue: dureeH, statut: 'programme', priorite: prio, activite: act, oas_avant: oasAvant, oas_apres: oasApres }).catch(() => {})
        nb++
      }
    }
  }
  return c.json({ ok: true, bdt: nb, bds: ns, skipped, sansNom, oasGates })
})

// ══ GED : upload / ouverture / liste / suppression de documents (plans, CAO, FAO) ══
app.post('/api/ged/upload', async (c) => {
  const form = await c.req.formData().catch(() => null)
  if (!form) return c.json({ ok: false, error: 'Formulaire invalide' }, 400)
  const file: any = form.get('file')
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return c.json({ ok: false, error: 'Aucun fichier reçu' }, 400)
  // « ref » permet de rattacher un document a autre chose qu'une nomenclature — par
  // exemple « BC:BC-2026-002 » pour la facture jointe a un bon de commande. La colonne
  // nomenclature_id sert de proprietaire generique : elle ne porte aucune contrainte,
  // et le prefixe evite toute collision avec un identifiant de nomenclature.
  const refGenerique = String(form.get('ref') || '').trim()
  const nomenclatureId = refGenerique || String(form.get('nomenclature_id') || '').trim()
  if (!nomenclatureId) return c.json({ ok: false, error: 'Enregistrez la fiche avant de joindre des fichiers.' }, 400)
  const CATS = ['plan_client', 'plan_cao', 'programme_fao', 'analyse_dt', 'facture_fournisseur', 'autre']
  const categorie = CATS.includes(String(form.get('categorie'))) ? String(form.get('categorie')) : 'autre'
  const eoRaw = form.get('etape_ordre')
  const etape_ordre = (eoRaw != null && eoRaw !== '') ? Number(eoRaw) : null
  const fichierNom = String(file.name || form.get('fichier_nom') || 'document')
  const mime = String(file.type || 'application/octet-stream')
  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > 52428800) return c.json({ ok: false, error: 'Fichier trop volumineux (max 50 Mo).' }, 400)
  const user = (c as any).get('user')
  const safe = fichierNom.replace(/[^a-zA-Z0-9._-]/g, '_')
  const dossier = nomenclatureId.replace(/[^a-zA-Z0-9._-]/g, '_')   // « BC:BC-2026-002 » → « BC_BC-2026-002 »
  const path = `${dossier}/${categorie}/${crypto.randomUUID()}_${safe}`
  const { error: upErr } = await uploadGedFile(path, bytes, mime)
  if (upErr) return c.json({ ok: false, error: 'Stockage : ' + (upErr.message || String(upErr)) }, 400)
  const { data, error } = await createDocument({
    categorie, nomenclature_id: nomenclatureId, etape_ordre,
    fichier_nom: fichierNom, storage_path: path, mime, taille: bytes.byteLength,
    uploaded_par: user?.nom || user?.mat || null,
  })
  if (error) { try { await removeGedFile(path) } catch {} ; return c.json({ ok: false, error: error.message }, 400) }
  return c.json({ ok: true, document: data })
})
app.get('/api/ged/nomenclature/:id', async (c) => {
  return c.json({ ok: true, documents: await getDocumentsForNom(c.req.param('id')) })
})
// Documents rattaches a un objet non-nomenclature (ex. /api/ged/ref/BC:BC-2026-002).
app.get('/api/ged/ref/:ref', async (c) => {
  return c.json({ ok: true, documents: await getDocumentsForNom(decodeURIComponent(c.req.param('ref'))) })
})
// Sert le fichier GED. ⚠ On ne REDIRIGE PAS vers l'URL signée : celle-ci est bâtie sur
// SUPABASE_URL, qui vaut « http://kong:8000 » dans la stack Docker — un nom résolu
// UNIQUEMENT à l'intérieur du réseau Docker. Le navigateur de l'utilisateur recevait donc
// une redirection vers un hôte inexistant : aucun plan, aucun document, aucun fond de
// maquette bâtiment ne s'affichait en local (l'écran paraissait cassé alors que la donnée
// était intacte). On récupère le fichier côté serveur et on le renvoie : cela marche dans
// TOUS les environnements et garde le fichier derrière l'authentification de l'ERP.
app.get('/api/ged/file/:id', async (c) => {
  const doc = await getDocument(c.req.param('id'))
  if (!doc || doc.actif === false) return c.text('Document introuvable', 404)
  const { url, error } = await signedGedUrl(doc.storage_path, 3600)
  if (error || !url) return c.text('Lien indisponible', 500)
  try {
    const amont = await fetch(url)
    if (!amont.ok || !amont.body) return c.text('Fichier indisponible (' + amont.status + ')', 502)
    const h = new Headers()
    h.set('Content-Type', doc.mime || amont.headers.get('content-type') || 'application/octet-stream')
    const len = amont.headers.get('content-length'); if (len) h.set('Content-Length', len)
    // `inline` : les images et PDF s'affichent dans l'onglet au lieu de se télécharger.
    h.set('Content-Disposition', 'inline; filename="' + String(doc.fichier_nom || 'document').replace(/["\r\n]/g, '') + '"')
    h.set('Cache-Control', 'private, max-age=300')
    return new Response(amont.body, { status: 200, headers: h })
  } catch {
    return c.text('Fichier injoignable', 502)
  }
})
app.delete('/api/ged/:id', async (c) => {
  const doc = await getDocument(c.req.param('id'))
  if (!doc) return c.json({ ok: false, error: 'Introuvable' }, 404)
  await softDeleteDocument(doc.id)
  try { await removeGedFile(doc.storage_path) } catch { /* best-effort */ }
  return c.json({ ok: true })
})

// ══ Maquette bâtiment : page + plans + marqueurs ══
app.get('/plans/service', async (c) => {
  const [plans, machines, atex, chimie, vgp, perissables, postes, procs, machinesOpex, expositions, ecme, dechets] = await Promise.all([
    getPlansBatiment().catch(() => [] as any[]),
    getMachines().catch(() => [] as any[]),
    getHseAtexZones().catch(() => [] as any[]),
    getHseChimiques().catch(() => [] as any[]),
    getHseVerifications().catch(() => [] as any[]),
    getProduitsPerissables().catch(() => [] as any[]),
    getPostes().catch(() => [] as any[]),
    getProcessAtelier().catch(() => [] as any[]),
    getMachinesOpex().catch(() => [] as any[]),
    getHseExpositions().catch(() => [] as any[]),
    getEcme().catch(() => [] as any[]), getHseDechets().catch(() => [] as any[]),
  ])
  // Stats par POSTE (process contenus + machines + taux effectif + OPEX théorique) → alimentent les repères « poste » du plan (survol).
  const rates = computePosteRates(machines as any[], machinesOpex as any[], postes as any[], Number(TODAY_ISO().slice(0, 4)))
  const postesStats = (postes as any[]).map((p: any) => {
    const pid = String(p.id)
    const pMach = (machines as any[]).filter((m: any) => String(m.poste_id ?? '') === pid)
    const pProc = (procs as any[]).filter((pr: any) => String(pr.poste_id ?? '') === pid)
    const opexTheo = pMach.reduce((s: number, m: any) => s + (Number(m.cout_h ?? m.taux_horaire) || 0) * (Number(m.capacite_h) || 0) * 220, 0)
    const r = (rates as any).byPoste[pid]
    return {
      id: p.id, nom: p.nom, couleur: p.couleur || null, activite: p.activite || '',
      nbMachines: pMach.length, machines: pMach.map((m: any) => m.nom).filter(Boolean),
      nbProcess: pProc.length, process: pProc.map((pr: any) => pr.nom).filter(Boolean),
      taux: r ? Math.round(r.tauxEffectif * 100) / 100 : 0,
      opexTheo: Math.round(opexTheo),
    }
  })
  return c.html(pageServicePlans({ plans, machines, atex, chimie, vgp, perissables, postes: postesStats, expositions, ecme, dechets }))
})
app.post('/api/plans', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const nom = String(b.nom || '').trim()
  if (!nom) return c.json({ ok: false, error: 'Nom du plan requis' }, 400)
  const { data, error } = await createPlanBatiment({ nom, entite: b.entite || null, notes: b.notes || null })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, plan: data })
})
app.patch('/api/plans/:id', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['nom', 'entite', 'image_doc_id', 'notes', 'actif']) if (k in b) patch[k] = b[k]
  const { data, error } = await updatePlanBatiment(c.req.param('id'), patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, plan: data })
})
app.get('/api/plans/:id/marqueurs', async (c) => {
  return c.json({ ok: true, marqueurs: await getMarqueurs(c.req.param('id')) })
})
app.post('/api/plans/:id/marqueurs', async (c) => {
  const planId = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const marqueurs = Array.isArray(b.marqueurs) ? b.marqueurs : []
  const FIELDS = ['type', 'x', 'y', 'w', 'h', 'label', 'ref_table', 'ref_id', 'couleur', 'icone', 'notes']
  const num = (v: any) => (v == null || v === '') ? null : Number(v)
  let saved = 0
  for (const m of marqueurs) {
    const payload: any = { plan_id: planId }
    for (const k of FIELDS) if (k in m) payload[k] = (k === 'x' || k === 'y' || k === 'w' || k === 'h') ? num(m[k]) : m[k]
    if (m.id && !String(m.id).startsWith('tmp-')) await updateMarqueur(String(m.id), payload)
    else await createMarqueur(payload)
    saved++
  }
  const del = Array.isArray(b.supprimes) ? b.supprimes : []
  for (const id of del) if (id && !String(id).startsWith('tmp-')) await deleteMarqueur(String(id))
  return c.json({ ok: true, saved, supprimes: del.length })
})
app.delete('/api/plans/marqueur/:id', async (c) => {
  const { error } = await deleteMarqueur(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})
// ── Interop plan → ERP : créer une entité HSE (zone ATEX / vérification-extincteur VGP) depuis la maquette.
// Écrit dans les MÊMES tables que le module Sécurité (hse_atex_zones / hse_verifications) : l'enregistrement
// apparaît donc aussitôt dans l'onglet Sécurité, et le catalogue du plan le propose. Gated « plans » (BE/Prod/Maint/Qualité).
app.post('/api/plans/entity', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const kind = String(b.kind || '')
  const pick = (ks: string[]) => { const o: any = {}; for (const k of ks) if (k in b && b[k] !== '' && b[k] != null) o[k] = b[k]; return o }
  if (kind === 'atex') {
    const p = pick(['entite', 'nom', 'type_zone', 'localisation', 'origine_risque', 'substances', 'materiel_requis', 'mesures', 'date_revue'])
    if (!p.nom) return c.json({ ok: false, error: 'Nom de la zone requis.' }, 400)
    const { data, error } = await createHseAtexZone(p)
    if (error || !data) return c.json({ ok: false, error: (error && error.message) || 'Échec.' }, 400)
    return c.json({ ok: true, kind, entity: { id: data.id, nom: data.nom, table: 'hse_atex_zones' } })
  }
  if (kind === 'vgp') {
    const p = pick(['entite', 'type', 'equipement', 'organisme', 'date_controle', 'date_prochaine', 'periodicite_mois', 'resultat', 'statut'])
    if (!p.equipement) return c.json({ ok: false, error: 'Équipement requis.' }, 400)
    if (!p.statut) p.statut = 'a_prevoir'
    const { data, error } = await createHseVerification(p)
    if (error || !data) return c.json({ ok: false, error: (error && error.message) || 'Échec.' }, 400)
    return c.json({ ok: true, kind, entity: { id: data.id, nom: data.equipement, table: 'hse_verifications' } })
  }
  return c.json({ ok: false, error: 'Type inconnu.' }, 400)
})

// ── Interop réf BE → catalogue fournisseur (point 9) ──
// Chaque matière/accessoire déclarée dans une nomenclature (réf + fournisseur connu) alimente
// automatiquement produits_fournisseurs (source 'be'). N'écrit le prix que si > 0, sinon l'entrée
// reste « en attente de prix ». On n'upsert QUE si le fournisseur est résolu (évite les doublons à réf null).
async function syncFournituresToCatalogue(fournitures: any[], entite: string) {
  if (!Array.isArray(fournitures) || !fournitures.length) return
  let fournisseurs: any[] = []
  try { fournisseurs = await getFournisseurs() } catch { return }
  const byNom = new Map(fournisseurs.map((f: any) => [String(f.nom || '').trim().toLowerCase(), f]))
  const activite = entite === 'Semrac' ? 'Semrac' : (entite === 'Seem' ? 'Seem' : 'both')
  for (const f of fournitures) {
    const reference = String(f.ref_stock || '').trim()
    const fournNom = String(f.fournisseur || '').trim()
    if (!reference || !fournNom) continue
    const fo = byNom.get(fournNom.toLowerCase())
    if (!fo?.id) continue   // fournisseur inconnu → à créer d'abord (cf. point 8), on n'écrit pas de réf orpheline
    const prix = (f.prix_unitaire != null && Number(f.prix_unitaire) > 0) ? Number(f.prix_unitaire) : null
    try {
      await upsertProduitFournisseur({
        fournisseur_id: fo.id, fournisseur_nom: fo.nom || fournNom,
        reference, designation: String(f.designation || '').trim() || reference,
        categorie: f.type_fourniture === 'accessoire' ? 'accessoire' : 'matiere_premiere',
        prix, devise: 'EUR', date_prix: prix != null ? TODAY_ISO() : null,
        source_prix: 'be', statut: prix != null ? 'actif' : 'en_attente_prix', activite,
      })
    } catch { /* n'échoue pas la nomenclature pour ça */ }
  }
}

app.post('/api/nomenclature', async (c) => {
  const payload = await c.req.json()
  // strip client-side id + temps calculés côté client (non colonnes) ; etapes_production est désormais persisté (colonne jsonb)
  const { fournitures, id: _id, temps_reglage_total_min: _tr, temps_unitaire_total_min: _tu, ...nomPayload } = payload
  // N3 : num_nom = réf. pièce saisie manuellement ; auto-génération seulement en secours si vide
  if (!nomPayload.num_nom || !String(nomPayload.num_nom).trim()) {
    const year = new Date().getFullYear()
    const existing = await getNomenclatures()
    const thisYear = existing.filter((n: any) => (n.num_nom ?? '').startsWith(`NOM-${year}-`))
    const next = String(thisYear.length + 1).padStart(3, '0')
    nomPayload.num_nom = `NOM-${year}-${next}`
  }
  // Unicité : une réf (code_ref_produit) à un indice donné (par entité) ne doit exister qu'UNE fois.
  //   - un BROUILLON de même réf+indice existe → on l'ÉCRASE (reste brouillon), pas de doublon.
  //   - un VALIDÉ de même réf+indice existe → refus : il faut créer une révision (nouvel indice).
  const _code = String(nomPayload.code_ref_produit || nomPayload.num_nom || '').trim()
  const _indice = String(nomPayload.indice || 'A').trim()
  if (_code) {
    const _same = (await getNomenclatures()).filter((n: any) =>
      String(n.code_ref_produit || n.num_nom || '').trim().toLowerCase() === _code.toLowerCase() &&
      String(n.indice || 'A').trim() === _indice &&
      (!nomPayload.entite || String(n.entite || '') === String(nomPayload.entite)))
    const _draft = _same.find((n: any) => (n.statut || 'brouillon') === 'brouillon')
    const _valide = _same.find((n: any) => n.statut === 'valide')
    if (_draft) {
      const { data, error } = await updateNomenclature(_draft.id, nomPayload)
      if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Erreur mise à jour brouillon' })
      if (fournitures) await upsertFournitures(_draft.id, fournitures)
      await syncFournituresToCatalogue(fournitures, nomPayload.entite)
      return c.json({ ok: true, id: _draft.id, num_nom: data.num_nom ?? nomPayload.num_nom, updated: true })
    }
    if (_valide) {
      return c.json({ ok: false, error: 'Une nomenclature validée existe déjà pour la réf ' + _code + ' à l\'indice ' + _indice + '. Créez une révision (nouvel indice) plutôt qu\'un doublon.' }, 409)
    }
  }
  const { data, error } = await createNomenclature(nomPayload)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Erreur creation nomenclature' })
  if (fournitures?.length) await upsertFournitures(data.id, fournitures)
  await syncFournituresToCatalogue(fournitures, nomPayload.entite)   // point 9 : réf BE → catalogue fournisseur
  // Chaînage : si créée directement comme validée, vérifier les DT liées
  if (data.statut === 'valide' && data.num_affaire) {
    try {
      const allNoms = await getNomenclatures()
      const validCodes = new Set(
        allNoms.filter(n => n.num_affaire === data.num_affaire && n.statut === 'valide')
               .map(n => (n.code_ref_produit ?? '').toLowerCase())
      )
      const allDts = await getDemandesTravaux()
      const dts = allDts.filter(d => d.num_affaire === data.num_affaire && d.statut === 'en_attente_nomenclature')
      for (const dt of dts) {
        const pieces: any[] = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
        const required = pieces.filter(p => !p.piece_existante_a_jour)
        const covered = required.filter(p => validCodes.has((p.ref_interne ?? '').toLowerCase()))
        if (required.length > 0 && covered.length >= required.length) {
          await updateDemandeTravaux(dt.id, { statut: 'en_attente_be' })
        }
      }
    } catch { /* ignore */ }
  }
  return c.json({ ok: true, id: data.id, num_nom: data.num_nom ?? nomPayload.num_nom })
})

app.put('/api/nomenclature/:id', async (c) => {
  const id = c.req.param('id')
  const payload = await c.req.json()
  // strip temps calculés côté client (non colonnes) ; etapes_production est persisté (colonne jsonb)
  const { fournitures, temps_reglage_total_min: _tr, temps_unitaire_total_min: _tu, ...nomPayload } = payload
  const { data, error } = await updateNomenclature(id, nomPayload)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Erreur mise à jour nomenclature' })
  if (fournitures) await upsertFournitures(id, fournitures)
  await syncFournituresToCatalogue(fournitures, nomPayload.entite)   // point 9 : réf BE → catalogue fournisseur
  // Chaînage automatique : si la nomenclature est validée et liée à une DT en attente,
  // on vérifie si toutes les pièces de la DT ont leur nomenclature validée → bascule en analyse BE
  if (data.statut === 'valide' && data.num_affaire) {
    try {
      const allNoms = await getNomenclatures()
      const validCodes = new Set(
        allNoms.filter(n => n.num_affaire === data.num_affaire && n.statut === 'valide')
               .map(n => (n.code_ref_produit ?? '').toLowerCase())
      )
      const allDts = await getDemandesTravaux()
      const dts = allDts.filter(d => d.num_affaire === data.num_affaire && d.statut === 'en_attente_nomenclature')
      for (const dt of dts) {
        const pieces: any[] = Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []
        const required = pieces.filter(p => !p.piece_existante_a_jour)
        const covered = required.filter(p => validCodes.has((p.ref_interne ?? '').toLowerCase()))
        if (required.length > 0 && covered.length >= required.length) {
          await updateDemandeTravaux(dt.id, { statut: 'en_attente_be' })
        }
      }
    } catch { /* on n'échoue pas la requête nomenclature pour ça */ }
  }
  return c.json({ ok: true, id, num_nom: data.num_nom })
})

// ─── Préparation technique : saisie des codes programme CN par étape (merge dans etapes_production) ───
// Ne touche QUE programme/programme_fichier des étapes ciblées (par ordre) ; préserve toute la gamme.
app.post('/api/nomenclature/:id/programmes', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const progs: any[] = Array.isArray(b.programmes) ? b.programmes : []
  const noms = await getNomenclatures().catch(() => [] as any[])
  const nom = (noms as any[]).find((n: any) => String(n.id) === String(id))
  if (!nom) return c.json({ ok: false, error: 'Nomenclature introuvable' }, 404)
  const byOrdre: Record<string, any> = {}
  progs.forEach((p: any) => { if (p && p.ordre != null) byOrdre[String(p.ordre)] = p })
  const etapes = Array.isArray(nom.etapes_production) ? nom.etapes_production : []
  let n = 0
  const updated = etapes.map((e: any) => {
    const p = byOrdre[String(e.ordre)]
    if (!p) return e
    n++
    return { ...e, programme: p.programme != null ? String(p.programme) : (e.programme || ''), programme_fichier: p.programme_fichier != null ? String(p.programme_fichier) : (e.programme_fichier || '') }
  })
  const patch: any = { etapes_production: updated }
  if ('num_plan' in b) patch.num_plan = b.num_plan ? String(b.num_plan) : null       // plan de la pièce (n° + indice)
  if ('plan_fichier' in b) patch.plan_fichier = b.plan_fichier ? String(b.plan_fichier) : null
  const { error } = await updateNomenclature(id, patch as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, count: n })
})

// Crée une nouvelle révision (indice A→B→C…) d'une nomenclature : l'ancienne version est conservée,
// la nouvelle reprend tous les champs + les modifications, avec le même version_groupe et l'indice suivant.
app.post('/api/nomenclature/:id/nouvel-indice', async (c) => {
  const id = c.req.param('id')
  const payload = await c.req.json().catch(() => ({} as any))
  const { fournitures, temps_reglage_total_min: _tr, temps_unitaire_total_min: _tu,
          id: _id, created_at: _ca, updated_at: _ua, indice: _i, version_groupe: _vg, ...over } = payload
  const all = await getNomenclatures()
  const base: any = (all as any[]).find(n => String(n.id) === String(id))
  if (!base) return c.json({ ok: false, error: 'Nomenclature introuvable' }, 404)
  const groupe = base.version_groupe || base.id
  const versions = (all as any[]).filter(n => (n.version_groupe || n.id) === groupe)
  const maxCode = versions.reduce((m, n) => Math.max(m, String(n.indice || 'A').toUpperCase().charCodeAt(0)), 64)
  const nextIndice = String.fromCharCode(maxCode + 1)
  const { id: _bid, created_at: _bca, updated_at: _bua, ...baseFields } = base
  const newRow: any = {
    ...baseFields, ...over,
    version_groupe: groupe,
    indice: nextIndice,
    statut: over.statut || 'en_cours',
  }
  const { data, error } = await createNomenclature(newRow)
  if (error || !data) return c.json({ ok: false, error: error?.message ?? 'Erreur création révision' })
  if (Array.isArray(fournitures) && fournitures.length) {
    await upsertFournitures(data.id, fournitures)
  } else {
    // Aucune fourniture fournie (création depuis la liste) → clone celles de la révision précédente
    const baseFournitures = await getFournitures(id).catch(() => [] as any[])
    if (baseFournitures.length) {
      const cloned = (baseFournitures as any[]).map(({ id: _fid, created_at: _fca, nomenclature_id: _nid, ...rest }) => rest)
      await upsertFournitures(data.id, cloned)
    }
  }
  return c.json({ ok: true, data, indice: nextIndice, num_nom: data.num_nom })
})

app.delete('/api/nomenclature/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await deleteNomenclature(id)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})

app.get('/be/analyse', async (c) => {
  // Si ?dt=DT-YYYY-NNNN est présent, on charge la DT pour pré-remplir l'analyse
  const dtId = c.req.query('dt') ?? ''
  const [dtForAnalysis, salaries, beRefs] = await Promise.all([
    dtId ? getDemandeTravaux(dtId).catch(() => null) : Promise.resolve(null),
    getSalaries().catch(() => [] as any[]),
    getBeRefs().catch(() => ({ postes: [], process_atelier: [], machines: [] } as any)),
  ])
  const dtJson = JSON.stringify(dtForAnalysis ?? null).replace(/</g, '\\u003c')   // anti-breakout </script> + XSS stocké depuis les champs DT
  // Référentiels atelier (postes + process du poste + machines) → alimentent les selects « Poste » / « Process » de la gamme ajoutée
  const beRefsJson = JSON.stringify({
    postes: ((beRefs as any).postes || []).map((p: any) => ({ id: p.id, nom: p.nom, activite: p.activite })),
    process_atelier: ((beRefs as any).process_atelier || []).map((p: any) => ({ id: p.id, nom: p.nom, poste_id: p.poste_id ?? null, machine_id: p.machine_id ?? null })),
    machines: ((beRefs as any).machines || []).map((m: any) => ({ id: m.id, nom: m.nom })),
  }).replace(/</g, '\\u003c')
  // Analystes BE = salariés dont un rôle donne l'accès BE en écriture (bei) + direction — même règle que /be/service
  const BE_ROLES = new Set(['bei', 'direction'])
  const _escB = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const beUsers = Array.from(new Set((salaries as any[])
    .filter((s: any) => s.actif !== false && [s.role, ...(Array.isArray(s.roles) ? s.roles : [])].some((r: any) => BE_ROLES.has(String(r))))
    .map((s: any) => `${s.prenom || ''} ${s.nom || ''}`.trim())
    .filter((n: string) => !!n)))
  const beUserOptions = beUsers.map((n: string) => `<option value="${_escB(n)}">${_escB(n)}</option>`).join('')
  const NORMATIVES = ['ISO 9001', 'EN 9100', 'REACH', 'RoHS', 'EN 13485']   // mêmes exigences normatives que la DT
  const normativesJson = JSON.stringify(NORMATIVES)
  // Vraies listes déroulantes (valeurs choisissables, reliées à la base à la sauvegarde)
  const _opt = (o: any) => { const v = Array.isArray(o) ? o[0] : o; const l = Array.isArray(o) ? o[1] : o; return `<option value="${_escB(v)}">${_escB(l)}</option>` }
  const _selField = (label: string, id: string, opts: any[], required = false, ph = '— Choisir —') =>
    `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">${label}${required ? '<span style="color:#ef4444;margin-left:2px;">*</span>' : ''}</label>`
    + `<select id="${id}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;"><option value="">${_escB(ph)}</option>`
    + opts.map(_opt).join('') + `</select></div>`
  const PRIORITES = [['normal', 'Standard'], ['urgent', 'Urgent'], ['critique', 'Critique']]   // valeurs alignées sur la DB
  const TYPES_DEMANDE = ['Commande ferme', 'Prototype', 'Essai', 'Réclamation']
  const FAISABILITES = ['Faisable sans réserve', 'Faisable avec adaptation', 'Non faisable – alternative proposée']
  const DECISIONS = ['✅ Faisable – Offre à établir', '⚠ Faisable avec réserves – Points à clarifier', '❌ Non faisable – Alternative proposée']
  const content = `
  ${pageHeader('fas fa-drafting-compass','#6366f1,#4338ca','Analyse Technique DT – Bureau d\'Études','Joël / David · Multi-produits · CRU détaillé · Gamme opératoire · EN9100 7.3',['BE','CRU','ISO 7.3'])}
  <div style="padding:22px 30px;">

    <!-- ENTÊTE DT -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-search" style="color:#6366f1;"></i> Référence DT à analyser
        <span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;">
        ${field('N° DT à analyser','text','DT-2026-XXX')}
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Analyste BE<span style="color:#ef4444;margin-left:2px;">*</span></label>
          <select id="be-analyste" name="analyste_be" required style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;">
            <option value="">— Analyste BE —</option>
            ${beUserOptions}
          </select>
        </div>
        ${field('Date analyse','date','')}
        ${_selField('Priorité','be-priorite',PRIORITES)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;">
        ${field('Client','text','Raison sociale')}
        ${_selField('Type demande','be-type-demande',TYPES_DEMANDE)}
      </div>
    </div>

    <!-- SECTION MULTI-PRODUITS -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;" id="produitsSection">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-boxes" style="color:#6366f1;"></i> Produits analysés
          <span style="height:1px;width:60px;background:#f1f5f9;display:block;margin-left:8px;"></span>
        </div>
        <button id="btn-add-produit" type="button" onclick="addProduit()" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;padding:8px 16px;border-radius:10px;font-weight:700;font-size:.78rem;border:none;cursor:pointer;">
          <i class="fas fa-plus"></i> Ajouter un produit
        </button>
      </div>
      <div id="produitsList"></div>
      <datalist id="dt-refint-dl"></datalist>
      <datalist id="dt-plan-dl"></datalist>
      <datalist id="dt-client-dl"></datalist>
    </div>

    <!-- SYNTHÈSE MULTI-PRODUITS -->
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:14px;padding:20px;margin-bottom:16px;color:white;" id="synthese">
      <div style="font-size:.8rem;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-chart-bar"></i> Synthèse multi-produits – DT Consolidée
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:.62rem;opacity:.7;margin-bottom:4px;">Nb produits analysés</div>
          <div style="font-size:1.4rem;font-weight:900;" id="synth-nb">0</div>
        </div>
        <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:12px;text-align:center;border:1px solid rgba(255,255,255,.3);">
          <div style="font-size:.62rem;opacity:.7;margin-bottom:4px;">Coût total de la DT (CRU série)</div>
          <div style="font-size:1.4rem;font-weight:900;" id="synth-cru">0.00 €</div>
        </div>
        <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:.62rem;opacity:.7;margin-bottom:4px;">Temps total (série)</div>
          <div style="font-size:1.4rem;font-weight:900;" id="synth-tps">— min</div>
        </div>
      </div>
    </div>

    <!-- FAISABILITÉ TECHNIQUE (sous les process) -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-check-circle" style="color:#22c55e;"></i> Analyse de faisabilité technique
        <span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span>
      </div>
      ${_selField('Faisabilité','be-faisabilite',FAISABILITES,true)}
      <div style="margin-top:12px;">
        <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;">Commentaires <span style="font-weight:600;text-transform:none;color:#9ca3af;">(risques techniques, réserves, conditions particulières, exigences BE, habilitations requises…)</span></label>
        <textarea id="be-commentaire" rows="3" placeholder="Risques, réserves, conditions particulières, éléments pour l'offre commerciale…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;resize:vertical;"></textarea>
      </div>
      <div style="margin-top:12px;">
        <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;"><i class="fas fa-paperclip" style="color:#6366f1;margin-right:4px;"></i>Pièces jointes complémentaires pour l'offre de prix <span style="font-weight:600;text-transform:none;color:#9ca3af;">(documents rangés dans la GED, dossier « analyse DT »)</span></label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#f8fafc;border:1.5px dashed #c7d2fe;border-radius:10px;padding:10px 12px;">
          <input type="file" id="be-ged-file" style="font-size:.78rem;flex:1;min-width:180px;"/>
          <button type="button" onclick="gedAnalyseUpload()" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:8px;padding:7px 14px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-cloud-arrow-up" style="margin-right:5px;"></i>Joindre le document</button>
          <span id="be-ged-hint" style="font-size:.7rem;color:#94a3b8;"></span>
        </div>
        <div id="be-ged-list" style="margin-top:8px;"></div>
      </div>
    </div>

    <!-- CONCLUSION BE -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-stamp" style="color:#6366f1;"></i> Conclusion & transmission
        <span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:8px;"></span>
      </div>
      ${_selField('Décision BE','be-decision',DECISIONS,true)}
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
        <a id="be-back-link" href="/be/service#analyse" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 20px;font-size:.82rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-arrow-left"></i>Retour</a>
        <button type="button" id="be-save-analyse-btn" onclick="saveAnalyseBE()"
          style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;padding:11px 30px;border-radius:12px;font-weight:700;font-size:.88rem;border:none;cursor:pointer;box-shadow:0 2px 12px #6366f144;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-check-circle"></i> Valider l'analyse BE complète
        </button>
      </div>
    </div>

  </div>
  <script>
  // DT chargée depuis le serveur (?dt=DT-YYYY-NNNN) — null si l'on ouvre /be/analyse en standalone
  window.__DT_FOR_ANALYSIS__ = ${dtJson};
  window.__BE_NORMATIVES__ = ${normativesJson};
  window.__BE_REFS__ = ${beRefsJson};
  </script>
  <script>
  (function(){
  var prodCount = 0;
  var GAM = {};   // n -> { nom:[etapes verrouillées], added:[étapes ajoutées], nextId, qte, tauxMo, tauxMach, baseMo }
  // Grille identique à la gamme de la nomenclature (be.tsx) : N° · Type · Poste · Process · Régl ‰h · MO ‰h · Mach ‰h · Coût/pc · [×]
  var GRID = "34px 84px 1fr 1.2fr 62px 62px 66px 92px 26px";
  var BE_REFS = (window.__BE_REFS__)||{postes:[],process_atelier:[],machines:[]};
  function _gamPostes(){ return BE_REFS.postes||[]; }
  function _gamProcs(pid){ return (BE_REFS.process_atelier||[]).filter(function(p){ return String(p.poste_id||'')===String(pid||''); }); }
  function _gamMachNom(mid){ var m=(BE_REFS.machines||[]).find(function(x){return String(x.id)===String(mid);}); return m?m.nom:''; }
  var INP = "border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.74rem;background:white;outline:none;width:100%;min-width:0;box-sizing:border-box;";
  var INPRO = "border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.74rem;background:#eef2f7;color:#334155;outline:none;width:100%;min-width:0;box-sizing:border-box;";

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function mille(m){ return Math.round((Number(m)||0)*1000/60*10)/10; }   // minutes -> millièmes d'heure
  function fromMille(x){ return (Number(x)||0)*60/1000; }                 // millièmes d'heure -> minutes
  function fmtNum(x){ return (Math.round((Number(x)||0)*1000)/1000).toLocaleString('fr-FR'); }
  function byId(id){ return document.getElementById(id); }
  function setVal(id,v){ var e=byId(id); if(e&&v!=null&&v!=='') e.value=v; }
  function getVal(id){ var e=byId(id); return e?e.value:''; }
  function getAf(bl,f){ var e=bl.querySelector("[data-af='"+f+"']"); return e?e.value:''; }
  function setAf(bl,f,v){ var e=bl.querySelector("[data-af='"+f+"']"); if(e) e.value=(v==null?'':v); }

  // ── CHIFFRAGE : coûts AUTO (matière/accessoire/MO+machine/S-trait.), seuls frais généraux + marge saisis, UN prix par quantité ──
  function addedCostOf(n){ return (GAM[n] && GAM[n].addedCost) ? Number(GAM[n].addedCost) || 0 : 0; }
  // Coût/pièce des étapes AJOUTÉES pour une quantité q (variable + réglage amorti sur le lot)
  function beAddedPerPiece(n,q){ var g=GAM[n]||{}; q=q||1; var add=0; (g.added||[]).forEach(function(a){ add += addedCostPc(n,a) + ((Number(a.reglage_min)||0)/60*(g.tauxMo||45))/q; }); return add; }
  // Quantités à chiffrer d'un produit (au moins la principale) + quantité principale (DT)
  function beQtes(n){ var g=GAM[n]||{}; return (g.qtes&&g.qtes.length)?g.qtes:[g.qte||1]; }
  function beMainQte(n){ var g=GAM[n]||{}; var q=g.qte||1; var qs=beQtes(n); return (qs.indexOf(q)>=0)?q:qs[0]; }
  // Décomposition de prix par pièce pour une quantité q : matière/accessoire constants ; MO+machine/S-trait. baissent (réglage amorti)
  function beRowFor(n,q){
    var g=GAM[n]||{}; var results=(g.results&&g.results.length)?g.results:[]; var r=null;
    for(var i=0;i<results.length;i++){ if(Number(results[i].quantite)===Number(q)){ r=results[i]; break; } }
    if(!r) r={ matiere_pc:0, accessoire_pc:0, mo_pc:0, st_pc:0 };
    var fg=parseFloat(getVal('cru-fg-'+n))||0;   // frais généraux = coût PAR LOT (une seule fois, amorti sur la quantité)
    var mat=Number(r.matiere_pc)||0, acc=Number(r.accessoire_pc)||0;
    var mo=(Number(r.mo_pc)||0)+beAddedPerPiece(n,q), st=Number(r.st_pc)||0;
    var Q=Number(q)||1;
    var fgPc=Q>0?fg/Q:fg;                         // part des frais généraux par pièce (lot amorti)
    var cru=mat+acc+mo+st+fgPc;                   // CRU par pièce (pas de marge : elle est fixée dans l'offre de prix)
    // Totaux SÉRIE EXACTS depuis le serveur (matière linéaire, accessoires en paquets indivisibles, MO+machine avec
    // réglage fixe/lot) ; repli sur par-pièce × q si la ligne n'a pas de série (cas synthétisé sans nomenclature live).
    var addS=beAddedPerPiece(n,q)*Q;   // étapes ajoutées : variable × q + réglage compté 1 fois
    var matS=(r.matiere_serie!=null)?Number(r.matiere_serie):mat*Q;
    var accS=(r.accessoire_serie!=null)?Number(r.accessoire_serie):acc*Q;
    var moS=(r.mo_serie!=null)?(Number(r.mo_serie)+addS):mo*Q;
    var stS=(r.st_serie!=null)?Number(r.st_serie):st*Q;
    var fgS=fg, cruS=matS+accS+moS+stS+fg;        // frais généraux comptés UNE fois par lot
    return { q:q, mat:mat, acc:acc, mo:mo, st:st, fg:fg, fgPc:fgPc, cru:cru,
             matS:matS, accS:accS, moS:moS, stS:stS, fgS:fgS, cruS:cruS };
  }
  function beRenderResults(n){
    var g=GAM[n]; if(!g) return; var host=byId('results-'+n); if(!host) return;
    var qs=beQtes(n), mainQ=beMainQte(n);
    var th=function(t,r){ return "<th style='padding:6px 7px;font-size:.56rem;font-weight:800;color:#64748b;text-transform:uppercase;text-align:"+(r?'right':'left')+";white-space:nowrap;'>"+t+"</th>"; };
    var rows=qs.map(function(q){
      var d=beRowFor(n,q), hl=(Number(q)===Number(mainQ));
      var td="padding:6px 7px;font-size:.72rem;text-align:right;color:#334155;white-space:nowrap;";
      return "<tr style='border-top:1px solid #e2e8f0;"+(hl?"background:#eff6ff;":"")+"'>"
        + "<td style='padding:6px 7px;font-size:.74rem;font-weight:800;color:#1d4ed8;text-align:left;white-space:nowrap;'>"+fmtNum(q)+(hl?" <span style='font-size:.54rem;font-weight:700;color:#2563eb;background:#dbeafe;border-radius:10px;padding:1px 6px;'>DT</span>":"")+"</td>"
        + "<td style='"+td+"'>"+d.matS.toFixed(2)+" €</td>"
        + "<td style='"+td+"color:#8b5cf6;'>"+d.accS.toFixed(2)+" €</td>"
        + "<td style='"+td+"'>"+d.moS.toFixed(2)+" €</td>"
        + "<td style='"+td+"'>"+d.stS.toFixed(2)+" €</td>"
        + "<td style='"+td+"color:#b45309;'>"+d.fgS.toFixed(2)+" €</td>"
        + "<td style='"+td+"font-weight:800;color:#15803d;'>"+d.cruS.toFixed(2)+" €</td>"
        + "<td style='"+td+"font-weight:800;color:#1d4ed8;'>"+d.cru.toFixed(2)+" €</td>"
        + "</tr>";
    }).join('');
    host.innerHTML="<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;'><thead><tr style='background:#f8fafc;'>"
      + th('Qté',0)+th('Matière ×q',1)+th('Access. ×q',1)+th('MO+mach ×q',1)+th('S-trait ×q',1)+th('Frais g. (lot)',1)+th('CRU total',1)+th('CRU /pc',1)
      + "</tr></thead><tbody>"+rows+"</tbody></table></div>"
      + "<div style='font-size:.62rem;color:#94a3b8;padding:6px 2px 0;line-height:1.5;'><i class='fas fa-circle-info' style='margin-right:3px;'></i>Colonnes <strong>« ×q »</strong> = coût <strong>total de la série</strong> ; les <strong>frais généraux</strong> sont un coût <strong>par LOT</strong> (comptés une fois). <strong>CRU/pc</strong> = coût de revient par pièce. Matière et accessoires en <strong>unités d'achat entières</strong> (tôles / paquets, arrondi supérieur). La <strong>marge</strong> et le prix de vente se fixent dans l'<strong>offre de prix</strong> (commercial).</div>";
    updateSynthese();
  }
  window.beRenderResults=beRenderResults;
  function calcCRU(n){ beRenderResults(n); }   // rétro-compat : les champs frais généraux/marge appellent calcCRU
  window.calcCRU = calcCRU;
  function updateSynthese(){
    // Coût TOTAL de la DT = somme des coûts SÉRIE (cruS) de chaque produit à sa quantité principale (pas une moyenne /pc).
    var prods=document.querySelectorAll('.produit-block'); var nb=prods.length, totalDT=0, totalTps=0;
    prods.forEach(function(bl){ var n=+bl.id.replace('prod-',''); var d=beRowFor(n, beMainQte(n)); totalDT+=d.cruS;
      var g=GAM[n]||{nom:[],added:[]}; var tps=0; (g.nom||[]).forEach(function(e){ tps+=Number(e.var_min_piece)||0; }); (g.added||[]).forEach(function(a){ tps+=(Number(a.mo_min)||0)+(Number(a.machine_min)||0); }); totalTps+=tps*beMainQte(n); });
    var sn=byId('synth-nb'), sc=byId('synth-cru'), stp=byId('synth-tps');
    if(sn) sn.textContent=nb;
    if(sc) sc.textContent=totalDT.toFixed(2)+' €';
    if(stp) stp.textContent=(totalTps>=60?((totalTps/60).toFixed(1)+' h'):(Math.round(totalTps)+' min'));
  }

  // ── Couverture matière / accessoires (besoin × qté vs stock vs seuils) ──
  function covBadge(s){
    var map={ ok:['#166534','#dcfce7','Couvert'], sous_seuil:['#92400e','#fef9c3','Repasse sous seuil'], insuffisant:['#9a3412','#ffedd5','Insuffisant'], rupture:['#991b1b','#fee2e2','Rupture'], hors_stock:['#475569','#f1f5f9','Hors stock'] };
    var m=map[s]||map.hors_stock;
    return "<span style='font-size:.64rem;font-weight:800;color:"+m[0]+";background:"+m[1]+";padding:2px 8px;border-radius:20px;white-space:nowrap;'>"+m[2]+"</span>";
  }
  function beRenderCoverage(n, list){
    var host=byId('cov-'+n); if(!host) return;
    if(!list || !list.length){ host.innerHTML="<div style='font-size:.72rem;color:#9ca3af;padding:6px 2px;'>Aucune matière / accessoire dans la nomenclature de cette pièce.</div>"; return; }
    var th=function(t,r){ return "<th style='padding:6px 8px;font-size:.6rem;font-weight:800;color:#64748b;text-transform:uppercase;text-align:"+(r?'right':'left')+";'>"+t+"</th>"; };
    var totMat=0, totAcc=0;
    var rows=list.map(function(f){
      var u=f.unite?(' '+esc(f.unite)):''; var reste=(f.reste==null?'—':fmtNum(f.reste)+u); var seuil=(f.seuil==null?'—':fmtNum(f.seuil)+u);
      // Besoin en UNITÉS D'ACHAT entières (tôles / paquets, arrondi supérieur) — pas en pièces individuelles.
      var bu=f.besoin_unite?(' '+esc(f.besoin_unite)+((Number(f.besoin)||0)>1?'s':'')):u;
      var isMat=(f.categorie==='matiere');
      var cu=Number(f.cout_unite)||0, cs=Number(f.cout_serie)||0;   // coût unité d'achat + coût série (× quantité, arrondi supérieur)
      if(isMat) totMat+=cs; else totAcc+=cs;
      var td="padding:5px 8px;font-size:.72rem;color:#374151;";
      var tdr="padding:5px 8px;font-size:.72rem;color:#374151;text-align:right;font-weight:700;";
      var prixU=cu>0?(cu.toFixed(cu<1?4:2)+" €"):"<span style='color:#d97706;font-weight:700;' title='Prix à chiffrer (RFQ)'>à chiffrer</span>";
      var coutS=cs>0?("<span style='color:#0f766e;'>"+cs.toFixed(2)+" €</span>"):"<span style='color:#cbd5e1;'>—</span>";
      return "<tr style='border-bottom:1px solid #eef2f7;'>"
        + "<td style='"+td+"font-family:monospace;font-weight:700;color:#0369a1;'>"+esc(f.reference||'—')+"</td>"
        + "<td style='"+td+"'>"+esc(f.designation||'')+"</td>"
        + "<td style='"+td+"'>"+(isMat?'Matière':'Accessoire')+"</td>"
        + "<td style='"+tdr+"color:#1d4ed8;'>"+fmtNum(f.besoin)+bu+"</td>"
        + "<td style='"+tdr+"color:#334155;font-weight:600;'>"+prixU+"</td>"
        + "<td style='"+tdr+"'>"+coutS+"</td>"
        + "<td style='"+tdr+"'>"+reste+"</td>"
        + "<td style='"+tdr+"color:#94a3b8;'>"+seuil+"</td>"
        + "<td style='"+td+"text-align:center;'>"+covBadge(f.statut)+"</td>"
        + "</tr>";
    }).join('');
    var totCell="padding:6px 8px;font-size:.72rem;text-align:right;font-weight:800;";
    var foot="<tr style='background:#f0fdf4;border-top:2px solid #bbf7d0;'>"
      + "<td colspan='5' style='"+totCell+"color:#15803d;'>Coût matière + accessoires (série)</td>"
      + "<td style='"+totCell+"color:#166534;'>"+(totMat+totAcc).toFixed(2)+" €</td>"
      + "<td colspan='3' style='padding:6px 8px;font-size:.62rem;color:#6b7280;text-align:left;'>dont matière "+totMat.toFixed(2)+" € · accessoires "+totAcc.toFixed(2)+" €</td>"
      + "</tr>";
    host.innerHTML = "<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;'><thead><tr style='background:#f8fafc;'>"
      + th('Réf.',0)+th('Désignation',0)+th('Type',0)+th('Besoin (achat)',1)+th('Prix unité',1)+th('Coût série',1)+th('Stock restant',1)+th('Seuil',1)+"<th style='padding:6px 8px;font-size:.6rem;font-weight:800;color:#64748b;text-transform:uppercase;text-align:center;'>État</th>"
      + "</tr></thead><tbody>"+rows+"</tbody><tfoot>"+foot+"</tfoot></table></div>";
  }

  // ── Gamme opératoire (verrouillée = nomenclature ; ajoutée = insérable/glissable) ──
  function addedCostPc(n,a){ var g=GAM[n]||{}; return (Number(a.mo_min)||0)/60*(g.tauxMo||45) + (Number(a.machine_min)||0)/60*(g.tauxMach||50); }
  function hdr(t,r){ return "<span style='font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:"+(r?'right':'left')+";'>"+t+"</span>"; }
  function dropzone(n,k){ return "<div data-n='"+n+"' data-after='"+k+"' ondragover='beGamOver(event,this)' ondragleave='beGamLeave(event,this)' ondrop='beGamDrop(event,this)' style='height:7px;margin:1px 2px;border-radius:4px;transition:background .1s;'></div>"; }
  function lockedRow(e,seq){
    var t=(e.type==='sous_traite');
    return "<div style='display:grid;grid-template-columns:"+GRID+";gap:4px;margin-bottom:3px;align-items:start;'>"
      + "<div title='Étape issue de la nomenclature — position verrouillée' style='text-align:center;font-size:.72rem;font-weight:800;color:#94a3b8;font-family:monospace;padding-top:6px;'><i class='fas fa-lock' style='color:#cbd5e1;font-size:.6rem;'></i> "+seq+"</div>"
      + "<input value='"+(t?'Sous-traité':'Interne')+"' disabled style='"+INPRO+"'/>"
      + "<input value='"+esc(e.poste_nom||e.machine_nom||'')+"' disabled title='Poste (verrouillé — nomenclature)' style='"+INPRO+"'/>"
      + "<input value='"+esc(e.nom||'')+"' disabled title='Process (verrouillé — nomenclature)' style='"+INPRO+"'/>"
      + "<input value='"+mille(e.reglage_min)+"' disabled style='"+INPRO+"text-align:right;'/>"
      + "<input value='"+mille(e.mo_min)+"' disabled style='"+INPRO+"text-align:right;'/>"
      + "<input value='"+mille(e.machine_min)+"' disabled style='"+INPRO+"text-align:right;'/>"
      + "<div style='text-align:right;font-size:.72rem;font-weight:700;color:#64748b;padding:6px 4px;'>"+(Number(e.cout_pc)||0).toFixed(2)+" €</div>"
      + "<span></span>"
      + "</div>";
  }
  function addedRow(n,a,seq){
    var t=(a.type==='sous_traite');
    // Poste (2e case) : select des postes ; Process (3e case) : select filtré par le poste, sinon libellé libre de l'étape ajoutée
    var posteOpts=_gamPostes().map(function(p){ return "<option value='"+p.id+"'"+(String(a.poste_id||'')===String(p.id)?' selected':'')+">"+esc(p.nom)+"</option>"; }).join('');
    var posteSel="<select data-gf='poste' onchange='beGamEdit(this)' style='"+INP+"'><option value=''>— Poste —</option>"+posteOpts+"</select>";
    var procCell;
    if(a.poste_id){
      var procOpts=_gamProcs(a.poste_id).map(function(p){ return "<option value='"+p.id+"'"+(String(a.process_id||'')===String(p.id)?' selected':'')+">"+esc(p.nom)+"</option>"; }).join('');
      procCell="<select data-gf='process' onchange='beGamEdit(this)' style='"+INP+"'><option value=''>— Process —</option>"+procOpts+"</select>";
    } else {
      procCell="<input data-gf='nom' value='"+esc(a.nom||'')+"' oninput='beGamEdit(this)' placeholder='Opération ajoutée (ou choisir un poste)' style='"+INP+"'/>";
    }
    return "<div data-aid='"+a.id+"' ondragover='beGamOver(event,this)' ondrop='beGamDrop(event,this)' style='display:grid;grid-template-columns:"+GRID+";gap:4px;margin-bottom:3px;align-items:start;background:#faf5ff;border:1px solid #ede9fe;border-radius:7px;padding:2px 0;'>"
      + "<div draggable='true' ondragstart='beGamDrag(event,this)' ondragend='beGamDragEnd(event)' title='Glisser pour positionner dans la gamme (les étapes de la nomenclature ne bougent pas)' style='text-align:center;cursor:grab;font-size:.72rem;font-weight:800;color:#7c3aed;font-family:monospace;padding-top:6px;user-select:none;'><i class='fas fa-grip-vertical' style='color:#c4b5fd;font-size:.6rem;'></i> "+seq+"</div>"
      + "<select data-gf='type' onchange='beGamEdit(this)' style='"+INP+"'><option value='interne'"+(t?'':' selected')+">Interne</option><option value='sous_traite'"+(t?' selected':'')+">Sous-traité</option></select>"
      + posteSel
      + procCell
      + "<input data-gf='reglage' type='number' step='1' min='0' value='"+mille(a.reglage_min)+"' oninput='beGamEdit(this)' title='Réglage — millièmes d heure (1000 = 1 h)' style='"+INP+"text-align:right;'/>"
      + "<input data-gf='mo' type='number' step='1' min='0' value='"+mille(a.mo_min)+"' oninput='beGamEdit(this)' title='MO — millièmes d heure' style='"+INP+"text-align:right;'/>"
      + "<input data-gf='mach' type='number' step='1' min='0' value='"+mille(a.machine_min)+"' oninput='beGamEdit(this)' title='Machine — millièmes d heure' style='"+INP+"text-align:right;'/>"
      + "<div id='gcost-"+n+"-"+a.id+"' style='text-align:right;font-size:.72rem;font-weight:700;color:#7c3aed;padding:6px 4px;'>"+addedCostPc(n,a).toFixed(2)+" €</div>"
      + "<button type='button' onclick='beGamDel(this)' title='Supprimer l étape ajoutée' style='width:22px;height:22px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-size:.78rem;font-weight:700;'>×</button>"
      + "</div>";
  }
  function beGamRender(n){
    var g=GAM[n]; if(!g) return; var host=byId('gamme-'+n); if(!host) return;
    var html="<div style='display:grid;grid-template-columns:"+GRID+";gap:4px;margin-bottom:4px;padding:0 2px;'>"
      + hdr('N°',0)+hdr('Type',0)+hdr('Poste',0)+hdr('Process',0)+hdr('Régl. ‰h',1)+hdr('MO ‰h',1)+hdr('Mach ‰h',1)+hdr('Coût/pc',1)+"<span></span></div>";
    var seq=0, L=g.nom.length;
    for(var k=0;k<=L;k++){
      html+=dropzone(n,k);
      for(var a=0;a<g.added.length;a++){ if(g.added[a].apres===k){ seq++; html+=addedRow(n,g.added[a],seq); } }
      if(k<L){ seq++; html+=lockedRow(g.nom[k],seq); }
    }
    host.innerHTML=html;
    beRenderPostes(n);
  }
  window.beGamRender=beGamRender;
  function beGamAdd(n){ var g=GAM[n]; if(!g) return; g.added.push({ id:g.nextId++, nom:'', type:'interne', poste_id:'', poste_nom:'', process_id:'', process_nom:'', machine_nom:'', reglage_min:0, mo_min:0, machine_min:0, apres:g.nom.length }); beGamRender(n); beGamRecalcCRU(n); }
  window.beGamAdd=beGamAdd;
  function _ctx(el){ var bl=el.closest('.produit-block'); if(!bl) return null; return { bl:bl, n:+bl.id.replace('prod-','') }; }
  function beGamEdit(el){
    var row=el.closest('[data-aid]'); var ctx=_ctx(el); if(!row||!ctx) return;
    var aid=+row.getAttribute('data-aid'); var g=GAM[ctx.n]; if(!g) return; var a=null;
    for(var i=0;i<g.added.length;i++){ if(g.added[i].id===aid){ a=g.added[i]; break; } }
    if(!a) return; var f=el.dataset.gf, v=el.value;
    if(f==='poste'){   // choix du poste → réinitialise le process s'il n'appartient plus au poste ; re-render (le select process dépend du poste)
      a.poste_id=v; var po=_gamPostes().find(function(x){return String(x.id)===String(v);}); a.poste_nom=po?po.nom:'';
      var pr=a.process_id?_gamProcs(v).find(function(x){return String(x.id)===String(a.process_id);}):null;
      if(!pr){ a.process_id=''; a.process_nom=''; a.machine_nom=''; if(!v) a.nom=a.nom||''; }
      beGamRender(ctx.n); beGamRecalcCRU(ctx.n); return;
    }
    if(f==='process'){   // choix du process (du poste) → nom + machine dérivés
      a.process_id=v; var p2=(BE_REFS.process_atelier||[]).find(function(x){return String(x.id)===String(v);});
      a.nom=p2?p2.nom:''; a.process_nom=a.nom; a.machine_nom=(p2&&p2.machine_id)?_gamMachNom(p2.machine_id):'';
      if(p2&&p2.poste_id){ a.poste_id=p2.poste_id; var po2=_gamPostes().find(function(x){return String(x.id)===String(p2.poste_id);}); a.poste_nom=po2?po2.nom:a.poste_nom; }
      beGamRender(ctx.n); beGamRecalcCRU(ctx.n); return;
    }
    if(f==='nom') a.nom=v; else if(f==='type') a.type=v; else if(f==='machine_nom') a.machine_nom=v;
    else if(f==='reglage') a.reglage_min=fromMille(v); else if(f==='mo') a.mo_min=fromMille(v); else if(f==='mach') a.machine_min=fromMille(v);
    var cell=byId('gcost-'+ctx.n+'-'+aid); if(cell) cell.textContent=addedCostPc(ctx.n,a).toFixed(2)+' €';
    beGamRecalcCRU(ctx.n);
  }
  window.beGamEdit=beGamEdit;
  function beGamDel(el){ var row=el.closest('[data-aid]'); var ctx=_ctx(el); if(!row||!ctx) return; var aid=+row.getAttribute('data-aid'); var g=GAM[ctx.n]; if(!g) return; g.added=g.added.filter(function(a){ return a.id!==aid; }); beGamRender(ctx.n); beGamRecalcCRU(ctx.n); }
  window.beGamDel=beGamDel;
  function beGamDrag(ev,el){ var row=el.closest('[data-aid]'); var ctx=_ctx(el); if(!row||!ctx) return; window._gamDrag={ n:ctx.n, aid:+row.getAttribute('data-aid') }; try{ ev.dataTransfer.effectAllowed='move'; ev.dataTransfer.setData('text/plain','x'); }catch(e){} }
  window.beGamDrag=beGamDrag;
  function beGamDragEnd(){ window._gamDrag=null; }
  window.beGamDragEnd=beGamDragEnd;
  function beGamOver(ev,el){ ev.preventDefault(); try{ ev.dataTransfer.dropEffect='move'; }catch(e){} if(el&&el.hasAttribute('data-after')) el.style.background='#c4b5fd'; }
  window.beGamOver=beGamOver;
  function beGamLeave(ev,el){ if(el) el.style.background=''; }
  window.beGamLeave=beGamLeave;
  function beGamDrop(ev,el){
    ev.preventDefault(); if(el&&el.style) el.style.background='';
    var d=window._gamDrag; if(!d) return;
    var ctx=_ctx(el); if(!ctx||ctx.n!==d.n) return;   // insertion uniquement dans le même produit
    var after=null;
    if(el.hasAttribute('data-after')) after=+el.getAttribute('data-after');
    else { var tr=el.closest('[data-aid]'); if(tr){ var taid=+tr.getAttribute('data-aid'); var gg=GAM[ctx.n]; for(var i=0;i<gg.added.length;i++){ if(gg.added[i].id===taid){ after=gg.added[i].apres; break; } } } }
    if(after==null) return;
    var g=GAM[ctx.n]; for(var j=0;j<g.added.length;j++){ if(g.added[j].id===d.aid){ g.added[j].apres=after; break; } }
    window._gamDrag=null; beGamRender(ctx.n); beGamRecalcCRU(ctx.n);
  }
  window.beGamDrop=beGamDrop;
  function beGamRecalcCRU(n){
    var g=GAM[n]; if(!g) return;
    var addMain=beAddedPerPiece(n, beMainQte(n));   // affichage du coût étapes ajoutées à la quantité principale (amorti par quantité dans le tableau)
    g.addedCost=+addMain.toFixed(4);
    var disp=byId('gadd-'+n); if(disp) disp.textContent=addMain.toFixed(2)+' €';
    beRenderResults(n);
    beRenderPostes(n);
  }

  // ── Temps & coûts PAR POSTE (vrais temps = réglage/lot + variable × quantité ; défilable par quantité) ──
  function bePosteQIdx(n){ var g=GAM[n]||{}; var qs=beQtes(n);
    var idx=g.posteQIdx; if(idx==null){ var mq=beMainQte(n); idx=qs.indexOf(mq); if(idx<0) idx=0; }
    if(idx<0) idx=0; if(idx>=qs.length) idx=qs.length-1; g.posteQIdx=idx; return idx; }
  function bePosteNav(n,delta){ var g=GAM[n]; if(!g) return; var qs=beQtes(n); var idx=bePosteQIdx(n)+delta;
    if(idx<0) idx=0; if(idx>=qs.length) idx=qs.length-1; g.posteQIdx=idx; beRenderPostes(n); }
  window.bePosteNav=bePosteNav;
  function beRenderPostes(n){
    var g=GAM[n]; if(!g) return; var host=byId('postes-'+n); if(!host) return;
    var qs=beQtes(n); var idx=bePosteQIdx(n); var q=Number(qs[idx])||1;
    var pqEl=byId('pq-'+n); if(pqEl) pqEl.textContent=fmtNum(q)+' pc'+(qs.length>1?(' ('+(idx+1)+'/'+qs.length+')'):'');
    // Regroupement par POSTE. Verrouillée (nomenclature) : temps = réglage/lot + (mo+mach)×q ; coût = cout_reglage + cout_pc×q.
    var groups={}, order=[];
    var push=function(key,tmin,cout){ if(!groups[key]){ groups[key]={ nom:key, tmin:0, cout:0 }; order.push(key); } groups[key].tmin+=tmin; groups[key].cout+=cout; };
    (g.nom||[]).forEach(function(e){
      var key=e.poste_nom||e.machine_nom||'Sans poste';
      var tmin=(Number(e.reglage_min)||0)+(Number(e.var_min_piece)||0)*q;
      // ST : coût = max(forfait ; q×unit) (même règle que le CRU) ; interne : réglage/lot + variable×q.
      var cout=(e.type==='sous_traite')?Math.max(Number(e.st_forfait)||0,q*(Number(e.st_unit)||0)):((Number(e.cout_reglage)||0)+(Number(e.cout_pc)||0)*q);
      push(key,tmin,cout);
    });
    (g.added||[]).forEach(function(a){
      var reglc=(Number(a.reglage_min)||0)/60*(g.tauxMo||45);
      var key=a.poste_nom||'Étapes ajoutées';   // rattache l'étape ajoutée à son poste si renseigné
      push(key,(Number(a.reglage_min)||0)+((Number(a.mo_min)||0)+(Number(a.machine_min)||0))*q,reglc+addedCostPc(n,a)*q);
    });
    if(!order.length){ host.innerHTML="<div style='font-size:.72rem;color:#9ca3af;padding:6px 2px;'>Aucune étape dans la gamme.</div>"; return; }
    var fmtT=function(m){ return m>=60?((m/60).toFixed(2)+' h'):(Math.round(m)+' min'); };
    var totT=0, totC=0;
    var rows=order.map(function(k){ var gr=groups[k]; totT+=gr.tmin; totC+=gr.cout;
      var td="padding:5px 8px;font-size:.72rem;color:#374151;";
      var tdr="padding:5px 8px;font-size:.72rem;text-align:right;font-weight:700;";
      return "<tr style='border-bottom:1px solid #eef2f7;'>"
        + "<td style='"+td+"font-weight:700;color:#1e3a8a;'>"+esc(gr.nom)+"</td>"
        + "<td style='"+tdr+"color:#1d4ed8;'>"+fmtT(gr.tmin)+"</td>"
        + "<td style='"+tdr+"color:#0f766e;'>"+gr.cout.toFixed(2)+" €</td>"
        + "</tr>";
    }).join('');
    var th=function(t,r){ return "<th style='padding:6px 8px;font-size:.6rem;font-weight:800;color:#64748b;text-transform:uppercase;text-align:"+(r?'right':'left')+";'>"+t+"</th>"; };
    var foot="<tr style='background:#eff6ff;border-top:2px solid #bfdbfe;'>"
      + "<td style='padding:6px 8px;font-size:.72rem;font-weight:800;color:#1e40af;'>Total (série pour "+fmtNum(q)+" pc)</td>"
      + "<td style='padding:6px 8px;font-size:.72rem;font-weight:800;text-align:right;color:#1d4ed8;'>"+fmtT(totT)+"</td>"
      + "<td style='padding:6px 8px;font-size:.72rem;font-weight:800;text-align:right;color:#166534;'>"+totC.toFixed(2)+" €</td>"
      + "</tr>";
    host.innerHTML="<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;'><thead><tr style='background:#f8fafc;'>"
      + th('Poste',0)+th('Temps (série)',1)+th('Coût (série)',1)
      + "</tr></thead><tbody>"+rows+"</tbody><tfoot>"+foot+"</tfoot></table></div>";
  }
  window.beRenderPostes=beRenderPostes;

  // ── Construction d'un bloc produit ─────────────────────────────
  function fw(label,inner,req,cls){ return "<div"+(cls?" class='"+cls+"'":"")+"><label style='display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.25rem;'>"+label+(req?"<span style='color:#ef4444;margin-left:2px;'>*</span>":"")+"</label>"+inner+"</div>"; }
  var FINP="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.42rem .7rem;font-size:.8rem;color:#374151;background:#f8fafc;outline:none;box-sizing:border-box;";
  function beBlock(n){
    var norm=window.__BE_NORMATIVES__||[];
    var cases=norm.map(function(nm){ return "<label style='display:inline-flex;align-items:center;gap:5px;background:white;padding:5px 10px;border-radius:20px;border:1px solid #bae6fd;cursor:pointer;font-size:.72rem;font-weight:600;color:#0369a1;'><input type='checkbox' data-exig='"+esc(nm)+"' style='accent-color:#0369a1;'/> "+esc(nm)+"</label>"; }).join('');
    return "<div class='produit-block' id='prod-"+n+"' style='border:1.5px solid #e0e7ff;border-radius:12px;padding:16px;margin-bottom:14px;background:#fafafa;position:relative;'>"
      + "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;'>"
      +   "<div style='display:flex;align-items:center;gap:10px;'>"
      +     "<div style='width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#4338ca);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:.82rem;'>"+n+"</div>"
      +     "<span style='font-size:.86rem;font-weight:800;color:#374151;'>Produit "+n+"</span>"
      +   "</div>"
      +   "<button type='button' data-remove onclick='removeProduit("+n+")' style='background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:6px;padding:4px 10px;font-size:.7rem;font-weight:700;cursor:pointer;'><i class='fas fa-trash-alt'></i></button>"
      + "</div>"
      // Triplet lié (comme la DT/nomenclature) : réf interne <-> réf pièce client <-> n° plan client (ouvrable)
      + "<div style='display:grid;grid-template-columns:1.3fr 1.3fr 1.3fr .7fr;gap:10px;margin-bottom:6px;'>"
      +   fw("Réf. interne pièce","<input data-af='ref_interne' list='dt-refint-dl' onchange='beRefLookup(this)' placeholder='N° nomenclature / réf.' style='"+FINP+"'/>",true)
      +   fw("N° plan client","<input data-af='nom_plan' list='dt-plan-dl' placeholder='Ex: PLAN-DISSIP-A24-v3' style='"+FINP+"'/><a data-plan-open id='planopen-"+n+"' href='#' target='_blank' rel='noopener' style='display:none;margin-top:4px;font-size:.68rem;font-weight:700;color:#0369a1;text-decoration:none;align-items:center;gap:4px;'><i class='fas fa-file-arrow-down'></i> Ouvrir le plan client</a>",false)
      +   fw("Réf. pièce client","<input data-af='ref_client' list='dt-client-dl' onchange='beRefLookup(this)' placeholder='Ex: LGR-A-20485' style='"+FINP+"'/>",false)
      +   fw("Quantité","<input data-af='quantite' type='number' min='1' step='1' value='1' style='"+FINP+"background:#f0fdf4;border-color:#bbf7d0;font-weight:700;color:#15803d;'/>",true)
      + "</div>"
      + "<div data-surface style='display:none;font-size:.72rem;color:#92400e;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:7px 12px;margin-bottom:10px;'></div>"
      // Exigences normatives — identiques à la DT
      + "<div style='background:#f0f9ff;border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid #bae6fd;'>"
      +   "<div style='font-size:.7rem;font-weight:800;color:#0369a1;margin-bottom:10px;display:flex;align-items:center;gap:6px;'><i class='fas fa-shield-alt' style='color:#f59e0b;'></i> Exigences normatives applicables</div>"
      +   "<div style='display:flex;flex-wrap:wrap;gap:8px;'>"+cases+"</div>"
      + "</div>"
      // Couverture matière & accessoires (besoin vs stock vs seuils)
      + "<div style='background:#f0fdf4;border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid #bbf7d0;'>"
      +   "<div style='font-size:.7rem;font-weight:800;color:#15803d;margin-bottom:8px;display:flex;align-items:center;gap:6px;'><i class='fas fa-boxes'></i> Couverture matière & accessoires <span style='font-weight:600;color:#6b7280;'>— besoin (× quantité) vs stock restant vs seuils</span></div>"
      +   "<div id='cov-"+n+"'></div>"
      + "</div>"
      // Gamme opératoire — mêmes lignes/colonnes que la nomenclature
      + "<div style='background:#f5f3ff;border-radius:10px;padding:14px;margin-bottom:14px;'>"
      +   "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;'>"
      +     "<div style='font-size:.72rem;font-weight:800;color:#5b21b6;display:flex;align-items:center;gap:6px;'><i class='fas fa-list-ol'></i> Gamme opératoire <span style='font-weight:600;color:#7c3aed;'>— étapes nomenclature <i class='fas fa-lock' style='font-size:.6rem;'></i> verrouillées · étapes ajoutées glissables</span></div>"
      +     "<div style='font-size:.6rem;color:#7c3aed;'><i class='fas fa-clock'></i> Temps en millièmes d heure (1000 ‰ = 1 h)</div>"
      +   "</div>"
      +   "<div id='gamme-"+n+"'></div>"
      +   "<button type='button' onclick='beGamAdd("+n+")' style='margin-top:8px;display:flex;align-items:center;gap:5px;color:#6366f1;background:#ede9fe;border:1px dashed #c4b5fd;border-radius:6px;padding:5px 12px;font-size:.72rem;font-weight:700;cursor:pointer;width:100%;justify-content:center;'><i class='fas fa-plus'></i> Ajouter une étape (insérable dans la gamme)</button>"
      +   "<div style='margin-top:6px;text-align:right;font-size:.68rem;color:#7c3aed;font-weight:700;'>Coût étapes ajoutées : <span id='gadd-"+n+"'>0.00 €</span> / pièce <span style='color:#94a3b8;font-weight:600;'>(inclus dans le CRU)</span></div>"
      + "</div>"
      // Temps & coûts PAR POSTE — vrais temps calculés (réglage/lot + variable × quantité), défilables par quantité
      + "<div style='background:#eff6ff;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid #bfdbfe;'>"
      +   "<div style='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;'>"
      +     "<div style='font-size:.72rem;font-weight:800;color:#1e40af;display:flex;align-items:center;gap:6px;'><i class='fas fa-industry'></i> Temps &amp; coûts par poste <span style='font-weight:600;color:#3b82f6;'>— temps réels (réglage/lot + variable × quantité)</span></div>"
      +     "<div style='display:flex;align-items:center;gap:6px;'>"
      +       "<button type='button' onclick='bePosteNav("+n+",-1)' title='Quantité précédente' style='width:26px;height:26px;border-radius:7px;border:1px solid #bfdbfe;background:white;color:#1d4ed8;cursor:pointer;font-weight:800;font-size:.9rem;line-height:1;'>&#8249;</button>"
      +       "<div style='min-width:120px;text-align:center;font-size:.72rem;font-weight:800;color:#1e3a8a;background:white;border:1px solid #bfdbfe;border-radius:7px;padding:4px 8px;'>Quantité <span id='pq-"+n+"'>—</span></div>"
      +       "<button type='button' onclick='bePosteNav("+n+",1)' title='Quantité suivante' style='width:26px;height:26px;border-radius:7px;border:1px solid #bfdbfe;background:white;color:#1d4ed8;cursor:pointer;font-weight:800;font-size:.9rem;line-height:1;'>&#8250;</button>"
      +     "</div>"
      +   "</div>"
      +   "<div id='postes-"+n+"'></div>"
      + "</div>"
      // CHIFFRAGE — coûts AUTO (matière/accessoire/MO+machine/sous-traitance), seuls frais généraux + marge saisis, UN prix par quantité
      + "<div style='background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:10px;padding:14px;border:1.5px solid #86efac;'>"
      +   "<div style='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;'>"
      +     "<div style='font-size:.72rem;font-weight:800;color:#15803d;'><i class='fas fa-calculator'></i> Chiffrage — Coût de revient (CRU) <span style='font-weight:600;color:#6b7280;'>(auto · par quantité · la marge se fixe dans l'offre)</span></div>"
      +     "<div style='display:flex;align-items:center;gap:8px;flex-wrap:wrap;'>"
      +       "<div style='display:flex;align-items:center;gap:4px;background:white;border:1px solid #bbf7d0;border-radius:7px;padding:4px 8px;'><span style='font-size:.58rem;font-weight:700;color:#6b7280;text-transform:uppercase;'>Frais généraux /lot</span><input id='cru-fg-"+n+"' type='number' value='0' step='0.01' min='0' oninput='calcCRU("+n+")' title='Coût fixe PAR LOT (amorti sur la quantité) — pas par pièce' style='width:70px;border:1px solid #fcd34d;border-radius:4px;padding:2px 4px;font-size:.78rem;font-weight:700;color:#b45309;text-align:right;'/><span style='font-size:.65rem;color:#6b7280;'>€</span></div>"
      +     "</div>"
      +   "</div>"
      +   "<div id='results-"+n+"'></div>"
      +   "<div style='margin-top:8px;font-size:.62rem;color:#64748b;line-height:1.5;'><i class='fas fa-lock' style='color:#cbd5e1;'></i> Matière, accessoire, MO+machine et sous-traitance sont calculés automatiquement (temps fixes + variables × quantité, réglage amorti sur le lot). Seuls les <strong>frais généraux (par lot)</strong> sont modifiables. La <strong>marge et le prix de vente</strong> se fixent dans l'<strong>offre de prix</strong> (côté commercial).</div>"
      + "</div>"
      + "</div>";
  }

  function addProduit(){
    prodCount++; var n=prodCount;
    GAM[n]={ nom:[], added:[], nextId:1, qte:1, tauxMo:45, tauxMach:50, baseMo:0 };
    document.getElementById('produitsList').insertAdjacentHTML('beforeend', beBlock(n));
    beGamRender(n); beRenderCoverage(n, []); updateSynthese();
    return n;
  }
  window.addProduit=addProduit;
  function removeProduit(n){ var el=byId('prod-'+n); if(el) el.remove(); delete GAM[n]; updateSynthese(); }
  window.removeProduit=removeProduit;

  // Auto-recherche RÉPERTOIRE (triplet lié comme la DT) : réf client <-> réf interne <-> plan. Ne remplit que les cases vides.
  function beRefLookup(el){
    var block=el.closest('.produit-block'); if(!block||!el.dataset) return;
    var f=el.dataset.af; if(f!=='ref_client'&&f!=='ref_interne') return;
    var v=(el.value||'').trim(); if(!v) return;
    var qs=(f==='ref_client')?('ref_client='+encodeURIComponent(v)):('code_ref_interne='+encodeURIComponent(v));
    fetch('/api/references-clients?'+qs).then(function(r){ return r.json(); }).then(function(j){
      if(!j||!j.refs||!j.refs.length) return; var m=j.refs[0];
      var setEmpty=function(af,val){ var e=block.querySelector("[data-af='"+af+"']"); if(e&&!e.value&&val) e.value=val; };
      if(f==='ref_client'){ setEmpty('ref_interne',m.code_ref_interne); setEmpty('nom_plan',m.num_plan); }
      else { setEmpty('ref_client',m.ref_client); setEmpty('nom_plan',m.num_plan); }
    }).catch(function(){});
  }
  window.beRefLookup=beRefLookup;

  function setDl(id,arr){ var el=byId(id); if(!el) return; var u=[]; arr.forEach(function(x){ if(x&&u.indexOf(x)<0) u.push(x); }); el.innerHTML=u.map(function(x){ return "<option value='"+esc(x)+"'></option>"; }).join(''); }
  function renderSurface(block,p){ var host=block.querySelector('[data-surface]'); if(!host) return; var t=[]; if(p.oxydation_anodique) t.push('Oxydation anodique sulfurique'); if(p.oxydation_noire) t.push('Oxydation noire'); if(t.length){ host.innerHTML="<i class='fas fa-flask' style='color:#f59e0b;margin-right:5px;'></i>Traitement de surface : <strong>"+esc(t.join(' + '))+"</strong>"; host.style.display='block'; } else { host.style.display='none'; } }

  // ── GED : documents complémentaires de l'analyse DT (upload réel, catégorie analyse_dt, rattachés à la DT) ──
  function gedDtId(){ var dt=window.__DT_FOR_ANALYSIS__; return (dt&&dt.id)?dt.id:''; }
  function gedAnalyseLoad(){
    var list=byId('be-ged-list'); if(!list) return; var id=gedDtId();
    if(!id){ list.innerHTML="<span style='font-size:.72rem;color:#94a3b8;'>Ouvrez une DT pour joindre des documents.</span>"; return; }
    fetch('/api/ged/nomenclature/'+encodeURIComponent(id)).then(function(r){return r.json();}).then(function(j){
      var docs=((j&&j.documents)?j.documents:[]).filter(function(d){ return d.categorie==='analyse_dt'&&d.actif!==false; });
      if(!docs.length){ list.innerHTML="<span style='font-size:.72rem;color:#94a3b8;'>Aucun document joint.</span>"; return; }
      list.innerHTML=docs.map(function(d){
        return "<div style='display:flex;align-items:center;gap:8px;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:5px 10px;margin-bottom:4px;font-size:.74rem;'>"
          +"<i class='fas fa-file-lines' style='color:#6366f1;'></i>"
          +"<a href='/api/ged/file/"+encodeURIComponent(d.id)+"' target='_blank' rel='noopener' style='flex:1;color:#374151;font-weight:600;text-decoration:none;'>"+esc(d.fichier_nom||'document')+"</a>"
          +"<button type='button' data-doc-id='"+esc(d.id)+"' onclick='gedAnalyseDelete(this)' title='Supprimer' style='border:none;background:#fee2e2;color:#dc2626;border-radius:5px;width:22px;height:22px;cursor:pointer;font-weight:700;'>×</button>"
          +"</div>";
      }).join('');
    }).catch(function(){ list.innerHTML="<span style='font-size:.72rem;color:#ef4444;'>Erreur de chargement.</span>"; });
  }
  function gedAnalyseUpload(){
    var id=gedDtId(); if(!id){ if(window.pushNotif) pushNotif('warn','fa-exclamation-triangle',"Ouvrez une DT pour joindre un document.",4000); return; }
    var inp=byId('be-ged-file'); if(!inp||!inp.files||!inp.files.length){ if(window.pushNotif) pushNotif('info','fa-info-circle',"Choisissez un fichier.",3000); return; }
    var fd=new FormData(); fd.append('file', inp.files[0]); fd.append('nomenclature_id', id); fd.append('categorie','analyse_dt');
    var hint=byId('be-ged-hint'); if(hint) hint.textContent='Envoi…';
    fetch('/api/ged/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(j){
      if(hint) hint.textContent='';
      if(j&&j.ok){ inp.value=''; gedAnalyseLoad(); if(window.pushNotif) pushNotif('ok','fa-paperclip',"Document joint à l'analyse DT.",3500); }
      else if(window.pushNotif) pushNotif('err','fa-ban',(j&&j.error)||"Upload échoué.",4500);
    }).catch(function(){ if(hint) hint.textContent=''; if(window.pushNotif) pushNotif('err','fa-times',"Erreur réseau.",4000); });
  }
  window.gedAnalyseUpload=gedAnalyseUpload;
  async function gedAnalyseDelete(el){
    var id=el.getAttribute('data-doc-id'); if(!id) return;
    if(!await appConfirm("Supprimer ce document ?")) return;
    fetch('/api/ged/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
      if(j&&j.ok){ gedAnalyseLoad(); if(window.pushNotif) pushNotif('ok','fa-trash',"Document supprimé.",3000); }
      else if(window.pushNotif) pushNotif('err','fa-ban',(j&&j.error)||"Suppression échouée.",4000);
    }).catch(function(){ if(window.pushNotif) pushNotif('err','fa-times',"Erreur réseau.",4000); });
  }
  window.gedAnalyseDelete=gedAnalyseDelete;

  // ── SPLIT PAR SITE (Seem / Semrac) ─────────────────────────────
  // Une DT peut mélanger des pièces Seem et Semrac. Dans ce cas l'analyse se fait en DEUX volets :
  // on n'affiche/soumet qu'un volet à la fois ; l'offre fusionnée n'est générée que lorsque les deux sont terminés.
  function beSiteOf(p){ var dt=window.__DT_FOR_ANALYSIS__||{}; var a=String((p&&p.activite)||dt.activite||'').toLowerCase(); return a.indexOf('semrac')>=0?'Semrac':a.indexOf('seem')>=0?'Seem':'Autre'; }
  function beVoletLabel(s){ return s==='Seem'?'SEEM (aluminium)':s==='Semrac'?'SEMRAC (tôlerie)':s; }
  function beSetupVolets(ab, pieces){
    var counts={}; (pieces||[]).forEach(function(p){ var s=beSiteOf(p); counts[s]=(counts[s]||0)+1; });
    var present=Object.keys(counts);
    present.sort(function(a,b){ var o={Seem:0,Semrac:1}; return (o[a]==null?9:o[a])-(o[b]==null?9:o[b]); });
    if(present.length<2) return;   // mono-site → comportement inchangé (bouton global « Valider »)
    var done=(ab&&ab.sites)?ab.sites:{};
    window.__beSites=present; window.__beDone={}; window.__beAnaBySite={};
    present.forEach(function(s){ window.__beDone[s]=!!(done[s]&&done[s].done); window.__beAnaBySite[s]=(done[s]&&done[s].analyste)||''; });
    var bar=document.createElement('div'); bar.id='be-volet-bar';
    bar.style.cssText='display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:2px 0 16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;';
    var lbl=document.createElement('div'); lbl.style.cssText='font-size:.72rem;font-weight:800;color:#475569;'; lbl.textContent='Analyse en 2 volets :'; bar.appendChild(lbl);
    window.__beTabs={};
    present.forEach(function(s){ var t=document.createElement('button'); t.type='button'; t.setAttribute('data-volet',s); t.onclick=function(){ beSetVolet(s); }; window.__beTabs[s]=t; bar.appendChild(t); });
    var hint=document.createElement('div'); hint.style.cssText='flex:1;min-width:160px;text-align:right;font-size:.68rem;color:#94a3b8;'; hint.textContent='Chaque volet se termine séparément — offre générée quand les deux sont terminés.'; bar.appendChild(hint);
    var list=byId('produitsList'); if(list&&list.parentNode) list.parentNode.insertBefore(bar,list);
    var active=present.filter(function(s){ return !window.__beDone[s]; })[0]||present[0];
    beSetVolet(active);
    if(window.pushNotif) pushNotif('info','fa-columns','DT mixte Seem + Semrac : analyse séparée en 2 volets. Terminez chaque volet ; offre générée quand les deux seront finis.',7000);
  }
  window.beSetupVolets=beSetupVolets;
  function beSetVolet(site){
    window.__beActiveSite=site;
    (window.__beSites||[]).forEach(function(s){
      var t=window.__beTabs?window.__beTabs[s]:null; if(!t) return;
      var n=document.querySelectorAll('.produit-block[data-site="'+s+'"]').length;
      var isDone=window.__beDone&&window.__beDone[s]; var act=(s===site);
      t.innerHTML='';
      var nm=document.createElement('span'); nm.textContent='Volet '+beVoletLabel(s)+' ('+n+')'; t.appendChild(nm);
      var bdg=document.createElement('span'); bdg.style.cssText='margin-left:8px;font-size:.6rem;font-weight:800;padding:1px 7px;border-radius:20px;text-transform:uppercase;letter-spacing:.03em;';
      if(isDone){ bdg.textContent='terminé'; bdg.style.background='#dcfce7'; bdg.style.color='#166534'; }
      else { bdg.textContent='à faire'; bdg.style.background='#fef9c3'; bdg.style.color='#854d0e'; }
      t.appendChild(bdg);
      t.style.cssText='cursor:pointer;border:1.5px solid '+(act?'#4338ca':'#e2e8f0')+';background:'+(act?'#eef2ff':'white')+';color:'+(act?'#3730a3':'#475569')+';border-radius:9px;padding:7px 13px;font-size:.76rem;font-weight:700;';
    });
    // n'affiche que les pièces du volet actif
    document.querySelectorAll('.produit-block').forEach(function(bl){ bl.style.display=(bl.getAttribute('data-site')===site)?'':'none'; });
    var anaSel=byId('be-analyste'); if(anaSel){ var v=(window.__beAnaBySite&&window.__beAnaBySite[site])||''; if(v) anaSel.value=v; }
    var btn=byId('be-save-analyse-btn');
    if(btn){ btn.innerHTML=''; var ic=document.createElement('i'); ic.className='fas fa-check-circle'; btn.appendChild(ic);
      var already=window.__beDone&&window.__beDone[site];
      btn.appendChild(document.createTextNode(' '+(already?'Mettre à jour le volet ':'Terminer le volet ')+beVoletLabel(site))); }
  }
  window.beSetVolet=beSetVolet;

  // ── PRÉ-REMPLISSAGE depuis la DT ───────────────────────────────
  async function prefillFromDT(){
    if(window.__bePrefilled) return;
    var dt=window.__DT_FOR_ANALYSIS__;
    var dtNum=document.querySelector("input[placeholder='DT-2026-XXX']");
    var back=byId('be-back-link');
    var dateInputs=document.querySelectorAll("input[type='date']");
    if(dateInputs[0]&&!dateInputs[0].value) dateInputs[0].value=new Date().toISOString().slice(0,10);
    if(!dt){ addProduit(); return; }
    window.__bePrefilled=true;
    if(dtNum){ dtNum.value=dt.id; dtNum.readOnly=true; dtNum.style.background='#eff6ff'; }
    var clientInput=document.querySelector("input[placeholder='Raison sociale']");
    if(clientInput){ clientInput.value=dt.client_nom||''; clientInput.readOnly=true; clientInput.style.background='#eff6ff'; }
    var anaSel=byId('be-analyste'); if(anaSel&&dt.analyste){ anaSel.value=dt.analyste; }
    // Listes reliées à la DT : sélectionne la valeur, tolère la casse, ajoute l'option si absente
    var setSel=function(id,val){ if(val==null||val==='') return; var e=byId(id); if(!e) return; var v=String(val); for(var i=0;i<e.options.length;i++){ if(e.options[i].value.toLowerCase()===v.toLowerCase()){ e.selectedIndex=i; return; } } var o=document.createElement('option'); o.value=v; o.textContent=v; e.appendChild(o); e.value=v; };
    setSel('be-priorite', dt.priorite);
    // Métadonnées d'analyse stockées dans cahier_charges (text[], élément tagué)
    var ab={}; try{ var CC_TAG='__analyse_be__:'; var arr=Array.isArray(dt.cahier_charges)?dt.cahier_charges:[]; for(var i=0;i<arr.length;i++){ var el=String(arr[i]||''); if(el.indexOf(CC_TAG)===0){ ab=JSON.parse(el.slice(CC_TAG.length))||{}; break; } } }catch(e){}
    setSel('be-type-demande', ab.type_demande);
    setSel('be-faisabilite', ab.faisabilite);
    setSel('be-decision', ab.decision);
    var cmEl=byId('be-commentaire'); if(cmEl&&ab.commentaire) cmEl.value=ab.commentaire;
    var dgEl=byId('be-documents-ged'); if(dgEl&&ab.documents_ged) dgEl.value=ab.documents_ged;
    if(ab.date_analyse){ var dInp=document.querySelectorAll("input[type='date']"); if(dInp[0]) dInp[0].value=ab.date_analyse; }
    if(back) back.setAttribute('href','/be/service?'+Date.now()+'#analyse');
    var addBtn=byId('btn-add-produit'); if(addBtn) addBtn.style.display='none';
    var list=byId('produitsList'); if(list) list.innerHTML=''; prodCount=0;
    var pieces=Array.isArray(dt.pieces_detail)?dt.pieces_detail:[];
    setDl('dt-refint-dl',pieces.map(function(p){return p.ref_interne;}));
    setDl('dt-plan-dl',pieces.map(function(p){return p.nom_plan;}));
    setDl('dt-client-dl',pieces.map(function(p){return p.ref_client;}));
    if(!pieces.length){ addProduit(); if(window.pushNotif) pushNotif('warn','fa-exclamation-triangle','Aucune pièce dans cette DT. Demandez au commercial de compléter.',5000); return; }
    var byRef={};
    try{ var r=await fetch('/api/be/analyse-dt/'+encodeURIComponent(dt.id)); var j=await r.json(); if(j&&j.ok)(j.pieces||[]).forEach(function(ap){ byRef[String(ap.ref_interne||'').toLowerCase().trim()]=ap; }); }catch(e){}
    pieces.forEach(function(p){
      var n=addProduit(); var block=byId('prod-'+n);
      var rm=block.querySelector('[data-remove]'); if(rm) rm.style.display='none';
      block.setAttribute('data-site', beSiteOf(p));   // marque le site de la pièce → filtrage par volet (Seem/Semrac)
      setAf(block,'ref_interne',p.ref_interne||''); setAf(block,'nom_plan',p.nom_plan||''); setAf(block,'ref_client',p.ref_client||''); setAf(block,'quantite',p.quantite||1);
      var qi=block.querySelector("[data-af='quantite']"); if(qi){ qi.readOnly=true; qi.style.background='#eff6ff'; }
      var ap=byRef[String(p.ref_interne||'').toLowerCase().trim()];
      var exs=(ap&&ap.exigences&&ap.exigences.length)?ap.exigences:(Array.isArray(p.exigences)?p.exigences:[]);
      block.querySelectorAll('[data-exig]').forEach(function(cb){ cb.checked=exs.indexOf(cb.getAttribute('data-exig'))>=0; });
      renderSurface(block,p);
      if(ap&&ap.plan_doc_id){ var a=byId('planopen-'+n); if(a){ a.href='/api/ged/file/'+encodeURIComponent(ap.plan_doc_id); a.style.display='inline-flex'; if(ap.plan_fichier) a.title=ap.plan_fichier; } }
      beRenderCoverage(n,(ap&&ap.fournitures_stock)?ap.fournitures_stock:[]);
      var g=GAM[n]; g.qte=Number(p.quantite)||1; g.tauxMo=(ap&&ap.taux_mo)?ap.taux_mo:45; g.tauxMach=(ap&&ap.taux_machine)?ap.taux_machine:50;
      // Quantités à chiffrer (plusieurs estimatifs par pièce) + décomposition de prix AUTO par quantité (NOMENCLATURE seule ;
      // les étapes ajoutées sont ré-ajoutées par beAddedPerPiece → on les reconstruit d'abord dans g.added)
      g.qtes=(ap&&ap.quantites&&ap.quantites.length)?ap.quantites.slice():((Array.isArray(p.quantites)&&p.quantites.length)?p.quantites.slice():[g.qte]);
      g.results=(ap&&ap.results&&ap.results.length)?ap.results.slice():[];
      g.nom=(ap&&ap.etapes)?ap.etapes.slice():[]; g.added=[]; g.nextId=1;
      if(ap&&ap.etapes_libres&&ap.etapes_libres.length){ ap.etapes_libres.forEach(function(e){
        // restitution SANS perte (détail conservé côté serveur) ; repli sur temps_min pour l'ancien format
        var moM=(e.mo_min!=null)?Number(e.mo_min):(Number(e.temps_min)||0);
        var macM=(e.machine_min!=null)?Number(e.machine_min):0;
        var ap0=(e.apres!=null?Number(e.apres):g.nom.length);
        if(ap0<0) ap0=0; if(ap0>g.nom.length) ap0=g.nom.length;   // clamp : évite qu'une étape disparaisse si la gamme a raccourci
        g.added.push({ id:g.nextId++, nom:e.nom||'', type:(e.type==='sous_traite'?'sous_traite':'interne'), poste_id:e.poste_id||'', poste_nom:e.poste_nom||'', process_id:e.process_id||'', process_nom:e.process_nom||'', machine_nom:e.machine_nom||'', reglage_min:Number(e.reglage_min)||0, mo_min:moM, machine_min:macM, apres:ap0 });
      }); }
      // Repli : pièce sans nomenclature live mais coûts enregistrés → une ligne à la quantité principale.
      // On RETIRE la part des étapes ajoutées de cout_mo (elle sera ré-ajoutée par beAddedPerPiece → pas de double compte).
      if(!g.results.length){ var addBase=beAddedPerPiece(n, g.qte); var moBase=(Number(p.cout_mo)||0)-addBase; if(moBase<0) moBase=0;
        g.results=[{ quantite:g.qte, matiere_pc:Number(p.cout_matiere)||0, accessoire_pc:Number(p.cout_accessoire)||0, mo_pc:moBase, st_pc:Number(p.cout_st)||0 }]; }
      beGamRender(n);
      if(p.cout_fg!=null&&p.cout_fg!=='') setVal('cru-fg-'+n,p.cout_fg);
      beGamRecalcCRU(n);   // → beRenderResults : tableau de prix par quantité
    });
    // DT mixte Seem/Semrac → bascule en 2 volets (sinon : rien, comportement mono-site inchangé)
    try{ beSetupVolets(ab, pieces); }catch(e){ console.error(e); }
    if(window.pushNotif) pushNotif('info','fa-link','Analyse pré-remplie depuis '+dt.id+' ('+pieces.length+' pièce(s)) — gamme, matière/stock, exigences et plan déversés.',5000);
  }

  // ── SAUVEGARDE ─────────────────────────────────────────────────
  async function saveAnalyseBE(){
    var dt=window.__DT_FOR_ANALYSIS__;
    if(!dt){ if(window.confirmSend) confirmSend('Analyse BE validée – CRU calculé pour tous les produits.'); return; }
    // Mode 2 volets : on ne soumet QUE les pièces du volet actif (l'autre volet garde sa progression déjà enregistrée).
    var beMulti=!!(window.__beSites&&window.__beSites.length>=2); var beActive=window.__beActiveSite||null;
    var blocks=document.querySelectorAll('.produit-block'); var pieces_analyse=[]; var libresByRef=[];
    blocks.forEach(function(bl){
      if(beMulti && bl.getAttribute('data-site')!==beActive) return;   // ignore les pièces des autres volets
      var n=+bl.id.replace('prod-',''); var g=GAM[n]||{nom:[],added:[]};
      var refInterne=(getAf(bl,'ref_interne')||'').trim();
      var qte=parseFloat(getAf(bl,'quantite')||'1')||1;
      var fg=parseFloat(getVal('cru-fg-'+n))||0;   // frais généraux = coût PAR LOT
      var mainRow=beRowFor(n, beMainQte(n));   // coûts AUTO à la quantité principale (matière/accessoire/MO+machine/S-trait.)
      var tps=0; (g.nom||[]).forEach(function(e){ tps+=Number(e.var_min_piece)||0; }); (g.added||[]).forEach(function(a){ tps+=(Number(a.mo_min)||0)+(Number(a.machine_min)||0); });
      // Chiffrage multi-quantités : un COÛT DE REVIENT par quantité (cru = /pc, cru_serie = total lot). La marge/PV se fixent dans l'offre.
      var chiffrage=beQtes(n).map(function(q){ var d=beRowFor(n,q); return { quantite:q, cru:+d.cru.toFixed(2), cru_serie:+d.cruS.toFixed(2) }; });
      pieces_analyse.push({ ref_interne:refInterne, quantite:qte, quantites:beQtes(n).slice(),
        cout_matiere:+mainRow.mat.toFixed(4), cout_accessoire:+mainRow.acc.toFixed(4), cout_mo:+mainRow.mo.toFixed(4), cout_st:+mainRow.st.toFixed(4),
        cout_fg:fg, cru:+mainRow.cru.toFixed(4), temps_unitaire_min:+tps.toFixed(2), quantites_chiffrage:chiffrage });
      var libres=(g.added||[]).map(function(a){ return { nom:a.nom||'Étape ajoutée', type:(a.type==='sous_traite'?'sous_traite':'libre'), temps_min:(Number(a.mo_min)||0)+(Number(a.machine_min)||0), prix_forfait:null, apres:Number(a.apres)||0, machine_nom:a.machine_nom||null, poste_id:a.poste_id||null, poste_nom:a.poste_nom||null, process_id:a.process_id||null, process_nom:a.process_nom||null, reglage_min:Number(a.reglage_min)||0, mo_min:Number(a.mo_min)||0, machine_min:Number(a.machine_min)||0 }; });
      libresByRef.push({ ref:refInterne, libres:libres });
    });
    if(!pieces_analyse.length){ if(window.pushNotif) pushNotif('err','fa-exclamation-triangle','Aucune pièce à enregistrer.',4000); return; }
    var analyste=(byId('be-analyste')||{}).value||null;   // null (pas '') pour ne pas écraser l'analyste existant de la DT (endpoint: ?? dt.analyste)
    var dateInp=document.querySelectorAll("input[type='date']");
    var meta={
      priorite:(byId('be-priorite')||{}).value||null,
      type_demande:(byId('be-type-demande')||{}).value||null,
      faisabilite:(byId('be-faisabilite')||{}).value||null,
      decision:(byId('be-decision')||{}).value||null,
      commentaire:(byId('be-commentaire')||{}).value||null,
      documents_ged:(byId('be-documents-ged')||{}).value||null,
      date_analyse:(dateInp[0]||{}).value||null
    };
    try{
      for(var i=0;i<libresByRef.length;i++){ var lb=libresByRef[i]; if(!lb.ref) continue;
        try{ await fetch('/api/be/analyse-dt/'+encodeURIComponent(dt.id)+'/etapes-libres',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ref_interne:lb.ref, etapes_libres:lb.libres }) }); }catch(e){}
      }
      var res=await fetch('/api/dt/'+encodeURIComponent(dt.id)+'/analyse',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pieces_analyse:pieces_analyse, analyste:analyste, meta:meta, site:(beMulti?beActive:null) }) });
      var data=await res.json();
      if(!data.ok){ pushNotif('err','fa-times','Erreur: '+(data.error||'inconnu'),5000); return; }
      if(data.partial){   // volet enregistré, mais un autre volet reste à terminer → on ne quitte pas la page
        if(window.__beDone) window.__beDone[beActive]=true;
        var pend=(window.__beSites||[]).filter(function(s){ return !(window.__beDone&&window.__beDone[s]); });
        pushNotif('ok','fa-check-circle','Volet '+beActive+' terminé et enregistré. Reste à analyser : '+(pend.join(', ')||'—')+'. Offre générée quand tous les volets seront terminés.',8000);
        if(window.beSetVolet) window.beSetVolet(pend.length?pend[0]:beActive);
        try{ document.querySelector('.produit-block')&&window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
        return;
      }
      pushNotif('ok','fa-check-circle','Analyse '+dt.id+' enregistrée — montant '+(data.montant||0).toLocaleString('fr-FR')+' €. DT basculée dans les offres.',7000);
      setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#analyse'); },1200);
    }catch(e){ pushNotif('err','fa-times','Erreur réseau: '+e.message,5000); }
  }
  window.saveAnalyseBE=saveAnalyseBE;

  (function(){ try{ prefillFromDT(); }catch(e){ console.error(e); } try{ gedAnalyseLoad(); }catch(e){} })();
  })();
  </script>`
  return c.html(layout('Analyse Technique BE – Multi-produits', content, 'be-analyse'))
})

app.get('/be/preparation', async (c) => {
  // Prépa technique = saisie des CODES PROGRAMME CN par étape, pour les pièces dont au moins une étape
  // tourne sur une machine CNC. Les codes se déversent dans la nomenclature (etapes_production) → imprimés sur l'OF.
  const [noms, machines] = await Promise.all([getNomenclatures().catch(() => [] as any[]), getMachines().catch(() => [] as any[])])
  const cncById: Record<string, boolean> = {}
  ;(machines as any[]).forEach((m: any) => { cncById[String(m.id)] = !!m.cnc })
  const prep = (noms as any[]).map((n: any) => {
    const etapes = Array.isArray(n.etapes_production) ? n.etapes_production : []
    const steps = etapes
      .filter((e: any) => e && e.machine_id && cncById[String(e.machine_id)])
      .map((e: any) => ({ ordre: e.ordre, nom: e.nom || e.process_nom || 'Étape', machine_nom: e.machine_nom || '', programme: e.programme || '', programme_fichier: e.programme_fichier || '' }))
      .sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
    return steps.length ? { id: n.id, num_nom: n.num_nom, code: n.code_ref_produit, description: n.description || '', indice: n.indice || 'A', statut: n.statut, num_plan: n.num_plan || '', plan_fichier: n.plan_fichier || '', steps } : null
  }).filter(Boolean)
  const prepJson = JSON.stringify(prep).replace(/</g, '\\u003c')
  const nbCnc = (machines as any[]).filter((m: any) => m.cnc).length
  const content = `
  ${pageHeader('fas fa-cogs', '#8b5cf6,#7c3aed', 'Préparation Technique', 'Plan de la pièce + codes programme CN par étape · déversés dans la nomenclature → imprimés sur la fiche OF', ['BE', 'CNC'])}
  <div style="padding:22px 30px;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:6px;">
        <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;"><i class="fas fa-microchip" style="color:#8b5cf6;margin-right:6px;"></i>Pièce à programmer (étapes sur machine CNC)</div>
        <span style="font-size:.7rem;color:#94a3b8;">${nbCnc} machine(s) CNC · ${prep.length} pièce(s) avec étape CNC</span>
      </div>
      <select id="prep-nom" onchange="prepRender()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.5rem .75rem;font-size:.86rem;color:#374151;background:#f8fafc;outline:none;margin-top:8px;">
        <option value="">— Choisir une pièce —</option>
        ${prep.map((p: any) => `<option value="${String(p.id).replace(/"/g, '&quot;')}">${String(p.num_nom || p.code || p.id).replace(/</g, '&lt;')} — ${String(p.description || '').replace(/</g, '&lt;').slice(0, 60)} (ind. ${p.indice})</option>`).join('')}
      </select>
      ${prep.length === 0 ? `<div style="margin-top:14px;padding:14px;background:#fef9c3;border:1px solid #fde68a;border-radius:10px;font-size:.8rem;color:#854d0e;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i>Aucune pièce avec étape CNC. Marquez vos machines comme <strong>CNC</strong> (Production → Machines) et rattachez-les aux étapes de la nomenclature.</div>` : ''}
    </div>
    <div id="prep-steps" style="margin-bottom:16px;"></div>
    <div style="display:flex;justify-content:flex-end;gap:10px;">
      <button type="button" id="prep-save" onclick="prepSave()" style="display:none;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;padding:11px 30px;border-radius:12px;font-weight:700;font-size:.88rem;border:none;cursor:pointer;box-shadow:0 2px 12px #8b5cf644;"><i class="fas fa-save" style="margin-right:8px;"></i>Enregistrer la prépa (plan + codes)</button>
      <button type="button" id="prep-valider" onclick="prepValider()" style="display:none;margin-left:10px;background:linear-gradient(135deg,#059669,#047857);color:white;padding:11px 30px;border-radius:12px;font-weight:700;font-size:.88rem;border:none;cursor:pointer;box-shadow:0 2px 12px #05966944;" title="Enregistre puis marque la préparation FAITE — l'une des deux conditions d'entrée en production"><i class="fas fa-check-double" style="margin-right:8px;"></i>Valider la prépa</button>
    </div>
  </div>
  <script>
  (function(){
  var PREP = ${prepJson};
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // Etat REEL des pieces jointes : le champ texte a cote ne prouve RIEN (on peut y taper
  // un nom sans joindre de fichier). Seule la GED fait foi, on la relit donc a chaque rendu.
  function prepMajFichiers(nomencId){
    var zones = [];
    var zPlan = document.getElementById('prep-plan-etat');
    if(zPlan) zones.push({ el: zPlan, cat: 'plan_cao', ord: null });
    document.querySelectorAll('[id^="prep-prog-etat-"]').forEach(function(z){
      zones.push({ el: z, cat: 'programme_fao', ord: z.id.replace('prep-prog-etat-','') });
    });
    zones.forEach(function(z){ z.el.textContent = 'Lecture des pieces jointes...'; z.el.style.color = '#94a3b8'; });
    fetch('/api/ged/nomenclature/'+encodeURIComponent(nomencId))
      .then(function(r){ return r.json(); })
      .then(function(j){
        var docs = (j && j.ok && j.documents) ? j.documents : [];
        zones.forEach(function(z){
          var d = docs.filter(function(x){
            if(String(x.categorie) !== z.cat) return false;
            if(z.ord === null) return true;
            return String(x.etape_ordre) === String(z.ord);
          }).pop();
          if(d){
            z.el.innerHTML = '<i class="fas fa-paperclip" style="margin-right:4px;"></i>'
              + esc(d.fichier_nom || 'fichier')
              + ' \\u2014 <a href="/api/ged/file/' + esc(d.id) + '" target="_blank" rel="noopener" style="color:#6d28d9;font-weight:700;">ouvrir</a>';
            z.el.style.color = '#16a34a';
          } else {
            z.el.innerHTML = '<i class="fas fa-triangle-exclamation" style="margin-right:4px;"></i>Aucun fichier joint \\u2014 le champ ci-dessus n\\'est qu\\'un libelle. Utilisez <strong>Parcourir</strong> pour joindre le document.';
            z.el.style.color = '#b45309';
          }
        });
      })
      .catch(function(){ zones.forEach(function(z){ z.el.textContent = 'Pieces jointes illisibles (reseau).'; z.el.style.color = '#dc2626'; }); });
  }

  function prepRender(){
    var sel=document.getElementById('prep-nom'); var id=sel?sel.value:'';
    var host=document.getElementById('prep-steps'); var save=document.getElementById('prep-save');
    var valider=document.getElementById('prep-valider'); if(!host) return;
    var nom=(PREP||[]).find(function(x){return String(x.id)===String(id);});
    if(!nom){ host.innerHTML=''; if(save) save.style.display='none'; if(valider) valider.style.display='none'; return; }
    host.innerHTML='<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">'
      +'<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:12px;"><i class="fas fa-drafting-compass" style="color:#8b5cf6;margin-right:6px;"></i>Plan de la pièce — '+esc(nom.num_nom||nom.code)+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
      +'<div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">N° de plan (+ indice)</label><input id="prep-num_plan" value="'+esc(nom.num_plan)+'" placeholder="ex : PL-138001 ind. A" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:.8rem;background:white;box-sizing:border-box;"/></div>'
      +'<div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Fichier plan / CAO</label>'
        +'<div style="display:flex;gap:6px;align-items:center;">'
        +'<input id="prep-plan_fichier" value="'+esc(nom.plan_fichier)+'" placeholder="choisissez un fichier ->" style="flex:1;min-width:0;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:.8rem;background:white;box-sizing:border-box;"/>'
        +'<input type="file" id="prep-plan-file" accept=".pdf,.dxf,.dwg,.step,.stp,.igs,.iges,.png,.jpg,.jpeg" style="display:none;" onchange="prepChoisirPlan(this)"/>'
        +'<button type="button" onclick="this.previousElementSibling.click()" title="Charger le plan depuis vos fichiers" style="flex:none;border:1.5px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:7px;padding:6px 11px;font-size:.75rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-folder-open" style="margin-right:5px;"></i>Parcourir</button>'
        +'</div>'
        +'<div id="prep-plan-etat" style="font-size:.63rem;color:#94a3b8;margin-top:3px;"></div>'
      +'</div>'
      +'</div>'
      +'<div style="font-size:.7rem;color:#94a3b8;margin-top:8px;"><i class="fas fa-paperclip" style="margin-right:4px;"></i>Le plan (n° + fichier) accompagne les codes programme sur la fiche OF. Rattachez le fichier lui-même en GED depuis la nomenclature.</div>'
      +'</div>'
      +'<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">'
      +'<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:12px;"><i class="fas fa-code" style="color:#8b5cf6;margin-right:6px;"></i>Codes programme CN — '+esc(nom.num_nom||nom.code)+'</div>'
      +nom.steps.map(function(s){
        return '<div style="border:1px solid #eef2f7;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#faf9ff;">'
          +'<div style="font-size:.78rem;font-weight:700;color:#5b21b6;margin-bottom:8px;"><i class="fas fa-lock" style="color:#c4b5fd;font-size:.6rem;margin-right:5px;"></i>Étape '+esc(s.ordre)+' · '+esc(s.nom)+(s.machine_nom?(' <span style="color:#94a3b8;font-weight:600;">· '+esc(s.machine_nom)+'</span>'):'')+'</div>'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
          +'<div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">N° programme CN</label><input data-ord="'+esc(s.ordre)+'" data-f="programme" value="'+esc(s.programme)+'" placeholder="Ex : O1234, PRG-KIA2-A" style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:.8rem;background:white;box-sizing:border-box;"/></div>'
          +'<div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Fichier programme</label>'
            +'<div style="display:flex;gap:6px;align-items:center;">'
            +'<input data-ord="'+esc(s.ordre)+'" data-f="programme_fichier" value="'+esc(s.programme_fichier)+'" placeholder="choisissez un fichier ->" style="flex:1;min-width:0;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:.8rem;background:white;box-sizing:border-box;"/>'
            +'<input type="file" id="prep-prog-file-'+esc(s.ordre)+'" accept=".nc,.mpf,.tap,.cnc,.iso,.eia,.txt,.h,.ptp" style="display:none;" onchange="prepChoisirProgramme(this,'+esc(s.ordre)+')"/>'
            +'<button type="button" onclick="this.previousElementSibling.click()" title="Charger le programme depuis vos fichiers" style="flex:none;border:1.5px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:7px;padding:6px 11px;font-size:.75rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-folder-open" style="margin-right:5px;"></i>Parcourir</button>'
            +'</div>'
            +'<div id="prep-prog-etat-'+esc(s.ordre)+'" style="font-size:.63rem;color:#94a3b8;margin-top:3px;"></div>'
          +'</div>'
          +'</div></div>';
      }).join('')
      +'<div style="font-size:.7rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-print" style="margin-right:4px;"></i>Ces codes sont imprimés sur l\\'OF du lot (colonne « N° Programme »).</div>'
      +'</div>';
    if(save) save.style.display='';
    if(valider) valider.style.display='';
    prepMajFichiers(id);
  }
  window.prepRender=prepRender;
  // Nom de fichier sans son extension : sert a pre-remplir le N° de plan / de programme.
  function prepSansExt(n){ return String(n||'').replace(/\.[^.]+$/, ''); }

  // Envoie le fichier en GED puis renseigne les champs texte a partir de son nom.
  // Le document est rattache a la NOMENCLATURE : c'est ce qui leve « plan manquant »
  // et « code CN manquant » sur la preparation technique.
  function prepEnvoyer(fichier, categorie, ordre, etatId){
    var nomencId=(document.getElementById('prep-nom')||{}).value||'';
    var etat=document.getElementById(etatId);
    if(!nomencId){ if(etat){ etat.textContent='Choisissez d abord une piece.'; etat.style.color='#dc2626'; } return Promise.resolve(false); }
    if(etat){ etat.textContent='Envoi en cours...'; etat.style.color='#94a3b8'; }
    var fd=new FormData();
    fd.append('file', fichier);
    fd.append('nomenclature_id', nomencId);
    fd.append('categorie', categorie);
    if(ordre!=null && ordre!=='') fd.append('etape_ordre', String(ordre));
    return fetch('/api/ged/upload',{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){
        if(!j||!j.ok){ if(etat){ etat.textContent='Echec : '+((j&&j.error)||'envoi impossible'); etat.style.color='#dc2626'; } return false; }
        if(etat){ etat.innerHTML='<i class="fas fa-check" style="margin-right:4px;"></i>Fichier joint — <a href="/api/ged/file/'+j.document.id+'" target="_blank" rel="noopener" style="color:#6d28d9;font-weight:700;">ouvrir</a>'; etat.style.color='#16a34a'; }
        return true;
      })
      .catch(function(){ if(etat){ etat.textContent='Echec reseau.'; etat.style.color='#dc2626'; } return false; });
  }

  // Plan : renseigne le fichier, et le N° de plan s il est encore vide.
  function prepChoisirPlan(inp){
    if(!inp.files||!inp.files.length) return;
    var f=inp.files[0];
    var champFic=document.getElementById('prep-plan_fichier');
    var champNum=document.getElementById('prep-num_plan');
    if(champFic) champFic.value=f.name;
    if(champNum && !String(champNum.value||'').trim()) champNum.value=prepSansExt(f.name);
    prepEnvoyer(f, 'plan_cao', null, 'prep-plan-etat');
  }

  // Programme CN d une etape : meme principe, rattache a l ordre de l etape.
  function prepChoisirProgramme(inp, ordre){
    if(!inp.files||!inp.files.length) return;
    var f=inp.files[0];
    var champFic=document.querySelector('#prep-steps [data-ord="'+ordre+'"][data-f="programme_fichier"]');
    var champNum=document.querySelector('#prep-steps [data-ord="'+ordre+'"][data-f="programme"]');
    if(champFic) champFic.value=f.name;
    if(champNum && !String(champNum.value||'').trim()) champNum.value=prepSansExt(f.name);
    prepEnvoyer(f, 'programme_fao', ordre, 'prep-prog-etat-'+ordre);
  }

  // Enregistre la prepa PUIS la marque « faite ». Le serveur refuse la validation si le plan
  // ou un code CNC manque : on ne veut pas ouvrir la porte de production sur une prepa vide.
  function prepValider(){
    var sel=document.getElementById('prep-nom'); var id=sel?sel.value:''; if(!id) return;
    var b=document.getElementById('prep-valider');
    if(b){ b.disabled=true; b.style.opacity='.6'; }
    var relacher=function(){ if(b){ b.disabled=false; b.style.opacity=''; } };
    prepSave(function(ok){
      if(!ok){ relacher(); return; }
      fetch('/api/nomenclature/'+encodeURIComponent(id)+'/prepa-validee',{method:'POST'})
        .then(function(r){return r.json();})
        .then(function(j){
          relacher();
          if(!j||!j.ok){ if(window.pushNotif) pushNotif('err','fa-ban',(j&&j.error)||'Validation refusee.',7000); return; }
          // Rien de valide = ce n'est PAS un succes : ou bien la reference ne correspond a
          // aucune preparation, ou bien elles etaient deja faites. On le dit, en orange.
          if(!j.validees){
            if(j.candidates){
              // Deja faite : ce n'est pas un echec. On emmene quand meme l'utilisateur
              // dans la liste, sur la section « faites », pour qu'il la VOIE.
              if(window.pushNotif) pushNotif('ok','fa-check-double','Plan et codes programme enregistres. Cette preparation etait deja marquee faite \\u2014 elle est dans la liste des preparations terminees.', 8000);
              setTimeout(function(){ location.href='/be/service#prep'; }, 1400);
            } else {
              if(window.pushNotif) pushNotif('warn','fa-triangle-exclamation','Rien n\\'a change. AUCUNE preparation ne porte la reference <strong>'+(j.reference||'')+'</strong> : verifiez que la nomenclature choisie est bien celle de la piece a preparer.', 12000);
            }
            return;
          }
          var msg='Prepa <strong>'+(j.reference||'')+'</strong> validee \\u2014 '+j.validees+' ligne(s) passee(s) en « faite »';
          msg += (j.affaires.length? ' (affaire'+(j.affaires.length>1?'s':'')+' '+j.affaires.join(', ')+')' : '') + '.';
          msg += ' Plan et codes programme enregistres dans la nomenclature.';
          if(window.pushNotif) pushNotif('ok','fa-check-double', msg, 8000);
          // On SORT de la prepa : elle est faite, il n'y a plus rien a y saisir.
          // Retour a la liste, ancre sur la section « faites » ou la ligne vient d'arriver.
          setTimeout(function(){ location.href='/be/service#prep'; }, 1200);
        })
        .catch(function(){ relacher(); if(window.pushNotif) pushNotif('err','fa-times','Erreur reseau.',4000); });
    });
  }

  function prepSave(apres){
    var sel=document.getElementById('prep-nom'); var id=sel?sel.value:''; if(!id){ if(apres) apres(false); return; }
    var progs={};
    document.querySelectorAll('#prep-steps [data-ord]').forEach(function(inp){ var o=inp.getAttribute('data-ord'); var f=inp.getAttribute('data-f'); (progs[o]=progs[o]||{ordre:o})[f]=inp.value; });
    var arr=Object.keys(progs).map(function(o){return progs[o];});
    var numPlan=(document.getElementById('prep-num_plan')||{}).value||'';
    var planFic=(document.getElementById('prep-plan_fichier')||{}).value||'';
    fetch('/api/nomenclature/'+encodeURIComponent(id)+'/programmes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({programmes:arr, num_plan:numPlan, plan_fichier:planFic})})
      .then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok){ if(apres) apres(true); if(window.pushNotif) pushNotif('ok','fa-save','Prépa enregistrée — plan + '+j.count+' code(s) programme, imprimés sur l\\'OF.',4500);
          var nom=(PREP||[]).find(function(x){return String(x.id)===String(id);}); if(nom){ nom.num_plan=numPlan; nom.plan_fichier=planFic; nom.steps.forEach(function(s){ var p=progs[String(s.ordre)]; if(p){ s.programme=p.programme||''; s.programme_fichier=p.programme_fichier||''; } }); }
        } else { if(apres) apres(false); if(window.pushNotif) pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.',4500); }
      }).catch(function(){ if(apres) apres(false); if(window.pushNotif) pushNotif('err','fa-times','Erreur réseau.',4000); });
  }
  window.prepSave=prepSave; window.prepValider=prepValider;
  // ⚠ INDISPENSABLE : tout ce script est enferme dans une IIFE, alors que le markup
  //   genere plus haut appelle ces fonctions depuis des ATTRIBUTS INLINE
  //   (onchange="prepChoisirPlan(this)"). Un handler inline ne resout QUE le global :
  //   sans ces deux lignes, le navigateur leve un ReferenceError qu'il AVALE, et le
  //   fichier choisi n'est JAMAIS envoye — sans le moindre message d'erreur.
  window.prepChoisirPlan=prepChoisirPlan; window.prepChoisirProgramme=prepChoisirProgramme;
  })();
  </script>`
  return c.html(layout('Préparation Technique', content, 'be-prep'))
})

app.get('/be/ged', (c) => {
  const content = `
  ${pageHeader('fas fa-folder-open','#7c3aed,#5b21b6','GED & Maîtrise Documentaire','SharePoint · Versioning · Naming convention · EN9100 7.5 · ISO 9001:7.5',['GED','ISO 7.5','EN9100'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Document à créer / réviser')}
      ${fieldRow(`${field('Type de document','select','Plan / Gamme / Procédure / Instruction / Enregistrement / Rapport / Autre')} ${field('Statut','select','Brouillon / En revue / Approuvé / Effectif / Obsolète / Archivé')}`)}
      ${fieldRow(`${field('Titre court','text','Titre descriptif concis')} ${field('Révision','text','A / B / C… ou 01/02/03')}`)}
      ${fieldRow(`${field('Auteur','select','Pierre-Yves / Agathe / Joël / David / Autre')} ${field('Approbateur','select','Pierre-Yves / Agathe / Direction')}`)}
      ${field('Nom fichier (convention)','text','{DocType}_{Client}_{DT}_{Rev}_{YYYYMMDD}_{TitreShort}.ext',false,2)}
      ${sectionTitle('Diffusion & Retention')}
      ${fieldRow(`${field('Durée de rétention','select','3 ans / 7 ans / 10 ans / 15 ans / Permanente')} ${field('Niveau confidentialité','select','PUBLIC / INTERNE / CONFIDENTIEL / SECRET')}`)}
      ${afterBox(
        ['Mail auto → Approbateur (demande validation)','Mail auto → Auteur (accusé)'],
        ['Document archivé SharePoint GED','Journal audit créé'],
        ['Baseline documentaire mise à jour','Index GED synchronisé']
      )}
      ${submitBtn('Créer / Mettre à jour le document','#7c3aed')}
    `)}
  </div>`
  return c.html(layout('GED & Maîtrise Doc', content, 'ged'))
})

// ══════════════════════════════════════════════════════════════
// ACHATS
// ══════════════════════════════════════════════════════════════
app.get('/achats/demande', (c) => {
  const content = `
  ${pageHeader('fas fa-shopping-cart','#10b981,#059669','Demande d\'Achat (DA)','Morgane · BC fournisseur · Traçabilité lots · Anti-contrefaçon EN9100',['DA','EN9100','Anti-CTF'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Demande')}
      ${fieldRow(`${field('N° DA (auto)','text','DA-2026-XXX',false)} ${field('Demandeur','select','Sylvie (Production) / Joël (BE) / Morgane (Achats) / Mickael (OAS)')}`)}
      ${fieldRow(`${field('Type d\'achat','select','Matière première / Visserie / Outil spécial / Consommable / Sous-traitance / EPI')} ${field('Priorité','select','Standard (7j) / Urgent (48h) / Critique (24h)')}`)}
      ${sectionTitle('Article')}
      ${fieldRow(`${field('Désignation article','text','Description complète')} ${field('Référence fournisseur','text','Ref. fournisseur',false)}`)}
      ${fieldRow(`${field('Quantité','number','0')} ${field('Unité','select','Pièce / Kg / Ml / Litre / m² / Rouleau / Lot')}`)}
      ${fieldRow(`${field('Fournisseur APPROVED','select','Acier Nord ✅ / Metalco ✅ / Anodex SA ✅ / Galvatech ✅ / Thermex ⚠ CONDITIONAL / Nouveau fournisseur')} ${field('Prix unitaire estimé (€)','number','0',false)}`)}
      ${fieldRow(`${field('Date livraison souhaitée','date','')} ${field('N° Commande ERP associée','text','CMD-2026-XXX',false)}`)}
      ${sectionTitle('Contrôle EN9100 – Anti-contrefaçon')}
      ${fieldRow(`${field('Certificat matière requis','select','Oui – obligatoire (pièce critique) / Non / Selon fournisseur')} ${field('Risque contrefaçon évalué','select','Faible / Moyen – surveillance / Élevé – fournisseur APPROVED uniquement')}`)}
      ${field('Instructions spéciales réception','textarea','Contrôle dimensionnel, test durométrie, cert. chimique, vérification marquage lot…',false,2)}
      ${afterBox(
        ['Mail auto → Morgane (DA reçue)','Mail auto → Fournisseur (BC généré si approuvé)','Mail auto → Sylvie (info délai)'],
        ['BC généré GED','DA archivée'],
        ['Stock pré-alerté','Planning production mis à jour si critique']
      )}
      ${submitBtn('Soumettre la DA','#10b981')}
    `)}
  </div>`
  return c.html(layout('Demande d\'Achat', content, 'da'))
})

app.get('/achats/reception', (c) => {
  const content = `
  ${pageHeader('fas fa-boxes','#059669,#047857','Réception & Contrôle Stock','Morgane · Validation lot · Certificats · Anti-contrefaçon · Quarantaine',['Stock','EN9100','LOT'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Réception')}
      ${fieldRow(`${field('N° DA / BC reçu','text','DA-2026-XXX / BC-XXXX')} ${field('Date réception','date','')}`)}
      ${fieldRow(`${field('Fournisseur','text','Raison sociale')} ${field('Quantité reçue','number','0')}`)}
      ${fieldRow(`${field('N° Lot fournisseur','text','Lot n°')} ${field('N° Lot interne (auto)','text','LOT-MAT-YYYY-NNN',false)}`)}
      ${sectionTitle('Contrôle réception')}
      ${fieldRow(`${field('Certificat matière reçu','select','Oui – conforme / Oui – non conforme / Non – manquant')} ${field('Résultat contrôle visuel','select','Conforme / Non conforme / Suspect – quarantaine')}`)}
      ${fieldRow(`${field('Contrôle dimensionnel','select','Non applicable / Conforme / Non conforme',false)} ${field('Décision de réception','select','Accepté / Accepté avec réserves / Refusé – retour fournisseur / Quarantaine anti-contrefaçon')}`)}
      ${field('Observations / Actions','textarea','Non-conformités, actions à mener, blocage stock…',false,2)}
      ${afterBox(
        ['Mail auto → Morgane (réception validée)','Mail auto → Sylvie (matière disponible)','Mail auto → Qualité (si NC)'],
        ['Fiche réception archivée GED','Lot créé en stock','Certificat joint au lot'],
        ['Stock mis à jour','Planning production débloqué si critique']
      )}
      ${submitBtn('Valider la réception','#059669')}
    `)}
  </div>`
  return c.html(layout('Réception & Stock', content, 'reception'))
})

app.get('/achats/fournisseur', (c) => {
  const content = `
  ${pageHeader('fas fa-truck','#047857,#065f46','Évaluation Fournisseur EN9100','Morgane · Scoring OTD/OQD · Qualification · Approbation · EN9100 8.4',['EN9100 8.4','Fournisseur'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Fournisseur')}
      ${fieldRow(`${field('Raison sociale','text','Nom du fournisseur')} ${field('Type de prestation','select','Matière / Visserie / Sous-traitance spéciale / Usinage / Traitement surface / EPI')}`)}
      ${fieldRow(`${field('Statut actuel','select','NOUVEAU / QUALIFIED / APPROVED / CONDITIONAL / SUSPENDED / DISQUALIFIED')} ${field('Date de revue','date','')}`)}
      ${sectionTitle('Critères d\'évaluation')}
      ${fieldRow(`${field('OTD (On-Time Delivery %)','number','0')} ${field('OQD (On-Quality Delivery %)','number','0')}`)}
      ${fieldRow(`${field('Taux NC (%)','number','0',false)} ${field('Réactivité réclamations','select','Excellente / Bonne / Acceptable / Insuffisante')}`)}
      ${field('Commentaires / Actions correctives demandées','textarea','Détailler les non-conformités majeures, actions correctives en cours, conditions de maintien…',false,2)}
      ${sectionTitle('Décision')}
      ${fieldRow(`${field('Décision revue','select','APPROUVÉ / APPROUVÉ CONDITIONNEL / SUSPENDU – plan d\'action requis / DISQUALIFIÉ')} ${field('Prochaine revue','select','3 mois / 6 mois / 1 an')}`)}
      ${afterBox(
        ['Mail auto → Fournisseur (résultat évaluation)','Mail auto → Achats (statut mis à jour)'],
        ['Fiche fournisseur mise à jour GED','Historique évaluations archivé'],
        ['Référentiel fournisseurs approuvés mis à jour','Alerte si SUSPENDED']
      )}
      ${submitBtn('Enregistrer l\'évaluation','#047857')}
    `)}
  </div>`
  return c.html(layout('Évaluation Fournisseur', content, 'fournisseur'))
})

// ══════════════════════════════════════════════════════════════
// PRODUCTION
// ══════════════════════════════════════════════════════════════
app.get('/production/ordonnancement', (c) => {
  const content = `
  ${pageHeader('fas fa-calendar-alt','#f59e0b,#d97706','Ordonnancement / Planification Production','Sylvie · LOT → BDT · Capacité · Sous-traitance · EN9100',['LOT','BDT','ST'])}
  <div style="padding:22px 30px;">
    <div style="display:flex;gap:6px;background:#f1f5f9;border-radius:12px;padding:4px;margin-bottom:18px;width:fit-content;">
      <a href="/production/ordonnancement"><button style="padding:7px 18px;border-radius:8px;background:#f59e0b;color:white;border:none;font-weight:700;font-size:.8rem;cursor:pointer;">Ordonnancement</button></a>
      <a href="/production/affectation"><button style="padding:7px 18px;border-radius:8px;background:transparent;color:#64748b;border:none;font-weight:600;font-size:.8rem;cursor:pointer;">Affectation BDT</button></a>
      <a href="/production/competences"><button style="padding:7px 18px;border-radius:8px;background:transparent;color:#64748b;border:none;font-weight:600;font-size:.8rem;cursor:pointer;">Compétences</button></a>
      <a href="/production/horaires"><button style="padding:7px 18px;border-radius:8px;background:transparent;color:#64748b;border:none;font-weight:600;font-size:.8rem;cursor:pointer;">Horaires RH</button></a>
    </div>
    ${formCard(`
      ${sectionTitle('Création LOT de fabrication')}
      ${fieldRow(`${field('N° LOT (auto)','text','LOT-2026-XXX',false)} ${field('N° Commande ERP','text','CMD-2026-XXX')}`)}
      ${fieldRow(`${field('Client','text','Raison sociale')} ${field('Activité','select','Seem / Semrac')}`)}
      ${fieldRow(`${field('Pièce / Référence','text','REF-XXXX')} ${field('Quantité LOT','number','1')}`)}
      ${fieldRow(`${field('Date démarrage souhaitée','date','')} ${field('Date livraison requise','date','')}`)}
      ${sectionTitle('BDT à générer')}
      ${fieldRow(`${field('Nombre de BDT','number','1',false)} ${field('Priorité globale','select','Normal / Urgent / Critique')}`)}
      ${field('Opérations (liste)','textarea','Ex: Tronçonnage → Usinage CN → Ébavurage → Thermocollage → Emballage SEEM',false,2)}
      ${sectionTitle('Sous-traitance')}
      ${fieldRow(`${field('Opérations ST requises','select','Aucune / Oxydation sulfurique / Sérigraphie / Traitement thermique / Autre',false)} ${field('Prestataire ST','select','— Auto sélection APPROVED —',false)}`)}
      ${afterBox(
        ['Mail auto → Sylvie (LOT à planifier)','Mail auto → Opérateurs concernés (BDT créés)'],
        ['LOT créé en base','BDT générés et numérotés','ST déclenché si requis'],
        ['Gantt Affectation mis à jour','Capacité recalculée']
      )}
      ${submitBtn('Créer le LOT de fabrication','#f59e0b')}
    `)}
    <div style="margin-top:14px;text-align:center;">
      <a href="/production/affectation" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:12px 28px;border-radius:12px;font-weight:700;font-size:.88rem;text-decoration:none;box-shadow:0 2px 12px rgba(249,115,22,.3);">
        <i class="fas fa-project-diagram"></i> Ouvrir le Gantt Affectation BDT →
      </a>
    </div>
  </div>`
  return c.html(layout('Ordonnancement Production', content, 'ordo'))
})

// Vues planning secondaires (statiques) → pages réelles existantes
app.get('/production/affectation', (c) => c.redirect('/production/service'))
app.get('/production/competences', (c) => c.redirect('/rh/competences'))
app.get('/production/horaires',    (c) => c.redirect('/production/service'))
app.get('/production/operateur',   (c) => c.redirect('/production/service'))

// SERVICE PRODUCTION UNIFIÉ (6 onglets)
app.get('/production/service', async (c) => {
  const today = new Date()
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekFrom = monday.toISOString().slice(0, 10)
  const weekTo = new Date(monday.getTime() + 13 * 86400000).toISOString().slice(0, 10)
  const [bdts, machines, ops, lots, cmds, sousTraitants, processes, bds, bcs, stock, presences, absences, mouvements, affs, dts, conges, salaries, postes, machinesOpex, prepRows] = await Promise.all([
    getBonsDeTravail(), getMachines(), getOperateurs(), getLots(), getCommandes(), getSousTraitantsAll(),
    getProcessAtelier().catch(() => []),
    getPlanningBDS().catch(() => []),
    getBonsDeCommande().catch(() => []),
    getStockReel().catch(() => []),
    getPresences(weekFrom, weekTo).catch(() => []),
    getAbsences().catch(() => []),
    getMouvementsStock().catch(() => []),
    getAffectationsPoste(weekFrom, weekTo).catch(() => []),
    getDemandesTravaux().catch(() => []),
    getConges().catch(() => []),
    getSalaries().catch(() => []),
    getPostes().catch(() => []),
    getMachinesOpex().catch(() => []),
    getPreparationsTechniques().catch(() => []),
  ])
  // Oxydation par pièce (depuis pieces_detail des DT) → carré blanc (incolore) / noir (noire) sur le planning BDT
  const oxyMap: Record<string, string> = {}
  ;(dts as any[]).forEach((dt: any) => {
    const aff = String(dt.num_affaire || dt.affaire_id || '').toLowerCase()
    ;(Array.isArray(dt.pieces_detail) ? dt.pieces_detail : []).forEach((p: any) => {
      if (!p) return
      const oxy = p.oxydation_noire ? 'noire' : (p.oxydation_anodique ? 'incolore' : '')
      if (!oxy) return
      ;[p.ref_interne, p.nom_plan, p.ref_client].forEach((ref: any) => {
        if (!ref) return
        const r = String(ref).toLowerCase()
        oxyMap[aff + '|' + r] = oxy
        if (!(r in oxyMap)) oxyMap[r] = oxy
      })
    })
  })
  ;(bdts as any[]).forEach((b: any) => {
    const aff = String(b.num_affaire || b.affaire_id || b.cmd_id || '').toLowerCase()
    const piece = String(b.piece || '').toLowerCase()
    ;(b as any).oxydation = oxyMap[aff + '|' + piece] || oxyMap[piece] || null
  })
  // Demandes de congés en attente, ventilées : opérateurs → Présence opérateurs (cette page), supports → Direction
  const salById: Record<string, any> = {}
  ;(salaries as any[]).forEach((s: any) => { salById[String(s.id)] = s })
  const congesOperateursPend = (conges as any[]).filter((cg: any) => cg.statut === 'demande' && (salById[String(cg.salarie_id)]?.est_operateur === true))
  // BC sous-traitants → map statut par id (pilote le statut affiché des BST dans le planning)
  const bcStById: Record<string, any> = {}
  ;(bcs as any[]).forEach((b: any) => { if (b.type_bc === 'sous_traitant') bcStById[b.id] = b })
  // Affectations RH aux postes, indexées par date → { 'YYYY-MM-DD': { opId: {p:process_id, s:shift} } }
  // Un opérateur peut avoir plusieurs affectations/jour → tableau par opérateur : { date: { opId: [{p,s}] } }
  const affByDate: Record<string, Record<string, any[]>> = {}
  ;(affs as any[]).forEach((a: any) => { const d = String(a.date_affectation); const day = (affByDate[d] = affByDate[d] || {}); const op = String(a.operateur_id); (day[op] = day[op] || []).push({ p: a.process_id, s: a.shift || '' }) })
  // ── GOULOTTE matière + prépa (identique à /production/planning) : un BDT n'apparaît au
  //    planning de production QUE si la MATIÈRE est réceptionnée (matiere_ok, posé quand TOUS
  //    les BC matière de l'affaire sont recu_total) ET la PRÉPA technique de l'affaire est
  //    complète. À l'acceptation d'offre la cascade crée les BDT en matiere_ok:false → ils
  //    restent invisibles ici tant que DA→BC→BL/réception + prépa ne sont pas faits.
  //    (matiere_ok !== false : les BDT hérités à matiere_ok null restent visibles.)
  const bdtsPrets = filtrerBdtsPrets(bdts as any[], prepRows as any[])
  return c.html(pageServiceProd(bdtsPrets, machines, ops, lots, cmds, sousTraitants, processes, bds, bcStById, stock, presences, absences, mouvements, affByDate, congesOperateursPend, postes, machinesOpex))
})

// ─── PLANNING UNIFIÉ (Gantt Usine BDT + Gantt Sous-Traitance BDS) ───
// Planning unifie : /production/service est LE planning (Gantt BDT par poste + Gantt BST),
// avec les files d'attente « a affecter » au-dessus de chaque planning. L'ancienne page
// d'affectation par operateur a ete fusionnee dedans (choix utilisateur : rester lean).
app.get('/production/planning', (c) => c.redirect('/production/service'))

// ─── API PLANNING : persistance BDT / BDS / NC ───
const BDT_COLS = ['operateur_id','machine_id','process_id','poste_id','resultat','cmd_id','lot_id','num_affaire','client_nom','piece','operation','duree','debut','priorite','statut','activite','seq','date_echeance','date_prevue','temps_alloue','debut_reel','fin_reel','temps_reel','temps_machine_alloue','cmd_ref','lot_ref','matiere_ok','pv_requis']
const pick = (obj: any, cols: string[]) => { const o: Record<string, any> = {}; for (const k of cols) if (obj && k in obj) o[k] = obj[k]; return o }

app.patch('/api/production/bdts/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const patch = pick(body, BDT_COLS)
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'no valid fields' })
  const { data, error } = await updateBDT(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

app.post('/api/production/bdts', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const payload = pick(body, ['id', ...BDT_COLS])
  if (!payload.id) payload.id = 'BDT-P' + Date.now()
  if (!payload.piece) payload.piece = '—'
  if (!payload.operation) payload.operation = '—'
  if (payload.duree == null) payload.duree = 1
  if (!payload.priorite) payload.priorite = 'normal'
  if (!payload.statut) payload.statut = 'programme'
  if (payload.temps_alloue == null) payload.temps_alloue = payload.duree
  const { data, error } = await createBDTRow(payload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

const BDS_COLS = ['sous_traitant_id','statut','date_debut','date_envoi','date_retour_prevue','date_retour_effective','notes','duree_days','seq','predecesseur_fin','date_livraison','couleur','priorite','qte','client_nom','piece','operation','cmd_ref','lot_ref']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

app.patch('/api/production/bds/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const patch = pick(body, BDS_COLS)
  // sous_traitant_id est un UUID : on ignore les valeurs non-UUID (mode démo)
  if ('sous_traitant_id' in patch && patch.sous_traitant_id != null && !UUID_RE.test(String(patch.sous_traitant_id)))
    delete patch.sous_traitant_id
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'no valid fields' })
  const { data, error } = await updateBDS(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

app.post('/api/production/non-conformites', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const year = new Date().getFullYear()
  const existing = await getNonConformites().catch(() => []) as any[]
  let max = 0
  for (const r of existing) {
    const m = String(r.id || '').match(/NC-\d{4}-(\d+)/)
    if (m) { const v = parseInt(m[1], 10); if (v > max) max = v }
  }
  const n = String(max + 1).padStart(3, '0')
  const GRAV: Record<string, string> = { mineure: 'Mineure', majeure: 'Majeure', critique: 'Critique', bloquante: 'Bloquante' }
  const catRaw = String(body.categorie || '').toLowerCase()
  // Catégorie : administratif | prod (l'ancien 'operation' est remonté vers 'prod').
  const categorie = (catRaw === 'prod' || catRaw === 'production' || catRaw === 'operation' || catRaw === 'opération') ? 'prod' : (catRaw === 'administratif' ? 'administratif' : null)
  // Entité : uniquement pour une NC de production ; une NC administrative n'est PAS reliée à Seem/Semrac.
  const entite = categorie === 'administratif' ? null : (body.entite === 'Seem' || body.entite === 'Semrac' ? body.entite : null)
  const payload: Record<string, any> = {
    id: `NC-${year}-${n}`,
    date_nc: new Date().toISOString().slice(0, 10),
    type_nc: body.type_nc || 'interne',
    gravite: GRAV[String(body.gravite || '').toLowerCase()] || 'Majeure',
    statut: body.statut || 'ouverte',
    lot_ref: body.lot_ref ?? null,
    ref_article: body.ref_article ?? null,
    designation: body.designation ?? null,
    client_nom: body.client_nom ?? null,
    fournisseur_nom: body.fournisseur_nom ?? null,
    frc: body.frc ?? null,
    lieu_detection: body.lieu_detection ?? null,
    lieu_imputation: body.lieu_imputation ?? null,
    type_defaut: body.type_defaut ?? null,
    type_cause: body.type_cause ?? null,
    action_corrective: body.action_corrective ?? null,
    responsable: body.responsable ?? null,
    description: body.description ?? null,
    detecteur: await resolveSigner(c, body, body.detecteur ?? 'Production'),
    categorie,
    entite,
    affaire_id: body.affaire_id ?? null,
    // Retour client annoncé (lu par Expéditions › Réceptions). Fail-soft : si la migration
    //   nc_retour_client_attendu.sql n'est pas jouée, ces clés sont retirées ci-dessous.
    n_commande: body.n_commande ?? null,
    retour_attendu: body.retour_attendu === true,
    qte_retour_attendue: body.qte_retour_attendue ?? null,
    date_retour_prevue: body.date_retour_prevue ?? null,
    retour_statut: body.retour_attendu === true ? 'attendu' : null
  }
  // Repli gracieux : si la base n'a pas encore les colonnes (nc_champs_qualite.sql non joué,
  // ex. Cloudflare), on les retire pour ne pas faire échouer la création de NC.
  if (!(await ncHasExtCols().catch(() => false))) {
    delete payload.fournisseur_nom; delete payload.lieu_detection; delete payload.lieu_imputation
  }
  if (!(await ncHasResponsable().catch(() => false))) delete payload.responsable   // colonne récente, fail-soft avant DDL cloud
  // Fail-soft (même pattern que ci-dessus) : tant que `nc_retour_client_attendu.sql` n'est pas
  //   jouée, les colonnes du retour n'existent pas → on les retire AVANT l'insert, sinon
  //   PostgREST rejette toute la création de NC.
  if (!(await ncHasRetourCols().catch(() => false))) {
    delete payload.retour_attendu; delete payload.qte_retour_attendue
    delete payload.date_retour_prevue; delete payload.retour_statut
  }
  const { data, error } = await createNonConformiteRow(payload)
  if (error) return c.json({ ok: false, error: error.message })
  // DÉCHET AUTO : une NC statuée « Rebut » alimente le registre des déchets (idempotent via source_ref).
  if (/rebut/i.test(String(payload.action_corrective || ''))) {
    await ensureHseDechet('nc_rebut', String(payload.id), {
      entite: entite || 'Seem', date_dechet: payload.date_nc,
      designation: 'Rebut NC ' + payload.id + (payload.designation ? ' — ' + payload.designation : ''),
      dangereux: false, zone_producteur: payload.lieu_detection || 'Production', statut: 'en_attente',
    }).catch(() => {})
  }
  return c.json({ ok: true, data })
})

// ─── Libération d'un lot terminé : PV de contrôle FINAL avant expédition ───
// décision 'libere' → lots.statut='libere' (expédiable) · 'bloque' → quarantaine (flux SÉPARÉ).
app.post('/api/qualite/lot/:id/liberer', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const lot = await getLot(id).catch(() => null)
  const decision = body.decision === 'bloque' ? 'bloque' : 'libere'
  const controleur = await resolveSigner(c, body, 'Qualité')
  const pvs = await getPVControles().catch(() => [] as any[])
  const numPv = nextSeqId('PV', (pvs as any[]).map((p: any) => p.num_pv))
  const cp = (body.cp != null && body.cp !== '') ? Number(body.cp) : null
  const cpk = (body.cpk != null && body.cpk !== '') ? Number(body.cpk) : null
  const obs = [controleur ? 'Contrôleur : ' + controleur : '', 'Contrôle final de libération', body.observations || ''].filter(Boolean).join(' — ') || null
  await createPVControle({
    num_pv: numPv, date_pv: TODAY_ISO(), operateur_id: null,
    type_controle: 'final', type_lien: 'lot', lot_id: id,
    piece: lot ? (lot as any).piece : null, cp, cpk,
    statut: decision === 'bloque' ? 'nc_ouverte' : 'valide',
    decision, observations: obs,
    anomalie: decision === 'bloque', nc_ouverte: decision === 'bloque',
  } as any).catch(() => {})
  if (decision === 'libere') {
    const patch: any = { statut: 'libere' }
    if (await lotHasLibCols().catch(() => false)) { patch.libere_le = new Date().toISOString(); patch.libere_par = controleur }
    const { error: e } = await updateLot(id, patch)
    if (e) return c.json({ ok: false, error: e.message }, 400)
    return c.json({ ok: true, decision, num_pv: numPv })
  }
  // Bloqué → mise en quarantaine (traitée séparément)
  await createQuarantaine({
    lot_id: id, piece: lot ? (lot as any).piece : null,
    date_mise_quarantaine: TODAY_ISO(),
    motif: body.observations || 'Bloqué au contrôle final de libération',
    pv_id: numPv, statut: 'en_cours',
  }).catch(() => {})
  return c.json({ ok: true, decision, num_pv: numPv })
})

// ═══ EXPORTS EXCEL (.xlsx multi-feuilles : Données + TCD croisé) ═══
const XLSX_HEADERS = (fname: string) => ({
  'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'Content-Disposition': 'attachment; filename="' + fname + '"',
  'Cache-Control': 'no-store',
})
// Fournisseurs + catalogue de chaque fournisseur (feuille données) + TCD (fournisseur × catégorie réf.)
// Fournisseurs ET sous-traitants + leur catalogue/prestations. Chaque entité figure même sans item.
app.get('/api/export/fournisseurs.xlsx', async (c) => {
  const [fourns, sts, cat] = await Promise.all([getFournisseurs().catch(() => [] as any[]), getSousTraitantsAll().catch(() => [] as any[]), getProduitsFournisseursAll().catch(() => [] as any[])])
  const catByF: Record<string, any[]> = {}
  ;(cat as any[]).forEach((p: any) => { const k = String(p.fournisseur_id || ''); if (k) (catByF[k] = catByF[k] || []).push(p) })
  const H = ['Type', 'Code', 'Nom', 'Catégorie', 'Activité', 'Contact', 'Email', 'Téléphone', 'Adresse', 'SIRET', 'Délai (j)', 'Cond. règlement', 'Qualification', 'Référence / Prestation', 'Désignation', 'Catégorie réf.', 'Prix', 'Devise', 'Source prix', 'Date prix']
  const info = (e: any) => [e.code || '', e.nom || '', e.categorie || '', e.activite || '', e.contact || '', e.email || '', e.tel || '', e.adresse || '', e.siret || '', (e.delai_moyen_j != null ? Number(e.delai_moyen_j) : ''), e.mode_reglement || e.conditions_paiement || '', e.qualification || '']
  const EMPTY_ITEM = ['', '', '', '', '', '', '']
  const dataRows: any[][] = [H]
  for (const f of (fourns as any[])) {
    const items = catByF[String(f.id)] || []
    const base = ['Fournisseur', ...info(f)]
    if (!items.length) { dataRows.push([...base, ...EMPTY_ITEM]); continue }
    for (const p of items) dataRows.push([...base, p.reference || '', p.designation || '', p.categorie || '', (p.prix != null ? Number(p.prix) : ''), p.devise || '', p.source_prix || '', (p.date_prix ? String(p.date_prix).slice(0, 10) : '')])
  }
  for (const s of (sts as any[])) {
    const base = ['Sous-traitant', ...info(s)]
    const prest = Array.isArray(s.prestations) ? s.prestations : []
    if (!prest.length) { dataRows.push([...base, ...EMPTY_ITEM]); continue }
    for (const pr of prest) dataRows.push([...base, String(pr), '', 'prestation', '', '', '', ''])
  }
  // TCD : Catégorie × Type (Fournisseur / Sous-traitant) = nombre d'entités
  const rows: Record<string, { f: number; s: number }> = {}
  for (const f of (fourns as any[])) { const k = String(f.categorie || '—'); (rows[k] = rows[k] || { f: 0, s: 0 }).f++ }
  for (const s of (sts as any[])) { const k = String(s.categorie || '—'); (rows[k] = rows[k] || { f: 0, s: 0 }).s++ }
  const tcdRows: any[][] = [['Catégorie', 'Fournisseurs', 'Sous-traitants', 'Total']]
  Object.keys(rows).sort().forEach(k => tcdRows.push([k, rows[k].f, rows[k].s, rows[k].f + rows[k].s]))
  tcdRows.push(['TOTAL', (fourns as any[]).length, (sts as any[]).length, (fourns as any[]).length + (sts as any[]).length])
  const xls = buildXlsx([{ name: 'Fournisseurs & ST', rows: dataRows }, { name: 'TCD', rows: tcdRows }])
  return new Response(xls, { headers: XLSX_HEADERS('fournisseurs_sous-traitants.xlsx') })
})
// TOUS les clients (même sans produit) + les produits qu'ils ont commandés + TCD (synthèse).
app.get('/api/export/clients.xlsx', async (c) => {
  const data = await getClientsProduitsAll().catch(() => [] as any[])
  const H = ['Client', 'Code client', 'Activité', 'Contact', 'Email', 'Téléphone', 'Adresse', 'CP', 'Ville', 'SIRET', 'N° TVA', 'Mode facturation', 'Réf. interne', 'Réf. client', 'Désignation', 'N° plan', 'Nb affaires', 'Affaires']
  const infoC = (cl: any) => [cl.nom || '', cl.code_client || '', cl.activite || '', cl.contact || cl.contact_principal || '', cl.email || '', cl.tel || '', cl.adresse_rue || cl.adresse || '', cl.adresse_cp || '', cl.adresse_ville || '', cl.siret || '', cl.tva_intra || '', cl.mode_facturation || '']
  const dataRows: any[][] = [H]
  for (const row of (data as any[])) {
    const base = infoC(row.client)
    if (!row.produits.length) { dataRows.push([...base, '', '', '', '', '', '']); continue }
    for (const p of row.produits) dataRows.push([...base, p.code_ref_interne || '', p.ref_client || '', p.designation || '', p.num_plan || '', (p.affaires || []).length, (p.affaires || []).join(', ')])
  }
  const tcdRows: any[][] = [['Client', 'Activité', 'Nb produits commandés', 'Nb affaires (distinctes)']]
  for (const row of (data as any[])) {
    const affs = new Set<string>(); row.produits.forEach((p: any) => (p.affaires || []).forEach((a: string) => affs.add(a)))
    tcdRows.push([row.client.nom || '', row.client.activite || '', row.produits.length, affs.size])
  }
  const xls = buildXlsx([{ name: 'Clients & produits', rows: dataRows }, { name: 'TCD', rows: tcdRows }])
  return new Response(xls, { headers: XLSX_HEADERS('clients_produits.xlsx') })
})

// Export SEIRICH (risque chimique coté) — inventaire produits + situations d'exposition (3 axes).
// Format tableur à recopier dans le modèle vierge officiel SEIRICH de l'INRS (l'inventaire complet
// n'étant pas ré-importable tel quel ; la base produits/situations, si).
app.get('/api/export/seirich.xlsx', async (c) => {
  const [chimiques, expositions] = await Promise.all([
    getHseChimiques().catch(() => [] as any[]),
    getHseExpositions().catch(() => [] as any[]),
  ])
  const chimById: Record<string, any> = {}
  chimiques.forEach((x: any) => { chimById[x.id] = x })
  const qmaxByUT: Record<string, number> = {}
  expositions.forEach((e: any) => { const ut = String(e.unite_travail || '—'); const q = normQuantiteChimique(e.quantite_utilisee, e.unite); if (q > (qmaxByUT[ut] || 0)) qmaxByUT[ut] = q })
  const lvl = (n: number) => (SEIRICH_NIVEAUX as any)[n]?.[2] || '—'

  // Feuille 1 — inventaire coté (danger produit, Phase 1)
  const invRows: any[][] = [['Produit', 'Réf.', 'N° CAS', 'FDS', 'Date FDS', 'Pictogrammes', 'CMR', 'VLEP', 'Codes H', 'État', 'Quantité', 'Unité', 'Santé', 'Incendie', 'Environnement', 'Niveau max', 'Qualité donnée']]
  for (const p of chimiques) {
    const d = computeRisqueChimique(p)
    invRows.push([p.nom || '', p.ref_stock || '', p.cas || '', (p.fds_ref || p.fds_url) ? 'oui' : 'non', p.fds_date || '', (p.pictogrammes || []).join(' '), p.cmr || '', p.vlep || '', d.hCodes.join(' '), p.etat || '', (p.quantite ?? ''), p.unite || '',
      lvl(d.niveauSante), lvl(d.niveauIncendie), lvl(d.niveauEnv), lvl(d.niveauMax), d.dataQuality])
  }
  // Feuille 2 — expositions cotées (3 axes par situation)
  const expoRows: any[][] = [['Produit', 'Unité de travail', 'Zone', 'Tâche', 'Procédé', 'Quantité', 'Unité', 'Fréquence', 'Volatilité', 'Protection', 'EPI', 'Rejet milieu', 'CMR',
    'Score potentiel', 'Niv. potentiel', 'Score résiduel', 'Niv. résiduel', 'Santé', 'Incendie', 'ATEX', 'Environnement', 'Retenu', 'Significatif', 'Qualité', 'Alertes']]
  for (const e of expositions) {
    const chim = chimById[e.produit_id]
    const q = qmaxByUT[String(e.unite_travail || '—')]
    const r = computeExpositionSante(chim, e, q), ri = computeExpositionIncendie(chim, e, q), re = computeExpositionEnv(chim, e, q)
    const nmax = Math.max(r.niveauSante, ri.niveauIncendie, re.niveauEnv)
    const flags = [...r.flags, ...ri.flags, ...re.flags]
    expoRows.push([e.produit_nom || (chim && chim.nom) || '', e.unite_travail || '', e.zone || '', e.tache || '',
      EXPO_PROCEDE_LBL[e.procede] || e.procede || '', (e.quantite_utilisee ?? ''), e.unite || '',
      EXPO_FREQ_LBL[e.frequence] || e.frequence || '', EXPO_VOLAT_LBL[e.volatilite] || e.volatilite || '',
      EXPO_PROT_LBL[e.protection_collective] || e.protection_collective || '', e.epi ? 'oui' : 'non', re.rejetMilieu ? 'oui' : 'non', r.cmr ? 'oui' : '',
      r.scorePotentiel, lvl(r.niveauPotentiel), Math.round(r.scoreResiduel), lvl(r.niveauResiduel), lvl(r.niveauSante),
      lvl(ri.niveauIncendie), ri.zoneAtex || '', lvl(re.niveauEnv), lvl(nmax), r.significatif ? 'oui' : '', r.dataQuality, flags.join(' ; ')])
  }
  // Feuille 3 — notice
  const notice: any[][] = [['Notice'], ['Cotation INDICATIVE — méthode simplifiée INRS ND 2233 / R 409 (SEIRICH).'],
    ['À valider par un mesurage / le référent QHSE. Recopier ces colonnes dans le modèle vierge officiel SEIRICH (Outils et documents > Import/Export) avant import.'],
    ['Généré par l\'ERP Seem Semrac.']]
  const xls = buildXlsx([{ name: 'Inventaire coté', rows: invRows }, { name: 'Expositions', rows: expoRows }, { name: 'Notice', rows: notice }])
  return new Response(xls, { headers: XLSX_HEADERS('seirich_risque_chimique.xlsx') })
})

// ─── API PROCESS ATELIER (référentiel machine / manuel) ───
const PROC_COLS = ['nom', 'code', 'activite', 'categorie', 'requiert_machine', 'est_oas', 'machine_id', 'operations', 'couleur', 'statut', 'ordre', 'poste_id']

app.post('/api/production/process', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const payload = pick(body, PROC_COLS)
  if (!payload.nom) return c.json({ ok: false, error: 'nom requis' })
  payload.id = 'proc-' + Date.now().toString(36)
  if ('poste_id' in payload) payload.poste_id = payload.poste_id ? String(payload.poste_id) : null   // '' → null (FK)
  if (payload.activite == null) payload.activite = 'Seem'
  if (payload.requiert_machine == null) payload.requiert_machine = true
  if (payload.statut == null) payload.statut = 'actif'
  if (payload.ordre == null) payload.ordre = 100
  if (payload.requiert_machine === false) payload.machine_id = null
  const { data, error } = await createProcessAtelier(payload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

app.patch('/api/production/process/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const patch = pick(body, PROC_COLS)
  if (patch.requiert_machine === false) patch.machine_id = null
  if ('poste_id' in patch) patch.poste_id = patch.poste_id ? String(patch.poste_id) : null   // '' → null (détacher du poste)
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'no valid fields' })
  const { data, error } = await updateProcessAtelier(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

app.delete('/api/production/process/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await deleteProcessAtelier(id)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})

// ─── Réordonnancement (glisser-déposer) : process + machines → champ `ordre` ───
app.post('/api/production/process/reorder', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const ids = Array.isArray(b.ids) ? b.ids : []
  if (!ids.length) return c.json({ ok: false, error: 'ids requis' }, 400)
  for (let i = 0; i < ids.length; i++) await updateProcessAtelier(String(ids[i]), { ordre: (i + 1) * 10 }).catch(() => {})
  return c.json({ ok: true, n: ids.length })
})
app.post('/api/production/machine/reorder', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const ids = Array.isArray(b.ids) ? b.ids : []
  if (!ids.length) return c.json({ ok: false, error: 'ids requis' }, 400)
  for (let i = 0; i < ids.length; i++) await updateMachine(String(ids[i]), { ordre: (i + 1) * 10 }).catch(() => {})
  return c.json({ ok: true, n: ids.length })
})

// ─── API POSTES D'ATELIER (conteneurs machines + process ; planning & OPEX par poste) ───
const POSTE_COLS = ['nom', 'code', 'activite', 'couleur', 'ordre', 'statut', 'notes', 'taux_horaire_manuel']
app.post('/api/production/poste', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const payload: any = pick(b, POSTE_COLS)
  if (!payload.nom || !String(payload.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  payload.id = (b.id && /^[\w-]+$/.test(String(b.id))) ? String(b.id) : 'POSTE-' + Date.now().toString(36)
  if (payload.activite == null) payload.activite = 'Seem'
  if (payload.statut == null) payload.statut = 'actif'
  if (payload.ordre == null) payload.ordre = 100
  const { data, error } = await createPoste(payload)
  if (error) return c.json({ ok: false, error: /postes|schema|relation/i.test(error.message) ? 'Table « postes » absente — exécutez scripts_import/postes_schema.sql dans Supabase.' : error.message }, 400)
  return c.json({ ok: true, poste: data })
})
app.patch('/api/production/poste/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = pick(b, POSTE_COLS)
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updatePoste(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, poste: data })
})
app.delete('/api/production/poste/:id', async (c) => {
  const id = c.req.param('id')
  // Détacher machines + process rattachés (le ON DELETE SET NULL de la FK le fait aussi ; on force côté app par sécurité)
  try {
    const [machs, procs] = await Promise.all([getMachines().catch(() => [] as any[]), getProcessAtelier().catch(() => [] as any[])])
    for (const m of (machs as any[])) if (String(m.poste_id) === String(id)) await updateMachine(m.id, { poste_id: null }).catch(() => {})
    for (const p of (procs as any[])) if (String(p.poste_id) === String(id)) await updateProcessAtelier(p.id, { poste_id: null }).catch(() => {})
  } catch { /* non bloquant */ }
  const { error } = await deletePoste(id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})
app.post('/api/production/poste/reorder', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const ids = Array.isArray(b.ids) ? b.ids : []
  if (!ids.length) return c.json({ ok: false, error: 'ids requis' }, 400)
  for (let i = 0; i < ids.length; i++) await updatePoste(String(ids[i]), { ordre: (i + 1) * 10 }).catch(() => {})
  return c.json({ ok: true, n: ids.length })
})

// ─── API BDT : affecter à un process / réceptionner / solder ───
app.post('/api/production/bdt/:id/affecter', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const procId = body.process_id
  if (!procId) return c.json({ ok: false, error: 'process_id requis' })
  const procs = await getProcessAtelier().catch(() => []) as any[]
  const proc = procs.find((p: any) => String(p.id) === String(procId))
  if (!proc) return c.json({ ok: false, error: 'Process introuvable' })
  const patch: Record<string, any> = { process_id: procId, statut: 'programme' }
  if (proc.requiert_machine && proc.machine_id) patch.machine_id = proc.machine_id
  if (proc.activite && proc.activite !== 'both') patch.activite = proc.activite
  // Heure de début précise (issue du glisser-déposer sur le Gantt)
  if (body.debut != null && !isNaN(Number(body.debut))) patch.debut = Math.round(Number(body.debut) * 100) / 100
  // Jour de programmation → le Gantt n'affiche que les BDT du jour sélectionné
  if (body.date_prevue) patch.date_prevue = String(body.date_prevue)
  const { data, error } = await updateBDT(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

// Déprogrammer un BDT : retour dans la file « en attente de programmation »
app.post('/api/production/bdt/:id/deprogrammer', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await updateBDT(id, { process_id: null, machine_id: null, statut: 'a_programmer', date_prevue: null })
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

// Fractionnement d'un BDT long en plusieurs morceaux (par TEMPS — un BDT n'a pas de quantité).
// Le morceau 1 = le BDT d'origine réduit ; les morceaux 2..N sont créés (mêmes rattachements),
// remis « à programmer » pour être placés séparément. Durée/temps répartis au prorata (somme exacte).
app.post('/api/production/bdt/:id/separer', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const bdts = await getBonsDeTravail().catch(() => [] as any[])
  const b = (bdts as any[]).find((x: any) => String(x.id) === String(id))
  if (!b) return c.json({ ok: false, error: 'BDT introuvable.' }, 404)
  if (['recu', 'solde'].includes(String(b.statut)) || b.temps_reel != null) return c.json({ ok: false, error: 'BDT déjà démarré ou soldé — non fractionnable.' }, 400)
  const total = Number(b.duree ?? b.temps_alloue ?? 0) || 0
  if (total <= 0) return c.json({ ok: false, error: 'BDT sans durée — rien à fractionner.' }, 400)
  let parts: number[] = Array.isArray(body.parts) ? body.parts.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0) : []
  const n = Math.max(2, Math.min(12, Number(body.n) || parts.length || 2))
  if (parts.length < 2) parts = Array.from({ length: n }, () => total / n)
  const sum = parts.reduce((s, x) => s + x, 0) || 1
  parts = parts.map((x) => x * total / sum)   // normalise → somme = durée d'origine (aucune matière perdue)
  const r4 = (x: number) => Math.round(x * 10000) / 10000
  const tAll = Number(b.temps_alloue ?? total) || 0
  const tMach = Number(b.temps_machine_alloue ?? 0) || 0
  const frac = (d: number) => total > 0 ? d / total : 1 / parts.length
  // 1) réduire l'original au 1er morceau (garde sa place et son id)
  const { error: eUpd } = await updateBDT(id, { duree: r4(parts[0]), temps_alloue: r4(tAll * frac(parts[0])), temps_machine_alloue: r4(tMach * frac(parts[0])) })
  if (eUpd) return c.json({ ok: false, error: eUpd.message }, 400)
  // 2) créer les morceaux 2..N
  const COPY = ['num_affaire', 'cmd_id', 'cmd_ref', 'lot_id', 'lot_ref', 'client_nom', 'activite', 'piece', 'operation', 'machine_id', 'process_id', 'poste_id', 'priorite', 'prioritaire', 'matiere_ok', 'pv_requis', 'oas_avant', 'oas_apres', 'seq', 'date_echeance']
  const created: string[] = []
  for (let i = 1; i < parts.length; i++) {
    const payload: any = { id: `${id}-M${i + 1}`, statut: 'programme', operateur_id: null, debut: null, date_prevue: null }
    for (const col of COPY) if (b[col] != null) payload[col] = b[col]
    payload.duree = r4(parts[i]); payload.temps_alloue = r4(tAll * frac(parts[i])); payload.temps_machine_alloue = r4(tMach * frac(parts[i]))
    const { error } = await createBDTRow(payload)
    if (!error) created.push(payload.id)
  }
  return c.json({ ok: true, count: created.length + 1, created })
})

const opFullName = (op: any) => [op.prenom, op.nom].filter(Boolean).join(' ') || op.nom || op.matricule || op.id

app.post('/api/production/bdt/:id/recu', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const op = await verifyOperateurPin(body.matricule, body.pin)
  if (!op) return c.json({ ok: false, error: 'Matricule ou code PIN incorrect.' })
  // ── Porte OAS : un BDT « oas_avant » (juste après une étape OAS) n'est recevable
  //    qu'une fois le lot ENTIÈREMENT passé à l'OAS (qté traitée via balancelles ≥ qté lot). ──
  const allBdtG = await getBonsDeTravail().catch(() => [] as any[])
  const curB: any = (allBdtG as any[]).find(b => String(b.id) === String(id))
  if (curB && curB.oas_avant) {
    const [bals, lotsAll] = await Promise.all([getBalancelles().catch(() => [] as any[]), getLots().catch(() => [] as any[])])
    const lotId = String(curB.lot_id || curB.lot_ref || '')
    const lot: any = (lotsAll as any[]).find(l => String(l.id) === lotId)
    const qteLot = Number(lot?.qte || 0)
    let traite = 0
    for (const bal of (bals as any[])) {
      let items: any[] = []
      try { const o = JSON.parse(bal.observations || ''); if (o && Array.isArray(o.items)) items = o.items } catch { /* pas d'items */ }
      if (items.length) { for (const it of items) if (String(it.lot_id) === lotId) traite += Number(it.qte || 0) }
      else if (String(bal.lot_id || '') === lotId) traite += Number(bal.quantite || 0)
    }
    if (qteLot > 0 && traite < qteLot) {
      return c.json({ ok: false, error: `Étape après OAS : le lot doit d'abord passer entièrement à l'OAS (traité ${traite}/${qteLot}). Recevable une fois l'OAS terminée.` })
    }
  }
  const hhmm = new Date().toTimeString().slice(0, 5)
  const { data, error } = await updateBDT(id, { statut: 'recu', debut_reel: hhmm, operateur_id: op.id })
  if (error) return c.json({ ok: false, error: error.message })
  const nom = opFullName(op)
  const hist: Record<string, any> = {
    bdt_id: id, process_id: data?.process_id ?? null, machine_id: data?.machine_id ?? null,
    operateur_id: op.id, operateur_nom: nom, matricule: op.matricule,
    action: 'recu', statut: 'recu', resultat: null,
    debut_reel: hhmm, fin_reel: null, temps_reel: null,
    piece: data?.piece ?? null, operation: data?.operation ?? null, client_nom: data?.client_nom ?? null
  }
  await logOperateurHistorique(hist).catch(() => {})
  if (hist.machine_id) await logMachineHistorique(hist).catch(() => {})
  return c.json({ ok: true, data, operateur: nom, operateur_id: op.id })
})

app.post('/api/production/bdt/:id/solder', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const op = await verifyOperateurPin(body.matricule, body.pin)
  if (!op) return c.json({ ok: false, error: 'Matricule ou code PIN incorrect.' })
  // ─── Garde-fou OAS : un opérateur OAS ne solde pas de BDT (autocontrôle + passage de lots uniquement) ───
  const okSoldage = op.role !== 'oas' && (!Array.isArray(op.autorisations) || op.autorisations.includes('soldage') || op.autorisations.includes('all'))
  if (!okSoldage) return c.json({ ok: false, error: `${opFullName(op)} est un opérateur OAS : il réalise l'autocontrôle et le passage de lots OAS, mais ne solde pas les BDT. Faites solder par un opérateur de production.` })
  const fin = String(body.fin || '').slice(0, 5)
  const resultat = ['ok', 'reprise', 'nc'].includes(body.resultat) ? body.resultat : 'ok'
  const all = await getBonsDeTravail().catch(() => []) as any[]
  const cur = all.find((b: any) => String(b.id) === String(id))
  // ─── Gate compétences : l'opérateur doit maîtriser le process (matrice, niveau ≥ 1) ───
  //  Tolérant si la matrice n'est pas encore renseignée pour lui (aucune compétence saisie).
  const opOperation = String(cur?.operation || '').toLowerCase().trim()
  if (opOperation && body.bypass_competence !== true) {
    const comps = await getCompetences().catch(() => [] as any[])
    const mine = (comps as any[]).filter((cp: any) => String(cp.salarie_id ?? cp.employe_id) === String(op.id))
    const norm = (s: string) => String(s || '').toLowerCase().trim()
    const mastered = mine.some((cp: any) => norm(cp.operation) === opOperation && Number(cp.niveau || 0) >= 1)
    if (mine.length > 0 && !mastered) {
      return c.json({ ok: false, error: `${opFullName(op)} n'est pas habilité(e) à solder « ${cur?.operation} » (matrice de compétences). Mettez à jour la matrice (RH › Compétences) ou faites solder par un opérateur qualifié.` })
    }
  }
  let tempsReel: number | null = null
  if (cur?.debut_reel && fin) {
    const dp = String(cur.debut_reel).slice(0, 5).split(':').map(Number)
    const fp = fin.split(':').map(Number)
    if (dp.length === 2 && fp.length === 2) {
      const mins = (fp[0] * 60 + fp[1]) - (dp[0] * 60 + dp[1])
      tempsReel = Math.round((mins / 60) * 100) / 100
    }
  }
  const patch: Record<string, any> = { statut: 'solde', fin_reel: fin, resultat }
  if (tempsReel != null) patch.temps_reel = tempsReel
  const { data, error } = await updateBDT(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  // Cascade : recalcule l'avancement (bdt_total/bdt_soldes + lots soldés) ET le coût/marge réel(le) de la commande.
  // En PARALLÈLE : colonnes écrites disjointes (avancement vs coût/marge) → aucun conflit, latence divisée par ~2 au solde.
  {
    const _ref = (cur as any)?.cmd_id || (cur as any)?.cmd_ref || (cur as any)?.num_affaire
    await Promise.all([recomputeCmdAvancement(_ref).catch(() => {}), recomputeCmdCout(_ref).catch(() => {})])
  }
  const nom = opFullName(op)
  const hist: Record<string, any> = {
    bdt_id: id, process_id: data?.process_id ?? cur?.process_id ?? null, machine_id: data?.machine_id ?? cur?.machine_id ?? null,
    operateur_id: op.id, operateur_nom: nom, matricule: op.matricule,
    action: 'solde', statut: 'solde', resultat,
    debut_reel: cur?.debut_reel ?? null, fin_reel: fin, temps_reel: tempsReel,
    piece: data?.piece ?? cur?.piece ?? null, operation: data?.operation ?? cur?.operation ?? null, client_nom: data?.client_nom ?? cur?.client_nom ?? null
  }
  await logOperateurHistorique(hist).catch(() => {})
  if (hist.machine_id) await logMachineHistorique(hist).catch(() => {})
  if (resultat === 'nc') {
    const year = new Date().getFullYear()
    const existing = await getNonConformites().catch(() => []) as any[]
    let max = 0
    for (const r of existing) { const m = String(r.id || '').match(/NC-\d{4}-(\d+)/); if (m) { const v = parseInt(m[1], 10); if (v > max) max = v } }
    const n = String(max + 1).padStart(3, '0')
    // Gravité CHOISIE par l'opérateur (détermine si l'expédition est bloquée) ; une NC est TOUJOURS créée pour la Qualité.
    const gNc = String(body.gravite_nc || body.gravite || '').toLowerCase()
    const grav = /critique/.test(gNc) ? 'Critique' : /bloqu/.test(gNc) ? 'Bloquante' : /mineur/.test(gNc) ? 'Mineure' : 'Majeure'
    const affRef = (cur as any)?.num_affaire ?? (cur as any)?.cmd_ref ?? null
    await createNonConformiteRow({
      id: `NC-${year}-${n}`, date_nc: new Date().toISOString().slice(0, 10), type_nc: 'production',
      gravite: grav, statut: 'ouverte', operation: hist.operation, client_nom: hist.client_nom,
      lot_ref: cur?.lot_ref ?? null, num_affaire: affRef, affaire_id: (cur as any)?.affaire_id ?? null, bdt_id: id, detecteur: nom
    }).catch(() => {})
  }
  // ─── PV d'autocontrôle automatique au soldage ───
  //  Chaque solde de BDT produit un PV de contrôle (type 'autocontrole') visible
  //  dans le service Qualité. Si NC : statut = nc_ouverte / decision = bloque.
  try {
    const pvs = await getPVControles().catch(() => [] as any[])
    const numPv = nextSeqId('PV', (pvs as any[]).map(p => p.num_pv))
    await createPVControle({
      num_pv: numPv,
      date_pv: TODAY_ISO(),
      operateur_id: op.id,
      type_controle: 'autocontrole',
      type_lien: 'lot',
      lot_id: cur?.lot_id ?? cur?.lot_ref ?? null,
      piece: cur?.piece ?? null,
      client_nom: cur?.client_nom ?? null,
      statut: resultat === 'nc' ? 'nc_ouverte' : 'valide',
      decision: resultat === 'nc' ? 'bloque' : 'libere',
      observations: [
        `BDT ${id} — ${cur?.operation || ''}`,
        body.obs ? `Obs : ${body.obs}` : '',
        `Autocontrôle par ${nom}${tempsReel != null ? ` · temps réel ${tempsReel} h` : ''}`,
      ].filter(Boolean).join(' — '),
      anomalie: resultat === 'nc',
      nc_ouverte: resultat === 'nc',
    } as any)
  } catch (_e) { /* PV non bloquant */ }
  return c.json({ ok: true, data, operateur: nom })
})

// ─── API : clôturer une balancelle OAS via formulaire d'autocontrôle ──
//  Identifiant + PIN obligatoires · crée un PV de contrôle (type autocontrole)
//  visible dans Qualité, met le statut balancelle à 'termine' et le résultat.
app.post('/api/oas/balancelle/:id/cloturer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const op = await verifyOperateurPin(b.matricule, b.pin)
  if (!op) return c.json({ ok: false, error: 'Matricule ou code PIN incorrect.' }, 401)
  const bals = await getBalancelles().catch(() => [] as any[])
  const cur = (bals as any[]).find((x: any) => String(x.id) === String(id))
  if (!cur) return c.json({ ok: false, error: 'Balancelle introuvable' }, 404)
  const resultat: 'conforme' | 'non_conforme' = (String(b.resultat || 'conforme') === 'non_conforme') ? 'non_conforme' : 'conforme'
  const dateSortie = b.date_sortie || new Date().toISOString()
  const duree_min = (cur.date_entree && dateSortie)
    ? Math.max(0, Math.round((new Date(dateSortie).getTime() - new Date(cur.date_entree).getTime()) / 60000))
    : null
  // Patch balancelle
  const patchBal: any = { statut: 'termine', date_sortie: dateSortie, resultat }
  if (duree_min != null) patchBal.duree_min = duree_min
  // On garde le JSON multi-réf existant si présent, on ajoute le bloc autocontrôle
  let obsBase: any = {}
  try { obsBase = JSON.parse(cur.observations || '{}') || {} } catch (_e) { obsBase = { user_obs: cur.observations || '' } }
  obsBase.autocontrole = {
    operateur_id: op.id,
    operateur_nom: opFullName(op),
    matricule: op.matricule,
    date: TODAY_ISO(),
    ph_final: b.ph_final ?? null,
    temperature_finale: b.temperature_finale ?? null,
    cp: b.cp ?? null,
    cpk: b.cpk ?? null,
    aspect: b.aspect ?? null,
    epaisseur_um: b.epaisseur_um ?? null,
    observations: b.observations || '',
    resultat,
  }
  patchBal.observations = JSON.stringify(obsBase)
  const { data, error } = await updateBalancelle(id, patchBal)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // PV automatique
  let numPv: string | null = null
  try {
    const pvs = await getPVControles().catch(() => [] as any[])
    numPv = nextSeqId('PV', (pvs as any[]).map(p => p.num_pv))
    await createPVControle({
      num_pv: numPv,
      date_pv: TODAY_ISO(),
      operateur_id: op.id,
      type_controle: 'autocontrole',
      type_lien: 'lot',
      lot_id: cur.lot_id || null,
      piece: cur.piece || null,
      client_nom: (obsBase.items && obsBase.items[0] && obsBase.items[0].client) || null,
      statut: resultat === 'non_conforme' ? 'nc_ouverte' : 'valide',
      decision: resultat === 'non_conforme' ? 'bloque' : 'libere',
      cp: b.cp != null ? Number(b.cp) : null,
      cpk: b.cpk != null ? Number(b.cpk) : null,
      observations: [
        `Balancelle ${cur.num_session} — Oxydation anodique sulfurique`,
        b.ph_final ? `pH final ${b.ph_final}` : '',
        b.epaisseur_um ? `Épaisseur ${b.epaisseur_um} µm` : '',
        b.aspect ? `Aspect : ${b.aspect}` : '',
        b.observations ? `Obs : ${b.observations}` : '',
        `Autocontrôle par ${opFullName(op)}`,
      ].filter(Boolean).join(' — '),
      anomalie: resultat === 'non_conforme',
      nc_ouverte: resultat === 'non_conforme',
    } as any)
  } catch (_e) { /* PV non bloquant */ }
  return c.json({ ok: true, balancelle: data, pv_num: numPv })
})

// ─── API BST : affecter un lot à un sous-traitant ─────────────
//  Crée AUTOMATIQUEMENT un BC sous-traitant (statut 'brouillon' = en attente d'envoi)
//  qui apparaît dans la liste des Bons de Commande (Expéditions), et le BST du planning
//  y est relié (bc_id). Le statut affiché du BST suit ensuite le statut du BC ST.
app.post('/api/production/bst/affecter', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const lotId = body.lot_id, fournId = body.fournisseur_id
  if (!lotId || !fournId) return c.json({ ok: false, error: 'lot_id et fournisseur_id requis' })
  const [lots, sts, bcs] = await Promise.all([
    getLots().catch(() => []), getSousTraitantsAll().catch(() => []), getBonsDeCommande().catch(() => []),
  ])
  const lot = (lots as any[]).find((l: any) => String(l.id) === String(lotId))
  const st = (sts as any[]).find((f: any) => String(f.id) === String(fournId))
  const isUuid = UUID_RE.test(String(fournId))
  const piece = lot?.piece ?? '—'
  const operation = (Array.isArray(st?.prestations) && st.prestations[0]) || lot?.operation || 'Sous-traitance'
  const affaireFk = await resolveAffaireId(lot?.affaire_id || lot?.cmd_id)

  // 1) BC sous-traitant — statut 'brouillon' = en attente d'envoi
  const bcId = nextAffaireId('BC', lot?.num_affaire || lot?.affaire_id || lot?.cmd_id, (bcs as any[]).map((b: any) => b.id))
  const bcPayload: any = {
    id: bcId, num_bc: bcId, type_bc: 'sous_traitant',
    fournisseur_nom: st?.nom ?? null,
    articles: `${piece} — ${operation}`,
    affaire_id: affaireFk,
    montant_ht: 0, devise: 'EUR',
    date_bc: new Date().toISOString().slice(0, 10),
    statut: 'brouillon',
    notes: `Sous-traitance lot ${lotId}`,
    lignes: [{ article: piece, operation, qte: lot?.qte ?? 1, lot: String(lotId) }],
  }
  if (isUuid) bcPayload.sous_traitant_id = String(fournId)
  const bcRes = await createBonDeCommande(bcPayload)
  if (bcRes.error) return c.json({ ok: false, error: bcRes.error.message })

  // 2) BST du planning (bons_sous_traitance) relié au BC
  // Son numero est celui de son bon de commande : BC-2026-0001-03 -> BST-2026-0001-03-01.
  // (Avant : 'BST-' + horodatage base36, illisible et sans rapport avec l'affaire.)
  const bdsExistants = await getPlanningBDS().catch(() => [] as any[])
  const bdsPayload: Record<string, any> = {
    id: nextBstPourBc(bcId, (bdsExistants as any[]).map((x: any) => x.id)),
    statut: 'a_envoyer',
    date_envoi: new Date().toISOString().slice(0, 10),
    date_debut: body.day || new Date().toISOString().slice(0, 10),
    duree_days: body.duree_days ? Number(body.duree_days) : 5,
    client_nom: lot?.client_nom ?? null,
    piece, operation,
    qte: lot?.qte ?? 1,
    lot_ref: lot?.id ?? String(lotId),
    priorite: 'normale',
    bc_id: bcId,
  }
  if (isUuid) bdsPayload.sous_traitant_id = String(fournId)
  const { data, error } = await createBDSRow(bdsPayload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data, bc_id: bcId, fournisseur: st?.nom ?? String(fournId) })
})

// ─── API BST : affecter un BST EXISTANT (du planning) à un sous-traitant ───
//  Crée le BC sous-traitant s'il n'existe pas encore, le relie au BST (bc_id),
//  et passe le BST en 'a_envoyer' (en attente d'envoi). Idempotent sur le BC.
app.post('/api/production/bst/:id/affecter-st', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const fournId = body.sous_traitant_id
  const day = body.day || new Date().toISOString().slice(0, 10)
  const [bdsList, sts, bcs] = await Promise.all([
    getPlanningBDS().catch(() => []), getSousTraitantsAll().catch(() => []), getBonsDeCommande().catch(() => []),
  ])
  const bds = (bdsList as any[]).find((x: any) => String(x.id) === String(id))
  if (!bds) return c.json({ ok: false, error: 'BST introuvable' }, 404)
  const st = (sts as any[]).find((f: any) => String(f.id) === String(fournId))
  const isUuid = UUID_RE.test(String(fournId || ''))
  let bcId = bds.bc_id || null

  // Crée le BC ST seulement s'il n'existe pas encore pour ce BST
  if (!bcId) {
    bcId = nextAffaireId('BC', (bds as any).num_affaire || (bds as any).cmd_ref || (bds as any).lot_ref, (bcs as any[]).map((b: any) => b.id))
    const piece = bds.piece || '—'
    const operation = bds.operation || (Array.isArray(st?.prestations) && st.prestations[0]) || 'Sous-traitance'
    const bcPayload: any = {
      id: bcId, num_bc: bcId, type_bc: 'sous_traitant',
      fournisseur_nom: st?.nom ?? null,
      articles: `${piece} — ${operation}`,
      affaire_id: await resolveAffaireId(bds.affaire_id || bds.cmd_ref || bds.cmd_id),
      montant_ht: 0, devise: 'EUR',
      date_bc: new Date().toISOString().slice(0, 10),
      statut: 'brouillon',
      notes: `Sous-traitance lot ${bds.lot_ref || ''}`.trim(),
      lignes: [{ article: piece, operation, qte: bds.qte ?? 1, lot: bds.lot_ref || null }],
    }
    if (isUuid) bcPayload.sous_traitant_id = String(fournId)
    const bcRes = await createBonDeCommande(bcPayload)
    if (bcRes.error) return c.json({ ok: false, error: bcRes.error.message })
  }

  // Met à jour le BST : ST, dates, lien BC, statut 'a_envoyer'
  const patch: any = { date_envoi: day, date_debut: day, statut: 'a_envoyer', bc_id: bcId }
  if (body.duree_days) patch.duree_days = Number(body.duree_days)
  if (isUuid) patch.sous_traitant_id = String(fournId)
  const { data, error } = await updateBDS(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data, bc_id: bcId, fournisseur: st?.nom ?? String(fournId) })
})

// ─── API : créer une machine + l'intégrer au planning BDT (process atelier) ───
app.post('/api/production/machine', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.nom || !String(b.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  const machines = await getMachines().catch(() => [] as any[])
  const year = new Date().getFullYear()
  const existingIds = new Set((machines as any[]).map((m: any) => String(m.id)))
  const existingCodes = new Set((machines as any[]).map((m: any) => String(m.code ?? '').trim().toLowerCase()).filter(Boolean))
  // ID séquentiel MACH-YYYY-NNN basé sur le MAX existant (jamais length+1 → évite les collisions), bouclé jusqu'à un id libre.
  let mId = b.id ? String(b.id).trim() : ''
  if (!mId) {
    let n = 0
    ;(machines as any[]).forEach((m: any) => { const mm = String(m.id).match(/^MACH-\d{4}-(\d+)$/); if (mm) { const x = parseInt(mm[1], 10); if (x > n) n = x } })
    do { n++; mId = 'MACH-' + year + '-' + String(n).padStart(3, '0') } while (existingIds.has(mId))
  } else if (existingIds.has(mId)) {
    return c.json({ ok: false, error: 'Une machine avec cet identifiant existe déjà.' }, 400)
  }
  // Code (NOT NULL + UNIQUE) : défaut = id ; si le code saisi est déjà utilisé, on le rend unique (-2, -3…) au lieu d'échouer.
  let code = (b.code != null && String(b.code).trim()) ? String(b.code).trim() : mId
  if (existingCodes.has(code.toLowerCase())) {
    const base = code; let i = 2; while (existingCodes.has((base + '-' + i).toLowerCase())) i++; code = base + '-' + i
  }
  const activite = ['Seem', 'Semrac', 'both', 'OAS'].includes(b.activite) ? b.activite : 'Seem'   // OAS = traitement de surface (hors planning)
  const ops = Array.isArray(b.operations) ? b.operations : (b.operations ? String(b.operations).split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  const machinePayload: any = {
    id: mId,
    nom: String(b.nom).trim(),
    code,
    activite,
    categorie: b.categorie || null,
    operations: ops,
    capacite_h: b.capacite_h != null ? Number(b.capacite_h) : 8,
    cout_h: b.cout_h != null ? Number(b.cout_h) : 35,
    tolerance_defaut: (b.tolerance_defaut != null && b.tolerance_defaut !== '') ? Number(b.tolerance_defaut) : null,
    statut: b.statut || 'operationnel',
    couleur: b.couleur || '#6366f1',
  }
  if (b.poste_id) machinePayload.poste_id = String(b.poste_id)   // rattachement au poste (seulement si fourni → compat pré-migration)
  if (typeof b.cnc === 'boolean') machinePayload.cnc = b.cnc     // flag CNC
  let { data: machine, error } = await createMachine(machinePayload)
  if (error && /\bcnc\b/i.test(error.message || '') && 'cnc' in machinePayload) {  // colonne cnc absente (migration pas encore passée) → réessaie sans
    delete machinePayload.cnc
    ;({ data: machine, error } = await createMachine(machinePayload))
  }
  if (error) return c.json({ ok: false, error: error.message }, 400)

  // Intégration automatique au planning BDT : un process atelier "machine" rattaché (hérite du poste de la machine).
  let procId: string | null = null
  if (b.create_process !== false) {
    procId = 'proc-' + Date.now().toString(36)   // id robuste (jamais de collision), comme la création manuelle de process
    const { error: pErr } = await createProcessAtelier({
      id: procId, nom: b.nom_process || String(b.nom).trim(), code,
      activite, categorie: b.categorie || 'Machine',
      requiert_machine: true, machine_id: mId,
      operations: ops, couleur: machinePayload.couleur, statut: 'actif',
      ordre: 100,
      ...(machinePayload.poste_id ? { poste_id: machinePayload.poste_id } : {}),
    })
    if (pErr) procId = null
  }
  return c.json({ ok: true, machine, process_id: procId })
})

// ─── API : modifier une machine ───
app.patch('/api/production/machine/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  if ('nom' in b) patch.nom = String(b.nom).trim()
  // Code NOT NULL + UNIQUE : on ne le met à jour que si une valeur non vide est fournie (jamais null),
  // et on le rend unique vis-à-vis des AUTRES machines (suffixe -2, -3…) plutôt que d'échouer.
  if ('code' in b && b.code != null && String(b.code).trim()) {
    let code = String(b.code).trim()
    const machs = await getMachines().catch(() => [] as any[])
    const others = new Set((machs as any[]).filter((m: any) => String(m.id) !== String(id)).map((m: any) => String(m.code ?? '').trim().toLowerCase()).filter(Boolean))
    if (others.has(code.toLowerCase())) { const base = code; let i = 2; while (others.has((base + '-' + i).toLowerCase())) i++; code = base + '-' + i }
    patch.code = code
  }
  if ('activite' in b) patch.activite = ['Seem', 'Semrac', 'both', 'OAS'].includes(b.activite) ? b.activite : 'Seem'   // OAS = traitement de surface
  if ('categorie' in b) patch.categorie = b.categorie || null
  if ('capacite_h' in b) patch.capacite_h = Number(b.capacite_h) || 8
  if ('cout_h' in b) patch.cout_h = Number(b.cout_h) || 35
  if ('tolerance_defaut' in b) patch.tolerance_defaut = (b.tolerance_defaut != null && b.tolerance_defaut !== '') ? Number(b.tolerance_defaut) : null
  if ('statut' in b) patch.statut = b.statut
  if ('couleur' in b) patch.couleur = b.couleur
  if ('poste_id' in b) patch.poste_id = b.poste_id ? String(b.poste_id) : null   // rattacher / détacher du poste
  if ('cnc' in b) patch.cnc = !!b.cnc                                             // flag CNC (retry sans si colonne absente)
  if ('operations' in b) patch.operations = Array.isArray(b.operations) ? b.operations : (b.operations ? String(b.operations).split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  let { data, error } = await updateMachine(id, patch)
  if (error && /\bcnc\b/i.test(error.message || '') && 'cnc' in patch) { delete patch.cnc; ({ data, error } = await updateMachine(id, patch)) }
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, machine: data })
})

// ─── API : supprimer une machine (et détacher les process liés) ───
app.delete('/api/production/machine/:id', async (c) => {
  const id = c.req.param('id')
  // Détacher les process ateliers rattachés à cette machine pour éviter les liens morts
  try {
    const procs = await getProcessAtelier().catch(() => [] as any[])
    for (const p of (procs as any[])) {
      if (String(p.machine_id) === String(id)) {
        await updateProcessAtelier(p.id, { machine_id: null, requiert_machine: false }).catch(() => {})
      }
    }
  } catch { /* non bloquant */ }
  const { error } = await deleteMachine(id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── API : présence opérateur (upsert d'une case jour×opérateur) ───
app.post('/api/production/presence', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.operateur_id || !b.date_presence) return c.json({ ok: false, error: 'operateur_id et date_presence requis' }, 400)
  const shift = ['matin', 'apmidi', 'journee', 'soir', 'absent'].includes(b.shift) ? b.shift : 'journee'
  // Nom + activité dérivés de la source de vérité (salaries) — jamais le nom figé du front
  const sals = await getSalaries().catch(() => [] as any[])
  const s = (sals as any[]).find(x => String(x.id) === String(b.operateur_id))
  const { data, error } = await upsertPresence({
    operateur_id: String(b.operateur_id),
    operateur_nom: s ? (`${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.id) : (b.operateur_nom || null),
    activite: s ? s.entite : (b.activite || null),
    date_presence: b.date_presence,
    shift,
    source: b.source || 'manuel',
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, presence: data })
})

// ─── API : affectation opérateur → poste/process (planning, par jour) ───
app.post('/api/planning/affectation-poste', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.operateur_id || !b.process_id) return c.json({ ok: false, error: 'operateur_id et process_id requis' }, 400)
  const date_affectation = b.date_affectation || new Date().toISOString().slice(0, 10)
  const [sals, procs] = await Promise.all([
    getSalaries().catch(() => [] as any[]),
    getProcessAtelier().catch(() => [] as any[]),
  ])
  const s = (sals as any[]).find(x => String(x.id) === String(b.operateur_id))
  const p = (procs as any[]).find(x => String(x.id) === String(b.process_id))
  if (!p) return c.json({ ok: false, error: 'process introuvable' }, 400)
  const { data, error } = await upsertAffectationPoste({
    operateur_id: String(b.operateur_id),
    process_id: String(b.process_id),
    date_affectation,
    shift: b.shift || '',
    poste_nom: p.nom ?? null,
    operateur_nom: s ? (`${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.id) : null,
    source: b.source || 'manuel',
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, affectation: data })
})

app.delete('/api/planning/affectation-poste', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.operateur_id) return c.json({ ok: false, error: 'operateur_id requis' }, 400)
  const date_affectation = b.date_affectation || new Date().toISOString().slice(0, 10)
  // Suppression ciblée si process_id fourni (retrait d'une seule affectation), sinon toutes pour l'opérateur/jour
  const { error } = await deleteAffectationPoste(
    String(b.operateur_id), date_affectation,
    b.process_id != null ? String(b.process_id) : null,
    b.shift != null ? String(b.shift) : ''
  )
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── API : interlocuteurs (contacts multiples par fournisseur / sous-traitant / client) ───
const ENTITE_TYPES = ['fournisseur', 'sous_traitant', 'client']
app.get('/api/interlocuteurs', async (c) => {
  const type = String(c.req.query('type') || '')
  const id = String(c.req.query('id') || '')
  if (!ENTITE_TYPES.includes(type) || !id) return c.json({ ok: false, error: 'type et id requis' }, 400)
  const data = await getInterlocuteurs(type, id).catch(() => [])
  return c.json({ ok: true, interlocuteurs: data })
})

app.post('/api/interlocuteurs', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!ENTITE_TYPES.includes(b.entite_type) || !b.entite_id) return c.json({ ok: false, error: 'entite_type et entite_id requis' }, 400)
  if (!b.nom || !String(b.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  const principal = !!b.principal
  const { data, error } = await createInterlocuteur({
    entite_type: b.entite_type,
    entite_id: String(b.entite_id),
    nom: String(b.nom).trim(),
    fonction: b.fonction || null,
    email: b.email || null,
    telephone: b.telephone || null,
    principal,
    notes: b.notes || null,
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  if (principal && data) await clearInterlocuteurPrincipal(b.entite_type, String(b.entite_id), data.id).catch(() => {})
  return c.json({ ok: true, interlocuteur: data })
})

app.patch('/api/interlocuteurs/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['nom', 'fonction', 'email', 'telephone', 'principal', 'notes']) if (k in b) patch[k] = b[k]
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateInterlocuteur(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  if (patch.principal === true && data) await clearInterlocuteurPrincipal(data.entite_type, data.entite_id, id).catch(() => {})
  return c.json({ ok: true, interlocuteur: data })
})

app.delete('/api/interlocuteurs/:id', async (c) => {
  const { error } = await deleteInterlocuteur(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── API : créer une balancelle OAS multi-ref ─────────────────
//  Items = [{lot_id, ref, surface_unit, qte}] · max 550000 mm² total
//  Le détail multi-ref est stocké en JSON dans observations.
app.post('/api/oas/balancelle', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const items: any[] = Array.isArray(b.items) ? b.items : []
  if (items.length === 0) return c.json({ ok: false, error: 'Au moins un item requis' }, 400)
  // Surface unitaire = surface développée de la pièce, RELIÉE À LA NOMENCLATURE (dm² → mm²),
  // avec repli sur la valeur saisie si la pièce n'a pas encore de surface en nomenclature.
  const _noms = await getNomenclatures().catch(() => [] as any[])
  const _norm = (s: any) => String(s || '').toLowerCase().trim()
  const surfaceDm2ParRef = (ref: any) => {
    const r = _norm(ref); if (!r) return null
    const n = (_noms as any[]).find((x: any) => _norm(x.code_ref_produit) === r || _norm(x.description) === r)
            || (_noms as any[]).find((x: any) => _norm(x.code_ref_produit) && r.includes(_norm(x.code_ref_produit)))
    const v = n && n.surface_totale_dm2 != null ? Number(n.surface_totale_dm2) : null
    return v && v > 0 ? v : null
  }
  for (const it of items) {
    if (!it.lot_id) return c.json({ ok: false, error: 'lot_id requis pour chaque item' }, 400)
    if (Number(it.qte) <= 0) return c.json({ ok: false, error: 'Quantité invalide' }, 400)
    const sdm2 = surfaceDm2ParRef(it.ref || it.piece)
    it.surface_unit = sdm2 != null ? sdm2 * 10000 : Number(it.surface_unit || 0)
    it.surface_source = sdm2 != null ? 'nomenclature' : 'manuel'
    if (Number(it.surface_unit) <= 0) return c.json({ ok: false, error: `Surface inconnue pour « ${it.ref || it.piece || '?'} » : renseignez la surface totale de la pièce dans la nomenclature (dm²), ou saisissez-la manuellement.` }, 400)
  }
  const totalSurface = items.reduce((s, it) => s + Number(it.surface_unit || 0) * Number(it.qte || 0), 0)
  if (totalSurface > 550000) return c.json({ ok: false, error: `Surface ${Math.round(totalSurface)} mm² > 550000 mm²` }, 400)
  const totalQte = items.reduce((s, it) => s + Number(it.qte || 0), 0)
  const now = new Date()
  const num = b.num_session || ('OAS-' + now.getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000))
  const pieces = items.map(it => it.ref || it.piece).filter(Boolean).join(', ')
  // Type de traitement OAS = nom d'un process OAS (choix dynamique, cf. postes OAS). Coercition défensive : chaîne courte.
  const _typeOas = (b.type_traitement != null && String(b.type_traitement).trim() !== '') ? String(b.type_traitement).trim().slice(0, 80) : null
  const obsPayload = { items, total_surface_mm2: Math.round(totalSurface), charge_pct: Math.round(totalSurface / 550000 * 100), user_obs: b.observations || '', type_traitement: _typeOas }
  const payload = {
    // id (uuid) généré par la DB (gen_random_uuid) ; num_session = identifiant lisible
    num_session: num,
    lot_id: items[0].lot_id,
    piece: pieces.slice(0, 200),
    quantite: totalQte,
    bain_nom: b.bain_nom || 'Principal OAS',
    operateur_id: b.operateur_id || null,
    date_entree: b.date_entree || now.toISOString(),
    date_sortie: b.date_sortie || null,
    statut: (b.date_sortie ? 'termine' : 'en_cours') as 'en_cours' | 'termine',
    resultat: b.resultat || null,
    surface_totale_dm2: +(totalSurface / 10000).toFixed(2),
    observations: JSON.stringify(obsPayload),
  } as any
  const { data, error } = await createBalancelle(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, balancelle: data, total_surface_mm2: Math.round(totalSurface), charge_pct: Math.round(totalSurface / 550000 * 100) })
})

// ─── API : releve consommation d'eau (OAS) ───────────────────
app.post('/api/oas/releve-eau', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.date_releve) return c.json({ ok: false, error: 'Date obligatoire' }, 400)
  const num = (v: any) => { if (v == null || v === '') return null; const n = Number(v); return isNaN(n) ? null : n }
  const payload: Record<string, any> = {
    date_releve: b.date_releve,
    operateur_id: b.operateur_id || null,
    volume_m3: num(b.volume_m3),
    ph: num(b.ph),
    temperature: num(b.temperature),
    turbidite: num(b.turbidite),
    chlore: num(b.chlore),
    observations: b.observations || null,
    conforme: b.conforme !== false,
  }
  const { data, error } = await createReleveEau(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // ─── Pont OAS -> HSE : miroir du releve en mesure(s) environnementale(s) ───
  // Supprime la double saisie eau (KPI eauMois, securite.tsx) et couvre l'autosurveillance
  // rejet aqueux (pH / turbidite / chlore). Non bloquant pour le releve.
  let hse_creee = 0
  const _ent = b.entite === 'Semrac' ? 'Semrac' : 'Seem'
  try {
    if (payload.volume_m3 != null) {
      const { error: e1 } = await createHseMesureEnv({
        entite: _ent, type: 'conso_eau', date_mesure: payload.date_releve,
        point_mesure: 'OAS', parametre: 'Consommation eau', valeur: payload.volume_m3,
        unite: 'm³', vle: null, conforme: payload.conforme !== false, organisme: null,
        observations: 'Auto depuis releve OAS' + (payload.observations ? ' - ' + payload.observations : ''),
      })
      if (!e1) hse_creee++
    }
    const _rej: Array<[string, string, string]> = [['ph', 'pH', ''], ['turbidite', 'Turbidite', 'NTU'], ['chlore', 'Chlore', 'mg/L']]
    for (const [k, label, unite] of _rej) {
      if (payload[k] != null) {
        const { error: e2 } = await createHseMesureEnv({
          entite: _ent, type: 'rejet_eau', date_mesure: payload.date_releve,
          point_mesure: 'Rejet OAS', parametre: label, valeur: payload[k],
          unite, vle: null, conforme: payload.conforme !== false, organisme: null,
          observations: 'Auto depuis releve OAS',
        })
        if (!e2) hse_creee++
      }
    }
  } catch (_e) { /* pont HSE non bloquant */ }
  return c.json({ ok: true, releve: data, hse_creee })
})

// ─── API : releve periodique bain (OAS) — bain non conforme => NC ──
app.post('/api/oas/releve-bain', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.date_releve || !b.bain_nom) return c.json({ ok: false, error: 'Date et bain obligatoires' }, 400)
  const num = (v: any) => { if (v == null || v === '') return null; const n = Number(v); return isNaN(n) ? null : n }
  const conforme = b.conforme !== false
  const payload: Record<string, any> = {
    date_releve: b.date_releve,
    bain_nom: b.bain_nom,
    operateur_id: b.operateur_id || null,
    ph: num(b.ph),
    temperature: num(b.temperature),
    concentration_gl: num(b.concentration_gl),
    densite: num(b.densite),
    titrage_acide: num(b.titrage_acide),
    titrage_alu: num(b.titrage_alu),
    conductivite: num(b.conductivite),
    observations: b.observations || null,
    conforme,
  }
  const { data, error } = await createReleveBain(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  let nc_creee = false
  if (!conforme) {
    try {
      const ncs = await getNonConformites().catch(() => [] as any[])
      const { error: ncErr } = await createNonConformiteRow({
        id: nextSeqId('NC', (ncs as any[]).map(n => n.id)),
        date_nc: TODAY_ISO(),
        type_nc: 'oas',
        gravite: 'Majeure',
        statut: 'ouverte',
        operation: 'Oxydation anodique sulfurique',
        detecteur: b.operateur || 'OAS',
        lot_ref: 'Bain ' + b.bain_nom + ' hors seuils',
      })
      nc_creee = !ncErr
    } catch (_e) { /* NC non bloquante pour le releve */ }
  }
  // ─── Pont OAS -> HSE : miroir du relevé de bain en mesures environnementales (onglet Environnement › Rejets & mesures) ───
  let hse_creee = 0
  const _ent = b.entite === 'Semrac' ? 'Semrac' : 'Seem'
  try {
    const _params: Array<[string, string, string]> = [
      ['ph', 'pH bain', ''], ['temperature', 'Température bain', '°C'],
      ['concentration_gl', 'Concentration', 'g/L'], ['densite', 'Densité', ''],
      ['titrage_acide', 'Titrage acide', ''], ['titrage_alu', 'Titrage aluminium', ''],
      ['conductivite', 'Conductivité', 'µS/cm'],
    ]
    for (const [k, label, unite] of _params) {
      if (payload[k] != null) {
        const { error: em } = await createHseMesureEnv({
          entite: _ent, type: 'rejet_eau', date_mesure: payload.date_releve,
          point_mesure: 'Bain OAS — ' + payload.bain_nom, parametre: label, valeur: payload[k],
          unite, vle: null, conforme, organisme: null,
          observations: 'Auto depuis relevé de bain OAS' + (payload.observations ? ' - ' + payload.observations : ''),
        })
        if (!em) hse_creee++
      }
    }
  } catch (_e) { /* pont HSE non bloquant */ }
  return c.json({ ok: true, releve: data, nc_creee, hse_creee })
})

// ─── API : clore une balancelle OAS ──────────────────────────
app.patch('/api/oas/balancelle/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['date_sortie', 'statut', 'resultat', 'observations', 'duree_min', 'bain_nom']) if (k in b) patch[k] = b[k]
  const { data, error } = await updateBalancelle(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, balancelle: data })
})

// ─── API : déclaration de sortie matière liée à un BDT ───
//  type 'matiere'/'fourniture' = production pièce ; 'consommable' = lié à une machine (OPEX)
app.post('/api/production/sortie-matiere', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const qte = Number(b.quantite ?? 0) || 0
  if (!b.article_id && !b.article_nom) return c.json({ ok: false, error: 'Article requis' }, 400)
  if (qte <= 0) return c.json({ ok: false, error: 'Quantité invalide' }, 400)
  const stock = await getStockReel().catch(() => [] as any[])
  // Résolution article : par id/référence (article_id) OU par désignation/référence (article_nom du planning = la RÉF saisie).
  const anom = String(b.article_nom || '').toLowerCase().trim()
  const art = (stock as any[]).find(s => String(s.id) === String(b.article_id) || String(s.reference) === String(b.article_id) || (anom && (String(s.designation || '').toLowerCase().trim() === anom || String(s.reference || '').toLowerCase().trim() === anom)))
  const avant = art ? Number(art.stock_actuel ?? 0) : null
  const apres = avant != null ? avant - qte : null
  const categorie = ['matiere', 'fourniture', 'consommable'].includes(b.categorie) ? b.categorie : 'matiere'
  const year = new Date().getFullYear()
  const mvtId = 'MVT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString(36).slice(-4)
  const payload: any = {
    id: mvtId,
    article_id: art ? art.id : (b.article_id || null),
    article_nom: art ? art.designation : (b.article_nom || null),
    type: 'sortie',
    quantite: qte,
    quantite_avant: avant,
    quantite_apres: apres,
    date_mvt: new Date().toISOString().slice(0, 10),
    motif: b.motif || ('Sortie ' + categorie + (b.bdt_id ? ' — BDT ' + b.bdt_id : '')),
    operateur: b.operateur || null,
    categorie,
    bdt_id: b.bdt_id || null,
    lot_id: b.lot_id || null,
    machine_id: categorie === 'consommable' ? (b.machine_id || null) : null,
  }
  // Consommable rattaché à un POSTE (OPEX des postes manuels sans machine) — seulement si fourni (compat pré-migration)
  if (categorie === 'consommable' && b.poste_id) payload.poste_id = String(b.poste_id)
  if (art) payload.stock_id = art.id
  const { data, error } = await createMouvementStock(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Décrémente le stock réel si l'article est connu
  if (art && apres != null) {
    await updateStockArticle(art.id, { stock_actuel: apres, dernier_mouvement: new Date().toISOString() }).catch(() => {})
  }
  return c.json({ ok: true, mouvement: data, stock_apres: apres, opex_machine: payload.machine_id || null })
})

// PRODUCTION SERVICE (nouvelles pages)
app.get('/production/gantt-bdt', async (c) => {
  const [bdts, machines, ops, procs, postes, prepRows] = await Promise.all([
    getBonsDeTravail(), getMachines(), getOperateurs(),
    getProcessAtelier().catch(() => []), getPostes().catch(() => []), getPreparationsTechniques().catch(() => [])
  ])
  // Même goulotte matière + prépa que /production/service.
  const bdtsPrets = filtrerBdtsPrets(bdts as any[], prepRows as any[])
  return c.html(pageGanttBDT(bdtsPrets, machines, ops, procs as any, postes as any))
})
app.get('/production/gantt-bst', async (c) => {
  const [lots, fournisseurs] = await Promise.all([getLots(), getFournisseursSt()])
  return c.html(pageGanttBST(lots, fournisseurs))
})
app.get('/production/commandes', async (c) => {
  const cmds = await getCommandes()
  return c.html(pageCommandesProd(cmds))
})
app.get('/production/lots', async (c) => {
  const lots = await getLots()
  return c.html(pageLotsProd(lots))
})
// ─── DÉTAIL COMMANDE : tous les lots, découpés en BDT/BDS (ordre des opérations) ───
app.get('/production/commande/:id', async (c) => {
  const id = decodeURIComponent(c.req.param('id'))
  const [cmds, lots, bdts, bsts] = await Promise.all([
    getCommandes().catch(() => []), getLots().catch(() => []),
    getBonsDeTravail().catch(() => []), getPlanningBDS().catch(() => [])
  ])
  const cmd = (cmds as any[]).find(x => String(x.id) === id || String(x.num_affaire) === id)
  const cid = cmd ? String(cmd.id) : id
  const num = cmd ? String(cmd.num_affaire ?? '') : ''
  const idSet = new Set([cid, num, id, 'CMD-2026-' + num].filter(Boolean))
  const mBdt = (bdts as any[]).filter(b => idSet.has(String(b.cmd_id ?? '')) || idSet.has(String(b.num_affaire ?? '')) || idSet.has(String(b.cmd_ref ?? '')))
  const mBst = (bsts as any[]).filter(s => idSet.has(String(s.cmd_id ?? '')) || idSet.has(String(s.cmd_ref ?? '')))
  const mLots = (lots as any[]).filter(l => idSet.has(String(l.cmd_id ?? '')))
  return c.html(pageCommandeDetail(id, cmd as any, mLots as any, mBdt, mBst))
})
// ─── DÉTAIL LOT : liste des BDT/BDS = étapes de production ───
app.get('/production/lot/:id', async (c) => {
  const id = decodeURIComponent(c.req.param('id'))
  // getLotDetail(id) ne dépend d'aucun autre résultat → le mettre DANS le Promise.all (au lieu d'un await en série) supprime un aller-retour réseau.
  const [cmds, lots, bdts, bsts, noms, dts, detail] = await Promise.all([
    getCommandes().catch(() => []), getLots().catch(() => []),
    getBonsDeTravail().catch(() => []), getPlanningBDS().catch(() => []),
    getNomenclatures().catch(() => []), getDemandesTravaux().catch(() => []),
    getLotDetail(id).catch(() => null as any)
  ])
  const lot = (lots as any[]).find(l => String(l.id) === id)
  const cmd = lot ? (cmds as any[]).find(x => String(x.id) === String(lot.cmd_id)) : undefined
  const mBdt = (bdts as any[]).filter(b => String(b.lot_id ?? '') === id || String(b.lot_ref ?? '') === id)
  const mBst = (bsts as any[]).filter(s => String(s.lot_id ?? '') === id || String(s.lot_ref ?? '') === id)
  // ── Gamme (nomenclature) + n° de plan pour l'Ordre de Fabrication ──
  const nrm = (s: any) => String(s ?? '').trim().toLowerCase()
  const piece = nrm(lot?.piece)
  const aff = nrm((cmd as any)?.num_affaire ?? lot?.affaire_id)
  let nom: any = null
  if ((cmd as any)?.nomenclature_id) nom = (noms as any[]).find(n => String(n.id) === String((cmd as any).nomenclature_id))
  if (!nom) nom = (noms as any[]).find(n => String(n.lot_id ?? '') === id)
  if (!nom && piece) nom = (noms as any[]).find(n => nrm(n.code_ref_produit) === piece || nrm(n.num_nom) === piece)
  if (!nom && aff) nom = (noms as any[]).find(n => nrm(n.num_affaire) === aff)
  // n° de plan : sur les pièces détaillées (commande puis DT de l'affaire)
  const pickPlan = (src: any) => {
    const ps = Array.isArray(src?.pieces_detail) ? src.pieces_detail : (Array.isArray(src?.pieces) ? src.pieces : [])
    const mp = ps.find((p: any) => p && typeof p === 'object' && (nrm(p.ref_interne) === piece || nrm(p.ref) === piece || nrm(p.ref_client) === piece))
    return mp ? (mp.nom_plan || mp.plan || '') : ''
  }
  let planRef = cmd ? pickPlan(cmd) : ''
  if (!planRef) { const dt = (dts as any[]).find(d => nrm(d.num_affaire) === aff); if (dt) planRef = pickPlan(dt) }
  return c.html(pageLotDetail(id, lot as any, cmd as any, mBdt, mBst, detail, nom, planRef))
})
// Anciens dashboards production (données simulées en dur) → remplacés par les dashboards réels reliés DB.
app.get('/production/dashboard-programmation', (c) => c.redirect('/dashboard/programmation', 301))
app.get('/production/dashboard-production', (c) => c.redirect('/dashboard/production', 301))

// NOUVELLES ROUTES PRODUCTION
app.get('/production/pointage',      (c) => c.redirect('/rh/pointage'))
app.get('/production/matricule',     (c) => c.redirect('/rh/employes'))
app.get('/production/non-faits',     (c) => c.redirect('/production/service'))
app.get('/production/fiches-suivi',  (c) => c.redirect('/production/service'))
app.get('/production/st-liste',      (c) => c.redirect('/production/service'))
app.get('/production/suivi-st',      (c) => c.redirect('/production/service'))
// Route DA automatiques (Achats) → page Achats réelle
app.get('/achats/da-auto',           (c) => c.redirect('/achats/service'))

app.get('/production/bdt', async (c) => {
  const escb = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')   // échappement HTML complet (attributs ET contenu texte des <option>)
  const [machines, controles, sals] = await Promise.all([
    getMachines().catch(() => [] as any[]),
    getControlesCotes().catch(() => [] as any[]),
    getSalaries().catch(() => [] as any[]),
  ])
  const ops = (sals as any[]).filter((s: any) => s.est_operateur === true && s.actif !== false)
  const opNames = ops.map((s: any) => `${s.prenom || ''} ${s.nom || ''}`.trim()).filter(Boolean)
  const machOpts = (machines as any[]).map((m: any) => `<option value="${escb(m.id)}" data-nom="${escb(m.nom)}" data-tol="${m.tolerance_defaut != null ? m.tolerance_defaut : ''}">${escb(m.nom)}${m.code ? ' (' + escb(m.code) + ')' : ''}</option>`).join('')
  const memo: Record<string, any> = {}
  const pieces = new Set<string>(); const cotes = new Set<string>()
  for (const x of (controles as any[])) {
    if (x.piece) pieces.add(x.piece); if (x.cote) cotes.add(x.cote)
    const k = `${x.piece || ''}|${x.cote || ''}`
    if (!memo[k]) memo[k] = { nominale: x.nominale, tol_min: x.tol_min, tol_max: x.tol_max }
  }
  const memoJson = JSON.stringify(memo).replace(/</g, '\\u003c')
  const dl = (id: string, vals: string[]) => `<datalist id="${id}">${vals.map(v => `<option value="${escb(v)}"></option>`).join('')}</datalist>`
  const ci = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;background:#f8fafc;'
  const cl = 'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'
  const coteCard = `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-top:16px;border-top:4px solid #0d9488;">
      <div style="font-weight:800;color:#0f766e;font-size:.95rem;margin-bottom:4px;"><i class="fas fa-ruler-combined" style="margin-right:6px;"></i>Contrôle des cotes → carte de contrôle machine</div>
      <div style="font-size:.74rem;color:#64748b;margin-bottom:14px;">Mesure une cote de ta pièce. Chaque saisie alimente automatiquement la <strong>carte de contrôle</strong> et la <strong>capabilité</strong> de la machine (Cp / Cpk sur l'écart réduit). Les cotes déjà connues se re-proposent et pré-remplissent les tolérances.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        <div><label style="${cl}">Machine</label><select id="bc_machine" onchange="bcMachineTol()" style="${ci}">${machOpts}</select></div>
        <div><label style="${cl}">N° BDT <span style="color:#cbd5e1;">(option.)</span></label><input id="bc_bdt" style="${ci}" placeholder="BDT-…"/></div>
        <div><label style="${cl}">Opérateur</label><input id="bc_op" list="bc_ops" style="${ci}"/>${dl('bc_ops', opNames)}</div>
        <div><label style="${cl}">Pièce</label><input id="bc_piece" list="bc_pieces" oninput="bcFill()" style="${ci}" placeholder="réf pièce"/>${dl('bc_pieces', [...pieces])}</div>
        <div><label style="${cl}">Cote</label><input id="bc_cote" list="bc_cotes" oninput="bcFill()" style="${ci}" placeholder="ex : Ø12 H7"/>${dl('bc_cotes', [...cotes])}</div>
        <div><label style="${cl}">Mesure relevée</label><input id="bc_mes" type="number" step="any" style="${ci}border-color:#0d9488;"/></div>
        <div><label style="${cl}">Nominale (cible)</label><input id="bc_nom" type="number" step="any" oninput="bcMachineTol()" style="${ci}"/></div>
        <div><label style="${cl}" >Tol. mini (LSL)</label><input id="bc_tmin" type="number" step="any" style="${ci}"/></div>
        <div><label style="${cl}">Tol. maxi (USL)</label><input id="bc_tmax" type="number" step="any" style="${ci}"/></div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:14px;">
        <button onclick="bcSubmit()" style="background:#0d9488;color:white;border:none;border-radius:9px;padding:9px 18px;font-size:.84rem;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:6px;"></i>Enregistrer le contrôle</button>
        <span id="bc_msg" style="font-size:.8rem;font-weight:700;"></span>
        <a href="/qualite/service" style="margin-left:auto;font-size:.76rem;color:#0d9488;font-weight:700;text-decoration:none;">Voir les cartes de contrôle machine →</a>
      </div>
    </div>
    <script>
    var BC_MEMO = ${memoJson};
    function bcFill(){ var p=document.getElementById('bc_piece').value, c=document.getElementById('bc_cote').value; var m=BC_MEMO[p+'|'+c]||BC_MEMO['|'+c]; if(m){ if(m.nominale!=null&&!document.getElementById('bc_nom').value)document.getElementById('bc_nom').value=m.nominale; if(m.tol_min!=null&&!document.getElementById('bc_tmin').value)document.getElementById('bc_tmin').value=m.tol_min; if(m.tol_max!=null&&!document.getElementById('bc_tmax').value)document.getElementById('bc_tmax').value=m.tol_max; } }
    function bcMachineTol(){ var sel=document.getElementById('bc_machine'); var o=sel.options[sel.selectedIndex]; var tol=o?parseFloat(o.getAttribute('data-tol')):NaN; var nom=parseFloat(document.getElementById('bc_nom').value); if(isFinite(tol)&&isFinite(nom)){ if(document.getElementById('bc_tmin').value==='')document.getElementById('bc_tmin').value=+(nom-tol).toFixed(4); if(document.getElementById('bc_tmax').value==='')document.getElementById('bc_tmax').value=+(nom+tol).toFixed(4); } }
    function bcMsg(m,ok){ var e=document.getElementById('bc_msg'); e.textContent=m; e.style.color=ok?'#15803d':'#b91c1c'; }
    async function bcSubmit(){ var sel=document.getElementById('bc_machine'); var p={machine_id:sel.value,machine_nom:(sel.options[sel.selectedIndex]||{}).getAttribute?sel.options[sel.selectedIndex].getAttribute('data-nom'):'',bdt_id:document.getElementById('bc_bdt').value,piece:document.getElementById('bc_piece').value,cote:document.getElementById('bc_cote').value,nominale:document.getElementById('bc_nom').value,mesure:document.getElementById('bc_mes').value,tol_min:document.getElementById('bc_tmin').value,tol_max:document.getElementById('bc_tmax').value,operateur_nom:document.getElementById('bc_op').value,source:'operateur'}; if(!p.cote||p.nominale===''||p.mesure===''||p.tol_min===''||p.tol_max===''){bcMsg('Cote, nominale, mesure et tolérances requises.',false);return;} try{ var r=await fetch('/api/controles/cote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); var j=await r.json(); if(j.ok){ var conf=j.controle&&j.controle.conforme; bcMsg(conf===false?'Enregistré — HORS TOLÉRANCE ⚠':'Contrôle enregistré ✓',conf!==false); BC_MEMO[p.piece+'|'+p.cote]={nominale:+p.nominale,tol_min:+p.tol_min,tol_max:+p.tol_max}; document.getElementById('bc_mes').value=''; }else{bcMsg(j.error||'Erreur',false);} }catch(e){bcMsg('Erreur réseau',false);} }
    </script>`
  const content = `
  ${pageHeader('fas fa-hard-hat', '#ea580c,#c2410c', 'BDT Opérateur – Réception & Pointage', 'Opérateur · Réception BDT · Pointage heures · Contrôle des cotes', ['BDT', 'Pointage', 'SPC'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Mon BDT du jour')}
      ${fieldRow(`${field('N° BDT', 'text', 'BDT-XXX')} ${field('Opérateur', 'select', opNames.join(' / ') || '—')}`)}
      ${fieldRow(`${field('Statut BDT', 'select', 'Reçu / En cours / En attente matière / Terminé / Rejeté')} ${field('Date', 'date', '')}`)}
      ${sectionTitle('Pointage')}
      ${fieldRow(`${field('Heure début', 'time', '')} ${field('Heure fin', 'time', '', false)}`)}
      ${fieldRow(`${field('Quantité réalisée', 'number', '0')} ${field('Quantité rejetée', 'number', '0', false)}`)}
      ${submitBtn('Mettre à jour le BDT', '#ea580c')}
    `)}
    ${coteCard}
  </div>`
  return c.html(layout('BDT Opérateur', content, 'bdt'))
})

app.get('/production/soustraitance', (c) => {
  const content = `
  ${pageHeader('fas fa-industry','#6366f1,#4338ca','Gestion Sous-traitance','Sylvie · Commandes ST · Suivi expédition / retour · EN9100 8.4',['ST','EN9100 8.4'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Commande ST')}
      ${fieldRow(`${field('N° Commande ST','text','ST-2026-XXX',false)} ${field('N° LOT / BDT associé','text','LOT-2026-XXX')}`)}
      ${fieldRow(`${field('Opération ST','select','Oxydation anodique sulfurique / Sérigraphie / Traitement thermique / Zingage / Peinture poudre / Brunissage')} ${field('Prestataire APPROVED','select','Anodex SA ✅ / Colorprint SAS ✅ / Galvatech ✅ / Thermex ⚠')}`)}
      ${fieldRow(`${field('Pièce / Référence','text','REF-XXXX')} ${field('Quantité','number','0')}`)}
      ${fieldRow(`${field('Date envoi','date','')} ${field('Date retour prévue','date','')}`)}
      ${fieldRow(`${field('Priorité','select','Normal / Urgent / Critique')} ${field('N° BDL expédition','text','BDL-XXXX',false)}`)}
      ${field('Instructions spéciales','textarea','Spécifications finition, épaisseur anodisation, couleur sérigraphie, normes applicables…',false,2)}
      ${afterBox(
        ['Mail auto → Prestataire (demande ST + BDL)','Mail auto → Sylvie (ST commandée)'],
        ['Bon de livraison ST généré GED','Suivi transport créé'],
        ['Planning retour mis à jour','Alerte J-2 avant retour prévu']
      )}
      ${submitBtn('Commander la ST','#6366f1')}
    `)}
  </div>`
  return c.html(layout('Sous-traitance', content, 'st'))
})

// ══════════════════════════════════════════════════════════════
// PILOTAGE PRODUCTION
// §4.8 – Lénaïck (Resp. Production)
// ══════════════════════════════════════════════════════════════
app.get('/production/pilotage', (c) => {
  const content = `
  ${pageHeader('fas fa-tachometer-alt','#f97316,#ea580c','Pilotage Production – Tableau de bord temps réel','Lénaïck · Suivi BDT en cours · OTD · Taux charge · Alertes',['Production','OTD'])}
  <div style="padding:22px 30px;">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">
      ${['BDTs en cours|12|fa-play-circle|#f59e0b','BDTs soldés|8|fa-check-double|#22c55e','En attente|3|fa-inbox|#ef4444','Charge atelier|74%|fa-chart-bar|#3b82f6'].map(k=>{
        const [l,v,ic,col]=k.split('|')
        return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:4px solid ${col};text-align:center;">
          <i class="fas ${ic}" style="font-size:1.5rem;color:${col};margin-bottom:6px;display:block;"></i>
          <div style="font-size:1.8rem;font-weight:800;color:#1e293b;">${v}</div>
          <div style="font-size:.72rem;color:#64748b;font-weight:600;">${l}</div>
        </div>`}).join('')}
    </div>
    ${formCard(`
      ${sectionTitle('Suivi BDT en cours – Vue opérateur')}
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">BDT</th>
            <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Opérateur</th>
            <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Opération</th>
            <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Client · Pièce</th>
            <th style="text-align:center;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Avancement</th>
            <th style="text-align:center;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Statut</th>
            <th style="text-align:center;padding:8px 12px;color:#64748b;font-weight:700;font-size:.7rem;text-transform:uppercase;">Priorité</th>
          </tr></thead>
          <tbody>
            ${[
              {id:'BDT-091',op:'Antoine D.',ope:'Usinage',client:'Legrand',piece:'DISSIP-A24',pct:65,statut:'recu',prio:'urgent'},
              {id:'BDT-093',op:'Marc T.',ope:'Poinçonnage/Laser',client:'Valeo',piece:'TOLE-C07',pct:30,statut:'recu',prio:'critique'},
              {id:'BDT-100',op:'Frédéric G.',ope:'Fraisage',client:'Faurecia',piece:'PIECE-J05',pct:45,statut:'recu',prio:'critique'},
              {id:'BDT-092',op:'Karim B.',ope:'Ébavurage',client:'Bosch',piece:'DISSIP-B11',pct:0,statut:'programme',prio:'normal'},
              {id:'BDT-097',op:'Julien M.',ope:'Soudure',client:'Legrand',piece:'CHASSIS-G2',pct:0,statut:'programme',prio:'normal'},
            ].map(r=>`<tr style="border-bottom:1px solid #f9fafb;">
              <td style="padding:8px 12px;font-weight:700;color:#374151;">${r.id}</td>
              <td style="padding:8px 12px;color:#6b7280;">${r.op}</td>
              <td style="padding:8px 12px;color:#374151;">${r.ope}</td>
              <td style="padding:8px 12px;color:#9ca3af;">${r.client} · ${r.piece}</td>
              <td style="padding:8px 12px;text-align:center;">
                <div style="background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden;width:80px;margin:0 auto;">
                  <div style="height:100%;background:${r.pct>70?'#22c55e':r.pct>30?'#f59e0b':'#3b82f6'};width:${r.pct}%;border-radius:999px;"></div>
                </div>
                <span style="font-size:.65rem;color:#64748b;">${r.pct}%</span>
              </td>
              <td style="padding:8px 12px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.62rem;font-weight:700;background:${r.statut==='recu'?'#fef9c3':'#dbeafe'};color:${r.statut==='recu'?'#854d0e':'#1d4ed8'}">${r.statut}</span></td>
              <td style="padding:8px 12px;text-align:center;"><span style="padding:2px 8px;border-radius:999px;font-size:.62rem;font-weight:700;background:${r.prio==='critique'?'#fee2e2':r.prio==='urgent'?'#fef9c3':'#f0fdf4'};color:${r.prio==='critique'?'#991b1b':r.prio==='urgent'?'#854d0e':'#166534'}">${r.prio}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${afterBox(
        ['Mise à jour temps réel Power BI','Alertes dépassement délais auto'],
        ['Calcul OTD recalculé automatiquement','Notification Lénaïck si retard critique'],
        ['Archivage journalier GED','Reporting mensuel Direction']
      )}
    `)}
  </div>`
  return c.html(layout('Pilotage Production', content, 'pilotage'))
})

// ══════════════════════════════════════════════════════════════
// OAS
// ══════════════════════════════════════════════════════════════
app.get('/oas/service', async (c) => {
  const [bdtsOAS, balancelles, relevesEau, relevesBains, ops, allBdts, lots, noms, procsAll, postesAllOas] = await Promise.all([
    getBonsDeTravailOAS(), getBalancelles(), getRelevesEau(), getRelevesBains(), getOperateurs(),
    getBonsDeTravail(), getLots(), getNomenclatures().catch(() => []),
    getProcessAtelier().catch(() => [] as any[]), getPostes().catch(() => [] as any[])
  ])
  // Types de bain OAS = process d'activité OAS (est_oas, ou activité OAS, ou rattachés à un poste OAS).
  const oasPosteIds = new Set((postesAllOas as any[]).filter((p: any) => String(p.activite) === 'OAS').map((p: any) => String(p.id)))
  const oasProcesses = (procsAll as any[]).filter((p: any) => p.est_oas || String(p.activite) === 'OAS' || (p.poste_id && oasPosteIds.has(String(p.poste_id))))
  return c.html(pageServiceOAS(bdtsOAS, balancelles, relevesEau, relevesBains, ops, allBdts, lots, noms, oasProcesses))
})

app.get('/oas/session', (c) => {
  const content = `
  ${pageHeader('fas fa-atom','#06b6d4,#0891b2','OAS – Oxydation Anodique Sulfurique','Mickael · Balancelles · Charges · Bain chimique · Relevés environnement',['OAS','ISO 14001'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Session OAS')}
      ${fieldRow(`${field('N° Session OAS','text','OAS-2026-XXX',false)} ${field('Date / Heure','datetime-local','')}`)}
      ${fieldRow(`${field('Responsable','select','Mickael / Suppléant')} ${field('Bain actif','select','Bain principal / Bain 2 / Bain essai')}`)}
      ${sectionTitle('Balancelle & Charge')}
      ${fieldRow(`${field('N° Balancelle','text','BAL-XX')} ${field('Nombre de pièces','number','0')}`)}
      ${fieldRow(`${field('LOT(s) concerné(s)','text','LOT-2026-XXX')} ${field('Poids total charge (kg)','number','0',false)}`)}
      ${sectionTitle('Paramètres bain')}
      ${fieldRow(`${field('Concentration H₂SO₄ (g/L)','number','180',false)} ${field('Température bain (°C)','number','20',false)}`)}
      ${fieldRow(`${field('Densité courant (A/dm²)','number','1.5',false)} ${field('Durée anodisation (min)','number','30',false)}`)}
      ${sectionTitle('Relevés environnement')}
      ${fieldRow(`${field('Concentration effluents (mg/L)','number','0',false)} ${field('pH effluents','number','7',false)}`)}
      ${field('Observations / anomalies','textarea','Couleur bain, résistances, incidents, actions correctives…',false,2)}
      ${afterBox(
        ['Mail auto → Qualité (résultat OAS)','Mail auto → Env (relevés éco)'],
        ['Fiche OAS archivée GED','Certificat traitement généré'],
        ['Traçabilité LOT mise à jour','Alerte si paramètres hors limites']
      )}
      ${submitBtn('Valider la session OAS','#06b6d4')}
    `)}
  </div>`
  return c.html(layout('OAS – Oxydation', content, 'oas'))
})

// ══════════════════════════════════════════════════════════════
// QUALITÉ
// ══════════════════════════════════════════════════════════════
app.get('/qualite/service', async (c) => {
  const [ncs, pvs, qs, audits, periss, ops, r8d, machines, procs, capas, controles] = await Promise.all([
    getNCs(), getPVControles(), getQuarantaines(), getAudits(), getProduitsPerissables(), getOperateurs(),
    getRapports8D().catch(() => []),
    getMachines().catch(() => []),
    getProcessAtelier().catch(() => []),
    getEtudesCapabilite().catch(() => []),
    getControlesCotes().catch(() => []),
  ])
  const [ecme, derogs, plansC, mvtPer, fournisseurs, validations, lots, bdts] = await Promise.all([getEcme().catch(() => []), getDerogations().catch(() => []), getPlansControle().catch(() => []), getMouvementsPerissables().catch(() => []), getFournisseurs().catch(() => []), getValidations().catch(() => []), getLots().catch(() => []), getBonsDeTravail().catch(() => [])])
  // Fiche de vie ECME : on rattache l'historique des vérifications à chaque ECME (évite de gonfler la signature de pageServiceQualite).
  const ecmeVerifs = await getEcmeVerifications().catch(() => [])
  const verifsByEcme: Record<string, any[]> = {}
  ;(ecmeVerifs as any[]).forEach((v: any) => { const k = String(v.ecme_id || ''); if (k) (verifsByEcme[k] = verifsByEcme[k] || []).push(v) })
  ;(ecme as any[]).forEach((e: any) => { e.verifications = verifsByEcme[String(e.id)] || [] })
  const [auditProg, auditGrilles, auditQuestions, auditAuto, fais] = await Promise.all([getAuditProgramme().catch(() => []), getAuditGrilles().catch(() => []), getAuditQuestions().catch(() => []), getAuditAutoStatus().catch(() => ({})), getFai().catch(() => [])])
  // Libération des lots : un lot dont TOUS les BDT sont soldés (production terminée) est « à libérer ».
  const bdtByLot: Record<string, any[]> = {}
  ;(bdts as any[]).forEach((b: any) => { const k = String(b.lot_id || ''); if (k) (bdtByLot[k] = bdtByLot[k] || []).push(b) })
  const quarLotIds = new Set((qs as any[]).filter((q: any) => q.statut === 'en_cours').map((q: any) => String(q.lot_id)))
  const lotsEnr = (lots as any[]).map((l: any) => {
    const bs = bdtByLot[String(l.id)] || []
    return { ...l, nb_bdt: bs.length, prod_finie: bs.length > 0 && bs.every((b: any) => b.statut === 'solde') }
  })
  const liberation = {
    aLiberer: lotsEnr.filter((l: any) => l.prod_finie && l.statut !== 'libere' && l.statut !== 'expedie' && !quarLotIds.has(String(l.id))),
    liberes: lotsEnr.filter((l: any) => l.statut === 'libere'),
  }
  return c.html(pageServiceQualite(ncs, pvs, qs, audits, periss, ops, r8d, machines, procs, capas, ecme as any[], controles as any[], derogs as any[], plansC as any[], mvtPer as any[], fournisseurs as any[], validations as any[], liberation, auditProg as any[], auditGrilles as any[], auditQuestions as any[], auditAuto as any, fais as any[]))
})

// ─── Produits périssables (CRUD + sortie FIFO) ───────────────────
const PERIS_FIELDS = ['nom', 'reference', 'fournisseur', 'fournisseur_id', 'code_produit', 'date_reception', 'date_ouverture', 'date_expiration', 'date_alerte', 'delai_appro', 'duree_vie_jours', 'quantite', 'qte_initiale', 'unite', 'emplacement', 'lieu_utilisation', 'n_commande_fournisseur', 'n_lot_fournisseur', 'statut', 'observations']
function _perisPayload(b: any): Record<string, any> {
  const p: Record<string, any> = {}
  for (const k of PERIS_FIELDS) if (k in b) p[k] = b[k] === '' ? null : b[k]
  if (p.quantite != null) p.quantite = Number(p.quantite)
  if (p.qte_initiale != null) p.qte_initiale = Number(p.qte_initiale)
  if (p.duree_vie_jours != null) p.duree_vie_jours = Number(p.duree_vie_jours) || null
  return p
}
app.post('/api/qualite/perissable', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const payload = _perisPayload(b)
  if (!payload.statut) payload.statut = 'valide'
  const { data, error } = await createProduitPerissable(payload as any)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.patch('/api/qualite/perissable/:id', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const { data, error } = await updateProduitPerissable(c.req.param('id'), _perisPayload(b) as any)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.delete('/api/qualite/perissable/:id', async (c) => {
  const { error } = await deleteProduitPerissable(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})
// Sortie : enregistre un mouvement et décrémente l'inventaire
app.post('/api/qualite/perissable/:id/sortie', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const qte = Number(b.qte_sortie) || 0
  if (qte <= 0) return c.json({ ok: false, error: 'Quantité de sortie invalide.' })
  const prods = await getProduitsPerissables().catch(() => [] as any[])
  const prod = (prods as any[]).find((x) => String(x.id) === String(id))
  if (!prod) return c.json({ ok: false, error: 'Produit introuvable.' })
  const reste = Math.max(0, (Number(prod.quantite) || 0) - qte)
  const { error: mErr } = await createMouvementPerissable({ perissable_id: id, date_sortie: b.date_sortie || new Date().toISOString().slice(0, 10), qte_sortie: qte, n_commande_client: b.n_commande_client ?? null, motif: b.motif ?? null, inventaire_apres: reste })
  if (mErr) return c.json({ ok: false, error: mErr.message })
  const patch: any = { quantite: reste }
  if (reste === 0) patch.statut = 'archive'
  await updateProduitPerissable(id, patch)
  return c.json({ ok: true, reste })
})

// ─── Plan de contrôle EN9100 / ISO9001 (CRUD) ────────────────────
const PLANCTRL_FIELDS = ['num_ligne', 'operation', 'classification_client', 'parametres', 'ecme_outils', 'frequence_echantillonnage', 'critere_acceptation', 'responsable', 'type_controle', 'plan_reaction', 'activite', 'ordre', 'statut']
app.post('/api/qualite/plan-controle', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const payload: Record<string, any> = {}
  for (const k of PLANCTRL_FIELDS) if (k in b) payload[k] = b[k] === '' ? null : b[k]
  if (payload.num_ligne != null) payload.num_ligne = Number(payload.num_ligne) || null
  const { data, error } = await createPlanControle(payload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.patch('/api/qualite/plan-controle/:id', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const patch: Record<string, any> = {}
  for (const k of PLANCTRL_FIELDS) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  if (patch.num_ligne != null) patch.num_ligne = Number(patch.num_ligne) || null
  const { data, error } = await updatePlanControle(c.req.param('id'), patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.delete('/api/qualite/plan-controle/:id', async (c) => {
  const { error } = await deletePlanControle(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})

// ══════════════════════════════════════════════════════════════
// AUDITS DE CONFORMITÉ (SMI QSE + SI) : programme, grilles, questions, FAI
// ══════════════════════════════════════════════════════════════
const AUDIT_PROG_FIELDS = ['exercice', 'type', 'entite_auditee', 'famille', 'perimetre', 'themes', 'themes_transverses', 'referentiels', 'trimestre', 'date_cible', 'temps_estime_min', 'auditeur', 'auditeur_2', 'audite_principal', 'statut', 'date_realisation', 'date_rapport', 'date_retour_audite', 'plan_action_solde', 'date_cloture', 'grille_id', 'rapport_url', 'reponses', 'constat', 'non_conformite', 'axe_amelioration', 'observations']
function auditProgPayload(b: any): Record<string, any> {
  const p: Record<string, any> = {}
  for (const k of AUDIT_PROG_FIELDS) if (k in b) p[k] = b[k]
  for (const k of ['exercice', 'trimestre', 'temps_estime_min']) if (k in p && p[k] !== '' && p[k] != null) p[k] = Number(p[k]) || null
  for (const k of ['date_cible', 'date_realisation', 'date_rapport', 'date_retour_audite', 'date_cloture']) if (p[k] === '') p[k] = null
  if ('plan_action_solde' in p) p.plan_action_solde = !!p.plan_action_solde
  return p
}
app.post('/api/audit/programme', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const { data, error } = await createAuditProgramme(auditProgPayload(b))
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.patch('/api/audit/programme/:id', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const { data, error } = await updateAuditProgramme(c.req.param('id'), auditProgPayload(b))
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.delete('/api/audit/programme/:id', async (c) => {
  const { error } = await deleteAuditProgramme(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})
// Reconduction annuelle : recopie le programme d'une année vers la suivante
app.post('/api/audit/programme/reconduire', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const from = Number(b.from), to = Number(b.to)
  if (!from || !to || to <= from) return c.json({ ok: false, error: 'Années invalides' })
  const res = await cloneAuditProgrammeAnnee(from, to)
  if (res.error) return c.json({ ok: false, error: res.error.message })
  return c.json({ ok: true, n: (res.data || []).length })
})
const AUDIT_GRILLE_FIELDS = ['titre', 'cible', 'referentiel', 'version', 'active', 'description']
app.post('/api/audit/grille', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of AUDIT_GRILLE_FIELDS) if (k in b) p[k] = b[k]; const { data, error } = await createAuditGrille(p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.patch('/api/audit/grille/:id', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of AUDIT_GRILLE_FIELDS) if (k in b) p[k] = b[k]; const { data, error } = await updateAuditGrille(c.req.param('id'), p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.delete('/api/audit/grille/:id', async (c) => { const { error } = await deleteAuditGrille(c.req.param('id')); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true }) })
const AUDIT_Q_FIELDS = ['grille_id', 'ordre', 'section', 'theme_code', 'clause_ref', 'libelle', 'preuve_attendue', 'mode', 'sonde']
app.post('/api/audit/question', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of AUDIT_Q_FIELDS) if (k in b) p[k] = b[k]; if (p.ordre != null && p.ordre !== '') p.ordre = Number(p.ordre) || 0; const { data, error } = await createAuditQuestion(p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.patch('/api/audit/question/:id', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of AUDIT_Q_FIELDS) if (k in b) p[k] = b[k]; const { data, error } = await updateAuditQuestion(c.req.param('id'), p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.delete('/api/audit/question/:id', async (c) => { const { error } = await deleteAuditQuestion(c.req.param('id')); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true }) })
const FAI_FIELDS = ['nomenclature_id', 'num_nom', 'indice', 'commande_ref', 'type', 'statut', 'date_realisation', 'realise_par', 'conforme', 'caracteristiques', 'rapport_url', 'observations']
app.post('/api/audit/fai', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of FAI_FIELDS) if (k in b) p[k] = b[k]; const { data, error } = await createFai(p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.patch('/api/audit/fai/:id', async (c) => { const b = await c.req.json().catch(() => ({} as any)); const p: Record<string, any> = {}; for (const k of FAI_FIELDS) if (k in b) p[k] = b[k]; const { data, error } = await updateFai(c.req.param('id'), p); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true, data }) })
app.delete('/api/audit/fai/:id', async (c) => { const { error } = await deleteFai(c.req.param('id')); if (error) return c.json({ ok: false, error: error.message }); return c.json({ ok: true }) })
// Constat d'audit → non-conformité (détecteur « Audit », cycle 8D existant)
app.post('/api/audit/constat-to-nc', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const prog = (await getAuditProgramme().catch(() => [])) as any[]
  const line = prog.find((p) => String(p.id) === String(b.prog_id))
  if (!line) return c.json({ ok: false, error: 'Ligne de programme introuvable' })
  const idx = Number(b.idx)
  const reps = Array.isArray(line.reponses) ? line.reponses : []
  let libelle = ''
  if (idx === -1) libelle = line.non_conformite || ''
  else if (idx === -2) libelle = line.axe_amelioration || ''
  else if (reps[idx]) libelle = reps[idx].libelle || reps[idx].preuve || ''
  if (!libelle) libelle = 'Écart d\'audit'
  const existing = (await getNonConformites().catch(() => [])) as any[]
  const year = new Date().getFullYear()
  let max = 0
  for (const r of existing) { const m = String(r.id || '').match(/NC-\d{4}-(\d+)/); if (m) { const v = parseInt(m[1], 10); if (v > max) max = v } }
  const ncId = `NC-${year}-${String(max + 1).padStart(3, '0')}`
  const payload: Record<string, any> = {
    id: ncId, date_nc: new Date().toISOString().slice(0, 10), type_nc: 'interne', gravite: 'Majeure', statut: 'ouverte',
    description: 'Audit « ' + (line.entite_auditee || '') + ' » : ' + libelle, detecteur: 'Audit', categorie: 'prod',
    lieu_detection: line.entite_auditee ?? null, lieu_imputation: line.entite_auditee ?? null,
  }
  if (!(await ncHasExtCols().catch(() => false))) { delete payload.lieu_detection; delete payload.lieu_imputation }
  const { data, error } = await createNonConformiteRow(payload)
  if (error) return c.json({ ok: false, error: error.message })
  if (idx >= 0 && reps[idx]) { reps[idx].nc_id = ncId; await updateAuditProgramme(line.id, { reponses: reps }).catch(() => {}) }
  return c.json({ ok: true, data, nc_id: ncId })
})

// ─── Dérogations (création / mise à jour) ────────────────────────
const DEROG_FIELDS = ['date_demande', 'emetteur', 'service', 'tel_em', 'email_em', 'client', 'contact', 'tel', 'email', 'designation', 'cmd_client', 'ref_client', 'ar', 'notre_ref', 'quantite', 'type_demande', 'descriptif', 'decision', 'decision_client', 'commentaire', 'statut', 'nc_ref']
app.post('/api/qualite/derogation', async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const existing = await getDerogations().catch(() => [] as any[])
  let max = 351
  for (const r of existing as any[]) { const v = Number(r.numero); if (Number.isFinite(v) && v > max) max = v }
  const numero = max + 1
  const payload: Record<string, any> = { id: `DER-${numero}`, numero }
  for (const k of DEROG_FIELDS) if (k in body) payload[k] = body[k] === '' ? null : body[k]
  if (payload.quantite != null) payload.quantite = Number(payload.quantite) || null
  if (!payload.statut) payload.statut = 'en_cours'
  const { data, error } = await createDerogation(payload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})
app.patch('/api/qualite/derogation/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({} as any))
  const patch: Record<string, any> = {}
  for (const k of DEROG_FIELDS) if (k in body) patch[k] = body[k] === '' ? null : body[k]
  if (patch.quantite != null) patch.quantite = Number(patch.quantite) || null
  const { data, error } = await updateDerogation(id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, data })
})

// ══════════════════════════════════════════════════════════════
// SÉCURITÉ (HSE / RSE)
// ══════════════════════════════════════════════════════════════
app.get('/securite/service', async (c) => {
  const [
    risques, incidents, epiCat, epiDot, chimiques, dechets, mesuresEnv, atex,
    expositions,
    verifs, formReq, exercices, plans, rse, conformite,
    salaries, machines, fournisseurs, articles, relevesEau, certifications, habilitations, pointages
  ] = await Promise.all([
    getHseRisques().catch(() => []), getHseIncidents().catch(() => []),
    getHseEpiCatalogue().catch(() => []), getHseEpiDotations().catch(() => []),
    getHseChimiques().catch(() => []), getHseDechets().catch(() => []),
    getHseMesuresEnv().catch(() => []), getHseAtexZones().catch(() => []),
    getHseExpositions().catch(() => []),
    getHseVerifications().catch(() => []), getHseFormationsRequises().catch(() => []),
    getHseExercices().catch(() => []), getHsePlansPrevention().catch(() => []),
    getHseRseIndicateurs().catch(() => []), getHseConformite().catch(() => []),
    getSalaries().catch(() => []), getMachines().catch(() => []),
    getFournisseurs().catch(() => []), getArticlesStock().catch(() => []),
    getRelevesEau().catch(() => []), getCertifications().catch(() => []),
    getHabilitations().catch(() => []), getPointages().catch(() => []),
  ])
  const [actionsCorr, flash, epiZone, validations, auditProg, auditAuto, auditGrilles, auditQuestions] = await Promise.all([
    getActionsCorrectives().catch(() => []), getHseFlash().catch(() => []), getHseEpiZone().catch(() => []),
    getValidations().catch(() => []), getAuditProgramme().catch(() => []), getAuditAutoStatus().catch(() => ({})),
    getAuditGrilles().catch(() => []), getAuditQuestions().catch(() => []),
  ])
  return c.html(pageServiceSecurite({
    risques, incidents, epiCat, epiDot, chimiques, dechets, mesuresEnv, atex, expositions,
    verifs, formReq, exercices, plans, rse, conformite, actionsCorr, flash, epiZone,
    salaries, machines, fournisseurs, articles, relevesEau, certifications, habilitations, pointages,
    validations, auditProg, auditAuto, auditGrilles, auditQuestions
  } as any))
})

// ══════════════════════════════════════════════════════════════
// ENVIRONNEMENT (ICPE/DREAL · déchets · rejets · ATEX · ISO 14001 · RSE)
// Regroupe l'environnement (déplacé de Sécurité) ; CRUD via /api/securite/*.
// ══════════════════════════════════════════════════════════════
// Indicateurs RSE consolidés AUTOMATIQUEMENT depuis RH / Sécurité / Compta (aucune ressaisie).
function computeRseAuto(D: any) {
  const today = new Date().toISOString().slice(0, 10), Y = today.slice(0, 4), M = today.slice(0, 7)
  const inYear = (d: any) => String(d || '').slice(0, 4) === Y
  const sal = D.salaries || [], abs = D.absences || [], pts = D.pointages || [], inc = D.hseIncidents || []
  const effectif = sal.filter((s: any) => s.actif !== false).length
  const accY = inc.filter((i: any) => i.type === 'accident_travail' && inYear(i.date_incident))
  const accArret = accY.filter((i: any) => i.avec_arret)
  const joursArret = accArret.reduce((s: number, i: any) => s + (Number(i.jours_arret) || 0), 0)
  const heures = pts.filter((p: any) => inYear(p.date_pointage)).reduce((s: number, p: any) => s + (Number(p.heures_travaillees) || 0), 0)
  const tf = heures > 0 ? Math.round(accArret.length * 1e6 / heures * 10) / 10 : null
  const tg = heures > 0 ? Math.round(joursArret * 1e3 / heures * 100) / 100 : null
  const accidents = inc.filter((i: any) => i.type === 'accident_travail')
  const lastAcc = accidents.map((i: any) => i.date_incident).filter(Boolean).sort().slice(-1)[0]
  const joursSans = lastAcc ? Math.max(0, Math.floor((Date.parse(today) - Date.parse(String(lastAcc).slice(0, 10))) / 86400000)) : null
  const now = new Date(); let joMois = 0
  for (let day = 1; day <= now.getUTCDate(); day++) { const wd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day)).getUTCDay(); if (wd >= 1 && wd <= 5) joMois++ }
  const absMois = abs.filter((a: any) => String(a.date_absence || '').slice(0, 7) === M).length
  const absenteisme = (effectif > 0 && joMois > 0) ? Math.round(absMois / (effectif * joMois) * 1000) / 10 : 0
  const caHT = (D.facturesClient || []).filter((f: any) => inYear(f.date_facture)).reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0)
  const achatsHT = (D.facturesFournisseur || []).filter((f: any) => inYear(f.date_facture)).reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0)
  const hab = D.habilitations || []
  const habilOK = hab.filter((h: any) => !h.date_expiration || String(h.date_expiration).slice(0, 10) >= today).length
  // Diversité (RSE social) : égalité F/H, OETH, turnover — depuis les colonnes salaries.sexe/oeth/date_sortie.
  const sexeRens = sal.filter((s: any) => s.sexe === 'F' || s.sexe === 'H').length
  const femmes = sal.filter((s: any) => s.sexe === 'F').length
  const egaliteFH = sexeRens > 0 ? Math.round(femmes / sexeRens * 1000) / 10 : null
  const oethN = sal.filter((s: any) => s.oeth === true).length
  const oethPct = effectif > 0 ? Math.round(oethN / effectif * 1000) / 10 : 0
  const y1 = new Date(Date.parse(today) - 365 * 86400000).toISOString().slice(0, 10)
  const departs = sal.filter((s: any) => s.date_sortie && String(s.date_sortie).slice(0, 10) >= y1 && String(s.date_sortie).slice(0, 10) <= today).length
  const turnover = effectif > 0 ? Math.round(departs / (effectif + departs) * 1000) / 10 : 0
  const eauAn = Math.round((D.mesuresEnv || []).filter((m: any) => String(m.type) === 'conso_eau' && inYear(m.date_mesure)).reduce((s: number, m: any) => s + (Number(m.valeur) || 0), 0) * 10) / 10
  const dech = D.dechets || []
  const kgTot = dech.reduce((s: number, d: any) => s + (Number(d.quantite) || 0), 0)
  const kgValo = dech.filter((d: any) => /valoris|recycl|régén|regen|réempl|reempl|r\d/i.test(String(d.filiere || ''))).reduce((s: number, d: any) => s + (Number(d.quantite) || 0), 0)
  const tauxValo = kgTot > 0 ? Math.round(kgValo / kgTot * 100) : 0
  return { effectif, tf, tg, joursSans, absenteisme, caHT, achatsHT, habilOK, habilTotal: hab.length, eauAn, tauxValo, year: Y, egaliteFH, oethPct, turnover }
}

app.get('/environnement/service', async (c) => {
  const [
    dechets, mesuresEnv, atex, rse, conformite, aspects, chimiques, relevesEau, validations,
    salaries, absences, pointages, hseIncidents, facturesClient, facturesFournisseur, habilitations,
    parties, diagnostic, diagnostic26000, auditProg, auditAuto, auditGrilles, auditQuestions] = await Promise.all([
    getHseDechets().catch(() => []), getHseMesuresEnv().catch(() => []),
    getHseAtexZones().catch(() => []), getHseRseIndicateurs().catch(() => []),
    getHseConformite().catch(() => []), getHseAspectsImpacts().catch(() => []),
    getHseChimiques().catch(() => []), getRelevesEau().catch(() => []),
    getValidations().catch(() => []),
    getSalaries().catch(() => []), getAbsences().catch(() => []), getPointages().catch(() => []),
    getHseIncidents().catch(() => []), getFacturesClient().catch(() => []), getFacturesFournisseur().catch(() => []),
    getHabilitations().catch(() => []),
    getHsePartiesInteressees().catch(() => []), getHseDiagnosticIso().catch(() => []),
    getHseDiagnosticIso26000().catch(() => []),
    getAuditProgramme().catch(() => []), getAuditAutoStatus().catch(() => ({})),
    getAuditGrilles().catch(() => []), getAuditQuestions().catch(() => []),
  ])
  const rseAuto = computeRseAuto({ salaries, absences, pointages, hseIncidents, facturesClient, facturesFournisseur, habilitations, mesuresEnv, dechets })
  const bilanGes = computeBilanGES(facturesFournisseur)
  return c.html(pageServiceEnvironnement({
    dechets, mesuresEnv, atex, rse, conformite, aspects, chimiques, relevesEau, validations, rseAuto, bilanGes, parties, diagnostic, iso26000: diagnostic26000, auditProg, auditAuto, auditGrilles, auditQuestions
  } as any))
})

// ─── Fiche produit chimique 360 (danger + SEIRICH + FDS + péremption + stock + actions) ───
app.get('/securite/chimique/:id', async (c) => {
  const id = decodeURIComponent(c.req.param('id') || '')
  const detail = await getHseChimiqueDetail(id).catch(() => ({ produit: null } as any))
  return c.html(pageChimiqueFiche(detail.produit || { id, nom: '' }, detail))
})

// ─── API CRUD générique pour les entités hse_* ───
function _hseClean(b: any, fields: string[]): any {
  const o: any = {}
  for (const k of fields) if (k in b) o[k] = b[k] === '' ? null : b[k]
  return o
}
function hseCrud(path: string, fields: string[], fns: { create: (p: any) => Promise<any>; update: (id: string, p: any) => Promise<any>; del: (id: string) => Promise<any> }, prepare?: (p: any) => any) {
  app.post('/api/securite/' + path, async (c) => {
    const b = await c.req.json().catch(() => ({} as any))
    let payload = _hseClean(b, fields); if (prepare) payload = prepare(payload)
    const { data, error } = await fns.create(payload)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    return c.json({ ok: true, data })
  })
  app.patch('/api/securite/' + path + '/:id', async (c) => {
    const b = await c.req.json().catch(() => ({} as any))
    let patch = _hseClean(b, fields); if (prepare) patch = prepare(patch)
    const { data, error } = await fns.update(c.req.param('id')!, patch)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    return c.json({ ok: true, data })
  })
  app.delete('/api/securite/' + path + '/:id', async (c) => {
    const { error } = await fns.del(c.req.param('id')!)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    return c.json({ ok: true })
  })
}

hseCrud('risques', ['entite', 'unite_travail', 'zone', 'danger', 'situation', 'risque', 'gravite', 'frequence', 'maitrise', 'criticite', 'mesures_existantes', 'mesures_prevues', 'responsable', 'echeance', 'statut', 'annee', 'famille', 'famille_code', 'priorite'],
  { create: createHseRisque, update: updateHseRisque, del: deleteHseRisque },
  (p) => {
    const g = Number(p.gravite) || 0, f = Number(p.frequence) || 0
    if (g && f) p.criticite = g * f
    const cr = Number(p.criticite) || 0
    if (p.priorite == null || p.priorite === '') p.priorite = cr >= 9 ? 1 : cr >= 4 ? 2 : 3
    if (p.annee == null || p.annee === '') p.annee = new Date().getFullYear()
    return p
  })
// Clone du DUERP année N -> N+1 (reconduction annuelle R.4121-2)
app.post('/api/securite/duer/cloner-annee', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const source = Number(b.source)
  const cible = Number(b.cible) || (source + 1)
  if (!source) return c.json({ ok: false, error: 'Année source manquante.' })
  const { count, error } = await cloneDuerAnnee(source, cible)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, count, annee: cible })
})
hseCrud('actions-correctives', ['numero', 'type', 'origine', 'source', 'source_type', 'source_ref', 'description', 'analyse_5p', 'cause_racine', 'action', 'responsable', 'diffusion', 'date_ouverture', 'date_echeance', 'date_cloture', 'efficacite', 'statut'],
  { create: createActionCorrective, update: updateActionCorrective, del: deleteActionCorrective })
hseCrud('flash', ['numero', 'date', 'secteur', 'evenement', 'mesures', 'diffusion', 'gravite', 'pilote', 'statut'],
  { create: createHseFlash, update: updateHseFlash, del: deleteHseFlash })
hseCrud('epi-zone', ['entite', 'zone', 'epi', 'obligatoire', 'consignes'],
  { create: createHseEpiZone, update: updateHseEpiZone, del: deleteHseEpiZone })
hseCrud('incidents', ['entite', 'type', 'date_incident', 'heure', 'salarie_id', 'salarie_nom', 'zone', 'poste', 'partie_corps', 'nature_lesion', 'gravite', 'avec_arret', 'jours_arret', 'temoins', 'description', 'premiers_secours', 'declaration_cpam_date', 'analyse_causes', 'actions_correctives', 'responsable', 'statut', 'date_cloture'],
  { create: createHseIncident, update: updateHseIncident, del: deleteHseIncident })
hseCrud('epi-catalogue', ['entite', 'nom', 'categorie', 'norme_en', 'duree_vie_mois', 'ref_stock', 'fournisseur', 'fournisseur_id', 'notes'],
  { create: createHseEpiCat, update: updateHseEpiCat, del: deleteHseEpiCat })
hseCrud('epi-dotations', ['entite', 'salarie_id', 'salarie_nom', 'epi_id', 'epi_nom', 'taille', 'quantite', 'date_remise', 'date_peremption', 'signature', 'statut', 'categorie', 'fournisseur', 'fournisseur_id', 'marque', 'reference', 'prix'],
  { create: createHseEpiDotation, update: updateHseEpiDotation, del: deleteHseEpiDotation })
hseCrud('chimiques', ['entite', 'nom', 'num_identification', 'fournisseur_id', 'fournisseur_nom', 'ref_stock', 'cas', 'fds_ref', 'fds_url', 'fds_date', 'etat', 'pictogrammes', 'mentions_danger', 'cmr', 'vlep', 'zone_stockage', 'retention', 'compatibilites', 'quantite', 'unite', 'statut'],
  { create: createHseChimique, update: updateHseChimique, del: deleteHseChimique },
  // Fail-soft : ne pas envoyer num_identification s'il est vide (colonne optionnelle, migration chimie_num_identification.sql).
  (p) => { if (p.num_identification == null || p.num_identification === '') delete p.num_identification; return p })

// DÉCHET AUTO : déclare en déchets tous les produits périssables périmés (idempotent via source_ref).
app.post('/api/environnement/perissables-expires/declarer', async (c) => {
  const today = TODAY_ISO()
  const peris = await getProduitsPerissables().catch(() => [] as any[])
  const exp = (peris as any[]).filter((p) => String(p.statut || '') === 'expire' || (p.date_expiration && String(p.date_expiration).slice(0, 10) < today))
  let created = 0
  for (const p of exp) {
    const chimique = /chim|solv|résin|resin|colle|acid|peinture|vernis|durciss/i.test(String(p.designation || '') + ' ' + String(p.categorie || ''))
    const r: any = await ensureHseDechet('perissable', String(p.id), {
      entite: p.entite || 'Seem', date_dechet: today,
      designation: 'Produit périmé — ' + (p.designation || p.lot || p.id),
      dangereux: chimique, quantite: Number(p.quantite) || null, unite: p.unite || null,
      zone_producteur: p.zone_stockage || p.zone || 'Magasin', statut: 'en_attente',
    }).catch(() => ({ error: true }))
    if (!r.error && !r.existed) created++
  }
  return c.json({ ok: true, expires: exp.length, created })
})
// SEIRICH Phase 2 — exposition par situation de travail (score/niveau posés par _coteExposition, hors whitelist)
hseCrud('exposition-chimique', ['produit_id', 'produit_nom', 'unite_travail', 'zone', 'tache', 'procede', 'quantite_utilisee', 'unite', 'frequence', 'volatilite', 'protection_collective', 'epi', 'maintenance_ko', 'issu_transformation', 'non_utilise_1an', 'rejet_milieu', 'observations'],
  { create: createHseExposition, update: updateHseExposition, del: deleteHseExposition })
hseCrud('dechets', ['entite', 'date_dechet', 'code_dechet', 'designation', 'dangereux', 'quantite', 'unite', 'zone_producteur', 'filiere', 'transporteur', 'exutoire', 'bsdd_num', 'trackdechets_id', 'statut'],
  { create: createHseDechet, update: updateHseDechet, del: deleteHseDechet },
  // Auto : un code déchet européen avec astérisque (*) = déchet dangereux.
  (p) => { if (p.code_dechet != null && codeDechetDangereux(p.code_dechet)) p.dangereux = true; return p })
hseCrud('mesures-env', ['entite', 'type', 'date_mesure', 'point_mesure', 'parametre', 'valeur', 'unite', 'vle', 'conforme', 'organisme', 'observations'],
  { create: createHseMesureEnv, update: updateHseMesureEnv, del: deleteHseMesureEnv })
hseCrud('atex', ['entite', 'nom', 'type_zone', 'localisation', 'origine_risque', 'substances', 'materiel_requis', 'mesures', 'date_revue', 'sources_inflammation', 'mesures_protection', 'evaluateur'],
  { create: createHseAtexZone, update: updateHseAtexZone, del: deleteHseAtexZone },
  (p: any) => { for (const k of ['sources_inflammation', 'mesures_protection', 'evaluateur']) if (p[k] == null || p[k] === '') delete p[k]; return p })
// ─── DRPCE : Document Relatif à la Protection Contre les Explosions (PDF) pour une zone ATEX ───
app.get('/api/atex/:id/drpce.pdf', async (c) => {
  const id = decodeURIComponent(c.req.param('id'))
  const zones = await getHseAtexZones().catch(() => [] as any[])
  const z: any = (zones as any[]).find(x => String(x.id) === id)
  if (!z) return c.text('Zone ATEX introuvable', 404)
  const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, (m: string) => (({ '<': '&lt;', '>': '&gt;', '&': '&amp;' } as any)[m] || m))
  const row = (l: string, v: any) => `<tr><td style="padding:7px 10px;font-weight:700;color:#374151;width:38%;border:1px solid #e5e7eb;background:#f8fafc;vertical-align:top;">${l}</td><td style="padding:7px 10px;color:#111827;border:1px solid #e5e7eb;white-space:pre-wrap;">${esc(v) || '—'}</td></tr>`
  const body = `
    <p style="font-size:.85rem;color:#374151;line-height:1.5;">Document établi en application des articles <strong>R.4227-52</strong> et suivants du Code du travail (directive ATEX 1999/92/CE) — annexe au DUERP. Il identifie la zone à risque d'explosion, évalue le risque et définit les mesures de prévention et de protection.</p>
    <table style="width:100%;border-collapse:collapse;font-size:.8rem;margin-top:10px;">
      ${row('Zone', z.nom)}
      ${row('Site', z.entite)}
      ${row('Classement (zone ATEX)', z.type_zone ? 'Zone ' + z.type_zone : '')}
      ${row('Origine du risque', z.origine_risque === 'gaz' ? 'Gaz / vapeur' : z.origine_risque === 'poussiere' ? 'Poussière' : z.origine_risque)}
      ${row('Localisation / étendue', z.localisation)}
      ${row('Substances inflammables', z.substances)}
      ${row("Sources d'inflammation identifiées", z.sources_inflammation)}
      ${row('Matériel conforme requis', z.materiel_requis)}
      ${row('Mesures techniques de PRÉVENTION', z.mesures)}
      ${row('Mesures de PROTECTION / organisationnelles', z.mesures_protection)}
      ${row('Évaluateur', z.evaluateur)}
      ${row("Date d'évaluation / revue", z.date_revue)}
    </table>
    <p style="font-size:.72rem;color:#94a3b8;margin-top:18px;">Signature employeur / responsable : ________________________ &nbsp;&nbsp; Date : ____ / ____ / ________</p>`
  const right = `<div style="text-align:right;font-size:.78rem;color:#6b7280;">DRPCE<br><strong>${esc(z.nom || z.id)}</strong></div>`
  return c.html(renderPrintableDoc('DRPCE — ' + (z.nom || z.id), BRAND.violet, right, body))
})
hseCrud('verifications', ['entite', 'type', 'equipement', 'machine_id', 'organisme', 'date_controle', 'date_prochaine', 'periodicite_mois', 'resultat', 'levee_reserves', 'rapport_url', 'statut'],
  { create: createHseVerification, update: updateHseVerification, del: deleteHseVerification })
hseCrud('formations-requises', ['entite', 'poste', 'formation', 'obligatoire', 'periodicite_mois'],
  { create: createHseFormationRequise, update: updateHseFormationRequise, del: deleteHseFormationRequise })
hseCrud('exercices', ['entite', 'type', 'date_exercice', 'site', 'nb_participants', 'duree_min', 'scenario', 'observations', 'conforme'],
  { create: createHseExercice, update: updateHseExercice, del: deleteHseExercice })
hseCrud('plans-prevention', ['entite', 'type', 'entreprise_exterieure', 'operation', 'date_debut', 'date_fin', 'risques', 'mesures', 'signataires', 'valide_par', 'statut'],
  { create: createHsePlanPrevention, update: updateHsePlanPrevention, del: deleteHsePlanPrevention })
hseCrud('rse', ['entite', 'periode', 'categorie', 'code', 'libelle', 'valeur', 'unite', 'cible'],
  { create: createHseRseIndicateur, update: updateHseRseIndicateur, del: deleteHseRseIndicateur })
hseCrud('conformite', ['entite', 'domaine', 'obligation', 'reference_reglementaire', 'source', 'date_parution', 'type_texte', 'applicable', 'statut', 'date_dernier_controle', 'date_echeance', 'responsable', 'preuve_url', 'observations'],
  { create: createHseConformite, update: updateHseConformite, del: deleteHseConformite })
// Aspects & impacts environnementaux (ISO 14001 §6.1.2) — service Environnement (fail-soft)
hseCrud('aspects-impacts', ['entite', 'activite', 'aspect', 'impact', 'milieu', 'condition', 'gravite', 'frequence', 'maitrise', 'probabilite', 'sensibilite', 'maitrise_technique', 'maitrise_humaine', 'maitrise_organisationnelle', 'etape_cycle_vie', 'criticite', 'significatif', 'exigence', 'maitrise_moyens', 'action', 'responsable', 'echeance', 'statut'],
  { create: createHseAspectImpact, update: updateHseAspectImpact, del: deleteHseAspectImpact },
  (p) => {
    const g = Number(p.gravite) || 0, f = Number(p.frequence) || 0
    const P = Number(p.probabilite) || 0, S = Number(p.sensibilite) || 0
    const mAxes = [Number(p.maitrise_technique) || 0, Number(p.maitrise_humaine) || 0, Number(p.maitrise_organisationnelle) || 0].filter((x) => x > 0)
    const maitriseMoy = mAxes.length ? mAxes.reduce((s, x) => s + x, 0) / mAxes.length : (Number(p.maitrise) || 0)
    // Cotation multi-axes (INRS / présentation SME) : note = P × F × G × S × (maîtrise / 5) ; repli G × F.
    if (P && f && g && S) {
      p.criticite = Math.round(P * f * g * S * ((maitriseMoy || 5) / 5))
      if (p.significatif == null) p.significatif = p.criticite >= 1000
    } else if (g && f) {
      p.criticite = g * f
      if (p.significatif == null) p.significatif = p.criticite >= 9
    }
    return p
  })
// Parties intéressées (ISO 14001 §4.2) — score = Influence × Maîtrise.
hseCrud('parties-interessees', ['entite', 'partie', 'type', 'attentes', 'influence', 'maitrise', 'score', 'exigence_retenue', 'mode_reponse', 'statut'],
  { create: createHsePartieInteressee, update: updateHsePartieInteressee, del: deleteHsePartieInteressee },
  (p) => { const i = Number(p.influence) || 0, m = Number(p.maitrise) || 0; if (i && m) p.score = i * m; return p })
// Diagnostic ISO 14001 (autodiagnostic par chapitre, niveau 1-4).
hseCrud('diagnostic-iso', ['entite', 'chapitre', 'titre', 'niveau_actuel', 'niveau_cible', 'constat', 'action', 'responsable', 'echeance'],
  { create: createHseDiagnosticIso, update: updateHseDiagnosticIso, del: deleteHseDiagnosticIso })
// Initialise la grille de diagnostic ISO 14001 (7 chapitres) si absente — idempotent.
app.post('/api/environnement/diagnostic-iso/init', async (c) => {
  const ex = await getHseDiagnosticIso().catch(() => [] as any[])
  const have = new Set((ex as any[]).map((d) => String(d.chapitre)))
  let created = 0
  for (const d of ISO14001_DIAGNOSTIC) {
    if (have.has(d.chapitre)) continue
    const r: any = await createHseDiagnosticIso({ chapitre: d.chapitre, titre: d.titre, niveau_actuel: 1, niveau_cible: 4 }).catch(() => ({ error: true }))
    if (!r.error) created++
  }
  return c.json({ ok: true, created })
})
// Autodiagnostic ISO 26000 (7 questions centrales).
hseCrud('diagnostic-iso26000', ['entite', 'code', 'titre', 'niveau_actuel', 'niveau_cible', 'constat', 'action', 'responsable', 'echeance'],
  { create: createHseDiagnosticIso26000, update: updateHseDiagnosticIso26000, del: deleteHseDiagnosticIso26000 })
app.post('/api/environnement/diagnostic-iso26000/init', async (c) => {
  const ex = await getHseDiagnosticIso26000().catch(() => [] as any[])
  const have = new Set((ex as any[]).map((d) => String(d.code)))
  let created = 0
  for (const q of ISO26000_QUESTIONS) {
    if (have.has(q.code)) continue
    const r: any = await createHseDiagnosticIso26000({ code: q.code, titre: q.titre, niveau_actuel: 1, niveau_cible: 4 }).catch(() => ({ error: true }))
    if (!r.error) created++
  }
  return c.json({ ok: true, created })
})

// ─── API : ECME (équipements de contrôle, mesure et essai) ───
function _ecmeProchain(dernier: string | null, periodMois: number | null): string | null {
  if (!dernier) return null
  const d = new Date(dernier + 'T00:00:00Z'); if (isNaN(d.getTime())) return null
  d.setMonth(d.getMonth() + (periodMois && periodMois > 0 ? periodMois : 12))
  return d.toISOString().slice(0, 10)
}
function _ecmeStatut(prochain: string | null, statutSaisi: string | null): string {
  if (statutSaisi === 'reforme' || statutSaisi === 'non_conforme') return statutSaisi
  if (!prochain) return statutSaisi || 'conforme'
  const today = new Date().toISOString().slice(0, 10)
  if (prochain < today) return 'a_etalonner'
  const soon = new Date(); soon.setDate(soon.getDate() + 30)
  if (prochain <= soon.toISOString().slice(0, 10)) return 'bientot'
  return 'conforme'
}
const ECME_FIELDS = ['code', 'designation', 'type', 'marque', 'modele', 'numero_serie', 'num_commande', 'localisation', 'etendue_mesure', 'resolution', 'activite', 'responsable', 'date_mise_service', 'periodicite_mois', 'date_dernier_etalonnage', 'organisme', 'incertitude', 'certificat_ref', 'reforme', 'notes']
app.post('/api/qualite/ecme', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.designation || !String(b.designation).trim()) return c.json({ ok: false, error: 'Désignation requise.' }, 400)
  const payload: any = {}
  for (const k of ECME_FIELDS) if (k in b) payload[k] = b[k] === '' ? null : b[k]
  payload.periodicite_mois = b.periodicite_mois != null && b.periodicite_mois !== '' ? Number(b.periodicite_mois) : 12
  payload.date_prochain_etalonnage = _ecmeProchain(payload.date_dernier_etalonnage || null, payload.periodicite_mois)
  payload.statut = _ecmeStatut(payload.date_prochain_etalonnage, b.statut || null)
  const { data, error } = await createEcme(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, ecme: data })
})
app.patch('/api/qualite/ecme/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ECME_FIELDS) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  if ('periodicite_mois' in patch) patch.periodicite_mois = patch.periodicite_mois != null ? Number(patch.periodicite_mois) : 12
  if ('date_dernier_etalonnage' in patch || 'periodicite_mois' in patch) {
    patch.date_prochain_etalonnage = _ecmeProchain(patch.date_dernier_etalonnage ?? b.date_dernier_etalonnage ?? null, patch.periodicite_mois ?? b.periodicite_mois ?? 12)
    patch.statut = _ecmeStatut(patch.date_prochain_etalonnage, b.statut || null)
  } else if ('statut' in b) patch.statut = b.statut
  const { data, error } = await updateEcme(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, ecme: data })
})
app.post('/api/qualite/ecme/:id/etalonner', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const dernier = b.date_dernier_etalonnage || new Date().toISOString().slice(0, 10)
  const period = b.periodicite_mois != null && b.periodicite_mois !== '' ? Number(b.periodicite_mois) : 12
  const prochain = _ecmeProchain(dernier, period)
  const patch: any = { date_dernier_etalonnage: dernier, periodicite_mois: period, date_prochain_etalonnage: prochain, statut: b.conforme === false ? 'non_conforme' : 'conforme' }
  if (b.organisme) patch.organisme = b.organisme
  if (b.certificat_ref) patch.certificat_ref = b.certificat_ref
  const { data, error } = await updateEcme(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, ecme: data })
})
app.delete('/api/qualite/ecme/:id', async (c) => {
  const { error } = await deleteEcme(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})
// ── ECME : saisie d'un PV de vérification (alimente la fiche de vie + recale les échéances) ──
app.post('/api/qualite/ecme/:id/verification', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  // Ej / Ef recalculés côté serveur à partir des mesures (autoritaire) si grille présente
  let ej: number | null = b.ej != null && b.ej !== '' ? Number(b.ej) : null
  let ef: number | null = b.ef != null && b.ef !== '' ? Number(b.ef) : null
  if (b.mesures) { const r = computeEcmePV(b.mesures, b.famille); if (r.ej != null) ej = r.ej; if (r.ef != null) ef = r.ef }
  const parent = (await getEcme().catch(() => [])).find((e: any) => String(e.id) === String(id))
  const period = parent?.periodicite_mois != null ? Number(parent.periodicite_mois) : 12
  const dateVerif = b.date_verif || new Date().toISOString().slice(0, 10)
  const arefaire = b.a_refaire_avant || _ecmeProchain(dateVerif, period)
  const vpayload: any = {
    ecme_id: id, ecme_code: parent?.code || null, date_verif: dateVerif, intervenant: b.intervenant || null,
    lieu: b.lieu || 'interne', famille: b.famille || parent?.type || null, interventions: b.interventions || null,
    mesures: b.mesures || null, ej, ef,
    classe_justesse: b.classe_justesse || null, classe_fidelite: b.classe_fidelite || null, classe_globale: b.classe_globale || null,
    resultat: b.resultat || null, decision: b.decision || 'conforme', motif_nc: b.motif_nc || null,
    visa: b.visa || null, a_refaire_avant: arefaire, cale_etalon: b.cale_etalon || null,
    pv_ref: b.pv_ref || null, indice: b.indice || null, certificat_ref: b.certificat_ref || null, organisme: b.organisme || null,
  }
  const { data: verif, error } = await createEcmeVerification(vpayload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Recalage du catalogue : dernière vérif = date, prochaine = à refaire avant, statut recalculé
  const patch: any = { date_dernier_etalonnage: dateVerif, date_prochain_etalonnage: arefaire, statut: b.decision === 'non_conforme' ? 'non_conforme' : _ecmeStatut(arefaire, null) }
  if (b.certificat_ref) patch.certificat_ref = b.certificat_ref
  if (b.organisme) patch.organisme = b.organisme
  const { data: ecme } = await updateEcme(id, patch)
  return c.json({ ok: true, verification: verif, ecme: ecme || { date_prochain_etalonnage: arefaire } })
})
app.patch('/api/qualite/ecme/verification/:vid', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['intervenant', 'interventions', 'classe_justesse', 'classe_fidelite', 'classe_globale', 'resultat', 'decision', 'motif_nc', 'visa', 'a_refaire_avant', 'cale_etalon', 'pv_ref', 'indice', 'certificat_ref', 'organisme']) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  const { data, error } = await updateEcmeVerification(c.req.param('vid'), patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, verification: data })
})
app.delete('/api/qualite/ecme/verification/:vid', async (c) => {
  const { error } = await deleteEcmeVerification(c.req.param('vid'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})
// ── ECME : fiche de vie imprimable (identité matériel + journal des opérations) ──
app.get('/api/qualite/ecme/:id/fiche-vie.pdf', async (c) => {
  const id = c.req.param('id')
  const [ecmes, verifs] = await Promise.all([getEcme().catch(() => []), getEcmeVerifications(id).catch(() => [])])
  const e = (ecmes as any[]).find((x: any) => String(x.id) === String(id))
  if (!e) return c.text('ECME introuvable', 404)
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const st = _ecmeStatutLive(e)
  const idCell = (l: string, v: any) => `<td style="padding:6px 9px;border:1px solid #d1d5db;"><div style="font-size:8px;text-transform:uppercase;color:#6b7280;font-weight:700;">${l}</div><div style="font-size:11px;color:#111827;font-weight:600;">${esc(v) || '—'}</div></td>`
  const idBloc = `<table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr>${idCell('Identification', e.code)}${idCell('Désignation', e.designation)}${idCell('Type', _ecmeTypeLabel(e.type))}${idCell('Emplacement', e.localisation)}</tr>
    <tr>${idCell('Marque', e.marque)}${idCell('Modèle', e.modele)}${idCell('N° série', e.numero_serie)}${idCell('N° commande', e.num_commande)}</tr>
    <tr>${idCell('Responsable', e.responsable)}${idCell('Capacité', e.etendue_mesure)}${idCell('Précision', e.resolution)}${idCell('Périodicité', (e.periodicite_mois || 12) + ' mois')}</tr>
    <tr>${idCell('Mise en service', e.date_mise_service)}${idCell('Dernière vérif.', e.date_dernier_etalonnage)}${idCell('Prochaine vérif.', e.date_prochain_etalonnage)}${idCell('Statut', st.label)}</tr>
  </table>`
  const hrow = (v: any) => `<tr>
    <td style="padding:4px 7px;border:1px solid #d1d5db;">${esc(v.date_verif)}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;">${esc(v.intervenant)}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${v.lieu === 'externe' ? 'Ext' : 'Int'}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;">${esc(v.interventions)}${v.certificat_ref ? ' · cert. ' + esc(v.certificat_ref) : ''}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${v.ej == null ? '—' : v.ej}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${v.ef == null ? '—' : v.ef}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${esc(v.resultat)}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;font-weight:700;color:${v.decision === 'non_conforme' ? '#b91c1c' : '#15803d'};">${v.decision === 'non_conforme' ? 'NC' : 'C'}${v.classe_globale ? ' / ' + esc(v.classe_globale) : ''}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${esc(v.visa)}</td>
    <td style="padding:4px 7px;border:1px solid #d1d5db;text-align:center;">${esc(v.a_refaire_avant)}</td>
  </tr>`
  const histo = (verifs as any[]).length
    ? `<table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead><tr style="background:#f1f5f9;">${['Date', 'Intervenant', 'Lieu', 'Interventions réalisées', 'Ej', 'Ef', 'Résultat', 'Décision / classe', 'Visa', 'À refaire avant'].map((h) => `<th style="padding:5px 7px;border:1px solid #d1d5db;text-align:left;font-size:9px;text-transform:uppercase;color:#374151;">${h}</th>`).join('')}</tr></thead>
        <tbody>${(verifs as any[]).map(hrow).join('')}</tbody></table>`
    : `<div style="color:#6b7280;font-size:11px;padding:10px;">Aucune vérification enregistrée.</div>`
  const body = `<div style="font-weight:800;font-size:13px;color:#4c1d95;margin-bottom:6px;">Identité du matériel</div>${idBloc}
    <div style="font-weight:800;font-size:13px;color:#4c1d95;margin:14px 0 6px;">Journal des opérations (${(verifs as any[]).length})</div>${histo}
    <div style="margin-top:10px;font-size:9px;color:#6b7280;">Légende : B = Bon, M = Moyen, HS = Hors service · C = Conforme, NC = Non conforme · Ej = erreur de justesse, Ef = erreur de fidélité.</div>`
  const right = `<div style="text-align:right;font-size:11px;color:#374151;"><div style="font-weight:800;">Fiche de vie ECME</div><div>${esc(e.code || '')}</div><div style="color:#6b7280;">Périodicité ${(e.periodicite_mois || 12)} mois</div></div>`
  return c.html(renderPrintableDoc('Fiche de vie — ' + (e.code || e.designation || 'ECME'), BRAND.violet, right, body))
})

// ─── API : Étude de capabilité (SPC) — Cp / Cpk / Cm / DPMO / niveau σ ───
function _erf(x: number) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911; const t = 1 / (1 + p * x); const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x); return s * y }
function _normCdf(z: number) { return 0.5 * (1 + _erf(z / Math.SQRT2)) }
function _normInv(p: number) {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239], b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1], cc = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425; let q: number, r: number
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1) }
  if (p <= 1 - pl) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1) }
  q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}
function computeCapa(mesures: number[], usl: number | null, lsl: number | null, seuil = 1.66) {
  const xs = mesures.filter(v => typeof v === 'number' && isFinite(v))
  const n = xs.length
  const NUL = { n, mean: null, sigma: null, cv: null, cp: null, cpk: null, cm: null, dpmo: null, niveauSigma: null, conformePct: null, ncPct: null, min: null, max: null, verdict: 'na' } as any
  if (n < 2) return NUL
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const sigma = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1))   // σ échantillon (STDEV.S, comme l'Excel)
  const cv = mean !== 0 ? sigma / Math.abs(mean) : null
  const hasU = usl != null && isFinite(usl), hasL = lsl != null && isFinite(lsl)
  if (!(sigma > 0)) return { ...NUL, mean: +mean.toFixed(5), sigma: 0, cv, min: Math.min(...xs), max: Math.max(...xs) }
  const cp = (hasU && hasL) ? (usl! - lsl!) / (6 * sigma) : null
  const cpu = hasU ? (usl! - mean) / (3 * sigma) : Infinity
  const cpl = hasL ? (mean - lsl!) / (3 * sigma) : Infinity
  let cpk: number | null = Math.min(cpu, cpl); if (!isFinite(cpk)) cpk = (hasU || hasL) ? (isFinite(cpu) ? cpu : (isFinite(cpl) ? cpl : null)) : null
  const cm = (cp != null && cpk != null) ? cp / (1 + 9 * (cp - cpk) ** 2) : null   // Cm (Taguchi approché, formule du classeur)
  const pAbove = hasU ? Math.max(0, 1 - _normCdf((usl! - mean) / sigma)) : 0
  const pBelow = hasL ? Math.max(0, _normCdf((lsl! - mean) / sigma)) : 0
  const ncFrac = Math.min(1, pAbove + pBelow)
  const dpmo = ncFrac * 1e6
  const yield_ = 1 - ncFrac
  const niveauSigma = cpk != null ? +(3 * cpk).toFixed(2) : null
  const verdict = cpk == null ? 'na' : (cpk >= seuil ? 'capable' : (cpk >= 1.0 ? 'limite' : 'non_capable'))
  const r3 = (x: number | null) => x == null ? null : +x.toFixed(3)
  return { n, mean: +mean.toFixed(5), sigma: +sigma.toFixed(5), cv: cv != null ? +cv.toFixed(5) : null, cp: r3(cp), cpk: r3(cpk), cm: r3(cm), dpmo: +dpmo.toFixed(2), niveauSigma, conformePct: +(yield_ * 100).toFixed(4), ncPct: +(ncFrac * 100).toFixed(4), min: Math.min(...xs), max: Math.max(...xs), verdict }
}

app.post('/api/qualite/capabilite', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const mesures: number[] = (Array.isArray(b.mesures) ? b.mesures : String(b.mesures || '').split(/[\s,;]+/))
    .map((v: any) => Number(String(v).replace(',', '.'))).filter((v: number) => isFinite(v))
  if (mesures.length < 2) return c.json({ ok: false, error: 'Au moins 2 mesures valides requises.' }, 400)
  const usl = (b.usl != null && b.usl !== '') ? Number(b.usl) : null
  const lsl = (b.lsl != null && b.lsl !== '') ? Number(b.lsl) : null
  if (usl == null && lsl == null) return c.json({ ok: false, error: 'Au moins une limite (USL ou LSL) requise.' }, 400)
  const seuil = (b.seuil != null && b.seuil !== '') ? Number(b.seuil) : 1.66
  const prodTot = (b.production_totale != null && b.production_totale !== '') ? Number(b.production_totale) : null
  const r = computeCapa(mesures, usl, lsl, seuil)
  const { data, error } = await createEtudeCapabilite({
    type: b.type === 'process' ? 'process' : (b.type === 'manuel' ? 'manuel' : 'machine'),
    ressource_id: b.ressource_id || null, ressource_nom: b.ressource_nom || null,
    caracteristique: (b.caracteristique && String(b.caracteristique).trim()) || (b.ressource_nom ? `Capabilité ${b.ressource_nom}` : 'Étude capabilité'),
    unite: b.unite || null,
    usl, lsl, cible: (b.cible != null && b.cible !== '') ? Number(b.cible) : null,
    nominale: (b.nominale != null && b.nominale !== '') ? Number(b.nominale) : null,
    seuil, production_totale: prodTot,
    mesures, n: r.n, moyenne: r.mean, ecart_type: r.sigma, cv: r.cv,
    cp: r.cp, cpk: r.cpk, cpm: r.cm, dpmo: r.dpmo, niveau_sigma: r.niveauSigma,
    conforme_pct: r.conformePct, nc_pct: r.ncPct, verdict: r.verdict,
    operateur: b.operateur || null, notes: b.notes || null,
    date_etude: b.date_etude || new Date().toISOString().slice(0, 10),
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, etude: data })
})

app.delete('/api/qualite/capabilite/:id', async (c) => {
  const { error } = await deleteEtudeCapabilite(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── Contrôle des cotes : opérateur (BDT) OU qualité → carte de contrôle machine (écarts réduits) ──
app.post('/api/controles/cote', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const nominale = Number(b.nominale), tolMin = Number(b.tol_min), tolMax = Number(b.tol_max), mesure = Number(b.mesure)
  if (![nominale, tolMin, tolMax, mesure].every(isFinite)) return c.json({ ok: false, error: 'Valeurs numériques requises (nominale, tol_min, tol_max, mesure).' }, 400)
  if (tolMax <= tolMin) return c.json({ ok: false, error: 'La tolérance maxi doit être supérieure à la mini.' }, 400)
  if (!b.cote || !String(b.cote).trim()) return c.json({ ok: false, error: 'Cote requise.' }, 400)
  const demiTol = (tolMax - tolMin) / 2
  const ecart = mesure - nominale
  const ecartNorm = demiTol > 0 ? +(ecart / demiTol).toFixed(4) : 0   // ±1 = bord de tolérance
  const conforme = mesure >= tolMin && mesure <= tolMax
  const { data, error } = await createControleCote({
    machine_id: b.machine_id || null, machine_nom: b.machine_nom || null,
    bdt_id: b.bdt_id || null, piece: b.piece || null, cote: String(b.cote).trim(),
    nominale, tol_min: tolMin, tol_max: tolMax, mesure,
    ecart: +ecart.toFixed(4), ecart_norm: ecartNorm,
    operateur_id: b.operateur_id || null, operateur_nom: await resolveSigner(c, b, b.operateur_nom || 'Opérateur'),
    controleur: await resolveSigner(c, b, b.controleur || 'Contrôleur'),
    source: b.source === 'qualite' ? 'qualite' : 'operateur',
    ecme_id: b.ecme_id || null, conforme,
    date_controle: b.date_controle || new Date().toISOString(),
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, controle: data })
})

app.delete('/api/controles/cote/:id', async (c) => {
  const { error } = await deleteControleCote(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ══════════════════════════════════════════════════════════════
// EXPÉDITIONS
// ══════════════════════════════════════════════════════════════
app.get('/expeditions/service', async (c) => {
  // ⚠ getBLClients() ne renvoie QUE type_bl client/null : les BL de réception et de retour
  //   client n'étaient chargés NULLE PART → le bloc « Réceptions effectuées » restait
  //   désespérément vide alors que la base en contenait. On charge donc TOUS les BL.
  //   Idem pour les vrais bons de sous-traitance (table bons_sous_traitance), que la page
  //   n'avait jamais : l'onglet ST n'affichait que du décor.
  const [blsAll, bds, bcs, cmds, das, fst, lots, ncs, quar, hasAck, fourns] = await Promise.all([
    getBonsDeLivraison(), getPlanningBDS().catch(() => [] as any[]),
    getBonsDeCommande(), getCommandes(), getDemandesAchat(), getFournisseursSt(), getLots(),
    getNonConformites().catch(() => [] as any[]), getQuarantaines().catch(() => [] as any[]),
    bcHasAckColumn().catch(() => false), getFournisseurs().catch(() => [] as any[]),
  ])
  // Map des BC DB → vue Expéditions (colonnes type_bc / fournisseur_nom / montant_ht / date_livraison…)
  const bcsView = (bcs as any[]).map((b: any) => ({
    id: b.id,
    num_bc: b.num_bc || b.id,
    type: (b.type_bc === 'st' || b.type_bc === 'sous_traitant') ? 'st' : 'fournisseur',
    fournisseur: b.fournisseur_nom || b.fournisseur || '—',
    articles: b.articles || (Array.isArray(b.lignes) ? b.lignes.map((l: any) => l.article).filter(Boolean).join(', ') : '') || '—',
    da_id: b.demande_achat_id || b.da_id || null,
    montant: Number(b.montant_ht ?? b.montant ?? 0) || 0,
    date_bc: b.date_bc || '',
    date_livraison_prevue: b.date_livraison || b.date_livraison_prevue || null,
    date_livraison_initiale: b.date_livraison_initiale || null,   // 1ʳᵉ date prévue gelée (OTD)
    date_reception_reelle: b.date_reception_reelle || null,       // arrivée réelle (planning)
    qte_commandee: b.qte_commandee ?? null,
    qte_recue: b.qte_recue ?? null,
    categorie: b.categorie || null,
    statut: b.statut || 'en_attente',
    accuse_fournisseur_le: b.accuse_fournisseur_le || null,  // « commande validée par le fournisseur » (nullable ; via migration bc_accuse_fournisseur.sql)
    date_relance: b.date_relance || null,                    // dernière relance notifiée (base du J+7 suivant)
    fournisseur_st_id: b.sous_traitant_id || b.fournisseur_st_id || null,
    affaire_id: b.affaire_id || null,
    bl_id: b.bl_id || null,
    pv_id: b.pv_id || null,
    fournisseur_id: b.fournisseur_id || null,      // rattachement au référentiel fournisseurs (onglet Fournisseurs)
    num_affaire: b.num_affaire || null,           // pour ouvrir la fiche affaire au clic
    // N° de BL qui sera attribue a la reception : calcule ICI avec la fonction qui
    // l'attribuera pour de vrai (nextBlPourBc), pour que le formulaire affiche
    // exactement ce qui sera enregistre. Le BL suit le NUMERO du BC, pas son id.
    bl_propose: nextBlPourBc(b.num_bc || b.id, b.num_affaire || b.affaire_id, (blsAll as any[]).map((x: any) => x.id)),
    transporteur: b.transporteur || null,
    transporteur_ref: b.transporteur_ref || null,
  }))
  const validations = await getValidations().catch(() => [])
  return c.html(pageServiceExpeditions(blsAll as any, bcsView as any, cmds, das, fst, lots, ncs as any, quar as any, validations as any, hasAck,
    { bds: bds as any[], today: TODAY_ISO(), fournisseurs: fourns as any[] }))   // BDS réels + date du jour calculée PAR REQUÊTE (le TODAY du module dérive) + référentiel fournisseurs (onglet Fournisseurs)
})

// ══════════════════════════════════════════════════════════════
// STOCK
// ══════════════════════════════════════════════════════════════
// Calcule dynamiquement le coefficient de rotation par article depuis les mouvements de stock.
// Rotation (annuelle) = sorties annualisées / stock moyen ; couverture (jours) = 365 / rotation.
function computeRotations(mvts: any[]): Record<string, { rotation: number; jours: number | null }> {
  const byKey: Record<string, { sorties: number; stockSum: number; stockN: number; minD: string; maxD: string }> = {}
  for (const m of mvts) {
    const isSortie = String(m.type || '').toLowerCase().includes('sortie')
    const keys = [String(m.article_id || ''), String(m.article_nom || '').toLowerCase().trim()].filter(Boolean)
    const d = String(m.date_mvt || (m.created_at || '').slice(0, 10) || '')
    for (const k of keys) {
      const e = byKey[k] || (byKey[k] = { sorties: 0, stockSum: 0, stockN: 0, minD: '9999', maxD: '0' })
      if (isSortie) e.sorties += Math.abs(Number(m.quantite) || 0)
      if (m.quantite_apres != null) { e.stockSum += Number(m.quantite_apres); e.stockN++ }
      if (d) { if (d < e.minD) e.minD = d; if (d > e.maxD) e.maxD = d }
    }
  }
  const out: Record<string, { rotation: number; jours: number | null }> = {}
  for (const k of Object.keys(byKey)) {
    const e = byKey[k]
    const avgStock = e.stockN ? e.stockSum / e.stockN : 0
    const days = (e.minD < e.maxD) ? Math.max(1, (new Date(e.maxD).getTime() - new Date(e.minD).getTime()) / 86400000) : 30
    const sortiesAnnuel = e.sorties * (365 / days)
    const rotation = avgStock > 0 ? sortiesAnnuel / avgStock : 0
    out[k] = { rotation: Math.round(rotation * 100) / 100, jours: rotation > 0 ? Math.round(365 / rotation) : null }
  }
  return out
}

// Réapprovisionnement automatique : crée une DA pour chaque réf configurée (auto_reappro) sous son seuil,
// si aucune DA n'est déjà ouverte pour cette réf. Idempotent (dé-dup par libellé d'article).
async function autoReappro(arts: any[], das: any[]) {
  // ⚠ Une DA RETIRÉE ne doit plus bloquer la recréation : sinon la référence ne serait
  //   jamais réapprovisionnée automatiquement, sans que rien ne le signale.
  const openRefs = new Set((das as any[])
    .filter(d => !['traitee', 'annulee'].includes(String(d.statut)) && !daMasquee(d))
    .map(d => String(d.article || '').toLowerCase().trim()))
  for (const a of arts) {
    if (!a.auto_reappro || !(a.point_commande > 0) || a.quantite > a.point_commande) continue
    const label = String(a.nom || a.reference || '').toLowerCase().trim()
    if (!label || openRefs.has(label)) continue
    const payload: any = {
      id: nextSeqId('DA', (das as any[]).map(d => d.id)),
      demandeur: 'Stock (auto)', type_da: a.categorie || 'Matière',
      article: a.nom || a.reference, fournisseur: a.fournisseur && a.fournisseur !== '—' ? a.fournisseur : null,
      qte: a.qte_commande ? String(a.qte_commande) : null,
      priorite: a.quantite <= a.seuil_mini ? 'urgent' : 'normal',
      statut: 'a_traiter', date_da: TODAY_ISO(), livraison: null, affaire_id: null,
      type_bc: 'fournisseur', visible: true, genere_par_adt: false,
    }
    const { data } = await createDemandeAchat(payload)
    if (data) { (das as any[]).push(data); openRefs.add(label) }
  }
}

// Édition des seuils + flag réappro auto d'une référence stock
app.patch('/api/stock/:id/seuils', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['stock_mini', 'point_commande', 'qte_commande', 'stock_maxi']) {
    if (k in b && b[k] != null) patch[k] = Number(b[k])
  }
  if ('auto_reappro' in b) patch.auto_reappro = !!b.auto_reappro
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateStockArticle(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, stock: data })
})

app.get('/stock/service', async (c) => {
  const [stockRows, mvts, fournisseurs, das] = await Promise.all([
    getStockReel().catch(() => [] as any[]),
    getMouvementsStock().catch(() => [] as any[]),
    getFournisseurs().catch(() => [] as any[]),
    getDemandesAchat().catch(() => [] as any[]),
  ])
  const fournById: Record<string, string> = {}
  ;(fournisseurs as any[]).forEach((f: any) => { fournById[String(f.id)] = f.nom })
  const rot = computeRotations(mvts as any[])
  const arts = (stockRows as any[]).map((s: any) => {
    const r = rot[String(s.id)] || rot[String(s.reference || '').toLowerCase().trim()] || rot[String(s.designation || '').toLowerCase().trim()] || null
    return {
      id: s.id, nom: s.designation || s.reference || s.id, reference: s.reference || '',
      categorie: s.categorie || 'autre', activite: s.activite || 'both',
      fournisseur: fournById[String(s.fournisseur_id)] || '—', fournisseur_id: s.fournisseur_id || null,
      unite: s.unite || 'u',
      quantite: Number(s.stock_actuel) || 0, seuil_mini: Number(s.stock_mini) || 0,
      point_commande: Number(s.point_commande) || 0, seuil_maxi: Number(s.stock_maxi) || 0,
      qte_commande: Number(s.qte_commande) || 0, prix_unitaire: Number(s.prix_achat_ht) || 0,
      emplacement: s.emplacement || '', consommation_mensuelle: Number(s.consommation_mensuelle) || 0,
      derniere_entree: s.derniere_entree || '', auto_reappro: s.auto_reappro === true,
      rotation: r ? r.rotation : null, rotationJours: r ? r.jours : null,
    }
  })
  // Réappro auto (DA générées pour les réfs configurées sous seuil)
  await autoReappro(arts, das as any[]).catch(() => {})
  return c.html(pageServiceStock(arts as any, mvts, fournisseurs as any))
})

// ══════════════════════════════════════════════════════════════
// MAINTENANCE (GMAO)
// ══════════════════════════════════════════════════════════════
// ─── API : Fiche Commande 360 (coûts/marge réels + traçabilité production) ───
app.get('/api/commande/:id/detail', async (c) => {
  const id = c.req.param('id')
  const detail = await getCommandeDetail(id).catch(() => ({ cmd: null as any }))
  if (!detail || !detail.cmd) return c.json({ ok: false, error: 'Commande introuvable' }, 404)
  return c.json({ ok: true, ...detail })
})

app.get('/maintenance/service', async (c) => {
  await scanPreventifOM().catch(() => {}) // best-effort : matérialise les OM préventifs dus (calendaire + usure) à l'ouverture du service
  const [oms, pps, mtbf, machines, pieces, sals, bdts, opex, controles, hist, noms, lots, postesM] = await Promise.all([
    getOrdresMaintenance(), getPlansPreventif(), getMtbfMachines(),
    getMachines().catch(() => []), getPiecesRechange().catch(() => []), getSalariesActifs().catch(() => []),
    getBonsDeTravail().catch(() => []),
    getMachinesOpex().catch(() => []), getControlesCotes().catch(() => []), getMachineHistorique().catch(() => []),
    getNomenclatures().catch(() => []), getLots().catch(() => []), getPostes().catch(() => []),
  ])
  // ─── Heures de fonctionnement MACHINE par machine → { machine_id: [{d, h}] } ───
  // h = TEMPS MACHINE uniquement (pas le temps opérateur). Source : champ stocké
  // temps_machine_reel/alloue si présent, sinon dérivé de l'analyse DT (gamme :
  // temps machine de l'étape × quantité du lot), sinon repli sur le temps exécuté.
  const _lcN = (s: any) => String(s ?? '').toLowerCase().trim()
  const nomsByAff: Record<string, any> = {}
  for (const n of (noms as any[])) {
    const a = String((n as any).num_affaire ?? ''); if (a && !(a in nomsByAff)) nomsByAff[a] = n
    const l = String((n as any).lot_id ?? ''); if (l && !(l in nomsByAff)) nomsByAff[l] = n
  }
  const lotById: Record<string, any> = {}
  for (const l of (lots as any[])) lotById[String((l as any).id)] = l
  const etapeMachineH = (nom: any, bdt: any): number | null => {
    const etapes = Array.isArray(nom?.etapes_production) ? nom.etapes_production : []
    if (!etapes.length) return null
    // Les gammes importées portent ressource/temps_variable_mille + process_nom (pas de machine_id
    // ni temps_machine_min). On matche l'étape par son nom OU son process_nom = opération du BDT.
    let e = etapes.find((x: any) => _lcN(x.nom) === _lcN(bdt.operation) || _lcN(x.process_nom) === _lcN(bdt.operation))
    if (!e && bdt.machine_id) e = etapes.find((x: any) => String(x.machine_id) === String(bdt.machine_id))
    if (!e) return null
    let mMinUnit = 0, mReg = 0
    if (e.ressource === 'machine') {
      mMinUnit = (Number(e.temps_variable_mille) || 0) / 1000 * 60
      // Temps MACHINE : seul le reglage machine (RGM) immobilise la machine ; a defaut,
      // le champ historique, qui etait deja impute a la machine pour une etape 'machine'.
      mReg = (e.temps_reglage_machine_mille != null || e.temps_reglage_op_mille != null)
        ? (Number(e.temps_reglage_machine_mille) || 0) / 1000 * 60
        : (Number(e.temps_reglage_mille) || 0) / 1000 * 60
    } else {
      mMinUnit = Number(e.temps_machine_min ?? ((e.machine_id || e.machine_taux_h) ? (e.temps_unitaire_min ?? 0) : 0)) || 0
      mReg = (e.machine_id || e.machine_taux_h) ? (Number(e.temps_reglage_machine_min ?? e.temps_reglage_min) || 0) : 0
    }
    if (mMinUnit <= 0 && mReg <= 0) return null
    const qte = Math.max(1, Number(lotById[String(bdt.lot_id)]?.qte) || 1)
    return (mMinUnit * qte + mReg) / 60
  }
  const machineHours: Record<string, { d: string; h: number }[]> = {}
  ;(bdts as any[]).forEach((b: any) => {
    if (!b.machine_id) return
    // Temps MACHINE ALLOUÉ uniquement. Le temps réel mesuré = temps BDT total (reçu→soldé),
    // homme + machine non séparables → on ne compte que le temps machine planifié (analyse DT) :
    // colonne temps_machine_alloue si renseignée, sinon dérivée de la gamme à la volée.
    let h: number | null = b.temps_machine_alloue != null ? Number(b.temps_machine_alloue) : null
    if (h == null) {
      const nom = nomsByAff[String(b.num_affaire ?? '')] || nomsByAff[String(b.lot_id ?? '')]
      h = nom ? etapeMachineH(nom, b) : null
    }
    if (h == null || !(h > 0)) return
    const d = String(b.date_prevue || b.date_echeance || b.created_at || '').slice(0, 10)
    ;(machineHours[String(b.machine_id)] = machineHours[String(b.machine_id)] || []).push({ d, h })
  })
  return c.html(pageServiceMaintenance(oms, pps, mtbf, machines as any[], pieces as any[], sals as any[], machineHours, opex as any[], controles as any[], hist as any[], postesM as any[]))
})

// ─── API MAINTENANCE : panne machine → OM → MTTR/MTBF + PDR ───
app.post('/api/production/machine/:id/panne', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const { data, error } = await updateMachine(id, { statut: 'arret', date_panne: new Date().toISOString(), motif_panne: b.motif || null } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, machine: data })
})
app.post('/api/production/machine/:id/reparer', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await updateMachine(id, { statut: 'operationnel', date_panne: null, motif_panne: null } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, machine: data })
})
app.post('/api/maintenance/om', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const machines = await getMachines().catch(() => [] as any[])
  const mach = (machines as any[]).find((m: any) => String(m.id) === String(b.machine_id))
  if (!mach) return c.json({ ok: false, error: 'Machine introuvable' }, 400)
  const oms = await getOrdresMaintenance().catch(() => [] as any[])
  const year = new Date().getFullYear()
  let n = 0; (oms as any[]).forEach((o: any) => { const mm = String(o.num_om || '').match(/OM-\d{4}-(\d+)/); if (mm) { const x = parseInt(mm[1], 10); if (x > n) n = x } })
  const num = 'OM-' + year + '-' + String(n + 1).padStart(3, '0')
  const dateSig = mach.date_panne ? String(mach.date_panne).slice(0, 10) : new Date().toISOString().slice(0, 10)
  const estPrev = b.type === 'preventif'
  const { data, error } = await createOrdreMaintenance({
    num_om: num, type: estPrev ? 'preventif' : 'correctif', machine_id: mach.id, machine_nom: mach.nom,
    titre: b.titre || ('Panne — ' + mach.nom), description: b.description || mach.motif_panne || null,
    priorite: ['normal', 'urgent', 'critique'].includes(b.priorite) ? b.priorite : 'urgent', statut: 'ouvert',
    responsable: b.responsable || null, date_signalement: dateSig,
    // Planification (saisie manuelle) : nullable, ignorée si absente du formulaire.
    ...(b.date_prevue ? { date_prevue: String(b.date_prevue).slice(0, 10) } : {}),
    ...(Number(b.duree_h) > 0 ? { duree_h: Number(b.duree_h) } : {}),
    // MTTR = clôture − début. Un CORRECTIF démarre à l'instant de la panne ; un PRÉVENTIF planifié
    //   ne démarre qu'à l'intervention réelle → pas de date_debut, sinon le MTTR serait faussé.
    ...(estPrev ? {} : { date_debut: mach.date_panne || new Date().toISOString() }),
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, om: data })
})
// Génère les Ordres de Maintenance pour les plans préventifs ÉCHUS (prochain_prevu ≤ today), sans doublon, et avance le plan.
// Scan préventif idempotent : (a) plans calendaires dus + (b) USURE (pièce remplaçable dont la durée de vie
//   est atteinte en heures machine cumulées) → crée les OM manquants. Idempotent : dédup en mémoire + index
//   unique DB (machine_id, piece_id, origine) sur les OM non clos. Best-effort ; renvoie le nb d'OM créés.
async function scanPreventifOM(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const notClos = (s: any) => !['termine', 'terminé', 'annule', 'annulé', 'cloture', 'cloturé', 'clôturé'].includes(String(s || '').toLowerCase())
  const [plans, oms, pieces, bdts] = await Promise.all([
    getPlansPreventif().catch(() => [] as any[]), getOrdresMaintenance().catch(() => [] as any[]),
    getPiecesRechange().catch(() => [] as any[]), getBonsDeTravail().catch(() => [] as any[]),
  ])
  let created = 0
  // (a) CALENDAIRE
  for (const p of (plans as any[]).filter(p => p.actif !== false && p.prochain_prevu && String(p.prochain_prevu).slice(0, 10) <= today)) {
    const deja = (oms as any[]).some(o => /prevent/i.test(String(o.type || '')) && String(o.machine_id) === String(p.machine_id) && notClos(o.statut) && String(o.titre || '').indexOf(String(p.intitule || '')) !== -1)
    if (deja) continue
    const num = nextSeqId('OM', (oms as any[]).map(o => o.num_om || o.id))
    const { data } = await createOrdreMaintenance({ num_om: num, type: 'preventif', origine: 'calendaire', machine_id: p.machine_id, machine_nom: p.machine_nom, titre: p.intitule || 'Préventif', description: p.instructions || '', priorite: 'normal', statut: 'ouvert', responsable: p.responsable || null, date_signalement: today, date_prevue: p.prochain_prevu, duree_h: p.duree_h ?? null, cout_estime: p.cout_estime ?? null } as any).catch(() => ({ data: null } as any))
    if (data) { (oms as any[]).push(data); created++ }
    if (p.frequence_jours) { const next = new Date(Date.now() + Number(p.frequence_jours) * 86400000).toISOString().slice(0, 10); await updatePlanPreventif(p.id, { dernier_fait: today, prochain_prevu: next }).catch(() => {}) }
  }
  // (b) USURE : heures machine cumulées (temps machine alloué des BDT) ≥ durée de vie de la pièce.
  const machH: Record<string, number> = {}
  for (const b of (bdts as any[])) { if (!(b as any).machine_id) continue; machH[String((b as any).machine_id)] = (machH[String((b as any).machine_id)] || 0) + (Number((b as any).temps_machine_alloue ?? (b as any).duree ?? 0) || 0) }
  for (const pc of (pieces as any[])) {
    const vie = Number((pc as any).duree_vie_h) || 0
    if (vie <= 0 || !(pc as any).machine_id) continue
    if ((machH[String((pc as any).machine_id)] || 0) < vie) continue
    const deja = (oms as any[]).some(o => String(o.origine || '') === 'usure' && String(o.piece_id || '') === String((pc as any).id) && notClos(o.statut))
    if (deja) continue
    const num = nextSeqId('OM', (oms as any[]).map(o => o.num_om || o.id))
    const { data } = await createOrdreMaintenance({ num_om: num, type: 'preventif', origine: 'usure', piece_id: (pc as any).id, machine_id: (pc as any).machine_id, machine_nom: (pc as any).machine_nom || null, titre: 'Remplacement pièce — ' + ((pc as any).nom || (pc as any).reference || (pc as any).id), description: 'Durée de vie atteinte (' + vie + ' h cumulées machine)', priorite: 'normal', statut: 'ouvert', date_signalement: today, date_prevue: today } as any).catch(() => ({ data: null } as any))
    if (data) { (oms as any[]).push(data); created++ }
  }
  return created
}
app.post('/api/maintenance/preventif/generer', async (c) => {
  const created = await scanPreventifOM().catch(() => 0)
  return c.json({ ok: true, created })
})
app.patch('/api/maintenance/om/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = { updated_at: new Date().toISOString() }
  for (const k of ['titre', 'description', 'priorite', 'statut', 'responsable', 'intervenant', 'date_prevue', 'cout_estime', 'cout_reel', 'pieces_utilisees', 'observations', 'cause_racine', 'action_preventive']) {
    if (k in b) patch[k] = b[k] === '' ? null : b[k]
  }
  if (b.statut === 'en_cours' && !b.date_debut) patch.date_debut = new Date().toISOString()
  const { data, error } = await updateOrdreMaintenance(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, om: data })
})
app.post('/api/maintenance/om/:id/cloturer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const oms = await getOrdresMaintenance().catch(() => [] as any[])
  const om = (oms as any[]).find((o: any) => String(o.id) === String(id))
  if (!om) return c.json({ ok: false, error: 'OM introuvable' }, 404)
  const now = new Date()
  // MTTR = temps entre la prise en charge (ou le signalement) et la clôture
  const start = om.date_debut ? new Date(om.date_debut) : (om.date_signalement ? new Date(om.date_signalement + 'T00:00:00Z') : now)
  const dureeH = Math.max(0, Math.round((now.getTime() - start.getTime()) / 36000) / 100)
  const patch: any = { statut: 'termine', date_fin: now.toISOString(), duree_h: dureeH, updated_at: now.toISOString() }
  for (const k of ['cout_reel', 'observations', 'cause_racine', 'action_preventive', 'pieces_utilisees', 'intervenant']) { if (k in b && b[k] !== '') patch[k] = b[k] }
  const { data, error } = await updateOrdreMaintenance(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  if (om.machine_id) await updateMachine(String(om.machine_id), { statut: 'operationnel', date_panne: null, motif_panne: null } as any).catch(() => {})
  return c.json({ ok: true, om: data, mttr_h: dureeH })
})
app.post('/api/maintenance/piece', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.machine_id || !b.designation || !String(b.designation).trim()) return c.json({ ok: false, error: 'Machine et désignation requises' }, 400)
  const { data, error } = await createPieceRechange({
    machine_id: b.machine_id, designation: String(b.designation).trim(), reference: b.reference || null,
    fournisseur: b.fournisseur || null, fournisseur_id: b.fournisseur_id || null,
    prix_unitaire: (b.prix_unitaire != null && b.prix_unitaire !== '') ? Number(b.prix_unitaire) : null,
    stock_actuel: b.stock_actuel != null && b.stock_actuel !== '' ? Number(b.stock_actuel) : 0,
    stock_mini: b.stock_mini != null && b.stock_mini !== '' ? Number(b.stock_mini) : 0,
    emplacement: b.emplacement || null, notes: b.notes || null,
    duree_vie_h: (b.duree_vie_h != null && b.duree_vie_h !== '') ? Number(b.duree_vie_h) : null,
    date_dernier_remplacement: b.date_dernier_remplacement || null,
    remplacable: b.remplacable === false ? false : true,
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, piece: data })
})
app.patch('/api/maintenance/piece/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['designation', 'reference', 'fournisseur', 'emplacement', 'notes', 'date_dernier_remplacement']) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  for (const k of ['prix_unitaire', 'stock_actuel', 'stock_mini', 'duree_vie_h']) if (k in b && b[k] !== '') patch[k] = b[k] != null ? Number(b[k]) : null
  if ('remplacable' in b) patch.remplacable = !!b.remplacable
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updatePieceRechange(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, piece: data })
})
app.delete('/api/maintenance/piece/:id', async (c) => {
  const { error } = await deletePieceRechange(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ══════════════════════════════════════════════════════════════
// RESSOURCES HUMAINES
// ══════════════════════════════════════════════════════════════
// Mappe un salarié (table salaries, source de vérité) → forme « Employe » attendue par les pages RH.
function mapSalarieToEmploye(s: any): any {
  return {
    id: s.id,
    matricule: s.matricule || s.id,
    nom: s.nom, prenom: s.prenom,
    date_embauche: s.date_entree, date_entree: s.date_entree,
    type_contrat: s.contrat || 'CDI',
    statut: s.actif === false ? 'inactif' : 'actif',
    activite: s.entite,              // Seem / Semrac / support
    role: s.role || s.metier,        // operateur / commercial / bei / … (rôle primaire)
    roles: Array.isArray(s.roles) && s.roles.length ? s.roles : (s.role ? [s.role] : []),  // multi-rôles
    est_operateur: !!s.est_operateur,
    poste: s.poste,
    service: s.role || s.metier,
    shift_id: s.shift_id,
    taux_horaire: s.taux_horaire_charge,
    email: s.email, telephone: s.telephone,
    adresse: s.adresse,
    date_naissance: s.date_naissance,
    urgence_contact: s.urgence_contact, urgence_tel: s.urgence_tel,
    solde_conges: s.solde_conges, solde_rtt: s.solde_rtt,
    // Données sociales RSE : sans elles la fiche les réaffiche vides… puis les efface au prochain enregistrement.
    sexe: s.sexe ?? null, oeth: s.oeth === true, date_sortie: s.date_sortie ?? null,
    autorisations: s.autorisations || [],
    competences: s.competences || [], habilitations: s.habilitations || [],
    has_pin: !!s.pin,
  }
}
app.get('/rh/service', async (c) => {
  const [sals, certs, matrix, pts, conges] = await Promise.all([getSalaries(), getCertifications(), getCompetences(), getPointages(), getConges().catch(() => [])])
  const emps = (sals as any[]).map(mapSalarieToEmploye)
  return c.html(pageServiceRH(emps, certs, matrix, pts, conges))
})
app.get('/rh/employes', async (c) => {
  const [sals, incidents, dotations, certs, validations] = await Promise.all([
    getSalaries(), getHseIncidents().catch(() => [] as any[]),
    getHseEpiDotations().catch(() => [] as any[]), getCertifications().catch(() => [] as any[]),
    getValidations().catch(() => [] as any[]),
  ])
  const emps = (sals as any[]).map(mapSalarieToEmploye)
  const orphans = computeOrphanNames(sals as any[], incidents as any[], dotations as any[], certs as any[])
  // Taux horaire : visible (et donc envoyé au client) UNIQUEMENT si droits d'écriture RH (rh/direction) — pas la lecture seule (comptable)
  const canWriteRH = canAccess((c as any).get('user') ?? null, '/api/rh/salarie', 'POST')
  return c.html(pageRHEmployes(emps, orphans, canWriteRH, validations as any[]))
})
app.get('/rh/organigramme', async (c) => {
  const sals = await getSalaries()
  return c.html(pageRHOrganigramme(sals as any[]))
})
app.get('/rh/habilitations', async (c) => {
  const [certs, sals] = await Promise.all([
    getCertifications(),
    getSalaries().catch(() => [] as any[]),
  ])
  const emps = (sals as any[]).map(mapSalarieToEmploye)
  return c.html(pageRHHabilitations(certs, emps))
})
app.get('/rh/competences', async (c) => {
  const [ops, comps, processes] = await Promise.all([
    getOperateursSalaries().catch(() => []),
    getCompetences(),
    getProcessAtelier().catch(() => []),
  ])
  // Forme attendue par la matrice : id, nom complet, activité (entité)
  const emps = (ops as any[]).map(o => ({
    id: o.id,
    nom: o.nom, prenom: o.prenom,
    activite: o.entite, poste: o.poste,
    statut: 'actif',
  }))
  return c.html(pageRHCompetences(emps as any, comps, processes))
})

// ─── API : upsert d'une cellule (employe × process) de la matrice de compétences
app.post('/api/rh/competence', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  // Compatibilité : le front peut envoyer employe_id ; en DB la colonne est salarie_id (FK salaries)
  const salarie_id = String(body.salarie_id ?? body.employe_id ?? '').trim()
  const operation  = String(body.operation  ?? '').trim()
  const niveau     = Math.max(0, Math.min(3, Number(body.niveau ?? 0)))
  if (!salarie_id || !operation) return c.json({ ok: false, error: 'salarie_id et operation requis' })
  // Nom dénormalisé depuis la table salaries (opérateurs réels)
  const ops = await getOperateursSalaries().catch(() => [] as any[])
  const op = (ops as any[]).find(e => String(e.id) === salarie_id)
  const employe_nom = op ? `${op.prenom ?? ''} ${op.nom ?? ''}`.trim() : null
  const activite = op?.entite ?? null
  const payload: any = {
    salarie_id, employe_nom, operation, niveau,
    activite, date_evaluation: new Date().toISOString().slice(0, 10)
  }
  const { error } = await upsertCompetence(payload)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true })
})

// ─── Rôles ERP et autorisations associées (source de vérité) ───
const RH_ROLES = ['operateur','oas','qualite','commercial','bei','achats','logistique','production','comptable','maintenance','rh','direction']
function autorisationsPourRole(role: string): string[] {
  const base: Record<string, string[]> = {
    operateur:  ['pointage', 'soldage'],
    oas:        ['pointage', 'oas', 'autocontrole'],   // opérateur OAS : autocontrôle + passage de lots, PAS de soldage BDT
    qualite:    ['qualite', 'securite', 'habilitations'],
    commercial: ['commercial'],
    bei:        ['be'],
    achats:     ['achats', 'stock'],
    logistique: ['expeditions', 'stock'],
    production: ['production', 'soldage', 'securite'],
    comptable:  ['compta'],
    maintenance:['maintenance'],
    rh:         ['rh', 'creer_salarie', 'securite', 'habilitations'],
    direction:  ['all', 'rh', 'creer_salarie', 'compta', 'commercial', 'be', 'achats', 'production', 'expeditions', 'stock', 'maintenance', 'qualite', 'securite', 'habilitations'],
  }
  return base[role] || []
}
// Union (dédupliquée) des autorisations sur plusieurs rôles.
function autorisationsUnion(roles: string[]): string[] {
  const set = new Set<string>()
  for (const r of roles) for (const a of autorisationsPourRole(r)) set.add(a)
  return [...set]
}
// Jetons d'accès par service cochés dans la fiche salarié (« lire:<svc> » / « ecrire:<svc> »).
// Filtrés sur les services réellement connus du menu : un jeton inconnu est ignoré, jamais stocké.
function jetonsAccesServices(b: any): string[] {
  if (!Array.isArray(b?.acces_services)) return []
  const svc = new Set(MENU_SERVICES_PUBLIC)
  return [...new Set((b.acces_services as any[])
    .map((x: any) => String(x || '').trim())
    .filter((t: string) => /^(lire|ecrire):/.test(t) && svc.has(t.split(':')[1])))]
}
// Rôles depuis le body (roles[] sinon role seul), filtrés aux rôles connus, dédupliqués. Le 1er = primaire.
function rolesFromBody(b: any): string[] {
  const raw: any[] = Array.isArray(b.roles) && b.roles.length ? b.roles : [b.role]
  const seen = new Set<string>(), out: string[] = []
  for (const r of raw) { if (RH_ROLES.includes(r) && !seen.has(r)) { seen.add(r); out.push(r) } }
  return out.length ? out : ['operateur']
}
const slugSalarie = (nom: string, prenom: string) =>
  ('SAL-' + String(prenom || '').trim().slice(0, 1) + String(nom || '').trim().replace(/[^a-zA-Z]/g, '').slice(0, 10) + '-' + Date.now().toString(36).slice(-4)).toUpperCase()
// Le rôle ERP (granulaire) → valeur « metier » contrainte en base (pilote aussi est_operateur généré)
function roleToMetier(role: string): string {
  const m: Record<string, string> = {
    operateur: 'operateur', oas: 'operateur', qualite: 'qualite',
    commercial: 'commercial', bei: 'technicien', achats: 'administratif',
    logistique: 'logistique', production: 'administratif', comptable: 'administratif',
    maintenance: 'technicien', rh: 'administratif', direction: 'direction',
  }
  return m[role] || 'autre'
}
function normContrat(c?: string): string {
  const v = String(c || 'CDI').toLowerCase()
  if (v.startsWith('cdd')) return 'CDD'
  if (v.startsWith('interim') || v.startsWith('intérim')) return 'interim'
  if (v.startsWith('appren')) return 'apprenti'
  if (v.startsWith('stag')) return 'stagiaire'
  return 'CDI'
}

// ─── API : créer un salarié (habilité RH/Direction requis si des RH existent déjà) ───
app.post('/api/rh/salarie', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.nom || !String(b.nom).trim()) return c.json({ ok: false, error: 'Nom requis' }, 400)
  const roles = rolesFromBody(b)
  const role = roles[0]   // rôle primaire (affichage / métier / entité)
  const sals = await getSalaries().catch(() => [] as any[])
  // Contrôle d'habilitation : il faut être RH/Direction pour créer un salarié,
  // sauf au tout premier amorçage (aucun salarié RH/Direction en base).
  const rhExistants = (sals as any[]).filter(s => ['rh', 'direction'].includes(s.role))
  if (rhExistants.length > 0) {
    const valid = await verifySalariePin(b.valideur_matricule, b.valideur_pin)
    const okRh = valid && (['rh', 'direction'].includes(valid.role) || (Array.isArray(valid.autorisations) && (valid.autorisations.includes('creer_salarie') || valid.autorisations.includes('all'))))
    if (!okRh) return c.json({ ok: false, error: 'Création réservée à une personne habilitée RH/Direction (identifiant + code PIN requis).' }, 403)
  }
  const isOp = roles.includes('operateur') || roles.includes('oas')   // l'OAS est aussi un opérateur (présence/planning)
  const entite = isOp ? (b.entite === 'Semrac' ? 'Semrac' : 'Seem') : 'Support'
  const id = b.matricule ? String(b.matricule).trim() : slugSalarie(b.nom, b.prenom)
  const payload: any = {
    id,
    nom: String(b.nom).trim(),
    prenom: b.prenom || null,
    poste: b.poste || null,
    role,
    roles,
    metier: roleToMetier(role),
    entite,
    matricule: b.matricule || id,
    pin: b.pin ? await hashPin(String(b.pin).trim()) : null,
    email: b.email || null,
    telephone: b.telephone || null,
    adresse: b.adresse || null,
    date_entree: b.date_entree || new Date().toISOString().slice(0, 10),
    contrat: normContrat(b.contrat),
    shift_id: b.shift_id || (isOp ? 'matin' : 'journee'),
    taux_horaire_charge: b.taux_horaire_charge != null ? Number(b.taux_horaire_charge) : null,
    autorisations: [...new Set([...autorisationsUnion(roles), ...jetonsAccesServices(b)])],   // les cases cochées à la création étaient jusqu'ici perdues
    competences: Array.isArray(b.competences) ? b.competences : [],
    habilitations: Array.isArray(b.habilitations) ? b.habilitations : [],
    solde_conges: b.solde_conges != null ? Number(b.solde_conges) : 175,  // heures (25 j × 7 h)
    solde_rtt: b.solde_rtt != null ? Number(b.solde_rtt) : 0,
    sexe: b.sexe || null,
    oeth: b.oeth === true,
    date_sortie: b.date_sortie || null,
    actif: true,
  }
  const { data, error } = await createSalarie(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Réconciliation : rattache les enregistrements HSE orphelins portant ce nom.
  let linked = 0
  try { linked = await relinkSalarieOrphans(String((data as any)?.id || id), payload.nom, payload.prenom || '') } catch { /* non bloquant */ }
  return c.json({ ok: true, salarie: data, linked })
})

// ─── EXPORT PAIE (Silae) : synthèse mensuelle des temps par salarié → CSV ───
// ?mois=YYYY-MM (défaut = mois courant). Colonnes à mapper aux rubriques Silae.
app.get('/api/rh/export-silae', async (c) => {
  const mois = String(c.req.query('mois') || new Date().toISOString().slice(0, 7)).slice(0, 7)
  const [pts, cgs, sals] = await Promise.all([getPointages().catch(() => [] as any[]), getConges().catch(() => [] as any[]), getSalaries().catch(() => [] as any[])])
  const byId: Record<string, any> = {}; for (const s of sals as any[]) byId[String(s.id)] = s
  const agg: Record<string, any> = {}
  const acc = (sid: string) => { if (!agg[sid]) { const s = byId[sid] || {}; agg[sid] = { matricule: s.matricule || sid, nom: s.nom || '', prenom: s.prenom || '', ent: s.entite || '', hNorm: 0, hSup: 0, hNuit: 0, jAbs: 0, jConges: 0 } } return agg[sid] }
  for (const p of pts as any[]) { if (String(p.date_pointage || '').slice(0, 7) !== mois) continue; const sid = String(p.salarie_id || p.employe_id || ''); if (!sid) continue; const a = acc(sid); a.hNorm += Number(p.heures_travaillees ?? p.heures_decimales ?? 0) || 0; a.hSup += Number(p.heures_supp || 0) || 0; a.hNuit += Number(p.heures_soir || 0) || 0; if (p.absent) a.jAbs += 1 }
  for (const g of cgs as any[]) { if (!['valide', 'validee'].includes(String(g.statut || ''))) continue; if (String(g.date_debut || '').slice(0, 7) !== mois) continue; const sid = String(g.salarie_id || ''); if (!sid) continue; acc(sid).jConges += Number(g.nb_jours || 0) || 0 }
  const rows = Object.values(agg).sort((a: any, b: any) => String(a.matricule).localeCompare(String(b.matricule)))
  const esc = (v: any) => { const s = String(v == null ? '' : v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const head = ['Matricule', 'Nom', 'Prenom', 'Entite', 'Periode', 'HeuresNormales', 'HeuresSupp', 'HeuresNuit', 'JoursAbsence', 'JoursConges']
  const csv = [head.join(';'), ...rows.map((r: any) => [r.matricule, r.nom, r.prenom, r.ent, mois, r.hNorm.toFixed(2), r.hSup.toFixed(2), r.hNuit.toFixed(2), r.jAbs, r.jConges].map(esc).join(';'))].join('\r\n')
  return c.body('﻿' + csv, 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="silae_temps_${mois}.csv"` })
})

// ─── EXPORT COMPTA (Sage) : écritures au format FEC (standard FR, tab-séparé) ───
// ?annee=YYYY (défaut = année courante). Importable dans Sage / par l'expert-comptable.
app.get('/api/compta/export-fec', async (c) => {
  const annee = String(c.req.query('annee') || new Date().getFullYear())
  const ecr = await getEcrituresComptables().catch(() => [] as any[])
  const rows = (ecr as any[]).filter(e => String(e.date_ecriture || '').slice(0, 4) === annee).sort((a, b) => String(a.date_ecriture || '').localeCompare(String(b.date_ecriture || '')))
  const jlib: Record<string, string> = { VTE: 'Ventes', ACH: 'Achats', BQ: 'Banque', OD: 'Operations diverses', CA: 'Caisse' }
  const d8 = (d: any) => String(d || '').slice(0, 10).replace(/-/g, '')
  const dec = (v: any) => (Number(v) || 0).toFixed(2).replace('.', ',')
  const cell = (v: any) => String(v == null ? '' : v).replace(/[\t\r\n]/g, ' ')
  const head = ['JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate', 'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib', 'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit', 'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise']
  const lines = [head.join('\t')]
  let n = 0
  for (const e of rows) { n++; lines.push([e.journal || 'OD', jlib[String(e.journal || '')] || e.journal || '', e.piece || ('EC' + n), d8(e.date_ecriture), e.compte || '', e.libelle || '', '', '', e.piece || '', d8(e.date_ecriture), e.libelle || '', dec(e.debit), dec(e.credit), e.lettrage || '', '', e.valide ? d8(e.date_ecriture) : '', '', ''].map(cell).join('\t')) }
  return c.body('﻿' + lines.join('\r\n'), 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="FEC_${annee}.txt"` })
})

// ─── API : modifier la fiche d'un salarié ───
app.patch('/api/rh/salarie/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['nom', 'prenom', 'poste', 'email', 'telephone', 'adresse', 'date_entree', 'shift_id', 'matricule', 'pin', 'taux_horaire_charge', 'actif', 'solde_conges', 'solde_rtt', 'date_naissance', 'urgence_contact', 'urgence_tel', 'manager_id', 'role', 'metier', 'entite', 'sexe', 'oeth', 'date_sortie']) {
    if (k in b) patch[k] = b[k]
  }
  if ('contrat' in b) patch.contrat = normContrat(b.contrat)
  if ('pin' in patch) patch.pin = patch.pin ? await hashPin(String(patch.pin).trim()) : null
  if ((Array.isArray(b.roles) && b.roles.length) || ('role' in b && RH_ROLES.includes(b.role))) {
    const roles = rolesFromBody(b)
    patch.roles = roles
    patch.role = roles[0]                       // rôle primaire
    patch.metier = roleToMetier(roles[0])
    patch.autorisations = autorisationsUnion(roles)   // union des permissions sur tous les rôles
    const isOp = roles.includes('operateur') || roles.includes('oas')
    patch.entite = isOp ? (b.entite === 'Semrac' ? 'Semrac' : 'Seem') : 'Support'
  } else if ('entite' in b) {
    patch.entite = b.entite === 'Seem' || b.entite === 'Semrac' ? b.entite : 'Support'
  }
  // Accès par service cochés dans la fiche salarié (« lire:<svc> » / « ecrire:<svc> »). Traités
  // HORS du bloc des rôles : un PATCH qui ne touche qu'aux accès doit les enregistrer aussi.
  // Dès qu'il en existe un, ils font foi pour l'accès aux services (voir canAccess dans auth.ts).
  if (Array.isArray(b.acces_services)) {
    let base: string[]
    if (Array.isArray(patch.autorisations)) base = patch.autorisations
    else {
      // Rôles inchangés : on repart des autorisations en base, purgées de leurs anciens jetons
      // de service — sinon décocher une case ne retirerait jamais le droit correspondant.
      const actuel: any = await getSalarie(id).catch(() => null)
      base = (Array.isArray(actuel?.autorisations) ? actuel.autorisations : [])
        .filter((t: any) => !/^(lire|ecrire):/.test(String(t || '')))
    }
    patch.autorisations = [...new Set([...base, ...jetonsAccesServices(b)])]
  }
  if (!Object.keys(patch).length) return c.json({ ok: false, error: 'Aucun champ' }, 400)
  const { data, error } = await updateSalarie(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  invaliderDroits(id)   // effet immédiat ici ; les autres isolates suivent sous quelques secondes
  return c.json({ ok: true, salarie: data })
})

// ─── API : supprimer un salarié (habilitation RH/Direction requise) ───
app.delete('/api/rh/salarie/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const sals = await getSalaries().catch(() => [] as any[])
  const rhExistants = (sals as any[]).filter(s => ['rh', 'direction'].includes(s.role))
  if (rhExistants.length > 0) {
    const valid = await verifySalariePin(b.valideur_matricule, b.valideur_pin)
    const okRh = valid && (['rh', 'direction'].includes(valid.role) || (Array.isArray(valid.autorisations) && (valid.autorisations.includes('supprimer_salarie') || valid.autorisations.includes('creer_salarie') || valid.autorisations.includes('all'))))
    if (!okRh) return c.json({ ok: false, error: 'Suppression réservée à une personne habilitée RH/Direction (identifiant + code PIN requis).' }, 403)
  }
  const { error } = await deleteSalarie(id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  invaliderDroits(id)   // la session de la personne supprimee tombe des cette requete
  return c.json({ ok: true })
})

// ─── API : créer une habilitation / certification ───
app.post('/api/rh/certification', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.salarie_id || !b.intitule) return c.json({ ok: false, error: 'salarié et intitulé requis' }, 400)
  const sals = await getSalaries().catch(() => [] as any[])
  const s = (sals as any[]).find(x => String(x.id) === String(b.salarie_id))
  const { data, error } = await createCertification({
    salarie_id: String(b.salarie_id),
    employe_nom: s ? `${s.prenom ?? ''} ${s.nom ?? ''}`.trim() : (b.employe_nom || null),
    type: b.type || 'habilitation',
    intitule: String(b.intitule).trim(),
    organisme: b.organisme || null,
    date_obtention: b.date_obtention || new Date().toISOString().slice(0, 10),
    date_expiration: b.date_expiration || null,
    statut: b.statut || 'valide',
    critique: !!b.critique,
    notes: b.notes || null,
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, certification: data })
})
app.patch('/api/rh/certification/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const patch: any = {}
  for (const k of ['salarie_id', 'employe_nom', 'type', 'intitule', 'organisme', 'date_obtention', 'date_expiration', 'statut', 'critique', 'notes']) if (k in b) patch[k] = b[k]
  const { data, error } = await updateCertification(id, patch)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, certification: data })
})

app.delete('/api/rh/certification/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await deleteCertification(id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ─── API : congés (demande + validation → absences reliées au planning) ───
app.post('/api/rh/conge', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.salarie_id || !b.date_debut || !b.date_fin) return c.json({ ok: false, error: 'salarié, date début et fin requis' }, 400)
  const sals = await getSalaries().catch(() => [] as any[])
  const s = (sals as any[]).find(x => String(x.id) === String(b.salarie_id))
  // Décompte en jours OUVRÉS (hors week-ends) puis en HEURES (base 7 h/jour)
  let nbJoursOuvres = 0
  for (const d = new Date(b.date_debut), end = new Date(b.date_fin); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); if (dow !== 0 && dow !== 6) nbJoursOuvres++
  }
  const nbHeures = (b.heures != null && Number(b.heures) > 0) ? Number(b.heures) : nbJoursOuvres * 7
  const { data, error } = await createConge({
    salarie_id: String(b.salarie_id),
    salarie_nom: s ? `${s.prenom ?? ''} ${s.nom ?? ''}`.trim() : (b.salarie_nom || null),
    type: b.type || 'conge_paye',
    date_debut: b.date_debut, date_fin: b.date_fin, nb_jours: nbJoursOuvres, nb_heures: nbHeures,
    motif: b.motif || null, statut: 'demande',
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, conge: data })
})

// ─── API : demande de congé depuis la badgeuse (auth matricule + PIN) → statut 'demande' ───
app.post('/api/pointage/demande-conge', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.matricule || !b.pin) return c.json({ ok: false, error: 'Matricule et mot de passe requis.' }, 400)
  if (!b.date_debut || !b.date_fin) return c.json({ ok: false, error: 'Dates de début et de fin requises.' }, 400)
  const sal = await verifySalariePin(String(b.matricule).trim(), String(b.pin).trim())
  if (!sal) return c.json({ ok: false, error: 'Matricule ou mot de passe incorrect.' }, 401)
  // Décompte en jours ouvrés (hors week-ends) → heures (base 7 h/jour)
  let nbJoursOuvres = 0
  for (const d = new Date(b.date_debut), end = new Date(b.date_fin); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); if (dow !== 0 && dow !== 6) nbJoursOuvres++
  }
  const nbHeures = nbJoursOuvres * 7
  const { data, error } = await createConge({
    salarie_id: String(sal.id),
    salarie_nom: `${sal.prenom ?? ''} ${sal.nom ?? ''}`.trim() || (b.nom ? `${b.prenom ?? ''} ${b.nom}`.trim() : null),
    type: b.type || 'conge_paye',
    date_debut: b.date_debut, date_fin: b.date_fin, nb_jours: nbJoursOuvres, nb_heures: nbHeures,
    motif: b.motif || null, statut: 'demande',
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  const routed = sal.est_operateur === true ? 'Production (Présence opérateurs)' : 'Direction'
  return c.json({ ok: true, conge: data, routed, nb_heures: nbHeures })
})

app.post('/api/rh/conge/:id/valider', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const decision = b.decision === 'refuse' ? 'refuse' : 'valide'
  const conges = await getConges().catch(() => [] as any[])
  const conge = (conges as any[]).find(x => String(x.id) === String(id))
  if (!conge) return c.json({ ok: false, error: 'Congé introuvable' }, 404)
  const { data, error } = await updateConge(id, { statut: decision, valide_par: b.valide_par || 'RH', valide_le: new Date().toISOString() })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  let absences = 0, attendues = 0, rerouted = 0
  if (decision === 'valide') {
    // Crée une absence par jour ouvré → se reflète dans le planning présence (forcé "absent").
    // ⚠ On compte les inserts RÉELS (avant : le compteur s'incrémentait même si l'insert échouait → « N jours posés » mensonger).
    const typeAbs = conge.type === 'maladie' ? 'maladie' : 'conge'
    const d = new Date(conge.date_debut), end = new Date(conge.date_fin)
    while (d <= end) {
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) {
        attendues++
        const res: any = await createAbsence({ operateur_id: conge.salarie_id, type: typeAbs, date_absence: d.toISOString().slice(0, 10) }).catch(() => ({ error: { message: 'insert' } }))
        if (res && !res.error) absences++
      }
      d.setDate(d.getDate() + 1)
    }
    // Réaffectation : les BDT planifiés de l'opérateur sur la période congé → renvoyés au pool 'pending' (operateur_id null).
    try {
      const debut = String(conge.date_debut).slice(0, 10), fin = String(conge.date_fin).slice(0, 10)
      const allBdt = await getBonsDeTravail().catch(() => [] as any[])
      for (const bt of (allBdt as any[])) {
        if (String((bt as any).operateur_id ?? '') !== String(conge.salarie_id)) continue
        if (/sold|termin/i.test(String((bt as any).statut || ''))) continue
        const dp = String((bt as any).date_prevue || '').slice(0, 10)
        if (dp && dp >= debut && dp <= fin) { const r: any = await updateBDT(String((bt as any).id), { operateur_id: null }).catch(() => ({ error: true })); if (r && !r.error) rerouted++ }
      }
    } catch {}
    // Décrémente le solde correspondant (congés payés → solde_conges, RTT/repos → solde_rtt)
    if (conge.type === 'conge_paye' || conge.type === 'rtt') {
      const sals = await getSalaries().catch(() => [] as any[])
      const s = (sals as any[]).find(x => String(x.id) === String(conge.salarie_id))
      if (s) {
        const col = conge.type === 'rtt' ? 'solde_rtt' : 'solde_conges'
        const cur = Number((s as any)[col] ?? 0)
        // Décompte en HEURES (solde stocké en heures, base 7 h/jour)
        const dec = Number(conge.nb_heures ?? (Number(conge.nb_jours ?? 0) * 7))
        await updateSalarie(s.id, { [col]: Math.max(0, cur - dec) }).catch(() => {})
      }
    }
  }
  const warn = (decision === 'valide' && absences < attendues) ? `Attention : ${absences}/${attendues} jours d'absence réellement posés (droits d'écriture ?).` : null
  return c.json({ ok: true, conge: data, absences_creees: absences, absences_attendues: attendues, bdt_rerouted: rerouted, ...(warn ? { warning: warn } : {}) })
})

app.get('/rh/temps', async (c) => {
  const d = new Date()
  const ym = d.toISOString().slice(0, 7)
  const monthFrom = ym + '-01'
  const monthTo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
  const [pts, sals, conges, presences] = await Promise.all([
    getPointages(), getSalaries(), getConges().catch(() => []),
    getPresences(monthFrom, monthTo).catch(() => [])
  ])
  const emps = (sals as any[]).map(mapSalarieToEmploye)
  return c.html(pageRHTemps(pts, emps, conges, presences))
})

app.get('/rh/pointage', async (c) => {
  const [pts, sals] = await Promise.all([getPointages(), getSalaries()])
  const emps = (sals as any[]).map(mapSalarieToEmploye)
  return c.html(pagePointage(pts, emps))
})

// ─── API : pointage réel (badgeuse) — auth salarié par matricule + code PIN, persiste en base ───
app.post('/api/rh/pointage', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  const action = ['arrivee', 'debut_pause', 'fin_pause', 'sortie'].includes(b.action) ? b.action : null
  if (!b.matricule || !b.pin || !action) return c.json({ ok: false, error: 'Matricule, code et action requis.' }, 400)
  const sal = await verifySalariePin(String(b.matricule).trim(), String(b.pin).trim())
  if (!sal) return c.json({ ok: false, error: 'Matricule ou code PIN incorrect.' })
  const nom = `${sal.prenom ?? ''} ${sal.nom ?? ''}`.trim() || sal.matricule || sal.id
  const now = new Date(); const nowIso = now.toISOString(); const today = nowIso.slice(0, 10); const hm = nowIso.slice(11, 16)
  const pts = await getPointages().catch(() => [] as any[])
  const cur = (pts as any[]).find(p => String(p.salarie_id) === String(sal.id) && p.date_pointage === today)
  if (action === 'arrivee') {
    if (cur && cur.heure_arrivee) return c.json({ ok: false, error: `${nom} a déjà pointé son arrivée aujourd'hui.` })
    const { error } = await createPointage({ salarie_id: sal.id, employe_nom: nom, date_pointage: today, heure_arrivee: nowIso, type: 'presence', statut: 'en_cours' } as any)
    if (error) return c.json({ ok: false, error: error.message })
    return c.json({ ok: true, operateur: nom, heure: hm })
  }
  if (!cur) return c.json({ ok: false, error: `${nom} doit d'abord pointer son arrivée.` })
  const patch: any = {}
  if (action === 'debut_pause') patch.heure_depart_pause = nowIso
  else if (action === 'fin_pause') patch.heure_retour_pause = nowIso
  else if (action === 'sortie') {
    patch.heure_depart = nowIso; patch.statut = 'valide'
    const arr = cur.heure_arrivee ? new Date(cur.heure_arrivee).getTime() : null
    if (arr) {
      let ms = now.getTime() - arr
      const dp = cur.heure_depart_pause ? new Date(cur.heure_depart_pause).getTime() : null
      const rp = cur.heure_retour_pause ? new Date(cur.heure_retour_pause).getTime() : null
      if (dp && rp && rp > dp) ms -= (rp - dp)
      patch.heures_travaillees = Math.max(0, +(ms / 3600000).toFixed(2))
    }
  }
  const { error } = await updatePointage(cur.id, patch)
  if (error) return c.json({ ok: false, error: error.message })
  return c.json({ ok: true, operateur: nom, heure: hm, heures: patch.heures_travaillees })
})

// ══════════════════════════════════════════════════════════════
// COMPTABILITÉ
// ══════════════════════════════════════════════════════════════
app.get('/compta/service', async (c) => {
  const [factCli, factFourn, ecritures, validations, bcsCpt] = await Promise.all([getFacturesClient(), getFacturesFournisseur(), getEcrituresComptables(), getValidations().catch(() => []), getBonsDeCommande().catch(() => [] as any[])])
  // Pièces jointes des factures fournisseurs : la facture scannée est rangée en GED sous
  // « BC:<id du bon de commande> », et l'identifiant de la facture est « FF-<id du BC> ».
  // On remonte donc du numéro de facture au document sans avoir besoin d'une colonne de lien.
  const pjFourn: Record<string, { id: string; nom: string }> = {}
  await Promise.all((factFourn as any[])
    .filter((f: any) => String(f.id || '').startsWith('FF-'))
    .map(async (f: any) => {
      const bcId = String(f.id).slice(3)
      const docs = await getDocumentsForNom('BC:' + bcId).catch(() => [] as any[])
      const doc = (docs as any[]).find((d: any) => String(d.categorie) === 'facture_fournisseur' && d.actif !== false)
      if (doc) pjFourn[String(f.id)] = { id: String(doc.id), nom: String(doc.fichier_nom || 'facture') }
    }))
  return c.html(pageServiceCompta(factCli, factFourn, ecritures, validations as any[], pjFourn, bcsCpt as any[]))
})

app.get('/qualite/anomalie', (c) => {
  const content = `
  ${pageHeader('fas fa-exclamation-triangle','#ef4444,#dc2626','Fiche Anomalie – Non-Conformité','Pierre-Yves / Agathe · NC interne/externe · Classification · Workflow 8D',['NC','EN9100 10.2'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Identification NC')}
      ${fieldRow(`${field('N° NC (auto)','text','NC-2026-XXX',false)} ${field('Date détection','date','')}`)}
      ${fieldRow(`${field('Type NC','select','NC Interne / NC Fournisseur / NC Client / NC Procédé')} ${field('Origine','select','Réception / Production / Contrôle / Client / Audit')}`)}
      ${fieldRow(`${field('Gravité','select','Mineure / Majeure / Critique – sécurité produit / Bloquante')} ${field('Détecteur','select','Opérateur / Contrôleur / Client / Auditeur')}`)}
      ${sectionTitle('Description')}
      ${field('Description détaillée de la non-conformité','textarea','Décrire la NC : quoi, où, quand, combien, conditions d\'apparition, pièces concernées…',true,2)}
      ${fieldRow(`${field('LOT / BDT concerné','text','LOT-2026-XXX ou BDT-XXX')} ${field('Quantité NC','number','0')}`)}
      ${sectionTitle('Contention immédiate')}
      ${fieldRow(`${field('Action immédiate','select','Mise en quarantaine / Tri 100% / Retouche / Destruction / Dérogation')} ${field('Traitement 8D requis','select','Oui – rapport 8D à créer / Non – traitement simplifié')}`)}
      ${field('Disposition pièces concernées','textarea','Détail des actions de contention appliquées…',false,2)}
      ${afterBox(
        ['Mail auto → Qualité (NC reçue)','Mail auto → Production (pièces bloquées)','Mail auto → Client si NC externe'],
        ['Fiche NC archivée GED','Lot bloqué en stock','8D créé si requis'],
        ['KPI qualité mis à jour','OQD recalculé']
      )}
      ${submitBtn('Créer la fiche NC','#ef4444')}
    `)}
  </div>`
  return c.html(layout('Fiche Anomalie', content, 'anomalie'))
})

app.get('/qualite/8d', async (c) => {
  const r8dId = c.req.query('id') || ''
  const [allNcs, sals, rapport] = await Promise.all([
    getNonConformites().catch(() => []) as Promise<any[]>,
    getSalariesActifs().catch(() => []) as Promise<any[]>,
    r8dId ? getRapport8DById(r8dId).catch(() => null) : Promise.resolve(null)
  ])
  // NC associée : priorité au ?nc= explicite, sinon celle du rapport chargé
  const ncId = c.req.query('nc') || (rapport && rapport.nc_id) || ''
  const openNcs = allNcs.filter(n => n.statut !== 'Clôturée')
  const nc = ncId ? (allNcs.find(n => n.id === ncId) || null) : null
  const responsables = sals.map(s => ({ id: s.id, nom: `${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.id }))
  const today = new Date().toISOString().slice(0, 10)
  return c.html(pageRapport8D({ nc, ncs: openNcs, responsables, today, rapport, numero: rapport ? rapport.id : '' }))
})

// ─── API QUALITÉ : rapports 8D + clôture NC ───
const R8D_COLS = ['affaire_id','nc_id','client_id','d1_equipe','d2_probleme','d3_actions_imm','d4_causes_racines','d5_actions_corr','d6_mise_en_oeuvre','d7_prevention','d8_conclusion','statut','gravite','date_ouverture','date_cloture','responsable']
const R8D_STATUTS = ['ouvert','en_cours','en_attente_validation','clos']
const R8D_GRAV = ['mineure','majeure','critique','bloquante']
// d1_equipe et d5_actions_corr sont des colonnes text[] : coercition string→array
const R8D_ARRAY_COLS = ['d1_equipe','d5_actions_corr']
const toTextArray = (v: any): string[] | null => {
  if (v == null) return null
  if (Array.isArray(v)) { const a = v.map(x => String(x).trim()).filter(Boolean); return a.length ? a : null }
  const a = String(v).split(/[\r\n,]+/).map(x => x.trim()).filter(Boolean)
  return a.length ? a : null
}
const R8D_FK_COLS = ['responsable','nc_id','affaire_id','client_id']
const normalize8D = (payload: Record<string, any>) => {
  for (const k of R8D_ARRAY_COLS) if (k in payload) payload[k] = toTextArray(payload[k])
  for (const k of R8D_FK_COLS) if (k in payload && (payload[k] === '' || payload[k] === undefined)) payload[k] = null
}
// Résout responsable (→ salaries) et client_id (→ clients) : accepte un id valide
// OU un nom libre (saisie rapide). Si introuvable, met à null pour éviter l'erreur FK.
const resolve8DFks = async (payload: Record<string, any>) => {
  if ('responsable' in payload && payload.responsable) {
    const val = String(payload.responsable).trim()
    const low = val.toLowerCase()
    const sals = await getSalariesActifs().catch(() => []) as any[]
    if (!sals.some(s => s.id === val)) {
      const m = sals.find(s =>
        `${s.prenom ?? ''} ${s.nom ?? ''}`.trim().toLowerCase() === low ||
        `${s.nom ?? ''} ${s.prenom ?? ''}`.trim().toLowerCase() === low ||
        String(s.prenom ?? '').toLowerCase() === low ||
        String(s.nom ?? '').toLowerCase() === low)
      payload.responsable = m ? m.id : null
    }
  }
  if ('client_id' in payload && payload.client_id) {
    const val = String(payload.client_id).trim()
    const low = val.toLowerCase()
    const cls = await getClients().catch(() => []) as any[]
    if (!cls.some(c => c.id === val)) {
      const m = cls.find(c => String(c.nom ?? '').toLowerCase() === low)
      payload.client_id = m ? m.id : null
    }
  }
}

app.post('/api/qualite/rapports-8d', async (c) => {
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const payload: any = pick(body, R8D_COLS)
  normalize8D(payload)
  await resolve8DFks(payload)
  if (!R8D_STATUTS.includes(payload.statut)) payload.statut = 'en_cours'
  if (!R8D_GRAV.includes(payload.gravite)) payload.gravite = 'majeure'
  const existing = await getRapports8D().catch(() => []) as any[]
  const year = new Date().getFullYear()
  let max = 0
  for (const r of existing) {
    const m = String(r.id || '').match(/8D-\d{4}-(\d+)/)
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n }
  }
  // N° 8D dérivé du n° de NC (NC-AAAA-XXX → 8D-AAAA-XXX) ; repli séquentiel si déjà pris.
  const derived8D = body.nc_id ? String(body.nc_id).replace(/^NC-/i, '8D-') : ''
  const idTaken = (id: string) => (existing as any[]).some((r: any) => String(r.id) === id)
  payload.id = (typeof body.id === 'string' && body.id) ? body.id
    : (derived8D && !idTaken(derived8D) ? derived8D : `8D-${year}-${String(max + 1).padStart(3, '0')}`)
  const { data, error } = await createRapport8D(payload)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

app.patch('/api/qualite/rapports-8d/:id', async (c) => {
  const id = c.req.param('id')
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const patch: any = pick(body, R8D_COLS)
  normalize8D(patch)
  await resolve8DFks(patch)
  if (patch.statut && !R8D_STATUTS.includes(patch.statut)) delete patch.statut
  if (patch.gravite && !R8D_GRAV.includes(patch.gravite)) delete patch.gravite
  const { data, error } = await updateRapport8D(id, patch)
  if (error) return c.json({ error: error.message }, 500)
  // Boucle qualité : clôturer un 8D ferme automatiquement la NC à l'origine (nc_id).
  const ncId = (data as any)?.nc_id ?? body.nc_id
  if (ncId && /clotur|clos|ferm|resolu|résolu/i.test(String((data as any)?.statut || patch.statut || ''))) {
    await updateNonConformite(String(ncId), { statut: 'cloture' }).catch(() => {})
  }
  return c.json({ data })
})

app.patch('/api/qualite/non-conformites/:id', async (c) => {
  const id = c.req.param('id')
  let body: any = {}
  try { body = await c.req.json() } catch {}
  const patch: any = pick(body, ['statut','gravite','detecteur','operation','lot_ref','client_nom','type_nc','affaire_id','date_nc','type_defaut','type_cause','action_corrective','responsable','lieu_detection','lieu_imputation','fournisseur_nom','frc','ref_article','designation','categorie','entite','description','n_commande','retour_attendu','qte_retour_attendue','date_retour_prevue','retour_statut','bl_retour_id','date_retour_reelle'])
  if (!(await ncHasExtCols().catch(() => false))) { delete patch.fournisseur_nom; delete patch.lieu_detection; delete patch.lieu_imputation }
  if (!(await ncHasResponsable().catch(() => false))) delete patch.responsable
  const { data, error } = await updateNonConformite(id, patch)
  if (error) return c.json({ error: error.message }, 500)
  // DÉCHET AUTO : rebut ajouté après coup → registre des déchets (idempotent via source_ref).
  if (/rebut/i.test(String(patch.action_corrective || ''))) {
    const nc: any = data || {}
    await ensureHseDechet('nc_rebut', String(id), {
      entite: nc.entite || 'Seem', date_dechet: nc.date_nc || TODAY_ISO(),
      designation: 'Rebut NC ' + id + (nc.designation ? ' — ' + nc.designation : ''),
      dangereux: false, zone_producteur: nc.lieu_detection || 'Production', statut: 'en_attente',
    }).catch(() => {})
  }
  return c.json({ ok: true, data })
})

// ── Traitement d'un RETOUR CLIENT (NC type client) : refuser / avoir (prix de vente) / commande prioritaire (coût de revient) ──
// Numérotation : avoir AV-YYYY-XX, commande P CMDP-YYYY-XX (XX = n° d'affaire rattaché, résolu/saisi côté modal).
app.post('/api/qualite/nc/:id/traiter-retour', async (c) => {
  const id = c.req.param('id')
  let b: any = {}
  try { b = await c.req.json() } catch {}
  // Idempotence : un retour déjà tranché ne se re-traite pas (évite double avoir / double commande P au rejeu ou double-clic).
  const ncExist: any = (await getNCs().catch(() => [] as any[])).find((n: any) => String(n.id) === String(id))
  if (ncExist && ncExist.decision_retour) return c.json({ ok: false, error: `Retour déjà traité (${ncExist.decision_retour}${ncExist.avoir_id ? ' ' + ncExist.avoir_id : ''}${ncExist.cmdp_id ? ' ' + ncExist.cmdp_id : ''}).`, decision_retour: ncExist.decision_retour }, 409)
  const decision = String(b.decision || '')
  const today = new Date().toISOString().slice(0, 10)
  const nb = Math.max(0, Number(b.nb_pieces_nc) || 0)
  const pxVente = Number(b.prix_vente_unitaire) || 0
  const pxRevient = Number(b.prix_revient_unitaire) || 0
  const client = b.client_nom || null, ref = b.ref_article || null, design = b.designation || null
  const lot = b.lot_ref || null, numFacture = b.num_facture || null
  // Résout année + XX depuis le n° d'affaire (AFF-2026-001 / 2026-1081 / 12 …)
  const raw = String(b.num_affaire || '').trim()
  const m = raw.match(/(\d{4})[-/](\d{1,5})\s*$/)
  const year = m ? Number(m[1]) : new Date().getFullYear()
  const xx = m ? m[2].padStart(3, '0') : ((raw.replace(/\D/g, '') || 'X').padStart(3, '0'))
  const numAffaire = raw || null
  const uniqueNum = (base: string, taken: Set<string>) => {
    if (!taken.has(base)) return base
    let k = 2; while (taken.has(base + '-' + k)) k++; return base + '-' + k
  }
  if (decision === 'refuse') {
    await updateNonConformite(id, { decision_retour: 'refuse', nb_pieces_nc: nb, num_facture: numFacture, statut: 'cloture' } as any)
    return c.json({ ok: true, decision: 'refuse' })
  }
  if (decision === 'avoir') {
    if (!(pxVente > 0) || nb <= 0) return c.json({ ok: false, error: 'Prix de vente unitaire et nombre de pièces requis pour un avoir.' }, 400)
    const montant = +(pxVente * nb).toFixed(2)
    const taken = new Set(((await getCredits().catch(() => [])) as any[]).map(x => String(x.id)))
    const num = uniqueNum(`AV-${year}-${xx}`, taken)
    const { data, error } = await createCredit({
      id: num, num_avoir: num, num_affaire: numAffaire, nc_id: id, type: 'retour_client', client_nom: client,
      motif: `Retour client${ref ? ' réf ' + ref : ''}${lot ? ' lot ' + lot : ''} — ${nb} pièce(s) NC (NC ${id})`,
      montant, solde: montant, date_credit: today, statut: 'actif',
    } as any)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    await updateNonConformite(id, { decision_retour: 'avoir', avoir_id: num, montant_avoir: montant, nb_pieces_nc: nb, prix_vente_unitaire: pxVente, num_facture: numFacture, statut: 'traite' } as any)
    return c.json({ ok: true, decision: 'avoir', num, avoir: data })
  }
  if (decision === 'commande_p') {
    if (nb <= 0) return c.json({ ok: false, error: 'Nombre de pièces à relancer requis.' }, 400)
    const taken = new Set(((await getCommandesPrioritaires().catch(() => [])) as any[]).map(x => String(x.id)))
    const num = uniqueNum(`CMDP-${year}-${xx}`, taken)
    const montantEstime = pxRevient > 0 ? +(pxRevient * nb).toFixed(2) : null
    const { data, error } = await createCommandePrioritaire({
      id: num, num_affaire: numAffaire, affaire_source: numAffaire, nc_id: id, client_nom: client,
      ref_article: ref, designation: design, qte: nb, cout_revient_unitaire: pxRevient || null,
      prix_vente_unitaire: pxVente || null, montant_estime: montantEstime, statut: 'a_faire',
    })
    if (error) return c.json({ ok: false, error: error.message }, 400)
    await updateNonConformite(id, { decision_retour: 'commande_p', cmdp_id: num, nb_pieces_nc: nb, prix_revient_unitaire: pxRevient, num_facture: numFacture, statut: 'traite' } as any)
    return c.json({ ok: true, decision: 'commande_p', num, commande_p: data })
  }
  return c.json({ ok: false, error: 'Décision inconnue.' }, 400)
})

// ── Traiter le REFUS d'une DÉROGATION → avoir / commande P (même mécanique que le retour client, sans migration) ──
app.post('/api/qualite/derogation/:id/traiter-refus', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const decision = String(b.decision || '')
  const nb = Number(b.nb) || 0
  const pxVente = Number(b.prix_vente) || 0
  const pxRevient = Number(b.cout_revient) || 0
  const ref = b.ref || ''
  const design = b.designation || ref || ''
  const today = new Date().toISOString().slice(0, 10)
  const derog: any = ((await getDerogations().catch(() => [] as any[])) as any[]).find(x => String(x.id) === String(id))
  if (!derog) return c.json({ ok: false, error: 'Dérogation introuvable.' }, 404)
  // Idempotence sur le champ DÉDIÉ decision_client (écrit uniquement par cette route), pas sur statut (modifiable au formulaire).
  if ((derog.statut || '') === 'solde' || derog.decision_client) return c.json({ ok: false, error: 'Ce refus a déjà été traité (' + (derog.decision_client || 'soldée') + ').' }, 409)
  const client = derog.client || null
  const raw = String(b.num_affaire || derog.notre_ref || '').trim()
  const m = raw.match(/(\d{4})[-/](\d{1,5})\s*$/)
  const year = m ? Number(m[1]) : new Date().getFullYear()
  const xx = m ? m[2].padStart(3, '0') : ((raw.replace(/\D/g, '') || 'X').padStart(3, '0'))
  const numAffaire = raw || null
  const uniqueNum = (base: string, taken: Set<string>) => { if (!taken.has(base)) return base; let k = 2; while (taken.has(base + '-' + k)) k++; return base + '-' + k }
  if (decision === 'refuse') {
    await updateDerogation(id, { statut: 'solde', decision_client: 'refus sec', commentaire: (derog.commentaire ? derog.commentaire + ' · ' : '') + 'Refus tranché sans geste commercial' } as any)
    return c.json({ ok: true, decision: 'refuse' })
  }
  if (decision === 'avoir') {
    if (!(pxVente > 0) || nb <= 0) return c.json({ ok: false, error: 'Prix de vente unitaire et nombre de pièces requis pour un avoir.' }, 400)
    const montant = +(pxVente * nb).toFixed(2)
    const taken = new Set(((await getCredits().catch(() => [])) as any[]).map(x => String(x.id)))
    const num = uniqueNum(`AV-${year}-${xx}`, taken)
    const { error } = await createCredit({
      id: num, num_avoir: num, num_affaire: numAffaire, nc_id: id, type: 'derogation', client_nom: client,
      motif: `Refus dérogation ${id}${ref ? ' réf ' + ref : ''} — ${nb} pièce(s)`, montant, solde: montant, date_credit: today, statut: 'actif',
    } as any)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    await updateDerogation(id, { statut: 'solde', decision_client: num } as any)
    return c.json({ ok: true, decision: 'avoir', num })
  }
  if (decision === 'commande_p') {
    if (nb <= 0) return c.json({ ok: false, error: 'Nombre de pièces à relancer requis.' }, 400)
    const taken = new Set(((await getCommandesPrioritaires().catch(() => [])) as any[]).map(x => String(x.id)))
    const num = uniqueNum(`CMDP-${year}-${xx}`, taken)
    const montantEstime = pxRevient > 0 ? +(pxRevient * nb).toFixed(2) : null
    const { error } = await createCommandePrioritaire({
      id: num, num_affaire: numAffaire, affaire_source: numAffaire, nc_id: id, client_nom: client,
      ref_article: ref, designation: design, qte: nb, cout_revient_unitaire: pxRevient || null,
      prix_vente_unitaire: pxVente || null, montant_estime: montantEstime, statut: 'a_faire',
    })
    if (error) return c.json({ ok: false, error: error.message }, 400)
    await updateDerogation(id, { statut: 'solde', decision_client: num } as any)
    return c.json({ ok: true, decision: 'commande_p', num })
  }
  return c.json({ ok: false, error: 'Décision inconnue.' }, 400)
})

// ── Mettre un objet en QUARANTAINE depuis une NC (objet libre : lot, palette, outillage, réception…) ──
app.post('/api/qualite/nc/:id/quarantaine', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const nc: any = ((await getNonConformites().catch(() => [] as any[])) as any[]).find(x => String(x.id) === String(id))
  const { data, error } = await createQuarantaine({
    nc_id: id,
    lot_id: b.objet_ref || (nc && nc.lot_ref) || null,
    piece: b.objet_label || (nc && (nc.designation || nc.ref_article)) || 'Objet',
    client_nom: (nc && nc.client_nom) || null,
    date_mise_quarantaine: TODAY_ISO(),
    motif: b.motif || ('NC ' + id),
    statut: 'en_cours',
  } as any)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  if (nc) await updateNonConformite(id, { statut: 'quarantaine' } as any).catch(() => {})
  return c.json({ ok: true, id: data && (data as any).id })
})

// ── STATUER une sortie de quarantaine : validation managériale / dérogation / décision immédiate ──
app.post('/api/qualite/quarantaine/:id/statuer', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => ({} as any))
  const mode = String(b.mode || '')
  const auteur = b.auteur || 'Qualité'
  const today = TODAY_ISO()
  const q: any = ((await getQuarantaines().catch(() => [] as any[])) as any[]).find(x => String(x.id) === String(id))
  if (!q) return c.json({ ok: false, error: 'Quarantaine introuvable.' }, 404)
  const objet = (q.id || '') + ' — ' + (q.piece || q.lot_id || '')
  if (mode === 'validation') {
    // soumet à la Direction ; la décision Direction répercutera le statut (hook /api/validations/:id/decision)
    const { data, error } = await createValidation({
      domaine: 'qualite', type: 'Sortie de quarantaine', objet, priorite: b.priorite || 'normal',
      ref_table: 'quarantaines', ref_id: id, emetteur: auteur, statut: 'en_attente', commentaire: b.commentaire || null,
    } as any)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    // Verrouille la ligne pendant l'attente (le bouton « Statuer » ne s'affiche que pour en_cours) → pas de double décision.
    await updateQuarantaine(id, { statut: 'en_validation' } as any).catch(() => {})
    return c.json({ ok: true, mode, validation: data })
  }
  if (mode === 'derogation') {
    const list = await getDerogations().catch(() => [] as any[])
    const nextNum = Math.max(351, ...((list as any[]).map(x => Number(x.numero) || 0))) + 1
    const derId = 'DER-' + nextNum
    const { error } = await createDerogation({
      id: derId, numero: nextNum, date_demande: today, client: q.client_nom || null, designation: q.piece || null,
      notre_ref: q.lot_id || null, descriptif: 'Demande de dérogation pour lever la quarantaine ' + q.id + (q.motif ? ' (' + q.motif + ')' : ''),
      type_demande: 'AC', statut: 'en_cours', nc_ref: q.nc_id || null,
    } as any)
    if (error) return c.json({ ok: false, error: error.message }, 400)
    const { error: uqe } = await updateQuarantaine(id, { statut: 'libere_derogation', libere_par: auteur, libere_le: today } as any)
    return c.json({ ok: true, mode, derogation: derId, ...(uqe ? { warn: 'Dérogation créée mais statut quarantaine non mis à jour : ' + uqe.message } : {}) })
  }
  if (mode === 'immediate') {
    const issue = b.issue === 'rejete' ? 'rejete' : 'libere'
    const texte = String(b.texte || '').trim()
    if (!texte) return c.json({ ok: false, error: 'Renseignez la décision.' }, 400)
    const { error: uqe } = await updateQuarantaine(id, { statut: issue, libere_par: auteur, libere_le: today } as any)
    if (uqe) return c.json({ ok: false, error: uqe.message }, 400)
    // Trace auteur + date + texte sans nouvelle colonne : entrée validations déjà décidée.
    await createValidation({
      domaine: 'qualite', type: 'Décision quarantaine', objet, ref_table: 'quarantaines', ref_id: id,
      statut: 'traite', emetteur: auteur, decided_by: auteur, decided_at: today, commentaire: texte,
    } as any).catch(() => {})
    // DÉCHET AUTO : un lot rejeté/détruit en quarantaine devient une entrée du registre des déchets (Environnement).
    let dechetAuto = false
    if (issue === 'rejete') {
      const r = await ensureHseDechet('quarantaine', String(id), {
        entite: q.activite || 'Seem', date_dechet: today,
        designation: 'Rebut quarantaine ' + (q.piece || q.lot_id || q.id),
        dangereux: false, quantite: Number(q.quantite) || null, unite: 'pcs',
        zone_producteur: 'Quarantaine', statut: 'en_attente',
      }).catch(() => ({ error: true } as any))
      dechetAuto = !(r as any).error
    }
    return c.json({ ok: true, mode, issue, dechetAuto })
  }
  return c.json({ ok: false, error: 'Mode inconnu.' }, 400)
})

// ── Lancer en production une COMMANDE PRIORITAIRE : commande réelle prioritaire → lot LOTP → BDTP/BDSP (encadrés rouge au planning) ──
app.post('/api/commandes-p/:id/lancer', async (c) => {
  const id = c.req.param('id')
  const list = await getCommandesPrioritaires().catch(() => [] as any[])
  const cp: any = (list as any[]).find(x => String(x.id) === String(id))
  if (!cp) return c.json({ ok: false, error: 'Commande prioritaire introuvable.' }, 404)
  if (cp.statut === 'traitee') return c.json({ ok: false, error: 'Commande déjà lancée en production.' }, 400)
  const raw = String(cp.num_affaire || cp.affaire_source || '').trim()
  const m = raw.match(/(\d{4})[-/](\d{1,5})\s*$/)
  const year = m ? m[1] : String(new Date().getFullYear())
  const xx = m ? m[2].padStart(3, '0') : ((raw.replace(/\D/g, '') || 'X').padStart(3, '0'))
  const key = year + '-' + xx
  const qte = Number(cp.qte) || 0
  const piece = cp.ref_article || cp.designation || 'Pièce'
  const client = cp.client_nom || null
  const today = new Date().toISOString().slice(0, 10)
  const cmdId = String(cp.id)                    // CMDP-YYYY-XX
  const lotId = 'LOTP-' + key + '-1'
  // 1) commande réelle prioritaire (best-effort) + 2) lot
  const numAffaireCmd = raw || ('AFF-' + key)   // commandes.num_affaire est NOT NULL
  const cmdRes = await createCommande({ id: cmdId, num_affaire: numAffaireCmd, client_nom: client, prioritaire: true, origine_nc: cp.nc_id || null, statut: 'a_faire', montant: (cp.montant_estime != null ? cp.montant_estime : 0), date_cmd: today } as any).catch((e: any) => ({ error: e }))
  const lotRes = await createLot({ id: lotId, cmd_id: cmdId, client_nom: client, piece, qte, statut: 'a_faire', prioritaire: true }).catch((e: any) => ({ error: e }))
  // 3) BDTP/BDSP : depuis la nomenclature (étapes) si dispo, sinon 1 BDTP de refabrication
  const noms = await getNomenclatures().catch(() => [] as any[])
  const nom: any = (noms as any[]).find(n => (n.code_ref_produit && cp.ref_article && String(n.code_ref_produit) === String(cp.ref_article)) || (n.num_affaire && raw && String(n.num_affaire) === String(raw)))
  const etapes: any[] = nom && Array.isArray(nom.etapes_production) ? nom.etapes_production : []
  const bdt: string[] = [], bds: string[] = []
  if (etapes.length) {
    let i = 0
    for (const e of etapes) {
      i++
      const op = e.operation || e.process || e.designation || ('Opération ' + i)
      const isST = Number(e.cout_st_unitaire) > 0 || /sous.?trait|^st$/i.test(String(e.type || op))
      if (isST) {
        const bid = 'BDSP-' + key + '-1-' + i
        await createBDSRow({ id: bid, cmd_ref: cmdId, lot_ref: lotId, client_nom: client, piece, qte, operation: op, statut: 'a_planifier', priorite: 'critique', seq: i } as any).catch(() => ({}))
        bds.push(bid)
      } else {
        const bid = 'BDTP-' + key + '-1-' + i
        const dur = Math.max(0.5, +(((Number(e.temps_unitaire_min || e.temps_mo_min || 30)) * (qte || 1)) / 60).toFixed(2))
        await createBDTRow({ id: bid, num_affaire: raw || null, cmd_ref: cmdId, lot_ref: lotId, client_nom: client, piece, operation: op, seq: i, duree: dur, temps_alloue: dur, statut: 'programme', priorite: 'critique', activite: 'Seem', prioritaire: true } as any).catch(() => ({}))
        bdt.push(bid)
      }
    }
  } else {
    const bid = 'BDTP-' + key + '-1-1'
    await createBDTRow({ id: bid, num_affaire: raw || null, cmd_ref: cmdId, lot_ref: lotId, client_nom: client, piece, operation: 'Refabrication (retour client)', seq: 1, duree: 1, temps_alloue: 1, statut: 'programme', priorite: 'critique', activite: 'Seem', prioritaire: true } as any).catch(() => ({}))
    bdt.push(bid)
  }
  await updateCommandePrioritaire(id, { statut: 'traitee', cmd_id: cmdId })
  return c.json({ ok: true, commande: cmdId, lot: lotId, bdt, bds })
})

app.get('/qualite/pv', (c) => {
  const content = `
  ${pageHeader('fas fa-clipboard-check','#b91c1c,#991b1b','PV Contrôle – Autocontrôle / SPC','Pierre-Yves / Agathe · PV réception · Cartes de contrôle SPC · EN9100',['PV','SPC','EN9100'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('PV de contrôle')}
      ${fieldRow(`${field('N° PV (auto)','text','PV-2026-XXX',false)} ${field('N° BDT / LOT','text','BDT-XXX / LOT-2026-XXX')}`)}
      ${fieldRow(`${field('Type de contrôle','select','Autocontrôle opérateur / Contrôle intermédiaire / Contrôle final / Réception client')} ${field('Contrôleur','select','Opérateur / Pierre-Yves / Agathe / Client')}`)}
      ${sectionTitle('Mesures & Résultats')}
      ${fieldRow(`${field('Cote contrôlée 1','text','Dim. / Tolérance',false)} ${field('Valeur mesurée 1','number','0',false)}`)}
      ${fieldRow(`${field('Cote contrôlée 2','text','Dim. / Tolérance',false)} ${field('Valeur mesurée 2','number','0',false)}`)}
      ${fieldRow(`${field('Contrôle visuel','select','Conforme / Non conforme',false)} ${field('ECME utilisé','text','Réf. instrument + date étalonnage',false)}`)}
      ${sectionTitle('Carte SPC (si applicable)')}
      ${fieldRow(`${field('Cp (capabilité process)','number','0',false)} ${field('Cpk','number','0',false)}`)}
      ${fieldRow(`${field('Décision libération lot','select','LIBÉRÉ / LIBÉRÉ AVEC DÉROGATION / BLOQUÉ – NC')} ${field('Signature contrôleur','text','Initiales',false)}`)}
      ${afterBox(
        ['Mail auto → Sylvie (lot libéré/bloqué)','Mail auto → Qualité (PV archivé)'],
        ['PV archivé GED','Lot mis à jour en stock'],
        ['SPC mis à jour','Historique contrôle traçable']
      )}
      ${submitBtn('Valider le PV','#b91c1c')}
    `)}
  </div>`
  return c.html(layout('PV Contrôle', content, 'pv'))
})

app.get('/qualite/liberation', (c) => {
  const content = `
  ${pageHeader('fas fa-unlock-alt','#991b1b,#7f1d1d','Libération de Lot','Pierre-Yves / Agathe · Release · Signature · Traçabilité complète · EN9100',['LOT','EN9100','Release'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Lot à libérer')}
      ${fieldRow(`${field('N° LOT','text','LOT-2026-XXX')} ${field('Client','text','Raison sociale')}`)}
      ${fieldRow(`${field('PV de contrôle associé','text','PV-2026-XXX')} ${field('Quantité à libérer','number','0')}`)}
      ${sectionTitle('Vérifications préalables')}
      ${fieldRow(`${field('Toutes opérations BDT terminées','select','Oui / Non – BDT en attente')} ${field('Tous PV signés','select','Oui / Non – PV manquant')}`)}
      ${fieldRow(`${field('Certificats matière disponibles','select','Oui / Non – à réclamer')} ${field('Traçabilité lot complète','select','Oui / Non – données manquantes')}`)}
      ${field('Remarques libération','textarea','Réserves, dérogations accordées, conditions particulières…',false,2)}
      ${fieldRow(`${field('Libéré par','select','Pierre-Yves / Agathe')} ${field('Date et heure libération','datetime-local','')}`)}
      ${afterBox(
        ['Mail auto → Expédition (lot libéré)','Mail auto → Sylvie (production clôturée)'],
        ['Lot marqué RELEASED en base','Certificat de conformité généré'],
        ['Lot disponible expédition','OTD calculé']
      )}
      ${submitBtn('Libérer le lot','#991b1b')}
    `)}
  </div>`
  return c.html(layout('Libération Lot', content, 'lib'))
})

app.get('/qualite/ecme', (c) => {
  const content = `
  ${pageHeader('fas fa-ruler','#7f1d1d,#450a0a','ECME – Métrologie / VGP','Registre instruments · Étalonnage · Apave · Conformité EN9100 7.1.5',['ECME','Métrologie','EN9100 7.1.5'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Instrument')}
      ${fieldRow(`${field('N° ECME (auto)','text','ECME-2026-XXX',false)} ${field('Type d\'instrument','select','Pied à coulisse / Micromètre / Jauge / Rugosimètre / Appareil de mesure / EPI Apave')}`)}
      ${fieldRow(`${field('Marque / Modèle','text','Marque · Modèle')} ${field('N° Série','text','S/N XXXX')}`)}
      ${fieldRow(`${field('Date dernier étalonnage','date','')} ${field('Date prochain étalonnage','date','')}`)}
      ${fieldRow(`${field('Statut','select','ÉTALONNÉ ✅ / À ÉTALONNER ⚠ / HORS SERVICE ❌ / PERDU / RÉFORMÉ')} ${field('Certificat étalonnage','text','Réf. certificat / Organisme',false)}`)}
      ${sectionTitle('VGP Apave (si applicable)')}
      ${fieldRow(`${field('Type VGP','select','N/A / Vérification périodique / Mise en service / Suite réparation',false)} ${field('Date VGP Apave','date','',false)}`)}
      ${afterBox(
        ['Mail auto → Qualité (ECME mis à jour)','Alerte auto avant expiration'],
        ['Registre ECME mis à jour GED','Certificat archivé'],
        ['Instruments indisponibles signalés','Production alertée si ECME critique']
      )}
      ${submitBtn('Enregistrer l\'ECME','#7f1d1d')}
    `)}
  </div>`
  return c.html(layout('ECME Métrologie', content, 'ecme'))
})

// ══════════════════════════════════════════════════════════════
// EXPÉDITION
// ══════════════════════════════════════════════════════════════
app.get('/expedition/bl', (c) => {
  const content = `
  ${pageHeader('fas fa-truck-loading','#06b6d4,#0891b2','Bon de Livraison / Expédition','Sabine · BLI · BLI-YYYY-NNN · Suivi transport · OTD · EN9100',['BL','OTD'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Bon de livraison')}
      ${fieldRow(`${field('N° BLI (auto)','text','BLI-2026-XXX',false)} ${field('Date expédition','date','')}`)}
      ${fieldRow(`${field('Client destinataire','text','Raison sociale + adresse livraison')} ${field('N° Commande client','text','BC-XXXX')}`)}
      ${fieldRow(`${field('N° LOT expédié','text','LOT-2026-XXX')} ${field('Quantité expédiée','number','0')}`)}
      ${fieldRow(`${field('N° BDT associé','text','BDT-XXX',false)} ${field('Transporteur','select','Chronopost / DHL / TNT / Transporteur client / Sur place')}`)}
      ${sectionTitle('Documents joints')}
      ${fieldRow(`${field('N° bordereau transport','text','BT-XXXX',false)} ${field('Certificat de conformité','select','Joint / Non applicable / À transmettre séparément')}`)}
      ${field('Instructions de livraison','textarea','Conditions d\'emballage, de manutention, horaires livraison, contact client…',false,2)}
      ${afterBox(
        ['Mail auto → Client (avis d\'expédition + BLI PDF)','Mail auto → Sabine (BL émis)','Mail auto → Compta (facturation)'],
        ['BLI archivé GED','BL généré PDF','Suivi transport activé'],
        ['OTD calculé à date expédition','Stock défalqué']
      )}
      ${submitBtn('Émettre le BL / Expédier','#06b6d4')}
    `)}
  </div>`
  return c.html(layout('Expédition / BL', content, 'bl'))
})

// ══════════════════════════════════════════════════════════════
// MAINTENANCE
// ══════════════════════════════════════════════════════════════
app.get('/maintenance/intervention', (c) => {
  const content = `
  ${pageHeader('fas fa-wrench','#eab308,#ca8a04','Intervention Maintenance / VGP','Préventif · Correctif · Apave · Historique machine · ECME',['Maintenance','VGP'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Demande d\'intervention')}
      ${fieldRow(`${field('N° DI (auto)','text','DI-2026-XXX',false)} ${field('Date demande','date','')}`)}
      ${fieldRow(`${field('Type d\'intervention','select','Corrective – panne / Préventive – planifiée / VGP Apave / Modification / Remise en service')} ${field('Priorité','select','Normale / Urgente – arrêt production / Critique – sécurité')}`)}
      ${sectionTitle('Machine / Équipement')}
      ${fieldRow(`${field('Équipement concerné','select','Tour CNC 1 / Tour CNC 2 / Laser / Presse / CN Semrac / Bain OAS / Bain rinçage / Compresseur / Pont roulant / Autre')} ${field('N° ECME / Tag machine','text','TAG-XXX',false)}`)}
      ${field('Description de la panne / travaux','textarea','Symptômes, bruit, vibration, message d\'erreur, code alarme, pièces suspectes…',true,2)}
      ${sectionTitle('Réalisation')}
      ${fieldRow(`${field('Intervenant','select','Interne / Prestataire agréé / Apave')} ${field('Durée estimée (h)','number','1',false)}`)}
      ${field('Actions réalisées','textarea','Détail des travaux : pièces changées, réglages, tests effectués…',false,2)}
      ${afterBox(
        ['Mail auto → Sylvie (machine arrêtée/remise en service)','Mail auto → Maintenance (DI reçue)'],
        ['DI archivée GED','Historique machine mis à jour'],
        ['Planning production recalculé si arrêt','ECME mis à jour si VGP']
      )}
      ${submitBtn('Valider l\'intervention','#eab308')}
    `)}
  </div>`
  return c.html(layout('Maintenance / VGP', content, 'maint'))
})

// ══════════════════════════════════════════════════════════════
// RH
// ══════════════════════════════════════════════════════════════
app.get('/rh/conge', (c) => {
  const content = `
  ${pageHeader('fas fa-umbrella-beach','#14b8a6,#0d9488','Demande de Congé / Absence','RH · Workflow validation · Alerte BDT affectés · Synchro planning',['RH','Planning'])}
  <div style="padding:22px 30px;">
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:.82rem;color:#b45309;">
      <i class="fas fa-exclamation-triangle mr-2"></i>
      <strong>Important :</strong> Si des BDT sont affectés pendant la période d'absence, une notification de réaffectation sera automatiquement envoyée à Sylvie.
      Le planning Gantt sera mis à jour en temps réel.
    </div>
    ${formCard(`
      ${sectionTitle('Demandeur')}
      ${fieldRow(`${field('Employé','select','Antoine D. / Karim B. / Isabelle R. / Marc T. / Sophie L. / Julien M. / Nadia K. / Frédéric G.')} ${field('Type d\'absence','select','Congés payés / RTT / Congé sans solde / Événement familial / Maladie / Formation / Autre')}`)}
      ${sectionTitle('Période')}
      ${fieldRow(`${field('Date début','date','')} ${field('Date fin','date','')}`)}
      ${fieldRow(`${field('Demi-journée','select','Non / Matin uniquement / Après-midi uniquement',false)} ${field('Shift concerné','select','Matin 6h-14h / Après-midi 14h-22h / Nuit 22h-6h / Journée 7h-17h')}`)}
      ${field('Motif / Commentaire','textarea','Précision sur le type d\'absence, demande spéciale…',false,2)}
      ${sectionTitle('Validation RH')}
      ${fieldRow(`${field('Responsable validation','select','RH / Responsable direct / Sylvie (production)')} ${field('Solde congés restants (auto)','text','Auto-calculé',false)}`)}
      ${afterBox(
        ['Mail auto → Responsable (demande validation)','Mail auto → Sylvie (alerte si BDT affectés)','Mail auto → Employé (accusé de réception)'],
        ['Absence enregistrée planning Horaires RH','Calendrier partagé mis à jour'],
        ['Planning Gantt synchronisé','Sylvie alertée pour réaffectation BDT si nécessaire','Variables paie transmises Silae']
      )}
      ${submitBtn('Soumettre la demande','#14b8a6')}
    `)}
  </div>`
  return c.html(layout('Demande de Congé', content, 'conge'))
})

app.get('/rh/pointage', (c) => {
  const content = `
  ${pageHeader('fas fa-clock','#0d9488,#0f766e','Pointage / Temps de Présence','RH · Semaine courante · Heures supp · Export Silae',['RH','Pointage'])}
  <div style="padding:22px 30px;">
    ${formCard(`
      ${sectionTitle('Employé & Semaine')}
      ${fieldRow(`${field('Employé','select','Antoine D. / Karim B. / Isabelle R. / Marc T. / Sophie L. / Julien M. / Nadia K. / Frédéric G.')} ${field('Semaine','text','N° semaine – Ex: S11 2026')}`)}
      ${sectionTitle('Pointage journalier')}
      ${['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].map(j=>`
      <div style="display:grid;grid-template-columns:100px 1fr 1fr 1fr 1fr;gap:8px;align-items:center;margin-bottom:8px;">
        <div style="font-size:.78rem;font-weight:700;color:#374151;">${j}</div>
        <input type="time" placeholder="Entrée" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.35rem .6rem;font-size:.8rem;outline:none;background:#f8fafc;"/>
        <input type="time" placeholder="Sortie" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.35rem .6rem;font-size:.8rem;outline:none;background:#f8fafc;"/>
        <select style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.35rem .6rem;font-size:.78rem;outline:none;background:#f8fafc;color:#374151;">
          <option>Présent</option><option>Congé</option><option>RTT</option><option>Maladie</option><option>Formation</option>
        </select>
        <input type="text" placeholder="N° OF/BDT" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.35rem .6rem;font-size:.78rem;outline:none;background:#f8fafc;"/>
      </div>`).join('')}
      ${sectionTitle('Récapitulatif')}
      ${fieldRow(`${field('Total heures normales','number','0',false)} ${field('Heures supplémentaires','number','0',false)}`)}
      ${field('Commentaires','textarea','Aléas, corrections, motifs absences partielles…',false,2)}
      ${afterBox(
        ['Mail auto → RH (pointages de la semaine)','Mail auto → Responsable (validation)'],
        ['Feuille pointage archivée GED','Rapport heures généré'],
        ['Variables paie transmises Silae','Alertes anomalies pointage']
      )}
      ${submitBtn('Soumettre les pointages','#0d9488')}
    `)}
  </div>`
  return c.html(layout('Pointage Personnel', content, 'pointage'))
})

// ══════════════════════════════════════════════════════════════
// DIRECTION
// ══════════════════════════════════════════════════════════════
app.get('/direction/service', async (c) => {
  const [factures, conges, salaries, validations, cmds, stock, ncs, verifs, epiDot, conf, certs, incidents, facturesFourn, atexZones, mesuresEnvD] = await Promise.all([
    getFacturesClient().catch(() => []), getConges().catch(() => []), getSalaries().catch(() => []),
    getValidations().catch(() => []), getCommandes().catch(() => []), getStockReel().catch(() => []),
    getNCs().catch(() => []), getHseVerifications().catch(() => []), getHseEpiDotations().catch(() => []),
    getHseConformite().catch(() => []), getCertifications().catch(() => []), getHseIncidents().catch(() => []),
    getFacturesFournisseur().catch(() => []), getHseAtexZones().catch(() => []), getHseMesuresEnv().catch(() => []),
  ])
  const A = (x: any) => (Array.isArray(x) ? x : [])
  const salById: Record<string, any> = {}
  ;A(salaries).forEach((s: any) => { salById[String(s.id)] = s })
  const facturesValidation = A(factures).filter((f: any) => f.validation_hierarchique && f.validation_statut === 'en_attente')
  const congesSupport = A(conges).filter((cg: any) => cg.statut === 'demande' && salById[String(cg.salarie_id)]?.est_operateur !== true)
  const validationsAttente = A(validations).filter((v: any) => (v.statut || 'en_attente') === 'en_attente')
  // Décidées (validées / refusées) → onglet « Traités » (historique classable par catégorie).
  const validationsDecidees = A(validations).filter((v: any) => ['valide', 'refuse'].includes(v.statut))
  // Jalons critiques marqués « traité » (traçabilité, statut='traite') → historique dans l'onglet Jalons.
  const jalonsTraites = A(validations).filter((v: any) => v.statut === 'traite')

  // ── Jalons critiques (données réelles) ──
  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7), year = today.slice(0, 4)
  const d10 = (x: any) => String(x || '').slice(0, 10)
  const num = (x: any) => Number(x) || 0
  const cmdClos = (s: any) => /livr|clos|termin|sold|annul/i.test(String(s || ''))
  const retardsCommandes = A(cmds).filter((c2: any) => c2.date_liv && d10(c2.date_liv) < today && !cmdClos(c2.statut))
  const stocksCritiques = A(stock).filter((s: any) => num(s.stock_actuel) <= num(s.point_commande || s.stock_mini))
  const commandesPilotage = A(cmds).map((c2: any) => ({ id: c2.id, num: c2.num_affaire || c2.id, client: c2.client_nom, montant: num(c2.montant), marge: c2.marge_reelle != null ? num(c2.marge_reelle) : null, bdtTotal: num(c2.bdt_total), bdtSoldes: num(c2.bdt_soldes), dateLiv: c2.date_liv, statut: c2.statut, retard: !!(c2.date_liv && d10(c2.date_liv) < today && !cmdClos(c2.statut)), clos: cmdClos(c2.statut) }))
  const facturesImpayees = A(factures).filter((f: any) => !f.date_paiement && f.statut !== 'payee' && f.statut !== 'brouillon' && f.date_echeance && d10(f.date_echeance) < today)
  const ncOuverte = (s: any) => !/clotur|cloturé|ferm|clos|résolu|resolu|traité|traite/i.test(String(s || ''))
  const ncCritiques = A(ncs).filter((n: any) => ['Critique', 'Bloquante'].includes(n.gravite) && ncOuverte(n.statut))
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const echeancesSecu = [
    ...A(verifs).filter((v: any) => v.date_prochaine && d10(v.date_prochaine) < today).map((v: any) => ({ type: 'VGP', objet: `${String(v.type || '').replace(/_/g, ' ')} — ${v.equipement || ''}`, date: v.date_prochaine })),
    ...A(epiDot).filter((e: any) => e.date_peremption && d10(e.date_peremption) <= soon).map((e: any) => ({ type: 'EPI', objet: `${e.epi_nom || ''} — ${e.salarie_nom || ''}`, date: e.date_peremption })),
    ...A(conf).filter((x: any) => x.statut === 'non_conforme' || (x.date_echeance && d10(x.date_echeance) < today)).map((x: any) => ({ type: 'Conformité', objet: x.obligation || '', date: x.date_echeance })),
    ...A(certs).filter((x: any) => (x.date_expiration && d10(x.date_expiration) < today) || ['expire', 'a_renouveler'].includes(x.statut)).map((x: any) => ({ type: 'Habilitation', objet: `${x.intitule || ''} — ${x.employe_nom || ''}`, date: x.date_expiration })),
    ...A(atexZones).filter((z: any) => z.date_revue && d10(z.date_revue) < today).map((z: any) => ({ type: 'ATEX', objet: `Revue zone ATEX — ${z.nom || z.localisation || ''}`, date: z.date_revue })),
    ...A(mesuresEnvD).filter((m: any) => m.conforme === false).map((m: any) => ({ type: 'Rejet hors VLE', objet: `${String(m.parametre || m.type || '').replace(/_/g, ' ')} — ${m.point_mesure || ''}`, date: m.date_mesure })),
  ]
  // ── KPIs pilotage ──
  const facfact = A(factures).filter((f: any) => f.statut !== 'brouillon')
  const caMonth = facfact.filter((f: any) => String(f.date_facture || '').slice(0, 7) === month).reduce((s: number, f: any) => s + num(f.montant_ttc), 0)
  const caYear = facfact.filter((f: any) => String(f.date_facture || '').slice(0, 4) === year).reduce((s: number, f: any) => s + num(f.montant_ttc), 0)
  const encours = facfact.filter((f: any) => !f.date_paiement && f.statut !== 'payee').reduce((s: number, f: any) => s + num(f.montant_ttc), 0)
  const cmdEchues = A(cmds).filter((c2: any) => c2.date_liv && d10(c2.date_liv) < today)
  const otd = cmdEchues.length ? Math.round((cmdEchues.length - retardsCommandes.length) / cmdEchues.length * 100) : null
  const carnet = A(cmds).filter((c2: any) => !cmdClos(c2.statut)).reduce((s: number, c2: any) => s + num(c2.montant), 0)
  const accidentsYTD = A(incidents).filter((i: any) => i.type === 'accident_travail' && String(i.date_incident || '').slice(0, 4) === year).length
  const effectif = A(salaries).filter((s: any) => s.actif !== false).length
  const kpis = {
    caMonth, caYear, encours, otd, carnet, accidentsYTD, effectif,
    montantImpaye: facturesImpayees.reduce((s: number, f: any) => s + num(f.montant_ttc), 0),
    nbImpayes: facturesImpayees.length, ncCritiques: ncCritiques.length,
    stocksCritiques: stocksCritiques.length, echeancesSecu: echeancesSecu.length,
    nbAValider: validationsAttente.length + facturesValidation.length + congesSupport.length,
  }
  // ── Budget / P&L réel (depuis la compta) ──
  const caHTyear = facfact.filter((f: any) => String(f.date_facture || '').slice(0, 4) === year).reduce((s: number, f: any) => s + num(f.montant_ht), 0)
  const achatsHTyear = A(facturesFourn).filter((f: any) => String(f.date_facture || '').slice(0, 4) === year).reduce((s: number, f: any) => s + num(f.montant_ht), 0)
  const repartCA: Record<string, number> = {}
  A(cmds).forEach((c2: any) => { const a = c2.activite || 'Autre'; repartCA[a] = (repartCA[a] || 0) + num(c2.montant) })
  const budget = { caHT: caHTyear, achatsHT: achatsHTyear, marge: caHTyear - achatsHTyear, repartCA, annee: year }
  // ── Santé des données (DICT) : recalcul live ──
  const [epiCat, chim, peris, fournisseurs] = await Promise.all([
    getHseEpiCatalogue().catch(() => []), getHseChimiques().catch(() => []),
    getProduitsPerissables().catch(() => []), getFournisseurs().catch(() => []),
  ])
  const santeDonnees = computeDataHealth({
    today, dotations: epiDot, epiCat, peris, chim, fournisseurs,
    salaries, incidents, certs, ncs, conf, validations,
  })
  return c.html(pageServiceDirection({
    validations: validationsAttente, validationsDecidees, jalonsTraites, facturesValidation, congesSupport,
    retardsCommandes, stocksCritiques, facturesImpayees, ncCritiques, echeancesSecu, commandesPilotage, kpis, budget,
    santeDonnees,
  }))
})

// ─── API : moteur d'alertes pilotage → file de validation ───
// Détecte retards commandes / impayés / NC critiques / stocks critiques / marge faible
// et les matérialise comme entrées `validations` (dédup par ref_table|ref_id en attente).
app.post('/api/direction/scan-alertes', async (c) => {
  const [cmds, factures, ncs, stock, validations] = await Promise.all([
    getCommandes().catch(() => [] as any[]), getFacturesClient().catch(() => [] as any[]),
    getNCs().catch(() => [] as any[]), getStockReel().catch(() => [] as any[]), getValidations().catch(() => [] as any[]),
  ])
  const today = new Date().toISOString().slice(0, 10)
  const d10x = (x: any) => String(x || '').slice(0, 10)
  const numx = (x: any) => Number(x) || 0
  const joursDe = (x: any) => Math.round((Date.parse(today) - Date.parse(d10x(x))) / 86400000)
  const cmdClos = (s: any) => /livr|clos|termin|sold|annul/i.test(String(s || ''))
  const ncOuv = (s: any) => !/clotur|cloturé|ferm|clos|résolu|resolu|trait/i.test(String(s || ''))
  // Clé d'alerte = type|table|id (le TYPE distingue deux alertes sur le MÊME objet — p.ex. retard vs marge
  //   sur une commande — ce qui permet un ref_id RÉEL, consultable via /api/direction/source).
  // Dédup sur TOUS les statuts (pas seulement en_attente) : une alerte déjà traitée/validée/refusée ne
  //   doit PAS réapparaître à chaque scan (avant : seul en_attente dédupait → les jalons traités revenaient).
  const vkey = (t: any, ri: any, ty: any) => String(t || '') + '|' + String(ri || '') + '|' + String(ty || '')
  const openKeys = new Set((validations as any[]).map((v: any) => vkey(v.ref_table, v.ref_id, v.type)))
  const alerts: any[] = []
  for (const cm of (cmds as any[])) {
    if (cm.date_liv && d10x(cm.date_liv) < today && !cmdClos(cm.statut)) {
      alerts.push({ domaine: 'commercial', type: 'retard_commande', objet: `Commande ${cm.num_affaire || cm.id} en retard (+${joursDe(cm.date_liv)}j) — ${cm.client_nom || ''}`, montant: numx(cm.montant), priorite: 'haute', emetteur: 'Moteur alertes', ref_table: 'commandes', ref_id: String(cm.id) })
    }
    const mt = numx(cm.montant)
    if (mt > 0 && cm.marge_reelle != null && cmdClos(cm.statut) && numx(cm.marge_reelle) / mt < 0.15) {
      alerts.push({ domaine: 'direction', type: 'marge_faible', objet: `Marge faible ${(numx(cm.marge_reelle) / mt * 100).toFixed(0)}% — ${cm.num_affaire || cm.id}`, montant: numx(cm.marge_reelle), priorite: 'moyenne', emetteur: 'Moteur alertes', ref_table: 'commandes', ref_id: String(cm.id) })
    }
  }
  for (const f of (factures as any[])) if (!f.date_paiement && f.statut !== 'payee' && f.statut !== 'brouillon' && f.date_echeance && d10x(f.date_echeance) < today) {
    alerts.push({ domaine: 'compta', type: 'impaye', objet: `Facture ${f.num_facture || f.id} impayée (+${joursDe(f.date_echeance)}j) — ${f.client_nom || ''}`, montant: numx(f.montant_ttc), priorite: 'haute', emetteur: 'Moteur alertes', ref_table: 'factures_client', ref_id: String(f.id) })
  }
  for (const n of (ncs as any[])) if (['Critique', 'Bloquante'].includes(n.gravite) && ncOuv(n.statut)) {
    alerts.push({ domaine: 'qualite', type: 'nc_critique', objet: `NC ${n.gravite} ${n.id} — ${n.lot_ref || n.type_nc || ''}`, priorite: 'haute', emetteur: 'Moteur alertes', ref_table: 'non_conformites', ref_id: String(n.id) })
  }
  // Stock : on n'alerte la Direction QUE sur les ruptures franches (0 sur un article géré) ;
  // le "sous le mini" est du réappro de routine, déjà visible côté Achats / jalons.
  for (const s of (stock as any[])) { const seuil = numx(s.point_commande || s.stock_mini); if (seuil > 0 && numx(s.stock_actuel) <= 0) {
    alerts.push({ domaine: 'achats', type: 'rupture_stock', objet: `Rupture ${s.reference || s.id} (0 / seuil ${seuil})`, priorite: 'haute', emetteur: 'Moteur alertes', ref_table: 'stock', ref_id: String(s.id) })
  } }
  let created = 0, skipped = 0
  for (const a of alerts) {
    const key = vkey(a.ref_table, a.ref_id, a.type)
    if (openKeys.has(key)) { skipped++; continue }
    const { error } = await createValidation({ ...a, statut: 'en_attente' })
    if (!error) { created++; openKeys.add(key) } else skipped++
  }
  return c.json({ ok: true, scanned: alerts.length, created, skipped })
})

// ─── API : validations (file Direction) ───
app.post('/api/validations', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.objet && !b.type) return c.json({ ok: false, error: 'objet/type requis' }, 400)
  const u = (c as any).get('user')
  const payload: any = {}
  for (const k of ['domaine', 'type', 'objet', 'montant', 'priorite', 'emetteur', 'ref_table', 'ref_id', 'payload', 'entite']) if (k in b) payload[k] = b[k] === '' ? null : b[k]
  if (!payload.emetteur && u) payload.emetteur = u.nom
  payload.statut = 'en_attente'
  const { data, error } = await createValidation(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, validation: data })
})
app.post('/api/validations/:id/decision', async (c) => {
  const u = (c as any).get('user')
  if (u && !(Array.isArray(u.perms) && u.perms.includes('all'))) return c.json({ ok: false, error: 'Décision réservée à la Direction.' }, 403)
  const b = await c.req.json().catch(() => ({} as any))
  const statut = b.decision === 'refuse' ? 'refuse' : 'valide'
  const upd: any = { statut, commentaire: b.commentaire || null, decided_at: new Date().toISOString(), decided_by: (u && u.nom) || b.valide_par || 'Direction' }
  // Refus : mode = 'annulation' (annulation totale) ou 'revision' (renvoi en révision, défaut).
  // Stocké dans payload jsonb → pas de migration ; lu par valDirBadge/panelTraites (refusMode()).
  if (statut === 'refuse') upd.payload = { refus_mode: b.refus_mode === 'annulation' ? 'annulation' : 'revision' }
  const { data, error } = await decideValidation(c.req.param('id'), upd)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  // Hook : une décision Direction sur une « sortie de quarantaine » répercute le statut.
  // Validation → libéré ; refus « annulation » → rejeté ; refus « révision » → retour en_cours (re-statuable).
  if (data && (data as any).ref_table === 'quarantaines' && (data as any).ref_id) {
    const le = String(upd.decided_at || '').slice(0, 10)
    const rm = statut === 'refuse' ? ((upd.payload && (upd.payload as any).refus_mode) || 'revision') : null
    const upd2: any = statut === 'valide'
      ? { statut: 'libere', libere_par: upd.decided_by, libere_le: le }
      : (rm === 'annulation' ? { statut: 'rejete', libere_par: upd.decided_by, libere_le: le } : { statut: 'en_cours' })
    await updateQuarantaine(String((data as any).ref_id), upd2).catch(() => {})
  }
  return c.json({ ok: true, validation: data })
})

// ─── Traçabilité des jalons critiques : marquer « traité » (statut='traite' dans validations, sans migration) ───
// Idempotent sur (ref_table, ref_id) : re-traiter le même jalon met à jour la note/horodatage au lieu de dupliquer.
app.post('/api/direction/jalon-traite', async (c) => {
  const u = (c as any).get('user')
  if (u && !(Array.isArray(u.perms) && u.perms.includes('all'))) return c.json({ ok: false, error: 'Action réservée à la Direction.' }, 403)
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.objet && !b.type) return c.json({ ok: false, error: 'objet/type requis' }, 400)
  const now = new Date().toISOString()
  const who = (u && u.nom) || b.decided_by || 'Direction'
  const refTable = b.ref_table ? String(b.ref_table) : null
  const refId = (b.ref_id != null && b.ref_id !== '') ? String(b.ref_id) : null
  // Idempotence + ABSORPTION : si une validation existe déjà pour ce (ref_table, ref_id) — qu'elle soit
  //   déjà « traite » OU encore « en_attente » (typiquement l'alerte créée par le scan) — on la met à jour
  //   et on la bascule en « traite » au lieu de créer un doublon. Avant : un jalon marqué traité laissait
  //   l'alerte en_attente du scan traîner indéfiniment dans la file. On préserve son `type` d'origine pour
  //   que les prochains scans (dédup type|table|id, tous statuts) ne la ressuscitent pas.
  const existing = (refTable && refId)
    ? (await getValidations().catch(() => [] as any[])).find((v: any) => (v.statut === 'traite' || v.statut === 'en_attente') && String(v.ref_table) === refTable && String(v.ref_id) === refId)
    : null
  if (existing) {
    const { data, error } = await decideValidation(existing.id, { statut: 'traite', commentaire: b.commentaire || null, decided_at: now, decided_by: who, objet: b.objet || existing.objet })
    if (error) return c.json({ ok: false, error: error.message }, 400)
    return c.json({ ok: true, validation: data, updated: true })
  }
  const { data, error } = await createValidation({
    domaine: b.domaine || null, type: b.type || 'jalon', objet: b.objet || null,
    ref_table: refTable, ref_id: refId, priorite: 'critique', emetteur: 'Jalons critiques',
    statut: 'traite', decided_by: who, decided_at: now, commentaire: b.commentaire || null,
  })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, validation: data })
})

// ─── Consultation générique d'un objet source (table + id) depuis le cockpit Direction (whitelist de tables) ───
const DIR_SRC_TABLES = new Set(['commandes', 'factures_client', 'factures_fournisseur', 'non_conformites', 'stock', 'credits', 'salaries', 'bons_de_commande', 'demandes_achat', 'offres', 'lots', 'bons_de_travail', 'demandes_travaux'])
app.get('/api/direction/source', async (c) => {
  const table = String(c.req.query('table') || '')
  const id = String(c.req.query('id') || '')
  if (!DIR_SRC_TABLES.has(table)) return c.json({ ok: false, error: 'Table non consultable.' }, 400)
  if (!id) return c.json({ ok: false, error: 'id requis' }, 400)
  const { data, error } = await getSourceRow(table, id)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, table, id, row: data })
})

app.get('/direction/validation', (c) => {
  const content = `
  ${pageHeader('fas fa-crown','#f59e0b,#d97706','Direction – Validation des Jalons Critiques','Décisions stratégiques · Investissements · Risques · Audits EN9100',['Direction','ISO 5.1','EN9100'])}
  <div style="padding:22px 30px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:.82rem;color:#b45309;">
      <i class="fas fa-info-circle mr-2"></i>
      Ce formulaire est pré-rempli automatiquement par Power Automate lors d'un jalon critique nécessitant une validation Direction.
    </div>
    ${formCard(`
      ${sectionTitle('Notification reçue')}
      ${fieldRow(`${field('Type de jalon','select','Commande > seuil montant / Achat stratégique / Incident majeur / Audit qualité / Recrutement / Investissement / Sortie salarié / Non-conformité critique')} ${field('N° dossier concerné','text','Ref. ERP auto-injectée')}`)}
      ${fieldRow(`${field('Service émetteur','select','Commercial / Achats / Production / Qualité / RH / Comptabilité / Maintenance')} ${field('Date notification','datetime-local','')}`)}
      ${fieldRow(`${field('Montant / Impact (€)','number','0',false)} ${field('Niveau d\'urgence','select','Pour information / Validation requise sous 24h / Urgent – réponse immédiate')}`)}
      ${field('Résumé du dossier / contexte','textarea','Éléments clés, enjeux, recommandation du service émetteur…',true,2)}
      ${sectionTitle('Décision Direction')}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
        ${[
          {ico:'fa-check-circle',lbl:'Validé',col:'#22c55e',bg:'#f0fdf4',border:'#bbf7d0',desc:'Approuvé sans réserve'},
          {ico:'fa-exclamation-circle',lbl:'Validé avec réserves',col:'#f59e0b',bg:'#fffbeb',border:'#fde68a',desc:'Conditions à respecter'},
          {ico:'fa-times-circle',lbl:'Refusé',col:'#ef4444',bg:'#fef2f2',border:'#fecaca',desc:'Non approuvé'},
        ].map(o=>`
        <label style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:12px;border:2px solid ${o.border};background:${o.bg};cursor:pointer;text-align:center;transition:all .2s;">
          <input type="radio" name="decision" value="${o.lbl}" style="accent-color:${o.col};"/>
          <i class="fas ${o.ico}" style="color:${o.col};font-size:1.5rem;"></i>
          <div style="font-weight:700;color:${o.col};font-size:.8rem;">${o.lbl}</div>
          <div style="font-size:.68rem;color:#6b7280;">${o.desc}</div>
        </label>`).join('')}
      </div>
      ${field('Commentaire Direction / conditions','textarea','Précisions, conditions, instructions particulières, délais imposés…',false,2)}
      ${fieldRow(`${field('Validé par','select','Direction Générale / Directeur Financier / DRH')} ${field('Date & heure signature','datetime-local','')}`)}
      ${afterBox(
        ['Mail auto → Service émetteur (décision Direction)','Mail auto → Tous acteurs concernés'],
        ['Décision archivée GED Direction','Journal des décisions mis à jour'],
        ['Workflow suivant déclenché automatiquement','Dashboard KPI Direction mis à jour']
      )}
      ${submitBtn('Enregistrer la décision Direction','#f59e0b')}
    `)}
  </div>`
  return c.html(layout('Direction – Jalons', content, 'dir'))
})

// ══════════════════════════════════════════════════════════════
// DASHBOARDS
// ══════════════════════════════════════════════════════════════
app.get('/dashboard',               async (c) => c.html(dashHub(await getDashboardData(['stock', 'mtbf', 'machinesOpex', 'fournisseurs', 'sousTraitants']))))
app.get('/dashboard/commercial',    async (c) => c.html(dashCommercial(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/be',            async (c) => c.html(dashBE(await getDashboardData(['nomenclatures', 'fournitures']), parseFilter(c))))
app.get('/dashboard/achats',        async (c) => c.html(dashAchats(await getDashboardData(['fournisseurs', 'sousTraitants']), parseFilter(c))))
app.get('/dashboard/programmation', async (c) => c.html(dashProgrammation(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/production',    async (c) => c.html(dashProduction(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/qualite',       async (c) => c.html(dashQualite(await getDashboardData(['controlesCotes', 'quarantaines']), parseFilter(c))))
app.get('/dashboard/expedition',    async (c) => c.html(dashExpedition(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/maintenance',   async (c) => c.html(dashMaintenance(await getDashboardData(['mtbf', 'machinesOpex']), parseFilter(c))))
app.get('/maintenance/mtbf',        (c) => c.redirect('/dashboard/maintenance', 301))
app.get('/dashboard/rh',            async (c) => c.html(dashRH(await getDashboardData(['pointages']), parseFilter(c))))
app.get('/dashboard/direction',     async (c) => c.html(dashDirection(await getDashboardData(['stock', 'mouvementsStock', 'mtbf', 'controlesCotes', 'machinesOpex']), parseFilter(c))))
app.get('/dashboard/oas',           async (c) => c.html(dashOAS(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/environnement', async (c) => c.html(dashEnvironnement(await getDashboardData(['dechetsEnv', 'mesuresEnv', 'aspectsEnv', 'conformiteEnv', 'atexEnv', 'rseEnv', 'chimiques']), parseFilter(c))))
app.get('/dashboard/finance',       async (c) => c.html(dashFinance(await getDashboardData(), parseFilter(c))))
app.get('/dashboard/stock',         async (c) => c.html(dashStock(await getDashboardData(['stock', 'mouvementsStock']), parseFilter(c))))
app.get('/dashboard/fournisseurs',  async (c) => c.html(dashFournisseurs(await getDashboardData(['fournisseurs', 'sousTraitants']), parseFilter(c))))

// ─── Réglage des objectifs / cibles KPI (table kpi_objectifs) ──
app.get('/reglages/objectifs', async (c) => {
  const rows = await getKpiObjectifs().catch(() => [] as any[])
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const row = (o: any, isNew = false) => `
  <tr style="border-bottom:1px solid #f1f5f9;" data-id="${esc(o.id || '')}">
    <td style="padding:6px;"><input name="code" value="${esc(o.code || '')}" ${isNew ? '' : 'readonly'} placeholder="code" style="width:130px;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;background:${isNew ? 'white' : '#f8fafc'};"/></td>
    <td style="padding:6px;"><input name="libelle" value="${esc(o.libelle || '')}" placeholder="Libellé" style="width:200px;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"/></td>
    <td style="padding:6px;"><input name="cible" type="number" step="any" value="${o.cible ?? ''}" style="width:80px;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"/></td>
    <td style="padding:6px;"><input name="unite" value="${esc(o.unite || '%')}" style="width:60px;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"/></td>
    <td style="padding:6px;"><select name="sens" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"><option value="haut" ${o.sens !== 'bas' ? 'selected' : ''}>haut = mieux</option><option value="bas" ${o.sens === 'bas' ? 'selected' : ''}>bas = mieux</option></select></td>
    <td style="padding:6px;"><input name="seuil_alerte" type="number" step="any" value="${o.seuil_alerte ?? ''}" style="width:80px;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"/></td>
    <td style="padding:6px;"><select name="entite" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.8rem;"><option value="global" ${(!o.entite || o.entite === 'global') ? 'selected' : ''}>global</option><option value="Seem" ${o.entite === 'Seem' ? 'selected' : ''}>Seem</option><option value="Semrac" ${o.entite === 'Semrac' ? 'selected' : ''}>Semrac</option></select></td>
    <td style="padding:6px;white-space:nowrap;">
      <button onclick="saveObj(this)" class="btn btn-primary" style="padding:.35rem .8rem;font-size:.78rem;">Enregistrer</button>
      ${isNew ? '' : `<button onclick="delObj(this)" class="btn btn-secondary" style="padding:.35rem .7rem;font-size:.78rem;">✕</button>`}
    </td>
  </tr>`
  const content = `
  ${pageHeader('fas fa-sliders-h', '#6366f1,#4338ca', 'Objectifs / Cibles KPI', 'Définissez les cibles utilisées par tous les dashboards (OTD, marge, DSO, disponibilité…)', ['Réglages', 'Direction'])}
  <div style="padding:22px 30px;">
    <div class="card" style="padding:20px;overflow-x:auto;">
      <div style="font-size:.72rem;color:#64748b;margin-bottom:12px;">Si la table <code>kpi_objectifs</code> est vide, les dashboards utilisent des valeurs par défaut codées. <strong>sens « bas »</strong> = on veut rester sous la cible (DSO, NC, absentéisme).</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid #f1f5f9;text-align:left;">${['Code', 'Libellé', 'Cible', 'Unité', 'Sens', 'Seuil alerte', 'Entité', ''].map(h => `<th style="padding:6px;font-size:.66rem;color:#6b7280;font-weight:700;">${h}</th>`).join('')}</tr></thead>
        <tbody id="objRows">
          ${rows.length ? rows.map((o: any) => row(o)).join('') : ''}
          ${row({ unite: '%', sens: 'haut', entite: 'global' }, true)}
        </tbody>
      </table>
    </div>
  </div>
  <script>
    async function saveObj(btn){
      const tr = btn.closest('tr'); const get = n => tr.querySelector('[name="'+n+'"]').value;
      const body = { code:get('code').trim(), libelle:get('libelle'), cible:parseFloat(get('cible'))||0, unite:get('unite'), sens:get('sens'), seuil_alerte:parseFloat(get('seuil_alerte'))||0, entite:get('entite') };
      if(!body.code){ alert('Code requis'); return; }
      btn.textContent='…';
      const r = await fetch('/api/kpi-objectifs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j = await r.json().catch(()=>({ok:false}));
      btn.textContent = j.ok ? '✓ OK' : 'Erreur'; if(j.ok && j.objectif && j.objectif.id) tr.dataset.id = j.objectif.id;
      setTimeout(()=>btn.textContent='Enregistrer',1400);
    }
    async function delObj(btn){
      const tr = btn.closest('tr'); const id = tr.dataset.id; if(!id){ tr.remove(); return; }
      if(!await appConfirm('Supprimer cette cible ?')) return;
      const r = await fetch('/api/kpi-objectifs/'+id,{method:'DELETE'}); const j = await r.json().catch(()=>({ok:false}));
      if(j.ok) tr.remove();
    }
  </script>`
  return c.html(layout('Objectifs KPI', content, 'service-direction'))
})

app.post('/api/kpi-objectifs', async (c) => {
  const u = (c as any).get('user')
  if (u && !(Array.isArray(u.perms) && u.perms.includes('all'))) return c.json({ ok: false, error: 'Réservé à la Direction.' }, 403)
  const b = await c.req.json().catch(() => ({} as any))
  if (!b.code) return c.json({ ok: false, error: 'code requis' }, 400)
  const payload: any = { code: String(b.code).trim(), entite: b.entite || 'global' }
  for (const k of ['libelle', 'cible', 'unite', 'sens', 'seuil_alerte']) if (k in b) payload[k] = b[k] === '' ? null : b[k]
  const { data, error } = await upsertKpiObjectif(payload)
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, objectif: data })
})

app.delete('/api/kpi-objectifs/:id', async (c) => {
  const u = (c as any).get('user')
  if (u && !(Array.isArray(u.perms) && u.perms.includes('all'))) return c.json({ ok: false, error: 'Réservé à la Direction.' }, 403)
  const { error } = await deleteKpiObjectif(c.req.param('id'))
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true })
})

// ══════════════════════════════════════════════════════════════
// LISTES DE DEMANDES PAR SERVICE
// ══════════════════════════════════════════════════════════════
app.get('/commercial/dt-liste',      async (c) => { const dts = await getDemandesTravaux(); return c.html(pageDTListe(dts)) })
app.get('/commercial/offres-liste',  async (c) => { const offres = await getOffres(); return c.html(pageOffresListe(offres)) })
app.get('/commercial/cmd-liste',     async (c) => { const cmds = await getCommandes(); return c.html(pageCmdListe(cmds)) })
app.get('/achats/da-liste',          async (c) => { const das = await getDemandesAchat(); return c.html(pageDAListe((das as any[]).filter(d => !daMasquee(d)) as any)) })
app.get('/qualite/nc-liste',         async (c) => { const ncs = await getNonConformites(); return c.html(pageNCListe(ncs)) })
app.get('/expedition/bl-liste',      async (c) => { const bls = await getBonsDeLivraison(); return c.html(pageBLListe(bls)) })
app.get('/production/bdt-liste',     async (c) => { const bdts = await getBonsDeTravail(); return c.html(pageBDTListe(bdts)) })
app.get('/production/lot-liste',     async (c) => { const [lots, ops, bdts] = await Promise.all([getLots(), getOperateurs(), getBonsDeTravail()]); return c.html(pageLOTListe(lots as any, ops as any, bdts as any)) })
app.get('/maintenance/liste',        (c) => c.redirect('/maintenance/service', 301))
app.get('/rh/conge-liste',           (c) => c.redirect('/rh/service', 301))
app.get('/commercial/avoirs-liste',  async (c) => { const credits = await getCredits(); return c.html(pageAvoirsCommercial(credits)) })
app.get('/achats/fournisseurs-st',   async (c) => { const fsts = await getFournisseursSt(); return c.html(pageFournisseursST(fsts)) })
app.get('/commercial/references-pieces', (c) => c.html(pageReferencesPiecesACreer()))
app.get('/be/references-pieces',         (c) => c.html(pageReferencesPiecesACreer()))
// Marquer une préparation technique comme faite/en cours (depuis la liste)
// Valide la préparation technique d'une NOMENCLATURE : marque « faite » toutes les lignes
// de preparations_techniques portant la même référence produit. C'est l'une des deux portes
// d'entrée en production — l'autre étant la réception matière (matiere_ok).
app.post('/api/nomenclature/:id/prepa-validee', async (c) => {
  const id = c.req.param('id')
  const noms = await getNomenclatures().catch(() => [] as any[])
  const nom = (noms as any[]).find((n: any) => String(n.id) === String(id))
  if (!nom) return c.json({ ok: false, error: 'Nomenclature introuvable' }, 404)

  // Une prépa ne se valide pas à vide : sans plan ni programme, la production n'a rien à exécuter.
  const aPlan = !!String(nom.num_plan || nom.plan_fichier || '').trim()
  const etapes = Array.isArray(nom.etapes_production) ? nom.etapes_production : []
  const machines = await getMachines().catch(() => [] as any[])
  const cnc = new Set((machines as any[]).filter((m: any) => m.cnc).map((m: any) => String(m.id)))
  const etapesCnc = etapes.filter((e: any) => e && e.machine_id && cnc.has(String(e.machine_id)))
  const cncSansCode = etapesCnc.filter((e: any) => !String(e.programme || e.programme_fichier || '').trim())
  if (!aPlan) return c.json({ ok: false, error: 'Plan manquant : renseignez le n° de plan ou joignez le fichier avant de valider.' }, 409)
  if (cncSansCode.length) return c.json({ ok: false, error: cncSansCode.length + ' étape(s) CNC sans code programme : complétez-les avant de valider.' }, 409)

  const ref = String(nom.code_ref_produit || nom.num_nom || '').toLowerCase().trim()
  const preps = await getPreparationsTechniques().catch(() => [] as any[])
  const cibles = (preps as any[]).filter((p: any) =>
    String(p.statut || '') !== 'faite' &&
    [String(p.code_ref_produit || '').toLowerCase().trim(), String(p.piece || '').toLowerCase().trim()].includes(ref))
  let n = 0
  const affaires: string[] = []
  const echecs: string[] = []
  for (const pr of cibles) {
    const { error } = await updatePreparationTechnique(String(pr.id), { statut: 'faite', updated_at: new Date().toISOString() } as any)
    // ⚠ Un echec d'ecriture etait purement ignore : il ressortait en « 0 ligne validee »,
    //   indiscernable d'un « rien a valider ». On le remonte maintenant.
    if (error) echecs.push(String(pr.id) + ' (' + error.message + ')')
    else { n++; if (pr.num_affaire) affaires.push(String(pr.num_affaire)) }
  }
  if (echecs.length) {
    return c.json({ ok: false, validees: n, echecs, error: echecs.length + ' preparation(s) n\'ont pas pu etre validees : ' + echecs.join(' ; ') }, 400)
  }
  return c.json({
    ok: true, validees: n, affaires: [...new Set(affaires)],
    reference: nom.code_ref_produit || nom.num_nom,
    // `candidates` dit combien de lignes portaient cette reference, toutes statuts confondus :
    // 0 candidate = la reference ne correspond a AUCUNE preparation (probleme d'appariement),
    // ce qui n'est pas la meme chose que « tout etait deja fait ».
    candidates: (preps as any[]).filter((p: any) =>
      [String(p.code_ref_produit || '').toLowerCase().trim(), String(p.piece || '').toLowerCase().trim()].includes(ref)).length,
  })
})

app.post('/api/prepa-technique/:id/statut', async (c) => {
  const b = await c.req.json().catch(() => ({} as any))
  // ⚠ La liste blanche renvoyait TOUT le reste sur « faite » : envoyer « annulee »
  //   marquait la preparation FAITE, en silence — et ouvrait la porte de production.
  //   L'annulation est desormais une valeur a part entiere.
  const st = ['a_faire', 'en_cours', 'faite', STATUT_ANNULE.preparations_techniques].includes(b.statut)
    ? b.statut : 'faite'
  const { data, error } = await updatePreparationTechnique(c.req.param('id'), { statut: st })
  if (error) return c.json({ ok: false, error: error.message }, 400)
  return c.json({ ok: true, prepa: data })
})
app.get('/production/bdts-a-programmer', (c) => c.redirect('/production/service', 301))

// ══════════════════════════════════════════════════════════════
// EXPÉDITION – ENVOI CLIENT
// ══════════════════════════════════════════════════════════════
app.get('/expedition/envoi-client', (c) => {
  const CMDS_A_EXPEDIER = [
    { id:'CMD-2026-1281', client:'Schneider Electric', piece:'DISSIP-E11', montant:4200, dateLiv:'2026-03-30', qte:250 },
  ]
  const content = `
  <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-truck" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Envoi Commande Client</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">Expédition · Commandes 100% fabriquées · Bon de livraison · Transport</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:20px;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">Commandes prêtes à expédier (fabrication 100% terminée)</div>
      ${CMDS_A_EXPEDIER.map(cmd=>`
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <span style="font-weight:700;color:#374151;font-size:.95rem;">${cmd.id} – ${cmd.client}</span>
          <span style="padding:3px 12px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:.72rem;font-weight:700;">À expédier</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;font-size:.8rem;">
          <div><span style="color:#6b7280;">Pièce :</span> ${cmd.piece}</div>
          <div><span style="color:#6b7280;">Qté :</span> ${cmd.qte} pcs</div>
          <div><span style="color:#6b7280;">Montant :</span> ${cmd.montant.toLocaleString('fr-FR')} €</div>
          <div><span style="color:#6b7280;">Livraison souhaitée :</span> ${cmd.dateLiv}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
          <div><label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Transporteur</label><select class="form-input"><option>Chronopost</option><option>DHL</option><option>TNT</option><option>Sur place</option><option>Camion propre</option></select></div>
          <div><label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date d'enlèvement</label><input type="date" class="form-input"/></div>
          <div><label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° Suivi / Tracking</label><input type="text" class="form-input" placeholder="Ex: 1Z999AA10123456784"/></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 18px;font-size:.82rem;cursor:pointer;"><i class="fas fa-print mr-2"></i>Imprimer BL</button>
          <button onclick="if(await appConfirm('Confirmer l\\'expédition de ${cmd.id} ?')){ pushNotif('ok','fa-truck','${cmd.id} expédiée. BL créé. Finance notifiée.',6000); }" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(14,165,233,.3);"><i class="fas fa-truck mr-2"></i>Confirmer l'expédition</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`
  return c.html(layout('Envoi Commande Client', content, 'envoi-client'))
})

// ══════════════════════════════════════════════════════════════
// OAS – BALANCELLES & REJETS EAU
// ══════════════════════════════════════════════════════════════
app.get('/oas/balancelles', (c) => {
  const BALANCELLES = [
    { id:'BAL-001', dateEntree:'2026-03-12 08:30', dateSortie:'2026-03-12 10:45', lot:'LOT-1277-A', piece:'DISSIP-A24', qty:50, bain:'Principal OAS', operateur:'Lénaïck', duree:'2h15', statut:'termine' },
    { id:'BAL-002', dateEntree:'2026-03-12 10:50', dateSortie:'', lot:'LOT-1277-B', piece:'DISSIP-A24 v4', qty:50, bain:'Principal OAS', operateur:'Lénaïck', duree:'en cours', statut:'en_cours' },
    { id:'BAL-003', dateEntree:'2026-03-12 11:00', dateSortie:'', lot:'LOT-1280-A', piece:'BRIDE-F03', qty:30, bain:'Bain 2', operateur:'Lénaïck', duree:'en cours', statut:'en_cours' },
    { id:'BAL-004', dateEntree:'2026-03-11 14:00', dateSortie:'2026-03-11 16:30', lot:'LOT-1279-A', piece:'CARTER-B07', qty:80, bain:'Principal OAS', operateur:'Lénaïck', duree:'2h30', statut:'termine' },
    { id:'BAL-005', dateEntree:'2026-03-11 09:00', dateSortie:'2026-03-11 09:45', lot:'LOT-TEST-1', piece:'Essai alliage', qty:5, bain:'Bain Essai', operateur:'Pierre-Yves', duree:'45min', statut:'rejete' },
  ]
  const content = `
  <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-list-ol" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Liste des Balancelles OAS</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">Oxydation Anodique Sulfurique · Sessions en cours · Historique</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      ${[['tous','Toutes'],['en_cours','En cours'],['termine','Terminées'],['rejete','Rejetées']].map(([s,l])=>`<button onclick="filtrerBal('${s}')" data-bal="${s}" style="padding:5px 14px;border-radius:999px;background:${s==='tous'?'#ccfbf1':'#f1f5f9'};color:${s==='tous'?'#0f766e':'#6b7280'};border:1.5px solid ${s==='tous'?'#99f6e4':'#e2e8f0'};font-size:.72rem;font-weight:700;cursor:pointer;">${l}</button>`).join('')}
      <button onclick="ouvrirNouvelleBalancelle()" style="margin-left:auto;padding:7px 16px;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;border:none;border-radius:9px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus mr-2"></i>Nouvelle balancelle</button>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="balTable">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Balancelle</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Entrée</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Sortie</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">LOT · Pièce</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Qty</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Bain</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Durée</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
        </tr></thead>
        <tbody>
          ${BALANCELLES.map(b=>{
            const stBg = b.statut==='en_cours'?'#dbeafe':b.statut==='termine'?'#dcfce7':'#fee2e2'
            const stCol = b.statut==='en_cours'?'#1d4ed8':b.statut==='termine'?'#166534':'#b91c1c'
            const stLbl = b.statut==='en_cours'?'En cours':b.statut==='termine'?'Terminée ✓':'Rejetée'
            return `<tr data-bal="${b.statut}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="padding:10px 14px;font-weight:700;color:#0d9488;">${b.id}</td>
              <td style="padding:10px 14px;color:#374151;font-size:.78rem;">${b.dateEntree}</td>
              <td style="padding:10px 14px;color:${b.dateSortie?'#374151':'#9ca3af'};font-size:.78rem;">${b.dateSortie||'En cours…'}</td>
              <td style="padding:10px 14px;"><div style="font-weight:600;color:#374151;">${b.lot}</div><div style="font-size:.72rem;color:#6b7280;">${b.piece}</div></td>
              <td style="padding:10px 14px;text-align:center;font-weight:700;color:#374151;">${b.qty}</td>
              <td style="padding:10px 14px;color:#374151;font-size:.78rem;">${b.bain}</td>
              <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${b.duree}</td>
              <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${stBg};color:${stCol};">${stLbl}</span></td>
            </tr>`}).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <!-- MODAL NOUVELLE BALANCELLE -->
  <div id="modalNouvelleBalancelle" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:560px;width:90%;">
      <h3 style="font-size:1rem;font-weight:800;color:#0d9488;margin-bottom:14px;"><i class="fas fa-atom mr-2"></i>Nouvelle session balancelle</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° LOT <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="LOT-XXXX-A" id="balLot"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Pièce / Référence <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="Ex: DISSIP-A24" id="balPiece"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Quantité <span style="color:#ef4444;">*</span></label><input type="number" class="form-input" placeholder="50" id="balQty"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Bain <span style="color:#ef4444;">*</span></label><select class="form-input" id="balBain"><option>Principal OAS</option><option>Bain 2</option><option>Bain Essai</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Opérateur <span style="color:#ef4444;">*</span></label><select class="form-input" id="balOp"><option>Lénaïck</option><option>Pierre-Yves</option><option>Autre</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Heure d'entrée</label><input type="time" class="form-input" id="balHeure"/></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button onclick="fermerBalancelle()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="validerNouvelleBalancelle()" style="background:linear-gradient(135deg,#0d9488,#0f766e);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-play mr-2"></i>D\u00e9marrer la session</button>
      </div>
    </div>
  </div>
  <script>
  function filtrerBal(s){
    document.querySelectorAll('[data-bal]').forEach(function(b){ if(b.tagName==='BUTTON'){ b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.border='1.5px solid #e2e8f0'; } });
    var btn=document.querySelector('button[data-bal="'+s+'"]'); if(btn){ btn.style.background='#ccfbf1'; btn.style.color='#0f766e'; btn.style.border='1.5px solid #99f6e4'; }
    document.querySelectorAll('#balTable tbody tr').forEach(function(tr){ tr.style.display=(s==='tous'||tr.dataset.bal===s)?'':'none'; });
  }
  function ouvrirNouvelleBalancelle(){ var m=document.getElementById('modalNouvelleBalancelle'); if(m) m.style.display='flex'; }
  function fermerBalancelle(){ var m=document.getElementById('modalNouvelleBalancelle'); if(m) m.style.display='none'; }
  function validerNouvelleBalancelle(){
    var lot=document.getElementById('balLot');
    var piece=document.getElementById('balPiece');
    if(!lot||!lot.value||!piece||!piece.value){ pushNotif('err','fa-times','N\u00b0 LOT et Pi\u00e8ce obligatoires.',4000); return; }
    pushNotif('ok','fa-atom','Session balancelle d\u00e9marr\u00e9e pour '+lot.value+' – '+piece.value+'. Enregistr\u00e9e.',6000);
    fermerBalancelle();
  }
  </script>`
  return c.html(layout('Balancelles OAS', content, 'oas-bal'))
})

app.get('/oas/rejets-eau', (c) => {
  const REJETS_EAU = [
    { date:'2026-03-10', type:'Aluminium dissous', valeur:1.2, limite:3.0, conforme:true, operateur:'Pierre-Yves', obs:'' },
    { date:'2026-03-10', type:'Chrome total', valeur:0.08, limite:0.1, conforme:true, operateur:'Pierre-Yves', obs:'' },
    { date:'2026-03-10', type:'Sulfates', valeur:280, limite:400, conforme:true, operateur:'Pierre-Yves', obs:'' },
    { date:'2026-03-03', type:'Aluminium dissous', valeur:2.8, limite:3.0, conforme:true, operateur:'Pierre-Yves', obs:'Proche limite' },
    { date:'2026-03-03', type:'Chrome total', valeur:0.12, limite:0.1, conforme:false, operateur:'Pierre-Yves', obs:'DÉPASEMENT – Vidange bain immédiate' },
    { date:'2026-02-24', type:'Aluminium dissous', valeur:1.0, limite:3.0, conforme:true, operateur:'Lénaïck', obs:'' },
    { date:'2026-02-24', type:'Sulfates', valeur:310, limite:400, conforme:true, operateur:'Lénaïck', obs:'' },
    { date:'2026-02-17', type:'Aluminium dissous', valeur:0.9, limite:3.0, conforme:true, operateur:'Lénaïck', obs:'' },
  ]
  const content = `
  <div style="background:linear-gradient(135deg,#0284c7,#0369a1);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-water" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Relevés Périodiques – Rejets d'Eau OAS</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">ICPE · Conformité environnementale · Limites réglementaires · Hebdomadaire</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #22c55e;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#22c55e;">${REJETS_EAU.filter(r=>r.conforme).length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Conformes</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #ef4444;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#ef4444;">${REJETS_EAU.filter(r=>!r.conforme).length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Dépassements</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #6b7280;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#6b7280;">${REJETS_EAU.length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Total relevés</div>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;color:#374151;font-size:.88rem;"><i class="fas fa-table mr-2" style="color:#0284c7;"></i>Historique des relevés</span>
        <button onclick="ouvrirNouveauReleve()" style="padding:6px 14px;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus mr-2"></i>Nouveau relevé</button>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Date</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Paramètre</th>
          <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Valeur mesurée</th>
          <th style="text-align:right;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Limite régl.</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Conformité</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Opérateur</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Observations</th>
        </tr></thead>
        <tbody>
          ${REJETS_EAU.map(r=>`
          <tr style="border-bottom:1px solid #f9fafb;background:${r.conforme?'':'#fff5f5'};" onmouseenter="this.style.background='${r.conforme?'#f8fafc':'#fee2e2'}'" onmouseleave="this.style.background='${r.conforme?'':'#fff5f5'}'">
            <td style="padding:10px 14px;color:#374151;font-weight:600;font-size:.78rem;">${r.date}</td>
            <td style="padding:10px 14px;color:#374151;">${r.type}</td>
            <td style="padding:10px 14px;text-align:right;font-weight:700;color:${r.conforme?'#374151':'#b91c1c'};">${r.valeur} mg/L</td>
            <td style="padding:10px 14px;text-align:right;color:#6b7280;font-size:.78rem;">${r.limite} mg/L</td>
            <td style="padding:10px 14px;text-align:center;">
              <span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${r.conforme?'#dcfce7':'#fee2e2'};color:${r.conforme?'#166534':'#b91c1c'};">
                ${r.conforme?'Conforme ✓':'DÉPASSEMENT ⚠'}
              </span>
            </td>
            <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${r.operateur}</td>
            <td style="padding:10px 14px;color:${r.obs?'#b91c1c':'#9ca3af'};font-size:.75rem;">${r.obs||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL NOUVEAU RELEVÉ -->
  <div id="modalNouveauReleve" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:540px;width:90%;">
      <h3 style="font-size:1rem;font-weight:800;color:#0284c7;margin-bottom:14px;"><i class="fas fa-water mr-2"></i>Nouveau relevé rejet d'eau</h3>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:.78rem;color:#1d4ed8;">
        <i class="fas fa-info-circle mr-2"></i>Saisir les valeurs mesurées lors du contrôle hebdomadaire ICPE.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date du relevé <span style="color:#ef4444;">*</span></label><input type="date" class="form-input" id="relDate"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Opérateur <span style="color:#ef4444;">*</span></label><select class="form-input" id="relOp"><option>Pierre-Yves</option><option>Lénaïck</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Paramètre <span style="color:#ef4444;">*</span></label>
          <select class="form-input" id="relType" onchange="updateLimite(this.value)">
            <option value="Aluminium dissous">Aluminium dissous (limite: 3.0 mg/L)</option>
            <option value="Chrome total">Chrome total (limite: 0.1 mg/L)</option>
            <option value="Sulfates">Sulfates (limite: 400 mg/L)</option>
          </select>
        </div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Valeur mesurée (mg/L) <span style="color:#ef4444;">*</span></label><input type="number" step="0.01" class="form-input" id="relValeur" placeholder="Ex: 1.20" oninput="checkConformite()"/></div>
      </div>
      <div id="conformiteAlerte" style="display:none;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:.8rem;font-weight:700;"></div>
      <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Observations</label><textarea rows="2" class="form-input" id="relObs" placeholder="Commentaires, actions correctives si dépassement…"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
        <button onclick="fermerReleve()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="validerReleve()" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-save mr-2"></i>Enregistrer</button>
      </div>
    </div>
  </div>
  <script>
  var LIMITES = {'Aluminium dissous':3.0,'Chrome total':0.1,'Sulfates':400};
  function ouvrirNouveauReleve(){ var m=document.getElementById('modalNouveauReleve'); if(m) m.style.display='flex'; }
  function fermerReleve(){ var m=document.getElementById('modalNouveauReleve'); if(m) m.style.display='none'; }
  function updateLimite(type){ checkConformite(); }
  function checkConformite(){
    var type=document.getElementById('relType'); var val=document.getElementById('relValeur'); var alert=document.getElementById('conformiteAlerte');
    if(!type||!val||!alert) return;
    var limite=LIMITES[type.value]; var v=parseFloat(val.value);
    if(isNaN(v)){ alert.style.display='none'; return; }
    var ok=v<=limite;
    alert.style.display='block';
    alert.style.background=ok?'#f0fdf4':'#fef2f2';
    alert.style.color=ok?'#15803d':'#b91c1c';
    alert.style.border='1px solid '+(ok?'#bbf7d0':'#fecaca');
    alert.textContent=(ok?'\u2713 Conforme – Valeur mesur\u00e9e: '+v+' mg/L \u2264 '+limite+' mg/L':'\u26a0 D\u00c9PASSEMENT ! Valeur mesur\u00e9e: '+v+' mg/L > Limite: '+limite+' mg/L – Action corrective requise');
  }
  function validerReleve(){
    var d=document.getElementById('relDate'); var v=document.getElementById('relValeur');
    if(!d||!d.value||!v||!v.value){ pushNotif('err','fa-times','Date et valeur obligatoires.',4000); return; }
    pushNotif('ok','fa-check-circle','Relev\u00e9 enregistr\u00e9. Archiv\u00e9 en GED.',6000);
    fermerReleve();
  }
  </script>`
  return c.html(layout('Relevés Rejets Eau OAS', content, 'oas-rejets'))
})

// ══════════════════════════════════════════════════════════════
// QUALITÉ – AUDITS & PRODUITS PÉRISSABLES
// ══════════════════════════════════════════════════════════════
app.get('/qualite/audit-9001', (c) => {
  const chapitres = [
    { num:'4', titre:'Contexte de l\'organisme', items:['4.1 Compréhension de l\'organisme et de son contexte','4.2 Compréhension des besoins et attentes des parties intéressées','4.3 Détermination du domaine d\'application','4.4 Système de management de la qualité'] },
    { num:'5', titre:'Leadership', items:['5.1 Leadership et engagement','5.2 Politique qualité','5.3 Rôles, responsabilités et autorités'] },
    { num:'6', titre:'Planification', items:['6.1 Actions face aux risques et opportunités','6.2 Objectifs qualité et planification','6.3 Planification des modifications'] },
    { num:'7', titre:'Support', items:['7.1 Ressources (humaines, infrastructure, environnement)','7.2 Compétences','7.3 Sensibilisation','7.4 Communication','7.5 Informations documentées'] },
    { num:'8', titre:'Réalisation des activités opérationnelles', items:['8.1 Planification et maîtrise opérationnelles','8.2 Exigences relatives aux produits et services','8.3 Conception et développement','8.4 Maîtrise des processus, produits fournis ext.','8.5 Production et prestation de service','8.6 Libération des produits et services','8.7 Maîtrise des éléments de sortie non conformes'] },
    { num:'9', titre:'Évaluation des performances', items:['9.1 Surveillance, mesure, analyse et évaluation','9.2 Audit interne','9.3 Revue de direction'] },
    { num:'10', titre:'Amélioration', items:['10.1 Généralités','10.2 Non-conformité et action corrective','10.3 Amélioration continue'] },
  ]
  const totalItems = chapitres.reduce((a,c)=>a+c.items.length,0)
  const content = `
  <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-clipboard-check" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Checklist Audit ISO 9001:2015</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">Pierre-Yves · Chapitres 4 à 10 · Conformité · Observations · Rapport</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <span style="font-size:.82rem;color:#15803d;font-weight:600;"><i class="fas fa-chart-pie mr-2"></i>Conformité globale : <strong id="pctConformite">0%</strong> (<span id="nbConformes">0</span>/${totalItems} items)</span>
      <button onclick="genererRapportAudit()" style="padding:6px 16px;background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf mr-2"></i>Générer rapport</button>
    </div>
    ${chapitres.map(ch=>`
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);margin-bottom:14px;overflow:hidden;">
      <div onclick="toggleChap('chap${ch.num}')" style="padding:14px 20px;border-bottom:1px solid #f1f5f9;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;">
        <span style="font-weight:700;color:#374151;font-size:.88rem;"><i class="fas fa-chevron-down mr-2" style="color:#16a34a;font-size:.7rem;"></i>Chap. ${ch.num} – ${ch.titre}</span>
        <span style="font-size:.72rem;color:#6b7280;">${ch.items.length} exigences</span>
      </div>
      <div id="chap${ch.num}" style="padding:14px 20px;">
        ${ch.items.map((item,idx)=>`
        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f9fafb;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;font-size:.82rem;color:#374151;padding-top:2px;">${item}</div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            ${[['C','Conforme','#22c55e'],['NC','Non conforme','#ef4444'],['NA','N/A','#9ca3af'],['Obs','Observation','#f59e0b']].map(([v,l,col])=>`
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.72rem;font-weight:600;color:${col};">
              <input type="radio" name="audit9001-${ch.num}-${idx}" value="${v}" onchange="updateConformite()" style="accent-color:${col};"/>
              ${v}
            </label>`).join('')}
          </div>
          <div style="flex-basis:100%;"><input type="text" placeholder="Observation…" style="width:100%;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:.72rem;" class="audit-obs"/></div>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
  <script>
  function toggleChap(id){ var el=document.getElementById(id); if(el) el.style.display=el.style.display==='none'?'':'none'; }
  function updateConformite(){
    var total=document.querySelectorAll('input[type=radio][value=C]').length;
    var checked=document.querySelectorAll('input[type=radio][value=C]:checked').length;
    var pct=total>0?Math.round(checked/total*100):0;
    var elPct=document.getElementById('pctConformite'); if(elPct) elPct.textContent=pct+'%';
    var elNb=document.getElementById('nbConformes'); if(elNb) elNb.textContent=checked;
  }
  function genererRapportAudit(){ if(typeof pushNotif!=='undefined') pushNotif('ok','fa-file-pdf','Rapport audit ISO 9001 généré et archivé en GED.',5000); }
  </script>`
  return c.html(layout('Audit ISO 9001', content, 'audit-9001'))
})

app.get('/qualite/audit-en9100', (c) => {
  const exigences_specifiques = [
    { id:'EN-01', cat:'Gestion de configuration', desc:'Maîtrise des données de configuration produit (nomenclatures, révisions, variants)' },
    { id:'EN-02', cat:'Maîtrise des risques', desc:'Identification et traitement des risques opérationnels (AMDEC process, FMEA)' },
    { id:'EN-03', cat:'FOD (Corps étrangers)', desc:'Plan de prévention FOD – procédures, formations, audit zones' },
    { id:'EN-04', cat:'Premier article (FAI)', desc:'First Article Inspection : conformité dimensionnelle et documentaire première pièce' },
    { id:'EN-05', cat:'Traçabilité lots', desc:'Traçabilité complète matière → production → livraison (N° lot, certificate of conformance)' },
    { id:'EN-06', cat:'Documents clés', desc:'Maîtrise des enregistrements qualité (gammes, DT, plans, PV contrôle) – révisions et accès' },
    { id:'EN-07', cat:'Autorisation des fournisseurs ST', desc:'Qualification et suivi des sous-traitants selon liste agréée (BSC/OTD)' },
    { id:'EN-08', cat:'Logiciels de production', desc:'Validation des logiciels utilisés en production (CN, MES, ERP)' },
    { id:'EN-09', cat:'Formation et compétences', desc:'Matrice de compétences à jour – habilitations spécifiques aéro (soudage, CND)' },
    { id:'EN-10', cat:'Revue de contrat', desc:'Analyse des exigences client et réglementaires avant acceptation de commande' },
  ]
  const content = `
  <div style="background:linear-gradient(135deg,#0369a1,#0c4a6e);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-plane" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Checklist Audit EN9100:2018</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">Aérospatiale · Exigences spécifiques · FOD · FAI · Configuration · EN9100</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:.82rem;color:#1d4ed8;">
      <i class="fas fa-info-circle mr-2"></i>Cette checklist couvre les exigences <strong>spécifiques EN9100</strong> (en plus des exigences ISO 9001). Cocher chaque point lors de l'audit interne.
    </div>
    ${exigences_specifiques.map(e=>`
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:14px 20px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
        <div style="flex:1;">
          <div style="font-size:.7rem;font-weight:700;color:#0369a1;text-transform:uppercase;margin-bottom:4px;">${e.id} · ${e.cat}</div>
          <div style="font-size:.82rem;color:#374151;">${e.desc}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;margin-top:2px;">
          ${[['C','Conforme','#22c55e'],['NC','Non conforme','#ef4444'],['NC-Crit','NC Critique','#7f1d1d'],['NA','N/A','#9ca3af']].map(([v,l,col])=>`
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.7rem;font-weight:600;color:${col};">
            <input type="radio" name="en9100-${e.id}" value="${v}" style="accent-color:${col};"/>
            ${v}
          </label>`).join('')}
        </div>
      </div>
      <div style="margin-top:8px;">
        <input type="text" placeholder="Écart constaté / Action corrective…" style="width:100%;padding:5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:.75rem;"/>
        <label style="font-size:.7rem;font-weight:600;color:#ef4444;margin-top:4px;display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input type="checkbox" style="accent-color:#ef4444;"/> Créer une NC
        </label>
      </div>
    </div>`).join('')}
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <button onclick="if(typeof pushNotif!=='undefined') pushNotif('ok','fa-file-pdf','Rapport audit EN9100 généré et archivé en GED.',5000)" style="padding:8px 20px;background:linear-gradient(135deg,#0369a1,#0c4a6e);color:white;border:none;border-radius:10px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf mr-2"></i>Générer rapport audit EN9100</button>
    </div>
  </div>`
  return c.html(layout('Audit EN9100', content, 'audit-en9100'))
})

app.get('/qualite/perishables', (c) => {
  const PERISHABLES = [
    { ref:'CHIM-001', nom:'Acide sulfurique bain OAS', lot:'LOT-H2SO4-2026-03', dluo:'2026-09-15', fournisseur:'Solvadis', qteStock:80, unite:'L', statut:'valide' },
    { ref:'CHIM-002', nom:'Additif brillantant OAS', lot:'LOT-BRIT-2026-02', dluo:'2026-05-01', fournisseur:'Anotec', qteStock:5, unite:'L', statut:'bientot' },
    { ref:'CHIM-003', nom:'Huile coupe Ecocool', lot:'LOT-ECO-2025-12', dluo:'2026-03-30', fournisseur:'Blaser', qteStock:20, unite:'L', statut:'bientot' },
    { ref:'CHIM-004', nom:'Liquide ressuage rouge', lot:'LOT-RES-2025-10', dluo:'2026-02-28', fournisseur:'Ardrox', qteStock:3, unite:'btes', statut:'expire' },
    { ref:'CHIM-005', nom:'Graisse lubrifiante ISO 460', lot:'LOT-GR-2026-01', dluo:'2027-01-10', fournisseur:'Total Lubrifiants', qteStock:15, unite:'kg', statut:'valide' },
    { ref:'CHIM-006', nom:'Peinture apprêt zinc chromate', lot:'LOT-PAINT-2025-11', dluo:'2026-04-05', fournisseur:'PPG Aerospace', qteStock:8, unite:'L', statut:'bientot' },
  ]
  const content = `
  <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:20px 24px;color:white;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-flask" style="font-size:1.2rem;"></i></div>
      <div><h1 style="font-size:1.1rem;font-weight:800;margin:0;">Produits Périssables – Suivi DLUO</h1><p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">Chimiques OAS · Consommables · Alertes expiration · EN9100</p></div>
    </div>
  </div>
  <div style="padding:22px 30px;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #22c55e;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#22c55e;">${PERISHABLES.filter(p=>p.statut==='valide').length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Valides</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #f59e0b;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#f59e0b;">${PERISHABLES.filter(p=>p.statut==='bientot').length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Expire bientôt (&lt;30j)</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #ef4444;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#ef4444;">${PERISHABLES.filter(p=>p.statut==='expire').length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Expirés ⚠</div>
      </div>
    </div>
    ${PERISHABLES.filter(p=>p.statut==='expire').length>0?'<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:.82rem;color:#b91c1c;font-weight:600;"><i class="fas fa-exclamation-triangle mr-2"></i>ATTENTION : '+PERISHABLES.filter(p=>p.statut==='expire').length+' produit(s) expiré(s) — Retirer immédiatement du stock et neutraliser selon protocole</div>':''}
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Réf</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Produit</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Lot</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">DLUO</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Stock</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Fournisseur</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
        </tr></thead>
        <tbody>
          ${PERISHABLES.map(p=>{
            const stBg=p.statut==='valide'?'#dcfce7':p.statut==='bientot'?'#fef9c3':'#fee2e2'
            const stCol=p.statut==='valide'?'#166534':p.statut==='bientot'?'#854d0e':'#b91c1c'
            const stLbl=p.statut==='valide'?'Valide':p.statut==='bientot'?'Bientôt expiré':'EXPIRÉ ⚠'
            return `<tr style="border-bottom:1px solid #f9fafb;background:${p.statut==='expire'?'#fff5f5':''};" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${p.statut==='expire'?'#fff5f5':''}'">
              <td style="padding:10px 14px;font-weight:700;color:#374151;font-size:.78rem;">${p.ref}</td>
              <td style="padding:10px 14px;color:#374151;font-weight:600;">${p.nom}</td>
              <td style="padding:10px 14px;font-family:monospace;color:#6b7280;font-size:.75rem;">${p.lot}</td>
              <td style="padding:10px 14px;text-align:center;font-weight:700;color:${p.statut==='expire'?'#b91c1c':p.statut==='bientot'?'#d97706':'#374151'};font-size:.78rem;">${p.dluo}</td>
              <td style="padding:10px 14px;text-align:center;font-weight:600;color:#374151;">${p.qteStock} ${p.unite}</td>
              <td style="padding:10px 14px;color:#6b7280;font-size:.78rem;">${p.fournisseur}</td>
              <td style="padding:10px 14px;text-align:center;"><span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${stBg};color:${stCol};">${stLbl}</span></td>
            </tr>`}).join('')}
        </tbody>
      </table>
    </div>
  </div>`
  return c.html(layout('Produits Périssables', content, 'perishables'))
})

// ══════════════════════════════════════════════════════════════
// GESTION DE STOCK & INCRÉMENTATION MATIÈRE
// §4.6 – Morgane (Achats/Stock)
// ══════════════════════════════════════════════════════════════
// Pages stock legacy (statiques) → redirigées vers la vraie page stock reliée DB
app.get('/stock',          (c) => c.redirect('/stock/service'))
app.get('/stock/entrees',  (c) => c.redirect('/stock/service'))
app.get('/stock/sorties',  (c) => c.redirect('/stock/service'))
app.get('/stock/alertes',  (c) => c.redirect('/stock/service'))

// ══════════════════════════════════════════════════════════════
// MODULE FINANCES – COÛTS, TAUX, MACHINES, IMPUTATIONS
// §4.2 (coût de revient), §4.18 (temps réels), §5 (Power BI)
// ══════════════════════════════════════════════════════════════
app.get('/finances/couts',        async (c) => { const [sal,mac,opx,cmd,pst] = await Promise.all([getSalaries().catch(()=>[]), getMachines().catch(()=>[]), getMachinesOpex().catch(()=>[]), getCommandes().catch(()=>[]), getPostes().catch(()=>[])]); return c.html(pageFinancesCouts(cmd as any, sal as any, mac as any, opx as any, pst as any)) })
app.get('/finances/taux',         async (c) => { const sal = await getSalaries().catch(()=>[]); return c.html(pageFinancesTaux(sal as any)) })
app.get('/finances/machines',     async (c) => { const [mac,opx,pst] = await Promise.all([getMachines().catch(()=>[]), getMachinesOpex().catch(()=>[]), getPostes().catch(()=>[])]); return c.html(pageFinancesMachines(mac as any, opx as any, pst as any)) })
app.get('/finances/imputations',  async (c) => { const [bdt,sal,mac,opx,pst] = await Promise.all([getBonsDeTravail().catch(()=>[]), getSalaries().catch(()=>[]), getMachines().catch(()=>[]), getMachinesOpex().catch(()=>[]), getPostes().catch(()=>[])]); return c.html(pageFinancesImputations(bdt as any, sal as any, mac as any, opx as any, pst as any)) })

// ══════════════════════════════════════════════════════════════
// PAGE LISTE AVOIRS PAR COMMERCIAL
// ══════════════════════════════════════════════════════════════
const AVOIRS_DATA_DEFAULT: any[] = []

function pageAvoirsCommercial(dbCredits?: Credit[]) {
  const AVOIRS_DATA = dbCredits
    ? dbCredits.map(c => ({ id:c.id, client:c.client_nom??'', vendeur:c.vendeur??'', montant:c.montant, solde:c.solde, motif:c.motif, facture:'', date:c.date_credit, statut:c.statut==='actif'?'Actif':c.statut==='partiel'?'Partiel':'Soldé', type:'avance' }))
    : []
  const totalActif = AVOIRS_DATA.filter(a=>a.statut!=='Soldé').reduce((s,a)=>s+a.solde,0)
  const totalMontant = AVOIRS_DATA.reduce((s,a)=>s+a.montant,0)
  const content = `
${pageHeader('fas fa-list-ul','#f87171,#b91c1c','Liste Avoirs par Commercial','Corinne · Avoirs actifs · N° avoir client · Motifs · Soldes',['Avoirs','Commercial'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
    ${[
      {label:'Total avoirs',val:AVOIRS_DATA.length,icon:'fa-list',c:'#f87171',bg:'#fef2f2'},
      {label:'Actifs (solde > 0)',val:AVOIRS_DATA.filter(a=>a.solde>0).length,icon:'fa-clock',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Solde total actif',val:totalActif.toLocaleString('fr-FR')+' €',icon:'fa-euro-sign',c:'#ef4444',bg:'#fef2f2'},
      {label:'Montant total émis',val:totalMontant.toLocaleString('fr-FR')+' €',icon:'fa-file-invoice',c:'#6b7280',bg:'#f8fafc'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);text-align:center;">
      <div style="width:40px;height:40px;border-radius:12px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
        <i class="fas ${s.icon}" style="color:${s.c};"></i>
      </div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.68rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
    <div style="display:flex;gap:4px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <button onclick="filterAvoirs('tous')" id="fav-tous" style="padding:5px 14px;border-radius:7px;background:#f87171;color:white;border:none;font-size:.75rem;font-weight:700;cursor:pointer;">Tous</button>
      <button onclick="filterAvoirs('avance')" id="fav-avance" style="padding:5px 14px;border-radius:7px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Avances</button>
      <button onclick="filterAvoirs('reclamation')" id="fav-reclamation" style="padding:5px 14px;border-radius:7px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Réclamations</button>
      <button onclick="filterAvoirs('actif')" id="fav-actif" style="padding:5px 14px;border-radius:7px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Actifs seulement</button>
    </div>
    <input type="text" placeholder="Rechercher client, N° avoir…" oninput="searchAvoirs(this.value)" style="border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 14px;font-size:.82rem;outline:none;background:#f8fafc;flex:1;max-width:280px;"/>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;" id="avoirsTable">
      <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:left;">N° Avoir</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:left;">Client</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:left;">Commercial</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:left;">Motif</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:left;">N° Facture</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:right;">Montant</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:right;">Solde restant</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:center;">Date</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:center;">Statut</th>
        <th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;text-align:center;">Actions</th>
      </tr></thead>
      <tbody id="avoirsBody">
        ${AVOIRS_DATA.map(a=>`
        <tr class="avoir-row" data-type="${a.type}" data-statut="${a.statut==='Soldé'?'solde':'actif'}" style="border-bottom:1px solid #f8fafc;" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background=''">
          <td style="padding:10px 14px;font-weight:800;color:#f87171;font-family:monospace;font-size:.82rem;">${a.id}</td>
          <td style="padding:10px 14px;font-weight:700;">${a.client}</td>
          <td style="padding:10px 14px;font-size:.78rem;color:#6b7280;">${a.vendeur}</td>
          <td style="padding:10px 14px;">
            <span style="background:${a.type==='reclamation'?'#fef2f2':'#eff6ff'};color:${a.type==='reclamation'?'#b91c1c':'#1d4ed8'};border:1px solid ${a.type==='reclamation'?'#fecaca':'#bfdbfe'};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${a.motif}</span>
          </td>
          <td style="padding:10px 14px;font-size:.75rem;color:#6b7280;">${a.facture}</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;color:#374151;">${a.montant.toLocaleString('fr-FR')} €</td>
          <td style="padding:10px 14px;text-align:right;font-weight:800;font-size:.88rem;color:${a.solde>0?'#b91c1c':a.solde===0?'#15803d':'#6b7280'};">${a.solde.toLocaleString('fr-FR')} €</td>
          <td style="padding:10px 14px;text-align:center;font-size:.75rem;color:#6b7280;">${a.date}</td>
          <td style="padding:10px 14px;text-align:center;">
            <span style="background:${a.statut==='Actif'?'#fffbeb':a.statut==='Partiel'?'#eff6ff':'#f0fdf4'};color:${a.statut==='Actif'?'#854d0e':a.statut==='Partiel'?'#1d4ed8':'#15803d'};border:1px solid ${a.statut==='Actif'?'#fde68a':a.statut==='Partiel'?'#bfdbfe':'#bbf7d0'};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${a.statut}</span>
          </td>
          <td style="padding:10px 14px;text-align:center;">
            <a href="/commercial/service#avoirs" style="padding:4px 10px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:6px;font-size:.68rem;font-weight:700;text-decoration:none;">Voir</a>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>
<script>
function filterAvoirs(type) {
  document.querySelectorAll('.avoir-row').forEach(r=>{
    const t=r.dataset.type, s=r.dataset.statut;
    if(type==='tous') r.style.display='';
    else if(type==='actif') r.style.display=s==='actif'?'':'none';
    else r.style.display=t===type?'':'none';
  });
  ['tous','avance','reclamation','actif'].forEach(k=>{
    const btn=document.getElementById('fav-'+k);
    if(btn){btn.style.background=k===type?'#f87171':'transparent';btn.style.color=k===type?'white':'#64748b';}
  });
}
function searchAvoirs(v) {
  const q=v.toLowerCase();
  document.querySelectorAll('.avoir-row').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';
  });
}
</script>`
  return layout('Liste Avoirs par Commercial', content, 'avoirs')
}

// ══════════════════════════════════════════════════════════════
// HABILITATIONS & CERTIFICATIONS
// ══════════════════════════════════════════════════════════════
app.get('/production/habilitations', (c) => {
  const HABILITATIONS_DATA = [
    { id:'HAB-001', operateur:'Antoine D.', type:'Habilitation', certif:'Travail sous tension B1V', organisme:'AFPA', dateObtention:'2024-03-15', dateExpiration:'2026-03-15', statut:'expire_bientot', critique:true, fichier:'HAB-ANTOINE-B1V.pdf' },
    { id:'HAB-002', operateur:'Antoine D.', type:'Certification', certif:'Product Safety Awareness EN9100', organisme:'Interne', dateObtention:'2025-01-10', dateExpiration:'2027-01-10', statut:'valide', critique:true, fichier:'' },
    { id:'HAB-003', operateur:'Karim B.', type:'Certification', certif:'Product Safety Awareness EN9100', organisme:'Interne', dateObtention:'2024-11-20', dateExpiration:'2026-11-20', statut:'valide', critique:true, fichier:'' },
    { id:'HAB-004', operateur:'Isabelle R.', type:'Habilitation', certif:'Cariste CACES R489 Cat.3', organisme:'INRS', dateObtention:'2022-06-01', dateExpiration:'2027-06-01', statut:'valide', critique:false, fichier:'HAB-ISABELLE-CACES.pdf' },
    { id:'HAB-005', operateur:'Isabelle R.', type:'Certification', certif:'Counterfeit Prevention AS6174', organisme:'SAE', dateObtention:'2025-03-01', dateExpiration:'2028-03-01', statut:'valide', critique:true, fichier:'' },
    { id:'HAB-006', operateur:'Marc T.', type:'Habilitation', certif:'Opérateur Laser class 4', organisme:'CEA', dateObtention:'2023-09-10', dateExpiration:'2026-03-10', statut:'expire', critique:true, fichier:'' },
    { id:'HAB-007', operateur:'Julien M.', type:'Certification', certif:'Soudeur TIG Alu MAS DMOS', organisme:'ASQUALIM', dateObtention:'2024-05-15', dateExpiration:'2027-05-15', statut:'valide', critique:true, fichier:'HAB-JULIEN-DMOS.pdf' },
    { id:'HAB-008', operateur:'Julien M.', type:'Certification', certif:'Counterfeit Prevention AS6174', organisme:'SAE', dateObtention:'2024-09-20', dateExpiration:'2026-09-20', statut:'valide', critique:true, fichier:'' },
    { id:'HAB-009', operateur:'Frédéric G.', type:'Certification', certif:'Counterfeit Prevention AS6174', organisme:'SAE', dateObtention:'2023-12-01', dateExpiration:'2025-12-01', statut:'expire', critique:true, fichier:'' },
    { id:'HAB-010', operateur:'Frédéric G.', type:'Habilitation', certif:'Électricien habilité B2-BR', organisme:'AFPA', dateObtention:'2024-06-01', dateExpiration:'2026-06-01', statut:'expire_bientot', critique:false, fichier:'' },
  ]
  const today = new Date('2026-03-13')
  const expiresIn30 = HABILITATIONS_DATA.filter(h => {
    const d = new Date(h.dateExpiration)
    const diff = (d.getTime() - today.getTime()) / (1000*60*60*24)
    return diff >= 0 && diff <= 90
  }).length
  const expires = HABILITATIONS_DATA.filter(h => h.statut === 'expire').length
  const critiques = HABILITATIONS_DATA.filter(h => h.critique && (h.statut === 'expire' || h.statut === 'expire_bientot')).length
  const content = `
  ${pageHeader('fas fa-id-badge','#8b5cf6,#7c3aed','Habilitations & Certifications','Sylvie · Pierre-Yves · EN9100 §7.2 · Renouvellements · Compétences critiques',['HAB','RH','QUA'])}
  <div style="padding:22px 30px;">

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${[
        { lbl:'Total habilitations', val:HABILITATIONS_DATA.length, icon:'fa-id-badge', c:'#8b5cf6', bg:'#f5f3ff' },
        { lbl:'Expirées', val:expires, icon:'fa-times-circle', c:'#ef4444', bg:'#fef2f2' },
        { lbl:'Expirent dans 90j', val:expiresIn30, icon:'fa-clock', c:'#f59e0b', bg:'#fffbeb' },
        { lbl:'Critiques à renouveler', val:critiques, icon:'fa-exclamation-triangle', c:'#dc2626', bg:'#fef2f2' },
      ].map(s=>`
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:4px solid ${s.c};display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;border-radius:12px;background:${s.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas ${s.icon}" style="color:${s.c};font-size:1.1rem;"></i>
        </div>
        <div>
          <div style="font-size:1.6rem;font-weight:900;color:#111827;">${s.val}</div>
          <div style="font-size:.68rem;color:#6b7280;font-weight:600;">${s.lbl}</div>
        </div>
      </div>`).join('')}
    </div>

    <!-- ALERTE CRITIQUES -->
    ${critiques > 0 ? `<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:14px;">
      <i class="fas fa-exclamation-circle" style="color:#dc2626;font-size:1.2rem;flex-shrink:0;"></i>
      <div>
        <div style="font-weight:700;color:#b91c1c;font-size:.88rem;">${critiques} habilitation(s) critique(s) à renouveler immédiatement</div>
        <div style="font-size:.78rem;color:#ef4444;margin-top:2px;">Impact EN9100 §7.2 – Compétences critiques non couvertes</div>
      </div>
    </div>` : ''}

    <!-- FILTRES -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:.78rem;font-weight:600;color:#374151;">Filtrer :</span>
      ${[['tous','Toutes'],['valide','Valides'],['expire_bientot','Expirent bientôt'],['expire','Expirées'],['critique','Critiques']].map(([s,l])=>`
      <button onclick="filtrerHab('${s}')" data-hab="${s}" style="padding:5px 14px;border-radius:999px;background:${s==='tous'?'#e0e7ff':'#f1f5f9'};color:${s==='tous'?'#3730a3':'#6b7280'};border:1.5px solid ${s==='tous'?'#c7d2fe':'#e2e8f0'};font-size:.72rem;font-weight:700;cursor:pointer;">${l}</button>`).join('')}
      <input type="text" placeholder="Rechercher opérateur, certif…" oninput="searchHab(this.value)" style="margin-left:auto;border:1.5px solid #e2e8f0;border-radius:999px;padding:5px 16px;font-size:.75rem;outline:none;background:#f8fafc;min-width:220px;"/>
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;color:#374151;font-size:.88rem;"><i class="fas fa-id-badge mr-2" style="color:#8b5cf6;"></i>Matrice habilitations & certifications</span>
        <button onclick="ouvrirAjoutHab()" style="padding:7px 16px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:9px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus mr-2"></i>Ajouter</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="habTable">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Opérateur</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Type</th>
            <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Habilitation / Certification</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Organisme</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Obtention</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Expiration</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Critique</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
            <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Actions</th>
          </tr></thead>
          <tbody>
            ${HABILITATIONS_DATA.map(h => {
              const stBg = h.statut==='valide'?'#dcfce7':h.statut==='expire_bientot'?'#fef3c7':'#fee2e2'
              const stCol = h.statut==='valide'?'#166534':h.statut==='expire_bientot'?'#92400e':'#b91c1c'
              const stLbl = h.statut==='valide'?'Valide ✓':h.statut==='expire_bientot'?'Expire bientôt ⚠':'Expirée ✗'
              const rowBg = h.statut==='expire'?'#fff5f5':h.statut==='expire_bientot'?'#fffbeb':''
              return `
            <tr data-hab-statut="${h.statut}" data-hab-critique="${h.critique}" style="border-bottom:1px solid #f9fafb;background:${rowBg};" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${rowBg}'">
              <td style="padding:10px 14px;font-weight:700;color:#374151;">${h.operateur}</td>
              <td style="padding:10px 14px;">
                <span style="padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;background:${h.type==='Habilitation'?'#f5f3ff':'#eff6ff'};color:${h.type==='Habilitation'?'#5b21b6':'#1d4ed8'};">${h.type}</span>
              </td>
              <td style="padding:10px 14px;color:#374151;font-size:.8rem;font-weight:600;">${h.certif}</td>
              <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.75rem;">${h.organisme}</td>
              <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.75rem;">${h.dateObtention}</td>
              <td style="padding:10px 14px;text-align:center;font-weight:700;color:${stCol};font-size:.78rem;">${h.dateExpiration}</td>
              <td style="padding:10px 14px;text-align:center;">${h.critique?'<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;">Critique !</span>':'<span style="color:#9ca3af;font-size:.72rem;">—</span>'}</td>
              <td style="padding:10px 14px;text-align:center;"><span style="padding:3px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${stBg};color:${stCol};">${stLbl}</span></td>
              <td style="padding:10px 14px;text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;">
                  <button onclick="renouvelerHab('${h.id}','${h.certif.replace(/'/g,"\\'")}','${h.operateur}')" style="padding:4px 10px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-sync-alt mr-1"></i>Renouveler</button>
                  ${h.fichier?`<a href="#" style="padding:4px 8px;background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;border-radius:6px;font-size:.7rem;font-weight:600;text-decoration:none;" title="${h.fichier}"><i class="fas fa-file-pdf" style="color:#ef4444;"></i></a>`:''}
                </div>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- COMPÉTENCES CRITIQUES -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
      <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;gap:8px;"><i class="fas fa-star" style="color:#f59e0b;"></i>Compétences critiques de l'entreprise<span style="flex:1;height:1px;background:#f1f5f9;margin-left:8px;"></span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${[
          { comp:'DMOS / MAS Soudure TIG Alu', requis:2, actuel:1, alert:true },
          { comp:'Product Safety Awareness EN9100', requis:8, actuel:6, alert:false },
          { comp:'Counterfeit Prevention AS6174', requis:4, actuel:2, alert:true },
          { comp:'Opérateur Laser Classe 4', requis:2, actuel:1, alert:true },
          { comp:'Cariste CACES R489', requis:2, actuel:2, alert:false },
          { comp:'Habilitation Électrique B2-BR', requis:1, actuel:0, alert:true },
        ].map(cp => {
          const pct = Math.round(cp.actuel/cp.requis*100)
          return `<div style="background:#f8fafc;border-radius:10px;padding:14px;border:1px solid ${cp.alert?'#fecaca':'#e2e8f0'};">
            <div style="font-weight:700;color:#374151;font-size:.8rem;margin-bottom:8px;">${cp.comp}</div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#6b7280;margin-bottom:6px;">
              <span>Opérateurs certifiés</span>
              <span style="font-weight:700;color:${cp.alert?'#ef4444':'#374151'};">${cp.actuel} / ${cp.requis}</span>
            </div>
            <div style="background:#e2e8f0;border-radius:999px;height:7px;overflow:hidden;">
              <div style="width:${Math.min(pct,100)}%;height:100%;background:${pct>=100?'#22c55e':pct>=50?'#f59e0b':'#ef4444'};border-radius:999px;"></div>
            </div>
            ${cp.alert?`<div style="font-size:.68rem;color:#ef4444;font-weight:700;margin-top:4px;"><i class="fas fa-exclamation-triangle mr-1"></i>Seuil minimum non atteint</div>`:''}
          </div>`}).join('')}
      </div>
    </div>
  </div>

  <!-- MODAL RENOUVELLEMENT -->
  <div id="modalRenouvHab" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:520px;width:90%;">
      <h3 style="font-size:1rem;font-weight:800;color:#8b5cf6;margin-bottom:4px;"><i class="fas fa-sync-alt mr-2"></i>Renouveler une habilitation</h3>
      <p style="font-size:.8rem;color:#6b7280;margin-bottom:14px;">Habilitation : <strong id="renouvCertif"></strong> – <span id="renouvOp"></span></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date de formation</label><input type="date" class="form-input" id="renouvDateForm"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Nouvelle expiration</label><input type="date" class="form-input" id="renouvDateExp"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Organisme formateur</label><input type="text" class="form-input" placeholder="Ex: AFPA, Interne…"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° certificat / attestation</label><input type="text" class="form-input" placeholder="Ex: CERT-2026-XXXX"/></div>
      </div>
      <div style="margin-bottom:14px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Joindre le certificat (PDF)</label><input type="file" accept=".pdf,.jpg,.png" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem;font-size:.78rem;background:#f8fafc;"/></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button onclick="fermerModalHab()" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="validerRenouvHab()" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-1"></i>Valider le renouvellement</button>
      </div>
    </div>
  </div>

  <script>
  function filtrerHab(s){
    document.querySelectorAll('[data-hab]').forEach(function(b){ if(b.tagName==='BUTTON'){ b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.border='1.5px solid #e2e8f0'; } });
    var btn=document.querySelector('button[data-hab="'+s+'"]');
    if(btn){ btn.style.background='#e0e7ff'; btn.style.color='#3730a3'; btn.style.border='1.5px solid #c7d2fe'; }
    document.querySelectorAll('#habTable tbody tr').forEach(function(tr){
      var st=tr.dataset.habStatut;
      var cr=tr.dataset.habCritique;
      if(s==='tous') tr.style.display='';
      else if(s==='critique') tr.style.display=(cr==='true'&&(st==='expire'||st==='expire_bientot'))?'':'none';
      else tr.style.display=st===s?'':'none';
    });
  }
  function searchHab(q){
    q=q.toLowerCase();
    document.querySelectorAll('#habTable tbody tr').forEach(function(tr){ tr.style.display=tr.textContent.toLowerCase().indexOf(q)>=0?'':'none'; });
  }
  function renouvelerHab(id,certif,op){
    document.getElementById('renouvCertif').textContent=certif;
    document.getElementById('renouvOp').textContent=op;
    var m=document.getElementById('modalRenouvHab'); if(m) m.style.display='flex';
  }
  function fermerModalHab(){ var m=document.getElementById('modalRenouvHab'); if(m) m.style.display='none'; }
  function validerRenouvHab(){ pushNotif('ok','fa-sync-alt','Habilitation renouvel\u00e9e. Certificat archiv\u00e9 en GED. Notification RH.',6000); fermerModalHab(); }
  function ouvrirAjoutHab(){ pushNotif('info','fa-plus','Formulaire d\\'ajout d\\'habilitation ouvert.',3000); }
  </script>`
  return c.html(layout('Habilitations & Certifications', content, 'habilitations'))
})

// ══════════════════════════════════════════════════════════════
// COMPTABILITÉ – DASHBOARD & FACTURES
// ══════════════════════════════════════════════════════════════
app.get('/comptabilite/dashboard', (c) => c.redirect('/compta/service'))
app.get('/comptabilite/factures', (c) => c.redirect('/compta/service'))
export default app
