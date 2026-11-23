const acmeToken = process.env.COMPANY_ACME_TOKEN;
const lumenToken = process.env.COMPANY_LUMEN_TOKEN;
const brisaToken = process.env.COMPANY_BRISA_TOKEN;

if (!acmeToken || !lumenToken || !brisaToken) {
  throw new Error("Defina os três tokens de empresa no arquivo .env.");
}

export const config = {
  port: Number(process.env.PORT ?? 3333),
  timezone: process.env.COWORKING_TIMEZONE ?? "America/Sao_Paulo",
  dbPath:
    process.env.DB_PATH ??
    (process.env.VERCEL ? "/tmp/salabloco.json" : "./data/db.json"),
  companyTokens: [
    { companyId: "acme", token: acmeToken },
    { companyId: "lumen", token: lumenToken },
    { companyId: "brisa", token: brisaToken },
  ],
};

export function authenticateToken(token: string) {
  const company = config.companyTokens.find((item) => item.token === token);
  return company?.companyId;
}
