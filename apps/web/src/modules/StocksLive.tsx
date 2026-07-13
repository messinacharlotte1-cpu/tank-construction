import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, Search, ArrowDownCircle, ArrowUpCircle, Package } from "lucide-react";
import { C, FONTS, Card, SectionTitle, btnGhost } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Article = { id: string; designation: string; unite: string; stock: number; seuil: number };

export default function StocksLive() {
  const [rows, setRows] = useState<Article[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ designation: "", unite: "", stock: "", seuil: "" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const { data, error } = await supabase.from("articles").select("id,designation,unite,stock,seuil").order("designation");
    if (error) setErr(error.message);
    else setRows((data as Article[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("articles").insert({
      id: crypto.randomUUID(), tenantId, designation: form.designation, unite: form.unite,
      stock: Number(form.stock) || 0, seuil: Number(form.seuil) || 0,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm({ designation: "", unite: "", stock: "", seuil: "" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }
  async function mouvement(a: Article, type: "ENTREE" | "SORTIE") {
    const q = Number(window.prompt(`${type === "ENTREE" ? "Entrée" : "Sortie"} — quantité (${a.unite}) :`, "0"));
    if (!q || q <= 0) return;
    const motif = window.prompt("Motif :", type === "ENTREE" ? "Livraison" : "Consommation chantier") ?? null;
    const { error: me } = await supabase.from("mouvements_stock").insert({ id: crypto.randomUUID(), articleId: a.id, type, quantite: q, motif, date: new Date().toISOString() });
    if (me) return setErr(me.message.includes("row-level") ? "Droits insuffisants (rôle) pour un mouvement." : me.message);
    const nouveau = type === "ENTREE" ? Number(a.stock) + q : Number(a.stock) - q;
    await supabase.from("articles").update({ stock: nouveau }).eq("id", a.id);
    void load();
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouvel article
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10 }}>
          <input style={input} placeholder="Désignation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
          <input style={input} placeholder="Unité (sac, m³…)" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} required />
          <input style={input} placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input style={input} placeholder="Seuil" type="number" value={form.seuil} onChange={(e) => setForm({ ...form, seuil: e.target.value })} />
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>{busy ? "…" : "Ajouter"}</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (() => {
        const bas = rows.filter((a) => Number(a.stock) < Number(a.seuil)).length;
        const list = rows.filter((a) => a.designation.toLowerCase().includes(q.trim().toLowerCase()));
        return (
          <>
            <SectionTitle icon={Package} action={<div style={{ fontSize: 13, color: C.steelSoft }}>{bas > 0 ? <b style={{ color: C.red }}>{bas} sous seuil</b> : <b style={{ color: C.green }}>Tous au-dessus du seuil</b>} · {rows.length} réf.</div>}>Stocks &amp; matériaux</SectionTitle>
            <div style={{ position: "relative", maxWidth: 340 }}>
              <Search size={16} color={C.steelSoft} style={{ position: "absolute", left: 12, top: 11 }} />
              <input placeholder="Rechercher un matériau…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...input, paddingLeft: 36, width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {list.map((a) => {
                const alerte = Number(a.stock) < Number(a.seuil);
                return (
                  <Card key={a.id} style={{ padding: 16, borderLeft: `4px solid ${alerte ? C.red : C.green}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.steel }}>{a.designation}</div>
                        <div style={{ fontSize: 12, color: C.steelSoft }}>Unité : {a.unite}</div>
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
                    </div>
                  </Card>
                );
              })}
              {list.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>{q ? "Aucun matériau pour cette recherche." : "Aucun article."}</div>}
            </div>
          </>
        );
      })()}
    </div>
  );
}
