import { useEffect, useState } from "react";
import { HardHat, Users, CircleDollarSign, FileText, AlertTriangle, ChevronRight, CloudRain, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { C, FONTS, Card, SectionTitle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Kpi = { label: string; val: string | number; sub: string; icon: typeof HardHat; alert?: boolean };
type Alerte = { t: string; page: string };
type Ch = { nom: string; statut: string; budget: number; consomme: number; avancementPrevu: number; avancementReel: number };
type Pt = { ouvrier: string; statut: string; date: string };

export default function Dashboard({ go }: { go?: (id: string) => void }) {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [budgetData, setBudgetData] = useState<{ nom: string; Prévu: number; Consommé: number }[]>([]);
  const [avancData, setAvancData] = useState<{ nom: string; Prévu: number; Réel: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: fa }, { data: ar }, { data: pt }] = await Promise.all([
        supabase.from("chantiers").select("nom,statut,budget,consomme,avancementPrevu,avancementReel"),
        supabase.from("factures").select("ttc,statut"),
        supabase.from("articles").select("designation,stock,seuil"),
        supabase.from("pointages").select("ouvrier,statut,date"),
      ]);
      const chantiers = (ch as Ch[]) ?? [];
      const factures = fa ?? [];
      const articles = ar ?? [];
      const pointages = (pt as Pt[]) ?? [];
      const actifs = chantiers.filter((c) => c.statut === "EN_COURS").length;
      const retards = chantiers.filter((c) => c.statut === "EN_RETARD");
      const budget = chantiers.reduce((s, c) => s + Number(c.budget), 0);
      const conso = chantiers.reduce((s, c) => s + Number(c.consomme), 0);
      const impayees = factures.filter((f) => f.statut === "Impayée");
      const sousSeuil = articles.filter((a) => Number(a.stock) < Number(a.seuil));
      // Présents aujourd'hui : P=1, DM=0.5 (comme la maquette).
      const today = new Date().toISOString().slice(0, 10);
      const ptToday = pointages.filter((p) => (p.date ?? "").slice(0, 10) === today);
      const presents = ptToday.filter((p) => p.statut === "P").length + ptToday.filter((p) => p.statut === "DM").length * 0.5;
      const totalOuvriers = new Set(pointages.map((p) => p.ouvrier)).size;

      setKpis([
        { label: "Chantiers actifs", val: actifs, sub: `${retards.length} en retard`, icon: HardHat, alert: retards.length > 0 },
        { label: "Présents aujourd'hui", val: presents, sub: `sur ${totalOuvriers} ouvriers`, icon: Users },
        { label: "Budget consommé", val: budget ? `${Math.round((conso / budget) * 100)} %` : "—", sub: fcfa(conso), icon: CircleDollarSign },
        { label: "Factures impayées", val: impayees.length, sub: fcfa(impayees.reduce((s, f) => s + Number(f.ttc), 0)), icon: FileText, alert: impayees.length > 0 },
      ]);
      setAlertes([
        ...retards.map((c) => ({ t: `Chantier en retard : ${c.nom} (${c.avancementReel} % réalisé)`, page: "chantiers" })),
        ...sousSeuil.map((a) => ({ t: `Stock sous seuil : ${a.designation} (${a.stock})`, page: "stocks" })),
        ...impayees.map((f) => ({ t: `Facture impayée : ${fcfa(Number(f.ttc))}`, page: "factures" })),
      ]);
      const actifsCh = chantiers.filter((c) => c.statut !== "TERMINE");
      setBudgetData(actifsCh.map((c) => ({ nom: c.nom.split(" ").slice(0, 2).join(" "), Prévu: Math.round(Number(c.budget) / 1e6), Consommé: Math.round(Number(c.consomme) / 1e6) })));
      setAvancData(actifsCh.map((c) => ({ nom: c.nom.split(" ").slice(0, 2).join(" "), Prévu: Number(c.avancementPrevu), Réel: Number(c.avancementReel) })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.6 }}>{k.label}</div>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 40, fontWeight: 700, color: k.alert ? C.red : C.steel, lineHeight: 1.1 }}>{k.val}</div>
                <div style={{ fontSize: 12, color: C.steelSoft }}>{k.sub}</div>
              </div>
              <div style={{ background: k.alert ? C.redSoft : C.orangeSoft, borderRadius: 10, padding: 8 }}><k.icon size={20} color={k.alert ? C.red : C.orange} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <Card>
          <SectionTitle icon={TrendingUp}>Avancement prévu / réel (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avancData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} /><YAxis unit=" %" tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              <Bar dataKey="Prévu" fill={C.steelSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Réel" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={CircleDollarSign}>Budget par chantier (M FCFA)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              <Bar dataKey="Prévu" fill={C.steelSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Consommé" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div onClick={() => go?.("meteo")} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, cursor: "pointer", background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 18px" }}>
        <CloudRain size={26} color="#3B82C4" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>Météo Yaoundé — nuageux, 28° / pluie 40 %</div>
          <div style={{ fontSize: 12, color: C.red }}>Risque d'averses en après-midi — bétonnage à planifier le matin.</div>
        </div>
        <ChevronRight size={16} color={C.steelSoft} />
      </div>

      <Card>
        <SectionTitle icon={AlertTriangle} action={<span style={{ fontSize: 12, color: C.steelSoft }}>{alertes.length} alerte{alertes.length > 1 ? "s" : ""}</span>}>Alertes critiques</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {alertes.map((a, i) => (
            <div key={i} onClick={() => go?.(a.page)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.redSoft, borderLeft: `4px solid ${C.red}`, borderRadius: 8, cursor: "pointer", fontSize: 14, color: C.steel }}>
              <AlertTriangle size={16} color={C.red} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{a.t}</span>
              <ChevronRight size={16} color={C.steelSoft} />
            </div>
          ))}
          {alertes.length === 0 && <div style={{ color: C.steelSoft, fontSize: 14 }}>Aucune alerte. Tous les indicateurs sont au vert.</div>}
        </div>
      </Card>
    </div>
  );
}
