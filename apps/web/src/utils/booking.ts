import { MIN, hhmmToMinutes, timeOf } from "./time";

/**
 * Regras de reserva. Funções puras: sem HTTP, sem framework, sem relógio global
 * (o "agora" entra como parâmetro). A mesma lógica roda no mock do front e vai
 * para o server quando ele existir.
 */
export const MIN_DURATION_MIN = 30;
export const MAX_DURATION_MIN = 240;

/** Expediente do coworking: das 07:00 às 22:00. Decisão de negócio (ver 01-requisitos). */
export const OPENING_MINUTE = 7 * 60;
export const CLOSING_MINUTE = 22 * 60;

export type Interval = { startsAt: string; endsAt: string };

export type DomainCode =
  | "END_BEFORE_START"
  | "DURATION_TOO_SHORT"
  | "DURATION_TOO_LONG"
  | "OUTSIDE_OPENING_HOURS"
  | "IN_THE_PAST";

export const DOMAIN_MESSAGES: Record<DomainCode, string> = {
  END_BEFORE_START: "O fim deve ser depois do início",
  DURATION_TOO_SHORT: "A reserva deve ter no mínimo 30 minutos",
  DURATION_TOO_LONG: "A reserva deve ter no máximo 4 horas",
  OUTSIDE_OPENING_HOURS: "O coworking funciona das 07:00 às 22:00",
  IN_THE_PAST: "Não é possível reservar no passado",
};

/** Campo da API ao qual cada erro de domínio pertence. */
export const DOMAIN_FIELD: Record<DomainCode, "startsAt" | "endsAt"> = {
  END_BEFORE_START: "endsAt",
  DURATION_TOO_SHORT: "endsAt",
  DURATION_TOO_LONG: "endsAt",
  OUTSIDE_OPENING_HOURS: "startsAt",
  IN_THE_PAST: "startsAt",
};

/**
 * Intervalo semiaberto [início, fim): 10:00–11:00 e 11:00–12:00 não se sobrepõem.
 */
export function overlaps(a: Interval, b: Interval): boolean {
  return Date.parse(a.startsAt) < Date.parse(b.endsAt) && Date.parse(b.startsAt) < Date.parse(a.endsAt);
}

export function findConflict<T extends Interval & { roomId: string }>(
  existing: readonly T[],
  candidate: Interval & { roomId: string },
): T | undefined {
  return existing.find((b) => b.roomId === candidate.roomId && overlaps(b, candidate));
}

type RuleInput = { start: number; end: number; minutes: number; startMinute: number; now: number };

/**
 * Regras em forma de tabela, na ordem em que são avaliadas: a primeira violada vence.
 * Regra nova é uma linha nova, sem mexer em cadeia de `if`.
 */
const RULES: ReadonlyArray<{ code: DomainCode; violated: (r: RuleInput) => boolean }> = [
  { code: "END_BEFORE_START", violated: (r) => r.end <= r.start },
  { code: "DURATION_TOO_SHORT", violated: (r) => r.minutes < MIN_DURATION_MIN },
  { code: "DURATION_TOO_LONG", violated: (r) => r.minutes > MAX_DURATION_MIN },
  {
    code: "OUTSIDE_OPENING_HOURS",
    violated: (r) => r.startMinute < OPENING_MINUTE || r.startMinute + r.minutes > CLOSING_MINUTE,
  },
  { code: "IN_THE_PAST", violated: (r) => r.start < r.now },
];

/** Devolve o primeiro código de regra violado, ou null se a reserva é válida. */
export function checkRules(input: Interval, now: Date): DomainCode | null {
  const start = Date.parse(input.startsAt);
  const end = Date.parse(input.endsAt);
  const context: RuleInput = {
    start,
    end,
    minutes: (end - start) / MIN,
    startMinute: hhmmToMinutes(timeOf(start)),
    now: now.getTime(),
  };
  return RULES.find((rule) => rule.violated(context))?.code ?? null;
}
