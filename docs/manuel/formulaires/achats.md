# Formulaires — Achats · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Traiter une demande d'achat → Bon de commande
**Quand l'utiliser :** Quand une demande d'achat (DA) arrive et qu'il faut la transformer en commande à passer à un fournisseur ou un sous-traitant.
**Où le trouver :** Onglet « Demandes d'achat », colonne Action, bouton « Traiter → BC » (ou « Reprendre » si un brouillon existe) sur la ligne de la DA.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type de commande | liste déroulante (BC Fournisseur, BC Sous-Traitant) | Non | Indique si l'on commande une fourniture (fournisseur) ou une prestation à façon (sous-traitant). | BC Fournisseur |
| Fournisseur / ST | texte | Oui | Le nom de l'entreprise à qui vous passez la commande. | Aluminium de France |
| Référence du matériel | texte avec liste de choix (catalogue fournisseur) | Non | **La référence du produit à commander.** Choisissez-la dans la liste : le champ *Fournisseur / ST* ne proposera alors en tête que les fournisseurs qui portent cette référence au catalogue. Si l'ERP a pu la retrouver depuis la désignation de la demande, elle est pré-remplie et signalée « déduite — à vérifier ». | 125237 |
| Articles / Prestation | texte | Non | La désignation de ce qui est commandé. Se pré-remplit avec l'article de la DA, ou avec la désignation du catalogue si vous choisissez une référence et que le champ est vide. | Tôle alu 2017 ép. 5 mm |
| Montant HT (€) | nombre | Non | Le montant total hors taxes de la commande. | 1250.00 |
| Livraison prévue | date | Non | La date à laquelle vous attendez la marchandise. | 2026-07-20 |
| N° d'affaire (optionnel) | texte | Non | Le numéro de l'affaire / du chantier à rattacher, si la commande concerne une commande client précise. | AFF-2026-018 |
| Notes | zone de texte | Non | Remarques ou conditions particulières à joindre à la commande. | Livraison sur palette consignée |

💡 **Astuce :** Le bouton « Enregistrer (brouillon) » met la DA de côté sans créer le BC : vous pourrez la reprendre plus tard.
⚠️ **Attention :** Le bouton « Soumettre → créer BC » refuse de valider si le fournisseur / sous-traitant est vide. Une fois créé, le BC part côté Expéditions.

