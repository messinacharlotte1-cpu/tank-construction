import { useState } from "react";
import { C } from "@tank/ui";
import { isSupabaseConfigured } from "./lib/supabase";
import { useSession } from "./auth/useSession";
import Login from "./auth/Login";
import Shell from "./app/Shell";
import Vitrine from "./modules/Vitrine";
// Maquette UX complète (prototype validé client) — accessible en lecture.
import TankPrototype from "./prototype/TankPrototype.jsx";

export default function App() {
  const { session, loading } = useSession();
  const [showProto, setShowProto] = useState(false);
  const [showVitrine, setShowVitrine] = useState(false);

  // Sans variables Supabase (build sans env) → on sert la maquette (démo).
  if (!isSupabaseConfigured) return <TankPrototype />;

  if (loading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.steelSoft }}>Chargement…</div>;
  if (!session) {
    if (showVitrine) return <Vitrine onBack={() => setShowVitrine(false)} />;
    return <Login onVitrine={() => setShowVitrine(true)} />;
  }

  if (showProto) {
    return (
      <div>
        <button
          onClick={() => setShowProto(false)}
          style={{ position: "fixed", top: 12, right: 12, zIndex: 9999, padding: "8px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}
        >
          ← Espace réel
        </button>
        <TankPrototype />
      </div>
    );
  }

  return <Shell email={session.user.email} onShowProto={() => setShowProto(true)} />;
}
