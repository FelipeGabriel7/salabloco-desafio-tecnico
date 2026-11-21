import { describe, expect, it } from "vitest";
import { buildBookingSchema } from "./booking.schema";
import { loginSchema } from "./login.schema";

// 19/11/2026, 09:00 em São Paulo
const now = () => new Date("2026-11-19T12:00:00Z");
const schema = buildBookingSchema(now);

const valid = {
  roomId: "savassi",
  date: "2026-11-20",
  start: "14:00",
  end: "15:00",
  title: "Planning",
  responsibleEmail: "ana@acme.com",
};

/** Devolve "campo: mensagem" do primeiro problema, ou null se o formulário é válido. */
const firstIssue = (input: Record<string, string>) => {
  const result = schema.safeParse(input);
  if (result.success) return null;
  const [issue] = result.error.issues;
  return `${issue.path.join(".")}: ${issue.message}`;
};

describe("formulário de reserva: formato", () => {
  it.each([
    ["sala vazia", { roomId: "" }, "roomId: Escolha uma sala"],
    ["data inexistente (30/02)", { date: "2026-02-30" }, "date: Informe uma data válida"],
    ["data fora do formato", { date: "20/11/2026" }, "date: Informe uma data válida"],
    ["início vazio", { start: "" }, "start: Informe o início"],
    ["fim fora do formato", { end: "25:00" }, "end: Informe o fim"],
    ["título só com espaços", { title: "   " }, "title: Informe o título da reunião"],
    ["título com 81 caracteres", { title: "x".repeat(81) }, "title: Use até 80 caracteres"],
    ["e-mail inválido", { responsibleEmail: "ana@" }, "responsibleEmail: Informe um e-mail válido"],
  ])("%s", (_nome, patch, esperado) => {
    expect(firstIssue({ ...valid, ...patch })).toBe(esperado);
  });

  it("aceita reserva válida", () => {
    expect(firstIssue(valid)).toBeNull();
  });
});

describe("formulário de reserva: regras de negócio", () => {
  it.each([
    ["fim igual ao início", { end: "14:00" }, "end: O fim deve ser depois do início"],
    ["fim antes do início", { end: "13:00" }, "end: O fim deve ser depois do início"],
    ["29 minutos", { end: "14:29" }, "end: A reserva deve ter no mínimo 30 minutos"],
    ["4 horas e 1 minuto", { end: "18:01" }, "end: A reserva deve ter no máximo 4 horas"],
    ["antes da abertura", { start: "06:30", end: "07:30" }, "start: O coworking funciona das 07:00 às 22:00"],
    ["depois do fechamento", { start: "21:00", end: "22:30" }, "start: O coworking funciona das 07:00 às 22:00"],
    ["no passado", { date: "2026-11-18" }, "start: Não é possível reservar no passado"],
  ])("%s", (_nome, patch, esperado) => {
    expect(firstIssue({ ...valid, ...patch })).toBe(esperado);
  });

  it("aceita os limites: 30 minutos e 4 horas", () => {
    expect(firstIssue({ ...valid, end: "14:30" })).toBeNull();
    expect(firstIssue({ ...valid, end: "18:00" })).toBeNull();
  });

  it("não roda regra de negócio quando o formato já falhou", () => {
    const result = schema.safeParse({ ...valid, date: "2026-02-30" });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues).toHaveLength(1);
  });
});

describe("formulário de login", () => {
  it("exige empresa e token (sem espaços)", () => {
    expect(loginSchema.safeParse({ companyId: "acme", token: "  " }).success).toBe(false);
    expect(loginSchema.safeParse({ companyId: "", token: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ companyId: "acme", token: "x" }).success).toBe(true);
  });
});
