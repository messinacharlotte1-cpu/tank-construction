import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Article = { id: string; designation: string; unite: string; stock: number; seuil: number };

export default function StocksLive() {
  const [rows, setRows] = useState<Article[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ designation: "", unite: "", stock: "", seuil: "" });
  const [busy, setBusy] = useState(false);

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
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}>
                <th style={{ padding: 12 }}>Désignation</th><th style={{ padding: 12 }}>Unité</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Seuil</th><th style={{ padding: 12 }}>État</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const bas = Number(a.stock) < Number(a.seuil);
                return (
                  <tr key={a.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{a.designation}</td>
                    <td style={{ padding: 12 }}>{a.unite}</td>
                    <td style={{ padding: 12, color: bas ? C.red : C.steel, fontWeight: bas ? 700 : 400 }}>{Number(a.stock)}</td>
                    <td style={{ padding: 12 }}>{Number(a.seuil)}</td>
                    <td style={{ padding: 12 }}>
                      {bas ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.red, fontSize: 12, fontWeight: 700 }}><AlertTriangle size={14} /> Sous seuil</span> : <span style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>OK</span>}
                    </td>
                    <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => mouvement(a, "ENTREE")} title="Entrée stock" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: C.green, fontWeight: 700, marginRight: 6 }}>+ Entrée</button>
                      <button onClick={() => mouvement(a, "SORTIE")} title="Sortie stock" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: C.orange, fontWeight: 700, marginRight: 10 }}>− Sortie</button>
                      <button onClick={() => remove(a.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 16, color: C.steelSoft }}>Aucun article.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
