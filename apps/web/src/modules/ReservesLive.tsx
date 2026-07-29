import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type R = {
  id: string; chantier: string; chantierId: string | null; corpsEtatId: string | null;
  localisation: string | null; description: string; entreprise: string | null; statut: string; echeance: string | null;
};
type ChantierRef = { id: string; nom: string };
type CorpsEtat = { id: string; categorie: "GROS_OEUVRE" | "SECOND_OEUVRE"; libelle: string };

const CAT_LABEL: Record<CorpsEtat["categorie"], string> = { GROS_OEUVRE: "Gros œuvre", SECOND_OEUVRE: "Second œuvre" };

export default function ReservesLive() {
  const [rows, setRows] = useState<R[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRef[]>([]);
  const [corps, setCorps] = useState<CorpsEtat[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ chantierId: "", corpsEtatId: "", localisation: "", description: "", entreprise: "", echeance: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const [res, cha, ce] = await Promise.all([
      supabase.from("reserves").select("id,chantier,chantierId,corpsEtatId,localisation,description,entreprise,statut,echeance").order("createdAt", { ascending: false }),
      supabase.from("chantiers").select("id,nom").order("nom"),
      supabase.from("corps_etat").select("id,categorie,libelle").eq("actif", true).order("categorie").order("ordre"),
    ]);
    if (res.error) setErr(res.error.message); else setRows((res.data as R[]) ?? []);
    if (!cha.error) setChantiers((cha.data as ChantierRef[]) ?? []);
    if (!ce.error) setCorps((ce.data as CorpsEtat[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const corpsLabel = (id: string | null) => {
    const c = corps.find((x) => x.id === id);
    return c ? `${CAT_LABEL[c.categorie]} · ${c.libelle}` : null;
  };

  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!tid) return;
    if (!f.chantierId) { setErr("Choisissez le chantier."); return; }
    const cha = chantiers.find((c) => c.id === f.chantierId);
    if (!cha) { setErr("Chantier introuvable."); return; }
    const { error } = await supabase.from("reserves").insert({
      id: crypto.randomUUID(), tenantId: tid,
      chantier: cha.nom, // nom dénormalisé (compat écrans historiques)
      chantierId: cha.id,
      corpsEtatId: f.corpsEtatId || null,
      localisation: f.localisation || null, description: f.description, entreprise: f.entreprise || null,
      statut: "Ouverte", echeance: f.echeance || null, createdAt: new Date().toISOString(),
    });
    if (error) return setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle)." : error.message);
    setF({ chantierId: "", corpsEtatId: "", localisation: "", description: "", entreprise: "", echeance: "" }); void load();
  }
  async function toggle(r: R) {
    const statut = r.statut === "Ouverte" ? "Levée" : "Ouverte";
    setRows((x) => x.map((y) => y.id === r.id ? { ...y, statut } : y));
    await supabase.from("reserves").update({ statut }).eq("id", r.id);
  }
  async function del(id: string) { const { error } = await supabase.from("reserves").delete().eq("id", id); if (error) setErr(error.message); else setRows((r) => r.filter((x) => x.id !== id)); }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const ouvertes = rows.filter((r) => r.statut === "Ouverte").length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ fontSize: 13, color: C.steelSoft }}>Réserves OPR — <b>{ouvertes}</b> ouverte(s) / {rows.length} au total. Levée = corrigée et acceptée.</div>
      <Card>
        <form onSubmit={create} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1.2fr 1fr", gap: 10 }}>
            <select style={inp} value={f.chantierId} onChange={(e) => setF({ ...f, chantierId: e.target.value })} required>
              <option value="">Chantier…</option>
              {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select style={inp} value={f.corpsEtatId} onChange={(e) => setF({ ...f, corpsEtatId: e.target.value })}>
              <option value="">Corps d'état (optionnel)…</option>
              {(["GROS_OEUVRE", "SECOND_OEUVRE"] as const).map((cat) => {
                const items = corps.filter((c) => c.categorie === cat);
                if (!items.length) return null;
                return (
                  <optgroup key={cat} label={CAT_LABEL[cat]}>
                    {items.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                  </optgroup>
                );
              })}
            </select>
            <input style={inp} placeholder="Localisation" value={f.localisation} onChange={(e) => setF({ ...f, localisation: e.target.value })} />
            <input style={inp} type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 10 }}>
            <input style={inp} placeholder="Description de la réserve" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required />
            <input style={inp} placeholder="Entreprise" value={f.entreprise} onChange={(e) => setF({ ...f, entreprise: e.target.value })} />
            <button type="submit" style={{ padding: "9px 16px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter</button>
          </div>
        </form>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => {
            const levee = r.statut === "Levée";
            const ce = corpsLabel(r.corpsEtatId);
            return (
              <Card key={r.id} style={{ borderLeft: `4px solid ${levee ? C.green : C.red}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => toggle(r)} title="Lever / rouvrir" style={{ background: "none", border: "none", cursor: "pointer", color: levee ? C.green : C.steelSoft }}>{levee ? <CheckCircle2 size={22} /> : <Circle size={22} />}</button>
                  <div>
                    <div style={{ fontWeight: 600, color: C.steel }}>{r.description}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{r.chantier}{ce ? ` · ${ce}` : ""}{r.localisation ? ` · ${r.localisation}` : ""}{r.entreprise ? ` · ${r.entreprise}` : ""}{r.echeance ? ` · échéance ${new Date(r.echeance).toLocaleDateString("fr-FR")}` : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: levee ? C.green : C.red, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{r.statut}</span>
                  <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucune réserve.</div>}
        </div>
      )}
    </div>
  );
}
