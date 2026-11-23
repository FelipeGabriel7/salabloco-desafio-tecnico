import { describe, expect, it } from "vitest";
import { addDaysStr, dateOf, fmtDayShort, isValidDate, timeOf, toIso } from "@/services/time";

const timezone = "America/Sao_Paulo";

describe("horário do coworking", () => {
  it("converte horário local de São Paulo para UTC e volta para exibição", () => {
    const iso = toIso("2026-11-20", "09:30", timezone);
    expect(iso).toBe("2026-11-20T12:30:00.000Z");
    expect(dateOf(iso, timezone)).toBe("2026-11-20");
    expect(timeOf(iso, timezone)).toBe("09:30");
  });

  it("mantém o dia local quando o horário local vira o dia seguinte em UTC", () => {
    const iso = toIso("2026-11-20", "23:30", timezone);
    expect(iso).toBe("2026-11-21T02:30:00.000Z");
    expect(dateOf(iso, timezone)).toBe("2026-11-20");
  });
});

describe("datas mostradas no formulário", () => {
  it("aceita data existente e recusa datas impossíveis", () => {
    expect(isValidDate("2026-11-20")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("20-11-2026")).toBe(false);
  });

  it("soma dias atravessando o mês", () => {
    expect(addDaysStr("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysStr("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("mostra o dia da semana", () => {
    expect(fmtDayShort("2026-11-20")).toBe("sex., 20 nov");
  });
});
