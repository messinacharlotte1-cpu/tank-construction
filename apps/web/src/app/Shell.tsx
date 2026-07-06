import { useEffect, useState } from "react";
import {
  HardHat, LogOut, Eye, LayoutDashboard, Building2, FileText, Package, ClipboardCheck, FileSignature, Landmark, Banknote, ScrollText, UserCircle,
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

// undefined roles = accessible à tous. SUPER_ADMIN voit tout (traité dans le filtre).
type Page = { id: string; label: string; icon: typeof HardHat; roles?: string[]; render: () => JSX.Element };

const PAGES: Page[] = [
  { id: "dashboard", label: "Pilotage", icon: LayoutDashboard, render: () => <Dashboard /> },
  { id: "chantiers", label: "Chantiers", icon: Building2, roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <ChantiersLive /> },
  { id: "pointage", label: "Pointage", icon: ClipboardCheck, roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "TERRAIN"], render: () => <PointageLive /> },
  { id: "devis", label: "Devis", icon: FileSignature, roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <DevisLive /> },
  { id: "factures", label: "Factures", icon: FileText, roles: ["DIRECTION", "COMPTA", "COMMERCIAL"], render: () => <FacturesLive /> },
  { id: "stocks", label: "Stocks", icon: Package, roles: ["DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER"], render: () => <StocksLive /> },
  { id: "programmes", label: "Programmes", icon: Landmark, roles: ["DIRECTION", "COMMERCIAL"], render: () => <ProgrammesLive /> },
  { id: "vefa", label: "VEFA", icon: Banknote, roles: ["DIRECTION", "COMMERCIAL", "COMPTA"], render: () => <AppelsVefaLive /> },
  { id: "contrats", label: "Contrats", icon: ScrollText, roles: ["DIRECTION", "COMMERCIAL"], render: () => <ContratsLive /> },
  { id: "portail", label: "Portail acquéreur", icon: UserCircle, roles: ["DIRECTION", "COMMERCIAL"], render: () => <PortailAcquereur /> },
];

export default function Shell({ email, onShowProto }: { email?: string; onShowProto: () => void }) {
  const [role, setRole] = useState<string>("");
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    supabase.rpc("current_role").then(({ data }) => setRole((data as string) ?? ""));
  }, []);

  const visible = PAGES.filter((p) => !p.roles || role === "SUPER_ADMIN" || p.roles.includes(role));
  const current = visible.find((p) => p.id === page) ?? visible[0];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr", background: C.concrete }}>
      <aside style={{ background: C.steel, color: C.white, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.steelMid}` }}>
          <div style={{ background: C.orange, borderRadius: 8, padding: 6 }}><HardHat size={18} color={C.white} /></div>
          <span style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 18, textTransform: "uppercase", letterSpacing: 1 }}>Tank</span>
        </div>
        <nav style={{ padding: 10, display: "grid", gap: 4, flex: 1 }}>
          {visible.map((p) => {
            const active = current && p.id === current.id;
            return (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
                  border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontFamily: FONTS.sans,
                  background: active ? C.orange : "transparent", color: C.white, fontWeight: active ? 700 : 500,
                }}
              >
                <p.icon size={17} /> {p.label}
              </button>
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
            {current.render()}
          </>
        )}
      </main>
    </div>
  );
}
