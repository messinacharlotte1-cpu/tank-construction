import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, HardHat, Users, FileText, Package, Truck,
  AlertTriangle, MapPin, Calendar, TrendingUp, Plus, ChevronRight,
  CircleDollarSign, ClipboardCheck, Camera, WifiOff, Search,
  ArrowDownCircle, ArrowUpCircle, Star, Phone, CheckCircle2, XCircle,
  MinusCircle, Bell, Menu, X, ShieldAlert, Eye, Download, FolderOpen,
  CloudSun, Image as ImageIcon, CheckSquare, Square, Printer,
  Wrench, Wallet, MessageCircle, CloudRain, Sun, Cloud, Send, Gavel,
  Banknote, Fuel, PieChart as PieChartIcon, Building2, Scale, Landmark, Home,
  Settings, UserCog, KeyRound, Palette, Mail, Lock, Sparkles, Store, Upload, PenLine
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, Legend
} from "recharts";

/* ─────────────────────────────────────────────────────────
   TANK CONSTRUCTION — Prototype SaaS Gestion BTP (Cameroun)
   Design : acier / orange sécurité — CDC-TANK-2026-003
   ───────────────────────────────────────────────────────── */

const C = {
  steel: "#1B2530",
  steelMid: "#2C3A49",
  steelSoft: "#46586B",
  concrete: "#F0F2F4",
  white: "#FFFFFF",
  orange: "#F26B1D",
  orangeSoft: "#FDE8DB",
  green: "#1F9D55",
  greenSoft: "#E3F5EA",
  red: "#D64541",
  redSoft: "#FBE7E6",
  amber: "#E9A100",
  amberSoft: "#FCF3DB",
  line: "#DDE3E9",
};

const fcfa = (n) =>
  n.toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";

const TVA = 0.1925; // TVA Cameroun 19,25 %

/* ── Données de démonstration ─────────────────────────── */

const CHANTIERS_INIT = [
  {
    id: 1, nom: "Immeuble R+4 Bastos", client: "SCI Horizon", ville: "Yaoundé",
    statut: "En cours", budget: 185000000, consomme: 112400000,
    debut: "12/01/2026", fin: "30/09/2026", avancementPrevu: 68, avancementReel: 61,
    taches: [
      { nom: "Terrassement", lot: "Gros œuvre", pct: 100 },
      { nom: "Fondations semelles filantes", lot: "Gros œuvre", pct: 100 },
      { nom: "Élévation R+2", lot: "Gros œuvre", pct: 80 },
      { nom: "Plomberie encastrée", lot: "Second œuvre", pct: 35 },
      { nom: "Électricité — gaines", lot: "Second œuvre", pct: 20 },
    ],
  },
  {
    id: 2, nom: "Villa duplex Bonapriso", client: "M. Ekambi Jules", ville: "Douala",
    statut: "En cours", budget: 78000000, consomme: 31200000,
    debut: "03/03/2026", fin: "15/11/2026", avancementPrevu: 42, avancementReel: 45,
    taches: [
      { nom: "Fondations", lot: "Gros œuvre", pct: 100 },
      { nom: "Dalle RDC", lot: "Gros œuvre", pct: 90 },
      { nom: "Élévation murs", lot: "Gros œuvre", pct: 40 },
    ],
  },
  {
    id: 3, nom: "Entrepôt logistique Nsam", client: "CamerLog SARL", ville: "Yaoundé",
    statut: "En retard", budget: 95000000, consomme: 88700000,
    debut: "10/11/2025", fin: "30/05/2026", avancementPrevu: 100, avancementReel: 86,
    taches: [
      { nom: "Charpente métallique", lot: "Structure", pct: 100 },
      { nom: "Couverture bac acier", lot: "Structure", pct: 95 },
      { nom: "Dallage industriel", lot: "Finitions", pct: 60 },
    ],
  },
  {
    id: 4, nom: "Réhabilitation école Mvog-Ada", client: "Commune Yaoundé IV", ville: "Yaoundé",
    statut: "Terminé", budget: 24000000, consomme: 22800000,
    debut: "05/09/2025", fin: "20/02/2026", avancementPrevu: 100, avancementReel: 100,
    taches: [{ nom: "Réception travaux", lot: "Livraison", pct: 100 }],
  },
];

const OUVRIERS_INIT = [
  { id: 1, nom: "ABENA Paul", metier: "Maçon", tarif: 5000, chantier: "Immeuble R+4 Bastos", pointage: "P" },
  { id: 2, nom: "FOUDA Éric", metier: "Ferrailleur", tarif: 5500, chantier: "Immeuble R+4 Bastos", pointage: "P" },
  { id: 3, nom: "NGONO Sylvie", metier: "Chef d'équipe", tarif: 8000, chantier: "Immeuble R+4 Bastos", pointage: "P" },
  { id: 4, nom: "MBARGA Denis", metier: "Coffreur", tarif: 5500, chantier: "Villa duplex Bonapriso", pointage: "DM" },
  { id: 5, nom: "TCHOUPO Alain", metier: "Manœuvre", tarif: 3500, chantier: "Villa duplex Bonapriso", pointage: "A" },
  { id: 6, nom: "ESSOMBA Rita", metier: "Électricienne", tarif: 7000, chantier: "Entrepôt logistique Nsam", pointage: "P" },
  { id: 7, nom: "KAMDEM Serge", metier: "Plombier", tarif: 6500, chantier: "Immeuble R+4 Bastos", pointage: "P" },
  { id: 8, nom: "ONANA Michel", metier: "Manœuvre", tarif: 3500, chantier: "Entrepôt logistique Nsam", pointage: "A" },
];

const DEVIS_INIT = [
  { id: "DEV-2026-014", client: "SCI Horizon", objet: "Avenant lot plomberie R+4", ht: 8400000, statut: "Envoyé", date: "28/06/2026" },
  { id: "DEV-2026-013", client: "M. Ekambi Jules", objet: "Carrelage & faïence villa", ht: 6150000, statut: "Accepté", date: "21/06/2026" },
  { id: "DEV-2026-012", client: "Commune Yaoundé IV", objet: "Clôture périmétrique école", ht: 4800000, statut: "Refusé", date: "12/06/2026" },
  { id: "DEV-2026-011", client: "CamerLog SARL", objet: "Extension quai de chargement", ht: 15600000, statut: "Brouillon", date: "08/06/2026" },
];

const FACTURES_INIT = [
  { id: "FAC-2026-041", client: "SCI Horizon", objet: "Situation n°4 — R+4 Bastos", ttc: 21460000, statut: "Payée", mode: "Virement", echeance: "15/06/2026" },
  { id: "FAC-2026-042", client: "M. Ekambi Jules", objet: "Acompte 30 % carrelage", ttc: 2200400, statut: "Payée", mode: "MTN MoMo", echeance: "25/06/2026" },
  { id: "FAC-2026-043", client: "CamerLog SARL", objet: "Situation n°6 — Entrepôt Nsam", ttc: 11920000, statut: "Impayée", mode: "—", echeance: "20/06/2026" },
  { id: "FAC-2026-044", client: "SCI Horizon", objet: "Situation n°5 — R+4 Bastos", ttc: 18730000, statut: "Envoyée", mode: "—", echeance: "15/07/2026" },
];

const STOCK_INIT = [
  { id: 1, ref: "CIM-50", designation: "Ciment CIMENCAM 50 kg", unite: "sac", pu: 5400, stock: 320, seuil: 150 },
  { id: 2, ref: "FER-12", designation: "Fer à béton Ø12 — barre 12 m", unite: "barre", pu: 8200, stock: 96, seuil: 120 },
  { id: 3, ref: "SAB-M3", designation: "Sable de rivière", unite: "m³", pu: 15000, stock: 42, seuil: 20 },
  { id: 4, ref: "GRA-M3", designation: "Gravier concassé 5/15", unite: "m³", pu: 22000, stock: 12, seuil: 15 },
  { id: 5, ref: "PAR-20", designation: "Parpaing 20×20×40", unite: "unité", pu: 450, stock: 5400, seuil: 2000 },
  { id: 6, ref: "BAC-AC", designation: "Bac acier 0,45 mm — 6 m", unite: "feuille", pu: 14500, stock: 28, seuil: 30 },
];

const FOURNISSEURS = [
  { id: 1, nom: "Quincaillerie du Mfoundi", specialite: "Fer, ciment, outillage", ville: "Yaoundé", note: 4.5, commandes: 23, tel: "6 77 12 34 56" },
  { id: 2, nom: "SOCAMAT Douala", specialite: "Agrégats, béton prêt", ville: "Douala", note: 4.0, commandes: 11, tel: "6 99 45 67 89" },
  { id: 3, nom: "Metal Pro CM", specialite: "Charpente, bac acier", ville: "Douala", note: 3.5, commandes: 7, tel: "6 55 98 76 54" },
  { id: 4, nom: "ElecBat Sarl", specialite: "Matériel électrique", ville: "Yaoundé", note: 4.8, commandes: 15, tel: "6 90 11 22 33" },
];

const INCIDENTS_INIT = [
  { id: 1, date: "02/07/2026", chantier: "Immeuble R+4 Bastos", type: "Sécurité", gravite: "Élevée", statut: "En cours", desc: "Garde-corps provisoire manquant au R+2 — zone balisée, pose prévue lundi." },
  { id: 2, date: "28/06/2026", chantier: "Entrepôt logistique Nsam", type: "Matériel", gravite: "Moyenne", statut: "Résolu", desc: "Panne bétonnière — remplacée par location SOCAMAT sous 24 h." },
  { id: 3, date: "25/06/2026", chantier: "Villa duplex Bonapriso", type: "Accident bénin", gravite: "Faible", statut: "Clôturé", desc: "Coupure légère à la main (manœuvre) — soins sur place, EPI rappelés." },
  { id: 4, date: "19/06/2026", chantier: "Immeuble R+4 Bastos", type: "Intempéries", gravite: "Moyenne", statut: "Clôturé", desc: "Pluie violente — coulage reporté, bâchage des aciers effectué." },
];

const CHECKLIST_INIT = [
  { id: 1, item: "EPI portés par tous (casques, chaussures, gilets)", ok: true },
  { id: 2, item: "Signalisation et balisage des zones à risque", ok: true },
  { id: 3, item: "Échafaudages vérifiés et stabilisés", ok: false },
  { id: 4, item: "Outillage électrique contrôlé (câbles, disjoncteurs)", ok: true },
  { id: 5, item: "Trousse de secours complète et accessible", ok: true },
  { id: 6, item: "Zone de stockage matériaux dégagée", ok: false },
];

const DOCS_CLIENT = [
  { nom: "Devis DEV-2026-002 signé.pdf", type: "Devis", date: "10/01/2026" },
  { nom: "Permis de construire N°PC-2025-1184.pdf", type: "Réglementaire", date: "18/12/2025" },
  { nom: "PV réunion de chantier n°11.pdf", type: "Compte-rendu", date: "27/06/2026" },
  { nom: "Plans architecte — indice C.pdf", type: "Plans", date: "05/03/2026" },
];

const PHOTOS_CLIENT = [
  { label: "Coulage dalle R+2", date: "02/07/2026", tint: "#5A6B7D" },
  { label: "Élévation façade sud", date: "26/06/2026", tint: "#7D6B5A" },
  { label: "Ferraillage poteaux", date: "20/06/2026", tint: "#5A7D6B" },
  { label: "Vue générale chantier", date: "14/06/2026", tint: "#6B5A7D" },
];

/* ── Données modules étendus ──────────────────────────── */

const RENTA = [
  { chantier: "Immeuble R+4 Bastos", facture: 118500000, mo: 28400000, materiaux: 61200000, soustraitance: 14800000, frais: 8000000 },
  { chantier: "Villa duplex Bonapriso", facture: 34500000, mo: 8100000, materiaux: 16900000, soustraitance: 3200000, frais: 3000000 },
  { chantier: "Entrepôt logistique Nsam", facture: 89200000, mo: 21700000, materiaux: 47300000, soustraitance: 12400000, frais: 7300000 },
  { chantier: "Réhabilitation école Mvog-Ada", facture: 24000000, mo: 6800000, materiaux: 11400000, soustraitance: 1900000, frais: 2700000 },
];

const SOUS_TRAITANTS = [
  { id: 1, nom: "ElecBat Sarl", lot: "Électricité — Immeuble R+4", montant: 14800000, avance: 60, retenue: 10, caution: "Oui", fin: "30/08/2026", statut: "En cours" },
  { id: 2, nom: "AquaPlomb CM", lot: "Plomberie sanitaire — Villa Bonapriso", montant: 5600000, avance: 30, retenue: 10, caution: "Non", fin: "15/10/2026", statut: "En cours" },
  { id: 3, nom: "Metal Pro CM", lot: "Charpente métallique — Entrepôt Nsam", montant: 22400000, avance: 100, retenue: 10, caution: "Oui", fin: "28/02/2026", statut: "Garantie" },
  { id: 4, nom: "PeintDeco 237", lot: "Peinture — École Mvog-Ada", montant: 3100000, avance: 100, retenue: 0, caution: "Non", fin: "20/02/2026", statut: "Soldé" },
];

const ENGINS_INIT = [
  { id: 1, nom: "Bétonnière 500 L — B01", affectation: "Immeuble R+4 Bastos", statut: "En service", entretien: "12/08/2026", carburant: "Essence — 18 L/sem" },
  { id: 2, nom: "Bétonnière 350 L — B02", affectation: "Villa duplex Bonapriso", statut: "En panne", entretien: "—", carburant: "Essence" },
  { id: 3, nom: "Pick-up Toyota Hilux — V01", affectation: "Logistique inter-chantiers", statut: "En service", entretien: "30/07/2026", carburant: "Gasoil — 95 L/sem" },
  { id: 4, nom: "Échafaudage tubulaire 200 m²", affectation: "Immeuble R+4 Bastos", statut: "En service", entretien: "Contrôle 15/07/2026", carburant: "—" },
  { id: 5, nom: "Groupe électrogène 15 kVA — G01", affectation: "Entrepôt logistique Nsam", statut: "Entretien", entretien: "En cours (vidange)", carburant: "Gasoil — 60 L/sem" },
];

const BPU = [
  { ref: "GO-101", designation: "Béton dosé 350 kg/m³ pour béton armé", unite: "m³", pu: 145000 },
  { ref: "GO-102", designation: "Maçonnerie parpaings 20×20×40 hourdés", unite: "m²", pu: 12500 },
  { ref: "GO-103", designation: "Acier HA pour béton armé (façonnage-pose)", unite: "kg", pu: 1450 },
  { ref: "TE-201", designation: "Fouilles en rigole terrain ordinaire", unite: "m³", pu: 6500 },
  { ref: "SO-301", designation: "Enduit ciment intérieur 2 couches", unite: "m²", pu: 4800 },
  { ref: "SO-302", designation: "Carrelage grès cérame 60×60 (fourniture-pose)", unite: "m²", pu: 18500 },
];

const DAO_INIT = [
  { id: 1, objet: "Construction bloc administratif — Commune Mfou", maitre: "Commune de Mfou (ARMP)", montant: 148000000, limite: "25/07/2026", statut: "En préparation" },
  { id: 2, objet: "Réhabilitation marché central — Obala", maitre: "MINHDU", montant: 96000000, limite: "18/07/2026", statut: "En préparation" },
  { id: 3, objet: "Logements sociaux Olembe — lot 3", maitre: "SIC", montant: 320000000, limite: "10/06/2026", statut: "Déposé" },
  { id: 4, objet: "Clôture lycée technique Nkolbisson", maitre: "MINESEC", montant: 42000000, limite: "02/05/2026", statut: "Gagné" },
  { id: 5, objet: "Pavage voirie quartier Odza", maitre: "CUY", montant: 210000000, limite: "15/04/2026", statut: "Perdu" },
];

const JOURS_MOIS = 24; // jours ouvrés pointés sur le mois
const CNPS_SALARIE = 0.042;   // pension vieillesse part salarié
const CNPS_EMPLOYEUR = 0.1195; // PV + PF + AT (taux groupe B indicatif)

const MESSAGES_INIT = [
  { id: 1, auteur: "NGONO Sylvie", role: "Chef d'équipe", chantier: "Immeuble R+4 Bastos", heure: "07:42", texte: "Checklist sécurité signée. Équipe complète, 6 présents. Démarrage élévation R+3.", canal: "app" },
  { id: 2, auteur: "Système", role: "Alerte auto", chantier: "Dépôt central", heure: "08:00", texte: "⚠️ Stock bac acier sous seuil (28/30). Bon de commande suggéré : Metal Pro CM.", canal: "whatsapp" },
  { id: 3, auteur: "KAMDEM Serge", role: "Plombier", chantier: "Immeuble R+4 Bastos", heure: "10:15", texte: "Besoin de 12 coudes PVC Ø110 pour finir la colonne EU. Dispo au dépôt ?", canal: "app" },
  { id: 4, auteur: "Système", role: "Relance auto", chantier: "Entrepôt Nsam", heure: "09:00", texte: "Relance J+15 envoyée à CamerLog SARL — facture FAC-2026-043 (11 920 000 FCFA).", canal: "whatsapp" },
];

const METEO = [
  { jour: "Sam 04", ville: "Yaoundé", icone: "pluie", desc: "Orages après-midi", tmin: 20, tmax: 27, pluie: 78, impact: "Coulage dalle déconseillé après 13 h" },
  { jour: "Dim 05", ville: "Yaoundé", icone: "nuage", desc: "Couvert", tmin: 19, tmax: 26, pluie: 30, impact: null },
  { jour: "Lun 06", ville: "Yaoundé", icone: "soleil", desc: "Éclaircies", tmin: 19, tmax: 28, pluie: 10, impact: "Fenêtre favorable pour le coulage R+3" },
  { jour: "Mar 07", ville: "Yaoundé", icone: "pluie", desc: "Pluies éparses", tmin: 20, tmax: 26, pluie: 55, impact: null },
  { jour: "Mer 08", ville: "Yaoundé", icone: "nuage", desc: "Couvert", tmin: 20, tmax: 27, pluie: 35, impact: null },
];

/* ── DQE structuré (structure et prix issus du devis réel Mekoumbou) ── */

const DQE_INIT = [{
  id: "DQE-2026-015",
  client: "M. Moukoumbou Alain",
  chantier: "Immeuble R+2 — 4 appartements, Mekoumbou",
  date: "04/07/2026",
  statut: "Envoyé",
  surface: 457.53,
  remisePct: 2.88,
  lots: [
    { num: "100", titre: "Installation de chantier", sousOuvrages: [
      { titre: null, lignes: [
        { n: "101", des: "Brouettes soudées", u: "u", q: 3, pu: 31257 },
        { n: "109", des: "Amené et repli du matériel", u: "ff", q: 1, pu: 156287 },
        { n: "111", des: "Clôture de chantier provisoire ht 2,20 m", u: "ff", q: 1, pu: 450000 },
        { n: "113", des: "Gardiennage nuit/jour pendant la durée des travaux", u: "pm", q: 0, pu: 0 },
        { n: "115", des: "Nettoyage permanent, hygiène et sécurité", u: "mois", q: 12, pu: 200000 },
        { n: "116", des: "Implantation générale, repérage des axes", u: "ff", q: 1, pu: 416764 },
      ]},
    ]},
    { num: "200", titre: "Terrassements", sousOuvrages: [
      { titre: "Terrassements généraux", lignes: [
        { n: "201", des: "Terrassement en pleine masse y/c évacuation des excédents", u: "m³", q: 83.33, pu: 3647 },
      ]},
    ]},
    { num: "300", titre: "Fondations", sousOuvrages: [
      { titre: "Fouilles et béton de propreté", lignes: [
        { n: "301", des: "Fouilles en puits", u: "m³", q: 66.96, pu: 3230 },
        { n: "302", des: "Fouilles en rigole 0,6 × 1 m pour soubassement", u: "ml", q: 138, pu: 1146 },
        { n: "304", des: "Béton de propreté dosé à 150 kg/m³", u: "m³", q: 4.93, pu: 55887 },
      ]},
      { titre: "Semelles isolées", lignes: [
        { n: "305", des: "Béton dosé à 350 kg/m³", u: "m³", q: 11.16, pu: 82598 },
        { n: "307", des: "Acier HA", u: "kg", q: 446.4, pu: 898 },
      ]},
      { titre: "Longrines", lignes: [
        { n: "319", des: "Béton dosé à 350 kg/m³ y/c hydrofuge de masse", u: "m³", q: 8.68, pu: 82598 },
        { n: "320", des: "Coffrage lisse et soigné", u: "m²", q: 86.79, pu: 3113 },
        { n: "321", des: "Acier HA", u: "kg", q: 694.32, pu: 898 },
      ]},
      { titre: "Dallage", lignes: [
        { n: "322", des: "Béton pour dallage de sol ép. 8 cm", u: "m³", q: 12.37, pu: 83353 },
      ]},
    ]},
    { num: "500", titre: "Rez-de-chaussée", sousOuvrages: [
      { titre: "Poteaux", lignes: [
        { n: "501", des: "Béton dosé à 350 kg/m³", u: "m³", q: 3.56, pu: 82598 },
        { n: "502", des: "Coffrage lisse et soigné", u: "m²", q: 39.9, pu: 3113 },
        { n: "503", des: "Acier HA", u: "kg", q: 640.31, pu: 898 },
      ]},
      { titre: "Plancher haut", lignes: [
        { n: "516", des: "Plancher dalle à corps creux y/c toutes sujétions", u: "m²", q: 137.02, pu: 22805 },
      ]},
      { titre: "Maçonneries", lignes: [
        { n: "518", des: "Parpaings creux 15×20×40, mortier dosé 300 kg/m³", u: "m²", q: 242.86, pu: 8747 },
      ]},
      { titre: "Enduits", lignes: [
        { n: "520", des: "Enduits muraux ép. 1,5 cm (gobetis, corps, finition)", u: "m²", q: 581.18, pu: 2365 },
      ]},
    ]},
    { num: "900", titre: "Charpente — Couverture", sousOuvrages: [
      { titre: "Charpente", lignes: [
        { n: "913", des: "Ferme en bois moisé traité au xylamon, ht 1 m / lg 7,6 m", u: "m³", q: 1.44, pu: 135448 },
      ]},
      { titre: "Couverture", lignes: [
        { n: "915", des: "Tôles bac alu ép. 6/10ᵉ y/c toutes sujétions", u: "m²", q: 180.47, pu: 4785 },
      ]},
    ]},
  ],
}];

const ligneTotal = (l) => l.u === "pm" ? 0 : Math.round(l.q * l.pu);
const lotTotal = (lot) => lot.sousOuvrages.reduce((s, so) => s + so.lignes.reduce((a, l) => a + ligneTotal(l), 0), 0);
const dqeHT = (d) => d.lots.reduce((s, lot) => s + lotTotal(lot), 0);

/* ── Médias annotables (plans & photos chantier) ─────── */

const MEDIAS_INIT = [
  { id: "plan-rdc", type: "plan", label: "Plan RDC — Appartement type (indice C)", date: "05/03/2026" },
  { id: "photo-dalle", type: "photo", label: "Photo terrain — Coulage dalle R+2", date: "02/07/2026", tint: "#5A6B7D" },
];

const ANNOTS_INIT = {
  "plan-rdc": [
    { id: 1, x: 66, y: 30, auteur: "SCI Horizon", role: "client", texte: "Peut-on inverser le sens d'ouverture de la porte de la chambre 2 ?", reponses: [{ auteur: "A. Mougang Tankwa", role: "entreprise", texte: "Oui, sans surcoût si validé avant pose des huisseries (fin juillet)." }], resolu: false },
    { id: 2, x: 25, y: 68, auteur: "A. Mougang Tankwa", role: "entreprise", texte: "Attente client : choix du carrelage séjour avant le 20/07 (réf. grès cérame 60×60 proposées au devis finitions).", reponses: [], resolu: false },
  ],
  "photo-dalle": [
    { id: 1, x: 50, y: 42, auteur: "SCI Horizon", role: "client", texte: "La réservation pour la gaine technique est-elle bien celle prévue au plan ?", reponses: [{ auteur: "NGONO Sylvie", role: "entreprise", texte: "Confirmé — réservation 40×40 contrôlée avant coulage, photo du contrôle jointe au rapport du 02/07." }], resolu: true },
  ],
};

const AVANCEMENT_DATA = [
  { mois: "Fév", prevu: 18, reel: 15 },
  { mois: "Mars", prevu: 30, reel: 27 },
  { mois: "Avr", prevu: 44, reel: 40 },
  { mois: "Mai", prevu: 56, reel: 51 },
  { mois: "Juin", prevu: 68, reel: 61 },
];

const BUDGET_DATA = CHANTIERS_INIT.filter(c => c.statut !== "Terminé").map(c => ({
  nom: c.nom.split(" ").slice(0, 2).join(" "),
  Prévu: Math.round(c.budget / 1e6),
  Consommé: Math.round(c.consomme / 1e6),
}));

/* ── Petits composants ────────────────────────────────── */

