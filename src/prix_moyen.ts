// ═══════════════════════════════════════════════════════════════════════════
// PRIX MOYEN MULTI-FOURNISSEURS — module PUR, partagé serveur ↔ navigateur (lot H1, 17/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
// « pour le moment on va aller sur le fait de faire un prix moyen de tous les fournisseurs pour la
//   dite référence (et faire la conversion quand le nombre de pièces dans un paquet par exemple
//   diffère selon le fournisseur) » (17/09/2026)
//
// Une ligne de fourniture d'une nomenclature ne porte plus de fournisseur : elle porte une
// RÉFÉRENCE. Le prix estimé de cette référence est la moyenne des prix de TOUS les fournisseurs
// qui la portent au catalogue (`produits_fournisseurs`), après conversion :
//   • accessoire : prix_pièce_i = prix_i / qte_paquet_i   (paquet non déclaré ⇒ compté 1, SIGNALÉ) ;
//   • matière    : prix_tôle moyen = moyenne(prix_i) ; le nb de pièces par tôle reste saisi au BE
//                  (il dépend de l'imbrication de la pièce, pas du fournisseur).
//
// ⚠ AUCUNE dépendance (ni Hono, ni Supabase, ni shared.ts) et AUCUNE référence à une constante de
//   module DANS LES FONCTIONS : elles sont ré-émises telles quelles au navigateur par
//   `prixMoyenClientJs()` (Function.prototype.toString). Une fonction qui lirait une constante du
//   module planterait côté client (ReferenceError) une fois le bundle minifié — le test
//   `scripts_doc/test_prix_moyen.mjs` le vérifie sur un bundle MINIFIÉ.
//   Corollaire : tout helper appelé par une fonction émise est lui aussi exporté ET émis.
//   Style volontairement ES5 (var, function, pas de spread ni d'optional chaining) : le texte part
//   tel quel dans un <script> de page.
//
// Durée de validité d'un prix : `PRIX_VALIDITE_JOURS` (183 j) vit dans shared.ts. Elle est passée
// en option (`validiteJours`) ; le repli en dur 183 de ce module est vérifié égal par les tests.

// ─── Types ───────────────────────────────────────────────────────────────────
/** Ligne du catalogue fournisseur (`produits_fournisseurs`, lue en `select('*')`). */
export type LigneCatalogue = {
  id?: string | null
  fournisseur_id?: string | null
  fournisseur_nom?: string | null
  reference?: string | null
  designation?: string | null
  prix?: number | string | null          // prix de la TÔLE (matière) ou du PAQUET (accessoire)
  qte_paquet?: number | string | null    // nb de pièces par paquet (colonne numérique, migration 017 / cloud-13)
  conditionnement?: string | null        // ancien libellé libre — repli numérique tant que cloud-13 n'est pas joué
  date_prix?: string | null
  categorie?: string | null
  source_prix?: string | null
  activite?: string | null
}

/** Ce qu'apporte UN fournisseur à la moyenne d'une référence. */
export type DetailPrixMoyen = {
  fournisseur_id: string | null
  fournisseur_nom: string
  reference: string
  prix_catalogue: number        // prix lu au catalogue (tôle ou paquet)
  qte_paquet: number | null     // accessoire : pièces par paquet (null = non déclaré → compté 1)
  prix_converti: number         // accessoire : €/pièce · matière : €/tôle
  date_prix: string | null
  perime: boolean
  sans_conditionnement: boolean
  source_prix: string | null
}

