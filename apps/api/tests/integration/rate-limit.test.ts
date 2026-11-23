import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimit } from "../../src/shared/rate-limit.ts";

const options = { windowMs: 60_000, max: 3, authFailWindowMs: 300_000, authFailMax: 2, authBlockMs: 60_000 };

function limitedApp() {
  const app = express();
  app.set("trust proxy", true);
  app.use(createRateLimit(options));
  app.get("/livre", (_req, res) => res.json({ ok: true }));
  app.get("/privado", (_req, res) => res.status(401).json({ code: "UNAUTHORIZED" }));
  return app;
}

function from(app: express.Express, ip: string, path = "/livre") {
  return request(app).get(path).set("X-Forwarded-For", ip);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-24T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("limite geral por IP", () => {
  it("acima do limite responde 429 com Retry-After e o código RATE_LIMITED", async () => {
    const app = limitedApp();
    for (let i = 0; i < 3; i++) expect((await from(app, "1.1.1.1")).status).toBe(200);

    const blocked = await from(app, "1.1.1.1");

    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBe("60");
    expect(blocked.body).toEqual({ code: "RATE_LIMITED", message: expect.any(String) });
  });

  it("janela deslizante: libera quando a requisição mais antiga sai da janela", async () => {
    const app = limitedApp();
    await from(app, "1.1.1.2");
    vi.advanceTimersByTime(30_000);
    await from(app, "1.1.1.2");
    await from(app, "1.1.1.2");
    expect((await from(app, "1.1.1.2")).status).toBe(429);

    vi.setSystemTime(Date.now() + 30_001);

    expect((await from(app, "1.1.1.2")).status).toBe(200);
  });

  it("outro IP não é afetado", async () => {
    const app = limitedApp();
    for (let i = 0; i < 4; i++) await from(app, "1.1.1.3");

    expect((await from(app, "2.2.2.2")).status).toBe(200);
  });
});

describe("bloqueio por falhas de autenticação", () => {
  it("falhas seguidas bloqueiam o IP e depois liberam", async () => {
    const app = limitedApp();
    await from(app, "3.3.3.3", "/privado");
    await from(app, "3.3.3.3", "/privado");

    const blocked = await from(app, "3.3.3.3");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBe("60");

    vi.setSystemTime(Date.now() + 60_001);
    expect((await from(app, "3.3.3.3")).status).toBe(200);
  });

  it("reincidência dobra o bloqueio", async () => {
    const app = limitedApp();
    await from(app, "4.4.4.4", "/privado");
    await from(app, "4.4.4.4", "/privado");
    vi.setSystemTime(Date.now() + 60_001);

    await from(app, "4.4.4.4", "/privado");
    await from(app, "4.4.4.4", "/privado");

    expect((await from(app, "4.4.4.4")).headers["retry-after"]).toBe("120");
  });

  it("respostas de sucesso não contam como falha", async () => {
    const app = limitedApp();
    await from(app, "5.5.5.5");
    await from(app, "5.5.5.5");

    expect((await from(app, "5.5.5.5")).status).toBe(200);
  });
});
