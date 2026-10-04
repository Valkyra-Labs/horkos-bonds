import { defineConfig, devices } from "@playwright/test";

// The tests run against the production build, served by `vite preview`,
// so the WebAssembly is loaded the way a visitor gets it.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4176", viewport: { width: 1440, height: 900 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: { command: "pnpm build && pnpm preview", url: "http://localhost:4176", reuseExistingServer: false, timeout: 180_000 },
});
