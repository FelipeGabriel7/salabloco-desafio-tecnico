# Salabloco

Aplicação de **reserva de salas de reunião de um coworking**. Várias empresas dividem o espaço: cada uma reserva salas, vê as próprias reservas e cancela quando precisa. **Uma empresa nunca vê nem altera as reservas de outra.**

Este é o meu desafio técnico para desenvolvedor júnior: API em Node.js + TypeScript, front-end em React + TypeScript, testes automatizados e documentação das minhas decisões.

> **Estado atual:** a API Express e o front React estão ligados e cobertos por testes de unidade, API, contrato, interface, acessibilidade e performance, todos rodando no CI.

- Aplicação publicada em produção: https://salabloco-web.vercel.app/
- API Publicada em produção: https://salabloco-api.vercel.app/api/health

## Como rodar

Requisito: **Node 22 ou mais novo**.

```bash
npm ci
npm run setup       # cria os .env a partir dos .env.example (não sobrescreve)
npm run dev         # API em :3333 e front em :5181
npm run validate    # roda todas as validações e gera o relatório Allure
```

No login, escolha a empresa e informe o token configurado em `apps/api/.env`. O front usa Axios e encaminha `/api` pelo proxy do Vite. O `.env` nunca vai para o git e nenhum token fica no código ([ADR 0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md)).

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

`GET /api/health`, `GET /api/companies` e `GET /api/rooms` são públicos. `/api/config` e as demais rotas de negócio exigem `Authorization: Bearer <token>`.

| Rota | Faz |
| --- | --- |
| `GET /api/health` | Verifica se a API está ativa (público) |
| `GET /api/companies` | Lista empresas para o seletor de login (público) |
| `GET /api/config` | Informa o fuso configurado (com token) |
| `GET /api/rooms` | Lista as salas |
| `GET /api/rooms/:id/availability?date=AAAA-MM-DD` | Horários ocupados da sala no dia |
| `GET /api/companies/:companyId/bookings` | Reservas da empresa |
| `POST /api/companies/:companyId/bookings` | Cria uma reserva |
| `PUT /api/companies/:companyId/bookings/:id` | Edita uma reserva própria |
| `DELETE /api/companies/:companyId/bookings/:id` | Cancela uma reserva |

A empresa vem sempre do token. Os erros seguem o formato `{ code, message, field? }`, e o `code` é o contrato. Detalhes em [API](docs/api/api.md) e no [OpenAPI](docs/api/openapi.yaml).

## Estrutura do repositório

