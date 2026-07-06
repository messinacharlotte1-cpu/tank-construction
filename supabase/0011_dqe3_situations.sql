-- Tank Construction — 0011 : DQE 3 niveaux (sous-ouvrages) + situations + paie pointage. Idempotent.

alter table "sous_ouvrages" enable row level security;
alter table "situations"    enable row level security;

-- Sous-ouvrages : via lot → devis → tenant
drop policy if exists sous_ouvrages_tenant on public.sous_ouvrages;
create policy sous_ouvrages_tenant on public.sous_ouvrages for all to authenticated
  using (exists (select 1 from public.lots l join public.devis d on d.id = l."devisId" where l.id = "lotId" and d."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.lots l join public.devis d on d.id = l."devisId" where l.id = "lotId" and d."tenantId" = public.current_tenant()));

-- Lignes : via sous-ouvrage → lot → devis → tenant (recréée après restructuration)
drop policy if exists lignes_tenant on public.lignes;
create policy lignes_tenant on public.lignes for all to authenticated
  using (exists (select 1 from public.sous_ouvrages so join public.lots l on l.id = so."lotId" join public.devis d on d.id = l."devisId" where so.id = "sousOuvrageId" and d."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.sous_ouvrages so join public.lots l on l.id = so."lotId" join public.devis d on d.id = l."devisId" where so.id = "sousOuvrageId" and d."tenantId" = public.current_tenant()));

-- Situations : lecture tenant / écriture commercial-compta-direction
drop policy if exists situations_read on public.situations;
create policy situations_read on public.situations for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists situations_write on public.situations;
create policy situations_write on public.situations for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL','COMPTA'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL','COMPTA'));

-- ── Démo DQE 3 niveaux (devis d1) ─────────────────────────
insert into public.sous_ouvrages (id, "lotId", nom, ordre) values
  ('00000000-0000-0000-0000-000000000u11', '00000000-0000-0000-0000-000000000g11', 'Terrassement & fondations', 1),
  ('00000000-0000-0000-0000-000000000u12', '00000000-0000-0000-0000-000000000g12', 'Plomberie sanitaire', 1)
on conflict (id) do nothing;

insert into public.lignes (id, "sousOuvrageId", designation, unite, quantite, "prixUnitaire", ordre) values
  ('00000000-0000-0000-0000-000000000v11', '00000000-0000-0000-0000-000000000u11', 'Terrassement en pleine masse', 'm³', 120, 8500, 1),
  ('00000000-0000-0000-0000-000000000v12', '00000000-0000-0000-0000-000000000u11', 'Béton de semelles dosé 350', 'm³', 45, 95000, 2),
  ('00000000-0000-0000-0000-000000000v13', '00000000-0000-0000-0000-000000000u12', 'Plomberie sanitaire (forfait)', 'ff', 1, 2500000, 1)
on conflict (id) do nothing;

-- ── Démo Situation ────────────────────────────────────────
insert into public.situations (id, "tenantId", chantier, numero, "cumulPct", "montantHT", "retenuePct", statut, "createdAt") values
  ('00000000-0000-0000-0000-000000000w01', '00000000-0000-0000-0000-000000000001', 'Immeuble R+4 Bastos', 'SIT-2026-001', 40, 74000000, 10, 'Brouillon', now())
on conflict (id) do nothing;

-- ── Tarifs pointages démo (paie du jour) ──────────────────
update public.pointages set tarif = 5000 where id = '00000000-0000-0000-0000-0000000000e1';
update public.pointages set tarif = 5500 where id = '00000000-0000-0000-0000-0000000000e2';
update public.pointages set tarif = 5500 where id = '00000000-0000-0000-0000-0000000000e3';
