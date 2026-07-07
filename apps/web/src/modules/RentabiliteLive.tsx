import { useEffect, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { C, FONTS, Card, Progress, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Ch = { nom: string; statut: string; budget: number; consomme: number };

export default function RentabiliteLive() {
  const [rows, setRows] = useState<Ch[]>([]);
  const [seuil, setSeuil] = useState(90);
  const [engage, setEngage] = useState(0);
  const [facture, setFacture] = useState(0);
  const [encaisse, setEncaisse] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: st }, { data: fa }, { data: pa }, { data: stt }] = await Promise.all([
        supabase.from("chantiers").select("nom,statut,budget,consomme").order("nom"),
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

  // Export SYSCOHADA (CSV) — journal simplifié rentabilité.
  function exportCsv() {
    const head = "Chantier;Budget;Consomme;Marge;Consommation%";
    const lines = rows.map((c) => {
      const b = Number(c.budget), co = Number(c.consomme);
      return `${c.nom};${b};${co};${b - co};${b ? Math.round((co / b) * 100) : 0}`;
    });
    const csv = [head, ...lines, `;;;;`, `Engagé;${engage};Facturé;${facture};Encaissé;${encaisse}`].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rentabilite-syscohada.csv"; a.click();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
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
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Chantier</th><th style={{ padding: 12 }}>Budget</th><th style={{ padding: 12 }}>Consommé</th><th style={{ padding: 12 }}>Marge</th><th style={{ padding: 12, width: 200 }}>Consommation</th></tr></thead>
          <tbody>
            {rows.map((c, i) => {
              const b = Number(c.budget), co = Number(c.consomme);
              const pct = b ? Math.round((co / b) * 100) : 0;
              const marge = b - co;
              const alerte = pct > seuil;
              return (
                <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{c.nom}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(b)}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(co)}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap", color: marge >= 0 ? C.green : C.red, fontWeight: 600 }}>{fcfa(marge)}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}><Progress pct={Math.min(pct, 100)} color={alerte ? C.red : C.orange} /></div>
                      <span style={{ fontSize: 12, color: alerte ? C.red : C.steelSoft, fontWeight: 700, whiteSpace: "nowrap" }}>{pct}%{alerte && <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginLeft: 3 }} />}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucun chantier.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
