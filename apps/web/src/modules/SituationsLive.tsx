import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { C, FONTS, Card, StatutBadge, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type S = { id: string; chantier: string; numero: string; cumulPct: number; montantHT: number; retenuePct: number; statut: string };
const STATUTS = ["Brouillon", "Envoyée", "Validée", "Payée"];

export default function SituationsLive() {
  const [rows, setRows] = useState<S[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ chantier: "", numero: "", cumulPct: "", montantHT: "", statut: "Brouillon" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("situations").select("id,chantier,numero,cumulPct,montantHT,retenuePct,statut").order("numero", { ascending: false });
    if (error) setErr(error.message); else setRows((data as S[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("situations").insert({ id: crypto.randomUUID(), tenantId: tid, chantier: f.chantier, numero: f.numero, cumulPct: Number(f.cumulPct) || 0, montantHT: Number(f.montantHT) || 0, retenuePct: 10, statut: f.statut, createdAt: new Date().toISOString() });
    if (error) return setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle)." : error.message);
    setF({ chantier: "", numero: "", cumulPct: "", montantHT: "", statut: "Brouillon" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("situations").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ fontSize: 13, color: C.steelSoft }}>Situation de travaux : retenue de garantie <b>10 %</b> déduite du montant cumulé HT (paramétrable).</div>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.9fr 1.4fr 1.2fr auto", gap: 10 }}>
          <input style={inp} placeholder="Chantier" value={f.chantier} onChange={(e) => setF({ ...f, chantier: e.target.value })} required />
          <input style={inp} placeholder="N° (SIT-…)" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} required />
          <input style={inp} placeholder="Cumul %" type="number" value={f.cumulPct} onChange={(e) => setF({ ...f, cumulPct: e.target.value })} />
          <input style={inp} placeholder="Montant HT" type="number" value={f.montantHT} onChange={(e) => setF({ ...f, montantHT: e.target.value })} />
          <select style={inp} value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value })}>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select>
          <button type="submit" style={{ padding: "9px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}><Plus size={15} /></button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>N°</th><th style={{ padding: 12 }}>Chantier</th><th style={{ padding: 12 }}>Cumul</th><th style={{ padding: 12 }}>Montant HT</th><th style={{ padding: 12 }}>Retenue 10%</th><th style={{ padding: 12 }}>Net à payer</th><th style={{ padding: 12 }}>Statut</th><th></th></tr></thead>
            <tbody>
              {rows.map((s) => {
                const ht = Number(s.montantHT);
                const ret = Math.round(ht * Number(s.retenuePct) / 100);
                return (
                  <tr key={s.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{s.numero}</td>
                    <td style={{ padding: 12 }}>{s.chantier}</td>
                    <td style={{ padding: 12 }}>{s.cumulPct}%</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(ht)}</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap", color: C.red }}>− {fcfa(ret)}</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap", fontWeight: 700 }}>{fcfa(ht - ret)}</td>
                    <td style={{ padding: 12 }}><StatutBadge s={s.statut} /></td>
                    <td style={{ padding: 12, textAlign: "right" }}><button onClick={() => del(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 16, color: C.steelSoft }}>Aucune situation.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
