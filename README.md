# Salabloco

Aplicação de **reserva de salas de reunião de um coworking**. Várias empresas dividem o espaço: cada uma reserva salas, vê as próprias reservas e cancela quando precisa. **Uma empresa nunca vê nem altera as reservas de outra.**

Este é o meu desafio técnico para desenvolvedor júnior: API em Node.js + TypeScript, front-end em React + TypeScript, testes automatizados e documentação das minhas decisões.

> **Estado atual:** o front-end roda de ponta a ponta com uma API simulada no navegador. A API real (`apps/api`) e os testes automatizados (`tests/`) ainda estão em construção. Esta seção será atualizada conforme cada parte ficar pronta.

## Como rodar

Requisito: **Node 22 ou mais novo**.

```bash
npm install
npm run setup       # cria os .env a partir dos .env.example (não sobrescreve)
npm run dev:mock    # front-end com a API simulada, em http://127.0.0.1:5181
npm test            # testes unitários
```

No login, escolha a empresa e informe o token. Os tokens de demonstração aparecem na própria tela (só no modo simulado). O `.env` nunca vai para o git e nenhum segredo fica no código ([ADR 0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md)).

## O que o sistema faz

- **Reservar** uma sala por um intervalo, com título e e-mail do responsável.
- **Ver as reservas da própria empresa** e cancelá-las.
- **Ver a disponibilidade** de uma sala em um dia, ou o mapa do dia com todas as salas.
- **Receber sugestões** de outros horários ou salas livres quando há conflito.

### Regras de negócio

| Regra | Detalhe |
| --- | --- |
| Sem sobreposição | Uma sala não tem duas reservas no mesmo horário, de nenhuma empresa. Reservas coladas (10:00–11:00 e 11:00–12:00) são válidas |
| Duração | De 30 minutos a 4 horas |
| Expediente | O coworking funciona das 07:00 às 22:00 |
| Passado | Não é possível reservar no passado |
| Isolamento | Cada empresa só vê e altera as próprias reservas |
| Privacidade | A disponibilidade mostra só início e fim, sem dados de quem reservou |
| Fuso | Todo horário segue o fuso do coworking (`America/Sao_Paulo`) |

A lista completa, com os casos de borda, está em [requisitos](docs/produto/requisitos.md).

### Dados de demonstração

O back-end insere no arquivo JSON as empresas **Acme**, **Lumen** e **Brisa** e cinco salas fictícias de Belo Horizonte: Savassi (6 lugares), Pampulha (12), Serra do Curral (4), Auditório Liberdade (20) e UFMG (8).

## API

Todas as rotas exigem `Authorization: Bearer <token>`. Nenhuma é pública.

| Rota | Faz |
| --- | --- |
| `GET /rooms` | Lista as salas |
| `GET /rooms/:id/availability?date=AAAA-MM-DD` | Horários ocupados da sala no dia |
| `GET /companies/:companyId/bookings` | Reservas da empresa |
| `POST /companies/:companyId/bookings` | Cria uma reserva |
| `DELETE /companies/:companyId/bookings/:id` | Cancela uma reserva |

A empresa vem sempre do token. Os erros seguem o formato `{ code, message, field? }`, e o `code` é o contrato. Detalhes em [API](docs/api/api.md) e no [OpenAPI](docs/api/openapi.yaml).

## Estrutura do repositório

```
apps/web/     front-end (React, Vite, TypeScript, Tailwind)
apps/api/     servidor (Express 5, TypeScript)           [em construção]
tests/        Playwright, Bruno e Artillery              [esqueleto]
docs/         produto, arquitetura (ADRs), API, qualidade, design
```

Um repositório só, com npm workspaces ([ADR 0009](docs/arquitetura/adr/0009-monorepo.md)).

## Minhas decisões

Cada decisão tem um ADR com o motivo, as consequências e as alternativas que descartei. Os principais:

| Decisão | Por quê | ADR |
| --- | --- | --- |
| Express 5 | Domino o framework e o erro de handler `async` já é tratado | [0001](docs/arquitetura/adr/0001-express.md) |
| MVC com service e repository | A regra de negócio fica no service, nunca no controller | [0002](docs/arquitetura/adr/0002-estrutura-mvc-servico.md) |
| Arquivo JSON atrás de uma interface | Os dados sobrevivem ao reinício e o banco fica trocável | [0003](docs/arquitetura/adr/0003-persistencia.md) |
| A empresa vem do token | O isolamento é decidido no servidor | [0005](docs/arquitetura/adr/0005-autenticacao.md) |
| 404, e não 403, para reserva alheia | Não confirma que o id existe | [0005](docs/arquitetura/adr/0005-autenticacao.md) |
| ISO 8601 com fuso, via `Intl` | Correto em qualquer época, e entrada ambígua é rejeitada | [0006](docs/arquitetura/adr/0006-tempo-e-fuso.md) |
| Escrita em fila, com a checagem de conflito dentro | Duas empresas nunca reservam a mesma sala | [0007](docs/arquitetura/adr/0007-concorrencia.md) |
| Nenhum segredo no código | `.env` fora do git e `.env.example` versionado | [0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md) |

A lista completa dos 14 ADRs está em [docs/](docs/README.md).

## Testes

Estratégia em [qualidade](docs/qualidade/qa.md) e [segurança](docs/qualidade/seguranca.md):

- **Vitest:** regras de negócio e utilitários (já rodam com `npm test`).
- **Playwright:** API e fluxos críticos da interface, mais acessibilidade com axe.
- **Bruno:** contrato da API.
- **Artillery:** carga e limite de requisições.

## O que ainda falta

- API real, com seed, fila de escrita e limite de requisições.
- Ligar o front à API real e remover o cálculo de sugestões do navegador.
- Testes de API e de interface com Playwright.
- Revisar a agenda de seleção de horário.

## O que ficou de fora

Cadastro de empresas e salas por tela, edição ou reagendamento de reservas, reservas recorrentes e login com senha. Limites que já conheço: os tokens são fixos, sem rotação nem revogação; a persistência em arquivo vale para um único processo; não há trilha de auditoria. O HTTPS é obrigatório em qualquer ambiente publicado e fica a cargo de quem publica.

## Uso de IA

Usei IA (Claude) no levantamento de requisitos, no desenho da interface e só no boilerplate inicial do front-end mockado. O restante do front, a API, os testes e as decisões dos ADRs são meus. Detalhes em [uso de IA](docs/ai/uso-de-ia.md).
