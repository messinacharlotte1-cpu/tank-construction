import { useEffect, useState } from "react";
import { Save, Plus } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type S = { id: string; cle: string; valeur: string };
const LABELS: Record<string, string> = {
  tva: "Taux TVA", cnps_salarie: "CNPS part salarié", cnps_employeur: "CNPS part employeur",
  prefixe_devis: "Préfixe devis", prefixe_facture: "Préfixe facture", seuil_alerte_budget: "Seuil alerte budget (%)",
};

export default function ParametresLive() {
  const [rows, setRows] = useState<S[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nk, setNk] = useState({ cle: "", valeur: "" });

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("settings").select("id,cle,valeur").order("cle");
    if (error) setErr(error.message); else setRows((data as S[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function save(s: S, valeur: string) {
    setRows((r) => r.map((x) => x.id === s.id ? { ...x, valeur } : x));
    const { error } = await supabase.from("settings").update({ valeur }).eq("id", s.id);
    if (error) setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle) pour modifier les paramètres." : error.message);
    else { setOk(`${LABELS[s.cle] ?? s.cle} enregistré`); setTimeout(() => setOk(null), 2000); }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!tid || !nk.cle) return;
    const { error } = await supabase.from("settings").insert({ id: crypto.randomUUID(), tenantId: tid, cle: nk.cle, valeur: nk.valeur });
    if (error) return setErr(error.message);
    setNk({ cle: "", valeur: "" }); void load();
  }

  const inp: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
      <div style={{ fontSize: 13, color: C.steelSoft }}>Taux et préfixes du tenant. Un changement ne réécrit jamais un document déjà émis (snapshot).</div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {ok && <Card style={{ borderColor: C.green, color: C.green }}>{ok}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ display: "grid", gap: 12 }}>
          {rows.map((s) => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{LABELS[s.cle] ?? s.cle}<div style={{ fontSize: 11, color: C.steelSoft, fontWeight: 400 }}>{s.cle}</div></label>
              <input style={inp} defaultValue={s.valeur} onBlur={(e) => e.target.value !== s.valeur && save(s, e.target.value)} />
              <Save size={16} color={C.steelSoft} />
            </div>
          ))}
        </Card>
      )}
      <Card>
        <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 10 }}>
          <input style={inp} placeholder="Nouvelle clé" value={nk.cle} onChange={(e) => setNk({ ...nk, cle: e.target.value })} />
          <input style={inp} placeholder="Valeur" value={nk.valeur} onChange={(e) => setNk({ ...nk, valeur: e.target.value })} />
          <button type="submit" style={{ padding: "8px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /></button>
        </form>
      </Card>
    </div>
  );
}
