import type { Request, Response } from "express";
import { config } from "../../../shared/config.ts";
import { AppError } from "../../../shared/errors.ts";
import { messages } from "../../../shared/utils/messages.ts";
import { cancelBooking, createBooking, listBookings, updateBooking } from "../services/bookings.service.ts";
import { bookingSchema } from "../validation/booking.schema.ts";

type AuthRequest = Request & { companyId?: string };

export async function list(req: AuthRequest, res: Response) {
  const bookings = await listBookings(config.dbPath, req.companyId!);
  res.json(bookings);
}

export async function create(req: AuthRequest, res: Response) {
  const result = bookingSchema.safeParse(req.body);

  if (!result.success) {
    const field = result.error.issues[0]?.path.join(".");
    throw new AppError(400, "VALIDATION", messages.invalidRequest, field);
  }

  const booking = await createBooking(config.dbPath, config.timezone, req.companyId!, result.data);

  res.location(`${req.baseUrl}/${booking.id}`).status(201).json(booking);
}

export async function update(req: AuthRequest, res: Response) {
  const result = bookingSchema.safeParse(req.body);

  if (!result.success) {
    const field = result.error.issues[0]?.path.join(".");
    throw new AppError(400, "VALIDATION", messages.invalidRequest, field);
  }

  const booking = await updateBooking(
    config.dbPath,
    config.timezone,
    req.companyId!,
    String(req.params.id),
    result.data,
  );

  res.json(booking);
}

export async function cancel(req: AuthRequest, res: Response) {
  await cancelBooking(config.dbPath, req.companyId!, String(req.params.id));
  res.status(204).end();
}
