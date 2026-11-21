import type { NextFunction, Request, Response } from "express";
import { authenticateToken } from "./config.ts";
import { AppError } from "./errors.ts";
import { messages } from "./utils/messages.ts";

type AuthRequest = Request & { companyId?: string };

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const parts = authorization?.split(" ");
  const scheme = parts?.[0]?.toLowerCase();
  const token = parts?.[1];

  if (parts?.length !== 2 || scheme !== "bearer" || !token) {
    return next(new AppError(401, "UNAUTHORIZED", messages.unauthorized));
  }

  const companyId = authenticateToken(token);

  if (!companyId) {
    return next(new AppError(401, "UNAUTHORIZED", messages.unauthorized));
  }

  req.companyId = companyId;
  next();
}

export function matchCompany(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.params.companyId !== req.companyId) {
    return next(new AppError(403, "FORBIDDEN", messages.forbidden));
  }

  next();
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      code: "VALIDATION",
      message: messages.invalidJson,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      code: error.code,
      message: error.message,
      field: error.field,
      conflict: error.conflict,
      suggestions: error.suggestions,
    });
  }

  console.error(error);
  return res.status(500).json({ code: "INTERNAL", message: messages.internal });
}