const StatutBadge = ({ s }) => {
  const map = {
    "En cours": [C.greenSoft, C.green],
    "En retard": [C.redSoft, C.red],
    "Terminé": [C.concrete, C.steelSoft],
    "En préparation": [C.amberSoft, C.amber],
    "Suspendu": [C.amberSoft, C.amber],
    "Payée": [C.greenSoft, C.green],
    "Impayée": [C.redSoft, C.red],
    "Envoyée": [C.amberSoft, C.amber],
    "Envoyé": [C.amberSoft, C.amber],
    "Accepté": [C.greenSoft, C.green],
    "Refusé": [C.redSoft, C.red],
    "Brouillon": [C.concrete, C.steelSoft],
    "Vendu": [C.greenSoft, C.green],
    "Réservé": [C.amberSoft, C.amber],
    "Disponible": [C.concrete, C.steelSoft],
    "Soldé": [C.concrete, C.steelSoft],
  };
  const [bg, fg] = map[s] || [C.concrete, C.steelSoft];
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999, letterSpacing: 0.3,
      whiteSpace: "nowrap", textTransform: "uppercase",
    }}>{s}</span>
  );
};

const Hazard = () => (
  <div style={{
    height: 6, borderRadius: 3,
    background: `repeating-linear-gradient(45deg, ${C.orange} 0 10px, ${C.steel} 10px 20px)`,
  }} />
);

const Progress = ({ pct, color = C.orange }) => (
  <div style={{ background: C.concrete, borderRadius: 4, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s" }} />
  </div>
);

const Card = ({ children, style }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.line}`, borderRadius: 12,
    padding: 20, ...style,
  }}>{children}</div>
);

const SectionTitle = ({ icon: Icon, children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>
      <Icon size={20} color={C.orange} /> {children}
    </h2>
    {action}
  </div>
);

/* ── Modules ──────────────────────────────────────────── */

function Dashboard({ chantiers, ouvriers, factures, stock, go }) {
  const actifs = chantiers.filter(c => c.statut === "En cours").length;
  const retards = chantiers.filter(c => c.statut === "En retard").length;
  const presents = ouvriers.filter(o => o.pointage === "P").length + ouvriers.filter(o => o.pointage === "DM").length * 0.5;
  const impayes = factures.filter(f => f.statut === "Impayée");
  const sousSeuil = stock.filter(m => m.stock < m.seuil);
  const budgetTotal = chantiers.reduce((s, c) => s + c.budget, 0);
  const consoTotal = chantiers.reduce((s, c) => s + c.consomme, 0);

  const kpis = [
    { label: "Chantiers actifs", val: actifs, sub: `${retards} en retard`, icon: HardHat, alert: retards > 0 },
    { label: "Présents aujourd'hui", val: presents, sub: `sur ${ouvriers.length} ouvriers`, icon: Users },
    { label: "Budget consommé", val: `${Math.round(consoTotal / budgetTotal * 100)} %`, sub: fcfa(consoTotal), icon: CircleDollarSign },
    { label: "Factures impayées", val: impayes.length, sub: fcfa(impayes.reduce((s, f) => s + f.ttc, 0)), icon: FileText, alert: impayes.length > 0 },
  ];

  const alertes = [
    ...(retards ? [{ t: "Entrepôt logistique Nsam — échéance dépassée (86 % réalisé)", type: "chantier" }] : []),
    ...sousSeuil.map(m => ({ t: `Stock sous seuil : ${m.designation} (${m.stock} ${m.unite})`, type: "stock" })),
    ...impayes.map(f => ({ t: `Facture impayée : ${f.id} — ${f.client} (${fcfa(f.ttc)})`, type: "facture" })),
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.6 }}>{k.label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 700, color: k.alert ? C.red : C.steel, lineHeight: 1.1 }}>{k.val}</div>
                <div style={{ fontSize: 12, color: C.steelSoft }}>{k.sub}</div>
              </div>
              <div style={{ background: k.alert ? C.redSoft : C.orangeSoft, borderRadius: 10, padding: 8 }}>
                <k.icon size={20} color={k.alert ? C.red : C.orange} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <Card>
          <SectionTitle icon={TrendingUp}>Avancement — Immeuble R+4 Bastos</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={AVANCEMENT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis unit=" %" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v} %`} />
              <Legend />
              <Line type="monotone" dataKey="prevu" name="Prévu" stroke={C.steelSoft} strokeWidth={2} strokeDasharray="6 4" dot={false} />
              <Line type="monotone" dataKey="reel" name="Réel" stroke={C.orange} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={CircleDollarSign}>Budget par chantier (M FCFA)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BUDGET_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Prévu" fill={C.steelSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Consommé" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div onClick={() => go("meteo")} style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, cursor: "pointer",
        background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 18px",
      }}>
        <CloudRain size={26} color="#3B82C4" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>Météo Yaoundé — {METEO[0].desc.toLowerCase()}, {METEO[0].tmax}° / pluie {METEO[0].pluie} %</div>
          <div style={{ fontSize: 12, color: C.red }}>{METEO[0].impact}</div>
        </div>
        <ChevronRight size={16} color={C.steelSoft} />
      </div>

      <Card>
        <SectionTitle icon={AlertTriangle} action={          <span style={{ fontSize: 12, color: C.steelSoft }}>{alertes.length} alerte{alertes.length > 1 ? "s" : ""}</span>
        }>Alertes critiques</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {alertes.map((a, i) => (
            <div key={i} onClick={() => go(a.type === "stock" ? "stocks" : a.type === "facture" ? "devis" : "chantiers")}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.redSoft, borderLeft: `4px solid ${C.red}`, borderRadius: 8, cursor: "pointer", fontSize: 14, color: C.steel }}>
              <AlertTriangle size={16} color={C.red} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{a.t}</span>
              <ChevronRight size={16} color={C.steelSoft} />
            </div>
          ))}
          {!alertes.length && <div style={{ color: C.steelSoft, fontSize: 14 }}>Aucune alerte. Tous les indicateurs sont au vert.</div>}
        </div>
      </Card>
    </div>
  );
}

function PlanSVG() {
  const w = { stroke: C.steel, strokeWidth: 3, fill: "none" };
  const room = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fill: C.steelSoft, fontWeight: 600, letterSpacing: 1 };
  return (
    <svg viewBox="0 0 400 260" style={{ width: "100%", height: "100%", background: "#FBFCFD", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="380" height="240" {...w} strokeWidth="5" />
      <line x1="150" y1="10" x2="150" y2="150" {...w} />
      <line x1="150" y1="150" x2="10" y2="150" {...w} />
      <line x1="150" y1="90" x2="270" y2="90" {...w} />
      <line x1="270" y1="10" x2="270" y2="90" {...w} />
      <line x1="240" y1="150" x2="390" y2="150" {...w} />
      <line x1="240" y1="150" x2="240" y2="250" {...w} />
      <line x1="320" y1="150" x2="320" y2="250" {...w} />
      {/* portes (arcs) */}
      <path d="M 150 110 A 24 24 0 0 1 174 134" stroke={C.orange} strokeWidth="2" fill="none" />
      <path d="M 270 60 A 22 22 0 0 0 248 38" stroke={C.orange} strokeWidth="2" fill="none" />
      <path d="M 280 150 A 22 22 0 0 1 258 172" stroke={C.orange} strokeWidth="2" fill="none" />
      {/* fenêtres */}
      <line x1="60" y1="10" x2="110" y2="10" stroke={C.orange} strokeWidth="6" />
      <line x1="300" y1="10" x2="360" y2="10" stroke={C.orange} strokeWidth="6" />
      <line x1="60" y1="250" x2="120" y2="250" stroke={C.orange} strokeWidth="6" />
      <line x1="340" y1="250" x2="380" y2="250" stroke={C.orange} strokeWidth="6" />
      <text x="75" y="85" {...room}>SÉJOUR</text>
      <text x="190" y="55" {...room}>CHAMBRE 1</text>
      <text x="300" y="55" {...room}>CHAMBRE 2</text>
      <text x="180" y="125" {...room}>SDB</text>
      <text x="80" y="205" {...room}>CUISINE</text>
      <text x="265" y="205" {...room}>WC</text>
      <text x="335" y="205" {...room}>CELLIER</text>
      <text x="15" y="24" style={{ fontSize: 9, fill: C.steelSoft }}>PLAN RDC — APPT TYPE · ÉCH. 1/50 · IND. C</text>
    </svg>
  );
}

function MediaAnnot({ annots, setAnnots, forceClient = false }) {
  const [mediaId, setMediaId] = useState(MEDIAS_INIT[0].id);
  const [pending, setPending] = useState(null); // {x, y}
  const [texte, setTexte] = useState("");
  const [commeClientEtat, setCommeClient] = useState(false);
  const commeClient = forceClient || commeClientEtat;
  const [reponse, setReponse] = useState({});
  const media = MEDIAS_INIT.find(m => m.id === mediaId);
  const list = annots[mediaId] || [];

  const placer = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPending({ x: Math.round((e.clientX - r.left) / r.width * 100), y: Math.round((e.clientY - r.top) / r.height * 100) });
  };

  const ajouter = () => {
    if (!pending || !texte.trim()) return;
    const a = { id: (list.at(-1)?.id || 0) + 1, ...pending, auteur: commeClient ? "SCI Horizon" : "A. Mougang Tankwa", role: commeClient ? "client" : "entreprise", texte, reponses: [], resolu: false };
    setAnnots({ ...annots, [mediaId]: [...list, a] });
    setPending(null); setTexte("");
  };

  const repondre = (id) => {
    const t = (reponse[id] || "").trim();
    if (!t) return;
    setAnnots({ ...annots, [mediaId]: list.map(a => a.id === id ? { ...a, reponses: [...a.reponses, { auteur: commeClient ? "SCI Horizon" : "A. Mougang Tankwa", role: commeClient ? "client" : "entreprise", texte: t }] } : a) });
    setReponse({ ...reponse, [id]: "" });
  };

  const basculer = (id) =>
    setAnnots({ ...annots, [mediaId]: list.map(a => a.id === id ? { ...a, resolu: !a.resolu } : a) });

  const ouverts = list.filter(a => !a.resolu).length;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MEDIAS_INIT.map(m => (
            <button key={m.id} onClick={() => { setMediaId(m.id); setPending(null); }} style={{
              ...btnGhost,
              background: mediaId === m.id ? C.steel : "transparent",
              color: mediaId === m.id ? C.white : C.steelSoft,
              borderColor: mediaId === m.id ? C.steel : C.line,
            }}>
              {m.type === "plan" ? <FolderOpen size={14} /> : <Camera size={14} />} {m.label}
            </button>
          ))}
        </div>
        {!forceClient && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.steelSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={commeClientEtat} onChange={e => setCommeClient(e.target.checked)} />
            Commenter en tant que client (simulation portail)
          </label>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 3fr) minmax(260px, 2fr)", gap: 16, alignItems: "start" }}>
        {/* Zone média cliquable */}
        <div>
          <div onClick={placer} style={{
            position: "relative", borderRadius: 10, overflow: "hidden",
            border: `1px solid ${C.line}`, cursor: "crosshair", aspectRatio: media.type === "plan" ? "400/260" : "16/10",
            background: media.type === "photo" ? `linear-gradient(135deg, ${media.tint}, ${C.steelMid})` : undefined,
          }}>
            {media.type === "plan" ? <PlanSVG /> : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,.75)" }}>
                <div style={{ textAlign: "center" }}>
                  <Camera size={38} />
                  <div style={{ fontSize: 12, marginTop: 6 }}>{media.label} · {media.date}</div>
                </div>
              </div>
            )}
            {list.map(a => (
              <div key={a.id} style={{
                position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%, -50%)",
                width: 26, height: 26, borderRadius: "50%",
                background: a.resolu ? C.green : a.role === "client" ? "#2E6FD8" : C.orange,
                color: C.white, display: "grid", placeItems: "center",
                fontSize: 12, fontWeight: 700, border: `2px solid ${C.white}`, boxShadow: "0 2px 6px rgba(0,0,0,.35)",
              }}>{a.id}</div>
            ))}
            {pending && (
              <div style={{
                position: "absolute", left: `${pending.x}%`, top: `${pending.y}%`, transform: "translate(-50%, -50%)",
                width: 26, height: 26, borderRadius: "50%", background: C.steel, color: C.white,
                display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, border: `2px dashed ${C.white}`,
              }}>+</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 6 }}>
            Cliquez sur le {media.type === "plan" ? "plan" : "la photo"} pour épingler un commentaire. Pastilles : <b style={{ color: C.orange }}>orange</b> entreprise, <b style={{ color: "#2E6FD8" }}>bleu</b> client, <b style={{ color: C.green }}>vert</b> résolu.
          </div>
          {pending && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input autoFocus placeholder={`Commentaire ${commeClient ? "client" : "entreprise"} au point (${pending.x} %, ${pending.y} %)…`}
                value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === "Enter" && ajouter()}
                style={{ ...inp, flex: 1 }} />
              <button style={btnPrimary} onClick={ajouter}><Send size={14} /> Épingler</button>
              <button style={btnGhost} onClick={() => { setPending(null); setTexte(""); }}>Annuler</button>
            </div>
          )}
        </div>

        {/* Fil des commentaires */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>
            {list.length} commentaire{list.length > 1 ? "s" : ""} · <span style={{ color: ouverts ? C.orange : C.green }}>{ouverts} ouvert{ouverts > 1 ? "s" : ""}</span>
          </div>
          {list.map(a => (
            <div key={a.id} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${a.resolu ? C.green : a.role === "client" ? "#2E6FD8" : C.orange}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                <b style={{ color: C.steel }}>#{a.id} · {a.auteur} <span style={{ fontWeight: 400, color: C.steelSoft }}>({a.role})</span></b>
                <button onClick={() => basculer(a.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: a.resolu ? C.green : C.steelSoft, fontFamily: "inherit" }}>
                  {a.resolu ? "✓ Résolu" : "Marquer résolu"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: C.steel, marginTop: 4 }}>{a.texte}</div>
              {a.reponses.map((r, i) => (
                <div key={i} style={{ marginTop: 8, marginLeft: 10, paddingLeft: 10, borderLeft: `2px solid ${C.line}`, fontSize: 12.5 }}>
                  <b style={{ color: C.steel }}>{r.auteur}</b> <span style={{ color: C.steelSoft }}>({r.role})</span>
                  <div style={{ color: C.steel }}>{r.texte}</div>
                </div>
              ))}
              {!a.resolu && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input placeholder="Répondre…" value={reponse[a.id] || ""} onChange={e => setReponse({ ...reponse, [a.id]: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && repondre(a.id)} style={{ ...inp, flex: 1, padding: "6px 10px", fontSize: 12.5 }} />
                  <button style={{ ...btnGhost, padding: "5px 10px" }} onClick={() => repondre(a.id)}><Send size={13} /></button>
                </div>
              )}
            </div>
          ))}
          {!list.length && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun commentaire sur ce média. Cliquez sur l'image pour lancer la discussion.</div>}
        </div>
      </div>
    </div>
  );
}

