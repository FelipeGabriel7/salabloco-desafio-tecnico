/**
 * Datas e horas do coworking. Tudo é interpretado no fuso de São Paulo, não no do
 * navegador. A API guarda ISO em UTC. São Paulo está em UTC-3 o ano todo (sem horário
 * de verão desde 2019), então o deslocamento pode ser fixo.
 */
export const TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";
export const MIN = 60_000;
export const DAY_MIN = 1440;

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parts(value: string | number | Date) {
  const out: Record<string, string> = {};
  for (const p of formatter.formatToParts(new Date(value))) out[p.type] = p.value;
  return out;
}

/** AAAA-MM-DD no fuso do coworking. */
export function dateOf(value: string | number | Date): string {
  const p = parts(value);
  return `${p.year}-${p.month}-${p.day}`;
}

/** HH:MM no fuso do coworking. */
export function timeOf(value: string | number | Date): string {
  const p = parts(value);
  return `${p.hour}:${p.minute}`;
}

export const todayStr = (now: Date = new Date()) => dateOf(now);

/** Data (AAAA-MM-DD) + hora (HH:MM) do coworking vira ISO em UTC. */
export function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00${OFFSET}`).toISOString();
}

export const dayStartMs = (date: string) => new Date(`${date}T00:00:00${OFFSET}`).getTime();

export function isoAtMinute(date: string, minute: number): string {
  return new Date(dayStartMs(date) + minute * MIN).toISOString();
}

/** Minuto do dia (0 a 1440) de um instante, relativo ao dia informado. */
export function minuteOfDay(iso: string, date: string): number {
  const m = (Date.parse(iso) - dayStartMs(date)) / MIN;
  return Math.max(0, Math.min(DAY_MIN, m));
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00${OFFSET}`);
  return !Number.isNaN(d.getTime()) && dateOf(d) === value;
}

export function addDaysStr(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00${OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return dateOf(d);
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fmtMinutes(minutes: number): string {
  const m = Math.round(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  if (!h) return `${r}min`;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}

const WEEKDAYS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "sex., 20 nov" */
export function fmtDayShort(date: string): string {
  const d = new Date(`${date}T12:00:00${OFFSET}`);
  const [, mm, dd] = date.split("-");
  return `${WEEKDAYS[d.getUTCDay()]}, ${dd} ${MONTHS[Number(mm) - 1]}`;
}

export function relativeDay(date: string, today: string = todayStr()): "Hoje" | "Amanhã" | null {
  if (date === today) return "Hoje";
  if (date === addDaysStr(today, 1)) return "Amanhã";
  return null;
}

/** Minuto do dia do instante atual, no fuso do coworking. */
export function nowMinute(now: Date = new Date()): number {
  return hhmmToMinutes(timeOf(now));
}
