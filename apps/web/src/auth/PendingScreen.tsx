import { Clock, LogOut } from "lucide-react";
import { C, FONTS } from "@tank/ui";
import { supabase } from "../lib/supabase";

// Compte créé mais pas encore validé par la direction (actif=false → current_role='EN_ATTENTE').
// Aucun accès aux données : la RLS refuse déjà tout côté serveur, cet écran l'explique côté UI.
export default function PendingScreen({ email }: { email?: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.steel, padding: 20 }}>
      <div style={{ width: 400, background: C.white, borderRadius: 14, padding: 32, textAlign: "center" }}>
        <div style={{ background: C.amberSoft, borderRadius: 14, width: 56, height: 56, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Clock size={28} color={C.amber} />
        </div>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>Compte en attente</div>
        <div style={{ color: C.steelSoft, fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
          Votre compte <b style={{ color: C.steel }}>{email}</b> a bien été créé. Un membre de la direction doit le valider et vous attribuer un rôle avant l'accès à l'espace de gestion.
        </div>
        <div style={{ color: C.steelSoft, fontSize: 12.5, marginTop: 14 }}>Vous serez actif dès validation — reconnectez-vous alors.</div>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.line}`, color: C.steel, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600 }}>
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
