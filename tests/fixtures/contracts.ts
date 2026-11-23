import { z } from "zod";

export const bookingContract = z.object({
  id: z.string(),
  companyId: z.string(),
  roomId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  title: z.string(),
  responsibleEmail: z.string().email(),
  createdAt: z.string(),
});

export const bookingListContract = z.array(bookingContract);

export type Booking = z.infer<typeof bookingContract>;
