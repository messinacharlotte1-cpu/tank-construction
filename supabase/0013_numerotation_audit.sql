-- Tank Construction — 0013 : numérotation auto (séquence/exercice) + audit log (triggers). Idempotent.

-- ── Numérotation : PREFIX-ANNÉE-NNNN, séquence par tenant et par exercice ──
create or replace function public.next_numero(kind text)
returns text language plpgsql security definer set search_path = public as $$
declare pfx text; yr text := to_char(now(), 'YYYY'); seqkey text; n int; tid text := public.current_tenant();
begin
  if tid is null then raise exception 'tenant introuvable'; end if;
  select valeur into pfx from public.settings where "tenantId" = tid and cle = 'prefixe_' || kind;
  if pfx is null then pfx := upper(substr(kind, 1, 3)) || '-'; end if;
  seqkey := 'seq_' || kind || '_' || yr;
  insert into public.settings (id, "tenantId", cle, valeur)
    values (gen_random_uuid()::text, tid, seqkey, '1')
    on conflict ("tenantId", cle) do update set valeur = (public.settings.valeur::int + 1)::text
    returning valeur::int into n;
  return pfx || yr || '-' || lpad(n::text, 4, '0');
end $$;

-- ── Audit log : trigger append-only sur tables sensibles ──
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare tid text; act text; cibleId text;
begin
  if TG_OP = 'DELETE' then tid := OLD."tenantId"::text; cibleId := OLD.id; else tid := NEW."tenantId"::text; cibleId := NEW.id; end if;
  select email into act from public.users where id = auth.uid()::text;
  insert into public.audit_log (id, "tenantId", acteur, action, cible, "createdAt")
    values (gen_random_uuid()::text, coalesce(tid, public.current_tenant()), coalesce(act, auth.uid()::text, 'système'), TG_OP, TG_TABLE_NAME || ':' || cibleId, now());
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end $$;

do $$
declare t text;
begin
  foreach t in array array['devis','factures','contrats','situations'] loop
    execute format('drop trigger if exists audit_%I on public.%I', t, t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.log_audit()', t, t);
  end loop;
end $$;

-- Audit lisible par la direction ; écriture réservée au trigger (definer) → aucune policy insert utilisateur.
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using ("tenantId" = public.current_tenant() and public.current_role() in ('DIRECTION','SUPER_ADMIN'));
