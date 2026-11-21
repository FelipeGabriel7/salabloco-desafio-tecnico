import { defineConfig, devices } from "@playwright/test";
import { env } from "./fixtures/env";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: ".",
  testMatch: ["api/**/*.spec.ts", "e2e/**/*.spec.ts"],
  fullyParallel: false, // o estado é um arquivo JSON compartilhado: ver ADR 0011
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["allure-playwright", { resultsDir: "allure-results" }],
  ],
  use: {
    baseURL: env.webUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "api", testDir: "./api", use: { baseURL: env.apiUrl } },
    { name: "e2e", testDir: "./e2e", use: { ...devices["Desktop Chrome"] } },
  ],
  // Sobe API e front quando START_SERVERS=1 (padrão). No CI os jobs já sobem os servidores.
  webServer: env.startServers
    ? [
        {
          command: "npm run start -w apps/api",
          cwd: "..",
          url: `${env.apiUrl}/rooms`,
          reuseExistingServer: !isCI,
          timeout: 30_000,
        },
        {
          command: "npm run dev -w apps/web",
          cwd: "..",
          url: env.webUrl,
          reuseExistingServer: !isCI,
          timeout: 30_000,
        },
      ]
    : undefined,
});
