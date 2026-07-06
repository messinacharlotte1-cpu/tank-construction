import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type R = { id: string; chantier: string; localisation: string | null; description: string; entreprise: string | null; statut: string; echeance: string | null };

export default function ReservesLive() {
  const [rows, setRows] = useState<R[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ chantier: "", localisation: "", description: "", entreprise: "", echeance: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("reserves").select("id,chantier,localisation,description,entreprise,statut,echeance").order("createdAt", { ascending: false });
    if (error) setErr(error.message); else setRows((data as R[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("reserves").insert({ id: crypto.randomUUID(), tenantId: tid, chantier: f.chantier, localisation: f.localisation || null, description: f.description, entreprise: f.entreprise || null, statut: "Ouverte", echeance: f.echeance || null, createdAt: new Date().toISOString() });
    if (error) return setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle)." : error.message);
    setF({ chantier: "", localisation: "", description: "", entreprise: "", echeance: "" }); void load();
  }
  async function toggle(r: R) {
    const statut = r.statut === "Ouverte" ? "Levée" : "Ouverte";
    setRows((x) => x.map((y) => y.id === r.id ? { ...y, statut } : y));
    await supabase.from("reserves").update({ statut }).eq("id", r.id);
  }
  async function del(id: string) { const { error } = await supabase.from("reserves").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const ouvertes = rows.filter((r) => r.statut === "Ouverte").length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ fontSize: 13, color: C.steelSoft }}>Réserves OPR — <b>{ouvertes}</b> ouverte(s) / {rows.length} au total. Levée = corrigée et acceptée.</div>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.2fr 1fr", gap: 10 }}>
            <input style={inp} placeholder="Chantier" value={f.chantier} onChange={(e) => setF({ ...f, chantier: e.target.value })} required />
            <input style={inp} placeholder="Localisation" value={f.localisation} onChange={(e) => setF({ ...f, localisation: e.target.value })} />
            <input style={inp} placeholder="Entreprise" value={f.entreprise} onChange={(e) => setF({ ...f, entreprise: e.target.value })} />
            <input style={inp} type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
            <input style={inp} placeholder="Description de la réserve" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required />
            <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter</button>
          </div>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => {
            const levee = r.statut === "Levée";
            return (
              <Card key={r.id} style={{ borderLeft: `4px solid ${levee ? C.green : C.red}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => toggle(r)} title="Lever / rouvrir" style={{ background: "none", border: "none", cursor: "pointer", color: levee ? C.green : C.steelSoft }}>{levee ? <CheckCircle2 size={22} /> : <Circle size={22} />}</button>
                  <div>
                    <div style={{ fontWeight: 600, color: C.steel }}>{r.description}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{r.chantier}{r.localisation ? ` · ${r.localisation}` : ""}{r.entreprise ? ` · ${r.entreprise}` : ""}{r.echeance ? ` · échéance ${new Date(r.echeance).toLocaleDateString("fr-FR")}` : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: levee ? C.green : C.red, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{r.statut}</span>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucune réserve.</div>}
        </div>
      )}
    </div>
  );
}
