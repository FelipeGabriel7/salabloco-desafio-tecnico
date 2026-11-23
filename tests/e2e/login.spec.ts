import { env } from "../fixtures/env";
import { step, test } from "../fixtures/test";

test.describe("Funcionalidade: entrar com o token da empresa", () => {
  test("Cenário: token errado não entra", async ({ loginPage }) => {
    await step("Quando a Acme entra com um token errado", () => loginPage.signIn("acme", "token-errado"));
    await step("Então vê o motivo e continua no login", async () => {
      await loginPage.expectError("Token inválido para a empresa selecionada");
      await loginPage.expectPath("/login");
    });
  });

  test("Cenário: token de outra empresa não entra", async ({ loginPage }) => {
    await step("Quando a Acme entra com o token da Lumen", () => loginPage.signIn("acme", env.tokens.lumen));
    await step("Então o acesso é negado e continua no login", async () => {
      await loginPage.expectError("Não foi possível entrar");
      await loginPage.expectPath("/login");
    });
  });

  test("Cenário: token de outra empresa explica o motivo", async ({ loginPage }) => {
    await step("Quando a Acme entra com o token da Lumen", () => loginPage.signIn("acme", env.tokens.lumen));
    await step("Então vê que o token não é desta empresa", () => loginPage.expectError("Token inválido para a empresa selecionada"));
  });

  test("Cenário: formulário vazio", async ({ loginPage }) => {
    await step("Quando envia o login sem preencher", () => loginPage.submitEmpty());
    await step("Então cada campo obrigatório mostra o erro", async () => {
      await loginPage.expectFieldError("Informe o ID da empresa");
      await loginPage.expectFieldError("Informe o token de acesso");
    });
  });

  test("Cenário: token certo abre as reservas", async ({ loginPage, shell }) => {
    await step("Quando a Acme entra com o próprio token", () => loginPage.signIn("acme"));
    await step("Então vê as reservas com o nome da empresa", () => shell.expectSignedInAs("acme"));
  });

  test("Cenário: área privada exige login", async ({ loginPage }) => {
    await step("Quando abre as reservas sem entrar", () => loginPage.openPrivateArea());
    await step("Então volta para o login", () => loginPage.expectVisible());
  });

  test("Cenário: sair encerra a sessão", async ({ loginPage, shell }) => {
    await step("Dado que a Brisa está logada", () => loginPage.signIn("brisa"));
    await step("Quando clica em sair", () => shell.signOut());
    await step("Então volta para o login", () => loginPage.expectVisible());
  });
});
