import { expect, type Locator, type Page } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected heal(primary: Locator, ...fallbacks: Locator[]) {
    return fallbacks.reduce((locator, fallback) => locator.or(fallback), primary).first();
  }

  async expectPath(path: string) {
    await expect.poll(() => new URL(this.page.url()).pathname).toBe(path);
  }

  async expectToast(text: string) {
    await expect(this.page.getByRole("status").filter({ hasText: text })).toBeVisible();
  }

  async hasHorizontalScroll() {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }
}