function Chantiers({ chantiers, selected, setSelected, annots, setAnnots }) {
  const [tab, setTab] = useState("apercu");
  const [reserves, setReserves] = useState(RESERVES_INIT);
  const ch = chantiers.find(c => c.id === selected);

  if (ch) {
    const ratio = ch.consomme / ch.budget;
    const jalons = [
      { nom: "Fondations réceptionnées", date: "28/02/2026", ok: true },
      { nom: "Élévation R+2 hors d'eau", date: "31/07/2026", ok: false },
      { nom: "Second œuvre terminé", date: "30/08/2026", ok: false },
      { nom: "Réception provisoire", date: "30/09/2026", ok: false },
    ];
    const equipe = [
      { nom: "NGONO Sylvie", role: "Chef d'équipe" }, { nom: "ABENA Paul", role: "Maçon" },
      { nom: "FOUDA Éric", role: "Ferrailleur" }, { nom: "KAMDEM Serge", role: "Plombier" },
    ];
    const journal = [
      { date: "03/07/2026", auteur: "NGONO Sylvie", meteo: "Orageux — arrêt 15 h", texte: "Coulage dalle R+2 terminé (2 toupies). Réservations gaines contrôlées avant coulage. 3 photos jointes.", photos: 3 },
      { date: "02/07/2026", auteur: "NGONO Sylvie", meteo: "Couvert", texte: "Ferraillage dalle R+2 achevé, contrôle conducteur OK. Livraison Quincaillerie du Mfoundi reçue (40 barres Ø12).", photos: 2 },
      { date: "01/07/2026", auteur: "KAMDEM Serge", meteo: "Ensoleillé", texte: "Colonnes EU/EV posées jusqu'au R+1. Attente coudes Ø110 (demande transmise au magasin).", photos: 1 },
    ];
    const tabs = [
      { id: "apercu", label: "Vue d'ensemble" },
      { id: "taches", label: "Tâches" },
      { id: "medias", label: "Plans & Photos" },
      { id: "reserves", label: "Réserves & OPR" },
      { id: "journal", label: "Journal de chantier" },
    ];

    return (
      <div style={{ display: "grid", gap: 20 }}>
        <button onClick={() => setSelected(null)} style={btnGhost}>← Retour aux chantiers</button>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Hazard />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{ch.nom}</h2>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 13, color: C.steelSoft }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={14} /> {ch.client}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {ch.ville}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={14} /> {ch.debut} → {ch.fin}</span>
                </div>
              </div>
              <StatutBadge s={ch.statut} />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  padding: "8px 14px", fontSize: 13.5, fontWeight: 700,
                  color: tab === t.id ? C.orange : C.steelSoft,
                  borderBottom: `3px solid ${tab === t.id ? C.orange : "transparent"}`,
                }}>{t.label}{t.id === "medias" && ` (${Object.values(annots).flat().filter(a => !a.resolu).length} à traiter)`}</button>
              ))}
            </div>
          </div>
        </Card>

        {tab === "apercu" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <Card style={{ padding: 16 }}>
                <div style={miniLabel}>Avancement réel vs prévu</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, color: ch.avancementReel < ch.avancementPrevu - 5 ? C.red : C.green }}>
                  {ch.avancementReel} % <span style={{ fontSize: 16, color: C.steelSoft }}>/ {ch.avancementPrevu} %</span>
                </div>
                <Progress pct={ch.avancementReel} color={ch.avancementReel < ch.avancementPrevu - 5 ? C.red : C.green} />
              </Card>
              <Card style={{ padding: 16 }}>
                <div style={miniLabel}>Budget consommé</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, color: ratio > 0.9 ? C.red : C.steel }}>{Math.round(ratio * 100)} %</div>
                <div style={{ fontSize: 12, color: C.steelSoft }}>{fcfa(ch.consomme)} / {fcfa(ch.budget)}</div>
              </Card>
              <Card style={{ padding: 16 }}>
                <div style={miniLabel}>Équipe affectée aujourd'hui</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 700, color: C.steel }}>{equipe.length}</div>
                <div style={{ fontSize: 12, color: C.steelSoft }}>{equipe.map(e => e.nom.split(" ")[0]).join(", ")}</div>
              </Card>
            </div>
            <Card>
              <SectionTitle icon={Calendar}>Jalons du chantier</SectionTitle>
              <div style={{ display: "grid", gap: 0 }}>
                {jalons.map((j, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: j.ok ? C.green : C.concrete, border: `2px solid ${j.ok ? C.green : C.line}`, display: "grid", placeItems: "center" }}>
                        {j.ok && <CheckCircle2 size={14} color={C.white} />}
                      </div>
                      {i < jalons.length - 1 && <div style={{ width: 2, height: 26, background: C.line }} />}
                    </div>
                    <div style={{ paddingBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: j.ok ? C.steelSoft : C.steel, textDecoration: j.ok ? "line-through" : "none" }}>{j.nom}</div>
                      <div style={{ fontSize: 12, color: C.steelSoft }}>{j.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === "taches" && (
          <Card>
            <SectionTitle icon={ClipboardCheck}>Tâches et lots de travaux</SectionTitle>
            <div style={{ display: "grid", gap: 12 }}>
              {ch.taches.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.steel }}>{t.nom}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{t.lot}</div>
                    <div style={{ marginTop: 6 }}><Progress pct={t.pct} color={t.pct === 100 ? C.green : C.orange} /></div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: C.steel, minWidth: 52, textAlign: "right" }}>{t.pct} %</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "medias" && (
          <Card>
            <SectionTitle icon={Camera}>Plans & photos — annotation collaborative avec le client</SectionTitle>
            <MediaAnnot annots={annots} setAnnots={setAnnots} />
          </Card>
        )}

        {tab === "reserves" && <ReservesTab reserves={reserves} setReserves={setReserves} />}

        {tab === "journal" && (
          <Card>
            <SectionTitle icon={ClipboardCheck}>Journal de chantier (rapports terrain)</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel, marginBottom: 14 }}>
              <WifiOff size={16} color={C.amber} /> Saisis hors-ligne sur le terrain, synchronisés à la reconnexion. La météo est journalisée automatiquement — justificatif contractuel en cas de retard.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {journal.map((j, i) => (
                <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
                    <b style={{ color: C.steel }}>{j.date} — {j.auteur}</b>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.steelSoft }}><CloudSun size={13} /> {j.meteo}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.steel, marginTop: 6 }}>{j.texte}</div>
                  <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <Camera size={12} /> {j.photos} photo{j.photos > 1 ? "s" : ""} géolocalisée{j.photos > 1 ? "s" : ""} et horodatée{j.photos > 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={HardHat} action={<button style={btnPrimary}><Plus size={15} /> Nouveau chantier</button>}>
        Chantiers ({chantiers.length})
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {chantiers.map(c => (
          <Card key={c.id} style={{ cursor: "pointer", padding: 0, overflow: "hidden" }} >
            <div onClick={() => { setSelected(c.id); setTab("apercu"); }}>
              <Hazard />
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 21, fontWeight: 700, textTransform: "uppercase", color: C.steel, lineHeight: 1.15 }}>{c.nom}</div>
                  <StatutBadge s={c.statut} />
                </div>
                <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4, display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {c.ville}</span>
                  <span>{c.client}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}>
                    <span>Avancement</span><b style={{ color: C.steel }}>{c.avancementReel} %</b>
                  </div>
                  <Progress pct={c.avancementReel} color={c.statut === "En retard" ? C.red : c.statut === "Terminé" ? C.green : C.orange} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.steelSoft }}>
                  Budget : <b style={{ color: C.steel }}>{fcfa(c.budget)}</b>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Pointage({ ouvriers, setOuvriers }) {
  const cycle = { P: "DM", DM: "A", A: "P" };
  const toggle = (id) =>
    setOuvriers(ouvriers.map(o => o.id === id ? { ...o, pointage: cycle[o.pointage] } : o));

  const paie = (o) => o.pointage === "P" ? o.tarif : o.pointage === "DM" ? o.tarif / 2 : 0;
  const totalJour = ouvriers.reduce((s, o) => s + paie(o), 0);
  const presents = ouvriers.filter(o => o.pointage !== "A").length;

  const Ic = { P: [CheckCircle2, C.green, C.greenSoft, "Présent"], DM: [MinusCircle, C.amber, C.amberSoft, "Demi-journée"], A: [XCircle, C.red, C.redSoft, "Absent"] };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Users} action={
        <div style={{ fontSize: 13, color: C.steelSoft }}>
          <b style={{ color: C.steel }}>{presents}/{ouvriers.length}</b> présents · Coût du jour : <b style={{ color: C.orange }}>{fcfa(totalJour)}</b>
        </div>
      }>Pointage journalier — samedi 4 juillet 2026</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel }}>
        <WifiOff size={16} color={C.amber} /> Le pointage fonctionne hors-ligne sur le terrain. Touchez le statut pour le modifier (Présent → Demi-journée → Absent).
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Ouvrier", "Métier", "Chantier", "Tarif/j", "Statut", "Paie du jour"].map(h =>
                <th key={h} style={{ padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, fontSize: 13 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {ouvriers.map((o, i) => {
              const [Icon, fg, bg, label] = Ic[o.pointage];
              return (
                <tr key={o.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: C.steel }}>{o.nom}</td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft }}>{o.metier}</td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft, fontSize: 13 }}>{o.chantier}</td>
                  <td style={{ padding: "10px 14px" }}>{fcfa(o.tarif)}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <button onClick={() => toggle(o.id)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: fg,
                      border: "none", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer",
                    }}>
                      <Icon size={14} /> {label}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: paie(o) ? C.steel : C.steelSoft }}>{fcfa(paie(o))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DQEDetail({ dqe, onBack, onPDF }) {
  const [masquerZero, setMasquerZero] = useState(true);
  const [sig, setSig] = useState("Non envoyé"); // → En attente → Signé
  const sigNext = { "Non envoyé": "En attente", "En attente": "Signé" };
  const sigCol = { "Non envoyé": [C.concrete, C.steelSoft], "En attente": [C.amberSoft, C.amber], "Signé": [C.greenSoft, C.green] };
  const ht = dqeHT(dqe);
  const remise = Math.round(ht * dqe.remisePct / 100);
  const apresRemise = ht - remise;
  const tva = Math.round(apresRemise * TVA);
  const ttc = apresRemise + tva;
  const ratioM2 = Math.round(apresRemise / dqe.surface);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onBack} style={btnGhost}>← Retour aux devis</button>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.steelSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={masquerZero} onChange={e => setMasquerZero(e.target.checked)} />
            Masquer les lignes « pour mémoire » / à zéro
          </label>
          <button style={btnPrimary} onClick={onPDF}><Printer size={15} /> Aperçu PDF</button>
          <button
            onClick={() => sigNext[sig] && setSig(sigNext[sig])}
            style={{ ...btnGhost, color: sigCol[sig][1], borderColor: sigCol[sig][1], background: sigCol[sig][0] }}>
            <PenLine size={14} /> {sig === "Non envoyé" ? "Envoyer en signature électronique" : sig === "En attente" ? "En attente de signature (simuler la signature)" : "✓ Signé le 04/07/2026 14:22 — OTP SMS +237 6•• •• 56"}
          </button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>
                Devis quantitatif et estimatif — {dqe.id}
              </h2>
              <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{dqe.chantier} · {dqe.client} · {dqe.date}</div>
            </div>
            <StatutBadge s={dqe.statut} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginTop: 16 }}>
            <div><div style={miniLabel}>Total HT après remise</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, color: C.steel }}>{fcfa(apresRemise)}</div></div>
            <div><div style={miniLabel}>TTC (TVA 19,25 %)</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, color: C.orange }}>{fcfa(ttc)}</div></div>
            <div><div style={miniLabel}>Surface — ratio au m²</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, color: C.steel }}>{fcfa(ratioM2)}<span style={{ fontSize: 13, color: C.steelSoft }}> /m² · {dqe.surface} m²</span></div></div>
          </div>
        </div>
      </Card>

      {dqe.lots.map(lot => {
        const tLot = lotTotal(lot);
        return (
          <Card key={lot.num} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.steel, color: C.white, padding: "10px 16px" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 15 }}>
                <span style={{ color: C.orange }}>{lot.num}</span> — {lot.titre}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15 }}>{fcfa(tLot)}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}>
                  {["N°", "Désignation", "U", "Qté", "P.U.", "P.T. HT"].map((h, i) =>
                    <th key={h} style={{ padding: "7px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {lot.sousOuvrages.map((so, si) => (
                  <React.Fragment key={si}>
                    {so.titre && (!masquerZero || so.lignes.some(l => ligneTotal(l) > 0 || l.u === "pm")) && (
                      <tr><td colSpan={6} style={{ padding: "8px 12px 4px", fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 0.6 }}>{so.titre}</td></tr>
                    )}
                    {so.lignes.filter(l => !masquerZero || ligneTotal(l) > 0 || l.u === "pm").map(l => (
                      <tr key={l.n} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={{ padding: "8px 12px", color: C.steelSoft, fontWeight: 600, width: 44 }}>{l.n}</td>
                        <td style={{ padding: "8px 12px", color: C.steel }}>{l.des}</td>
                        <td style={{ padding: "8px 12px", color: C.steelSoft, width: 44 }}>{l.u}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", width: 70 }}>{l.u === "pm" ? "—" : l.q.toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", width: 90 }}>{l.u === "pm" ? "—" : l.pu.toLocaleString("fr-FR")}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, width: 110 }}>
                          {l.u === "pm" ? <span style={{ color: C.steelSoft, fontStyle: "italic" }}>P.M.</span> : ligneTotal(l).toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}

      <Card style={{ borderLeft: `4px solid ${C.orange}` }}>
        <SectionTitle icon={CircleDollarSign}>Récapitulatif général</SectionTitle>
        <div style={{ display: "grid", gap: 6, fontSize: 14, maxWidth: 480 }}>
          {dqe.lots.map(lot => (
            <div key={lot.num} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${C.line}`, paddingBottom: 4 }}>
              <span style={{ color: C.steelSoft }}>Lot {lot.num} — {lot.titre}</span><b>{fcfa(lotTotal(lot))}</b>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span>Total général HT</span><b>{fcfa(ht)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.red }}><span>Remise spéciale {dqe.remisePct.toLocaleString("fr-FR")} %</span><b>−{fcfa(remise)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total après remise</span><b>{fcfa(apresRemise)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Incidence TVA 19,25 %</span><b>{fcfa(tva)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, fontWeight: 700, color: C.orange, borderTop: `2px solid ${C.steel}`, paddingTop: 8 }}>
            <span>TOTAL GÉNÉRAL TTC</span><span>{fcfa(ttc)}</span>
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>Soit {fcfa(ratioM2)} HT/m² pour {dqe.surface} m² — comparable entre projets et extrapolable aux variantes (bloc de 2, bloc de 8…).</div>
        </div>
      </Card>
    </div>
  );
}

function DQEPDFModal({ dqe, onClose }) {
  if (!dqe) return null;
  const ht = dqeHT(dqe);
  const remise = Math.round(ht * dqe.remisePct / 100);
  const apresRemise = ht - remise;
  const tva = Math.round(apresRemise * TVA);
  const th = { padding: "6px 8px", fontWeight: 600, fontSize: 10.5 };
  const td = { padding: "5px 8px", fontSize: 10.5, borderBottom: `1px solid ${C.line}` };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,28,36,.6)", zIndex: 100, display: "grid", placeItems: "start center", padding: 16, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: "min(720px, 100%)", borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.35)", margin: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: C.steel, color: C.white }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Aperçu PDF — {dqe.id}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnPrimary, padding: "6px 12px" }}><Printer size={14} /> Imprimer</button>
            <button onClick={onClose} style={{ ...btnGhost, color: C.white, borderColor: C.steelSoft, padding: "6px 10px" }}><X size={15} /></button>
          </div>
        </div>

        {/* Page 1 — Récapitulatif */}
        <div style={{ padding: 26, color: C.steel }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
                TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION
              </div>
              <div style={{ fontSize: 10, color: C.steelSoft, lineHeight: 1.6 }}>
                BP 4521 Yaoundé — Cameroun · contact@tank-construction.cm<br />RCCM : YAO/2024/B/1234 · NIU : M042400001234A
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.orange }}>DEVIS QUANTITATIF ET ESTIMATIF</div>
              <div style={{ fontSize: 11 }}><b>{dqe.id}</b> · {dqe.date} · Validité 30 jours</div>
            </div>
          </div>
          <div style={{ margin: "12px 0" }}><Hazard /></div>
          <div style={{ background: C.concrete, borderRadius: 8, padding: 10, fontSize: 11, marginBottom: 14 }}>
            <b>Maître d'ouvrage :</b> {dqe.client} · <b>Projet :</b> {dqe.chantier} · <b>Surface :</b> {dqe.surface} m²
          </div>

          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Récapitulatif par lot</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
                <th style={th}>Lot</th><th style={th}>Désignation</th><th style={{ ...th, textAlign: "right" }}>Montant HT (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {dqe.lots.map(lot => (
                <tr key={lot.num}>
                  <td style={{ ...td, fontWeight: 700, color: C.orange }}>{lot.num}</td>
                  <td style={td}>{lot.titre}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{lotTotal(lot).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "grid", justifyContent: "end", textAlign: "right", gap: 2, marginTop: 10, fontSize: 11.5 }}>
            <div>Total général HT : <b>{fcfa(ht)}</b></div>
            <div style={{ color: C.red }}>Remise spéciale {dqe.remisePct.toLocaleString("fr-FR")} % : <b>−{fcfa(remise)}</b></div>
            <div>Total après remise : <b>{fcfa(apresRemise)}</b></div>
            <div>Incidence TVA 19,25 % : <b>{fcfa(tva)}</b></div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: C.orange, borderTop: `2px solid ${C.steel}`, paddingTop: 5 }}>
              TOTAL GÉNÉRAL TTC : {fcfa(apresRemise + tva)}
            </div>
            <div style={{ fontSize: 10, color: C.steelSoft }}>Coût au m² (HT après remise) : {fcfa(Math.round(apresRemise / dqe.surface))} /m²</div>
          </div>

          {/* Détail par lot */}
          <div style={{ borderTop: `2px dashed ${C.line}`, margin: "16px 0 12px" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Détail des ouvrages</div>
          {dqe.lots.map(lot => (
            <div key={lot.num} style={{ marginBottom: 12 }}>
              <div style={{ background: C.concrete, padding: "5px 8px", fontSize: 11, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                <span><span style={{ color: C.orange }}>{lot.num}</span> — {lot.titre.toUpperCase()}</span>
                <span>{lotTotal(lot).toLocaleString("fr-FR")}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {lot.sousOuvrages.map((so, si) => (
                    <React.Fragment key={si}>
                      {so.titre && <tr><td colSpan={6} style={{ padding: "5px 8px 2px", fontSize: 10, fontWeight: 700, color: C.orange, textTransform: "uppercase" }}>{so.titre}</td></tr>}
                      {so.lignes.filter(l => ligneTotal(l) > 0 || l.u === "pm").map(l => (
                        <tr key={l.n}>
                          <td style={{ ...td, width: 34, color: C.steelSoft }}>{l.n}</td>
                          <td style={td}>{l.des}</td>
                          <td style={{ ...td, width: 34 }}>{l.u}</td>
                          <td style={{ ...td, width: 56, textAlign: "right" }}>{l.u === "pm" ? "—" : l.q.toLocaleString("fr-FR")}</td>
                          <td style={{ ...td, width: 66, textAlign: "right" }}>{l.u === "pm" ? "—" : l.pu.toLocaleString("fr-FR")}</td>
                          <td style={{ ...td, width: 84, textAlign: "right", fontWeight: 600 }}>{l.u === "pm" ? "P.M." : ligneTotal(l).toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14, fontSize: 11 }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, minHeight: 60 }}>
              <b>Le prestataire</b><br /><span style={{ color: C.steelSoft }}>Cachet et signature</span>
            </div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, minHeight: 60 }}>
              <b>Bon pour accord — le maître d'ouvrage</b><br /><span style={{ color: C.steelSoft }}>Date et signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DevisFactures({ devis, setDevis, factures, dqes }) {
  const [tab, setTab] = useState("devis");
  const [showNew, setShowNew] = useState(false);
  const [pdfDevis, setPdfDevis] = useState(null);
  const [dqeSel, setDqeSel] = useState(null);
  const [pdfDqe, setPdfDqe] = useState(null);
  const [lignes, setLignes] = useState([{ des: "Béton dosé 350 kg/m³ — fourniture et mise en œuvre", qte: 12, pu: 145000 }]);
  const [client, setClient] = useState("");
  const [objet, setObjet] = useState("");

  const ht = lignes.reduce((s, l) => s + l.qte * l.pu, 0);
  const tva = Math.round(ht * TVA);

  const addDevis = () => {
    if (!client || !objet || !ht) return;
    setDevis([{ id: `DEV-2026-0${devis.length + 11}`, client, objet, ht, lignes: lignes.filter(l => l.des), statut: "Brouillon", date: "04/07/2026" }, ...devis]);
    setShowNew(false); setClient(""); setObjet("");
    setLignes([{ des: "", qte: 1, pu: 0 }]);
  };

  if (dqeSel) {
    const d = dqes.find(x => x.id === dqeSel);
    return (
      <>
        <DQEDetail dqe={d} onBack={() => setDqeSel(null)} onPDF={() => setPdfDqe(d)} />
        <DQEPDFModal dqe={pdfDqe} onClose={() => setPdfDqe(null)} />
      </>
    );
  }

  const rows = tab === "devis" ? devis : factures;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={FileText} action={
        tab === "devis" && <button style={btnPrimary} onClick={() => setShowNew(!showNew)}><Plus size={15} /> Nouveau devis</button>
      }>Devis & Facturation</SectionTitle>

      <div style={{ display: "flex", gap: 8 }}>
        {["devis", "situations", "factures"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...btnGhost, textTransform: "capitalize",
            background: tab === t ? C.steel : "transparent",
            color: tab === t ? C.white : C.steelSoft,
            border: `1px solid ${tab === t ? C.steel : C.line}`,
          }}>{t}</button>
        ))}
      </div>

      {tab === "devis" && (
        <Card style={{ borderLeft: `4px solid ${C.orange}` }}>
          <SectionTitle icon={ClipboardCheck}>Devis structurés DQE (lots → sous-ouvrages → lignes)</SectionTitle>
          {dqes.map(d => {
            const net = dqeHT(d) - Math.round(dqeHT(d) * d.remisePct / 100);
            return (
              <div key={d.id} onClick={() => setDqeSel(d.id)} style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "12px 14px",
                border: `1px solid ${C.line}`, borderRadius: 10, cursor: "pointer",
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.steel }}>{d.id} — {d.chantier}</div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>{d.client} · {d.lots.length} lots · {fcfa(Math.round(net / d.surface))} /m²</div>
                </div>
                <b style={{ fontSize: 14 }}>{fcfa(net)} HT</b>
                <StatutBadge s={d.statut} />
                <ChevronRight size={16} color={C.steelSoft} />
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
            Structure conforme aux DQE réels du BTP camerounais : numérotation par lot (100, 200, 300…), sous-ouvrages (poteaux, longrines…), unités ff/pm/ens/mois, remise avant TVA, sous-totaux et ratio au m² calculés automatiquement — zéro erreur de formule.
          </div>
        </Card>
      )}

      {showNew && tab === "devis" && (
        <Card style={{ borderLeft: `4px solid ${C.orange}` }}>
          <h3 style={{ marginTop: 0, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>Devis simple (FCFA — TVA 19,25 %)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Client" value={client} onChange={e => setClient(e.target.value)} style={inp} />
            <input placeholder="Objet du devis" value={objet} onChange={e => setObjet(e.target.value)} style={inp} />
          </div>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 70px 130px 130px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input placeholder="Désignation" value={l.des} onChange={e => setLignes(lignes.map((x, j) => j === i ? { ...x, des: e.target.value } : x))} style={inp} />
              <input type="number" min="1" value={l.qte} onChange={e => setLignes(lignes.map((x, j) => j === i ? { ...x, qte: +e.target.value } : x))} style={inp} />
              <input type="number" min="0" value={l.pu} onChange={e => setLignes(lignes.map((x, j) => j === i ? { ...x, pu: +e.target.value } : x))} style={inp} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{fcfa(l.qte * l.pu)}</div>
            </div>
          ))}
          <button style={btnGhost} onClick={() => setLignes([...lignes, { des: "", qte: 1, pu: 0 }])}><Plus size={13} /> Ajouter une ligne</button>
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10, display: "grid", gap: 4, justifyContent: "end", textAlign: "right", fontSize: 14 }}>
            <div>Total HT : <b>{fcfa(ht)}</b></div>
            <div>TVA 19,25 % : <b>{fcfa(tva)}</b></div>
            <div style={{ fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: C.orange }}>Total TTC : {fcfa(ht + tva)}</div>
            <button style={{ ...btnPrimary, justifySelf: "end", marginTop: 6 }} onClick={addDevis}>Enregistrer le devis</button>
          </div>
        </Card>
      )}

      {tab === "situations" && <SituationsTab />}

      {tab !== "situations" && <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {(tab === "devis"
                ? ["N°", "Client", "Objet", "Montant HT", "Statut", "Date", "PDF"]
                : ["N°", "Client", "Objet", "Montant TTC", "Statut", "Règlement", "Échéance"]
              ).map(h => <th key={h} style={{ padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, fontSize: 13 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: C.steel }}>{r.id}</td>
                <td style={{ padding: "10px 14px" }}>{r.client}</td>
                <td style={{ padding: "10px 14px", color: C.steelSoft }}>{r.objet}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{fcfa(tab === "devis" ? r.ht : r.ttc)}</td>
                <td style={{ padding: "10px 14px" }}><StatutBadge s={r.statut} /></td>
                {tab === "factures" && <td style={{ padding: "10px 14px", fontSize: 13, color: C.steelSoft }}>{r.mode}</td>}
                <td style={{ padding: "10px 14px", fontSize: 13, color: C.steelSoft }}>{tab === "devis" ? r.date : r.echeance}</td>
                {tab === "devis" && (
                  <td style={{ padding: "8px 14px" }}>
                    <button onClick={() => setPdfDevis(r)} style={{ ...btnGhost, padding: "5px 10px", color: C.orange, borderColor: C.orangeSoft }}>
                      <Printer size={14} /> Aperçu
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>}
      <DevisPDFModal devis={pdfDevis} onClose={() => setPdfDevis(null)} />
      {tab === "factures" && (
        <div style={{ fontSize: 13, color: C.steelSoft }}>
          Modes de règlement acceptés : virement, chèque, espèces, <b style={{ color: C.steel }}>MTN Mobile Money</b> et <b style={{ color: C.steel }}>Orange Money</b>. Relances automatiques J+15 et J+30 pour les impayés.
        </div>
      )}
    </div>
  );
}

function Stocks({ stock, setStock }) {
  const [q, setQ] = useState("");
  const move = (id, delta) =>
    setStock(stock.map(m => m.id === id ? { ...m, stock: Math.max(0, m.stock + delta) } : m));
  const valeur = stock.reduce((s, m) => s + m.stock * m.pu, 0);
  const list = stock.filter(m => m.designation.toLowerCase().includes(q.toLowerCase()) || m.ref.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Package} action={
        <div style={{ fontSize: 13, color: C.steelSoft }}>Valeur du stock : <b style={{ color: C.orange }}>{fcfa(valeur)}</b></div>
      }>Stocks & matériaux — Dépôt central Yaoundé</SectionTitle>

      <div style={{ position: "relative", maxWidth: 340 }}>
        <Search size={16} color={C.steelSoft} style={{ position: "absolute", left: 12, top: 11 }} />
        <input placeholder="Rechercher un matériau ou une référence…" value={q} onChange={e => setQ(e.target.value)} style={{ ...inp, paddingLeft: 36, width: "100%" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {list.map(m => {
          const alerte = m.stock < m.seuil;
          return (
            <Card key={m.id} style={{ padding: 16, borderLeft: `4px solid ${alerte ? C.red : C.green}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: 1 }}>{m.ref}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.steel }}>{m.designation}</div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>{fcfa(m.pu)} / {m.unite}</div>
                </div>
                {alerte && <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0 }} />}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, color: alerte ? C.red : C.steel }}>{m.stock}</span>
                <span style={{ fontSize: 13, color: C.steelSoft }}>{m.unite}{m.stock > 1 ? "s" : ""} · seuil {m.seuil}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ ...btnGhost, color: C.green, borderColor: C.greenSoft, flex: 1, justifyContent: "center" }} onClick={() => move(m.id, 10)}>
                  <ArrowDownCircle size={14} /> Entrée +10
                </button>
                <button style={{ ...btnGhost, color: C.red, borderColor: C.redSoft, flex: 1, justifyContent: "center" }} onClick={() => move(m.id, -10)}>
                  <ArrowUpCircle size={14} /> Sortie −10
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Fournisseurs() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Truck} action={<button style={btnPrimary}><Plus size={15} /> Ajouter</button>}>
        Fournisseurs & sous-traitants
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {FOURNISSEURS.map(f => (
          <Card key={f.id} style={{ padding: 18 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{f.nom}</div>
            <div style={{ fontSize: 13, color: C.steelSoft }}>{f.specialite} · {f.ville}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={15} fill={i <= Math.round(f.note) ? C.orange : "none"} color={i <= Math.round(f.note) ? C.orange : C.line} />
              ))}
              <span style={{ fontSize: 13, fontWeight: 700, color: C.steel, marginLeft: 4 }}>{f.note.toFixed(1)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13, color: C.steelSoft }}>
              <span>{f.commandes} commandes</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} /> {f.tel}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Incidents({ incidents, setIncidents, checklist, setChecklist }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ chantier: "Immeuble R+4 Bastos", type: "Sécurité", gravite: "Moyenne", desc: "" });
  const ouverts = incidents.filter(i => i.statut === "En cours").length;
  const okCount = checklist.filter(c => c.ok).length;

  const gravColor = { "Élevée": [C.redSoft, C.red], "Moyenne": [C.amberSoft, C.amber], "Faible": [C.greenSoft, C.green] };

  const addIncident = () => {
    if (!form.desc) return;
    setIncidents([{ id: incidents.length + 1, date: "04/07/2026", statut: "En cours", ...form }, ...incidents]);
    setShowNew(false); setForm({ ...form, desc: "" });
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={ShieldAlert} action={
        <button style={btnPrimary} onClick={() => setShowNew(!showNew)}><Plus size={15} /> Déclarer un incident</button>
      }>Incidents & Sécurité chantier</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Incidents ouverts</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 700, color: ouverts ? C.red : C.green }}>{ouverts}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Jours sans accident grave</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 700, color: C.green }}>127</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Checklist du jour</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 700, color: okCount === checklist.length ? C.green : C.amber }}>
            {okCount}/{checklist.length}
          </div>
        </Card>
      </div>

      {showNew && (
        <Card style={{ borderLeft: `4px solid ${C.red}` }}>
          <h3 style={{ marginTop: 0, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>Déclaration d'incident</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 10 }}>
            <select value={form.chantier} onChange={e => setForm({ ...form, chantier: e.target.value })} style={inp}>
              {CHANTIERS_INIT.map(c => <option key={c.id}>{c.nom}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
              {["Sécurité", "Accident bénin", "Accident grave", "Matériel", "Intempéries", "Vol / intrusion"].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={form.gravite} onChange={e => setForm({ ...form, gravite: e.target.value })} style={inp}>
              {["Faible", "Moyenne", "Élevée"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <textarea placeholder="Description de l'incident et actions correctives engagées…" rows={3}
            value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
            style={{ ...inp, width: "100%", resize: "vertical" }} />
          <button style={{ ...btnPrimary, marginTop: 10 }} onClick={addIncident}>Enregistrer la déclaration</button>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card>
          <SectionTitle icon={ClipboardCheck}>Checklist sécurité journalière</SectionTitle>
          <div style={{ display: "grid", gap: 6 }}>
            {checklist.map(c => (
              <button key={c.id} onClick={() => setChecklist(checklist.map(x => x.id === c.id ? { ...x, ok: !x.ok } : x))}
                style={{
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  background: c.ok ? C.greenSoft : C.concrete, border: "none", borderRadius: 8,
                  padding: "10px 12px", fontSize: 14, color: C.steel, cursor: "pointer", fontFamily: "inherit",
                }}>
                {c.ok ? <CheckSquare size={18} color={C.green} /> : <Square size={18} color={C.steelSoft} />}
                <span style={{ flex: 1 }}>{c.item}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.steelSoft }}>
            Signée chaque matin par le chef de chantier avant l'ouverture des travaux (fonctionne hors-ligne).
          </div>
        </Card>

        <Card>
          <SectionTitle icon={ShieldAlert}>Registre des incidents</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {incidents.map(i => {
              const [bg, fg] = gravColor[i.gravite];
              return (
                <div key={i.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{i.type} — {i.chantier}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{i.gravite}</span>
                      <StatutBadge s={i.statut} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 6 }}>{i.desc}</div>
                  <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 6 }}>{i.date}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PortailClient({ factures, devis, annots, setAnnots, lots, setLots }) {
  const [espace, setEspace] = useState("chantier"); // chantier | acquereur
  const ch = CHANTIERS_INIT[0];
  const ouverts = Object.values(annots).flat().filter(a => !a.resolu && a.role === "entreprise").length;

  /* Espace acquéreur — M. Moukoumbou Alain, lot T3-02 */
  const monLot = lots.find(l => l.id === "T3-02");
  const maResa = RESERVATIONS_INIT.find(r => r.lot === "T3-02");
  const dispo = lots.filter(l => l.statut === "Disponible");
  const demander = (id) => setLots(lots.map(l => l.id === id && l.statut === "Disponible" ? { ...l, statut: "Réservé" } : l));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, background: C.steel, color: C.white, borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
        <Eye size={18} color={C.orange} />
        <span style={{ flex: 1, minWidth: 220 }}><b>Vue client — lecture seule.</b> Le portail sert deux profils : le maître d'ouvrage d'un chantier (suivi, documents, factures) et l'acquéreur d'un lot en VEFA (son logement, son échéancier, le catalogue).</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setEspace("chantier")} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: espace === "chantier" ? C.orange : "transparent", color: C.white, borderColor: espace === "chantier" ? C.orange : C.steelSoft }}>
            Maître d'ouvrage (SCI Horizon)
          </button>
          <button onClick={() => setEspace("acquereur")} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: espace === "acquereur" ? C.orange : "transparent", color: C.white, borderColor: espace === "acquereur" ? C.orange : C.steelSoft }}>
            Acquéreur (M. Moukoumbou — T3-02)
          </button>
        </div>
      </div>

      {espace === "chantier" && (
        <>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <Hazard />
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{ch.nom}</h2>
                  <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{ch.ville} · Livraison prévue : {ch.fin}</div>
                </div>
                <StatutBadge s={ch.statut} />
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.steelSoft, marginBottom: 4 }}>
                  <span>Avancement global des travaux</span>
                  <b style={{ color: C.steel }}>{ch.avancementReel} %</b>
                </div>
                <Progress pct={ch.avancementReel} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={ImageIcon} action={
              ouverts > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{ouverts} question{ouverts > 1 ? "s" : ""} de l'entreprise en attente de votre réponse</span>
            }>Plans & photos — posez vos questions directement sur l'image</SectionTitle>
            <div style={{ fontSize: 13, color: C.steelSoft, marginBottom: 12 }}>
              Cliquez sur le plan ou une photo pour épingler une question ou une remarque : l'équipe de chantier est notifiée et vous répond au même endroit. Chaque échange reste tracé et daté.
            </div>
            <MediaAnnot annots={annots} setAnnots={setAnnots} forceClient />
          </Card>

          <Card>
            <SectionTitle icon={Camera}>Dernières photos du chantier</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {PHOTOS_CLIENT.map((p, i) => (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
                  <div style={{ height: 96, background: `linear-gradient(135deg, ${p.tint}, ${C.steelMid})`, display: "grid", placeItems: "center" }}>
                    <Camera size={26} color="rgba(255,255,255,.7)" />
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: C.steelSoft }}>{p.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
            <Card>
              <SectionTitle icon={FolderOpen}>Documents partagés</SectionTitle>
              <div style={{ display: "grid", gap: 8 }}>
                {DOCS_CLIENT.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.concrete, borderRadius: 8 }}>
                    <FileText size={16} color={C.orange} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nom}</div>
                      <div style={{ fontSize: 11, color: C.steelSoft }}>{d.type} · {d.date}</div>
                    </div>
                    <Download size={15} color={C.steelSoft} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle icon={FileText}>Devis & factures</SectionTitle>
              <div style={{ display: "grid", gap: 8 }}>
                {[...devis.filter(d => d.client === "SCI Horizon"), ...factures.filter(f => f.client === "SCI Horizon")].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{r.id}</div>
                      <div style={{ fontSize: 12, color: C.steelSoft }}>{r.objet}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 13 }}>{fcfa(r.ht ?? r.ttc)}</b>
                      <StatutBadge s={r.statut} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {espace === "acquereur" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 3fr) minmax(250px, 2fr)", gap: 20, alignItems: "start" }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Hazard />
              <div style={{ padding: 20, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>
                      Mon logement — {monLot.id}
                    </h2>
                    <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 3 }}>
                      {PROG.nom} · Bloc {monLot.bloc} · {monLot.niveau} · {monLot.code} de {monLot.surf} m² · orientation {monLot.orientation}
                    </div>
                  </div>
                  <StatutBadge s="Réservé" />
                </div>
                <PlanTypo code={monLot.code} />
                <div style={{ fontSize: 12.5, color: C.steelSoft }}>
                  Plan indicatif de votre {monLot.code}. Une remarque, une demande de modification (TMA) ? Épinglez-la directement sur le plan dans l'onglet « Maître d'ouvrage » — même principe, mêmes notifications.
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle icon={Landmark}>Mon échéancier VEFA</SectionTitle>
              <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Prix de mon logement</span><b>{fcfa(maResa.prix)}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: C.green }}><span>Déjà versé ({Math.round(maResa.encaisse / maResa.prix * 100)} %)</span><b>{fcfa(maResa.encaisse)}</b></div>
                <Progress pct={Math.round(maResa.encaisse / maResa.prix * 100)} color={C.green} />
                <div style={{ marginTop: 8, background: C.amberSoft, borderRadius: 8, padding: 10, fontSize: 12.5, color: C.steel }}>
                  <b>Prochain appel de fonds :</b> {maResa.prochain}<br />
                  <span style={{ color: C.steelSoft }}>Exigible car le jalon « Dalle R+1 coulée » a été constaté contradictoirement sur le chantier — vous payez l'avancement réel, jamais avant.</span>
                </div>
                <button style={{ ...btnPrimary, justifyContent: "center", marginTop: 6 }}><Send size={14} /> Payer par MTN MoMo / Orange Money</button>
                <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 2 }}>Chaque étape de l'échéancier suit le contrat de réservation (loi n°97/003) ; reçus disponibles dans vos documents.</div>
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle icon={Wallet}>Simulateur de financement</SectionTitle>
            <div style={{ fontSize: 13, color: C.steelSoft, marginBottom: 12 }}>
              Comparez le paiement échelonné VEFA (sans intérêts, au rythme du chantier) et un crédit bancaire, selon votre revenu et votre apport. Utile avant de poser une option — ou pour conseiller un proche.
            </div>
            <Simulateur lots={lots} />
          </Card>

          <Card>
            <SectionTitle icon={Building2} action={
              <span style={{ fontSize: 12, color: C.steelSoft }}>{dispo.length} logements disponibles</span>
            }>Catalogue {PROG.nom} — encore disponible</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
              {PROG.typologies.map(t => {
                const d = dispo.filter(l => l.code === t.code);
                if (!d.length) return null;
                const premier = d[0];
                return (
                  <div key={t.code} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <b style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: C.steel }}>{t.code}</b>
                      <span style={{ fontSize: 12, color: C.steelSoft }}>{d.length} dispo.</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.steelSoft }}>{t.surf} m² · dès le bloc {premier.bloc} ({premier.niveau})</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.orange }}>{fcfa(t.prix)}</div>
                    <div style={{ fontSize: 11.5, color: C.steelSoft }}>Apport 30 % : {fcfa(Math.round(t.prix * 0.3))}</div>
                    <button style={{ ...btnGhost, justifyContent: "center", color: C.orange, borderColor: C.orangeSoft, fontSize: 12 }} onClick={() => demander(premier.id)}>
                      Demander une option ({premier.id})
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
              La demande d'option notifie l'équipe commerciale (module Messagerie) et bloque le lot 72 h, le temps de signer le contrat de réservation et de verser le dépôt de garantie séquestré chez le notaire.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function DevisPDFModal({ devis: d, onClose }) {
  if (!d) return null;
  const tva = Math.round(d.ht * TVA);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,28,36,.6)", zIndex: 100,
      display: "grid", placeItems: "center", padding: 16, overflowY: "auto",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.white, width: "min(680px, 100%)", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,.35)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: C.steel, color: C.white }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Aperçu PDF — {d.id}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnPrimary, padding: "6px 12px" }}><Printer size={14} /> Imprimer</button>
            <button onClick={onClose} style={{ ...btnGhost, color: C.white, borderColor: C.steelSoft, padding: "6px 10px" }}><X size={15} /></button>
          </div>
        </div>

        {/* Feuille A4 */}
        <div style={{ padding: 28, fontSize: 13, color: C.steel }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
                TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION
              </div>
              <div style={{ fontSize: 11, color: C.steelSoft, lineHeight: 1.6 }}>
                BP 4521 Yaoundé — Cameroun<br />contact@tank-construction.cm · 6 94 00 00 00<br />RCCM : YAO/2024/B/1234 · NIU : M042400001234A
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.orange }}>DEVIS</div>
              <div style={{ fontSize: 12 }}><b>{d.id}</b><br />Date : {d.date}<br />Validité : 30 jours</div>
            </div>
          </div>

          <div style={{ margin: "16px 0" }}><Hazard /></div>

          <div style={{ background: C.concrete, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>Adressé à</div>
            <div style={{ fontWeight: 700 }}>{d.client}</div>
            <div style={{ fontSize: 12, color: C.steelSoft }}>Objet : {d.objet}</div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.steel, color: C.white }}>
                {["Désignation", "Qté", "P.U. (FCFA)", "Total HT"].map(h =>
                  <th key={h} style={{ padding: "8px 10px", textAlign: h === "Désignation" ? "left" : "right", fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(d.lignes || [{ des: d.objet, qte: 1, pu: d.ht }]).map((l, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "8px 10px" }}>{l.des}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.qte}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{l.pu.toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{(l.qte * l.pu).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "grid", justifyContent: "end", textAlign: "right", gap: 3, marginTop: 12, fontSize: 13 }}>
            <div>Total HT : <b>{fcfa(d.ht)}</b></div>
            <div>TVA 19,25 % : <b>{fcfa(tva)}</b></div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.orange, borderTop: `2px solid ${C.steel}`, paddingTop: 6 }}>
              NET À PAYER TTC : {fcfa(d.ht + tva)}
            </div>
          </div>

          <div style={{ marginTop: 18, fontSize: 11, color: C.steelSoft, lineHeight: 1.6 }}>
            Conditions de règlement : acompte de 30 % à la commande, solde par situations de travaux. Règlement par virement, chèque, MTN Mobile Money ou Orange Money.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20, fontSize: 12 }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, minHeight: 70 }}>
              <b>Le prestataire</b><br /><span style={{ color: C.steelSoft }}>Cachet et signature</span>
            </div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, minHeight: 70 }}>
              <b>Bon pour accord — le client</b><br /><span style={{ color: C.steelSoft }}>Date et signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Rentabilite({ factures }) {
  const SEUIL_ALERTE = 90; // % budget consommé
  const rows = RENTA.map((r, i) => {
    const couts = r.mo + r.materiaux + r.soustraitance + r.frais;
    const marge = r.facture - couts;
    const budget = CHANTIERS_INIT[i]?.budget || r.facture;
    const consoPct = Math.round((CHANTIERS_INIT[i]?.consomme || couts) / budget * 100);
    const avancement = CHANTIERS_INIT[i]?.avancementReel || 100;
    return { ...r, couts, marge, pct: Math.round(marge / r.facture * 100), consoPct, avancement, derive: consoPct >= SEUIL_ALERTE && avancement < 100 };
  });
  const derives = rows.filter(r => r.derive);
  const encaisse = factures.filter(f => f.statut === "Payée").reduce((s, f) => s + f.ttc, 0);
  const facture = factures.reduce((s, f) => s + f.ttc, 0);
  const aEncaisser = facture - encaisse;
  const chart = rows.map(r => ({ nom: r.chantier.split(" ").slice(0, 2).join(" "), "Marge (M)": Math.round(r.marge / 1e6) }));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Wallet}>Rentabilité & Trésorerie</SectionTitle>

      {derives.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: C.redSoft, border: `1px solid ${C.red}`, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, color: C.steel }}>
          <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0 }} />
          <span><b>Garde-fou budgétaire — {r.chantier} :</b> {r.consoPct} % du budget consommé pour {r.avancement} % d'avancement (seuil {SEUIL_ALERTE} %). Coût final projeté : {fcfa(Math.round(r.couts / (r.avancement / 100)))} — geler les achats non engagés, revoir les déboursés du lot en cours.</span>
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Engagé (commandes + contrats)</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 25, fontWeight: 700, color: C.steel }}>{fcfa(228400000)}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Facturé</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 25, fontWeight: 700, color: C.steel }}>{fcfa(facture)}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Encaissé</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 25, fontWeight: 700, color: C.green }}>{fcfa(encaisse)}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={miniLabel}>Reste à encaisser</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 25, fontWeight: 700, color: C.amber }}>{fcfa(aEncaisser)}</div>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Chantier", "Facturé", "Main-d'œuvre", "Matériaux", "Sous-traitance", "Frais", "Marge", "%", "Budget vs avanc."].map(h =>
                <th key={h} style={{ padding: "10px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.line}`, background: r.derive ? "#FFF6F5" : i % 2 ? "#FAFBFC" : C.white }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: C.steel }}>{r.chantier}</td>
                <td style={{ padding: "10px 12px" }}>{fcfa(r.facture)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{fcfa(r.mo)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{fcfa(r.materiaux)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{fcfa(r.soustraitance)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{fcfa(r.frais)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: r.marge > 0 ? C.green : C.red }}>{fcfa(r.marge)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: r.pct >= 10 ? C.green : r.pct >= 0 ? C.amber : C.red }}>{r.pct} %</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: r.derive ? C.red : C.green }}>{r.consoPct} % / {r.avancement} % {r.derive ? "⚠" : "✓"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card>
          <SectionTitle icon={PieChartIcon}>Marge par chantier (millions FCFA)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Marge (M)" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
            Coûts alimentés sans double saisie : pointages (MO), sorties de stock (matériaux), contrats (sous-traitance). « Budget vs avancement » confronte prévisionnel et réalisé — l'écart signale la dérive avant le dépassement.
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Download}>Exports comptables — SYSCOHADA révisé</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {EXPORTS_COMPTA.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px" }}>
                <FileText size={16} color={C.orange} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{e.nom}</div>
                  <div style={{ fontSize: 11, color: C.steelSoft }}>{e.plan} · {e.fmt}</div>
                </div>
                <button style={{ ...btnGhost, padding: "5px 10px" }}><Download size={14} /></button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.steelSoft, marginTop: 8 }}>
            Période au choix (mois / trimestre / exercice). L'expert-comptable importe directement — fini la ressaisie.
          </div>
        </Card>
      </div>
    </div>
  );
}

