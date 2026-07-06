import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { C, FONTS, Card, StatutBadge, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Facture = { id: string; numero: string; client: string; ttc: number; statut: string };
const STATUTS = ["Brouillon", "Envoyée", "Payée", "Impayée"];

export default function FacturesLive() {
  const [rows, setRows] = useState<Facture[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ numero: "", client: "", ttc: "", statut: "Brouillon" });
  const [busy, setBusy] = useState(false);

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
    const { error } = await supabase.from("factures").insert({
      id: crypto.randomUUID(), tenantId, numero: form.numero, client: form.client,
      ttc: Number(form.ttc) || 0, statut: form.statut, createdAt: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm({ numero: "", client: "", ttc: "", statut: "Brouillon" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("factures").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouvelle facture
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.4fr 2fr 1.4fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="N° (FAC-…)" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
          <input style={input} placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <input style={input} placeholder="TTC FCFA" type="number" min="0" value={form.ttc} onChange={(e) => setForm({ ...form, ttc: e.target.value })} />
          <select style={input} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>{busy ? "…" : "Ajouter"}</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}>
                <th style={{ padding: 12 }}>N°</th><th style={{ padding: 12 }}>Client</th><th style={{ padding: 12 }}>TTC</th><th style={{ padding: 12 }}>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{f.numero}</td>
                  <td style={{ padding: 12 }}>{f.client}</td>
                  <td style={{ padding: 12 }}>{fcfa(Number(f.ttc))}</td>
                  <td style={{ padding: 12 }}><StatutBadge s={f.statut} /></td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button onClick={() => remove(f.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucune facture.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
