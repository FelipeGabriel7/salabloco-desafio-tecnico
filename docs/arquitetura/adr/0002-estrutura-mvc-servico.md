# ADR 0002. MVC com service e repository, em monólito modular

## Contexto

O critério "organização e TypeScript" avalia se o código é legível e bem dividido. A regra de negócio de reservas (duração, expediente, passado, conflito, isolamento entre empresas) é o centro do produto, e eu quero que ela fique em um lugar só, testável sem HTTP.

## Decisão

Escolhi **MVC + service + repository**, como **monólito modular**: uma aplicação dividida em módulos por domínio (`bookings`, `rooms`, `auth`), cada um com as próprias camadas.

| Peça | Responsabilidade | Não faz |
| --- | --- | --- |
| Controller | Camada fina: recebe a requisição, chama o service e devolve a resposta | Regra de negócio |
| Service | Concentra a regra de negócio | Conhecer `req`, `res` ou Express |
| Repository | Concentra o acesso aos dados | Decidir regra |
| Validation | Esquemas zod do módulo | Regra de negócio |
| Routes | Liga método e URL aos middlewares e ao controller | Lógica |

Meu princípio: regra de negócio não vaza para o controller. Um `if` de regra num controller está no lugar errado.

```
apps/api/src/
├─ modules/
│  ├─ bookings/  routes, controllers, services, repositories, validation
│  ├─ rooms/     routes, controllers, services, repositories
│  └─ auth/      services
├─ shared/       middlewares, errors, utils, config
├─ infrastructure/
│  ├─ persistence/json/   implementação dos repositories e o arquivo de dados
│  └─ db/                 seed.ts (empresas e salas)
├─ app.ts
└─ server.ts
```

`rooms` atende a listagem de salas e a disponibilidade. `shared/` reúne o que atravessa os módulos: middlewares (autenticação, validação, limite de requisições, error handler), `AppError`, utilitários de tempo e configuração. A árvore completa está em [arquitetura.md](../arquitetura.md).

## Consequências

| Ganho | Custo |
| --- | --- |
| Regra testável sem HTTP | Fronteiras a manter. Evito o "service anêmico" mantendo duração, expediente, passado, conflito e isolamento dentro do service |
| Mudança localizada: regra nova é service, dado novo é repository | Algumas pastas a mais por módulo |
| Tudo de um domínio numa pasta só | |

## Evolução

Se o processamento e a complexidade crescerem, o próximo passo é adotar **casos de uso (use cases) e interfaces**: cada ação vira uma classe própria e o service deixa de concentrar vários métodos. Para cinco rotas o custo (mais arquivos e indireção) supera o ganho, por isso não faço agora.
