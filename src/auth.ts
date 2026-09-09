// ══════════════════════════════════════════════════════════════
// AUTH / RBAC — ERP Seem Semrac
// Hachage des PIN (Web Crypto), session JWT signée (hono/jwt),
// et matrice de permissions par service (lecture / écriture).
// Aucune dépendance ajoutée : hono/jwt est inclus dans hono.
// ══════════════════════════════════════════════════════════════
import { sign, verify } from 'hono/jwt'

// ─── Utilitaires base64 (Workers : btoa/atob globaux) ─────────
function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
function ub64(str: string): Uint8Array {
  const bin = atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ─── Hachage des PIN : PBKDF2-SHA256 salé (portable Worker) ────
const PBKDF2_ITER = 100000

async function pbkdf2(pin: string, salt: Uint8Array, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256)
  return b64(bits)
}

export function isHashedPin(stored: any): boolean {
  return typeof stored === 'string' && stored.startsWith('pbkdf2$')
}

// Produit une empreinte auto-décrite : pbkdf2$<iter>$<saltB64>$<hashB64>
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(String(pin), salt, PBKDF2_ITER)
  return `pbkdf2$${PBKDF2_ITER}$${b64(salt)}$${hash}`
}

// Vérifie un PIN saisi contre la valeur stockée (hachée OU en clair legacy).
export async function verifyPin(input: string, stored: any): Promise<boolean> {
  if (stored == null || input == null) return false
  const pin = String(input).trim()
  if (isHashedPin(stored)) {
    const parts = String(stored).split('$')          // pbkdf2 / iter / salt / hash
    const iter = parseInt(parts[1], 10) || PBKDF2_ITER
    const calc = await pbkdf2(pin, ub64(parts[2] || ''), iter)
    return calc === (parts[3] || '')
  }
  return String(stored) === pin   // legacy : PIN en clair
}

// ─── Session JWT ──────────────────────────────────────────────
export interface SessionUser {
  sub: string        // id salarié
  mat: string        // matricule
  nom: string
  role: string       // rôle primaire (affichage)
  roles?: string[]   // tous les rôles (multi-rôles) — permissions = union
  perms: string[]    // jetons d'autorisation
  ent: string        // entité (Seem/Semrac/Support)
  exp?: number
}
// Rôles effectifs d'un utilisateur (multi-rôles, repli sur le rôle primaire).
function rolesOf(user: SessionUser): string[] {
  return Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role]
}

// Secret EMBARQUÉ par défaut. Il vit UNIQUEMENT côté serveur (le worker/fonction SSR ne l'envoie
// jamais au navigateur), au même titre que la clé anon Supabase. Il permet un déploiement
// « glisser-déposer » qui marche sans configurer aucune variable d'env. En production, poser la
// variable d'env JWT_SECRET (forte, non committée) le remplace et reste recommandé.
const BUILTIN_SECRET = 'seem-semrac-erp::a9F3k7Qw1Zt6Lp0Xy8Nb4Rc2Vd5Hs7Jm3Ue6Gn8Kf1Pq4Wr9Bt2Cx5'
function jwtSecret(env: any): string {
  if (env && env.JWT_SECRET) return String(env.JWT_SECRET)
  return BUILTIN_SECRET
}

// hono/jwt exige l'algorithme explicite à la signature ET à la vérification.
export async function signSession(user: Omit<SessionUser, 'exp'>, env: any, ttlSec = 12 * 3600): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  return sign({ ...user, exp } as any, jwtSecret(env), 'HS256')
}
export async function verifySession(token: string, env: any): Promise<SessionUser | null> {
  try { return (await verify(token, jwtSecret(env), 'HS256')) as unknown as SessionUser } catch { return null }
}

