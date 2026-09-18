// ══════════════════════════════════════════════════════════════
// QUERIES – ERP Seem Semrac v2.0
// Couche d'accès Supabase — une fonction par entité
// ══════════════════════════════════════════════════════════════
import { supabase } from './db'
import { verifyPin, hashPin, isHashedPin } from './auth'
import { computeExpositionSante, normQuantiteChimique } from './qref'
import { construireTauxAtelier, coutReelBdt, typeProcess, normaliserReference } from './shared'
import type { TauxAtelier } from './shared'

// Migration paresseuse : si le PIN stocké est en clair (legacy), le remplacer
// par son empreinte hachée après une vérification réussie (best-effort).
async function rehashPinIfLegacy(row: any, pin: string): Promise<void> {
  try {
    if (row && row.id && !isHashedPin(row.pin)) {
      const h = await hashPin(String(pin).trim())
      await supabase.from('salaries').update({ pin: h }).eq('id', row.id)
    }
  } catch { /* la migration ne doit jamais bloquer la connexion */ }
}
import type {
  Client, Operateur, Machine, Shift, Absence,
  DemandeTravaux, Offre, Commande, Lot, BonDeTravail,
  Credit, DemandeAchat, NonConformite, BonDeLivraison,
  Habilitation, FournisseurSt, DemandeSite,
  Balancelle, ReleveEau, ReleveBain,
  PVControle, Quarantaine, Audit, ProduitPerissable,
  BonDeCommande, ArticleStock, MouvementStock,
  OrdreMaintenance, PlanPreventif, MtbfMachine,
  Nomenclature, FournitureNomenclature,
  Employe, Certification, CompetenceOperateur, Pointage,
  FactureClient, FactureFournisseur, EcritureComptable
} from './types'

// ─── LECTURE ──────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data } = await supabase.from('clients').select('*').order('nom')
  return data ?? []
}

export async function getClient(id: string): Promise<Client | null> {
  const { data } = await supabase.from('clients').select('*').eq('id', id).single()
  return data
}

// Opérateurs = salariés de production (source de vérité UNIQUE : table `salaries`,
// est_operateur=true). La table `operateurs` n'existe pas ; cette forme « legacy »
// alimente tous les consommateurs (grille présence, Gantt, dashboards, OAS, Qualité).
// Conséquence : créer un salarié role=operateur le fait apparaître partout.
export async function getOperateurs(): Promise<Operateur[]> {
  const { data } = await supabase
    .from('salaries')
    .select('id,nom,prenom,poste,entite,shift_id,competences,actif')
    .eq('est_operateur', true).eq('actif', true)
    .order('entite').order('nom')
  return (data ?? []).map((o: any) => ({
    id: o.id,
    nom: `${o.prenom ?? ''} ${o.nom ?? ''}`.trim() || o.id,
    prenom: o.prenom ?? undefined,
    activite: o.entite ?? 'Seem',
    poste: o.poste ?? '',
    shift_id: o.shift_id ?? 'matin',
    shift: o.shift_id ?? 'matin',
    competences: Array.isArray(o.competences) ? o.competences : [],
    habilitations: [],
    niveau: {},
    actif: o.actif !== false,
  })) as unknown as Operateur[]
}

export async function getMachines(): Promise<Machine[]> {
  const { data } = await supabase.from('machines').select('*').order('ordre', { ascending: true, nullsFirst: false }).order('nom')
  return data ?? []
}

export async function getMachinesOpex(): Promise<any[]> {
  const { data } = await supabase.from('machines_opex').select('machine_id, annee, cout_total_ht, achats_ht, heures_productives, taux_horaire').order('annee', { ascending: false })
  if (data) return data
  // Repli pré-migration : la colonne achats_ht peut ne pas exister encore → re-sélectionne sans elle.
  const { data: d2 } = await supabase.from('machines_opex').select('machine_id, annee, cout_total_ht, heures_productives, taux_horaire').order('annee', { ascending: false })
  return d2 ?? []
}

// Phase E : greffe un achat machine reçu (BL) sur `achats_ht` de la machine (upsert machine × année civile).
// COLONNE DÉDIÉE `achats_ht` — jamais `cout_total_ht` (qui reste l'« OPEX annuel complet » lu par Maintenance/Finances).
// Pas de contrainte UNIQUE(machine_id, annee) → on lit la ligne, on incrémente achats_ht, sinon on insère.
// Fail-soft : renvoie { error } sans lever (l'appelant l'ignore pour ne pas bloquer la réception).
export async function upsertMachineOpexAchat(machineId: string, annee: number, montant: number): Promise<{ error: any }> {
  if (!machineId || !(Number(montant) > 0)) return { error: null }
  const an = Number(annee)
  const { data: rows, error: selErr } = await supabase
    .from('machines_opex').select('achats_ht').eq('machine_id', machineId).eq('annee', an).limit(1)
  if (selErr) return { error: selErr }
  const existing = (rows && rows[0]) || null
  if (existing) {
    const nouveau = (Number(existing.achats_ht) || 0) + Number(montant)
    const { error } = await supabase.from('machines_opex').update({ achats_ht: nouveau }).eq('machine_id', machineId).eq('annee', an)
    return { error }
  }
  const ins = await supabase.from('machines_opex').insert({ machine_id: machineId, annee: an, achats_ht: Number(montant) })
  // Filet : si cout_total_ht est encore NOT NULL (migration `drop not null` pas appliquée), on réinsère avec 0
  //   pour ne JAMAIS perdre l'achat. Une fois la migration passée, cette branche ne se déclenche plus.
  if (ins.error && String((ins.error as any).code) === '23502') {
    const retry = await supabase.from('machines_opex').insert({ machine_id: machineId, annee: an, achats_ht: Number(montant), cout_total_ht: 0 })
    return { error: retry.error }
  }
  return { error: ins.error }
}

// CAS atomique : réclame la greffe OPEX d'un BC machine (une seule fois, anti double-clic / ré-réception).
// UPDATE ... WHERE opex_greffe IS NOT TRUE : PostgREST renvoie la ligne UNIQUEMENT si on l'a réclamée le premier.
// Renvoie true = réclamé (faire la greffe) ; false = déjà greffé ; null = colonne absente (pré-migration) → l'appelant retombe sur le garde bl_id.
export async function claimBcOpexGreffe(id: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('bons_de_commande')
    .update({ opex_greffe: true })
    .eq('id', id)
    .or('opex_greffe.is.null,opex_greffe.eq.false')
    .select('id')
  if (error) return null
  return Array.isArray(data) && data.length > 0
}

// ─── Contrôles des cotes (SPC : opérateurs BDT + qualité → capabilité machine) ──
export async function getControlesCotes(): Promise<any[]> {
  const { data } = await supabase.from('controles_cotes').select('*').order('date_controle', { ascending: false })
  return data ?? []
}
export async function createControleCote(payload: Record<string, any>) {
  const { data, error } = await supabase.from('controles_cotes').insert(payload).select().single()
  return { data, error }
}
export async function deleteControleCote(id: string) {
  const { error } = await supabase.from('controles_cotes').delete().eq('id', id)
  return { error }
}

// ─── Historique du prix unitaire par référence (alimenté par les RÉPONSES RFQ — jamais par les BC) ──
export async function getRefPrixHistorique(reference: string): Promise<any[]> {
  const { data } = await supabase.from('ref_prix_historique').select('*').eq('reference', reference).order('date_prix', { ascending: true })
  return data ?? []
}
export async function getRefPrixHistoriqueAll(): Promise<any[]> {
  const { data } = await supabase.from('ref_prix_historique').select('*').order('date_prix', { ascending: false })
  return data ?? []
}
export async function createRefPrixHistorique(payload: Record<string, any>) {
  const { data, error } = await supabase.from('ref_prix_historique').insert(payload).select().single()
  return { data, error }
}

// ─── Produits fournisseurs (catalogue commercial — prix optionnel, séparé du stock) ──
export async function getProduitsFournisseursAll(): Promise<any[]> {
  const { data } = await supabase.from('produits_fournisseurs').select('*').order('reference', { ascending: true })
  return data ?? []
}
export async function getProduitsFournisseur(fournisseurId: string): Promise<any[]> {
  const { data } = await supabase.from('produits_fournisseurs').select('*').eq('fournisseur_id', fournisseurId).order('reference', { ascending: true })
  return data ?? []
}
export async function upsertProduitFournisseur(payload: Record<string, any>) {
  const { data, error } = await supabase.from('produits_fournisseurs').upsert(payload, { onConflict: 'fournisseur_id,reference' }).select().single()
  // TOUTE nouvelle référence catalogue → entrée stock vide (idempotent, best-effort) : le stock reflète le catalogue.
  if (!error && payload && payload.reference) {
    const cat = /accessoire/i.test(String(payload.categorie || '')) ? 'accessoire' : /matiere/i.test(String(payload.categorie || '')) ? 'matiere' : (payload.categorie || null)
    await ensureStockRowForRef(String(payload.reference), { designation: payload.designation, unite: payload.unite, categorie: cat, activite: payload.activite }).catch(() => {})
  }
  return { data, error }
}
// Lecture STRICTE d'un couple fournisseur + référence (lot H0, 17/09/2026) : rend l'erreur au lieu
// de la cacher — une panne ne doit jamais être prise pour « référence absente » (puis écrasée).
export async function getProduitFournisseurCouple(fournisseurId: string, reference: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('produits_fournisseurs').select('*')
    .eq('fournisseur_id', fournisseurId).eq('reference', reference).limit(1).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
// Insertion SI ABSENT (ON CONFLICT DO NOTHING) : une ligne catalogue existante n'est JAMAIS
// réécrite (prix officiel, date, source, activité, désignation). `data` = null si la ligne existait.
export async function insertProduitFournisseurSiAbsent(payload: Record<string, any>): Promise<{ data: any | null; error: any }> {
  const { data, error } = await supabase.from('produits_fournisseurs')
    .upsert(payload, { onConflict: 'fournisseur_id,reference', ignoreDuplicates: true }).select()
  const ligne = Array.isArray(data) && data.length ? data[0] : null
  if (!error && ligne && payload && payload.reference) {
    const cat = /accessoire/i.test(String(payload.categorie || '')) ? 'accessoire' : /matiere/i.test(String(payload.categorie || '')) ? 'matiere' : (payload.categorie || null)
    await ensureStockRowForRef(String(payload.reference), { designation: payload.designation, unite: payload.unite, categorie: cat, activite: payload.activite }).catch(() => {})
  }
  return { data: ligne, error }
}
// Lecture STRICTE d'une ligne catalogue par id (relecture lot H0) : le PUT compare le prix envoyé au prix
// en base avant de le « rajeunir » ; une panne ne doit pas passer pour « prix changé ».
export async function getProduitFournisseurParId(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('produits_fournisseurs').select('*').eq('id', id).limit(1).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
// Points d'historique déjà écrits par la validation d'UNE demande de prix (source rfq, bc_num = n° de la
// demande) pour une réf chez un fournisseur — lecture STRICTE : la revalidation d'une demande restée
// ouverte après un échec partiel ne doit pas dupliquer la courbe « Évolution » (relecture lot H0).
export async function getRefPrixHistoriqueRfq(reference: string, fournisseurId: string | null, numero: string | null): Promise<{ data: any[]; error: string | null }> {
  let q = supabase.from('ref_prix_historique').select('id, prix_unitaire, date_prix').eq('reference', reference).eq('source', 'rfq')
  q = fournisseurId ? q.eq('fournisseur_id', fournisseurId) : q.is('fournisseur_id', null)
  q = numero ? q.eq('bc_num', numero) : q.is('bc_num', null)
  const { data, error } = await q
  return { data: data ?? [], error: error ? error.message : null }
}
export async function updateProduitFournisseur(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('produits_fournisseurs').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ─── Catalogue fournisseurs : qté par paquet et lecture par référence (lot H1, 17/09/2026) ─────
// ⚠ COMPATIBILITÉ CLOUD : la colonne `produits_fournisseurs.qte_paquet` n'existe en ligne
//   qu'APRÈS que l'utilisateur a joué `docker/db/cloud/cloud-13-catalogue-qte-paquet.sql` à la main.
//   Règles, valables pour TOUT le code qui touche à cette colonne :
//     • LECTURE : toujours `select('*')` — la colonne manquante rend simplement `undefined` (les
//       helpers de src/prix_moyen.ts retombent alors sur l'ancien libellé `conditionnement`).
//       Ne JAMAIS la nommer dans une projection ni dans un filtre (`42703` sinon : page cassée).
//     • ÉCRITURE : passer par les helpers « tolérants » ci-dessous, qui réessaient SANS le champ
//       et signalent l'omission (`qte_paquet_ignoree`) au lieu d'échouer.
const COLONNE_ABSENTE = (e: any): boolean => {
  if (!e) return false
  const code = String((e as any).code || '')
  const msg = String((e as any).message || '')
  return code === '42703' || code === 'PGRST204' || (/qte_paquet/i.test(msg) && /(column|colonne|schema cache)/i.test(msg))
}
/** `true` si l'erreur vient de l'absence de la colonne qte_paquet (cloud sans cloud-13). */
export const erreurQtePaquetAbsente = (e: any, payload?: Record<string, any>): boolean =>
  COLONNE_ABSENTE(e) && (!payload || Object.prototype.hasOwnProperty.call(payload, 'qte_paquet'))

// Patch privé de sa seule colonne `qte_paquet`.
const sansQtePaquet = (payload: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const k of Object.keys(payload)) if (k !== 'qte_paquet') out[k] = payload[k]
  return out
}
// ⚠ Relecture du 17/09/2026 : un patch qui ne portait QUE `qte_paquet` (ex. la qté chiffrée d'une
//   réponse de demande de prix NON préférée, dans POST /api/demandes-prix/:id/valider) devenait,
//   une fois la colonne retirée, un PATCH VIDE. PostgREST ne met alors à jour aucune ligne et
//   `.single()` rend PGRST116 (« 0 rows ») : sur le cloud sans cloud-13, la validation d'une
//   demande de prix repartait en 500 « demande laissée ouverte » ALORS QUE tous les prix étaient
//   déjà écrits — et chaque revalidation refaisait la même erreur. « Plus rien à écrire » n'est pas
//   un échec : on relit simplement la ligne (pour que l'appelant ait son `data`) et on signale
//   l'omission. Une seule requête de plus, et seulement dans ce chemin dégradé.
const releveLigne = async (table: string, id: string): Promise<any> => {
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data ?? null
}

/**
 * Mise à jour d'une ligne catalogue TOLÉRANTE à l'absence de `qte_paquet` (cloud sans cloud-13) :
 * en cas d'échec sur cette seule colonne, le reste du patch est appliqué et `qte_paquet_ignoree`
 * vaut true — l'appelant l'annonce (« conditionnement non enregistré : jouez cloud-13 »).
 */
export async function updateProduitFournisseurTolerant(id: string, payload: Record<string, any>): Promise<{ data: any; error: any; qte_paquet_ignoree: boolean }> {
  const r1 = await updateProduitFournisseur(id, payload)
  if (!r1.error || !erreurQtePaquetAbsente(r1.error, payload)) return { data: r1.data, error: r1.error, qte_paquet_ignoree: false }
  const sansQte = sansQtePaquet(payload)
  if (!Object.keys(sansQte).length) return { data: await releveLigne('produits_fournisseurs', id), error: null, qte_paquet_ignoree: true }
  const r2 = await updateProduitFournisseur(id, sansQte)
  return { data: r2.data, error: r2.error, qte_paquet_ignoree: !r2.error }
}

/** Insertion SI ABSENT tolérante à l'absence de `qte_paquet` (même règle que ci-dessus). */
export async function insertProduitFournisseurSiAbsentTolerant(payload: Record<string, any>): Promise<{ data: any; error: any; qte_paquet_ignoree: boolean }> {
  const r1 = await insertProduitFournisseurSiAbsent(payload)
  if (!r1.error || !erreurQtePaquetAbsente(r1.error, payload)) return { data: r1.data, error: r1.error, qte_paquet_ignoree: false }
  const r2 = await insertProduitFournisseurSiAbsent(sansQtePaquet(payload))
  return { data: r2.data, error: r2.error, qte_paquet_ignoree: !r2.error }
}

/**
 * TOUT le catalogue, lecture STRICTE et paginée (une panne ne doit jamais passer pour « catalogue
 * vide », ce qui afficherait « aucun prix » puis proposerait de re-demander tous les prix).
 * `select('*')` : fonctionne avec ou sans la colonne `qte_paquet`.
 */
export async function getProduitsFournisseursStrict(): Promise<{ data: any[]; error: string | null }> {
  const out: any[] = []
  const PAGE = 1000
  for (let from = 0; from < 200_000; from += PAGE) {
    const { data, error } = await supabase.from('produits_fournisseurs').select('*')
      .order('reference', { ascending: true }).order('id', { ascending: true }).range(from, from + PAGE - 1)
    if (error) return { data: [], error: error.message }
    for (const p of (data ?? []) as any[]) out.push(p)
    if (!data || data.length < PAGE) break
  }
  return { data: out, error: null }
}

/**
 * Toutes les lignes catalogue d'une RÉFÉRENCE, tous fournisseurs confondus — base du prix moyen.
 * Le rapprochement se fait sur la référence NORMALISÉE (accents, casse, espaces multiples), donc
 * côté application : PostgREST ne sait pas comparer sans accents. Un premier filtre `ilike` réduit
 * le volume ; en cas d'échec de ce filtre (ou de référence à caractères spéciaux), on retombe sur
 * la lecture complète paginée. Lecture STRICTE : l'erreur est rendue, jamais avalée.
 */
export async function getProduitsFournisseursParReference(reference: string): Promise<{ data: any[]; error: string | null }> {
  const refNorm = normaliserReference(reference)
  if (!refNorm) return { data: [], error: null }
  // ⚠ RELECTURE 17/09/2026 — le pré-filtre `ilike` ne plie QUE la casse : PostgreSQL ne replie pas
  //   les diacritiques (`'Réf A' ILIKE '%ref%a%'` = faux), alors que `normaliserReference` retire les
  //   accents. Deux conséquences si l'on fait confiance au pré-filtre :
  //     • une référence dont les accents diffèrent entre la saisie et la base rendait [] SANS repli
  //       (« aucun prix » pour une réf pourtant chiffrée, et surtout garde de doublon aveugle : la
  //       ligne en double accentué était CRÉÉE, puis l'un des deux prix disparaissait de la moyenne) ;
  //     • un `\` ou un motif très permissif (référence courte) tronquait en silence à 1000 lignes.
  //   Règle désormais : le pré-filtre n'est tenté que sur une référence purement ASCII, et un
  //   résultat VIDE retombe sur la lecture complète paginée (coût négligeable : le catalogue fait
  //   quelques centaines de lignes). Le rapprochement final reste toujours applicatif et normalisé.
  const brut = String(reference || '').trim()
  const asciiSur = /^[\x20-\x7E]*$/.test(brut) && brut.indexOf('\\') < 0
  const motif = brut.replace(/[%,()*]/g, ' ').replace(/\s+/g, '%')
  if (asciiSur && motif) {
    const { data, error } = await supabase.from('produits_fournisseurs').select('*').ilike('reference', `%${motif}%`).limit(1000)
    if (!error) {
      const trouve = (data ?? []).filter((p: any) => normaliserReference(p?.reference) === refNorm)
      if (trouve.length) return { data: trouve, error: null }
      // 0 ligne : le pré-filtre a pu passer à côté (accents, troncature) → lecture complète.
    }
  }
  const tout = await getProduitsFournisseursStrict()
  if (tout.error) return { data: [], error: tout.error }
  return { data: tout.data.filter((p: any) => normaliserReference(p?.reference) === refNorm), error: null }
}
export async function deleteProduitFournisseur(id: string) {
  const { error } = await supabase.from('produits_fournisseurs').delete().eq('id', id)
  return { error }
}
export async function getProduitsSansPrix(): Promise<any[]> {
  const { data } = await supabase.from('produits_fournisseurs').select('*').is('prix', null).order('created_at', { ascending: true })
  return data ?? []
}

// ─── GED : documents (plans clients, plans CAO, programmes FAO) ──
// Fichiers dans le bucket privé Storage `ged` ; métadonnées dans la table `documents`.
export async function uploadGedFile(path: string, body: any, contentType: string) {
  const { error } = await supabase.storage.from('ged').upload(path, body, { contentType, upsert: false })
  return { error }
}
export async function signedGedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from('ged').createSignedUrl(path, expiresIn)
  return { url: data?.signedUrl ?? null, error }
}
export async function removeGedFile(path: string) {
  const { error } = await supabase.storage.from('ged').remove([path])
  return { error }
}
export async function createDocument(payload: Record<string, any>) {
  // `documents.id` est NOT NULL sans valeur par défaut : sans identifiant généré ici,
  // TOUT dépôt de fichier échoue (« null value in column "id" … violates not-null »).
  // On le fabrique côté application plutôt que de dépendre d'un défaut de base, ce qui
  // vaut aussi bien pour l'instance cloud que pour la stack Docker.
  // `actif` et `uploaded_at` n'ont pas non plus de valeur par défaut. Or getDocumentsForNom
  // filtre sur `actif = true` : un document inséré sans ce drapeau existe en base mais reste
  // introuvable — il disparaît de l'écran sans erreur, ce qui est pire qu'un échec franc.
  const row = {
    id: payload.id || crypto.randomUUID(),
    actif: true,
    uploaded_at: new Date().toISOString(),
    ...payload,
  }
  const { data, error } = await supabase.from('documents').insert(row).select().single()
  return { data, error }
}
export async function getDocument(id: string): Promise<any | null> {
  const { data } = await supabase.from('documents').select('*').eq('id', id).maybeSingle()
  return data ?? null
}
export async function getDocumentsForNom(nomenclatureId: string): Promise<any[]> {
  const { data } = await supabase.from('documents').select('*').eq('nomenclature_id', nomenclatureId).eq('actif', true).order('uploaded_at', { ascending: true })
  return data ?? []
}
export async function softDeleteDocument(id: string) {
  const { data, error } = await supabase.from('documents').update({ actif: false }).eq('id', id).select().single()
  return { data, error }
}

// ─── Maquette bâtiment (plans + marqueurs) ────────────────────
export async function getPlansBatiment(): Promise<any[]> {
  const { data } = await supabase.from('plans_batiment').select('*').eq('actif', true).order('created_at', { ascending: true })
  return data ?? []
}
export async function createPlanBatiment(payload: Record<string, any>) {
  const { data, error } = await supabase.from('plans_batiment').insert(payload).select().single()
  return { data, error }
}
export async function updatePlanBatiment(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('plans_batiment').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function getMarqueurs(planId: string): Promise<any[]> {
  const { data } = await supabase.from('plan_marqueurs').select('*').eq('plan_id', planId).order('created_at', { ascending: true })
  return data ?? []
}
export async function createMarqueur(payload: Record<string, any>) {
  const { data, error } = await supabase.from('plan_marqueurs').insert(payload).select().single()
  return { data, error }
}
export async function updateMarqueur(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('plan_marqueurs').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function deleteMarqueur(id: string) {
  const { error } = await supabase.from('plan_marqueurs').delete().eq('id', id)
  return { error }
}

// ─── Demandes de prix (RFQ) — source de vérité des prix ───────
export async function getDemandesPrix(): Promise<any[]> {
  const { data } = await supabase.from('demandes_prix').select('*').order('date_creation', { ascending: false })
  return data ?? []
}
export async function getDemandePrix(id: string): Promise<any> {
  const { data } = await supabase.from('demandes_prix').select('*').eq('id', id).single()
  return data ?? null
}
export async function getDemandePrixLignes(dpId: string): Promise<any[]> {
  const { data } = await supabase.from('demandes_prix_lignes').select('*').eq('demande_prix_id', dpId).order('created_at', { ascending: true })
  return data ?? []
}
export async function getDemandePrixReponses(dpId: string): Promise<any[]> {
  const { data } = await supabase.from('demandes_prix_reponses').select('*').eq('demande_prix_id', dpId).order('created_at', { ascending: true })
  return data ?? []
}
// Toutes les réponses (léger) → pour afficher le fournisseur de chaque RFQ dans la liste
// (chaque RFQ scindée = 1 fournisseur, porté par ses réponses puisque l'en-tête n'a pas de colonne fournisseur).
export async function getDemandesPrixReponsesAll(): Promise<any[]> {
  const { data } = await supabase.from('demandes_prix_reponses').select('demande_prix_id, fournisseur_id, fournisseur_nom, prix_unitaire')
  return data ?? []
}
export async function createDemandePrix(payload: Record<string, any>) {
  const { data, error } = await supabase.from('demandes_prix').insert(payload).select().single()
  return { data, error }
}
export async function createDemandePrixLigne(payload: Record<string, any>) {
  const { data, error } = await supabase.from('demandes_prix_lignes').insert(payload).select().single()
  return { data, error }
}
export async function createDemandePrixReponse(payload: Record<string, any>) {
  const { data, error } = await supabase.from('demandes_prix_reponses').insert(payload).select().single()
  return { data, error }
}
export async function updateDemandePrix(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('demandes_prix').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function updateDemandePrixReponse(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('demandes_prix_reponses').update(payload).eq('id', id).select().single()
  return { data, error }
}
// Réponses de demande de prix : la colonne `qte_paquet` (conditionnement chiffré par le fournisseur,
// migration 017 / cloud-13) peut manquer en cloud. Mêmes règles que pour le catalogue : on réessaie
// SANS le champ et on le signale, plutôt que de perdre la saisie du prix (lot H1, 17/09/2026).
export async function createDemandePrixReponseTolerant(payload: Record<string, any>): Promise<{ data: any; error: any; qte_paquet_ignoree: boolean }> {
  const r1 = await createDemandePrixReponse(payload)
  if (!r1.error || !erreurQtePaquetAbsente(r1.error, payload)) return { data: r1.data, error: r1.error, qte_paquet_ignoree: false }
  const r2 = await createDemandePrixReponse(sansQtePaquet(payload))
  return { data: r2.data, error: r2.error, qte_paquet_ignoree: !r2.error }
}
export async function updateDemandePrixReponseTolerant(id: string, payload: Record<string, any>): Promise<{ data: any; error: any; qte_paquet_ignoree: boolean }> {
  const r1 = await updateDemandePrixReponse(id, payload)
  if (!r1.error || !erreurQtePaquetAbsente(r1.error, payload)) return { data: r1.data, error: r1.error, qte_paquet_ignoree: false }
  const sansQte = sansQtePaquet(payload)
  // Patch réduit à rien (réponse dont on ne voulait écrire QUE la qté par paquet) : ce n'est pas un
  // échec — voir la note de `releveLigne`. Sans cela, la validation d'une demande de prix rendait
  // 500 sur le cloud sans cloud-13 alors que tous les prix catalogue étaient écrits.
  if (!Object.keys(sansQte).length) return { data: await releveLigne('demandes_prix_reponses', id), error: null, qte_paquet_ignoree: true }
  const r2 = await updateDemandePrixReponse(id, sansQte)
  return { data: r2.data, error: r2.error, qte_paquet_ignoree: !r2.error }
}
export async function deleteDemandePrix(id: string) {
  const { error } = await supabase.from('demandes_prix').delete().eq('id', id)
  return { error }
}

export async function createMachine(payload: Record<string, any>) {
  const { data, error } = await supabase.from('machines').insert(payload).select().single()
  return { data, error }
}

export async function updateMachine(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('machines').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteMachine(id: string) {
  const { error } = await supabase.from('machines').delete().eq('id', id)
  return { error }
}

// ─── Présence opérateurs (planning hebdo matin/journée/soir) ──
export async function getPresences(from?: string, to?: string): Promise<any[]> {
  let q = supabase.from('operateur_presence').select('*')
  if (from) q = q.gte('date_presence', from)
  if (to) q = q.lte('date_presence', to)
  const { data } = await q.order('date_presence')
  return data ?? []
}

export async function upsertPresence(payload: Record<string, any>) {
  const { data, error } = await supabase
    .from('operateur_presence')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'operateur_id,date_presence' })
    .select()
    .single()
  return { data, error }
}

// Présences d'une fenêtre de dates, en LECTURE STRICTE (supabase-js ne lève jamais : sans ce retour explicite, une panne
// ressemblerait à « aucune présence »). `error` non nul = lecture échouée OU tronquée par la limite de lignes de
// PostgREST : dans les deux cas l'écran ne doit PAS croire la fenêtre chargée — une case affichée vide à tort serait
// écrasée au clic suivant.
export async function getPresencesFenetre(from: string, to: string): Promise<{ data: any[] | null; error: { message: string; code?: string } | null }> {
  const { data, error, count } = await supabase
    .from('operateur_presence')
    .select('operateur_id,date_presence,shift', { count: 'exact' })
    .gte('date_presence', from).lte('date_presence', to)
    .order('date_presence').order('operateur_id')
  if (error) return { data: null, error }
  const rows = data ?? []
  if (count != null && rows.length < count) return { data: null, error: { message: `lecture tronquée (${rows.length}/${count} lignes) : fenêtre trop large` } }
  return { data: rows, error: null }
}

// Vide une case (opérateur × jour). RELIT après coup : un DELETE refusé par les droits de la base répond 204 SANS erreur
// (gotcha « toujours relire après un DELETE »). `restantes` > 0 = rien n'a été effacé.
export async function deletePresence(operateurId: string, datePresence: string): Promise<{ restantes: number | null; error: { message: string; code?: string } | null }> {
  const { error } = await supabase.from('operateur_presence').delete().eq('operateur_id', operateurId).eq('date_presence', datePresence)
  if (error) return { restantes: null, error }
  const { data, error: e2 } = await supabase.from('operateur_presence').select('id').eq('operateur_id', operateurId).eq('date_presence', datePresence)
  if (e2) return { restantes: null, error: e2 }
  return { restantes: (data ?? []).length, error: null }
}

// Lecture CIBLÉE d'un salarié (écriture d'une présence, validation d'un congé d'opérateur) — plus de select * de toute la
// table à chaque clic. { data: null, error: null } = salarié absent ; `error` = panne, jamais confondue avec « absent ».
export async function getSalarieCible(id: string): Promise<{ data: any | null; error: { message: string; code?: string } | null }> {
  const { data, error } = await supabase.from('salaries').select('id,nom,prenom,entite,est_operateur,actif').eq('id', id).maybeSingle()
  if (error) return { data: null, error }
  return { data: data ?? null, error: null }
}

// Fiche complète d'UN salarié (select * : les colonnes de solde varient selon la base), lecture STRICTE — décompte du
// solde à la validation d'un congé. { data: null, error: null } = salarié absent ; `error` = panne.
export async function getSalarieCompletCible(id: string): Promise<{ data: any | null; error: { message: string; code?: string } | null }> {
  const { data, error } = await supabase.from('salaries').select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error }
  return { data: data ?? null, error: null }
}

// BDT d'un opérateur prévus sur une période (bornes comprises, AAAA-MM-JJ), lecture CIBLÉE et STRICTE — congé validé :
// ces BDT repartent au pool. Avant : getBonsDeTravail() complet, dont une panne rendait [] (aucun BDT renvoyé, sans le dire).
export async function lireBDTOperateurPeriode(operateurId: string, debut: string, fin: string): Promise<{ data: any[]; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_travail').select('id,statut,date_prevue,operateur_id')
    .eq('operateur_id', operateurId).gte('date_prevue', debut).lte('date_prevue', fin).limit(5000)
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as any[], error: null }
}

// Lecture CIBLÉE d'un congé. Un identifiant mal formé (conges.id est un uuid sur certaines bases, code 22P02) est un
// congé introuvable, pas une panne.
export async function getCongeCible(id: string): Promise<{ data: any | null; error: { message: string; code?: string } | null }> {
  const { data, error } = await supabase.from('conges').select('*').eq('id', id).maybeSingle()
  if (error && (error as any).code === '22P02') return { data: null, error: null }
  if (error) return { data: null, error }
  return { data: data ?? null, error: null }
}

// Décision CONDITIONNELLE sur un congé : ne passe que s'il est encore au statut attendu (deux clics simultanés = une
// seule décision, donc un seul décompte du solde). { data: null, error: null } = plus au statut attendu, ou mise à jour
// refusée par les droits de la base (qui ne renvoie alors aucune ligne, sans erreur).
export async function majCongeSiStatut(id: string, statutAttendu: string, payload: Record<string, any>): Promise<{ data: any | null; error: { message: string; code?: string } | null }> {
  const { data, error } = await supabase.from('conges').update(payload).eq('id', id).eq('statut', statutAttendu).select()
  if (error) return { data: null, error }
  return { data: (data ?? [])[0] ?? null, error: null }
}

// Référentiels nécessaires aux étapes de production d'une nomenclature :
//   - machines opérationnelles (SANS aucun taux : depuis le 14/09/2026 seul le PROCESS porte un taux)
//   - process atelier + leur type (machine / manuel / oas) et leur taux machine RÉSOLU (transition comprise)
//   - coût chargé RH MOYEN des opérateurs actifs (global + par site) — jamais un taux individuel
//   - fournisseurs de sous-traitance actifs, sous-traitants, fournisseurs, postes
export async function getBeRefs() {
  const [{ data: machinesAll, error: machErr }, { data: ops, error: opsErr }, { data: st }, { data: procs, error: procErr }, { data: stReal }, { data: fournReal }, { data: postesRaw }] = await Promise.all([
    supabase.from('machines').select('*').order('nom'),   // TOUTES (arrêt compris) : la transition lit cout_h de la machine d'un process ; filtrage « arret » ci-dessous
    supabase.from('salaries').select('taux_horaire_charge, entite, actif, est_operateur').eq('actif', true).eq('est_operateur', true),
    supabase.from('fournisseurs_st').select('id, nom, operation, qualification, statut').eq('statut', 'actif').order('nom'),
    supabase.from('process_atelier').select('*').order('ordre', { ascending: true }),   // select('*') : l'absence de taux_horaire_machine = transition (cloud avant cloud-7)
    supabase.from('sous_traitants').select('id, nom, tarifs, prestations').eq('actif', true).order('nom'),
    supabase.from('fournisseurs').select('id, nom, categorie, activite, catalogue, familles_fourniture').eq('actif', true).order('nom'),
    supabase.from('postes').select('*').order('ordre', { ascending: true, nullsFirst: false }).order('nom').then((r: any) => r, () => ({ data: [] }))   // select('*') immunise si colonnes absentes ; ordre pour le glisser-déposer. fail-soft (migration postes peut ne pas être passée)
  ])
  const tx = construireTauxAtelier((procs ?? []) as any[], (ops ?? []) as any[], (machinesAll ?? []) as any[])
  const hp = tx.hommeParSite
  const tauxErreurs: string[] = []
  if (opsErr) tauxErreurs.push('salariés : ' + opsErr.message)
  if (procErr) tauxErreurs.push('process : ' + procErr.message)
  if (machErr) tauxErreurs.push('machines : ' + machErr.message)   // la transition (cloud avant cloud-7) lit cout_h de la machine
  return {
    machines: ((machinesAll ?? []) as any[]).filter((m: any) => m.statut != null && m.statut !== 'arret').map((m: any) => ({   // = l'ancien .neq('statut','arret') (qui écarte aussi les statuts NULL)
      id:         m.id,
      nom:        m.nom,
      code:       m.code,
      activite:   m.activite,
      categorie:  m.categorie,
      statut:     m.statut,
      cnc:        !!m.cnc,
      poste_id:   m.poste_id ?? null,
    })),
    // Coût chargé RH moyen des opérateurs actifs (null = aucun ; AUCUN repli inventé). manquant = aucun du tout.
    taux_homme: { moyen: hp.moyen, seem: hp.seem, semrac: hp.semrac, manquant: tx.hommeManquant },
    // ⚠ ALIAS TRANSITOIRE (lu par be.tsx) — à retirer quand plus aucun écran ne le lit. Mêmes moyennes, 0 si aucune.
    taux_operateur: {
      moyen:  hp.moyen ?? 0,
      seem:   hp.seem ?? hp.moyen ?? 0,
      semrac: hp.semrac ?? hp.moyen ?? 0,
    },
    taux_erreur: tauxErreurs.length ? tauxErreurs.join(' · ') : null,
    fournisseurs_st: st ?? [],
    // Process internes (lien machine direct ou manuel) — poste_id = poste de rattachement (filtre du choix de process)
    process_atelier: ((procs ?? []) as any[]).map((p: any) => {
      const tm = tx.tauxMachine(p.id)
      return {
        id: p.id, nom: p.nom, code: p.code, activite: p.activite, categorie: p.categorie,
        requiert_machine: p.requiert_machine !== false, machine_id: p.machine_id ?? null, poste_id: p.poste_id ?? null, statut: p.statut,
        est_oas: p.est_oas === true,   // traitement de surface : facturé au prix, jamais au temps
        type: typeProcess(p),                                   // 'machine' | 'manuel' | 'oas' (règle unique shared.ts)
        taux_horaire_machine: p.taux_horaire_machine ?? null,   // valeur BRUTE saisie (null = à saisir, ou colonne absente)
        taux_machine: tm.taux,                                  // taux RÉSOLU utilisé par le calcul (0 si manuel/oas/manquant)
        taux_source: tm.source,                                 // 'process' | 'transition_machine' | 'manquant' | 'manuel' | 'oas'
      }
    }),
    // Postes d'atelier (conteneurs de machines/process) → alimentent le select « Poste » de la gamme
    postes: (postesRaw ?? []).filter((p: any) => p.statut !== 'inactif').map((p: any) => ({
      id: p.id, nom: p.nom, code: p.code ?? null, activite: p.activite ?? null, couleur: p.couleur ?? null
    })),
    // Sous-traitants réels + leurs tarifs par opération [{operation, forfait_ht, prix_unitaire_piece_ht}]
    sous_traitants: (stReal ?? []).map((s: any) => ({
      id: s.id, nom: s.nom,
      tarifs: Array.isArray(s.tarifs) ? s.tarifs : [],
      prestations: Array.isArray(s.prestations) ? s.prestations : []
    })),
    // Fournisseurs réels + leur catalogue [{ref, designation, categorie, prix_moyen_ht, qte_paquet/quantite_unitaire, ...}]
    fournisseurs: (fournReal ?? []).map((f: any) => ({
      id: f.id, nom: f.nom, categorie: f.categorie || null, activite: f.activite || 'both',
      familles_fourniture: Array.isArray(f.familles_fourniture) ? f.familles_fourniture : [],
      catalogue: parseCatalogueRaw(f.catalogue)
    }))
  }
}

// Parse un catalogue jsonb qui peut être un tableau, ou (héritage) une string JSON, ou {items:[...]}
function parseCatalogueRaw(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    try { const o = JSON.parse(raw); return Array.isArray(o) ? o : (o && Array.isArray(o.items) ? o.items : []) } catch (_e) { return [] }
  }
  return []
}

