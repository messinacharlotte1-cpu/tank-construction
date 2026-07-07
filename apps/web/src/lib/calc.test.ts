import { describe, it, expect } from "vitest";
import { montantLigne, dqeTotals, retenueGarantie, situationNet, paieJour, puRegional, mensualite, cnps } from "./calc";

describe("montantLigne", () => {
  it("quantité × PU", () => expect(montantLigne({ unite: "m³", quantite: 120, prixUnitaire: 8500 })).toBe(1020000));
  it("pm jamais chiffré", () => expect(montantLigne({ unite: "pm", quantite: 5, prixUnitaire: 99999 })).toBe(0));
});

describe("dqeTotals (TVA 19,25 %)", () => {
  const lignes = [
    { unite: "m³", quantite: 120, prixUnitaire: 8500 }, // 1 020 000
    { unite: "m³", quantite: 45, prixUnitaire: 95000 }, // 4 275 000
    { unite: "ff", quantite: 1, prixUnitaire: 2500000 }, // 2 500 000
    { unite: "pm", quantite: 1, prixUnitaire: 999 }, // 0
  ];
  it("total HT somme des lignes (pm exclu)", () => {
    expect(dqeTotals(lignes, 0, 0.1925).totalHT).toBe(7795000);
  });
  it("remise avant TVA puis TTC", () => {
    const t = dqeTotals(lignes, 10, 0.1925);
    expect(t.remiseAmt).toBe(779500);
    expect(t.htNet).toBe(7015500);
    expect(t.tva).toBe(1350484); // round(7015500 * 0.1925)
    expect(t.ttc).toBe(8365984);
  });
});

describe("retenue garantie", () => {
  it("5 % sous-traitance", () => expect(retenueGarantie(15000000, 5)).toBe(750000));
});

describe("situationNet (retenue 10 %)", () => {
  it("net = HT - retenue", () => {
    const s = situationNet(74000000, 10);
    expect(s.retenue).toBe(7400000);
    expect(s.net).toBe(66600000);
  });
});

describe("paieJour", () => {
  it("P=1 DM=0,5 A=0", () => {
    expect(paieJour([
      { tarif: 5000, statut: "P" },
      { tarif: 5500, statut: "P" },
      { tarif: 5500, statut: "DM" },
      { tarif: 3500, statut: "A" },
    ])).toBe(13250); // 5000 + 5500 + 2750 + 0
  });
});

describe("puRegional", () => {
  it("Douala ×1.06", () => expect(puRegional(95000, 1.06)).toBe(100700));
});

describe("cnps", () => {
  it("brut 100k : sal 4,2% / emp 11,95%", () => {
    const c = cnps(100000, 4.2, 11.95);
    expect(c.retenueSal).toBe(4200);
    expect(c.chargeEmp).toBe(11950);
    expect(c.net).toBe(95800);
    expect(c.coutTotal).toBe(111950);
  });
});

describe("mensualite", () => {
  it("taux 0 = principal / mois", () => expect(mensualite(1200000, 0, 12)).toBe(100000));
  it("prêt 10M à 8% sur 60 mois", () => expect(mensualite(10000000, 8, 60)).toBe(202764));
});
