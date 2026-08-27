// ══════════════════════════════════════════════════════════════
// CLIENT SUPABASE – ERP Seem Semrac v2.0
// ══════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

// ─── Cible Supabase ───────────────────────────────────────────
// Par DÉFAUT : l'instance cloud de production (posture assumée, clé anon publique).
// EN CONTENEUR NODE (Docker) : surchargée par les variables d'environnement
//   SUPABASE_URL / SUPABASE_ANON_KEY (voir docker/.env + src/server.node.ts).
// Sur Cloudflare Workers, `process.env` n'est PAS peuplé par les `vars` wrangler
// (elles arrivent via `c.env`) → on retombe automatiquement sur les constantes cloud
// ci-dessous : le comportement en production Cloudflare reste STRICTEMENT inchangé.
function envVar(name: string): string | undefined {
  try {
    // globalThis.process existe sous Node (conteneur) et sous nodejs_compat.
    const p = (globalThis as any).process
    const v = p && p.env ? p.env[name] : undefined
    return v ? String(v) : undefined
  } catch { return undefined }
}

const SUPABASE_URL = envVar('SUPABASE_URL') || 'https://vyqgrasezpyqjwvijwvv.supabase.co'
const SUPABASE_ANON_KEY = envVar('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── HELPERS TYPÉS ────────────────────────────────────────────

export const db = {
  shifts:           () => supabase.from('shifts'),
  clients:          () => supabase.from('clients'),
  operateurs:       () => supabase.from('operateurs'),
  machines:         () => supabase.from('machines'),
  absences:         () => supabase.from('absences'),
  demandesTravaux:  () => supabase.from('demandes_travaux'),
  offres:           () => supabase.from('offres'),
  commandes:        () => supabase.from('commandes'),
  lots:             () => supabase.from('lots'),
  bonsDeTravail:    () => supabase.from('bons_de_travail'),
  credits:          () => supabase.from('credits'),
  demandesAchat:    () => supabase.from('demandes_achat'),
  nonConformites:   () => supabase.from('non_conformites'),
  bonsDeLivraison:  () => supabase.from('bons_de_livraison'),
  habilitations:    () => supabase.from('habilitations'),
  fournisseursSt:   () => supabase.from('fournisseurs_st'),
  demandesSite:     () => supabase.from('demandes_site'),
}

// ─── EXEMPLES D'UTILISATION ───────────────────────────────────
//
// Lire tous les clients :
//   const { data, error } = await db.clients().select('*')
//
// Lire les BDT d'un opérateur :
//   const { data } = await db.bonsDeTravail().select('*').eq('operateur_id', 'op1')
//
// Insérer une DT :
//   const { data } = await db.demandesTravaux().insert({ id: 'DT-2026-xxx', ... }).select()
//
// Mettre à jour le statut d'une commande :
//   await db.commandes().update({ statut: 'en_production' }).eq('id', 'CMD-2026-1277')
