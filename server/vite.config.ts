import { defineConfig } from "vite";
import ts from "@rollup/plugin-typescript";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "server.ts", // Входная точка для серверного кода
      formats: ["cjs"], // Формат, используемый для серверного кода (CommonJS)
      fileName: "server",
    },
    rollupOptions: {
      plugins: [ts()],
    },
  },
});
