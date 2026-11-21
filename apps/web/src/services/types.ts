import type { Booking, BusySlot, NewBookingInput, Room } from "@/utils/types";

/** Erro padrão da API: status HTTP, code estável, mensagem e, quando há, o campo. */
export class ApiError extends Error {
  status: number;
  code: string;
  field?: string;
  conflict?: BusySlot;

  constructor(status: number, code: string, message: string, field?: string, conflict?: BusySlot) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
    this.conflict = conflict;
  }
}

export type Session = { companyId: string; token: string };

/** Contrato do back-end (mock ou HTTP). O token vai explícito, como no header Authorization. */
export interface Backend {
  login(companyId: string, token: string): Promise<void>;
  listRooms(token: string): Promise<Room[]>;
  availability(token: string, roomId: string, date: string): Promise<BusySlot[]>;
  listBookings(token: string, companyId: string): Promise<Booking[]>;
  createBooking(token: string, companyId: string, input: NewBookingInput): Promise<Booking>;
  deleteBooking(token: string, companyId: string, id: string): Promise<void>;
}

/** O mesmo contrato já ligado à sessão atual. É o que as telas usam. */
export interface Api {
  listRooms(): Promise<Room[]>;
  availability(roomId: string, date: string): Promise<BusySlot[]>;
  listBookings(): Promise<Booking[]>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
}
