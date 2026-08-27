# Documentation technique — ERP Seem Semrac

Destinée au **prestataire de maintenance** et à l'équipe interne. Décrit l'architecture, la base de données, la sécurité, les conventions de code et l'exploitation.

## Sommaire
| Fichier | Contenu |
|---|---|
| [01-architecture.md](01-architecture.md) | Stack technique et choix d'architecture (et leur justification) |
| [02-exploitation-runbook.md](02-exploitation-runbook.md) | Déploiement, secrets, sauvegardes, incidents courants |
| [03-base-de-donnees.md](03-base-de-donnees.md) | Modèle de données par domaine + justifications |
| [03b-tables-reference.md](03b-tables-reference.md) | Inventaire des tables (généré) |
| [04-auth-rbac.md](04-auth-rbac.md) | Authentification (matricule+PIN) et autorisations (13 rôles × 15 services) |
| [05-conventions-code.md](05-conventions-code.md) | Patterns SSR, JS client dans les templates, échappement, helpers |
| [06-modules/](06-modules/) | Une fiche par service (rôle, onglets, routes, tables, fichiers) |
| [07-api-reference.md](07-api-reference.md) | Référence des ~290 routes (générée) |
| [08-securite.md](08-securite.md) | Posture de sécurité assumée + risques résiduels |
| [09-audit.md](09-audit.md) | Audit de code pré-remise (défauts corrigés + résiduels) |
| [10-variables-environnement.md](10-variables-environnement.md) | Inventaire consolidé des variables d'environnement (prod/dev/Docker/n8n/CI) |
| [11-audit-externe-preliminaire.md](11-audit-externe-preliminaire.md) | Guide : préparer le dépôt pour une revue de maintenabilité externe |
| [12-docker-installation.md](12-docker-installation.md) | Installation de la stack Docker locale (Supabase + app + n8n) |

## Outils de la doc (dossier `scripts_doc/`)
- `harness_all_pages.mjs` — vérifie la syntaxe des scripts clients de toutes les pages.
- `gen_api_ref.mjs` — régénère `07-api-reference.md` depuis `src/index.tsx`.
- `gen_db_ref.py` — régénère `03b-tables-reference.md` (introspection live).
- `capture_screens.mjs` — captures d'écran du manuel (Playwright).
- `lint_docs.mjs` — vérifie les liens/images de la doc.
- `build_print.mjs` — génère les recueils HTML/PDF imprimables.

## Maintien à jour
La doc est **versionnée avec le code**. Le skill `erp-doc-sync` (`.claude/skills/`) synchronise la doc à chaque modification — obligation posée par le `CLAUDE.md` racine.
