import { useState } from "react";
import { DOMAIN_MESSAGES, MAX_DURATION_MIN } from "@/utils/booking";
import { fmtDuration, fmtMinutes } from "@/utils/time";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/input";
import {
  CellState,
  PERIODS,
  PickWarning,
  cellsOfPeriod,
  periodOf,
  pickCell,
  type Cell,
  type Period,
  type Range,
} from "@/utils/slotGrid";
import { cn } from "@/utils/cn";

const CELL_LABEL: Record<CellState, string> = {
  [CellState.FREE]: "livre",
  [CellState.OWN]: "sua empresa",
  [CellState.BUSY]: "ocupado",
  [CellState.PAST]: "já passou",
};

/** Texto pequeno sob o horário. Livre e passado não precisam de legenda. */
const CELL_CAPTION: Record<CellState, string> = {
  [CellState.FREE]: "",
  [CellState.OWN]: "sua",
  [CellState.BUSY]: "ocupado",
  [CellState.PAST]: "",
};

const CELL_STYLE: Record<CellState, string> = {
  [CellState.FREE]:
    "border-input bg-card text-foreground hover:-translate-y-px hover:border-primary hover:bg-accent hover:shadow-sm",
  [CellState.OWN]: "cursor-not-allowed border-transparent text-white",
  [CellState.BUSY]: "hatch cursor-not-allowed border-border bg-muted text-muted-foreground",
  [CellState.PAST]: "cursor-not-allowed border-transparent bg-muted/40 text-muted-foreground/45",
};

const WARNING_TITLE: Record<PickWarning, string> = {
  [PickWarning.TOO_LONG]: "Período maior que 4 horas",
  [PickWarning.BLOCKED]: "Há um horário ocupado no meio",
};

const warningText = (warning: PickWarning, anchor: number | null): string =>
  warning === PickWarning.TOO_LONG
    ? `${DOMAIN_MESSAGES.DURATION_TOO_LONG}. Escolha um fim até as ${fmtMinutes((anchor ?? 0) + MAX_DURATION_MIN)}.`
    : "Começamos de novo a partir do horário que você clicou. Escolha um fim que não passe por um horário ocupado.";

const isInside = (cell: Cell, range: Range | null) => !!range && cell.s >= range.s && cell.e <= range.e;

/**
 * Agenda do dia. Um dropdown escolhe o período (manhã, tarde ou noite) e a grade mostra só
 * as células de 30 minutos dele. Primeiro clique marca o início, o segundo marca o fim.
 * Só propõe: o formulário continua sendo a fonte do horário (`selection`) e o servidor decide.
 */
export function SlotPicker({
  cells,
  selection,
  color,
  label,
  onChange,
}: {
  cells: Cell[];
  selection: Range | null;
  color: string;
  label: string;
  onChange: (range: Range) => void;
}) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const [warning, setWarning] = useState<PickWarning | null>(null);
  const [periodId, setPeriodId] = useState<Period["id"]>(() => periodOf(selection?.s ?? 0).id);
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[0];

  function handlePick(cell: Cell) {
    const result = pickCell(cells, anchor, cell);
    setAnchor(result.anchor);
    setWarning(result.warning);
    if (result.range) onChange(result.range);
  }

  function restart() {
    setAnchor(null);
    setWarning(null);
  }

  return (
    <div className="grid gap-4">
      <Summary anchor={anchor} selection={selection} onRestart={restart} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="period" className="text-sm font-semibold">
          Período do dia
        </label>
        <Select
          id="period"
          value={periodId}
          onChange={(e) => {
            setPeriodId(e.target.value as Period["id"]);
            setWarning(null);
          }}
          className="w-full sm:w-56"
        >
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} · {fmtMinutes(p.from)} às {fmtMinutes(p.to)}
            </option>
          ))}
        </Select>
      </div>

      <div role="group" aria-label={`${label}, ${period.label.toLowerCase()}`} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cellsOfPeriod(cells, period).map((cell) => (
          <CellButton
            key={cell.s}
            cell={cell}
            color={color}
            selected={isInside(cell, selection)}
            choosingEnd={anchor !== null}
            beforeStart={anchor !== null && cell.e <= anchor}
            onPick={handlePick}
          />
        ))}
      </div>

      {warning ? (
        <Alert variant="destructive" title={WARNING_TITLE[warning]}>
          {warningText(warning, anchor)}
        </Alert>
      ) : null}

      <Legend color={color} />
    </div>
  );
}

/**
 * Escolhendo o início, a célula mostra a hora em que ela começa.
 * Escolhendo o fim, mostra a hora em que ela termina: o que está escrito no botão é o fim da reserva.
 */
function CellButton({
  cell,
  color,
  selected,
  choosingEnd,
  beforeStart,
  onPick,
}: {
  cell: Cell;
  color: string;
  selected: boolean;
  choosingEnd: boolean;
  beforeStart: boolean;
  onPick: (cell: Cell) => void;
}) {
  const caption = CELL_CAPTION[cell.state];
  const time = fmtMinutes(choosingEnd ? cell.e : cell.s);
  const action = choosingEnd ? "terminar às" : "começar às";
  return (
    <button
      type="button"
      disabled={cell.state !== CellState.FREE || beforeStart}
      aria-pressed={selected}
      aria-label={`${action} ${time}, ${CELL_LABEL[cell.state]}`}
      onClick={() => onPick(cell)}
      style={cell.state === CellState.OWN ? { background: color } : undefined}
      className={cn(
        "grid min-h-12 place-content-center rounded-xl border text-sm font-bold tabular-nums outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        CELL_STYLE[cell.state],
        selected && "border-primary bg-primary text-primary-foreground shadow-sm hover:translate-y-0 hover:bg-primary",
      )}
    >
      <span className={cn(cell.state === CellState.BUSY && "line-through decoration-1")}>{time}</span>
      {caption ? <span className="-mt-0.5 text-[10px] leading-none font-semibold uppercase opacity-80">{caption}</span> : null}
    </button>
  );
}

/** Faixa grande com o horário escolhido: é o que a pessoa precisa enxergar primeiro. */
function Summary({
  anchor,
  selection,
  onRestart,
}: {
  anchor: number | null;
  selection: Range | null;
  onRestart: () => void;
}) {
  const pending = anchor !== null;
  const headline = pending
    ? `Início às ${fmtMinutes(anchor)}. Agora escolha a hora de fim`
    : selection
      ? "Seu horário"
      : "Clique no horário de início";
  const range = selection ? `${fmtMinutes(selection.s)} – ${fmtMinutes(selection.e)}` : "-- : --";

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-sm"
      aria-live="polite"
    >
      <div className="grid gap-0.5">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase opacity-80">{headline}</p>
        <p className="font-display text-[32px] leading-none font-extrabold tabular-nums">{range}</p>
      </div>
      {pending ? (
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold outline-none hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white"
        >
          Escolher outro início
        </button>
      ) : selection ? (
        <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold tabular-nums">
          {fmtDuration(selection.e - selection.s)}
        </span>
      ) : null}
    </div>
  );
}

function Legend({ color }: { color: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3.5 rounded border bg-card" />
        Livre
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3.5 rounded bg-primary" />
        Selecionado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3.5 rounded" style={{ background: color }} />
        Sua empresa
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="hatch inline-block size-3.5 rounded border" />
        Ocupado
      </span>
    </div>
  );
}
