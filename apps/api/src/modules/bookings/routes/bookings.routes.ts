import { Router } from "express";
import * as controller from "../controllers/bookings.controller.ts";
import { matchCompany } from "../../../shared/middleware.ts";

export function bookingRoutes(): Router {
  const router = Router({ mergeParams: true });
  router.use(matchCompany);

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.delete("/:id", controller.cancel);

  return router;
}
