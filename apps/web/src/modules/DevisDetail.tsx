import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, FileCheck, Printer, Server } from "lucide-react";
import { C, FONTS, Card, StatutBadge, fcfa, TVA_DEFAULT } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { printDocument, serverPdf, fcfaP, type PdfBlock } from "../lib/pdf";

// Unités valides (cf. CLAUDE.md). `pm` = pour mémoire → jamais chiffré.
const UNITES = ["u", "m²", "m³", "kg", "ml", "ff", "pm", "ens", "mois"];

type Lot = { id: string; nom: string; ordre: number };
type Ligne = { id: string; lotId: string; designation: string; unite: string; quantite: number; prixUnitaire: number; ordre: number };

const montantLigne = (l: Ligne) => (l.unite === "pm" ? 0 : Number(l.quantite) * Number(l.prixUnitaire));

export default function DevisDetail({ devisId, numero, client, statut, onBack }: { devisId: string; numero: string; client: string; statut: string; onBack: () => void }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [remise, setRemise] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newLot, setNewLot] = useState("");

  async function load() {
    setLoading(true);
    const { data: d } = await supabase.from("devis").select("remisePct").eq("id", devisId).single();
    setRemise(Number(d?.remisePct ?? 0));
    const { data: lo } = await supabase.from("lots").select("id,nom,ordre").eq("devisId", devisId).order("ordre");
    const lotsRows = (lo as Lot[]) ?? [];
    setLots(lotsRows);
    if (lotsRows.length) {
      const { data: li } = await supabase.from("lignes").select("id,lotId,designation,unite,quantite,prixUnitaire,ordre").in("lotId", lotsRows.map((l) => l.id)).order("ordre");
      setLignes((li as Ligne[]) ?? []);
    } else setLignes([]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [devisId]);

  async function addLot(e: React.FormEvent) {
    e.preventDefault();
    if (!newLot.trim()) return;
    const { error } = await supabase.from("lots").insert({ id: crypto.randomUUID(), devisId, nom: newLot, ordre: lots.length + 1 });
    if (error) return setErr(error.message);
    setNewLot("");
    void load();
  }
  async function addLigne(lotId: string) {
    const ordre = lignes.filter((l) => l.lotId === lotId).length + 1;
    const { error } = await supabase.from("lignes").insert({ id: crypto.randomUUID(), lotId, designation: "Nouvelle ligne", unite: "u", quantite: 1, prixUnitaire: 0, ordre });
    if (error) return setErr(error.message);
    void load();
  }
  async function saveLigne(l: Ligne, patch: Partial<Ligne>) {
    setLignes((rows) => rows.map((r) => (r.id === l.id ? { ...r, ...patch } : r)));
    await supabase.from("lignes").update(patch).eq("id", l.id);
  }
  async function delLigne(id: string) { await supabase.from("lignes").delete().eq("id", id); setLignes((r) => r.filter((x) => x.id !== id)); }
  async function delLot(id: string) {
    await supabase.from("lignes").delete().eq("lotId", id);
    await supabase.from("lots").delete().eq("id", id);
    void load();
  }
  async function saveRemise(v: number) { setRemise(v); await supabase.from("devis").update({ remisePct: v }).eq("id", devisId); }

  const totalHT = lignes.reduce((s, l) => s + montantLigne(l), 0);
  const remiseAmt = Math.round((totalHT * remise) / 100);
  const htNet = totalHT - remiseAmt;
  const tva = Math.round(htNet * TVA_DEFAULT);
  const ttc = htNet + tva;

  async function emettre() {
    const snapshot = {
      emisLe: new Date().toISOString(), tvaRate: TVA_DEFAULT, totalHT, remisePct: remise, remiseAmt, htNet, tva, ttc,
      lots: lots.map((lot) => ({ nom: lot.nom, lignes: lignes.filter((l) => l.lotId === lot.id).map((l) => ({ designation: l.designation, unite: l.unite, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire), montant: montantLigne(l) })) })),
    };
    const { error } = await supabase.from("devis").update({ snapshot, statut: "Envoyé", remisePct: remise }).eq("id", devisId);
    if (error) setErr(error.message);
    else onBack();
  }

  const input: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONTS.sans, width: "100%" };

  function pdf() {
    const lotsHtml = lots.map((lot) => {
      const ls = lignes.filter((l) => l.lotId === lot.id);
      const st = ls.reduce((s, l) => s + montantLigne(l), 0);
      return `<h3>${lot.nom}</h3><table><thead><tr><th>Désignation</th><th>U</th><th class="right">Qté</th><th class="right">P.U.</th><th class="right">Montant</th></tr></thead><tbody>
        ${ls.map((l) => `<tr><td>${l.designation}</td><td>${l.unite}</td><td class="right">${l.unite === "pm" ? "—" : l.quantite}</td><td class="right">${l.unite === "pm" ? "—" : fcfaP(Number(l.prixUnitaire))}</td><td class="right">${l.unite === "pm" ? "p.m." : fcfaP(montantLigne(l))}</td></tr>`).join("")}
        <tr><td colspan="4" class="right"><b>Sous-total ${lot.nom}</b></td><td class="right"><b>${fcfaP(st)}</b></td></tr></tbody></table>`;
    }).join("");
    const body = `<div class="brand"><span class="logo">TANK</span><h1>Devis ${numero}</h1></div><div class="bar"></div>
      <p class="muted">Client : ${client}</p>${lotsHtml}
      <table style="max-width:360px;margin-left:auto"><tbody>
        <tr><td>Total HT</td><td class="right">${fcfaP(totalHT)}</td></tr>
        <tr><td>Remise ${remise} %</td><td class="right">− ${fcfaP(remiseAmt)}</td></tr>
        <tr><td>HT après remise</td><td class="right">${fcfaP(htNet)}</td></tr>
        <tr><td>TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %</td><td class="right">${fcfaP(tva)}</td></tr>
        <tr><td><b>TOTAL TTC</b></td><td class="right"><b>${fcfaP(ttc)}</b></td></tr>
      </tbody></table>`;
    printDocument(`Devis-${numero}`, body);
  }

  function pdfServeur() {
    const blocks: PdfBlock[] = [];
    for (const lot of lots) {
      const ls = lignes.filter((l) => l.lotId === lot.id);
      const st = ls.reduce((s, l) => s + montantLigne(l), 0);
      blocks.push({ type: "h", text: lot.nom });
      blocks.push({
        type: "table",
        head: ["Désignation", "U", "Qté", "P.U.", "Montant"],
        rows: [
          ...ls.map((l) => [l.designation, l.unite, l.unite === "pm" ? "—" : String(l.quantite), l.unite === "pm" ? "—" : fcfaP(Number(l.prixUnitaire)), l.unite === "pm" ? "p.m." : fcfaP(montantLigne(l))]),
          ["", "", "", "Sous-total", fcfaP(st)],
        ],
      });
    }
    blocks.push({ type: "spacer" });
    blocks.push({
      type: "table", head: ["", ""],
      rows: [["Total HT", fcfaP(totalHT)], [`Remise ${remise} %`, "− " + fcfaP(remiseAmt)], ["HT après remise", fcfaP(htNet)], [`TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %`, fcfaP(tva)], ["TOTAL TTC", fcfaP(ttc)]],
    });
    void serverPdf(`Devis-${numero}`, { title: `Devis ${numero}`, subtitle: `Client : ${client}`, blocks });
  }

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}>
          <ArrowLeft size={15} /> Devis
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: C.steel }}>{numero} · {client}</span>
          <StatutBadge s={statut} />
          <button onClick={pdf} title="PDF via le navigateur" style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><Printer size={14} /> PDF</button>
          <button onClick={pdfServeur} title="PDF généré côté serveur (edge function)" style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><Server size={14} /> PDF serveur</button>
        </div>
      </div>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}

      {lots.map((lot) => {
        const ls = lignes.filter((l) => l.lotId === lot.id);
        const st = ls.reduce((s, l) => s + montantLigne(l), 0);
        return (
          <Card key={lot.id} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.steel, color: C.white }}>
              <span style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{lot.nom}</span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <b>{fcfa(st)}</b>
                <button onClick={() => delLot(lot.id)} title="Supprimer le lot" style={{ background: "none", border: "none", cursor: "pointer", color: "#E9A9A9" }}><Trash2 size={15} /></button>
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 8, width: "40%" }}>Désignation</th><th style={{ padding: 8 }}>Unité</th><th style={{ padding: 8 }}>Qté</th><th style={{ padding: 8 }}>P.U.</th><th style={{ padding: 8 }}>Montant</th><th></th></tr></thead>
              <tbody>
                {ls.map((l) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 6 }}><input style={input} value={l.designation} onChange={(e) => saveLigne(l, { designation: e.target.value })} /></td>
                    <td style={{ padding: 6, width: 80 }}>
                      <select style={input} value={l.unite} onChange={(e) => saveLigne(l, { unite: e.target.value })}>{UNITES.map((u) => <option key={u}>{u}</option>)}</select>
                    </td>
                    <td style={{ padding: 6, width: 70 }}><input style={input} type="number" value={l.quantite} onChange={(e) => saveLigne(l, { quantite: Number(e.target.value) })} disabled={l.unite === "pm"} /></td>
                    <td style={{ padding: 6, width: 110 }}><input style={input} type="number" value={l.prixUnitaire} onChange={(e) => saveLigne(l, { prixUnitaire: Number(e.target.value) })} disabled={l.unite === "pm"} /></td>
                    <td style={{ padding: 6, whiteSpace: "nowrap", color: l.unite === "pm" ? C.steelSoft : C.steel }}>{l.unite === "pm" ? "p.m." : fcfa(montantLigne(l))}</td>
                    <td style={{ padding: 6 }}><button onClick={() => delLigne(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => addLigne(lot.id)} style={{ margin: 10, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.orange, fontSize: 13 }}><Plus size={14} /> Ligne</button>
          </Card>
        );
      })}

      <form onSubmit={addLot} style={{ display: "flex", gap: 10 }}>
        <input style={{ ...input, maxWidth: 300 }} placeholder="Nom du lot (ex. Gros œuvre)" value={newLot} onChange={(e) => setNewLot(e.target.value)} />
        <button type="submit" style={{ padding: "8px 14px", border: "none", borderRadius: 8, background: C.steelMid, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Lot</button>
      </form>

      <Card>
        <div style={{ display: "grid", gap: 8, maxWidth: 360, marginLeft: "auto", fontSize: 14 }}>
          <Row label="Total HT" val={fcfa(totalHT)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.steelSoft }}>Remise (%)</span>
            <input type="number" min="0" max="100" value={remise} onChange={(e) => saveRemise(Number(e.target.value))} style={{ ...input, width: 90 }} />
          </div>
          <Row label="Remise" val={"− " + fcfa(remiseAmt)} />
          <Row label="HT après remise" val={fcfa(htNet)} />
          <Row label={`TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %`} val={fcfa(tva)} />
          <div style={{ borderTop: `2px solid ${C.steel}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, color: C.steel }}>
            <span>TOTAL TTC</span><span>{fcfa(ttc)}</span>
          </div>
          <button onClick={emettre} style={{ marginTop: 8, padding: 12, border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <FileCheck size={17} /> Émettre (fige les montants)
          </button>
          <div style={{ fontSize: 11, color: C.steelSoft, textAlign: "center" }}>Snapshot TVA + totaux figés à l'émission — jamais recalculé.</div>
        </div>
      </Card>
    </div>
  );
}

const Row = ({ label, val }: { label: string; val: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.steelSoft }}>{label}</span><span>{val}</span></div>
);
