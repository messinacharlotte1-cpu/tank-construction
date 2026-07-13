import { useState } from "react";
import { Sun, CloudRain, Cloud, CloudSun, AlertTriangle } from "lucide-react";
import { C, FONTS, Card, SectionTitle } from "@tank/ui";

// Prévisions statiques (API OpenWeather à brancher — P1). Impact planning indicatif.
type Jour = { j: string; desc: string; tmax: number; tmin: number; p: number; ic: typeof Sun; impact: string | null };
const VILLES: Record<string, Jour[]> = {
  Yaoundé: [
    { j: "Lun", desc: "Éclaircies", tmax: 28, tmin: 19, p: 20, ic: CloudSun, impact: "Fenêtre favorable pour le coulage R+3" },
    { j: "Mar", desc: "Pluies éparses", tmax: 27, tmin: 20, p: 60, ic: CloudRain, impact: "Coulage dalle déconseillé après 13 h" },
    { j: "Mer", desc: "Orages", tmax: 26, tmin: 20, p: 80, ic: CloudRain, impact: "Gros œuvre suspendu — repli intérieur / second œuvre" },
    { j: "Jeu", desc: "Ensoleillé", tmax: 29, tmin: 19, p: 10, ic: Sun, impact: null },
    { j: "Ven", desc: "Couvert", tmax: 28, tmin: 20, p: 30, ic: Cloud, impact: null },
  ],
  Douala: [
    { j: "Lun", desc: "Averses", tmax: 31, tmin: 23, p: 70, ic: CloudRain, impact: "Terrassement à reporter" },
    { j: "Mar", desc: "Orages", tmax: 30, tmin: 23, p: 85, ic: CloudRain, impact: "Bétonnage déconseillé toute la journée" },
    { j: "Mer", desc: "Éclaircies", tmax: 31, tmin: 24, p: 40, ic: CloudSun, impact: null },
    { j: "Jeu", desc: "Ensoleillé", tmax: 32, tmin: 24, p: 20, ic: Sun, impact: "Fenêtre favorable coulage" },
    { j: "Ven", desc: "Couvert", tmax: 30, tmin: 23, p: 55, ic: Cloud, impact: null },
  ],
};

export default function MeteoLive() {
  const [ville, setVille] = useState("Yaoundé");
  const prev = VILLES[ville];
  const inp: React.CSSProperties = { padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, fontFamily: FONTS.sans };
  const impacts = prev.filter((d) => d.impact);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={CloudSun} action={
        <select style={inp} value={ville} onChange={(e) => setVille(e.target.value)}>{Object.keys(VILLES).map((v) => <option key={v}>{v}</option>)}</select>
      }>Météo chantier — {ville} (saison des pluies)</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {prev.map((d, i) => (
          <Card key={d.j} style={{ padding: 16, textAlign: "center", borderTop: i === 0 ? `3px solid ${C.orange}` : undefined }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.steelSoft, textTransform: "uppercase" }}>{d.j}</div>
            <d.ic size={34} color={d.p >= 60 ? "#3B82C4" : d.ic === Sun ? C.amber : C.steelSoft} style={{ margin: "8px 0" }} />
            <div style={{ fontSize: 13, color: C.steel }}>{d.desc}</div>
            <div style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700, color: C.steel }}>{d.tmax}° <span style={{ fontSize: 14, color: C.steelSoft }}>/ {d.tmin}°</span></div>
            <div style={{ fontSize: 12, color: d.p > 60 ? C.red : C.steelSoft }}>Pluie : {d.p} %</div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle icon={AlertTriangle}>Impact planning</SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {impacts.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: d.p > 60 ? C.redSoft : C.greenSoft, borderRadius: 8, fontSize: 14 }}>
              {d.p > 60 ? <CloudRain size={16} color={C.red} /> : <Sun size={16} color={C.green} />}
              <b style={{ color: C.steel }}>{d.j} :</b> <span style={{ color: C.steel }}>{d.impact}</span>
            </div>
          ))}
          {impacts.length === 0 && <div style={{ fontSize: 13, color: C.steelSoft }}>Aucun impact planning notable.</div>}
        </div>
        <div style={{ fontSize: 12, color: C.steelSoft, marginTop: 10 }}>
          Prévisions indicatives (API OpenWeather à brancher — P1). Les intempéries sont journalisées dans le rapport de chantier — justificatif contractuel en cas de retard imputable à la météo.
        </div>
      </Card>
    </div>
  );
}