/** Résultat du calcul pour une référence. */
export type PrixMoyenRef = {
  reference: string
  reference_normalisee: string
  categorie: 'matiere' | 'accessoire'
  prix_unitaire: number              // € par PIÈCE de la nomenclature (matière : prix_base ÷ nb_par_tole)
  prix_base: number                  // accessoire : €/pièce · matière : €/tôle (moyenne des prix catalogue convertis)
  prix_tole: number | null           // matière : = prix_base · accessoire : null
  nb_par_tole: number | null
  nb_fournisseurs: number
  min: number                        // min / max des prix convertis (même base que prix_base)
  max: number
  perime: boolean                    // au moins un prix utilisé a plus de `validiteJours`
  incomplet: boolean                 // aucun prix chiffré : coût de revient incomplet
  sans_conditionnement: string[]     // fournisseurs chiffrés sans qté/paquet déclarée (accessoires)
  date_plus_ancienne: string | null
  date_plus_recente: string | null
  detail: DetailPrixMoyen[]
}

/** Options communes (toutes facultatives). */
export type OptionsPrixMoyen = {
  nbParTole?: number | string | null
  validiteJours?: number | null
  maintenant?: number | null         // horodatage de référence (tests)
}

/** Une entrée de la liste de choix « réf — désignation » (recherche sans fournisseur). */
export type OptionReference = {
  reference: string
  reference_normalisee: string
  designation: string
  nb_fournisseurs: number
  fournisseurs: string[]
}

/** Groupe de lignes de fourniture portant la même référence normalisée (doublon interdit). */
export type DoublonFourniture = {
  cle: string
  cle_sur: 'reference' | 'designation'
  reference: string
  designation: string
  indices: number[]
  categories: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS PURES — toutes exportées, toutes ré-émises au navigateur.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalisation d'une référence (ou de tout texte comparé) : accents retirés, espaces multiples
 * réduits à un seul, bords coupés, minuscules. « 126 001 » ≠ « 126001 » (on ne supprime PAS les
 * espaces internes : deux codes distincts ne doivent pas fusionner), mais « Réf A » = « ref  a ».
 */
export function normaliserReference(valeur: any): string {
  var t = (valeur === null || valeur === undefined) ? '' : String(valeur)
  if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '')
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/^ +| +$/g, '')
  return t.toLowerCase()
}

/** Deux références désignent-elles le même article ? (comparaison normalisée) */
export function memeReference(a: any, b: any): boolean {
  var na = normaliserReference(a)
  return na !== '' && na === normaliserReference(b)
}

/**
 * Catégorie ramenée aux deux compartiments de la nomenclature.
 *   'matiere_premiere' | 'matiere' | 'matière' → 'matiere'
 *   'accessoire' → 'accessoire' · tout le reste (outillage, chimique, consommable, autre) → ''
 */
export function categorieFourniture(valeur: any): string {
  var c = normaliserReference(valeur).replace(/[ _-]/g, '')
  if (c.indexOf('matiere') === 0) return 'matiere'
  if (c.indexOf('accessoire') === 0) return 'accessoire'
  return ''
}

/**
 * Une ligne catalogue concerne-t-elle ce compartiment ? Une ligne SANS catégorie déclarée est
 * acceptée (tolérance : la catégorie du catalogue est une déclaration parfois oubliée, c'est la
 * référence qui identifie l'article). Une catégorie d'une AUTRE famille exclut la ligne.
 */
export function categorieCompatible(categorieProduit: any, compartiment: any): boolean {
  var voulu = categorieFourniture(compartiment)
  if (!voulu) return true
  var lu = normaliserReference(categorieProduit)
  if (lu === '') return true
  return categorieFourniture(lu) === voulu
}

/** Nombre lisible et strictement positif, sinon null (« 0 », '', null, 'abc' → null). */
export function nombrePositif(valeur: any): number | null {
  if (valeur === null || valeur === undefined || valeur === '') return null
  var n = typeof valeur === 'number' ? valeur : parseFloat(String(valeur).replace(',', '.'))
  if (!isFinite(n) || n <= 0) return null
  return n
}

/** Arrondi à 6 décimales : supprime le bruit des divisions (0.30000000000000004). */
export function arrondiPrix(n: number): number {
  if (!isFinite(n)) return 0
  return Math.round(n * 1e6) / 1e6
}

