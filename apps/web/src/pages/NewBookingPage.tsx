import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { dayMapPath, paths } from "@/utils/paths";
import { SlotPicker } from "@/components/SlotPicker";
import { ErrorAlert, PageHeader } from "@/components/blocks";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DOMAIN_MESSAGES, MAX_DURATION_MIN, MIN_DURATION_MIN } from "@/utils/booking";
import { SLOT_VIOLATION, SlotStatus, analyseSlot } from "@/utils/slot";
import { buildBookingSchema, type BookingValues } from "@/utils/booking.schema";
import {
  addDaysStr,
  fmtDayShort,
  fmtDuration,
  fmtMinutes,
  hhmmToMinutes,
  isValidDate,
  nowMinute,
  timeOf,
  toIso,
  todayStr,
} from "@/utils/time";
import type { Booking, BusySlot, Room } from "@/utils/types";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { describeError } from "@/utils/errors";
import { suggestSlots, type Suggestion } from "@/utils/suggest";
import { buildCells } from "@/utils/slotGrid";
import { isFutureMinute, roomColor, spansFree, toSpans } from "@/utils/timeline";

const bookingSchema = buildBookingSchema();

const durationHint = (minutes: number | null) =>
  `Duração: ${fmtDuration(minutes ?? 0)} (mínimo ${MIN_DURATION_MIN} minutos, máximo ${MAX_DURATION_MIN / 60} horas)`;

/** Campo da API (startsAt, endsAt...) para o campo do formulário. */
const FIELD_MAP: Record<string, keyof BookingValues> = {
  roomId: "roomId",
  date: "date",
  startsAt: "start",
  endsAt: "end",
  title: "title",
  responsibleEmail: "responsibleEmail",
};

export function NewBookingPage() {
  useTitle("Nova reserva");
  const { api, session } = useAuth();
  const [params] = useSearchParams();
  const rooms = useAsync(() => api.listRooms(), [api]);
  const mine = useAsync(() => api.listBookings(), [api, session?.companyId]);

  const header = <PageHeader title="Nova reserva" description="Reserve uma sala para a sua empresa." />;

  if (rooms.state.status === "error") {
    return (
      <>
        {header}
        <ErrorAlert error={rooms.state.error} onRetry={rooms.reload} />
      </>
    );
  }
  if (rooms.state.status !== "ready" && !rooms.state.data) {
    return (
      <>
        {header}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]" aria-busy="true">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[320px]" />
        </div>
      </>
    );
  }
  return (
    <>
      {header}
      <NewBookingForm
        rooms={rooms.state.data!}
        mine={mine.state.status === "ready" ? mine.state.data : []}
        params={params}
      />
    </>
  );
}

