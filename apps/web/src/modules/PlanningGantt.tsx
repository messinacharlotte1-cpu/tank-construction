import { useEffect, useState } from "react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Ch = { id: string; nom: string };
type Tache = { id: string; nom: string; lot: string; pct: number };

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
  useEffect(() => {
    if (!cid) return;
    supabase.from("taches").select("id,nom,lot,pct").eq("chantierId", cid).order("lot").then(({ data }) => setTaches((data as Tache[]) ?? []));
  }, [cid]);

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;
  const lots = [...new Set(taches.map((t) => t.lot))];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft }}>Chantier</label>
        <select style={{ ...inp, marginTop: 6, width: "100%", maxWidth: 400 }} value={cid} onChange={(e) => setCid(e.target.value)}>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </Card>
      {lots.map((lot) => (
        <Card key={lot}>
          <div style={{ fontFamily: FONTS.condensed, fontWeight: 700, textTransform: "uppercase", color: C.steel, marginBottom: 10 }}>{lot}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {taches.filter((t) => t.lot === lot).map((t) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 44px", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.steel }}>{t.nom}</span>
                <div style={{ background: C.concrete, borderRadius: 6, height: 22, position: "relative", overflow: "hidden" }}>
                  <div style={{ width: `${t.pct}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${Number(t.pct) >= 100 ? C.green : C.orange} 0 12px, ${Number(t.pct) >= 100 ? "#1a8f4e" : "#d95f16"} 12px 24px)`, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.steelSoft, textAlign: "right" }}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {taches.length === 0 && <div style={{ color: C.steelSoft }}>Aucune tâche. Ajoutez-en via Chantiers → Tâches &amp; jalons.</div>}
    </div>
  );
}
