import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { dayMapPath, paths } from "@/utils/paths";
import { EmptyState, ErrorAlert, PageHeader } from "@/components/blocks";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge, Card, Segmented, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { MIN, dateOf, fmtDayShort, fmtDuration, relativeDay, timeOf } from "@/utils/time";
import type { Booking, Room } from "@/utils/types";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { companyName } from "@/utils/companies";
import { describeError } from "@/utils/errors";
import { roomColor } from "@/utils/timeline";

type Tab = "next" | "past";

function RoomDot({ color }: { color: string }) {
  return <span className="mr-2 inline-block size-2.5 rounded-full align-baseline" style={{ background: color }} />;
}

function details(b: Booking, rooms: Room[]) {
  const date = dateOf(b.startsAt);
  return {
    date,
    day: fmtDayShort(date),
    rel: relativeDay(date),
    time: `${timeOf(b.startsAt)} – ${timeOf(b.endsAt)}`,
    duration: fmtDuration((Date.parse(b.endsAt) - Date.parse(b.startsAt)) / MIN),
    room: rooms.find((r) => r.id === b.roomId)?.name ?? b.roomId,
    color: roomColor(rooms, b.roomId),
  };
}

export function BookingsPage() {
  useTitle("Reservas");
  const { api, session } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("aba") === "passadas" ? "past" : "next";
  const { state, reload } = useAsync(() => Promise.all([api.listBookings(), api.listRooms()]), [api]);
  const [target, setTarget] = useState<Booking | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmCancel() {
    if (!target) return;
    setRemoving(true);
    try {
      await api.deleteBooking(target.id);
      toast("Reserva cancelada");
    } catch (err) {
      toast(err instanceof ApiError && err.status === 404 ? "Reserva não encontrada" : describeError(err).message);
    } finally {
      setRemoving(false);
      setTarget(null);
      reload();
    }
  }

  const header = (
    <PageHeader
      title="Reservas da empresa"
      description={`Somente as reservas de ${companyName(session?.companyId ?? "")}.`}
      action={
        <Link to={paths.newBooking} className={buttonVariants()}>
          <Plus /> Nova reserva
        </Link>
      }
    />
  );

  if (state.status === "loading" && !state.data) {
    return (
      <>
        {header}
        <div className="grid gap-2.5" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </>
    );
  }
  if (state.status === "error") {
    return (
      <>
        {header}
        <ErrorAlert error={state.error} onRetry={reload} />
      </>
    );
  }

  const [bookings, rooms] = state.data!;
  const now = Date.now();
  const upcoming = bookings.filter((b) => Date.parse(b.endsAt) > now);
  const past = bookings.filter((b) => Date.parse(b.endsAt) <= now).reverse();
  const list = tab === "next" ? upcoming : past;
  const next = upcoming[0];
  const nextInfo = next ? details(next, rooms) : null;

  return (
    <>
      {header}

      {next && nextInfo ? (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary px-6 py-5 text-primary-foreground">
          <div className="grid gap-1">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase opacity-80">Próxima reunião</p>
            <p className="font-display text-2xl font-extrabold tracking-tight">{next.title}</p>
            <p className="text-sm tabular-nums opacity-90">
              {nextInfo.room} · {nextInfo.rel ? nextInfo.rel.toLowerCase() : nextInfo.day}, {nextInfo.time}
            </p>
          </div>
          <Link to={dayMapPath(nextInfo.date)} className={buttonVariants({ variant: "inverse" })}>
            Ver no mapa
          </Link>
        </section>
      ) : null}

      <div className="mb-4">
        <Segmented<Tab>
          ariaLabel="Período"
          value={tab}
          onChange={(v) => setParams(v === "past" ? { aba: "passadas" } : {}, { replace: true })}
          options={[
            { value: "next", label: `Próximas · ${upcoming.length}` },
            { value: "past", label: "Passadas" },
          ]}
        />
      </div>

      {!list.length ? (
        tab === "next" ? (
          <EmptyState
            icon={<Inbox />}
            title="Nenhuma reserva por aqui"
            description="Quando sua empresa reservar uma sala, ela aparece nesta lista."
            action={
              <Link to={paths.newBooking} className={buttonVariants()}>
                <Plus /> Reservar uma sala
              </Link>
            }
          />
        ) : (
          <EmptyState icon={<Inbox />} title="Nenhuma reserva passada" description="As reuniões que já aconteceram ficam aqui." />
        )
      ) : (
        <>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="h-11 px-4">Data</th>
                  <th className="px-4">Horário</th>
                  <th className="px-4">Sala</th>
                  <th className="px-4">Reunião</th>
                  <th className="px-4">Responsável</th>
                  <th className="px-4">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => {
                  const d = details(b, rooms);
                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {d.day}
                        {d.rel && tab === "next" ? <Badge className="ml-2">{d.rel}</Badge> : null}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">
                        <span className="font-semibold">{d.time}</span>
                        <span className="block text-xs text-muted-foreground">{d.duration}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <RoomDot color={d.color} />
                        {d.room}
                      </td>
                      <td className="px-4 py-3.5">{b.title}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{b.responsibleEmail}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {tab === "next" ? (
                          <Button variant="danger" size="sm" onClick={() => setTarget(b)} aria-label={`Cancelar reserva ${b.title}`}>
                            Cancelar
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <ul className="grid gap-3 md:hidden">
            {list.map((b) => {
              const d = details(b, rooms);
              return (
                <li key={b.id}>
                  <Card className="grid gap-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-base font-extrabold">{b.title}</p>
                      {d.rel && tab === "next" ? <Badge>{d.rel}</Badge> : null}
                    </div>
                    <p className="text-sm leading-relaxed">
                      <RoomDot color={d.color} />
                      {d.room}
                      <span className="block text-muted-foreground tabular-nums">
                        {d.day} · {d.time} · {d.duration}
                      </span>
                    </p>
                    <p className="text-[13px] text-muted-foreground">{b.responsibleEmail}</p>
                    {tab === "next" ? (
                      <Button variant="outline" className="h-11 text-destructive" onClick={() => setTarget(b)} aria-label={`Cancelar reserva ${b.title}`}>
                        Cancelar reserva
                      </Button>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={!!target}
        title="Cancelar esta reserva?"
        confirmLabel="Cancelar reserva"
        cancelLabel="Manter reserva"
        busy={removing}
        onConfirm={confirmCancel}
        onCancel={() => setTarget(null)}
      >
        {target ? (
          <>
            <div className="rounded-[10px] border bg-background px-3.5 py-2.5 text-foreground">
              <p className="font-semibold">{target.title}</p>
              <p className="text-[13px] text-muted-foreground">
                {details(target, state.data![1]).room} · {details(target, state.data![1]).day}, {details(target, state.data![1]).time}
              </p>
            </div>
            <p>A sala volta a ficar livre para outras empresas. Essa ação não pode ser desfeita.</p>
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
