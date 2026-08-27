---
name: erp-db
description: Opérations base de données Supabase de l'ERP — sondes REST (lecture/écriture), DDL via Management API, rechargement du schéma PostgREST, et tous les pièges connus (RLS, NOT NULL, vrais noms de tables). À invoquer pour toute création/modification de table ou diagnostic de données.
---

# erp-db — Opérations Supabase (444 occurrences sur les sessions passées)

Projet : `vyqgrasezpyqjwvijwvv` (URL et clé anon dans `src/db.ts`). L'app écrit avec la **clé anon** (posture assumée, ne pas « corriger »).

## Sonde REST (lecture/écriture de données)
```python
# PYTHONIOENCODING=utf-8 ; python - <<'PY' ... PY
import json, urllib.request
B='https://vyqgrasezpyqjwvijwvv.supabase.co/rest/v1/'
h={'apikey':KEY,'Authorization':'Bearer '+KEY,'User-Agent':'Mozilla/5.0','Content-Type':'application/json'}
# GET    B+'table?select=col1,col2&col=eq.X&limit=5'
# POST   + header 'Prefer':'return=representation' pour récupérer la ligne créée
# PATCH  B+'table?id=eq.X'   DELETE  B+'table?id=eq.X'
```
- **`User-Agent: Mozilla/5.0` obligatoire** (403 sinon).
- Table vide → `select=*&limit=1` renvoie `[]` : on ne voit pas les colonnes. Pour sonder les colonnes NOT NULL : insert minimal → lire l'erreur 23502.

## DDL (créer/modifier des tables) — Management API
La clé anon ne peut pas faire de DDL. Passer par l'API de gestion avec le **PAT** :
- **Ne JAMAIS écrire le PAT en clair** dans un fichier, un commit ou une memory. Le demander à l'utilisateur ou lire `$SUPABASE_PAT` s'il est posé en env.
```python
req = urllib.request.Request(
  'https://api.supabase.com/v1/projects/vyqgrasezpyqjwvijwvv/database/query',
  data=json.dumps({'query': SQL}).encode(),
  headers={'Authorization':'Bearer '+PAT,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},
  method='POST')   # 201 = OK
```
- **Terminer chaque script DDL par** `notify pgrst, 'reload schema';` sinon PostgREST ne voit pas les nouvelles colonnes (attendre ~2 s avant de sonder).
- Toujours **vérifier ensuite par sonde REST** que la table/colonne répond (200).
- Archiver le SQL dans `scripts_import/<sujet>_schema.sql` (traçabilité + doc).

## Pièges connus (appris à nos dépens)
| Piège | Détail |
|---|---|
| **RLS par table** | La plupart des tables ont une policy permissive, mais PAS toutes : `credits` bloquait l'insert anon (42501) → il a fallu `create policy ... for all using(true) with check(true)`. Si 401/42501 → policy manquante. |
| **NOT NULL silencieux** | `commandes.num_affaire`, `commandes.montant`, `non_conformites.gravite`… → 23502. Les `createX(...).catch(()=>{})` du code avalent ces erreurs : tester l'insert réel. |
| **Vrais noms de tables** | `bons_sous_traitance` (PAS bons_de_sous_traitance), `stock` (PAS stocks), `produits_perissables`, `hse_*` (14 tables sécurité), `plans_batiment`/`plan_marqueurs`, `commandes_prioritaires`. |
| **Ids texte** | Beaucoup de PK sont `text` lisibles (`CMD-2026-1081`, `AV-2026-777`, `NC-2954`) — fournir l'id à l'insert, pas de séquence auto. |
| **FK souples vs dures** | `lots.cmd_id`→`commandes` est une vraie FK (l'ordre d'insertion compte) ; `bons_de_travail.cmd_ref`/`lot_ref` sont du TEXTE libre (pas de FK). |
| **Projet auto-en-pause** | Supabase gratuit se met en pause après inactivité → toutes les requêtes échouent. Demander à l'utilisateur de restaurer via le dashboard Supabase. |
| **Encodage Windows** | Toujours `PYTHONIOENCODING=utf-8` et sortie ASCII de préférence (console cp1252). |

## Après tout DDL
1. Sonde REST verte sur la nouvelle structure.
2. `scripts_import/*.sql` mis à jour.
3. Invoquer **erp-doc-sync** (la doc DB `docs/technique/03-base-de-donnees.md` doit suivre).
