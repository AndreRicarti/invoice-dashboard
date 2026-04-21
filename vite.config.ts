import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite certificado auto-assinado do backend em localhost
    proxy: {
      "/api": {
        target: "https://localhost:7086",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
