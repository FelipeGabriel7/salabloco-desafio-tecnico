import { app } from "../src/app.ts";
import { seedDatabase } from "../src/infrastructure/db/seed.ts";
import { config } from "../src/shared/config.ts";

await seedDatabase(config.dbPath);

export default app;
