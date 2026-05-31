import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    port: 5190,
    open: "/basic.html"
  },
  optimizeDeps: {
    include: ["three"]
  }
});
