# 03 · Achats — parcours guidé

> Comment ça marche **étape par étape** : ce qui arrive **avant**, ce que **vous remplissez ici** (et pourquoi), et **où ça part ensuite**. Écrit pour un nouvel utilisateur.

## En bref — le rôle du service dans la chaîne

Le service Achats est le point de passage entre un **besoin** (une pièce, une matière, une prestation manquante) et une **commande réelle** passée à une entreprise extérieure. En entrée, il reçoit des **demandes d'achat (DA)** venues de la production, du stock ou du bureau d'études. En sortie, il produit des **bons de commande (BC)** qui partent vers les Expéditions (réception de la marchandise), et il tient à jour le **référentiel fournisseurs / sous-traitants** avec leurs **prix officiels**.

Un principe clé traverse tout le service : **le prix officiel d'un fournisseur ne se fixe que par une demande de prix (RFQ) validée**, jamais par un bon de commande. Le BC dépense ; la RFQ tarife. Garder les deux séparés, c'est garder des prix fiables dans les nomenclatures du bureau d'études.

## Étape 1 — Enregistrer un fournisseur ou un sous-traitant

**⬅️ Avant :** Un nouveau partenaire apparaît — un fabricant de matière, un fournisseur de visserie, ou un sous-traitant qui fait un traitement de surface. Avant de pouvoir lui commander quoi que ce soit, il doit exister dans le référentiel.

**📝 Ici, vous :** créez la fiche de l'entreprise (raison sociale, familles fournies ou prestations réalisées).

![Onglet Fournisseurs / ST avec le référentiel des partenaires](../../assets/achats-fournisseurs.png)

Sur cet écran, vous renseignez :
- **Raison sociale** — le nom officiel de l'entreprise ; sans lui, la création est refusée.
- **Familles de fourniture** (fournisseur) / **Prestations de sous-traitance** (ST) — ce que l'entreprise sait faire ; ces étiquettes servent ensuite à la retrouver au moment de commander.
- **Délai moyen (j)** — le nombre de jours habituels entre commande et livraison, utile pour anticiper les réceptions.
- **Certifications / Conditions de paiement** — les repères qualité et commerciaux du partenaire.

Depuis la fiche détaillée, vous remplissez les **« Références fournies »** — un **seul** tableau depuis le 17/09/2026 : référence, désignation, catégorie, **quantité par paquet** (accessoires), unité, délai et prix (*matière : prix d'UNE TÔLE · accessoire : prix du PAQUET*). Pour un sous-traitant, ce sont les **opérations sous-traitées** (forfait minimum + prix à la pièce). Ces informations alimentent directement les nomenclatures du bureau d'études — et la **quantité par paquet** est ce qui permet de comparer un paquet de 100 et un paquet de 50.

![Fiche fournisseur : identité, puis le bloc « Références fournies » avec sa barre de saisie (référence, désignation, catégorie, quantité par paquet, unité, délai, prix)](../../assets/achats-fiche-fournisseur.png)

**➡️ Ensuite :** le fournisseur / sous-traitant devient sélectionnable partout où l'on commande (RFQ, DA, BC). Ses références et prix nourrissent les nomenclatures du BE.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/achats.md).

## Étape 2 — Demander un prix (RFQ)

**⬅️ Avant :** Vous avez un fournisseur au référentiel et un besoin dont vous ne connaissez pas encore le prix, ou dont le prix est à réactualiser. Avant d'engager une dépense, on consulte le marché.

**📝 Ici, vous :** créez une consultation, saisissez les prix reçus des fournisseurs (et, pour un accessoire, **la quantité de pièces par paquet** à laquelle chaque prix se rapporte), puis désignez l'offre **préférée**.

![Onglet Demandes de prix — la liste des consultations fournisseurs et leur statut](../../assets/achats-rfq.png)

Le bouton **« Traiter »** d'une demande ouvre la fenêtre de saisie des réponses :

![Fenêtre « Traiter » une demande de prix : une ligne par fournisseur consulté, prix, délai, bouton « Préféré » et « Valider & enregistrer tous les prix »](../../assets/form-achats-rfq-reponses.png)

*La capture montre une demande portant sur une tôle : la colonne « Qté / paquet » n'apparaît que pour une ligne d'accessoire.*

Sur cet écran, vous renseignez :
- **Fournisseur (par ligne de réponse)** — le fournisseur qui a répondu ; « Ajouter un fournisseur » crée une ligne de plus pour comparer plusieurs offres sur la même référence.
- **Prix unit. / Prix du paquet** — le prix HT proposé. Pour un **accessoire**, c'est le prix **du paquet** ; la colonne orange **« Qté / paquet »** à côté dit combien de pièces il contient (l'ERP affiche « = 0,1040 €/pièce » en dessous).
- **Préféré** — le fournisseur chez qui commander. ⚠ Il **n'écarte aucun prix** : **tous** les prix chiffrés sont enregistrés au catalogue.
- **Délai (j)** — le délai de livraison annoncé, pour départager les offres.

