import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
// import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: "/free-drive/",
    plugins: [viteTsconfigPaths()],
    server: {
      open: true,
      port: 3000,
    },
  };
});
