import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { config } from "../../shared/config.ts";
import type { Database } from "../../shared/types.ts";

export const seedData = {
  companies: [
    { id: "acme", name: "Acme Tecnologia" },
    { id: "lumen", name: "Lumen Estúdio" },
    { id: "brisa", name: "Brisa Contabilidade" },
  ],
  rooms: [
    { id: "savassi", name: "Sala Savassi", capacity: 6 },
    { id: "pampulha", name: "Sala Pampulha", capacity: 12 },
    { id: "curral", name: "Sala Serra do Curral", capacity: 4 },
    { id: "liberdade", name: "Auditório Liberdade", capacity: 20 },
    { id: "ufmg", name: "Sala UFMG", capacity: 8 },
  ],
};

export async function seedDatabase(path: string): Promise<void> {
  const file = resolve(path);
  await mkdir(dirname(file), { recursive: true });
  let db: Database = { ...seedData, bookings: [] };

  try {
    db = JSON.parse(await readFile(file, "utf8")) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  db.companies ??= [];
  db.rooms ??= [];
  db.bookings ??= [];

  for (const company of seedData.companies)
    if (!db.companies.some((item) => item.id === company.id))
      db.companies.push(company);

  for (const room of seedData.rooms)
    if (!db.rooms.some((item) => item.id === room.id)) db.rooms.push(room);

  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await rename(temp, file);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  await seedDatabase(config.dbPath);
  console.log("Empresas e salas inicializadas.");
}