// OTD fournisseur/ST : % de réceptions (BL) arrivées ≤ date de livraison promise du BC.
//  methode 'bc_bl'      → toutes les réceptions ; 'paiement_bl' → seulement les BC dont la proforma est payée.
export async function computeOtd(type: 'fournisseur' | 'sous_traitant', id: string, methode: string = 'bc_bl') {
  const col = type === 'sous_traitant' ? 'sous_traitant_id' : 'fournisseur_id'
  // select('*') = fail-soft si date_livraison_initiale/date_reception_reelle absentes (pré-migration)
  const { data: bcs } = await supabase.from('bons_de_commande').select('*').eq(col, id)
  const list = (bcs ?? []).filter((b: any) => b.date_livraison || b.date_livraison_initiale)
  if (list.length === 0) return { pct: null as number | null, n_total: 0, n_ontime: 0 }
  const ids = list.map((b: any) => b.id)
  const [{ data: bls }, facsRes] = await Promise.all([
    supabase.from('bons_de_livraison').select('bc_id, date_bl').in('bc_id', ids),
    methode === 'paiement_bl'
      ? supabase.from('factures_fournisseur').select('bc_id, date_paiement').in('bc_id', ids)
      : Promise.resolve({ data: [] as any[] })
  ])
  const recByBc: Record<string, string> = {}
  ;(bls ?? []).forEach((l: any) => {
    if (l.date_bl && l.bc_id) { const d = String(l.date_bl).slice(0, 10); if (!recByBc[l.bc_id] || d > recByBc[l.bc_id]) recByBc[l.bc_id] = d }
  })
  const proformaPaid: Record<string, boolean> = {}
  ;((facsRes as any).data ?? []).forEach((f: any) => { if (f.bc_id && f.date_paiement) proformaPaid[f.bc_id] = true })
  let total = 0, ontime = 0
  list.forEach((b: any) => {
    // arrivée réelle = date_reception_reelle si posée, sinon date du BL de réception le plus tardif
    const rec = b.date_reception_reelle ? String(b.date_reception_reelle).slice(0, 10) : recByBc[b.id]
    if (!rec) return
    if (methode === 'paiement_bl' && !proformaPaid[b.id]) return
    // OTD FIGÉ : comparé à la 1ʳᵉ date prévue (date_livraison_initiale), pas à une date repoussée
    const promesse = String(b.date_livraison_initiale || b.date_livraison || '').slice(0, 10)
    total++
    if (promesse && rec <= promesse) ontime++
  })
  return { pct: total ? Math.round((ontime / total) * 100) : null, n_total: total, n_ontime: ontime }
}

export async function getShifts(): Promise<Shift[]> {
  const { data } = await supabase.from('shifts').select('*')
  return data ?? []
}

export async function getAbsences(): Promise<Absence[]> {
  const { data } = await supabase.from('absences').select('*').order('date_absence')
  return data ?? []
}

export async function getDemandesTravaux(): Promise<DemandeTravaux[]> {
  const { data } = await supabase
    .from('demandes_travaux')
    .select('*')
    .order('date_dt', { ascending: false })
  return data ?? []
}

