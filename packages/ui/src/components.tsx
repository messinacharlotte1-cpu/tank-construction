import React from "react";
import { C, FONTS } from "./theme";

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

// Styles réutilisables extraits du prototype (miniLabel, boutons).
export const miniLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4,
};
export const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, background: C.orange, color: C.white,
  border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.sans,
};
export const btnGhost: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: C.steel,
  border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.sans,
};

// Titre de section : icône orange + libellé condensé + action optionnelle à droite (pattern maquette).
export const SectionTitle: React.FC<{ icon?: React.ElementType; children: React.ReactNode; action?: React.ReactNode }> = ({ icon: Icon, children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>
      {Icon && <Icon size={19} color={C.orange} />} {children}
    </div>
    {action}
  </div>
);

// Tuile KPI : petit label + grande valeur condensée + sous-texte / barre optionnels.
export const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; color?: string; pct?: number; pctColor?: string }> = ({ label, value, sub, color = C.steel, pct, pctColor }) => (
  <div>
    <div style={miniLabel}>{label}</div>
    <div style={{ fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 700, color }}>{value}</div>
    {typeof pct === "number" && <div style={{ marginTop: 4 }}><Progress pct={pct} color={pctColor ?? color} /></div>}
    {sub && <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 4 }}>{sub}</div>}
  </div>
);

// Bandeau d'information contextuel (info / succès / alerte), comme dans la maquette.
export const Banner: React.FC<{ tone?: "info" | "success" | "warn" | "danger"; icon?: React.ElementType; children: React.ReactNode }> = ({ tone = "info", icon: Icon, children }) => {
  const map: Record<string, [string, string]> = {
    info: [C.concrete, C.steelSoft], success: [C.greenSoft, C.green], warn: [C.amberSoft, C.amber], danger: [C.redSoft, C.red],
  };
  const [bg, fg] = map[tone];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: bg, border: `1px solid ${fg}`, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, color: C.steel }}>
      {Icon && <Icon size={18} color={fg} />}
      <span>{children}</span>
    </div>
  );
};

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
