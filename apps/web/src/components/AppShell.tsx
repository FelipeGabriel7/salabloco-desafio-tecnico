import { LayoutGrid, ListChecks, LogOut, Plus } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/utils/paths";
import { DemoPanel } from "@/components/DemoPanel";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { companyName } from "@/utils/companies";
import { cn } from "@/utils/cn";

const items = [
  { to: paths.bookings, label: "Reservas", icon: ListChecks, end: true },
  { to: paths.dayMap, label: "Mapa do dia", icon: LayoutGrid, end: false },
  { to: paths.newBooking, label: "Nova reserva", icon: Plus, end: false },
];

export function AppShell() {
  const { session, logout } = useAuth();
  const company = companyName(session?.companyId ?? "");

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 md:px-8">
          <NavLink to={paths.bookings} aria-label="Salabloco, ir para Reservas">
            <Wordmark />
          </NavLink>
          <nav aria-label="Principal" className="hidden gap-1 md:flex">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "rounded-[10px] px-3.5 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold">{company}</p>
              <p className="text-xs text-muted-foreground">Empresa ativa</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-7 md:px-8 md:py-9">
        <Outlet />
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                isActive ? "text-accent-foreground" : "text-muted-foreground",
              )
            }
          >
            <Icon className="size-[22px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <DemoPanel />
    </div>
  );
}
