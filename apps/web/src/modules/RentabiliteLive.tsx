import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { C, FONTS, Card, Progress, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Ch = { nom: string; statut: string; budget: number; consomme: number };

export default function RentabiliteLive() {
  const [rows, setRows] = useState<Ch[]>([]);
  const [seuil, setSeuil] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ch }, { data: st }] = await Promise.all([
        supabase.from("chantiers").select("nom,statut,budget,consomme").order("nom"),
        supabase.from("settings").select("valeur").eq("cle", "seuil_alerte_budget").maybeSingle(),
      ]);
      setRows((ch as Ch[]) ?? []);
      if (st?.valeur) setSeuil(Number(st.valeur));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;
  const totB = rows.reduce((s, c) => s + Number(c.budget), 0);
  const totC = rows.reduce((s, c) => s + Number(c.consomme), 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14 }}>
        {[["Budget total", fcfa(totB), C.steel], ["Consommé", fcfa(totC), C.orange], ["Marge prévisionnelle", fcfa(totB - totC), totB - totC >= 0 ? C.green : C.red]].map(([l, v, col], i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, color: col as string }}>{v}</div>
          </Card>
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.steelSoft }}>Garde-fou : alerte si consommé &gt; <b>{seuil}%</b> du budget (paramétrable).</div>
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
