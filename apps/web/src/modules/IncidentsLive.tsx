import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; chantier: string | null; date: string; gravite: string; description: string; mesure: string | null };
const GRAV: Record<string, [string, string]> = { MINEUR: ["Mineur", C.amber], MAJEUR: ["Majeur", C.orange], CRITIQUE: ["Critique", C.red] };

export default function IncidentsLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ chantier: "", gravite: "MINEUR", description: "", mesure: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("incidents").select("id,chantier,date,gravite,description,mesure").order("date", { ascending: false });
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("incidents").insert({ id: crypto.randomUUID(), tenantId: tid, chantier: f.chantier || null, gravite: f.gravite, description: f.description, mesure: f.mesure || null, date: new Date().toISOString(), createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setF({ chantier: "", gravite: "MINEUR", description: "", mesure: "" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("incidents").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><ShieldAlert size={18} color={C.orange} /> Déclarer un incident</div>
        <form onSubmit={create} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
            <input style={inp} placeholder="Chantier" value={f.chantier} onChange={(e) => setF({ ...f, chantier: e.target.value })} />
            <select style={inp} value={f.gravite} onChange={(e) => setF({ ...f, gravite: e.target.value })}>{Object.entries(GRAV).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select>
          </div>
          <input style={inp} placeholder="Description de l'incident" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required />
          <input style={inp} placeholder="Mesure corrective" value={f.mesure} onChange={(e) => setF({ ...f, mesure: e.target.value })} />
          <button type="submit" style={{ justifySelf: "start", padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Enregistrer</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => {
            const [lab, col] = GRAV[r.gravite] ?? [r.gravite, C.steelSoft];
            return (
              <Card key={r.id} style={{ borderLeft: `4px solid ${col}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ color: col, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{lab}</span>
                    <span style={{ color: C.steelSoft, fontSize: 12, marginLeft: 8 }}>{new Date(r.date).toLocaleDateString("fr-FR")}{r.chantier ? ` · ${r.chantier}` : ""}</span>
                    <div style={{ marginTop: 4, color: C.steel }}>{r.description}</div>
                    {r.mesure && <div style={{ marginTop: 4, fontSize: 13, color: C.steelSoft }}>Mesure : {r.mesure}</div>}
                  </div>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, alignSelf: "start" }}><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucun incident enregistré.</div>}
        </div>
      )}
    </div>
  );
}
