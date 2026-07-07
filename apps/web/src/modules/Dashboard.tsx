import { useEffect, useState } from "react";
import { HardHat, CircleDollarSign, FileText, Package, AlertTriangle, ChevronRight, CloudSun } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Kpi = { label: string; val: string | number; sub: string; icon: typeof HardHat; alert?: boolean };
type Alerte = { t: string; page: string };
type Ch = { nom: string; statut: string; budget: number; consomme: number; avancementPrevu: number; avancementReel: number };

const STATUT_LABEL: Record<string, string> = { EN_PREPARATION: "En préparation", EN_COURS: "En cours", EN_RETARD: "En retard", SUSPENDU: "Suspendu", TERMINE: "Terminé" };

export default function Dashboard({ go }: { go?: (id: string) => void }) {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [budgetData, setBudgetData] = useState<{ nom: string; Prévu: number; Consommé: number }[]>([]);
  const [avancData, setAvancData] = useState<{ nom: string; Prévu: number; Réel: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: fa }, { data: ar }] = await Promise.all([
        supabase.from("chantiers").select("nom,statut,budget,consomme,avancementPrevu,avancementReel"),
        supabase.from("factures").select("ttc,statut"),
        supabase.from("articles").select("designation,stock,seuil"),
      ]);
      const chantiers = (ch as Ch[]) ?? [];
      const factures = fa ?? [];
      const articles = ar ?? [];
      const actifs = chantiers.filter((c) => c.statut === "EN_COURS").length;
      const retards = chantiers.filter((c) => c.statut === "EN_RETARD");
      const budget = chantiers.reduce((s, c) => s + Number(c.budget), 0);
      const conso = chantiers.reduce((s, c) => s + Number(c.consomme), 0);
      const impayees = factures.filter((f) => f.statut === "Impayée");
      const sousSeuil = articles.filter((a) => Number(a.stock) < Number(a.seuil));

      setKpis([
        { label: "Chantiers actifs", val: actifs, sub: `${retards.length} en retard`, icon: HardHat, alert: retards.length > 0 },
        { label: "Budget consommé", val: budget ? `${Math.round((conso / budget) * 100)} %` : "—", sub: fcfa(conso), icon: CircleDollarSign },
        { label: "Factures impayées", val: impayees.length, sub: fcfa(impayees.reduce((s, f) => s + Number(f.ttc), 0)), icon: FileText, alert: impayees.length > 0 },
        { label: "Articles sous seuil", val: sousSeuil.length, sub: `sur ${articles.length} réf.`, icon: Package, alert: sousSeuil.length > 0 },
      ]);
      setAlertes([
        ...retards.map((c) => ({ t: `Chantier en retard : ${c.nom} (${c.avancementReel}% réalisé)`, page: "chantiers" })),
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: 18 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 12 }}>Budget prévu / consommé (M FCFA)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              <Bar dataKey="Prévu" fill={C.steelSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Consommé" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} color={C.orange} /> Alertes</div>
          {alertes.length === 0 ? <div style={{ color: C.green, fontSize: 14 }}>✔ Aucune alerte.</div> : (
            <div style={{ display: "grid", gap: 8 }}>
              {alertes.map((a, i) => (
                <button key={i} onClick={() => go?.(a.page)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textAlign: "left", background: C.redSoft, border: "none", borderRadius: 8, padding: "9px 11px", cursor: "pointer", color: C.steel, fontSize: 13 }}>
                  <span>{a.t}</span><ChevronRight size={15} color={C.red} />
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 12 }}>Avancement prévu / réel (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avancData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} /><YAxis unit="%" tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              <Bar dataKey="Prévu" fill={C.steelSoft} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Réel" fill={C.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><CloudSun size={40} color={C.orange} /><div><div style={{ fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, color: C.steel }}>28°</div><div style={{ fontSize: 13, color: C.steelSoft }}>Yaoundé — nuageux</div></div></div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>Météo du jour (indicatif). Détail dans Opérations → Météo.</div>
        </Card>
      </div>
    </div>
  );
}
