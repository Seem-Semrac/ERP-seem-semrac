---
name: erp-deploy
description: Déploiement de l'ERP en production — build Vite puis Cloudflare Pages (wrangler ou glisser-déposer) aujourd'hui, cible Docker auto-hébergé (voir docs/ROADMAP-2mois.md), et checklist post-déploiement. À invoquer quand l'utilisateur veut mettre en ligne.
---

# erp-deploy — Mise en production

## Règle d'or
On ne déploie **QUE `dist/`** (3 fichiers : `_worker.js`, `_routes.json`, `static/style.css`) — jamais `node_modules`, jamais les sources. Le worker embarque tout (DB en dur → zéro variable d'env obligatoire, choix bêta assumé).

## Cloudflare Pages (cible principale)
```bash
cd "E:/ERP derniere version"
rtk npm run build
npx wrangler pages deploy dist --project-name=seem-semrac-erp
```
Alternative sans CLI : dashboard Cloudflare → Pages → le projet → **glisser-déposer le dossier `dist/`**.
- ⚠ Créer un projet **Pages**, pas un Worker : un Worker « workers.dev » créé à la main ne sert pas `_worker.js` de la même façon (erreur « nothing here yet » déjà vécue).
- `_routes.json` n'est pas pris en charge par l'upload dashboard → préférer wrangler si possible ; sinon le retirer est acceptable (tout passe par le worker).
- **Pas de mise à jour auto** : chaque modification → rebuild → redéployer.

## Cible : Docker auto-hébergé
La direction retenue est l'**auto-hébergement complet** (stack Supabase + app + N8N en Docker sur serveur propre) — voir la feuille de route `docs/ROADMAP-2mois.md` (objectif 7). Le code est portable (dépend seulement de `fetch` + client Supabase), donc l'app se conteneurise sans réécriture. Netlify a été **retiré** du projet (variante non retenue).

## Durcissement optionnel (prod sérieuse)
Le build embarque un secret JWT et le compte de secours `ADMIN/246810` (décision bêta zéro-config). Pour durcir : poser `JWT_SECRET` (et les variables bootstrap) dans les variables d'environnement Cloudflare Pages → elles priment sur les valeurs intégrées.

## Checklist post-déploiement (2 minutes)
1. Ouvrir l'URL → la page de login s'affiche (pas de 502/blank).
2. Se connecter (compte réel ou ADMIN) → l'accueil et la sidebar se chargent.
3. Ouvrir 1 page de service qui lit la DB (ex. `/qualite/service`) → les données remontent (sinon : Supabase en pause → restaurer).
4. Vérifier une écriture anodine si une migration DB vient d'être faite.
