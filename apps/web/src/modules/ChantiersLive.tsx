import { useEffect, useState } from "react";
import { HardHat, Plus, Trash2, MapPin, ListChecks } from "lucide-react";
import { C, FONTS, Card, StatutBadge, Progress, Hazard, SectionTitle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import ChantierDetail from "./ChantierDetail";

// Enum Postgres (Prisma StatutChantier) → libellé UI attendu par StatutBadge.
const STATUT_LABEL: Record<string, string> = {
  EN_PREPARATION: "En préparation",
  EN_COURS: "En cours",
  EN_RETARD: "En retard",
  SUSPENDU: "Suspendu",
  TERMINE: "Terminé",
};

type Chantier = {
  id: string;
  nom: string;
  client: string;
  ville: string;
  statut: string;
  budget: number;
  consomme: number;
  avancementReel: number;
  avancementPrevu: number;
};

const SELECT = "id,nom,client,ville,statut,budget,consomme,avancementReel,avancementPrevu";

export default function ChantiersLive() {
  const [rows, setRows] = useState<Chantier[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: "", client: "", ville: "", budget: "" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Chantier | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data: t } = await supabase.rpc("current_tenant");
    setTenantId((t as string) ?? null);
    const { data, error } = await supabase.from("chantiers").select(SELECT).order("nom");
    if (error) setErr(error.message);
    else setRows((data as Chantier[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setErr("Tenant introuvable pour cet utilisateur.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("chantiers").insert({
      id: crypto.randomUUID(),
      tenantId,
      nom: form.nom,
      client: form.client,
      ville: form.ville,
      statut: "EN_PREPARATION",
      budget: Number(form.budget) || 0,
      consomme: 0,
      avancementPrevu: 0,
      avancementReel: 0,
      createdAt: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setForm({ nom: "", client: "", ville: "", budget: "" });
    void load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("chantiers").delete().eq("id", id);
    if (error) setErr(error.message);
    else setRows((r) => r.filter((x) => x.id !== id));
  }

  const input: React.CSSProperties = {
    padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans,
  };

  if (open) return <ChantierDetail chantier={open} onBack={() => setOpen(null)} />;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={C.orange} /> Nouveau chantier
        </div>
        <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr 1.4fr auto", gap: 10, alignItems: "center" }}>
          <input style={input} placeholder="Nom du chantier" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          <input style={input} placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <input style={input} placeholder="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} required />
          <input style={input} placeholder="Budget FCFA" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <button type="submit" disabled={busy} style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>
            {busy ? "…" : "Ajouter"}
          </button>
        </form>
      </Card>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>Erreur : {err}</Card>}
      {loading && <div style={{ color: C.steelSoft }}>Chargement…</div>}
      {!loading && rows.length === 0 && !err && <div style={{ color: C.steelSoft }}>Aucun chantier. Ajoutez-en un ci-dessus.</div>}

      {rows.length > 0 && <SectionTitle icon={HardHat}>Chantiers ({rows.length})</SectionTitle>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {rows.map((c) => {
          const budgetPct = c.budget ? Math.round((c.consomme / c.budget) * 100) : 0;
          const enRetard = c.avancementReel < c.avancementPrevu - 5;
          const barColor = c.statut === "EN_RETARD" || enRetard ? C.red : c.statut === "TERMINE" ? C.green : C.orange;
          return (
            <Card key={c.id} style={{ padding: 0, overflow: "hidden" }}>
              <Hazard />
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontFamily: FONTS.condensed, fontSize: 21, fontWeight: 700, textTransform: "uppercase", color: C.steel, lineHeight: 1.15 }}>{c.nom}</div>
                  <StatutBadge s={STATUT_LABEL[c.statut] ?? c.statut} />
                </div>
                <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {c.ville}</span>
                  <span>{c.client}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}>
                    <span>Avancement réel / prévu</span>
                    <b style={{ color: enRetard ? C.red : C.steel }}>{c.avancementReel} % <span style={{ color: C.steelSoft, fontWeight: 400 }}>/ {c.avancementPrevu} %</span></b>
                  </div>
                  <Progress pct={c.avancementReel} color={barColor} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.steelSoft }}>
                  Budget : <b style={{ color: budgetPct > 90 ? C.red : C.steel }}>{fcfa(c.consomme)}</b> / {fcfa(c.budget)} ({budgetPct} %)
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setOpen(c)} title="Ouvrir le chantier" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.orange, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <ListChecks size={14} /> Ouvrir
                  </button>
                  <button onClick={() => remove(c.id)} title="Supprimer" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.red, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
