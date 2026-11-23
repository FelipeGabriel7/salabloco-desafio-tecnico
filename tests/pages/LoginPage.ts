import { expect } from "@playwright/test";
import { companies, env, type CompanyId } from "../fixtures/env";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  private company = () => this.heal(this.page.getByLabel("Empresa", { exact: true }), this.page.locator("#companyId"));
  private token = () => this.heal(this.page.getByLabel("Token", { exact: true }), this.page.locator("#token"));
  private submit = () => this.heal(this.page.getByRole("button", { name: "Entrar" }), this.page.locator("form button[type=submit]"));

  async open() {
    await this.page.goto("/login");
    await expect(this.company()).toBeEnabled();
  }

  async signIn(company: CompanyId, token = env.tokens[company]) {
    await this.open();
    await this.company().selectOption({ label: companies[company] });
    await this.token().fill(token);
    await this.submit().click();
  }

  async signInWithKeyboard(company: CompanyId) {
    await this.open();
    await this.company().focus();
    await this.company().selectOption({ label: companies[company] });
    await this.page.keyboard.press("Tab");
    await this.page.keyboard.type(env.tokens[company]);
    await this.page.keyboard.press("Enter");
  }

  async submitEmpty() {
    await this.open();
    await this.submit().click();
  }

  async expectError(text: string) {
    await expect(this.page.getByRole("alert").filter({ hasText: "Não foi possível entrar" })).toContainText(text);
  }

  async expectFieldError(text: string) {
    await expect(this.page.getByText(text, { exact: true })).toBeVisible();
  }

  async expectVisible() {
    await this.expectPath("/login");
    await expect(this.page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  }

  async openPrivateArea() {
    await this.page.goto("/reservas");
  }
}
