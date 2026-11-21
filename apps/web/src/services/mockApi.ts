import { z } from "zod";
import { DOMAIN_FIELD, DOMAIN_MESSAGES, checkRules, findConflict } from "@/utils/booking";
import { MIN, addDaysStr, dayStartMs, isValidDate, isoAtMinute, todayStr } from "@/utils/time";
import type { Booking, BusySlot, NewBookingInput, Room } from "@/utils/types";
import { ApiError, type Backend } from "./types";

/**
 * Back-end simulado no navegador. Aplica as mesmas regras que o server real vai aplicar:
 * autenticação (401, 403), validação (400), regras de domínio (422) e conflito (409).
 * Os dados ficam no localStorage e são recriados a cada dia.
 */
export const MOCK_EVENT = "salabloco:mock-changed";
const STORAGE_KEY = "salabloco:mock:v1";
const LATENCY_MS = 320;

/**
 * Tokens do modo mock. Vêm do ambiente (VITE_MOCK_TOKENS, no formato "empresa:token,empresa:token"),
 * nunca do código. Atenção: variáveis VITE_* vão para o JavaScript do navegador e são públicas.
 * Por isso só entram valores de demonstração, e só no modo mock.
 */
function parseMockTokens(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof raw !== "string") return out;
  for (const pair of raw.split(",")) {
    const [company, token] = pair.split(":").map((s) => s.trim());
    if (company && token) out[company] = token;
  }
  return out;
}

export const DEMO_TOKENS: Record<string, string> = parseMockTokens(import.meta.env.VITE_MOCK_TOKENS);

const ROOMS: Room[] = [
  { id: "savassi", name: "Sala Savassi", capacity: 6 },
  { id: "pampulha", name: "Sala Pampulha", capacity: 12 },
  { id: "curral", name: "Sala Serra do Curral", capacity: 4 },
  { id: "liberdade", name: "Auditório Liberdade", capacity: 20 },
  { id: "ufmg", name: "Sala UFMG", capacity: 8 },
];

export type MockMode = "normal" | "loading" | "error" | "empty";
let mode: MockMode = "normal";

export const mockControl = {
  getMode: () => mode,
  setMode(next: MockMode) {
    mode = next;
    window.dispatchEvent(new Event(MOCK_EVENT));
  },
  reset() {
    bookings = seed();
    persist();
    mode = "normal";
    window.dispatchEvent(new Event(MOCK_EVENT));
  },
};

function seed(): Booking[] {
  const today = todayStr();
  const make = (
    id: string,
    companyId: string,
    roomId: string,
    dayOffset: number,
    s: number,
    e: number,
    title: string,
    responsibleEmail: string,
  ): Booking => {
    const date = addDaysStr(today, dayOffset);
    return {
      id,
      companyId,
      roomId,
      startsAt: isoAtMinute(date, s),
      endsAt: isoAtMinute(date, e),
      title,
      responsibleEmail,
      createdAt: new Date().toISOString(),
    };
  };
  const ana = "ana.souza@acme.com.br";
  const rafael = "rafael.lima@acme.com.br";
  return [
    make("b1", "acme", "savassi", 1, 540, 630, "Planning semanal", ana),
    make("b2", "acme", "pampulha", 1, 840, 960, "Workshop de onboarding", ana),
    make("b3", "acme", "curral", 4, 660, 690, "1:1 com fornecedor", rafael),
    make("b4", "acme", "liberdade", 5, 900, 960, "Demo para investidores", rafael),
    make("p1", "acme", "savassi", -3, 600, 660, "Retrospectiva do mês", ana),
    make("p2", "acme", "pampulha", -1, 900, 990, "Alinhamento comercial", rafael),
    make("b5", "lumen", "savassi", 1, 660, 720, "Review de campanha", "bia@lumen.studio"),
    make("b6", "lumen", "curral", 1, 810, 870, "Briefing de cliente", "bia@lumen.studio"),
    make("b7", "lumen", "savassi", 0, 1020, 1080, "Fechamento de sprint", "bia@lumen.studio"),
    make("b8", "brisa", "pampulha", 1, 540, 750, "Fechamento trimestral", "carlos@brisacontab.com.br"),
    make("b9", "brisa", "liberdade", 2, 900, 1020, "Treinamento fiscal", "carlos@brisacontab.com.br"),
  ];
}

