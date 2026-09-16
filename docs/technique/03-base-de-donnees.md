# 03 — Base de données

PostgreSQL (Supabase), exposée en REST par PostgREST. Les définitions de tables sont dans `scripts_import/*.sql` (source de vérité DDL). L'inventaire exhaustif généré est dans [03b-tables-reference.md](03b-tables-reference.md) (`python scripts_doc/gen_db_ref.py`).

## Principes de modélisation (et leur justification)
- **Identifiants texte lisibles** plutôt que des UUID opaques : `CMD-2026-1081`, `LOT-2026-1081-1`, `BDT-2026-1081-1-A`, `AV-2026-042`, `CMDP-2026-042`, `NC-2954`. → lisibilité métier, traçabilité EN 9100, numéro parlant sur les documents imprimés. Contrepartie : l'id est fourni à l'insertion (pas de séquence auto).
- **Fil conducteur = numéro d'affaire** (`num_affaire`, ex. `AFF-2026-001`) propagé DT → offre → commande → facture → nomenclature → lot.
- **Liens souples vs FK dures** : certains liens sont des **FK réelles** (`lots.cmd_id → commandes.id`), d'autres du **texte** (`bons_de_travail.cmd_ref` / `lot_ref`, `factures_client.num_affaire`). → souplesse d'import et de saisie ; contrepartie : intégrité à vérifier applicativement.
- **RLS permissive** (écriture via clé anon) — la sécurité repose sur le **RBAC applicatif** (voir `04`/`08`). Quelques tables ont une policy explicite (ex. `credits`).

## Domaines et tables principales

