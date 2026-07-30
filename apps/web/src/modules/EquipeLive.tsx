import { useEffect, useState } from "react";
import { UserCog, UserCheck, Clock } from "lucide-react";
import { C, FONTS, Card, SectionTitle, Kpi, Banner, btnPrimary, btnGhost, useToast } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { humanError } from "../lib/errors";

type U = { id: string; email: string; nom: string; role: string; actif: boolean };
const ROLES = ["SUPER_ADMIN", "DIRECTION", "CONDUCTEUR", "CHEF_CHANTIER", "COMPTA", "COMMERCIAL", "TERRAIN", "ACQUEREUR"];

export default function EquipeLive() {
  const [rows, setRows] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    // En attente d'abord (actif=false), puis par email.
    const { data, error } = await supabase.from("users").select("id,email,nom,role,actif").order("actif").order("email");
    if (error) setErr(error.message); else setRows((data as U[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function setRole(u: U, role: string) {
    setRows((r) => r.map((x) => x.id === u.id ? { ...x, role } : x));
    const { error } = await supabase.from("users").update({ role }).eq("id", u.id);
    if (error) { const m = error.message.includes("row-level") ? "Droits insuffisants (rôle) pour modifier l'équipe." : humanError(error.message); setErr(m); toast({ message: m, tone: "error" }); void load(); }
    else toast({ message: `Rôle de ${u.nom} → ${role}`, tone: "success" });
  }
  // Validation d'un compte en attente : actif=true. La direction règle le rôle avant/après.
  async function setActif(u: U, actif: boolean) {
    setRows((r) => r.map((x) => x.id === u.id ? { ...x, actif } : x));
    const { error } = await supabase.from("users").update({ actif }).eq("id", u.id);
    if (error) { const m = error.message.includes("row-level") ? "Droits insuffisants (rôle) pour valider un compte." : humanError(error.message); setErr(m); toast({ message: m, tone: "error" }); void load(); }
    else toast({ message: actif ? `Compte de ${u.nom} activé (rôle ${u.role})` : `Compte de ${u.nom} désactivé`, tone: actif ? "success" : "info" });
  }

  const inp: React.CSSProperties = { padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, fontFamily: FONTS.sans };
  const actifs = rows.filter((u) => u.actif).length;
  const enAttente = rows.filter((u) => !u.actif).length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={UserCog}>Équipe de l'agence</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><Kpi label="Utilisateurs" value={rows.length} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Actifs" value={actifs} color={C.green} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="En attente" value={enAttente} color={enAttente ? C.amber : C.steelSoft} /></Card>
        <Card style={{ padding: 16 }}><Kpi label="Rôles distincts" value={new Set(rows.filter((u) => u.actif).map((u) => u.role)).size} /></Card>
      </div>
      {enAttente > 0 && <Banner tone="warn" icon={Clock}><b>{enAttente} compte{enAttente > 1 ? "s" : ""} en attente de validation.</b> Attribuez le rôle puis cliquez « Activer » — le compte reste sans accès tant qu'il n'est pas activé.</Banner>}
      <div style={{ color: C.steelSoft, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><UserCog size={16} /> Matrice rôles × utilisateurs. Création par auto-inscription, validation réservée à la direction (RLS).</div>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <Card style={{ padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
            <thead><tr style={{ background: C.steel, color: C.white, textAlign: "left" }}>{["Utilisateur", "Email", "Rôle", "Statut", "Action"].map((h) => <th key={h} style={{ padding: "10px 12px", fontFamily: FONTS.condensed, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: 13 }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.line}`, background: !u.actif ? C.amberSoft : i % 2 ? "#FAFBFC" : C.white }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{u.nom}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}><select style={inp} value={u.role} onChange={(e) => setRole(u, e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
                  <td style={{ padding: 12 }}><span style={{ color: u.actif ? C.green : C.amber, fontWeight: 700, fontSize: 13 }}>{u.actif ? "Actif" : "En attente"}</span></td>
                  <td style={{ padding: 12 }}>
                    {u.actif
                      ? <button onClick={() => setActif(u, false)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12.5 }}>Désactiver</button>
                      : <button onClick={() => setActif(u, true)} style={{ ...btnPrimary, background: C.green, padding: "6px 12px", fontSize: 12.5 }}><UserCheck size={14} /> Activer</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: C.steelSoft }}>Aucun utilisateur visible (droits).</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