function SousTraitance() {
  const totalRetenues = SOUS_TRAITANTS.filter(s => s.statut !== "Soldé")
    .reduce((s, x) => s + x.montant * x.retenue / 100, 0);
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Gavel} action={<button style={btnPrimary}><Plus size={15} /> Nouveau contrat</button>}>
        Sous-traitance & contrats
      </SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel }}>
        <Banknote size={16} color={C.amber} /> Retenues de garantie en cours : <b>{fcfa(totalRetenues)}</b> — libération à réception définitive (12 mois).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {SOUS_TRAITANTS.map(s => (
          <Card key={s.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{s.nom}</div>
              <StatutBadge s={s.statut === "Garantie" ? "En préparation" : s.statut === "Soldé" ? "Terminé" : s.statut} />
            </div>
            <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 2 }}>{s.lot}</div>
            <div style={{ marginTop: 12, fontSize: 13 }}>
              Montant marché : <b>{fcfa(s.montant)}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}>
                <span>Paiements effectués</span><b style={{ color: C.steel }}>{s.avance} %</b>
              </div>
              <Progress pct={s.avance} color={s.avance === 100 ? C.green : C.orange} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: C.steelSoft }}>
              <span>Retenue garantie : <b style={{ color: C.steel }}>{s.retenue} %</b></span>
              <span>Caution : <b style={{ color: s.caution === "Oui" ? C.green : C.amber }}>{s.caution}</b></span>
              <span>Fin : {s.fin}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Materiel({ engins, setEngins }) {
  const map = { "En service": [C.greenSoft, C.green], "En panne": [C.redSoft, C.red], "Entretien": [C.amberSoft, C.amber] };
  const cycle = { "En service": "Entretien", "Entretien": "En panne", "En panne": "En service" };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Wrench} action={<button style={btnPrimary}><Plus size={15} /> Ajouter un équipement</button>}>
        Matériel & engins
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {Object.entries(map).map(([st, [bg, fg]]) => (
          <Card key={st} style={{ padding: 16, borderLeft: `4px solid ${fg}` }}>
            <div style={miniLabel}>{st}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 700, color: fg }}>
              {engins.filter(e => e.statut === st).length}
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Équipement", "Affectation", "Statut", "Prochain entretien", "Carburant"].map(h =>
                <th key={h} style={{ padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {engins.map((e, i) => {
              const [bg, fg] = map[e.statut];
              return (
                <tr key={e.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: C.steel }}>{e.nom}</td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft }}>{e.affectation}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <button onClick={() => setEngins(engins.map(x => x.id === e.id ? { ...x, statut: cycle[x.statut] } : x))}
                      style={{ background: bg, color: fg, border: "none", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {e.statut}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft }}>{e.entretien}</td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft, fontSize: 12 }}>
                    {e.carburant !== "—" && <Fuel size={13} style={{ verticalAlign: -2, marginRight: 4 }} />}{e.carburant}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 12, color: C.steelSoft }}>
        Chaque sortie/retour d'équipement est tracée par chantier — les pertes et la casse (poste de coût majeur du BTP) deviennent visibles et imputables.
      </div>
    </div>
  );
}

