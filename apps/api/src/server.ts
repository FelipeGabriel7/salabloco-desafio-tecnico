import { seedDatabase } from "./infrastructure/db/seed.ts";
import { app } from "./app.ts";
import { config } from "./shared/config.ts";

await seedDatabase(config.dbPath);

const port = config.port || 3000;

app.listen(port, () => {
  console.log(`Salabloco API ouvindo na porta ${port}.`);
});
