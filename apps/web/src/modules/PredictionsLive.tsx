import { useEffect, useState } from "react";
import { Sparkles, TrendingDown, Clock, Wallet, PackageX } from "lucide-react";
import { C, Card, SectionTitle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Predic = { icon: typeof Sparkles; titre: string; detail: string; conf: string; col: string };
// Badge de gravité selon la couleur de la prédiction.
const GRAV: Record<string, [string, string, string]> = {
  [C.red]: [C.redSoft, C.red, "Haute"],
  [C.orange]: [C.orangeSoft, C.orange, "Moyenne"],
  [C.amber]: [C.amberSoft, C.amber, "Faible"],
};

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
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Sparkles}>Prédictions &amp; alertes IA</SectionTitle>
      <div style={{ fontSize: 13, color: C.steelSoft }}>
        Le moteur croise pointages, stocks, avancement et historique de paiement pour anticiper au lieu de constater. Chaque prédiction indique son niveau de confiance (règles v1 — pas de ML).
      </div>
      {preds.length === 0 && <Card style={{ color: C.green }}>✔ Aucun signal d'alerte détecté. Tous les indicateurs sont au vert.</Card>}
      <div style={{ display: "grid", gap: 12 }}>
        {preds.map((p, i) => {
          const [bg, fg, lab] = GRAV[p.col] ?? [C.concrete, C.steelSoft, "Info"];
          return (
            <Card key={i} style={{ borderLeft: `4px solid ${p.col}`, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <b style={{ fontSize: 14.5, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><p.icon size={18} color={p.col} /> {p.titre}</b>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ background: bg, color: fg, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase" }}>{lab}</span>
                  <span style={{ fontSize: 12, color: C.steelSoft }}>confiance <b style={{ color: C.steel }}>{p.conf}</b></span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.steel }}>{p.detail}</div>
            </Card>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: C.steelSoft }}>
        Prédictions statistiques indicatives — la décision reste humaine. Modèles sur les données de l'entreprise uniquement (aucune donnée partagée entre clients de la plateforme).
      </div>
    </div>
  );
}