function NewBookingForm({ rooms, mine, params }: { rooms: Room[]; mine: Booking[]; params: URLSearchParams }) {
  const { api } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const today = todayStr();

  const roomParam = params.get("sala");
  const dateParam = params.get("data") ?? "";
  const defaults: BookingValues = {
    roomId: rooms.some((r) => r.id === roomParam) ? (roomParam as string) : rooms[0].id,
    date: isValidDate(dateParam) && dateParam >= today ? dateParam : addDaysStr(today, 1),
    start: params.get("inicio") ?? "14:00",
    end: params.get("fim") ?? "15:00",
    title: "",
    responsibleEmail: "",
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({ resolver: zodResolver(bookingSchema), mode: "onTouched", defaultValues: defaults });

  const [conflict, setConflict] = useState<{ message: string; slot?: BusySlot } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const values = useWatch({ control }) as BookingValues;
  const room = rooms.find((r) => r.id === values.roomId) ?? rooms[0];
  const color = roomColor(rooms, room.id);

  const avail = useAsync(
    () =>
      values.date && isValidDate(values.date)
        ? api.availability(values.roomId, values.date)
        : Promise.resolve([] as BusySlot[]),
    [api, values.roomId, values.date],
  );
  const spans = avail.state.status === "ready" ? toSpans(avail.state.data, values.date, values.roomId, mine) : [];

  const slot = analyseSlot(values.start, values.end);
  const candidate =
    slot.start !== null && slot.end !== null && slot.status !== SlotStatus.END_BEFORE_START
      ? { s: slot.start, e: slot.end }
      : null;
  const candidateBad = candidate ? !spansFree(spans, candidate.s, candidate.e) : false;
  const violation = SLOT_VIOLATION[slot.status];
  const cells = buildCells(spans, (minute) => !isFutureMinute(values.date, minute));

  function applyRange({ s, e }: { s: number; e: number }) {
    const options = { shouldValidate: true, shouldDirty: true, shouldTouch: true };
    setValue("start", fmtMinutes(s), options);
    setValue("end", fmtMinutes(e), options);
  }

  // Qualquer mudança de sala, dia ou horário invalida o aviso de conflito anterior.
  useEffect(() => {
    setConflict(null);
    setSuggestions([]);
  }, [values.roomId, values.date, values.start, values.end]);

  // O alerta de conflito recebe foco e entra na tela: no celular o formulário é longo.
  useEffect(() => {
    if (!conflict) return;
    alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    alertRef.current?.focus({ preventScroll: true });
  }, [conflict]);

  async function loadSuggestions(v: BookingValues) {
    setSuggesting(true);
    try {
      const lists = await Promise.all(
        rooms.map(async (r) => [r.id, toSpans(await api.availability(r.id, v.date), v.date, r.id, mine)] as const),
      );
      const start = hhmmToMinutes(v.start);
      const end = hhmmToMinutes(v.end);
      setSuggestions(
        suggestSlots({
          roomId: v.roomId,
          roomIds: rooms.map((r) => r.id),
          busyByRoom: Object.fromEntries(lists),
          s: start,
          e: end,
          earliest: v.date === today ? Math.ceil(nowMinute() / 30) * 30 : 0,
        }),
      );
    } catch {
      setSuggestions([]);
    } finally {
      setSuggesting(false);
    }
  }

  async function onSubmit(v: BookingValues) {
    setConflict(null);
    setSuggestions([]);
    setFormError(null);
    try {
      await api.createBooking({
        roomId: v.roomId,
        startsAt: toIso(v.date, v.start),
        endsAt: toIso(v.date, v.end),
        title: v.title.trim(),
        responsibleEmail: v.responsibleEmail.trim(),
      });
      toast(`Reserva criada: ${room.name}, ${v.start} às ${v.end}`);
      navigate(paths.bookings);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setConflict({ message: err.message, slot: err.conflict });
          avail.reload(); // a linha do tempo passa a mostrar o bloco que causou o conflito
          await loadSuggestions(v);
          return;
        }
        const field = err.field ? FIELD_MAP[err.field] : undefined;
        if (field) {
          setError(field, { type: "server", message: err.message });
          return;
        }
      }
      setFormError(describeError(err).message);
    }
  }

  function applySuggestion(x: Suggestion) {
    setValue("roomId", x.roomId, { shouldValidate: true });
    setValue("start", fmtMinutes(x.s), { shouldValidate: true });
    setValue("end", fmtMinutes(x.e), { shouldValidate: true });
    clearErrors();
    setConflict(null);
    setSuggestions([]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-5 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          {conflict ? (
            <div ref={alertRef} tabIndex={-1} className="outline-none">
              <Alert variant="destructive" title="Sala indisponível neste horário">
                <p>
                  A {room.name} já está reservada
                  {conflict.slot ? ` das ${timeOf(conflict.slot.startsAt)} às ${timeOf(conflict.slot.endsAt)}` : " neste horário"}. A
                  disponibilidade ao lado foi atualizada.
                </p>
                {suggesting ? (
                  <p className="mt-3 text-muted-foreground">Procurando horários livres…</p>
                ) : suggestions.length ? (
                  <div className="mt-3 grid gap-2">
                    <p className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">Que tal um destes</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((x) => (
                        <button
                          key={`${x.roomId}-${x.s}`}
                          type="button"
                          onClick={() => applySuggestion(x)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-card px-3.5 text-[13px] font-semibold text-foreground tabular-nums outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <i className="size-2.5 rounded-full" style={{ background: roomColor(rooms, x.roomId) }} />
                          {rooms.find((r) => r.id === x.roomId)?.name} · {fmtMinutes(x.s)} – {fmtMinutes(x.e)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    <p>Não há outro horário livre com essa duração neste dia.</p>
                    <div className="flex flex-wrap gap-2">
                      <Link to={dayMapPath(values.date)} className={buttonVariants({ variant: "outline", size: "sm" }) + " h-11 text-foreground"}>
                        Ver o mapa do dia
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 text-foreground"
                        onClick={() => setValue("date", addDaysStr(values.date, 1), { shouldValidate: true })}
                      >
                        Tentar o dia seguinte
                      </Button>
                    </div>
                  </div>
                )}
              </Alert>
            </div>
          ) : null}
          {formError ? <Alert variant="destructive" title="Não foi possível reservar">{formError}</Alert> : null}

          <Field label="Sala" htmlFor="roomId" error={errors.roomId?.message}>
            <Select id="roomId" aria-invalid={!!errors.roomId} {...register("roomId")}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.capacity} pessoas
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
            <Field label="Data" htmlFor="date" error={errors.date?.message} className="col-span-2 sm:col-span-1">
              <Input id="date" type="date" min={today} aria-invalid={!!errors.date} {...register("date")} />
            </Field>
            <Field label="Início" htmlFor="start" error={errors.start?.message}>
              <Input id="start" type="time" step={900} aria-invalid={!!errors.start} {...register("start")} />
            </Field>
            <Field label="Fim" htmlFor="end" error={errors.end?.message}>
              <Input id="end" type="time" step={900} aria-invalid={!!errors.end} {...register("end")} />
            </Field>
          </div>
          {violation ? (
            <Alert variant="destructive" title="Horário inválido">
              {DOMAIN_MESSAGES[violation]}.
              {slot.minutes !== null && slot.minutes > 0 ? ` Você escolheu ${fmtDuration(slot.minutes)}.` : ""}
            </Alert>
          ) : (
            <p className="-mt-2.5 text-[13px] text-muted-foreground" aria-live="polite">
              {slot.minutes === null ? "Informe início e fim." : durationHint(slot.minutes)}
            </p>
          )}

          {candidateBad && !conflict ? (
            <p role="status" className="-mt-2.5 text-[13px] font-semibold text-destructive">
              Este horário já está ocupado nesta sala. Escolha outro horário ou outra sala.
            </p>
          ) : null}

          <section aria-labelledby="availability-title" className="grid gap-3 rounded-[14px] border bg-muted/30 p-4">
            <div className="grid gap-1">
              <h2 id="availability-title" className="text-base font-extrabold">Escolha o horário</h2>
              <p className="text-sm text-muted-foreground">
                {room.name}
                {values.date && isValidDate(values.date) ? ` · ${fmtDayShort(values.date)}` : ""}
              </p>
            </div>
            {avail.state.status === "error" ? (
              <ErrorAlert error={avail.state.error} onRetry={avail.reload} />
            ) : avail.state.status === "loading" && !avail.state.data ? (
              <Skeleton className="h-24" aria-busy="true" />
            ) : (
              <>
                <SlotPicker
                  key={`${values.roomId}-${values.date}`}
                  cells={cells}
                  selection={candidate}
                  color={color}
                  label={`Horários da ${room.name}`}
                  onChange={applyRange}
                />
              </>
            )}
          </section>

          <Field label="Título da reunião" htmlFor="title" error={errors.title?.message}>
            <Input id="title" maxLength={80} placeholder="Ex.: Planning do trimestre" aria-invalid={!!errors.title} {...register("title")} />
          </Field>
          <Field label="E-mail do responsável" htmlFor="responsibleEmail" error={errors.responsibleEmail?.message}>
            <Input
              id="responsibleEmail"
              type="email"
              placeholder="nome@empresa.com.br"
              aria-invalid={!!errors.responsibleEmail}
              {...register("responsibleEmail")}
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(paths.bookings)}>
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Reservando…" : "Reservar sala"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
