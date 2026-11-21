import { describe, expect, it } from "vitest";
import { checkRules, findConflict, overlaps } from "./booking";
import { toIso } from "./time";

const day = "2026-11-20";
const at = (hhmm: string) => toIso(day, hhmm);
const range = (s: string, e: string) => ({ startsAt: at(s), endsAt: at(e) });
// 19/11/2026, 09:00 em São Paulo
const now = new Date("2026-11-19T12:00:00Z");

describe("overlaps (intervalo semiaberto)", () => {
  it("reservas coladas não se sobrepõem", () => {
    expect(overlaps(range("10:00", "11:00"), range("11:00", "12:00"))).toBe(false);
    expect(overlaps(range("11:00", "12:00"), range("10:00", "11:00"))).toBe(false);
  });
  it("detecta reserva contida, que contém e que cruza as pontas", () => {
    expect(overlaps(range("10:00", "12:00"), range("10:30", "11:00"))).toBe(true);
    expect(overlaps(range("10:30", "11:00"), range("10:00", "12:00"))).toBe(true);
    expect(overlaps(range("10:00", "11:00"), range("10:30", "11:30"))).toBe(true);
    expect(overlaps(range("10:30", "11:30"), range("10:00", "11:00"))).toBe(true);
  });
  it("horários distintos não se sobrepõem", () => {
    expect(overlaps(range("09:00", "10:00"), range("14:00", "15:00"))).toBe(false);
  });
});

describe("findConflict", () => {
  const existing = [{ roomId: "savassi", ...range("09:00", "10:30") }];
  it("conflita na mesma sala, mesmo horário parcial", () => {
    expect(findConflict(existing, { roomId: "savassi", ...range("10:00", "11:00") })).toBeDefined();
  });
  it("não conflita em outra sala", () => {
    expect(findConflict(existing, { roomId: "pampulha", ...range("09:00", "10:30") })).toBeUndefined();
  });
  it("não conflita quando começa exatamente no fim da outra", () => {
    expect(findConflict(existing, { roomId: "savassi", ...range("10:30", "11:00") })).toBeUndefined();
  });
});

describe("checkRules", () => {
  it("aceita 30 minutos e 4 horas exatos", () => {
    expect(checkRules(range("10:00", "10:30"), now)).toBeNull();
    expect(checkRules(range("10:00", "14:00"), now)).toBeNull();
  });
  it("recusa menos de 30 minutos e mais de 4 horas", () => {
    expect(checkRules(range("10:00", "10:29"), now)).toBe("DURATION_TOO_SHORT");
    expect(checkRules(range("10:00", "14:01"), now)).toBe("DURATION_TOO_LONG");
  });
  it("recusa fim igual ou antes do início", () => {
    expect(checkRules(range("10:00", "10:00"), now)).toBe("END_BEFORE_START");
    expect(checkRules(range("11:00", "10:00"), now)).toBe("END_BEFORE_START");
  });
  it("recusa início no passado, com o relógio injetado", () => {
    expect(checkRules(range("08:00", "09:00"), new Date("2026-11-20T12:00:00Z"))).toBe("IN_THE_PAST");
    expect(checkRules(range("10:00", "11:00"), new Date("2026-11-20T12:00:00Z"))).toBeNull();
  });
  it("aceita começar exatamente agora", () => {
    expect(checkRules(range("10:00", "11:00"), new Date(at("10:00")))).toBeNull();
  });
  it("respeita o expediente: 07:00 às 22:00", () => {
    expect(checkRules(range("06:30", "07:30"), now)).toBe("OUTSIDE_OPENING_HOURS");
    expect(checkRules(range("07:00", "08:00"), now)).toBeNull();
    expect(checkRules(range("21:00", "22:00"), now)).toBeNull();
    expect(checkRules(range("21:00", "22:30"), now)).toBe("OUTSIDE_OPENING_HOURS");
    expect(checkRules({ startsAt: at("21:00"), endsAt: toIso("2026-11-21", "00:30") }, now)).toBe("OUTSIDE_OPENING_HOURS");
  });
});
