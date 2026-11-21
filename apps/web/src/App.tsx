import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { BookingsPage } from "@/pages/BookingsPage";
import { DayMapPage } from "@/pages/DayMapPage";
import { LoginPage } from "@/pages/LoginPage";
import { NewBookingPage } from "@/pages/NewBookingPage";
import { paths } from "@/utils/paths";

const router = createBrowserRouter([
  { path: paths.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: paths.bookings, element: <BookingsPage /> },
          { path: paths.newBooking, element: <NewBookingPage /> },
          { path: paths.dayMap, element: <DayMapPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to={paths.bookings} replace /> },
]);

/** Provedores de contexto (tema, avisos, sessão) em volta do roteador. */
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
