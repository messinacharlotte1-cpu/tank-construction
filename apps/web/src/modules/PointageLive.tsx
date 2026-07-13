import { useEffect, useState } from "react";
import { Plus, Trash2, Users, WifiOff, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { C, FONTS, Card, SectionTitle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { queuePointage, pendingCount, flushPointages } from "../lib/offline";
import { paieJour, COEF_POINTAGE } from "../lib/calc";

type Chantier = { id: string; nom: string };
type Pointage = { id: string; ouvrier: string; tarif: number; date: string; statut: string };
// [libellé, couleur texte, fond pastille, icône]
const STATUTS: Record<string, [string, string, string, typeof CheckCircle2]> = {
  P: ["Présent", C.green, C.greenSoft, CheckCircle2],
  DM: ["Demi-journée", C.amber, C.amberSoft, MinusCircle],
  A: ["Absent", C.red, C.redSoft, XCircle],
};
const CYCLE: Record<string, string> = { P: "DM", DM: "A", A: "P" };

export default function PointageLive() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [chantierId, setChantierId] = useState<string>("");
  const [rows, setRows] = useState<Pointage[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ouvrier: "", statut: "P", tarif: "" });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(pendingCount());

  const insertPointage = async (rec: Record<string, unknown>) => {
    const { error } = await supabase.from("pointages").insert(rec as never);
    return { error };
  };

  async function flush() {
    const n = await flushPointages(insertPointage);
    setPending(pendingCount());
    if (n > 0 && chantierId) void loadPointages(chantierId);
  }
  useEffect(() => {
    void flush();
    const on = () => void flush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantierId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chantiers").select("id,nom").order("nom");
      const list = (data as Chantier[]) ?? [];
      setChantiers(list);
      if (list[0]) setChantierId(list[0].id);
      setLoading(false);
    })();
  }, []);

  async function loadPointages(cid: string) {
    if (!cid) return;
    const { data, error } = await supabase.from("pointages").select("id,ouvrier,tarif,date,statut").eq("chantierId", cid).order("ouvrier");
    if (error) setErr(error.message);
    else setRows((data as Pointage[]) ?? []);
  }
  useEffect(() => { if (chantierId) void loadPointages(chantierId); }, [chantierId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!chantierId) return;
    setBusy(true); setErr(null);
    const rec = { id: crypto.randomUUID(), chantierId, ouvrier: form.ouvrier, tarif: Number(form.tarif) || 0, statut: form.statut, date: new Date().toISOString() };
    if (!navigator.onLine) {
      // Offline : mise en file, rejouée à la reconnexion (idempotent via id).
      queuePointage(rec);
      setPending(pendingCount());
      setRows((r) => [...r, rec as never].sort((a, b) => (a as { ouvrier: string }).ouvrier.localeCompare((b as { ouvrier: string }).ouvrier)));
      setBusy(false);
      setForm({ ouvrier: "", statut: "P", tarif: "" });
      return;
    }
    const { error } = await supabase.from("pointages").insert(rec);
    setBusy(false);
    if (error) { queuePointage(rec); setPending(pendingCount()); setErr("Hors-ligne ? Pointage mis en file."); return; }
    setForm({ ouvrier: "", statut: "P", tarif: "" });
    void loadPointages(chantierId);
  }
  async function remove(id: string) {
    const { error } = await supabase.from("pointages").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }
  // Touchez le statut pour le modifier : Présent → Demi-journée → Absent.
  async function cycle(p: Pointage) {
    const next = CYCLE[p.statut] ?? "P";
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, statut: next } : x)));
    await supabase.from("pointages").update({ statut: next }).eq("id", p.id);
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;
  if (chantiers.length === 0) return <div style={{ color: C.steelSoft }}>Aucun chantier — créez-en un d'abord.</div>;

  const presents = rows.filter((p) => p.statut === "P").length + rows.filter((p) => p.statut === "DM").length * 0.5;
  const cout = paieJour(rows);
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Users} action={
        <div style={{ fontSize: 13, color: C.steelSoft }}>
          <b style={{ color: C.steel }}>{presents}/{rows.length}</b> présents · Coût du jour : <b style={{ color: C.orange }}>{fcfa(cout)}</b>
        </div>
      }>Pointage journalier — {today}</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel }}>
        <WifiOff size={16} color={C.amber} /> Le pointage fonctionne hors-ligne. Touchez le statut pour le modifier (Présent → Demi-journée → Absent).
      </div>

      <Card>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft }}>Chantier</label>
        <select style={{ ...input, marginTop: 6, width: "100%" }} value={chantierId} onChange={(e) => setChantierId(e.target.value)}>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.2fr auto", gap: 10, marginTop: 14 }}>
          <input style={input} placeholder="Nom de l'ouvrier" value={form.ouvrier} onChange={(e) => setForm({ ...form, ouvrier: e.target.value })} required />
          <select style={input} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
          </select>
          <input style={input} placeholder="Tarif/jour FCFA" type="number" value={form.tarif} onChange={(e) => setForm({ ...form, tarif: e.target.value })} />
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> {busy ? "…" : "Pointer"}
          </button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {pending > 0 && <Card style={{ borderColor: C.amber, color: "#8a6d00", background: C.amberSoft }}>⚠ {pending} pointage(s) en file hors-ligne — synchronisation automatique à la reconnexion.</Card>}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Ouvrier", "Date", "Tarif/j", "Statut", "Paie du jour"].map((h) => <th key={h} style={{ padding: "10px 14px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const [label, fg, bg, Icon] = STATUTS[p.statut] ?? ["?", C.steelSoft, C.concrete, XCircle];
              const paie = Number(p.tarif) * (COEF_POINTAGE[p.statut] ?? 0);
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: C.steel }}>{p.ouvrier}</td>
                  <td style={{ padding: "10px 14px", color: C.steelSoft }}>{new Date(p.date).toLocaleDateString("fr-FR")}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{fcfa(Number(p.tarif))}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <button onClick={() => cycle(p)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: fg, border: "none", borderRadius: 999, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      <Icon size={14} /> {label}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", fontWeight: 700, color: paie ? C.steel : C.steelSoft }}>{fcfa(paie)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button onClick={() => remove(p.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Aucun pointage pour ce chantier.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
