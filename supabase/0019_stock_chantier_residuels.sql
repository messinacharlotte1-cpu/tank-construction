-- Tank Construction — 0019 : stock rattaché au chantier + résiduels. Idempotent.
--  • Article.chantierId : magasin par projet.
--  • MouvementStock type RETOUR + caracteristiques (jsonb) : matériaux résiduels réutilisables.
-- Prérequis normal : `prisma db push` crée colonnes + valeur d'enum ; ce fichier = filet.
-- RLS inchangée (articles = tenant, mouvements = via article ; cf. 0007 / 0010).

-- ── Valeur d'enum RETOUR ──────────────────────────────────────────────
-- NOTE : une valeur d'enum ajoutée ne peut PAS être utilisée dans la même
-- transaction que son ajout. Ce fichier n'INSÈRE aucun RETOUR → sûr en un bloc.
alter type "TypeMouvement" add value if not exists 'RETOUR';

-- ── Colonnes (filet) ──────────────────────────────────────────────────
alter table public.articles         add column if not exists "chantierId" text;
alter table public.mouvements_stock add column if not exists caracteristiques jsonb;

create index if not exists articles_chantierId_idx on public.articles ("chantierId");
