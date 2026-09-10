# Plan — Annulation de commande

> Étude préalable, 10/09/2026. Établie en sondant le code **et** la base Docker.
> Rien n'est implémenté : ce document sert à décider.

## 1. L'état réel de l'existant

**Il n'existe aucune cascade d'annulation.** Une seule route touche au sujet :
`POST /api/offre/:id/refuser` (`src/index.tsx:860`) passe `offres.statut` à `annulee`
et s'arrête là — ni DT, ni commande, ni lots, ni DA, ni BC, ni prépa.

**Le bouton « Refusé » du Commercial n'appelle rien.** `refuserOffre()`
(`src/commercial.tsx:1178`) affiche une notification « Offre annulée, DT associée
archivée » et ne fait **aucun `fetch`**. L'utilisateur croit annuler ; rien ne bouge.

**Aucune contrainte `CHECK` sur les statuts**, sur aucune des 10 tables concernées
(vérifié : `pg_constraint contype='c'` → 0 ligne). Écrire `annule` ne demande donc
**aucune migration DDL**. Éprouvé dans une transaction annulée : les 8 tables acceptent.

⚠ **Une incertitude à lever** : `src/index.tsx:3389` affirme que le statut BC est
verrouillé par un CHECK **en cloud**. La sonde ci-dessus porte sur le Docker local.
À vérifier sur la Supabase cloud avant d'écrire `annule` sur un BC en production.

**Aucune clé étrangère** entre ces tables : annuler ne casse aucun rattachement.

**Aucune colonne de traçabilité** (motif, date, auteur) sur ces tables. Seules
`documents`, `fournisseurs`, `salaries`… portent un `actif boolean`.

## 2. Les pièges repérés

**Deux orthographes coexistent.** `annulee` (offres, commandes, factures, DA) et
`annule` (BC, BDT, BDS, lots, OM). Tous les filtres testent une **égalité stricte** :
écrire la mauvaise forme rend la ligne invisible des filtres qui l'excluent, et elle
reste comptée partout ailleurs.

**La route de statut de prépa a une liste blanche.** `src/index.tsx:9527` :
`['a_faire','en_cours','faite'].includes(b.statut) ? b.statut : 'faite'`.
Lui envoyer `annulee` marque la préparation **FAITE**, en silence. Elle est donc
inutilisable telle quelle pour retirer une prépa de sa liste.

**Les listes « à traiter / traitées » sont partitionnantes** : une ligne annulée
retombe *du mauvais côté*.

