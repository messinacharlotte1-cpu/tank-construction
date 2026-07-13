import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Scale, FileText } from "lucide-react";
import { C, FONTS, Card, SectionTitle, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Bpu = { id: string; code: string; designation: string; unite: string; puBase: number; categorie: string | null };
// Coefficients régionaux (base Yaoundé = 1).
const COEF_REGION: Record<string, number> = { "Yaoundé": 1, "Douala": 1.06, "Kribi": 1.09, "Bafoussam": 1.04, "Garoua": 1.15 };

export default function AoBpuLive() {
  const [rows, setRows] = useState<Bpu[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [region, setRegion] = useState("Yaoundé");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ code: "", designation: "", unite: "m³", puBase: "", categorie: "Gros œuvre" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("bpu_ouvrages").select("id,code,designation,unite,puBase,categorie").order("code");
    if (error) setErr(error.message); else setRows((data as Bpu[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("bpu_ouvrages").insert({ id: crypto.randomUUID(), tenantId: tid, code: f.code, designation: f.designation, unite: f.unite, puBase: Number(f.puBase) || 0, categorie: f.categorie });
    if (error) return setErr(error.message);
    setF({ code: "", designation: "", unite: "m³", puBase: "", categorie: "Gros œuvre" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("bpu_ouvrages").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const coef = COEF_REGION[region];
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={FileText}>Appels d'offres &amp; bibliothèque de prix</SectionTitle>
      <Card style={{ borderLeft: `4px solid ${C.orange}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Scale size={16} color={C.orange} /><b style={{ color: C.steel }}>Coefficient régional</b></div>
        <select style={inp} value={region} onChange={(e) => setRegion(e.target.value)}>{Object.keys(COEF_REGION).map((r) => <option key={r}>{r}</option>)}</select>
        <span style={{ color: C.steelSoft, fontSize: 13 }}>× {coef} (base Yaoundé)</span>
        <button onClick={() => alert("Import DPGF simulé — mapping des lignes à venir (P3).")} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Upload size={15} /> Importer DPGF</button>
      </Card>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.8fr 1.1fr 1.2fr auto", gap: 10 }}>
          <input style={inp} placeholder="Code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} required />
          <input style={inp} placeholder="Désignation" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} required />
          <input style={inp} placeholder="Unité" value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })} />
          <input style={inp} placeholder="PU base FCFA" type="number" value={f.puBase} onChange={(e) => setF({ ...f, puBase: e.target.value })} />
          <select style={inp} value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>{["Gros œuvre", "Second œuvre", "Finitions"].map((c) => <option key={c}>{c}</option>)}</select>
          <button type="submit" style={{ padding: "9px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}><Plus size={15} /></button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>{["Code", "Désignation", "Unité", "PU base", `PU ${region}`].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.code}</td>
                  <td style={{ padding: 12 }}>{r.designation}<div style={{ fontSize: 11, color: C.steelSoft }}>{r.categorie}</div></td>
                  <td style={{ padding: 12 }}>{r.unite}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(r.puBase))}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap", fontWeight: 700, color: C.orange }}>{fcfa(Math.round(Number(r.puBase) * coef))}</td>
                  <td style={{ padding: 12, textAlign: "right" }}><button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Bibliothèque vide.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
