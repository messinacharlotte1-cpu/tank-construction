-- Tank Construction — 0012 : réserves OPR + médias + bucket Storage. Idempotent.

alter table "reserves" enable row level security;
alter table "medias"   enable row level security;

-- Réserves : lecture tenant / écriture rôles ops
drop policy if exists reserves_read on public.reserves;
create policy reserves_read on public.reserves for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists reserves_write on public.reserves;
create policy reserves_write on public.reserves for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'));

-- Médias : lecture tenant / écriture rôles ops
drop policy if exists medias_read on public.medias;
create policy medias_read on public.medias for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists medias_write on public.medias;
create policy medias_write on public.medias for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'));

-- ── Bucket Storage `medias` (public en lecture) ───────────
insert into storage.buckets (id, name, public) values ('medias', 'medias', true)
on conflict (id) do nothing;

-- Upload/lecture réservés aux utilisateurs connectés (lecture publique via URL publique du bucket)
drop policy if exists medias_storage_insert on storage.objects;
create policy medias_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'medias');
drop policy if exists medias_storage_select on storage.objects;
create policy medias_storage_select on storage.objects for select to authenticated using (bucket_id = 'medias');
drop policy if exists medias_storage_delete on storage.objects;
create policy medias_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'medias');

-- ── Démo réserves ─────────────────────────────────────────
insert into public.reserves (id, "tenantId", chantier, localisation, description, entreprise, statut, echeance, "createdAt") values
  ('00000000-0000-0000-0000-000000000x01', '00000000-0000-0000-0000-000000000001', 'Immeuble R+4 Bastos', 'R+1 — mur nord', 'Fissure sur enduit à reprendre', 'SARL BâtiPlus', 'Ouverte', now() + interval '10 days', now()),
  ('00000000-0000-0000-0000-000000000x02', '00000000-0000-0000-0000-000000000001', 'Villa duplex Bonapriso', 'Salle de bain RDC', 'Joint de carrelage à refaire', 'Électro-CM', 'Levée', null, now())
on conflict (id) do nothing;
