import { CLOSING_MINUTE, OPENING_MINUTE } from "@/utils/booking";
import { isoAtMinute, minuteOfDay } from "@/utils/time";
import type { Booking, BusySlot, Room } from "@/utils/types";
import type { Span } from "./suggest";

/** Janela exibida na agenda: o expediente do coworking. */
export const WINDOW_START = OPENING_MINUTE;
export const WINDOW_END = CLOSING_MINUTE;
export const WINDOW_SPAN = WINDOW_END - WINDOW_START;

export type BusySpan = Span & { own: boolean; title?: string };

const ROOM_COLORS = 5;

export const pos = (minute: number) =>
  Math.max(0, Math.min(100, ((minute - WINDOW_START) / WINDOW_SPAN) * 100));

/** Cor da sala: uma por posição na lista, repetindo a cada cinco. */
export function roomColor(rooms: Room[], roomId: string): string {
  const i = Math.max(0, rooms.findIndex((r) => r.id === roomId));
  return `var(--room-${(i % ROOM_COLORS) + 1})`;
}

/**
 * A API pública só devolve intervalos. O front cruza com as próprias reservas para
 * pintar "sua empresa" sem receber nada de terceiros.
 */
export function toSpans(busy: BusySlot[], date: string, roomId: string, mine: Booking[]): BusySpan[] {
  return busy.map((slot) => {
    const own = mine.find((b) => b.roomId === roomId && b.startsAt === slot.startsAt && b.endsAt === slot.endsAt);
    return {
      s: minuteOfDay(slot.startsAt, date),
      e: minuteOfDay(slot.endsAt, date),
      own: !!own,
      title: own?.title,
    };
  });
}

export const isFutureMinute = (date: string, minute: number) =>
  Date.parse(isoAtMinute(date, minute)) > Date.now();

export const spansFree = (spans: Span[], s: number, e: number) => !spans.some((b) => s < b.e && b.s < e);

/** Janelas livres do dia (a partir de 30 minutos), dentro da janela visível. */
export function freeWindows(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.s - b.s);
  const out: Span[] = [];
  let cursor = WINDOW_START;
  for (const b of sorted) {
    if (b.s - cursor >= 30) out.push({ s: cursor, e: b.s });
    cursor = Math.max(cursor, b.e);
  }
  if (WINDOW_END - cursor >= 30) out.push({ s: cursor, e: WINDOW_END });
  return out;
}
