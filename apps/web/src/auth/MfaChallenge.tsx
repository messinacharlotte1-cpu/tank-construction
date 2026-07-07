import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { C, FONTS } from "@tank/ui";
import { supabase } from "../lib/supabase";

// Étape 2FA à la connexion : élève la session de aal1 → aal2.
export default function MfaChallenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data: fac } = await supabase.auth.mfa.listFactors();
    const totp = fac?.totp?.find((f) => f.status === "verified");
    if (!totp) { setBusy(false); setErr("Aucun facteur TOTP."); return; }
    const ch = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (ch.error) { setBusy(false); setErr(ch.error.message); return; }
    const v = await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: ch.data.id, code });
    setBusy(false);
    if (v.error) { setErr(v.error.message); return; }
    onDone();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.steel, padding: 20 }}>
      <form onSubmit={verify} style={{ width: 340, background: C.white, borderRadius: 14, padding: 28, display: "grid", gap: 14, justifyItems: "center" }}>
        <ShieldCheck size={32} color={C.orange} />
        <div style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 20, textTransform: "uppercase", color: C.steel }}>Double authentification</div>
        <div style={{ fontSize: 13, color: C.steelSoft, textAlign: "center" }}>Saisissez le code de votre application d'authentification.</div>
        <input autoFocus style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 18, letterSpacing: 6, textAlign: "center", fontFamily: FONTS.sans }} placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
        {err && <div style={{ color: C.red, fontSize: 13 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: 12, border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>{busy ? "Vérification…" : "Valider"}</button>
        <button type="button" onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", color: C.steelSoft, cursor: "pointer", fontSize: 12 }}>Annuler</button>
      </form>
    </div>
  );
}
