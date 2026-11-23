import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export class AccessibilityCheck {
  constructor(private readonly page: Page) {}

  async seriousViolations() {
    const result = await new AxeBuilder({ page: this.page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    return result.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => violation.id);
  }
}
