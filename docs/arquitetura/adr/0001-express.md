# ADR 0001. Express 5 com TypeScript

## Decisão

Uso **Express 5 com TypeScript** no back-end.

Escolhi o Express porque é o framework que eu domino e consigo explicar linha a linha. Na versão 5, um erro lançado dentro de um handler `async` chega direto ao error handler, então não preciso de `try/catch` em cada controller. Autenticação, validação e limite de requisições ficam como middlewares explícitos, e o fluxo da requisição se lê de cima para baixo.

## Consequências

- **Ganho:** o fluxo é simples de ler, e eu consigo manter e explicar tudo o que escrevi.
- **Custo:** autenticação, validação e limite de requisições são feitos à mão, e o contrato fica por minha conta.
- **Risco:** esquecer uma proteção. Mitigo com o [modelo de ameaças](../../qualidade/seguranca.md) como checklist e com testes de segurança (SEG-xx) que falham se uma proteção sumir.

## Alternativas descartadas

- **Fastify:** valida com JSON Schema embutido e seria a escolha se o projeto crescesse. Tenho menos familiaridade.
- **NestJS:** traz estrutura e injeção de dependência prontas, o que é demais para cinco rotas e esconde o que quero mostrar.
- **Hono:** pouca adoção no mercado local.
