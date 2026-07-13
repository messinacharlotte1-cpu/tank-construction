import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Bell, CheckSquare } from "lucide-react";
import { C, FONTS, Card, SectionTitle } from "@tank/ui";
import { supabase, getTenant } from "../lib/supabase";

const NOTIFS = [
  "Rapport journalier reçu → notification au conducteur de travaux",
  "Stock sous seuil → alerte au magasinier + bon de commande suggéré",
  "Facture impayée J+15 / J+30 → relance client automatique",
  "Devis accepté par le client → notification à la direction",
  "Incident gravité élevée → alerte immédiate direction + conducteur",
  "Rapport hebdomadaire PDF → envoyé chaque lundi 7 h",
];

type Msg = { id: string; auteur: string; contenu: string; createdAt: string };

export default function MessagerieLive() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [tid, setTid] = useState<string | null>(null);
  const [me, setMe] = useState("");
  const [txt, setTxt] = useState("");
  const [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await supabase.from("messages").select("id,auteur,contenu,createdAt").order("createdAt");
    setRows((data as Msg[]) ?? []);
    setLoading(false);
    setTimeout(() => end.current?.scrollIntoView(), 50);
  }
  useEffect(() => {
    (async () => {
      setTid(await getTenant());
      const { data } = await supabase.auth.getUser();
      setMe(data.user?.email ?? "moi");
      void load();
    })();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!tid || !txt.trim()) return;
    const contenu = txt; setTxt("");
    const { error } = await supabase.from("messages").insert({ id: crypto.randomUUID(), tenantId: tid, auteur: me, contenu, createdAt: new Date().toISOString() });
    if (!error) void load();
  }

  const inp: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={MessageCircle}>Messagerie chantier &amp; notifications WhatsApp</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, height: 380, overflow: "auto" }}>
            {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : rows.map((m) => {
              const mine = m.auteur === me;
              return (
                <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  <div style={{ fontSize: 11, color: C.steelSoft, marginBottom: 2, textAlign: mine ? "right" : "left" }}>{m.auteur} · {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                  <div style={{ background: mine ? C.orange : C.concrete, color: mine ? C.white : C.steel, padding: "9px 13px", borderRadius: 12, fontSize: 14 }}>{m.contenu}</div>
                </div>
              );
            })}
            {!loading && rows.length === 0 && <div style={{ color: C.steelSoft, fontSize: 13 }}>Aucun message. Démarrez le fil.</div>}
            <div ref={end} />
          </div>
          <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Message à l'équipe…" value={txt} onChange={(e) => setTxt(e.target.value)} />
            <button type="submit" style={{ padding: "10px 18px", border: "none", borderRadius: 8, background: C.orange, color: C.white, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Send size={16} /> Envoyer</button>
          </form>
        </Card>

        <Card>
          <SectionTitle icon={Bell}>Notifications automatiques (WhatsApp Business API)</SectionTitle>
          <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
            {NOTIFS.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.concrete, borderRadius: 8 }}>
                <CheckSquare size={16} color="#25D366" style={{ flexShrink: 0 }} />
                <span style={{ color: C.steel }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
            Les équipes reçoivent les alertes là où elles communiquent déjà. Relais WhatsApp/SMS à activer en production (clés API).
          </div>
        </Card>
      </div>
    </div>
  );
}
