# ADR 0004. Validação com zod em middleware

## Decisão

Valido toda entrada com **zod**, num middleware `validation(schema)` aplicado na rota, **antes do controller**.

```ts
router.post("/", validation(createBookingSchema), controller.create);
```

O esquema fica no módulo (`modules/bookings/validation/`) e o middleware é genérico (`shared/middlewares/validation.ts`). Uma falha vira `AppError` com `ErrorCode.VALIDATION` (ou `INVALID_DATE`) e o `field` do primeiro problema.

Os erros usam um **enum de códigos** (`ErrorCode`), e um catálogo associa cada código à mensagem por idioma (`pt-BR` hoje, preparado para `en`). A resposta traz o `code`, que é o contrato, e a `message` no idioma pedido. A lista de códigos está no [ADR 0014](0014-enums-e-interfaces.md).

### Onde cada verificação acontece

| Tipo | Onde | Status |
| --- | --- | --- |
| Formato (e-mail, ISO, tamanho, campo desconhecido) | middleware `validation` | 400 |
| Regra de negócio (duração, expediente, passado) | `BookingsService` | 422 |
| Estado (conflito, existência) | `BookingsService` e repository | 409, 404 |

Com isso separo "entrada malformada" de "entrada bem formada que o negócio recusa".

### Controles de segurança

- **`.strict()`** nos esquemas de corpo: campo desconhecido (`companyId`, `id`) é rejeitado, não ignorado. Isso previne *mass assignment*.
- **Limites:** `title` até 80 caracteres, e-mail até 254, corpo até 10 kb.
- **Sem coerção silenciosa:** data fora do ISO ou inexistente (`2026-02-30`) é rejeitada ([ADR 0006](0006-tempo-e-fuso.md)).

## Consequências

- **Ganho:** os tipos TypeScript saem do esquema (`z.infer`), as mensagens são consistentes e traduzíveis, e a validação aparece na rota.
- **Custo:** o front também valida (react-hook-form + zod), então a regra de formato existe nos dois lados, e há um catálogo de mensagens para manter.
- **Fonte da verdade:** o servidor. O front valida só para responder rápido. Compartilhar o esquema num pacote seria uma evolução, mas exige build e configuração a mais.
