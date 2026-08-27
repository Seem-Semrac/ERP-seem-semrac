# ERP Seem Semrac

ERP GPAO (gestion de production) pour Seem/Semrac — usinage & traitement de surface, exigences **EN 9100:2018 / ISO 9001:2015**. Application **SSR Hono** (TSX côté serveur) sur **Cloudflare Pages**, base **Supabase**.

15 services · 13 rôles · ~290 routes · ~41 000 lignes. **Cible : auto-hébergement Docker** (Supabase + app + N8N) — voir [`docs/ROADMAP-2mois.md`](docs/ROADMAP-2mois.md) (version visuelle : [`docs/ROADMAP-2mois-infographie.html`](docs/ROADMAP-2mois-infographie.html)).

## Structure du dépôt
```
src/            code de l'application (voir « Carte du code » plus bas)
docs/           TOUTE la documentation (technique · manuel · fiches-poste · parcours · formulaires · ROADMAP)
scripts_import/ schémas SQL (source de vérité DDL) + scripts d'import Python
scripts_doc/    outillage doc & vérification (harnais, captures, générateurs, recueils imprimables)
public/         fichiers statiques
.claude/        skills projet (erp-*) + config serveur local
package.json · tsconfig.json · vite.config.ts · wrangler.jsonc   (config à la racine, standard)
```

## Prérequis
**Node 22** (voir `.node-version`), **npm**. **Python 3** (facultatif : générateurs de doc `scripts_doc/*.py`, imports `scripts_import/*.py`). **Docker** (facultatif : stack auto-hébergée — voir ci-dessous).

## Démarrage rapide (Cloudflare dev)
```bash
npm install
npm run build                                   # -> dist/
npx wrangler pages dev dist --port 8788         # dev local (pas de HMR : rebuild pour voir un changement)
```
Connexion : **matricule + PIN**. Le compte de secours est défini par les secrets `BOOTSTRAP_MATRICULE` / `BOOTSTRAP_PIN` (jamais committés — voir [`docs/technique/10-variables-environnement.md`](docs/technique/10-variables-environnement.md)).

## Démarrage — stack Docker auto-hébergée (autonome)
```bash
cd docker && docker compose up -d --build       # ERP + Supabase local + n8n
```
ERP sur http://localhost:3000. Détails : [`docs/technique/12-docker-installation.md`](docs/technique/12-docker-installation.md) · [`docker/README.md`](docker/README.md).

## Déploiement
```bash
npm run build && npx wrangler pages deploy dist --project-name=seem-semrac-erp
```
On ne déploie que `dist/`. Détails : [`docs/technique/02-exploitation-runbook.md`](docs/technique/02-exploitation-runbook.md) et le skill `erp-deploy`.

## Documentation → [`docs/`](docs/)
| Public | Dossier |
|---|---|
| **Prestataire / dév** | [`docs/technique/`](docs/technique/00-README.md) — architecture, DB, RBAC, conventions, API, sécurité, audit |
| **Utilisateurs** | [`docs/manuel/`](docs/manuel/00-index.md) — guide pas-à-pas avec captures |
| **Formation par poste** | [`docs/fiches-poste/`](docs/fiches-poste/00-index.md) — une fiche par rôle |
| **Wiki (vue d'ensemble)** | [`cerveau application/`](cerveau%20application/README.md) — 7 briques Front/Back/DB/Docker/N8N/Maintenance/Utilisation |
| **Sécurité** | [`SECURITY.md`](SECURITY.md) · variables d'env [`docs/technique/10`](docs/technique/10-variables-environnement.md) |
| **Audit externe** | [`docs/technique/11-audit-externe-preliminaire.md`](docs/technique/11-audit-externe-preliminaire.md) — préparer une revue de maintenabilité |
| **Impression / PDF** | `docs/print/` (généré : `node scripts_doc/build_print.mjs`) |
| **Historique** | [`docs/CHANGELOG.md`](docs/CHANGELOG.md) |

## Carte du code (`src/`)
- `index.tsx` — routeur (pages + ~290 API) + middleware d'auth · `queries.ts` — accès Supabase · `auth.ts` — RBAC · `shared.ts` — layout/sidebar/helpers · `types.ts` — types métier.
- `<module>.tsx` — une page par service (commercial, be, prod, qualite, securite, …).
- `scripts_import/*.sql` — schémas DB (source de vérité DDL) · `scripts_doc/` — outillage doc & vérification.

## Développer proprement (voir `CLAUDE.md` + `.claude/skills/`)
```bash
# après toute modification :
rtk tsc && rtk npm run build                    # types + build
node scripts_doc/harness_all_pages.mjs          # syntaxe des scripts clients (bugs d'echappement)
node scripts_doc/refresh.mjs                    # regenere + verifie la doc (skill erp-doc-sync)
```
Skills disponibles : `erp-verify`, `erp-db`, `erp-deploy`, `erp-new-module`, `erp-doc-sync`, `erp-screenshots`.

## Scripts npm
| Script | Rôle |
|---|---|
| `npm run dev` | Vite (dév) |
| `npm run build` | Build → `dist/` |
| `npm run preview` | Sert `dist/` en local (wrangler) |
| `npm run verify` | **Avant commit** : types + build + harnais des scripts clients |
| `npm run docs` | Régénère et vérifie la documentation |
| `npm run deploy` | Build + déploiement Cloudflare Pages |
| `npm run cf-typegen` | Types Cloudflare |
