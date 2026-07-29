-- Tank Construction — 0020 : chaîne achats devis → commande → proforma → reçu. Idempotent.
--  • commandes (découlent d'un devis, vers un fournisseur, pour un chantier).
--  • commande_lignes (avec lien article : réception = entrée en stock).
-- Prérequis normal : `prisma db push` crée les tables ; ce fichier = filet + RLS.

-- ── Tables (filet) ────────────────────────────────────────────────────
create table if not exists public.commandes (
  id            text primary key,
  "tenantId"    text not null,
  numero        text not null,
  "devisId"     text,
  "fournisseurId" text,
  "chantierId"  text,
  statut        text not null default 'Brouillon',
  "createdAt"   timestamptz not null default now(),
  unique ("tenantId", numero)
);
create index if not exists commandes_tenantId_idx on public.commandes ("tenantId");
create index if not exists commandes_devisId_idx  on public.commandes ("devisId");

create table if not exists public.commande_lignes (
  id            text primary key,
  "commandeId"  text not null,
  "articleId"   text,
  designation   text not null,
  unite         text not null,
  quantite      double precision not null default 0,
  "prixUnitaire" bigint not null default 0
);
create index if not exists commande_lignes_commandeId_idx on public.commande_lignes ("commandeId");

-- ── RLS commandes : lecture tenant / écriture rôles ops, anon coupé ──
alter table public.commandes enable row level security;
revoke all on public.commandes from anon;
drop policy if exists commandes_read on public.commandes;
create policy commandes_read on public.commandes for select to authenticated
  using ("tenantId" = public.current_tenant());
drop policy if exists commandes_write on public.commandes;
create policy commandes_write on public.commandes for all to authenticated
  using ("tenantId" = public.current_tenant()
         and public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER', 'COMPTA'))
  with check ("tenantId" = public.current_tenant()
         and public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER', 'COMPTA'));

-- ── RLS commande_lignes : via la commande parente (tenant) ──
alter table public.commande_lignes enable row level security;
revoke all on public.commande_lignes from anon;
drop policy if exists commande_lignes_read on public.commande_lignes;
create policy commande_lignes_read on public.commande_lignes for select to authenticated
  using (exists (select 1 from public.commandes c where c.id = "commandeId" and c."tenantId" = public.current_tenant()));
drop policy if exists commande_lignes_write on public.commande_lignes;
create policy commande_lignes_write on public.commande_lignes for all to authenticated
  using (public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER', 'COMPTA')
         and exists (select 1 from public.commandes c where c.id = "commandeId" and c."tenantId" = public.current_tenant()))
  with check (public.current_role() in ('DIRECTION', 'SUPER_ADMIN', 'CONDUCTEUR', 'CHEF_CHANTIER', 'COMPTA')
         and exists (select 1 from public.commandes c where c.id = "commandeId" and c."tenantId" = public.current_tenant()));
