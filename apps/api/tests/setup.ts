import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DB_PATH = join(tmpdir(), "salabloco-tests", `${randomUUID()}.json`);
process.env.COWORKING_TIMEZONE = "America/Sao_Paulo";
process.env.COMPANY_ACME_TOKEN = "acme-test-token";
process.env.COMPANY_LUMEN_TOKEN = "lumen-test-token";
process.env.COMPANY_BRISA_TOKEN = "brisa-test-token";
