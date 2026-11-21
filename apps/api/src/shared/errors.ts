import { messages } from "./utils/messages.ts";

type Conflict = { startsAt: string; endsAt: string };
type Suggestion = { roomId: string; startsAt: string; endsAt: string };

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;
  readonly conflict?: Conflict;
  readonly suggestions?: Suggestion[];

  constructor(status: number, code: string, message: string, field?: string, conflict?: Conflict, suggestions?: Suggestion[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
    this.conflict = conflict;
    this.suggestions = suggestions;
  }
}

export function notFound(): AppError {
  return new AppError(404, "NOT_FOUND", messages.notFound);
}
