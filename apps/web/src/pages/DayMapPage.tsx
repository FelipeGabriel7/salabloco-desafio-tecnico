import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorAlert, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { getAvailabilityDetails, getRooms } from "@/services/httpApi";
import { newBookingPath } from "@/routes";
import { addDaysStr, fmtDayShort, timeOf, todayStr } from "@/services/time";
import type { BusySlot } from "@/services/types";

export function DayMapPage() {
  useTitle("Mapa do dia");

  const { session } = useAuth();
  const [date, setDate] = useState(todayStr(session!.timezone));
  const { state, reload } = useAsync(async () => {
    const rooms = await getRooms();
    return Promise.all(rooms.map(async (room) => ({
      ...room,
      ...await getAvailabilityDetails(session!.token, room.id, date),
    })));

  }, [session?.token, date]);

  const header = (
    <PageHeader
      title="Mapa do dia"
      description="Consulte os períodos livres e ocupados de cada sala."
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
          <Input id="date" type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} />
        </Field>
        <Button variant="outline" onClick={() => setDate(addDaysStr(date, -1))}>Dia anterior</Button>
        <Button variant="outline" onClick={() => setDate(addDaysStr(date, 1))}>Próximo dia</Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">Disponibilidade de {fmtDayShort(date)}.</p>
      <p className="mb-4 text-sm text-muted-foreground">Expediente: 07:00 às 22:00. A reserva deve ter entre 30 minutos e 4 horas e não pode começar no passado.</p>

      <ul className="grid gap-3">
        {state.data.map((room) => (
          <li key={room.id}>
            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <h2 className="font-bold">{room.name}</h2>
                <p className="text-sm text-muted-foreground">Capacidade: {room.capacity} pessoas</p>
                <div className="mt-3 w-full max-w-md" aria-hidden="true">
                  <div className="relative h-4 overflow-hidden rounded-full bg-green-200 dark:bg-green-900">
                    {room.busy.map((slot) => {
                      const start = timeOf(slot.startsAt, session!.timezone).split(":").map(Number);
                      const end = timeOf(slot.endsAt, session!.timezone).split(":").map(Number);
                      const from = Math.max(0, start[0] * 60 + start[1] - 420);
                      const to = Math.min(900, end[0] * 60 + end[1] - 420);
                      if (to <= from) return null;
                      return <span key={slot.startsAt} className="absolute inset-y-0 bg-red-600" style={{ left: `${from / 9}%`, width: `${(to - from) / 9}%` }} />;
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>07:00</span><span>22:00</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">Verde: livre · Vermelho: ocupado</p>
                </div>
                <FreeTimes free={room.free} timezone={session!.timezone} />
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

function FreeTimes({ free, timezone }: { free: BusySlot[]; timezone: string }) {
  if (!free.length) return <p className="mt-2 font-medium">Sem períodos livres no expediente.</p>;

  return (
    <div className="mt-2">
      <p className="font-medium">Períodos livres</p>
      <ul className="mt-1 flex flex-wrap gap-2" aria-label="Períodos livres">
        {free.map((slot) => (
          <li key={slot.startsAt} className="rounded-md border border-green-600 px-2 py-1 text-sm">
            {timeOf(slot.startsAt, timezone)}–{timeOf(slot.endsAt, timezone)}
          </li>
        ))}
      </ul>
    </div>
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