function AppelsOffres() {
  const stMap = { "En préparation": [C.amberSoft, C.amber], "Déposé": [C.orangeSoft, C.orange], "Gagné": [C.greenSoft, C.green], "Perdu": [C.redSoft, C.red], "Veille": [C.concrete, C.steelSoft] };
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("Yaoundé");
  const [dpgf, setDpgf] = useState(false);
  const coef = COEF_REGION[region];
  const nbOuvrages = BPU_CM.reduce((s, c) => s + c.items.length, 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={FileText} action={<button style={btnPrimary}><Plus size={15} /> Nouveau DAO</button>}>
        Appels d'offres & bibliothèque de prix
      </SectionTitle>

      {/* 4. Import DPGF */}
      <Card style={{ borderLeft: `4px solid ${C.orange}` }}>
        <SectionTitle icon={Upload}>Import DPGF / BDQ — répondre à un marché en minutes</SectionTitle>
        {!dpgf ? (
          <div onClick={() => setDpgf(true)} style={{
            border: `2px dashed ${C.line}`, borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", color: C.steelSoft,
          }}>
            <Upload size={26} color={C.orange} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.steel, marginTop: 6 }}>Déposez le cadre du DAO (Excel/PDF) — DPGF, BDQ, cadre quantitatif</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Cliquez pour simuler l'import de « {DPGF_DEMO.fichier} »</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.steel }}>
              <CheckCircle2 size={16} color={C.green} /> <b>{DPGF_DEMO.fichier}</b> analysé — {DPGF_DEMO.lignes.length} lignes reconnues, rapprochées automatiquement de la bibliothèque :
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}>
                  {["N° DAO", "Désignation du maître d'ouvrage", "U", "Qté", "Ouvrage bibliothèque", "P.U. proposé", "Total"].map(h =>
                    <th key={h} style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {DPGF_DEMO.lignes.map(l => (
                  <tr key={l.n} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: "7px 10px", color: C.steelSoft }}>{l.n}</td>
                    <td style={{ padding: "7px 10px", color: C.steel }}>{l.des}</td>
                    <td style={{ padding: "7px 10px" }}>{l.u}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{l.q.toLocaleString("fr-FR")}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ background: C.greenSoft, color: C.green, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{l.match} ✓</span></td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{Math.round(l.pu * coef).toLocaleString("fr-FR")}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700 }}>{Math.round(l.q * l.pu * coef).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>Sous-total reconnu : <b style={{ color: C.orange }}>{fcfa(Math.round(DPGF_DEMO.lignes.reduce((s, l) => s + l.q * l.pu, 0) * coef))}</b> HT ({DPGF_DEMO.maitre})</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btnGhost} onClick={() => setDpgf(false)}>Annuler</button>
                <button style={btnPrimary}><FileText size={14} /> Créer le devis DQE de réponse</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: C.steelSoft }}>
              Les lignes non reconnues restent à chiffrer manuellement et enrichissent la bibliothèque une fois validées. Le devis généré respecte la numérotation exacte du cadre du DAO — exigence d'admissibilité ARMP.
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle icon={Gavel}>Suivi des dossiers d'appels d'offres</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {DAO_INIT.map(d => {
            const [bg, fg] = stMap[d.statut];
            return (
              <div key={d.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 10 }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.steel }}>{d.objet}</div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>{d.maitre} · Estimation : {fcfa(d.montant)}</div>
                </div>
                <div style={{ fontSize: 12, color: C.steelSoft }}>Limite : <b style={{ color: C.steel }}>{d.limite}</b></div>
                <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, textTransform: "uppercase" }}>{d.statut}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Bibliothèque camerounaise */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0" }}>
          <SectionTitle icon={ClipboardCheck} action={
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color={C.steelSoft} style={{ position: "absolute", left: 10, top: 9 }} />
                <input placeholder="Rechercher un ouvrage…" value={q} onChange={e => setQ(e.target.value)} style={{ ...inp, paddingLeft: 30, padding: "7px 10px 7px 30px", fontSize: 12.5 }} />
              </div>
              <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...inp, padding: "7px 10px", fontSize: 12.5 }}>
                {Object.keys(COEF_REGION).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          }>Bibliothèque de prix camerounaise — {nbOuvrages} ouvrages (extrait démo)</SectionTitle>
          <div style={{ fontSize: 12, color: C.steelSoft, paddingBottom: 10 }}>
            Prix issus de DQE réels validés (base Yaoundé, MAJ 07/2026) · coefficient régional {region} : ×{coef} · en production : base mutualisée et actualisée sur l'inflation matériaux (ciment, fer, agrégats) — l'équivalent camerounais des 30 000 ouvrages d'Obat, qui n'existe nulle part aujourd'hui.
          </div>
        </div>
        {BPU_CM.map(catg => {
          const items = catg.items.filter(it => (it.des + it.ref).toLowerCase().includes(q.toLowerCase()));
          if (!items.length) return null;
          return (
            <div key={catg.cat}>
              <div style={{ background: C.concrete, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>{catg.cat}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {items.map(b => (
                    <tr key={b.ref} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: "8px 20px", fontWeight: 700, color: C.orange, width: 80 }}>{b.ref}</td>
                      <td style={{ padding: "8px 12px", color: C.steel }}>{b.des}</td>
                      <td style={{ padding: "8px 12px", color: C.steelSoft, width: 50 }}>{b.u}</td>
                      <td style={{ padding: "8px 20px", fontWeight: 600, textAlign: "right", width: 130 }}>{fcfa(Math.round(b.pu * coef))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function PaieCNPS({ ouvriers }) {
  const rows = ouvriers.map(o => {
    const brut = o.tarif * JOURS_MOIS;
    const cnpsSal = Math.round(brut * CNPS_SALARIE);
    const cnpsEmp = Math.round(brut * CNPS_EMPLOYEUR);
    return { ...o, brut, cnpsSal, cnpsEmp, net: brut - cnpsSal };
  });
  const tBrut = rows.reduce((s, r) => s + r.brut, 0);
  const tNet = rows.reduce((s, r) => s + r.net, 0);
  const tCnps = rows.reduce((s, r) => s + r.cnpsSal + r.cnpsEmp, 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Banknote} action={
        <button style={btnPrimary}><Download size={15} /> Générer le DIPE</button>
      }>Paie & CNPS — Juin 2026 ({JOURS_MOIS} jours pointés)</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Masse salariale brute</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: C.steel }}>{fcfa(tBrut)}</div></Card>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Net à payer</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: C.green }}>{fcfa(tNet)}</div></Card>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Cotisations CNPS dues</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: C.orange }}>{fcfa(tCnps)}</div>
          <div style={{ fontSize: 11, color: C.steelSoft }}>Échéance : 15 du mois suivant</div></Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Ouvrier", "Métier", "Brut mensuel", "CNPS salarié (4,2 %)", "CNPS employeur", "Net à payer", "Bulletin"].map(h =>
                <th key={h} style={{ padding: "10px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: C.steel }}>{r.nom}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{r.metier}</td>
                <td style={{ padding: "10px 12px" }}>{fcfa(r.brut)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>−{fcfa(r.cnpsSal)}</td>
                <td style={{ padding: "10px 12px", color: C.steelSoft }}>{fcfa(r.cnpsEmp)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: C.green }}>{fcfa(r.net)}</td>
                <td style={{ padding: "8px 12px" }}>
                  <button style={{ ...btnGhost, padding: "5px 10px", color: C.orange, borderColor: C.orangeSoft }}><Printer size={13} /> PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 12, color: C.steelSoft }}>
        Le brut est calculé automatiquement depuis les pointages terrain (jours pleins et demi-journées). Taux CNPS indicatifs (pension vieillesse, prestations familiales, accidents du travail groupe B) — paramétrables par entreprise. Le paiement des salaires peut être exécuté par lot via MTN MoMo / Orange Money.
      </div>
    </div>
  );
}

function Messagerie({ messages, setMessages }) {
  const [texte, setTexte] = useState("");
  const envoyer = () => {
    if (!texte.trim()) return;
    setMessages([...messages, { id: messages.length + 1, auteur: "A. Mougang Tankwa", role: "Directeur", chantier: "Tous chantiers", heure: "maintenant", texte, canal: "app" }]);
    setTexte("");
  };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={MessageCircle}>Messagerie chantier & notifications WhatsApp</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {messages.map(m => (
              <div key={m.id} style={{
                background: m.auteur === "Système" ? C.amberSoft : C.concrete,
                borderRadius: 10, padding: "10px 12px",
                borderLeft: `3px solid ${m.canal === "whatsapp" ? "#25D366" : C.orange}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                  <b style={{ color: C.steel }}>{m.auteur} <span style={{ fontWeight: 400, color: C.steelSoft }}>· {m.role}</span></b>
                  <span style={{ color: C.steelSoft }}>{m.heure}</span>
                </div>
                <div style={{ fontSize: 13, color: C.steel, marginTop: 4 }}>{m.texte}</div>
                <div style={{ fontSize: 10, color: C.steelSoft, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {m.chantier} · {m.canal === "whatsapp" ? "Relayé sur WhatsApp" : "Application"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Message à l'équipe…" value={texte} onChange={e => setTexte(e.target.value)}
              onKeyDown={e => e.key === "Enter" && envoyer()} style={{ ...inp, flex: 1 }} />
            <button style={btnPrimary} onClick={envoyer}><Send size={15} /> Envoyer</button>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Bell}>Notifications automatiques (WhatsApp Business API)</SectionTitle>
          <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
            {[
              "Rapport journalier reçu → notification au conducteur de travaux",
              "Stock sous seuil → alerte au magasinier + bon de commande suggéré",
              "Facture impayée J+15 / J+30 → relance client automatique",
              "Devis accepté par le client → notification à la direction",
              "Incident gravité élevée → alerte immédiate direction + conducteur",
              "Rapport hebdomadaire PDF → envoyé chaque lundi 7 h",
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.concrete, borderRadius: 8 }}>
                <CheckSquare size={16} color="#25D366" style={{ flexShrink: 0 }} />
                <span style={{ color: C.steel }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
            La plateforme rencontre les usages existants : les équipes reçoivent les alertes là où elles communiquent déjà, sans installer d'application supplémentaire.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Meteo() {
  const Ico = { pluie: CloudRain, nuage: Cloud, soleil: Sun };
  const col = { pluie: "#3B82C4", nuage: C.steelSoft, soleil: C.amber };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={CloudSun}>Météo chantier — Yaoundé (saison des pluies)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {METEO.map((m, i) => {
          const I = Ico[m.icone];
          return (
            <Card key={i} style={{ padding: 16, textAlign: "center", borderTop: i === 0 ? `3px solid ${C.orange}` : undefined }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase" }}>{m.jour}</div>
              <I size={34} color={col[m.icone]} style={{ margin: "8px 0" }} />
              <div style={{ fontSize: 13, color: C.steel }}>{m.desc}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.steel }}>{m.tmax}° <span style={{ fontSize: 14, color: C.steelSoft }}>/ {m.tmin}°</span></div>
              <div style={{ fontSize: 12, color: m.pluie > 60 ? C.red : C.steelSoft }}>Pluie : {m.pluie} %</div>
            </Card>
          );
        })}
      </div>
      <Card>
        <SectionTitle icon={AlertTriangle}>Impact planning</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {METEO.filter(m => m.impact).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: m.pluie > 60 ? C.redSoft : C.greenSoft, borderRadius: 8, fontSize: 14 }}>
              {m.pluie > 60 ? <CloudRain size={16} color={C.red} /> : <Sun size={16} color={C.green} />}
              <b style={{ color: C.steel }}>{m.jour} :</b> <span style={{ color: C.steel }}>{m.impact}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
          Les intempéries sont journalisées automatiquement dans le rapport de chantier — un justificatif contractuel documenté en cas de retard imputable à la météo.
        </div>
      </Card>
    </div>
  );
}

/* ── PROMOTION IMMOBILIÈRE — Programme Mekoumbou City ── */

const PROG = {
  nom: "MEKOUMBOU CITY",
  ville: "Yaoundé III — lieu-dit Mekoumbou chefferie",
  surfaceSite: 7000,
  prixM2: 300000,
  promoteur: "TANK'IMMO SAS — Agrément CPAI N°0001 · RCCM RC/YAO/2021/M/270",
  typologies: [
    { code: "T1", n: 16, surf: 27.68, prix: 8304000 },
    { code: "T2", n: 26, surf: 48.1, prix: 14430000 },
    { code: "T2+", n: 16, surf: 96.54, prix: 28962000 },
    { code: "T3", n: 16, surf: 114.27, prix: 34281000 },
    { code: "T5", n: 26, surf: 160.59, prix: 48177000 },
  ],
};

const LOTS_INIT = (() => {
  // Répartition par bloc issue du fichier de faisabilité (LOT A / B / C / D)
  const parBloc = {
    "T1": [4, 4, 4, 4], "T2": [4, 4, 7, 11], "T2+": [4, 4, 4, 4],
    "T3": [4, 4, 4, 4], "T5": [4, 4, 7, 11],
  };
  const vendus = { "T1": 5, "T2": 9, "T2+": 3, "T3": 4, "T5": 6 };
  const reserves = { "T1": 3, "T2": 4, "T2+": 2, "T3": 2, "T5": 3 };
  const niveaux = ["RDC", "R+1", "R+2"];
  const orientations = ["Sud", "Est", "Ouest", "Nord-Est"];
  const lots = [];
  PROG.typologies.forEach(t => {
    let idx = 0;
    ["A", "B", "C", "D"].forEach((bloc, bi) => {
      for (let j = 0; j < parBloc[t.code][bi]; j++) {
        idx++;
        const statut = idx <= vendus[t.code] ? "Vendu" : idx <= vendus[t.code] + reserves[t.code] ? "Réservé" : "Disponible";
        lots.push({
          id: `${t.code}-${String(idx).padStart(2, "0")}`, code: t.code, surf: t.surf, prix: t.prix,
          statut, bloc, niveau: niveaux[idx % 3], orientation: orientations[idx % 4],
        });
      }
    });
  });
  return lots;
})();

/* Rythme de commercialisation (ventes + réservations cumulées) */
const RYTHME_VENTES = [
  { mois: "Fév", cumul: 6 }, { mois: "Mars", cumul: 14 }, { mois: "Avr", cumul: 22 },
  { mois: "Mai", cumul: 31 }, { mois: "Juin", cumul: 38 }, { mois: "Juil", cumul: 41 },
];
const SEUIL_PRECO_BANQUE = 40; // % de pré-commercialisation exigé pour débloquer le financement

/* Échéancier VEFA contractuel — lié aux jalons du chantier */
const ECHEANCIER_VEFA = [
  { etape: "Signature du contrat / démarrage effectif des travaux", pct: 30, declencheur: "Ouverture de chantier constatée", statut: "Encaissé", date: "15/01/2026" },
  { etape: "Achèvement des fondations", pct: 5, declencheur: "Jalon chantier « Fondations réceptionnées » ✓ 28/02/2026", statut: "Encaissé", date: "05/03/2026" },
  { etape: "Achèvement du plancher haut du RDC", pct: 20, declencheur: "Jalon chantier « Dalle R+1 coulée » ✓ 20/05/2026", statut: "Appel émis", date: "Échéance 20/07/2026" },
  { etape: "Achèvement du plancher haut du 1er étage", pct: 10, declencheur: "Jalon chantier « Dalle R+2 coulée » ✓ 02/07/2026", statut: "À émettre", date: "—" },
  { etape: "Mise hors d'eau (charpente-couverture)", pct: 15, declencheur: "Jalon chantier « Hors d'eau »", statut: "À venir", date: "—" },
  { etape: "Mise hors d'air (menuiseries posées)", pct: 10, declencheur: "Jalon chantier « Hors d'air »", statut: "À venir", date: "—" },
  { etape: "Achèvement des travaux", pct: 5, declencheur: "Réception contradictoire (loi n°97/003)", statut: "À venir", date: "—" },
  { etape: "Livraison — remise des clés", pct: 5, declencheur: "PV de livraison contradictoire signé", statut: "À venir", date: "—" },
];

const RESERVATIONS_INIT = [
  { id: "RES-2026-041", acquereur: "M. Moukoumbou Alain", lot: "T3-02", prix: 34281000, encaisse: 12000000, mode: "Virement", prochain: "Appel n°3 (20 %) — 6 856 200 F" },
  { id: "RES-2026-038", acquereur: "Mme Essola Bernadette", lot: "T2-11", prix: 14430000, encaisse: 5050500, mode: "MTN MoMo", prochain: "Appel n°3 (20 %) — 2 886 000 F" },
  { id: "RES-2026-035", acquereur: "M. Nkoulou Jean-Pierre (diaspora — Montréal)", lot: "T5-04", prix: 48177000, encaisse: 16862000, mode: "Virement international", prochain: "Appel n°3 (20 %) — 9 635 400 F" },
  { id: "RES-2026-032", acquereur: "Mme Abanda Rose", lot: "T2+-05", prix: 28962000, encaisse: 10136700, mode: "Orange Money", prochain: "Appel n°3 (20 %) — 5 792 400 F" },
];

/* Bibliothèque de contrats — droit camerounais */
const CONTRATS_CM = [
  {
    id: "reservation",
    titre: "Contrat de réservation (contrat préliminaire) — VEFA logement",
    usage: "À signer avec chaque acquéreur avant l'acte notarié. Réservé au secteur du logement.",
    bases: ["Loi n°97/003 du 10/01/1997", "Décret n°2007/1419/PM mod. n°2014/2378/PM", "Ord. n°74-1 (régime foncier)"],
    genere: true,
  },
  {
    id: "vefa",
    titre: "Acte de vente en l'état futur d'achèvement (par-devant notaire)",
    usage: "Acte authentique reçu par un notaire camerounais du ressort de l'immeuble ; enregistrement et publicité foncière (titre foncier).",
    bases: ["Loi n°97/003", "Ord. n°74-1 & décret n°76/165 (titre foncier)", "Code de l'enregistrement"],
    genere: false,
  },
  {
    id: "promotion",
    titre: "Contrat de promotion immobilière (mandat d'intérêt commun)",
    usage: "Entre le maître d'ouvrage et le promoteur pour la réalisation du programme — écrit obligatoire, mentions de l'art. 54.",
    bases: ["Loi n°97/003 (Titre III)", "Comptabilité OHADA/SYSCOHADA"],
    genere: false,
  },
  {
    id: "livraison",
    titre: "PV de réception & de livraison contradictoire",
    usage: "La réception est prononcée contradictoirement (loi n°97/003) ; déclenche les 2 derniers appels de fonds et les garanties.",
    bases: ["Loi n°97/003", "AUDCG OHADA"],
    genere: false,
  },
];

const AUDIT_ANCIEN_MODELE = [
  { avant: "Visa du Code de la construction et de l'habitation français (art. L.261-15, L.271-1, R.261-28…)", apres: "Visa de la loi n°97/003 du 10/01/1997 relative à la promotion immobilière et de son décret d'application n°2007/1419/PM (mod. 2014/2378/PM)" },
  { avant: "Copropriété régie par la loi française n°65-557 du 10/07/1965", apres: "Régime de la copropriété en vigueur au Cameroun ; règlement de copropriété établi et publié localement" },
  { avant: "Permis de construire délivré par la mairie d'Ozoir-la-Ferrière ; notaires à Orsay (France)", apres: "Permis de construire de la Communauté urbaine / commune de Yaoundé III ; notaire camerounais du ressort de l'immeuble" },
  { avant: "Dépôt de garantie de 1 500 € ; prix TVA 20 % ; dispositif fiscal « Pinel »", apres: "Dépôt de garantie en FCFA sur compte séquestre chez le notaire ; TVA 19,25 % ; références fiscales CGI Cameroun (droits d'enregistrement)" },
  { avant: "Garantie d'achèvement bancaire française ; assurance dommage-ouvrage loi de 1978", apres: "Garantie financière du promoteur (art. 11, loi n°97/003 — plancher légal 25 000 000 FCFA, attestation bancaire/COBAC) ; assurances chantier locales" },
  { avant: "Rétractation art. L.271-1 CCH ; médiateur de la consommation ; Bloctel ; RGPD", apres: "Clauses de renonciation/restitution du dépôt définies au contrat conformément au droit camerounais ; règlement des litiges devant les tribunaux du lieu de situation de l'immeuble (ou arbitrage OHADA/CCJA)" },
  { avant: "Sismicité, plan de prévention des risques, retrait-gonflement des argiles (diagnostics français)", apres: "État du titre foncier (certificat de propriété, hypothèques), rapport de sondage de sol, conformité au plan d'occupation des sols de Yaoundé III" },
];

function ContratVEFAModal({ lot, onClose }) {
  if (!lot) return null;
  const tva = Math.round(lot.prix * TVA / (1 + TVA)); // prix TTC affiché au m² — TVA incluse
  const depot = Math.round(lot.prix * 0.02);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,28,36,.6)", zIndex: 100, display: "grid", placeItems: "start center", padding: 16, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: "min(700px, 100%)", borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.35)", margin: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: C.steel, color: C.white }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Contrat de réservation généré — Lot {lot.id}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btnPrimary, padding: "6px 12px" }}><PenLine size={14} /> Envoyer en signature (OTP SMS)</button>
            <button style={{ ...btnGhost, color: C.white, borderColor: C.steelSoft, padding: "6px 12px" }}><Printer size={14} /> Imprimer</button>
            <button onClick={onClose} style={{ ...btnGhost, color: C.white, borderColor: C.steelSoft, padding: "6px 10px" }}><X size={15} /></button>
          </div>
        </div>

        <div style={{ padding: 28, color: C.steel, fontSize: 12, lineHeight: 1.65 }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Contrat de réservation — Vente en l'état futur d'achèvement
            </div>
            <div style={{ fontSize: 11, color: C.steelSoft }}>
              Contrat préliminaire soumis à la loi n°97/003 du 10 janvier 1997 relative à la promotion immobilière et à son décret d'application n°2007/1419/PM du 02 novembre 2007, modifié par le décret n°2014/2378/PM du 20 août 2014 — République du Cameroun
            </div>
          </div>
          <Hazard />

          <div style={{ marginTop: 14 }}>
            <b>ENTRE LES SOUSSIGNÉS :</b><br />
            La société <b>TANK'IMMO SAS</b>, promoteur immobilier agréé — Agrément CPAI N°0001 et agrément N°/E/2/MINHDU/SG/CJ du 03/07/08 — immatriculée au RCCM sous le n° <b>RC/YAO/2021/M/270</b>, ayant son siège social rue 4022, Awae 3, Mvog-Mbi, Yaoundé, justifiant de la garantie financière prévue à l'article 11 de la loi n°97/003 susvisée (attestation bancaire jointe),<br />
            <span style={{ color: C.steelSoft }}>Ci-après « le RÉSERVANT »,</span><br /><br />
            <b>Madame / Monsieur ______________________</b>, né(e) le ____ à ____, de nationalité ____, profession ____, domicilié(e) à ____, téléphone ____,<br />
            <span style={{ color: C.steelSoft }}>Ci-après « le RÉSERVATAIRE ».</span>
          </div>

          <div style={{ marginTop: 12, background: C.concrete, borderRadius: 8, padding: 12 }}>
            <b>ARTICLE 1 — DÉSIGNATION.</b> Programme <b>{PROG.nom}</b>, {PROG.ville}, édifié sur un terrain de {PROG.surfaceSite.toLocaleString("fr-FR")} m² objet du titre foncier n° ____ du livre foncier du Mfoundi (ordonnance n°74-1 du 6 juillet 1974 fixant le régime foncier). Lot réservé : <b>{lot.id}</b> — appartement type <b>{lot.code}</b>, surface habitable approximative <b>{lot.surf} m²</b>, tel que figurant au plan de commercialisation annexé. La consistance et la qualité de la construction résultent de la notice descriptive annexée (art. R. du décret n°2007/1419/PM).
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 2 — PRIX.</b> La vente, si elle se réalise, aura lieu moyennant le prix toutes taxes comprises (TVA au taux en vigueur de 19,25 %) de <b>{fcfa(lot.prix)}</b>, soit {PROG.prixM2.toLocaleString("fr-FR")} FCFA/m² bâti. Ne sont pas compris : les frais, droits d'enregistrement et émoluments de l'acte notarié, la quote-part des frais d'établissement du règlement de copropriété, et les frais des prêts éventuels du RÉSERVATAIRE.
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 3 — DÉPÔT DE GARANTIE.</b> En contrepartie de la réservation, le RÉSERVATAIRE verse la somme de <b>{fcfa(depot)}</b> (2 % du prix prévisionnel) sur un compte séquestre ouvert à son nom en l'étude de Maître ____, notaire à Yaoundé. Cette somme est indisponible, incessible et insaisissable jusqu'à la conclusion de la vente ; elle s'impute sur le premier versement ou est restituée au RÉSERVATAIRE dans les cas de non-réalisation prévus au présent contrat.
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 4 — ÉCHÉANCIER DE PAIEMENT.</b> Le prix est payable par fractions au fur et à mesure de l'avancement, constaté contradictoirement sur le chantier :
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontSize: 11 }}>
              <tbody>
                {ECHEANCIER_VEFA.map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "4px 6px" }}>{e.etape}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700, width: 50 }}>{e.pct} %</td>
                    <td style={{ padding: "4px 6px", textAlign: "right", width: 110 }}>{fcfa(Math.round(lot.prix * e.pct / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            Règlement par virement, chèque, espèces (dans les limites légales), MTN Mobile Money ou Orange Money. Tout retard de paiement d'un appel de fonds porte indemnité de 1 % par mois de retard.
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 5 — DÉLAI DE LIVRAISON.</b> Les lots seront achevés au plus tard le ____, sauf force majeure ou cause légitime de suspension (intempéries dûment constatées au journal de chantier, grèves). Un immeuble est réputé achevé lorsque sont exécutés les ouvrages et installés les équipements indispensables à son utilisation conformément à sa destination (loi n°97/003). La réception et la livraison sont prononcées <b>contradictoirement</b> avec procès-verbal.
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 6 — CONDITIONS SUSPENSIVES.</b> (i) permis de construire devenu définitif délivré par l'autorité compétente de Yaoundé III ; (ii) justification de la garantie financière du RÉSERVANT (art. 11, loi n°97/003) ; (iii) le cas échéant, obtention par le RÉSERVATAIRE du financement déclaré à l'article 7.
          </div>

          <div style={{ marginTop: 10 }}>
            <b>ARTICLE 7 — LITIGES.</b> Tout différend relatif à l'interprétation ou l'exécution des présentes relève des tribunaux du lieu de situation de l'immeuble (Yaoundé), les parties conservant la faculté de recourir à l'arbitrage conformément à l'Acte uniforme OHADA relatif au droit de l'arbitrage.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16, fontSize: 11 }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, minHeight: 60 }}>
              <b>Le RÉSERVANT</b> — TANK'IMMO SAS<br /><span style={{ color: C.steelSoft }}>Cachet et signature</span>
            </div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, minHeight: 60 }}>
              <b>Le RÉSERVATAIRE</b> — lu et approuvé<br /><span style={{ color: C.steelSoft }}>Date et signature</span>
            </div>
          </div>

          <div style={{ marginTop: 12, background: C.amberSoft, borderRadius: 8, padding: 10, fontSize: 10.5, color: C.steel }}>
            ⚠ Modèle généré automatiquement à titre indicatif à partir des textes camerounais en vigueur. À faire valider par un notaire ou un conseil juridique camerounais avant toute signature — la plateforme ne fournit pas de conseil juridique.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Plan masse du site Mekoumbou City (SVG) ─────────── */
function PlanMasseSVG({ lots, blocSel, onBloc }) {
  const blocs = {
    A: { x: 60, y: 40, w: 120, h: 70 },
    B: { x: 220, y: 40, w: 120, h: 70 },
    C: { x: 60, y: 150, w: 120, h: 80 },
    D: { x: 220, y: 150, w: 150, h: 80 },
  };
  const stats = (b) => {
    const ls = lots.filter(l => l.bloc === b);
    const ecoules = ls.filter(l => l.statut !== "Disponible").length;
    return { n: ls.length, ecoules, pct: Math.round(ecoules / ls.length * 100) };
  };
  const lbl = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fill: C.white };
  return (
    <svg viewBox="0 0 420 290" style={{ width: "100%", display: "block", background: "#F3F6F4", borderRadius: 10 }} xmlns="http://www.w3.org/2000/svg">
      {/* espaces verts */}
      <ellipse cx="395" cy="60" rx="45" ry="90" fill="#CBE3C6" />
      <ellipse cx="25" cy="250" rx="55" ry="45" fill="#CBE3C6" />
      {/* voirie principale 8 m + boucle 6 m */}
      <path d="M 0 130 H 420" stroke="#9AA6B0" strokeWidth="16" fill="none" />
      <path d="M 40 130 V 20 H 380 M 40 130 V 265 H 385 V 130" stroke="#B9C2CA" strokeWidth="10" fill="none" />
      <path d="M 0 130 H 420" stroke="#F3F6F4" strokeWidth="1.5" strokeDasharray="8 8" fill="none" />
      {/* blocs */}
      {Object.entries(blocs).map(([b, r]) => {
        const s = stats(b);
        const actif = blocSel === b;
        return (
          <g key={b} onClick={() => onBloc(actif ? null : b)} style={{ cursor: "pointer" }}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="6"
              fill={C.steelMid} stroke={actif ? C.orange : C.steel} strokeWidth={actif ? 4 : 2} />
            <rect x={r.x} y={r.y + r.h - 8} width={r.w * s.pct / 100} height="8" rx="3" fill={C.orange} />
            <text x={r.x + 10} y={r.y + 24} style={{ ...lbl, fontSize: 20 }}>BLOC {b}</text>
            <text x={r.x + 10} y={r.y + 42} style={{ fontSize: 10, fill: "#C9D4DE" }}>{s.n} logements · {s.pct} % écoulé</text>
          </g>
        );
      })}
      {/* équipements */}
      <circle cx="395" cy="230" r="14" fill="#4C7FB5" />
      <text x="382" y="260" style={{ fontSize: 9, fill: C.steelSoft }}>Forage</text>
      <rect x="150" y="255" width="22" height="20" rx="3" fill={C.steelSoft} />
      <text x="140" y="288" style={{ fontSize: 9, fill: C.steelSoft }}>Loge gardien</text>
      {/* accès */}
      <polygon points="0,122 14,130 0,138" fill={C.orange} />
      <text x="4" y="115" style={{ fontSize: 9, fill: C.steelSoft }}>Accès principal (8 m)</text>
      <text x="8" y="16" style={{ fontSize: 9, fill: C.steelSoft }}>Site 7 000 m² — Yaoundé III, Mekoumbou chefferie · voirie intérieure 6 m · espaces verts</text>
    </svg>
  );
}

/* ── Plans des logements par typologie (SVG paramétré) ── */
const PLANS_TYPO = {
  "T1": { vb: "0 0 300 200", pieces: [
    { x: 10, y: 10, w: 180, h: 120, l: "SÉJOUR + KITCHENETTE" },
    { x: 190, y: 10, w: 100, h: 70, l: "CHAMBRE" },
    { x: 190, y: 80, w: 100, h: 50, l: "SDB" },
    { x: 10, y: 130, w: 280, h: 60, l: "TERRASSE / SÉCHOIR" }] },
  "T2": { vb: "0 0 320 220", pieces: [
    { x: 10, y: 10, w: 170, h: 110, l: "SÉJOUR" },
    { x: 180, y: 10, w: 130, h: 70, l: "CHAMBRE 1" },
    { x: 180, y: 80, w: 130, h: 60, l: "CUISINE" },
    { x: 10, y: 120, w: 110, h: 90, l: "CHAMBRE 2" },
    { x: 120, y: 140, w: 80, h: 70, l: "SDB + WC" },
    { x: 200, y: 140, w: 110, h: 70, l: "BALCON" }] },
  "T2+": { vb: "0 0 340 230", pieces: [
    { x: 10, y: 10, w: 190, h: 110, l: "SÉJOUR / SALLE À MANGER" },
    { x: 200, y: 10, w: 130, h: 70, l: "CHAMBRE 1" },
    { x: 200, y: 80, w: 130, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 120, h: 100, l: "CUISINE ÉQUIPÉE" },
    { x: 130, y: 140, w: 90, h: 80, l: "SDB + WC" },
    { x: 220, y: 140, w: 110, h: 80, l: "VARANGUE" }] },
  "T3": { vb: "0 0 360 240", pieces: [
    { x: 10, y: 10, w: 200, h: 110, l: "SÉJOUR / SALLE À MANGER" },
    { x: 210, y: 10, w: 140, h: 70, l: "CHAMBRE PARENTALE + SDB" },
    { x: 210, y: 80, w: 140, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 110, h: 110, l: "CHAMBRE 3" },
    { x: 120, y: 140, w: 110, h: 90, l: "CUISINE" },
    { x: 230, y: 140, w: 120, h: 90, l: "SDB + WC · BALCON" }] },
  "T5": { vb: "0 0 380 260", pieces: [
    { x: 10, y: 10, w: 210, h: 110, l: "DOUBLE SÉJOUR" },
    { x: 220, y: 10, w: 150, h: 70, l: "SUITE PARENTALE" },
    { x: 220, y: 80, w: 150, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 115, h: 130, l: "CHAMBRES 3 & 4" },
    { x: 125, y: 140, w: 115, h: 110, l: "CUISINE + CELLIER" },
    { x: 240, y: 140, w: 130, h: 110, l: "2 SDB · WC · VARANGUE" }] },
};

function PlanTypo({ code }) {
  const p = PLANS_TYPO[code];
  return (
    <svg viewBox={p.vb} style={{ width: "100%", display: "block", background: "#FBFCFD", borderRadius: 8, border: `1px solid ${C.line}` }} xmlns="http://www.w3.org/2000/svg">
      {p.pieces.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={C.steel} strokeWidth="2.5" />
          <text x={r.x + 8} y={r.y + 20} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fill: C.steelSoft, fontWeight: 600, letterSpacing: 0.6 }}>{r.l}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Simulateur de financement acquéreur ─────────────── */
function Simulateur({ lots, lotDefaut }) {
  const dispo = lots.filter(l => l.statut === "Disponible");
  const [lotId, setLotId] = useState(lotDefaut || dispo[0]?.id);
  const [mode, setMode] = useState("vefa"); // vefa | credit
  const [apportPct, setApportPct] = useState(30);
  const [duree, setDuree] = useState(180); // mois
  const [taux, setTaux] = useState(9); // % annuel indicatif banques CM
  const [revenu, setRevenu] = useState(350000);
  const lot = lots.find(l => l.id === lotId) || dispo[0];
  if (!lot) return null;

  const apport = Math.round(lot.prix * apportPct / 100);
  const solde = lot.prix - apport;
  const tm = taux / 100 / 12;
  const mensualiteCredit = tm > 0 ? Math.round(solde * tm / (1 - Math.pow(1 + tm, -duree))) : Math.round(solde / duree);
  // VEFA : solde payé sans intérêts au rythme des appels de fonds (~18 mois de chantier)
  const mensualiteVefa = Math.round(solde / 18);
  const mensualite = mode === "credit" ? mensualiteCredit : mensualiteVefa;
  const tauxEffort = Math.round(mensualite / revenu * 100);

  const num = (v) => (isNaN(v) ? 0 : v);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Logement
          <select value={lotId} onChange={e => setLotId(e.target.value)} style={inp}>
            {[lot, ...dispo.filter(d => d.id !== lot.id)].map(l => <option key={l.id} value={l.id}>{l.id} — {l.code} · {l.surf} m² · {(l.prix / 1e6).toFixed(1)} M</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Revenu mensuel net (FCFA)
          <input type="number" step="25000" value={revenu} onChange={e => setRevenu(num(+e.target.value))} style={inp} />
        </label>
        <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Apport initial : {apportPct} %
          <input type="range" min="20" max="60" step="5" value={apportPct} onChange={e => setApportPct(+e.target.value)} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setMode("vefa")} style={{ ...btnGhost, flex: 1, justifyContent: "center", background: mode === "vefa" ? C.steel : "transparent", color: mode === "vefa" ? C.white : C.steelSoft }}>
          Paiement échelonné VEFA (sans intérêts)
        </button>
        <button onClick={() => setMode("credit")} style={{ ...btnGhost, flex: 1, justifyContent: "center", background: mode === "credit" ? C.steel : "transparent", color: mode === "credit" ? C.white : C.steelSoft }}>
          Crédit bancaire
        </button>
      </div>

      {mode === "credit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Durée : {Math.round(duree / 12)} ans
            <input type="range" min="60" max="240" step="12" value={duree} onChange={e => setDuree(+e.target.value)} />
          </label>
          <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Taux annuel indicatif : {taux} %
            <input type="range" min="5" max="14" step="0.5" value={taux} onChange={e => setTaux(+e.target.value)} />
          </label>
        </div>
      )}

      <div style={{ background: C.concrete, borderRadius: 10, padding: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Prix du logement ({lot.id} — {lot.surf} m²)</span><b>{fcfa(lot.prix)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Apport initial ({apportPct} %, dont dépôt de garantie 2 % séquestré)</span><b>{fcfa(apport)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{mode === "vefa" ? "Versement mensuel moyen pendant le chantier (~18 mois, au rythme des appels de fonds)" : `Mensualité de crédit (${Math.round(duree / 12)} ans à ${taux} %)`}</span>
          <b style={{ color: C.orange, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20 }}>{fcfa(mensualite)}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
          <span>Taux d'effort estimé</span>
          <b style={{ color: tauxEffort <= 33 ? C.green : tauxEffort <= 40 ? C.amber : C.red }}>{tauxEffort} % du revenu {tauxEffort <= 33 ? "✓ soutenable" : tauxEffort <= 40 ? "— limite" : "— trop élevé"}</b>
        </div>
        {tauxEffort > 33 && (
          <div style={{ fontSize: 12, color: C.steelSoft }}>
            Suggestion : {mode === "vefa" ? "augmenter l'apport, viser une typologie inférieure, ou basculer sur un crédit bancaire plus long." : "allonger la durée, augmenter l'apport, ou viser une typologie inférieure."} Les paiements s'effectuent par virement, MTN MoMo ou Orange Money.
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.steelSoft }}>
        Simulation indicative, hors frais de notaire, d'enregistrement et d'assurance. En VEFA, chaque versement n'est exigible qu'après constat contradictoire de l'avancement (loi n°97/003) — vos fonds suivent le chantier, pas l'inverse.
      </div>
    </div>
  );
}

function Programmes({ lots, setLots }) {
  const [tab, setTab] = useState("masse");
  const [filtre, setFiltre] = useState("Tous");
  const [blocSel, setBlocSel] = useState(null);
  const [lotSel, setLotSel] = useState(null);
  const [contrat, setContrat] = useState(null);
  const [typoPlan, setTypoPlan] = useState("T3");

  const vendus = lots.filter(l => l.statut === "Vendu");
  const reserves = lots.filter(l => l.statut === "Réservé");
  const ecoules = vendus.length + reserves.length;
  const caTotal = lots.reduce((s, l) => s + l.prix, 0);
  const caSecurise = [...vendus, ...reserves].reduce((s, l) => s + l.prix, 0);
  const couleurs = { "Vendu": C.green, "Réservé": C.amber, "Disponible": "#C6CFD8" };
  const sel = lots.find(l => l.id === lotSel);
  const visibles = lots.filter(l => (filtre === "Tous" || l.code === filtre) && (!blocSel || l.bloc === blocSel));

  const reserver = (id) => setLots(lots.map(l => l.id === id && l.statut === "Disponible" ? { ...l, statut: "Réservé" } : l));

  const ecoulementTypo = PROG.typologies.map(t => {
    const ls = lots.filter(l => l.code === t.code);
    return { nom: t.code, "Écoulé %": Math.round(ls.filter(l => l.statut !== "Disponible").length / ls.length * 100) };
  });
  const rythmeMoyen = Math.round((RYTHME_VENTES.at(-1).cumul - RYTHME_VENTES[0].cumul) / (RYTHME_VENTES.length - 1) * 10) / 10;
  const stockMois = rythmeMoyen > 0 ? Math.ceil((lots.length - ecoules) / rythmeMoyen) : "—";
  const precoPct = Math.round(ecoules / lots.length * 100);

  const tabs = [
    { id: "masse", label: "Plan masse" },
    { id: "lots", label: "Grille des lots" },
    { id: "plans", label: "Plans des logements" },
    { id: "commercial", label: "Commercialisation" },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>
                {PROG.nom} — 100 logements
              </h2>
              <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>
                {PROG.ville} · Site de {PROG.surfaceSite.toLocaleString("fr-FR")} m² · {PROG.prixM2.toLocaleString("fr-FR")} FCFA/m² bâti · {PROG.promoteur}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 14 }}>
            <div><div style={miniLabel}>Vendus</div><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.green }}>{vendus.length}</div></div>
            <div><div style={miniLabel}>Réservés</div><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.amber }}>{reserves.length}</div></div>
            <div><div style={miniLabel}>Disponibles</div><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.steel }}>{lots.length - ecoules}</div></div>
            <div><div style={miniLabel}>CA sécurisé / potentiel</div><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.orange }}>{Math.round(caSecurise / 1e6)} M <span style={{ fontSize: 13, color: C.steelSoft }}>/ {Math.round(caTotal / 1e6)} M</span></div></div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                padding: "8px 14px", fontSize: 13.5, fontWeight: 700,
                color: tab === t.id ? C.orange : C.steelSoft,
                borderBottom: `3px solid ${tab === t.id ? C.orange : "transparent"}`,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </Card>

      {tab === "masse" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 3fr) minmax(240px, 2fr)", gap: 20, alignItems: "start" }}>
          <Card>
            <SectionTitle icon={MapPin}>Plan masse — cliquez sur un bloc</SectionTitle>
            <PlanMasseSVG lots={lots} blocSel={blocSel} onBloc={setBlocSel} />
            <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
              La barre orange sous chaque bloc figure son taux d'écoulement. Le bloc sélectionné filtre la grille des lots. Voirie 8 m d'accès + boucle intérieure 6 m, forage autonome, espaces verts — conformément à la plaquette du programme.
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Building2}>{blocSel ? `Bloc ${blocSel}` : "Tous blocs"} — répartition</SectionTitle>
            <div style={{ display: "grid", gap: 8 }}>
              {PROG.typologies.map(t => {
                const ls = lots.filter(l => l.code === t.code && (!blocSel || l.bloc === blocSel));
                if (!ls.length) return null;
                const e = ls.filter(l => l.statut !== "Disponible").length;
                return (
                  <div key={t.code}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                      <span><b>{t.code}</b> · {t.surf} m² · {fcfa(t.prix)}</span>
                      <span style={{ color: C.steelSoft }}>{e}/{ls.length} écoulés</span>
                    </div>
                    <Progress pct={Math.round(e / ls.length * 100)} />
                  </div>
                );
              })}
              <button style={{ ...btnPrimary, justifySelf: "start", marginTop: 4 }} onClick={() => setTab("lots")}>
                Voir les lots {blocSel ? `du bloc ${blocSel}` : ""} <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "lots" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 3fr) minmax(250px, 2fr)", gap: 20, alignItems: "start" }}>
          <Card>
            <SectionTitle icon={Building2} action={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Tous", ...PROG.typologies.map(t => t.code)].map(t => (
                  <button key={t} onClick={() => setFiltre(t)} style={{
                    ...btnGhost, padding: "5px 11px", fontSize: 12,
                    background: filtre === t ? C.steel : "transparent",
                    color: filtre === t ? C.white : C.steelSoft,
                  }}>{t}</button>
                ))}
                {["A", "B", "C", "D"].map(b => (
                  <button key={b} onClick={() => setBlocSel(blocSel === b ? null : b)} style={{
                    ...btnGhost, padding: "5px 11px", fontSize: 12,
                    background: blocSel === b ? C.orange : "transparent",
                    color: blocSel === b ? C.white : C.steelSoft,
                    borderColor: blocSel === b ? C.orange : C.line,
                  }}>Bloc {b}</button>
                ))}
              </div>
            }>Grille des lots ({visibles.length})</SectionTitle>
            {PROG.typologies.filter(t => filtre === "Tous" || t.code === filtre).map(t => {
              const ls = visibles.filter(l => l.code === t.code);
              if (!ls.length) return null;
              return (
                <div key={t.code} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.steelSoft, marginBottom: 6 }}>
                    {t.code} — {t.surf} m² · {fcfa(t.prix)}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ls.map(l => (
                      <button key={l.id} onClick={() => setLotSel(l.id)} title={`${l.id} — Bloc ${l.bloc} · ${l.niveau} · ${l.statut}`} style={{
                        width: 56, height: 36, borderRadius: 6, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 12, fontWeight: 700, border: lotSel === l.id ? `2px solid ${C.steel}` : `1px solid ${C.line}`,
                        background: couleurs[l.statut], color: l.statut === "Disponible" ? C.steel : C.white,
                        display: "grid", lineHeight: 1.1,
                      }}>
                        <span>{l.id.split("-")[1]}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, opacity: .85 }}>{l.bloc}·{l.niveau}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.steelSoft, marginTop: 4 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.green, borderRadius: 3, marginRight: 4 }} />Vendu</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.amber, borderRadius: 3, marginRight: 4 }} />Réservé</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#C6CFD8", borderRadius: 3, marginRight: 4 }} />Disponible</span>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Home}>Fiche du lot</SectionTitle>
            {sel ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.steel }}>{sel.id}</div>
                  <StatutBadge s={sel.statut} />
                </div>
                <PlanTypo code={sel.code} />
                <div style={{ fontSize: 13.5, color: C.steel, display: "grid", gap: 5 }}>
                  <div>Bloc <b>{sel.bloc}</b> · Niveau <b>{sel.niveau}</b> · Orientation <b>{sel.orientation}</b></div>
                  <div>Typologie <b>{sel.code}</b> · Surface <b>{sel.surf} m²</b></div>
                  <div>Prix TTC : <b style={{ color: C.orange }}>{fcfa(sel.prix)}</b> ({PROG.prixM2.toLocaleString("fr-FR")} F/m²)</div>
                  <div>Apport réservation + signature (30 %) : <b>{fcfa(Math.round(sel.prix * 0.3))}</b></div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>Travaux modificatifs acquéreur (TMA) possibles jusqu'à la pose des cloisons — sur devis, via le module Devis.</div>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                  {sel.statut === "Disponible" && (
                    <button style={btnPrimary} onClick={() => reserver(sel.id)}><CheckCircle2 size={15} /> Poser une option / Réserver</button>
                  )}
                  <button style={{ ...btnGhost, justifyContent: "center", color: C.orange, borderColor: C.orangeSoft }} onClick={() => setContrat(sel)}>
                    <Scale size={15} /> Générer le contrat de réservation (droit CM)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.steelSoft }}>Sélectionnez un lot pour afficher son plan, sa fiche complète (bloc, niveau, orientation), le réserver ou générer son contrat.</div>
            )}
          </Card>
        </div>
      )}

      {tab === "plans" && (
        <Card>
          <SectionTitle icon={Home} action={
            <div style={{ display: "flex", gap: 6 }}>
              {PROG.typologies.map(t => (
                <button key={t.code} onClick={() => setTypoPlan(t.code)} style={{
                  ...btnGhost, padding: "5px 11px", fontSize: 12,
                  background: typoPlan === t.code ? C.steel : "transparent",
                  color: typoPlan === t.code ? C.white : C.steelSoft,
                }}>{t.code}</button>
              ))}
            </div>
          }>Plans des logements — {typoPlan} ({PROG.typologies.find(t => t.code === typoPlan).surf} m²)</SectionTitle>
          <div style={{ maxWidth: 560 }}>
            <PlanTypo code={typoPlan} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 13, color: C.steel }}>
            <span>Prix : <b style={{ color: C.orange }}>{fcfa(PROG.typologies.find(t => t.code === typoPlan).prix)}</b></span>
            <span>Unités : <b>{PROG.typologies.find(t => t.code === typoPlan).n}</b></span>
            <span>Disponibles : <b>{lots.filter(l => l.code === typoPlan && l.statut === "Disponible").length}</b></span>
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
            En production, ces plans sont les fichiers de l'architecte (PDF/DWG convertis), annotables par les acquéreurs avec la même technologie d'épingles que le suivi de chantier — chaque demande de TMA naît d'un commentaire localisé sur le plan.
          </div>
        </Card>
      )}

      {tab === "commercial" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Pré-commercialisation</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, color: precoPct >= SEUIL_PRECO_BANQUE ? C.green : C.amber }}>{precoPct} %</div>
              <Progress pct={precoPct} color={precoPct >= SEUIL_PRECO_BANQUE ? C.green : C.amber} />
              <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 4 }}>Seuil bancaire de déblocage : {SEUIL_PRECO_BANQUE} % {precoPct >= SEUIL_PRECO_BANQUE ? "✓ atteint" : "— à atteindre"}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Rythme de vente moyen</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, color: C.steel }}>{rythmeMoyen}<span style={{ fontSize: 15, color: C.steelSoft }}> lots/mois</span></div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Écoulement du stock restant</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, color: C.steel }}>{stockMois}<span style={{ fontSize: 15, color: C.steelSoft }}> mois au rythme actuel</span></div>
            </Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <Card>
              <SectionTitle icon={TrendingUp}>Ventes + réservations cumulées</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={RYTHME_VENTES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cumul" name="Lots écoulés" stroke={C.orange} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionTitle icon={PieChartIcon}>Écoulement par typologie (%)</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ecoulementTypo}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                  <YAxis unit=" %" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `${v} %`} />
                  <Bar dataKey="Écoulé %" fill={C.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 6 }}>
                Lecture promoteur : les T2 et T5 (cible 150 000 F/mois de revenu et diaspora) s'écoulent plus vite — envisager un repricing des T2+ ou une action commerciale ciblée.
              </div>
            </Card>
          </div>
        </div>
      )}
      <ContratVEFAModal lot={contrat} onClose={() => setContrat(null)} />
    </div>
  );
}

function VefaAppels({ reservations }) {
  const stMap = { "Encaissé": [C.greenSoft, C.green], "Appel émis": [C.amberSoft, C.amber], "À émettre": [C.orangeSoft, C.orange], "À venir": [C.concrete, C.steelSoft] };
  const cumul = ECHEANCIER_VEFA.filter(e => e.statut === "Encaissé").reduce((s, e) => s + e.pct, 0);
  const totEncaisse = reservations.reduce((s, r) => s + r.encaisse, 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Landmark}>VEFA & appels de fonds — {PROG.nom}</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.greenSoft, border: `1px solid ${C.green}`, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, color: C.steel }}>
        <HardHat size={18} color={C.green} style={{ flexShrink: 0 }} />
        <span><b>Le chantier pilote la trésorerie :</b> le jalon « Dalle R+2 coulée » validé le 02/07/2026 par le conducteur de travaux a rendu exigible l'appel de fonds n°4 (10 %). Un clic sur « Émettre » l'envoie aux {reservations.length} acquéreurs (email + WhatsApp + lien de paiement Mobile Money).</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Avancement encaissé (échéancier)</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, color: C.green }}>{cumul} %</div>
          <Progress pct={cumul} color={C.green} /></Card>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Encaissé (4 réservations témoin)</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.steel }}>{fcfa(totEncaisse)}</div></Card>
        <Card style={{ padding: 16 }}><div style={miniLabel}>Dépôts de garantie séquestrés</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: C.orange }}>{fcfa(reservations.reduce((s, r) => s + Math.round(r.prix * 0.02), 0))}</div>
          <div style={{ fontSize: 11, color: C.steelSoft }}>Compte séquestre notaire — indisponibles jusqu'à la vente</div></Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0" }}>
          <SectionTitle icon={Calendar}>Échéancier contractuel lié aux jalons du chantier</SectionTitle>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Étape contractuelle", "%", "Déclencheur chantier", "Statut", "Date"].map(h =>
                <th key={h} style={{ padding: "10px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {ECHEANCIER_VEFA.map((e, i) => {
              const [bg, fg] = stMap[e.statut];
              return (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "9px 12px", fontWeight: 600, color: C.steel }}>{e.etape}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16 }}>{e.pct} %</td>
                  <td style={{ padding: "9px 12px", fontSize: 12, color: C.steelSoft }}>{e.declencheur}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {e.statut === "À émettre"
                      ? <button style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}><Send size={13} /> Émettre l'appel</button>
                      : <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap" }}>{e.statut}</span>}
                  </td>
                  <td style={{ padding: "9px 12px", fontSize: 12, color: C.steelSoft }}>{e.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle icon={Users}>Réservations (extrait)</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {reservations.map(r => (
            <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <b style={{ fontSize: 14, color: C.steel }}>{r.acquereur}</b>
                  <span style={{ fontSize: 12, color: C.steelSoft }}> · {r.id} · Lot <b>{r.lot}</b> · {fcfa(r.prix)}</span>
                </div>
                <span style={{ fontSize: 12, color: C.steelSoft }}>Règlement : {r.mode}</span>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 3 }}>
                  <span>Encaissé : <b style={{ color: C.green }}>{fcfa(r.encaisse)}</b> ({Math.round(r.encaisse / r.prix * 100)} %)</span>
                  <span>Prochain : {r.prochain}</span>
                </div>
                <Progress pct={Math.round(r.encaisse / r.prix * 100)} color={C.green} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ContratsCM({ onOuvrirContrat }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Scale}>Contrats & conformité — droit camerounais</SectionTitle>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.redSoft, border: `1px solid ${C.red}`, padding: "12px 14px", borderRadius: 10, fontSize: 13.5, color: C.steel }}>
        <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
        <span><b>Audit du modèle actuellement utilisé :</b> le contrat de réservation en circulation est un modèle français recyclé (Code de la construction et de l'habitation, loi de 1965 sur la copropriété, dispositif Pinel, notaires d'Orsay, dépôt en euros) pour une opération située à Yaoundé. En cas de litige avec un acquéreur, ces clauses sont inopérantes devant le juge camerounais et exposent le promoteur. La bibliothèque ci-dessous génère des contrats fondés sur les textes en vigueur au Cameroun.</span>
      </div>

      <Card>
        <SectionTitle icon={ClipboardCheck}>Mise en conformité du contrat de réservation (avant → après)</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {AUDIT_ANCIEN_MODELE.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", background: C.redSoft, color: C.steel }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Modèle français (à proscrire)</div>
                {a.avant}
              </div>
              <div style={{ padding: "10px 12px", background: C.greenSoft, color: C.steel }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Version conforme Cameroun</div>
                {a.apres}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={FolderOpen}>Bibliothèque de modèles</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {CONTRATS_CM.map(c => (
            <div key={c.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, display: "grid", gap: 8, alignContent: "start" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.steel }}>{c.titre}</div>
              <div style={{ fontSize: 12.5, color: C.steelSoft }}>{c.usage}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {c.bases.map(b => (
                  <span key={b} style={{ background: C.orangeSoft, color: C.orange, fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{b}</span>
                ))}
              </div>
              {c.genere
                ? <button style={{ ...btnPrimary, justifySelf: "start" }} onClick={onOuvrirContrat}><Scale size={14} /> Générer depuis un lot (T3-02)</button>
                : <span style={{ fontSize: 11.5, color: C.steelSoft }}>Génération automatique prévue en v1.1 — modèle rédigé avec le notaire du programme.</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 12 }}>
          Chaque contrat généré est pré-rempli depuis la grille des lots (identité du programme, lot, prix, échéancier) et versionné : plus aucun copier-coller de modèle étranger. Références principales : loi n°97/003 du 10/01/1997 (promotion immobilière), décret n°2007/1419/PM mod. n°2014/2378/PM, loi n°2001/020 (agents immobiliers), ordonnance n°74-1 (régime foncier et titre foncier), Actes uniformes OHADA. Les modèles restent soumis à validation par un notaire ou conseil juridique camerounais.
        </div>
      </Card>
    </div>
  );
}

/* ── ADMINISTRATION — Équipe & Paramètres ─────────────── */

const MODULES_PERMS = ["Chantiers", "Pointage", "Devis/Factures", "Stocks", "Paie", "Programmes/VEFA", "Rentabilité", "Paramètres"];

const ROLES_INIT = {
  "Super Admin":        [1, 1, 1, 1, 1, 1, 1, 1],
  "Directeur":          [1, 1, 1, 1, 1, 1, 1, 0],
  "Conducteur travaux": [1, 1, 1, 1, 0, 0, 0, 0],
  "Chef de chantier":   [1, 1, 0, 0, 0, 0, 0, 0],
  "Commercial":         [0, 0, 1, 0, 0, 1, 0, 0],
  "Comptable":          [0, 0, 1, 0, 1, 1, 1, 0],
  "Magasinier":         [0, 0, 0, 1, 0, 0, 0, 0],
};

const EQUIPE_INIT = [
  { id: 1, nom: "MOUGANG TANKWA Alain", role: "Super Admin", email: "a.mougang@tank-construction.cm", tel: "6 94 00 00 01", statut: "Actif", derniere: "Aujourd'hui 09:12", acces: "Email + 2FA" },
  { id: 2, nom: "ULRICH Thibaut", role: "Directeur", email: "u.thibaut@tank-construction.cm", tel: "6 94 00 00 02", statut: "Actif", derniere: "Aujourd'hui 08:47", acces: "Email + 2FA" },
  { id: 3, nom: "ETOGA Marcel", role: "Conducteur travaux", email: "m.etoga@tank-construction.cm", tel: "6 94 00 00 03", statut: "Actif", derniere: "Hier 17:38", acces: "Email" },
  { id: 4, nom: "NGONO Sylvie", role: "Chef de chantier", email: "—", tel: "6 94 00 00 04", statut: "Actif", derniere: "Aujourd'hui 07:42", acces: "Code PIN (terrain)" },
  { id: 5, nom: "BILOA Christelle", role: "Commercial", email: "c.biloa@tank-immo.cm", tel: "6 94 00 00 05", statut: "Actif", derniere: "Aujourd'hui 10:05", acces: "Email" },
  { id: 6, nom: "OWONA Francis", role: "Comptable", email: "f.owona@tank-construction.cm", tel: "6 94 00 00 06", statut: "Actif", derniere: "Hier 16:20", acces: "Email + 2FA" },
  { id: 7, nom: "MEKA Justine", role: "Magasinier", email: "—", tel: "6 94 00 00 07", statut: "Invitation envoyée", derniere: "—", acces: "Code PIN (dépôt)" },
];

const AUDIT_CONNEXIONS = [
  { qui: "NGONO Sylvie", quoi: "Connexion PIN — PWA terrain (hors-ligne, synchronisée)", quand: "Auj. 07:42" },
  { qui: "BILOA Christelle", quoi: "Réservation lot T2-14 créée (programme Mekoumbou City)", quand: "Auj. 10:07" },
  { qui: "OWONA Francis", quoi: "Export CSV comptabilité — juin 2026", quand: "Hier 16:31" },
  { qui: "ULRICH Thibaut", quoi: "Modification du devis DQE-2026-015 (lot 500 — enduits)", quand: "Hier 11:54" },
];

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer",
      background: on ? C.green : "#C6CFD8", position: "relative", transition: "background .2s", flexShrink: 0,
    }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left .2s" }} />
    </button>
  );
}

function EquipeAgence({ equipe, setEquipe, roles, setRoles }) {
  const [form, setForm] = useState({ nom: "", email: "", role: "Chef de chantier" });
  const [showInvite, setShowInvite] = useState(false);
  const roleColors = { "Super Admin": [C.redSoft, C.red], "Directeur": [C.orangeSoft, C.orange], "Conducteur travaux": [C.greenSoft, C.green], "Chef de chantier": [C.amberSoft, C.amber], "Commercial": ["#E4EDFB", "#2E6FD8"], "Comptable": [C.concrete, C.steelSoft], "Magasinier": [C.concrete, C.steelSoft] };

  const inviter = () => {
    if (!form.nom) return;
    setEquipe([...equipe, { id: equipe.length + 1, nom: form.nom, role: form.role, email: form.email || "—", tel: "—", statut: "Invitation envoyée", derniere: "—", acces: form.role === "Chef de chantier" || form.role === "Magasinier" ? "Code PIN" : "Email" }]);
    setShowInvite(false); setForm({ nom: "", email: "", role: "Chef de chantier" });
  };

  const basculerPerm = (role, i) =>
    setRoles({ ...roles, [role]: roles[role].map((v, j) => j === i ? (v ? 0 : 1) : v) });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={UserCog} action={
        <button style={btnPrimary} onClick={() => setShowInvite(!showInvite)}><Plus size={15} /> Inviter un collaborateur</button>
      }>Équipe de l'agence ({equipe.filter(e => e.statut === "Actif").length} actifs)</SectionTitle>

      {showInvite && (
        <Card style={{ borderLeft: `4px solid ${C.orange}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, alignItems: "end" }}>
            <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Nom complet
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} placeholder="Ex : ATANGANA Pierre" /></label>
            <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Email (facultatif si accès PIN)
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} placeholder="p.atangana@…" /></label>
            <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Rôle
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                {Object.keys(roles).filter(r => r !== "Super Admin").map(r => <option key={r}>{r}</option>)}
              </select></label>
            <button style={btnPrimary} onClick={inviter}><Send size={14} /> Envoyer l'invitation</button>
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
            Les profils terrain (chef de chantier, magasinier) reçoivent un code PIN par SMS pour la PWA — pas besoin d'email. Les autres reçoivent un lien d'activation par email.
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Collaborateur", "Rôle", "Contact", "Accès", "Dernière activité", "Statut"].map(h =>
                <th key={h} style={{ padding: "10px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {equipe.map((m, i) => {
              const [bg, fg] = roleColors[m.role] || [C.concrete, C.steelSoft];
              return (
                <tr key={m.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.steelMid, color: C.white, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {m.nom.split(" ").slice(0, 2).map(x => x[0]).join("")}
                      </div>
                      <b style={{ color: C.steel }}>{m.nom}</b>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{m.role}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: C.steelSoft }}>{m.email}<br />{m.tel}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: C.steelSoft }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{m.acces.includes("PIN") ? <KeyRound size={13} /> : <Lock size={13} />} {m.acces}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: C.steelSoft }}>{m.derniere}</td>
                  <td style={{ padding: "10px 12px" }}><StatutBadge s={m.statut === "Actif" ? "En cours" : "Envoyé"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 3fr) minmax(260px, 2fr)", gap: 20, alignItems: "start" }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 0" }}>
            <SectionTitle icon={ShieldAlert}>Matrice des permissions par rôle (cliquez pour modifier)</SectionTitle>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.concrete, textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase" }}>Rôle</th>
                  {MODULES_PERMS.map(mo => <th key={mo} style={{ padding: "8px 6px", fontSize: 10, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase", textAlign: "center" }}>{mo}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(roles).map(([role, perms]) => (
                  <tr key={role} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: C.steel, whiteSpace: "nowrap" }}>{role}</td>
                    {perms.map((p, i) => (
                      <td key={i} style={{ padding: "6px", textAlign: "center" }}>
                        <button onClick={() => role !== "Super Admin" && basculerPerm(role, i)} disabled={role === "Super Admin"} style={{
                          width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.line}`, cursor: role === "Super Admin" ? "default" : "pointer",
                          background: p ? C.greenSoft : C.white, color: p ? C.green : "#C6CFD8", fontWeight: 700,
                        }}>{p ? "✓" : "—"}</button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, padding: "10px 20px 16px" }}>
            Les permissions du Super Admin sont verrouillées. Toute modification est tracée au journal d'audit et prend effet à la prochaine connexion du collaborateur.
          </div>
        </Card>

        <Card>
          <SectionTitle icon={ClipboardCheck}>Journal d'audit (extrait)</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {AUDIT_CONNEXIONS.map((a, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${C.orange}`, background: C.concrete, borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}>
                <b style={{ color: C.steel }}>{a.qui}</b> <span style={{ color: C.steelSoft }}>· {a.quand}</span>
                <div style={{ color: C.steel }}>{a.quoi}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.steelSoft, marginTop: 10 }}>
            Historique complet conservé 12 mois : connexions, créations, modifications, suppressions et exports — exigence du CDC (§3.10 audit trail) et bonne pratique en cas de litige.
          </div>
        </Card>
      </div>
    </div>
  );
}

function ParametresAgence() {
  const [identite, setIdentite] = useState({
    raison: "TANK CONSTRUCTION / TANK'IMMO SAS", rccm: "RC/YAO/2021/M/270", niu: "M042400001234A",
    cpai: "Agrément CPAI N°0001", minhdu: "N°/E/2/MINHDU/SG/CJ du 03/07/08",
    adresse: "Rue 4022, Awae 3, Mvog-Mbi, Yaoundé", tel: "6 94 00 00 00", email: "contact@tank-construction.cm",
  });
  const [accent, setAccent] = useState(C.orange);
  const [fin, setFin] = useState({ tva: 19.25, joursPaie: 24, cnpsSal: 4.2, cnpsEmp: 11.95, seuilPreco: 40, prefDevis: "DEV-", prefFacture: "FAC-" });
  const [notifs, setNotifs] = useState({ rapport: true, stock: true, relances: true, incidents: true, hebdo: true, whatsapp: true });
  const [secu, setSecu] = useState({ deuxFA: true, pin: true, session: 8, backup: true });
  const [echeancier, setEcheancier] = useState(ECHEANCIER_VEFA.map(e => ({ etape: e.etape, pct: e.pct })));
  const totalEch = echeancier.reduce((s, e) => s + e.pct, 0);

  const palette = ["#F26B1D", "#2E6FD8", "#1F9D55", "#B4341F", "#7A4FBF", "#0E7C86"];
  const notifLabels = {
    rapport: "Rapport journalier reçu → notifier le conducteur de travaux",
    stock: "Stock sous seuil → alerter le magasinier + bon de commande suggéré",
    relances: "Relances automatiques factures impayées (J+15 / J+30)",
    incidents: "Incident gravité élevée → alerte immédiate direction",
    hebdo: "Rapport hebdomadaire PDF chaque lundi 7 h",
    whatsapp: "Relayer les notifications sur WhatsApp Business",
  };

  const lbl = { fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Settings}>Paramètres de l'agence</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card>
          <SectionTitle icon={Building2}>Identité de l'entreprise</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={lbl}>Raison sociale<input value={identite.raison} onChange={e => setIdentite({ ...identite, raison: e.target.value })} style={inp} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={lbl}>RCCM<input value={identite.rccm} onChange={e => setIdentite({ ...identite, rccm: e.target.value })} style={inp} /></label>
              <label style={lbl}>NIU<input value={identite.niu} onChange={e => setIdentite({ ...identite, niu: e.target.value })} style={inp} /></label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={lbl}>Agrément promoteur (CPAI)<input value={identite.cpai} onChange={e => setIdentite({ ...identite, cpai: e.target.value })} style={inp} /></label>
              <label style={lbl}>Agrément MINHDU<input value={identite.minhdu} onChange={e => setIdentite({ ...identite, minhdu: e.target.value })} style={inp} /></label>
            </div>
            <label style={lbl}>Adresse du siège<input value={identite.adresse} onChange={e => setIdentite({ ...identite, adresse: e.target.value })} style={inp} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={lbl}>Téléphone<input value={identite.tel} onChange={e => setIdentite({ ...identite, tel: e.target.value })} style={inp} /></label>
              <label style={lbl}>Email<input value={identite.email} onChange={e => setIdentite({ ...identite, email: e.target.value })} style={inp} /></label>
            </div>
            <div style={{ fontSize: 11.5, color: C.steelSoft }}>
              Ces informations alimentent automatiquement les en-têtes des devis, factures, contrats et rapports PDF — une seule source de vérité, plus de mentions obsolètes.
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Palette}>Marque & personnalisation</SectionTitle>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Couleur d'accent (interface + documents PDF)</div>
              <div style={{ display: "flex", gap: 8 }}>
                {palette.map(c => (
                  <button key={c} onClick={() => setAccent(c)} aria-label={c} style={{
                    width: 34, height: 34, borderRadius: 8, background: c, cursor: "pointer",
                    border: accent === c ? `3px solid ${C.steel}` : `1px solid ${C.line}`,
                  }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Aperçu — en-tête de document</div>
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: 6, background: `repeating-linear-gradient(45deg, ${accent} 0 10px, ${C.steel} 10px 20px)` }} />
                <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 1, color: C.steel }}>
                      {identite.raison.split("/")[0].trim().split(" ")[0]}<span style={{ color: accent }}>•</span>{identite.raison.split("/")[0].trim().split(" ").slice(1).join(" ") || "CONSTRUCTION"}
                    </div>
                    <div style={{ fontSize: 10, color: C.steelSoft }}>{identite.rccm} · {identite.niu}</div>
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: accent }}>DEVIS</span>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.steelSoft, marginTop: 6 }}>
                Logo importable (PNG/SVG) en production ; la couleur s'applique à toute la plateforme, au portail client et aux PDF.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={lbl}>Préfixe devis<input value={fin.prefDevis} onChange={e => setFin({ ...fin, prefDevis: e.target.value })} style={inp} /></label>
              <label style={lbl}>Préfixe factures<input value={fin.prefFacture} onChange={e => setFin({ ...fin, prefFacture: e.target.value })} style={inp} /></label>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={CircleDollarSign}>Paramètres financiers & paie</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={lbl}>TVA (%)<input type="number" step="0.05" value={fin.tva} onChange={e => setFin({ ...fin, tva: +e.target.value })} style={inp} /></label>
            <label style={lbl}>Jours ouvrés / mois (paie)<input type="number" value={fin.joursPaie} onChange={e => setFin({ ...fin, joursPaie: +e.target.value })} style={inp} /></label>
            <label style={lbl}>CNPS salarié (%)<input type="number" step="0.1" value={fin.cnpsSal} onChange={e => setFin({ ...fin, cnpsSal: +e.target.value })} style={inp} /></label>
            <label style={lbl}>CNPS employeur (%)<input type="number" step="0.05" value={fin.cnpsEmp} onChange={e => setFin({ ...fin, cnpsEmp: +e.target.value })} style={inp} /></label>
            <label style={lbl}>Seuil préco. bancaire (%)<input type="number" value={fin.seuilPreco} onChange={e => setFin({ ...fin, seuilPreco: +e.target.value })} style={inp} /></label>
            <label style={lbl}>Devise<input value="FCFA (XAF)" readOnly style={{ ...inp, background: C.concrete }} /></label>
          </div>
          <div style={{ fontSize: 11.5, color: C.steelSoft, marginTop: 8 }}>
            Les taux (TVA, CNPS) sont appliqués partout — devis, factures, bulletins — et historisés : un changement de taux ne réécrit jamais les documents déjà émis.
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Landmark}>Échéancier VEFA par défaut</SectionTitle>
          <div style={{ display: "grid", gap: 6 }}>
            {echeancier.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 74px", gap: 8, alignItems: "center", fontSize: 12.5 }}>
                <span style={{ color: C.steel }}>{e.etape}</span>
                <input type="number" min="0" max="60" value={e.pct}
                  onChange={ev => setEcheancier(echeancier.map((x, j) => j === i ? { ...x, pct: +ev.target.value } : x))}
                  style={{ ...inp, padding: "5px 8px", textAlign: "right" }} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, paddingTop: 8, fontSize: 13 }}>
              <b>Total</b>
              <b style={{ color: totalEch === 100 ? C.green : C.red }}>{totalEch} % {totalEch === 100 ? "✓" : "≠ 100 % — corrigez avant d'enregistrer"}</b>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Banknote}>Paiements & intégrations</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { n: "MTN Mobile Money (API MoMo)", k: "momo_prod_••••••••7f2a", on: true },
              { n: "Orange Money (API OM)", k: "om_prod_••••••••c91d", on: true },
              { n: "Virement bancaire (RIB affiché sur factures)", k: "CM21 10005 ••••• ••••• 34", on: true },
              { n: "Twilio SMS (codes PIN, alertes)", k: "AC••••••••••b8e3", on: true },
              { n: "WhatsApp Business API", k: "wa_••••••••4410", on: true },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: C.steelSoft, fontFamily: "monospace" }}>{s.k}</div>
                </div>
                <Toggle on={s.on} onChange={() => {}} />
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: C.steelSoft }}>Clés stockées chiffrées côté serveur, jamais exposées au navigateur — seuls les 4 derniers caractères sont affichés.</div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Bell}>Notifications automatiques</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(notifs).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, background: C.concrete, borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ flex: 1, fontSize: 13, color: C.steel }}>{notifLabels[k]}</span>
                <Toggle on={v} onChange={val => setNotifs({ ...notifs, [k]: val })} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Lock}>Sécurité & sauvegardes</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.concrete, borderRadius: 8, padding: "9px 12px" }}>
              <span style={{ flex: 1, fontSize: 13, color: C.steel }}>Double authentification (2FA) obligatoire — rôles Direction & Comptabilité</span>
              <Toggle on={secu.deuxFA} onChange={v => setSecu({ ...secu, deuxFA: v })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.concrete, borderRadius: 8, padding: "9px 12px" }}>
              <span style={{ flex: 1, fontSize: 13, color: C.steel }}>Connexion par code PIN pour les profils terrain (PWA hors-ligne)</span>
              <Toggle on={secu.pin} onChange={v => setSecu({ ...secu, pin: v })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.concrete, borderRadius: 8, padding: "9px 12px" }}>
              <span style={{ flex: 1, fontSize: 13, color: C.steel }}>Sauvegarde quotidienne chiffrée (base) + hebdomadaire (fichiers)</span>
              <Toggle on={secu.backup} onChange={v => setSecu({ ...secu, backup: v })} />
            </div>
            <label style={{ ...lbl, maxWidth: 220 }}>Expiration de session (heures)
              <input type="number" min="1" max="24" value={secu.session} onChange={e => setSecu({ ...secu, session: +e.target.value })} style={inp} /></label>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button style={btnGhost}>Annuler les modifications</button>
        <button style={btnPrimary}><CheckCircle2 size={15} /> Enregistrer les paramètres</button>
      </div>
    </div>
  );
}

