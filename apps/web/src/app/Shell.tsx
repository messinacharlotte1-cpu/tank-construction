import { useEffect, useState } from "react";
import {
  HardHat, LogOut, Eye, LayoutDashboard, Building2, FileText, Package, ClipboardCheck, FileSignature, Landmark, Banknote, ScrollText, UserCircle,
  TrendingUp, ShieldAlert, Wrench, Truck, Users, UserCog, Settings,
  Calendar, Sparkles, CloudSun, Scale, MessageCircle, Store, Image as ImageIcon, ShieldCheck, ChevronDown, ChevronRight,
} from "lucide-react";
import { C, FONTS } from "@tank/ui";
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
  { id: "portail", label: "Portail acquéreur", icon: UserCircle, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL", "ACQUEREUR"], render: () => <PortailAcquereur /> },
  { id: "vitrine", label: "Vitrine", icon: Store, group: "Commercial", roles: ["DIRECTION", "COMMERCIAL"], render: () => <Vitrine embedded /> },

  { id: "programmes", label: "Programmes", icon: Landmark, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL"], render: () => <ProgrammesLive /> },
  { id: "vefa", label: "VEFA", icon: Banknote, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <AppelsVefaLive /> },
  { id: "contrats", label: "Contrats", icon: ScrollText, group: "Promotion", roles: ["DIRECTION", "COMMERCIAL"], render: () => <ContratsLive /> },

  { id: "stocks", label: "Stocks", icon: Package, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <StocksLive /> },
  { id: "fournisseurs", label: "Fournisseurs", icon: Truck, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA"], render: () => <FournisseursLive /> },
  { id: "soustraitance", label: "Sous-traitance", icon: Users, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <SousTraitanceLive /> },
  { id: "messagerie", label: "Messagerie", icon: MessageCircle, group: "Ressources", roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA", "COMMERCIAL", "TERRAIN"], render: () => <MessagerieLive /> },

  { id: "equipe", label: "Équipe", icon: UserCog, group: "Administration", roles: ["DIRECTION", "SUPER_ADMIN"], render: () => <EquipeLive /> },
  { id: "securite", label: "Sécurité (2FA)", icon: ShieldCheck, group: "Administration", roles: ["DIRECTION", "COMPTA", "SUPER_ADMIN"], render: () => <SecuriteLive /> },
  { id: "parametres", label: "Paramètres", icon: Settings, group: "Administration", roles: ["DIRECTION", "SUPER_ADMIN"], render: () => <ParametresLive /> },
];

export default function Shell({ email, onShowProto }: { email?: string; onShowProto: () => void }) {
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState("dashboard");
  // Sections repliées par défaut ; seule la section de la page courante est ouverte.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(["Pilotage"]));

  useEffect(() => {
    supabase.rpc("current_role").then(({ data }) => setRole((data as string) ?? ""));
  }, []);

  const visible = PAGES.filter((p) => !p.roles || role === "SUPER_ADMIN" || p.roles.includes(role));
  const current = visible.find((p) => p.id === page) ?? visible[0];
  const toggleGroup = (g: string) => setOpenGroups((s) => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n; });

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr", background: C.concrete }}>
      <aside style={{ background: C.steel, color: C.white, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.steelMid}` }}>
          <div style={{ background: C.orange, borderRadius: 8, padding: 6 }}><HardHat size={18} color={C.white} /></div>
          <span style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 18, textTransform: "uppercase", letterSpacing: 1 }}>Tank</span>
        </div>
        <nav style={{ padding: 10, display: "grid", gap: 2, flex: 1, overflow: "auto" }}>
          {GROUPS.filter((g) => visible.some((p) => p.group === g)).map((g) => {
            const opened = openGroups.has(g);
            const hasActive = current?.group === g;
            return (
              <div key={g}>
                <button
                  onClick={() => toggleGroup(g)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 6px", background: "transparent", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: hasActive ? C.orange : "#7B8A99" }}
                >
                  <span>{g}</span>
                  {opened ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {opened && visible.filter((p) => p.group === g).map((p) => {
                  const active = current && p.id === current.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPage(p.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
                        border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontFamily: FONTS.sans,
                        background: active ? C.orange : "transparent", color: C.white, fontWeight: active ? 700 : 500,
                      }}
                    >
                      <p.icon size={17} /> {p.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: 10, borderTop: `1px solid ${C.steelMid}`, display: "grid", gap: 6 }}>
          <button onClick={onShowProto} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans }}>
            <Eye size={15} /> Maquette
          </button>
          <div style={{ fontSize: 11, color: "#8FA0AF", padding: "2px 4px" }}>{email}{role ? ` · ${role}` : ""}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans }}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ padding: 24, overflow: "auto" }}>
        {current && (
          <>
            <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.condensed, fontSize: 26, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, margin: "0 0 20px" }}>
              <current.icon size={24} color={C.orange} /> {current.label}
            </h1>
            {current.render(setPage)}
          </>
        )}
      </main>
    </div>
  );
}
