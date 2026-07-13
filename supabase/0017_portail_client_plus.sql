-- Tank Construction — 0017 : enrichissement portail client. Idempotent.
--  • Données personnelles éditables par le client (RPC DEFINER, colonnes verrouillées).
--  • Fil d'échange client ↔ équipe commerciale (table + pièce jointe Storage).

-- ── Colonnes profil (filet idempotent, sinon créées par prisma db push) ──
alter table public.users add column if not exists telephone text;
alter table public.users add column if not exists adresse   text;

-- ── RPC : le client met à jour SES coordonnées (jamais rôle/tenant/email) ──
create or replace function public.update_my_profile(p_nom text, p_telephone text, p_adresse text)
returns void language sql security definer set search_path = public as $$
  update public.users
     set nom = coalesce(nullif(btrim(p_nom), ''), nom),
         telephone = p_telephone,
         adresse   = p_adresse
   where id = auth.uid()::text;
$$;
revoke all on function public.update_my_profile(text, text, text) from public, anon;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

-- ── Helper : tenant du client (via son chantier OU son programme) ──
create or replace function public.app_my_tenant()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select "tenantId" from public.chantiers where "userId" = auth.uid()::text limit 1),
    (select p."tenantId" from public.reservations r
       join public.lots_immo l on l.id = r."lotImmoId"
       join public.programmes p on p.id = l."programmeId"
      where r."userId" = auth.uid()::text limit 1)
  );
$$;

-- ── Fil d'échange client ↔ agence ──
create table if not exists public.client_messages (
  id         text primary key,
  "userId"   text not null,
  "tenantId" text not null,
  auteur     text not null,
  nom        text not null,
  sujet      text,
  corps      text not null,
  "pieceUrl" text,
  "pieceNom" text,
  lu         boolean not null default false,
  "createdAt" timestamptz not null default now()
);
create index if not exists client_messages_userId_idx on public.client_messages ("userId");
create index if not exists client_messages_tenantId_idx on public.client_messages ("tenantId");
alter table public.client_messages enable row level security;

-- Client : lit son fil, écrit ses messages (auteur = 'client', rattaché à lui) ──
drop policy if exists client_messages_self_read on public.client_messages;
create policy client_messages_self_read on public.client_messages for select to authenticated
  using ("userId" = auth.uid()::text);

drop policy if exists client_messages_self_insert on public.client_messages;
create policy client_messages_self_insert on public.client_messages for insert to authenticated
  with check ("userId" = auth.uid()::text and auteur = 'client' and "tenantId" = public.app_my_tenant());

drop policy if exists client_messages_self_seen on public.client_messages;
create policy client_messages_self_seen on public.client_messages for update to authenticated
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

-- Agence (staff) : lit/répond dans son tenant ──
drop policy if exists client_messages_staff_read on public.client_messages;
create policy client_messages_staff_read on public.client_messages for select to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'));

drop policy if exists client_messages_staff_write on public.client_messages;
create policy client_messages_staff_write on public.client_messages for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'));

-- ── Bucket Storage `portail-client` : pièces jointes, une par dossier = auth.uid ──
insert into storage.buckets (id, name, public) values ('portail-client', 'portail-client', true)
on conflict (id) do nothing;

-- Client : écrit/lit uniquement dans son dossier ; staff : lit tout le bucket.
drop policy if exists portail_client_insert on storage.objects;
create policy portail_client_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portail-client' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists portail_client_select on storage.objects;
create policy portail_client_select on storage.objects for select to authenticated
  using (bucket_id = 'portail-client'
     and ((storage.foldername(name))[1] = auth.uid()::text
          or public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL')));

-- ── RPC : le client envoie un message (tenant résolu côté serveur — client isolé) ──
create or replace function public.send_client_message(p_sujet text, p_corps text, p_piece_url text, p_piece_nom text)
returns void language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if nullif(btrim(p_corps), '') is null then raise exception 'message vide'; end if;
  t := public.app_my_tenant();
  if t is null then raise exception 'aucun projet rattaché'; end if;
  insert into public.client_messages (id, "userId", "tenantId", auteur, nom, sujet, corps, "pieceUrl", "pieceNom")
  values (gen_random_uuid()::text, auth.uid()::text, t, 'client',
          coalesce((select nom from public.users where id = auth.uid()::text), 'Client'),
          nullif(btrim(p_sujet), ''), btrim(p_corps), p_piece_url, p_piece_nom);
end $$;
revoke all on function public.send_client_message(text, text, text, text) from public, anon;
grant execute on function public.send_client_message(text, text, text, text) to authenticated;
