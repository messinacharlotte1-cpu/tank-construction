// Front v0 : la maquette UX validée client est embarquée telle quelle.
// Décomposition progressive en modules typés + branchement API (apps/api) = itérations suivantes.
// Ne pas "améliorer" l'UX sans ticket (cf. CLAUDE.md).
// @ts-expect-error — le prototype est en JSX non typé, importé via allowJs.
import TankConstruction from "./prototype/TankPrototype.jsx";

export default function App() {
  return <TankConstruction />;
}
