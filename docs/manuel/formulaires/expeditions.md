# Formulaires — Expeditions · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouveau BL Client — livraison (partielle possible)
**Quand l'utiliser :** Pour préparer l'expédition des pièces d'une commande vers un client, en une seule fois ou par livraisons partielles (lot par lot).
**Où le trouver :** Onglet « Bons de Livraison », sous-onglet « BL Clients », bouton « Nouveau BL » en haut à droite.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° Commande | liste déroulante (les commandes en cours, affichées par n° d'affaire et client) | Oui | Choisissez la commande dont vous voulez livrer les pièces. Cela affiche ensuite la liste des lots à expédier. | AFF-2026-014 · Airbus |
| Lots à expédier (cochez + quantité à envoyer) | cases à cocher + nombre par lot | Oui | Cochez chaque lot que vous envoyez, puis tapez la quantité expédiée dans la case à droite du lot. Vous pouvez n'envoyer qu'une partie. Il faut au moins un lot coché avec une quantité. | Lot coché, quantité : 50 |
| Transporteur | liste déroulante (GLS, DHL, Chronopost, TNT, DPD, Geodis, Coursier, Propre véhicule) | Oui | Indiquez qui transporte le colis. « Propre véhicule » = livré par un véhicule de l'entreprise. | Chronopost |
| Prix transport (€ HT) | nombre | Non | Coût du transport hors taxes, si vous le connaissez. Laissez vide si gratuit ou inconnu. | 24.50 |
| Générer automatiquement la facture partielle (→ Facturation) | case à cocher | Non | Cochée par défaut : crée tout de suite la facture correspondant à ce qui est livré et l'envoie au service Facturation. Décochez si vous ne voulez pas facturer maintenant. | Cochée |
| Soumis à validation hiérarchique | case à cocher | Non | Si cochée, le paiement passe « en attente de validation Direction ». À utiliser quand la livraison doit être approuvée avant d'être facturée. | Décochée |

💡 **Astuce :** Cochez d'abord la commande : la liste des lots ne s'affiche qu'après. La quantité proposée pour chaque lot ne peut pas dépasser le reste à livrer.
⚠️ **Attention :** Sans commande choisie, sans transporteur, ou sans au moins un lot coché avec une quantité, le BL ne peut pas être créé.

## Nouveau BST — Envoi Sous-Traitant
**Quand l'utiliser :** Pour envoyer un lot de pièces chez un sous-traitant qui réalise une opération (traitement, peinture…) avant de le retourner.
**Où le trouver :** Onglet « Bons de Livraison », sous-onglet « BST Sous-Traitants », bouton « Nouveau BL » (choix BST) ou icône fiche dans la liste « À préparer ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Sous-traitant | liste déroulante (ST Anodisation Maurin, Serigraphie Rhone-Alpes, Zingage Express, Traitement Thermique Alpes) | Non | Choisissez l'entreprise qui va traiter les pièces. | Zingage Express |
| Lot concerne | texte | Non | Numéro du lot de pièces à envoyer. | LOT-2026-042 |
| Piece | texte | Non | Référence de la pièce concernée. | REF-8845 |
| Quantite | nombre | Non | Nombre de pièces envoyées. | 100 |
| Operation ST | liste déroulante (Oxydation anodique sulfurique, Serigraphie, Traitement thermique, Zingage, Peinture poudre) | Non | Le traitement demandé au sous-traitant. | Zingage |
| Date envoi prevue (Gantt) | date | Non | Jour prévu pour le départ des pièces (aligné sur le planning). | 2026-07-10 |
| Date retour prevue | date | Non | Jour où vous attendez le retour des pièces traitées. | 2026-07-17 |
| BC ST lie | texte | Non | Numéro du bon de commande sous-traitant associé, si vous en avez un. | BC-2026-089 |
| Observations | zone de texte | Non | Remarques ou consignes libres pour cet envoi. | Emballage soigné, pièces fragiles |

💡 **Astuce :** Ce bon prépare l'envoi ; il apparaîtra le jour prévu dans la liste « À préparer aujourd'hui ».

## Nouveau Bon de Commande (BC)
**Quand l'utiliser :** Pour enregistrer une commande auprès d'un fournisseur ou d'un sous-traitant. Formulaire de saisie directe (dans le flux normal, les BC viennent d'une Demande d'Achat).
**Où le trouver :** Ce formulaire n'a pas de bouton d'accès dans l'écran actuel : les bons de commande se créent depuis une Demande d'Achat (Service Achats). L'onglet « Bons de Commande » sert à réceptionner les commandes existantes, pas à en saisir de nouvelles ici.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (fournisseur, st) | Non | Précise si la commande va à un fournisseur (achat) ou à un sous-traitant (st = prestation). | fournisseur |
| Fournisseur / ST | texte | Non | Nom de l'entreprise à qui vous commandez. | Métaux du Rhône |
| DA liee (si four.) | texte | Non | Numéro de la Demande d'Achat d'origine, si la commande en découle. Optionnel. | DA-2026-031 |
| Articles commandes | zone de texte | Non | Liste des articles ou pièces commandés. | 200 kg alu 7075, 5 barres inox |
| Montant HT (EUR) | nombre | Non | Montant total hors taxes de la commande. | 3450 |
| Date livraison prevue | date | Non | Date à laquelle vous attendez la marchandise. | 2026-07-20 |
| Notes | zone de texte | Non | Remarques libres sur la commande. | Livraison à quai B avant 16h |

⚠️ **Attention :** Dans le fonctionnement normal, les BC se créent depuis une Demande d'Achat (Service Achats). Ce formulaire de saisie directe reste un complément.

## Réception — Lier le BC à un BL
**Quand l'utiliser :** À l'arrivée d'une commande fournisseur/ST, pour enregistrer la réception et générer le bon de livraison interne correspondant.
**Où le trouver :** Onglet « Bons de Commande », dans la liste « Commandes en attente de réception », bouton « Réceptionner » sur la ligne concernée.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° BL interne | texte | Non | Numéro de bon de livraison interne. Laissez vide pour un numéro automatique. | (vide = auto) |
| N° d'affaire | texte | Non | Numéro d'affaire à relier à cette réception (pré-rempli si connu). | AFF-2026-XXX |
| Transporteur | liste déroulante (GLS, DHL, Chronopost, TNT, DPD, Geodis, Coursier, Enlèvement direct) | Oui | Qui a livré la marchandise. « Enlèvement direct » = récupéré sur place. | Geodis |
| N° réf. livraison transporteur | texte | Non | Numéro de suivi ou du bon du transporteur. | Tracking 1Z999AA10 |
| Quantité reçue | nombre (décimales acceptées) | Non | Quantité effectivement reçue ; c'est elle qui entrera en stock au PV conforme. | 200 |

⚠️ **Attention :** Le transporteur est obligatoire ; sans lui, la réception ne peut pas être validée. Après validation, vous devez enchaîner avec le PV de contrôle. **Rien n'entre en stock à la réception** : le contenu n'entre en stock qu'au PV conforme.

## PV de contrôle à réception
**Quand l'utiliser :** Après avoir réceptionné une commande, pour attester du contrôle des pièces reçues (conforme ou anomalie) avant de les libérer en Qualité.
**Où le trouver :** Onglet « Réceptions », colonne « Contrôle » : bouton « PV à faire » sur la ligne de la réception concernée. Un seul PV par réception. Conforme : le contenu entre en stock. Non conforme : non-conformité + quarantaine, rien en stock.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Résultat du contrôle | case à cocher (choix unique : Conforme (OK) / Anomalie) | Oui | Cochez « Conforme » si tout est bon, « Anomalie » si un défaut est constaté. « Anomalie » fait apparaître les cases ci-dessous. | Conforme (OK) |
| Gravité NC | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Non (uniquement si Anomalie) | Niveau de gravité du défaut. « Majeure » proposé par défaut. | Majeure |
| Mettre le lot en quarantaine | case à cocher | Non (uniquement si Anomalie) | Cochée par défaut : isole le lot pour empêcher son utilisation tant que le problème n'est pas traité. | Cochée |
| Observations | zone de texte | Non | Détails du contrôle : constats, mesures, écarts relevés. | 3 pièces hors cote sur diamètre |
| Contrôleur | texte | Non | Nom de la personne qui a fait le contrôle. Pré-rempli avec « Expéditions ». | Sabine |

💡 **Astuce :** Si vous choisissez « Anomalie », une fiche de non-conformité (NC) est créée automatiquement et envoyée au service Qualité.
⚠️ **Attention :** Un contrôle marqué « Anomalie » peut bloquer le lot (quarantaine) et impacter la suite de la commande.

## Demande d'achat — Expeditions
**Quand l'utiliser :** Pour demander l'achat d'un article non rattaché à une commande (besoin libre) ; la demande part au service Achats.
**Où le trouver :** Bouton « Demande d'achat » en haut à droite de la bannière du service, dans tous les onglets.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article / Désignation | texte | Oui | Nom de l'article dont vous avez besoin. | Ruban adhésif de conditionnement |
| Type | liste déroulante (Matière, Outillage, Consommable, Chimique, EPI / Sécurité, Pièce détachée, Sous-traitance, Autre) | Non | Catégorie de l'achat. | Consommable |
| Quantité | texte | Non | Quantité souhaitée, avec l'unité. | 10 u |
| Fournisseur pressenti | recherche (liste) | Non | Nom d'un fournisseur suggéré, si vous en avez un en tête. | Emballage Pro |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | Degré d'urgence de la demande. | Normal |
| Livraison souhaitée | date | Non | Date à laquelle vous aimeriez recevoir l'article. | 2026-07-15 |
| Soumettre cette demande à la validation de la Direction (DA libre / investissement) | case à cocher | Non | À cocher si la demande doit être approuvée par la Direction avant traitement (achat libre ou investissement). | Décochée |

⚠️ **Attention :** Seule la désignation de l'article est obligatoire ; sans elle, la demande est refusée.
