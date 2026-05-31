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
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "cesium",
    "@reduxjs/toolkit",
    "react-redux"
  ],
  banner: {
    js: "/* @cesium-suite/cesium-flight-simulator */"
  },
  esbuildOptions(options) {
    options.jsx = "automatic";
  }
});