export async function getDemandeTravaux(id: string): Promise<DemandeTravaux | null> {
  const { data } = await supabase
    .from('demandes_travaux')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getOffres(): Promise<Offre[]> {
  const { data } = await supabase
    .from('offres')
    .select('*')
    .order('date_offre', { ascending: false })
  return data ?? []
}

export async function getCommandes(): Promise<Commande[]> {
  const { data } = await supabase
    .from('commandes')
    .select('*')
    .order('date_cmd', { ascending: false })
  return data ?? []
}

export async function getLots(): Promise<Lot[]> {
  const { data } = await supabase.from('lots').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getLot(id: string): Promise<any | null> {
  const { data } = await supabase.from('lots').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

export async function updateLot(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('lots').update(payload).eq('id', id).select().single()
  return { data, error }
}
// Colonnes de traçabilité de libération présentes ? (absentes tant que lot_liberation.sql non joué)
export async function lotHasLibCols(): Promise<boolean> {
  const { error } = await supabase.from('lots').select('libere_le').limit(1)
  return !error
}

export async function getBonsDeTravail(): Promise<BonDeTravail[]> {
  const { data } = await supabase
    .from('bons_de_travail')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getBonsDeTravailByCommande(cmdId: string): Promise<BonDeTravail[]> {
  const { data } = await supabase
    .from('bons_de_travail')
    .select('*')
    .eq('cmd_id', cmdId)
    .order('created_at')
  return data ?? []
}

export async function getCredits(): Promise<Credit[]> {
  const { data } = await supabase
    .from('credits')
    .select('*')
    .order('date_credit', { ascending: false })
  return data ?? []
}

export async function getDemandesAchat(): Promise<DemandeAchat[]> {
  const { data } = await supabase
    .from('demandes_achat')
    .select('*')
    .order('date_da', { ascending: false })
  return data ?? []
}

// ── Portes qualité : helpers canoniques (unifient les définitions divergentes) ──
// Un statut de NC est « clos » → ne bloque plus l'expédition.
// « Soldé » = statut de clôture de la liste Qualité (NC_STATUTS_LISTE, qref.ts) ; `sold[ée](?!r)` n'attrape pas « à solder ».
export function ncEstClose(s: any): boolean { return /sold[ée](?!r)|clotur|clôtur|ferm|clos|libér|liber|rejet|résolu|resolu|trait|annul/i.test(String(s || '')) }
// Gravité bloquante = Critique ou Bloquante (la gravité est choisie par l'opérateur au soldage).
export function ncEstBloquante(g: any): boolean { return /critique|bloquante/i.test(String(g || '')) }
// Rattachement FIABLE d'une NC à une commande/affaire : affaire_id → num_affaire → repli sous-chaîne lot_ref.
export function ncRattacheeAffaire(n: any, cmd: any): boolean {
  const aff = String(cmd?.num_affaire ?? cmd?.id ?? '')
  if (n?.affaire_id && cmd?.affaire_id && String(n.affaire_id) === String(cmd.affaire_id)) return true
  if (n?.num_affaire && aff && String(n.num_affaire) === aff) return true
  if (aff && String(n?.lot_ref || '').indexOf(aff) !== -1) return true
  return false
}
export async function getNonConformites(): Promise<NonConformite[]> {
  const { data } = await supabase
    .from('non_conformites')
    .select('*')
    .order('date_nc', { ascending: false })
  return data ?? []
}

export async function getBonsDeLivraison(): Promise<BonDeLivraison[]> {
  const { data } = await supabase
    .from('bons_de_livraison')
    .select('*')
    .order('date_bl', { ascending: false })
  return data ?? []
}

export async function getHabilitations(): Promise<Habilitation[]> {
  const { data } = await supabase.from('habilitations').select('*')
  return data ?? []
}

export async function getFournisseursSt(): Promise<FournisseurSt[]> {
  const { data } = await supabase.from('fournisseurs_st').select('*').order('nom')
  return data ?? []
}

// ─── ÉCRITURE ─────────────────────────────────────────────────

export async function createDemandeTravaux(payload: Partial<DemandeTravaux>) {
  const { data, error } = await supabase
    .from('demandes_travaux')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateDemandeTravaux(id: string, payload: Partial<DemandeTravaux>) {
  const { data, error } = await supabase
    .from('demandes_travaux')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function createOffre(payload: Partial<Offre>) {
  const { data, error } = await supabase
    .from('offres')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateOffre(id: string, payload: Partial<Offre>) {
  const { data, error } = await supabase
    .from('offres')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteOffre(id: string) {
  const { error } = await supabase.from('offres').delete().eq('id', id)
  return { error }
}

export async function createCommande(payload: Partial<Commande>) {
  const { data, error } = await supabase
    .from('commandes')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateCommande(id: string, payload: Partial<Commande>) {
  const { data, error } = await supabase
    .from('commandes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Recalcule l'avancement d'une commande depuis ses BDT (lien souple : cmd_id | cmd_ref | num_affaire,
// car les BDT générés depuis la nomenclature portent cmd_ref/num_affaire mais pas toujours cmd_id).
// Met à jour commandes.bdt_total / bdt_soldes et passe à 'termine' les lots entièrement soldés.
// 100% non bloquant : toute erreur est avalée (cascade best-effort après soldage / BL).
export async function recomputeCmdAvancement(ref: string | null | undefined): Promise<void> {
  if (!ref) return
  try {
    const lc = (s: any) => String(s ?? '').toLowerCase()
    const { data: cmds } = await supabase.from('commandes').select('id, num_affaire, statut')
    const cmd = (cmds ?? []).find((x: any) => String(x.id) === String(ref) || String(x.num_affaire) === String(ref))
    if (!cmd) return
    const aff = String((cmd as any).num_affaire ?? (cmd as any).id)
    // ⚠ Réconciliation clé-lot : les BDT de la cascade ne portent que lot_ref → on regroupe par lot_id ?? lot_ref
    //   (= lots.id). Sans ça byLot était vide et les lots/commandes ne passaient jamais « terminé ».
    const lotKey = (b: any) => String((b?.lot_id ?? b?.lot_ref ?? '') || '')
    const { data: bdts } = await supabase.from('bons_de_travail').select('id, statut, lot_id, lot_ref, cmd_id, cmd_ref, num_affaire')
    const mine = (bdts ?? []).filter((b: any) =>
      String(b.cmd_id ?? '') === String((cmd as any).id) || String(b.cmd_ref ?? '') === aff || String(b.num_affaire ?? '') === aff)
    const total = mine.length
    const soldes = mine.filter((b: any) => /sold/.test(lc(b.statut))).length
    // Statut commande au fil du soldage (ne JAMAIS régresser un statut avancé/terminal).
    const cur = lc((cmd as any).statut)
    const AVANCES = ['terminee', 'termine', 'livree', 'livre', 'facturee', 'facture', 'cloturee', 'cloture', 'annulee', 'annule', 'solde', 'soldee']
    const patch: any = { bdt_total: total, bdt_soldes: soldes, updated_at: new Date().toISOString() }
    if (total > 0 && soldes === total && !AVANCES.includes(cur)) patch.statut = 'terminee'
    else if (soldes > 0 && soldes < total && ['a_programmer', 'a_planifier', 'planifie', 'en_attente', 'nouvelle', ''].includes(cur)) patch.statut = 'en_production'
    await supabase.from('commandes').update(patch).eq('id', (cmd as any).id)
    const byLot: Record<string, any[]> = {}
    for (const b of mine) { const k = lotKey(b); if (k) (byLot[k] = byLot[k] || []).push(b) }
    for (const [lotId, arr] of Object.entries(byLot)) {
      if (arr.length && arr.every((b: any) => /sold/.test(lc(b.statut)))) {
        await supabase.from('lots').update({ statut: 'termine', updated_at: new Date().toISOString() }).eq('id', lotId)
      }
    }
  } catch { /* non bloquant */ }
}

// Coût de revient RÉEL d'une commande : homme + machine (BDT) + matière sortie + sous-traitance ; + marge réelle (CA facturé − coût).
// Isolé de recomputeCmdAvancement : si les colonnes cout_reel/marge_reelle n'existent pas encore (interop_schema.sql),
// l'update échoue silencieusement sans casser l'avancement.

// Taux de l'atelier (14/09/2026) — coût horaire porté par le PROCESS (shared.ts : construireTauxAtelier).
//   process   : select('*') — l'absence de la colonne taux_horaire_machine déclenche la transition (machines.cout_h)
//   salariés  : TOUS (le taux individuel de l'opérateur d'un BDT sert au coût réel, même s'il a quitté l'atelier) ;
//               les MOYENNES (coût estimé) ne retiennent que les opérateurs actifs (filtre dans construireTauxAtelier)
//   machines  : id, cout_h — transition uniquement
// ⚠ supabase-js ne lève jamais : une lecture en échec est REMONTÉE dans `error`, jamais confondue avec « aucun taux ».
export async function getTauxAtelier(): Promise<{ tx: TauxAtelier; salById: Record<string, any>; error: string | null }> {
  const [pr, sa, ma] = await Promise.all([
    supabase.from('process_atelier').select('*'),
    supabase.from('salaries').select('id, taux_horaire_charge, entite, actif, est_operateur'),
    supabase.from('machines').select('id, cout_h'),
  ])
  const erreurs: string[] = []
  if (pr.error) erreurs.push('process_atelier : ' + pr.error.message)
  if (sa.error) erreurs.push('salaries : ' + sa.error.message)
  if (ma.error) erreurs.push('machines : ' + ma.error.message)
  const salById: Record<string, any> = {}
  for (const s of ((sa.data ?? []) as any[])) salById[String(s.id)] = s
  const tx = construireTauxAtelier((pr.data ?? []) as any[], (sa.data ?? []) as any[], (ma.data ?? []) as any[])
  return { tx, salById, error: erreurs.length ? erreurs.join(' · ') : null }
}

// Coût RÉEL des BDT (règle unique : shared.ts coutReelBdt) — homme au taux chargé de l'opérateur, TOUJOURS ;
// machine au taux du process du BDT si ce process est de type machine. Plus aucun 45/50 ni taux issu de l'OPEX.
export async function computeAtelierRates() {
  const { tx, salById, error } = await getTauxAtelier()
  return { tx, salById, error, coutBdt: (b: any) => coutReelBdt(b, tx, salById) }
}
export async function recomputeCmdCout(ref: string | null | undefined): Promise<void> {
  if (!ref) return
  try {
    const lc = (s: any) => String(s ?? '').toLowerCase()
    const { data: cmds } = await supabase.from('commandes').select('id, num_affaire')
    const cmd = (cmds ?? []).find((x: any) => String(x.id) === String(ref) || String(x.num_affaire) === String(ref))
    if (!cmd) return
    const aff = String((cmd as any).num_affaire ?? (cmd as any).id)
    const { data: bdts, error: bdtErr } = await supabase.from('bons_de_travail').select('temps_reel, duree, machine_id, process_id, operateur_id, activite, lot_id, lot_ref, cmd_id, cmd_ref, num_affaire')
    // Lecture en échec (BDT ou taux) : on n'écrit PAS un coût faux (supabase-js ne lève jamais).
    if (bdtErr) { console.warn('recomputeCmdCout : lecture des BDT impossible — ' + bdtErr.message); return }
    const mine = (bdts ?? []).filter((b: any) => String(b.cmd_id ?? '') === String((cmd as any).id) || String(b.cmd_ref ?? '') === aff || String(b.num_affaire ?? '') === aff)
    const rates = await computeAtelierRates()
    if (rates.error) { console.warn('recomputeCmdCout : taux atelier illisibles — ' + rates.error); return }
    let mo = 0, mach = 0
    const lotIds = new Set<string>()
    const manquants = new Set<string>()
    for (const b of mine) {
      // Coût RÉEL (shared.ts coutReelBdt) : homme (opérateur) toujours + machine si process machine.
      const cb = rates.coutBdt(b)
      mo += cb.coutHomme
      mach += cb.coutMachine
      for (const m of cb.manquants) manquants.add(m)
      // Réconciliation clé-lot : lot_id ?? lot_ref (= lots.id = mouvements_stock.lot_id) → la matière est enfin comptée.
      const k = String(((b as any).lot_id ?? (b as any).lot_ref ?? '') || ''); if (k) lotIds.add(k)
    }
    let matiere = 0
    if (lotIds.size) {
      const [{ data: mvts }, { data: stock }] = await Promise.all([
        supabase.from('mouvements_stock').select('quantite, type, lot_id, article_id'),
        supabase.from('stock').select('id, reference, prix_achat_ht'),
      ])
      const priceOf = (id: any) => { const s = (stock ?? []).find((x: any) => String(x.id) === String(id) || String(x.reference) === String(id)); return s ? Number((s as any).prix_achat_ht) || 0 : 0 }
      for (const m of (mvts ?? [])) {
        if (lc((m as any).type) !== 'sortie') continue
        if (!lotIds.has(String((m as any).lot_id))) continue
        matiere += (Number((m as any).quantite) || 0) * priceOf((m as any).article_id)
      }
    }
    // Coût sous-traitance RÉEL = Σ montant_ht des BC sous-traitant de l'affaire (dépense réellement engagée).
    let coutST = 0
    try {
      const { data: bcs } = await supabase.from('bons_de_commande').select('montant_ht, type_bc, num_affaire, cmd_ref')
      coutST = (bcs ?? []).filter((x: any) => /sous|st/i.test(String(x.type_bc || '')) && (String(x.num_affaire ?? '') === aff || String(x.cmd_ref ?? '') === aff || String(x.cmd_ref ?? '') === String((cmd as any).id))).reduce((s: number, x: any) => s + (Number(x.montant_ht) || 0), 0)
    } catch {}
    const coutReel = Math.round((mo + mach + matiere + coutST) * 100) / 100
    const { data: facs } = await supabase.from('factures_client').select('montant_ht, cmd_id')
    const caFac = (facs ?? []).filter((f: any) => String(f.cmd_id ?? '') === String((cmd as any).id)).reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0)
    const patch: any = { cout_reel: coutReel }
    if (caFac > 0) patch.marge_reelle = Math.round((caFac - coutReel) * 100) / 100
    // Coût INCOMPLET (taux machine à saisir, coût chargé RH absent, BDT machine sans process) : la part manquante vaut 0,
    // le coût serait sous-évalué et la marge surévaluée — et marge_reelle nourrit l'alerte Direction « Marge faible ».
    // Aucune colonne ne porte le drapeau : on écrit « non calculable » (null) plutôt qu'une valeur fausse. La raison
    // reste visible en direct sur la fiche Commande 360 (kpi.manquants).
    if (manquants.size) {
      patch.cout_reel = null
      patch.marge_reelle = null
      console.warn(`recomputeCmdCout ${aff} : coût réel incomplet (${Array.from(manquants).join(', ')}) — cout_reel et marge_reelle laissés vides`)
    }
    await supabase.from('commandes').update(patch).eq('id', (cmd as any).id)
  } catch { /* non bloquant : colonnes peut-être absentes */ }
}

// ─── Fiche Commande 360 : coûts/marge réels + traçabilité production agrégée ──
// Mêmes liens souples que recompute* (cmd_id | cmd_ref | num_affaire). On renvoie un
// objet prêt à afficher : KPI (budget/CA/coût/marge/avancement) + listes BDT/lots/matières/factures/NC.
export async function getCommandeDetail(cmdId: string) {
  const lc = (s: any) => String(s ?? '').toLowerCase()
  const { data: cmds } = await supabase.from('commandes').select('*')
  const cmd = (cmds ?? []).find((x: any) => String(x.id) === String(cmdId) || String(x.num_affaire) === String(cmdId))
  if (!cmd) return { cmd: null as any }
  const aff = String((cmd as any).num_affaire ?? (cmd as any).id)
  const isMine = (b: any) => String(b.cmd_id ?? '') === String((cmd as any).id) || String(b.cmd_ref ?? '') === aff || String(b.num_affaire ?? '') === aff
  const [{ data: bdtsAll }, { data: lotsAll }, { data: facsAll }, { data: ncsAll }, { data: stock }, { data: mvtsAll }, { data: pvsAll }, { data: bcAll }] = await Promise.all([
    supabase.from('bons_de_travail').select('*'),
    supabase.from('lots').select('*'),
    supabase.from('factures_client').select('*'),
    supabase.from('non_conformites').select('*'),
    supabase.from('stock').select('id, reference, prix_achat_ht'),
    supabase.from('mouvements_stock').select('*'),
    supabase.from('pv_controle').select('*'),
    supabase.from('bons_de_commande').select('montant_ht, type_bc, num_affaire, cmd_ref'),
  ])
  const bdts = (bdtsAll ?? []).filter(isMine)
  const lots = (lotsAll ?? []).filter((l: any) => String(l.cmd_id ?? '') === String((cmd as any).id))
  const lotIds = new Set<string>(lots.map((l: any) => String(l.id)))
  for (const b of bdts) { const k = String(((b as any).lot_id ?? (b as any).lot_ref ?? '') || ''); if (k) lotIds.add(k) }
  const factures = (facsAll ?? []).filter((f: any) => String(f.cmd_id ?? '') === String((cmd as any).id))
  const ncs = (ncsAll ?? []).filter((n: any) => lotIds.has(String(n.lot_ref)))
  const pvs = (pvsAll ?? []).filter((p: any) => lotIds.has(String((p as any).lot_id)))
  // Coût RÉEL (même règle que recomputeCmdCout → fiche 360 = cockpit, aucune divergence) :
  //   heures homme = Σ t (toujours) ; heures machine = Σ t des BDT dont le process est de type machine.
  const rates = await computeAtelierRates()
  let moH = 0, machH = 0, coutMoAcc = 0, coutMachAcc = 0
  const manquantsCout = new Set<string>()
  const typeBdt: Record<string, string> = {}
  for (const b of bdts) {
    const cb = rates.coutBdt(b)
    moH += cb.hommeH; machH += cb.machineH
    coutMoAcc += cb.coutHomme; coutMachAcc += cb.coutMachine
    for (const m of cb.manquants) manquantsCout.add(m)
    typeBdt[String((b as any).id)] = cb.typeProcess
  }
  const priceOf = (id: any) => { const s = (stock ?? []).find((x: any) => String(x.id) === String(id) || String(x.reference) === String(id)); return s ? Number((s as any).prix_achat_ht) || 0 : 0 }
  const mvts = (mvtsAll ?? []).filter((m: any) => lc((m as any).type) === 'sortie' && lotIds.has(String((m as any).lot_id)))
  let matiere = 0
  const matieres = mvts.map((m: any) => { const pu = priceOf((m as any).article_id); const total = (Number((m as any).quantite) || 0) * pu; matiere += total; return { article: (m as any).article_nom || (m as any).article_id, quantite: Number((m as any).quantite) || 0, pu: +pu.toFixed(2), total: +total.toFixed(2), date: String((m as any).date_mvt || (m as any).created_at || '').slice(0, 10), bdt_id: (m as any).bdt_id || null } })
  // Coût sous-traitance réel = Σ BC sous-traitant de l'affaire.
  const coutSt = +(((bcAll ?? []) as any[]).filter((x: any) => /sous|st/i.test(String(x.type_bc || '')) && (String(x.num_affaire ?? '') === aff || String(x.cmd_ref ?? '') === aff || String(x.cmd_ref ?? '') === String((cmd as any).id))).reduce((s: number, x: any) => s + (Number(x.montant_ht) || 0), 0)).toFixed(2)
  // Taux illisibles (panne ≠ absence, supabase-js ne lève jamais) : homme, machine, coût réel et marge NON calculés
  // (null) — même règle que recomputeCmdCout, qui n'écrit rien dans ce cas. Jamais un 0 présenté comme réel.
  const coutMat = +matiere.toFixed(2)
  const coutMo: number | null = rates.error ? null : +coutMoAcc.toFixed(2)
  const coutMach: number | null = rates.error ? null : +coutMachAcc.toFixed(2)
  const coutReel: number | null = (coutMo == null || coutMach == null) ? null : +(coutMo + coutMach + coutMat + coutSt).toFixed(2)
  const caFacture = factures.reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0)
  const budget = Number((cmd as any).montant) || 0
  const base = caFacture > 0 ? caFacture : budget
  const marge = (base > 0 && coutReel != null) ? +(base - coutReel).toFixed(2) : null
  const margePct = (base > 0 && marge != null) ? +(marge / base * 100).toFixed(1) : null
  const bdtTotal = bdts.length, bdtSoldes = bdts.filter((b: any) => /sold/.test(lc(b.statut))).length
  return {
    cmd: { id: (cmd as any).id, num_affaire: (cmd as any).num_affaire, client_nom: (cmd as any).client_nom, montant: budget, statut: (cmd as any).statut, date_cmd: (cmd as any).date_cmd, date_liv: (cmd as any).date_liv },
    kpi: { budget, caFacture: +caFacture.toFixed(2), coutReel, coutMo, coutMach, coutMat, marge, margePct, avancement: bdtTotal > 0 ? Math.round(bdtSoldes / bdtTotal * 100) : 0, bdtTotal, bdtSoldes, moH: +moH.toFixed(1), machH: +machH.toFixed(1), manquants: Array.from(manquantsCout), tauxErreur: rates.error },
    bdts: bdts.slice(0, 200).map((b: any) => ({ id: b.id, piece: b.piece, operation: b.operation, machine: typeBdt[String(b.id)] === 'machine' ? 'machine' : 'mo', statut: b.statut, duree: Number(b.duree) || 0, temps_reel: b.temps_reel != null ? Number(b.temps_reel) : null, operateur_id: b.operateur_id ?? null, operateur_nom: b.operateur_nom ?? null, lot_id: b.lot_id ?? null })),
    lots: lots.slice(0, 100).map((l: any) => ({ id: l.id, piece: l.piece, qte: Number(l.qte) || 0, statut: l.statut, nc: (ncsAll ?? []).filter((n: any) => String(n.lot_ref) === String(l.id)).length })),
    factures: factures.map((f: any) => ({ num: f.num_facture || f.id, montant_ht: Number(f.montant_ht) || 0, statut: f.statut, date: String(f.date_facture || f.created_at || '').slice(0, 10) })),
    matieres: matieres.slice(0, 100),
    ncs: ncs.slice(0, 50).map((n: any) => ({ id: n.id, type: n.type_nc, gravite: n.gravite, statut: n.statut, lot: n.lot_ref, date: n.date_nc })),
    pvs: pvs.slice(0, 50).map((p: any) => ({ num: p.num_pv || p.id, type: p.type_controle, statut: p.statut, decision: p.decision, date: p.date_pv, cpk: p.cpk, lot: p.lot_id })),
  }
}

// ─── Fiche Client 360 : CA / marge / encours / commandes / factures / offres ──
export async function getClientDetail(clientId: string) {
  const lc = (s: any) => String(s ?? '').toLowerCase().trim()
  const { data: cls } = await supabase.from('clients').select('*')
  const cl = (cls ?? []).find((x: any) => String(x.id) === String(clientId))
  if (!cl) return { client: null as any }
  const nom = lc((cl as any).nom)
  const mine = (x: any) => String(x.client_id ?? '') === String((cl as any).id) || (nom && lc(x.client_nom) === nom)
  const [{ data: cmds }, { data: facs }, { data: offres }, { data: credits }] = await Promise.all([
    supabase.from('commandes').select('*'),
    supabase.from('factures_client').select('*'),
    supabase.from('offres').select('*'),
    supabase.from('credits').select('*'),
  ])
  const myCmds = (cmds ?? []).filter(mine)
  const myFacs = (facs ?? []).filter(mine)
  const myOffres = (offres ?? []).filter(mine)
  const myCredits = (credits ?? []).filter(mine)
  const caFacture = myFacs.reduce((s: number, f: any) => s + (Number(f.montant_ht) || 0), 0)
  const impaye = myFacs.filter((f: any) => f.statut !== 'payee' && f.date_echeance).reduce((s: number, f: any) => s + (Number(f.montant_ttc) || 0), 0)
  const marge = myCmds.reduce((s: number, c: any) => s + (Number(c.marge_reelle) || 0), 0)
  const offresGagnees = myOffres.filter((o: any) => /accept|gagn|valid|command/.test(lc(o.statut))).length
  const offresPerdues = myOffres.filter((o: any) => /perdu|refus|annul|expir/.test(lc(o.statut))).length
  const soldeCredit = myCredits.reduce((s: number, c: any) => s + (Number(c.solde) || 0), 0)
  const caParAn: Record<string, number> = {}
  for (const f of myFacs) { const y = String((f as any).date_facture || '').slice(0, 4); if (y) caParAn[y] = (caParAn[y] || 0) + (Number((f as any).montant_ht) || 0) }
  // Conditions commerciales « courantes » du client : mode de livraison de sa DERNIÈRE offre portant une livraison
  //   (la livraison vit sur l'offre ; on l'affiche sur la fiche comme terme courant, MAJ à chaque édition d'offre).
  const offresTri = [...myOffres].sort((a: any, b: any) => String(b.date_offre || b.created_at || '').localeCompare(String(a.date_offre || a.created_at || '')))
  const derniereOffreLiv = offresTri.find((o: any) => o.mode_livraison)
  const modeLivraison = derniereOffreLiv ? String((derniereOffreLiv as any).mode_livraison) : ''
  return {
    client: cl,
    modeLivraison,
    kpi: {
      caFacture: Math.round(caFacture), impaye: Math.round(impaye), marge: Math.round(marge),
      nbCmd: myCmds.length, nbFac: myFacs.length, offresGagnees, offresPerdues,
      soldeCredit: Math.round(soldeCredit), creditMontant: Number((cl as any).credit_montant) || 0,
    },
    caParAn,
    commandes: myCmds.slice(0, 40).map((c: any) => ({ id: c.id, num: c.num_affaire || c.id, montant: Number(c.montant) || 0, statut: c.statut, marge: c.marge_reelle != null ? Number(c.marge_reelle) : null, date: c.date_cmd, dateLiv: c.date_liv })),
    factures: myFacs.slice(0, 40).map((f: any) => ({ num: f.num_facture || f.id, ht: Number(f.montant_ht) || 0, ttc: Number(f.montant_ttc) || 0, statut: f.statut, ech: f.date_echeance, retard: !!(f.date_echeance && f.statut !== 'payee' && String(f.date_echeance) < new Date().toISOString().slice(0, 10)) })),
  }
}

// ─── Fiche AFFAIRE 360 : tout le circuit d'un num_affaire (DT → offre → commande → production → livraison → facture → NC → avoirs) ──
// Agrège par `num_affaire` (le fil conducteur dénormalisé ; la table `affaires` est vide/inutilisable).
// Réutilise getCommandeDetail pour la partie production/facture/NC de chaque commande de l'affaire.
export async function getAffaireDetail(numAffaire: string) {
  const num = String(numAffaire ?? '').trim()
  if (!num) return { num: '', found: false, client: '', dts: [], offres: [], cmds: [], cmdDetails: [], credits: [], bls: [], kpi: {} as any }
  const [dtR, offR, cmdR, credR] = await Promise.all([
    supabase.from('demandes_travaux').select('*').eq('num_affaire', num),
    supabase.from('offres').select('*').eq('num_affaire', num),
    supabase.from('commandes').select('*').eq('num_affaire', num),
    supabase.from('credits').select('*').eq('num_affaire', num),
  ])
  const dts = dtR.data ?? [], offres = offR.data ?? [], cmds = cmdR.data ?? [], credits = credR.data ?? []
  // Détail complet par commande (réutilise l'agrégateur existant : bdts/lots/factures/matieres/ncs + kpi)
  const cmdDetails: any[] = []
  for (const cm of cmds) { const d = await getCommandeDetail(String((cm as any).id)).catch(() => null); if (d && (d as any).cmd) cmdDetails.push(d) }
  // Résolution du nom de l'opérateur ayant réalisé chaque BDT (operateur_id → nom)
  try {
    const ops = await getOperateurs()
    const opMap: Record<string, string> = {}
    ;(ops as any[]).forEach((o: any) => { if (o && o.id != null) opMap[String(o.id)] = o.nom || String(o.id) })
    cmdDetails.forEach((d: any) => (d.bdts || []).forEach((b: any) => { b.operateur = b.operateur_nom || opMap[String(b.operateur_id ?? '')] || (b.operateur_id != null ? String(b.operateur_id) : '') }))
  } catch { /* non bloquant */ }
  // Bons de livraison de l'affaire (BL n'a pas de num_affaire → via la commande : cmd_ref / cmd_id)
  // ── Fabricabilité lot par lot ────────────────────────────────────────────
  // Depuis le 09/09/2026 la porte de production se joue AU LOT et non plus à l'affaire.
  // On annote donc chaque lot avec ce qui le bloque, pour que la fiche affaire montre
  // noir sur blanc ce qui peut partir en fabrication et ce qui attend encore.
  try {
    const { data: prepAll } = await supabase.from('preparations_techniques').select('*')
    const prepOuvLot = new Set<string>(), prepOuvAff = new Set<string>()
    for (const p of ((prepAll ?? []) as any[])) {
      if (String(p.statut) === 'faite') continue
      const cmd = String(p.cmd_ref || '').trim(), pc = String(p.piece || '').toLowerCase().trim()
      if (cmd && pc) prepOuvLot.add(cmd + '|' + pc); else prepOuvAff.add(String(p.num_affaire || ''))
    }
    for (const d of cmdDetails) {
      const cmdId = String((d as any).cmd?.id ?? '')
      const aff = String((d as any).cmd?.num_affaire ?? num)
      for (const l of (((d as any).lots ?? []) as any[])) {
        const pc = String(l.piece || '').toLowerCase().trim()
        const bdtsLot = (((d as any).bdts ?? []) as any[])
          .filter((b: any) => String(b.lot_ref ?? '') === String(l.id) || String(b.piece || '').toLowerCase().trim() === pc)
        const raisons: string[] = []
        if (prepOuvLot.has(cmdId + '|' + pc) || prepOuvAff.has(aff)) raisons.push('préparation technique')
        if (bdtsLot.length && bdtsLot.every((b: any) => b.matiere_ok === false)) raisons.push('matière non réceptionnée')
        l.blocages = raisons
        l.pret = raisons.length === 0
      }
    }
  } catch { /* table absente ou indisponible : la fiche s'affiche sans l'indicateur */ }

  const cmdIdSet = new Set(cmds.map((c: any) => String(c.id)))
  let bls: any[] = []
  if (cmds.length) {
    const { data: blAll } = await supabase.from('bons_de_livraison').select('*')
    bls = (blAll ?? []).filter((b: any) => cmdIdSet.has(String(b.cmd_ref ?? '')) || cmdIdSet.has(String(b.cmd_id ?? '')) || String(b.cmd_ref ?? '') === num || String(b.num_affaire ?? '') === num)
  }
  const client = String(((dts[0] as any) || (offres[0] as any) || (cmds[0] as any) || (credits[0] as any) || {}).client_nom ?? '')
  const montantOffre = offres.reduce((s: number, o: any) => s + (Number(o.montant) || 0), 0)
  const montantCmd = cmds.reduce((s: number, c: any) => s + (Number(c.montant) || 0), 0)
  const caFacture = cmdDetails.reduce((s: number, d: any) => s + (Number(d.kpi?.caFacture) || 0), 0)
  // Coût réel de l'affaire : non calculable (null) si les taux d'UNE commande sont illisibles ; données de coût
  // manquantes (taux à saisir, coût chargé RH absent…) remontées pour être affichées.
  const tauxErreur: string | null = (cmdDetails.find((d: any) => d.kpi?.tauxErreur) as any)?.kpi?.tauxErreur ?? null
  const manquantsAff = Array.from(new Set<string>(cmdDetails.flatMap((d: any) => (d.kpi?.manquants ?? []) as string[])))
  const coutReel: number | null = tauxErreur ? null : cmdDetails.reduce((s: number, d: any) => s + (Number(d.kpi?.coutReel) || 0), 0)
  const bdtTotal = cmdDetails.reduce((s: number, d: any) => s + (Number(d.kpi?.bdtTotal) || 0), 0)
  const bdtSoldes = cmdDetails.reduce((s: number, d: any) => s + (Number(d.kpi?.bdtSoldes) || 0), 0)
  const nbNc = cmdDetails.reduce((s: number, d: any) => s + ((d.ncs || []).length), 0)
  const nbFactures = cmdDetails.reduce((s: number, d: any) => s + ((d.factures || []).length), 0)
  const nbLots = cmdDetails.reduce((s: number, d: any) => s + ((d.lots || []).length), 0)
  const base = caFacture > 0 ? caFacture : (montantCmd > 0 ? montantCmd : montantOffre)
  const marge = (base > 0 && coutReel != null) ? +(base - coutReel).toFixed(2) : null
  const margePct = (base > 0 && marge != null) ? +((marge as number) / base * 100).toFixed(1) : null
  const avancement = bdtTotal > 0 ? Math.round(bdtSoldes / bdtTotal * 100) : 0
  return {
    num, found: (dts.length + offres.length + cmds.length) > 0, client,
    dts, offres, cmds, cmdDetails, credits, bls,
    kpi: { montantOffre: +montantOffre.toFixed(2), montantCmd: +montantCmd.toFixed(2), caFacture: +caFacture.toFixed(2), coutReel: coutReel == null ? null : +coutReel.toFixed(2), marge, margePct,
      manquants: manquantsAff, tauxErreur, avancement, bdtTotal, bdtSoldes, nbNc, nbFactures, nbLots, soldeAvoirs: credits.reduce((s: number, c: any) => s + (Number(c.solde) || 0), 0) },
  }
}

// ─── Drill-down Lot 360 : cascade qualité (BDT→PV→NC→8D→quarantaine) + coût engagé ──
export async function getLotDetail(lotId: string) {
  const lc = (s: any) => String(s ?? '').toLowerCase()
  const [{ data: bdts }, { data: pvs }, { data: ncs }, { data: quar }, { data: r8d }, { data: mvts }, { data: stock }] = await Promise.all([
    supabase.from('bons_de_travail').select('*'),
    supabase.from('pv_controle').select('*'),
    supabase.from('non_conformites').select('*'),
    supabase.from('quarantaines').select('*'),
    supabase.from('rapports_8d').select('*'),
    supabase.from('mouvements_stock').select('*'),
    supabase.from('stock').select('id, reference, prix_achat_ht'),
  ])
  const myBdt = (bdts ?? []).filter((b: any) => String(b.lot_id ?? '') === String(lotId) || String(b.lot_ref ?? '') === String(lotId))
  const myPv = (pvs ?? []).filter((p: any) => String(p.lot_id ?? '') === String(lotId))
  const myNc = (ncs ?? []).filter((n: any) => String(n.lot_ref ?? '') === String(lotId))
  const myQuar = (quar ?? []).filter((q: any) => String(q.lot_id ?? '') === String(lotId))
  const ncIds = new Set(myNc.map((n: any) => String(n.id)))
  const my8d = (r8d ?? []).filter((r: any) => ncIds.has(String(r.nc_id ?? '')) || String(r.lot_ref ?? '') === String(lotId))
  // Coût RÉEL (même règle que recomputeCmdCout / getCommandeDetail : shared.ts coutReelBdt).
  const rates = await computeAtelierRates()
  let moH = 0, machH = 0, coutMoAcc = 0, coutMachAcc = 0
  const manquantsCout = new Set<string>()
  for (const b of myBdt) {
    const cb = rates.coutBdt(b)
    moH += cb.hommeH; machH += cb.machineH
    coutMoAcc += cb.coutHomme; coutMachAcc += cb.coutMachine
    for (const m of cb.manquants) manquantsCout.add(m)
  }
  const priceOf = (id: any) => { const s = (stock ?? []).find((x: any) => String(x.id) === String(id) || String(x.reference) === String(id)); return s ? Number((s as any).prix_achat_ht) || 0 : 0 }
  const myMvt = (mvts ?? []).filter((m: any) => lc((m as any).type) === 'sortie' && String((m as any).lot_id ?? '') === String(lotId))
  let matiere = 0
  const matieres = myMvt.map((m: any) => { const pu = priceOf(m.article_id); const total = (Number(m.quantite) || 0) * pu; matiere += total; return { article: m.article_nom || m.article_id, quantite: Number(m.quantite) || 0, total: +total.toFixed(2), date: String(m.date_mvt || m.created_at || '').slice(0, 10) } })
  // Taux illisibles (panne ≠ absence) : homme et machine NON calculés (null) plutôt qu'un 0 présenté comme réel.
  const coutMO = rates.error ? null : Math.round(coutMoAcc), coutMach = rates.error ? null : Math.round(coutMachAcc), coutMat = Math.round(matiere)
  const ncBloq = myNc.filter((n: any) => ['Critique', 'Bloquante'].includes(n.gravite)).length
  const enQuar = myQuar.filter((q: any) => !/lib|sort|clos|leve/i.test(lc(q.statut))).length
  return {
    kpi: {
      coutMO, coutMach, coutMat, coutEngage: (coutMO == null || coutMach == null) ? null : coutMO + coutMach + coutMat,
      nbBDT: myBdt.length, nbBDTSoldes: myBdt.filter((b: any) => /sold/.test(lc(b.statut))).length,
      nbPV: myPv.length, nbNC: myNc.length, ncBloq, enQuar, nb8d: my8d.length,
      moH: +moH.toFixed(1), machH: +machH.toFixed(1),
      manquants: Array.from(manquantsCout), tauxErreur: rates.error,
    },
    pvs: myPv.slice(0, 20).map((p: any) => ({ num: p.num_pv || p.id, type: p.type_controle, statut: p.statut, decision: p.decision, date: p.date_pv, cpk: p.cpk })),
    ncs: myNc.slice(0, 20).map((n: any) => ({ id: n.id, gravite: n.gravite, statut: n.statut, type: n.type_nc, date: n.date_nc })),
    quarantaines: myQuar.slice(0, 20).map((q: any) => ({ id: q.id, statut: q.statut, motif: q.motif || q.raison, date: q.date_quarantaine || q.created_at })),
    r8d: my8d.slice(0, 10).map((r: any) => ({ num: r.num_8d || r.id, statut: r.statut, responsable: r.responsable })),
    matieres: matieres.slice(0, 30),
  }
}

// ─── Génération automatique d'écritures comptables (partie double, anti-doublon par pièce/journal) ──
async function _ecrituresPour(piece: string, journal: string, lignes: any[]): Promise<void> {
  try {
    const { data: ex } = await supabase.from('ecritures_comptables').select('id').eq('piece', String(piece)).eq('journal', journal).limit(1)
    if (ex && ex.length) return   // déjà généré
    const today = new Date().toISOString().slice(0, 10)
    for (const l of lignes) {
      if ((Number(l.debit) || 0) === 0 && (Number(l.credit) || 0) === 0) continue
      await supabase.from('ecritures_comptables').insert({ journal, piece: String(piece), date_ecriture: today, valide: true, ...l })
    }
  } catch { /* non bloquant */ }
}
// Vente (VTE) : 411 client (débit TTC) / 707 vente (crédit HT) / 44571 TVA collectée (crédit)
export async function genEcritureVente(fac: any): Promise<void> {
  const ht = Number(fac?.montant_ht) || 0
  const ttc = Number(fac?.montant_ttc) || ht
  const tva = Number(fac?.montant_tva) || Math.max(0, ttc - ht)
  if (ttc <= 0) return
  const num = String(fac?.num_facture || fac?.id || ''), cli = String(fac?.client_nom || '')
  await _ecrituresPour(num, 'VTE', [
    { compte: '411000', libelle: 'Client ' + cli + ' — ' + num, debit: ttc, credit: 0 },
    { compte: '707000', libelle: 'Vente ' + num, debit: 0, credit: ht },
    { compte: '445710', libelle: 'TVA collectée ' + num, debit: 0, credit: tva },
  ])
}
// Achat (ACH) : 607 achat (débit HT) / 44566 TVA déductible (débit) / 401 fournisseur (crédit TTC)
export async function genEcritureAchat(fac: any): Promise<void> {
  const ht = Number(fac?.montant_ht) || 0
  const ttc = Number(fac?.montant_ttc) || ht
  const tva = Number(fac?.montant_tva) || Math.max(0, ttc - ht)
  if (ttc <= 0) return
  const num = String(fac?.num_facture || fac?.id || ''), four = String(fac?.fournisseur_nom || '')
  // code de compte NU (le champ porte souvent "606300 – Énergie") pour un Grand Livre / FEC corrects
  const compteCharge = (String(fac?.compte_charge || '').match(/\d{3,}/) || ['607000'])[0]
  await _ecrituresPour(num, 'ACH', [
    { compte: compteCharge, libelle: 'Achat ' + four + ' — ' + num, debit: ht, credit: 0 },
    { compte: '445660', libelle: 'TVA déductible ' + num, debit: tva, credit: 0 },
    { compte: '401000', libelle: 'Fournisseur ' + four + ' — ' + num, debit: 0, credit: ttc },
  ])
}
// Règlement (BQ) à l'encaissement : trésorerie (512 banque / 531 caisse si espèces) débit TTC / 411 client crédit TTC.
//   Sans ça le 411 client n'est jamais soldé au FEC (balance faussée).
export async function genEcritureReglement(fac: any): Promise<void> {
  const ttc = Number(fac?.montant_ttc) || Number(fac?.montant_ht) || 0
  if (ttc <= 0) return
  const num = String(fac?.num_facture || fac?.id || ''), cli = String(fac?.client_nom || '')
  const compteTreso = String(fac?.mode_paiement || '').toLowerCase().includes('espece') ? '531000' : '512000'
  await _ecrituresPour(num, 'BQ', [
    { compte: compteTreso, libelle: 'Règlement ' + cli + ' — ' + num, debit: ttc, credit: 0 },
    { compte: '411000', libelle: 'Règlement client ' + cli + ' — ' + num, debit: 0, credit: ttc },
  ])
}

export async function updateBonDeTravail(id: string, payload: Partial<BonDeTravail>) {
  const { data, error } = await supabase
    .from('bons_de_travail')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function createDemandeAchat(payload: Partial<DemandeAchat>) {
  const { data, error } = await supabase
    .from('demandes_achat')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateDemandeAchat(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from('demandes_achat')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function getDemandeAchat(id: string): Promise<any | null> {
  const { data } = await supabase.from('demandes_achat').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

// ─── Préparations techniques (générées à l'acceptation d'une offre) ───
export async function getPreparationsTechniques(): Promise<any[]> {
  const { data, error } = await supabase.from('preparations_techniques').select('*').order('created_at', { ascending: false })
  if (error) { console.error('getPreparationsTechniques', error.message); return [] }
  return data ?? []
}
export async function createPreparationTechnique(payload: Record<string, any>) {
  const { data, error } = await supabase.from('preparations_techniques').insert(payload).select().single()
  return { data, error }
}
export async function updatePreparationTechnique(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase.from('preparations_techniques').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return { data, error }
}

// Résout une référence d'affaire (id ou « AFF-AAAA-NNN ») vers l'id réel de la table affaires.
// Renvoie null si introuvable — évite les violations de clé étrangère affaire_id.
export async function resolveAffaireId(ref?: string | null): Promise<string | null> {
  if (!ref) return null
  const raw = String(ref).trim()
  if (!raw) return null
  const byId = await supabase.from('affaires').select('id').eq('id', raw).maybeSingle()
  if (byId.data?.id) return byId.data.id
  const m = raw.match(/(\d{4}).*?(\d{1,5})\s*$/)
  if (m) {
    const annee = parseInt(m[1], 10), numero = parseInt(m[2], 10)
    const byNum = await supabase.from('affaires').select('id').eq('annee', annee).eq('numero', numero).maybeSingle()
    if (byNum.data?.id) return byNum.data.id
  }
  return null
}

export async function createNonConformite(payload: Partial<NonConformite>) {
  const { data, error } = await supabase
    .from('non_conformites')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateNonConformite(id: string, payload: Partial<NonConformite>) {
  const { data, error } = await supabase
    .from('non_conformites')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function createBonDeLivraison(payload: Partial<BonDeLivraison>) {
  const { data, error } = await supabase
    .from('bons_de_livraison')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateBonDeLivraison(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from('bons_de_livraison')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function getBonDeCommande(id: string): Promise<any | null> {
  const { data } = await supabase.from('bons_de_commande').select('*').eq('id', id).maybeSingle()
  return data ?? null
}
// ─── BON DE COMMANDE : lecture et transition STRICTES (réception fournisseur, lot D 14/09/2026) ───
// `getBonDeCommande` rend null sur une panne : la réception confondait alors « base injoignable »
// et « BC introuvable ». Ici l'échec remonte.
export async function getBonDeCommandeStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_commande').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
// Mise à jour CONDITIONNELLE : le BC ne bouge que s'il est encore dans l'état lu (statut…). Deux
// réceptions simultanées du même BC ⇒ la seconde voit `conflit` au lieu de créer un second BL.
export async function majBonDeCommandeSi(id: string, payload: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null; conflit: boolean }> {
  let r: any = supabase.from('bons_de_commande').update(payload).eq('id', id)
  for (const [k, v] of Object.entries(attendu)) r = (v === null) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.select()
  if (error) return { data: null, error: error.message, code: (error as any).code ?? null, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, code: null, conflit: rows.length === 0 }
}
// La colonne accuse_fournisseur_le existe-t-elle ? (gate « validation fournisseur » du BC ;
// absente tant que la migration bc_accuse_fournisseur.sql n'a pas été jouée, ex. sur Cloudflare).
export async function bcHasAckColumn(): Promise<boolean> {
  const { error } = await supabase.from('bons_de_commande').select('accuse_fournisseur_le').limit(1)
  return !error
}

export async function createCredit(payload: Partial<Credit>) {
  const { data, error } = await supabase
    .from('credits')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateCredit(id: string, payload: Partial<Credit>) {
  const { data, error } = await supabase.from('credits').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteCredit(id: string) {
  const { error } = await supabase.from('credits').delete().eq('id', id)
  return { error }
}

// Avoirs « en cours » d'un client (solde > 0, non clôturés) — rattachement client_id sinon nom.
export async function getCreditsEnCoursForClient(clientId: string | null | undefined, clientNom: string | null | undefined): Promise<Credit[]> {
  const all = await getCredits().catch(() => [] as Credit[])
  const nom = String(clientNom || '').trim().toLowerCase()
  return (all as any[])
    .filter((c: any) => c.statut !== 'cloture' && (Number(c.solde) || 0) > 0
      && ((clientId && String(c.client_id ?? '') === String(clientId)) || (nom && String(c.client_nom || '').trim().toLowerCase() === nom)))
    .sort((a: any, b: any) => String(a.date_credit || '').localeCompare(String(b.date_credit || '')))   // plus ancien d'abord
}

// ── Commandes prioritaires (issues d'un retour client accepté en relance) ──
export async function getCommandesPrioritaires(): Promise<any[]> {
  const { data } = await supabase.from('commandes_prioritaires').select('*').order('created_at', { ascending: false })
  return data ?? []
}
export async function createCommandePrioritaire(payload: Record<string, any>) {
  const { data, error } = await supabase.from('commandes_prioritaires').insert(payload).select().single()
  return { data, error }
}
export async function updateCommandePrioritaire(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('commandes_prioritaires').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function createLot(payload: Record<string, any>) {
  const { data, error } = await supabase.from('lots').insert(payload).select().single()
  return { data, error }
}

// ─── PRODUITS COMMANDÉS PAR UN CLIENT (fiche client) ──────────────────────────
// Croise 3 sources pour chaque référence achetée par le client :
//   • references_clients → réf interne ↔ réf client ↔ plan (+ doc GED ouvrable)
//   • nomenclatures       → DÉSIGNATION du produit (aucune désignation n'est stockée
//                           ni sur references_clients ni sur pieces_detail)
//   • demandes_travaux    → N° d'AFFAIRES du client portant cette référence
//                           (un même produit peut revenir sur plusieurs affaires)
// Union répertoire + DT : une réf vue en DT mais absente du répertoire reste visible.
export async function getClientProduits(clientId: string): Promise<any[]> {
  const lc = (s: any) => String(s ?? '').toLowerCase().trim()
  const { data: cls } = await supabase.from('clients').select('id,nom').eq('id', clientId).limit(1)
  const cl = (cls ?? [])[0] as any
  if (!cl) return []
  const nom = lc(cl.nom)
  const [refsR, dtsR, nomsR] = await Promise.all([
    supabase.from('references_clients').select('*').eq('client_id', String(cl.id)),
    supabase.from('demandes_travaux').select('id,num_affaire,client_id,client_nom,pieces_detail,created_at'),
    supabase.from('nomenclatures').select('id,code_ref_produit,description'),
  ])
  const mine = (x: any) => String(x.client_id ?? '') === String(cl.id) || (!!nom && lc(x.client_nom) === nom)
  const myDts = ((dtsR.data ?? []) as any[]).filter(mine)
  const desc = new Map<string, string>()
  for (const n of ((nomsR.data ?? []) as any[])) {
    const k = lc(n.code_ref_produit)
    if (k && n.description) desc.set(k, String(n.description))
  }
  const map = new Map<string, any>()
  const touch = (code: any) => {
    const k = lc(code)
    if (!k) return null
    if (!map.has(k)) map.set(k, { code_ref_interne: String(code).trim(), ref_client: '', num_plan: '', plan_doc_id: null, designation: desc.get(k) || '', affaires: new Set<string>() })
    return map.get(k)
  }
  for (const r of ((refsR.data ?? []) as any[])) {
    const e = touch(r.code_ref_interne); if (!e) continue
    if (r.ref_client) e.ref_client = r.ref_client
    if (r.num_plan) e.num_plan = r.num_plan
    if (r.plan_doc_id) e.plan_doc_id = r.plan_doc_id
  }
  for (const d of myDts) {
    const pcs = Array.isArray(d.pieces_detail) ? d.pieces_detail : []
    for (const p of pcs) {
      const e = touch(p?.ref_interne); if (!e) continue
      if (!e.ref_client && p?.ref_client) e.ref_client = p.ref_client
      if (!e.num_plan && p?.nom_plan) e.num_plan = p.nom_plan
      if (d.num_affaire) e.affaires.add(String(d.num_affaire))
    }
  }
  return Array.from(map.values())
    .map(e => ({ ...e, affaires: Array.from(e.affaires as Set<string>).sort() }))
    .sort((a, b) => String(a.code_ref_interne).localeCompare(String(b.code_ref_interne)))
}

// Version GLOBALE (TOUS les clients, avec leurs champs complets) pour l'export — indexée.
// Renvoie chaque client même sans produit commandé (produits = []).
export async function getClientsProduitsAll(): Promise<Array<{ client: any; produits: any[] }>> {
  const lc = (s: any) => String(s ?? '').toLowerCase().trim()
  const [clsR, refsR, dtsR, nomsR] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('references_clients').select('*'),
    supabase.from('demandes_travaux').select('id,num_affaire,client_id,client_nom,pieces_detail'),
    supabase.from('nomenclatures').select('id,code_ref_produit,description'),
  ])
  const clients = (clsR.data ?? []) as any[]
  const desc = new Map<string, string>()
  for (const n of ((nomsR.data ?? []) as any[])) { const k = lc(n.code_ref_produit); if (k && n.description) desc.set(k, String(n.description)) }
  const refsByClient = new Map<string, any[]>()
  for (const r of ((refsR.data ?? []) as any[])) { const k = String(r.client_id ?? ''); if (!k) continue; (refsByClient.get(k) || refsByClient.set(k, []).get(k))!.push(r) }
  const dtsById = new Map<string, any[]>(); const dtsByNom = new Map<string, any[]>()
  for (const d of ((dtsR.data ?? []) as any[])) {
    const k = String(d.client_id ?? ''); if (k) (dtsById.get(k) || dtsById.set(k, []).get(k))!.push(d)
    const kn = lc(d.client_nom); if (kn) (dtsByNom.get(kn) || dtsByNom.set(kn, []).get(kn))!.push(d)
  }
  const out: Array<{ client: any; produits: any[] }> = []
  for (const cl of clients) {
    const nom = lc(cl.nom)
    const map = new Map<string, any>()
    const touch = (code: any) => { const k = lc(code); if (!k) return null; if (!map.has(k)) map.set(k, { code_ref_interne: String(code).trim(), ref_client: '', num_plan: '', designation: desc.get(k) || '', affaires: new Set<string>() }); return map.get(k) }
    for (const r of (refsByClient.get(String(cl.id)) || [])) { const e = touch(r.code_ref_interne); if (!e) continue; if (r.ref_client) e.ref_client = r.ref_client; if (r.num_plan) e.num_plan = r.num_plan }
    const myDts = [...(dtsById.get(String(cl.id)) || []), ...(nom ? (dtsByNom.get(nom) || []) : [])]
    for (const d of myDts) { const pcs = Array.isArray(d.pieces_detail) ? d.pieces_detail : []; for (const p of pcs) { const e = touch(p?.ref_interne); if (!e) continue; if (!e.ref_client && p?.ref_client) e.ref_client = p.ref_client; if (!e.num_plan && p?.nom_plan) e.num_plan = p.nom_plan; if (d.num_affaire) e.affaires.add(String(d.num_affaire)) } }
    const produits = Array.from(map.values()).map((p: any) => ({ code_ref_interne: p.code_ref_interne, ref_client: p.ref_client, num_plan: p.num_plan, designation: p.designation, affaires: Array.from(p.affaires as Set<string>).sort() }))
    out.push({ client: cl, produits })   // TOUS les clients, même sans produit
  }
  return out
}

// ─── Répertoire références clients : réf interne ↔ client ↔ réf client ↔ plan ───
// Sert 3 surfaces : DT (auto-recherche bidirectionnelle), nomenclature (clients de la pièce), fiche client (produits commandés).
export async function getReferencesClients(filters: { code_ref_interne?: string; client_id?: string; ref_client?: string } = {}): Promise<any[]> {
  let q = supabase.from('references_clients').select('*')
  if (filters.code_ref_interne) q = q.ilike('code_ref_interne', String(filters.code_ref_interne))
  if (filters.client_id) q = q.eq('client_id', String(filters.client_id))
  if (filters.ref_client) q = q.ilike('ref_client', String(filters.ref_client))
  const { data } = await q.order('updated_at', { ascending: false })
  return data ?? []
}
// Upsert « logique » : une ligne par (réf interne, client). Met à jour la réf client / le plan si ça change.
export async function upsertReferenceClient(payload: Record<string, any>) {
  const code = String(payload.code_ref_interne || '').trim()
  if (!code) return { data: null, error: { message: 'code_ref_interne requis' } as any }
  // Charge TOUTES les lignes de cette réf (sans pré-filtrer par client_id : sinon une ligne
  // saisie manuellement — client_id null — reste invisible et on crée un doublon).
  const existing = (await getReferencesClients({ code_ref_interne: code })) as any[]
  const eqTxt = (a: any, b: any) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
  let match: any
  if (payload.client_id) {
    // 1) la ligne du même client ; 2) sinon une ligne « orpheline » (sans client_id, ex. ajout
    //    manuel) du même client (réf client ou nom identique) → on la PROMEUT (pas de doublon).
    match = existing.find((r) => String(r.client_id || '') === String(payload.client_id))
    if (!match) match = existing.find((r) => !r.client_id && (
      (payload.ref_client && eqTxt(r.ref_client, payload.ref_client)) ||
      (payload.client_nom && eqTxt(r.client_nom, payload.client_nom))
    ))
  } else {
    match = payload.ref_client ? existing.find((r) => eqTxt(r.ref_client, payload.ref_client)) : undefined
  }
  if (match) {
    // Ne jamais écraser une valeur déjà renseignée par du vide : une DT re-sauvée sans plan
    // ne doit pas effacer un plan déjà connu. On ne met à jour que les champs fournis non vides
    // (le plan « s'actualise » quand il est ajouté, et reste sinon).
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const [k, v] of Object.entries(payload)) {
      if (k === 'code_ref_interne' || k === 'id') continue
      if (v === null || v === undefined || String(v).trim() === '') continue
      patch[k] = v
    }
    const { data, error } = await supabase.from('references_clients')
      .update(patch).eq('id', match.id).select().single()
    return { data, error }
  }
  const { data, error } = await supabase.from('references_clients').insert(payload).select().single()
  return { data, error }
}
export async function deleteReferenceClient(id: string) {
  const { error } = await supabase.from('references_clients').delete().eq('id', id)
  return { error }
}

// ─── Verrous d'édition (verrouillage pessimiste générique) ───────
export async function getEditLock(resource: string): Promise<any> {
  const { data } = await supabase.from('edit_locks').select('*').eq('resource', resource).limit(1)
  return (data && data[0]) || null
}
export async function upsertEditLock(payload: Record<string, any>) {
  const { data, error } = await supabase.from('edit_locks').upsert(payload, { onConflict: 'resource' }).select().single()
  return { data, error }
}
export async function deleteEditLock(resource: string) {
  const { error } = await supabase.from('edit_locks').delete().eq('resource', resource)
  return { error }
}
export async function getActiveEditLocks(): Promise<any[]> {
  const { data } = await supabase.from('edit_locks').select('*')
  return data ?? []
}

// Génère un id texte unique (clients.id est text NOT NULL sans défaut) :
// CL-<plus grand suffixe numérique existant + 1>, fallback CL-<timestamp>.
async function nextClientId(): Promise<string> {
  try {
    const { data } = await supabase.from('clients').select('id')
    let max = 0
    ;(data ?? []).forEach((r: any) => {
      // Ne considère que les ids séquentiels « CL-NNN » (< 100000) ; ignore les codes
      // clients importés (ex. CL-4102026) pour ne pas faire sauter la séquence.
      const m = String(r.id || '').match(/^CL-0*(\d+)$/)
      if (m) { const n = parseInt(m[1], 10); if (n > max && n < 100000) max = n }
    })
    return 'CL-' + String(max + 1).padStart(3, '0')
  } catch {
    return 'CL-' + Date.now()
  }
}

export async function createClient(payload: Partial<Client>) {
  const id = (payload as any).id && String((payload as any).id).trim()
    ? String((payload as any).id).trim()
    : await nextClientId()
  const { data, error } = await supabase
    .from('clients')
    .insert({ credits: 0, credit_montant: 0, ...payload, id })
    .select()
    .single()
  return { data, error }
}

export async function updateClient(id: string, patch: Partial<Client>) {
  const { id: _omit, ...rest } = patch as any
  const { data, error } = await supabase
    .from('clients')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  return { error }
}

export async function searchClients(q: string): Promise<Client[]> {
  const { data } = await supabase
    .from('clients')
    .select('id, nom, contact, poste, email, tel, adresse, mode_facturation, siret, credits, credit_montant')
    .ilike('nom', `%${q}%`)
    .order('nom')
    .limit(30)
  return data ?? []
}

// ─── DEMANDES SITE INTERNET ───────────────────────────────────

export async function getDemandesSite(): Promise<DemandeSite[]> {
  const { data } = await supabase
    .from('demandes_site')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createDemandeSite(payload: {
  nom: string
  prenom?: string
  email: string
  telephone?: string
  societe?: string
  type_demande: string
  message: string
  priorite?: string
}) {
  const { data, error } = await supabase
    .from('demandes_site')
    .insert({ ...payload, statut: 'nouveau' })
    .select()
    .single()
  return { data, error }
}

export async function updateDemandeSite(id: string, payload: Partial<DemandeSite>) {
  const { data, error } = await supabase
    .from('demandes_site')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── OAS ──────────────────────────────────────────────────────

export async function getBalancelles(): Promise<Balancelle[]> {
  const { data } = await supabase
    .from('balancelles')
    .select('*')
    .order('date_entree', { ascending: false })
  return data ?? []
}

export async function createBalancelle(payload: Omit<Balancelle, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('balancelles')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateBalancelle(id: string, payload: Partial<Balancelle>) {
  const { data, error } = await supabase
    .from('balancelles')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function getRelevesEau(): Promise<ReleveEau[]> {
  const { data } = await supabase
    .from('releves_eau')
    .select('*')
    .order('date_releve', { ascending: false })
  return data ?? []
}

export async function getRelevesBains(): Promise<ReleveBain[]> {
  const { data } = await supabase
    .from('releves_bains')
    .select('*')
    .order('date_releve', { ascending: false })
  return data ?? []
}

export async function createReleveEau(payload: Record<string, any>) {
  const { data, error } = await supabase.from('releves_eau').insert(payload).select().single()
  return { data, error }
}

export async function createReleveBain(payload: Record<string, any>) {
  const { data, error } = await supabase.from('releves_bains').insert(payload).select().single()
  return { data, error }
}

export async function getBonsDeTravailOAS(): Promise<BonDeTravail[]> {
  const { data } = await supabase
    .from('bons_de_travail')
    .select('*')
    .eq('operation', 'Oxydation anodique sulfurique')
    .in('statut', ['a_programmer', 'programme', 'recu'])
    .order('created_at', { ascending: false })
  return data ?? []
}

// ─── QUALITÉ ──────────────────────────────────────────────────

export async function getPVControles(): Promise<PVControle[]> {
  const { data } = await supabase.from('pv_controle').select('*').order('date_pv', { ascending: false })
  return data ?? []
}

export async function createPVControle(payload: Partial<PVControle>) {
  const { data, error } = await supabase.from('pv_controle').insert(payload).select().single()
  return { data, error }
}

export async function updatePVControle(id: string, payload: Partial<PVControle>) {
  const { data, error } = await supabase.from('pv_controle').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getQuarantaines(): Promise<Quarantaine[]> {
  const { data } = await supabase.from('quarantaines').select('*').order('date_mise_quarantaine', { ascending: false })
  return data ?? []
}

export async function createQuarantaine(payload: Partial<Quarantaine>) {
  const { data, error } = await supabase.from('quarantaines').insert(payload).select().single()
  return { data, error }
}

export async function updateQuarantaine(id: string, payload: Partial<Quarantaine>) {
  const { data, error } = await supabase.from('quarantaines').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ─── QUARANTAINE : lecture et transitions STRICTES (décision fournisseur, migration 008) ───
// `getQuarantaines` avale l'erreur (data ?? []) : pour une décision IRRÉVERSIBLE, il faut
// distinguer « lot introuvable » de « base injoignable ».
export async function getQuarantaineStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('quarantaines').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
// Mise à jour CONDITIONNELLE : la ligne ne bouge que si elle est encore dans l'état attendu
// (statut 'en_cours', retour pas encore expédié…). Deux clics simultanés ⇒ le second voit `conflit`
// au lieu de rejouer les effets (entrée en stock, avoir, décrément du BC).
export async function majQuarantaineSi(id: string, payload: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null; conflit: boolean }> {
  let r: any = supabase.from('quarantaines').update(payload).eq('id', id)
  for (const [k, v] of Object.entries(attendu)) r = (v === null) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.select()
  if (error) return { data: null, error: error.message, code: (error as any).code ?? null, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, code: null, conflit: rows.length === 0 }
}
// Les colonnes de la décision existent-elles ? (migration 008 Docker / script cloud-6)
export async function quarantaineDecisionDispo(): Promise<boolean> {
  const { error } = await supabase.from('quarantaines').select('issue').limit(1)
  return !error
}

// ─── AVOIRS FOURNISSEURS / SOUS-TRAITANTS (service Achats, migration 008) ───
// Ce que NOS fournisseurs et sous-traitants nous doivent — à ne pas confondre avec `credits`,
// les avoirs CLIENTS (service Commercial). Aucune suppression : un avoir s'annule (statut + motif).
const _avfAbsente = (e: any) => {
  if (!e) return false
  if (e.code === '42P01' || e.code === 'PGRST205') return true
  const m = String(e.message || '')
  return /avoirs_fournisseurs/.test(m) && !/column/i.test(m) && /(relation .*does not exist|could not find the table)/i.test(m)
}
export async function getAvoirsFournisseurs(): Promise<{ data: any[]; error: string | null; absente: boolean }> {
  const { data, error } = await supabase.from('avoirs_fournisseurs').select('*').order('created_at', { ascending: false })
  if (error) return { data: [], error: error.message, absente: _avfAbsente(error) }
  return { data: data ?? [], error: null, absente: false }
}
export async function getAvoirFournisseur(id: string): Promise<{ data: any | null; error: string | null; absente: boolean }> {
  const { data, error } = await supabase.from('avoirs_fournisseurs').select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error: error.message, absente: _avfAbsente(error) }
  return { data: data ?? null, error: null, absente: false }
}
export async function createAvoirFournisseur(payload: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null; absente: boolean }> {
  const { data, error } = await supabase.from('avoirs_fournisseurs').insert(payload).select().single()
  if (error) return { data: null, error: error.message, code: (error as any).code ?? null, absente: _avfAbsente(error) }
  return { data, error: null, code: null, absente: false }
}
// Transition conditionnelle (même principe que la quarantaine) : impossible d'imputer deux fois le
// même euro depuis deux onglets ouverts sur le même avoir.
export async function majAvoirFournisseurSi(id: string, payload: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null; conflit: boolean }> {
  let r: any = supabase.from('avoirs_fournisseurs').update(payload).eq('id', id)
  for (const [k, v] of Object.entries(attendu)) r = (v === null) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.select()
  if (error) return { data: null, error: error.message, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, conflit: rows.length === 0 }
}

export async function getAudits(): Promise<Audit[]> {
  const { data } = await supabase.from('audits').select('*').order('date_audit', { ascending: false })
  return data ?? []
}

export async function createAudit(payload: Partial<Audit>) {
  const { data, error } = await supabase.from('audits').insert(payload).select().single()
  return { data, error }
}

export async function updateAudit(id: string, payload: Partial<Audit>) {
  const { data, error } = await supabase.from('audits').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ══════════════════════════════════════════════════════════════
// MODULE AUDITS DE CONFORMITÉ (SMI QSE + SI) — programme, grilles, questions, FAI
// Toutes les lectures sont FAIL-SOFT (retour [] si la table n'est pas migrée) ;
// les id sont GÉNÉRÉS CÔTÉ SERVEUR (le miroir Docker n'a pas de default).
// ══════════════════════════════════════════════════════════════
function genAuditId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)
}

export async function getAuditProgramme(): Promise<any[]> {
  const { data, error } = await supabase.from('audit_programme').select('*').order('date_cible', { ascending: true, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function createAuditProgramme(p: Record<string, any>) {
  const row = { ...p, id: p.id || genAuditId('PRG'), statut: p.statut || 'a_planifier' }
  const { data, error } = await supabase.from('audit_programme').insert(row).select().single()
  return { data, error }
}
export async function updateAuditProgramme(id: string, p: Record<string, any>) {
  const { data, error } = await supabase.from('audit_programme').update(p).eq('id', id).select().single()
  return { data, error }
}
export async function deleteAuditProgramme(id: string) {
  const { error } = await supabase.from('audit_programme').delete().eq('id', id)
  return { error }
}

export async function getAuditGrilles(): Promise<any[]> {
  const { data, error } = await supabase.from('audit_grille').select('*').order('titre', { ascending: true })
  if (error) return []
  return data ?? []
}
export async function createAuditGrille(p: Record<string, any>) {
  const row = { ...p, id: p.id || genAuditId('GRL'), version: p.version || 1, active: p.active !== false }
  const { data, error } = await supabase.from('audit_grille').insert(row).select().single()
  return { data, error }
}
export async function updateAuditGrille(id: string, p: Record<string, any>) {
  const { data, error } = await supabase.from('audit_grille').update(p).eq('id', id).select().single()
  return { data, error }
}
export async function deleteAuditGrille(id: string) {
  await supabase.from('audit_question').delete().eq('grille_id', id)
  const { error } = await supabase.from('audit_grille').delete().eq('id', id)
  return { error }
}

export async function getAuditQuestions(): Promise<any[]> {
  const { data, error } = await supabase.from('audit_question').select('*').order('grille_id').order('ordre', { ascending: true, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function createAuditQuestion(p: Record<string, any>) {
  const row = { ...p, id: p.id || genAuditId('AQ'), mode: p.mode || 'manuel' }
  const { data, error } = await supabase.from('audit_question').insert(row).select().single()
  return { data, error }
}
export async function updateAuditQuestion(id: string, p: Record<string, any>) {
  const { data, error } = await supabase.from('audit_question').update(p).eq('id', id).select().single()
  return { data, error }
}
export async function deleteAuditQuestion(id: string) {
  const { error } = await supabase.from('audit_question').delete().eq('id', id)
  return { error }
}

export async function getFai(): Promise<any[]> {
  const { data, error } = await supabase.from('fai').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}
export async function createFai(p: Record<string, any>) {
  const row = { ...p, id: p.id || genAuditId('FAI'), statut: p.statut || 'a_faire' }
  const { data, error } = await supabase.from('fai').insert(row).select().single()
  return { data, error }
}
export async function updateFai(id: string, p: Record<string, any>) {
  const { data, error } = await supabase.from('fai').update(p).eq('id', id).select().single()
  return { data, error }
}
export async function deleteFai(id: string) {
  const { error } = await supabase.from('fai').delete().eq('id', id)
  return { error }
}

// Reconduction annuelle du programme d'audit : recopie toutes les lignes d'un
// exercice vers un autre (dates décalées, statuts remis à zéro). Idempotent :
// refuse si l'année cible existe déjà.
function shiftYearStr(d: any, shift: number): string | null {
  const m = String(d || '').match(/^(\d{4})(-\d{2}-\d{2})/)
  if (!m) return null
  return String(Number(m[1]) + shift) + m[2]
}
export async function cloneAuditProgrammeAnnee(fromExercice: number, toExercice: number) {
  const src = (await getAuditProgramme().catch(() => [])) as any[]
  const rows = src.filter((r) => Number(r.exercice) === Number(fromExercice))
  if (!rows.length) return { data: [], error: { message: 'Aucune ligne pour l\'exercice ' + fromExercice } }
  if (src.some((r) => Number(r.exercice) === Number(toExercice))) return { data: [], error: { message: 'L\'exercice ' + toExercice + ' existe déjà — rien à reconduire.' } }
  const shift = Number(toExercice) - Number(fromExercice)
  const created: any[] = []
  for (const r of rows) {
    const rid = String(r.id)
    const newId = rid.indexOf(String(fromExercice)) >= 0 ? rid.replace(String(fromExercice), String(toExercice)) : rid + '-' + toExercice
    const payload: Record<string, any> = {
      id: newId, exercice: toExercice, type: r.type, entite_auditee: r.entite_auditee, famille: r.famille,
      perimetre: r.perimetre, themes: r.themes, themes_transverses: r.themes_transverses, referentiels: r.referentiels,
      trimestre: r.trimestre, date_cible: shiftYearStr(r.date_cible, shift), temps_estime_min: r.temps_estime_min,
      auditeur: r.auditeur, auditeur_2: r.auditeur_2, audite_principal: r.audite_principal, grille_id: r.grille_id,
      statut: 'planifie', plan_action_solde: false,
    }
    const { data } = await createAuditProgramme(payload)
    if (data) created.push(data)
  }
  return { data: created, error: null }
}

// ─── Moteur de SONDES : conformité AUTO-OBSERVÉE depuis les données réelles de l'ERP ──
// Chaque sonde lit une source structurée et renvoie conforme/nc/inconnu + une preuve.
// Un item 'nc' = la preuve que l'ERP n'est pas rempli au bon endroit (le constat s'écrit seul).
export type AuditSonde = { key: string; label: string; statut: 'conforme' | 'nc' | 'inconnu'; total: number; ko: number; preuve: string }
export async function getAuditAutoStatus(): Promise<Record<string, AuditSonde>> {
  const today = new Date().toISOString().slice(0, 10)
  const annee = new Date().getFullYear()
  const [ecme, certifs, duer, chimie, periss, vgp, bains, ncs, actions, fai, st, envDechets, envMesures, envAtex, envAspects] = await Promise.all([
    getEcme().catch(() => []), getCertifications().catch(() => []), getHseRisques().catch(() => []),
    getHseChimiques().catch(() => []), getProduitsPerissables().catch(() => []), getHseVerifications().catch(() => []),
    getRelevesBains().catch(() => []), getNonConformites().catch(() => []), getActionsCorrectives().catch(() => []),
    getFai().catch(() => []), getSousTraitants().catch(() => []),
    getHseDechets().catch(() => []), getHseMesuresEnv().catch(() => []), getHseAtexZones().catch(() => []), getHseAspectsImpacts().catch(() => []),
  ])
  const mk = (key: string, label: string, total: number, ko: number, preuve: string): AuditSonde => ({
    key, label, total, ko, preuve, statut: total === 0 ? 'inconnu' : ko > 0 ? 'nc' : 'conforme',
  })
  const out: Record<string, AuditSonde> = {}
  // T3 — ECME : étalonnage périmé
  const ecmeKo = (ecme as any[]).filter((e) => { const d = String(e.date_prochain_etalonnage || '').slice(0, 10); return d && d < today }).length
  out['ecme'] = mk('ecme', 'ECME — étalonnage à jour', (ecme as any[]).length, ecmeKo, ecmeKo ? `${ecmeKo} ECME hors validité d'étalonnage` : 'Tous les ECME sont dans leur validité d\'étalonnage')
  // §7.2 — habilitations / certifications SST
  const certKo = (certifs as any[]).filter((c) => { const d = String(c.date_expiration || '').slice(0, 10); return (d && d < today) || c.statut === 'expire' }).length
  out['certifications'] = mk('certifications', 'Habilitations / certifications en validité', (certifs as any[]).length, certKo, certKo ? `${certKo} habilitation(s) expirée(s)` : 'Toutes les habilitations enregistrées sont valides')
  // DUER reconduit l'année en cours
  const duerAnnee = (duer as any[]).filter((r) => Number(r.annee) === annee).length
  out['duer'] = { key: 'duer', label: `DUER reconduit ${annee}`, total: (duer as any[]).length, ko: duerAnnee > 0 ? 0 : (duer as any[]).length ? 1 : 0, preuve: duerAnnee > 0 ? `${duerAnnee} risques évalués pour ${annee}` : `Aucune évaluation datée ${annee}`, statut: (duer as any[]).length === 0 ? 'inconnu' : duerAnnee > 0 ? 'conforme' : 'nc' }
  // FDS / risque chimique renseignées
  const fdsKo = (chimie as any[]).filter((p) => !p.fds_url && !p.fds_ref).length
  out['fds'] = mk('fds', 'FDS présentes (risque chimique)', (chimie as any[]).length, fdsKo, fdsKo ? `${fdsKo} produit(s) chimique(s) sans FDS` : 'Tous les produits chimiques ont une FDS référencée')
  // Périssables non périmés
  const perKo = (periss as any[]).filter((p) => { const d = String(p.date_expiration || '').slice(0, 10); return (d && d < today) || p.statut === 'expire' }).length
  out['perissables'] = mk('perissables', 'Consommables périssables non périmés', (periss as any[]).length, perKo, perKo ? `${perKo} consommable(s) périmé(s)` : 'Aucun consommable périmé')
  // VGP à jour
  const vgpKo = (vgp as any[]).filter((v) => { const d = String(v.date_prochaine || '').slice(0, 10); return (d && d < today) || (v.statut && v.statut !== 'a_jour') }).length
  out['vgp'] = mk('vgp', 'VGP équipements à jour', (vgp as any[]).length, vgpKo, (vgp as any[]).length === 0 ? 'Aucune VGP saisie dans l\'ERP' : vgpKo ? `${vgpKo} VGP en retard` : 'Toutes les VGP sont à jour')
  // Suivi de bain (Surtec 650 / OAS) conforme
  const bainKo = (bains as any[]).filter((b) => b.conforme === false).length
  out['releves_bains'] = mk('releves_bains', 'Suivi de bain (Surtec 650 / OAS) conforme', (bains as any[]).length, bainKo, bainKo ? `${bainKo} relevé(s) de bain non conforme(s)` : 'Relevés de bain conformes')
  // NC ouvertes
  const ncOpen = (ncs as any[]).filter((n) => n.statut && !['solde', 'soldee', 'clos', 'cloture', 'ferme', 'termine'].includes(String(n.statut).toLowerCase())).length
  out['nc_ouvertes'] = { key: 'nc_ouvertes', label: 'Non-conformités ouvertes', total: (ncs as any[]).length, ko: ncOpen, preuve: ncOpen ? `${ncOpen} NC en cours de traitement` : 'Aucune NC ouverte', statut: ncOpen > 0 ? 'nc' : 'conforme' }
  // Actions correctives en retard
  const actKo = (actions as any[]).filter((a) => { const d = String(a.date_echeance || '').slice(0, 10); return d && d < today && !a.date_cloture && a.statut !== 'solde' }).length
  out['actions_retard'] = { key: 'actions_retard', label: 'Plans d\'action dans les délais', total: (actions as any[]).length, ko: actKo, preuve: actKo ? `${actKo} action(s) corrective(s) en retard` : 'Aucune action corrective en retard', statut: actKo > 0 ? 'nc' : 'conforme' }
  // FAI à faire
  const faiKo = (fai as any[]).filter((f) => f.statut === 'a_faire').length
  out['fai'] = mk('fai', 'FAI / Premier Article (EN 9102) réalisés', (fai as any[]).length, faiKo, (fai as any[]).length === 0 ? 'Aucun FAI enregistré dans l\'ERP' : faiKo ? `${faiKo} FAI à réaliser` : 'FAI réalisés')
  // Surveillance sous-traitants (dont anodisation) — approbation
  const stKo = (st as any[]).filter((s) => s.approved === false || s.approved === null || s.approved === undefined).length
  out['scorecard_st'] = mk('scorecard_st', 'Sous-traitants approuvés (dont traitement de surface)', (st as any[]).length, stKo, stKo ? `${stKo} sous-traitant(s) non approuvé(s)/non évalué(s)` : 'Sous-traitants approuvés')
  // ── Sondes ENVIRONNEMENT (ISO 14001 §6.1.2/§8.2/§9.1.2 — thème J audit) ──
  const ddRows = (envDechets as any[]).filter((d) => d.dangereux === true)
  const ddKo = ddRows.filter((d) => !d.bsdd_num && !d.trackdechets_id).length
  out['dechets_dangereux_traces'] = mk('dechets_dangereux_traces', 'Déchets dangereux tracés (BSDD / Trackdéchets)', ddRows.length, ddKo, ddKo ? `${ddKo} déchet(s) dangereux sans bordereau` : 'Tous les déchets dangereux sont tracés')
  const rejKo = (envMesures as any[]).filter((m) => m.conforme === false).length
  out['rejets_hors_vle'] = mk('rejets_hors_vle', 'Rejets / mesures dans les VLE', (envMesures as any[]).length, rejKo, rejKo ? `${rejKo} mesure(s) hors VLE` : 'Toutes les mesures sont conformes aux VLE')
  const atexKo = (envAtex as any[]).filter((z) => z.date_revue && String(z.date_revue).slice(0, 10) < today).length
  out['atex_revue'] = mk('atex_revue', 'Zones ATEX à jour (revue / DRPCE)', (envAtex as any[]).length, atexKo, atexKo ? `${atexKo} zone(s) ATEX à réviser` : 'Zones ATEX à jour')
  const aesRows = (envAspects as any[]).filter((a) => a.significatif === true)
  const aesKo = aesRows.filter((a) => !a.action && String(a.statut || '') !== 'maitrise').length
  out['aes_non_maitrise'] = mk('aes_non_maitrise', 'Aspects significatifs (AES) maîtrisés', aesRows.length, aesKo, aesKo ? `${aesKo} AES sans plan d'action` : 'Tous les AES ont un plan d\'action')
  return out
}

export async function getProduitsPerissables(): Promise<ProduitPerissable[]> {
  const { data } = await supabase.from('produits_perissables').select('*').order('date_expiration')
  return data ?? []
}

// ─── Études de capabilité (SPC machine/process) ───────────────
export async function getEtudesCapabilite(): Promise<any[]> {
  const { data } = await supabase.from('etudes_capabilite').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function createEtudeCapabilite(payload: Record<string, any>) {
  const { data, error } = await supabase.from('etudes_capabilite').insert(payload).select().single()
  return { data, error }
}

export async function deleteEtudeCapabilite(id: string) {
  const { error } = await supabase.from('etudes_capabilite').delete().eq('id', id)
  return { error }
}

// ─── ECME (équipements de contrôle, mesure et essai) — étalonnage ──
export async function getEcme(): Promise<any[]> {
  const { data } = await supabase.from('ecme').select('*').order('date_prochain_etalonnage', { ascending: true, nullsFirst: false })
  return data ?? []
}
export async function createEcme(payload: Record<string, any>) {
  const { data, error } = await supabase.from('ecme').insert(payload).select().single()
  return { data, error }
}
export async function updateEcme(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('ecme').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function deleteEcme(id: string) {
  const { error } = await supabase.from('ecme').delete().eq('id', id)
  return { error }
}

// ─── ECME : historique des vérifications = fiche de vie + PV de vérification ───
export async function getEcmeVerifications(ecmeId?: string): Promise<any[]> {
  let q = supabase.from('ecme_verifications').select('*').order('date_verif', { ascending: false })
  if (ecmeId) q = q.eq('ecme_id', ecmeId)
  const { data } = await q
  return data ?? []
}
export async function createEcmeVerification(payload: Record<string, any>) {
  const { data, error } = await supabase.from('ecme_verifications').insert(payload).select().single()
  return { data, error }
}
export async function updateEcmeVerification(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('ecme_verifications').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function deleteEcmeVerification(id: string) {
  const { error } = await supabase.from('ecme_verifications').delete().eq('id', id)
  return { error }
}

// ─── Plan de contrôle EN9100 / ISO9001 (plan d'inspection) ────────
export async function getPlansControle(): Promise<any[]> {
  const { data, error } = await supabase.from('plans_controle').select('*').order('num_ligne', { ascending: true, nullsFirst: false }).order('ordre', { ascending: true, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function createPlanControle(p: Record<string, any>) { const row = { ...p, id: p.id || ('PC-' + Date.now().toString(36)), statut: p.statut || 'actif' }; const { data, error } = await supabase.from('plans_controle').insert(row).select().single(); return { data, error } }
export async function updatePlanControle(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('plans_controle').update({ ...p, updated_at: new Date().toISOString() }).eq('id', id).select().single(); return { data, error } }
export async function deletePlanControle(id: string) { const { error } = await supabase.from('plans_controle').delete().eq('id', id); return { error } }

export async function createProduitPerissable(payload: Partial<ProduitPerissable>) {
  const { data, error } = await supabase.from('produits_perissables').insert(payload).select().single()
  return { data, error }
}

export async function updateProduitPerissable(id: string, payload: Partial<ProduitPerissable>) {
  const { data, error } = await supabase.from('produits_perissables').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteProduitPerissable(id: string) {
  const { error } = await supabase.from('produits_perissables').delete().eq('id', id)
  return { error }
}
// Mouvements (sorties FIFO) des périssables
export async function getMouvementsPerissables(): Promise<any[]> {
  const { data, error } = await supabase.from('mouvements_perissables').select('*').order('date_sortie', { ascending: false, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function createMouvementPerissable(p: Record<string, any>) { const { data, error } = await supabase.from('mouvements_perissables').insert(p).select().single(); return { data, error } }

// ─── STOCK RÉEL (table `stock`) : mise à jour quantité ────────
export async function updateStockArticle(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('stock').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ─── EXPÉDITIONS ──────────────────────────────────────────────

export async function getBLClients(): Promise<BonDeLivraison[]> {
  const { data } = await supabase
    .from('bons_de_livraison')
    .select('*')
    .or('type_bl.eq.client,type_bl.is.null')
    .order('date_bl', { ascending: false })
  return data ?? []
}

export async function getBSTs(): Promise<BonDeLivraison[]> {
  const { data } = await supabase
    .from('bons_de_livraison')
    .select('*')
    .eq('type_bl', 'bst')
    .order('date_bl', { ascending: false })
  return data ?? []
}

export async function getBonsDeCommande(): Promise<BonDeCommande[]> {
  const { data } = await supabase
    .from('bons_de_commande')
    .select('*')
    .order('date_bc', { ascending: false })
  return data ?? []
}

export async function createBonDeCommande(payload: Partial<BonDeCommande>) {
  const { data, error } = await supabase
    .from('bons_de_commande')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateBonDeCommande(id: string, payload: Partial<BonDeCommande>) {
  const { data, error } = await supabase
    .from('bons_de_commande')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── STOCK ────────────────────────────────────────────────────

export async function getArticlesStock(): Promise<ArticleStock[]> {
  const { data } = await supabase.from('articles_stock').select('*').order('nom')
  return data ?? []
}

// Lecture du stock réel (table `stock`) — utilisé pour la vérification des besoins d'achat.
export async function getStockReel(): Promise<any[]> {
  const { data } = await supabase
    .from('stock')
    .select('id, reference, designation, stock_actuel, stock_mini, stock_maxi, point_commande, qte_commande, unite, fournisseur_id, actif, prix_achat_ht, categorie, activite, emplacement, consommation_mensuelle, derniere_entree, auto_reappro')
    .order('designation')
  return data ?? []
}

export async function createArticleStock(payload: Partial<ArticleStock>) {
  const { data, error } = await supabase.from('articles_stock').insert(payload).select().single()
  return { data, error }
}

export async function updateArticleStock(id: string, payload: Partial<ArticleStock>) {
  const { data, error } = await supabase.from('articles_stock').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getMouvementsStock(): Promise<MouvementStock[]> {
  const { data } = await supabase.from('mouvements_stock').select('*').order('date_mvt', { ascending: false }).limit(200)
  return data ?? []
}

export async function createMouvementStock(payload: Partial<MouvementStock>) {
  const { data, error } = await supabase.from('mouvements_stock').insert(payload).select().single()
  return { data, error }
}

// Un mouvement d'ENTRÉE de ce motif existe-t-il déjà ? Requête CIBLÉE : getMouvementsStock()
// ne rend que les 200 derniers mouvements, un doublon plus ancien lui échappait. Rend l'erreur,
// car supabase-js ne lève jamais : une lecture en échec ne doit pas passer pour « aucun mouvement ».
export async function mouvementEntreeExiste(motif: string): Promise<{ existe: boolean; error: string | null }> {
  const { data, error } = await supabase.from('mouvements_stock').select('id').eq('motif', motif).eq('type', 'entree').limit(1)
  if (error) return { existe: false, error: error.message }
  return { existe: (data ?? []).length > 0, error: null }
}

// ─── MISE EN STOCK (lot F, 15/09/2026 · migration 013 / cloud-11) ─────────────────────────────
// File « À ranger », types d'objet, zones, historique des emplacements. Lectures STRICTES : l'erreur
// remonte (supabase-js ne lève jamais) et une TABLE ABSENTE (cloud avant cloud-11) se distingue d'une
// panne — l'écran dit « jouez cloud-11 » au lieu d'afficher une file vide trompeuse.
const _mesTableAbsente = (e: any, table: string): boolean => {
  if (!e) return false
  if (e.code === '42P01' || e.code === 'PGRST205') return true
  const m = String(e.message || '')
  return m.includes(table) && !/column/i.test(m) && /(relation .*does not exist|could not find the table)/i.test(m)
}
const _mesColonneAbsente = (e: any): boolean => {
  if (!e) return false
  if (e.code === '42703' || e.code === 'PGRST204') return true
  return /column .* does not exist|could not find the .* column/i.test(String(e.message || ''))
}
export type LectureMes<T> = { data: T; error: string | null; absente: boolean }
export type EcritureMes = { data: any | null; error: string | null; code: string | null; absente: boolean }
const _mesEcriture = (data: any, error: any, table: string): EcritureMes => error
  ? { data: null, error: String(error.message || error.code || 'erreur inconnue'), code: (error as any).code ?? null, absente: _mesTableAbsente(error, table) }
  : { data: data ?? null, error: null, code: null, absente: false }

// Vérification lot F (16/09/2026) : PostgREST plafonne une réponse à 1000 lignes (PGRST_DB_MAX_ROWS, même défaut chez
// Supabase). Une lecture « tout » qui décide (référence existante, file à ranger, porte matière) lit donc PAGE PAR PAGE,
// jusqu'à une page incomplète — sinon la 1001ᵉ référence était « introuvable » et la porte s'ouvrait sur une file tronquée.
export const PAGE_LECTURE = 1000
async function _toutesLesPages(construire: () => any, max = 100): Promise<{ data: any[]; error: any | null }> {
  const out: any[] = []
  for (let page = 0; page < max; page++) {
    const debut = page * PAGE_LECTURE
    const { data, error } = await construire().range(debut, debut + PAGE_LECTURE - 1)
    if (error) return { data: [], error }
    const rows = (data ?? []) as any[]
    out.push(...rows)
    if (rows.length < PAGE_LECTURE) return { data: out, error: null }
  }
  return { data: out, error: { message: 'lecture trop volumineuse (plus de ' + (max * PAGE_LECTURE) + ' lignes)' } }
}
/** `limite` : les N plus récentes (affichage) ; `toutes: true` : TOUTES les lignes, lues page par page (décisions). `bcIds` : filtre. */
export async function getMisesEnStock(opts: { statuts?: string[]; limite?: number; toutes?: boolean; bcIds?: string[] } = {}): Promise<LectureMes<any[]>> {
  const construire = () => {
    let r: any = supabase.from('mises_en_stock').select('*')
    if (opts.statuts && opts.statuts.length) r = r.in('statut', opts.statuts)
    if (opts.bcIds) r = r.in('bc_id', opts.bcIds.length ? opts.bcIds : ['-'])
    return r.order('cree_le', { ascending: false }).order('id', { ascending: true })
  }
  const { data, error } = opts.toutes ? await _toutesLesPages(construire) : await construire().limit(opts.limite ?? 500)
  if (error) return { data: [], error: error.message, absente: _mesTableAbsente(error, 'mises_en_stock') }
  return { data: data ?? [], error: null, absente: false }
}
export async function getMiseEnStockStricte(id: string): Promise<LectureMes<any | null>> {
  const { data, error } = await supabase.from('mises_en_stock').select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error: error.message, absente: _mesTableAbsente(error, 'mises_en_stock') }
  return { data: data ?? null, error: null, absente: false }
}
export async function createMiseEnStock(payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('mises_en_stock').insert(payload).select().single()
  return _mesEcriture(data, error, 'mises_en_stock')
}
/** Ligne existante pour une clé d'idempotence ({pv_id, ligne_idx, origine} | {quarantaine_id, ligne_idx, origine} | {validation_id, ligne_idx, origine}). */
export async function trouverMiseEnStock(cle: Record<string, any>): Promise<LectureMes<any | null>> {
  let r: any = supabase.from('mises_en_stock').select('*')
  for (const [k, v] of Object.entries(cle || {})) r = (v === null || v === undefined) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.order('cree_le', { ascending: true }).limit(1)
  if (error) return { data: null, error: error.message, absente: _mesTableAbsente(error, 'mises_en_stock') }
  return { data: ((data ?? []) as any[])[0] ?? null, error: null, absente: false }
}
/** Transition CONDITIONNELLE d'une ligne de file (a_ranger → range | annule…) : deux clics simultanés ⇒ le second voit `conflit`. */
export async function majMiseEnStockSi(id: string, payload: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null; conflit: boolean }> {
  let r: any = supabase.from('mises_en_stock').update(payload).eq('id', id)
  for (const [k, v] of Object.entries(attendu)) r = (v === null) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.select()
  if (error) return { data: null, error: error.message, code: (error as any).code ?? null, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, code: null, conflit: rows.length === 0 }
}
export async function getStockTypesObjet(): Promise<LectureMes<any[]>> {
  const { data, error } = await supabase.from('stock_types_objet').select('*').order('ordre', { ascending: true }).order('libelle', { ascending: true })
  if (error) return { data: [], error: error.message, absente: _mesTableAbsente(error, 'stock_types_objet') }
  return { data: data ?? [], error: null, absente: false }
}
export async function createStockTypeObjet(payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('stock_types_objet').insert(payload).select().single()
  return _mesEcriture(data, error, 'stock_types_objet')
}
export async function majStockTypeObjet(code: string, payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('stock_types_objet').update(payload).eq('code', code).select()
  return _mesEcriture(error ? null : (((data ?? []) as any[])[0] ?? null), error, 'stock_types_objet')
}
export async function getStockZones(): Promise<LectureMes<any[]>> {
  const { data, error } = await supabase.from('stock_zones').select('*').order('type_objet', { ascending: true }).order('ordre', { ascending: true }).order('zone', { ascending: true })
  if (error) return { data: [], error: error.message, absente: _mesTableAbsente(error, 'stock_zones') }
  return { data: data ?? [], error: null, absente: false }
}
export async function createStockZone(payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('stock_zones').insert(payload).select().single()
  return _mesEcriture(data, error, 'stock_zones')
}
export async function majStockZone(id: string, payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('stock_zones').update(payload).eq('id', id).select()
  return _mesEcriture(error ? null : (((data ?? []) as any[])[0] ?? null), error, 'stock_zones')
}
export async function getHistoriqueEmplacements(opts: { stockId?: string; limite?: number } = {}): Promise<LectureMes<any[]>> {
  let r: any = supabase.from('stock_emplacements_historique').select('*')
  if (opts.stockId) r = r.eq('stock_id', opts.stockId)
  const { data, error } = await r.order('le', { ascending: false }).limit(opts.limite ?? 200)
  if (error) return { data: [], error: error.message, absente: _mesTableAbsente(error, 'stock_emplacements_historique') }
  return { data: data ?? [], error: null, absente: false }
}
export async function createHistoriqueEmplacement(payload: Record<string, any>): Promise<EcritureMes> {
  const { data, error } = await supabase.from('stock_emplacements_historique').insert(payload).select().single()
  return _mesEcriture(data, error, 'stock_emplacements_historique')
}
/** Toutes les références de stock (projection de rangement), en lecture STRICTE. `typeObjetDispo` = colonne stock.type_objet présente (013). */
export async function lireStockStricte(): Promise<{ data: any[]; error: string | null; typeObjetDispo: boolean }> {
  const cols = 'id, reference, designation, famille, categorie, unite, stock_actuel, emplacement, actif, activite'
  const r1 = await _toutesLesPages(() => supabase.from('stock').select(cols + ', type_objet').order('id', { ascending: true }))
  if (!r1.error) return { data: r1.data, error: null, typeObjetDispo: true }
  if (!_mesColonneAbsente(r1.error)) return { data: [], error: String(r1.error.message || r1.error.code || 'erreur inconnue'), typeObjetDispo: false }
  const r2 = await _toutesLesPages(() => supabase.from('stock').select(cols).order('id', { ascending: true }))
  if (r2.error) return { data: [], error: String(r2.error.message || r2.error.code || 'erreur inconnue'), typeObjetDispo: false }
  return { data: r2.data, error: null, typeObjetDispo: false }
}
/** Quarantaines, BC et BDT en lecture STRICTE et complète (porte matière, manque matière) : une panne n'est pas « aucun manque ». */
export async function getQuarantainesStricte(): Promise<{ data: any[]; error: string | null }> {
  const r = await _toutesLesPages(() => supabase.from('quarantaines').select('*').order('id', { ascending: true }))
  return { data: r.data, error: r.error ? String(r.error.message || r.error.code || 'erreur inconnue') : null }
}
export async function getBonsDeCommandeStricte(): Promise<{ data: any[]; error: string | null }> {
  const r = await _toutesLesPages(() => supabase.from('bons_de_commande').select('*').order('id', { ascending: true }))
  return { data: r.data, error: r.error ? String(r.error.message || r.error.code || 'erreur inconnue') : null }
}
export async function getBonsDeTravailStricte(): Promise<{ data: any[]; error: string | null }> {
  const r = await _toutesLesPages(() => supabase.from('bons_de_travail').select('id, num_affaire, matiere_ok, lot_id, lot_ref').order('id', { ascending: true }))
  return { data: r.data, error: r.error ? String(r.error.message || r.error.code || 'erreur inconnue') : null }
}
/** Un BDT par son id (sortie de stock imputée) : une panne n'est pas « BDT inconnu ». */
export async function getBonDeTravailStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_travail').select('id, num_affaire, lot_id, lot_ref, statut').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
/** Une affaire est-elle connue (commande de ce n° d'affaire ou de cet id, ou BDT de cette affaire) ? Lecture stricte. */
export async function affaireExisteStricte(num: string): Promise<{ existe: boolean; error: string | null }> {
  for (const [table, col] of [['commandes', 'num_affaire'], ['commandes', 'id'], ['bons_de_travail', 'num_affaire']] as const) {
    const r = await supabase.from(table).select('id').eq(col, num).limit(1)
    if (r.error) return { existe: false, error: r.error.message }
    if ((r.data ?? []).length) return { existe: true, error: null }
  }
  return { existe: false, error: null }
}
/** Type d'objet et famille par id de stock, pour l'écran (fail-soft : colonne absente ⇒ carte vide, `dispo` faux). */
export async function lireTypesObjetStock(): Promise<{ parId: Record<string, { type_objet: string | null; famille: string | null }>; dispo: boolean }> {
  const parId: Record<string, { type_objet: string | null; famille: string | null }> = {}
  const r1 = await supabase.from('stock').select('id, type_objet, famille')
  if (!r1.error) { for (const s of ((r1.data ?? []) as any[])) parId[String(s.id)] = { type_objet: s.type_objet ?? null, famille: s.famille ?? null }; return { parId, dispo: true } }
  const r2 = await supabase.from('stock').select('id, famille')
  if (!r2.error) for (const s of ((r2.data ?? []) as any[])) parId[String(s.id)] = { type_objet: null, famille: s.famille ?? null }
  return { parId, dispo: false }
}
export async function getStockArticleStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('stock').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
export async function createStockArticleStricte(payload: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null }> {
  const { data, error } = await supabase.from('stock').insert(payload).select().single()
  return error ? { data: null, error: error.message, code: (error as any).code ?? null } : { data, error: null, code: null }
}
/** Mise à jour CONDITIONNELLE d'une référence de stock (stock_actuel lu, emplacement lu…) : pas de crédit ni de déplacement perdu. */
export async function majStockSi(id: string, payload: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null; code: string | null; conflit: boolean }> {
  let r: any = supabase.from('stock').update(payload).eq('id', id)
  for (const [k, v] of Object.entries(attendu)) r = (v === null || v === undefined) ? r.is(k, null) : r.eq(k, v)
  const { data, error } = await r.select()
  if (error) return { data: null, error: error.message, code: (error as any).code ?? null, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, code: null, conflit: rows.length === 0 }
}
/** Indices pour PROPOSER le type d'objet d'une référence (catalogue fournisseur, registre chimique, catalogue EPI, nomenclatures). Fail-soft : ce n'est qu'une proposition. */
export async function lireSignauxTypeObjet(): Promise<{ catalogue: Record<string, string>; chimiques: Set<string>; epi: Set<string>; nomenclature: Record<string, string> }> {
  const k = (v: any) => String(v ?? '').trim().toLowerCase()
  const [pf, ch, ep, fn] = await Promise.all([
    supabase.from('produits_fournisseurs').select('reference, categorie'),
    supabase.from('hse_produits_chimiques').select('ref_stock'),
    supabase.from('hse_epi_catalogue').select('ref_stock'),
    supabase.from('fournitures_nomenclature').select('ref_stock, categorie'),
  ])
  const catalogue: Record<string, string> = {}
  for (const p of ((pf.error ? [] : pf.data) ?? []) as any[]) { const c = k(p.reference); if (c && p.categorie && !catalogue[c]) catalogue[c] = String(p.categorie) }
  const chimiques = new Set<string>(((ch.error ? [] : ch.data) ?? []).map((x: any) => k(x.ref_stock)).filter(Boolean))
  const epi = new Set<string>(((ep.error ? [] : ep.data) ?? []).map((x: any) => k(x.ref_stock)).filter(Boolean))
  const nomenclature: Record<string, string> = {}
  for (const f of ((fn.error ? [] : fn.data) ?? []) as any[]) { const c = k(f.ref_stock); if (c && f.categorie && !nomenclature[c]) nomenclature[c] = String(f.categorie) }
  return { catalogue, chimiques, epi, nomenclature }
}
/** Catégorie des BC d'une liste d'ids (proposition du type d'objet). Fail-soft. */
export async function getCategoriesBcs(ids: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  const uniq = Array.from(new Set((ids || []).filter(Boolean)))
  if (!uniq.length) return out
  const { data, error } = await supabase.from('bons_de_commande').select('id, categorie').in('id', uniq)
  if (error) return out
  for (const b of ((data ?? []) as any[])) out[String(b.id)] = b.categorie ?? null
  return out
}

// ─── MAINTENANCE (GMAO) ───────────────────────────────────────

export async function getOrdresMaintenance(): Promise<OrdreMaintenance[]> {
  const { data } = await supabase
    .from('ordres_maintenance')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createOrdreMaintenance(payload: Partial<OrdreMaintenance>) {
  const { data, error } = await supabase.from('ordres_maintenance').insert(payload).select().single()
  return { data, error }
}

export async function updateOrdreMaintenance(id: string, payload: Partial<OrdreMaintenance>) {
  const { data, error } = await supabase.from('ordres_maintenance').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getPlansPreventif(): Promise<PlanPreventif[]> {
  const { data } = await supabase
    .from('plans_preventif')
    .select('*')
    .eq('actif', true)
    .order('prochain_prevu', { ascending: true })
  return data ?? []
}

export async function createPlanPreventif(payload: Partial<PlanPreventif>) {
  const { data, error } = await supabase.from('plans_preventif').insert(payload).select().single()
  return { data, error }
}

export async function updatePlanPreventif(id: string, payload: Partial<PlanPreventif>) {
  const { data, error } = await supabase.from('plans_preventif').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getMtbfMachines(): Promise<MtbfMachine[]> {
  const { data } = await supabase
    .from('mtbf_machines')
    .select('*')
    .order('disponibilite_pct', { ascending: true })
  return data ?? []
}

export async function createMtbfMachine(payload: Partial<MtbfMachine>) {
  const { data, error } = await supabase.from('mtbf_machines').insert(payload).select().single()
  return { data, error }
}

export async function updateMtbfMachine(id: string, payload: Partial<MtbfMachine>) {
  const { data, error } = await supabase.from('mtbf_machines').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ─── Pièces de rechange (PDR) par machine ─────────────────────
export async function getPiecesRechange(): Promise<any[]> {
  const { data } = await supabase.from('pieces_rechange').select('*').order('created_at', { ascending: false })
  return data ?? []
}
export async function createPieceRechange(payload: Record<string, any>) {
  const { data, error } = await supabase.from('pieces_rechange').insert(payload).select().single()
  return { data, error }
}
export async function updatePieceRechange(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('pieces_rechange').update(payload).eq('id', id).select().single()
  return { data, error }
}
export async function deletePieceRechange(id: string) {
  const { error } = await supabase.from('pieces_rechange').delete().eq('id', id)
  return { error }
}

// ─── NOMENCLATURE ────────────────────────────────────────────

export async function getNomenclatures(): Promise<Nomenclature[]> {
  const { data } = await supabase.from('nomenclatures').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getNomenclature(id: string): Promise<Nomenclature | null> {
  const { data } = await supabase.from('nomenclatures').select('*').eq('id', id).single()
  return data
}

export async function createNomenclature(payload: Partial<Nomenclature>) {
  const { data, error } = await supabase.from('nomenclatures').insert(payload).select().single()
  return { data, error }
}

export async function updateNomenclature(id: string, payload: Partial<Nomenclature>) {
  const { data, error } = await supabase.from('nomenclatures').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return { data, error }
}

export async function deleteNomenclature(id: string) {
  const { error } = await supabase.from('nomenclatures').delete().eq('id', id)
  return { error }
}

// ─── JOURNAL EN 9100 DES NOMENCLATURES (11/09/2026) ─────────────────────────────────────
// Lectures STRICTES : elles rendent l'erreur au lieu de la cacher. supabase-js ne lève jamais ;
// sans ça, une panne de lecture serait journalisée comme « tout a été ajouté ».
export async function getNomenclatureStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('nomenclatures').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
export async function getFournituresStrictes(id: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('fournitures_nomenclature').select('*').eq('nomenclature_id', id).order('created_at')
  return { data: error ? null : (data ?? []), error: error ? error.message : null }
}
// Table absente (cloud tant que cloud-5 n'est pas joué) ≠ échec d'écriture : l'écran le dit.
// Seules les erreurs qui désignent la TABLE comptent : une colonne inconnue (PGRST204, 42703) est
// un échec — sinon une suppression serait acceptée sans trace au lieu d'être refusée.
const _journalAbsent = (e: any) => {
  if (!e) return false
  if (e.code === '42P01' || e.code === 'PGRST205') return true
  const m = String(e.message || '')
  return /nomenclature_journal/.test(m) && !/column/i.test(m) && /(relation .*does not exist|could not find the table)/i.test(m)
}
// Ajout d'une entrée (table APPEND-ONLY, migration 006). INSERT seulement : le droit UPDATE est
// révoqué, un upsert échouerait. L'id est généré ici, comme createDocument.
export async function journaliserNomenclature(entree: Record<string, any>): Promise<{ ok: true; id: string } | { ok: false; raison: 'table_absente' | 'echec'; error?: string }> {
  const id = crypto.randomUUID()
  const { error } = await supabase.from('nomenclature_journal').insert({ id, ...entree })
  if (!error) return { ok: true, id }
  return { ok: false, raison: _journalAbsent(error) ? 'table_absente' : 'echec', error: error.message }
}
// Lecture. Portée « groupe » = toutes les révisions de la pièce ; fonctionne même si la fiche a été
// supprimée, puisque le journal porte lui-même son groupe.
export async function getJournalNomenclature(id: string, portee: 'fiche' | 'groupe', groupe: string | null): Promise<{ rows: any[]; disponible: boolean; error: string | null; tronque: boolean }> {
  const LIMITE = 500
  let q: any = supabase.from('nomenclature_journal').select('*').order('created_at', { ascending: false }).limit(LIMITE + 1)
  const qv = (s: string) => String(s).replace(/["\\,()]/g, '')   // valeurs citées dans le filtre or() de PostgREST
  q = (portee === 'groupe' && groupe) ? q.or('groupe.eq."' + qv(groupe) + '",nomenclature_id.eq."' + qv(id) + '"') : q.eq('nomenclature_id', id)
  const { data, error } = await q
  if (error) return { rows: [], disponible: !_journalAbsent(error), error: error.message, tronque: false }
  const rows = data ?? []
  return { rows: rows.slice(0, LIMITE), disponible: true, error: null, tronque: rows.length > LIMITE }
}
// Fiche déjà tracée (validée, puis peut-être dévalidée) : son journal a au moins une entrée.
// Table absente → { existe: false }. Autre échec → error : le suivi est INDÉTERMINÉ, jamais
// « pas suivie » (ce serait laisser passer une modification sans trace).
export async function journalExiste(nomenclatureId: string): Promise<{ existe: boolean; error: string | null }> {
  const { data, error } = await supabase.from('nomenclature_journal').select('id').eq('nomenclature_id', nomenclatureId).limit(1)
  if (error) return _journalAbsent(error) ? { existe: false, error: null } : { existe: false, error: error.message }
  return { existe: !!(data && data.length), error: null }
}
// Groupe de révisions d'une fiche SUPPRIMÉE, lu dans son propre journal.
export async function groupeDepuisJournal(nomenclatureId: string): Promise<string | null> {
  const { data, error } = await supabase.from('nomenclature_journal').select('groupe').eq('nomenclature_id', nomenclatureId).order('created_at', { ascending: false }).limit(1)
  return (!error && data && data[0] && data[0].groupe) ? String(data[0].groupe) : null
}
// Suppression VÉRIFIÉE : rend le nombre de lignes réellement effacées. Un DELETE filtré (RLS)
// répond sans erreur ; seul le relevé des lignes supprimées dit ce qui s'est passé.
export async function supprimerNomenclatureStricte(id: string): Promise<{ n: number; error: string | null }> {
  const { data, error } = await supabase.from('nomenclatures').delete().eq('id', id).select('id')
  return { n: error ? 0 : (data ?? []).length, error: error ? error.message : null }
}
// Lignes du répertoire d'une réf. interne, lues STRICTEMENT (état avant d'une trace EN 9100).
export async function getReferencesClientsStricte(code: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('references_clients').select('*').ilike('code_ref_interne', String(code))
  return { data: error ? null : (data ?? []), error: error ? error.message : null }
}
export async function getReferenceClientStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('references_clients').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}

export async function getFournitures(nomenclatureId: string): Promise<FournitureNomenclature[]> {
  const { data } = await supabase.from('fournitures_nomenclature').select('*').eq('nomenclature_id', nomenclatureId).order('created_at')
  return data ?? []
}

// Toutes les fournitures (bulk) — pour joindre coût matière/accessoires aux nomenclatures (dashboards KPI).
export async function getAllFournitures(): Promise<any[]> {
  const { data } = await supabase.from('fournitures_nomenclature').select('*')
  return data ?? []
}

export async function upsertFournitures(nomenclatureId: string, rows: Partial<FournitureNomenclature>[]) {
  await supabase.from('fournitures_nomenclature').delete().eq('nomenclature_id', nomenclatureId)
  if (rows.length === 0) return { error: null }
  const { error } = await supabase.from('fournitures_nomenclature').insert(rows.map(r => ({ ...r, nomenclature_id: nomenclatureId })))
  await ensureStockRowsForFournitures(rows as any[]).catch(() => {})   // nouvelle réf matière/accessoire → entrée stock vide (best-effort)
  return { error }
}

// ─── Auto-création d'entrées stock VIDES pour les nouvelles références (matière & accessoires) ──
// Une nouvelle réf (nomenclature ou catalogue) doit apparaître dans le stock à 0, jusqu'à réception
// d'un BL fournisseur qui la remplira. Idempotent : n'insère que les réfs absentes.
// ⚠ On NE recopie JAMAIS la référence dans la désignation : les deux colonnes restent distinctes.
export async function ensureStockRowsForFournitures(rows: Array<Record<string, any>>): Promise<void> {
  const mats = (rows || []).filter(r => r && (r.categorie === 'matiere' || r.categorie === 'accessoire') && String(r.ref_stock || '').trim())
  if (!mats.length) return
  const { data: stockAll } = await supabase.from('stock').select('reference')
  const have = new Set((stockAll ?? []).map((s: any) => String(s.reference || '').toLowerCase().trim()))
  const seen = new Set<string>()
  const toInsert: any[] = []
  for (const m of mats) {
    const ref = String(m.ref_stock || '').trim(); const k = ref.toLowerCase()
    if (!k || have.has(k) || seen.has(k)) continue
    seen.add(k)
    toInsert.push({ reference: ref, designation: String(m.designation || '').trim(), stock_actuel: 0, stock_mini: 0, actif: true, categorie: m.categorie === 'accessoire' ? 'accessoire' : 'matiere' })
  }
  if (toInsert.length) await supabase.from('stock').insert(toInsert)
}

export async function ensureStockRowForRef(reference: string, opts: { designation?: string; unite?: string; categorie?: string | null; activite?: string } = {}): Promise<void> {
  const ref = String(reference || '').trim()
  if (!ref) return
  const { data: existing } = await supabase.from('stock').select('id').eq('reference', ref).limit(1)
  if (existing && existing.length) return
  // Désignation = la vraie désignation (jamais la référence recopiée) — ref et désignation restent séparées.
  const row: any = { reference: ref, designation: String(opts.designation || '').trim(), stock_actuel: 0, stock_mini: 0, actif: true }
  if (opts.unite) row.unite = opts.unite
  if (opts.categorie) row.categorie = opts.categorie
  if (opts.activite) row.activite = opts.activite
  await supabase.from('stock').insert(row)
}

// ─── RH ───────────────────────────────────────────────────────

export async function getEmployes(): Promise<Employe[]> {
  const { data } = await supabase.from('employes').select('*').order('nom')
  return data ?? []
}

export async function createEmploye(payload: Partial<Employe>) {
  const { data, error } = await supabase.from('employes').insert(payload).select().single()
  return { data, error }
}

export async function updateEmploye(id: string, payload: Partial<Employe>) {
  const { data, error } = await supabase.from('employes').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getCertifications(): Promise<Certification[]> {
  const { data } = await supabase.from('certifications').select('*').order('date_expiration', { ascending: true })
  return data ?? []
}

export async function createCertification(payload: Partial<Certification>) {
  const { data, error } = await supabase.from('certifications').insert(payload).select().single()
  return { data, error }
}

export async function updateCertification(id: string, payload: Partial<Certification>) {
  const { data, error } = await supabase.from('certifications').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteCertification(id: string) {
  const { error } = await supabase.from('certifications').delete().eq('id', id)
  return { error }
}

export async function getCompetences(): Promise<CompetenceOperateur[]> {
  const { data } = await supabase.from('competences_operateur').select('*').order('employe_nom')
  return data ?? []
}

export async function upsertCompetence(payload: Record<string, any>) {
  const { data, error } = await supabase.from('competences_operateur').upsert(payload, { onConflict: 'salarie_id,operation' }).select().single()
  return { data, error }
}

// Opérateurs de production (table salaries) — pour la matrice de compétences
export async function getOperateursSalaries(): Promise<any[]> {
  const { data } = await supabase
    .from('salaries')
    .select('id, nom, prenom, poste, entite, est_operateur, competences')
    .eq('est_operateur', true).eq('actif', true)
    .order('entite').order('nom')
  return data ?? []
}

// ─── Salariés (RH : effectif complet, fiche, rôles, identifiants) ──
export async function getSalaries(): Promise<any[]> {
  const { data } = await supabase.from('salaries').select('*').order('nom')
  return data ?? []
}

// Droits de TOUS les salariés, en projection légère, pour le rafraîchissement des sessions.
// ⚠ Renvoie `null` UNIQUEMENT si la requête a ÉCHOUÉ — c'est toute la subtilité : supabase-js
// ne lève jamais d'exception, il renvoie { data: null, error }. Sans cette distinction, une
// panne réseau serait indiscernable d'un « salarié supprimé » et déconnecterait tout le monde.
// Une seule requête pour tout le monde : la latence domine, lire 36 lignes en projection coûte
// le même aller-retour qu'une seule ligne en select('*') — et les hash de PIN ne transitent pas.
export async function getDroitsSalaries(): Promise<Record<string, { roles: string[]; perms: string[]; actif: boolean }> | null> {
  const { data, error } = await supabase.from('salaries').select('id,actif,role,roles,autorisations')
  if (error || !Array.isArray(data)) return null
  const out: Record<string, { roles: string[]; perms: string[]; actif: boolean }> = {}
  for (const s of data as any[]) {
    const roles = Array.isArray(s.roles) && s.roles.length ? s.roles : [s.role || 'operateur']
    out[String(s.id)] = {
      roles,
      perms: (Array.isArray(s.autorisations) && s.autorisations.length) ? s.autorisations : [],
      actif: s.actif !== false,
    }
  }
  return out
}

// ─── PV DE CONTRÔLE DE RÉCEPTION (lot D · D2, 14/09/2026) : lectures STRICTES ───
// Qui peut être contrôleur (écriture Expéditions) : relu à chaque PV, jamais « personne » sur une panne.
// Projection sans `pin` ni `date_sortie` (colonne RSE optionnelle, absente de certaines bases).
export async function getSalariesDroitsStricte(): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('salaries').select('id,matricule,nom,prenom,role,roles,autorisations,actif').order('nom')
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des salariés impossible' }
  return { data, error: null }
}
// Un BL par son id : une panne n'est pas « BL absent » (réception dont la réponse s'est perdue, correction des infos de réception).
export async function getBonDeLivraisonStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_livraison').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? (error.message || String((error as any).code || 'erreur inconnue')) : null }
}
// BL de réception d'un bon de commande : une panne n'est pas « aucune réception enregistrée ».
export async function getBlsDuBcStricte(bcId: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_livraison').select('*').eq('bc_id', bcId)
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des bons de livraison impossible' }
  return { data, error: null }
}
// PV existants (numérotation + « un PV par réception ») : une panne n'est pas « aucun PV ».
export async function getPVControlesResumeStricte(): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('pv_controle').select('id,num_pv,bl_id,bc_id,type_controle')
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des PV de contrôle impossible' }
  return { data, error: null }
}
// PV de réception par son n° (quarantaines.pv_id), détail compris — décision de la Qualité (lot F) : une panne n'est pas « PV sans détail ».
export async function getPVReceptionParNumStricte(numPv: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('pv_controle').select('*').eq('num_pv', numPv).eq('type_controle', 'reception').limit(1)
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture du PV de réception impossible' }
  return { data: data[0] ?? null, error: null }
}

export async function getSalarie(id: string): Promise<any | null> {
  const { data } = await supabase.from('salaries').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

// Fail-soft : colonnes RSE sociales (sexe/oeth/date_sortie) ajoutées par env_rh_rse_schema.sql.
const SAL_RSE_COLS = ['sexe', 'oeth', 'date_sortie']
let _salRse: boolean | null = null
export async function salariesHasRse(): Promise<boolean> {
  if (_salRse != null) return _salRse
  const { error } = await supabase.from('salaries').select('sexe').limit(1)
  _salRse = !error
  return _salRse
}
async function _stripSalRse(p: Record<string, any>) {
  if (await salariesHasRse()) return p
  const q: Record<string, any> = { ...p }; for (const k of SAL_RSE_COLS) delete q[k]; return q
}
export async function createSalarie(payload: Record<string, any>) {
  const { data, error } = await supabase.from('salaries').insert(await _stripSalRse(payload)).select().single()
  return { data, error }
}

export async function updateSalarie(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('salaries').update(await _stripSalRse(payload)).eq('id', id).select().single()
  return { data, error }
}

export async function deleteSalarie(id: string) {
  const { error } = await supabase.from('salaries').delete().eq('id', id)
  return { error }
}

// ─── Congés ───────────────────────────────────────────────────
export async function getConges(): Promise<any[]> {
  const { data } = await supabase.from('conges').select('*').order('date_debut', { ascending: false })
  return data ?? []
}

export async function createConge(payload: Record<string, any>) {
  const { data, error } = await supabase.from('conges').insert(payload).select().single()
  return { data, error }
}

export async function updateConge(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('conges').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function createAbsence(payload: Record<string, any>) {
  const { data, error } = await supabase.from('absences').insert(payload).select().single()
  return { data, error }
}

export async function getPointages(): Promise<Pointage[]> {
  const { data } = await supabase.from('pointages').select('*').order('date_pointage', { ascending: false }).limit(500)
  return data ?? []
}

export async function createPointage(payload: Partial<Pointage>) {
  const { data, error } = await supabase.from('pointages').insert(payload).select().single()
  return { data, error }
}

export async function updatePointage(id: string, payload: Partial<Pointage>) {
  const { data, error } = await supabase.from('pointages').update(payload).eq('id', id).select().single()
  return { data, error }
}

// ─── COMPTABILITÉ ────────────────────────────────────────────

export async function getFacturesClient(): Promise<FactureClient[]> {
  const { data } = await supabase.from('factures_client').select('*').order('date_facture', { ascending: false })
  return data ?? []
}

export async function createFactureClient(payload: Partial<FactureClient>) {
  const { data, error } = await supabase.from('factures_client').insert(payload).select().single()
  return { data, error }
}

export async function updateFactureClient(id: string, payload: Partial<FactureClient>) {
  const { data, error } = await supabase.from('factures_client').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getFacturesFournisseur(): Promise<FactureFournisseur[]> {
  const { data } = await supabase.from('factures_fournisseur').select('*').order('date_facture', { ascending: false })
  return data ?? []
}

export async function createFactureFournisseur(payload: Partial<FactureFournisseur>) {
  const { data, error } = await supabase.from('factures_fournisseur').insert(payload).select().single()
  return { data, error }
}

// Lecture d'UNE facture fournisseur — sert a verifier son etat AVANT de le changer
// (garde anti double validation dans PATCH /api/factures-fournisseur/:id).
export async function getFactureFournisseur(id: string): Promise<any | null> {
  const { data } = await supabase.from('factures_fournisseur').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

export async function updateFactureFournisseur(id: string, payload: Partial<FactureFournisseur>) {
  const { data, error } = await supabase.from('factures_fournisseur').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function getEcrituresComptables(): Promise<EcritureComptable[]> {
  const { data } = await supabase.from('ecritures_comptables').select('*').order('date_ecriture', { ascending: false }).limit(300)
  return data ?? []
}

export async function createEcriture(payload: Partial<EcritureComptable>) {
  const { data, error } = await supabase.from('ecritures_comptables').insert(payload).select().single()
  return { data, error }
}

// ══════════════════════════════════════════════════════════════
// PLANNING PRODUCTION (Gantt BDT / BDS) + RAPPORTS 8D
// ══════════════════════════════════════════════════════════════

// ─── Lecture : données du planning unifié ─────────────────────
export async function getPlanningOperateurs(): Promise<any[]> {
  const { data } = await supabase
    .from('salaries')
    .select('id,nom,prenom,poste,shift_id,competences,entite')
    .eq('est_operateur', true)
    .eq('actif', true)
    .order('id')
  return data ?? []
}

export async function getPlanningBDTs(): Promise<any[]> {
  // Seuls les BDT au format "planning" (temps_alloue renseigné) — exclut les
  // anciennes lignes incomplètes qui pollueraient le Gantt.
  const { data } = await supabase
    .from('bons_de_travail')
    .select('*')
    .not('temps_alloue', 'is', null)
    .order('id')
  return data ?? []
}

export async function getPlanningBDS(): Promise<any[]> {
  const { data } = await supabase.from('bons_sous_traitance').select('*').order('id')
  return data ?? []
}

export async function getSousTraitants(): Promise<any[]> {
  const { data } = await supabase
    .from('sous_traitants')
    .select('*')
    .eq('actif', true)
    .order('nom')
  return data ?? []
}

// ─── Référentiel Fournisseurs & Sous-traitants (Achats) ───────
export async function getFournisseurs(): Promise<any[]> {
  const { data } = await supabase.from('fournisseurs').select('*').order('nom')
  return data ?? []
}

export async function getSousTraitantsAll(): Promise<any[]> {
  const { data } = await supabase.from('sous_traitants').select('*').order('nom')
  return data ?? []
}

export async function createFournisseur(payload: Record<string, any>) {
  const { data, error } = await supabase.from('fournisseurs').insert(payload).select().single()
  return { data, error }
}

export async function createSousTraitant(payload: Record<string, any>) {
  const { data, error } = await supabase.from('sous_traitants').insert(payload).select().single()
  return { data, error }
}

// ─── Scorecard Fournisseur / ST : OTD + qualité réception + délai paiement → score ──
// Tout calculé en bulk (un fetch par table) puis agrégé par fournisseur en mémoire.
//  OTD          = % BC livrés à temps (réception BL max ≤ date_livraison BC)
//  Qualité réc. = % réceptions sans anomalie (PV contrôle anomalie/nc_ouverte sur les BL)
//  Délai paie.  = moyenne (date_paiement − date_facture) sur factures_fournisseur
export async function getFournisseurScorecard() {
  const [fRes, stRes, bcRes, blRes, ffRes, pvRes] = await Promise.all([
    supabase.from('fournisseurs').select('id, nom, categorie'),
    supabase.from('sous_traitants').select('id, nom'),
    supabase.from('bons_de_commande').select('*'),
    supabase.from('bons_de_livraison').select('id, bc_id, date_bl'),
    supabase.from('factures_fournisseur').select('bc_id, date_facture, date_paiement'),
    supabase.from('pv_controle').select('bl_id, anomalie, nc_ouverte'),
  ])
  const fournisseurs = fRes.data ?? [], sousTraitants = stRes.data ?? []
  const bcs = bcRes.data ?? [], bls = blRes.data ?? [], facs = ffRes.data ?? [], pvs = pvRes.data ?? []
  const diffDays = (a: any, b: any) => { const t1 = new Date(a).getTime(), t2 = new Date(b).getTime(); return (isFinite(t1) && isFinite(t2)) ? Math.round((t2 - t1) / 86400000) : null }
  const recByBc: Record<string, string> = {}
  const blsByBc: Record<string, any[]> = {}
  for (const l of bls) {
    if (!l.bc_id) continue
    ;(blsByBc[String(l.bc_id)] = blsByBc[String(l.bc_id)] || []).push(l)
    if (l.date_bl) { const d = String(l.date_bl).slice(0, 10); if (!recByBc[String(l.bc_id)] || d > recByBc[String(l.bc_id)]) recByBc[String(l.bc_id)] = d }
  }
  const anoBl = new Set<string>()
  for (const p of pvs) if (p.bl_id && (p.anomalie === true || p.nc_ouverte === true)) anoBl.add(String(p.bl_id))
  const facsByBc: Record<string, any[]> = {}
  for (const f of facs) if (f.bc_id) (facsByBc[String(f.bc_id)] = facsByBc[String(f.bc_id)] || []).push(f)
  const keyOf = (bc: any) => String(bc.sous_traitant_id || bc.fournisseur_id || '')
  const scoreFor = (id: string) => {
    const myBc = bcs.filter((b: any) => keyOf(b) === String(id))
    const montantTotal = myBc.reduce((s: number, b: any) => s + (Number(b.montant_ht ?? b.montant ?? b.montant_total_ht ?? 0) || 0), 0)
    let onTime = 0, otdN = 0
    for (const b of myBc) {
      const promesse = String(b.date_livraison_initiale || b.date_livraison || '').slice(0, 10)   // OTD figé sur la 1ʳᵉ date prévue
      if (!promesse) continue
      const rec = b.date_reception_reelle ? String(b.date_reception_reelle).slice(0, 10) : recByBc[String(b.id)]
      if (!rec) continue
      otdN++; if (rec <= promesse) onTime++
    }
    const otdPct = otdN > 0 ? Math.round(onTime / otdN * 100) : null
    let recTot = 0, recNc = 0
    for (const b of myBc) for (const l of (blsByBc[String(b.id)] || [])) { recTot++; if (anoBl.has(String(l.id))) recNc++ }
    const ncPct = recTot > 0 ? Math.round((recTot - recNc) / recTot * 100) : null
    const delays: number[] = []
    for (const b of myBc) for (const f of (facsByBc[String(b.id)] || [])) { if (f.date_facture && f.date_paiement) { const d = diffDays(f.date_facture, f.date_paiement); if (d != null && d >= 0) delays.push(d) } }
    const delaiPaiement = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null
    let acc = 0, wsum = 0
    if (otdPct != null) { acc += otdPct * 0.5; wsum += 0.5 }
    if (ncPct != null) { acc += ncPct * 0.35; wsum += 0.35 }
    if (delaiPaiement != null) { const payScore = Math.max(0, Math.min(100, 100 - Math.max(0, delaiPaiement - 30) * 2)); acc += payScore * 0.15; wsum += 0.15 }
    const score = wsum > 0 ? Math.round(acc / wsum) : null
    return { nbBC: myBc.length, montantTotal: Math.round(montantTotal), otdPct, otdN, ncPct, recNc, delaiPaiement, score }
  }
  const rows = [
    ...fournisseurs.map((f: any) => ({ id: f.id, nom: f.nom, type: 'Fournisseur', categorie: f.categorie || '', ...scoreFor(f.id) })),
    ...sousTraitants.map((s: any) => ({ id: s.id, nom: s.nom, type: 'Sous-traitant', categorie: '', ...scoreFor(s.id) })),
  ]
  rows.sort((a: any, b: any) => (b.score ?? -1) - (a.score ?? -1))
  return rows
}

export async function updateFournisseur(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('fournisseurs').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function updateSousTraitant(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase.from('sous_traitants').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteFournisseur(id: string) {
  const { error } = await supabase.from('fournisseurs').delete().eq('id', id)
  return { error }
}

export async function deleteSousTraitant(id: string) {
  const { error } = await supabase.from('sous_traitants').delete().eq('id', id)
  return { error }
}

// Salariés actifs (pour le menu « Chef de projet 8D » → FK responsable)
export async function getSalariesActifs(): Promise<any[]> {
  const { data } = await supabase
    .from('salaries')
    .select('id,nom,prenom,poste,entite')
    .eq('actif', true)
    .order('nom')
  return data ?? []
}

// ─── Écriture : mutations BDT / BDS ───────────────────────────
export async function updateBDT(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase
    .from('bons_de_travail')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Retrait d'un BDT : sert au RETOUR ARRIÈRE d'une séparation qui échoue en cours de route.
// Rend l'erreur (supabase-js ne lève jamais).
export async function supprimerBDTRow(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bons_de_travail').delete().eq('id', id)
  return { error: error ? error.message : null }
}

// Lecture STRICTE d'un BDT par id (découpe) : une panne n'est jamais confondue avec « introuvable ».
export async function getBDTStrict(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_travail').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}

// Identifiants des morceaux déjà créés pour une racine (`R-M2`, `R-M3`…), sans la limite de page de
// getBonsDeTravail : un ancien morceau hors page provoquait une collision de clé à la découpe suivante.
export async function idsMorceauxBDT(racine: string): Promise<{ data: string[]; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_travail').select('id').like('id', racine + '-M%').limit(10000)
  return { data: (data ?? []).map((r: any) => String(r.id)), error: error ? error.message : null }
}

// Retrait des morceaux lors d'un retour arrière, VÉRIFIÉ par relecture (un DELETE refusé par RLS
// peut répondre sans erreur) : renvoie les id qui sont encore en base.
export async function retirerBDTRows(ids: string[]): Promise<string[]> {
  if (!ids.length) return []
  for (const id of ids) await supabase.from('bons_de_travail').delete().eq('id', id)
  const { data, error } = await supabase.from('bons_de_travail').select('id').in('id', ids)
  if (error) return ids.slice()
  return (data ?? []).map((r: any) => String(r.id))
}

export async function createBDTRow(payload: Record<string, any>) {
  const { data, error } = await supabase.from('bons_de_travail').insert(payload).select().single()
  return { data, error }
}
// Clés des bons existants, lecture STRICTE et paginée (relecture lot H0) : « Générer les BDT » juge
// l'idempotence sur (affaire | pièce | seq) et choisit un identifiant LIBRE. Une lecture en échec ne
// doit jamais passer pour « aucun bon » (tous les bons seraient recréés en double sous d'autres ids).
export async function getClesBonsStrictes(kind: 'BDT' | 'BDS'): Promise<{ data: { id: string; cle: string }[]; error: string | null }> {
  const table = kind === 'BDT' ? 'bons_de_travail' : 'bons_sous_traitance'
  const colAff = kind === 'BDT' ? 'num_affaire' : 'cmd_ref'
  const out: { id: string; cle: string }[] = []
  const PAGE = 1000
  for (let from = 0; from < 1_000_000; from += PAGE) {
    const { data, error } = await supabase.from(table).select(`id, ${colAff}, piece, seq`).order('id', { ascending: true }).range(from, from + PAGE - 1)
    if (error) return { data: [], error: error.message }
    for (const b of (data ?? []) as any[]) out.push({ id: String(b.id), cle: `${b[colAff]}|${b.piece}|${b.seq}` })
    if (!data || data.length < PAGE) break
  }
  return { data: out, error: null }
}
// Un bon par id, lecture STRICTE (conflit 23505 à l'insertion : bon créé entre-temps, ou id pris par une autre étape ?)
export async function getCleBonParId(kind: 'BDT' | 'BDS', id: string): Promise<{ data: { id: string; cle: string } | null; error: string | null }> {
  const table = kind === 'BDT' ? 'bons_de_travail' : 'bons_sous_traitance'
  const colAff = kind === 'BDT' ? 'num_affaire' : 'cmd_ref'
  const { data, error } = await supabase.from(table).select(`id, ${colAff}, piece, seq`).eq('id', id).limit(1).maybeSingle()
  if (error) return { data: null, error: error.message }
  const b: any = data
  return { data: b ? { id: String(b.id), cle: `${b[colAff]}|${b.piece}|${b.seq}` } : null, error: null }
}

// ─── Réglage / découpe / recollage des BDT (lot C, 14/09/2026) ─────────────────────────────────
// Toutes ces lectures sont STRICTES : supabase-js ne lève jamais, une panne est rendue dans `error`
// et n'est jamais confondue avec « aucune ligne ».

// Famille complète d'un BDT : la racine + ses morceaux « racine-Mk » (toutes colonnes). Deux requêtes plutôt
// qu'un or() : un identifiant contenant une virgule ou une parenthèse casserait la syntaxe du filtre.
export async function lireFamilleBDT(racine: string): Promise<{ data: any[]; error: string | null }> {
  const [a, b] = await Promise.all([
    supabase.from('bons_de_travail').select('*').eq('id', racine),
    supabase.from('bons_de_travail').select('*').like('id', racine + '-M%').limit(10000),
  ])
  if (a.error || b.error) return { data: [], error: (a.error || b.error)!.message }
  const re = /-M(\d+)$/
  const morceaux = ((b.data ?? []) as any[]).filter((x: any) => { const id = String(x.id); const m = re.exec(id); return !!m && id.slice(0, id.length - m[0].length) === racine })
  return { data: [...((a.data ?? []) as any[]), ...morceaux], error: null }
}

// Tous les BDT (paginé : la limite de lignes de PostgREST tronquerait la liste en silence).
export async function lireBDTsStrict(): Promise<{ data: any[]; error: string | null }> {
  const out: any[] = []
  const PAGE = 1000
  for (let debut = 0; debut < 200000; debut += PAGE) {
    const { data, error } = await supabase.from('bons_de_travail').select('*').order('id', { ascending: true }).range(debut, debut + PAGE - 1)
    if (error) return { data: [], error: error.message }
    out.push(...((data ?? []) as any[]))
    if (!data || data.length < PAGE) break
  }
  return { data: out, error: null }
}

async function _lireToutStrict(table: string, cols: string): Promise<{ data: any[]; error: string | null }> {
  const out: any[] = []
  const PAGE = 1000
  for (let debut = 0; debut < 200000; debut += PAGE) {
    const { data, error } = await supabase.from(table).select(cols).order('id', { ascending: true }).range(debut, debut + PAGE - 1)
    if (error) return { data: [], error: table + ' : ' + error.message }
    out.push(...((data ?? []) as any[]))
    if (!data || data.length < PAGE) break
  }
  return { data: out, error: null }
}

// Données pour retrouver le réglage depuis la gamme (shared.ts reglageBdtDepuisGamme).
//   cible absente → TOUT (lots, nomenclatures, DT, process) : rapport « reconstituer » ;
//   cible = un BDT → lectures ciblées (son lot, les nomenclatures de sa pièce, la DT de son affaire).
export async function lireContexteReglage(cible?: any): Promise<{ ctx: { lots: any[]; nomenclatures: any[]; dts: any[]; process: any[] }; error: string | null }> {
  const vide = { lots: [] as any[], nomenclatures: [] as any[], dts: [] as any[], process: [] as any[] }
  const colsNom = 'id, num_nom, code_ref_produit, indice, statut, etapes_production'
  if (!cible) {
    const [l, n, d, p] = await Promise.all([
      _lireToutStrict('lots', 'id, qte, qte_initiale'), _lireToutStrict('nomenclatures', colsNom),
      _lireToutStrict('demandes_travaux', 'id, num_affaire, pieces_detail'), _lireToutStrict('process_atelier', '*'),
    ])
    const err = [l.error, n.error, d.error, p.error].filter(Boolean).join(' · ')
    if (err) return { ctx: vide, error: err }
    return { ctx: { lots: l.data, nomenclatures: n.data, dts: d.data, process: p.data }, error: null }
  }
  const cleLot = String(cible.lot_id || cible.lot_ref || '')
  const piece = String(cible.piece ?? '').trim()
  const aff = String(cible.num_affaire ?? '').trim()
  // ilike sans joker : insensible à la casse ; % et _ de la pièce échappés. Les espaces autour du code sont
  // retirés côté serveur (shared.ts compare en minuscules « trim »).
  const motif = '%' + piece.replace(/[\\%_]/g, (ch) => '\\' + ch) + '%'
  const [l, n, d, p] = await Promise.all([
    cleLot ? supabase.from('lots').select('id, qte, qte_initiale').eq('id', cleLot) : Promise.resolve({ data: [], error: null } as any),
    piece ? supabase.from('nomenclatures').select(colsNom).ilike('code_ref_produit', motif).limit(5000) : Promise.resolve({ data: [], error: null } as any),
    aff ? supabase.from('demandes_travaux').select('id, num_affaire, pieces_detail').or('num_affaire.eq."' + aff.replace(/["\\]/g, '') + '",id.eq."' + aff.replace(/["\\]/g, '') + '"') : Promise.resolve({ data: [], error: null } as any),
    supabase.from('process_atelier').select('*'),
  ])
  const erreurs: string[] = []
  if (l.error) erreurs.push('lots : ' + l.error.message)
  if (n.error) erreurs.push('nomenclatures : ' + n.error.message)
  if (d.error) erreurs.push('demandes_travaux : ' + d.error.message)
  if (p.error) erreurs.push('process_atelier : ' + p.error.message)
  if (erreurs.length) return { ctx: vide, error: erreurs.join(' · ') }
  return { ctx: { lots: (l.data ?? []) as any[], nomenclatures: (n.data ?? []) as any[], dts: (d.data ?? []) as any[], process: (p.data ?? []) as any[] }, error: null }
}

// Traces d'exécution au nom de ces BDT (réception, soldage, NC, sortie matière, cotes relevées) : un morceau
// tracé ne se recolle pas. Table ou colonne absente (base en retard) → ignorée et signalée ; toute autre
// erreur est rendue (aucun recollage sur une lecture ratée).
export async function lireTracesBDT(ids: string[]): Promise<{ traces: Array<{ table: string; bdt_id: string }>; ignorees: string[]; error: string | null }> {
  const TABLES = ['operateur_bdt_historique', 'machine_bdt_historique', 'non_conformites', 'mouvements_stock', 'controles_cotes']
  if (!ids.length) return { traces: [], ignorees: [], error: null }
  const res = await Promise.all(TABLES.map((t) => supabase.from(t).select('bdt_id').in('bdt_id', ids).limit(1000)))
  const traces: Array<{ table: string; bdt_id: string }> = []
  const ignorees: string[] = []
  const erreurs: string[] = []
  res.forEach((r: any, i: number) => {
    const t = TABLES[i]
    if (r.error) {
      const code = String(r.error.code || '')
      const msg = String(r.error.message || '')
      if (['42P01', '42703', 'PGRST205', 'PGRST204'].includes(code) || /does not exist|could not find/i.test(msg)) ignorees.push(t)
      else erreurs.push(t + ' : ' + msg)
      return
    }
    for (const x of ((r.data ?? []) as any[])) if (x && x.bdt_id != null) traces.push({ table: t, bdt_id: String(x.bdt_id) })
  })
  return { traces, ignorees, error: erreurs.length ? erreurs.join(' · ') : null }
}

// Mise à jour CONDITIONNELLE d'un BDT de la goulotte : ne s'applique que si le bon est encore dans l'état lu
// (même statut, ni reçu, ni pointé, sans opérateur). `data` null sans erreur = le bon a changé entre-temps.
export async function majBDTSiInchange(id: string, statutLu: any, patch: Record<string, any>): Promise<{ data: any | null; error: string | null }> {
  let q: any = supabase.from('bons_de_travail').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  q = (statutLu == null) ? q.is('statut', null) : q.eq('statut', String(statutLu))
  const { data, error } = await q.is('temps_reel', null).is('debut_reel', null).is('operateur_id', null).select()
  if (error) return { data: null, error: error.message }
  return { data: ((data ?? []) as any[])[0] ?? null, error: null }
}

// Mise à jour d'un BDT CONDITIONNÉE à l'état lu (verrou optimiste) : chaque colonne de `attendu` doit encore valoir la
// valeur lue — null → IS NULL, sinon égalité. `data` null sans erreur = le bon a changé entre-temps (ou la base a refusé
// la mise à jour sans le dire). Sert à la découpe (durée lue) et au recollage (durée et durée d'origine lues).
export async function majBDTConditionnelle(id: string, patch: Record<string, any>, attendu: Record<string, any>): Promise<{ data: any | null; error: string | null }> {
  let q: any = supabase.from('bons_de_travail').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  for (const col of Object.keys(attendu)) {
    const v = attendu[col]
    q = v == null ? q.is(col, null) : q.eq(col, v)
  }
  const { data, error } = await q.select()
  if (error) return { data: null, error: error.message }
  return { data: ((data ?? []) as any[])[0] ?? null, error: null }
}

// Retrait des morceaux d'un recollage, chacun sous garde-fou (statut lu, ni reçu, ni pointé, sans opérateur),
// puis RELECTURE : un DELETE refusé (RLS) ou filtré par un garde-fou répond sans erreur. Rend les morceaux
// encore en base ; `error` = relecture impossible (état incertain).
export async function retirerMorceauxBDTGardes(morceaux: any[]): Promise<{ restants: any[]; error: string | null }> {
  if (!morceaux.length) return { restants: [], error: null }
  for (const m of morceaux) {
    let q: any = supabase.from('bons_de_travail').delete().eq('id', String(m.id))
    q = (m.statut == null) ? q.is('statut', null) : q.eq('statut', String(m.statut))
    await q.is('temps_reel', null).is('debut_reel', null).is('operateur_id', null)
  }
  const { data, error } = await supabase.from('bons_de_travail').select('*').in('id', morceaux.map((m: any) => String(m.id)))
  if (error) return { restants: [], error: error.message }
  return { restants: (data ?? []) as any[], error: null }
}

// Écrit le réglage d'un BDT SEULEMENT s'il est encore vide (rapport « reconstituer ») : une saisie faite
// entre-temps n'est jamais écrasée.
export async function ecrireReglageSiVide(id: string, valeur: number): Promise<{ ecrit: boolean; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_travail').update({ temps_reglage: valeur, updated_at: new Date().toISOString() }).eq('id', id).is('temps_reglage', null).select('id')
  if (error) return { ecrit: false, error: error.message }
  return { ecrit: ((data ?? []) as any[]).length > 0, error: null }
}

// ─── Chemin critique (lot C, 14/09/2026) : lectures CIBLÉES et STRICTES d'un lot ─────────────────────────
// Toutes les opérations (BDT + BDS) rattachées à un lot : clé = lot_id, sinon lot_ref (gamme.ts cleLot). Deux
// requêtes par table (eq, pas de or() : un identifiant avec virgule ou parenthèse casserait le filtre), puis
// dédoublonnage et filtre exact sur la clé. Colonne absente (base en retard) → requête ignorée ; toute autre
// erreur est RENDUE : une panne n'est jamais « lot sans autre opération ».
export async function lireOperationsDuLot(cle: string): Promise<{ bdts: any[]; bds: any[]; error: string | null }> {
  const k = String(cle ?? '').trim()
  if (!k) return { bdts: [], bds: [], error: null }
  const res: any[] = await Promise.all([
    supabase.from('bons_de_travail').select('*').eq('lot_id', k).limit(5000),
    supabase.from('bons_de_travail').select('*').eq('lot_ref', k).limit(5000),
    supabase.from('bons_sous_traitance').select('*').eq('lot_id', k).limit(5000),
    supabase.from('bons_sous_traitance').select('*').eq('lot_ref', k).limit(5000),
  ])
  const erreurs: string[] = []
  const lignes = res.map((r: any, i: number) => {
    if (!r.error) return (r.data ?? []) as any[]
    const code = String(r.error.code || ''), msg = String(r.error.message || '')
    if (['42703', 'PGRST204'].includes(code) || /column .* does not exist|could not find .* column/i.test(msg)) return [] as any[]
    erreurs.push((i < 2 ? 'bons_de_travail' : 'bons_sous_traitance') + ' : ' + msg)
    return [] as any[]
  })
  if (erreurs.length) return { bdts: [], bds: [], error: erreurs.join(' · ') }
  const cleDe = (o: any) => String(o?.lot_id ?? '').trim() || String(o?.lot_ref ?? '').trim()
  const fusion = (a: any[], b: any[]) => {
    const vus = new Map<string, any>()
    for (const o of [...a, ...b]) if (o && cleDe(o) === k && !vus.has(String(o.id))) vus.set(String(o.id), o)
    return Array.from(vus.values())
  }
  return { bdts: fusion(lignes[0], lignes[1]), bds: fusion(lignes[2], lignes[3]), error: null }
}

// ─── Lot G (16/09/2026) : chevauchement du même process sur un poste, successeurs remis en goulotte ──────
// BDT portant ce process et susceptibles d'occuper le poste (posés ou reçus), lecture STRICTE : une panne n'est jamais
// « poste libre ». Le filtre fin (jour, heure, durée, négation d'enGoulotte) est fait par src/poste_oas.ts.
export async function lireBDTsDuProcess(processId: string): Promise<{ data: any[]; error: string | null }> {
  const p = String(processId ?? '').trim()
  if (!p) return { data: [], error: null }
  const { data, error } = await supabase.from('bons_de_travail').select('*').eq('process_id', p)
    .not('statut', 'in', '("a_programmer","solde","st")').limit(5000)
  return { data: (data ?? []) as any[], error: error ? error.message : null }
}

// Déprogrammation d'un successeur (G4), CONDITIONNÉE à l'état lu (statut, jour, process, heure, et updated_at quand la
// ligne le porte) : un BDT reçu, soldé ou reposé entre la lecture et l'écriture n'est pas retiré — revue du 16/09/2026 :
// reposer le successeur le même jour sur le même process ne change que `debut`, et cette correction (la plus naturelle
// d'une violation) était écrasée. `remis_goulotte_le` (migration 014 / cloud-12) est écrit si la ligne lue porte la
// colonne ; refus de la base sur cette colonne (cache PostgREST en retard) → réessai sans elle.
// `data` null sans erreur = le BDT a changé entre-temps.
export async function deprogrammerBDTSiInchange(lu: any, remisLe: string): Promise<{ data: any | null; error: string | null; sansColonne: boolean }> {
  const patch: Record<string, any> = { process_id: null, machine_id: null, statut: 'a_programmer', date_prevue: null, debut: null, operateur_id: null }
  const avecCol = !!lu && Object.prototype.hasOwnProperty.call(lu, 'remis_goulotte_le')
  const colonnes = ['statut', 'date_prevue', 'process_id', 'debut', ...(lu && lu.updated_at != null && lu.updated_at !== '' ? ['updated_at'] : [])]
  const essai = async (p: Record<string, any>) => {
    let q: any = supabase.from('bons_de_travail').update({ ...p, updated_at: new Date().toISOString() }).eq('id', String(lu?.id ?? ''))
    for (const col of colonnes) {
      const v = lu?.[col]
      q = (v == null || v === '') ? q.is(col, null) : q.eq(col, v)
    }
    const { data, error } = await q.select()
    return { data: ((data ?? []) as any[])[0] ?? null, error: error ? String(error.message || error.code || 'erreur') : null }
  }
  if (avecCol) {
    const r = await essai({ ...patch, remis_goulotte_le: remisLe })
    if (!r.error || !/remis_goulotte_le/i.test(r.error)) return { ...r, sansColonne: false }
  }
  const r2 = await essai(patch)
  return { ...r2, sansColonne: true }
}

// Lecture STRICTE d'un BDS par id : une panne n'est jamais confondue avec « introuvable ».
export async function getBDSStrict(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_sous_traitance').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}

export async function updateBDS(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase
    .from('bons_sous_traitance')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── Écriture : non-conformités & rapports 8D ─────────────────
export async function createNonConformiteRow(payload: Record<string, any>) {
  const { data, error } = await supabase.from('non_conformites').insert(payload).select().single()
  return { data, error }
}
// Les colonnes Qualité fournisseur_nom / lieu_detection / lieu_imputation existent-elles ?
// (absentes tant que nc_champs_qualite.sql n'est pas joué, ex. sur Cloudflare → on les retire du payload).
// Colonnes du RETOUR CLIENT annonce (nc_retour_client_attendu.sql) — fail-soft avant DDL cloud :
// sans elles, la NC se cree quand meme, seul l'annonce du retour est ignoree.
export async function ncHasRetourCols(): Promise<boolean> {
  const { error } = await supabase.from('non_conformites').select('retour_attendu').limit(1)
  return !error
}
export async function ncHasExtCols(): Promise<boolean> {
  const { error } = await supabase.from('non_conformites').select('fournisseur_nom').limit(1)
  return !error
}
// colonne récente 'responsable' (nc_responsable_schema.sql) — fail-soft avant DDL cloud
export async function ncHasResponsable(): Promise<boolean> {
  const { error } = await supabase.from('non_conformites').select('responsable').limit(1)
  return !error
}

// ─── Dérogations (PMQ3-D3/D4) — résilient si la table n'existe pas encore ──
export async function getDerogations(): Promise<any[]> {
  const { data, error } = await supabase.from('derogations').select('*').order('numero', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function createDerogation(payload: Record<string, any>) {
  const { data, error } = await supabase.from('derogations').insert(payload).select().single()
  return { data, error }
}

export async function updateDerogation(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase
    .from('derogations')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function getRapports8D(): Promise<any[]> {
  const { data } = await supabase.from('rapports_8d').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getRapport8DById(id: string): Promise<any | null> {
  const { data } = await supabase.from('rapports_8d').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

export async function createRapport8D(payload: Record<string, any>) {
  const { data, error } = await supabase.from('rapports_8d').insert(payload).select().single()
  return { data, error }
}

export async function updateRapport8D(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase
    .from('rapports_8d')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── Process atelier (référentiel des postes machine / manuel) ─
export async function getProcessAtelier(): Promise<any[]> {
  const { data } = await supabase
    .from('process_atelier')
    .select('*')
    .order('ordre', { ascending: true })
  return data ?? []
}

// Process rattachés à UNE machine — l'échec de lecture est REMONTÉ (supabase-js ne lève jamais) : la suppression d'une
// machine ne doit pas se faire sur une liste vide qui ne serait qu'une panne.
export async function getProcessAtelierDeMachine(machineId: string): Promise<{ data: any[]; error: string | null }> {
  const { data, error } = await supabase.from('process_atelier').select('*').eq('machine_id', machineId)
  return { data: (data ?? []) as any[], error: error ? error.message : null }
}

export async function createProcessAtelier(payload: Record<string, any>) {
  const { data, error } = await supabase.from('process_atelier').insert(payload).select().single()
  return { data, error }
}

export async function updateProcessAtelier(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase
    .from('process_atelier')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProcessAtelier(id: string) {
  const { error } = await supabase.from('process_atelier').delete().eq('id', id)
  return { error }
}

// ─── Postes d'atelier : conteneurs qui regroupent plusieurs machines ET plusieurs process ───
// Fail-soft : tant que la migration `scripts_import/postes_schema.sql` n'a pas tourné, la table
// `postes` n'existe pas → getPostes() renvoie [] (aucune erreur ne casse la page Production).
export async function getPostes(): Promise<any[]> {
  const { data, error } = await supabase.from('postes').select('*').order('ordre', { ascending: true }).order('nom')
  if (error) return []
  return data ?? []
}
export async function createPoste(payload: Record<string, any>) {
  const { data, error } = await supabase.from('postes').insert(payload).select().single()
  return { data, error }
}
export async function updatePoste(id: string, patch: Record<string, any>) {
  const { data, error } = await supabase.from('postes').update(patch).eq('id', id).select().single()
  return { data, error }
}
export async function deletePoste(id: string) {
  const { error } = await supabase.from('postes').delete().eq('id', id)
  return { error }
}

// ─── Affectation opérateur → poste/process (planning, par jour) ───
// « Qui on met à quel poste » : 1 poste par opérateur et par jour, historisé par date.
export async function getAffectationsPoste(from?: string, to?: string): Promise<any[]> {
  let q = supabase.from('affectation_poste').select('*')
  if (from && to && from === to) q = q.eq('date_affectation', from)
  else { if (from) q = q.gte('date_affectation', from); if (to) q = q.lte('date_affectation', to) }
  const { data } = await q.order('date_affectation', { ascending: false })
  return data ?? []
}

export async function upsertAffectationPoste(payload: Record<string, any>) {
  // Un opérateur peut être affecté à plusieurs (process, shift) le même jour
  // → conflit sur la clé composite (operateur_id, date_affectation, process_id, shift).
  const { data, error } = await supabase
    .from('affectation_poste')
    .upsert({ shift: '', ...payload, updated_at: new Date().toISOString() }, { onConflict: 'operateur_id,date_affectation,process_id,shift' })
    .select()
    .single()
  return { data, error }
}

// Suppression : ciblée (operateur + date + process + shift) si processId fourni, sinon toutes les
// affectations de l'opérateur pour la date (rétro-compat / "retirer du planning").
export async function deleteAffectationPoste(operateurId: string, date: string, processId?: string | null, shift?: string | null) {
  let q = supabase.from('affectation_poste').delete().eq('operateur_id', operateurId).eq('date_affectation', date)
  if (processId != null && processId !== '') {
    q = q.eq('process_id', processId).eq('shift', shift ?? '')
  }
  const { error } = await q
  return { error }
}

// ─── Interlocuteurs (contacts multiples : fournisseur / sous_traitant / client) ───
export async function getInterlocuteurs(entiteType: string, entiteId: string): Promise<any[]> {
  const { data } = await supabase
    .from('interlocuteurs')
    .select('*')
    .eq('entite_type', entiteType)
    .eq('entite_id', String(entiteId))
    .order('principal', { ascending: false })
    .order('nom')
  return data ?? []
}

export async function createInterlocuteur(payload: Record<string, any>) {
  const { data, error } = await supabase.from('interlocuteurs').insert(payload).select().single()
  return { data, error }
}

export async function updateInterlocuteur(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from('interlocuteurs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return { data, error }
}

export async function deleteInterlocuteur(id: string) {
  const { error } = await supabase.from('interlocuteurs').delete().eq('id', id)
  return { error }
}

// Rétrograde les autres interlocuteurs principaux d'une entité (un seul principal)
export async function clearInterlocuteurPrincipal(entiteType: string, entiteId: string, exceptId?: string) {
  let q = supabase.from('interlocuteurs').update({ principal: false })
    .eq('entite_type', entiteType).eq('entite_id', String(entiteId)).eq('principal', true)
  if (exceptId) q = q.neq('id', exceptId)
  const { error } = await q
  return { error }
}

// ─── Authentification opérateur (matricule + code PIN) ─────────
// Renvoie le salarié opérateur si le couple matricule/PIN est valide, sinon null.
export async function verifyOperateurPin(matricule: string, pin: string): Promise<any | null> {
  if (!matricule || !pin) return null
  const mat = String(matricule).trim()
  if (!mat || /[%_,*()\\]/.test(mat)) return null   // rejette les jokers LIKE/PostgREST : sinon matricule='%' matche TOUT (bypass auth)
  const { data } = await supabase
    .from('salaries')
    .select('id,nom,prenom,matricule,entite,competences,est_operateur,actif,pin,role,roles,autorisations')
    .ilike('matricule', mat)
    .eq('est_operateur', true)
    .eq('actif', true)
  // Matricule insensible à la casse ; si plusieurs personnes partagent le matricule
  // (ex. « Cadre »), le PIN individuel identifie la bonne.
  for (const row of (Array.isArray(data) ? data : [])) {
    if (await verifyPin(pin, (row as any).pin)) {
      await rehashPinIfLegacy(row as any, pin)
      const { pin: _omit, ...safe } = row as any
      return safe
    }
  }
  return null
}

// Vérifie le couple matricule/PIN d'un salarié (tout rôle, pas seulement opérateur)
// → renvoie le salarié (rôle + autorisations) si valide, pour les contrôles d'habilitation.
export async function verifySalariePin(matricule: string, pin: string): Promise<any | null> {
  if (!matricule || !pin) return null
  const mat = String(matricule).trim()
  if (!mat || /[%_,*()\\]/.test(mat)) return null   // rejette les jokers LIKE/PostgREST : sinon matricule='%' matche TOUT (bypass auth)
  const { data } = await supabase
    .from('salaries')
    .select('id,nom,prenom,matricule,entite,role,roles,autorisations,est_operateur,actif,pin')
    .ilike('matricule', mat)
    .eq('actif', true)
  // Insensible à la casse + gère les matricules partagés (PIN individuel = discriminant).
  for (const row of (Array.isArray(data) ? data : [])) {
    if (await verifyPin(pin, (row as any).pin)) {
      await rehashPinIfLegacy(row as any, pin)
      const { pin: _omit, ...safe } = row as any
      return safe
    }
  }
  return null
}

// Variante STRICTE de verifySalariePin (DA et PV de non-conformité émis depuis la Production, 15/09/2026) :
// une panne de lecture n'est jamais « matricule ou PIN incorrect » — { data: null, error } ; mauvais couple = { data: null, error: null }.
export async function verifySalariePinStricte(matricule: string, pin: string): Promise<{ data: any | null; error: string | null }> {
  if (!matricule || !pin) return { data: null, error: null }
  const mat = String(matricule).trim()
  if (!mat || /[%_,*()\\]/.test(mat)) return { data: null, error: null }   // jokers LIKE/PostgREST refusés (voir verifyOperateurPin)
  const { data, error } = await supabase
    .from('salaries')
    .select('id,nom,prenom,matricule,entite,role,roles,autorisations,est_operateur,actif,pin')
    .ilike('matricule', mat)
    .eq('actif', true)
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des salariés impossible' }
  for (const row of data) {
    if (await verifyPin(pin, (row as any).pin)) {
      await rehashPinIfLegacy(row as any, pin)
      const { pin: _omit, ...safe } = row as any
      return { data: safe, error: null }
    }
  }
  return { data: null, error: null }
}

// Lecture STRICTE de lignes (une panne n'est jamais « introuvable ») : [] = aucune ligne, null = échec.
export async function lireLignesStricte(table: string, select: string, filtre?: { colonne: string; valeur: string; op?: 'eq' | 'like' }, limite = 1000): Promise<{ data: any[] | null; error: string | null }> {
  let q: any = supabase.from(table).select(select)
  if (filtre) q = filtre.op === 'like' ? q.like(filtre.colonne, filtre.valeur) : q.eq(filtre.colonne, filtre.valeur)
  const { data, error } = await q.limit(limite)
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || ('lecture de ' + table + ' impossible') }
  return { data, error: null }
}

// Lecture STRICTE et PAGINÉE de TOUTES les lignes (numérotations) : PostgREST plafonne silencieusement chaque
// réponse (PGRST_DB_MAX_ROWS, 1000 en Docker comme en cloud) — un `.limit(100000)` ne rend donc qu'un sous-ensemble
// arbitraire au-delà. Tri stable sur `ordre` (clé unique), pages demandées jusqu'à une page VIDE : le plafond réel
// du serveur peut être inférieur à `taillePage`, une page courte ne prouve donc pas la fin. Une page en échec = échec.
export async function lireToutesLignesStricte(table: string, select: string, filtre?: { colonne: string; valeur: string; op?: 'eq' | 'like' }, opts: { ordre?: string; taillePage?: number; maxLignes?: number } = {}): Promise<{ data: any[] | null; error: string | null }> {
  const ordre = opts.ordre || 'id'
  const taille = Math.max(1, Math.min(1000, Math.floor(opts.taillePage || 1000)))
  const max = Math.max(1, Math.floor(opts.maxLignes || 500000))
  const out: any[] = []
  while (out.length < max) {
    let q: any = supabase.from(table).select(select)
    if (filtre) q = filtre.op === 'like' ? q.like(filtre.colonne, filtre.valeur) : q.eq(filtre.colonne, filtre.valeur)
    const { data, error } = await q.order(ordre, { ascending: true }).range(out.length, out.length + taille - 1)
    if (error || !Array.isArray(data)) return { data: null, error: error?.message || ('lecture de ' + table + ' impossible') }
    if (!data.length) return { data: out, error: null }
    out.push(...data)
  }
  return { data: null, error: 'lecture de ' + table + ' interrompue : plus de ' + max + ' lignes' }
}

// ─── Historiques BDT (par machine / par opérateur) ────────────
export async function logMachineHistorique(payload: Record<string, any>) {
  const { data, error } = await supabase.from('machine_bdt_historique').insert(payload).select().single()
  return { data, error }
}

export async function logOperateurHistorique(payload: Record<string, any>) {
  const { data, error } = await supabase.from('operateur_bdt_historique').insert(payload).select().single()
  return { data, error }
}

export async function getMachineHistorique(machineId?: string): Promise<any[]> {
  let q = supabase.from('machine_bdt_historique').select('*').order('created_at', { ascending: false })
  if (machineId) q = q.eq('machine_id', machineId)
  const { data } = await q
  return data ?? []
}

export async function getOperateurHistorique(operateurId?: string): Promise<any[]> {
  let q = supabase.from('operateur_bdt_historique').select('*').order('created_at', { ascending: false })
  if (operateurId) q = q.eq('operateur_id', operateurId)
  const { data } = await q
  return data ?? []
}

// ─── Création d'un bon de sous-traitance (affectation BST) ────
export async function createBDSRow(payload: Record<string, any>) {
  const { data, error } = await supabase.from('bons_sous_traitance').insert(payload).select().single()
  return { data, error }
}

// ══════════════════════════════════════════════════════════════
// AGRÉGATEUR DASHBOARDS – toutes les tables réelles en parallèle
// Chaque requête est protégée (→ [] si erreur/DB injoignable) afin
// que les dashboards s'affichent toujours, vides si pas de données.
// ══════════════════════════════════════════════════════════════
export interface DashboardData {
  dts: DemandeTravaux[]
  offres: Offre[]
  commandes: Commande[]
  lots: Lot[]
  bdts: BonDeTravail[]
  bsts: BonDeLivraison[]
  bcs: BonDeCommande[]
  bls: BonDeLivraison[]
  facturesClient: FactureClient[]
  facturesFournisseur: FactureFournisseur[]
  credits: Credit[]
  ncs: NonConformite[]
  das: DemandeAchat[]
  pvs: PVControle[]
  oms: OrdreMaintenance[]
  preventifs: PlanPreventif[]
  pieces: any[]
  machines: Machine[]
  salaries: any[]
  presences: any[]
  absences: Absence[]
  balancelles: Balancelle[]
  relevesBains: ReleveBain[]
  relevesEau: ReleveEau[]
  ecme: any[]
  certifications: Certification[]
  conges: any[]
  clients: Client[]
  rapports8d: any[]
  audits: Audit[]
  process: any[]
  fournisseursSt: FournisseurSt[]
  // ── Champs étendus (KPI dashboards v2) — optionnels, défaut [] ──
  stock?: any[]
  mouvementsStock?: any[]
  mtbf?: any[]
  machinesOpex?: any[]
  quarantaines?: any[]
  pointages?: any[]
  ecritures?: any[]
  nomenclatures?: any[]
  fournitures?: any[]
  controlesCotes?: any[]
  validations?: any[]
  fournisseurs?: any[]
  sousTraitants?: any[]
  objectifs?: any[]
  // ── Environnement (dashboard ISO 14001) ──
  dechetsEnv?: any[]
  mesuresEnv?: any[]
  aspectsEnv?: any[]
  conformiteEnv?: any[]
  atexEnv?: any[]
  rseEnv?: any[]
  chimiques?: any[]
  /** Lot F : lignes « à ranger » (reçu contrôlé, pas encore rangé) — chargées avec `stock` ; une rupture n'en est pas une. */
  misesEnStockARanger?: any[]
}

const _safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[])

// Chargement ciblé : 32 tables « cœur » + objectifs (peu coûteux) toujours ;
// les slices étendus (stock, mtbf, pointages…) seulement si demandés via `extra`,
// pour ne jamais saturer Supabase de requêtes inutiles selon le dashboard appelant.
export async function getDashboardData(extra: string[] = []): Promise<DashboardData> {
  const E = <T,>(k: string, p: () => Promise<T[]>): Promise<T[]> => extra.includes(k) ? _safe(p()) : Promise.resolve([] as T[])
  const [
    dts, offres, commandes, lots, bdts, bsts, bcs, bls,
    facturesClient, facturesFournisseur, credits, ncs, das, pvs,
    oms, preventifs, pieces, machines, salaries, presences, absences,
    balancelles, relevesBains, relevesEau, ecme, certifications, conges,
    clients, rapports8d, audits, process, fournisseursSt, objectifs,
    // ── étendus (conditionnels) ──
    stock, mouvementsStock, mtbf, machinesOpex, quarantaines, pointages,
    ecritures, nomenclatures, fournitures, controlesCotes, validations,
    fournisseurs, sousTraitants,
    dechetsEnv, mesuresEnv, aspectsEnv, conformiteEnv, atexEnv, rseEnv, chimiques,
    misesEnStockARanger
  ] = await Promise.all([
    _safe(getDemandesTravaux()), _safe(getOffres()), _safe(getCommandes()), _safe(getLots()),
    _safe(getBonsDeTravail()), _safe(getBSTs()), _safe(getBonsDeCommande()), _safe(getBonsDeLivraison()),
    _safe(getFacturesClient()), _safe(getFacturesFournisseur()), _safe(getCredits()), _safe(getNonConformites()),
    _safe(getDemandesAchat()), _safe(getPVControles()), _safe(getOrdresMaintenance()), _safe(getPlansPreventif()),
    _safe(getPiecesRechange()), _safe(getMachines()), _safe(getSalaries()), _safe(getPresences()),
    _safe(getAbsences()), _safe(getBalancelles()), _safe(getRelevesBains()), _safe(getRelevesEau()),
    _safe(getEcme()), _safe(getCertifications()), _safe(getConges()), _safe(getClients()),
    _safe(getRapports8D()), _safe(getAudits()), _safe(getProcessAtelier()), _safe(getFournisseursSt()),
    _safe(getKpiObjectifs()),
    // ── étendus (fetchés uniquement si listés dans `extra`) ──
    E('stock', getStockReel), E('mouvementsStock', getMouvementsStock), E('mtbf', getMtbfMachines), E('machinesOpex', getMachinesOpex),
    E('quarantaines', getQuarantaines), E('pointages', getPointages), E('ecritures', getEcrituresComptables), E('nomenclatures', getNomenclatures),
    E('fournitures', getAllFournitures), E('controlesCotes', getControlesCotes), E('validations', getValidations),
    E('fournisseurs', getFournisseurs), E('sousTraitants', getSousTraitantsAll),
    E('dechetsEnv', getHseDechets), E('mesuresEnv', getHseMesuresEnv), E('aspectsEnv', getHseAspectsImpacts),
    E('conformiteEnv', getHseConformite), E('atexEnv', getHseAtexZones), E('rseEnv', getHseRseIndicateurs),
    E('chimiques', getHseChimiques),
    E('stock', () => getMisesEnStock({ statuts: ['a_ranger'], toutes: true }).then(r => (r.error ? [] : r.data)))
  ])
  return {
    dts, offres, commandes, lots, bdts, bsts, bcs, bls,
    facturesClient, facturesFournisseur, credits, ncs, das, pvs,
    oms, preventifs, pieces, machines, salaries, presences, absences,
    balancelles, relevesBains, relevesEau, ecme, certifications, conges,
    clients, rapports8d, audits, process, fournisseursSt, objectifs,
    stock, mouvementsStock, mtbf, machinesOpex, quarantaines, pointages,
    ecritures, nomenclatures, fournitures, controlesCotes, validations,
    fournisseurs, sousTraitants,
    dechetsEnv, mesuresEnv, aspectsEnv, conformiteEnv, atexEnv, rseEnv, chimiques,
    misesEnStockARanger
  }
}

// ══════════════════════════════════════════════════════════════
// MODULE SÉCURITÉ (HSE / RSE) — CRUD tables hse_*
// Patron identique à `ecme` : payload Record, id en défaut DB (uuid).
// ══════════════════════════════════════════════════════════════

// 1. DUER — risques
export async function getHseRisques(): Promise<any[]> {
  // Priorité unifiée d'abord (1=critique), puis score Kinney brut (préserve l'ordre coef×P×F×G),
  // puis criticité G×F — pour que les risques à coef élevé remontent malgré une criticité 1-4 basse.
  const { data } = await supabase.from('hse_risques').select('*')
    .order('priorite', { ascending: true, nullsFirst: false })
    .order('score_brut', { ascending: false, nullsFirst: false })
    .order('criticite', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  return data ?? []
}
export async function createHseRisque(p: Record<string, any>) { const { data, error } = await supabase.from('hse_risques').insert(p).select().single(); return { data, error } }
export async function updateHseRisque(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_risques').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseRisque(id: string) { const { error } = await supabase.from('hse_risques').delete().eq('id', id); return { error } }
// Clone le DUERP d'une année vers l'année suivante (R.4121-2) : reconduit dangers + cotation,
// réinitialise le plan d'action (PAPRIPACT) et le statut. Refuse si l'année cible existe déjà.
export async function cloneDuerAnnee(source: number, cible: number) {
  const { data: ex } = await supabase.from('hse_risques').select('id').eq('annee', cible).limit(1)
  if (ex && ex.length) return { error: { message: `Le DUERP ${cible} existe déjà.` }, count: 0 }
  const { data: rows } = await supabase.from('hse_risques').select('*').eq('annee', source)
  if (!rows || !rows.length) return { error: { message: `Aucun risque pour l'année ${source}.` }, count: 0 }
  const clones = rows.map((r: any) => {
    const c: any = { ...r }
    delete c.id; delete c.created_at; delete c.updated_at
    c.annee = cible
    c.statut = 'a_traiter'
    c.mesures_prevues = null; c.plan_action = null; c.responsable = null; c.echeance = null
    return c
  })
  const { data, error } = await supabase.from('hse_risques').insert(clones).select('id')
  return { data, count: data ? data.length : 0, error }
}

// ─── Actions correctives / 5 Pourquoi (sécurité) ─────────────────
export async function getActionsCorrectives(): Promise<any[]> {
  const { data, error } = await supabase.from('actions_correctives').select('*').order('numero', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}
export async function createActionCorrective(p: Record<string, any>) { const row = { ...p, id: p.id || ('AC-' + Date.now().toString(36)), statut: p.statut || 'en_cours' }; const { data, error } = await supabase.from('actions_correctives').insert(row).select().single(); return { data, error } }
export async function updateActionCorrective(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('actions_correctives').update({ ...p, updated_at: new Date().toISOString() }).eq('id', id).select().single(); return { data, error } }
export async function deleteActionCorrective(id: string) { const { error } = await supabase.from('actions_correctives').delete().eq('id', id); return { error } }

// ─── Flash Sécurité ──────────────────────────────────────────────
export async function getHseFlash(): Promise<any[]> {
  const { data, error } = await supabase.from('hse_flash').select('*').order('date', { ascending: false, nullsFirst: false }).order('numero', { ascending: false, nullsFirst: false })
  if (error) return []
  return data ?? []
}
export async function createHseFlash(p: Record<string, any>) { const row = { ...p, id: p.id || ('FLASH-' + Date.now().toString(36)), statut: p.statut || 'diffuse' }; const { data, error } = await supabase.from('hse_flash').insert(row).select().single(); return { data, error } }

// ─── Matrice EPI obligatoires par zone ───────────────────────────
export async function getHseEpiZone(): Promise<any[]> {
  const { data, error } = await supabase.from('hse_epi_zone').select('*').order('zone', { ascending: true })
  if (error) return []
  return data ?? []
}
export async function createHseEpiZone(p: Record<string, any>) { const row = { ...p, id: p.id || ('EZ-' + Date.now().toString(36)) }; const { data, error } = await supabase.from('hse_epi_zone').insert(row).select().single(); return { data, error } }
export async function updateHseEpiZone(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_epi_zone').update({ ...p, updated_at: new Date().toISOString() }).eq('id', id).select().single(); return { data, error } }
export async function deleteHseEpiZone(id: string) { const { error } = await supabase.from('hse_epi_zone').delete().eq('id', id); return { error } }
export async function updateHseFlash(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_flash').update({ ...p, updated_at: new Date().toISOString() }).eq('id', id).select().single(); return { data, error } }
export async function deleteHseFlash(id: string) { const { error } = await supabase.from('hse_flash').delete().eq('id', id); return { error } }

// 2. Accidents / presqu'accidents
export async function getHseIncidents(): Promise<any[]> {
  const { data } = await supabase.from('hse_incidents').select('*').order('date_incident', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHseIncident(p: Record<string, any>) { const { data, error } = await supabase.from('hse_incidents').insert(p).select().single(); return { data, error } }
export async function updateHseIncident(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_incidents').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseIncident(id: string) { const { error } = await supabase.from('hse_incidents').delete().eq('id', id); return { error } }

// 3. Catalogue EPI
export async function getHseEpiCatalogue(): Promise<any[]> {
  const { data } = await supabase.from('hse_epi_catalogue').select('*').order('categorie').order('nom')
  return data ?? []
}
export async function createHseEpiCat(p: Record<string, any>) { const { data, error } = await supabase.from('hse_epi_catalogue').insert(p).select().single(); return { data, error } }
export async function updateHseEpiCat(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_epi_catalogue').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseEpiCat(id: string) { const { error } = await supabase.from('hse_epi_catalogue').delete().eq('id', id); return { error } }

// 4. Dotations EPI
export async function getHseEpiDotations(): Promise<any[]> {
  const { data } = await supabase.from('hse_epi_dotations').select('*').order('date_peremption', { ascending: true, nullsFirst: false })
  return data ?? []
}
export async function createHseEpiDotation(p: Record<string, any>) { const { data, error } = await supabase.from('hse_epi_dotations').insert(p).select().single(); return { data, error } }
export async function updateHseEpiDotation(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_epi_dotations').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseEpiDotation(id: string) { const { error } = await supabase.from('hse_epi_dotations').delete().eq('id', id); return { error } }

// ─── Réconciliation salariés : rattache les enregistrements HSE orphelins (salarie_id null)
// dont le nom correspond exactement au salarié donné. Renvoie le nombre de lignes rattachées. ───
function _normNom(s: any): string {
  return String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
export async function relinkSalarieOrphans(salarieId: string, nom: string, prenom: string): Promise<number> {
  const targets = new Set([_normNom(`${nom} ${prenom}`), _normNom(`${prenom} ${nom}`)].filter(Boolean))
  if (!targets.size || !salarieId) return 0
  // Garde-fou ambiguïté (comme relink_salaries.py) : ne pas rattacher un nom partagé par
  // plusieurs salariés (homonymes / inversion nom↔prénom) — sinon mauvaise imputation d'accident.
  const salaries = await getSalaries().catch(() => [] as any[])
  const nameCount = new Map<string, number>()
  for (const s of salaries as any[]) for (const v of [_normNom(`${s.nom || ''} ${s.prenom || ''}`), _normNom(`${s.prenom || ''} ${s.nom || ''}`)]) if (v) nameCount.set(v, (nameCount.get(v) || 0) + 1)
  const safe = new Set([...targets].filter(t => (nameCount.get(t) || 0) <= 1))
  if (!safe.size) return 0
  const [incidents, dotations, certs] = await Promise.all([
    getHseIncidents().catch(() => [] as any[]), getHseEpiDotations().catch(() => [] as any[]), getCertifications().catch(() => [] as any[]),
  ])
  let n = 0
  for (const r of incidents as any[]) if (!r.salarie_id && safe.has(_normNom(r.salarie_nom))) { await updateHseIncident(r.id, { salarie_id: salarieId }); n++ }
  for (const r of dotations as any[]) if (!r.salarie_id && safe.has(_normNom(r.salarie_nom))) { await updateHseEpiDotation(r.id, { salarie_id: salarieId }); n++ }
  for (const r of certs as any[]) if (!r.salarie_id && safe.has(_normNom(r.employe_nom))) { await updateCertification(r.id, { salarie_id: salarieId } as any); n++ }
  return n
}

// Clé ordre-insensible : « HANLI Murat » et « Murat HANLI » → même clé (tokens triés).
function _nameKey(s: any): string { return _normNom(s).split(' ').filter(Boolean).sort().join(' ') }
// Sépare prénom/nom avec heuristique : les tokens en MAJUSCULES forment le nom de famille
// (convention FR), même sur 3+ tokens (« LE GOFF Yann » → nom « LE GOFF », prénom « Yann »).
function _splitNom(name: string): { nom: string; prenom: string } {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { nom: parts[0] || name, prenom: '' }
  const isUp = (w: string) => w.length > 1 && w === w.toUpperCase() && /[A-ZÀ-Þ]/.test(w)
  const ups = parts.filter(isUp), lows = parts.filter(w => !isUp(w))
  if (ups.length && lows.length) return { nom: ups.join(' '), prenom: lows.join(' ') }
  if (ups.length === parts.length) return { nom: parts.join(' '), prenom: '' }  // tout en majuscules (import) → nom complet
  return { nom: parts.slice(1).join(' '), prenom: parts[0] }                     // aucun en majuscules → positionnel
}

// Noms cités dans les enregistrements HSE orphelins ET absents de la base salariés.
// Sert au panneau « Salariés à rattacher » (RH › Employés). Dédoublonne par clé ordre-insensible.
export function computeOrphanNames(salaries: any[], incidents: any[], dotations: any[], certs: any[]): any[] {
  const known = new Set<string>()
  for (const s of salaries) known.add(_nameKey(`${s.nom || ''} ${s.prenom || ''}`))
  const agg = new Map<string, any>()
  const push = (raw: any, src: string) => {
    const name = String(raw || '').trim(); const k = _nameKey(name)
    if (!k || known.has(k)) return
    if (!agg.has(k)) agg.set(k, { raw: name, ..._splitNom(name), incidents: 0, dotations: 0, certs: 0 })
    agg.get(k)[src]++
  }
  for (const r of incidents) if (!r.salarie_id) push(r.salarie_nom, 'incidents')
  for (const r of dotations) if (!r.salarie_id) push(r.salarie_nom, 'dotations')
  for (const r of certs) if (!r.salarie_id) push(r.employe_nom, 'certs')
  return [...agg.values()].map(o => ({ ...o, total: o.incidents + o.dotations + o.certs })).sort((a, b) => b.total - a.total)
}

// 5. Produits chimiques / FDS
export async function getHseChimiques(): Promise<any[]> {
  const { data } = await supabase.from('hse_produits_chimiques').select('*').order('nom')
  return data ?? []
}
export async function createHseChimique(p: Record<string, any>) { const { data, error } = await supabase.from('hse_produits_chimiques').insert(p).select().single(); return { data, error } }
export async function updateHseChimique(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_produits_chimiques').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseChimique(id: string) { const { error } = await supabase.from('hse_produits_chimiques').delete().eq('id', id); return { error } }

// 6. Registre des déchets
export async function getHseDechets(): Promise<any[]> {
  const { data } = await supabase.from('hse_dechets').select('*').order('date_dechet', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHseDechet(p: Record<string, any>) { const { data, error } = await supabase.from('hse_dechets').insert(p).select().single(); return { data, error } }
export async function updateHseDechet(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_dechets').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseDechet(id: string) { const { error } = await supabase.from('hse_dechets').delete().eq('id', id); return { error } }
// Fail-soft : colonnes source_type/source_ref (env_dechets_source_schema.sql) pour la traçabilité + idempotence
// des déchets créés automatiquement (quarantaine, rebut NC, périssable…).
let _dechetsSource: boolean | null = null
export async function hseDechetsHasSource(): Promise<boolean> {
  if (_dechetsSource != null) return _dechetsSource
  const { error } = await supabase.from('hse_dechets').select('source_ref').limit(1)
  _dechetsSource = !error
  return _dechetsSource
}
// Crée un déchet depuis un événement source de façon IDEMPOTENTE (aucun doublon si l'événement est rejoué).
export async function ensureHseDechet(sourceType: string, sourceRef: string, payload: Record<string, any>) {
  const hasSrc = await hseDechetsHasSource()
  if (hasSrc && sourceRef) {
    const { data: ex } = await supabase.from('hse_dechets').select('id').eq('source_type', sourceType).eq('source_ref', String(sourceRef)).limit(1)
    if (ex && ex.length) return { data: ex[0], error: null, existed: true }
  }
  const p: Record<string, any> = { ...payload }
  if (hasSrc) { p.source_type = sourceType; p.source_ref = String(sourceRef) }
  const { data, error } = await supabase.from('hse_dechets').insert(p).select().single()
  return { data, error, existed: false }
}

// 7. Mesures environnementales
export async function getHseMesuresEnv(): Promise<any[]> {
  const { data } = await supabase.from('hse_mesures_env').select('*').order('date_mesure', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHseMesureEnv(p: Record<string, any>) { const { data, error } = await supabase.from('hse_mesures_env').insert(p).select().single(); return { data, error } }
export async function updateHseMesureEnv(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_mesures_env').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseMesureEnv(id: string) { const { error } = await supabase.from('hse_mesures_env').delete().eq('id', id); return { error } }

// 8. Zones ATEX
export async function getHseAtexZones(): Promise<any[]> {
  const { data } = await supabase.from('hse_atex_zones').select('*').order('nom')
  return data ?? []
}
export async function createHseAtexZone(p: Record<string, any>) { const { data, error } = await supabase.from('hse_atex_zones').insert(p).select().single(); return { data, error } }
export async function updateHseAtexZone(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_atex_zones').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseAtexZone(id: string) { const { error } = await supabase.from('hse_atex_zones').delete().eq('id', id); return { error } }

// 9. Vérifications périodiques (VGP)
export async function getHseVerifications(): Promise<any[]> {
  const { data } = await supabase.from('hse_verifications').select('*').order('date_prochaine', { ascending: true, nullsFirst: false })
  return data ?? []
}
export async function createHseVerification(p: Record<string, any>) { const { data, error } = await supabase.from('hse_verifications').insert(p).select().single(); return { data, error } }
export async function updateHseVerification(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_verifications').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseVerification(id: string) { const { error } = await supabase.from('hse_verifications').delete().eq('id', id); return { error } }

// 10. Formations requises (matrice)
export async function getHseFormationsRequises(): Promise<any[]> {
  const { data } = await supabase.from('hse_formations_requises').select('*').order('poste').order('formation')
  return data ?? []
}
export async function createHseFormationRequise(p: Record<string, any>) { const { data, error } = await supabase.from('hse_formations_requises').insert(p).select().single(); return { data, error } }
export async function updateHseFormationRequise(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_formations_requises').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseFormationRequise(id: string) { const { error } = await supabase.from('hse_formations_requises').delete().eq('id', id); return { error } }

// 11. Exercices d'évacuation
export async function getHseExercices(): Promise<any[]> {
  const { data } = await supabase.from('hse_exercices').select('*').order('date_exercice', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHseExercice(p: Record<string, any>) { const { data, error } = await supabase.from('hse_exercices').insert(p).select().single(); return { data, error } }
export async function updateHseExercice(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_exercices').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseExercice(id: string) { const { error } = await supabase.from('hse_exercices').delete().eq('id', id); return { error } }

// ── Parties intéressées (ISO 14001 §4.2) — cotation Influence × Maîtrise ──
export async function getHsePartiesInteressees(): Promise<any[]> {
  const { data } = await supabase.from('hse_parties_interessees').select('*').order('score', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHsePartieInteressee(p: Record<string, any>) { const { data, error } = await supabase.from('hse_parties_interessees').insert(p).select().single(); return { data, error } }
export async function updateHsePartieInteressee(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_parties_interessees').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHsePartieInteressee(id: string) { const { error } = await supabase.from('hse_parties_interessees').delete().eq('id', id); return { error } }

// ── Diagnostic ISO 14001 (autodiagnostic clause par clause, niveau 1-4) ──
export async function getHseDiagnosticIso(): Promise<any[]> {
  const { data } = await supabase.from('hse_diagnostic_iso').select('*').order('chapitre', { ascending: true, nullsFirst: false })
  return data ?? []
}
export async function createHseDiagnosticIso(p: Record<string, any>) { const { data, error } = await supabase.from('hse_diagnostic_iso').insert(p).select().single(); return { data, error } }
export async function updateHseDiagnosticIso(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_diagnostic_iso').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseDiagnosticIso(id: string) { const { error } = await supabase.from('hse_diagnostic_iso').delete().eq('id', id); return { error } }

// 12. Plans de prévention / permis
export async function getHsePlansPrevention(): Promise<any[]> {
  const { data } = await supabase.from('hse_plans_prevention').select('*').order('date_debut', { ascending: false, nullsFirst: false })
  return data ?? []
}
export async function createHsePlanPrevention(p: Record<string, any>) { const { data, error } = await supabase.from('hse_plans_prevention').insert(p).select().single(); return { data, error } }
export async function updateHsePlanPrevention(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_plans_prevention').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHsePlanPrevention(id: string) { const { error } = await supabase.from('hse_plans_prevention').delete().eq('id', id); return { error } }

// 13. Indicateurs RSE
export async function getHseRseIndicateurs(): Promise<any[]> {
  const { data } = await supabase.from('hse_rse_indicateurs').select('*').order('categorie').order('code')
  return data ?? []
}
export async function createHseRseIndicateur(p: Record<string, any>) { const { data, error } = await supabase.from('hse_rse_indicateurs').insert(p).select().single(); return { data, error } }
export async function updateHseRseIndicateur(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_rse_indicateurs').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseRseIndicateur(id: string) { const { error } = await supabase.from('hse_rse_indicateurs').delete().eq('id', id); return { error } }

// 14. Conformité réglementaire
export async function getHseConformite(): Promise<any[]> {
  const { data } = await supabase.from('hse_conformite').select('*').order('domaine').order('created_at')
  return data ?? []
}

// 14b. Exposition chimique par situation de travail (SEIRICH Phase 2) — fail-soft si table absente
export async function getHseExpositions(): Promise<any[]> {
  const { data } = await supabase.from('hse_exposition_chimique').select('*').order('niveau_sante', { ascending: false, nullsFirst: false })
  return data ?? []
}
// Cote la situation à l'écriture (snapshot résiduel, sans contexte Qmax → l'affichage recote LIVE avec le Qmax de la zone).
async function _coteExposition(p: Record<string, any>) {
  let chim: any = null
  if (p.produit_id) { const { data } = await supabase.from('hse_produits_chimiques').select('*').eq('id', p.produit_id).limit(1); chim = Array.isArray(data) ? data[0] : null }
  if (!p.produit_nom && chim) p.produit_nom = chim.nom
  const r = computeExpositionSante(chim, p)
  p.score_sante = Math.round(r.scoreResiduel)
  p.niveau_sante = r.niveauSante
  p.significatif = r.significatif
  return p
}
export async function createHseExposition(p: Record<string, any>) { p = await _coteExposition(p); const { data, error } = await supabase.from('hse_exposition_chimique').insert(p).select().single(); return { data, error } }
export async function updateHseExposition(id: string, p: Record<string, any>) { p = await _coteExposition(p); const { data, error } = await supabase.from('hse_exposition_chimique').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseExposition(id: string) { const { error } = await supabase.from('hse_exposition_chimique').delete().eq('id', id); return { error } }

// Fiche produit chimique 360 : agrège danger + situations d'exposition + péremption (lots) + stock + actions.
// Jointures SOUPLES sur l'existant (aucune migration) : stock par ref_stock↔reference ; périssables par code GPAO ou nom normalisé.
export async function getHseChimiqueDetail(id: string) {
  const [chimiques, expositions, perissables, stock, actions] = await Promise.all([
    getHseChimiques().catch(() => [] as any[]),
    getHseExpositions().catch(() => [] as any[]),
    getProduitsPerissables().catch(() => [] as any[]),
    getStockReel().catch(() => [] as any[]),
    getActionsCorrectives().catch(() => [] as any[]),
  ])
  const p = (chimiques as any[]).find((x: any) => String(x.id) === String(id))
  if (!p) return { produit: null as any }
  const norm = (s: any) => String(s ?? '').toLowerCase().trim()
  const splitCodes = (r: any) => String(r ?? '').split(/[/,;\s]+/).map(norm).filter(Boolean)
  const codesOf = (s: any) => new Set(String(s || '').match(/\d{5,6}/g) || [])
  const nkey = (s: any) => { const t = String(s || '').replace(/,.*$/, '').normalize('NFD').replace(/[̀-ͯ]/g, ''); return (t.toLowerCase().match(/[a-z0-9]+/g) || []).sort().join('') }
  // Situations d'exposition de ce produit + Qmax par unité de travail (calculé sur TOUTES les expositions, pour un ratio correct)
  const expos = (expositions as any[]).filter((e: any) => String(e.produit_id || '') === String(id))
  const qmaxByUT: Record<string, number> = {}
  ;(expositions as any[]).forEach((e: any) => { const ut = String(e.unite_travail || '—'); const q = normQuantiteChimique(e.quantite_utilisee, e.unite); if (q > (qmaxByUT[ut] || 0)) qmaxByUT[ut] = q })
  // Stock : ref_stock (multi-codes) ↔ stock.reference
  const codes = splitCodes(p.ref_stock)
  const stockByRef: Record<string, any> = {}
  for (const s of stock as any[]) if (s.reference) stockByRef[norm(s.reference)] = s
  const stockRows = codes.map((c) => stockByRef[c]).filter(Boolean)
  // Péremption : code GPAO commun OU nom normalisé identique
  const pcodes = codesOf(p.ref_stock), pnk = nkey(p.nom)
  const perissRows = (perissables as any[]).filter((pe: any) => {
    const byCode = pcodes.size > 0 && [...codesOf(pe.code_produit || pe.reference)].some((c) => pcodes.has(c))
    const byName = pnk && nkey(pe.nom) === pnk
    return byCode || byName
  }).map((pe: any) => ({ ...pe, _match: (pcodes.size > 0 && [...codesOf(pe.code_produit || pe.reference)].some((c) => pcodes.has(c))) ? 'code' : 'nom' }))
  // Actions correctives liées aux situations d'exposition de ce produit
  const expoIds = new Set(expos.map((e: any) => String(e.id)))
  const acts = (actions as any[]).filter((a: any) => a.source_type === 'exposition' && expoIds.has(String(a.source_ref || '')))
  return { produit: p, expositions: expos, qmaxByUT, perissables: perissRows, stock: stockRows, actions: acts }
}

// 15. Aspects & impacts environnementaux (ISO 14001 §6.1.2) — fail-soft si table absente
export async function getHseAspectsImpacts(): Promise<any[]> {
  const { data } = await supabase.from('hse_aspects_impacts').select('*').order('created_at', { ascending: false })
  return data ?? []
}
// Fail-soft AES multi-axes : les colonnes probabilite/sensibilite/maitrise_* sont ajoutées par
// env_aes_multiaxe_schema.sql. Tant que la migration n'est pas jouée, on les retire du payload.
const AES_MULTIAXE_COLS = ['probabilite', 'sensibilite', 'maitrise_technique', 'maitrise_humaine', 'maitrise_organisationnelle']
let _aesMultiaxe: boolean | null = null
export async function hseAspectsHasMultiaxe(): Promise<boolean> {
  if (_aesMultiaxe != null) return _aesMultiaxe
  const { error } = await supabase.from('hse_aspects_impacts').select('probabilite').limit(1)
  _aesMultiaxe = !error
  return _aesMultiaxe
}
let _aesCycleVie: boolean | null = null
export async function hseAspectsHasCycleVie(): Promise<boolean> {
  if (_aesCycleVie != null) return _aesCycleVie
  const { error } = await supabase.from('hse_aspects_impacts').select('etape_cycle_vie').limit(1)
  _aesCycleVie = !error
  return _aesCycleVie
}
async function _stripAspects(p: Record<string, any>) {
  const q: Record<string, any> = { ...p }
  if (!(await hseAspectsHasMultiaxe())) for (const k of AES_MULTIAXE_COLS) delete q[k]
  if (!(await hseAspectsHasCycleVie())) delete q.etape_cycle_vie
  return q
}
export async function createHseAspectImpact(p: Record<string, any>) { const pp = await _stripAspects(p); const { data, error } = await supabase.from('hse_aspects_impacts').insert(pp).select().single(); return { data, error } }
export async function updateHseAspectImpact(id: string, p: Record<string, any>) { const pp = await _stripAspects(p); const { data, error } = await supabase.from('hse_aspects_impacts').update(pp).eq('id', id).select().single(); return { data, error } }

// ── Autodiagnostic ISO 26000 (RSE, 7 questions centrales) ──
export async function getHseDiagnosticIso26000(): Promise<any[]> {
  const { data } = await supabase.from('hse_diagnostic_iso26000').select('*').order('code', { ascending: true, nullsFirst: false })
  return data ?? []
}
export async function createHseDiagnosticIso26000(p: Record<string, any>) { const { data, error } = await supabase.from('hse_diagnostic_iso26000').insert(p).select().single(); return { data, error } }
export async function updateHseDiagnosticIso26000(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('hse_diagnostic_iso26000').update(p).eq('id', id).select().single(); return { data, error } }
export async function deleteHseDiagnosticIso26000(id: string) { const { error } = await supabase.from('hse_diagnostic_iso26000').delete().eq('id', id); return { error } }
export async function deleteHseAspectImpact(id: string) { const { error } = await supabase.from('hse_aspects_impacts').delete().eq('id', id); return { error } }

// ─── OBJECTIFS / CIBLES KPI (configurables, table kpi_objectifs) ──
export async function getKpiObjectifs(): Promise<any[]> {
  const { data } = await supabase.from('kpi_objectifs').select('*').order('code')
  return data ?? []
}
export async function upsertKpiObjectif(p: Record<string, any>) {
  const { data, error } = await supabase
    .from('kpi_objectifs')
    .upsert({ ...p, updated_at: new Date().toISOString() }, { onConflict: 'code,entite' })
    .select().single()
  return { data, error }
}
export async function deleteKpiObjectif(id: string) {
  const { error } = await supabase.from('kpi_objectifs').delete().eq('id', id)
  return { error }
}

// ─── VALIDATIONS DIRECTION (file à valider, multi-domaines) ────
export async function getValidations(): Promise<any[]> {
  const { data } = await supabase.from('validations').select('*').order('created_at', { ascending: false })
  return data ?? []
}
export async function createValidation(p: Record<string, any>) { const { data, error } = await supabase.from('validations').insert(p).select().single(); return { data, error } }
export async function decideValidation(id: string, p: Record<string, any>) { const { data, error } = await supabase.from('validations').update(p).eq('id', id).select().single(); return { data, error } }
// Lot F (15/09/2026) — excédent de réception : lecture STRICTE (une panne n'est pas « absente ») et décision
// CONDITIONNELLE (la demande ne bouge que si elle est encore dans le statut lu : un double clic ne l'accepte pas deux fois).
export async function getValidationStricte(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('validations').select('*').eq('id', id).maybeSingle()
  return { data: data ?? null, error: error ? error.message : null }
}
export async function decideValidationSi(id: string, p: Record<string, any>, statutAttendu: string): Promise<{ data: any | null; error: string | null; conflit: boolean }> {
  const { data, error } = await supabase.from('validations').update(p).eq('id', id).eq('statut', statutAttendu).select()
  if (error) return { data: null, error: error.message, conflit: false }
  const rows = (data ?? []) as any[]
  return { data: rows[0] ?? null, error: null, conflit: rows.length === 0 }
}
// Lecture générique d'un objet source (table + id) pour la consultation depuis le cockpit Direction.
// La table est validée en amont (whitelist côté route). PK = colonne `id` pour toutes les tables ciblées.
export async function getSourceRow(table: string, id: string) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).limit(1)
  return { data: (Array.isArray(data) && data[0]) || null, error }
}
// Fail-soft veille : colonnes source/date_parution/type_texte ajoutées par env_veille_schema.sql.
const CONF_VEILLE_COLS = ['source', 'date_parution', 'type_texte']
let _confVeille: boolean | null = null
export async function hseConformiteHasVeille(): Promise<boolean> {
  if (_confVeille != null) return _confVeille
  const { error } = await supabase.from('hse_conformite').select('source').limit(1)
  _confVeille = !error
  return _confVeille
}
async function _stripConfVeille(p: Record<string, any>) {
  if (await hseConformiteHasVeille()) return p
  const q: Record<string, any> = { ...p }; for (const k of CONF_VEILLE_COLS) delete q[k]; return q
}
export async function createHseConformite(p: Record<string, any>) { const pp = await _stripConfVeille(p); const { data, error } = await supabase.from('hse_conformite').insert(pp).select().single(); return { data, error } }
export async function updateHseConformite(id: string, p: Record<string, any>) { const pp = await _stripConfVeille(p); const { data, error } = await supabase.from('hse_conformite').update(pp).eq('id', id).select().single(); return { data, error } }
export async function deleteHseConformite(id: string) { const { error } = await supabase.from('hse_conformite').delete().eq('id', id); return { error } }
