# ADR 0011. Estratégia de testes

O plano de execução está em [qa.md](../../qualidade/qa.md).

## Decisão

Testo cada regra **no nível mais baixo em que dá para prová-la**. "29 minutos é recusado" é teste unitário, o 422 na rota é teste de API, e a mensagem no campo certo é teste de interface.

| Camada | Ferramenta | O que prova |
| --- | --- | --- |
| Unitário | Vitest | Regras e bordas dos services e utilitários, sem rede |
| API | Playwright (`request`) | Rotas, autenticação, validação, erros, concorrência e privacidade, contra o servidor real |
| Interface | Playwright | Só os fluxos críticos |
| Acessibilidade | axe-core | Violações nas telas principais |
| Contrato | Bruno CLI | A API responde como o OpenAPI descreve |
| Segurança | Testes SEG-xx e `npm audit` | Controles do [modelo de ameaças](../../qualidade/seguranca.md) |
| Performance | Artillery | Carga e limite de requisições |
| Mutação | Stryker nos services | Os testes falham de verdade quando a regra quebra |
| Relatório | Allure, trace e screenshot | Resultado legível e diagnóstico de falhas |

### Playwright para a API, em vez de supertest

Escolhi o Playwright pela fidelidade, porque testo o servidor como ele roda, por HTTP, e por usar uma ferramenta só, com um único relatório. O custo é ser mais lento e compartilhar estado entre os testes. Para isolar:

- cada execução usa um arquivo de dados temporário (`DB_PATH`);
- cada teste usa sala e horário próprios e limpa o que criou pela API pública;
- não existe endpoint de reset;
- os testes de concorrência e de limite rodam isolados.

O supertest seria mais rápido e criaria um app novo por teste, mas executa dentro do processo e exigiria uma segunda ferramenta.

### Princípios

1. Determinismo: relógio injetado e nenhum `sleep`.
2. Os nomes descrevem comportamento.
3. Cada caso de aceite (CA-xx) aponta para o teste que o prova.
4. Testo o que dá errado antes do que dá certo: cada regra tem a borda dos dois lados.

## Consequências

- **Risco:** o limite de requisições (429) bloquearia os próprios testes. Os limites são configuráveis: altos nos testes normais, baixos e isolados nos testes do 429 ([ADR 0012](0012-limite-de-requisicoes.md)).
- **Risco:** teste de carga é lento e instável, então rodo o Artillery separado.
- **Escopo:** é maior que o do enunciado. O [backlog](../../produto/backlog.md) define as prioridades, e não corto os testes de regra, de acesso entre empresas e o README.
