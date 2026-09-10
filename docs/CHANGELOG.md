# Journal des modifications — ERP Seem Semrac

> Tenu à jour par le skill `erp-doc-sync` (voir `.claude/skills/`). Le plus récent en haut.

## 2026-09-10 — `install.sh` pouvait rendre un secret introuvable

**Le symptôme**, remonté par l'exploitant : sur la VM, `grep '^DASHBOARD_PASSWORD=' docker/.env` ne renvoyait rien, alors que Studio demandait bien un mot de passe.

**La cause** : la fonction `set_env` d'`install.sh` ajoutait une clé absente avec un simple `>>`, sans vérifier que le fichier se terminait par un saut de ligne. Si ce n'était pas le cas, la nouvelle clé se **collait** à la dernière ligne :

```
AUTRE_CLE=valeurDASHBOARD_PASSWORD=le_secret
```

Deux dégâts d'un coup : la nouvelle clé devient introuvable (`^DASHBOARD_PASSWORD=` ne matche plus) **et** la valeur précédente est corrompue. Silencieux — le script se termine sans erreur.

**Le correctif** : `set_env` garantit désormais la fin de ligne avant d'ajouter.

**Reproduit puis vérifié** sur trois formes de fichier : sans saut de ligne final (l'ancienne version produit bien `B=2DASHBOARD_PASSWORD=…` et la clé est perdue ; la nouvelle l'écrit sur sa propre ligne, retrouvée par un `grep` ancré), avec saut de ligne final (pas de ligne vide en trop), et sur une clé déjà présente (remplacement en place, inchangé).

ℹ **Pour récupérer un mot de passe malgré un `.env` abîmé** : la valeur en service est celle du conteneur, `docker exec erp-kong env | grep -i dashboard`. Elle fait foi quel que soit l'état du fichier.

## 2026-09-10 — 689 lignes mortes retirées de l'écran Expéditions

**Ce qui traînait** : quatre panneaux entiers (`panelBL`, `panelBC`, `panelCommandes`, `panelPlanningArrivees`) n'étaient plus rendus depuis la refonte des onglets — leurs identifiants avaient disparu de `TABS` et de `EXP_TABS`, mais le code, lui, était resté. Résultat : un `grep bcPdf` dans ce fichier remontait **5 boutons dont 2 ne s'affichaient jamais**, et chaque intervention commençait par démîler le vivant du mort.

C'est ce qui avait produit le bouton « BL &lt;n°&gt; » qui **vidait la page** : il visait un onglet supprimé, dans un panneau lui-même supprimé.

**Retiré** — après vérification, pour chaque symbole, qu'aucune référence ne subsistait **hors** des blocs supprimés :

- les 4 panneaux ci-dessus ;
- morts par ricochet : `subTabBar`, `cmdStatutBadge`, `daStatutBadge`, `BC_DEFAULT` / `CMDS_DEFAULT` / `DA_DEFAULT`, `expArrFilter`, `expSwitchBCType` / `expSwitchCmdType` / `expSwitchBLType`, `expVoirBL`, `expImprimerBL` (qui n'imprimait rien — elle affichait une notification mensongère) ;
- la délégation de clic sur `.arr-mk` (plus aucun marqueur n'est rendu) et les styles `.exp-sub-*` / `.arr-*` devenus sans objet.

**Gardé — attention aux faux jumeaux** : `BL_CLIENTS_DEFAULT` et `BST_DEFAULT` sont, eux, toujours utilisés ; `kpiCard` sert au Dashboard ; `numBL` aux trois listes de BL.

**Recalé au passage** : l'en-tête du fichier et le sous-titre de la page annonçaient encore « BL Clients · BST · BC Fournisseurs/ST · Commandes » — la sous-nav d'avant la refonte. Les onglets réels sont Réceptions · Envois · Calendrier · Fournisseurs · Dashboard. Et la section « Données de démonstration » ne contenait plus que deux replis vides.

**2 053 → 1 364 lignes.**

### Vérification

`tsc --noEmit` propre · harnais toutes-pages **61 PASS / 0 FAIL** · `npm run build` · balayage post-suppression : **zéro résidu** des 24 symboles retirés, les 5 panneaux vivants toujours présents, chaque import encore utilisé. **Page ouverte dans le navigateur** : les 5 onglets s'affichent avec leur contenu réel (628 à 2 779 px de hauteur), **zéro erreur console**, et le crayon de date ouvre toujours sa fenêtre avec son unique bouton.

## 2026-09-09 (soir, 2) — La date d'arrivée d'un BC se change depuis les Achats

**Le reproche** : « je vois pas pourquoi on télécharge un doc ». Dans la carte que j'avais ajoutée aux Expéditions pour rendre les dates corrigeables, la **seule action visible** était un bouton PDF ; le crayon, lui, se perdait dans la cellule de la date. On croyait corriger une date, on récupérait un document.

### Ce qui a été retiré

- La carte **« Autres commandes — date modifiable »** (Expéditions › Réceptions), et son bouton de téléchargement.
- Le bouton **« BC PDF »** dans la fenêtre de changement de date : hors sujet, on est venu changer une date.
- Le bouton **« BL &lt;n°&gt; »** de cette même fenêtre — il appelait `expShowTab('bl')`, un onglet supprimé lors d'une refonte antérieure : il masquait les cinq panneaux et laissait un **écran blanc**. Devenu un simple rappel textuel.
- Le saut forcé vers l'onglet « Calendrier » après enregistrement : on reste où l'on était.

### Ce qui le remplace

Un **6ᵉ onglet « Bons de commande »** dans le service Achats. Il liste **tous** les BC sauf les annulés — y compris ceux déjà validés par le fournisseur, déjà reçus, ou en attente de paiement — avec un bouton explicite **« Date d'arrivée »** par ligne. La fenêtre ne contient qu'un champ date et un bouton d'enregistrement.

### La date se fige à la réception

Premier jet corrigé le jour même, sur décision de l'exploitant : *« il ne faut pas pouvoir changer la date d'arrivée prévue après la réception. »* Il a raison — cette date est la **promesse** du fournisseur ; une fois la marchandise arrivée on connaît déjà le résultat, et la rouvrir reviendrait à effacer un retard après coup, donc à fausser l'OTD.

- **Modifiable** tant que la marchandise n'est pas arrivée, y compris sur une commande **déjà validée** par le fournisseur (c'était la demande d'origine, elle tient).
- **Figée** dès qu'elle est arrivée — **réception partielle comprise**. Trois signaux, un seul suffit : date de réception réelle, bon de livraison rattaché, ou statut de la famille reçue.
- Dans l'onglet Achats, la ligne concernée porte une pastille grise **« Figée »** à la place du bouton. Dans la fenêtre des Expéditions, le champ est grisé et le bouton cède la place à « Date figée depuis la réception ».
- **Le refus vit côté serveur** (`409`, message nommant la commande), sur les deux routes : ce n'est pas un bouton grisé qu'on contourne en rechargeant la page.

Le lien « Voir BC » des demandes d'achat traitées pointait vers `/expeditions/service#bc`, un onglet supprimé — il bascule maintenant sur ce nouvel onglet.

### Le piège de droits, évité de justesse

`serviceFor()` déduit le service du premier segment après `/api/`. La route `/api/expeditions/bc/:id/date-arrivee` est donc gatée sur **expeditions**, où le rôle `achats` n'a que la lecture : l'acheteur aurait pris un `403 Accès refusé` sur son propre bouton. Le même handler est désormais enregistré aussi sous `/api/bc/:id/date-arrivee`, famille déjà rattachée au service `achats`.

L'onglet ne coûte **aucun appel Supabase supplémentaire** : la route chargeait déjà les bons de commande, elle ne les passait simplement pas à la page.

### Vérification

`tsc --noEmit` propre · harnais toutes-pages **61 PASS / 0 FAIL** · `npm run build` · **essayé pour de vrai dans le navigateur** contre la base : l'onglet s'affiche, le bouton ouvre la fenêtre, `POST /api/bc/<id>/date-arrivee` répond 200, la date est réécrite et l'onglet est conservé après rechargement. Un second report gèle bien `date_livraison_initiale` sur la date précédente — l'OTD reste calculé sur la promesse d'origine. **Verrou de réception vérifié sur les deux routes** : `recu` → 409, `recu_partiel` → 409, `brouillon` → 200 ; et à l'écran, 3 lignes sur 6 portent la pastille « Figée », les autres gardent leur bouton. Côté Expéditions, vérifié dans la page rendue : plus de carte, plus de `bcPdf` ni de `expVoirBL` dans la fenêtre de date, un seul bouton « Enregistrer la date ».

## 2026-09-09 (soir) — Tout le flux d'une affaire porte le même numéro

**Le symptôme** : une affaire `0001` produisait bien `CMD-2026-0001`, `LOT-2026-0001-01`, `DA-0001-…` — puis, à partir des achats, la chaîne repartait sur des compteurs **globaux** : `BC-2026-003`, `BL-2026-002`, `FOURN-2026-0002`. Le flux se lisait `0001` à moitié.

**La cause** : la numérotation par affaire n'avait été posée que sur les documents **créés ensuite**. Les documents déjà en base gardaient leur ancien numéro, et rien ne les reprenait.

### Ce que ça donne maintenant

```
CMD-2026-0001 ─ LOT-2026-0001-01 ─ BDT-2026-0001-01-01
              └ DA-0001-125237-M ─ BC-2026-0001-01 ─ BL-2026-0001-01-01
                                                   └ PRO-2026-0001-01   (proforma)
                                                   └ BST-2026-0001-01-01 (sous-traitance)
```

Un document adossé à un bon de commande **reprend le numéro de ce BC** et lui ajoute son rang : en lisant un BL ou une proforma, on remonte au BC, et de là à l'affaire. Plusieurs BC dans une affaire ⇒ plusieurs BL, chacun sous le sien.

### Les rattachements ne bougent pas

Seuls les **numéros affichés** changent (`bons_de_commande.num_bc`, colonne `num_bl` ajoutée aux BL, `factures_fournisseur.num_facture`). Les **identifiants techniques** (`id`) restent intacts : ce sont eux qui portent `bons_de_livraison.bc_id`, la proforma `FF-<id du BC>`, la pièce jointe GED `BC:<id>`, `demande_achat_id` et les écritures comptables. L'ancien numéro reste donc lisible dans `id` — **rien n'est perdu**.

### Migrations livrées

- `002-renumerotation-bc-bl-par-affaire.sql` — ajoute `num_bl`, renumérote les BC par (année, affaire), adosse chaque BL de réception au numéro de **son** BC, numérote par affaire les BL sans BC (BL clients, retours).
- `003-proforma-numero-suit-le-bc.sql` — la proforma fournisseur prend le numéro de son BC. **Uniquement** les numéros encore au format auto-généré (`FOURN-AAAA-NNNN` / `ST-AAAA-NNNN`) : dès que le comptable a saisi le vrai numéro du fournisseur, il ne correspond plus au motif et **n'est jamais écrasé**.

Les deux sont idempotentes : relancées, elles ne réécrivent que ce qui diffère.

### Corrigé au passage

- Le BL de réception se numérotait à partir de l'**identifiant technique** du BC, pas de son numéro : sur un BC antérieur à la renumérotation (`id` `BC-2026-003`, numéro `BC-2026-0001-01`) le BL serait sorti en `BL-2026-003-01`. Il suit désormais `num_bc`.
- Le BST du planning avait un identifiant horodaté illisible (`BST-mfk3z9x`), sans rapport avec l'affaire. Il porte maintenant le numéro de son BC.
- Expéditions affichait l'identifiant technique du BL ; elle affiche son numéro (helper `numBL`, repli sur `id` quand la colonne `num_bl` n'existe pas encore).

### Vérification

`tsc --noEmit` propre · harnais toutes-pages **61 PASS / 0 FAIL** · `npm run build` · migrations 002 et 003 **exécutées pour de vrai** sur la base Docker locale : affaire `0001` → `BC-2026-0001-01` / `-02`, BL `BL-2026-LIBRE-01-01` adossé à son BC, proformas `PRO-2026-0001-01` / `-02`. Aucune ligne perdue, relance = 0 modification.

⚠ **Supabase cloud** : les migrations ne s'y appliquent pas toutes seules (pas de conteneur `erp-migrate` en face). Le contenu des deux fichiers est à jouer une fois dans le SQL Editor de Supabase Studio. Tant que ce n'est pas fait, l'affichage retombe sur `id` — correct, simplement à l'ancien format.

### Filet de sécurité ajouté dans la foulée

Question légitime de l'exploitant : « ça va rien effacer si j'ai fait des choses supplémentaires dans la base de la VM ? »

- **`erp-docker.sh maj` sauvegarde la base AVANT de lancer les migrations** — `pg_dump` complet dans `docker/sauvegardes/erp-AAAAMMJJ-HHMMSS.sql`, 10 fichiers conservés en rotation, dossier hors versionnement. Une base arrêtée n'empêche pas la mise à jour : la sauvegarde est signalée impossible et le déploiement continue. Commande manuelle : `erp-docker.sh sauvegarde`, restauration : `erp-docker.sh restore <fichier>`.
- **`docker/db/apercu-renumerotation.sql`** — aperçu **en lecture seule** de ce que les migrations changeraient : numéro actuel, numéro d'après, verdict `INCHANGE` / `RENUMEROTE` / `SAISIE MANUELLE - JAMAIS TOUCHEE`, plus un comptage des lignes à comparer avant/après.

Vérifié en conditions réelles : sauvegarde produite (1,3 Mo, 238 tables et blocs `COPY`, lignes de `bons_de_commande` présentes) ; aperçu exécuté dans une transaction **annulée** où les anciens numéros avaient été remis — il a bien annoncé `RENUMEROTE` sur les cinq BC, et laissé le numéro fournisseur saisi à la main (`F-FOURNISSEUR-XYZ-42`) en `JAMAIS TOUCHEE`. Base identique après le `rollback`.

## 2026-09-09 — Le schéma de la base se met à jour sur la VM, sans toucher aux données

**Le trou** : les scripts d'initialisation ne sont joués par Postgres **que sur une base vide**. Sur une VM déjà en service, `erp-docker.sh maj` mettait le **code** à jour mais **jamais le schéma** — une nouvelle colonne n'arrivait pas, et rien ne le signalait.

**Le mécanisme** : un conteneur éphémère `erp-migrate` démarre à chaque `up` (après que la base est saine), applique les fichiers de `docker/db/migrations/` **jamais encore joués**, puis s'arrête. Journal dans la table `_erp_migrations`. ⚠ **Correction du 09/09 (soir)** : `app` ne dépend **plus** de la réussite de `erp-migrate`. Une migration en échec mettait toute l'application à terre (`exit 3` sur la VM) ; un schéma en retard est un désagrément, un ERP arrêté est un arrêt de travail. Une migration en échec est signalée bruyamment, n'est pas journalisée, et est **retentée au démarrage suivant**.

### Les données ne sont jamais touchées

Le runner inspecte **tous** les fichiers *avant* d'en appliquer un seul et **refuse le lot entier** si l'un contient `DROP TABLE`, `DROP COLUMN`, `DROP DATABASE`, `DROP SCHEMA`, `DROP TYPE`, `DROP SEQUENCE`, `TRUNCATE` ou `DELETE FROM`. Les commentaires SQL sont retirés avant l'analyse — un `-- …drop table…` ne déclenche pas de faux positif. Restent autorisés parce qu'ils ne détruisent aucune donnée : `drop policy`, `drop index`, `drop trigger`, `drop constraint`.

Chaque fichier tourne dans **une transaction** (`psql -1`) : tout ou rien. Un `notify pgrst, 'reload schema'` suit, pour que les nouvelles colonnes soient visibles à l'API sans redémarrage.

### Première migration livrée

`001-bc-draft-jsonb.sql` aligne `demandes_achat.bc_draft` (`text` sur Docker, `jsonb` en cloud). **Prudente par construction** : si une seule ligne contient du texte qui n'est pas du JSON valide, la conversion est **abandonnée proprement**, la colonne reste en `text`, la migration se termine sans erreur et l'application continue de fonctionner (le serveur sait déjà écrire dans les deux types).

### Vérification

`docker compose config` valide · `bash -n` sur les deux scripts · runner exécuté contre un **faux `psql`** : une migration déjà appliquée est sautée, une nouvelle est appliquée une seule fois, le journal reçoit un insert, PostgREST est rechargé · **chemin de refus prouvé** : avec une migration destructrice dans le lot, code de sortie non nul et **zéro** migration appliquée, y compris la légitime · garde-fou vérifié sur 5 fichiers (`drop table`, `delete from`, `TRUNCATE` majuscule, `drop policy` autorisé, commentaire piégeux ignoré).

⚠ Non exécuté contre une vraie base : Docker Desktop n'était pas démarré sur le poste. Le premier `erp-docker.sh maj` sur la VM affichera le résultat des migrations — c'est là que ça se confirmera.

## 2026-09-09 — Droits instantanés · nomenclature · OAS au prix · proforma en compta

### 1. Les droits s'appliquent sans reconnexion

Le jeton de session dure **12 h** et le middleware ne relisait jamais la base : les droits étaient gelés au login. Désormais le jeton ne prouve plus que l'**identité**, les **droits** sont relus dans `salaries` (cache d'isolate de 8 s, invalidé immédiatement après une modification RH). Un changement s'applique en quelques secondes, dans les deux sens. Désactiver un compte ou supprimer un salarié **éjecte la session**.

> ⚠ **Piège majeur désamorcé.** Une première version concluait « salarié supprimé » dès que la lecture renvoyait `null` — or **supabase-js ne lève jamais d'exception** : il renvoie `{data:null, error}`. Le moindre hoquet réseau, 5xx ou auto-pause du projet Supabase aurait donc supprimé le cookie de **tous** les utilisateurs et renvoyé l'atelier entier au login, sans possibilité de se reconnecter (`/api/login` lit aussi `salaries`). `getDroitsSalaries()` distingue maintenant explicitement l'échec de l'absence ; en cas d'échec on garde les droits du jeton. Vérifié en pointant l'application sur une base injoignable.

Le cache porte la **table entière** et non une ligne par personne : la latence domine, lire 36 lignes en projection légère coûte le même aller-retour qu'une seule ligne — une requête par isolate et par TTL, quel que soit le nombre de connectés.

### 2. Nomenclature : un seul bouton d'enregistrement — et il fonctionne

« Enregistrer brouillon » retiré. Restent **Enregistrer** (progression sauvegardée, on **reste** dans la nomenclature, elle demeure dans « à faire ») et **Enregistrer et valider** (elle rejoint les nomenclatures faites). Les deux jeux de boutons — en-tête et panneau latéral — sont alignés, et le sous-onglet « Brouillons à traiter » devient « **En cours — à valider** ».

**Pourquoi le bouton ne fonctionnait pas — deux défauts cumulés :**
1. Il **quittait le formulaire** une seconde après l'enregistrement pour retourner à la liste.
2. L'identifiant renvoyé par le serveur n'était **jamais récupéré** : le deuxième enregistrement repartait en création et, le serveur n'écrasant que les *brouillons* de même réf+indice, un enregistrement « en cours » créait un **doublon**.

### 3. Traitement OAS : un prix, jamais un temps

Quand l'étape de gamme est un traitement de surface (détection calquée sur celle du planning : drapeau `est_oas`, activité OAS, poste OAS, ou intitulé évoquant oxydation / anodisation / Surtec / chromatation / passivation), les **quatre champs de temps sont grisés** et un champ **prix** apparaît. Les temps déjà saisis sont remis à zéro pour qu'aucun coût horaire résiduel ne s'ajoute au prix.

C'est cohérent avec le reste de la chaîne : une étape OAS **ne produit aucun bon de travail** (la cascade la saute), elle est facturée au bain et non à l'heure. Le coût emprunte le chemin déjà éprouvé des étapes forfaitaires — `max(forfait ; qté × prix unitaire)` — donc il entre dans le CRU sans qu'aucun consommateur ait à changer. **9 cas** vérifiés, dont la non-régression des étapes internes, sous-traitées et en millièmes d'heure.

### 4. Quantité à commander dans le bon de commande

Nouveau champ à côté de la référence, pré-rempli depuis la demande et **modifiable** — on peut commander plus que le besoin (lot minimum, conditionnement). Sur une demande fusionnée, il affiche la **somme** et le détail ligne par ligne. Si la demande porte un texte non numérique (« 2x3 »), l'écran le dit et laisse saisir. La quantité saisie fait foi pour la réception totale.

### 5. Comptabilité : liste Proforma (fournisseurs et sous-traitants)

Cinquième sous-onglet de « Régler », en **quatre étapes** qui suivent le circuit réel :

| | |
|---|---|
| **1. À payer** | Le bon de commande est bloqué tant que le règlement n'est pas fait |
| **2. Payées — livraison attendue** | Le BC est libéré et part chez le fournisseur |
| **3. Reçues — facture à joindre** | La marchandise est arrivée : bouton **Joindre la facture** (la facture définitive n'arrive qu'à la réception) |
| **4. Complètes** | Payée, reçue, facture au dossier |

**Aucune colonne dédiée** : l'état se déduit de trois faits déjà en base — la facture proforma existe sous l'identifiant déterministe `FF-<bcId>`, le BC porte `attente_paiement` tant qu'elle n'est pas réglée, et la facture définitive est une pièce jointe GED sous `BC:<bcId>`.

### 6. Dates de réception modifiables depuis les listes de BC

La date d'arrivée prévue devient cliquable dans « À réceptionner » et dans « En attente de validation fournisseur » (nouvelle colonne). Elle passe par **la même route que le planning**, donc par le même **gel de la première date prévue** (`date_livraison_initiale`) : la ponctualité (OTD) reste honnête quel que soit l'endroit où l'on a cliqué.

### Bugs d'échappement corrigés au passage

`RETOURS_JSON` faisait `.replace(/</g, '<')` — écrite en simple antislash, la séquence est résolue à la compilation et le remplacement devient un **no-op silencieux** ; `BC_JSON` n'échappait rien du tout. Un `<` dans un libellé aurait cassé le `<script>` de la page Expéditions.

### Vérification

`tsc` 0 erreur · build ✓ · harnais **61 PASS / 0 FAIL** · droits vivants prouvés **sans reconnexion** sur un salarié de test (ouverture, retrait, menu, compte désactivé) · **6 contrôles base injoignable** (personne n'est déconnecté) · **9 cas** sur le moteur de coût OAS · **11 + 5 contrôles** sur les états proforma · ligne de test supprimée à chaque fois.

### Migration

**Aucune.** Les six demandes passent sans DDL.

## 2026-09-09 — Préparation technique par lot · demandes d'achat modifiables et fusionnables à la main

### 1. Préparation technique : le site et le lot, enfin visibles

La liste affiche une colonne **Site** (Seem / Semrac) et le **lot** sous la pièce, avec deux boutons de filtre par site et leur compteur.

La table `preparations_techniques` ne porte **ni** l'un **ni** l'autre. Les deux sont donc **déduits, sans migration** : le site par la nomenclature (`code_ref_produit` → `entite`, repli sur la DT — c'est exactement la formule qui alimente `bons_de_travail.activite`), le lot par le couple `(commande, pièce)` — `lots.piece` et `preparations_techniques.piece` sont écrits depuis la **même expression source** dans la cascade, la correspondance est exacte.

### 2. La production ne se bloque plus par affaire, mais par lot

**Changement de comportement, décidé explicitement.** Jusqu'ici une seule préparation en attente gelait au planning **tous** les BDT de l'affaire, y compris ceux de pièces parfaitement prêtes. Le blocage porte désormais sur le **lot** : sur une affaire de trois pièces dont une seule attend son plan, les deux autres partent en fabrication.

- Point d'entrée unique `bdtBlocage(bdt, prepRows)` : les deux consommateurs (`/production/service` et `/production/gantt-bdt`) dupliquaient jusqu'ici la même expression de filtrage.
- **Repli conservateur** : une préparation sans commande ni pièce (ligne ancienne) bloque encore toute son affaire — aucune régression possible.
- **Lecture métier** : la fiche affaire porte une colonne **Fabricable** par lot, le motif du blocage, et un compteur « N prêt(s) · M en attente ».

### 3. Demandes d'achat : modifiables, et retirables du front

| | |
|---|---|
| **Modifier** | `POST /api/achats/da/:id/editer` — sur les demandes **libres comme automatiques**. Route distincte du PATCH existant, qui sert au brouillon de BC et force `statut='brouillon'`. |
| **Rattachement verrouillé** | Sur une demande **automatique**, `num_affaire` / `cmd_ref` restent en lecture seule : ils portent la porte « matière reçue » et le coût de l'affaire. |
| **Retirer** | `POST /api/achats/da/:id/masquer` — « du front, pas de la DB » : la ligne est masquée, jamais supprimée. Refusé sur une demande automatique. |

⚠ Le prédicat `daMasquee(d)` a été branché sur **tous** les lecteurs de `demandes_achat` : page Achats, liste transverse, tableaux de bord — et surtout **`autoReappro`**, dont la déduplication par libellé aurait sinon **gelé à vie** le réapprovisionnement automatique de la référence retirée.

### 4. Fusion de demandes d'achat : choisie à la main

Le bouton « Regrouper par fournisseur » (qui fusionnait **automatiquement**, sans choix) devient **« Fusionner les DA cochées »**. On coche, une fenêtre récapitule, on valide.

- **Règle métier : un seul fournisseur.** Une fusion ne donne qu'une commande. Deux fournisseurs distincts → refus, annoncé dès la fenêtre. Les demandes sans fournisseur héritent de l'unique fournisseur du lot ; si aucune n'en porte, la fenêtre le demande.
- **Commune à deux affaires.** ⚠ `num_affaire` reste **TOUJOURS scalaire** : c'est la clé d'égalité stricte de la porte matière et du calcul de coût — une valeur composite gèlerait `matiere_ok` à `false` et ferait disparaître les BDT des **deux** affaires du planning. L'affaire porteuse reste dans `num_affaire`, les autres voyagent dans les **lignes du bon de commande**, et la réception ouvre la porte matière de **chaque** affaire servie.
- **Réversible** : bouton défusionner, tant que le BC n'est pas émis.
- **Aucune migration** : la composition vit dans `demandes_achat.bc_draft` — sondé, c'est du **jsonb** (le dump la déclarait `text`).

### 5. Doublons des Expéditions — la réponse

**Le doublon visible vient des données, pas du code.** Cinq lignes de test partagent le même `num_bc` « BC-TESTARB » ; deux d'entre elles tombent dans la même file et s'affichent à l'identique. Sur 8 bons de commande en base, **7 sont des déchets de test**. `bons_livraison` est vide, donc l'onglet Envois n'affiche rien.

Deux **vrais** chevauchements de files ont tout de même été corrigés, invisibles aujourd'hui faute de données :
1. *Réceptions › Retours de sous-traitance attendus* retenait les BDS **pas encore partis**, déjà listés dans *Envois*.
2. *Envois › Commandes prêtes à expédier* gardait les commandes **dont le BL est déjà préparé** — ce qui invitait à créer un **second** BL pour la même expédition.

### Migration

**Aucune n'est nécessaire.** `scripts_import/prepa_site_lot_schema.sql` est fourni et **optionnel** : il ne fait que figer le site et le lot à la création plutôt que de les déduire.

### Vérification

`tsc` 0 erreur · build ✓ · harnais **61 PASS / 0 FAIL** (une régression d'échappement attrapée et corrigée au passage) · **10 cas** sur la goulotte par lot · **11 gardes serveur** (fusion, édition, retrait) · **fusion écrite puis défaite en base réelle**, état initial restauré à l'identique et vérifié champ par champ · **11 contrôles de rendu** sur les lignes et les boutons · contrôles navigateur sur les données réelles (site Semrac et lot LOT-2026-0001-01 déduits, verdicts de fusion, verrouillage du rattachement).

## 2026-09-09 — Référence du matériel dans le BC issu d'une demande d'achat

**Demandé** : « en plus de la désignation il faut surtout mettre la réf du matériel à commander, avec les fournisseurs qui ont cette réf dans le catalogue. »

### Ce que faisait la version précédente

La fenêtre « Traiter la DA → Bon de Commande » n'avait qu'un champ *Articles / Prestation* en texte libre. Un filtrage des fournisseurs existait déjà, mais il travaillait sur ce texte, par **inclusion dans les deux sens** sur la référence **ou** la désignation — une référence courte comme `A2` « correspondait » à `A2024`.

Sondé sur les données réelles : sur les **3 demandes d'achat en base, ce filtre ne renvoyait aucun fournisseur** (0, 0, 0). Il ne servait donc à rien.

### Décision de conception — aucune colonne ajoutée

`demandes_achat` n'a pas de colonne `reference`, et il n'en a **pas été créé**. La référence n'est pas une donnée que la demande transporte : sur les 7 générateurs de demandes du dépôt, 4 ne produisent que du texte libre — la colonne serait restée vide partout. C'est une donnée que **l'acheteur arrête au moment de commander**, au catalogue. Elle est saisie dans le formulaire et voyage dans `bons_de_commande.lignes` (jsonb, déjà présente). **Lot sans migration.**

### Ce qui a été fait

| | |
|---|---|
| **Deux champs** au lieu d'un | *Référence du matériel* + *Désignation*, avec une liste de choix des 143 références du catalogue (libellées par leur désignation) |
| **Fournisseurs qui portent la référence** | Égalité **stricte** sur `produits_fournisseurs.reference`, groupés en tête avec **leur désignation catalogue** ; porteur unique présélectionné |
| **Pré-remplissage honnête** | Brouillon → référence exacte → désignation exacte → **vide**. Jamais de référence inventée hors catalogue ; quand elle est déduite, l'écran l'annonce « déduite — à vérifier », mention qui disparaît dès que l'acheteur saisit lui-même |
| **Repli conservé** | Sans référence, l'ancien rapprochement approximatif s'applique — mais son libellé ne ment plus : « Proches de … (rapprochement approximatif) » au lieu de « Référencés pour … » |
| **PDF du BC** | Nouvelle colonne *Référence* : le fournisseur reçoit enfin le code du produit (tiret si absente) |
| **Réception → stock** | L'entrée en stock s'apparie d'abord sur `lignes[0].reference`, avant de retomber sur le libellé libre. Le code lisait jusqu'ici `bc.ref_stock`, **colonne qui n'existe pas** en base |

### Trois bugs adjacents corrigés au passage

- `#bc_affaire` était affecté **deux fois** dans `achOpenBC`, la seconde écrasant le repli « demande libre » (`LIBRE-XXX`) par une chaîne vide.
- `da.num_affaire` était lu alors qu'il ne figurait pas dans la projection `DA_JSON` → toujours `undefined`. Ajouté (cf. la règle de projection ci-dessous).
- `DA_JSON` utilisait `JSON.stringify` brut là où tout le fichier passe par `sjX()` ; aligné.

### Ce que le catalogue permet réellement — à savoir avant d'utiliser la fonction

Sonde du 09/09/2026 sur `produits_fournisseurs` : **144 lignes, 143 références distinctes, 31 fournisseurs**. Une **seule** référence est portée par deux fournisseurs (`510056`), et c'est une **anomalie de données** — deux produits différents sous le même code (TTA « EXAFLUID AL 100 » / QUAKER « QUAKERCOOL 7200 HBFF ») — pas du multi-sourcing. Prix renseignés : **2/144**. Délais : **0/144**.

Conséquence assumée : la liste « fournisseurs qui portent cette référence » renverra presque toujours **un seul** nom. La fonction est correcte ; c'est le catalogue qui est mince. Le montant n'est volontairement **pas** pré-rempli depuis le catalogue — ce serait un chiffre faux 99 fois sur 100.

### Vérification

`tsc` 0 erreur · build ✓ · harnais **61 PASS / 0 FAIL** · 9 cas d'interface rejoués **dans le navigateur sur les données réelles** (pré-remplissage, porteur unique, deux porteurs, référence inconnue, BC sous-traitant, saisie manuelle, espaces parasites, repli sans référence, payload envoyé) · **7 contrôles serveur** sur le PDF, dont la **non-régression de 6 bons de commande existants** (colonne présente, tiret quand la référence manque, aucun « undefined »).

## 2026-09-09 — Les droits d'accès par service ne tenaient pas (et s'effaçaient tout seuls)

**Signalé** : « je coche des cases, je valide, je reviens : plus rien n'est coché. »

### La cause — une projection tronquée

La fiche salarié se remplit depuis un tableau JS `RH_EMPS` projeté côté serveur. Cette projection listait 21 champs, **sans `autorisations`**. `rhOpenFiche()` lisant `e.autorisations`, la valeur était toujours `undefined` → `_cocher()` **décochait activement** toutes les cases à chaque ouverture.

Les droits étaient pourtant bien enregistrés en base et bien appliqués par le RBAC : c'est l'affichage qui mentait.

### L'effet de bord, plus grave que le symptôme

`rhSaveFiche()` recalcule les jetons **depuis les cases affichées**. Comme elles revenaient vides, **tout ré-enregistrement de la fiche effaçait en base les accès déjà accordés** — y compris un enregistrement fait pour une tout autre raison (corriger un téléphone, un poste, un solde de congés). Perte de données silencieuse, sans le moindre message d'erreur.

### Corrigé

| # | Correctif | Fichier |
|---|---|---|
| 1 | `autorisations` ajouté à la projection `RH_EMPS` | `rh_service.tsx` |
| 2 | `POST /api/rh/salarie` ignorait `acces_services` : les cases cochées **à la création** n'étaient jamais écrites | `index.tsx` |
| 3 | Helper `jetonsAccesServices()` factorisé, la fusion sort du bloc conditionnel des rôles, et décocher une case **retire** réellement le droit | `index.tsx` |
| 4 | `sexe` / `oeth` / `date_sortie` absents de `mapSalarieToEmploye()` — **même bug, mêmes conséquences** sur les données sociales RSE | `index.tsx` |
| 5 | Contrat : le select proposait `Apprenti`/`Interim`/`Stage`, la base stocke `apprenti`/`interim`/`stagiaire` → le champ revenait vide puis basculait en CDI au ré-enregistrement | `rh_service.tsx` |
| 6 | `parseFloat(…)||null` transformait un **taux horaire à 0** en valeur vide ; un solde vide donnait `NaN` | `rh_service.tsx` |

### Les cases mentaient aussi sur trois services

`canAccess()` traitait `plans`, `habilitations` et `interlocuteurs` **avant** de lire les jetons. Conséquences réelles :

- cocher ou décocher **Plan / Bâtiment** n'avait strictement aucun effet ;
- fermer la RH par les cases laissait **`/rh/habilitations` et les certifications grandes ouvertes** ;
- fermer le Commercial laissait l'accès aux **contacts clients et fournisseurs**.

Les jetons sont désormais évalués **en tête**, avant tous les cas particuliers, et `navServices()` suit la même règle — le menu ne peut plus diverger des droits réels.

### Deux trous d'accès trouvés au passage

- **`/dashboard/environnement`** n'était pas dans `DASHBOARD_SERVICE` : il retombait en « page inconnue » et s'ouvrait à **tout compte connecté**, y compris à qui on avait explicitement refusé l'Environnement.
- **« Tableaux de bord »** disparaissait de la sidebar pour **tout le monde** : son `data-svc` déduit de l'URL valait `dashboard`, qui n'existe pas dans `MENU_SERVICES`. `SIDEBAR_ITEMS` accepte désormais un `svc` explicite.

### Deux limites assumées, signalées dans l'interface

- **Rôle Direction** : le jeton `all` court-circuite tout. Les cases sont enregistrées mais sans effet — la fiche affiche maintenant un avertissement quand ce rôle est choisi.
- **Prise d'effet** : `perms` est figé dans le cookie de session à la connexion. Un changement de droits ne s'applique qu'à la **prochaine connexion** de la personne (jusqu'à 12 h), dans les deux sens. Non corrigé : cela suppose une version de droits vérifiée à chaque requête.

### Vérification

`tsc` 0 erreur · build ✓ · harnais **61 PASS / 0 FAIL** · **36 cas RBAC** dont un contrôle de cohérence menu ↔ `canAccess` sur **75 couples** (5 profils × 15 services) · **13 contrôles d'aller-retour** rejouant `_cocher()` et `rhSaveFiche()` sur la page réellement rendue.

> **Règle à retenir** : toute projection `sjX(rows.map(…))` qui alimente un formulaire doit contenir **tous** les champs que ce formulaire ré-enregistre. Un champ absent n'est pas « seulement pas réaffiché » — il est **écrasé au prochain enregistrement**.

## 2026-09-09 — Correctif : `erp-docker.sh` pilotait une AUTRE stack que `install.sh`

- **Symptôme sur la VM** : `erp-docker.sh maj` échouait sur `Conflict. The container name "/erp-kong" is already in use`, précédé de `a network with name erp-seem-semrac exists but was not created for project "erp-seem-semrac"` — et surtout de trois lignes **`Volume … Created`**.
- **Cause** : le nom de projet Compose divergeait entre les deux scripts.

| | Nom de projet |
|---|---|
| `docker-compose.yml` déclare | `erp-seem-semrac` |
| `install.sh` l'écrasait avec | **`erp`** ← la stack a été créée là |
| `erp-docker.sh` ne le fixait pas → retombait sur | `erp-seem-semrac` |

- **Gravité réelle** : le nom de projet rattache les conteneurs **et les volumes**. Compose ne retrouvait donc ni les uns ni les autres et s'apprêtait à démarrer sur des **volumes neufs, vides** — une base sans données. Le conflit de nom sur `erp-kong` a interrompu l'opération avant ce point ; sans lui, la stack serait repartie vierge en apparence, les données restant en réalité dans les anciens volumes.
- **Correctif** : `erp-docker.sh` et `erp-docker.ps1` fixent désormais `COMPOSE_PROJECT_NAME=erp` par défaut, comme `install.sh`. Le commentaire est posé dans les trois scripts et dans `12-docker-installation.md` : ces noms ne doivent jamais diverger.
- **Amorçage** : la VM tournait encore sur l'ancien script, sans la commande `maj` — d'où l'aide affichée au lieu d'une mise à jour. Un `git pull` manuel est nécessaire **une fois** pour installer un script qui se met ensuite à jour lui-même.

## 2026-09-09 — Droits en cases à cocher · rôles supplémentaires retirés · gamme élargie

### 1. Nomenclatures — la colonne des process gagne en largeur
Les deux colonnes étaient à `1fr 1fr`. La gamme porte **10 colonnes** depuis l'ajout de ROP/RGM et se retrouvait à l'étroit ; la colonne de gauche n'est que de la saisie de champs. Réparti en `minmax(340px, 0.78fr)` / `minmax(0, 1.22fr)` : le `minmax` garantit que la colonne gauche ne se tasse pas sous 340 px et que la droite peut se rétracter sans déborder.

### 2. Fiche salarié — cases à cocher au lieu des listes multiples
- **Demande** : « pour les définir on appuie sur une petite case à gauche ; si on met quelqu'un en écriture le champ lecture se coche aussi ou n'a plus besoin d'être marqué ; l'inverse n'est pas vrai. »
- Les deux `<select multiple>` (qui imposaient Ctrl+clic) deviennent un **tableau des 15 services**, chacun avec une case *Lire* et une case *Écrire*.
- **Cocher Écrire coche Lire et la verrouille** — on ne peut pas écrire sans lire. Décocher Écrire libère la lecture. Pas de réciproque : on lit sans écrire, et on peut faire passer quelqu'un de la lecture à l'écriture.
- L'alignement est appliqué **à l'ouverture de la fiche** aussi, pas seulement au clic : un salarié déjà en écriture s'affiche correctement.

### 3. Rôles supplémentaires retirés
Le bloc **« Rôles supplémentaires »** disparaît de la fiche : l'accès se définissant service par service, le cumul de rôles n'a plus d'objet. Le **rôle principal** reste — il fixe le métier et l'entité, et sert de repli quand aucun service n'est coché.

### Vérification
`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL** · pages servies depuis Docker : `/rh/employes` (15 services avec leurs deux cases, règle écrire→lire présente, ancien bloc bien absent, **5 scripts valides**) et `/be/service` (nouvelle répartition des colonnes).

## 2026-09-09 — Droits par service sur la fiche salarié · validation de la préparation technique

### 1. Deux listes déroulantes de droits, par employé
- **Demande** : « deux listes déroulantes, une pour lecture et une pour écriture, pour choisir ce qu'une personne peut lire ou écrire dans l'ERP ; dans cette liste il y a tous les services et on peut choisir plusieurs cases ».
- **RH › Employés** porte désormais **Peut LIRE** et **Peut ÉCRIRE**, deux listes à sélection multiple couvrant les **15 services**. Rangées dans `salaries.autorisations` (déjà `jsonb`) sous forme de jetons `lire:<service>` / `ecrire:<service>` — **aucune migration**.
- `ecrire:<svc>` implique `lire:<svc>` : inutile de cocher un service des deux côtés.
- **Règle appliquée par `canAccess()`** : Direction (`all`) garde l'accès total ; puis, **dès qu'un jeton existe, ces listes font foi** et remplacent la matrice des rôles — elles peuvent donc **ouvrir** un service comme en **fermer** un que le rôle accordait. Sans aucun jeton, la matrice s'applique exactement comme avant. `navServices()` suit la même règle : le menu latéral reflète les droits réels.
- **Vérifié par 10 cas** : comportement historique préservé sans jeton (3 cas), ouverture en lecture puis en écriture, écriture impliquant la lecture, fermeture d'un service ouvert par le rôle, Direction jamais restreinte, filtrage du menu. Les 10 passent.

### 2. Validation de la préparation technique
- **Demande** : « on veut pouvoir valider cette prépa technique et qu'elle aille dans la liste des prépa techniques faites, et que les infos arrivent dans la nomenclature de la pièce associée. Une fois validée c'est l'une des deux conditions pour envoyer en production, avec les bons de commande associés à un lot rentrés en stock. »
- Bouton **« Valider la prépa »** sur `/be/preparation` : il enregistre d'abord (plan + codes programme → nomenclature), puis appelle `POST /api/nomenclature/:id/prepa-validee`, qui passe à **`faite`** toutes les lignes de `preparations_techniques` portant la même référence produit, et renvoie les affaires débloquées.
- **Refus 409** si le plan manque ou si une étape CNC est sans code programme : on n'ouvre pas la porte de production sur une prépa vide.
- **La porte de production existait déjà** et consommait exactement ces deux conditions — la validation était le maillon manquant :
```
bdtsPrets = bdts.filter(b => b.matiere_ok !== false && !affPrepaOpen.has(b.num_affaire))
                              ^ BC du lot réceptionnés     ^ aucune prépa au statut ≠ 'faite'
```
- La **remontée vers la nomenclature était déjà en place** (`POST /api/nomenclature/:id/programmes`) : n° de plan, fichier et codes programme par étape sont déversés dans `etapes_production` et imprimés sur l'OF.

### Vérification
`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL** · pages servies depuis Docker : `/rh/employes` (les deux listes, 15 services, **5 scripts valides**) et `/be/preparation` (bouton et fonction de validation). 10 cas d'autorisation exécutés contre le moteur réel.

## 2026-09-09 — Nomenclatures : deux temps de réglage, ROP (homme) et RGM (machine)

- **Demande** : « dans les nomenclatures, il faut mettre deux temps de réglages, le temps réglage homme (ROP) et le temps réglage machine (RGM), en millièmes d'heures ».
- La gamme n'avait qu'**un seul** temps de réglage, imputé **soit** à l'opérateur **soit** à la machine selon la ressource de l'étape — jamais aux deux. Or un réglage mobilise couramment un homme **et** une machine en même temps : la moitié du coût échappait au chiffrage.

| | ROP — réglage opérateur | RGM — réglage machine |
|---|---|---|
| Imputé au | **taux main d'œuvre** | **taux machine** |
| Formulaire BE (minutes) | `temps_reglage_min` | `temps_reglage_machine_min` |
| Gamme importée (millièmes) | `temps_reglage_op_mille` | `temps_reglage_machine_mille` |

Les deux restent des **coûts fixes par lot**, jamais multipliés par la quantité produite.

### Aucune migration de base
Les étapes vivent dans la colonne `nomenclatures.etapes_production` (jsonb) : les nouveaux champs s'ajoutent au JSON, rien à faire côté schéma — ni sur le cloud, ni sur Docker.

### Compatibilité ascendante — le point sensible
Requalifier le champ historique aurait **déplacé le coût de réglage** des 318 nomenclatures importées, silencieusement. `etapeDecomp()` ne bascule donc sur la répartition explicite **que si l'un des deux nouveaux champs est renseigné** ; sinon il applique exactement l'ancienne règle.

**Vérifié par 7 cas de non-régression** exécutés contre le moteur réel : étape machine et étape homme en ancien format (coûts **identiques** à avant), ROP+RGM, ROP seul, RGM seul, et les deux formes minutes. Les 7 passent.

### Portée des modifications
`src/shared.ts` (`etapeDecomp`, moteur de coût canonique) · `src/types.ts` · `src/be.tsx` (4ᵉ colonne de temps dans la gamme, totaux, coûts du formulaire, dérivation des gammes importées) · `src/index.tsx` (analyse DT, helper `reglageMilleTotal`, temps machine) · `src/prod.tsx` (OF).

`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL** · écran BE servi depuis Docker avec les colonnes ROP et RGM.

## 2026-09-09 — Préparation technique : plan et programme CN chargés par un sélecteur de fichier

- **Demande** : « le plan et le fichier du code doivent se charger avec le bouton qui permet d'aller chercher dans les fichiers, tout simplement. Le nom doit se remplir en fonction du nom du plan. »
- Les champs *Fichier plan / CAO* et *Fichier programme* étaient des **zones de texte à saisir à la main** : on tapait un nom de fichier qui n'était rattaché à rien.
- Chacun reçoit désormais un bouton **« Parcourir »** ouvrant le sélecteur de fichiers. Le fichier part en GED, rattaché à la **nomenclature** (`plan_cao` pour le plan, `programme_fao` + `etape_ordre` pour un programme CN) — ce qui lève `manque_plan` / `manque_code_cnc` sur la préparation technique.
- **Remplissage automatique** : le nom du fichier alimente le champ *Fichier* ; le nom **sans extension** pré-remplit le *N° de plan* / *N° programme* **uniquement s'il est vide** — une valeur saisie volontairement n'est jamais écrasée. Un lien « ouvrir » s'affiche sous le champ dès l'envoi réussi.
- Aucun développement serveur : la route `/api/ged/upload` acceptait déjà `nomenclature_id`, `categorie` et `etape_ordre`.

### Un bug d'échappement attrapé avant livraison
La première version écrivait `onclick="document.getElementById('prep-plan-file').click()"`. Dans un `onclick` construit à l'intérieur d'une chaîne JS elle-même contenue dans un template literal, la séquence `'` est **consommée** et ne laisse qu'une apostrophe nue, qui referme la chaîne : **tout le script client de la page devenait invalide**. Ni `tsc` ni le build ne le voient, et le harnais ne couvre pas cette page (elle est en ligne dans le routeur, pas exportée comme `page*`).
Détecté en servant la page et en passant chaque `<script>` par `new Function()` — 1 script invalide sur 4. Corrigé en supprimant la cause : les boutons utilisent **`this.previousElementSibling.click()`**, sans aucune apostrophe imbriquée.

### Vérification
Page servie depuis la stack Docker : **4 scripts sur 4 valides**. Envoi réel d'un `PL-138001_A.pdf` → document créé en `plan_cao`, champ *Fichier* = `PL-138001_A.pdf`, *N° de plan* dérivé = `PL-138001_A`, fichier réellement servi (`HTTP 200`, `application/pdf`, `inline`). Document de test supprimé, contrôle à 0.
`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL**.

## 2026-09-09 — Seem-Semrac devient le dépôt principal

- **Demande** : « je veux commiter juste la dernière version de l'ERP avec tout sur Seem Semrac, et que chaque nouvelle mise à jour Seem Semrac devienne le nouveau commitement principal, à partir de maintenant et pour toujours ».
- **`Seem-Semrac/ERP-seem-semrac` est désormais `origin`.** On y committe et pousse directement : l'étape de publication séparée disparaît.

| Avant | Après |
|---|---|
| commit sur `Krmaaaaaa/ERP`, puis `publier_pro.ps1` vers Seem-Semrac, puis `maj` sur la VM | `git push`, puis `maj` sur la VM |

### Comment la bascule a été faite, sans rien perdre
Le dépôt Seem-Semrac portait déjà l'historique propre de la branche `livraison` (un commit par livraison, contenu identique à `main`). Plutôt que d'y pousser les 4,8 Go d'historique du dépôt de travail — dont la quasi-totalité n'est que des régénérations successives de captures d'écran —, c'est **cette lignée qui devient `main`** :

- ancienne `main` (277 commits) renommée **`archive-historique`**, toujours poussable vers le remote **`archive`** (`Krmaaaaaa/ERP`) ;
- `livraison` renommée **`main`**, suivant `origin/main` ;
- `origin` → Seem-Semrac, ancien `origin` → `archive`.

Vérifié avant bascule : **0 différence de fichier** entre les deux branches, **497 fichiers** de part et d'autre. Rien n'est perdu : l'historique complet reste sur `archive-historique` et sur GitHub.

### Conséquences sur l'outillage
- `scripts_doc/publier_pro.ps1` et `.sh` : **obsolètes**. Ils ne publient plus rien et se contentent de rappeler la marche à suivre.
- `erp-docker.ps1 livrer` : reconstruit en local, vérifie la santé des 8 conteneurs, puis **committe et pousse directement** (au lieu d'appeler le script de publication). La garde reste : si un conteneur ne démarre pas, **rien n'est envoyé**.
- `docs/technique/12-docker-installation.md` et `CLAUDE.md` mis en cohérence.

### Correctif inclus
`publier_pro.ps1` et `erp-docker.ps1` posaient `ErrorActionPreference = "Stop"` : en PowerShell 5.1, la moindre ligne écrite par git sur **stderr** devient une erreur fatale. Un avertissement anodin (« unable to find all commit-graph files ») suffisait à interrompre la publication **avant le premier contrôle**. Les scripts passent en `Continue` et testent `$?` explicitement. Le commit-graph corrompu du dépôt a par ailleurs été reconstruit, ce qui supprime l'avertissement à la source.

## 2026-09-08 — BC : rattachement à une affaire, facture en pièce jointe — et la GED réparée

### Deux bugs bloquants découverts en implémentant — le dépôt de fichier ne fonctionnait pas
`createDocument()` n'alimentait **ni `id` ni `actif`**, alors que ces colonnes n'ont **aucune valeur par défaut** :
1. `null value in column "id" of relation "documents" violates not-null constraint` — **tout envoi de fichier échouait** ;
2. une fois le premier point corrigé, le document s'insérait avec `actif` à NULL, or `getDocumentsForNom()` filtre sur `actif = true` : **le fichier existait en base mais restait introuvable**, sans le moindre message d'erreur. C'est le pire des deux — un échec silencieux.

Corrigé côté application (identifiant, `actif`, `uploaded_at` posés à l'insertion) plutôt qu'en s'appuyant sur un défaut de base : la correction vaut pour le cloud comme pour Docker, sans migration.

### 1. Rattacher une demande libre à une affaire
Le N° d'affaire redevient **modifiable**, avec une liste de suggestions des affaires connues (hors références `LIBRE-`). La valeur saisie prime sur celle héritée de la DA, ce qui permet de rattacher a posteriori un achat libre à une affaire réelle.

### 2. Facture du fournisseur en pièce jointe
Champ fichier (PDF ou image) dans le formulaire de traitement. Le document part en GED **après** création du BC, sous `BC:<bcId>` / catégorie `facture_fournisseur`. Si l'envoi échoue, le BC reste créé et l'utilisateur est averti — l'échec du fichier ne fait pas perdre la saisie.

### 3. Ouvrable depuis les factures fournisseurs
Comptabilité › Factures fournisseurs affiche un bouton **Facture** sur les lignes qui en ont une, pointant sur `/api/ged/file/:id`. Le rapprochement se fait sans colonne de liaison : la facture proforma porte l'identifiant `FF-<bcId>`, le document la référence `BC:<bcId>`.

### GED générique
`POST /api/ged/upload` accepte un champ **`ref`** (ex. `BC:BC-2026-002`) en remplacement de `nomenclature_id`, et `GET /api/ged/ref/:ref` liste les documents d'un objet quelconque. Le préfixe évite toute collision avec un identifiant de nomenclature ; le chemin de stockage assainit les caractères interdits.

### Vérification — circuit complet en conditions réelles
Sur la stack Docker : DA `-TEST-` **sans affaire** → traitée en Proforma avec rattachement à l'affaire **2026-081** (repris correctement sur le BC) → BC en `attente_paiement` + facture `FOURN-2026-0001` → PDF joint → **document retrouvé par la route `ref`** → **bouton *Facture* présent en Comptabilité** → fichier réellement servi : `HTTP 200`, `content-type: application/pdf`, `content-disposition: inline`, contenu intact. Données de test intégralement supprimées (document, DA, BC, facture, 3 écritures) — contrôle à 0 sur cinq tables.
`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL**.

## 2026-09-08 — Bon de commande : mode de règlement, Proforma fournisseur, affaire auto-renseignée

### Bug préexistant corrigé — la saisie de facture fournisseur ne fonctionnait plus du tout
`POST /api/factures-fournisseur` envoyait une colonne **`bc_id` qui n'existe pas** sur `factures_fournisseur` : **toute** création échouait sur `PGRST204`. Prouvé par un appel réel avant correction : *« Could not find the 'bc_id' column of 'factures_fournisseur' in the schema cache »*. Le rattachement au bon de commande passe désormais par les **notes** et l'identifiant `FF-<bcId>` — aucune migration requise, la correction vaut aussitôt pour la base cloud comme pour Docker.

### 1. Mode de règlement sur le bon de commande
`MODES_FACTURATION` est exportée depuis `src/commercial.tsx` et partagée avec les Achats : le BC propose **exactement la même liste que les offres**, Proforma comprise. Stocké dans `bons_de_commande.conditions_paiement`.

### 2. Proforma sur un BC — payer avant expédition
Symétrique du proforma client, dans l'autre sens :
1. à la création du BC, une **facture fournisseur** est émise (`FF-<bcId>`, statut `a_valider`, écriture d'achat générée) et arrive dans Comptabilité ;
2. le BC prend le statut **`attente_paiement`** — absent de `_bcEmise`, il **ne figure pas** dans les réceptions à venir ;
3. au règlement de la facture, `libererBcProforma()` repasse le BC en `envoye`, qui rejoint les réceptions.

Aucune modification de `_bcEmise` n'a été nécessaire : le nouveau statut en est naturellement exclu. Un bandeau explique la conséquence dans le formulaire dès que Proforma est choisi.

### 3. N° d'affaire auto-renseigné
Repris de la DA (`num_affaire`, sinon `affaire_id`) et rendu **non modifiable** — plus de ressaisie.

### 4. Référence « LIBRE » hors affaire
`prochaineRefLibre()` attribue `LIBRE-001`, `LIBRE-002`… en se calant sur les BC existants, et la valeur est pré-remplie dans le formulaire.

### Vérification — circuit complet joué en conditions réelles
Sur la stack Docker, avec une DA `-TEST-` : traitement en Proforma → BC créé en `attente_paiement` + facture `FOURN-2026-0001` à 1 440 € TTC ; **BC absent du panneau Réceptions**, visible seulement dans Fournisseurs et Dashboard avec son statut ; facture réglée → **BC repassé en `envoye`** et **présent dans Réceptions**. Toutes les données de test supprimées ensuite (DA, BC, facture, 2 écritures comptables) — contrôle à 0 sur les quatre tables.
`tsc` 0 erreur · build OK · harnais **61 PASS / 0 FAIL**.

## 2026-09-08 — `erp-docker.ps1 livrer` : la chaîne de livraison complète, avec garde

- **Demande** : « le chemin doit être conteneurs à jour sur Docker, push sur GitHub, et une commande pour mettre à jour les conteneurs sur la VM ».
- La chaîne tient désormais en **deux commandes**, une par machine :

| Ordre | Où | Commande |
|---|---|---|
| 1 | Poste | `.\docker\scripts\erp-docker.ps1 livrer "message"` |
| 2 | VM | `~/erp/docker/scripts/erp-docker.sh maj` |

- **`livrer`** enchaîne les trois étapes du poste et s'interrompt si l'une échoue : reconstruction locale (`up -d --build`), attente que les **8 services soient sains**, puis publication via `publier_pro.ps1`.
- **La garde est le cœur de la commande** : si un conteneur ne démarre pas, **rien n'est publié**. Publier du code qui ne se lance pas localement revient à casser la VM à distance — et à devoir s'y connecter pour la réparer. Le contrôle de santé tourne jusqu'à 3 minutes, puis affiche le tableau des conteneurs et renvoie vers `logs`.
- `erp-docker.ps1` gagne au passage `stop`, `start` et `restart`, jusque-là présents seulement côté Linux : les deux scripts offrent maintenant le même jeu de commandes.
- Vérifié : parsing PowerShell sans erreur, `urls` exécuté et sortie conforme.

## 2026-09-08 — `erp-docker.sh maj` : la mise à jour de la VM en une commande

- **Demande** : « je peux envoyer la maj en une seule commande sur ma machine linux ? »
- Une seule commande par machine, c'est le minimum atteignable : le code transite par GitHub, il n'existe aucun chemin direct du poste de développement vers la VM. En revanche le côté VM, qui demandait `cd ~/erp && git pull && docker/scripts/erp-docker.sh up`, tient désormais en une ligne.

| Où | Commande |
|---|---|
| Poste de développement | `.\scripts_doc\publier_pro.ps1 "…"` |
| VM | `~/erp/docker/scripts/erp-docker.sh maj` |

- `maj` enchaîne `git pull --ff-only`, `up -d --build`, puis affiche l'état des 8 conteneurs et l'URL réelle de l'application. Le `--ff-only` est délibéré : en cas de divergence, la commande s'arrête avec un message clair plutôt que de fabriquer un commit de fusion sur un serveur.
- Le port affiché est lu dans le fichier `.env` de l'instance, et non dans l'environnement du shell — sans quoi l'URL aurait été fausse dès qu'`APP_PORT` diffère de 3000.
- Documentation `12-docker-installation.md` consolidée : les trois passages qui décrivaient la mise à jour de trois façons différentes sont ramenés à un seul.

## 2026-09-08 — Achats : fournisseur filtré par la référence de la DA · Commercial : règlement « Proforma »

### 1. Traitement d'une DA — le fournisseur devient une liste filtrée
- **Demande** : « sur la case fournisseur on doit pouvoir choisir dans une liste déroulante et selon les fournisseurs disponibles pour la réf de produit sous-jacente, parce que la DA est initiée en demandant une réf de produit à avoir ».
- Le champ *Fournisseur / ST* de la fenêtre de traitement d'une DA était une **saisie libre** (`<input type="text">`). Il devient un **`<select>` alimenté depuis le catalogue `produits_fournisseurs`**, déjà chargé par la route — aucune requête supplémentaire.
- Deux groupes : **« Référencés pour \<article\> »** en tête (les fournisseurs qui portent réellement la référence), puis **tous les autres**. Si la référence n'est au catalogue de personne, le second groupe est titré « Aucun fournisseur référencé pour cette référence » — aucune DA ne se retrouve bloquée. Une valeur déjà enregistrée hors catalogue est conservée et signalée « hors catalogue ».
- Rapprochement souple sur la **référence OU la désignation**, insensible à la casse et aux inclusions partielles.
- `pageServiceAchats` gagne un paramètre `dbCatalogue` ; nouvelles fonctions client `achFournPourRef()` et `achRemplirFourn()`.
- **Vérifié sur les données réelles** (144 entrées catalogue, 174 fournisseurs) : « Tôle ALU 3000x1500x1 peint RAL 7035 » → ARCELOR ; « Écrou CLS M3-1 » → BOSSARD ; un article de test hors catalogue retombe correctement sur la liste complète.

### 2. Mode de règlement « Proforma » — le paiement conditionne l'engagement de dépense
- **Demande** : « quand la demande est acceptée, l'offre de prix part directement en facturation client et la facture doit être au statut réglée avant d'envoyer les demandes d'achats et préparations techniques automatiques associées ».
- L'option **Proforma** existait déjà dans `MODES_FACTURATION` (`src/commercial.tsx:46`) mais n'avait **aucun effet**. Elle en a désormais un.
- `cascadeAcceptationOffre` se dédouble : si `mode_reglement` vaut *Proforma*, elle **émet une facture proforma** (rattachée à la commande, sans BL, `mode_paiement = 'Proforma'`, statut `envoyee`) et **n'appelle ni `cascadePrepaTechnique` ni `cascadeDAManques`**.
- `PATCH /api/factures/:id` avec `statut: 'payee'` déclenche `debloquerProforma()`, qui rejoue la cascade retenue. Réponse enrichie de `proforma_debloque`.
- **Lots et BDT restent créés** dans les deux cas : ils naissent en `matiere_ok = false` et demeurent donc hors planning tant que la matière n'est pas réceptionnée — ce qui suppose les demandes d'achat, donc le paiement. La porte matière existante suffit, sans logique supplémentaire.
- **Idempotence** : `creerFactureProforma` ne crée qu'une facture par commande ; `_cascadeDejaFaite()` empêche un rejeu si la facture repasse « payée » après un aller-retour de statut.

### Vérification
`tsc` 0 erreur sur les fichiers touchés · `npm run build` OK (4,12 Mo) · **harnais toutes-pages 61 PASS / 0 FAIL** · page Achats servie et inspectée : le `<select>` est rendu, le catalogue et les deux fonctions client sont injectés, le filtrage renvoie les bons fournisseurs sur les données de production.

### Documentation
Fiches modules `achats.md` et `commercial.md` complétées ; manuels utilisateur `achats.html` (règle du champ fournisseur) et `commercial.html` (encadré Proforma dans le chapitre Offre) mis à jour.

### Relevé au passage
Une DA de test subsiste en base : `DA-TESTCASC3-MATTESTXZ99-M` (« Tole test »). Elle ne respecte pas la convention de préfixe `-TEST-` et n'a pas été purgée.

## 2026-08-26 — Couverture GPAO vérifiée fonction par fonction (dossier de reprise CSE)

- **Demande** : le prestataire **CSE** reprend l'ERP sous Laravel + Nova. Le dossier doit lui dire quoi faire et dans quel ordre pour la beta (circuit client, fournisseur/ST, stock, RH), lui permettre de **budgéter**, et **prouver à la direction** que les fonctions de la GPAO Pick sont déjà dans l'ERP — en identifiant celles qui manquent. Point de départ : `SEEM-SEMRAC - Fonctionnalités.xlsx` (185 fonctions GPAO, à plat).

### Résultat retenu
**185 fonctions GPAO** = **15 sans objet** (10 artefacts du moteur Pick + 5 métiers non pratiqués) + **170 de besoin réel**, dont **90 couvertes · 62 partielles · 18 absentes**.
→ **Couverture du besoin réel : 152/170 = 89 %**, dont 53 % pleinement couvertes.

### Quatre passes, dont deux écartées — la méthode fait partie du livrable
| Passe | Résultat | Retenu |
|---|---|---|
| Estimation au libellé, par entité, sans ouvrir le code | 104 / 37 / 44 | **non** — jamais vérifiée |
| 1. Examen avec preuve exigée | 54 / 77 / 54 | trouvailles conservées |
| 2. Contre-examen adversarial (consigne : réfuter, rétrograder au doute) | 5 / 111 / 69 | **barème écarté** — 49 « Oui » sur 54 rétrogradés, 0 remonté |
| 3. Arbitrage + contrôle de calibrage | 76 % · 41 absences | **écarté** — ancré sur les avis sévères des passes 1 et 2 |
| 4. **Réexamen à l'aveugle** | **89 % · 18 absences** | **retenu** |

- **Ce qui n'allait pas** : tout l'enchaînement était ancré vers le bas. La passe 1 exigeait une preuve pour accorder un « oui », la passe 2 avait pour consigne de réfuter, la passe 3 recevait ces deux avis sévères comme point de départ. Un ERP de 96 écrans et 353 routes en production ne peut pas n'avoir que 6 fonctions pleinement couvertes.
- **Correction** : passe 4 sans aucun verdict antérieur montré aux examinateurs (suppression de l'ancrage), test centré sur la **tâche de l'utilisateur** (« peut-il faire son travail ? ») et non sur la ressemblance technique avec Pick, puis un second agent chargé de **retrouver** ce que le premier aurait manqué — **11 fonctions récupérées**, et **73 lacunes confirmées par deux recherches indépendantes**.
- Exemple de ce que les passes sévères rataient : « Actualisation des tarifs » classée absente, alors que toute la chaîne existe — catalogue de références avec écriture réelle, validation de RFQ qui écrit le prix officiel dans `produits_fournisseurs` + `ref_prix_historique`, règle de fraîcheur à 92 jours qui rebascule une référence en « à chiffrer », et le type de DT « Maj prix » qui court-circuite la nomenclature pour repartir en analyse BE.

### Les 18 absences réelles (toutes périphériques, aucune au cœur du circuit)
Table des marges sur les délais · purge des historiques · factures pro forma · édition et modification collective des tarifs clients · étiquettes d'adressage et d'expédition · copie d'une gamme modèle · **inventaire tournant** (correction et traçabilité, cycle, entrée sans attendu, saisie directe, modification manuelle des réservations) · correction d'un horaire enregistré · annulation d'une livraison fournisseur · réceptions en attente de facture · factures spéciales et leur regroupement.

### Livrables
- `docs/etudes/SEEM-SEMRAC - Couverture GPAO et plan de reprise Laravel.xlsx` — 299 lignes ; colonnes **Couverture · Nature · Circuit beta · Où dans l'ERP · Preuve · Ce qui manque · Recherches menées · Second examen**. Feuilles **Ce qui manque**, **Récapitulatif** (par lot, avec taux de couverture) et **Méthode** (rend chaque verdict contestable).
- `docs/etudes/plan-migration-laravel.html` — dossier de reprise (ordre des 13 lots L0→L12, spécification du planning BDT/BST par gestes, règles transverses, reprise de données). ⚠ **Porte encore les chiffres de la passe 3 (76 %, 41 absences) — à réaligner sur le classeur.**
- L'ancien classeur `Fonctionnalites par service (plan Laravel).xlsx` est **supprimé** (colonne de couverture non vérifiée).

### Défaut systémique trouvé pendant la vérification
Un scan du dépôt recense **36 fonctions client qui affichent une notification de succès sans émettre aucune requête**, dont **6 atteignables** : 5 dans **Stock** (« Entrée/Sortie stock enregistrée. Stock mis à jour. », « Ajustement validé. Écart tracé dans le journal. » — `panelTempsReel` et `panelGestion`, tous deux rendus) et 1 dans **RH › Gestion des Temps › Corrections**. Cela explique pourquoi les fonctions d'inventaire ressortent absentes malgré l'existence du panneau. Les boutons équivalents d'Expéditions sont eux du **code mort** : `panelBL` et `panelBC` ne sont jamais rendus. Script de scan réutilisable, à verser dans `scripts_doc/`.

- Aucune modification de code applicatif : livrables documentaires uniquement, `dist/` inchangé.

## 2026-08-25 — Étude du temps gagné : Direction 11→3 h, Commercial 11→24 h (recalcul complet)
- **Demande utilisateur** : « pour la direction disons plutôt 3 h récupérées au lieu de 11, et pour la commerciale 24 h au lieu de 11 ».
- Ces deux nombres ne se changent pas isolément : ils se propagent dans **tout** le document. Le temps *récupérable* ne pouvant excéder le temps improductif, les totaux de fonction bougent aussi — **Direction 14 → 6 h/sem** (3 récup. + 3 résiduels), **Commercial 13 → 26 h/sem** (24 + 2).

| Indicateur | Avant | Après |
|---|---|---|
| Temps improductif | 138,5 h/sem · 6 357 h/an · ≈4,0 ETP | **143,5 h/sem · 6 587 h/an · ≈4,1 ETP** |
| Temps repris | 101,5 h/sem · 4 659 h/an · ≈2,9 ETP | **106,5 h/sem · 4 888 h/an · ≈3,0 ETP** |
| Valeur du temps repris | ~148 k€/an | **~156 k€/an** |
| Taux de résorption | 73 % | **74 %** |
| Potentiel total | ~226 k€/an | **~234 k€/an** |

- **Le commercial devient le premier gisement** (24 h/sem, presque une seconde personne) : les deux graphiques et le tableau §03 ont été **réordonnés** par ordre décroissant, et le narratif §05/§06 ajusté à cette nouvelle ampleur. La Direction descend en dernière position, avec une justification explicite — l'essentiel de son temps est de l'arbitrage, pas de la consolidation.
- Tableau S/R/V/D/T/E recalculé (Direction 14→6, Commercial 13→26) et ses totaux de colonnes : S 31 · R 24 · V 39,5 · D 18 · T 23 · E 8 = **143,5**. Le second graphique suit (Recherche 28 %, Ressaisie 22 %, Reporting 17 %, Relances 16 %, Documents 13 %, Erreurs 6 %).
- Le titre « Récupérer 3 ETP sur 4 » reste exact (3,0 sur 4,1).
- Vérifié par script : **somme des barres 143,5** · **somme des récupérables 106,5** · **tableau §03 = 106,5** · ordre décroissant OK · **aucune ancienne valeur résiduelle** (138,5 / 101,5 / ~148 / ~226 / 6 357 / 4 659 / 73 % / ≈2,9 / ≈4,0 → 0 occurrence) · tous les dérivés recalculés à la main concordent avec le document.
- **Balayage exhaustif de contrôle** (demande : « t as refait tous les calculs qui vont avec ? ») — audit de **tous** les nombres du document, pas seulement des totaux. Deux imprécisions trouvées et corrigées :
  - **pourcentages du 2ᵉ graphique** : les arrondis totalisaient **102 %**. Recalculés par la méthode du plus fort reste → Recherche 27 · Ressaisie 22 · Reporting 17 · Relances 16 · Documents 12 · Erreurs 6 = **100 %**.
  - **bandeau de contexte** : « ~¼ du temps bureau » devient « **>¼** » (133,5 h bureau ÷ 14,5 ETP = 9,2 h/sem, soit 26 %).
  - Faux positifs écartés après contrôle : les « 11 » et « 13 » restants sont les lignes **Logistique** (14 h/sem, 11 récup.) et **Qualité** (13), inchangées et correctes ; le segment Atelier affiche 0 au parseur car sa barre (1 h, largeur 3,8 %) est trop étroite pour porter son chiffre.

- Artifact republié sur la même URL.

## 2026-08-25 — Copie conforme cloud ⟷ Docker
- **Demande** : « je veux une copie CONFORME entre les deux, aucun changement, la MÊME chose rigoureusement ».
- **Principe retenu** : le **cloud fait référence** (c'est la production). Le local s'aligne dessus — sauf quand le code a besoin d'une colonne absente du cloud, auquel cas c'est le cloud qu'on complète.

| Écart | Avant | Après |
|---|---|---|
| Tables | 1 | **0** |
| Volumes (lignes) | 19 tables | **0** |
| Colonnes | 7 tables | 4 tables — 7 colonnes, à jouer au cloud |

- **Côté Docker** (`scripts_import/db_conformite_local.sql`, cuit dans l'image `db`) : `import_staging` et ses 3 fonctions supprimées (aucun usage dans `src/`, absentes du cloud) ; 37 lignes de test de juillet purgées — `ecritures_comptables` (20), `factures_client` (14), `mouvements_stock` (3).
- **Côté cloud** (`scripts_import/db_conformite_cloud.sql`, à coller dans Studio → SQL Editor) : les 7 colonnes que le local a en plus. Elles ne sont **pas** supprimées en local car le code en dépend.

### 🐞 Bug de production révélé par cet alignement
`lots.updated_at` n'existe pas au cloud, or `src/queries.ts` écrit à la cascade de soldage : `update({ statut: 'termine', updated_at: … })`. PostgREST **refuse toute la requête** (PGRST204) — le lot n'est donc **jamais marqué « terminé » en production**, et l'erreur passe inaperçue car le retour n'est pas contrôlé. Vérifié par sonde `PATCH` sur un id inexistant : HTTP 400. Jouer le script cloud corrige ce bug.

### 🐞 Ordre d'exécution du socle reproductible
Les scripts d'init sont joués par ordre **alphabétique** : `zz-erp-conformite` serait passé **avant** `zz-erp-schema` et aurait échoué. Préfixes numérotés imposés : `zz1-schema → zz2-storage-policies → zz3-hygiene → zz4-conformite`.

### Preuve sur base neuve
Image `db` reconstruite et lancée dans un conteneur **jetable** à volume vide (sans toucher à la stack de travail) : **100 tables · 0 table sans RLS · 0 `import_staging` · colonnes BDT récupérées · clé primaire `edit_locks` · `demande_prix_id` en `text` · 0 fonction à `search_path` mutable**. Une stack neuve est conforme d'emblée.

- Vérifié aussi : les **17 pages** du conteneur répondent 200 après purge · `compare_bases.mjs` → **0 table, 0 volume** d'écart.

## 2026-08-25 — Base Docker : 51 erreurs Supabase corrigées, schéma remis en phase avec le cloud
- **Diagnostic de départ** (Advisors de Studio) : **129 diagnostics**, dont **51 ERREURS** `rls_disabled_in_public`.
- 🔎 **Cause racine : le script de miroir.** `docker/scripts/mirror-cloud.mjs` faisait `DROP TABLE … CASCADE`, recréait chaque table depuis un schéma **déduit des lignes rapatriées**, puis `DISABLE ROW LEVEL SECURITY`. Il détruisait donc le schéma de `schema.sql` à chaque rafraîchissement : **45 colonnes perdues** (`bons_de_travail.temps_alloue`, `poste_id`, `oas_avant/apres`, `lots.avancement`…), **RLS coupée sur 51 tables**, contraintes et policies effacées.
- 🔎 **Sa liste de tables avait dérivé** : elle citait des tables inexistantes (`hse_chimie`, `hse_vgp`, `perissables`) et **en oubliait de bien réelles** — `interlocuteurs` (484 lignes), `produits_perissables` (236), `operateur_presence` (235), `competences_operateur` (92), `hse_dechets` (24)… qui restaient **vides en local**.
- **Miroir corrigé** : il ne touche plus au schéma (`DELETE` + `INSERT`), et sa liste est **générée depuis le schéma réel** (101 tables). Le schéma reste la responsabilité de `schema.sql` + `scripts_import/`.
- **Correctif de base** : `scripts_import/db_hygiene_2026_08_25.sql`, idempotent, cuit dans l'image `db` (`db.Dockerfile`) — 45 colonnes du cloud récupérées, 7 colonnes locales préparées pour le cloud, RLS + policy explicite sur les 51 tables, `search_path` figé sur 3 fonctions, doublon de policy retiré, clé primaire sur `edit_locks`.

### Résultat sur les diagnostics
| Diagnostic | Avant | Après |
|---|---|---|
| `rls_disabled_in_public` | **51 ERROR** | **0** |
| `function_search_path_mutable` | 3 WARN | **0** |
| `multiple_permissive_policies` | 4 WARN | **0** |
| `no_primary_key` | 1 INFO | **0** |
| `rls_policy_always_true` | 51 WARN | 101 WARN *(volontaire)* |
| `unused_index` | 19 INFO | 17 INFO |

- ⚠ **`rls_policy_always_true` n'est pas un défaut à taire** : l'ERP est rendu côté serveur et s'authentifie avec la **clé anon** — la clé anon EST l'identité de l'application. Restreindre ces policies couperait l'accès à l'application. Le passage de 51 à 101 n'est pas une régression : les 51 tables concernées n'avaient **aucune** policy (état ERROR, plus grave).

### Deux bugs réels trouvés au passage
- 🐞 **`edit_locks` sans clé primaire** alors que le code fait `upsert(payload, { onConflict: 'resource' })`, ce qui **exige** une contrainte unique : on observait **2 lignes pour 1 seule ressource**. La clé primaire répare le verrou d'édition.
- 🐞 **`demandes_prix_lignes.demande_prix_id` typé `numeric`** alors que le cloud y stocke un **UUID** : toute insertion de ligne de demande de prix échouait sur Docker, et le miroir laissait la table vide. Aligné sur `text`.

### Parité cloud ⟷ Docker
Nouvel outil **`scripts_doc/compare_bases.mjs`** (tables, colonnes, volumes). La clé anon ne donnant accès ni au catalogue du cloud ni au spec OpenAPI, la comparaison passe par un **sondage colonne par colonne** via PostgREST.

| | Avant | Après |
|---|---|---|
| Tables absentes du cloud | 1 | 1 (`import_staging`, sans usage dans `src/`) |
| Tables avec écart de colonnes | 7 | **4** (uniquement local → cloud) |
| Tables avec écart de volume | 19 | **3** |

- Restent **37 lignes locales** absentes du cloud — `ecritures_comptables` (20), `factures_client` (14), `mouvements_stock` (3) : **résidus de test de juillet** (`CMD-TEST`, `FAC1`, article `S1`, lot `L1`). Non purgés : supprimer des écritures comptables est une décision utilisateur.
- Les 7 colonnes locales manquant au cloud sont fournies en **section 2** du script, à jouer dans Studio → SQL Editor.

- Vérifié : **0 ERREUR** aux Advisors · les **17 pages** du conteneur répondent 200 · lectures **et écritures** anon fonctionnelles sur les tables nouvellement protégées (INSERT + DELETE testés puis nettoyés) · miroir rejoué **sans une seule erreur SQL** · `lint_docs` 0 lien cassé.

## 2026-08-25 — Doc exploitation : acces Supabase, mise sur VM Linux, CI/CD avec approbation
- Section ajoutee a [`docs/technique/12-docker-installation.md`](technique/12-docker-installation.md) : acces a **Supabase Studio** (via Kong, port 8000, authentification basique `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`), acces direct **PostgreSQL** (port hote **54322**, pas 5432), comportement sur **VM Linux** et schema de **CI/CD semi-automatique avec approbation**.
- ⚠ **`DASHBOARD_PASSWORD` vaut encore la valeur publique par defaut** de Supabase self-hosting. Studio donne un acces **administrateur complet a la base**. Commande de rotation fournie dans la doc — a faire **avant** toute mise sur la VM.
- ⚠ **Les ports sont publies sur `0.0.0.0`** (verifie : `0.0.0.0:3000`, `0.0.0.0:8000`, `0.0.0.0:54322`) : sur la VM ils seront joignables depuis tout le reseau. Recommandation documentee : n ouvrir que **3000** au pare-feu et restreindre Studio et PostgreSQL a `127.0.0.1` dans `docker-compose.yml`, en administrant par tunnel SSH.
- Redemarrage : les 8 services portent `restart: unless-stopped`, ils repartent apres un reboot **a condition** que le demon Docker soit active au boot (`systemctl enable --now docker`).
- CI/CD : `.github/workflows/deploy.yml` couvre deja Cloudflare avec deux portes bloquantes (typecheck + harnais toutes-pages). Deux modeles documentes pour la VM — **runner auto-heberge + environnement GitHub protege** (le job attend le clic Approve) ou **tag + timer systemd** (l approbation est la creation du tag), avec leur comparatif.
- `SUPABASE_PUBLIC_URL` reste sur `localhost` : a passer a l IP de la VM (impact reduit depuis que `/api/ged/file/:id` sert les fichiers cote serveur).

## 2026-08-25 — Plan / Bâtiment : le plan ne CRÉE plus rien, il POSE ce qui existe
- **Demande** : « on peut ajouter tout ce qu'on veut, on va pas faire comme ça […] ne rien avoir à créer depuis le plan bâtiment, ça ne sera que du plaçable ».
- **Constat mesuré avant de toucher au code** : sur **47 repères, 7 seulement étaient liés à une fiche** de l'ERP. Les 40 autres étaient des salles dessinées et nommées à la main — alors que le fond de plan est un plan d'architecte qui porte déjà les noms de salles.
- **La légende devient un catalogue.** Chaque catégorie se déplie sur **la liste des fiches réelles de l'ERP**, avec ✓ si déjà posée (clic = localiser) ou **+** si à poser (clic = armer le placement). Champ de recherche transverse. Le repère naît **déjà nommé et déjà lié** : plus aucune saisie de libellé.
- **9 catalogues, tous obligatoirement liés à un référentiel.** Zones : **Poste de travail** (passé de point à **zone**, il porte ses process et ses machines, comme demandé) · **Zone atelier (EPI)** — zonage Z1–Z7/A qui porte la matrice des EPI · **Zone ATEX**. Objets : **Machine** · **Produit chimique / FDS** · **Produit périssable** · **Équipement de mesure (ECME)** · **Équipement de sécurité (VGP)** · **Point de collecte déchets**.
- **Deux catalogues ajoutés** au passage : **ECME** (265 instruments, avec leur localisation et leur vérification périodique) et **déchets** (points de collecte réglementaires). Routes : `getEcme()` et `getHseDechets()`.
- 🐞 **La catégorie `machine` manquait de `CATS`** alors que **8 repères l'utilisaient** : ils s'affichaient en « Autre / Point ». Rétablie comme catalogue à part entière.
- 🐞 **Compteur contradictoire** : l'onglet affichait « Zone atelier **15 / 8** » — les repères hors catalogue étaient comptés comme posés. Seuls les repères **liés** comptent désormais.
- **Création supprimée** : plus de champ libellé (`pe-label`), plus de sélecteur de catégorie (`pe-type`), plus de couleur libre (`pe-col`), et le bouton **« Créer dans l'ERP (Sécurité) »** disparaît (`planShowCreate` / `planCreateEntitySubmit` retirées). L'éditeur ne garde que la **note de placement** et le lien vers la fiche d'origine. Une fiche manquante se crée **dans son service**, puis apparaît au catalogue.
- **Le travail existant n'est pas détruit** : les 40 repères hors catalogue restent affichés dans un bloc ambré dédié, non créables, supprimables un par un.
- ⚠ Piège rencontré : des **backticks dans un commentaire à l'intérieur du template literal** cassent le parsing TypeScript (4 erreurs `TS1005`). Les commentaires du bloc script n'en contiennent plus.
- Vérifié : `tsc` **0** · build ✓ · harnais **61/0** · `lint_docs` **0 lien cassé** · **`audit_manuels` 0 grave / 0 attention / 0 info** · au navigateur : 9 catalogues (poste 20, atelier 8, machine 15, chimie 86, ECME 265…), poste bien en `rect`, **106 lignes plaçables**, aucun champ de libellé libre, aucun bouton de création, 0 erreur console.
- Manuel Plan / Bâtiment et fiche technique réécrits sur le modèle catalogue ; captures régénérées.

## 2026-08-25 — AUTH_ENFORCE=on sur la stack Docker (connexion matricule + PIN de la fiche RH)
- La stack Docker locale tournait **sans mur d'authentification** (`AUTH_ENFORCE=off`) : toutes les pages étaient accessibles à quiconque atteignait le port 3000 — paie, habilitations et données clients comprises. Bascule sur **`on`** : chaque salarié entre **son matricule et son code PIN**, ceux de sa fiche RH (`salaries.matricule` / `salaries.pin`). Aucun compte séparé pour le Docker.
- **Vérification préalable faite AVANT de basculer** — sans quoi on verrouille tout le monde dehors : **36 salariés actifs, 36 matricules, 36 PIN, 100 % hachés PBKDF2, aucun en clair, aucun actif sans PIN**. Les 10 rôles présents correspondent à la matrice RBAC.
- **`docker/.env.example` passe à `AUTH_ENFORCE=on`** (le `.env` réel est gitignoré, donc non committé) avec la requête de contrôle à jouer avant bascule. Section **« Authentification sur la stack Docker »** ajoutée à `docs/technique/12-docker-installation.md`.
- ⚠ **34 matricules distincts pour 36 salariés actifs** : trois personnes partagent le matricule `Cadre` (Joel Dumont · bei, Christophe Guenet · direction, Carolyne Moncomble · rh). **Ce n'est pas bloquant** — `verifySalariePin()` parcourt toutes les lignes du matricule et se sert du **PIN individuel comme discriminant** — mais si deux d'entre elles partagent aussi le PIN, la première ligne l'emporte et l'autre ne peut plus entrer sous son identité. **À corriger depuis RH › Employés.**
- ⚠ Rappel : le code embarque un compte de secours par défaut **public** (`ADMIN` / `246810`), actif tant que `BOOTSTRAP_PIN` n'est pas posé. Vérifié : un PIN de secours personnalisé est bien en place sur cette stack.
- Vérifié : accès anonyme **302 vers `/login`** sur `/`, `/expeditions/service`, `/rh/service`, `/manuels` · `/login` **200** · vrai matricule + PIN faux **401** · matricule inexistant **401** · compte de secours **200** (session `direction`, 15 services visibles) · page servie après connexion **200**.
- ⚠ Effet de bord : `/manuels` devient **filtré par rôle**. Sans authentification l'ERP montrait tous les manuels ; désormais chacun ne voit que ceux de ses services (la Direction les voit tous).

## 2026-08-25 — Expéditions : Envois en premier · audit outillé des 16 manuels · 176 captures régénérées

### 1. Expéditions — inversion des deux premiers onglets
- Ordre désormais **Envois › Réceptions › Calendrier › Fournisseurs › Dashboard**. **Envois** est l'onglet ouvert par défaut. `TABS`, `EXP_TABS`, `activeId`, l'ordre de rendu des panneaux et le repli du routage par ancre ont tous été alignés.
- Manuel HTML réordonné (sections permutées et renumérotées, sommaire, chapeau) et **nouvelle capture `expeditions-receptions.png`** : l'écran par défaut n'étant plus les Réceptions, `expeditions.png` ne les illustrait plus.

### 2. Nouvel outil — `scripts_doc/audit_manuels.mjs`
Compare la **réalité de l'application servie** aux manuels et aux deux manifestes de captures. Détecte quatre dérives silencieuses :
1. onglets **décrits mais inexistants**, ou **réels non documentés** ;
2. **ordre** des onglets différent entre l'application et le manuel ;
3. entrée de manifeste visant un **sélecteur disparu** (la cause des captures périmées de Production et d'Expéditions) ;
4. capture **référencée mais absente**, et captures **antérieures** au dernier changement de code du service.

Comparaison par **libellé** et non par identifiant : les ancres du manuel sont internes au document et n'ont pas à coller aux `id` du DOM (l'OAS génère des slugs accentués). Le manuel a le droit d'**enrichir** un libellé (« Calendrier » → « Calendrier & journée »), pas d'inventer ni d'oublier un onglet. Trois architectures de navigation sont gérées : onglets classiques, ids **indexés** (Direction, `dir-tab-0..6`) et service **multi-pages** (RH, barre de liens).

### 3. Résultat de l'audit sur les 15 services
- **Structure : 0 écart** après correction. Seule anomalie trouvée : l'ordre des onglets d'Expéditions (point 1).
- ⚠ **`capture_forms.mjs` portait 5 entrées mortes**, silencieuses depuis des semaines :
  - `form-commercial-dt` et `form-commercial-avoir` visaient les boutons **« Nouvelle DT »** et **« Nouvel avoir »**, qui **n'existent plus** (ce sont « Créer la DT » et « Émettre l'avoir », et ce sont des **formulaires en ligne**, pas des modales) ;
  - `form-compta-fournisseur` appelait la fonction sans ouvrir ni l'onglet **ni le sous-onglet** « Factures fournisseurs » → modale ouverte mais de **0 × 0 px** (ancêtre `display:none`) ;
  - `form-be-nomenclature` et `form-plans-editeur` ouvrent des blocs **en ligne**, jamais des modales.
  - Nouvelle option **`inline: true`** dans `capture_forms.mjs` : détecte un conteneur visible portant ≥ 3 champs au lieu d'exiger une modale `position:fixed`. 4 des 5 entrées réparées.
- ⚠ `form-expeditions-arrivee` visait encore **`#exp-tab-planning`**, onglet supprimé le 18/08 — corrigé en `#exp-tab-receptions`.
- 🧹 1 capture **orpheline** supprimée (`direction-refus-modal.png`, référencée nulle part et absente des manifestes).

### 4. Captures : **176 sur 177 régénérées ce jour**
126 captures de pages + 50 captures de formulaires. Ne reste que `form-plans-editeur.png` (04/07) : l'éditeur de plan est un mode d'édition, pas un formulaire — la capture existante reste représentative et **n'a pas été écrasée** (le garde-fou « on n'écrit que si le formulaire est réellement ouvert » a joué).

### Vérifications
`tsc` **0 erreur** · build ✓ · harnais **61 PASS / 0 FAIL** · `lint_docs` **0 lien cassé** · `audit_manuels` **0 grave** · recueils imprimables régénérés.
**Vérifié au navigateur** : ordre des onglets Expéditions et panneau ouvert par défaut ; la modale Compta et les formulaires Commercial se capturent de nouveau.

## 2026-08-24 — Barre latérale repliable · onglet Fournisseurs dans les Expéditions

### 1. Barre latérale repliable (toute l'application)
- Bouton **hamburger** (3 barres) en haut de la barre latérale : il la range pour rendre toute la largeur au contenu. Un bouton identique apparaît alors **en haut à gauche** pour la réafficher. Choix **mémorisé** (`localStorage.erpSidebar`).
- Mesuré au navigateur : contenu **1029 px → 1265 px** replié (viewport 1280), soit les 236 px de la barre effectivement rendus.
- ⚠ L'IIFE de restauration est posée **juste après l'`<aside>`, avant le `<main>`** : plus bas dans la page, l'utilisateur verrait le menu apparaître puis disparaître à chaque chargement.

### 2. Expéditions — nouvel onglet « Fournisseurs » (à droite du Calendrier)
- **Référentiel** : liste filtrable à la frappe, **ajout** et **suppression** de fournisseur.
- **Historique par fournisseur** : ses **bons de commande envoyés** (n° BC, date, montant, état de réception, affaire) et ses **bons de livraison reçus** (n° BL, date, **transporteur**, BC lié, affaire). **Un clic sur n'importe quelle ligne ouvre la fiche de l'affaire** (`/commercial/affaire/:num`).
- Compteurs `N BC` / `N BL` sur chaque ligne de la liste — un fournisseur à beaucoup de BC et peu de BL est un fournisseur à relancer.
- **Aucun nouvel endpoint** : réutilise `POST /api/achats/fournisseur` et `DELETE /api/fournisseurs/:id`. La route charge `getFournisseurs()` ; `bcsView` porte désormais `fournisseur_id` et `num_affaire`, qui manquaient — sans eux, ni le rattachement ni le lien affaire n'étaient possibles.
- **Rattachement BC → fournisseur** : par `fournisseur_id`, avec repli sur le **nom normalisé** (beaucoup de BC anciens ne portent pas l'id). BL joints par `bons_de_livraison.bc_id`, repli sur `bons_de_commande.bl_id`.

### 3. Correctifs trouvés en chemin
- 🐞 **Les BC annulés n'étaient exclus de rien** : ils continuaient d'apparaître dans le Dashboard Expéditions alors que les BL annulés étaient filtrés depuis le 18/08. Exclus désormais de **tout** le service.
- ⚠ **Manifeste de captures périmé (même défaut que Production)** : il visait encore `#exp-tab-bl`, `#exp-tab-planning`, `#exp-tab-commandes` — supprimés lors de la réorganisation du 18/08. 5 PNG périmés retirés, entrées réelles ajoutées (`envois`, `calendrier`, `fournisseurs`).
- ⚠ **Le manuel HTML Expéditions n'avait jamais été réécrit** après cette réorganisation : il décrivait encore les 5 anciens onglets (Bons de Commande, Planning arrivées, Bons de Livraison, Commandes en cours). **Entièrement réécrit** sur les 5 onglets réels, manuel Markdown et index compris.

### Vérifications
`tsc` **0 erreur** · build ✓ · harnais **61 PASS / 0 FAIL** · `lint_docs` **0 lien cassé** · captures régénérées.
**Vérifié au navigateur** : bascule de la barre latérale (largeur mesurée, persistance), onglet Fournisseurs (**155 fournisseurs**, ordre `receptions > envois > calendrier > fournisseurs > dashboard`), et **rapprochement BC/BL prouvé de bout en bout** sur une donnée `-TEST-` (BC rattaché au fournisseur 3M → BC et BL affichés avec leur affaire, lignes cliquables vers `/commercial/affaire/`).
> ⚠ **Résidu à supprimer en SQL** : `DELETE` anon est bloqué par RLS sur `bons_de_commande` (retourne 200/204 sans effet, comme `bons_de_livraison`). La ligne de test a été **neutralisée** (`statut='annule'`, tous rattachements vidés) donc elle n'apparaît nulle part, mais elle subsiste en base :
> `delete from bons_de_commande where id = '-TEST-BC-JOIN';`

## 2026-08-24 — Captures Production purgées de l'« Affectation » · audits Sécurité/Environnement aplatis sur le modèle Qualité

### 1. Production — la page « Affectation » hantait encore la doc
- **Cause trouvée** : le manifeste `scripts_doc/capture_screens.mjs` capturait toujours **`/production/planning`** et `?tab=st` — une route **supprimée le 18/08** (elle redirige). Les PNG `production-planning.png` / `production-planning-st.png` dataient du **17/08**, donc **d'avant la refonte** : ils montraient la sous-nav « Programmation | Affectation ». Ils étaient affichés dans 4 documents (manuel Production, parcours 04, fiches de poste production et opérateur).
- **Correctif** : les 2 entrées retirées du manifeste, les 2 PNG périmés **supprimés**, les 4 documents repointés sur `production-service.png`, et **les 8 captures Production régénérées** (elles dataient toutes du 17/08).
- Textes obsolètes corrigés : `index.html` annonçait « 7 onglets **+ Affectation** » ; `dashboard.html` renvoyait aux « écrans Programmation et **Affectation** ».
- **Fractionnement d'un BDT CONSERVÉ** (demande explicite) et mieux documenté : procédure ajoutée au manuel Markdown, mécanique consignée dans la fiche technique. Vérifié servi dans la page réelle : `splitModal`, menu « Séparer en morceaux », `POST /api/production/bdt/:id/separer`.
- 🐞 Au passage, 2 noms de tables faux dans la fiche technique : `presences` → **`operateur_presence`**, `affectations_poste` → **`affectation_poste`** (+ `postes` ajoutée).

### 2. Sécurité & Environnement — l'audit remis au format Qualité
- **Constat utilisateur** : « dans la qualité c'est simple, dans sécurité et environnement c'est fouillis ». Mesuré : l'onglet Audit comptait **4 sous-onglets en Qualité, 5 en Sécurité et 8 en Environnement**.
- **Cause réelle** : ce n'était pas un problème de barre, mais de **hiérarchie**. L'onglet Audit hébergeait des écrans **qui ne sont pas des audits** (registre d'obligations, parties intéressées, autodiagnostics, indicateurs RSE) — il fallait deviner qu'ils étaient là.
- **Correctif — aplatissement.** L'onglet Audit porte désormais **exactement les 4 sous-onglets standard** (`Programme · Constats & plans d'action · Grilles · Référentiels`) dans les **trois** services, sans aucun `extras`. Ce qui n'est pas un audit remonte au **premier niveau** :
  - **Sécurité** 8 → **9 onglets** : nouvel onglet **Veille réglementaire**.
  - **Environnement** 8 → **10 onglets** : nouveaux onglets **Veille réglementaire** et **Autodiagnostics** (ISO 14001 + ISO 26000 + indicateurs RSE) ; **Parties intéressées** rejoint **Aspects & parties** (contexte ISO 14001 §4.2 / §6.1.2), via le mécanisme de groupes déjà en place.
  - Onglet renommé **« Audit Conformité »** dans les deux services — même libellé qu'en Qualité.
- 🐞 **Compteur contradictoire corrigé** (vu sur capture) : le badge de l'onglet Audit affichait **25** (tout le SMI) alors que le panneau montrait **3** lignes (filtrées ISO 14001) — idem 25 / 20 en Sécurité. Le filtre normatif était **enfermé dans `panelAudit`** ; il est extrait en `auditProgDomaine(programme, domaine)` **exporté**, utilisé par le panneau **et** par le badge. Une seule source de vérité, plus de divergence possible.
- Manuels HTML Sécurité et Environnement **restructurés** (sections scindées, sommaires, renumérotation, renvois croisés) + **3 nouvelles captures** (`securite-veille`, `environnement-veille`, `environnement-autodiag`).

### Vérifications
`tsc` **0 erreur** · build ✓ · harnais **61 PASS / 0 FAIL** · `lint_docs` **0 lien cassé** · captures **176/176** (aucune manquante) · recueils imprimables régénérés.
**Vérifié sur la page servie** (session authentifiée) : Production = aucune sous-nav Affectation, aucun lien `/production/planning`, fractionnement présent ; Sécurité et Environnement = **4 sous-onglets d'audit exactement**, `audit-subbtn-veille/parties/iso14001/iso26rse` **disparus**, nouveaux onglets présents ; ordre Environnement `dechets > rejets > atex > aspects > icpe > ges > veille > autodiag > audit > dashboard`.
> Note : la barre d'onglets déborde horizontalement à 10 onglets — c'est le comportement établi (`overflow-x:auto`, `src/shared.ts`), identique en Qualité avec ses 13 onglets. Non modifié.

## 2026-08-24 — Dossier PDM : etat des donnees, cartographie swimlane, emplacements documentaires
- Nouveau document de synthese [`docs/etudes/dossier-pdm-donnees-cartographie.md`](etudes/dossier-pdm-donnees-cartographie.md), destine a etre transmis hors depot.
- **Mesure reelle de la base de production** (comptage exact des 101 tables) : **68 peuplees, 32 vides**, 1 absente du cloud (`import_staging`, HTTP 404 = derive de schema). Classement des vides en **11 referentiels bloquants** vs **21 tables transactionnelles** qui se remplissent par l usage.
- **Verrou n°1 identifie** : `nomenclatures` = **1 ligne** en production → sans elle, ni gamme, ni cout, ni BDT, ni planning, ni prix d offre. Les ~318 nomenclatures importees puis supprimees sont rejouables.
- Autres bloquants : `habilitations`, `ecme_verifications` (265 ECME sans aucun historique), `plans_preventif`, `pieces_rechange`, `balancelles`, et 6 tables `hse_*` reglementaires.
- **Cartographie tracee depuis le code** (353 routes → 405 fonctions de `queries.ts` → tables), pas de memoire : matrice des 15 services (routes, fonctions, tables en propre, flux amont/aval), diagramme **swimlane Mermaid** du flux DT→facture, et les **15 tables de couture** ecrites par plusieurs services (les vraies interfaces inter-services).
- Hygiene relevee : `salaries` 36 actifs pour 20 collaborateurs declares ; `edit_locks` seule table sans cle primaire ; **1 seule cle etrangere sur 101 tables** et 19 index non-PK.
- Verifie : `lint_docs` 0 lien casse · tableaux Markdown alignes · Mermaid equilibre (8 couloirs / 24 noeuds / 0 reference orpheline).

## 2026-08-24 — L'étude financière (valorisation du temps gagné) entre dans le dépôt
- **Problème** : la note de valorisation « Récupérer 3 ETP sur 4 » ne vivait que dans un **artifact** et une copie de travail du dossier temporaire (`scratchpad`) — depuis purgé. Elle n'était **versionnée nulle part** : un seul nettoyage de cache et le document disparaissait.
- **Correctif** : la version **à jour** (effectif réel **20 personnes = 15 bureau + 5 atelier**, ≈**130 DT/mois**) est désormais dans le dépôt → [`docs/etudes/valorisation-temps-gagne.html`](etudes/valorisation-temps-gagne.html). Fichier HTML autonome (styles inclus, imprimable), ouvrable hors connexion.
- Chiffres de la note : **≈ 4,0 ETP** improductifs (≈ 138,5 h/sem) → **≈ 2,9 ETP récupérables** (73 % de résorption, prudent) ≈ **148 k€/an** de temps repris, plus **≈ 78 k€/an** de gains directs (OTD/qualité/délais, non-qualité, papier) = **≈ 226 k€/an** de potentiel identifié. Base : 1 607 h/an, 32 €/h chargé.
- ⚠ Une copie plus ancienne traînait en cache avec l'**ancien effectif (13 personnes)** — périmée, à ignorer. Le fichier du dépôt fait foi.

## 2026-08-19 — Correctif : l'app ne démarrait plus hors Cloudflare (manuels embarqués)
- **Régression** introduite par les manuels lisibles dans l'ERP : `src/manuels.tsx` importait les 17 fichiers HTML via la syntaxe **Vite `?raw`**, qui n'existe QUE sous Vite. Sous **Node/tsx** (conteneur Docker) et sous **esbuild**, l'import n'est pas résolu → `ERR_MODULE_NOT_FOUND: /app/docs/manuel/html/commercial.html` et **le conteneur `erp-app` redémarrait en boucle**. Cloudflare (bundlé par Vite) n'était pas affecté, d'où la détection tardive — au premier `docker compose up`.
- **Correctif** : nouveau générateur `scripts_doc/gen_manuels_module.mjs` → **`src/manuels_contenu.ts`** (module TypeScript ordinaire : `MANUELS_HTML` + `MANUEL_CSS`, ~688 Ko), importé normalement par `src/manuels.tsx`. Fonctionne sous **Vite, Node/tsx ET esbuild**. Régénéré automatiquement par le `prebuild` (avec la synchro des captures) ; à relancer à la main après modification d'un manuel.
- Vérifié : `tsc` 0 · build ✓ · harnais 61/0 · **conteneur `erp-app` healthy** et servant toutes les nouveautés de la session (Expéditions 3/3 onglets, retours clients, barre d'audit Sécurité 5 sous-onglets, formulaire Nouvel OM, onglet Coûts postes, focus étape du planning, 16 manuels + lecture d'un manuel en HTTP 200).
- Base Docker locale : les 2 migrations de la session (`bc_arrivees_planning.sql`, `nc_retour_client_attendu.sql`) sont bien appliquées (5 colonnes vérifiées).

## 2026-08-18 — Flux retour client vérifié de bout en bout (migration appliquée)
- Migration `nc_retour_client_attendu.sql` **appliquée en production** → flux testé en conditions réelles : NC client déclarée avec « retour prévu » (n° commande, quantité, date) → **persistée** (`retour_attendu`, `n_commande`, `retour_statut='attendu'`) → **visible dans Expéditions › Réceptions** → « Enregistrer l'arrivée » → **BL créé et rattaché à la commande** → NC marquée `retour_statut='recu'` avec liens croisés (`bl_retour_id` ↔ `nc_id`) → le retour quitte la file d'attente et rejoint « Arrivées enregistrées ». **Le n° de commande est déduit automatiquement de la NC** si non saisi (vérifié : `cmd_id = CMD-2026-0001`).
- **⚠ Écart schéma cloud / local corrigé** : la base de production porte une contrainte `bons_de_livraison_type_bl_check` limitée à `client|reception|bst` (absente du schéma local, d'où l'analyse initiale erronée) → un retour client est enregistré comme **`type_bl='reception'` discriminé par `nc_id`** (c'est bien une arrivée), **sans seconde migration DDL**. Les réceptions « pures » excluent désormais les BL portant un `nc_id`, pour ne pas compter deux fois.
- Les **BL annulés** sont exclus des 3 onglets et du calendrier (un BL annulé n'est ni une arrivée ni un départ).
- Vérifié : `tsc` 0 · build ✓ · harnais 61/0 · flux complet en base réelle. **Données de test** : NC supprimées ; les BL ne sont pas supprimables (DELETE anon bloqué par RLS, comme `ordres_maintenance`) → **neutralisés en statut `annule`** et donc invisibles ; à supprimer depuis le dashboard Supabase (`-TEST-T-client`, `-TEST-T-reception`, `-TEST-T-bst`, `BL-2026-002`, `BL-2026-003`).

## 2026-08-18 — Expéditions réorganisées en 3 temps : Réceptions · Envois · Calendrier
- **Demande** : « en premier onglet tout ce qui est réception (fournisseurs, sous-traitants, retours clients), un onglet avec les envois (sous-traitants et commandes clients), puis le calendrier avec tous les envois et réceptions, et en dessous le détail de ce qui doit être envoyé et réceptionné aujourd'hui — le tout cohérent en base ».
- **Nouvelle organisation** (les anciens onglets BC / Planning arrivées / BL / Commandes sont fondus dedans) : **Réceptions** (à réceptionner fournisseurs & ST · retours de sous-traitance attendus · **retours clients attendus** · en attente de validation fournisseur · arrivées enregistrées) · **Envois** (commandes prêtes à expédier avec porte qualité · BL à envoyer · à envoyer en sous-traitance) · **Calendrier** (frise unique **arrivées + départs**, puis le bloc **« Aujourd'hui »** listant ce qui est à réceptionner et à envoyer, retards inclus, avec le bouton d'action de chaque ligne) · **Dashboard** conservé.
- **Socle commun** : une fonction `collecterMouvements()` construit TOUS les flux (BC, BDS envoi/retour, retours clients, BL clients) depuis les mêmes tables — les 3 onglets et les badges en sont des projections, donc **cohérents par construction**.
- **🐞 Deux bugs de câblage corrigés** (révélés par l'analyse) : (1) la route ne chargeait **que** les BL clients → le bloc « Réceptions effectuées » était **structurellement toujours vide** alors que la base contenait des réceptions (`BL-2026-001` s'affiche enfin) ; (2) les **vrais bons de sous-traitance** (`bons_sous_traitance`) n'étaient **jamais chargés** → tout l'affichage ST était du décor. (3) `TODAY` était figé au chargement du module (dérive sur une isolate réutilisée) → la date du jour est désormais calculée **par requête**.
- **Retour client — le maillon manquant** : la NC client ne permettait pas de dire qu'une marchandise **revient**, et le **n° de commande n'était même pas enregistré**. Ajouté au formulaire de non-conformité : case **« Retour de marchandise prévu »**, **n° de commande client**, **quantité** et **date de retour prévue** (`n_commande` enfin alimenté). Le retour apparaît alors dans **Expéditions › Réceptions**, où « Enregistrer l'arrivée » crée un **BL `type_bl='retour_client'` rattaché à la commande** (`POST /api/expeditions/retour-client/:ncId/receptionner`) et marque la NC « retour reçu » (liens croisés `bl_retour_id` ↔ `nc_id`).
- **Migration DB** : `scripts_import/nc_retour_client_attendu.sql` (`non_conformites` +6 colonnes, `bons_de_livraison.nc_id`), appliquée en **local Docker** et ajoutée au **schéma reproductible**. **⚠ À APPLIQUER AU CLOUD** pour que les retours soient visibles. **Fail-soft** en attendant (sonde `ncHasRetourCols()`) : la NC se crée normalement, seule l'annonce du retour est ignorée — vérifié en conditions réelles (création OK malgré l'absence des colonnes, `n_commande` bien enregistré).
- Actions câblées : `expEnvoyerBds` / `expRetourBds` (horodatage envoi et retour ST via `PATCH /api/production/bds/:id`), `expOpenRetourClient` (modale de réception du retour).
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · navigateur (4 onglets, aucun panneau muet, toutes les fonctions présentes, modale de retour préremplie avec la commande) · e2e réel (NC créée avec `n_commande`, fail-soft confirmé, données de test supprimées) · `lint_docs` 0 cassé.
- Fichiers : `src/expeditions.tsx`, `src/index.tsx`, `src/qualite.tsx`, `src/queries.ts`, `scripts_import/nc_retour_client_attendu.sql`, `docker/db/seed/schema.sql`, réf API régénérée.

## 2026-08-18 — Sécurité & Environnement : audit standardisé sur l'organisation Qualité
- **Constat utilisateur** : dans les programmes d'audit de Sécurité et d'Environnement, « il n'y a ni le planning commun ni la possibilité d'ajouter une ligne » — organisation encore à l'état de chantier par rapport à la Qualité.
- **🐞 Bug 1 (cause du planning invisible)** : `panelAudit()` enveloppait TOUJOURS son rendu dans `<div id="qual-panel-audit" style="display:none">` — le panneau de l'onglet Audit **de la page Qualité**, ouvert par `qualShowTab`. Réutilisé par Sécurité/Environnement, ce conteneur restait masqué **à jamais** (aucune fonction de ces pages ne l'ouvre) : le **planning annuel et le bouton « Nouvelle ligne » étaient bien dans le DOM, mais invisibles**. → nouvelle option **`nu: true`** (rendu sans le wrapper propre à la Qualité).
- **🐞 Bug 2** : `auditSub()` (bascule des sous-onglets) itérait sur une **liste figée** `['programme','grilles','constats','ref']` → les onglets propres au domaine ne s'ouvraient jamais. → liste désormais **construite depuis le DOM**.
- **Standardisation (le fond de la demande)** : il n'y a plus **deux barres de sous-onglets empilées** (celle du service + celle de l'audit, avec des compteurs contradictoires : programme non filtré 25 vs filtré 3). `panelAudit` accepte des **onglets de domaine** (`opts.extras`) intégrés à SA barre → **une seule barre**, identique en Qualité, Sécurité et Environnement :
  - **Qualité** : Programme · Constats & plans d'action · Grilles · Référentiels
  - **Sécurité** : + Veille & conformité
  - **Environnement** : + Veille & conformité · Parties intéressées · Autodiagnostic ISO 14001 · ISO 26000 & RSE
  Les sous-navs maison (`secConfSub`/`SC_SUBS`, `envConfSub`/`CSUBS`) sont supprimées.
- **Résultat** : les deux services disposent maintenant du **planning annuel commun** (calendrier 12 mois, cases Programmé / Pas fait / Non conforme / Soldé conforme), du sélecteur d'**exercice** + **« Reconduire pour N+1 »**, du bouton **« + Nouvelle ligne »** (formulaire complet : type, famille, entité auditée, thèmes, référentiels, date cible, temps estimé, auditeur, audité, grille) et des **4 indicateurs**. Programme partagé avec la Qualité (`audit_programme`), **filtré par référentiel** : ISO 45001 côté Sécurité (20 lignes), ISO 14001 côté Environnement (3 lignes).
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · navigateur : les **8 onglets Environnement** et les **5 onglets Sécurité** s'ouvrent tous avec du contenu, bouton « Nouvelle ligne » **visible** et modale de création **fonctionnelle**, planning annuel affiché, **Qualité inchangée** (wrapper conservé, 25 lignes, 4 onglets OK), **0 erreur console**. Captures `securite-audit.png` / `environnement-audit.png` régénérées.
- Fichiers : `src/qualite.tsx` (`panelAudit` : `nu`/`extras`, `auditSub` dynamique), `src/securite.tsx`, `src/environnement.tsx`, fiches `06-modules/{securite,environnement}.md`, manuels HTML, `scripts_doc/gen_module_fiches.mjs` (manifeste).

## 2026-08-18 — Générateur de fiches modules rendu NON DESTRUCTIF
- **Problème** : `scripts_doc/gen_module_fiches.mjs` réécrivait chaque fiche `docs/technique/06-modules/*.md` **en entier** → toute régénération effaçait les enrichissements manuels (constaté la veille : fiche Expéditions — planning des arrivées, OTD figé — et fiche Sécurité, restaurées depuis git).
- **Fait** : fusion par **blocs balisés**. Chaque partie issue du manifeste est encadrée par `<!-- auto:<clé> --> … <!-- /auto -->` (clés : `entete`, `mission`, `onglets`, `api`, `tables`, `notes`) ; **seul l'intérieur des balises est régénéré**, tout ce qui est écrit autour (sous-sections, gotchas, migrations) est conservé. Une section **sans balise** est considérée comme reprise à la main : elle est **préservée** et signalée à chaque exécution (« si le manifeste a changé, reportez-le à la main »).
- **Nouvelles options** : `--verifier` (n'écrit rien, signale ce qui changerait — utilisable en pré-commit, sort en code 1) et `--adopter` (migration : pose les balises **uniquement** sur les sections encore identiques au manifeste, laisse intactes celles qui ont été enrichies).
- **Migration effectuée** : 10 fiches entièrement balisées ; 4 fiches partiellement (Production, Sécurité, Expéditions, Plans) — leurs sections enrichies restent hors périmètre, volontairement.
- **2 bugs corrigés en route** : (1) la regex des balises était construite avec `[\s\S]` non échappé dans une chaîne JS (lu `[sS]`) → aucune balise n'était jamais reconnue ; (2) la migration cherchait des fins de ligne Unix alors que les fiches éditées sous Windows sont en **CRLF** → aucun titre de section n'était reconnu (normalisation LF ajoutée).
- Vérifié : `--verifier` n'écrit **aucun** fichier (contrôle par horodatage) ; **2 régénérations d'affilée laissent les 4 fiches enrichies strictement inchangées** (empreintes MD5 identiques, 5 mentions enrichies conservées côté Expéditions et Sécurité) ; une modification du manifeste **régénère bien** le bloc concerné (test sur `stock.md`, puis restauration) ; `lint_docs` 0 cassé.
- Fichiers : `scripts_doc/gen_module_fiches.mjs`, `docs/technique/06-modules/*.md` (balises), `.claude/skills/erp-doc-sync/SKILL.md`.

## 2026-08-18 — Production : planning unique (retour arrière sur « Affectation ») + focus étape
- **Demande** : la sous-nav « Programmation | Affectation » ne convenait pas → revenir à **un seul planning**, avec les **BDT à affecter en haut du planning BDT** et **pareil pour les BDS**, en gardant les bonnes idées d'affectation dans le planning, et au clic sur un BDT/BDS **n'afficher que le poste concerné + l'étape d'avant et l'étape d'après**. Objectif : rester **lean**.
- **Retour arrière** : helper `planningSubNav` supprimé (`src/shared.ts`) et retiré des pages ; **`/production/planning` redirige** vers `/production/service` ; **`src/planning_bdt_bds.tsx` supprimé** (1 868 lignes). Vérifié avant suppression : tout l'utile existait **déjà** dans `/production/service`, souvent en mieux (affectation opérateur→process par créneau Matin/Ap-m/Soir avec clic-pour-placer, tri de file plus fin, guide de dépôt au drag, déprogrammation par retour dans la file — cette dernière n'existait même pas dans la page supprimée).
- **Files d'attente au-dessus des plannings** : « BDT à classer » l'était déjà ; **« BST à planifier » remonté** au-dessus du Gantt BST (il était en bas de page) → symétrie BDT/BDS.
- **Focus étape (remplace le focus lot)** : cliquer un BDT n'affiche plus tous les postes du lot mais **l'étape cliquée + la précédente + la suivante** (3 lignes max) ; bandeau « Focus étape » = `LOT · etape 2/4 — Pliage (avant : Poinçonnage · apres : ST Aalberts)`. Idem côté BST (sous-traitant + voisins). `focusLot`/`focusLotBst` contiennent désormais l'**ID du BDT/BDS**.
- **Gammes fusionnées BDT + BDS** : sans cela, une étape voisine **sous-traitée** était invisible (le fil « avant/après » sautait une étape). Une étape sous-traitée est nommée « ST … » dans le bandeau BDT (et « atelier … » dans le bandeau BST) sans ajouter de ligne au planning correspondant. `bstLotKey()` accepte maintenant `lot_id` (avant `lot_ref` seul) pour rejoindre la clé BDT.
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · e2e HTTP (redirection 302, sous-nav absente, deux files présentes) · navigateur : files bien **au-dessus** des plannings, et logique de focus testée sur une gamme simulée `Poinçonnage → Pliage → ST Aalberts → Montage` (clic étape 2 → 2 lignes + « apres : ST Aalberts » ; clic étape 4 → 1 ligne + « avant : ST Aalberts » ; clic BDS → « avant/apres : atelier … »).
- ⚠ **Piège outillage** : `scripts_doc/gen_module_fiches.mjs` **écrase** les fiches `docs/technique/06-modules/*.md` — sa réexécution a effacé les enrichissements manuels (Expéditions, Sécurité), restaurés depuis git ; le générateur a été recalé et la fiche Production éditée à la main, avec un avertissement ajouté dans la fiche.
- Fichiers : `src/prod.tsx`, `src/index.tsx`, `src/shared.ts`, `src/planning_bdt_bds.tsx` (supprimé), `scripts_doc/gen_module_fiches.mjs`, `docs/technique/06-modules/production.md`, `docs/manuel/html/production.html`.

## 2026-08-17 — Manuels lisibles DANS l'ERP, filtrés par rôle (bouton sidebar)
- **Besoin** : consulter les manuels depuis l'application, via un bouton de la barre latérale **entre la déconnexion et le pointage** ; la Direction lit tout, les autres uniquement les manuels des services qui leur sont attribués.
- **Fait** : nouveau module `src/manuels.tsx` + routes `GET /manuels` (sommaire) et `GET /manuels/:slug` (lecture). Le **contenu des manuels est embarqué dans le worker** (imports Vite `?raw` des 17 fichiers de `docs/manuel/html/`, +720 Ko de bundle) : il traverse donc le middleware d'authentification — contrairement à `/static/*`, **exclu du worker** par `dist/_routes.json` et donc non gatable. Les liens du fichier d'origine sont réécrits à la volée (`../../assets/` → `/static/manuel/`, `x.html` → `/manuels/x`), et le manuel s'affiche dans la coque de l'ERP (sidebar + barre « Tous les manuels », sélecteur des autres manuels, bouton **Imprimer**).
- **Filtrage par rôle** : `manuelsFor(navServices(user))` — chaque manuel exige la LECTURE de son service ; Direction (perm `all`) → les 16. Vérifié par rôle : opérateur 6 · logistique 7 · RH 7 · commercial 8 · comptable 8 · achats 9 · maintenance 9 · OAS 10 · qualité 11 · BE et production 12 · **direction 16**. Le manuel *Direction* n'est visible que par la Direction. Sans session → redirection vers `/login`. `AUTH_ENFORCE=off` (dev/captures) → accès complet.
- **Images** : les 175 captures utilisées sont copiées vers `public/static/manuel/` par `scripts_doc/sync_manuel_assets.mjs`, branché en **`prebuild`** de `package.json` — pas de duplication dans le dépôt (`public/static/manuel/` gitignoré, source unique `docs/assets/`). ⚠ Compromis assumé : le **texte** des manuels est filtré par rôle, les **images** (35 Mo) restent servies en statique, non gatées individuellement.
- **Harnais réparé** : `scripts_doc/harness_all_pages.mjs` bundlait via la CLI esbuild, qui ignore la syntaxe `?raw` → il ne compilait plus. Passage à l'**API JS d'esbuild** avec un plugin de résolution `?raw` (les plugins n'existent pas en CLI). Résultat **62 PASS · 0 FAIL · 1 SKIP** (`pageManuel` non instanciable avec des données factices).
- Vérifié : `tsc` 0 · build ✓ · harnais 62/0 · e2e HTTP (sommaire 200 · 16 cartes · manuel 200 avec 25 images réécrites, 0 chemin résiduel · sans session → 302 login) · navigateur (bouton bien **entre déconnexion et pointage**, 12/12 images chargées, aucun débordement) · `lint_docs` 0 cassé.
- Fichiers : `src/manuels.tsx`, `src/index.tsx`, `src/shared.ts`, `scripts_doc/sync_manuel_assets.mjs`, `scripts_doc/harness_all_pages.mjs`, `scripts_doc/capture_screens.mjs`, `package.json`, `.gitignore`, `docs/manuel/html/index.html`, `docs/assets/manuels-hub.png`.

## 2026-08-17 — Maintenance : formulaire de création d'un ordre de maintenance (manque comblé)
- **Manque constaté** (relevé en illustrant les manuels) : un OM ne pouvait se créer **que** depuis une machine déjà déclarée en panne, **sans aucune saisie** (POST direct : ni titre, ni description, ni priorité, ni responsable, ni planification). Impossible d'ouvrir une intervention pour un bruit suspect, une fuite, un réglage ou un préventif ponctuel.
- **Fait** : bouton **« Nouvel OM »** dans l'en-tête du bloc « Ordres de maintenance en cours » + modale `#mntNewOMModal` (`src/maintenance_service.tsx`) : **machine** (liste triée, mention « — EN PANNE » pour les machines à l'arrêt) et **titre** obligatoires ; **type** (correctif / préventif), description, **priorité**, **responsable** (liste des salariés), **date d'intervention prévue** et **durée estimée** facultatives. Le n° `OM-AAAA-NNN` reste automatique, statut initial `ouvert`. Fonctions `mntNewOM()` / `mntCloseNewOM()` / `mntSaveNewOM()`.
- `POST /api/maintenance/om` (`src/index.tsx`) étendu : accepte désormais `date_prevue` et `duree_h`. **Correction du MTTR** au passage — un OM **préventif** ne pose plus `date_debut` à la création (le compteur d'arrêt ne doit courir qu'à l'intervention réelle) ; le correctif conserve l'horodatage de la panne.
- **Code mort supprimé** : `mntSwitchOM()` ciblait des éléments (`#mnt-om-panel-*`) absents du HTML — vestige d'un formulaire de création jamais construit.
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · e2e réel (création d'un OM préventif : n° auto, `date_prevue` et `duree_h` enregistrées, `date_debut` bien à `null`) · UI contrôlée au navigateur (bouton, modale, 15 machines listées, tous les champs présents).
- ⚠ **Donnée de test à supprimer** : `OM-2026-002` (titre « -TEST- a supprimer… ») — le `DELETE` anon est bloqué par RLS sur `ordres_maintenance` ; la ligne a été passée en statut **annulé** (donc hors listes et KPI) et doit être supprimée depuis le dashboard Supabase.
- Doc : `manuel/html/maintenance.html` (nouveau pas-à-pas « créer un OM vous-même » + capture `form-maintenance-nouvel-om.png`, et le tableau champ-par-champ renommé « fiche d'intervention » pour lever l'ambiguïté), `scripts_doc/capture_forms.mjs` (+1 entrée). Fichiers : `src/maintenance_service.tsx`, `src/index.tsx`.

## 2026-08-17 — Captures des modales de formulaires (+22) intégrées aux manuels HTML
- **Besoin** : illustrer les **fenêtres de saisie** (modales) dans les manuels utilisateur, au-delà des écrans d'onglets.
- **Fait** : `scripts_doc/capture_forms.mjs` étendu de 28 à **50 entrées** — nouvelles modales capturées : RFQ + traitement des réponses, nouveau fournisseur, nouveau sous-traitant, fiche client, **fractionnement d'un BDT**, clôture de balancelle avec autocontrôle, **arrivée BC & BL du planning**, réception BC→BL, PV de contrôle à réception, déchets / mesures env. / zone ATEX / aspects & impacts, édition d'OM, pointage à la borne, correction de pointage, refus Direction, traitement d'un jalon, consultation de la pièce source, cote de capabilité, ligne de plan de contrôle. **22 captures intégrées** dans 10 manuels (à l'endroit pédagogique : après le pas-à-pas ou le tableau des champs).
- **Fiabilisation du script** (3 défauts corrigés) : (1) il **écrasait une bonne capture même quand aucune modale ne s'ouvrait** → il n'écrit désormais le PNG *que* si la modale est visible (`--force` pour outrepasser) — 4 captures Qualité dégradées ont été restaurées ; (2) ajout du **login automatique** (fonctionne maintenant avec `AUTH_ENFORCE=on`, comme `capture_screens.mjs`) ; (3) nouveau paramètre **`tabClick`** — une modale imbriquée dans un panneau d'onglet reste invisible tant que l'onglet n'est pas ouvert (cause de la plupart des échecs) ; option `noFields` pour les fenêtres de consultation sans champ de saisie.
- Entrées obsolètes corrigées : `form-maintenance-om` (le bouton « Nouvel OM » n'existe pas), `form-rh-conge` (la demande de congé se fait depuis la **borne** `/rh/pointage`, pas `/rh/temps`), et 7 modales Qualité/Sécurité qui nécessitaient `tabClick`.
- **Doc corrigée au passage** : le parcours `manuel/parcours/07-securite.md` illustrait la déclaration d'une zone ATEX avec `form-securite-atex.png` — une modale **vestigiale inaccessible** (le panneau `pAtex` de `src/securite.tsx` n'est jamais rendu, aucun onglet ne l'ouvre) alors que le texte renvoie, lui, correctement au service **Environnement**. L'image pointe désormais sur le vrai formulaire « Zone ATEX — critères DRPCE » (`form-environnement-atex.png`) ; la capture trompeuse et son entrée de manifeste ont été supprimées.
- **⚠ Constat fonctionnel (non corrigé, à arbitrer)** : il n'existe **aucun formulaire de création d'ordre de maintenance**. La création se fait sans saisie (bouton « Créer un OM » sur une machine en panne → POST direct) ; `#mntOMModal` n'est qu'une modale d'**édition** d'un OM existant, et `mntSwitchOM('creer')` est du **code mort** (cible des éléments absents du HTML). La capture `form-maintenance-om` illustre donc l'édition.
- Fichiers : `scripts_doc/capture_forms.mjs`, `docs/assets/form-*.png` (22 nouvelles + 20 régénérées), `docs/manuel/html/*.html` (10 manuels complétés).

## 2026-08-17 — Manuels utilisateur HTML illustrés (16 services, tous les onglets) + 2 bugs Maintenance corrigés
- **Besoin** : un vrai tutoriel d'utilisation, **un document par service**, détaillant **le fonctionnement de chaque onglet de manière exhaustive**, avec captures d'illustration.
- **Livré** : `docs/manuel/html/` — **16 manuels HTML** (+ `index.html` = sommaire avec prise en main : connexion, navigation, rôles) partageant une charte commune (`manuel.css`, palette marque violet/bleu, imprimable Ctrl+P, responsive). **114 sections d'onglet · 154 captures intégrées**. Chaque onglet suit le même contrat : *À quoi ça sert · Ce que vous voyez (+ capture légendée) · Pas à pas (tutoriel) · Règles & points d'attention*, plus des tableaux champ-par-champ pour les formulaires et les sous-onglets détaillés. Gabarit de référence : `docs/manuel/html/_TEMPLATE.html`.
- **Captures** : manifeste `scripts_doc/capture_screens.mjs` étendu de 50 → **125 entrées** (couverture de TOUS les onglets : Production/Programmation+Affectation, Qualité 13 onglets, Sécurité, Environnement, Stock, Maintenance, RH multi-pages, Compta, Direction, Expéditions dont « Planning arrivées », hub `/dashboard` + les 15 dashboards filtrables). Toutes régénérées (**125 OK**).
- **🐞 2 bugs applicatifs découverts et corrigés** (`src/maintenance_service.tsx`), trouvés parce que 2 captures sortaient **blanches** : (1) **le service Maintenance s'ouvrait entièrement VIDE** — tous les panneaux sont rendus en `display:none` et aucun appel d'initialisation n'affichait l'onglet actif (`activeId:'interventions'` marquait seulement le bouton) → ajout de l'IIFE d'init (avec support du hash, comme les autres services) ; (2) **l'onglet « Coûts postes » était mort** — `'postes'` absent de `MNT_TABS` → le panneau ne s'affichait jamais. Audit de contrôle : les 12 autres services rendent leur panneau par défaut en `display:block`, **Maintenance était le seul cassé**.
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · captures Maintenance re-générées non blanches (onglet Coûts postes fonctionnel : tableau OPEX/TCO/taux par poste) · validation HTML des 17 fichiers (images toutes présentes, liens internes valides, ancres du sommaire OK, **43 tableaux tous dans un conteneur scrollable**) · rendu vérifié au navigateur en desktop **et mobile 375 px (aucun débordement)**.
- Fichiers : `docs/manuel/html/*` (18), `scripts_doc/capture_screens.mjs`, `docs/assets/*.png` (125), `src/maintenance_service.tsx`, `docs/manuel/00-index.md`.

## 2026-08-17 — Expéditions : planning des arrivées fournisseurs/ST + OTD figé sur la 1ʳᵉ date
- **Besoin** : visualiser les dates d'arrivée des commandes fournisseurs **et** prestataires (depuis la date prévue sur les BC), avec statuts et accès aux BC/BL (BC seul en attente, BC + BL une fois reçu) ; pouvoir **repousser** la date d'arrivée **en gardant la 1ʳᵉ** pour calculer l'OTD par fournisseur.
- **Fait** : nouvel onglet **« Planning des arrivées »** dans Expéditions (`panelPlanningArrivees`, `src/expeditions.tsx`) — **timeline/Gantt** par fournisseur/ST, marqueurs à la date prévue, statuts colorés + retards, filtres, ligne « aujourd'hui ». **Clic → modale** : détail BC + **BC PDF** + **BL si réceptionné** + **changement de date d'arrivée**. Route `POST /api/expeditions/bc/:id/date-arrivee` (`src/index.tsx`) qui **gèle la 1ʳᵉ date** dans `date_livraison_initiale`. Réception → pose `date_reception_reelle`. **OTD fournisseur/ST recalé sur la 1ʳᵉ date prévue** dans les 3 calculs (`kpi.ts` `fournisseurs()`, `queries.ts` `computeOtd` + `getFournisseurScorecard`).
- **Migration DB : oui** — `scripts_import/bc_arrivees_planning.sql` (`bons_de_commande + date_livraison_initiale + date_reception_reelle`). Appliquée en **local Docker** + ajoutée au **schéma reproductible** (`docker/db/seed/schema.sql`). **⚠ À appliquer au cloud** (Management API/PAT) pour activer le gel en prod ; **tout fail-soft** en attendant (la date se change, l'OTD retombe sur `date_livraison`).
- Vérifié : `tsc` 0 · build ✓ · **harnais 61/0** · e2e navigateur (rendu timeline, 0 erreur console, clic → modale, route `200` round-trip, fail-soft cloud confirmé, BC-2026-001 remis à l'identique).
- Fichiers : `src/expeditions.tsx`, `src/index.tsx`, `src/queries.ts`, `src/kpi.ts`, `scripts_import/bc_arrivees_planning.sql`, `docker/db/seed/schema.sql`. Doc : `technique/06-modules/expeditions.md`, `technique/03-base-de-donnees.md`, `technique/07-api-reference.md` (régénérée), `manuel/expeditions.md`. **Captures à refaire : oui** (onglet Planning).

## 2026-08-11 — Docker : schéma métier reproductible committé (réinstallation VM sans cloud)
- **Besoin** : pouvoir réinstaller la stack Docker « en l'état » sur une VM Linux **sans dépendre du cloud** (jusqu'ici la base démarrait vide, le schéma métier n'était pas versionné → il fallait un `pg_dump` du cloud pour retrouver les tables).
- **Fait** : `docker/db/seed/schema.sql` — **schéma public complet versionné** (**101 tables** + 51 policies RLS + 707 droits anon, **structure seule, zéro donnée**). **Auto-appliqué à la 1ʳᵉ init** : `db.Dockerfile` le cuit dans `/docker-entrypoint-initdb.d/migrations/zz-erp-schema.sql` (après les rôles/extensions Supabase). Une VM neuve fait `docker compose up -d --build` → **tout le schéma sans accès cloud**.
- **Deux parties** : (1) **corps** = `pg_dump --schema-only` du miroir Docker local (77 tables), nettoyé (retrait `\restrict`/`\unrestrict` + `ALTER DEFAULT PRIVILEGES`, `CREATE SCHEMA IF NOT EXISTS`) ; (2) **appendice « tables complémentaires »** = **24 tables** présentes en prod mais absentes du miroir local, **reconstituées depuis le code** (interfaces `src/types.ts` + payloads d'insert `src/queries.ts`/`index.tsx` ; colonnes toutes nullable = sur-ensemble sûr, `id text` PK, RLS permissive anon + grants). Tables ajoutées : `bons_sous_traitance`, `controles_cotes`, `etudes_capabilite`, `commandes_prioritaires`, `demandes_prix_reponses`/`demandes_prix_lignes`, `affaires`, `machine_bdt_historique`, `operateur_bdt_historique`, `mtbf_machines`, `habilitations`, `releves_eau`/`releves_bains`, `balancelles`, `audits`, `demandes_site`, `affectation_poste`, `competences_operateur`, `operateur_presence`, `shifts`, `interlocuteurs`, `fournitures_nomenclature`, `produits_perissables`, `preparations_techniques`. 3 références mortes ignorées (`articles_stock`/`employes`/`ged` = alias de `stock`/`salaries`/`documents`).
- `.gitignore` : `!docker/db/seed/schema.sql` (les dumps de **données** `*.sql` restent ignorés). READMEs (`docker/README.md`, `docker/db/seed/README.md`) mis à jour (schéma = auto ; données = facultatives depuis le cloud).
- Vérifié : `schema.sql` s'applique sur une base jetable **0 erreur** (101 tables, 51 policies, 707 grants anon), 0 `INSERT`/`COPY` (aucune donnée) ; le rôle **anon lit+écrit** les nouvelles tables (RLS + grants) ; appliqué aussi à la base Docker **live** (101 tables) → app locale complète. Fichiers : `docker/db/seed/schema.sql`, `docker/db.Dockerfile`, `.gitignore`, `docker/README.md`, `docker/db/seed/README.md`.


## 2026-08-11 — Focus « lot » aussi sur le Gantt BST / sous-traitance (symétrie BDT/BST)
- Miroir du focus BDT, côté **sous-traitance** (onglet « Planning Gantt BST » de la Programmation) : **cliquer/sélectionner un BDS** n'affiche plus que les **sous-traitants traversés par son lot** (les autres lanes disparaissent) ; aucune sélection → tout s'affiche.
- Impl. (`src/prod.tsx`) : `focusLotBst` + `bstLotFournSet(key)` (= `sous_traitant_id` des BDS du même `bstLotKey`), filtre `BST_FOURN` dans `bstBuildBody`, `focusBstLot`/`clearFocusLotBst`/`updateBstFocusBanner`, bandeau `bstFocusBanner` « Tout afficher ». Déclencheurs : clic sur une barre BDS (garde anti-dbl-clic pour ne pas gêner l'ouverture de la commande) + sélection d'un BDS en attente ; sortie : bouton, re-clic (toggle) ou placement (`bstAssignDay` remet `focusLotBst=null`).
- Vérifié navigateur (3 sous-traitants, lot L1 sur ST1+ST2, lot L2 sur ST3) : sans focus 3 lanes → focus L1 → 2 lanes → « Tout afficher » → 3, **0 erreur console**. tsc 0, build, harnais 61/0. La fluidité du planning est désormais **symétrique BDT/BST**.


## 2026-08-11 — Planning unifié : sous-nav « Programmation ↔ Affectation » (chantier A)
- Les deux plannings, jusque-là dispersés, sont réunis sous **un seul outil « Planning »** à deux sous-onglets : **Programmation** (par poste, pilotage amont — `/production/service`, avec le focus « lot ») et **Affectation** (par opérateur, affectation des personnes aux postes — `/production/planning`). Chacun conserve ses **volets BDT / BST** (onglets internes existants).
- Impl. **à faible risque, cohérente SSR** : nouveau helper `planningSubNav(active)` (`src/shared.ts`) — barre « Planning · Programmation | Affectation » rendue en tête des DEUX pages (l'active surlignée, l'autre = lien). Pas de fusion des scripts (qui portent les mêmes noms `buildGantt`/`makeBdtBar`/`affectBDT` → collisions évitées) : la bascule = navigation SSR (< 1 s, comme tout l'ERP). Les 4 autres onglets de Programmation (Présence, Commandes & Lots, Process, Dashboards) sont **conservés** (choix utilisateur). Même entrée sidebar `service-prod`.
- Vérifié navigateur : les 2 pages portent la sous-nav, onglet actif correct (Affectation en orange sur `/production/planning`, Programmation sur `/production/service`), volets BDT/BST intacts, **0 erreur console**. tsc 0, build, harnais 61/0. Fichiers : `src/shared.ts`, `src/prod.tsx`, `src/planning_bdt_bds.tsx`.
- **RESTE** : filtre « focus lot » à porter aussi sur le sous-onglet **BST** (les deux plannings) — la seule pièce encore demandée.


## 2026-08-11 — Planning de programmation : focus « lot » au clic d'un BDT (fluidité)
- Sur le planning de programmation (`/production/service`, `pageServiceProd`, Gantt par **poste**), **quand un BDT est sélectionné/cliqué**, le Gantt ne garde visibles que les **postes traversés par le lot** de ce BDT (les autres lanes disparaissent) → lecture directe du chemin critique du lot ; **aucune sélection → tout s'affiche**.
- Impl. : état global `focusLot` (clé de lot via `lotKey`), `lotPostesSet(key)` = postes des BDT du même lot (`posteOfBdt`), filtre ajouté à `buildGantt` (`_focusSet`). Déclencheurs : **clic** sur une barre BDT (`focusBdtLot`, garde anti-double-clic pour ne pas gêner la sortie matière au dbl-clic) **et** sélection d'un BDT en attente (`selectPendBdt` focalise sa route → placement plus simple). Sorties de focus : bouton **« Tout afficher »** (bandeau `lotFocusBanner`), re-clic du même BDT (toggle), ou placement (`affectBDT` remet `focusLot=null`).
- Vérifié navigateur (données injectées : 3 postes, lot A sur 2 postes, lot B sur 1) : sans focus 3 lanes → focus lot A → 2 lanes (postes du lot uniquement) → « Tout afficher » → 3 lanes, **0 erreur console**. tsc 0, build, harnais 61/0. Fichier : `src/prod.tsx`.
- **RESTE** (demandé) : (a) même filtre sur le sous-onglet **BST/sous-traitance** ; (b) gros chantier — regrouper tous les plannings dans **un seul onglet à sous-onglets** (Planning complet BDT · Planning BDS · Affectation BDT · Affectation BST).


## 2026-08-11 — Production : fractionner un BDT long en plusieurs morceaux
- **Besoin** : un BDT peut être très long → pouvoir le séparer facilement en plusieurs morceaux planifiables séparément.
- Un BDT n'ayant **pas de quantité**, le fractionnement se fait **par temps** : `duree`, `temps_alloue` et `temps_machine_alloue` sont répartis au prorata (somme **exactement** conservée). Le **morceau 1 = le BDT d'origine réduit** (garde son id et sa place) ; les **morceaux 2..N** sont créés (id `…-M2`, `…-M3`…), avec les mêmes rattachements (affaire/commande/lot/pièce/opération/process/poste/machine/OAS/matiere_ok…), remis **« à programmer »** (statut `programme`, opérateur/début/date remis à zéro) pour être placés un par un.
- **UI** : clic droit sur une barre BDT du planning (`/production/service`) → **« Séparer en morceaux »** (masqué si BDT reçu/soldé) → modale : nombre de morceaux (2–12) + durées éditables (réparties également par défaut, contrôle de somme live). Route **`POST /api/production/bdt/:id/separer`** (`{parts:[…]}` ou `{n}`) — refuse un BDT démarré/soldé, normalise les durées au prorata.
- Vérifié e2e réel : BDT 12 h → `[6,4,2]` = original 6 h + `…-M2` 4 h + `…-M3` 2 h (`temps_machine_alloue` 10 → 5+3,33+1,67 = 10, somme conservée), tous `programme`, `-TEST-` nettoyé ; modale navigateur OK (N=3 → [4,4,4], contrôle de somme), **0 erreur console**. tsc 0, build, harnais 61/0. Fichiers : `src/index.tsx`, `src/prod.tsx`.


## 2026-08-11 — 3 bugs du flux offre→prod corrigés (visibilité BDT au planning, plan en prépa, revisualisation DT)
- **Bug 1 — BDT visibles au planning avant réception matière.** Symptôme : offre acceptée mais prépa non faite + DA non transformées en BC → aucune matière reçue, pourtant les BDT apparaissaient dans le planning. **Cause** : la goulotte matière+prépa (`_pretBDT`) n'existait QUE sur `/production/planning` (`pageUnifiedPlanning`) ; or la sidebar « Production » ouvre `/production/service` (`pageServiceProd`), qui affichait **tous** les BDT sans filtre — et la cascade d'acceptation crée les BDT en `matiere_ok:false`. **Fix** : réplication de la porte sur `/production/service` (et sur la route orpheline `/production/gantt-bdt`) — `getPreparationsTechniques()` chargé, `affPrepaOpen` construit, BDT filtrés sur `(matiere_ok !== false) && prépa faite` avant rendu. La matière ne passe `true` qu'à la réception de TOUS les BC de l'affaire (`/api/expeditions/bc/:id/receptionner`). Vérifié : 4 BDT `matiere_ok:false` en base → `BDTS`=0 sur `/production/service` (avant : 4). Fichiers : `src/index.tsx`.
- **Bug 2 — Plan absent de la prépa technique.** La page `/be/preparation` ne captait que les codes programme CN. **Fix** : ajout d'une carte **« Plan de la pièce »** (N° de plan + indice, Nom du fichier plan/CAO) en tête du formulaire, préremplie depuis `nomenclatures.num_plan`/`plan_fichier` (colonnes existantes → **zéro migration**), persistée par la route existante `POST /api/nomenclature/:id/programmes` (étendue). Vérifié : carte affichée + préremplie (`PREPLAQUE`) à côté des codes programme. Fichier : `src/index.tsx`.
- **Bug 3 — DT analysées non consultables (persistait).** Le correctif e0c012c98 avait ajouté le bouton « Visualiser » + élargi le filtre, mais **oublié de peupler `BE_DTS_MAP`** (construit uniquement depuis `DTS_BE` = `en_attente_be`). Une DT analysée est `dans_offres` → absente du map → `beOuvrirAnalyseDT` sortait sur « DT introuvable ». **Fix** (1 ligne) : `be.tsx:832` `JSON.stringify(DTS_BE)` → `JSON.stringify([...DTS_BE, ...DTS_OFFRES])`. Vérifié : DT `DT-2026-0001` (dans_offres) désormais dans le map, panneau s'ouvre. Note : le statut `commande_creee` n'est jamais écrit aujourd'hui (code mort inoffensif) ; après acceptation d'offre la DT reste `dans_offres`. Fichier : `src/be.tsx`.
- Investigation menée en workflow (3 agents parallèles). tsc 0, build, harnais 61/0, e2e navigateur 0 erreur console.


## 2026-08-11 — Sécurité : sous-navigation sur l'onglet « Conformité & Audit ISO 45001 » (symétrie QSE)
- Pour aligner les 3 services QSE, l'onglet **« Conformité & Audit ISO 45001 »** de la Sécurité passe à une **sous-navigation dédiée** (mécanisme `secConfSub`, ids `secc-sub-*` / `secc-subbtn-*`, même style que `envConfSub`/`auditSub`) — **2 sous-onglets** : **Programme d'audit** (`panelAudit` domaine securite = planning commun Qualité) · **Veille & conformité** (matrice SST, `confSec`). Le contenu empilé auparavant (audit + veille) est désormais commuté. Entité `conformite` + formulaire conservés.
- Vérifié : tsc 0, build, harnais 61/0, e2e (2 sous-onglets `secc-subbtn-*`, `secConfSub` présent, planning commun + veille SST). Fichier : `src/securite.tsx`. Les 3 services (Qualité/Sécurité/Environnement) exposent maintenant le même schéma « onglet Conformité & Audit → sous-onglets ».


## 2026-08-10 — Environnement : tout le normatif/RSE regroupé en UN onglet à sous-navigation (façon Qualité)
- **Demande** : « deux RSE » (onglet *RSE* + autodiag *ISO 26000*) et **deux onglets normatifs** séparés (ISO 14001 vs ISO 26000) → tout dans **un seul onglet organisé comme la Qualité**.
- **Fait** : les 4 ex-onglets `rse` / `parties` / `audit` (ISO 14001) / `iso26000` fusionnés en **un onglet « Conformité & Audit »** doté d'une **sous-navigation dédiée** (mécanisme `envConfSub`, ids `envc-sub-*` / `envc-subbtn-*`, style identique à `auditSub` de la Qualité) à **5 sous-onglets** : **Programme d'audit** (planning commun via `panelAudit` domaine environnement) · **Veille & conformité** · **Parties intéressées** (ISO 14001 §4.2) · **Autodiagnostic ISO 14001** · **ISO 26000 & RSE**. Le **doublon RSE est résorbé** : l'autodiagnostic ISO 26000 et les indicateurs RSE sont réunis dans le dernier sous-onglet (une seule section RSE).
- Périmètre : seuls les onglets normatifs/RSE sont touchés ; les onglets opérationnels (Déchets, Rejets, ATEX, Aspects & impacts, ICPE, GES, Tableau de bord) restent inchangés. Entités de données (`rse`, `parties-interessees`, `diagnostic-iso`, `diagnostic-iso26000`, `conformite`) et formulaires de création conservés — pure réorganisation de présentation.
- Vérifié e2e : onglet unique visible, 5 sous-panneaux commutés par `envConfSub`, RSE présent une seule fois (1 bouton « Nouvel indicateur »), planning commun dans le 1ᵉʳ sous-onglet, **0 erreur console**. tsc 0, build, harnais 61/0. Fichier : `src/environnement.tsx`.


## 2026-08-10 — Fix découvrabilité : la refonte des dashboards était en ligne mais non reliée à la navigation
- **Symptôme** : « rien n'a changé sur les dashboards malgré une grosse maj ». **Cause** : la refonte (15 dashboards filtrables `/dashboard/*` + hub `/dashboard` « Vue d'ensemble ») était bien **déployée** (production Cloudflare = commit ECME, postérieur à tous les commits Vagues 1-3), mais **aucun lien de navigation** n'y menait — pas d'entrée sidebar, aucun `href="/dashboard"` dans l'appli. L'utilisateur ouvrait donc toujours les **anciens onglets « Tableau de bord » internes** à chaque service (`panelDashboard`, non touchés par la refonte).
- **Correctif** : ajout d'une entrée **« Tableaux de bord »** dans `SIDEBAR_ITEMS` (`src/shared.ts`, juste sous Accueil, icône `fa-gauge-high`, `active: 'dashboard-hub'`) → pointe sur le hub. Depuis n'importe quelle page : sidebar → hub (15 cartes) → dashboard filtrable (presets période, site Seem/Semrac, toggle vs N-1, Exporter PDF). Ce n'était donc **pas** un problème de déploiement ni de cache (HTML SSR en `no-store`, pas de cache agressif).
- Vérifié e2e : la sidebar de chaque page service contient `href="/dashboard"` ; le hub rend 15 cartes ; `/dashboard/qualite` conserve la barre de filtres. tsc 0, build, harnais 61/0. **Piste de suivi** (optionnelle) : faire pointer les onglets « Tableau de bord » internes des services vers le dashboard complet correspondant pour lever toute ambiguïté.


## 2026-08-10 — ECME : contrôles périodiques auto-actualisés + fiche de vie + saisie du PV de vérification
- **Onglet ECME (Qualité) refondu pour coller au process réel SEEM-SEMRAC** (sources : Fiche de vie matériel, PV de vérification JP/MI/CO/FO/PC, Catalogue ECME PGE1-D1). Trois apports :
  1. **Contrôles périodiques auto-actualisés** — le statut n'est plus la colonne figée `ecme.statut` mais **recalculé live** (`ecmeStatutLive`, qref.ts) sur `date_prochain_etalonnage` vs aujourd'hui → **En retard / À vérifier < 30 j / Valide / Réformé** (pastilles couleur du catalogue réel). Un **bandeau « Contrôles à faire »** en tête liste retard + échéance ≤ 30 j (cliquables → vérification directe). KPIs + filtres alignés sur les statuts live.
  2. **Fiche de vie par ECME** — identité complète (marque, **modèle**, **n° commande**, **responsable**, capacité, précision…) + **journal des opérations** (historique des vérifications) + **export PDF** de marque (`/api/qualite/ecme/:id/fiche-vie.pdf`).
  3. **Saisie du PV de vérification**, famille-consciente : **JP/MI/CO/FO** → grille de justesse (cotes nominales × 5 relevés) → **Ej** (justesse, convention SEEM `Cn − MJ`) et **Ef** (fidélité = étendue au point de plus fort écart) **calculés en direct** ; **PC** → grille des becs (Vc/relevés → Vcr, Ej) ; autres familles → vérification simple (résultat B/M/HS + visa + certificat externe). La **classe reste saisie** (lue sur le tableau des écarts — aucun seuil de tolérance inventé). Chaque PV **alimente la fiche de vie** et **recale la prochaine échéance**.
- **DB** : table `ecme_verifications` (id, ecme_id souple + ecme_code, date, intervenant, lieu, famille, interventions, `mesures` jsonb, ej, ef, classe_*, résultat, décision, motif_nc, visa, a_refaire_avant, cale_etalon, pv_ref, indice, certificat_ref, organisme) + colonnes fiche de vie sur `ecme` (responsable/modele/num_commande/reforme). RLS permissive. Migration `scripts_import/ecme_verifications_schema.sql` appliquée **cloud** (Management API). ⚠ **Docker** : la table `ecme` n'existe pas encore dans le Supabase local — à créer/semer pour y activer la fonctionnalité.
- **Moteur** (`qref.ts`) : `computeEcmeMetro`/`computeEcmePC`/`computeEcmePV` (Ej/Ef), `ecmeStatutLive`, `ECME_TYPES` complété (légende catalogue : TSH, TS5H, TLD, PI, PIT, EDY, ME, PH, RG, GA, MA, PS…), `ecmeAddMonths`. Routes : POST `/verification` (recompute Ej/Ef serveur + bump échéances), PATCH/DELETE vérification, `fiche-vie.pdf`.
- **Fidélité vérifiée e2e sur le cloud réel (265 ECME)** : le moteur reproduit **exactement** le PV papier (JP 1 → point 22 : Ej **−0,01** ; point 150 : Ej **−0,004** ; Ef 0,02) ; save via l'app → vérif persistée + échéance recalée à +12 mois ; PDF fiche de vie HTTP 200 ; jeu d'essai `-TEST-` supprimé après coup. tsc 0, build, **harnais 61/0**, e2e navigateur **0 erreur console**. Déployé Cloudflare. Fichiers : `src/{qref,queries,index,qualite}.tsx/.ts`.


## 2026-08-09 — Audits de conformité normatifs : onglet unique partagé avec la Qualité (Sécurité + Environnement)
- **Sécurité et Environnement utilisent désormais le MÊME système d'audit que la Qualité** (table `audit_programme`, planning commun, routes `/api/audit/*`, moteur de sondes `getAuditAutoStatus`). Fini les diagnostics/veilles isolés : chaque module a **un seul onglet** « Conformité & Audit ISO 45001 » (Sécurité) / « Conformité & Audit ISO 14001 » (Environnement) qui embarque le **calendrier de planification commun** (le même que Qualité) filtré sur sa norme.
- **`panelAudit()` + `auditModuleScript()` exportés depuis `qualite.tsx`** (auparavant locaux) avec des options `{ domaine, titre }`. Le filtre `_domFilter` restreint le programme affiché à la norme du module (`securite` → réf. `45001` ou thème `I` ; `environnement` → réf. `14001` ou thème `J`) ; la Qualité reste la **vue consolidée** (tous les audits). Un audit ISO 45001 planifié depuis la Sécurité vit dans le **même `audit_programme`** et apparaît donc aussi côté Qualité — planning réellement commun, une seule source de vérité.
- **Fusion des onglets** demandée par l'utilisateur (« un seul onglet ») : la **veille réglementaire** (matrice de conformité SST / veille environnementale) et, pour l'Environnement, l'**autodiagnostic de maturité ISO 14001** sont repliés **sous** le planning d'audit dans ce même onglet (séparateurs visuels). Onglets retirés : Sécurité `Conformité` ; Environnement `Conformité env.` + `Diagnostic ISO 14001` (→ un seul `audit`). Formulaires de création (`conformite`) et KPI d'en-tête inchangés.
- **Câblage** : routes `/securite/service` et `/environnement/service` chargent `getAuditProgramme()` + `getAuditAutoStatus()` (fail-soft `.catch`) et les passent aux pages. `SEC_GROUPS`/`ENV_GROUPS` et la concaténation des panneaux mis à jour ; onglet actif par défaut inchangé (`duer` / `dechets`).
- Vérif : **tsc 0**, build OK, **harnais 61/0**, e2e navigateur sur les 2 pages — **0 erreur console**, `sec-panel-audit` visible avec les 3 blocs, panneaux autonomes supprimés, script `panelAudit` cohabite sans collision (`AUDIT_PROG`/`auditSub`/`auditYear` définis). Fichiers : `src/{qualite,index,environnement,securite}.tsx`.


## 2026-08-07 — Durcissement CI : typecheck strict bloquant (68 → 0 erreurs tsc) + 5 bugs runtime corrigés
- **`tsc --noEmit` passe à 0 erreur** (était à 68, héritées). Le typecheck redevient une **porte bloquante** dans `deploy.yml` (avant le build, échec rapide) et est ajouté à `npm run verify` (= `tsc && build && harnais`). But : bloquer en amont les régressions que ni esbuild (ne type-check pas) ni le harnais (ne teste pas les `dash*`) n'attrapent.
- **5 vrais bugs runtime démasqués par tsc** (pas du bruit de type) : (1) `listes.tsx` `pageFournisseursST` appelait `dbData.map(mapFournisseurSt)` avec `mapFournisseurSt` **inexistant** → `/achats/fournisseurs-st` **plantait dès qu'il y avait des ST** (adaptateur DB→vue écrit) ; (2) `index.tsx` `updateCommande` **jamais importé** → acceptation d'offre avec avoir = 500 (import ajouté) ; (3) `expeditions.tsx` `qualiteBloque` = closure locale appelée depuis une fonction module → **ReferenceError sur l'onglet Commandes** (passée en paramètre) ; (4) `rh_service.tsx` `.replace` sur `employe_nom` possiblement `undefined` → crash SSR (garde `?? ''`) ; (5) `index.tsx` `field('Adresse',…,true)` passait `true` pour `cols` (numérique) → le champ adresse ne s'étendait pas (→ `2`).
- **Bruit de type résorbé** : imports dupliqués (`getMouvementsStock`/`createBDSRow`), colonnes DB réelles ajoutées aux types (`Offre.version`/`motif_negociation` ; `BonDeCommande.pv_id`/`accuse_fournisseur_le`/`date_relance`/`transporteur`/`qte_commandee`/… ; `Quarantaine.statut` +`en_validation`) ; annotations `any`/`Record<string,string>` précises, gardes `!`/`?? ''`, casts `as any` ciblés (ServeStatic, statut 204).
- Build OK, **harnais 61/0**, e2e des pages corrigées HTTP 200 (fournisseurs-st, expéditions, rh, compta, finances). Fichiers : `src/{listes,index,types,expeditions,finances,affectation,prod,qualite,rh_service}.tsx/.ts`, `.github/workflows/deploy.yml`, `package.json`. **À noter** : `bons_de_commande.transporteur`/`transporteur_ref` sont écrits par la route de réception BC (index.tsx:2014) mais absents de l'inventaire de colonnes Vague 2 — à vérifier en base (sinon le PATCH échoue en silence via `.catch`).


## 2026-08-07 — Dashboards — fix cosmétique labels de graphes (dé-double-échappement)
- Retrait du `esc()` redondant sur les labels Chart.js pré-Vague 2 restants (`cmClients`, `qParType`, `qGrav`, `dirClients`, `prodCharge`) : Chart.js peint les labels en texte brut sur canvas et `attrJSON` échappe déjà l'attribut `data-chart`, donc `esc()` affichait `&amp;` littéral pour un client/type nommé « Dupont & Fils ». `esc()` conservé sur le texte HTML (miniBar/tableaux/listes). Tous les labels de graphes des 15 dashboards sont désormais cohérents. Build OK, harnais 61/0, e2e 0 erreur console.


## 2026-08-07 — Dashboards filtrables — Vague 3 (RH/OAS/Expédition/Programmation/BE/Environnement) — refonte terminée
- **6 derniers dashboards rendus filtrables** (fin de la refonte : les 15 dashboards sont désormais filtrables) : `rh` (période + site via `entite` + N-1), `oas` (période + N-1, **nouvelle fonction `oas()`**), `expedition` (période + client + N-1, **nouvelle fonction `expedition()`**), `programmation` (période + site + client), `be` (site via `entite` + client + N-1), `environnement` (période + site via `entite` + N-1). Routes câblées `parseFilter(c)`.
- **Enrichissements** : RH → **répartition par contrat** + **tendance absentéisme** (N-1) + **ancienneté des habilitations** (30/60/90 j) ; OAS → **taux de conformité des sessions** + **durée moyenne de traitement** ; Expédition → **OTD réconcilié** (via `production().otd`) + **répartition par transporteur** + **volume expédié** ; Programmation → **charge prévisionnelle 8 semaines** + **file d'ordonnancement** (BDT non affectés/non datés) + **charge par site** ; BE → **structure de coût moyenne** (matière/MO/machine/ST empilé) + **corrélation CRU↔marge** (nuage) + **taux de complétude** des nomenclatures ; Environnement → **veille réglementaire en alerte** + **incidents mensuels** (N-1) + **panneau Indicateurs RSE** (slice `rseEnv` jusqu'ici ignoré).
- **3 bugs latents corrigés** (détectés par l'analyse/revue) : RH `parContrat` lisait `type_contrat` **inexistant** (→`contrat`) et `heuresSup` était toujours 0 (→`heures_supp_s/3600`) ; BE lisait `n.activite` **inexistant** sur les nomenclatures (→`n.entite`) ; Expédition comptait les **réceptions** comme BL clients (`type_bl!=='bst'` → `!type_bl || type_bl==='client'`, aligné sur `getBLClients`/module Expéditions).
- **Cohérence de filtre (revue)** : `chargePrevisionnelle(d, nWeeks, f?)` prend le filtre et **borne la capacité opérateurs par site** (`salaries.entite`) ; la carte « Charge atelier » de Programmation est recalculée sur le périmètre filtré (le dénominateur capacité de `production()` n'était pas filtré par site). Fallback `date_debut`→`debut` corrigé.
- Build OK, **harnais 61/0**, tsc 0 nouvelle erreur. Vérifié à l'écran (6 dashboards HTTP 200 base + `preset`/`site`/`compare`/`print`, **0 erreur console** sur scatter/empilé/mixte/N-1). Sans migration. Fichiers : `src/kpi.ts`, `src/dashboards.tsx`, `src/index.tsx`. **Refonte dashboards filtrables terminée** (moteur + 15 dashboards + transverses hub/export/drill-down).


## 2026-08-07 — Dashboards filtrables — Vague 2 (Achats/Fournisseurs/Stock/Maintenance) + 4 bugs corrigés
- **4 dashboards rendus filtrables** (même patron que la Vague 1) : `achats` (période + fournisseur + N-1), `fournisseurs` (période + N-1), `stock` (**site** Seem/Semrac + N-1), `maintenance` (site + machine + N-1). Fonctions `kpi.ts` paramétrées `(d, f?)`, routes câblées `parseFilter(c)`.
- **Enrichissements** : Achats → **Pareto dépense fournisseur** (repli sur BC engagés si factures fournisseur vides), **ancienneté des BC en retard** (buckets), **répartition des DA par nature** ; Fournisseurs → **nuage OTD × dépense** (bubble), **NC par fournisseur** (+ colonne au scorecard) ; Stock → **classement ABC formalisé** (Pareto 80/95/100 + compteurs A/B/C), **suggestions de réappro** (qté à commander via `point_commande`/`qte_commande`/`stock_maxi`), **valeur par activité** ; Maintenance → **backlog OM par âge** (0-7/8-30/31-90/>90 j depuis `date_signalement`), **coût de maintenance mensuel**.
- **4 bugs latents corrigés** (détectés par revue adversariale, invisibles sans données) : (1) `bcRetard` lisait `date_livraison_prevue` **inexistant** → KPI « Retards fournisseur » **toujours à 0** (vraie colonne `date_livraison`) ; (2) `fillRate` lisait `b.quantite` inexistant → `qte_recue/qte_commandee` ; (3) comptage fournisseurs actifs (`fournisseurs.actif` bool vs `fournisseurs_st.statut`) ; (4) `machinesOpex.machine_nom` toujours `undefined` (absent du SELECT) → **jointure par `machine_id`** sur le parc.
- **Correctif de conception (revue) : ne jamais fenêtrer par date la SOURCE des instantanés/séries dans `filterRows`.** Passer `dateField` écrasait les compteurs de backlog (retards/DA/BC ouverts) dès qu'un filtre Site/N-1 était actif, ET mettait à plat les overlays N-1 (les lignes de l'année N-1 étaient filtrées avant `monthlySeries`). Aligné sur `commercial()/finance()` : instantanés non bornés par date, agrégats de période via `inP()`, séries via `monthlySeries(mk)`/`prevYearKeys(mk)`. Labels de graphes dé-doublement-échappés (retrait du `esc()` redondant avant `attrJSON`).
- Build OK, **harnais 61/0**, tsc 0 nouvelle erreur (mes fichiers). Vérifié à l'écran (4 dashboards HTTP 200 base + `preset`/`site`/`compare`/`print`, **0 erreur console** sur les graphes à risque). Sans migration. Fichiers : `src/kpi.ts`, `src/dashboards.tsx`, `src/index.tsx`. Reste Vague 3 (RH/OAS/Expédition/Programmation/BE/Environnement).


## 2026-08-07 — Dashboards — transverses (export PDF + hub « Vue d'ensemble » + drill-down)
- **Hub « Vue d'ensemble »** (nouvelle route `/dashboard`, fonction `dashHub`) : grille de 15 cartes (une par dashboard) avec **KPI phare + lien** — CA cumulé (Direction), CA du mois (Commercial), trésorerie (Finance), DT à analyser (BE), DA à traiter (Achats), OTD global (Fournisseurs), OTD (Production), charge (Programmation), NC ouvertes (Qualité), sessions (OAS), disponibilité (Maintenance), valorisation (Stock), effectif (RH)… Point d'entrée unique du pilotage. La route charge `stock/mtbf/machinesOpex/fournisseurs/sousTraitants` pour des chiffres réels.
- **Export / impression PDF** : mode `?print=1` sur les 5 dashboards filtrables — `PRINT_HEAD` (`dash_ui.ts`) masque la sidebar + la barre de filtres (`class="no-print"`), impose A4 paysage `print-color-adjust:exact` et déclenche `window.print()`. Bouton **« Exporter PDF »** dans la barre de filtres (option `exportable`). Idéal pour une revue de direction filtrée sur une période/un site.
- **Drill-down filtré** : tuiles KPI cliquables qui **propagent la querystring de filtre active** vers la liste cible — Qualité « NC ouvertes » → `/qualite/nc-liste`, Commercial « conversion » → `/commercial/offres-liste`, « carnet » → `/commercial/dt-liste`, Production « BDT actifs » & « avancement » → `/production/bdt-liste` (période/site/client transmis).
- Build OK, **harnais 61/0**. Vérifié à l'écran : hub HTTP 200 (10+ liens + KPI phares), `?print=1` (`@media print`/`@page`/`window.print`), drill-downs avec querystring propagée. Fichiers : `src/dash_ui.ts`, `src/dashboards.tsx`, `src/index.tsx`. Sans migration. Reste : Vagues 2 (Achats/Fournisseurs/Stock/Maintenance) et 3 (RH/OAS/Expédition/Programmation/BE/Environnement).


## 2026-08-05 — Dashboards filtrables — Vague 1 (Production/Direction/Finance/Qualité + B1)
- **4 dashboards rendus filtrables** (même patron que Commercial) : `production`, `direction`, `finance`, `qualite` — barre de filtres (période/site/client + N-1), fonctions `kpi.ts` paramétrées (`finance/production/qualite(d, f?)` : filtre site/client, séries bornées à la période, labels de mois dynamiques, séries N-1). Routes câblées avec `parseFilter(c)`. Direction propage le filtre à tous ses agrégats.
- **Données jetées désormais affichées** : Finance → **top clients au CA** + **aging fournisseurs** (symétrique) + ratio recouvrement ; Qualité → **Pareto NC par type**, **par gravité**, **ancienneté des NC ouvertes** (0-30/30-60/60-90/90+) + overlay NC N-1 ; Production → **temps alloué vs réel** (productivité) + **distribution du lead time**.
- **B1 — dashboards sous-alimentés corrigés** : Maintenance exploite enfin **`machinesOpex`** → **OEE**, **coût horaire réel**, **OPEX par machine**, **MTBF/MTTR par machine** ; Direction charge `mtbf`+`controlesCotes`+`machinesOpex` → **Cpk et dispo réels** (retrait de l'appel mort `be()`) ; OAS affiche les **relevés d'eau** (autosurveillance rejets, chargés mais jamais rendus) ; Fournisseurs calcule le **fill rate** (annoncé, jamais calculé).
- Build OK, **harnais 61/0**. Vérifié à l'écran (7 dashboards HTTP 200, barre de filtres sur les 4, enrichissements rendus). Fichiers : `src/kpi.ts`, `src/dashboards.tsx`, `src/index.tsx`. Reste Vague 1 : transverses (export PDF, hub, drill-down listes) ; puis Vagues 2-3.


## 2026-08-05 — Dashboards filtrables — moteur de filtres + Commercial (Vague 1, socle)
- **Moteur de filtres** (`src/dash_filter.ts`, nouveau) : `DashFilter` + `parseFilter(c)` (query params `preset/from/to/site/client/machine/fournisseur/compare/print`), `period(f)` (résout la plage → liste de mois, rétro-compatible = année courante sans filtre), `filterRows` (plage + site + client, sans vider une table dépourvue du champ), `filterQS` (sérialisation pour liens/drill-down), presets (Ce mois / Mois-1 / YTD / 12 mois / Année / Perso).
- **`kpi.ts` paramétrable** : `monthlySeries` accepte une **liste de clés de mois** (période arbitraire) en plus du mode année courante ; `commercial(d, f?)` devient **filtrable** (période/site/client), calcule la **série N-1** et le **Pareto clients** (cumul %). Rétro-compatible : sans `f`, résultats identiques à l'existant.
- **Barre de filtres UI** (`dash_ui.ts` `filterBar`) : sticky, boutons preset + plage perso + select site + comboboxes contextuelles (client/machine/fournisseur, héritent de la combobox auto) + toggle **vs N-1** + Réinit. Navigation via `dashSetFilter` (scroll préservé façon `softReload`). `kpiCard` gagne une option **`href`** (tuile cliquable → drill-down filtré).
- **Dashboard Commercial** câblé de bout en bout (route `parseFilter` → `dashCommercial(d, f)`) : période/site/client changent les KPI et le graphe (labels de mois dynamiques), overlay **Total N-1** au toggle, Pareto + concentration clients, carnet cliquable.
- Build OK, **harnais 61/0**. Moteur vérifié en isolation (perso Juin-Aoû → 3 mois, 12 mois à cheval sur 2 ans, série N-1 alignée, filtre site tolérant) + filterBar rendue à l'écran. Fichiers : `src/dash_filter.ts`, `src/kpi.ts`, `src/dash_ui.ts`, `src/dashboards.tsx`, `src/index.tsx`. Suite (même patron) : Production, Direction, Finance, Qualité + enrichissements + export/hub/drill-down.


## 2026-08-05 — Prévisionnel : charge atelier + CA programmé à venir
- **CA prévisionnel** (Dashboard Direction) : le **carnet de commandes ouvert** est projeté dans le temps par **date de livraison** — 4 KPIs (carnet total à venir, CA programmé sur 6 mois, à livrer en retard, au-delà de 6 mois) + **graphe barres empilées Seem/Semrac par mois de livraison** + détail mensuel. Fonction pure `caPrevisionnel(d, nMonths)` (`src/kpi.ts`).
- **Charge atelier prévisionnelle** (Dashboard Production) : heures des **BDT ouverts** projetées par **semaine** (8 semaines, sur `date_prevue`→`date_debut`) vs **capacité** (opérateurs × 35 h) — barres colorées (rouge si surcharge) + ligne de capacité + synthèse (capacité/sem, opérateurs, semaines en surcharge, heures en retard/au-delà). Fonction pure `chargePrevisionnelle(d, nWeeks)`.
- Helpers génériques `forwardMonthly` / `forwardWeekly` (buckets futurs, avec `retard`/`auDela`). Vérifié à l'écran (graphe charge 8 semaines instancié 03/08→21/09 ; KPIs CA prévisionnel rendus). Build OK, **harnais 61/0**. Sans migration. Fichiers : `src/kpi.ts`, `src/dashboards.tsx`.


## 2026-08-05 — Environnement Phase 4 (fin) — cycle de vie + ISO 26000 + sonde audit env
- **Perspective cycle de vie (ISO 14001 §6.1.2)** : nouveau champ **« Étape du cycle de vie »** sur les aspects/impacts (référentiel `CYCLE_VIE_ETAPES` : acquisition MP → conception → transport amont → réalisation/stockage → transport aval → utilisation → fin de vie → élimination) + repère dépliable (maîtrise/influence) dans l'onglet Aspects. Colonne `etape_cycle_vie` fail-soft (`hseAspectsHasCycleVie`).
- **Autodiagnostic ISO 26000 (RSE)** : nouvel onglet « ISO 26000 (RSE) » — **7 questions centrales** (`ISO26000_QUESTIONS`), niveau de maturité 1-4 par question, taux de maturité, bouton **« Initialiser (7 questions) »** (route bulk idempotente). Nouvelle table `hse_diagnostic_iso26000` (fail-soft).
- **Sonde d'audit environnementale** : le moteur `getAuditAutoStatus` (thème J) gagne **4 sondes env** auto-observables — **déchets dangereux tracés** (BSDD), **rejets dans les VLE**, **zones ATEX à jour**, **AES maîtrisés** — exposées dans le sélecteur `AU_SONDES` (Qualité › Audit). Le thème J devient auto-évaluable comme les thèmes qualité/SST.
- **Migration** `scripts_import/env_phase4_finish_schema.sql` (colonne `etape_cycle_vie` + table `hse_diagnostic_iso26000`). Fail-soft.
- Build OK, **harnais 61/0**. Fichiers : `src/qref.ts`, `src/queries.ts`, `src/index.tsx`, `src/environnement.tsx`, `src/qualite.tsx`, `scripts_import/env_phase4_finish_schema.sql`.
- **Bilan** : les **14 outils** de la présentation SME sont désormais tous couverts dans l'ERP (contexte/parties intéressées, veille, ICPE/Seveso, classification déchets EU/BSD, plans d'action, analyse environnementale + cycle de vie, AES multi-axes, diagnostic ISO 14001 + sonde audit, bilan GES, tableaux de bord, RSE/ISO 26000).

## 2026-08-05 — Environnement Phase 4 (2/2) — RSE sociale complète (F/H · OETH · turnover)
- **Données sociales RSE** : 3 colonnes ajoutées aux salariés — **sexe**, **OETH** (travailleur handicapé), **date de sortie** — via un bloc « Données sociales (RSE) » du formulaire salarié (RH › Employés). Le moteur `computeRseAuto` calcule désormais l'**index égalité F/H** (% de femmes), le **taux OETH** (vs obligation légale 6 %) et le **turnover 12 mois** (départs / effectif) ; ces 3 indicateurs s'ajoutent au bloc « Indicateurs RSE consolidés (AUTO) » de l'Environnement.
- **Migration** `scripts_import/env_rh_rse_schema.sql` (colonnes `salaries.sexe/oeth/date_sortie`). **Fail-soft** (`salariesHasRse` dans `queries.ts`) : create/update salarié retirent ces champs si les colonnes sont absentes → aucune régression RH avant migration.
- Build OK, **harnais 61/0** (les scripts clients RH passent l'anti-échappement). Vérifié à l'écran (formulaire salarié avec sexe/OETH/date de sortie, 3 nouvelles cartes RSE sur l'Environnement, 0 erreur). Fichiers : `src/rh_service.tsx`, `src/index.tsx`, `src/queries.ts`, `src/environnement.tsx`, `scripts_import/env_rh_rse_schema.sql`.

## 2026-08-05 — Environnement Phase 4 (1/2) — Parties intéressées + Diagnostic ISO 14001
- **Onglet « Parties intéressées »** (ISO 14001 §4.2) : registre des parties (DREAL, riverains, clients, personnel, assureur, collectivités…), attentes/exigences, cotation **Influence × Maîtrise** (1-4, score = I×M auto via `prepare`), exigence retenue, mode de réponse. Nouvelle table `hse_parties_interessees`.
- **Onglet « Diagnostic ISO 14001 »** : autodiagnostic clause par clause (chapitres 4→10, référentiel `ISO14001_DIAGNOSTIC`/`ISO14001_NIVEAUX` dans `qref.ts`), **niveau actuel/cible 1-4**, constat, action ; **taux de maturité** calculé (moyenne /4 + %) + KPIs (maturité, cible, chapitres à traiter ≤ 2). Bouton **« Initialiser la grille (7 chapitres) »** (route bulk idempotente `/api/environnement/diagnostic-iso/init`). Nouvelle table `hse_diagnostic_iso`.
- **Migration** `scripts_import/env_parties_diagnostic_schema.sql` (2 tables + RLS permissive). Getters **fail-soft** (`[]` si absentes) → l'appli tourne avant migration ; la route init crée les chapitres une fois la table présente.
- Build OK, **harnais 61/0**. Vérifié à l'écran (11 onglets, formulaires I×M et diagnostic complets, bouton d'init, route init idempotente, 0 erreur). Fichiers : `src/qref.ts`, `src/queries.ts`, `src/index.tsx`, `src/environnement.tsx`, `scripts_import/env_parties_diagnostic_schema.sql`.

## 2026-08-05 — Environnement Phase 3 (suite) — déchets automatiques (tous flux)
- **Infrastructure idempotente** : colonnes `source_type` / `source_ref` sur `hse_dechets` + helper **`ensureHseDechet(source_type, source_ref, payload)`** (`queries.ts`) qui crée un déchet **une seule fois** par événement source (pas de doublon au rejeu). Fail-soft (`hseDechetsHasSource`) — sans les colonnes, crée quand même (sans dédup). **DDL** `scripts_import/env_dechets_source_schema.sql` (à jouer sur le cloud).
- **Flux câblés** (le lot rejeté/détruit remonte au registre des déchets de l'Environnement) :
  - **Quarantaine** détruite (`/api/qualite/quarantaine/:id/statuer` rejeté) → déchet (refactor vers `ensureHseDechet`).
  - **Rebut NC** : une NC dont l'action immédiate = « Rebut » (à la création **ou** en modification) → déchet. **Vérifié e2e cloud** (NC Rebut → déchet « Rebut NC … » créé, puis supprimé).
  - **Produits périmés** : bouton **« Déchets des produits périmés »** (onglet Déchets) → route bulk `/api/environnement/perissables-expires/declarer` qui déclare tous les périssables expirés (dangereux si chimique).
- *Restants (notés)* : vidange de bain OAS (nécessite une action côté module OAS) et chutes/copeaux métalliques (pesée par lot) — hors périmètre auto immédiat.
- Build OK, **harnais 61/0**. Fichiers : `src/queries.ts`, `src/index.tsx`, `src/environnement.tsx`, `scripts_import/env_dechets_source_schema.sql`.

## 2026-08-05 — Environnement Phase 3 — Bilan GES monétaire + déchet auto + veille enrichie
- **Bilan GES / Carbone (BEGES)** — méthode **monétaire** (choix utilisateur) : nouveau moteur `computeBilanGES` + facteurs d'émission ADEME (`FACTEURS_GES`, `FACTEURS_GES_MONETAIRE`) dans `src/qref.ts`. Les **achats fournisseurs** sont ventilés par **compte PCG** et convertis en tCO₂e via un facteur monétaire (kgCO₂e/€) → **scopes 1 (direct) / 2 (électricité) / 3 (indirect)**. Nouvel **onglet « Bilan GES »** (cartes scopes + total, répartition par poste, table des facteurs) + **carte dans le dashboard** `/dashboard/environnement` (donut des scopes). Calculé dans la route (aucune migration ; se remplit à mesure de la saisie des achats en Compta).
- **Déchet automatique** : un lot **rejeté/détruit en quarantaine** (`/api/qualite/quarantaine/:id/statuer` mode immédiat « rejeté ») crée désormais **automatiquement une entrée au registre des déchets** (`createHseDechet`, zone « Quarantaine »). *Premier des flux « déchets auto » ; suivants (vidange OAS, rebut NC, périssable, chutes) à câbler avec un `source_ref` pour l'idempotence.*
- **Veille réglementaire enrichie** (fin de Phase 2) : `hse_conformite` reçoit **source de veille**, **type de texte** (loi/décret/arrêté/directive/règlement/norme/arrêté préfectoral) et **date de parution/MàJ** — formulaire + colonne « Parution ». **Migration** `scripts_import/env_veille_schema.sql` (fail-soft `hseConformiteHasVeille`, à jouer sur le cloud).
- **AES multi-axes** confirmé opérationnel sur le cloud après migration : test e2e — criticité = **735** (7×7×5×5×(maîtrise 3/5)), axes **stockés** (probabilite/maitrise_* persistés), `-TEST-` supprimé.
- Build OK, **harnais 61/0**. Vérifié à l'écran (onglet GES avec scopes + facteurs, onglet veille avec nouveaux champs, dashboard). Fichiers : `src/qref.ts`, `src/environnement.tsx`, `src/dashboards.tsx`, `src/index.tsx`, `src/queries.ts`, `scripts_import/env_veille_schema.sql`.

## 2026-08-05 — Environnement Phase 2 (2/2) — AES cotation multi-axes (INRS)
- **Analyse environnementale (AES) refondue en cotation multi-axes** (Environnement › Aspects & impacts, grille INRS de la présentation) : la criticité passe de `gravité × fréquence` à **note = P × F × G × S × (maîtrise / 5)** — **Probabilité** (mode dégradé), **Fréquence**, **Gravité**, **Sensibilité du milieu**, et **niveau de maîtrise moyen** décomposé en **technique / humaine / organisationnelle**. Un aspect est **significatif (AES)** si la note ≥ **1000**. **Repli automatique** sur `G × F` (seuil 9) si les nouveaux axes ne sont pas saisis (rétro-compatibilité des lignes existantes). Formulaire enrichi (5 nouveaux champs), infoBox mise à jour.
- **Migration** : 5 colonnes ajoutées à `hse_aspects_impacts` (`probabilite`, `sensibilite`, `maitrise_technique/humaine/organisationnelle`) — **DDL versionnée** `scripts_import/env_aes_multiaxe_schema.sql` (à jouer une fois sur le cloud, comme l'ATEX). **Fail-soft** (`hseAspectsHasMultiaxe` dans `queries.ts`) : tant que la migration n'est pas jouée, les nouvelles colonnes sont **retirées du payload** — le calcul de criticité reste effectué côté serveur (stocké dans `criticite`) et rien ne casse.
- Build OK, **harnais 61/0**. **Vérifié e2e sur le cloud** (création AES avec axes multi → HTTP 200, **criticité = 1225** = 7×7×5×5 exact, significatif=true, colonnes stripées faute de migration ; ligne -TEST- supprimée). Fichiers : `src/index.tsx`, `src/environnement.tsx`, `src/queries.ts`, `scripts_import/env_aes_multiaxe_schema.sql`.

## 2026-08-05 — Environnement Phase 2 (1/2) — déchets EU/BSD + classement ICPE/Seveso
- **Référentiels réglementaires** (`src/qref.ts`) : `CODE_DECHETS_EU` (nomenclature 2014/955/UE, sous-ensemble usinage + traitement de surface, `*` = dangereux), `FILIERES_RD` (opérations R1-R13 / D5-D15), `BSD_CYCLE` (brouillon→émis→pris en charge→reçu→traité→refusé), `RUBRIQUES_ICPE` (2560/2564/2565/2661/1185/4734), `SEVESO_RUBRIQUES` (4xxx + seuils bas/haut) + moteur **`computeSeveso`** + helpers `codeDechetDangereux`, `conformiteVle` (déjà Phase 1).
- **Classification des déchets** (Environnement › Déchets, **sans migration**) : le champ **Code déchet** devient un datalist de la nomenclature EU (le champ **Dangereux se coche automatiquement** si le code porte un `*` — `prepare` côté route `hseCrud('dechets')`), la **Filière** un datalist des codes R/D, et le **Statut** devient le **cycle du bordereau** (BSD, valeurs héritées conservées). Colonne « BSD » (badge cycle) + « DD » auto. Repère dépliable nomenclature EU + filières.
- **Nouvel onglet « ICPE / Seveso »** : **classement Seveso INDICATIF** calculé automatiquement depuis l'inventaire chimique (`hse_produits_chimiques`) — chaque produit rattaché à une rubrique 4xxx via ses mentions H, cumul Σ(quantité/seuil) par classe (santé 41xx / physique 43-47xx / environnement 45xx), statut Non Seveso / seuil bas / seuil haut, table des produits rattachés + rubriques ICPE de repère. Lecture seule (saisie produits dans Sécurité › Chimie).
- Build OK, **harnais 61/0**. Vérifié à l'écran (onglet ICPE présent, Seveso = « Non Seveso » cohérent, datalists code/filière + select cycle BSD, 0 erreur console). Fichiers : `src/qref.ts`, `src/environnement.tsx`, `src/index.tsx`.

## 2026-08-05 — Environnement Phase 1 — câblages d'interopérabilité (RSE auto · VLE · Direction)
- **RSE auto-consolidée** (Environnement › RSE) : nouveau bloc **« Indicateurs RSE consolidés (AUTO) »** calculé en direct, sans ressaisie, depuis les données déjà présentes ailleurs — **RH** (effectif actif, absentéisme du mois, habilitations valides), **Sécurité** (accidentologie **TF/TG**, jours sans accident — même formule que le tableau de bord Sécurité), **Comptabilité** (CA HT, achats HT de l'exercice) et **Environnement** (conso eau annuelle, % déchets valorisés). Helper `computeRseAuto` dans la route `/environnement/service` (charge salaries/absences/pointages/hse_incidents/factures/habilitations, fail-soft). Vérifié à l'écran : effectif réel = 36.
- **VLE de référence + conformité automatique** (Environnement › Rejets) : nouveau référentiel `VLE_REFERENCE` (`src/qref.ts`, valeurs indicatives arrêté type 02/02/1998 : pH, MES, DCO, DBO5, hydrocarbures, Al, Cr, Ni, F, Zn…) + fonction `conformiteVle`. La colonne **« Conforme »** se calcule désormais **automatiquement** (valeur ≤ VLE) dès qu'une VLE est renseignée (badge « auto »), sinon repli sur la case manuelle. Le champ **Paramètre** devient un datalist issu du référentiel ; un repère dépliable des VLE est affiché sous le tableau.
- **Alertes environnementales → cockpit Direction** : les **revues ATEX échues** (`date_revue` dépassée) et les **rejets hors VLE** (mesures `conforme=false`) remontent désormais dans les **jalons critiques** de Direction (`echeancesSecu`), aux côtés des VGP/EPI/habilitations/conformité déjà présents.
- *Note* : le pont **relevés OAS → `hse_mesures_env`** (eau + bains) était déjà en place (routes OAS) — rien à recâbler.
- Build OK, **harnais 61/0**. Vérifié à l'écran (env + direction HTTP 200, bloc RSE auto avec valeurs réelles, référentiel VLE, 0 erreur console). Fichiers : `src/index.tsx`, `src/environnement.tsx`, `src/qref.ts`.

## 2026-08-05 — Environnement exhaustif ISO 14001 — Plan + Phase 1 (tableau de bord)
- **Plan complet** (`docs/technique/PLAN-environnement-ISO14001.md`) à partir de la présentation SME env (Food&Go, 14 outils ISO 14001) : diagnostic des 14 outils vs l'ERP, plan en 6 lots, et **carte d'interopérabilité exhaustive** (~40 paramètres ERP à connecter à l'Environnement, regroupés par cible : déchets, rejets/eau, GES, ICPE/Seveso, diagnostic ISO 14001, AES, RSE social/économique, pilotage). Décisions tranchées : déchets auto = tous les flux ; GES interne monétaire ; colonnes RH sexe/OETH/date_sortie ; démarrage Phase 1.
- **Phase 1 — Tableau de bord environnemental branché sur le moteur canonique** : nouvelle fonction pure `environnement(d)` (`src/kpi.ts`) + `dashEnvironnement` (`src/dashboards.tsx`) + route **`/dashboard/environnement`** + 7 slices étendus dans `getDashboardData` (dechetsEnv/mesuresEnv/aspectsEnv/conformiteEnv/atexEnv/rseEnv/chimiques, fail-soft). KPIs façon présentation : 6 tuiles (déchets tracés, conformité %, rejets hors VLE, AES significatifs, BSD conformes %, incidents/an), **jauges** (conformité + valorisation avec cibles), **donut DD/DND**, **objectifs** déchets/eau (bullet), **barres empilées** déchets mensuels DD/DND, déchets par filière, **indicateur de veille réglementaire** (barres état×domaine, comme la diapo), tendance conso eau/énergie, table SEIRICH env, aspects par milieu. 7 nouveaux codes d'objectifs (`conformite_env`, `dechets_dd/dnd`, `conso_eau`, `taux_valo`, `bsd_conforme`, `incidents_env`) éditables via `kpi_objectifs`. Lien depuis l'onglet « Tableau de bord » de la page Environnement.
- Build OK, **harnais 61/0**. Vérifié à l'écran (route HTTP 200, Chart.js chargé, graphe veille instancié, 2 jauges, 6 KPI, aucune erreur console). Fichiers : `src/kpi.ts`, `src/dashboards.tsx`, `src/queries.ts`, `src/index.tsx`, `src/environnement.tsx`, `docs/technique/PLAN-environnement-ISO14001.md`.

## 2026-08-04 — Audit : calendrier annuel à 5 états (code couleur par statut)
- Le code couleur des cases du **calendrier annuel** (Qualité › Audit Conformité › Programme) passe de binaire (rouge = programmé / bleu = rien) à **5 états calculés depuis le statut de l'audit** (`auditYearCalendar`, `src/qualite.tsx`) :
  - **bleu pâle `#dbeafe`** = aucun audit ce jour ;
  - **bleu foncé `#1d4ed8`** = audit **programmé** (affecté, échéance non dépassée) ;
  - **jaune `#eab308`** = **pas fait** (échéance `date_cible` dépassée et rien noté — ni réalisé ni soldé) ;
  - **rouge `#dc2626`** = **non conforme** (NC ouverte : `non_conformite` renseignée et plan d'action non soldé) ;
  - **vert `#16a34a`** = **soldé conforme** (statut `cloture` / `plan_action_solde`, ou réalisé sans NC).
- Si plusieurs audits tombent le même jour, la couleur prend l'état **le plus prioritaire** (rouge > jaune > bleu foncé > vert). Légende du calendrier mise à jour (5 pastilles). L'interaction (clic sur une case) reste inchangée (délégation `data-audday`).
- Build OK, **harnais 61/0**. Vérifié : logique 6/6 cas + « rien » ; rendu réel (359 bleu pâle, 4 bleu foncé, 2 jaune sur les échéances 2026 dépassées) ; légende 5 couleurs correctes. Fichiers : `src/qualite.tsx`.

## 2026-08-04 — Audit : calendrier annuel INTERACTIF (retrait du planning par trimestre)
- Le bloc **« Planning par trimestre »** est **supprimé** au profit du seul calendrier annuel, désormais **interactif** (Qualité › Audit Conformité › Programme) :
  - **case rouge** (un audit est programmé ce jour) → clic = **modale listant le(s) audit(s)** du jour (n°, entité, statut) + bouton **Déprogrammer** (repasse `date_cible` à vide) ;
  - **case bleue** (aucun audit) → clic = modale **« Programmer un audit le \<date\> »** listant d'abord les audits **non programmés** (`date_cible` vide), puis les autres (pour en **déplacer** un) ; le clic sur un audit fait un `PATCH /api/audit/programme/:id` avec la `date_cible` choisie.
  - Interaction par **délégation d'événements** (`data-audday`/`audset`/`audunset`/`audclose`), sans onclick inline.
- Build OK, **harnais 61/0**. Vérifié e2e (trimestre absent, clic rouge → détail, clic bleu → 25 audits, PATCH date OK puis restauré). Fichiers : `src/qualite.tsx`.

## 2026-08-04 — Éditer une NC en cliquant + calendrier annuel des audits
- **Édition d'une NC** : dans la liste Qualité › NC, un **clic sur le n° de NC** rouvre son **formulaire pré-rempli** (données injectées via `window.NC_FORM`) en mode édition (`window.__ncEditId`) ; `qualSaveNC` fait alors un **PATCH** (au lieu d'un POST de création). La route `PATCH /api/qualite/non-conformites/:id` accepte désormais **tous les champs éditables** (nature, cause, action, statut, responsable, poste, imputation, article, description…), avec **fail-soft** sur les colonnes récentes (`ncHasExtCols`, `ncHasResponsable`). Le select « Type NC » est aligné sur Interne/Client/Fournisseur (correspond aux données recalées). Testé e2e (PATCH d'une NC réelle, tous champs sauvegardés).
- **Calendrier annuel des audits** (Qualité › Audit Conformité › Programme) : nouveau **`auditYearCalendar`** — les 12 mois de l'exercice, une **case par jour**, **rouge** si un audit est programmé ce jour (`date_cible`, détail des audits au survol), **bleue** sinon. Vérifié : 6 cases rouges (les 6 dates du programme 2026), 359 bleues.
- Build OK, **harnais 61/0**. Déployé Cloudflare + Docker. Fichiers : `src/qualite.tsx`, `src/index.tsx`.

## 2026-08-04 — NC : reconciliation des données + Pareto interactif (dashboard Qualité)
- **Reconciliation des 173 NC existantes** vers la nouvelle taxonomie (appliquée **cloud + Docker**, script `scratchpad/nc-reclass.mjs`) : **Nature** (ancien vocabulaire → familles Aspect / Traitement-finition / Géométrie / Logistique / Gamme), **Cause** (ancienne liste → 5M Main d'œuvre / Machine / Méthode / Matière / Milieu / + Sous-traitance / Programmation), **Type** et **Statut** normalisés (client→Client, ouverte→Ouvert, cloture→Soldé), **Poste déduit** du champ `operation`/`description` (42 NC). Recalage intelligent (choix user) : les valeurs mal placées « Usinage »/« Taraudage » (des postes) → champ **Poste**, « Opération mal/non réalisée » (une cause) → **Cause** ; la Nature devient « À requalifier » quand rien ne matche. Répartition finale : Aspect 30, Géométrie 13, Logistique 13, Gamme 11, Traitement/finition 10, À requalifier 46, (vide) 50.
- **Pareto INTERACTIF** dans le Dashboard Qualité (remplace le Pareto statique `paretoCard`) : **sélecteur d'axe** (Nature · Cause 5M · Poste · Imputation · Type NC · Responsable), barres triées décroissantes + **courbe de % cumulé + ligne 80/20**, et **drill-down** sur l'axe Nature (clic sur une grande famille → Pareto de ses sous-catégories, ex. Aspect → Rayures/Ébavurage/Chocs). Rendu SVG client-side, délégation d'événements (pas d'onclick inline → sûr côté échappement). Données = NC recalées injectées.
- Build OK, **harnais 61/0**. Vérifié e2e Docker (6 axes, familles Nature, drill-down Aspect). Fichiers : `src/qref.ts` (aucun changement de liste), `src/qualite.tsx`, `scratchpad/nc-reclass.mjs`.

## 2026-08-04 — Non-conformités : listes déroulantes exhaustives (fichier user)
- Le formulaire **Nouvelle NC** (Qualité › NC) reçoit les **listes déroulantes exhaustives** fournies par l'utilisateur (écran « Liste déroulante »), définies dans `src/qref.ts` : **Type NC**, **Imputation** (service + code, ex. « Achat (ACH) »), **Nature de la NC** (Aspect/Traitement-finition/Géométrie/Logistique/Gamme…), **Action immédiate** (Retouche/Rebut/Dérogation/Retour fournisseur/Livraison en l'état), **Statut** (Ouvert/Sécurisé/Efficacité à valider/Soldé/Annulé), **Nature de la cause** (5M + sous-traitance + programmation), **Poste** (liste des postes/machines) et **Responsable** (Direction/Resp. production/QSE/BEI Seem/BEI Semrac/logistique/achats).
- Mapping : Nature→`type_defaut`, Cause→`type_cause`, Action immédiate→`action_corrective`, Poste→`lieu_detection`, Imputation→`lieu_imputation`, Statut→`statut`, Responsable→**nouvelle colonne `responsable`**. Route `/api/production/non-conformites` étendue ; `responsable` **fail-soft** (`ncHasResponsable`) pour ne pas casser le cloud avant DDL. Colonne créée dans Docker + **DDL versionnée** `scripts_import/nc_responsable_schema.sql` (à jouer une fois sur le cloud, comme l'ATEX).
- Build OK, **harnais 61/0**. Vérifié e2e Docker (options rendues + création NC avec tous les champs, NC de test supprimée). Fichiers : `src/qref.ts`, `src/qualite.tsx`, `src/index.tsx`, `src/queries.ts`, `scripts_import/nc_responsable_schema.sql`.

## 2026-08-04 — Planning PAR POSTE + NC dates + ATEX/DRPCE + OAS→Environnement
- **Planning par POSTE** (`/production/service`, la page réellement utilisée — pas `pageGanttBDT` autonome corrigée par erreur avant) : les lignes du Gantt sont désormais les **POSTES** (une ligne par poste, triées par ordre), plus les process ni les machines. Les BDT se placent sur leur poste (`opération → process → poste`), le glisser-déposer résout un process compatible du poste, et les **opérateurs matin/midi/soir** se posent au niveau du poste. **Goulotte « BDT à classer » remontée AU-DESSUS** du planning (était une colonne latérale). **Exclusion OAS robuste** (`isOasProc`/`isOasPoste`) — gotcha : les process d'oxydation ont `est_oas=false`, activité `Seem/both` et un poste **nommé « OAS » mais d'activité `both`** ; de plus le `\b` d'un regex était mangé par le template literal → test explicite sans `\b`.
- **Non-conformités** : la liste Qualité › NC affiche maintenant la **date d'entrée** (`date_nc`) et la **date de fin de traitement** (dérivée de `updated_at` quand la NC est close, « en cours » sinon). Zéro migration.
- **ATEX / DRPCE** : le formulaire « Nouvelle zone ATEX » devient la saisie des **critères DRPCE** (Document Relatif à la Protection Contre les Explosions, annexe DUERP, art. R.4227-52) — classement détaillé, sources d'inflammation, mesures de prévention/protection/organisationnelles, évaluateur. **Export PDF de marque** du DRPCE par zone (`/api/atex/:id/drpce.pdf`, bouton « PDF » dans la liste). 3 colonnes ajoutées (`sources_inflammation`, `mesures_protection`, `evaluateur`) créées dans Docker + **DDL versionnée** `scripts_import/atex_drpce_schema.sql` (à jouer sur le cloud pour la saisie en ligne des 3 nouveaux champs) ; fail-soft (`prepare` strip-if-empty) pour ne pas casser le cloud avant.
- **OAS → Environnement** : le **relevé de bain OAS** alimente désormais `hse_mesures_env` (comme le relevé d'eau le faisait déjà) → chaque paramètre (pH, température, concentration, densité, titrages, conductivité) apparaît dans **Environnement › Rejets & mesures**. Non bloquant pour le relevé.
- Build OK, **harnais 61/0**. Déployé Cloudflare + Docker, vérifié à l'écran (19 postes / 0 process-machine-OAS, goulotte au-dessus ; PDF DRPCE HTTP 200 ; colonnes NC). Fichiers : `src/prod.tsx`, `src/qualite.tsx`, `src/environnement.tsx`, `src/index.tsx`, `scripts_import/atex_drpce_schema.sql`.

## 2026-08-04 — Lot prod/compta : DUER strict ED 840, planning (goulotte/poste/OAS), numérotation LOT/BDT, nav lots→planning, EDF
- **DUER strict INRS ED 840** : `DUER_FAMILLES` (`src/qref.ts`) réduite aux **20 familles ED 840 (2023)** ; les familles hors-nomenclature (21→25) sont **retirées du menu déroulant et de la carte référentiel** (les lignes DUER avaient déjà été reclassées 1→20). Plus aucune famille hors ED 840 possible.
- **Planning (ancienne page `pageGanttBDT`)** : la **goulotte « BDT à classer » remonte AU-DESSUS** du Gantt (sous-traitance en dessous, pleine largeur) ; les **cartes BDT affichent le POSTE** (dérivé de l'opération → process → poste), l'affectation opérateurs matin/midi/soirée est conservée ; **filtre OAS réparé** (`est_oas` était supprimé au mapping serveur de la route planning `/production/planning` → l'exclusion des process spéciaux ne fonctionnait pas).
- **Numéro de commande en premier** : les listes commandes en Production affichent `CMD-YYYY-XXXX` en tête (+ « Affaire XXXX » en sous-ligne), en-tête « N° CMD / Affaire ».
- **Numérotation LOT/BDT refondue** : `LOT-YYYY-XXXX-ZZ` (ZZ = n° du lot dans l'affaire) et `BDT`/`BDS-YYYY-XXXX-ZZ-AA` (AA = n° du bon dans le lot), **déterministe** (rang stable de la pièce/étape → idempotence préservée, les gardes anti-doublon sont sur la clé `affaire|pièce|seq`, pas sur l'id) sur les **deux chemins de génération** (cascade acceptation d'offre `cascadeLotsBdtBst` + `generer-bdt`). **Migration de l'existant appliquée** cloud (clé anon — les tables verrouillées RLS `mouvements_stock`… sont vides) **et** Docker (superuser) : `0001-7365635125 → LOT-2026-0001-01`, `BDT-…-{2..5} → BDT-2026-0001-01-{01..04}`. Script `scratchpad/renum-migrate.mjs`. *Gotcha corrigé : `lots` n'a pas de colonne `num_affaire` (le lien passe par `cmd_id`).*
- **Navigation lot → planning (point 6)** : dans la liste des lots, le **n° BDT est cliquable** → `/production/gantt-bdt?focusBdt=<id>` (le planning **cale la journée sur `date_prevue`** puis **surligne** la barre 3 s) ; nouvelle **colonne « Programmé »** (date + heure) dans la modale des BDT d'un lot. *Correctif : la modale filtrait sur `lot_id` (null) au lieu de `lot_ref`.*
- **Report des factures EDF (Compta)** : nouveau sous-onglet **« Énergie / EDF »** dans Compta › Facturation. L'**échéancier** = des **factures fournisseur au compte `606300`** (mensualités + régularisation), **chaque échéance ayant sa `date_echeance`** → **reprise automatique dans la prévision de trésorerie J+30**. KPIs Total / Payé / **Reste (report)** + modale pré-remplie (fournisseur EDF, compte 606300). Correctifs comptables : **compte 606 ajouté à la Balance** (une charge énergie y était invisible) et **`genEcritureAchat` écrit le code de compte NU** (`606300` et non « 606300 – Énergie ») pour un Grand Livre / FEC corrects. **Sans nouvelle table** (modèle multi-factures). Table `factures_fournisseur` **versionnée** (`scripts_import/factures_fournisseur_schema.sql`) et créée dans Docker.
- Build OK, **harnais 61/0**. Déployé Cloudflare + Docker (image rebâtie, migrations DB appliquées aux deux bases). Fichiers : `src/qref.ts`, `src/prod.tsx`, `src/index.tsx`, `src/listes.tsx`, `src/compta_service.tsx`, `src/queries.ts`, `scripts_import/factures_fournisseur_schema.sql`.

## 2026-08-03 — Audits de conformité : traitement de surface en 2 postes distincts (OAS + Surtec 650)
- **Rappel de structure** : les **T1→T9 sont des thèmes** de l'audit flash de poste (déjà le cas), pas des postes. Le **traitement de surface** de l'usine recouvre en réalité **deux procédés distincts** — l'**OAS** (anodisation sulfurique) et le **Surtec 650** (chromatation trivalente) — qui s'auditent séparément.
- L'unique ligne « Traitement de surface (Surtec 650) » du programme **Audits de poste & flash** est donc **scindée en deux** : `PRG-2026-T10` renommée « **Traitement de surface — OAS (anodisation)** » et nouvelle `PRG-2026-T16` « **Traitement de surface — Surtec 650 (chromatation trivalente)** ». Les deux restent des audits **de poste** (type `poste`, grille `GRL-FLASH`, thèmes `T1..T6,T9`).
- **Appliqué au cloud** (rename + insert via l'API programme, RLS anon) **et** au seed source de vérité (`scripts_import/audit_seed.py`, liste `POSTE`) pour tout redéploiement/reseed. Exemples de saisie UI précisés (`src/qualite.tsx` : catégorie Procédés spéciaux + placeholder entité citent OAS / Surtec 650).
- Build OK, **harnais 61/0**. Fichiers : `scripts_import/audit_seed.py`, `src/qualite.tsx`.

## 2026-07-31 — DUERP : familles de risque recalées sur INRS ED 840 (lot QSE 4/4)
- Les **familles de risque du DUER** (`DUER_FAMILLES`, `src/qref.ts`) sont recalées sur la brochure **INRS ED 840 (édition octobre 2023, 20 fiches)**. Bonne nouvelle : la numérotation 1→20 correspondait déjà **1:1, dans le même ordre**, aux 20 familles ED 840 — seuls **6 libellés** ont été précisés : #3 « Circulation **interne** / engins », #4 « Accidents routiers **en mission** », #5 « Charge physique de travail » (retrait de « /TMS »), #7 « Produits chimiques, **émissions**, déchets », #13 « **Incendie / explosion** » (retrait de « /ATEX » — sous-thème traité ailleurs), #15 « Ambiances lumineuses » (retrait de « /éclairement »).
- Les familles **21-25** (Brûlures, Coupures, Travail isolé, Travail sur écran, Projections) — issues de la fiche « autres risques » de l'ED 840 **2004** — sont **conservées** (risques réellement évalués) mais **distinguées** dans le référentiel sous « Autres risques évalués (hors 20 familles ED 840) ».
- **Migration** `scripts_import/duer_familles_ed840.sql` (**à exécuter** : renomme les 6 libellés dans `hse_risques.famille` pour préserver la présélection des lignes DUER déjà saisies). `import_duerp.py` (`FAM_LABEL`) synchronisé. ⚠ **Anomalie héritée signalée** (hors ED 840, à vérifier) : d'anciens risques biologiques ont pu être rangés sous le code 22 « Coupures » (bug d'import) — bloc SQL correctif fourni en commentaire, à décommenter après contrôle.
- Sources : INRS ED 840 oct. 2023 (`inrs.fr/dam/inrs/CataloguePapier/ED/TI-ED-840.pdf`). Build OK, **harnais 61/0**. Vérifié SSR (libellés + carte). Fichiers : `src/qref.ts`, `scripts_import/`.
- **➡ Lot QSE complet (4/4)** : Chimie/EPI · Dérogations en circuit · Quarantaine + décision · DUERP ED 840.

## 2026-07-31 — Quarantaine depuis NC interne + décision de sortie (lot QSE 3/4)
- **Mettre en quarantaine depuis une NC** : bouton (📦) sur chaque non-conformité → modale « objet libre » (lot, palette, outillage, réception… — **n'importe quoi** dans l'usine). Route `POST /api/qualite/nc/:id/quarantaine` → `createQuarantaine` (lien `nc_id` existant) + NC passée en `statut='quarantaine'`. **Aucune migration** (colonnes texte libres).
- **Décision de sortie de quarantaine — 3 branches** (bouton « Statuer » remplace Libérer/Rejeter) : **1)** validation managériale (soumise à la **Direction** via `validations` ; sa décision libère/rejette automatiquement — hook dans `/api/validations/:id/decision`) ; **2)** **dérogation** (crée une `DER-…` pré-remplie, lot en `libere_derogation`) ; **3)** **décision immédiate personnalisée** (texte + auteur + date → libère ou rejette, tracé sans colonne via une entrée `validations` `statut='traite'`). Route `POST /api/qualite/quarantaine/:id/statuer`. Badge `libere_derogation` ajouté. **Aucune migration** (réutilise `quarantaines.nc_id`, `derogations.nc_ref`, la table `validations`, statuts texte libres).
- **Revue adverse** → 2 correctifs d'intégrité : (A) la branche « validation » verrouille la ligne (`statut='en_validation'`, plus de double décision) et un **refus « révision »** de la Direction renvoie la quarantaine **en_cours** (re-statuable) au lieu de la rejeter définitivement ; (B) erreurs `updateQuarantaine` désormais vérifiées (décision immédiate) / signalées (dérogation).
- Build OK, **harnais 61/0**. Vérifié e2e (boutons NC, 2 modales, pré-remplissage, statuer 3 branches). Fichiers : `src/qualite.tsx`, `src/index.tsx`.

## 2026-07-31 — Dérogations en circuit « offre de prix » (lot QSE 2/4)
- Les **dérogations** (Qualité) fonctionnent désormais comme les offres : cycle **envoi → réponse client**. Nouveau statut **« Envoyée au client (attente réponse) »** (`envoye`) ; la réponse reste `decision` = **AT** (accord total) / **AL** (accord limité) / **R** (refus).
- **Sur refus** : bouton **« Traiter le refus »** (⚖) sur la ligne → modale (façon retour client) proposant **Refus sec**, **Faire un avoir** ou **Commande prioritaire**. L'avoir (`AV-AAAA-XX`, table `credits`) et la commande P (`CMDP-AAAA-XX`, `commandes_prioritaires`) réutilisent **exactement** la mécanique du retour client (route `POST /api/qualite/derogation/:id/traiter-refus`, clone de `traiter-retour`) et apparaissent dans **Commercial › Avoirs & Commandes P**. Traçabilité via `derogations.decision_client` = n° créé + `statut='solde'` (**aucune migration**) ; **idempotence calée sur `decision_client`** (champ dédié, non modifiable au formulaire — corrige un trou de double-avoir signalé par la revue : le badge « ✓ AV-…/CMDP-… » prime et la route renvoie 409 dès que `decision_client` existe, quel que soit le statut).
- Build OK, **harnais 61/0**. Vérifié e2e (statut envoye, modale, pré-remplissage n° d'affaire, calcul live AV-2026-042 / CMDP-2026-042). Fichiers : `src/qualite.tsx`, `src/index.tsx`.

## 2026-07-31 — Chimie / EPI : N° d'identification, unité, pictogrammes, + SEIRICH (lot QSE 1/4)
- **Chimie/FDS** : nouveau champ **N° d'identification** du produit (distinct de la réf. GPAO et du n° CAS) — formulaire + colonne liste + PDF FDS + fiche 360. Colonne **fail-soft** `num_identification` (migration `scripts_import/chimie_num_identification.sql` **à exécuter** ; le champ n'est envoyé que s'il est renseigné, donc aucune régression avant migration).
- **Chimie/FDS** : la **liste** affiche désormais la **Quantité avec son unité** (le PDF FDS l'avait déjà).
- **Bouton « + SEIRICH »** sur chaque produit de la liste Chimie → ouvre une **nouvelle situation d'exposition SEIRICH pré-remplie** de ce produit (`secExpoFromChimique`, via `SEC_PREFILL`).
- **Bouton « Pictogrammes »** (en-tête Chimie) → modale **rappel des pictogrammes CLP/SGH + matrice de compatibilité de stockage** (✗ interdit / ● sous conditions / ✚ compatible), indicative.
- **EPI** : colonne **« Type »** retirée du tableau des dotations.
- Build OK, **harnais 61/0**. Vérifié e2e (colonnes, modale pictos 9×9, pré-remplissage SEIRICH, champ N° identif, 0 erreur console). Fichiers : `src/securite.tsx`, `src/index.tsx`, `src/chimique_fiche.tsx`, `scripts_import/chimie_num_identification.sql`.
- Suite du lot : dérogations en circuit (2/4), quarantaine depuis NC interne (3/4), familles DUERP recalées ED 840 (4/4).

## 2026-07-31 — SEIRICH Phase 4 : cartographie du risque chimique sur le Plan / Bâtiment
- **Vue « Risque chimique »** sur la maquette (`src/plans.tsx`) : un bouton **⚛ Vue risque chimique** colore les repères **produits chimiques** et **zones ATEX** par leur **niveau de risque SEIRICH** (vert/orange/rouge), remplace la légende de catégories par une **légende par niveau** (avec compteurs), et n'affiche que chimie + ATEX + les zones (contexte spatial). Une **carte du risque de l'usine** — l'attendu ① de SEIRICH (« localiser les risques »).
- **Niveau précalculé serveur** (canonique, pas de dérive) : pour un repère chimie, `niveau = max(computeRisqueChimique(produit).niveauMax, plus haut niveau_sante de ses situations d'exposition)` ; pour une zone ATEX, dérivé du **zonage** (`type_zone` 0/20→Élevé, 1/21→Moyen, 2/22→Faible). Couleur appliquée au rendu via `SEIRICH_NIVEAUX` injecté (miroir non divergent). Produit à **données de danger incomplètes** → repère « ? » gris (ne passe pas pour « sûr »).
- **Deep-link** : cliquer un repère chimie ouvre désormais sa **fiche produit 360** (`/securite/chimique/:id`) au lieu de l'onglet Chimie générique.
- **Aucune migration** (colonnes `couleur`/`ref_table`/`ref_id` déjà présentes) ; la couleur SEIRICH est **éphémère** (recalculée), la couleur sémantique de catégorie reste intacte. Route `/plans/service` : ajout de `getHseExpositions` (10e source) passé à la page. RBAC inchangé (service `plans`).
- Build OK, **harnais 61/0**. Vérifié : niveau serveur (CHROMATE CMR→Élevé, ATEX zone 1→Moyen) ; e2e navigateur cloud (86 produits cotés, toggle bascule légende sans erreur, `pointHtml` colore #92400e/Moyen, deep-link fiche, « ? » si incomplet, 0 erreur console). **Revue adverse** → 5 correctifs : vue risque = mode consultation (bouton masqué/réinitialisé en édition, sinon les « + » d'ajout disparaissaient) ; repère chimie/ATEX au niveau non résolu → repli gris « — » compté en légende ; **zone ATEX sans `type_zone` → défaut Moyen** (jamais « sans risque ») ; « ? » réservé à l'état réellement `incomplet` (pas `aucun`) ; payload nS/nI/nE retiré. Fichiers : `src/plans.tsx`, `src/index.tsx`.
- **➡ SEIRICH complet (4 phases + fiche produit unique)** : Phase 1 cotation produit, Phase 2 exposition par situation, Phase 3 axes incendie/env + actions + PDF + export, Fiche 360, Phase 4 cartographie. Boucle les 3 décisions direction (intermédiaire · ERP+export · fiche unifiée).

## 2026-07-31 — Fiche produit chimique 360 (danger + SEIRICH + FDS + péremption + stock)
- **Nouvelle page `/securite/chimique/:id`** (`src/chimique_fiche.tsx`, `pageChimiqueFiche`) — vue **unique** par produit chimique, ouverte depuis **Sécurité › Chimie** (icône ⧉ sur chaque ligne). Regroupe : **Danger & étiquetage** (pictogrammes CLP, codes H, CMR, VLEP, CAS, état) + **cotation SEIRICH 3 axes** (niveau produit) ; **Situations d'exposition** (tableau 3 axes + ATEX, cotées en direct) ; **FDS** (réf, date, statut, lien) ; **Péremption** (lots du module Périssables) ; **Stock** (articles rapprochés + quantités) ; **Actions correctives liées**. KPIs en tête + **bouton « Fiche PDF »** (document de marque A4, cotation indicative).
- **Agrégateur `getHseChimiqueDetail(id)`** (`src/queries.ts`) — **jointures souples, aucune migration** : stock par `ref_stock` (multi-codes, splitté sur `[/,;espace]`) ↔ `stock.reference` ; périssables par **code GPAO** (`\d{5,6}`, fiable) **ou** nom normalisé (probable, badge « code »/« nom ») ; actions par `source_type='exposition'` sur les situations du produit ; `qmaxByUT` calculé sur toutes les expositions pour un ratio correct. Fail-soft : chaque section affiche « aucun … rapproché » si pas de correspondance.
- **RBAC** : aucune modif — `/securite/chimique/:id` tombe sous le service `securite` déjà mappé (`PAGE_SEG_SERVICE`). Boucle les **3 décisions SEIRICH** de la direction (fiche produit unifiée = risque + FDS + péremption + stock).
- Build OK, **harnais 61/0** (nouvelle page couverte). Vérifié : rendu SSR **avec données** (6 sections + PDF), e2e navigateur cloud (fiche d'un produit réel : sections OK, PDF de marque, 0 erreur console ; jointures fail-soft). Fichiers : `src/chimique_fiche.tsx`, `src/queries.ts`, `src/index.tsx`, `src/securite.tsx`.

## 2026-07-31 — SEIRICH Phase 3 : axes Incendie + Environnement, plan d'actions, rapport PDF, export SEIRICH
- **3 axes par situation** — ajout de `computeExpositionIncendie()` et `computeExpositionEnv()` (`src/qref.ts`, ND 2233 / R 409, INDICATIFS). **Danger-gated** (sans classe de danger CLP, aucune quantité n'allume un niveau) : cote = `danger × quantité de la zone`, puis overlay propre à l'axe — **Incendie** : +1 niveau si **ATEX probable** (inflammable volatil/pulvérisé hors vase clos) avec **zone ATEX indicative** (0/1/2 gaz, 20/21/22 poussières) + plancher **comburant** (H270-272) ; **Environnement** : modulé par `rejet_milieu` (confiné → −1 niveau ; rejet direct → plein, plancher Moyen si H400/H410). Le sous-onglet Exposition affiche désormais **Santé · Incendie · Environ. · Retenu** (= le plus défavorable des 3) + badge **⚡ATEX**, KPI « Situations ATEX », matrice pivot sur le niveau max 3 axes.
- **Plan d'actions relié au DUER** — bouton **« → Action »** sur chaque situation (`secACFromExpo`) : pré-remplit une **action corrective** (type SD si CMR, origine = zone/UT, description = produit + situation + niveau + logique **STOP**), via le mécanisme `SEC_PREFILL` existant (aucune API/formulaire à ajouter). Alimente le volet chimique du DUER.
- **Rapport PDF de marque** — bouton **« Rapport SEIRICH »** (`risqueChimiquePdf`) : document A4 paysage (logo + palette Seem Semrac, `print-color-adjust:exact`) en 3 sections — inventaire coté, expositions 3 axes, plan d'actions — avec bandeau « cotation INDICATIVE à valider ».
- **Export SEIRICH** — bouton **« Export SEIRICH »** → `GET /api/export/seirich.xlsx` (classeur 3 feuilles : Inventaire coté / Expositions cotées 3 axes / Notice). **Recherche du format d'import INRS** (agent web) : SEIRICH n'importe **ni XML ni CSV** — uniquement un **classeur Excel calqué sur son modèle vierge** (`Produit`/`Substance`/`Composition`/`Conf`), et l'export d'inventaire complet **n'est pas ré-importable** ; l'ERP produit donc un **tableur structuré à recopier** dans le modèle officiel (Outils et documents › Import/Export). RBAC : export gardé par le service `securite` (`serviceFor`).
- Build OK, **harnais 60/0**. Vérifié : moteurs incendie/env unit-testés (3 ex. spec + comburant), rendu SSR **avec expositions**, e2e navigateur cloud (2 expositions réelles créées → 3 axes cotés dont ATEX, export xlsx 200/« PK », rapport PDF 3 sections, supprimées). ⚠ **Bug attrapé** : `computeExpositionIncendie/Env` non importés dans `securite.tsx` (build vert + harnais vert car données simulées à 0 exposition → `.map` jamais exécuté ; corrigé). **Revue adverse** → 3 correctifs : (1) `significatif` (AES/CMR = notion **santé**) ne doit pas être forcé par un niveau incendie/env élevé — aligné UI/PDF/export/DB sur la cotation santé seule ; (2) flag « risque de STOCKAGE » ajouté aux axes incendie/env pour un produit non utilisé ≥ 1 an (explique un Retenu élevé alors que la Santé est à 0) ; (3) zone ATEX nommée pour un procédé dispersif à volatilité moyenne (plus de badge ⚡ATEX sans zone). Fichiers : `src/qref.ts`, `src/securite.tsx`, `src/index.tsx`, `src/auth.ts`.

## 2026-07-31 — SEIRICH Phase 2 : exposition par situation de travail (niveau intermédiaire)
- **Nouveau sous-onglet Sécurité › Chimie › « Exposition par situation de travail »** : la cotation Santé croise le **danger du produit** (Phase 1 : codes H / pictos / CMR) avec l'**exposition réelle** de chaque situation (procédé, quantité, fréquence/durée, protections, volatilité). Conforme au **niveau intermédiaire** choisi par la direction.
- **Moteur `computeExpositionSante()` (`src/qref.ts`)** — méthode **INRS ND 2233 / R 409** (tables canoniques vérifiées sur le PDF INRS). **Deux scores distincts, jamais fusionnés** : le **Potentiel** (danger × quantité × fréquence ; seuils <100 / <10 000) et le **Résiduel** inhalation *Sinh* (danger × volatilité × procédé × protection collective, quantité exclue ; seuils <100 / <1 000). Niveau **Retenu** = le plus défavorable des deux ; **plancher CMR** (jamais < Moyen) ; **EPI informatif** (n'abaisse pas le niveau, conformément à R 409). Qmax par zone dérivé automatiquement (ratio Qi/Qmax). Reste **INDICATIF** (à valider par mesurage / QHSE). Moteur unit-testé sur les 3 exemples R 409 + cas CMR-plancher.
- **UI** : KPIs (élevé / moyen / significatif / sans protection), **liste éditable** (colonnes Potentiel · Résiduel · Retenu, cotées **en direct**), et **matrice pivot produits × unités de travail** (niveau retenu par croisement). Saisie data-driven (`SEC_FORMS['exposition-chimique']`, nouveau type de champ `chimique` = select des produits).
- **Données** : nouvelle table **fail-soft** `hse_exposition_chimique` (schéma `scripts_import/exposition_chimique_schema.sql`, **à exécuter** — sinon le sous-onglet reste vide sans erreur). CRUD réutilise `/api/securite/*` ; la cotation Santé (score/niveau/significatif) est calculée côté serveur à l'écriture (`_coteExposition`) et **recalculée en direct** à l'affichage (danger + Qmax de la zone).
- Build OK, **harnais 60/0**. Vérifié : moteur (4 cas), **rendu SSR avec données** (panneau + matrice + colonnes), e2e navigateur (panneau vide fail-soft, bascule, modale 18 champs, select produit peuplé des 86 produits, API create en erreur **propre** 400 tant que la table n'existe pas). **Revue adverse (3 lentilles)** → 4 correctifs : (1) `secOpen` ouvrait la mauvaise ligne (liste triée live ≠ `SEC_ROWS` ordre serveur) → `SEC_ROWS` aligné sur l'ordre rendu ; (2) **même bug préexistant sur Conformité** (rendu `confSec` filtré ≠ `SEC_ROWS` complet, régression de la migration Environnement) → corrigé + domaines env retirés du formulaire Conformité de Sécurité ; (3) `significatif` ignorait `non_utilise_1an` (CMR retiré comptait comme AES) ; (4) FK `on delete cascade` → `set null` (une évaluation d'exposition survit à la suppression du produit). Axes **Incendie / Environnement** + plan d'actions + **rapport PDF + export SEIRICH** = Phase 3. Fichiers : `src/qref.ts`, `src/securite.tsx`, `src/queries.ts`, `src/index.tsx`.

## 2026-07-31 — Nouveau service ENVIRONNEMENT (regroupe tout l'environnement)
- **Nouveau service `Environnement`** dans la sidebar, **sous Sécurité** (`src/environnement.tsx`, route `/environnement/service`, icône feuille verte). Il **regroupe tout ce qui concerne l'environnement**, jusque-là éparpillé dans Sécurité : **Déchets** (BSDD/Trackdéchets), **Rejets & mesures** (eau/air/bruit/énergie + relevés d'eau OAS), **ATEX**, **RSE** (ISO 26000), **Conformité environnementale** (ICPE/DREAL, ISO 14001, filtrée depuis `hse_conformite`), plus un **Tableau de bord** dédié et un nouvel onglet **Aspects & impacts environnementaux (ISO 14001 §6.1.2)**.
- **Aspects & impacts (AES)** : nouvelle table fail-soft `hse_aspects_impacts` (schéma `scripts_import/env_aspects_schema.sql`, **à exécuter** — sinon l'onglet reste vide sans erreur). Cotation *gravité × fréquence* → **aspect significatif (AES)** auto si criticité ≥ 9 ; alimente le programme environnemental et l'audit **thème J (ISO 14001)**.
- **Ce qui a bougé côté Sécurité** : les onglets **Environnement**, **ATEX** et **RSE** sont **retirés** de `src/securite.tsx` ; la matrice **Conformité** de Sécurité ne montre plus que les domaines **SST** (travail/chimique/45001/9001/EN9100), les domaines env (`icpe/iso14001/rse/iso26000/atex`) passent dans Environnement. Sécurité conserve la **Chimie/FDS** et le **Risque chimique (SEIRICH)** (le risque chimique reste SST + alimente le DUER).
- **Architecture** : page autonome (helpers de rendu + script CRUD propres, palette verte) qui **réutilise l'API `/api/securite/*`** et les tables `hse_*` existantes — **aucune migration** pour l'existant, aucun couplage avec le moteur de Sécurité. **RBAC** : nouveau service `environnement` calqué sur `securite` (écriture qualité/OAS/direction, lecture be/production/maintenance/RH) — 4 points câblés dans `src/auth.ts` (`ROLE_MATRIX`, `MENU_SERVICES`, `PAGE_SEG_SERVICE`), sidebar `src/shared.ts`, route + carte d'accueil + CRUD `aspects-impacts` dans `src/index.tsx`.
- **Liens** : axe **Environnement de SEIRICH** (danger milieu aquatique × quantité) affiché en lecture au tableau de bord ; **relevés d'eau OAS** repris dans « Rejets & mesures » ; raccourcis vers **Qualité › Audit (thème J)** et **Plan / Bâtiment** (cartographie ATEX/déchets/rejets).
- Build OK, **harnais 60/0** (nouvelle page détectée). Vérifié e2e (local sans auth) : rendu 7 onglets, bascule d'onglets, modale « Nouvel aspect », **CRUD bout-en-bout** (`-TEST-` déchet créé+supprimé via `/api/securite/dechets`), Sécurité intact (conformité filtrée, 0 erreur console).

## 2026-07-31 — Sécurité : risque chimique méthode SEIRICH (Phase 1)
- Nouveau sous-onglet **Sécurité › Chimie › « Risque chimique (SEIRICH) »** : cote chaque produit chimique sur **3 axes (Santé / Incendie-Explosion / Environnement)** selon la **méthode INRS ND 2233** — `Danger` (codes H + pictogrammes SGH + CMR) × `Exposition` (quantité, Phase 1) → **niveau Faible / Moyen / Élevé**. Tableau trié par priorité + KPIs (élevé, moyen, CMR, données incomplètes).
- Moteur `computeRisqueChimique()` (`src/qref.ts`, `SEIRICH_NIVEAUX`) : robuste aux `mentions_danger` en texte libre (extraction regex des codes H) et aux pictogrammes SGH ; signale les produits à **données incomplètes** (à compléter). **Cotation INDICATIVE** (défaut ND 2233 à valider par le référent QHSE, à recouper avec le logiciel SEIRICH). Vérifié sur **86 produits réels** (13 élevé / 26 moyen / 47 faible ; CMR type ACIDE BORIQUE/CLEANER bien en santé 5) + 4 cas connus + UI e2e Docker. Build OK, harnais 59/0.
- **Phases suivantes** (plan validé) : couche exposition par zone/tâche/procédé + risque résiduel ; plan d'actions relié au DUER + rapport PDF + export SEIRICH ; cartographie sur le Plan/Bâtiment (repères `chimie`/`atex` colorés par niveau). Fichiers : `src/qref.ts`, `src/securite.tsx`.

## 2026-07-31 — Préparation d'un audit externe de maintenabilité (hygiène dépôt + doc)
- **Données réelles retirées du dépôt** (gitignore, historique non réécrit — décision) : `scripts_import/fournisseurs_classes.json`, `import_fournisseurs.sql`, `relink_semrac.sql` (noms/SIRET/codes SAGE). Ajout d'un exemple anonymisé `import_fournisseurs.example.sql`.
- **Sécurité documentée** : `SECURITY.md` (racine) + `docs/technique/10-variables-environnement.md` (inventaire des variables) + `docs/technique/11-audit-externe-preliminaire.md` (guide + check-list). Confirmé : `AUTH_ENFORCE=on` en prod, `.env`/`docker/.env`/`.dev.vars` gitignorés, aucun PAT/`service_role` committé. **À poser en secret Cloudflare** : `JWT_SECRET`, `BOOTSTRAP_PIN` (sinon replis committés actifs) ; **à roter après l'audit** : clé anon.
- **Références régénérées** (`npm run docs`) : `03b-tables-reference.md` + `07-api-reference.md` incluent désormais les tables/routes audit & postes. **Cerveau** (`cerveau application/`) resynchronisé (CHANGELOG, hub, brique N8N réelle). `README.md` enrichi (prérequis Node 22/Python, stack Docker, liens sécurité/audit).

## 2026-07-31 — Audit : questions VERBATIM du classeur Excel (58 questions)
- Les 4 grilles détaillées du classeur `Planning daudits.xlsx` sont reprises **mot pour mot** : **Contrôle final 13**, **Soudure 13**, **Emballage 12**, **Informatique 20** = **58 questions** + la grille flash générique T1–T9 (9) → **67 questions**. Source figée committée : `scripts_import/audit_questions.json` ; générateur `audit_seed.py` (DELETE+INSERT des questions des 5 grilles standard pour rester fidèle à l'Excel). Questions mesurables reliées aux sondes (FAI→`fai`, ECME→`ecme`, QS soudeur→`certifications`, FDS→`fds`).
- Appliqué sur **Docker** (seed SQL) **et Cloudflare** (via l'API REST anon — tables déjà migrées). Questions éditables dans « Grilles ».

## 2026-07-30 — Audit : fiche d'évaluation agrandie, soldage dans le formulaire, rapport PDF après soldage, questions modifiables
- **Formulaire de remplissage agrandi** (modale 640→**860 px**, zone de questions ~58 vh) avec un rappel d'aide.
- **Soldage intégré au formulaire** : le bouton « Clôturer » de la ligne est retiré ; le formulaire propose désormais **« Enregistrer (réalisé) »** (reste modifiable) **et « Solder l'audit »** (clôture : `statut='cloture'`, `plan_action_solde`, `date_cloture`).
- **Rapport PDF téléchargeable UNIQUEMENT après soldage** : la ligne n'affiche le bouton de téléchargement que si l'audit est soldé ; la route `/api/audit/programme/:id/rapport.pdf` renvoie **403** tant que ce n'est pas clôturé. (La grille vierge imprimable reste dispo à tout moment.)
- **Questions modifiables** : bouton crayon (✎) sur chaque question dans « Grilles » → `auditEditQuestion`/`PATCH /api/audit/question/:id` (les questions ne sont PAS figées ; on peut aussi ajouter/supprimer).
- Build OK, harnais 59/0. Vérifié e2e Docker (PDF 403 avant / 200 après soldage, modale 860 px, 3 boutons de pied, édition de question). Fichier : `src/qualite.tsx`, `src/index.tsx`.

## 2026-07-30 — Nomenclature accessoires, postes glissables, machine↔process, planning, audits re-séparés
- **Nomenclature — accessoires** : suppression de la **saisie manuelle du prix**. Le prix vient du **catalogue** (produits_fournisseurs, < 6 mois) ; sinon un bouton **« demande de prix »** crée une RFQ (`POST /api/demandes-prix`, catégorie `accessoire`) — même logique que la matière (`nomAccApplyPrixStatus`/`nomAccRFQ`/`nomAccRFQCheck`, `be.tsx`).
- **Production — postes glissables** : les lignes de la table Postes sont **draggable** (poignée) pour les **réordonner** (→ `ordre`, `POST /api/production/poste/reorder`). Correctif : la requête postes de l'admin lit désormais `ordre` (`queries.ts`, `select('*')` + `order('ordre')`).
- **Production — machine en face du process** : dans le détail d'un poste, chaque process affiche la **machine rattachée** (via `machine_id`→`machNameById`) ou un avertissement « machine à rattacher » si `requiert_machine`.
- **Planning — BDT à classer au-dessus** : la carte « BDT à affecter » passe **au-dessus** du Gantt (bandeau horizontal, cartes en flex-wrap) → le **planning prend toute la largeur** (`planning_bdt_bds.tsx`).
- **Audit qualité — re-séparation** : « Audits process » et « Audits poste & flash » redeviennent des **sous-onglets distincts** (annule la fusion précédente). L'audit a 6 sous-onglets : Programme · Audits process · Audits poste & flash · Grilles · Constats · Référentiels (Conformité vive + tableau de bord restent dans le Dashboard Qualité).
- Build OK, harnais 59/0. Vérifié e2e Docker (postes 19/19 draggable + reorder testé, planning full width, audit 6 onglets, accessoires sans saisie de prix). Fichiers : `src/be.tsx`, `src/prod.tsx`, `src/queries.ts`, `src/planning_bdt_bds.tsx`, `src/qualite.tsx`.

## 2026-07-30 — Audits : simplification (lean) + édition des dates
- **Modifier une ligne d'audit** : bouton crayon (✎) sur chaque ligne du Programme → modale (date d'audit, statut, auditeur, audité, thèmes, référentiels, temps, grille) → `PATCH /api/audit/programme/:id`.
- **Fusion** : « Audits process » et « Audits poste & flash » sont retirés en tant que sous-onglets — **tout est dans Programme** (vue unifiée avec colonne Type). L'audit passe de 8 à **4 sous-onglets** : Programme · Constats & plans d'action · **Grilles** · Référentiels (Grilles placé juste avant Référentiels).
- **Conformité vive + tableau de bord de l'audit** déplacés dans le **Dashboard Qualité général** (avec la répartition NC, le Pareto, etc.) : KPI de réalisation, cartes de surveillance auto-observée et matrice de couverture y figurent désormais.
- Build OK, harnais 59/0. Vérifié e2e Docker (4 sous-onglets, édition de date, dashboard enrichi). Fichiers : `src/qualite.tsx`.

## 2026-07-30 — Audits : reconduction annuelle du programme (exercices N+1)
- Le programme d'audit étant **périodique**, ajout d'un **sélecteur d'exercice** dans le sous-onglet Programme + bouton **« Reconduire pour AAAA+1 »** : recopie toutes les lignes de l'année choisie vers la suivante (id `PRG-2026-*` → `PRG-2027-*`, **dates cibles décalées d'un an**, `statut` remis à `planifie`, `plan_action_solde` remis à faux). Refuse si l'année cible existe déjà. `cloneAuditProgrammeAnnee()` (`queries.ts`, sur le modèle de `cloneDuerAnnee`) + route `POST /api/audit/programme/reconduire`. Le planning trimestriel, les KPI et les audits process/poste se filtrent par l'exercice sélectionné. Vérifié e2e Docker (2026→2027 = 24 lignes, dates +1 an). Build OK, harnais 59/0. Fichiers : `src/queries.ts`, `src/index.tsx`, `src/qualite.tsx`.

## 2026-07-30 — Module « Audits de conformité » (SMI QSE + SI) auto-observé par l'ERP
- **Refonte de l'onglet Qualité › Audit Conformité** en **8 sous-onglets imbriqués** (barre de 2ᵉ niveau) : **Programme** (ordonnancement annuel + planning trimestriel type Gantt), **Audits process** (thèmes A–K), **Audits poste & flash** (T1–T9), **Grilles** (bibliothèque question-par-question), **Conformité vive** (auto-observation), **Constats & plans d'action** (→ NC/8D), **Référentiels**, **Tableau de bord** (matrice de couverture).
- **Système de Management Intégré (SMI)** : audit **combiné** couvrant Qualité (ISO 9001 / EN 9100), Sécurité (**ISO 45001** ajoutée), Environnement (ISO 14001) et **Sécurité de l'information (ISO 27001 + RGPD)**. Thèmes processus **A–H conservés + I** (SST) **+ J** (Environnement) **+ K** (SI) ; thèmes terrain **T1–T6 + T7** (analyse risque poste) **+ T8** (LOTO/permis) **+ T9** (bruit/CMR). `qref.ts` : nouvelle grille clause-par-clause `ISO45001` + `iso45001Grid()` (27001 déjà présent). Chaque ligne d'audit tague ses **référentiels couverts**.
- **Auto-observation (le différenciateur)** : chaque question porte un **mode AUTO / ASSISTÉ / MANUEL** + une **sonde ERP**. Le moteur `getAuditAutoStatus()` (queries.ts) calcule la conformité en temps réel depuis les données réelles — **ECME** (étalonnage), **certifications/habilitations**, **DUER** (année), **FDS**, **périssables**, **VGP**, **relevés de bain Surtec 650/OAS**, **NC ouvertes**, **actions correctives en retard**, **FAI**, **scorecard sous-traitants**. Un item au rouge = la preuve que l'ERP n'est pas rempli au bon endroit (le constat s'écrit seul). Vérifié e2e : 20 habilitations expirées et 79 NC ouvertes remontées automatiquement en rouge, DUER 2026 conforme.
- **Retour métier intégré** : l'**oxydation chromique est sous-traitée** → traitée en **surveillance du sous-traitant** (pas d'audit Cr VI interne) ; le **Surtec 650** (chromatation trivalente Cr III, REACH) est un procédé **interne** raccroché aux relevés de bain. Volet « procédés spéciaux » (soudure DMOS/QS, NADCAP), traçabilité 3.1, FAI EN 9102, FOD, ATEX poussières alu.
- **Cycle de vie fermé** : écart d'audit → **NC (détecteur « Audit »)** → 8D auto → plan d'action → **clôture**. PDF de marque : **rapport d'audit** (`/api/audit/programme/:id/rapport.pdf`) et **grille vierge** imprimable (`/api/audit/grille/:id/vierge.pdf`).
- **Modèle de données** (dégradation gracieuse, ids générés serveur, fail-soft) : nouvelles tables `audit_programme`, `audit_grille`, `audit_question`, `fai` (`scripts_import/audit_schema.sql`) + RLS anon. La table `audits` (certification externe) n'est pas touchée. **Seed** du classeur « Planning daudits.xlsx » : 9 audits processus + 15 audits poste + 5 grilles / 26 questions (`scripts_import/audit_seed.py` → `audit_seed.sql`). Routes `/api/audit/*` gated service Qualité (`auth.ts`).
- Build OK ; harnais **59/0** (pageServiceQualite = 15 scripts). Vérifié e2e sur Docker (24 lignes, 5 grilles, 26 questions, 11 sondes, CRUD + constat→NC). ⚠ **Cloud** : exécuter `audit_schema.sql` puis `audit_seed.sql` (via `erp-db`/PAT) ; d'ici là le module se dégrade proprement (vide) mais la **Conformité vive** fonctionne déjà (sondes = tables existantes). Fichiers : `src/qref.ts`, `src/qualite.tsx`, `src/queries.ts`, `src/types.ts`, `src/index.tsx`, `src/auth.ts`, `scripts_import/audit_schema.sql` + `audit_seed.py`.

## 2026-07-30 — Plan de contrôle Qualité : chargement du plan à jour (PRP1-D9, 19 lignes)
- **Plan de contrôle EN 9100 / ISO 9001 mis à jour** dans le service Qualité à partir du classeur fourni (`PRP1-D9_Plan_de_Controle_EN9100_extrait.xlsx`) : **19 lignes de contrôle**, de la **réception magasin** au **contrôle final / libération**, en remplacement des 16 anciennes.
- Chaque ligne : opération + fiche d'instruction (PRP1-IN…), classification (Tous fournisseurs / Tous clients / Client Aéro EN 9100), paramètres à contrôler, ECME/outils, fréquence & échantillonnage (100 % ou **ISO 2859-1 AQL 1.0**), critère **C=0 (zéro défaut)**, responsable, type de contrôle, plan de réaction.
- **Import de données pur** (table `plans_controle`, correspondance 1:1, **aucun changement de schéma ni de code**) sur le **cloud Cloudflare/Supabase** ET le miroir **Docker**. Aucun redéploiement applicatif requis (données en base).
- *Détail de fidélité* : `num_ligne` étant un entier en base, les sous-lignes **9B** (Sérigraphie) et **14B** (Finitions / ajustage) portent leur libellé dans la colonne **Opération** (« 9B — … ») et conservent leur position via `ordre` (N° laissé vide). Capture rafraîchie (`docs/assets/qualite-plan-controle.png`).

## 2026-07-30 — Export Excel (.xlsx) : Fournisseurs+catalogue et Clients+produits, avec feuille TCD
- **Deux boutons « Exporter (Excel) »** : sur la liste **Fournisseurs** (Achats) et la liste **Clients** (Commercial). Chaque export est un vrai **classeur .xlsx multi-feuilles**.
  - **Fournisseurs ET sous-traitants** : feuille *Données* = **TOUTES les entités** (fournisseurs + ST, colonne Type), champs complets (code, catégorie, activité, contact, email, tél, adresse, SIRET, délai, conditions, qualification) + leur catalogue (fournisseurs) / prestations (ST) ; **une entité SANS catalogue figure quand même** (1 ligne). Feuille ***TCD*** = **Catégorie × Type = nombre d'entités** (+ total). Vérifié : 268 fournisseurs + 20 ST.
  - **Clients** : feuille *Données* = **TOUS les clients** (même sans produit commandé), champs complets (code, activité, contact, email, tél, adresse, CP, ville, SIRET, TVA, mode facturation) + les produits commandés (réf interne/client, désignation, n° plan, affaires) ; feuille ***TCD*** = synthèse par client (activité, nb produits, nb affaires). Vérifié : 452 clients.
- **Générateur .xlsx maison** (`src/xlsx.ts`, ~10 Ko via **fflate**, pas de grosse dépendance qui ferait exploser la taille du Worker) : vrai OOXML multi-feuilles, ouvert nativement par Excel/LibreOffice/Google Sheets. La feuille *Données* est « à plat » → prête à pivoter (Insertion → TCD) ; la feuille *TCD* fournit déjà le croisé.
- Routes `GET /api/export/fournisseurs.xlsx` et `/api/export/clients.xlsx` ; agrégation clients bulk indexée (`getClientsProduitsAll`). Vérifié : fichiers ouverts avec openpyxl (feuilles + entêtes + données OK ; 268 lignes catalogue, TCD 3M → 4 chimique). Build OK ; harnais **59/0**. Fichiers : `src/xlsx.ts`, `src/index.tsx`, `src/queries.ts`, `src/achats.tsx`, `src/commercial.tsx`.

## 2026-07-30 — Libération des lots : contrôle qualité FINAL avant expédition + quarantaine séparée
- **« Libération Lots » devient un vrai contrôle qualité final** sur les lots **terminés** (tous leurs BDT soldés), au lieu d'afficher les quarantaines. Un lot n'apparaît « à libérer » qu'une fois **tous ses BDT soldés** (production terminée).
- **PV de libération** : le qualiticien ouvre un PV (`type_controle='final'`, Cp/Cpk, observations) et décide **Libérer** (→ `lots.statut='libere'`, expédiable) **ou Bloquer** (→ **quarantaine**, flux séparé, + PV `decision=bloque`). Vérifié e2e Docker : PV final libéré (Cp/Cpk stockés) + PV final bloqué → quarantaine créée.
- **Onglet « Quarantaine » distinct** (nouveau) : le contenu quarantaine y est déplacé, traité **séparément** de la libération.
- **Porte expédition (2 niveaux)** : une **commande** n'est « prête à expédier » que si **tous ses lots sont libérés** (sinon bloquée, comme NC/quarantaine) ; un **BL client partiel** ne propose **que des lots libérés**. Après libération, le lot part en expédition.
- **Fonctionne sur Cloudflare sans migration** : `lots.statut='libere'` est accepté (aucun CHECK), le PV `type_controle='final'` est autorisé (sondé), l'`id` est auto-généré côté cloud. **Migration facultative `scripts_import/lot_liberation.sql`** (`libere_le`/`libere_par` = traçabilité qui/quand ; repli gracieux `lotHasLibCols` si absente). Appliquée sur Docker (+ correctif défaut `id` uuid sur `pv_controle`/`quarantaines` du miroir local).
- Build OK ; harnais **59/0**. Fichiers : `src/qualite.tsx`, `src/expeditions.tsx`, `src/index.tsx`, `src/queries.ts`, `scripts_import/lot_liberation.sql`.

## 2026-07-30 — NC : colonnes distinctes (Lot ⁄ Article, Fournisseur ⁄ Client, Détection ⁄ Imputation)
- La liste des non-conformités éclate les colonnes combinées en **colonnes distinctes** : **Lot** et **Article** (code + désignation), **Fournisseur** et **Client**, **Détection** et **Imputation**. Une NC fournisseur/ST peut ainsi porter **à la fois** son fournisseur **et** le client concerné (le client du lot de la commande).
- **Aucune nouvelle migration SQL** : ces champs sont déjà stockés dans des **colonnes distinctes** (`lot_ref`, `ref_article`, `fournisseur_nom`, `client_nom`, `lieu_detection`, `lieu_imputation`). Repli d'affichage : les NC anciennes montrent leur `operation` sous « Détection ». Build OK ; harnais **59/0**. Fichier : `src/qualite.tsx`.

## 2026-07-30 — Rapports 8D : facteur humain, n° dérivé de la NC, équipe déroulante, action immédiate (D5)
- **Facteur humain** ajouté aux raisons du problème (D1 – Sélection).
- **N° 8D généré automatiquement à partir du n° de NC** (NC-AAAA-XXX → 8D-AAAA-XXX, donc de l'affaire associée) : dérivation **serveur** (repli séquentiel si déjà pris) + **prévisualisation live** côté client quand on saisit/change la NC.
- **Membres de l'équipe** : **liste déroulante des salariés + ajout libre** via un « + » (chips retirables), au lieu du champ texte. Persisté dans `d1_equipe`.
- **D5** : champ **« Action corrective immédiate »** (curative) ajouté **AVANT** les actions correctives permanentes (stocké en tête de `d5_actions_corr`, ré-extrait à la relecture).
- Vérifié **e2e Docker** : POST 8D avec `nc_id=NC-2099-777` → id **8D-2099-777** ; équipe et action immédiate bien persistées. Build OK ; harnais **59/0**. Fichiers : `src/rapport8d.tsx`, `src/index.tsx`.

## 2026-07-30 — Non-Conformités : refonte des champs Qualité + Dérogations après 8D
Refonte de la NC selon le besoin Qualité (formulaire + liste).
- **Fournisseur ET client** désormais visibles sur la NC (nouvelle colonne `fournisseur_nom`).
- **Lot / Article** : n° de lot (LOT-AAAA-XXXX) + **code article (nomenclature)** + **désignation**, empilés (réutilise `lot_ref` / `ref_article` / `designation`).
- **FRC client** : n° avec lequel le **client** identifie la NC chez lui (colonne `frc` existante).
- **Lieu de détection / Lieu d'imputation** remplacent « Opération » (nouvelles colonnes `lieu_detection` / `lieu_imputation` ; repli sur l'ancien `operation` pour les NC existantes).
- **3 types** seulement : **interne / client / fournisseur-ST**. **2 catégories** : **administratif / production**. Une NC **administrative n'est PAS reliée à Seem/Semrac** (champ Entité masqué + entité forcée à NULL côté serveur ; vérifié e2e).
- **Colonne « Origine » (manuel/fournisseur) supprimée** (liste + filtre).
- **Onglet Dérogations déplacé juste après Rapports 8D**.
- **Sans casse sur Cloudflare** : le serveur **sonde les nouvelles colonnes** (`ncHasExtCols`) et les retire du payload si la base n'est pas migrée → la création de NC ne peut pas échouer. **Migration `scripts_import/nc_champs_qualite.sql`** (fournisseur_nom + lieu_detection + lieu_imputation) **appliquée sur Docker** ; à jouer sur le cloud (PAT) pour activer l'affichage complet.
- Vérifié e2e Docker : NC fournisseur/prod (tous champs stockés) + NC administrative (entité NULL). Build OK ; harnais **59/0**. Fichiers : `src/qualite.tsx`, `src/index.tsx`, `src/queries.ts`, `scripts_import/nc_champs_qualite.sql`.

## 2026-07-27 (soir) — Réceptions dans l'onglet Bons de Livraison (BC validé → BL de réception)
- Les BC **validés par le fournisseur/ST** (« en attente de réception ») ne sont plus dans l'onglet BC : ils vivent maintenant dans l'onglet **Bons de Livraison**, sous un nouveau sous-onglet **« Réceptions Fourn./ST »** (affiché par défaut).
  - **Réceptions attendues** : les BC validés attendant le colis → bouton **Réceptionner** qui génère le **BL de réception** (`type_bl='reception'`, déjà câblé : entrée en stock + greffe OPEX machine + déblocage BDT) → puis PV de contrôle. Bouton **PDF** du BC accessible aussi.
  - **Réceptions effectuées** : les BL de réception créés (n° BL, fournisseur, BC lié, qté, date).
- L'onglet BC ne garde que **validation fournisseur** + **réceptionnées (→ PV)**. Après réception, retour automatique sur l'onglet BL.
- **Circuit complet vérifié e2e sur Docker** : DA (à traiter) → *soumettre* → BC (envoyé) + DA traitée → *Valider* → BC validée → *Réceptionner* → **BL de réception** (lié au BC, fournisseur, qté 25, reçu) + BC → `recu_total`. Données `-TEST-` supprimées (y compris mouvements de stock). Build OK ; harnais **59/0**.
- **Sans migration** : `bons_de_livraison` a déjà `type_bl` / `bc_id` / `fournisseur_st_id` et **aucune contrainte CHECK** sur `type_bl` (sondé) → prêt aussi pour de futurs types (retour fournisseur…). Fichier : `src/expeditions.tsx`.

## 2026-07-27 (soir) — DA : regroupement par fournisseur (une demande unique par fournisseur)
- Bouton **« Regrouper par fournisseur »** dans les *Demandes d'achat à traiter* : fusionne les DA à traiter d'un **même fournisseur** en **une seule** — articles concaténés (« Vis M6 (100) · Écrou M6 (50) »), **priorité la plus haute** conservée, la **plus ancienne** DA sert de support. Les DA absorbées sont **masquées** des deux listes (statut `regroupee` + `visible=false`) — **sans suppression ni migration** (`demandes_achat.statut` n'a pas de contrainte CHECK).
- Objectif métier : un seul BC par fournisseur en aval. Route `POST /api/achats/da/regrouper`.
- Vérifié **e2e sur Docker** : 2 DA d'un même fournisseur → 1 DA consolidée (à traiter) + 1 absorbée (masquée) ; données `-TEST-` supprimées. Build OK ; harnais **59/0**.
- Fichiers : `src/index.tsx` (route regrouper), `src/achats.tsx` (bouton + filtre d'exclusion des DA regroupées).

## 2026-07-27 (soir) — BC : le vrai circuit DA → BC → validation fournisseur → réception
Correction du circuit des bons de commande selon le besoin métier exact (« vrai chemin »).
- **Nouvelle étape « en attente de validation fournisseur / sous-traitant »** : une fois le BC émis (depuis une Demande d'Achat), il attend le retour du fournisseur/ST **avant** la réception. Bouton **Valider** (le fournisseur a validé la commande) → le BC bascule **« en attente de réception »** → Réceptionner comme avant → PV → Qualité. Trois files distinctes dans l'onglet BC (Fournisseurs et Sous-traitants).
- **Relance J+7 tracée** : passé **7 jours calendaires** sans validation, le bouton **Relancer** apparaît tout seul ; l'actionner **note la relance** (`date_relance`) et **régénère le PDF** à renvoyer — le compteur des 7 j repart de cette relance.
- **PDF du BC toujours accessible** (bouton PDF sur chaque ligne, à toutes les étapes).
- **Repli gracieux** si la base n'a pas encore les colonnes (ex. Cloudflare non migré) : la file « validation » est sautée, le BC va directement en réception (comportement historique) — **aucune régression**. Le serveur sonde la présence de la colonne (`bcHasAckColumn`) et adapte l'affichage.
- Migration `scripts_import/bc_accuse_fournisseur.sql` étendue (`accuse_fournisseur_le` + `date_relance`). **Appliquée sur la base Docker locale** (workflow complet actif en local) ; à jouer sur le cloud avec le PAT pour activer la gate côté Cloudflare.
- Vérifié **e2e sur Docker** : routes `POST /api/bc/:id/accuse` et `/relance` (200, colonnes écrites), la page Expéditions rend bien les 3 files, le BC bascule de file après validation. Build OK ; harnais **59/0**.
- Fichiers : `src/expeditions.tsx` (files + boutons Valider/Relancer/PDF), `src/index.tsx` (sonde colonne + routes accuse/relance + map), `src/queries.ts` (`bcHasAckColumn`), `scripts_import/bc_accuse_fournisseur.sql`.

## 2026-07-27 — RFQ v2 (multi-fournisseurs, scission, PDF, relance J+7) + BC (PDF + statut fournisseur)
**Module demande de prix repensé** et **bons de commande** dotés d'un PDF et d'un suivi fournisseur. Aucune migration requise pour le cœur (une migration facultative pour un détail du BC).
- **Formulation multi-références / multi-fournisseurs** : dans une demande de prix, on liste des références et, **pour chacune**, les fournisseurs à consulter (chips, recherche par nom). Boutons « Demande de prix » toujours présents dans l'onglet RFQ et sur chaque fournisseur / sous-traitant.
- **Scission automatique par fournisseur** : à la création, la demande se **découpe en une RFQ par fournisseur** (chacune ne contient que les références qui le concernent). Vérifié e2e : 2 réfs (FA sur R1+R2, FB sur R2) → RFQ FA = R1+R2, RFQ FB = R2. Route `POST /api/demandes-prix/grouped` (réutilise les tables `demandes_prix*` ; le fournisseur de chaque RFQ est porté par ses réponses, l'en-tête n'ayant pas de colonne fournisseur). **Sans migration.**
- **Liste RFQ enrichie** : colonne **Fournisseur**, badge **« à relancer »** (envoyée depuis > 7 jours calendaires sans prix saisi), boutons **PDF** et **Relancer**.
- **Cycle de vie** (façon DA/offres) : consulter → **Accepter et envoyer** → *envoyée* → **relance suggérée à J+7** (badge + régénérer le PDF) **ou** renseigner les prix → validation → prix officiel (inchangé).
- **PDF brandé de la RFQ** (logo Seem Semrac + palette + `print-color-adjust`), rendu **côté serveur** (`GET /api/demandes-prix/:id/pdf`) et téléchargeable pour envoi direct au fournisseur. Vérifié (logo, réf réelle, mentions).
- **Bon de commande** : **PDF brandé** téléchargeable (`GET /api/bc/:id/pdf`, vérifié : logo, « Bon de commande », Total HT, couleurs imprimables) + **statut fournisseur** — badge **« validée fournisseur »** (bouton *Validée*) ou **« à relancer »** dérivé (BC envoyé depuis > 7 j non validé) avec bouton *Relancer* (régénère le PDF).
- **Détail technique BC** : le statut BC est verrouillé par un CHECK (`brouillon/a_envoyer/envoye/recu`) → impossible d'y ajouter « validée ». L'accusé fournisseur est donc stocké dans une **colonne dédiée `accuse_fournisseur_le`** ; la route `POST /api/bc/:id/accuse` **dégrade proprement** si la colonne n'existe pas encore. **Migration facultative fournie** : `scripts_import/bc_accuse_fournisseur.sql` (à jouer avec le PAT pour activer la persistance de « validée fournisseur » ; le PDF et la relance J+7 fonctionnent sans elle).
- Fichiers : `src/index.tsx` (routes split + 2 PDF + accuse + enrichissement liste RFQ + map BC), `src/queries.ts` (`getDemandesPrixReponsesAll`), `src/achats.tsx` (formulation + liste + PDF), `src/expeditions.tsx` (BC : PDF + statut fournisseur), `src/brand.ts` (réutilisé). Build OK ; harnais **59/0** ; PDF + scission testés e2e ; données `-TEST-` supprimées (cascade vérifiée).

## 2026-07-27 — Correctif : les demandes d'achat neuves tombaient dans « déjà traitées »
- **Bug** : dans le service Achats, toute demande d'achat fraîchement créée (statut `a_traiter`) apparaissait dans la liste **« déjà traitées »** au lieu de **« à traiter »**. Cause : le test de classement `isTraitee` utilisait la regex `trait[eé]`, qui **capture le « traite » contenu dans « a_traiter »** → chaque DA neuve était comptée comme traitée.
- **Correctif** (`src/achats.tsx`) : `isTraitee` écarte d'abord explicitement les statuts « à traiter » (`a_traiter`, `nouveau`, `en_attente`, `brouillon`, vide) avant de chercher les marqueurs de traitement (`command|envoy|reçu|clôtur|traité|soldé|bc`). Les DA générées par la cascade offre→achat (manque matière) et les DA saisies retrouvent leur place dans « à traiter ». Build OK ; harnais **59/0**.

## 2026-07-27 — Achats : créer une demande de prix multi-références + boutons RFQ dans les catalogues
- **Bouton « Demande de prix » dans l'onglet RFQ** du service Achats : ouvre une **modale multi-lignes** où l'on chiffre **plusieurs références d'un coup** (réf. + désignation + qté + unité, ajout/retrait de lignes libre) auprès **d'un seul fournisseur** (décision métier : 1 RFQ = 1 fournisseur, toutes les réfs). Auparavant les RFQ ne pouvaient naître que du BE (Analyse DT / Nomenclature) ; l'acheteur peut désormais en créer directement.
- **Boutons « Demande de prix » dans les catalogues** : chaque ligne de la liste **Fournisseurs** et de la liste **Sous-traitants** porte un bouton qui **pré-remplit** la modale RFQ avec la cible cliquée → une consultation part en deux clics.
- **Zéro migration, zéro nouvelle route** : réutilise le socle existant — la route `POST /api/demandes-prix` (déjà multi-lignes via `lignes[]` + `fournisseurs_cibles[]`) et les tables `demandes_prix` / `demandes_prix_lignes` / `demandes_prix_reponses`. Le prix officiel fournisseur reste piloté par la **validation d'une réponse** RFQ (source de vérité), jamais par le BC.
- **Robustesse d'échappement** : les `onclick` ne transportent **que des identifiants** (jamais la raison sociale, qui pourrait contenir une apostrophe) ; le nom est résolu côté client depuis une liste `RFQ_CIBLES` injectée par `sjX()`. Les lignes du tableau sont construites en DOM (valeurs posées via `.value`, pas d'`innerHTML` avec des données utilisateur). Build OK ; harnais **59/0**.
- Fichier : `src/achats.tsx`. *(Déployé sur Cloudflare ; rebuild Docker en attente du redémarrage de Docker Desktop.)*

## 2026-07-25 — Observabilité n8n : surveillance Docker + logs → rapport + triage IA + auto-réparation bornée
- **Nouvelle stack Docker opt-in `docker/n8n/`** (séparée de la stack ERP) : un conteneur **n8n** surveille toutes les **5 min** l'état des conteneurs `erp-*` (running/exited/unhealthy, **OOMKilled**, RestartCount, ExitCode), le **disque** (`docker system df`) et les **logs applicatifs** (`erp-app` + tout conteneur non sain), détecte les incidents, en fait un **rapport**, et — si on l'y autorise — **répare l'infra de façon bornée**.
- **Périmètre volontairement choisi avec l'utilisateur** : **Docker + logs de l'ERP + ressources hôte**. **Cloudflare n'est PAS surveillé** (on le quitte pour l'auto-hébergement en prod).
- **Triage IA Claude** (`POST api.anthropic.com/v1/messages`, `claude-opus-4-8`) : classe chaque incident **infra / applicatif / faux-positif** et, pour un bug **applicatif**, **propose** un correctif (fichier + diff/étapes) **sans jamais l'appliquer** — un humain décide. Sans clé API, le triage est sauté proprement (le rapport se fait quand même).
- **« Répare quand c'est un bug hardware »** = auto-réparation **strictement infra et bornée** (désactivée par défaut, `AUTOHEAL_ENABLED=true` pour l'activer) : `docker restart` sur **liste blanche** (`erp-app/db/kong/rest/storage/meta/studio/imgproxy`, **plafond 3**), `docker image/builder prune`. **Jamais** de volumes, **jamais** de `down`/`rm`, **jamais** de patch de code automatique.
- **Détail technique clé** : l'image `n8nio/n8n` est une **Docker Hardened Image** (Alpine **sans `apk`**) → impossible d'installer `docker-cli` par paquet ; le binaire `docker` (statique) est **copié depuis `docker:cli`** en multi-étages (`docker/n8n.Dockerfile`). Le conteneur tourne en **root** (accès au socket `/var/run/docker.sock` monté — équivaut à un accès root au Docker de l'hôte, à garder en localhost).
- **Prouvé en réel** : image construite, `erp-n8n` **démarré** (n8n **HTTP 200** sur `localhost:5678`), le `docker` CLI **fonctionne dans le conteneur** (voit les 9 conteneurs via le socket), et la **commande collecteur** produit la sortie attendue (`===CONTAINERS===/===DISK===/===LOGS===`).
- Fichiers : `docker/n8n.Dockerfile`, `docker/n8n/docker-compose.observ.yml`, `docker/n8n/erp-observabilite.workflow.json` (workflow importable, 9 nœuds), `docker/n8n/README.md`, `docker/n8n/.env.example`. Aucune modification de `src/` → `dist/` inchangé.
- *Mise en route : `cd docker/n8n && docker compose -f docker-compose.observ.yml up -d --build`, puis http://localhost:5678 → importer `erp-observabilite.workflow.json` → activer. Renseigner `docker/n8n/.env` (clé Claude + URL webhook) au besoin.*

## 2026-07-23 — Branding PDF généralisé : logo + code couleur sur tous les documents, identité auto-remplie
- **Règle appliquée à TOUS les PDF** (règle permanente user) : logo Seem Semrac + palette de marque (violet #5C5391 / bleu #22409B) sur le **devis, la facture, l'ordre de fabrication (OF), le PV de contrôle EN 9100, la demande de dérogation, la fiche FDS et le DUERP**. `src/brand.ts` est la **source unique** (logo SVG + `SOCIETE` + helpers), importée par chaque générateur.
- **Coordonnées légales qui se remplissent SEULES, « ni plus ni moins »** : l'identité société (SIRET, adresse, TVA, RCS, APE, tél, e-mail…) vit dans un **seul objet `SOCIETE`** (`src/brand.ts`). Chaque champ **rempli s'affiche** sur tous les documents, chaque champ **vide n'affiche RIEN** (aucun placeholder, aucun tiret) — via `societeLignes()` qui ne retient que les champs renseignés. Suppression des faux « SIRET 000 000 000 00000 / TVA FR00… » de la facture.
- **Prouvé** : à vide → 0 ligne d'identité (logo + raison sociale seuls) ; après saisie SIRET+TVA+ville → exactement ces 3 lignes apparaissent (ville seule sans rue gérée, RCS non saisi reste absent).
- **Impression fiable partout** : `print-color-adjust:exact` ajouté sur chaque document — sans lui, les aplats de couleur du logo **ne s'impriment pas**. Un helper `brandBlockHTML()` (bloc logo + identité) est déposé dans chaque doc rendu en JS client via `sjX()` (seul moyen sûr d'y injecter du SVG multi-lignes sans casser l'échappement du script).
- **Réserve assumée** : les **pictogrammes CLP** (FDS) et l'accent orange des documents sécurité restent inchangés là où la couleur porte un sens réglementaire de danger ; le logo et l'en-tête, eux, passent à la marque.
- Fichiers : `src/brand.ts` (source + helpers), `src/commercial.tsx` (devis), `src/compta_service.tsx` (facture), `src/prod.tsx` (OF), `src/qualite.tsx` (dérogation + PV), `src/securite.tsx` (FDS + DUERP). Build OK ; harnais **59/0**.
- *Pour renseigner les coordonnées : éditer l'objet `SOCIETE` de `src/brand.ts` — elles apparaîtront d'elles-mêmes sur tous les PDF concernés, sans autre modification.*

## 2026-07-23 — Docker : stack remise d'aplomb + miroir cloud→local (base enfin peuplée)
- **Toute la stack Docker de nouveau opérationnelle.** L'`erp-app` était **exited** (SIGTERM à l'arrêt de la machine il y a 2 jours) et son image **périmée** (code figé d'avant tous les correctifs de la session) ; studio/storage/meta/imgproxy étaient à l'arrêt. Après `erp-docker up` (rebuild), **les 8 conteneurs sont `healthy`**, l'app (`localhost:3000`) sert `/login` (200) et **les 13 pages de service répondent 200**.
- **Nouveau : miroir cloud → local** (`docker/scripts/mirror-cloud.mjs` + commande `erp-docker mirror [limite]`). La base Docker démarrait **vide de tables métier** (le schéma a été créé jadis dans le cloud via Management API, pas dans le dépôt) → l'app locale était inutilisable. Le miroir recopie **schéma + données** des tables publiques du cloud vers la base locale **avec la seule clé anon** (aucun mot de passe Postgres du cloud requis) : pour chaque table connue, il lit les lignes en REST, **déduit le schéma** (colonnes + types permissifs text/numeric/boolean/jsonb) et rejoue `DROP+CREATE+GRANT+INSERT` en local.
- **Résultat : base locale enfin peuplée** — **44 tables, ~2 580 lignes** de données réelles : 455 clients, 402 articles de stock, 155 fournisseurs, 184 incidents HSE, 173 NC, 172 risques, 144 produits fournisseurs, 110 prix historisés, 36 salariés, 31 process, 19 postes, 16 objectifs KPI, 15 machines… L'onglet Commercial affiche bien « Tous 455 ».
- **Détails techniques** : la spec OpenAPI de PostgREST (`GET /rest/v1/`) est réservée au `service_role` → repli sur une **liste de candidats** probée (les tables absentes/vides sont ignorées proprement). Chaque instruction s'auto-committe (pas de transaction globale : une table en erreur n'entraîne pas les autres). Le SQL généré (`docker/db/seed/_mirror.sql`) contient des **données réelles → gitignoré** (seul le script est versionné). Correctif de chemin Git-Bash (`/e/…` → `E:\e\…`) : la commande utilise des chemins relatifs. Commande ajoutée aux deux pilotes (`.sh` et `.ps1`).
- *Rappel : la prod Cloudflare/Supabase cloud n'est pas touchée ; c'est un environnement de dev local. Mettre à jour l'app locale après une modif de `src/` : `erp-docker up` (rebuild ~10 s). Rafraîchir les données : `erp-docker mirror`.*

## 2026-07-23 — Devis : logo Seem Semrac + raison sociale ; bouton « Envoyer » masqué après envoi
- **Bouton « Envoyer » retiré une fois l'offre envoyée.** La condition d'affichage incluait `en_attente_reponse`… qui est précisément le statut **posé par l'envoi** (`POST /api/offre/:id/envoyer`) → le bouton restait affiché à côté de « Valider » et « Négocier ». Condition ramenée à `['offre_en_attente','negociation']` (le cas *negociation* garde volontairement « Renvoyer » : une offre rouverte en révision doit être renvoyée). ⚠ Le filtre `OFF_A_TRAITER` n'a **pas** été touché : en retirer `en_attente_reponse` ferait disparaître les offres envoyées de l'onglet « à traiter », qui ne pourraient plus jamais être validées.
- **Vrai logo Seem Semrac sur le devis**, en **SVG inline** (nouveau `src/brand.ts`, source unique réutilisable pour la facture/OF ensuite), avec la **raison sociale en toutes lettres, en noir**, à côté. L'ancien faux logo typographique (`SEEM·SEMRAC` en violet) est supprimé.
- **Pourquoi du SVG inline et pas un fichier image** : la fenêtre du devis est un `about:blank` alimenté par `document.write`, et l'impression part sur `window.onload` → une `<img>` distante arriverait souvent **après** le print (PDF sans logo, aléatoirement). Le SVG inline est vectoriel (net à l'impression), sans requête et sans asset à déployer.
- **Injection via `sjX()`** (JSON.stringify côté serveur), le patron déjà utilisé pour les pictogrammes CLP : c'est le seul chemin qui neutralise d'un coup les 4 pièges d'échappement de ce bloc `<script>` (backtick, `${`, apostrophe, `</script>`). Un SVG collé en dur y aurait tué **tout le script de la page Commercial**, pas seulement le devis.
- **Impression corrigée** : ajout de `@page{size:A4 portrait;margin:12mm}` et surtout de `print-color-adjust:exact` — **sans lui les aplats de couleur du logo ne s'impriment pas** (le devis n'avait aucun `@page` jusqu'ici). Plus `thead` répété et lignes non coupées entre deux pages.
- **Vérifié** : le document devis a été **réellement généré** à partir de l'offre `OFF-2026-0001` → logo SVG complet (4 aplats + « Seem » et « Semrac »), raison sociale en noir, `@page` A4 et couleurs imprimables présents, ancien wordmark absent ; et le bouton « Envoyer » n'apparaît **plus** pour cette offre (statut `en_attente_reponse`). Build OK ; harnais **59/0**.
- *Le logo est une **reproduction vectorielle** fidèle (aplats + wordmark) : si vous disposez du fichier vectoriel d'origine, il peut le remplacer dans `src/brand.ts` sans autre changement. Aucune donnée d'entreprise (SIRET, adresse, TVA) n'a été inventée sur le devis.*

## 2026-07-23 — Liste clients : tri alphabétique / CA de l'année / CA total
- **Trois tris sur la liste des clients** : **A → Z**, **CA de l'année en cours** et **CA total** (les deux CA du plus élevé au plus faible, départage alphabétique à égalité). Boutons placés à côté des filtres d'activité. Le tri est **indépendant de la recherche et du filtre SEEM/SEMRAC** (qui masquent des lignes) : il ne fait que réordonner.
- **Deux nouvelles colonnes `CA <année>` et `CA total`** dans le tableau, pour que le tri soit lisible. Le **CA = chiffre d'affaires facturé HT** : chaque facture est rattachée **une seule fois** à son client (par `client_id`, sinon par nom) → aucun double comptage. Le CA de l'année filtre sur `date_facture`.
- **Ordre par défaut = alphabétique**, rendu directement côté serveur (pas de saut visuel au chargement).
- **Bug corrigé au passage — la page Commercial pouvait renvoyer un 500 complet.** `pieces` est rendu via `.join()` à **4 endroits** (DT, commandes, offres) alors que les mappers passaient la valeur brute : une commande/offre dont `pieces` est `NULL` (ou scalaire) faisait planter **toute la page du service Commercial**. Normalisé à la source (`asPieces()`), ce qui sécurise les 4 usages d'un coup. *(Même classe de défaut que le `fmt()` de la Compta corrigé la veille.)*
- **Vérifié sur sandbox Docker** avec 3 clients aux profils distincts : `Alpha Metal` (10 000 € en 2026, 60 000 € au total), `Zebra Industries` (30 000 € / 30 000 €), `Mecano Sud` (0 € / 5 000 €) → **A→Z** : Alpha, Mecano, Zebra · **CA 2026** : Zebra, Alpha, Mecano · **CA total** : Alpha, Zebra, Mecano. Les trois ordres sont bien différents et corrects. Build OK ; harnais **59/0**.

## 2026-07-23 — Fiche client : produits achetés (désignation, plan ouvrable, affaires rattachées)
- **La fiche client liste désormais les produits achetés par ce client** avec, sur chaque ligne : **réf. interne**, **réf. client**, **désignation du produit**, **plan client ouvrable directement** (lien GED en nouvel onglet) et les **N° d'affaires rattachés**.
- **Affaires cliquables** : chaque numéro est un lien vers `/commercial/affaire/:num`. Quand un même produit a été commandé sur **plusieurs affaires**, tous les numéros sont affichés côte à côte et un compteur l'annonce en tête de tableau (« N produit(s) commandé(s) sur plusieurs affaires »).
- **Nouvel agrégateur `getClientProduits(clientId)`** (`queries.ts`) — nécessaire car **aucune de ces deux informations n'était stockée** : `references_clients` n'a pas de colonne désignation et `pieces_detail` non plus. Il croise donc 3 sources, **sans migration** :
  - `references_clients` → réf interne ↔ réf client ↔ plan (+ `plan_doc_id` GED) ;
  - `nomenclatures` → **désignation** (via `code_ref_produit`) ;
  - `demandes_travaux` du client → **N° d'affaires** portant la référence (`pieces_detail[].ref_interne`).
  Union répertoire + DT : une référence vue en DT mais absente du répertoire reste visible ; repli sur l'ancienne table si l'agrégateur ne renvoie rien.
- **Vérifié sur sandbox Docker** (scénario multi-affaires) : `REF-A / CLI-1234 / « Support moteur aluminium 7075 » / PL-889` → **affaires 1301 + 1305** ; `REF-B` → affaire 1305 ; en-tête « 1 produit(s) commandé(s) sur plusieurs affaires » ; plan avec document GED → lien `/api/ged/file/…` libellé `PL-889`. Build OK ; harnais **59/0**.

## 2026-07-23 — Avoirs à 2 modes + liste unique des modes de règlement
- **Avoirs : deux modes seulement.** Suppression de « Remboursement direct » — il ne reste que les deux cas réels du métier : **« Déduire d'une facture en cours »** et **« Déduire de la commande suivante »** (ce dernier restant en mémoire et proposé à la prochaine offre). Textes explicatifs alignés. À l'édition d'un avoir, toute valeur héritée (ancien `rembourser`, valeur vide) retombe **explicitement** sur « facture en cours » au lieu de laisser le select choisir au hasard la première option. *(NB : l'avoir `AVL-2026-001` porte encore `mode_restitution='rembourser'` en base.)*
- **Modes de règlement : une seule liste.** Quatre sélecteurs alimentaient le **même champ** `clients.mode_facturation` avec **deux vocabulaires divergents** : `MODES_FACTURATION` (Proforma, 30j net, … fin de mois) pour les 2 formulaires « nouveau client » (liste clients **et** formulaire DT), et une liste codée en dur (Virement 30j/45j/60j, Proforma, Traite 30j) pour la modale d'édition client **et** l'offre de prix. Or l'offre **synchronise** désormais ce champ vers la fiche client → une valeur saisie d'un côté n'était pas sélectionnable de l'autre. Les 4 sélecteurs partagent maintenant `MODES_FACTURATION`, **union des deux listes** (aucune valeur déjà enregistrée ne devient orpheline).
- **Création de client depuis la DT : vérifiée, elle fonctionnait déjà.** Le bouton « Nouveau client » (à droite du champ Client du formulaire DT) ouvre un formulaire qui **persiste réellement** (`POST /api/clients`), ajoute le client à la liste locale et le **sélectionne** dans la DT. Prouvé sur sandbox : le client créé est bien retrouvé via `/api/clients/search` → il alimente donc la liste des clients. Seule la liste des modes de règlement y était incohérente (corrigé ci-dessus).
- Fichier : `src/commercial.tsx`. Build OK ; harnais **59/0**.

## 2026-07-23 — Marge : passage au TAUX DE MARQUE + table des coefficients + Proforma
- **Méthode de calcul corrigée — taux de marque `(PV − PR) / PV`.** L'offre calculait `(coefficient − 1) × 100`, c'est-à-dire une **marge sur coût** : un coefficient ×2 affichait **100 %** alors que le référentiel Seem Semrac dit **50 %**. Désormais : `PV = CRU × k` et **taux de marque = (k − 1) / k** (⇒ `k = 1 / (1 − taux)`). Le **coefficient devient la source de vérité** (stocké dans `pieces_detail[].coeff`, jsonb → sans migration) et `marge_pct` en est dérivé (= taux de marque).
- **Taux de marque global pondéré** : la synthèse de l'offre affichait la *moyenne des pourcentages* ligne à ligne (qui ignore les quantités). Elle vaut maintenant `(PV total − PR total) / PV total`, côté client **et** côté serveur (`/api/offre/:id/pricing`). Libellés mis à jour (« Taux de marque », infobulle `(PV − PR)/PV`).
- **Table de référence « Coefficient de marges » consultable depuis l'offre** : petit bouton *Table des coefficients* → modale (fermeture par croix, clic extérieur ou **Échap**) reproduisant le document interne (16 lignes, PRI 100). Purement consultative.
- **Modes de règlement : « Comptant » → « Proforma »** dans les deux listes client (offre + fiche client, qui doivent rester synchronisées) ; doublon « Au comptant » retiré de `MODES_FACTURATION`. Les conditions **fournisseurs** ne sont pas touchées (« Comptant » y reste un terme d'achat valide).
- **Vérifié sur sandbox Docker** (route de tarification réelle) : ×2 sur PR 100 → **PV 200, taux 50 %** ; ×2,5 sur PR 50 → **PV 125, taux 60 %** ; global 2 lignes → montant 1 450, revient 600, **taux 58,62 %** = (1450−600)/1450. Bornes du tableau conformes : ×1,12 → 10,71 % · ×3,05 → 67,21 %. *(Nuance assumée : le document papier **tronque** à 2 décimales, l'offre **arrondit** → écart possible de 0,01, ex. ×1,43 = 30,06 % sur papier / 30,07 % dans l'offre ; précisé dans la modale.)* Build OK ; harnais **59/0**.
- *Constat (non-bug) : le planning est vide car la base contient **0 BDT / 0 lot / 0 commande** (mais 15 machines, 31 process, 36 salariés). Les BDT n'apparaissent qu'après offre acceptée → commande → lots → BDT.*

## 2026-07-22 — Plan de route Vague 0 : gravité NC au planning, Balance juste, multi-rôles, CI bloquante
- **Gravité de la NC choisie sur le VRAI planning** (`/production/service`) : la Phase 3 avait câblé le sélecteur dans `planning_bdt_bds.tsx`, mais le planning réellement utilisé est `prod.tsx` — qui n'envoyait **aucune gravité** → toute NC retombait sur `Majeure` (non bloquante) et **une pièce critique franchissait la porte d'expédition**. Ajout du sélecteur (Mineure/Majeure/Critique/Bloquante, affiché seulement si résultat = non-conformité) + envoi de `gravite_nc` au soldage + message de confirmation indiquant si l'expédition est bloquée.
- **Balance & Trésorerie enfin justes** : `buildBalance` sommait des comptes **codés en dur** (411100/706100/601100) alors que les générateurs d'écritures écrivent **411000/707000/607000** → la Balance affichait **0 sur Clients, Ventes et Achats** malgré l'activité. Désormais l'agrégation se fait **par racine PCG** (les sous-comptes remontent sur leur compte collectif, comportement comptable attendu) et la liste couvre 411/401/512/**531**/601/604/607/622/641/431/421/681/701/706/707/445710/445660. La **Trésorerie inclut désormais la caisse (531)** — les règlements en espèces étaient purement invisibles.
- **Service Compta ne plante plus sur un montant NULL** : `fmt()` appelait `.toLocaleString()` sur la valeur brute → **une seule facture au montant NULL renvoyait un 500 sur toute la page Compta**. Formateur rendu null-safe.
- **Salarié multi-rôles** : `verifySalariePin` / `verifyOperateurPin` ne sélectionnaient pas la colonne `roles` → `sal.roles` toujours `undefined` → JWT **mono-rôle**, et un salarié commercial+comptable se voyait refuser `/compta`. Colonne ajoutée aux deux `select` (existence vérifiée en base avant modification : un mauvais `select` casserait **toutes** les connexions).
- **CI : porte de qualité bloquante avant déploiement** — `deploy.yml` enchaînait `build → deploy` sans aucune vérification. Ajout du **harnais toutes-pages en étape bloquante** (l'échappement cassé des scripts clients est la 1ʳᵉ cause de régression et `vite build` la laisse passer) + un **typecheck informatif** (`continue-on-error`) car le code porte encore ~61 erreurs de types héritées. `typescript` ajouté en devDependency (il n'était pas installé : le script `verify` — qui commençait par `tsc` — **échouait donc systématiquement**) ; `verify` = build + harnais, nouveau script `typecheck` séparé.
- **Vérifié** : Balance prouvée sur sandbox Docker avec écritures seedées → Clients/Ventes/Achats/Caisse apparaissent enfin (invisibles avant), **Trésorerie 2 400 € = banque 1 900 + caisse 500** ; sélecteur de gravité présent sur `/production/service` ; les deux `select` d'authentification validés contre le schéma réel (HTTP 200). Build OK ; harnais **59/0**.
- *Note : `/production/gantt-bdt` (`pageGanttBDT`) est un planning **fantôme** — **zéro** appel API, le soldage n'y persiste rien tout en affichant « Fiche NC créée auto ». Route orpheline (aucun lien ne la référence, la sidebar pointe `/production/service`). Laissée intacte : sa suppression est une décision produit.*

## 2026-07-22 — Correctifs commercial : édition d'avoirs, scroll fiche client, livraison & règlement
- **Édition des avoirs fonctionnelle** : le bouton « Modifier » d'un avoir n'ouvrait rien (`editSvcItem` était un stub « en cours de déploiement » ; la suppression était factice). Désormais : `PATCH /api/credits/:id` + `DELETE /api/credits/:id` (nouvelle route + `deleteCredit`), le formulaire se pré-remplit depuis l'avoir sélectionné (bascule titre/bouton en mode édition), l'enregistrement fait un vrai PATCH (le solde suit le montant tant que l'avoir n'a pas été consommé), la suppression appelle la vraie route. **Prouvé end-to-end** (create → PATCH 100→250 € → DELETE) sur la base réelle.
- **Plus de défilement horizontal à la saisie du téléphone** (modale client) : les 4 champs d'un contact (nom/fonction/email/téléphone) étaient dans une grille 6 colonnes **sans `min-width:0`** → la ligne débordait et forçait un scroll latéral. Ajout de `min-width:0;width:100%;box-sizing:border-box` sur les champs → la ligne se compresse dans la modale, zéro scroll horizontal.
- **Type de livraison affiché sur la fiche client** : la fiche montrait le mode de règlement mais pas la livraison. Ajout d'une ligne « Mode de livraison » (Franco de port / Départ usine) dérivée de la **dernière offre** du client portant une livraison (`getClientDetail` renvoie `modeLivraison`).
- **Mode de règlement éditable dans l'offre + synchronisé avec la fiche client** : le règlement était un champ **en lecture seule** (« modifiable dans la fiche client »). Il devient un **select** (mêmes options que la fiche client) ; à l'enregistrement de l'offre, la valeur est écrite sur l'offre **et** répercutée sur `clients.mode_facturation` (sync offre→client, garde « si différent »).
- **Nomenclatures** : constat — la base de prod ne contient plus qu'**1 nomenclature** (les ~318 importées ont été supprimées côté données). Aucune action destructive effectuée ; l'état « 1 nomenclature » est conservé. *(NB : la validation d'une DT « nouveau produit » crée toujours une nomenclature — flux métier normal, non bloqué.)*
- Fichiers : `src/index.tsx` (routes credits PATCH/DELETE ; sync règlement dans PATCH offre), `src/queries.ts` (`deleteCredit`, `getClientDetail.modeLivraison`), `src/commercial.tsx` (édition avoir : `editSvcItem`/`submitSvcForm`/`deleteSvcItem`/`AV_RAW` ; contact `min-width:0` ; fiche livraison ; offre select règlement + `saveOffre`). Build OK ; harnais **59/0**.

## 2026-07-22 — Remédiation Phase 5 (FINALE) : validations Direction fiables & traçables (prouvée sur sandbox Docker)
- **Fin des alertes zombies** : le moteur `POST /api/direction/scan-alertes` dédupait uniquement contre les validations `en_attente` → toute alerte déjà **traitée / validée / refusée** **réapparaissait à chaque scan**. Désormais la déduplication porte sur **tous les statuts**. Clé d'alerte = **`type|table|id`** : le *type* distingue deux alertes sur le **même** objet (retard *vs* marge faible d'une commande), ce qui rend le `ref_id` **réel** (plus de collision à contourner).
- **`ref_id` réel = source consultable** : suppression du faux suffixe `-marge` sur l'alerte *marge faible*. « Consulter la source » (`/api/direction/source`) retrouve enfin la commande (avant : id `123-marge` → aucune ligne).
- **`jalon-traite` absorbe l'`en_attente`** : marquer un jalon critique « traité » **bascule l'alerte `en_attente` créée par le scan** (même `ref_table`/`ref_id`) au lieu d'en créer une seconde et de laisser un **fantôme** dans la file. Le *type* d'origine est préservé → les scans suivants ne la ressuscitent pas.
- **Choix assumé (sécurité métier)** : un refus « annulation » d'une alerte **n'annule PAS** l'objet métier sous-jacent (commande/facture) — auto-annuler depuis un rejet d'alerte Direction serait un effet de bord **irréversible** jamais spécifié. Le dédup tous-statuts fait qu'un refus (annulation *ou* révision) suffit déjà à ne plus relever l'alerte ; le mode reste tracé dans `payload` pour le badge UI.
- **Hors périmètre (honnêteté)** : les items « échéances sécurité → vraies tables » et « SEC_ENTITY_TABLE » évoqués au plan **n'ont aucun code correspondant** dans l'ERP actuel (ils exigeraient un nouveau sous-système d'alerting sécurité **avec migration**) → non traités, contraire au scope « sans migration, reconnecter l'existant ».
- Fichier : `src/index.tsx` (scan-alertes dédup+clé ; marge ref_id réel ; jalon-traite absorption).
- **Vérifié end-to-end sur la stack Docker locale** : commande en retard + commande marge 10 % → **2 alertes à `ref_id` réels** ; 2ᵉ scan → **0 créée** (dédup) ; `source(commandes, id réel)` → **ligne trouvée** ; `jalon-traite` → **`updated:true`, 1 seule ligne `traite`** ; 3ᵉ scan → **0** (aucune résurrection). Build OK ; harnais **59/0**.
- ✅ **Phase 5 (Cluster 6) TERMINÉE.** 🏁 **PROGRAMME DE REMÉDIATION COMPLET (5/5 phases, 6 clusters) — chaîne offre→coût→marge→facturation→qualité→maintenance→validations reconnectée et prouvée sur sandbox.**

## 2026-07-22 — Remédiation Phase 4 : maintenance préventive & RH fiabilisées (prouvée sur sandbox Docker)
- **Préventif → OM enfin déclenché** : nouvelle fonction `scanPreventifOM()` qui matérialise les ordres de maintenance manquants, appelée **à l'ouverture de `/maintenance/service`** (best-effort) et par `POST /api/maintenance/preventif/generer`. Avant, le générateur existait mais n'était **jamais déclenché** (audit #19) → les plans dus restaient invisibles.
  - **(a) Calendaire** : plans dont `prochain_prevu ≤ aujourd'hui`.
  - **(b) Usure** *(nouveau)* : pièce de rechange dont la **durée de vie (`duree_vie_h`) est atteinte** par les **heures machine cumulées** (temps machine des BDT) sans OM d'usure ouvert → crée un OM `origine='usure'` rattaché à la pièce.
  - **Idempotent** : déduplication en mémoire + index unique DB `(machine_id, piece_id, origine)` sur les OM non clos → rejouer le scan ne crée jamais de doublon.
- **Congé → absences : compteur HONNÊTE** (`/api/rh/conge/:id/valider`) : avant, « N jours posés » s'affichait **même quand l'insert d'absence échouait** (le `.catch` avalait l'erreur). Désormais on compte les inserts **réels** (`absences_creees` vs `absences_attendues`, + `warning` explicite si écart) → le planning présence ne ment plus.
- **Réaffectation des BDT** : à la validation d'un congé, les BDT **planifiés de l'opérateur absent** sur la période (hors soldés/terminés) repassent au **pool `pending`** (`operateur_id = null`) → ils ne restent plus « assignés » à quelqu'un d'absent.
- **Outillage** : le harnais toutes-pages exclut désormais `server.node.ts` (point d'entrée Node qui appelle `serve()` au chargement → binderait le port 3000 et bloquerait le harnais ; il n'expose aucune page).
- Fichiers : `src/index.tsx` (`scanPreventifOM` + trigger service + route generer ; route congé fiabilisée + reroute BDT), `scripts_doc/harness_all_pages.mjs` (exclusion).
- **Vérifié end-to-end sur la stack Docker locale** : pièce durée de vie 100 h + BDT cumulant 120 h → **1 OM usure créé** (2ᵉ passe = **0**, idempotent) ; congé maladie 22→24/07 → **3/3 absences** réellement posées + **1 BDT (le 24/07) rerouté** `op=null` (le 20/07 hors période et le 27/07 après-période intacts). Build OK ; harnais **59/0**.
- ✅ **Phase 4 (Cluster 5) TERMINÉE.** ⏭️ Phase 5 (validations & traçabilité — dernière phase).

## 2026-07-22 — Remédiation Phase 3 : portes qualité qui bloquent VRAIMENT (prouvée sur sandbox Docker)
- **Gravité de la NC CHOISIE par l'opérateur** au soldage : sélecteur *Mineure / Majeure (non bloquant) · Critique / Bloquante (bloque l'expédition)* dans la modale de soldage (planning), visible quand résultat = « non-conformité ». **Une NC est TOUJOURS créée pour la Qualité** ; seule la gravité bloquante empêche l'expédition (fini le `'Majeure'` codé en dur qui laissait tout passer).
- **Porte d'expédition fiable** (`/api/expeditions/bl-partiel`) : une NC bloque ssi **gravité bloquante ET rattachée à l'affaire ET non close** — via 3 helpers canoniques (`ncEstBloquante`, `ncRattacheeAffaire` = affaire_id → num_affaire → repli lot_ref, `ncEstClose` unifiant les définitions divergentes de « clos »). Rattachement de la NC à l'affaire posé à la création (num_affaire/affaire_id/bdt_id).
- **Dérogation CÂBLÉE** : quand la porte bloque (409), l'écran Expéditions propose « expédier sous dérogation » (motif **obligatoire**) → re-POST avec `force` + motif **tracé sur la facture** (« DÉROGATION qualité : … »). Avant, le message promettait une dérogation… sans aucun bouton pour la faire.
- Fichiers : `src/queries.ts` (3 helpers), `src/index.tsx` (soldage NC gravité+rattachement, porte réécrite, trace dérogation), `src/expeditions.tsx` (`_expPostBL` : dérogation sur 409), `src/planning_bdt_bds.tsx` (sélecteur gravité + `sResultatChange` + `confirmerSoldage`).
- **Vérifié end-to-end sur la stack Docker locale** : NC Bloquante ouverte rattachée → **409** ; NC Majeure (non-bloquante) → **200** ; NC Bloquante **close** → **200** ; NC Bloquante + **dérogation** → **200 + trace facture**. Build OK ; harnais 59/0.
- ✅ **Phase 3 (Cluster 3) TERMINÉE.** ⏭️ Phase 4 (maintenance/RH) · Phase 5 (validations).

## 2026-07-22 — Remédiation Phase 2 : facturation — fin des fuites d'argent (prouvée sur sandbox Docker)
- **Prorata de facturation STABLE** (`/api/expeditions/bl-partiel`) : le dénominateur = **Σ `lots.qte_initiale`** (qté commandée d'origine, figée), plus jamais le reste décrémenté à chaque BL. Fin de la **sur-facturation cumulative** (2 BL de 50 sur un lot de 100 facturaient 1500 au lieu de 1000). `qte_initiale` posé à la création des lots (cascade).
- **Plafond monétaire** : Σ factures d'une commande ≤ `montant − avoir_applique`. L'avoir consommé à l'acceptation est désormais **persisté** sur `commandes.avoir_applique` (fin de « l'avoir perdu ET plein tarif facturé »).
- **Garde paiement** (`PATCH /api/factures/:id`) : une facture `validation_hierarchique=true` non `validee` ne peut plus passer « payée » (**409**) — la validation Direction n'est plus contournable.
- **Écriture de RÈGLEMENT (BQ)** à l'encaissement (`genEcritureReglement`) : trésorerie 512 (ou 531 espèces) débit / **411 client crédit** → le compte client est enfin **soldé au FEC** (balance juste).
- Fichiers : `src/index.tsx` (bl-partiel prorata+plafond ; acceptation persiste avoir_applique ; createLot qte_initiale ; PATCH facture garde+BQ), `src/queries.ts` (`genEcritureReglement`).
- **Vérifié end-to-end sur la stack Docker locale** (montants EXACTS) : 2 BL de 50 sur lot 100 → **total facturé 1000** (pas 1500) ; commande avec avoir 300 → facture **plafonnée à 700** ; facture non validée → **paiement 409** ; facture payée → écriture **BQ 512 débit / 411 crédit** du TTC. Build OK ; harnais 59/0. *(Toutes les erreurs de la vérif = colonnes manquantes du schéma sandbox, aucun bug applicatif.)*
- ✅ **Phase 2 (Cluster 2) TERMINÉE.** ⏭️ Phase 3 (portes qualité) · Phase 4 (maintenance/RH) · Phase 5 (validations).

## 2026-07-22 — Remédiation Phase 1 (2/2) : boucle coût réel FERMÉE (réception→stock, sortie, taux réels) — prouvée sur sandbox Docker
- **Coût de revient RÉEL correctement calculé** (`recomputeCmdCout` + `getCommandeDetail` + `getLotDetail`, `queries.ts`) : nouveau `computeAtelierRates()` — **taux machine = (OPEX annuel + achats greffés + AMORTISSEMENT annuel `valeur_achat/duree_amortissement_ans`) / heures productives** (jamais 45/50 en dur), **taux MO = `salaries.taux_horaire_charge`** de l'opérateur (repli moyenne par entité). Ajout du **coût sous-traitance réel** (Σ BC sous-traitant de l'affaire). Cockpit et fiches 360 utilisent les **mêmes** taux → plus de divergence.
- **Réception BC → stock** (`/api/expeditions/bc/:id/receptionner`) : crée enfin le **mouvement d'entrée + incrémente le stock** (BC 'machine' exclu → OPEX). Sans ça le prix/quantité matière restaient à 0. Idempotent **par BL** (les réceptions partielles s'additionnent ; seul un rejeu du même BL est neutralisé).
- **Porte matière = réception TOTALE** : `qte_recue` cumulée vs `qte_commandee` → statut `recu_total` ; `matiere_ok` des BDT de l'affaire coché **uniquement quand tous les BC matière/accessoire sont reçus en totalité** (les BC sous-traitant/machine ne gatent plus la matière). `qte_commandee` posé à la création des BC (direct + DA→BC).
- **Bouton « Déclarer sortie matière »** (planning) recâblé sur la **vraie** route `/api/production/sortie-matiere` (au lieu de 3 routes 404) → décrémente le stock + mouvement 'sortie' rattaché au lot (compté dans le coût via clé-lot).
- **2 bugs applicatifs réels trouvés par la vérif sandbox** : (a) la route sortie ne résolvait l'article que par *désignation*, or le planning envoie la *référence* → matching par réf ajouté ; (b) idempotence réception par `bc_id` bloquait les réceptions partielles → passée par BL.
- **Vérifié end-to-end sur la stack Docker locale** (Postgres isolé, schéma minimal, vrai code via `start:node`) — flux réception→sortie→coût avec montants EXACTS : machine 2h×**55 €/h**=110, MO 3h×40=120, matière 5×12=**60**, ST=**300** → **coût réel 590 €**, CA 5000 → **marge 4410 € (88,2 %)** ; porte matière : partiel 6/10 → **ne débloque pas**, total 10/10 → **matiere_ok=true**. Build OK ; harnais 59/0. Bug annexe corrigé au passage : **kong crash-loop CRLF** (`.gitattributes` LF).
- ✅ **Remédiation Phase 1 (Clusters 1 & 4) TERMINÉE** : la boucle matière→coût→marge→statut→livraison est fermée et calculée juste.

## 2026-07-22 — Remédiation Phase 1 (1/n) : réconciliation clé-lot + progression des statuts commande/lot
- **Réconciliation clé-lot** (`lot_id ?? lot_ref`, = `lots.id` = `mouvements_stock.lot_id`) dans `recomputeCmdCout`, `recomputeCmdAvancement`, `getCommandeDetail`, `getLotDetail` (`queries.ts`). **Corrige le bug « matière exclue du coût »** : les BDT de la cascade ne portent que `lot_ref` → la matière (sorties stock) et les lots n'étaient **jamais** rattachés au niveau cockpit (`recomputeCmdCout` ne comptait que par `lot_id`, vide). Le cockpit Direction et la fiche 360 utilisent désormais la même clé → **fin des deux chiffres de marge contradictoires**.
- **Statuts au fil du soldage** (`recomputeCmdAvancement`) : la commande passe `en_production` (≥1 BDT soldé) puis `terminee` (tous soldés), et les **lots** passent `termine` — **sans jamais régresser** un statut avancé/terminal (garde sur `AVANCES`). Corrige « la commande reste `a_programmer` et plombe l'OTD alors qu'elle est produite ».
- Fichiers : `src/queries.ts` (4 fonctions). Réconciliation **strictement additive** (n'ajoute que des rattachements ; `lot_id` conservé quand présent).
- Vérifié : build OK ; harnais 59/0. ⚠ **Vérif runtime des montants à venir** avec la brique suivante (réception→stock + sortie matière) : le cost-engine complet (matière réelle × prix, taux machine = OPEX+amortissement, coût ST) sera testé **end-to-end** (flux soldage réel) — cette brique-ci est le socle de réconciliation, à impact quasi nul tant que la base transactionnelle est vide.
- ⏭️ Phase 1 (suite) : réception BC→stock (entrée + incrément) + porte matière (réception totale) ; recâblage bouton sortie matière (planning) + garde-fou « lot soldé sans matière » ; `computeAtelierRates` (taux réels, cohérents avec l'estimé) ; durcissement goulotte (`matiere_ok:false` défaut + `_pretBDT===true`).

## 2026-07-22 — Commercial : avoirs — mode de restitution + avoir matière + proposition à l'offre (lot offres, 4/4 ✓)
- **Choix du mode de restitution** à la création d'un avoir : **Déduire d'une facture en cours** · **Remboursement direct** · **Déduire de la commande suivante**. Ce dernier **reste en mémoire** et est **proposé à la prochaine offre** du client.
- **Origine** de l'avoir (Commercial / **Achat de matière** / Non-conformité). Pour un **avoir matière** : bloc dédié reliant la **facture matière (source)** — via « Charger une facture client » — et la **facture d'affaire interne (cible)** où l'avoir sera déduit (`facture_source_id` / `facture_cible_id`).
- **Éditeur d'offre** : ne propose plus que les avoirs **« à déduire de la commande suivante »** (les seuls déduits à l'acceptation, du plus ancien au plus récent) ; les avoirs *facture* / *remboursement* sont gérés côté facturation. La déduction à l'acceptation (`/api/offre/:id/accepter`) filtre désormais sur `mode_restitution='deduire_suivante'` (legacy null inclus).
- Fichiers : `src/index.tsx` (`POST /api/credits` : `mode_restitution`/`origine`/`facture_source_id`/`facture_cible_id` ; filtre acceptation), `src/commercial.tsx` (form avoir : mode + origine + bloc matière + `avOrigineChange` ; `submitSvcForm` ; `pageOffreEdit` filtre + note).
- Vérifié : build OK ; harnais 59/0 ; **e2e réel** (3 avoirs créés — *déduire suivante 300 €*, *rembourser 120 €*, *matière 80 € src↔cible* — modes/origine/factures persistés, puis supprimés) ; **navigateur** (3 modes, bascule origine→bloc matière, 0 erreur console).
- ✅ **Lot « offres de prix » complet** (devis PDF · règlement/livraison/transport · à relancer · fiche client TVA/contacts · avoirs). ⏭️ **Remédiation Phase 1** (boucle coût/marge réel).

## 2026-07-22 — Commercial : fiche client — TVA intra ↔ SIRET + contacts multiples & principal (lot offres, 3/n)
- **N° TVA intracommunautaire** saisi **en premier** dans la fiche client → le **SIRET se remplit automatiquement** (retrait du préfixe pays, `clTvaToSiret`) ; les deux restent éditables (client étranger au format libre). Affiché sur la fiche + repris dans le **devis PDF**.
- **Contacts multiples** : le formulaire « Modifier » remplace le contact unique par une **liste de contacts** (répéteur ajouter/retirer : nom · fonction · email · téléphone) avec un **radio ◉ pour choisir le contact principal**. Le principal alimente aussi les champs contact/poste/email/tel historiques (rétro-compat) ; stockés dans `clients.contacts` (jsonb) + `contact_principal`. La fiche client liste les contacts (★ = principal).
- Fichiers : `src/index.tsx` (`buildClientPayload` : `tva_intra`/`contacts`/`contact_principal`), `src/commercial.tsx` (`mapClient` + champs TVA/SIRET + répéteur `clContactRow`/`clAddContact`/`clResetContacts`/`clCollectContacts` + `openClientsModal`/`editClientReal`/`submitNewClient` + fiche).
- Vérifié : build OK ; harnais 59/0 ; **e2e réel** (client `-TEST-` créé avec TVA + 2 contacts + principal « Bob Durand » persistés, puis supprimé) ; **navigateur** (TVA `FR40…`→SIRET `40…`, répéteur 1→2 lignes 1 seul principal, édition restituant TVA/contacts/principal, 0 erreur console).
- ⏭️ Reste du lot offres : **E** avoirs (mode de restitution *déduire facture / rembourser / déduire commande suivante* + proposition à l'offre + avoirs matière source↔cible). Puis remédiation Phase 1.

## 2026-07-22 — Commercial : offre — règlement / livraison / transport + statut « à relancer » (lot offres, 2/n)
- **Migrations appliquées** (`remediation_1/2` + `commercial_offres_schema`) : colonnes coût/matière/facturation, qualité/maintenance, et commercial (TVA intra, contacts, livraison, avoirs) en base.
- **Offre — conditions commerciales** (`pageOffreEdit`) : **mode de règlement** affiché depuis la fiche client (`clients.mode_facturation`, lecture seule, snapshoté sur l'offre à l'envoi) ; **mode de livraison** `Franco (port inclus)` / `Départ usine` ; **frais de transport** (saisis si Franco, masqués sinon via `oeLivrChange`). Sauvés par `PATCH /api/offre/:id` (whitelist étendue). **Le devis PDF les reflète automatiquement** (transport ajouté au total HT).
- **Statut « À relancer »** : `/api/offre/:id/envoyer` pose `date_envoi` ; la liste des offres affiche un badge **« À relancer »** dès qu'une offre *en attente réponse* dépasse **7 jours calendaires** (calculé au rendu).
- Fichiers : `src/index.tsx` (route edit passe le client ; `/envoyer` snapshot règlement + date_envoi ; PATCH whitelist), `src/commercial.tsx` (`mapOffre` + bloc conditions + `oeLivrChange`/`saveOffre` + badge à relancer).
- Vérifié : build OK ; harnais 59/0 (`pageOffreEdit` + `pageServiceCommercial`) ; **e2e réel** (PATCH franco+150 € → devis TTC **4 371,84 €**, remis à zéro) ; **navigateur** (bascule transport Franco/Départ, champ règlement, 0 erreur console).
- ⏭️ Reste du lot : **A** fiche client (TVA intra ↔ SIRET auto, liste contacts + contact principal) · **E** avoirs (mode de restitution + proposition à l'offre + avoirs matière).

## 2026-07-22 — Commercial : devis PDF téléchargeable (lot offres de prix, 1/n)
- **Bouton « Devis PDF »** sur chaque offre envoyée (statut *en attente réponse / négociation / acceptée*) dans la liste des offres. Génère un **devis générique en bonne et due forme** : en-tête logo SEEM·SEMRAC, bloc client (raison sociale, adresse, SIRET, TVA intra, contact principal), tableau des pièces (**réf · désignation · qté · PU vente HT · Total HT**), sous-total, **frais de transport** (si Franco), total HT / TVA 20 % / TTC, **mode de règlement**, validité, mention CGV. Impression → « Enregistrer en PDF » (même mécanisme que l'export FDS).
- Route lecture seule `GET /api/offre/:id/devis` (assemble offre + client + `pieces_detail` de la DT avec `prix_vente`). Client `telechargerDevis`/`devisHTML` (`commercial.tsx`, DOM/concat sans `${}`/backtick).
- Champs récents (TVA intra, mode/frais de livraison, mode de règlement snapshot) **tolérés absents** tant que `commercial_offres_schema.sql` n'est pas appliquée — le devis s'enrichira automatiquement après la migration.
- ⏭️ Suite du lot offres (après migration `commercial_offres_schema.sql`) : mode de règlement live depuis la fiche client, mode de livraison Franco/Départ usine + transport, statut **« à relancer »** (>7 j), fiche client (TVA intra ↔ SIRET auto, liste de contacts + contact principal), avoirs avec **mode de restitution** (déduire facture / rembourser / déduire commande suivante).
- Vérifié : build OK ; harnais 59/0 (`pageServiceCommercial` 5 scripts) ; **e2e réel** (offre PROMISTEL → sous-total 3493,20 € → TTC 4191,84 € ; 404 offre inconnue) ; **navigateur** (devis HTML complet généré, 0 erreur console).

## 2026-07-21 — Direction : traçabilité des jalons traités + consultation de l'objet soumis
- **Traçabilité des jalons critiques** : chaque jalon (retard commande, stock critique, impayé, NC critique, échéance sécurité) reçoit un bouton **« Traiter »** → une modale (note d'action facultative) enregistre le traitement. Une nouvelle section **« Historique des jalons critiques traités »** (en bas de l'onglet Jalons) liste ce qui a été pris en charge (catégorie · objet · traité le · par · note) — **l'historique persiste même après résolution** du jalon. Un jalon déjà tracé affiche une pastille verte **« ✓ Traité »** (au survol : qui/quand/note).
- **Consulter l'objet soumis à validation** : dans la file **« À valider »** et l'onglet **« Traités »**, chaque ligne a désormais un bouton **œil** qui ouvre une modale affichant **les champs réels de l'objet source** (commande, facture, NC, avoir, salarié, BC…), récupéré par `(ref_table, ref_id)`, avec un lien **« Ouvrir dans le service »** (fiche affaire pour une commande, sinon le service concerné).
- **Sans migration** : le « traité » est une ligne `validations` de `statut='traite'` (idempotente par `ref_table|ref_id`), distincte des décisions valide/refuse ; la consultation lit l'objet via un endpoint générique whitelisté.
- Fichiers : `src/direction_service.tsx` (panneaux Jalons/À valider/Traités + 2 modales + JS délégué), `src/index.tsx` (route `/direction/service` : `jalonsTraites` ; endpoints `POST /api/direction/jalon-traite` et `GET /api/direction/source`), `src/queries.ts` (`getSourceRow`).
- Vérifié : build OK ; **harnais 59/0** (`pageServiceDirection` scripts OK) ; **e2e réel 13/13** (`-TEST-` nettoyé) — jalon-traite créé puis idempotent (1 seule ligne, note MAJ), consultation renvoie les vrais champs, whitelist → 400, page contient les blocs ; **navigateur** : 45 boutons « Traiter », modale de traitement (bon objet), modale de consultation (champs réels + deep-link `/commercial/affaire/…`), **0 erreur console**.

## 2026-07-21 — Analyse DT en 2 volets (Seem / Semrac) → offre fusionnée
- Une DT peut mélanger des pièces **Seem** (aluminium) et **Semrac** (tôlerie). Dans ce cas, l'analyse BE (`/be/analyse`) se **scinde automatiquement en deux volets** : une barre « Analyse en 2 volets » apparaît, on n'affiche/chiffre **qu'un site à la fois** (les pièces de l'autre volet sont masquées), et le bouton devient **« Terminer le volet SEEM / SEMRAC »**. Chaque pièce (nouvelle **ou** MAJ produit) est ainsi traitée individuellement dans son volet.
- **L'offre de prix n'est générée qu'une fois les DEUX volets terminés** ; elle est alors **fusionnée** (montant + coût de revient = somme de toutes les pièces des deux sites) et la DT bascule `dans_offres`. Tant qu'un volet reste à faire, la DT **reste analysable** (statut inchangé) et sa progression par volet est conservée (analyste + date par site).
- Une DT **mono-site** conserve exactement le comportement d'avant (bouton global « Valider l'analyse BE complète », bascule directe en offre) — aucun changement, aucune régression.
- **Sans migration** : l'avancement par volet vit dans la méta d'analyse (`demandes_travaux.cahier_charges`, élément tagué `__analyse_be__:` → clé `sites`). Le site de chaque pièce vient de `pieces_detail[].activite`.
- Fichiers : `src/index.tsx` (route `POST /api/dt/:id/analyse` : paramètre `site`, verrou « tous volets terminés », montant/coût fusionnés depuis `pieces_detail` ; formulaire `/be/analyse` : barre de volets, filtrage, soumission par volet).
- Vérifié : build OK ; **e2e réel** (18/18, `-TEST-` nettoyé) — volet Seem → `partial` (0 offre, DT analysable), volet Semrac → offre fusionnée `montant 162 / revient 135`, DT `dans_offres` ; **régression mono-site** OK (bascule directe). **UI navigateur** : 2 onglets de volet, filtrage des pièces par site, libellés de bouton dynamiques (0 erreur console).

## 2026-07-21 — Cascade offre (Phase 3/3) : goulotte du planning (matière reçue + prépa complète)
- **Porte d'entrée au planning exécutable (« goulotte »)** : un BDT n'y apparaît que si (1) la **matière est reçue** — `bons_de_travail.matiere_ok=true`, posé automatiquement à la **réception de TOUS les BC de l'affaire** — ET (2) la **prépa technique est complète** — aucune ligne `preparations_techniques` de l'affaire en statut ≠ `faite`. Sinon → nouveau bandeau **« Commandes & lots à venir »** (avec la raison : matière / prépa) en tête du planning. **Additif & sûr** : les BDT hérités (`matiere_ok=null`) restent visibles (test `!== false`), donc aucun impact sur l'existant.
- **Réception BC** (`/api/expeditions/bc/:id/receptionner`) : quand tous les BC d'une affaire sont reçus, coche `matiere_ok=true` sur ses BDT (renvoie `bdt_debloques`).
- **DA → BC** (`/api/achats/da/:id/soumettre`) : le BC hérite du `num_affaire`/`cmd_ref` de la DA (chaînon « matière de CETTE commande reçue »).
- Fichiers : `src/index.tsx` (route planning : split goulotte/à-venir ; réception ; DA→BC), `src/planning_bdt_bds.tsx` (bandeau « à venir »).
- Vérifié : build OK ; **e2e réel** (scénario `-TEST-` nettoyé) : acceptation → BDT en « à venir » (gaté, absent du Gantt) → réception BC → `matiere_ok=true` (`bdt_debloques:1`) → prépa marquée faite → BDT **sort de « à venir »** (entre en goulotte). Chaîne matière+prépa complète prouvée.
- ✅ **Cascade offre complète (P1 négociation + P2 acceptation + P3 goulotte).**

## 2026-07-21 — Cascade offre (Phase 2/3) : l'acceptation déclenche prépa technique + DA + lots/BDT/BST
- **Accepter une offre** (`/api/offre/:id/accepter`) déclenche maintenant, après création de la commande, une **cascade automatique** (best-effort, chaque étape isolée, idempotente via ids déterministes) :
  - **(a) Prépa technique** : une ligne `preparations_techniques` par nomenclature de la DT à laquelle il **manque** le programme CN (étape machine/CNC sans n° programme) **ou** le plan (ni `num_plan`/`plan_fichier`, ni doc GED `plan_client`/`plan_cao`). La liste « Préparations Techniques » (avant : mock statique) lit désormais la vraie table (+ bouton « Fait » → `POST /api/prepa-technique/:id/statut`).
  - **(b) Demandes d'achat** : pour chaque fourniture matière/accessoire dont le **besoin** (× qté commande, en unités d'achat) dépasse le **stock**, une DA `genere_par_adt` taggée `num_affaire`/`cmd_ref`.
  - **(c) Décomposition** : `commande → lots → BDT (interne) + BST (sous-traité)` depuis `nomenclatures.etapes_production` (gère les portes OAS), chaque BDT créé avec `matiere_ok:false` (socle Phase 3).
- Réutilise l'algo de `generer-bdt` (jusque-là orphelin) + le patron `commandes-p/lancer`. Nouvelles requêtes `getPreparationsTechniques`/`createPreparationTechnique`/`updatePreparationTechnique`.
- Fichiers : `src/index.tsx` (helpers `cascade*` + wiring `/accepter` + routes prépa), `src/queries.ts`, `src/listes.tsx`. Schéma : table `preparations_techniques` (Phase 1).
- Vérifié : build OK ; **e2e réel** sur 3 scénarios `-TEST-` (tout nettoyé) → prépa (2 manques), DA (matière, besoin 10 vs stock 0), lot, BDT (Fraisage CNC / Ébavurage), BDS (Traitement) **tous créés en base** avec les bons liens ; discrimination prépa correcte (avec plan + étape non-CNC → 0 prépa).
- ⏭️ Phase 3 : goulotte planning (réception→stock→`matiere_ok`, porte « BC reçu + prépa complète », vue « à venir »).

## 2026-07-21 — Cascade offre (Phase 1/3) : négociation versionnée (révision sur place)
- Nouveau bouton **« Négocier »** sur les offres en attente de réponse (page service Commercial) : le client négocie → l'offre est rouverte en **révision** (statut `negociation`), son **compteur de version** s'incrémente (`v2`, `v3`…), et on ouvre l'édition prix/marge ; puis **« Renvoyer »** repasse l'offre en attente de réponse. Pas de copie/-2 : même ligne d'offre, indice de version (décision utilisateur).
- Route `POST /api/offre/:id/negocier` (version++ + statut `negociation` + `motif_negociation`). Badge `v{n}` affiché sur l'offre. Filtre « à traiter » inclut désormais `negociation`.
- **Schéma** : `scripts_import/offre_cascade_schema.sql` (exécuté par l'utilisateur) — ajoute `offres.version`/`motif_negociation`, la table `preparations_techniques`, et `num_affaire`/`cmd_ref` sur `demandes_achat`+`bons_de_commande` (socle des phases 2 & 3).
- Fichiers : `src/index.tsx` (route), `src/commercial.tsx` (bouton + modale + version). 
- Vérifié : build OK ; parsing des 5 scripts de la page ; **e2e réel** (offre `-TEST-` → négocier → `version 1→2`, statut `negociation`, motif stocké → DELETE nettoyé).
- ⏭️ Suite : Phase 2 (cascade acceptation : prépa technique + DA auto + commande→lots→BDT/BST), Phase 3 (goulotte planning : BC reçu + prépa complète).

## 2026-07-21 — Correctif Commercial : valider une offre ne créait PAS la commande (message trompeur)
- **Symptôme** : dans l'onglet Offres, le bouton « Valider » affichait « commande créée automatiquement » **mais ne créait aucune commande** — l'offre passait juste en « Acceptée ✓ ». Rien n'arrivait côté Production.
- **Cause** : `svcConfirmerValidationOffre` (page service, `src/commercial.tsx`) appelait `/api/offre/:id/valider` (qui ne fait qu'`updateOffre(statut:'acceptee')`) au lieu de `/api/offre/:id/accepter` (qui **crée réellement la commande** `CMD-AAAA-affaire`, recopie pièces+montant, applique les avoirs client, passe l'offre en 'acceptee'). Le flux `/accepter` n'existait que dans l'ancien écran `pageOffreCommerciale`, inaccessible depuis la page service actuelle.
- **Fix** : le bouton « Valider » de la page service crée maintenant vraiment la commande (POST `/accepter`, idempotent). La modale gagne un champ **date de livraison** optionnel. La notification annonce le n° de commande créé (+ avoir déduit le cas échéant). `svcValiderOffre` était du code mort (aucun bouton).
- Fichier : `src/commercial.tsx`. Migration : non.
- Vérifié : build OK ; **parsing des 5 scripts** de la page commerciale OK ; câblage `/accepter` + champ date confirmés ; `/accepter` = route pré-existante déjà éprouvée par l'ancien flux.

## 2026-07-21 — Correctif Qualité : onglets 8D et suivants invisibles (`<div>` non fermé)
- **Symptôme** : dans le service Qualité, l'onglet « Rapports 8D » (et tous ceux d'après : Libération, Audit, Étude de capabilité, etc.) s'affichaient **vides** au clic.
- **Cause** (bug **pré-existant**, sans rapport avec la validation Direction) : la modale « Traiter le retour client » (`retourModalHTML`, `src/qualite.tsx`) avait un **`<div id="retourModal">` jamais fermé** (22 `<div>` pour 21 `</div>`). Rendue à l'intérieur du panneau NC, elle laissait le navigateur **imbriquer tous les panneaux suivants dans `qual-panel-nc`** (`display:none`) → invisibles. Diagnostic : profondeur d'imbrication des `qual-panel-*` (8D et suivants à depth 4 au lieu de 3).
- **Fix** : ajout du `</div>` de fermeture de la modale. `panelNC` était équilibré (12/12) — le badge de validation ajouté récemment n'y était pour rien.
- Fichier : `src/qualite.tsx` (1 ligne). Migration : non.
- Vérifié : `retourModalHTML` équilibré (22/22) ; build OK ; **DOM réel** = les 12 panneaux `qual-panel-*` de nouveau tous frères (depth 3), 8D visible avec son contenu (capture).

## 2026-07-21 — Validation Direction : refus « agissant » (annulation totale vs renvoi en révision)
- Le bouton **Refuser** (cockpit Direction) ouvre désormais une **modale** : motif obligatoire + case **« Annulation totale de l'élément »**. **Cochée** = annulation totale ; **décochée (défaut)** = **renvoi en révision** (l'émetteur corrige et resoumet).
- Le mode est stocké sur la validation (`payload.refus_mode` = `annulation`/`revision`, jsonb → **pas de migration**) et **affiché partout** : le badge d'origine devient **« Direction ✗ Annulé »** (rouge) ou **« Direction ✎ Révision »** (orange) ; l'onglet Traités affiche **« REFUSÉ · ANNULATION »** / **« REFUSÉ · RÉVISION »**. Choix **consultatif** (marque l'élément visiblement ; ne mute pas le statut métier interne — évite tout risque de contrainte CHECK sur 6 tables hétérogènes).
- Fichiers : `src/shared.ts` (`refusMode()` + `valDirBadge` mode-aware), `src/index.tsx` (route `/decision` accepte `refus_mode`), `src/direction_service.tsx` (modale + JS `refusConfirm`/`_postDecision` + badge Traités). Migration : non.
- Vérifié : build OK ; **test logique 12/12** (annulation/révision/défaut, payload objet ET string) ; **parsing JS de la page Direction 8/8** ; **e2e round-trip cloud** (créer `-TEST-` → refuser annulation → Traités affiche « REFUSÉ · ANNULATION » → **DELETE 204** nettoyé) ; capture `direction-refus-modal.png`.

## 2026-07-21 — Validation Direction : historique « Traités » + rebouclage sur les listes d'origine
- **Constat (audit)** : ce qui était soumis à la validation Direction n'était visible que dans la file « À valider » ; **une fois décidé (validé/refusé), l'item disparaissait** (aucun historique) et **la décision ne redescendait jamais** sur l'enregistrement d'origine. La route `POST /api/validations/:id/decision` ne met à jour que la ligne `validations` (statut/decided_by/commentaire) — elle ne touche pas `ref_table`/`ref_id`. **6 formulaires** alimentent cette file : avoir (Commercial→`credits`), NC (Qualité→`non_conformites`), objet HSE (Sécurité→table de l'entité), facture fournisseur (Compta→`factures_fournisseur`), bon de commande (Achats→`bons_de_commande`, listé côté Expéditions), fiche salarié (RH→`salaries`).
- **Ajouté — onglet « Traités » (cockpit Direction)** : `panelTraites` liste toutes les validations **décidées**, avec **filtre par catégorie** (pastilles domaine) **et par décision** (validées/refusées/toutes), colonnes objet/émetteur/montant/décidé le/par/commentaire. `direction/service` calcule `validationsDecidees` et le passe à la page. **Sans migration** (les colonnes `decided_at/decided_by/commentaire` existaient déjà).
- **Ajouté — rebouclage (badge Direction) sur chaque liste d'origine** : helpers `buildValDirMap` + `valDirBadge` (`src/shared.ts`) indexent les décisions par `(ref_table, ref_id)` ; un badge **« Direction ✓ / ✗ / … »** (avec décideur + commentaire en infobulle) s'affiche désormais sur la ligne de l'avoir (Commercial), de la NC (Qualité), de la facture fournisseur (Compta), du salarié (RH), du BC (Expéditions) et de chaque objet HSE (Sécurité). Chaque route concernée charge `getValidations()` et le passe à sa page.
- **Correctif** : Sécurité transmettait `ref_table:'hse'` (table inexistante) → remplacé par le vrai token d'entité, sinon le rebouclage ne pouvait pas matcher.
- **Choix retenu** : décision **consultative** (on affiche validé/refusé ; un refus ne défait pas automatiquement l'objet) — le « refus agissant » par type d'objet reste un 2ᵉ temps possible.
- Fichiers : `src/shared.ts`, `src/direction_service.tsx`, `src/index.tsx` (routes + data), `src/commercial.tsx`, `src/qualite.tsx`, `src/securite.tsx`, `src/compta_service.tsx`, `src/rh_service.tsx`, `src/expeditions.tsx`. **Migration DB : non.**
- Vérifié : build Cloudflare OK ; **test logique déterministe** (badge validé/refusé/attente/absent + onglet Traités filtres + rebouclage) et **smoke-test des 6 listes** = tout vert (2 bugs de portée `VD_MAP` — Qualité `panelNC`, Compta `buildARegler`, Expéditions `panelBC` — attrapés par le smoke-test puis corrigés) ; harnais toutes-pages **59/0**.

## 2026-07-21 — Dockerisation locale : app (Node) + Supabase auto-hébergé, interconnectés
- **Nouveau socle Docker** (`docker/`) : `docker compose up` monte l'ERP **et** une instance Supabase auto-hébergée sur le PC (dev/essai). **N'affecte pas la prod** : Cloudflare Pages + Supabase cloud restent intacts et continuent de se déployer à chaque `git push`.
- **Stack curée depuis le compose officiel Supabase** (8 conteneurs) : `db` (supabase/postgres) + `rest` (PostgREST) + `kong` (passerelle) + `app` (Hono/Node) en cœur ; `storage`+`imgproxy` (bucket GED) et `meta`+`studio` (dashboard `:8000`) en confort. Retirés car inutiles en local : realtime, supavisor (pooler), edge-functions, GoTrue (l'ERP a sa propre auth matricule+PIN). Fichiers officiels d'init (`volumes/db/*.sql`, `kong.yml`) récupérés tels quels.
- **Portabilité de l'app vers Node** (Cloudflare **non modifié**) : `src/db.ts` lit `SUPABASE_URL`/`SUPABASE_ANON_KEY` depuis l'environnement **avec repli sur le cloud** si absents (sur Workers, `process.env` n'est pas peuplé → repli automatique) ; nouveau `src/server.node.ts` (adaptateur `@hono/node-server` : injecte `process.env` dans `c.env`, sert `/static/*`, écoute `PORT`) ; `package.json` : `@hono/node-server`+`tsx`, scripts `start:node`/`dev:node`.
- **Mises à jour automatiques (honnête)** : GitHub→Cloudflare = automatique inchangé ; conteneur `app` = rechargé en direct via `tsx watch` sur bind-mount `src/`/`public/` (tant que Docker tourne) ; **base Docker = séparée du cloud**, alignée uniquement par des fichiers de migration rejoués (`erp-docker migrate`) — pas de synchro magique des DDL faits à la main dans le cloud.
- **Peuplement** : la base démarre sans les tables métier (schéma non versionné, vit dans le cloud) → `docker/db/seed/` documente l'export `pg_dump` du cloud + restauration locale (le secret DB ne passe jamais par le code).
- Aide-mémoire `docker/scripts/erp-docker.{ps1,sh}` (up/down/reset/logs/psql/restore/ged-bucket/migrate). Doc : `docs/technique/12-docker-installation.md`, `docker/README.md`.
- **Correctif Windows au 1ᵉʳ démarrage réel** : sur ce poste, les bind-mounts depuis `E:\` (fichiers **et** dossiers) arrivent **vides** dans les conteneurs (partage WSL2 + espace dans le chemin) → Kong ne démarrait pas (`/bin/sh <dossier>`) et l'app ne trouvait pas `server.node.ts`. **Fix** : plus aucun bind-mount — `kong.yml`+entrypoint et scripts d'init db **cuits dans des images dédiées** (`kong.Dockerfile`, `db.Dockerfile`), code app **copié au build**. Contrepartie : pas de live-reload → mise à jour de l'app par `docker compose up -d --build app`. Données en **volumes nommés** `db-data`/`storage-data`.
- **Vérifié EN VRAI (stack lancée)** : les **8 conteneurs sont `healthy`** (db/rest/kong/app/imgproxy/meta/storage/studio) ; app sur `http://localhost:3000` (`/login` + `/` 200, page « Connexion · ERP Seem Semrac » rendue) pointant sur `http://kong:8000` ; **chemin de données app→Kong→PostgREST→Postgres prouvé** (table test → `[{"id":1,"note":"stack-ok"}]` HTTP 200) ; bucket **GED** créé ; dashboard Studio `:8000`. Base **vide de tables métier** (à restaurer via `pg_dump` du cloud, voir `docker/db/seed/`). Build Cloudflare `dist/` régénéré, harnais **59/0**, prod intacte.

## 2026-07-20 — Avoirs : numérotation par affaire (AV-AAAA-affaire) ou libre (AVL-AAAA-NNN) + charger une facture
- **Numérotation** : si l'avoir est **rattaché à une affaire**, il porte le **numéro de l'affaire** → `AV-AAAA-<num_affaire>` (suffixé `-2`, `-3`… si plusieurs avoirs sur la même affaire). Sinon, **avoir libre** → numéro incrémental **`AVL-AAAA-NNN`** (`nextSeqId`).
- **Formulaire** (« Nouvel avoir ») : nouveau champ **« Rattacher à une affaire »** (saisie + datalist des affaires connues) et **« Charger une facture client »** (select des factures → **renseigne automatiquement l'affaire + le client**, la facture est référencée dans le motif). Un **aperçu du n°** s'affiche en direct. `pageServiceCommercial` reçoit désormais `getFacturesClient()`.
- Route `POST /api/credits` étendue : `num_affaire`/`num_facture` optionnels pilotent la numérotation ; `num_affaire` stocké sur l'avoir.
- Fichiers : `src/index.tsx` (route `/commercial/service` + numérotation), `src/commercial.tsx` (form + JS). Migration DB : non.
- Vérifié : tsc + build + harnais **59/0** ; **e2e** (`AV-2026-TESTAFF9`, 2e → `-2`, libre → `AVL-2026-001` ; facture dans le motif ; nettoyé).

## 2026-07-20 — Correctif : « Émettre un avoir » ne créait PAS l'avoir (invisible même après validation)
- **Bug** : le bouton *Émettre l'avoir* (Commercial › Avoirs, `submitSvcForm('avoirs')`) ne faisait qu'une **demande de validation Direction** (`ref_id:null`) — il **n'insérait rien dans `credits`**. La décision Direction ne fait que passer la ligne `validations` à `valide`. Résultat : l'avoir n'existait jamais → **n'apparaissait pas** dans le menu des avoirs, même après validation.
- **Fix** : nouvelle route **`POST /api/credits`** (famille `credits`, déjà gatée commercial) qui **crée réellement l'avoir** (`AV-AAAA-NNN` via `nextSeqId`, `client_id`/`client_nom`, `montant`, `solde=montant`, `statut='actif'`, `type`). Le formulaire crée d'abord l'avoir, **puis** (si la case est cochée) le soumet à la validation Direction avec son **vrai id** (`ref_id` renseigné), et rafraîchit la liste (`softReload`).
- Fichiers : `src/index.tsx` (route `POST /api/credits`), `src/commercial.tsx` (`submitSvcForm` réécrit). Migration DB : non.
- Vérifié : tsc + build + harnais **59/0** ; **e2e** (client réel → `AV-2026-…` créé dans `credits`, `statut actif`/`solde=montant` ; montant 0 → 400 ; nettoyé) ; **navigateur** (build servi contient `fetch("/api/credits")`, l'ancien stub `ref_id:null` a disparu). ⚠ `credits.client_id` = **FK vers `clients`** → le client doit exister (le `<select>` du formulaire ne propose que des clients réels).

## 2026-07-20 — Affaire enrichie (PV · opérateur/BDT · matière→BDT) + badges d'onglets partout + bannière linéarisée
- **Fiche affaire enrichie** : nouvelles sections **Bons de travail (BDT) & opérateurs** (l'opérateur ayant réalisé chaque BDT, résolu `operateur_id → nom` via `getOperateurs`), **PV de contrôle** (`pv_controle` par lot), et la table **Matières consommées** gagne une colonne **BDT consommateur** (`mouvements_stock.bdt_id`). Agrégateur `getCommandeDetail` étendu (`pvs`, `operateur_id/nom` + `lot_id` sur les BDT, `bdt_id` sur les matières) → propagé par `getAffaireDetail`.
- **Badges de comptage sur les onglets-listes de TOUS les services** : le petit chiffre (nb d'éléments/à traiter) manquait sur **Commercial** — ajouté (DT, offres, avoirs, clients, commandes, affaires) — et complété sur **qualité, sécurité, production, OAS, compta, expéditions, plans, stock, maintenance** (via `serviceHeader({ tabs:[{…, badge}] })`, déjà supporté). Les onglets non-listes (dashboards, formulaires, plans/cartes) restent sans badge ; badge masqué si 0.
- **Bannière de la fiche affaire linéarisée** : remplacement du bandeau bespoke par le **`pageHeader` standard** (cohérent avec le reste de l'app) + lien « Retour aux affaires ».
- Fichiers : `src/queries.ts` (getCommandeDetail + getAffaireDetail), `src/commercial.tsx` (fiche + sections + badges Commercial + header), et 9 modules services (badges). Migration DB : **non**.
- Vérifié : tsc + build + harnais **59/0** ; **e2e** (opérateur BDT résolu « Lloyd Pierre » ; PV agrégé cpk 1.45 ; matière liée à `BDT-…`) ; **navigateur** (badges Commercial/Qualité/Sécurité ; fiche affaire = header `pageHeader` + sections BDT/PV/matière). ⚠ **1 ligne de test `-TEST-` reste dans `mouvements_stock`** (table append-only : DELETE bloqué par RLS via clé anon) — à purger côté SQL : `delete from mouvements_stock where id='MV-TEST-AFF-E';`.

## 2026-07-20 — Commercial : onglet « Affaires » + fiche affaire 360 (circuit complet)
- Nouvel **onglet « Affaires (circuit) »** dans le service Commercial (`/commercial/service#affaires`) : liste **toutes les affaires par numéro** (`num_affaire`), avec client, un **mini-circuit** (DT · Offre · Commande cochés) et le statut. Un clic ouvre la fiche complète.
- Nouvelle **page fiche affaire** `/commercial/affaire/:num` (`pageAffaireFiche`) : **Pilotage 360** (montant offre/commande, CA facturé, coût de revient, marge €/%, avancement), un **stepper de circuit** (DT → Offre → Commande → Production → Livraison → Facturation) et **une section par étape** (DT, offres, commandes, lots/BDT, BL, factures, non-conformités, matières, avoirs) avec liens vers chaque pièce.
- Agrégateur serveur **`getAffaireDetail(num)`** (`src/queries.ts`) : regroupe par `num_affaire` (la table `affaires` est vide/inutilisable) et **réutilise `getCommandeDetail`** pour la production/facture/NC de chaque commande, + jointure DT/offre/avoirs/BL. Route `GET /commercial/affaire/:num`.
- Fichiers : `src/queries.ts` (+`getAffaireDetail`), `src/commercial.tsx` (+onglet, +`pageAffaireFiche`), `src/index.tsx` (route + import + sidebar). Migration DB : **non** · RBAC : page `/commercial/*` déjà gatée (aucune entrée auth).
- Vérifié : tsc + build + harnais **59/0** ; **e2e** (circuit `-TEST-` DT+offre+commande → `getAffaireDetail` agrège, route 200) ; **navigateur** (onglet Affaires liste l'affaire réelle `0001` ; fiche affaire = KPI 360 + stepper + sections, sections vides gracieuses ; 0 erreur console). Données `-TEST-` supprimées.

## 2026-07-20 — Offre : marge en € · liste dédiée des DT analysées · ADT ré-éditable jusqu'à acceptation
- **Marge en euros** dans l'offre (`pageOffreEdit`) : par produit **Marge €/pièce** et **Marge € série**, et **Marge totale (€)** dans la synthèse (recalcul live avec le coefficient).
- **Liste dédiée « DT analysées — dans les offres »** dans le service BE (onglet Analyse DT) : les DT `dans_offres` (analyse validée) — qui disparaissaient de la file « en attente d'analyse » — y sont désormais listées avec le **statut de l'offre liée** et un bouton **« Ré-éditer l'analyse »** (`pageServiceBE` reçoit les offres ; `/be/service` passe `getOffres()`).
- **ADT ré-éditable tant que l'offre n'est pas acceptée** : bouton « Ré-éditer » (→ `/be/analyse?dt=…`) si l'offre liée n'est pas `acceptee/validee`, sinon **« Analyse figée » + Visualiser**. Garde-fou serveur : `POST /api/dt/:id/analyse` refuse (**409**) si une offre liée est acceptée. **Correctif clé** : la ré-analyse **ne réinitialise plus** `marge_pct` à 20 % — elle **préserve** la marge par produit déjà fixée dans l'offre (sinon la ré-édition écrasait le prix commercial).
- Fichiers : `src/commercial.tsx` (marge €), `src/be.tsx` (liste dédiée + gating), `src/index.tsx` (garde-fou + préservation marge + `getOffres()` au service BE). Migration DB : **non**.
- Vérifié : tsc + build + harnais **58/0** ; **e2e** (ré-analyse offre en cours → marge 50 % préservée ; offre acceptée → **409**) ; **navigateur** (marge totale 29,20 € ; liste BE affiche une vraie DT analysée `DT-2026-0001` + gating « Ré-éditer » ↔ « Analyse figée »).

## 2026-07-20 — Commercial : édition d'offre en page dédiée (coûts par produit · marge par produit · certifs · avoirs)
- Le crayon d'une offre ouvre désormais **`/commercial/offre/edit?id=OFF-…`** (fonction `pageOffreEdit`, `src/commercial.tsx`), une **page pleine au design de l'analyse DT** au lieu de la modale « 3 champs ». Par produit : **résumé des coûts** (matière/accessoires/MO+machine/sous-traitance/frais gén./CRU, repris de l'analyse DT) + **coefficient de marge (×) éditable** → PV/pièce, PV série et marge % recalculés en direct.
- **Certifications & traçabilité** selon la/les norme(s) exigée(s) par le client (`pieces_detail[].exigences` + `normeReferentiel` de `qref.ts` : ISO 9001 / EN 9100 / …) + traçabilité traitement de surface. **Avoirs applicables** du client itemisés (`getCreditsEnCoursForClient`) + net à payer.
- Enregistrement : **`POST /api/offre/:id/pricing`** `{lignes:[{ref_interne,marge_pct}], validite?}` → écrit `pieces_detail[].marge_pct`+`prix_vente` sur la **DT liée** (offre↔DT 1:1, **aucune migration DB**) puis **recalcule côté serveur** montant / montant_revient / marge moyenne de l'offre (idempotent, totaux client non fiables).
- Fichiers : `src/commercial.tsx` (+`pageOffreEdit`, `import normeReferentiel`, editOffre→navigation, modale 3 champs retirée), `src/index.tsx` (routes `GET /commercial/offre/edit` + `POST /api/offre/:id/pricing`). Migration DB : **non**.
- Vérifié : tsc + build + harnais **58/0** ; **e2e** (POST pricing coeff ×1.5 → montant 75/revient 50/marge 50, DT `marge_pct=50 pv=7.5` — données `-TEST-` supprimées) ; **navigateur** (recompte live : coeff ×3 → PV 15, HT 265,20 €, marge moy. 110 %, net −30 € avoir ; 0 erreur console).

## 2026-07-20 — UX (3/3) : listes rafraîchies SANS perdre sa place (rechargement fluide `softReload`)
- Nouveau helper global **`softReload()`** (script de `layout`, `shared.ts`) qui remplace `location.reload()` : avant de recharger, il **mémorise la position de défilement** (sessionStorage) et la **restaure après le rechargement** (garde-fous : même page + < 15 s). L'onglet actif est déjà conservé (le hash d'URL survit au reload). Fini le **saut en haut de page** / la perte de contexte après un ajout/suppression/modification dans une liste.
- **Les 82 `location.reload()` convertis** en `softReload()` sur 15 fichiers (qualite 17, prod 13, rh 8, achats 8, maintenance 7, oas/direction/compta/commercial 4, securite/expeditions/be 3, fournisseur_fiche 2, shared/dashboards 1). Aucun `location.reload()` restant hors du corps de `softReload`.
- **Choix assumé** (contrainte « ne rien casser ») : rechargement *fluide* universel plutôt que ré-écriture du rendu de chaque liste (le vrai zéro-reload par liste — re-fetch + re-render ciblé — reste possible à la carte sur les listes les plus utilisées, sans risque de régression globale).
- Fichiers : `src/shared.ts` (+`softReload` + restauration du scroll) + les 14 modules ci-dessus. Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; `node --check` sur les 2 scripts émis par `layout()` = OK ; **navigateur** (`/stock/service`, page de 28 500 px : scroll à 1400 → `softReload()` → après rechargement `scrollY = 1400` restauré, clé sessionStorage consommée, 0 erreur console).

## 2026-07-17 — UX (2/3) : sélecteurs de liste recherchables (combobox au design de l'app)
- **Enhancer global** (script de `layout`, `shared.ts`) qui remplace **automatiquement** le rendu natif de **tous les `<input list="…datalist…">`** (45 champs — réfs matière/accessoire, fournisseurs, opérations, etc.) par un **menu déroulant stylé** : filtrage à la frappe, navigation clavier (↑/↓/Entrée/Échap), clic pour sélectionner. **Non invasif** : lit les `<option>` du datalist, détache l'attribut `list` (supprime le menu natif), et **re-déclenche l'événement `change`** à la sélection → **toute la logique `onchange` existante est préservée** (lookup réf↔désignation, prix auto…). Aucun call-site à modifier.
- Fichiers : `src/shared.ts` (enhancer combobox dans le script global). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; `node --check` sur le script global émis par `layout()` ; **navigateur** (réf matière : focus → panneau stylé ; frappe « ecrou » → filtre à 1 ; sélection → valeur `136290` posée + événement `change` déclenché → onchange OK).
- Reste (brique 3/3) : listes qui se mettent à jour **sans rechargement** (82 `location.reload()`).

## 2026-07-17 — UX (1/3) : confirmations en MODALE interne (fin des pop-ups navigateur)
- Nouveau helper global **`appConfirm(message, opts) → Promise<boolean>`** (script global de `layout`, `shared.ts`) : une **modale au design de l'ERP** (icône, titre, boutons Annuler/Confirmer, Échap = annuler, Entrée = confirmer, clic hors-cadre = annuler) remplace `window.confirm`. **Danger auto** (rouge) si le message évoque une suppression. Message **échappé** (plus sûr que le texte brut).
- **Les 49 `confirm()` natifs convertis** en `await appConfirm(...)` sur 13 fichiers (13 services). Les fonctions concernées passent `async` (appelées depuis onclick → sans impact). Plus aucun `confirm()`/`window.confirm()` natif dans `src/`.
- Prochaines briques UX (demande utilisateur, à venir) : (2) sélecteurs de liste recherchables natifs à l'app (réfs matière/accessoire…) ; (3) mise à jour des listes **sans rechargement de page** (remplacer les `location.reload()`).
- Fichiers : `src/shared.ts` (+`appConfirm`) + achats/be/commercial/expeditions/fournisseur_fiche/index/maintenance/plans/prod/qualite/rh/securite (conversion). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; `node --check` sur le script global émis par `layout` (avec `appConfirm`) = syntaxe OK (le harnais ne couvre pas le script du layout → vérif dédiée).

## 2026-07-17 — Plan / Bâtiment : repères « poste » (à la place des « machine ») + stats au survol
- Le repère **« machine » est remplacé par « poste de travail »** sur la maquette (`CATS.poste`). Un poste se pose sur le plan (bouton **+** / **Auto-placer**).
- **Au survol de l'icône**, une **bulle** affiche les stats principales du poste : **process contenus** (noms + nombre), **machines** (noms + nombre), **taux horaire effectif** (€/h) et **OPEX théorique** (€/an).
- Serveur (`/plans/service`) : stats calculées par poste (`computePosteRates` + agrégation `machines`/`process_atelier` par `poste_id` + OPEX `Σ cout_h × capacité × 220`) et passées à `pageServicePlans({ postes })`. Deep-link → « Postes & Process ». Anciens repères `machine` en base → point générique (non bloquant).
- Fichiers : `src/index.tsx` (route + stats), `src/plans.tsx` (catalogue poste, `posteTipHtml`/tooltip, auto-placement). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; navigateur (catalogue « Poste de travail », 19 postes ; survol d'un repère « Poinçonnage » → bulle : 4 process, 2 machines, 35 €/h, 123 200 €/an ; masquée au mouseout).

## 2026-07-17 — Audit sécurité + performance + qualité (workflow adversarial) & correctifs sûrs
Audit lecture-seule multi-agents (sécurité vérifiée en adversarial), puis correctifs **sûrs par lots** (chacun `erp-verify` 57/0), **sans rien casser de fonctionnel**. 3 commits :
- **Sécurité** (`fix(securite)`) : XSS réfléchi/open-redirect pré-auth `/login?next=` (validation server-side + échappement) ; XSS stocké nom fournisseur (widget DA) et nom machine (`<option>` /production/bdt) ; **bypass d'auth par joker ILIKE** `matricule='%'` (rejet des métacaractères LIKE dans `verifySalariePin`/`verifyOperateurPin`) ; **rate-limit `/api/login`** (8 échecs/60 s → 429). Détail : `docs/technique/08-securite.md`.
- **Qualité** (`refactor(qualite)`) : helper `escX` **centralisé** dans `shared.ts` (était dupliqué byte-à-byte dans 15 pages → cause de la dérive d'échappement) ; retrait de code mort (`coutGammeStForfait`, `OPS_SOUS_TRAITANCE`, `ALL_OPS`, `escX` inutilisé de securite.tsx) ; `esc→escX` en contexte d'attribut (direction).
- **Performance** (`perf`) : recomputes du solde BDT en `Promise.all` (colonnes disjointes) ; `getLotDetail` intégré au `Promise.all` de `/production/lot/:id` (un aller-retour en moins) ; payload mort `CAPA_STUDY_BY_RES` supprimé ; clone runtime inutile `JSON.parse(JSON.stringify())` retiré du planning.
- **Reste à faire (documenté, non fait pour ne rien risquer)** : côté **déploiement** — roter/poser `JWT_SECRET` + `BOOTSTRAP_*` en env (secret HS256 committé) ; côté **perf** — le plus gros gain est `getDashboardData` (33 tables entières en `select('*')` sans borne, cause de la saturation 60-70 s) : nécessite de scoper chaque dashboard à ses tables (audit `kpi.ts` requis) ; borner/paginer les listes chaudes (`getBonsDeTravail`, `getPlanningBDTs`…) ; fusionner les 2ᵉˢ `Promise.all` de qualite/securite/direction ; charger `NOM_BY_ID` à la demande (be.tsx). Ces items sont plus risqués → à traiter en passe dédiée et vérifiée.
- Fichiers : `src/index.tsx`, `src/login.tsx`, `src/shared.ts`, `src/queries.ts`, `src/qualite.tsx`, `src/planning_bdt_bds.tsx`, `src/direction_service.tsx`, `src/securite.tsx` + les 15 pages (dedup escX). Migration DB : non.

## 2026-07-17 — Machine rattachée à PLUSIEURS process (multi) + synchronisation Machine ↔ Process
- **Rattachement multi** : dans la modale machine, le select unique « Process rattaché » devient une **liste de cases à cocher** (`mc_proc_list`) — une machine peut couvrir **plusieurs process d'un même poste**. Cases pré-cochées = les process déjà rattachés à la machine (`process.machine_id === machine.id`). Case « Créer aussi un nouveau process » séparée (création uniquement).
- **Synchronisation à l'enregistrement** (`createMachineFn`) : pour chaque process **du poste**, coché & non rattaché → **rattache** (`PATCH process {machine_id}`), décoché & rattaché à cette machine → **détache** (`{machine_id:null}`). Les process d'autres postes / d'autres machines ne sont pas touchés.
- **Synchronisation Machine ↔ Process** : les deux surfaces écrivent le **même champ** `process.machine_id` — la modale machine (`mcPosteChange` re-coche d'après `PROCESS`) et l'édition de process (`openProcEdit` présélectionne `pe_machine` d'après `process.machine_id`, `saveProcEdit` l'écrit) reflètent donc toujours le même état après rechargement.
- Fichiers : `src/prod.tsx` (modale : `mc_proc_list`/`mc_proc_new`, `mcFillProcess` multi, `mcPosteChange`, `createMachineFn` sync attach/détache). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; navigateur (poste à 4 process → 4 cases) ; e2e (rattachement de **2** process à une machine confirmé en base, puis détache de l'un → l'autre reste ; nettoyé).

## 2026-07-17 — Machine → poste → process + CRU au taux horaire de la machine du process
- **Formulaire machine (`/production/service`)** : après le **poste**, on choisit le **process** auquel la machine est rattachée (select des process **du poste choisi**, `mcFillProcess`) — ou « Nouveau process (au nom de la machine) ». La case à cocher « Créer aussi le process » est remplacée par ce select. À l'enregistrement, la machine est **rattachée au process** (`PATCH /api/production/process/:id {machine_id}`) en plus de sa création/màj. En édition, le process déjà rattaché (`process.machine_id === machine.id`) est présélectionné.
- **Coût de revient = taux horaire (`cout_h`) de la machine du process** : le coût machine du CRU suit désormais le **`cout_h` de la machine** rattachée au process de l'étape (via `computePosteRates.machineRate`, qui renvoie `cout_h (+ incrément OPEX du poste)` au lieu du taux stocké sur l'étape — souvent 0). **Robuste** : fonctionne même si la machine n'est pas (encore) rattachée à un poste (son `cout_h` seul, sans incrément). `getBeRefs` expose `machines[].cout_h` ; la gamme BE fixe `machine_taux_h = cout_h` au choix du process et `nomEtapeCoutMachine` retombe sur le `cout_h` live pour les gammes existantes.
- **Impact** : les coûts machine, auparavant nuls (taux étape à 0), sont maintenant comptés. Ex. DT-2026-0001 : `machineSerie` 0 → **156,55 €** (Poinçonnage 0,063 min × 35 €/h × 4260), CRU total 2 748,92 → **2 905,47 €** (seul le coût machine change ; matière + MO inchangés → pas d'autre régression).
- Fichiers : `src/shared.ts` (`computePosteRates` : `coutHByMachine` toutes machines + `machineRate` sur `cout_h`), `src/queries.ts` (`getBeRefs` expose `cout_h`), `src/be.tsx` (`nomOnEtapeProcessChange`/`nomEtapeCoutMachine`), `src/prod.tsx` (modale machine : `mc_proc_sel`/`mcFillProcess`, `createMachineFn` rattache le process). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; test unitaire isolé (`machineRate('MACH-2026-012',0)=35`, `machineSerie=156,55`) ; endpoint réel (CRU total 2 905,47) ; navigateur (modale machine poste→process = « Tronçonneuse Kasto », rattachement e2e `process.machine_id` posé + nettoyé). ⚠ **wrangler pages dev sert parfois un worker périmé après rebuild — redémarrer le serveur si un changement moteur ne se reflète pas.**

## 2026-07-17 — Gamme par POSTE→process · planning tous postes · OAS machine · UX Production
- **Gamme (nomenclature + analyse DT) réordonnée** : colonnes **[Type] · [Poste] · [Process]** (le libellé « Process/Opér. » devient **Poste**, une colonne **Process** est ajoutée). **Les process choisissables = uniquement ceux rattachés au poste** sélectionné. La colonne texte libre « Opération » (interne) est retirée (le nom vient du process). `getBeRefs` expose désormais `postes[]` + `poste_id` sur les process ; `/be/analyse` injecte `window.__BE_REFS__` (postes + process) pour les étapes ajoutées (Poste→Process filtré, plus de saisie libre de machine).
- **Création machine/process retirée de la gamme BE** : les 2 boutons « + Machine » / « + Process » + leurs modales + fonctions sont supprimés — machines et process se créent **uniquement en Production → « Postes & Process »** ; la gamme ne fait que **choisir**.
- **Planning par poste = TOUS les postes** (le filtre Seem/Semrac ne masque plus les postes ; seuls les postes d'activité OAS restent hors planning). Un poste **n'accueille que les BDT de son process** : le poste d'un BDT est **dérivé du process** (`bdtPoste`), et un dépôt sur un autre poste est **refusé** (`placerBDTPoste` valide contre le poste du process).
- **Bug OAS machine corrigé** : les routes `POST`/`PATCH /api/production/machine` rabattaient toute activité autre que Seem/Semrac/both sur **« Seem »** → une machine mise en **OAS** réaffichait « Seem ». Whitelist élargie à `OAS`. ⚠ **Migration DB requise** : la contrainte `machines_activite_check` bloque encore `OAS` en base → exécuter **`scripts_import/machines_activite_oas.sql`** (PAT). Postes & process OAS fonctionnaient déjà. Badge + filtre **OAS** ajoutés au parc machines.
- **UX Production** : le bouton **« Demande d'achat » (opérateur)** passe du **flottant bas-droite** au **header haut-droite** (comme les autres services). Bouton **corbeille** pour **supprimer un process** dans un poste (volet « Postes & Process »).
- **Sécurité (revue adversariale)** : échappement corrigé sur `deleteProc`/`deletePosteFn` (nom en attribut `onclick` → strip `<>"'\`) et sur les notifications de placement BDT (`_pesc`) ; `getBeRefs` process en `select('*')` (immunisé si `poste_id` absent).
- Fichiers : `src/queries.ts` (getBeRefs postes+poste_id), `src/be.tsx` (gamme colonnes, nomOnEtapePosteChange, retrait création), `src/index.tsx` (routes machine OAS, /be/analyse gamme+injection BE_REFS, persistance poste/process des étapes libres), `src/prod.tsx` (bouton DA, delete process, badge/filtre OAS), `src/planning_bdt_bds.tsx` (tous postes + validation dépôt). Migration DB : **oui** (`scripts_import/machines_activite_oas.sql`).
- Vérifié : tsc + build + harnais **57/0** ; navigateur (gamme nomenclature & ADT = [Type][Poste][Process] avec process filtré par poste — testé « Tronçonneuse Kasto » seul process de son poste ; planning = 19 postes affichés ; DA en header ; process OAS/poste OAS persistent) ; revue adversariale (5 constats, 3 corrigés).

## 2026-07-17 — Analyse DT : temps & coûts **par poste** (défilables par quantité) + détail coût matière/accessoires par réf
- **Panneau « Temps & coûts par poste »** (sous la gamme) : regroupe les étapes **par poste** et affiche, **pour la quantité choisie**, le **temps série** (`réglage/lot + variable × q`) et le **coût série** (`cout_reglage + cout_pc × q` ; ST = `max(forfait ; q × unit)`). Deux **flèches ‹ ›** (« précédent / suivant ») font **défiler les quantités à chiffrer**, l'indicateur affichant la quantité courante (`i/n`). Le **poste** de chaque étape est résolu serveur (`machine_id → machine.poste_id`, sinon `process_id → process.poste_id`, sinon nom machine/ST).
- **Vrais temps/coûts calculés** (fini l'affichage « identique à la nomenclature ») : le total du panneau **réconcilie au centime** avec la colonne « MO+mach ×q » du chiffrage.
- **Détail coût matière & accessoires par réf** : la couverture affiche désormais **Prix unité** (`cout_unite`, « à chiffrer » si RFQ manquante) et **Coût série** (`cout_serie = besoin × prix`, arrondi supérieur comme le CRU) + une **ligne de total** (matière + accessoires).
- **Refactor anti-dérive** : nouvelle fonction **`etapeDecomp`** (`src/shared.ts`) = **source UNIQUE** de la décomposition coût/temps d'une étape, appelée par `computeNomCostForQty` (CRU) **et** l'endpoint analyse-DT ⇒ panneau « par poste » et CRU **ne peuvent plus diverger**. Corrige un piège : `machine_taux_h = 0` ne se replie plus sur `cout_machine_h` (`|| 50`) — c'est un taux **0** (base machine nulle) + incrément OPEX poste (Phase E). **CRU inchangé** (non-régression : `totalSerie` identique avant/après).
- Fichiers : `src/shared.ts` (`etapeDecomp` + `computeNomCostForQty` refactorisé), `src/index.tsx` (endpoint `GET /api/be/analyse-dt/:id` : `poste_id/poste_nom/cout_unite/cout_serie/st_forfait/st_unit` ; form : `beRenderPostes`/`bePosteNav`/`beRenderCoverage`). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; endpoint réel `DT-2026-0001` (poste panel = 726,74 € = MO+mach du CRU ; matière+process = `totalSerie` 2 748,92 € inchangé) ; navigateur (panneau rendu, flèches câblées sans erreur, couverture avec coûts par réf).

## 2026-07-17 — Analyse DT : validation ouverte au BE · frais généraux /lot · marge retirée (→ offre) · synthèse corrigée
- **Tous les analystes BE peuvent valider l'analyse** : `POST /api/dt/:id/analyse` était rattaché au service **commercial** (`dt→commercial`) → un rôle `bei` (`commercial:'r'`) était **refusé** (cas Florian Lebescond, rôle `bei`). Correctif RBAC : `serviceFor` renvoie **`be`** pour `/^\/api\/dt\/[^/]+\/analyse$/` (l'analyse est une action du Bureau d'Études). Les autres actions `/api/dt` restent commerciales.
- **Frais généraux = coût PAR LOT** (avant : par pièce) : saisis une fois, **amortis sur la quantité** (part/pièce = `frais / qté`). Colonne « Frais g. (lot) » (comptée une fois dans le CRU série).
- **Marge retirée de l'analyse** : le BE ne chiffre que le **coût de revient (CRU)** ; la **marge et le prix de vente se fixent dans l'offre** (côté commercial, champ « Marge » de l'offre). Le tableau de l'analyse n'a plus de colonnes PV/pc ni PV total. L'offre calcule le PV = `CRU × (1 + marge de l'offre)` (`renderPiecesCru`). Le brouillon d'offre démarre à **20 %** par défaut, ajustable.
- **Synthèse multi-produits corrigée** : affiche le **Coût total de la DT** (Σ des coûts série de chaque produit à sa quantité) + le temps total, au lieu d'une moyenne CRU/pc (qui n'avait pas de sens entre produits différents). Tuile « Prix de vente » retirée.
- Fichiers : `src/auth.ts` (RBAC analyse→be), `src/index.tsx` (form analyse : `beRowFor`/`beRenderResults`/`updateSynthese`/`saveAnalyseBE`, endpoint `POST /api/dt/:id/analyse`), `src/commercial.tsx` (`renderPiecesCru` PV = CRU × marge offre). Migration DB : non.
- Vérifié : tsc + build + harnais 57/0 ; test RBAC (`bei` ALLOW sur `/analyse`, DENY sur les autres `/api/dt`) ; navigateur (frais g. 1 000 € /lot une fois → CRU total 3 748,92 €, CRU/pc 0,89 € ; marge + PV absents ; synthèse = coût total DT). Capture `form-be-analyse.png` rafraîchie.

## 2026-07-17 — Postes & Process : simplification + activité OAS (hors planning)
- **Bac « À rattacher » + glisser-déposer retirés** : la gestion se fait uniquement **via le process et son poste** (bouton « + Process » du poste pour créer ; bouton ✏️ pour éditer/(ré)affecter le poste). Un process est toujours créé dans un poste.
- **Machines créées uniquement dans le volet « Machines »** : le bouton « + Machine » par poste est retiré (`openMachineModalForPoste` supprimé). Un process reste rattaché **ou non** à une machine (via sa modale).
- **Activité « OAS »** ajoutée aux **postes** ET aux **machines** (Seem / Semrac / les deux / **OAS**). Un poste/process/machine OAS **ne s'affiche plus dans le planning** (exclusion `est_oas` / `activite==='OAS'` / poste OAS dans `buildGantt` + `buildPosteBoard`/`buildProcessBoard`).
- **Les process OAS alimentent les types de bain de l'onglet OAS** : le champ « Type de traitement (bain) » de la déclaration de balancelle (`nb_type`) liste désormais les **noms des process OAS** (au lieu des 3 valeurs codées en dur). La route `/oas/service` passe les process d'activité OAS à `pageServiceOAS` ; la validation serveur accepte tout nom de bain (≤ 80 car.). Défaut = anciennes valeurs si aucun process OAS.
- Fichiers : `src/prod.tsx` (retrait bac/DnD + bouton Machine par poste, options OAS `po_activite`/`mc_activite`, badge OAS, exclusion planning), `src/planning_bdt_bds.tsx` (exclusion OAS des boards), `src/oas.tsx` (`nb_type` dynamique), `src/index.tsx` (route OAS passe les process OAS + validation bain assouplie). Migration DB : non.
- Vérifié : tsc + build + harnais 57/0 ; navigateur (bac absent, 0 bouton Machine par poste, OAS dans les 2 activités, planning 28→27 lanes quand un process est OAS) ; e2e OAS (process OAS créé → apparaît dans `nb_type` → supprimé).

## 2026-07-17 — Postes : éditer un process depuis le poste (nom · taux horaire · machine)
- Chaque **process listé sous un poste** porte un bouton ✏️ qui ouvre la modale d'édition : **nom**, **machine rattachée**, **taux horaire (€/h)** et poste. Le **« taux horaire » d'un process = le coût horaire (`cout_h`) de sa machine** — le modifier met à jour la machine (donc le **CRU** via le taux effectif du poste). Pour un process **manuel** (sans machine), le champ est désactivé (le taux MO est défini dans la nomenclature).
- Fichiers : `src/prod.tsx` (bouton ✏️ sur les process du poste, `procEditModal` + champ `pe_taux`, `openProcEdit`/`peMachineChange`/`saveProcEdit`, `machinesForProc` expose `cout_h`). Migration DB : non.
- Vérifié : tsc + build + harnais 57/0 ; navigateur (ouverture modale → taux chargé depuis `cout_h` machine ; save → `PATCH process` + `PATCH machine {cout_h}` ; désactivé si manuel).

## 2026-07-17 — Correctifs Postes & Process (retours utilisateur)
- **Volet « Postes & Process » mis en 1er + affiché par défaut** (avant : « Machines » en 1er/défaut).
- **Glisser-déposer réparé** : il était cassé par une **collision de nom** — un `procDrop` existait déjà pour le board d'affectation opérateurs et, par hoisting, écrasait celui des postes (erreur `classList.remove` sur une cible sans `classList`). Les fonctions du glisser-déposer des postes sont renommées avec le préfixe **`pp`** (`ppRowDrop`, `ppChipDrag`, `ppDropDetach`, `ppAttachProc`…). Vérifié : un vrai `DragEvent` déclenche bien `PATCH /api/production/process/:id {poste_id}`.
- **Process déjà rattachés glissables** (déplacer d'un poste à l'autre) ; **déposer sur le bac « À rattacher » détache** le process (`poste_id → null`).
- Fichiers : `src/prod.tsx`. Vérifié : tsc + build + harnais 57/0 ; capture `production-postes.png` rafraîchie.

## 2026-07-17 — Postes & Process : gestion par poste (glisser-déposer) · coûts en unités d'achat entières
- **Volet « Postes & Process » (Production → Process Ateliers) refondu** : le **référentiel de process à plat est retiré**. Chaque **poste** porte, sur sa ligne, un bouton **« + Process »** (Manuel/Machine/OAS, poste pré-rempli) **puis** **« + Machine »** (machine + son process, rattachés au poste). Les process **non rattachés** apparaissent dans un bac **« À rattacher — process sans poste »** sous la liste et se **glissent-déposent** sur un poste (`PATCH /api/production/process/:id {poste_id}`). Plus de création libre de process.
- **Coûts en UNITÉS D'ACHAT ENTIÈRES (arrondi supérieur)** dans l'analyse DT et le CRU : **accessoires** comptés en **paquets** (`ceil(nb_par_piece × qté / qte_paquet) × prix_paquet`) et **matière** en **tôles entières** (`ceil(qté / nb_par_tole) × prix_tole`) — on n'achète ni un demi-paquet ni une demi-tôle. Le **besoin** de la couverture s'affiche désormais en **paquets / tôles** (ex. « 1 747 paquets », « 3 tôles ») et non en pièces individuelles. Repli linéaire si les champs d'unité d'achat manquent. Généralisé à `computeNomCostForQty` (`src/shared.ts`) + la couverture de `/api/be/analyse-dt`.
- Fichiers : `src/prod.tsx` (volet postes, boutons par poste, bac à rattacher, glisser-déposer), `src/shared.ts` (`computeNomCostForQty` matière tôles + accessoires paquets), `src/index.tsx` (couverture `besoin`/`besoin_unite`, tableau résultats). Migration DB : non.
- Vérifié : tsc + build + harnais **57/0** ; tests unitaires moteur (matière tôles + accessoires paquets) ; e2e live (besoin « 1 747 paquets » / « 3 tôles », rattachement process→poste puis détaché) ; captures `form-be-analyse.png` + `production-postes.png` rafraîchies.

## 2026-07-16 — Phase E : achat machine → OPEX poste → taux horaire effectif → CRU · analyse DT (série ×q + accessoires en paquets)
- **Le POSTE est l'unité de coût.** Un **achat machine reçu** (BL d'un BC `categorie='machine'`) incrémente `machines_opex.achats_ht` de la machine (**année civile**) ; le **taux horaire effectif du poste** = base (moyenne pondérée `cout_h`) + `(Σ achats_ht des machines du poste) / (Σ capacité × 220 j budgétés)`, **ou** un **taux manuel** (`postes.taux_horaire_manuel`, override avec fenêtre de confirmation) qui prime en absolu. Ce taux **alimente le CRU** des pièces usinées au poste (`computeNomCostForQty` reçoit `opts.machineRate`).
- **Non-régression GARANTIE** : `achats_ht` est une **colonne DÉDIÉE** (jamais `cout_total_ht`, qui garde partout ailleurs le sens d'« OPEX annuel complet »). Tant qu'aucun achat n'est reçu, l'incrément vaut 0 ⇒ **le CRU d'une pièce sans achat machine est strictement inchangé** (testé : même une ligne `cout_total_ht` pleine ne bouge pas le taux).
- **Greffe idempotente** : marqueur atomique `bons_de_commande.opex_greffe` réclamé en CAS (`claimBcOpexGreffe`) → **pas de double-comptage** sur double-clic / ré-réception. Le montant greffé = `bc.montant_ht` (saisi par les Achats à la validation DA→BC). Report `categorie/machine_id/poste_id` aussi sur les BC créés directement (`POST /api/achats/bc`).
- **Analyse DT — bug 1 (série ×q)** : le tableau de résultats affiche désormais les coûts en **TOTAL SÉRIE** (`Matière ×q · Access. ×q · MO+mach ×q · S-trait ×q · Frais g ×q · CRU total`) **en plus** de `CRU/pc · PV/pc · PV total`. Séries **exactes** renvoyées par le serveur (`matiere_serie/accessoire_serie/mo_serie/st_serie`) — plus de dérive par-pièce×q arrondi.
- **Analyse DT — bug 2 (accessoires en paquets indivisibles)** : coût accessoire = `plafond(nb_par_pièce × qté / qté_par_paquet) × prix_paquet` (on n'achète pas un demi-paquet de boulons) → le coût/pièce **baisse par paliers** quand la quantité monte. Repli linéaire si les champs paquet manquent.
- **Réconciliation** : Production (colonne **« Taux/h effectif »** + « dont +X achats »), Finances (`finMacs` intègre l'incrément), Maintenance (colonne taux effectif dans « Coûts postes ») lisent **le même** taux (`computePosteRates`).
- **Migration DB** (⚠ RE-RUN idempotent) : `scripts_import/machines_achats_opex_schema.sql` ajoute `machines_opex.achats_ht`, `postes.taux_horaire_manuel`, `bons_de_commande.opex_greffe`, **+ RLS permissive sur `machines_opex`** (sinon la greffe est refusée `42501`). Fail-soft tant qu'elle n'a pas tourné (getters, greffe no-op, override non persisté — CRU inchangé).
- Fichiers : `src/shared.ts` (`computeNomCostForQty` + `computePosteRates`), `src/queries.ts` (`upsertMachineOpexAchat`, `claimBcOpexGreffe`, `getMachinesOpex`), `src/index.tsx` (réception BL, route analyse-dt, BC direct, tableau résultats client, `POSTE_COLS`), `src/prod.tsx` (colonne taux + `posteSetTaux`), `src/finances.tsx` (`finMacs`+3 pages), `src/maintenance_service.tsx` (`panelPosteCosts`). Migration : `scripts_import/machines_achats_opex_schema.sql`.
- Vérifié : tsc + build + harnais **57/0** ; tests unitaires moteur (non-régression, paquets, incrément, override, ligne OPEX pleine → incrément 0) ; e2e analyse-dt (séries exactes) ; revue adversariale **12 agents** → 6 bugs corrigés (overload `cout_total_ht`, `libresCost`, race greffe→CAS, map POSTES perdait l'override). Doc mise à jour : `technique/03-base-de-donnees.md`, `technique/06-modules/production.md`, `technique/06-modules/maintenance.md`, `technique/06-modules/be.md`, `manuel/formulaires/be.md`. Captures **rafraîchies** : `form-be-analyse.png` (tableau résultats série ×q + paquets) et `production-postes.png` (colonne « Taux/h effectif ») — outillage `scripts_doc/capture_screens.mjs` étendu (`fullPage`/`eval`/`scrollTo`).

## 2026-07-16 — Postes d'atelier : regroupent machines + process · planning par poste · OPEX/coût par poste
- **Nouveau concept « poste »** (table `postes`) = conteneur qui regroupe plusieurs **machines** (`machines.poste_id`) ET plusieurs **process** (`process_atelier.poste_id`, chaque process gardant son type Manuel/Machine/OAS). Admin dans **Production → onglet Machines → « Postes de travail »** (CRUD + menu « Poste » sur les modales machine & process).
- **Planning par poste** : le Gantt par opérateur est conservé ; un board **« Planning par poste »** est ajouté sous le planning — une ligne par poste, chaque BDT apparaît au poste de son process (ou placé explicitement en glissant la carte → `bons_de_travail.poste_id`).
- **OPEX / coût PAR POSTE, régularisé** : OPEX poste = **somme de l'OPEX des machines du poste** (consommables réels + théorique `cout_h × capacité × 220`) + consommables tirés au poste (postes manuels). **Le même calcul est repris en Maintenance** (nouvel onglet « Coûts postes » : TCO par poste = OPEX + maintenance).
- **Migration DB** : `scripts_import/postes_schema.sql` (table `postes` + colonnes `poste_id` sur machines/process_atelier/mouvements_stock/bons_de_travail + RLS + reload). ⚠ **À exécuter dans l'éditeur SQL Supabase** (DDL = PAT requis). Tant qu'elle n'a pas tourné : `getPostes()` **fail-soft** (→ `[]`), les pages fonctionnent sans postes, et `poste_id` n'est jamais écrit (aucune régression sur la création machine/process).
- Fichiers : `src/queries.ts` (getPostes/CRUD), `src/index.tsx` (routes `/api/production/poste`, `poste_id` sur machine/process/sortie/BDT, données planning & maintenance), `src/prod.tsx` (admin postes + OPEX par poste + sortie poste), `src/planning_bdt_bds.tsx` (board par poste), `src/maintenance_service.tsx` (onglet Coûts postes). Migration : `scripts_import/postes_schema.sql`.
- Vérifié : build + harnais toutes-pages **verts** ; migration exécutée puis **e2e complet sur données réelles** — créer un poste, y rattacher une machine + un process (Production : machines=1, process=1, OPEX théorique **5 720 €** = 3,25 × 8 × 220), même **OPEX 5 720 € + maintenance 0 = TCO 5 720 €** côté Maintenance (calcul régularisé identique), board planning par poste (lane + placement BDT), et **suppression du poste qui détache automatiquement** machine + process (`poste_id → null`). Données de test créées puis supprimées. Doc mise à jour : `technique/03-base-de-donnees.md`, `technique/06-modules/production.md`, `technique/06-modules/maintenance.md`. Captures à refaire : oui, une fois les vrais postes créés.

## 2026-07-16 — Analyse DT : chiffrage auto (verrouillé) + multi-quantités · accessoires nomenclature corrigés
- **Chiffrage Analyse DT 100 % automatique** (`/be/analyse`) : **matière**, **accessoires** (ligne distincte sous la matière), **MO+machine** et **sous-traitance** sont **calculés tout seuls** (temps **fixes** + **variables (MO & machine) × quantité**, réglage amorti sur le lot) et **non modifiables**. **Seuls les frais généraux et la marge sont saisissables** (exigence client). Le CRU et le prix de vente en découlent.
- **Plusieurs quantités par pièce** : dans la DT (bloc Produit), on ajoute **une case par quantité** via **« + Ajouter une quantité »** (chaque case a un **×** pour la retirer) — pas de saisie groupée. L'Analyse DT affiche **exactement autant de lignes de prix que de cases** (tableau `Qté · Matière · Accessoire · MO+machine · S-trait. · Frais g. · CRU/pc · PV/pc · PV total`) — le prix/pièce **baisse avec la quantité** (économies d'échelle). Les paliers `×qté → PV/pc` s'affichent aussi dans le détail de l'offre. Montant/offre restent sur la quantité principale.
- **Matière & accessoires comptent la quantité nécessaire** pour la quantité voulue (panneau Couverture : `besoin = quantité_par_pièce × quantité`).
- **Bug accessoires nomenclature corrigé** : la liste « Réf. accessoire » déroule **toutes** les réfs accessoires existantes (n'est plus masquée quand le fournisseur n'est pas tagué « accessoire ») ; choisir une réf **remplit la désignation** et **sélectionne le fournisseur** qui la porte au catalogue. Réf nouvelle → choix parmi tous les fournisseurs de l'entité.
- Fichiers : `src/index.tsx` (`GET /api/be/analyse-dt/:id` → `results[]`/`quantites[]` par quantité ; formulaire `/be/analyse` : cellules coûts verrouillées + tableau multi-quantités ; `POST /api/dt/:id/analyse` → `cout_accessoire` + `quantites_chiffrage`), `src/commercial.tsx` (champ « Quantités à chiffrer » + paliers d'offre), `src/be.tsx` (sélecteur accessoire : `nomAccProdsAll`/`nomFournFournit`/`nomFournAll`). Migration DB : non (jsonb `pieces_detail`). 
- Vérifié e2e (DT réelle, nomenclature validée) : prix auto verrouillés ; multi-quantités 1000/4260/20000 → 3 lignes, CRU décroissant ; accessoire « 136290 → Ecrou CLS M3-1 → BOSSARD » auto ; sauvegarde `cout_accessoire`+`quantites_chiffrage` persistés ; harnais toutes-pages vert. Données de test créées puis supprimées.
- Doc mise à jour : `technique/06-modules/be.md`, `technique/06-modules/commercial.md`, `manuel/formulaires/be.md`, `manuel/formulaires/commercial.md`. Captures à refaire : oui (formulaire `/be/analyse` + bloc DT).

## 2026-07-16 — Taux horaire RH confidentiel (masqué, réservé aux droits d'écriture)
- Sur la fiche employé (`/rh/employes`), le **taux horaire chargé** est **masqué** (`***`/points) et n'est **révélé qu'en maintenant le clic** dessus (`rhTauxReveal`/`rhTauxMask`, `type=password`↔`text`).
- **Sécurité (fond, pas seulement affichage)** : la vraie valeur n'est **sérialisée dans `RH_EMPS` (JS client) que si l'utilisateur a les droits d'écriture RH** (`rh`/`direction`, via `canAccess(user, '/api/rh/salarie', 'POST')`). En lecture seule (ex. `comptable`), `taux_horaire=null` → **absent de la page** (pas d'inspection possible). La sauvegarde omet le taux depuis un compte non autorisé.
- Fichiers : `src/index.tsx` (route `/rh/employes` calcule `canWriteRH`), `src/rh_service.tsx` (`pageRHEmployes` : gate `RH_EMPS`, champ masqué, `rhTauxReveal/Mask`). Migration DB : non. Vérifié : sans session → aucun taux dans le HTML ; session direction → taux présent mais masqué + révélable.
- Doc mise à jour : `technique/06-modules/rh.md`, `manuel/formulaires/rh.md`.

## 2026-07-16 — Stock : ref/désignation séparées + tout le catalogue apparaît dans le stock
- **Réf ≠ désignation** : l'auto-création d'une entrée stock **ne recopie plus jamais la référence dans la désignation** (`ensureStockRowForRef` / `ensureStockRowsForFournitures`, `src/queries.ts`) — les deux colonnes restent distinctes (désignation vide si réellement absente, jamais = la réf).
- **Toute nouvelle référence catalogue → stock** : le hook `upsertProduitFournisseur` se déclenche désormais pour **toutes** les références (plus seulement `matiere`) et pose la bonne `categorie` (`matiere`/`accessoire`). Idem côté nomenclature (`ensureStockRowsForFournitures` couvre matière **et** accessoires).
- **Backfill** : les **72 références de catalogue** (`produits_fournisseurs`) absentes du stock ont été insérées (entrées vides `stock_actuel=0`, désignation réelle, catégorie normalisée) — le stock reflète maintenant le catalogue (144 réfs). Opération non destructive.
- Effet : la couverture matière de l'analyse DT lit désormais le vrai stock (ex. `125237` : `hors_stock` → `rupture` à 0).
- Fichiers : `src/queries.ts`. Migration DB : non (data : backfill catalogue→stock). Vérifié e2e (catalogue accessoire → stock ; désignation ≠ réf).

## 2026-07-15 — Avoirs auto dans l'offre + upload GED des documents d'analyse DT
- **Avoirs client dans l'offre** : l'offre affiche les **avoirs « en cours »** du client (`credits`, `solde>0`, non clôturés ; rattachement `client_id` sinon `client_nom`) en **déduction → net à payer** (`pageOffreCommerciale`, colonne Montant). Le **solde n'est décompté qu'à l'acceptation** de l'offre : `POST /api/offre/:id/accepter` consomme les avoirs (plus ancien d'abord) jusqu'au montant, met le statut `partiel`/`cloture`, renvoie `avoir_applique` + `net`. Nouveaux helpers `updateCredit`, `getCreditsEnCoursForClient` (`src/queries.ts`). Vérifié : avoir 1000 € → offre 700 € acceptée ⇒ solde 300 € `partiel`, net 0.
- **Documents d'analyse DT en GED (vrai upload, plus un lien)** : le champ « Pièces jointes complémentaires pour l'offre » de `/be/analyse` devient un **upload de fichier** vers la GED, catégorie **`analyse_dt`** (whitelistée), rattaché à la DT (`nomenclature_id = id de la DT`, chemin `DT-…/analyse_dt/…` dans le bucket `ged`). Liste / ouverture (`/api/ged/file/:id`) / suppression depuis le formulaire. Vérifié e2e (upload → liste → suppression).
- Fichiers : `src/index.tsx` (accepter offre, whitelist GED, upload UI `/be/analyse`), `src/commercial.tsx` (offre : avoir/net), `src/queries.ts` (credits), `src/types.ts` (`Document.categorie += 'analyse_dt'`). Migration DB : non.
- Doc mise à jour : `technique/06-modules/be.md`, `technique/06-modules/commercial.md`, `technique/03-base-de-donnees.md`, `manuel/formulaires/be.md`.

## 2026-07-15 — /be/analyse : listes réelles reliées à la base, faisabilité sous les process, stock à 0
- **Vraies listes déroulantes** (options choisissables, plus de placeholder « A / B / C ») pour **Priorité**, **Type demande**, **Faisabilité** et **Décision BE**. Valeurs **persistées à la sauvegarde** : `priorite` → colonne `priorite` (valeurs `normal/urgent/critique`) ; **Décision « Non faisable »** → `statut='refus'` (sinon `dans_offres`) ; faisabilité/type_demande/décision/commentaire/pièces jointes/date → **élément tagué `__analyse_be__:` dans `cahier_charges` (text[])**, en préservant les lignes existantes (faute de colonne dédiée — un `analyse_be` jsonb serait plus propre mais nécessite le PAT).
- **Champ « Risques techniques » supprimé** : les risques/réserves se notent dans la case **Commentaires** (sous la faisabilité).
- **Réorganisation** : la section **Analyse de faisabilité technique** passe **sous les process** (après la synthèse) ; le champ **GED** devient « Pièces jointes complémentaires à joindre pour l'offre de prix ».
- **Stock remis à 0** : `stock_actuel=0` sur les **330 lignes** de `stock` (111 étaient non nulles). Les seuils sont inchangés ; le stock se remplira via les BL fournisseurs.
- **Auto-création stock** : toute **nouvelle référence matière** (catalogue `produits_fournisseurs` categorie *matiere*, ou matière de nomenclature) crée une **entrée stock vide** (`stock_actuel=0`) si absente — hook idempotent `ensureStockRowsForMatiere`/`ensureStockRowForRef` (`src/queries.ts`), best-effort, jusqu'à réception d'un BL fournisseur.
- Fichiers : `src/index.tsx` (route `/be/analyse`, endpoint `/api/dt/:id/analyse`), `src/queries.ts` (hooks stock). Migration DB : non (opération data : stock=0). Vérifié en navigateur + round-trip DB (sauvegarde→relecture→restauration) sur DT-2026-0001.
- Doc mise à jour : `technique/06-modules/be.md`, `technique/03-base-de-donnees.md`, `manuel/formulaires/be.md`, `manuel/be.md`. Captures à refaire : non (tab inchangé).

## 2026-07-15 — Refonte du formulaire d'analyse DT `/be/analyse` (6 évolutions)
- **Analyste BE** : le champ devient un `<select>` peuplé des salariés ayant le rôle **`bei`** ou `direction` (peuplé côté serveur, comme `/be/service`).
- **Matière & accessoires → stock** : déversés de la nomenclature ; nouveau tableau **Couverture** = `besoin (quantité_par_pièce × qté commande)` vs **stock restant** (`stock_actuel`) vs **seuil** (`point_commande`|`stock_mini`), avec statut ok/sous_seuil/insuffisant/rupture/hors_stock.
- **Exigences normatives** : alignées **exactement** sur la DT (`ISO 9001, EN 9100, REACH, RoHS, EN 13485`), cochées d'après la pièce.
- **Gamme opératoire** : mêmes lignes/colonnes que la nomenclature ; étapes de la nomenclature **verrouillées** (non déplaçables) ; **ajout d'étapes glissables/insérables** entre elles (persistées en `etapes_libres.apres`).
- **N° pièce client → N° plan client** : triplet lié réf interne ↔ réf pièce client ↔ n° plan client (auto-lookup `/api/references-clients`), plan **ouvrable** via GED (`/api/ged/file/:id`) s'il a été chargé.
- **Bouton « Visualiser »** (icône œil de la liste Analyse DT) : désormais **lecture seule** (CRU + décomposition par pièce). La génération BDT/BDS et l'éditeur d'étapes libres sont **retirés de cette liste** (BDT/BDS générés à la validation de la commande, visibles en production).
- API `GET /api/be/analyse-dt/:id` enrichie : `fournitures_stock`, `etapes[].{reglage_min,mo_min,machine_min,cout_pc,cout_reglage}`, `plan_doc_id`, `taux_machine`. Vérifié en navigateur sur DT-2026-0001 réelle (proxy worker AUTH_ENFORCE=off).
- **Durcissement (revue adversariale)** : échappement `<`→`<` de l'injection `window.__DT_FOR_ANALYSIS__` (anti-XSS stocké via champs DT) ; l'API renvoie `etapes_libres` aussi pour les pièces **sans nomenclature** (plus de perte des étapes ajoutées) ; round-trip **sans perte** des étapes ajoutées (poste + réglage/MO/machine conservés) ; le coût des étapes ajoutées est un **addend séparé** (ne réécrit plus le champ MO saisi) ; `apres` borné (l'étape ne disparaît plus si la gamme raccourcit) ; sélection Analyste vide n'écrase plus l'analyste existant ; défaut taux MO et repli `temps_unitaire_min` alignés sur `computeNomCostForQty`.
- Fichiers : `src/index.tsx` (route `/be/analyse` + API `analyse-dt` + endpoint `etapes-libres`), `src/be.tsx` (aperçu lecture seule) · Migration DB : non.
- Doc mise à jour : `technique/06-modules/be.md`, `technique/07-api-reference.md` (régénérée), `manuel/be.md`, `manuel/formulaires/be.md` · Captures à refaire : `be-analyse.png` (oui).

## 2026-07-04 — Parcours guidés illustrés (avant → remplir → ensuite)
- Nouveau : `docs/manuel/parcours/` — **14 parcours (75 étapes)** ordonnés dans le sens du flux (01-Commercial → 14-Plans). Chaque étape : ⬅️ ce qui précède, 📝 l'écran avec le **formulaire ouvert** et ses cases expliquées en contexte, ➡️ où part le travail.
- **29 nouvelles captures de formulaires OUVERTS** (`docs/assets/form-*.png`) prises via `scripts_doc/capture_forms.mjs` (nouveau, réutilisable : serveur local + AUTH_ENFORCE=off + Playwright, ouvre chaque modale par sa fonction/son bouton).
- Renvois croisés : manuel ↔ parcours ↔ guides de formulaires. Inclus au recueil imprimable.

## 2026-07-04 — Guides des formulaires « champ par champ »
- Nouveau : `docs/manuel/formulaires/` — **128 formulaires, 825 champs** documentés, chaque case expliquée pour un utilisateur final (à quoi ça sert, obligatoire ou non, options, exemple, astuce/attention).
- Extrait des **champs réels du code** (un agent par service) puis relu champ par champ (anti-invention).
- Renvois ajoutés depuis chaque chapitre du manuel et chaque fiche de poste (`scripts_doc/link_formulaires.mjs`, idempotent).
- Inclus dans le recueil imprimable ManuelUtilisateur. Maintenance : skill `erp-doc-sync` (ligne « Champ de formulaire »).

## 2026-07-15 — Fix : l'ancien formulaire d'analyse DT déverse enfin les données
- Deux surfaces d'analyse : le **formulaire riche** `/be/analyse` (bouton « Analyser ») **conservé** (préféré par l'utilisateur), et l'**aperçu rapide inline** (icône œil, `beOuvrirAnalyseDT`).
- **Cause racine** : la fonction `prefillFromDT()` du formulaire **n'était appelée qu'une fois** mais ne déversait **que réf/qté** de la DT — jamais la nomenclature. Enrichie : elle **fetch `/api/be/analyse-dt/:id`** et remplit la **gamme opératoire** (étapes), le **CRU** (matière/MO/ST ramenés à la pièce) et **coche les standards** correspondant aux exigences de normes.
- **Bug double-bloc** corrigé (`prefillFromDT` appelée 2× → 2 blocs par pièce) via garde-fou d'idempotence. Vérifié en navigateur (Playwright) sur la DT-2026-0001 réelle.

## 2026-07-15 — Analyse DT : « Étapes de production » éditable + étapes libres
- Section « Aperçu process » renommée **« Étapes de production »** : la gamme de la nomenclature se déverse (fixe) et on peut **insérer des étapes libres** (contrôle dim./qualité) **entre** les process existants (⭡⭣, non déplaçables eux-mêmes).
- Étape libre : nom + type + **temps optionnel** + **prix forfait** → coût = `forfait + (temps/60 × quantité × taux MO)`, **auto-calculé** et ajouté au **total série** (live client + persisté serveur). Pas de BDT pour l'instant (chiffrage seul).
- Persistance : `POST /api/be/analyse-dt/:id/etapes-libres` → `pieces_detail[piece].etapes_libres` ; l'analyse GET les renvoie + inclut leur coût. Vérifié e2e (forfait 50 + 6 min ×10 ×30 = 80 €).

## 2026-07-15 — Analyse DT : déversement des brouillons + exigences + « visible mais non validable »
- `/api/be/analyse-dt` déverse la nomenclature **validée sinon le brouillon** (coût série × quantité DT, gamme) + remonte les **exigences de normes de chaque pièce** (`pieces_detail.exigences`) ; renvoie `nom_statut` / `drafts` / `allValidated`.
- Client : badge **« brouillon »**, puces **exigences** par pièce, ligne « pièce déjà à jour », bandeau 3 états, et bouton **« Générer les BDT/BDS » désactivé** tant que tout n'est pas validé (analyse **visible mais non validable**).
- Garde-fou serveur : `generer-bdt` → **409** tant qu'une pièce n'a pas de nomenclature validée. Vérifié e2e.

## 2026-07-15 — BE : accessoires, brouillons, analyste, édition fournisseur + verrou d'édition & temps réel
- **Accessoires** (nomenclature) branchés sur `produits_fournisseurs` (au lieu du catalogue JSON de la fiche fournisseur, vide) + sélection **« réf d'abord → fournisseurs qui l'ont »** (miroir de la matière). Corrige « les accessoires ne fonctionnent pas ».
- **Brouillons** de nomenclature : nouveau sous-onglet **« Brouillons à traiter »** ; un brouillon **n'apparaît plus** dans Standards/Mères tant qu'il n'est pas **validé**.
- **Analyste** : le champ « Nom analyste » devient une **liste déroulante des utilisateurs BE** (rôles `bei`/`direction`) — fini « Joël/David » en dur.
- **Fiche fournisseur** : bouton **Éditer** sur les « Références fournies » (route `PUT` partielle : ne réécrit que les champs fournis, ne remet pas l'activité à « both »).
- **Verrou d'édition généralisé** (`edit_locks` + API `/api/locks/*` + helper client réutilisable `ErpLock`) : ouvrir une **nomenclature** ou une **DT** déjà ouverte par quelqu'un → **bloqué « en cours d'édition par X »** ; battement 15 s, libération auto, reprise si périmé (>60 s). Extensible à tout éditeur en 1 ligne.
- **Temps réel (polling ~7 s)** : la liste des nomenclatures se rafraîchit **seule** quand elle change — jamais pendant une édition.
- Fichiers : `src/be.tsx`, `src/index.tsx`, `src/queries.ts`, `src/auth.ts`, `src/shared.ts`, `src/commercial.tsx`, `src/fournisseur_fiche.tsx`. DB : `scripts_import/edit_locks_schema.sql` (à lancer). Vérifié : tsc + build + harnais 57 PASS + e2e (accessoire, PUT partiel, verrou A/B, signature).

## 2026-07-15 — BE › Références : édition en place des références
- Bouton **« Éditer »** sur chaque ligne du catalogue → rouvre le formulaire « Entrée catalogue » **pré-rempli** (fournisseur, réf, désignation, catégorie, activité) → **PUT** `/api/produits-fournisseurs/:id`. Le **prix n'est jamais écrasé** par une édition de métadonnées (touché seulement si un prix positif est saisi ; sinon piloté par les RFQ).
- Correctif d'échappement : `refEsc` n'échappait pas l'apostrophe → nouvel helper `refJs` (chaîne JS dans un `onclick`) appliqué aux boutons « Éditer » **et** « Demande de prix » (une désignation « Vis d'assemblage » cassait le `onclick` ; non détecté par le harnais qui ne teste pas les attributs `onclick` → contrôle ciblé + test de round-trip).
- Vérifié : tsc + build + harnais 57 PASS + e2e (édition, prix préservé). Fichiers : `src/be.tsx`, `src/index.tsx`.

## 2026-07-13 — Prix : purge + fraîcheur 6 mois + « Demande de prix » partout
- **Purge** : les 71 prix du catalogue (`produits_fournisseurs.prix`) effacés (non datables) → statut « en attente de prix ». Entrées réf/désignation/fournisseur **conservées** ; **historique** (`ref_prix_historique`) conservé. Le catalogue JSON des fiches fournisseurs était déjà vide.
- **Seuil de fraîcheur** matière porté de **3 → 6 mois** (`nomPrixFrais`, be.tsx). Prix absent ou daté de plus de 6 mois ⇒ « Demande de prix ».
- **Bouton « Demande de prix » aux 3 endroits** demandés : nomenclature (matière/accessoire sans prix frais — existant), **Analyse DT** (existant), et **NOUVEAU** dans la liste catalogue **BE › Références** (ligne au prix absent/périmé → modale pré-remplie).
- **RFQ** : `demandeur` = **utilisateur de session** (`resolveSigner`, anti-usurpation EN9100, plus « BE » en dur) ; **liée à l'affaire** (`dt_ref`) **ou libre** ; **plusieurs fournisseurs + un prix chacun** (UI Achats existante). À la **validation**, le prix retenu se propage au **catalogue + historique** (`source=rfq`, daté du jour) → **visible partout** (nomenclature/DT/catalogue relisent en direct).
- Vérifié e2e : création liée/libre, 2 réponses fournisseurs, validation du moins cher, propagation (prix frais < 6 mois). tsc + build + harnais 57 PASS.
- Fichiers : `src/be.tsx`, `src/index.tsx`. Donnée : purge `produits_fournisseurs.prix` (71).

## 2026-07-08 — Répertoire : anti-doublon (ajout manuel puis DT du même client)
- `upsertReferenceClient` ne pré-filtre plus par `client_id` en base : il charge toutes les lignes de la réf puis matche en mémoire. Une ligne saisie **manuellement** (sans `client_id`) est désormais **fusionnée/promue** quand une **DT** du même client arrive (même `ref_client` ou même nom), au lieu de créer un doublon. Un autre client → nouvelle ligne (pas de fusion abusive).
- Corrige le symptôme « le plan a disparu » (plan présent sur une ligne, `none` sur la ligne parallèle). Vérifié e2e (manuel→DT = 1 ligne, `client_id` promu, plan conservé ; autre client = 2 lignes).

## 2026-07-08 — Répertoire : colonne Plan « none » + plan qui s'actualise sans s'effacer
- Colonne **Plan** (bloc « Clients & réfs » nomenclature + « Produits commandés » fiche client) : affiche **`none`** (au lieu de `—`) quand aucun plan n'est chargé, tant qu'il n'est pas ajouté.
- `upsertReferenceClient` corrigé : ne met à jour que les champs **non vides** → le plan **s'actualise** dès qu'il est renseigné (DT re-sauvée avec un plan) et n'est **jamais effacé** par une DT re-sauvée sans plan. Vérifié e2e (créé sans plan → « none » ; plan ajouté → s'affiche ; re-save vide → conservé ; 1 seule ligne).
- Fichiers : `src/be.tsx`, `src/commercial.tsx`, `src/queries.ts`.

## 2026-07-07 — Nomenclature : nettoyage seeding DT + brouillon unique
- `nomNewFromDT` ne déverse plus **réf client / quantité** dans la **description** (la description = BE) ; réf client → bloc « Clients & réfs », quantité → reste dans la DT (réapparaît à l'Analyse DT, jamais dans la nomenclature).
- **Unicité** : `POST /api/nomenclature` — une réf (`code_ref_produit`) à un indice donné (par entité) n'existe qu'une fois. Brouillon existant de même réf+indice → **écrasé** (reste brouillon, `updated:true`) ; validé existant → 409 (créer une révision). Vérifié e2e (2 saves = 1 ligne).

## 2026-07-07 — Répertoire références clients (réf interne ↔ client ↔ réf client ↔ plan)
- Nouvelle table `references_clients` (`scripts_import/references_clients_schema.sql`) — le quadruplet toujours lié.
- **DT** : auto-recherche **bidirectionnelle** (saisir la réf client → remplit réf interne + plan ; saisir la réf interne → remplit la réf client) ; chaque DT validée **alimente** le répertoire.
- **Nomenclature** : bloc « Clients & réfs de cette pièce » (liste des clients qui la commandent, réf client + plan ouvrable, ajout manuel).
- **Fiche client** : section « Produits commandés » (réf interne · réf client · plan ouvrable).
- Endpoints `GET/POST/DELETE /api/references-clients` (RBAC famille `be`). Plan ouvrable via GED.
- Fichiers : `queries.ts`, `index.tsx`, `commercial.tsx`, `be.tsx`, `auth.ts`. Vérifié e2e (CRUD, lookup 2 sens, validation DT→répertoire, fiche client).

## 2026-07-07 — Correctifs flux DT → Analyse / Nomenclatures (BE)
- **N° DT « -Infinity »** : `Math.max(...[])` côté client (commercial.tsx) sur liste de DT vide → `DT-2026--Infinity`. Garde-fou client (filtre finis, fallback 0) **+ serveur rendu autoritaire** (`/api/dt` POST : rejette un num/id client invalide, recalcule le sien).
- **Re-routage type DT** : changer une DT déjà validée de « Maj produit » → « Nouveau produit » ne la faisait pas basculer d'« Analyse DT » vers « Nomenclatures à faire ». Le PUT `/api/dt/:id` **recalcule le statut** (même règle que `/valider`) quand le type ou les pièces changent sur une DT en file BE.
- Quantité pièce (ex. 4260) : bien conservée dans `pieces_detail` tout au long du flux (vérifié).
- Donnée corrigée : la DT PROMISTEL cassée renumérotée `DT-2026-0001` + remise en `en_attente_nomenclature`.
- Vérifié e2e : création (num valide malgré client pourri), validation, PUT (re-route + qté conservée).

## 2026-07-04 — Durcissement sécurité (2ᵉ passe, résiduels d'audit)
- **R1** signataire self-service fiable (`resolveSigner` : PIN vérifié ou utilisateur de session, plus de texte libre) sur pv/cote/non-conformites.
- **R2** dashboards & `/finances/*` gatés par rôle (`DASHBOARD_SERVICE`).
- **R3** anti-abus `/api/contact` (throttle IP + honeypot + plafonds).
- **R4** `bl-partiel` : BL créé en premier + erreurs vérifiées → `warnings[]` (fini les échecs avalés).
- **R5** échappement du nom dans une notification du planning.
- **Outillage** : `scripts_doc/harness_routes.mjs` couvre les pages inline d'`index.tsx` (20 routes). Détail : `docs/technique/09-audit.md` (15/16 défauts corrigés).
- Fichiers : `src/auth.ts`, `src/index.tsx`, `src/planning_bdt_bds.tsx`.

## 2026-07-04 — Documentation, skills & audit de sécurité
- **Documentation complète** créée dans `docs/` : technique (prestataire), manuel utilisateur (33 captures réelles), fiches de poste (par rôle), recueils imprimables.
- **6 skills projet** (`.claude/skills/`) : erp-verify, erp-db, erp-deploy, erp-new-module, erp-doc-sync, erp-screenshots + `CLAUDE.md` racine.
- **Outillage** `scripts_doc/` : harnais toutes-pages, générateurs (API, tables, modules, manuel, fiches), captures Playwright, lint, export imprimable.
- **Audit de code** (revue adversariale, 16 défauts confirmés) → **10 corrigés** : RBAC « ouvert par défaut » fermé (fail-closed + familles mappées), quarantaine gatée, idempotence `traiter-retour` (409), facture non négative, script mort `/production/habilitations`, XSS stockés (qualité/plans/planning), export FEC & écritures métier gatés. Détail : `docs/technique/09-audit.md`.
- Fichiers : `src/auth.ts`, `src/index.tsx`, `src/qualite.tsx`, `src/plans.tsx`, `src/planning_bdt_bds.tsx`, `src/commercial.tsx`. Migration DB : non.

## 2026-07-03 — Retours clients → Avoirs & Commandes prioritaires
- Flux NC client → « Traiter le retour » → **avoir** (AV-AAAA-XX, prix de vente) ou **commande prioritaire** (CMDP-AAAA-XX, coût de revient) → « Lancer la production » → LOTP + BDTP/BDSP encadrés rouge au planning.
- Onglet Commercial « Avoirs & Commandes P » (2 sous-onglets). Migration DB : oui (`non_conformites`, `credits`, table `commandes_prioritaires`, drapeaux `prioritaire`).
- Fichiers : `src/qualite.tsx`, `src/commercial.tsx`, `src/index.tsx`, `src/queries.ts`, `src/planning_bdt_bds.tsx`.

## 2026-07-03 — Plan / Bâtiment (maquette BIM)
- Zones rectangulaires + objets rangés par zone ; interop ATEX/VGP avec Sécurité ; couleurs d'état live ; deep-links ; auto-placement. Fichier : `src/plans.tsx`.

## 2026-07-03 — Planning production
- Bouton « Agrandir le planning » (rétracte les panneaux du bas). Fichier : `src/planning_bdt_bds.tsx`.

---
> Antérieur à ce journal : voir l'historique git (`git log`).
