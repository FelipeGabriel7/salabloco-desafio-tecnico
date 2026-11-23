import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingList, contracts } from "./contracts.ts";
import { api, availability, booking, bookingsUrl, create, freezeClock, list, resetDatabase, tokens } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("contrato das respostas de sucesso", () => {
  it("GET /api/health", async () => {
    const res = await api().get("/api/health");
    expect(contracts.health.parse(res.body)).toBeTruthy();
  });

  it("GET /api/config", async () => {
    const res = await api().get("/api/config").set("Authorization", `Bearer ${tokens.acme}`);
    expect(contracts.config.parse(res.body)).toBeTruthy();
  });

  it("GET /api/companies não expõe tokens", async () => {
    const res = await api().get("/api/companies");
    expect(contracts.companies.parse(res.body)).toHaveLength(3);
  });

  it("GET /api/rooms", async () => {
    const res = await api().get("/api/rooms");
    expect(contracts.rooms.parse(res.body)).toHaveLength(5);
  });

  it("GET disponibilidade expõe só início e fim", async () => {
    await create("lumen");
    const res = await availability("savassi", "2026-11-25");
    expect(contracts.availability.parse(res.body).busy).toHaveLength(1);
  });

  it("POST, PUT e GET de reservas devolvem a reserva completa", async () => {
    const created = await create("acme");
    expect(contracts.booking.parse(created.body)).toBeTruthy();

    const updated = await api()
      .put(bookingsUrl("acme", created.body.id))
      .set("Authorization", `Bearer ${tokens.acme}`)
      .send(booking({ title: "Retro" }));
    expect(contracts.booking.parse(updated.body)).toBeTruthy();

    expect(bookingList.parse((await list("acme")).body)).toHaveLength(1);
  });
});

describe("contrato das respostas de erro", () => {
  it.each([
    ["401", () => api().get(bookingsUrl("acme"))],
    ["403", () => api().get(bookingsUrl("lumen")).set("Authorization", `Bearer ${tokens.acme}`)],
    ["404", () => api().delete(bookingsUrl("acme", "nao-existe")).set("Authorization", `Bearer ${tokens.acme}`)],
    ["400", () => create("acme", {})],
    ["422", () => create("acme", booking({ endsAt: booking().startsAt }))],
  ])("%s segue o formato { code, message, field? }", async (status, send) => {
    const res = await send();
    expect(String(res.status)).toBe(status);
    expect(contracts.error.parse(res.body)).toBeTruthy();
  });

  it("409 traz o conflito e as sugestões no formato combinado", async () => {
    await create("acme");
    const res = await create("lumen");
    expect(contracts.conflict.parse(res.body)).toBeTruthy();
  });
});
