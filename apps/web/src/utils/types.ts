export type Room = { id: string; name: string; capacity: number };

export type Company = { id: string; name: string };

export type Booking = {
  id: string;
  companyId: string;
  roomId: string;
  startsAt: string; // ISO 8601 em UTC
  endsAt: string;
  title: string;
  responsibleEmail: string;
  createdAt: string;
};

/** Projeção pública de uma reserva: só o intervalo. Nunca título, e-mail nem empresa. */
export type BusySlot = { startsAt: string; endsAt: string };

export type NewBookingInput = {
  roomId: string;
  startsAt: string;
  endsAt: string;
  title: string;
  responsibleEmail: string;
};
