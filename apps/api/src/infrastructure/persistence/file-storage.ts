import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Database } from "../../shared/types.ts";
import type { Storage } from "./storage.ts";

const emptyDatabase: Database = { companies: [], rooms: [], bookings: [] };
let pending = Promise.resolve();

async function read(path: string): Promise<Database> {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8")) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(emptyDatabase);
    }

    throw error;
  }
}

async function save(path: string, database: Database) {
  const file = resolve(path);
  await mkdir(dirname(file), { recursive: true });

  const temporaryFile = `${file}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(database, null, 2)}\n`);
  await rename(temporaryFile, file);
}

function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export const fileStorage: Storage = {
  read,
  save,
  exclusive,
  snapshot: (path) => exclusive(() => read(path)),
};
