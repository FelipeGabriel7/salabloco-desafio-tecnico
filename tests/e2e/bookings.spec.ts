import { tomorrowAt } from "../fixtures/api";
import { expect, step, test } from "../fixtures/test";

const savassi = "Sala Savassi · 6 pessoas";

test.describe("Funcionalidade: reservar uma sala", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.signIn("acme");
  });

  test("Cenário: reserva válida aparece na lista", async ({ shell, bookingForm, bookingsPage }) => {
    await step("Dado que a Acme abre o formulário de nova reserva", () => shell.goTo("Nova reserva"));
    await step("Quando reserva a Savassi das 10:00 às 11:00", () =>
      bookingForm.create({ room: savassi, start: "10:00", end: "11:00", title: "E2E Planning", email: "ana@acme.test" }),
    );
    await step("Então vê a confirmação e a reserva na lista", async () => {
      await bookingsPage.expectToast("Reserva criada");
      await bookingsPage.expectBooking("E2E Planning", "Sala Savassi", "10:00–11:00");
    });
  });

  test("Cenário: formulário vazio não chama a API", async ({ shell, bookingForm }) => {
    await step("Dado que a Acme abre o formulário", () => shell.goTo("Nova reserva"));
    const posts = await step("Quando envia sem preencher", () => bookingForm.countPostsDuring(() => bookingForm.submit()));
    await step("Então cada campo mostra o erro e nada é enviado", async () => {
      await bookingForm.expectFieldError("Informe o início");
      await bookingForm.expectFieldError("Informe o fim");
      await bookingForm.expectFieldError("Informe o título da reunião");
      await bookingForm.expectFieldError("Informe um e-mail válido");
      expect(posts).toBe(0);
    });
  });

  test("Cenário: regra de negócio recusada pelo servidor", async ({ shell, bookingForm }) => {
    await step("Dado que a Acme abre o formulário", () => shell.goTo("Nova reserva"));
    await step("Quando tenta reservar antes do expediente", () =>
      bookingForm.create({ start: "06:00", end: "07:00", title: "E2E Cedo", email: "ana@acme.test" }),
    );
    await step("Então vê a mensagem do servidor e continua no formulário", async () => {
      await bookingForm.expectServerError("O coworking funciona das 07:00 às 22:00");
      await bookingForm.expectPath("/reservas/nova");
    });
  });

  test("Cenário: conflito oferece sugestão que pode ser reservada", async ({ api, shell, bookingForm, bookingsPage }) => {
    await step("Dado que a Lumen já reservou a Savassi das 10:00 às 11:00", () =>
      api.createBooking("lumen", { roomId: "savassi", startsAt: tomorrowAt("10:00"), endsAt: tomorrowAt("11:00"), title: "E2E Lumen ocupa" }),
    );
    await step("Quando a Acme tenta o mesmo horário", async () => {
      await shell.goTo("Nova reserva");
      await bookingForm.create({ room: savassi, start: "10:00", end: "11:00", title: "E2E Conflito", email: "ana@acme.test" });
    });
    await step("Então vê o conflito sem dados da Lumen", async () => {
      await bookingForm.expectServerError("A sala já está reservada neste horário");
      await bookingForm.expectErrorHides("E2E Lumen ocupa");
    });
    await step("E ao escolher uma sugestão consegue reservar", async () => {
      await bookingForm.chooseFirstSuggestion();
      await bookingForm.expectStartChangedFrom("10:00");
      await bookingForm.submit();
      await bookingsPage.expectToast("Reserva criada");
    });
  });

  test("Cenário: editar muda o horário", async ({ api, shell, bookingsPage, bookingForm }) => {
    await step("Dado que a Acme tem uma reserva das 14:00 às 15:00", async () => {
      await api.createBooking("acme", { roomId: "pampulha", startsAt: tomorrowAt("14:00"), endsAt: tomorrowAt("15:00"), title: "E2E Editar" });
      await shell.reopenBookings();
    });
    await step("Quando muda para 16:00 às 17:00", async () => {
      await bookingsPage.edit("E2E Editar");
      await bookingForm.expectLoaded("Editar reserva");
      await bookingForm.expectValues({ start: "14:00" });
      await bookingForm.create({ start: "16:00", end: "17:00" });
    });
    await step("Então a lista mostra o novo horário", () => bookingsPage.expectBooking("E2E Editar", "16:00–17:00"));
  });

  test("Cenário: cancelar pede confirmação", async ({ api, shell, bookingsPage }) => {
    await step("Dado que a Acme tem uma reserva", async () => {
      await api.createBooking("acme", { roomId: "curral", startsAt: tomorrowAt("08:00"), endsAt: tomorrowAt("09:00"), title: "E2E Cancelar" });
      await shell.reopenBookings();
    });
    await step("Quando desiste na confirmação, a reserva continua", async () => {
      await bookingsPage.cancel("E2E Cancelar", false);
      await bookingsPage.expectBooking("E2E Cancelar");
    });
    await step("Quando confirma, a reserva some", async () => {
      await bookingsPage.cancel("E2E Cancelar", true);
      await bookingsPage.expectToast("Reserva cancelada");
      await bookingsPage.expectNoBooking("E2E Cancelar");
    });
  });
});

test.describe("Funcionalidade: lista vazia", () => {
  test("Cenário: empresa sem reservas", async ({ loginPage, bookingsPage }) => {
    await step("Quando a Brisa entra sem reservas", () => loginPage.signIn("brisa"));
    await step("Então vê o estado vazio com a ação de reservar", () => bookingsPage.expectEmpty());
  });
});
