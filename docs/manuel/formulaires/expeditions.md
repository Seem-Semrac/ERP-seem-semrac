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
**Quand l'utiliser :** À l'arrivée d'une commande fournisseur ou sous-traitant, pour enregistrer la réception et créer le bon de livraison interne correspondant.
**Où le trouver :** Onglet « Calendrier », bloc « à réceptionner aujourd'hui » (ou la frise), bouton « Traiter » sur la ligne du bon de commande. Réservé aux personnes ayant l'**écriture sur les Expéditions** (Direction, rôle Logistique, case « Écrire » des Expéditions cochée sur la fiche salarié).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° BL interne | texte (repris du BC, verrouillé quand connu) | Non | Numéro du bon de livraison interne, déduit du bon de commande. Laissez vide s'il n'est pas proposé : un numéro est attribué automatiquement. | BL-2026-0142 |
| N° d'affaire | texte (repris du BC, verrouillé quand connu) | Non | Affaire rattachée au bon de commande. | AFF-2026-014 |
| N° de commande fournisseur | texte (100 caractères max) | Oui | Le numéro de **votre commande chez le fournisseur**, tel qu'il figure sur ses papiers (confirmation de commande, BL). | CF-88412 |
| N° de BL fournisseur | texte (100 caractères max) | Oui | Le numéro du **bon de livraison du fournisseur** joint au colis. Il remplace l'ancienne « référence livraison transporteur ». | BL 2026/5531 |
| Quantité livrée | nombre (virgule acceptée) | Oui si le BC (à un article) n'a pas de quantité exploitable ; facultative pour un BC à plusieurs articles | Lue sur le BL fournisseur. Dans les autres cas, ce champ n'apparaît pas : la quantité attendue est le **reste à recevoir** du BC, affiché dans le bandeau vert. ⚠ La case « Livraison partielle » a été retirée le 15/09/2026 : le reliquat se déclare au PV. | 40 |
| Réception hors France ? | choix Oui / Non | Oui | La marchandise vient-elle de l'étranger ? « Oui » fait apparaître les quatre champs ci-dessous. | Non |
| Poids matière (kg) | nombre (> 0 ; « 1 250,5 » accepté) | Oui si hors France | Poids de la matière reçue, en kilogrammes. | 125,5 |
| N° de nomenclature (douane) | texte (100 caractères max) | Oui si hors France | Le **code de nomenclature douanière** du produit importé (indiqué sur la facture ou les documents de transport). | 7606 12 99 |
| Code EWX | liste déroulante (1, 2) | Oui si hors France | Code EWX de la réception : 1 ou 2. | 1 |
| Mode d'arrivée | liste déroulante (Routier, Maritime, Aérien, Ferroviaire, Messagerie / express) | Oui si hors France | Par quel moyen la marchandise est arrivée. | Routier |

💡 **Astuce :** Lisez le bandeau sous les numéros : il annonce la **quantité attendue** (reste à recevoir). La quantité réellement reçue, un écart ou un reliquat annoncé par le fournisseur se saisissent au **PV de contrôle**, ligne par ligne.
⚠️ **Attention :** Le transporteur et la quantité reçue ne se saisissent plus. S'il manque un champ obligatoire, il s'encadre en rouge et la réception n'est pas envoyée. Un bon de commande **annulé** ou **déjà entièrement reçu** est refusé. **Rien n'entre en stock à la réception** : les quantités conformes du PV partent dans Stock › Mise en stock, et le stock est crédité au rangement.

