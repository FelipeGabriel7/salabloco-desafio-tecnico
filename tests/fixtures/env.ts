// Única porta de entrada da configuração dos testes. Nada de URL ou token solto nos specs.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  apiUrl: required("API_URL", "http://localhost:3333"),
  webUrl: required("WEB_URL", "http://localhost:5181"),
  startServers: process.env.START_SERVERS !== "0",
  tokens: {
    acme: required("ACME_TOKEN", "demo-acme-7f3a9c2e"),
    lumen: required("LUMEN_TOKEN", "demo-lumen-4b8d1e6a"),
    brisa: required("BRISA_TOKEN", "demo-brisa-2c5f9a0d"),
  },
} as const;
