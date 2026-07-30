import { useEffect, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { C, FONTS, Card, StatutBadge, SectionTitle, fcfa, EmptyState, Skeleton, useToast, btnPrimary } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { humanError } from "../lib/errors";

type Facture = { id: string; numero: string; client: string; ttc: number; statut: string };
const STATUTS = ["Brouillon", "Envoyée", "Payée", "Impayée"];

export default function FacturesLive() {
  const [rows, setRows] = useState<Facture[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ client: "", ttc: "", statut: "Brouillon" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const { data, error } = await supabase.from("factures").select("id,numero,client,ttc,statut").order("numero", { ascending: false });
    if (error) setErr(error.message);
    else setRows((data as Facture[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true); setErr(null);
    const { data: numero, error: ne } = await supabase.rpc("next_numero", { kind: "facture" });
    if (ne) { setBusy(false); setErr(ne.message); return; }
    const ttc = Number(form.ttc) || 0;
    // Snapshot à l'émission : fige numéro/client/TTC/date. Un changement de paramètre ne le réécrit pas.
    const snapshot = { emisLe: new Date().toISOString(), numero, client: form.client, ttc };
    const { error } = await supabase.from("factures").insert({
      id: crypto.randomUUID(), tenantId, numero: numero as string, client: form.client,
      ttc, statut: form.statut, snapshot, createdAt: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { setErr(humanError(error.message)); toast({ message: humanError(error.message), tone: "error" }); return; }
    setForm({ client: "", ttc: "", statut: "Brouillon" });
    void load();
    toast({ message: `Facture ${numero} créée`, tone: "success" });
  }
  // Suppression avec annulation : retrait UI immédiat, delete DB différé 5 s.
  function remove(f: Facture) {
    setRows((l) => l.filter((x) => x.id !== f.id));
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("factures").delete().eq("id", f.id);
      if (error) { setRows((l) => [...l, f].sort((a, b) => b.numero.localeCompare(a.numero))); toast({ message: humanError(error.message), tone: "error" }); }
    }, 5000);
    toast({ message: `Facture ${f.numero} supprimée`, tone: "info", duration: 5000, action: { label: "Annuler", onClick: () => { clearTimeout(timer); setRows((l) => [...l, f].sort((a, b) => b.numero.localeCompare(a.numero))); } } });
  }
  async function paiement(f: Facture) {
    const montant = Number(window.prompt(`Paiement facture ${f.numero} (TTC ${f.ttc}) — montant FCFA :`, String(f.ttc)));
    if (!montant || montant <= 0) return;
    const mode = (window.prompt("Mode (MOMO / OM / VIREMENT / ESPECES) :", "MOMO") ?? "MOMO").toUpperCase();
    const { error: pe } = await supabase.from("paiements").insert({ id: crypto.randomUUID(), factureId: f.id, montant, mode, refTransaction: "SIM-" + Date.now(), date: new Date().toISOString() });
    if (pe) return setErr(pe.message.includes("row-level") ? "Droits insuffisants (rôle) pour un paiement." : pe.message);
    const { data: pays } = await supabase.from("paiements").select("montant").eq("factureId", f.id);
    const total = (pays ?? []).reduce((s, p) => s + Number(p.montant), 0);
    if (total >= Number(f.ttc)) await supabase.from("factures").update({ statut: "Payée" }).eq("id", f.id);
    void load();
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={FileText}>Facturation</SectionTitle>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouvelle facture
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <input style={input} placeholder="TTC FCFA" type="number" min="0" value={form.ttc} onChange={(e) => setForm({ ...form, ttc: e.target.value })} />
          <select style={input} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={busy} style={{ ...btnPrimary, justifyContent: "center" }}>{busy ? "…" : "Ajouter"}</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
                {["N°", "Client", "Montant TTC", "Statut"].map((h) => <th key={h} style={{ padding: "10px 14px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>{Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: "12px 14px" }}><Skeleton h={13} w={j === 0 ? "50%" : "80%"} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={FileText} title="Aucune facture" hint="Émettez votre première facture via le formulaire ci-dessus — le numéro est attribué automatiquement." />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
                {["N°", "Client", "Montant TTC", "Statut"].map((h) => <th key={h} style={{ padding: "10px 14px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: C.steel }}>{f.numero}</td>
                  <td style={{ padding: "10px 14px" }}>{f.client}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{fcfa(Number(f.ttc))}</td>
                  <td style={{ padding: "10px 14px" }}><StatutBadge s={f.statut} /></td>
                  <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {f.statut !== "Payée" && <button onClick={() => paiement(f)} title="Enregistrer un paiement" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: C.green, fontWeight: 700, marginRight: 10 }}>Paiement</button>}
                    <button onClick={() => remove(f)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
