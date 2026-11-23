import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, at, availability, booking, bookingsUrl, create, freezeClock, list, resetDatabase, tokens } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("disponibilidade", () => {
  it.each([
    ["ausente", undefined],
    ["impossível", "2026-02-30"],
    ["em outro formato", "25/11/2026"],
  ])("recusa data %s com 400 INVALID_DATE", async (_case, date) => {
    const req = api().get("/api/rooms/savassi/availability").set("Authorization", `Bearer ${tokens.acme}`);
    const res = await (date ? req.query({ date }) : req);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
  });

  it("sala inexistente responde 404", async () => {
    const res = await availability("sala-fantasma", "2026-11-25");
    expect(res.status).toBe(404);
  });

  it("devolve os horários ocupados em ordem crescente", async () => {
    await create("acme", booking({ startsAt: at("15:00"), endsAt: at("16:00") }));
    await create("lumen", booking({ startsAt: at("08:00"), endsAt: at("09:00") }));

    const res = await availability("savassi", "2026-11-25");

    expect(res.body.busy.map((slot: { startsAt: string }) => slot.startsAt)).toEqual([
      "2026-11-25T08:00:00-03:00",
      "2026-11-25T15:00:00-03:00",
    ]);
  });
});

describe("edição", () => {
  it("atualiza a própria reserva mantendo id e createdAt", async () => {
    const created = await create("acme");

    const res = await api()
      .put(bookingsUrl("acme", created.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ title: "Retro", startsAt: at("14:00"), endsAt: at("15:00") }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, createdAt: created.body.createdAt, title: "Retro" });
  });

  it("pode mover a reserva sobre o próprio horário sem conflitar consigo mesma", async () => {
    const created = await create("acme");

    const res = await api()
      .put(bookingsUrl("acme", created.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ startsAt: at("10:30"), endsAt: at("11:30") }));

    expect(res.status).toBe(200);
  });

  it("recusa mover para horário ocupado e mantém a original", async () => {
    await create("lumen", booking({ startsAt: at("14:00"), endsAt: at("15:00") }));
    const mine = await create("acme");

    const res = await api()
      .put(bookingsUrl("acme", mine.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ startsAt: at("14:30"), endsAt: at("15:30") }));

    expect(res.status).toBe(409);
    expect((await list("acme")).body[0].startsAt).toBe(at("10:00"));
  });

  it("recusa edição que quebra regra (29 minutos) e nada muda", async () => {
    const mine = await create("acme");

    const res = await api()
      .put(bookingsUrl("acme", mine.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ startsAt: at("10:00"), endsAt: at("10:29") }));

    expect(res.status).toBe(422);
    expect((await list("acme")).body[0].endsAt).toBe(at("11:00"));
  });

  it("id inexistente responde 404", async () => {
    const res = await api()
      .put(bookingsUrl("acme", "nao-existe"))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking());

    expect(res.status).toBe(404);
  });
});

describe("cancelamento", () => {
  it("cancela a própria reserva com 204 e ela some da lista", async () => {
    const created = await create("acme");

    const res = await api().delete(bookingsUrl("acme", created.body.id)).set("Authorization", `Bearer ${tokens.acme}`);

    expect(res.status).toBe(204);
    expect((await list("acme")).body).toHaveLength(0);
  });

  it("cancelar duas vezes: a segunda responde 404", async () => {
    const created = await create("acme");
    const url = bookingsUrl("acme", created.body.id);

    await api().delete(url).set("Authorization", `Bearer ${tokens.acme}`);
    const second = await api().delete(url).set("Authorization", `Bearer ${tokens.acme}`);

    expect(second.status).toBe(404);
  });
});
