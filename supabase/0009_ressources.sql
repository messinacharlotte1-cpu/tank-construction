-- Tank Construction — 0009 : RLS ressources + Équipe (users admin) + démo. Idempotent.

alter table "fournisseurs"   enable row level security;
alter table "sous_traitants" enable row level security;
alter table "materiels"      enable row level security;
alter table "incidents"      enable row level security;
alter table "settings"       enable row level security;

-- helper macro : read tenant / write rôle ops
-- Fournisseurs / Sous-traitants / Matériel / Incidents : rôles opérationnels
do $$
declare t text;
begin
  foreach t in array array['fournisseurs','sous_traitants','materiels','incidents'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using ("tenantId" = public.current_tenant())', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using ("tenantId" = public.current_tenant() and public.current_role() in (''DIRECTION'',''SUPER_ADMIN'',''CONDUCTEUR'',''CHEF_CHANTIER'')) with check ("tenantId" = public.current_tenant() and public.current_role() in (''DIRECTION'',''SUPER_ADMIN'',''CONDUCTEUR'',''CHEF_CHANTIER''))', t, t);
  end loop;
end $$;

-- Paramètres : direction seulement
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to authenticated using ("tenantId" = public.current_tenant());
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'));

-- Équipe : direction lit/écrit les users du tenant (en plus de users_self_read)
drop policy if exists users_admin_read on public.users;
create policy users_admin_read on public.users for select to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'));
drop policy if exists users_admin_write on public.users;
create policy users_admin_write on public.users for update to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'))
  with check ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'));

-- ── Démo ──────────────────────────────────────────────────
insert into public.fournisseurs (id, "tenantId", nom, categorie, contact, telephone, "createdAt") values
  ('00000000-0000-0000-0000-000000000m01', '00000000-0000-0000-0000-000000000001', 'Cimencam', 'Matériaux', 'Service commercial', '+237 233 42 00 00', now()),
  ('00000000-0000-0000-0000-000000000m02', '00000000-0000-0000-0000-000000000001', 'Loca-Engins Sarl', 'Location', 'M. Talla', '+237 699 11 22 33', now())
on conflict (id) do nothing;

insert into public.sous_traitants (id, "tenantId", nom, "corpsEtat", chantier, "montantMarche", "retenueGarantiePct", "createdAt") values
  ('00000000-0000-0000-0000-000000000n01', '00000000-0000-0000-0000-000000000001', 'SARL BâtiPlus', 'Maçonnerie', 'Immeuble R+4 Bastos', 15000000, 5, now()),
  ('00000000-0000-0000-0000-000000000n02', '00000000-0000-0000-0000-000000000001', 'Électro-CM', 'Électricité', 'Villa duplex Bonapriso', 8000000, 5, now())
on conflict (id) do nothing;

insert into public.materiels (id, "tenantId", nom, type, statut, "prochainEntretien", "createdAt") values
  ('00000000-0000-0000-0000-000000000o01', '00000000-0000-0000-0000-000000000001', 'Bétonnière 350L', 'Engin', 'DISPONIBLE', null, now()),
  ('00000000-0000-0000-0000-000000000o02', '00000000-0000-0000-0000-000000000001', 'Camion benne 10T', 'Véhicule', 'EN_SERVICE', now() + interval '20 days', now())
on conflict (id) do nothing;

insert into public.incidents (id, "tenantId", chantier, date, gravite, description, mesure, "createdAt") values
  ('00000000-0000-0000-0000-000000000p01', '00000000-0000-0000-0000-000000000001', 'Immeuble R+4 Bastos', now(), 'MAJEUR', 'Chute d''un ouvrier depuis échafaudage niveau R+1', 'Arrêt zone, harnais obligatoires, contrôle échafaudage', now())
on conflict (id) do nothing;

insert into public.settings (id, "tenantId", cle, valeur) values
  ('00000000-0000-0000-0000-000000000q01', '00000000-0000-0000-0000-000000000001', 'tva', '0.1925'),
  ('00000000-0000-0000-0000-000000000q02', '00000000-0000-0000-0000-000000000001', 'cnps_salarie', '0.042'),
  ('00000000-0000-0000-0000-000000000q03', '00000000-0000-0000-0000-000000000001', 'cnps_employeur', '0.1195'),
  ('00000000-0000-0000-0000-000000000q04', '00000000-0000-0000-0000-000000000001', 'prefixe_devis', 'DEV-'),
  ('00000000-0000-0000-0000-000000000q05', '00000000-0000-0000-0000-000000000001', 'prefixe_facture', 'FAC-'),
  ('00000000-0000-0000-0000-000000000q06', '00000000-0000-0000-0000-000000000001', 'seuil_alerte_budget', '90')
on conflict ("tenantId", cle) do nothing;
