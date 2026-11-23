import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, availability, booking, bookingsUrl, create, freezeClock, list, resetDatabase, tokens } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("autenticação (401)", () => {
  it.each([
    ["sem header", undefined],
    ["token desconhecido", "Bearer token-que-nao-existe"],
    ["esquema Basic", `Basic ${tokens.acme}`],
    ["Bearer sem token", "Bearer"],
  ])("recusa %s", async (_case, header) => {
    const req = api().get(bookingsUrl("acme"));
    const res = await (header ? req.set("Authorization", header) : req);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("disponibilidade sem token responde 401", async () => {
    const res = await api().get("/api/rooms/savassi/availability").query({ date: "2026-11-25" });
    expect(res.status).toBe(401);
  });

  it("config sem token responde 401 e com token devolve o fuso", async () => {
    expect((await api().get("/api/config")).status).toBe(401);

    const res = await api().get("/api/config").set("Authorization", `Bearer ${tokens.brisa}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ timezone: "America/Sao_Paulo" });
  });

  it("GET /api/rooms sem token responde 200", async () => {
    const res = await api().get("/api/rooms");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });
});

describe("isolamento entre empresas (403)", () => {
  it("token da Acme na listagem da Lumen", async () => {
    const res = await api().get(bookingsUrl("lumen")).set("Authorization", `Bearer ${tokens.acme}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("token da Acme criando reserva em nome da Lumen não grava nada", async () => {
    const res = await api()
      .post(bookingsUrl("lumen"))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking());

    expect(res.status).toBe(403);
    expect((await list("lumen")).body).toHaveLength(0);
  });

  it("token da Acme cancelando na URL da Lumen", async () => {
    const lumen = await create("lumen");
    const res = await api()
      .delete(bookingsUrl("lumen", lumen.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`);

    expect(res.status).toBe(403);
  });
});

describe("reserva de outra empresa (404, sem revelar que existe)", () => {
  it("Acme cancela pela própria URL o id da Lumen: 404 igual ao de id inexistente, e a reserva continua", async () => {
    const lumen = await create("lumen");

    const alheia = await api().delete(bookingsUrl("acme", lumen.body.id)).set("Authorization", `Bearer ${tokens.acme}`);
    const inexistente = await api().delete(bookingsUrl("acme", "nao-existe")).set("Authorization", `Bearer ${tokens.acme}`);

    expect(alheia.status).toBe(404);
    expect(alheia.body).toEqual(inexistente.body);
    expect((await list("lumen")).body).toHaveLength(1);
  });

  it("Acme edita pela própria URL o id da Lumen: 404 e nada muda", async () => {
    const lumen = await create("lumen");

    const res = await api()
      .put(bookingsUrl("acme", lumen.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ title: "Sequestrada" }));

    expect(res.status).toBe(404);
    expect((await list("lumen")).body[0].title).toBe("Planning semanal");
  });
});

describe("dados expostos", () => {
  it("cada empresa lista só as próprias reservas", async () => {
    await create("acme", booking({ roomId: "savassi" }));
    await create("lumen", booking({ roomId: "pampulha" }));
    await create("brisa", booking({ roomId: "curral" }));

    const res = await list("acme");

    expect(res.body).toHaveLength(1);
    expect(res.body.every((item: { companyId: string }) => item.companyId === "acme")).toBe(true);
  });

  it("disponibilidade expõe só startsAt e endsAt", async () => {
    await create("lumen");

    const res = await availability("savassi", "2026-11-25", "brisa");

    expect(res.status).toBe(200);
    expect(res.body.busy).toHaveLength(1);
    expect(Object.keys(res.body.busy[0]).sort()).toEqual(["endsAt", "startsAt"]);
  });

  it("não envia o header X-Powered-By", async () => {
    const res = await api().get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("rota desconhecida responde 404 no formato de erro", async () => {
    const res = await api().get("/api/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
