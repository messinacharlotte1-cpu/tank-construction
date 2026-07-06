-- Tank Construction — 0008 : casse la récursion RLS des self-policies acquéreur.
-- Les fonctions SECURITY DEFINER lisent sans déclencher la RLS (pas de cycle inter-tables).

create or replace function public.app_my_resa_ids()
returns setof text language sql stable security definer set search_path = public as $$
  select id from public.reservations where "userId" = auth.uid()::text;
$$;

create or replace function public.app_my_lot_ids()
returns setof text language sql stable security definer set search_path = public as $$
  select "lotImmoId" from public.reservations where "userId" = auth.uid()::text;
$$;

create or replace function public.app_my_prog_ids()
returns setof text language sql stable security definer set search_path = public as $$
  select l."programmeId" from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" where r."userId" = auth.uid()::text;
$$;

-- Self-policies acquéreur réécrites via les fonctions definer (plus de sous-requête RLS croisée)
drop policy if exists reservations_self on public.reservations;
create policy reservations_self on public.reservations for select to authenticated
  using (id in (select public.app_my_resa_ids()));

drop policy if exists appels_self on public.appels_de_fonds;
create policy appels_self on public.appels_de_fonds for select to authenticated
  using ("reservationId" in (select public.app_my_resa_ids()));

drop policy if exists contrats_self on public.contrats;
create policy contrats_self on public.contrats for select to authenticated
  using ("reservationId" in (select public.app_my_resa_ids()));

drop policy if exists lots_immo_self on public.lots_immo;
create policy lots_immo_self on public.lots_immo for select to authenticated
  using (id in (select public.app_my_lot_ids()));

drop policy if exists programmes_self on public.programmes;
create policy programmes_self on public.programmes for select to authenticated
  using (id in (select public.app_my_prog_ids()));
