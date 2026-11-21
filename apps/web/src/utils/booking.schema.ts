import { z } from "zod";
import { DOMAIN_MESSAGES, checkRules, type DomainCode } from "@/utils/booking";
import { TIME_PATTERN } from "@/utils/slot";
import { toIso } from "@/utils/time";

const requiredText = (message: string) => z.string().trim().min(1, message);

/** Em que campo do formulário cada regra de negócio aparece. */
const RULE_FIELD: Record<DomainCode, "start" | "end"> = {
  END_BEFORE_START: "end",
  DURATION_TOO_SHORT: "end",
  DURATION_TOO_LONG: "end",
  OUTSIDE_OPENING_HOURS: "start",
  IN_THE_PAST: "start",
};

const bookingFields = z.object({
  roomId: requiredText("Escolha uma sala"),
  date: z.string().date("Informe uma data válida"),
  start: z.string().regex(TIME_PATTERN, "Informe o início"),
  end: z.string().regex(TIME_PATTERN, "Informe o fim"),
  title: requiredText("Informe o título da reunião").max(80, "Use até 80 caracteres"),
  responsibleEmail: requiredText("Informe o e-mail do responsável").email("Informe um e-mail válido"),
});

export type BookingValues = z.infer<typeof bookingFields>;

/**
 * Dois estágios. 1) Formato de cada campo. 2) Regras de negócio que olham vários campos juntos.
 * `pipe` só executa o estágio 2 se o estágio 1 passou inteiro, então as regras nunca recebem
 * data ou hora malformada. O relógio entra como parâmetro: nos testes se passa um "agora" fixo.
 */
export const buildBookingSchema = (now: () => Date = () => new Date()) =>
  bookingFields.pipe(
    z.custom<BookingValues>().superRefine(({ date, start, end }, ctx) => {
      const violated = checkRules({ startsAt: toIso(date, start), endsAt: toIso(date, end) }, now());
      if (!violated) return;
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [RULE_FIELD[violated]], message: DOMAIN_MESSAGES[violated] });
    }),
  );
