# Observabilité ERP — n8n (logs → incidents → triage IA → réparation bornée)

Stack **opt-in** et **séparée** de la stack ERP principale. Un conteneur `n8n` surveille
les conteneurs Docker + les logs de l'ERP, détecte les incidents, en fait un **rapport**
(avec **triage IA Claude** qui propose des correctifs sans les appliquer), et — si on
l'y autorise — **répare l'infra de façon bornée** (redémarrer un conteneur tombé, purger
le cache disque).

> Périmètre choisi : **Docker + logs applicatifs de l'ERP + ressources hôte**.
> **Cloudflare n'est PAS surveillé** (on le quitte pour l'auto-hébergement en prod).

---

## Ce que fait le workflow

Pipeline (fichier `erp-observabilite.workflow.json`), déclenché **toutes les 5 min** :

| # | Nœud | Rôle |
|---|------|------|
| 1 | **Toutes les 5 min** | Planificateur (intervalle 5 min). |
| 2 | **Collecter (Docker)** | Via le socket Docker : état de chaque conteneur `erp-*` (running/exited/unhealthy, OOMKilled, RestartCount, ExitCode), `docker system df` (disque récupérable), et un extrait des logs (`erp-app` toujours + tout conteneur non sain). |
| 3 | **Detecter** | Construit la liste d'incidents : conteneur arrêté (exit≠0), tué par OOM, `unhealthy`, boucle de redémarrage, cache/images récupérables ≥ 2 GB, lignes d'erreur dans les logs (`error/exception/5xx/panic/…`). |
| 4 | **Des problèmes ?** | Si rien → fin silencieuse. Sinon → suite. |
| 5 | **Triage IA (Claude)** | `POST api.anthropic.com/v1/messages`. Claude classe chaque incident **infra / applicatif / faux-positif**, et pour les bugs **applicatifs** propose un correctif (fichier + diff/étapes) **sans jamais l'appliquer**. Réponse JSON stricte. *Sauté proprement si pas de clé.* |
| 6 | **Rapport** | Fusionne détection + triage en un rapport lisible, et calcule la commande de réparation **bornée** (liste blanche + plafond). |
| 7 | **Alerte (webhook)** | Poste le rapport sur `ALERT_WEBHOOK_URL` (Slack / Discord / Teams / …). |
| 8 | **Auto-réparation ?** | N'agit **que si** `AUTOHEAL_ENABLED=true` **et** qu'il existe une action infra sûre. |
| 9 | **Réparer (bornée)** | Exécute uniquement : `docker restart erp-*` (conteneurs de la liste blanche, max 3), `docker image prune` / `docker builder prune`. **Jamais** de volumes, **jamais** de patch de code. |

**« Répare quand c'est un bug hardware »** = c'est l'étape 9, volontairement **bornée** :
seuls les incidents **infra** (conteneur tombé, OOM, healthcheck KO, disque saturé) sont
réparables automatiquement. Les bugs **applicatifs** (code) ne sont **jamais** corrigés
tout seuls — Claude en propose le correctif dans le rapport, un humain décide.

---

## Installation

Depuis `docker/n8n/` :

```bash
# 1. (optionnel mais recommandé) renseigner les variables
cp .env.example .env      # puis éditer .env
# 2. construire l'image (n8n + docker-cli) et démarrer
docker compose -f docker-compose.observ.yml up -d --build
```

Puis ouvrir **http://localhost:5678** → menu **⋯ › Import from File** →
choisir **`erp-observabilite.workflow.json`** → **activer** le workflow (toggle en haut).

### Variables (fichier `docker/n8n/.env`)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `ANTHROPIC_API_KEY` | *(vide)* | Clé API Claude pour le triage IA. **Vide → le triage est sauté**, le rapport se fait quand même (détection brute). |
| `ALERT_WEBHOOK_URL` | *(vide)* | URL d'un webhook Slack/Discord/Teams où poster le rapport. Vide → pas d'alerte externe (visible dans l'historique n8n). |
| `AUTOHEAL_ENABLED` | `false` | `true` = autorise la **réparation infra bornée** (étape 9). Défaut : **rapport seul**, aucune action. |
| `CLAUDE_MODEL` | `claude-opus-4-8` | Modèle Claude pour le triage. |

> Format du webhook : le corps posté est `{"text": "<rapport>"}` — compatible tel quel
> avec les *Incoming Webhooks* Slack et les webhooks Discord (`content` vs `text` : pour
> Discord, viser un relais ou ajuster la clé dans le nœud « Alerte »).

---

## Garde-fous (à lire avant d'activer `AUTOHEAL_ENABLED`)

- **Le montage du socket Docker (`/var/run/docker.sock`) équivaut à un accès root au
  Docker de l'hôte.** Le conteneur n8n tourne en `root` (nécessaire pour lire le socket
  sur ce poste). Ne pas exposer ce n8n hors du réseau local ; garder `5678` en localhost.
- **Aucun correctif de code n'est jamais appliqué automatiquement.** Le triage IA
  *propose* ; l'humain *dispose*. L'auto-réparation est strictement infra.
- **Réparation sur liste blanche** : seuls les conteneurs `erp-app, erp-kong, erp-rest,
  erp-storage, erp-meta, erp-studio, erp-imgproxy, erp-db` peuvent être redémarrés,
  **plafonnés à 3** redémarrages par exécution.
- **Jamais de perte de données** : le nettoyage disque est `image prune` / `builder prune`
  uniquement — **jamais `--volumes`**, jamais `down`, jamais `rm`. Les données Postgres
  (volume) ne sont pas touchées.
- **Idempotent & non bloquant** : les nœuds réseau (Claude, webhook) sont en
  `continue on fail` — une clé absente ou un webhook injoignable n'interrompt pas la
  surveillance.

## Réglage / extension

- **Fréquence** : nœud « Toutes les 5 min ».
- **Motifs d'erreur logs** : regex dans le nœud « Detecter ».
- **Seuil disque** : `>= 2` (GB récupérables) dans « Detecter ».
- **Liste blanche / plafond de réparation** : constantes `ALLOW` / `.slice(0,3)` dans « Rapport ».
- **Prompt de triage** : `system` du nœud « Triage IA (Claude) ».

## Désactiver

```bash
cd docker/n8n && docker compose -f docker-compose.observ.yml down
```
(Le volume `n8n-data` — workflows + historique — est conservé. Ajouter `-v` pour tout purger.)
