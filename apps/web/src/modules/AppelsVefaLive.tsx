import { useEffect, useState } from "react";
import { Plus, Trash2, Send, Lock, Landmark, HardHat, Users } from "lucide-react";
import { C, FONTS, Card, Kpi, Banner, SectionTitle, Progress, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

type Appel = {
  id: string; reservationId: string; libelle: string; montant: number; echeance: string | null; statut: string;
  reservation: { acquereur: string } | null;
  jalon: { libelle: string; valide: boolean } | null;
};
type Resa = { id: string; acquereur: string; lots_immo: { reference: string; prix: number } | null };
type Jalon = { id: string; libelle: string };

const STATUT: Record<string, [string, string]> = {
  PREVU: ["Prévu", C.amber], EMIS: ["Émis", C.green], PAYE: ["Payé", C.steelSoft],
};

const APPEL_SELECT = "id,reservationId,libelle,montant,echeance,statut,reservation:reservations(acquereur),jalon:jalons(libelle,valide)";

export default function AppelsVefaLive() {
  const [rows, setRows] = useState<Appel[]>([]);
  const [resas, setResas] = useState<Resa[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reservationId: "", jalonId: "", libelle: "", montant: "", echeance: "" });

  async function load() {
    setLoading(true);
    const [a, r, j] = await Promise.all([
      supabase.from("appels_de_fonds").select(APPEL_SELECT).order("echeance"),
      supabase.from("reservations").select("id,acquereur,lots_immo(reference,prix)"),
      supabase.from("jalons").select("id,libelle").eq("valide", true),
    ]);
    if (a.error) setErr(a.error.message); else setRows((a.data as unknown as Appel[]) ?? []);
    setResas((r.data as unknown as Resa[]) ?? []);
    setJalons((j.data as Jalon[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reservationId) return setErr("Sélectionnez une réservation.");
    const { error } = await supabase.from("appels_de_fonds").insert({
      id: crypto.randomUUID(), reservationId: form.reservationId, jalonId: form.jalonId || null,
      libelle: form.libelle, montant: Number(form.montant) || 0, echeance: form.echeance || null, statut: "PREVU",
    });
    if (error) return setErr(error.message);
    setForm({ reservationId: "", jalonId: "", libelle: "", montant: "", echeance: "" });
    void load();
  }
  // VEFA : émission autorisée seulement si un jalon chantier validé est rattaché.
  async function emettre(a: Appel) {
    if (!a.jalon?.valide) { setErr("Émission bloquée : jalon chantier non validé (constat contradictoire requis)."); return; }
    setErr(null);
    await supabase.from("appels_de_fonds").update({ statut: "EMIS" }).eq("id", a.id);
    void load();
  }
  async function remove(id: string) { await supabase.from("appels_de_fonds").delete().eq("id", id); setRows((r) => r.filter((x) => x.id !== id)); }

  const input: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };

  const totalAppele = rows.reduce((s, a) => s + Number(a.montant), 0);
  const encaisse = rows.filter((a) => a.statut === "PAYE").reduce((s, a) => s + Number(a.montant), 0);
  const encaissePct = totalAppele ? Math.round((encaisse / totalAppele) * 100) : 0;
  // Dépôt de garantie séquestré = 2 % du prix de chaque lot réservé (compte séquestre notaire).
  const depots = resas.reduce((s, r) => s + Math.round(Number(r.lots_immo?.prix ?? 0) * 0.02), 0);

  // Réservations : cumul encaissé par acquéreur (via appels PAYE rattachés).
  const encaisseParResa = new Map<string, number>();
  for (const a of rows) if (a.statut === "PAYE") encaisseParResa.set(a.reservationId, (encaisseParResa.get(a.reservationId) ?? 0) + Number(a.montant));
  const prochainParResa = new Map<string, Appel>();
  for (const a of rows) if ((a.statut === "EMIS" || a.statut === "PREVU") && !prochainParResa.has(a.reservationId)) prochainParResa.set(a.reservationId, a);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Landmark}>VEFA &amp; appels de fonds</SectionTitle>

      <Banner tone="success" icon={HardHat}>
        <b>Le chantier pilote la trésorerie :</b> un appel de fonds n'est émissible que si son jalon chantier est validé (constat contradictoire). L'émission notifie l'acquéreur (échéancier + lien de paiement).
      </Banner>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><Kpi label="Total appelé" value={fcfa(totalAppele)} sub={`${rows.length} appel${rows.length > 1 ? "s" : ""}`} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Avancement encaissé" value={`${encaissePct} %`} color={C.green} pct={encaissePct} pctColor={C.green} sub={fcfa(encaisse)} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Dépôts de garantie séquestrés" value={fcfa(depots)} color={C.orange} sub="Compte séquestre notaire — 2 %" /></Card>
      </div>

      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouvel appel de fonds
        </div>
        <div style={{ fontSize: 12, color: C.steelSoft, marginBottom: 12 }}>Le chantier pilote la trésorerie : l'appel n'est émissible que si son jalon est validé.</div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1.4fr 1.2fr 1fr auto", gap: 10 }}>
          <select style={input} value={form.reservationId} onChange={(e) => setForm({ ...form, reservationId: e.target.value })} required>
            <option value="">Réservation…</option>
            {resas.map((r) => <option key={r.id} value={r.id}>{r.acquereur}{r.lots_immo ? ` — ${r.lots_immo.reference}` : ""}</option>)}
          </select>
          <input style={input} placeholder="Libellé (Appel 1 — Fondations)" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required />
          <select style={input} value={form.jalonId} onChange={(e) => setForm({ ...form, jalonId: e.target.value })}>
            <option value="">Jalon (validé) — optionnel</option>
            {jalons.map((j) => <option key={j.id} value={j.id}>{j.libelle}</option>)}
          </select>
          <input style={input} placeholder="Montant FCFA" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
          <input style={input} type="date" value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
          <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}>Ajouter</button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>
              {["Libellé", "Acquéreur", "Jalon", "Montant", "Échéance", "Statut"].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 13 }}>{h}</th>)}<th></th>
            </tr></thead>
            <tbody>
              {rows.map((a) => {
                const [label, color] = STATUT[a.statut] ?? [a.statut, C.steelSoft];
                const ok = a.jalon?.valide;
                return (
                  <tr key={a.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{a.libelle}</td>
                    <td style={{ padding: 12 }}>{a.reservation?.acquereur ?? "—"}</td>
                    <td style={{ padding: 12 }}>{a.jalon ? <span style={{ color: ok ? C.green : C.red }}>{a.jalon.libelle} {ok ? "✓" : "✗"}</span> : <span style={{ color: C.steelSoft }}>—</span>}</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(a.montant))}</td>
                    <td style={{ padding: 12 }}>{a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={{ padding: 12 }}><span style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</span></td>
                    <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                      {a.statut === "PREVU" && (
                        <button onClick={() => emettre(a)} disabled={!ok} title={ok ? "Émettre l'appel" : "Jalon non validé"} style={{ background: "none", border: `1px solid ${ok ? C.green : C.line}`, borderRadius: 8, padding: "5px 10px", cursor: ok ? "pointer" : "not-allowed", color: ok ? C.green : C.steelSoft, marginRight: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          {ok ? <Send size={13} /> : <Lock size={13} />} Émettre
                        </button>
                      )}
                      <button onClick={() => remove(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 16, color: C.steelSoft }}>Aucun appel de fonds.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {resas.length > 0 && (
        <Card>
          <SectionTitle icon={Users}>Réservations</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {resas.map((r) => {
              const prix = Number(r.lots_immo?.prix ?? 0);
              const enc = encaisseParResa.get(r.id) ?? 0;
              const pct = prix ? Math.round((enc / prix) * 100) : 0;
              const proch = prochainParResa.get(r.id);
              return (
                <div key={r.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <b style={{ fontSize: 14, color: C.steel }}>{r.acquereur}</b>
                      <span style={{ fontSize: 12, color: C.steelSoft }}>{r.lots_immo ? ` · Lot ${r.lots_immo.reference} · ${fcfa(prix)}` : ""}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.steelSoft }}>{proch ? `Prochain : ${proch.libelle}` : "Échéancier soldé"}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 3 }}>
                      <span>Encaissé : <b style={{ color: C.green }}>{fcfa(enc)}</b> ({pct} %)</span>
                    </div>
                    <Progress pct={pct} color={C.green} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
