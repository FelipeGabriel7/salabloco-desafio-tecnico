# Backlog

Prazo: **24/11/2026**. Tempos em horas.

## Prioridades

| Prioridade | O que                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| **P0**     | API, regras, front, README, testes de regra                                    |
| **P1**     | Supertest (API), Playwright (interface), segurança, Allure, axe |
| **P2**     | Bruno, npm audit                                                 |
| **P3**     | Artillery, Stryker, i18n, Firestore                                            |

## Tarefas

### Fundação

| ID   | Tarefa                                                                                 | Tempo |
| ---- | -------------------------------------------------------------------------------------- | ----- |
| F-01 | Estrutura `apps/web`, `apps/api`, `tests`, workspaces, `.env.example`, `npm run setup` | 0,8   |
| F-02 | Revisar a estrutura do front ([ADR 0010](../arquitetura/adr/0010-frontend.md))         | 1,0   |
| F-03 | Lint, Prettier, `tsconfig` estrito                                                     | 0,5   |

### API (P0)

| ID    | Tarefa                                                                                     | Tempo | Casos               |
| ----- | ------------------------------------------------------------------------------------------ | ----- | ------------------- |
| A-01  | Scaffold: Express 5, `app.ts` e `server.ts`, `GET /api/health`                             | 0,5   |                     |
| A-02  | `ErrorCode`, `HttpStatus`, catálogo de erros, `AppError`, error handler                    | 1,0   | CA-24               |
| A-03  | `loadConfig(env)` com zod ([ADR 0013](../arquitetura/adr/0013-configuracao-e-segredos.md)) | 0,8   | SEG-17              |
| A-04  | `time` com `Intl`, ISO estrito, rejeitar ambíguo                                           | 1,2   | TZ-01 a TZ-05       |
| A-05  | Repositories JSON, fila de escrita, escrita atômica                                        | 1,2   | CA-22               |
| A-05b | Seed de empresas e salas no JSON (`seed.ts`, idempotente, `npm run seed`)                  | 0,5   |                     |
| A-06  | `BookingsService`: duração, expediente, passado, conflito, isolamento                      | 1,5   | CA-01 a CA-13       |
| A-07  | Sugestões de horário no 409                                                                | 0,8   | CA-25, CA-26        |
| A-08  | `RoomsService`: lista e disponibilidade                                                    | 0,7   | CA-13b, CA-16       |
| A-09  | Middlewares: autenticação, validação e limite de corpo                                      | 1,2   | CA-14, CA-17, CA-18 |
| A-10  | Limite de requisições com bloqueio escalonado                                              | 1,0   | SEG-05              |
| A-11  | Rotas e controllers                                                                        | 1,0   |                     |
| A-12  | Testes unitários (Vitest)                                                                  | 1,5   |                     |

### Front

| ID   | Tarefa                                                                              | Tempo |
| ---- | ----------------------------------------------------------------------------------- | ----- |
| W-01 | `time` com `Intl`, regra de expediente, remover `suggest.ts`, `ErrorCode` como enum | 1,0   |
| W-02 | Ligar o front à API real com Axios                                                   | 1,0   |
| W-03 | Simplificar o que ficou complexo (agenda, mapa vertical, mock)                      | 0,7   |

### Qualidade

| ID   | Tarefa                                                          | Tempo | P   |
| ---- | --------------------------------------------------------------- | ----- | --- |
| Q-01 | Playwright: config, `webServer`, `DB_PATH` temporário, fixtures | 1,0   | P1  |
| Q-02 | Supertest: API, reservas, acesso, validação e erros             | 2,0   | P1  |
| Q-03 | Testes de segurança (SEG-01 a SEG-15)                           | 1,5   | P1  |
| Q-04 | Concorrência e integridade do arquivo                           | 0,7   | P1  |
| Q-05 | E2E: auth, reservas, conflito, validação, isolamento            | 2,0   | P1  |
| Q-06 | Mapa no celular e axe-core                                      | 1,0   | P1  |
| Q-07 | Allure, trace e screenshot das falhas                           | 0,8   | P1  |
| Q-08 | Contrato com Bruno CLI                                          | 0,6   | P2  |

### Entrega

| ID   | Tarefa                                                          | Tempo |
| ---- | --------------------------------------------------------------- | ----- |
| D-01 | README: rodar, testar, decisões, o que ficou de fora, uso de IA | 1,0   |
| D-02 | Teste "do zero": clonar em pasta nova e seguir o README         | 0,5   |
| D-03 | Revisão do histórico de commits                                 | 0,3   |

### P3

| ID   | Tarefa                                      | Tempo |
| ---- | ------------------------------------------- | ----- |
| X-01 | Artillery: PERF-01 a PERF-04 e fumaça no PR | 1,5   |
| X-02 | Stryker nos services                        | 1,2   |
| X-03 | i18n PT e EN                                | 1,0   |
| X-04 | Firestore com Emulator                      | 2,5   |

## Commits

Conventional commits, um por passo lógico:

```
chore: organiza o monorepo em apps e tests
feat(api): cria AppError, ErrorCode e error handler
test(api): cobre os limites de duração da reserva
fix(api): inclui a checagem de conflito dentro da fila
docs: registra que nenhuma rota é pública
```

## Definição de pronto

- Casos de aceite da tarefa passam.
- Lint, tipos e testes passam.
- Comportamento novo está no README ou no ADR.
- Nenhum segredo nem dado real no repositório.