/**
 * Qté par paquet d'une ligne catalogue : colonne numérique `qte_paquet` (migration 017 / cloud-13),
 * à défaut l'ancien libellé `conditionnement` (compatibilité CLOUD tant que cloud-13 n'est pas joué :
 * la colonne peut être absente, la valeur arrive alors `undefined`).
 * null = conditionnement NON déclaré.
 *
 * ⚠ RELECTURE 17/09/2026 — le repli n'accepte QUE des libellés qui SONT un nombre de pièces, jamais
 *   des libellés qui en CONTIENNENT un. `nombrePositif` fait un `parseFloat`, qui lit « 25 kg » → 25,
 *   « 6 m » → 6, « 500 g » → 500 : le prix du catalogue se serait trouvé divisé EN SILENCE par une
 *   masse ou une longueur (prix moyen, coût de revient, analyse DT), et précisément là où c'est
 *   invérifiable — sur le CLOUD, où `conditionnement` est une colonne texte historique. Un libellé
 *   qui n'est pas un simple nombre (éventuellement suivi de « pce » / « pièces ») rend donc `null` :
 *   le prix est compté À LA PIÈCE et SIGNALÉ en orange (« conditionnement non déclaré »), ce qui est
 *   le comportement sûr voulu par la spec §3.
 */
export function qtePaquetDe(produit: any): number | null {
  if (!produit) return null
  var q = nombrePositif(produit.qte_paquet)
  if (q !== null) return q
  var c = produit.conditionnement
  if (c === null || c === undefined) return null
  var t = normaliserReference(c)                    // accents retirés, minuscules, espaces réduits
  if (!/^[0-9]+([.,][0-9]+)? ?(p|pc|pcs|pce|pces|piece|pieces)?\.?$/.test(t)) return null
  return nombrePositif(t.replace(/[^0-9.,].*$/, ''))
}

/** Un prix daté de plus de `validiteJours` (183 j par défaut) est PÉRIMÉ. Date illisible = périmé. */
export function prixPerime(datePrix: any, validiteJours?: number | null, maintenant?: number | null): boolean {
  var vj = Number(validiteJours)
  if (!isFinite(vj) || vj <= 0) vj = 183
  var now = Number(maintenant)
  if (!isFinite(now) || now <= 0) now = Date.now()
  if (!datePrix) return true
  var t = Date.parse(String(datePrix))
  if (isNaN(t)) return true
  return (now - t) >= vj * 86400000
}

/**
 * PRIX MOYEN d'une référence, tous fournisseurs confondus (spec H1 §3).
 *
 *   prixMoyenReference(produits, reference, 'accessoire')                 → €/pièce
 *   prixMoyenReference(produits, reference, 'matiere', 4)                 → 4e argument = nb par tôle
 *   prixMoyenReference(produits, reference, 'matiere', { nbParTole: 4, validiteJours: 183 })
 *
 * Entrent dans la moyenne TOUTES les lignes catalogue de la même référence normalisée, de la bonne
 * catégorie, dont le prix est > 0 — quel que soit le fournisseur, son site ou l'âge du prix.
 * Un prix de plus de `validiteJours` n'est pas écarté : il est compté et `perime` passe à vrai
 * (« demande de prix conseillée »). Aucun prix ⇒ `incomplet` (le coût de revient est incomplet,
 * la validation reste permise).
 */
