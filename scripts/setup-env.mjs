// Copia cada .env.example para .env quando o .env ainda não existe.
// Nunca sobrescreve um .env existente. Valores reais ficam só na sua máquina.
import { existsSync, copyFileSync } from "node:fs";

const pairs = ["apps/api", "apps/web", "tests", "tests/contract/bruno"];

for (const dir of pairs) {
  const example = `${dir}/.env.example`;
  const target = `${dir}/.env`;
  if (!existsSync(example)) continue;
  if (existsSync(target)) {
    console.log(`= ${target} já existe, mantido`);
    continue;
  }
  copyFileSync(example, target);
  console.log(`+ ${target} criado a partir de ${example}`);
}
