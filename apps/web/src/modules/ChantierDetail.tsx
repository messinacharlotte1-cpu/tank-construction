import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Calendar, MapPin, Users, ClipboardCheck, Camera, CloudSun, WifiOff, FileText, Receipt, Upload } from "lucide-react";
import { C, FONTS, Card, Progress, Hazard, Kpi, StatutBadge, SectionTitle, miniLabel, fcfa, ConfirmModal } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Tache = { id: string; nom: string; lot: string; pct: number; corpsEtatId: string | null };
type CorpsEtat = { id: string; categorie: "GROS_OEUVRE" | "SECOND_OEUVRE"; libelle: string };
type Jalon = { id: string; libelle: string; valide: boolean; valideLe: string | null };
type Reserve = { id: string; description: string; localisation: string | null; statut: string };
type Media = { id: string; nom: string; url: string };
type Devis = { id: string; numero: string; client: string; statut: string };
type Journal = { id: string; date: string; auteur: string; meteo: string | null; texte: string; photos: number };
type Pt = { ouvrier: string; statut: string };

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);
const CAT_LABEL: Record<CorpsEtat["categorie"], string> = { GROS_OEUVRE: "Gros œuvre", SECOND_OEUVRE: "Second œuvre" };

const STATUT_LABEL: Record<string, string> = {
  EN_PREPARATION: "En préparation", EN_COURS: "En cours", EN_RETARD: "En retard", SUSPENDU: "Suspendu", TERMINE: "Terminé",
};

type ChantierHead = {
  id: string; nom: string; client?: string; ville?: string; statut?: string;
  budget?: number; consomme?: number; avancementReel?: number; avancementPrevu?: number;
  debut?: string | null; fin?: string | null;
};

const TABS = [
  { id: "apercu", label: "Vue d'ensemble" },
  { id: "taches", label: "Tâches" },
  { id: "medias", label: "Plans & Photos" },
  { id: "reserves", label: "Réserves & OPR" },
  { id: "devis", label: "Devis" },
  { id: "journal", label: "Journal de chantier" },
];

