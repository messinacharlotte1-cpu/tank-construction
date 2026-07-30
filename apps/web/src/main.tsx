import React from "react";
import ReactDOM from "react-dom/client";
import { ToastProvider } from "@tank/ui";
import App from "./App";

// Marqueur de build (aide au diagnostic déploiement).
console.info("Tank Construction — build", import.meta.env.VITE_SUPABASE_URL ? "avec Supabase" : "maquette (sans env)");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);
