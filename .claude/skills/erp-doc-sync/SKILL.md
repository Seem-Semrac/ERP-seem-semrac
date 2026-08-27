---
name: erp-doc-sync
description: Gardien de la documentation — après TOUTE modification du code, de la base ou des process, met à jour docs/ (fiche module, réf API, doc DB, CHANGELOG, captures) et la memory. OBLIGATOIRE avant le commit final de chaque session de travail qui a modifié le dépôt.
---

# erp-doc-sync — Maintenir la documentation à jour

**Contrat du dépôt (cf. CLAUDE.md racine)** : aucune fonctionnalité n'est « finie » tant que la doc n'est pas synchronisée. Ce skill rend l'opération mécanique (~5 min).

## 1. Identifier ce qui a changé
```bash
rtk git diff --name-only HEAD~N     # ou les commits de la session courante
```

## 2. Table de correspondance fichier → doc à mettre à jour
| Changement dans… | Mettre à jour |
|---|---|
| `src/<module>.tsx` (UI/logique d'un service) | `docs/technique/06-modules/<module>.md` (onglets, endpoints, tables, points d'attention) **+** le chapitre correspondant de `docs/manuel/` si le comportement visible a changé.<br>⚠ Onglets/route/tables viennent du **manifeste** de `scripts_doc/gen_module_fiches.mjs` : les modifier **là**, puis `node scripts_doc/gen_module_fiches.mjs`. Le script est **non destructif** (il ne régénère que les blocs `<!-- auto:… -->`) — tout ce que vous écrivez autour est conservé. `--verifier` = contrôle sans écriture. |
| `src/index.tsx` (routes ajoutées/modifiées) | régénérer la réf API : `node scripts_doc/gen_api_ref.mjs` → `docs/technique/07-api-reference.md` |
| `src/auth.ts` (rôles/gating) | `docs/technique/04-auth-rbac.md` **+** les fiches de poste concernées (`docs/fiches-poste/`) |
| `src/queries.ts` + DDL (`scripts_import/*.sql`) | `docs/technique/03-base-de-donnees.md` (table nouvelle/colonnes → section du domaine) |
| `src/shared.ts` (sidebar, helpers UI) | `docs/technique/05-conventions-code.md` si un pattern réutilisable est né |
| **Champ de formulaire** ajouté/retiré, option de liste modifiée | `docs/manuel/formulaires/<service>.md` (tableau champ-par-champ) — mettre à jour la ligne du champ (libellé, Saisie, Obligatoire, explication) ; si `req`/options changent, corriger la colonne Obligatoire/les options |
| Workflow métier nouveau (ex. retour client) | chapitre manuel du/des service(s) + fiche(s) de poste des rôles impliqués |
| Déploiement/config | `docs/technique/02-exploitation-runbook.md` |

## 3. CHANGELOG (toujours)
Ajouter en tête de `docs/CHANGELOG.md` :
```markdown
## AAAA-MM-JJ — <titre court>
- <quoi / pourquoi, 1-3 puces>
- Fichiers : src/x.tsx, … · Migration DB : oui/non (scripts_import/…)
- Doc mise à jour : technique/06-modules/x.md, manuel/x.md · Captures à refaire : oui/non
```

## 4. Captures d'écran (si l'UI visible a changé)
- Repérer les captures obsolètes : `docs/assets/<service>-*.png`.
- Les régénérer si un serveur local est possible : skill **erp-screenshots** (`node scripts_doc/capture_screens.mjs --only <service>`).
- Sinon, marquer `> ⚠ capture à rafraîchir` sous l'image dans la doc — ne jamais laisser une capture mensongère sans avertissement.

## 5. Vérifications de sortie
```bash
node scripts_doc/lint_docs.mjs      # aucune image référencée manquante, aucun lien interne cassé
```
- La memory du projet est-elle à jour (fichier du sujet + MEMORY.md) ?
- Le commit inclut code **et** doc (même commit ou commit doc immédiatement après).

## Ce que ce skill ne fait PAS
Réécrire la doc entière. Il synchronise les deltas. Si un module n'a pas encore de fiche, la créer sur le modèle des autres fiches de `docs/technique/06-modules/`.
