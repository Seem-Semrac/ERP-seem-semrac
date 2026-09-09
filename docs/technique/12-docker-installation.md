# 12 — Installation Docker (app + Supabase auto-hébergé, local)

> **Portée.** Faire tourner **toute la stack en local sur un PC** (Docker Desktop) :
> l'application ERP **et** une instance Supabase auto-hébergée, interconnectées.
> C'est un **essai / environnement de dev** : il **ne remplace pas** la production
> (Cloudflare Pages + Supabase cloud), qui reste intacte et continue de se déployer
> à chaque `git push` sur `main`.

---

## 1. Ce que ça installe

Un seul `docker compose` monte 8 conteneurs (dérivé du compose **officiel** Supabase,
curé pour le local — sans realtime, pooler, edge-functions ni GoTrue, inutiles ici) :

| Conteneur | Image | Rôle | Indispensable ? |
|---|---|---|---|
| `erp-db` | `supabase/postgres` + scripts d'init *cuits* (`db.Dockerfile`) | La base PostgreSQL (rôles + extensions Supabase) | **Oui (cœur)** |
| `erp-rest` | `postgrest/postgrest` | L'API REST utilisée par `@supabase/supabase-js` (`.from()`) | **Oui (cœur)** |
| `erp-kong` | `kong/kong` + `kong.yml`/entrypoint *cuits* (`kong.Dockerfile`) | Passerelle : préfixes `/rest/v1`, `/storage/v1`, gestion `apikey` | **Oui (cœur)** |
| `erp-app` | *build local* (`app.Dockerfile`, code copié) | L'application ERP (Hono) en Node | **Oui (cœur)** |
| `erp-storage` + `erp-imgproxy` | `supabase/storage-api` | Le bucket **GED** (documents/plans CAO/FAO) | Confort |
| `erp-meta` + `erp-studio` | `supabase/studio` | Le **dashboard** Supabase (`http://localhost:8000`) | Confort |

L'`app` ne **dépend en dur** que de `db` + `kong` : même si Studio ou Storage
bronchent, l'application démarre quand même sur `http://localhost:3000`.

### Comment l'app se connecte à Supabase
- `src/db.ts` lit désormais `SUPABASE_URL` / `SUPABASE_ANON_KEY` dans l'environnement,
  **avec repli** sur l'instance cloud si absentes. En conteneur, `docker-compose.yml`
  fixe `SUPABASE_URL=http://kong:8000` (réseau interne Docker) et la clé anon locale.
- **Sur Cloudflare, rien ne change** : `process.env` n'y est pas peuplé → repli cloud.
- L'app est servie par `src/server.node.ts` (adaptateur Node : injecte `process.env`
  dans `c.env`, sert `/static/*`, écoute sur `PORT`). `src/index.tsx` n'est pas touché.

---

## 1 bis. Sur une VM Linux — le standard, en 2 commandes

C'est la procédure de référence. Elle remplace tout ce qui suit pour un déploiement serveur ; les sections 2 à 4 restent utiles pour un poste de développement Windows.

Le dépôt de référence pour les déploiements est **`Seem-Semrac/ERP-seem-semrac`** (privé). Il ne contient qu'un commit par publication : le contenu y est identique à `main`, sans les 4,8 Go d'historique du dépôt de travail.

**Préparer l'accès** — une fois, sur la VM. Une clé de déploiement est préférable à un jeton : lecture seule, limitée à ce dépôt, aucun identifiant de compte sur le serveur, et rien ne casse quand vous changez votre mot de passe GitHub.

```bash
ssh-keygen -t ed25519 -C "vm-erp" -f ~/.ssh/erp_deploy -N "" && cat ~/.ssh/erp_deploy.pub
```

Collez la ligne affichée dans **GitHub → dépôt → Settings → Deploy keys → Add deploy key**, en laissant *Allow write access* décoché. Puis :

```bash
printf 'Host github-erp\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/erp_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
```

**Installer** :

```bash
git clone git@github-erp:Seem-Semrac/ERP-seem-semrac.git ~/erp
~/erp/docker/scripts/install.sh --seed
```

> Installation dans `~/erp` et non `/opt` : aucun droit administrateur n'est requis si Docker est déjà utilisable par votre compte. Si Docker n'est pas installé, `install.sh` s'arrête et affiche les deux commandes à demander à l'administrateur — c'est le seul point qui exige root, et une seule fois.

