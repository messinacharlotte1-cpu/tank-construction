import { C, FONTS } from "@tank/ui";

// Plans indicatifs des logements par typologie (portés fidèlement du prototype validé).
// En production : remplacés par les fichiers de l'architecte (PDF/DWG convertis en SVG).
type Piece = { x: number; y: number; w: number; h: number; l: string };
const PLANS_TYPO: Record<string, { vb: string; pieces: Piece[] }> = {
  T1: { vb: "0 0 300 200", pieces: [
    { x: 10, y: 10, w: 180, h: 120, l: "SÉJOUR + KITCHENETTE" },
    { x: 190, y: 10, w: 100, h: 70, l: "CHAMBRE" },
    { x: 190, y: 80, w: 100, h: 50, l: "SDB" },
    { x: 10, y: 130, w: 280, h: 60, l: "TERRASSE / SÉCHOIR" }] },
  T2: { vb: "0 0 320 220", pieces: [
    { x: 10, y: 10, w: 170, h: 110, l: "SÉJOUR" },
    { x: 180, y: 10, w: 130, h: 70, l: "CHAMBRE 1" },
    { x: 180, y: 80, w: 130, h: 60, l: "CUISINE" },
    { x: 10, y: 120, w: 110, h: 90, l: "CHAMBRE 2" },
    { x: 120, y: 140, w: 80, h: 70, l: "SDB + WC" },
    { x: 200, y: 140, w: 110, h: 70, l: "BALCON" }] },
  "T2+": { vb: "0 0 340 230", pieces: [
    { x: 10, y: 10, w: 190, h: 110, l: "SÉJOUR / SALLE À MANGER" },
    { x: 200, y: 10, w: 130, h: 70, l: "CHAMBRE 1" },
    { x: 200, y: 80, w: 130, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 120, h: 100, l: "CUISINE ÉQUIPÉE" },
    { x: 130, y: 140, w: 90, h: 80, l: "SDB + WC" },
    { x: 220, y: 140, w: 110, h: 80, l: "VARANGUE" }] },
  T3: { vb: "0 0 360 240", pieces: [
    { x: 10, y: 10, w: 200, h: 110, l: "SÉJOUR / SALLE À MANGER" },
    { x: 210, y: 10, w: 140, h: 70, l: "CHAMBRE PARENTALE + SDB" },
    { x: 210, y: 80, w: 140, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 110, h: 110, l: "CHAMBRE 3" },
    { x: 120, y: 140, w: 110, h: 90, l: "CUISINE" },
    { x: 230, y: 140, w: 120, h: 90, l: "SDB + WC · BALCON" }] },
  T5: { vb: "0 0 380 260", pieces: [
    { x: 10, y: 10, w: 210, h: 110, l: "DOUBLE SÉJOUR" },
    { x: 220, y: 10, w: 150, h: 70, l: "SUITE PARENTALE" },
    { x: 220, y: 80, w: 150, h: 60, l: "CHAMBRE 2" },
    { x: 10, y: 120, w: 115, h: 130, l: "CHAMBRES 3 & 4" },
    { x: 125, y: 140, w: 115, h: 110, l: "CUISINE + CELLIER" },
    { x: 240, y: 140, w: 130, h: 110, l: "2 SDB · WC · VARANGUE" }] },
};

// Normalise une typologie libre (t3, "T3 ", T4…) vers une clé de plan connue ; défaut T3.
function planKey(typologie: string | null | undefined): string {
  const t = (typologie ?? "").toUpperCase().replace(/\s+/g, "");
  if (PLANS_TYPO[t]) return t;
  if (t === "T4") return "T3";
  if (t === "T6" || t === "T5+") return "T5";
  return "T3";
}

export default function PlanTypo({ typologie }: { typologie: string | null | undefined }) {
  const p = PLANS_TYPO[planKey(typologie)];
  return (
    <svg viewBox={p.vb} style={{ width: "100%", display: "block", background: "#FBFCFD", borderRadius: 8, border: `1px solid ${C.line}` }} xmlns="http://www.w3.org/2000/svg">
      {p.pieces.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={C.steel} strokeWidth={2.5} />
          <text x={r.x + 8} y={r.y + 20} style={{ fontFamily: FONTS.condensed, fontSize: 11, fill: C.steelSoft, fontWeight: 600, letterSpacing: 0.6 }}>{r.l}</text>
        </g>
      ))}
    </svg>
  );
}
