import type { NextFunction, Request, Response } from "express";
import { messages } from "./utils/messages.ts";

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  authFailWindowMs: number;
  authFailMax: number;
  authBlockMs: number;
};

type Block = { until: number; strikes: number };

export function createRateLimit(options: RateLimitOptions) {
  const requests = new Map<string, number[]>();
  const authFailures = new Map<string, number[]>();
  const blocks = new Map<string, Block>();

  function recent(times: number[] | undefined, windowMs: number, now: number) {
    return (times ?? []).filter((time) => time > now - windowMs);
  }

  function tooManyRequests(res: Response, waitMs: number) {
    res.set("Retry-After", String(Math.max(1, Math.ceil(waitMs / 1000))));
    res.status(429).json({ code: "RATE_LIMITED", message: messages.rateLimited });
  }

  function registerAuthFailure(key: string) {
    const now = Date.now();
    const failures = recent(authFailures.get(key), options.authFailWindowMs, now);
    failures.push(now);

    if (failures.length < options.authFailMax) {
      authFailures.set(key, failures);
      return;
    }

    const strikes = (blocks.get(key)?.strikes ?? 0) + 1;
    blocks.set(key, { until: now + options.authBlockMs * 2 ** (strikes - 1), strikes });
    authFailures.delete(key);
  }

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "desconhecido";
    const now = Date.now();

    const block = blocks.get(key);
    if (block && block.until > now) return tooManyRequests(res, block.until - now);

    const times = recent(requests.get(key), options.windowMs, now);
    if (times.length >= options.max) {
      requests.set(key, times);
      return tooManyRequests(res, times[0] + options.windowMs - now);
    }

    times.push(now);
    requests.set(key, times);

    res.on("finish", () => {
      if (res.statusCode === 401) registerAuthFailure(key);
    });

    next();
  };
}