/* ══ AMÉLIORATIONS MARCHÉ 1-10 ══════════════════════════ */

/* 1. Planning Gantt — chantier Bastos, 36 semaines (janv→sept 2026) */
const GANTT = {
  chantier: "Immeuble R+4 Bastos", semaines: 39, aujourdhui: 25, // sem. du 04/07
  mois: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept"],
  taches: [
    { nom: "Installation de chantier", lot: "Prépa", debut: 0, duree: 2, pct: 100 },
    { nom: "Terrassements", lot: "Gros œuvre", debut: 2, duree: 3, pct: 100, dep: "Installation de chantier" },
    { nom: "Fondations & longrines", lot: "Gros œuvre", debut: 5, duree: 5, pct: 100, dep: "Terrassements" },
    { nom: "Élévation RDC → R+2", lot: "Gros œuvre", debut: 10, duree: 14, pct: 80, dep: "Fondations & longrines" },
    { nom: "Élévation R+3 → R+4", lot: "Gros œuvre", debut: 24, duree: 6, pct: 8, dep: "Élévation RDC → R+2" },
    { nom: "Plomberie encastrée", lot: "Second œuvre", debut: 18, duree: 10, pct: 35 },
    { nom: "Électricité — gaines", lot: "Second œuvre", debut: 20, duree: 10, pct: 20 },
    { nom: "Charpente-couverture", lot: "Clos couvert", debut: 30, duree: 4, pct: 0, dep: "Élévation R+3 → R+4" },
    { nom: "Enduits & finitions", lot: "Finitions", debut: 32, duree: 6, pct: 0 },
    { nom: "Réception / OPR", lot: "Livraison", debut: 38, duree: 1, pct: 0, dep: "Enduits & finitions" },
  ],
};
const LOT_COLORS = { "Prépa": "#6E8093", "Gros œuvre": "#F26B1D", "Second œuvre": "#2E6FD8", "Clos couvert": "#7A4FBF", "Finitions": "#1F9D55", "Livraison": "#B4341F" };

