# ADR 0001. Express 5 com TypeScript

## Decisão

Uso **Express 5 com TypeScript** no back-end.

Escolhi o Express pela simplicidade e familiaridade. Na versão 5, um erro lançado dentro de um handler `async` chega ao error handler. A autenticação usa middleware e a validação do body de reservas fica no controller; o limite de requisições também é um middleware ([ADR 0012](0012-limite-de-requisicoes.md)).

## Consequências

- **Ganho:** o fluxo é simples de ler, e eu consigo manter e explicar tudo o que escrevi.
- **Custo:** autenticação e validação precisam ser implementadas e mantidas na aplicação.
- **Risco:** esquecer uma proteção. Mitigo com o [modelo de ameaças](../../qualidade/seguranca.md) como checklist e com testes de segurança (SEG-xx) que falham se uma proteção sumir.

## Alternativas descartadas

- **Fastify:** valida com JSON Schema embutido e seria a escolha se o projeto crescesse. Tenho menos familiaridade.
- **NestJS:** traz estrutura e injeção de dependência prontas, o que é demais para cinco rotas e esconde o que quero mostrar.
- **Hono:** pouca adoção no mercado local.
