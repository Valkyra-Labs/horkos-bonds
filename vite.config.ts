import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";

// Served from GitHub Pages under /horkos-bonds/.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/horkos-bonds/" : "/",
  plugins: [react()],
  // Stoa and the engine are linked from sibling repositories and have
  // their own node_modules: without dedupe the app would run two copies of
  // React and fail with "Invalid hook call".
  resolve: { dedupe: ["react", "react-dom", "react-aria-components"] },
  server: {
    port: 5176,
    strictPort: true,
    // What the dev server may serve beyond this project: the linked Stoa
    // packages and their dependencies, and the engine's build. Not the
    // whole parent folder, which would hand the other repositories' files
    // (ignored ones included) to anything that can reach the server.
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        "../stoa-system/packages",
        "../stoa-system/node_modules",
        "../horkos-yield/pkg",
        "../horkos-yield/twin/dist",
      ],
    },
  },
  preview: { port: 4176, strictPort: true },
});
