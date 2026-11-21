export type Company = { id: string; name: string };
export type Room = { id: string; name: string; capacity: number };

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

export type Database = {
  companies: Company[];
  rooms: Room[];
  bookings: Booking[];
};
