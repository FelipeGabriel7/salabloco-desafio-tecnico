import { expect } from "@playwright/test";
import { companies, type CompanyId } from "../fixtures/env";
import { BasePage } from "./BasePage";

type MenuItem = "Reservas" | "Mapa do dia" | "Nova reserva";

export class AppShell extends BasePage {
  async goTo(item: MenuItem) {
    const menu = this.page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: item, exact: true });
    await this.heal(menu.filter({ visible: true }), this.page.getByRole("link", { name: item, exact: true })).click();
  }

  async expectSignedInAs(company: CompanyId) {
    await this.expectPath("/reservas");
    await expect(this.page.getByText(`Reservas de ${companies[company]}`)).toBeVisible();
  }

  async reopenBookings() {
    await this.goTo("Mapa do dia");
    await this.goTo("Reservas");
  }

  async signOut() {
    await this.page.getByRole("button", { name: "Sair" }).click();
  }
}
