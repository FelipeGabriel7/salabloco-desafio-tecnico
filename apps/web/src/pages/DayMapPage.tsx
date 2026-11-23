import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorAlert, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { getAvailability, getRooms } from "@/services/httpApi";
import { newBookingPath } from "@/routes";
import { addDaysStr, fmtDayShort, timeOf, todayStr } from "@/services/time";
import type { BusySlot } from "@/services/types";

export function DayMapPage() {
  useTitle("Mapa do dia");

  const { session } = useAuth();
  const [date, setDate] = useState(todayStr(session!.timezone));
  const { state, reload } = useAsync(async () => {
    const rooms = await getRooms();
    return Promise.all(rooms.map(async (room) => ({...room, busy: await getAvailability(session!.token, room.id, date)})));

  }, [session?.token, date]);

  const header = (
    <PageHeader
      title="Mapa do dia"
      description="Veja os horários ocupados de cada sala."
    />
  );

  if (state.status === "loading") {
    return <>{header}<Skeleton className="h-64" aria-busy="true" /></>;
  }

  if (state.status === "error") {
    return <>{header}<ErrorAlert error={state.error} onRetry={reload} /></>;
  }

  return (
    <>
      {header}

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Data" htmlFor="date">
          <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Button variant="outline" onClick={() => setDate(addDaysStr(date, -1))}>Dia anterior</Button>
        <Button variant="outline" onClick={() => setDate(addDaysStr(date, 1))}>Próximo dia</Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">Disponibilidade de {fmtDayShort(date)}.</p>

      <ul className="grid gap-3">
        {state.data.map((room) => (
          <li key={room.id}>
            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <h2 className="font-bold">{room.name}</h2>
                <p className="text-sm text-muted-foreground">Capacidade: {room.capacity} pessoas</p>
                <BusyTimes busy={room.busy} timezone={session!.timezone} />
              </div>
              <Link to={newBookingPath(room.id, date)} className={buttonVariants()}>
                Reservar sala
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

function BusyTimes({ busy, timezone }: { busy: BusySlot[]; timezone: string }) {
  if (!busy.length) {
    return <p className="mt-1 text-sm text-green-700">Sem reservas neste dia.</p>;
  }

  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Ocupada: {busy.map((slot) => `${timeOf(slot.startsAt, timezone)}–${timeOf(slot.endsAt, timezone)}`).join(", ")}
    </p>
  );
}