export function prixMoyenReference(produits: any, reference: any, categorie?: any, opts?: any): PrixMoyenRef {
  var o: any = (opts === null || opts === undefined) ? {} : (typeof opts === 'object' ? opts : { nbParTole: opts })
  var vj = Number(o.validiteJours)
  if (!isFinite(vj) || vj <= 0) vj = 183
  var now = Number(o.maintenant)
  if (!isFinite(now) || now <= 0) now = Date.now()
  var cat = categorieFourniture(categorie) === 'matiere' ? 'matiere' : 'accessoire'
  var npt = nombrePositif(o.nbParTole)
  var refNorm = normaliserReference(reference)
  var liste: any[] = []
  var i
  if (produits && produits.length) for (i = 0; i < produits.length; i++) liste.push(produits[i])

  var detail: any[] = []
  var somme = 0, min = 0, max = 0, perime = false
  var sans: string[] = []
  var dMin: string | null = null, dMax: string | null = null
  // ⚠ `Object.create(null)` et non `{}` : la clé est un `fournisseur_id` VENU DES DONNÉES. Avec un
  //   objet littéral, un id valant « constructor » / « toString » / « __proto__ » rendrait la valeur
  //   HÉRITÉE d'Object.prototype — la ligne disparaissait alors de la moyenne sans un mot.
  var vus: any = Object.create(null)     // clé fournisseur → rang de sa ligne retenue dans `detail`
  var majs: string[] = []                // `updated_at` de la ligne retenue (départage à date égale)
  for (i = 0; i < liste.length; i++) {
    var p = liste[i]
    if (!p) continue
    if (refNorm === '' || normaliserReference(p.reference) !== refNorm) continue
    if (!categorieCompatible(p.categorie, cat)) continue
    var prix = nombrePositif(p.prix)
    if (prix === null) continue                      // ligne sans prix : ne compte pas dans la moyenne
    var qp = cat === 'accessoire' ? qtePaquetDe(p) : null
    var converti = arrondiPrix(cat === 'accessoire' ? (prix / (qp === null ? 1 : qp)) : prix)
    var nomF = String(p.fournisseur_nom === null || p.fournisseur_nom === undefined ? '' : p.fournisseur_nom)
    var dp = p.date_prix ? String(p.date_prix) : null
    var ligne: any = {
      fournisseur_id: (p.fournisseur_id === null || p.fournisseur_id === undefined) ? null : String(p.fournisseur_id),
      fournisseur_nom: nomF, reference: String(p.reference === null || p.reference === undefined ? '' : p.reference),
      prix_catalogue: arrondiPrix(prix), qte_paquet: qp, prix_converti: converti,
      date_prix: dp, perime: prixPerime(dp, vj, now), sans_conditionnement: (cat === 'accessoire' && qp === null),
      source_prix: (p.source_prix === null || p.source_prix === undefined) ? null : String(p.source_prix),
    }
    var maj = String(p.updated_at === null || p.updated_at === undefined ? '' : p.updated_at)
    // Un même fournisseur ne pèse qu'UNE fois. Deux lignes pour la même réf chez le même fournisseur
    // existent tant que l'index `ux_produits_fournisseurs_ref_norm` n'a pas pu être créé (la migration
    // 017 / cloud-13 le REFUSE quand des doublons sont déjà là). On ne garde plus « la première
    // rencontrée » (ordre des id, arbitraire : un prix de 2020 masquait un prix de 2026 et la ligne
    // s'affichait « périmée ») mais la plus RÉCEMMENT CHIFFRÉE — à date égale, la dernière modifiée.
    var cleF = String(p.fournisseur_id === null || p.fournisseur_id === undefined ? ('nom:' + normaliserReference(p.fournisseur_nom)) : p.fournisseur_id)
    var rang = vus[cleF]
    if (rang === undefined) { vus[cleF] = detail.length; detail.push(ligne); majs.push(maj); continue }
    var dAv = String(detail[rang].date_prix === null ? '' : detail[rang].date_prix)
    var dNo = String(dp === null ? '' : dp)
    if (dNo > dAv || (dNo === dAv && maj >= majs[rang])) { detail[rang] = ligne; majs[rang] = maj }
  }
  detail.sort(function (a: any, b: any) { return a.prix_converti - b.prix_converti })
  // Agrégats calculés SUR LES LIGNES RETENUES (après déduplication) : une ligne écartée ne doit ni
  // peser dans la moyenne, ni rendre le prix « périmé », ni élargir la fourchette.
  for (i = 0; i < detail.length; i++) {
    var d: any = detail[i]
    somme += d.prix_converti
    if (i === 0 || d.prix_converti < min) min = d.prix_converti
    if (i === 0 || d.prix_converti > max) max = d.prix_converti
    if (d.perime) perime = true
    if (d.sans_conditionnement) sans.push(d.fournisseur_nom || String(d.fournisseur_id || '?'))
    if (d.date_prix) {
      if (dMin === null || d.date_prix < dMin) dMin = d.date_prix
      if (dMax === null || d.date_prix > dMax) dMax = d.date_prix
    }
  }
  var n = detail.length
  var base = n ? arrondiPrix(somme / n) : 0
  var unitaire = cat === 'matiere' ? (npt !== null ? arrondiPrix(base / npt) : 0) : base
  return {
    reference: String(reference === null || reference === undefined ? '' : reference),
    reference_normalisee: refNorm, categorie: cat as any,
    prix_unitaire: unitaire, prix_base: base, prix_tole: cat === 'matiere' ? base : null,
    nb_par_tole: npt, nb_fournisseurs: n, min: n ? min : 0, max: n ? max : 0,
    perime: n ? perime : false, incomplet: n === 0, sans_conditionnement: sans,
    date_plus_ancienne: dMin, date_plus_recente: dMax, detail: detail,
  }
}

