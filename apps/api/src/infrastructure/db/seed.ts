import { config } from "../../shared/config.ts";
import { storage } from "../persistence/storage.ts";

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

export function seedDatabase(path: string): Promise<void> {
  return storage.exclusive(async () => {
    const db = await storage.read(path);
    db.companies ??= [];
    db.rooms ??= [];
    db.bookings ??= [];

    for (const company of seedData.companies)
      if (!db.companies.some((item) => item.id === company.id))
        db.companies.push(company);

    for (const room of seedData.rooms)
      if (!db.rooms.some((item) => item.id === room.id)) db.rooms.push(room);

    await storage.save(path, db);
  });
}

if (process.argv[1]?.endsWith("seed.ts")) {
  await seedDatabase(config.dbPath);
  console.log("Empresas e salas inicializadas.");
}
