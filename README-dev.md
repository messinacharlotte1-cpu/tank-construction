# Tank Construction / Tank'Immo — Plateforme SaaS BTP & Promotion immobilière

Prototype fonctionnel de référence : `tank-construction-saas.jsx` (React, fichier unique, ~4 000 lignes).
Ce README s'adresse à l'équipe de développement chargée de transformer le prototype en produit (réf. CDC-TANK-2026-003 et avenants).

---

## 1. Vue d'ensemble

Plateforme tout-en-un pour une entreprise camerounaise à double métier :

- **Constructeur (BTP)** : chantiers, pointage terrain, devis DQE, stocks, paie CNPS, sous-traitance, incidents.
- **Promoteur immobilier** : programmes, grille des lots, VEFA, appels de fonds liés aux jalons chantier, contrats conformes au droit camerounais, vitrine publique.

**Différenciateurs à préserver absolument** (aucun concurrent ne les combine) :
1. Fonctionnement **hors-ligne** terrain (PWA + synchronisation).
2. Paiements **MTN Mobile Money / Orange Money** natifs.
3. **Appels de fonds VEFA déclenchés par les jalons chantier** (le chantier pilote la trésorerie).
4. **Conformité juridique camerounaise** (loi n°97/003, OHADA, TVA 19,25 %, CNPS, SYSCOHADA).
5. Bibliothèque de prix camerounaise avec coefficients régionaux.

## 2. Lancer le prototype

Le prototype est un composant React autonome (export default) prévu pour un environnement type Vite + React 18 :

```bash
npm create vite@latest tank-proto -- --template react
cd tank-proto && npm i recharts lucide-react
# copier tank-construction-saas.jsx dans src/, l'importer dans App.jsx
npm run dev
```

Dépendances : `react`, `recharts` (graphiques), `lucide-react` (icônes). Polices Google Fonts : Barlow + Barlow Condensed (import CSS dans le composant). Aucune persistance : tout l'état est en mémoire (`useState`) avec des jeux de données `*_INIT` — c'est volontaire, le prototype est une maquette UX validée client, pas une base de code à faire évoluer telle quelle.

## 3. Cartographie du prototype

| Section nav | Module (page id) | Composant | Points clés |
|---|---|---|---|
| Pilotage | dashboard | `Dashboard` | KPI, alertes cliquables, météo du jour |
| Pilotage | rentabilite | `Rentabilite` | marge/chantier, garde-fous (seuil 90 %), engagé/facturé/encaissé, exports SYSCOHADA |
| Pilotage | predictions | `PredictionsIA` | 5 prédictions statiques (à remplacer par vrai moteur, cf. §7) |
| Opérations | chantiers | `Chantiers` + onglets | jalons, tâches, `MediaAnnot` (épingles plans/photos), `ReservesTab` (OPR), journal + météo |
| Opérations | planning | `PlanningGantt` | barres/lot, avancement réel, dépendances, décalage ±1 sem |
| Opérations | pointage | `Pointage` | P/DM/A tactile, paie du jour |
| Opérations | incidents | `Incidents` | checklist sécurité, registre |
| Opérations | materiel | `Materiel` | parc engins, entretiens |
| Opérations | meteo | `Meteo` | prévisions + impact planning (API à brancher) |
| Commercial | devis | `DevisFactures`, `DQEDetail`, `DQEPDFModal`, `SituationsTab` | structure lots→sous-ouvrages→lignes, unités ff/pm, remise avant TVA, ratio m², situations + retenue 10 %, signature électronique |
| Commercial | ao | `AppelsOffres` | bibliothèque `BPU_CM` + `COEF_REGION`, import DPGF simulé |
| Commercial | portail | `PortailClient` | 2 profils : maître d'ouvrage / acquéreur (échéancier perso, `Simulateur`, catalogue) |
| Commercial | vitrine | `Vitrine` | page publique programme + annuaire artisans |
| Promotion | programmes | `Programmes`, `PlanMasseSVG`, `PlanTypo` | plan masse cliquable, grille lots (bloc/niveau), analytique commercialisation |
| Promotion | vefa | `VefaAppels` | échéancier lié aux jalons, réservations |
| Promotion | contrats | `ContratsCM`, `ContratVEFAModal` | audit avant/après, génération contrat droit CM |
| Ressources | stocks, fournisseurs, soustraitance, paie, messagerie | idem | mouvements stock, retenues garantie ST, bulletins CNPS, fil + notifications WhatsApp |
| Administration | equipe | `EquipeAgence` | rôles, matrice permissions, invitations, audit |
| Administration | parametres | `ParametresAgence` | identité, marque, taux, échéancier VEFA défaut, intégrations, sécurité |

