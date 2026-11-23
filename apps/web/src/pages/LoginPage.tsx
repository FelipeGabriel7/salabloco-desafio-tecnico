import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Navigate } from "react-router-dom";
import { Wordmark } from "@/components/Logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/types";
import { getCompanies } from "@/services/httpApi";
import { useAsync } from "@/hooks/useAsync";
import { paths } from "@/routes";
import { useTitle } from "@/hooks/useTitle";

export const loginSchema = z.object({
  companyId: z.string().trim().min(1, "Informe o ID da empresa"),
  token: z.string().trim().min(1, "Informe o token de acesso"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  useTitle("Entrar");

  const { session, login } = useAuth();

  const toast = useToast();
  const [requestError, setRequestError] = useState("");
  const companies = useAsync(getCompanies, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { companyId: "", token: "" },
  });

  async function submit(values: LoginValues) {
    setRequestError("");

    try {

      if  (companies.state.status !== "ready") {
        setRequestError("Não foi possível entrar. Confira se a API está ativa.");
        return;
      }

      const company = companies.state.data.find((c) => c.id === values.companyId);

      if (!company) {
        setRequestError("Selecione uma empresa carregada do servidor.");
        return;
      }

      await login(values.companyId, values.token.trim(), company.name);
      toast("Login realizado");
    } catch (error) {

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setRequestError("Token inválido para a empresa selecionada.");
        return;
      }

      if (error instanceof ApiError && error.status === 429) {
        setRequestError(error.message);
        return;
      }

      setRequestError("Não foi possível entrar. Confira se a API está ativa.");
    }
  }

  if (session) return <Navigate to={paths.bookings} replace />;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <section className="grid w-full max-w-md gap-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <Wordmark />
        <div>
          <h1 className="text-2xl font-extrabold">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha a empresa recebida da API e informe o token de acesso.
          </p>
        </div>

        {requestError ? <Alert variant="destructive" title="Não foi possível entrar">{requestError}</Alert> : null}

        <form onSubmit={handleSubmit(submit)} className="grid gap-5">
          <Field label="Empresa" htmlFor="companyId" error={errors.companyId?.message}>
            <Select id="companyId" disabled={companies.state.status !== "ready"} {...register("companyId")}>
              <option value="">Selecione uma empresa</option>
              {companies.state.status === "ready" && companies.state.data.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </Select>
          </Field>

          {companies.state.status === "loading" ? <p className="text-sm text-muted-foreground">Carregando empresas...</p> : null}
          {companies.state.status === "error" ? (
            <Alert variant="destructive" title="Empresas indisponíveis">
              Não foi possível carregar a lista do servidor.
              <button type="button" className="ml-2 underline" onClick={companies.reload}>Tentar novamente</button>
            </Alert>
          ) : null}

          <Field label="Token" htmlFor="token" error={errors.token?.message}>
            <Input id="token" type="password" autoComplete="off" {...register("token")} />
          </Field>

          <Button type="submit" disabled={isSubmitting || companies.state.status !== "ready"}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