## Réception — Corriger les informations
**Quand l'utiliser :** Pour rectifier une faute de frappe sur une réception déjà enregistrée (N° fournisseur, code douanier, poids…).
**Où le trouver :** Onglet « Réceptions », lien « Corriger » sous les articles de la réception fournisseur (visible seulement avec l'écriture Expéditions).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° de commande fournisseur | texte | Oui | Pré-rempli avec la valeur enregistrée. | CF-88412 |
| N° de BL fournisseur | texte | Oui | Pré-rempli avec la valeur enregistrée. | BL 2026/5531 |
| Réception hors France ? | choix Oui / Non | Oui | Passer à « Non » efface poids, nomenclature, code EWX et mode d'arrivée. | Oui |
| Poids matière (kg) · N° de nomenclature (douane) · Code EWX · Mode d'arrivée | comme à la réception | Oui si hors France | Mêmes règles qu'à la réception. | 1 250,5 · 7606 12 99 · 2 · Maritime |

⚠️ **Attention :** Seules ces informations se corrigent : ni la quantité, ni le contrôle, ni le stock. Un PV déjà signé garde les informations telles qu'elles étaient au moment du contrôle.

## PV de contrôle à réception
**Quand l'utiliser :** Après avoir réceptionné une commande, pour attester du contrôle des pièces reçues, ligne par ligne, avec la quantité reçue. Les quantités conformes partent dans Stock › Mise en stock ; une ligne en écart crée une non-conformité fournisseur ; une ligne avec observation part en quarantaine ; un excédent va à la Direction ; un reliquat annoncé crée un bon de commande de reliquat.
**Où le trouver :** Onglet « Réceptions », colonne « Contrôle » : bouton « PV à faire » sur la ligne de la réception. Un seul PV par réception. Bouton grisé avec un cadenas pour qui n'a pas l'écriture sur les Expéditions.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Résultat du contrôle | choix unique (Conforme / Non conforme), rien de coché d'avance | Oui | « Conforme » si toutes les lignes sont à « Oui » ; « Non conforme » s'il y a au moins une ligne en écart (ou le certificat absent) — il ajoute l'en-tête du bon de commande, l'observation générale et la gravité. | Conforme |
| Contrôleur | liste déroulante (salariés actifs ayant l'écriture sur les Expéditions) | Oui | La personne qui a fait le contrôle. Si vous êtes dans la liste, vous êtes pré-sélectionné. Le serveur revérifie : un nom hors de la liste est refusé. | DUPONT Marie |
| Certificat matière reçu et conforme | case à cocher (encadré violet) | Visible seulement si le BC exige un certificat ; **obligatoire pour un PV conforme** | Cochez-la si le certificat matière est arrivé avec la livraison et qu'il est conforme. Sans elle, le PV bascule en « Non conforme » et la NC porte « Certificat matière absent ou non conforme ». | cochée |
| Ligne — Qté prévue | lecture | — | Ce qui était attendu sur cette réception (quantité du BL, ou quantité commandée de la ligne pour un BC à plusieurs articles). « inconnue » : pas de comparaison possible. | 10 pce |
| Ligne — Qté reçue | nombre (virgule acceptée, ≥ 0), pré-rempli avec la prévue | Oui, pour chaque ligne (Conforme comme Non conforme) | Ce que vous avez réellement compté. 0 si rien n'est arrivé. Moins que prévu sans reliquat, ou plus que prévu : la ligne est non conforme (quantitatif). | 8 |
| Ligne — Reliquat annoncé | case à cocher (visible seulement si reçu < prévu) | Non | Cochez-la si le **fournisseur annonce** qu'il livrera le reste : ce n'est pas un écart, un bon de commande de reliquat est créé aux Achats pour le restant. | cochée |
| Ligne — Conforme ? | lecture, calculé | — | « Oui », « Non · quantitatif », « Non · qualitatif » ou les deux, avec le détail (manque, reliquat, excédent soumis à la Direction, quarantaine). Le bouton « Tout reçu comme prévu » remet toutes les quantités à la prévue. | Non · quantitatif |
| Ligne — Observation | zone de texte (1 000 caractères max) | Non | Un défaut constaté sur la ligne (pièces abîmées, mauvaise nuance…). Une observation rend la ligne **non conforme (qualitatif)** et l'envoie en quarantaine. | Rayures sur 2 pièces |
| Observation générale | zone de texte (4 000 caractères max) | Non | Constat d'ensemble sur la réception, en bas de la fenêtre. | Emballage humide à l'arrivée |
| Gravité de la non-conformité | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Non (Majeure par défaut) | Niveau de gravité de la NC créée. | Majeure |

💡 **Astuce :** En non conforme, la fenêtre affiche aussi **l'en-tête du bon de commande** : n° BC, fournisseur, date, livraison prévue, affaire(s), montant HT, conditions de paiement, notes, lien vers le PDF. Un BC sans lignes détaillées affiche une ligne reconstituée, marquée « * ». La notification finale résume les effets (lignes en Mise en stock, NC, quarantaines, excédents, BC de reliquat).
⚠️ **Attention :** Un PV **conforme** avec une ligne en écart est refusé (« passez en Non conforme ») ; un **non conforme** demande au moins une ligne en écart, ou un certificat exigé non confirmé. Une **NC fournisseur par ligne** en écart part en Qualité (détecteur « Réception »). Si le bon de commande, la réception ou l'exigence de certificat ont changé pendant que la page était ouverte (« la quantité prévue a changé »), le PV est refusé : rechargez la page — rien n'a été enregistré.

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
