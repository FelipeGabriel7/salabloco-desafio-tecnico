import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { newBookingPath } from "@/utils/paths";
import { AvailabilityTimeline, TimelineLegend, TimelineTicks } from "@/components/AvailabilityTimeline";
import { VerticalDayView } from "@/components/VerticalDayView";
import { ErrorAlert, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { addDaysStr, fmtDayShort, fmtMinutes, isValidDate, todayStr } from "@/utils/time";
import type { BusySlot } from "@/utils/types";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { freeWindows, roomColor, toSpans } from "@/utils/timeline";
import { cn } from "@/utils/cn";

export function DayMapPage() {
  useTitle("Mapa do dia");
  const { api } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const today = todayStr();
  const asked = params.get("data") ?? "";
  const date = isValidDate(asked) ? asked : today;

  const { state, reload } = useAsync(async () => {
    const rooms = await api.listRooms();
    const [lists, mine] = await Promise.all([Promise.all(rooms.map((r) => api.availability(r.id, date))), api.listBookings()]);
    const busy: Record<string, BusySlot[]> = {};
    rooms.forEach((r, i) => (busy[r.id] = lists[i]));
    return { rooms, busy, mine };
  }, [api, date]);

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  const goTo = (next: string) => setParam("data", next === today ? null : next);

  const book = (roomId: string, s?: number, e?: number) => {
    const q = new URLSearchParams({ sala: roomId, data: date });
    if (s != null && e != null) {
      q.set("inicio", fmtMinutes(s));
      q.set("fim", fmtMinutes(e));
    }
    navigate(`/reservas/nova?${q.toString()}`);
  };

  const header = (
    <PageHeader
      title="Mapa do dia"
      description="Veja quando cada sala está livre e toque num horário para reservar."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => goTo(addDaysStr(date, -1))}>
            <ChevronLeft />
          </Button>
          <div className="flex h-9 min-w-36 items-center justify-center rounded-[10px] border bg-card px-3.5 text-sm font-semibold" aria-live="polite">
            {fmtDayShort(date)}
          </div>
          <Button variant="outline" size="icon" aria-label="Próximo dia" onClick={() => goTo(addDaysStr(date, 1))}>
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goTo(today)} disabled={date === today}>
            Hoje
          </Button>
        </div>
      }
    />
  );

  if (state.status === "error") {
    return (
      <>
        {header}
        <ErrorAlert error={state.error} onRetry={reload} />
      </>
    );
  }
  if (state.status === "loading" && !state.data) {
    return (
      <>
        {header}
        <div className="grid gap-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[50px]" />
          ))}
        </div>
      </>
    );
  }

  const { rooms, busy, mine } = state.data!;
  const selected = rooms.find((r) => r.id === params.get("sala")) ?? rooms[0];
  const selectedColor = roomColor(rooms, selected.id);
  const selectedSpans = toSpans(busy[selected.id] ?? [], date, selected.id, mine);
  const free = freeWindows(selectedSpans);

  return (
    <>
      {header}

      {/* Celular: uma sala por vez, horas na vertical. */}
      <div className="md:hidden">
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Salas">
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === selected.id}
              onClick={() => setParam("sala", r.id)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary",
                r.id === selected.id ? "border-primary bg-accent text-accent-foreground" : "bg-card text-foreground",
              )}
            >
              <i className="size-2.5 rounded-full" style={{ background: roomColor(rooms, r.id) }} />
              {r.name}
            </button>
          ))}
        </div>

        <div className="mb-3 grid gap-1">
          <p className="text-sm font-semibold">
            {selected.name} <span className="font-normal text-muted-foreground">· {selected.capacity} pessoas</span>
          </p>
          <p className="text-[13px] text-muted-foreground">
            {free.length
              ? `Livre: ${free
                  .slice(0, 3)
                  .map((w) => `${fmtMinutes(w.s)}–${fmtMinutes(w.e)}`)
                  .join(" · ")}${free.length > 3 ? " …" : ""}`
              : "Sem horários livres neste dia."}
          </p>
        </div>

        <VerticalDayView
          spans={selectedSpans}
          color={selectedColor}
          date={date}
          label={`${selected.name}, ${fmtDayShort(date)}`}
          onPick={({ s, e }) => book(selected.id, s, e)}
          onBlocked={(reason) => toast(reason === "past" ? "Esse horário já passou." : "Esse horário está ocupado.")}
        />

        <div className="mt-3">
          <TimelineLegend color={selectedColor} />
        </div>
        <Button className="mt-4 h-11 w-full" onClick={() => book(selected.id)}>
          <Plus /> Reservar {selected.name}
        </Button>
      </div>

      {/* Telas largas: todas as salas lado a lado. */}
      <div className="hidden md:block">
        <Card className="grid gap-3 p-6">
          <div className="grid grid-cols-[240px_1fr] gap-4">
            <span />
            <TimelineTicks />
          </div>
          {rooms.map((room) => {
            const color = roomColor(rooms, room.id);
            const spans = toSpans(busy[room.id] ?? [], date, room.id, mine);
            return (
              <div key={room.id} className="grid grid-cols-[240px_1fr] items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <i className="size-3 shrink-0 rounded" style={{ background: color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.capacity} pessoas</p>
                  </div>
                  <Link to={newBookingPath({ room: room.id, date })} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Reservar
                  </Link>
                </div>
                <AvailabilityTimeline
                  spans={spans}
                  color={color}
                  date={date}
                  label={`${room.name}, ${fmtDayShort(date)}`}
                  showTicks={false}
                  onPick={({ s, e }) => book(room.id, s, e)}
                />
              </div>
            );
          })}
          <div className="pt-1 pl-[256px]">
            <TimelineLegend color="var(--room-1)" />
          </div>
        </Card>
      </div>

      <p className="mt-3.5 text-[13px] text-muted-foreground">
        Reservas de outras empresas aparecem só como ocupado. Título, e-mail e nome da empresa não saem da API.
      </p>
    </>
  );
}
