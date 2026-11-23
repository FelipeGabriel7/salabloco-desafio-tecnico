import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export type BookingFields = { room?: string; date?: string; start?: string; end?: string; title?: string; email?: string };

export class BookingFormPage extends BasePage {
  private room = () => this.heal(this.page.getByLabel("Sala", { exact: true }), this.page.locator("#roomId"));
  private date = () => this.heal(this.page.getByLabel("Data", { exact: true }), this.page.locator("#date"));
  private start = () => this.heal(this.page.getByLabel("Início", { exact: true }), this.page.locator("#start"));
  private end = () => this.heal(this.page.getByLabel("Fim", { exact: true }), this.page.locator("#end"));
  private title = () => this.heal(this.page.getByLabel("Título da reunião", { exact: true }), this.page.locator("#title"));
  private email = () => this.heal(this.page.getByLabel("E-mail do responsável", { exact: true }), this.page.locator("#responsibleEmail"));
  private submitButton = () => this.heal(this.page.getByRole("button", { name: "Reservar sala" }), this.page.locator("form button[type=submit]"));
  private requestError = () => this.page.getByRole("alert").filter({ hasText: "Não foi possível reservar" });

  async expectLoaded(heading = "Nova reserva") {
    await expect(this.page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(this.room()).toBeVisible();
  }

  async fill(fields: BookingFields) {
    if (fields.room) await this.room().selectOption({ label: fields.room });
    if (fields.date) await this.date().fill(fields.date);
    if (fields.start) await this.start().fill(fields.start);
    if (fields.end) await this.end().fill(fields.end);
    if (fields.title) await this.title().fill(fields.title);
    if (fields.email) await this.email().fill(fields.email);
  }

  async submit() {
    await this.submitButton().click();
  }

  async create(fields: BookingFields) {
    await this.fill(fields);
    await this.submit();
  }

  async expectServerError(text: string) {
    await expect(this.requestError()).toContainText(text);
  }

  async expectErrorHides(text: string) {
    await expect(this.requestError()).not.toContainText(text);
  }

  async chooseFirstSuggestion() {
    await this.requestError().getByRole("button").first().click();
  }

  async expectFieldError(text: string) {
    await expect(this.page.getByText(text, { exact: true })).toBeVisible();
  }

  async expectValues(values: { room?: string; date?: string; start?: string }) {
    if (values.room) await expect(this.room()).toHaveValue(values.room);
    if (values.date) await expect(this.date()).toHaveValue(values.date);
    if (values.start) await expect(this.start()).toHaveValue(values.start);
  }

  async expectStartChangedFrom(time: string) {
    await expect(this.start()).not.toHaveValue(time);
  }

  async countPostsDuring(action: () => Promise<void>) {
    let posts = 0;
    const count = (request: { method(): string }) => {
      if (request.method() === "POST") posts += 1;
    };
    this.page.on("request", count);
    await action();
    this.page.off("request", count);
    return posts;
  }
}
