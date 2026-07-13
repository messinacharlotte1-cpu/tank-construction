import { useEffect, useState } from "react";
import {
  HardHat, LogOut, UserCircle, Home, ArrowLeft, Printer, Landmark, Smartphone,
  Building2, FileText, Image as ImageIcon, HelpCircle, Banknote, Copy, Check,
  User as UserIcon, Phone, MapPin, MessageSquare, Send, Paperclip,
} from "lucide-react";
import { C, FONTS, Card, Kpi, Hazard, Banner, SectionTitle, StatutBadge, Progress, btnGhost, fcfa } from "@tank/ui";
import { supabase } from "../lib/supabase";
import { printDocument, fcfaP } from "../lib/pdf";
import { mensualite } from "../lib/calc";
import PlanTypo from "./PlanTypo";

// ── Portail CLIENT (externe, hors espace de gestion) ──────────────────────────
// Deux profils, déterminés par les données réellement rattachées au compte :
//  • Maître d'ouvrage — client BTP d'un chantier (chantiers.userId) : suivi, médias, factures.
//  • Acquéreur — acheteur d'un lot en VEFA (reservations.userId) : logement, échéancier, financement.
// La RLS restreint déjà chaque requête aux lignes du client → aucune fuite inter-clients.

type Chantier = { id: string; nom: string; client: string; ville: string; statut: string; avancementReel: number; avancementPrevu: number; fin: string | null };
type Lot = { reference: string; typologie: string | null; surface: number | null; prix: number; bloc: string | null; niveau: string | null; programmeId: string; programmes: { nom: string; ville: string } | null };
type Resa = { id: string; acquereur: string; lots_immo: Lot | null };
type Appel = { id: string; libelle: string; montant: number; echeance: string | null; statut: string };
type Media = { id: string; nom: string; url: string };
type FactureRow = { id: string; numero: string; ttc: number; statut: string };

const ST_CH: Record<string, string> = { EN_PREPARATION: "En préparation", EN_COURS: "En cours", EN_RETARD: "En retard", SUSPENDU: "Suspendu", TERMINE: "Terminé" };
const STATUT_APPEL: Record<string, [string, string]> = { PREVU: ["Prévu", C.amber], EMIS: ["Émis", C.green], PAYE: ["Payé", C.steelSoft] };

