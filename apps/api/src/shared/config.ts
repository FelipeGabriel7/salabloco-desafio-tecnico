import { createHash, timingSafeEqual } from "node:crypto";

const acmeToken = process.env.COMPANY_ACME_TOKEN;
const lumenToken = process.env.COMPANY_LUMEN_TOKEN;
const brisaToken = process.env.COMPANY_BRISA_TOKEN;

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

function number(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function seconds(name: string, fallback: number) {
  return number(name, fallback) * 1000;
}

if (!acmeToken || !lumenToken || !brisaToken) {
  throw new Error("Defina os três tokens de empresa no arquivo .env.");
}

export const config = {
  port: Number(process.env.PORT ?? 3333),
  timezone: process.env.COWORKING_TIMEZONE ?? "America/Sao_Paulo",
  dbPath:
    process.env.DB_PATH ??
    (process.env.VERCEL ? "/tmp/salabloco.json" : "./data/db.json"),
  redis: redisUrl && redisToken ? { url: redisUrl, token: redisToken } : undefined,
  trustProxy: Boolean(process.env.VERCEL),
  rateLimit: {
    windowMs: seconds("RATE_LIMIT_WINDOW_SECONDS", 60),
    max: number("RATE_LIMIT_MAX", 100),
    authFailWindowMs: seconds("AUTH_FAIL_WINDOW_SECONDS", 300),
    authFailMax: number("AUTH_FAIL_MAX", 10),
    authBlockMs: seconds("AUTH_BLOCK_SECONDS", 60),
  },
  companyTokens: [
    { companyId: "acme", token: acmeToken },
    { companyId: "lumen", token: lumenToken },
    { companyId: "brisa", token: brisaToken },
  ],
};

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authenticateToken(token: string) {
  const received = digest(token);
  const company = config.companyTokens.find((item) => timingSafeEqual(digest(item.token), received));
  return company?.companyId;
}
