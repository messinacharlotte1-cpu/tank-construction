import { useEffect, useState } from "react";
import { FileText, Plus, Trash2, Printer, Truck, Recycle, ClipboardList, CalendarDays, Boxes, PackageCheck } from "lucide-react";
import { C, FONTS, Card, SectionTitle } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { printDocument } from "../lib/pdf";

// Fiches magasin/chantier — documents générés (PDF navigateur via printDocument),
// tous rattachés à un projet. Certaines dérivées des données (inventaire, stock
// quotidien, collecte résiduels, rapport journalier), d'autres saisies (BL, besoin).

type ChantierRef = { id: string; nom: string };
type Ref = { id: string; nom: string };
type Article = { id: string; designation: string; unite: string; stock: number; seuil: number; chantierId: string | null };
type Mouvement = { articleId: string; type: string; quantite: number; motif: string | null; caracteristiques: { note?: string } | null; date: string };
type Journal = { chantierId: string; date: string; auteur: string; meteo: string | null; texte: string };
type Ligne = { designation: string; qte: string; unite: string };

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
const fdate = (d: string) => new Date(d).toLocaleDateString("fr-FR");
const today = () => new Date().toLocaleDateString("fr-FR");

export default function FichesLive() {
  const [chantiers, setChantiers] = useState<ChantierRef[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Ref[]>([]);
  const [sousTraitants, setSousTraitants] = useState<Ref[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [journal, setJournal] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState(""); // "" tous | "DEPOT" | chantierId
  const [fournisseurId, setFournisseurId] = useState("");
  const [sousTraitantId, setSousTraitantId] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([{ designation: "", qte: "", unite: "" }]);

  async function load() {
    setLoading(true);
    await getTenant();
    const [cha, fo, st, ar, mv, jr] = await Promise.all([
      supabase.from("chantiers").select("id,nom").order("nom"),
      supabase.from("fournisseurs").select("id,nom").order("nom"),
      supabase.from("sous_traitants").select("id,nom").order("nom"),
      supabase.from("articles").select("id,designation,unite,stock,seuil,chantierId").order("designation"),
      supabase.from("mouvements_stock").select("articleId,type,quantite,motif,caracteristiques,date").order("date", { ascending: false }),
      supabase.from("journal_chantier").select("chantierId,date,auteur,meteo,texte").order("date", { ascending: false }),
    ]);
    if (!cha.error) setChantiers((cha.data as ChantierRef[]) ?? []);
    if (!fo.error) setFournisseurs((fo.data as Ref[]) ?? []);
    if (!st.error) setSousTraitants((st.data as Ref[]) ?? []);
    if (!ar.error) setArticles((ar.data as Article[]) ?? []);
    if (!mv.error) setMouvements((mv.data as Mouvement[]) ?? []);
    if (!jr.error) setJournal((jr.data as Journal[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const scopeNom = () => (scope === "" ? "Tous dépôts" : scope === "DEPOT" ? "Dépôt central" : chantiers.find((c) => c.id === scope)?.nom ?? "Projet");
  const scopedArticles = () => articles.filter((a) => scope === "" || a.chantierId === (scope === "DEPOT" ? null : scope));
  const artNom = (id: string) => articles.find((a) => a.id === id);

  // En-tête commun (charte Tank).
  const header = (titre: string, sous: string) =>
    `<div class="brand"><span class="logo">TANK</span><h1>${esc(titre)}</h1></div><div class="bar"></div>` +
    `<p class="muted">${esc(sous)} · Édité le ${today()}</p>`;

  const lignesValides = () => lignes.filter((l) => l.designation.trim());
  const setLigne = (i: number, k: keyof Ligne, v: string) => setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const addLigne = () => setLignes((ls) => [...ls, { designation: "", qte: "", unite: "" }]);
  const delLigne = (i: number) => setLignes((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls));

  function tableHtml(head: string[], rows: string[][]) {
    return `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  // ── 1. Bordereau de livraison (fournisseur → chantier), saisi ──
  function genBL() {
    const fo = fournisseurs.find((f) => f.id === fournisseurId);
    const ls = lignesValides();
    if (!fo) return alert("Choisissez un fournisseur.");
    if (!ls.length) return alert("Ajoutez au moins une ligne.");
    const body = header("Bordereau de livraison", `Fournisseur : ${fo.nom} · Chantier : ${scopeNom()}`) +
      tableHtml(["Désignation", "Quantité", "Unité"], ls.map((l) => [l.designation, l.qte || "—", l.unite || "—"])) +
      `<p class="muted" style="margin-top:24px">Réceptionné par : ____________________ &nbsp;&nbsp; Signature : ____________________</p>`;
    printDocument(`BL-${fo.nom}`, body);
  }

  // ── 2. Fiche de collecte des matériaux résiduels et rebus (dérivée RETOUR) ──
  function genCollecte() {
    const ids = new Set(scopedArticles().map((a) => a.id));
    const rets = mouvements.filter((m) => m.type === "RETOUR" && ids.has(m.articleId));
    const body = header("Fiche de collecte — matériaux résiduels & rebus", `Périmètre : ${scopeNom()}`) +
      (rets.length
        ? tableHtml(["Date", "Matériau", "Quantité", "Caractéristiques"], rets.map((m) => { const a = artNom(m.articleId); return [fdate(m.date), a?.designation ?? "—", `${Number(m.quantite)} ${a?.unite ?? ""}`.trim(), m.caracteristiques?.note ?? "—"]; }))
        : `<p class="muted">Aucun résiduel enregistré pour ce périmètre.</p>`) +
      `<p class="muted" style="margin-top:24px">Collecté par : ____________________ &nbsp;&nbsp; Destination magasin : ____________________</p>`;
    printDocument(`Collecte-residuels-${scopeNom()}`, body);
  }

  // ── 3. Fiche d'état de besoin sous-traitant (nouveau matériel / résiduel), saisie ──
  function genBesoin() {
    const st = sousTraitants.find((s) => s.id === sousTraitantId);
    const ls = lignesValides();
    if (!st) return alert("Choisissez un sous-traitant.");
    if (!ls.length) return alert("Ajoutez au moins une ligne.");
    const body = header("Fiche d'état de besoin — sous-traitant", `Sous-traitant : ${st.nom} · Chantier : ${scopeNom()}`) +
      tableHtml(["Désignation", "Quantité", "Unité"], ls.map((l) => [l.designation, l.qte || "—", l.unite || "—"])) +
      `<p class="banner">Nature du besoin (nouveau matériel et/ou résiduel réutilisable) à préciser par le maître d'œuvre.</p>` +
      `<p class="muted" style="margin-top:16px">Demandé par : ____________________ &nbsp;&nbsp; Approuvé (MOE) : ____________________</p>`;
    printDocument(`Besoin-${st.nom}`, body);
  }

  // ── 4. Fiche de rapport journalier des travaux exécutés (dérivée journal) ──
  function genRapport() {
    if (scope === "" || scope === "DEPOT") return alert("Choisissez un chantier (pas un dépôt) pour le rapport journalier.");
    const js = journal.filter((j) => j.chantierId === scope);
    const body = header("Rapport journalier des travaux exécutés", `Chantier : ${scopeNom()}`) +
      (js.length
        ? js.map((j) => `<p style="margin:10px 0 2px"><b>${fdate(j.date)} — ${esc(j.auteur)}</b>${j.meteo ? ` <span class="muted">(${esc(j.meteo)})</span>` : ""}</p><p style="margin:0">${esc(j.texte)}</p>`).join("")
        : `<p class="muted">Aucune entrée de journal pour ce chantier.</p>`);
    printDocument(`Rapport-journalier-${scopeNom()}`, body);
  }

  // ── 5. Fiche d'inventaire (snapshot stock du périmètre) ──
  function genInventaire() {
    const as = scopedArticles();
    const body = header("Fiche d'inventaire", `Périmètre : ${scopeNom()} · ${as.length} référence(s)`) +
      tableHtml(["Matériau", "Unité", "Stock", "Seuil", "État"], as.map((a) => [a.designation, a.unite, String(Number(a.stock)), String(Number(a.seuil)), Number(a.stock) < Number(a.seuil) ? "SOUS SEUIL" : "OK"])) +
      `<p class="muted" style="margin-top:24px">Inventaire réalisé par : ____________________ &nbsp;&nbsp; Date : ${today()}</p>`;
    printDocument(`Inventaire-${scopeNom()}`, body);
  }

  // ── 6. Fiche de stock quotidien (snapshot + mouvements du jour) ──
  function genStockQuotidien() {
    const as = scopedArticles();
    const ids = new Set(as.map((a) => a.id));
    const jour = new Date().toISOString().slice(0, 10);
    const mvJour = mouvements.filter((m) => ids.has(m.articleId) && (m.date ?? "").slice(0, 10) === jour);
    const body = header("Fiche de stock quotidien", `Périmètre : ${scopeNom()} · ${today()}`) +
      tableHtml(["Matériau", "Unité", "Stock du jour", "Seuil"], as.map((a) => [a.designation, a.unite, String(Number(a.stock)), String(Number(a.seuil))])) +
      `<h3 style="margin-top:18px">Mouvements du jour</h3>` +
      (mvJour.length
        ? tableHtml(["Matériau", "Type", "Quantité", "Motif"], mvJour.map((m) => { const a = artNom(m.articleId); return [a?.designation ?? "—", m.type, `${Number(m.quantite)} ${a?.unite ?? ""}`.trim(), m.motif ?? "—"]; }))
        : `<p class="muted">Aucun mouvement aujourd'hui.</p>`);
    printDocument(`Stock-quotidien-${scopeNom()}`, body);
  }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const btn = (fn: () => void, label: string, Icon: typeof FileText) => (
    <button onClick={fn} style={{ display: "flex", alignItems: "center", gap: 8, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
      <Icon size={15} /> {label}
    </button>
  );
  const derive = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green, fontWeight: 700, textTransform: "uppercase" as const };
  const saisie = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: C.orange, fontWeight: 700, textTransform: "uppercase" as const };

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>Périmètre :</span>
        <select style={{ ...inp, minWidth: 220 }} value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">Tous les dépôts</option>
          <option value="DEPOT">Dépôt central</option>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.steelSoft }}>Les fiches et documents ci-dessous sont générés pour ce périmètre.</span>
      </Card>

      {/* Fiches dérivées des données */}
      <SectionTitle icon={PackageCheck}>Fiches générées (données réelles)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
        <Card style={{ display: "grid", gap: 10 }}>
          <div style={derive}>Auto</div>
          <div style={{ fontWeight: 700, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><Recycle size={16} color={C.orange} /> Collecte résiduels & rebus</div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>À partir des retours magasin (mouvements RETOUR) du périmètre.</div>
          {btn(genCollecte, "Générer PDF", Printer)}
        </Card>
        <Card style={{ display: "grid", gap: 10 }}>
          <div style={derive}>Auto</div>
          <div style={{ fontWeight: 700, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><CalendarDays size={16} color={C.orange} /> Rapport journalier des travaux</div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>À partir du journal de chantier (choisir un chantier).</div>
          {btn(genRapport, "Générer PDF", Printer)}
        </Card>
        <Card style={{ display: "grid", gap: 10 }}>
          <div style={derive}>Auto</div>
          <div style={{ fontWeight: 700, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><Boxes size={16} color={C.orange} /> Fiche d'inventaire</div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>Snapshot complet du stock du périmètre.</div>
          {btn(genInventaire, "Générer PDF", Printer)}
        </Card>
        <Card style={{ display: "grid", gap: 10 }}>
          <div style={derive}>Auto</div>
          <div style={{ fontWeight: 700, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><ClipboardList size={16} color={C.orange} /> Fiche de stock quotidien</div>
          <div style={{ fontSize: 12, color: C.steelSoft }}>Stock du jour + mouvements de la journée.</div>
          {btn(genStockQuotidien, "Générer PDF", Printer)}
        </Card>
      </div>

      {/* Fiches saisies (lignes) */}
      <SectionTitle icon={FileText}>Fiches saisies (bordereau & besoin)</SectionTitle>
      <Card style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select style={{ ...inp, minWidth: 200 }} value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)}>
            <option value="">Fournisseur (pour le BL)…</option>
            {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <select style={{ ...inp, minWidth: 200 }} value={sousTraitantId} onChange={(e) => setSousTraitantId(e.target.value)}>
            <option value="">Sous-traitant (pour le besoin)…</option>
            {sousTraitants.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr auto", gap: 8 }}>
              <input style={inp} placeholder="Désignation" value={l.designation} onChange={(e) => setLigne(i, "designation", e.target.value)} />
              <input style={inp} placeholder="Qté" value={l.qte} onChange={(e) => setLigne(i, "qte", e.target.value)} />
              <input style={inp} placeholder="Unité" value={l.unite} onChange={(e) => setLigne(i, "unite", e.target.value)} />
              <button onClick={() => delLigne(i)} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, cursor: "pointer", color: C.red, padding: "0 10px" }}><Trash2 size={15} /></button>
            </div>
          ))}
          <button onClick={addLigne} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel, fontSize: 13 }}><Plus size={14} /> Ligne</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}><span style={saisie}>Saisie</span>{btn(genBL, "Bordereau de livraison", Truck)}</div>
          <div style={{ display: "grid", gap: 6 }}><span style={saisie}>Saisie</span>{btn(genBesoin, "État de besoin sous-traitant", ClipboardList)}</div>
        </div>
      </Card>
    </div>
  );
}
