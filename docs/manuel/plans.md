# Plan / Bâtiment

**Pour qui :** BE / Production / Maintenance / Qualité

Maquette « BIM » de l'usine : zones (rectangles) et objets (machines, périssables, chimie, ATEX, extincteurs) reliés à la base, avec états live et deep-links.

![plans-maquette](../assets/plans-maquette.png)

## Les onglets
- **Maquette** — Vue interactive du plan.

## Vue « Risque chimique » (SEIRICH)
Le bouton **« Vue risque chimique »** (barre d'outils) colore les **produits chimiques** et **zones ATEX** posés sur le plan selon leur **niveau de risque** (vert = faible, orange = moyen, rouge = élevé), avec une légende par niveau. C'est la **carte du risque chimique de l'usine** : on voit d'un coup d'œil où sont les priorités. Un produit dont l'étiquetage n'est pas renseigné apparaît en **« ? »** (à compléter, ne pas prendre pour « sûr »). **Cliquer un repère chimique** ouvre sa **fiche produit 360**.

## Procédures
### Placer une machine dans une zone
1. Bouton **Modifier**.
2. Dans **Catégories**, cliquer **+** sur « Machine », puis **cliquer** l'emplacement **dans le rectangle** de la zone.
3. Dans l'éditeur, champ **« Élément lié »**, choisir la machine dans la liste.
4. **Appliquer** puis **Enregistrer**. La machine est rattachée à la zone automatiquement et se colore selon son état (panne = rouge).

---
> Détails techniques : `docs/technique/06-modules/plans.md`. Droits d'accès : `docs/fiches-poste/`.
