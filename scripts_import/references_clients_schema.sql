-- Répertoire des correspondances client : réf interne (nous) ↔ client ↔ réf client ↔ plan.
-- Source de vérité DDL. Sert 3 surfaces : DT (auto-recherche bidirectionnelle),
-- nomenclature (« Clients & réfs » de la pièce), fiche client (« Produits commandés »).
-- Alimenté automatiquement à la validation d'une DT (index.tsx /api/dt/:id/valider).

create table if not exists public.references_clients (
  id            uuid primary key default gen_random_uuid(),
  code_ref_interne text not null,     -- NOTRE réf pièce (= nomenclatures.code_ref_produit)
  client_id     text,
  client_nom    text,
  ref_client    text,                 -- la réf de la pièce CHEZ le client
  num_plan      text,                 -- n°/nom du plan client
  plan_doc_id   uuid,                 -- fichier plan (documents.id) → ouvrable via /api/ged/file/:id
  nomenclature_id text,               -- lien souple vers la nomenclature
  entite        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- une réf interne pour un client donné = une seule ligne (base de l'upsert applicatif)
create unique index if not exists uniq_refcli
  on public.references_clients (lower(code_ref_interne), coalesce(client_id,''), coalesce(lower(ref_client),''));
create index if not exists idx_refcli_client    on public.references_clients (client_id);
create index if not exists idx_refcli_refclient on public.references_clients (lower(ref_client));
create index if not exists idx_refcli_interne   on public.references_clients (lower(code_ref_interne));

-- RLS permissive (posture assumée, cf. docs/technique/08-securite.md)
alter table public.references_clients enable row level security;
create policy references_clients_all on public.references_clients for all using (true) with check (true);

notify pgrst, 'reload schema';
