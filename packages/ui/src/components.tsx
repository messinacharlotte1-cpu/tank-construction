import React from "react";
import { C } from "./theme";

// Primitives extraites fidèlement du prototype validé client.
// Aucune modification visuelle sans ticket (cf. CLAUDE.md).

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: C.white,
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

const STATUT_MAP: Record<string, [string, string]> = {
  "En cours": [C.greenSoft, C.green],
  "En retard": [C.redSoft, C.red],
  "Terminé": [C.concrete, C.steelSoft],
  "En préparation": [C.amberSoft, C.amber],
  "Suspendu": [C.amberSoft, C.amber],
  "Payée": [C.greenSoft, C.green],
  "Impayée": [C.redSoft, C.red],
  "Envoyée": [C.amberSoft, C.amber],
  "Envoyé": [C.amberSoft, C.amber],
  "Accepté": [C.greenSoft, C.green],
  "Refusé": [C.redSoft, C.red],
  "Brouillon": [C.concrete, C.steelSoft],
  "Vendu": [C.greenSoft, C.green],
  "Réservé": [C.amberSoft, C.amber],
  "Disponible": [C.concrete, C.steelSoft],
  "Soldé": [C.concrete, C.steelSoft],
};

export const StatutBadge: React.FC<{ s: string }> = ({ s }) => {
  const [bg, fg] = STATUT_MAP[s] ?? [C.concrete, C.steelSoft];
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      {s}
    </span>
  );
};

export const Hazard: React.FC = () => (
  <div
    style={{
      height: 6,
      borderRadius: 3,
      background: `repeating-linear-gradient(45deg, ${C.orange} 0 10px, ${C.steel} 10px 20px)`,
    }}
  />
);

export const Progress: React.FC<{ pct: number; color?: string }> = ({ pct, color = C.orange }) => (
  <div style={{ background: C.concrete, borderRadius: 4, height: 8, overflow: "hidden" }}>
    <div
      style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s" }}
    />
  </div>
);

export const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    aria-pressed={on}
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 2,
      background: on ? C.orange : C.line,
      transition: "background .2s",
    }}
  >
    <span
      style={{
        display: "block",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: C.white,
        transform: on ? "translateX(20px)" : "translateX(0)",
        transition: "transform .2s",
      }}
    />
  </button>
);