**Mettre à jour — deux commandes, une par machine.** Le code transite par GitHub : il n'existe pas de chemin direct du poste vers la VM.

| Ordre | Où | Commande |
|---|---|---|
| 1 | **Poste de développement** | `git add -A ; git commit -m "…" ; git push` |
| 2 | **VM** | `~/erp/docker/scripts/erp-docker.sh maj` |

Depuis le 9 septembre 2026, **`Seem-Semrac/ERP-seem-semrac` est le dépôt principal** (`origin`) : on y committe directement, il n'y a plus d'étape de publication séparée. L'ancien dépôt de travail `Krmaaaaaa/ERP` reste consultable sous le remote **`archive`**, avec les 277 commits d'historique.

Variante en une seule commande côté poste, avec garde de santé :

```powershell
.\docker\scripts\erp-docker.ps1 livrer "ce que contient la mise à jour"
```

Elle reconstruit les conteneurs locaux, attend que les 8 services soient sains, puis committe et pousse — **et s'arrête sans rien envoyer si un conteneur ne démarre pas**. Publier du code qui ne se lance pas sur le poste revient à casser la VM à distance.

> ⚠️ **Nom de projet Compose.** `install.sh` **et** `erp-docker.sh` fixent tous deux `COMPOSE_PROJECT_NAME=erp`, qui prime sur le `name:` du `docker-compose.yml`. Ce nom rattache les conteneurs **et les volumes** existants : deux scripts qui n'utilisent pas le même pilotent deux stacks distinctes. Compose créerait alors des volumes vides — donc une base vide — avant de buter sur les noms de conteneurs déjà pris. Ne pas les désaligner.

`maj` fait le pendant côté serveur : `git pull --ff-only`, reconstruction, redémarrage, puis l'état des 8 conteneurs et l'URL. Les données ne sont jamais touchées — seule l'application est remplacée.

### Ce que fait `install.sh`

