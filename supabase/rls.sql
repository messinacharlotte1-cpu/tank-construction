-- Tank Construction — Row Level Security (multi-tenant, cf. CLAUDE.md règle 5).
-- À exécuter dans Supabase → SQL Editor APRÈS `prisma db push` (qui crée les tables).
--
-- Étape 1 (ce fichier) : activer RLS sur toutes les tables métier et VERROUILLER
-- (aucune policy permissive => seul le service_role/serveur accède ; anon/authenticated = refusé).
-- C'est le défaut sûr tant que l'auth applicative (mapping utilisateur -> tenant) n'est pas branchée.
--
-- Étape 2 (plus tard, avec l'auth) : ajouter des policies scopées par tenant, du type
--   CREATE POLICY tenant_isolation ON <table> USING (tenantId = current_tenant_id());
-- où current_tenant_id() lit le claim JWT du tenant. NE PAS ouvrir en USING(true).

alter table "tenants"    enable row level security;
alter table "users"      enable row level security;
alter table "chantiers"  enable row level security;
alter table "taches"     enable row level security;
alter table "jalons"     enable row level security;
alter table "pointages"  enable row level security;
alter table "devis"      enable row level security;
alter table "lots"       enable row level security;
alter table "lignes"     enable row level security;
alter table "factures"   enable row level security;
alter table "paiements"  enable row level security;
alter table "articles"   enable row level security;
alter table "audit_log"  enable row level security;

-- Optionnel : forcer RLS même pour le propriétaire de table (défense en profondeur).
-- alter table "tenants" force row level security; -- (à généraliser une fois l'auth en place)

-- Audit append-only : révoquer UPDATE/DELETE au niveau rôle applicatif (cf. CLAUDE.md règle 6).
-- À affiner quand les rôles Postgres applicatifs existeront.
