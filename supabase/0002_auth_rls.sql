-- Tank Construction — 0002 : auth mapping + RLS tenant-scopée (module Chantiers).
-- À exécuter APRÈS 0001 (prisma db push) + rls.sql. Idempotent.
-- Modèle : un utilisateur Supabase Auth (auth.users.id) = public.users.id, rattaché à un tenant.

create extension if not exists pgcrypto;

-- ── Tenant de démonstration ───────────────────────────────
insert into public.tenants (id, nom)
values ('00000000-0000-0000-0000-000000000001', 'Tank Construction SARL')
on conflict (id) do nothing;

-- ── Helper : tenant du user courant (JWT auth.uid) ────────
-- NB : les ids sont des colonnes text (Prisma String) → cast auth.uid()::text.
create or replace function public.current_tenant()
returns text
language sql stable security definer set search_path = public as $$
  select "tenantId" from public.users where id = auth.uid()::text;
$$;

-- ── Provisioning auto à l'inscription Supabase Auth ───────
-- Rattache tout nouvel utilisateur au tenant démo (rôle DIRECTION pour la démo).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, "tenantId", email, nom, role, acces, actif)
  values (
    new.id::text,
    '00000000-0000-0000-0000-000000000001',
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    'DIRECTION', 'EMAIL_2FA', true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── RLS : users peut lire sa propre fiche ─────────────────
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select to authenticated
  using (id = auth.uid()::text);

-- ── RLS : Chantiers scopés au tenant courant ──────────────
drop policy if exists chantiers_tenant on public.chantiers;
create policy chantiers_tenant on public.chantiers
  for all to authenticated
  using ("tenantId" = public.current_tenant())
  with check ("tenantId" = public.current_tenant());

-- ── RLS : enfants (tâches/jalons/pointages) via le chantier parent ──
drop policy if exists taches_tenant on public.taches;
create policy taches_tenant on public.taches
  for all to authenticated
  using (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()));

drop policy if exists jalons_tenant on public.jalons;
create policy jalons_tenant on public.jalons
  for all to authenticated
  using (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()));

drop policy if exists pointages_tenant on public.pointages;
create policy pointages_tenant on public.pointages
  for all to authenticated
  using (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.chantiers c where c.id = "chantierId" and c."tenantId" = public.current_tenant()));

-- ── Données de démo (chantiers du tenant démo) ────────────
insert into public.chantiers (id, "tenantId", nom, client, ville, statut, budget, consomme, "avancementPrevu", "avancementReel")
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Immeuble R+4 Bastos', 'SCI Horizon', 'Yaoundé', 'EN_COURS', 185000000, 112400000, 68, 61),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Villa duplex Bonapriso', 'M. Ekambi Jules', 'Douala', 'EN_COURS', 78000000, 31200000, 42, 45),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Entrepôt logistique Nsam', 'CamerLog SARL', 'Yaoundé', 'EN_RETARD', 95000000, 88700000, 100, 86)
on conflict (id) do nothing;
