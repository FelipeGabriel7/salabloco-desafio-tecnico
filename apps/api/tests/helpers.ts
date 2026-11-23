import request from "supertest";
import { vi } from "vitest";
import { app } from "../src/app.ts";
import { seedDatabase } from "../src/infrastructure/db/seed.ts";
import { storage } from "../src/infrastructure/persistence/storage.ts";

export type CompanyId = "acme" | "lumen" | "brisa";

export const tokens: Record<CompanyId, string> = {
  acme: "acme-test-token",
  lumen: "lumen-test-token",
  brisa: "brisa-test-token",
};

export const NOW = new Date("2026-11-24T12:00:00.000Z");
export const TOMORROW = "2026-11-25";

export function at(time: string, date = TOMORROW) {
  return `${date}T${time}:00-03:00`;
}

export function booking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    roomId: "savassi",
    startsAt: at("10:00"),
    endsAt: at("11:00"),
    title: "Planning semanal",
    responsibleEmail: "ana@acme.test",
    ...overrides,
  };
}

export const api = () => request(app);

export function bookingsUrl(companyId: CompanyId, id?: string) {
  return `/api/companies/${companyId}/bookings${id ? `/${id}` : ""}`;
}

export function create(company: CompanyId, body: object = booking()) {
  return api()
    .post(bookingsUrl(company))
    .set("Authorization", `Bearer ${tokens[company]}`)
    .send(body);
}

export function list(company: CompanyId) {
  return api().get(bookingsUrl(company)).set("Authorization", `Bearer ${tokens[company]}`);
}

export function availability(roomId: string, date: string, company: CompanyId = "acme") {
  return api()
    .get(`/api/rooms/${roomId}/availability`)
    .query({ date })
    .set("Authorization", `Bearer ${tokens[company]}`);
}

export async function resetDatabase() {
  await storage.save(process.env.DB_PATH!, { companies: [], rooms: [], bookings: [] });
  await seedDatabase(process.env.DB_PATH!);
}

export function freezeClock(date = NOW) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(date);
}