/**
 * Liste de choix « réf — désignation » d'un compartiment : une entrée par référence normalisée,
 * tous fournisseurs confondus. `texte` filtre en sous-chaîne sur la réf OU la désignation (casse et
 * accents ignorés) ; vide = tout le catalogue de la catégorie. `limite` ≤ 0 ou absente = sans limite.
 */
export function chercherReferences(produits: any, texte?: any, categorie?: any, limite?: any): OptionReference[] {
  var q = normaliserReference(texte)
  var lim = Number(limite)
  if (!isFinite(lim) || lim <= 0) lim = 0
  // ⚠ `Object.create(null)` : la clé est une RÉFÉRENCE saisie / importée. Avec `{}`, une référence
  //   nommée « constructor » ou « __proto__ » rendait la valeur héritée d'Object.prototype et la
  //   fonction levait (« Cannot read properties of undefined ») — au serveur comme au navigateur,
  //   où la liste déroulante réf/désignation cessait alors de répondre.
  var index: any = Object.create(null)
  var out: any[] = []
  var liste: any[] = []
  var i
  if (produits && produits.length) for (i = 0; i < produits.length; i++) liste.push(produits[i])
  for (i = 0; i < liste.length; i++) {
    var p = liste[i]
    if (!p) continue
    if (!categorieCompatible(p.categorie, categorie)) continue
    var ref = String(p.reference === null || p.reference === undefined ? '' : p.reference)
    var refN = normaliserReference(ref)
    if (refN === '') continue
    var des = String(p.designation === null || p.designation === undefined ? '' : p.designation)
    if (q !== '' && refN.indexOf(q) < 0 && normaliserReference(des).indexOf(q) < 0) continue
    var nomF = String(p.fournisseur_nom === null || p.fournisseur_nom === undefined ? '' : p.fournisseur_nom)
    var cleF = String(p.fournisseur_id === null || p.fournisseur_id === undefined ? ('nom:' + normaliserReference(nomF)) : p.fournisseur_id)
    var e = index[refN]
    if (!e) {
      e = { reference: ref, reference_normalisee: refN, designation: des, nb_fournisseurs: 0, fournisseurs: [], _vus: Object.create(null) }
      index[refN] = e
      out.push(e)
    }
    if (!e.designation && des) e.designation = des
    if (!e._vus[cleF]) { e._vus[cleF] = 1; e.nb_fournisseurs = e.nb_fournisseurs + 1 }
    if (nomF && e.fournisseurs.indexOf(nomF) < 0) e.fournisseurs.push(nomF)
  }
  for (i = 0; i < out.length; i++) delete out[i]._vus
  out.sort(function (a: any, b: any) { return a.reference_normalisee < b.reference_normalisee ? -1 : (a.reference_normalisee > b.reference_normalisee ? 1 : 0) })
  return (lim > 0 && out.length > lim) ? out.slice(0, lim) : out
}

