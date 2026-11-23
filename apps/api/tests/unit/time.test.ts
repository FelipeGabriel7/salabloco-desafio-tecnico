import { describe, expect, it } from "vitest";
import { getDayRange, isWithinOpeningHours, localDateTimeToUtc, overlaps, validDay } from "../../src/shared/time.ts";

const SP = "America/Sao_Paulo";
const iso = (ms: number) => new Date(ms).toISOString();

describe("conversão de horário local", () => {
  it("21:30 em São Paulo é 00:30 UTC do dia seguinte", () => {
    expect(localDateTimeToUtc("2026-11-20", 21, 30, SP).toISOString()).toBe("2026-11-21T00:30:00.000Z");
  });
});

describe("limites do dia local", () => {
  it("2026-11-20 vai das 03:00 UTC do dia 20 às 03:00 UTC do dia 21", () => {
    const { start, end } = getDayRange("2026-11-20", SP);
    expect(iso(start)).toBe("2026-11-20T03:00:00.000Z");
    expect(iso(end)).toBe("2026-11-21T03:00:00.000Z");
  });

  it("2018-11-20, com horário de verão, usa -02:00: prova que não há offset fixo", () => {
    const { start } = getDayRange("2018-11-20", SP);
    expect(iso(start)).toBe("2018-11-20T02:00:00.000Z");
  });

  it("em Manaus o dia começa às 04:00 UTC", () => {
    const { start } = getDayRange("2026-11-20", "America/Manaus");
    expect(iso(start)).toBe("2026-11-20T04:00:00.000Z");
  });
});

describe("expediente", () => {
  const local = (time: string) => Date.parse(`2026-11-25T${time}:00-03:00`);

  it.each([
    ["07:00", "22:00", true],
    ["06:59", "08:00", false],
    ["21:00", "22:01", false],
  ])("%s até %s dentro do expediente: %s", (start, end, expected) => {
    expect(isWithinOpeningHours(local(start), local(end), SP)).toBe(expected);
  });
});

describe("sobreposição de intervalos", () => {
  it("intervalos colados não se sobrepõem", () => {
    expect(overlaps(10, 11, 11, 12)).toBe(false);
  });

  it("intervalos que se cruzam se sobrepõem", () => {
    expect(overlaps(10, 12, 11, 13)).toBe(true);
  });
});

describe("validação de dia", () => {
  it.each([
    ["2026-11-25", true],
    ["2026-02-30", false],
    ["25/11/2026", false],
    [undefined, false],
  ])("%s é válido: %s", (value, expected) => {
    expect(validDay(value)).toBe(expected);
  });
});
