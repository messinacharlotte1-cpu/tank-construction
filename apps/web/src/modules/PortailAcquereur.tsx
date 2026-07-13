import { useEffect, useState } from "react";
import { UserCircle, Home, ArrowLeft, Printer, Landmark, Smartphone, Building2, FileText, Image as ImageIcon } from "lucide-react";
import { C, FONTS, Card, Kpi, Hazard, Banner, SectionTitle, StatutBadge, Progress, btnGhost, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { printDocument, fcfaP } from "../lib/pdf";
import { mensualite } from "../lib/calc";
import PlanTypo from "./PlanTypo";

type Lot = { reference: string; typologie: string | null; surface: number | null; prix: number; bloc: string | null; niveau: string | null; programmeId: string; programmes: { nom: string; ville: string } | null };
type Resa = { id: string; acquereur: string; lots_immo: Lot | null };
type Appel = { id: string; libelle: string; montant: number; echeance: string | null; statut: string };
type CatalogLot = { id: string; reference: string; typologie: string | null; surface: number | null; prix: number; bloc: string | null; niveau: string | null };
type ChantierMO = { id: string; nom: string; client: string; ville: string; statut: string; avancementReel: number; avancementPrevu: number; fin: string | null };

const STATUT: Record<string, [string, string]> = { PREVU: ["Prévu", C.amber], EMIS: ["Émis", C.green], PAYE: ["Payé", C.steelSoft] };

const ST_CH: Record<string, string> = { EN_PREPARATION: "En préparation", EN_COURS: "En cours", EN_RETARD: "En retard", SUSPENDU: "Suspendu", TERMINE: "Terminé" };

export default function PortailAcquereur() {
  const [espace, setEspace] = useState<"chantier" | "acquereur">("acquereur");
  const [resas, setResas] = useState<Resa[]>([]);
  const [sel, setSel] = useState<Resa | null>(null);
  const [appels, setAppels] = useState<Appel[]>([]);
  const [catalog, setCatalog] = useState<CatalogLot[]>([]);
  const [chantiers, setChantiers] = useState<ChantierMO[]>([]);
  const [chSel, setChSel] = useState<ChantierMO | null>(null);
  const [chMedias, setChMedias] = useState<{ id: string; nom: string; url: string }[]>([]);
  const [chFactures, setChFactures] = useState<{ id: string; numero: string; ttc: number; statut: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, c] = await Promise.all([
        supabase.from("reservations").select("id,acquereur,lots_immo(reference,typologie,surface,prix,bloc,niveau,programmeId,programmes(nom,ville))"),
        supabase.from("chantiers").select("id,nom,client,ville,statut,avancementReel,avancementPrevu,fin"),
      ]);
      setResas((r.data as unknown as Resa[]) ?? []);
      setChantiers((c.data as ChantierMO[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function openResa(r: Resa) {
    setSel(r);
    setCatalog([]);
    const { data } = await supabase.from("appels_de_fonds").select("id,libelle,montant,echeance,statut").eq("reservationId", r.id).order("echeance");
    setAppels((data as Appel[]) ?? []);
    // Catalogue : autres lots encore disponibles dans le même programme.
    if (r.lots_immo?.programmeId) {
      const { data: c } = await supabase.from("lots_immo").select("id,reference,typologie,surface,prix,bloc,niveau").eq("programmeId", r.lots_immo.programmeId).eq("statut", "DISPONIBLE").order("reference");
      setCatalog((c as CatalogLot[]) ?? []);
    }
  }

  async function openChantier(c: ChantierMO) {
    setChSel(c);
    const [m, f] = await Promise.all([
      supabase.from("medias").select("id,nom,url").eq("chantier", c.nom).order("createdAt", { ascending: false }),
      supabase.from("factures").select("id,numero,ttc,statut").eq("client", c.client).order("numero", { ascending: false }),
    ]);
    setChMedias((m.data as { id: string; nom: string; url: string }[]) ?? []);
    setChFactures((f.data as { id: string; numero: string; ttc: number; statut: string }[]) ?? []);
  }

  if (loading) return <div style={{ color: C.steelSoft }}>Chargement…</div>;

  const switcher = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, background: C.steel, color: C.white, borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
      <UserCircle size={18} color={C.orange} />
      <span style={{ flex: 1, minWidth: 220 }}><b>Portail client — lecture seule.</b> Deux profils : le maître d'ouvrage d'un chantier (suivi, médias, factures) et l'acquéreur d'un lot en VEFA (son logement, son échéancier, le catalogue).</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => { setEspace("chantier"); setSel(null); }} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: espace === "chantier" ? C.orange : "transparent", color: C.white, borderColor: espace === "chantier" ? C.orange : C.steelSoft }}>Maître d'ouvrage</button>
        <button onClick={() => { setEspace("acquereur"); setChSel(null); }} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: espace === "acquereur" ? C.orange : "transparent", color: C.white, borderColor: espace === "acquereur" ? C.orange : C.steelSoft }}>Acquéreur</button>
      </div>
    </div>
  );

  // ── Espace Maître d'ouvrage ──────────────────────────────
  if (espace === "chantier") {
    if (chSel) {
      const enRetard = Number(chSel.avancementReel) < Number(chSel.avancementPrevu) - 5;
      return (
        <div style={{ display: "grid", gap: 20 }}>
          {switcher}
          <button onClick={() => setChSel(null)} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Retour</button>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <Hazard />
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{chSel.nom}</h2>
                  <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{chSel.client} · {chSel.ville}{chSel.fin ? ` · Livraison prévue : ${new Date(chSel.fin).toLocaleDateString("fr-FR")}` : ""}</div>
                </div>
                <StatutBadge s={ST_CH[chSel.statut] ?? chSel.statut} />
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.steelSoft, marginBottom: 4 }}>
                  <span>Avancement global des travaux</span>
                  <b style={{ color: enRetard ? C.red : C.steel }}>{chSel.avancementReel} %</b>
                </div>
                <Progress pct={Number(chSel.avancementReel)} color={enRetard ? C.red : C.orange} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={ImageIcon}>Plans & photos du chantier</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {chMedias.map((m) => (
                <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
                  <img src={m.url} alt={m.nom} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "8px 10px", fontSize: 12, color: C.steel }}>{m.nom}</div>
                </div>
              ))}
              {chMedias.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun plan/photo partagé.</div>}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={FileText}>Devis &amp; factures</SectionTitle>
            <div style={{ display: "grid", gap: 8 }}>
              {chFactures.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{f.numero}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 13 }}>{fcfa(Number(f.ttc))}</b>
                    <StatutBadge s={f.statut} />
                  </div>
                </div>
              ))}
              {chFactures.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucune facture pour ce client.</div>}
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div style={{ display: "grid", gap: 20 }}>
        {switcher}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {chantiers.map((c) => (
            <Card key={c.id} style={{ cursor: "pointer" }}>
              <div onClick={() => openChantier(c)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{c.nom}</div>
                  <StatutBadge s={ST_CH[c.statut] ?? c.statut} />
                </div>
                <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 4 }}>{c.client} · {c.ville}</div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}><span>Avancement</span><b style={{ color: C.steel }}>{c.avancementReel} %</b></div>
                <Progress pct={Number(c.avancementReel)} />
                <div style={{ marginTop: 10, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir le suivi →</div>
              </div>
            </Card>
          ))}
          {chantiers.length === 0 && <div style={{ color: C.steelSoft }}>Aucun chantier.</div>}
        </div>
      </div>
    );
  }

  if (sel) {
    const lot = sel.lots_immo;
    const totalAppels = appels.reduce((s, a) => s + Number(a.montant), 0);
    const echeancierHtml = `<div class="brand"><span class="logo">TANK</span><h1>Échéancier — ${sel.acquereur}</h1></div><div class="bar"></div>
      <p class="muted">${lot?.programmes?.nom ?? ""} — Lot ${lot?.reference ?? ""} (${lot?.typologie ?? ""})</p>
      <table><thead><tr><th>Appel</th><th>Échéance</th><th class="right">Montant</th><th>Statut</th></tr></thead><tbody>
      ${appels.map((a) => `<tr><td>${a.libelle}</td><td>${a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td><td class="right">${fcfaP(Number(a.montant))}</td><td>${a.statut}</td></tr>`).join("")}
      </tbody></table><p class="right"><b>Total appels : ${fcfaP(totalAppels)}</b></p>`;

    return (
      <div style={{ display: "grid", gap: 16 }}>
        {switcher}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setSel(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Acquéreurs</button>
          <button onClick={() => printDocument(`Echeancier-${sel.acquereur}`, echeancierHtml)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Printer size={15} /> Échéancier PDF</button>
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Hazard />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: C.orangeSoft, borderRadius: 10, padding: 8 }}><Home size={20} color={C.orange} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: C.steel }}>{sel.acquereur}</div>
                <div style={{ color: C.steelSoft, fontSize: 13 }}>{lot?.programmes?.nom} — {lot?.programmes?.ville}</div>
              </div>
            </div>
            {lot && <div style={{ fontSize: 14, color: C.steel }}>Lot <b>{lot.reference}</b> · {lot.typologie} · {lot.surface ?? "—"} m² · {fcfa(Number(lot.prix))}</div>}
            {(() => {
              const prixLot = lot ? Number(lot.prix) : 0;
              const encaisse = appels.filter((a) => a.statut === "PAYE").reduce((s, a) => s + Number(a.montant), 0);
              const reste = Math.max(0, prixLot - encaisse);
              const pct = prixLot ? Math.round((encaisse / prixLot) * 100) : 0;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
                  <Kpi label="Prix du lot" value={fcfa(prixLot)} />
                  <Kpi label="Appelé (échéancier)" value={fcfa(totalAppels)} sub={`${appels.length} appel${appels.length > 1 ? "s" : ""}`} />
                  <Kpi label="Encaissé" value={`${pct} %`} color={C.green} pct={pct} pctColor={C.green} sub={fcfa(encaisse)} />
                  <Kpi label="Reste à payer" value={fcfa(reste)} color={C.orange} />
                </div>
              );
            })()}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 3fr) minmax(240px, 2fr)", gap: 20, alignItems: "start" }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 20, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>Mon logement — {lot?.reference}</div>
                <div style={{ fontSize: 12.5, color: C.steelSoft }}>{[lot?.typologie, lot?.bloc ? `Bloc ${lot.bloc}` : null, lot?.niveau, lot?.surface ? `${lot.surface} m²` : null].filter(Boolean).join(" · ")}</div>
              </div>
              <PlanTypo typologie={lot?.typologie} />
              <div style={{ fontSize: 12, color: C.steelSoft }}>Plan indicatif de votre {lot?.typologie ?? "logement"}. Une demande de modification (TMA) ? Contactez votre conseiller — chaque échange reste tracé.</div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Landmark}>Mon financement VEFA</SectionTitle>
            {(() => {
              const prochain = appels.find((a) => a.statut === "EMIS") ?? appels.find((a) => a.statut === "PREVU");
              return (
                <div style={{ display: "grid", gap: 10 }}>
                  {prochain ? (
                    <Banner tone={prochain.statut === "EMIS" ? "warn" : "info"}>
                      <b>Prochain appel :</b> {prochain.libelle} — <b>{fcfa(Number(prochain.montant))}</b>
                      {prochain.echeance ? ` (échéance ${new Date(prochain.echeance).toLocaleDateString("fr-FR")})` : ""}.
                      {prochain.statut === "EMIS" ? " Exigible — le jalon chantier a été constaté." : " À venir."}
                    </Banner>
                  ) : <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun appel en attente.</div>}
                  <button style={{ ...btnGhost, justifyContent: "center", color: C.orange, borderColor: C.orangeSoft }} title="Paiement mobile (à activer en production)">
                    <Smartphone size={15} /> Payer par MTN MoMo / Orange Money
                  </button>
                  <div style={{ fontSize: 11, color: C.steelSoft }}>Chaque versement suit le contrat de réservation (loi n°97/003) : vous payez l'avancement réel, jamais avant. Reçus dans vos documents.</div>
                </div>
              );
            })()}
          </Card>
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontFamily: FONTS.condensed, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>Échéancier des appels de fonds</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.concrete, color: C.steelSoft, textAlign: "left" }}><th style={{ padding: 12 }}>Appel</th><th style={{ padding: 12 }}>Échéance</th><th style={{ padding: 12 }}>Montant</th><th style={{ padding: 12 }}>Statut</th></tr></thead>
            <tbody>
              {appels.map((a) => {
                const [l, col] = STATUT[a.statut] ?? [a.statut, C.steelSoft];
                return (
                  <tr key={a.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: 12 }}>{a.libelle}</td>
                    <td style={{ padding: 12 }}>{a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={{ padding: 12, whiteSpace: "nowrap" }}>{fcfa(Number(a.montant))}</td>
                    <td style={{ padding: 12 }}><span style={{ color: col, fontWeight: 700, fontSize: 13 }}>{l}</span></td>
                  </tr>
                );
              })}
              {appels.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: C.steelSoft }}>Aucun appel de fonds.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Simulateur prixLot={lot ? Number(lot.prix) : 0} />

        {catalog.length > 0 && (
          <Card>
            <SectionTitle icon={Building2} action={<span style={{ fontSize: 12, color: C.steelSoft }}>{catalog.length} logement{catalog.length > 1 ? "s" : ""} disponible{catalog.length > 1 ? "s" : ""}</span>}>
              Catalogue {lot?.programmes?.nom ?? ""} — encore disponible
            </SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {catalog.map((c) => (
                <div key={c.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "grid", gap: 6, alignContent: "start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b style={{ fontFamily: FONTS.condensed, fontSize: 19, color: C.steel }}>{c.reference}</b>
                    <StatutBadge s="Disponible" />
                  </div>
                  <div style={{ fontSize: 12.5, color: C.steelSoft }}>{[c.typologie, c.surface ? `${c.surface} m²` : null, c.bloc ? `Bloc ${c.bloc}` : null].filter(Boolean).join(" · ")}</div>
                  <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, color: C.orange }}>{fcfa(Number(c.prix))}</div>
                  <div style={{ fontSize: 11.5, color: C.steelSoft }}>Apport 30 % : {fcfa(Math.round(Number(c.prix) * 0.3))}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>Contactez l'équipe commerciale pour poser une option — le lot est bloqué 72 h, le temps de signer le contrat de réservation.</div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {switcher}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {resas.map((r) => (
          <Card key={r.id} style={{ cursor: "pointer" }} >
            <div onClick={() => openResa(r)}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><UserCircle size={18} color={C.orange} /> {r.acquereur}</div>
              <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 6 }}>{r.lots_immo?.programmes?.nom} — Lot {r.lots_immo?.reference}</div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: C.steel }}>{r.lots_immo ? fcfa(Number(r.lots_immo.prix)) : ""}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir l'échéancier →</div>
            </div>
          </Card>
        ))}
        {resas.length === 0 && <div style={{ color: C.steelSoft }}>Aucune réservation.</div>}
      </div>
    </div>
  );
}

