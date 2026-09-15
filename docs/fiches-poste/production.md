# Fiche de poste — Programmation production

> Rôle ERP : `production`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Planifier la fabrication et suivre l'avancement des BDT/BDS.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | production |
| **Lecture** | be, achats, oas, qualité, sécurité, expéditions, stock, maintenance |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Affecter un BDT à un opérateur
1. **/production/service** → onglet **Planning Gantt BDT** (planning unique).
2. Glisser une carte de « **BDT à classer** » (au-dessus du planning) sur le poste, ou sur la sous-case **Matin / Journée / Après-midi / Soirée** de l'opérateur. Le chemin critique s'applique à la pose : l'étape suivante d'un lot ne démarre qu'après le réglage de la précédente (calée le même jour, refusée un jour avant).
3. Un clic sur un BDT n'affiche que **son poste + l'étape d'avant et d'après** ; « Tout afficher » lève le focus.
4. Les BDT prioritaires (BDTP) sont encadrés en rouge.

![production-service](../assets/production-service.png)

### 2. Recevoir et solder un BDT
1. **Recevoir** (double-clic sur la barre, matricule + PIN) : un opérateur ou vous-même (écriture Production). Celui qui reçoit devient le réalisateur du bon (« Reçu par ») : c'est son coût horaire qui compte.
2. **Solder** (clic droit → « Solder le BDT ») : l'opérateur qui a reçu le bon, ou vous — vous pouvez solder le bon reçu par un opérateur (le PV d'autocontrôle note « reçu par X, soldé par Y »).
3. La matrice de compétences ne bloque plus : une notification orange invite seulement à la mettre à jour (RH › Compétences).

![form-production-soldage](../assets/form-production-soldage.png)

### 3. Faire une demande d'achat depuis l'atelier
1. Bandeau du service → **Demande d'achat** : le formulaire complet s'ouvre tout de suite.
2. Matricule + PIN, nature (Matière / Accessoire / Machine (OPEX) avec la machine), article, quantité et unité, puis affaire, poste, priorité, livraison souhaitée, fournisseur suggéré.
3. **Envoyer aux Achats** → la DA arrive à votre nom « (Production) ». Un opérateur sans écriture Production ne peut plus en faire : il vous la fait saisir.

![form-production-da](../assets/form-production-da.png)

### 4. Émettre un PV de non-conformité
1. Bandeau du service → bouton rouge **PV de non-conformité** (juste à côté de la demande d'achat).
2. Matricule + PIN ; constat (date, type, **entité**, gravité) ; rattachement facultatif (affaire, puis lot et BDT de cette affaire) ; défaut (**description**, nature, cause, action immédiate, traitement) ; case quarantaine si besoin.
3. **Émettre le PV** → la NC part dans Qualité › Non-Conformités (catégorie Production, à votre nom). Critique / Bloquante sur une affaire = expédition bloquée.

![form-production-pvnc](../assets/form-production-pvnc.png)

### 5. Suivre les commandes à faire
1. Onglet **Commandes & Lots** : commandes → lots → BDT.

![production-service](../assets/production-service.png)

### 6. Programmer la présence et traiter les congés des opérateurs
1. Onglet **Présence opérateurs** : clic sur une case → menu **Matin / Journée / Après-midi / Soirée / Absent / Effacer** (un choix = un enregistrement ; en cas d’échec la case revient à sa valeur).
2. « **Programmer la semaine** » pour appliquer un créneau à plusieurs opérateurs ; le message compte les échecs. Une semaine pas encore lue est verrouillée.
3. Vue « Demandes de congés à traiter » : **Approuver** ou refuser les congés des **opérateurs** (absences posées, BDT renvoyés au pool, solde décompté) — jamais votre propre congé.

![production-presence](../assets/production-presence.png)

### 7. Découper un BDT ou annuler une découpe
1. Goulotte « BDT à classer » → **ciseaux** : seule la **réalisation** se découpe, le réglage reste sur le morceau 1.
2. Sur la carte d’un morceau : **Annuler la découpe** (tant qu’aucun morceau n’est posé, reçu ou soldé) → le BDT d’origine retrouve sa durée.

![form-production-separer](../assets/form-production-separer.png)

### 8. Saisir le taux horaire machine d'un process
1. Onglet **Process Ateliers** → volet **Postes & Process** → déplier le poste : chaque process affiche « X €/h », « taux à saisir » ou « coût RH ».
2. Crayon du process → **Type** (Machine / Manuel / OAS) → **Taux horaire machine (€/h HT)** → Enregistrer. Vide = « taux à saisir » (temps machine compté 0 €).
3. Seul le process machine porte un taux : ni la machine ni le poste. Le temps homme est valorisé au coût chargé RH (fiche salarié). Taux de départ = ancien coût de la machine, souvent 35 €/h : à vérifier.

![form-production-process-edit](../assets/form-production-process-edit.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
