# Formulaires — Stock · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Ajouter un article au catalogue
**Quand l'utiliser :** Pour créer une nouvelle référence en stock (une matière, un consommable, un produit chimique, etc.) que l'ERP ne connaît pas encore.
**Où le trouver :** Onglet « Stock en temps réel » → bouton vert « Ajouter article » (aussi accessible depuis l'onglet « Gestion du stock » → « Catalogue & seuils » → bouton « Nouvel article »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Designation (nom complet) | texte | Non | Le nom clair de l'article, celui qui s'affichera partout dans les listes. Écrivez-le en entier. | Barres alu 2024-T3 Ø30 |
| Reference | texte | Non | Le code court de l'article (référence interne ou fournisseur), pratique pour la recherche. | REF-XXX |
| Activite | liste déroulante (Seem, Semrac, both) | Non | À quelle activité appartient l'article. « both » veut dire « les deux » (commun aux deux sites). | Seem |
| Categorie | liste déroulante (matiere_premiere, consommable, chimique, emballage, securite, outillage, piece_rechange) | Non | La famille de l'article. Sert à filtrer et regrouper le stock. | matiere_premiere |
| Unite | liste déroulante (kg, L, pcs, m, bobine, bouteille, rouleau, paire, palette) | Non | L'unité de mesure du stock : au kilo, au litre, à la pièce, etc. | kg |
| Fournisseur prefere | texte | Non | Le nom du fournisseur habituel pour cet article. Sert de suggestion lors des réappros. | Metalium SA |
| Seuil mini (stock securite) | nombre | Non | La quantité en dessous de laquelle l'article passe en « critique » (rouge). C'est votre réserve de sécurité. | 100 |
| Point de commande | nombre | Non | Le niveau qui déclenche l'alerte « il faut recommander ». Toujours supérieur au seuil mini. | 150 |
| Seuil maxi | nombre | Non | La quantité maximale à ne pas dépasser en stock. Sert de repère haut sur les jauges. | 800 |
| Quantite a commander (EOQ) | nombre | Non | La quantité qu'on recommande habituellement d'un coup (quantité économique). Pré-remplit les demandes d'achat. | 200 |
| Prix unitaire HT (EUR) | nombre | Non | Le prix d'achat d'une unité, hors taxes. Sert à calculer la valeur du stock. | 4.20 |
| Delai fournisseur (jours) | nombre | Non | Le nombre de jours entre la commande et la livraison. Aide à anticiper les réappros. | 7 |
| Emplacement magasin | texte | Non | Où l'article est physiquement rangé dans le magasin (rack, armoire, allée). | Rack A1 / Armoire C2 |

💡 **Astuce :** Renseignez au moins le nom, l'unité et les trois seuils (mini, point de commande, maxi) : ce sont eux qui pilotent les alertes et les jauges de couleur.
⚠️ **Attention :** Aucun champ n'est bloquant techniquement, mais un article sans seuils ne déclenchera aucune alerte de réapprovisionnement. Respectez l'ordre logique : seuil mini < point de commande < seuil maxi.

## Saisir une entrée (réception de stock)
**Quand l'utiliser :** Quand de la marchandise arrive au magasin (livraison fournisseur) pour augmenter le stock.
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Entrée stock » → cadre « Saisir une entrée ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article | liste déroulante (la liste de vos articles en stock, avec leur quantité actuelle) | Non | Choisissez l'article qui vient d'être livré. La quantité en stock est affichée à côté de chaque nom. | Barre aluminium 6060 Ø30mm (stock: 485 kg) |
| Quantite recue | nombre | Non | La quantité réellement reçue, à ajouter au stock. | 200 |
| Date reception | date | Non | Le jour de la réception. Pré-rempli avec la date du jour, à corriger si besoin. | 2026-07-04 |
| BL fournisseur | texte | Non | Le numéro du bon de livraison remis par le fournisseur. Utile pour la traçabilité. | BLF-2026-XXX |
| DA liee | texte | Non | Le numéro de la demande d'achat à l'origine de cette livraison, si elle existe. | DA-2026-XXX |
| Operateur | texte | Non | Le nom de la personne qui enregistre la réception. | Morgane |

💡 **Astuce :** Renseignez le BL fournisseur et la DA liée : cela relie l'entrée à la commande d'origine et facilite les contrôles ultérieurs.
⚠️ **Attention :** Choisissez bien l'article et saisissez la quantité avant de cliquer sur « Valider entrée », sinon rien ne sera ajouté au stock.

## Saisir une sortie (consommation de stock)
**Quand l'utiliser :** Quand de la matière ou un consommable quitte le magasin (utilisé en production, mis au rebut, etc.) pour diminuer le stock.
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Sortie stock » → cadre « Saisir une sortie ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article | liste déroulante (la liste de vos articles en stock, avec leur quantité actuelle) | Non | Choisissez l'article qui sort du stock. La quantité disponible est affichée à côté. | Barre aluminium 6060 Ø30mm (stock: 485 kg) |
| Quantite sortie | nombre | Non | La quantité qui quitte le stock, à retirer. | 45 |
| Date | date | Non | Le jour de la sortie. Pré-rempli avec la date du jour. | 2026-07-04 |
| Reference BDT / LOT / CMD | texte | Non | Le document qui justifie la sortie : un bon de travail, un lot ou une commande. | BDT-XXX ou CMD-2026-XXX |
| Operateur | texte | Non | Le nom de la personne qui enregistre la sortie. | Antoine D. |
| Motif | liste déroulante (Consommation production, Rebut / casse, Retour fournisseur, Transfert inter-atelier) | Non | La raison de la sortie. Choisissez celle qui correspond. | Consommation production |

💡 **Astuce :** Reliez chaque sortie à un BDT ou une commande : c'est ce qui permet de suivre le coût réel de chaque affaire.
⚠️ **Attention :** Vérifiez la quantité : une sortie retire réellement du stock. Sélectionnez le bon article avant de valider.

## Ajustement / Inventaire physique
**Quand l'utiliser :** Pour corriger le stock quand la quantité réelle comptée dans le magasin ne correspond pas à la quantité affichée par l'ERP (inventaire, perte, erreur de saisie).
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Ajustement / Inventaire » → cadre « Ajustement / Inventaire physique ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article | liste déroulante (la liste de vos articles en stock, avec leur quantité actuelle) | Non | Choisissez l'article dont vous corrigez le stock. | Barre aluminium 6082 Ø80mm (stock: 72 kg) |
| Stock reel constate | nombre | Non | La quantité réellement comptée dans le magasin. L'ERP alignera le stock sur cette valeur. | 68 |
| Date inventaire | date | Non | Le jour où le comptage a été fait. Pré-rempli avec la date du jour. | 2026-07-04 |
| Motif | liste déroulante (Inventaire physique periodique, Ecart constate, Perte / deterioration, Correction erreur de saisie) | Non | La raison de l'ajustement. Choisissez celle qui correspond. | Inventaire physique periodique |
| Responsable inventaire | texte | Non | Le nom de la personne qui a réalisé le comptage. | Lénaïck |

💡 **Astuce :** Utilisez ce formulaire plutôt qu'une entrée ou une sortie quand vous ne connaissez pas la cause exacte de l'écart : il trace la correction dans le journal.
⚠️ **Attention :** Ici on saisit le **stock réel total constaté**, pas la différence. L'ERP calcule tout seul l'écart entre le théorique et le réel.

## Catalogue & seuils (paramétrage en ligne)
**Quand l'utiliser :** Pour ajuster rapidement les seuils d'alerte d'un article existant et activer (ou non) le réapprovisionnement automatique, directement dans le tableau.
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Catalogue & seuils » → tableau « Catalogue articles et paramétrage des seuils » (une ligne modifiable par article).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Seuil mini | nombre | Non | La quantité en dessous de laquelle l'article devient « critique ». Modifiable directement dans la case. | 100 |
| Pt commande | nombre | Non | Le niveau qui déclenche l'alerte de réapprovisionnement. Toujours au-dessus du seuil mini. | 150 |
| Qté cmd | nombre | Non | La quantité à commander à chaque réappro (quantité habituelle). | 200 |
| Réappro auto | case à cocher | Non | Si cochée, une demande d'achat est **créée automatiquement** dès que le stock passe sous le point de commande. | cochée |

💡 **Astuce :** Après avoir modifié une ou plusieurs cases d'une ligne, cliquez sur le bouton « Enregistrer » (icône disquette) au bout de la ligne pour sauvegarder.
⚠️ **Attention :** Cochez « Réappro auto » uniquement pour les articles que vous voulez recommander sans intervention : chaque passage sous le point de commande générera alors une demande d'achat tout seul.

## Nouvelle demande d'achat
**Quand l'utiliser :** Pour demander l'achat d'un article, que ce soit une réponse à une alerte de stock ou un besoin ponctuel hors alerte. La demande part vers le service Achats.
**Où le trouver :** Onglet « Alertes et Réappro. » → bouton vert « Nouvelle DA » (en haut à droite du panneau). Un bouton « Demande d'achat » est aussi disponible en haut à droite de l'écran, quel que soit l'onglet ouvert.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article / Désignation | texte | Oui | Ce que vous voulez commander, décrit clairement. C'est le seul champ vraiment obligatoire. | Barres alu 2024-T3 Ø30 |
| Type | liste déroulante (Matière, Outillage, Consommable, Chimique, Sous-traitance) | Non | La nature de l'achat. Aide les Achats à classer la demande. | Matière |
| Quantité | texte | Non | Combien vous en voulez, avec l'unité si utile. | 12 barres |
| Fournisseur | texte | Non | Le fournisseur souhaité, si vous en avez un en tête. | Metalium SA |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | Le niveau d'urgence de la demande. | Urgent |
| Livraison souhaitée | date | Non | La date à laquelle vous aimeriez être livré. | 2026-07-20 |
| N° affaire (option) | texte | Non | Le numéro de l'affaire/commande liée, pour imputer l'achat au bon dossier. | AFF-2026-XXX |

💡 **Astuce :** Depuis une alerte de stock (onglet « Alertes et Réappro. » ou onglet « Stock en temps réel »), le bouton « Créer DA » sur la ligne d'un article crée la demande directement, sans ressaisie : l'article, la quantité et le fournisseur sont repris automatiquement et la DA part aussitôt vers les Achats.
⚠️ **Attention :** La désignation de l'article est **obligatoire** : sans elle, la demande ne peut pas être créée. Une fois validée, la DA part immédiatement vers les Achats (« à traiter »).