function load(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { day: string; bookings: Booking[] };
      if (saved.day === todayStr() && Array.isArray(saved.bookings)) return saved.bookings;
    }
  } catch {
    /* sem localStorage: segue com os dados iniciais */
  }
  return seed();
}

let bookings: Booking[] = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: todayStr(), bookings }));
  } catch {
    /* ignora */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simula latência e, para leituras, os estados "carregando" e "erro" do painel de demo. */
async function run<T>(fn: () => T, opts: { read?: boolean } = {}): Promise<T> {
  await sleep(LATENCY_MS);
  if (opts.read && mode === "loading") return new Promise<T>(() => undefined);
  if (opts.read && mode === "error") throw new ApiError(503, "NETWORK", "O servidor não respondeu.");
  return fn();
}

function authenticate(token: string, companyId?: string): string {
  const found = Object.entries(DEMO_TOKENS).find(([, t]) => t === token);
  if (!found) throw new ApiError(401, "UNAUTHORIZED", "Token inválido ou ausente.");
  if (companyId && companyId !== found[0]) throw new ApiError(403, "FORBIDDEN", "Você não tem acesso a esta empresa.");
  return found[0];
}

const bookingSchema = z.object({
  roomId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  title: z.string().trim().min(1).max(80),
  responsibleEmail: z.string().trim().email(),
});

export const mockBackend: Backend = {
  login(companyId, token) {
    return run(() => {
      const found = Object.entries(DEMO_TOKENS).find(([, t]) => t === token);
      if (!found || found[0] !== companyId) throw new ApiError(401, "UNAUTHORIZED", "Token inválido para esta empresa.");
    });
  },

  listRooms(token) {
    return run(() => {
      authenticate(token);
      return ROOMS.map((r) => ({ ...r }));
    }, { read: true });
  },

  availability(token, roomId, date) {
    return run(() => {
      authenticate(token);
      if (!isValidDate(date)) throw new ApiError(400, "INVALID_DATE", "Data inválida. Use AAAA-MM-DD.", "date");
      if (!ROOMS.some((r) => r.id === roomId)) throw new ApiError(404, "NOT_FOUND", "Sala não encontrada.");
      if (mode === "empty") return [] as BusySlot[];
      const start = dayStartMs(date);
      const end = start + 24 * 60 * MIN;
      return bookings
        .filter((b) => b.roomId === roomId && Date.parse(b.startsAt) < end && Date.parse(b.endsAt) > start)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((b): BusySlot => ({ startsAt: b.startsAt, endsAt: b.endsAt })); // só o intervalo
    }, { read: true });
  },

  listBookings(token, companyId) {
    return run(() => {
      authenticate(token, companyId);
      if (mode === "empty") return [] as Booking[];
      return bookings
        .filter((b) => b.companyId === companyId)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((b) => ({ ...b }));
    }, { read: true });
  },

  createBooking(token, companyId, input: NewBookingInput) {
    return run(() => {
      authenticate(token, companyId);
      const parsed = bookingSchema.safeParse(input);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new ApiError(400, "VALIDATION", "Dados inválidos.", String(issue.path[0] ?? ""));
      }
      const data = parsed.data;
      if (!ROOMS.some((r) => r.id === data.roomId)) throw new ApiError(422, "ROOM_NOT_FOUND", "Sala inexistente.", "roomId");
      const broken = checkRules(data, new Date());
      if (broken) throw new ApiError(422, broken, DOMAIN_MESSAGES[broken], DOMAIN_FIELD[broken]);
      // Checagem e gravação no mesmo trecho síncrono: sem corrida entre duas reservas.
      const clash = findConflict(bookings, data);
      if (clash) {
        throw new ApiError(409, "BOOKING_CONFLICT", "A sala já está reservada neste horário.", undefined, {
          startsAt: clash.startsAt,
          endsAt: clash.endsAt,
        });
      }
      const created: Booking = { id: crypto.randomUUID(), companyId, ...data, createdAt: new Date().toISOString() };
      bookings = [...bookings, created];
      persist();
      return { ...created };
    });
  },

  deleteBooking(token, companyId, id) {
    return run(() => {
      authenticate(token, companyId);
      // Reserva de outra empresa responde 404, igual a inexistente: não revela que o id existe.
      const target = bookings.find((b) => b.id === id && b.companyId === companyId);
      if (!target) throw new ApiError(404, "NOT_FOUND", "Reserva não encontrada.");
      bookings = bookings.filter((b) => b.id !== id);
      persist();
    });
  },
};
