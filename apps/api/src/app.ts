import express from "express";
import { config } from "./shared/config.ts";
import { errorHandler, authenticate } from "./shared/middleware.ts";
import { messages } from "./shared/utils/messages.ts";
import { bookingRoutes } from "./modules/bookings/routes/bookings.routes.ts";
import { roomRoutes } from "./modules/rooms/rooms.routes.ts";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({
  limit: "16kb"
}));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rooms", roomRoutes(config.dbPath, config.timezone));
app.use("/api/companies/:companyId/bookings", authenticate, bookingRoutes());

app.use((_req, res) => res.status(404).json({ code: "NOT_FOUND", message: messages.notFound }));
app.use(errorHandler);