Constantes métier réutilisables : `TVA` (0.1925), `fcfa()` (formatage), `ECHEANCIER_VEFA`, `BPU_CM`, `COEF_REGION`, `CNPS_SALARIE/EMPLOYEUR`, `SEUIL_PRECO_BANQUE`. En production : tout devient paramétrable via le module Paramètres (table `settings` versionnée — un changement de taux ne réécrit jamais les documents émis).

## 4. Architecture cible

```
Front web (React + Vite) ── API REST/GraphQL ── Node.js (NestJS ou Express + Prisma)
Front terrain (PWA)      ──────────────────────── PostgreSQL (+ Redis file d'attente)
        │ IndexedDB (offline)                     S3-compatible (photos, PDF, plans)
        └── sync différée (queue)                 Workers : PDF, notifications, prédictions
```

- **Multi-tenant** dès le départ (colonne `tenant_id` partout + RLS PostgreSQL) : la plateforme sera vendue à d'autres entreprises via With Digital Consulting.
- **Offline-first** pour les écrans terrain uniquement (pointage, rapport journalier, checklist sécurité, réserves, photos) : file d'écritures IndexedDB rejouée à la reconnexion, résolution de conflits « dernier écrit gagne + journal ».
- **PDF** : génération côté serveur (Puppeteer ou react-pdf) à partir des mêmes composants d'aperçu que le prototype (DQE, situations, contrats, bulletins).

## 5. Modèle de données (noyau)

```
tenants ─┬─ users (role, acces: email2fa|pin) ── audit_log
         ├─ chantiers ─┬─ taches (gantt: debut, duree, dep, pct)
         │             ├─ jalons ── (déclencheurs d'appels de fonds ↓)
         │             ├─ rapports_journaliers (meteo, photos[])
         │             ├─ medias ── annotations (x, y, auteur, role, fil, resolu)
         │             ├─ reserves (statut, echeance, entreprise, media_ref)
         │             └─ pointages (ouvrier, date, statut P|DM|A)
         ├─ devis ─ lots ─ sous_ouvrages ─ lignes (u ∈ {u,m²,m³,kg,ml,ff,pm,ens,mois})
         ├─ situations (cumul_pct, retenue, statut)
         ├─ factures / paiements (mode: momo|om|virement, ref transaction)
         ├─ bpu_ouvrages (cat, pu_base, region_coefs)
         ├─ programmes ─ typologies ─ lots_immo (bloc, niveau, statut)
         │        └─ reservations ─ appels_de_fonds (jalon_ref, statut, echeance)
         ├─ contrats (type, template_version, statut_signature, otp_log)
         └─ settings (clé, valeur, version, effectif_le)
```

Règle d'or : **jamais de montant recalculé rétroactivement**. Devis, situations, factures, bulletins figent leurs taux et totaux à l'émission (snapshot JSON).

## 6. Intégrations externes

| Service | Usage | Priorité |
|---|---|---|
| MTN MoMo API / Orange Money API | appels de fonds, factures, salaires par lot | P0 |
| WhatsApp Business API | notifications (rapports, relances J+15/J+30, incidents, appels de fonds) | P0 |
| SMS (OTP) | connexion PIN terrain, signature électronique | P0 |
| API météo (OpenWeather ou équiv.) | journal chantier + impact planning | P1 |
| Veille ARMP (scraping/flux) | pipeline DAO | P2 |

