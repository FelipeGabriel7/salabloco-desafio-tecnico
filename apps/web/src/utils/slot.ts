import { MAX_DURATION_MIN, MIN_DURATION_MIN, type DomainCode } from "./booking";
import { hhmmToMinutes } from "./time";

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export enum SlotStatus {
  INCOMPLETE = "incomplete",
  END_BEFORE_START = "end-before-start",
  TOO_SHORT = "too-short",
  TOO_LONG = "too-long",
  OK = "ok",
}

const SLOT_RULES: ReadonlyArray<[SlotStatus, (minutes: number) => boolean]> = [
  [SlotStatus.END_BEFORE_START, (m) => m <= 0],
  [SlotStatus.TOO_SHORT, (m) => m < MIN_DURATION_MIN],
  [SlotStatus.TOO_LONG, (m) => m > MAX_DURATION_MIN],
];

export type SlotAnalysis = { status: SlotStatus; start: number | null; end: number | null; minutes: number | null };

/**
 * Lê os dois campos de horário do formulário e diz em que situação a duração está.
 * Só descreve (para a dica na tela). Quem bloqueia o envio é o esquema de validação.
 */
export function analyseSlot(start: string, end: string): SlotAnalysis {
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    return { status: SlotStatus.INCOMPLETE, start: null, end: null, minutes: null };
  }
  const s = hhmmToMinutes(start);
  const e = hhmmToMinutes(end);
  const minutes = e - s;
  const violated = SLOT_RULES.find(([, isViolated]) => isViolated(minutes));
  return { status: violated?.[0] ?? SlotStatus.OK, start: s, end: e, minutes };
}

/** Situação da duração que é um erro, e o código de regra correspondente (escolhe a mensagem). */
export const SLOT_VIOLATION: Partial<Record<SlotStatus, DomainCode>> = {
  [SlotStatus.END_BEFORE_START]: "END_BEFORE_START",
  [SlotStatus.TOO_SHORT]: "DURATION_TOO_SHORT",
  [SlotStatus.TOO_LONG]: "DURATION_TOO_LONG",
};
