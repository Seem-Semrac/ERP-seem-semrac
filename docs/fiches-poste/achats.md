# Fiche de poste — Acheteur(se)

> Rôle ERP : `achats`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Consulter les fournisseurs, passer les commandes, tenir le référentiel fournisseurs.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | achats, stock |
| **Lecture** | commercial, be, production, expéditions, maintenance |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Lancer une demande de prix (RFQ)
1. Achats › **Demandes de prix**, « Nouvelle RFQ ».
2. Fournisseur(s) + articles.
3. Saisir les prix reçus → alimente le catalogue.

![achats-rfq](../assets/achats-rfq.png)

### 2. Suivre les avoirs fournisseurs
1. Achats › **Avoirs fournisseurs** : ce que fournisseurs et sous-traitants nous doivent (à ne pas confondre avec les avoirs clients, service Commercial).
2. Un avoir arrive tout seul quand la Qualité renvoie un lot, le met au rebut ou obtient une réfaction ; « Nouvel avoir » pour en saisir un à la main.
3. Quand l'avoir du fournisseur arrive : **Reçu** (son n°, sa date, le montant réellement accordé). Quand on s'en sert : **Imputer** (montant + n° de facture).
4. Un avoir ne se supprime pas : il s'annule, avec un motif, tant qu'il n'a pas servi.

![achats-avoirs](../assets/achats-avoirs.png)

### 3. Transformer une DA en BC
1. Onglet **Demandes d'achat**, sélectionner la DA.
2. Générer le bon de commande fournisseur.
3. Si le fournisseur doit joindre un certificat matière : cocher **Certificat matière requis** (jamais cochée d'avance).

![achats-da](../assets/achats-da.png)

### 4. Dater un bon de commande de reliquat
1. Achats › **Bons de commande** : un BC **`…-R1`** avec la pastille « Reliquat de BC-… · date à valider » est né d'un PV de réception (le fournisseur a annoncé un reliquat) — montant 0 € (porté par le BC d'origine), sans date d'arrivée.
2. Demander la date au fournisseur, puis **Date d'arrivée** : le reliquat est validé et rejoint le calendrier des Expéditions.
3. Tant qu'il n'est pas daté, personne ne l'attend (absent du calendrier).

![achats-bc](../assets/achats-bc.png)

### 5. Exiger un certificat matière sur un BC
1. Achats › **Bons de commande**, colonne **Certificat matière** : **Exiger** ou **Retirer**, puis confirmer.
2. BC déjà envoyé : rééditer son PDF (la mention y est imprimée) et le renvoyer au fournisseur.
3. À la réception, le contrôleur confirme le certificat : sans lui, pas de PV conforme. Verrouillé (cadenas « PV conforme ») dès qu'un PV de réception conforme est signé.

![achats-bc](../assets/achats-bc.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
