import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { env } from "./fixtures/env";

const isCI = !!process.env.CI;
const apiPort = new URL(env.apiUrl).port;
const webPort = new URL(env.webUrl).port;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 2 : 1,
  forbidOnly: isCI,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ["list"],
    ["allure-playwright", { resultsDir: "allure-results", detail: true, suiteTitle: false }],
  ],
  use: {
    baseURL: env.webUrl,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@celular/ },
    { name: "celular", use: { ...devices["Pixel 7"] }, grep: /@celular/ },
  ],
  webServer: env.startServers
    ? [
        {
          command: "npm run start -w apps/api",
          cwd: "..",
          url: `${env.apiUrl}/api/health`,
          reuseExistingServer: !isCI,
          timeout: 30_000,
          env: {
            PORT: apiPort,
            DB_PATH: join(tmpdir(), `salabloco-e2e-${Date.now()}.json`),
            COMPANY_ACME_TOKEN: env.tokens.acme,
            COMPANY_LUMEN_TOKEN: env.tokens.lumen,
            COMPANY_BRISA_TOKEN: env.tokens.brisa,
          },
        },
        {
          command: `npm run dev -w apps/web -- --port ${webPort}`,
          cwd: "..",
          url: env.webUrl,
          reuseExistingServer: !isCI,
          timeout: 60_000,
          env: { API_PROXY_TARGET: env.apiUrl },
        },
      ]
    : undefined,
});
