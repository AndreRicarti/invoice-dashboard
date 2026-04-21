import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite certificado auto-assinado do backend em localhost
    proxy: {
      "/api": {
        target: "http://192.168.3.67:7086",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