/** Toutes les références d'un compartiment (raccourci de `chercherReferences` sans filtre). */
export function optionsReferences(produits: any, categorie?: any): OptionReference[] {
  return chercherReferences(produits, '', categorie, 0)
}

/**
 * DOUBLONS interdits : une même référence (normalisée) ne peut apparaître qu'une fois dans une
 * nomenclature, matière et accessoires CONFONDUS. Une ligne sans référence est comparée sur sa
 * désignation. Rend un groupe par doublon, avec les rangs (0-based) des lignes concernées.
 */
export function doublonsFournitures(lignes: any): DoublonFourniture[] {
  // ⚠ `Object.create(null)` : la clé est une référence / désignation venue de l'utilisateur. Avec
  //   `{}`, une ligne « constructor » ou « __proto__ » faisait LEVER la fonction — et comme
  //   `premierDoublonFourniture` est appelée côté serveur par `refusDoublonFournitures` AVANT tout
  //   contrôle, un refus propre (409) se serait transformé en 500.
  var index: any = Object.create(null)
  var groupes: any[] = []
  var liste: any[] = []
  var i
  if (lignes && lignes.length) for (i = 0; i < lignes.length; i++) liste.push(lignes[i])
  for (i = 0; i < liste.length; i++) {
    var l = liste[i]
    if (!l) continue
    var ref = l.ref_stock !== undefined && l.ref_stock !== null && String(l.ref_stock) !== '' ? l.ref_stock : (l.reference !== undefined && l.reference !== null ? l.reference : (l.ref !== undefined ? l.ref : ''))
    var des = l.designation === undefined || l.designation === null ? '' : l.designation
    var surRef = normaliserReference(ref) !== ''
    var cle = surRef ? normaliserReference(ref) : normaliserReference(des)
    if (cle === '') continue
    var g = index[cle]
    if (!g) {
      g = { cle: cle, cle_sur: surRef ? 'reference' : 'designation', reference: String(ref === null || ref === undefined ? '' : ref), designation: String(des), indices: [], categories: [] }
      index[cle] = g
      groupes.push(g)
    }
    g.indices.push(i)
    var cat = categorieFourniture(l.categorie !== undefined && l.categorie !== null && l.categorie !== '' ? l.categorie : l.type_fourniture)
    if (cat && g.categories.indexOf(cat) < 0) g.categories.push(cat)
  }
  var out: any[] = []
  for (i = 0; i < groupes.length; i++) if (groupes[i].indices.length > 1) out.push(groupes[i])
  return out
}

/** Premier doublon d'une liste de fournitures (message d'erreur / 409), sinon null. */
export function premierDoublonFourniture(lignes: any): DoublonFourniture | null {
  var d = doublonsFournitures(lignes)
  return d.length ? d[0] : null
}

/** Message utilisateur d'un doublon (identique côté client et côté serveur). */
export function messageDoublonFourniture(d: any): string {
  if (!d) return ''
  var quoi = (d.cle_sur === 'designation') ? ('la désignation « ' + String(d.designation || '') + ' »') : ('la référence « ' + String(d.reference || '') + ' »')
  var rangs = []
  for (var i = 0; i < d.indices.length; i++) rangs.push(String(d.indices[i] + 1))
  return 'Doublon : ' + quoi + ' apparaît ' + d.indices.length + ' fois dans cette nomenclature (lignes ' + rangs.join(', ') + '). Une référence ne peut figurer qu’une seule fois, matière et accessoires confondus — modifiez sa quantité au lieu de la répéter.'
}

