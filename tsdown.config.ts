import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { "cli/index": "src/cli/index.ts" },
  format: "es",
  outDir: "dist",
  dts: true,
  clean: true,
});
