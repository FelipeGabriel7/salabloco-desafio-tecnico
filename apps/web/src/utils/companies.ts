import type { Company } from "@/utils/types";

/** Empresas do coworking. São fixas, como no enunciado, e alimentam o seletor do login. */
export const COMPANIES: Company[] = [
  { id: "acme", name: "Acme Tecnologia" },
  { id: "lumen", name: "Lumen Estúdio" },
  { id: "brisa", name: "Brisa Contabilidade" },
];

export const companyName = (id: string) => COMPANIES.find((c) => c.id === id)?.name ?? id;
