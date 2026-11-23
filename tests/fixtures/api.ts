import { expect, request, type APIRequestContext } from "@playwright/test";
import { bookingContract, bookingListContract } from "./contracts";
import { env, type CompanyId } from "./env";

export type NewBooking = { roomId: string; startsAt: string; endsAt: string; title: string };

export class ApiClient {
  private constructor(private readonly http: APIRequestContext) {}

  static async start() {
    return new ApiClient(await request.newContext({ baseURL: env.apiUrl }));
  }

  private headers(company: CompanyId) {
    return { Authorization: `Bearer ${env.tokens[company]}` };
  }

  async createBooking(company: CompanyId, booking: NewBooking) {
    const response = await this.http.post(`/api/companies/${company}/bookings`, {
      headers: this.headers(company),
      data: { ...booking, responsibleEmail: `qa@${company}.test` },
    });
    expect(response.status(), await response.text()).toBe(201);
    return bookingContract.parse(await response.json());
  }

  async listBookings(company: CompanyId) {
    const response = await this.http.get(`/api/companies/${company}/bookings`, { headers: this.headers(company) });
    return bookingListContract.parse(await response.json());
  }

  async removeTestBookings() {
    for (const company of Object.keys(env.tokens) as CompanyId[]) {
      const bookings = await this.listBookings(company);
      for (const booking of bookings.filter((item) => item.title.startsWith("E2E"))) {
        await this.http.delete(`/api/companies/${company}/bookings/${booking.id}`, { headers: this.headers(company) });
      }
    }
  }

  async stop() {
    await this.http.dispose();
  }
}

export function tomorrow() {
  const date = new Date(Date.now() + 24 * 60 * 60_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

export function tomorrowAt(time: string) {
  return `${tomorrow()}T${time}:00-03:00`;
}
