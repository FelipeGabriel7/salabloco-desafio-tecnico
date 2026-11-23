import { tomorrow } from "../fixtures/api";
import { expect, step, test } from "../fixtures/test";

test.describe("Funcionalidade: mapa do dia", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.signIn("acme");
  });

  test("Cenário: reservar a partir do mapa preenche sala e data", async ({ shell, dayMap, bookingForm }) => {
    await step("Dado que a Acme está no mapa de amanhã", async () => {
      await shell.goTo("Mapa do dia");
      await dayMap.selectDate(tomorrow());
    });
    await step("Quando clica em reservar a sala UFMG", () => dayMap.book("Sala UFMG"));
    await step("Então o formulário abre com sala e data preenchidas", () =>
      bookingForm.expectValues({ room: "ufmg", date: tomorrow() }),
    );
  });

  test("mostra períodos livres e ocupados da sala", async ({ shell, dayMap, api, page }) => {
    await api.createBooking("acme", {
      roomId: "savassi", startsAt: `${tomorrow()}T10:00:00-03:00`,
      endsAt: `${tomorrow()}T11:00:00-03:00`, title: "E2E mapa",
    });
    await shell.goTo("Mapa do dia");
    await dayMap.selectDate(tomorrow());
    const room = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Sala Savassi" }) });
    await expect(room).toContainText("07:00–10:00");
    await expect(room).toContainText("11:00–22:00");
    await expect(room).toContainText("Ocupada: 10:00–11:00");
  });

  test("Cenário: falha ao carregar e tentar novamente", async ({ shell, dayMap }) => {
    await step("Dado que a disponibilidade está falhando", () => dayMap.failNextAvailabilityRequests());
    await step("Quando abre o mapa", () => shell.goTo("Mapa do dia"));
    await step("Então vê o erro com a opção de tentar novamente", () => dayMap.expectLoadError());
    await step("Quando o servidor volta e tenta novamente", async () => {
      await dayMap.restoreAvailabilityRequests();
      await dayMap.retry();
    });
    await step("Então as salas aparecem", () => dayMap.expectRoom("Sala Savassi"));
  });
});
