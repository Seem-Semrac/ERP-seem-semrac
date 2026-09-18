# Bureau d'Études

**Pour qui :** Technicien(ne) BE

Définition technique des pièces : nomenclatures (matières + gamme d'opérations), analyse des DT, références.

![be-noms](../assets/be-noms.png)

## Les onglets
- **Nomenclatures** — BOM : composants matière (masse en g), gamme d'opérations (temps en millièmes d'heure), prix de revient calculé.
- **Analyse DT** — Transforme une DT en dossier technique.
- **Préparations tech.** — Fichiers plan / programme CN par étape.
- **Références** — Catalogue des références, des prix et de la **quantité par paquet** des accessoires.
- **Dashboard BE** — Indicateurs BE.

## Procédures
### Créer une nomenclature
1. Onglet **Nomenclatures**, « Nouvelle nomenclature ».
2. Renseigner la **matière** et la **masse** (g), puis les **accessoires**. Les deux compartiments sont en **haut de la colonne de droite**, au-dessus des étapes.
   - On cherche par **référence OU par désignation** (accents et majuscules sans importance : « tole alu » trouve « Tôle aluminium ») dans **tout le catalogue, tous fournisseurs confondus**. Choisir une entrée remplit les deux cases. **Il n'y a plus de fournisseur à choisir** sur une ligne.
   - Le **prix estimé / pièce** est la **moyenne des fournisseurs** qui portent la référence (voir la procédure suivante). Matière : renseigner **Pc/tôle** (pièces tirées d'une tôle). Accessoires : renseigner **Nb/pièce** (accessoires par pièce fabriquée) — la **quantité par paquet** ne se saisit plus ici, elle est déclarée **au catalogue**.
   - ⚠ Une **même référence ne peut figurer qu'une fois** dans une nomenclature, matière et accessoires confondus : la ligne en double est refusée avec un message qui indique laquelle.
3. Ajouter les **étapes** (glisser-déposer) : type, poste, process, puis les temps en millièmes d'heure — **ROP** (réglage homme), **RGM** (réglage machine), **MO** (homme par pièce), **Mach** (machine par pièce). Les réglages sont des coûts fixes par lot.
   - Coût d'une étape = heures homme (ROP + RGM + MO) × **coût chargé RH moyen du site** + heures machine (RGM + Mach) × **taux horaire machine du process** (process machine seulement). Sous le process, l'indication dit d'où vient le taux (« Machine · 48,00 €/h », « Machine · taux à saisir », « Manuel · homme au coût chargé RH »).
   - Un encart orange **« Coût de revient incomplet »** signale un taux machine à saisir (Production › Process Ateliers) ou un coût chargé RH absent (RH) : la part concernée compte 0 €.
4. Le **prix de revient unitaire** se calcule automatiquement. Enregistrer (indice A/B/C).

![Éditeur de nomenclature : identification à gauche ; à droite, en haut, les compartiments Matière (tôle) et Accessoires avec leur « Prix estimé / pièce », puis les étapes](../assets/form-be-nomenclature.png)

> Sur cette capture, l'écrou `136290` montre le cas à corriger : sa quantité par paquet n'est pas encore déclarée (« cond. ? » en orange), donc son prix de paquet (10,40 €) est compté comme un prix à la pièce. Les lignes de l'exemple sont posées à l'écran pour la capture, rien n'est enregistré.

### Comprendre le « prix estimé / pièce » (prix moyen des fournisseurs)

Le prix d'une fourniture n'est plus celui d'**un** fournisseur choisi à la main : c'est la **moyenne de tous les fournisseurs du catalogue** qui portent cette référence et qui ont un prix.

**Exemple** — la vis `VIS-M6-20` est au catalogue chez deux fournisseurs :

| Fournisseur | Prix catalogue | Quantité par paquet | Ramené à la pièce |
|---|---|---|---|
| A | **10,00 €** le paquet | 100 pièces | 0,10 € |
| B | **6,00 €** le paquet | 50 pièces | 0,12 € |

→ prix estimé = (0,10 + 0,12) ÷ 2 = **0,11 € la pièce**. Avec « Nb/pièce = 4 », la ligne coûte **0,44 €** par pièce fabriquée.

- Sous le prix, un badge indique **combien de fournisseurs** ont été pris en compte et la **fourchette** (« 2 fourn. · 0,10–0,12 €/pce »). **Survolez** la case pour le détail, **cliquez-la** pour l'ouvrir en grand : fournisseur par fournisseur, prix catalogue, quantité par paquet, prix à la pièce et date.
- **Matière** : pas de conversion, on fait la moyenne du **prix d'une tôle** ; le prix par pièce est ensuite « prix tôle moyen ÷ Pc/tôle ».
- **Couleurs** : prix normal = tout va bien · **orange** = au moins un prix a plus de 6 mois (demande de prix conseillée) ou le prix vient d'une ancienne saisie · **rouge « coût incomplet »** = aucun prix au catalogue (la nomenclature reste enregistrable et validable).
- **« cond. ? » en orange** = un fournisseur a un prix mais **personne n'a déclaré combien de pièces il y a dans son paquet** : son prix est compté **comme un prix à la pièce**, ce qui peut fausser fortement la moyenne. Déclarez la quantité dans **Références** (bouton « Éditer ») ou dans *Achats › Fournisseurs › fiche › Références fournies*.
- Une ancienne nomenclature (avec fournisseur et qté/paquet sur la ligne) s'affiche **avec le nouveau calcul** ; elle ne bascule réellement qu'au **prochain enregistrement** que vous ferez. Rien n'est converti en masse.

### Demander un prix (à tout moment)
1. Dans le compartiment **Matière (tôle)** ou **Accessoires**, chaque ligne a son bouton de demande de prix :
   - **prix récent** (moins de 6 mois) : petit bouton **gris** à côté du prix, pour redemander quand même ;
   - **prix ancien** ou introuvable au catalogue : prix **orange** conservé + bouton **orange** (demande conseillée) ;
   - **aucun prix** : bouton orange **« demande de prix »**.
2. Une **référence ou une désignation** suffit : il n'y a **pas de fournisseur à désigner**. La fenêtre s'ouvre pré-remplie (référence, désignation, quantité, catégorie, n° de nomenclature) avec un bloc **Destinataires** : tous les fournisseurs qui **portent déjà cette référence** sont **cochés d'avance** ; si aucun ne la porte, choisissez librement parmi les fournisseurs.
3. Après l'envoi, un sablier **« vérifier »** remplace le bouton. Il reste affiché tant que les **Achats** n'ont pas validé la demande. Cliquez-le pour récupérer la réponse : les prix validés entrent au catalogue et **la moyenne de la ligne se recalcule** (le badge passe de « 1 fourn. » à « 2 fourn. », etc.). Une demande validée sans prix récent laisse le prix actuel en place.
4. Onglet **Références** : le bouton **« Demande de prix »** est présent sur **chaque** ligne (orange si le prix manque ou a plus de 6 mois, gris sinon).

> Plus vous consultez de fournisseurs pour une même référence, plus le prix estimé est juste : les Achats enregistrent **tous** les prix chiffrés, pas seulement celui du fournisseur retenu.
> Le prix d'une ligne n'est **jamais remis à 0** à l'affichage : si la référence n'est pas (ou plus) au catalogue, le dernier prix connu reste affiché en orange. ⚠ Le sablier est perdu si vous rechargez la page : recliquez plus tard ou suivez la demande dans Achats › Demandes de prix.

### Déclarer la quantité par paquet d'un accessoire (onglet Références)
1. Onglet **Références**. Un bandeau orange en haut signale, le cas échéant, combien d'accessoires **n'ont pas** de quantité par paquet déclarée : leur prix de paquet est compris **à la pièce** dans toutes les nomenclatures.
2. Colonne **Qté/paquet** : « non déclarée » (orange) pour un accessoire sans conditionnement, « — » pour une matière.
3. Bouton **« Éditer »** sur la ligne → champ **Quantité par paquet** (visible pour la catégorie « Accessoire »), puis Enregistrer. Le champ laissé **vide ne change rien** : une quantité déjà en base n'est jamais effacée.
4. Le même champ existe dans *Achats › Fournisseurs / ST › fiche du fournisseur › **Références fournies*** — c'est le **même catalogue**.

![Onglet Références : bandeau orange des accessoires sans quantité par paquet et colonne Qté/paquet](../assets/be-refs.png)

> Rappel : le prix d'un accessoire au catalogue est le **prix du PAQUET**, celui d'une matière le **prix d'UNE TÔLE**. Le prix à la pièce est toujours **calculé**, jamais saisi.
> Si votre base n'est pas encore à jour, l'ERP répond « *Référence enregistrée, sauf la quantité par paquet…* » : la référence est bien enregistrée, prévenez l'administrateur (script `cloud-13` à appliquer).

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
