import * as esbuild from "esbuild";
import * as ne from "esbuild-node-externals";
// const esbuild = require("esbuild");
// const ne = require("esbuild-node-externals");

esbuild
  .build({
    entryPoints: ["src/server.ts"], // Замените на ваш основной файл
    format: "esm",
    bundle: true,
    outfile: "dist/server.js", // Путь к выходному файлу
    platform: "node", // Для серверного кода
    target: "node16", // Замените на нужную версию Node.js
    sourcemap: false, // Для отладки (опционально)
    // minify: true,
    external: ["esbuild"], // Exclude prettier here
    plugins: [ne.nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
