import React, { useEffect } from "react";
import { C, FONTS } from "./theme";

// Keyframes globales (injectées une fois) : shimmer skeleton, respect reduced-motion.
if (typeof document !== "undefined" && !document.getElementById("tank-ui-keyframes")) {
  const s = document.createElement("style");
  s.id = "tank-ui-keyframes";
  s.textContent =
    "@keyframes tankshimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}" +
    "@media (prefers-reduced-motion: reduce){[data-tankskel]{animation:none!important}}";
  document.head.appendChild(s);
}

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

// Champ de formulaire : label persistant au-dessus (fin du placeholder-comme-label).
export const fieldInput: React.CSSProperties = {
  padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14,
  fontFamily: FONTS.sans, width: "100%", boxSizing: "border-box", background: C.white, color: C.steel,
};
export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label style={{ display: "grid", gap: 5 }}>
    <span style={miniLabel}>{label}</span>
    {children}
    {hint && <span style={{ fontSize: 11.5, color: C.steelSoft }}>{hint}</span>}
  </label>
);

// Fenêtre modale brandée (remplace window.prompt/confirm) : titre, corps, footer d'actions.
// Ferme via ×, clic backdrop, ou Échap. role/aria pour l'accessibilité.
export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: number }> = ({ title, onClose, children, footer, width = 440 }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(27,37,48,.55)", display: "grid", placeItems: "center", padding: 16, zIndex: 1000 }}>
      <div style={{ background: C.white, borderRadius: 14, width: "100%", maxWidth: width, boxShadow: "0 24px 64px rgba(27,37,48,.32)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.steel }}>{title}</div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: C.steelSoft, fontSize: 24, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: 18, overflowY: "auto", display: "grid", gap: 12 }}>{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 18px", borderTop: `1px solid ${C.line}` }}>{footer}</div>}
      </div>
    </div>
  );
};

// État vide = feature : icône + titre + contexte + action primaire (jamais un cul-de-sac gris).
export const EmptyState: React.FC<{ icon?: React.ElementType; title: string; hint?: string; action?: React.ReactNode }> = ({ icon: Icon, title, hint, action }) => (
  <div style={{ display: "grid", justifyItems: "center", gap: 12, textAlign: "center", padding: "44px 20px", border: `1px dashed ${C.line}`, borderRadius: 14, background: C.white }}>
    {Icon && <div style={{ background: C.orangeSoft, borderRadius: 14, padding: 14, display: "grid", placeItems: "center" }}><Icon size={26} color={C.orange} /></div>}
    <div style={{ fontFamily: FONTS.condensed, fontSize: 19, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: C.steel }}>{title}</div>
    {hint && <div style={{ fontSize: 13.5, color: C.steelSoft, maxWidth: 400 }}>{hint}</div>}
    {action}
  </div>
);

// Squelette de chargement (shimmer) : pas de saut de layout, perçu soigné.
export const Skeleton: React.FC<{ h?: number; w?: number | string; r?: number; style?: React.CSSProperties }> = ({ h = 14, w = "100%", r = 6, style }) => (
  <div data-tankskel style={{ height: h, width: w, borderRadius: r, background: `linear-gradient(90deg, ${C.concrete} 25%, #E7ECF1 37%, ${C.concrete} 63%)`, backgroundSize: "400% 100%", animation: "tankshimmer 1.4s ease infinite", ...style }} />
);
export const SkeletonCard: React.FC = () => (
  <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20, display: "grid", gap: 10 }}>
    <Skeleton h={18} w="55%" />
    <Skeleton h={12} w="82%" />
    <Skeleton h={12} w="40%" />
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
