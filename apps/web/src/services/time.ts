function localParts(value: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
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

export function dateOf(value: string | Date, timezone: string) {
  const parts = localParts(value, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function timeOf(value: string | Date, timezone: string) {
  const parts = localParts(value, timezone);
  return `${parts.hour}:${parts.minute}`;
}

export function todayStr(timezone: string) {
  return dateOf(new Date(), timezone);
}

export function toIso(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const local = localParts(new Date(localAsUtc), timezone);

  const formattedAsUtc = Date.UTC(
    Number(local.year),
    Number(local.month) - 1,
    Number(local.day),
    Number(local.hour),
    Number(local.minute),
  );

  return new Date(localAsUtc + localAsUtc - formattedAsUtc).toISOString();
}

export function isValidDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDaysStr(date: string, days: number) {
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + days);
  return nextDay.toISOString().slice(0, 10);
}

export function fmtDayShort(date: string) {
  const weekdays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const day = new Date(`${date}T12:00:00Z`);
  const [, month, dateNumber] = date.split("-");

  return `${weekdays[day.getUTCDay()]}, ${dateNumber} ${months[Number(month) - 1]}`;
}
