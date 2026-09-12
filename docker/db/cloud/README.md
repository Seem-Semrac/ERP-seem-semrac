# Scripts SQL à jouer à la main — base **cloud** uniquement

Le Docker local et la VM appliquent leur schéma **tout seuls** : le conteneur
`erp-migrate` déroule `docker/db/migrations/` à chaque `erp-docker.sh maj`, en
prenant une sauvegarde avant.

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
