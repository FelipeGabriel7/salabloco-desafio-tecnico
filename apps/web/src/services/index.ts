import { httpBackend } from "./httpApi";
import { mockBackend } from "./mockApi";
import { ApiError, type Api, type Backend, type Session } from "./types";

export { ApiError } from "./types";
export type { Api, Session } from "./types";

/** Por padrão o app roda com o back-end simulado. VITE_API_MODE=http liga o server real. */
export const isMock = import.meta.env.VITE_API_MODE !== "http";
const backend: Backend = isMock ? mockBackend : httpBackend;

export const loginRequest = (companyId: string, token: string) => backend.login(companyId, token);

/** Monta a API ligada à sessão. Qualquer 401 vira logout, em um único lugar. */
export function createApi(session: Session | null, onUnauthorized: () => void): Api {
  const guard = async <T>(fn: (s: Session) => Promise<T>): Promise<T> => {
    if (!session) {
      onUnauthorized();
      throw new ApiError(401, "UNAUTHORIZED", "Sessão inválida.");
    }
    try {
      return await fn(session);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      throw err;
    }
  };
  return {
    listRooms: () => guard((s) => backend.listRooms(s.token)),
    availability: (roomId, date) => guard((s) => backend.availability(s.token, roomId, date)),
    listBookings: () => guard((s) => backend.listBookings(s.token, s.companyId)),
    createBooking: (input) => guard((s) => backend.createBooking(s.token, s.companyId, input)),
    deleteBooking: (id) => guard((s) => backend.deleteBooking(s.token, s.companyId, id)),
  };
}
