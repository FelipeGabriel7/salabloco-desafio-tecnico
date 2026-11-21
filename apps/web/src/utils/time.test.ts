import { describe, expect, it } from "vitest";
import { addDaysStr, dateOf, fmtDayShort, isValidDate, minuteOfDay, relativeDay, timeOf, toIso } from "./time";

describe("fuso do coworking (America/Sao_Paulo)", () => {
  it("23:30 locais viram o dia seguinte em UTC, mas continuam no mesmo dia do coworking", () => {
    const iso = toIso("2026-11-20", "23:30");
    expect(iso).toBe("2026-11-21T02:30:00.000Z");
    expect(dateOf(iso)).toBe("2026-11-20");
    expect(timeOf(iso)).toBe("23:30");
  });
  it("meia-noite do coworking é o início do dia", () => {
    expect(minuteOfDay(toIso("2026-11-20", "00:00"), "2026-11-20")).toBe(0);
    expect(minuteOfDay(toIso("2026-11-20", "09:30"), "2026-11-20")).toBe(570);
  });
});

describe("datas", () => {
  it("recusa datas inexistentes e formatos errados", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("20-11-2026")).toBe(false);
    expect(isValidDate("2026-11-20")).toBe(true);
  });
  it("soma dias atravessando o mês", () => {
    expect(addDaysStr("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysStr("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("formata o dia curto e o relativo", () => {
    expect(fmtDayShort("2026-11-20")).toBe("sex., 20 nov");
    expect(relativeDay("2026-11-20", "2026-11-19")).toBe("Amanhã");
    expect(relativeDay("2026-11-19", "2026-11-19")).toBe("Hoje");
    expect(relativeDay("2026-11-25", "2026-11-19")).toBeNull();
  });
});
