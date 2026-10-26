// Gera dist/mm.mjs. Script em Node (e não na linha do package.json) para funcionar igual no Windows.
import { build } from "esbuild";

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/mm.mjs",
  // O PGlite carrega arquivos .wasm da própria pasta: fica fora do pacote.
  external: ["@electric-sql/pglite"],
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire as __mmRequire } from 'node:module'; const require = __mmRequire(import.meta.url);",
  },
  logLevel: "warning",
});
