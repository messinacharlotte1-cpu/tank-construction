import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, ListChecks, Flag } from "lucide-react";
import { C, FONTS, Card, Progress } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Tache = { id: string; nom: string; lot: string; pct: number };
type Jalon = { id: string; libelle: string; valide: boolean; valideLe: string | null };

export default function ChantierDetail({ chantier, onBack }: { chantier: { id: string; nom: string }; onBack: () => void }) {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ft, setFt] = useState({ nom: "", lot: "Gros œuvre", pct: "0" });
  const [fj, setFj] = useState("");

  async function load() {
    const [t, j] = await Promise.all([
      supabase.from("taches").select("id,nom,lot,pct").eq("chantierId", chantier.id).order("lot"),
      supabase.from("jalons").select("id,libelle,valide,valideLe").eq("chantierId", chantier.id).order("libelle"),
    ]);
    if (t.error) setErr(t.error.message); else setTaches((t.data as Tache[]) ?? []);
    setJalons((j.data as Jalon[]) ?? []);
  }
  useEffect(() => { void load(); }, [chantier.id]);

  async function addTache(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("taches").insert({ id: crypto.randomUUID(), chantierId: chantier.id, nom: ft.nom, lot: ft.lot, pct: Number(ft.pct) || 0 });
    if (error) return setErr(error.message);
    setFt({ nom: "", lot: ft.lot, pct: "0" }); void load();
  }
  async function setPct(t: Tache, pct: number) { setTaches((r) => r.map((x) => x.id === t.id ? { ...x, pct } : x)); await supabase.from("taches").update({ pct }).eq("id", t.id); }
  async function delTache(id: string) { await supabase.from("taches").delete().eq("id", id); setTaches((r) => r.filter((x) => x.id !== id)); }

  async function addJalon(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("jalons").insert({ id: crypto.randomUUID(), chantierId: chantier.id, libelle: fj, valide: false });
    if (error) return setErr(error.message);
    setFj(""); void load();
  }
  async function toggleJalon(j: Jalon) {
    const valide = !j.valide;
    setJalons((r) => r.map((x) => x.id === j.id ? { ...x, valide, valideLe: valide ? new Date().toISOString() : null } : x));
    await supabase.from("jalons").update({ valide, valideLe: valide ? new Date().toISOString() : null }).eq("id", j.id);
  }
  async function delJalon(id: string) { await supabase.from("jalons").delete().eq("id", id); setJalons((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const avg = taches.length ? Math.round(taches.reduce((s, t) => s + Number(t.pct), 0) / taches.length) : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Chantiers</button>
        <div style={{ fontWeight: 700, color: C.steel }}>{chantier.nom} — avancement moyen tâches : {avg}%</div>
      </div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", color: C.steel, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><ListChecks size={18} color={C.orange} /> Tâches</div>
          <form onSubmit={addTache} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.7fr auto", gap: 8, marginBottom: 12 }}>
            <input style={inp} placeholder="Tâche" value={ft.nom} onChange={(e) => setFt({ ...ft, nom: e.target.value })} required />
            <input style={inp} placeholder="Lot" value={ft.lot} onChange={(e) => setFt({ ...ft, lot: e.target.value })} />
            <input style={inp} type="number" min="0" max="100" value={ft.pct} onChange={(e) => setFt({ ...ft, pct: e.target.value })} />
            <button type="submit" style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: C.orange, color: C.white, cursor: "pointer" }}><Plus size={15} /></button>
          </form>
          <div style={{ display: "grid", gap: 10 }}>
            {taches.map((t) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "center" }}>
                <div><div style={{ fontWeight: 600, color: C.steel, fontSize: 14 }}>{t.nom}</div><div style={{ fontSize: 12, color: C.steelSoft }}>{t.lot}</div><Progress pct={Number(t.pct)} /></div>
                <input style={{ ...inp, padding: "5px 8px" }} type="number" min="0" max="100" value={t.pct} onChange={(e) => setPct(t, Number(e.target.value))} />
                <button onClick={() => delTache(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={15} /></button>
              </div>
            ))}
            {taches.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucune tâche.</div>}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", color: C.steel, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><Flag size={18} color={C.orange} /> Jalons</div>
          <div style={{ fontSize: 11, color: C.steelSoft, marginBottom: 10 }}>Un jalon validé (constat contradictoire) débloque l'appel de fonds VEFA.</div>
          <form onSubmit={addJalon} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Nouveau jalon" value={fj} onChange={(e) => setFj(e.target.value)} required />
            <button type="submit" style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: C.orange, color: C.white, cursor: "pointer" }}><Plus size={15} /></button>
          </form>
          <div style={{ display: "grid", gap: 8 }}>
            {jalons.map((j) => (
              <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => toggleJalon(j)} title="Valider / invalider" style={{ background: "none", border: "none", cursor: "pointer", color: j.valide ? C.green : C.steelSoft }}>{j.valide ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, color: C.steel, fontWeight: j.valide ? 700 : 400 }}>{j.libelle}</div>{j.valide && j.valideLe && <div style={{ fontSize: 11, color: C.green }}>validé le {new Date(j.valideLe).toLocaleDateString("fr-FR")}</div>}</div>
                <button onClick={() => delJalon(j.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
              </div>
            ))}
            {jalons.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun jalon.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
