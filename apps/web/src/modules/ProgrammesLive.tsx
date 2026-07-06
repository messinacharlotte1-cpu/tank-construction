import { useEffect, useState } from "react";
import { Plus, ArrowLeft, Building2, MapPin, Trash2 } from "lucide-react";
import { C, FONTS, Card, StatutBadge, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Programme = { id: string; nom: string; ville: string };
type LotImmo = { id: string; reference: string; bloc: string | null; niveau: string | null; typologie: string | null; surface: number | null; prix: number; statut: string };

const STATUT_LABEL: Record<string, string> = { DISPONIBLE: "Disponible", RESERVE: "Réservé", VENDU: "Vendu" };
const NEXT: Record<string, string> = { DISPONIBLE: "RESERVE", RESERVE: "VENDU", VENDU: "DISPONIBLE" };

export default function ProgrammesLive() {
  const [rows, setRows] = useState<Programme[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", ville: "" });
  const [open, setOpen] = useState<Programme | null>(null);

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const { data, error } = await supabase.from("programmes").select("id,nom,ville").order("nom");
    if (error) setErr(error.message); else setRows((data as Programme[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    const { error } = await supabase.from("programmes").insert({ id: crypto.randomUUID(), tenantId, nom: form.nom, ville: form.ville, createdAt: new Date().toISOString() });
    if (error) return setErr(error.message);
    setForm({ nom: "", ville: "" });
    void load();
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  if (open) return <ProgrammeDetail programme={open} onBack={() => setOpen(null)} />;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouveau programme
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="Nom du programme" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <input style={input} placeholder="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} required />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>Ajouter</button>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {rows.map((p) => (
            <Card key={p.id} style={{ cursor: "pointer" }}>
              <div onClick={() => setOpen(p)}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><Building2 size={18} color={C.orange} /> {p.nom}</div>
                <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {p.ville}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir la grille des lots →</div>
              </div>
            </Card>
          ))}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucun programme.</div>}
        </div>
      )}
    </div>
  );
}

function ProgrammeDetail({ programme, onBack }: { programme: Programme; onBack: () => void }) {
  const [lots, setLots] = useState<LotImmo[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ reference: "", typologie: "", surface: "", prix: "" });

  async function load() {
    const { data, error } = await supabase.from("lots_immo").select("id,reference,bloc,niveau,typologie,surface,prix,statut").eq("programmeId", programme.id).order("reference");
    if (error) setErr(error.message); else setLots((data as LotImmo[]) ?? []);
  }
  useEffect(() => { void load(); }, [programme.id]);

  async function addLot(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("lots_immo").insert({ id: crypto.randomUUID(), programmeId: programme.id, reference: form.reference, typologie: form.typologie || null, surface: form.surface ? Number(form.surface) : null, prix: Number(form.prix) || 0, statut: "DISPONIBLE" });
    if (error) return setErr(error.message);
    setForm({ reference: "", typologie: "", surface: "", prix: "" });
    void load();
  }
  async function cycle(l: LotImmo) {
    const next = NEXT[l.statut];
    setLots((r) => r.map((x) => (x.id === l.id ? { ...x, statut: next } : x)));
    await supabase.from("lots_immo").update({ statut: next }).eq("id", l.id);
  }
  async function del(id: string) { await supabase.from("lots_immo").delete().eq("id", id); setLots((r) => r.filter((x) => x.id !== id)); }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const vendus = lots.filter((l) => l.statut === "VENDU").length;
  const reserves = lots.filter((l) => l.statut === "RESERVE").length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Programmes</button>
        <div style={{ fontWeight: 700, color: C.steel }}>{programme.nom} — {lots.length} lots · {vendus} vendus · {reserves} réservés</div>
      </div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      <Card>
        <form onSubmit={addLot} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="Référence (L-A101)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
          <input style={input} placeholder="Typologie (T3…)" value={form.typologie} onChange={(e) => setForm({ ...form, typologie: e.target.value })} />
          <input style={input} placeholder="Surface m²" type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
          <input style={input} placeholder="Prix FCFA" type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>Lot</button>
        </form>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {lots.map((l) => (
          <Card key={l.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <b style={{ color: C.steel }}>{l.reference}</b>
              <button onClick={() => del(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
            </div>
            <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{[l.typologie, l.surface ? l.surface + " m²" : null].filter(Boolean).join(" · ")}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.steel, marginTop: 6 }}>{fcfa(Number(l.prix))}</div>
            <button onClick={() => cycle(l)} title="Changer le statut" style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <StatutBadge s={STATUT_LABEL[l.statut] ?? l.statut} />
            </button>
          </Card>
        ))}
        {lots.length === 0 && <div style={{ color: C.steelSoft }}>Aucun lot.</div>}
      </div>
    </div>
  );
}
