import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/server.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/server.cjs",
    minify: true, // Минимизирует бандл
    // external: ["ws"],
  })
  .catch(() => process.exit(1));
