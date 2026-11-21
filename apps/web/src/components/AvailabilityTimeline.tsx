import { useRef, useState } from "react";
import { fmtMinutes } from "@/utils/time";
import { Badge } from "@/components/ui/misc";
import {
  WINDOW_END,
  WINDOW_SPAN,
  WINDOW_START,
  isFutureMinute,
  pos,
  spansFree,
  type BusySpan,
} from "@/utils/timeline";
import { cn } from "@/utils/cn";

const HOURS = [8, 10, 12, 14, 16, 18, 20];

export function TimelineTicks() {
  return (
    <div className="relative h-4" aria-hidden="true">
      {HOURS.map((h) => (
        <span
          key={h}
          className="absolute top-0.5 -translate-x-1/2 font-mono text-[11px] text-muted-foreground"
          style={{ left: `${pos(h * 60)}%` }}
        >
          {String(h).padStart(2, "0")}h
        </span>
      ))}
    </div>
  );
}

type Pick = { s: number; e: number };

/**
 * Uma sala em um dia. Blocos cheios são da sua empresa, hachurados são de outras.
 * Com `onPick`, passar o mouse mostra o horário livre e clicar escolhe.
 */
export function AvailabilityTimeline({
  spans,
  color,
  date,
  label,
  candidate,
  candidateBad,
  onPick,
  showTicks = true,
}: {
  spans: BusySpan[];
  color: string;
  date: string;
  label: string;
  candidate?: Pick | null;
  candidateBad?: boolean;
  onPick?: (pick: Pick) => void;
  showTicks?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<Pick | null>(null);

  function compute(clientX: number): Pick | null {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(0.999, Math.max(0, (clientX - r.left) / r.width));
    const s = WINDOW_START + Math.floor((x * WINDOW_SPAN) / 30) * 30;
    if (!isFutureMinute(date, s)) return null;
    if (s + 60 <= WINDOW_END && spansFree(spans, s, s + 60)) return { s, e: s + 60 };
    if (spansFree(spans, s, s + 30)) return { s, e: s + 30 };
    return null;
  }

  return (
    <div>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        onMouseMove={onPick ? (e) => setGhost(compute(e.clientX)) : undefined}
        onMouseLeave={onPick ? () => setGhost(null) : undefined}
        onClick={onPick ? () => ghost && onPick(ghost) : undefined}
        className={cn(
          "lane-grid relative h-[50px] overflow-hidden rounded-[10px] border bg-card",
          onPick && (ghost ? "cursor-pointer" : "cursor-not-allowed"),
        )}
      >
        {spans.map((b, i) => (
          <div
            key={i}
            title={b.own ? `${b.title ?? "Sua reserva"} (${fmtMinutes(b.s)} às ${fmtMinutes(b.e)})` : `Ocupado ${fmtMinutes(b.s)} às ${fmtMinutes(b.e)}`}
            className={cn("absolute inset-y-[7px] rounded-[7px]", !b.own && "hatch")}
            style={{
              left: `${pos(b.s)}%`,
              width: `${pos(b.e) - pos(b.s)}%`,
              background: b.own ? color : `color-mix(in srgb, ${color} 38%, var(--card))`,
            }}
          />
        ))}
        {candidate ? (
          <div
            className={cn(
              "absolute inset-y-1 rounded-lg border-2 border-dashed",
              candidateBad ? "border-destructive bg-destructive-soft" : "border-primary bg-accent",
            )}
            style={{ left: `${pos(candidate.s)}%`, width: `${Math.max(1.5, pos(candidate.e) - pos(candidate.s))}%` }}
          />
        ) : null}
        {ghost ? (
          <div
            className="pointer-events-none absolute inset-y-[5px] grid place-items-center overflow-hidden rounded-lg border-2 border-dashed border-primary bg-accent font-mono text-[11px] font-semibold text-accent-foreground"
            style={{ left: `${pos(ghost.s)}%`, width: `${pos(ghost.e) - pos(ghost.s)}%` }}
          >
            <span className="whitespace-nowrap">
              {ghost.e - ghost.s === 60 ? fmtMinutes(ghost.s) : `${fmtMinutes(ghost.s)}–${fmtMinutes(ghost.e)}`}
            </span>
          </div>
        ) : null}
      </div>
      {showTicks ? <TimelineTicks /> : null}
    </div>
  );
}

export function TimelineLegend({ color, showCandidate, bad }: { color: string; showCandidate?: boolean; bad?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <i className="inline-block size-3.5 rounded" style={{ background: color }} />
        Sua empresa
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="hatch inline-block size-3.5 rounded" style={{ background: `color-mix(in srgb, ${color} 38%, var(--card))` }} />
        Outras empresas
      </span>
      {showCandidate ? (
        <span className="inline-flex items-center gap-1.5">
          <i
            className={cn(
              "inline-block size-3.5 rounded border-2 border-dashed",
              bad ? "border-destructive bg-destructive-soft" : "border-primary bg-accent",
            )}
          />
          {bad ? "Seu horário em conflito" : "Seu horário"}
        </span>
      ) : null}
    </div>
  );
}

export function SlotList({ spans }: { spans: BusySpan[] }) {
  if (!spans.length) {
    return (
      <ul className="grid gap-1.5">
        <li className="flex justify-between rounded-[10px] bg-success-soft px-3 py-2 text-[13px] text-success">
          <span>Livre o dia todo</span>
          <span className="tabular-nums">00:00 – 24:00</span>
        </li>
      </ul>
    );
  }
  return (
    <ul className="grid gap-1.5">
      {[...spans]
        .sort((a, b) => a.s - b.s)
        .map((b, i) => (
          <li key={i} className="flex items-center justify-between rounded-[10px] border px-3 py-2 text-[13px] tabular-nums">
            <span>
              {fmtMinutes(b.s)} – {fmtMinutes(b.e)}
            </span>
            <Badge className={b.own ? "" : "bg-transparent text-muted-foreground ring-1 ring-border"}>
              {b.own ? "Sua empresa" : "Ocupado"}
            </Badge>
          </li>
        ))}
    </ul>
  );
}
