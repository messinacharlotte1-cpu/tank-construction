-- Tank Construction — 0006 : RBAC par rôle + RLS contrats + users démo. Idempotent.

-- ── Rôle du user courant ──────────────────────────────────
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.users where id = auth.uid()::text;
$$;

-- ── RLS Contrats : lecture tenant, écriture réservée à certains rôles (RBAC) ──
alter table "contrats" enable row level security;

drop policy if exists contrats_read on public.contrats;
create policy contrats_read on public.contrats for select to authenticated
  using ("tenantId" = public.current_tenant());

drop policy if exists contrats_write on public.contrats;
create policy contrats_write on public.contrats for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'));

-- ── Users démo supplémentaires (rôles distincts) ──────────
-- DÉMO — mdp commun TankDemo2026!. Le trigger provisionne en DIRECTION, on corrige le rôle ensuite.
do $$
declare u record; uid uuid;
begin
  for u in select * from (values ('commercial@tank.cm'), ('terrain@tank.cm')) as t(email) loop
    if not exists (select 1 from auth.users where email = u.email) then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', u.email, crypt('TankDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '', '');
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (uid::text, uid, json_build_object('sub', uid::text, 'email', u.email)::jsonb, 'email', now(), now(), now());
    end if;
  end loop;
end $$;

update public.users set role = 'COMMERCIAL' where email = 'commercial@tank.cm';
update public.users set role = 'TERRAIN' where email = 'terrain@tank.cm';

-- ── Contrat démo (modèle indicatif) ───────────────────────
insert into public.contrats (id, "tenantId", reference, type, client, objet, montant, "templateVersion", "statutSignature", "reservationId", "createdAt") values
  ('00000000-0000-0000-0000-0000000000k1', '00000000-0000-0000-0000-000000000001', 'CONT-2026-001', 'VEFA', 'M. Nkomo Bernard', 'Réservation lot L-A101 — Résidence Mekoumbou City', 42000000, 'v0-indicatif', 'Projet', '00000000-0000-0000-0000-000000000f21', now())
on conflict (id) do nothing;
