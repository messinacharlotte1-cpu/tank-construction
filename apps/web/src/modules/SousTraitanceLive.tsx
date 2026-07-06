import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; nom: string; corpsEtat: string; chantier: string | null; montantMarche: number; retenueGarantiePct: number };

export default function SousTraitanceLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ nom: "", corpsEtat: "", chantier: "", montantMarche: "", retenueGarantiePct: "5" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("sous_traitants").select("id,nom,corpsEtat,chantier,montantMarche,retenueGarantiePct").order("nom");
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("sous_traitants").insert({ id: crypto.randomUUID(), tenantId: tid, nom: f.nom, corpsEtat: f.corpsEtat, chantier: f.chantier || null, montantMarche: Number(f.montantMarche) || 0, retenueGarantiePct: Number(f.retenueGarantiePct) || 0, createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setF({ nom: "", corpsEtat: "", chantier: "", montantMarche: "", retenueGarantiePct: "5" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("sous_traitants").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.4fr 1.2fr 0.8fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom sous-traitant" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <input style={inp} placeholder="Corps d'état" value={f.corpsEtat} onChange={(e) => setF({ ...f, corpsEtat: e.target.value })} required />
          <input style={inp} placeholder="Chantier" value={f.chantier} onChange={(e) => setF({ ...f, chantier: e.target.value })} />
          <input style={inp} placeholder="Marché FCFA" type="number" value={f.montantMarche} onChange={(e) => setF({ ...f, montantMarche: e.target.value })} />
          <input style={inp} placeholder="Ret. %" type="number" value={f.retenueGarantiePct} onChange={(e) => setF({ ...f, retenueGarantiePct: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /></button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Sous-traitant</th><th style={{ padding: 12 }}>Corps d'état</th><th style={{ padding: 12 }}>Chantier</th><th style={{ padding: 12 }}>Marché</th><th style={{ padding: 12 }}>Retenue garantie</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.nom}</td>
                  <td style={{ padding: 12 }}>{r.corpsEtat}</td>
                  <td style={{ padding: 12 }}>{r.chantier ?? "—"}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(r.montantMarche))}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{r.retenueGarantiePct} % · <b>{fcfa(Math.round(Number(r.montantMarche) * Number(r.retenueGarantiePct) / 100))}</b></td>
                  <td style={{ padding: 12, textAlign: "right" }}><button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Aucun sous-traitant.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