Signature électronique : OTP SMS + horodatage + empreinte du PDF (hash) consignés dans `otp_log`. Faire valider le dispositif par le conseil juridique (valeur probante au Cameroun) avant mise en avant commerciale.

## 7. Prédictions IA — cadrage honnête

Les 5 prédictions du prototype sont **statiques**. V1 réaliste = règles + statistiques simples, pas de ML :
- rupture stock : conso moyenne glissante vs stock/seuil + délai fournisseur ;
- dérive budget : consommé % vs avancement % (déjà en garde-fou) ;
- retard : vitesse d'avancement observée vs restant + météo ;
- trésorerie : historique de délais de paiement par payeur.
Étiqueter « estimation » dans l'UI, confiance = qualité des données. Pas de mutualisation inter-tenants sans consentement explicite (l'UI le promet déjà).

## 8. Sécurité & conformité

- Auth : email + mot de passe + 2FA TOTP (direction/compta) ; PIN 6 chiffres + device binding (terrain). Sessions paramétrables.
- RBAC : matrice rôles×modules du prototype = source de vérité, stockée en base, éditable, Super Admin verrouillé.
- Audit log immuable (append-only) 12 mois minimum : connexions, CRUD, exports.
- Chiffrement : secrets intégrations côté serveur (vault), jamais exposés au front (l'UI masque déjà).
- Données personnelles acquéreurs : registre des traitements, consentement à la collecte (formulaires réservation).
- Sauvegardes : base quotidienne chiffrée + fichiers hebdo, test de restauration mensuel.

## 9. Phasage proposé

| Phase | Périmètre | Modules |
|---|---|---|
| P0 — MVP constructeur | auth/rôles, chantiers, pointage offline, devis DQE + PDF, factures + MoMo, stocks, dashboard | 8 sem. dev annoncées CDC : à re-chiffrer, périmètre a doublé |
| P1 — Finance & terrain | situations + retenue, rentabilité + garde-fous, exports SYSCOHADA, réserves/OPR, planning Gantt, paie CNPS |
| P2 — Promotion | programmes/lots, VEFA + appels de fonds sur jalons, contrats CM, portail acquéreur + simulateur, signature électronique |
| P3 — Croissance | bibliothèque prix mutualisée, import DPGF, prédictions v1, vitrine publique, annuaire, appli mobile store |

## 10. Conventions

- **Langue** : UI 100 % français (préparer i18n clé-valeur dès P0 — l'anglais viendra pour le marché anglophone CM/Nigeria).
- Montants : entiers FCFA en base (pas de décimales), formatage `fr-FR` à l'affichage, `fcfa()` unique.
- Dates : `Africa/Douala` partout, format `dd/MM/yyyy` à l'affichage, ISO en base.
- Design system : couleurs `C.*` du prototype (acier `#1B2530`, orange `#F26B1D`), Barlow/Barlow Condensed, composants `Card`, `StatutBadge`, `Progress`, `Hazard`, `Toggle` → extraire en librairie partagée.
- Numérotations : préfixes paramétrables (`DEV-`, `FAC-`, `DQE-`, `RES-`, `R-` réserves), séquences par tenant et par exercice.

## 11. Points de vigilance juridiques et métier

- Contrats générés : **modèles indicatifs** — bandeau d'avertissement obligatoire conservé tant qu'un notaire/juriste camerounais n'a pas validé chaque template (prévoir versionnage des templates validés).
- Taux CNPS du prototype = indicatifs ; à confirmer avec un comptable avant activation du module paie.
- Ne jamais citer d'article de loi non vérifié dans les documents générés ; renvoyer aux textes (loi n°97/003, décret n°2007/1419/PM mod. 2014/2378/PM, ordonnance n°74-1, Actes uniformes OHADA).
- Le plafond du dépôt de garantie VEFA (2 % dans le prototype) reprend la pratique du promoteur : le rendre paramétrable, pas codé en dur.

---

Questions sur un module précis : partir du composant correspondant dans le prototype — chaque écran validé avec le client y figure à l'identique.
