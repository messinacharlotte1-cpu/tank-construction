import { useEffect, useState } from "react";
import {
  HardHat, LogOut, LayoutDashboard, Building2, FileText, Package, ClipboardCheck, FileSignature, Landmark, Banknote, ScrollText, UserCircle,
  TrendingUp, ShieldAlert, Wrench, Truck, Users, UserCog, Settings, Wallet,
  Calendar, Sparkles, CloudSun, Scale, MessageCircle, Store, Image as ImageIcon, ShieldCheck, ChevronDown, ChevronRight,
  Search, X, Bell,
} from "lucide-react";
import { C, FONTS, Hazard } from "@tank/ui";
import { supabase } from "../lib/supabase";
import Dashboard from "../modules/Dashboard";
import ChantiersLive from "../modules/ChantiersLive";
import FacturesLive from "../modules/FacturesLive";
import StocksLive from "../modules/StocksLive";
import PointageLive from "../modules/PointageLive";
import DevisLive from "../modules/DevisLive";
import ProgrammesLive from "../modules/ProgrammesLive";
import AppelsVefaLive from "../modules/AppelsVefaLive";
import ContratsLive from "../modules/ContratsLive";
import PortailAcquereur from "../modules/PortailAcquereur";
import RentabiliteLive from "../modules/RentabiliteLive";
import IncidentsLive from "../modules/IncidentsLive";
import MaterielLive from "../modules/MaterielLive";
import FournisseursLive from "../modules/FournisseursLive";
import SousTraitanceLive from "../modules/SousTraitanceLive";
import EquipeLive from "../modules/EquipeLive";
import ParametresLive from "../modules/ParametresLive";
import PlanningGantt from "../modules/PlanningGantt";
import PredictionsLive from "../modules/PredictionsLive";
import MeteoLive from "../modules/MeteoLive";
import AoBpuLive from "../modules/AoBpuLive";
import MessagerieLive from "../modules/MessagerieLive";
import Vitrine from "../modules/Vitrine";
import SituationsLive from "../modules/SituationsLive";
import ReservesLive from "../modules/ReservesLive";
import MediasLive from "../modules/MediasLive";
import SecuriteLive from "../modules/SecuriteLive";
import PaieLive from "../modules/PaieLive";
import FichesLive from "../modules/FichesLive";

// undefined roles = accessible à tous. SUPER_ADMIN voit tout (traité dans le filtre).
// group = section de nav (reproduit l'organisation de la maquette).
type Nav = (id: string) => void;
type Page = { id: string; label: string; icon: typeof HardHat; group: string; roles?: string[]; render: (go: Nav) => JSX.Element };

// Ordre des sections comme dans la maquette.
const GROUPS = ["Pilotage", "Opérations", "Commercial", "Promotion", "Ressources", "Administration"];

