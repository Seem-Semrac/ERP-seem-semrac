# Formulaires — Stock · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Accepter l'entrée en stock (ranger une ligne)
**Quand l'utiliser :** Quand une ligne attend dans la liste « À ranger » (réception contrôlée conforme au PV, part acceptée par la Qualité, excédent validé par la Direction, entrée manuelle) et que vous la rangez physiquement. **C'est ce clic qui crédite le stock.**
**Où le trouver :** Onglet « Rangement / Mise en stock » → sous-onglet « À ranger » → bouton vert « Accepter l'entrée en stock » sur la ligne. Réservé à l'écriture Stock.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Référence | lecture (champ texte avec liste des références connues si la ligne n'en porte pas) | Oui | La référence de stock qui sera créditée. Une référence inconnue est créée au rangement. | TUBE-ALU-30 |
| Quantité à ranger | lecture | — | La quantité contrôlée, avec son unité. Elle ne se modifie pas : une ligne fausse s'annule et se ressaisit en entrée manuelle. | 20 pce |
| Désignation | lecture | — | Reprise du bon de commande ou de l'entrée manuelle. | Tube alu 30x2 |
| Type d'objet | liste déroulante (types actifs : Matière première, Accessoire, Consommable, Outillage, Produit chimique, EPI… ; pré-rempli par l'ERP) | Oui | La famille de l'objet. C'est elle qui donne la liste des zones proposées. Vérifiez la proposition. | Matière première |
| Emplacement | lecture, verrouillé (cadenas) | — | Affiché quand la référence a **déjà** son emplacement fixe : rien à choisir. Il se change dans Niveaux d'approvisionnement. | Rack tubes A1 |
| Zone de rangement | liste déroulante (zones actives du type) | Oui pour une nouvelle référence ou une référence sans emplacement | L'endroit où vous rangez. Elle devient l'**emplacement fixe** de la référence. | Rack tubes A1 |
| Nouvelle zone pour ce type | texte (80 caractères max) — via le lien « Nouvelle zone pour ce type », ou affiché d'office | Oui si le type n'a encore aucune zone | Crée la zone dans la liste du type, puis range dedans. « Revenir à la liste » annule la saisie. | Rack tôles B2 |

💡 **Astuce :** Le type proposé indique sa source (« d'après le bon de commande », « d'après la catégorie en stock », « registre chimique »…). Si la zone n'existe pas encore, créez-la ici plutôt que d'en choisir une approximative : elle servira pour toutes les références de ce type.
⚠️ **Attention :** L'emplacement d'une nouvelle référence devient **fixe** : il ne se changera plus au rangement. Si l'ERP répond « Plusieurs articles de stock portent la référence … », la référence est en double dans le stock : faites-la régulariser avant de ranger.

## Annuler une ligne à ranger
**Quand l'utiliser :** Quand une ligne de la liste « À ranger » est erronée (mauvaise quantité, mauvaise référence, doublon d'une saisie manuelle).
**Où le trouver :** Onglet « Rangement / Mise en stock » → « À ranger » → petit bouton gris (⃠) au bout de la ligne.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Motif | zone de texte (fenêtre de confirmation) | Oui (3 caractères minimum) | Pourquoi la ligne est écartée. Visible ensuite dans « Derniers rangements et annulations ». | Quantité erronée, ressaisie en entrée manuelle |

💡 **Astuce :** Pour ranger la bonne quantité, faites ensuite une entrée manuelle (Gestion du stock → Entrée stock).
⚠️ **Attention :** Seule une ligne encore « à ranger » s'annule. Rien n'est crédité ; l'annulation ne se défait pas.

