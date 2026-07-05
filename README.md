# Tank Construction — Monorepo

Plateforme SaaS BTP & promotion immobilière (Cameroun). Réf. CDC-TANK-2026-003.
Bible produit : [`CLAUDE.md`](./CLAUDE.md) et [`README-dev.md`](./README-dev.md). UX de référence : [`prototype/`](./prototype).

## Structure

| Dossier | Rôle | État |
|---|---|---|
| `apps/web` | Front web Vite + React + TS. Embarque le prototype comme front **v0 live**. | déployé Vercel |
| `apps/api` | API NestJS + Prisma (PostgreSQL). Schéma data model P0 multi-tenant. | fondation (DB non branchée) |
| `packages/ui` | Design system typé : couleurs `C`, `Card`, `StatutBadge`, `Progress`, `Hazard`, `Toggle`. | démarré |
| `prototype/` | Maquette UX validée client (source UX, pas source code). | figé |

## Commandes

```bash
pnpm install          # installe tous les workspaces
pnpm dev              # web + api (turbo)
pnpm build            # build tous les workspaces
pnpm --filter @tank/web dev     # front seul
pnpm --filter @tank/api dev     # api seule (nécessite DATABASE_URL)
```

## État de l'avancement

- [x] Scaffold monorepo pnpm + turbo
- [x] Design system extrait (`packages/ui`)
- [x] Front v0 déployable (prototype embarqué)
- [x] Fondation API NestJS + schéma Prisma P0
- [ ] Base PostgreSQL branchée (Supabase) + RLS multi-tenant
- [ ] Auth / RBAC (matrice du prototype)
- [ ] Décomposition des 23 modules en écrans typés branchés API
- [ ] PDF serveur, offline PWA, intégrations MoMo/OM/WhatsApp/SMS

> Prochaine étape critique : base de données (Supabase) + auth avant tout module métier réel.
