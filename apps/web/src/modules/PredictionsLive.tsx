import { useEffect, useState } from "react";
import { Sparkles, TrendingDown, Clock, Wallet, PackageX } from "lucide-react";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Predic = { icon: typeof Sparkles; titre: string; detail: string; conf: string; col: string };

// V1 = règles + stats simples (pas de ML, cf. README §7). Étiqueté "estimation".
export default function PredictionsLive() {
  const [preds, setPreds] = useState<Predic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: ar }, { data: fa }] = await Promise.all([
        supabase.from("chantiers").select("nom,budget,consomme,avancementPrevu,avancementReel,statut"),
        supabase.from("articles").select("designation,stock,seuil"),
        supabase.from("factures").select("ttc,statut"),
      ]);
      const out: Predic[] = [];
      for (const a of ar ?? []) if (Number(a.stock) < Number(a.seuil)) out.push({ icon: PackageX, titre: `Rupture stock : ${a.designation}`, detail: `Stock ${a.stock} < seuil ${a.seuil}. Réappro conseillée.`, conf: "élevée", col: C.red });
      for (const c of ch ?? []) {
        const b = Number(c.budget), co = Number(c.consomme);
        const consoPct = b ? Math.round((co / b) * 100) : 0;
        const av = Number(c.avancementReel);
        if (consoPct - av > 10) out.push({ icon: TrendingDown, titre: `Dérive budget : ${c.nom}`, detail: `Consommé ${consoPct}% vs avancement ${av}%. Écart ${consoPct - av} pts.`, conf: "moyenne", col: C.orange });
        if (av < Number(c.avancementPrevu) - 5 && c.statut !== "TERMINE") out.push({ icon: Clock, titre: `Retard probable : ${c.nom}`, detail: `Réel ${av}% < prévu ${c.avancementPrevu}%.`, conf: "moyenne", col: C.amber });
      }
      const impaye = (fa ?? []).filter((f) => f.statut === "Impayée").reduce((s, f) => s + Number(f.ttc), 0);
      if (impaye > 0) out.push({ icon: Wallet, titre: "Tension trésorerie", detail: `${fcfa(impaye)} de factures impayées. Relancer les payeurs.`, conf: "élevée", col: C.red });
      setPreds(out);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Analyse…</div>;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.steelSoft, fontSize: 13 }}>
        <Sparkles size={16} color={C.orange} /> Estimations par règles (v1, pas de ML). Fiabilité = qualité des données.
      </div>
      {preds.length === 0 && <Card style={{ color: C.green }}>✔ Aucun signal d'alerte détecté.</Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 14 }}>
        {preds.map((p, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${p.col}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.steel }}><p.icon size={18} color={p.col} /> {p.titre}</div>
            <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 6 }}>{p.detail}</div>
            <div style={{ marginTop: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: C.steelSoft }}>Estimation · confiance {p.conf}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
