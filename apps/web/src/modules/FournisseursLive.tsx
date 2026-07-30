import { useEffect, useState } from "react";
import { Plus, Trash2, Phone, Truck, Star } from "lucide-react";
import { C, FONTS, Card, SectionTitle, EmptyState, SkeletonCard, useToast, btnPrimary } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { humanError } from "../lib/errors";

type Row = { id: string; nom: string; categorie: string | null; contact: string | null; telephone: string | null; note: number };
const CATS = ["Matériaux", "Location", "Services", "Transport", "Autre"];

export default function FournisseursLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ nom: "", categorie: "Matériaux", contact: "", telephone: "" });
  const toast = useToast();

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("fournisseurs").select("id,nom,categorie,contact,telephone,note").order("nom");
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const nom = f.nom;
    const { error } = await supabase.from("fournisseurs").insert({ id: crypto.randomUUID(), tenantId: tid, nom: f.nom, categorie: f.categorie, contact: f.contact || null, telephone: f.telephone || null, createdAt: new Date().toISOString() });
    if (error) { setErr(humanError(error.message)); return toast({ message: humanError(error.message), tone: "error" }); }
    setF({ nom: "", categorie: "Matériaux", contact: "", telephone: "" }); void load();
    toast({ message: `Fournisseur « ${nom} » ajouté`, tone: "success" });
  }
  // Suppression avec annulation : retrait UI immédiat, delete DB différé 5 s, « Annuler » avant expiration.
  function del(r: Row) {
    setRows((l) => l.filter((x) => x.id !== r.id));
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("fournisseurs").delete().eq("id", r.id);
      if (error) { setRows((l) => [...l, r].sort((a, b) => a.nom.localeCompare(b.nom))); toast({ message: humanError(error.message), tone: "error" }); }
    }, 5000);
    toast({ message: `« ${r.nom} » supprimé`, tone: "info", duration: 5000, action: { label: "Annuler", onClick: () => { clearTimeout(timer); setRows((l) => [...l, r].sort((a, b) => a.nom.localeCompare(b.nom))); } } });
  }
  async function setNote(r: Row, note: number) { setRows((x) => x.map((y) => y.id === r.id ? { ...y, note } : y)); await supabase.from("fournisseurs").update({ note }).eq("id", r.id); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Truck}>Fournisseurs &amp; sous-traitants</SectionTitle>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1.4fr 1.4fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom fournisseur" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <select style={inp} value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input style={inp} placeholder="Contact" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />
          <input style={inp} placeholder="Téléphone" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
          <button type="submit" style={{ ...btnPrimary, justifyContent: "center" }}><Plus size={15} /> Ajouter</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> : rows.length === 0 ? (
        <EmptyState icon={Truck} title="Aucun fournisseur" hint="Ajoutez vos fournisseurs de matériaux et de services via le formulaire ci-dessus — ils seront proposés dans les commandes." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {rows.map((r) => (
            <Card key={r.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 19, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{r.nom}</div>
                <button onClick={() => del(r)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.steelSoft, padding: 0 }}><Trash2 size={15} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.steelSoft }}>{[r.categorie, r.contact].filter(Boolean).join(" · ")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setNote(r, i)} title={`Noter ${i}/5`} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    <Star size={16} fill={i <= r.note ? C.orange : "none"} color={i <= r.note ? C.orange : C.line} />
                  </button>
                ))}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.steel, marginLeft: 4 }}>{r.note ? r.note.toFixed(1) : "—"}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: C.steelSoft, display: "flex", alignItems: "center", gap: 6 }}>
                {r.telephone ? <><Phone size={13} /> {r.telephone}</> : "Pas de téléphone"}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
