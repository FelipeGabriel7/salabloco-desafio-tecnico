import { Redis } from "@upstash/redis";
import { config } from "../../shared/config.ts";
import type { Database } from "../../shared/types.ts";
import { fileStorage } from "./file-storage.ts";
import { createRedisStorage } from "./redis-storage.ts";

export type Storage = {
  read(path: string): Promise<Database>;
  save(path: string, database: Database): Promise<void>;
  exclusive<T>(operation: () => Promise<T>): Promise<T>;
  snapshot(path: string): Promise<Database>;
};

export const storage: Storage = config.redis
  ? createRedisStorage(new Redis(config.redis))
  : fileStorage;