## Ajustement / inventaire physique
**Quand l'utiliser :** Pour corriger le stock quand la quantité comptée dans le magasin ne correspond pas à celle de l'ERP (inventaire, perte, erreur de saisie).
**Où le trouver :** Onglet « Rangement / Mise en stock » → sous-onglet « Ajustement de stock ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article | liste déroulante (articles avec leur stock actuel) | Oui | L'article dont vous corrigez le stock. | Tube alu 30x2 · TUBE-ALU-30 (stock : 20 pce) |
| Quantité constatée | nombre (≥ 0) | Oui | La quantité **totale** réellement comptée. L'ERP calcule l'écart ; un écart nul est refusé. | 19 |
| Motif | liste déroulante (Inventaire physique périodique, Écart constaté, Perte / détérioration, Correction d'erreur de saisie, Autre) | Oui | La raison de l'ajustement. | Inventaire physique périodique |
| Précision du motif | texte | Oui pour « Autre », sinon non | Détail ajouté au motif. | 1 tube rayé |

💡 **Astuce :** L'ERP demande confirmation en rappelant « de … à …, écart … » : relisez avant de valider.
⚠️ **Attention :** Saisissez le **stock réel constaté**, pas la différence. Le mouvement d'ajustement porte l'écart (positif ou négatif) et reste dans l'historique.

## Types d'objet et zones de stockage
**Quand l'utiliser :** Pour tenir la liste des types d'objet et, pour chaque type, la liste des zones proposées au rangement.
**Où le trouver :** Onglet « Rangement / Mise en stock » → sous-onglet « Types & zones ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nouveau type (libellé) | texte (2 à 60 caractères) | Oui pour ajouter un type | Nom du type ; son code technique en est déduit. Un libellé déjà pris est refusé. | Emballage |
| Ordre (type) | nombre | Non | Place du type dans les listes. Vide = à la fin. | 70 |
| Actif (type) | case à cocher | Non | Décochée : le type n'est plus proposé (les références qui le portent le gardent). | cochée |
| Nouvelle zone pour « … » | texte (80 caractères max) | Oui pour ajouter une zone | Nom de la zone dans la carte du type. Une zone déjà présente n'est pas recréée ; présente mais désactivée : réactivez-la. | Rack tubes A1 |
| Nom de zone / Ordre / active | texte / nombre / case à cocher, puis disquette | Non | Renommer (impossible si la zone est déjà l'emplacement de références), réordonner, désactiver. | Rack tubes A2 |

💡 **Astuce :** La colonne « Réf. » (types) et « N réf. » (zones) dit combien de références sont concernées avant de désactiver quoi que ce soit.
⚠️ **Attention :** Rien ne se supprime : un type ou une zone se **désactive**. Pour renommer une zone utilisée : créez la nouvelle, déplacez les références (Niveaux d'approvisionnement), désactivez l'ancienne.

## Entrée manuelle (ligne à ranger)
**Quand l'utiliser :** Pour une entrée hors réception fournisseur : retour atelier, régularisation, livraison sans bon de commande. Elle ajoute une ligne à la liste « À ranger » — **rien n'est crédité avant le rangement**.
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Entrée stock » → cadre « Entrée manuelle » (aussi : bouton « Ajouter article » et flèche verte de l'onglet Stock en temps réel).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Référence | texte avec liste des références connues (120 caractères max) | Oui | Référence existante ou nouvelle. Pour une référence connue, la désignation, l'unité et le type se remplissent. | GANT-NITRILE-9 |
| Désignation | texte | Non | Nom clair de l'article (repris pour une référence existante). | Gants nitrile T9 |
| Quantité | nombre (> 0) | Oui | La quantité entrée. | 50 |
| Unité | texte | Non | pce, kg, m, paire… | paire |
| Type d'objet | liste déroulante (types actifs, ou « à choisir au rangement ») | Non | Pré-remplit le type au rangement. | EPI |
| Affaire | texte | Non | Rattache l'entrée à une affaire (utile pour la matière d'une affaire). | 0001 |
| Motif | texte (3 caractères minimum) | Oui | L'origine de l'entrée. | Retour atelier |

💡 **Astuce :** Les livraisons fournisseurs ne se saisissent pas ici : la réception et le PV de contrôle (Expéditions) remplissent la liste « À ranger » tout seuls.
⚠️ **Attention :** Après « Ajouter à la liste « À ranger » », allez dans l'onglet Rangement pour accepter la ligne : c'est là que le stock est crédité.

## Sortie de stock
**Quand l'utiliser :** Quand de la matière ou un consommable quitte réellement le magasin (consommation, rebut, retour, transfert).
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Sortie stock » → cadre « Saisir une sortie » (aussi : flèche rouge de l'onglet Stock en temps réel).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article | liste déroulante (articles avec leur stock ; ceux à zéro sont grisés) | Oui | L'article qui sort. | Tube alu 30x2 · TUBE-ALU-30 (stock : 19 pce) |
| Quantité sortie | nombre (> 0) | Oui | Ce qui quitte le magasin ; refusée au-delà du stock disponible. | 4 |
| Motif | liste déroulante (Consommation production, Rebut / casse, Retour fournisseur, Transfert inter-atelier, Autre) | Oui | La raison de la sortie. | Consommation production |
| Précision du motif | texte | Oui pour « Autre », sinon non | Détail ajouté au motif. | Chute pour essai |
| BDT | texte | Non | Le bon de travail consommateur : l'ERP le vérifie, retrouve son lot et son affaire, et impute la sortie au coût matière réel. | BDT-2026-0001-01-01 |
| Affaire | texte | Non | L'affaire concernée ; vérifiée. Sans BDT, la sortie n'est pas valorisée dans le coût matière (message orange). | 0001 |

💡 **Astuce :** Indiquez le BDT chaque fois que possible : c'est lui qui alimente le coût réel du lot et de l'affaire.
⚠️ **Attention :** Un BDT ou une affaire introuvables, ou un BDT d'une autre affaire, sont refusés et rien n'est sorti. L'ERP demande confirmation avant d'enregistrer.

## Niveaux d'approvisionnement (paramétrage en ligne)
**Quand l'utiliser :** Pour régler les seuils d'alerte et le réappro automatique d'une référence, et pour changer son type d'objet ou son emplacement fixe.
**Où le trouver :** Onglet « Gestion du stock » → sous-onglet « Niveaux d'approvisionnement » (une ligne modifiable par référence ; case « Masquer les produits vides » et recherche en haut).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type d'objet | liste déroulante (types actifs) — enregistré dès le choix | Non | Change le type de la référence et la liste de ses zones. Un type ne peut pas être vidé. | Matière première |
| Emplacement | liste déroulante (zones actives du type, « — aucun — » ; un ancien emplacement s'affiche « (hors liste) ») | Non | Déplace l'emplacement fixe. Une confirmation s'ouvre avec un **motif facultatif** ; le changement est historisé. | Rack tubes A2 |
| Historique (🕘) | bouton | — | Liste des emplacements successifs : date, avant, après, motif, auteur. | — |
| Seuil mini | nombre | Non | En dessous, l'article devient « critique ». | 100 |
| Pt commande | nombre | Non | Niveau qui déclenche l'alerte de réappro (au-dessus du seuil mini). | 150 |
| Qté cmd | nombre | Non | Quantité à commander à chaque réappro. | 200 |
| Réappro auto | case à cocher | Non | Cochée : une DA est créée automatiquement sous le point de commande (en comptant ce qui attend dans « À ranger »). | cochée |

💡 **Astuce :** Seuils et réappro auto s'enregistrent avec la disquette de la ligne ; le type et l'emplacement s'enregistrent dès le choix.
⚠️ **Attention :** Choisissez le type avant l'emplacement : la zone se choisit dans la liste du type. Une référence à zéro est masquée tant que « Masquer les produits vides » est cochée.

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
