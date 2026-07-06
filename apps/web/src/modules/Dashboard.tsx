import { useEffect, useState } from "react";
import { HardHat, CircleDollarSign, FileText, Package } from "lucide-react";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Kpi = { label: string; val: string | number; sub: string; icon: typeof HardHat; alert?: boolean };

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: fa }, { data: ar }] = await Promise.all([
        supabase.from("chantiers").select("statut,budget,consomme"),
        supabase.from("factures").select("ttc,statut"),
        supabase.from("articles").select("stock,seuil"),
      ]);
      const chantiers = ch ?? [];
      const factures = fa ?? [];
      const articles = ar ?? [];
      const actifs = chantiers.filter((c) => c.statut === "EN_COURS").length;
      const retards = chantiers.filter((c) => c.statut === "EN_RETARD").length;
      const budget = chantiers.reduce((s, c) => s + Number(c.budget), 0);
      const conso = chantiers.reduce((s, c) => s + Number(c.consomme), 0);
      const impayees = factures.filter((f) => f.statut === "Impayée");
      const sousSeuil = articles.filter((a) => Number(a.stock) < Number(a.seuil));
      setKpis([
        { label: "Chantiers actifs", val: actifs, sub: `${retards} en retard`, icon: HardHat, alert: retards > 0 },
        { label: "Budget consommé", val: budget ? `${Math.round((conso / budget) * 100)} %` : "—", sub: fcfa(conso), icon: CircleDollarSign },
        { label: "Factures impayées", val: impayees.length, sub: fcfa(impayees.reduce((s, f) => s + Number(f.ttc), 0)), icon: FileText, alert: impayees.length > 0 },
        { label: "Articles sous seuil", val: sousSeuil.length, sub: `sur ${articles.length} références`, icon: Package, alert: sousSeuil.length > 0 },
      ]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {kpis.map((k, i) => (
        <Card key={i} style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.6 }}>{k.label}</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 40, fontWeight: 700, color: k.alert ? C.red : C.steel, lineHeight: 1.1 }}>{k.val}</div>
              <div style={{ fontSize: 12, color: C.steelSoft }}>{k.sub}</div>
            </div>
            <div style={{ background: k.alert ? C.redSoft : C.orangeSoft, borderRadius: 10, padding: 8 }}>
              <k.icon size={20} color={k.alert ? C.red : C.orange} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
