import { useEffect, useState } from "react";
import { Plus, ArrowLeft, Building2, MapPin, Trash2 } from "lucide-react";
import { C, FONTS, Card, StatutBadge, Hazard, Kpi, Progress, fcfa } from "@tank/ui";

// Seuil de pré-commercialisation exigé par la banque pour débloquer le crédit promoteur.
const SEUIL_PRECO = 50;
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
  const dispos = lots.length - vendus - reserves;
  const caTotal = lots.reduce((s, l) => s + Number(l.prix), 0);
  const caSecurise = lots.filter((l) => l.statut !== "DISPONIBLE").reduce((s, l) => s + Number(l.prix), 0);
  const precoPct = lots.length ? Math.round(((vendus + reserves) / lots.length) * 100) : 0;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button onClick={onBack} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Retour aux programmes</button>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{programme.nom}</h2>
          <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {programme.ville} · {lots.length} lots</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
            <Kpi label="Vendus" value={vendus} color={C.green} />
            <Kpi label="Réservés" value={reserves} color={C.amber} />
            <Kpi label="Disponibles" value={dispos} />
            <Kpi label="CA sécurisé / potentiel" value={<>{Math.round(caSecurise / 1e6)} M <span style={{ fontSize: 14, color: C.steelSoft }}>/ {Math.round(caTotal / 1e6)} M</span></>} color={C.orange} />
          </div>
          {lots.length > 0 && (
            <div style={{ marginTop: 16, maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}>
                <span>Pré-commercialisation</span>
                <b style={{ color: precoPct >= SEUIL_PRECO ? C.green : C.amber }}>{precoPct} %</b>
              </div>
              <Progress pct={precoPct} color={precoPct >= SEUIL_PRECO ? C.green : C.amber} />
              <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 4 }}>Seuil bancaire de déblocage : {SEUIL_PRECO} % {precoPct >= SEUIL_PRECO ? "✓ atteint" : "— à atteindre"}</div>
            </div>
          )}
        </div>
      </Card>
      <Card>
        <form onSubmit={addLot} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="Référence (L-A101)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
          <input style={input} placeholder="Typologie (T3…)" value={form.typologie} onChange={(e) => setForm({ ...form, typologie: e.target.value })} />
          <input style={input} placeholder="Surface m²" type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
          <input style={input} placeholder="Prix FCFA" type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>Lot</button>
        </form>
      </Card>

      {lots.length > 0 && (
        <Card>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 10 }}>Plan de masse</div>
          <svg viewBox={`0 0 ${5 * 110} ${Math.ceil(lots.length / 5) * 80}`} style={{ width: "100%", maxWidth: 560 }}>
            {lots.map((l, i) => {
              const col = i % 5, row = Math.floor(i / 5);
              const fill = l.statut === "VENDU" ? C.steelSoft : l.statut === "RESERVE" ? C.amber : C.green;
              return (
                <g key={l.id} onClick={() => cycle(l)} style={{ cursor: "pointer" }}>
                  <rect x={col * 110 + 6} y={row * 80 + 6} width={98} height={64} rx={8} fill={fill} opacity={0.9} />
                  <text x={col * 110 + 55} y={row * 80 + 34} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{l.reference}</text>
                  <text x={col * 110 + 55} y={row * 80 + 52} textAnchor="middle" fill="#fff" fontSize={10}>{l.typologie ?? ""}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.steelSoft }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.green, borderRadius: 2, marginRight: 4 }} />Disponible</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.amber, borderRadius: 2, marginRight: 4 }} />Réservé</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.steelSoft, borderRadius: 2, marginRight: 4 }} />Vendu</span>
            <span style={{ marginLeft: "auto" }}>Cliquer un lot = changer le statut</span>
          </div>
        </Card>
      )}

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
