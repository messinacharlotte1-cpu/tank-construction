// Design system Tank Construction — source unique des couleurs (objet `C` du prototype).
// Acier #1B2530 / orange sécurité #F26B1D. Polices Barlow / Barlow Condensed.
export const C = {
  steel: "#1B2530",
  steelMid: "#2C3A49",
  steelSoft: "#46586B",
  concrete: "#F0F2F4",
  white: "#FFFFFF",
  orange: "#F26B1D",
  orangeSoft: "#FDE8DB",
  green: "#1F9D55",
  greenSoft: "#E3F5EA",
  red: "#D64541",
  redSoft: "#FBE7E6",
  amber: "#E9A100",
  amberSoft: "#FCF3DB",
  line: "#DDE3E9",
} as const;

export const FONTS = {
  sans: "'Barlow', system-ui, sans-serif",
  condensed: "'Barlow Condensed', sans-serif",
} as const;

// TVA Cameroun 19,25 % — VALEUR PAR DÉFAUT UNIQUEMENT.
// En production : taux paramétrable et figé à l'émission (snapshot). Ne jamais recalculer un document émis.
export const TVA_DEFAULT = 0.1925;

// Formatage montant : entiers FCFA, locale fr-FR. Helper unique (cf. CLAUDE.md règle 1).
export const fcfa = (n: number): string =>
  n.toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
