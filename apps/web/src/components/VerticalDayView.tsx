import { useRef, type MouseEvent } from "react";
import { fmtMinutes, nowMinute, todayStr } from "@/utils/time";
import {
  WINDOW_END,
  WINDOW_SPAN,
  WINDOW_START,
  isFutureMinute,
  spansFree,
  type BusySpan,
} from "@/utils/timeline";
import { cn } from "@/utils/cn";

const HOUR_PX = 56;
const LABEL_W = 52;
const HOURS = Array.from({ length: WINDOW_SPAN / 60 }, (_, i) => WINDOW_START / 60 + i);

type Pick = { s: number; e: number };

/**
 * Visão de dia para telas estreitas: horas na vertical, uma sala por vez.
 * Tocar num horário livre escolhe o início (uma hora, ou meia hora se for o que cabe).
 */
export function VerticalDayView({
  spans,
  color,
  date,
  label,
  onPick,
  onBlocked,
}: {
  spans: BusySpan[];
  color: string;
  date: string;
  label: string;
  onPick: (pick: Pick) => void;
  onBlocked: (reason: "past" | "busy") => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const total = (WINDOW_SPAN / 60) * HOUR_PX;
  const y = (m: number) => ((m - WINDOW_START) / 60) * HOUR_PX;
  const now = date === todayStr() ? nowMinute() : null;

  function handle(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rel = Math.max(0, Math.min(total - 1, e.clientY - el.getBoundingClientRect().top));
    const s = WINDOW_START + Math.floor(((rel / HOUR_PX) * 60) / 30) * 30;
    if (!isFutureMinute(date, s)) return onBlocked("past");
    if (s + 60 <= WINDOW_END && spansFree(spans, s, s + 60)) return onPick({ s, e: s + 60 });
    if (spansFree(spans, s, s + 30)) return onPick({ s, e: s + 30 });
    onBlocked("busy");
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      onClick={handle}
      className="relative cursor-pointer overflow-hidden rounded-xl border bg-card"
      style={{ height: total }}
    >
      {HOURS.map((h) => (
        <div key={h} aria-hidden="true">
          <div className="absolute right-0 border-t" style={{ top: y(h * 60), left: LABEL_W }} />
          <div className="absolute right-0 border-t border-dashed opacity-50" style={{ top: y(h * 60 + 30), left: LABEL_W }} />
          <span
            className="absolute left-2.5 -translate-y-1/2 font-mono text-[11px] text-muted-foreground"
            style={{ top: Math.max(y(h * 60), 8) }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        </div>
      ))}

      {now !== null && now > WINDOW_START ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 bg-background/60"
          style={{ height: Math.min(total, y(Math.min(now, WINDOW_END))) }}
        />
      ) : null}

      {spans.map((b, i) => {
        const height = Math.max(28, y(b.e) - y(b.s) - 2);
        return (
          <div
            key={i}
            className={cn(
              "absolute overflow-hidden rounded-lg border px-2.5 py-1.5 text-[13px] leading-tight",
              !b.own && "hatch border-dashed text-muted-foreground",
            )}
            style={{
              top: y(b.s) + 1,
              height,
              left: LABEL_W + 6,
              right: 8,
              borderColor: color,
              background: `color-mix(in srgb, ${color} ${b.own ? 30 : 14}%, var(--card))`,
            }}
          >
            <p className={cn("truncate font-semibold", b.own && "text-foreground")}>{b.own ? (b.title ?? "Sua reserva") : "Ocupado"}</p>
            {height >= 44 ? (
              <p className="truncate font-mono text-[11px] opacity-80">
                {fmtMinutes(b.s)} – {fmtMinutes(b.e)}
              </p>
            ) : null}
          </div>
        );
      })}

      {now !== null && now >= WINDOW_START && now <= WINDOW_END ? (
        <div aria-hidden="true" className="pointer-events-none absolute right-0 h-0.5 bg-destructive" style={{ top: y(now), left: LABEL_W - 4 }}>
          <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-destructive" />
        </div>
      ) : null}
    </div>
  );
}
