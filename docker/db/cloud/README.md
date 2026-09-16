# Scripts SQL à jouer à la main — base **cloud** uniquement

Le Docker local et la VM appliquent leur schéma **tout seuls** : le conteneur
`erp-migrate` déroule `docker/db/migrations/` à chaque `erp-docker.sh maj`, en
prenant une sauvegarde avant.

> ⚠ **Où jouer ces scripts : dans le Studio du projet EN LIGNE**
> (`https://supabase.com/dashboard/project/<ref>/sql/new`), **jamais** dans le Studio de la base
> Docker locale ni sur la VM. Celles-là appliquent `docker/db/migrations/` toutes seules ; y rejouer
> un script cloud échoue de façon déroutante — `must be owner of table …`, parce que le lanceur de
> migrations crée ses objets sous le rôle `supabase_admin` et pas sous le vôtre. Depuis le
> 12/09/2026, **chaque script cloud commence par un garde-fou** qui détecte la table
> `_erp_migrations` (présente sur Docker/VM, absente du cloud) et refuse de s'exécuter avec un
> message explicite. Rien n'est appliqué dans ce cas : l'erreur annule tout.

La Supabase **cloud** n'a pas ce mécanisme — pas de runner, pas de PAT dans
l'environnement de développement. Ce qui la concerne se joue donc à la main,
dans **Supabase Studio → SQL Editor**.

