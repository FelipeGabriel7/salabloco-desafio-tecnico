# ADR 0014. Enums e interfaces como contrato de tipos

## Decisão

| Quando | Uso |
| --- | --- |
| Conjunto **fechado** de valores, compartilhado entre camadas ou exposto na API | `enum` de string |
| Formato que alguém **implementa** (repositórios, relógio) | `interface` |
| Formato de dados (DTO, resposta, entidade) ou união | `type` |
| Dois valores simples, usados num lugar só | `boolean` ou união literal, **não** enum |

| Enum | Valores | Onde |
| --- | --- | --- |
| `ErrorCode` | `VALIDATION`, `INVALID_DATE`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BOOKING_CONFLICT`, `END_BEFORE_START`, `DURATION_TOO_SHORT`, `DURATION_TOO_LONG`, `OUTSIDE_OPENING_HOURS`, `IN_THE_PAST`, `ROOM_NOT_FOUND`, `RATE_LIMITED`, `INTERNAL` | `shared/errors/` |
| `HttpStatus` | `OK = 200`, `CREATED = 201`, `NO_CONTENT = 204`, `BAD_REQUEST = 400`, `UNAUTHORIZED = 401`, `FORBIDDEN = 403`, `NOT_FOUND = 404`, `CONFLICT = 409`, `UNPROCESSABLE_ENTITY = 422`, `TOO_MANY_REQUESTS = 429`, `INTERNAL_SERVER_ERROR = 500` | `shared/http/` |
| `NodeEnv` | `development`, `test`, `production` | `shared/config/` |
| `Locale` | `pt-BR`, `en` | `shared/errors/` |
| `PersistenceDriver` | `json`, `firestore` (e `memory` para testes) | `shared/config/` |

**Interfaces e tipos:** `Booking`, `Room`, `Company` (entidades); `CreateBookingInput`; `BookingResponse`, `BusySlot`, `Suggestion` (formato público); `ErrorResponse`; `BookingRepository`, `RoomRepository`, `CompanyRepository` ([ADR 0002](0002-estrutura-mvc-servico.md)); `Clock` (`{ now(): Date }`); `AppConfig` ([ADR 0013](0013-configuracao-e-segredos.md)); `AuthenticatedCompany`.

### Catálogo único de erros

```ts
const errorCatalog: Record<ErrorCode, { status: HttpStatus; messages: Record<Locale, string> }> = {
  [ErrorCode.BOOKING_CONFLICT]: { status: HttpStatus.CONFLICT, messages: { ... } },
  ...
};
```

Como é `Record<ErrorCode, ...>`, **o compilador falha** se um código novo ficar sem status ou mensagem. O `AppError` recebe só o código, e status e mensagem saem do catálogo: um código nunca tem dois status nem fica sem tradução.

### String enum, não numérico nem `const enum`

- **`enum` de string:** minha escolha, porque o valor é legível no JSON e nos logs.
- **`enum` numérico:** aceita qualquer número e cria mapeamento reverso. A exceção é `HttpStatus`, onde o número é o dado.
- **`const enum`:** não funciona bem com `isolatedModules` e o esbuild do Vite.
- **União literal:** serve para poucos valores locais, mas não dá lista iterável em runtime.

### No front

O front mantém uma **cópia própria** do `ErrorCode`, sem pacote compartilhado ([ADR 0004](0004-validacao.md)). Para evitar divergência, o OpenAPI lista o `enum` de `code`, um teste de API confere que todo `code` devolvido pertence ao enum, e a coleção Bruno valida o contrato.

## Consequências

- **Ganho:** o compilador pega erro de digitação e catálogo incompleto, e o contrato entre as camadas fica explícito.
- **Custo:** mais arquivos de tipos, e o front duplica o enum.
- **Verificações:** todo `ErrorCode` tem status e mensagem em todos os idiomas (unitário); nenhuma resposta usa `code` fora do enum (API); nenhum número de status solto nos controllers (lint ou revisão).
