import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowLeft, ShieldCheck, Printer, KeyRound, Scale, AlertTriangle, ClipboardCheck } from "lucide-react";
import { C, FONTS, Card, SectionTitle, Banner, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { printDocument, fcfaP } from "../lib/pdf";

// Mise en conformité du contrat de réservation — référence droit camerounais (loi n°97/003, OHADA).
const CONFORMITE = [
  { avant: "Renvoi au Code de la construction et de l'habitation français + loi de 1965 sur la copropriété.", apres: "Renvoi à la loi camerounaise n°97/003 (promotion immobilière) et au droit foncier CM." },
  { avant: "Dépôt de garantie libellé en euros, séquestre chez un notaire français.", apres: "Dépôt en FCFA, séquestre chez un notaire camerounais agréé." },
  { avant: "Clause de rétractation « loi SRU » (10 jours) inopérante au Cameroun.", apres: "Délai de réflexion et conditions de résiliation conformes au droit CM." },
  { avant: "TVA à 20 % (taux français).", apres: "TVA 19,25 % (taux camerounais en vigueur)." },
];

type Contrat = {
  id: string; reference: string; type: string; client: string; objet: string | null;
  montant: number; templateVersion: string; statutSignature: string; otpLog: OtpLog | null; createdAt: string;
};
type OtpLog = { signeLe: string; empreinte: string; canal: string };

const STATUT: Record<string, string> = { Projet: C.steelSoft, "En attente OTP": C.amber, "Signé": C.green };
const TYPES = ["VEFA", "CONSTRUCTION", "RESERVATION"];

async function sha256(str: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ContratsLive() {
  const [rows, setRows] = useState<Contrat[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ reference: "", type: "VEFA", client: "", objet: "", montant: "" });
  const [open, setOpen] = useState<Contrat | null>(null);

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const { data, error } = await supabase.from("contrats").select("*").order("createdAt", { ascending: false });
    if (error) setErr(error.message); else setRows((data as Contrat[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    const { error } = await supabase.from("contrats").insert({
      id: crypto.randomUUID(), tenantId, reference: form.reference, type: form.type, client: form.client,
      objet: form.objet || null, montant: Number(form.montant) || 0, templateVersion: "v0-indicatif",
      statutSignature: "Projet", createdAt: new Date().toISOString(),
    });
    if (error) return setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle) pour créer un contrat." : error.message);
    setForm({ reference: "", type: "VEFA", client: "", objet: "", montant: "" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("contrats").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  if (open) return <ContratDetail contrat={open} onBack={() => { setOpen(null); void load(); }} />;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Scale}>Contrats &amp; conformité — droit camerounais</SectionTitle>

      <Banner tone="danger" icon={AlertTriangle}>
        <b>Audit du modèle en circulation :</b> les contrats de réservation recyclés d'un modèle français (Code de la construction, loi de 1965, dépôt en euros) sont inopérants devant le juge camerounais et exposent le promoteur. La bibliothèque ci-dessous génère des contrats fondés sur les textes en vigueur au Cameroun.
      </Banner>

      <Card>
        <SectionTitle icon={ClipboardCheck}>Mise en conformité du contrat de réservation (avant → après)</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {CONFORMITE.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", background: C.redSoft, color: C.steel }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Modèle français (à proscrire)</div>
                {a.avant}
              </div>
              <div style={{ padding: "10px 12px", background: C.greenSoft, color: C.steel }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Version conforme Cameroun</div>
                {a.apres}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouveau contrat
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.1fr 1.4fr 2fr 1.2fr auto", gap: 10 }}>
          <input style={input} placeholder="Réf. (CONT-…)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
          <select style={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <input style={input} placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <input style={input} placeholder="Objet" value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} />
          <input style={input} placeholder="Montant FCFA" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>Créer</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Référence", "Type", "Client", "Montant", "Signature"].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th>
            </tr></thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.line}`, cursor: "pointer", background: i % 2 ? "#FAFBFC" : C.white }} onClick={() => setOpen(c)}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{c.reference}</td>
                  <td style={{ padding: 12 }}>{c.type}</td>
                  <td style={{ padding: 12 }}>{c.client}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(c.montant))}</td>
                  <td style={{ padding: 12 }}><span style={{ color: STATUT[c.statutSignature] ?? C.steelSoft, fontWeight: 700, fontSize: 13 }}>{c.statutSignature}</span></td>
                  <td style={{ padding: 12, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => remove(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Aucun contrat.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function ContratDetail({ contrat, onBack }: { contrat: Contrat; onBack: () => void }) {
  const [c, setC] = useState(contrat);
  const [code, setCode] = useState<string | null>(null);
  const [saisie, setSaisie] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const signe = c.statutSignature === "Signé";

  function corps() {
    return `<div class="brand"><span class="logo">TANK</span><h1>Contrat ${c.type} — ${c.reference}</h1></div>
      <div class="bar"></div>
      <div class="banner">⚠ MODÈLE INDICATIF — non validé par un notaire/juriste camerounais. Sans valeur juridique en l'état (loi n°97/003, OHADA).</div>
      <p><b>Entre</b> : Tank Construction SARL (le Promoteur)<br/><b>et</b> : ${c.client} (l'Acquéreur)</p>
      <h3>Objet</h3><p>${c.objet ?? "—"}</p>
      <h3>Montant</h3><p>${fcfaP(Number(c.montant))}</p>
      <p class="muted">Gabarit ${c.templateVersion} — établi le ${new Date(c.createdAt).toLocaleDateString("fr-FR")}.</p>
      ${signe && c.otpLog ? `<div class="bar"></div><h3>Signature électronique</h3><p class="muted">Signé le ${new Date(c.otpLog.signeLe).toLocaleString("fr-FR")} — canal ${c.otpLog.canal}.<br/>Empreinte SHA-256 du contrat : ${c.otpLog.empreinte}</p>` : ""}`;
  }

  async function lancerOtp() {
    setErr(null);
    const gen = String(Math.floor(100000 + Math.random() * 900000));
    setCode(gen);
    const { error } = await supabase.from("contrats").update({ statutSignature: "En attente OTP" }).eq("id", c.id);
    if (error) setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle) pour signer." : error.message);
    else setC({ ...c, statutSignature: "En attente OTP" });
  }
  async function valider() {
    if (saisie !== code) { setErr("Code OTP incorrect."); return; }
    const empreinte = await sha256(`${c.reference}|${c.client}|${c.montant}|${c.objet ?? ""}`);
    const otpLog: OtpLog = { signeLe: new Date().toISOString(), empreinte, canal: "SMS (simulé)" };
    const { error } = await supabase.from("contrats").update({ statutSignature: "Signé", otpLog }).eq("id", c.id);
    if (error) { setErr(error.message); return; }
    setC({ ...c, statutSignature: "Signé", otpLog });
    setCode(null);
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Contrats</button>
        <button onClick={() => printDocument(c.reference, corps())} style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Printer size={15} /> PDF</button>
      </div>

      <Card style={{ background: C.amberSoft, borderColor: C.amber, color: "#8a6d00" }}>
        ⚠ <b>Modèle indicatif</b> — ce contrat n'a pas encore été validé par un notaire/juriste camerounais. Sans valeur juridique tant que le gabarit n'est pas validé (versionnage <code>{c.templateVersion}</code>).
      </Card>

      <Card>
        <h2 style={{ fontFamily: FONTS.condensed, color: C.steel }}>Contrat {c.type} — {c.reference}</h2>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: C.steel }}>
          <p><b>Entre</b> : Tank Construction SARL (le Promoteur)<br /><b>et</b> : {c.client} (l'Acquéreur)</p>
          <p><b>Objet</b> : {c.objet ?? "—"}</p>
          <p><b>Montant</b> : {fcfa(Number(c.montant))}</p>
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", color: C.steel, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color={signe ? C.green : C.orange} /> Signature électronique (OTP)
        </div>
        {err && <div style={{ color: C.red, marginBottom: 10 }}>{err}</div>}
        {signe ? (
          <div style={{ color: C.green, fontSize: 14 }}>
            ✔ Signé le {c.otpLog && new Date(c.otpLog.signeLe).toLocaleString("fr-FR")} — canal {c.otpLog?.canal}.
            <div style={{ color: C.steelSoft, fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>Empreinte SHA-256 : {c.otpLog?.empreinte}</div>
          </div>
        ) : !code ? (
          <button onClick={lancerOtp} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>
            <KeyRound size={16} /> Lancer la signature OTP
          </button>
        ) : (
          <div style={{ display: "grid", gap: 10, maxWidth: 360 }}>
            <div style={{ fontSize: 13, color: C.steelSoft }}>Code envoyé (simulé SMS) : <b style={{ color: C.steel, fontSize: 18, letterSpacing: 3 }}>{code}</b></div>
            <input style={input} placeholder="Saisir le code à 6 chiffres" value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={6} />
            <button onClick={valider} style={{ padding: "10px 16px", border: "none", borderRadius: 8, background: C.green, color: C.white, fontWeight: 700, cursor: "pointer" }}>Valider et signer</button>
            <div style={{ fontSize: 11, color: C.steelSoft }}>À l'expédition réelle : OTP par SMS + horodatage + empreinte SHA-256 consignés (valeur probante à faire valider juridiquement).</div>
          </div>
        )}
      </Card>
    </div>
  );
}
