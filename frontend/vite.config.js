// ================================================================
// FILE: frontend/vite.config.js
// TUGAS: Konfigurasi Vite dev server + proxy ke backend
//
// KENAPA PROXY?
//   Frontend (port 5173) tidak bisa langsung request ke
//   Backend (port 8000) karena CORS browser policy.
//   Solusi: semua request ke /api/* diteruskan ke localhost:8000
//   Jadi di frontend: axios.get("/api/cards")
//   Sebenarnya request ke: http://localhost:8000/cards
// ================================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
 
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:       "http://localhost:8000",
        changeOrigin: true,
        rewrite:      (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
 