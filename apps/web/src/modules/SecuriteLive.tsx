import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Factor = { id: string; status: string; friendly_name?: string };

// 2FA TOTP (Supabase Auth MFA). Recommandé direction/compta.
export default function SecuriteLive() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp as Factor[]) ?? []);
  }
  useEffect(() => { void loadFactors(); }, []);

  async function startEnroll() {
    setErr(null); setMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "TOTP-" + Date.now() });
    if (error) return setErr(error.message);
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function verify() {
    if (!enroll) return;
    setErr(null);
    const ch = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (ch.error) return setErr(ch.error.message);
    const v = await supabase.auth.mfa.verify({ factorId: enroll.factorId, challengeId: ch.data.id, code });
    if (v.error) return setErr(v.error.message);
    setEnroll(null); setCode(""); setMsg("2FA activée."); void loadFactors();
  }
  async function unenroll(factorId: string) {
    await supabase.auth.mfa.unenroll({ factorId });
    void loadFactors();
  }

  const inp: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 16, fontFamily: FONTS.sans, letterSpacing: 4, textAlign: "center" as const };
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 460 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.steelSoft, fontSize: 13 }}><ShieldCheck size={16} color={C.orange} /> Double authentification (TOTP) — Google Authenticator, Authy…</div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {msg && <Card style={{ borderColor: C.green, color: C.green }}>{msg}</Card>}

      <Card>
        <b style={{ color: C.steel }}>Facteurs actifs</b>
        {factors.length === 0 ? <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 6 }}>Aucun. 2FA désactivée.</div> : (
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {factors.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <span>{f.friendly_name ?? "TOTP"} · <span style={{ color: f.status === "verified" ? C.green : C.amber }}>{f.status}</span></span>
                <button onClick={() => unenroll(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {enroll ? (
        <Card style={{ display: "grid", gap: 12, justifyItems: "center" }}>
          <div style={{ fontSize: 13, color: C.steelSoft }}>Scannez le QR, puis saisissez le code à 6 chiffres.</div>
          <img src={enroll.qr} alt="QR TOTP" style={{ width: 180, height: 180 }} />
          <div style={{ fontSize: 11, color: C.steelSoft, wordBreak: "break-all" }}>Clé : {enroll.secret}</div>
          <input style={inp} placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={verify} style={{ padding: "10px 16px", border: "none", borderRadius: 8, background: C.green, color: C.white, fontWeight: 700, cursor: "pointer" }}>Vérifier &amp; activer</button>
        </Card>
      ) : (
        <button onClick={startEnroll} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}><KeyRound size={16} /> Activer la 2FA</button>
      )}
    </div>
  );
}
