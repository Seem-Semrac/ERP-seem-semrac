# Feuille de route — 2 mois (juillet → début septembre 2026)

> **But du document** : un plan d'action semaine par semaine pour rendre l'ERP **maintenable par un prestataire extérieur sans jamais perdre le contrôle**, **sûr au niveau cybersécurité**, **automatisable (N8N)**, **déployable en Docker**, et pour que **tu maîtrises toi-même** la base de données et les imports de données. Chaque objectif se termine par un livrable concret.

## Principe directeur : autonomie + propriété
Tout ce qui suit obéit à une règle unique : **un prestataire peut travailler sur l'application, mais rien de vital ne doit dépendre de lui.** Le code, les comptes, les secrets, les sauvegardes et la connaissance restent **chez toi**. Le prestataire est un exécutant remplaçable, pas un point de défaillance.

## Les 7 objectifs
1. **Maintenabilité externe** — un tiers peut reprendre le code sans toi.
2. **Garder tous les droits** — propriété du code, des comptes et des données.
3. **Sécurité / cybersécurité opérationnelle** — fermer les failles résiduelles, sauvegardes, RGPD.
4. **Maîtriser PostgreSQL** — lire et comprendre les interactions avec la base.
5. **Automatiser avec N8N** — recenser et brancher les workflows automatisables.
6. **Importer des données à la main, sans fuite** — procédure autonome et sûre.
7. **Docker** — mise en production et installation reproductibles.

---

## Vue d'ensemble (8 semaines)
| Sem. | Dates ~ | Thème dominant | Livrable de fin de semaine |
|---|---|---|---|
| S1 | 7–11 juil | **Propriété & réversibilité** | Comptes/dépôt/secrets sécurisés au nom de l'entreprise |
| S2 | 14–18 juil | **Cybersécurité — durcissement** | Failles résiduelles fermées + sauvegardes automatiques |
| S3 | 21–25 juil | **Docker — Supabase auto-hébergé + app (local)** | Toute la stack (Supabase + app) tourne en local dans Docker |
| S4 | 28 juil–1 août | **Migration des données + mise en production** | Données migrées du cloud vers TON serveur, app en prod HTTPS |
| S5 | 4–8 août | **PostgreSQL — montée en compétence** | Tu lis seul les requêtes, logs et RLS |
| S6 | 11–15 août | **Import de données à la main** | 1 jeu de données réel importé par toi, sans fuite |
| S7 | 18–22 août | **N8N — socle + 3 automatisations** | N8N installé + 3 workflows en production |
| S8 | 25–29 août | **N8N (suite) + contrat prestataire** | Catalogue complet + contrat de maintenance signé |

> Deux mois, c'est réaliste **si** on avance un thème par semaine et qu'on ne cherche pas la perfection : on vise « opérationnel et sûr », pas « parfait ». Les semaines d'août tiennent compte des congés (charge allégée).

---

# Détail par objectif

## 1) Maintenabilité par une entreprise extérieure
**Ce qui est déjà fait** : documentation technique complète (`docs/technique/`), manuel utilisateur, fiches de poste, 6 skills, référence API et tables générées, CHANGELOG.

**À faire (S1 + S8)**
- **Dépôt Git « source de vérité »** hébergé sur un compte **de l'entreprise** (GitHub/GitLab pro), pas celui du prestataire. Le prestataire reçoit un accès *collaborateur*, jamais la propriété.
- **Runbook d'exploitation** (`docs/technique/02-exploitation-runbook.md`) complété : que faire en cas de panne, comment redéployer, qui appeler, où sont les sauvegardes.
- **Contrat de maintenance** avec clauses non négociables (voir Annexe C) : propriété du code, réversibilité, délais d'intervention, remise des livrables à chaque fin de mission.
- **Environnement reproductible** = Docker (objectif 7) : un nouveau développeur lance l'app en une commande, sans configuration cachée.

**Ce que tu dois maîtriser** : savoir cloner le dépôt, lancer l'app en local, lire le CHANGELOG et la doc technique pour vérifier ce que le prestataire a livré.

