import { randomUUID } from "node:crypto";
import type { RateLimitOptions, RateLimitStore } from "../../shared/rate-limit.ts";
import type { RedisClient } from "./redis-storage.ts";

const hitScript = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local blockedUntil = tonumber(redis.call("get", KEYS[1]) or "0")
if blockedUntil > now then
  return blockedUntil - now
end
redis.call("zremrangebyscore", KEYS[2], "-inf", now - window)
if redis.call("zcard", KEYS[2]) >= max then
  local oldest = redis.call("zrange", KEYS[2], 0, 0, "WITHSCORES")
  return tonumber(oldest[2]) + window - now
end
redis.call("zadd", KEYS[2], now, ARGV[4])
redis.call("pexpire", KEYS[2], window)
return 0`;

const failScript = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local blockMs = tonumber(ARGV[4])
redis.call("zremrangebyscore", KEYS[1], "-inf", now - window)
redis.call("zadd", KEYS[1], now, ARGV[5])
redis.call("pexpire", KEYS[1], window)
if redis.call("zcard", KEYS[1]) < max then
  return 0
end
redis.call("del", KEYS[1])
local strikes = redis.call("incr", KEYS[3])
redis.call("pexpire", KEYS[3], 86400000)
local duration = blockMs * 2 ^ (strikes - 1)
redis.call("set", KEYS[2], string.format("%d", now + duration), "PX", duration)
return duration`;

export function createRedisRateLimitStore(redis: RedisClient, options: RateLimitOptions, prefix = "salabloco:rl"): RateLimitStore {
  const keys = (ip: string) => ({
    block: `${prefix}:block:${ip}`,
    requests: `${prefix}:requests:${ip}`,
    failures: `${prefix}:failures:${ip}`,
    strikes: `${prefix}:strikes:${ip}`,
  });

  return {
    async hit(ip, now) {
      const key = keys(ip);
      const wait = await redis.eval(hitScript, [key.block, key.requests], [String(now), String(options.windowMs), String(options.max), `${now}:${randomUUID()}`]);
      return Number(wait);
    },

    async fail(ip, now) {
      const key = keys(ip);
      await redis.eval(failScript, [key.failures, key.block, key.strikes], [
        String(now),
        String(options.authFailWindowMs),
        String(options.authFailMax),
        String(options.authBlockMs),
        `${now}:${randomUUID()}`,
      ]);
    },
  };
}
