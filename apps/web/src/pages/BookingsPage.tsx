import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorAlert, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { deleteBooking, getBookings, getRooms } from "@/services/httpApi";
import { dateOf, fmtDayShort, timeOf } from "@/services/time";
import type { Booking, Room } from "@/services/types";
import { paths } from "@/routes";

export function BookingsPage() {
  useTitle("Reservas");
  const { session } = useAuth();
  const toast = useToast();
  const [showPast, setShowPast] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const { state, reload } = useAsync(
    () => Promise.all([getBookings(session!), getRooms()]),
    [session?.token, session?.companyId],
  );

  async function cancel(booking: Booking) {
    if (!window.confirm(`Cancelar a reserva "${booking.title}"?`)) return;

    setRemovingId(booking.id);
    try {
      await deleteBooking(session!, booking.id);
      toast("Reserva cancelada");
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Não foi possível cancelar a reserva.");
    } finally {
      setRemovingId("");
    }
  }

  const header = (
    <PageHeader
      title="Reservas da empresa"
      description={`Reservas de ${session?.companyName ?? session?.companyId ?? ""}.`}
      action={<Link to={paths.newBooking} className={buttonVariants()}><Plus /> Nova reserva</Link>}
    />
  );

  if (state.status === "loading") {
    return <>{header}<Skeleton className="h-48" aria-busy="true" /></>;
  }

  if (state.status === "error") {
    return <>{header}<ErrorAlert error={state.error} onRetry={reload} /></>;
  }

  const [bookings, rooms] = state.data;
  const now = Date.now();
  const visibleBookings = bookings
    .filter((booking) => showPast ? Date.parse(booking.endsAt) <= now : Date.parse(booking.endsAt) > now)
    .sort((a, b) => showPast
      ? Date.parse(b.startsAt) - Date.parse(a.startsAt)
      : Date.parse(a.startsAt) - Date.parse(b.startsAt));

  return (
    <>
      {header}

      <div className="mb-4 flex gap-2">
        <Button variant={showPast ? "outline" : "default"} onClick={() => setShowPast(false)}>Próximas</Button>
        <Button variant={showPast ? "default" : "outline"} onClick={() => setShowPast(true)}>Passadas</Button>
      </div>

      {!visibleBookings.length ? (
        <EmptyState
          icon={<Inbox />}
          title={showPast ? "Nenhuma reserva passada" : "Nenhuma reserva próxima"}
          description={showPast ? "As reservas que já aconteceram aparecem aqui." : "Crie uma reserva para sua empresa."}
          action={!showPast ? <Link to={paths.newBooking} className={buttonVariants()}><Plus /> Reservar sala</Link> : undefined}
        />
      ) : (
        <ul className="grid gap-3">
          {visibleBookings.map((booking) => {
            const room = rooms.find((item: Room) => item.id === booking.roomId);
            const date = dateOf(booking.startsAt, session!.timezone);

            return (
              <li key={booking.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <h2 className="font-bold">{booking.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {room?.name ?? booking.roomId} · {fmtDayShort(date)} · {timeOf(booking.startsAt, session!.timezone)}–{timeOf(booking.endsAt, session!.timezone)}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.responsibleEmail}</p>
                  </div>
                  {!showPast ? (
                    <div className="flex gap-2">
                      <Link
                        to={paths.newBooking}
                        state={{ booking }}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        Editar
                      </Link>
                      <Button variant="outline" disabled={removingId === booking.id} onClick={() => cancel(booking)}>
                        {removingId === booking.id ? "Cancelando..." : "Cancelar"}
                      </Button>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
