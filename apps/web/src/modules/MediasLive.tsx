import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, ArrowLeft, MapPin, ImageIcon } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

type Annot = { x: number; y: number; note: string; resolu: boolean };
type Media = { id: string; chantier: string; nom: string; url: string; annotations: Annot[] | null };

export default function MediasLive() {
  const [rows, setRows] = useState<Media[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setTid(await getTenant());
    const { data, error } = await supabase.from("medias").select("id,chantier,nom,url,annotations").order("createdAt", { ascending: false });
    if (error) setErr(error.message); else setRows((data as Media[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function upload(file: File) {
    if (!tid) return;
    if (!chantier.trim()) { setErr("Renseignez le chantier avant l'upload."); return; }
    setBusy(true); setErr(null);
    const path = `${tid}/${crypto.randomUUID()}-${file.name}`;
    const up = await supabase.storage.from("medias").upload(path, file);
    if (up.error) { setBusy(false); setErr("Upload : " + up.error.message); return; }
    const { data: pub } = supabase.storage.from("medias").getPublicUrl(path);
    const { error } = await supabase.from("medias").insert({ id: crypto.randomUUID(), tenantId: tid, chantier, nom: file.name, url: pub.publicUrl, annotations: [], createdAt: new Date().toISOString() });
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

  if (open) {
    const annots = open.annotations ?? [];
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setOpen(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Médias</button>
          <div style={{ fontWeight: 700, color: C.steel }}>{open.nom} — {open.chantier}</div>
          <button onClick={() => del(open)} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.red, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={15} /> Supprimer</button>
        </div>
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
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input style={{ ...inp, flex: 1, minWidth: 200 }} placeholder="Chantier (pour le prochain upload)" value={chantier} onChange={(e) => setChantier(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6, background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}><Upload size={16} /> {busy ? "Upload…" : "Ajouter plan/photo"}</button>
      </Card>
      {err && <Card style={{ borderColor: C.red, color: C.red }}>{err}</Card>}
      {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
          {rows.map((m) => {
            const ouvertes = (m.annotations ?? []).filter((a) => !a.resolu).length;
            return (
              <Card key={m.id} style={{ cursor: "pointer", padding: 0, overflow: "hidden" }}>
                <div onClick={() => setOpen(m)}>
                  <img src={m.url} alt={m.nom} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600, color: C.steel, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><ImageIcon size={14} color={C.orange} /> {m.nom}</div>
                    <div style={{ fontSize: 12, color: C.steelSoft }}>{m.chantier}{ouvertes ? ` · ${ouvertes} réserve(s)` : ""}</div>
                  </div>
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && <div style={{ color: C.steelSoft }}>Aucun média. Ajoutez un plan ou une photo.</div>}
        </div>
      )}
    </div>
  );
}
