import { useEffect, useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; nom: string; type: string | null; statut: string; prochainEntretien: string | null };
const LABEL: Record<string, [string, string]> = { DISPONIBLE: ["Disponible", C.green], EN_SERVICE: ["En service", C.orange], MAINTENANCE: ["Maintenance", C.red] };
const NEXT: Record<string, string> = { DISPONIBLE: "EN_SERVICE", EN_SERVICE: "MAINTENANCE", MAINTENANCE: "DISPONIBLE" };

export default function MaterielLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ nom: "", type: "Engin" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("materiels").select("id,nom,type,statut,prochainEntretien").order("nom");
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("materiels").insert({ id: crypto.randomUUID(), tenantId: tid, nom: f.nom, type: f.type, statut: "DISPONIBLE", createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setF({ nom: "", type: "Engin" }); void load();
  }
  async function cycle(r: Row) { const s = NEXT[r.statut]; setRows((x) => x.map((y) => y.id === r.id ? { ...y, statut: s } : y)); await supabase.from("materiels").update({ statut: s }).eq("id", r.id); }
  async function del(id: string) { const { error } = await supabase.from("materiels").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom matériel" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <select style={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["Engin", "Véhicule", "Outillage"].map((t) => <option key={t}>{t}</option>)}</select>
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {rows.map((r) => {
            const [lab, col] = LABEL[r.statut] ?? [r.statut, C.steelSoft];
            const ent = r.prochainEntretien ? new Date(r.prochainEntretien) : null;
            const soon = ent && (ent.getTime() - Date.now()) < 30 * 864e5;
            return (
              <Card key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <b style={{ color: C.steel, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={16} color={C.orange} /> {r.nom}</b>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
                </div>
                <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{r.type}</div>
                {ent && <div style={{ fontSize: 12, color: soon ? C.red : C.steelSoft, marginTop: 6 }}>Entretien : {ent.toLocaleDateString("fr-FR")}{soon ? " ⚠" : ""}</div>}
                <button onClick={() => cycle(r)} style={{ marginTop: 10, background: col, color: C.white, border: "none", borderRadius: 999, padding: "3px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>{lab}</button>
              </Card>
            );
          })}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucun matériel.</div>}
        </div>
      )}
    </div>
  );
}
