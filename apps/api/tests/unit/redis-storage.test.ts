import { setTimeout as sleep } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { createRedisStorage, type RedisClient } from "../../src/infrastructure/persistence/redis-storage.ts";

function fakeRedis(data = new Map<string, unknown>()): RedisClient {

  return {
    async get<T>(key: string) {
      return data.has(key) ? structuredClone(data.get(key) as T) : null;
    },
    async set(key, value, options) {
      if (options?.nx && data.has(key)) return null;
      data.set(key, value);
      return "OK";
    },
    async eval(_script, [lock, target], [owner, value]) {
      if (data.get(lock) !== owner) return 0;
      if (target) data.set(target, JSON.parse(value));
      else data.delete(lock);
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

  it("não grava se a trava expirou e outra instância assumiu", async () => {
    const data = new Map<string, unknown>();
    const storage = createRedisStorage(fakeRedis(data));
    await storage.save("", { companies: [], rooms: [], bookings: [] });

    const stale = storage.exclusive(async () => {
      const database = await storage.read("");
      data.set("salabloco:lock", "outra-instancia");
      database.rooms.push({ id: "atrasada", name: "Gravação atrasada", capacity: 1 });
      await storage.save("", database);
    });

    await expect(stale).rejects.toThrow("A trava de escrita expirou");
    expect((await storage.read("")).rooms).toEqual([]);
  });
});
