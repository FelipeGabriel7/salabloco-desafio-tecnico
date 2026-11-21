# ADR 0009. Um repositório, uma pasta por domínio

## Contexto

A entrega é **um link de repositório**. Back-end, front-end, testes e documentação precisam estar nele.

## Decisão

Uso **um único repositório**, com uma pasta por domínio: front, back, testes e docs. Um repositório só atende o requisito de entrega por link único e mantém o "rodar seguindo o README" em poucos comandos; vários repositórios dificultariam a execução e a revisão.

```
salabloco/
├─ apps/
│  ├─ web/        front-end (React)
│  └─ api/        servidor Node.js (Express)
├─ tests/         Playwright (API e interface), Bruno (contrato), Artillery (performance)
├─ docs/
├─ package.json   workspaces
└─ package-lock.json
```

## Workspaces

O `package.json` da raiz declara `"workspaces": ["apps/*", "tests"]`. O pacote `tests` entra nos workspaces quando ganhar seu `package.json` (tarefa Q-01). Um `npm ci` na raiz instala tudo.

| Script na raiz | O que faz |
| --- | --- |
| `npm run dev` | Sobe api e web juntos |
| `npm run dev:mock` | Sobe só o web com a API simulada |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:api` | Testes de API (Playwright) |
| `npm run test:e2e` | Testes de interface (Playwright) |
| `npm run typecheck` e `npm run build` | Em todos os pacotes |

## Consequências

| Ganho | Custo |
| --- | --- |
| Um clone, um `npm ci`, um `npm run dev`: o critério "roda seguindo o README" fica em três comandos | O hoisting de dependências pode confundir no começo |
| Cada domínio isolado em pasta: fácil de navegar | Sem código compartilhado entre `api` e `web` (tipos e esquemas). Ver [ADR 0004](0004-validacao.md) |
| `tests/` separado: os testes de caixa-preta ficam fora do código que testam | |
