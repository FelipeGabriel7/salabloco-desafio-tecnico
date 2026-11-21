import { z } from "zod";

export const bookingSchema = z
  .object({
    roomId: z.string().min(1),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    title: z.string().trim().min(1).max(80),
    responsibleEmail: z.string().email().max(254),
  })
  .strict();
