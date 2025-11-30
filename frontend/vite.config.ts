import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const tailwindcss = await import("@tailwindcss/vite");

  return {
    plugins: [react(), tailwindcss.default()],
    server: {
      port: 3000,
      host: true,
      open: true,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 1000, // 1000KB (1MB)로 경고 임계값 상향 조정
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
          },
        },
      },
    },
    base:  "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/Components"),
        "@pages": path.resolve(__dirname, "src/Components/Pages"),
        "@images": path.resolve(__dirname, "src/Images"),
      },
    },
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});
