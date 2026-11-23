import { tomorrow, tomorrowAt } from "../fixtures/api";
import { step, test } from "../fixtures/test";

test.describe("Funcionalidade: isolamento entre empresas", () => {
  test.beforeEach(async ({ api }) => {
    await api.createBooking("lumen", { roomId: "savassi", startsAt: tomorrowAt("10:00"), endsAt: tomorrowAt("11:00"), title: "E2E Segredo da Lumen" });
  });

  test("Cenário: a lista mostra só as reservas da própria empresa", async ({ api, loginPage, bookingsPage }) => {
    await step("Dado que a Acme também tem uma reserva", () =>
      api.createBooking("acme", { roomId: "pampulha", startsAt: tomorrowAt("10:00"), endsAt: tomorrowAt("11:00"), title: "E2E Da Acme" }),
    );
    await step("Quando a Acme entra", () => loginPage.signIn("acme"));
    await step("Então vê a própria reserva e não a da Lumen", async () => {
      await bookingsPage.expectBooking("E2E Da Acme");
      await bookingsPage.expectNoBooking("E2E Segredo da Lumen");
    });
  });

  test("Cenário: o mapa mostra o horário ocupado sem dados de quem reservou", async ({ loginPage, shell, dayMap }) => {
    await step("Dado que a Acme está no mapa de amanhã", async () => {
      await loginPage.signIn("acme");
      await shell.goTo("Mapa do dia");
      await dayMap.selectDate(tomorrow());
    });
    await step("Então vê a Savassi ocupada, sem título nem e-mail da Lumen", async () => {
      await dayMap.expectBusy("Sala Savassi", "10:00–11:00");
      await dayMap.expectHidden("E2E Segredo da Lumen");
      await dayMap.expectHidden("qa@lumen.test");
    });
  });
});
