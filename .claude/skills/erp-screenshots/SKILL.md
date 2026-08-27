---
name: erp-screenshots
description: Produire/rafraîchir les captures d'écran réelles de la documentation (manuel utilisateur, fiches de poste) — build, serveur local, capture automatisée Playwright de chaque service/onglet vers docs/assets/. À invoquer quand l'UI a changé ou pour documenter un nouveau module.
---

# erp-screenshots — Captures d'écran automatisées

## Prérequis
1. **Supabase actif** (le projet gratuit s'auto-met en pause) : si les pages sont vides/en erreur, demander à l'utilisateur de restaurer le projet dans le dashboard Supabase avant de capturer.
2. **Playwright** (première fois seulement) : `npx playwright install chromium`.

## Procédure
```bash
cd "E:/ERP derniere version"
rtk npm run build                                        # le serveur sert dist/ (PAS de HMR)
npx wrangler pages dev dist --port 8788                  # en arrière-plan (ou preview_start « ERP Dev Server »)
node scripts_doc/capture_screens.mjs                     # tout le manifeste (~2-4 min)
node scripts_doc/capture_screens.mjs --only qualite      # un seul service
node scripts_doc/capture_screens.mjs --list              # voir le manifeste
```
- Le script se connecte via `POST /api/login` (compte `ADMIN`, PIN bootstrap `246810`), pose le cookie de session, déroule le **manifeste** (déclaré en tête de `capture_screens.mjs` : route → onglets à cliquer → nom de fichier), viewport 1600×900.
- Sortie : `docs/assets/<service>-<onglet>.png` — **noms stables** : la doc les référence tels quels, régénérer ne casse aucun lien.

## Ajouter une capture au manifeste
Éditer le tableau `MANIFEST` de `scripts_doc/capture_screens.mjs` :
```js
{ file:'qualite-nc', path:'/qualite/service', clicks:['#qual-tab-nc'], wait:600 }
```
`clicks` = sélecteurs CSS cliqués en séquence (onglets, sous-onglets, boutons de modale) ; `wait` = ms après le dernier clic.

## Après capture
- Vérifier visuellement 2-3 PNG (taille > 30 Ko ; une page blanche/login = session non posée → re-vérifier le login).
- `node scripts_doc/lint_docs.mjs` → aucune image référencée manquante.
- ⚠ Ne jamais capturer un écran contenant des données sensibles réelles (PIN, salaires RH) sans accord — préférer les onglets neutres.

## Panne fréquente
| Symptôme | Cause / remède |
|---|---|
| PNG = page de login | cookie non posé → le POST /api/login a échoué (Supabase en pause ? mauvais PIN ?) |
| Pages sans données | Supabase en pause → restaurer puis relancer |
| `wrangler` ne démarre pas | `dist/` absent → relancer `npm run build` |
| Timeout Playwright | augmenter `wait` du manifeste (pages lourdes : dashboards) |