| Étape | Détail | Pourquoi |
|---|---|---|
| 1. Docker | Installe Docker s'il manque, puis `systemctl enable --now docker` | Sans l'activation au boot, **rien ne remonte après un redémarrage** — c'est l'oubli classique |
| 2. Secrets | Génère `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, `APP_JWT_SECRET`, `PG_META_CRYPTO_KEY` et un PIN d'amorçage, dans un `.env` en `chmod 600` | Les valeurs de `.env.example` sont **publiques** (ce sont celles de la doc Supabase). `ANON_KEY` et `SERVICE_ROLE_KEY` sont des JWT signés avec `JWT_SECRET` : ils sont générés **ensemble**, sinon PostgREST rejette toutes les requêtes |
| 3. Exposition | Publie **le seul port de l'app** sur le réseau ; Studio (8000) et PostgreSQL (54322) sont liés à `127.0.0.1` | Évite d'ouvrir la base et l'administration à tout le réseau. `--expose-studio` lève la restriction si vous la voulez |
| 4. Démarrage | `docker compose up -d --build` puis attente que les 8 services soient sains | — |
| 5. Données | `--seed` recopie les données de la Supabase cloud vers la base locale | Sans cela la base démarre **vide de tables métier** |

Le script est **idempotent** : le relancer ne régénère aucun secret déjà en place et ne casse rien.

À la fin il affiche l'URL de l'application, l'emplacement des identifiants, et la commande de pare-feu :

```bash
sudo ufw allow 3000/tcp
```

### Dupliquer une instance sur la même VM

```bash
~/erp/docker/scripts/install.sh --instance recette --port 3100
```

Chaque instance a son propre `.env.<nom>`, son projet Compose `erp-<nom>` et ses propres volumes : les stacks ne se marchent pas dessus. Pour la piloter ensuite :

```bash
ERP_INSTANCE=recette ~/erp/docker/scripts/erp-docker.sh ps
```

### Exploitation courante — une seule commande à retenir

```bash
~/erp/docker/scripts/erp-docker.sh ps
```

`maj` · `up` · `stop` · `start` · `restart` · `down` · `ps` · `logs [service]` · `psql` · `restore <dump.sql>` · `migrate` · `mirror` · `ged-bucket` · `reset` (⚠ efface les données).

### Mettre à jour après une modification du code

```bash
~/erp/docker/scripts/erp-docker.sh maj
```

Équivaut à `git pull` suivi de `up`. La reconstruction de l'image est nécessaire parce que le code est **cuit dans l'image** — il n'y a pas de bind-mount. La base n'est pas touchée.

---

## 2. Prérequis

1. **Docker Desktop** installé **et démarré** (l'icône baleine active).
   Vérifier : `docker info` ne doit pas afficher *« daemon is not running »*.
2. ~8 Go de RAM libres conseillés (8 conteneurs).

---

## 3. Démarrage (3 commandes)

```powershell
cd docker
Copy-Item .env.example .env          # une seule fois
docker compose up -d --build         # ~2–5 min au 1er lancement (téléchargement images)
```

ou, via l'aide-mémoire fourni :

```powershell
.\docker\scripts\erp-docker.ps1 up
.\docker\scripts\erp-docker.ps1 ps      # tout doit être "healthy" / "running"
```

- **Application** : http://localhost:3000
- **Dashboard Supabase** (Studio) : http://localhost:8000 — identifiant `supabase`,
  mot de passe = `DASHBOARD_PASSWORD` du `.env`.
- **Postgres** (psql/pg_dump depuis l'hôte) : `localhost:54322`, user `postgres`.

Au premier démarrage `AUTH_ENFORCE=off` (dans `.env`) : on circule librement sans login,
pratique pour explorer. Passer à `on` pour retrouver le mur matricule+PIN.

---

## 4. Peupler la base (le point important)

La base démarre **vide de tables métier** : le schéma (`clients`, `commandes`,
`demandes_travaux`, …) **n'est pas dans le dépôt**, il vit dans la Supabase cloud.
Pour retrouver tes tables/données en local → **[docker/db/seed/README.md](../../docker/db/seed/README.md)** :

1. `pg_dump` depuis le cloud (tu fournis le mot de passe DB, il ne passe pas par le code).
2. `.\docker\scripts\erp-docker.ps1 restore docker\db\seed\dump.sql`
3. `.\docker\scripts\erp-docker.ps1 ged-bucket` (crée le bucket GED)
4. Dans `psql` : `NOTIFY pgrst, 'reload schema';` (PostgREST recharge le schéma).

Tant que ce n'est pas fait, les pages qui lisent des tables inexistantes afficheront
des listes vides ou des erreurs — c'est attendu.

---

## 5. « Après mes prochaines modifs, qu'est-ce qui se met à jour tout seul ? »

Honnêtement, selon la cible :

| Cible | Mise à jour | Détail |
|---|---|---|
| **GitHub → Cloudflare** (prod) | ✅ **Automatique, inchangé** | `git push` sur `main` → GitHub Actions build + déploie sur Cloudflare Pages. Non touché par Docker. |
| **Conteneur `app` (local)** | 🔁 **Par rebuild** | Après une modif de `src/`, une commande la prend : `docker compose up -d --build app` (~10 s, cache npm réutilisé) ou `erp-docker up`. *Le live-reload « à la sauvegarde » via bind-mount n'est **pas** disponible sur ce poste (voir encadré).* |
| **Base Docker (schéma)** | ⚠️ **Discipline requise** | La base Docker est **séparée** du cloud. Un changement de schéma ne s'y propage que si tu l'écris en **fichier SQL de migration** (`scripts_import/*.sql`) puis `erp-docker migrate`. Les DDL faits « à la main » dans le cloud n'y arrivent **pas** tout seuls. |

> ⚠️ **Bind-mounts inopérants sur ce poste Windows.** Au premier démarrage réel, on a
> constaté que les bind-mounts depuis `E:\` (fichiers **et** dossiers) arrivent **vides**
> dans les conteneurs (partage WSL2 + espace dans le chemin). La stack **n'utilise donc
> aucun bind-mount** : les configs Supabase (`kong.yml`, scripts d'init db) sont **cuites
> dans des images dédiées** (`kong.Dockerfile`, `db.Dockerfile`) et le code de l'app est
> **copié au build** (`app.Dockerfile`). Robuste, mais sans live-reload → on met à jour par
> rebuild (`up -d --build app`). Pour le live-reload, il faudrait activer le partage du
> disque `E:` dans Docker Desktop (Settings → Resources → File Sharing) — inutile pour l'essai.
>
> Il n'y a **aucune synchronisation automatique** entre la base **cloud** et la base
> **Docker** : ce sont deux bases distinctes. Les garder alignées = rejouer les mêmes
> fichiers de migration des deux côtés (c'est le principe « migrations-as-code »).

---

## 6. Piloter la stack

```powershell
.\docker\scripts\erp-docker.ps1 logs app     # suivre les logs de l'app
.\docker\scripts\erp-docker.ps1 psql         # console SQL
.\docker\scripts\erp-docker.ps1 down         # arrêter (garde les données)
.\docker\scripts\erp-docker.ps1 reset        # arrêter + EFFACER la base (repart de zéro)
```

(Équivalent Bash/Git-Bash : `docker/scripts/erp-docker.sh <commande>`.)

---

## 7. Dépannage

| Symptôme | Cause / remède |
|---|---|
| `daemon is not running` | Démarrer **Docker Desktop** et attendre qu'il soit prêt. |
| `erp-app` redémarre en boucle | `logs app` : souvent une modif TS invalide (`tsx` la signalera). |
| Ports 3000 / 8000 / 54322 déjà pris | Changer `APP_PORT` / `KONG_HTTP_PORT` dans `.env`, ou libérer le port. |
| Pages vides / erreurs « relation does not exist » | Base non peuplée → faire l'étape **§4**. |
| GED : upload en erreur | Bucket manquant → `erp-docker.ps1 ged-bucket`. |
| Studio (`:8000`) inaccessible | Non bloquant (confort). L'app fonctionne sans. Vérifier `logs studio`. |

---

## 8. Passer un jour en production (hors périmètre de cet essai)

Ce dossier est le **socle** de l'objectif 7 du [ROADMAP-2mois](../ROADMAP-2mois.md)
(auto-hébergement complet sur serveur). Pour un vrai déploiement, il faudra en plus :

1. **Régénérer TOUS les secrets** : le `.env` fourni contient les **clés de démo
   publiques** de Supabase (elles ne protègent rien). Générer un `JWT_SECRET` propre
   puis de nouvelles clés anon/service, changer `POSTGRES_PASSWORD`, `APP_JWT_SECRET`,
   `DASHBOARD_PASSWORD`, le PIN bootstrap ; mettre `AUTH_ENFORCE=on`.
2. **Reverse-proxy + HTTPS** (Caddy/Traefik) devant l'app et Kong, avec rate-limit
   sur `/api/login` et `/api/contact`.
3. **Sauvegardes** : `pg_dump` quotidien (cron) + copie du volume `storage/` — voir
   [ROADMAP-2mois §« Sauvegardes »](../ROADMAP-2mois.md). Non négociable en auto-hébergé.
4. **Fermer Studio** (`:8000`) derrière un mot de passe fort / le réseau interne.

---

*Fichiers de la stack : `docker/docker-compose.yml`, `docker/.env.example`,
`docker/app.Dockerfile`, `docker/supabase/volumes/**` (config officielle Supabase),
`docker/scripts/erp-docker.{ps1,sh}`. Code : `src/db.ts` (repli env),
`src/server.node.ts` (adaptateur Node), `package.json` (`start:node`/`dev:node`).*


## Authentification sur la stack Docker (depuis le 25/08/2026)

`AUTH_ENFORCE=on` est désormais le **défaut** (`docker/.env.example`). Chaque salarié se connecte avec **son matricule et son code PIN**, ceux de sa fiche RH (`salaries.matricule` / `salaries.pin`) — il n'y a pas de comptes séparés pour le Docker.

### Avant de basculer sur `on` — la vérification qui évite le verrouillage

```sql
select count(*) filter (where matricule is null or btrim(matricule) = '') as sans_matricule,
       count(*) filter (where pin is null or btrim(pin) = '')             as sans_pin
from public.salaries where actif is not false;
```

Les deux colonnes doivent renvoyer **0**. Sinon les personnes concernées ne pourront plus entrer. *(État constaté le 25/08/2026 sur la base locale : 36 salariés actifs, 36 matricules, 36 PIN, **tous hachés PBKDF2**, aucun en clair.)*

### Compte de secours (anti-verrouillage)

`BOOTSTRAP_MATRICULE` / `BOOTSTRAP_PIN` dans `docker/.env`. Il ouvre une session `direction` avec la permission `all`, **sans passer par la base** — c'est le filet si plus personne ne peut se connecter.
⚠ Le code embarque un défaut public (`ADMIN` / `246810`) utilisé quand les variables ne sont pas posées : **toujours** définir un `BOOTSTRAP_PIN` propre en `.env`, sinon n'importe qui connaissant le dépôt entre en Direction.

### Matricules partagés — géré, mais à surveiller

`verifySalariePin()` récupère **toutes** les lignes portant le matricule (recherche insensible à la casse) et se sert du **PIN individuel comme discriminant**. Un matricule partagé fonctionne donc… tant que les PIN diffèrent. Si deux personnes partagent matricule **et** PIN, la première ligne trouvée l'emporte et l'autre ne peut pas se connecter sous son identité.

*Constat 25/08/2026 : 34 matricules distincts pour 36 salariés actifs — trois personnes partagent le matricule `Cadre` (Joel Dumont · bei, Christophe Guenet · direction, Carolyne Moncomble · rh). À leur attribuer un matricule propre depuis RH › Employés.*

### Effets de bord

- Les scripts de capture (`capture_screens.mjs`, `capture_forms.mjs`) se connectent seuls via `ERP_MAT`/`ERP_PIN` (défauts `ADMIN`/`246810`). Lancés **contre le conteneur** (port 3000) avec un `BOOTSTRAP_PIN` personnalisé, il faut leur passer `ERP_PIN`. Contre le serveur de développement (port 8788) rien ne change.
- `/manuels` devient **filtré par rôle** : sans authentification l'ERP montrait tous les manuels, désormais chacun ne voit que ceux de ses services (la Direction les voit tous).


## GED et maquette bâtiment sur la stack Docker

Le service **Plan / Bâtiment** paraissait totalement cassé en local : maquette vide, repères posés sur rien. La donnée était pourtant intacte (1 plan, 47 repères). **Deux causes cumulées**, corrigées le 25/08/2026.

### Cause 1 — aucune policy RLS sur le stockage local

La stack créait le bucket `ged` mais **sans aucune policy** sur `storage.objects` / `storage.buckets`, alors que la RLS y est activée. La **clé anon** — qui est l'identité de l'application SSR (`src/db.ts`) — ne voyait donc aucun fichier : `createSignedUrl()` répondait « Object not found » et `/api/ged/file/:id` renvoyait **500 « Lien indisponible »**. Le cloud, lui, porte ces policies : le bug n'existait **qu'en local**.

→ `docker/db/seed/storage_policies.sql`, cuit dans l'image par `db.Dockerfile`. Fail-soft si le schéma `storage` n'existe pas encore. Sur une stack déjà démarrée :

```bash
docker cp docker/db/seed/storage_policies.sql erp-db:/tmp/sp.sql
MSYS_NO_PATHCONV=1 docker exec erp-db psql -U postgres -d postgres -f /tmp/sp.sql
```

*(⚠ `MSYS_NO_PATHCONV=1` sous Git Bash, sinon `/tmp/…` est converti en chemin Windows.)*

### Cause 2 — l'URL signée pointait un hôte interne au réseau Docker

`/api/ged/file/:id` **redirigeait** vers l'URL signée, construite sur `SUPABASE_URL` — qui vaut `http://kong:8000` dans le conteneur. Ce nom n'est résolu **qu'à l'intérieur du réseau Docker** : le navigateur recevait une redirection vers un hôte inexistant. Aucun plan, aucun document, aucun fond de maquette ne pouvait s'afficher.

→ La route **sert désormais le fichier elle-même** (récupération côté serveur puis renvoi du flux) au lieu de rediriger. Cela fonctionne dans **tous** les environnements (Docker, Cloudflare, VM) et garde le fichier **derrière l'authentification de l'ERP** — auparavant l'URL signée était utilisable hors session. En-têtes posés : `Content-Type` (depuis `documents.mime`), `Content-Disposition: inline` (images et PDF s'ouvrent dans l'onglet), `Cache-Control: private, max-age=300`.

### Les fichiers du stockage ne sont PAS copiés par le miroir de base

`docker/db/seed/_mirror.sql` recopie les **lignes**, pas les **fichiers**. La table `documents` référence donc des fichiers absents en local. Outil dédié :

```bash
node docker/scripts/mirror_ged.mjs        # copie cloud → local
node docker/scripts/mirror_ged.mjs --dry  # liste sans rien écrire
```

Il ne rapatrie que les documents référencés par la base locale, saute ceux déjà présents, et signale les lignes `documents` **orphelines** (fichier absent du cloud aussi).


## Accéder à Supabase (Studio) sur la stack Docker

Le conteneur `erp-studio` **n'expose aucun port** : on y accède **à travers Kong**, la passerelle.

| | |
|---|---|
| Adresse | **http://127.0.0.1:8000/** (depuis un autre poste : `http://<ip-de-la-machine>:8000/`) |
| Identifiant | valeur de `DASHBOARD_USERNAME` dans `docker/.env` (défaut : `supabase`) |
| Mot de passe | valeur de `DASHBOARD_PASSWORD` dans `docker/.env` |

Kong protège tout le tableau de bord par **authentification basique** : sans identifiants, la racine répond **401**.

> ⚠️ **`DASHBOARD_PASSWORD` vaut encore la valeur publique par défaut** livrée avec Supabase self-hosting. Studio donne un accès **administrateur complet à la base** (lecture, écriture, DDL). Sur une machine dont le port 8000 est joignable par le réseau, cela équivaut à laisser la base ouverte. À changer avant toute mise sur la VM :
> ```bash
> # génère un mot de passe fort et remplace la ligne dans docker/.env
> NEW=$(openssl rand -base64 24)
> sed -i "s|^DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$NEW|" docker/.env
> echo "Nouveau mot de passe Studio : $NEW"   # à ranger dans votre gestionnaire de mots de passe
> docker compose -f docker/docker-compose.yml up -d kong
> ```

### Accès direct à PostgreSQL (psql, pgAdmin, DBeaver)

| | |
|---|---|
| Hôte / port | `127.0.0.1` — port **54322** (et non 5432 : c'est le port publié côté hôte) |
| Base | valeur de `POSTGRES_DB` (défaut `postgres`) |
| Utilisateur | `postgres` |
| Mot de passe | valeur de `POSTGRES_PASSWORD` dans `docker/.env` |

```bash
docker exec -it erp-db psql -U postgres -d postgres     # sans installer de client
```

---

## Sur la VM Linux : le conteneur reste-t-il déployé, et joignable depuis un autre poste ?

### Il redémarre tout seul — à une condition

Les **8 services** portent `restart: unless-stopped`. Ils repartent donc après un plantage **et après un redémarrage de la machine**, à condition que le démon Docker démarre au boot :

```bash
sudo systemctl enable --now docker      # à faire UNE fois sur la VM
```

Sans cela, rien ne remonte après un reboot. C'est le seul point à ne pas oublier.

*Nuance de `unless-stopped` : si vous arrêtez un conteneur à la main (`docker stop`), il ne redémarrera pas tout seul au boot suivant — c'est voulu.*

### Oui, joignable depuis un PC Windows du réseau

Les ports sont publiés sur **`0.0.0.0`** (vérifié : `0.0.0.0:3000->3000`, `0.0.0.0:8000->8000`, `0.0.0.0:54322->5432`) : ils écoutent sur **toutes** les interfaces, pas seulement en local.

Depuis n'importe quel poste du réseau :

| Service | Adresse |
|---|---|
| ERP | `http://<ip-de-la-vm>:3000` |
| Supabase Studio | `http://<ip-de-la-vm>:8000` |
| PostgreSQL | `<ip-de-la-vm>:54322` |

Trois conditions à réunir sur la VM :

1. **Réseau en pont (bridge), pas en NAT** — en NAT, la VM n'a pas d'adresse visible sur le réseau de l'entreprise. À régler dans l'hyperviseur.
2. **Pare-feu ouvert** : `sudo ufw allow 3000/tcp` (et 8000 si vous voulez Studio à distance).
3. **Adresse IP fixe** (bail DHCP réservé ou IP statique), sinon l'adresse changera au prochain bail.

> ⚠️ **Ce que cette ouverture implique.** Publier sur `0.0.0.0` expose aussi **Studio (8000)** et **PostgreSQL (54322)** à tout le réseau. Recommandation : **n'ouvrir que le port 3000** au pare-feu, et restreindre les deux autres au local en préfixant leur publication dans `docker-compose.yml` :
> ```yaml
> ports:
>   - "127.0.0.1:8000:8000/tcp"     # Studio : accessible seulement DEPUIS la VM
>   - "127.0.0.1:54322:5432"        # PostgreSQL : idem
> ```
> On administre alors la base par SSH (`ssh -L 8000:127.0.0.1:8000 user@vm`), ce qui est la bonne pratique.

Deux points à ajuster aussi :

- **`AUTH_ENFORCE=on`** — indispensable dès que l'ERP est joignable par le réseau (déjà fait le 25/08/2026).
- **`SUPABASE_PUBLIC_URL`** vaut `http://localhost:8000` : à passer à `http://<ip-de-la-vm>:8000` sur la VM. *(Impact réduit depuis que `/api/ged/file/:id` sert les fichiers côté serveur au lieu de rediriger — voir plus haut.)*

---

## CI/CD semi-automatique avec approbation

**Oui, et la moitié du chemin est déjà faite.** `.github/workflows/deploy.yml` construit et déploie déjà vers Cloudflare à chaque push sur `main`, avec deux **portes bloquantes** : `tsc --noEmit` et le harnais toutes-pages. Il ne se déclenche que si `src/**`, `public/**` ou la configuration de build changent — les commits purement documentaires ne déploient rien.

Il manque le **second étage** : la VM. Deux modèles possibles.

### Modèle recommandé — runner sur la VM + approbation GitHub

Le plus proche de « semi-automatique avec approbation » : GitHub **met le job en pause** tant qu'un humain n'a pas cliqué *Approve*.

1. **Installer un runner auto-hébergé sur la VM** (Repo → Settings → Actions → Runners → New self-hosted runner), en service systemd pour qu'il survive aux reboots.
2. **Créer un environnement protégé** : Settings → Environments → `production-vm` → cocher **Required reviewers** et vous y désigner.
3. Ajouter un workflow `.github/workflows/deploy-vm.yml` :

```yaml
name: Deploy ERP -> VM Docker
on:
  push:
    branches: [main]
    paths: ['src/**', 'public/**', 'package.json', 'package-lock.json', 'docker/**']
  workflow_dispatch: {}

jobs:
  verifier:                 # tourne sur GitHub : portes bloquantes AVANT toute approbation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .node-version, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: node scripts_doc/harness_all_pages.mjs

  deployer:                 # tourne SUR LA VM, et attend votre clic
    needs: verifier
    runs-on: self-hosted
    environment: production-vm       # <-- déclenche la demande d'approbation
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker/docker-compose.yml up -d --build app
      - name: Contrôle de santé
        run: |
          for i in $(seq 1 30); do
            [ "$(docker inspect --format='{{.State.Health.Status}}' erp-app)" = "healthy" ] && exit 0
            sleep 4
          done
          echo "::error::erp-app n'est pas healthy"; exit 1
```

**Ce que vous vivez** : vous poussez du code → GitHub vérifie (typecheck, build, harnais) → si tout passe, une notification « *deployer* attend votre approbation » → vous cliquez *Approve* → la VM reconstruit son image et redémarre. Si le conteneur ne devient pas *healthy*, le job échoue et vous êtes prévenu.

### Modèle alternatif — sans runner (la VM vient chercher)

Si vous préférez ne pas ouvrir la VM à GitHub : un `git pull` périodique par timer systemd, qui ne déploie **que sur un tag**. L'approbation devient l'acte de **créer le tag**.

```bash
#!/usr/bin/env bash
# ~/erp/maj.sh — déploie uniquement si un nouveau tag deploy-* est apparu
set -euo pipefail
cd ~/erp
git fetch --tags --quiet
CIBLE=$(git tag -l 'deploy-*' --sort=-creatordate | head -1)
ACTUEL=$(cat .deploiement 2>/dev/null || echo "")
[ "$CIBLE" = "$ACTUEL" ] && exit 0
git checkout --quiet "$CIBLE"
docker compose -f docker/docker-compose.yml up -d --build app
echo "$CIBLE" > .deploiement
```

| | Runner + approbation | Tag + timer |
|---|---|---|
| Approbation | clic dans GitHub, traçable | création d'un tag |
| La VM doit joindre GitHub | oui (sortant) | oui (sortant) |
| GitHub doit joindre la VM | **non** (le runner sort) | non |
| Retour d'échec | dans GitHub | journaux de la VM |
| Retour arrière | relancer un ancien commit | `git checkout` d'un tag précédent |

Dans les deux cas, **gardez les portes bloquantes** : c'est ce qui empêche de déployer une page morte. Le harnais toutes-pages, en particulier, attrape la première cause de régression du dépôt — les scripts clients cassés par l'échappement, que `vite build` laisse passer.
