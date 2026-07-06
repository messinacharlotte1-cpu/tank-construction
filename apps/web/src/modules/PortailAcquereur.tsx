import { useEffect, useState } from "react";
import { UserCircle, Home, ArrowLeft, Printer } from "lucide-react";
import { C, FONTS, Card, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { printDocument, fcfaP } from "../lib/pdf";

type Resa = {
  id: string; acquereur: string;
  lots_immo: { reference: string; typologie: string | null; surface: number | null; prix: number; programmes: { nom: string; ville: string } | null } | null;
};
type Appel = { id: string; libelle: string; montant: number; echeance: string | null; statut: string };

const STATUT: Record<string, [string, string]> = { PREVU: ["Prévu", C.amber], EMIS: ["Émis", C.green], PAYE: ["Payé", C.steelSoft] };

export default function PortailAcquereur() {
  const [resas, setResas] = useState<Resa[]>([]);
  const [sel, setSel] = useState<Resa | null>(null);
  const [appels, setAppels] = useState<Appel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("reservations").select("id,acquereur,lots_immo(reference,typologie,surface,prix,programmes(nom,ville))");
      setResas((data as unknown as Resa[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function openResa(r: Resa) {
    setSel(r);
    const { data } = await supabase.from("appels_de_fonds").select("id,libelle,montant,echeance,statut").eq("reservationId", r.id).order("echeance");
    setAppels((data as Appel[]) ?? []);
  }

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  if (sel) {
    const lot = sel.lots_immo;
    const totalAppels = appels.reduce((s, a) => s + Number(a.montant), 0);
    const echeancierHtml = `<div class="brand"><span class="logo">TANK</span><h1>Échéancier — ${sel.acquereur}</h1></div><div class="bar"></div>
      <p class="muted">${lot?.programmes?.nom ?? ""} — Lot ${lot?.reference ?? ""} (${lot?.typologie ?? ""})</p>
      <table><thead><tr><th>Appel</th><th>Échéance</th><th class="right">Montant</th><th>Statut</th></tr></thead><tbody>
      ${appels.map((a) => `<tr><td>${a.libelle}</td><td>${a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td><td class="right">${fcfaP(Number(a.montant))}</td><td>${a.statut}</td></tr>`).join("")}
      </tbody></table><p class="right"><b>Total appels : ${fcfaP(totalAppels)}</b></p>`;

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setSel(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Acquéreurs</button>
          <button onClick={() => printDocument(`Echeancier-${sel.acquereur}`, echeancierHtml)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Printer size={15} /> Échéancier PDF</button>
        </div>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ background: C.orangeSoft, borderRadius: 10, padding: 8 }}><Home size={20} color={C.orange} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.steel }}>{sel.acquereur}</div>
              <div style={{ color: C.steelSoft, fontSize: 13 }}>{lot?.programmes?.nom} — {lot?.programmes?.ville}</div>
            </div>
          </div>
          {lot && <div style={{ fontSize: 14, color: C.steel }}>Lot <b>{lot.reference}</b> · {lot.typologie} · {lot.surface ?? "—"} m² · {fcfa(Number(lot.prix))}</div>}
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontFamily: FONTS.condensed, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>Échéancier des appels de fonds</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Appel</th><th style={{ padding: 12 }}>Échéance</th><th style={{ padding: 12 }}>Montant</th><th style={{ padding: 12 }}>Statut</th></tr></thead>
            <tbody>
              {appels.map((a) => {
                const [l, col] = STATUT[a.statut] ?? [a.statut, C.steelSoft];
                return (
                  <tr key={a.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 12 }}>{a.libelle}</td>
                    <td style={{ padding: 12 }}>{a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(a.montant))}</td>
                    <td style={{ padding: 12 }}><span style={{ color: col, fontWeight: 700, fontSize: 13 }}>{l}</span></td>
                  </tr>
                );
              })}
              {appels.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: C.steelSoft }}>Aucun appel de fonds.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ color: C.steelSoft, fontSize: 13 }}>Vue acquéreur : réservation, échéancier VEFA, documents. (En production : comptes acquéreurs dédiés.)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {resas.map((r) => (
          <Card key={r.id} style={{ cursor: "pointer" }} >
            <div onClick={() => openResa(r)}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><UserCircle size={18} color={C.orange} /> {r.acquereur}</div>
              <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 6 }}>{r.lots_immo?.programmes?.nom} — Lot {r.lots_immo?.reference}</div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: C.steel }}>{r.lots_immo ? fcfa(Number(r.lots_immo.prix)) : ""}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir l'échéancier →</div>
            </div>
          </Card>
        ))}
        {resas.length === 0 && <div style={{ color: C.steelSoft }}>Aucune réservation.</div>}
      </div>
    </div>
  );
}
