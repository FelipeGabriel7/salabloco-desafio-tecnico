import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EmptyState, ErrorAlert, PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ApiError } from "@/services/types";

describe("componentes compartilhados", () => {
  it("mostra título, descrição e ação do cabeçalho", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        title="Reservas"
        description="Reservas da empresa"
        action={<a href="/nova">Criar reserva</a>}
      />,
    );

    expect(html).toContain("Reservas");
    expect(html).toContain("Reservas da empresa");
    expect(html).toContain("Criar reserva");
  });

  it("mostra estado vazio e ação quando não há itens", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon={<span>!</span>}
        title="Sem reservas"
        description="Crie a primeira reserva."
        action={<Button>Nova reserva</Button>}
      />,
    );

    expect(html).toContain("Sem reservas");
    expect(html).toContain("Crie a primeira reserva.");
    expect(html).toContain("Nova reserva");
  });

  it("mostra erro da API e oferece tentar novamente", () => {
    const html = renderToStaticMarkup(
      <ErrorAlert error={new ApiError(0, "NETWORK", "Servidor indisponível")} onRetry={vi.fn()} />,
    );

    expect(html).toContain("Servidor indisponível");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('role="alert"');
  });

  it("associa label, input e mensagem de validação", () => {
    const html = renderToStaticMarkup(
      <Field label="E-mail" htmlFor="email" error="Informe um e-mail válido">
        <Input id="email" type="email" />
      </Field>,
    );

    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain("Informe um e-mail válido");
  });

  it("renderiza opções de select", () => {
    const html = renderToStaticMarkup(
      <Select aria-label="Empresa">
        <option value="">Selecione</option>
        <option value="empresa-1">Empresa 1</option>
      </Select>,
    );

    expect(html).toContain("Empresa 1");
    expect(html).toContain('value="empresa-1"');
  });
});
