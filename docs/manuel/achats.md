# Achats

**Pour qui :** Acheteur(se)

Consultations fournisseurs (RFQ), demandes d'achat, bons de commande, évaluation fournisseurs.

![achats-rfq](../assets/achats-rfq.png)

## Les onglets
- **Demandes de prix** — RFQ : source de vérité des prix → alimente le catalogue.
- **Demandes d'achat** — DA à transformer en BC.
- **Bons de commande** — Tous les BC émis, la date d'arrivée annoncée par le fournisseur et l'exigence de **certificat matière** (colonne « Certificat matière »).
- **Avoirs fournisseurs** — Registre de ce que nos **fournisseurs et sous-traitants nous doivent**. À ne pas confondre avec les avoirs **clients**, qui restent au service Commercial.
- **Fournisseurs / ST** — Référentiel fournisseurs et sous-traitants.
- **Scorecard** — Évaluation (qualité, délai) fournisseur/ST.
- **Dashboard achats** — Indicateurs achats.

## Procédures
### Émettre une demande de prix
1. Onglet **Demandes de prix**, « Nouvelle RFQ ».
2. Choisir le(s) **fournisseur(s)** et les **articles**.
3. À réception, saisir les prix → ils alimentent le **catalogue** (le BC n'écrit jamais le prix).

### Exiger un certificat matière sur un bon de commande
1. **À la création** : dans « Traiter → BC » (depuis une DA) ou « Créer un BC », cocher **« Certificat matière requis »** (case violette, jamais cochée d'avance) quand le fournisseur doit joindre un certificat matière à la livraison.
2. **Après coup** : onglet **Bons de commande**, colonne **« Certificat matière »**, bouton **« Exiger »** (ou **« Retirer »**), puis confirmer. Si le BC est déjà parti, **rééditer son PDF** et le renvoyer au fournisseur : la mention « Certificat matière exigé : il doit accompagner la livraison… » y est imprimée.
3. À la réception, le contrôleur des Expéditions **confirme le certificat** au PV : sans lui, le PV ne peut pas être conforme et la non-conformité le mentionne.

> L'exigence se **verrouille** (cadenas « PV conforme ») dès qu'un PV de réception conforme est signé pour ce BC. Changer l'exigence pendant qu'un contrôleur a sa page ouverte fait refuser son PV (il doit recharger). Sans la mise à jour de la base (migration 012 / script `cloud-10`), un bandeau le signale et l'exigence n'est pas enregistrée.
> La **quantité** du BC direct est un **nombre** : c'est elle qui donne le reste à recevoir à la réception.

![Créer un BC — case « Certificat matière requis »](../assets/form-achats-bc.png)

### Suivre un avoir fournisseur
1. Onglet **Avoirs fournisseurs**. Trois compteurs en haut : **À recevoir**, **Disponible**, **Déjà imputé**. Puis le tableau **« Ce que chacun nous doit »** par fournisseur, puis la liste des avoirs (recherche par n° d’avoir, fournisseur, statut, origine).
2. Un avoir **arrive tout seul** quand la Qualité décide un renvoi, un rebut ou une réfaction sur un lot reçu non conforme. **« Nouvel avoir »** permet d’en saisir un à la main : type (fournisseur / sous-traitant), tiers, bon de commande (facultatif), montant HT, motif, et s’il est déjà reçu le **n° de l’avoir du fournisseur** + la **date**.
3. Bouton **« Reçu »** quand l’avoir du fournisseur arrive : son n°, sa date, et le **montant réellement accordé** — qui peut différer du montant réclamé. L’avoir passe de **À recevoir** à **Disponible**.
4. Bouton **« Imputer »** pour l’utiliser : le montant et **sur quoi** (n° de facture fournisseur, de bon de commande…) + une note. L’avoir passe en **Partiellement utilisé**, puis **Soldé**. Chaque imputation reste visible sous le motif.

> Un avoir **ne se supprime jamais** : il **s’annule** avec un motif obligatoire, et seulement tant qu’aucune partie n’en a été utilisée.
> Si la base n’a pas encore la mise à jour (migration 008 / script cloud-6), un **bandeau orange** le signale et la Qualité ne peut pas décider sur un lot reçu non conforme.

---
> Détails techniques : `docs/technique/06-modules/achats.md`. Droits d'accès : `docs/fiches-poste/`.
