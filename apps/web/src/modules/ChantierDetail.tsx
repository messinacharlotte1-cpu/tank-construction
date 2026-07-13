import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, ListChecks, Flag, ClipboardCheck, Image as ImageIcon, MapPin, Users } from "lucide-react";
import { C, FONTS, Card, Progress, Hazard, Kpi, StatutBadge, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Tache = { id: string; nom: string; lot: string; pct: number };
type Jalon = { id: string; libelle: string; valide: boolean; valideLe: string | null };
type Reserve = { id: string; description: string; localisation: string | null; statut: string };
type Media = { id: string; nom: string; url: string };

const TABS = [
  { id: "chantier", label: "Tâches & jalons", icon: ListChecks },
  { id: "reserves", label: "Réserves", icon: ClipboardCheck },
  { id: "medias", label: "Plans / Photos", icon: ImageIcon },
];

const STATUT_LABEL: Record<string, string> = {
  EN_PREPARATION: "En préparation", EN_COURS: "En cours", EN_RETARD: "En retard", SUSPENDU: "Suspendu", TERMINE: "Terminé",
};

type ChantierHead = {
  id: string; nom: string; client?: string; ville?: string; statut?: string;
  budget?: number; consomme?: number; avancementReel?: number; avancementPrevu?: number;
};

export default function ChantierDetail({ chantier, onBack }: { chantier: ChantierHead; onBack: () => void }) {
  const [tab, setTab] = useState("chantier");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ft, setFt] = useState({ nom: "", lot: "Gros œuvre", pct: "0" });
  const [fj, setFj] = useState("");

  async function load() {
    const [t, j, r, m] = await Promise.all([
      supabase.from("taches").select("id,nom,lot,pct").eq("chantierId", chantier.id).order("lot"),
      supabase.from("jalons").select("id,libelle,valide,valideLe").eq("chantierId", chantier.id).order("libelle"),
      supabase.from("reserves").select("id,description,localisation,statut").eq("chantier", chantier.nom).order("createdAt", { ascending: false }),
      supabase.from("medias").select("id,nom,url").eq("chantier", chantier.nom).order("createdAt", { ascending: false }),
    ]);
    setReserves((r.data as Reserve[]) ?? []);
    setMedias((m.data as Media[]) ?? []);
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
  const budget = Number(chantier.budget ?? 0), consomme = Number(chantier.consomme ?? 0);
  const budgetPct = budget ? Math.round((consomme / budget) * 100) : 0;
  const aReel = Number(chantier.avancementReel ?? avg), aPrevu = Number(chantier.avancementPrevu ?? 0);
  const enRetard = aReel < aPrevu - 5;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button onClick={onBack} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Retour aux chantiers</button>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{chantier.nom}</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 13, color: C.steelSoft }}>
                {chantier.client && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={14} /> {chantier.client}</span>}
                {chantier.ville && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {chantier.ville}</span>}
              </div>
            </div>
            {chantier.statut && <StatutBadge s={STATUT_LABEL[chantier.statut] ?? chantier.statut} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 16 }}>
            <Kpi label="Avancement réel / prévu" value={<>{aReel} % <span style={{ fontSize: 15, color: C.steelSoft }}>/ {aPrevu} %</span></>} color={enRetard ? C.red : C.green} pct={aReel} pctColor={enRetard ? C.red : C.green} />
            {budget > 0 && <Kpi label="Budget consommé" value={`${budgetPct} %`} color={budgetPct > 90 ? C.red : C.steel} sub={`${fcfa(consomme)} / ${fcfa(budget)}`} />}
            <Kpi label="Avancement moyen tâches" value={`${avg} %`} sub={`${taches.length} tâche${taches.length > 1 ? "s" : ""}`} />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", borderBottom: tab === t.id ? `3px solid ${C.orange}` : "3px solid transparent", padding: "8px 14px", cursor: "pointer", color: tab === t.id ? C.orange : C.steelSoft, fontWeight: 700, fontSize: 13.5, fontFamily: FONTS.sans }}>
            <t.icon size={16} /> {t.label}{t.id === "reserves" && reserves.length ? ` (${reserves.filter((r) => r.statut !== "Levée").length})` : ""}{t.id === "medias" && medias.length ? ` (${medias.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "reserves" && (
        <div style={{ display: "grid", gap: 8 }}>
          {reserves.map((r) => (
            <Card key={r.id} style={{ borderLeft: `4px solid ${r.statut === "Levée" ? C.green : C.red}`, display: "flex", justifyContent: "space-between" }}>
              <div><div style={{ fontWeight: 600, color: C.steel }}>{r.description}</div><div style={{ fontSize: 12, color: C.steelSoft }}>{r.localisation ?? ""}</div></div>
              <span style={{ color: r.statut === "Levée" ? C.green : C.red, fontWeight: 700, fontSize: 12 }}>{r.statut}</span>
            </Card>
          ))}
          {reserves.length === 0 && <div style={{ color: C.steelSoft }}>Aucune réserve. Gérer dans Opérations → Réserves.</div>}
        </div>
      )}

      {tab === "medias" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12 }}>
          {medias.map((m) => (
            <Card key={m.id} style={{ padding: 0, overflow: "hidden" }}>
              <img src={m.url} alt={m.nom} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
              <div style={{ padding: 8, fontSize: 12, color: C.steel }}>{m.nom}</div>
            </Card>
          ))}
          {medias.length === 0 && <div style={{ color: C.steelSoft }}>Aucun plan/photo. Ajouter dans Opérations → Plans / Photos.</div>}
        </div>
      )}

      {tab === "chantier" && (
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
      )}
    </div>
  );
}