| Liste | Ce qui se passe aujourd'hui avec une ligne annulée |
|---|---|
| DA (Achats) | revient dans **« à traiter »**, avec son bouton « Traiter → BC » |
| Prépa technique (BE) | reste dans **« à faire »** — et **bloque encore la production** (`bdtBlocage` : tout ce qui n'est pas `faite` bloque) |
| Factures client (Compta) | tombe dans **« en attente de règlement »** et gonfle le total dû |
| Offres (Commercial) | n'est dans **aucune** des deux tables : elle disparaît |
| DT (Commercial) | repasse en **« à valider »** |

**Les filtres s'écrasent entre eux.** Les 4 barres de recherche du dépôt écrivent
`tr.style.display` en absolu. Ajouter naïvement un filtre « annulés » à côté d'une
recherche cassera la recherche, et inversement. Le seul code qui compose correctement
est `applyDTFilters()` (`src/listes.tsx:243`) : **un** point d'écriture qui lit tous
les critères. C'est le modèle à généraliser.

**Quatre badges ignorent l'annulation** et afficheraient le statut brut en gris :
`prod.tsx:45`, `compta_service.tsx:32`, `listes.tsx:114`, `listes.tsx:564`.

## 3. De quoi chiffrer une annulation

**Matière** : le seul montant en euros est `bons_de_commande.montant_ht`. La matière
reçue d'une affaire = les BC de cette affaire au statut reçu.

**Avancement** : l'ordre de gamme est porté par `seq`, sur `bons_de_travail` **et**
`bons_sous_traitance`. La gamme d'un lot se reconstitue en fusionnant les deux et en
triant par `seq` (`seqSort`, `src/prod.tsx:904`). **Aucune fonction ne calcule
aujourd'hui « l'étape en cours »** : c'est à écrire.

**Coût horaire** : `computeAtelierRates()` (`src/queries.ts:696`) donne
`tauxMachineFor(machine_id)` et `tauxMoFor(operateur_id, activite)`, avec repli
50 €/h machine et 45 €/h main-d'œuvre. Le temps réel est dans `bons_de_travail.temps_reel`.

**Marge** : règle du dépôt, le **taux de marque**. Coefficient `k` source de vérité,
`PV = CRU × k`, `taux = (k−1)/k`, `k = 1/(1−taux)`. ×2 → 50 %, ×2,5 → 60 %.

## 4. Les décisions qui m'échappent

Elles changent la conception ; je ne peux pas les prendre.

1. **La matière refacturée part-elle chez le client, ou reste-t-elle en stock ?**
   Si elle part, il faut un BL et une sortie de stock. Si elle reste, ce n'est pas
   une vente de matière mais une **indemnité** — et le libellé de la facture change.
2. **La marge sur la matière** : taux saisi à chaque annulation, ou valeur par défaut
   paramétrable ? (Je pars sur un taux de marque, cohérent avec le reste de l'ERP.)
3. **Le travail déjà fait** : facturé au **coût de revient** (temps × taux) ou au
   **prix de vente au prorata** des étapes réalisées ?
4. **L'étape en cours** : due **en entier** dès qu'elle est commencée, ou **au prorata**
   du temps pointé ?
5. **Annulation partielle** possible (une pièce sur trois), ou toujours toute la commande ?
6. **Validation Direction** au-delà d'un montant ? (Le moteur `validations` existe.)
7. **Que devient l'offre** ? Elle reste « acceptée » avec une commande annulée, ou
   repasse dans un état propre ?

## 5. Le plan, en 7 lots

### L0 — Fondations
Fixer **une** convention d'orthographe par entité et l'écrire noir sur blanc.
Ajouter la traçabilité : `annule_le`, `annule_par`, `annule_motif` (migration
additive, sans CHECK). Promouvoir un badge de statut partagé dans `shared.ts`
acceptant les deux orthographes. Lever l'incertitude du CHECK cloud sur les BC.

### L1 — Le moteur, en simulation d'abord
`POST /api/commande/:id/annulation/simuler` : ne modifie **rien**, renvoie l'inventaire
de ce qui serait annulé (DA, prépas, BC, lots, BDT, BDS) et le chiffrage proposé.
C'est l'écran de confirmation, et c'est aussi le filet : on voit avant d'agir.
Puis `POST /api/commande/:id/annuler` qui applique, **idempotent**, en journalisant
chaque ligne touchée et chaque échec (ne pas répéter l'erreur du `if (!error) n++`).

### L2 — Le départ commercial
Câbler pour de vrai le bouton du Commercial sur une **offre acceptée** : simulation →
confirmation → annulation. C'est le point d'entrée demandé.

### L3 — Le choix sur le bon de commande
Dans *Achats › Bons de commande*, un bouton **« Annuler »** à côté de « Validée »,
visible **tant que le fournisseur n'a pas accepté**. Après acceptation, l'annulation
devient une négociation avec le fournisseur : plus de bouton, un message qui l'explique.

### L4 — La facture d'annulation
Deux composantes, selon l'avancement au moment de l'annulation :
- **matière reçue** → refacturation matière + marge (décisions 1 et 2) ;
- **production entamée** → en plus, le dû jusqu'à l'étape en cours (décisions 3 et 4).

Écrit l'« étape en cours » qui manque, réutilise `computeAtelierRates`, et respecte
la numérotation **continue** des factures de vente (obligation légale).

### L5 — Les listes et les filtres
Un helper de filtre **composable** dans `shared.ts` (un seul point d'écriture de
`display`), puis, liste par liste : poser un `id` de table (5 des 9 n'en ont pas),
un `data-statut` par ligne, et corriger les filtres partitionnants du tableau §2 —
en particulier `bdtBlocage`, pour qu'une prépa annulée cesse de bloquer la production.

### L6 — Documentation
Doc technique, manuel utilisateur, captures. Règle 1 du projet.

## 6. Ordre proposé

L0 → L1 → L2 permet déjà d'annuler proprement une commande **avant** tout achat :
c'est le cas le plus fréquent et le moins risqué. L3 s'ajoute ensuite, puis L4 —
le plus lourd, et celui qui dépend le plus de vos réponses. L5 peut se faire en
parallèle de L4. L6 clôt.
