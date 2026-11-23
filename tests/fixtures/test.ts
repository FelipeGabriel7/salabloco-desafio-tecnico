import { test as base, expect } from "@playwright/test";
import { AccessibilityCheck } from "../pages/AccessibilityCheck";
import { AppShell } from "../pages/AppShell";
import { BookingFormPage } from "../pages/BookingFormPage";
import { BookingsPage } from "../pages/BookingsPage";
import { DayMapPage } from "../pages/DayMapPage";
import { LoginPage } from "../pages/LoginPage";
import { ApiClient } from "./api";

type Pages = {
  loginPage: LoginPage;
  shell: AppShell;
  bookingsPage: BookingsPage;
  bookingForm: BookingFormPage;
  dayMap: DayMapPage;
  a11y: AccessibilityCheck;
  api: ApiClient;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  shell: async ({ page }, use) => use(new AppShell(page)),
  bookingsPage: async ({ page }, use) => use(new BookingsPage(page)),
  bookingForm: async ({ page }, use) => use(new BookingFormPage(page)),
  dayMap: async ({ page }, use) => use(new DayMapPage(page)),
  a11y: async ({ page }, use) => use(new AccessibilityCheck(page)),
  api: [
    async ({}, use) => {
      const api = await ApiClient.start();
      await api.removeTestBookings();
      await use(api);
      await api.removeTestBookings();
      await api.stop();
    },
    { auto: true },
  ],
});

export const { step } = test;
export { expect };
