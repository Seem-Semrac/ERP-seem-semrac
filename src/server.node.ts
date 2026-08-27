// ══════════════════════════════════════════════════════════════
// POINT D'ENTRÉE NODE — ERP Seem Semrac (conteneur Docker)
// ──────────────────────────────────────────────────────────────
// L'app (src/index.tsx) est écrite pour Cloudflare Pages (runtime Workers) :
//   • la config arrive via `c.env` (injecté par Cloudflare) ;
//   • les fichiers statiques sont servis par `hono/cloudflare-workers`.
// Sous Node, ni l'un ni l'autre n'existe. Ce wrapper comble les deux :
//   1. il injecte `process.env` dans `c.env` (pour AUTH_ENFORCE, JWT_SECRET…) ;
//   2. il sert /static/* via @hono/node-server AVANT de déléguer à l'app ;
//   3. il écoute sur PORT (défaut 3000).
// Le fichier src/index.tsx n'est PAS modifié → aucune régression sur Cloudflare.
// ══════════════════════════════════════════════════════════════
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import app from './index'

const root = new Hono()

// 1) Config : Cloudflare peuple c.env tout seul, Node non. On y met process.env.
root.use('*', async (c, next) => {
  ;(c as any).env = process.env
  await next()
})

// 2) Fichiers statiques : /static/style.css → ./public/static/style.css
//    (sert AVANT l'app ; le handler cloudflare-workers de index.tsx ne sera
//     atteint que si le fichier n'existe pas, ce qui est sans conséquence).
root.use('/static/*', serveStatic({ root: './public' }))

// 3) Le reste = l'application ERP complète.
root.route('/', app)

const port = Number(process.env.PORT || 3000)
serve({ fetch: root.fetch, port }, (info) => {
  console.log(`[ERP] Node/Hono en écoute sur http://0.0.0.0:${info.port}`)
  console.log(`[ERP] Supabase       : ${process.env.SUPABASE_URL || '(cloud par défaut)'}`)
  console.log(`[ERP] AUTH_ENFORCE   : ${process.env.AUTH_ENFORCE ?? 'on'}`)
})
