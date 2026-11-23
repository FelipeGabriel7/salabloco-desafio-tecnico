import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import { BookingsPage } from "@/pages/BookingsPage";
import { DayMapPage } from "@/pages/DayMapPage";
import { LoginPage } from "@/pages/LoginPage";
import { NewBookingPage } from "@/pages/NewBookingPage";
import { paths } from "@/routes";

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path={paths.login} element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path={paths.bookings} element={<BookingsPage />} />
                  <Route path={paths.newBooking} element={<NewBookingPage />} />
                  <Route path={paths.dayMap} element={<DayMapPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to={paths.bookings} replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
