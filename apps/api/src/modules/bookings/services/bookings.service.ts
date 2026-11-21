import { createIfFree, deleteBooking, listCompanyBookings, listRoomBookings, listRooms, roomExists } from "../../../infrastructure/persistence/json/json-booking.repository.ts";
import { AppError, notFound } from "../../../shared/errors.ts";
import { messages } from "../../../shared/utils/messages.ts";
import { getDayRange, isWithinOpeningHours, localDateTimeToUtc, localParts, overlaps, validDay } from "../../../shared/time.ts";

import type { Booking } from "../../../shared/types.ts";

type NewBooking = Omit<Booking, "id" | "companyId" | "createdAt">;
type Suggestion = { roomId: string; startsAt: string; endsAt: string };

export function listBookings(path: string, companyId: string) {
  return listCompanyBookings(path, companyId);
}

export async function createBooking(path: string, timezone: string, companyId: string, input: NewBooking) {
  const start = Date.parse(input.startsAt);
  const end = Date.parse(input.endsAt);

  if (end <= start) {
    throw new AppError(422, "END_BEFORE_START", messages.endBeforeStart, "endsAt");
  }

  const duration = end - start;

  if (duration < 30 * 60_000) {
    throw new AppError(422, "DURATION_TOO_SHORT", messages.durationTooShort, "endsAt");
  }

  if (duration > 4 * 60 * 60_000) {
    throw new AppError(422, "DURATION_TOO_LONG", messages.durationTooLong, "endsAt");
  }

  if (start < Date.now()) {
    throw new AppError(422, "IN_THE_PAST", messages.inThePast, "startsAt")
  };

  if (!isWithinOpeningHours(start, end, timezone)) {
    throw new AppError(422, "OUTSIDE_OPENING_HOURS", messages.outsideOpeningHours);
  }

  if (!(await roomExists(path, input.roomId))) {
    throw new AppError(422, "ROOM_NOT_FOUND", messages.roomNotFound, "roomId");
  }

  const result = await createIfFree(path, { ...input, companyId });

  if ("conflict" in result) {
    const suggestions = await suggestBookings(path, timezone, input.roomId, start, duration);

    throw new AppError(409, "BOOKING_CONFLICT", messages.bookingConflict, undefined,
      {
        startsAt: result.conflict.startsAt,
        endsAt: result.conflict.endsAt,
      },
      suggestions,
    );
  }

  return result.booking;
}

export async function cancelBooking(path: string, companyId: string, id: string) {
  if (!(await deleteBooking(path, companyId, id))) throw notFound();
}

export async function getAvailability(path: string, timezone: string, roomId: string, date: unknown) {
  if (!validDay(date)) {
    throw new AppError(400, "INVALID_DATE", messages.invalidDate, "date");
  }

  const rooms = await listRooms(path);

  if (!rooms.some((room) => room.id === roomId)) throw notFound();

  const { start, end } = getDayRange(date, timezone);
  const bookings = await listRoomBookings(path, roomId);

  return {
    roomId,
    date,
    busy: bookings.filter((booking) =>
      overlaps(
        start,
        end,
        Date.parse(booking.startsAt),
        Date.parse(booking.endsAt),
      ),
    ).map(({ startsAt, endsAt }) => ({ startsAt, endsAt }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}

async function suggestBookings(path: string, timezone: string, roomId: string, start: number, duration: number) {
  const rooms = await listRooms(path);
  const requested = localParts(new Date(start), timezone);
  const date = `${requested.year}-${requested.month}-${requested.day}`;

  const roomIds = [roomId, ...rooms.map((room) => room.id).filter((id) => id !== roomId)];
  const suggestions: Suggestion[] = [];

  for (const candidateRoomId of roomIds) {
    const bookings = await listRoomBookings(path, candidateRoomId);

    for (let minute = 420; minute + duration / 60_000 <= 1320; minute += 30) {
      const candidateStart = localDateTimeToUtc(date, Math.floor(minute / 60), minute % 60, timezone,).getTime();

      const candidateEnd = candidateStart + duration;
      const sameRoomConflict = candidateRoomId === roomId && overlaps(start, start + duration, candidateStart, candidateEnd);

      const roomIsBusy = bookings.some((booking) =>
        overlaps(
          candidateStart,
          candidateEnd,
          Date.parse(booking.startsAt),
          Date.parse(booking.endsAt),
        ),
      );

      if (candidateStart < Date.now() || sameRoomConflict || roomIsBusy)
        continue;

      suggestions.push({
        roomId: candidateRoomId,
        startsAt: new Date(candidateStart).toISOString(),
        endsAt: new Date(candidateEnd).toISOString(),
      });

      if (suggestions.length === 2) return suggestions;
    }
  }

  return suggestions;
}
