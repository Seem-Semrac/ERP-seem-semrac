# Formulaires — Commercial · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouvelle Demande de travaux (DT)
**Quand l'utiliser :** Enregistrer une demande d'un client (nouveau produit, mise à jour de prix ou de produit) pour la transmettre au Bureau d'Études.
**Où le trouver :** Onglet « DT / Demandes » → bouton « Nouvelle DT ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Client | recherche (liste) | Oui | Tapez le nom pour retrouver le client existant. S'il n'existe pas, un bouton permet de le créer sur place. | Legrand |
| N° DT (auto) | texte | Non | Numéro attribué automatiquement, non modifiable. Laissez-le tel quel. | DT-2026-0148 |
| Activité | liste déroulante (SEEM, SEMRAC) | Oui | Choisissez le site concerné : SEEM (aluminium) ou SEMRAC (tôlerie). | SEEM |
| Type de DT | liste déroulante (Maj prix, Maj produit, Nouveau produit, Produit à jour) | Oui | Précisez la nature de la demande : nouveau prix, modification, création, ou pièce déjà à jour. | Nouveau produit |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | Indique l'urgence du traitement. Par défaut « Normal ». | Urgent |
| Date besoin client | date | Non | Date à laquelle le client souhaite être livré. | 15/09/2026 |

💡 **Astuce :** Un produit se remplit dans le bloc « Produit(s) concerné(s) » juste en dessous ; utilisez « Produit supplémentaire » pour en ajouter d'autres à la même DT.
⚠️ **Attention :** Sans Activité ni Type de DT, la création est refusée avec un message d'alerte.

