export const paths = {
  login: "/login",
  bookings: "/reservas",
  newBooking: "/reservas/nova",
  dayMap: "/mapa",
} as const;

export function newBookingPath(room?: string, date?: string) {
  const query = new URLSearchParams();
  if (room) query.set("sala", room);
  if (date) query.set("data", date);

  const search = query.toString();
  return search ? `${paths.newBooking}?${search}` : paths.newBooking;
}
