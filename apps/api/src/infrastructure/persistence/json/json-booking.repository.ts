import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Booking, Database } from "../../../shared/types.ts";
import { overlaps } from "../../../shared/time.ts";

const emptyDatabase: Database = { companies: [], rooms: [], bookings: [] };
let pendingWrite = Promise.resolve();

async function readDatabase(path: string): Promise<Database> {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8")) as Database;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(emptyDatabase);
    }

    throw error;
  }
}

async function saveDatabase(path: string, database: Database) {
  const file = resolve(path);
  await mkdir(dirname(file), { recursive: true });

  const temporaryFile = `${file}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(database, null, 2)}\n`);
  await rename(temporaryFile, file);
}

function queueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingWrite.then(operation);
  pendingWrite = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function readInQueue(path: string) {
  return queueWrite(() => readDatabase(path));
}

export async function listRooms(path: string) {
  return (await readInQueue(path)).rooms;
}

export async function listCompanies(path: string) {
  return (await readInQueue(path)).companies;
}

export async function roomExists(path: string, roomId: string) {
  const rooms = await listRooms(path);
  return rooms.some((room) => room.id === roomId);
}

export async function listCompanyBookings(path: string, companyId: string) {
  const { bookings } = await readInQueue(path);

  return bookings
    .filter((booking) => booking.companyId === companyId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function listRoomBookings(path: string, roomId: string) {
  const { bookings } = await readInQueue(path);
  return bookings.filter((booking) => booking.roomId === roomId);
}

export function createIfFree(path: string, input: Omit<Booking, "id" | "createdAt">): Promise<{ booking: Booking } | { conflict: Booking }> {
  return queueWrite(async () => {

    const database = await readDatabase(path);
    const start = Date.parse(input.startsAt);
    const end = Date.parse(input.endsAt);

    const conflict = database.bookings.find(
      (booking) => booking.roomId === input.roomId &&
        overlaps(
          start,
          end,
          Date.parse(booking.startsAt),
          Date.parse(booking.endsAt),
        ),
    );

    if (conflict) return { conflict };

    const booking: Booking = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    database.bookings.push(booking);

    await saveDatabase(path, database);
    return { booking };
  });
}

export function updateIfFree(
  path: string,
  companyId: string,
  id: string,
  input: Omit<Booking, "id" | "companyId" | "createdAt">,
): Promise<{ booking: Booking } | { conflict: Booking } | { notFound: true }> {
  return queueWrite(async () => {
    const database = await readDatabase(path);
    const index = database.bookings.findIndex(
      (booking) => booking.id === id && booking.companyId === companyId,
    );

    if (index < 0) return { notFound: true };

    const conflict = database.bookings.find(
      (booking) =>
        booking.id !== id &&
        booking.roomId === input.roomId &&
        overlaps(
          Date.parse(input.startsAt),
          Date.parse(input.endsAt),
          Date.parse(booking.startsAt),
          Date.parse(booking.endsAt),
        ),
    );

    if (conflict) return { conflict };

    const booking = { ...database.bookings[index], ...input };
    database.bookings[index] = booking;

    await saveDatabase(path, database);
    return { booking };
  });
}

export function deleteBooking(path: string, companyId: string, id: string): Promise<boolean> {
  return queueWrite(async () => {
    const database = await readDatabase(path);
    const index = database.bookings.findIndex((booking) => booking.companyId === companyId && booking.id === id);

    if (index < 0) return false;

    database.bookings.splice(index, 1);
    await saveDatabase(path, database);
    return true;
  });
}