function Simulateur({ prixLot }: { prixLot: number }) {
  const [prix, setPrix] = useState(prixLot);
  const [apport, setApport] = useState(Math.round(prixLot * 0.2));
  const [taux, setTaux] = useState(8);
  const [mois, setMois] = useState(60);

  const finance = Math.max(0, prix - apport);
  const m = mensualite(finance, taux, mois);
  const total = m * mois;
  const cout = total - finance;
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans, width: "100%" };

  return (
    <Card>
      <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel, marginBottom: 12 }}>Simulateur de financement</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.steelSoft }}>Prix (FCFA)<input style={inp} type="number" value={prix} onChange={(e) => setPrix(Number(e.target.value))} /></label>
        <label style={{ fontSize: 12, color: C.steelSoft }}>Apport (FCFA)<input style={inp} type="number" value={apport} onChange={(e) => setApport(Number(e.target.value))} /></label>
        <label style={{ fontSize: 12, color: C.steelSoft }}>Taux annuel (%)<input style={inp} type="number" step="0.1" value={taux} onChange={(e) => setTaux(Number(e.target.value))} /></label>
        <label style={{ fontSize: 12, color: C.steelSoft }}>Durée (mois)<input style={inp} type="number" value={mois} onChange={(e) => setMois(Number(e.target.value))} /></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
        {[["Montant financé", fcfa(finance), C.steel], ["Mensualité", fcfa(m), C.orange], ["Coût du crédit", fcfa(cout), C.red], ["Total remboursé", fcfa(total), C.steel]].map(([l, v, col], i) => (
          <div key={i} style={{ background: C.concrete, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: C.steelSoft, textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, color: col as string }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.steelSoft, marginTop: 10 }}>Estimation indicative (amortissement constant). Ne vaut pas offre de prêt.</div>
    </Card>
  );
}
