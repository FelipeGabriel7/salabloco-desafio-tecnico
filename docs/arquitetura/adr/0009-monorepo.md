# ADR 0009. Um repositório, uma pasta por domínio

## Decisão

Uso **um único repositório** com uma pasta por domínio: front, back, testes e docs. O desafio pede entrega por um link só e "rodar seguindo o README" em poucos comandos, e vários repositórios dificultariam a execução e a revisão.

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

O `package.json` da raiz declara `"workspaces": ["apps/*", "tests"]`, e um `npm ci` na raiz instala tudo.

| Script na raiz | O que faz |
| --- | --- |
| `npm run dev` | Sobe api e web juntos |
| `npm run dev:mock` | Sobe só o web com a API simulada |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:api` | Testes de API (Playwright) |
| `npm run test:e2e` | Testes de interface (Playwright) |
| `npm run typecheck` e `npm run build` | Em todos os pacotes |

## Consequências

- **Ganho:** um clone, um `npm ci` e um `npm run dev` resolvem o "rodar seguindo o README". Cada domínio fica isolado numa pasta, e `tests/` fica fora do código que testa.
- **Custo:** o hoisting de dependências pode confundir no começo, e `api` e `web` não compartilham tipos nem esquemas ([ADR 0004](0004-validacao.md)).
