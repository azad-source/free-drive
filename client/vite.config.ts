import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
// import svgr from "vite-plugin-svgr";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      viteTsconfigPaths(),
      viteStaticCopy({
        targets: [
          { src: "src/assets/models/car/*", dest: "assets" },
          { src: "src/libs/*", dest: "libs" },
        ],
      }),
    ],
    server: {
      open: true,
      port: 3000,
    },
  };
});