// ─── Matrice de permissions par RÔLE × SERVICE ────────────────
// Niveaux : 'rw' = lecture+écriture · 'r' = lecture seule · absent = REFUSÉ.
// direction (perm 'all') = accès total (court-circuit). Les actions atelier
// (solder/réception/autocontrôle/pointage) sont "self-service" (cf SELF_SERVICE_RE).
type Lvl = 'rw' | 'r'
const ROLE_MATRIX: Record<string, Record<string, Lvl>> = {
  commercial:  { commercial: 'rw', be: 'r', production: 'r', qualite: 'r', expeditions: 'r', stock: 'r' },
  bei:         { commercial: 'r', be: 'rw', achats: 'rw', production: 'r', oas: 'r', qualite: 'r', securite: 'r', environnement: 'r', stock: 'r', maintenance: 'r' },
  achats:      { commercial: 'r', be: 'r', achats: 'rw', production: 'r', expeditions: 'r', stock: 'rw', maintenance: 'r' },
  production:  { be: 'r', achats: 'r', production: 'rw', oas: 'r', qualite: 'r', securite: 'r', environnement: 'r', expeditions: 'r', stock: 'r', maintenance: 'r' },
  oas:         { be: 'r', production: 'r', oas: 'rw', qualite: 'r', securite: 'r', environnement: 'rw', stock: 'r', maintenance: 'r' },
  qualite:     { be: 'r', production: 'r', oas: 'r', qualite: 'rw', securite: 'rw', environnement: 'rw', expeditions: 'r', stock: 'r', maintenance: 'r' },
  logistique:  { commercial: 'r', achats: 'r', production: 'r', expeditions: 'rw', stock: 'rw' },
  maintenance: { achats: 'r', production: 'r', oas: 'r', securite: 'r', environnement: 'r', stock: 'r', maintenance: 'rw' },
  comptable:   { commercial: 'r', achats: 'r', expeditions: 'r', stock: 'r', rh: 'r', compta: 'rw' },
  rh:          { production: 'r', securite: 'r', environnement: 'r', rh: 'rw', compta: 'r' },
  operateur:   { production: 'r', oas: 'r', qualite: 'r', expeditions: 'r' },
  direction:   { commercial: 'rw', be: 'rw', achats: 'rw', production: 'rw', oas: 'rw', qualite: 'rw', securite: 'rw', environnement: 'rw', expeditions: 'rw', stock: 'rw', maintenance: 'rw', rh: 'rw', compta: 'rw', direction: 'rw' },
}
// Services affichés dans le menu (pour le filtrage par rôle).
const MENU_SERVICES = ['commercial', 'be', 'achats', 'production', 'oas', 'qualite', 'securite', 'environnement', 'expeditions', 'stock', 'maintenance', 'plans', 'rh', 'compta', 'direction']
// Exposé pour la fiche salarié (validation des services choisis côté serveur).
export const MENU_SERVICES_PUBLIC = MENU_SERVICES

// ─── Accès par service définis SUR LA PERSONNE (fiche salarié) ────────────────
// Jetons « lire:<service> » et « ecrire:<service> » rangés dans salaries.autorisations.
// Règle : dès qu'un utilisateur en possède AU MOINS UN, ces listes deviennent la
// référence pour l'accès aux services — elles remplacent la matrice des rôles, ce qui
// permet aussi bien d'ouvrir un service que d'en fermer un. Sans aucun jeton, rien ne
// change : la matrice des rôles s'applique comme avant.
function accesExplicites(perms: string[]): { lire: Set<string>; ecrire: Set<string>; actif: boolean } {
  const lire = new Set<string>(), ecrire = new Set<string>()
  for (const p of perms) {
    const t = String(p || '')
    if (t.startsWith('ecrire:')) { ecrire.add(t.slice(7)); lire.add(t.slice(7)) }  // écrire implique lire
    else if (t.startsWith('lire:')) lire.add(t.slice(5))
  }
  return { lire, ecrire, actif: lire.size > 0 || ecrire.size > 0 }
}

// Actions "self-service" atelier : l'identité réelle est le matricule+PIN dans le
// corps de la requête (borne partagée). Accessibles à tout compte connecté
// (ex. opérateur générique), l'action restant signée par le PIN individuel.
const SELF_SERVICE_RE: RegExp[] = [
  /^\/api\/rh\/pointage$/,
  /^\/api\/pointage\//,
  /^\/api\/production\/bdt\/[^/]+\/(recu|solder)$/,
  /^\/api\/oas\/balancelle\/[^/]+\/cloturer$/,
  /^\/api\/expeditions\/bc\/[^/]+\/(receptionner|pv)$/,
  /^\/api\/controles\/cote$/,
  /^\/api\/production\/non-conformites$/,
]
export function isSelfService(path: string): boolean {
  const p = path.split('?')[0]
  return SELF_SERVICE_RE.some(re => re.test(p))
}

