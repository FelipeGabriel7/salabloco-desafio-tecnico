import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BookingsPage extends BasePage {
  private card = (title: string) => this.page.getByRole("listitem").filter({ hasText: title });

  async expectBooking(title: string, ...details: string[]) {
    await this.expectPath("/reservas");
    for (const detail of details) await expect(this.card(title)).toContainText(detail);
  }

  async expectNoBooking(title: string) {
    await expect(this.page.getByText(title)).toHaveCount(0);
  }

  async edit(title: string) {
    await this.card(title).getByRole("link", { name: "Editar" }).click();
  }

  async cancel(title: string, confirm: boolean) {
    this.page.once("dialog", (dialog) => (confirm ? dialog.accept() : dialog.dismiss()));
    await this.card(title).getByRole("button", { name: "Cancelar" }).click();
  }

  async expectEmpty() {
    await expect(this.page.getByRole("heading", { name: "Nenhuma reserva próxima" })).toBeVisible();
    await expect(this.page.getByRole("link", { name: "Reservar sala" })).toBeVisible();
  }
}
