import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DayMapPage extends BasePage {
  private room = (name: string) => this.page.getByRole("listitem").filter({ hasText: name });
  private errorAlert = () => this.page.getByRole("alert").filter({ hasText: "Erro inesperado" });

  async selectDate(date: string) {
    await this.heal(this.page.getByLabel("Data", { exact: true }), this.page.locator("#date")).fill(date);
  }

  async expectRoom(name: string) {
    await expect(this.room(name)).toBeVisible();
  }

  async expectBusy(room: string, slot: string) {
    await expect(this.room(room)).toContainText(`Ocupada: ${slot}`);
  }

  async expectHidden(text: string) {
    await expect(this.page.getByText(text)).toHaveCount(0);
  }

  async book(room: string) {
    await this.room(room).getByRole("link", { name: "Reservar sala" }).click();
  }

  async failNextAvailabilityRequests() {
    await this.page.route("**/api/rooms/*/availability?*", (route) =>
      route.fulfill({ status: 500, json: { code: "INTERNAL", message: "Erro inesperado." } }),
    );
  }

  async restoreAvailabilityRequests() {
    await this.page.unrouteAll();
  }

  async expectLoadError() {
    await expect(this.errorAlert()).toBeVisible();
  }

  async retry() {
    await this.errorAlert().getByRole("button", { name: "Tentar novamente" }).click();
  }
}
