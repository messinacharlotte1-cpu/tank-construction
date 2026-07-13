import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, FileCheck, Printer, Server } from "lucide-react";
import { C, FONTS, Card, StatutBadge, Hazard, Kpi, fcfa, TVA_DEFAULT } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { printDocument, serverPdf, fcfaP, type PdfBlock } from "../lib/pdf";
import { montantLigne as calcMontant, dqeTotals } from "../lib/calc";

// Unités valides (cf. CLAUDE.md). `pm` = pour mémoire → jamais chiffré.
const UNITES = ["u", "m²", "m³", "kg", "ml", "ff", "pm", "ens", "mois"];

type Lot = { id: string; nom: string; ordre: number };
type SousOuvrage = { id: string; lotId: string; nom: string; ordre: number };
type Ligne = { id: string; sousOuvrageId: string; designation: string; unite: string; quantite: number; prixUnitaire: number; ordre: number };

const montantLigne = (l: Ligne) => calcMontant(l);

export default function DevisDetail({ devisId, numero, client, statut, onBack }: { devisId: string; numero: string; client: string; statut: string; onBack: () => void }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [sous, setSous] = useState<SousOuvrage[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [remise, setRemise] = useState(0);
  const [surface, setSurface] = useState(0);
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
      const { data: so } = await supabase.from("sous_ouvrages").select("id,lotId,nom,ordre").in("lotId", lotsRows.map((l) => l.id)).order("ordre");
      const soRows = (so as SousOuvrage[]) ?? [];
      setSous(soRows);
      if (soRows.length) {
        const { data: li } = await supabase.from("lignes").select("id,sousOuvrageId,designation,unite,quantite,prixUnitaire,ordre").in("sousOuvrageId", soRows.map((s) => s.id)).order("ordre");
        setLignes((li as Ligne[]) ?? []);
      } else setLignes([]);
    } else { setSous([]); setLignes([]); }
    setLoading(false);
  }
  useEffect(() => { void load(); }, [devisId]);

  async function addLot(e: React.FormEvent) {
    e.preventDefault();
    if (!newLot.trim()) return;
    const { error } = await supabase.from("lots").insert({ id: crypto.randomUUID(), devisId, nom: newLot, ordre: lots.length + 1 });
    if (error) return setErr(error.message);
    setNewLot(""); void load();
  }
  async function addSous(lotId: string) {
    const nom = window.prompt("Nom du sous-ouvrage :", "Nouveau sous-ouvrage");
    if (!nom) return;
    const ordre = sous.filter((s) => s.lotId === lotId).length + 1;
    const { error } = await supabase.from("sous_ouvrages").insert({ id: crypto.randomUUID(), lotId, nom, ordre });
    if (error) return setErr(error.message);
    void load();
  }
  async function addLigne(sousOuvrageId: string) {
    const ordre = lignes.filter((l) => l.sousOuvrageId === sousOuvrageId).length + 1;
    const { error } = await supabase.from("lignes").insert({ id: crypto.randomUUID(), sousOuvrageId, designation: "Nouvelle ligne", unite: "u", quantite: 1, prixUnitaire: 0, ordre });
    if (error) return setErr(error.message);
    void load();
  }
  async function saveLigne(l: Ligne, patch: Partial<Ligne>) {
    setLignes((rows) => rows.map((r) => (r.id === l.id ? { ...r, ...patch } : r)));
    await supabase.from("lignes").update(patch).eq("id", l.id);
  }
  async function delLigne(id: string) { await supabase.from("lignes").delete().eq("id", id); setLignes((r) => r.filter((x) => x.id !== id)); }
  async function delSous(id: string) { await supabase.from("lignes").delete().eq("sousOuvrageId", id); await supabase.from("sous_ouvrages").delete().eq("id", id); void load(); }
  async function delLot(id: string) {
    const soIds = sous.filter((s) => s.lotId === id).map((s) => s.id);
    if (soIds.length) await supabase.from("lignes").delete().in("sousOuvrageId", soIds);
    await supabase.from("sous_ouvrages").delete().eq("lotId", id);
    await supabase.from("lots").delete().eq("id", id);
    void load();
  }
  async function saveRemise(v: number) { setRemise(v); await supabase.from("devis").update({ remisePct: v }).eq("id", devisId); }

  const { totalHT, remiseAmt, htNet, tva, ttc } = dqeTotals(lignes, remise, TVA_DEFAULT);

  async function emettre() {
    // Signature électronique simulée (OTP) — horodatage consigné dans le snapshot.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const saisie = window.prompt(`Signature électronique du devis.\nCode OTP (simulé) : ${code}\nRe-saisir pour signer, ou Annuler pour émettre sans signature :`);
    const signature = saisie === code ? { signeLe: new Date().toISOString(), canal: "OTP (simulé)" } : null;
    const snapshot = {
      emisLe: new Date().toISOString(), tvaRate: TVA_DEFAULT, totalHT, remisePct: remise, remiseAmt, htNet, tva, ttc,
      surface, ratioM2: surface > 0 ? Math.round(ttc / surface) : null, signature,
      lots: lots.map((lot) => ({ nom: lot.nom, sousOuvrages: sous.filter((s) => s.lotId === lot.id).map((so) => ({ nom: so.nom, lignes: lignes.filter((l) => l.sousOuvrageId === so.id).map((l) => ({ designation: l.designation, unite: l.unite, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire), montant: montantLigne(l) })) })) })),
    };
    const { error } = await supabase.from("devis").update({ snapshot, statut: "Envoyé", remisePct: remise }).eq("id", devisId);
    if (error) setErr(error.message); else onBack();
  }

  function buildPdfBlocks(): PdfBlock[] {
    const blocks: PdfBlock[] = [];
    for (const lot of lots) {
      blocks.push({ type: "h", text: lot.nom });
      for (const so of sous.filter((s) => s.lotId === lot.id)) {
        const ls = lignes.filter((l) => l.sousOuvrageId === so.id);
        blocks.push({ type: "p", text: "• " + so.nom });
        blocks.push({ type: "table", head: ["Désignation", "U", "Qté", "P.U.", "Montant"], rows: ls.map((l) => [l.designation, l.unite, l.unite === "pm" ? "—" : String(l.quantite), l.unite === "pm" ? "—" : fcfaP(Number(l.prixUnitaire)), l.unite === "pm" ? "p.m." : fcfaP(montantLigne(l))]) });
      }
    }
    blocks.push({ type: "spacer" });
    blocks.push({ type: "table", head: ["", ""], rows: [["Total HT", fcfaP(totalHT)], [`Remise ${remise} %`, "− " + fcfaP(remiseAmt)], ["HT après remise", fcfaP(htNet)], [`TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %`, fcfaP(tva)], ["TOTAL TTC", fcfaP(ttc)]] });
    return blocks;
  }
  function pdf() {
    const html = lots.map((lot) => {
      const so = sous.filter((s) => s.lotId === lot.id).map((s) => {
        const ls = lignes.filter((l) => l.sousOuvrageId === s.id);
        return `<p style="margin:6px 0 2px"><b>${s.nom}</b></p><table><thead><tr><th>Désignation</th><th>U</th><th class="right">Qté</th><th class="right">P.U.</th><th class="right">Montant</th></tr></thead><tbody>${ls.map((l) => `<tr><td>${l.designation}</td><td>${l.unite}</td><td class="right">${l.unite === "pm" ? "—" : l.quantite}</td><td class="right">${l.unite === "pm" ? "—" : fcfaP(Number(l.prixUnitaire))}</td><td class="right">${l.unite === "pm" ? "p.m." : fcfaP(montantLigne(l))}</td></tr>`).join("")}</tbody></table>`;
      }).join("");
      return `<h3>${lot.nom}</h3>${so}`;
    }).join("");
    const body = `<div class="brand"><span class="logo">TANK</span><h1>Devis ${numero}</h1></div><div class="bar"></div><p class="muted">Client : ${client}</p>${html}
      <table style="max-width:360px;margin-left:auto"><tbody>
      <tr><td>Total HT</td><td class="right">${fcfaP(totalHT)}</td></tr><tr><td>Remise ${remise}%</td><td class="right">− ${fcfaP(remiseAmt)}</td></tr>
      <tr><td>HT après remise</td><td class="right">${fcfaP(htNet)}</td></tr><tr><td>TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")}%</td><td class="right">${fcfaP(tva)}</td></tr>
      <tr><td><b>TOTAL TTC</b></td><td class="right"><b>${fcfaP(ttc)}</b></td></tr></tbody></table>`;
    printDocument(`Devis-${numero}`, body);
  }

  const input: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONTS.sans, width: "100%" };
  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Devis</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: C.steel }}>{numero} · {client}</span>
          <StatutBadge s={statut} />
          <button onClick={pdf} title="PDF navigateur" style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><Printer size={14} /> PDF</button>
          <button onClick={() => serverPdf(`Devis-${numero}`, { title: `Devis ${numero}`, subtitle: `Client : ${client}`, blocks: buildPdfBlocks() })} title="PDF serveur" style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><Server size={14} /> PDF serveur</button>
        </div>
      </div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 24, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>Devis quantitatif et estimatif — {numero}</h2>
              <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{client}</div>
            </div>
            <StatutBadge s={statut} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginTop: 16 }}>
            <Kpi label="Total HT après remise" value={fcfa(htNet)} />
            <Kpi label={`TTC (TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %)`} value={fcfa(ttc)} color={C.orange} />
            <Kpi label="Ratio au m²" value={surface > 0 ? `${fcfa(Math.round(ttc / surface))}/m²` : "—"} sub={surface > 0 ? `${surface} m²` : "Renseigner la surface ci-dessous"} />
          </div>
        </div>
      </Card>

      {lots.map((lot) => {
        const sos = sous.filter((s) => s.lotId === lot.id);
        const stLot = sos.reduce((a, so) => a + lignes.filter((l) => l.sousOuvrageId === so.id).reduce((b, l) => b + montantLigne(l), 0), 0);
        return (
          <Card key={lot.id} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.steel, color: C.white }}>
              <span style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{lot.nom}</span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}><b>{fcfa(stLot)}</b><button onClick={() => delLot(lot.id)} title="Supprimer le lot" style={{ background: "none", border: "none", cursor: "pointer", color: "#E9A9A9" }}><Trash2 size={15} /></button></span>
            </div>
            <div style={{ padding: 12, display: "grid", gap: 12 }}>
              {sos.map((so) => {
                const ls = lignes.filter((l) => l.sousOuvrageId === so.id);
                const stSo = ls.reduce((a, l) => a + montantLigne(l), 0);
                return (
                  <div key={so.id} style={{ border: `1px solid ${C.line}`, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.concrete }}>
                      <b style={{ color: C.steel, fontSize: 14 }}>{so.nom}</b>
                      <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}><b>{fcfa(stSo)}</b><button onClick={() => delSous(so.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button></span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr style={{ color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 6, width: "40%" }}>Désignation</th><th style={{ padding: 6 }}>Unité</th><th style={{ padding: 6 }}>Qté</th><th style={{ padding: 6 }}>P.U.</th><th style={{ padding: 6 }}>Montant</th><th></th></tr></thead>
                      <tbody>
                        {ls.map((l) => (
                          <tr key={l.id} style={{ borderTop: `1px solid ${C.line}` }}>
                            <td style={{ padding: 6 }}><input style={input} value={l.designation} onChange={(e) => saveLigne(l, { designation: e.target.value })} /></td>
                            <td style={{ padding: 6, width: 80 }}><select style={input} value={l.unite} onChange={(e) => saveLigne(l, { unite: e.target.value })}>{UNITES.map((u) => <option key={u}>{u}</option>)}</select></td>
                            <td style={{ padding: 6, width: 70 }}><input style={input} type="number" value={l.quantite} onChange={(e) => saveLigne(l, { quantite: Number(e.target.value) })} disabled={l.unite === "pm"} /></td>
                            <td style={{ padding: 6, width: 110 }}><input style={input} type="number" value={l.prixUnitaire} onChange={(e) => saveLigne(l, { prixUnitaire: Number(e.target.value) })} disabled={l.unite === "pm"} /></td>
                            <td style={{ padding: 6, whiteSpace: "nowrap", color: l.unite === "pm" ? C.steelSoft : C.steel }}>{l.unite === "pm" ? "p.m." : fcfa(montantLigne(l))}</td>
                            <td style={{ padding: 6 }}><button onClick={() => delLigne(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => addLigne(so.id)} style={{ margin: 8, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${C.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.orange, fontSize: 12 }}><Plus size={13} /> Ligne</button>
                  </div>
                );
              })}
              <button onClick={() => addSous(lot.id)} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${C.orange}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.orange, fontSize: 13, fontWeight: 600 }}><Plus size={14} /> Sous-ouvrage</button>
            </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: C.steelSoft }}>Remise (%)</span><input type="number" min="0" max="100" value={remise} onChange={(e) => saveRemise(Number(e.target.value))} style={{ ...input, width: 90 }} /></div>
          <Row label="Remise" val={"− " + fcfa(remiseAmt)} />
          <Row label="HT après remise" val={fcfa(htNet)} />
          <Row label={`TVA ${(TVA_DEFAULT * 100).toLocaleString("fr-FR")} %`} val={fcfa(tva)} />
          <div style={{ borderTop: `2px solid ${C.steel}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, color: C.steel }}><span>TOTAL TTC</span><span>{fcfa(ttc)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span style={{ color: C.steelSoft }}>Surface (m²)</span>
            <input type="number" min="0" value={surface} onChange={(e) => setSurface(Number(e.target.value))} style={{ ...input, width: 90 }} />
          </div>
          {surface > 0 && <Row label="Ratio au m²" val={fcfa(Math.round(ttc / surface)) + "/m²"} />}
          <button onClick={emettre} style={{ marginTop: 8, padding: 12, border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><FileCheck size={17} /> Émettre &amp; signer (OTP)</button>
        </div>
      </Card>
    </div>
  );
}

const Row = ({ label, val }: { label: string; val: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.steelSoft }}>{label}</span><span>{val}</span></div>
);
