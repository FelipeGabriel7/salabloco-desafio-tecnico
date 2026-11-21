# Requisitos

## Funcionais

| ID | Requisito | Aceite |
| --- | --- | --- |
| RF-01 | Escolher a empresa e informar o token | Token certo entra. Errado mostra erro |
| RF-02 | Listar as salas | Nome e capacidade, só com token |
| RF-03 | Ver os horários ocupados de uma sala em um dia | Só com token. Só `startsAt` e `endsAt` |
| RF-04 | Criar reserva | 201 com a reserva. Erros por campo |
| RF-05 | Listar as reservas da empresa | Só as da empresa do token |
| RF-06 | Cancelar reserva | 204. Reserva alheia ou inexistente: 404 |
| RF-07 | Mapa do dia com todas as salas | Clicar num horário livre abre o formulário preenchido |
| RF-08 | Sugestões quando há conflito | O 409 traz horários e salas alternativos |

## Regras de negócio

| ID | Regra | Bordas |
| --- | --- | --- |
| RN-01 | Uma sala não tem reservas sobrepostas, de nenhuma empresa | Reservas coladas não conflitam. Outra sala não conflita |
| RN-02 | Duração de 30 minutos a 4 horas | 30 min e 4 h passam. 29 min e 4h01 não |
| RN-03 | Não reservar no passado | Começar exatamente agora é aceito |
| RN-04 | Uma empresa só vê e altera as próprias reservas | Token de outra empresa na rota: 403. Reserva alheia no DELETE: 404 |
| RN-05 | A disponibilidade não revela dados de terceiros | Só `startsAt` e `endsAt` |
| RN-06 | Datas e horas no fuso do coworking (`America/Sao_Paulo`) | 21:30 locais é o dia seguinte em UTC, mas o mesmo dia no coworking |
| RN-07 | O coworking funciona das 07:00 às 22:00 | Início às 07:00 e fim às 22:00 passam. Início às 06:30 ou fim às 22:30 não |

## Não funcionais

| ID | Requisito | Como se verifica |
| --- | --- | --- |
| RNF-01 | Roda seguindo o README, do zero | Teste do zero em pasta nova (D-02) |
| RNF-02 | TypeScript estrito | `npm run typecheck` |
| RNF-03 | Erros no formato `{ code, message, field? }` | Testes de API |
| RNF-04 | Acesso isolado entre empresas, dados mínimos expostos | Testes SEG-xx |
| RNF-05 | Testes de regra e de borda | [qa.md](../qualidade/qa.md) |
| RNF-06 | Estados de carregando, erro e vazio em toda lista | E2E |
| RNF-07 | Responsivo e acessível | Playwright móvel e axe |

## O que o desafio pede

**API:** `GET /rooms`, `POST /companies/:companyId/bookings`, `GET /companies/:companyId/bookings`, `DELETE /companies/:companyId/bookings/:id`, `GET /rooms/:id/availability?date=AAAA-MM-DD`. Cada empresa tem um token fixo, enviado em header. O enunciado trata empresas e salas como fixas; no projeto elas são dados de seed que o back-end insere no JSON.

**Front:** escolher a empresa, criar reserva com validação, listar com cancelar, ver disponibilidade de uma sala em um dia, estados de carregando, erro e vazio.

**Entrega:** repositório com commits pequenos e README (como rodar e testar, decisões, o que ficou de fora, uso de IA). Prazo: 24/11/2026.

**Extras incluídos:** Playwright, fuso correto. **Depois do núcleo:** i18n PT/EN. **Não incluído:** Firestore.

## Decisões de interpretação

| Ponto | Decisão | ADR |
| --- | --- | --- |
| `GET /rooms` e disponibilidade exigem token? | Sim, de qualquer empresa. Nenhuma rota é pública | [0005](../arquitetura/adr/0005-autenticacao.md) |
| Empresas e salas | Seed do back-end no JSON usado como banco | [0003](../arquitetura/adr/0003-persistencia.md) |
| Fuso | `America/Sao_Paulo` com `Intl`, sem offset fixo | [0006](../arquitetura/adr/0006-tempo-e-fuso.md) |
| Expediente | 07:00 às 22:00, decisão de negócio | [0006](../arquitetura/adr/0006-tempo-e-fuso.md) |
| Códigos HTTP | 400 malformado, 422 regra de negócio, 409 conflito | [0008](../arquitetura/adr/0008-contrato-de-erros.md) |