function PlanningGantt() {
  const [taches, setTaches] = useState(GANTT.taches);
  const decaler = (i, d) => setTaches(taches.map((t, j) => j === i ? { ...t, debut: Math.max(0, Math.min(GANTT.semaines - t.duree, t.debut + d)) } : t));
  const W = 100 / GANTT.semaines;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Calendar} action={
        <span style={{ fontSize: 12, color: C.steelSoft }}>◀ ▶ décalent la tâche d'une semaine — les dépendances suivent en production</span>
      }>Planning Gantt — {GANTT.chantier}</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* entête mois */}
        <div style={{ display: "grid", gridTemplateColumns: "230px 1fr 70px", background: C.steel, color: C.white }}>
          <div style={{ padding: "8px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", fontSize: 12, letterSpacing: 0.6 }}>Tâche</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GANTT.mois.length}, 1fr)` }}>
            {GANTT.mois.map(m => <div key={m} style={{ padding: "8px 4px", fontSize: 11, textAlign: "center", borderLeft: "1px solid rgba(255,255,255,.15)" }}>{m}</div>)}
          </div>
          <div />
        </div>
        {taches.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "230px 1fr 70px", alignItems: "center", borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.steel }}>{t.nom}</div>
              <div style={{ fontSize: 10.5, color: C.steelSoft }}>{t.lot}{t.dep ? ` · après : ${t.dep}` : ""}</div>
            </div>
            <div style={{ position: "relative", height: 34 }}>
              {/* trait aujourd'hui */}
              <div style={{ position: "absolute", left: `${GANTT.aujourdhui * W}%`, top: 0, bottom: 0, width: 2, background: C.red, zIndex: 2 }} />
              <div title={`${t.pct} %`} style={{
                position: "absolute", left: `${t.debut * W}%`, width: `${t.duree * W}%`, top: 7, height: 20,
                background: `${LOT_COLORS[t.lot]}33`, border: `1px solid ${LOT_COLORS[t.lot]}`, borderRadius: 5, overflow: "hidden",
              }}>
                <div style={{ width: `${t.pct}%`, height: "100%", background: LOT_COLORS[t.lot] }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              <button onClick={() => decaler(i, -1)} style={{ ...btnGhost, padding: "2px 7px" }}>◀</button>
              <button onClick={() => decaler(i, 1)} style={{ ...btnGhost, padding: "2px 7px" }}>▶</button>
            </div>
          </div>
        ))}
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.steelSoft }}>
        {Object.entries(LOT_COLORS).map(([l, c]) => (
          <span key={l}><span style={{ display: "inline-block", width: 10, height: 10, background: c, borderRadius: 3, marginRight: 4 }} />{l}</span>
        ))}
        <span><span style={{ display: "inline-block", width: 2, height: 12, background: C.red, marginRight: 4, verticalAlign: -2 }} />Aujourd'hui</span>
      </div>
      <div style={{ fontSize: 12, color: C.steelSoft }}>
        Remplissage plein = avancement réel (alimenté par les rapports terrain). En production : glisser-déposer, dépendances recalées automatiquement, charge par équipe, export PDF réunion de chantier.
      </div>
    </div>
  );
}

/* 2. Réserves & OPR */
const RESERVES_INIT = [
  { id: 1, num: "R-001", loc: "Séjour appt 2A — mur est", lot: "Enduits", entreprise: "Tank (interne)", desc: "Fissuration enduit, reprise à prévoir avant peinture", statut: "Ouverte", date: "28/06/2026", echeance: "12/07/2026", epingle: "Plan RDC #2" },
    { id: 2, num: "R-002", loc: "SDB appt 1B", lot: "Plomberie", entreprise: "AquaPlomb CM", desc: "Évacuation douche — pente insuffisante, eau stagnante", statut: "Ouverte", date: "30/06/2026", echeance: "10/07/2026", epingle: "—" },
  { id: 3, num: "R-003", loc: "Cage d'escalier RDC", lot: "Électricité", entreprise: "ElecBat Sarl", desc: "Boîtier DCL non fixé, câble apparent", statut: "Levée", date: "22/06/2026", echeance: "—", epingle: "Photo #1" },
  { id: 4, num: "R-004", loc: "Façade sud R+1", lot: "Gros œuvre", entreprise: "Tank (interne)", desc: "Balèvre sur voile béton > 5 mm, ragréage requis", statut: "Levée", date: "15/06/2026", echeance: "—", epingle: "—" },
];

function ReservesTab({ reserves, setReserves }) {
  const ouvertes = reserves.filter(r => r.statut === "Ouverte").length;
  const lever = (id) => setReserves(reserves.map(r => r.id === id ? { ...r, statut: r.statut === "Ouverte" ? "Levée" : "Ouverte" } : r));
  return (
    <Card>
      <SectionTitle icon={ClipboardCheck} action={
        <button style={btnPrimary}><Printer size={14} /> Générer le PV d'OPR</button>
      }>Réserves & OPR — {ouvertes} ouverte{ouvertes > 1 ? "s" : ""} / {reserves.length}</SectionTitle>
      <div style={{ fontSize: 12.5, color: C.steelSoft, marginBottom: 12 }}>
        Chaque réserve peut naître d'une épingle sur plan ou photo (tournée de pré-réception tablette en main). Le PV d'OPR liste les réserves par lot et par entreprise, avec délai contractuel de levée ; les réserves levées sont contresignées contradictoirement.
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {reserves.map(r => (
          <div key={r.id} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${r.statut === "Ouverte" ? C.red : C.green}`, borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.steel }}>{r.num} — {r.loc}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.steelSoft }}>{r.lot} · {r.entreprise}</span>
                <button onClick={() => lever(r.id)} style={{
                  background: r.statut === "Ouverte" ? C.redSoft : C.greenSoft, color: r.statut === "Ouverte" ? C.red : C.green,
                  border: "none", borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: 11, cursor: "pointer", textTransform: "uppercase",
                }}>{r.statut === "Ouverte" ? "Ouverte — lever ?" : "✓ Levée"}</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.steel, marginTop: 5 }}>{r.desc}</div>
            <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 5 }}>
              Constatée le {r.date}{r.statut === "Ouverte" ? ` · à lever avant le ${r.echeance}` : ""} · Origine : {r.epingle}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* 3. Bibliothèque de prix camerounaise (extrait — prix issus des DQE réels) */
const BPU_CM = [
  { cat: "Gros œuvre", items: [
    { ref: "GO-101", des: "Béton dosé 350 kg/m³ pour béton armé", u: "m³", pu: 82598 },
    { ref: "GO-102", des: "Béton de propreté dosé 150 kg/m³", u: "m³", pu: 55887 },
    { ref: "GO-103", des: "Béton pour dallage de sol ép. 8 cm", u: "m³", pu: 83353 },
    { ref: "GO-104", des: "Coffrage lisse et soigné", u: "m²", pu: 3113 },
    { ref: "GO-105", des: "Acier HA façonnage-pose", u: "kg", pu: 898 },
    { ref: "GO-106", des: "Parpaings creux 10×20×40 hourdés", u: "m²", pu: 7100 },
    { ref: "GO-107", des: "Parpaings creux 15×20×40 hourdés", u: "m²", pu: 8747 },
    { ref: "GO-108", des: "Parpaings 20×20×40 bourrés (soubassement)", u: "m²", pu: 14497 },
    { ref: "GO-109", des: "Plancher dalle à corps creux", u: "m²", pu: 22805 },
  ]},
  { cat: "Terrassements", items: [
    { ref: "TE-201", des: "Terrassement pleine masse y/c évacuation", u: "m³", pu: 3647 },
    { ref: "TE-202", des: "Fouilles en puits", u: "m³", pu: 3230 },
    { ref: "TE-203", des: "Fouilles en rigole 0,6×1 m", u: "ml", pu: 1146 },
    { ref: "TE-204", des: "Remblais de fondations compactés", u: "m³", pu: 6106 },
  ]},
  { cat: "Second œuvre", items: [
    { ref: "SO-301", des: "Enduits muraux ép. 1,5 cm (gobetis+corps+finition)", u: "m²", pu: 2365 },
    { ref: "SO-302", des: "Carrelage grès cérame 60×60 fourniture-pose", u: "m²", pu: 18500 },
    { ref: "SO-303", des: "Sols grès cérame standard", u: "m²", pu: 11000 },
    { ref: "SO-304", des: "Faïence murale", u: "m²", pu: 8000 },
    { ref: "SO-305", des: "Plafond contreplaqué 4 mm", u: "m²", pu: 8000 },
    { ref: "SO-306", des: "Peinture int./ext. + vernissage (2 couches)", u: "m²", pu: 2500 },
  ]},
  { cat: "Charpente-couverture", items: [
    { ref: "CC-401", des: "Ferme bois moisé traité xylamon", u: "m³", pu: 135448 },
    { ref: "CC-402", des: "Pannes bois dur 4×8", u: "m³", pu: 135448 },
    { ref: "CC-403", des: "Tôles bac alu 6/10ᵉ posées", u: "m²", pu: 4785 },
    { ref: "CC-404", des: "Étanchéité chéneau y/c forme de pente", u: "m²", pu: 17921 },
  ]},
  { cat: "Menuiserie & métallerie", items: [
    { ref: "ME-501", des: "Porte pleine bois 80", u: "u", pu: 80000 },
    { ref: "ME-502", des: "Porte pleine bois 70", u: "u", pu: 60000 },
    { ref: "ME-503", des: "Porte métallique", u: "u", pu: 180000 },
    { ref: "ME-504", des: "Grille de fenêtre métallique", u: "m²", pu: 62500 },
    { ref: "ME-505", des: "Grille portail", u: "u", pu: 550000 },
  ]},
  { cat: "Plomberie & électricité", items: [
    { ref: "PL-601", des: "Amenée d'eau potable (ensemble)", u: "ens", pu: 1000000 },
    { ref: "PL-602", des: "Évacuation EU+EV (ensemble)", u: "ens", pu: 700000 },
    { ref: "PL-603", des: "Appareillage sanitaire (ensemble logement)", u: "ens", pu: 2800000 },
    { ref: "EL-701", des: "Câblage courants forts/faibles + appareillage (logement)", u: "ens", pu: 2500000 },
  ]},
];
const COEF_REGION = { "Yaoundé": 1, "Douala": 1.06, "Kribi": 1.09, "Bafoussam": 1.04, "Garoua": 1.15 };

/* 4. Import DPGF (simulation) */
const DPGF_DEMO = {
  fichier: "DPGF_Bloc_administratif_Mfou.xlsx", maitre: "Commune de Mfou (ARMP)",
  lignes: [
    { n: "2.01", des: "Terrassement en pleine masse", u: "m³", q: 210, match: "TE-201", pu: 3647 },
    { n: "3.04", des: "Béton armé dosé à 350kg/m3 pour semelles", u: "m³", q: 18.4, match: "GO-101", pu: 82598 },
    { n: "3.07", des: "Aciers HA toutes sections", u: "kg", q: 1620, match: "GO-105", pu: 898 },
    { n: "5.02", des: "Maçonnerie agglos 15x20x40", u: "m²", q: 412, match: "GO-107", pu: 8747 },
    { n: "7.01", des: "Enduit ciment 2 faces", u: "m²", q: 890, match: "SO-301", pu: 2365 },
    { n: "9.03", des: "Couverture bac alu 6/10e", u: "m²", q: 265, match: "CC-403", pu: 4785 },
  ],
};

