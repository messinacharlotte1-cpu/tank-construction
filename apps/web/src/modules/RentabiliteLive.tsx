import { useEffect, useState } from "react";
import { AlertTriangle, Download, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { C, FONTS, Card, Progress, SectionTitle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Ch = { nom: string; statut: string; perimetre: string | null; budget: number; consomme: number; avancementReel: number };
type Filtre = "ALL" | "GO" | "SO" | "MIXTE";

const PERIMETRE_LABEL: Record<string, string> = { GO: "Gros œuvre", SO: "Second œuvre", MIXTE: "GO + SO" };
const FILTRES: { key: Filtre; label: string }[] = [
  { key: "ALL", label: "Tout" },
  { key: "GO", label: "Gros œuvre" },
  { key: "SO", label: "Second œuvre" },
  { key: "MIXTE", label: "Mixte" },
];

export default function RentabiliteLive() {
  const [rows, setRows] = useState<Ch[]>([]);
  const [seuil, setSeuil] = useState(90);
  const [engage, setEngage] = useState(0);
  const [facture, setFacture] = useState(0);
  const [encaisse, setEncaisse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("ALL");

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: st }, { data: fa }, { data: pa }, { data: stt }] = await Promise.all([
        supabase.from("chantiers").select("nom,statut,perimetre,budget,consomme,avancementReel").order("nom"),
        supabase.from("settings").select("valeur").eq("cle", "seuil_alerte_budget").maybeSingle(),
        supabase.from("factures").select("ttc"),
        supabase.from("paiements").select("montant"),
        supabase.from("sous_traitants").select("montantMarche"),
      ]);
      const chantiers = (ch as Ch[]) ?? [];
      setRows(chantiers);
      if (st?.valeur) setSeuil(Number(st.valeur));
      // Engagé = consommé chantiers + marchés sous-traités. Facturé = Σ factures. Encaissé = Σ paiements.
      setEngage(chantiers.reduce((s, c) => s + Number(c.consomme), 0) + (stt ?? []).reduce((s, x) => s + Number(x.montantMarche), 0));
      setFacture((fa ?? []).reduce((s, x) => s + Number(x.ttc), 0));
      setEncaisse((pa ?? []).reduce((s, x) => s + Number(x.montant), 0));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;
  const totB = rows.reduce((s, c) => s + Number(c.budget), 0);
  const totC = rows.reduce((s, c) => s + Number(c.consomme), 0);
  // Lentille corps d'état : filtre les chantiers par périmètre (GO / SO / MIXTE).
  const vis = filtre === "ALL" ? rows : rows.filter((c) => (c.perimetre ?? "") === filtre);
  const visB = vis.reduce((s, c) => s + Number(c.budget), 0);
  const visC = vis.reduce((s, c) => s + Number(c.consomme), 0);

  // Export SYSCOHADA (CSV) — journal simplifié rentabilité.
  function exportCsv() {
    const head = "Chantier;Perimetre;Budget;Consomme;Marge;Consommation%";
    const lines = rows.map((c) => {
      const b = Number(c.budget), co = Number(c.consomme);
      return `${c.nom};${c.perimetre ? PERIMETRE_LABEL[c.perimetre] ?? c.perimetre : ""};${b};${co};${b - co};${b ? Math.round((co / b) * 100) : 0}`;
    });
    const csv = [head, ...lines, `;;;;`, `Engagé;${engage};Facturé;${facture};Encaissé;${encaisse}`].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rentabilite-syscohada.csv"; a.click();
  }

  const derives = rows.filter((c) => { const b = Number(c.budget); const pct = b ? Math.round((Number(c.consomme) / b) * 100) : 0; return pct >= seuil && Number(c.avancementReel) < 100; });
  const chart = vis.map((c) => ({ nom: c.nom.split(" ").slice(0, 2).join(" "), "Marge (M)": Math.round((Number(c.budget) - Number(c.consomme)) / 1e6) }));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Wallet}>Rentabilité &amp; Trésorerie</SectionTitle>

      {derives.map((c, i) => {
        const b = Number(c.budget), co = Number(c.consomme), av = Number(c.avancementReel);
        const pct = b ? Math.round((co / b) * 100) : 0;
        const projete = av > 0 ? Math.round(co / (av / 100)) : co;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: C.redSoft, border: `1px solid ${C.red}`, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, color: C.steel }}>
            <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0 }} />
            <span><b>Garde-fou budgétaire — {c.nom} :</b> {pct} % du budget consommé pour {av} % d'avancement (seuil {seuil} %). Coût final projeté : {fcfa(projete)} — geler les achats non engagés, revoir les déboursés du lot en cours.</span>
          </div>
        );
      })}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14 }}>
        {[["Budget total", fcfa(totB), C.steel], ["Marge prévisionnelle", fcfa(totB - totC), totB - totC >= 0 ? C.green : C.red], ["Engagé", fcfa(engage), C.orange], ["Facturé", fcfa(facture), C.steel], ["Encaissé", fcfa(encaisse), C.green]].map(([l, v, col], i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, color: col as string }}>{v}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: C.steelSoft }}>Garde-fou : alerte si consommé &gt; <b>{seuil}%</b> du budget. Reste à encaisser : <b>{fcfa(facture - encaisse)}</b>.</div>
        <button onClick={exportCsv} style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Download size={15} /> Export SYSCOHADA (CSV)</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.steelSoft, fontWeight: 600, textTransform: "uppercase" }}>Corps d'état :</span>
        {FILTRES.map((c) => {
          const actif = filtre === c.key;
          const n = c.key === "ALL" ? rows.length : rows.filter((x) => (x.perimetre ?? "") === c.key).length;
          return (
            <button key={c.key} onClick={() => setFiltre(c.key)}
              style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${actif ? C.orange : C.line}`, background: actif ? C.orange : "transparent", color: actif ? C.white : C.steel, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {c.label} ({n})
            </button>
          );
        })}
      </div>
      {filtre !== "ALL" && (
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: C.steel, background: C.concrete, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 14px" }}>
          <span><b>{PERIMETRE_LABEL[filtre]}</b> — {vis.length} chantier(s)</span>
          <span>Budget : <b>{fcfa(visB)}</b></span>
          <span>Consommé : <b>{fcfa(visC)}</b></span>
          <span>Marge : <b style={{ color: visB - visC >= 0 ? C.green : C.red }}>{fcfa(visB - visC)}</b></span>
        </div>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>{["Chantier", "Périmètre", "Budget", "Consommé", "Marge", "Consommation", "Budget vs avanc."].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
          <tbody>
            {vis.map((c, i) => {
              const b = Number(c.budget), co = Number(c.consomme), av = Number(c.avancementReel);
              const pct = b ? Math.round((co / b) * 100) : 0;
              const marge = b - co;
              const alerte = pct > seuil;
              const derive = pct >= seuil && av < 100;
              return (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}`, background: derive ? "#FFF6F5" : i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.steel }}>{c.nom}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, color: c.perimetre ? C.steel : C.steelSoft }}>{c.perimetre ? PERIMETRE_LABEL[c.perimetre] ?? c.perimetre : "—"}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{fcfa(b)}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{fcfa(co)}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: marge >= 0 ? C.green : C.red, fontWeight: 700 }}>{fcfa(marge)}</td>
                  <td style={{ padding: "10px 12px", minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}><Progress pct={Math.min(pct, 100)} color={alerte ? C.red : C.orange} /></div>
                      <span style={{ fontSize: 12, color: alerte ? C.red : C.steelSoft, fontWeight: 700, whiteSpace: "nowrap" }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap", color: derive ? C.red : C.green }}>{pct} % / {av} % {derive ? "⚠" : "✓"}</td>
                </tr>
              );
            })}
            {vis.length === 0 && <tr><td colSpan={7} style={{ padding: 16, color: C.steelSoft }}>Aucun chantier pour ce périmètre.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle icon={PieChartIcon}>Marge par chantier (millions FCFA)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis dataKey="nom" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
            <Bar dataKey="Marge (M)" fill={C.orange} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
          Coûts alimentés sans double saisie : pointages (MO), sorties de stock (matériaux), contrats (sous-traitance). « Budget vs avancement » confronte prévisionnel et réalisé — l'écart signale la dérive avant le dépassement.
        </div>
      </Card>
    </div>
  );
}
