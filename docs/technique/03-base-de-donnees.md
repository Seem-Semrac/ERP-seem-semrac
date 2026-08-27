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
`nomenclatures` (indices A/B/C, `prix_revient_unitaire` = matière+MO+machine), `fournitures_nomenclature` (composants matière), `etapes_production` (gamme : temps MO/machine, sous-traitance), `be_refs`, `ref_prix_historique` (source rfq/manuel/import), `produits_fournisseurs` (catalogue).

### Achats / Fournisseurs
`fournisseurs`, `sous_traitants`, `demandes_prix` (RFQ = source de vérité des prix), `demandes_achat` (DA), `bons_commande` (BC), `factures_fournisseur`.

### Production
`commandes`, `lots` (FK `cmd_id`), `bons_de_travail` (BDT ; `cmd_ref`/`lot_ref` texte, `temps_alloue`/`temps_reel`, `priorite`, `prioritaire`, `machine_id`, **`process_id`**, **`poste_id`** = placement explicite au poste dans le planning), **`bons_sous_traitance`** (BDS ; ⚠ nom réel, pas `bons_de_sous_traitance`), `machines` (`statut` operationnel/maintenance/arret, `date_panne`, `cout_h`, **`poste_id`**), `machines_opex`, `shifts`, `absences`, `presences`, `affectations_poste`, `process_atelier` (**`poste_id`**), **`postes`** (poste d'atelier = conteneur machines + process ; `nom`/`code`/`activite`/`couleur`/`ordre`/`statut`).

**Activité OAS des machines** (migration `scripts_import/machines_activite_oas.sql`) : `machines.activite` porte une **contrainte CHECK `machines_activite_check`** qui n'acceptait que `Seem`/`Semrac`/`both` → une machine mise en **OAS** était **rejetée en base** (`violates check constraint`). La migration élargit le CHECK à `('Seem','Semrac','both','OAS')` (idempotente, PAT requis). Les tables `postes` et `process_atelier` acceptent déjà `OAS` (pas de CHECK restrictif). Côté routes, `POST`/`PATCH /api/production/machine` **whitelistent** désormais `OAS` (avant : rabattu sur `Seem`).

**Postes d'atelier** (migration `scripts_import/postes_schema.sql`) : un **poste** regroupe plusieurs **machines** (`machines.poste_id`) ET plusieurs **process** (`process_atelier.poste_id`, chacun gardant son type Manuel/Machine/OAS). Le **planning** place les BDT par poste (BDT → son process → poste, ou `bons_de_travail.poste_id` explicite). L'**OPEX par poste** = somme de l'OPEX des machines du poste (+ consommables `mouvements_stock.poste_id` pour les postes manuels) — **même calcul repris en Production et en Maintenance**. FK souples `ON DELETE SET NULL` (supprimer un poste détache sans casser). ⚠ Créer la table `postes` nécessite le **PAT** (Management API) ; d'ici là `getPostes()` est **fail-soft** (renvoie `[]`, les pages fonctionnent sans postes).

**Phase E — achat machine → taux horaire effectif du poste → CRU** (migration `scripts_import/machines_achats_opex_schema.sql`, RE-RUN idempotent) :
- `machines_opex` **`+ achats_ht numeric`** = Σ des **achats machine reçus** (BL) de l'exercice (année civile). ⚠ **Colonne DÉDIÉE** : ne JAMAIS mélanger avec `cout_total_ht`, qui garde son sens d'« OPEX annuel complet » lu par Maintenance/Finances (les rows réelles portent déjà `cout_total_ht` = OPEX plein ⇒ `achats_ht` séparé garantit la non-régression). La réception d'un BC `categorie='machine'` incrémente `achats_ht` (`upsertMachineOpexAchat`). **RLS permissive obligatoire** sur `machines_opex` (sinon INSERT/UPDATE refusé `42501`). `cout_total_ht` **rendu NULLABLE** (`drop not null`) pour permettre une ligne portant seulement `achats_ht` (sinon `23502`) ; NULL ⇒ Maintenance/Finances retombent sur le théorique `cout_h × capacité × 220`. `machine_id` porte une **FK vers `machines.id`** (toujours une machine réelle).
- `postes` **`+ taux_horaire_manuel numeric`** = override manuel du taux horaire (null = auto). S'il est posé, il **prime en absolu** ; à réinitialiser au nouvel exercice.
- `bons_de_commande` **`+ categorie / machine_id / poste_id`** (hérités de la DA opérateur ou saisis en BC direct) **+ `opex_greffe boolean`** = marqueur d'**idempotence atomique** de la greffe (réclamé en CAS `UPDATE … WHERE opex_greffe is not true` → pas de double-comptage sur double-clic). **`+ date_livraison_initiale date`** = 1ʳᵉ date d'arrivée prévue **gelée** (sert à l'OTD figé ; reste NULL tant que la date n'est pas repoussée → l'OTD lit alors `date_livraison_initiale || date_livraison`) **+ `date_reception_reelle date`** = date d'arrivée réelle posée à la 1ʳᵉ réception (planning + OTD). Migration : `scripts_import/bc_arrivees_planning.sql`.
- `demandes_achat` **`+ categorie / machine_id / poste_id / operateur_id`** (DA libre opérateur restreinte au poste).
- **Taux effectif poste** = base (moyenne pondérée `cout_h`) + `(Σ achats_ht du poste) / (Σ capacité × 220 j)`, ou `taux_horaire_manuel`. Calculé par `computePosteRates` (`src/shared.ts`) et alimente le **CRU** (`computeNomCostForQty`). **Non-régression** : `achats_ht` null ⇒ incrément 0 ⇒ CRU inchangé.

### OAS (traitement de surface)
Relevés eau/bains, balancelles (via tables production/oas + relevés) — un bain non conforme génère une NC.

### Qualité
**`non_conformites`** (NC ; `type_nc`, `detecteur`, `lot_ref`, `n_commande`, `nb_pieces`, `gravite`, `categorie`, `entite`, + traitement retour : `decision_retour`, `avoir_id`, `cmdp_id`, `montant_avoir`), `pv_controles`, `quarantaines`, `rapports_8d`, `derogations`, `actions_correctives`, `plans_controle`, `controles_cotes` (SPC/capabilité), `ecme`, `produits_perissables` (`emplacement`, `date_expiration`, `statut`), `mouvements_perissables`.

### Sécurité / HSE (14 tables `hse_*`)
`hse_risques` (DUER), `hse_incidents`/accidents, `hse_epi`/`hse_epi_dotations`/`hse_epi_zone` (matrice EPI × zone), `hse_produits_chimiques` (FDS), `hse_atex_zones`, `hse_verifications` (VGP), `hse_formations`, `hse_conformite`, `hse_mesures_env`, `hse_dechets`, `hse_rse`, `hse_flash`. Référentiels (zones Z1–Z7, secteurs) dans `src/qref.ts` (code, pas base).

### Expéditions / Facturation / Compta
`bons_de_livraison` (BL ; `type_bl` client/bst), `factures_client` (`num_affaire`, `cmd_id`, montants HT/TVA/TTC, `statut`), `ecritures` (grand livre, format FEC).

### Stock
`stock` (⚠ nom réel, pas `stocks`), `mouvements_stock`, `emplacement`, seuils de réappro (`stock_mini`, `point_commande`, `qte_commande`, `stock_maxi`).
- **Auto-création** : **toute nouvelle référence de catalogue** (`produits_fournisseurs`, quelle que soit la catégorie — matière **et** accessoires) ainsi que les matières/accessoires de nomenclature (`upsertFournitures`) créent une ligne `stock` vide (`stock_actuel=0`) si absente — helpers `ensureStockRowForRef` / `ensureStockRowsForFournitures` (`src/queries.ts`), idempotents. Le stock se remplit ensuite via les BL fournisseurs. **`reference` et `designation` restent distinctes** : la référence n'est jamais recopiée dans la désignation.
- Note `demandes_travaux.cahier_charges` = `text[]` (lignes de specs) ; l'analyse BE y range ses champs libres dans un élément tagué `__analyse_be__:{…json…}` (faute de colonne dédiée), les autres lignes étant préservées.

### RH
`salaries` (matricule, PIN haché, rôles, `taux_horaire_charge`, `est_operateur`), `habilitations`, `certifications`, `conges`, `pointages`, `formations`.

### Maintenance
`ordres_maintenance` (OM), `plans_preventif`, `pieces_detachees`, historique/MTBF.

### GED / Plan bâtiment
`documents` (métadonnées + bucket Supabase `ged` privé ; categorie `plan_client`/`plan_cao`/`programme_fao`/**`analyse_dt`**/`autre` ; `nomenclature_id` = lien souple vers une nomenclature **ou une DT** pour `analyse_dt`), `plans_batiment` (image via GED), `plan_marqueurs` (repères % x/y, rectangles w/h, `ref_table`/`ref_id`).

### Transverse
`validations` (file Direction générique : `domaine`, `type`, `objet`, `statut`, `ref_table`/`ref_id`), `affaires`, `kpi_objectifs` (cibles des dashboards).

## Migrations
Toute évolution passe par le skill `erp-db` : DDL via Management API + PAT, `notify pgrst, 'reload schema';`, SQL archivé dans `scripts_import/<sujet>_schema.sql`, doc régénérée (`gen_db_ref.py`) + `03-base-de-donnees.md` mis à jour.

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
