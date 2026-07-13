-- Tank Construction — 0016 : portail client, profil « maître d'ouvrage » (MO). Idempotent.
-- Modèle : un compte client (auth.uid) rattaché à un chantier (chantiers.userId).
-- Il lit EN SEULE LECTURE son/ses chantier(s), leurs médias et les factures à son nom.
-- Isolé du tenant (current_tenant() = NULL pour lui, comme ACQUEREUR).

-- ── Colonne de rattachement (créée par prisma db push, filet de sécurité idempotent) ──
alter table public.chantiers add column if not exists "userId" text;
create index if not exists chantiers_userId_idx on public.chantiers ("userId");

-- ── MO exclu de l'accès tenant (comme ACQUEREUR) ──
create or replace function public.current_tenant()
returns text language sql stable security definer set search_path = public as $$
  select "tenantId" from public.users where id = auth.uid()::text and role not in ('ACQUEREUR','MO');
$$;

-- ── Helpers DEFINER (lisent sans déclencher la RLS → pas de récursion) ──
create or replace function public.app_my_chantier_ids()
returns setof text language sql stable security definer set search_path = public as $$
  select id from public.chantiers where "userId" = auth.uid()::text;
$$;

create or replace function public.app_my_chantier_names()
returns setof text language sql stable security definer set search_path = public as $$
  select nom from public.chantiers where "userId" = auth.uid()::text;
$$;

create or replace function public.app_my_client_names()
returns setof text language sql stable security definer set search_path = public as $$
  select distinct client from public.chantiers where "userId" = auth.uid()::text;
$$;

-- ── Self-policies MO (lecture seule, scopée à SES chantiers) ──
drop policy if exists chantiers_self on public.chantiers;
create policy chantiers_self on public.chantiers for select to authenticated
  using ("userId" = auth.uid()::text);

drop policy if exists taches_self on public.taches;
create policy taches_self on public.taches for select to authenticated
  using ("chantierId" in (select public.app_my_chantier_ids()));

drop policy if exists jalons_self on public.jalons;
create policy jalons_self on public.jalons for select to authenticated
  using ("chantierId" in (select public.app_my_chantier_ids()));

-- Médias rattachés par NOM de chantier (colonne medias.chantier = chantiers.nom)
drop policy if exists medias_self on public.medias;
create policy medias_self on public.medias for select to authenticated
  using (chantier in (select public.app_my_chantier_names()));

-- Factures rattachées par NOM de client
drop policy if exists factures_self on public.factures;
create policy factures_self on public.factures for select to authenticated
  using (client in (select public.app_my_client_names()));

-- ── Compte MO démo + rattachement à un chantier existant ──
do $$
declare uid uuid;
begin
  if not exists (select 1 from auth.users where email = 'mo@tank.cm') then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'mo@tank.cm', crypt('TankDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"nom":"SCI Horizon"}'::jsonb, '', '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (uid::text, uid, json_build_object('sub', uid::text, 'email', 'mo@tank.cm')::jsonb, 'email', now(), now(), now());
  end if;
end $$;

update public.users set role = 'MO' where email = 'mo@tank.cm';

-- Rattache le chantier « Immeuble R+4 Bastos » (client SCI Horizon) au compte MO démo.
update public.chantiers set "userId" = (select id from public.users where email = 'mo@tank.cm')
  where id = '00000000-0000-0000-0000-0000000000a1';
