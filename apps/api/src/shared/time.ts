import { z } from "zod";

const dateSchema = z.string().date();

export function validDay(value: unknown): value is string {
  return typeof value === "string" && dateSchema.safeParse(value).success;
}

export function localParts(value: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  return {
    year: parts.find((part) => part.type === "year")!.value,
    month: parts.find((part) => part.type === "month")!.value,
    day: parts.find((part) => part.type === "day")!.value,
    hour: parts.find((part) => part.type === "hour")!.value,
    minute: parts.find((part) => part.type === "minute")!.value,
  };
}

export function localDateTimeToUtc(date: string, hour: number, minute: number, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const localTime = localParts(new Date(localAsUtc), timezone);

  const formattedAsUtc = Date.UTC(
    Number(localTime.year),
    Number(localTime.month) - 1,
    Number(localTime.day),
    Number(localTime.hour),
    Number(localTime.minute),
  );

  return new Date(localAsUtc + localAsUtc - formattedAsUtc);
}

export function isWithinOpeningHours(start: number, end: number, timezone: string) {
  const startLocal = localParts(new Date(start), timezone);
  const endLocal = localParts(new Date(end), timezone);
  const isSameDay = startLocal.year === endLocal.year && startLocal.month === endLocal.month && startLocal.day === endLocal.day;
  const startMinute = Number(startLocal.hour) * 60 + Number(startLocal.minute);
  const endMinute = Number(endLocal.hour) * 60 + Number(endLocal.minute);

  const endsAtClosing = endMinute === 1320 && end % 60_000 === 0;
  return isSameDay && startMinute >= 420 && (endMinute < 1320 || endsAtClosing);
}

export function getDayRange(date: string, timezone: string) {
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDate = nextDay.toISOString().slice(0, 10);

  return {
    start: localDateTimeToUtc(date, 0, 0, timezone).getTime(),
    end: localDateTimeToUtc(nextDate, 0, 0, timezone).getTime(),
  };
}

export function overlaps(firstStart: number, firstEnd: number, secondStart: number, secondEnd: number,): boolean {
  return (firstStart < secondEnd) && (secondStart < firstEnd);
}
