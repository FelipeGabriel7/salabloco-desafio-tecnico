# ADR 0008. Contrato de erros e códigos HTTP

## Contexto

Dois leitores precisam entender um erro: uma pessoa (mensagem) e o front (mapear ao campo certo e traduzir).

## Decisão

Uso um corpo único com um enum de códigos ([ADR 0004](0004-validacao.md), [ADR 0014](0014-enums-e-interfaces.md)):

```json
{ "code": "BOOKING_CONFLICT", "message": "...", "field": "...", "suggestions": [] }
```

A `message` é para humanos e pode mudar. **O `code` é o contrato.**

| HTTP | Quando | `code` |
| --- | --- | --- |
| 400 | Entrada que não pôde ser entendida: corpo inválido, campo ausente, data inexistente | `VALIDATION`, `INVALID_DATE` |
| 401 | Sem token ou token inválido | `UNAUTHORIZED` |
| 403 | Token de outra empresa que a do `:companyId` | `FORBIDDEN` |
| 404 | Sala inexistente, ou reserva inexistente ou de outra empresa | `NOT_FOUND` |
| 409 | Sobreposição de horário, com sugestões | `BOOKING_CONFLICT` |
| 422 | Entrada entendida, mas recusada por regra de negócio: passado, duração, expediente, fim antes do início | `IN_THE_PAST`, `DURATION_TOO_SHORT`, `DURATION_TOO_LONG`, `OUTSIDE_OPENING_HOURS`, `END_BEFORE_START` |
| 429 | Limite de requisições ([ADR 0012](0012-limite-de-requisicoes.md)) | `RATE_LIMITED` |
| 500 | Erro inesperado, sem stack trace | `INTERNAL` |

## 409 com sugestões

Quero que o erro ajude a resolver: o servidor devolve alternativas livres.

```json
{
  "code": "BOOKING_CONFLICT",
  "message": "A sala já está reservada neste horário.",
  "conflict": { "startsAt": "...", "endsAt": "..." },
  "suggestions": [{ "roomId": "pampulha", "startsAt": "...", "endsAt": "..." }]
}
```

- O `BookingsService` calcula até dois horários livres próximos na mesma sala, com a mesma duração, mais outras salas livres no horário pedido. Nunca no passado, nunca fora do expediente.
- Calculo no servidor porque é a fonte única da verdade, testável com relógio injetado, e simplifica o front.
- As sugestões só contêm horários livres, que já são públicos para quem tem token: não vazam dados de terceiros.

## 500

Corpo `{ "code": "INTERNAL", "message": "Erro inesperado." }`. O detalhe vai para o log do servidor, sem o token.

## Consequências

| Ganho | Custo |
| --- | --- |
| `code` estável, testável e traduzível | Catálogo de mensagens para manter |
| 409 que resolve o problema | Cálculo extra no servidor, com testes |
| 400 (malformado) separado de 422 (regra de negócio) | Dois códigos para distinguir |
