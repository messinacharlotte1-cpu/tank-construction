import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, Search, ArrowDownCircle, ArrowUpCircle, Package, RotateCcw, Recycle } from "lucide-react";
import { C, FONTS, Card, SectionTitle, btnGhost } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

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
    if (error) { setErr(error.message); return; }
    setForm({ designation: "", unite: "", stock: "", seuil: "", chantierId: "" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }
  async function mouvement(a: Article, type: "ENTREE" | "SORTIE") {
    const qte = Number(window.prompt(`${type === "ENTREE" ? "Entrée" : "Sortie"} — quantité (${a.unite}) :`, "0"));
    if (!qte || qte <= 0) return;
    const motif = window.prompt("Motif :", type === "ENTREE" ? "Livraison" : "Consommation chantier") ?? null;
    const { error: me } = await supabase.from("mouvements_stock").insert({ id: crypto.randomUUID(), articleId: a.id, type, quantite: qte, motif, date: new Date().toISOString() });
    if (me) return setErr(me.message.includes("row-level") ? "Droits insuffisants (rôle) pour un mouvement." : me.message);
    const nouveau = type === "ENTREE" ? Number(a.stock) + qte : Number(a.stock) - qte;
    await supabase.from("articles").update({ stock: nouveau }).eq("id", a.id);
    void load();
  }
  // Retour magasin d'un matériau résiduel réutilisable (mouvement RETOUR + caractéristiques).
  async function residuel(a: Article) {
    const qte = Number(window.prompt(`Retour résiduel — quantité (${a.unite}) :`, "0"));
    if (!qte || qte <= 0) return;
    const poids = (window.prompt("Poids (ex : 40 kg — laisser vide si non applicable) :", "") ?? "").trim();
    const longueur = (window.prompt("Longueur (ex : 2 m) :", "") ?? "").trim();
    const surface = (window.prompt("Surface (ex : 3 m²) :", "") ?? "").trim();
    const car: Caract = {};
    if (poids) car.poids = poids;
    if (longueur) car.longueur = longueur;
    if (surface) car.surface = surface;
    const { error: me } = await supabase.from("mouvements_stock").insert({
      id: crypto.randomUUID(), articleId: a.id, type: "RETOUR", quantite: qte,
      motif: "Retour résiduel", caracteristiques: Object.keys(car).length ? car : null, date: new Date().toISOString(),
    });
    if (me) return setErr(me.message.includes("row-level") ? "Droits insuffisants (rôle) pour un mouvement." : me.message);
    await supabase.from("articles").update({ stock: Number(a.stock) + qte }).eq("id", a.id);
    void load();
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
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (() => {
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
                      {alerte ? <AlertTriangle size={18} color={C.red} style={{ flexShrink: 0 }} /> : <button onClick={() => remove(a.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.steelSoft, padding: 0 }}><Trash2 size={16} /></button>}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                      <span style={{ fontFamily: FONTS.condensed, fontSize: 32, fontWeight: 700, color: alerte ? C.red : C.steel }}>{Number(a.stock)}</span>
                      <span style={{ fontSize: 13, color: C.steelSoft }}>{a.unite} · seuil {Number(a.seuil)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button style={{ ...btnGhost, color: C.green, borderColor: C.greenSoft, flex: 1, justifyContent: "center" }} onClick={() => mouvement(a, "ENTREE")}>
                        <ArrowDownCircle size={14} /> Entrée
                      </button>
                      <button style={{ ...btnGhost, color: C.red, borderColor: C.redSoft, flex: 1, justifyContent: "center" }} onClick={() => mouvement(a, "SORTIE")}>
                        <ArrowUpCircle size={14} /> Sortie
                      </button>
                      <button style={{ ...btnGhost, color: C.orange, borderColor: C.orangeSoft, flex: 1, justifyContent: "center" }} onClick={() => residuel(a)} title="Retour magasin d'un résiduel réutilisable">
                        <RotateCcw size={14} /> Résiduel
                      </button>
                    </div>
                  </Card>
                );
              })}
              {list.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>{q ? "Aucun matériau pour cette recherche." : "Aucun article."}</div>}
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
    </div>
  );
}