export default function ClientPortal({ email }: { email?: string }) {
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [resas, setResas] = useState<Resa[]>([]);
  const [profil, setProfil] = useState<"chantier" | "acquereur">("acquereur");

  useEffect(() => {
    (async () => {
      const [c, r] = await Promise.all([
        supabase.from("chantiers").select("id,nom,client,ville,statut,avancementReel,avancementPrevu,fin"),
        supabase.from("reservations").select("id,acquereur,lots_immo(reference,typologie,surface,prix,bloc,niveau,programmeId,programmes(nom,ville))"),
      ]);
      const ch = (c.data as Chantier[]) ?? [];
      const rs = (r.data as unknown as Resa[]) ?? [];
      setChantiers(ch);
      setResas(rs);
      // Profil par défaut : celui pour lequel le client a des données (acquéreur prioritaire si les deux).
      setProfil(rs.length > 0 ? "acquereur" : ch.length > 0 ? "chantier" : "acquereur");
      setLoading(false);
    })();
  }, []);

  const initials = (email ?? "?").replace(/@.*/, "").split(/[.\-_]/).map((s) => s[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "?";
  const hasMO = chantiers.length > 0;
  const hasAcq = resas.length > 0;
  const both = hasMO && hasAcq;

  return (
    <div style={{ minHeight: "100vh", background: C.concrete, display: "flex", flexDirection: "column" }}>
      {/* En-tête portail */}
      <header style={{ background: C.steel, color: C.white }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", boxSizing: "border-box", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ background: C.orange, borderRadius: 10, padding: 8, display: "flex" }}><HardHat size={22} color={C.white} /></div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}>TANK<span style={{ color: C.orange }}>•</span>CONSTRUCTION</div>
            <div style={{ fontSize: 11, color: "#8FA0B2", marginTop: 3, letterSpacing: 0.5 }}>Espace client — suivi de votre projet</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.orange, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, color: C.white }}>{initials}</div>
            <div style={{ fontSize: 12, color: "#B7C3CF", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
            <button onClick={() => supabase.auth.signOut()} title="Se déconnecter" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.steelSoft}`, color: "#B7C3CF", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 12, fontFamily: FONTS.sans }}>
              <LogOut size={14} /> Quitter
            </button>
          </div>
        </div>
        <Hazard />
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", width: "100%", boxSizing: "border-box", padding: 24, display: "grid", gap: 20, flex: 1 }}>
        {/* Sélecteur de profil — visible seulement si le client a les deux casquettes */}
        {both && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 16px", fontSize: 13 }}>
            <UserCircle size={18} color={C.orange} />
            <span style={{ flex: 1, minWidth: 200, color: C.steelSoft }}>Vous avez deux espaces. Choisissez votre profil :</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setProfil("chantier")} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: profil === "chantier" ? C.orange : "transparent", color: profil === "chantier" ? C.white : C.steel, borderColor: profil === "chantier" ? C.orange : C.line }}>Maître d'ouvrage</button>
              <button onClick={() => setProfil("acquereur")} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, background: profil === "acquereur" ? C.orange : "transparent", color: profil === "acquereur" ? C.white : C.steel, borderColor: profil === "acquereur" ? C.orange : C.line }}>Acquéreur</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: C.steelSoft }}>Chargement…</div>
        ) : !hasMO && !hasAcq ? (
          <Card><div style={{ display: "flex", alignItems: "center", gap: 10, color: C.steelSoft, fontSize: 14 }}><HelpCircle size={18} /> Aucun projet n'est encore rattaché à votre compte. Contactez votre conseiller Tank Construction.</div></Card>
        ) : profil === "chantier" ? (
          <EspaceMaitreOuvrage chantiers={chantiers} />
        ) : (
          <EspaceAcquereur resas={resas} />
        )}

        {/* Niveau compte — visible quel que soit le profil */}
        {!loading && (hasMO || hasAcq) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
            <MesCoordonnees email={email} />
            <Echanges />
          </div>
        )}

        <div style={{ fontSize: 11, color: C.steelSoft, textAlign: "center" }}>Portail en lecture seule pour vos projets. Vos coordonnées et vos messages restent modifiables. © Tank Construction SARL — Cameroun.</div>
      </main>
    </div>
  );
}

// ── Espace Maître d'ouvrage ─────────────────────────────────────────────────
function EspaceMaitreOuvrage({ chantiers }: { chantiers: Chantier[] }) {
  // Auto-ouverture si un seul chantier (cas courant).
  const [sel, setSel] = useState<Chantier | null>(chantiers.length === 1 ? chantiers[0] : null);
  const [medias, setMedias] = useState<Media[]>([]);
  const [factures, setFactures] = useState<FactureRow[]>([]);

  useEffect(() => {
    if (!sel) { setMedias([]); setFactures([]); return; }
    (async () => {
      const [m, f] = await Promise.all([
        supabase.from("medias").select("id,nom,url").eq("chantier", sel.nom).order("createdAt", { ascending: false }),
        supabase.from("factures").select("id,numero,ttc,statut").eq("client", sel.client).order("numero", { ascending: false }),
      ]);
      setMedias((m.data as Media[]) ?? []);
      setFactures((f.data as FactureRow[]) ?? []);
    })();
  }, [sel]);

  if (!sel) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {chantiers.map((c) => (
          <Card key={c.id} style={{ cursor: "pointer" }}>
            <div onClick={() => setSel(c)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{c.nom}</div>
                <StatutBadge s={ST_CH[c.statut] ?? c.statut} />
              </div>
              <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 4 }}>{c.ville}</div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.steelSoft, marginBottom: 4 }}><span>Avancement</span><b style={{ color: C.steel }}>{c.avancementReel} %</b></div>
              <Progress pct={Number(c.avancementReel)} />
              <div style={{ marginTop: 10, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir le suivi →</div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const enRetard = Number(sel.avancementReel) < Number(sel.avancementPrevu) - 5;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {chantiers.length > 1 && (
        <button onClick={() => setSel(null)} style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Mes chantiers</button>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: C.steel }}>{sel.nom}</h2>
              <div style={{ fontSize: 13, color: C.steelSoft, marginTop: 4 }}>{sel.ville}{sel.fin ? ` · Livraison prévue : ${new Date(sel.fin).toLocaleDateString("fr-FR")}` : ""}</div>
            </div>
            <StatutBadge s={ST_CH[sel.statut] ?? sel.statut} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
            <Kpi label="Avancement réel" value={`${sel.avancementReel} %`} color={enRetard ? C.red : C.steel} pct={Number(sel.avancementReel)} pctColor={enRetard ? C.red : C.orange} />
            <Kpi label="Avancement prévu" value={`${sel.avancementPrevu} %`} sub={enRetard ? "Retard constaté" : "Dans les temps"} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={ImageIcon}>Plans &amp; photos du chantier</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {medias.map((m) => (
            <div key={m.id} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
              <img src={m.url} alt={m.nom} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "8px 10px", fontSize: 12, color: C.steel }}>{m.nom}</div>
            </div>
          ))}
          {medias.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun plan/photo partagé pour l'instant.</div>}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={FileText}>Mes factures</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {factures.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{f.numero}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 13 }}>{fcfa(Number(f.ttc))}</b>
                <StatutBadge s={f.statut} />
              </div>
            </div>
          ))}
          {factures.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucune facture émise à votre nom.</div>}
        </div>
      </Card>
    </div>
  );
}

// ── Espace Acquéreur ────────────────────────────────────────────────────────
function EspaceAcquereur({ resas }: { resas: Resa[] }) {
  const [sel, setSel] = useState<Resa | null>(resas.length === 1 ? resas[0] : null);
  const [appels, setAppels] = useState<Appel[]>([]);
  const [catalog, setCatalog] = useState<Lot[]>([]);

  useEffect(() => {
    if (!sel) { setAppels([]); setCatalog([]); return; }
    (async () => {
      const { data } = await supabase.from("appels_de_fonds").select("id,libelle,montant,echeance,statut").eq("reservationId", sel.id).order("echeance");
      setAppels((data as Appel[]) ?? []);
      // Catalogue : autres lots disponibles du même programme (RLS commercial requise ; sinon vide).
      if (sel.lots_immo?.programmeId) {
        const { data: c } = await supabase.from("lots_immo").select("reference,typologie,surface,prix,bloc,niveau,programmeId,programmes(nom,ville)").eq("programmeId", sel.lots_immo.programmeId).eq("statut", "DISPONIBLE").order("reference");
        setCatalog((c as unknown as Lot[]) ?? []);
      } else setCatalog([]);
    })();
  }, [sel]);

  if (!sel) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {resas.map((r) => (
          <Card key={r.id} style={{ cursor: "pointer" }}>
            <div onClick={() => setSel(r)}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.steel, display: "flex", alignItems: "center", gap: 8 }}><Home size={18} color={C.orange} /> {r.lots_immo?.programmes?.nom}</div>
              <div style={{ color: C.steelSoft, fontSize: 13, marginTop: 6 }}>Lot {r.lots_immo?.reference} · {r.lots_immo?.typologie}</div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: C.steel }}>{r.lots_immo ? fcfa(Number(r.lots_immo.prix)) : ""}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.orange, fontWeight: 600 }}>Voir l'échéancier →</div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const lot = sel.lots_immo;
  const totalAppels = appels.reduce((s, a) => s + Number(a.montant), 0);
  const prixLot = lot ? Number(lot.prix) : 0;
  const encaisse = appels.filter((a) => a.statut === "PAYE").reduce((s, a) => s + Number(a.montant), 0);
  const reste = Math.max(0, prixLot - encaisse);
  const pct = prixLot ? Math.round((encaisse / prixLot) * 100) : 0;
  const echeancierHtml = `<div class="brand"><span class="logo">TANK</span><h1>Échéancier — ${sel.acquereur}</h1></div><div class="bar"></div>
    <p class="muted">${lot?.programmes?.nom ?? ""} — Lot ${lot?.reference ?? ""} (${lot?.typologie ?? ""})</p>
    <table><thead><tr><th>Appel</th><th>Échéance</th><th class="right">Montant</th><th>Statut</th></tr></thead><tbody>
    ${appels.map((a) => `<tr><td>${a.libelle}</td><td>${a.echeance ? new Date(a.echeance).toLocaleDateString("fr-FR") : "—"}</td><td class="right">${fcfaP(Number(a.montant))}</td><td>${a.statut}</td></tr>`).join("")}
    </tbody></table><p class="right"><b>Total appels : ${fcfaP(totalAppels)}</b></p>`;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {resas.length > 1 ? (
          <button onClick={() => setSel(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.steel }}><ArrowLeft size={15} /> Mes logements</button>
        ) : <span />}
        <button onClick={() => printDocument(`Echeancier-${sel.acquereur}`, echeancierHtml)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.steelMid, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}><Printer size={15} /> Échéancier PDF</button>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Hazard />
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ background: C.orangeSoft, borderRadius: 10, padding: 8 }}><Home size={20} color={C.orange} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.steel }}>{lot?.programmes?.nom}</div>
              <div style={{ color: C.steelSoft, fontSize: 13 }}>{lot?.programmes?.ville}</div>
            </div>
          </div>
          {lot && <div style={{ fontSize: 14, color: C.steel }}>Lot <b>{lot.reference}</b> · {lot.typologie} · {lot.surface ?? "—"} m² · {fcfa(prixLot)}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
            <Kpi label="Prix du lot" value={fcfa(prixLot)} />
            <Kpi label="Appelé (échéancier)" value={fcfa(totalAppels)} sub={`${appels.length} appel${appels.length > 1 ? "s" : ""}`} />
            <Kpi label="Encaissé" value={`${pct} %`} color={C.green} pct={pct} pctColor={C.green} sub={fcfa(encaisse)} />
            <Kpi label="Reste à payer" value={fcfa(reste)} color={C.orange} />
          </div>
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
                <Virement reference={`VEFA-${lot?.reference ?? ""}`} />
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
              const [l, col] = STATUT_APPEL[a.statut] ?? [a.statut, C.steelSoft];
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

      <Simulateur prixLot={prixLot} />

      {catalog.length > 0 && (
        <Card>
          <SectionTitle icon={Building2} action={<span style={{ fontSize: 12, color: C.steelSoft }}>{catalog.length} logement{catalog.length > 1 ? "s" : ""} disponible{catalog.length > 1 ? "s" : ""}</span>}>
            Catalogue {lot?.programmes?.nom ?? ""} — encore disponible
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {catalog.map((c, i) => (
              <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "grid", gap: 6, alignContent: "start" }}>
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

// ── Virement bancaire (coordonnées indicatives, référence = lot) ─────────────
function Virement({ reference }: { reference: string }) {
  const [copied, setCopied] = useState<string>("");
  const rib = "CM21 10005 00012 34567890123 45";
  const copy = (label: string, val: string) => { navigator.clipboard?.writeText(val); setCopied(label); setTimeout(() => setCopied(""), 1500); };
  const Row = ({ label, val, k }: { label: string; val: string; k?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 12.5 }}>
      <span style={{ color: C.steelSoft }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <b style={{ color: C.steel, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</b>
        {k && <button onClick={() => copy(label, val)} title="Copier" style={{ background: "none", border: "none", cursor: "pointer", color: copied === label ? C.green : C.steelSoft, display: "flex", padding: 2, flexShrink: 0 }}>{copied === label ? <Check size={14} /> : <Copy size={14} />}</button>}
      </span>
    </div>
  );
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, display: "grid", gap: 7, background: C.concrete }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5 }}><Banknote size={15} color={C.orange} /> Virement bancaire</div>
      <Row label="Bénéficiaire" val="Tank Construction SARL" />
      <Row label="Banque" val="Afriland First Bank" />
      <Row label="RIB / IBAN" val={rib} k />
      <Row label="Référence" val={reference} k />
      <div style={{ fontSize: 11, color: C.steelSoft }}>Indiquez la référence en libellé du virement — elle permet le rapprochement automatique. Coordonnées indicatives : confirmez auprès de votre conseiller avant tout virement.</div>
    </div>
  );
}

// ── Mes coordonnées (données personnelles, éditables via RPC) ────────────────
function MesCoordonnees({ email }: { email?: string }) {
  const [nom, setNom] = useState(""); const [tel, setTel] = useState(""); const [adr, setAdr] = useState("");
  const [edit, setEdit] = useState(false); const [busy, setBusy] = useState(false); const [ok, setOk] = useState(false);
  async function load() {
    const { data } = await supabase.from("users").select("nom,telephone,adresse").limit(1).maybeSingle();
    if (data) { setNom((data as { nom?: string }).nom ?? ""); setTel((data as { telephone?: string }).telephone ?? ""); setAdr((data as { adresse?: string }).adresse ?? ""); }
  }
  useEffect(() => { void load(); }, []);
  async function save() {
    setBusy(true); setOk(false);
    const { error } = await supabase.rpc("update_my_profile", { p_nom: nom, p_telephone: tel, p_adresse: adr });
    setBusy(false);
    if (!error) { setOk(true); setEdit(false); setTimeout(() => setOk(false), 2500); }
  }
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans, width: "100%", boxSizing: "border-box", marginTop: 4 };
  const Line = ({ icon: Ic, label, val }: { icon: React.ElementType; label: string; val: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
      <Ic size={16} color={C.steelSoft} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 14, color: C.steel, overflow: "hidden", textOverflow: "ellipsis" }}>{val || <span style={{ color: C.steelSoft }}>—</span>}</div>
      </div>
    </div>
  );
  return (
    <Card>
      <SectionTitle icon={UserIcon} action={!edit ? <button onClick={() => setEdit(true)} style={{ ...btnGhost, padding: "5px 11px", fontSize: 12 }}>Modifier</button> : undefined}>Mes coordonnées</SectionTitle>
      {ok && <Banner tone="success">Coordonnées mises à jour.</Banner>}
      {!edit ? (
        <div style={{ display: "grid" }}>
          <Line icon={UserIcon} label="Nom" val={nom} />
          <Line icon={MessageSquare} label="Email (identifiant)" val={email ?? ""} />
          <Line icon={Phone} label="Téléphone" val={tel} />
          <Line icon={MapPin} label="Adresse" val={adr} />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
          <label style={{ fontSize: 12, color: C.steelSoft }}>Nom<input style={inp} value={nom} onChange={(e) => setNom(e.target.value)} /></label>
          <label style={{ fontSize: 12, color: C.steelSoft }}>Téléphone<input style={inp} value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+237 6 XX XX XX XX" /></label>
          <label style={{ fontSize: 12, color: C.steelSoft }}>Adresse<input style={inp} value={adr} onChange={(e) => setAdr(e.target.value)} placeholder="Quartier, ville" /></label>
          <div style={{ fontSize: 11, color: C.steelSoft }}>L'email d'identification n'est pas modifiable ici — contactez votre conseiller.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button onClick={save} disabled={busy} style={{ background: C.orange, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", cursor: busy ? "wait" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: FONTS.sans }}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            <button onClick={() => { setEdit(false); void load(); }} style={{ ...btnGhost, padding: "8px 16px", fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Échanges avec l'équipe commerciale (fil + pièce jointe) ──────────────────
type Msg = { id: string; auteur: string; nom: string; sujet: string | null; corps: string; pieceUrl: string | null; pieceNom: string | null; createdAt: string };

function Echanges() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [corps, setCorps] = useState(""); const [sujet, setSujet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [uid, setUid] = useState("");
  async function load() {
    const { data } = await supabase.from("client_messages").select("id,auteur,nom,sujet,corps,pieceUrl,pieceNom,createdAt").order("createdAt");
    setMsgs((data as Msg[]) ?? []);
  }
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? "")); void load(); }, []);
  async function send() {
    if (!corps.trim()) return;
    setBusy(true); setErr(null);
    let pieceUrl: string | null = null, pieceNom: string | null = null;
    if (file && uid) {
      const path = `${uid}/${crypto.randomUUID()}-${file.name}`;
      const up = await supabase.storage.from("portail-client").upload(path, file);
      if (up.error) { setBusy(false); setErr("Pièce jointe : " + up.error.message); return; }
      pieceUrl = supabase.storage.from("portail-client").getPublicUrl(path).data.publicUrl; pieceNom = file.name;
    }
    const { error } = await supabase.rpc("send_client_message", { p_sujet: sujet || null, p_corps: corps, p_piece_url: pieceUrl, p_piece_nom: pieceNom });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setCorps(""); setSujet(""); setFile(null); void load();
  }
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans, width: "100%", boxSizing: "border-box" };

  return (
    <Card>
      <SectionTitle icon={MessageSquare}>Échanger avec mon conseiller</SectionTitle>
      <div style={{ display: "grid", gap: 10, maxHeight: 320, overflow: "auto", paddingRight: 4, marginBottom: 12 }}>
        {msgs.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun échange pour l'instant. Posez votre question ou partagez un document ci-dessous — l'équipe commerciale vous répondra ici.</div>}
        {msgs.map((m) => {
          const mine = m.auteur === "client";
          return (
            <div key={m.id} style={{ justifySelf: mine ? "end" : "start", maxWidth: "88%", background: mine ? C.orangeSoft : C.concrete, border: `1px solid ${mine ? C.orangeSoft : C.line}`, borderRadius: 10, padding: "9px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, color: C.steelSoft, marginBottom: 3 }}>
                <b style={{ color: mine ? C.orange : C.steel }}>{mine ? "Vous" : m.nom}</b>
                <span>{new Date(m.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {m.sujet && <div style={{ fontSize: 12, fontWeight: 700, color: C.steel }}>{m.sujet}</div>}
              <div style={{ fontSize: 13.5, color: C.steel, whiteSpace: "pre-wrap" }}>{m.corps}</div>
              {m.pieceUrl && <a href={m.pieceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 12, color: C.orange, fontWeight: 600, textDecoration: "none" }}><Paperclip size={13} /> {m.pieceNom ?? "Pièce jointe"}</a>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        <input style={inp} value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Sujet (optionnel)" />
        <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={corps} onChange={(e) => setCorps(e.target.value)} placeholder="Votre message à l'équipe commerciale…" />
        {err && <div style={{ fontSize: 12, color: C.red }}>{err}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ ...btnGhost, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
            <Paperclip size={14} /> {file ? file.name.slice(0, 22) : "Joindre un document"}
            <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: C.steelSoft, cursor: "pointer", fontSize: 12 }}>retirer</button>}
          <button onClick={send} disabled={busy || !corps.trim()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: corps.trim() ? C.orange : C.line, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", cursor: busy ? "wait" : corps.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: FONTS.sans }}>
            <Send size={14} /> {busy ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </Card>
  );
}