| Fichier | Quand | Nature |
|---|---|---|
| `cloud-1-renumerotation.sql` | **à faire** — équivalent des migrations 002 + 003 | additif + réécrit les **numéros affichés** (`num_bc`, `num_bl`) ; les `id` ne bougent pas · idempotent |
| `cloud-2-nettoyage-donnees-test.sql` | **à faire** — retire les jeux d'essai `TEST` | ⚠ **DESTRUCTIF**. Jouer l'ÉTAPE 1 seule, lire ce qu'elle liste, ne passer à l'ÉTAPE 2 que si tout est bien du test |
| `cloud-3-annulation-tracabilite.sql` | **pas urgent** — équivalent de la migration 004 | purement additif (`add column if not exists`) · idempotent |
| `cloud-4-bdt-debut-numerique.sql` | **à faire** — équivalent de la migration 005 | passe `bons_de_travail.debut` d'entier à décimal (aucune perte). Sans lui, un BDT déposé au quart d'heure est arrondi à l'heure pleine |
| `cloud-5-nomenclature-journal.sql` | **à faire** — équivalent de la migration 006 | crée le journal EN 9100 des nomenclatures (table en ajout seul). Sans lui, les modifications s'enregistrent mais ne sont pas tracées |
| `cloud-6-reception-fournisseur-avoirs.sql` | **à faire** — équivalent de la migration 008 | décision sur un lot fournisseur non conforme (retour / dérogation / entrée partielle) + registre des avoirs fournisseurs. Sans lui, la Qualité ne peut pas statuer sur une réception non conforme et l'onglet Achats « Avoirs fournisseurs » reste vide |
| `cloud-7-process-taux-horaire-machine.sql` | **à faire** — équivalent de la migration 009 | ajoute `process_atelier.taux_horaire_machine` (coût horaire machine saisi sur le process) et y recopie le `cout_h` actuel de la machine des process machine — une seule fois, à la création de la colonne (rejoué, il ne ré-alimente pas un taux vidé volontairement). Sans lui, le calcul lit encore `machines.cout_h` (transition) et la saisie du taux sur un process est refusée avec un message qui renvoie ici |
| `cloud-8-index-uniques-upsert.sql` | **à contrôler** — équivalent de la migration 010 | crée, **seulement s'il manque** et s'il n'y a pas de doublons, l'index unique qu'exige chaque upsert de l'application : `operateur_presence (operateur_id, date_presence)`, `affectation_poste (operateur_id, date_affectation, process_id, shift)`, `competences_operateur (salarie_id, operation)`, `produits_fournisseurs (fournisseur_id, reference)`, `kpi_objectifs (code, entite)` · purement additif, rien n'est effacé (doublons signalés par un WARNING avec la requête pour les lister). Sur le cloud ces upserts fonctionnent : résultat attendu, cinq « rien a faire ». Sans l'index, l'enregistrement correspondant échoue (42P10) — pour les présences opérateur, l'écran l'affiche avec un message qui renvoie ici |
| `cloud-9-bdt-temps-reglage.sql` | **à faire** — équivalent de la migration 011 | ajoute `bons_de_travail.temps_reglage` (réglage compris dans la durée, `null` = inconnu), `duree_avant_decoupe` et `temps_machine_avant_decoupe` (retour arrière d'une découpe) · purement additif, aucune donnée modifiée. Sans lui, les BDT se créent et se découpent mais leur réglage n'est pas enregistré (avertissement), et « Annuler la découpe » recolle sur la somme des morceaux. **Ensuite** : `POST /api/production/bdt/reglage/reconstituer` avec `{"appliquer":false}` (rapport certain / incertain / inconnu) puis `{"appliquer":true}` (n'écrit que les certains, relit) |
| `cloud-10-reception-fournisseur-pv.sql` | **à faire** — équivalent de la migration 012 | lot D Expéditions · ajoute sur `bons_de_livraison` le N° de commande et le N° de BL **du fournisseur**, `hors_france` et, pour une réception hors France, `poids_matiere_kg` (≥ 0), `num_nomenclature` (code douanier), `code_ewx` (1 ou 2), `mode_arrivee` ; `bons_de_commande.certificat_matiere_requis` ; sur `pv_controle` le détail du PV (`detail` jsonb : lignes Oui / Non + observations), `controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere` (`non_requis` / `confirme` / `absent`) ; index unique partiel `ux_pv_controle_reception_bl` (un seul PV de réception par BL), créé **seulement sans doublons** — sinon WARNING avec la requête pour les lister, rien n'est effacé · purement additif. Sans lui, la réception est enregistrée mais **sans** les références fournisseur ni les champs d'import (avertissement à l'écran), et le certificat matière / le détail du PV ne sont pas conservés |
| `cloud-11-mise-en-stock.sql` | **à faire** — équivalent de la migration 013 | lot F Stock · crée la file **Mise en stock** `mises_en_stock` (à ranger / rangé / annulé, anti-doublon par index uniques PV + ligne, quarantaine + ligne, validation + ligne), la liste **modifiable** des types d'objet `stock_types_objet` (amorcée avec Matière première, Accessoire, Consommable, Outillage, Produit chimique, EPI — aucune zone créée), les zones de stockage par type `stock_zones`, le journal en ajout seul `stock_emplacements_historique` ; ajoute `stock.type_objet`, `mouvements_stock.mise_en_stock_id` (index unique partiel), `bons_de_commande.bc_parent_id` et `date_a_valider` (BC de reliquat), `quarantaines.ligne_idx` ; index unique `ux_stock_reference` sur `lower(btrim(reference))` créé **seulement sans doublons** — sinon WARNING avec la requête pour les lister, rien n'est effacé · purement additif. Sans lui, l'onglet Stock › Rangement affiche « jouez cloud-11 » et n'écrit rien, le PV de réception retombe sur l'ancienne entrée directe en stock **avec un avertissement**, emplacements et types d'objet ne sont pas modifiables |

> La migration Docker **007** (identifiant généré par défaut) n'a **pas** d'équivalent cloud : le
> cloud génère déjà ses identifiants — c'est la base Docker, née de `schema.sql`, qui les avait perdus.

## Pourquoi `cloud-3` n'est pas urgent

Les colonnes `annule_le` / `annule_par` / `annule_motif` / `annulation_ref`
préparent les lots **L2 à L4** de l'annulation de commande
(`docs/etudes/plan-annulation-commande.md`) — le formulaire d'annulation, le
choix sur le bon de commande, la facture d'annulation. Ces lots ne sont pas
écrits.

Ce qui **est** déployé du chantier annulation ne touche à aucune de ces
colonnes : `STATUT_ANNULE` (`src/shared.ts`) n'écrit que des valeurs de
`statut`, qui sont du `text` libre, et `src/annulation.ts` est un moteur de
calcul **pur**, pas encore relié à une route.

Vérifiable en une commande :

```bash
grep -rn "annule_le\|annule_par\|annule_motif\|annulation_ref" src/
```

Zéro résultat ⇒ rien à appliquer avant de mettre à jour.

## ⚠ Une incertitude à lever avant le lot L3

`src/index.tsx` affirme à un endroit que le statut des bons de commande est
verrouillé par une contrainte `CHECK` **en cloud**. La sonde
(`pg_constraint contype='c'`) a été faite sur le **Docker**, où il n'y en a
aucune. À vérifier côté cloud **avant** d'écrire `annule` sur un BC en
production :

```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.bons_de_commande'::regclass and contype = 'c';
```

Aucune ligne ⇒ rien à faire. Une ligne ⇒ la contrainte devra accepter `annule`.
