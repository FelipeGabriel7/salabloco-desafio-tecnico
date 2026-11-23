# Arquitetura

Monólito modular: uma API (Express 5) e um front (React), no mesmo repositório com npm workspaces ([ADR 0009](adr/0009-monorepo.md)).

```
salabloco/
├─ apps/
│  ├─ web/     React + Vite + TypeScript + Tailwind
│  └─ api/     Node + TypeScript + Express 5
├─ tests/      Supertest (API), Playwright (E2E), Bruno (contrato), Artillery (performance)
└─ docs/
```

## Visão geral

```mermaid
flowchart LR
  subgraph WEB["apps/web"]
    UI["pages e components"] --> HK["useAsync"] --> SV["services/ (fetch + Bearer)"]
    AU["contexts/ (sessão)"] --> SV
  end
  SV -->|"HTTPS + Bearer"| MW
  subgraph API["apps/api"]
    MW["middlewares: limite, auth, validation"] --> RT["routes"] --> CT["controllers"] --> SE["services (regras)"] --> RP["repositories"]
    SE -.->|"AppError"| EH["error handler"]
  end
  RP --> Q["fila de escrita"] --> J[("db.json")]
```

## Back-end

Módulos por domínio, cada um com as próprias camadas ([ADR 0002](adr/0002-estrutura-mvc-servico.md)).

```
apps/api/src/
├─ modules/
│  ├─ bookings/  routes, controllers, services, repositories, validation
│  ├─ rooms/     routes, controllers, services, repositories
│  └─ auth/      services
├─ shared/       middlewares, errors, utils, config
├─ infrastructure/
│  ├─ persistence/json/   repositories em arquivo, fila, escrita atômica
│  └─ db/                 seed.ts (empresas e salas)
├─ app.ts        monta o Express (sem listen)
└─ server.ts     sobe a porta
```

| Camada | Faz | Não faz |
| --- | --- | --- |
| Routes | Liga método e URL aos middlewares e ao controller | Lógica |
| Middlewares | Autenticação, autorização e tratamento de erros | Regra de negócio |
| Controller | Chama **um** método do service e devolve a resposta | Regra e acesso a dados |
| Service | **Regra de negócio.** Lança `AppError` | Conhecer `req`, `res` ou Express |
| Repository | Acesso a dados e checagem de conflito na operação de escrita | Conhecer HTTP |

O controller de reservas chama o service, que importa funções concretas do repository. O repository usa `Storage` para arquivo ou Redis. As rotas de salas chamam funções diretamente; `app.ts` não chama `listen`, permitindo importar o app nos testes.

## Front-end

```
apps/web/src/
├─ components/   componentes reutilizáveis (inclui a rota protegida)
├─ contexts/     sessão e tema (Context API)
├─ hooks/        useAsync
├─ pages/        telas
├─ services/     funções Axios, tipos da API e conversão de horário
├─ routes.ts     paths React e prefill de navegação
├─ App.tsx       provedores e rotas
└─ main.tsx
```

Testes unitários do front ficam em `apps/web/tests/`, separados de `src/`.

## Fluxo de uma requisição

```mermaid
sequenceDiagram
  participant C as Cliente
  participant M as Middlewares
  participant S as BookingsService
  participant P as Repository
  C->>M: POST /api/companies/acme/bookings
  M->>M: autenticação (401), :companyId (403)
  M->>S: controller valida body (400) e chama create
  S->>S: regras (422)
  S->>P: fila: checa conflito (409) e grava
  S-->>C: 201
```

Erros viram `{ code, message, field? }` no error handler. Erro inesperado vira 500 genérico, sem stack trace ([ADR 0008](adr/0008-contrato-de-erros.md)).

## Dados

- Arquivo local ou Redis guardam **empresas, salas e reservas**; o seed adiciona empresas e salas ausentes na subida. O `DB_PATH` ativo deve ficar fora do git, mas existe um arquivo `db.json` histórico já rastreado ([ADR 0003](adr/0003-persistencia.md)).
- Os **tokens** das empresas vêm do ambiente e nunca são gravados no arquivo.
- Empresa: `id`, `name`. Sala: `id`, `name`, `capacity`.
- Reserva: `id`, `companyId`, `roomId`, `startsAt`, `endsAt`, `title`, `responsibleEmail`, `createdAt`. Datas em ISO 8601 com fuso explícito.

## Onde cada preocupação é garantida

| Preocupação | Mecanismo | ADR |
| --- | --- | --- |
| Regra de negócio | Services; relógio do sistema via `Date.now()` | [0002](adr/0002-estrutura-mvc-servico.md) |
| Isolamento entre empresas | Empresa vem do token; filtro por empresa; 404 no recurso alheio | [0005](adr/0005-autenticacao.md) |
| Concorrência | Fila local ou trava Redis; TTL da trava tem limitação | [0007](adr/0007-concorrencia.md) |
| Escrita em arquivo | Temporário e rename reduzem risco de arquivo parcial | [0003](adr/0003-persistencia.md) |
| Força bruta | Rate limit ainda não implementado | [0012](adr/0012-limite-de-requisicoes.md) |
| Tempo | `Intl` e ISO com fuso; transições de horário de verão precisam de validação | [0006](adr/0006-tempo-e-fuso.md) |
| Segredos | `.env` fora do git, validado no boot | [0013](adr/0013-configuracao-e-segredos.md) |

## Evolução

| Se... | Eu faria |
| --- | --- |
| A complexidade crescer | Casos de uso no lugar de services grandes |
| Persistência transacional virar requisito | Avaliar banco transacional e ajustar persistência/integração conforme necessário |
| Houver mais de uma instância | Limite e fila em armazenamento compartilhado |
| Muitas rotas e contratos | Fastify ou Nest |
