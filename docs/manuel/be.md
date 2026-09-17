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
2. Renseigner la **matière** (référence → prix repris du catalogue s'il a **moins de 6 mois** ; plus ancien, il reste affiché **en orange** avec une demande de prix conseillée) et la **masse** (g). Les **accessoires** suivent la même règle.
3. Ajouter les **étapes** (glisser-déposer) : type, poste, process, puis les temps en millièmes d'heure — **ROP** (réglage homme), **RGM** (réglage machine), **MO** (homme par pièce), **Mach** (machine par pièce). Les réglages sont des coûts fixes par lot.
   - Coût d'une étape = heures homme (ROP + RGM + MO) × **coût chargé RH moyen du site** + heures machine (RGM + Mach) × **taux horaire machine du process** (process machine seulement). Sous le process, l'indication dit d'où vient le taux (« Machine · 48,00 €/h », « Machine · taux à saisir », « Manuel · homme au coût chargé RH »).
   - Un encart orange **« Coût de revient incomplet »** signale un taux machine à saisir (Production › Process Ateliers) ou un coût chargé RH absent (RH) : la part concernée compte 0 €.
4. Le **prix de revient unitaire** se calcule automatiquement. Enregistrer (indice A/B/C).

### Demander un prix (à tout moment)
1. Dans le compartiment **Matière (tôle)** ou **Accessoires**, chaque ligne a son bouton de demande de prix :
   - **prix récent** (moins de 6 mois) : petit bouton **gris** à côté du prix, pour redemander quand même ;
   - **prix ancien** ou introuvable au catalogue : prix **orange** conservé + bouton **orange** (demande conseillée) ;
   - **aucun prix** : bouton orange **« demande de prix »**.
2. Une **référence ou une désignation** suffit : le fournisseur n'est pas obligatoire.
3. Après l'envoi, un sablier **« vérifier »** remplace le bouton. Il reste affiché tant que les **Achats** n'ont pas validé la demande. Cliquez-le pour récupérer la réponse :
   - un seul fournisseur a un prix récent → son **prix et son nom** sont repris sur la ligne, les coûts se recalculent ;
   - plusieurs → l'ERP vous demande de **choisir le fournisseur** de la ligne ;
   - demande validée sans prix récent → le prix actuel est conservé.
4. Onglet **Références** : le bouton **« Demande de prix »** est présent sur **chaque** ligne (orange si le prix manque ou a plus de 6 mois, gris sinon).

> Le prix d'une ligne n'est **jamais remis à 0** à l'affichage. Il ne repart à zéro que si vous changez vous-même la référence, le fournisseur, ou la désignation d'une ligne sans référence. ⚠ Le sablier est perdu si vous rechargez la page : recliquez plus tard ou suivez la demande dans Achats › Demandes de prix.

### Nomenclature mère et nouvel indice
- À chaque ouverture, la fiche est **relue en base** : les composants d'une mère et la dernière saisie réapparaissent, même juste après un enregistrement. Enregistrer sans toucher aux composants les conserve.
- Pour retirer des composants : leur **croix**, puis Enregistrer. Message « *Enregistrement refusé : cette nomenclature compte N composant(s) en base et la liste envoyée est vide* » → fermer et rouvrir la fiche.
- **« Incrémenter l'indice »** crée une révision **« En cours »**, même depuis une nomenclature validée : la relire puis la **valider**. D'ici là, les nouvelles commandes et l'OF gardent l'indice validé précédent (un OF sans aucun indice validé affiche « **GAMME NON VALIDÉE** » à côté de l'indice).

### Supprimer une nomenclature validée
1. Cliquer **« Supprimer »** sur la ligne. Une nomenclature **validée** (ou qui l’a été puis a été dévalidée) demande un **motif**, saisi dans une fenêtre dédiée.
2. Le motif est inscrit au **journal EN 9100** avec l’auteur et la date.
3. En **suppression groupée**, le motif est demandé **une seule fois** dans la fenêtre de confirmation et vaut pour toute la sélection.

> Si le journal EN 9100 n’existe pas encore sur la base (script `cloud-5` non joué), la suppression d’une nomenclature validée est **refusée** : le motif ne pourrait pas être tracé.

---
> Détails techniques : `docs/technique/06-modules/be.md`. Droits d'accès : `docs/fiches-poste/`.
