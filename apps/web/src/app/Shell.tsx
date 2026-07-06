import { useState } from "react";
import {
  HardHat, LogOut, Eye, LayoutDashboard, Building2, FileText, Package, ClipboardCheck, FileSignature,
} from "lucide-react";
import { C, FONTS } from "@tank/ui";
import { supabase } from "../lib/supabase";
import Dashboard from "../modules/Dashboard";
import ChantiersLive from "../modules/ChantiersLive";
import FacturesLive from "../modules/FacturesLive";
import StocksLive from "../modules/StocksLive";
import PointageLive from "../modules/PointageLive";
import DevisLive from "../modules/DevisLive";

type Page = { id: string; label: string; icon: typeof HardHat; render: () => JSX.Element };

const PAGES: Page[] = [
  { id: "dashboard", label: "Pilotage", icon: LayoutDashboard, render: () => <Dashboard /> },
  { id: "chantiers", label: "Chantiers", icon: Building2, render: () => <ChantiersLive /> },
  { id: "pointage", label: "Pointage", icon: ClipboardCheck, render: () => <PointageLive /> },
  { id: "devis", label: "Devis", icon: FileSignature, render: () => <DevisLive /> },
  { id: "factures", label: "Factures", icon: FileText, render: () => <FacturesLive /> },
  { id: "stocks", label: "Stocks", icon: Package, render: () => <StocksLive /> },
];

export default function Shell({ email, onShowProto }: { email?: string; onShowProto: () => void }) {
  const [page, setPage] = useState("dashboard");
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr", background: C.concrete }}>
      <aside style={{ background: C.steel, color: C.white, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.steelMid}` }}>
          <div style={{ background: C.orange, borderRadius: 8, padding: 6 }}><HardHat size={18} color={C.white} /></div>
          <span style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 18, textTransform: "uppercase", letterSpacing: 1 }}>Tank</span>
        </div>
        <nav style={{ padding: 10, display: "grid", gap: 4, flex: 1 }}>
          {PAGES.map((p) => {
            const active = p.id === page;
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
          <div style={{ fontSize: 11, color: "#8FA0AF", padding: "2px 4px" }}>{email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans }}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ padding: 24, overflow: "auto" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.condensed, fontSize: 26, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, margin: "0 0 20px" }}>
          <current.icon size={24} color={C.orange} /> {current.label}
        </h1>
        {current.render()}
      </main>
    </div>
  );
}
