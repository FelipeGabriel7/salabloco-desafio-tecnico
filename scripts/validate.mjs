import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tokens = {
  COMPANY_ACME_TOKEN: "acme-local-7f3a9c2e",
  COMPANY_LUMEN_TOKEN: "lumen-local-4b8d1e6a",
  COMPANY_BRISA_TOKEN: "brisa-local-2c5f9a0d",
};
const apiUrl = "http://127.0.0.1:3390";
const testEnv = {
  ...process.env,
  API_URL: apiUrl,
  WEB_URL: "http://127.0.0.1:5190",
  ACME_TOKEN: tokens.COMPANY_ACME_TOKEN,
  LUMEN_TOKEN: tokens.COMPANY_LUMEN_TOKEN,
  BRISA_TOKEN: tokens.COMPANY_BRISA_TOKEN,
};

const steps = [
  ["Tipos", "npm run typecheck"],
  ["Unitários do front", "npm test"],
  ["API (Vitest + Supertest)", "npm run test:api"],
  ["Contrato (Bruno)", `npm run test:contract -w tests -- --env-var baseUrl=${apiUrl}/api --env-var token=${tokens.COMPANY_ACME_TOKEN} --env-var otherToken=${tokens.COMPANY_LUMEN_TOKEN}`],
  ["Performance (Artillery)", `npm run test:performance -w tests -- --target ${apiUrl}`],
  ["Interface (Playwright)", "npm run test:e2e"],
  ["Dependências (npm audit)", "npm audit --omit=dev --audit-level=high"],
];

function run(command, env = testEnv) {
  return spawnSync(command, { shell: true, stdio: "inherit", env }).status === 0;
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`A API não respondeu em ${url}`);
}

rmSync("tests/allure-results", { recursive: true, force: true });

const api = spawn("npm run start -w apps/api", {
  shell: true,
  stdio: "ignore",
  env: { ...process.env, ...tokens, PORT: "3390", DB_PATH: join(tmpdir(), `salabloco-validate-${Date.now()}.json`) },
});

const results = [];
try {
  await waitFor(`${apiUrl}/api/health`);
  for (const [name, command] of steps) {
    console.log(`\n▶ ${name}`);
    results.push([name, run(command)]);
  }
} finally {
  if (process.platform === "win32") spawnSync(`taskkill /pid ${api.pid} /t /f`, { shell: true, stdio: "ignore" });
  else api.kill();
}

run("npm run report");

console.log("\nResultado das validações\n");
console.table(results.map(([etapa, ok]) => ({ etapa, resultado: ok ? "passou" : "FALHOU" })));
console.log("Relatório: npm run report:open\n");

process.exit(results.every(([, ok]) => ok) ? 0 : 1);