### Commercial
`clients`, `demandes_travaux` (DT), `offres`, `credits` (**avoirs** : `montant`/`solde`, statut `actif`/`partiel`/`cloture`), `commandes_prioritaires` (CMDP-AAAA-XX), `demandes_site` (contact web), `interlocuteurs` (contacts clients ET fournisseurs).
- **Avoirs appliqués à l'offre** : affichés en déduction (net) sur `/commercial/offre` ; le `solde` n'est **décompté qu'à l'acceptation** (`POST /api/offre/:id/accepter`, plus ancien d'abord → statut `partiel`/`cloture`).

### Bureau d'études / Nomenclatures
`nomenclatures` (indices A/B/C, `prix_revient_unitaire` = matière+MO+machine), `fournitures_nomenclature` (composants matière), `etapes_production` (gamme : temps MO/machine, sous-traitance), `be_refs`, `ref_prix_historique` (source rfq/manuel/import), `produits_fournisseurs` (catalogue), **`nomenclature_journal`** (journal EN 9100 des nomenclatures validées, **en ajout seul** — déclencheurs contre modification, effacement et vidage, heure imposée par la base, droits lecture + ajout, aucune clé étrangère : il survit à la fiche ; migration Docker 006, cloud `cloud-5`).

### Achats / Fournisseurs
`fournisseurs`, `sous_traitants`, `demandes_prix` (RFQ = source de vérité des prix), `demandes_achat` (DA), `bons_commande` (BC), `factures_fournisseur`, **`avoirs_fournisseurs`**.

**`avoirs_fournisseurs`** (migration **008** / `cloud-6`) — ce que nos fournisseurs et sous-traitants NOUS doivent, traité aux Achats. ⚠ À ne pas confondre avec `credits`, qui porte les avoirs **clients** (service Commercial) : sens opposé, service différent, cycle de vie différent.
- Identité : `num_avoir` (AVF-AAAA-NNN, index unique), `tiers_type` (`fournisseur` / `sous_traitant`), `tiers_id`, `tiers_nom`.
- Origine : `origine` (`reception_non_conforme` / `refaction` / `manuel`), `bc_id`, `bl_id`, `quarantaine_id`, `nc_id`, `num_affaire`. **Index unique partiel sur `quarantaine_id`** : une décision Qualité ne peut pas engendrer deux avoirs.
- Argent : `montant` (HT), `montant_impute`, `imputations` (jsonb : `{date, montant, ref, note, par}`) ; solde = `montant - montant_impute`.
- Cycle : `statut` `a_recevoir` → `recu` → `partiel` → `solde`, ou `annule` (avec `annule_motif`). **Aucun DELETE** n'est accordé à la clé anon : un avoir s'annule, il ne disparaît pas.

**BC de reliquat (lot F, 15/09/2026 — migration Docker `013-mise-en-stock.sql`, cloud `cloud-11-mise-en-stock.sql`)** — `bons_de_commande` **`+ bc_parent_id text`** (le BC né d'un reliquat annoncé au PV de réception pointe son BC d'origine ; index partiel `idx_bc_parent`) et **`+ date_a_valider boolean`** (`true` tant que les Achats n'ont pas fixé la date d'arrivée ; `NULL` = sans objet). Le BC de reliquat est numéroté `<n° du BC d'origine>-R1`, `-R2`… (`numeroBcReliquat`), `statut 'envoye'` (valeur existante), `montant_ht = 0` (le montant reste porté par le BC d'origine), `date_livraison = null` ; ses `lignes[]` gardent le `prix_unitaire` (ligne, sinon BC d'origine) et `reliquat_de = {bc_id, num_bc, ligne_idx, pv_id, bl_id}` — clé de l'idempotence « un reliquat par réception ». Fixer la date d'arrivée passe `date_a_valider` à `false` (transition conditionnelle). Sans 013 : le BC de reliquat est créé sans ces deux colonnes (avertissement).

### Production
`commandes`, `lots` (FK `cmd_id`), `bons_de_travail` (BDT ; `cmd_ref`/`lot_ref` texte, `temps_alloue`/`temps_reel`, `priorite`, `prioritaire`, `machine_id`, **`process_id`**, **`poste_id`** = placement explicite au poste dans le planning), **`bons_sous_traitance`** (BDS ; ⚠ nom réel, pas `bons_de_sous_traitance`), `machines` (`statut` operationnel/maintenance/arret, `date_panne`, **`poste_id`** ; `cout_h` **obsolète** depuis le 14/09/2026, lu seulement en transition), `machines_opex`, `shifts`, `absences`, `presences`, `affectations_poste`, `process_atelier` (**`poste_id`**, **`taux_horaire_machine`**), **`postes`** (poste d'atelier = conteneur machines + process ; `nom`/`code`/`activite`/`couleur`/`ordre`/`statut` ; `taux_horaire_manuel` **obsolète**).

**Activité OAS des machines** (migration `scripts_import/machines_activite_oas.sql`) : `machines.activite` porte une **contrainte CHECK `machines_activite_check`** qui n'acceptait que `Seem`/`Semrac`/`both` → une machine mise en **OAS** était **rejetée en base** (`violates check constraint`). La migration élargit le CHECK à `('Seem','Semrac','both','OAS')` (idempotente, PAT requis). Les tables `postes` et `process_atelier` acceptent déjà `OAS` (pas de CHECK restrictif). Côté routes, `POST`/`PATCH /api/production/machine` **whitelistent** désormais `OAS` (avant : rabattu sur `Seem`).

**Postes d'atelier** (migration `scripts_import/postes_schema.sql`) : un **poste** regroupe plusieurs **machines** (`machines.poste_id`) ET plusieurs **process** (`process_atelier.poste_id`, chacun gardant son type Manuel/Machine/OAS). Le **planning** place les BDT par poste (BDT → son process → poste, ou `bons_de_travail.poste_id` explicite). L'**OPEX par poste** reste suivi **en euros** et ne produit plus aucun taux horaire : en Production, OPEX **réel** = consommables sortis sur les machines du poste (+ consommables `mouvements_stock.poste_id` pour les postes manuels) ; en Maintenance, OPEX **saisi** (`machines_opex.cout_total_ht`) + coût des OM de l'année (les machines sans OPEX saisi sont comptées à part, plus d'estimation `cout_h × capacité × 220`). FK souples `ON DELETE SET NULL` (supprimer un poste détache sans casser). ⚠ Créer la table `postes` nécessite le **PAT** (Management API) ; d'ici là `getPostes()` est **fail-soft** (renvoie `[]`, les pages fonctionnent sans postes).

**Coût horaire porté par le process (14/09/2026 — migration Docker `009-process-taux-horaire-machine.sql`, cloud `cloud-7-process-taux-horaire-machine.sql`)** :
- `process_atelier` **`+ taux_horaire_machine numeric`** — taux horaire **machine** du process, en €/h HT, **saisi à la main** (Production › Process Ateliers). `NULL` = « taux à saisir » (compté 0 et signalé). Contrainte `process_atelier_taux_horaire_machine_positif` : `null` ou `>= 0`. Seul un process de **type machine** l'utilise ; le type se lit par `typeProcess(p)` (`src/shared.ts`) : `est_oas` → OAS ; `requiert_machine` true → machine, false → manuel ; non renseigné → machine s'il a une `machine_id`.
- **Recopie de départ** (une seule fois, **quand la colonne est créée** par le script) : chaque process machine reçoit le `machines.cout_h` de sa machine (garde regex : `cout_h` peut être du texte sur une base née d'un miroir). Rejoué sur une base qui a déjà la colonne, le script ne recopie rien : un taux vidé volontairement reste « à saisir ». Le NOTICE de fin dit lequel des deux cas s'est produit.
- **Taux homme** : aucune colonne nouvelle — c'est `salaries.taux_horaire_charge`. Coût estimé = moyenne des opérateurs actifs (`actif` et `est_operateur`, taux > 0) du site (`entite`), repli tous opérateurs ; coût réel d'un BDT = taux de son `operateur_id`.
- **Colonnes laissées en base, plus lues ni écrites** : `machines.cout_h` (sauf transition), `postes.taux_horaire_manuel`, `machines_opex.taux_horaire` / `base_cout_h` (`heures_productives` reste lu par le tableau de bord Maintenance, en heures), et les copies figées `nomenclatures.taux_mo` / `cout_machine_h`, `etapes_production[].machine_taux_h` / `taux_mo_h` (encore écrites par le formulaire BE, à titre informatif). `POST /api/production/machine` n'écrit plus `cout_h` ; `PATCH` l'ignore ; `POSTE_COLS` n'accepte plus `taux_horaire_manuel`.
- **Transition** (cloud tant que `cloud-7` n'est pas joué) : une ligne `process_atelier` lue en `select *` **sans** la propriété `taux_horaire_machine` ⇒ taux machine = `cout_h` de sa machine (source `transition_machine`) : les coûts ne bougent pas avant le script. Écrire un taux y est refusé proprement (réessai sans la colonne + message qui renvoie à `cloud-7`). ⚠ Ne jamais projeter les colonnes de `process_atelier` avant `construireTauxAtelier` : c'est l'**absence** de la propriété qui signale la transition.

**Réglage stocké sur le BDT, découpe réversible (14/09/2026 — migration Docker `011-bdt-temps-reglage.sql`, cloud `cloud-9-bdt-temps-reglage.sql`)** :
- `bons_de_travail` **`+ temps_reglage numeric`** — heures de réglage **comprises dans `duree`** (fixe, fait une seule fois). `NULL` = inconnu ; réalisation = `duree − temps_reglage`. Contrainte `bons_de_travail_temps_reglage_positif` (`null` ou `>= 0`) ; **pas** de contrainte `≤ duree` en base (contrôle applicatif : création, PATCH de `duree` / `temps_alloue`, découpe). Famille découpée (racine + `-Mk`) : **un seul** bon porte le réglage (le morceau 1), les autres valent 0. Écrit par la cascade et `generer-bdt` (`reglageBdtHeures`), les commandes P (0), la création manuelle (« dont réglage ») et la route de reconstitution ; **pas** par le PATCH générique.
- `bons_de_travail` **`+ duree_avant_decoupe numeric`**, **`+ temps_machine_avant_decoupe numeric`** — durée et temps machine de la racine **avant** sa 1ʳᵉ découpe (réécrits à chaque découpe d'une racine sans morceau). Pendant un « Annuler la découpe », `duree_avant_decoupe` est posée à la durée recollée tant qu'un morceau existe (repère qui rend l'opération rejouable), puis remise à `NULL`.
- Aucun remplissage SQL : les BDT existants se complètent par `POST /api/production/bdt/reglage/reconstituer` (n'écrit que les réglages **certains**). Sans ces colonnes (cloud avant `cloud-9`) : réglage inconnu partout (compté 0 par le chemin critique), « Annuler la découpe » recolle sur la somme des morceaux.

**Index uniques des upserts (14/09/2026 — migration Docker `010-index-uniques-upsert.sql`, cloud `cloud-8-index-uniques-upsert.sql`)** : un `upsert(…, { onConflict })` exige un index unique sur exactement ces colonnes, sinon Postgres répond **42P10** et rien n'est écrit. La base Docker / VM, née de `schema.sql`, ne les avait pas : `ux_operateur_presence_upsert (operateur_id, date_presence)`, `ux_affectation_poste_upsert (operateur_id, date_affectation, process_id, shift)`, `ux_competences_operateur_upsert (salarie_id, operation)`, `ux_produits_fournisseurs_upsert (fournisseur_id, reference)`, `ux_kpi_objectifs_upsert (code, entite)`. Créés seulement s'il n'existe pas déjà un index équivalent (colonnes dans n'importe quel ordre) et s'il n'y a pas de doublons (sinon WARNING avec la requête pour les lister, rien n'est effacé). ⚠ Deux lignes à `NULL` sur une colonne de l'index ne sont jamais en conflit (sémantique standard : `kpi_objectifs.entite` NULL, `affectation_poste.shift` NULL).

**Phase E — achat machine → OPEX machine** (migration `scripts_import/machines_achats_opex_schema.sql`, RE-RUN idempotent). ⚠ **Depuis le 14/09/2026, plus aucun taux horaire n'en est tiré** (`computePosteRates` supprimé) : ce qui suit décrit les colonnes, qui restent alimentées et affichées en euros :
- `machines_opex` **`+ achats_ht numeric`** = Σ des **achats machine reçus** (BL) de l'exercice (année civile). ⚠ **Colonne DÉDIÉE** : ne JAMAIS mélanger avec `cout_total_ht`, qui garde son sens d'« OPEX annuel complet » lu par Maintenance/Finances (les rows réelles portent déjà `cout_total_ht` = OPEX plein ⇒ `achats_ht` séparé garantit la non-régression). La réception d'un BC `categorie='machine'` incrémente `achats_ht` (`upsertMachineOpexAchat`). **RLS permissive obligatoire** sur `machines_opex` (sinon INSERT/UPDATE refusé `42501`). `cout_total_ht` **rendu NULLABLE** (`drop not null`) pour permettre une ligne portant seulement `achats_ht` (sinon `23502`) ; NULL ⇒ « OPEX non renseigné » (depuis le 14/09/2026 ; avant : repli sur le théorique `cout_h × capacité × 220`, supprimé). `machine_id` porte une **FK vers `machines.id`** (toujours une machine réelle).
- `postes` **`+ taux_horaire_manuel numeric`** — ancien override manuel du taux du poste. **Obsolète depuis le 14/09/2026** : plus lu ni écrit (un poste ne porte plus de taux).
- `bons_de_commande` **`+ categorie / machine_id / poste_id`** (hérités de la DA opérateur ou saisis en BC direct) **+ `opex_greffe boolean`** = marqueur d'**idempotence atomique** de la greffe (réclamé en CAS `UPDATE … WHERE opex_greffe is not true` → pas de double-comptage sur double-clic). **`+ date_livraison_initiale date`** = 1ʳᵉ date d'arrivée prévue **gelée** (sert à l'OTD figé ; reste NULL tant que la date n'est pas repoussée → l'OTD lit alors `date_livraison_initiale || date_livraison`) **+ `date_reception_reelle date`** = date d'arrivée réelle posée à la 1ʳᵉ réception (planning + OTD). Migration : `scripts_import/bc_arrivees_planning.sql`.
- `demandes_achat` **`+ categorie / machine_id / poste_id / operateur_id`** (DA libre opérateur restreinte au poste).
- ~~**Taux effectif poste** = base (moyenne pondérée `cout_h`) + `(Σ achats_ht) / (Σ capacité × 220 j)`, ou `taux_horaire_manuel`, via `computePosteRates` → CRU.~~ **Supprimé le 14/09/2026** : le CRU prend le taux machine du **process** de l'étape et le coût chargé RH (voir le paragraphe précédent).

### OAS (traitement de surface)
Relevés eau/bains, balancelles (via tables production/oas + relevés) — un bain non conforme génère une NC.

### Qualité
**`non_conformites`** (NC ; `type_nc`, `detecteur`, `lot_ref`, `n_commande`, `nb_pieces`, `gravite`, `categorie`, `entite`, + traitement retour : `decision_retour`, `avoir_id`, `cmdp_id`, `montant_avoir`), `pv_controles`, `quarantaines` (+ **décision sur un lot reçu**, migration 008 : `issue` = `retour_fournisseur` / `derogation_fournisseur` / `entree_partielle`, `qte`, `qte_acceptee`, `qte_retour`, `qte_rebut`, `compensation` = `avoir`/`remplacement`, contexte `bc_id`/`bl_id`/`fournisseur_nom`, traçabilité `decision_par`/`decision_le`/`decision_motif`, `derogation_ref`, `avoir_id`, et l'expédition du retour `retour_expedie_le`/`retour_expedie_par`/`retour_ref` — le `statut` garde ses valeurs historiques ; **`+ ligne_idx integer`**, migration 013 / `cloud-11` : ligne du BC mise en quarantaine par un PV ligne par ligne, `NULL` = toute la réception ou certificat absent ; une quarantaine `QEXC-<id validation>` déjà décidée — `issue = retour_fournisseur`, `statut = rejete`, `compensation = aucune` — porte le retour d'un **excédent refusé** par la Direction), `rapports_8d`, `derogations`, `actions_correctives`, `plans_controle`, `controles_cotes` (SPC/capabilité), `ecme`, `produits_perissables` (`emplacement`, `date_expiration`, `statut`), `mouvements_perissables`.

### Sécurité / HSE (14 tables `hse_*`)
`hse_risques` (DUER), `hse_incidents`/accidents, `hse_epi`/`hse_epi_dotations`/`hse_epi_zone` (matrice EPI × zone), `hse_produits_chimiques` (FDS), `hse_atex_zones`, `hse_verifications` (VGP), `hse_formations`, `hse_conformite`, `hse_mesures_env`, `hse_dechets`, `hse_rse`, `hse_flash`. Référentiels (zones Z1–Z7, secteurs) dans `src/qref.ts` (code, pas base).

### Expéditions / Facturation / Compta
`bons_de_livraison` (BL ; `type_bl` client/bst/**reception**/retour_client), `factures_client` (`num_affaire`, `cmd_id`, montants HT/TVA/TTC, `statut`), `ecritures` (grand livre, format FEC).

**Réception fournisseur, certificat matière, PV de réception détaillé (14/09/2026 — migration Docker `012-reception-fournisseur-pv.sql`, cloud `cloud-10-reception-fournisseur-pv.sql`)** — additive, idempotente, aucune donnée modifiée :
- `bons_de_livraison` (une réception = un BL `type_bl = 'reception'`) **`+ num_commande_fournisseur text`**, **`+ num_bl_fournisseur text`** (N° de commande et de BL **du fournisseur**, obligatoires à la réception), **`+ hors_france boolean`** (`NULL` = réception antérieure au lot), et pour une réception hors France **`+ poids_matiere_kg numeric`** (contrainte `bons_de_livraison_poids_matiere_positif` : `null` ou `>= 0`), **`+ num_nomenclature text`** (code de nomenclature **douanière**), **`+ code_ewx smallint`** (contrainte `bons_de_livraison_code_ewx_valide` : `null`, 1 ou 2), **`+ mode_arrivee text`** (liste fermée côté application, `MODES_ARRIVEE` : Routier, Maritime, Aérien, Ferroviaire, Messagerie / express). **Pas** de contrainte « hors France ⇒ 4 champs » : contrôle applicatif (`src/reception.ts`), elle casserait les écritures en deux temps.
- `bons_de_livraison.qte` d'une réception = **reste à recevoir** du BC, ou quantité livrée saisie (quantité commandée inconnue) ; **`NULL` = inconnue, jamais 0**. ⚠ Lot F (15/09/2026) : la case « Livraison partielle » est retirée (le reliquat se déclare au PV) et le **PV réécrit `qte` avec la somme des quantités réellement reçues** ; la quantité attendue reste dans `pv_controle.detail` (`bl.qte`, `lignes[].qte_prevue`). `partiel` n'est plus écrit par la réception (seuls les anciens BL le portent). `transport` / `transporteur_ref` ne sont plus écrits par la réception (colonnes conservées : BL clients, historique).
- `bons_de_commande` **`+ certificat_matiere_requis boolean`** : le fournisseur doit joindre un certificat matière (`NULL` = non requis). Posé par les Achats, imprimé sur le PDF, confirmé au PV.
- `pv_controle` (⚠ nom réel au singulier) **`+ detail jsonb`** (PV de réception, version `v: 1` : instantané du BC et du BL, `lignes[]` = `{idx, reference, designation, qte_commandee, qte_texte, unite, prix_unitaire, num_affaire, da_id, lot, operation, reconstituee, conforme, observation}`, `observation_generale`, `gravite`, `certificat {requis, confirme}`, `controleur {id, nom}`, `saisi_par`), **`+ controleur_id text`**, **`+ controleur_nom text`**, **`+ saisi_par text`** (sans clé étrangère, comme le journal 006), **`+ certificat_matiere text`** (contrainte `pv_controle_certificat_matiere_valide` : `null`, `non_requis`, `confirme`, `absent`). `operateur_id` reçoit l'id du contrôleur (repli `null` si la clé étrangère cloud le refuse). Les valeurs de `statut` / `decision` / `anomalie` / `nc_ouverte` **ne changent pas** (contraintes CHECK du cloud).
- **`pv_controle.detail` version `v: 2`** (lot F, 15/09/2026 ; aucune DDL, les clés v1 sont gardées) : chaque ligne ajoute `qte_prevue`, `qte_recue`, `reliquat`, `qte_reliquat`, `ecart` (reçu − prévu), `type_ecart` (`manque` / `excedent`), `manque`, `excedent`, `nature` (`quantitative` / `qualitative` / `quantitative et qualitative`), `qte_a_ranger`, `qte_quarantaine`, `excedent_a_valider` et les identifiants créés `nc_id`, `quarantaine_id`, `validation_id`, `bc_reliquat_id` ; au niveau du PV : `certificat_absent {qte_quarantaine, nc_id, quarantaine_id}`, `quarantaines_attendues` (relu par `recalculerStatutBc`), `bc_reliquat_id`, `mise_en_stock {ids, deja, repli, error}`. Base sans `detail` (avant `cloud-10`) : le détail par ligne et le repère `[Quarantaines attendues : n]` vont dans `observations` (`quarantainesAttenduesObservations`).
- Index unique **partiel** `ux_pv_controle_reception_bl` sur `pv_controle (bl_id) where type_controle = 'reception' and bl_id is not null` : un seul PV de réception par BL. Créé **seulement s'il n'existe aucun doublon** ; sinon WARNING avec la requête pour les lister et la commande de création à rejouer — rien n'est effacé, le contrôle applicatif (409) reste la seule garde.
- **Sans 012** (cloud avant `cloud-10`) : la réception s'enregistre sans les 7 colonnes (avertissement à l'écran), la correction des informations de réception est refusée (409), le BC se crée sans l'exigence de certificat (avertissement si la case était cochée) et la bascule est refusée (409), le PV s'enregistre avec son détail **en texte** dans `observations`, et l'anti-doublon repose sur le seul contrôle applicatif.

### Stock
`stock` (⚠ nom réel, pas `stocks`), `mouvements_stock`, `emplacement`, seuils de réappro (`stock_mini`, `point_commande`, `qte_commande`, `stock_maxi`), **`mises_en_stock`**, **`stock_types_objet`**, **`stock_zones`**, **`stock_emplacements_historique`** (lot F).

**Mise en stock, types d'objet, zones, emplacement fixe (lot F, 15/09/2026 — migration Docker `013-mise-en-stock.sql`, cloud `cloud-11-mise-en-stock.sql`)** — additive, idempotente, aucune donnée existante modifiée ; seule la liste de départ des types est insérée :
- **`stock_types_objet`** (`code` text pk, contrainte `stock_types_objet_code_valide` `^[a-z0-9_]{2,40}$` ; `libelle` non vide ; `ordre` ; `actif` ; `created_at`) — liste **modifiable dans l'ERP**, amorcée avec `matiere_premiere` « Matière première », `accessoire`, `consommable`, `outillage`, `chimique` « Produit chimique », `epi` « EPI ». Un type ne se supprime pas : il se désactive. Droits anon : lecture, ajout, mise à jour.
- **`stock_zones`** (`id` text pk par défaut uuid, `type_objet`, `zone` non vide, `ordre`, `actif`, `created_at`, `cree_par`) — zones géographiques **par type** ; index unique `ux_stock_zones_type_zone (type_objet, lower(btrim(zone)))`. **Aucune zone n'est amorcée** (l'utilisateur fournira ses listes). Une zone se désactive ; une zone qui est l'emplacement de références ne se renomme pas (contrôle applicatif, 409).
- **`stock`** **`+ type_objet text`** (code de `stock_types_objet`). `stock.emplacement` (colonne existante) devient l'**emplacement fixe** de la référence : libellé d'une zone, posé à la première mise en stock, modifiable seulement dans Niveaux d'approvisionnement. Index unique **`ux_stock_reference`** sur `lower(btrim(reference))` (références non vides) créé **seulement sans doublons** ; sinon WARNING avec la requête pour les lister — rien n'est effacé ni fusionné, et le rangement refuse (409) une référence en double.
- **`stock_emplacements_historique`** (`id`, `stock_id`, `reference`, `type_objet`, `avant`, `apres`, `motif`, `par`, `le` défaut `now()`, `mise_en_stock_id` ; index `idx_stk_emp_hist_stock (stock_id, le desc)`) — journal **en ajout seul** : droits anon **lecture + ajout** uniquement. Écrit à la première affectation (motif « Première mise en stock ») et à chaque changement manuel.
- **`mises_en_stock`** — la file « À ranger » :
  - `statut` (`a_ranger` → `range` | `annule`, contrainte `mises_en_stock_statut_valide`) ; `origine` (`pv` | `decision_qualite` | `excedent_valide` | `entree_manuelle`, contrainte `mises_en_stock_origine_valide`) ;
  - contexte `bc_id`, `bl_id`, `pv_id` (n° de PV), `ligne_idx`, `quarantaine_id`, `validation_id` ;
  - article `reference`, `designation`, `type_objet`, `quantite` (numeric, contrainte `mises_en_stock_quantite_positive` > 0), `unite`, `num_affaire`, `fournisseur_nom`, `motif` (entrée manuelle) ;
  - rangement `stock_id`, `emplacement`, `mouvement_id`, `range_le`, `range_par` ; création `cree_le`, `cree_par` ; annulation `annule_le`, `annule_par`, `annule_motif`.
  - Index `idx_mes_statut (statut, cree_le)`, `idx_mes_bc`, `idx_mes_reference (lower(btrim(reference)))`. **Anti-doublon en base** (ligne absente comptée −1) : `ux_mes_pv_ligne_origine (pv_id, ligne, origine) where pv_id is not null` ; `ux_mes_pv_bl_ligne (bl_id, ligne) where origine = 'pv'` (une ligne d'une même réception n'entre qu'une fois, quel que soit le n° de PV) ; `ux_mes_quarantaine_ligne (quarantaine_id, ligne) where origine = 'decision_qualite'` ; `ux_mes_validation_ligne (validation_id, ligne) where origine = 'excedent_valide'`.
  - Droits anon : lecture, ajout, mise à jour — **pas d'effacement** (une ligne s'annule avec un motif).
- **`mouvements_stock`** **`+ mise_en_stock_id text`** + index unique partiel `ux_mvt_mise_en_stock` : une ligne de file ne crédite le stock qu'une fois. Motif du mouvement : « Mise en stock <id de la ligne> ». Un ajustement d'inventaire est un mouvement `type = 'ajustement'` dont `quantite` est l'**écart signé** ; une sortie réelle porte `bdt_id` et `lot_id` (relu sur le BDT).
- **Le stock n'est crédité qu'au rangement** (`POST /api/stock/mise-en-stock/:id/accepter`). Les calculs de besoin (DA du manque à l'acceptation d'offre, génération de DA, réappro auto, alerte de rupture, ruptures et « sous le mini » de `kpi.ts`, stocks critiques du cockpit Direction) ajoutent la quantité **à ranger** de la référence (`quantitesARangerParRef`). La valorisation du stock reste celle du stock rangé.
- **Sans 013** (cloud avant `cloud-11`) : l'onglet Stock › Rangement affiche « jouez cloud-11 » et n'écrit rien (routes 409 `table_absente`) ; le PV de réception et la décision Qualité reviennent à l'**entrée directe ligne par ligne** (`crediterLignesRepli`) avec un avertissement, et la porte matière suit l'ancienne règle ; types et emplacements ne sont pas modifiables ; le BC de reliquat naît sans `bc_parent_id` ni `date_a_valider`.
- **Auto-création** : **toute nouvelle référence de catalogue** (`produits_fournisseurs`, quelle que soit la catégorie — matière **et** accessoires) ainsi que les matières/accessoires de nomenclature (`upsertFournitures`) créent une ligne `stock` vide (`stock_actuel=0`) si absente — helpers `ensureStockRowForRef` / `ensureStockRowsForFournitures` (`src/queries.ts`), idempotents. Le stock se remplit ensuite via les BL fournisseurs. **`reference` et `designation` restent distinctes** : la référence n'est jamais recopiée dans la désignation.
- Note `demandes_travaux.cahier_charges` = `text[]` (lignes de specs) ; l'analyse BE y range ses champs libres dans un élément tagué `__analyse_be__:{…json…}` (faute de colonne dédiée), les autres lignes étant préservées.

### RH
`salaries` (matricule, PIN haché, rôles, `taux_horaire_charge` = **taux homme** des coûts de revient depuis le 14/09/2026 — moyenne par site pour le coût estimé, taux de l'opérateur pour le coût réel d'un BDT —, `est_operateur`), `habilitations`, `certifications`, `conges`, `pointages`, `formations`.

### Maintenance
`ordres_maintenance` (OM), `plans_preventif`, `pieces_detachees`, historique/MTBF.

### GED / Plan bâtiment
`documents` (métadonnées + bucket Supabase `ged` privé ; categorie `plan_client`/`plan_cao`/`programme_fao`/**`analyse_dt`**/`autre` ; `nomenclature_id` = lien souple vers une nomenclature **ou une DT** pour `analyse_dt`), `plans_batiment` (image via GED), `plan_marqueurs` (repères % x/y, rectangles w/h, `ref_table`/`ref_id`).

### Transverse
`validations` (file Direction générique : `domaine`, `type`, `objet`, `statut`, `ref_table`/`ref_id` ; lot F : type **`excedent_reception`**, domaine `expeditions`, créé **seulement** par le PV de réception — `payload` = `{pv_id, bc_id, num_bc, bl_id, ligne_idx, reference, designation, unite, quantite, qte_prevue, qte_recue, num_affaire, fournisseur_nom, nc_id, qualite_requise, quarantaine_id}`, complété à la décision par `decision` et, sur refus, `suite: 'retour_a_organiser'` et `retour_quarantaine_id`), `affaires`, `kpi_objectifs` (cibles des dashboards).

## Migrations
Toute évolution passe par le skill `erp-db` : DDL via Management API + PAT, `notify pgrst, 'reload schema';`, SQL archivé dans `scripts_import/<sujet>_schema.sql`, doc régénérée (`gen_db_ref.py`) + `03-base-de-donnees.md` mis à jour.

**Docker / VM** : `docker/db/migrations/NNN-*.sql`, joués par le conteneur `erp-migrate` à chaque `erp-docker.sh maj` (règles : `docker/db/migrations/README.md`). Le **cloud** n'a pas ce mécanisme : son équivalent se joue à la main, `docker/db/cloud/cloud-N-*.sql` (index et état dans `docker/db/cloud/README.md`).
- **006** `nomenclature_journal` (journal EN 9100) — cloud : `cloud-5`.
- **008** décision sur un lot reçu non conforme (colonnes de `quarantaines`) + registre `avoirs_fournisseurs` — cloud : `cloud-6`. Sans elle, la route de décision **refuse** (409) au lieu de décider sans tracer, et l'onglet Achats affiche un bandeau.
- **009** `process_atelier.taux_horaire_machine` (taux horaire machine saisi sur le process, recopie de départ depuis `machines.cout_h` à la création de la colonne) — cloud : `cloud-7`. Sans elle, le cloud lit le taux sur la machine (transition) et refuse la saisie du taux.
- **010** index uniques exigés par les upserts (présences, affectations aux postes, compétences, catalogue fournisseurs, objectifs KPI) — cloud : `cloud-8` (à contrôler : sur le cloud ces upserts fonctionnent déjà). Sans elle (Docker/VM), cliquer une case de présence échoue (42P10, message qui renvoie à 010).
- **011** `bons_de_travail.temps_reglage`, `duree_avant_decoupe`, `temps_machine_avant_decoupe` — cloud : `cloud-9`. Sans elle, le réglage n'est pas enregistré (avertissement) et le recollage se fait sur la somme des morceaux.
- **012** réception fournisseur (7 colonnes de `bons_de_livraison`), `bons_de_commande.certificat_matiere_requis`, PV de réception détaillé (5 colonnes de `pv_controle`) et index unique partiel `ux_pv_controle_reception_bl` — cloud : `cloud-10`. Sans elle, réception et PV s'enregistrent en mode dégradé (avertissements), voir la section Expéditions ci-dessus.
- **013** Mise en stock (lot F) : `mises_en_stock`, `stock_types_objet` (6 types amorcés), `stock_zones`, `stock_emplacements_historique`, `stock.type_objet` + `ux_stock_reference` (sans doublons seulement), `mouvements_stock.mise_en_stock_id`, `bons_de_commande.bc_parent_id` / `date_a_valider`, `quarantaines.ligne_idx` — cloud : `cloud-11`. Sans elle, la file est indisponible et le PV entre le stock directement (avertissement), voir la section Stock ci-dessus.
- **007** identifiant généré par défaut : la base née de `schema.sql` avait 50 colonnes `id text NOT NULL` **sans défaut** ; toute insertion sans id y échouait (créer une nomenclature, un nouvel indice, l'entrée de stock d'une nouvelle référence…). `gen_random_uuid()::text` posé **uniquement** là où aucun défaut n'existe. Pas d'équivalent cloud : il génère déjà ses identifiants.

## Hygiène de la base — diagnostics Supabase et parité cloud ⟷ Docker

### Le miroir était la cause racine

`docker/scripts/mirror-cloud.mjs` faisait `DROP TABLE … CASCADE`, recréait chaque table depuis un schéma **déduit des lignes rapatriées**, puis `DISABLE ROW LEVEL SECURITY`. Trois dégâts :

- **45 colonnes perdues** (absentes de l'échantillon ou toujours nulles) — dont `bons_de_travail.temps_alloue`, `poste_id`, `oas_avant/apres`, `lots.avancement` ;
- **RLS désactivée sur 51 tables** → 51 **ERREURS** dans les Advisors de Supabase ;
- contraintes, index et policies de `schema.sql` effacés au passage.

De plus, sa liste de tables était écrite à la main et avait dérivé : elle citait des tables inexistantes (`hse_chimie`, `hse_vgp`, `perissables`) et **en oubliait de bien réelles** (`interlocuteurs` 484 lignes, `produits_perissables` 236, `operateur_presence` 235, `competences_operateur` 92…), qui restaient donc vides en local.

**Corrigé** : le miroir ne touche plus au schéma (`DELETE` + `INSERT` uniquement), et sa liste est générée depuis le schéma réel (101 tables). Le schéma reste la responsabilité de `schema.sql` + `scripts_import/`.

### Le correctif : `scripts_import/db_hygiene_2026_08_25.sql`

Idempotent, à appliquer **des deux côtés** :

```bash
docker cp scripts_import/db_hygiene_2026_08_25.sql erp-db:/tmp/h.sql
MSYS_NO_PATHCONV=1 docker exec erp-db psql -U postgres -d postgres -f /tmp/h.sql
```

Côté cloud : coller le fichier dans Supabase Studio → SQL Editor. Il est aussi cuit dans l'image `db` (`db.Dockerfile`) : une stack neuve en hérite.

| Diagnostic | Avant | Après | Nature du correctif |
|---|---|---|---|
| `rls_disabled_in_public` | **51 ERROR** | **0** | RLS activée + policy explicite sur les 51 tables qui n'en avaient pas |
| `function_search_path_mutable` | 3 WARN | **0** | `search_path` figé sur les 3 fonctions |
| `multiple_permissive_policies` | 4 WARN | **0** | doublon de policy retiré (`hse_produits_chimiques`) |
| `no_primary_key` | 1 INFO | **0** | clé primaire sur `edit_locks` |
| `rls_policy_always_true` | 51 WARN | 101 WARN | **volontaire** — voir ci-dessous |
| `unused_index` | 19 INFO | 17 INFO | informatif : index inutilisés faute de volume |

### Pourquoi `rls_policy_always_true` ne doit PAS être « corrigé »

L'ERP est rendu côté serveur et s'authentifie avec la **clé anon** (`src/db.ts`) : **la clé anon EST l'identité de l'application**. Restreindre ces policies couperait l'accès à l'application elle-même. La sécurité repose ici sur deux choses : la clé ne quitte jamais le serveur, et le mur `AUTH_ENFORCE` (matricule + PIN). C'est une posture assumée et documentée, pas un oubli.

Le passage de 51 à 101 n'est pas une régression : les 51 tables concernées n'avaient **aucune** policy (état ERROR, plus grave) ; elles en ont désormais une, explicite.

### Deux bugs réels trouvés au passage

- **`edit_locks` sans clé primaire** alors que le code fait `upsert(payload, { onConflict: 'resource' })` — ce qui **exige** une contrainte unique. On observait 2 lignes pour 1 seule ressource. La clé primaire répare le verrou d'édition.
- **`demandes_prix_lignes.demande_prix_id` typé `numeric`** alors que le cloud y stocke un UUID : toute insertion de ligne de demande de prix échouait sur Docker (« invalid input syntax for type numeric »), et le miroir laissait la table vide. Aligné sur `text`.

### Écarts restants (au 25/08/2026)

| Écart | Détail | Action |
|---|---|---|
| 1 table | `import_staging` en local seulement — **aucun usage dans `src/`**, artefact d'import | à supprimer, ou à créer au cloud |
| 4 tables, 7 colonnes | `bons_de_travail.operateur_nom`, `lots.updated_at`, `mouvements_stock.bc_id` et `reference`, `pieces_rechange.nom`, `machine_nom` et `stock` — présentes en local, absentes du cloud | la **section 2** du script les ajoute au cloud |
| 3 tables, 37 lignes | `ecritures_comptables` (20), `factures_client` (14), `mouvements_stock` (3) — **résidus de test** de juillet (`CMD-TEST`, `FAC1`, article `S1`, lot `L1`) présents en local, absents du cloud | à purger en local — non fait : supprimer des écritures comptables est une décision utilisateur |

> Le miroir ne vide **pas** une table locale quand la table cloud est vide — c'est délibéré, on ne détruit pas du travail local. C'est pourquoi ces 37 lignes survivent à un rafraîchissement.

### Vérifier à tout moment

```bash
node scripts_doc/compare_bases.mjs
```

Compare tables, colonnes et volumes entre le cloud et le Docker. La clé anon ne donnant pas accès au catalogue du cloud (ni `pg_class`, ni `pg_policies`, et le spec OpenAPI y est fermé), la comparaison passe par un **sondage colonne par colonne** via PostgREST : exact, mais limité à ce qui est observable de l'extérieur.

### Copie conforme cloud ⟷ Docker (25/08/2026)

Le **cloud fait référence** : c'est la production. Le local s'aligne dessus, sauf quand le code a besoin d'une colonne absente du cloud — auquel cas c'est le cloud qu'on complète.

| Écart | Avant | Après | Comment |
|---|---|---|---|
| Tables | 1 (`import_staging`) | **0** | supprimée en local avec ses 3 fonctions — aucun usage dans `src/`, absente du cloud |
| Volumes | 19 tables | **0** | miroir corrigé + 37 lignes de test purgées en local |
| Colonnes | 7 tables | **4 tables, 7 colonnes** | à ajouter au **cloud** : `scripts_import/db_conformite_cloud.sql` |

#### Les deux scripts

- `scripts_import/db_conformite_local.sql` — aligne le Docker sur le cloud. Cuit dans l'image `db`.
- `scripts_import/db_conformite_cloud.sql` — les 7 colonnes à jouer dans **Studio → SQL Editor**.

#### ⚠ Bug de production que ces 7 colonnes révèlent

`lots.updated_at` n'existe pas au cloud, or `src/queries.ts` écrit, à la cascade de soldage :

```js
supabase.from('lots').update({ statut: 'termine', updated_at: … })
```

PostgREST refuse **toute la requête** (PGRST204) : le lot n'est donc **jamais marqué « terminé » en production**, et l'erreur passe inaperçue car le retour n'est pas contrôlé. Vérifié par sonde `PATCH` sur un id inexistant : HTTP 400. **Jouer `db_conformite_cloud.sql` corrige ce bug.**

#### Ordre d'exécution du socle

Les scripts d'init sont joués par ordre **alphabétique**, d'où les préfixes :

```
zz1-erp-schema.sql → zz2-erp-storage-policies.sql → zz3-erp-hygiene.sql → zz4-erp-conformite.sql
```

Sans eux, `zz-erp-conformite` passait **avant** `zz-erp-schema` et échouait.

#### Preuve sur base neuve

Vérifié en construisant l'image `db` et en lançant un conteneur **jetable** à volume vide : **100 tables · 0 sans RLS · 0 `import_staging` · colonnes BDT récupérées · clé primaire `edit_locks` · `demande_prix_id` en `text` · 0 fonction à `search_path` mutable**. Une stack neuve est donc conforme d'emblée.