// 1er segment d'URL (pages) → service.
const PAGE_SEG_SERVICE: Record<string, string> = {
  commercial: 'commercial', be: 'be', achats: 'achats', production: 'production', oas: 'oas',
  qualite: 'qualite', securite: 'securite', environnement: 'environnement', expeditions: 'expeditions', expedition: 'expeditions', stock: 'stock',
  maintenance: 'maintenance', plans: 'plans', rh: 'rh', compta: 'compta', finances: 'compta',
  direction: 'direction', reglages: 'direction',
}
// Famille d'API (/api/<famille>/…) → service.
const API_FAM_SERVICE: Record<string, string> = {
  securite: 'securite',
  qualite: 'qualite', controles: 'qualite', 'rapports-8d': 'qualite', 'non-conformites': 'qualite', audit: 'qualite',
  clients: 'commercial', dt: 'commercial', offre: 'commercial', credit: 'commercial', credits: 'commercial',
  be: 'be', nomenclature: 'be', 'produit-prix': 'be', 'produits-fournisseurs': 'be', 'ref-prix': 'be', 'demandes-prix': 'be', 'references-clients': 'be',
  achats: 'achats', da: 'achats', bc: 'achats', fournisseur: 'achats', fournisseurs: 'achats', 'sous-traitant': 'achats', 'sous-traitants': 'achats',
  production: 'production', bdt: 'production', bds: 'production', process: 'production', machine: 'production', machines: 'production', presence: 'production', planning: 'production', 'sortie-matiere': 'production',
  oas: 'oas', balancelle: 'oas', balancelles: 'oas', releve: 'oas', releves: 'oas',
  bl: 'expeditions', bst: 'expeditions', expeditions: 'expeditions',
  stock: 'stock', stocks: 'stock', mouvement: 'stock', mouvements: 'stock', article: 'stock', articles: 'stock',
  om: 'maintenance', maintenance: 'maintenance', piece: 'maintenance', pieces: 'maintenance',
  rh: 'rh', salarie: 'rh', salaries: 'rh', competence: 'rh', competences: 'rh', certification: 'rh', certifications: 'rh', conge: 'rh', conges: 'rh', pointage: 'rh',
  factures: 'compta', 'factures-fournisseur': 'compta', ecritures: 'compta', compta: 'compta',
  plans: 'plans', marqueurs: 'plans',
  // Familles ajoutées pour fermer le « default-open » (chaque famille DOIT être mappée) :
  quarantaine: 'qualite',
  commandes: 'commercial', commande: 'commercial', 'commandes-p': 'commercial',
  'catalogue-fournisseurs': 'achats',
  // (interlocuteurs = contacts clients ET fournisseurs → cas particulier multi-services dans canAccess)
  direction: 'direction', 'kpi-objectifs': 'direction',
}
// Routes API réellement neutres, ouvertes à tout compte connecté (liste blanche explicite).
const NEUTRAL_API = (clean: string): boolean =>
  clean === '/api/me' ||
  clean.startsWith('/api/ged/file') ||
  clean.startsWith('/api/locks') ||   // verrous d'édition : ouverts à tout connecté (acquérir/battement/relâcher/statut)
  // La SOUMISSION d'une validation est ouverte (file Direction) ; la DÉCISION (/decision) est gardée dans le handler + non neutre ici.
  clean === '/api/validations' || (clean.startsWith('/api/validations/') && !clean.endsWith('/decision'))

// Routes publiques (pas de session requise).
const PUBLIC_PREFIXES = ['/login', '/api/login', '/logout', '/static', '/api/contact', '/favicon.ico']
export function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some(p => path === p || path.startsWith(p + '/'))
}

// Déduit le service d'un chemin (ou null = route neutre/utilitaire).
export function serviceFor(path: string): string | null {
  const clean = path.split('?')[0]
  // Habilitations / certifications : géré par la RH ET la Qualité (jeton 'habilitations'),
  // sans donner accès au reste de la RH (salariés, paie, congés).
  if (clean.startsWith('/api/rh/certification') || clean === '/rh/habilitations') return 'habilitations'
  // Borne de pointage / congés : self-service (matricule+PIN dans le corps) → ouvert à tout connecté.
  if (clean === '/rh/pointage' || clean.startsWith('/api/rh/pointage') || clean.startsWith('/api/pointage')) return 'pointage'
  // Routes API explicitement neutres (ouvertes à tout connecté) → sentinelle __neutral__.
  if (NEUTRAL_API(clean)) return '__neutral__'
  // GED : l'upload / la liste / la suppression sont réservés au BE (l'ouverture de fichier est déjà neutre ci-dessus).
  if (clean.startsWith('/api/ged')) return 'be'
  // L'ANALYSE d'une DT (chiffrage/validation BE) est une action du BUREAU D'ÉTUDES, même si la DT est une ressource
  // commerciale (dt→commercial). Sans cette exception, un analyste `bei` (commercial:'r') ne pourrait pas valider l'analyse.
  if (/^\/api\/dt\/[^/]+\/analyse$/.test(clean)) return 'be'
  // Export SEIRICH (risque chimique) : gardé par le service Sécurité (la famille /api/export est sinon multi-domaines).
  if (clean === '/api/export/seirich.xlsx') return 'securite'
  if (clean.startsWith('/api/')) {
    const fam = clean.slice(5).split('/')[0]
    return API_FAM_SERVICE[fam] || null
  }
  // Dashboards : /dashboard/<service> gaté par la LECTURE du service correspondant (ex. RH et finance restreints).
  if (clean.startsWith('/dashboard/')) {
    const d = clean.split('/')[2] || ''
    return (DASHBOARD_SERVICE[d] || null)
  }
  const seg = clean.split('/')[1] || ''
  return PAGE_SEG_SERVICE[seg] || null
}
const DASHBOARD_SERVICE: Record<string, string> = {
  commercial: 'commercial', be: 'be', achats: 'achats', fournisseurs: 'achats',
  programmation: 'production', production: 'production', qualite: 'qualite', oas: 'oas',
  expedition: 'expeditions', maintenance: 'maintenance', stock: 'stock',
  rh: 'rh', finance: 'compta', direction: 'direction',
}