## Nouveau bon de commande (création directe)
**Quand l'utiliser :** Pour passer une commande directement, sans passer par une demande d'achat préalable.
**Où le trouver :** Onglet « Demandes d'achat », bouton « Créer un BC » (aussi accessible depuis le Dashboard achats, accès rapide « Créer un BC »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Destinataire | liste déroulante (Fournisseur, Sous-traitant) | Non | Indique si la commande va à un fournisseur (fourniture) ou à un sous-traitant (prestation). | Fournisseur |
| Fournisseur / sous-traitant | texte | Oui | Le nom de l'entreprise destinataire de la commande. | Vis & Boulons SARL |
| Articles / désignation | texte | Oui | Ce qui est commandé, en clair. Si vous remplissez plutôt les lignes détaillées ci-dessous, ce champ se complète tout seul. | Visserie inox M6 |
| Quantité | texte | Non | La quantité globale commandée (texte libre, avec l'unité). | 500 vis |
| Montant HT (€) | nombre | Non | Le total hors taxes. Se calcule automatiquement si vous saisissez les lignes détaillées. | 340.00 |
| Livraison prévue | date | Non | La date de livraison attendue. | 2026-07-15 |
| N° d'affaire (option) | texte | Non | Le numéro d'affaire à rattacher, si concerné. | AFF-2026-018 |
| Notes | texte | Non | Remarques libres. | Urgent |
| Ligne — Référence | texte | Non | La référence article de la ligne détaillée. Il faut une référence pour que la ligne soit prise en compte. | REF-VIS-M6 |
| Ligne — Désignation | texte | Non | Le libellé de l'article de la ligne. | Vis inox M6x20 |
| Ligne — Catégorie | liste déroulante (Matière, Accessoires, Outils, Chimique, Consommable, Autres) | Non | La famille du produit commandé. | Accessoires |
| Ligne — Qté | nombre | Non | La quantité de cette ligne (sert au calcul du montant). | 500 |
| Ligne — PU € | nombre | Non | Le prix unitaire hors taxes de cette ligne. | 0.68 |
| Soumettre ce BC à la validation de la Direction | case à cocher | Non | À cocher pour un achat stratégique ou un gros montant : la Direction devra valider la commande. | cochée |

💡 **Astuce :** Ajoutez des lignes avec « Ajouter une ligne » : le Montant HT se met à jour automatiquement (Qté × PU additionnés).
⚠️ **Attention :** Le prix officiel d'un fournisseur ne se met **jamais** à jour via un bon de commande — seulement via une demande de prix (RFQ) validée. Une ligne sans référence est ignorée.

## Nouveau fournisseur
**Quand l'utiliser :** Pour enregistrer une nouvelle entreprise qui vous vend de la matière, des consommables ou des fournitures.
**Où le trouver :** Onglet « Fournisseurs / ST », vue « Fournisseurs » active, bouton « Nouveau fournisseur ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Raison sociale | texte | Oui | Le nom officiel de l'entreprise fournisseur. | Aluminium de France |
| Code | texte | Non | Un code court interne pour retrouver le fournisseur. | FOUR-012 |
| SIRET | texte | Non | Le numéro d'identification de l'entreprise. | 123 456 789 00012 |
| Contact | texte | Non | Le nom de la personne à qui s'adresser. | M. Durand |
| Email | texte (email) | Non | L'adresse email de contact. | contact@alu-france.fr |
| Téléphone | texte | Non | Le numéro de téléphone. | 01 23 45 67 89 |
| Délai moyen (j) | nombre | Non | Le nombre de jours habituels entre commande et livraison. | 7 |
| Familles de fourniture | liste (ajout libre, plusieurs possibles) | Non | Les types de produits que fournit cette entreprise. Choisissez dans la liste (Aluminium, Acier, Inox, Visserie / Boulonnerie, Outillage, Consommables, Produits chimiques, Emballage…) ou saisissez la vôtre, puis « + ». | Aluminium, Inox |
| Conditions de paiement | texte | Non | Le délai et le mode de paiement convenus. | Virement 30 j |
| Adresse | texte | Non | L'adresse postale du fournisseur. | 12 rue de l'Industrie, Lyon |

💡 **Astuce :** Pour les familles de fourniture, tapez dans la case puis appuyez sur Entrée (ou la virgule) pour ajouter chaque étiquette. Cliquez la croix sur une étiquette pour la retirer.
⚠️ **Attention :** Sans raison sociale, la création est refusée.

## Nouveau sous-traitant
**Quand l'utiliser :** Pour enregistrer une entreprise qui réalise une prestation à façon (traitement de surface, usinage, soudure…).
**Où le trouver :** Onglet « Fournisseurs / ST », vue « Sous-traitants » active, bouton « Nouveau sous-traitant ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Raison sociale | texte | Oui | Le nom officiel de l'entreprise sous-traitante. | Traitements Sud SAS |
| Code | texte | Non | Un code court interne pour retrouver le sous-traitant. | ST-005 |
| SIRET | texte | Non | Le numéro d'identification de l'entreprise. | 987 654 321 00021 |
| Contact | texte | Non | Le nom de la personne à contacter. | Mme Martin |
| Email | texte (email) | Non | L'adresse email de contact. | contact@traitements-sud.fr |
| Téléphone | texte | Non | Le numéro de téléphone. | 04 56 78 90 12 |
| Prestations de sous-traitance | liste (ajout libre, plusieurs possibles) | Non | Les opérations que réalise ce sous-traitant. Choisissez dans la liste (Oxydation anodique sulfurique, Zingage, Nickelage, Chromage dur, Peinture poudre, Traitement thermique, Passivation, Découpe jet d'eau, Rectification…) ou saisissez la vôtre, puis « + ». | Oxydation anodique sulfurique, Passivation |
| Certifications (séparées par virgule) | texte | Non | Les certifications qualité du sous-traitant, séparées par des virgules. | ISO 9001, EN 9100 |
| Délai moyen (j) | nombre | Non | Le délai habituel de la prestation, en jours. | 10 |
| Adresse | texte | Non | L'adresse postale du sous-traitant. | 5 zone Artisanale, Marseille |

💡 **Astuce :** Comme pour les familles fournisseur, ajoutez chaque prestation avec Entrée ou « + » ; la croix retire une étiquette.
⚠️ **Attention :** Sans raison sociale, la création est refusée.

## Traiter une demande de prix (RFQ)
**Quand l'utiliser :** Pour saisir les prix reçus des fournisseurs consultés et choisir l'offre retenue. Valider met à jour le **prix officiel** du fournisseur.
**Où le trouver :** Onglet « Demandes de prix », bouton « Traiter » sur la ligne de la demande.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Fournisseur (par ligne de réponse) | liste déroulante (liste des fournisseurs en base) | Non | Le fournisseur qui a répondu pour cette ligne. Pour une réponse déjà rattachée, le nom est fixe. | Aluminium de France |
| Prix unit. | nombre | Non | Le prix unitaire hors taxes proposé par ce fournisseur. | 12.50 |
| Délai (j) | nombre | Non | Le délai de livraison annoncé, en jours. | 8 |
| Retenu | case à cocher (un seul par ligne) | Non | Cochez la réponse choisie pour cette ligne. C'est ce prix qui deviendra le prix officiel à la validation. | cochée |

💡 **Astuce :** « Ajouter un fournisseur » ajoute une ligne de réponse pour comparer plusieurs offres sur la même référence. « Marquer envoyée » sert à noter que la consultation est partie.
⚠️ **Attention :** « Valider & mettre à jour les prix » exige au moins un prix « retenu » avec un prix saisi, sinon la validation est refusée. Après validation, la RFQ est clôturée et le prix officiel du fournisseur est mis à jour.

## Fiche fournisseur / sous-traitant — Identité & paramètres
**Quand l'utiliser :** Pour compléter ou modifier les informations détaillées d'un fournisseur ou d'un sous-traitant existant.
**Où le trouver :** Onglet « Fournisseurs / ST », colonne Fiche, bouton « Fiche » sur la ligne. Bloc « Identité & paramètres » en haut de la fiche.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom | texte | Oui | Le nom de l'entreprise. | Aluminium de France |
| Catégorie (liste créable) | recherche (liste) | Oui | La grande famille du fournisseur / sous-traitant. Choisissez dans la liste proposée (Matière première, Visserie / Boulonnerie, Outillage, Consommables, Produits chimiques… pour un fournisseur ; Finition / Traitement surface, Mécanique générale, Soudure, Découpe laser / eau… pour un sous-traitant) ou saisissez la vôtre. | Matière première |
| Catégories fournies | cases à cocher (Matière, Accessoires, Outils, Produits chimiques, Consommable, Autres) | Non | *(Fournisseur seulement)* Les compartiments où ce fournisseur apparaît dans les nomenclatures / achats. | Matière, Accessoires |
| Activité — visibilité nomenclatures | liste déroulante (Seem, Semrac, Seem & Semrac) | Oui | Détermine dans quelles nomenclatures (Seem et/ou Semrac) apparaissent les références de ce fournisseur. | Seem & Semrac |
| Contact principal | texte | Non | Le nom de l'interlocuteur habituel. | M. Durand |
| Email | texte (email) | Non | L'adresse email de contact. | contact@alu-france.fr |
| Téléphone | texte | Non | Le numéro de téléphone. | 01 23 45 67 89 |
| Localisation / adresse | texte | Non | L'adresse ou la ville du fournisseur. | Lyon |
| Délai moyen (jours) | nombre | Non | Le délai habituel de livraison, en jours. | 7 |
| Mode de règlement | recherche (liste) | Non | Comment vous payez ce fournisseur. Choisissez (Virement, Chèque, Prélèvement, Traite / LCR, Carte bancaire, Espèces) ou saisissez le vôtre. | Virement |
| Conditions de paiement | recherche (liste) | Non | Le délai de paiement. Choisissez (Comptant, À réception, 30 jours, 30 jours fin de mois, 45 jours fin de mois, 60 jours, Paiement à la commande (proforma)) ou saisissez le vôtre. | 30 jours fin de mois |
| Conditions / instructions standards | zone de texte | Non | Notes libres sur les conditions habituelles (minimum de commande, port, palettes, normes…). | Franco à partir de 250 € HT |
| Qualification / certifications | texte | Non | Les certifications qualité, séparées par des virgules. | ISO 9001, EN 9100 |
| Méthode de calcul OTD | liste déroulante (Émission BC → réception BL, Paiement proforma → réception BL) | Non | Comment mesurer la ponctualité de livraison du fournisseur. | Émission BC → réception BL |
| Scoring qualité | nombre (0 à 100) | Non | Une note qualité que vous attribuez manuellement au fournisseur. | 85 |

💡 **Astuce :** L'indicateur « OTD — ponctualité (calculé) » est affiché automatiquement à partir des réceptions ; vous ne le saisissez pas.
⚠️ **Attention :** Nom, Catégorie et Activité portent une étoile (*) : ce sont les repères indispensables. Cliquez « Enregistrer la fiche » pour sauvegarder.

## Fiche fournisseur — Catalogue produits (politique de prix)
**Quand l'utiliser :** Pour lister les références que ce fournisseur vous fournit et leur politique de prix (matière, accessoires).
**Où le trouver :** Fiche fournisseur, bloc « Catalogue produits — politique de prix », bouton « Ajouter une référence » (une ligne = une référence).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réf. | texte | Non | La référence article chez ce fournisseur. | REF-ALU-2017 |
| Désignation | texte | Non | Le libellé du produit. | Tôle alu 2017 ép. 5 mm |
| Catégorie | liste déroulante (—, Matière, Accessoire) | Non | Le type de produit : matière (prix de la tôle) ou accessoire (prix du paquet). | Matière |
| Unité | texte | Non | L'unité de vente. | kg |
| Prix tôle/paquet | nombre | Non | Le prix de la tôle (matière) ou du paquet (accessoire). | 42.00 |
| Quantité unitaire | nombre | Non | Le nombre de pièces par conditionnement / paquet. | 100 |
| Mini cde HT | nombre | Non | Le montant minimum de commande hors taxes exigé par le fournisseur. | 250.00 |
| Délai (j) | nombre | Non | Le délai de livraison de cette référence, en jours. | 7 |
| Notes / conditions | texte | Non | Conditions particulières (MOQ, palette…). | Palette non reprise |

💡 **Astuce :** Une ligne n'est enregistrée que si elle a au moins une référence ou une désignation. Ces références alimentent les nomenclatures du BE.
⚠️ **Attention :** Pensez à cliquer « Enregistrer la fiche » en haut : les lignes ajoutées ne sont pas sauvegardées tant que la fiche n'est pas enregistrée.

## Fiche fournisseur — Références fournies (déclaration rapide)
**Quand l'utiliser :** Pour déclarer rapidement une référence que le fournisseur peut fournir, même sans connaître encore le prix.
**Où le trouver :** Fiche fournisseur, bloc « Références fournies », barre de saisie en haut du tableau, bouton « Déclarer ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Référence | texte | Oui | La référence article. | REF-JOINT-12 |
| Désignation | texte | Oui | Le libellé de la référence. | Joint torique Ø12 |
| Catégorie | liste déroulante (Matière, Accessoires, Outils, Chimique, Consommable, Autres) | Non | La famille du produit. | Accessoires |
| Prix (optionnel) | nombre | Non | Le prix, si connu. Sinon laissez vide : il se remplira via une demande de prix. | 0.35 |
| Délai (j) | nombre | Non | Le délai de livraison, en jours. | 5 |

💡 **Astuce :** Référence + désignation suffisent ; le prix officiel se renseigne ensuite via une demande de prix (RFQ), pas ici.
⚠️ **Attention :** Sans référence ET désignation, la déclaration est refusée. Ce bloc n'existe que pour les fournisseurs (pas pour les sous-traitants).

## Fiche sous-traitant — Opérations sous-traitées (forfait & prix unitaire)
**Quand l'utiliser :** Pour saisir les tarifs d'un sous-traitant, opération par opération (forfait minimum et prix par pièce).
**Où le trouver :** Fiche sous-traitant, bloc « Opérations sous-traitées — forfait & prix unitaire/pièce », bouton « Ajouter une opération » (une ligne = une opération).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Opération | recherche (liste) | Non | Le nom de l'opération sous-traitée. Choisissez parmi les opérations déjà connues ou saisissez-en une. | Anodisation dure |
| Forfait min. HT (€) | nombre | Non | Le montant minimum facturé par le sous-traitant, quelle que soit la quantité. | 80.00 |
| Prix unitaire HT (€/pc) | nombre | Non | Le prix par pièce hors taxes. | 1.2500 |

💡 **Astuce :** Le coût réel d'une commande est calculé comme le plus grand des deux : le forfait minimum, ou (quantité × prix unitaire). Ces tarifs alimentent les étapes sous-traitées des nomenclatures.
⚠️ **Attention :** Une ligne n'est enregistrée que si l'opération est renseignée. Cliquez « Enregistrer la fiche » en haut pour sauvegarder.
