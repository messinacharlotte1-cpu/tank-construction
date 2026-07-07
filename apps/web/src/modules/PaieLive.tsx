import { useEffect, useState } from "react";
import { Printer, Wallet } from "lucide-react";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { paieJour, cnps } from "../lib/calc";
import { printDocument, fcfaP } from "../lib/pdf";

type Pt = { ouvrier: string; tarif: number; statut: string };
type Bulletin = { ouvrier: string; brut: number; retenueSal: number; net: number; chargeEmp: number; coutTotal: number };

export default function PaieLive() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [taux, setTaux] = useState({ sal: 4.2, emp: 11.95 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: pts }, { data: st }] = await Promise.all([
        supabase.from("pointages").select("ouvrier,tarif,statut"),
        supabase.from("settings").select("cle,valeur").in("cle", ["cnps_salarie", "cnps_employeur"]),
      ]);
      const sal = Number(st?.find((s) => s.cle === "cnps_salarie")?.valeur ?? 0.042) * 100;
      const emp = Number(st?.find((s) => s.cle === "cnps_employeur")?.valeur ?? 0.1195) * 100;
      setTaux({ sal, emp });
      const byOuvrier = new Map<string, Pt[]>();
      for (const p of (pts as Pt[]) ?? []) { const a = byOuvrier.get(p.ouvrier) ?? []; a.push(p); byOuvrier.set(p.ouvrier, a); }
      const bs: Bulletin[] = [...byOuvrier.entries()].map(([ouvrier, arr]) => {
        const brut = paieJour(arr);
        const c = cnps(brut, sal, emp);
        return { ouvrier, brut, retenueSal: c.retenueSal, net: c.net, chargeEmp: c.chargeEmp, coutTotal: c.coutTotal };
      });
      setBulletins(bs);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;
  const tot = bulletins.reduce((s, b) => ({ brut: s.brut + b.brut, net: s.net + b.net, cout: s.cout + b.coutTotal }), { brut: 0, net: 0, cout: 0 });

  function pdf(b: Bulletin) {
    const body = `<div class="brand"><span class="logo">TANK</span><h1>Bulletin de paie</h1></div><div class="bar"></div>
      <p class="muted">Salarié : ${b.ouvrier}</p>
      <table><tbody>
      <tr><td>Salaire brut (pointage)</td><td class="right">${fcfaP(b.brut)}</td></tr>
      <tr><td>Retenue CNPS salarié (${taux.sal}%)</td><td class="right">− ${fcfaP(b.retenueSal)}</td></tr>
      <tr><td><b>Net à payer</b></td><td class="right"><b>${fcfaP(b.net)}</b></td></tr>
      <tr><td>Charge CNPS employeur (${taux.emp}%)</td><td class="right">${fcfaP(b.chargeEmp)}</td></tr>
      <tr><td>Coût total employeur</td><td class="right">${fcfaP(b.coutTotal)}</td></tr>
      </tbody></table><p class="muted">Taux CNPS indicatifs — à confirmer avec un comptable.</p>`;
    printDocument(`Bulletin-${b.ouvrier}`, body);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontSize: 13, color: C.steelSoft, display: "flex", alignItems: "center", gap: 8 }}><Wallet size={16} color={C.orange} /> Brut = pointages (P=1/DM=0,5/A=0). CNPS salarié {taux.sal}% · employeur {taux.emp}% (paramétrable). Taux indicatifs.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14 }}>
        {[["Total brut", fcfa(tot.brut), C.steel], ["Total net", fcfa(tot.net), C.green], ["Coût employeur", fcfa(tot.cout), C.orange]].map(([l, v, col], i) => (
          <Card key={i} style={{ padding: 16 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft, textTransform: "uppercase" }}>{l}</div><div style={{ fontFamily: FONTS.condensed, fontSize: 26, fontWeight: 700, color: col as string }}>{v}</div></Card>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Salarié</th><th style={{ padding: 12 }}>Brut</th><th style={{ padding: 12 }}>Ret. CNPS</th><th style={{ padding: 12 }}>Net</th><th style={{ padding: 12 }}>Coût employeur</th><th></th></tr></thead>
          <tbody>
            {bulletins.map((b) => (
              <tr key={b.ouvrier} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{b.ouvrier}</td>
                <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(b.brut)}</td>
                <td style={{ padding: 12, whiteSpace: "nowrap", color: C.red }}>− {fcfa(b.retenueSal)}</td>
                <td style={{ padding: 12, whiteSpace: "nowrap", fontWeight: 700 }}>{fcfa(b.net)}</td>
                <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(b.coutTotal)}</td>
                <td style={{ padding: 12, textAlign: "right" }}><button onClick={() => pdf(b)} title="Bulletin PDF" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.steel, display: "inline-flex", alignItems: "center", gap: 6 }}><Printer size={14} /> Bulletin</button></td>
              </tr>
            ))}
            {bulletins.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Aucun pointage. Pointez des ouvriers d'abord.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
