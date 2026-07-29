import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, ArrowLeft, MapPin, ImageIcon, FileText } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Annot = { x: number; y: number; note: string; resolu: boolean };
type Categorie = "PHOTO" | "PLAN" | "ACTE_ADMIN";
type Media = {
  id: string;
  chantier: string;
  chantierId: string | null;
  categorie: Categorie;
  nom: string;
  url: string;
  annotations: Annot[] | null;
};
type ChantierRef = { id: string; nom: string };

// Libellés + ordre d'affichage des catégories (un seul module médias sert plans, photos et actes admin).
const CATS: { key: Categorie; label: string }[] = [
  { key: "PHOTO", label: "Photos" },
  { key: "PLAN", label: "Plans" },
  { key: "ACTE_ADMIN", label: "Actes administratifs" },
];
const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);
// Épingler des réserves n'a de sens que sur une image annotable (plan/photo), pas un PDF.
const isAnnotable = (m: Media) => !isPdf(m.url);

export default function MediasLive() {
  const [rows, setRows] = useState<Media[]>([]);
  const [chantiers, setChantiers] = useState<ChantierRef[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chantierId, setChantierId] = useState("");
  const [categorie, setCategorie] = useState<Categorie>("PHOTO");
  const [filtre, setFiltre] = useState<Categorie | "ALL">("ALL");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setTid(await getTenant());
    const [med, cha] = await Promise.all([
      supabase.from("medias").select("id,chantier,chantierId,categorie,nom,url,annotations").order("createdAt", { ascending: false }),
      supabase.from("chantiers").select("id,nom").order("nom"),
    ]);
    if (med.error) setErr(med.error.message);
    else setRows((med.data as Media[]) ?? []);
    if (!cha.error) setChantiers((cha.data as ChantierRef[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function upload(file: File) {
    if (!tid) return;
    if (!chantierId) { setErr("Choisissez le chantier avant l'upload."); return; }
    const cha = chantiers.find((c) => c.id === chantierId);
    if (!cha) { setErr("Chantier introuvable."); return; }
    setBusy(true); setErr(null);
    const path = `${tid}/${crypto.randomUUID()}-${file.name}`;
    const up = await supabase.storage.from("medias").upload(path, file);
    if (up.error) { setBusy(false); setErr("Upload : " + up.error.message); return; }
    const { data: pub } = supabase.storage.from("medias").getPublicUrl(path);
    const { error } = await supabase.from("medias").insert({
      id: crypto.randomUUID(),
      tenantId: tid,
      chantier: cha.nom, // nom conservé (dénormalisé) pour compat écrans historiques
      chantierId: cha.id, // vrai lien
      categorie,
      nom: file.name,
      url: pub.publicUrl,
      annotations: [],
      createdAt: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return setErr(error.message.includes("row-level") ? "Droits insuffisants (rôle)." : error.message);
    void load();
  }
  async function del(m: Media) { await supabase.from("medias").delete().eq("id", m.id); setRows((r) => r.filter((x) => x.id !== m.id)); setOpen(null); }
  async function saveAnnots(m: Media, annotations: Annot[]) {
    setOpen({ ...m, annotations });
    setRows((r) => r.map((x) => x.id === m.id ? { ...x, annotations } : x));
    await supabase.from("medias").update({ annotations }).eq("id", m.id);
  }

  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const catLabel = (k: Categorie) => CATS.find((c) => c.key === k)?.label ?? k;

  if (open) {
    const annots = open.annotations ?? [];
    const pdf = isPdf(open.url);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setOpen(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Médias</button>
          <div style={{ fontWeight: 700, color: C.steel }}>{open.nom} — {open.chantier}</div>
          <button onClick={() => del(open)} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.red, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={15} /> Supprimer</button>
        </div>
        {pdf ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, color: C.steelSoft }}>Document PDF ({catLabel(open.categorie)}).</div>
            <iframe title={open.nom} src={open.url} style={{ width: "100%", height: 640, border: `1px solid ${C.line}`, borderRadius: 10 }} />
            <a href={open.url} target="_blank" rel="noreferrer" style={{ color: C.orange, fontWeight: 700 }}>Ouvrir dans un nouvel onglet ↗</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: C.steelSoft }}>Cliquez sur l'image pour épingler une réserve. Cliquez une épingle pour la lever/supprimer.</div>
            <div style={{ position: "relative", display: "inline-block", maxWidth: 800 }}
              onClick={(e) => {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 100;
                const y = ((e.clientY - r.top) / r.height) * 100;
                const note = window.prompt("Note de la réserve :");
                if (note) void saveAnnots(open, [...annots, { x, y, note, resolu: false }]);
              }}>
              <img src={open.url} alt={open.nom} style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />
              {annots.map((a, i) => (
                <button key={i} title={a.note}
                  onClick={(e) => { e.stopPropagation(); const act = window.confirm(`"${a.note}"\nOK = ${a.resolu ? "rouvrir" : "lever"} · Annuler = supprimer`); const next = act ? annots.map((x, j) => j === i ? { ...x, resolu: !x.resolu } : x) : annots.filter((_, j) => j !== i); void saveAnnots(open, next); }}
                  style={{ position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%,-100%)", background: a.resolu ? C.green : C.red, color: C.white, border: "2px solid white", borderRadius: "50% 50% 50% 0", width: 22, height: 22, cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
                  <MapPin size={12} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const visibles = rows.filter((m) => filtre === "ALL" || m.categorie === filtre);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select style={{ ...inp, flex: 1, minWidth: 180 }} value={chantierId} onChange={(e) => setChantierId(e.target.value)}>
          <option value="">Chantier…</option>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select style={{ ...inp, minWidth: 160 }} value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)}>
          {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}><Upload size={16} /> {busy ? "Upload…" : "Ajouter"}</button>
      </Card>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([{ key: "ALL", label: "Tout" }, ...CATS] as { key: Categorie | "ALL"; label: string }[]).map((c) => {
          const actif = filtre === c.key;
          const n = c.key === "ALL" ? rows.length : rows.filter((m) => m.categorie === c.key).length;
          return (
            <button key={c.key} onClick={() => setFiltre(c.key)}
              style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${actif ? C.orange : C.line}`, background: actif ? C.orange : "transparent", color: actif ? C.white : C.steel, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {c.label} ({n})
            </button>
          );
        })}
      </div>

      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
          {visibles.map((m) => {
            const ouvertes = (m.annotations ?? []).filter((a) => !a.resolu).length;
            const pdf = isPdf(m.url);
            return (
              <Card key={m.id} style={{ cursor: "pointer", padding: 0, overflow: "hidden" }}>
                <div onClick={() => setOpen(m)}>
                  {pdf ? (
                    <div style={{ width: "100%", height: 140, display: "grid", placeItems: "center", background: C.concrete }}>
                      <FileText size={40} color={C.orange} />
                    </div>
                  ) : (
                    <img src={m.url} alt={m.nom} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600, color: C.steel, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {pdf ? <FileText size={14} color={C.orange} /> : <ImageIcon size={14} color={C.orange} />} {m.nom}
                    </div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>
                      {m.chantier} · {catLabel(m.categorie)}{ouvertes && isAnnotable(m) ? ` · ${ouvertes} réserve(s)` : ""}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {visibles.length === 0 && <div style={{ color: C.steelSoft }}>Aucun document dans cette catégorie.</div>}
        </div>
      )}
    </div>
  );
}
