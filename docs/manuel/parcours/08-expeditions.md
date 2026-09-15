# 08 · Expéditions — parcours guidé

> Comment ça marche **étape par étape** : ce qui arrive **avant**, ce que **vous remplissez ici** (et pourquoi), et **où ça part ensuite**. Écrit pour un nouvel utilisateur.

## En bref — le rôle du service dans la chaîne

Le service **Expéditions** est le dernier maillon avant le client. En entrée, il reçoit des **commandes dont les pièces sont produites** (lots terminés à l'atelier, prêts à partir). Son travail : **faire sortir la marchandise** — soit vers le **client** (bon de livraison), soit vers un **sous-traitant** pour une opération à réaliser (bon de sous-traitance), soit **réceptionner** ce qui arrive des fournisseurs. À la sortie, chaque livraison client génère une **facture** (envoyée à la Facturation) et une **écriture de vente** (Compta), et le suivi **OTD** (livré à l'heure) alimente le tableau de bord. Une **porte qualité** peut bloquer une expédition si un lot est non conforme.

![Vue d'ensemble du service Expéditions : onglets Bons de Commande, Bons de Livraison, Commandes en cours, Dashboard](../../assets/expeditions.png)

Les onglets à connaître :
- **Bons de Livraison** — créer les BL clients (partiels possibles) et les BST sous-traitants.
- **Calendrier** puis **Réceptions** — réceptionner ce qui arrive des fournisseurs/ST (Calendrier › « Traiter »), puis faire le PV de contrôle (Réceptions › « PV à faire »).
- **Commandes en cours** — voir ce qu'il reste à livrer.
- **Dashboard** — le suivi OTD (livraison à l'heure).

## Étape 1 — Livrer un client (Bon de Livraison)
**⬅️ Avant :** À l'atelier, un ou plusieurs **lots ont été produits** pour une commande. Ils sont terminés et prêts à partir. La commande apparaît dans « Commandes en cours » avec un reste à livrer.
**📝 Ici, vous :** créez le **BL client** — vous déclarez quels lots partent, en quelle quantité, et par quel transporteur.

![Formulaire Nouveau BL Client : choix de la commande, lots à expédier, transporteur, options facture](../../assets/form-expeditions-bl.png)

Sur cet écran, vous renseignez :
- **N° Commande** — choisissez d'abord la commande à livrer (affichée par n° d'affaire et client). C'est **elle qui fait apparaître la liste des lots** à expédier.
- **Lots à expédier (+ quantité)** — cochez chaque lot qui part et tapez la **quantité envoyée**. Vous pouvez n'envoyer qu'une partie : c'est un **BL partiel** (le reste partira plus tard). La quantité ne peut pas dépasser le reste à livrer.
- **Transporteur** — qui emporte le colis (Chronopost, GLS… ou « Propre véhicule » pour un véhicule de l'entreprise). Obligatoire : sans transporteur, pas de BL.
- **Prix transport (€ HT)** — le coût du port si vous le connaissez ; sinon laissez vide.
- **Générer automatiquement la facture partielle** — cochée par défaut : la facture correspondant à ce qui est livré part **tout de suite** vers la Facturation. Décochez si vous ne voulez pas facturer maintenant.
- **Soumis à validation hiérarchique** — à cocher si la livraison doit être **approuvée par la Direction** avant d'être facturée (le paiement passe « en attente de validation »).

**➡️ Ensuite :** le BL est créé et la marchandise part. Si la case était cochée, une **facture partielle** est générée pour la Facturation et l'**écriture de vente** part en Compta. Le reste à livrer de la commande est mis à jour. Le tout alimente le suivi **OTD** du Dashboard.
⚠️ **Porte qualité :** si un lot est en **quarantaine** ou porte une **NC bloquante**, le BL est **refusé**. Il faut d'abord faire traiter la non-conformité côté Qualité, puis revenir créer le BL.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/expeditions.md).

## Étape 2 — Envoyer chez un sous-traitant (BST)
**⬅️ Avant :** Une opération (traitement, anodisation, peinture, zingage…) ne se fait pas en interne. Un lot doit **partir chez un sous-traitant** puis revenir traité avant de poursuivre sa gamme.
**📝 Ici, vous :** créez un **BST** (bon de sous-traitance) — vous préparez l'envoi du lot vers l'entreprise qui réalisera l'opération.

![Formulaire Nouveau BST : sous-traitant, lot, pièce, opération, dates d'envoi et de retour](../../assets/form-expeditions-bst.png)

Sur cet écran, vous renseignez :
- **Sous-traitant** — l'entreprise qui va traiter les pièces (ex. Zingage Express).
- **Lot concerné / Pièce / Quantité** — quel lot, quelle référence de pièce, combien de pièces partent.
- **Opération ST** — le traitement demandé (oxydation anodique, sérigraphie, zingage, peinture poudre…).
- **Date envoi prévue** — le jour prévu du départ, aligné sur le planning (Gantt). C'est **cette date** qui fera remonter le bon dans la liste « À préparer aujourd'hui ».
- **Date retour prévue** — quand vous attendez le retour des pièces traitées.
- **BC ST lié** — le n° de bon de commande sous-traitant associé, si vous en avez un.
- **Observations** — consignes libres (emballage, fragilité…).

**➡️ Ensuite :** le BST est enregistré et apparaîtra, **le jour prévu**, dans la liste « À préparer ». Une fois expédié, les pièces sont chez le sous-traitant ; au retour, le lot reprend sa gamme de production.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/expeditions.md).

## Étape 3 — Réceptionner une commande fournisseur
**⬅️ Avant :** Un **fournisseur ou un sous-traitant livre** une commande (matière, pièces, retour de traitement). Les Achats ont émis le bon de commande et, si besoin, y ont coché « Certificat matière requis ». La commande apparaît dans le **Calendrier**, bloc « à réceptionner aujourd'hui », à sa date d'arrivée prévue.
**📝 Ici, vous :** cliquez **« Traiter »** et enregistrez la **réception** — vous liez le BC à un bon de livraison interne et vous notez les **références du fournisseur** et, pour une marchandise venue de l'étranger, les informations d'import. Il faut avoir l'**écriture sur les Expéditions**.

![Formulaire de réception : N° de commande et de BL fournisseur, bandeau de quantité, réception hors France avec poids, nomenclature douane, code EWX et mode d'arrivée](../../assets/form-expeditions-reception.png)

Sur cet écran, vous renseignez :
- **N° BL interne** et **N° d'affaire** — repris du bon de commande, rien à ressaisir.
- **N° de commande fournisseur** — le numéro de votre commande chez le fournisseur. **Obligatoire.**
- **N° de BL fournisseur** — le numéro du bon de livraison joint au colis. **Obligatoire.**
- **Aucune quantité à saisir** : le bandeau vert annonce la quantité enregistrée, c'est le **reste à recevoir** du bon de commande. Deux exceptions : la case **« Livraison partielle »** (le fournisseur livre en plusieurs fois : saisissez la quantité livrée) et un bon de commande **sans quantité exploitable** (bandeau jaune : saisissez la quantité lue sur le BL fournisseur).
- **Réception hors France ?** — Oui ou Non, **obligatoire**. Si **Oui** : **poids matière (kg)**, **N° de nomenclature (douane)** (code douanier du produit), **code EWX** (1 ou 2) et **mode d'arrivée** (Routier, Maritime, Aérien, Ferroviaire, Messagerie / express), tous obligatoires.

**➡️ Ensuite :** un bon de livraison de réception est créé et rattaché au BC, la date d'arrivée réelle est posée, et la réception apparaît dans l'onglet **Réceptions** avec « PV à faire », ses références fournisseur et, le cas échéant, la pastille « Hors France ». Une faute de frappe se rectifie par le lien **« Corriger »** (sans toucher à la quantité ni au stock). **Rien n'entre encore en stock** : enchaînez avec le **PV de contrôle**.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/expeditions.md).

## Étape 4 — Contrôler à réception (PV de contrôle)
**⬅️ Avant :** La commande vient d'être **réceptionnée**. Avant que les pièces entrent en stock, il faut **attester du contrôle**.
**📝 Ici, vous :** onglet **Réceptions**, bouton **« PV à faire »** — vous déclarez si la réception est conforme ou non, et qui l'a contrôlée.

![PV de contrôle conforme : résultat, contrôleur choisi dans la liste, certificat matière confirmé](../../assets/form-expeditions-pv.png)

Sur cet écran, vous renseignez :
- **Résultat du contrôle** — **Conforme** ou **Non conforme** (rien n'est coché d'avance).
- **Contrôleur** — choisi dans la liste des salariés actifs qui ont l'écriture sur les Expéditions ; vous êtes pré-sélectionné si vous en faites partie.
- **Certificat matière reçu et conforme** — seulement si le bon de commande l'exige. **Sans cette case, pas de PV conforme** : le PV bascule en non conforme.
- **Conforme** : rien d'autre. **Non conforme** : la fenêtre affiche tout le bon de commande — en-tête (fournisseur, dates, affaire, montant, conditions, notes, PDF) et **chaque ligne** avec **Oui / Non** ; une **observation est obligatoire** sur chaque ligne en Non. En bas, une **observation générale** (facultative) et la **gravité**.

![PV de contrôle non conforme : en-tête du bon de commande, lignes Oui / Non avec observation, observation générale, gravité](../../assets/form-expeditions-pv-non-conforme.png)

**➡️ Ensuite :** si **Conforme**, le contenu **entre en stock** (ligne par ligne sur son article pour un bon de commande à plusieurs articles) et la porte matière de l'affaire peut s'ouvrir. Si **Non conforme**, une **non-conformité** « réception fournisseur » part au service **Qualité** avec le détail des lignes en écart (détecteur « Réception »), et le lot part **toujours en quarantaine** : rien n'entre en stock, la Qualité décide (renvoi, dérogation, entrée partielle). Cette quarantaine **bloque un futur BL** tant qu'elle n'est pas traitée (voir la porte qualité de l'étape 1).

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/expeditions.md).

## Étape 5 — Demander un achat (besoin libre)
**⬅️ Avant :** En expédition, il vous manque un **article non rattaché à une commande** (consommable d'emballage, ruban, EPI…).
**📝 Ici, vous :** créez une **Demande d'achat** — accessible via le bouton « Demande d'achat » de la bannière, dans tous les onglets.

Sur cet écran, vous renseignez :
- **Article / Désignation** — le nom de l'article dont vous avez besoin. **Seul champ obligatoire.**
- **Type** — la catégorie (Consommable, EPI / Sécurité, Outillage…).
- **Quantité** — la quantité souhaitée avec son unité.
- **Fournisseur pressenti** — un fournisseur suggéré, si vous en avez un en tête.
- **Priorité** — Normal, Urgent ou Critique.
- **Livraison souhaitée** — la date à laquelle vous aimeriez recevoir l'article.
- **Soumettre à la validation de la Direction** — à cocher pour un achat libre ou un investissement qui doit être approuvé.

**➡️ Ensuite :** la demande part au service **Achats**, qui la transforme en bon de commande. La marchandise reviendra ensuite par la **réception** (étape 3) et son **PV de contrôle** (étape 4).

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/expeditions.md).
