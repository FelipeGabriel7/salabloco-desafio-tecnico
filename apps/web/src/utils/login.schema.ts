import { z } from "zod";

export const loginSchema = z.object({
  companyId: z.string().min(1, "Escolha a empresa"),
  token: z.string().trim().min(1, "Informe o token de acesso"),
});

export type LoginValues = z.infer<typeof loginSchema>;
