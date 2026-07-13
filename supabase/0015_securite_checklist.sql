-- Tank Construction — 0015 : checklist sécurité journalière. Idempotent.

alter table "securite_checklist" enable row level security;

drop policy if exists checklist_read on public.securite_checklist;
create policy checklist_read on public.securite_checklist for select to authenticated
  using ("tenantId" = public.current_tenant());

drop policy if exists checklist_write on public.securite_checklist;
create policy checklist_write on public.securite_checklist for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER','TERRAIN'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN','CONDUCTEUR','CHEF_CHANTIER','TERRAIN'));

-- ── Seed : items standard pour le tenant démo ──
insert into public.securite_checklist (id, "tenantId", item, ok, ordre, "updatedAt")
values
  ('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-000000000001', 'EPI (casques, chaussures, gants) portés par toute l''équipe', false, 1, now()),
  ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-000000000001', 'Balisage et protections collectives en place (garde-corps, filets)', false, 2, now()),
  ('00000000-0000-0000-0000-0000000c0003', '00000000-0000-0000-0000-000000000001', 'Échafaudages et étaiements vérifiés', false, 3, now()),
  ('00000000-0000-0000-0000-0000000c0004', '00000000-0000-0000-0000-000000000001', 'Extincteurs accessibles et trousse de secours présente', false, 4, now()),
  ('00000000-0000-0000-0000-0000000c0005', '00000000-0000-0000-0000-000000000001', 'Zone de circulation engins dégagée et signalée', false, 5, now())
on conflict (id) do nothing;
