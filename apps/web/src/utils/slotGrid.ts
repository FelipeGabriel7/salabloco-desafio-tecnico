import { MAX_DURATION_MIN } from "@/utils/booking";
import { WINDOW_END, WINDOW_START, type BusySpan } from "./timeline";

export const SLOT_STEP_MIN = 30;

export enum CellState {
  FREE = "free",
  OWN = "own",
  BUSY = "busy",
  PAST = "past",
}

export type Cell = { s: number; e: number; state: CellState };
export type Range = { s: number; e: number };

const stateOf = (taken: BusySpan | undefined, past: boolean): CellState => {
  if (taken) return taken.own ? CellState.OWN : CellState.BUSY;
  return past ? CellState.PAST : CellState.FREE;
};

/** Divide o dia visível em células de 30 minutos e diz o estado de cada uma. */
export function buildCells(spans: BusySpan[], isPast: (minute: number) => boolean): Cell[] {
  const count = (WINDOW_END - WINDOW_START) / SLOT_STEP_MIN;
  return Array.from({ length: count }, (_, i) => {
    const s = WINDOW_START + i * SLOT_STEP_MIN;
    const e = s + SLOT_STEP_MIN;
    const taken = spans.find((b) => s < b.e && b.s < e);
    return { s, e, state: stateOf(taken, isPast(s)) };
  });
}

export enum PickWarning {
  /** O fim escolhido passaria de 4 horas. */
  TOO_LONG = "too-long",
  /** Há horário ocupado entre o início e o fim escolhidos. */
  BLOCKED = "blocked",
}

export type PickResult = {
  /** Início já escolhido, esperando o clique do fim. null = nada pendente. */
  anchor: number | null;
  /** Novo horário para o formulário. null = o clique foi recusado e nada muda. */
  range: Range | null;
  /** Motivo da recusa, para avisar a pessoa. */
  warning: PickWarning | null;
};

const startPick = (cell: Cell, warning: PickWarning | null = null): PickResult => ({
  anchor: cell.s,
  range: { s: cell.s, e: cell.e },
  warning,
});

/**
 * Dois cliques: o primeiro marca o início (30 min), o segundo estica até o fim.
 * - Passaria de 4 horas: recusa e mantém o início, para a pessoa escolher um fim mais perto.
 * - Há horário ocupado no meio: recomeça no clique e avisa.
 */
export function pickCell(cells: Cell[], anchor: number | null, clicked: Cell): PickResult {
  const startsNewPick = anchor === null || clicked.s < anchor;
  if (startsNewPick) return startPick(clicked);

  if (clicked.e - anchor > MAX_DURATION_MIN) return { anchor, range: null, warning: PickWarning.TOO_LONG };

  const between = cells.filter((c) => c.s >= anchor && c.e <= clicked.e);
  const allFree = between.every((c) => c.state === CellState.FREE);
  if (!allFree) return startPick(clicked, PickWarning.BLOCKED);

  return { anchor: null, range: { s: anchor, e: clicked.e }, warning: null };
}

/** Períodos do dia, para agrupar as células na tela. Cobrem a janela inteira, sem sobra. */
export const PERIODS = [
  { id: "morning", label: "Manhã", from: WINDOW_START, to: 720 },
  { id: "afternoon", label: "Tarde", from: 720, to: 1080 },
  { id: "evening", label: "Noite", from: 1080, to: WINDOW_END },
] as const;

export type Period = (typeof PERIODS)[number];

export const cellsOfPeriod = (cells: Cell[], period: Period): Cell[] =>
  cells.filter((c) => c.s >= period.from && c.s < period.to);

/** Período que contém um minuto do dia (o primeiro, se o minuto estiver fora da janela). */
export const periodOf = (minute: number): Period =>
  PERIODS.find((p) => minute >= p.from && minute < p.to) ?? PERIODS[0];
