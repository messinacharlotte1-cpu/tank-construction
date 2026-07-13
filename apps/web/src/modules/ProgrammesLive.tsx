import { useEffect, useState } from "react";
import { Plus, ArrowLeft, Building2, MapPin, Trash2, TrendingUp, Home } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, FONTS, Card, StatutBadge, Hazard, Kpi, Progress, SectionTitle, fcfa } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";
import PlanTypo from "./PlanTypo";

// Seuil de pré-commercialisation exigé par la banque pour débloquer le crédit promoteur.
const SEUIL_PRECO = 50;

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
  const [resaDates, setResaDates] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ reference: "", typologie: "", surface: "", prix: "" });
  const [typoPlan, setTypoPlan] = useState<string | null>(null);
  const [tab, setTab] = useState("masse");
  const [lotSel, setLotSel] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("Tous");
  const [blocSel, setBlocSel] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("lots_immo").select("id,reference,bloc,niveau,typologie,surface,prix,statut").eq("programmeId", programme.id).order("reference");
    if (error) setErr(error.message); else setLots((data as LotImmo[]) ?? []);
    // Dates de réservation (cumul des ventes dans le temps) — via les lots du programme.
    const { data: resas } = await supabase.from("reservations").select("date,lots_immo!inner(programmeId)").eq("lots_immo.programmeId", programme.id);
    setResaDates(((resas as unknown as { date: string }[]) ?? []).map((r) => r.date).filter(Boolean));
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

  // Écoulement % par typologie (réel).
  const typos = [...new Set(lots.map((l) => l.typologie || "—"))];
  const typoData = typos.map((t) => {
    const ls = lots.filter((l) => (l.typologie || "—") === t);
    const e = ls.filter((l) => l.statut !== "DISPONIBLE").length;
    return { nom: t, "Écoulé %": ls.length ? Math.round((e / ls.length) * 100) : 0 };
  });
  // Ventes + réservations cumulées par mois (à partir des dates de réservation réelles).
  const ventesData = (() => {
    const byMonth = new Map<string, number>();
    for (const d of resaDates) { const m = new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }); byMonth.set(m, (byMonth.get(m) ?? 0) + 1); }
    const months = [...byMonth.entries()].sort((a, b) => new Date("1 " + a[0]).getTime() - new Date("1 " + b[0]).getTime());
    let cumul = 0;
    return months.map(([mois, n]) => ({ mois, cumul: (cumul += n) }));
  })();
  const rythme = ventesData.length > 1 ? Math.round((ventesData.at(-1)!.cumul / ventesData.length) * 10) / 10 : ventesData.length ? ventesData[0].cumul : 0;
  const stockMois = rythme > 0 ? Math.ceil(dispos / rythme) : "—";
  const planTypos = typos.filter((t) => t !== "—");
  const planActive = typoPlan ?? planTypos[0] ?? null;
  const blocs = [...new Set(lots.map((l) => l.bloc).filter(Boolean))] as string[];
  const visibles = lots.filter((l) => (filtre === "Tous" || (l.typologie || "—") === filtre) && (!blocSel || l.bloc === blocSel));
  const sel = lots.find((l) => l.id === lotSel);
  const couleurs: Record<string, string> = { VENDU: C.steelSoft, RESERVE: C.amber, DISPONIBLE: C.green };
  const TABS = [
    { id: "masse", label: "Plan masse" },
    { id: "lots", label: "Grille des lots" },
    { id: "plans", label: "Plans des logements" },
    { id: "commercial", label: "Commercialisation" },
  ];
  async function reserver(l: LotImmo) {
    if (l.statut !== "DISPONIBLE") return;
    setLots((r) => r.map((x) => (x.id === l.id ? { ...x, statut: "RESERVE" } : x)));
    await supabase.from("lots_immo").update({ statut: "RESERVE" }).eq("id", l.id);
  }

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
          <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, padding: "8px 14px", fontSize: 13.5, fontWeight: 700, color: tab === t.id ? C.orange : C.steelSoft, borderBottom: `3px solid ${tab === t.id ? C.orange : "transparent"}` }}>{t.label}</button>
            ))}
          </div>
        </div>
      </Card>

      {tab === "masse" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 3fr) minmax(240px, 2fr)", gap: 20, alignItems: "start" }}>
          <Card>
            <SectionTitle icon={MapPin}>Plan masse — cliquez sur un lot pour changer son statut</SectionTitle>
            {lots.length > 0 ? (
              <svg viewBox={`0 0 ${5 * 110} ${Math.ceil(lots.length / 5) * 80}`} style={{ width: "100%" }}>
                {lots.map((l, i) => {
                  const col = i % 5, row = Math.floor(i / 5);
                  return (
                    <g key={l.id} onClick={() => cycle(l)} style={{ cursor: "pointer" }}>
                      <rect x={col * 110 + 6} y={row * 80 + 6} width={98} height={64} rx={8} fill={couleurs[l.statut]} opacity={lotSel === l.id ? 1 : 0.9} stroke={lotSel === l.id ? C.steel : "none"} strokeWidth={2} />
                      <text x={col * 110 + 55} y={row * 80 + 34} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{l.reference}</text>
                      <text x={col * 110 + 55} y={row * 80 + 52} textAnchor="middle" fill="#fff" fontSize={10}>{l.typologie ?? ""}</text>
                    </g>
                  );
                })}
              </svg>
            ) : <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun lot. Ajoutez-en dans « Grille des lots ».</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.steelSoft, flexWrap: "wrap" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.green, borderRadius: 2, marginRight: 4 }} />Disponible</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.amber, borderRadius: 2, marginRight: 4 }} />Réservé</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.steelSoft, borderRadius: 2, marginRight: 4 }} />Vendu</span>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Building2}>Répartition par typologie</SectionTitle>
            <div style={{ display: "grid", gap: 10 }}>
              {planTypos.map((t) => {
                const ls = lots.filter((l) => (l.typologie || "—") === t);
                const e = ls.filter((l) => l.statut !== "DISPONIBLE").length;
                return (
                  <div key={t}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                      <span><b>{t}</b> · {ls.length} lots</span>
                      <span style={{ color: C.steelSoft }}>{e}/{ls.length} écoulés</span>
                    </div>
                    <Progress pct={ls.length ? Math.round((e / ls.length) * 100) : 0} />
                  </div>
                );
              })}
              {planTypos.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Renseignez la typologie des lots.</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === "lots" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 3fr) minmax(250px, 2fr)", gap: 20, alignItems: "start" }}>
          <Card>
            <SectionTitle icon={Building2} action={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Tous", ...planTypos].map((t) => (
                  <button key={t} onClick={() => setFiltre(t)} style={{ padding: "5px 11px", fontSize: 12, borderRadius: 8, border: `1px solid ${filtre === t ? C.steel : C.line}`, cursor: "pointer", fontWeight: 600, background: filtre === t ? C.steel : "transparent", color: filtre === t ? C.white : C.steelSoft }}>{t}</button>
                ))}
                {blocs.map((b) => (
                  <button key={b} onClick={() => setBlocSel(blocSel === b ? null : b)} style={{ padding: "5px 11px", fontSize: 12, borderRadius: 8, border: `1px solid ${blocSel === b ? C.orange : C.line}`, cursor: "pointer", fontWeight: 600, background: blocSel === b ? C.orange : "transparent", color: blocSel === b ? C.white : C.steelSoft }}>Bloc {b}</button>
                ))}
              </div>
            }>Grille des lots ({visibles.length})</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {visibles.map((l) => (
                <button key={l.id} onClick={() => setLotSel(l.id)} title={`${l.reference} · ${STATUT_LABEL[l.statut] ?? l.statut}`} style={{ minWidth: 62, height: 40, borderRadius: 6, cursor: "pointer", fontFamily: FONTS.condensed, fontSize: 12, fontWeight: 700, border: lotSel === l.id ? `2px solid ${C.steel}` : `1px solid ${C.line}`, background: couleurs[l.statut], color: l.statut === "DISPONIBLE" ? C.steel : C.white, display: "grid", lineHeight: 1.1, padding: "2px 4px" }}>
                  <span>{l.reference}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.85 }}>{[l.bloc, l.niveau].filter(Boolean).join("·") || (l.typologie ?? "")}</span>
                </button>
              ))}
              {visibles.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun lot pour ce filtre.</div>}
            </div>
            <form onSubmit={addLot} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.4fr auto", gap: 8, marginTop: 16 }}>
              <input style={input} placeholder="Référence (L-A101)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />
              <input style={input} placeholder="Typologie (T3…)" value={form.typologie} onChange={(e) => setForm({ ...form, typologie: e.target.value })} />
              <input style={input} placeholder="Surface m²" type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
              <input style={input} placeholder="Prix FCFA" type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
              <button type="submit" style={{ padding: "9px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer" }}><Plus size={15} /></button>
            </form>
          </Card>

          <Card>
            <SectionTitle icon={Home}>Fiche du lot</SectionTitle>
            {sel ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: FONTS.condensed, fontSize: 26, fontWeight: 700, color: C.steel }}>{sel.reference}</div>
                  <StatutBadge s={STATUT_LABEL[sel.statut] ?? sel.statut} />
                </div>
                <PlanTypo typologie={sel.typologie} />
                <div style={{ fontSize: 13.5, color: C.steel, display: "grid", gap: 5 }}>
                  {(sel.bloc || sel.niveau) && <div>{sel.bloc ? <>Bloc <b>{sel.bloc}</b></> : null}{sel.niveau ? <> · Niveau <b>{sel.niveau}</b></> : null}</div>}
                  <div>Typologie <b>{sel.typologie ?? "—"}</b>{sel.surface ? <> · Surface <b>{sel.surface} m²</b></> : null}</div>
                  <div>Prix TTC : <b style={{ color: C.orange }}>{fcfa(Number(sel.prix))}</b></div>
                  <div>Apport réservation (30 %) : <b>{fcfa(Math.round(Number(sel.prix) * 0.3))}</b></div>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                  {sel.statut === "DISPONIBLE" && (
                    <button onClick={() => reserver(sel)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans }}>Poser une option / Réserver</button>
                  )}
                  <button onClick={() => del(sel.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", color: C.red, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13 }}><Trash2 size={14} /> Supprimer le lot</button>
                </div>
              </div>
            ) : <div style={{ fontSize: 13, color: C.steelSoft }}>Sélectionnez un lot pour afficher son plan, sa fiche, le réserver ou le supprimer.</div>}
          </Card>
        </div>
      )}

      {tab === "plans" && (
        planActive ? (
          <Card>
            <SectionTitle icon={Home} action={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {planTypos.map((t) => (
                  <button key={t} onClick={() => setTypoPlan(t)} style={{ padding: "5px 11px", fontSize: 12, borderRadius: 8, border: `1px solid ${planActive === t ? C.steel : C.line}`, cursor: "pointer", fontWeight: 600, background: planActive === t ? C.steel : "transparent", color: planActive === t ? C.white : C.steelSoft }}>{t}</button>
                ))}
              </div>
            }>Plans des logements — {planActive}</SectionTitle>
            <div style={{ maxWidth: 560 }}><PlanTypo typologie={planActive} /></div>
            <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>
              Plan indicatif de la typologie. En production : fichiers de l'architecte (PDF/DWG), annotables par les acquéreurs — chaque demande de TMA naît d'un commentaire localisé sur le plan.
            </div>
          </Card>
        ) : <Card><div style={{ fontSize: 13, color: C.steelSoft }}>Renseignez la typologie des lots pour afficher les plans.</div></Card>
      )}

      {tab === "commercial" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <Card style={{ padding: 16 }}><Kpi label="Rythme de vente moyen" value={<>{rythme}<span style={{ fontSize: 14, color: C.steelSoft }}> lots/mois</span></>} /></Card>
            <Card style={{ padding: 16 }}><Kpi label="Écoulement du stock restant" value={<>{stockMois}<span style={{ fontSize: 14, color: C.steelSoft }}> mois</span></>} sub="au rythme actuel" /></Card>
            <Card style={{ padding: 16 }}><Kpi label="Pré-commercialisation" value={`${precoPct} %`} color={precoPct >= SEUIL_PRECO ? C.green : C.amber} /></Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <Card>
              <SectionTitle icon={TrendingUp}>Ventes + réservations cumulées</SectionTitle>
              {ventesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={ventesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cumul" name="Lots écoulés" stroke={C.orange} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ fontSize: 13, color: C.steelSoft, padding: "20px 0" }}>Aucune réservation datée pour l'instant.</div>}
            </Card>
            <Card>
              <SectionTitle icon={Building2}>Écoulement par typologie (%)</SectionTitle>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={typoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                  <YAxis unit=" %" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v} %`} />
                  <Bar dataKey="Écoulé %" fill={C.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
