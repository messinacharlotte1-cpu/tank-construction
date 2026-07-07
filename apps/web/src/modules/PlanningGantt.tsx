import { useEffect, useState } from "react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Ch = { id: string; nom: string };
type Tache = { id: string; nom: string; lot: string; pct: number; debut: string | null; duree: number | null; dependance: string | null };

const DAY = 864e5;

export default function PlanningGantt() {
  const [chantiers, setChantiers] = useState<Ch[]>([]);
  const [cid, setCid] = useState("");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chantiers").select("id,nom").order("nom");
      const l = (data as Ch[]) ?? []; setChantiers(l); if (l[0]) setCid(l[0].id); setLoading(false);
    })();
  }, []);
  async function load(c: string) {
    const { data } = await supabase.from("taches").select("id,nom,lot,pct,debut,duree,dependance").eq("chantierId", c).order("debut", { nullsFirst: false });
    setTaches((data as Tache[]) ?? []);
  }
  useEffect(() => { if (cid) void load(cid); }, [cid]);

  async function save(t: Tache, patch: Partial<Tache>) {
    setTaches((r) => r.map((x) => x.id === t.id ? { ...x, ...patch } : x));
    await supabase.from("taches").update(patch).eq("id", t.id);
  }

  const inp: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONTS.sans };
  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  const dated = taches.filter((t) => t.debut && t.duree);
  const starts = dated.map((t) => new Date(t.debut!).getTime());
  const ends = dated.map((t) => new Date(t.debut!).getTime() + Number(t.duree) * DAY);
  const min = starts.length ? Math.min(...starts) : Date.now();
  const max = ends.length ? Math.max(...ends) : min + 30 * DAY;
  const span = Math.max(max - min, DAY);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft }}>Chantier</label>
        <select style={{ ...inp, marginTop: 6, width: "100%", maxWidth: 400 }} value={cid} onChange={(e) => setCid(e.target.value)}>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>Renseignez début + durée pour placer les barres. Dépendance = nom de la tâche précédente.</div>
      </Card>

      <Card style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 6, minWidth: 160 }}>Tâche</th><th style={{ padding: 6 }}>Début</th><th style={{ padding: 6 }}>Jours</th><th style={{ padding: 6 }}>Dépend.</th><th style={{ padding: 6, width: "45%" }}>Planning</th></tr></thead>
          <tbody>
            {taches.map((t) => {
              const has = t.debut && t.duree;
              const left = has ? ((new Date(t.debut!).getTime() - min) / span) * 100 : 0;
              const width = has ? (Number(t.duree) * DAY / span) * 100 : 0;
              return (
                <tr key={t.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 6 }}><div style={{ fontWeight: 600, color: C.steel }}>{t.nom}</div><div style={{ fontSize: 11, color: C.steelSoft }}>{t.lot}</div></td>
                  <td style={{ padding: 6 }}><input style={inp} type="date" value={t.debut ? t.debut.slice(0, 10) : ""} onChange={(e) => save(t, { debut: e.target.value ? new Date(e.target.value).toISOString() : null })} /></td>
                  <td style={{ padding: 6, width: 70 }}><input style={inp} type="number" min="1" value={t.duree ?? ""} onChange={(e) => save(t, { duree: e.target.value ? Number(e.target.value) : null })} /></td>
                  <td style={{ padding: 6, width: 120 }}><input style={inp} placeholder="—" value={t.dependance ?? ""} onChange={(e) => save(t, { dependance: e.target.value || null })} /></td>
                  <td style={{ padding: 6 }}>
                    <div style={{ position: "relative", height: 22, background: C.concrete, borderRadius: 6 }}>
                      {has && <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%", background: Number(t.pct) >= 100 ? C.green : C.orange, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${t.pct}%`, height: "100%", background: "rgba(0,0,0,.18)" }} /></div>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {taches.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucune tâche. Ajoutez-en via Chantiers → Tâches &amp; jalons.</td></tr>}
          </tbody>
        </table>
        {dated.length > 0 && <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 8 }}>Échelle : {new Date(min).toLocaleDateString("fr-FR")} → {new Date(max).toLocaleDateString("fr-FR")}</div>}
      </Card>
    </div>
  );
}
