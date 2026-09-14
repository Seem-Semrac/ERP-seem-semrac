# Bureau d'Études

**Pour qui :** Technicien(ne) BE

Définition technique des pièces : nomenclatures (matières + gamme d'opérations), analyse des DT, références.

![be-noms](../assets/be-noms.png)

## Les onglets
- **Nomenclatures** — BOM : composants matière (masse en g), gamme d'opérations (temps en millièmes d'heure), prix de revient calculé.
- **Analyse DT** — Transforme une DT en dossier technique.
- **Préparations tech.** — Fichiers plan / programme CN par étape.
- **Références** — Catalogue des références et prix.
- **Dashboard BE** — Indicateurs BE.

## Procédures
### Créer une nomenclature
1. Onglet **Nomenclatures**, « Nouvelle nomenclature ».
2. Renseigner la **matière** (référence → prix auto si < 3 mois, sinon RFQ) et la **masse** (g).
3. Ajouter les **étapes** (glisser-déposer) : type, poste, process, puis les temps en millièmes d'heure — **ROP** (réglage homme), **RGM** (réglage machine), **MO** (homme par pièce), **Mach** (machine par pièce). Les réglages sont des coûts fixes par lot.
   - Coût d'une étape = heures homme (ROP + RGM + MO) × **coût chargé RH moyen du site** + heures machine (RGM + Mach) × **taux horaire machine du process** (process machine seulement). Sous le process, l'indication dit d'où vient le taux (« Machine · 48,00 €/h », « Machine · taux à saisir », « Manuel · homme au coût chargé RH »).
   - Un encart orange **« Coût de revient incomplet »** signale un taux machine à saisir (Production › Process Ateliers) ou un coût chargé RH absent (RH) : la part concernée compte 0 €.
4. Le **prix de revient unitaire** se calcule automatiquement. Enregistrer (indice A/B/C).

### Supprimer une nomenclature validée
1. Cliquer **« Supprimer »** sur la ligne. Une nomenclature **validée** (ou qui l’a été puis a été dévalidée) demande un **motif**, saisi dans une fenêtre dédiée.
2. Le motif est inscrit au **journal EN 9100** avec l’auteur et la date.
3. En **suppression groupée**, le motif est demandé **une seule fois** dans la fenêtre de confirmation et vaut pour toute la sélection.

> Si le journal EN 9100 n’existe pas encore sur la base (script `cloud-5` non joué), la suppression d’une nomenclature validée est **refusée** : le motif ne pourrait pas être tracé.

---
> Détails techniques : `docs/technique/06-modules/be.md`. Droits d'accès : `docs/fiches-poste/`.
