function read(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export const env = {
  apiUrl: read("API_URL", "http://127.0.0.1:3333"),
  webUrl: read("WEB_URL", "http://127.0.0.1:5181"),
  startServers: process.env.START_SERVERS !== "0",
  tokens: {
    acme: read("ACME_TOKEN", "acme-local-7f3a9c2e"),
    lumen: read("LUMEN_TOKEN", "lumen-local-4b8d1e6a"),
    brisa: read("BRISA_TOKEN", "brisa-local-2c5f9a0d"),
  },
};

export type CompanyId = keyof typeof env.tokens;

export const companies: Record<CompanyId, string> = {
  acme: "Acme Tecnologia",
  lumen: "Lumen Estúdio",
  brisa: "Brisa Contabilidade",
};
