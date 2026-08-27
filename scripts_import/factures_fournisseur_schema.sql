-- Factures fournisseurs / sous-traitants (compta). Table créée jadis côté cloud sans DDL versionné ;
-- on la versionne ici et on la crée dans la base Docker (dev). Sert aussi à l'échéancier Énergie/EDF (compte 606300).
create table if not exists public.factures_fournisseur (
  id text primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  num_facture text,
  type text default 'fournisseur',
  fournisseur_nom text,
  date_facture date,
  date_echeance date,
  montant_ht numeric,
  tva_pct numeric,
  montant_tva numeric,
  montant_ttc numeric,
  statut text default 'a_valider',
  date_paiement date,
  mode_paiement text,
  compte_charge text,
  notes text
);
alter table public.factures_fournisseur enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='factures_fournisseur' and policyname='factures_fournisseur_all') then
    create policy factures_fournisseur_all on public.factures_fournisseur for all using (true) with check (true);
  end if;
end $$;
notify pgrst, 'reload schema';
