import { useEffect, useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { C, FONTS, Card, SectionTitle, miniLabel } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; nom: string; type: string | null; statut: string; prochainEntretien: string | null };
// [libellé, couleur texte, fond pastille]
const LABEL: Record<string, [string, string, string]> = {
  DISPONIBLE: ["Disponible", C.green, C.greenSoft],
  EN_SERVICE: ["En service", C.amber, C.amberSoft],
  MAINTENANCE: ["Maintenance", C.red, C.redSoft],
};
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
  const count = (st: string) => rows.filter((r) => r.statut === st).length;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Wrench}>Matériel &amp; engins</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {(["DISPONIBLE", "EN_SERVICE", "MAINTENANCE"] as const).map((st) => {
          const [lab, fg] = LABEL[st];
          return (
            <Card key={st} style={{ padding: 16, borderLeft: `4px solid ${fg}` }}>
              <div style={miniLabel}>{lab}</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 36, fontWeight: 700, color: fg }}>{count(st)}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom matériel" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <select style={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["Engin", "Véhicule", "Outillage"].map((t) => <option key={t}>{t}</option>)}</select>
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
                {["Équipement", "Type", "Statut", "Prochain entretien"].map((h) => <th key={h} style={{ padding: "10px 14px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, fontSize: 12 }}>{h}</th>)}<th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const [lab, fg, bg] = LABEL[r.statut] ?? [r.statut, C.steelSoft, C.concrete];
                const ent = r.prochainEntretien ? new Date(r.prochainEntretien) : null;
                const soon = ent && (ent.getTime() - Date.now()) < 30 * 864e5;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.steel }}><Wrench size={14} color={C.orange} style={{ verticalAlign: -2, marginRight: 6 }} />{r.nom}</td>
                    <td style={{ padding: "10px 14px", color: C.steelSoft }}>{r.type}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <button onClick={() => cycle(r)} style={{ background: bg, color: fg, border: "none", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{lab}</button>
                    </td>
                    <td style={{ padding: "10px 14px", color: soon ? C.red : C.steelSoft }}>{ent ? `${ent.toLocaleDateString("fr-FR")}${soon ? " ⚠" : ""}` : "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}><button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucun matériel.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
