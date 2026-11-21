import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the static build works on any host (Vercel, Netlify,
// GitHub Pages, a subpath — judges open it with no server config).
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    // Dev-only proxy so live Textile FX previews avoid browser CORS during
    // local development. In production the app falls back to cached rates if
    // a direct call is blocked (see src/lib/textile.ts).
    proxy: {
      "/textile": {
        target: "https://api.textilecredit.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/textile/, ""),
      },
    },
  },
});
