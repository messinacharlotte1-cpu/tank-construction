-- Tank Construction — 0014 : journal de chantier (rapports terrain). Idempotent.

alter table "journal_chantier" enable row level security;

-- Lecture tenant (via chantier) / écriture rôles ops. Scope par chaîne chantier→tenant.
drop policy if exists journal_read on public.journal_chantier;
create policy journal_read on public.journal_chantier for select to authenticated
  using ("chantierId" in (select id from public.chantiers where "tenantId" = public.current_tenant()));

drop policy if exists journal_write on public.journal_chantier;
create policy journal_write on public.journal_chantier for all to authenticated
  using ("chantierId" in (select id from public.chantiers where "tenantId" = public.current_tenant()) and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER','TERRAIN'))
  with check ("chantierId" in (select id from public.chantiers where "tenantId" = public.current_tenant()) and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER','TERRAIN'));

-- ── Démo : 3 rapports sur le 1er chantier du tenant démo ──
insert into public.journal_chantier (id, "chantierId", date, auteur, meteo, texte, photos, "createdAt")
select v.id, c.id, v.d, v.auteur, v.meteo, v.texte, v.photos, now()
from (
  select id from public.chantiers where "tenantId" = '00000000-0000-0000-0000-000000000001' order by nom limit 1
) c,
(values
  ('00000000-0000-0000-0000-0000000j0001'::text, now() - interval '0 day',  'NGONO Sylvie', 'Orageux — arrêt 15 h', 'Coulage dalle R+2 terminé (2 toupies). Réservations gaines contrôlées avant coulage. 3 photos jointes.', 3),
  ('00000000-0000-0000-0000-0000000j0002'::text, now() - interval '1 day',  'NGONO Sylvie', 'Couvert', 'Ferraillage dalle R+2 achevé, contrôle conducteur OK. Livraison Quincaillerie du Mfoundi reçue (40 barres Ø12).', 2),
  ('00000000-0000-0000-0000-0000000j0003'::text, now() - interval '2 days', 'KAMDEM Serge', 'Ensoleillé', 'Colonnes EU/EV posées jusqu''au R+1. Attente coudes Ø110 (demande transmise au magasin).', 1)
) as v(id, d, auteur, meteo, texte, photos)
on conflict (id) do nothing;
