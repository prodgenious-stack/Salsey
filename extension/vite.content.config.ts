import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Content scripts must be a single classic script with no external chunks —
// library/IIFE mode inlines everything (including React) into one file.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/content/index.tsx",
      formats: ["iife"],
      name: "LiveCallCopilotContent",
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})
