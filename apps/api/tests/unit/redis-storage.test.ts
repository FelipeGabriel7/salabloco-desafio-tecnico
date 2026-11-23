import { setTimeout as sleep } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { createRedisStorage, type RedisClient } from "../../src/infrastructure/persistence/redis-storage.ts";

function fakeRedis(): RedisClient {
  const data = new Map<string, unknown>();

  return {
    async get<T>(key: string) {
      return (data.get(key) as T) ?? null;
    },
    async set(key, value, options) {
      if (options?.nx && data.has(key)) return null;
      data.set(key, value);
      return "OK";
    },
    async eval(_script, [key], [owner]) {
      if (data.get(key) !== owner) return 0;
      data.delete(key);
      return 1;
    },
  };
}

describe("armazenamento no Redis", () => {
  it("devolve um banco vazio antes da primeira gravação", async () => {
    const storage = createRedisStorage(fakeRedis());
    expect(await storage.read("")).toEqual({ companies: [], rooms: [], bookings: [] });
  });

  it("lê o que foi gravado", async () => {
    const storage = createRedisStorage(fakeRedis());
    const database = { companies: [{ id: "acme", name: "Acme" }], rooms: [], bookings: [] };

    await storage.save("", database);

    expect(await storage.read("")).toEqual(database);
  });

  it("executa uma operação exclusiva de cada vez", async () => {
    const storage = createRedisStorage(fakeRedis());
    const events: string[] = [];

    const operation = (name: string) =>
      storage.exclusive(async () => {
        events.push(`${name}:início`);
        await sleep(20);
        events.push(`${name}:fim`);
      });

    await Promise.all([operation("a"), operation("b")]);

    expect(events).toEqual(["a:início", "a:fim", "b:início", "b:fim"]);
  });

  it("libera a trava mesmo quando a operação falha", async () => {
    const storage = createRedisStorage(fakeRedis());

    await expect(storage.exclusive(async () => { throw new Error("falhou"); })).rejects.toThrow("falhou");

    expect(await storage.exclusive(async () => "liberada")).toBe("liberada");
  });
});
