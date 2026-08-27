# Plan — Rendre le module Environnement EXHAUSTIF (SME ISO 14001) + carte d'interopérabilité ERP

> Source d'exigences : présentation « Cube — Prévenir les risques environnementaux » (cas Food&Go, 40 diapos) — un référentiel complet de Système de Management Environnemental ISO 14001:2015. Ce document croise ses 14 outils avec l'ERP actuel, propose un plan d'exhaustivité par lots, et cartographie **tous** les paramètres de l'ERP à rendre interopérables avec l'Environnement.
> Établi le 2026-08-05. Cartographie du code par workflow d'exploration (6 lecteurs). Aucune ligne de code encore écrite — c'est un plan.

---

## 0. Point de départ — ce que l'ERP a DÉJÀ

Le module **Environnement** (`src/environnement.tsx`, page SSR autonome servie par `/environnement/service`) est une page à **7 onglets** qui réutilise entièrement l'API `/api/securite/*` (moteur générique `hseCrud`) et les tables `hse_*` :

| Onglet | Table | Couvre |
|---|---|---|
| Déchets | `hse_dechets` | registre BSDD/Trackdéchets (date, code, dangereux, quantité, filière, transporteur, exutoire) |
| Rejets & mesures | `hse_mesures_env` | autosurveillance eau/air/bruit/énergie vs VLE + lecture des relevés OAS |
| ATEX | `hse_atex_zones` | zonage 0/1/2/20/21/22 + DRPCE PDF |
| Aspects & impacts | `hse_aspects_impacts` | analyse environnementale ISO 14001 §6.1.2, cotation, AES significatif |
| RSE | `hse_rse_indicateurs` | indicateurs social/environnement/gouvernance vs cible |
| Conformité env. | `hse_conformite` | matrice réglementaire filtrée (ICPE/ISO14001/RSE/ISO26000/ATEX) |
| Tableau de bord | (agrégat) | 8 KPI instantanés + risque chimique env (SEIRICH) |

**Verdict** : le squelette du SME est là (aspects/impacts, déchets, rejets, ATEX, conformité, RSE), mais en version **« saisie manuelle »** et **incomplet sur les outils réglementaires structurants** de la présentation. Rien n'est branché automatiquement sur les données déjà présentes ailleurs dans l'ERP.

---

## 1. Diagnostic — les 14 outils de la présentation × état de l'ERP

Légende : 🟢 présent · 🟡 partiel · 🔴 absent

