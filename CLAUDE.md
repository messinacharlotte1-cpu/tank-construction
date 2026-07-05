# CLAUDE.md — Tank Construction / Tank'Immo SaaS

Plateforme BTP + promotion immobilière, marché camerounais. Client final : Tank'Immo SAS via With Digital Consulting.

## Références (lire avant toute feature)
- `README-dev.md` — architecture, modèle de données, phasage P0→P3, vigilances juridiques.
- `prototype/tank-construction-saas.jsx` — maquette UX validée client. Chaque écran de production doit reproduire fidèlement le module correspondant (23 modules). Ne pas "améliorer" l'UX sans ticket.
- CDC-TANK-2026-003 + avenants.

## Stack imposée
- Front : React 18 + Vite, TypeScript. PWA offline pour écrans terrain uniquement (pointage, rapports, checklist, réserves, photos).
- Back : Node.js (NestJS) + Prisma + PostgreSQL. Redis pour files (sync offline, notifications, PDF).
- PDF : génération serveur depuis les mêmes layouts que les aperçus du prototype.
- Tests : Vitest (front), Jest + supertest (API). Tout module financier = tests obligatoires avant merge.

## Commandes
```bash
pnpm dev            # front + api (turbo)
pnpm test           # tous les tests
pnpm test:finance   # suite calculs financiers (bloquante CI)
pnpm prisma migrate dev
pnpm lint && pnpm typecheck
```

## Règles métier NON NÉGOCIABLES
1. **Montants** : entiers FCFA en base, jamais de flottants. Helper unique `fcfa()` pour l'affichage (`fr-FR`).
2. **Snapshot à l'émission** : devis, situations, factures, bulletins figent taux (TVA, CNPS) et totaux en JSON à l'émission. Un changement de paramètre ne réécrit JAMAIS un document émis.
3. **Circuit DQE** : sous-totaux par lot → total HT → remise → TVA 19,25 % → TTC. Unités valides : u, m², m³, kg, ml, ff, pm, ens, mois. `pm` = pour mémoire, jamais chiffré.
4. **VEFA** : un appel de fonds n'est émissible que si son jalon chantier est validé (constat contradictoire). Lien jalon→appel = clé étrangère, pas une convention.
5. **Multi-tenant** : `tenant_id` sur toutes les tables + RLS PostgreSQL. Aucune requête sans scope tenant.
6. **Audit** : table append-only (aucun UPDATE/DELETE), 12 mois mini. Logger : auth, CRUD sensibles, exports, changements de permissions.
7. **Offline** : écritures terrain en file IndexedDB, idempotentes (uuid client), rejouées à la reconnexion. Conflit = dernier écrit gagne + entrée d'audit.
8. **Secrets** : clés MoMo/OM/WhatsApp/SMS côté serveur uniquement. Le front ne voit que les 4 derniers caractères.
9. **Timezone** : `Africa/Douala` partout. ISO en base, `dd/MM/yyyy` à l'affichage.
10. **Juridique** : ne jamais générer de citation d'article de loi non présente dans les templates versionnés et validés (dossier `legal/templates/`, statut `valide_par` obligatoire). Bandeau "modèle indicatif" tant que non validé notaire. Taux CNPS = paramètres, pas de constantes en dur.

## Conventions code
- Français pour : UI, noms de domaine métier (chantier, devis, appel_de_fonds). Anglais pour : infra/technique générique.
- Design system : extraire `Card`, `StatutBadge`, `Progress`, `Hazard`, `Toggle` du prototype vers `packages/ui`. Couleurs = objet `C` du prototype (acier #1B2530, orange #F26B1D). Polices Barlow / Barlow Condensed.
- Numérotations paramétrables par tenant : DEV-, FAC-, DQE-, RES-, séquence par exercice.
- Commits : Conventional Commits, français OK dans le sujet.
- Une PR = un module ou une tranche verticale. Jamais de PR mêlant migration destructive + logique.

## Backlog par phase (ordre impératif)
- **P0** : auth/RBAC (matrice du prototype), chantiers+jalons, pointage offline, devis DQE+PDF, factures+MoMo, stocks, dashboard.
- **P1** : situations+retenue 10 %, rentabilité+garde-fous (seuil 90 % paramétrable), exports SYSCOHADA, réserves/OPR, Gantt, paie CNPS.
- **P2** : programmes/lots, VEFA appels de fonds, contrats CM, portail acquéreur+simulateur, signature OTP.
- **P3** : bibliothèque prix mutualisée+coef régionaux, import DPGF, prédictions v1 (règles statistiques, PAS de ML, pas de données inter-tenants), vitrine publique, annuaire.

## Pièges connus
- Prototype = source UX, pas source code : état en mémoire, données `*_INIT` factices, aucun appel réseau.
- Les 5 "prédictions IA" du prototype sont statiques — v1 = règles (voir README §7). Étiqueter "estimation".
- Échéancier VEFA et dépôt de garantie 2 % = pratique du promoteur, paramétrables, pas légaux en dur.
- Prix BPU = extraits de DQE réels 2026 base Yaoundé ; prévoir table `region_coefs` et date de validité.
