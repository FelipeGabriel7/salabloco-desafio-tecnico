import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, booking, bookingsUrl, create, freezeClock, resetDatabase, tokens } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formato do corpo (400)", () => {
  it("recusa corpo vazio", async () => {
    const res = await create("acme", {});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION");
    expect(res.body.field).toEqual(expect.any(String));
  });

  it("recusa data e hora sem fuso", async () => {
    const res = await create("acme", booking({ startsAt: "2026-11-25T10:00:00" }));
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("startsAt");
  });

  it("recusa data impossível", async () => {
    const res = await create("acme", booking({ startsAt: "2026-02-30T10:00:00Z" }));
    expect(res.status).toBe(400);
  });

  it("recusa título só com espaços", async () => {
    const res = await create("acme", booking({ title: "   " }));
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("title");
  });

  it("aceita título com 80 caracteres", async () => {
    const res = await create("acme", booking({ title: "x".repeat(80) }));
    expect(res.status).toBe(201);
  });

  it("recusa título com 81 caracteres", async () => {
    const res = await create("acme", booking({ title: "x".repeat(81) }));
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("title");
  });

  it("recusa e-mail inválido", async () => {
    const res = await create("acme", booking({ responsibleEmail: "ana@" }));
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("responsibleEmail");
  });

  it("recusa campo extra companyId no corpo (mass assignment)", async () => {
    const res = await create("acme", booking({ companyId: "lumen" }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION");
  });

  it("recusa JSON malformado sem erro 500", async () => {
    const res = await api()
      .post(bookingsUrl("acme"))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .set("Content-Type", "application/json")
      .send('{"roomId":');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION");
  });

  it("recusa corpo maior que 16 kb com 413, sem erro 500", async () => {
    const res = await create("acme", booking({ title: "x".repeat(17 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ code: "PAYLOAD_TOO_LARGE", message: "O corpo da requisição passa de 16 kb." });
  });
});