| # | Outil (présentation) | État | Ce qui manque concrètement |
|---|---|---|---|
| 1 | **Contexte & parties intéressées** (cotation Influence×Maîtrise) | 🔴 | Aucun onglet/table. §4.1 enjeux et §4.2 parties intéressées non modélisés. |
| 2 | **Veille réglementaire** (registre vivant + indicateur État×Thème) | 🟡 | `hse_conformite` = matrice statique (checklist DREAL). Pas de source/date de parution, pas de suivi des évolutions, pas d'alerte « texte nouveau », pas de graphique État×Thème. |
| 3 | **Classement ICPE / Seveso** (rubriques 41xx/45xx, seuils bas/haut) | 🔴 | Cité en prose (rubrique 2565, GEREP). Aucune table de rubriques, aucun régime D/E/A, aucun calcul Seveso agrégeant les quantités chimiques. |
| 4 | **Classification des déchets** (code EU 6 chiffres, DD/DND, BSD, Trackdéchets, filière R/D) | 🟡 | `code_dechet`/`filiere` en **texte libre**. Pas de nomenclature 2014/955/UE, pas de codes R1-R13/D1-D15, pas de cycle du bordereau (émis→pris en charge→reçu→traité), pas de registre chronologique exportable. |
| 5-6 | **Plans d'action** (NC réglementaires + déchets) | 🟡 | Actions noyées dans le champ `action` des aspects. Pas d'onglet plan d'actions dédié avec responsable/délai/livrable/échéance/fréquence/priorité. |
| 7 | **REX** (retour d'expérience / incidents) | 🔴 | Pas de registre d'incidents environnementaux ni de REX. |
| 8 | **Analyse environnementale** (cycle de vie + aspects/impacts) | 🟡 | Aspects/impacts OK (§6.1.2), mais **perspective cycle de vie absente** (amont/exploitation/aval, fin de vie). |
| 9 | **AES** (cotation F×P×G×S×maîtrise T/H/O) | 🟡 | Criticité = **gravité×fréquence seulement** ; la maîtrise est saisie mais **jamais intégrée** au score ; pas d'axe Probabilité ni Sensibilité du milieu ; seuil AES figé en dur (≥9). |
| 10 | **Diagnostic ISO 14001** (grille chapitres 4→10, niveau 1-4) | 🔴 | Absent du module. Le référentiel `ISO14001` (31 clauses) existe et un audit « thème J » existe côté Qualité, mais **aucun autodiagnostic/score de maturité** ni sonde env. |
| 11-12 | **Bilan énergétique / GES** + TB énergétique | 🔴 | Aucun bilan carbone/BEGES. Pas de scopes 1/2/3, pas de facteurs d'émission, pas de tCO₂e, pas de suivi énergétique structuré. |
| 13 | **Tableau de bord** ICPE/déchets/env (KPI + objectifs) | 🟡 | Comptage instantané **sans cibles** (`kpi_objectifs` non câblé), **sans graphiques de tendance** (Chart.js absent ici), sans historisation N/N-1. |
| 14 | **RSE** (stratégie + bilan + check-list pilotage ISO 26000) | 🟡 | Indicateurs plats saisis à la main. Pas d'autodiagnostic ISO 26000 (7 questions centrales), pas de score de maturité, aucun indicateur injecté automatiquement. |

**Bonus manquants hors liste** (exigés par ISO 14001) : politique environnementale documentée (§5.2), objectifs & programme dédiés (§6.2), préparation/réponse aux situations d'urgence (§8.2), revue de direction environnementale (§9.3).

---

## 2. Le plan — par LOTS livrables

Le style projet = « lots » avec fail-soft, SQL DDL versionné (PAT requis), harnais 61/0. Six lots, du fondamental au complet.

### Lot A — Référentiels (fondations, `src/qref.ts`, zéro donnée métier)
Tables de correspondance canoniques, saisies une fois :
- **`CODE_DECHETS_EU`** — nomenclature 2014/955/UE, sous-ensemble pertinent usinage + traitement de surface : `11 01 xx` (traitement de surface, boues d'hydroxydes `11 01 09*`), `12 01 xx` (limaille/copeaux/émulsions), `13 xx xx*` (huiles), `14 06 03*` (solvants), `15 01 xx` (emballages, `15 01 10*` souillés), `16 xx`, `08 01 11*` (peintures). L'astérisque ⇒ **dangereux auto**.
- **`FILIERES_RD`** — opérations R1-R13 (valorisation) / D1-D15 (élimination).
- **`RUBRIQUES_ICPE`** — 2560 (travail des métaux), 2565 (revêtement/traitement de surface), 1185 (fluides frigorigènes), 4xxx (Seveso), avec régime D/E/A et seuils.
- **`SEUILS_SEVESO`** — rubriques 4xxx, seuils bas/haut (santé 41xx, physique 43-47xx, environnement 45xx) façon présentation.
- **`FACTEURS_EMISSION_GES`** — Base Carbone ADEME : kgCO₂e par kWh élec (~0,046), L gazole (~2,5), L GPL, kg déchet, m³ eau, t.km transport.
- **`MILIEUX_ENV`** — eau/air/sol/déchet/énergie/bruit/biodiversité/ressource (structurer ce qui est aujourd'hui du texte libre).
- **`ISO14001_DIAGNOSTIC`** — questions clés par chapitre 4→10 (barème 1-4 : inexistant/partiel/améliorable/conforme).
- **`ISO26000_QC`** — 7 questions centrales.
- **`AES_GRILLE`** — barèmes F/P/G/S/maîtrise (T/H/O) en 1/3/5/7, seuil de significativité paramétrable.

### Lot B — Compléter les outils PARTIELS
- **B1 · Classification déchets** : `code_dechet` → **select** sur `CODE_DECHETS_EU` (coche « dangereux » auto si `*`), `filiere` → select R/D, ajout du **cycle BSD** (statut émis/pris en charge/reçu/traité) + **registre chronologique PDF** exportable. Pré-remplissage possible depuis un produit chimique (mentions H4xx → dangereux).
- **B2 · AES multi-axes** : migrer `hse_aspects_impacts` (+`probabilite`, +`sensibilite`, décomposer `maitrise` en T/H/O) ; criticité = **F×P×G×S × (maîtrise)** au lieu de G×F ; seuil AES paramétrable (aujourd'hui figé ≥9).
- **B3 · Veille réglementaire** : enrichir `hse_conformite` (+`source`, +`date_parution`, +`type_texte`, +`plan_mise_conformite`, +`nouveaute`) et ajouter l'**indicateur graphique État×Thème** (barres groupées Chart.js, exactement la diapo « Indicateur de la veille »).
- **B4 · Tableau de bord env** : **brancher sur le moteur canonique** (`kpi.ts` → `environnement(d)` + `dashboards.tsx` → `dashEnvironnement` + codes `kpi_objectifs` + route `/dashboard/environnement`) avec jauges/donut/lignes + **objectifs colorés**, façon présentation (déchets DD/DND, taux conformité, incidents, BSD, tri déchets mensuel).

### Lot C — Nouveaux outils ABSENTS
- **C1 · Parties intéressées & contexte** (§4.1/4.2) : table `hse_parties_interessees` (partie, type, attentes, cotation **I×M**, exigence retenue, mode de réponse) + enjeux internes/externes.
- **C2 · Classement ICPE / Seveso** : table `hse_icpe_rubriques` + **moteur qref** agrégeant les quantités de `hse_produits_chimiques` par rubrique 4xxx → ratio seuil bas/haut → statut Seveso. Onglet dédié.
- **C3 · Bilan GES / énergétique** : table `hse_bilan_energie` (équipement, énergie, quantité, kWh/an, facteur, CO₂, scope 1/2/3) + moteur BEGES + **TB énergétique** + préconisations.
- **C4 · Diagnostic ISO 14001** : autodiagnostic clause par clause (grille niveau actuel/cible 1-4, score de maturité) **+ sonde environnementale** dans `getAuditAutoStatus` pour rendre le thème J auto-observable comme les thèmes qualité/SST.
- **C5 · Pilotage SME** : plan d'actions env dédié + **REX/incidents** + situations d'urgence (§8.2) + politique environnementale (§5.2) + objectifs/programme (§6.2) + revue de direction (§9.3).
- **C6 · Cycle de vie** (§6.1.2) : onglet perspective cycle de vie (7 étapes : acquisition MP → conception → transport amont → réalisation/stockage → transport aval → utilisation → fin de vie, avec maîtrise/influence/intégrer à l'AE).

### Lot D — Interopérabilité (le câblage → détaillé en §3)
Connecter automatiquement les données déjà présentes ailleurs dans l'ERP. C'est la seconde demande, traitée exhaustivement ci-dessous.

---

## 3. Carte d'interopérabilité — TOUS les paramètres ERP à connecter à l'Environnement

Constat central : **un seul flux est réellement ponté aujourd'hui** — l'eau (relevés OAS → `hse_mesures_env`). Tout le reste est de la donnée existante non branchée. Regroupé par **cible environnementale**.

Légende état : 🟢 câblé · 🟡 partiel/données prêtes · 🔴 absent

### 3.1 → Registre des déchets (`hse_dechets`)
| Source ERP | État | Câblage à faire |
|---|---|---|
| **OAS — vidange de bain usé / boues d'hydroxydes** (Surtec 650) | 🔴 | À la vidange, `createHseDechet({dangereux:true, code:'11 01 09*', designation:'Bain OAS usé', quantité, zone:'OAS'})` — même patron fail-soft que le pont eau OAS. |
| **Chutes/copeaux métalliques** (`mouvements_stock` sortie matière, ratio brut−pièce) | 🔴 | Agréger le ratio de chute → `createHseDechet(dangereux:false, '12 01 01 limaille/copeaux', filière valorisation)` → nourrit le KPI « déchets valorisés ». |
| **Rebut qualité** (NC décision « Rebut », `qref.ts NC_ACTIONS_IMMEDIATES`) | 🔴 | Sur statut « Rebut », créer une ligne déchet (désignation = réf pièce, qté rebutée, code selon matière). |
| **Destruction en quarantaine** (`/api/qualite/quarantaine/:id/statuer` mode rejeté) | 🔴 | Sur décision « destruction », pré-remplir `hse_dechets` (fonction `createHseDechet` déjà disponible). |
| **Périssables expirés** (`produits_perissables.statut='expire'`) | 🔴 | Proposition de création déchet (dangereux si produit chimique lié) + filière d'élimination. |
| **Fonds de bidons / consommables chimiques** (`mouvements_stock` sortie consommable dangereux) | 🔴 | Si l'article est marqué chimique/dangereux → déchet dangereux (contenant vide) + émission COV. |
| **Produit chimique → dérivation** (`hse_produits_chimiques` mentions H) | 🔴 | Pré-remplir `code_dechet`/`dangereux` depuis le CLP (H4xx → déchet dangereux). Zéro lien produit→déchet aujourd'hui. |

### 3.2 → Rejets & mesures / Eau (`hse_mesures_env`)
| Source ERP | État | Câblage |
|---|---|---|
| **OAS relevé eau — volume m³** | 🟢 | Déjà miroir en `conso_eau`. À faire : renseigner l'entité réelle (défaut « Seem »). |
| **OAS relevé eau — pH/turbidité/chlore** | 🟢 | Déjà miroir en `rejet_eau`. |
| **OAS relevé bain — paramètres** (pH, T°, concentration, densité, titrages, conductivité) | 🟢 | Déjà miroir en `rejet_eau`. |
| **VLE (arrêté préfectoral) vs valeur** | 🟡 | `vle` = `null` systématique → brancher le référentiel des seuils pour que le badge conforme/hors-VLE se calcule. |
| **Relevés OAS → mesures_env** (aujourd'hui lecture seule) | 🟡 | Convertir automatiquement le relevé OAS en ligne `hse_mesures_env` (pas seulement affichage indicatif). |

### 3.3 → Bilan énergétique / GES (nouveau, `hse_bilan_energie`)
| Source ERP | État | Câblage |
|---|---|---|
| **Machines** (`machines` : `cnc`, `cout_h`, `capacite_h`) | 🔴 **bloquant** | Ajouter en DDL `type_energie` (électrique/GPL/fioul), `puissance_kw`, `conso_horaire`. Puis heures machine × puissance → kWh → mesure `energie` ; GPL/fioul → facteur GES → `emission_air` (scope 1). Sans ces colonnes, aucun bilan machine calculable. |
| **Factures EDF** (`factures_fournisseur` compte 606300) | 🔴 | Miroir €→(kWh si dispo)→GES scope 2. Idéalement ajouter un champ `kwh` sur la facture. |
| **Achats par compte PCG** (606 énergie, 624 transport…) | 🔴 | `compte_charge` = point d'accroche naturel du **Scope 3** (chaque compte = poste d'émission × facteur monétaire). |
| **Catégorie achat « Transport » + montants** | 🔴 | Assiette Scope 3 transport présente, aucun facteur t.km/CO₂. |
| **Sortie matière** (Σ quantité/an) | 🔴 | Indicateur RSE « conso matières » + GES matière. |

### 3.4 → Classement ICPE / Seveso (nouveau)
| Source ERP | État | Câblage |
|---|---|---|
| **`hse_produits_chimiques`** (quantité + mentions H + zone_stockage) | 🔴 | Moteur qref : mapping H-codes → rubriques 4xxx + **cumul des quantités par rubrique** → ratio seuil bas/haut. Les données d'entrée existent, jamais agrégées. |
| **Zones ATEX** (`hse_atex_zones`) | 🔴 | N'apporte rien au Seveso aujourd'hui (à croiser pour les rubriques inflammables). |

### 3.5 → Diagnostic ISO 14001 / Audit thème J
| Source ERP | État | Câblage |
|---|---|---|
| **Moteur de sondes** `getAuditAutoStatus` (11 sondes) | 🟡 | Ajouter des sondes env : `dechets_dangereux_traces`, `rejets_hors_vle`, `atex_revue_due`, `aes_non_maitrise` — **tous déjà calculés** dans le TB Environnement. Les exposer dans `AU_SONDES`. |
| **Lien env → audit** (carte du dashboard) | 🟡 | Aujourd'hui simple `<a href>`. Remonter les AES significatifs vers le plan d'audit. |
| **DUER `hse_risques` famille 7** (chimiques/émissions/déchets) → aspects | 🟡 | Tables **miroirs sans pont** : le datalist `activite` des aspects est codé en dur au lieu d'être issu de `hse_risques.unite_travail` → double saisie. |

### 3.6 → AES (objectivation data-driven)
| Source ERP | État | Câblage |
|---|---|---|
| **Mesures quantifiées** (rejets hors VLE, déchets, conso) → aspect | 🟡 | Lier chaque aspect à sa source quantifiée (ex. « Rejet aqueux » ← Σ mesures `rejet_eau` non conformes) pour **objectiver** la significativité au lieu d'une cotation 100 % manuelle. |

### 3.7 → RSE données sociales (`hse_rse_indicateurs`)
| Source ERP | État | Câblage |
|---|---|---|
| **Effectif actif** (`salaries`, calculé en Direction/RH) | 🟡 | Recopié à la main → injecter automatiquement (ventilable par site/contrat). |
| **TF / TG** (`hse_incidents` × pointages, **déjà calculés** en Sécurité) | 🟡 | Doublon de saisie → brancher TF/TG calculés → indicateurs RSE sociaux. |
| **Absentéisme** (`absences` + `conges`) | 🟡 | Assiette présente, **ratio à calculer** (jours d'absence / jours théoriques). |
| **Formations / habilitations** (`getCertifications`/`getHabilitations`, matrice existante) | 🟡 | Agréger heures/€ de formation, % salariés habilités. |
| **Égalité F/H, OETH** | 🔴 | **Pas de source** : `salaries` n'a ni sexe ni statut travailleur handicapé. Colonnes à créer avant tout calcul. |
| **Turnover / ancienneté** | 🔴 | `date_entree` existe mais **pas de `date_sortie`** → turnover non calculable. |

### 3.8 → RSE données économiques & achats responsables
| Source ERP | État | Câblage |
|---|---|---|
| **CA HT/TTC** (`factures_client`, agrégé Compta/Direction `caHTyear`) | 🟡 | Pont Compta/Direction → indicateurs RSE économiques (recopie manuelle aujourd'hui). |
| **Achats HT** (`factures_fournisseur`, `achatsHTyear`) | 🟡 | Idem + assiette Scope 3. |
| **Fournisseurs — certifications** (texte libre) | 🟡 | Structurer un flag ISO 14001 / label RSE → indicateur « % fournisseurs certifiés 14001 ». |
| **Scorecard fournisseur** (OTD/qualité/paiement) | 🟡 | 100 % économique/qualité → ajouter un **axe RSE** (ISO 14001, CO₂, distance/transport, code de conduite). |

### 3.9 → Veille réglementaire & pilotage Direction
| Source ERP | État | Câblage |
|---|---|---|
| **Conformité → jalons Direction** (`echeancesSecu`, `hse_conformite` responsable+échéance) | 🟢 | Déjà remonté au cockpit Direction avec bouton « Traiter ». |
| **`computeDataHealth` / DICT** (contrôle « obligations de conformité tenues ») | 🟢 | Moteur live opérationnel, contrôle déjà la conformité env. |
| **`scanAlertes` → file `validations`** | 🟡 | Ne scanne **pas** les échéances env (revues ATEX, AES à traiter, mesures hors VLE) → extensible. |
| **Cockpit Direction** (`kpis` financier+opérationnel+accidents) | 🟡 | Aucun **bloc RSE/environnement** (déchets, eau/énergie, AES, TF/TG) → panneau Pilotage extensible. |

---

## 4. Phasage recommandé (valeur d'abord)

- **Phase 1 — quick wins (haute valeur, faible coût)** : Lot A référentiels + **B4** tableau de bord branché sur le moteur + les câblages « gratuits » qui réutilisent des données **déjà calculées** (§3.7 TF/TG, effectif, absentéisme ; §3.8 CA/achats ; §3.2 VLE + relevés OAS→mesures ; §3.9 alertes env). Peu de DDL, effet immédiat.
- **Phase 2 — réglementaire structurant** : **B1** classification déchets EU/BSD + **C2** ICPE/Seveso + **B3** veille enrichie + indicateur + **B2** AES multi-axes.
- **Phase 3 — GES + interop production** : **C3** bilan GES + colonnes énergie machines (§3.3) + déchets automatiques (§3.1 : OAS/chutes/rebut/quarantaine/périssables) + Scope 3 achats.
- **Phase 4 — SME complet** : **C1** parties intéressées + **C4** diagnostic ISO 14001 + sonde env + **C5** plan d'actions/REX/urgence/politique/revue + **C6** cycle de vie + RSE ISO 26000 + achats responsables.

---

## 5. Décisions — TRANCHÉES le 2026-08-05

1. **Périmètre déchets automatiques** : ✅ **TOUS les flux** créent automatiquement une entrée déchet — vidange OAS, rebut NC, destruction quarantaine, périssable expiré, chutes métalliques.
2. **Moteur GES** : ✅ **interne monétaire** — facteurs ADEME embarqués, Scope 3 estimé depuis les montants d'achats par compte PCG.
3. **RSE social** : ✅ **créer les 3 colonnes** `salaries.sexe`, `salaries.oeth`, `salaries.date_sortie` (débloque égalité F/H, OETH, turnover).
4. **Démarrage** : ✅ **Phase 1 quick wins** d'abord.
5. *(À préciser en Phase 2)* Cotation AES (grille exacte présentation vs variante ; seuil) et finesse ICPE/Seveso (statut simple vs ratios complets par rubrique 4xxx).

---

## 6. Contraintes projet (rappel)

- **DDL** (nouvelles tables/colonnes) → **PAT requis** : SQL versionné dans `scripts_import/` à jouer sur le cloud ; code **fail-soft** (getter → `[]` si table absente, `prepare` strip-if-empty). Docker mis à niveau en parallèle.
- **Aucune donnée de démo inventée** ; données de test préfixées `-TEST-` et supprimées.
- **Conventions d'échappement JS client** (`sjX`, `escA`, doublage des apostrophes) — le module `environnement.tsx` utilise des **onclick inline + fonctions globales** (`secOpen/secSave/secDel`) : ne pas mélanger avec la délégation.
- **Vérif obligatoire** avant commit : `erp-verify` (tsc + build + **harnais 61/0** `harness_all_pages.mjs`) ; « fini » = code + `dist/` + doc + manuel.
- **Réutiliser** le patron data-driven : nouvel onglet = colonnes + `panelWrap/panelHeader/dataTable` + entrée `TABS`/`ENV_GROUPS`/`allRows`/`FORMS` (client) + getter `queries.ts` + `hseCrud(slug, fields[], {create,update,del}, prepare?)` (serveur) — le **slug identique partout** est la clé de jointure.
