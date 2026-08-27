# Ingestion IA — CSV/XLS → LLM local (Ollama) → base ERP

Pipeline **n8n + Ollama (modèle local)** : on dépose un fichier CSV/XLS, on indique la
**table cible** + des **consignes**, et un modèle local (`qwen2.5:7b-instruct`) mappe chaque
ligne vers le **schéma réel** de la table. Le résultat passe d'abord par une **table de
staging** (`import_staging`) — on **valide** avant l'insertion définitive (aucune donnée
n'entre en base sans revue).

Tout est **100 % local et auto-hébergé** (aucune donnée ne sort de la machine) et
**déployable tel quel sur une VM Linux**.

## Composants
| Fichier | Rôle |
|---|---|
| `docker-compose.ai-ingest.yml` | overlay : ajoute **Ollama** (CPU par défaut) et raccorde n8n + Ollama au réseau de la base ERP |
| `docker-compose.ai-ingest.gpu.yml` | overlay **opt-in** : active le GPU NVIDIA pour Ollama |
| `import_staging.sql` | table tampon `import_staging` + fonctions `validate_import_batch` / `promote_import_batch` (insertion dynamique **sécurisée**) |
| `erp-ingestion-ia.workflow.json` | le workflow n8n à importer |

## Prérequis
- La **stack ERP principale** tourne (`docker/docker-compose.yml` → `erp-db`, réseau `erp-seem-semrac`).
- Docker + Docker Compose.
- **GPU NVIDIA** (optionnel mais recommandé) : ajouter l'overlay `docker-compose.ai-ingest.gpu.yml`
  (cf. commande GPU ci-dessous). Prérequis : `nvidia-container-toolkit` installé **et** un GPU
  réellement exposé à l'hôte (`docker run --rm --gpus all nvidia/cuda:12-base nvidia-smi` doit
  répondre). Par défaut (sans cet overlay) Ollama tourne en **CPU** — fonctionne partout, plus lent.

## Déploiement (identique poste local / VM Linux)
```bash
# 1) La stack ERP doit être up (fournit erp-db + le réseau erp-seem-semrac)
cd docker && docker compose up -d

# 2) Démarrer n8n + Ollama (rattachés au réseau ERP). --env-file ../.env fournit POSTGRES_PASSWORD.
cd n8n
# CPU (défaut, marche partout) :
docker compose -f docker-compose.observ.yml -f docker-compose.ai-ingest.yml --env-file ../.env up -d
# … OU avec GPU NVIDIA (ajouter l'overlay gpu) :
# docker compose -f docker-compose.observ.yml -f docker-compose.ai-ingest.yml \
#   -f docker-compose.ai-ingest.gpu.yml --env-file ../.env up -d

# 3) Tirer le modèle une fois (~5 Go, persisté dans le volume ollama-models)
docker exec -it erp-ollama ollama pull qwen2.5:7b-instruct

# 4) Créer la table de staging + les fonctions dans la base ERP
docker exec -i erp-db psql -U postgres -d postgres < import_staging.sql
```

### VM Linux — remarques
- Rien de spécifique : `git clone` du dépôt sur la VM, puis les 4 étapes ci-dessus. Tout est Docker.
- GPU : installer `nvidia-container-toolkit` (paquet distro) puis ajouter l'overlay `docker-compose.ai-ingest.gpu.yml`. Sans GPU, ne rien ajouter (CPU par défaut).
- RAM conseillée : **16 Go** (Qwen 7B ≈ 5 Go + inférence). Un modèle plus léger (`qwen2.5:3b-instruct`) tient sur une petite VM CPU.
- Ports exposés : n8n `5678`, Ollama `11434`, base `54322`. Restreindre au réseau interne / VPN en prod.

## Configurer le workflow (une fois)
1. Ouvrir n8n : `http://<hôte>:5678`.
2. **Credentials → New → Postgres** : nommer **`ERP Postgres`** — host `erp-db`, port `5432`,
   database `postgres`, user `postgres`, password = `POSTGRES_PASSWORD` (cf `docker/.env`), SSL `disable`.
