import { useEffect, useState } from "react";
import { Plus, Trash2, PencilRuler } from "lucide-react";
import { C, FONTS, Card, StatutBadge, EmptyState, Skeleton } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import DevisDetail from "./DevisDetail";

type Devis = { id: string; numero: string; client: string; statut: string; chantierId: string | null };
type ChantierRef = { id: string; nom: string };
const STATUTS = ["Brouillon", "Envoyé", "Accepté", "Refusé"];

export default function DevisLive() {
  const [rows, setRows] = useState<Devis[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRef[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ client: "", statut: "Brouillon", chantierId: "" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Devis | null>(null);

  async function load() {
    setLoading(true);
    setTenantId(await getTenant());
    const [dev, cha] = await Promise.all([
      supabase.from("devis").select("id,numero,client,statut,chantierId").order("numero", { ascending: false }),
      supabase.from("chantiers").select("id,nom").order("nom"),
    ]);
    if (dev.error) setErr(dev.error.message);
    else setRows((dev.data as Devis[]) ?? []);
    if (!cha.error) setChantiers((cha.data as ChantierRef[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const chantierNom = (id: string | null) => chantiers.find((c) => c.id === id)?.nom ?? null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true); setErr(null);
    const { data: numero, error: ne } = await supabase.rpc("next_numero", { kind: "devis" });
    if (ne) { setBusy(false); setErr(ne.message); return; }
    const { error } = await supabase.from("devis").insert({
      id: crypto.randomUUID(), tenantId, numero: numero as string, client: form.client,
      statut: form.statut, chantierId: form.chantierId || null, createdAt: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setForm({ client: "", statut: "Brouillon", chantierId: "" });
    void load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("devis").delete().eq("id", id);
    if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id));
  }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  if (open) return <DevisDetail devisId={open.id} numero={open.numero} client={open.client} statut={open.statut} onBack={() => { setOpen(null); void load(); }} />;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouveau devis
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.4fr auto", gap: 10 }}>
          <input style={input} placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <select style={input} value={form.chantierId} onChange={(e) => setForm({ ...form, chantierId: e.target.value })}>
            <option value="">Chantier (optionnel)…</option>
            {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <select style={input} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>{busy ? "…" : "Ajouter"}</button>
        </form>
        <div style={{ marginTop: 10, fontSize: 12, color: C.steelSoft }}>
          N° attribué automatiquement (préfixe + exercice). Ouvrir le DQE pour lots → sous-ouvrages → lignes.
        </div>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading ? (
        <Card style={{ display: "grid", gap: 12 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={20} />)}</Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={PencilRuler} title="Aucun devis" hint="Créez un premier devis via le formulaire ci-dessus, puis ouvrez le DQE pour détailler lots, sous-ouvrages et lignes." />
      ) : (
        <Card style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}>
                <th style={{ padding: 12 }}>N°</th><th style={{ padding: 12 }}>Client</th><th style={{ padding: 12 }}>Chantier</th><th style={{ padding: 12 }}>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{d.numero}</td>
                  <td style={{ padding: 12 }}>{d.client}</td>
                  <td style={{ padding: 12, color: chantierNom(d.chantierId) ? C.steel : C.steelSoft }}>{chantierNom(d.chantierId) ?? "—"}</td>
                  <td style={{ padding: 12 }}><StatutBadge s={d.statut} /></td>
                  <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setOpen(d)} title="Ouvrir le DQE" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.orange, marginRight: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}><PencilRuler size={14} /> DQE</button>
                    <button onClick={() => remove(d.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
