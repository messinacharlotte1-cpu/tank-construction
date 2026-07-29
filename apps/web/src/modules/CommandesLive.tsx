import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingCart, FileText, BadgeCheck, PackageCheck } from "lucide-react";
import { C, FONTS, Card, StatutBadge, SectionTitle, fcfa, EmptyState, SkeletonCard } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { printDocument, fcfaP } from "../lib/pdf";

type Ligne = { id: string; commandeId: string; articleId: string | null; designation: string; unite: string; quantite: number; prixUnitaire: number };
type Commande = { id: string; numero: string; statut: string; devisId: string | null; fournisseurId: string | null; chantierId: string | null; createdAt: string };
type DevisRef = { id: string; numero: string; client: string; chantierId: string | null };
type Ref = { id: string; nom: string };
type ArticleRef = { id: string; designation: string; unite: string; stock: number; chantierId: string | null };
type FLigne = { designation: string; unite: string; qte: string; pu: string; articleId: string };

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

export default function CommandesLive() {
  const [rows, setRows] = useState<Commande[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [devis, setDevis] = useState<DevisRef[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Ref[]>([]);
  const [chantiers, setChantiers] = useState<Ref[]>([]);
  const [articles, setArticles] = useState<ArticleRef[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ devisId: "", fournisseurId: "", chantierId: "" });
  const [fl, setFl] = useState<FLigne[]>([{ designation: "", unite: "", qte: "", pu: "", articleId: "" }]);

  async function load() {
    setLoading(true);
    setTid(await getTenant());
    const [cmd, lg, dv, fo, cha, ar] = await Promise.all([
      supabase.from("commandes").select("id,numero,statut,devisId,fournisseurId,chantierId,createdAt").order("numero", { ascending: false }),
      supabase.from("commande_lignes").select("id,commandeId,articleId,designation,unite,quantite,prixUnitaire"),
      supabase.from("devis").select("id,numero,client,chantierId").order("numero", { ascending: false }),
      supabase.from("fournisseurs").select("id,nom").order("nom"),
      supabase.from("chantiers").select("id,nom").order("nom"),
      supabase.from("articles").select("id,designation,unite,stock,chantierId").order("designation"),
    ]);
    if (cmd.error) setErr(cmd.error.message); else setRows((cmd.data as Commande[]) ?? []);
    if (!lg.error) setLignes((lg.data as Ligne[]) ?? []);
    if (!dv.error) setDevis((dv.data as DevisRef[]) ?? []);
    if (!fo.error) setFournisseurs((fo.data as Ref[]) ?? []);
    if (!cha.error) setChantiers((cha.data as Ref[]) ?? []);
    if (!ar.error) setArticles((ar.data as ArticleRef[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const nom = (arr: Ref[], id: string | null) => arr.find((x) => x.id === id)?.nom ?? null;
  const numDevis = (id: string | null) => devis.find((d) => d.id === id)?.numero ?? null;
  const lignesDe = (cid: string) => lignes.filter((l) => l.commandeId === cid);
  const totalDe = (cid: string) => lignesDe(cid).reduce((s, l) => s + Number(l.quantite) * Number(l.prixUnitaire), 0);

  // Prefill chantier depuis le devis choisi.
  function pickDevis(id: string) {
    const d = devis.find((x) => x.id === id);
    setForm((f) => ({ ...f, devisId: id, chantierId: d?.chantierId || f.chantierId }));
  }
  const setL = (i: number, k: keyof FLigne, v: string) => setFl((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const addL = () => setFl((ls) => [...ls, { designation: "", unite: "", qte: "", pu: "", articleId: "" }]);
  const delL = (i: number) => setFl((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls));
  // Sélection d'un article existant → préremplit désignation/unité.
  function pickArticle(i: number, aid: string) {
    const a = articles.find((x) => x.id === aid);
    setFl((ls) => ls.map((l, j) => (j === i ? { ...l, articleId: aid, designation: a ? a.designation : l.designation, unite: a ? a.unite : l.unite } : l)));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tid) return;
    const valides = fl.filter((l) => l.designation.trim());
    if (!valides.length) { setErr("Ajoutez au moins une ligne."); return; }
    setBusy(true); setErr(null);
    const { data: numero, error: ne } = await supabase.rpc("next_numero", { kind: "commande" });
    if (ne) { setBusy(false); setErr(ne.message); return; }
    const cid = crypto.randomUUID();
    const { error: ce } = await supabase.from("commandes").insert({
      id: cid, tenantId: tid, numero: numero as string,
      devisId: form.devisId || null, fournisseurId: form.fournisseurId || null, chantierId: form.chantierId || null,
      statut: "Brouillon", createdAt: new Date().toISOString(),
    });
    if (ce) { setBusy(false); setErr(ce.message); return; }
    const payload = valides.map((l) => ({ id: crypto.randomUUID(), commandeId: cid, articleId: l.articleId || null, designation: l.designation, unite: l.unite || "u", quantite: Number(l.qte) || 0, prixUnitaire: Number(l.pu) || 0 }));
    const { error: le } = await supabase.from("commande_lignes").insert(payload);
    setBusy(false);
    if (le) { setErr(le.message); return; }
    setForm({ devisId: "", fournisseurId: "", chantierId: "" });
    setFl([{ designation: "", unite: "", qte: "", pu: "", articleId: "" }]);
    void load();
  }
  async function remove(c: Commande) {
    await supabase.from("commande_lignes").delete().eq("commandeId", c.id);
    await supabase.from("commandes").delete().eq("id", c.id);
    void load();
  }

  // Document PDF (proforma ou reçu) à partir de la commande + lignes.
  function docPdf(c: Commande, kind: "Proforma" | "Reçu") {
    const ls = lignesDe(c.id);
    const tot = totalDe(c.id);
    const head = `<div class="brand"><span class="logo">TANK</span><h1>${kind} ${esc(c.numero)}</h1></div><div class="bar"></div>` +
      `<p class="muted">Fournisseur : ${esc(nom(fournisseurs, c.fournisseurId) ?? "—")} · Chantier : ${esc(nom(chantiers, c.chantierId) ?? "—")}${c.devisId ? ` · Devis : ${esc(numDevis(c.devisId) ?? "—")}` : ""}</p>`;
    const table = `<table><thead><tr><th>Désignation</th><th>U</th><th class="right">Qté</th><th class="right">P.U.</th><th class="right">Montant</th></tr></thead><tbody>` +
      ls.map((l) => `<tr><td>${esc(l.designation)}</td><td>${esc(l.unite)}</td><td class="right">${Number(l.quantite)}</td><td class="right">${fcfaP(Number(l.prixUnitaire))}</td><td class="right">${fcfaP(Number(l.quantite) * Number(l.prixUnitaire))}</td></tr>`).join("") +
      `</tbody><tfoot><tr><td colspan="4" class="right"><b>Total</b></td><td class="right"><b>${fcfaP(tot)}</b></td></tr></tfoot></table>`;
    const pied = kind === "Reçu"
      ? `<p class="banner">Reçu de paiement — commande réglée. Bon pour réception en magasin.</p>`
      : `<p class="muted" style="margin-top:20px">Valable 30 jours. À régler avant réception.</p>`;
    printDocument(`${kind}-${c.numero}`, head + table + pied);
  }

  async function setStatut(c: Commande, statut: string) {
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, statut } : x)));
    await supabase.from("commandes").update({ statut }).eq("id", c.id);
  }
  async function proforma(c: Commande) { docPdf(c, "Proforma"); if (c.statut === "Brouillon") await setStatut(c, "Proforma"); }
  async function payer(c: Commande) { docPdf(c, "Reçu"); await setStatut(c, "Payée"); }

  // Réception : chaque ligne → entrée en stock (article existant ou créé).
  async function receptionner(c: Commande) {
    if (!tid) return;
    if (!window.confirm(`Réceptionner la commande ${c.numero} ? Les quantités entrent en stock.`)) return;
    setErr(null);
    for (const l of lignesDe(c.id)) {
      let articleId = l.articleId;
      if (!articleId) {
        articleId = crypto.randomUUID();
        const { error } = await supabase.from("articles").insert({ id: articleId, tenantId: tid, chantierId: c.chantierId || null, designation: l.designation, unite: l.unite, stock: Number(l.quantite), seuil: 0 });
        if (error) { setErr(error.message); return; }
        await supabase.from("commande_lignes").update({ articleId }).eq("id", l.id);
      } else {
        const a = articles.find((x) => x.id === articleId);
        const nouveau = (a ? Number(a.stock) : 0) + Number(l.quantite);
        await supabase.from("articles").update({ stock: nouveau }).eq("id", articleId);
      }
      const { error: me } = await supabase.from("mouvements_stock").insert({ id: crypto.randomUUID(), articleId, type: "ENTREE", quantite: Number(l.quantite), motif: `Réception commande ${c.numero}`, date: new Date().toISOString() });
      if (me) { setErr(me.message); return; }
    }
    await setStatut(c, "Reçue");
    void load();
  }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const actBtn = (fn: () => void, label: string, Icon: typeof FileText, col: string) => (
    <button onClick={fn} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: col, fontSize: 13 }}><Icon size={14} /> {label}</button>
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCart size={18} color={C.orange} /> Nouvelle commande
        </div>
        <form onSubmit={create} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select style={inp} value={form.devisId} onChange={(e) => pickDevis(e.target.value)}>
              <option value="">Devis d'origine (optionnel)…</option>
              {devis.map((d) => <option key={d.id} value={d.id}>{d.numero} — {d.client}</option>)}
            </select>
            <select style={inp} value={form.fournisseurId} onChange={(e) => setForm({ ...form, fournisseurId: e.target.value })}>
              <option value="">Fournisseur…</option>
              {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <select style={inp} value={form.chantierId} onChange={(e) => setForm({ ...form, chantierId: e.target.value })}>
              <option value="">Chantier destinataire…</option>
              {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {fl.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.7fr 0.6fr 0.9fr auto", gap: 8 }}>
                <select style={inp} value={l.articleId} onChange={(e) => pickArticle(i, e.target.value)}>
                  <option value="">Article libre…</option>
                  {articles.map((a) => <option key={a.id} value={a.id}>{a.designation}</option>)}
                </select>
                <input style={inp} placeholder="Désignation" value={l.designation} onChange={(e) => setL(i, "designation", e.target.value)} />
                <input style={inp} placeholder="Unité" value={l.unite} onChange={(e) => setL(i, "unite", e.target.value)} />
                <input style={inp} placeholder="Qté" type="number" value={l.qte} onChange={(e) => setL(i, "qte", e.target.value)} />
                <input style={inp} placeholder="P.U. FCFA" type="number" value={l.pu} onChange={(e) => setL(i, "pu", e.target.value)} />
                <button type="button" onClick={() => delL(i)} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, cursor: "pointer", color: C.red, padding: "0 10px" }}><Trash2 size={15} /></button>
              </div>
            ))}
            <button type="button" onClick={addL} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel, fontSize: 13 }}><Plus size={14} /> Ligne</button>
          </div>
          <button type="submit" disabled={busy} style={{ justifySelf: "start", padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>{busy ? "…" : "Créer la commande"}</button>
        </form>
        <div style={{ marginTop: 8, fontSize: 12, color: C.steelSoft }}>N° auto. Flux : Brouillon → Proforma → Payée (reçu) → Reçue (entrée stock auto).</div>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Aucune commande" hint="Créez une commande via le formulaire ci-dessus — depuis un devis, elle préremplit le chantier, puis se déroule jusqu'à la réception en stock." />
      ) : (
        <>
          <SectionTitle icon={ShoppingCart}>Commandes ({rows.length})</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((c) => {
              const ls = lignesDe(c.id);
              return (
                <Card key={c.id} style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, color: C.steel }}>{c.numero}</div>
                      <StatutBadge s={c.statut} />
                    </div>
                    <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, color: C.steel }}>{fcfa(totalDe(c.id))}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>
                    {nom(fournisseurs, c.fournisseurId) ?? "Fournisseur —"} · {nom(chantiers, c.chantierId) ?? "Chantier —"}{c.devisId ? ` · Devis ${numDevis(c.devisId)}` : ""} · {ls.length} ligne(s)
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {actBtn(() => proforma(c), "Proforma PDF", FileText, C.orange)}
                    {c.statut !== "Reçue" && c.statut !== "Payée" && actBtn(() => payer(c), "Payée + reçu", BadgeCheck, C.green)}
                    {c.statut === "Payée" && actBtn(() => receptionner(c), "Réceptionner (stock)", PackageCheck, C.green)}
                    {actBtn(() => remove(c), "Supprimer", Trash2, C.red)}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
