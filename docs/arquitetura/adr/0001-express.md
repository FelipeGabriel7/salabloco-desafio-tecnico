# ADR 0001. Express 5 como framework do back-end

## Contexto

O desafio aceita Express, Fastify ou outro framework Node. O produto é multi-tenant: cada empresa só pode ver e alterar as próprias reservas. Isso faz de autenticação, validação e isolamento por empresa os pontos de maior risco, e eu quero um framework que deixe essas proteções visíveis e testáveis.

## Decisão

Escolhi **Express 5 com TypeScript**.

- É o framework que eu domino e consigo explicar.
- Na versão 5, um erro lançado em um handler `async` vai direto para o error handler, sem `try/catch` em cada controller (como era na versão 4).
- Monto segurança e validação de forma explícita, como uma sequência de middlewares que se lê de cima para baixo.

## Consequências

| Ganho | Custo |
| --- | --- |
| Fluxo da requisição visível e simples de ler | Autenticação, validação e limite de requisições são feitos à mão |
| Eu consigo manter e explicar o código | Contrato (esquema) e tipos ficam por minha conta |

Em um produto multi-tenant, o custo também é um benefício: cada proteção (autenticação, isolamento por empresa, validação, limite de requisições) é um passo explícito que eu configuro e testo. Nada depende de comportamento implícito do framework.

**Risco:** esquecer uma proteção. Para mitigar, uso o [modelo de ameaças](../../qualidade/seguranca.md) como checklist e os testes de segurança (SEG-xx), que falham se uma proteção deixar de existir.

## Alternativas

| Opção | Por que não escolhi |
| --- | --- |
| Fastify | JSON Schema embutido, boa opção se o projeto crescer. Tenho menos familiaridade |
| NestJS | Estrutura e injeção de dependência prontas, mas excessivas para cinco rotas e escondem o que quero demonstrar |
| Hono | Pouca adoção no mercado local |

## Quando revisar

Se o projeto crescer para muitas rotas e contratos complexos: Fastify (validação por JSON Schema) ou NestJS (estrutura e injeção de dependência).
