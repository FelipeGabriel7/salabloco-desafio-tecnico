import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    setupFiles: ["allure-vitest/setup", "tests/setup.ts"],
    environment: "node",
    reporters: ["default", ["allure-vitest/reporter", { resultsDir: "../../tests/allure-results" }]],
  },
});
