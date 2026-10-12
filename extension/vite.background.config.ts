import { defineConfig } from "vite"

// MV3 service workers support ES modules directly (manifest "type": "module"),
// so this can stay a plain module build — no IIFE needed.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/background/service-worker.ts",
      output: {
        entryFileNames: "background.js",
        format: "es",
      },
    },
  },
})