## Produit d'une DT (bloc à remplir dans la DT)
**Quand l'utiliser :** Décrire chaque pièce concernée par la demande de travaux.
**Où le trouver :** Dans le formulaire « Nouvelle DT », section « Produit(s) concerné(s) ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réf. interne pièce | texte | Oui | Votre référence maison de la pièce. | SEEM-DISSIP-A24 |
| Nom du plan | texte | Non | Nom du fichier ou du plan de la pièce. | PLAN-DISSIP-A24-v3 |
| Réf. pièce client | texte | Non | Référence utilisée par le client pour cette pièce. | LGR-A-20485 |
| Quantité | nombre | Oui | Nombre de pièces concernées par la demande (au moins 1). C'est la quantité de référence. | 250 |
| Quantités supplémentaires à chiffrer | cases ajoutées à la main | Non | Si le client veut un prix pour **plusieurs quantités**, cliquez **« + Ajouter une quantité »** : une **case** apparaît par quantité (le **×** la retire). L'analyse BE donnera alors **exactement autant de lignes de prix que de cases** (quantité principale incluse). Aucune case = seule la quantité ci-dessus est chiffrée. | + 100 · + 500 |
| Plan — PDF ou STEP | fichier | Non | Joignez le plan de la pièce (fichiers .pdf, .step ou .stp). | dissip-a24.pdf |
| Exigences normatives applicables | cases à cocher (ISO 9001, EN 9100, REACH, RoHS, EN 13485) | Non | Cochez les normes que la pièce doit respecter. | EN 9100 |
| Oxydation anodique sulfurique | case à cocher | Non | Cochez si la pièce doit recevoir ce traitement de surface. | Cochée |
| Oxydation noire (en plus de l'anodisation) | case à cocher | Non | Apparaît si l'oxydation anodique est cochée ; précise un traitement noir complémentaire. | Cochée |

💡 **Astuce :** Une fois un fichier de plan choisi, son nom et sa taille s'affichent en vert pour confirmer le dépôt.

## Créer un client (formulaire rapide dans la DT)
**Quand l'utiliser :** Créer un client qui n'existe pas encore, sans quitter la saisie de la DT.
**Où le trouver :** Dans « Nouvelle DT », en cliquant pour ajouter un client quand la recherche ne trouve rien.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Raison sociale | texte | Oui | Nom officiel de l'entreprise cliente. | Legrand SA |
| SIRET | texte | Non | Numéro d'identification de l'entreprise (14 chiffres). | 123 456 789 00012 |
| Contact principal | texte | Oui | Nom et prénom de la personne référente. | Marie Dupont |
| Poste / Fonction | texte | Non | Rôle de la personne dans l'entreprise. | Responsable Achats |
| Email | texte | Oui | Adresse e-mail de contact. | contact@entreprise.fr |
| Téléphone | texte | Non | Numéro de téléphone du contact. | 01.23.45.67.89 |
| Adresse complète | texte | Non | Adresse postale sur une ligne. | 12 rue des Lilas, 75010 Paris |
| Mode de facturation | liste déroulante (Proforma, Au comptant, 30j net, 30j fin de mois, 45j net, 45j fin de mois, 60j net, 60j fin de mois) | Oui | Conditions de paiement appliquées par défaut aux factures de ce client. | 30j net |

💡 **Astuce :** Le mode de facturation choisi ici pourra être modifié plus tard dans la fiche client.

## Refuser une DT
**Quand l'utiliser :** Décliner une demande de travaux que l'on ne peut pas honorer.
**Où le trouver :** Onglet « DT / Demandes », action « Refuser » sur une ligne de DT.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Motif de refus | liste déroulante (Prix non compétitif, Capacité technique insuffisante, Délai incompatible, Pièce hors périmètre, Matière non disponible, Autre) | Oui | Raison principale du refus. | Délai incompatible |
| Détail | zone de texte | Non | Précisions libres sur le motif du refus. | Charge atelier saturée jusqu'à décembre. |

## Nouvelle Demande de travaux (version détaillée BE)
**Quand l'utiliser :** Saisir une demande de travaux complète avec les coordonnées du demandeur et l'identification détaillée de la pièce.
**Où le trouver :** Formulaire détaillé de création de DT (parcours Bureau d'Études).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° DT (auto) | texte | Non | Numéro généré automatiquement, non modifiable. | DT-2026-XXXX |
| Date réception | date | Oui | Date à laquelle la demande a été reçue. | 04/07/2026 |
| Activité | liste déroulante (Seem (aluminium), Semrac (tôlerie)) | Oui | Site concerné par la demande. | Seem (aluminium) |
| Nom Prénom (contact demandeur) | texte | Oui | Nom de la personne qui fait la demande. | Jean Martin |
| Poste | texte | Non | Fonction du demandeur. | Acheteur |
| Email | texte | Oui | E-mail du demandeur. | j.martin@client.fr |
| Téléphone | texte | Non | Téléphone du demandeur. | 06 12 34 56 78 |
| Société / Raison sociale | texte | Oui | Entreprise du demandeur. | Faurecia |
| Adresse | texte | Non | Adresse de l'entreprise. | ZI Nord, Besançon |
| Désignation interne | texte | Oui | Votre référence maison de la pièce. | SUPPORT-D4 |
| N° pièce client | texte | Non | Référence de la pièce chez le client. | FAU-556-B |
| N° plan | texte | Non | Numéro du plan associé. | PLAN-D4-v2 |
| Quantité demandée | nombre | Non | Nombre de pièces demandées. | 250 |
| Délai souhaité | date | Non | Date de livraison voulue par le client. | 30/10/2026 |
| Type de DT / Raison | liste déroulante (MAS — Produit existant nouveau prix, Nécessité, Nouveau Produit, Modification de code, Prototype, Urgence / Délai spécifique) | Oui | Nature précise de la demande. | Nouveau Produit |
| Priorité | liste déroulante (Standard, Urgent, Critique – livraison impérative) | Non | Niveau d'urgence. | Urgent |
| Notes internes / Commentaire BE | zone de texte | Non | Remarques internes non visibles par le client. | Vérifier la faisabilité de l'usinage. |

## Nouvelle offre commerciale
**Quand l'utiliser :** Établir un devis (offre) à envoyer au client, à partir d'une DT existante ou directement.
**Où le trouver :** Onglet « Offres », bouton « Nouvelle offre ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Origine de l'offre | choix exclusif (Depuis une DT / Offre directe) | Oui | Choisissez si l'offre part d'une DT existante ou d'un nouveau numéro. Une seule option à la fois. | Depuis une DT |
| N° DT associé | liste déroulante (les DT au statut « dans offres ») | Oui | DT servant de base à l'offre (mode « Depuis une DT »). | DT-2026-0148 |
| Client | liste déroulante (liste des clients) | Oui | Client concerné (mode « Offre directe »). | Legrand |
| Date validité offre | date | Non | Date jusqu'à laquelle l'offre reste valable. | 31/08/2026 |
| Pièce / Réf | texte | Non | Référence de la pièce chiffrée. | CARTER-B07 |
| Qté | nombre | Oui | Quantité proposée. | 100 |
| PRU HT (€) | nombre | Non | Prix de revient unitaire hors taxes. | 12.50 |
| Coeff. | nombre | Non | Coefficient appliqué pour obtenir le prix de vente. | 1.35 |
| Marge % | (calculé) | Non | Marge calculée automatiquement, non saisissable. | — |
| Frais transport (€) | nombre | Non | Coût de transport ajouté à l'offre. | 45 |
| Délai de livraison estimé | texte | Non | Délai annoncé au client. | 4 semaines |

💡 **Astuce :** Cliquez « Ajouter un produit » pour chiffrer plusieurs pièces dans la même offre. « Enregistrer brouillon » garde l'offre sans l'envoyer.
⚠️ **Attention :** Le numéro d'offre est le même que celui de la DT et de la future commande (un seul N° d'affaire).

## Modifier une offre (édition rapide)
**Quand l'utiliser :** Ajuster une offre déjà créée sans tout ressaisir.
**Où le trouver :** Onglet « Offres », action de modification sur une offre existante.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Montant HT (€) | nombre | Non | Montant total hors taxes de l'offre. | 3 250.00 |
| Marge (%) | nombre | Non | Pourcentage de marge de l'offre. | 28.5 |
| Validité | date | Non | Nouvelle date de fin de validité. | 30/09/2026 |

## Négocier une offre
**Quand l'utiliser :** Rouvrir une offre pour la renégocier avec le client.
**Où le trouver :** Onglet « Offres », action « Négocier » sur une offre.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Point à négocier | zone de texte | Non | Décrivez ce qui doit être revu (prix, délai…). | Réduire le délai de 4 à 3 semaines. |

## Rentrée de commande (validation d'une offre acceptée)
**Quand l'utiliser :** Transformer une offre acceptée par le client en commande ferme.
**Où le trouver :** Onglet « Offres », action « Rentrée de commande » sur une offre acceptée.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date de livraison confirmée | date | Non | Date de livraison retenue avec le client. | 20/10/2026 |
| N° BC Client | texte | Non | Numéro du bon de commande envoyé par le client. | BC-2026-778 |
| Commentaires / Conditions particulières | zone de texte | Non | Conditions spéciales de la commande. | Livraison en deux lots. |

💡 **Astuce :** Les informations de la DT et de l'offre sont déjà pré-remplies : vérifiez-les avant de valider.

## Nouvelle commande
**Quand l'utiliser :** Créer une commande à partir d'une offre acceptée.
**Où le trouver :** Onglet « Commandes », bouton « Nouvelle commande ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Offre acceptée | liste déroulante (liste des offres) | Oui | Offre validée qui donne naissance à la commande. | OFF-2026-0148 |
| Date livraison confirmée | date | Oui | Date de livraison convenue. | 20/10/2026 |
| N° BC client | texte | Non | Numéro du bon de commande du client. | BC-2026-778 |
| Statut initial | liste déroulante (À programmer, Attente réception matière, Attente retour prépa tech.) | Non | État de départ de la commande. | À programmer |

## Nouvel avoir
**Quand l'utiliser :** Créer un avoir (crédit) pour un client, par exemple une avance ou une réclamation.
**Où le trouver :** Onglet « Avoirs & Commandes P », sous-onglet Avoirs, bouton « Nouvel avoir ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Client | liste déroulante (liste des clients) | Oui | Client bénéficiaire de l'avoir. | Legrand |
| Type d'avoir | liste déroulante (Avance (Matière / Outil / Consignation), Réclamation (→ Service Qualité)) | Oui | Nature de l'avoir. Une réclamation est transmise à la Qualité. | Avance (Matière / Outil / Consignation) |
| Montant (€) | nombre | Oui | Montant de l'avoir. | 500.00 |
| Date de l'avoir | date | Oui | Date d'émission de l'avoir. | 04/07/2026 |
| Motif / Description | zone de texte | Oui | Explication du motif de l'avoir. | Avance sur matière commandée pour le client. |

## Nouveau / Modifier un client
**Quand l'utiliser :** Créer un client complet ou modifier ses informations d'identité et de facturation.
**Où le trouver :** Onglet « Clients », bouton « Nouveau client » (ou clic sur une ligne pour modifier).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Raison sociale | texte | Oui | Nom officiel de l'entreprise. | Legrand SA |
| SIRET | texte | Non | Numéro d'identification de l'entreprise. | 123 456 789 00012 |
| Mode facturation | liste déroulante (Virement 30j, Virement 45j, Virement 60j, Comptant, Traite 30j) | Non | Conditions de paiement par défaut. | Virement 30j |
| Contact | texte | Non | Nom du contact principal. | Marie Dupont |
| Poste | texte | Non | Fonction du contact. | Responsable Achats |
| Email | texte | Non | E-mail du contact. | contact@client.fr |
| Téléphone | texte | Non | Téléphone du contact. | 01 23 45 67 89 |
| Rue | texte | Non | Numéro et rue de l'adresse postale. | 12 rue des Lilas |
| Code postal | texte | Non | Code postal. | 75010 |
| Ville | texte | Non | Ville. | Paris |
| Adresse de facturation différente | case à cocher | Non | Cochez si les factures partent à une autre adresse que l'adresse principale. | Cochée |
| Rue (facturation) | texte | Non | Rue de l'adresse de facturation (si différente). | 5 avenue Centrale |
| Code postal (facturation) | texte | Non | Code postal de facturation. | 69002 |
| Ville (facturation) | texte | Non | Ville de facturation. | Lyon |

💡 **Astuce :** Le bloc d'adresse de facturation n'apparaît que si vous cochez « Adresse de facturation différente ».

## Interlocuteur client
**Quand l'utiliser :** Ajouter ou modifier une personne de contact chez un client.
**Où le trouver :** Fiche client (clic sur un client dans la liste) → encart « Interlocuteurs » → bouton « Ajouter ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom | texte | Oui | Nom et prénom de l'interlocuteur. | Marie Dupont |
| Fonction | texte | Non | Rôle de la personne dans l'entreprise. | Responsable Achats |
| Email | texte | Non | Adresse e-mail de la personne. | m.dupont@client.fr |
| Téléphone | texte | Non | Numéro de téléphone. | 06 12 34 56 78 |
| Interlocuteur principal | case à cocher | Non | Cochez pour désigner le contact référent du client. | Cochée |

💡 **Astuce :** L'identité de l'entreprise se modifie depuis la liste des clients ; cette fiche sert uniquement à gérer plusieurs interlocuteurs.
