import { z } from "zod";

const isoWithOffset = z.string().datetime({ offset: true });
const slot = z.object({ startsAt: isoWithOffset, endsAt: isoWithOffset }).strict();

export const contracts = {
  health: z.object({ status: z.literal("ok") }).strict(),
  config: z.object({ timezone: z.string() }).strict(),
  companies: z.array(z.object({ id: z.string(), name: z.string() }).strict()),
  rooms: z.array(z.object({ id: z.string(), name: z.string(), capacity: z.number().int().positive() }).strict()),
  availability: z.object({ roomId: z.string(), date: z.string().date(), busy: z.array(slot) }).strict(),
  booking: z
    .object({
      id: z.string().uuid(),
      companyId: z.string(),
      roomId: z.string(),
      startsAt: isoWithOffset,
      endsAt: isoWithOffset,
      title: z.string().min(1).max(80),
      responsibleEmail: z.string().email(),
      createdAt: isoWithOffset,
    })
    .strict(),
  error: z.object({ code: z.string(), message: z.string(), field: z.string().optional() }).strict(),
  conflict: z
    .object({
      code: z.literal("BOOKING_CONFLICT"),
      message: z.string(),
      conflict: slot,
      suggestions: z.array(slot.extend({ roomId: z.string() }).strict()).max(2),
    })
    .strict(),
};

export const bookingList = z.array(contracts.booking);
