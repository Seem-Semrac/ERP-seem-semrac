---
name: erp-verify
description: Vérification complète du code ERP après toute modification de src/ — typecheck, build, harnais de syntaxe des scripts clients de toutes les pages, e2e des endpoints via app.request, sondes REST Supabase. À invoquer avant tout commit.
---

# erp-verify — Boucle de vérification du dépôt

Motif observé 462× sur les sessions passées. **Toujours dérouler dans cet ordre** (du moins cher au plus cher) et s'arrêter au premier rouge.

## 1. Typecheck + build (obligatoire, toujours)
```bash
cd "E:/ERP derniere version"
rtk tsc                                  # attendu : « No errors found »
rtk npm run build                        # attendu : « ✓ built » (produit dist/)
```

## 2. Harnais toutes-pages (obligatoire si un .tsx a changé)
```bash
node scripts_doc/harness_all_pages.mjs   # attendu : « N PASS · 0 FAIL »
```
Rend chaque `page*` exporté avec des données factices et fait `new Function()` sur chaque `<script>` client. C'est **l'oracle de la classe de bug la plus fréquente du dépôt** : échappements cassés dans les templates TSX (`\'` au lieu de `\\'`, `\n` au lieu de `\\n` dans les chaînes destinées au JS client). En cas de FAIL, extraire le script fautif dans un fichier et `node --check` donne ligne+colonne exactes.

## 3. E2e d'un endpoint (si logique serveur modifiée)
`src/index.tsx` fait `export default app` → testable sans serveur :
```bash
cat > _e2e.ts <<'EOF'
import app from './src/index'
;(async()=>{
  const r = await app.request('/api/CHEMIN', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...})}, {AUTH_ENFORCE:'off'} as any)
  console.log(r.status, JSON.stringify(await r.json()))
})()
EOF
npx esbuild _e2e.ts --bundle --platform=node --format=esm --outfile="$TMP/e2e.mjs" --log-level=error && node "$TMP/e2e.mjs"; rm -f _e2e.ts
```
Le 3ᵉ argument `{AUTH_ENFORCE:'off'}` est l'env Cloudflare → désactive le gating pour le test.

## 4. Sondes REST Supabase (vérifier les effets en base)
Clé anon dans `src/db.ts`. **Toujours envoyer `User-Agent: Mozilla/5.0`** (sinon 403 aléatoires).
```python
# python - <<'PY' ... PY   (PYTHONIOENCODING=utf-8)
B='https://<ref>.supabase.co/rest/v1/'
h={'apikey':KEY,'Authorization':'Bearer '+KEY,'User-Agent':'Mozilla/5.0'}
# GET B+'table?select=...&id=eq.X'  → relire ce que l'endpoint a écrit
```

## 5. Nettoyage (OBLIGATOIRE)
Toute donnée créée par un test (préfixe conseillé : `-TEST-`) doit être supprimée par DELETE REST à la fin. Ne jamais laisser de données de test en base — c'est la base de production.

⚠ **Exception : `nomenclature_journal`** (journal EN 9100) est **en ajout seul** — un DELETE REST y est refusé, et rien ne l'efface. Un test qui valide, modifie ou supprime une nomenclature **validée** doit tourner contre le **Docker** (`SUPABASE_URL=http://127.0.0.1:8000`), jamais contre le cloud, puis purger ses entrées en superutilisateur (procédure : `docs/technique/02-exploitation-runbook.md`).

## Règles
- Jamais de commit si une étape est rouge.
- Ne PAS inventer de données de démo pour « faire joli » — interdit dans ce projet.
- Après vérification verte → invoquer **erp-doc-sync** puis committer.