```
apps/web/     front-end (React, Vite, TypeScript, Tailwind)
apps/api/     servidor (Express 5, TypeScript)
tests/        Playwright (e2e, pages, fixtures), Bruno (contract) e Artillery (performance)
scripts/      setup dos .env e validação local completa
docs/         produto, arquitetura (ADRs), API, qualidade, design
.github/      pipeline de CI/CD
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
| Redis na Vercel, arquivo no local | O disco da função serverless é temporário; o repository não muda | [0016](docs/arquitetura/adr/0016-redis-na-hospedagem.md) |
| Nenhum segredo no código | `.env` fora do git e `.env.example` versionado | [0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md) |

A lista completa dos 16 ADRs está em [docs/](docs/README.md).

## Testes

Sigo a pirâmide de testes: muitos testes rápidos na base e poucos no navegador ([ADR 0011](docs/arquitetura/adr/0011-estrategia-de-testes.md)).

| Camada | Ferramenta | Onde | Comando |
| --- | --- | --- | --- |
| Unidade do front | Vitest | `apps/web/tests` | `npm test` |
| Unidade, integração e contrato da API | Vitest + Supertest, contratos com zod | `apps/api/tests/{unit,integration,contract}` | `npm run test:api` |
| Contrato de ponta a ponta | Bruno (catálogo, reservas, erros) | `tests/contract/bruno` | `npm run test:contract` |
| Interface | Playwright (BDD, Page Objects, axe) | `tests/e2e`, `tests/pages` | `npm run test:e2e` |
| Performance | Artillery | `tests/performance` | `npm run test:performance` |

- `npm run validate` sobe uma API própria com banco temporário, roda todas as camadas, mostra uma tabela de passou/falhou e gera o relatório.
- `npm run report:open` abre o **Allure** com os testes da API e da interface. Cada teste de interface tem screenshot; vídeo e trace só quando falha. O Bruno gera o próprio relatório em `tests/reports/bruno.html` e o Artillery em `tests/reports/artillery.json`.
- Contrato e performance precisam da API rodando (`npm run dev:api`); o `validate` já cuida disso.

## CI/CD

O pipeline fica em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) e roda em todo push e pull request para a `main`.

| Etapa | O que garante |
| --- | --- |
| Tipos, unitários e API | `typecheck`, Vitest do front e da API, build |
| Segurança (DevSecOps) | gitleaks (segredos), `npm audit` (dependências), nenhum token no bundle |
| Análise estática | CodeQL |
| Contrato | Coleção Bruno contra a API rodando |
| Interface | Playwright no Chromium |
| Performance | Artillery com limites de p95 e p99 |
| Relatório | Allure consolidado, publicado no GitHub Pages em https://felipegabriel7.github.io/salabloco-desafio-tecnico/, e resumo de cada etapa na página da execução |
| Deploy | Só na `main`, só com tudo verde: publica API e front na Vercel |

## Deploy na Vercel

**No ar:** front em https://salabloco-web.vercel.app, API em https://salabloco-api.vercel.app/api/health e relatório de testes em https://felipegabriel7.github.io/salabloco-desafio-tecnico/.

São dois projetos na Vercel, um para a API e outro para o front, publicados pelo pipeline depois que todas as etapas passam.

1. Crie o projeto **salabloco-api** com *Root Directory* `apps/api`. Em *Environment Variables*, defina `COMPANY_ACME_TOKEN`, `COMPANY_LUMEN_TOKEN`, `COMPANY_BRISA_TOKEN` (valores novos e longos), `COWORKING_TIMEZONE=America/Sao_Paulo`. Em *Storage*, crie um **Upstash Redis** e ligue ao projeto: a integração cria `KV_REST_API_URL` e `KV_REST_API_TOKEN`, e a API passa a usar o Redis sozinha.
2. Crie o projeto **salabloco-web** com *Root Directory* `apps/web`. Se a URL da API não for `https://salabloco-api.vercel.app`, ajuste o `rewrites` em [`apps/web/vercel.json`](apps/web/vercel.json). O front chama `/api` no próprio domínio e a Vercel encaminha para a API, sem CORS.
3. Em *Settings → Tokens* da Vercel, gere um token. No GitHub, em *Settings → Secrets and variables → Actions*, crie `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_API` e `VERCEL_PROJECT_ID_WEB` (os IDs ficam em *Settings → General* de cada projeto).
4. Faça push na `main`. O deploy automático pelo Git da Vercel fica desligado (`git.deploymentEnabled: false`): quem publica é o pipeline, e só depois dos testes.

**Persistência na hospedagem:** na Vercel a API roda como função serverless, e o disco (`/tmp`) é temporário e separado por instância. Por isso, lá os dados ficam no Redis, e a trava de escrita também, o que mantém a regra de não sobrepor reservas entre instâncias. Local, testes e CI seguem com o arquivo JSON ([ADR 0016](docs/arquitetura/adr/0016-redis-na-hospedagem.md)).

## O que ainda falta

- No login, token de outra empresa (403) mostra "Confira se a API está ativa" em vez de "token inválido".
- Limite de requisições (429) e comparação de token com `timingSafeEqual`.
- Revisar a agenda de seleção de horário.

Os itens com teste já escrito aparecem no relatório como pendentes ou como falha esperada.

## O que ficou de fora

Cadastro de empresas e salas por tela, reservas recorrentes e login com senha. Limites que já conheço: os tokens são fixos, sem rotação nem revogação; a persistência em arquivo vale para um único processo; não há trilha de auditoria. O HTTPS é obrigatório em qualquer ambiente publicado e fica a cargo de quem publica.

## Uso de IA

Usei IA (Claude) no levantamento de requisitos, no desenho da interface e só no boilerplate inicial do front-end mockado. O restante do front, a API, os testes e as decisões dos ADRs são meus. Detalhes em [uso de IA](docs/ai/uso-de-ia.md).
