import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, Search, ArrowDownCircle, ArrowUpCircle, Package, RotateCcw, Recycle } from "lucide-react";
import { C, FONTS, Card, SectionTitle, btnGhost, btnPrimary, Modal, ConfirmModal, Field, fieldInput, EmptyState, SkeletonCard } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { humanError } from "../lib/errors";

type Article = { id: string; designation: string; unite: string; stock: number; seuil: number; chantierId: string | null };
type ChantierRef = { id: string; nom: string };
type Caract = { poids?: string; longueur?: string; surface?: string; note?: string };
type Residuel = { id: string; articleId: string; quantite: number; caracteristiques: Caract | null; date: string };

// Format lisible des caractéristiques d'un résiduel (structuré, rétro-compat {note}).
export function fmtCaract(c: Caract | null): string {
  if (!c) return "Sans caractéristiques";
  const p: string[] = [];
  if (c.poids) p.push(`poids ${c.poids}`);
  if (c.longueur) p.push(`long. ${c.longueur}`);
  if (c.surface) p.push(`surf. ${c.surface}`);
  if (c.note) p.push(c.note);
  return p.length ? p.join(" · ") : "Sans caractéristiques";
}

export default function StocksLive() {
  const [rows, setRows] = useState<Article[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRef[]>([]);
  const [residuels, setResiduels] = useState<Residuel[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ designation: "", unite: "", stock: "", seuil: "", chantierId: "" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filtreChantier, setFiltreChantier] = useState("");
  const [mv, setMv] = useState<{ a: Article; type: "ENTREE" | "SORTIE" | "RETOUR" } | null>(null);
  const [mvForm, setMvForm] = useState({ qte: "", motif: "", poids: "", longueur: "", surface: "" });
  const [mvBusy, setMvBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Article | null>(null);

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const [art, cha, res] = await Promise.all([
      supabase.from("articles").select("id,designation,unite,stock,seuil,chantierId").order("designation"),
      supabase.from("chantiers").select("id,nom").order("nom"),
      supabase.from("mouvements_stock").select("id,articleId,quantite,caracteristiques,date").eq("type", "RETOUR").order("date", { ascending: false }),
    ]);
    if (art.error) setErr(art.error.message);
    else setRows((art.data as Article[]) ?? []);
    if (!cha.error) setChantiers((cha.data as ChantierRef[]) ?? []);
    if (!res.error) setResiduels((res.data as Residuel[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const chantierNom = (id: string | null) => chantiers.find((c) => c.id === id)?.nom ?? null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("articles").insert({
      id: crypto.randomUUID(), tenantId, designation: form.designation, unite: form.unite,
      chantierId: form.chantierId || null,
      stock: Number(form.stock) || 0, seuil: Number(form.seuil) || 0,
    });
    setBusy(false);
    if (error) { setErr(humanError(error.message)); return; }
    setForm({ designation: "", unite: "", stock: "", seuil: "", chantierId: "" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setErr(humanError(error.message)); else setRows((r) => r.filter((x) => x.id !== id));
    setConfirmDel(null);
  }
  // Ouvre la modale de mouvement (entrée / sortie / retour résiduel) — remplace window.prompt.
  function openMv(a: Article, type: "ENTREE" | "SORTIE" | "RETOUR") {
    setMvForm({ qte: "", motif: type === "ENTREE" ? "Livraison" : type === "SORTIE" ? "Consommation chantier" : "Retour résiduel", poids: "", longueur: "", surface: "" });
    setMv({ a, type });
  }
  async function submitMv() {
    if (!mv) return;
    const { a, type } = mv;
    const qte = Number(mvForm.qte);
    if (!qte || qte <= 0) { setErr("Quantité invalide."); return; }
    setMvBusy(true); setErr(null);
    let caracteristiques: Caract | null = null;
    if (type === "RETOUR") {
      const car: Caract = {};
      if (mvForm.poids.trim()) car.poids = mvForm.poids.trim();
      if (mvForm.longueur.trim()) car.longueur = mvForm.longueur.trim();
      if (mvForm.surface.trim()) car.surface = mvForm.surface.trim();
      caracteristiques = Object.keys(car).length ? car : null;
    }
    const { error: me } = await supabase.from("mouvements_stock").insert({ id: crypto.randomUUID(), articleId: a.id, type, quantite: qte, motif: mvForm.motif || null, caracteristiques, date: new Date().toISOString() });
    if (me) { setMvBusy(false); setErr(humanError(me.message)); return; }
    const nouveau = type === "SORTIE" ? Number(a.stock) - qte : Number(a.stock) + qte;
    await supabase.from("articles").update({ stock: nouveau }).eq("id", a.id);
    setMvBusy(false); setMv(null); void load();
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const fdate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouvel article
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 0.9fr 0.9fr auto", gap: 10 }}>
          <input style={input} placeholder="Désignation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
          <select style={input} value={form.chantierId} onChange={(e) => setForm({ ...form, chantierId: e.target.value })} title="Projet de rattachement">
            <option value="">Dépôt central</option>
            {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input style={input} placeholder="Unité (sac, m³…)" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} required />
          <input style={input} placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input style={input} placeholder="Seuil" type="number" value={form.seuil} onChange={(e) => setForm({ ...form, seuil: e.target.value })} />
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>{busy ? "…" : "Ajouter"}</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div> : (() => {
        const scoped = rows.filter((a) => !filtreChantier || a.chantierId === (filtreChantier === "DEPOT" ? null : filtreChantier));
        const bas = scoped.filter((a) => Number(a.stock) < Number(a.seuil)).length;
        const list = scoped.filter((a) => a.designation.toLowerCase().includes(q.trim().toLowerCase()));
        return (
          <>
            <SectionTitle icon={Package} action={<div style={{ fontSize: 13, color: C.steelSoft }}>{bas > 0 ? <b style={{ color: C.red }}>{bas} sous seuil</b> : <b style={{ color: C.green }}>Tous au-dessus du seuil</b>} · {scoped.length} réf.</div>}>Stocks &amp; matériaux</SectionTitle>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                <Search size={16} color={C.steelSoft} style={{ position: "absolute", left: 12, top: 11 }} />
                <input placeholder="Rechercher un matériau…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...input, paddingLeft: 36, width: "100%", boxSizing: "border-box" }} />
              </div>
              <select style={{ ...input, minWidth: 200 }} value={filtreChantier} onChange={(e) => setFiltreChantier(e.target.value)}>
                <option value="">Tous les dépôts</option>
                <option value="DEPOT">Dépôt central</option>
                {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {list.map((a) => {
                const alerte = Number(a.stock) < Number(a.seuil);
                return (
                  <Card key={a.id} style={{ padding: 16, borderLeft: `4px solid ${alerte ? C.red : C.green}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.steel }}>{a.designation}</div>
                        <div style={{ fontSize: 12, color: C.steelSoft }}>Unité : {a.unite} · {chantierNom(a.chantierId) ?? "Dépôt central"}</div>
                      </div>
                      {alerte ? <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0 }} /> : <button onClick={() => setConfirmDel(a)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.steelSoft, padding: 4 }}><Trash2 size={16} /></button>}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                      <span style={{ fontFamily: FONTS.condensed, fontSize: 32, fontWeight: 700, color: alerte ? C.red : C.steel }}>{Number(a.stock)}</span>
                      <span style={{ fontSize: 13, color: C.steelSoft }}>{a.unite} · seuil {Number(a.seuil)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button style={{ ...btnGhost, color: C.green, borderColor: C.greenSoft, flex: 1, justifyContent: "center" }} onClick={() => openMv(a, "ENTREE")}>
                        <ArrowDownCircle size={14} /> Entrée
                      </button>
                      <button style={{ ...btnGhost, color: C.red, borderColor: C.redSoft, flex: 1, justifyContent: "center" }} onClick={() => openMv(a, "SORTIE")}>
                        <ArrowUpCircle size={14} /> Sortie
                      </button>
                      <button style={{ ...btnGhost, color: C.orange, borderColor: C.orangeSoft, flex: 1, justifyContent: "center" }} onClick={() => openMv(a, "RETOUR")} title="Retour magasin d'un résiduel réutilisable">
                        <RotateCcw size={14} /> Résiduel
                      </button>
                    </div>
                  </Card>
                );
              })}
              {list.length === 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  {q
                    ? <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun matériau pour «&nbsp;{q}&nbsp;».</div>
                    : <EmptyState icon={Package} title="Aucun article en stock" hint="Ajoutez un matériau via le formulaire ci-dessus, ou réceptionnez une commande depuis Commercial → Commandes." />}
                </div>
              )}
            </div>

            {residuels.length > 0 && (
              <Card>
                <SectionTitle icon={Recycle}>Matériaux résiduels (réutilisables)</SectionTitle>
                <div style={{ display: "grid", gap: 8 }}>
                  {residuels.map((r) => {
                    const a = rows.find((x) => x.id === r.articleId);
                    return (
                      <div key={r.id} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.orange}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: C.steel }}>{a?.designation ?? "Article supprimé"} — {Number(r.quantite)} {a?.unite ?? ""}</div>
                          <div style={{ fontSize: 12, color: C.steelSoft }}>{fmtCaract(r.caracteristiques)}{a ? ` · ${chantierNom(a.chantierId) ?? "Dépôt central"}` : ""}</div>
                        </div>
                        <span style={{ fontSize: 12, color: C.steelSoft, whiteSpace: "nowrap" }}>{fdate(r.date)}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>Restes non utilisés retournés au magasin — mobilisables sur un futur besoin via une fiche de besoin.</div>
              </Card>
            )}
          </>
        );
      })()}

      {mv && (
        <Modal
          title={mv.type === "ENTREE" ? "Entrée de stock" : mv.type === "SORTIE" ? "Sortie de stock" : "Retour résiduel"}
          onClose={() => setMv(null)}
          footer={<>
            <button onClick={() => setMv(null)} style={btnGhost}>Annuler</button>
            <button onClick={submitMv} disabled={mvBusy} style={btnPrimary}>{mvBusy ? "…" : "Valider"}</button>
          </>}
        >
          <div style={{ fontSize: 13, color: C.steelSoft }}>{mv.a.designation} · {mv.a.unite} · stock actuel {Number(mv.a.stock)}</div>
          <Field label={`Quantité (${mv.a.unite})`}>
            <input style={fieldInput} type="number" min="0" autoFocus value={mvForm.qte} onChange={(e) => setMvForm({ ...mvForm, qte: e.target.value })} />
          </Field>
          <Field label="Motif">
            <input style={fieldInput} value={mvForm.motif} onChange={(e) => setMvForm({ ...mvForm, motif: e.target.value })} />
          </Field>
          {mv.type === "RETOUR" && <>
            <Field label="Poids" hint="ex : 40 kg (laisser vide si non applicable)"><input style={fieldInput} value={mvForm.poids} onChange={(e) => setMvForm({ ...mvForm, poids: e.target.value })} /></Field>
            <Field label="Longueur" hint="ex : 2 m"><input style={fieldInput} value={mvForm.longueur} onChange={(e) => setMvForm({ ...mvForm, longueur: e.target.value })} /></Field>
            <Field label="Surface" hint="ex : 3 m²"><input style={fieldInput} value={mvForm.surface} onChange={(e) => setMvForm({ ...mvForm, surface: e.target.value })} /></Field>
          </>}
        </Modal>
      )}

      {confirmDel && (
        <ConfirmModal danger confirmLabel="Supprimer" title="Supprimer l'article"
          message={<>Supprimer <b>{confirmDel.designation}</b> du stock ? Son historique de mouvements sera orphelin. Action irréversible.</>}
          onConfirm={() => remove(confirmDel.id)} onClose={() => setConfirmDel(null)} />
      )}
    </div>
  );
}
