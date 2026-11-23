import axios from "axios";
import type { Booking, BookingSuggestion, BusySlot, Company, NewBookingInput, Room, Session } from "./types";
import { ApiError } from "./types";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL ?? "");

type ApiErrorResponse = {
  code?: string;
  message?: string;
  field?: string;
  conflict?: BusySlot;
  suggestions?: BookingSuggestion[];
};

async function request<T>(method: string, path: string, token?: string, data?: unknown) {
  try {
    const response = await axios.request<T>({
      method,
      url: `${API_URL}${path}`,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return response.data;

  } catch (error) {

    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const response = error.response;
      const body = response?.data;

      throw new ApiError(
        response?.status ?? 0,
        body?.code ?? "NETWORK",
        body?.message ?? "Não foi possível falar com o servidor.",
        body?.field,
        body?.conflict,
        body?.suggestions,
      );
    }

    throw error;
  }
}

export async function checkLogin(companyId: string, token: string) {
  await request<Booking[]>("GET", `/api/companies/${companyId}/bookings`, token);
}

export function getCompanies() {
  return request<Company[]>("GET", "/api/companies");
}

export function getConfig(token: string) {
  return request<{ timezone: string }>("GET", "/api/config", token);
}

export function getRooms() {
  return request<Room[]>("GET", "/api/rooms");
}

export function getAvailabilityDetails(token: string, roomId: string, date: string) {
  return request<{ busy: BusySlot[]; free: BusySlot[] }>("GET", `/api/rooms/${roomId}/availability?date=${date}`, token);
}

export async function getAvailability(token: string, roomId: string, date: string) {
  const response = await getAvailabilityDetails(token, roomId, date);
  return response.busy;
}

export function getBookings(session: Session) {
  return request<Booking[]>("GET", `/api/companies/${session.companyId}/bookings`, session.token);
}

export function createBooking(session: Session, input: NewBookingInput) {
  return request<Booking>("POST", `/api/companies/${session.companyId}/bookings`, session.token, input);
}

export function updateBooking(session: Session, id: string, input: NewBookingInput) {
  return request<Booking>("PUT", `/api/companies/${session.companyId}/bookings/${id}`, session.token, input);
}

export async function deleteBooking(session: Session, id: string) {
  await request<void>("DELETE", `/api/companies/${session.companyId}/bookings/${id}`, session.token);
}
