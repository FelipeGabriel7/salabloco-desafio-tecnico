import { describe, expect, it } from "vitest";

process.env.RATE_LIMIT_MAX = "2";

const { default: request } = await import("supertest");
const { app } = await import("../../src/app.ts");

describe("limite de requisições na API", () => {
  it("a API aplica o limite antes das rotas e responde 429 no formato de erro", async () => {
    await request(app).get("/api/health");
    await request(app).get("/api/health");

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(429);
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0);
    expect(response.body.code).toBe("RATE_LIMITED");
  });
});
