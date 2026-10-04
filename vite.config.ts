import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from GitHub Pages under /horkos-bonds/.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/horkos-bonds/" : "/",
  plugins: [react()],
  // Stoa and the engine are linked from sibling repositories and have
  // their own node_modules: without dedupe the app would run two copies of
  // React and fail with "Invalid hook call".
  resolve: { dedupe: ["react", "react-dom", "react-aria-components"] },
  server: { port: 5176, strictPort: true, fs: { allow: [".."] } },
  preview: { port: 4176, strictPort: true },
});
