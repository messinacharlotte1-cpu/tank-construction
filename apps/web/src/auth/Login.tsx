import { useState } from "react";
import { HardHat } from "lucide-react";
import { C, FONTS } from "@tank/ui";
import { supabase } from "../lib/supabase";

export default function Login({ onVitrine }: { onVitrine?: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [nom, setNom] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password: pwd, options: { data: { nom } } });
      setBusy(false);
      if (error) return setErr(error.message);
      // Confirm email ON → pas de session, mail envoyé. OFF → session ouverte mais compte inactif (gate côté App).
      if (!data.session) setInfo("Compte créé. Vérifiez votre email pour confirmer, puis attendez la validation par la direction.");
      else setInfo("Compte créé. En attente de validation par la direction.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setBusy(false);
    if (error) setErr(error.message);
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${C.line}`,
    fontSize: 14, fontFamily: FONTS.sans, marginTop: 6,
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.steel, padding: 20 }}>
      <form onSubmit={submit} style={{ width: 360, background: C.white, borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ background: C.orange, borderRadius: 10, padding: 8 }}>
            <HardHat size={22} color={C.white} />
          </div>
          <div style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 24, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>
            Tank Construction
          </div>
        </div>
        <div style={{ color: C.steelSoft, fontSize: 13, marginBottom: 20 }}>{mode === "login" ? "Connexion à l'espace de gestion" : "Créer un compte — validé par la direction"}</div>

        {mode === "signup" && (
          <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, display: "block", marginBottom: 14 }}>
            Nom complet
            <input style={input} value={nom} onChange={(e) => setNom(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft }}>
          Email
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, display: "block", marginTop: 14 }}>
          Mot de passe
          <input style={input} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} />
        </label>

        {err && <div style={{ marginTop: 14, color: C.red, fontSize: 13 }}>{err}</div>}
        {info && <div style={{ marginTop: 14, color: C.green, fontSize: 13, background: C.greenSoft, padding: "10px 12px", borderRadius: 8 }}>{info}</div>}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%", marginTop: 20, padding: 12, border: "none", borderRadius: 8,
            background: C.orange, color: C.white, fontWeight: 700, fontSize: 15, cursor: busy ? "wait" : "pointer",
            fontFamily: FONTS.sans, opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "…" : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>

        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); setInfo(null); }}
          style={{ width: "100%", marginTop: 10, padding: 10, background: "transparent", border: "none", color: C.orange, cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600 }}>
          {mode === "login" ? "Pas de compte ? Créer un compte" : "← Déjà un compte ? Se connecter"}
        </button>
        {onVitrine && (
          <button type="button" onClick={onVitrine} style={{ width: "100%", marginTop: 10, padding: 10, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: C.steelSoft, cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13 }}>
            Voir la vitrine publique →
          </button>
        )}
      </form>
    </div>
  );
}
