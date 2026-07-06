import { useEffect, useState } from "react";
import { Plus, Trash2, Phone } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Row = { id: string; nom: string; categorie: string | null; contact: string | null; telephone: string | null };
const CATS = ["Matériaux", "Location", "Services", "Transport", "Autre"];

export default function FournisseursLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ nom: "", categorie: "Matériaux", contact: "", telephone: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("fournisseurs").select("id,nom,categorie,contact,telephone").order("nom");
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const { error } = await supabase.from("fournisseurs").insert({ id: crypto.randomUUID(), tenantId: tid, nom: f.nom, categorie: f.categorie, contact: f.contact || null, telephone: f.telephone || null, createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setF({ nom: "", categorie: "Matériaux", contact: "", telephone: "" }); void load();
  }
  async function del(id: string) { const { error } = await supabase.from("fournisseurs").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1.4fr 1.4fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom fournisseur" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <select style={inp} value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input style={inp} placeholder="Contact" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />
          <input style={inp} placeholder="Téléphone" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Nom</th><th style={{ padding: 12 }}>Catégorie</th><th style={{ padding: 12 }}>Contact</th><th style={{ padding: 12 }}>Téléphone</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{r.nom}</td>
                  <td style={{ padding: 12 }}>{r.categorie}</td>
                  <td style={{ padding: 12 }}>{r.contact ?? "—"}</td>
                  <td style={{ padding: 12, display: "flex", alignItems: "center", gap: 6 }}>{r.telephone && <Phone size={13} color={C.steelSoft} />}{r.telephone ?? "—"}</td>
                  <td style={{ padding: 12, textAlign: "right" }}><button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucun fournisseur.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
