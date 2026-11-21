/** Todas as URLs do app em um lugar só. Nenhum componente escreve "/reservas" à mão. */
export const paths = {
  login: "/login",
  bookings: "/reservas",
  newBooking: "/reservas/nova",
  dayMap: "/mapa",
} as const;

const withQuery = (path: string, params: Record<string, string | undefined>): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
};

export const dayMapPath = (date?: string): string => withQuery(paths.dayMap, { data: date });

export const newBookingPath = (prefill?: { room?: string; date?: string }): string =>
  withQuery(paths.newBooking, { sala: prefill?.room, data: prefill?.date });
