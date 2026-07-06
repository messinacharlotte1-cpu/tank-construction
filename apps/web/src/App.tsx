import { useState } from "react";
import { HardHat, LogOut, LayoutGrid, Eye } from "lucide-react";
import { C, FONTS } from "@tank/ui";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { useSession } from "./auth/useSession";
import Login from "./auth/Login";
import ChantiersLive from "./modules/ChantiersLive";
// Maquette UX complète (prototype validé client) — accessible en lecture.
// @ts-expect-error — prototype JSX non typé (allowJs).
import TankPrototype from "./prototype/TankPrototype.jsx";

export default function App() {
  const { session, loading } = useSession();
  const [showProto, setShowProto] = useState(false);

  // Sans variables Supabase (build sans env) → on sert la maquette (démo).
  if (!isSupabaseConfigured) return <TankPrototype />;

  if (loading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.steelSoft }}>Chargement…</div>;
  if (!session) return <Login />;
  if (showProto) {
    return (
      <div>
        <button
          onClick={() => setShowProto(false)}
          style={{ position: "fixed", top: 12, right: 12, zIndex: 9999, padding: "8px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}
        >
          ← Espace réel
        </button>
        <TankPrototype />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.concrete }}>
      <header style={{ background: C.steel, color: C.white, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.orange, borderRadius: 8, padding: 6 }}><HardHat size={18} color={C.white} /></div>
          <span style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 20, textTransform: "uppercase", letterSpacing: 1 }}>Tank Construction</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setShowProto(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans }}>
            <Eye size={15} /> Maquette
          </button>
          <span style={{ fontSize: 13, color: "#B9C4CF" }}>{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} title="Se déconnecter" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans }}>
            <LogOut size={15} /> Quitter
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.condensed, fontSize: 26, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, margin: "0 0 20px" }}>
          <LayoutGrid size={24} color={C.orange} /> Chantiers
        </h1>
        <ChantiersLive />
      </main>
    </div>
  );
}
