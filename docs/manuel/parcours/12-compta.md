# 12 · Comptabilité — parcours guidé

> Comment ça marche **étape par étape** : ce qui arrive **avant**, ce que **vous remplissez ici** (et pourquoi), et **où ça part ensuite**. Écrit pour un nouvel utilisateur.

## En bref — le rôle du service dans la chaîne

La Comptabilité est le **point d'arrivée financier** de toute l'entreprise. Elle reçoit en entrée les livraisons et prestations réalisées par la Production et le Commercial (qu'il faut **facturer aux clients**), ainsi que les factures reçues des **fournisseurs et sous-traitants** (qu'il faut régler). À partir de ces éléments, le service produit les **factures clients**, enregistre les **factures fournisseurs**, et — sans saisie manuelle — alimente le **Grand Livre** : chaque facture génère automatiquement son écriture comptable. En sortie, la Comptabilité transmet à l'expert-comptable / Sage le fichier **FEC**, suit la **TVA**, la **trésorerie**, et fournit à la Direction les **coûts et marges**. Les temps pointés par les opérateurs remontent seuls ici pour nourrir le calcul des coûts de revient.

Voici l'écran d'accueil du service :

![Écran d'accueil de la Comptabilité](../../assets/compta.png)

Les onglets suivent ce flux : **Facturation** (clients + fournisseurs), **Grand Livre** (écritures et export FEC), **TVA & Déclarations**, **Balance & Trésorerie**, et le **Dashboard** d'indicateurs.

## Étape 1 — Facturer un client

**⬅️ Avant :** Le Commercial a pris une commande, la Production l'a réalisée et livrée (BL émis). Il faut maintenant réclamer le paiement au client.
**📝 Ici, vous :** créez la facture à envoyer au client, dans l'onglet « Facturation » › « Factures clients » › bouton « Créer facture ».

Sur cet écran, vous renseignez :
- **Client** — le client à facturer, choisi dans la liste. C'est lui qui recevra la facture et devra la payer.
- **N° Affaire** — le numéro de la commande concernée, pour relier la facture au travail réalisé.
- **Date facture** et **Date d'échéance** — le jour d'émission et la date limite de paiement : c'est l'échéance qui déclenchera plus tard un impayé si le client ne règle pas.
- **Désignation / Prestations** — ce que vous facturez (prestations ou références livrées), tel qu'il apparaîtra sur le PDF.
- **Montant HT (€)** — le montant hors taxes. La **TVA 20 %** et le **TTC** se calculent tout seuls : n'y touchez pas.
- **Mode de paiement** et **Notes internes** — comment le client règle, et les remarques reprises sur le PDF.

**➡️ Ensuite :** la facture est enregistrée, un **PDF** est généré à envoyer au client, et une **écriture de vente (VTE)** part automatiquement dans le **Grand Livre**. L'échéance alimente le suivi de trésorerie et, si elle est dépassée, remonte comme impayé.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).

## Étape 2 — Enregistrer une facture fournisseur / sous-traitant

**⬅️ Avant :** Un fournisseur a livré de la matière ou un sous-traitant a réalisé une opération, et l'entreprise reçoit sa facture par courrier ou e-mail. Il faut la saisir pour la payer et l'imputer en comptabilité.
**📝 Ici, vous :** enregistrez cette facture reçue, dans l'onglet « Facturation » › « Factures fournisseurs / sous-traitants » › bouton « Nouvelle facture fournisseur / ST ».

![Formulaire de nouvelle facture fournisseur / sous-traitant](../../assets/form-compta-fournisseur.png)

Sur cet écran, vous renseignez :
- **Type** — précisez s'il s'agit d'un **Fournisseur** ou d'un **Sous-traitant** : ça oriente le suivi et l'imputation.
- **N° Facture** — le numéro imprimé sur la facture reçue, pour la retrouver et éviter les doublons.
- **Fournisseur / Sous-traitant** — la raison sociale de l'entreprise émettrice (obligatoire).
- **Date facture** et **Échéance** — la date d'émission et la date limite avant laquelle vous devez payer (l'échéance nourrit la trésorerie prévisionnelle).
- **Montant HT** — le hors taxes (obligatoire) ; le **TTC** se calcule seul à partir du HT et du **TVA %**.
- **Compte de charge** — range la dépense dans la bonne catégorie (matières, sous-traitance, énergie…), ce qui prépare l'écriture d'achat.
- **Soumettre cette facture à la validation de la Direction** — si vous cochez, la facture part en **validation Direction** avant d'être payée.

**➡️ Ensuite :** la facture est enregistrée comme dette à payer. Une **écriture d'achat (ACH)** est portée au Grand Livre, et si la case a été cochée, la Direction reçoit la demande de validation avant règlement.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).

## Étape 3 — Consulter le Grand Livre et exporter le FEC

**⬅️ Avant :** Les factures clients (VTE) et fournisseurs (ACH) ont été saisies aux étapes 1 et 2. Chacune a généré **automatiquement** son écriture comptable ; les livraisons (BL) aussi. Le Grand Livre est donc déjà rempli sans saisie manuelle.
**📝 Ici, vous :** recherchez, filtrez et **exportez** les écritures, dans l'onglet « Grand Livre ».