const fdate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export default function ChantierDetail({ chantier, onBack }: { chantier: ChantierHead; onBack: () => void }) {
  const [tab, setTab] = useState("apercu");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [corps, setCorps] = useState<CorpsEtat[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [journal, setJournal] = useState<Journal[]>([]);
  const [equipe, setEquipe] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tid, setTid] = useState<string | null>(null);
  const [busyUp, setBusyUp] = useState(false);
  const [catUp, setCatUp] = useState<"PHOTO" | "PLAN" | "ACTE_ADMIN">("PHOTO");
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDel, setConfirmDel] = useState<{ kind: "tache" | "jalon"; id: string; label: string } | null>(null);
  const [ft, setFt] = useState({ nom: "", lot: "Gros œuvre", pct: "0", corpsEtatId: "" });
  const [fj, setFj] = useState("");
  const [fjr, setFjr] = useState({ auteur: "", meteo: "", texte: "" });

  async function load() {
    setTid(await getTenant());
    const [t, j, r, m, dv, jr, pts, ce] = await Promise.all([
      supabase.from("taches").select("id,nom,lot,pct,corpsEtatId").eq("chantierId", chantier.id).order("lot"),
      supabase.from("jalons").select("id,libelle,valide,valideLe").eq("chantierId", chantier.id).order("valideLe", { nullsFirst: false }),
      supabase.from("reserves").select("id,description,localisation,statut").eq("chantierId", chantier.id).order("createdAt", { ascending: false }),
      supabase.from("medias").select("id,nom,url").eq("chantierId", chantier.id).order("createdAt", { ascending: false }),
      supabase.from("devis").select("id,numero,client,statut").eq("chantierId", chantier.id).order("numero", { ascending: false }),
      supabase.from("journal_chantier").select("id,date,auteur,meteo,texte,photos").eq("chantierId", chantier.id).order("date", { ascending: false }),
      supabase.from("pointages").select("ouvrier,statut").eq("chantierId", chantier.id),
      supabase.from("corps_etat").select("id,categorie,libelle").eq("actif", true).order("categorie").order("ordre"),
    ]);
    if (t.error) setErr(t.error.message); else setTaches((t.data as Tache[]) ?? []);
    if (!ce.error) setCorps((ce.data as CorpsEtat[]) ?? []);
    setJalons((j.data as Jalon[]) ?? []);
    setReserves((r.data as Reserve[]) ?? []);
    setMedias((m.data as Media[]) ?? []);
    setDevis((dv.data as Devis[]) ?? []);
    setJournal((jr.data as Journal[]) ?? []);
    const noms = [...new Set(((pts.data as Pt[]) ?? []).filter((p) => p.statut !== "A").map((p) => p.ouvrier))];
    setEquipe(noms);
  }
  useEffect(() => { void load(); }, [chantier.id]);

  async function addTache(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("taches").insert({ id: crypto.randomUUID(), chantierId: chantier.id, nom: ft.nom, lot: ft.lot, corpsEtatId: ft.corpsEtatId || null, pct: Number(ft.pct) || 0 });
    if (error) return setErr(error.message);
    setFt({ nom: "", lot: ft.lot, pct: "0", corpsEtatId: ft.corpsEtatId }); void load();
  }
  const corpsLabel = (id: string | null) => {
    const c = corps.find((x) => x.id === id);
    return c ? `${CAT_LABEL[c.categorie]} · ${c.libelle}` : null;
  };
  async function setPct(t: Tache, pct: number) { setTaches((r) => r.map((x) => x.id === t.id ? { ...x, pct } : x)); await supabase.from("taches").update({ pct }).eq("id", t.id); }
  async function delTache(id: string) { await supabase.from("taches").delete().eq("id", id); setTaches((r) => r.filter((x) => x.id !== id)); }

  async function addJalon(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("jalons").insert({ id: crypto.randomUUID(), chantierId: chantier.id, libelle: fj, valide: false });
    if (error) return setErr(error.message);
    setFj(""); void load();
  }
  async function toggleJalon(j: Jalon) {
    const valide = !j.valide;
    setJalons((r) => r.map((x) => x.id === j.id ? { ...x, valide, valideLe: valide ? new Date().toISOString() : null } : x));
    await supabase.from("jalons").update({ valide, valideLe: valide ? new Date().toISOString() : null }).eq("id", j.id);
  }
  async function delJalon(id: string) { await supabase.from("jalons").delete().eq("id", id); setJalons((r) => r.filter((x) => x.id !== id)); }

  async function addJournal(e: React.FormEvent) {
    e.preventDefault();
    if (!fjr.texte.trim()) return;
    const { error } = await supabase.from("journal_chantier").insert({ id: crypto.randomUUID(), chantierId: chantier.id, auteur: fjr.auteur || "Terrain", meteo: fjr.meteo || null, texte: fjr.texte, photos: 0 });
    if (error) return setErr(error.message);
    setFjr({ auteur: "", meteo: "", texte: "" }); void load();
  }

  // Upload direct depuis la fiche — pré-rattaché à CE chantier (nom + chantierId).
  async function uploadMedia(file: File) {
    if (!tid) { setErr("Tenant introuvable."); return; }
    setBusyUp(true); setErr(null);
    const path = `${tid}/${crypto.randomUUID()}-${file.name}`;
    const up = await supabase.storage.from("medias").upload(path, file);
    if (up.error) { setBusyUp(false); setErr("Upload : " + up.error.message); return; }
    const { data: pub } = supabase.storage.from("medias").getPublicUrl(path);
    const { error } = await supabase.from("medias").insert({ id: crypto.randomUUID(), tenantId: tid, chantier: chantier.nom, chantierId: chantier.id, categorie: catUp, nom: file.name, url: pub.publicUrl, annotations: [], createdAt: new Date().toISOString() });
    setBusyUp(false);
    if (error) { setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle)." : error.message); return; }
    void load();
  }

  const inp: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const avg = taches.length ? Math.round(taches.reduce((s, t) => s + Number(t.pct), 0) / taches.length) : 0;
  const budget = Number(chantier.budget ?? 0), consomme = Number(chantier.consomme ?? 0);
  const budgetPct = budget ? Math.round((consomme / budget) * 100) : 0;
  const aReel = Number(chantier.avancementReel ?? avg), aPrevu = Number(chantier.avancementPrevu ?? 0);
  const enRetard = aReel < aPrevu - 5;
  const reservesOuvertes = reserves.filter((r) => r.statut !== "Levée").length;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button onClick={onBack} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Retour aux chantiers</button>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{chantier.nom}</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 13, color: C.steelSoft }}>
                {chantier.client && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={14} /> {chantier.client}</span>}
                {chantier.ville && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {chantier.ville}</span>}
                {(chantier.debut || chantier.fin) && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={14} /> {fdate(chantier.debut)} → {fdate(chantier.fin)}</span>}
              </div>
            </div>
            {chantier.statut && <StatutBadge s={STATUT_LABEL[chantier.statut] ?? chantier.statut} />}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, padding: "8px 14px", fontSize: 13.5, fontWeight: 700, color: tab === t.id ? C.orange : C.steelSoft, borderBottom: `3px solid ${tab === t.id ? C.orange : "transparent"}` }}>
                {t.label}{t.id === "reserves" && reservesOuvertes ? ` (${reservesOuvertes})` : ""}{t.id === "medias" && medias.length ? ` (${medias.length})` : ""}{t.id === "devis" && devis.length ? ` (${devis.length})` : ""}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {tab === "apercu" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Avancement réel vs prévu</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, color: enRetard ? C.red : C.green }}>{aReel} % <span style={{ fontSize: 16, color: C.steelSoft }}>/ {aPrevu} %</span></div>
              <Progress pct={aReel} color={enRetard ? C.red : C.green} />
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Budget consommé</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, color: budgetPct > 90 ? C.red : C.steel }}>{budgetPct} %</div>
              <div style={{ fontSize: 12, color: C.steelSoft }}>{fcfa(consomme)} / {fcfa(budget)}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={miniLabel}>Équipe affectée</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 30, fontWeight: 700, color: C.steel }}>{equipe.length}</div>
              <div style={{ fontSize: 12, color: C.steelSoft }}>{equipe.map((e) => e.split(" ")[0]).join(", ") || "Aucun pointage"}</div>
            </Card>
          </div>
          <Card>
            <SectionTitle icon={Calendar}>Jalons du chantier</SectionTitle>
            <form onSubmit={addJalon} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Nouveau jalon" value={fj} onChange={(e) => setFj(e.target.value)} required />
              <button type="submit" style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: C.orange, color: C.white, cursor: "pointer" }}><Plus size={15} /></button>
            </form>
            <div style={{ fontSize: 11, color: C.steelSoft, marginBottom: 10 }}>Un jalon validé (constat contradictoire) débloque l'appel de fonds VEFA.</div>
            <div style={{ display: "grid", gap: 0 }}>
              {jalons.map((j, i) => (
                <div key={j.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <button onClick={() => toggleJalon(j)} title="Valider / invalider" style={{ width: 22, height: 22, borderRadius: "50%", background: j.valide ? C.green : C.concrete, border: `2px solid ${j.valide ? C.green : C.line}`, display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}>
                      {j.valide && <CheckCircle2 size={14} color={C.white} />}
                    </button>
                    {i < jalons.length - 1 && <div style={{ width: 2, height: 26, background: C.line }} />}
                  </div>
                  <div style={{ paddingBottom: 12, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: j.valide ? C.steelSoft : C.steel, textDecoration: j.valide ? "line-through" : "none" }}>{j.libelle}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{j.valide && j.valideLe ? `validé le ${fdate(j.valideLe)}` : "à venir"}</div>
                  </div>
                  <button onClick={() => setConfirmDel({ kind: "jalon", id: j.id, label: j.libelle })} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
                </div>
              ))}
              {jalons.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun jalon.</div>}
            </div>
          </Card>
        </>
      )}

      {tab === "taches" && (
        <Card>
          <SectionTitle icon={ClipboardCheck}>Tâches et lots de travaux</SectionTitle>
          <form onSubmit={addTache} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 0.6fr auto", gap: 8, marginBottom: 14 }}>
            <input style={inp} placeholder="Tâche" value={ft.nom} onChange={(e) => setFt({ ...ft, nom: e.target.value })} required />
            <select style={inp} value={ft.corpsEtatId} onChange={(e) => setFt({ ...ft, corpsEtatId: e.target.value })} title="Corps d'état">
              <option value="">Corps d'état…</option>
              {(["GROS_OEUVRE", "SECOND_OEUVRE"] as const).map((cat) => {
                const items = corps.filter((c) => c.categorie === cat);
                if (!items.length) return null;
                return <optgroup key={cat} label={CAT_LABEL[cat]}>{items.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}</optgroup>;
              })}
            </select>
            <input style={inp} placeholder="Lot / activité" value={ft.lot} onChange={(e) => setFt({ ...ft, lot: e.target.value })} />
            <input style={inp} type="number" min="0" max="100" value={ft.pct} onChange={(e) => setFt({ ...ft, pct: e.target.value })} />
            <button type="submit" style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: C.orange, color: C.white, cursor: "pointer" }}><Plus size={15} /></button>
          </form>
          <div style={{ display: "grid", gap: 12 }}>
            {taches.map((t) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 52px auto", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.steel }}>{t.nom}</div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>{corpsLabel(t.corpsEtatId) ? `${corpsLabel(t.corpsEtatId)} — ${t.lot}` : t.lot}</div>
                  <div style={{ marginTop: 6 }}><Progress pct={Number(t.pct)} color={Number(t.pct) === 100 ? C.green : C.orange} /></div>
                </div>
                <input style={{ ...inp, padding: "5px 8px" }} type="number" min="0" max="100" value={t.pct} onChange={(e) => setPct(t, Number(e.target.value))} />
                <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, color: C.steel, textAlign: "right" }}>{t.pct} %</div>
                <button onClick={() => setConfirmDel({ kind: "tache", id: t.id, label: t.nom })} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={15} /></button>
              </div>
            ))}
            {taches.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucune tâche.</div>}
          </div>
        </Card>
      )}

      {tab === "medias" && (
        <Card>
          <SectionTitle icon={Camera}>Plans & photos</SectionTitle>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <select style={inp} value={catUp} onChange={(e) => setCatUp(e.target.value as "PHOTO" | "PLAN" | "ACTE_ADMIN")}>
              <option value="PHOTO">Photo</option>
              <option value="PLAN">Plan</option>
              <option value="ACTE_ADMIN">Acte administratif</option>
            </select>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} disabled={busyUp} style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}><Upload size={15} /> {busyUp ? "Upload…" : "Ajouter ici"}</button>
            <span style={{ fontSize: 12, color: C.steelSoft }}>Rattaché directement à ce chantier.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12 }}>
            {medias.map((m) => (
              <a key={m.id} href={m.url} target="_blank" rel="noreferrer" style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, textDecoration: "none" }}>
                {isPdf(m.url) ? (
                  <div style={{ width: "100%", height: 120, display: "grid", placeItems: "center", background: C.concrete }}><FileText size={34} color={C.orange} /></div>
                ) : (
                  <img src={m.url} alt={m.nom} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: 8, fontSize: 12, color: C.steel }}>{m.nom}</div>
              </a>
            ))}
            {medias.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun plan/photo. Utilisez « Ajouter ici » ci-dessus.</div>}
          </div>
        </Card>
      )}

      {tab === "devis" && (
        <Card>
          <SectionTitle icon={Receipt}>Devis du chantier</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {devis.map((d) => (
              <div key={d.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileText size={16} color={C.orange} />
                  <div>
                    <div style={{ fontWeight: 700, color: C.steel }}>{d.numero}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{d.client}</div>
                  </div>
                </div>
                <StatutBadge s={d.statut} />
              </div>
            ))}
            {devis.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun devis rattaché. Rattacher un chantier au devis dans Commercial → Devis.</div>}
          </div>
        </Card>
      )}

      {tab === "reserves" && (
        <Card>
          <SectionTitle icon={ClipboardCheck}>Réserves & OPR</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {reserves.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${r.statut === "Levée" ? C.green : C.red}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div><div style={{ fontWeight: 600, color: C.steel }}>{r.description}</div><div style={{ fontSize: 12, color: C.steelSoft }}>{r.localisation ?? ""}</div></div>
                <span style={{ color: r.statut === "Levée" ? C.green : C.red, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{r.statut}</span>
              </div>
            ))}
            {reserves.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucune réserve. Gérer dans Opérations → Réserves.</div>}
          </div>
        </Card>
      )}

      {tab === "journal" && (
        <Card>
          <SectionTitle icon={ClipboardCheck}>Journal de chantier (rapports terrain)</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.amberSoft, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.steel, marginBottom: 14 }}>
            <WifiOff size={16} color={C.amber} /> Saisis hors-ligne sur le terrain, synchronisés à la reconnexion. La météo est journalisée — justificatif contractuel en cas de retard.
          </div>
          <form onSubmit={addJournal} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <input style={inp} placeholder="Auteur" value={fjr.auteur} onChange={(e) => setFjr({ ...fjr, auteur: e.target.value })} />
            <input style={inp} placeholder="Météo (ex. Ensoleillé)" value={fjr.meteo} onChange={(e) => setFjr({ ...fjr, meteo: e.target.value })} />
            <textarea style={{ ...inp, gridColumn: "1 / -1", resize: "vertical", minHeight: 54 }} placeholder="Compte-rendu de la journée…" value={fjr.texte} onChange={(e) => setFjr({ ...fjr, texte: e.target.value })} />
            <button type="submit" style={{ gridColumn: "1 / -1", justifySelf: "start", padding: "8px 14px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Ajouter au journal</button>
          </form>
          <div style={{ display: "grid", gap: 10 }}>
            {journal.map((j) => (
              <div key={j.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
                  <b style={{ color: C.steel }}>{fdate(j.date)} — {j.auteur}</b>
                  {j.meteo && <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.steelSoft }}><CloudSun size={13} /> {j.meteo}</span>}
                </div>
                <div style={{ fontSize: 13.5, color: C.steel, marginTop: 6 }}>{j.texte}</div>
                {j.photos > 0 && <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Camera size={12} /> {j.photos} photo{j.photos > 1 ? "s" : ""} géolocalisée{j.photos > 1 ? "s" : ""} et horodatée{j.photos > 1 ? "s" : ""}</div>}
              </div>
            ))}
            {journal.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucune entrée. Ajoutez un rapport ci-dessus.</div>}
          </div>
        </Card>
      )}

      {confirmDel && (
        <ConfirmModal danger confirmLabel="Supprimer"
          title={confirmDel.kind === "tache" ? "Supprimer la tâche" : "Supprimer le jalon"}
          message={<>Supprimer «&nbsp;{confirmDel.label}&nbsp;» ? Action irréversible.</>}
          onConfirm={() => { if (confirmDel.kind === "tache") void delTache(confirmDel.id); else void delJalon(confirmDel.id); setConfirmDel(null); }}
          onClose={() => setConfirmDel(null)} />
      )}
    </div>
  );
}
