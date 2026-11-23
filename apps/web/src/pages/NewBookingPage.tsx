import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorAlert, PageHeader } from "@/components/blocks";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useTitle } from "@/hooks/useTitle";
import { createBooking, getAvailability, getRooms, updateBooking } from "@/services/httpApi";
import { ApiError, type BookingSuggestion } from "@/services/types";
import { addDaysStr, dateOf, isValidDate, timeOf, toIso, todayStr } from "@/services/time";
import { paths } from "@/routes";
import type { Booking, Room } from "@/services/types";

export const bookingSchema = z.object({
  roomId: z.string().min(1, "Escolha uma sala"),
  date: z.string().date("Informe uma data válida"),
  start: z.string().min(1, "Informe o início"),
  end: z.string().min(1, "Informe o fim"),
  title: z.string().trim().min(1, "Informe o título da reunião"),
  responsibleEmail: z.string().trim().email("Informe um e-mail válido"),
});

type BookingValues = z.infer<typeof bookingSchema>;

export function NewBookingPage() {
  useTitle("Nova reserva");
  const rooms = useAsync(getRooms, []);
  const location = useLocation();
  const editing = location.state?.booking as Booking | undefined;
  const header = <PageHeader title={editing ? "Editar reserva" : "Nova reserva"} description="Reserve uma sala para sua empresa." />;

  if (rooms.state.status === "error") {
    return <>{header}<ErrorAlert error={rooms.state.error} onRetry={rooms.reload} /></>;
  }

  if (rooms.state.status !== "ready") {
    return <>{header}<Skeleton className="h-96" aria-busy="true" /></>;
  }

  return <>{header}<NewBookingForm rooms={rooms.state.data} booking={editing} /></>;
}

function NewBookingForm({ rooms, booking }: { rooms: Room[]; booking?: Booking }) {
  const { session } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = todayStr(session!.timezone);
  const roomId = params.get("sala");
  const requestedDate = params.get("data") ?? "";
  const [requestError, setRequestError] = useState("");
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([]);
  const roomFromQuery = rooms.find((room) => room.id === roomId);
  const defaultRoomId = booking?.roomId ?? roomFromQuery?.id ?? rooms[0]?.id ?? "";

  let defaultDate = addDaysStr(today, 1);
  if (isValidDate(requestedDate) && requestedDate >= today) {
    defaultDate = requestedDate;
  }
  if (booking) {
    defaultDate = dateOf(booking.startsAt, session!.timezone);
  }

  const defaultStart = booking
    ? timeOf(booking.startsAt, session!.timezone)
    : params.get("inicio") ?? "";
  const defaultEnd = booking
    ? timeOf(booking.endsAt, session!.timezone)
    : params.get("fim") ?? "";

  const {register, handleSubmit, control, setValue, formState: { errors, isSubmitting },} = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: defaultRoomId,
      date: defaultDate,
      start: defaultStart,
      end: defaultEnd,
      title: booking?.title ?? "",
      responsibleEmail: booking?.responsibleEmail ?? "",
    },
  });

  const values = useWatch({ control });
  const selectedRoom = rooms.find((room) => room.id === values.roomId) ?? rooms[0];
  const availability = useAsync(
    () => values.date
      ? getAvailability(session!.token, selectedRoom.id, values.date)
      : Promise.resolve([]),
    [session?.token, selectedRoom.id, values.date],
  );

  async function submit(form: BookingValues) {
    setRequestError("");
    setSuggestions([]);

    try {
      const input = {
        roomId: form.roomId,
        startsAt: toIso(form.date, form.start, session!.timezone),
        endsAt: toIso(form.date, form.end, session!.timezone),
        title: form.title.trim(),
        responsibleEmail: form.responsibleEmail.trim(),
      };

      if (booking) {
        await updateBooking(session!, booking.id, input);
        toast("Reserva atualizada");
      } else {
        await createBooking(session!, input);
        toast("Reserva criada");
      }

      navigate(paths.bookings);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setRequestError(error.message);
        setSuggestions(error.suggestions ?? []);
        availability.reload();
        return;
      }

      setRequestError(error instanceof Error ? error.message : "Não foi possível criar a reserva.");
    }
  }

  function chooseSuggestion(suggestion: BookingSuggestion) {
    setValue("roomId", suggestion.roomId);
    setValue("date", dateOf(suggestion.startsAt, session!.timezone));
    setValue("start", timeOf(suggestion.startsAt, session!.timezone));
    setValue("end", timeOf(suggestion.endsAt, session!.timezone));
    setRequestError("");
    setSuggestions([]);
  }

  const busy = availability.state.status === "ready" ? availability.state.data : [];

  return (
    <Card className="mx-auto grid max-w-2xl gap-5 p-5 md:p-6">
      <form onSubmit={handleSubmit(submit)} className="grid gap-5">
        {requestError ? (
          <Alert variant="destructive" title="Não foi possível reservar">
            {requestError}
            {suggestions.length ? (
              <div className="mt-3 grid gap-2">
                <p>Horários sugeridos:</p>
                {suggestions.map((suggestion) => {
                  const room = rooms.find((item) => item.id === suggestion.roomId);
                  return (
                    <button
                      key={`${suggestion.roomId}-${suggestion.startsAt}`}
                      type="button"
                      className="text-left underline"
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      {room?.name}, {timeOf(suggestion.startsAt, session!.timezone)}–{timeOf(suggestion.endsAt, session!.timezone)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </Alert>
        ) : null}

        <Field label="Sala" htmlFor="roomId" error={errors.roomId?.message}>
          <Select id="roomId" {...register("roomId")}>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name} · {room.capacity} pessoas</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Data" htmlFor="date" error={errors.date?.message}>
            <Input id="date" type="date" min={today} {...register("date")} />
          </Field>
          <Field label="Início" htmlFor="start" error={errors.start?.message}>
            <Input id="start" type="time" step={900} {...register("start")} />
          </Field>
          <Field label="Fim" htmlFor="end" error={errors.end?.message}>
            <Input id="end" type="time" step={900} {...register("end")} />
          </Field>
        </div>

        <section className="rounded-xl border bg-muted/30 p-4">
          <h2 className="font-semibold">Horários ocupados · {selectedRoom.name}</h2>
          {availability.state.status === "loading" ? <p className="mt-2 text-sm">Carregando...</p> : null}
          {availability.state.status === "error" ? <p className="mt-2 text-sm text-destructive">Não foi possível carregar a disponibilidade.</p> : null}
          {availability.state.status === "ready" && !busy.length ? <p className="mt-2 text-sm">Nenhuma reserva neste dia.</p> : null}
          {busy.length ? (
            <ul className="mt-2 grid gap-1 text-sm">
              {busy.map((slot) => <li key={slot.startsAt}>{timeOf(slot.startsAt, session!.timezone)}–{timeOf(slot.endsAt, session!.timezone)} ocupado</li>)}
            </ul>
          ) : null}
        </section>

        <Field label="Título da reunião" htmlFor="title" error={errors.title?.message}>
          <Input id="title" {...register("title")} />
        </Field>
        <Field label="E-mail do responsável" htmlFor="responsibleEmail" error={errors.responsibleEmail?.message}>
          <Input id="responsibleEmail" type="email" {...register("responsibleEmail")} />
        </Field>

        <div className="flex justify-end gap-2">
          <Link to={paths.bookings} className={buttonVariants({ variant: "outline" })}>Voltar</Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Reservando..." : "Reservar sala"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
