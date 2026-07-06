import { useState } from "react";
import { Sun, CloudRain, Cloud, CloudSun } from "lucide-react";
import { C, FONTS, Card } from "@tank/ui";

// Prévisions statiques (API OpenWeather à brancher — P1). Impact planning indicatif.
const VILLES: Record<string, { j: string; t: number; p: number; ic: typeof Sun }[]> = {
  Yaoundé: [
    { j: "Lun", t: 28, p: 20, ic: CloudSun }, { j: "Mar", t: 27, p: 60, ic: CloudRain }, { j: "Mer", t: 26, p: 80, ic: CloudRain },
    { j: "Jeu", t: 29, p: 10, ic: Sun }, { j: "Ven", t: 28, p: 30, ic: Cloud },
  ],
  Douala: [
    { j: "Lun", t: 31, p: 70, ic: CloudRain }, { j: "Mar", t: 30, p: 85, ic: CloudRain }, { j: "Mer", t: 31, p: 40, ic: CloudSun },
    { j: "Jeu", t: 32, p: 20, ic: Sun }, { j: "Ven", t: 30, p: 55, ic: Cloud },
  ],
};

export default function MeteoLive() {
  const [ville, setVille] = useState("Yaoundé");
  const prev = VILLES[ville];
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const risque = prev.filter((d) => d.p >= 60);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.steelSoft }}>Ville</label>
        <select style={{ ...inp, marginTop: 6, width: 200 }} value={ville} onChange={(e) => setVille(e.target.value)}>{Object.keys(VILLES).map((v) => <option key={v}>{v}</option>)}</select>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 8 }}>Prévisions indicatives — API météo à brancher (P1).</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {prev.map((d) => (
          <Card key={d.j} style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: C.steel }}>{d.j}</div>
            <d.ic size={34} color={d.p >= 60 ? C.red : C.orange} style={{ margin: "10px auto" }} />
            <div style={{ fontFamily: FONTS.condensed, fontSize: 24, fontWeight: 700, color: C.steel }}>{d.t}°</div>
            <div style={{ fontSize: 12, color: d.p >= 60 ? C.red : C.steelSoft }}>pluie {d.p}%</div>
          </Card>
        ))}
      </div>
      {risque.length > 0 && (
        <Card style={{ background: C.amberSoft, borderColor: C.amber, color: "#8a6d00" }}>
          ⚠ Impact planning : {risque.map((d) => d.j).join(", ")} — pluie forte, risque d'arrêt gros œuvre (coulage béton, terrassement).
        </Card>
      )}
    </div>
  );
}
