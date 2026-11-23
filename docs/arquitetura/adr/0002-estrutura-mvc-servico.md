# ADR 0002. MVC com service e repository, em monólito modular

> **Estado atual:** reservas seguem route → controller → service → repository; as rotas de salas chamam service/repository diretamente. Não há módulos `auth` ou controllers/services/repositories separados para `rooms` como na árvore proposta abaixo.

## Decisão

Organizo o back-end como **monólito modular**: uma aplicação só, dividida por domínio (`bookings`, `rooms`, `auth`), com camadas **MVC + service + repository** dentro de cada módulo.

| Camada | Faz | Não faz |
| --- | --- | --- |
| Controller | Recebe a requisição, chama o service, devolve a resposta | Regra de negócio |
| Service | Concentra a regra de negócio | Conhecer `req`, `res` ou Express |
| Repository | Acessa os dados | Decidir regra |
| Validation | Esquemas zod do módulo | Regra de negócio |
| Routes | Liga método e URL aos middlewares e ao controller | Lógica |

Meu princípio: **regra de negócio não vaza para o controller**. Um `if` de regra num controller está no lugar errado.

```
apps/api/src/
├─ modules/
│  ├─ bookings/   routes, controllers, services, repositories, validation
│  ├─ rooms/      routes, controllers, services, repositories
│  └─ auth/       services
├─ shared/        middlewares, errors, utils, config
├─ infrastructure/
│  ├─ persistence/json/   repositories e arquivo de dados
│  └─ db/                 seed.ts
├─ app.ts
└─ server.ts
```

O módulo `rooms` atende a listagem de salas e a disponibilidade. A árvore completa está em [arquitetura.md](../arquitetura.md).

## Consequências

- **Ganho:** a regra é testável sem HTTP. Regra nova é service; dado novo é repository.
- **Custo:** algumas pastas a mais por módulo e fronteiras para manter. Evito o "service anêmico" deixando duração, expediente, passado, conflito e isolamento dentro do service.
- **Evolução:** se a complexidade crescer, o próximo passo é separar em casos de uso, uma classe por ação. Para cinco rotas isso só traria arquivos e indireção, então não faço agora.