Sur cet écran, vous utilisez :
- **Rechercher compte / libellé** — tapez un numéro de compte ou un mot du libellé pour ne voir que les lignes voulues.
- **Boutons de journaux** (Tous, VTE, ACH, BQ, OD, SAL) — filtrent le tableau par type d'écriture.
- **Année d'exercice** — l'année dont vous voulez sortir les écritures, utilisée par l'export.
- **Export FEC (Sage)** — génère le **Fichier des Écritures Comptables** normalisé.

**➡️ Ensuite :** le fichier FEC part chez **l'expert-comptable / dans Sage** pour la clôture et les déclarations. L'export est réservé aux rôles comptable / direction.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).

## Étape 4 — Vérifier les taux horaires (homme et machine)

**⬅️ Avant :** Les salaires ou les charges sociales ont évolué, ou vous préparez un chiffrage fiable. Depuis le 14/09/2026, le coût de revient n'utilise que **deux taux** :
- le **taux homme** = le **taux horaire chargé** de chaque salarié, saisi dans sa **fiche salarié (service RH)** ;
- le **taux horaire machine** de chaque **process machine**, saisi en **Production › Process Ateliers**. Les machines et les postes n'ont plus de taux.

**📝 Ici, vous :** contrôlez ces taux depuis le menu Finances & Coûts :
- page **« Taux horaires opérateurs »** — le taux chargé de chaque opérateur et la ligne **« Taux homme du coût de revient estimé »** (moyennes Seem, Semrac, atelier). Les cases *Taux brut* et *Charges (%)* permettent de simuler un autre taux, mais **le bouton « Enregistrer » de cette page n'écrit rien** : un taux se corrige dans la fiche salarié (RH) ;
- page **« Taux machine des process »** — pour chaque machine, ses process machine et leur taux, avec les badges **« taux à saisir »** ; bouton « Saisir les taux (Production) ».

**➡️ Ensuite :** ces taux alimentent le **coût de revient** estimé (nomenclatures, analyse DT, étape 5) et le **coût réel** des commandes (étape 6). Un taux manquant compte 0 € et le coût est signalé « incomplet » partout.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).

## Étape 5 — Simuler un coût de revient (aide au chiffrage)

**⬅️ Avant :** Le Bureau d'Études ou le Commercial doit chiffrer une pièce avant de faire une offre de prix. Les taux horaires (étape 4) sont à jour.
**📝 Ici, vous :** estimez un coût de revient et un prix de vente, depuis la page « Coûts de revient » (menu Finances & Coûts) › bouton « Simuler CR ». La page rappelle la méthode (ROP → homme, RGM → homme + machine, THV → homme, TMV → machine) et les taux en vigueur.

Sur cet écran, vous renseignez :
- **Activité** (Seem / Semrac) et **Référence pièce** — l'activité propose le **taux homme** (moyenne du coût chargé RH du site).
- **Quantité du lot** — les réglages sont comptés une fois puis répartis sur les pièces.
- Une ligne par opération : **Process** (pré-remplit le type et le taux machine), **Type**, **ROP** et **RGM** (minutes par lot), **THV** et **TMV** (minutes par pièce), **Taux machine** ; « Ajouter une opération » pour en ajouter.
- **Matière (€/pièce)**, **Frais généraux (%) – hypothèse** et **Coefficient de vente** — rien n'est pré-rempli.

**➡️ Ensuite :** « Calculer CR » détaille homme, machine, matière, frais et le CR unitaire, puis le prix simulé avec son taux de marque. C'est une simulation : **rien n'est enregistré** en base ; le coût de revient qui part dans l'offre est celui de l'analyse DT du Bureau d'Études.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).

## Étape 6 — Consulter les imputations des temps

**⬅️ Avant :** Les opérateurs ont soldé leurs bons de travail (BDT) en Production. Les temps pointés remontent **automatiquement** ici.
**📝 Ici, vous :** consultez le coût réel de chaque bon de travail, sur la page « Imputations des temps » (menu Finances & Coûts).

Sur cet écran, vous lisez pour chaque BDT :
- **Opérateur, Process, Machine, Opération, Commande** et les temps **alloué / réel** ;
- **Coût homme** — temps réel × taux chargé de l'opérateur (à défaut, moyenne du site) ;
- **Coût machine** — temps réel × taux horaire machine du process, si le process est de type machine ;
- **Total** ; un bandeau orange compte les BDT **au coût incomplet** (un taux manque).

**➡️ Ensuite :** ces coûts alimentent les **coûts réels** par commande et par affaire (fiches Commande, Lot et Affaire 360, qui affichent « — » et un bandeau si le coût n'est pas calculable). Cette page ne saisit rien ; les anciens boutons « Valider tout », « Exporter » et le sélecteur de date, qui ne faisaient rien, ont été retirés. L'export vers la paie se fait depuis RH (export Silae).

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/compta.md).
