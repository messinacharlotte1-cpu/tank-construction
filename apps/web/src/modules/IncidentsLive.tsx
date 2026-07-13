import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldAlert, ClipboardCheck, CheckSquare, Square } from "lucide-react";
import { C, FONTS, Card, SectionTitle, Kpi } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; chantier: string | null; date: string; gravite: string; description: string; mesure: string | null };
type Check = { id: string; item: string; ok: boolean; ordre: number };
const GRAV: Record<string, [string, string]> = { MINEUR: ["Mineur", C.amber], MAJEUR: ["Majeur", C.orange], CRITIQUE: ["Critique", C.red] };

export default function IncidentsLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ chantier: "", gravite: "MINEUR", description: "", mesure: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const [inc, ck] = await Promise.all([
      supabase.from("incidents").select("id,chantier,date,gravite,description,mesure").order("date", { ascending: false }),
      supabase.from("securite_checklist").select("id,item,ok,ordre").order("ordre"),
    ]);
    if (inc.error) setErr(inc.error.message); else setRows((inc.data as Row[]) ?? []);
    setChecks((ck.data as Check[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function toggleCheck(c: Check) {
    setChecks((r) => r.map((x) => (x.id === c.id ? { ...x, ok: !x.ok } : x)));
    await supabase.from("securite_checklist").update({ ok: !c.ok, updatedAt: new Date().toISOString() }).eq("id", c.id);
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("incidents").insert({ id: crypto.randomUUID(), tenantId: tid, chantier: f.chantier || null, gravite: f.gravite, description: f.description, mesure: f.mesure || null, date: new Date().toISOString(), createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setF({ chantier: "", gravite: "MINEUR", description: "", mesure: "" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("incidents").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const critiques = rows.filter((r) => r.gravite === "CRITIQUE").length;
  const okCount = checks.filter((c) => c.ok).length;
  const dernier = rows[0] ? Math.floor((Date.now() - new Date(rows[0].date).getTime()) / 86400000) : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={ShieldAlert}>Incidents &amp; Sécurité chantier</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><Kpi label="Incidents enregistrés" value={rows.length} color={rows.length ? C.steel : C.green} sub={`${critiques} critique${critiques > 1 ? "s" : ""}`} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Jours depuis le dernier" value={dernier === null ? "—" : dernier} color={C.green} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Checklist du jour" value={`${okCount}/${checks.length}`} color={checks.length && okCount === checks.length ? C.green : C.amber} /></Card>
      </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
          <Card>
            <SectionTitle icon={ClipboardCheck}>Checklist sécurité journalière</SectionTitle>
            <div style={{ display: "grid", gap: 6 }}>
              {checks.map((c) => (
                <button key={c.id} onClick={() => toggleCheck(c)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", background: c.ok ? C.greenSoft : C.concrete, border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.steel, cursor: "pointer", fontFamily: FONTS.sans }}>
                  {c.ok ? <CheckSquare size={18} color={C.green} /> : <Square size={18} color={C.steelSoft} />}
                  <span style={{ flex: 1 }}>{c.item}</span>
                </button>
              ))}
              {checks.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun item de checklist.</div>}
            </div>
            <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>Signée chaque matin par le chef de chantier avant l'ouverture des travaux (fonctionne hors-ligne).</div>
          </Card>

          <Card>
            <SectionTitle icon={ShieldAlert}>Registre des incidents</SectionTitle>
            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((r) => {
                const [lab, col] = GRAV[r.gravite] ?? [r.gravite, C.steelSoft];
                return (
                  <div key={r.id} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${col}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <span style={{ color: col, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{lab}</span>
                        <span style={{ color: C.steelSoft, fontSize: 12, marginLeft: 8 }}>{new Date(r.date).toLocaleDateString("fr-FR")}{r.chantier ? ` · ${r.chantier}` : ""}</span>
                        <div style={{ marginTop: 4, color: C.steel }}>{r.description}</div>
                        {r.mesure && <div style={{ marginTop: 4, fontSize: 13, color: C.steelSoft }}>Mesure : {r.mesure}</div>}
                      </div>
                      <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, alignSelf: "start" }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucun incident enregistré.</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
