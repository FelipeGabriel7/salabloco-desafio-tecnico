import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { at, availability, booking, create, freezeClock, resetDatabase } from "../helpers.ts";

beforeEach(async () => {
  freezeClock();
  await resetDatabase();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("criação de reserva: caminho feliz", () => {
  it("cria uma reserva de 1 hora e devolve 201 com id, empresa e Location", async () => {
    const res = await create("acme");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      companyId: "acme",
      roomId: "savassi",
      title: "Planning semanal",
      responsibleEmail: "ana@acme.test",
    });
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.createdAt).toEqual(expect.any(String));
    expect(res.headers.location).toBe(`/api/companies/acme/bookings/${res.body.id}`);
  });
});

describe("duração", () => {
  it("aceita exatamente 30 minutos", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("10:30") }));
    expect(res.status).toBe(201);
  });

  it("recusa 29 minutos", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("10:29") }));
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ code: "DURATION_TOO_SHORT", field: "endsAt" });
  });

  it("aceita exatamente 4 horas", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("14:00") }));
    expect(res.status).toBe(201);
  });

  it("recusa 4 horas e 1 minuto", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("14:01") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("DURATION_TOO_LONG");
  });

  it("recusa fim igual ao início", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00"), endsAt: at("10:00") }));
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ code: "END_BEFORE_START", field: "endsAt" });
  });

  it("recusa fim antes do início", async () => {
    const res = await create("acme", booking({ startsAt: at("11:00"), endsAt: at("10:00") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("END_BEFORE_START");
  });
});

describe("expediente das 07:00 às 22:00", () => {
  it("aceita começar às 07:00", async () => {
    const res = await create("acme", booking({ startsAt: at("07:00"), endsAt: at("08:00") }));
    expect(res.status).toBe(201);
  });

  it("recusa começar às 06:59", async () => {
    const res = await create("acme", booking({ startsAt: at("06:59"), endsAt: at("08:00") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OUTSIDE_OPENING_HOURS");
  });

  it("aceita terminar às 22:00", async () => {
    const res = await create("acme", booking({ startsAt: at("21:00"), endsAt: at("22:00") }));
    expect(res.status).toBe(201);
  });

  it("recusa terminar às 22:01", async () => {
    const res = await create("acme", booking({ startsAt: at("21:00"), endsAt: at("22:01") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OUTSIDE_OPENING_HOURS");
  });

  it("recusa reserva que atravessa a meia-noite", async () => {
    const res = await create("acme", booking({ startsAt: at("21:30"), endsAt: at("00:30", "2026-11-26") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OUTSIDE_OPENING_HOURS");
  });
});

describe("passado", () => {
  it("recusa reserva que começou ontem", async () => {
    const res = await create("acme", booking({ startsAt: at("10:00", "2026-11-23"), endsAt: at("11:00", "2026-11-23") }));
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ code: "IN_THE_PAST", field: "startsAt" });
  });

  it("recusa reserva que começa 1 minuto antes de agora", async () => {
    const res = await create("acme", booking({ startsAt: at("08:59", "2026-11-24"), endsAt: at("10:00", "2026-11-24") }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("IN_THE_PAST");
  });

  it("aceita reserva que começa exatamente agora", async () => {
    const res = await create("acme", booking({ startsAt: at("09:00", "2026-11-24"), endsAt: at("10:00", "2026-11-24") }));
    expect(res.status).toBe(201);
  });
});

describe("sala", () => {
  it("recusa sala que não existe", async () => {
    const res = await create("acme", booking({ roomId: "sala-fantasma" }));
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ code: "ROOM_NOT_FOUND", field: "roomId" });
  });
});

describe("fuso do coworking", () => {
  it("reserva às 21:00 locais (00:00 UTC do dia seguinte) aparece no dia local", async () => {
    await create("acme", booking({ startsAt: at("21:00"), endsAt: at("22:00") }));

    const sameDay = await availability("savassi", "2026-11-25");
    const nextDay = await availability("savassi", "2026-11-26");

    expect(sameDay.body.busy).toHaveLength(1);
    expect(nextDay.body.busy).toHaveLength(0);
  });
});
