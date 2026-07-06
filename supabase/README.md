# Brancher Supabase (base PostgreSQL)

Projet Supabase créé sous le compte **messinacharlotte1**. Prisma (`apps/api/prisma/schema.prisma`) est la source du schéma ; Supabase héberge la base.

## 1. Récupérer les infos du projet (dashboard Supabase)

- **Project URL** : Settings → Data API → `https://<ref>.supabase.co`
- **Clé anon / publishable** : Settings → API Keys (publique, OK côté front)
- **Connection string** : Settings → Database → Connection string → **URI**
  - Prendre la version **directe** (port `5432`) pour les migrations Prisma.
  - Format : `postgresql://postgres:[MDP]@db.<ref>.supabase.co:5432/postgres`

> Le mot de passe DB et la connection string sont des **secrets** → uniquement dans `.env` local (jamais commit, jamais dans le chat).

## 2. Appliquer le schéma (crée les tables)

```bash
# apps/api/.env  (copié depuis .env.example, NON commité)
DATABASE_URL="postgresql://postgres:[MDP]@db.<ref>.supabase.co:5432/postgres"

pnpm --filter @tank/api exec prisma db push   # crée toutes les tables depuis schema.prisma
```

## 3. Verrouiller la sécurité (RLS)

Supabase → **SQL Editor** → coller le contenu de [`rls.sql`](./rls.sql) → **Run**.
Active RLS sur les 13 tables et verrouille (seul le serveur/service_role accède) tant que l'auth applicative n'est pas branchée.

## 4. Variables d'environnement

- **Front (Vercel)** : Project → Settings → Environment Variables → ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (cf. `apps/web/.env.example`). Redeploy.
- **API** : `apps/api/.env` → `DATABASE_URL` (+ plus tard les clés d'intégration serveur).

## 5. Vérifier

```bash
pnpm --filter @tank/api exec prisma db pull   # doit refléter les 13 tables
```

## 6. PDF serveur (Edge Function)

`supabase/functions/document-pdf` génère les PDF côté serveur (Deno + pdf-lib). Déploiement :

```bash
# une fois : lier le projet
supabase link --project-ref pegxkhkrveverhoqetyh
# déployer la fonction (JWT vérifié par défaut → seul un utilisateur connecté peut l'appeler)
supabase functions deploy document-pdf --project-ref pegxkhkrveverhoqetyh
```

Le front l'appelle via `serverPdf()` (`apps/web/src/lib/pdf.ts`) → bouton **« PDF serveur »** (DevisDetail). Tant que non déployée, le bouton affiche un message ; le bouton **« PDF »** (navigateur) reste disponible en fallback.

## 7. Migrations SQL appliquées

`0002` auth+RLS · `0003` user démo · `0004` modules · `0005` promotion+DQE · `0006` contrats+RBAC · `0007` write par rôle + acquéreurs · `0008` fix récursion self-policies acquéreur.

> Comptes démo (mdp `TankDemo2026!`) : `demo@` DIRECTION · `commercial@` COMMERCIAL · `terrain@` TERRAIN · `acquereur@tank.cm` ACQUEREUR (portail isolé à sa réservation).
