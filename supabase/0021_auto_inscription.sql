-- Tank Construction — 0021 : auto-inscription self-service + validation direction. Idempotent.
-- Remplace le provisioning démo (tout inscrit = DIRECTION actif) par un modèle sûr :
--   nouvel inscrit → rôle TERRAIN + actif=false (aucun accès tant que la direction ne valide pas).
-- Durcit current_role()/current_tenant() : un compte non validé n'a NI rôle NI tenant effectif
--   côté RLS (fail-closed), en plus du blocage UI. Défense en profondeur.
-- Prérequis Supabase : Auth > "Enable signups" ON. "Confirm email" au choix (le gate marche dans les deux cas).

-- ── 1. Provisioning à l'inscription : compte en attente, pas admin ──
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, "tenantId", email, nom, role, acces, actif)
  values (
    new.id::text,
    '00000000-0000-0000-0000-000000000001',  -- tenant démo (mono-tenant pour l'instant)
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    'TERRAIN',        -- rôle le plus bas par défaut ; la direction ajuste à la validation
    'EMAIL_2FA',
    false             -- INACTIF : aucun accès tant que non validé
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 2. Rôle effectif : null-équivalent (sentinel) si le compte n'est pas validé ──
-- Un compte actif=false renvoie 'EN_ATTENTE' → n'appartient à aucune liste de rôles RLS → tout write/read scopé refusé.
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select case when actif then role::text else 'EN_ATTENTE' end
  from public.users where id = auth.uid()::text;
$$;

-- ── 3. Tenant effectif : null si non validé → toutes les policies tenant échouent (tenantId = null) ──
create or replace function public.current_tenant()
returns text language sql stable security definer set search_path = public as $$
  select case when actif then "tenantId" else null end
  from public.users where id = auth.uid()::text;
$$;

-- ── 4. RLS : le compte en attente lit SA propre fiche (déjà couvert par users_self_read, id-based) ──
-- Rappel (créée en 0002) : users_self_read = select where id = auth.uid()::text → OK même inactif.
-- Rappel (créée en 0009) : users_admin_read/write = DIRECTION/SUPER_ADMIN sur le tenant → activent les comptes.

-- ── 5. Garde anti-escalade : un user ne peut pas s'auto-activer ni changer son propre rôle ──
-- users_admin_write exige déjà role DIRECTION/SUPER_ADMIN ; un TERRAIN inactif a current_role='EN_ATTENTE'
-- → il ne matche aucune policy d'update sur users. Il ne peut donc PAS se rendre actif. Rien à ajouter.
