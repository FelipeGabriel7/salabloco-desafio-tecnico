import { Router } from "express";
import { listRooms } from "../../infrastructure/persistence/json/json-booking.repository.ts";
import { authenticate } from "../../shared/middleware.ts";
import { getAvailability } from "../bookings/services/bookings.service.ts";

export function roomRoutes(path: string, timezone: string): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await listRooms(path));
  });

  router.get("/:id/availability", authenticate, async (req, res) => {
    res.json(await getAvailability(path, timezone, String(req.params.id), req.query.date as string | undefined));
  });

  return router;
}