## 2) Garder tous les droits de l'application
**À faire (S1)** — inventaire et reprise en main de **tous les comptes**, chacun au nom de l'entreprise avec **double authentification (MFA)** :

| Élément | Doit appartenir à | Action |
|---|---|---|
| Dépôt Git (code) | Entreprise | Créer l'org, y transférer le repo, MFA obligatoire |
| Supabase / base de données | Entreprise | **Auto-hébergé** (Docker, sur ton serveur) — les données ne quittent **jamais** ton infrastructure |
| Serveur d'hébergement (Docker) | Entreprise | Serveur/VPS au nom de l'entreprise, accès SSH par clé, MFA |
| Nom de domaine | Entreprise | Vérifier le registrar, MFA |
| N8N (automatisations) | Entreprise | Auto-hébergé (Docker), pas de SaaS tiers |
| Secrets (mots de passe, clés) | Entreprise | Gestionnaire de mots de passe (voir S2) |

**Règle d'or** : **aucun compte critique ne doit être créé avec l'e-mail personnel du prestataire.** S'il en existe, on les recrée au nom de l'entreprise et on invite le presta ensuite.

**Ce que tu dois maîtriser** : savoir retirer l'accès d'un prestataire en 2 minutes (révoquer son invitation Git/Supabase/serveur) — c'est ta garantie de contrôle.

## 3) Sécurité du code & cybersécurité opérationnelle
**Ce qui est déjà fait** : audit adversarial (15/16 défauts corrigés), RBAC fermé par défaut, signataires fiables (PIN/session), anti-abus formulaire public, harnais anti-régression.

**À faire (S2)** — passer de « bêta assumée » à « production sûre » :
- **Sortir les secrets du code** : le JWT secret et le compte bootstrap `ADMIN/246810` sont aujourd'hui *intégrés au build* (choix bêta). En prod Docker → les mettre en **variables d'environnement** (fichier `.env` hors Git), régénérer un secret JWT long et aléatoire, changer le PIN admin.
- **Clés Supabase** : avec l'auto-hébergement, ta **propre** instance Supabase génère ses **nouvelles** clés (anon + service) à partir de **ton** JWT secret. La clé anon actuellement committée (celle du cloud) devient **caduque** dès le basculement — on met à jour `src/db.ts` (URL + nouvelle clé anon) vers ton instance. La clé `service_role` (toute-puissante) reste **strictement côté serveur, jamais dans le code ni le navigateur**.
- **RLS (row level security)** : décider table par table qui peut lire/écrire. Aujourd'hui c'est permissif (assumé). Priorité : verrouiller les données **RH (pointages, salariés)** et **compta** — ce sont des données personnelles (RGPD).
- **Anti-flood / rate-limit** : en auto-hébergé, c'est le **reverse-proxy** (Caddy/Traefik) ou un pare-feu applicatif (ex. Crowdsec, fail2ban) qui limite le débit sur `/api/login` et `/api/contact` et bloque les IP abusives. À configurer au moment de la mise en prod (S4).
- **Sauvegardes automatiques** de la base (voir objectif transverse) — **c'est la mesure n°1** : sans backup, tout le reste est secondaire.
- **RGPD** : registre des traitements (données salariés), durée de conservation, information des salariés. Les données de pointage sont sensibles.
- **Journalisation** : garder une trace des connexions et des actions sensibles (déjà partiellement en place via les historiques).

**À faire (fin S8, optionnel mais recommandé)** : un **test d'intrusion** (pentest) léger par un prestataire spécialisé une fois le durcissement fait → attestation de sécurité.

**Ce que tu dois maîtriser** : lire les alertes du « Security Advisor » de Supabase (comme on vient de le faire avec les vues), savoir ce qu'est une clé secrète vs publique, et vérifier que les sauvegardes tournent.

## 4) Maîtriser PostgreSQL (lire les interactions)
Objectif : que tu puisses **lire et comprendre** ce qui se passe dans la base, sans dépendre de moi ni du prestataire. On procède par paliers (S5, ~1h/jour) :