const PAGES: Page[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Pilotage", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA", "COMMERCIAL", "TERRAIN"], render: (go) => <Dashboard go={go} /> },
  { id: "rentabilite", label: "Rentabilité", icon: TrendingUp, group: "Pilotage", roles: ["DIRECTION", "COMPTA"], render: () => <RentabiliteLive /> },
  { id: "predictions", label: "Prédictions", icon: Sparkles, group: "Pilotage", roles: ["DIRECTION", "COMPTA"], render: () => <PredictionsLive /> },

  { id: "chantiers", label: "Chantiers", icon: Building2, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <ChantiersLive /> },
  { id: "planning", label: "Planning", icon: Calendar, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <PlanningGantt /> },
  { id: "pointage", label: "Pointage", icon: ClipboardCheck, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "TERRAIN"], render: () => <PointageLive /> },
  { id: "reserves", label: "Réserves / OPR", icon: ClipboardCheck, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <ReservesLive /> },
  { id: "medias", label: "Plans / Photos", icon: ImageIcon, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <MediasLive /> },
  { id: "incidents", label: "Incidents", icon: ShieldAlert, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "TERRAIN"], render: () => <IncidentsLive /> },
  { id: "materiel", label: "Matériel", icon: Wrench, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <MaterielLive /> },
  { id: "meteo", label: "Météo", icon: CloudSun, group: "Opérations", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "TERRAIN"], render: () => <MeteoLive /> },

  { id: "devis", label: "Devis", icon: FileSignature, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <DevisLive /> },
  { id: "ao", label: "AO / BPU", icon: Scale, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL"], render: () => <AoBpuLive /> },
  { id: "situations", label: "Situations", icon: FileText, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <SituationsLive /> },
  { id: "factures", label: "Factures", icon: FileText, group: "Commercial", roles: ["DIRECTION", "COMPTA", "COMMERCIAL"], render: () => <FacturesLive /> },
  { id: "portail", label: "Portail acquéreur", icon: UserCircle, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL"], render: () => <PortailAcquereur /> },
  { id: "vitrine", label: "Vitrine", icon: Store, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL"], render: () => <Vitrine embedded /> },

  { id: "programmes", label: "Programmes", icon: Landmark, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL"], render: () => <ProgrammesLive /> },
  { id: "vefa", label: "VEFA", icon: Banknote, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <AppelsVefaLive /> },
  { id: "contrats", label: "Contrats", icon: ScrollText, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL"], render: () => <ContratsLive /> },

  { id: "stocks", label: "Stocks", icon: Package, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <StocksLive /> },
  { id: "fiches", label: "Fiches & documents", icon: FileText, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA"], render: () => <FichesLive /> },
  { id: "fournisseurs", label: "Fournisseurs", icon: Truck, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA"], render: () => <FournisseursLive /> },
  { id: "soustraitance", label: "Sous-traitance", icon: Users, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <SousTraitanceLive /> },
  { id: "paie", label: "Paie CNPS", icon: Wallet, group: "Ressources", roles: ["DIRECTION", "COMPTA"], render: () => <PaieLive /> },
  { id: "messagerie", label: "Messagerie", icon: MessageCircle, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA", "COMMERCIAL", "TERRAIN"], render: () => <MessagerieLive /> },

  { id: "equipe", label: "Équipe", icon: UserCog, group: "Administration", roles: ["DIRECTION", "SUPER_ADMIN"], render: () => <EquipeLive /> },
  { id: "securite", label: "Sécurité (2FA)", icon: ShieldCheck, group: "Administration", roles: ["DIRECTION", "COMPTA", "SUPER_ADMIN"], render: () => <SecuriteLive /> },
  { id: "parametres", label: "Paramètres", icon: Settings, group: "Administration", roles: ["DIRECTION", "SUPER_ADMIN"], render: () => <ParametresLive /> },
];

export default function Shell({ email }: { email?: string }) {
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState("dashboard");
  const [q, setQ] = useState("");
  const [hover, setHover] = useState("");
  const [alerts, setAlerts] = useState(0);
  // Sections repliées par défaut ; seule la section de la page courante est ouverte.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(["Pilotage"]));

  useEffect(() => {
    supabase.rpc("current_role").then(({ data }) => setRole((data as string) ?? ""));
    // Compteur d'alertes réel (chantiers en retard, factures impayées, stock bas, incidents ouverts).
    (async () => {
      const [ch, fa, inc, art] = await Promise.all([
        supabase.from("chantiers").select("id", { count: "exact", head: true }).eq("statut", "EN_RETARD"),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("statut", "Impayée"),
        supabase.from("incidents").select("id", { count: "exact", head: true }).eq("statut", "En cours"),
        supabase.from("articles").select("stock,seuil"),
      ]);
      const bas = (art.data ?? []).filter((a) => Number(a.stock) < Number(a.seuil)).length;
      setAlerts((ch.count ?? 0) + (fa.count ?? 0) + (inc.count ?? 0) + bas);
    })();
  }, []);

  const visible = PAGES.filter((p) => !p.roles || role === "SUPER_ADMIN" || p.roles.includes(role));
  const current = visible.find((p) => p.id === page) ?? visible[0];
  const toggleGroup = (g: string) => setOpenGroups((s) => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n; });
  // Navigue + ouvre la section cible (utile après une recherche ou un lien inter-module).
  const goto = (id: string) => {
    setPage(id);
    const g = PAGES.find((p) => p.id === id)?.group;
    if (g) setOpenGroups((s) => new Set(s).add(g));
  };

  // Recherche : filtre par libellé. Résultats aplatis, sans sections repliables.
  const query = q.trim().toLowerCase();
  const matches = query ? visible.filter((p) => p.label.toLowerCase().includes(query)) : [];

  const initials = (email ?? "?").replace(/@.*/, "").split(/[.\-_]/).map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "?";
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr", background: C.concrete }}>
      <aside style={{ background: C.steel, color: C.white, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 20px 14px" }}>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 24, fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}>
            TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION
          </div>
          <div style={{ fontSize: 11, color: "#8FA0B2", marginTop: 4, letterSpacing: 0.5 }}>Gestion BTP — Cameroun</div>
        </div>
        <Hazard />
        <div style={{ padding: "10px 10px 4px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} color="#7B8A99" style={{ position: "absolute", left: 10, pointerEvents: "none" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setQ(""); if (e.key === "Enter" && matches[0]) { goto(matches[0].id); setQ(""); } }}
              placeholder="Rechercher un module…"
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 30px 8px 32px", borderRadius: 8, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, fontSize: 13, fontFamily: FONTS.sans, outline: "none" }}
            />
            {q && (
              <button onClick={() => setQ("")} title="Effacer" style={{ position: "absolute", right: 6, background: "none", border: "none", cursor: "pointer", color: "#7B8A99", display: "flex", padding: 4 }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <nav style={{ padding: 10, display: "grid", gap: 2, flex: 1, overflow: "auto" }}>
          {query ? (
            matches.length === 0 ? (
              <div style={{ padding: "12px", fontSize: 13, color: "#7B8A99" }}>Aucun module « {q} ».</div>
            ) : (
              matches.map((p) => {
                const active = current && p.id === current.id;
                const hot = hover === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { goto(p.id); setQ(""); }}
                    onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover("")}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 13px", borderRadius: 8,
                      border: "none", borderLeft: `3px solid ${active ? C.orange : "transparent"}`, cursor: "pointer", textAlign: "left",
                      fontSize: 13.5, fontFamily: FONTS.sans,
                      background: active || hot ? C.steelMid : "transparent", color: active ? C.white : "#B7C3CF", fontWeight: 600,
                      transition: "background .12s",
                    }}
                  >
                    <p.icon size={17} /> {p.label}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#6E8093", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.group}</span>
                  </button>
                );
              })
            )
          ) : (
            GROUPS.filter((g) => visible.some((p) => p.group === g)).map((g) => {
              const opened = openGroups.has(g);
              const hasActive = current?.group === g;
              const count = visible.filter((p) => p.group === g).length;
              return (
                <div key={g}>
                  <button
                    onClick={() => toggleGroup(g)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 6px", background: "transparent", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: hasActive ? C.orange : "#7B8A99" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {g}
                      <span style={{ fontSize: 9, fontWeight: 700, color: hasActive ? C.orange : "#5F6E7D", background: hasActive ? "rgba(242,107,29,.15)" : "rgba(255,255,255,.06)", borderRadius: 10, padding: "1px 6px", letterSpacing: 0 }}>{count}</span>
                      {!opened && hasActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }} />}
                    </span>
                    {opened ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {opened && visible.filter((p) => p.group === g).map((p) => {
                    const active = current && p.id === current.id;
                    const hot = hover === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPage(p.id)}
                        onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover("")}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 13px", borderRadius: 8,
                          border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5, fontFamily: FONTS.sans,
                          borderLeft: `3px solid ${active ? C.orange : "transparent"}`,
                          background: active || hot ? C.steelMid : "transparent", color: active ? C.white : "#B7C3CF", fontWeight: 600,
                          transition: "background .12s",
                        }}
                      >
                        <p.icon size={17} /> {p.label}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.steelMid}`, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.orange, display: "grid", placeItems: "center", fontWeight: 700, color: C.white, fontSize: 13, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.white, fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
              <div style={{ fontSize: 11, color: "#8FA0B2" }}>{role || "—"}</div>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} title="Se déconnecter" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: `1px solid ${C.steelSoft}`, color: "#B7C3CF", borderRadius: 8, padding: "7px 8px", cursor: "pointer", fontSize: 12, fontFamily: FONTS.sans }}>
            <LogOut size={14} /> Quitter
          </button>
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>
        <header style={{ background: C.white, borderBottom: `1px solid ${C.line}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>
            {current && <current.icon size={20} color={C.orange} />} {current?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => goto("dashboard")} title="Alertes" style={{ position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}>
              <Bell size={20} color={C.steelSoft} />
              {alerts > 0 && (
                <span style={{ position: "absolute", top: -6, right: -7, background: C.red, color: C.white, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 5px" }}>{alerts}</span>
              )}
            </button>
            <span style={{ fontSize: 12, color: C.steelSoft, textTransform: "capitalize" }}>{dateStr}</span>
          </div>
        </header>
        <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {current && current.render(goto)}
        </div>
      </main>
    </div>
  );
}
