-- Tank Construction — 0004 : RLS tenant pour modules additionnels + données démo.
-- À exécuter après 0002. Idempotent.

-- ── Policies scopées tenant ───────────────────────────────
drop policy if exists articles_tenant on public.articles;
create policy articles_tenant on public.articles for all to authenticated
  using ("tenantId" = public.current_tenant()) with check ("tenantId" = public.current_tenant());

drop policy if exists factures_tenant on public.factures;
create policy factures_tenant on public.factures for all to authenticated
  using ("tenantId" = public.current_tenant()) with check ("tenantId" = public.current_tenant());

drop policy if exists devis_tenant on public.devis;
create policy devis_tenant on public.devis for all to authenticated
  using ("tenantId" = public.current_tenant()) with check ("tenantId" = public.current_tenant());

drop policy if exists paiements_tenant on public.paiements;
create policy paiements_tenant on public.paiements for all to authenticated
  using (exists (select 1 from public.factures f where f.id = "factureId" and f."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.factures f where f.id = "factureId" and f."tenantId" = public.current_tenant()));

drop policy if exists lots_tenant on public.lots;
create policy lots_tenant on public.lots for all to authenticated
  using (exists (select 1 from public.devis d where d.id = "devisId" and d."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.devis d where d.id = "devisId" and d."tenantId" = public.current_tenant()));

drop policy if exists lignes_tenant on public.lignes;
create policy lignes_tenant on public.lignes for all to authenticated
  using (exists (select 1 from public.lots l join public.devis d on d.id = l."devisId" where l.id = "lotId" and d."tenantId" = public.current_tenant()))
  with check (exists (select 1 from public.lots l join public.devis d on d.id = l."devisId" where l.id = "lotId" and d."tenantId" = public.current_tenant()));

-- ── Données démo (tenant démo) ────────────────────────────
insert into public.articles (id, "tenantId", designation, unite, stock, seuil) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'Ciment CPJ 35', 'sac', 40, 100),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000001', 'Fer à béton Ø12', 'barre', 250, 200),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000001', 'Gravier 15/25', 'm³', 8, 15)
on conflict (id) do nothing;

insert into public.factures (id, "tenantId", numero, client, ttc, statut, "createdAt") values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'FAC-2026-001', 'SCI Horizon', 45000000, 'Impayée', now()),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'FAC-2026-002', 'CamerLog SARL', 12000000, 'Payée', now())
on conflict (id) do nothing;

insert into public.devis (id, "tenantId", numero, client, statut, "createdAt") values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000001', 'DEV-2026-014', 'M. Ekambi Jules', 'Envoyé', now())
on conflict (id) do nothing;

-- Pointages démo sur un chantier existant
insert into public.pointages (id, "chantierId", ouvrier, date, statut) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'ABENA Paul', now(), 'P'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', 'FOUDA Éric', now(), 'P'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a1', 'MBARGA Denis', now(), 'DM')
on conflict (id) do nothing;