3. **Workflows → Import from File** → `erp-ingestion-ia.workflow.json`.
4. Vérifier que les 2 nœuds Postgres pointent bien sur la credential `ERP Postgres`.
   (Le nœud « Lire fichier » lit le binaire du champ `Fichier` du formulaire ; ajuster
   `binaryPropertyName` si n8n a renommé la clé.)
5. **Activer** le workflow (ou utiliser « Test workflow » pour un essai).

## Utilisation
1. Ouvrir l'URL du **Form Trigger** (bouton « Production/Test URL » du nœud Formulaire).
2. Déposer le **CSV/XLS**, saisir la **table cible** (ex. `clients`) et les **consignes**
   (ex. « colonne *Raison sociale* → nom ; *Tél* → tel ; ignorer *Notes* »).
3. Le workflow écrit chaque ligne mappée dans `import_staging` (statut `pending`).

### Revue → validation → insertion définitive
```sql
-- Voir le lot le plus récent (source vs mapping proposé par le LLM)
SELECT id, row_index, source_row, mapped, status
FROM public.import_staging ORDER BY id DESC LIMIT 50;

-- Corriger une ligne si besoin (ex. ajuster le mapping)
UPDATE public.import_staging SET mapped = mapped || '{"tel":"0123456789"}'::jsonb WHERE id = 42;
-- Rejeter une ligne
UPDATE public.import_staging SET status='rejected' WHERE id = 43;

-- Valider tout un lot (les 'pending' → 'validated')
SELECT public.validate_import_batch('ING-20260808-101500', 'moi');

-- Promouvoir : insère les lignes 'validated' dans leur table cible.
-- Sécurité : seules les clés du mapping qui sont de VRAIES colonnes de la table
-- sont insérées (une colonne hallucinée est ignorée) ; les colonnes absentes
-- gardent leur DEFAULT (id/uuid, created_at…).
SELECT * FROM public.promote_import_batch('ING-20260808-101500');
```

## Dépannage — le modèle ne répond pas / l'appel n'aboutit jamais
**Cause n°1 : pas assez de RAM.** Un modèle ne s'exécute que s'il tient en mémoire :
qwen2.5:**7b** ≈ 5‑6 Go, qwen2.5:**3b** ≈ 2‑3 Go — **en plus** de la stack qui tourne.
Vérifier :
```bash
docker exec erp-ollama ollama ps      # VIDE = le modèle n'a pas pu se charger (RAM insuffisante)
docker info | grep "Total Memory"     # RAM totale allouée à Docker
```
- **Docker Desktop (Windows/WSL2)** : la VM Docker est souvent plafonnée bas (~3 Go). Créer
  `C:\Users\<user>\.wslconfig` :
  ```ini
  [wsl2]
  memory=12GB
  processors=8
  ```
  puis, dans PowerShell : `wsl --shutdown`, et **redémarrer Docker Desktop**. (⚠ arrête tous les
  conteneurs le temps du redémarrage.)
- **Docker Desktop** : Settings → Resources → Memory → **≥ 12 Go**.
- **VM Linux** : provisionner **≥ 16 Go RAM** (et un GPU pour du temps réel).
- Sans GPU, l'inférence CPU reste **lente** (dizaines de secondes/ligne) — normal ; le GPU la rend quasi instantanée.

## Garde-fous
- **Aucune insertion directe** dans les vraies tables : tout passe par le staging + une validation humaine (conforme à la règle « aucune donnée de démo/inventée en base »).
- Le modèle est **contraint** (`format: json`, `temperature: 0`, consigne « n'invente aucune valeur ») pour limiter les hallucinations ; la promotion filtre en plus les colonnes inconnues.
- Reproductible : pour changer de modèle, `docker exec -it erp-ollama ollama pull <modele>` puis ajuster le champ `model` du nœud HTTP « Ollama — mapping ».
