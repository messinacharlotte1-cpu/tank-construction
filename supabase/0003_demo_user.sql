-- DÉMO UNIQUEMENT — crée un utilisateur Supabase Auth sans SMTP.
-- Identifiants : demo@tank.cm / TankDemo2026!  (tenant démo, rôle DIRECTION via trigger).
-- Ne PAS utiliser ce procédé pour de vrais comptes. Idempotent.
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'demo@tank.cm') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'demo@tank.cm', crypt('TankDemo2026!', gen_salt('bf')), now(),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"nom":"Démo Directeur"}'::jsonb,
      '', '', '', '', ''
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      uid::text, uid, json_build_object('sub', uid::text, 'email', 'demo@tank.cm')::jsonb, 'email', now(), now(), now()
    );
  end if;
end $$;
