import { describe, expect, it } from "vitest";
import { CellState, PERIODS, PickWarning, buildCells, cellsOfPeriod, periodOf, pickCell } from "./slotGrid";

const at = (h: number, m = 0) => h * 60 + m;
const never = () => false;

describe("buildCells", () => {
  it("cobre o expediente (07h às 22h) em células de 30 minutos", () => {
    const cells = buildCells([], never);
    expect(cells).toHaveLength(30);
    expect(cells.at(-1)).toMatchObject({ s: at(21, 30), e: at(22) });
    expect(cells[0]).toMatchObject({ s: at(7), e: at(7, 30), state: CellState.FREE });
  });

  it("marca ocupado, da empresa e passado", () => {
    const cells = buildCells(
      [
        { s: at(9), e: at(10), own: true },
        { s: at(11), e: at(11, 30), own: false },
      ],
      (minute) => minute < at(8),
    );
    const state = (s: number) => cells.find((c) => c.s === s)!.state;
    expect(state(at(7))).toBe(CellState.PAST);
    expect(state(at(9))).toBe(CellState.OWN);
    expect(state(at(9, 30))).toBe(CellState.OWN);
    expect(state(at(10))).toBe(CellState.FREE);
    expect(state(at(11))).toBe(CellState.BUSY);
    expect(state(at(11, 30))).toBe(CellState.FREE);
  });
});

describe("pickCell", () => {
  const cells = buildCells([{ s: at(12), e: at(13), own: false }], never);
  const cell = (s: number) => cells.find((c) => c.s === s)!;

  it("primeiro clique marca o início com 30 minutos e guarda a âncora", () => {
    expect(pickCell(cells, null, cell(at(9)))).toEqual({ anchor: at(9), range: { s: at(9), e: at(9, 30) }, warning: null });
  });

  it("segundo clique estica até o fim da célula clicada", () => {
    expect(pickCell(cells, at(9), cell(at(10)))).toEqual({ anchor: null, range: { s: at(9), e: at(10, 30) }, warning: null });
  });

  it("clicar na mesma célula confirma 30 minutos", () => {
    expect(pickCell(cells, at(9), cell(at(9)))).toEqual({ anchor: null, range: { s: at(9), e: at(9, 30) }, warning: null });
  });

  it("clique antes da âncora recomeça, sem aviso", () => {
    expect(pickCell(cells, at(10), cell(at(9)))).toEqual({ anchor: at(9), range: { s: at(9), e: at(9, 30) }, warning: null });
  });

  it("horário ocupado no meio: recomeça no clique e avisa", () => {
    expect(pickCell(cells, at(11), cell(at(13)))).toEqual({
      anchor: at(13),
      range: { s: at(13), e: at(13, 30) },
      warning: PickWarning.BLOCKED,
    });
  });

  it("o fim é exclusivo: terminar às 16:00 ocupa até a célula das 15:30 e deixa a das 16:00 livre", () => {
    const open = buildCells([], never);
    const click = (s: number) => open.find((c) => c.s === s)!;
    const result = pickCell(open, at(12), click(at(15, 30)));
    expect(result.range).toEqual({ s: at(12), e: at(16) });
    // outra reserva que começa às 16:00 não se sobrepõe (intervalo semiaberto)
    expect(result.range!.e <= at(16)).toBe(true);
  });

  it("4 horas exatas passam", () => {
    expect(pickCell(cells, at(14), cell(at(17, 30))).range).toEqual({ s: at(14), e: at(18) });
  });

  it("mais de 4 horas: recusa, avisa e mantém o início", () => {
    expect(pickCell(cells, at(14), cell(at(18)))).toEqual({ anchor: at(14), range: null, warning: PickWarning.TOO_LONG });
  });

  it("o segundo clique pode estar em outro período (manhã até tarde)", () => {
    const open = buildCells([], never);
    const click = (s: number) => open.find((c) => c.s === s)!;
    expect(pickCell(open, at(11), click(at(12))).range).toEqual({ s: at(11), e: at(12, 30) });
  });
});

describe("periodOf", () => {
  it("manhã até 12h, tarde até 18h, noite depois", () => {
    expect(periodOf(at(7)).id).toBe("morning");
    expect(periodOf(at(11, 30)).id).toBe("morning");
    expect(periodOf(at(12)).id).toBe("afternoon");
    expect(periodOf(at(18)).id).toBe("evening");
    expect(periodOf(at(21, 30)).id).toBe("evening");
  });
});

describe("períodos", () => {
  it("dividem as células sem repetir nem deixar nenhuma de fora", () => {
    const cells = buildCells([], never);
    const grouped = PERIODS.flatMap((p) => cellsOfPeriod(cells, p));
    expect(grouped).toEqual(cells);
  });
});
