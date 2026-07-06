-- Tank Construction — 0010 : BPU + messagerie + mouvements stock + vitrine publique. Idempotent.

alter table "bpu_ouvrages"     enable row level security;
alter table "messages"         enable row level security;
alter table "mouvements_stock" enable row level security;

-- BPU : lecture tenant, écriture commercial/direction
drop policy if exists bpu_read on public.bpu_ouvrages;
create policy bpu_read on public.bpu_ouvrages for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists bpu_write on public.bpu_ouvrages;
create policy bpu_write on public.bpu_ouvrages for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','COMMERCIAL'));

-- Messagerie : tout membre du tenant lit/écrit
drop policy if exists messages_tenant on public.messages;
create policy messages_tenant on public.messages for all to authenticated
  using ("tenantId" = public.current_tenant())
  with check ("tenantId" = public.current_tenant());

-- Mouvements stock : via article, écriture rôles ops
drop policy if exists mouvements_read on public.mouvements_stock;
create policy mouvements_read on public.mouvements_stock for select to authenticated
  using (exists (select 1 from public.articles a where a.id = "articleId" and a."tenantId" = public.current_tenant()));
drop policy if exists mouvements_write on public.mouvements_stock;
create policy mouvements_write on public.mouvements_stock for all to authenticated
  using (public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER') and exists (select 1 from public.articles a where a.id = "articleId" and a."tenantId" = public.current_tenant()))
  with check (public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER') and exists (select 1 from public.articles a where a.id = "articleId" and a."tenantId" = public.current_tenant()));

-- ── VITRINE PUBLIQUE : lecture anon des programmes publics + leurs lots ──
drop policy if exists programmes_public on public.programmes;
create policy programmes_public on public.programmes for select to anon using ("public" = true);
drop policy if exists lots_immo_public on public.lots_immo;
create policy lots_immo_public on public.lots_immo for select to anon
  using (exists (select 1 from public.programmes p where p.id = "programmeId" and p."public" = true));

-- Publier le programme démo sur la vitrine
update public.programmes set "public" = true where id = '00000000-0000-0000-0000-0000000000f1';

-- ── Démo ──────────────────────────────────────────────────
insert into public.bpu_ouvrages (id, "tenantId", code, designation, unite, "puBase", categorie) values
  ('00000000-0000-0000-0000-0000000000r1', '00000000-0000-0000-0000-000000000001', 'GO-BET-350', 'Béton dosé à 350 kg/m³', 'm³', 95000, 'Gros œuvre'),
  ('00000000-0000-0000-0000-0000000000r2', '00000000-0000-0000-0000-000000000001', 'GO-PARP-20', 'Parpaing creux 20', 'u', 450, 'Gros œuvre'),
  ('00000000-0000-0000-0000-0000000000r3', '00000000-0000-0000-0000-000000000001', 'SO-CARR-60', 'Carrelage grès 60x60', 'm²', 12000, 'Second œuvre'),
  ('00000000-0000-0000-0000-0000000000r4', '00000000-0000-0000-0000-000000000001', 'FI-PEIN-FA', 'Peinture façade', 'm²', 3500, 'Finitions'),
  ('00000000-0000-0000-0000-0000000000r5', '00000000-0000-0000-0000-000000000001', 'GO-TOIT-BA', 'Couverture bac acier', 'm²', 9000, 'Gros œuvre')
on conflict (id) do nothing;

insert into public.messages (id, "tenantId", auteur, contenu, "createdAt") values
  ('00000000-0000-0000-0000-0000000000s1', '00000000-0000-0000-0000-000000000001', 'Direction', 'Réunion de chantier Bastos demain 8h.', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000000s2', '00000000-0000-0000-0000-000000000001', 'Commercial', 'Nouveau prospect pour Mekoumbou City — lot T3.', now() - interval '30 minutes')
on conflict (id) do nothing;

insert into public.mouvements_stock (id, "articleId", type, quantite, motif, date) values
  ('00000000-0000-0000-0000-0000000000t1', '00000000-0000-0000-0000-0000000000b1', 'ENTREE', 100, 'Livraison Cimencam', now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000t2', '00000000-0000-0000-0000-0000000000b1', 'SORTIE', 60, 'Consommation chantier Bastos', now() - interval '1 day')
on conflict (id) do nothing;
