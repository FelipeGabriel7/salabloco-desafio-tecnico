import type { NextFunction, Request, Response } from "express";
import { messages } from "./utils/messages.ts";

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  authFailWindowMs: number;
  authFailMax: number;
  authBlockMs: number;
};

export type RateLimitStore = {
  hit(key: string, now: number): Promise<number>;
  fail(key: string, now: number): Promise<void>;
};

type Block = { until: number; strikes: number };

export function createMemoryRateLimitStore(options: RateLimitOptions): RateLimitStore {
  const requests = new Map<string, number[]>();
  const authFailures = new Map<string, number[]>();
  const blocks = new Map<string, Block>();

  function recent(times: number[] | undefined, windowMs: number, now: number) {
    return (times ?? []).filter((time) => time > now - windowMs);
  }

  return {
    async hit(key, now) {
      const block = blocks.get(key);
      if (block && block.until > now) return block.until - now;

      const times = recent(requests.get(key), options.windowMs, now);
      requests.set(key, times);
      if (times.length >= options.max) return times[0] + options.windowMs - now;

      times.push(now);
      return 0;
    },

    async fail(key, now) {
      const failures = recent(authFailures.get(key), options.authFailWindowMs, now);
      failures.push(now);

      if (failures.length < options.authFailMax) {
        authFailures.set(key, failures);
        return;
      }

      const strikes = (blocks.get(key)?.strikes ?? 0) + 1;
      blocks.set(key, { until: now + options.authBlockMs * 2 ** (strikes - 1), strikes });
      authFailures.delete(key);
    },
  };
}

export function createRateLimit(store: RateLimitStore) {
  const pendingFailures = new Map<string, Promise<void>>();

  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "desconhecido";
    await pendingFailures.get(key);
    const waitMs = await store.hit(key, Date.now());

    if (waitMs > 0) {
      res.set("Retry-After", String(Math.max(1, Math.ceil(waitMs / 1000))));
      res.status(429).json({ code: "RATE_LIMITED", message: messages.rateLimited });
      return;
    }

    res.on("finish", () => {
      if (res.statusCode !== 401) return;

      const failure = store
        .fail(key, Date.now())
        .catch((error) => console.error(error))
        .finally(() => {
          if (pendingFailures.get(key) === failure) pendingFailures.delete(key);
        });
      pendingFailures.set(key, failure);
    });

    next();
  };
}
