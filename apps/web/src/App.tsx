import { useState } from "react";
import { C } from "@tank/ui";
import { isSupabaseConfigured } from "./lib/supabase";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useSession } from "./auth/useSession";
import Login from "./auth/Login";
import Shell from "./app/Shell";
import Vitrine from "./modules/Vitrine";
import MfaChallenge from "./auth/MfaChallenge";

export default function App() {
  const { session, loading } = useSession();
  const [showVitrine, setShowVitrine] = useState(false);
  const [needMfa, setNeedMfa] = useState<boolean>(false);

  useEffect(() => {
    if (!session) { setNeedMfa(false); return; }
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      setNeedMfa(data?.currentLevel === "aal1" && data?.nextLevel === "aal2");
    });
  }, [session]);

  // Sans variables Supabase (build sans env) → configuration requise.
  if (!isSupabaseConfigured) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.steelSoft, padding: 24, textAlign: "center" }}>
      Configuration requise : variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes.
    </div>;
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.steelSoft }}>Chargement…</div>;
  if (!session) {
    if (showVitrine) return <Vitrine onBack={() => setShowVitrine(false)} />;
    return <Login onVitrine={() => setShowVitrine(true)} />;
  }
  if (needMfa) return <MfaChallenge onDone={() => setNeedMfa(false)} />;

  return <Shell email={session.user.email} />;
}
