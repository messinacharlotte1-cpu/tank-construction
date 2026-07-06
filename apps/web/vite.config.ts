import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA offline terrain : app installable + cache du shell (consultation hors-ligne).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Tank Construction",
        short_name: "Tank",
        description: "Gestion BTP & promotion immobilière",
        theme_color: "#1B2530",
        background_color: "#F0F2F4",
        display: "standalone",
        lang: "fr",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: { port: 5173 },
});
