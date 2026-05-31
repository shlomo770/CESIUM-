import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: ["three"],
  banner: {
    js: "/* @cesium-suite/telemetry-flight-viewer */"
  },
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      ".css": "text"
    };
  }
});
