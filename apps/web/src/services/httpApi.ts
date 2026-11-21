import type { Booking, BusySlot, Room } from "@/utils/types";
import { ApiError, type Backend } from "./types";

/**
 * Back-end real. Ative com VITE_API_MODE=http (e VITE_API_URL, padrão http://localhost:3333).
 * Espera o corpo de erro { code, message, field?, conflict? } descrito na seção Arquitetura.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3333";

async function request<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Não foi possível falar com o servidor.");
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as
    | { code?: string; message?: string; field?: string; conflict?: BusySlot }
    | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? "UNKNOWN", data?.message ?? "Erro inesperado.", data?.field, data?.conflict);
  }
  return data as T;
}

export const httpBackend: Backend = {
  async login(companyId, token) {
    // O login valida chamando uma rota protegida da própria empresa.
    await request<Booking[]>("GET", `/companies/${companyId}/bookings`, token);
  },
  listRooms: (token) => request<Room[]>("GET", "/rooms", token),
  async availability(token, roomId, date) {
    const res = await request<{ busy: BusySlot[] }>("GET", `/rooms/${roomId}/availability?date=${date}`, token);
    return res.busy;
  },
  listBookings: (token, companyId) => request<Booking[]>("GET", `/companies/${companyId}/bookings`, token),
  createBooking: (token, companyId, input) => request<Booking>("POST", `/companies/${companyId}/bookings`, token, input),
  deleteBooking: (token, companyId, id) => request<void>("DELETE", `/companies/${companyId}/bookings/${id}`, token),
};
