import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, isMock } from "@/services";
import { DEMO_TOKENS } from "@/services/mockApi";
import { clearFlash, peekFlash, useAuth } from "@/contexts/AuthContext";
import { paths } from "@/utils/paths";
import { Wordmark } from "@/components/Logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useTitle } from "@/hooks/useTitle";
import { COMPANIES, companyName } from "@/utils/companies";
import { describeError } from "@/utils/errors";
import { loginSchema, type LoginValues } from "@/utils/login.schema";

/** Faixas decorativas: mostram a ideia do produto, uma linha do tempo por sala. */
const DECOR = [
  { label: "Sala Savassi", color: "var(--room-1)", blocks: [[14.3, 10.7], [28.6, 7.1]] },
  { label: "Sala Pampulha", color: "var(--room-2)", blocks: [[14.3, 25], [50, 14.3]] },
  { label: "Serra do Curral", color: "var(--room-3)", blocks: [[46.4, 7.1]] },
  { label: "Auditório", color: "var(--room-4)", blocks: [] as number[][] },
];

export function LoginPage() {
  useTitle("Entrar");
  const { session, login } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const flash = useMemo(peekFlash, []);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onTouched", defaultValues: { companyId: "acme", token: "" } });

  useEffect(() => clearFlash(), []);

  const from = (location.state as { from?: string } | null)?.from ?? paths.bookings;
  if (session) return <Navigate to={from} replace />;

  const onSubmit = async ({ companyId, token }: LoginValues) => {
    setFormError(null);
    try {
      await login(companyId, token.trim());
      toast(`Bem-vindo, ${companyName(companyId)}`);
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 401
          ? `Token inválido para ${companyName(companyId)}.`
          : describeError(err).message,
      );
    }
  };

  return (
    <div className="grid min-h-dvh md:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between gap-10 bg-primary p-12 text-primary-foreground md:flex">
        <Wordmark className="text-primary-foreground [&_.fill-primary]:fill-primary-foreground [&_.fill-primary-foreground]:fill-primary" />
        <div className="grid max-w-[30rem] gap-5">
          <h2 className="text-[42px] leading-[1.1] font-extrabold">Veja a sala livre antes de reservar.</h2>
          <p className="text-base leading-relaxed opacity-85">
            Cada empresa enxerga só as próprias reservas. A disponibilidade das salas é de todos.
          </p>
          <div aria-hidden="true" className="grid gap-2.5 rounded-[14px] bg-black/20 p-4">
            {DECOR.map((row) => (
              <div key={row.label} className="grid grid-cols-[92px_1fr] items-center gap-3 text-xs opacity-95">
                <span>{row.label}</span>
                <div className="relative h-[26px] rounded-lg bg-white/15">
                  {row.blocks.map(([left, width]) => (
                    <i
                      key={left}
                      className="absolute inset-y-1 rounded-[5px]"
                      style={{ left: `${left}%`, width: `${width}%`, background: `color-mix(in srgb, ${row.color} 55%, white)` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[13px] opacity-80">Reservas de salas de reunião do coworking</p>
      </aside>

      <main className="grid place-items-center px-5 py-10">
        <div className="grid w-full max-w-[380px] gap-6">
          <Wordmark className="md:hidden" />
          <div className="grid gap-1.5">
            <h1 className="text-[28px] font-extrabold">Entrar</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Escolha sua empresa e informe o token de acesso enviado pelo coworking.
            </p>
          </div>

          {flash ? <Alert variant="destructive" title="Sessão encerrada">{flash}</Alert> : null}
          {formError ? <Alert variant="destructive" title="Não foi possível entrar">{formError}</Alert> : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
            <Field label="Empresa" htmlFor="companyId" error={errors.companyId?.message}>
              <Select id="companyId" aria-invalid={!!errors.companyId} {...register("companyId")}>
                {COMPANIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Token de acesso" htmlFor="token" error={errors.token?.message}>
              <Input
                id="token"
                type="password"
                autoComplete="off"
                placeholder="Cole o token da empresa"
                aria-invalid={!!errors.token}
                {...register("token")}
              />
            </Field>
            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          {isMock ? (
            <div className="rounded-xl border bg-muted/50 px-4 py-3 text-[13px]">
              <p className="font-semibold">Só no protótipo</p>
              {Object.keys(DEMO_TOKENS).length ? (
                <p className="mt-0.5 text-muted-foreground">
                  Tokens de demonstração:{" "}
                  {Object.values(DEMO_TOKENS).map((t, i) => (
                    <span key={t}>
                      {i ? " · " : ""}
                      <code className="font-mono text-foreground">{t}</code>
                    </span>
                  ))}
                </p>
              ) : (
                <p className="mt-0.5 text-muted-foreground">
                  Nenhum token configurado. Copie <code className="font-mono text-foreground">.env.example</code> para{" "}
                  <code className="font-mono text-foreground">.env</code> e reinicie.
                </p>
              )}
            </div>
          ) : null}
          <p className="text-center text-[13px] text-muted-foreground">Não tem o token? Peça na recepção do coworking.</p>
        </div>
      </main>
    </div>
  );
}
