// Calculs financiers — fonctions pures, testées (CLAUDE.md : module financier = tests obligatoires).
// Montants = entiers FCFA. `pm` (pour mémoire) = jamais chiffré.

export type LigneCalc = { unite: string; quantite: number; prixUnitaire: number };

export function montantLigne(l: LigneCalc): number {
  if (l.unite === "pm") return 0;
  return Math.round(Number(l.quantite) * Number(l.prixUnitaire));
}

// Circuit DQE : sous-totaux → total HT → remise → TVA → TTC.
export function dqeTotals(lignes: LigneCalc[], remisePct: number, tvaRate: number) {
  const totalHT = lignes.reduce((s, l) => s + montantLigne(l), 0);
  const remiseAmt = Math.round((totalHT * remisePct) / 100);
  const htNet = totalHT - remiseAmt;
  const tva = Math.round(htNet * tvaRate);
  const ttc = htNet + tva;
  return { totalHT, remiseAmt, htNet, tva, ttc };
}

// Retenue de garantie (sous-traitance / situations).
export function retenueGarantie(montant: number, pct: number): number {
  return Math.round((Number(montant) * Number(pct)) / 100);
}

// Situation de travaux : net à payer après retenue.
export function situationNet(montantHT: number, retenuePct: number) {
  const retenue = retenueGarantie(montantHT, retenuePct);
  return { retenue, net: montantHT - retenue };
}

// Paie du jour : P=1, DM=0,5, A=0.
export const COEF_POINTAGE: Record<string, number> = { P: 1, DM: 0.5, A: 0 };
export function paieJour(pointages: { tarif: number; statut: string }[]): number {
  return pointages.reduce((s, p) => s + Math.round(Number(p.tarif) * (COEF_POINTAGE[p.statut] ?? 0)), 0);
}

// Prix unitaire régional (BPU base Yaoundé × coefficient).
export function puRegional(puBase: number, coef: number): number {
  return Math.round(Number(puBase) * Number(coef));
}
