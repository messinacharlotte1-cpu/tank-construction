-- Tank Construction — 0018 : fondations corps d'état + lien chantier réel. Idempotent.
--  • Taxonomie corps_etat (Gros/Second œuvre + poste) réutilisable :
--    dashboard, rentabilité, tâches, réserves/OPR, lots DQE.
--  • Vrai chantierId sur reserves/medias/devis (fin des références par NOM).
--  • perimetre chantier (GO/SO/MIXTE) + categorie media (PHOTO/PLAN/ACTE_ADMIN).
-- Prérequis normal : `prisma db push` crée table/colonnes/enums ; ce fichier ajoute
-- RLS + backfill + seed. Filet idempotent inclus si joué avant le push.

-- ── Enums (filet — normalement créés par prisma db push) ──────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'CategorieCorpsEtat') then
    create type "CategorieCorpsEtat" as enum ('GROS_OEUVRE', 'SECOND_OEUVRE');
  end if;
  if not exists (select 1 from pg_type where typname = 'PerimetreChantier') then
    create type "PerimetreChantier" as enum ('GO', 'SO', 'MIXTE');
  end if;
  if not exists (select 1 from pg_type where typname = 'CategorieMedia') then
    create type "CategorieMedia" as enum ('PHOTO', 'PLAN', 'ACTE_ADMIN');
  end if;
end $$;

-- ── Table corps_etat (filet) ─────────────────────────────────────────
create table if not exists public.corps_etat (
  id          text primary key,
  "tenantId"  text not null,
  categorie   "CategorieCorpsEtat" not null,
  libelle     text not null,
  ordre       int  not null default 0,
  actif       boolean not null default true,
  "createdAt" timestamptz not null default now(),
  unique ("tenantId", categorie, libelle)
);
create index if not exists corps_etat_tenantId_idx on public.corps_etat ("tenantId");

-- ── Colonnes ajoutées sur les tables existantes (filet) ──────────────
alter table public.taches    add column if not exists "corpsEtatId" text;
alter table public.reserves  add column if not exists "corpsEtatId" text;
alter table public.reserves  add column if not exists "chantierId"  text;
alter table public.lots      add column if not exists "corpsEtatId" text;
alter table public.medias    add column if not exists "chantierId"  text;
alter table public.medias    add column if not exists categorie "CategorieMedia" not null default 'PHOTO';
alter table public.devis     add column if not exists "chantierId"  text;
alter table public.chantiers add column if not exists perimetre "PerimetreChantier";

create index if not exists taches_corpsEtatId_idx   on public.taches   ("corpsEtatId");
create index if not exists reserves_corpsEtatId_idx on public.reserves ("corpsEtatId");
create index if not exists reserves_chantierId_idx  on public.reserves ("chantierId");
create index if not exists lots_corpsEtatId_idx     on public.lots     ("corpsEtatId");
create index if not exists medias_chantierId_idx    on public.medias   ("chantierId");
create index if not exists devis_chantierId_idx     on public.devis    ("chantierId");

-- ── Backfill chantierId depuis le NOM ────────────────────────────────
-- Scopé (tenantId, nom) pour ne jamais rapprocher un homonyme d'un autre tenant.
update public.reserves r
   set "chantierId" = c.id
  from public.chantiers c
 where r."chantierId" is null
   and c."tenantId" = r."tenantId"
   and c.nom = r.chantier;

update public.medias m
   set "chantierId" = c.id
  from public.chantiers c
 where m."chantierId" is null
   and c."tenantId" = m."tenantId"
   and c.nom = m.chantier;

-- ── RLS corps_etat : lecture tenant / écriture rôles ops, anon coupé ──
alter table public.corps_etat enable row level security;
revoke all on public.corps_etat from anon;

drop policy if exists corps_etat_read on public.corps_etat;
create policy corps_etat_read on public.corps_etat for select to authenticated
  using ("tenantId" = public.current_tenant());

drop policy if exists corps_etat_write on public.corps_etat;
create policy corps_etat_write on public.corps_etat for all to authenticated
  using ("tenantId" = public.current_tenant()
         and public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER'))
  with check ("tenantId" = public.current_tenant()
         and public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER'));

-- ── Seed démo (tenant démo 0001) : Gros + Second œuvre, postes courants CM ──
insert into public.corps_etat (id, "tenantId", categorie, libelle, ordre) values
  ('00000000-0000-0000-0000-0000000ce101', '00000000-0000-0000-0000-000000000001', 'GROS_OEUVRE',   'Terrassement',              1),
  ('00000000-0000-0000-0000-0000000ce102', '00000000-0000-0000-0000-000000000001', 'GROS_OEUVRE',   'Fondations',                2),
  ('00000000-0000-0000-0000-0000000ce103', '00000000-0000-0000-0000-000000000001', 'GROS_OEUVRE',   'Élévation / Maçonnerie',    3),
  ('00000000-0000-0000-0000-0000000ce104', '00000000-0000-0000-0000-000000000001', 'GROS_OEUVRE',   'Charpente / Couverture',    4),
  ('00000000-0000-0000-0000-0000000ce201', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Plomberie sanitaire',       1),
  ('00000000-0000-0000-0000-0000000ce202', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Électricité',               2),
  ('00000000-0000-0000-0000-0000000ce203', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Menuiserie',                3),
  ('00000000-0000-0000-0000-0000000ce204', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Carrelage / Revêtement',    4),
  ('00000000-0000-0000-0000-0000000ce205', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Peinture',                  5),
  ('00000000-0000-0000-0000-0000000ce206', '00000000-0000-0000-0000-000000000001', 'SECOND_OEUVRE', 'Étanchéité',                6)
on conflict (id) do nothing;
