-- Tank Construction — 0005 : RLS Promotion immo + démo + DQE (lots/lignes). Idempotent.

-- ── RLS on ──────────────────────────────────────────────
alter table "programmes"      enable row level security;
alter table "lots_immo"       enable row level security;
alter table "reservations"    enable row level security;
alter table "appels_de_fonds" enable row level security;

-- ── Policies tenant (chaîne via programme) ──────────────
drop policy if exists programmes_tenant on public.programmes;
create policy programmes_tenant on public.programmes for all to authenticated
  using ("tenantId" = public.current_tenant()) with check ("tenantId" = public.current_tenant());

drop policy if exists lots_immo_tenant on public.lots_immo;
create policy lots_immo_tenant on public.lots_immo for all to authenticated
  using (exists (select 1 from public.programmes p where p.id = "programmeId" and p."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.programmes p where p.id = "programmeId" and p."tenantId" = public.current_tenant()));

drop policy if exists reservations_tenant on public.reservations;
create policy reservations_tenant on public.reservations for all to authenticated
  using (exists (select 1 from public.lots_immo l join public.programmes p on p.id = l."programmeId" where l.id = "lotImmoId" and p."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.lots_immo l join public.programmes p on p.id = l."programmeId" where l.id = "lotImmoId" and p."tenantId" = public.current_tenant()));

drop policy if exists appels_tenant on public.appels_de_fonds;
create policy appels_tenant on public.appels_de_fonds for all to authenticated
  using (exists (select 1 from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" join public.programmes p on p.id = l."programmeId" where r.id = "reservationId" and p."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.reservations r join public.lots_immo l on l.id = r."lotImmoId" join public.programmes p on p.id = l."programmeId" where r.id = "reservationId" and p."tenantId" = public.current_tenant()));

-- ── Démo Promotion ──────────────────────────────────────
insert into public.programmes (id, "tenantId", nom, ville, "createdAt") values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000001', 'Résidence Mekoumbou City', 'Yaoundé', now())
on conflict (id) do nothing;

insert into public.lots_immo (id, "programmeId", reference, bloc, niveau, typologie, surface, prix, statut) values
  ('00000000-0000-0000-0000-000000000f11', '00000000-0000-0000-0000-0000000000f1', 'L-A101', 'A', 'R+1', 'T3', 85, 42000000, 'RESERVE'),
  ('00000000-0000-0000-0000-000000000f12', '00000000-0000-0000-0000-0000000000f1', 'L-A102', 'A', 'R+1', 'T2', 60, 31000000, 'DISPONIBLE'),
  ('00000000-0000-0000-0000-000000000f13', '00000000-0000-0000-0000-0000000000f1', 'V-01',   'V', 'RDC', 'Villa', 140, 95000000, 'VENDU')
on conflict (id) do nothing;

insert into public.reservations (id, "lotImmoId", acquereur, date) values
  ('00000000-0000-0000-0000-000000000f21', '00000000-0000-0000-0000-000000000f11', 'M. Nkomo Bernard', now())
on conflict (id) do nothing;

-- Jalon chantier validé (constat contradictoire) → autorise l'appel de fonds VEFA
insert into public.jalons (id, "chantierId", libelle, valide, "valideLe") values
  ('00000000-0000-0000-0000-000000000f31', '00000000-0000-0000-0000-0000000000a1', 'Fondations achevées', true, now())
on conflict (id) do nothing;

insert into public.appels_de_fonds (id, "reservationId", "jalonId", libelle, montant, echeance, statut) values
  ('00000000-0000-0000-0000-000000000f41', '00000000-0000-0000-0000-000000000f21', '00000000-0000-0000-0000-000000000f31', 'Appel 1 — Fondations (30 %)', 12600000, now() + interval '15 days', 'EMIS'),
  ('00000000-0000-0000-0000-000000000f42', '00000000-0000-0000-0000-000000000f21', null, 'Appel 2 — Élévation (30 %)', 12600000, now() + interval '60 days', 'PREVU')
on conflict (id) do nothing;

-- ── Démo DQE (lots/lignes sur le devis démo d1) ─────────
insert into public.lots (id, "devisId", nom, ordre) values
  ('00000000-0000-0000-0000-000000000g11', '00000000-0000-0000-0000-0000000000d1', 'Gros œuvre', 1),
  ('00000000-0000-0000-0000-000000000g12', '00000000-0000-0000-0000-0000000000d1', 'Second œuvre', 2)
on conflict (id) do nothing;

insert into public.lignes (id, "lotId", designation, unite, quantite, "prixUnitaire", ordre) values
  ('00000000-0000-0000-0000-000000000h11', '00000000-0000-0000-0000-000000000g11', 'Terrassement en pleine masse', 'm³', 120, 8500, 1),
  ('00000000-0000-0000-0000-000000000h12', '00000000-0000-0000-0000-000000000g11', 'Béton de semelles dosé 350', 'm³', 45, 95000, 2),
  ('00000000-0000-0000-0000-000000000h13', '00000000-0000-0000-0000-000000000g12', 'Plomberie sanitaire (forfait)', 'ff', 1, 2500000, 1)
on conflict (id) do nothing;
