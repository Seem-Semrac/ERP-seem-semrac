# Sécurité — posture & signalement

> ERP interne (SSR Hono + Supabase + Cloudflare Pages). Ce document décrit la posture de sécurité **assumée et documentée** du projet, pour un mainteneur ou un auditeur externe.

## Posture

- **SSR strict** : la clé Supabase `anon` est utilisée **exclusivement côté serveur** (worker Cloudflare / conteneur Node). Elle n'est **jamais envoyée au navigateur**. Détails : `docs/technique/08-securite.md`.
- **Authentification en production** : `AUTH_ENFORCE=on` — accès par **login matricule + PIN** (PIN hachés PBKDF2), sessions **JWT signées** (cookie), RBAC **13 rôles × 15 services** (`src/auth.ts`).
- **Secrets hors dépôt** : `.env`, `docker/.env`, `.dev.vars` sont **gitignorés** ; les secrets prod sont des **secrets Cloudflare Pages** ; le **PAT Supabase** n'est **jamais** committé. Voir `docs/technique/10-variables-environnement.md`.
- **Données réelles hors dépôt** : les données métier (clients, fournisseurs, salariés) vivent dans la base ; elles ne sont **pas** dans GitHub (les fichiers d'import contenant des données réelles sont gitignorés).

## Points connus (transparence pour l'auditeur)

| Élément | Risque | Mitigation |
|---|---|---|
| Clé `anon` + URL cloud committées (`wrangler.jsonc`, `src/db.ts`) | Accès PostgREST à la base cloud pour qui a le dépôt | Posture assumée ; **roter la clé après tout partage externe** ; durcir le RLS |
| `JWT_SECRET` / `BOOTSTRAP_PIN` : replis committés | Jetons forgeables / PIN par défaut **si les secrets prod ne sont pas posés** | **Poser les secrets Cloudflare** (cf. `docs/technique/10` §1) |
| RLS Supabase permissive (`anon` R/W) | Écriture directe possible via l'API | Durcissement RLS prévu ; l'app reste la voie normale |
| Pas de suite de tests automatisés | Régressions | Harnais `harness_all_pages.mjs` + e2e manuels ; tests à ajouter |

## Signalement d'une vulnérabilité

Contact interne : **invite.seem-semrac@outlook.com**. Merci de ne pas divulguer publiquement avant correction.

## Avant / après un partage externe du dépôt

Voir la check-list dans **`docs/technique/11-audit-externe-preliminaire.md`** (poser les secrets ; retirer les données réelles ; accès lecture seule ; roter la clé anon + le PIN après).
