import { Redis } from "@upstash/redis";
import { beforeEach, describe, expect, it } from "vitest";
import { createRedisStorage } from "../../src/infrastructure/persistence/redis-storage.ts";
import { config } from "../../src/shared/config.ts";
import { resetDatabase } from "../helpers.ts";

const instance = () => createRedisStorage(new Redis(config.redis!));

describe.runIf(config.redis)("Redis compartilhado entre instâncias da API", () => {
  beforeEach(resetDatabase);

  it("o que uma instância grava, a outra lê", async () => {
    const [first, second] = [instance(), instance()];
    const database = await first.read("");
    database.companies.push({ id: "nova", name: "Nova Empresa" });

    await first.save("", database);

    expect((await second.read("")).companies).toContainEqual({ id: "nova", name: "Nova Empresa" });
  });

  it("a trava vale entre instâncias: 20 escritas concorrentes não se perdem", async () => {
    const instances = [instance(), instance()];

    await Promise.all(
      Array.from({ length: 20 }, (_, index) => {
        const storage = instances[index % 2];
        return storage.exclusive(async () => {
          const database = await storage.read("");
          database.rooms.push({ id: `sala-${index}`, name: `Sala ${index}`, capacity: 1 });
          await storage.save("", database);
        });
      }),
    );

    const { rooms } = await instance().read("");
    expect(rooms.filter((room) => room.id.startsWith("sala-"))).toHaveLength(20);
  });
});
