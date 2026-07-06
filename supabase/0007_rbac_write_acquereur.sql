-- Tank Construction — 0007 : RLS write par rôle (plus de tables) + comptes acquéreurs. Idempotent.

-- ── ACQUEREUR isolé : exclu de tout accès tenant (current_tenant() = NULL pour lui) ──
create or replace function public.current_tenant()
returns text language sql stable security definer set search_path = public as $$
  select "tenantId" from public.users where id = auth.uid()::text and role <> 'ACQUEREUR';
$$;

-- ── Helper : write policy = tenant + rôle dans la liste ──
-- (implémenté table par table ci-dessous : read = tenant, write = tenant + rôle)

-- Chantiers / Articles : rôles opérationnels
drop policy if exists chantiers_tenant on public.chantiers;
drop policy if exists chantiers_read on public.chantiers;
create policy chantiers_read on public.chantiers for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists chantiers_write on public.chantiers;
create policy chantiers_write on public.chantiers for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'));

drop policy if exists articles_tenant on public.articles;
drop policy if exists articles_read on public.articles;
create policy articles_read on public.articles for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists articles_write on public.articles;
create policy articles_write on public.articles for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER'));

-- Devis : commercial / compta
drop policy if exists devis_tenant on public.devis;
drop policy if exists devis_read on public.devis;
create policy devis_read on public.devis for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists devis_write on public.devis;
create policy devis_write on public.devis for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL','COMPTA'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL','COMPTA'));

-- Factures : compta
drop policy if exists factures_tenant on public.factures;
drop policy if exists factures_read on public.factures;
create policy factures_read on public.factures for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists factures_write on public.factures;
create policy factures_write on public.factures for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMPTA'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMPTA'));

-- Programmes / Réservations / Appels : promotion (commercial)
drop policy if exists programmes_tenant on public.programmes;
drop policy if exists programmes_read on public.programmes;
create policy programmes_read on public.programmes for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists programmes_write on public.programmes;
create policy programmes_write on public.programmes for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'));

drop policy if exists reservations_tenant on public.reservations;
drop policy if exists reservations_read on public.reservations;
create policy reservations_read on public.reservations for select to authenticated
  using (exists (select 1 from public.lots_immo l join public.programmes p on p.id = l."programmeId" where l.id = "lotImmoId" and p."tenantId" = public.current_tenant()));
drop policy if exists reservations_write on public.reservations;
create policy reservations_write on public.reservations for all to authenticated
  using (public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL') and exists (select 1 from public.lots_immo l join public.programmes p on p.id = l."programmeId" where l.id = "lotImmoId" and p."tenantId" = public.current_tenant()))
  with check (public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL') and exists (select 1 from public.lots_immo l join public.programmes p on p.id = l."programmeId" where l.id = "lotImmoId" and p."tenantId" = public.current_tenant()));

drop policy if exists appels_tenant on public.appels_de_fonds;
drop policy if exists appels_read on public.appels_de_fonds;
create policy appels_read on public.appels_de_fonds for select to authenticated
  using (exists (select 1 from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" join public.programmes p on p.id = l."programmeId" where r.id = "reservationId" and p."tenantId" = public.current_tenant()));
drop policy if exists appels_write on public.appels_de_fonds;
create policy appels_write on public.appels_de_fonds for all to authenticated
  using (public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL') and exists (select 1 from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" join public.programmes p on p.id = l."programmeId" where r.id = "reservationId" and p."tenantId" = public.current_tenant()))
  with check (public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL') and exists (select 1 from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" join public.programmes p on p.id = l."programmeId" where r.id = "reservationId" and p."tenantId" = public.current_tenant()));

-- ── Self-access ACQUEREUR (lecture seule, scopée à SA réservation) ──
drop policy if exists reservations_self on public.reservations;
create policy reservations_self on public.reservations for select to authenticated
  using ("userId" = auth.uid()::text);

drop policy if exists appels_self on public.appels_de_fonds;
create policy appels_self on public.appels_de_fonds for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = "reservationId" and r."userId" = auth.uid()::text));

drop policy if exists contrats_self on public.contrats;
create policy contrats_self on public.contrats for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = public.contrats."reservationId" and r."userId" = auth.uid()::text));

drop policy if exists lots_immo_self on public.lots_immo;
create policy lots_immo_self on public.lots_immo for select to authenticated
  using (exists (select 1 from public.reservations r where r."lotImmoId" = public.lots_immo.id and r."userId" = auth.uid()::text));

drop policy if exists programmes_self on public.programmes;
create policy programmes_self on public.programmes for select to authenticated
  using (exists (select 1 from public.lots_immo l join public.reservations r on r."lotImmoId" = l.id where l."programmeId" = public.programmes.id and r."userId" = auth.uid()::text));

-- ── Compte acquéreur démo + rattachement ──
do $$
declare uid uuid;
begin
  if not exists (select 1 from auth.users where email = 'acquereur@tank.cm') then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'acquereur@tank.cm', crypt('TankDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"nom":"M. Nkomo Bernard"}'::jsonb, '', '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (uid::text, uid, json_build_object('sub', uid::text, 'email', 'acquereur@tank.cm')::jsonb, 'email', now(), now(), now());
  end if;
end $$;

update public.users set role = 'ACQUEREUR' where email = 'acquereur@tank.cm';
update public.reservations set "userId" = (select id from public.users where email = 'acquereur@tank.cm')
  where id = '00000000-0000-0000-0000-000000000f21';