/**
 * Recalcule EN DIRECT le prix des fournitures d'une nomenclature depuis le catalogue (analyse DT,
 * KPI). Rend des COPIES au nouveau modèle : `prix_unitaire` = prix moyen (tôle pour la matière,
 * pièce pour l'accessoire), `prix_total_par_piece` cohérent, et `qte_paquet` remis à null pour que
 * le coût reste LINÉAIRE (sans cette remise à null, une ancienne ligne mélangerait un prix à la
 * pièce et un arrondi au paquet : coût faux d'un facteur égal au conditionnement).
 * ⚠ Ces copies servent au CALCUL, jamais à l'écriture en base.
 * Une référence absente du catalogue (ou sans aucun prix) garde sa copie enregistrée telle quelle.
 *
 * ⚠ RELECTURE 17/09/2026 — la copie enregistrée est aussi conservée quand la moyenne est CONNUE mais
 *   NON CONVERTIBLE en prix par pièce : matière sans `nb_par_tole`, accessoire sans
 *   `quantite_par_piece` (fiches issues d'import, jamais rouvertes au BE). Le code écrivait alors
 *   `prix_total_par_piece = 0` (division impossible ⇒ `pm.prix_unitaire` vaut 0) et
 *   `computeNomCostForQty`, qui retombe précisément sur ce champ dans ces cas-là, chiffrait la ligne
 *   à 0 € dans l'analyse DT. La règle §9 — « sinon la copie enregistrée » — s'applique aux DEUX cas.
 */
export function recalculerFournitures(fournitures: any, produits: any, opts?: any): { fournitures: any[]; incompletes: string[]; perimees: string[]; sans_conditionnement: string[]; non_convertibles: string[] } {
  var o: any = (opts === null || opts === undefined) ? {} : opts
  var out: any[] = []
  var incompletes: string[] = []
  var perimees: string[] = []
  var sans: string[] = []
  var nonConv: string[] = []
  var liste: any[] = []
  var i, k
  if (fournitures && fournitures.length) for (i = 0; i < fournitures.length; i++) liste.push(fournitures[i])
  for (i = 0; i < liste.length; i++) {
    var f = liste[i]
    if (!f) continue
    var copie: any = {}
    for (k in f) if (Object.prototype.hasOwnProperty.call(f, k)) copie[k] = f[k]
    var cat = categorieFourniture(f.categorie !== undefined && f.categorie !== null && f.categorie !== '' ? f.categorie : f.type_fourniture) === 'matiere' ? 'matiere' : 'accessoire'
    var ref = f.ref_stock !== undefined && f.ref_stock !== null && String(f.ref_stock) !== '' ? f.ref_stock : f.reference
    var pm = prixMoyenReference(produits, ref, cat, { nbParTole: f.nb_par_tole, validiteJours: o.validiteJours, maintenant: o.maintenant })
    if (pm.incomplet) {
      if (normaliserReference(ref) !== '') incompletes.push(String(ref))
      out.push(copie)
      continue
    }
    // Conversion IMPOSSIBLE (pas de nb par tôle / pas de quantité par pièce) : la copie enregistrée
    // est rendue ENTIÈRE et cohérente (prix, prix par pièce et conditionnement d'origine ensemble).
    // Réécrire une partie seulement mélangerait un prix à la pièce et un arrondi au paquet.
    var nbp = (cat === 'matiere') ? pm.nb_par_tole : nombrePositif(f.quantite_par_piece)
    if (nbp === null) {
      if (normaliserReference(ref) !== '') nonConv.push(String(ref))
      copie.prix_moyen = pm
      out.push(copie)
      continue
    }
    if (pm.perime) perimees.push(String(ref))
    for (k = 0; k < pm.sans_conditionnement.length; k++) if (sans.indexOf(pm.sans_conditionnement[k]) < 0) sans.push(pm.sans_conditionnement[k])
    if (cat === 'matiere') {
      copie.prix_unitaire = pm.prix_base                                   // prix de la tôle
      copie.prix_total_par_piece = arrondiPrix(pm.prix_unitaire)           // = prix tôle ÷ nb par tôle
    } else {
      copie.prix_unitaire = pm.prix_unitaire                               // prix d'UNE pièce
      copie.prix_total_par_piece = arrondiPrix(pm.prix_unitaire * nbp)
      copie.qte_paquet = null                                              // coût linéaire (voir en-tête)
    }
    copie.prix_moyen = pm
    out.push(copie)
  }
  return { fournitures: out, incompletes: incompletes, perimees: perimees, sans_conditionnement: sans, non_convertibles: nonConv }
}

