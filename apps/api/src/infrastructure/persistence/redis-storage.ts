import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import type { Database } from "../../shared/types.ts";
import type { Storage } from "./storage.ts";

export type RedisClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { nx: true; px: number }): Promise<unknown>;
  eval(script: string, keys: string[], args: string[]): Promise<unknown>;
};

const databaseKey = "salabloco:db";
const lockKey = "salabloco:lock";
const lockTtlMs = 5000;
const lockWaitMs = 25;

const releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`;

const emptyDatabase: Database = { companies: [], rooms: [], bookings: [] };

export function createRedisStorage(redis: RedisClient): Storage {
  async function read(): Promise<Database> {
    return (await redis.get<Database>(databaseKey)) ?? structuredClone(emptyDatabase);
  }

  async function save(_path: string, database: Database) {
    await redis.set(databaseKey, database);
  }

  async function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const owner = randomUUID();
    const deadline = Date.now() + lockTtlMs;

    while (!(await redis.set(lockKey, owner, { nx: true, px: lockTtlMs }))) {
      if (Date.now() > deadline) throw new Error("Não foi possível obter a trava de escrita.");
      await sleep(lockWaitMs);
    }

    try {
      return await operation();
    } finally {
      await redis.eval(releaseScript, [lockKey], [owner]);
    }
  }

  return { read, save, exclusive, snapshot: read };
}
