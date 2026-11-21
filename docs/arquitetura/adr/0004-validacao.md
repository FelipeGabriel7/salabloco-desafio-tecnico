# ADR 0004. Validação com zod em middleware e erros por enum

## Contexto

O desafio pede validação das entradas, com respostas de erro claras e códigos HTTP adequados. Express não valida nada por conta própria, e entrada não validada é a origem da maior parte dos problemas de segurança.

## Decisão

1. Valido com **zod**, por um middleware **`validation(schema)`** aplicado na rota, **antes do controller**.
2. Uso um **enum de códigos de erro** (`ErrorCode`) como base do tratamento de erros e da tradução das mensagens.

```ts
router.post("/", validation(createBookingSchema), controller.create);
```

- O esquema fica no módulo (`modules/bookings/validation/`); o middleware é genérico (`shared/middlewares/validation.ts`).
- Falha de validação vira `AppError` com `ErrorCode.VALIDATION` (ou `INVALID_DATE`) e o `field` do primeiro problema.
- Um catálogo associa cada `ErrorCode` à mensagem por idioma (hoje `pt-BR`, preparado para `en`). A resposta traz o `code` (contrato) e a `message` no idioma pedido.

A lista de códigos e o catálogo estão no [ADR 0014](0014-enums-e-interfaces.md).

## Onde cada verificação acontece

| Tipo | Onde | Status |
| --- | --- | --- |
| Formato (e-mail, ISO, tamanho, campos desconhecidos) | middleware `validation` + zod | 400 |
| Regra de negócio (duração, expediente, passado) | `BookingsService` | 422 |
| Estado (conflito, existência) | `BookingsService` + repository | 409, 404 |

Assim separo "entrada malformada" de "entrada bem formada que o negócio recusa".

## Controles de segurança

- **`.strict()`** nos esquemas de corpo: campo desconhecido (`companyId`, `id`) é rejeitado, não ignorado. Previne *mass assignment*.
- **Limites:** `title` até 80 caracteres, e-mail até 254, corpo até 10 kb.
- **Sem coerção silenciosa:** datas fora do formato ISO ou inexistentes (2026-02-30) são rejeitadas ([ADR 0006](0006-tempo-e-fuso.md)).

## Consequências

| Ganho | Custo |
| --- | --- |
| Tipos TypeScript derivados do esquema (`z.infer`) | O front também valida (react-hook-form + zod): a regra de formato existe nos dois lados |
| Mensagens consistentes e traduzíveis por `code` | Um catálogo de mensagens para manter |
| Validação visível na rota, antes de qualquer lógica | |

O servidor é a fonte da verdade; o front valida só para dar resposta rápida. Compartilhar o esquema em um pacote seria uma evolução, mas adiciona build e configuração, então deixo para depois.