// ═══════════════════════════════════════════════════════════════════════════
// ÉMISSION CÔTÉ NAVIGATEUR — une seule source, deux exécutions
// ═══════════════════════════════════════════════════════════════════════════
// `prixMoyenClientJs()` rend le TEXTE JavaScript des fonctions ci-dessus, obtenu par
// Function.prototype.toString : le navigateur exécute exactement le même code que le serveur.
// Le bundle de production étant MINIFIÉ, une fonction s'y appelle « a » : on émet donc chaque
// fonction sous SON nom d'exécution (les appels internes le visent) puis un alias sous son nom
// public. `scripts_doc/test_prix_moyen.mjs` rejoue les mêmes cas sur les deux versions, bundle
// minifié compris.
const FONCTIONS_CLIENT: Array<[string, Function]> = [
  ['normaliserReference', normaliserReference],
  ['memeReference', memeReference],
  ['categorieFourniture', categorieFourniture],
  ['categorieCompatible', categorieCompatible],
  ['nombrePositif', nombrePositif],
  ['arrondiPrix', arrondiPrix],
  ['qtePaquetDe', qtePaquetDe],
  ['prixPerime', prixPerime],
  ['prixMoyenReference', prixMoyenReference],
  ['chercherReferences', chercherReferences],
  ['optionsReferences', optionsReferences],
  ['doublonsFournitures', doublonsFournitures],
  ['premierDoublonFourniture', premierDoublonFourniture],
  ['messageDoublonFourniture', messageDoublonFourniture],
  ['recalculerFournitures', recalculerFournitures],
]

/** Noms exposés au navigateur (contrat du lot H1 : be.tsx les appelle tels quels). */
export const PRIX_MOYEN_NOMS_CLIENT: string[] = FONCTIONS_CLIENT.map(function (e) { return e[0] })

function sourceFonctionClient(nom: string, f: Function): string {
  const src = String(f)
  const m = /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(src)
  if (m) return src + (m[1] === nom ? '' : '\nvar ' + nom + ' = ' + m[1] + ';')
  const rt = (typeof f.name === 'string' && /^[A-Za-z_$][\w$]*$/.test(f.name)) ? f.name : nom
  return 'var ' + rt + ' = ' + src + ';' + (rt === nom ? '' : '\nvar ' + nom + ' = ' + rt + ';')
}

/**
 * Texte JS à injecter dans le <script> d'une page (be.tsx) : définit les fonctions ci-dessus en
 * variables globales de la page. À insérer TEL QUEL dans le template (`${prixMoyenClientJs()}`) —
 * le résultat n'est pas réinterprété par le moteur de template, aucun échappement n'est requis.
 * Deux précautions prises ici : `</` est neutralisé (jamais de fermeture accidentelle du <script>)
 * et tout caractère non ASCII est écrit en `\uXXXX` (accents des messages, classe de caractères
 * combinants de la normalisation) — le texte injecté ne dépend d'aucun encodage de transport.
 */
export function prixMoyenClientJs(): string {
  const morceaux: string[] = ['/* prix_moyen.ts - source unique serveur/navigateur (lot H1) */']
  for (const [nom, f] of FONCTIONS_CLIENT) morceaux.push(sourceFonctionClient(nom, f))
  return morceaux.join('\n')
    .replace(/<\//g, '<\\/')
    .replace(/[-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'))
}
