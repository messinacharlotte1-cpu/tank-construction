import { useEffect, useState } from "react";
import { Plus, Trash2, Gavel, Banknote } from "lucide-react";
import { C, FONTS, Card, SectionTitle, fcfa, EmptyState, SkeletonCard, useToast, btnPrimary } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import { humanError } from "../lib/errors";

type Row = { id: string; nom: string; corpsEtat: string; chantier: string | null; montantMarche: number; retenueGarantiePct: number };

export default function SousTraitanceLive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ nom: "", corpsEtat: "", chantier: "", montantMarche: "", retenueGarantiePct: "5" });
  const toast = useToast();

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("sous_traitants").select("id,nom,corpsEtat,chantier,montantMarche,retenueGarantiePct").order("nom");
    if (error) setErr(error.message); else setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    const nom = f.nom;
    const { error } = await supabase.from("sous_traitants").insert({ id: crypto.randomUUID(), tenantId: tid, nom: f.nom, corpsEtat: f.corpsEtat, chantier: f.chantier || null, montantMarche: Number(f.montantMarche) || 0, retenueGarantiePct: Number(f.retenueGarantiePct) || 0, createdAt: new Date().toISOString() });
    if (error) { setErr(humanError(error.message)); return toast({ message: humanError(error.message), tone: "error" }); }
    setF({ nom: "", corpsEtat: "", chantier: "", montantMarche: "", retenueGarantiePct: "5" }); void load();
    toast({ message: `Sous-traitant « ${nom} » ajouté`, tone: "success" });
  }
  // Suppression avec annulation : retrait UI immédiat, delete DB différé 5 s.
  function del(r: Row) {
    setRows((l) => l.filter((x) => x.id !== r.id));
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("sous_traitants").delete().eq("id", r.id);
      if (error) { setRows((l) => [...l, r].sort((a, b) => a.nom.localeCompare(b.nom))); toast({ message: humanError(error.message), tone: "error" }); }
    }, 5000);
    toast({ message: `« ${r.nom} » supprimé`, tone: "info", duration: 5000, action: { label: "Annuler", onClick: () => { clearTimeout(timer); setRows((l) => [...l, r].sort((a, b) => a.nom.localeCompare(b.nom))); } } });
  }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const totalRetenues = rows.reduce((s, r) => s + Math.round(Number(r.montantMarche) * Number(r.retenueGarantiePct) / 100), 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Gavel}>Sous-traitance &amp; contrats</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel }}>
        <Banknote size={16} color={C.amber} /> Retenues de garantie en cours : <b>{fcfa(totalRetenues)}</b> — libération à réception définitive (12 mois).
      </div>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.4fr 1.2fr 0.8fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nom sous-traitant" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required />
          <input style={inp} placeholder="Corps d'état" value={f.corpsEtat} onChange={(e) => setF({ ...f, corpsEtat: e.target.value })} required />
          <input style={inp} placeholder="Chantier" value={f.chantier} onChange={(e) => setF({ ...f, chantier: e.target.value })} />
          <input style={inp} placeholder="Marché FCFA" type="number" value={f.montantMarche} onChange={(e) => setF({ ...f, montantMarche: e.target.value })} />
          <input style={inp} placeholder="Ret. %" type="number" value={f.retenueGarantiePct} onChange={(e) => setF({ ...f, retenueGarantiePct: e.target.value })} />
          <button type="submit" style={{ ...btnPrimary, justifyContent: "center" }}><Plus size={15} /></button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div> : rows.length === 0 ? (
        <EmptyState icon={Gavel} title="Aucun sous-traitant" hint="Déclarez vos sous-traitants (corps d'état, montant du marché, retenue de garantie) via le formulaire ci-dessus." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {rows.map((r) => (
            <Card key={r.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{r.nom}</div>
                <button onClick={() => del(r)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.steelSoft, padding: 0 }}><Trash2 size={15} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 2 }}>{r.corpsEtat}{r.chantier ? ` · ${r.chantier}` : ""}</div>
              <div style={{ marginTop: 12, fontSize: 13 }}>Montant marché : <b>{fcfa(Number(r.montantMarche))}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: C.steelSoft }}>
                <span>Retenue garantie : <b style={{ color: C.steel }}>{r.retenueGarantiePct} %</b></span>
                <span>Séquestrée : <b style={{ color: C.orange }}>{fcfa(Math.round(Number(r.montantMarche) * Number(r.retenueGarantiePct) / 100))}</b></span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
