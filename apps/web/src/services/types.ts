export type Company = { id: string; name: string };
export type Room = { id: string; name: string; capacity: number };
export type BusySlot = { startsAt: string; endsAt: string };

export type Booking = {
  id: string;
  companyId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  title: string;
  responsibleEmail: string;
  createdAt: string;
};

export type NewBookingInput = {
  roomId: string;
  startsAt: string;
  endsAt: string;
  title: string;
  responsibleEmail: string;
};

export type Session = {
  companyId: string;
  companyName: string;
  token: string;
  timezone: string;
};

export type BookingSuggestion = {
  roomId: string;
  startsAt: string;
  endsAt: string;
};

export class ApiError extends Error {
  status: number;
  code: string;
  field?: string;
  conflict?: BusySlot;
  suggestions?: BookingSuggestion[];

  constructor(status: number, code: string, message: string, field?: string, conflict?: BusySlot, suggestions?: BookingSuggestion[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
    this.conflict = conflict;
    this.suggestions = suggestions;
  }
}
