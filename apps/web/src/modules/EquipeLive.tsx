import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { C, FONTS, Card, SectionTitle, Kpi } from "@tank/ui";
import { supabase } from "../lib/supabase";

type U = { id: string; email: string; nom: string; role: string; actif: boolean };
const ROLES = ["SUPER_ADMIN", "DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA", "COMMERCIAL", "TERRAIN", "ACQUEREUR"];

export default function EquipeLive() {
  const [rows, setRows] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("id,email,nom,role,actif").order("email");
    if (error) setErr(error.message); else setRows((data as U[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function setRole(u: U, role: string) {
    setRows((r) => r.map((x) => x.id === u.id ? { ...x, role } : x));
    const { error } = await supabase.from("users").update({ role }).eq("id", u.id);
    if (error) { setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle) pour modifier l'équipe." : error.message); void load(); }
  }

  const inp: React.CSSProperties = { padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONTS.sans };
  const actifs = rows.filter((u) => u.actif).length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={UserCog}>Équipe de l'agence</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><Kpi label="Utilisateurs" value={rows.length} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Actifs" value={actifs} color={C.green} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Rôles distincts" value={new Set(rows.map((u) => u.role)).size} /></Card>
      </div>
      <div style={{ color: C.steelSoft, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><UserCog size={16} /> Matrice rôles × utilisateurs. Modification réservée à la direction (RLS).</div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>{["Utilisateur", "Email", "Rôle", "Statut"].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 13 }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{u.nom}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}><select style={inp} value={u.role} onChange={(e) => setRole(u, e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
                  <td style={{ padding: 12 }}><span style={{ color: u.actif ? C.green : C.red, fontWeight: 700, fontSize: 13 }}>{u.actif ? "Actif" : "Inactif"}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: C.steelSoft }}>Aucun utilisateur visible (droits).</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
