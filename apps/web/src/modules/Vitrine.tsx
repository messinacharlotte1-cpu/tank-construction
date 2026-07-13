import { useEffect, useState } from "react";
import { HardHat, MapPin, Home, ArrowLeft, Store, UserCog, Star } from "lucide-react";
import { C, FONTS, Card, StatutBadge, SectionTitle, Toggle, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";

// Page PUBLIQUE (sans authentification) — lit les programmes marqués `public` via RLS anon.
type Lot = { reference: string; typologie: string | null; surface: number | null; prix: number; statut: string };
type Prog = { id: string; nom: string; ville: string; lots_immo: Lot[] };
type Artisan = { id: string; nom: string; categorie: string | null; note: number };
const LABEL: Record<string, string> = { DISPONIBLE: "Disponible", RESERVE: "Réservé", VENDU: "Vendu" };

export default function Vitrine({ onBack, embedded }: { onBack?: () => void; embedded?: boolean }) {
  const [progs, setProgs] = useState<Prog[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [publiee, setPubliee] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("programmes").select("id,nom,ville,lots_immo(reference,typologie,surface,prix,statut)").then(({ data }) => {
      setProgs((data as unknown as Prog[]) ?? []);
      setLoading(false);
    });
    // Annuaire = fournisseurs/sous-traitants notés (embarqué uniquement, nécessite session).
    if (embedded) supabase.from("fournisseurs").select("id,nom,categorie,note").order("note", { ascending: false }).then(({ data }) => setArtisans((data as Artisan[]) ?? []));
  }, [embedded]);

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? undefined : C.concrete }}>
      {!embedded && (
        <header style={{ background: C.steel, color: C.white, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: C.orange, borderRadius: 8, padding: 6 }}><HardHat size={20} color={C.white} /></div>
            <span style={{ fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 22, textTransform: "uppercase", letterSpacing: 1 }}>Tank Immo — Nos programmes</span>
          </div>
          {onBack && <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.steelSoft}`, color: C.white, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><ArrowLeft size={15} /> Connexion</button>}
        </header>
      )}
      <main style={{ maxWidth: embedded ? "none" : 1100, margin: "0 auto", padding: embedded ? 0 : 24, display: "grid", gap: 20 }}>
        {embedded && (
          <>
            <SectionTitle icon={Store} action={
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.steelSoft }}>Vitrine publiée <Toggle on={publiee} onChange={setPubliee} /></label>
            }>Vitrine publique &amp; annuaire</SectionTitle>
            <div style={{ fontSize: 12.5, color: C.steelSoft }}>Page publique auto-générée depuis la grille des lots — partageable sur WhatsApp/Facebook. Aperçu ci-dessous.</div>
          </>
        )}
        <div style={{ display: "grid", gap: 20, opacity: embedded && !publiee ? 0.45 : 1 }}>
        {loading ? <div style={{ color: C.steelSoft }}>Chargement…</div> : progs.length === 0 ? <div style={{ color: C.steelSoft }}>Aucun programme publié.</div> : progs.map((p) => (
          <Card key={p.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Home size={22} color={C.orange} />
              <div>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{p.nom}</div>
                <div style={{ color: C.steelSoft, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {p.ville}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
              {p.lots_immo.map((l) => (
                <div key={l.reference} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: C.steel }}>{l.reference}</b>
                    <StatutBadge s={LABEL[l.statut] ?? l.statut} />
                  </div>
                  <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 6 }}>{[l.typologie, l.surface ? l.surface + " m²" : null].filter(Boolean).join(" · ")}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.orange, marginTop: 6 }}>{fcfa(Number(l.prix))}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
        </div>

        {embedded && (
          <Card>
            <SectionTitle icon={UserCog}>Annuaire d'artisans qualifiés (réseau du promoteur)</SectionTitle>
            <div style={{ fontSize: 12.5, color: C.steelSoft, marginBottom: 10 }}>Notes issues des évaluations réelles (module Fournisseurs). Badge « Vérifié » = note ≥ 4/5.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {artisans.map((a) => (
                <div key={a.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 14, color: C.steel }}>{a.nom}</b>
                    {a.note >= 4 && <span style={{ background: C.greenSoft, color: C.green, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>✓ VÉRIFIÉ</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.steelSoft }}>{a.categorie ?? "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} fill={s <= a.note ? C.orange : "none"} color={s <= a.note ? C.orange : C.line} />)}
                    <b style={{ fontSize: 12.5, marginLeft: 4, color: C.steel }}>{a.note ? a.note.toFixed(1) : "—"}</b>
                  </div>
                </div>
              ))}
              {artisans.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun artisan noté. Notez vos fournisseurs dans Ressources → Fournisseurs.</div>}
            </div>
          </Card>
        )}
        <div style={{ textAlign: "center", color: C.steelSoft, fontSize: 12 }}>Vitrine publique — données en lecture seule.</div>
      </main>
    </div>
  );
}