**➡️ Ensuite :** « **Valider & enregistrer tous les prix** » (qui exige au moins un prix saisi) **clôture la RFQ** et inscrit **chaque** prix chiffré comme **prix officiel de SON fournisseur** au catalogue, avec sa quantité par paquet. Le bureau d'études ne choisit plus de fournisseur sur une nomenclature : il en lit la **moyenne** — plus vous enregistrez de prix, plus son estimation est juste.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/achats.md).

## Étape 3 — Traiter une demande d'achat → Bon de commande

**⬅️ Avant :** Une **demande d'achat (DA)** est arrivée — la production, le stock ou le BE signale un manque à réapprovisionner. Elle attend d'être transformée en commande réelle.

**📝 Ici, vous :** ouvrez la DA et la convertissez en bon de commande vers le bon fournisseur ou sous-traitant.

![Onglet Demandes d'achat — DA à transformer en bon de commande](../../assets/achats-da.png)

Sur cet écran, vous renseignez :
- **Type de commande** — BC Fournisseur (une fourniture) ou BC Sous-Traitant (une prestation à façon).
- **Fournisseur / ST** — l'entreprise destinataire ; obligatoire, la validation refuse un destinataire vide.
- **Référence du matériel** — la référence du produit à commander, à prendre dans la liste (le catalogue fournisseur). C'est elle qui commande le champ précédent : les fournisseurs qui portent cette référence passent en tête de la liste, sous « Référencés pour … », avec leur désignation ; s'il n'y en a qu'un, il est choisi pour vous. Un message indique ce qui a été trouvé. Si l'ERP a retrouvé la référence depuis la désignation de la demande, il l'écrit « déduite — à vérifier ».
- **Articles / Prestation** — la désignation de ce qui est commandé, pré-remplie depuis la DA (ou depuis le catalogue si vous choisissez une référence et que le champ est vide).
- **Montant HT / Livraison prévue** — le total à engager et la date attendue de la marchandise.
- **N° d'affaire (optionnel)** — le rattachement à une commande client précise, si concerné.
- **Certificat matière requis** — à cocher si le fournisseur doit **joindre un certificat matière** à la livraison (jamais cochée d'avance). La mention est imprimée sur le bon de commande ; à la réception, le PV de contrôle ne pourra être conforme que si le contrôleur confirme le certificat.

Le bouton **« Enregistrer (brouillon) »** met la DA de côté sans créer le BC : vous la reprendrez plus tard.

**➡️ Ensuite :** « Soumettre → créer BC » crée le bon de commande, qui **part côté Expéditions** pour être reçu à la livraison. La DA est ainsi soldée. Si, au PV de réception, le fournisseur annonce un **reliquat**, un **bon de commande de reliquat** (`…-R1`, badge « Reliquat de BC-… · date à valider », montant porté par le BC d'origine) apparaît dans l'onglet **Bons de commande** : fixez sa **date d'arrivée** (bouton « Date d'arrivée ») pour qu'il rejoigne le calendrier des Expéditions.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/achats.md).

## Étape 4 — Créer un bon de commande directement

**⬅️ Avant :** Un achat simple ou urgent ne justifie pas de passer par une demande d'achat formelle. Vous voulez commander tout de suite.

**📝 Ici, vous :** saisissez le bon de commande de A à Z, ligne par ligne si besoin.

![Formulaire de création d'un bon de commande](../../assets/form-achats-bc.png)

Sur cet écran, vous renseignez :
- **Destinataire** — Fournisseur ou Sous-traitant, selon la nature de la commande.
- **Fournisseur / sous-traitant** — l'entreprise destinataire ; obligatoire.
- **Articles / désignation** — ce qui est commandé ; se remplit tout seul si vous détaillez les lignes.
- **Quantité** — un **nombre** : c'est la base du **reste à recevoir** quand les Expéditions réceptionneront la commande (l'unité se met dans les articles ou les lignes).
- **Certificat matière requis** — même case que dans l'étape 3 ; elle se pose aussi après coup dans l'onglet **Bons de commande** (colonne « Certificat matière », bouton « Exiger »), tant qu'aucun PV de réception conforme n'est signé.
- **Lignes détaillées (Réf. / Désignation / Catégorie / Qté / PU)** — le détail article par article ; le **Montant HT se recalcule automatiquement** (Qté × PU additionnés). Une ligne **sans référence est ignorée**.
- **Soumettre ce BC à la validation de la Direction** — à cocher pour un achat stratégique ou un gros montant : la Direction devra valider avant l'engagement.

**⚠️ À retenir :** le prix officiel d'un fournisseur ne se met **jamais** à jour par ce bon de commande — seulement par une RFQ validée (étape 2).

**➡️ Ensuite :** le BC est créé et **part côté Expéditions** pour réception. S'il a été soumis à validation, il attend d'abord le feu vert de la Direction.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/achats.md).
