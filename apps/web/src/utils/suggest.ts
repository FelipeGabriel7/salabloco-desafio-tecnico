import { CLOSING_MINUTE, OPENING_MINUTE } from "@/utils/booking";

export type Span = { s: number; e: number };
export type Suggestion = { roomId: string; s: number; e: number };

type Args = {
  roomId: string;
  roomIds: string[];
  busyByRoom: Record<string, Span[]>;
  s: number;
  e: number;
  /** Menor minuto permitido (hoje, não sugerir horário que já passou). */
  earliest?: number;
  windowStart?: number;
  windowEnd?: number;
  step?: number;
  limitSame?: number;
  limitOther?: number;
};

const isFree = (busy: Span[] | undefined, s: number, e: number) =>
  !(busy ?? []).some((b) => s < b.e && b.s < e);

/**
 * Quando há conflito: horários livres mais próximos na mesma sala (mesma duração)
 * e outras salas livres no horário pedido.
 */
export function suggestSlots(a: Args): Suggestion[] {
  const {
    roomId,
    roomIds,
    busyByRoom,
    s,
    e,
    earliest = 0,
    windowStart = OPENING_MINUTE,
    windowEnd = CLOSING_MINUTE,
    step = 30,
    limitSame = 2,
    limitOther = 2,
  } = a;
  const len = e - s;

  const same: Array<Suggestion & { d: number }> = [];
  for (let c = windowStart; c + len <= windowEnd; c += step) {
    if (c === s || c < earliest) continue;
    if (isFree(busyByRoom[roomId], c, c + len)) same.push({ roomId, s: c, e: c + len, d: Math.abs(c - s) });
  }
  same.sort((x, y) => x.d - y.d);

  const others: Suggestion[] =
    s >= earliest
      ? roomIds.filter((id) => id !== roomId && isFree(busyByRoom[id], s, e)).map((id) => ({ roomId: id, s, e }))
      : [];

  return [
    ...same.slice(0, limitSame).map(({ roomId: r, s: ss, e: ee }) => ({ roomId: r, s: ss, e: ee })),
    ...others.slice(0, limitOther),
  ];
}