- **Palier 1 — Lire** : le *Table Editor* et le *SQL Editor* de Supabase. Écrire un `SELECT` simple (« montre-moi les 10 dernières commandes »), filtrer (`WHERE`), trier (`ORDER BY`), compter (`COUNT`).
- **Palier 2 — Comprendre les liens** : ce qu'est une clé primaire, une clé étrangère (ex. un lot appartient à une commande), une jointure simple.
- **Palier 3 — RLS** : lire une *policy* de sécurité, comprendre « qui a le droit de voir quoi », repérer une table trop ouverte.
- **Palier 4 — Surveiller** : lire les *logs* Postgres, repérer une requête lente, comprendre le *Query Performance* de Supabase.
- **Palier 5 — Vues & alertes** : reconnaître une vue, comprendre les alertes du Security Advisor (tu l'as déjà fait).

**Livrable** : un mémo `docs/technique/10-postgres-pour-le-proprietaire.md` (je te le rédige) — 10 requêtes types prêtes à copier-coller (« qui s'est connecté aujourd'hui », « commandes en retard », « pointages du mois »), et une checklist « lire une alerte de sécurité ».

## 5) Automatiser avec N8N
**N8N** = un outil visuel (boîtes reliées par des flèches) pour automatiser des tâches répétitives, **auto-hébergé** (donc chez toi, dans Docker — cohérent avec l'objectif 7 et la propriété).

**Approche (S7–S8)** : installer N8N dans le même Docker que l'app, le connecter à Supabase (lecture/écriture via l'API), puis brancher les workflows par ordre de valeur. Le **catalogue complet est en Annexe A** — on commence par les 3 à plus fort impact :
1. **Relance des factures impayées** (email automatique à J+30, J+45).
2. **Alertes d'échéances sécurité** (VGP, DUER, contrôles réglementaires qui arrivent à terme).
3. **Sauvegarde quotidienne** de la base (aussi un point cybersécurité).

**Ce que tu dois maîtriser** : créer un workflow simple (déclencheur → action), le tester, le mettre en pause. On en construit 1 ensemble, tu refais les suivants seul.

## 6) Importer des données à la main, sans fuite
Objectif : **tu importes tes vraies données toi-même**, sans me confier de fichiers sensibles, sans risque de fuite.

**Méthode (S6)** :
- **Le canal** : le *SQL Editor* / *Table Editor* de Supabase (import CSV intégré) OU les scripts d'import du dépôt (`scripts_import/`) que tu lances **sur ta machine**. Les données ne transitent que entre ton poste et ta base — **jamais par un tiers**.
- **Checklist anti-fuite** (voir Annexe B) : anonymiser les jeux de test, ne jamais coller de données réelles dans un chat/IA, ne jamais partager le PAT ou les clés, supprimer les fichiers temporaires après import, vérifier que l'import va dans la bonne table.
- **Procédure documentée** : `docs/technique/11-import-de-donnees.md` (je te le rédige) — pas à pas avec captures, format CSV attendu par table, comment vérifier après import, comment annuler en cas d'erreur.

**Ce que tu dois maîtriser** : préparer un CSV propre (colonnes = celles de la table), l'importer, vérifier le nombre de lignes, corriger une erreur. On fait le premier import ensemble.

## 7) Docker — auto-hébergement complet (Supabase + app) & installation
**Le choix retenu** : **tout auto-héberger sur ton propre serveur** — la base **Supabase** ET l'application, en Docker. Plus de dépendance à Cloudflare ni au cloud Supabase : **les données et l'infrastructure sont 100 % à toi**. C'est l'option la plus cohérente avec « garder tous les droits » et « pas de fuites de données ».

> **La contrepartie, en toute honnêteté** : ce que Supabase cloud faisait pour toi (sauvegardes, mises à jour de sécurité, disponibilité 24/7, correctifs), c'est **désormais ta responsabilité**. C'est parfaitement gérable, mais ça impose de la rigueur : sauvegardes testées, mises à jour régulières, surveillance. C'est le prix de la maîtrise totale — et ce plan est fait pour te le rendre tenable.

**Ce qu'on installe** (un seul `docker-compose.yml`, tout sur ton serveur) :
- **La stack Supabase auto-hébergée** : PostgreSQL (la vraie base), PostgREST (l'API que l'app utilise), GoTrue (auth), Storage (le bucket GED des documents/plans), Studio (l'interface d'admin, l'équivalent du dashboard), Kong (la passerelle). Supabase fournit un `docker-compose` officiel prêt à l'emploi.
- **L'application** ERP (l'app Hono en conteneur Node).
- **N8N** (automatisations, objectif 5).
- **Un reverse-proxy** (Caddy ou Traefik) qui gère le HTTPS automatiquement et route vers chaque service.

**Étapes**
- **S3 — Monter la stack en LOCAL d'abord** : récupérer le `docker-compose` officiel Supabase, générer **tes propres secrets** (JWT secret, mots de passe Postgres, clés anon/service via l'outil Supabase), écrire le `Dockerfile` de l'app, adapter `src/db.ts` (URL → ton instance locale, nouvelle clé anon). Vérifier que l'app tourne contre **ta** base locale. Créer le schéma (les `scripts_import/*.sql` + les tables via les migrations).
- **S4 — Migrer les données + mettre en production** :
  1. **Export** de la base cloud actuelle (`pg_dump` / l'outil de sauvegarde Supabase) → un fichier `.sql`.
  2. **Import** dans ta base auto-hébergée (`psql < dump.sql`). Vérifier les compteurs de lignes table par table.
  3. **Serveur** : choisir un VPS (OVH / Scaleway / Hetzner) ou un serveur interne, au nom de l'entreprise, accès SSH par clé. Installer Docker.
  4. **Déployer** : `docker compose up -d`, brancher le nom de domaine + HTTPS, vérifier la checklist post-déploiement. **Fermer le dashboard Studio derrière un mot de passe fort** (c'est un accès total à la base).

**Livrable** : `docs/technique/12-docker-installation.md` — comment installer **toute la stack de zéro** (Supabase + app + N8N) sur un serveur vierge. Le `docker-compose.yml` + le `.env.example` versionnés = **la preuve ultime de réversibilité** : n'importe qui peut tout remonter en une commande.

**Ce que tu dois maîtriser** : `docker compose up -d / down / logs / ps`, savoir où est le fichier `.env` (tes secrets), et **ne jamais** committer le `.env` réel. Comprendre que Studio auto-hébergé = le dashboard, mais chez toi.

---

# Objectif transverse prioritaire : LES SAUVEGARDES
**Avec l'auto-hébergement, plus personne ne sauvegarde à ta place** — le cloud Supabase le faisait, ton serveur ne le fera pas tout seul. C'est donc **LA priorité absolue** :
- Une **sauvegarde automatique quotidienne** de la base (`pg_dump` du conteneur PostgreSQL) + une copie du **bucket Storage** (documents/plans GED).
- Vers **≥ 2 emplacements** que tu contrôles, dont **un hors du serveur** (autre disque / stockage objet chiffré / hors-ligne) — sinon un serveur perdu = tout perdu.
- **Tester une restauration** au moins une fois (une sauvegarde jamais testée ne compte pas).
- **Chiffrer** les sauvegardes (elles contiennent des données RH/compta).
- Idéalement automatisé par **N8N** (workflow n°1) dès que N8N tourne ; en attendant, un simple `cron` + `pg_dump` sur le serveur.

C'est la seule protection contre une panne serveur, un ransomware, une erreur du prestataire ou une fausse manip. **Non négociable — à mettre en place la semaine même où la base est auto-hébergée (S3/S4), voire un `pg_dump` cron dès le premier jour de mise en ligne.**

---

# Annexe A — Catalogue des workflows N8N automatisables
Recensés à partir des modules existants ; à brancher par ordre de valeur.

**Finance / Commercial**
- Relance automatique des **factures impayées** (J+30, J+45, J+60) par email.
- Alerte **commandes en retard** de livraison (date dépassée) → email au commercial.
- Récap **CA hebdomadaire** envoyé à la direction.

**Sécurité / Qualité (fort enjeu réglementaire)**
- Rappel des **VGP / contrôles réglementaires** qui arrivent à échéance (30 j avant).
- Rappel de **revue du DUER** (annuelle) et des **habilitations salariés** expirant.
- Notification à la Qualité dès qu'une **NC bloquante** ou une **quarantaine** est créée.
- Alerte **produits chimiques** dont la FDS est trop ancienne.

**Stock / Achats**
- Alerte **seuil de réappro** atteint → email/demande d'achat pré-remplie.
- Alerte **produits périssables** proches de la péremption.

**Production / RH**
- Rappel **pointages non validés** en fin de semaine au responsable.
- Alerte **congés en attente de validation**.
- Export mensuel **heures → paie** (fichier prêt pour Silae).

**Technique / Cybersécurité**
- **Sauvegarde quotidienne** de la base + du Storage, chiffrée, vers un stockage externe (workflow n°1 à faire).
- **Contrôle de santé** : ping de l'app **et** de l'API Supabase toutes les 5 min → alerte si un conteneur tombe.
- Alerte **espace disque** du serveur qui se remplit (les logs/sauvegardes peuvent saturer un serveur auto-hébergé).

> On commence par : Sauvegarde quotidienne → Échéances sécurité → Factures impayées.

# Annexe B — Checklist « import de données sans fuite »
- [ ] Le fichier CSV ne contient **que** les colonnes de la table cible.
- [ ] Aucune donnée réelle sensible n'est collée dans un chat, une IA, un email.
- [ ] L'import se fait depuis **ton poste** vers **ta base** (Supabase), sans intermédiaire.
- [ ] Le **PAT** et les clés secrètes ne sont **jamais** partagés ni écrits dans un fichier suivi par Git.
- [ ] Après import : vérifier le **nombre de lignes** et 2–3 lignes au hasard.
- [ ] Supprimer les **fichiers temporaires** (CSV, exports) après usage.
- [ ] En cas d'erreur : savoir **annuler** (supprimer les lignes importées par un critère commun).

# Annexe C — Clauses non négociables du contrat de maintenance
- **Propriété intellectuelle** : le code et les données appartiennent à l'entreprise, à 100 %, y compris les développements faits par le prestataire.
- **Réversibilité** : à la fin de chaque mission, remise de tout le code, de la doc à jour et des accès ; l'entreprise peut reprendre ou changer de prestataire sans blocage.
- **Comptes & secrets** : hébergés par l'entreprise ; le prestataire reçoit des accès *nominatifs révocables*, jamais la propriété.
- **Confidentialité / RGPD** : le prestataire s'engage sur la protection des données (surtout RH) ; interdiction de copier les données hors de l'environnement.
- **Délais d'intervention** (SLA) : temps de réponse en cas de panne bloquante.
- **Traçabilité** : toute modification passe par le dépôt Git (pas de correctif « en direct » non tracé) et met à jour le CHANGELOG.

# Annexe D — Ce que TU dois maîtriser à la fin des 2 mois
1. Cloner le dépôt et lancer l'app en local (Docker).
2. Révoquer l'accès d'un prestataire sur tous les comptes.
3. Lire une alerte de sécurité Supabase et savoir si c'est grave.
4. Écrire un `SELECT` simple et lire les logs Postgres.
5. Importer un CSV dans la base et vérifier le résultat.
6. Créer et mettre en pause un workflow N8N simple.
7. Vérifier qu'une sauvegarde a bien tourné et savoir en restaurer une.

---

# Jalons de contrôle (à cocher)
- [ ] **Fin S2** : sauvegardes automatiques + testées · secrets sortis du code · clé anon rotée.
- [ ] **Fin S4** : app en production sur Docker, sur un serveur de l'entreprise, HTTPS OK.
- [ ] **Fin S6** : tu as importé un jeu de données réel toi-même, sans aide.
- [ ] **Fin S8** : 3+ workflows N8N en prod · contrat de maintenance signé · pentest planifié.

> Ce plan est un point de départ réaliste, pas une contrainte rigide. On ajuste chaque fin de semaine selon ce qui a avancé. Priorité absolue si le temps manque : **sauvegardes (transverse)** puis **secrets/RLS (obj. 3)** — ce sont les deux qui protègent l'entreprise.
