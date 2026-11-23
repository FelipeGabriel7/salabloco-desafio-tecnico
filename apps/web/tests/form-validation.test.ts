import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/pages/NewBookingPage";
import { loginSchema } from "@/pages/LoginPage";

const validBooking = {
  roomId: "sala-teste",
  date: "2026-11-20",
  start: "14:00",
  end: "15:00",
  title: "Planning",
  responsibleEmail: "ana@empresa.test",
};

describe("campos do formulário de reserva", () => {
  it("aceita os campos preenchidos no formato esperado", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("recusa sala ou horário vazios", () => {
    expect(bookingSchema.safeParse({ ...validBooking, roomId: "" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start: "" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, end: "" }).success).toBe(false);
  });

  it("recusa data inexistente, título vazio e e-mail inválido", () => {
    expect(bookingSchema.safeParse({ ...validBooking, date: "2026-02-30" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, title: "   " }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, responsibleEmail: "ana@" }).success).toBe(false);
  });

  it("valida limites do expediente e duração antes do envio", () => {
    expect(bookingSchema.safeParse({ ...validBooking, start: "14:00", end: "14:10" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start: "06:00", end: "06:10" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, end: "22:01" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, start: "07:00", end: "07:30" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, start: "21:30", end: "22:00" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, title: "x".repeat(81) }).success).toBe(false);
  });
});

describe("campos do formulário de login", () => {
  it("exige empresa e token", () => {
    expect(loginSchema.safeParse({ companyId: "", token: "token" }).success).toBe(false);
    expect(loginSchema.safeParse({ companyId: "empresa-teste", token: "   " }).success).toBe(false);
    expect(loginSchema.safeParse({ companyId: "empresa-teste", token: "token" }).success).toBe(true);
  });
});
