# API

Contrato formal em [openapi.yaml](openapi.yaml).

## Rotas

| Rota | Autenticação | Sucesso | Erros |
| --- | --- | --- | --- |
| `GET /rooms` | Bearer (qualquer empresa) | 200 | 401, 429 |
| `GET /rooms/:id/availability?date=AAAA-MM-DD` | Bearer (qualquer empresa) | 200 | 400, 401, 404, 429 |
| `GET /companies/:companyId/bookings` | Bearer | 200 | 401, 403, 429 |
| `POST /companies/:companyId/bookings` | Bearer | 201 | 400, 401, 403, 409, 422, 429 |
| `DELETE /companies/:companyId/bookings/:id` | Bearer | 204 | 401, 403, 404, 429 |

**Todas as rotas exigem token.** As rotas de salas aceitam o token de qualquer empresa; as de reservas exigem o token da empresa do `:companyId`.

A empresa vem **sempre do token**. O `:companyId` da URL só é conferido: se divergir, 403. O `companyId` nunca vai no corpo.

## Exemplo

```bash
curl -i -X POST http://localhost:3333/companies/acme/bookings \
  -H "Authorization: Bearer <token da empresa>" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "savassi",
    "startsAt": "2026-11-21T12:00:00.000Z",
    "endsAt": "2026-11-21T13:00:00.000Z",
    "title": "Planning semanal",
    "responsibleEmail": "ana.souza@acme.com.br"
  }'
```

## Erros

Formato: `{ "code", "message", "field"? }`. O `code` é o contrato ([ADR 0008](../arquitetura/adr/0008-contrato-de-erros.md)).

| HTTP | code | Quando |
| --- | --- | --- |
| 400 | `VALIDATION` | Corpo malformado, campo ausente ou desconhecido, e-mail inválido, data sem fuso |
| 400 | `INVALID_DATE` | `date` ausente, fora do formato ou inexistente (2026-02-30) |
| 401 | `UNAUTHORIZED` | Header ausente ou token desconhecido |
| 403 | `FORBIDDEN` | Token de outra empresa que a do `:companyId` |
| 404 | `NOT_FOUND` | Sala inexistente, ou reserva inexistente ou de outra empresa |
| 409 | `BOOKING_CONFLICT` | Sobreposição na mesma sala. Traz `conflict` e `suggestions` |
| 422 | `END_BEFORE_START` | Fim igual ou antes do início |
| 422 | `DURATION_TOO_SHORT` | Menos de 30 minutos |
| 422 | `DURATION_TOO_LONG` | Mais de 4 horas |
| 422 | `OUTSIDE_OPENING_HOURS` | Início antes das 07:00 ou fim depois das 22:00 |
| 422 | `IN_THE_PAST` | Início antes de "agora" |
| 422 | `ROOM_NOT_FOUND` | `roomId` do corpo não existe |
| 429 | `RATE_LIMITED` | Limite excedido. Traz `Retry-After` |
| 500 | `INTERNAL` | Erro inesperado, sem stack trace |

## Ordem das verificações

1. Limite de requisições (429)
2. Autenticação (401)
3. Empresa do token contra o `:companyId` (403)
4. Formato (400)
5. Regras de negócio, nesta ordem: fim depois do início, duração mínima, duração máxima, expediente, passado, sala existe (422)
6. Conflito de horário, dentro da fila de escrita (409)

Autenticar antes de validar evita que quem não tem token descubra o formato aceito.