/* 6. Situations de travaux client — marché Bastos 185 M HT */
const SITUATIONS_INIT = [
  { n: 1, mois: "Février 2026", cumulPct: 12, statut: "Payée" },
  { n: 2, mois: "Mars 2026", cumulPct: 25, statut: "Payée" },
  { n: 3, mois: "Avril 2026", cumulPct: 40, statut: "Payée" },
  { n: 4, mois: "Mai 2026", cumulPct: 52, statut: "Payée" },
  { n: 5, mois: "Juin 2026", cumulPct: 61, statut: "Envoyée" },
];
const MARCHE_BASTOS = { montantHT: 185000000, retenuePct: 10, chantier: "Immeuble R+4 Bastos", client: "SCI Horizon" };

function SituationsTab() {
  const M = MARCHE_BASTOS;
  let prev = 0;
  const rows = SITUATIONS_INIT.map(s => {
    const cumulHT = Math.round(M.montantHT * s.cumulPct / 100);
    const periodeHT = cumulHT - Math.round(M.montantHT * prev / 100);
    prev = s.cumulPct;
    const retenue = Math.round(periodeHT * M.retenuePct / 100);
    const netHT = periodeHT - retenue;
    const tva = Math.round(netHT * TVA);
    return { ...s, periodeHT, cumulHT, retenue, netTTC: netHT + tva };
  });
  const retenuesCumul = rows.reduce((s, r) => s + r.retenue, 0);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: C.steel }}>
        <span>Marché : <b>{M.chantier}</b> — {M.client}</span>
        <span>Montant HT : <b>{fcfa(M.montantHT)}</b></span>
        <span>Retenue de garantie : <b>{M.retenuePct} %</b> (cumul retenu : <b style={{ color: C.orange }}>{fcfa(retenuesCumul)}</b>, libérable à réception définitive)</span>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Situation", "Avancement cumulé", "Travaux de la période HT", "Retenue 10 %", "Net à payer TTC", "Statut", "PDF"].map(h =>
                <th key={h} style={{ padding: "9px 12px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, fontSize: 11.5 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.n} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                <td style={{ padding: "9px 12px", fontWeight: 700, color: C.steel }}>Situation n°{r.n} — {r.mois}</td>
                <td style={{ padding: "9px 12px" }}><b>{r.cumulPct} %</b> ({fcfa(r.cumulHT)})</td>
                <td style={{ padding: "9px 12px" }}>{fcfa(r.periodeHT)}</td>
                <td style={{ padding: "9px 12px", color: C.orange }}>−{fcfa(r.retenue)}</td>
                <td style={{ padding: "9px 12px", fontWeight: 700 }}>{fcfa(r.netTTC)}</td>
                <td style={{ padding: "9px 12px" }}><StatutBadge s={r.statut} /></td>
                <td style={{ padding: "7px 12px" }}><button style={{ ...btnGhost, padding: "4px 9px", color: C.orange, borderColor: C.orangeSoft }}><Printer size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 12, color: C.steelSoft }}>
        L'avancement cumulé est proposé automatiquement depuis les tâches du chantier, puis validé contradictoirement. En fin de marché : décompte général définitif (DGD) et libération de la retenue de garantie 12 mois après réception (ou mainlevée contre caution bancaire).
      </div>
    </div>
  );
}

/* 8. Prédictions IA */
const PREDICTIONS = [
  { titre: "Risque de retard — Entrepôt Nsam", conf: 82, gravite: "haute", detail: "Avancement réel 86 % vs 100 % prévu ; météo : 78 % de pluie samedi. Livraison projetée : +21 jours (20/06 → 11/07). Pénalités contractuelles estimées : 1 900 000 F.", action: "Proposer avenant de délai + renfort 2 maçons (dispo bloc B)" },
  { titre: "Rupture de stock — Fer Ø12", conf: 91, gravite: "haute", detail: "Stock 96 barres, seuil 120, consommation moyenne 8,7 barres/jour (élévation R+3) → rupture estimée le 15/07. Délai Quincaillerie du Mfoundi : 5 jours.", action: "Bon de commande 150 barres à émettre avant le 10/07 (pré-rempli)" },
  { titre: "Dépassement budgétaire probable — Nsam", conf: 87, gravite: "moyenne", detail: "93 % du budget consommé pour 86 % d'avancement. Coût final projeté : 101,3 M vs 95 M budgétés (+6,3 M, marge −6,6 pts).", action: "Revue des déboursés lot dallage + geler les achats non engagés" },
  { titre: "Trésorerie — appel de fonds n°4 Mekoumbou", conf: 76, gravite: "opportunité", detail: "Jalon dalle R+2 validé : appel 10 % émissible vers 41 acquéreurs ≈ 96 M attendus sous 15 jours (taux de paiement historique J+15 : 76 %).", action: "Émettre l'appel aujourd'hui pour couvrir la paie du 30/07" },
  { titre: "Absentéisme récurrent le lundi", conf: 68, gravite: "faible", detail: "Pointages sur 8 semaines : +18 % d'absences le lundi (corrélation jours de pluie +32 %). Impact : ~2,5 jours-homme/semaine.", action: "Planifier les coulages mardi-jeudi ; prime d'assiduité à l'étude" },
];

function PredictionsIA() {
  const gcol = { haute: [C.redSoft, C.red], moyenne: [C.amberSoft, C.amber], faible: [C.concrete, C.steelSoft], "opportunité": [C.greenSoft, C.green] };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Sparkles}>Prédictions & alertes IA</SectionTitle>
      <div style={{ fontSize: 13, color: C.steelSoft }}>
        Le moteur croise pointages, météo, stocks, avancement et historique de paiement pour anticiper au lieu de constater. Chaque prédiction indique son niveau de confiance et propose une action en un clic.
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {PREDICTIONS.map((p, i) => {
          const [bg, fg] = gcol[p.gravite];
          return (
            <Card key={i} style={{ borderLeft: `4px solid ${fg}`, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <b style={{ fontSize: 14.5, color: C.steel }}>{p.titre}</b>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ background: bg, color: fg, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase" }}>{p.gravite}</span>
                  <span style={{ fontSize: 12, color: C.steelSoft }}>confiance <b style={{ color: C.steel }}>{p.conf} %</b></span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.steel }}>{p.detail}</div>
              <button style={{ ...btnGhost, justifySelf: "start", color: C.orange, borderColor: C.orangeSoft, fontSize: 12.5 }}>
                <Sparkles size={14} /> {p.action}
              </button>
            </Card>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: C.steelSoft }}>
        Prédictions statistiques indicatives — la décision reste humaine. Modèles entraînés sur les données de l'entreprise uniquement (aucune donnée partagée entre clients de la plateforme).
      </div>
    </div>
  );
}

/* 9. Exports comptables SYSCOHADA */
const EXPORTS_COMPTA = [
  { nom: "Journal des ventes (situations, factures, appels de fonds)", fmt: "CSV / XLSX", plan: "Comptes 70x — SYSCOHADA révisé" },
  { nom: "Journal des achats (fournisseurs, sous-traitants)", fmt: "CSV / XLSX", plan: "Comptes 60x/40x" },
  { nom: "Écritures de paie & charges CNPS", fmt: "CSV", plan: "Comptes 66x/43x" },
  { nom: "Grand livre & balance par chantier (comptabilité analytique)", fmt: "XLSX", plan: "Axes analytiques = chantiers/programmes" },
  { nom: "État TVA collectée / déductible (déclaration DGI)", fmt: "PDF / XLSX", plan: "TVA 19,25 %" },
];

/* 10. Vitrine publique & annuaire artisans */
const ARTISANS = [
  { nom: "ElecBat Sarl", metier: "Électricité", ville: "Yaoundé", note: 4.8, chantiers: 15, verifie: true },
  { nom: "AquaPlomb CM", metier: "Plomberie sanitaire", ville: "Yaoundé", note: 4.2, chantiers: 9, verifie: true },
  { nom: "Metal Pro CM", metier: "Charpente métallique", ville: "Douala", note: 3.9, chantiers: 7, verifie: true },
  { nom: "PeintDeco 237", metier: "Peinture-décoration", ville: "Yaoundé", note: 4.5, chantiers: 12, verifie: false },
];

function Vitrine({ lots }) {
  const [publiee, setPubliee] = useState(true);
  const dispo = lots.filter(l => l.statut === "Disponible").length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Store} action={
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.steelSoft }}>
          Vitrine publiée <Toggle on={publiee} onChange={setPubliee} />
        </label>
      }>Vitrine publique & annuaire</SectionTitle>
      <div style={{ fontSize: 12.5, color: C.steelSoft }}>
        Page publique auto-générée depuis la grille des lots — partageable sur WhatsApp/Facebook (canaux n°1 de la vente immobilière au Cameroun) : vitrine.tank-immo.cm/mekoumbou-city. Aperçu :
      </div>

      <Card style={{ padding: 0, overflow: "hidden", opacity: publiee ? 1 : .45 }}>
        <div style={{ background: `linear-gradient(120deg, ${C.steel}, ${C.steelMid})`, color: C.white, padding: "28px 24px" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.orange, fontWeight: 700 }}>TANK'IMMO SAS — PROMOTEUR AGRÉÉ CPAI N°0001</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.05, marginTop: 6 }}>
            Mekoumbou City<br /><span style={{ color: C.orange }}>100 logements neufs à Yaoundé III</span>
          </div>
          <div style={{ fontSize: 13.5, marginTop: 8, color: "#C9D4DE" }}>
            Du studio T1 au grand T5 · dès {fcfa(8304000)} · paiement échelonné selon l'avancement du chantier (VEFA) · {dispo} logements encore disponibles
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button style={btnPrimary}>Choisir mon logement</button>
            <button style={{ ...btnGhost, color: C.white, borderColor: "#5A6B7D" }}><MessageCircle size={14} /> WhatsApp commercial</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 0 }}>
          {PROG.typologies.map(t => (
            <div key={t.code} style={{ padding: 14, borderTop: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: C.steel }}>{t.code}</div>
              <div style={{ fontSize: 11.5, color: C.steelSoft }}>{t.surf} m²</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginTop: 2 }}>{(t.prix / 1e6).toFixed(1).replace(".", ",")} M FCFA</div>
              <div style={{ fontSize: 10.5, color: lots.filter(l => l.code === t.code && l.statut === "Disponible").length ? C.green : C.red, fontWeight: 700 }}>
                {lots.filter(l => l.code === t.code && l.statut === "Disponible").length || "Épuisé —"} dispo.
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={UserCog}>Annuaire d'artisans qualifiés (réseau du promoteur)</SectionTitle>
        <div style={{ fontSize: 12.5, color: C.steelSoft, marginBottom: 10 }}>
          Promesse de la plaquette Kribi Land : « mise en relation avec un réseau de prestataires ». Les notes proviennent des évaluations réelles de fin de chantier (module Sous-traitance) — pas d'auto-déclaration. Badge « Vérifié » = agrément + assurance contrôlés.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {ARTISANS.map((a, i) => (
            <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 14, color: C.steel }}>{a.nom}</b>
                {a.verifie && <span style={{ background: C.greenSoft, color: C.green, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>✓ VÉRIFIÉ</span>}
              </div>
              <div style={{ fontSize: 12, color: C.steelSoft }}>{a.metier} · {a.ville} · {a.chantiers} chantiers via la plateforme</div>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill={s <= Math.round(a.note) ? C.orange : "none"} color={s <= Math.round(a.note) ? C.orange : C.line} />)}
                <b style={{ fontSize: 12.5, marginLeft: 4, color: C.steel }}>{a.note.toFixed(1)}</b>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Styles utilitaires ───────────────────────────────── */

const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: C.orange, color: C.white, border: "none",
  borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
const btnGhost = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "transparent", color: C.steelSoft, border: `1px solid ${C.line}`,
  borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
const inp = {
  border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px",
  fontSize: 14, fontFamily: "inherit", outline: "none", color: C.steel,
};
const miniLabel = { fontSize: 11, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 };

/* ── Application ──────────────────────────────────────── */

/* ── Page de connexion ────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("email"); // email | pin | client
  const [etape, setEtape] = useState(1);     // email : 1 identifiants → 2 code 2FA
  const [pin, setPin] = useState("");
  const [code2fa, setCode2fa] = useState("");

  const PROFILS = {
    admin: { nom: "A. Mougang Tankwa", role: "Super Admin", initiales: "AT", page: "dashboard" },
    terrain: { nom: "NGONO Sylvie", role: "Chef de chantier", initiales: "NS", page: "pointage" },
    client: { nom: "SCI Horizon / M. Moukoumbou", role: "Client", initiales: "CL", page: "portail" },
  };

  const tape = (d) => {
    const p = (pin + d).slice(0, 6);
    setPin(p);
    if (p.length === 6) setTimeout(() => onLogin(PROFILS.terrain), 350);
  };

  const champs = { ...inp, width: "100%" };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center", padding: 20,
      background: `linear-gradient(150deg, ${C.steel} 0%, ${C.steelMid} 60%, #38495B 100%)`,
      fontFamily: "'Barlow', system-ui, sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap');`}</style>
      <div style={{ width: "min(420px, 100%)" }}>
        {/* Marque */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: 1.5, color: C.white }}>
            TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION
          </div>
          <div style={{ fontSize: 12, color: "#9FB0C1", letterSpacing: 0.6 }}>Gestion BTP & Promotion immobilière — Cameroun</div>
        </div>

        <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.4)" }}>
          <Hazard />
          {/* Onglets profil */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${C.line}` }}>
            {[["email", "Bureau", Lock], ["pin", "Terrain (PIN)", KeyRound], ["client", "Espace client", Eye]].map(([m, l, I]) => (
              <button key={m} onClick={() => { setMode(m); setEtape(1); setPin(""); }} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "12px 6px", background: mode === m ? C.white : C.concrete, border: "none",
                borderBottom: `3px solid ${mode === m ? C.orange : "transparent"}`, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 700, color: mode === m ? C.steel : C.steelSoft,
              }}><I size={16} color={mode === m ? C.orange : C.steelSoft} />{l}</button>
            ))}
          </div>

          <div style={{ padding: 24, display: "grid", gap: 12 }}>
            {mode === "email" && etape === 1 && (
              <>
                <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Email professionnel
                  <input style={champs} placeholder="prenom.nom@tank-construction.cm" defaultValue="a.mougang@tank-construction.cm" /></label>
                <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Mot de passe
                  <input type="password" style={champs} defaultValue="••••••••••" /></label>
                <button style={{ ...btnPrimary, justifyContent: "center", padding: "11px" }} onClick={() => setEtape(2)}>Se connecter</button>
                <button style={{ background: "none", border: "none", color: C.steelSoft, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Mot de passe oublié ?</button>
              </>
            )}
            {mode === "email" && etape === 2 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.steel }}>
                  <ShieldAlert size={16} color={C.orange} /> Double authentification — code envoyé par SMS au +237 6•• •• •• 01
                </div>
                <input style={{ ...champs, textAlign: "center", fontSize: 22, letterSpacing: 8, fontFamily: "'Barlow Condensed', sans-serif" }}
                  maxLength={6} placeholder="––––––" value={code2fa}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode2fa(v);
                    if (v.length === 6) setTimeout(() => onLogin(PROFILS.admin), 350);
                  }} autoFocus />
                <div style={{ fontSize: 11.5, color: C.steelSoft, textAlign: "center" }}>Saisissez 6 chiffres quelconques pour la démo · Renvoyer le code (45 s)</div>
              </>
            )}

            {mode === "pin" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: C.steel }}>
                  <WifiOff size={15} color={C.amber} /> Fonctionne hors-ligne — le PIN est vérifié localement, les données se synchronisent à la reconnexion.
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.steelSoft}`, background: i < pin.length ? C.orange : "transparent", borderColor: i < pin.length ? C.orange : C.line }} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((d, i) => (
                    <button key={i} disabled={d === ""} onClick={() => d === "⌫" ? setPin(pin.slice(0, -1)) : tape(String(d))} style={{
                      padding: "13px 0", fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif",
                      background: d === "" ? "transparent" : C.concrete, color: C.steel, border: "none", borderRadius: 10,
                      cursor: d === "" ? "default" : "pointer",
                    }}>{d}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: C.steelSoft, textAlign: "center" }}>6 chiffres quelconques pour la démo (profil chef de chantier)</div>
              </>
            )}

            {mode === "client" && (
              <>
                <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Téléphone ou email
                  <input style={champs} placeholder="6 •• •• •• ••" defaultValue="6 77 88 99 00" /></label>
                <label style={{ fontSize: 12, color: C.steelSoft, display: "grid", gap: 4 }}>Code d'accès (reçu par SMS/WhatsApp)
                  <input style={champs} placeholder="Ex : HZN-2026" defaultValue="HZN-2026" /></label>
                <button style={{ ...btnPrimary, justifyContent: "center", padding: "11px" }} onClick={() => onLogin(PROFILS.client)}>Accéder à mon espace</button>
                <div style={{ fontSize: 11.5, color: C.steelSoft }}>Maîtres d'ouvrage et acquéreurs : votre code est envoyé automatiquement à la signature du contrat.</div>
              </>
            )}
          </div>

          {/* Raccourcis démo */}
          <div style={{ borderTop: `1px dashed ${C.line}`, padding: "10px 24px 16px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.steelSoft }}>Démo rapide :</span>
            {Object.entries(PROFILS).map(([k, p]) => (
              <button key={k} onClick={() => onLogin(p)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11.5 }}>{p.role}</button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#8FA0B2", marginTop: 14 }}>
          © 2026 TANK'IMMO SAS — RCCM RC/YAO/2021/M/270 · Plateforme développée par With Digital Consulting
        </div>
      </div>
    </div>
  );
}

export default function TankConstruction() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chantierSel, setChantierSel] = useState(null);
  const [annots, setAnnots] = useState(ANNOTS_INIT);
  const [ouvriers, setOuvriers] = useState(OUVRIERS_INIT);
  const [devis, setDevis] = useState(DEVIS_INIT);
  const [stock, setStock] = useState(STOCK_INIT);
  const [incidents, setIncidents] = useState(INCIDENTS_INIT);
  const [checklist, setChecklist] = useState(CHECKLIST_INIT);
  const [engins, setEngins] = useState(ENGINS_INIT);
  const [messages, setMessages] = useState(MESSAGES_INIT);
  const [lots, setLots] = useState(LOTS_INIT);
  const [contratDemo, setContratDemo] = useState(null);
  const [equipe, setEquipe] = useState(EQUIPE_INIT);
  const [roles, setRoles] = useState(ROLES_INIT);
  const chantiers = CHANTIERS_INIT;
  const factures = FACTURES_INIT;

  const navGroups = [
    { label: "Pilotage", items: [
      { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { id: "rentabilite", label: "Rentabilité & Trésorerie", icon: Wallet },
      { id: "predictions", label: "Prédictions IA", icon: Sparkles },
    ]},
    { label: "Opérations", items: [
      { id: "chantiers", label: "Chantiers", icon: HardHat },
      { id: "planning", label: "Planning Gantt", icon: Calendar },
      { id: "pointage", label: "Équipes & Pointage", icon: Users },
      { id: "incidents", label: "Incidents & Sécurité", icon: ShieldAlert },
      { id: "materiel", label: "Matériel & Engins", icon: Wrench },
      { id: "meteo", label: "Météo chantier", icon: CloudSun },
    ]},
    { label: "Commercial", items: [
      { id: "devis", label: "Devis & Factures", icon: FileText },
      { id: "ao", label: "Appels d'offres & BPU", icon: Gavel },
      { id: "portail", label: "Portail client", icon: Eye },
      { id: "vitrine", label: "Vitrine & Annuaire", icon: Store },
    ]},
    { label: "Promotion immobilière", items: [
      { id: "programmes", label: "Programmes & Lots", icon: Building2 },
      { id: "vefa", label: "VEFA & Appels de fonds", icon: Landmark },
      { id: "contrats", label: "Contrats (droit CM)", icon: Scale },
    ]},
    { label: "Ressources", items: [
      { id: "stocks", label: "Stocks", icon: Package },
      { id: "fournisseurs", label: "Fournisseurs", icon: Truck },
      { id: "soustraitance", label: "Sous-traitance", icon: Gavel },
      { id: "paie", label: "Paie & CNPS", icon: Banknote },
      { id: "messagerie", label: "Messagerie", icon: MessageCircle },
    ]},
    { label: "Administration", items: [
      { id: "equipe", label: "Équipe de l'agence", icon: UserCog },
      { id: "parametres", label: "Paramètres", icon: Settings },
    ]},
  ];
  const nav = navGroups.flatMap(g => g.items);

  const go = (p) => { setPage(p); setChantierSel(null); setMenuOpen(false); };

  const alertCount = useMemo(() =>
    chantiers.filter(c => c.statut === "En retard").length +
    stock.filter(m => m.stock < m.seuil).length +
    factures.filter(f => f.statut === "Impayée").length +
    incidents.filter(i => i.statut === "En cours").length,
    [stock, incidents]);

  if (!user) return <LoginPage onLogin={(u) => { setUser(u); setPage(u.page); }} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.concrete, fontFamily: "'Barlow', system-ui, sans-serif", color: C.steel }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.orange}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: 232, background: C.steel, color: C.white, padding: "0 0 20px",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: menuOpen ? "fixed" : "sticky", top: 0, height: "100vh", zIndex: 40,
        left: 0,
        transform: undefined,
      }} className="sidebar">
        <div style={{ padding: "22px 20px 16px" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}>
            TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION
          </div>
          <div style={{ fontSize: 11, color: "#8FA0B2", marginTop: 4, letterSpacing: 0.5 }}>Gestion BTP — Cameroun</div>
        </div>
        <Hazard />
        <nav style={{ marginTop: 10, display: "grid", gap: 2, padding: "0 10px", overflowY: "auto", flex: 1 }}>
          {navGroups.map(g => (
            <div key={g.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6E8093", textTransform: "uppercase", letterSpacing: 1.2, padding: "8px 14px 4px" }}>{g.label}</div>
              {g.items.map(n => (
                <button key={n.id} onClick={() => go(n.id)} style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  background: page === n.id ? C.steelMid : "transparent",
                  color: page === n.id ? C.white : "#B7C3CF",
                  border: "none", borderLeft: `3px solid ${page === n.id ? C.orange : "transparent"}`,
                  borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}>
                  <n.icon size={17} /> {n.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "16px 20px", fontSize: 12, color: "#8FA0B2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.orange, display: "grid", placeItems: "center", fontWeight: 700, color: C.white }}>{user.initiales}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.white, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nom}</div>
              <div>{user.role}</div>
            </div>
            <button onClick={() => setUser(null)} title="Se déconnecter" style={{ background: "none", border: `1px solid ${C.steelSoft}`, color: "#B7C3CF", borderRadius: 8, padding: "5px 8px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
              Quitter
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          background: C.white, borderBottom: `1px solid ${C.line}`,
          padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 30,
        }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            {nav.find(n => n.id === page)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => go("dashboard")}>
              <Bell size={20} color={C.steelSoft} />
              {alertCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -7, background: C.red, color: C.white, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 5px" }}>{alertCount}</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: C.steelSoft }}>Sam. 4 juillet 2026</span>
          </div>
        </header>

        <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
          {page === "dashboard" && <Dashboard chantiers={chantiers} ouvriers={ouvriers} factures={factures} stock={stock} go={go} />}
          {page === "chantiers" && <Chantiers chantiers={chantiers} selected={chantierSel} setSelected={setChantierSel} annots={annots} setAnnots={setAnnots} />}
          {page === "pointage" && <Pointage ouvriers={ouvriers} setOuvriers={setOuvriers} />}
          {page === "devis" && <DevisFactures devis={devis} setDevis={setDevis} factures={factures} dqes={DQE_INIT} />}
          {page === "stocks" && <Stocks stock={stock} setStock={setStock} />}
          {page === "fournisseurs" && <Fournisseurs />}
          {page === "incidents" && <Incidents incidents={incidents} setIncidents={setIncidents} checklist={checklist} setChecklist={setChecklist} />}
          {page === "portail" && <PortailClient factures={factures} devis={devis} annots={annots} setAnnots={setAnnots} lots={lots} setLots={setLots} />}
          {page === "rentabilite" && <Rentabilite factures={factures} />}
          {page === "soustraitance" && <SousTraitance />}
          {page === "materiel" && <Materiel engins={engins} setEngins={setEngins} />}
          {page === "ao" && <AppelsOffres />}
          {page === "paie" && <PaieCNPS ouvriers={ouvriers} />}
          {page === "messagerie" && <Messagerie messages={messages} setMessages={setMessages} />}
          {page === "meteo" && <Meteo />}
          {page === "planning" && <PlanningGantt />}
          {page === "predictions" && <PredictionsIA />}
          {page === "vitrine" && <Vitrine lots={lots} />}
          {page === "equipe" && <EquipeAgence equipe={equipe} setEquipe={setEquipe} roles={roles} setRoles={setRoles} />}
          {page === "parametres" && <ParametresAgence />}
          {page === "programmes" && <Programmes lots={lots} setLots={setLots} />}
          {page === "vefa" && <VefaAppels reservations={RESERVATIONS_INIT} />}
          {page === "contrats" && (
            <>
              <ContratsCM onOuvrirContrat={() => setContratDemo(lots.find(l => l.id === "T3-02"))} />
              <ContratVEFAModal lot={contratDemo} onClose={() => setContratDemo(null)} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
