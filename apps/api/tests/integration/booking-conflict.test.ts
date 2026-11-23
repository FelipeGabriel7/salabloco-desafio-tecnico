import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "../../src/infrastructure/persistence/storage.ts";
import { at, booking, create, freezeClock, list, resetDatabase } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
  const base = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("11:00") }));
  expect(base.status).toBe(201);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sobreposição na mesma sala", () => {
  it.each([
    ["parcial no início", "09:30", "10:30"],
    ["parcial no fim", "10:30", "11:30"],
    ["contida", "10:15", "10:45"],
    ["que contém", "09:00", "12:00"],
    ["idêntica", "10:00", "11:00"],
  ])("recusa reserva %s com 409", async (_case, start, end) => {
    const res = await create("acme", booking({ startsAt: at(start), endsAt: at(end) }));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("BOOKING_CONFLICT");
  });

  it.each([
    ["colada antes", "09:00", "10:00"],
    ["colada depois", "11:00", "12:00"],
  ])("aceita reserva %s (intervalo semiaberto)", async (_case, start, end) => {
    const res = await create("acme", booking({ startsAt: at(start), endsAt: at(end) }));
    expect(res.status).toBe(201);
  });

  it("aceita o mesmo horário em outra sala", async () => {
    const res = await create("acme", booking({ roomId: "pampulha" }));
    expect(res.status).toBe(201);
  });

  it("o conflito vale entre empresas: a Lumen não reserva o horário da Acme", async () => {
    const res = await create("lumen", booking({ responsibleEmail: "bia@lumen.test" }));
    expect(res.status).toBe(409);
  });
});

describe("corpo do 409", () => {
  it("mostra só início e fim do conflito, sem dados da outra empresa", async () => {
    const res = await create("lumen", booking({ responsibleEmail: "bia@lumen.test" }));

    expect(Object.keys(res.body.conflict).sort()).toEqual(["endsAt", "startsAt"]);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("Planning semanal");
    expect(body).not.toContain("ana@acme.test");
    expect(body).not.toContain("acme");
  });

  it("sugere até 2 horários livres, no futuro, no expediente e com a mesma duração", async () => {
    const res = await create("acme", booking({ startsAt: at("10:30"), endsAt: at("11:30") }));

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(2);

    for (const suggestion of res.body.suggestions) {
      const start = Date.parse(suggestion.startsAt);
      const end = Date.parse(suggestion.endsAt);
      expect(end - start).toBe(60 * 60_000);
      expect(start).toBeGreaterThanOrEqual(Date.now());
    }

    const retry = await create("acme", booking({ ...res.body.suggestions[0] }));
    expect(retry.status).toBe(201);
  });
});

describe("concorrência", () => {
  it("10 pedidos simultâneos no mesmo horário: exatamente um 201", async () => {
    const slot = booking({ roomId: "ufmg", startsAt: at("15:00"), endsAt: at("16:00") });

    const responses = await Promise.all(Array.from({ length: 10 }, () => create("brisa", slot)));
    const statuses = responses.map((res) => res.status).sort();

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(9);

    const database = await storage.read(process.env.DB_PATH!);
    expect(database.bookings.filter((item: { roomId: string }) => item.roomId === "ufmg")).toHaveLength(1);
    expect((await list("brisa")).body).toHaveLength(1);
  });

  it("leituras e escritas ao mesmo tempo nunca respondem 500", async () => {
    const slots = [["08:00", "09:00"], ["12:00", "13:00"], ["14:00", "15:00"], ["16:00", "17:00"], ["18:00", "19:00"]];
    const writes = slots.map(([start, end]) => create("acme", booking({ roomId: "curral", startsAt: at(start), endsAt: at(end) })));
    const reads = Array.from({ length: 20 }, () => list("acme"));

    const responses = await Promise.all([...writes, ...reads]);

    expect(responses.filter((res) => res.status >= 500)).toHaveLength(0);
  });
});
