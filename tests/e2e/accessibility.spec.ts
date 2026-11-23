import { expect, step, test } from "../fixtures/test";

test.describe("Funcionalidade: acessibilidade", () => {
  test("Cenário: telas sem violação grave", async ({ loginPage, shell, bookingForm, dayMap, a11y }) => {
    await step("Então o login não tem violação grave", async () => {
      await loginPage.open();
      expect(await a11y.seriousViolations()).toEqual([]);
    });
    await step("E as reservas não têm violação grave", async () => {
      await loginPage.signIn("acme");
      await shell.expectSignedInAs("acme");
      expect(await a11y.seriousViolations()).toEqual([]);
    });
    await step("E o formulário não tem violação grave", async () => {
      await shell.goTo("Nova reserva");
      await bookingForm.expectLoaded();
      expect(await a11y.seriousViolations()).toEqual([]);
    });
    await step("E o mapa não tem violação grave", async () => {
      await shell.goTo("Mapa do dia");
      await dayMap.expectRoom("Sala Savassi");
      expect(await a11y.seriousViolations()).toEqual([]);
    });
  });

  test("Cenário: entrar usando só o teclado", async ({ loginPage, shell }) => {
    await step("Quando a Acme entra só com o teclado", () => loginPage.signInWithKeyboard("acme"));
    await step("Então chega nas reservas", () => shell.expectSignedInAs("acme"));
  });
});

test.describe("Funcionalidade: uso no celular @celular", () => {
  test("Cenário: telas cabem na largura e a navegação inferior funciona", async ({ loginPage, shell, bookingForm }) => {
    await step("Dado que a Acme entrou pelo celular", () => loginPage.signIn("acme"));
    await step("Então as reservas não rolam para o lado", async () => {
      await shell.expectSignedInAs("acme");
      expect(await shell.hasHorizontalScroll()).toBe(false);
    });
    await step("Quando abre a nova reserva pela barra inferior", () => shell.goTo("Nova reserva"));
    await step("Então o formulário também cabe na tela", async () => {
      await bookingForm.expectLoaded();
      expect(await bookingForm.hasHorizontalScroll()).toBe(false);
    });
  });
});