// Vrai si l'utilisateur a le niveau requis (écriture → rw ; lecture → r/rw) sur AU MOINS UN des services donnés.
function hasAnyLevel(user: SessionUser, services: string[], method: string): boolean {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())
  return rolesOf(user).some(r => services.some(s => {
    const l = (ROLE_MATRIX[r] || {})[s]
    return isWrite ? l === 'rw' : (l === 'r' || l === 'rw')
  }))
}

// Décision d'accès : true si l'utilisateur peut accéder à (path, méthode).
export function canAccess(user: SessionUser | null, path: string, method: string): boolean {
  if (!user) return false
  const perms = Array.isArray(user.perms) ? user.perms : []
  if (perms.includes('all')) return true                 // direction : accès total
  if (isSelfService(path)) return true                   // actions atelier (PIN dans le corps)
  // Interlocuteurs : contacts clients (commercial) ET fournisseurs (achats/BE) → écriture si rw sur l'un des trois, lecture si r/rw.
  if (path.startsWith('/api/interlocuteurs')) return hasAnyLevel(user, ['commercial', 'achats', 'be'], method)
  const svc = serviceFor(path)
  if (svc === '__neutral__') return true                 // route API explicitement neutre (liste blanche)
  if (!svc) return !path.startsWith('/api/')             // FAIL-CLOSED : /api inconnu = refusé ; page inconnue = ouverte au connecté
  if (svc === 'pointage') return true                    // borne self-service
  if (svc === 'habilitations') return perms.includes('habilitations')  // RH + Qualité
  if (svc === 'plans') {  // maquette bâtiment : lecture ouverte à tout connecté ; écriture BE / Production / Maintenance / Qualité (+ Direction)
    const isW = !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())
    const canW = rolesOf(user).some(r => r === 'direction' || r === 'maintenance' || r === 'qualite' || r === 'bei' || r === 'production')
    return isW ? canW : true
  }
  // Accès définis sur la personne : ils font foi dès qu'il en existe au moins un.
  const ex = accesExplicites(perms)
  if (ex.actif) {
    const isW = !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())
    return isW ? ex.ecrire.has(svc) : ex.lire.has(svc)
  }
  // Multi-rôles : on prend le MEILLEUR niveau (rw > r) parmi tous les rôles de l'utilisateur.
  let level: Lvl | undefined
  for (const r of rolesOf(user)) { const l = (ROLE_MATRIX[r] || {})[svc]; if (l === 'rw') { level = 'rw'; break } if (l === 'r') level = 'r' }
  if (!level) return false                               // refusé
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())
  return isWrite ? level === 'rw' : true                 // écriture → 'rw' ; lecture → 'r' ou 'rw'
}

// Services LISIBLES par l'utilisateur (pour filtrer le menu côté client).
export function navServices(user: SessionUser | null): string[] {
  if (!user) return []
  const perms = Array.isArray(user.perms) ? user.perms : []
  if (perms.includes('all')) return MENU_SERVICES.slice()
  const ex = accesExplicites(perms)
  if (ex.actif) return MENU_SERVICES.filter(s => s === 'plans' || ex.lire.has(s))   // 'plans' visible par tous (lecture)
  const roles = rolesOf(user)
  return MENU_SERVICES.filter(s => s === 'plans' || roles.some(r => !!(ROLE_MATRIX[r] || {})[s]))  // 'plans' visible par tous (lecture)
}
